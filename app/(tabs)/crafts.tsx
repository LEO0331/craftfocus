import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { CraftPostCard } from '@/components/CraftPostCard';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { listCraftPosts, type CraftFeedItem } from '@/lib/crafts';
import { useI18n } from '@/hooks/useI18n';

export default function CraftsScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
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
      <Text style={styles.heading}>{t('crafts.title')}</Text>
      <Button label="Upload New Craft" onPress={() => router.push('/crafts/new')} />

      {isLoading && !posts.length ? <ActivityIndicator color={theme.colors.primary} /> : null}

      {!isLoading && !posts.length ? <Text style={styles.empty}>{t('crafts.empty')}</Text> : null}

      <View style={styles.grid}>
        {posts.map((post) => (
          <View key={post.id} style={styles.gridItem}>
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
              listingType={post.listing_type as 'catalog' | 'custom'}
              seedCost={Number(post.seed_cost ?? 0)}
              claimedByMe={post.claimed_by_me}
              
              onPress={() => router.push(`/crafts/${post.id}`)}
            />
          </View>
        ))}
      </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  gridItem: {
    flexBasis: Platform.OS === 'web' ? '48%' : '100%',
    flexGrow: 1,
  },
});
