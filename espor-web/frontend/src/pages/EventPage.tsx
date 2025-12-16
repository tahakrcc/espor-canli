
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';

import { useAuth } from '../context/AuthContext';
import { EventLeaderboard } from '../components/Leaderboard/EventLeaderboard';
import { ParticipantsList } from '../components/Participants/ParticipantsList';
import { ConfirmationModal } from '../components/UI/ConfirmationModal';
import api from '../services/api';
import './EventPage.css';

interface Participant {
  id: string;
  username: string;
  joined_at: string;
}

interface LeaderboardEntry {
  id: string;
  username: string;
  total_score: number;
  rounds_played: number;
  isPlaying?: boolean;
  currentScore?: number;
}

export default function EventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<{ rank: number | null; score: number; totalPlayers: number } | null>(null);

  const [eventName, setEventName] = useState('');
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleLeaveEvent = async () => {
    if (!eventId) {
      console.error('Event ID is missing');
      alert('Etkinlik ID bulunamadı.');
      setIsLeaveModalOpen(false);
      return;
    }

    try {
      // API call to leave (this removes from database)
      await api.post(`/events/${eventId}/leave`);

      // Emit socket event to notify others immediately (if socket is connected)
      if (socket && connected) {
        try {
          socket.emit('event:leave', eventId);
        } catch (socketError) {
          console.warn('Socket emit failed, but API call succeeded:', socketError);
          // Continue anyway - API call succeeded
        }
      }

      // Navigate back to event list
      navigate('/events');
    } catch (error: any) {
      console.error('Error leaving event:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Bilinmeyen bir hata oluştu';
      alert(`Etkinlikten ayrılırken hata oluştu: ${errorMessage}`);
    } finally {
      setIsLeaveModalOpen(false);
    }
  };

  useEffect(() => {
    if (!eventId || !user) return;

    // Event bilgilerini getir
    api.get(`/events/${eventId}`)
      .then(res => {
        setEventName(res.data.event.name);
        setParticipants(res.data.participants);
        setLeaderboard(res.data.leaderboard);

        // Auto-redirect if there is an active round
        const activeRound = res.data.activeRound;
        if (activeRound) {
          if (activeRound.status === 'waiting') {
            navigate(`/event/${eventId}/waiting/${activeRound.id}`);
          } else if (activeRound.status === 'playing') {
            navigate(`/game/${activeRound.id}`);
          }
        }

        // Check if user is already a participant
        const userIsParticipant = res.data.participants.some((p: Participant) => p.id === user.id);
        setIsParticipant(userIsParticipant);
      })
      .catch(err => console.error('Error fetching event:', err));
  }, [eventId, user]);

  const handleJoinEvent = async () => {
    if (!eventId || !socket || !connected || isJoining) return;

    setIsJoining(true);
    try {
      // API call to join
      await api.post(`/events/${eventId}/join`);

      // Socket join
      socket.emit('event:join', eventId);
      socket.emit('leaderboard:subscribe', eventId);

      setIsParticipant(true);

      // Refresh event data
      const res = await api.get(`/events/${eventId}`);
      setParticipants(res.data.participants);
      setLeaderboard(res.data.leaderboard);
    } catch (error: any) {
      console.error('Error joining event:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Etkinliğe katılırken hata oluştu';
      alert(errorMessage);
    } finally {
      setIsJoining(false);
    }
  };

  useEffect(() => {
    if (!socket || !eventId || !connected) return;

    // Only auto-join if user is already a participant
    if (isParticipant) {
      socket.emit('event:join', eventId);
      socket.emit('leaderboard:subscribe', eventId);
    } else {
      // Just subscribe to leaderboard updates (read-only)
      socket.emit('leaderboard:subscribe', eventId);
    }

    // Event detayları
    socket.on('event:details', (data: any) => {
      setParticipants(data.participants);
      setLeaderboard(data.leaderboard);
    });

    // Katılımcılar güncellendi
    socket.on('event:participants', (data: Participant[]) => {
      setParticipants(data);
    });

    // Liderlik tablosu güncellendi
    socket.on('leaderboard:update', (data: LeaderboardEntry[]) => {
      setLeaderboard(data);

      // Kullanıcının sırasını bul
      if (user?.id) {
        const liveEntry = data.find(entry => entry.id === user.id);
        if (liveEntry) {
          const rank = data.findIndex(entry => entry.id === user.id) + 1;
          setUserRank({
            rank,
            score: liveEntry.total_score,
            totalPlayers: data.length
          });
        }
      }
    });

    // Oyun turu oluşturuldu
    socket.on('round:created', (round: any) => {
      navigate(`/event/${eventId}/waiting/${round.roundId}`);
    });

    // Round bitti
    socket.on('round:finished', () => {
      // Liderlik tablosunu yenile
      socket.emit('event:get', eventId);
    });

    // Diskalifiye edildi
    socket.on('user:disqualified', () => {
      alert('Hesabınız diskalifiye edildi');
      navigate('/login');
    });

    return () => {
      socket.off('event:details');
      socket.off('event:participants');
      socket.off('leaderboard:update');
      socket.off('round:created');
      socket.off('round:finished');
      socket.off('user:disqualified');
    };
  }, [socket, eventId, connected, navigate, user, isParticipant]);

  if (!connected) {
    return <div className="loading">Bağlanılıyor...</div>;
  }

  return (
    <div className="event-page">
      <div className="event-header">
        <div className="header-left">
          <h1>{eventName || 'Etkinlik'}</h1>
          {isParticipant ? (
            <button className="leave-btn" onClick={() => setIsLeaveModalOpen(true)}>
              Etkinlikten Ayrıl
            </button>
          ) : (
            <button
              className="join-btn"
              onClick={handleJoinEvent}
              disabled={isJoining}
            >
              {isJoining ? 'Katılıyor...' : 'Etkinliğe Katıl'}
            </button>
          )}
        </div>
        {userRank && (
          <div className="user-rank">
            Şu an {userRank.rank}/{userRank.totalPlayers} - Puan: {userRank.score}
          </div>
        )}
      </div>

      <div className="event-content">
        <div className="event-main">
          <EventLeaderboard
            leaderboard={leaderboard}
            showPlayingStatus={true}
          />
        </div>

        <div className="event-sidebar">
          <ParticipantsList participants={participants} />
        </div>
      </div>

      <ConfirmationModal
        isOpen={isLeaveModalOpen}
        title="Etkinlikten Ayrıl"
        message="Etkinlikten ayrılmak istediğinize emin misiniz? Mevcut puan durumunuz ve sıralamanız sıfırlanabilir."
        onConfirm={handleLeaveEvent}
        onCancel={() => setIsLeaveModalOpen(false)}
        confirmText="Ayrıl"
        type="danger"
      />
    </div>
  );
}
