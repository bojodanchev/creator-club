import { supabase } from '../../core/supabase/client';
import { DbProfile, DbCreatorProfile } from '../../core/supabase/database.types';

// ============================================================================
// TYPES
// ============================================================================

export interface Profile {
  id: string;
  user_id: string;
  role: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  created_at: string;
  last_login_at: string | null;
}

export interface CreatorProfile {
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

// ============================================================================
// PROFILE OPERATIONS
// ============================================================================

/**
 * Get user profile by user ID
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data as Profile;
  } catch (error) {
    console.error('Error in getProfile:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  data: Partial<Profile>
): Promise<Profile | null> {
  try {
    const { data: updatedData, error } = await supabase
      .from('profiles')
      .update(data)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    return updatedData as Profile;
  } catch (error) {
    console.error('Error in updateProfile:', error);
    throw error;
  }
}

// ============================================================================
// CREATOR PROFILE OPERATIONS
// ============================================================================

/**
 * Get creator profile by creator ID
 */
export async function getCreatorProfile(creatorId: string): Promise<CreatorProfile | null> {
  try {
    const { data, error } = await supabase
      .from('creator_profiles')
      .select('*')
      .eq('creator_id', creatorId)
      .single();

    if (error) {
      // Not found is expected for non-creators
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching creator profile:', error);
      return null;
    }

    return data as CreatorProfile;
  } catch (error) {
    console.error('Error in getCreatorProfile:', error);
    return null;
  }
}

/**
 * Update creator profile
 */
export async function updateCreatorProfile(
  creatorId: string,
  data: Partial<CreatorProfile>
): Promise<CreatorProfile | null> {
  try {
    // First check if creator profile exists
    const existing = await getCreatorProfile(creatorId);

    if (!existing) {
      // Create new creator profile if it doesn't exist
      const { data: newData, error: insertError } = await supabase
        .from('creator_profiles')
        .insert({
          creator_id: creatorId,
          ...data,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating creator profile:', insertError);
        throw insertError;
      }

      return newData as CreatorProfile;
    }

    // Update existing profile
    const { data: updatedData, error } = await supabase
      .from('creator_profiles')
      .update(data)
      .eq('creator_id', creatorId)
      .select()
      .single();

    if (error) {
      console.error('Error updating creator profile:', error);
      throw error;
    }

    return updatedData as CreatorProfile;
  } catch (error) {
    console.error('Error in updateCreatorProfile:', error);
    throw error;
  }
}

// ============================================================================
// AVATAR UPLOAD OPERATIONS
// ============================================================================

/**
 * Upload avatar image to Supabase Storage
 * @param userId - The user's ID (used as folder name)
 * @param file - The image file to upload
 * @returns The public URL of the uploaded avatar
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  try {
    // Generate unique filename with timestamp to avoid caching issues
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

    // Delete old avatar(s) first to clean up storage
    const { data: existingFiles } = await supabase.storage
      .from('avatars')
      .list(userId);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`);
      await supabase.storage.from('avatars').remove(filesToDelete);
    }

    // Upload new avatar
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadAvatar:', error);
    throw error;
  }
}

/**
 * Delete avatar from storage
 * @param userId - The user's ID
 */
export async function deleteAvatar(userId: string): Promise<void> {
  try {
    const { data: existingFiles } = await supabase.storage
      .from('avatars')
      .list(userId);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`);
      await supabase.storage.from('avatars').remove(filesToDelete);
    }
  } catch (error) {
    console.error('Error in deleteAvatar:', error);
    throw error;
  }
}

// ============================================================================
// PASSWORD OPERATIONS
// ============================================================================

/**
 * Update user password
 */
export async function updatePassword(newPassword: string): Promise<void> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in updatePassword:', error);
    throw error;
  }
}
