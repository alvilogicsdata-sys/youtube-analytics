// src/nicheViabilityAnalyzer.js
const moment = require('moment');

/**
 * Calculates the Niche Viability Score based on multiple factors
 * @param {Object} data - The input data for the calculation
 * @param {Array<Object>} data.videos - Array of video objects with view counts
 * @param {number} data.monthlyGrowth - Percentage growth per month
 * @param {number} data.competingChannels - Number of competing channels
 * @param {number} data.shortsPercentage - Percentage of shorts in content (0-100)
 * @param {number} data.engagementRate - Engagement rate as a percentage (0-100)
 * @param {number} data.competitorAvgViews - Average views for competing channels
 * @returns {Object} - The Niche Viability Score and detailed breakdown
 */
function calculateNicheViabilityScore(data) {
  // Validate input data
  if (!data || typeof data !== 'object') {
    throw new Error('Input data must be an object');
  }

  // Calculate base factors
  const viewsPerVideoScore = calculateViewsPerVideoScore(data.videos || []);
  const monthlyGrowthScore = calculateMonthlyGrowthScore(data.monthlyGrowth || 0);
  const competingChannelsScore = calculateCompetingChannelsScore(
    data.competingChannels || 0,
    data.competitorAvgViews || 0,
    data.videos?.length || 0
  );
  const shortsPercentageScore = calculateShortsPercentageScore(data.shortsPercentage || 0);
  const engagementRateScore = calculateEngagementRateScore(data.engagementRate || 0);

  // Apply weights to each factor
  const weights = {
    viewsPerVideo: 0.25,      // 25% weight
    monthlyGrowth: 0.20,      // 20% weight
    competingChannels: 0.20,  // 20% weight
    shortsPercentage: 0.15,   // 15% weight
    engagementRate: 0.20      // 20% weight
  };

  // Calculate weighted score
  const weightedScore = 
    (viewsPerVideoScore * weights.viewsPerVideo) +
    (monthlyGrowthScore * weights.monthlyGrowth) +
    (competingChannelsScore * weights.competingChannels) +
    (shortsPercentageScore * weights.shortsPercentage) +
    (engagementRateScore * weights.engagementRate);

  // Normalize to 0-100 scale
  const normalizedScore = Math.min(100, Math.max(0, weightedScore));

  // Determine viability category
  let category = 'Very Low';
  if (normalizedScore >= 80) category = 'Very High';
  else if (normalizedScore >= 60) category = 'High';
  else if (normalizedScore >= 40) category = 'Medium';
  else if (normalizedScore >= 20) category = 'Low';

  return {
    score: normalizedScore,
    category,
    factors: {
      viewsPerVideo: {
        score: viewsPerVideoScore,
        value: calculateAverageViews(data.videos || []),
        maxPossible: 100
      },
      monthlyGrowth: {
        score: monthlyGrowthScore,
        value: data.monthlyGrowth || 0,
        maxPossible: 100
      },
      competingChannels: {
        score: competingChannelsScore,
        value: data.competingChannels || 0,
        competitorAvgViews: data.competitorAvgViews || 0,
        maxPossible: 100
      },
      shortsPercentage: {
        score: shortsPercentageScore,
        value: data.shortsPercentage || 0,
        maxPossible: 100
      },
      engagementRate: {
        score: engagementRateScore,
        value: data.engagementRate || 0,
        maxPossible: 100
      }
    },
    weights
  };
}

/**
 * Calculates the views per video score with weighting
 * @param {Array} videos - Array of video objects with view counts
 * @returns {number} - Score from 0-100
 */
function calculateViewsPerVideoScore(videos) {
  if (!Array.isArray(videos) || videos.length === 0) {
    return 0;
  }

  // Calculate average views
  const avgViews = calculateAverageViews(videos);
  
  // Logarithmic scale to account for YouTube's view distribution
  // Higher views get diminishing returns as they scale
  if (avgViews === 0) return 0;
  
  // Using logarithmic scale: log10(x + 1) * 20 gives diminishing returns
  // Calibrated to give 100 at ~1M average views
  let score = Math.log10(avgViews + 1) * 20;
  
  // Cap at 100
  return Math.min(100, score);
}

/**
 * Helper function to calculate average views from video data
 * @param {Array} videos - Array of video objects with view counts
 * @returns {number} - Average views
 */
function calculateAverageViews(videos) {
  if (!Array.isArray(videos) || videos.length === 0) {
    return 0;
  }

  const totalViews = videos.reduce((sum, video) => sum + (video.view_count || video.viewCount || 0), 0);
  return totalViews / videos.length;
}

/**
 * Calculates the monthly growth score
 * @param {number} growthPercentage - Monthly growth percentage
 * @returns {number} - Score from 0-100
 */
function calculateMonthlyGrowthScore(growthPercentage) {
  // Growth percentage is already a ratio, convert to score
  // Positive growth gets higher scores
  // Negative growth gets lower scores
  
  if (growthPercentage < 0) {
    // For negative growth, use inverse scaling
    return Math.max(0, 50 - Math.abs(growthPercentage) * 2);
  } else if (growthPercentage <= 10) {
    // Scale 0-10% linearly to 50-75
    return 50 + (growthPercentage / 10) * 25;
  } else if (growthPercentage <= 50) {
    // Scale 10-50% linearly to 75-90
    return 75 + ((growthPercentage - 10) / 40) * 15;
  } else {
    // Above 50% growth, max out at 95
    return Math.min(95, 90 + Math.log10(growthPercentage / 50 + 1) * 5);
  }
}

/**
 * Calculates the competing channels score
 * @param {number} competingChannels - Number of competing channels
 * @param {number} competitorAvgViews - Average views for competing channels
 * @param {number} myChannelVideoCount - Number of videos in my channel
 * @returns {number} - Score from 0-100
 */
function calculateCompetingChannelsScore(competingChannels, competitorAvgViews, myChannelVideoCount) {
  if (competingChannels === 0) {
    // No competition is perfect, but adjust based on other factors
    return 100;
  }

  // Calculate competition intensity (views per competing channel)
  const competitionIntensity = competitorAvgViews * competingChannels;
  
  // Calculate market saturation score
  // Higher number of competitors with high average views = lower score
  let score = 100;
  
  // Base penalty for number of competitors
  score -= Math.min(50, competingChannels * 2); // Max 50% penalty for competitors
  
  // Penalty for high average competitor views
  if (competitorAvgViews > 100000) {
    score -= 30; // Heavy penalty for competitors with 100k+ avg views
  } else if (competitorAvgViews > 50000) {
    score -= 20; // Medium penalty for competitors with 50k+ avg views
  } else if (competitorAvgViews > 10000) {
    score -= 10; // Light penalty for competitors with 10k+ avg views
  }
  
  // Bonus if your channel has more videos than average competitor
  if (myChannelVideoCount > (1000 / (competingChannels + 1))) {
    score += 10; // Small bonus for content volume
  }
  
  // Ensure score stays within bounds
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculates the shorts percentage score
 * @param {number} shortsPercentage - Percentage of shorts (0-100)
 * @returns {number} - Score from 0-100
 */
function calculateShortsPercentageScore(shortsPercentage) {
  // Optimal shorts percentage depends on niche
  // For now, assume 20-50% is optimal for most niches
  const optimalMin = 20;
  const optimalMax = 50;
  
  if (shortsPercentage >= optimalMin && shortsPercentage <= optimalMax) {
    // Perfect score in optimal range
    return 100;
  } else if (shortsPercentage < optimalMin) {
    // Lower score for having too few shorts
    const diff = optimalMin - shortsPercentage;
    return Math.max(30, 100 - (diff * 2)); // Minimum 30 for low shorts
  } else {
    // Lower score for having too many shorts
    const diff = shortsPercentage - optimalMax;
    return Math.max(20, 100 - (diff * 1.5)); // Minimum 20 for too many shorts
  }
}

/**
 * Calculates the engagement rate score
 * @param {number} engagementRate - Engagement rate as a percentage (0-100)
 * @returns {number} - Score from 0-100
 */
function calculateEngagementRateScore(engagementRate) {
  // Engagement rate above 3% is considered good for YouTube
  if (engagementRate >= 10) {
    return 100; // Excellent engagement
  } else if (engagementRate >= 5) {
    return 80 + ((engagementRate - 5) / 5) * 20; // 80-100 for 5-10%
  } else if (engagementRate >= 3) {
    return 50 + ((engagementRate - 3) / 2) * 30; // 50-80 for 3-5%
  } else if (engagementRate >= 1) {
    return 20 + (engagementRate - 1) * 15; // 20-50 for 1-3%
  } else {
    return Math.max(0, engagementRate * 20); // 0-20 for 0-1%
  }
}

/**
 * Estimates potential revenue based on channel metrics
 * @param {Object} data - Channel data for revenue estimation
 * @param {number} data.avgMonthlyViews - Average monthly views
 * @param {number} data.engagementRate - Engagement rate as percentage
 * @param {number} data.shortsPercentage - Percentage of shorts content (0-100)
 * @param {number} data.cpm - CPM (revenue per 1000 views) in USD
 * @param {number} data.subscriberCount - Number of subscribers
 * @param {string} data.niche - Channel niche (affects CPM)
 * @returns {Object} - Revenue estimates and breakdown
 */
function estimateRevenue(data) {
  // Default CPM based on niche (if not provided)
  const defaultCpm = {
    'tech': 5,
    'finance': 8,
    'gaming': 4,
    'lifestyle': 3,
    'education': 4,
    'cooking': 3,
    'fitness': 4,
    'travel': 5,
    'beauty': 3,
    'general': 4
  };

  const cpm = data.cpm || defaultCpm[data.niche?.toLowerCase()] || 4;
  
  // Calculate monthly revenue
  const monthlyRevenue = (data.avgMonthlyViews || 0) * (cpm / 1000);
  
  // Calculate yearly revenue
  const yearlyRevenue = monthlyRevenue * 12;
  
  // Calculate revenue from different sources
  const revenueBreakdown = {
    adRevenue: monthlyRevenue * 0.65, // 65% from ads
    sponsorshipRevenue: monthlyRevenue * 0.20, // 20% from sponsorships (if applicable)
    affiliateRevenue: monthlyRevenue * 0.10, // 10% from affiliate marketing (if applicable)
    otherRevenue: monthlyRevenue * 0.05 // 5% from other sources
  };
  
  // Adjust based on shorts percentage (shorts typically earn less)
  const shortsAdjustment = 1 - (data.shortsPercentage || 0) * 0.003; // Each 1% shorts reduces revenue by 0.3%
  const adjustedMonthlyRevenue = monthlyRevenue * shortsAdjustment;
  const adjustedYearlyRevenue = adjustedMonthlyRevenue * 12;
  
  // Subscriber-based revenue estimation
  const subRevenue = (data.subscriberCount || 0) * 0.01; // $0.01 per subscriber per month as approximation
  const estimatedMonthlyFromSubs = Math.min(subRevenue, adjustedMonthlyRevenue * 0.1); // Max 10% from subs
  
  return {
    monthlyRevenue: {
      estimated: adjustedMonthlyRevenue + estimatedMonthlyFromSubs,
      adRevenue: revenueBreakdown.adRevenue * shortsAdjustment,
      sponsorshipRevenue: revenueBreakdown.sponsorshipRevenue,
      affiliateRevenue: revenueBreakdown.affiliateRevenue,
      subRevenue: estimatedMonthlyFromSubs
    },
    yearlyRevenue: (adjustedMonthlyRevenue + estimatedMonthlyFromSubs) * 12,
    cpm: cpm,
    niche: data.niche || 'general',
    revenueBreakdown: {
      adRevenue: revenueBreakdown.adRevenue * shortsAdjustment,
      sponsorshipRevenue: revenueBreakdown.sponsorshipRevenue,
      affiliateRevenue: revenueBreakdown.affiliateRevenue,
      otherRevenue: revenueBreakdown.otherRevenue * shortsAdjustment,
      subRevenue: estimatedMonthlyFromSubs
    },
    notes: [
      `Estimated CPM: $${cpm.toFixed(2)} (based on ${data.niche || 'general'} niche)`,
      `Shorts content reduces revenue by ${(100 - shortsAdjustment * 100).toFixed(1)}%`,
      `Revenue estimates are approximations and can vary significantly`
    ]
  };
}

module.exports = {
  calculateNicheViabilityScore,
  estimateRevenue
};