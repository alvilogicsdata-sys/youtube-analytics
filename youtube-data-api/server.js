const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

// Import rate limiting middleware
const { globalRateLimiter } = require('./middleware/rateLimiter');

// Import database connection
const { connectDB } = require('./database/connection');

// Import services
const YouTubeAPIClient = require('./services/youtubeApiClient');
const YouTubeChannelService = require('./services/youtubeChannelService');
const YouTubeVideoService = require('./services/youtubeVideoService');
const YouTubeDataStorage = require('./database/storage');
const { addChannelFetchJob, addVideoFetchJob, getJobStatus } = require('./services/jobQueue');

// Import routes
const youtubeRoutes = require('./routes/youtube');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(globalRateLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize services
let youtubeClient, channelService, videoService;

// Initialize YouTube services
function initializeYouTubeServices() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('YOUTUBE_API_KEY environment variable is required');
    process.exit(1);
  }

  youtubeClient = new YouTubeAPIClient(apiKey);
  channelService = new YouTubeChannelService(apiKey);
  videoService = new YouTubeVideoService(apiKey);
}

// Database connection
connectDB();

// Initialize services
initializeYouTubeServices();

// Routes
app.use('/api/youtube', youtubeRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    apiUsage: youtubeClient ? youtubeClient.usage : 'Service not initialized'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`YouTube Data API server is running on port ${PORT}`);
});

module.exports = app;