'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/authContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  TrendingUp, 
  Users, 
  Play, 
  Eye, 
  DollarSign, 
  Search,
  Filter,
  Plus,
  ChevronRight,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Niche } from '@/types';

// Mock data for niches
const mockNiches: Niche[] = [
  {
    id: '1',
    name: 'Technology Reviews',
    description: 'Latest tech reviews and tutorials',
    avgMonthlyViews: 125000,
    avgEngagementRate: 4.2,
    estimatedCpm: 6.5,
    competitorCount: 124,
    viabilityScore: 87,
    createdAt: '2023-01-15'
  },
  {
    id: '2',
    name: 'Gaming Highlights',
    description: 'Popular gaming content and highlights',
    avgMonthlyViews: 280000,
    avgEngagementRate: 7.8,
    estimatedCpm: 4.2,
    competitorCount: 389,
    viabilityScore: 78,
    createdAt: '2023-02-20'
  },
  {
    id: '3',
    name: 'Cooking Tutorials',
    description: 'Easy and delicious cooking recipes',
    avgMonthlyViews: 89000,
    avgEngagementRate: 5.5,
    estimatedCpm: 3.8,
    competitorCount: 96,
    viabilityScore: 92,
    createdAt: '2023-03-10'
  },
  {
    id: '4',
    name: 'Fitness Tips',
    description: 'Workout routines and health tips',
    avgMonthlyViews: 156000,
    avgEngagementRate: 6.1,
    estimatedCpm: 4.5,
    competitorCount: 156,
    viabilityScore: 75,
    createdAt: '2023-04-05'
  },
  {
    id: '5',
    name: 'Educational Content',
    description: 'Learning made simple and engaging',
    avgMonthlyViews: 210000,
    avgEngagementRate: 8.3,
    estimatedCpm: 5.2,
    competitorCount: 78,
    viabilityScore: 96,
    createdAt: '2023-05-12'
  },
  {
    id: '6',
    name: 'Lifestyle Vlogs',
    description: 'Everyday life and experiences',
    avgMonthlyViews: 67000,
    avgEngagementRate: 3.2,
    estimatedCpm: 3.1,
    competitorCount: 245,
    viabilityScore: 65,
    createdAt: '2023-06-18'
  }
];

export default function ExploreNichesPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNiches, setFilteredNiches] = useState<Niche[]>(mockNiches);
  const [sortOption, setSortOption] = useState('viability');
  const [filterByScore, setFilterByScore] = useState('all');

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null; // Render nothing while redirecting
  }

  // Filter and sort niches based on user input
  useEffect(() => {
    let result = [...mockNiches];
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter(niche => 
        niche.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        niche.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply score filter
    if (filterByScore !== 'all') {
      if (filterByScore === 'high') {
        result = result.filter(niche => niche.viabilityScore >= 80);
      } else if (filterByScore === 'medium') {
        result = result.filter(niche => niche.viabilityScore >= 60 && niche.viabilityScore < 80);
      } else if (filterByScore === 'low') {
        result = result.filter(niche => niche.viabilityScore < 60);
      }
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (sortOption === 'viability') {
        return b.viabilityScore - a.viabilityScore;
      } else if (sortOption === 'views') {
        return b.avgMonthlyViews - a.avgMonthlyViews;
      } else if (sortOption === 'engagement') {
        return b.avgEngagementRate - a.avgEngagementRate;
      } else if (sortOption === 'competitors') {
        return a.competitorCount - b.competitorCount;
      }
      return 0;
    });
    
    setFilteredNiches(result);
  }, [searchQuery, sortOption, filterByScore]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by useEffect
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
              <h1 className="text-2xl font-bold text-gray-900 hidden md:block">Explore Niches</h1>
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
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between bg-gray-50">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Filter className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Filter by:</span>
              </div>
              <select
                value={filterByScore}
                onChange={(e) => setFilterByScore(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Scores</option>
                <option value="high">High (80+)</option>
                <option value="medium">Medium (60-79)</option>
                <option value="low">Low (&lt;60)</option>
              </select>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 ml-4">Sort by:</span>
              </div>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="viability">Viability Score</option>
                <option value="views">Avg Monthly Views</option>
                <option value="engagement">Engagement Rate</option>
                <option value="competitors">Competitors (Lowest First)</option>
              </select>
            </div>
          </div>
        </header>

        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900">Explore Niches</h2>
              <p className="mt-1 text-sm text-gray-500">
                Discover high-potential niches based on our analytics
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNiches.map((niche) => (
                <div key={niche.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{niche.name}</h3>
                        <p className="mt-1 text-sm text-gray-500">{niche.description}</p>
                      </div>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        niche.viabilityScore >= 80 
                          ? 'bg-green-100 text-green-800' 
                          : niche.viabilityScore >= 60 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {niche.viabilityScore}% viability
                      </div>
                    </div>
                    
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <Eye className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm text-gray-500">Avg. Monthly Views</p>
                          <p className="text-sm font-medium text-gray-900">{niche.avgMonthlyViews.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <TrendingUp className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm text-gray-500">Engagement Rate</p>
                          <p className="text-sm font-medium text-gray-900">{niche.avgEngagementRate}%</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm text-gray-500">Competitors</p>
                          <p className="text-sm font-medium text-gray-900">{niche.competitorCount}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm text-gray-500">Est. CPM</p>
                          <p className="text-sm font-medium text-gray-900">${niche.estimatedCpm.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <Link 
                        href={`/explore/${niche.id}`}
                        className="inline-flex items-center text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        View details
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredNiches.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No niches found matching your criteria.</p>
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
            className="bg-blue-700 text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md"
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