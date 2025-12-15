import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { PublicLayout } from './PublicLayout';
import { JoinButton } from './JoinButton';
import { useAuth } from '../../core/contexts/AuthContext';
import { getCommunityPublicData, joinCommunity, getMembership } from '../../features/community/communityService';
import type { CommunityPublicData } from '../../core/types';
import {
  Users,
  MessageSquare,
  Hash,
  Heart,
  Calendar,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

export const CommunityLandingPage: React.FC = () => {
  const { communityId } = useParams<{ communityId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [communityData, setCommunityData] = useState<CommunityPublicData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAutoJoining, setIsAutoJoining] = useState(false);

  // Load community data
  useEffect(() => {
    const loadCommunity = async () => {
      if (!communityId) {
        setError('Community not found');
        setIsLoading(false);
        return;
      }

      try {
        const data = await getCommunityPublicData(communityId);
        if (!data) {
          setError('This community is private or does not exist.');
        } else {
          setCommunityData(data);
        }
      } catch (err) {
        setError('Failed to load community. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCommunity();
  }, [communityId]);

  // Handle auto-join after authentication
  useEffect(() => {
    const handleAutoJoin = async () => {
      const action = searchParams.get('action');
      if (user && action === 'join' && communityId && communityData) {
        setIsAutoJoining(true);

        // Check if already a member
        const membership = await getMembership(user.id, communityId);
        if (membership) {
          navigate('/app/community');
          return;
        }

        // Join the community
        const result = await joinCommunity(user.id, communityId);
        if (result) {
          navigate('/app/community');
        } else {
          setIsAutoJoining(false);
        }
      }
    };

    handleAutoJoin();
  }, [user, searchParams, communityId, communityData, navigate]);

  // Loading state
  if (isLoading) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
            <p className="mt-4 text-slate-600">Loading community...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // Error state
  if (error || !communityData) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <AlertCircle className="w-16 h-16 text-slate-400 mx-auto" />
            <h1 className="mt-4 text-2xl font-bold text-slate-900">Community Not Found</h1>
            <p className="mt-2 text-slate-600">
              {error || 'This community may be private or no longer exists.'}
            </p>
            <button
              onClick={() => navigate('/communities')}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Browse Communities
            </button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // Auto-joining state
  if (isAutoJoining) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
            <p className="mt-4 text-lg font-medium text-slate-900">
              Joining {communityData.community.name}...
            </p>
            <p className="mt-1 text-slate-600">Please wait while we set up your membership.</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const { community, memberCount, channelPreviews, recentPosts, creator } = communityData;
  const placeholderImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(community.name)}&background=6366f1&color=fff&size=800`;

  return (
    <PublicLayout transparentNav>
      {/* Hero Section */}
      <section className="relative">
        {/* Background Image */}
        <div className="h-80 md:h-96 relative overflow-hidden">
          <img
            src={community.thumbnail_url || placeholderImage}
            alt={community.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-12 w-full">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                  {community.name}
                </h1>
                {community.description && (
                  <p className="mt-3 text-lg text-white/80 max-w-2xl">
                    {community.description}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-4 text-white/70">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {memberCount.toLocaleString()} {memberCount === 1 ? 'member' : 'members'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Hash className="w-4 h-4" />
                    {channelPreviews.length} {channelPreviews.length === 1 ? 'channel' : 'channels'}
                  </span>
                </div>
              </div>

              <div className="flex-shrink-0">
                <JoinButton
                  communityId={community.id}
                  communityName={community.name}
                  size="lg"
                  variant="primary"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Channels Preview */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">Channels</h2>
                <p className="text-sm text-slate-600">
                  Join to participate in discussions
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {channelPreviews.length === 0 ? (
                  <div className="px-6 py-8 text-center text-slate-500">
                    No channels yet
                  </div>
                ) : (
                  channelPreviews.map((channel) => (
                    <div key={channel.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <Hash className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900">{channel.name}</h3>
                          {channel.description && (
                            <p className="text-sm text-slate-500 line-clamp-1">
                              {channel.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-slate-500">
                        {channel.postCount} {channel.postCount === 1 ? 'post' : 'posts'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Recent Posts Preview */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
                <p className="text-sm text-slate-600">
                  See what members are discussing
                </p>
              </div>

              {recentPosts.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="mt-3 text-slate-500">No posts yet. Be the first to share!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentPosts.map((post) => (
                    <div key={post.id} className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <img
                          src={post.author.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.full_name)}&background=e2e8f0&color=475569&size=40`}
                          alt={post.author.full_name}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">
                              {post.author.full_name}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="mt-1 text-slate-600 line-clamp-2">
                            {post.content}
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-sm text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Heart className="w-4 h-4" />
                              {post.likes_count}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              {post.comments_count}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Join CTA */}
              <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-700">
                    Join to see all posts and participate in discussions
                  </p>
                  <JoinButton
                    communityId={community.id}
                    communityName={community.name}
                    size="sm"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Creator Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">
                Created by
              </h3>
              <div className="flex items-center gap-4">
                <img
                  src={creator.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.full_name)}&background=6366f1&color=fff&size=64`}
                  alt={creator.full_name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold text-slate-900">
                    {creator.brand_name || creator.full_name}
                  </h4>
                  {creator.brand_name && (
                    <p className="text-sm text-slate-500">{creator.full_name}</p>
                  )}
                </div>
              </div>
              {creator.bio && (
                <p className="mt-4 text-sm text-slate-600 line-clamp-4">
                  {creator.bio}
                </p>
              )}
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">
                Community Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Members</span>
                  <span className="font-semibold text-slate-900">{memberCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Channels</span>
                  <span className="font-semibold text-slate-900">{channelPreviews.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Created</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(community.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* CTA Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-sm p-6 text-white">
              <Sparkles className="w-8 h-8 mb-3" />
              <h3 className="text-lg font-semibold">Ready to join?</h3>
              <p className="mt-2 text-sm text-white/80">
                Get access to exclusive content, connect with other members, and grow together.
              </p>
              <div className="mt-4">
                <JoinButton
                  communityId={community.id}
                  communityName={community.name}
                  variant="secondary"
                  className="!bg-white !text-indigo-600 hover:!bg-slate-100 !border-0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};
