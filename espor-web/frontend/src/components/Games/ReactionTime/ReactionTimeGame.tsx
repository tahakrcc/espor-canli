import { useEffect, useState, useRef } from 'react';
import { DevToolsDetector } from '../../../utils/security/DevToolsDetector';
import { GameTimeValidator } from '../../../utils/security/GameTimeValidator';
import { useSocket } from '../../../hooks/useSocket';
import './ReactionTimeGame.css';

interface Props {
  onScoreUpdate: (score: number) => void;
  onGameEnd: (finalScore: number, metadata: any) => void;
  onEliminated: (finalScore: number, metadata: any) => void;
  roundId: string;
  userId: string;
}

interface Task {
  id: number;
  type: 'green' | 'red' | 'trick';
  color: string;
  text: string;
  correctAction: 'press' | 'dont_press';
  timestamp: number;
}

export function ReactionTimeGame({ onScoreUpdate, onGameEnd, onEliminated, roundId, userId }: Props) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); // 60 saniye
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const devToolsDetector = useRef<DevToolsDetector | null>(null);
  const timeValidator = useRef<GameTimeValidator | null>(null);
  const [suspiciousCount, setSuspiciousCount] = useState(0);
  const { socket } = useSocket();
  const gameStartTime = useRef<number>(0);
  const taskStartTime = useRef<number>(0);
  const taskIntervalRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    timeValidator.current = new GameTimeValidator((reason) => {
      handleSuspiciousActivity(reason);
    });
    timeValidator.current.start();

    devToolsDetector.current = new DevToolsDetector(() => {
      handleSuspiciousActivity('devtools_opened');
    });
    devToolsDetector.current.start();

    setGameStarted(true);
    gameStartTime.current = Date.now();
    timeValidator.current.start();

    // İlk görevi başlat
    generateNewTask();

    // Timer
    timerIntervalRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleGameEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      devToolsDetector.current?.stop();
      if (taskIntervalRef.current) {
        clearInterval(taskIntervalRef.current);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const handleSuspiciousActivity = (reason: string) => {
    setSuspiciousCount(prev => prev + 1);

    socket?.emit('security:suspicious', {
      reason,
      timestamp: Date.now()
    });

    if (suspiciousCount >= 2) {
      onEliminated(0, { reason: 'cheating_detected' });
    }
  };

  const generateNewTask = () => {
    const taskTypes: Array<'green' | 'red'> = ['green', 'red'];
    // %40 green (action), %60 red (trip) - or 50/50. Let's do 50/50.
    const randomType = taskTypes[Math.floor(Math.random() * taskTypes.length)];

    // Random texts to confuse user
    const texts = ['BAS', 'DUR', 'BEKLE', 'TIKLA', 'SAKIN', 'HADİ'];
    const randomText = texts[Math.floor(Math.random() * texts.length)];

    let color = '#4CAF50'; // Green
    let correctAction: 'press' | 'dont_press' = 'press';

    if (randomType === 'red') {
      color = '#F44336'; // Red
      correctAction = 'dont_press';
    }

    const task: Task = {
      id: Date.now(),
      type: randomType,
      color,
      text: randomText,
      correctAction,
      timestamp: Date.now()
    };

    setCurrentTask(task);
    taskStartTime.current = Date.now();

    // 2-4 saniye sonra yeni görev (hızlı olsun)
    const nextTaskDelay = 2000 + Math.random() * 2000;
    taskIntervalRef.current = window.setTimeout(() => {
      if (!gameOver) {
        generateNewTask();
      }
    }, nextTaskDelay);
  };

  const handleAnswer = (pressed: boolean) => {
    if (!currentTask || gameOver) return;

    // Only process "press" (click/space). We don't really detect "not pressing" actively unless timeout happens,
    // but here we just handle the click event.

    // Logic: If Red -> -50. If Green -> +30.
    if (currentTask.type === 'green') {
      // Correct Action
      const reactionTime = Date.now() - taskStartTime.current;
      setCorrectAnswers(prev => prev + 1);
      setReactionTimes(prev => [...prev, reactionTime]);

      // Fixed +30 points
      setScore(prev => prev + 30);
      onScoreUpdate(score + 30);

      // Immediate next task
      if (taskIntervalRef.current) clearTimeout(taskIntervalRef.current);
      generateNewTask();
    } else {
      // Wrong Action (Pressed Red)
      setWrongAnswers(prev => prev + 1);
      setScore(prev => Math.max(0, prev - 50));
      onScoreUpdate(Math.max(0, score - 50));

      // Shake effect or feedback could be nice, but simply next task for now
      if (taskIntervalRef.current) clearTimeout(taskIntervalRef.current);
      generateNewTask();
    }
  };

  const handleGameEnd = () => {
    if (gameOver) return;

    setGameOver(true);
    devToolsDetector.current?.stop();

    if (taskIntervalRef.current) {
      clearTimeout(taskIntervalRef.current);
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    const averageReactionTime = reactionTimes.length > 0
      ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
      : 0;

    const metadata = {
      gameType: 'reaction',
      correctAnswers,
      wrongAnswers,
      averageReactionTime,
      gameTime: timeValidator.current?.getElapsedTime() || 0,
      gameStartTime: gameStartTime.current,
      completedAt: Date.now()
    };

    onGameEnd(score, metadata);
  };

  // Klavye kontrolleri
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleAnswer(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentTask, gameStarted, gameOver]);

  // Periyodik skor güncelleme
  useEffect(() => {
    if (!socket || !roundId || !gameStarted || gameOver) return;

    const interval = setInterval(() => {
      const averageReactionTime = reactionTimes.length > 0
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
        : 0;

      socket.emit('score:update', {
        roundId,
        score,
        metadata: {
          gameType: 'reaction',
          correctAnswers,
          wrongAnswers,
          averageReactionTime,
          gameTime: timeValidator.current?.getElapsedTime() || 0
        }
      });
    }, 2000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, roundId, score, correctAnswers, wrongAnswers, reactionTimes, gameStarted, gameOver]);

  return (
    <div className="reaction-time-game">
      <div className="game-header">
        <div className="timer">Kalan Süre: {timeLeft}s</div>
        <div className="score">Skor: {score}</div>
        <div className="stats">
          Doğru: {correctAnswers} | Yanlış: {wrongAnswers}
        </div>
      </div>

      {currentTask && !gameOver && (
        <div
          className="task-display"
          style={{
            backgroundColor: 'transparent',
            borderColor: currentTask.color,
            borderWidth: '5px',
            borderStyle: 'solid',
            boxShadow: `0 0 20px ${currentTask.color}40` // Glow effect
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleAnswer(true);
          }}
          // prevent double tap zoom
          onTouchStart={(e) => {
            e.stopPropagation();
            // handleAnswer(true); 
          }}
        >
          <h1 style={{ color: currentTask.color }}>{currentTask.text}</h1>
          <p className="instruction" style={{ color: '#fff' }}>
            YEŞİLSE BAS, KIRMIZIYSA BASMA<br />
            (+30 Puan / -50 Puan)
          </p>
        </div>
      )}

      {gameOver && (
        <div className="game-over-screen">
          <h2>Oyun Bitti!</h2>
          <p>Toplam Skor: {score}</p>
          <p>Doğru: {correctAnswers} | Yanlış: {wrongAnswers}</p>
          {reactionTimes.length > 0 && (
            <p>
              Ortalama Tepki Süresi: {
                Math.round(
                  reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
                )
              }ms
            </p>
          )}
        </div>
      )}
    </div>
  );
}



