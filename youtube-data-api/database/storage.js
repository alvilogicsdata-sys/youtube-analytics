const db = require('../database/connection');

class YouTubeDataStorage {
  // Store or update a channel in the database
  async storeChannel(channelData) {
    const query = `
      INSERT INTO channels (
        channel_id, title, description, custom_url, thumbnail_url, 
        banner_url, subscriber_count, video_count, view_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (channel_id) 
      DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        custom_url = EXCLUDED.custom_url,
        thumbnail_url = EXCLUDED.thumbnail_url,
        banner_url = EXCLUDED.banner_url,
        subscriber_count = EXCLUDED.subscriber_count,
        video_count = EXCLUDED.video_count,
        view_count = EXCLUDED.view_count,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`;
    
    const values = [
      channelData.channelId,
      channelData.title,
      channelData.description,
      channelData.customUrl,
      channelData.thumbnailUrl,
      channelData.bannerUrl,
      channelData.subscriberCount,
      channelData.videoCount,
      channelData.viewCount
    ];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error storing channel in database:', error);
      throw error;
    }
  }

  // Store or update multiple videos in the database
  async storeVideos(videos) {
    if (!videos || videos.length === 0) {
      return [];
    }

    const insertPromises = videos.map(video => this.storeVideo(video));
    return await Promise.all(insertPromises);
  }

  // Store or update a single video in the database
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
      videoData.tags || []
    ];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error storing video in database:', error);
      throw error;
    }
  }

  // Update channel analytics in the database
  async updateChannelAnalytics(channelId, analyticsData) {
    const query = `
      INSERT INTO channel_analytics (
        channel_id, total_videos, total_shorts, shorts_percentage, 
        total_views, average_view_count
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (channel_id)
      DO UPDATE SET
        total_videos = EXCLUDED.total_videos,
        total_shorts = EXCLUDED.total_shorts,
        shorts_percentage = EXCLUDED.shorts_percentage,
        total_views = EXCLUDED.total_views,
        average_view_count = EXCLUDED.average_view_count,
        calculated_at = CURRENT_TIMESTAMP
      RETURNING *`;
    
    const values = [
      channelId,
      analyticsData.totalVideos,
      analyticsData.totalShorts,
      analyticsData.shortsPercentage,
      analyticsData.totalViews,
      analyticsData.averageViewCount
    ];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating channel analytics:', error);
      throw error;
    }
  }

  // Get channel by ID
  async getChannelById(channelId) {
    const query = 'SELECT * FROM channels WHERE channel_id = $1';
    
    try {
      const result = await db.query(query, [channelId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching channel from database:', error);
      throw error;
    }
  }

  // Get all channels
  async getAllChannels(limit = 50, offset = 0) {
    const query = 'SELECT * FROM channels ORDER BY updated_at DESC LIMIT $1 OFFSET $2';
    
    try {
      const result = await db.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching channels from database:', error);
      throw error;
    }
  }

  // Get videos by channel ID with pagination
  async getVideosByChannelId(channelId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      sortBy = 'published_at',
      sortOrder = 'DESC',
      includeShorts = null // null for all, true for only shorts, false for only non-shorts
    } = options;
    
    let query = 'SELECT * FROM videos WHERE channel_id = $1';
    const params = [channelId];
    let paramIndex = 2;
    
    if (includeShorts !== null) {
      query += ` AND is_short = $${paramIndex}`;
      params.push(includeShorts);
      paramIndex++;
    }
    
    query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    try {
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error fetching videos from database:', error);
      throw error;
    }
  }

  // Get channel analytics
  async getChannelAnalytics(channelId) {
    const query = `
      SELECT 
        total_videos,
        total_shorts,
        shorts_percentage,
        total_views,
        average_view_count,
        calculated_at
      FROM channel_analytics 
      WHERE channel_id = $1`;
    
    try {
      const result = await db.query(query, [channelId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching channel analytics from database:', error);
      throw error;
    }
  }

  // Calculate and store channel analytics
  async calculateAndStoreChannelAnalytics(channelId) {
    // Get video stats for the channel
    const statsQuery = `
      SELECT 
        COUNT(*) as total_videos,
        SUM(CASE WHEN is_short = true THEN 1 ELSE 0 END) as total_shorts,
        SUM(view_count) as total_views,
        AVG(view_count) as average_view_count
      FROM videos 
      WHERE channel_id = $1`;
    
    try {
      const statsResult = await db.query(statsQuery, [channelId]);
      const stats = statsResult.rows[0];
      
      // Calculate percentage
      const shortsPercentage = stats.total_videos > 0 
        ? parseFloat(((stats.total_shorts / stats.total_videos) * 100).toFixed(2))
        : 0;
      
      // Prepare analytics data
      const analyticsData = {
        totalVideos: parseInt(stats.total_videos),
        totalShorts: parseInt(stats.total_shorts),
        shortsPercentage: shortsPercentage,
        totalViews: parseInt(stats.total_views) || 0,
        averageViewCount: parseFloat(stats.average_view_count) || 0
      };
      
      // Store in database
      return await this.updateChannelAnalytics(channelId, analyticsData);
    } catch (error) {
      console.error('Error calculating and storing channel analytics:', error);
      throw error;
    }
  }
}

module.exports = new YouTubeDataStorage();