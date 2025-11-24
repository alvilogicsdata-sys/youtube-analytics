# Niche Viability Analyzer

A comprehensive tool for calculating niche viability scores and revenue estimates for YouTube channels based on multiple key metrics.

## Features

- **Niche Viability Score**: A composite score (0-100) that evaluates the potential success of a YouTube niche
- **Revenue Estimation**: Estimates potential monthly and yearly revenue based on channel metrics
- **Five Key Factors**: Views per video, monthly growth, competing channels, shorts percentage, and engagement rate
- **Flexible Input**: Handles various data formats and provides intelligent defaults

## Installation

```bash
npm install niche-viability-analyzer
```

Or clone the repository directly:

```bash
git clone <repository-url>
cd niche-viability-analyzer
npm install
```

## Usage

### Basic Usage

```javascript
const { calculateNicheViabilityScore, estimateRevenue } = require('niche-viability-analyzer');

// Calculate a niche viability score
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

// Estimate potential revenue
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
```

## API Reference

### `calculateNicheViabilityScore(data)`

Calculates the niche viability score based on multiple factors.

#### Parameters

- `data` (Object): The input data for the calculation
  - `videos` (Array): Array of video objects with view counts
  - `monthlyGrowth` (Number): Percentage growth per month
  - `competingChannels` (Number): Number of competing channels
  - `shortsPercentage` (Number): Percentage of shorts in content (0-100)
  - `engagementRate` (Number): Engagement rate as a percentage (0-100)
  - `competitorAvgViews` (Number): Average views for competing channels (optional)

#### Returns

- `Object`:
  - `score` (Number): The overall viability score (0-100)
  - `category` (String): Viability category (Very Low, Low, Medium, High, Very High)
  - `factors` (Object): Detailed scores for each factor
  - `weights` (Object): Weight distribution for each factor

### `estimateRevenue(data)`

Estimates potential revenue based on channel metrics.

#### Parameters

- `data` (Object): Channel data for revenue estimation
  - `avgMonthlyViews` (Number): Average monthly views
  - `engagementRate` (Number): Engagement rate as percentage
  - `shortsPercentage` (Number): Percentage of shorts content (0-100)
  - `cpm` (Number): CPM (revenue per 1000 views) in USD (optional)
  - `subscriberCount` (Number): Number of subscribers
  - `niche` (String): Channel niche (optional, affects CPM)

#### Returns

- `Object`:
  - `monthlyRevenue` (Object): Monthly revenue breakdown
  - `yearlyRevenue` (Number): Estimated yearly revenue
  - `cpm` (Number): CPM used in calculations
  - `niche` (String): Channel niche
  - `revenueBreakdown` (Object): Revenue from different sources
  - `notes` (Array): Additional information and notes

## Scoring Factors

The Niche Viability Score is calculated based on five key factors, each with different weights:

### 1. Views Per Video (25% weight)
- Measures the average performance of content
- Uses a logarithmic scale to account for YouTube's view distribution
- Higher views get diminishing returns as they scale

### 2. Monthly Growth (20% weight)
- Evaluates the channel's growth trajectory
- Positive growth increases the score
- Negative growth significantly decreases the score

### 3. Competing Channels (20% weight)
- Considers the level of competition in the niche
- Includes penalty based on competitors' average views
- Bonus for having more content than the average competitor

### 4. Shorts Percentage (15% weight)
- Optimal range is 20-50% shorts content
- Too few or too many shorts can negatively impact the score
- Considers current algorithm preferences

### 5. Engagement Rate (20% weight)
- Measures audience interaction with content
- Higher engagement rates indicate better content performance
- Excellent engagement (5%+) gets the highest scores

## Revenue Estimation

The revenue estimation considers multiple factors:

- **CPM (Cost Per Mille)**: Varies by niche, with technology and finance typically having higher CPMs
- **Shorts Impact**: Shorts typically earn less than long-form content
- **Revenue Sources**: Ad revenue (65%), sponsorships (20%), affiliate marketing (10%), other (5%)

## Examples

### Example 1: Tech Niche Analysis

```javascript
const techChannelData = {
  videos: [
    { view_count: 120000 },
    { view_count: 95000 },
    { view_count: 110000 },
    { view_count: 135000 },
    { view_count: 105000 }
  ],
  monthlyGrowth: 18,
  competingChannels: 120,
  shortsPercentage: 25,
  engagementRate: 6.5,
  competitorAvgViews: 80000
};

const techViability = calculateNicheViabilityScore(techChannelData);
console.log(`Tech Niche Viability: ${techViability.score} (${techViability.category})`);
```

### Example 2: Revenue Estimation for Gaming Channel

```javascript
const gamingRevenueData = {
  avgMonthlyViews: 1500000,
  engagementRate: 8.2,
  shortsPercentage: 45,
  subscriberCount: 125000,
  niche: 'gaming'
};

const gamingRevenue = estimateRevenue(gamingRevenueData);
console.log(`Gaming Channel Revenue Estimate:`);
console.log(`Monthly: $${gamingRevenue.monthlyRevenue.estimated.toFixed(2)}`);
console.log(`Yearly: $${gamingRevenue.yearlyRevenue.toFixed(2)}`);
```

## Testing

To run the tests:

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see the LICENSE file for details.

## Support

For issues and questions, please open an issue in the repository.