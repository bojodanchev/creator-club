// Database types generated from Supabase schema
// These types match the Phase 2 database tables

export type UserRole = 'superadmin' | 'creator' | 'student' | 'member';
export type MembershipRole = 'admin' | 'moderator' | 'member';
export type LessonType = 'video' | 'text' | 'file' | 'quiz';
export type UnlockType = 'immediate' | 'date' | 'progress';
export type EnrollmentStatus = 'active' | 'completed' | 'dropped';
export type EventType = 'group' | 'one_on_one';
export type AttendeeStatus = 'attending' | 'maybe' | 'declined';
export type StudentStatus = 'at_risk' | 'stable' | 'top_member';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

// Profiles (from Phase 1)
export interface DbProfile {
  id: string;
  user_id: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  created_at: string;
  last_login_at: string | null;
}

// Creator Profiles
export interface DbCreatorProfile {
  id: string;
  creator_id: string;
  brand_name: string | null;
  bio: string | null;
  timezone: string;
  ai_prompt: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

// Communities
export interface DbCommunity {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Community Channels
export interface DbCommunityChannel {
  id: string;
  community_id: string;
  name: string;
  description: string | null;
  position: number;
  created_at: string;
}

// Memberships
export interface DbMembership {
  id: string;
  user_id: string;
  community_id: string;
  role: MembershipRole;
  joined_at: string;
}

// Posts
export interface DbPost {
  id: string;
  channel_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// Post with relations (for querying)
export interface DbPostWithAuthor extends DbPost {
  author: DbProfile;
  channel?: DbCommunityChannel;
  likes_count?: number;
  comments_count?: number;
  user_has_liked?: boolean;
}

// Post Comments
export interface DbPostComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface DbPostCommentWithAuthor extends DbPostComment {
  author: DbProfile;
}

// Post Likes
export interface DbPostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

// Courses
export interface DbCourse {
  id: string;
  creator_id: string;
  community_id: string | null;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

// Modules
export interface DbModule {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  position: number;
  unlock_type: UnlockType;
  unlock_value: string | null;
  created_at: string;
}

// Lessons
export interface DbLesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  type: LessonType;
  content_url: string | null;
  position: number;
  duration_minutes: number | null;
  created_at: string;
}

// Enrollments
export interface DbEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  status: EnrollmentStatus;
  completed_at: string | null;
}

// Lesson Progress
export interface DbLessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed_at: string | null;
  progress_percent: number;
  created_at: string;
  updated_at: string;
}

// Events
export interface DbEvent {
  id: string;
  creator_id: string;
  community_id: string | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  event_type: EventType;
  meeting_link: string | null;
  max_attendees: number | null;
  created_at: string;
  updated_at: string;
}

// Event Attendees
export interface DbEventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  status: AttendeeStatus;
  responded_at: string;
}

// Points
export interface DbPoints {
  id: string;
  user_id: string;
  community_id: string;
  total_points: number;
  level: number;
  updated_at: string;
}

// Point Transactions
export interface DbPointTransaction {
  id: string;
  user_id: string;
  community_id: string;
  points: number;
  reason: string;
  created_at: string;
}

// Student Health
export interface DbStudentHealth {
  id: string;
  user_id: string;
  course_id: string;
  risk_score: number;
  status: StudentStatus;
  last_activity_at: string | null;
  updated_at: string;
}

// Tasks
export interface DbTask {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: TaskStatus;
  linked_type: string | null;
  linked_id: string | null;
  created_at: string;
  updated_at: string;
}

// Community Chatbots
export interface DbCommunityChatbot {
  id: string;
  community_id: string;
  name: string;
  role: 'qa' | 'motivation' | 'support';
  system_prompt: string | null;
  personality: string | null;
  greeting_message: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbChatbotConversation {
  id: string;
  chatbot_id: string;
  user_id: string;
  messages: { role: 'user' | 'model'; text: string; timestamp: string }[];
  created_at: string;
  updated_at: string;
}

// Homework System
export interface DbHomeworkAssignment {
  id: string;
  community_id: string;
  creator_id: string;
  title: string;
  description: string | null;
  max_points: number;
  due_date: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbHomeworkSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  text_response: string | null;
  file_urls: string[];
  status: 'pending' | 'graded';
  points_awarded: number | null;
  feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
  graded_by: string | null;
}

export interface DbHomeworkSubmissionWithStudent extends DbHomeworkSubmission {
  student: DbProfile;
}

export interface DbHomeworkAssignmentWithStats extends DbHomeworkAssignment {
  total_submissions: number;
  pending_count: number;
}
