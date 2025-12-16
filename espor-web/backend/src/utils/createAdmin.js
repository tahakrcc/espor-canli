// Admin kullanıcısı oluşturmak için script
// Kullanım: node src/utils/createAdmin.js

const bcrypt = require('bcrypt');
const pool = require('../config/database');

async function createAdmin() {
  const username = 'TK';
  const password = 'taha';
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) ON CONFLICT (username) DO UPDATE SET password_hash = $2, role = $3 RETURNING id, username, role',
      [username, hashedPassword, 'admin']
    );
    
    console.log('Admin user created/updated:', result.rows[0]);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();

