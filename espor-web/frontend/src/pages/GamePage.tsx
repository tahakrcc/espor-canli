import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { FlyBirdGame } from '../components/Games/FlyBird/FlyBirdGame';
import { EndlessRunnerGame } from '../components/Games/EndlessRunner/EndlessRunnerGame';
import { ReactionTimeGame } from '../components/Games/ReactionTime/ReactionTimeGame';
import SyncedVideoPlayer from '../components/Video/SyncedVideoPlayer';
import api from '../services/api';
import './GamePage.css';

export default function GamePage() {
  const { roundId } = useParams<{ roundId: string }>();
  const navigate = useNavigate();
  const { socket, userId } = useSocket();
  const [score, setScore] = useState(0);
  const [gameType, setGameType] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!socket || !roundId) return;

    socket.emit('round:started', roundId);
    socket.emit('game:start', { roundId, timestamp: Date.now() });

    // Round bilgilerini al
    api.get(`/admin/round/${roundId}`)
      .then((response: any) => {
        setGameType(response.data.game_type);
        setEventId(response.data.event_id);
      })
      .catch((error) => {
        console.error('Error fetching round info:', error);
        // Fallback: varsayılan olarak flybird
        setGameType('flybird');
      });

    // Oyun bitti veya elendin
    socket.on('round:eliminated', ({ eventId: targetEventId }: { eventId: string }) => {
      if (!isRedirecting) {
        navigate(`/event/${targetEventId}`);
      }
    });

    socket.on('round:finished', ({ eventId: targetEventId }: { eventId: string }) => {
      if (!isRedirecting) {
        navigate(`/event/${targetEventId}`);
      }
    });

    socket.on('game:error', ({ message }: { message: string }) => {
      // alert(message); // User validation errors might happen, but let's just redirect
      console.error(message);
      // If error occurs, still try to redirect after delay
      if (!isRedirecting && eventId) {
        setIsRedirecting(true);
        setTimeout(() => navigate(`/event/${eventId}`), 3000);
      }
    });

    return () => {
      socket.off('round:eliminated');
      socket.off('round:finished');
      socket.off('game:error');
    };
  }, [socket, roundId, navigate, eventId, isRedirecting]);

  // Periyodik skor güncelleme
  useEffect(() => {
    if (!socket || !roundId || score === 0 || !gameType) return;

    const interval = setInterval(() => {
      socket.emit('score:update', {
        roundId,
        score,
        metadata: {
          gameType,
          timestamp: Date.now()
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [socket, roundId, score, gameType]);

  const handleGameEnd = (finalScore: number, metadata: any) => {
    if (!socket || !roundId) return;

    socket.emit('player:finished', {
      roundId,
      finalScore,
      metadata: {
        ...metadata,
        gameType: gameType || 'flybird'
      }
    });

    // Auto redirect logic with delay
    if (eventId && !isRedirecting) {
      setIsRedirecting(true);
      // Wait 2 seconds to let the user see the Game Over screen
      setTimeout(() => {
        navigate(`/event/${eventId}`);
      }, 2000);
    }
  };

  const handleEliminated = (finalScore: number, metadata: any) => {
    if (!socket || !roundId) return;

    socket.emit('player:eliminated', {
      roundId,
      finalScore,
      metadata: {
        ...metadata,
        gameType: gameType || 'flybird'
      }
    });

    // Auto redirect logic with delay
    if (eventId && !isRedirecting) {
      setIsRedirecting(true);
      setTimeout(() => {
        navigate(`/event/${eventId}`);
      }, 2000);
    }
  };

  if (!gameType) {
    return (
      <div className="game-page">
        <div className="loading">Oyun yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="game-page">
      {/* Hide global header for immersive games, they have their own UI */}
      {!['flybird', 'endless', 'runner', 'meme'].includes(gameType || '') && (
        <div className="game-header">
          <div className="game-score">Skor: {score}</div>
        </div>
      )}

      {isRedirecting && (
        <div className="redirect-overlay">
          <div className="redirect-content">
            <h2>Oyun Bitti!</h2>
            <div className="spinner"></div>
            <p style={{ marginTop: '20px' }}>Yönlendiriliyorsunuz...</p>
          </div>
        </div>
      )}

      <div className="game-container">
        {gameType === 'flybird' && (
          <FlyBirdGame
            onScoreUpdate={setScore}
            onGameEnd={handleGameEnd}
            onEliminated={handleEliminated}
            roundId={roundId || ''}
            userId={userId || ''}
          />
        )}
        {gameType === 'endless' && (
          <EndlessRunnerGame
            onScoreUpdate={setScore}
            onGameEnd={handleGameEnd}
            onEliminated={handleEliminated}
            roundId={roundId || ''}
            userId={userId || ''}
          />
        )}
        {gameType === 'reaction' && (
          <ReactionTimeGame
            onScoreUpdate={setScore}
            onGameEnd={handleGameEnd}
            onEliminated={handleEliminated}
            roundId={roundId || ''}
            userId={userId || ''}
          />
        )}
        {gameType === 'meme' && (
          <SyncedVideoPlayer />
        )}
      </div>
    </div>
  );
}

