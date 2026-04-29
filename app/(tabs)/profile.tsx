import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { deleteMyAccount } from '@/lib/auth';
import { storageAdapter } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { sanitizeText } from '@/lib/validation';
import type { TableRow } from '@/types/database';

type FocusSessionRow = TableRow<'focus_sessions'>;

const STORAGE_BUCKET = 'craft-images';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { profile, saveProfile } = useProfile();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [stats, setStats] = useState({
    totalMinutes: 0,
    completedSessions: 0,
    uploadedWorks: 0,
    unlockedItems: 0,
  });

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '');
    setBio(profile?.bio ?? '');
    setAvatarUri(profile?.avatar_url ?? null);
  }, [profile]);

  const loadStats = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    const [{ data: sessions, error: sessionsError }, { count: works, error: worksError }, { count: unlocked, error: unlockedError }] =
      await Promise.all([
        supabase.from('focus_sessions').select('duration_minutes,status').eq('user_id', user.id),
        supabase.from('craft_posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase
          .from('user_items')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('unlocked', true),
      ]);

    if (sessionsError) {
      throw sessionsError;
    }
    if (worksError) {
      throw worksError;
    }
    if (unlockedError) {
      throw unlockedError;
    }

    const completed = (sessions ?? []).filter(
      (entry: Pick<FocusSessionRow, 'status' | 'duration_minutes'>) => entry.status === 'completed'
    );
    const totalMinutes = completed.reduce((sum: number, entry) => sum + Number(entry.duration_minutes ?? 0), 0);

    setStats({
      totalMinutes,
      completedSessions: completed.length,
      uploadedWorks: works ?? 0,
      unlockedItems: unlocked ?? 0,
    });
  }, [user?.id]);

  useEffect(() => {
    loadStats().catch((error) => {
      console.warn('Failed to load stats', error);
    });
  }, [loadStats]);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    setAvatarUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!user?.id) {
      return;
    }
    setIsSaving(true);
    try {
      const safeDisplayName = displayName ? sanitizeText(displayName, 40) : '';
      const safeBio = bio ? sanitizeText(bio, 280) : '';
      let avatarUrlToSave = profile?.avatar_url ?? null;

      if (avatarUri && !avatarUri.startsWith('http')) {
        const avatarPath = `${user.id}/avatars/${Date.now()}.jpg`;
        avatarUrlToSave = await storageAdapter.uploadImage({
          bucket: STORAGE_BUCKET,
          path: avatarPath,
          uri: avatarUri,
        });
      } else if (avatarUri?.startsWith('http')) {
        avatarUrlToSave = avatarUri;
      }

      await saveProfile({
        display_name: safeDisplayName || null,
        bio: safeBio || null,
        avatar_url: avatarUrlToSave,
      });
      Alert.alert('Saved', 'Profile updated.');
    } catch (error) {
      Alert.alert(
        'Save failed',
        error instanceof Error
          ? `${error.message}\n\nTip: ensure the "${STORAGE_BUCKET}" storage bucket exists and is public.`
          : 'Unknown error'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This permanently removes your profile and app data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMyAccount();
              await logout();
              Alert.alert('Account deleted', 'Your account has been permanently deleted.');
            } catch (error) {
              Alert.alert('Delete failed', error instanceof Error ? error.message : 'Unknown error');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Profile</Text>

      <Card>
        <View style={styles.row}>
          <Avatar uri={avatarUri} label={profile?.username ?? user?.email ?? 'U'} size={56} />
          <View style={styles.meta}>
            <Text style={styles.name}>{profile?.display_name ?? profile?.username ?? 'New user'}</Text>
            <Text style={styles.sub}>{user?.email ?? ''}</Text>
          </View>
        </View>

        <Button label="Pick Avatar" onPress={pickAvatar} variant="secondary" />

        <Text style={styles.label}>Username</Text>
        <TextInput
          value={profile?.username ?? ''}
          editable={false}
          selectTextOnFocus={false}
          autoCapitalize="none"
          style={[styles.input, styles.readOnlyInput]}
        />

        <Text style={styles.label}>Display name</Text>
        <TextInput value={displayName} onChangeText={setDisplayName} style={styles.input} />

        <Text style={styles.label}>Bio</Text>
        <TextInput value={bio} onChangeText={setBio} multiline style={[styles.input, styles.bioInput]} />

        <Button label={isSaving ? 'Saving...' : 'Save Profile'} onPress={handleSave} disabled={isSaving} />
      </Card>

      <Card>
        <Text style={styles.name}>Stats</Text>
        <Text style={styles.sub}>total focus minutes: {stats.totalMinutes}</Text>
        <Text style={styles.sub}>completed sessions: {stats.completedSessions}</Text>
        <Text style={styles.sub}>uploaded works: {stats.uploadedWorks}</Text>
        <Text style={styles.sub}>unlocked items: {stats.unlockedItems}</Text>
      </Card>

      <Button label="Log Out" onPress={() => logout()} variant="secondary" />
      <Button label="Delete Account" onPress={handleDeleteAccount} variant="danger" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  heading: { fontSize: 24, fontWeight: '800', color: theme.colors.text },
  row: { flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'center' },
  meta: { gap: 2 },
  name: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  sub: { color: theme.colors.muted },
  label: { color: theme.colors.text, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  bioInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  readOnlyInput: {
    opacity: 0.7,
  },
});
