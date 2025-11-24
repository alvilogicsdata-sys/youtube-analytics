'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/authContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BarChart3, 
  TrendingUp, 
  Play, 
  Plus,
  Search,
  Filter,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  Eye,
  Users,
  Star,
  Trash2,
  Edit,
  Share2,
  Download
} from 'lucide-react';
import { Collection, Channel } from '@/types';

// Mock data for collections
const mockCollections: Collection[] = [
  {
    id: '1',
    name: 'Tech Review Channels',
    description: 'Collection of top tech review channels',
    channelIds: ['1', '2', '3'],
    createdAt: '2023-01-15',
    updatedAt: '2024-11-10'
  },
  {
    id: '2',
    name: 'Gaming Highlights',
    description: 'Top gaming channels with highlight videos',
    channelIds: ['4', '5', '6'],
    createdAt: '2023-02-20',
    updatedAt: '2024-10-15'
  },
  {
    id: '3',
    name: 'Educational Content',
    description: 'High-quality educational channels',
    channelIds: ['7', '8', '9', '10'],
    createdAt: '2023-03-10',
    updatedAt: '2024-11-05'
  }
];

// Mock data for channels
const mockChannels: Channel[] = [
  {
    id: '1',
    channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
    title: 'Tech Reviews',
    description: 'Latest tech reviews, comparisons, and buying guides',
    thumbnailUrl: 'https://placehold.co/400x400?text=Tech+Reviews',
    subscriberCount: 45230,
    videoCount: 156,
    viewCount: 2847392,
    createdAt: '2022-01-15',
    updatedAt: '2024-11-17'
  },
  {
    id: '2',
    channelId: 'UC_x5XG1OV2P6uZZ5FSM9Tte',
    title: 'Gadget Testing',
    description: 'Testing the latest gadgets and tech accessories',
    thumbnailUrl: 'https://placehold.co/400x400?text=Gadget+Test',
    subscriberCount: 23400,
    videoCount: 89,
    viewCount: 1567890,
    createdAt: '2022-03-22',
    updatedAt: '2024-11-16'
  },
  {
    id: '3',
    channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttr',
    title: 'Software Tutorials',
    description: 'Step-by-step tutorials for various software',
    thumbnailUrl: 'https://placehold.co/400x400?text=Software+Tut',
    subscriberCount: 32100,
    videoCount: 123,
    viewCount: 2109876,
    createdAt: '2022-05-10',
    updatedAt: '2024-11-15'
  },
  {
    id: '4',
    channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttf',
    title: 'Game Reviews',
    description: 'In-depth reviews of the latest games',
    thumbnailUrl: 'https://placehold.co/400x400?text=Game+Reviews',
    subscriberCount: 87500,
    videoCount: 234,
    viewCount: 4567890,
    createdAt: '2021-11-05',
    updatedAt: '2024-11-14'
  }
];

export default function CollectionsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collections, setCollections] = useState<Collection[]>(mockCollections);
  const [allChannels, setAllChannels] = useState<Channel[]>(mockChannels);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

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
    // Search is handled by useEffect or state updates
  };

  const createCollection = () => {
    if (!newCollectionName.trim()) return;
    
    const newCollection: Collection = {
      id: `col-${Date.now()}`,
      name: newCollectionName,
      description: newCollectionDescription,
      channelIds: selectedChannels,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setCollections([...collections, newCollection]);
    setShowCreateModal(false);
    setNewCollectionName('');
    setNewCollectionDescription('');
    setSelectedChannels([]);
  };

  const deleteCollection = (id: string) => {
    setCollections(collections.filter(col => col.id !== id));
  };

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collection.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <h1 className="text-2xl font-bold text-gray-900 hidden md:block">Collections</h1>
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
                    placeholder="Search collections..."
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
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Collection
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
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900">Your Collections</h2>
              <p className="mt-1 text-sm text-gray-500">
                Organize and manage your favorite YouTube channels
              </p>
            </div>

            {filteredCollections.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-gray-100">
                  <Play className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No collections</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Get started by creating a new collection.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Collection
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCollections.map((collection) => (
                  <div key={collection.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
                    <div className="p-5">
                      <div className="flex justify-between">
                        <h3 className="text-lg font-medium text-gray-900 truncate">{collection.name}</h3>
                        <div className="flex space-x-2">
                          <button className="text-gray-400 hover:text-gray-500">
                            <Edit className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => deleteCollection(collection.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{collection.description}</p>
                      
                      <div className="mt-4 flex items-center text-sm text-gray-500">
                        <Play className="h-4 w-4 mr-1" />
                        <span>{collection.channelIds.length} channels</span>
                      </div>
                      
                      <div className="mt-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Channels in collection</p>
                        <div className="mt-2 space-y-2">
                          {collection.channelIds.slice(0, 3).map((channelId) => {
                            const channel = allChannels.find(c => c.id === channelId);
                            return channel ? (
                              <div key={channelId} className="flex items-center">
                                <img 
                                  src={channel.thumbnailUrl} 
                                  alt={channel.title}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                                <span className="ml-2 text-sm font-medium text-gray-900 truncate">{channel.title}</span>
                              </div>
                            ) : null;
                          })}
                          {collection.channelIds.length > 3 && (
                            <div className="text-sm text-gray-500">
                              +{collection.channelIds.length - 3} more channels
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                      <div className="flex justify-between">
                        <div className="text-xs text-gray-500">
                          Created {new Date(collection.createdAt).toLocaleDateString()}
                        </div>
                        <Link 
                          href={`/collections/${collection.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-900"
                        >
                          View Collection
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Create Collection Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        Create New Collection
                      </h3>
                      <div className="mt-4">
                        <div className="mb-4">
                          <label htmlFor="collection-name" className="block text-sm font-medium text-gray-700">
                            Collection Name
                          </label>
                          <input
                            type="text"
                            id="collection-name"
                            value={newCollectionName}
                            onChange={(e) => setNewCollectionName(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="e.g., Tech Review Channels"
                          />
                        </div>
                        <div className="mb-4">
                          <label htmlFor="collection-description" className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <textarea
                            id="collection-description"
                            rows={3}
                            value={newCollectionDescription}
                            onChange={(e) => setNewCollectionDescription(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Describe what this collection is about"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Channels
                          </label>
                          <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
                            {allChannels.map((channel) => (
                              <div 
                                key={channel.id}
                                className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${
                                  selectedChannels.includes(channel.id) ? 'bg-blue-50' : ''
                                }`}
                                onClick={() => {
                                  if (selectedChannels.includes(channel.id)) {
                                    setSelectedChannels(selectedChannels.filter(id => id !== channel.id));
                                  } else {
                                    setSelectedChannels([...selectedChannels, channel.id]);
                                  }
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedChannels.includes(channel.id)}
                                  onChange={() => {}}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <img 
                                  src={channel.thumbnailUrl} 
                                  alt={channel.title}
                                  className="ml-3 h-8 w-8 rounded-full object-cover"
                                />
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900">{channel.title}</p>
                                  <p className="text-sm text-gray-500">{channel.subscriberCount.toLocaleString()} subs</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={createCollection}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Create Collection
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
            className="bg-blue-700 text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md"
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