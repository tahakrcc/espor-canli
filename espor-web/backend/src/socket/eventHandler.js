const eventService = require('../services/eventService');
const gameService = require('../services/gameService');
const leaderboardService = require('../services/leaderboardService');
const securityService = require('../services/security/SecurityService');
const scoreValidator = require('../services/security/ScoreValidator');
const authService = require('../services/authService');
const pool = require('../config/database');
const debugStore = require('../utils/debugStore');

let ioInstance = null;

function setupEventSocket(io) {
  ioInstance = io;

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        console.log('[DEBUG] Socket auth failed: No token');
        return next(new Error('Authentication error'));
      }

      const decoded = await authService.verifyToken(token);
      console.log(`[DEBUG] Socket auth success: User ${decoded.userId}`);
      debugStore.logs.push({ event: 'auth_success', userId: decoded.userId, timestamp: new Date().toISOString() });
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      socket.username = decoded.username;
      next();
    } catch (error) {
      console.log('[DEBUG] Socket auth failed:', error.message);
      debugStore.logs.push({ event: 'auth_failed', error: error.message, timestamp: new Date().toISOString() });
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.username} (${socket.userId})`);

    // Etkinliğe katıl
    socket.on('event:join', async (eventId) => {
      try {
        await eventService.joinEvent(eventId, socket.userId);
        socket.join(`event:${eventId}`);

        const details = await eventService.getEventDetails(eventId);
        socket.emit('event:details', details);

        socket.to(`event:${eventId}`).emit('event:participant:joined', {
          userId: socket.userId,
          username: socket.username
        });

        const participants = await eventService.getEventParticipants(eventId);
        io.to(`event:${eventId}`).emit('event:participants', participants);
      } catch (error) {
        socket.emit('event:error', { message: error.message });
      }
    });

    // Etkinlikten ayrıl
    socket.on('event:leave', async (eventId) => {
      try {
        await eventService.leaveEvent(eventId, socket.userId);
        socket.leave(`event:${eventId}`);

        socket.to(`event:${eventId}`).emit('event:participant:left', {
          userId: socket.userId,
          username: socket.username
        });

        const participants = await eventService.getEventParticipants(eventId);
        io.to(`event:${eventId}`).emit('event:participants', participants);
      } catch (error) {
        // Hata olsa bile sessizce devam et
        console.error('Socket leave error:', error);
      }
    });

    // Etkinlik detaylarını iste
    socket.on('event:get', async (eventId) => {
      try {
        const details = await eventService.getEventDetails(eventId);
        socket.emit('event:details', details);
      } catch (error) {
        socket.emit('event:error', { message: error.message });
      }
    });

    // Liderlik tablosu subscribe
    socket.on('leaderboard:subscribe', (eventId) => {
      socket.join(`leaderboard:${eventId}`);
    });

    // Oyun turu bekleme ekranı
    socket.on('round:waiting', async (roundId) => {
      socket.join(`round:${roundId}`);

      const players = await gameService.getRoundPlayers(roundId);
      const waitingCount = players.filter(p => p.status === 'waiting').length;

      socket.emit('round:waiting:update', {
        roundId,
        waitingCount,
        totalPlayers: players.length
      });

      io.to(`round:${roundId}`).emit('round:waiting:count', waitingCount);
    });

    // Oyun başladı
    socket.on('round:started', (roundId) => {
      socket.join(`round:playing:${roundId}`);
    });

    socket.on('game:start', ({ roundId, timestamp }) => {
      const log = { event: 'game:start', roundId, userId: socket.userId, timestamp: new Date().toISOString() };
      console.log(`[DEBUG] game:start received. Round: ${roundId}, User: ${socket.userId}`);
      debugStore.logs.push(log);
    });

    // Game event gönder (event-based scoring)
    socket.on('game:event', async ({ roundId, eventType, timestamp, metadata }) => {
      try {
        await gameService.saveGameEvent(roundId, socket.userId, eventType, timestamp, metadata);
      } catch (error) {
        console.error('Error saving game event:', error);
      }
    });

    // Skor güncelleme (oyun sırasında)
    socket.on('score:update', async ({ roundId, score, metadata }) => {
      try {
        const round = await gameService.getRoundById(roundId);
        if (!round || round.status !== 'playing') {
          return;
        }

        // Validasyon
        try {
          await scoreValidator.validateScore(
            socket.userId,
            metadata.gameType || round.game_type,
            score,
            metadata,
            roundId
          );
        } catch (validationError) {
          // Şüpheli aktivite kaydet
          await securityService.logSuspiciousActivity(
            socket.userId,
            roundId,
            validationError.message,
            { score, metadata }
          );

          // Oyuncuyu elen
          await gameService.updatePlayerStatus(
            roundId,
            socket.userId,
            'eliminated',
            0,
            { reason: 'validation_failed', error: validationError.message }
          );

          socket.emit('game:error', { message: 'Skor validasyonu başarısız' });
          return;
        }

        // Geçici skor güncelle
        await gameService.updatePlayerStatus(
          roundId,
          socket.userId,
          'playing',
          score,
          metadata
        );
      } catch (error) {
        console.error('Error updating score:', error);
      }
    });

    // Oyuncu elendi
    socket.on('player:eliminated', async ({ roundId, finalScore, metadata }) => {
      try {
        const round = await gameService.getRoundById(roundId);
        if (!round) return;

        await gameService.updatePlayerStatus(
          roundId,
          socket.userId,
          'eliminated',
          finalScore,
          metadata
        );

        socket.leave(`round:playing:${roundId}`);
        socket.emit('round:eliminated', { eventId: round.event_id });
      } catch (error) {
        console.error('Error eliminating player:', error);
      }
    });

    // Oyun bitti (oyuncu tamamladı)
    socket.on('player:finished', async ({ roundId, finalScore, metadata }) => {
      const debugInfo = {
        timestamp: new Date().toISOString(),
        event: 'player:finished',
        roundId,
        userId: socket.userId,
        finalScore,
        roundFound: false,
        validationPassed: false,
        updateRowCount: -1,
        step: 'start'
      };

      console.log(`[DEBUG] player:finished called. Round: ${roundId}, User: ${socket.userId}, Score: ${finalScore}`);
      debugStore.logs.push(debugInfo);
      try {
        const round = await gameService.getRoundById(roundId);
        if (!round) {
          console.log('[DEBUG] Round not found');
          return;
        }

        // Final skor validasyonu
        try {
          await scoreValidator.validateScore(
            socket.userId,
            metadata.gameType || round.game_type,
            finalScore,
            metadata,
            roundId
          );
          console.log('[DEBUG] Validation passed');

          // Event'leri kontrol et
          const eventsResult = await pool.query(
            'SELECT * FROM game_events WHERE round_id = $1 AND user_id = $2 ORDER BY timestamp',
            [roundId, socket.userId]
          );

          // Event-based skor hesapla (basit kontrol)
          if (eventsResult.rows.length > 0 && metadata.gameType === 'flybird') {
            const obstacleEvents = eventsResult.rows.filter(e => e.event_type === 'obstacle_passed');
            if (Math.abs(finalScore - obstacleEvents.length) > obstacleEvents.length * 0.1) {
              throw new Error('SUSPICIOUS: Score mismatch with events');
            }
          }
        } catch (validationError) {
          await securityService.logSuspiciousActivity(
            socket.userId,
            roundId,
            validationError.message,
            { finalScore, metadata }
          );

          socket.emit('game:error', { message: 'Final skor validasyonu başarısız' });
          return;
        }

        await gameService.updatePlayerStatus(
          roundId,
          socket.userId,
          'finished',
          finalScore,
          metadata
        );

        socket.leave(`round:playing:${roundId}`);
        socket.emit('round:finished', { eventId: round.event_id });

        // Broadcast updated leaderboard to everyone in the event
        const leaderboard = await eventService.getEventLeaderboard(round.event_id);
        io.to(`event:${round.event_id}`).emit('leaderboard:update', leaderboard);

      } catch (error) {
        console.error('Error finishing player:', error);
        debugStore.logs.push({
          event: 'player:finished_error',
          error: error.message,
          stack: error.stack,
          roundId,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Şüpheli aktivite bildirimi (client'tan)
    socket.on('security:suspicious', async ({ reason, timestamp }) => {
      try {
        // Aktif round'u bul
        const activeRounds = await pool.query(
          `SELECT id FROM game_rounds 
           WHERE status = 'playing' 
           AND id IN (
             SELECT round_id FROM round_participants WHERE user_id = $1
           )`,
          [socket.userId]
        );

        if (activeRounds.rows.length > 0) {
          await securityService.logSuspiciousActivity(
            socket.userId,
            activeRounds.rows[0].id,
            reason,
            { timestamp }
          );
        }
      } catch (error) {
        console.error('Error logging suspicious activity:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.username}`);
    });
  });

  // Admin namespace
  const adminIo = io.of('/admin');

  adminIo.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = await authService.verifyToken(token);

      if (decoded.role !== 'admin') {
        return next(new Error('Admin access required'));
      }

      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  adminIo.on('connection', (socket) => {
    console.log(`Admin connected: ${socket.userId}`);

    // Güvenlik uyarılarını subscribe et
    socket.on('admin:security:subscribe', () => {
      socket.join('admin:security');
    });

    // Bekleyen uyarıları iste
    socket.on('admin:security:alerts:get', async ({ eventId }) => {
      try {
        const alerts = await securityService.getPendingAlerts(eventId || null);
        socket.emit('admin:security:alerts', alerts);
      } catch (error) {
        socket.emit('admin:security:error', { message: error.message });
      }
    });

    // Alert dismiss
    socket.on('admin:security:alert:dismiss', async ({ alertId, notes }) => {
      try {
        await securityService.dismissAlert(alertId, socket.userId, notes);

        adminIo.to('admin:security').emit('admin:security:alert:resolved', {
          alertId,
          action: 'dismissed',
          adminId: socket.userId
        });

        const alerts = await securityService.getPendingAlerts();
        adminIo.to('admin:security').emit('admin:security:alerts', alerts);
      } catch (error) {
        socket.emit('admin:security:error', { message: error.message });
      }
    });

    // Kullanıcıyı diskalifiye et
    socket.on('admin:security:alert:disqualify', async ({ alertId, reason, notes }) => {
      try {
        await securityService.disqualifyUser(alertId, socket.userId, reason, notes);

        adminIo.to('admin:security').emit('admin:security:alert:resolved', {
          alertId,
          action: 'disqualified',
          adminId: socket.userId
        });

        const alerts = await securityService.getPendingAlerts();
        adminIo.to('admin:security').emit('admin:security:alerts', alerts);

        // Kullanıcıya bildir
        io.to(`user:${socket.userId}`).emit('user:disqualified', { reason });
      } catch (error) {
        socket.emit('admin:security:error', { message: error.message });
      }
    });

    // Oyun turu oluştur
    socket.on('admin:round:create', async ({ eventId, gameType }) => {
      try {
        const round = await gameService.createRound(eventId, gameType, socket.userId);

        io.to(`event:${eventId}`).emit('round:created', {
          roundId: round.id,
          gameType: round.game_type,
          status: 'waiting'
        });

        socket.emit('admin:round:created', round);
      } catch (error) {
        socket.emit('admin:error', { message: error.message });
      }
    });

    // Turu başlat
    socket.on('admin:round:start', async (roundId) => {
      try {
        const countdown = await gameService.startRound(roundId);

        io.to(`round:${roundId}`).emit('round:countdown', { countdown: 5 });

        let remaining = 5;
        const countdownInterval = setInterval(() => {
          remaining--;
          io.to(`round:${roundId}`).emit('round:countdown', { countdown: remaining });

          if (remaining === 0) {
            clearInterval(countdownInterval);
            gameService.setRoundPlaying(roundId);
            io.to(`round:${roundId}`).emit('round:start', { roundId });
          }
        }, 1000);

        socket.emit('admin:round:started', { roundId, countdown });
      } catch (error) {
        socket.emit('admin:error', { message: error.message });
      }
    });

    // Oyunda olanları getir
    socket.on('admin:round:players', async (roundId) => {
      try {
        const players = await gameService.getRoundPlayers(roundId);
        const playingCount = players.filter(p => p.status === 'playing').length;

        socket.emit('admin:round:players', {
          players,
          playingCount,
          totalPlayers: players.length
        });
      } catch (error) {
        socket.emit('admin:error', { message: error.message });
      }
    });

    // Turu bitir
    socket.on('admin:round:finish', async (roundId) => {
      try {
        const eventId = await gameService.finishRound(roundId);

        io.to(`event:${eventId}`).emit('round:finished', { roundId });

        const leaderboard = await leaderboardService.getEventLeaderboard(eventId);
        io.to(`leaderboard:${eventId}`).emit('leaderboard:update', leaderboard);

        socket.emit('admin:round:finished', { roundId, eventId });
      } catch (error) {
        socket.emit('admin:error', { message: error.message });
      }
    });
  });

  // Periyodik liderlik tablosu güncellemesi
  setInterval(async () => {
    try {
      const activeEvents = await eventService.getActiveEvents();

      for (const event of activeEvents) {
        const activeRound = await gameService.getActiveRound(event.id);

        if (activeRound && activeRound.status === 'playing') {
          const leaderboard = await leaderboardService.getEventLeaderboard(
            event.id,
            true,
            activeRound.id
          );
          io.to(`leaderboard:${event.id}`).emit('leaderboard:update', leaderboard);
        } else {
          const leaderboard = await leaderboardService.getEventLeaderboard(event.id);
          io.to(`leaderboard:${event.id}`).emit('leaderboard:update', leaderboard);
        }
      }
    } catch (error) {
      console.error('Error updating leaderboards:', error);
    }
  }, 2000);

  // Güvenlik uyarıları için socket instance'ı döndür
  return io;
}

// Security alert bildirimi için fonksiyon
function notifySecurityAlert(alert) {
  if (ioInstance) {
    ioInstance.of('/admin').to('admin:security').emit('security:alert', {
      alertId: alert.id,
      userId: alert.user_id,
      eventId: alert.event_id,
      activityCount: alert.activity_count,
      timestamp: new Date()
    });
  }
}

module.exports = { setupEventSocket, notifySecurityAlert };

