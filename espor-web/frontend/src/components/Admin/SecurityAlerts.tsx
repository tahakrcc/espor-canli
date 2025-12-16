import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import './SecurityAlerts.css';

interface SecurityAlert {
  id: string;
  user_id: string;
  username: string;
  event_id: string;
  event_name: string;
  activity_count: number;
  activities: Array<{
    id: string;
    reason: string;
    severity: string;
    details: any;
    created_at: string;
  }>;
  created_at: string;
}

export function SecurityAlerts() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [dismissNotes, setDismissNotes] = useState('');
  const [disqualifyReason, setDisqualifyReason] = useState('');
  const [disqualifyNotes, setDisqualifyNotes] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Admin namespace'e bağlan
    const adminSocket = io('http://localhost:3001/admin', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    // Güvenlik uyarılarına subscribe ol
    adminSocket.emit('admin:security:subscribe');
    adminSocket.emit('admin:security:alerts:get', {});

    // Uyarılar geldi
    adminSocket.on('admin:security:alerts', (data: SecurityAlert[]) => {
      setAlerts(data);
    });

    // Yeni uyarı geldi
    adminSocket.on('security:alert', () => {
      adminSocket.emit('admin:security:alerts:get', {});
    });

    // Uyarı çözüldü
    adminSocket.on('admin:security:alert:resolved', () => {
      adminSocket.emit('admin:security:alerts:get', {});
    });

    return () => {
      adminSocket.off('admin:security:alerts');
      adminSocket.off('security:alert');
      adminSocket.off('admin:security:alert:resolved');
      adminSocket.disconnect();
    };
  }, []);

  const handleDismiss = (alertId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const adminSocket = io('http://localhost:3001/admin', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    adminSocket.on('connect', () => {
      adminSocket.emit('admin:security:alert:dismiss', {
        alertId,
        notes: dismissNotes || null
      });
      adminSocket.disconnect();
    });

    setSelectedAlert(null);
    setDismissNotes('');
  };

  const handleDisqualify = (alertId: string) => {
    if (!disqualifyReason.trim()) {
      alert('Lütfen diskalifiye nedeni girin');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const adminSocket = io('http://localhost:3001/admin', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    adminSocket.on('connect', () => {
      adminSocket.emit('admin:security:alert:disqualify', {
        alertId,
        reason: disqualifyReason,
        notes: disqualifyNotes || null
      });
      adminSocket.disconnect();
    });

    setSelectedAlert(null);
    setDisqualifyReason('');
    setDisqualifyNotes('');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      default: return 'gray';
    }
  };

  return (
    <div className="security-alerts">
      <h2>🔒 Güvenlik Uyarıları</h2>
      
      {alerts.length === 0 ? (
        <p className="no-alerts">Bekleyen uyarı yok</p>
      ) : (
        <div className="alerts-list">
          {alerts.map(alert => (
            <div 
              key={alert.id} 
              className={`alert-card ${selectedAlert?.id === alert.id ? 'selected' : ''}`}
              onClick={() => setSelectedAlert(alert)}
            >
              <div className="alert-header">
                <span className="alert-badge">{alert.activity_count} Şüpheli Aktivite</span>
                <span className="alert-time">
                  {new Date(alert.created_at).toLocaleString('tr-TR')}
                </span>
              </div>
              
              <div className="alert-user">
                <strong>Kullanıcı:</strong> {alert.username}
              </div>
              
              <div className="alert-event">
                <strong>Etkinlik:</strong> {alert.event_name}
              </div>

              {selectedAlert?.id === alert.id && (
                <div className="alert-details">
                  <h4>Şüpheli Aktiviteler:</h4>
                  <ul>
                    {alert.activities.map((activity, idx) => (
                      <li key={activity.id || idx}>
                        <span className={`severity-badge ${getSeverityColor(activity.severity)}`}>
                          {activity.severity}
                        </span>
                        <strong>{activity.reason}</strong>
                        <span className="activity-time">
                          {new Date(activity.created_at).toLocaleString('tr-TR')}
                        </span>
                        {activity.details && (
                          <details>
                            <summary>Detaylar</summary>
                            <pre>{JSON.stringify(activity.details, null, 2)}</pre>
                          </details>
                        )}
                      </li>
                    ))}
                  </ul>

                  <div className="alert-actions">
                    <div className="action-section">
                      <h4>✅ Sorun Yok (Dismiss)</h4>
                      <textarea
                        placeholder="Notlar (opsiyonel)"
                        value={dismissNotes}
                        onChange={(e) => setDismissNotes(e.target.value)}
                        rows={3}
                      />
                      <button 
                        className="btn-dismiss"
                        onClick={() => handleDismiss(alert.id)}
                      >
                        Sorun Yok - Uyarıyı Kapat
                      </button>
                    </div>

                    <div className="action-section">
                      <h4>❌ Diskalifiye Et</h4>
                      <input
                        type="text"
                        placeholder="Diskalifiye nedeni *"
                        value={disqualifyReason}
                        onChange={(e) => setDisqualifyReason(e.target.value)}
                        required
                      />
                      <textarea
                        placeholder="Notlar (opsiyonel)"
                        value={disqualifyNotes}
                        onChange={(e) => setDisqualifyNotes(e.target.value)}
                        rows={3}
                      />
                      <button 
                        className="btn-disqualify"
                        onClick={() => handleDisqualify(alert.id)}
                      >
                        Diskalifiye Et
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

