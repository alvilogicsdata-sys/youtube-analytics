// src/types/index.ts

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Channel {
  id: string;
  channelId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  id: string;
  videoId: string;
  channelId: string;
  title: string;
  description: string;
  publishedAt: string;
  durationSeconds: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  thumbnailUrl: string;
  isShort: boolean;
  categoryId: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Niche {
  id: string;
  name: string;
  description: string;
  avgMonthlyViews: number;
  avgEngagementRate: number;
  estimatedCpm: number;
  competitorCount: number;
  viabilityScore: number;
  createdAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  channelIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChannelAnalytics {
  totalVideos: number;
  totalShorts: number;
  shortsPercentage: number;
  totalViews: number;
  averageViewCount: number;
  calculatedAt: string;
}

export interface NicheViabilityResult {
  score: number;
  category: string;
  factors: {
    viewsPerVideo: {
      score: number;
      value: number;
      maxPossible: number;
    };
    monthlyGrowth: {
      score: number;
      value: number;
      maxPossible: number;
    };
    competingChannels: {
      score: number;
      value: number;
      competitorAvgViews: number;
      maxPossible: number;
    };
    shortsPercentage: {
      score: number;
      value: number;
      maxPossible: number;
    };
    engagementRate: {
      score: number;
      value: number;
      maxPossible: number;
    };
  };
  weights: {
    [key: string]: number;
  };
}

export interface RevenueEstimate {
  monthlyRevenue: {
    estimated: number;
    adRevenue: number;
    sponsorshipRevenue: number;
    affiliateRevenue: number;
    subRevenue: number;
  };
  yearlyRevenue: number;
  cpm: number;
  niche: string;
  revenueBreakdown: {
    adRevenue: number;
    sponsorshipRevenue: number;
    affiliateRevenue: number;
    otherRevenue: number;
    subRevenue: number;
  };
  notes: string[];
}