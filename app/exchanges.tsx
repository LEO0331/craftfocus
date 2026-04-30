import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';

import { Card } from '@/components/Card';
import { ITEM_CATALOG_SEED } from '@/constants/itemCatalog';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { supabase } from '@/lib/supabase';
import type { TableRow } from '@/types/database';

type ListingClaimRow = TableRow<'listing_claims'>;
type CraftPostRow = TableRow<'craft_posts'>;
type CustomCollectibleRow = TableRow<'custom_collectibles'>;
type UserInventoryRow = TableRow<'user_inventory'>;

interface ClaimedListingItem {
  claimId: string;
  listingId: string;
  title: string;
  listingType: string;
  seedCost: number;
  claimedAt: string;
}

interface CustomClaimItem {
  id: string;
  listingId: string;
  title: string;
  imageUrl: string | null;
  pixelImageUrl: string | null;
  createdAt: string;
}

interface OfficialInventoryItem {
  itemId: string;
  name: string;
  quantity: number;
  updatedAt: string;
}

type ClaimFilter = 'all' | 'official' | 'custom';
type UnifiedClaimItemType = 'official' | 'custom';

interface UnifiedClaimItem {
  id: string;
  type: UnifiedClaimItemType;
  title: string;
  subtitle: string;
  timestamp: string;
  tags: string[];
}

function formatRelativeTime(value: string, locale: string): string {
  const targetMs = new Date(value).getTime();
  if (!Number.isFinite(targetMs)) return '';

  const diffSec = Math.round((targetMs - Date.now()) / 1000);
  const absSec = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (absSec < 60) return rtf.format(diffSec, 'second');
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  const diffHour = Math.round(diffSec / 3600);
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour');
  const diffDay = Math.round(diffSec / 86400);
  if (Math.abs(diffDay) < 7) return rtf.format(diffDay, 'day');
  const diffWeek = Math.round(diffSec / 604800);
  if (Math.abs(diffWeek) < 5) return rtf.format(diffWeek, 'week');
  const diffMonth = Math.round(diffSec / 2592000);
  if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, 'month');
  const diffYear = Math.round(diffSec / 31536000);
  return rtf.format(diffYear, 'year');
}

export default function ClaimsScreen() {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const navigation = useNavigation();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [claimedListings, setClaimedListings] = useState<ClaimedListingItem[]>([]);
  const [customClaims, setCustomClaims] = useState<CustomClaimItem[]>([]);
  const [officialInventory, setOfficialInventory] = useState<OfficialInventoryItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<ClaimFilter>('all');

  const loadData = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    setIsLoading(true);
    try {
      const [claimsResult, customResult, inventoryResult] = await Promise.all([
        supabase.from('listing_claims').select('id,listing_id,claimed_at').eq('user_id', user.id).order('claimed_at', { ascending: false }),
        supabase
          .from('custom_collectibles')
          .select('id,listing_id,image_url,pixel_image_url,created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase.from('user_inventory').select('item_id,quantity,updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }),
      ]);

      if (claimsResult.error) throw claimsResult.error;
      if (customResult.error) throw customResult.error;
      if (inventoryResult.error) throw inventoryResult.error;

      const claimRows = (claimsResult.data ?? []) as Pick<ListingClaimRow, 'id' | 'listing_id' | 'claimed_at'>[];
      const customRows = (customResult.data ?? []) as Pick<
        CustomCollectibleRow,
        'id' | 'listing_id' | 'image_url' | 'pixel_image_url' | 'created_at'
      >[];
      const inventoryRows = (inventoryResult.data ?? []) as Pick<UserInventoryRow, 'item_id' | 'quantity' | 'updated_at'>[];

      const listingIds = Array.from(new Set([...claimRows.map((row) => row.listing_id), ...customRows.map((row) => row.listing_id)]));

      let postMap = new Map<string, Pick<CraftPostRow, 'id' | 'title' | 'listing_type' | 'seed_cost'>>();
      if (listingIds.length) {
        const postsResult = await supabase.from('craft_posts').select('id,title,listing_type,seed_cost').in('id', listingIds);
        if (postsResult.error) throw postsResult.error;
        postMap = new Map((postsResult.data ?? []).map((post) => [post.id, post]));
      }

      setClaimedListings(
        claimRows.map((row) => ({
          claimId: row.id,
          listingId: row.listing_id,
          title: postMap.get(row.listing_id)?.title ?? t('claims.unknownListing'),
          listingType: String(postMap.get(row.listing_id)?.listing_type ?? 'custom'),
          seedCost: Number(postMap.get(row.listing_id)?.seed_cost ?? 0),
          claimedAt: row.claimed_at,
        }))
      );

      setCustomClaims(
        customRows.map((row) => ({
          id: row.id,
          listingId: row.listing_id,
          title: postMap.get(row.listing_id)?.title ?? t('claims.unknownListing'),
          imageUrl: row.image_url,
          pixelImageUrl: row.pixel_image_url,
          createdAt: row.created_at,
        }))
      );

      const itemNameMap = new Map<string, string>(ITEM_CATALOG_SEED.map((item) => [item.id, item.name]));
      setOfficialInventory(
        inventoryRows
          .filter((row) => row.quantity > 0)
          .map((row) => ({
            itemId: row.item_id,
            name: itemNameMap.get(row.item_id) ?? row.item_id,
            quantity: row.quantity,
            updatedAt: row.updated_at,
          }))
      );
    } finally {
      setIsLoading(false);
    }
  }, [t, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const unifiedClaims = useMemo<UnifiedClaimItem[]>(() => {
    const customByListing = new Map(customClaims.map((entry) => [entry.listingId, entry]));

    const mergedCustomClaims: UnifiedClaimItem[] = claimedListings.map((entry) => {
      const custom = customByListing.get(entry.listingId) ?? null;
      const hasCollectible = Boolean(custom);
      const tags = [t('claims.tagClaimed')];
      if (hasCollectible) tags.push(t('claims.tagPlaceable'));

      return {
        id: `custom-${entry.claimId}`,
        type: 'custom',
        title: entry.title,
        subtitle: t('claims.listingMeta', { type: entry.listingType, count: entry.seedCost }),
        timestamp: custom?.createdAt ?? entry.claimedAt,
        tags,
      };
    });

    const mergedCustomByListingId = new Set(claimedListings.map((entry) => entry.listingId));
    customClaims.forEach((entry) => {
      if (mergedCustomByListingId.has(entry.listingId)) return;
      mergedCustomClaims.push({
        id: `custom-fallback-${entry.id}`,
        type: 'custom',
        title: entry.title,
        subtitle: entry.pixelImageUrl ? t('claims.hasPixel') : t('claims.noPixel'),
        timestamp: entry.createdAt,
        tags: [t('claims.tagClaimed'), t('claims.tagPlaceable')],
      });
    });

    const officialClaims: UnifiedClaimItem[] = officialInventory.map((entry) => ({
      id: `official-${entry.itemId}`,
      type: 'official',
      title: entry.name,
      subtitle: t('claims.quantity', { count: entry.quantity }),
      timestamp: entry.updatedAt,
      tags: [t('claims.tagOfficial')],
    }));

    return [...mergedCustomClaims, ...officialClaims].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [claimedListings, customClaims, officialInventory, t]);

  const filteredClaims = useMemo(() => {
    if (activeFilter === 'all') return unifiedClaims;
    return unifiedClaims.filter((entry) => entry.type === activeFilter);
  }, [activeFilter, unifiedClaims]);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    router.replace('/(tabs)/friends');
  }, [navigation, router]);

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel={t('claims.back')}
              style={({ pressed }) => [styles.headerBack, pressed ? styles.headerBackPressed : null]}
            >
              <Text style={styles.headerBackText}>{t('claims.back')}</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>{t('claims.title')}</Text>

        <Card>
          <Text style={styles.subheading}>{t('claims.unifiedTitle')}</Text>
          <View style={styles.filterRow}>
            {(['all', 'official', 'custom'] as ClaimFilter[]).map((filter) => {
              const active = activeFilter === filter;
              return (
                <Pressable
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={({ pressed }) => [styles.filterChip, active ? styles.filterChipActive : null, pressed ? styles.filterChipPressed : null]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={t(`claims.filter.${filter}`)}
                >
                  <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>{t(`claims.filter.${filter}`)}</Text>
                </Pressable>
              );
            })}
          </View>
          {!filteredClaims.length ? <Text style={styles.text}>{t('claims.emptyFiltered')}</Text> : null}
          {filteredClaims.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemHead}>
                <Text style={styles.title}>{item.title}</Text>
                <View style={styles.tagRow}>
                  {item.tags.map((tag) => (
                    <View key={`${item.id}-${tag}`} style={styles.tagPill}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <Text style={styles.text}>{item.subtitle}</Text>
              <Text style={styles.timestamp}>{t('claims.claimedAgo', { timeAgo: formatRelativeTime(item.timestamp, language) })}</Text>
            </View>
          ))}
        </Card>

        {isLoading ? <Text style={styles.text}>{t('common.loading')}</Text> : null}
      </ScrollView>
    </>
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
  headerBack: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 2,
  },
  headerBackPressed: {
    opacity: 0.84,
  },
  headerBackText: {
    color: theme.colors.text,
    fontFamily: theme.typography.body,
    fontSize: 12,
    fontWeight: '700',
  },
  subheading: { fontSize: 16, fontWeight: '700', color: theme.colors.text, fontFamily: theme.typography.body },
  title: { fontSize: 15, fontWeight: '700', color: theme.colors.text, fontFamily: theme.typography.body },
  text: { color: theme.colors.muted, fontFamily: theme.typography.body },
  timestamp: {
    color: theme.colors.muted,
    fontFamily: theme.typography.body,
    fontSize: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  filterChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FFF4E5',
  },
  filterChipPressed: {
    opacity: 0.84,
  },
  filterChipText: {
    color: theme.colors.muted,
    fontFamily: theme.typography.body,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: theme.colors.primary,
  },
  itemRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 8,
    gap: 2,
  },
  itemHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  tagPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: {
    color: theme.colors.muted,
    fontFamily: theme.typography.body,
    fontSize: 12,
    fontWeight: '700',
  },
});
