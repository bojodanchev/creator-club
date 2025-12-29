import React, { useState, useEffect } from 'react';
import { X, Loader2, MessageSquare, FileText, Calendar } from 'lucide-react';
import { getUserProfileForPopup, UserProfilePopupData } from './communityService';

interface UserProfilePopupProps {
  profileId: string;
  isOpen: boolean;
  onClose: () => void;
}

const UserProfilePopup: React.FC<UserProfilePopupProps> = ({
  profileId,
  isOpen,
  onClose,
}) => {
  const [profile, setProfile] = useState<UserProfilePopupData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && profileId) {
      loadProfile();
    }
  }, [isOpen, profileId]);

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);

    const data = await getUserProfileForPopup(profileId);
    if (data) {
      setProfile(data);
    } else {
      setError('Could not load profile');
    }
    setIsLoading(false);
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'creator':
        return (
          <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-semibold">
            Creator
          </span>
        );
      case 'superadmin':
        return (
          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-semibold">
            Admin
          </span>
        );
      case 'student':
        return (
          <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-semibold">
            Student
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-semibold">
            Member
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-sm shadow-xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 h-24 rounded-t-xl">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          >
            <X size={16} className="text-white" />
          </button>

          {/* Avatar - positioned at bottom of header, extending below */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2">
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                </div>
              ) : (
                <img
                  src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=6366f1&color=fff&size=128`}
                  alt={profile?.full_name || 'User'}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="px-6 pb-6 pt-14">

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-slate-500">{error}</p>
              <button
                onClick={loadProfile}
                className="mt-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                Try again
              </button>
            </div>
          ) : profile ? (
            <>
              {/* Name and Role */}
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-slate-900 mb-1">
                  {profile.full_name}
                </h3>
                {getRoleBadge(profile.role)}
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-center text-slate-600 text-sm mb-4 px-2">
                  {profile.bio}
                </p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center text-slate-400 mb-1">
                    <FileText size={16} />
                  </div>
                  <div className="text-lg font-bold text-slate-900">{profile.postsCount}</div>
                  <div className="text-xs text-slate-500">Posts</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center text-slate-400 mb-1">
                    <MessageSquare size={16} />
                  </div>
                  <div className="text-lg font-bold text-slate-900">{profile.commentsCount}</div>
                  <div className="text-xs text-slate-500">Comments</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center text-slate-400 mb-1">
                    <Calendar size={16} />
                  </div>
                  <div className="text-sm font-medium text-slate-900 leading-tight">
                    {formatJoinDate(profile.joined_at)}
                  </div>
                  <div className="text-xs text-slate-500">Joined</div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePopup;
