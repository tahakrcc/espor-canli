const pool = require('../config/database');

class GameService {
  async createRound(eventId, gameType, createdBy) {
    const result = await pool.query(
      `INSERT INTO game_rounds (event_id, game_type, status, created_by) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [eventId, gameType, 'waiting', createdBy]
    );

    const round = result.rows[0];

    // Tüm etkinlik katılımcılarını round'a ekle
    await pool.query(
      `INSERT INTO round_participants (round_id, user_id, status)
       SELECT $1, user_id, 'waiting'
       FROM event_participants
       WHERE event_id = $2
       ON CONFLICT DO NOTHING`,
      [round.id, eventId]
    );

    return round;
  }

  async startRound(roundId) {
    await pool.query(
      'UPDATE game_rounds SET status = $1, started_at = NOW() WHERE id = $2',
      ['countdown', roundId]
    );

    return { countdown: 5 };
  }

  async setRoundPlaying(roundId) {
    await pool.query(
      'UPDATE game_rounds SET status = $1 WHERE id = $2',
      ['playing', roundId]
    );
  }

  async updatePlayerStatus(roundId, userId, status, score = 0, metadata = {}) {
    const res = await pool.query(
      `UPDATE round_participants 
        SET status = $1::text, score = $2, metadata = $3,
            eliminated_at = CASE WHEN $1::text = 'eliminated' THEN NOW() ELSE eliminated_at END,
            finished_at = CASE WHEN $1::text = 'finished' THEN NOW() ELSE finished_at END
        WHERE round_id = $4 AND user_id = $5`,
      [status, score, JSON.stringify(metadata), roundId, userId]
    );
    console.log(`[DEBUG] updatePlayerStatus: Updated ${res.rowCount} rows. Round: ${roundId}, User: ${userId}, Score: ${score}`);
    return res.rowCount;
  }

  async getRoundPlayers(roundId) {
    const result = await pool.query(
      `SELECT rp.user_id, u.username, rp.status, rp.score, rp.metadata
       FROM round_participants rp
       JOIN users u ON u.id = rp.user_id
       WHERE rp.round_id = $1
       ORDER BY 
         CASE rp.status 
           WHEN 'playing' THEN 1
           WHEN 'waiting' THEN 2
           WHEN 'finished' THEN 3
           WHEN 'eliminated' THEN 4
           ELSE 5
         END,
         rp.score DESC`,
      [roundId]
    );
    return result.rows;
  }

  async finishRound(roundId) {
    // Skorları scores tablosuna aktar
    await pool.query(
      `INSERT INTO scores (event_id, round_id, user_id, game_type, score, metadata)
       SELECT 
         gr.event_id,
         gr.id,
         rp.user_id,
         gr.game_type,
         rp.score,
         rp.metadata
       FROM game_rounds gr
       JOIN round_participants rp ON rp.round_id = gr.id
       WHERE gr.id = $1 AND rp.status IN ('finished', 'eliminated') AND rp.score > 0`,
      [roundId]
    );

    // Round'u bitir
    await pool.query(
      'UPDATE game_rounds SET status = $1, finished_at = NOW() WHERE id = $2',
      ['finished', roundId]
    );

    // Event id'yi döndür
    const round = await pool.query('SELECT event_id FROM game_rounds WHERE id = $1', [roundId]);
    return round.rows[0]?.event_id;
  }

  async getActiveRound(eventId) {
    const result = await pool.query(
      `SELECT * FROM game_rounds 
       WHERE event_id = $1 AND status IN ('waiting', 'countdown', 'playing')
       ORDER BY created_at DESC LIMIT 1`,
      [eventId]
    );
    return result.rows[0] || null;
  }

  async getRoundById(roundId) {
    const result = await pool.query('SELECT * FROM game_rounds WHERE id = $1', [roundId]);
    return result.rows[0] || null;
  }

  async saveGameEvent(roundId, userId, eventType, timestamp, metadata) {
    await pool.query(
      `INSERT INTO game_events (round_id, user_id, event_type, timestamp, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [roundId, userId, eventType, timestamp, JSON.stringify(metadata)]
    );
  }
}

module.exports = new GameService();

