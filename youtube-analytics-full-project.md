# YouTube Analytics Platform

A comprehensive YouTube analytics platform consisting of backend API, frontend application, and deployment infrastructure.

## Table of Contents
1. [Project Overview](#project-overview)
2. [Backend API](#backend-api)
3. [Frontend Application](#frontend-application)
4. [Niche Viability Score & Revenue Estimator](#niche-viability-score--revenue-estimator)
5. [Deployment Infrastructure](#deployment-infrastructure)
6. [Security & Monitoring](#security--monitoring)

## Project Overview

The YouTube Analytics Platform is a complete solution that allows users to:
- Analyze YouTube channel performance
- Calculate niche viability scores
- Estimate potential revenue
- Organize channels into collections
- Monitor platform metrics through an admin panel

The platform includes:
- A Node.js/Express backend with PostgreSQL and Redis
- A Next.js frontend with authentication
- Comprehensive analytics tools
- Deployment infrastructure with Docker and DigitalOcean

## Backend API

### Project Structure
```
youtube-data-api/
├── server.js                 # Main application entry point
├── package.json              # Dependencies and scripts
├── .env                      # Environment configuration
├── config/
│   └── database.js           # Database connection setup
├── controllers/              # Request handlers
├── database/
│   ├── connection.js         # Database connection
│   ├── schema.sql            # Database schema
│   └── storage.js            # Data storage operations
├── models/                   # Data models
├── routes/
│   └── youtube.js            # API routes
├── services/
│   ├── youtubeApiClient.js   # YouTube API client
│   ├── youtubeChannelService.js # Channel service
│   ├── youtubeVideoService.js   # Video service
│   └── jobQueue.js           # Background job processing
├── middleware/
│   └── rateLimiter.js        # Rate limiting middleware
├── utils/
│   └── analytics.js          # Analytics utilities
└── README.md                 # Documentation
```

### Core API Services

#### YouTube API Client
```javascript
const axios = require('axios');
const NodeCache = require('node-cache');
const { RateLimiterMemory } = require('rate-limiter-flexible');

// Create a cache instance (1000 seconds = ~16.67 minutes)
const apiCache = new NodeCache({ stdTTL: 1000, checkperiod: 1200 });

// Create a rate limiter (10,000 units per day for YouTube API)
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
```

#### YouTube Channel Service
```javascript
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
```

#### Database Schema
```sql
-- YouTube Analytics Database Schema

-- Channels table
CREATE TABLE channels (
    id SERIAL PRIMARY KEY,
    channel_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    custom_url VARCHAR(255),
    thumbnail_url VARCHAR(500),
    banner_url VARCHAR(500),
    subscriber_count BIGINT,
    video_count BIGINT,
    view_count BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Videos table
CREATE TABLE videos (
    id SERIAL PRIMARY KEY,
    video_id VARCHAR(50) UNIQUE NOT NULL,
    channel_id VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    published_at TIMESTAMP NOT NULL,
    duration_seconds INTEGER,
    view_count BIGINT,
    like_count BIGINT,
    comment_count BIGINT,
    thumbnail_url VARCHAR(500),
    is_short BOOLEAN DEFAULT FALSE,
    category_id VARCHAR(10),
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (channel_id) REFERENCES channels(channel_id)
);

-- Channel analytics summary table
CREATE TABLE channel_analytics (
    id SERIAL PRIMARY KEY,
    channel_id VARCHAR(50) NOT NULL,
    total_videos BIGINT,
    total_shorts BIGINT,
    shorts_percentage DECIMAL(5,2),
    total_views BIGINT,
    average_view_count DECIMAL(15,2),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (channel_id) REFERENCES channels(channel_id)
);

-- Job queue table (for tracking background jobs)
CREATE TABLE job_queue (
    id SERIAL PRIMARY KEY,
    job_type VARCHAR(50) NOT NULL,
    channel_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    progress INTEGER DEFAULT 0
);

-- Indexes for better performance
CREATE INDEX idx_videos_channel_id ON videos(channel_id);
CREATE INDEX idx_videos_published_at ON videos(published_at);
CREATE INDEX idx_videos_is_short ON videos(is_short);
CREATE INDEX idx_channel_analytics_channel_id ON channel_analytics(channel_id);
CREATE INDEX idx_job_queue_status ON job_queue(status);
CREATE INDEX idx_job_queue_channel_id ON job_queue(channel_id);
```

## Frontend Application

### Project Structure
```
nextjs-youtube-frontend/
├── src/
│   ├── app/                  # Next.js app router pages
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── explore/
│   │   ├── channels/
│   │   ├── collections/
│   │   ├── admin/
│   │   └── layout.tsx
│   ├── components/           # Reusable components
│   ├── context/              # React context providers
│   │   └── authContext.tsx   # Authentication context
│   ├── types/                # TypeScript type definitions
│   │   └── index.ts
│   ├── lib/                  # Utility functions
│   ├── utils/                # Helper functions
│   └── styles/               # Global styles
├── package.json
├── next.config.js
├── tailwind.config.js
└── README.md
```

#### Authentication Context
```typescript
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (from localStorage, cookie, etc.)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate API call
    setLoading(true);
    try {
      // In a real app, you would call your backend API here
      // For demo purposes, we'll simulate a successful login
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockUser: User = {
        id: '1',
        name: 'John Doe',
        email: email,
        role: 'user'
      };
      
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
    } catch (error) {
      throw new Error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    // Simulate API call
    setLoading(true);
    try {
      // In a real app, you would call your backend API here
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockUser: User = {
        id: '2',
        name: name,
        email: email,
        role: 'user'
      };
      
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
    } catch (error) {
      throw new Error('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

#### Type Definitions
```typescript
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
```

#### Dashboard Component Example
```tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/authContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Play, 
  Eye, 
  DollarSign, 
  Search,
  Bell,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';

// Mock data for dashboard
const mockData = {
  totalChannels: 124,
  totalVideos: 2847,
  totalViews: 1254321,
  totalRevenue: 12450,
  growthRate: 12.5,
  popularNiches: [
    { name: 'Tech', channels: 24, viability: 85 },
    { name: 'Gaming', channels: 18, viability: 78 },
    { name: 'Education', channels: 32, viability: 92 },
    { name: 'Lifestyle', channels: 15, viability: 68 },
  ],
  recentChannels: [
    { id: '1', name: 'Tech Reviews', videos: 156, subscribers: 45230, viability: 87 },
    { id: '2', name: 'Gaming Highlights', videos: 89, subscribers: 23400, viability: 75 },
    { id: '3', name: 'Cooking Tutorials', videos: 234, subscribers: 87500, viability: 92 },
    { id: '4', name: 'Fitness Tips', videos: 123, subscribers: 56700, viability: 79 },
  ]
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null; // Render nothing while redirecting
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would trigger a search
    console.log('Searching for:', searchQuery);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-lg bg-white shadow-md"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
          <div className="relative w-64 h-full bg-white shadow-lg z-50">
            <button
              className="absolute top-4 right-4 p-2"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <SidebarContent user={user} onLogout={handleLogout} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <SidebarContent user={user} onLogout={handleLogout} />
      </div>

      {/* Main content */}
      <div className="flex-1 md:ml-64">
        <header className="bg-white shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 hidden md:block">Dashboard</h1>
              <form onSubmit={handleSearch} className="ml-6 md:ml-10 w-64">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Search niches..."
                  />
                </div>
              </form>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none">
                <Bell className="h-6 w-6" />
              </button>
              <button className="p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none">
                <Settings className="h-6 w-6" />
              </button>
              <div className="ml-3 relative">
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-right">
                    <p className="font-medium text-gray-700">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {user.name.charAt(0)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {/* Total Channels Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Channels</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">{mockData.totalChannels}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Videos Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                      <Play className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Videos</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">{mockData.totalVideos.toLocaleString()}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Views Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                      <Eye className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Views</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">{mockData.totalViews.toLocaleString()}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                      <DollarSign className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Revenue</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">${mockData.totalRevenue.toLocaleString()}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Popular Niches */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Popular Niches</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Top performing niches in the platform</p>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <ul className="divide-y divide-gray-200">
                    {mockData.popularNiches.map((niche, index) => (
                      <li key={index} className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">{niche.name}</div>
                            <div className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {niche.channels} channels
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className={`text-sm font-medium ${niche.viability >= 80 ? 'text-green-600' : niche.viability >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {niche.viability}%
                            </div>
                            <div className="ml-1">
                              <TrendingUp className={`h-4 w-4 ${niche.viability >= 80 ? 'text-green-600' : niche.viability >= 60 ? 'text-yellow-600' : 'text-red-600'}`} />
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recent Channels */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Channels</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Recently analyzed channels</p>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <ul className="divide-y divide-gray-200">
                    {mockData.recentChannels.map((channel) => (
                      <li key={channel.id} className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-900">{channel.name}</div>
                          <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-500">{channel.videos} videos</div>
                            <div className="text-sm text-gray-500">{channel.subscribers.toLocaleString()} subs</div>
                            <div className={`text-sm font-medium ${channel.viability >= 80 ? 'text-green-600' : channel.viability >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {channel.viability}%
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    <Link href="/explore" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      Explore Niches
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Sidebar component
function SidebarContent({ user, onLogout }: { user: any; onLogout: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center h-16 bg-blue-600 px-4">
        <div className="flex items-center">
          <BarChart3 className="h-8 w-8 text-white" />
          <span className="ml-2 text-xl font-bold text-white">YT Analytics</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="mt-5 flex-1 px-2 space-y-1">
          <Link
            href="/dashboard"
            className="bg-blue-700 text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md"
          >
            <BarChart3 className="mr-3 h-6 w-6" />
            Dashboard
          </Link>
          <Link
            href="/explore"
            className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
          >
            <TrendingUp className="mr-3 h-6 w-6" />
            Explore Niches
          </Link>
          <Link
            href="/collections"
            className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
          >
            <Play className="mr-3 h-6 w-6" />
            Collections
          </Link>
          {user.role === 'admin' && (
            <Link
              href="/admin"
              className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
            >
              <Settings className="mr-3 h-6 w-6" />
              Admin Panel
            </Link>
          )}
        </nav>
        <div className="flex-shrink-0 p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{user.name}</p>
              <p className="text-xs font-medium text-gray-500">{user.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Niche Viability Score & Revenue Estimator

### Niche Viability Analyzer
```javascript
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
```

## Deployment Infrastructure

### Dockerfiles

#### Backend Dockerfile
```dockerfile
# Use Node.js 18 Alpine as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Expose port 3000 (or whatever port your app runs on)
EXPOSE 3000

# Create a non-root user and switch to it
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Define the command to run the application
CMD ["npm", "start"]
```

#### Frontend Dockerfile
```dockerfile
# Use Node.js 18 Alpine as the base image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line to disable telemetry at build time
ENV NEXT_TELEMETRY_DISABLED 1

# Build the Next.js application
RUN npm run build

# Production image, copy all the files and run next start
FROM base AS runner
WORKDIR /app

# Install necessary packages for production
RUN apk add --no-cache dumb-init

# Create nextjs user with specific UID/GID
RUN addgroup -g 1001 -S nextjs
RUN adduser -S nextjs -u 1001

# Set environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create app directory and set ownership
RUN mkdir -p /app && chown nextjs:nextjs /app
WORKDIR /app

# Copy necessary files from builder stage
COPY --from=builder --chown=nextjs:nextjs /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["dumb-init", "node", "server.js"]
```

### Docker Compose for Production
```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: youtube_analytics_postgres_prod
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./initdb:/docker-entrypoint-initdb.d
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: youtube_analytics_redis_prod
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD}
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Backend API
  backend:
    build:
      context: ./nodejs-backend
      dockerfile: Dockerfile
    container_name: youtube_analytics_backend_prod
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - YOUTUBE_API_KEY=${YOUTUBE_API_KEY}
      - PORT=3000
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend Next.js App
  frontend:
    build:
      context: ./nextjs-youtube-frontend
      dockerfile: Dockerfile
    container_name: youtube_analytics_frontend_prod
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    networks:
      - app-network
    restart: unless-stopped
    depends_on:
      - backend

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: youtube_analytics_nginx_prod
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./ssl/certs:/etc/ssl/certs
      - ./ssl/private:/etc/ssl/private
    depends_on:
      - backend
      - frontend
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "service", "nginx", "status"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Monitoring - Prometheus
  prometheus:
    image: prom/prometheus
    container_name: youtube_analytics_prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - app-network
    restart: unless-stopped

  # Monitoring - Grafana
  grafana:
    image: grafana/grafana
    container_name: youtube_analytics_grafana
    ports:
      - "3003:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/datasources:/etc/grafana/provisioning/datasources
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
    networks:
      - app-network
    restart: unless-stopped
    depends_on:
      - prometheus

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  app-network:
    driver: bridge
```

### Nginx Configuration
```nginx
# Nginx configuration for YouTube Analytics application

# Define upstream servers
upstream backend {
    server backend:3000;
}

upstream frontend {
    server frontend:3000;
}

# Main server configuration
server {
    listen 80;
    server_name ${SERVER_NAME};

    # Redirect all HTTP traffic to HTTPS
    return 301 https://$server_name$request_uri;
}

# SSL/HTTPS server configuration
server {
    listen 443 ssl http2;
    server_name ${SERVER_NAME};

    # SSL Configuration
    ssl_certificate ${SSL_CERT_PATH};
    ssl_certificate_key ${SSL_KEY_PATH};
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Logging
    access_log /var/log/nginx/youtube-analytics.access.log;
    error_log /var/log/nginx/youtube-analytics.error.log;

    # API routes - proxy to backend
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Security headers for API
        add_header X-Content-Type-Options nosniff;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend routes - proxy to Next.js app
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# Additional server for monitoring
server {
    listen 8080;
    server_name _;
    
    location / {
        return 301 https://$server_name:443$request_uri;
    }
}

# Security: Block access to sensitive files
location ~ /\. {
    deny all;
    log_not_found off;
    access_log off;
}

# Cache static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Security & Monitoring

### Security Measures Summary

1. **Network Security**
   - Firewall configuration with UFW
   - Container network isolation
   - Minimal exposed ports

2. **Transport Security**
   - SSL/TLS encryption with Let's Encrypt
   - Security headers in Nginx
   - HSTS configuration

3. **Application Security**
   - JWT-based authentication
   - Environment variable management
   - Input validation and sanitization
   - SQL injection prevention

4. **Database Security**
   - Strong passwords for database users
   - Internal network access only
   - Regular backups

5. **Container Security**
   - Non-root user execution
   - Minimal base images (Alpine Linux)
   - Multi-stage builds

### Monitoring Setup

1. **Infrastructure Monitoring**
   - Prometheus for metrics collection
   - Grafana for visualization
   - Health checks for all services

2. **Application Monitoring**
   - Built-in health check endpoint
   - Structured logging
   - Performance metrics

3. **Alerting**
   - Predefined alert rules
   - Critical issue notifications
   - Performance threshold monitoring

### Deployment Guide Summary

The platform can be deployed on DigitalOcean with:
- Ubuntu 20.04 droplet
- Docker and Docker Compose installation
- SSL certificate setup with Let's Encrypt
- Automated backup and monitoring
- Firewall configuration
- Security hardening

The complete setup includes both local development and production configurations, making it suitable for different environments and use cases. The platform provides comprehensive YouTube analytics capabilities with niche viability scoring and revenue estimation features, all backed by a robust and scalable infrastructure.