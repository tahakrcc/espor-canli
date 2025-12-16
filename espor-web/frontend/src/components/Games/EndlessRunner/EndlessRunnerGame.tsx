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
  id: number;
}

export function EndlessRunnerGame({ onScoreUpdate, onGameEnd, onEliminated, roundId }: Props) {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Game constants
  const GRAVITY = 0.4;
  const JUMP_FORCE = -13;
  const MOVE_SPEED = 5;
  const GAME_WIDTH = Math.min(400, window.innerWidth);
  // Dynamic height for mobile fullscreen
  const [gameHeight, setGameHeight] = useState(window.innerHeight);
  const GAME_HEIGHT = gameHeight; // Alias for logic compatibility
  const PLAYER_SIZE = 40;
  const PLATFORM_WIDTH = 80;
  const PLATFORM_HEIGHT = 15;

  // Refs for physics
  const playerX = useRef(GAME_WIDTH / 2 - PLAYER_SIZE / 2);
  const playerY = useRef(GAME_HEIGHT - 150);
  const velocityY = useRef(0);
  const velocityX = useRef(0);
  const platforms = useRef<Platform[]>([]);
  const requestRef = useRef<number>();
  const scoreRef = useRef(0);
  const maxHeightRef = useRef(0);

  // Input handling
  const isMovingLeft = useRef(false);
  const isMovingRight = useRef(false);
  const touchStartX = useRef<number | null>(null);

  const devToolsDetector = useRef<DevToolsDetector | null>(null);
  const timeValidator = useRef<GameTimeValidator | null>(null);
  const { socket } = useSocket();

  // Visual state
  const [playerStyle, setPlayerStyle] = useState({ left: '0px', top: '0px' });
  const [platformElements, setPlatformElements] = useState<JSX.Element[]>([]);

  useEffect(() => {
    timeValidator.current = new GameTimeValidator((reason) => {
      socket?.emit('security:suspicious', { reason, timestamp: Date.now() });
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

  const initGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    scoreRef.current = 0;

    playerX.current = GAME_WIDTH / 2 - PLAYER_SIZE / 2;
    playerY.current = gameHeight - 150;
    velocityY.current = 0;
    velocityX.current = 0;
    maxHeightRef.current = 0;

    // Initial platforms
    platforms.current = [
      { x: GAME_WIDTH / 2 - PLATFORM_WIDTH / 2, y: gameHeight - 50, width: PLATFORM_WIDTH, id: 0 },
      { x: 100, y: gameHeight - 200, width: PLATFORM_WIDTH, id: 1 },
      { x: 250, y: gameHeight - 350, width: PLATFORM_WIDTH, id: 2 },
      { x: 50, y: gameHeight - 500, width: PLATFORM_WIDTH, id: 3 },
      { x: 200, y: gameHeight - 650, width: PLATFORM_WIDTH, id: 4 },
    ];

    timeValidator.current?.start();

    // Cancel any existing loop just in case
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(gameLoop);

    socket?.emit('game:start', { roundId, timestamp: Date.now() });
  };

  const endGame = () => {
    if (gameOver) return;
    setGameOver(true);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    const finalMetadata = {
      gameTime: timeValidator.current?.getElapsedTime() || 0,
      timestamp: Date.now()
    };
    onGameEnd(scoreRef.current, finalMetadata);
  };

  const gameLoop = () => {
    if (gameOver) return;

    // 1. Update Player Physics
    if (isMovingLeft.current) velocityX.current = -MOVE_SPEED;
    else if (isMovingRight.current) velocityX.current = MOVE_SPEED;
    else velocityX.current *= 0.8;

    playerX.current += velocityX.current;

    // Screen wrapping
    if (playerX.current < -PLAYER_SIZE / 2) playerX.current = GAME_WIDTH - PLAYER_SIZE / 2;
    if (playerX.current > GAME_WIDTH - PLAYER_SIZE / 2) playerX.current = -PLAYER_SIZE / 2;

    velocityY.current += GRAVITY;
    playerY.current += velocityY.current;

    // 2. Collision with Platforms (Only when falling)
    if (velocityY.current > 0) {
      platforms.current.forEach(p => {
        const pLeft = p.x;
        const pRight = p.x + p.width;
        const pTop = p.y;

        // Check overlap
        // Simple AABB collision check
        if (
          playerX.current + PLAYER_SIZE * 0.8 > pLeft &&
          playerX.current + PLAYER_SIZE * 0.2 < pRight &&
          playerY.current + PLAYER_SIZE >= pTop &&
          playerY.current + PLAYER_SIZE <= pTop + PLATFORM_HEIGHT + velocityY.current + 5
        ) {
          // Bounce!
          velocityY.current = JUMP_FORCE;
        }
      });
    }

    // 3. Camera Scrolling (Player goes high -> World moves down)
    const THRESHOLD = GAME_HEIGHT * 0.5;
    if (playerY.current < THRESHOLD) {
      const diff = THRESHOLD - playerY.current;
      playerY.current = THRESHOLD;

      // Move all platforms down
      platforms.current.forEach(p => {
        p.y += diff;
      });

      // Update score based on height climbed (cumulative)
      maxHeightRef.current += diff;
      const newScore = Math.floor(maxHeightRef.current / 10);
      if (newScore > scoreRef.current) {
        scoreRef.current = newScore;
        setScore(newScore);
        onScoreUpdate(newScore);
      }

      // Cleanup & Spawn
      platforms.current = platforms.current.filter(p => p.y < GAME_HEIGHT);

      while (platforms.current.length < 6) {
        let minY = GAME_HEIGHT;
        if (platforms.current.length > 0) {
          minY = Math.min(...platforms.current.map(p => p.y));
        }

        const newY = minY - (90 + Math.random() * 60); // Random gap
        const newX = Math.random() * (GAME_WIDTH - PLATFORM_WIDTH);
        platforms.current.push({
          x: newX,
          y: newY,
          width: PLATFORM_WIDTH,
          id: Date.now() + Math.random()
        });
      }
    }

    // 4. Game Over (Clean fall)
    if (playerY.current > GAME_HEIGHT) {
      endGame();
      // Ensure we stop checking collisions/rendering
      return;
    }

    // 5. Render Updates
    setPlayerStyle({
      left: `${playerX.current}px`,
      top: `${playerY.current}px`
    });

    setPlatformElements(
      platforms.current.map(p => (
        <div
          key={p.id}
          className="platform"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${p.width}px`,
            height: `${PLATFORM_HEIGHT}px`
          }}
        />
      ))
    );

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  // Input Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') isMovingLeft.current = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') isMovingRight.current = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') isMovingLeft.current = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') isMovingRight.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation(); // Prevent page scrolling
    if (!gameStarted) {
      initGame();
      return;
    }
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!touchStartX.current) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;

    if (diff > 10) {
      isMovingRight.current = true;
      isMovingLeft.current = false;
    } else if (diff < -10) {
      isMovingLeft.current = true;
      isMovingRight.current = false;
    } else {
      isMovingLeft.current = false;
      isMovingRight.current = false;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    isMovingLeft.current = false;
    isMovingRight.current = false;
    touchStartX.current = null;
  };

  const handleInteraction = (e: any) => {
    if (!gameStarted) initGame();
  };

  return (
    <div
      className="endless-runner-game vertical"
      onClick={handleInteraction}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="game-instructions">
        {!gameStarted && !gameOver && (
          <div className="start-screen">
            <h2>Doodle Jump Modu</h2>
            <p>Başlamak için dokunun.</p>
            <p style={{ fontSize: '14px' }}>Yön tuşları veya sürükleyerek karakteri yönetin.</p>
          </div>
        )}
        {gameOver && <p className="game-over">Oyun Bitti! Skor: {score}</p>}
      </div>

      <div className="game-area" style={{ height: gameHeight }}>
        <div className="runner" style={playerStyle}>🐸</div>
        {platformElements}
      </div>

      {gameStarted && <div className="score-display">Puan: {score}</div>}
    </div>
  );
}
