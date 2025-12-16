const pool = require('../config/database');

async function dropAllTables() {
    try {
        console.log('Dropping all tables...');

        // Get all table names
        const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

        // Drop each table with CASCADE
        for (const row of result.rows) {
            console.log(`Dropping table: ${row.table_name}`);
            await pool.query(`DROP TABLE IF EXISTS "${row.table_name}" CASCADE`);
        }

        // Also drop custom types if any (like enum types used in the old schema)
        await pool.query(`DROP TYPE IF EXISTS "USER-DEFINED" CASCADE`); // Note: Postgres handles types differently, usually specific DROP TYPE names are needed.
        // A more generic approach for enum types:
        /*
        const types = await pool.query(`
            SELECT typname FROM pg_type WHERE typtype = 'e' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        `);
        for (const type of types.rows) {
             await pool.query(`DROP TYPE IF EXISTS "${type.typname}" CASCADE`);
        }
        */

        console.log('All tables dropped successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error dropping tables:', err);
        process.exit(1);
    }
}

dropAllTables();
