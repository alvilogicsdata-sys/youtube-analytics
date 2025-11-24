const express = require('express');
const router = express.Router();
const { youTubeDataRateLimiter, channelFetchRateLimiter } = require('../middleware/rateLimiter');
const YouTubeChannelService = require('../services/youtubeChannelService');
const YouTubeVideoService = require('../services/youtubeVideoService');
const YouTubeDataStorage = require('../database/storage');
const { addChannelFetchJob, addVideoFetchJob, getJobStatus } = require('../services/jobQueue');
const { calculateShortsPercentage } = require('../utils/analytics');

// Initialize services with API key
const apiKey = process.env.YOUTUBE_API_KEY;
const channelService = new YouTubeChannelService(apiKey);
const videoService = new YouTubeVideoService(apiKey);

// Fetch and store channel details
router.post('/channels/fetch', channelFetchRateLimiter, async (req, res) => {
  try {
    const { channelId } = req.body;
    
    if (!channelId) {
      return res.status(400).json({ error: 'Channel ID is required' });
    }
    
    // Add job to queue for processing
    const job = await addChannelFetchJob(channelId, 1, apiKey);
    
    res.status(200).json({ 
      message: 'Channel fetch job queued successfully', 
      jobId: job.id,
      channelId: channelId
    });
  } catch (error) {
    console.error('Error queuing channel fetch:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch videos for a channel
router.post('/channels/:channelId/videos/fetch', channelFetchRateLimiter, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { maxPages } = req.body;
    
    if (!channelId) {
      return res.status(400).json({ error: 'Channel ID is required' });
    }
    
    // Add job to queue for processing
    const job = await addVideoFetchJob(channelId, maxPages, 1, apiKey);
    
    res.status(200).json({ 
      message: 'Video fetch job queued successfully', 
      jobId: job.id,
      channelId: channelId
    });
  } catch (error) {
    console.error('Error queuing video fetch:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get channel details
router.get('/channels/:channelId', youTubeDataRateLimiter, async (req, res) => {
  try {
    const { channelId } = req.params;
    
    const channel = await YouTubeDataStorage.getChannelById(channelId);
    
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found in database' });
    }
    
    res.status(200).json({ channel });
  } catch (error) {
    console.error('Error fetching channel:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get videos for a channel
router.get('/channels/:channelId/videos', youTubeDataRateLimiter, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { limit = 50, offset = 0, includeShorts } = req.query;
    
    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
    };
    
    if (includeShorts !== undefined) {
      options.includeShorts = includeShorts === 'true';
    }
    
    const videos = await YouTubeDataStorage.getVideosByChannelId(channelId, options);
    
    res.status(200).json({ videos, count: videos.length });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get channel analytics
router.get('/channels/:channelId/analytics', youTubeDataRateLimiter, async (req, res) => {
  try {
    const { channelId } = req.params;
    
    // Get stored analytics
    let analytics = await YouTubeDataStorage.getChannelAnalytics(channelId);
    
    // If no analytics exist, calculate and store them
    if (!analytics) {
      analytics = await YouTubeDataStorage.calculateAndStoreChannelAnalytics(channelId);
    }
    
    // If we still have no analytics, it might be because there are no videos yet
    if (!analytics) {
      // Calculate on-the-fly
      const videos = await YouTubeDataStorage.getVideosByChannelId(channelId, { limit: 10000, offset: 0 });
      
      const totalVideos = videos.length;
      const totalShorts = videos.filter(v => v.is_short).length;
      const shortsPercentage = totalVideos > 0 ? parseFloat(((totalShorts / totalVideos) * 100).toFixed(2)) : 0;
      
      analytics = {
        total_videos: totalVideos,
        total_shorts: totalShorts,
        shorts_percentage: shortsPercentage,
        calculated_at: new Date()
      };
    }
    
    res.status(200).json({ analytics });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get video details by ID
router.get('/videos/:videoId', youTubeDataRateLimiter, async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const video = await videoService.getVideoById(videoId);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    res.status(200).json({ video });
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all channels
router.get('/channels', youTubeDataRateLimiter, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const channels = await YouTubeDataStorage.getAllChannels(parseInt(limit), parseInt(offset));
    
    res.status(200).json({ channels, count: channels.length });
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get job status
router.get('/jobs/:jobId', youTubeDataRateLimiter, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const jobStatus = await getJobStatus(jobId);
    
    if (!jobStatus) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.status(200).json({ job: jobStatus });
  } catch (error) {
    console.error('Error fetching job status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Calculate shorts percentage for a channel (on-demand calculation)
router.post('/channels/:channelId/calculate-shorts', youTubeDataRateLimiter, async (req, res) => {
  try {
    const { channelId } = req.params;
    
    // Get all videos for the channel
    const videos = await YouTubeDataStorage.getVideosByChannelId(channelId, { 
      limit: 10000, 
      offset: 0 
    });
    
    // Calculate shorts percentage
    const shortsPercentage = calculateShortsPercentage(videos);
    
    // Update the stored analytics
    const analytics = await YouTubeDataStorage.calculateAndStoreChannelAnalytics(channelId);
    
    res.status(200).json({ 
      shortsPercentage,
      totalVideos: videos.length,
      totalShorts: videos.filter(v => v.is_short).length,
      analytics 
    });
  } catch (error) {
    console.error('Error calculating shorts percentage:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;