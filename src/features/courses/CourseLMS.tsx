import React, { useState, useEffect } from 'react';
import { PlayCircle, FileText, CheckCircle, ChevronRight, ChevronDown, Plus, GraduationCap, Loader2, BookOpen } from 'lucide-react';
import { useAuth } from '../../core/contexts/AuthContext';
import {
  getCreatorCourses,
  getEnrolledCourses,
  getAvailableCourses,
  getCourseWithDetails,
  createCourse,
  enrollInCourse,
  markLessonComplete,
  markLessonIncomplete,
  formatDuration,
  CourseWithModules,
  LessonWithProgress,
} from './courseService';
import { DbCourse } from '../../core/supabase/database.types';
import CourseAiHelper from './CourseAiHelper';

const CourseLMS: React.FC = () => {
  const { user, role } = useAuth();

  // State
  const [courses, setCourses] = useState<CourseWithModules[]>([]);
  const [availableCourses, setAvailableCourses] = useState<DbCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithModules | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<LessonWithProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState<string | null>(null);

  // Creator mode state
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');

  // Load courses on mount
  useEffect(() => {
    loadCourses();
  }, [user, role]);

  const loadCourses = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      let courseList: CourseWithModules[] = [];

      if (role === 'creator' || role === 'superadmin') {
        // Creators see their own courses
        const creatorCourses = await getCreatorCourses(user.id);
        // Get full details for each course
        for (const course of creatorCourses) {
          const details = await getCourseWithDetails(course.id, user.id);
          if (details) courseList.push(details);
        }
      } else {
        // Students see enrolled courses
        courseList = await getEnrolledCourses(user.id);
        // Also load available courses to enroll in
        const available = await getAvailableCourses(user.id);
        setAvailableCourses(available);
      }

      setCourses(courseList);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    if (!user) return;
    setIsEnrolling(courseId);

    try {
      const enrollment = await enrollInCourse(user.id, courseId);
      if (enrollment) {
        // Reload courses to show the newly enrolled course
        await loadCourses();
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
    } finally {
      setIsEnrolling(null);
    }
  };

  const handleSelectCourse = (course: CourseWithModules) => {
    setSelectedCourse(course);
    if (course.modules.length > 0) {
      setActiveModuleId(course.modules[0].id);
      if (course.modules[0].lessons.length > 0) {
        setActiveLesson(course.modules[0].lessons[0]);
      }
    }
  };

  const handleCreateCourse = async () => {
    if (!user || !newCourseName.trim()) return;

    const course = await createCourse(user.id, newCourseName.trim(), newCourseDescription.trim() || undefined);
    if (course) {
      // Reload courses to get the new one with details
      await loadCourses();
      setNewCourseName('');
      setNewCourseDescription('');
      setShowCreateCourse(false);
    }
  };

  const handleToggleComplete = async (lesson: LessonWithProgress) => {
    if (!user) return;

    setIsUpdating(true);
    try {
      if (lesson.is_completed) {
        await markLessonIncomplete(user.id, lesson.id);
      } else {
        await markLessonComplete(user.id, lesson.id);
      }

      // Reload the course to get updated progress
      if (selectedCourse) {
        const updated = await getCourseWithDetails(selectedCourse.id, user.id);
        if (updated) {
          setSelectedCourse(updated);
          // Update the active lesson reference
          const updatedLesson = updated.modules
            .flatMap(m => m.lessons)
            .find(l => l.id === lesson.id);
          if (updatedLesson) {
            setActiveLesson(updatedLesson);
          }
        }
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Show empty state for enrolled courses - but show available courses if any
  if (!selectedCourse && courses.length === 0) {
    // For students with available courses, show them
    if (role !== 'creator' && role !== 'superadmin' && availableCourses.length > 0) {
      return (
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">My Learning</h1>
            <p className="text-slate-500">You haven't enrolled in any courses yet. Browse available courses below.</p>
          </div>

          <h2 className="text-lg font-semibold text-slate-900 mb-4">Available Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableCourses.map(course => (
              <div
                key={course.id}
                className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
              >
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-white/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-bold text-lg">{course.title}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-slate-600 text-sm line-clamp-2 mb-4">{course.description || 'No description'}</p>
                  <button
                    onClick={() => handleEnroll(course.id)}
                    disabled={isEnrolling === course.id}
                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isEnrolling === course.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enrolling...
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        Enroll Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Default empty state (no available courses or creator mode)
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12">
          <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {role === 'creator' ? 'No Courses Yet' : 'Not Enrolled in Any Courses'}
          </h2>
          <p className="text-slate-500 mb-6">
            {role === 'creator'
              ? 'Create your first course to start teaching.'
              : 'Join a community to access their courses.'
            }
          </p>
          {role === 'creator' && (
            <button
              onClick={() => setShowCreateCourse(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Create Course
            </button>
          )}
        </div>

        {/* Create Course Modal */}
        {showCreateCourse && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Create Course</h3>
              <input
                type="text"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                placeholder="Course title"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-3"
              />
              <textarea
                value={newCourseDescription}
                onChange={(e) => setNewCourseDescription(e.target.value)}
                placeholder="Course description (optional)"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-24 resize-none"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowCreateCourse(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCourse}
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

  if (!selectedCourse) {
    // Course Listing View
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            {role === 'creator' ? 'My Courses' : 'My Learning'}
          </h1>
          {role === 'creator' && (
            <button
              onClick={() => setShowCreateCourse(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 inline-flex items-center gap-2"
            >
              <Plus size={18} />
              New Course
            </button>
          )}
        </div>

        {/* Enrolled Courses */}
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          {role === 'creator' || role === 'superadmin' ? 'Your Courses' : 'Continue Learning'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => {
            const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
            return (
              <div
                key={course.id}
                className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
                onClick={() => handleSelectCourse(course)}
              >
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-white/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <span className={`text-xs font-semibold px-2 py-1 rounded mb-2 inline-block ${course.is_published ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                      {course.is_published ? 'Published' : 'Draft'}
                    </span>
                    <h3 className="font-bold text-lg">{course.title}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-slate-600 text-sm line-clamp-2">{course.description || 'No description'}</p>
                  <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-xs text-slate-500">
                      {course.modules.length} Module{course.modules.length !== 1 ? 's' : ''} · {totalLessons} Lesson{totalLessons !== 1 ? 's' : ''}
                    </span>
                    {course.progress_percent !== undefined && (
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all"
                            style={{ width: `${course.progress_percent}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{course.progress_percent}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Available Courses for Students */}
        {role !== 'creator' && role !== 'superadmin' && availableCourses.length > 0 && (
          <>
            <h2 className="text-lg font-semibold text-slate-900 mt-10 mb-4">Available Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCourses.map(course => (
                <div
                  key={course.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
                >
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-white/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="font-bold text-lg">{course.title}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-slate-600 text-sm line-clamp-2 mb-4">{course.description || 'No description'}</p>
                    <button
                      onClick={() => handleEnroll(course.id)}
                      disabled={isEnrolling === course.id}
                      className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isEnrolling === course.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enrolling...
                        </>
                      ) : (
                        <>
                          <Plus size={18} />
                          Enroll Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Create Course Modal */}
        {showCreateCourse && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Create Course</h3>
              <input
                type="text"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                placeholder="Course title"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-3"
                autoFocus
              />
              <textarea
                value={newCourseDescription}
                onChange={(e) => setNewCourseDescription(e.target.value)}
                placeholder="Course description (optional)"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-24 resize-none"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowCreateCourse(false);
                    setNewCourseName('');
                    setNewCourseDescription('');
                  }}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCourse}
                  disabled={!newCourseName.trim()}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
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

  // Course Player View
  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-80 bg-white border-r border-slate-200 overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <button
            onClick={() => setSelectedCourse(null)}
            className="text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-2 block"
          >
            ← Back to Courses
          </button>
          <h2 className="font-bold text-slate-900 leading-tight">{selectedCourse.title}</h2>
          {selectedCourse.progress_percent !== undefined && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${selectedCourse.progress_percent}%` }}
                />
              </div>
              <span className="text-xs text-slate-500">{selectedCourse.progress_percent}%</span>
            </div>
          )}
        </div>

        <div className="flex-1 py-2">
          {selectedCourse.modules.length === 0 ? (
            <div className="p-4 text-center text-slate-400">
              <p className="text-sm">No modules yet</p>
              {role === 'creator' && (
                <p className="text-xs mt-1">Add modules to build your course</p>
              )}
            </div>
          ) : (
            selectedCourse.modules.map((module) => (
              <div key={module.id} className="mb-1">
                <button
                  onClick={() => setActiveModuleId(activeModuleId === module.id ? null : module.id)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <span className="font-semibold text-sm text-slate-700">{module.title}</span>
                  {activeModuleId === module.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                {activeModuleId === module.id && (
                  <div className="bg-white">
                    {module.lessons.length === 0 ? (
                      <div className="px-6 py-3 text-xs text-slate-400">
                        No lessons in this module
                      </div>
                    ) : (
                      module.lessons.map((lesson) => (
                        <button
                          key={lesson.id}
                          onClick={() => setActiveLesson(lesson)}
                          className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors border-l-4
                            ${activeLesson?.id === lesson.id
                              ? 'border-indigo-600 bg-indigo-50/50'
                              : 'border-transparent hover:bg-slate-50'}
                          `}
                        >
                          <div className={`shrink-0 ${lesson.is_completed ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {lesson.is_completed ? (
                              <CheckCircle size={16} />
                            ) : lesson.type === 'video' ? (
                              <PlayCircle size={16} />
                            ) : (
                              <FileText size={16} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${activeLesson?.id === lesson.id ? 'text-indigo-900' : 'text-slate-600'}`}>
                              {lesson.title}
                            </p>
                            {lesson.duration_minutes && (
                              <span className="text-xs text-slate-400">
                                {formatDuration(lesson.duration_minutes)}
                              </span>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-slate-50 overflow-y-auto p-8">
        {activeLesson ? (
          <div className="max-w-4xl mx-auto">
            <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-lg relative flex items-center justify-center">
              {activeLesson.content_url ? (
                activeLesson.type === 'video' ? (
                  <video
                    src={activeLesson.content_url}
                    controls
                    className="w-full h-full"
                  />
                ) : (
                  <iframe
                    src={activeLesson.content_url}
                    className="w-full h-full"
                    title={activeLesson.title}
                  />
                )
              ) : (
                <div className="text-center text-white">
                  {activeLesson.type === 'video' ? (
                    <>
                      <PlayCircle size={64} className="mx-auto mb-4 opacity-80" />
                      <p className="font-medium">Video Content</p>
                    </>
                  ) : (
                    <>
                      <FileText size={64} className="mx-auto mb-4 opacity-80" />
                      <p className="font-medium">Resource/Text Content</p>
                    </>
                  )}
                  <p className="text-sm text-white/60 mt-2">No content URL set</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{activeLesson.title}</h1>
                <p className="text-slate-500 mt-1">
                  Module: {selectedCourse.modules.find(m => m.lessons.some(l => l.id === activeLesson.id))?.title}
                </p>
              </div>
              <button
                onClick={() => handleToggleComplete(activeLesson)}
                disabled={isUpdating}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors
                  ${activeLesson.is_completed
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'}
                  ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isUpdating ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : activeLesson.is_completed ? (
                  <>
                    <CheckCircle size={20} /> Completed
                  </>
                ) : (
                  'Mark as Complete'
                )}
              </button>
            </div>

            {activeLesson.description && (
              <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-lg mb-4">Lesson Notes</h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {activeLesson.description}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400">
            <div className="text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Select a lesson to start learning</p>
            </div>
          </div>
        )}
      </div>

      {/* AI Helper for Students - only show when viewing a course */}
      {selectedCourse && role !== 'creator' && role !== 'superadmin' && (
        <CourseAiHelper
          courseId={selectedCourse.id}
          currentLesson={activeLesson ? { id: activeLesson.id, title: activeLesson.title } : null}
          currentModule={activeModuleId ? selectedCourse.modules.find(m => m.id === activeModuleId)?.title : null}
        />
      )}
    </div>
  );
};

export default CourseLMS;
