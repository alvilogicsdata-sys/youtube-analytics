// tests/nicheViabilityAnalyzer.test.js
const { calculateNicheViabilityScore, estimateRevenue } = require('../src/nicheViabilityAnalyzer');

describe('Niche Viability Analyzer', () => {
  describe('calculateNicheViabilityScore', () => {
    test('should calculate score with all factors', () => {
      const data = {
        videos: [
          { view_count: 10000 },
          { view_count: 15000 },
          { view_count: 20000 }
        ],
        monthlyGrowth: 15,
        competingChannels: 50,
        shortsPercentage: 30,
        engagementRate: 5,
        competitorAvgViews: 50000
      };

      const result = calculateNicheViabilityScore(data);

      expect(result).toHaveProperty('score');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('factors');
      expect(result.factors).toHaveProperty('viewsPerVideo');
      expect(result.factors).toHaveProperty('monthlyGrowth');
      expect(result.factors).toHaveProperty('competingChannels');
      expect(result.factors).toHaveProperty('shortsPercentage');
      expect(result.factors).toHaveProperty('engagementRate');
    });

    test('should handle empty videos array', () => {
      const data = {
        videos: [],
        monthlyGrowth: 15,
        competingChannels: 50,
        shortsPercentage: 30,
        engagementRate: 5,
        competitorAvgViews: 50000
      };

      const result = calculateNicheViabilityScore(data);

      expect(result.factors.viewsPerVideo.score).toBe(0);
      expect(result.factors.viewsPerVideo.value).toBe(0);
    });

    test('should handle negative growth', () => {
      const data = {
        videos: [{ view_count: 10000 }],
        monthlyGrowth: -10,
        competingChannels: 50,
        shortsPercentage: 30,
        engagementRate: 5,
        competitorAvgViews: 50000
      };

      const result = calculateNicheViabilityScore(data);

      expect(result.factors.monthlyGrowth.score).toBeLessThan(50);
    });

    test('should handle no competition', () => {
      const data = {
        videos: [{ view_count: 10000 }],
        monthlyGrowth: 15,
        competingChannels: 0,
        shortsPercentage: 30,
        engagementRate: 5,
        competitorAvgViews: 0
      };

      const result = calculateNicheViabilityScore(data);

      expect(result.factors.competingChannels.score).toBeCloseTo(100, -1);
    });

    test('should handle optimal shorts percentage', () => {
      const data = {
        videos: [{ view_count: 10000 }],
        monthlyGrowth: 15,
        competingChannels: 50,
        shortsPercentage: 40, // Within optimal range
        engagementRate: 5,
        competitorAvgViews: 50000
      };

      const result = calculateNicheViabilityScore(data);

      expect(result.factors.shortsPercentage.score).toBeCloseTo(100, -1);
    });
  });

  describe('estimateRevenue', () => {
    test('should estimate revenue with all parameters', () => {
      const data = {
        avgMonthlyViews: 500000,
        engagementRate: 5,
        shortsPercentage: 30,
        cpm: 5,
        subscriberCount: 10000,
        niche: 'tech'
      };

      const result = estimateRevenue(data);

      expect(result).toHaveProperty('monthlyRevenue');
      expect(result).toHaveProperty('yearlyRevenue');
      expect(result).toHaveProperty('cpm');
      expect(result).toHaveProperty('revenueBreakdown');
      expect(result.yearlyRevenue).toBeGreaterThan(0);
    });

    test('should use default CPM for general niche', () => {
      const data = {
        avgMonthlyViews: 100000,
        engagementRate: 3,
        shortsPercentage: 0,
        subscriberCount: 5000
      };

      const result = estimateRevenue(data);

      expect(result.cpm).toBe(4); // Default for general niche
      expect(result.monthlyRevenue.estimated).toBeGreaterThan(0);
    });

    test('should apply shorts adjustment', () => {
      const dataHighShorts = {
        avgMonthlyViews: 100000,
        engagementRate: 3,
        shortsPercentage: 80, // High shorts percentage
        subscriberCount: 5000
      };

      const dataLowShorts = {
        avgMonthlyViews: 100000,
        engagementRate: 3,
        shortsPercentage: 5, // Low shorts percentage
        subscriberCount: 5000
      };

      const resultHighShorts = estimateRevenue(dataHighShorts);
      const resultLowShorts = estimateRevenue(dataLowShorts);

      // Revenue should be lower with high shorts percentage
      expect(resultHighShorts.monthlyRevenue.estimated).toBeLessThan(resultLowShorts.monthlyRevenue.estimated);
    });

    test('should return 0 for zero views', () => {
      const data = {
        avgMonthlyViews: 0,
        engagementRate: 0,
        shortsPercentage: 0,
        subscriberCount: 0
      };

      const result = estimateRevenue(data);

      expect(result.monthlyRevenue.estimated).toBe(0);
    });
  });

  describe('Edge cases', () => {
    test('should handle missing data gracefully', () => {
      const result = calculateNicheViabilityScore({});
      
      expect(result.factors.viewsPerVideo.score).toBe(0);
      expect(result.factors.monthlyGrowth.score).toBe(50); // Neutral growth
      expect(result.factors.competingChannels.score).toBe(100); // No competition
      expect(result.factors.shortsPercentage.score).toBeCloseTo(60, -1); // Mid-range for 0%
      expect(result.factors.engagementRate.score).toBe(0); // 0% engagement
    });

    test('should handle extreme values', () => {
      const data = {
        videos: Array(100).fill({ view_count: 10000000 }), // 10M views each
        monthlyGrowth: 200, // Very high growth
        competingChannels: 1000, // Many competitors
        shortsPercentage: 100, // All shorts
        engagementRate: 20, // Very high engagement
        competitorAvgViews: 1000000 // Competitors with 1M avg
      };

      const result = calculateNicheViabilityScore(data);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });
});