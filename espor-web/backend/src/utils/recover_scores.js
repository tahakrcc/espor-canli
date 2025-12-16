const pool = require('../config/database');

async function recoverScores() {
    try {
        // Check for rounds that are 'finished' but have no data in 'scores' table
        console.log('Finding unarchived finished rounds...');

        // Find finished rounds
        const rounds = await pool.query("SELECT id FROM game_rounds WHERE status = 'finished'");

        let recoveredCount = 0;

        for (const round of rounds.rows) {
            const scoreCheck = await pool.query('SELECT 1 FROM scores WHERE round_id = $1 LIMIT 1', [round.id]);

            if (scoreCheck.rowCount === 0) {
                console.log(`Recovering scores for Round ${round.id}...`);

                const insert = await pool.query(
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
           WHERE gr.id = $1 AND rp.score > 0`,
                    [round.id]
                );

                console.log(`  -> Inserted ${insert.rowCount} rows.`);
                recoveredCount += insert.rowCount;
            }
        }

        console.log(`Recovery complete. Total rows recovered: ${recoveredCount}`);

    } catch (error) {
        console.error(error);
    } finally {
        pool.end();
    }
}

recoverScores();
