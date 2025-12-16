const pool = require('../config/database');

async function inspect() {
    try {
        console.log('--- Tables ---');
        const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log(tables.rows.map(r => r.table_name));

        console.log('\n--- Users Table Columns ---');
        const users = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
        console.table(users.rows);

        console.log('\n--- Events Table Columns ---');
        const events = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'events'
    `);
        console.table(events.rows);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspect();
