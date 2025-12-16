const { Pool } = require('pg');

const password = 'p7uN8bvkXqV12DbAvgYdMXqTDaMJj70';
const host = 'dpg-d4vllpmr433s73e89jfg-a.frankfurt-postgres.render.com';
const port = 5432;

const variations = [
    { user: 'inonuespor_user', db: 'inonuespor' }, // Orijinal
    { user: 'espor_user', db: 'espor_db' },       // render.yaml'dan tahmin
    { user: 'espor_user', db: 'inonuespor' },
    { user: 'inonuespor_user', db: 'espor_db' },
];

async function testConnection() {
    for (const v of variations) {
        const connectionString = `postgresql://${v.user}:${password}@${host}:${port}/${v.db}`;
        console.log(`Testing: user=${v.user}, db=${v.db}`);
        const pool = new Pool({
            connectionString,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000,
        });

        try {
            await pool.query('SELECT NOW()');
            console.log(`SUCCESS: Connected with user=${v.user}, db=${v.db}`);
            console.log(`VALID_URL=${connectionString}`);
            process.exit(0);
        } catch (err) {
            console.log(`FAILED: ${err.message}`);
        }
        await pool.end();
    }
    console.log('All attempts failed');
    process.exit(1);
}

testConnection();
