// Database initialization script
// Run this once after creating the database
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  try {
    console.log('Starting database initialization...');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, '../config/database.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute SQL
    await pool.query(sql);
    
    console.log('✅ Database tables created successfully!');
    
    // Create admin user (optional - can be done via register endpoint)
    console.log('\n💡 To create admin user:');
    console.log('   1. Register via /api/auth/register');
    console.log('   2. Update role to admin in database:');
    console.log('      UPDATE users SET role = \'admin\' WHERE username = \'your_username\';');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initDatabase();

