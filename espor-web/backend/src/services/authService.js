const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

class AuthService {
  async register(username, password) {
    // Kullanıcı adı kontrolü
    const existing = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existing.rows.length > 0) {
      throw new Error('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, role',
      [username, hashedPassword]
    );
    
    return result.rows[0];
  }

  async login(username, password) {
    const result = await pool.query(
      'SELECT id, username, password_hash, role, banned, disqualified FROM users WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }
    
    const user = result.rows[0];
    
    // Ban kontrolü
    if (user.banned) {
      const banCheck = await pool.query(
        'SELECT banned_until FROM users WHERE id = $1',
        [user.id]
      );
      if (banCheck.rows[0].banned_until && new Date(banCheck.rows[0].banned_until) > new Date()) {
        throw new Error('Account is banned');
      } else {
        // Ban süresi dolmuş
        await pool.query('UPDATE users SET banned = false WHERE id = $1', [user.id]);
      }
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    
    if (!valid) {
      throw new Error('Invalid credentials');
    }
    
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    return { 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        disqualified: user.disqualified
      } 
    };
  }

  async verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }
}

module.exports = new AuthService();

