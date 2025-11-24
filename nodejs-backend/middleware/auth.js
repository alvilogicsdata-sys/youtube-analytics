const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

const authenticateToken = async (req, res, next) => {
  // Get token from header or cookie
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  const cookieToken = req.cookies ? req.cookies.token : null;
  
  const authToken = token || cookieToken;

  if (!authToken) {
    return res.status(401).json({ message: 'Access token is required' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(authToken, JWT_SECRET);
    req.user = decoded;

    // Optional: Check if user still exists in DB (for revocation scenarios)
    // This is an additional security measure
    const cachedUser = await redisClient.get(`user:${decoded.userId}`);
    if (!cachedUser) {
      // If not in cache, verify user exists in DB
      // In a real application, you might want to fetch from DB and cache
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Token has expired' });
    }
    return res.status(403).json({ message: 'Invalid token' });
  }
};

module.exports = {
  authenticateToken
};