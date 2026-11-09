import type { Session, User } from '@supabase/supabase-js';
import { Redirect, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { AppLoading } from '@/components/AppLoading';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { signInWithEmail, signOut, signUpWithEmail } from '@/lib/auth';
import { isLocalMode, LOCAL_USER_ID } from '@/lib/data-mode';
import { openLocalDatabase } from '@/lib/local/database';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useI18n } from '@/hooks/useI18n';

type Player = { id: string; email?: string; kind: 'local' | 'supabase' };

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  player: Player | null;
  isLoading: boolean;
  localStartupFailed: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ requiresEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const AUTH_BOOT_TIMEOUT_MS = 4000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [localStartupFailed, setLocalStartupFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    let resolved = false;

    if (isLocalMode) {
      void openLocalDatabase()
        .catch((error) => {
          console.warn('Could not open the CraftFocus demo database', error);
          if (mounted) setLocalStartupFailed(true);
        })
        .finally(() => {
          if (mounted) setIsLoading(false);
        });
      return () => { mounted = false; };
    }

    if (!isSupabaseConfigured) {
      setSession(null);
      setIsLoading(false);
      return () => {
        mounted = false;
      };
    }

    const timeout = setTimeout(() => {
      if (mounted && !resolved) {
        setIsLoading(false);
      }
    }, AUTH_BOOT_TIMEOUT_MS);

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (mounted) {
          setSession(data.session);
        }
      })
      .finally(() => {
        resolved = true;
        clearTimeout(timeout);
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
      clearTimeout(timeout);
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      player: isLocalMode
        ? (!isLoading && !localStartupFailed ? { id: LOCAL_USER_ID, kind: 'local' } : null)
        : (session ? { id: session.user.id, email: session.user.email, kind: 'supabase' } : null),
      isLoading,
      localStartupFailed,
      signIn: async (email, password) => {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          throw error;
        }
      },
      signUp: async (email, password) => {
        const { data, error } = await signUpWithEmail(email, password);
        if (error) {
          throw error;
        }
        return { requiresEmailConfirmation: !data.session };
      },
      logout: async () => {
        const { error } = await signOut();
        if (error) {
          throw error;
        }
      },
    }),
    [session, isLoading, localStartupFailed]
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
  const { player, isLoading, localStartupFailed } = useAuth();
  const { t } = useI18n();
  const inAuthGroup = segments[0] === 'auth';

  if (isLoading) {
    return <AppLoading message={isLocalMode ? t('local.loading') : 'Checking your session...'} />;
  }

  if (localStartupFailed) {
    return (
      <View style={{ alignItems: 'center', padding: 16 }}>
        <Card>
          <Text accessibilityRole="alert">{t('local.storageUnavailable')}</Text>
          <Button label={t('local.reload')} onPress={() => window.location.reload()} />
        </Card>
      </View>
    );
  }

  if (!player && !inAuthGroup) {
    return <Redirect href="/auth/login" />;
  }

  if (player && inAuthGroup) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <>{children}</>;
}
