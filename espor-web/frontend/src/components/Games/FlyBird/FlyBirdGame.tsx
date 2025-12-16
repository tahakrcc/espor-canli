import { useEffect, useState, useRef } from 'react';
import { DevToolsDetector } from '../../../utils/security/DevToolsDetector';
import { GameTimeValidator } from '../../../utils/security/GameTimeValidator';
import { useSocket } from '../../../hooks/useSocket';
import './FlyBirdGame.css';

interface Props {
  onScoreUpdate: (score: number) => void;
  onGameEnd: (finalScore: number, metadata: any) => void;
  onEliminated: (finalScore: number, metadata: any) => void;
  roundId: string;
  userId: string;
}

interface GameEvent {
  type: string;
  timestamp: number;
  obstacleCount?: number;
  gameTime?: number;
}

export function FlyBirdGame({ onScoreUpdate, onGameEnd, onEliminated, roundId }: Props) {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Game constants
  // Game constants - adjusted for EASIEST gameplay (Moon Gravity)
  const GRAVITY = 0.15; // Extremely floaty
  const JUMP_STRENGTH = -4; // Gentle nudge

  const BASE_SPEED = 2; // Starting speed
  const MAX_SPEED = 8; // Maximum speed limit
  const OBSTACLE_SPAWN_RATE_BASE = 2800; // Base spawn rate
  const [gameHeight, setGameHeight] = useState(window.innerHeight > 600 ? 500 : window.innerHeight - 100);
  const BIRD_SIZE = 24; // Smaller bird hitbox

  // Refs
  const birdY = useRef(gameHeight / 2);
  const birdVelocity = useRef(0);
  const obstacles = useRef<{ x: number; gapTop: number; gapHeight: number; passed: boolean }[]>([]);
  const requestRef = useRef<number>();
  const lastSpawnTime = useRef<number>(0);
  const devToolsDetector = useRef<DevToolsDetector | null>(null);
  const timeValidator = useRef<GameTimeValidator | null>(null);
  const { socket } = useSocket();

  // Visual state
  const [birdStyle, setBirdStyle] = useState({ top: `${gameHeight / 2}px`, transform: 'rotate(0deg)' });
  const [obstacleElements, setObstacleElements] = useState<JSX.Element[]>([]);

  // Update height on resize
  useEffect(() => {
    const handleResize = () => {
      // Mobile full screen adjustment
      const newHeight = window.innerWidth <= 768 ? window.innerHeight : 500;
      setGameHeight(newHeight);
    };

    handleResize(); // Initial call
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Security setup
    timeValidator.current = new GameTimeValidator((reason) => {
      socket?.emit('security:suspicious', { reason, timestamp: Date.now() });
      if (reason === 'time_anomaly') {
        onEliminated(score, { reason });
      }
    });

    devToolsDetector.current = new DevToolsDetector(() => {
      socket?.emit('security:suspicious', { reason: 'devtools', timestamp: Date.now() });
    });

    devToolsDetector.current.start();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      devToolsDetector.current?.stop();
    };
  }, []);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    birdY.current = gameHeight / 2;
    birdVelocity.current = 0;
    obstacles.current = [];
    lastSpawnTime.current = Date.now();
    timeValidator.current?.start();

    spawnObstacle();
    requestRef.current = requestAnimationFrame(gameLoop);
    socket?.emit('game:start', { roundId, timestamp: Date.now() });
  };

  const spawnObstacle = () => {
    const minGap = 200; // Huge gap
    const maxGap = 260; // Very huge gap
    const gapHeight = Math.floor(Math.random() * (maxGap - minGap + 1)) + minGap;
    const minTop = 50;
    const maxTop = gameHeight - gapHeight - 50;
    const gapTop = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;

    obstacles.current.push({
      x: window.innerWidth > 800 ? 800 : window.innerWidth,
      gapTop,
      gapHeight,
      passed: false
    });
  };

  const jump = () => {
    if (!gameStarted) {
      startGame();
    } else if (!gameOver) {
      birdVelocity.current = JUMP_STRENGTH;
    }
  };

  const endGame = () => {
    if (gameOver) return;
    setGameOver(true);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    const finalMetadata = {
      gameTime: timeValidator.current?.getElapsedTime() || 0,
      timestamp: Date.now()
    };

    onGameEnd(score, finalMetadata);
  };

  const gameLoop = () => {
    if (gameOver) return;

    birdVelocity.current += GRAVITY;
    birdY.current += birdVelocity.current;

    if (birdY.current > gameHeight - BIRD_SIZE || birdY.current < 0) {
      endGame();
      return;
    }

    // Calculate speed based on score
    const currentSpeed = Math.min(BASE_SPEED + (score * 0.1), MAX_SPEED);
    const currentSpawnRate = Math.max(1000, OBSTACLE_SPAWN_RATE_BASE - (score * 50));

    if (Date.now() - lastSpawnTime.current > currentSpawnRate) {
      spawnObstacle();
      lastSpawnTime.current = Date.now();
    }

    obstacles.current.forEach((obs) => {
      obs.x -= currentSpeed;

      const birdLeft = 50;
      const birdRight = 50 + BIRD_SIZE;
      const obsLeft = obs.x;
      const obsRight = obs.x + 50;

      if (birdRight > obsLeft && birdLeft < obsRight) {
        if (birdY.current < obs.gapTop || birdY.current + BIRD_SIZE > obs.gapTop + obs.gapHeight) {
          endGame();
          return;
        }
      }

      if (!obs.passed && birdLeft > obsRight) {
        obs.passed = true;
        setScore(curr => {
          const newScore = curr + 1;
          onScoreUpdate(newScore);
          return newScore;
        });
      }
    });

    obstacles.current = obstacles.current.filter(obs => obs.x > -100);

    setBirdStyle({
      top: `${birdY.current}px`,
      transform: `rotate(${Math.min(Math.max(birdVelocity.current * 3, -25), 25)}deg)`
    });

    setObstacleElements(
      obstacles.current.map((obs, i) => (
        <div key={`obs-${i}`}>
          <div className="obstacle top" style={{ left: obs.x, height: obs.gapTop, top: 0 }} />
          <div className="obstacle bottom" style={{ left: obs.x, height: gameHeight - obs.gapTop - obs.gapHeight, top: obs.gapTop + obs.gapHeight }} />
        </div>
      ))
    );

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  // Interaction handlers
  const handleInteraction = (e: any) => {
    // Only prevent default if event is cancelable (fix for passive listener error)
    if (e.cancelable) {
      e.preventDefault();
    }
    jump();
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameStarted, gameOver]);

  return (
    <div
      className="flybird-game"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
    >
      <div className="game-instructions">
        {!gameStarted && !gameOver && (
          <div className="start-screen">
            <h2>Fly Bird</h2>
            <p>Başlamak için dokunun veya SPACE tuşuna basın</p>
          </div>
        )}
        {gameOver && <p className="game-over">Oyun Bitti! Skor: {score}</p>}
      </div>

      <div className="game-area" style={{ height: gameHeight }}>
        <div className="bird" style={birdStyle}>🐦</div>
        {obstacleElements}
      </div>

      {gameStarted && <div className="score-display">Skor: {score}</div>}
    </div>
  );
}
