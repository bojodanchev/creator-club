import { supabase } from '../../core/supabase/client';
import {
  DbStudentHealth,
  DbEnrollment,
  DbLessonProgress,
  StudentStatus,
} from '../../core/supabase/database.types';

// ============================================================================
// TYPES
// ============================================================================

export interface StudentHealthReport {
  user_id: string;
  course_id: string;
  risk_score: number;
  status: StudentStatus;
  last_activity_at: string | null;
  days_since_activity: number | null;
  completion_rate: number;
  engagement_score: number;
  summary: string;
}

// ============================================================================
// RISK SCORE CALCULATION
// ============================================================================

/**
 * Calculate risk score for a student in a course
 * Risk Score Logic:
 * - 0-30: stable (green)
 * - 31-60: needs_attention (yellow)
 * - 61-100: at_risk (red)
 *
 * Factors:
 * - Days since activity: +2 points per day inactive (max 40)
 * - Completion rate: (100 - completion%) * 0.4 (max 40)
 * - No posts/comments in 7 days: +20 points
 */
export async function calculateRiskScore(
  userId: string,
  courseId: string
): Promise<{ score: number; status: StudentStatus; details: any }> {
  let riskScore = 0;
  const details: any = {
    daysSinceActivity: 0,
    completionRate: 0,
    hasRecentEngagement: false,
  };

  // ===== Factor 1: Days since last activity =====
  // Get enrollment to check enrolled_at date
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('enrolled_at')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();

  // Get last lesson progress activity
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, module:modules!inner(course_id)')
    .eq('modules.course_id', courseId);

  const lessonIds = lessons?.map(l => l.id) || [];

  let lastActivityDate: Date | null = null;

  if (lessonIds.length > 0) {
    const { data: lastProgress } = await supabase
      .from('lesson_progress')
      .select('updated_at')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (lastProgress) {
      lastActivityDate = new Date(lastProgress.updated_at);
    }
  }

  // If no lesson activity, use enrollment date
  if (!lastActivityDate && enrollment) {
    lastActivityDate = new Date(enrollment.enrolled_at);
  }

  let daysSinceActivity = 0;
  if (lastActivityDate) {
    daysSinceActivity = Math.floor(
      (Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const activityPoints = Math.min(daysSinceActivity * 2, 40);
    riskScore += activityPoints;
    details.daysSinceActivity = daysSinceActivity;
  } else {
    // No activity at all - max penalty
    riskScore += 40;
  }

  // ===== Factor 2: Completion rate =====
  const completionRate = await getCourseCompletionRate(userId, courseId);
  const completionPoints = Math.min((100 - completionRate) * 0.4, 40);
  riskScore += completionPoints;
  details.completionRate = completionRate;

  // ===== Factor 3: Community engagement (posts/comments) =====
  // Get all communities associated with this course
  const { data: course } = await supabase
    .from('courses')
    .select('community_id')
    .eq('id', courseId)
    .single();

  let hasRecentEngagement = false;

  if (course?.community_id) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Check for recent posts
    const { data: channels } = await supabase
      .from('community_channels')
      .select('id')
      .eq('community_id', course.community_id);

    const channelIds = channels?.map(c => c.id) || [];

    if (channelIds.length > 0) {
      // Check posts
      const { data: recentPosts } = await supabase
        .from('posts')
        .select('id')
        .eq('author_id', userId)
        .in('channel_id', channelIds)
        .gte('created_at', sevenDaysAgo)
        .limit(1);

      // Check comments
      const { data: postsInCommunity } = await supabase
        .from('posts')
        .select('id')
        .in('channel_id', channelIds);

      const postIds = postsInCommunity?.map(p => p.id) || [];

      let recentComments = null;
      if (postIds.length > 0) {
        const { data } = await supabase
          .from('post_comments')
          .select('id')
          .eq('author_id', userId)
          .in('post_id', postIds)
          .gte('created_at', sevenDaysAgo)
          .limit(1);
        recentComments = data;
      }

      hasRecentEngagement =
        (recentPosts && recentPosts.length > 0) ||
        (recentComments && recentComments.length > 0);
    }
  }

  details.hasRecentEngagement = hasRecentEngagement;

  // No engagement in 7 days: +20 points
  if (!hasRecentEngagement) {
    riskScore += 20;
  }

  // Cap risk score at 100
  riskScore = Math.min(riskScore, 100);

  // Determine status based on risk score
  let status: StudentStatus;
  if (riskScore <= 30) {
    status = 'stable';
  } else if (riskScore <= 60) {
    status = 'stable'; // Could be 'needs_attention' but DB only has at_risk/stable/top_member
  } else {
    status = 'at_risk';
  }

  return { score: riskScore, status, details };
}

/**
 * Get course completion rate for a student
 */
async function getCourseCompletionRate(
  userId: string,
  courseId: string
): Promise<number> {
  // Get all lessons for this course
  const { data: modules } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', courseId);

  if (!modules || modules.length === 0) return 0;

  const moduleIds = modules.map(m => m.id);

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id')
    .in('module_id', moduleIds);

  if (!lessons || lessons.length === 0) return 0;

  const totalLessons = lessons.length;
  const lessonIds = lessons.map(l => l.id);

  // Get completed lessons
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('id')
    .eq('user_id', userId)
    .in('lesson_id', lessonIds)
    .not('completed_at', 'is', null);

  const completedLessons = progress?.length || 0;

  return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
}

/**
 * Get engagement score (posts + comments count)
 */
async function getEngagementScore(userId: string, communityId: string): Promise<number> {
  // Get channels for this community
  const { data: channels } = await supabase
    .from('community_channels')
    .select('id')
    .eq('community_id', communityId);

  const channelIds = channels?.map(c => c.id) || [];

  if (channelIds.length === 0) return 0;

  // Count posts
  const { count: postCount } = await supabase
    .from('posts')
    .select('id', { count: 'exact' })
    .eq('author_id', userId)
    .in('channel_id', channelIds);

  // Get all posts in community to check comments
  const { data: posts } = await supabase
    .from('posts')
    .select('id')
    .in('channel_id', channelIds);

  const postIds = posts?.map(p => p.id) || [];

  let commentCount = 0;
  if (postIds.length > 0) {
    const { count } = await supabase
      .from('post_comments')
      .select('id', { count: 'exact' })
      .eq('author_id', userId)
      .in('post_id', postIds);
    commentCount = count || 0;
  }

  const totalEngagement = (postCount || 0) + commentCount;

  // Normalize to 0-100 scale (10+ interactions = 100)
  return Math.min(totalEngagement * 10, 100);
}

// ============================================================================
// UPDATE STUDENT HEALTH
// ============================================================================

/**
 * Update or create student health record in database
 */
export async function updateStudentHealth(
  userId: string,
  courseId: string
): Promise<DbStudentHealth | null> {
  const { score, status, details } = await calculateRiskScore(userId, courseId);

  // Get last activity date
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, module:modules!inner(course_id)')
    .eq('modules.course_id', courseId);

  const lessonIds = lessons?.map(l => l.id) || [];

  let lastActivityAt: string | null = null;

  if (lessonIds.length > 0) {
    const { data: lastProgress } = await supabase
      .from('lesson_progress')
      .select('updated_at')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    lastActivityAt = lastProgress?.updated_at || null;
  }

  // If no lesson progress, get enrollment date
  if (!lastActivityAt) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('enrolled_at')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    lastActivityAt = enrollment?.enrolled_at || null;
  }

  // Upsert student health record
  const { data, error } = await supabase
    .from('student_health')
    .upsert(
      {
        user_id: userId,
        course_id: courseId,
        risk_score: score,
        status: status,
        last_activity_at: lastActivityAt,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,course_id',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error updating student health:', error);
    return null;
  }

  return data;
}

// ============================================================================
// GET STUDENT HEALTH REPORT
// ============================================================================

/**
 * Generate a detailed health report for a student
 * Used by AI chat for context
 */
export async function getStudentHealthReport(
  userId: string
): Promise<StudentHealthReport[]> {
  // Get all enrollments for this user
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id, course:courses(title)')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (!enrollments || enrollments.length === 0) {
    return [];
  }

  const reports: StudentHealthReport[] = [];

  for (const enrollment of enrollments) {
    const courseId = enrollment.course_id;
    const courseTitle = (enrollment.course as any)?.title || 'Unknown Course';

    // Calculate current risk score
    const { score, status, details } = await calculateRiskScore(userId, courseId);

    // Get last activity
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, module:modules!inner(course_id)')
      .eq('modules.course_id', courseId);

    const lessonIds = lessons?.map(l => l.id) || [];

    let lastActivityAt: string | null = null;
    if (lessonIds.length > 0) {
      const { data: lastProgress } = await supabase
        .from('lesson_progress')
        .select('updated_at')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      lastActivityAt = lastProgress?.updated_at || null;
    }

    let daysSinceActivity = null;
    if (lastActivityAt) {
      daysSinceActivity = Math.floor(
        (Date.now() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Get engagement score
    const { data: course } = await supabase
      .from('courses')
      .select('community_id')
      .eq('id', courseId)
      .single();

    let engagementScore = 0;
    if (course?.community_id) {
      engagementScore = await getEngagementScore(userId, course.community_id);
    }

    // Generate summary
    const summary = generateHealthSummary(
      courseTitle,
      score,
      status,
      details.completionRate,
      daysSinceActivity,
      details.hasRecentEngagement
    );

    reports.push({
      user_id: userId,
      course_id: courseId,
      risk_score: score,
      status,
      last_activity_at: lastActivityAt,
      days_since_activity: daysSinceActivity,
      completion_rate: details.completionRate,
      engagement_score: engagementScore,
      summary,
    });
  }

  return reports;
}

function generateHealthSummary(
  courseTitle: string,
  riskScore: number,
  status: StudentStatus,
  completionRate: number,
  daysSinceActivity: number | null,
  hasRecentEngagement: boolean
): string {
  const parts: string[] = [];

  parts.push(`Course: ${courseTitle}`);
  parts.push(`Status: ${status.toUpperCase()}`);
  parts.push(`Risk Score: ${riskScore}/100`);
  parts.push(`Completion: ${completionRate}%`);

  if (daysSinceActivity !== null) {
    parts.push(`Last active ${daysSinceActivity} days ago`);
  } else {
    parts.push('Never active');
  }

  if (!hasRecentEngagement) {
    parts.push('No community engagement in past 7 days');
  }

  return parts.join('. ');
}

// ============================================================================
// MANUAL STATUS UPDATE
// ============================================================================

/**
 * Manually set student status (creator override)
 */
export async function markStudentStatus(
  userId: string,
  courseId: string,
  status: StudentStatus
): Promise<boolean> {
  const { error } = await supabase
    .from('student_health')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('course_id', courseId);

  if (error) {
    console.error('Error updating student status:', error);
    return false;
  }

  return true;
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Recalculate risk scores for all students in a creator's courses
 */
export async function recalculateAllStudentHealth(
  creatorId: string
): Promise<{ updated: number; errors: number }> {
  // Get all courses for this creator
  const { data: courses } = await supabase
    .from('courses')
    .select('id')
    .eq('creator_id', creatorId);

  if (!courses || courses.length === 0) {
    return { updated: 0, errors: 0 };
  }

  const courseIds = courses.map(c => c.id);

  // Get all active enrollments for these courses
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('user_id, course_id')
    .in('course_id', courseIds)
    .eq('status', 'active');

  if (!enrollments || enrollments.length === 0) {
    return { updated: 0, errors: 0 };
  }

  let updated = 0;
  let errors = 0;

  // Update health for each enrollment
  for (const enrollment of enrollments) {
    try {
      await updateStudentHealth(enrollment.user_id, enrollment.course_id);
      updated++;
    } catch (error) {
      console.error('Error updating health for enrollment:', enrollment, error);
      errors++;
    }
  }

  return { updated, errors };
}
