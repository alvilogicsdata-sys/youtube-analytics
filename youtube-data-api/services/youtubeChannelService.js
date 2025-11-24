const YouTubeAPIClient = require('./youtubeApiClient');
const db = require('../database/connection');
const { calculateShortsPercentage } = require('../utils/analytics');

class YouTubeChannelService {
  constructor(apiKey) {
    this.client = new YouTubeAPIClient(apiKey);
  }

  // Fetch and store channel details
  async fetchAndStoreChannel(channelId) {
    try {
      console.log(`Fetching channel details for: ${channelId}`);
      
      // Get channel info from YouTube API
      const channelData = await this.client.getChannelInfo(channelId, 'id');
      
      // Store or update in database
      const storedChannel = await this.storeChannel(channelData);
      
      return storedChannel;
    } catch (error) {
      console.error(`Error fetching channel ${channelId}:`, error);
      throw error;
    }
  }

  // Store channel data in database
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

  // Fetch multiple pages of videos for a channel
  async fetchChannelVideosPaginated(channelId, maxPages = 5) {
    let allVideos = [];
    let pageToken = null;
    let pagesFetched = 0;
    
    try {
      do {
        console.log(`Fetching page ${pagesFetched + 1} of videos for channel: ${channelId}`);
        
        const result = await this.client.getChannelVideos(channelId, 50, pageToken);
        allVideos = allVideos.concat(result.videos);
        
        pageToken = result.nextPageToken;
        pagesFetched++;
        
        // Stop if we've reached max pages or no more pages
      } while (pageToken && pagesFetched < maxPages);
      
      console.log(`Fetched ${allVideos.length} videos for channel: ${channelId}`);
      
      return allVideos;
    } catch (error) {
      console.error(`Error fetching videos for channel ${channelId}:`, error);
      throw error;
    }
  }

  // Get channel analytics summary
  async getChannelAnalytics(channelId) {
    // This would typically aggregate data from the videos table
    // For now, we'll return a placeholder that shows the calculation
    const query = `
      SELECT 
        COUNT(*) as total_videos,
        SUM(CASE WHEN is_short = true THEN 1 ELSE 0 END) as total_shorts,
        ROUND(
          (SUM(CASE WHEN is_short = true THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2
        ) as shorts_percentage
      FROM videos 
      WHERE channel_id = $1`;
    
    try {
      const result = await db.query(query, [channelId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error calculating channel analytics:', error);
      throw error;
    }
  }

  // Update channel analytics summary in database
  async updateChannelAnalytics(channelId) {
    const analytics = await this.getChannelAnalytics(channelId);
    
    const query = `
      INSERT INTO channel_analytics (
        channel_id, total_videos, total_shorts, shorts_percentage
      ) VALUES ($1, $2, $3, $4)
      ON CONFLICT (channel_id)
      DO UPDATE SET
        total_videos = EXCLUDED.total_videos,
        total_shorts = EXCLUDED.total_shorts,
        shorts_percentage = EXCLUDED.shorts_percentage,
        calculated_at = CURRENT_TIMESTAMP
      RETURNING *`;
    
    const values = [
      channelId,
      analytics.total_videos,
      analytics.total_shorts,
      analytics.shorts_percentage
    ];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating channel analytics:', error);
      throw error;
    }
  }
}

module.exports = YouTubeChannelService;