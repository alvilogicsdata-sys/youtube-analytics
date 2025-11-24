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