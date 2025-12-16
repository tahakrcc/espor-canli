const { videoState, updateVideoState, getVideoState } = require('../utils/videoState');
const authService = require('../services/authService');

function setupVideoSocket(io) {
    const adminIo = io.of('/admin');

    // Public users (audience/slaves)
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                console.log('[VIDEO] Root namespace: No token provided');
                return next(new Error('Authentication required'));
            }

            const decoded = await authService.verifyToken(token);
            socket.userId = decoded.userId;
            socket.username = decoded.username;
            console.log(`[VIDEO] Root namespace auth success: User ${decoded.userId}`);
            next();
        } catch (error) {
            console.error('[VIDEO] Root namespace auth failed:', error.message);
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`[VIDEO] User connected to root namespace: ${socket.username} (${socket.userId})`);

        // Send current state on connect
        socket.emit('video:sync', getVideoState());

        // Allow users to request sync
        socket.on('video:request_sync', () => {
            socket.emit('video:sync', getVideoState());
        });

        socket.on('disconnect', () => {
            console.log(`[VIDEO] User disconnected from root namespace: ${socket.username}`);
        });
    });

    // Admin (master) controls
    adminIo.on('connection', (socket) => {
        let lastCommandTime = 0;

        socket.on('admin:video:control', (data) => {
            // Simple rate limiting
            const now = Date.now();
            if (now - lastCommandTime < 200) {
                console.log(`[VIDEO] Rate limited: ${data.action}`);
                return;
            }
            lastCommandTime = now;

            // data: { action: 'play'|'pause'|'seek', time: number, url?: string }
            console.log(`[VIDEO] Admin action: ${data.action}`, data);

            if (data.action === 'play') {
                updateVideoState({ isPlaying: true, currentTime: data.time });
            } else if (data.action === 'pause') {
                updateVideoState({ isPlaying: false, currentTime: data.time });
            } else if (data.action === 'seek') {
                updateVideoState({ currentTime: data.time });
            } else if (data.action === 'change') {
                updateVideoState({
                    currentVideoUrl: data.url,
                    currentThumbnailUrl: data.thumbnailUrl,
                    currentTime: 0,
                    isPlaying: false
                });

                // Broadcast immediately
                const broadcastState = getVideoState();
                io.emit('video:sync', broadcastState);
                adminIo.emit('video:sync', broadcastState);

                // Prevent further processing to avoid race condition
                return;
            } else if (data.action === 'volume') {
                updateVideoState({ volume: data.volume });
            } else if (data.action === 'toggle') {
                const currentState = getVideoState();
                updateVideoState({ isPlaying: !currentState.isPlaying, currentTime: data.time || currentState.currentTime });
            }

            // Broadcast to EVERYONE (including other admins)
            const broadcastState = getVideoState();

            // Send to regular users
            io.emit('video:sync', broadcastState);

            // Send to admins too
            adminIo.emit('video:sync', broadcastState);
        });

        socket.on('admin:playlist:update', (playlist) => {
            videoState.playlist = playlist;
            adminIo.emit('admin:playlist:sync', playlist);
        });
    });
}

module.exports = { setupVideoSocket };
