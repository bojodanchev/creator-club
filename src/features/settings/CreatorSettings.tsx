import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Save, Sparkles, Palette, Image, Wallet, CheckCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../core/contexts/AuthContext';
import { getCreatorProfile, updateCreatorProfile, CreatorProfile } from './profileService';
import { PlanGate, getConnectAccountStatus, createConnectAccount, getConnectOnboardingLink } from '../billing';
import type { ConnectAccountStatus } from '../billing';

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
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    brand_name: '',
    bio: '',
    timezone: 'America/New_York',
    ai_prompt: '',
  });
  const [connectStatus, setConnectStatus] = useState<ConnectAccountStatus | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadCreatorProfile();
      loadConnectStatus();
    }
  }, [user?.id]);

  const loadCreatorProfile = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const creatorProfile = await getCreatorProfile(user.id);
      if (creatorProfile) {
        setFormData({
          brand_name: creatorProfile.brand_name || '',
          bio: creatorProfile.bio || '',
          timezone: creatorProfile.timezone || 'America/New_York',
          ai_prompt: creatorProfile.ai_prompt || '',
        });
      }
    } catch (error) {
      console.error('Error loading creator profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConnectStatus = async () => {
    if (!user?.id) return;
    try {
      const status = await getConnectAccountStatus(user.id);
      setConnectStatus(status);
    } catch (error) {
      console.error('Error loading connect status:', error);
    }
  };

  const handleSetupPayouts = async () => {
    if (!user?.id || !profile?.email) return;

    setConnectLoading(true);
    try {
      // Create account if doesn't exist
      if (!connectStatus) {
        const result = await createConnectAccount(user.id, profile.email);
        if (!result.success) {
          setMessage({ type: 'error', text: result.error || 'Failed to create payout account' });
          return;
        }
      }

      // Get onboarding link
      const onboardingUrl = await getConnectOnboardingLink(user.id);
      if (onboardingUrl) {
        window.location.href = onboardingUrl;
      } else {
        setMessage({ type: 'error', text: 'Failed to get onboarding link' });
      }
    } catch (error) {
      console.error('Error setting up payouts:', error);
      setMessage({ type: 'error', text: 'Failed to set up payouts' });
    } finally {
      setConnectLoading(false);
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

      {/* Payout Status Section */}
      <div className="pt-6 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={20} className="text-indigo-600" />
          <h3 className="text-lg font-semibold text-slate-900">Payouts</h3>
        </div>

        {!connectStatus ? (
          // No Connect account
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <Clock size={20} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-slate-900">Set up payouts</h4>
                <p className="text-sm text-slate-600 mt-1">
                  Connect your bank account to receive earnings from course sales.
                </p>
                <button
                  onClick={handleSetupPayouts}
                  disabled={connectLoading}
                  className="mt-3 inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {connectLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Set up payouts
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : connectStatus.status === 'active' ? (
          // Active Connect account
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-green-900">Payouts enabled</h4>
                <p className="text-sm text-green-700 mt-1">
                  Your payout account is active. You will automatically receive earnings from sales.
                </p>
                <button
                  onClick={() => navigate('/settings/billing')}
                  className="mt-3 text-sm font-medium text-green-700 hover:text-green-800"
                >
                  Manage payout settings
                </button>
              </div>
            </div>
          </div>
        ) : connectStatus.status === 'pending' ? (
          // Pending Connect account
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <Clock size={20} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-amber-900">Complete payout setup</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Finish setting up your payout account to start receiving earnings.
                </p>
                <button
                  onClick={handleSetupPayouts}
                  disabled={connectLoading}
                  className="mt-3 inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {connectLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Continue setup
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Restricted Connect account
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-red-900">Action required</h4>
                <p className="text-sm text-red-700 mt-1">
                  Your payout account needs attention. Please complete the verification steps.
                </p>
                <button
                  onClick={handleSetupPayouts}
                  disabled={connectLoading}
                  className="mt-3 inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {connectLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Complete verification
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Branding Section - Gated for Pro/Scale plans */}
      <div className="pt-6 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Palette size={20} className="text-indigo-600" />
          <h3 className="text-lg font-semibold text-slate-900">Custom Branding</h3>
        </div>
        <PlanGate feature="custom_branding" showLockedOverlay>
          <div className="space-y-4">
            {/* Logo Upload Placeholder */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Brand Logo
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors cursor-pointer">
                <Image size={32} className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">
                  Click to upload your brand logo
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  PNG, JPG up to 2MB
                </p>
              </div>
            </div>

            {/* Primary Color */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Primary Brand Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  defaultValue="#6366f1"
                  className="w-12 h-12 rounded-lg border border-slate-300 cursor-pointer"
                />
                <input
                  type="text"
                  defaultValue="#6366f1"
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                  placeholder="#6366f1"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                This color will be used for buttons and accents throughout your community
              </p>
            </div>

            {/* Custom Domain Hint */}
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600">
                <span className="font-medium">Coming soon:</span> Custom domains will allow you to use your own domain for your community.
              </p>
            </div>
          </div>
        </PlanGate>
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
