const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const redisClient = require('../config/redis');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

// Register a new user
const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await db.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashedPassword]
    );

    res.status(201).json({ message: 'User registered successfully', user: newUser.rows[0] });
  } catch (error) {
    next(error);
  }
};

// Login user
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set token in cookie (optional)
    res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }); // 24 hours

    // Cache user in Redis for faster access
    await redisClient.setex(`user:${user.id}`, 3600, JSON.stringify(user)); // 1 hour cache

    res.json({ 
      message: 'Login successful', 
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    next(error);
  }
};

// Logout user
const logout = async (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
};

// Get user profile
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Check if user data is cached in Redis
    const cachedUser = await redisClient.get(`user:${userId}`);
    if (cachedUser) {
      return res.json({ user: JSON.parse(cachedUser) });
    }

    // Fetch from database
    const userResult = await db.query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Cache user in Redis
    await redisClient.setex(`user:${user.id}`, 3600, JSON.stringify(user)); // 1 hour cache

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile
};