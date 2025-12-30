import React, { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, XCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { validatePasswordStrength } from '../../utils/passwordStrength';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [usernameCheckTimeout, setUsernameCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && profile) {
      setFullName(profile.full_name || '');
      setUsername(profile.username || '');
      setEmail(profile.email || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
      setUsernameStatus('idle');
    }
  }, [isOpen, profile]);

  const checkUsernameAvailability = useCallback(async (newUsername: string, currentUsername: string) => {
    if (!newUsername || newUsername.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    if (newUsername.toLowerCase() === currentUsername.toLowerCase()) {
      setUsernameStatus('idle');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(newUsername)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .ilike('username', newUsername)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking username:', error);
        setUsernameStatus('idle');
        return;
      }

      if (data) {
        setUsernameStatus('taken');
      } else {
        setUsernameStatus('available');
      }
    } catch (error) {
      console.error('Username check exception:', error);
      setUsernameStatus('idle');
    }
  }, []);

  useEffect(() => {
    if (usernameCheckTimeout) {
      clearTimeout(usernameCheckTimeout);
    }

    if (username && profile && username.length >= 3) {
      const timeout = setTimeout(() => {
        checkUsernameAvailability(username, profile.username || '');
      }, 500);
      setUsernameCheckTimeout(timeout);
    } else {
      setUsernameStatus('idle');
    }

    return () => {
      if (usernameCheckTimeout) {
        clearTimeout(usernameCheckTimeout);
      }
    };
  }, [username, profile]);

  const handleSaveProfile = async () => {
    setError('');
    setSuccess('');

    if (!fullName || !username || !email) {
      setError('Full name, username, and email are required');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      setError('Username can only contain letters, numbers, hyphens, and underscores');
      return;
    }

    if (usernameStatus === 'taken') {
      setError('This username is already taken');
      return;
    }

    if (usernameStatus === 'checking') {
      setError('Please wait while we check username availability');
      return;
    }

    setLoading(true);

    try {
      const updates: any = {
        full_name: fullName,
        username: username,
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user!.id);

      if (profileError) throw profileError;

      if (email !== profile?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email,
        });

        if (emailError) throw emailError;

        const { error: profileEmailError } = await supabase
          .from('profiles')
          .update({ email: email })
          .eq('id', user!.id);

        if (profileEmailError) throw profileEmailError;
      }

      await refreshProfile();
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message || 'Password does not meet requirements');
      return;
    }

    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile!.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password changed successfully!');
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-white">Account Settings</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Profile Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-slate-400"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    className={`w-full px-4 py-3 bg-slate-700/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-white placeholder-slate-400 pr-10 ${
                      usernameStatus === 'available' ? 'border-green-500' :
                      usernameStatus === 'taken' ? 'border-red-500' :
                      usernameStatus === 'invalid' ? 'border-red-500' :
                      'border-slate-600 focus:border-amber-500'
                    }`}
                    placeholder="username"
                  />
                  {usernameStatus === 'checking' && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-amber-500 animate-spin" />
                  )}
                  {usernameStatus === 'available' && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                  )}
                  {usernameStatus === 'taken' && (
                    <XCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-500" />
                  )}
                  {usernameStatus === 'invalid' && (
                    <XCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-500" />
                  )}
                </div>
                {usernameStatus === 'available' && (
                  <p className="mt-1 text-xs text-green-500">Username is available!</p>
                )}
                {usernameStatus === 'taken' && (
                  <p className="mt-1 text-xs text-red-500">This username is already taken</p>
                )}
                {usernameStatus === 'invalid' && (
                  <p className="mt-1 text-xs text-red-500">Invalid characters in username</p>
                )}
                {usernameStatus === 'idle' && (
                  <p className="mt-1 text-xs text-slate-400">Only letters, numbers, hyphens, and underscores allowed</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-slate-400"
                  placeholder="your.email@example.com"
                />
                <p className="mt-1 text-xs text-slate-400">Changing your email will require verification</p>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-slate-400 pr-12"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-slate-400 pr-12"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  At least 8 characters with uppercase, lowercase, and number
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-slate-400 pr-12"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleChangePassword}
                disabled={loading}
                className="w-full bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Changing Password...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
