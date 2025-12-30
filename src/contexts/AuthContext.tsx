import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signInWithGithub: () => Promise<{ error: AuthError | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithUsername: (username: string, password: string) => Promise<{ error: AuthError | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string, username: string) => Promise<{ error: AuthError | null }>;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      console.log('[Auth] Initializing authentication...');
      const initStartTime = Date.now();

      // Set a maximum timeout of 15 seconds for initialization
      const timeoutId = setTimeout(() => {
        console.error('[Auth] Initialization timeout after 15 seconds');
        setLoading(false);
      }, 15000);

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          console.log('[Auth] Session found for user:', session.user.id);
          setUser(session.user);
          setSession(session);

          const profileLoaded = await loadProfile(session.user.id);

          if (!profileLoaded) {
            console.error('[Auth] Failed to load profile - continuing without profile');
            // Don't block the user, just log the error
          }

          setIsGuest(false);
          localStorage.removeItem('guestMode');

          const initTime = Date.now() - initStartTime;
          console.log(`[Auth] Initialization completed in ${initTime}ms`);
        } else {
          console.log('[Auth] No active session found');
          const guestMode = localStorage.getItem('guestMode');
          setIsGuest(guestMode === 'true');
        }
      } catch (error) {
        console.error('[Auth] Error initializing auth:', error);
        const guestMode = localStorage.getItem('guestMode');
        setIsGuest(guestMode === 'true');
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
        console.log('[Auth] Auth loading state set to false');
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[Auth] Auth state changed: ${event}`);

        if (event === 'SIGNED_IN' && session) {
          console.log('[Auth] User signed in:', session.user.id);
          setUser(session.user);
          setSession(session);
          await loadProfile(session.user.id);
          setIsGuest(false);
          localStorage.removeItem('guestMode');
        } else if (event === 'SIGNED_OUT') {
          console.log('[Auth] User signed out');
          setUser(null);
          setSession(null);
          setProfile(null);
          setIsGuest(false);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('[Auth] Token refreshed');
          setSession(session);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadProfile = async (userId: string, retries = 0, maxRetries = 10): Promise<boolean> => {
    try {
      console.log(`[Auth] Loading profile for user ${userId} (attempt ${retries + 1}/${maxRetries + 1})`);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[Auth] Error loading profile:', error);
        throw error;
      }

      if (data) {
        console.log('[Auth] Profile loaded successfully:', { id: data.id, username: data.username, email: data.email });
        setProfile(data);
        return true;
      }

      // Profile not found yet - might still be creating
      if (retries < maxRetries) {
        console.log('[Auth] Profile not found yet, retrying in 500ms...');
        await new Promise(resolve => setTimeout(resolve, 500));
        return await loadProfile(userId, retries + 1, maxRetries);
      }

      console.error('[Auth] Profile not found after maximum retries');
      return false;
    } catch (error) {
      console.error('[Auth] Exception in loadProfile:', error);

      // Retry on error if we haven't exceeded max retries
      if (retries < maxRetries) {
        console.log('[Auth] Retrying after error in 500ms...');
        await new Promise(resolve => setTimeout(resolve, 500));
        return await loadProfile(userId, retries + 1, maxRetries);
      }

      return false;
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  };

  const signInWithGithub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithUsername = async (username: string, password: string) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .ilike('username', username)
        .maybeSingle();

      if (profileError || !profile) {
        return { error: { message: 'Invalid username or password', name: 'AuthError', status: 400 } as AuthError };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password,
      });

      return { error };
    } catch (err) {
      console.error('Sign in with username exception:', err);
      return { error: err as AuthError };
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string, username: string) => {
    console.log('[Auth] Starting signup process for:', email);
    const signupStartTime = Date.now();

    try {
      // Check for existing username
      console.log('[Auth] Checking username availability:', username);
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .ilike('username', username)
        .maybeSingle();

      if (existingProfile) {
        console.warn('[Auth] Username already taken:', username);
        return {
          error: { message: 'Username already taken', name: 'AuthError', status: 400 } as AuthError,
        };
      }

      // Create the auth user
      console.log('[Auth] Creating auth user...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username: username,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        console.error('[Auth] Signup error:', error);
        return { error };
      }

      if (!data?.user) {
        console.error('[Auth] No user returned from signup');
        return {
          error: { message: 'Failed to create user', name: 'AuthError', status: 500 } as AuthError,
        };
      }

      console.log('[Auth] User created:', data.user.id);

      // If there's a session, verify profile was created
      if (data.session) {
        console.log('[Auth] Session created, verifying profile...');

        const profileCreated = await loadProfile(data.user.id);

        if (!profileCreated) {
          console.error('[Auth] Profile verification failed after signup');
          // Don't fail the signup, but log the issue
          console.warn('[Auth] User may need to refresh or sign in again');
        } else {
          console.log('[Auth] Profile verified successfully');
        }

        const signupTime = Date.now() - signupStartTime;
        console.log(`[Auth] Signup completed in ${signupTime}ms`);
      } else {
        console.log('[Auth] User created but needs email confirmation');
      }

      return { error: null };
    } catch (err) {
      console.error('[Auth] Signup exception:', err);
      return { error: err as AuthError };
    }
  };

  const continueAsGuest = () => {
    localStorage.setItem('guestMode', 'true');
    setIsGuest(true);
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const signOut = async () => {
    if (isGuest) {
      localStorage.removeItem('guestMode');
      setIsGuest(false);
    } else {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    isGuest,
    signInWithGoogle,
    signInWithGithub,
    signInWithEmail,
    signInWithUsername,
    signUpWithEmail,
    continueAsGuest,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
