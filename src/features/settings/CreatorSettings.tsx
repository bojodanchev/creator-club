import React, { useState, useEffect } from 'react';
import { Loader2, Save, Sparkles } from 'lucide-react';
import { useAuth } from '../../core/contexts/AuthContext';
import { getCreatorProfile, updateCreatorProfile, CreatorProfile } from './profileService';

// Common timezones
const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona (MST)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)' },
  { value: 'UTC', label: 'UTC' },
];

const CreatorSettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    brand_name: '',
    bio: '',
    timezone: 'America/New_York',
    ai_prompt: '',
  });

  useEffect(() => {
    if (user?.id) {
      loadCreatorProfile();
    }
  }, [user?.id]);

  const loadCreatorProfile = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const profile = await getCreatorProfile(user.id);
      if (profile) {
        setFormData({
          brand_name: profile.brand_name || '',
          bio: profile.bio || '',
          timezone: profile.timezone || 'America/New_York',
          ai_prompt: profile.ai_prompt || '',
        });
      }
    } catch (error) {
      console.error('Error loading creator profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    setMessage(null);

    try {
      await updateCreatorProfile(user.id, {
        brand_name: formData.brand_name || null,
        bio: formData.bio || null,
        timezone: formData.timezone,
        ai_prompt: formData.ai_prompt || null,
      });

      setMessage({ type: 'success', text: 'Creator settings saved successfully!' });
    } catch (error) {
      console.error('Error saving creator settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Brand Name */}
      <div>
        <label htmlFor="brand_name" className="block text-sm font-medium text-slate-700 mb-2">
          Brand Name
        </label>
        <input
          type="text"
          id="brand_name"
          value={formData.brand_name}
          onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Your brand or business name"
        />
        <p className="mt-1 text-xs text-slate-500">
          This will be displayed to your students
        </p>
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-slate-700 mb-2">
          Bio
        </label>
        <textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          rows={4}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          placeholder="Tell your students about yourself..."
        />
        <p className="mt-1 text-xs text-slate-500">
          A brief description of your background and expertise
        </p>
      </div>

      {/* Timezone */}
      <div>
        <label htmlFor="timezone" className="block text-sm font-medium text-slate-700 mb-2">
          Timezone
        </label>
        <select
          id="timezone"
          value={formData.timezone}
          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-500">
          Used for scheduling events and displaying times
        </p>
      </div>

      {/* AI Prompt */}
      <div>
        <label htmlFor="ai_prompt" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
          <Sparkles size={16} className="text-indigo-600" />
          Custom AI Instructions
        </label>
        <textarea
          id="ai_prompt"
          value={formData.ai_prompt}
          onChange={(e) => setFormData({ ...formData, ai_prompt: e.target.value })}
          rows={6}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none font-mono text-sm"
          placeholder="Example: Focus on mindset coaching. Be encouraging but direct. Reference my book 'The Creator's Path' when relevant."
        />
        <p className="mt-1 text-xs text-slate-500">
          Customize how the AI Success Manager behaves and responds. These instructions will be added to the AI's system prompt.
        </p>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CreatorSettings;
