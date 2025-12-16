import React, { useState, useEffect } from 'react';
import { useAdminSocket } from '../../hooks/useAdminSocket';
import axios from 'axios';

interface PlaylistItem {
    title: string;
    url: string;
    thumbnailUrl?: string;
    type: 'youtube' | 'file';
}

// Helper to get API URL safely
const getApiUrl = () => {
    // @ts-ignore
    const envUrl = import.meta.env.VITE_API_URL;
    // If VITE_API_URL is set and is a full URL (starts with http), use it
    if (envUrl && envUrl.startsWith('http')) {
        return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`;
    }
    // Otherwise, use relative path /api (works in production where frontend/backend same domain)
    return '/api';
};

// Helper to get Base URL (for static files)
const getBaseUrl = () => {
    const api = getApiUrl();
    return api.replace('/api', '');
};

interface VideoAdminPanelProps {
    isDirectorView?: boolean;
    minimized?: boolean;
    onToggleMinimize?: () => void;
}

export const VideoAdminPanel: React.FC<VideoAdminPanelProps> = ({ isDirectorView = false, minimized = false, onToggleMinimize }) => {
    const { socket, connected } = useAdminSocket();
    const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
    const [currentUrl, setCurrentUrl] = useState('');
    const [currentThumbnail, setCurrentThumbnail] = useState<string>('');
    const [inputUrl, setInputUrl] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [volume, setVolume] = useState(100);

    const API_URL = getApiUrl();
    const BASE_URL = getBaseUrl();

    // Volume Control Handler
    const handleVolume = (change: number) => {
        const newVol = Math.min(100, Math.max(0, volume + change));
        setVolume(newVol);
        socket?.emit('admin:video:control', { action: 'volume', volume: newVol });
    };

    // Add YouTube URL
    const handleAddUrl = () => {
        if (!inputUrl) return;
        const newItem: PlaylistItem = {
            title: inputUrl.length > 30 ? inputUrl.substring(0, 30) + '...' : inputUrl,
            url: inputUrl,
            type: 'youtube'
        };
        setPlaylist([...playlist, newItem]);
        setInputUrl('');
    };

    // Upload File
    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('video', file);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL} /video/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token} `
                }
            });

            const fullUrl = `${BASE_URL}${response.data.url} `;

            const newItem: PlaylistItem = {
                title: file.name,
                url: fullUrl,
                type: 'file'
            };
            setPlaylist([...playlist, newItem]);
            setFile(null);
        } catch (error) {
            console.error('Upload failed', error);
            alert('Video yüklenemedi!');
        } finally {
            setUploading(false);
        }
    };

    // Play a video from playlist
    const handlePlayItem = (item: PlaylistItem) => {
        setCurrentUrl(item.url);
        setCurrentThumbnail(item.thumbnailUrl || '');
        if (socket && connected) {
            socket.emit('admin:video:control', {
                action: 'change',
                url: item.url,
                thumbnailUrl: item.thumbnailUrl
            });
            console.log('Emitted change:', item.title);
        } else {
            console.warn('Socket not connected, cannot emit change');
        }
    };

    const loadPlaylist = async () => {
        try {
            const res = await axios.get(`${API_URL}/video/playlist?t=${Date.now()}`);
            const mappedPlaylist = res.data.map((item: any) => {
                const isFile = item.type === 'file' || item.videoUrl?.startsWith('/');
                return {
                    title: item.title,
                    type: item.type || (isFile ? 'file' : 'youtube'),
                    // Handle property mismatch and relative URLs
                    url: item.url || (isFile ? `${BASE_URL}${item.videoUrl}` : item.videoUrl),
                    thumbnailUrl: item.thumbnailUrl ? (item.thumbnailUrl.startsWith('http') ? item.thumbnailUrl : `${BASE_URL}${item.thumbnailUrl}`) : undefined
                };
            });
            setPlaylist(mappedPlaylist);
        } catch (error) {
            console.error('Failed to load playlist', error);
            // Set empty playlist on error to prevent UI issues
            setPlaylist([]);
        }
    };

    useEffect(() => {
        loadPlaylist();
    }, []);

    const savePlaylist = async () => {
        console.log('Saving playlist...', playlist);
        if (!window.confirm('Playlisti kaydetmek istediğinize emin misiniz?')) {
            console.log('Save cancelled by user');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            console.log('Using token:', token ? 'Found' : 'Missing');
            console.log('Posting to:', `${API_URL}/video/playlist`);

            await axios.post(`${API_URL}/video/playlist`, playlist, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Save successful');
            alert('Playlist başarıyla kaydedildi!');
        } catch (error: any) {
            console.error('Failed to save playlist', error);
            alert(`Playlist kaydedilemedi! Hata: ${error.message} `);
        }
    };

    // Auto-select first item when playlist loads and socket is ready
    useEffect(() => {
        if (playlist.length > 0 && !currentUrl && socket && connected) {
            console.log('Auto-selecting first video:', playlist[0].title);
            handlePlayItem(playlist[0]);
        }
    }, [playlist, socket, connected]);

    const handleNext = () => {
        const currentIndex = playlist.findIndex(p => p.url === currentUrl);
        if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
            handlePlayItem(playlist[currentIndex + 1]);
        }
    };

    const handlePrevious = () => {
        const currentIndex = playlist.findIndex(p => p.url === currentUrl);
        if (currentIndex > 0) {
            handlePlayItem(playlist[currentIndex - 1]);
        }
    };

    if (isDirectorView && minimized) {
        return (
            <div style={{
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                padding: '15px 30px',
                borderRadius: '50px',
                display: 'flex',
                gap: '20px',
                alignItems: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                zIndex: 1000
            }}>
                {/* Previous */}
                <button
                    onClick={handlePrevious}
                    disabled={playlist.findIndex(p => p.url === currentUrl) <= 0}
                    style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', opacity: playlist.findIndex(p => p.url === currentUrl) <= 0 ? 0.3 : 1 }}
                    title="Önceki Video"
                >
                    ⏮
                </button>

                {/* Play/Pause */}
                <button
                    onClick={() => {
                        // Toggle play/pause - backend will handle state
                        console.log('🎮 [TOGGLE] Clicked');
                        socket?.emit('admin:video:control', { action: 'toggle', time: 0 });
                    }}
                    style={{
                        background: '#4CAF50', // Assuming a default play color, as isPlaying state is removed
                        border: 'none',
                        color: 'white',
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        fontSize: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
                    }}
                    title="Başlat/Durdur"
                >
                    ▶
                </button>

                {/* Next */}
                <button
                    onClick={handleNext}
                    disabled={playlist.findIndex(p => p.url === currentUrl) >= playlist.length - 1}
                    style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', opacity: playlist.findIndex(p => p.url === currentUrl) >= playlist.length - 1 ? 0.3 : 1 }}
                    title="Sonraki Video"
                >
                    ⏭
                </button>

                {/* Open Panel (Video Tuşu equivalent) */}
                <button
                    onClick={onToggleMinimize}
                    style={{
                        background: '#2196F3',
                        border: 'none',
                        color: 'white',
                        padding: '10px 20px',
                        borderRadius: '20px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        marginLeft: '10px'
                    }}
                >
                    PANEL
                </button>
            </div>
        );
    }

    return (
        <div className="video-admin-panel" style={{ padding: '20px', background: isDirectorView ? 'transparent' : '#f5f5f5', borderRadius: '10px', color: isDirectorView ? '#fff' : '#000', height: isDirectorView ? '100%' : 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{isDirectorView ? '🎬 Yönetmen' : 'Video Yönetimi'}</h2>
                {isDirectorView && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#4CAF50', background: '#333', padding: '5px 10px', borderRadius: '4px' }}>SES: %{volume}</div>
                        <button onClick={onToggleMinimize} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>✖</button>
                    </div>
                )}
            </div>

            {!isDirectorView && (
                <button
                    onClick={() => window.open('/director', '_blank')}
                    style={{
                        width: '100%',
                        padding: '15px',
                        marginBottom: '10px',
                        background: 'linear-gradient(45deg, #FF5722, #FF9800)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    🎬 DİRECTOR MODE (Tam Ekran Yönetim)
                </button>
            )}

            {!isDirectorView && (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <button onClick={loadPlaylist} style={{ padding: '10px', flex: 1, backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px' }}>
                        📁 YÜKLE (LOAD)
                    </button>
                    <button onClick={savePlaylist} style={{ padding: '10px', flex: 1, backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}>
                        💾 KAYDET (SAVE)
                    </button>
                </div>
            )}

            {/* Upload / Add Section - HIDDEN IN DIRECTOR MODE */}
            {!isDirectorView && (
                <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <h4>YouTube Linki Ekle</h4>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <input
                                type="text"
                                value={inputUrl}
                                onChange={(e) => setInputUrl(e.target.value)}
                                placeholder="https://youtube.com/..."
                                style={{ flex: 1, padding: '8px' }}
                            />
                            <button onClick={handleAddUrl} disabled={!inputUrl} style={{ padding: '8px' }}>Ekle</button>
                        </div>
                    </div>

                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <h4>Video Dosyası Yükle</h4>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <input
                                type="file"
                                accept="video/mp4,video/webm"
                                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                                style={{ flex: 1 }}
                            />
                            <button onClick={handleUpload} disabled={!file || uploading} style={{ padding: '8px' }}>
                                {uploading ? 'Yükleniyor...' : 'Yükle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Playlist */}
            <div style={{ marginBottom: '20px', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>{isDirectorView ? 'Yayın Akışı' : 'Yayın Listesi (Otomatik Sıralı)'}</h3>
                <ul style={{ listStyle: 'none', padding: 0, background: isDirectorView ? '#333' : '#fff', flex: 1, overflowY: 'auto', borderRadius: '8px', maxHeight: isDirectorView ? 'calc(100vh - 350px)' : '400px' }}>
                    {playlist.map((item, index) => (
                        <li key={index} style={{
                            padding: '10px',
                            borderBottom: '1px solid #444',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: currentUrl === item.url ? (isDirectorView ? '#1976D2' : '#e3f2fd') : 'transparent',
                            borderLeft: currentUrl === item.url ? '5px solid #2196F3' : 'none',
                            color: isDirectorView ? '#fff' : '#000'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontWeight: 'bold', color: isDirectorView ? '#aaa' : '#888' }}>{index + 1}.</span>
                                {item.thumbnailUrl && (
                                    <img
                                        src={item.thumbnailUrl}
                                        alt="thumb"
                                        style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                                    />
                                )}
                                <span style={{ fontWeight: currentUrl === item.url ? 'bold' : 'normal', fontSize: '14px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</span>
                            </div>
                            <button onClick={() => handlePlayItem(item)} style={{ padding: '5px 10px', background: isDirectorView ? '#4CAF50' : '#ddd', color: isDirectorView ? '#fff' : '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>SEÇ</button>
                        </li>
                    ))}
                    {playlist.length === 0 && <li style={{ padding: '10px', color: '#888' }}>Liste boş.</li>}
                </ul>
            </div>

            {/* BIG CONTROL PANEL - Fixed at bottom for Director Mode */}
            <div className="master-controls" style={{
                padding: '15px',
                background: isDirectorView ? '#000' : '#333',
                color: '#fff',
                borderRadius: '10px',
                marginTop: 'auto',
                border: isDirectorView ? '1px solid #444' : 'none',
                flexShrink: 0
            }}>

                {/* Play/Pause & Volume Row */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
                    <button
                        onClick={() => {
                            console.log('🎮 [PLAY] Clicked');
                            socket?.emit('admin:video:control', { action: 'play', time: 0 });
                        }}
                        style={{ padding: '15px', fontSize: '20px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', flex: 1 }}
                    >
                        ▶
                    </button>
                    <button
                        onClick={() => {
                            console.log('🎮 [PAUSE] Clicked');
                            socket?.emit('admin:video:control', { action: 'pause', time: 0 });
                        }}
                        style={{ padding: '15px', fontSize: '20px', background: '#F44336', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', flex: 1 }}
                    >
                        ⏸
                    </button>
                </div>

                {isDirectorView && (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center', background: '#222', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
                        <span style={{ fontSize: '16px' }}>🔊</span>
                        <button onClick={() => handleVolume(-10)} style={{ padding: '5px 10px', fontSize: '16px', cursor: 'pointer', background: '#555', color: 'white', border: 'none', borderRadius: '4px' }}>➖</button>
                        <div style={{ width: '100px', height: '8px', background: '#444', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${volume}% `, height: '100%', background: '#2196F3', transition: 'width 0.2s' }}></div>
                        </div>
                        <button onClick={() => handleVolume(10)} style={{ padding: '5px 10px', fontSize: '16px', cursor: 'pointer', background: '#555', color: 'white', border: 'none', borderRadius: '4px' }}>➕</button>
                    </div>
                )}

                {/* Simplified Nav */}
                {playlist.length > 0 && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <button
                            onClick={handlePrevious}
                            disabled={playlist.findIndex(p => p.url === currentUrl) <= 0}
                            style={{ padding: '10px 15px', background: '#444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: playlist.findIndex(p => p.url === currentUrl) <= 0 ? 0.3 : 1 }}
                        >
                            ⏮
                        </button>

                        <div style={{ textAlign: 'center', color: isDirectorView ? '#aaa' : '#fff', fontSize: '12px', maxWidth: '150px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {currentUrl ? playlist.find(p => p.url === currentUrl)?.title : 'Seçilmedi'}
                        </div>

                        <button
                            onClick={handleNext}
                            disabled={playlist.findIndex(p => p.url === currentUrl) >= playlist.length - 1}
                            style={{ padding: '10px 15px', background: '#444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: playlist.findIndex(p => p.url === currentUrl) >= playlist.length - 1 ? 0.3 : 1 }}
                        >
                            ⏭
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
