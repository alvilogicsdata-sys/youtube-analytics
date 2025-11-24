const axios = require('axios');
const NodeCache = require('node-cache');
const { RateLimiterMemory } = require('rate-limiter-flexible');

// Create a cache instance (1000 seconds = ~16.67 minutes)
const apiCache = new NodeCache({ stdTTL: 1000, checkperiod: 1200 });

// Create a rate limiter (10,000 units per day for YouTube API)
// YouTube API has a quota of 10,000 units per day by default
const rateLimiter = new RateLimiterMemory({
  points: 10000, // Number of points (API quota units)
  duration: 24 * 60 * 60, // Per 24 hours (in seconds)
});

// Alternative rate limiter for requests per minute (more granular control)
const minuteRateLimiter = new RateLimiterMemory({
  points: 100, // 100 requests per minute
  duration: 60, // Per 60 seconds
});

class YouTubeAPIClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://www.googleapis.com/youtube/v3';
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Track API usage for monitoring
    this.usage = {
      totalRequests: 0,
      requestsToday: 0,
      lastReset: new Date()
    };
  }

  async makeRequest(endpoint, params = {}, cost = 1) {
    try {
      // Add API key to params
      params.key = this.apiKey;

      // Multiple rate limiting layers
      try {
        // First, check daily quota
        await rateLimiter.consume(cost);
        // Then, check minute limit
        await minuteRateLimiter.consume(1);
      } catch (rateLimitError) {
        console.warn('Rate limit reached, waiting before retrying...');
        // Wait and retry after delay
        await this.delay(5000); // Wait 5 seconds
        try {
          await rateLimiter.consume(cost);
          await minuteRateLimiter.consume(1);
        } catch (retryError) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
      }

      // Update usage tracking
      this.usage.totalRequests++;
      this.usage.requestsToday++;

      // Reset daily counter if needed
      const now = new Date();
      if (now.getDate() !== this.usage.lastReset.getDate()) {
        this.usage.requestsToday = 0;
        this.usage.lastReset = now;
      }

      // Check cache first
      const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
      const cachedResponse = apiCache.get(cacheKey);
      if (cachedResponse) {
        console.log(`Cache hit for: ${cacheKey}`);
        return cachedResponse;
      }

      // Make the API request
      const response = await this.axiosInstance.get(endpoint, { params });

      // Cache the response (for 10 minutes)
      // For different endpoints, we might want different cache times
      let cacheTTL = 600; // Default 10 minutes
      if (endpoint.includes('/search') || endpoint.includes('/videos')) {
        cacheTTL = 300; // 5 minutes for video data
      } else if (endpoint.includes('/channels')) {
        cacheTTL = 1800; // 30 minutes for channel data
      }

      apiCache.set(cacheKey, response.data, cacheTTL);

      return response.data;
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('YouTube API Error:', error.response.status, error.response.data);

        // Handle specific YouTube API errors
        if (error.response.status === 403) {
          console.error('Rate limit exceeded or API key invalid');
          // If it's a quota error, we might want to reduce the rate limit
          if (error.response.data?.error?.errors?.[0]?.reason === 'quotaExceeded') {
            console.error('Daily quota exceeded, consider reducing API usage');
          }
        } else if (error.response.status === 404) {
          console.error('Requested resource not found');
        } else if (error.response.status >= 500) {
          console.error('YouTube server error');
        }

        throw new Error(`YouTube API Error: ${error.response.status} - ${error.response.data?.error?.message || 'Unknown error'}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received from YouTube API:', error.message);
        throw new Error(`Network error: ${error.message}`);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', error.message);
        throw new Error(`Request error: ${error.message}`);
      }
    }
  }

  // Helper method to delay execution
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Fetch channel details by channel ID or username
  async getChannelInfo(id, type = 'id') {
    const params = {
      [type]: id,
      part: 'snippet,statistics'
    };

    const response = await this.makeRequest('/channels', params);
    
    if (!response.items || response.items.length === 0) {
      throw new Error(`Channel not found: ${id}`);
    }

    const channel = response.items[0];
    return {
      channelId: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      customUrl: channel.snippet.customUrl,
      thumbnailUrl: channel.snippet.thumbnails?.high?.url || channel.snippet.thumbnails?.default?.url,
      bannerUrl: channel.snippet.brandingSettings?.image?.bannerImageUrl,
      subscriberCount: parseInt(channel.statistics.subscriberCount) || 0,
      videoCount: parseInt(channel.statistics.videoCount) || 0,
      viewCount: parseInt(channel.statistics.viewCount) || 0
    };
  }

  // Fetch videos from a channel
  async getChannelVideos(channelId, maxResults = 50, pageToken = null) {
    const params = {
      channelId: channelId,
      part: 'snippet,contentDetails,statistics',
      order: 'date',
      maxResults: maxResults,
      pageToken: pageToken || undefined
    };

    const response = await this.makeRequest('/search', params);
    
    if (!response.items) {
      return { videos: [], nextPageToken: null };
    }

    const videoIds = response.items
      .filter(item => item.id.kind === 'youtube#video')
      .map(item => item.id.videoId)
      .join(',');

    // If no videos found, return empty array
    if (!videoIds) {
      return { videos: [], nextPageToken: response.nextPageToken || null };
    }

    // Get detailed video information
    const videoDetails = await this.getVideoDetails(videoIds);
    
    // Combine search results with detailed video info
    const videos = response.items
      .filter(item => item.id.kind === 'youtube#video')
      .map(item => {
        const detailedVideo = videoDetails.find(v => v.videoId === item.id.videoId);
        return detailedVideo ? { ...detailedVideo, publishedAt: item.snippet.publishedAt } : null;
      })
      .filter(Boolean); // Remove null values

    return {
      videos: videos,
      nextPageToken: response.nextPageToken || null
    };
  }

  // Get detailed information for specific videos
  async getVideoDetails(videoIds) {
    const params = {
      id: videoIds,
      part: 'snippet,contentDetails,statistics'
    };

    const response = await this.makeRequest('/videos', params);

    if (!response.items) {
      return [];
    }

    return response.items.map(video => {
      // Calculate duration in seconds from ISO 8601 format (PT#M#S)
      const duration = this.parseDuration(video.contentDetails.duration);
      
      // Check if video is a short
      const isShort = this.isShort(video.snippet.categoryId, duration, video.snippet.tags);
      
      return {
        videoId: video.id,
        channelId: video.snippet.channelId,
        title: video.snippet.title,
        description: video.snippet.description,
        publishedAt: video.snippet.publishedAt,
        durationSeconds: duration,
        viewCount: parseInt(video.statistics.viewCount) || 0,
        likeCount: parseInt(video.statistics.likeCount) || 0,
        commentCount: parseInt(video.statistics.commentCount) || 0,
        thumbnailUrl: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url,
        isShort: isShort,
        categoryId: video.snippet.categoryId,
        tags: video.snippet.tags || []
      };
    });
  }

  // Parse ISO 8601 duration to seconds
  parseDuration(duration) {
    // ISO 8601 format: PT1H2M10S (1 hour, 2 minutes, 10 seconds)
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = duration.match(regex);
    
    if (!matches) return 0;
    
    const hours = parseInt(matches[1]) || 0;
    const minutes = parseInt(matches[2]) || 0;
    const seconds = parseInt(matches[3]) || 0;
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  // Determine if a video is a short
  isShort(categoryId, duration, tags) {
    // Shorts are typically under 60 seconds
    if (duration <= 60) {
      return true;
    }
    
    // Check for specific tags that indicate shorts
    if (tags && tags.some(tag => 
      tag.toLowerCase().includes('short') || 
      tag.toLowerCase().includes('shorts')
    )) {
      return true;
    }
    
    // Category ID 23 is for YouTube Shorts (as per YouTube's category system)
    if (categoryId === '23') {
      return true;
    }
    
    // For now, if duration is under 61 seconds, we'll consider it a short
    // This is a simplified approach - in production, you'd need more sophisticated detection
    return duration <= 61;
  }
}

module.exports = YouTubeAPIClient;