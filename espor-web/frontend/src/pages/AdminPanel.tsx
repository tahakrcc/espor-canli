import { useEffect, useState } from 'react';
import { VideoAdminPanel } from '../components/Admin/VideoAdminPanel';
import { useAdminSocket } from '../hooks/useAdminSocket';
import { useAuth } from '../context/AuthContext';
import { SecurityAlerts } from '../components/Admin/SecurityAlerts';
import { EventLeaderboard } from '../components/Leaderboard/EventLeaderboard';
import Logo from '../components/UI/Logo';
import api from '../services/api';
import './AdminPanel.css';

interface Event {
  id: string;
  name: string;
  status: string;
}

interface RoundPlayer {
  user_id: string;
  username: string;
  status: string;
  score: number;
}

export default function AdminPanel() {
  const { socket: adminSocket } = useAdminSocket();
  const { logout } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'games' | 'security' | 'leaderboard' | 'video'>('games');
  const [activeRound, setActiveRound] = useState<any>(null);
  const [roundPlayers, setRoundPlayers] = useState<RoundPlayer[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [newEventName, setNewEventName] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!adminSocket) return;

    adminSocket.on('admin:round:created', (round: any) => {
      setActiveRound(round);
    });

    adminSocket.on('admin:round:started', (data: any) => {
      setActiveRound((prev: any) => ({ ...prev, status: 'countdown' }));
    });

    adminSocket.on('admin:round:players', (data: any) => {
      setRoundPlayers(data.players);
    });

    adminSocket.on('admin:round:finished', () => {
      setActiveRound(null);
      setRoundPlayers([]);
    });

    return () => {
      adminSocket.off('admin:round:created');
      adminSocket.off('admin:round:started');
      adminSocket.off('admin:round:players');
      adminSocket.off('admin:round:finished');
    };
  }, [adminSocket]);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events/all');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEventName.trim()) {
      alert('Etkinlik adı gerekli');
      return;
    }

    try {
      await api.post('/events', { name: newEventName });
      setNewEventName('');
      fetchEvents();
      alert('Etkinlik oluşturuldu');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Etkinlik oluşturulamadı');
    }
  };

  const handleCreateRound = () => {
    if (!selectedEvent || !selectedGame) {
      alert('Etkinlik ve oyun seçin');
      return;
    }

    if (!adminSocket) return;
    adminSocket.emit('admin:round:create', {
      eventId: selectedEvent,
      gameType: selectedGame
    });
  };

  const handleStartRound = () => {
    if (!activeRound || !adminSocket) return;
    adminSocket.emit('admin:round:start', activeRound.id);
  };

  const handleFinishRound = () => {
    if (!activeRound || !adminSocket) return;
    adminSocket.emit('admin:round:finish', activeRound.id);
  };

  const handleGetPlayers = () => {
    if (!activeRound || !adminSocket) return;
    adminSocket.emit('admin:round:players', activeRound.id);
  };

  const handleGetLeaderboard = async () => {
    if (!selectedEvent) return;

    try {
      const response = await api.get(`/admin/leaderboard/${selectedEvent}`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="admin-header-left">
          <Logo size="small" showText={true} />
          <h1>Admin Panel</h1>
        </div>
        <button onClick={logout} className="logout-btn">Çıkış Yap</button>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === 'games' ? 'active' : ''}
          onClick={() => setActiveTab('games')}
        >
          Oyun Yönetimi
        </button>
        <button
          className={activeTab === 'security' ? 'active' : ''}
          onClick={() => setActiveTab('security')}
        >
          🔒 Güvenlik Uyarıları
        </button>
        <button
          className={activeTab === 'leaderboard' ? 'active' : ''}
          onClick={() => setActiveTab('leaderboard')}
        >
          Liderlik Tablosu
        </button>
        <button
          className={activeTab === 'video' ? 'active' : ''}
          onClick={() => setActiveTab('video')}
        >
          🎬 Meme Yarışması (Video)
        </button>
      </div>

      {activeTab === 'games' && (
        <div className="admin-content">
          <div className="admin-section">
            <h2>Etkinlik Oluştur</h2>
            <div className="form-group">
              <input
                type="text"
                placeholder="Etkinlik adı"
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
              />
              <button onClick={handleCreateEvent}>Etkinlik Oluştur</button>
            </div>
          </div>

          <div className="admin-section">
            <h2>Etkinlik Seç</h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="">Etkinlik Seçin</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.name} ({event.status})
                  </option>
                ))}
              </select>
              <button
                onClick={async () => {
                  if (!selectedEvent) return;
                  if (confirm('ALARM: Bu etkinliği bitirmek istediğine emin misin? Artık ulaşılamayacak.')) {
                    try {
                      await api.post(`/events/${selectedEvent}/finish`);
                      alert('Etkinlik kapatıldı.');
                      fetchEvents();
                      setSelectedEvent('');
                    } catch (e) {
                      console.error(e);
                      alert('Hata oluştu.');
                    }
                  }
                }}
                disabled={!selectedEvent}
                style={{ background: '#dc3545', color: 'white' }}
              >
                Etkinliği Bitir/Kapat
              </button>
            </div>
          </div>

          <div className="admin-section">
            <h2>Oyun Turu Oluştur</h2>
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
            >
              <option value="">Oyun Seçin</option>
              <option value="flybird">Fly Bird</option>
              <option value="endless">Endless Runner</option>
              <option value="reaction">Reaction Time</option>
              <option value="meme">Meme Yarışması (Video)</option>
            </select>
            <button
              onClick={handleCreateRound}
              disabled={!selectedEvent || !selectedGame}
              className="create-round-btn"
            >
              Tur Oluştur ve Onayla
            </button>
          </div>

          {activeRound && (
            <div className="admin-section">
              <h2>Aktif Tur: {activeRound.game_type}</h2>
              <p>Durum: {activeRound.status}</p>

              <div className="round-actions">
                <button
                  onClick={handleStartRound}
                  disabled={activeRound.status !== 'waiting'}
                >
                  Turu Başlat
                </button>

                <button onClick={handleGetPlayers}>
                  Oyunda Olanları Görüntüle
                </button>

                <button
                  onClick={handleFinishRound}
                  disabled={activeRound.status !== 'playing'}
                >
                  Turu Bitir ve Skorları İşle
                </button>
              </div>

              {roundPlayers.length > 0 && (
                <div className="round-players">
                  <h3>Oyunda Olanlar ({roundPlayers.filter(p => p.status === 'playing').length}/{roundPlayers.length})</h3>
                  <ul>
                    {roundPlayers.map(player => (
                      <li key={player.user_id}>
                        {player.username} - {player.status} - Skor: {player.score}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'security' && (
        <div className="admin-content">
          <SecurityAlerts />
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="admin-content">
          <div className="admin-section">
            <h2>Liderlik Tablosu</h2>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
            >
              <option value="">Etkinlik Seçin</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
            <button
              onClick={handleGetLeaderboard}
              disabled={!selectedEvent}
              className="fetch-leaderboard-btn"
            >
              Liderlik Tablosunu Getir
            </button>

            {leaderboard.length > 0 && (
              <EventLeaderboard leaderboard={leaderboard} />
            )}
          </div>
        </div>
      )}

      {activeTab === 'video' && (
        <div className="admin-content">
          <VideoAdminPanel />
        </div>
      )}
    </div>
  );
}

