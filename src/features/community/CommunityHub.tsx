import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageSquare, MoreHorizontal, Image as ImageIcon, Smile, Send, Plus, Users, Loader2, Trophy, Star, Zap, Pin, Trash2, Copy, Flag, Edit3, X } from 'lucide-react';
import { useAuth } from '../../core/contexts/AuthContext';
import { useCommunity } from '../../core/contexts/CommunityContext';
import {
  getChannels,
  getPosts,
  createPost,
  createCommunity,
  toggleLike,
  joinCommunity,
  getMembership,
  seedDefaultChannels,
  getComments,
  createComment,
  deletePost,
  togglePinPost,
  uploadPostImage,
} from './communityService';
import UserProfilePopup from './UserProfilePopup';
import {
  getUserPoints,
  getCommunityLeaderboard,
  awardPoints,
  getLevelProgress,
  getPointsForNextLevel,
} from './pointsService';
import { DbCommunityChannel, DbPostWithAuthor, DbPoints, DbPostCommentWithAuthor } from '../../core/supabase/database.types';

interface CommunityHubProps {
  showCreateModal?: boolean;
  onCloseCreateModal?: () => void;
}

const CommunityHub: React.FC<CommunityHubProps> = ({ showCreateModal = false, onCloseCreateModal }) => {
  const { user, profile, role } = useAuth();
  const { communities, selectedCommunity, setSelectedCommunity, isLoading: communitiesLoading, refreshCommunities } = useCommunity();

  // State
  const [channels, setChannels] = useState<DbCommunityChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<DbCommunityChannel | null>(null);
  const [posts, setPosts] = useState<DbPostWithAuthor[]>([]);
  const [newPost, setNewPost] = useState('');
  const [isPostingLoading, setIsPostingLoading] = useState(false);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [isMember, setIsMember] = useState(false);

  // Gamification state
  const [userPoints, setUserPoints] = useState<DbPoints | null>(null);
  const [leaderboard, setLeaderboard] = useState<(DbPoints & { user: { full_name: string; avatar_url: string | null; role: string } })[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Comment state
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<Map<string, DbPostCommentWithAuthor[]>>(new Map());
  const [newComment, setNewComment] = useState<Map<string, string>>(new Map());
  const [loadingComments, setLoadingComments] = useState<Set<string>>(new Set());
  const [submittingComment, setSubmittingComment] = useState(false);

  // Profile popup state
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  // Post menu state
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);

  // Image upload and emoji picker state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Handle external showCreateModal prop
  useEffect(() => {
    if (showCreateModal) {
      setShowCreateCommunity(true);
    }
  }, [showCreateModal]);

  // Load channels when community changes
  useEffect(() => {
    if (selectedCommunity) {
      loadChannels(selectedCommunity.id);
      checkMembership(selectedCommunity.id);
      loadUserPoints(selectedCommunity.id);
      loadLeaderboard(selectedCommunity.id);
    }
  }, [selectedCommunity, user]);

  // Load posts when channel changes
  useEffect(() => {
    if (selectedChannel) {
      loadPosts(selectedChannel.id);
    }
  }, [selectedChannel]);

  const loadChannels = async (communityId: string) => {
    const channelList = await getChannels(communityId);
    setChannels(channelList);

    // Auto-select first channel (usually "General")
    if (channelList.length > 0) {
      setSelectedChannel(channelList[0]);
    } else {
      setSelectedChannel(null);
      setPosts([]);
    }
  };

  const loadPosts = async (channelId: string) => {
    const postList = await getPosts(channelId);
    setPosts(postList);
  };

  const checkMembership = async (communityId: string) => {
    if (!user) return;
    const membership = await getMembership(user.id, communityId);
    setIsMember(!!membership);
  };

  const loadUserPoints = async (communityId: string) => {
    if (!user) return;
    const points = await getUserPoints(user.id, communityId);
    setUserPoints(points);
  };

  const loadLeaderboard = async (communityId: string) => {
    const topMembers = await getCommunityLeaderboard(communityId, 10);
    setLeaderboard(topMembers);
  };

  const handleCreateCommunity = async () => {
    if (!user || !newCommunityName.trim()) return;

    const community = await createCommunity(user.id, newCommunityName.trim());
    if (community) {
      // Seed default channels
      await seedDefaultChannels(community.id);

      // Auto-join as admin
      await joinCommunity(user.id, community.id, 'admin');

      // Refresh communities in context (will auto-select the new one)
      await refreshCommunities();
      setNewCommunityName('');
      setShowCreateCommunity(false);
      onCloseCreateModal?.();
    }
  };

  const handleCloseCreateModal = () => {
    setShowCreateCommunity(false);
    setNewCommunityName('');
    onCloseCreateModal?.();
  };

  const handleCreatePost = async () => {
    if (!user || !selectedChannel || !selectedCommunity || !profile) return;
    // Must have either text content or an image
    if (!newPost.trim() && !pendingImage) return;

    setIsPostingLoading(true);
    try {
      let imageUrl: string | null = null;

      // Upload image if present
      if (pendingImage) {
        setIsUploadingImage(true);
        imageUrl = await uploadPostImage(pendingImage, selectedChannel.id);
        setIsUploadingImage(false);
      }

      const post = await createPost(selectedChannel.id, user.id, newPost.trim(), imageUrl);
      if (post) {
        setNewPost('');
        setPendingImage(null);
        setPendingImagePreview(null);
        // Award points for creating a post (using profile.id for FK compatibility)
        await awardPoints(profile.id, selectedCommunity.id, 10, 'Created a post');
        // Reload posts to get the full post with author
        await loadPosts(selectedChannel.id);
        // Reload user points and leaderboard
        await loadUserPoints(selectedCommunity.id);
        await loadLeaderboard(selectedCommunity.id);
      }
    } finally {
      setIsPostingLoading(false);
      setIsUploadingImage(false);
    }
  };

  const handleToggleLike = async (postId: string, currentlyLiked: boolean, authorId: string) => {
    if (!user || !selectedCommunity) return;

    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          user_has_liked: !currentlyLiked,
          likes_count: currentlyLiked ? (p.likes_count || 1) - 1 : (p.likes_count || 0) + 1,
        };
      }
      return p;
    }));

    await toggleLike(postId, user.id, currentlyLiked, authorId, selectedCommunity.id);

    // Reload leaderboard if someone just got points
    if (!currentlyLiked && authorId !== user.id) {
      await loadLeaderboard(selectedCommunity.id);
    }
  };

  const handleJoinCommunity = async () => {
    if (!user || !selectedCommunity) return;
    const membership = await joinCommunity(user.id, selectedCommunity.id);
    if (membership) {
      setIsMember(true);
    }
  };

  const handleToggleComments = async (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      return;
    }

    setExpandedPostId(postId);

    // Load comments if not already loaded
    if (!postComments.has(postId)) {
      setLoadingComments(prev => new Set(prev).add(postId));
      const comments = await getComments(postId);
      setPostComments(prev => new Map(prev).set(postId, comments));
      setLoadingComments(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const handleSubmitComment = async (postId: string) => {
    if (!user || !selectedCommunity) return;
    const commentText = newComment.get(postId)?.trim();
    if (!commentText) return;

    setSubmittingComment(true);
    try {
      const comment = await createComment(postId, user.id, commentText, selectedCommunity.id);
      if (comment) {
        // Clear input
        setNewComment(prev => {
          const next = new Map(prev);
          next.delete(postId);
          return next;
        });

        // Reload comments
        const comments = await getComments(postId);
        setPostComments(prev => new Map(prev).set(postId, comments));

        // Update comment count in post
        setPosts(prev => prev.map(p =>
          p.id === postId
            ? { ...p, comments_count: (p.comments_count || 0) + 1 }
            : p
        ));

        // Reload user points and leaderboard
        await loadUserPoints(selectedCommunity.id);
        await loadLeaderboard(selectedCommunity.id);
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCommentInputChange = (postId: string, value: string) => {
    setNewComment(prev => new Map(prev).set(postId, value));
  };

  const handleOpenProfile = (profileId: string) => {
    setSelectedProfileId(profileId);
    setShowProfilePopup(true);
  };

  const handleCloseProfile = () => {
    setShowProfilePopup(false);
    setSelectedProfileId(null);
  };

  // Post menu handlers
  const handleToggleMenu = (postId: string) => {
    setOpenMenuPostId(prev => prev === postId ? null : postId);
  };

  const handleCloseMenu = () => {
    setOpenMenuPostId(null);
  };

  const handlePinPost = async (postId: string, currentlyPinned: boolean) => {
    const success = await togglePinPost(postId, currentlyPinned);
    if (success) {
      // Optimistic update
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, is_pinned: !currentlyPinned } : p
      ));
      // Reload posts to get proper ordering
      if (selectedChannel) {
        await loadPosts(selectedChannel.id);
      }
    }
    handleCloseMenu();
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      handleCloseMenu();
      return;
    }
    const success = await deletePost(postId);
    if (success) {
      setPosts(prev => prev.filter(p => p.id !== postId));
    }
    handleCloseMenu();
  };

  const handleCopyPostLink = (postId: string) => {
    const url = `${window.location.origin}/community/post/${postId}`;
    navigator.clipboard.writeText(url);
    handleCloseMenu();
  };

  const handleReportPost = (postId: string) => {
    // For now, just show an alert - can be expanded later
    alert('Thank you for reporting. Our team will review this post.');
    handleCloseMenu();
  };

  const isCreator = role === 'creator' || role === 'superadmin';

  // Common emojis for quick picker
  const commonEmojis = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '💪', '🙌', '✨', '👏', '🚀', '💯', '🤔', '😊', '🙏', '💡'];

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPendingImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    setPendingImage(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setPendingImage(null);
    setPendingImagePreview(null);
  };

  const handleEmojiClick = (emoji: string) => {
    setNewPost(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Show loading state
  if (communitiesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Show empty state if no communities
  if (communities.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No Communities Yet</h2>
          <p className="text-slate-500 mb-6">
            {role === 'creator'
              ? "Create your first community to start engaging with your students."
              : "You haven't joined any communities yet."
            }
          </p>
          {role === 'creator' && (
            <button
              onClick={() => setShowCreateCommunity(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Create Community
            </button>
          )}
        </div>

        {/* Create Community Modal */}
        {showCreateCommunity && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Create Community</h3>
              <input
                type="text"
                value={newCommunityName}
                onChange={(e) => setNewCommunityName(e.target.value)}
                placeholder="Community name"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleCloseCreateModal}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCommunity}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 h-full flex gap-6">
      {/* Channels Sidebar */}
      <div className="w-64 hidden lg:block shrink-0">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sticky top-6">
          {/* Community Selector */}
          {communities.length > 1 && (
            <div className="mb-4 pb-4 border-b border-slate-100">
              <select
                value={selectedCommunity?.id || ''}
                onChange={(e) => {
                  const comm = communities.find(c => c.id === e.target.value);
                  setSelectedCommunity(comm || null);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              >
                {communities.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {selectedCommunity && (
            <div className="mb-4">
              <h2 className="font-semibold text-slate-900 truncate">{selectedCommunity.name}</h2>
              {selectedCommunity.description && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{selectedCommunity.description}</p>
              )}
            </div>
          )}

          {/* User Points Display */}
          {isMember && userPoints && (
            <div className="mb-4 pb-4 border-b border-slate-100">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-semibold text-slate-700">Your Level</span>
                  </div>
                  <span className="text-lg font-bold text-indigo-600">{userPoints.level}</span>
                </div>
                <div className="mb-1">
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>{userPoints.total_points} points</span>
                    <span>{getPointsForNextLevel(userPoints.level)} pts</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${getLevelProgress(userPoints.total_points, userPoints.level)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Channels</h3>
          <div className="space-y-1">
            {channels.map(channel => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${selectedChannel?.id === channel.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}
                `}
              >
                # {channel.name.toLowerCase().replace(/ /g, '-')}
              </button>
            ))}
          </div>

          {/* Leaderboard button */}
          {isMember && (
            <button
              onClick={() => setShowLeaderboard(true)}
              className="w-full mt-4 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 rounded-lg flex items-center gap-2 font-medium"
            >
              <Trophy size={16} />
              Leaderboard
            </button>
          )}

          {/* Create Community button for creators */}
          {role === 'creator' && (
            <button
              onClick={() => setShowCreateCommunity(true)}
              className="w-full mt-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center gap-2"
            >
              <Plus size={16} />
              New Community
            </button>
          )}
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 space-y-6">
        {/* Join Banner (for non-members) */}
        {!isMember && selectedCommunity && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-indigo-900 font-medium">Join this community</p>
              <p className="text-indigo-700 text-sm">Become a member to post and interact</p>
            </div>
            <button
              onClick={handleJoinCommunity}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              Join Community
            </button>
          </div>
        )}

        {/* Create Post */}
        {isMember && selectedChannel && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <div className="flex gap-4">
              <img
                src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=6366f1&color=fff`}
                className="w-10 h-10 rounded-full"
                alt="Me"
              />
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share something with the club..."
                  className="w-full bg-slate-50 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 resize-none h-24"
                />

                {/* Image Preview */}
                {pendingImagePreview && (
                  <div className="relative mt-3 inline-block">
                    <img
                      src={pendingImagePreview}
                      alt="Upload preview"
                      className="max-h-48 rounded-lg border border-slate-200"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-slate-800 text-white p-1 rounded-full hover:bg-slate-700 transition-colors"
                      title="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center mt-3">
                  <div className="flex gap-2 relative">
                    {/* Hidden file input for image upload */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      onClick={handleImageClick}
                      className={`p-2 rounded-full transition-colors ${pendingImage ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                      title="Add image"
                    >
                      <ImageIcon size={20} />
                    </button>
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`p-2 rounded-full transition-colors ${showEmojiPicker ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                      title="Add emoji"
                    >
                      <Smile size={20} />
                    </button>

                    {/* Emoji Picker - Compact popover above the button */}
                    {showEmojiPicker && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                        <div
                          className="absolute z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-3"
                          style={{
                            bottom: 'calc(100% + 8px)',
                            left: '0',
                            width: '280px'
                          }}
                        >
                          <div className="grid grid-cols-8 gap-1">
                            {commonEmojis.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleEmojiClick(emoji)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-md transition-colors text-xl leading-none"
                              >
                                <span role="img" aria-label="emoji">{emoji}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    onClick={handleCreatePost}
                    disabled={(!newPost.trim() && !pendingImage) || isPostingLoading}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPostingLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        {isUploadingImage ? 'Uploading...' : 'Posting...'}
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Post
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Posts */}
        <div className="space-y-4">
          {posts.length === 0 && selectedChannel && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No posts in this channel yet.</p>
              {isMember && <p className="text-slate-400 text-sm mt-1">Be the first to post!</p>}
            </div>
          )}

          {posts.map(post => (
            <div key={post.id} className={`bg-white rounded-xl shadow-sm border p-5 ${post.is_pinned ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'}`}>
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <button
                    onClick={() => post.author?.id && handleOpenProfile(post.author.id)}
                    className="shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-full"
                  >
                    <img
                      src={post.author?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.full_name || 'User')}&background=6366f1&color=fff`}
                      className="w-10 h-10 rounded-full hover:ring-2 hover:ring-indigo-300 transition-all cursor-pointer"
                      alt={post.author?.full_name || 'User'}
                    />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => post.author?.id && handleOpenProfile(post.author.id)}
                        className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer"
                      >
                        {post.author?.full_name || 'Anonymous'}
                      </button>
                      {post.author?.role === 'creator' && (
                        <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold">CREATOR</span>
                      )}
                      {post.author?.role === 'superadmin' && (
                        <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold">ADMIN</span>
                      )}
                      {post.is_pinned && (
                        <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <Pin size={10} /> PINNED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{formatTimestamp(post.created_at)}</p>
                  </div>
                </div>

                {/* Post Menu */}
                <div className="relative">
                  <button
                    onClick={() => handleToggleMenu(post.id)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                  >
                    <MoreHorizontal size={20} />
                  </button>

                  {/* Dropdown Menu */}
                  {openMenuPostId === post.id && (
                    <>
                      {/* Backdrop to close menu */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={handleCloseMenu}
                      />
                      <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 min-w-[160px]">
                        {/* Copy Link - Available to everyone */}
                        <button
                          onClick={() => handleCopyPostLink(post.id)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Copy size={16} />
                          Copy link
                        </button>

                        {/* Creator-only options */}
                        {isCreator && (
                          <>
                            <button
                              onClick={() => handlePinPost(post.id, post.is_pinned || false)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <Pin size={16} />
                              {post.is_pinned ? 'Unpin post' : 'Pin post'}
                            </button>
                            <div className="border-t border-slate-100 my-1" />
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={16} />
                              Delete post
                            </button>
                          </>
                        )}

                        {/* Report - Available to non-creators */}
                        {!isCreator && (
                          <button
                            onClick={() => handleReportPost(post.id)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Flag size={16} />
                            Report
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Post Content */}
              {post.content && (
                <div className="mt-4 text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </div>
              )}

              {/* Post Image */}
              {post.image_url && (
                <div className="mt-4">
                  <img
                    src={post.image_url}
                    alt="Post image"
                    className="max-w-full rounded-lg border border-slate-200 cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() => window.open(post.image_url!, '_blank')}
                  />
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-slate-50 flex gap-6">
                <button
                  onClick={() => handleToggleLike(post.id, post.user_has_liked || false, post.author_id)}
                  className={`flex items-center gap-2 text-sm transition-colors ${
                    post.user_has_liked
                      ? 'text-rose-500'
                      : 'text-slate-500 hover:text-rose-500'
                  }`}
                >
                  <Heart size={18} fill={post.user_has_liked ? 'currentColor' : 'none'} />
                  {post.likes_count || 0}
                </button>
                <button
                  onClick={() => handleToggleComments(post.id)}
                  className={`flex items-center gap-2 text-sm transition-colors ${
                    expandedPostId === post.id
                      ? 'text-indigo-600'
                      : 'text-slate-500 hover:text-indigo-600'
                  }`}
                >
                  <MessageSquare size={18} /> {post.comments_count || 0}
                </button>
              </div>

              {/* Comments Section */}
              {expandedPostId === post.id && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  {/* Loading state */}
                  {loadingComments.has(post.id) && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                    </div>
                  )}

                  {/* Comments list */}
                  {!loadingComments.has(post.id) && postComments.get(post.id) && (
                    <div className="space-y-3 mb-4">
                      {postComments.get(post.id)?.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-2">No comments yet. Be the first!</p>
                      ) : (
                        postComments.get(post.id)?.map(comment => (
                          <div key={comment.id} className="flex gap-3">
                            <button
                              onClick={() => comment.author?.id && handleOpenProfile(comment.author.id)}
                              className="shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-full"
                            >
                              <img
                                src={comment.author?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author?.full_name || 'User')}&background=6366f1&color=fff`}
                                className="w-8 h-8 rounded-full hover:ring-2 hover:ring-indigo-300 transition-all cursor-pointer"
                                alt={comment.author?.full_name || 'User'}
                              />
                            </button>
                            <div className="flex-1 bg-slate-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <button
                                  onClick={() => comment.author?.id && handleOpenProfile(comment.author.id)}
                                  className="text-sm font-medium text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer"
                                >
                                  {comment.author?.full_name || 'Anonymous'}
                                </button>
                                <span className="text-xs text-slate-400">{formatTimestamp(comment.created_at)}</span>
                              </div>
                              <p className="text-sm text-slate-700">{comment.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Comment input */}
                  {isMember && (
                    <div className="flex gap-3">
                      <img
                        src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=6366f1&color=fff`}
                        className="w-8 h-8 rounded-full shrink-0"
                        alt="Me"
                      />
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={newComment.get(post.id) || ''}
                          onChange={(e) => handleCommentInputChange(post.id, e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment(post.id)}
                          placeholder="Write a comment..."
                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => handleSubmitComment(post.id)}
                          disabled={!newComment.get(post.id)?.trim() || submittingComment}
                          className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submittingComment ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Send size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create Community Modal */}
      {showCreateCommunity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create Community</h3>
            <input
              type="text"
              value={newCommunityName}
              onChange={(e) => setNewCommunityName(e.target.value)}
              placeholder="Community name"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleCloseCreateModal}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCommunity}
                disabled={!newCommunityName.trim()}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Popup */}
      {selectedProfileId && (
        <UserProfilePopup
          profileId={selectedProfileId}
          isOpen={showProfilePopup}
          onClose={handleCloseProfile}
        />
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-2 rounded-lg">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Leaderboard</h3>
                    <p className="text-sm text-slate-500">Top members by points</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLeaderboard(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-6">
              {leaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No members with points yet</p>
                  <p className="text-sm text-slate-400 mt-1">Be the first to earn points!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((member, index) => {
                    const isCurrentUser = user?.id === member.user_id;
                    const rankColors = [
                      'from-amber-400 to-amber-600', // 1st place
                      'from-slate-300 to-slate-500', // 2nd place
                      'from-orange-400 to-orange-600', // 3rd place
                    ];
                    const rankColor = index < 3 ? rankColors[index] : 'from-slate-200 to-slate-400';

                    return (
                      <div
                        key={member.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                          isCurrentUser
                            ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-200'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br ${rankColor} text-white font-bold text-sm shrink-0`}>
                          {index + 1}
                        </div>

                        <button
                          onClick={() => handleOpenProfile(member.user_id)}
                          className="shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-full"
                        >
                          <img
                            src={member.user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user.full_name)}&background=6366f1&color=fff`}
                            className="w-10 h-10 rounded-full hover:ring-2 hover:ring-indigo-300 transition-all cursor-pointer"
                            alt={member.user.full_name}
                          />
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenProfile(member.user_id)}
                              className="font-semibold text-slate-900 truncate hover:text-indigo-600 transition-colors cursor-pointer"
                            >
                              {member.user.full_name}
                              {isCurrentUser && <span className="text-indigo-600 ml-1">(You)</span>}
                            </button>
                            {member.user.role === 'creator' && (
                              <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold">CREATOR</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">Level {member.level}</span>
                            <span className="text-xs text-slate-300">•</span>
                            <span className="text-xs text-slate-500">{member.total_points} points</span>
                          </div>
                        </div>

                        {index < 3 && (
                          <Star className={`w-5 h-5 ${index === 0 ? 'text-amber-500' : index === 1 ? 'text-slate-400' : 'text-orange-500'}`} fill="currentColor" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityHub;
