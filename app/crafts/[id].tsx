import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CraftPostCard } from '@/components/CraftPostCard';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { addComment, claimListingWithSeeds, getCraftPostDetail, toggleLike, type CraftPostDetail } from '@/lib/crafts';
import { emitTopStatusRefresh } from '@/lib/topStatusBus';
import { sanitizeText } from '@/lib/validation';
import { ensureWallet } from '@/lib/wallet';

export default function CraftDetailScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const postId = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id), [params.id]);
  const { user } = useAuth();
  const { t } = useI18n();

  const [post, setPost] = useState<CraftPostDetail | null>(null);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadPost = useCallback(async () => {
    if (!postId) return;
    setIsLoading(true);
    try {
      const detail = await getCraftPostDetail(postId, user?.id);
      setPost(detail);
    } finally {
      setIsLoading(false);
    }
  }, [postId, user?.id]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const handleToggleLike = async () => {
    if (!user?.id || !postId) return;
    try {
      await toggleLike(postId, user.id);
      await loadPost();
    } catch (error) {
      Alert.alert(t('craft.detail.like'), error instanceof Error ? error.message : t('common.unknownError'));
    }
  };

  const handleClaim = async () => {
    if (!user?.id || !postId || !post) return;
    try {
      await ensureWallet(user.id);
      await claimListingWithSeeds(postId);
      Alert.alert(t('craft.detail.claimed'), t('craft.detail.claimed'));
      await loadPost();
      emitTopStatusRefresh();
    } catch (error) {
      Alert.alert(t('craft.detail.claim'), error instanceof Error ? error.message : t('common.unknownError'));
    }
  };

  const handleAddComment = async () => {
    if (!user?.id || !postId) return;
    try {
      await addComment(postId, user.id, sanitizeText(comment, 240));
      setComment('');
      await loadPost();
    } catch (error) {
      Alert.alert(t('craft.detail.comments'), error instanceof Error ? error.message : t('common.unknownError'));
    }
  };

  if (!postId) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>{t('craft.detail.invalidId')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{t('craft.detail.title')}</Text>

      {post ? (
        <CraftPostCard
          authorName={post.author_name}
          authorAnimalId={post.author_animal_id}
          title={post.title}
          description={post.description ?? undefined}
          imageUrl={post.image_url ?? undefined}
          pixelImageUrl={post.pixel_image_url ?? undefined}
          likes={post.likes_count}
          comments={post.comments_count}
          likedByMe={post.liked_by_me}
          seedCost={Number(post.seed_cost ?? 0)}
          claimedByMe={post.claimed_by_me}
        />
      ) : (
        <Card>
          <Text style={styles.text}>{isLoading ? t('common.loading') : t('craft.detail.notFound')}</Text>
        </Card>
      )}

      {post ? (
        <Card>
          <View style={styles.actionsRow}>
            <Button label={post.liked_by_me ? t('craft.detail.unlike') : t('craft.detail.like')} onPress={handleToggleLike} />
            {post.user_id !== user?.id ? (
              <Button label={post.claimed_by_me ? t('craft.detail.claimed') : t('craft.detail.claim', { count: post.seed_cost ?? 0 })} onPress={handleClaim} disabled={post.claimed_by_me} />
            ) : null}
          </View>
          <Button label={t('craft.detail.visitRoom')} onPress={() => router.push(`/users/${post.user_id}/room`)} variant="secondary" />
        </Card>
      ) : null}

      {post ? (
        <Card>
          <Text style={styles.label}>{t('craft.detail.comments')}</Text>
          <TextInput placeholder={t('craft.detail.commentPlaceholder')} value={comment} onChangeText={setComment} style={styles.input} multiline />
          <Button label={t('craft.detail.postComment')} onPress={handleAddComment} />
          {post.comments.map((entry) => (
            <View key={entry.id} style={styles.commentRow}>
              <Text style={styles.commentAuthor}>{entry.author_name}</Text>
              <Text style={styles.text}>{entry.body}</Text>
            </View>
          ))}
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md, maxWidth: 960, width: '100%', alignSelf: 'center' },
  heading: { fontSize: 24, fontWeight: '800', color: theme.colors.text },
  text: { color: theme.colors.muted },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  label: { color: theme.colors.text, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  commentRow: { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 8, gap: 2 },
  commentAuthor: { color: theme.colors.text, fontWeight: '700' },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
