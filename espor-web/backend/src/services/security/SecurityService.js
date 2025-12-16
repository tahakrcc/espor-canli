const pool = require('../../config/database');

class SecurityService {
  determineSeverity(reason) {
    const criticalReasons = [
      'devtools_opened',
      'time_jump_detected',
      'score_calculation_mismatch'
    ];

    const highReasons = [
      'impossible_score',
      'excessive_pauses',
      'rate_limit_exceeded'
    ];

    if (criticalReasons.some(r => reason.includes(r))) return 'critical';
    if (highReasons.some(r => reason.includes(r))) return 'high';
    if (reason.includes('long_pause') || reason.includes('statistical')) return 'medium';
    return 'low';
  }

  async logSuspiciousActivity(userId, roundId, reason, details) {
    const roundResult = await pool.query(
      'SELECT event_id FROM game_rounds WHERE id = $1',
      [roundId]
    );

    if (roundResult.rows.length === 0) return null;

    const eventId = roundResult.rows[0].event_id;
    const severity = this.determineSeverity(reason);

    const result = await pool.query(
      `INSERT INTO suspicious_activities 
       (user_id, round_id, event_id, reason, details, severity, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, roundId, eventId, reason, JSON.stringify(details), severity, 'pending']
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as count 
       FROM suspicious_activities 
       WHERE user_id = $1 
         AND event_id = $2
         AND created_at > NOW() - INTERVAL '1 hour'
         AND status = 'pending'`,
      [userId, eventId]
    );

    const activityCount = parseInt(countResult.rows[0].count);

    if (activityCount >= 3) {
      await this.createSecurityAlert(userId, eventId, activityCount);
    }

    return result.rows[0];
  }

  async createSecurityAlert(userId, eventId, activityCount) {
    const existingAlert = await pool.query(
      `SELECT id FROM security_alerts 
       WHERE user_id = $1 
         AND event_id = $2 
         AND status = 'pending'`,
      [userId, eventId]
    );

    const activitiesResult = await pool.query(
      `SELECT id FROM suspicious_activities 
       WHERE user_id = $1 
         AND event_id = $2
         AND created_at > NOW() - INTERVAL '1 hour'
         AND status = 'pending'
       ORDER BY created_at DESC`,
      [userId, eventId]
    );

    const activityIds = activitiesResult.rows.map(r => r.id);

    if (existingAlert.rows.length > 0) {
      await pool.query(
        `UPDATE security_alerts 
         SET activity_count = $1, activities = $2
         WHERE id = $3`,
        [activityCount, JSON.stringify(activityIds), existingAlert.rows[0].id]
      );
      return existingAlert.rows[0].id;
    }

    const result = await pool.query(
      `INSERT INTO security_alerts 
       (user_id, event_id, activity_count, activities, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, eventId, activityCount, JSON.stringify(activityIds), 'pending']
    );

    // Socket.io ile admin'lere bildir (server.js'de yapılacak)
    return result.rows[0];
  }

  async getPendingAlerts(eventId = null) {
    let query = `
      SELECT 
        sa.*,
        u.username,
        u.id as user_id,
        e.name as event_name,
        json_agg(
          json_build_object(
            'id', sact.id,
            'reason', sact.reason,
            'severity', sact.severity,
            'details', sact.details,
            'created_at', sact.created_at
          ) ORDER BY sact.created_at DESC
        ) FILTER (WHERE sact.id IS NOT NULL) as activities
      FROM security_alerts sa
      JOIN users u ON u.id = sa.user_id
      JOIN events e ON e.id = sa.event_id
      LEFT JOIN suspicious_activities sact ON sact.id = ANY(
        SELECT jsonb_array_elements_text(sa.activities::jsonb)::uuid
      )
      WHERE sa.status = 'pending'
    `;

    const params = [];
    if (eventId) {
      query += ' AND sa.event_id = $1';
      params.push(eventId);
    }

    query += ' GROUP BY sa.id, u.id, u.username, e.id, e.name ORDER BY sa.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows.map(row => ({
      ...row,
      activities: row.activities || []
    }));
  }

  async dismissAlert(alertId, adminId, notes = null) {
    const alert = await pool.query(
      'SELECT * FROM security_alerts WHERE id = $1',
      [alertId]
    );

    if (alert.rows.length === 0) {
      throw new Error('Alert not found');
    }

    await pool.query(
      `UPDATE security_alerts 
       SET status = 'dismissed', 
           admin_decision = $1, 
           admin_notes = $2,
           resolved_at = NOW()
       WHERE id = $3`,
      [adminId, notes, alertId]
    );

    const activities = alert.rows[0].activities;
    if (activities && Array.isArray(activities)) {
      await pool.query(
        `UPDATE suspicious_activities 
         SET status = 'dismissed',
             admin_decision = $1,
             admin_notes = $2
         WHERE id = ANY($3::uuid[])`,
        [adminId, notes || 'Dismissed with alert', activities]
      );
    }

    return { success: true, message: 'Alert dismissed' };
  }

  async disqualifyUser(alertId, adminId, reason, notes = null) {
    const alert = await pool.query(
      'SELECT * FROM security_alerts WHERE id = $1',
      [alertId]
    );

    if (alert.rows.length === 0) {
      throw new Error('Alert not found');
    }

    const userId = alert.rows[0].user_id;
    const eventId = alert.rows[0].event_id;

    await pool.query(
      `UPDATE users 
       SET disqualified = true,
           disqualified_reason = $1,
           disqualified_at = NOW(),
           disqualified_by = $2
       WHERE id = $3`,
      [reason, adminId, userId]
    );

    await pool.query(
      `UPDATE security_alerts 
       SET status = 'disqualified', 
           admin_decision = $1, 
           admin_notes = $2,
           resolved_at = NOW()
       WHERE id = $3`,
      [adminId, notes, alertId]
    );

    const activities = alert.rows[0].activities;
    if (activities && Array.isArray(activities)) {
      await pool.query(
        `UPDATE suspicious_activities 
         SET status = 'disqualified',
             admin_decision = $1,
             admin_notes = $2
         WHERE id = ANY($3::uuid[])`,
        [adminId, reason, activities]
      );
    }

    await pool.query(
      `DELETE FROM event_participants 
       WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId]
    );

    await pool.query(
      `UPDATE round_participants 
       SET status = 'disqualified'
       WHERE user_id = $1 
         AND round_id IN (
           SELECT id FROM game_rounds WHERE event_id = $2 AND status != 'finished'
         )`,
      [userId, eventId]
    );

    return { success: true, message: 'User disqualified' };
  }

  async getSuspiciousActivityDetails(activityIds) {
    if (!activityIds || activityIds.length === 0) return [];

    const result = await pool.query(
      `SELECT 
        sa.*,
        u.username,
        gr.game_type,
        e.name as event_name
       FROM suspicious_activities sa
       JOIN users u ON u.id = sa.user_id
       JOIN game_rounds gr ON gr.id = sa.round_id
       JOIN events e ON e.id = sa.event_id
       WHERE sa.id = ANY($1::uuid[])
       ORDER BY sa.created_at DESC`,
      [activityIds]
    );
    return result.rows;
  }
}

module.exports = new SecurityService();

