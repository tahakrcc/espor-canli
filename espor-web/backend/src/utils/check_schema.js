const pool = require('../config/database');

async function checkSchema() {
    try {
        const res = await pool.query(`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'round_participants' AND column_name = 'status'
    `);
        console.table(res.rows);
    } catch (error) {
        console.error(error);
    } finally {
        pool.end();
    }
}

checkSchema();
