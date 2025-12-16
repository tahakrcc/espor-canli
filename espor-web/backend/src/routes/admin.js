const express = require('express');
const router = express.Router();
const { adminCheck } = require('../middleware/auth');
const securityService = require('../services/security/SecurityService');
const leaderboardService = require('../services/leaderboardService');
const pool = require('../config/database');

// Bekleyen güvenlik uyarılarını getir
router.get('/security/alerts', adminCheck, async (req, res) => {
  try {
    const { eventId } = req.query;
    const alerts = await securityService.getPendingAlerts(eventId || null);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Alert detaylarını getir
router.get('/security/alerts/:alertId', adminCheck, async (req, res) => {
  try {
    const { alertId } = req.params;
    const alerts = await securityService.getPendingAlerts();
    const alert = alerts.find(a => a.id === alertId);
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const activities = await securityService.getSuspiciousActivityDetails(alert.activities || []);
    
    res.json({
      ...alert,
      activities
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Alert'i dismiss et
router.post('/security/alerts/:alertId/dismiss', adminCheck, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { notes } = req.body;
    const adminId = req.user.userId;

    const result = await securityService.dismissAlert(alertId, adminId, notes);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Kullanıcıyı diskalifiye et
router.post('/security/alerts/:alertId/disqualify', adminCheck, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { reason, notes } = req.body;
    const adminId = req.user.userId;

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    const result = await securityService.disqualifyUser(alertId, adminId, reason, notes);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Şüpheli aktivite geçmişi
router.get('/security/activities', adminCheck, async (req, res) => {
  try {
    const { userId, eventId, status } = req.query;
    
    let query = `
      SELECT 
        sa.*,
        u.username,
        gr.game_type,
        e.name as event_name
      FROM suspicious_activities sa
      JOIN users u ON u.id = sa.user_id
      JOIN game_rounds gr ON gr.id = sa.round_id
      JOIN events e ON e.id = sa.event_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    if (userId) {
      query += ` AND sa.user_id = $${paramCount++}`;
      params.push(userId);
    }

    if (eventId) {
      query += ` AND sa.event_id = $${paramCount++}`;
      params.push(eventId);
    }

    if (status) {
      query += ` AND sa.status = $${paramCount++}`;
      params.push(status);
    }

    query += ' ORDER BY sa.created_at DESC LIMIT 100';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Etkinlik liderlik tablosu
router.get('/leaderboard/:eventId', adminCheck, async (req, res) => {
  try {
    const { eventId } = req.params;
    const leaderboard = await leaderboardService.getEventLeaderboard(eventId);
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Round bilgisi (public - oyuncular için)
router.get('/round/:roundId', async (req, res) => {
  try {
    const { roundId } = req.params;
    const gameService = require('../services/gameService');
    const round = await gameService.getRoundById(roundId);
    
    if (!round) {
      return res.status(404).json({ error: 'Round not found' });
    }
    
    res.json(round);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

