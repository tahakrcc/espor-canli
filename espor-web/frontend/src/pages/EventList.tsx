import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './EventList.css';

interface Event {
    id: string;
    name: string;
    status: string;
    active_user_count: number;
}

export default function EventList() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await api.get('/events');
            setEvents(response.data);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinEvent = (eventId: string) => {
        navigate(`/event/${eventId}`);
    };

    return (
        <div className="event-list-page">
            <div className="event-list-header">
                <div className="header-left">
                    <h1>Etkinlikler</h1>
                    <p>Katılabileceğiniz aktif etkinlikler</p>
                </div>
                <div className="header-right">
                    <span className="username">Merhaba, {user?.username}</span>
                    <button onClick={logout} className="logout-btn">Çıkış</button>
                </div>
            </div>

            <div className="event-list-content">
                {loading ? (
                    <div className="loading">Yükleniyor...</div>
                ) : events.length === 0 ? (
                    <div className="no-events">
                        <p>Şu an aktif bir etkinlik bulunmuyor.</p>
                    </div>
                ) : (
                    <div className="events-grid">
                        {events.map(event => (
                            <div key={event.id} className="event-card">
                                <div className="event-card-header">
                                    <h3>{event.name}</h3>
                                    <span className={`status-badge ${event.status}`}>{event.status}</span>
                                </div>
                                <div className="event-card-body">
                                    <div className="event-stat">
                                        <span className="label">Katılımcı:</span>
                                        <span className="value">{event.active_user_count || 0}</span>
                                    </div>
                                </div>
                                <div className="event-card-footer">
                                    <button onClick={() => handleJoinEvent(event.id)}>Katıl</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
