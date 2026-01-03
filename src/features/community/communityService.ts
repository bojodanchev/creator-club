import { supabase } from '../../core/supabase/client';
import {
  DbCommunity,
  DbCommunityChannel,
  DbPost,
  DbPostWithAuthor,
  DbPostComment,
  DbPostCommentWithAuthor,
  DbMembership,
  MembershipRole,
} from '../../core/supabase/database.types';

// ============================================================================
// COMMUNITIES
// ============================================================================

export async function getCommunities(): Promise<DbCommunity[]> {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching communities:', error);
    return [];
  }
  return data || [];
}

export async function getCreatorCommunities(userId: string): Promise<DbCommunity[]> {
  // First, get the profile ID for this user (FK references profiles.id, not user_id)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching profile for creator communities:', profileError);
    return [];
  }

  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .eq('creator_id', profile.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching creator communities:', error);
    return [];
  }
  return data || [];
}

export async function getMemberCommunities(userId: string): Promise<DbCommunity[]> {
  // First, get the profile ID for this user (FK references profiles.id, not user_id)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching profile for member communities:', profileError);
    return [];
  }

  const { data, error } = await supabase
    .from('memberships')
    .select('community:communities(*)')
    .eq('user_id', profile.id);

  if (error) {
    console.error('Error fetching member communities:', error);
    return [];
  }

  // Extract communities from the join result
  return data?.map((m: any) => m.community).filter(Boolean) || [];
}

export async function createCommunity(
  userId: string,
  name: string,
  description?: string,
  isPublic: boolean = true
): Promise<DbCommunity | null> {
  // First, get the profile ID for this user (FK references profiles.id, not user_id)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching profile for community creation:', profileError);
    return null;
  }

  const { data, error } = await supabase
    .from('communities')
    .insert({
      creator_id: profile.id,
      name,
      description,
      is_public: isPublic,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating community:', error);
    return null;
  }
  return data;
}

// ============================================================================
// CHANNELS
// ============================================================================

export async function getChannels(communityId: string): Promise<DbCommunityChannel[]> {
  const { data, error } = await supabase
    .from('community_channels')
    .select('*')
    .eq('community_id', communityId)
    .order('position', { ascending: true });

  if (error) {
    console.error('Error fetching channels:', error);
    return [];
  }
  return data || [];
}

export async function createChannel(
  communityId: string,
  name: string,
  description?: string,
  position: number = 0
): Promise<DbCommunityChannel | null> {
  const { data, error } = await supabase
    .from('community_channels')
    .insert({
      community_id: communityId,
      name,
      description,
      position,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating channel:', error);
    return null;
  }
  return data;
}

export async function updateChannel(
  channelId: string,
  updates: { name?: string; description?: string; position?: number }
): Promise<DbCommunityChannel | null> {
  const { data, error } = await supabase
    .from('community_channels')
    .update(updates)
    .eq('id', channelId)
    .select()
    .single();

  if (error) {
    console.error('Error updating channel:', error);
    return null;
  }
  return data;
}

export async function deleteChannel(channelId: string): Promise<boolean> {
  // First delete all posts in this channel
  const { error: postsError } = await supabase
    .from('posts')
    .delete()
    .eq('channel_id', channelId);

  if (postsError) {
    console.error('Error deleting channel posts:', postsError);
    return false;
  }

  // Then delete the channel
  const { error } = await supabase
    .from('community_channels')
    .delete()
    .eq('id', channelId);

  if (error) {
    console.error('Error deleting channel:', error);
    return false;
  }
  return true;
}

export async function reorderChannels(
  channelIds: string[]
): Promise<boolean> {
  // Update positions based on array order
  const updates = channelIds.map((id, index) =>
    supabase
      .from('community_channels')
      .update({ position: index })
      .eq('id', id)
  );

  const results = await Promise.all(updates);
  const hasError = results.some(r => r.error);

  if (hasError) {
    console.error('Error reordering channels');
    return false;
  }
  return true;
}

// ============================================================================
// MEMBERSHIPS
// ============================================================================

export async function joinCommunity(
  userId: string,
  communityId: string,
  role: MembershipRole = 'member'
): Promise<DbMembership | null> {
  // First, get the profile ID for this user (FK references profiles.id, not user_id)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching profile for join community:', profileError);
    return null;
  }

  const { data, error } = await supabase
    .from('memberships')
    .insert({
      user_id: profile.id,
      community_id: communityId,
      role,
    })
    .select()
    .single();

  if (error) {
    console.error('Error joining community:', error);
    return null;
  }
  return data;
}

export async function getMembership(
  userId: string,
  communityId: string
): Promise<DbMembership | null> {
  // First, get the profile ID for this user (FK references profiles.id, not user_id)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (profileError || !profile) {
    return null;
  }

  const { data, error } = await supabase
    .from('memberships')
    .select('*')
    .eq('user_id', profile.id)
    .eq('community_id', communityId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error fetching membership:', error);
  }
  return data || null;
}

// ============================================================================
// POSTS
// ============================================================================

export async function getPosts(channelId: string): Promise<DbPostWithAuthor[]> {
  // First get posts with authors - pinned posts first, then by date
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles!author_id(*)
    `)
    .eq('channel_id', channelId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (postsError) {
    console.error('Error fetching posts:', postsError);
    return [];
  }

  // Get like counts for all posts
  const postIds = posts?.map(p => p.id) || [];

  if (postIds.length === 0) return [];

  // Get likes count
  const { data: likes } = await supabase
    .from('post_likes')
    .select('post_id')
    .in('post_id', postIds);

  // Get comments count
  const { data: comments } = await supabase
    .from('post_comments')
    .select('post_id')
    .in('post_id', postIds);

  // Get current user's likes (need to lookup profile.id from auth user)
  const { data: { user } } = await supabase.auth.getUser();
  let userLikes: { post_id: string }[] | null = [];
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      const { data } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', profile.id)
        .in('post_id', postIds);
      userLikes = data;
    }
  }

  // Combine the data
  const likesMap = new Map<string, number>();
  const commentsMap = new Map<string, number>();
  const userLikesSet = new Set(userLikes?.map(l => l.post_id) || []);

  likes?.forEach(l => {
    likesMap.set(l.post_id, (likesMap.get(l.post_id) || 0) + 1);
  });

  comments?.forEach(c => {
    commentsMap.set(c.post_id, (commentsMap.get(c.post_id) || 0) + 1);
  });

  return posts?.map(post => ({
    ...post,
    likes_count: likesMap.get(post.id) || 0,
    comments_count: commentsMap.get(post.id) || 0,
    user_has_liked: userLikesSet.has(post.id),
  })) || [];
}

export async function createPost(
  channelId: string,
  userId: string,
  content: string,
  imageUrl?: string | null
): Promise<DbPost | null> {
  // First, get the profile ID for this user (FK references profiles.id, not user_id)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching profile for create post:', profileError);
    return null;
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      channel_id: channelId,
      author_id: profile.id,
      content,
      image_url: imageUrl || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating post:', error);
    return null;
  }
  return data;
}

export async function uploadPostImage(file: File, channelId: string): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${channelId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('post-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading image:', error);
    return null;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('post-images')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

export async function deletePost(postId: string): Promise<boolean> {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);

  if (error) {
    console.error('Error deleting post:', error);
    return false;
  }
  return true;
}

export async function pinPost(postId: string): Promise<boolean> {
  const { error } = await supabase
    .from('posts')
    .update({ is_pinned: true })
    .eq('id', postId);

  if (error) {
    console.error('Error pinning post:', error);
    return false;
  }
  return true;
}

export async function unpinPost(postId: string): Promise<boolean> {
  const { error } = await supabase
    .from('posts')
    .update({ is_pinned: false })
    .eq('id', postId);

  if (error) {
    console.error('Error unpinning post:', error);
    return false;
  }
  return true;
}

export async function togglePinPost(postId: string, currentlyPinned: boolean): Promise<boolean> {
  if (currentlyPinned) {
    return unpinPost(postId);
  } else {
    return pinPost(postId);
  }
}

// ============================================================================
// LIKES
// ============================================================================

export async function likePost(
  postId: string,
  userId: string,
  authorId?: string,
  communityId?: string
): Promise<boolean> {
  // First, get the profile ID for this user (FK references profiles.id, not user_id)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching profile for like post:', profileError);
    return false;
  }

  const { error } = await supabase
    .from('post_likes')
    .insert({
      post_id: postId,
      user_id: profile.id,
    });

  if (error) {
    console.error('Error liking post:', error);
    return false;
  }

  // Award points to post author if provided (authorId here is already profile.id)
  if (authorId && communityId && authorId !== profile.id) {
    const { awardPoints } = await import('./pointsService');
    await awardPoints(authorId, communityId, 2, 'Received a like on post');
  }

  return true;
}

export async function unlikePost(postId: string, userId: string): Promise<boolean> {
  // First, get the profile ID for this user (FK references profiles.id, not user_id)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching profile for unlike post:', profileError);
    return false;
  }

  const { error } = await supabase
    .from('post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', profile.id);

  if (error) {
    console.error('Error unliking post:', error);
    return false;
  }
  return true;
}

export async function toggleLike(
  postId: string,
  userId: string,
  currentlyLiked: boolean,
  authorId?: string,
  communityId?: string
): Promise<boolean> {
  if (currentlyLiked) {
    return unlikePost(postId, userId);
  } else {
    return likePost(postId, userId, authorId, communityId);
  }
}

// ============================================================================
// COMMENTS
// ============================================================================

export async function getComments(postId: string): Promise<DbPostCommentWithAuthor[]> {
  const { data, error } = await supabase
    .from('post_comments')
    .select(`
      *,
      author:profiles!author_id(*)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
  return data || [];
}

export async function createComment(
  postId: string,
  userId: string,
  content: string,
  communityId?: string
): Promise<DbPostComment | null> {
  // First, get the profile ID for this user (FK references profiles.id, not user_id)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching profile for create comment:', profileError);
    return null;
  }

  const { data, error } = await supabase
    .from('post_comments')
    .insert({
      post_id: postId,
      author_id: profile.id,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating comment:', error);
    return null;
  }

  // Award points for creating a comment
  if (communityId) {
    const { awardPoints } = await import('./pointsService');
    await awardPoints(profile.id, communityId, 5, 'Created a comment');
  }

  return data;
}

export async function deleteComment(commentId: string): Promise<boolean> {
  const { error } = await supabase
    .from('post_comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    console.error('Error deleting comment:', error);
    return false;
  }
  return true;
}

// ============================================================================
// SEED DATA (for initial setup)
// ============================================================================

export async function seedDefaultChannels(communityId: string): Promise<void> {
  const defaultChannels = [
    { name: 'General', description: 'General discussions', position: 0 },
    { name: 'Wins', description: 'Share your wins!', position: 1 },
    { name: 'Help Needed', description: 'Ask for help here', position: 2 },
    { name: 'Announcements', description: 'Important announcements', position: 3 },
    { name: 'Introductions', description: 'Introduce yourself', position: 4 },
  ];

  for (const channel of defaultChannels) {
    await createChannel(communityId, channel.name, channel.description, channel.position);
  }
}

// ============================================================================
// PUBLIC COMMUNITY ACCESS (No Auth Required - for landing pages)
// ============================================================================

import type {
  CommunityListItem,
  ChannelPreview,
  PostPreview,
  CreatorPublicProfile,
  CommunityPublicData,
} from '../../core/types';

/**
 * Get a public community by ID
 * Returns null if community doesn't exist or is not public
 */
export async function getPublicCommunity(communityId: string): Promise<DbCommunity | null> {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .eq('id', communityId)
    .eq('is_public', true)
    .single();

  if (error) {
    console.error('Error fetching public community:', error);
    return null;
  }
  return data;
}

/**
 * Get all public communities with member counts
 * For the communities directory
 */
export async function getPublicCommunities(): Promise<CommunityListItem[]> {
  const { data, error } = await supabase
    .from('communities')
    .select(`
      id,
      name,
      description,
      thumbnail_url,
      created_at,
      creator:profiles!creator_id(id, full_name, avatar_url)
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching public communities:', error);
    return [];
  }

  // Get member counts for all communities
  const communityIds = data?.map((c: any) => c.id) || [];
  const memberCounts = await getCommunityMemberCounts(communityIds);

  return data?.map((community: any) => ({
    id: community.id,
    name: community.name,
    description: community.description,
    thumbnail_url: community.thumbnail_url,
    memberCount: memberCounts.get(community.id) || 0,
    creator: {
      id: community.creator?.id || '',
      full_name: community.creator?.full_name || 'Unknown',
      avatar_url: community.creator?.avatar_url || null,
    },
  })) || [];
}

/**
 * Get member count for a single community
 */
export async function getCommunityMemberCount(communityId: string): Promise<number> {
  const { count, error } = await supabase
    .from('memberships')
    .select('*', { count: 'exact', head: true })
    .eq('community_id', communityId);

  if (error) {
    console.error('Error fetching member count:', error);
    return 0;
  }
  return count || 0;
}

/**
 * Get member counts for multiple communities (batch)
 */
async function getCommunityMemberCounts(communityIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();

  if (communityIds.length === 0) return counts;

  const { data, error } = await supabase
    .from('memberships')
    .select('community_id')
    .in('community_id', communityIds);

  if (error) {
    console.error('Error fetching member counts:', error);
    return counts;
  }

  // Count memberships per community
  data?.forEach((m: any) => {
    counts.set(m.community_id, (counts.get(m.community_id) || 0) + 1);
  });

  return counts;
}

/**
 * Get channel preview for a public community
 * Returns channel names and post counts (no content)
 */
export async function getPublicChannelPreview(communityId: string): Promise<ChannelPreview[]> {
  const { data, error } = await supabase
    .from('community_channels')
    .select('id, name, description')
    .eq('community_id', communityId)
    .order('position', { ascending: true });

  if (error) {
    console.error('Error fetching channel preview:', error);
    return [];
  }

  // Get post counts per channel
  const channelIds = data?.map((c: any) => c.id) || [];
  const postCounts = await getChannelPostCounts(channelIds);

  return data?.map((channel: any) => ({
    id: channel.id,
    name: channel.name,
    description: channel.description,
    postCount: postCounts.get(channel.id) || 0,
  })) || [];
}

/**
 * Get post counts for multiple channels (batch)
 */
async function getChannelPostCounts(channelIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();

  if (channelIds.length === 0) return counts;

  const { data, error } = await supabase
    .from('posts')
    .select('channel_id')
    .in('channel_id', channelIds);

  if (error) {
    console.error('Error fetching post counts:', error);
    return counts;
  }

  data?.forEach((p: any) => {
    counts.set(p.channel_id, (counts.get(p.channel_id) || 0) + 1);
  });

  return counts;
}

/**
 * Get preview of recent posts for a public community
 * Returns limited, sanitized content for unauthenticated viewing
 */
export async function getPublicPostsPreview(
  communityId: string,
  limit: number = 5
): Promise<PostPreview[]> {
  // First get channels for this community
  const { data: channels } = await supabase
    .from('community_channels')
    .select('id')
    .eq('community_id', communityId);

  if (!channels || channels.length === 0) return [];

  const channelIds = channels.map((c: any) => c.id);

  // Get recent posts from these channels
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      created_at,
      author:profiles!author_id(full_name, avatar_url)
    `)
    .in('channel_id', channelIds)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching post preview:', error);
    return [];
  }

  // Get likes and comments counts
  const postIds = posts?.map((p: any) => p.id) || [];
  const [likes, comments] = await Promise.all([
    getPostLikeCounts(postIds),
    getPostCommentCounts(postIds),
  ]);

  return posts?.map((post: any) => ({
    id: post.id,
    content: truncateContent(post.content, 200),
    author: {
      full_name: post.author?.full_name || 'Unknown',
      avatar_url: post.author?.avatar_url || null,
    },
    created_at: post.created_at,
    likes_count: likes.get(post.id) || 0,
    comments_count: comments.get(post.id) || 0,
  })) || [];
}

/**
 * Get like counts for multiple posts (batch)
 */
async function getPostLikeCounts(postIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();

  if (postIds.length === 0) return counts;

  const { data, error } = await supabase
    .from('post_likes')
    .select('post_id')
    .in('post_id', postIds);

  if (error) {
    console.error('Error fetching like counts:', error);
    return counts;
  }

  data?.forEach((l: any) => {
    counts.set(l.post_id, (counts.get(l.post_id) || 0) + 1);
  });

  return counts;
}

/**
 * Get comment counts for multiple posts (batch)
 */
async function getPostCommentCounts(postIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();

  if (postIds.length === 0) return counts;

  const { data, error } = await supabase
    .from('post_comments')
    .select('post_id')
    .in('post_id', postIds);

  if (error) {
    console.error('Error fetching comment counts:', error);
    return counts;
  }

  data?.forEach((c: any) => {
    counts.set(c.post_id, (counts.get(c.post_id) || 0) + 1);
  });

  return counts;
}

/**
 * Get creator's public profile for community display
 */
export async function getCreatorPublicProfile(creatorId: string): Promise<CreatorPublicProfile | null> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', creatorId)
    .single();

  if (profileError) return null;

  const { data: creatorProfile } = await supabase
    .from('creator_profiles')
    .select('brand_name, bio')
    .eq('creator_id', creatorId)
    .single();

  return {
    full_name: profile?.full_name || 'Unknown',
    avatar_url: profile?.avatar_url || null,
    brand_name: creatorProfile?.brand_name || null,
    bio: creatorProfile?.bio || null,
  };
}

/**
 * Get complete public data for a community landing page
 */
export async function getCommunityPublicData(communityId: string): Promise<CommunityPublicData | null> {
  // Get community
  const community = await getPublicCommunity(communityId);
  if (!community) return null;

  // Get all related data in parallel
  const [memberCount, channelPreviews, recentPosts, creator] = await Promise.all([
    getCommunityMemberCount(communityId),
    getPublicChannelPreview(communityId),
    getPublicPostsPreview(communityId, 5),
    getCreatorPublicProfile(community.creator_id),
  ]);

  if (!creator) return null;

  return {
    community: {
      id: community.id,
      name: community.name,
      description: community.description,
      thumbnail_url: community.thumbnail_url,
      is_public: community.is_public,
      created_at: community.created_at,
    },
    memberCount,
    channelPreviews,
    recentPosts,
    creator,
  };
}

// Helper function to truncate content
function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength).trim() + '...';
}

// ============================================================================
// USER PROFILE POPUP
// ============================================================================

/**
 * Extended profile data for the profile popup
 */
export interface UserProfilePopupData {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  bio: string | null;
  joined_at: string;
  postsCount: number;
  commentsCount: number;
}

/**
 * Get user profile data for the popup by profile ID
 * Includes profile info, creator bio (if any), and contribution stats
 */
export async function getUserProfileForPopup(profileId: string): Promise<UserProfilePopupData | null> {
  // Get basic profile info
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, role, created_at')
    .eq('id', profileId)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching profile for popup:', profileError);
    return null;
  }

  // Try to get creator profile for bio (if they're a creator)
  let bio: string | null = null;
  if (profile.role === 'creator' || profile.role === 'superadmin') {
    const { data: creatorProfile } = await supabase
      .from('creator_profiles')
      .select('bio')
      .eq('creator_id', profileId)
      .single();

    bio = creatorProfile?.bio || null;
  }

  // Get posts count
  const { count: postsCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', profileId);

  // Get comments count
  const { count: commentsCount } = await supabase
    .from('post_comments')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', profileId);

  return {
    id: profile.id,
    full_name: profile.full_name || 'Unknown User',
    avatar_url: profile.avatar_url,
    role: profile.role,
    bio,
    joined_at: profile.created_at,
    postsCount: postsCount || 0,
    commentsCount: commentsCount || 0,
  };
}
