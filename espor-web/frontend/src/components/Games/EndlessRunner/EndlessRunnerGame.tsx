import { useEffect, useState, useRef } from 'react';
import { DevToolsDetector } from '../../../utils/security/DevToolsDetector';
import { GameTimeValidator } from '../../../utils/security/GameTimeValidator';
import { useSocket } from '../../../hooks/useSocket';
import './EndlessRunnerGame.css';

interface Props {
  onScoreUpdate: (score: number) => void;
  onGameEnd: (finalScore: number, metadata: any) => void;
  onEliminated: (finalScore: number, metadata: any) => void;
  roundId: string;
  userId: string;
}

interface Platform {
  x: number;
  y: number;
  width: number;
}

export function EndlessRunnerGame({ onScoreUpdate, onGameEnd, onEliminated, roundId }: Props) {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [runnerY, setRunnerY] = useState(400);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [cameraY, setCameraY] = useState(0);

  const GRAVITY = 0.5;
  const JUMP_STRENGTH = -12;
  const PLATFORM_WIDTH = 80;
  const PLATFORM_HEIGHT = 20;
  const RUNNER_SIZE = 40;
  const GAME_HEIGHT = 600;

  const requestRef = useRef<number>();
  const devToolsDetector = useRef<DevToolsDetector | null>(null);
  const timeValidator = useRef<GameTimeValidator | null>(null);
  const { socket } = useSocket();
  const runnerX = useRef(200);
  const runnerVelocity = useRef(0);
  const highestY = useRef(0);

  useEffect(() => {
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

    // Initial platforms
    const initialPlatforms: Platform[] = [];
    for (let i = 0; i < 10; i++) {
      initialPlatforms.push({
        x: Math.random() * 300,
        y: GAME_HEIGHT - (i * 100),
        width: PLATFORM_WIDTH
      });
    }
    setPlatforms(initialPlatforms);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      devToolsDetector.current?.stop();
    };
  }, []);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setRunnerY(400);
    runnerVelocity.current = 0;
    setCameraY(0);
    highestY.current = 0;
    runnerX.current = 200;
    timeValidator.current?.start();
    requestRef.current = requestAnimationFrame(gameLoop);
    socket?.emit('game:start', { roundId, timestamp: Date.now() });
  };

  const jump = () => {
    if (!gameStarted) {
      startGame();
    } else if (!gameOver) {
      runnerVelocity.current = JUMP_STRENGTH;
    }
  };

  const endGame = () => {
    if (gameOver) return;
    setGameOver(true);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    const finalMetadata = {
      gameTime: timeValidator.current?.getElapsedTime() || 0,
      highestY: highestY.current,
      timestamp: Date.now()
    };

    onGameEnd(score, finalMetadata);
  };

  const gameLoop = () => {
    if (gameOver) return;

    // Apply gravity
    runnerVelocity.current += GRAVITY;
    
    setRunnerY(prev => {
      const newY = prev + runnerVelocity.current;
      let finalY = newY;
      
      // Check platform collisions - use current platforms state
      platforms.forEach(platform => {
        const platformScreenY = platform.y - cameraY;
        if (
          runnerX.current + RUNNER_SIZE > platform.x &&
          runnerX.current < platform.x + platform.width &&
          newY + RUNNER_SIZE > platformScreenY &&
          newY + RUNNER_SIZE < platformScreenY + PLATFORM_HEIGHT &&
          runnerVelocity.current > 0
        ) {
          runnerVelocity.current = 0;
          finalY = platformScreenY - RUNNER_SIZE;
        }
      });

      // Fall off screen
      if (finalY > GAME_HEIGHT) {
        endGame();
        return prev;
      }

      // Update camera and score
      if (finalY < cameraY + 200) {
        const cameraDiff = (cameraY + 200) - finalY;
        setCameraY(prev => {
          const newCameraY = prev - cameraDiff;
          const newScore = Math.floor(Math.max(0, -newCameraY) / 10);
          if (newScore > score) {
            setScore(newScore);
            onScoreUpdate(newScore);
          }
          return newCameraY;
        });
      }

      // Track highest point
      const currentHeight = -cameraY + (GAME_HEIGHT - finalY);
      if (currentHeight > highestY.current) {
        highestY.current = currentHeight;
      }

      return finalY;
    });

    // Generate new platforms
    setPlatforms(prev => {
      const newPlatforms = [...prev];
      const lowestPlatformY = Math.min(...newPlatforms.map(p => p.y));
      
      if (lowestPlatformY > cameraY - 200) {
        for (let i = 0; i < 3; i++) {
          newPlatforms.push({
            x: Math.random() * 300,
            y: lowestPlatformY - 100 - (i * 100),
            width: PLATFORM_WIDTH
          });
        }
      }

      // Remove platforms below screen
      return newPlatforms.filter(p => p.y > cameraY - 400);
    });

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  // Interaction handlers
  const handleInteraction = (e: any) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    jump();
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        runnerX.current = Math.max(0, runnerX.current - 10);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        runnerX.current = Math.min(300, runnerX.current + 10);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameStarted, gameOver]);

  return (
    <div
      className="endless-runner-game vertical"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
    >
      <div className="game-instructions">
        {!gameStarted && !gameOver && (
          <div className="start-screen">
            <h2>Endless Runner</h2>
            <p>Başlamak için dokunun veya SPACE tuşuna basın</p>
            <p>Sol/Sağ ok tuşları ile hareket edin</p>
          </div>
        )}
        {gameOver && <div className="game-over">Oyun Bitti! Skor: {score}</div>}
      </div>

      <div className="game-area" style={{ height: GAME_HEIGHT }}>
        {/* Platforms */}
        {platforms.map((platform, i) => {
          const screenY = platform.y - cameraY;
          if (screenY < -50 || screenY > GAME_HEIGHT + 50) return null;
          
          return (
            <div
              key={`platform-${i}`}
              className="platform"
              style={{
                left: platform.x,
                top: screenY,
                width: platform.width,
                height: PLATFORM_HEIGHT
              }}
            />
          );
        })}

        {/* Runner */}
        <div
          className="runner"
          style={{
            left: runnerX.current,
            top: runnerY,
            transform: `rotate(${runnerVelocity.current > 0 ? 15 : -15}deg)`
          }}
        >
          🏃
        </div>
      </div>

      {gameStarted && <div className="score-display">Skor: {score}</div>}
    </div>
  );
}
