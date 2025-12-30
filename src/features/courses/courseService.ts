import { supabase } from '../../core/supabase/client';
import {
  DbCourse,
  DbModule,
  DbLesson,
  DbEnrollment,
  DbLessonProgress,
  EnrollmentStatus,
  LessonType,
} from '../../core/supabase/database.types';

// ============================================================================
// TYPES
// ============================================================================

export interface CourseWithModules extends DbCourse {
  modules: ModuleWithLessons[];
  enrollment?: DbEnrollment;
  progress_percent?: number;
}

export interface ModuleWithLessons extends DbModule {
  lessons: LessonWithProgress[];
}

export interface LessonWithProgress extends DbLesson {
  progress?: DbLessonProgress;
  is_completed?: boolean;
}

// ============================================================================
// COURSES
// ============================================================================

export async function getCourses(): Promise<DbCourse[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
  return data || [];
}

export async function getCreatorCourses(creatorId: string): Promise<DbCourse[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching creator courses:', error);
    return [];
  }
  return data || [];
}

export async function getEnrolledCourses(userId: string): Promise<CourseWithModules[]> {
  // Get enrollments with courses
  const { data: enrollments, error: enrollmentError } = await supabase
    .from('enrollments')
    .select(`
      *,
      course:courses(*)
    `)
    .eq('user_id', userId)
    .eq('status', 'active');

  if (enrollmentError) {
    console.error('Error fetching enrollments:', enrollmentError);
    return [];
  }

  const courses: CourseWithModules[] = [];

  for (const enrollment of enrollments || []) {
    const course = enrollment.course as DbCourse;
    if (!course) continue;

    // Get modules and lessons for this course
    const courseWithModules = await getCourseWithDetails(course.id, userId);
    if (courseWithModules) {
      courseWithModules.enrollment = enrollment;
      courses.push(courseWithModules);
    }
  }

  return courses;
}

/**
 * Get courses available to a student (from communities they're a member of, but not yet enrolled)
 */
export async function getAvailableCourses(userId: string): Promise<DbCourse[]> {
  // Get communities the user is a member of
  const { data: memberships, error: membershipError } = await supabase
    .from('memberships')
    .select('community_id')
    .eq('user_id', userId);

  if (membershipError) {
    console.error('Error fetching memberships:', membershipError);
    return [];
  }

  const communityIds = memberships?.map(m => m.community_id) || [];
  if (communityIds.length === 0) return [];

  // Get courses the user is already enrolled in
  const { data: enrollments, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('user_id', userId);

  if (enrollmentError) {
    console.error('Error fetching enrollments:', enrollmentError);
    return [];
  }

  const enrolledCourseIds = enrollments?.map(e => e.course_id) || [];

  // Get published courses from user's communities that they're not enrolled in
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('*')
    .in('community_id', communityIds)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (coursesError) {
    console.error('Error fetching available courses:', coursesError);
    return [];
  }

  // Filter out already enrolled courses client-side (safer than string interpolation)
  const enrolledSet = new Set(enrolledCourseIds);
  return (courses || []).filter(course => !enrolledSet.has(course.id));
}

export async function getCourseWithDetails(courseId: string, userId?: string): Promise<CourseWithModules | null> {
  // Get course
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (courseError || !course) {
    console.error('Error fetching course:', courseError);
    return null;
  }

  // Get modules
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('*')
    .eq('course_id', courseId)
    .order('position', { ascending: true });

  if (modulesError) {
    console.error('Error fetching modules:', modulesError);
    return { ...course, modules: [] };
  }

  // Get all lessons for all modules
  const moduleIds = modules?.map(m => m.id) || [];
  const { data: lessons, error: lessonsError } = moduleIds.length > 0 ? await supabase
    .from('lessons')
    .select('*')
    .in('module_id', moduleIds)
    .order('position', { ascending: true }) : { data: [], error: null };

  if (lessonsError) {
    console.error('Error fetching lessons:', lessonsError);
  }

  // Get progress if user is provided
  let progressMap = new Map<string, DbLessonProgress>();
  if (userId && lessons && lessons.length > 0) {
    const lessonIds = lessons.map(l => l.id);
    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds);

    progress?.forEach(p => {
      progressMap.set(p.lesson_id, p);
    });
  }

  // Build the course with modules and lessons
  const modulesWithLessons: ModuleWithLessons[] = (modules || []).map(module => ({
    ...module,
    lessons: (lessons || [])
      .filter(l => l.module_id === module.id)
      .map(lesson => ({
        ...lesson,
        progress: progressMap.get(lesson.id),
        is_completed: progressMap.get(lesson.id)?.completed_at != null,
      })),
  }));

  // Calculate overall progress
  const totalLessons = modulesWithLessons.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedLessons = modulesWithLessons.reduce(
    (acc, m) => acc + m.lessons.filter(l => l.is_completed).length,
    0
  );
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return {
    ...course,
    modules: modulesWithLessons,
    progress_percent: progressPercent,
  };
}

export async function createCourse(
  creatorId: string,
  title: string,
  description?: string,
  thumbnailUrl?: string,
  communityId?: string
): Promise<DbCourse | null> {
  const { data, error } = await supabase
    .from('courses')
    .insert({
      creator_id: creatorId,
      title,
      description,
      thumbnail_url: thumbnailUrl,
      community_id: communityId,
      is_published: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating course:', error);
    return null;
  }
  return data;
}

export async function publishCourse(courseId: string): Promise<boolean> {
  const { error } = await supabase
    .from('courses')
    .update({ is_published: true })
    .eq('id', courseId);

  if (error) {
    console.error('Error publishing course:', error);
    return false;
  }
  return true;
}

export async function unpublishCourse(courseId: string): Promise<boolean> {
  const { error } = await supabase
    .from('courses')
    .update({ is_published: false })
    .eq('id', courseId);

  if (error) {
    console.error('Error unpublishing course:', error);
    return false;
  }
  return true;
}

export async function updateCourse(
  courseId: string,
  updates: Partial<Pick<DbCourse, 'title' | 'description' | 'thumbnail_url' | 'is_published'>>
): Promise<DbCourse | null> {
  const { data, error } = await supabase
    .from('courses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', courseId)
    .select()
    .single();

  if (error) {
    console.error('Error updating course:', error);
    return null;
  }
  return data;
}

export async function deleteCourse(courseId: string): Promise<boolean> {
  // Note: This should cascade delete modules, lessons, enrollments via DB constraints
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);

  if (error) {
    console.error('Error deleting course:', error);
    return false;
  }
  return true;
}

export async function uploadCourseThumbnail(
  courseId: string,
  file: File
): Promise<string | null> {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${courseId}/thumbnail-${Date.now()}.${fileExt}`;

  // Upload new thumbnail
  const { data, error } = await supabase.storage
    .from('course-thumbnails')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Error uploading thumbnail:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('course-thumbnails')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

// ============================================================================
// MODULES
// ============================================================================

export async function createModule(
  courseId: string,
  title: string,
  description?: string,
  position?: number
): Promise<DbModule | null> {
  // If no position provided, get the next available position
  const finalPosition = position ?? await getNextModulePosition(courseId);

  const { data, error } = await supabase
    .from('modules')
    .insert({
      course_id: courseId,
      title,
      description,
      position: finalPosition,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating module:', error);
    return null;
  }
  return data;
}

export async function updateModule(
  moduleId: string,
  updates: Partial<Pick<DbModule, 'title' | 'description' | 'unlock_type' | 'unlock_value' | 'position'>>
): Promise<DbModule | null> {
  const { data, error } = await supabase
    .from('modules')
    .update(updates)
    .eq('id', moduleId)
    .select()
    .single();

  if (error) {
    console.error('Error updating module:', error);
    return null;
  }
  return data;
}

export async function deleteModule(moduleId: string): Promise<boolean> {
  const { error } = await supabase
    .from('modules')
    .delete()
    .eq('id', moduleId);

  if (error) {
    console.error('Error deleting module:', error);
    return false;
  }
  return true;
}

export async function getNextModulePosition(courseId: string): Promise<number> {
  const { data } = await supabase
    .from('modules')
    .select('position')
    .eq('course_id', courseId)
    .order('position', { ascending: false })
    .limit(1);

  return (data?.[0]?.position ?? -1) + 1;
}

export async function reorderModules(
  moduleOrders: { id: string; position: number }[]
): Promise<boolean> {
  // Batch update positions
  const results = await Promise.all(
    moduleOrders.map(({ id, position }) =>
      supabase.from('modules').update({ position }).eq('id', id)
    )
  );

  return results.every(r => !r.error);
}

// ============================================================================
// LESSONS
// ============================================================================

export async function createLesson(
  moduleId: string,
  title: string,
  type: LessonType = 'video',
  description?: string,
  contentUrl?: string,
  position?: number,
  durationMinutes?: number
): Promise<DbLesson | null> {
  // If no position provided, get the next available position
  const finalPosition = position ?? await getNextLessonPosition(moduleId);

  const { data, error } = await supabase
    .from('lessons')
    .insert({
      module_id: moduleId,
      title,
      type,
      description,
      content_url: contentUrl,
      position: finalPosition,
      duration_minutes: durationMinutes,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating lesson:', error);
    return null;
  }
  return data;
}

export async function updateLesson(
  lessonId: string,
  updates: Partial<Pick<DbLesson, 'title' | 'description' | 'type' | 'content_url' | 'position' | 'duration_minutes'>>
): Promise<DbLesson | null> {
  const { data, error } = await supabase
    .from('lessons')
    .update(updates)
    .eq('id', lessonId)
    .select()
    .single();

  if (error) {
    console.error('Error updating lesson:', error);
    return null;
  }
  return data;
}

export async function deleteLesson(lessonId: string): Promise<boolean> {
  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', lessonId);

  if (error) {
    console.error('Error deleting lesson:', error);
    return false;
  }
  return true;
}

export async function getNextLessonPosition(moduleId: string): Promise<number> {
  const { data } = await supabase
    .from('lessons')
    .select('position')
    .eq('module_id', moduleId)
    .order('position', { ascending: false })
    .limit(1);

  return (data?.[0]?.position ?? -1) + 1;
}

export async function reorderLessons(
  lessonOrders: { id: string; position: number }[]
): Promise<boolean> {
  const results = await Promise.all(
    lessonOrders.map(({ id, position }) =>
      supabase.from('lessons').update({ position }).eq('id', id)
    )
  );

  return results.every(r => !r.error);
}

// ============================================================================
// ENROLLMENTS
// ============================================================================

export async function enrollInCourse(userId: string, courseId: string): Promise<DbEnrollment | null> {
  const { data, error } = await supabase
    .from('enrollments')
    .insert({
      user_id: userId,
      course_id: courseId,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    console.error('Error enrolling in course:', error);
    return null;
  }
  return data;
}

export async function getEnrollment(userId: string, courseId: string): Promise<DbEnrollment | null> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching enrollment:', error);
  }
  return data || null;
}

// ============================================================================
// LESSON PROGRESS
// ============================================================================

export async function markLessonComplete(userId: string, lessonId: string): Promise<boolean> {
  // Upsert progress
  const { error } = await supabase
    .from('lesson_progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      progress_percent: 100,
      completed_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,lesson_id',
    });

  if (error) {
    console.error('Error marking lesson complete:', error);
    return false;
  }
  return true;
}

export async function markLessonIncomplete(userId: string, lessonId: string): Promise<boolean> {
  const { error } = await supabase
    .from('lesson_progress')
    .update({
      progress_percent: 0,
      completed_at: null,
    })
    .eq('user_id', userId)
    .eq('lesson_id', lessonId);

  if (error) {
    console.error('Error marking lesson incomplete:', error);
    return false;
  }
  return true;
}

export async function updateLessonProgress(
  userId: string,
  lessonId: string,
  progressPercent: number
): Promise<boolean> {
  const completed = progressPercent >= 100;

  const { error } = await supabase
    .from('lesson_progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      progress_percent: progressPercent,
      completed_at: completed ? new Date().toISOString() : null,
    }, {
      onConflict: 'user_id,lesson_id',
    });

  if (error) {
    console.error('Error updating lesson progress:', error);
    return false;
  }
  return true;
}

// ============================================================================
// COURSE PURCHASE & ENROLLMENT
// ============================================================================

/**
 * Complete enrollment after successful payment
 * This is called when a paid course purchase succeeds
 */
export async function completeCoursePurchase(
  userId: string,
  courseId: string,
  paymentIntentId: string
): Promise<DbEnrollment | null> {
  // First check if already enrolled
  const existing = await getEnrollment(userId, courseId);
  if (existing) {
    console.log('User already enrolled in course');
    return existing;
  }

  // Create enrollment with payment reference in metadata
  const { data, error } = await supabase
    .from('enrollments')
    .insert({
      user_id: userId,
      course_id: courseId,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    console.error('Error completing course purchase:', error);
    return null;
  }

  return data;
}

/**
 * Check if a course requires payment
 * For now, we check if the course has a price_cents field > 0
 * This will be expanded when the database schema includes course pricing
 */
export function courseRequiresPayment(course: DbCourse & { price_cents?: number }): boolean {
  return (course.price_cents ?? 0) > 0;
}

/**
 * Get course price in cents (for payment intent)
 * Returns 0 for free courses
 */
export function getCoursePrice(course: DbCourse & { price_cents?: number }): number {
  return course.price_cents ?? 0;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function formatDuration(minutes: number | null): string {
  if (!minutes) return '';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}`;
  }
  return `${mins}:00`;
}

// ============================================================================
// COURSE ANALYTICS
// ============================================================================

export interface CourseAnalytics {
  enrolledCount: number;
  completionRate: number;
  activeStudents: number;
  averageProgress: number;
  lessonCompletionRates: LessonCompletionRate[];
  studentProgress: StudentProgressEntry[];
}

export interface LessonCompletionRate {
  lessonId: string;
  lessonTitle: string;
  moduleName: string;
  completionRate: number;
  completedCount: number;
}

export interface StudentProgressEntry {
  userId: string;
  userName: string;
  avatarUrl: string | null;
  enrolledAt: string;
  progressPercent: number;
  lastActivityAt: string | null;
  completedLessons: number;
  totalLessons: number;
}

export async function getCourseAnalytics(courseId: string): Promise<CourseAnalytics> {
  // Get enrollments with profile data
  const { data: enrollments, count: enrolledCount } = await supabase
    .from('enrollments')
    .select('*, profiles!user_id(full_name, avatar_url)', { count: 'exact' })
    .eq('course_id', courseId);

  // Get modules for this course
  const { data: modules } = await supabase
    .from('modules')
    .select('id, title')
    .eq('course_id', courseId);

  const moduleIds = modules?.map(m => m.id) || [];
  const moduleMap = new Map(modules?.map(m => [m.id, m.title]) || []);

  // Get lessons for this course
  const { data: lessons } = moduleIds.length > 0
    ? await supabase
        .from('lessons')
        .select('id, title, module_id')
        .in('module_id', moduleIds)
    : { data: [] };

  const lessonIds = lessons?.map(l => l.id) || [];

  // Get all lesson progress for this course
  const { data: progress } = lessonIds.length > 0
    ? await supabase
        .from('lesson_progress')
        .select('*')
        .in('lesson_id', lessonIds)
    : { data: [] };

  // Calculate completion rate
  const completedEnrollments = enrollments?.filter(e => e.status === 'completed').length || 0;
  const totalEnrolled = enrolledCount || 0;
  const completionRate = totalEnrolled > 0 ? Math.round((completedEnrollments / totalEnrolled) * 100) : 0;

  // Calculate per-lesson completion rates
  const lessonCompletionRates: LessonCompletionRate[] = (lessons || []).map(lesson => {
    const completedCount = progress?.filter(p =>
      p.lesson_id === lesson.id && p.completed_at
    ).length || 0;

    return {
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      moduleName: moduleMap.get(lesson.module_id) || 'Unknown Module',
      completionRate: totalEnrolled > 0 ? Math.round((completedCount / totalEnrolled) * 100) : 0,
      completedCount,
    };
  });

  // Build student progress list
  const studentProgress: StudentProgressEntry[] = (enrollments || []).map(enrollment => {
    const profile = enrollment.profiles as { full_name?: string; avatar_url?: string } | null;
    const userProgress = progress?.filter(p => p.user_id === enrollment.user_id) || [];
    const completedLessons = userProgress.filter(p => p.completed_at).length;
    const lastActivity = userProgress.reduce((latest, p) => {
      const updatedAt = new Date(p.updated_at);
      return updatedAt > latest ? updatedAt : latest;
    }, new Date(0));

    return {
      userId: enrollment.user_id,
      userName: profile?.full_name || 'Unknown',
      avatarUrl: profile?.avatar_url || null,
      enrolledAt: enrollment.enrolled_at,
      progressPercent: lessonIds.length > 0 ? Math.round((completedLessons / lessonIds.length) * 100) : 0,
      lastActivityAt: lastActivity.getTime() > 0 ? lastActivity.toISOString() : null,
      completedLessons,
      totalLessons: lessonIds.length,
    };
  });

  // Calculate active students (activity in last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const activeStudents = studentProgress.filter(s => {
    const lastActivity = s.lastActivityAt ? new Date(s.lastActivityAt) : null;
    return lastActivity && lastActivity > sevenDaysAgo;
  }).length;

  // Calculate average progress
  const averageProgress = studentProgress.length > 0
    ? Math.round(studentProgress.reduce((sum, s) => sum + s.progressPercent, 0) / studentProgress.length)
    : 0;

  return {
    enrolledCount: totalEnrolled,
    completionRate,
    activeStudents,
    averageProgress,
    lessonCompletionRates,
    studentProgress,
  };
}
