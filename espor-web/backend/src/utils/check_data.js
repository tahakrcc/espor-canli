const pool = require('../config/database');

async function checkData() {
    try {
        console.log('--- SCORES (Archived) ---');
        const scores = await pool.query('SELECT * FROM scores');
        console.table(scores.rows);

        console.log('--- ROUNDS ---');
        const rounds = await pool.query('SELECT id, status, started_at, finished_at FROM game_rounds ORDER BY created_at DESC LIMIT 5');
        console.table(rounds.rows);

        console.log('--- ROUND PARTICIPANTS (Live Data) ---');
        const parts = await pool.query('SELECT round_id, user_id, status, score FROM round_participants WHERE score > 0');
        console.table(parts.rows);

    } catch (error) {
        console.error(error);
    } finally {
        pool.end();
    }
}

checkData();
