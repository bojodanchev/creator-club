import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicLayout } from './PublicLayout';
import { CommunityCard } from './CommunityCard';
import { getPublicCommunities } from '../../features/community/communityService';
import type { CommunityListItem } from '../../core/types';
import { Search, Loader2, Users, Sparkles, Filter } from 'lucide-react';

type SortOption = 'newest' | 'popular' | 'name';

export const CommunitiesDirectory: React.FC = () => {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<CommunityListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    const loadCommunities = async () => {
      try {
        const data = await getPublicCommunities();
        setCommunities(data);
      } catch (error) {
        console.error('Error loading communities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCommunities();
  }, []);

  // Filter and sort communities
  const filteredCommunities = communities
    .filter((community) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        community.name.toLowerCase().includes(query) ||
        community.description?.toLowerCase().includes(query) ||
        community.creator.full_name.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.memberCount - a.memberCount;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
        default:
          return 0; // Already sorted by newest from the API
      }
    });

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/90 text-sm font-medium mb-6">
            <Users className="w-4 h-4" />
            {communities.length} {communities.length === 1 ? 'Community' : 'Communities'} Available
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Discover Communities
          </h1>
          <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
            Join communities led by expert creators. Learn, connect, and grow with like-minded people.
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="bg-white border-b border-slate-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              {filteredCommunities.length} {filteredCommunities.length === 1 ? 'community' : 'communities'} found
            </p>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-sm text-slate-700 bg-transparent border-0 focus:outline-none focus:ring-0 cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="popular">Most Popular</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Communities Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            </div>
          ) : filteredCommunities.length === 0 ? (
            <div className="text-center py-20">
              <Sparkles className="w-16 h-16 text-slate-300 mx-auto" />
              <h3 className="mt-4 text-xl font-semibold text-slate-900">No communities found</h3>
              <p className="mt-2 text-slate-600">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Be the first to create a community!'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCommunities.map((community) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  onClick={() => navigate(`/community/${community.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      {!isLoading && communities.length > 0 && (
        <section className="py-16 bg-gradient-to-r from-slate-900 to-slate-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white">
              Ready to build your own community?
            </h2>
            <p className="mt-4 text-lg text-slate-300">
              Start your journey as a creator and share your knowledge with the world.
            </p>
            <button
              onClick={() => navigate('/signup')}
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              Get Started Free
            </button>
          </div>
        </section>
      )}
    </PublicLayout>
  );
};
