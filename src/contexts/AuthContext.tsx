import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isDeactivated: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeactivated, setIsDeactivated] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Create profile on sign up
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            createProfileIfNotExists(session.user);
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Periodic session validation - detects deleted/revoked users
  useEffect(() => {
    if (!session) return;

    const validateSession = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          console.warn('Session invalidated - forcing logout and reload');
          localStorage.removeItem('sb-' + import.meta.env.VITE_SUPABASE_PROJECT_ID + '-auth-token');
          await supabase.auth.signOut({ scope: 'local' });
          window.location.href = '/auth';
          return;
        }

        // Check if user is banned (deactivated)
        if (data.user.banned_until) {
          const bannedUntil = new Date(data.user.banned_until);
          if (bannedUntil > new Date()) {
            setIsDeactivated(true);
            return;
          }
        }
        setIsDeactivated(false);
      } catch {
        // Network error - skip this check
      }
    };

    // Check every 5 seconds for faster detection
    const interval = setInterval(validateSession, 5_000);

    return () => clearInterval(interval);
  }, [session]);

  const createProfileIfNotExists = async (authUser: User) => {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', authUser.id)
      .single();

    const fullName = authUser.user_metadata?.full_name || null;

    if (!data) {
      await supabase.from('profiles').insert({ 
        user_id: authUser.id,
        full_name: fullName,
      });
    } else {
      // Update last_seen_at and full_name if missing
      const updates: Record<string, unknown> = { 
        last_seen_at: new Date().toISOString() 
      };
      if (fullName) {
        updates.full_name = fullName;
      }
      await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', authUser.id);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName },
      },
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    setIsDeactivated(false);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isDeactivated, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
