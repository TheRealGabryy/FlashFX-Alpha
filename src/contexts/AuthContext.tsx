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
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          setSession(session);
          await loadProfile(session.user.id);
          setIsGuest(false);
          localStorage.removeItem('guestMode');
        } else {
          const guestMode = localStorage.getItem('guestMode');
          setIsGuest(guestMode === 'true');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        const guestMode = localStorage.getItem('guestMode');
        setIsGuest(guestMode === 'true');
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user);
          setSession(session);
          await loadProfile(session.user.id);
          setIsGuest(false);
          localStorage.removeItem('guestMode');
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setProfile(null);
          setIsGuest(false);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setSession(session);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
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
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .ilike('username', username)
        .maybeSingle();

      if (existingProfile) {
        return {
          error: { message: 'Username already taken', name: 'AuthError', status: 400 } as AuthError,
        };
      }

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
        console.error('Signup error:', error);
        return { error };
      }

      if (data?.user && !data.session) {
        console.log('User created but needs email confirmation');
      }

      return { error: null };
    } catch (err) {
      console.error('Signup exception:', err);
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
