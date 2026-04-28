import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { CraftPostCard } from '@/components/CraftPostCard';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { listCraftPosts, type CraftFeedItem } from '@/lib/crafts';

export default function CraftsScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CraftFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextPosts = await listCraftPosts(user?.id);
      setPosts(nextPosts);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadPosts} />}
    >
      <Text style={styles.heading}>Craft Feed</Text>
      <Button label="Upload New Craft" onPress={() => router.push('/crafts/new')} />

      {isLoading && !posts.length ? <ActivityIndicator color={theme.colors.primary} /> : null}

      {!isLoading && !posts.length ? <Text style={styles.empty}>No posts yet. Share your first craft work.</Text> : null}

      {posts.map((post) => (
        <CraftPostCard
          key={post.id}
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
          onPress={() => router.push(`/crafts/${post.id}`)}
        />
      ))}
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
  heading: { fontSize: 30, fontWeight: '800', color: theme.colors.text, fontFamily: theme.typography.display },
  empty: { color: theme.colors.muted, fontFamily: theme.typography.body },
});
