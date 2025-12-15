import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Save, User, Upload, X, Camera } from 'lucide-react';
import { useAuth } from '../../core/contexts/AuthContext';
import { getProfile, updateProfile, uploadAvatar, Profile } from './profileService';

const ProfileSettings: React.FC = () => {
  const { user, profile: authProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    avatar_url: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authProfile) {
      setFormData({
        full_name: authProfile.full_name || '',
        avatar_url: authProfile.avatar_url || '',
      });
    }
  }, [authProfile]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Please select a valid image file (JPEG, PNG, GIF, or WebP)' });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 5MB' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const publicUrl = await uploadAvatar(user.id, file);
      setFormData({ ...formData, avatar_url: publicUrl });
      setMessage({ type: 'success', text: 'Avatar uploaded! Click Save Changes to update your profile.' });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setMessage({ type: 'error', text: 'Failed to upload avatar. Please try again.' });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    setMessage(null);

    try {
      await updateProfile(user.id, {
        full_name: formData.full_name || null,
        avatar_url: formData.avatar_url || null,
      });

      setMessage({ type: 'success', text: 'Profile updated successfully!' });

      // Reload the page to update the auth context
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <div className="flex items-start gap-6">
        {/* Avatar Preview with Upload Overlay */}
        <div className="relative group">
          <img
            src={formData.avatar_url || authProfile?.avatar_url || 'https://picsum.photos/seed/profile/100/100'}
            alt="Profile"
            className="w-24 h-24 rounded-full border-2 border-slate-200 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/profile/100/100';
            }}
          />
          {/* Upload overlay */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
          >
            {uploading ? (
              <Loader2 size={24} className="text-white animate-spin" />
            ) : (
              <Camera size={24} className="text-white" />
            )}
          </button>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* User Info & Upload Button */}
        <div className="flex-1">
          <h3 className="font-medium text-slate-900">{authProfile?.full_name || 'User'}</h3>
          <p className="text-sm text-slate-500 capitalize mb-3">{authProfile?.role || 'Member'}</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={16} />
                Upload Photo
              </>
            )}
          </button>
          <p className="mt-2 text-xs text-slate-500">
            JPG, PNG, GIF or WebP. Max 5MB.
          </p>
        </div>
      </div>

      {/* Full Name */}
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-slate-700 mb-2">
          Full Name
        </label>
        <input
          type="text"
          id="full_name"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Enter your full name"
        />
      </div>

      {/* Avatar URL (Advanced) */}
      <div>
        <label htmlFor="avatar_url" className="block text-sm font-medium text-slate-700 mb-2">
          Avatar URL <span className="text-slate-400 font-normal">(or paste an image URL)</span>
        </label>
        <input
          type="url"
          id="avatar_url"
          value={formData.avatar_url}
          onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          placeholder="https://example.com/avatar.jpg"
        />
        <p className="mt-1 text-xs text-slate-500">
          You can also paste a direct URL to an image instead of uploading
        </p>
      </div>

      {/* Email (Read-only) */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={authProfile?.email || ''}
          disabled
          className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-slate-500">
          Email cannot be changed
        </p>
      </div>

      {/* Role Badge (Read-only) */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Role
        </label>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium capitalize">
          <User size={14} />
          {authProfile?.role || 'Member'}
        </div>
      </div>

      {/* Member Since (Read-only) */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Member Since
        </label>
        <p className="text-slate-900">
          {formatDate(authProfile?.created_at || null)}
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

export default ProfileSettings;
