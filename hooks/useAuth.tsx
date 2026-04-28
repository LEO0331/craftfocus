import type { Session, User } from '@supabase/supabase-js';
import { Redirect, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { signInWithEmail, signOut, signUpWithEmail } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (mounted) {
          setSession(data.session);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      signIn: async (email, password) => {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          throw error;
        }
      },
      signUp: async (email, password) => {
        const { error } = await signUpWithEmail(email, password);
        if (error) {
          throw error;
        }
      },
      logout: async () => {
        const { error } = await signOut();
        if (error) {
          throw error;
        }
      },
    }),
    [session, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const { session, isLoading } = useAuth();
  const inAuthGroup = segments[0] === 'auth';

  if (isLoading) {
    return null;
  }

  if (!session && !inAuthGroup) {
    return <Redirect href="/auth/login" />;
  }

  if (session && inAuthGroup) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <>{children}</>;
}
