import React, { useState, useEffect } from 'react';
import SyncedVideoPlayer from '../components/Video/SyncedVideoPlayer';
import { VideoAdminPanel } from '../components/Admin/VideoAdminPanel';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const DirectorPage: React.FC = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [showControls, setShowControls] = useState(true);

    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) {
            navigate('/login');
        }
    }, [user, loading, navigate]);

    if (loading) return <div>Yükleniyor...</div>;

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            {/* Background: The Exact User View */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
                <SyncedVideoPlayer />
            </div>

            {/* Director Controls - Always Mounted */}
            <div style={{
                position: 'fixed',
                top: showControls ? '20px' : 'auto',
                bottom: showControls ? '20px' : '0px',
                right: showControls ? '20px' : '50%',
                left: showControls ? 'auto' : '50%',
                transform: showControls ? 'none' : 'translateX(-50%)',
                width: showControls ? '450px' : 'auto',
                maxHeight: showControls ? '90vh' : 'auto',
                zIndex: 100,
                backgroundColor: showControls ? 'rgba(0, 0, 0, 0.95)' : 'transparent',
                borderRadius: '12px',
                boxShadow: showControls ? '0 4px 20px rgba(0,0,0,0.5)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                pointerEvents: 'auto'
            }}>
                <div style={{ overflowY: 'hidden', padding: 0, height: '100%', width: '100%' }}>
                    <VideoAdminPanel
                        isDirectorView={true}
                        minimized={!showControls}
                        onToggleMinimize={() => setShowControls(!showControls)}
                    />
                </div>
            </div>
        </div>
    );
};
