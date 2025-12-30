import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from '../hooks/useNavigate';
import { Sparkles, Mail, Eye, EyeOff, User, Lock, CheckCircle, XCircle, Loader2, Upload, Camera } from 'lucide-react';
import { validatePasswordStrength } from '../utils/passwordStrength';
import { supabase } from '../lib/supabase';
import { AvatarService } from '../services/AvatarService';

type TabType = 'signin' | 'signup';

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export const AuthPage: React.FC = () => {
  const { signInWithEmail, signInWithUsername, signUpWithEmail, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('signup');
  const [showPassword, setShowPassword] = useState(false);

  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInError, setSignInError] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);

  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpError, setSignUpError] = useState('');
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [usernameCheckTimeout, setUsernameCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  const checkUsernameAvailability = useCallback(async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .ilike('username', username)
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

    if (signUpUsername.length >= 3) {
      const timeout = setTimeout(() => {
        checkUsernameAvailability(signUpUsername);
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
  }, [signUpUsername]);

  const isEmail = (value: string) => {
    return value.includes('@');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError('');
    setSignInLoading(true);

    console.log('[AuthPage] Starting sign in process');

    try {
      const { error } = isEmail(signInIdentifier)
        ? await signInWithEmail(signInIdentifier, signInPassword)
        : await signInWithUsername(signInIdentifier, signInPassword);

      if (error) {
        console.error('[AuthPage] Sign in failed:', error);
        setSignInError(error.message || 'Failed to sign in');
      } else {
        console.log('[AuthPage] Sign in successful, navigating to home');
        navigate('/home');
      }
    } catch (err) {
      console.error('[AuthPage] Sign in exception:', err);
      setSignInError('An unexpected error occurred');
    } finally {
      setSignInLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = AvatarService.validateFile(file);
    if (!validation.valid) {
      setSignUpError(validation.error || 'Invalid file');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setSignUpError('');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError('');

    console.log('[AuthPage] Starting signup process');

    if (!signUpEmail || !signUpPassword || !signUpUsername || !signUpFullName) {
      setSignUpError('All fields are required');
      return;
    }

    if (!avatarFile) {
      setSignUpError('Please upload a profile picture');
      return;
    }

    if (signUpUsername.length < 3) {
      setSignUpError('Username must be at least 3 characters long');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(signUpUsername)) {
      setSignUpError('Username can only contain letters, numbers, hyphens, and underscores');
      return;
    }

    if (usernameStatus === 'taken') {
      setSignUpError('This username is already taken. Please choose another one');
      return;
    }

    if (usernameStatus === 'checking') {
      setSignUpError('Please wait while we check username availability');
      return;
    }

    const passwordValidation = validatePasswordStrength(signUpPassword);
    if (!passwordValidation.isValid) {
      setSignUpError(passwordValidation.message || 'Password does not meet requirements');
      return;
    }

    setSignUpLoading(true);
    setAvatarUploading(true);

    try {
      console.log('[AuthPage] Uploading avatar temporarily');
      const { url: tempAvatarUrl, path: tempPath, error: uploadError } = await AvatarService.uploadAvatarTemporary(avatarFile);

      if (uploadError || !tempAvatarUrl || !tempPath) {
        console.error('[AuthPage] Avatar upload failed:', uploadError);
        setSignUpError(uploadError || 'Failed to upload avatar');
        setSignUpLoading(false);
        setAvatarUploading(false);
        return;
      }

      console.log('[AuthPage] Avatar uploaded temporarily, creating user account');

      console.log('[AuthPage] Calling signUpWithEmail with avatar URL');
      const { error, userId } = await signUpWithEmail(signUpEmail, signUpPassword, signUpFullName, signUpUsername, tempAvatarUrl, tempPath);

      if (error) {
        console.error('[AuthPage] Signup failed:', error);
        setSignUpError(error.message || 'Failed to sign up');
      } else {
        console.log('[AuthPage] Signup successful, navigating to home');
        navigate('/home');
      }
    } catch (err) {
      console.error('[AuthPage] Signup exception:', err);
      setSignUpError('An unexpected error occurred');
    } finally {
      setSignUpLoading(false);
      setAvatarUploading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      console.error('Google sign in error:', error);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative overflow-hidden border-r border-slate-700/50">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 text-center px-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-2xl mb-8 shadow-2xl shadow-amber-500/50">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">FlashFX Editor</h1>
          <p className="text-xl text-slate-300 max-w-md mx-auto">
            Create stunning designs and animations with powerful tools and AI assistance
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl mb-4 shadow-2xl shadow-amber-500/50">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">FlashFX Editor</h1>
          </div>

          <div className="mb-8">
            <div className="flex border-b border-slate-700">
              <button
                className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                  activeTab === 'signin'
                    ? 'text-amber-500 border-b-2 border-amber-500'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                onClick={() => setActiveTab('signin')}
              >
                Sign In
              </button>
              <button
                className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                  activeTab === 'signup'
                    ? 'text-amber-500 border-b-2 border-amber-500'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                onClick={() => setActiveTab('signup')}
              >
                Sign Up
              </button>
            </div>
          </div>

          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 border-2 border-slate-600 hover:border-amber-500 bg-slate-800/50 hover:bg-slate-700/50 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-900 text-slate-400">or</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email or Username
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={signInIdentifier}
                    onChange={(e) => setSignInIdentifier(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-slate-400"
                    placeholder="Enter email or username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-slate-800/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-slate-400"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {signInError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {signInError}
                </div>
              )}

              <button
                type="submit"
                disabled={signInLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signInLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {activeTab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 border-2 border-slate-600 hover:border-amber-500 bg-slate-800/50 hover:bg-slate-700/50 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-900 text-slate-400">or</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-slate-400"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Profile Picture</label>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-full bg-slate-800/50 border-2 border-slate-600 flex items-center justify-center overflow-hidden">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-10 h-10 text-slate-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label htmlFor="avatar-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg hover:border-amber-500 hover:bg-slate-700/50 transition-all duration-200 text-white">
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="text-sm font-medium">
                          {avatarFile ? avatarFile.name : 'Choose a photo'}
                        </span>
                      </div>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                    <p className="mt-1 text-xs text-slate-400">
                      JPG, PNG, GIF or WebP. Max 5MB.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={signUpUsername}
                    onChange={(e) => setSignUpUsername(e.target.value.toLowerCase())}
                    className={`w-full pl-10 pr-10 py-3 bg-slate-800/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-white placeholder-slate-400 ${
                      usernameStatus === 'available' ? 'border-green-500' :
                      usernameStatus === 'taken' ? 'border-red-500' :
                      usernameStatus === 'invalid' ? 'border-red-500' :
                      'border-slate-600 focus:border-amber-500'
                    }`}
                    placeholder="username"
                    required
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
                  <p className="mt-1 text-xs text-green-500 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Username is available!
                  </p>
                )}
                {usernameStatus === 'taken' && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    This username is already taken
                  </p>
                )}
                {usernameStatus === 'invalid' && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    Invalid characters in username
                  </p>
                )}
                {usernameStatus === 'idle' && (
                  <p className="mt-1 text-xs text-slate-400">
                    Only letters, numbers, hyphens, and underscores allowed
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={signUpFullName}
                    onChange={(e) => setSignUpFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-slate-400"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-slate-800/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-slate-400"
                    placeholder="Create a strong password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  At least 8 characters with uppercase, lowercase, and number
                </p>
              </div>

              {signUpError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {signUpError}
                </div>
              )}

              <button
                type="submit"
                disabled={signUpLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signUpLoading ? 'Creating account...' : 'Create Account'}
              </button>

              <p className="text-xs text-slate-400 text-center">
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </p>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/home')}
              className="text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
