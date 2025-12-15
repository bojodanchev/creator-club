import { supabase } from '../../core/supabase/client';
import {
  DbProfile,
  DbStudentHealth,
  DbEnrollment,
  DbLessonProgress,
  StudentStatus,
} from '../../core/supabase/database.types';

// ============================================================================
// TYPES
// ============================================================================

export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  completionRate: number;
  atRiskCount: number;
}

export interface AtRiskStudent {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  risk_score: number;
  status: StudentStatus;
  reason: string;
  last_activity_at: string | null;
  course_title?: string;
}

export interface ActivityDataPoint {
  name: string;
  active: number;
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

export async function getDashboardStats(creatorId: string): Promise<DashboardStats> {
  // Get total students enrolled in creator's courses
  const { data: enrollments, error: enrollmentError } = await supabase
    .from('enrollments')
    .select(`
      id,
      user_id,
      status,
      course:courses!inner(creator_id)
    `)
    .eq('courses.creator_id', creatorId);

  if (enrollmentError) {
    console.error('Error fetching enrollments:', enrollmentError);
    return { totalStudents: 0, activeStudents: 0, completionRate: 0, atRiskCount: 0 };
  }

  const totalStudents = new Set(enrollments?.map(e => e.user_id) || []).size;
  const activeEnrollments = enrollments?.filter(e => e.status === 'active') || [];
  const activeStudents = new Set(activeEnrollments.map(e => e.user_id)).size;
  const completedEnrollments = enrollments?.filter(e => e.status === 'completed') || [];
  const completionRate = enrollments && enrollments.length > 0
    ? Math.round((completedEnrollments.length / enrollments.length) * 100)
    : 0;

  // Get at-risk student count
  const { count: atRiskCount } = await supabase
    .from('student_health')
    .select('id', { count: 'exact' })
    .in('status', ['at_risk']);

  return {
    totalStudents,
    activeStudents,
    completionRate,
    atRiskCount: atRiskCount || 0,
  };
}

// ============================================================================
// AT-RISK STUDENTS
// ============================================================================

export async function getAtRiskStudents(creatorId: string): Promise<AtRiskStudent[]> {
  // Get at-risk students from student_health table
  const { data: healthData, error: healthError } = await supabase
    .from('student_health')
    .select(`
      *,
      profile:profiles!user_id(*),
      course:courses!course_id(title, creator_id)
    `)
    .in('status', ['at_risk'])
    .order('risk_score', { ascending: false });

  if (healthError) {
    console.error('Error fetching at-risk students:', healthError);
    return [];
  }

  // Filter to only include students from this creator's courses
  const filteredData = healthData?.filter(h => {
    const course = h.course as any;
    return course?.creator_id === creatorId;
  }) || [];

  return filteredData.map(h => {
    const profile = h.profile as DbProfile;
    const course = h.course as any;

    return {
      id: h.id,
      user_id: h.user_id,
      name: profile?.full_name || profile?.email || 'Unknown',
      email: profile?.email || '',
      avatar_url: profile?.avatar_url,
      risk_score: h.risk_score,
      status: h.status,
      reason: generateRiskReason(h),
      last_activity_at: h.last_activity_at,
      course_title: course?.title,
    };
  });
}

function generateRiskReason(health: DbStudentHealth & { last_activity_at: string | null }): string {
  const reasons: string[] = [];

  if (health.risk_score >= 80) {
    reasons.push('Very high risk score');
  } else if (health.risk_score >= 60) {
    reasons.push('Elevated risk score');
  }

  if (health.last_activity_at) {
    const lastActivity = new Date(health.last_activity_at);
    const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceActivity > 14) {
      reasons.push(`No activity for ${daysSinceActivity} days`);
    } else if (daysSinceActivity > 7) {
      reasons.push('Low activity in past week');
    }
  } else {
    reasons.push('Never active');
  }

  return reasons.length > 0 ? reasons.join('. ') : 'Needs attention';
}

// ============================================================================
// ACTIVITY DATA
// ============================================================================

export async function getWeeklyActivityData(creatorId: string): Promise<ActivityDataPoint[]> {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get lesson progress activity for the past week
  const { data: progressData, error } = await supabase
    .from('lesson_progress')
    .select(`
      created_at,
      updated_at,
      lesson:lessons!inner(
        module:modules!inner(
          course:courses!inner(creator_id)
        )
      )
    `)
    .gte('updated_at', weekAgo.toISOString())
    .lte('updated_at', today.toISOString());

  if (error) {
    console.error('Error fetching activity data:', error);
    // Return empty activity data
    return days.map(name => ({ name, active: 0 }));
  }

  // Filter to creator's courses and count by day
  const activityByDay: Record<string, number> = {};
  days.forEach(day => { activityByDay[day] = 0; });

  progressData?.forEach(p => {
    const lesson = p.lesson as any;
    if (lesson?.module?.course?.creator_id === creatorId) {
      const date = new Date(p.updated_at);
      const dayName = days[date.getDay()];
      activityByDay[dayName] = (activityByDay[dayName] || 0) + 1;
    }
  });

  // Reorder starting from today's day
  const todayIndex = today.getDay();
  const orderedDays = [...days.slice(todayIndex + 1), ...days.slice(0, todayIndex + 1)];

  return orderedDays.map(name => ({
    name,
    active: activityByDay[name] || 0,
  }));
}

// ============================================================================
// COMMUNITY STATS
// ============================================================================

export async function getCommunityStats(creatorId: string): Promise<{
  totalMembers: number;
  totalPosts: number;
  totalComments: number;
}> {
  // Get memberships for creator's communities
  const { data: communities } = await supabase
    .from('communities')
    .select('id')
    .eq('creator_id', creatorId);

  const communityIds = communities?.map(c => c.id) || [];

  if (communityIds.length === 0) {
    return { totalMembers: 0, totalPosts: 0, totalComments: 0 };
  }

  // Count members
  const { count: memberCount } = await supabase
    .from('memberships')
    .select('id', { count: 'exact' })
    .in('community_id', communityIds);

  // Get channels for these communities
  const { data: channels } = await supabase
    .from('community_channels')
    .select('id')
    .in('community_id', communityIds);

  const channelIds = channels?.map(c => c.id) || [];

  // Count posts
  const { count: postCount } = channelIds.length > 0
    ? await supabase
        .from('posts')
        .select('id', { count: 'exact' })
        .in('channel_id', channelIds)
    : { count: 0 };

  // Count comments
  const { data: posts } = channelIds.length > 0
    ? await supabase
        .from('posts')
        .select('id')
        .in('channel_id', channelIds)
    : { data: [] };

  const postIds = posts?.map(p => p.id) || [];

  const { count: commentCount } = postIds.length > 0
    ? await supabase
        .from('post_comments')
        .select('id', { count: 'exact' })
        .in('post_id', postIds)
    : { count: 0 };

  return {
    totalMembers: memberCount || 0,
    totalPosts: postCount || 0,
    totalComments: commentCount || 0,
  };
}
