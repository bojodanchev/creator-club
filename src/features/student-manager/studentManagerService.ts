import { supabase } from '../../core/supabase/client';
import { DbProfile, DbPoints } from '../../core/supabase/database.types';
import { awardPoints } from '../community/pointsService';

// ============================================================================
// STUDENT MANAGER SERVICE
// Provides functions to manage students and award bonus points
// ============================================================================

/**
 * Student with their stats including points and submission counts
 */
export interface StudentWithStats {
  profile: DbProfile;
  points: DbPoints | null;
  submissionCount: number;
  gradedCount: number;
}

/**
 * Gets all members of a community with their points and submission counts
 * @param communityId - The community's ID
 * @returns Array of students with their stats
 */
export async function getStudentsWithStats(communityId: string): Promise<StudentWithStats[]> {
  // Get all memberships for this community with profile info
  const { data: memberships, error: membershipsError } = await supabase
    .from('memberships')
    .select(`
      user_id,
      user:profiles!user_id(*)
    `)
    .eq('community_id', communityId);

  if (membershipsError) {
    console.error('Error fetching memberships:', membershipsError);
    return [];
  }

  if (!memberships || memberships.length === 0) {
    return [];
  }

  // Extract profile IDs
  const profileIds = memberships.map((m: any) => m.user_id);

  // Get points for all members in this community
  const { data: pointsData, error: pointsError } = await supabase
    .from('points')
    .select('*')
    .eq('community_id', communityId)
    .in('user_id', profileIds);

  if (pointsError) {
    console.error('Error fetching points:', pointsError);
  }

  // Create a map of user_id to points
  const pointsMap = new Map<string, DbPoints>();
  (pointsData || []).forEach((p) => {
    pointsMap.set(p.user_id, p);
  });

  // Get submission counts for all members
  // First, get all assignments for this community
  const { data: assignments, error: assignmentsError } = await supabase
    .from('homework_assignments')
    .select('id')
    .eq('community_id', communityId);

  if (assignmentsError) {
    console.error('Error fetching assignments:', assignmentsError);
  }

  const assignmentIds = (assignments || []).map((a) => a.id);

  // Get submission stats per student
  const submissionStats = new Map<string, { total: number; graded: number }>();

  if (assignmentIds.length > 0) {
    const { data: submissions, error: submissionsError } = await supabase
      .from('homework_submissions')
      .select('student_id, status')
      .in('assignment_id', assignmentIds)
      .in('student_id', profileIds);

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
    }

    // Calculate submission stats
    (submissions || []).forEach((sub) => {
      const stats = submissionStats.get(sub.student_id) || { total: 0, graded: 0 };
      stats.total++;
      if (sub.status === 'graded') {
        stats.graded++;
      }
      submissionStats.set(sub.student_id, stats);
    });
  }

  // Build the result array
  const students: StudentWithStats[] = memberships.map((m: any) => {
    const profile = m.user as DbProfile;
    const stats = submissionStats.get(profile.id) || { total: 0, graded: 0 };

    return {
      profile,
      points: pointsMap.get(profile.id) || null,
      submissionCount: stats.total,
      gradedCount: stats.graded,
    };
  });

  // Sort by points (highest first), then by name
  students.sort((a, b) => {
    const pointsA = a.points?.total_points || 0;
    const pointsB = b.points?.total_points || 0;
    if (pointsB !== pointsA) return pointsB - pointsA;
    const nameA = a.profile.full_name || '';
    const nameB = b.profile.full_name || '';
    return nameA.localeCompare(nameB);
  });

  return students;
}

/**
 * Awards bonus points to a student
 * @param profileId - The student's profile ID
 * @param communityId - The community's ID
 * @param points - Number of bonus points to award (1-10)
 * @param reason - Optional reason for the bonus points
 * @returns True if points were awarded successfully, false otherwise
 */
export async function addBonusPoints(
  profileId: string,
  communityId: string,
  points: number,
  reason: string
): Promise<boolean> {
  // Validate points range
  if (points < 1 || points > 10) {
    console.error('Bonus points must be between 1 and 10');
    return false;
  }

  // Use the existing awardPoints function
  const transaction = await awardPoints(
    profileId,
    communityId,
    points,
    reason || 'Bonus points from creator'
  );

  return transaction !== null;
}
