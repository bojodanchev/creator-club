import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Users, Video, Plus, ChevronLeft, ChevronRight, Loader2, X, Download } from 'lucide-react';
import { useAuth } from '../../core/contexts/AuthContext';
import {
  getCreatorEvents,
  getUpcomingEvents,
  createEvent,
  rsvpToEvent,
  cancelRsvp,
  formatEventDate,
  formatEventTime,
  getMonthDays,
  getEventsForDay,
  EventWithDetails,
  downloadICS,
} from './eventService';
import { EventType } from '../../core/supabase/database.types';

const CalendarView: React.FC = () => {
  const { user, profile, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventStartTime, setNewEventStartTime] = useState('');
  const [newEventEndTime, setNewEventEndTime] = useState('');
  const [newEventType, setNewEventType] = useState<EventType>('group');
  const [newEventLink, setNewEventLink] = useState('');

  const isCreator = role === 'creator' || role === 'superadmin';

  useEffect(() => {
    if (profile?.id) {
      loadEvents();
    }
  }, [profile?.id, role]);

  const loadEvents = async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      let data: EventWithDetails[];
      if (isCreator) {
        // Use profile.id because events.creator_id references profiles.id
        data = await getCreatorEvents(profile.id);
      } else {
        // Use profile.id because event_attendees.user_id references profiles.id
        data = await getUpcomingEvents(profile.id);
      }
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!profile?.id || !newEventTitle || !newEventDate || !newEventStartTime || !newEventEndTime) return;

    setCreating(true);
    try {
      const startDateTime = new Date(`${newEventDate}T${newEventStartTime}`);
      const endDateTime = new Date(`${newEventDate}T${newEventEndTime}`);

      // Use profile.id because events.creator_id references profiles.id
      const event = await createEvent(
        profile.id,
        newEventTitle,
        startDateTime,
        endDateTime,
        newEventType,
        newEventDescription || undefined,
        newEventLink || undefined
      );

      if (event) {
        await loadEvents();
        setShowCreateModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleRsvp = async (eventId: string, isAttending: boolean) => {
    if (!profile?.id) return;

    try {
      // Use profile.id because event_attendees.user_id references profiles.id
      if (isAttending) {
        await cancelRsvp(profile.id, eventId);
      } else {
        await rsvpToEvent(profile.id, eventId, 'attending');
      }
      await loadEvents();
    } catch (error) {
      console.error('Error updating RSVP:', error);
    }
  };

  const resetForm = () => {
    setNewEventTitle('');
    setNewEventDescription('');
    setNewEventDate('');
    setNewEventStartTime('');
    setNewEventEndTime('');
    setNewEventType('group');
    setNewEventLink('');
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthDays = getMonthDays(currentDate.getFullYear(), currentDate.getMonth());
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date();

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Community Calendar</h1>
          <p className="text-slate-500">
            {isCreator ? 'Manage your live sessions and workshops.' : 'Upcoming live sessions and workshops.'}
          </p>
        </div>
        {isCreator && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
          >
            <Plus size={16} /> New Event
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-bold text-slate-900 mb-4">
            {events.length > 0 ? 'Upcoming Events' : 'No Upcoming Events'}
          </h2>
          {events.length > 0 ? (
            events.map(event => {
              const dateInfo = formatEventDate(event.start_time);
              const timeInfo = formatEventTime(event.start_time, event.end_time);
              const isAttending = event.user_status === 'attending';

              return (
                <div key={event.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6">
                  <div className="bg-indigo-50 rounded-lg p-4 flex flex-col items-center justify-center min-w-[100px] text-indigo-700">
                    <span className="text-xs font-bold uppercase">{dateInfo.month}</span>
                    <span className="text-2xl font-bold">{dateInfo.day}</span>
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 mb-2">
                          {event.event_type.toUpperCase().replace('_', ' ')}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
                        {event.description && (
                          <p className="text-sm text-slate-500 mt-1">{event.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock size={16} /> {timeInfo}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={16} /> {event.attendee_count} Attending
                      </div>
                    </div>

                    <div className="mt-4 flex gap-3">
                      {event.meeting_link ? (
                        <a
                          href={event.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-indigo-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                        >
                          <Video size={16} /> Join Live Room
                        </a>
                      ) : (
                        <button className="flex-1 bg-indigo-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2" disabled>
                          <Video size={16} /> Link Coming Soon
                        </button>
                      )}
                      <button
                        onClick={() => downloadICS(event)}
                        className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2"
                        title="Add to Calendar"
                      >
                        <Download size={16} /> Add to Calendar
                      </button>
                      {!isCreator && (
                        <button
                          onClick={() => handleRsvp(event.id, isAttending)}
                          className={`px-4 py-2 border rounded-lg text-sm font-medium ${
                            isAttending
                              ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {isAttending ? 'Cancel RSVP' : 'RSVP'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-100 text-center">
              <CalendarIcon className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">
                {isCreator
                  ? 'No events scheduled. Create your first event!'
                  : 'No upcoming events to display.'}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon size={20} className="text-slate-400" />
              {monthName}
            </h3>
            <div className="flex gap-1">
              <button
                onClick={goToPreviousMonth}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={goToNextMonth}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="text-slate-400 font-medium py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {monthDays.slice(0, 35).map((dayInfo, index) => {
              const isToday = dayInfo.isCurrentMonth &&
                dayInfo.day === today.getDate() &&
                currentDate.getMonth() === today.getMonth() &&
                currentDate.getFullYear() === today.getFullYear();

              const dayEvents = dayInfo.isCurrentMonth
                ? getEventsForDay(events, currentDate.getFullYear(), currentDate.getMonth(), dayInfo.day)
                : [];

              const hasEvents = dayEvents.length > 0;

              return (
                <div
                  key={index}
                  onClick={() => dayInfo.isCurrentMonth && setSelectedDay(dayInfo.day)}
                  className={`py-2 rounded-full cursor-pointer relative
                    ${!dayInfo.isCurrentMonth ? 'text-slate-300' : 'text-slate-700 hover:bg-slate-50'}
                    ${isToday ? 'bg-indigo-600 text-white hover:bg-indigo-700 font-bold' : ''}
                    ${selectedDay === dayInfo.day && dayInfo.isCurrentMonth && !isToday ? 'bg-indigo-100' : ''}
                  `}
                >
                  {dayInfo.day}
                  {hasEvents && !isToday && (
                    <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-600" />
                  )}
                </div>
              );
            })}
          </div>

          {selectedDay && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">
                Events on {currentDate.toLocaleDateString('en-US', { month: 'short' })} {selectedDay}
              </h4>
              {getEventsForDay(events, currentDate.getFullYear(), currentDate.getMonth(), selectedDay).length > 0 ? (
                <div className="space-y-2">
                  {getEventsForDay(events, currentDate.getFullYear(), currentDate.getMonth(), selectedDay).map(event => (
                    <div key={event.id} className="text-xs bg-indigo-50 text-indigo-700 p-2 rounded">
                      {event.title}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No events on this day</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Create New Event</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={e => setNewEventTitle(e.target.value)}
                  placeholder="e.g., Weekly Q&A Session"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newEventDescription}
                  onChange={e => setNewEventDescription(e.target.value)}
                  placeholder="What's this event about?"
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Event Type
                </label>
                <select
                  value={newEventType}
                  onChange={e => setNewEventType(e.target.value as EventType)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="group">Group Session</option>
                  <option value="one_on_one">1:1 Session</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={newEventDate}
                  onChange={e => setNewEventDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={newEventStartTime}
                    onChange={e => setNewEventStartTime(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={newEventEndTime}
                    onChange={e => setNewEventEndTime(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Meeting Link (Zoom, Meet, etc.)
                </label>
                <input
                  type="url"
                  value={newEventLink}
                  onChange={e => setNewEventLink(e.target.value)}
                  placeholder="https://zoom.us/j/..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvent}
                disabled={creating || !newEventTitle || !newEventDate || !newEventStartTime || !newEventEndTime}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Creating...
                  </>
                ) : (
                  'Create Event'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
