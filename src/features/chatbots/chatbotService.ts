import { supabase } from '../../core/supabase/client';
import { DbCommunityChatbot, DbChatbotConversation } from '../../core/supabase/database.types';

// ============================================================================
// ROLE DEFAULTS - Default settings for each chatbot role
// ============================================================================

export type ChatbotRole = 'qa' | 'motivation' | 'support';

interface RoleDefaults {
  personality: string;
  systemPrompt: string;
  greeting: string;
}

const ROLE_DEFAULTS: Record<ChatbotRole, RoleDefaults> = {
  qa: {
    personality: 'Helpful and knowledgeable',
    systemPrompt:
      'You are a helpful Q&A assistant for this course. Answer questions clearly and provide examples when helpful.',
    greeting: "Hi! I'm here to answer your questions about the course. What would you like to know?",
  },
  motivation: {
    personality: 'Encouraging and supportive',
    systemPrompt:
      'You are a motivational coach. Encourage students, celebrate their wins, and help them stay focused on their goals.',
    greeting: "Hey! I'm your motivation coach. Ready to crush your goals today?",
  },
  support: {
    personality: 'Patient and solution-oriented',
    systemPrompt:
      'You are a technical support assistant. Help students with technical issues, platform questions, and troubleshooting.',
    greeting: "Hello! Need help with something technical? I'm here to assist.",
  },
};

/**
 * Gets the default settings for a chatbot role
 * @param role - The chatbot role
 * @returns The default personality, system prompt, and greeting for the role
 */
export function getRoleDefaults(role: ChatbotRole): RoleDefaults {
  return ROLE_DEFAULTS[role];
}

// ============================================================================
// CHATBOT CRUD Operations
// ============================================================================

/**
 * Gets all chatbots for a community
 * @param communityId - The community's ID
 * @returns Array of chatbots
 */
export async function getChatbots(communityId: string): Promise<DbCommunityChatbot[]> {
  const { data, error } = await supabase
    .from('community_chatbots')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching chatbots:', error);
    return [];
  }

  return data || [];
}

/**
 * Gets only active chatbots for a community
 * @param communityId - The community's ID
 * @returns Array of active chatbots
 */
export async function getActiveChatbots(communityId: string): Promise<DbCommunityChatbot[]> {
  const { data, error } = await supabase
    .from('community_chatbots')
    .select('*')
    .eq('community_id', communityId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching active chatbots:', error);
    return [];
  }

  return data || [];
}

/**
 * Creates a new chatbot for a community
 * @param communityId - The community's ID
 * @param name - The chatbot's display name
 * @param role - The chatbot role (qa, motivation, support)
 * @param customPrompt - Optional custom system prompt (overrides role default)
 * @param customPersonality - Optional custom personality (overrides role default)
 * @param customGreeting - Optional custom greeting (overrides role default)
 * @returns The created chatbot or null if failed
 */
export async function createChatbot(
  communityId: string,
  name: string,
  role: ChatbotRole,
  customPrompt?: string,
  customPersonality?: string,
  customGreeting?: string
): Promise<DbCommunityChatbot | null> {
  const defaults = getRoleDefaults(role);

  const { data, error } = await supabase
    .from('community_chatbots')
    .insert({
      community_id: communityId,
      name,
      role,
      system_prompt: customPrompt || defaults.systemPrompt,
      personality: customPersonality || defaults.personality,
      greeting_message: customGreeting || defaults.greeting,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating chatbot:', error);
    return null;
  }

  return data;
}

/**
 * Updates an existing chatbot
 * @param chatbotId - The chatbot's ID
 * @param updates - Partial chatbot updates
 * @returns The updated chatbot or null if failed
 */
export async function updateChatbot(
  chatbotId: string,
  updates: Partial<
    Pick<DbCommunityChatbot, 'name' | 'role' | 'system_prompt' | 'personality' | 'greeting_message' | 'is_active'>
  >
): Promise<DbCommunityChatbot | null> {
  const { data, error } = await supabase
    .from('community_chatbots')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', chatbotId)
    .select()
    .single();

  if (error) {
    console.error('Error updating chatbot:', error);
    return null;
  }

  return data;
}

/**
 * Deletes a chatbot (and all related conversations via cascade)
 * @param chatbotId - The chatbot's ID
 * @returns True if deleted successfully, false otherwise
 */
export async function deleteChatbot(chatbotId: string): Promise<boolean> {
  const { error } = await supabase.from('community_chatbots').delete().eq('id', chatbotId);

  if (error) {
    console.error('Error deleting chatbot:', error);
    return false;
  }

  return true;
}

// ============================================================================
// CONVERSATION Management
// ============================================================================

export type ConversationMessage = {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
};

/**
 * Gets an existing conversation between a user and a chatbot
 * @param chatbotId - The chatbot's ID
 * @param userId - The user's profile ID
 * @returns The conversation or null if not found
 */
export async function getConversation(
  chatbotId: string,
  userId: string
): Promise<DbChatbotConversation | null> {
  const { data, error } = await supabase
    .from('chatbot_conversations')
    .select('*')
    .eq('chatbot_id', chatbotId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    console.error('Error fetching conversation:', error);
  }

  return data || null;
}

/**
 * Saves (upserts) a conversation between a user and a chatbot
 * @param chatbotId - The chatbot's ID
 * @param userId - The user's profile ID
 * @param messages - The array of conversation messages
 * @returns The saved conversation or null if failed
 */
export async function saveConversation(
  chatbotId: string,
  userId: string,
  messages: ConversationMessage[]
): Promise<DbChatbotConversation | null> {
  // Check if conversation exists
  const existing = await getConversation(chatbotId, userId);

  if (existing) {
    // Update existing conversation
    const { data, error } = await supabase
      .from('chatbot_conversations')
      .update({
        messages,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating conversation:', error);
      return null;
    }

    return data;
  } else {
    // Create new conversation
    const { data, error } = await supabase
      .from('chatbot_conversations')
      .insert({
        chatbot_id: chatbotId,
        user_id: userId,
        messages,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    return data;
  }
}
