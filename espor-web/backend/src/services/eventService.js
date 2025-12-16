const pool = require('../config/database');

class EventService {
  async createEvent(name, createdBy) {
    const result = await pool.query(
      'INSERT INTO events (name, created_by, status) VALUES ($1, $2, $3) RETURNING *',
      [name, createdBy, 'waiting']
    );
    return result.rows[0];
  }

  async finishEvent(eventId) {
    const result = await pool.query(
      "UPDATE events SET status = 'finished' WHERE id = $1 RETURNING *",
      [eventId]
    );
    return result.rows[0];
  }

  async joinEvent(eventId, userId) {
    try {
      // Diskalifiye kontrolü
      const userCheck = await pool.query(
        'SELECT disqualified FROM users WHERE id = $1',
        [userId]
      );

      if (userCheck.rows[0]?.disqualified) {
        throw new Error('User is disqualified');
      }

      await pool.query(
        'INSERT INTO event_participants (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [eventId, userId]
      );
      return true;
    } catch (error) {
      throw error;
    }
  }

  async leaveEvent(eventId, userId) {
    try {
      // Check if user is actually a participant
      const checkResult = await pool.query(
        'SELECT 1 FROM event_participants WHERE event_id = $1 AND user_id = $2',
        [eventId, userId]
      );

      if (checkResult.rows.length === 0) {
        // User is not a participant, but that's okay - just return success
        console.log(`User ${userId} is not a participant of event ${eventId}, but leaving anyway`);
        return true;
      }

      // Remove from event_participants
      await pool.query(
        'DELETE FROM event_participants WHERE event_id = $1 AND user_id = $2',
        [eventId, userId]
      );

      console.log(`User ${userId} left event ${eventId}`);
      return true;
    } catch (error) {
      console.error('Error in leaveEvent:', error);
      throw new Error(`Etkinlikten ayrılırken hata oluştu: ${error.message}`);
    }
  }

  async getEventParticipants(eventId) {
    const result = await pool.query(
      `SELECT u.id, u.username, ep.joined_at 
       FROM event_participants ep
       JOIN users u ON u.id = ep.user_id
       WHERE ep.event_id = $1
       ORDER BY ep.joined_at`,
      [eventId]
    );
    return result.rows;
  }

  async getActiveEvents() {
    const result = await pool.query(
      "SELECT * FROM events WHERE status IN ('waiting', 'active') ORDER BY created_at DESC"
    );
    return result.rows;
  }

  async getAllEvents() {
    const result = await pool.query(
      'SELECT * FROM events ORDER BY created_at DESC'
    );
    return result.rows;
  }

  async getEventDetails(eventId) {
    const event = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);

    if (event.rows.length === 0) {
      return null;
    }

    const participants = await this.getEventParticipants(eventId);
    const leaderboard = await this.getEventLeaderboard(eventId);

    // Get active round if exists
    const roundResult = await pool.query(
      "SELECT * FROM game_rounds WHERE event_id = $1 AND status != 'finished' ORDER BY created_at DESC LIMIT 1",
      [eventId]
    );
    const activeRound = roundResult.rows[0] || null;

    return {
      event: event.rows[0],
      participants,
      leaderboard,
      activeRound
    };
  }

  async getEventLeaderboard(eventId) {
    const result = await pool.query(
      `WITH all_scores AS (
        -- Archived scores from finished rounds
        SELECT user_id, score, 1 as is_round FROM scores WHERE event_id = $1
        UNION ALL
        -- Live scores from active/unfinished rounds
        SELECT rp.user_id, rp.score, 1 as is_round 
        FROM round_participants rp
        JOIN game_rounds gr ON gr.id = rp.round_id
        WHERE gr.event_id = $1 AND gr.status != 'finished' AND rp.score > 0
       )
       SELECT 
        u.id,
        u.username,
        COALESCE(SUM(a.score), 0) as total_score,
        COUNT(a.is_round) as rounds_played
       FROM event_participants ep
       JOIN users u ON u.id = ep.user_id
       LEFT JOIN all_scores a ON a.user_id = u.id
       WHERE ep.event_id = $1
       GROUP BY u.id, u.username
       ORDER BY total_score DESC, rounds_played DESC`,
      [eventId]
    );
    return result.rows;
  }

  async getEventById(eventId) {
    const result = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
    return result.rows[0] || null;
  }
}

module.exports = new EventService();

