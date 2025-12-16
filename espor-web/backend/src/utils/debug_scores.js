const pool = require('../config/database');

async function debugScores() {
    try {
        console.log('--- RECENT SCORES (scores table) ---');
        const scores = await pool.query('SELECT * FROM scores ORDER BY created_at DESC LIMIT 5');
        console.table(scores.rows);

        console.log('\n--- RECENT GAME ROUNDS ---');
        const rounds = await pool.query('SELECT id, event_id, status, created_at FROM game_rounds ORDER BY created_at DESC LIMIT 5');
        console.table(rounds.rows);

        if (rounds.rows.length > 0) {
            console.log('\n--- PARTICIPANTS OF LAST ROUND ---');
            const lastRoundId = rounds.rows[0].id;
            // Removed ORDER BY created_at as it might not exist
            const participants = await pool.query('SELECT round_id, user_id, status, score FROM round_participants WHERE round_id = $1', [lastRoundId]);
            console.table(participants.rows);
        }

    } catch (error) {
        console.error('Error inspecting DB:', error);
    } finally {
        pool.end();
    }
}

debugScores();
