import React, { useState } from 'react';
import { Loader2, Lock, LogOut, AlertCircle } from 'lucide-react';
import { useAuth } from '../../core/contexts/AuthContext';
import { updatePassword } from './profileService';

const AccountSettings: React.FC = () => {
  const { signOut } = useAuth();
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const handlePasswordChange = async () => {
    setMessage(null);

    // Validation
    if (!passwords.newPassword || !passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }

    if (passwords.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setChangingPassword(true);

    try {
      await updatePassword(passwords.newPassword);
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswords({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Error changing password:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update password. Please try again.',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Change Password Section */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Lock size={20} className="text-indigo-600" />
          Change Password
        </h3>

        <div className="space-y-4">
          {/* New Password */}
          <div>
            <label htmlFor="new_password" className="block text-sm font-medium text-slate-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              id="new_password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter new password"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium text-slate-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirm_password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Confirm new password"
            />
          </div>

          {/* Success/Error Message */}
          {message && (
            <div
              className={`p-4 rounded-lg flex items-start gap-3 ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* Update Password Button */}
          <div className="flex justify-start">
            <button
              onClick={handlePasswordChange}
              disabled={changingPassword}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {changingPassword ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Lock size={18} />
                  Update Password
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-200" />

      {/* Sign Out Section */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <LogOut size={20} className="text-rose-600" />
          Sign Out
        </h3>

        <p className="text-sm text-slate-600 mb-4">
          Sign out of your account on this device. You'll need to sign in again to access Creator Club.
        </p>

        <button
          onClick={handleSignOut}
          className="px-6 py-2.5 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 flex items-center gap-2"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-200" />

      {/* Danger Zone */}
      <div className="bg-rose-50 border border-rose-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-rose-900 mb-2">Danger Zone</h3>
        <p className="text-sm text-rose-700 mb-4">
          Need to delete your account? Contact support at support@creatorclub.com for assistance.
        </p>
      </div>
    </div>
  );
};

export default AccountSettings;
