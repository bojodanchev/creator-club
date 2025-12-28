export enum View {
  DASHBOARD = 'DASHBOARD',
  COMMUNITY = 'COMMUNITY',
  COURSES = 'COURSES',
  HOMEWORK = 'homework',
  AI_CHAT = 'ai_chat',
  CALENDAR = 'CALENDAR',
  AI_MANAGER = 'AI_MANAGER',
  STUDENT_MANAGER = 'student_manager',
  SETTINGS = 'SETTINGS'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface Student {
  id: string;
  name: string;
  avatar: string;
  email: string;
  joinDate: string;
  lastLogin: string;
  courseProgress: number; // 0-100
  communityEngagement: number; // Score 0-100
  riskLevel: RiskLevel;
  riskReason?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  modules: Module[];
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'file';
  duration?: string;
  isCompleted: boolean;
}

export interface Post {
  id: string;
  author: {
    name: string;
    avatar: string;
    role: 'Creator' | 'Student' | 'Admin';
  };
  content: string;
  likes: number;
  comments: number;
  timestamp: string;
  tags: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'Live Call' | 'Workshop' | 'Meetup';
  date: string;
  time: string;
  attendees: number;
}

export interface AIMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

// Auth Types
export type UserRole = 'superadmin' | 'creator' | 'student' | 'member';

export interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  created_at: string;
  last_login_at: string | null;
}

// ============================================================================
// PUBLIC COMMUNITY TYPES (for landing pages)
// ============================================================================

export interface CommunityListItem {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  memberCount: number;
  creator: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export interface ChannelPreview {
  id: string;
  name: string;
  description: string | null;
  postCount: number;
}

export interface PostPreview {
  id: string;
  content: string;
  author: {
    full_name: string;
    avatar_url: string | null;
  };
  created_at: string;
  likes_count: number;
  comments_count: number;
}

export interface CreatorPublicProfile {
  full_name: string;
  avatar_url: string | null;
  brand_name: string | null;
  bio: string | null;
}

export interface CommunityPublicData {
  community: {
    id: string;
    name: string;
    description: string | null;
    thumbnail_url: string | null;
    is_public: boolean;
    created_at: string;
  };
  memberCount: number;
  channelPreviews: ChannelPreview[];
  recentPosts: PostPreview[];
  creator: CreatorPublicProfile;
}

// ============================================================================
// PAYMENT & SUBSCRIPTION TYPES
// ============================================================================

export type PlanType = 'creator' | 'business' | 'elite';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';

export interface PlanFeatures {
  max_students: number;      // -1 = unlimited
  max_courses: number;       // -1 = unlimited
  max_communities: number;   // -1 = unlimited
  ai_enabled: boolean;
  custom_branding: boolean;
  priority_support: boolean;
  white_label?: boolean;
}

export interface PaymentPlan {
  id: string;
  name: string;
  plan_type: PlanType;
  price_monthly: number;           // Price in cents
  price_yearly: number | null;     // Price in cents
  platform_fee_percent: number;
  transaction_fee_percent: number;
  features: PlanFeatures;
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  plan?: PaymentPlan;
}

// ============================================================================
// AI CONVERSATION TYPES
// ============================================================================

export type AIContextType = 'course' | 'community' | 'support' | 'success_manager';

export interface AIMessageRecord {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  context_type: AIContextType;
  context_id: string | null;
  title: string | null;
  messages: AIMessageRecord[];
  tokens_used: number;
  cost_usd: number | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}
