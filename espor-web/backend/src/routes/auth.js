const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { authenticate } = require('../middleware/auth');

router.post('/register', async (req, res) => {
  try {
    console.log('[REGISTER] Request body:', req.body);
    const { username, password } = req.body;

    if (!username || !password) {
      console.log('[REGISTER] Missing fields - username:', !!username, 'password:', !!password);
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username.length < 3) {
      console.log('[REGISTER] Username too short:', username.length);
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
      console.log('[REGISTER] Password too short:', password.length);
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    console.log('[REGISTER] Attempting to register user:', username);
    const user = await authService.register(username, password);
    console.log('[REGISTER] Success! User ID:', user.id);
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    console.error('[REGISTER] Error:', error.message);
    console.error('[REGISTER] Stack:', error.stack);
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = await authService.login(username, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const pool = require('../config/database');
    const result = await pool.query(
      'SELECT id, username, role, disqualified FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

