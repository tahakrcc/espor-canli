import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { CountdownTimer } from '../components/Countdown/CountdownTimer';
import './WaitingRoom.css';

export default function WaitingRoom() {
  const { eventId, roundId } = useParams<{ eventId: string; roundId: string }>();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const [waitingCount, setWaitingCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!socket || !roundId || !connected) return;

    // Bekleme ekranına katıl
    socket.emit('round:waiting', roundId);

    // Bekleyen sayısı güncellendi
    socket.on('round:waiting:count', (count: number) => {
      setWaitingCount(count);
    });

    socket.on('round:waiting:update', (data: { waitingCount: number; totalPlayers: number }) => {
      setWaitingCount(data.waitingCount);
      setTotalPlayers(data.totalPlayers);
    });

    // Countdown başladı
    socket.on('round:countdown', (data: { countdown: number }) => {
      setCountdown(data.countdown);
    });

    // Oyun başladı
    socket.on('round:start', ({ roundId }: { roundId: string }) => {
      navigate(`/game/${roundId}`);
    });

    return () => {
      socket.off('round:waiting:count');
      socket.off('round:waiting:update');
      socket.off('round:countdown');
      socket.off('round:start');
    };
  }, [socket, roundId, connected, navigate]);

  if (!connected) {
    return <div className="loading">Bağlanılıyor...</div>;
  }

  return (
    <div className="waiting-room">
      <div className="waiting-content">
        <h1>Oyun Başlıyor...</h1>
        
        {countdown !== null ? (
          <div>
            <CountdownTimer countdown={countdown} />
          </div>
        ) : (
          <div className="waiting-info">
            <div className="waiting-icon">⏳</div>
            <p className="waiting-text">Bekleyen oyuncu sayısı: {waitingCount}</p>
            <p className="waiting-subtext">Toplam: {totalPlayers} oyuncu</p>
            <p className="waiting-hint">Lütfen bekleyin, oyun yakında başlayacak...</p>
          </div>
        )}
      </div>
    </div>
  );
}

