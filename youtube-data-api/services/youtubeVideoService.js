const YouTubeAPIClient = require('./youtubeApiClient');
const db = require('../database/connection');

class YouTubeVideoService {
  constructor(apiKey) {
    this.client = new YouTubeAPIClient(apiKey);
  }

  // Fetch and store videos for a channel
  async fetchAndStoreChannelVideos(channelId, maxPages = 5) {
    try {
      console.log(`Fetching videos for channel: ${channelId}`);
      
      // Get all videos for the channel
      const allVideos = await this.client.fetchChannelVideosPaginated(channelId, maxPages);
      
      // Store each video in the database
      for (const video of allVideos) {
        await this.storeVideo(video);
      }
      
      console.log(`Stored ${allVideos.length} videos for channel: ${channelId}`);
      
      return allVideos;
    } catch (error) {
      console.error(`Error fetching videos for channel ${channelId}:`, error);
      throw error;
    }
  }

  // Store a single video in the database
  async storeVideo(videoData) {
    const query = `
      INSERT INTO videos (
        video_id, channel_id, title, description, published_at, 
        duration_seconds, view_count, like_count, comment_count, 
        thumbnail_url, is_short, category_id, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (video_id) 
      DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        published_at = EXCLUDED.published_at,
        duration_seconds = EXCLUDED.duration_seconds,
        view_count = EXCLUDED.view_count,
        like_count = EXCLUDED.like_count,
        comment_count = EXCLUDED.comment_count,
        thumbnail_url = EXCLUDED.thumbnail_url,
        is_short = EXCLUDED.is_short,
        category_id = EXCLUDED.category_id,
        tags = EXCLUDED.tags,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`;
    
    const values = [
      videoData.videoId,
      videoData.channelId,
      videoData.title,
      videoData.description,
      videoData.publishedAt,
      videoData.durationSeconds,
      videoData.viewCount,
      videoData.likeCount,
      videoData.commentCount,
      videoData.thumbnailUrl,
      videoData.isShort,
      videoData.categoryId,
      videoData.tags
    ];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error storing video in database:', error);
      throw error;
    }
  }

  // Get videos for a specific channel
  async getChannelVideos(channelId, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM videos 
      WHERE channel_id = $1 
      ORDER BY published_at DESC 
      LIMIT $2 OFFSET $3`;
    
    try {
      const result = await db.query(query, [channelId, limit, offset]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching videos from database:', error);
      throw error;
    }
  }

  // Get all videos with pagination
  async getAllVideos(limit = 50, offset = 0) {
    const query = `
      SELECT * FROM videos 
      ORDER BY published_at DESC 
      LIMIT $1 OFFSET $2`;
    
    try {
      const result = await db.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching all videos from database:', error);
      throw error;
    }
  }

  // Get video by ID
  async getVideoById(videoId) {
    const query = `SELECT * FROM videos WHERE video_id = $1`;
    
    try {
      const result = await db.query(query, [videoId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching video by ID:', error);
      throw error;
    }
  }

  // Get all shorts for a channel
  async getChannelShorts(channelId, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM videos 
      WHERE channel_id = $1 AND is_short = true 
      ORDER BY published_at DESC 
      LIMIT $2 OFFSET $3`;
    
    try {
      const result = await db.query(query, [channelId, limit, offset]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching shorts from database:', error);
      throw error;
    }
  }

  // Get video statistics for a channel
  async getVideoStats(channelId) {
    const query = `
      SELECT 
        COUNT(*) as total_videos,
        SUM(CASE WHEN is_short = true THEN 1 ELSE 0 END) as total_shorts,
        ROUND((SUM(CASE WHEN is_short = true THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2) as shorts_percentage,
        SUM(view_count) as total_views,
        AVG(view_count) as average_views
      FROM videos 
      WHERE channel_id = $1`;
    
    try {
      const result = await db.query(query, [channelId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching video stats from database:', error);
      throw error;
    }
  }
}

module.exports = YouTubeVideoService;