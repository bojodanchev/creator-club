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
  let query = supabase
    .from('courses')
    .select('*')
    .in('community_id', communityIds)
    .eq('is_published', true);

  // Exclude already enrolled courses
  if (enrolledCourseIds.length > 0) {
    query = query.not('id', 'in', `(${enrolledCourseIds.join(',')})`);
  }

  const { data: courses, error: coursesError } = await query.order('created_at', { ascending: false });

  if (coursesError) {
    console.error('Error fetching available courses:', coursesError);
    return [];
  }

  return courses || [];
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

// ============================================================================
// MODULES
// ============================================================================

export async function createModule(
  courseId: string,
  title: string,
  description?: string,
  position: number = 0
): Promise<DbModule | null> {
  const { data, error } = await supabase
    .from('modules')
    .insert({
      course_id: courseId,
      title,
      description,
      position,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating module:', error);
    return null;
  }
  return data;
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
  position: number = 0,
  durationMinutes?: number
): Promise<DbLesson | null> {
  const { data, error } = await supabase
    .from('lessons')
    .insert({
      module_id: moduleId,
      title,
      type,
      description,
      content_url: contentUrl,
      position,
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
