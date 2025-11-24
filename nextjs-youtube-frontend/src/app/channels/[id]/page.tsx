'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/authContext';
import { useRouter, useParams } from 'next/navigation';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Play, 
  Eye, 
  DollarSign, 
  Calendar, 
  Tag,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Download,
  Share2,
  Heart,
  MessageCircle,
  BarChart2
} from 'lucide-react';
import { Channel, Video, ChannelAnalytics, NicheViabilityResult, RevenueEstimate } from '@/types';

// Mock data for a channel
const mockChannel: Channel = {
  id: '1',
  channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
  title: 'Tech Reviews Channel',
  description: 'Latest tech reviews, comparisons, and buying guides. We review smartphones, laptops, gadgets and more.',
  thumbnailUrl: 'https://placehold.co/400x400?text=Tech+Reviews',
  subscriberCount: 45230,
  videoCount: 156,
  viewCount: 2847392,
  createdAt: '2022-01-15',
  updatedAt: '2024-11-17'
};

const mockVideos: Video[] = [
  {
    id: 'v1',
    videoId: 'abc123',
    channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
    title: 'Best Smartphones of 2024 Review',
    description: 'In-depth review of the best smartphones released this year',
    publishedAt: '2024-10-15',
    durationSeconds: 1200,
    viewCount: 125000,
    likeCount: 4500,
    commentCount: 1200,
    thumbnailUrl: 'https://placehold.co/320x180?text=Phone+Review',
    isShort: false,
    categoryId: '22',
    tags: ['smartphone', 'review', 'tech'],
    createdAt: '2024-10-15',
    updatedAt: '2024-10-15'
  },
  {
    id: 'v2',
    videoId: 'def456',
    channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
    title: 'Quick Tech Tip: Battery Optimization',
    description: 'Simple tips to extend your device battery life',
    publishedAt: '2024-10-10',
    durationSeconds: 90,
    viewCount: 89000,
    likeCount: 2300,
    commentCount: 450,
    thumbnailUrl: 'https://placehold.co/320x180?text=Battery+Tip',
    isShort: true,
    categoryId: '22',
    tags: ['tech tip', 'battery', 'shorts'],
    createdAt: '2024-10-10',
    updatedAt: '2024-10-10'
  },
  {
    id: 'v3',
    videoId: 'ghi789',
    channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
    title: 'Laptop Comparison: MacBook vs Dell',
    description: 'Detailed comparison between the latest MacBook and Dell XPS',
    publishedAt: '2024-10-05',
    durationSeconds: 1800,
    viewCount: 210000,
    likeCount: 6200,
    commentCount: 1800,
    thumbnailUrl: 'https://placehold.co/320x180?text=Laptop+Comp',
    isShort: false,
    categoryId: '22',
    tags: ['laptop', 'comparison', 'macbook', 'dell'],
    createdAt: '2024-10-05',
    updatedAt: '2024-10-05'
  }
];

const mockAnalytics: ChannelAnalytics = {
  totalVideos: 156,
  totalShorts: 45,
  shortsPercentage: 28.8,
  totalViews: 2847392,
  averageViewCount: 18252,
  calculatedAt: '2024-11-17'
};

const mockViabilityScore: NicheViabilityResult = {
  score: 87,
  category: 'High',
  factors: {
    viewsPerVideo: {
      score: 85,
      value: 18252,
      maxPossible: 100
    },
    monthlyGrowth: {
      score: 78,
      value: 12.5,
      maxPossible: 100
    },
    competingChannels: {
      score: 88,
      value: 124,
      competitorAvgViews: 150000,
      maxPossible: 100
    },
    shortsPercentage: {
      score: 92,
      value: 28.8,
      maxPossible: 100
    },
    engagementRate: {
      score: 82,
      value: 4.2,
      maxPossible: 100
    }
  },
  weights: {
    viewsPerVideo: 0.25,
    monthlyGrowth: 0.20,
    competingChannels: 0.20,
    shortsPercentage: 0.15,
    engagementRate: 0.20
  }
};

const mockRevenueEstimate: RevenueEstimate = {
  monthlyRevenue: {
    estimated: 4500,
    adRevenue: 2925,
    sponsorshipRevenue: 900,
    affiliateRevenue: 450,
    subRevenue: 225
  },
  yearlyRevenue: 54000,
  cpm: 6.5,
  niche: 'tech',
  revenueBreakdown: {
    adRevenue: 2925,
    sponsorshipRevenue: 900,
    affiliateRevenue: 450,
    otherRevenue: 225,
    subRevenue: 0
  },
  notes: [
    'Estimated CPM: $6.50 (based on tech niche)',
    'Revenue estimates are approximations and can vary significantly'
  ]
};

export default function ChannelDetailsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [analytics, setAnalytics] = useState<ChannelAnalytics | null>(null);
  const [viabilityScore, setViabilityScore] = useState<NicheViabilityResult | null>(null);
  const [revenueEstimate, setRevenueEstimate] = useState<RevenueEstimate | null>(null);

  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
    } else if (user) {
      // In a real app, we would fetch channel data based on the ID from the URL
      // For demo, we'll use our mock data
      setChannel(mockChannel);
      setVideos(mockVideos);
      setAnalytics(mockAnalytics);
      setViabilityScore(mockViabilityScore);
      setRevenueEstimate(mockRevenueEstimate);
    }
  }, [user, loading, router]);

  if (!user && !loading) {
    return null; // Render nothing while redirecting
  }

  const handleLogout = () => {
    // @ts-ignore - using global logout function
    const { logout } = useAuth();
    logout();
    router.push('/login');
  };

  if (!channel || !analytics || !viabilityScore || !revenueEstimate) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading channel data...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold text-gray-900 hidden md:block">Channel Details</h1>
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
                    <p className="font-medium text-gray-700">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.role}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {user?.name?.charAt(0)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            {/* Channel Header */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center">
                  <div className="flex-shrink-0">
                    <img 
                      src={channel.thumbnailUrl} 
                      alt={channel.title}
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  </div>
                  <div className="mt-4 md:mt-0 md:ml-6">
                    <h1 className="text-2xl font-bold text-gray-900">{channel.title}</h1>
                    <p className="text-gray-600 mt-1">{channel.description}</p>
                    <div className="mt-4 flex flex-wrap gap-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{channel.subscriberCount.toLocaleString()} subscribers</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Play className="h-4 w-4 mr-1" />
                        <span>{channel.videoCount} videos</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Eye className="h-4 w-4 mr-1" />
                        <span>{channel.viewCount.toLocaleString()} total views</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 md:mt-0 md:ml-auto flex space-x-3">
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      <Heart className="h-4 w-4 mr-2" />
                      Follow
                    </button>
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit Channel
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                {['overview', 'videos', 'analytics', 'viability'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Metrics */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Channel Analytics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Total Videos</p>
                        <p className="text-2xl font-semibold text-gray-900">{analytics.totalVideos}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Shorts</p>
                        <p className="text-2xl font-semibold text-gray-900">{analytics.totalShorts}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Shorts %</p>
                        <p className="text-2xl font-semibold text-gray-900">{analytics.shortsPercentage}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Avg. Views</p>
                        <p className="text-2xl font-semibold text-gray-900">{analytics.averageViewCount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Estimate</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Monthly</span>
                        <span className="text-xl font-semibold text-gray-900">
                          ${revenueEstimate.monthlyRevenue.estimated.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Yearly</span>
                        <span className="text-xl font-semibold text-gray-900">
                          ${revenueEstimate.yearlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-500">CPM</p>
                        <p className="text-lg font-semibold text-gray-900">${revenueEstimate.cpm.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Videos</h3>
                    <div className="space-y-4">
                      {videos.slice(0, 3).map((video) => (
                        <div key={video.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <img 
                            src={video.thumbnailUrl} 
                            alt={video.title}
                            className="w-24 h-16 object-cover rounded"
                          />
                          <div className="ml-4 flex-1">
                            <h4 className="text-sm font-medium text-gray-900 line-clamp-1">{video.title}</h4>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <Eye className="h-3 w-3 mr-1" />
                              <span>{video.viewCount.toLocaleString()} views</span>
                              <span className="mx-2">•</span>
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <Heart className="h-3 w-3 mr-1" />
                              <span>{video.likeCount.toLocaleString()} likes</span>
                              <span className="mx-2">•</span>
                              <MessageCircle className="h-3 w-3 mr-1" />
                              <span>{video.commentCount.toLocaleString()} comments</span>
                              {video.isShort && (
                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Short
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Viability Score */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Niche Viability Score</h3>
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative w-48 h-48 flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-gray-900">{viabilityScore.score}</p>
                          <p className="text-sm text-gray-500 mt-1">Viability Score</p>
                        </div>
                      </div>
                      <svg className="w-48 h-48" viewBox="0 0 100 100">
                        <circle
                          className="text-gray-200 stroke-current"
                          strokeWidth="10"
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                        ></circle>
                        <circle
                          className={`${viabilityScore.score >= 80 ? 'text-green-500' : viabilityScore.score >= 60 ? 'text-yellow-500' : 'text-red-500'} progress-ring__circle stroke-current`}
                          strokeWidth="10"
                          strokeLinecap="round"
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          strokeDasharray={`${(viabilityScore.score / 100) * 251.2} 251.2`}
                          transform="rotate(-90 50 50)"
                        ></circle>
                      </svg>
                    </div>
                    <div className="mt-6 w-full">
                      <p className={`text-center text-lg font-semibold ${
                        viabilityScore.score >= 80 ? 'text-green-600' : 
                        viabilityScore.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {viabilityScore.category}
                      </p>
                      <button className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                        <BarChart2 className="h-4 w-4 mr-2" />
                        View Full Analysis
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'videos' && (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">All Videos</h3>
                  <div className="flex space-x-3">
                    <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </button>
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                      <Play className="h-4 w-4 mr-2" />
                      Analyze More
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Video
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Views
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Engagement
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {videos.map((video) => (
                        <tr key={video.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img 
                                src={video.thumbnailUrl} 
                                alt={video.title}
                                className="w-16 h-9 object-cover rounded"
                              />
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 line-clamp-1">{video.title}</div>
                                <div className="text-sm text-gray-500 line-clamp-1">{video.description.substring(0, 50)}...</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {video.viewCount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{video.likeCount.toLocaleString()} likes</div>
                            <div className="text-sm text-gray-500">{video.commentCount.toLocaleString()} comments</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(video.publishedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              video.isShort 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {video.isShort ? 'Short' : 'Video'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-800">Engagement Rate</h4>
                      <p className="text-2xl font-semibold text-blue-900 mt-2">4.2%</p>
                      <p className="text-sm text-blue-600 mt-1">+0.8% from last month</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-green-800">Avg. Watch Time</h4>
                      <p className="text-2xl font-semibold text-green-900 mt-2">4:12</p>
                      <p className="text-sm text-green-600 mt-1">+12s from last month</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-purple-800">Upload Frequency</h4>
                      <p className="text-2xl font-semibold text-purple-900 mt-2">2.3x/wk</p>
                      <p className="text-sm text-purple-600 mt-1">+0.1 from last month</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-yellow-800">Shorts Performance</h4>
                      <p className="text-2xl font-semibold text-yellow-900 mt-2">28.8%</p>
                      <p className="text-sm text-yellow-600 mt-1">+2.1% from last month</p>
                    </div>
                  </div>
                  
                  <h4 className="text-md font-medium text-gray-900 mt-8 mb-4">Subscribers Trend</h4>
                  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Subscribers Growth Chart (Mock Data)</p>
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Videos</h3>
                  <div className="space-y-4">
                    {videos
                      .sort((a, b) => b.viewCount - a.viewCount)
                      .slice(0, 5)
                      .map((video, index) => (
                        <div key={video.id} className="flex items-center">
                          <span className="text-lg font-medium text-gray-400 mr-3">#{index + 1}</span>
                          <img 
                            src={video.thumbnailUrl} 
                            alt={video.title}
                            className="w-16 h-9 object-cover rounded"
                          />
                          <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{video.title}</p>
                            <p className="text-sm text-gray-500">{video.viewCount.toLocaleString()} views</p>
                          </div>
                        </div>
                      ))}
                  </div>
                  
                  <h4 className="text-md font-medium text-gray-900 mt-8 mb-4">Revenue Breakdown</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Ad Revenue</span>
                      <span className="text-sm font-medium">${revenueEstimate.revenueBreakdown.adRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Sponsorships</span>
                      <span className="text-sm font-medium">${revenueEstimate.revenueBreakdown.sponsorshipRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Affiliate</span>
                      <span className="text-sm font-medium">${revenueEstimate.revenueBreakdown.affiliateRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Other</span>
                      <span className="text-sm font-medium">${revenueEstimate.revenueBreakdown.otherRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between font-medium">
                      <span>Total</span>
                      <span>${revenueEstimate.monthlyRevenue.estimated.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'viability' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Viability Score Breakdown</h3>
                  <div className="space-y-6">
                    {Object.entries(viabilityScore.factors).map(([key, factor]) => (
                      <div key={key}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="text-sm font-medium text-gray-900">{factor.score}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="h-2.5 rounded-full" 
                            style={{ 
                              width: `${factor.score}%`,
                              backgroundColor: 
                                factor.score >= 80 ? '#10B981' : 
                                factor.score >= 60 ? '#F59E0B' : '#EF4444'
                            }}
                          ></div>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          Value: {typeof factor.value === 'number' ? factor.value.toLocaleString() : factor.value}
                          {key === 'competingChannels' && factor.competitorAvgViews && (
                            <span>, Competitor Avg: {factor.competitorAvgViews.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <h4 className="text-md font-medium text-gray-900 mt-8 mb-4">Revenue Potential</h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Based on current performance metrics, this channel has an estimated monthly revenue potential of:
                    </p>
                    <p className="text-2xl font-bold text-blue-900 mt-2">
                      ${revenueEstimate.monthlyRevenue.estimated.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      At a CPM of ${revenueEstimate.cpm.toFixed(2)} for the {revenueEstimate.niche} niche
                    </p>
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-yellow-800">Increase Shorts Content</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Your shorts performance is strong. Consider increasing shorts content to 35-45% of total uploads.
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-800">Consistent Upload Schedule</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Your upload consistency is excellent. Maintain 2-3 uploads per week for continued growth.
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800">Engagement Optimization</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Your engagement rate is good. Focus on asking questions in your videos to increase comments.
                      </p>
                    </div>
                  </div>
                  
                  <h4 className="text-md font-medium text-gray-900 mt-8 mb-4">Notes</h4>
                  <ul className="space-y-2">
                    {revenueEstimate.notes.map((note, index) => (
                      <li key={index} className="text-sm text-gray-600 flex">
                        <span className="mr-2">•</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
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
            className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
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
              {user.name?.charAt(0)}
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