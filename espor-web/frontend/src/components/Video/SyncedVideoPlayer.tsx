import { useEffect, useRef, useState } from 'react';
import { useSocket } from '../../hooks/useSocket';

interface VideoState {
    currentVideoUrl: string;
    currentThumbnailUrl: string;
    isPlaying: boolean;
    currentTime: number;
    volume: number;
}

export default function SyncedVideoPlayer() {
    const { socket } = useSocket();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoState, setVideoState] = useState<VideoState>({
        currentVideoUrl: '',
        currentThumbnailUrl: '',
        isPlaying: false,
        currentTime: 0,
        volume: 100
    });

    // Socket listener
    useEffect(() => {
        if (!socket) return;

        socket.emit('video:request_sync');

        socket.on('video:sync', (newState: VideoState) => {
            console.log('📡 Video sync:', newState);
            setVideoState(newState);
        });

        return () => {
            socket.off('video:sync');
        };
    }, [socket]);

    // Video control effect
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const fullUrl = getVideoUrl(videoState.currentVideoUrl);

        // Change video source if different
        if (video.src !== fullUrl && fullUrl) {
            console.log('🔄 Changing video to:', fullUrl);
            video.src = fullUrl;
            video.load();
        }

        // Control playback
        if (videoState.isPlaying) {
            console.log('▶️ Playing video');
            video.play().catch(err => {
                console.error('❌ Play failed:', err);
            });
        } else {
            console.log('⏸️ Pausing video');
            video.pause();
        }

        // Set volume
        video.volume = videoState.volume / 100;

    }, [videoState]);

    const getVideoUrl = (rawUrl: string): string => {
        if (!rawUrl) return '';
        if (rawUrl.startsWith('http')) return rawUrl;
        return `http://localhost:3001${rawUrl}`;
    };

    const getThumbnailUrl = (rawUrl: string): string => {
        if (!rawUrl) return '';
        if (rawUrl.startsWith('http')) return rawUrl;
        return `http://localhost:3001${rawUrl}`;
    };

    return (
        <div style={{
            width: '100%',
            height: '100vh',
            background: '#000',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Native HTML5 Video */}
            <video
                ref={videoRef}
                controls
                muted
                playsInline
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                }}
                onPlay={() => console.log('🎬 Video playing')}
                onPause={() => console.log('⏸️ Video paused')}
                onError={(e) => console.error('❌ Video error:', e)}
                onLoadedData={() => console.log('✅ Video loaded')}
            />

            {/* Thumbnail Overlay - Only when paused */}
            {!videoState.isPlaying && videoState.currentThumbnailUrl && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url("${getThumbnailUrl(videoState.currentThumbnailUrl)}")`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: '#000',
                    pointerEvents: 'none',
                    zIndex: 10
                }} />
            )}
        </div>
    );
}
