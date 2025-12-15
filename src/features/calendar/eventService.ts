import { supabase } from '../../core/supabase/client';
import {
  DbEvent,
  DbEventAttendee,
  DbProfile,
  EventType,
  AttendeeStatus,
} from '../../core/supabase/database.types';

// ============================================================================
// TYPES
// ============================================================================

export interface EventWithDetails extends DbEvent {
  attendee_count: number;
  user_status?: AttendeeStatus | null;
  creator?: DbProfile;
}

// ============================================================================
// EVENTS
// ============================================================================

export async function getEvents(communityId?: string): Promise<EventWithDetails[]> {
  let query = supabase
    .from('events')
    .select('*')
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true });

  if (communityId) {
    query = query.eq('community_id', communityId);
  }

  const { data: events, error } = await query;

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }

  // Get attendee counts for each event
  const eventIds = events?.map(e => e.id) || [];
  const eventsWithDetails: EventWithDetails[] = [];

  for (const event of events || []) {
    const { count } = await supabase
      .from('event_attendees')
      .select('id', { count: 'exact' })
      .eq('event_id', event.id)
      .eq('status', 'attending');

    eventsWithDetails.push({
      ...event,
      attendee_count: count || 0,
    });
  }

  return eventsWithDetails;
}

export async function getCreatorEvents(creatorId: string): Promise<EventWithDetails[]> {
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('creator_id', creatorId)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching creator events:', error);
    return [];
  }

  const eventsWithDetails: EventWithDetails[] = [];

  for (const event of events || []) {
    const { count } = await supabase
      .from('event_attendees')
      .select('id', { count: 'exact' })
      .eq('event_id', event.id)
      .eq('status', 'attending');

    eventsWithDetails.push({
      ...event,
      attendee_count: count || 0,
    });
  }

  return eventsWithDetails;
}

export async function getUpcomingEvents(userId: string): Promise<EventWithDetails[]> {
  // First, get all creators the student is enrolled with (via enrollments)
  const { data: enrollments, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('course:courses(creator_id)')
    .eq('user_id', userId);

  if (enrollmentError) {
    console.error('Error fetching enrollments:', enrollmentError);
  }

  // Extract unique creator IDs from enrollments
  const creatorIds = new Set<string>();
  for (const enrollment of enrollments || []) {
    const course = enrollment.course as { creator_id: string } | null;
    if (course?.creator_id) {
      creatorIds.add(course.creator_id);
    }
  }

  // Also check community memberships to get creators
  const { data: memberships, error: membershipError } = await supabase
    .from('community_members')
    .select('community:communities(creator_id)')
    .eq('user_id', userId);

  if (membershipError) {
    console.error('Error fetching memberships:', membershipError);
  }

  for (const membership of memberships || []) {
    const community = membership.community as { creator_id: string } | null;
    if (community?.creator_id) {
      creatorIds.add(community.creator_id);
    }
  }

  // If no creators found, return empty
  if (creatorIds.size === 0) {
    return [];
  }

  // Get all upcoming events from these creators
  const now = new Date().toISOString();
  const { data: allEvents, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .in('creator_id', Array.from(creatorIds))
    .gte('start_time', now)
    .order('start_time', { ascending: true });

  if (eventsError) {
    console.error('Error fetching events:', eventsError);
    return [];
  }

  // Get user's RSVP status for each event and attendee counts
  const events: EventWithDetails[] = [];

  for (const event of allEvents || []) {
    // Get attendee count
    const { count } = await supabase
      .from('event_attendees')
      .select('id', { count: 'exact' })
      .eq('event_id', event.id)
      .eq('status', 'attending');

    // Get user's RSVP status
    const { data: attendance } = await supabase
      .from('event_attendees')
      .select('status')
      .eq('event_id', event.id)
      .eq('user_id', userId)
      .single();

    events.push({
      ...event,
      attendee_count: count || 0,
      user_status: attendance?.status as AttendeeStatus | null,
    });
  }

  return events;
}

export async function getEventById(eventId: string, userId?: string): Promise<EventWithDetails | null> {
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error || !event) {
    console.error('Error fetching event:', error);
    return null;
  }

  const { count } = await supabase
    .from('event_attendees')
    .select('id', { count: 'exact' })
    .eq('event_id', eventId)
    .eq('status', 'attending');

  let userStatus: AttendeeStatus | null = null;
  if (userId) {
    const { data: attendance } = await supabase
      .from('event_attendees')
      .select('status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    userStatus = attendance?.status as AttendeeStatus | null;
  }

  return {
    ...event,
    attendee_count: count || 0,
    user_status: userStatus,
  };
}

export async function createEvent(
  creatorId: string,
  title: string,
  startTime: Date,
  endTime: Date,
  eventType: EventType = 'group',
  description?: string,
  meetingLink?: string,
  maxAttendees?: number,
  communityId?: string
): Promise<DbEvent | null> {
  const { data, error } = await supabase
    .from('events')
    .insert({
      creator_id: creatorId,
      community_id: communityId,
      title,
      description,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      event_type: eventType,
      meeting_link: meetingLink,
      max_attendees: maxAttendees,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating event:', error);
    return null;
  }
  return data;
}

export async function updateEvent(
  eventId: string,
  updates: Partial<{
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    meeting_link: string;
    max_attendees: number;
  }>
): Promise<boolean> {
  const { error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId);

  if (error) {
    console.error('Error updating event:', error);
    return false;
  }
  return true;
}

export async function deleteEvent(eventId: string): Promise<boolean> {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);

  if (error) {
    console.error('Error deleting event:', error);
    return false;
  }
  return true;
}

// ============================================================================
// RSVP / ATTENDANCE
// ============================================================================

export async function rsvpToEvent(
  userId: string,
  eventId: string,
  status: AttendeeStatus = 'attending'
): Promise<DbEventAttendee | null> {
  const { data, error } = await supabase
    .from('event_attendees')
    .upsert({
      user_id: userId,
      event_id: eventId,
      status,
      responded_at: new Date().toISOString(),
    }, {
      onConflict: 'event_id,user_id',
    })
    .select()
    .single();

  if (error) {
    console.error('Error RSVPing to event:', error);
    return null;
  }
  return data;
}

export async function cancelRsvp(userId: string, eventId: string): Promise<boolean> {
  const { error } = await supabase
    .from('event_attendees')
    .delete()
    .eq('user_id', userId)
    .eq('event_id', eventId);

  if (error) {
    console.error('Error canceling RSVP:', error);
    return false;
  }
  return true;
}

export async function getEventAttendees(eventId: string): Promise<(DbEventAttendee & { profile: DbProfile })[]> {
  const { data, error } = await supabase
    .from('event_attendees')
    .select(`
      *,
      profile:profiles!user_id(*)
    `)
    .eq('event_id', eventId)
    .eq('status', 'attending');

  if (error) {
    console.error('Error fetching attendees:', error);
    return [];
  }

  return (data || []).map(a => ({
    ...a,
    profile: a.profile as DbProfile,
  }));
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function formatEventDate(date: string): { month: string; day: string; full: string } {
  const d = new Date(date);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return {
    month: months[d.getMonth()],
    day: d.getDate().toString(),
    full: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  };
}

export function formatEventTime(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const startTime = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const endTime = endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return `${startTime} - ${endTime}`;
}

export function getMonthDays(year: number, month: number): { day: number; isCurrentMonth: boolean }[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const days: { day: number; isCurrentMonth: boolean }[] = [];

  // Add days from previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({ day: prevMonthLastDay - i, isCurrentMonth: false });
  }

  // Add days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, isCurrentMonth: true });
  }

  // Fill remaining cells (up to 42 for 6 rows)
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, isCurrentMonth: false });
  }

  return days;
}

export function getEventsForDay(events: EventWithDetails[], year: number, month: number, day: number): EventWithDetails[] {
  return events.filter(event => {
    const eventDate = new Date(event.start_time);
    return eventDate.getFullYear() === year &&
           eventDate.getMonth() === month &&
           eventDate.getDate() === day;
  });
}

// ============================================================================
// ICS EXPORT
// ============================================================================

/**
 * Formats a date to ICS format (YYYYMMDDTHHMMSSZ)
 * Converts to UTC timezone
 */
function formatICSDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escapes special characters in ICS text fields
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generates ICS file content for a single event
 */
export function generateICS(event: DbEvent | EventWithDetails): string {
  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);

  const title = escapeICSText(event.title);
  const description = event.description ? escapeICSText(event.description) : '';
  const location = event.meeting_link || '';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Creator Club//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `UID:${event.id}@creatorclub.com`,
    `SUMMARY:${title}`,
    description ? `DESCRIPTION:${description}` : null,
    location ? `LOCATION:${location}` : null,
    location ? `URL:${location}` : null,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(line => line !== null)
    .join('\r\n');

  return icsContent;
}

/**
 * Downloads an ICS file for a single event
 */
export function downloadICS(event: DbEvent | EventWithDetails): void {
  const icsContent = generateICS(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  // Create a temporary anchor element to trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
}
