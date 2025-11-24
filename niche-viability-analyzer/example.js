// example.js
const { calculateNicheViabilityScore, estimateRevenue } = require('./src/nicheViabilityAnalyzer');

// Example 1: Calculate Niche Viability Score
console.log('=== Niche Viability Score Example ===');
const viabilityData = {
  videos: [
    { view_count: 15000 },
    { view_count: 23000 },
    { view_count: 18000 },
    { view_count: 31000 },
    { view_count: 27000 }
  ],
  monthlyGrowth: 12.5,      // 12.5% monthly growth
  competingChannels: 75,     // 75 competing channels
  shortsPercentage: 35,      // 35% of content is shorts
  engagementRate: 4.2,       // 4.2% engagement rate
  competitorAvgViews: 45000  // Competitors average 45k views per video
};

const viabilityScore = calculateNicheViabilityScore(viabilityData);
console.log(`Viability Score: ${viabilityScore.score}`);
console.log(`Category: ${viabilityScore.category}`);
console.log('Factor Breakdown:', viabilityScore.factors);
console.log('');

// Example 2: Estimate Revenue
console.log('=== Revenue Estimation Example ===');
const revenueData = {
  avgMonthlyViews: 850000,   // 850k average monthly views
  engagementRate: 4.2,
  shortsPercentage: 35,
  cpm: 6.5,                // $6.50 CPM
  subscriberCount: 50000,   // 50k subscribers
  niche: 'tech'            // Tech niche
};

const revenueEstimate = estimateRevenue(revenueData);
console.log(`Estimated Monthly Revenue: $${revenueEstimate.monthlyRevenue.estimated.toFixed(2)}`);
console.log(`Estimated Yearly Revenue: $${revenueEstimate.yearlyRevenue.toFixed(2)}`);
console.log(`Revenue Breakdown:`, revenueEstimate.revenueBreakdown);
console.log('');

// Example 3: Compare different scenarios
console.log('=== Scenario Comparison ===');
const highEngagementData = {
  ...viabilityData,
  engagementRate: 8.5,      // Higher engagement rate
  monthlyGrowth: 25,        // Higher growth
  competitorAvgViews: 30000 // Lower competitor performance
};

const highEngagementScore = calculateNicheViabilityScore(highEngagementData);
console.log(`High Engagement Scenario: ${highEngagementScore.score} (${highEngagementScore.category})`);

const lowEngagementData = {
  ...viabilityData,
  engagementRate: 1.2,      // Lower engagement rate
  monthlyGrowth: -5,        // Negative growth
  competingChannels: 200    // More competitors
};

const lowEngagementScore = calculateNicheViabilityScore(lowEngagementData);
console.log(`Low Engagement Scenario: ${lowEngagementScore.score} (${lowEngagementScore.category})`);