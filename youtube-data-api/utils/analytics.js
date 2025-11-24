// Utility functions for YouTube data analytics

// Calculate shorts percentage from video data
function calculateShortsPercentage(videos) {
  if (!videos || videos.length === 0) {
    return 0;
  }

  const totalVideos = videos.length;
  const shortsCount = videos.filter(video => video.is_short || video.isShort).length;
  
  return parseFloat(((shortsCount / totalVideos) * 100).toFixed(2));
}

// Determine if a video is a short based on multiple factors
function isShort(video) {
  // Check if already marked as short
  if (video.is_short !== undefined && video.is_short !== null) {
    return video.is_short;
  }
  
  // Check video duration (shorts are typically 60 seconds or less)
  if (video.duration_seconds && video.duration_seconds <= 60) {
    return true;
  }
  
  // Check for specific tags that indicate shorts
  if (video.tags && Array.isArray(video.tags)) {
    const hasShortTag = video.tags.some(tag => 
      tag.toLowerCase().includes('short') || 
      tag.toLowerCase().includes('shorts')
    );
    if (hasShortTag) return true;
  }
  
  // Check category ID (23 is typically YouTube Shorts category)
  if (video.category_id === '23' || video.categoryId === '23') {
    return true;
  }
  
  // Additional checks could include:
  // - Video being in a specific playlist for shorts
  // - Thumbnail aspect ratio (shorts often have 9:16)
  // - Title patterns that suggest it's a short
  
  return false;
}

// Additional analytics functions
function calculateEngagementRate(video) {
  if (!video.view_count || video.view_count === 0) {
    return 0;
  }
  
  const totalEngagement = (video.like_count || 0) + (video.comment_count || 0);
  return parseFloat(((totalEngagement / video.view_count) * 100).toFixed(2));
}

function categorizeVideoByLength(video) {
  if (!video.duration_seconds) return 'unknown';
  
  if (video.duration_seconds <= 60) return 'short';
  if (video.duration_seconds <= 300) return 'medium';
  if (video.duration_seconds <= 600) return 'long';
  return 'extended';
}

function getTrendingVideos(videos, days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return videos.filter(video => {
    const videoDate = new Date(video.published_at || video.publishedAt);
    return videoDate >= cutoffDate;
  });
}

module.exports = {
  calculateShortsPercentage,
  isShort,
  calculateEngagementRate,
  categorizeVideoByLength,
  getTrendingVideos
};