const pool = require('../config/database');

const roundId = '4c6bc21d-0579-4946-b536-accb7a611526';

async function fixRound() {
    try {
        console.log(`Fixing round: ${roundId}`);
        const res = await pool.query("UPDATE game_rounds SET status = 'playing' WHERE id = $1", [roundId]);
        console.log(`Update count: ${res.rowCount}`);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        pool.end();
    }
}

fixRound();
