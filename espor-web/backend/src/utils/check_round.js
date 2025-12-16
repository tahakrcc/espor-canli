const pool = require('../config/database');

const roundId = '4c6bc21d-0579-4946-b536-accb7a611526'; // New latest round

async function checkRound() {
    try {
        console.log(`Checking round: ${roundId}`);
        const result = await pool.query('SELECT * FROM game_rounds WHERE id = $1', [roundId]);
        console.log('Result:', result.rows[0] || 'NOT FOUND');

        console.log('--- ALL ROUNDS ---');
        const all = await pool.query('SELECT id, created_at FROM game_rounds ORDER BY created_at DESC LIMIT 5');
        console.table(all.rows);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        pool.end();
    }
}

checkRound();
