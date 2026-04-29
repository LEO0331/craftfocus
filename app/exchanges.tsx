import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

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
}

export default function ClaimsScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [claimedListings, setClaimedListings] = useState<ClaimedListingItem[]>([]);
  const [customClaims, setCustomClaims] = useState<CustomClaimItem[]>([]);
  const [officialInventory, setOfficialInventory] = useState<OfficialInventoryItem[]>([]);

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
        supabase.from('user_inventory').select('item_id,quantity').eq('user_id', user.id).order('updated_at', { ascending: false }),
      ]);

      if (claimsResult.error) throw claimsResult.error;
      if (customResult.error) throw customResult.error;
      if (inventoryResult.error) throw inventoryResult.error;

      const claimRows = (claimsResult.data ?? []) as Pick<ListingClaimRow, 'id' | 'listing_id' | 'claimed_at'>[];
      const customRows = (customResult.data ?? []) as Pick<
        CustomCollectibleRow,
        'id' | 'listing_id' | 'image_url' | 'pixel_image_url' | 'created_at'
      >[];
      const inventoryRows = (inventoryResult.data ?? []) as Pick<UserInventoryRow, 'item_id' | 'quantity'>[];

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
          }))
      );
    } finally {
      setIsLoading(false);
    }
  }, [t, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{t('claims.title')}</Text>

      <Card>
        <Text style={styles.subheading}>{t('claims.claimedListings')}</Text>
        {!claimedListings.length ? <Text style={styles.text}>{t('claims.emptyListings')}</Text> : null}
        {claimedListings.map((item) => (
          <View key={item.claimId} style={styles.itemRow}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.text}>{t('claims.listingMeta', { type: item.listingType, count: item.seedCost })}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={styles.subheading}>{t('claims.customCollectibles')}</Text>
        {!customClaims.length ? <Text style={styles.text}>{t('claims.emptyCustom')}</Text> : null}
        {customClaims.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.text}>{item.pixelImageUrl ? t('claims.hasPixel') : t('claims.noPixel')}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={styles.subheading}>{t('claims.officialInventory')}</Text>
        {!officialInventory.length ? <Text style={styles.text}>{t('claims.emptyOfficial')}</Text> : null}
        {officialInventory.map((item) => (
          <View key={item.itemId} style={styles.itemRow}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.text}>{t('claims.quantity', { count: item.quantity })}</Text>
          </View>
        ))}
      </Card>

      {isLoading ? <Text style={styles.text}>{t('common.loading')}</Text> : null}
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
  subheading: { fontSize: 16, fontWeight: '700', color: theme.colors.text, fontFamily: theme.typography.body },
  title: { fontSize: 15, fontWeight: '700', color: theme.colors.text, fontFamily: theme.typography.body },
  text: { color: theme.colors.muted, fontFamily: theme.typography.body },
  itemRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 8,
    gap: 2,
  },
});
