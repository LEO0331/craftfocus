import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CraftPostCard } from '@/components/CraftPostCard';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { addComment, getCraftPostDetail, toggleLike, type CraftPostDetail } from '@/lib/crafts';
import { createExchangeRequest } from '@/lib/exchanges';
import { sanitizeText } from '@/lib/validation';

export default function CraftDetailScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const postId = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id), [params.id]);
  const { user } = useAuth();

  const [post, setPost] = useState<CraftPostDetail | null>(null);
  const [comment, setComment] = useState('');
  const [exchangeMessage, setExchangeMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadPost = useCallback(async () => {
    if (!postId) {
      return;
    }
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
    if (!user?.id || !postId) {
      return;
    }
    try {
      await toggleLike(postId, user.id);
      await loadPost();
    } catch (error) {
      Alert.alert('Like failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleAddComment = async () => {
    if (!user?.id || !postId) {
      return;
    }

    try {
      await addComment(postId, user.id, sanitizeText(comment, 240));
      setComment('');
      await loadPost();
    } catch (error) {
      Alert.alert('Comment failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleExchange = async () => {
    if (!user?.id || !post || !postId) {
      return;
    }

    try {
      await createExchangeRequest({
        requesterId: user.id,
        ownerId: post.user_id,
        craftPostId: postId,
        message: exchangeMessage ? sanitizeText(exchangeMessage, 240) : '',
      });
      setExchangeMessage('');
      Alert.alert('Sent', 'Exchange request sent.');
      router.push('/exchanges');
    } catch (error) {
      Alert.alert('Exchange failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  if (!postId) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Invalid craft id.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Craft Detail</Text>

      {post ? (
        <CraftPostCard
          authorName={post.author_name}
          title={post.title}
          category={post.category}
          description={post.description ?? undefined}
          imageUrl={post.image_url ?? undefined}
          pixelImageUrl={post.pixel_image_url ?? undefined}
          likes={post.likes_count}
          comments={post.comments_count}
          likedByMe={post.liked_by_me}
          openToExchange={post.open_to_exchange}
        />
      ) : (
        <Card>
          <Text style={styles.text}>{isLoading ? 'Loading...' : 'Post not found.'}</Text>
        </Card>
      )}

      {post ? (
        <Card>
          <Button label={post.liked_by_me ? 'Unlike' : 'Like'} onPress={handleToggleLike} />
          <Button label="Visit Creator Room" onPress={() => router.push(`/users/${post.user_id}/room`)} variant="secondary" />
          <Button label="Open Exchanges" onPress={() => router.push('/exchanges')} variant="secondary" />
        </Card>
      ) : null}

      {post?.open_to_exchange && post.user_id !== user?.id ? (
        <Card>
          <Text style={styles.label}>Request exchange</Text>
          <TextInput
            placeholder="Optional message"
            value={exchangeMessage}
            onChangeText={setExchangeMessage}
            style={styles.input}
          />
          <Button label="Send Exchange Request" onPress={handleExchange} />
        </Card>
      ) : null}

      {post ? (
        <Card>
          <Text style={styles.label}>Comments</Text>
          <TextInput
            placeholder="Write a comment"
            value={comment}
            onChangeText={setComment}
            style={styles.input}
            multiline
          />
          <Button label="Post Comment" onPress={handleAddComment} />

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
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  heading: { fontSize: 24, fontWeight: '800', color: theme.colors.text },
  text: { color: theme.colors.muted },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  label: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  commentRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 8,
    gap: 2,
  },
  commentAuthor: {
    color: theme.colors.text,
    fontWeight: '700',
  },
});
