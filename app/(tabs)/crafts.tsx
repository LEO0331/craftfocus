import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CraftPostCard } from '@/components/CraftPostCard';
import { PixelSprite } from '@/components/PixelSprite';
import { ITEM_CATALOG_SEED } from '@/constants/itemCatalog';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { claimListingWithSeeds, claimOfficialInventoryItem, listCraftPosts, type CraftFeedItem } from '@/lib/crafts';
import { useI18n } from '@/hooks/useI18n';
import { emitTopStatusRefresh } from '@/lib/topStatusBus';
import { ensureWallet } from '@/lib/wallet';

export default function CraftsScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [posts, setPosts] = useState<CraftFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [claimingOfficialId, setClaimingOfficialId] = useState<string | null>(null);
  const [officialSearch, setOfficialSearch] = useState('');

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      if (user?.id) {
        await ensureWallet(user.id);
      }
      const nextPosts = await listCraftPosts(user?.id);
      setPosts(nextPosts);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleClaim = useCallback(
    async (listingId: string) => {
      if (!user?.id) {
        Alert.alert(t('auth.login'), t('craft.new.signInAgain'));
        return;
      }
      try {
        await ensureWallet(user.id);
        await claimListingWithSeeds(listingId);
        await loadPosts();
        emitTopStatusRefresh();
      } catch (error) {
        Alert.alert(t('craft.detail.claim'), error instanceof Error ? error.message : t('common.unknownError'));
      }
    },
    [loadPosts, t, user?.id]
  );

  const handleClaimOfficial = useCallback(
    async (itemId: string, seedCost: number) => {
      if (!user?.id) {
        Alert.alert(t('auth.login'), t('craft.new.signInAgain'));
        return;
      }
      setClaimingOfficialId(itemId);
      try {
        await ensureWallet(user.id);
        await claimOfficialInventoryItem(itemId, seedCost);
        await loadPosts();
        emitTopStatusRefresh();
      } catch (error) {
        Alert.alert(t('crafts.official.title'), error instanceof Error ? error.message : t('common.unknownError'));
      } finally {
        setClaimingOfficialId(null);
      }
    },
    [loadPosts, t, user?.id]
  );

  const visibleOfficialItems = useMemo(() => {
    const keyword = officialSearch.trim().toLowerCase();
    if (!keyword) return ITEM_CATALOG_SEED;
    return ITEM_CATALOG_SEED.filter((item) => {
      const haystack = `${item.name} ${item.description ?? ''}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [officialSearch]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadPosts} />}
    >
      <Text style={styles.heading}>{t('crafts.title')}</Text>
      <Button label={t('crafts.upload')} onPress={() => router.push('/crafts/new')} />

      <Card>
        <Text style={styles.sectionTitle}>{t('crafts.official.title')}</Text>
        <Text style={styles.sectionHint}>{t('crafts.official.hint')}</Text>
        <TextInput
          value={officialSearch}
          onChangeText={setOfficialSearch}
          placeholder={t('crafts.official.searchPlaceholder')}
          style={styles.searchInput}
        />
        <View style={styles.officialGrid}>
          {visibleOfficialItems.map((item) => {
            const officialSeedCost = 25;
            return (
              <View key={item.id} style={styles.officialCard}>
                <View style={styles.officialHead}>
                  <PixelSprite spriteId={item.id} size={34} />
                  <Text style={styles.officialName}>{item.name}</Text>
                </View>
                <Text style={styles.officialMeta}>{item.description ?? t('crafts.official.defaultDescription')}</Text>
                <Button
                  label={`${officialSeedCost} 🌱`}
                  onPress={() => handleClaimOfficial(item.id, officialSeedCost)}
                  disabled={claimingOfficialId === item.id}
                  variant="secondary"
                />
              </View>
            );
          })}
        </View>
      </Card>

      {isLoading && !posts.length ? <ActivityIndicator color={theme.colors.primary} /> : null}

      {!isLoading && !posts.length ? <Text style={styles.empty}>{t('crafts.empty')}</Text> : null}

      <View style={styles.grid}>
        {posts.map((post) => (
          <View key={post.id} style={styles.gridItem}>
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
              onPress={() => router.push(`/crafts/${post.id}`)}
            />
            {!post.claimed_by_me && post.user_id !== user?.id ? (
              <View style={styles.claimBtnWrap}>
                <Button
                  label={t('craft.detail.claim', { count: post.seed_cost ?? 0 })}
                  onPress={() => handleClaim(post.id)}
                  variant="secondary"
                />
              </View>
            ) : null}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.body,
  },
  sectionHint: { color: theme.colors.muted, fontFamily: theme.typography.body },
  searchInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  officialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  officialCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 10,
    backgroundColor: '#fff',
    gap: 6,
    flexBasis: Platform.OS === 'web' ? '31%' : '48%',
    flexGrow: 1,
  },
  officialHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  officialName: {
    color: theme.colors.text,
    fontWeight: '700',
    fontFamily: theme.typography.body,
  },
  officialMeta: {
    color: theme.colors.muted,
    fontFamily: theme.typography.body,
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  gridItem: {
    flexBasis: Platform.OS === 'web' ? '48%' : '100%',
    flexGrow: 1,
  },
  claimBtnWrap: {
    marginTop: 8,
  },
});
