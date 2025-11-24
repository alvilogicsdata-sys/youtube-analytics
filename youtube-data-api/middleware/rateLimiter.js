const rateLimit = require('express-rate-limit');

// Global rate limiting middleware
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Specific rate limiter for YouTube data API endpoints
const youTubeDataRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 requests per minute for YouTube data
  message: 'Too many YouTube data requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for channel fetching endpoints
const channelFetchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 channel fetch requests per minute
  message: 'Too many channel fetch requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  globalRateLimiter,
  youTubeDataRateLimiter,
  channelFetchRateLimiter
};