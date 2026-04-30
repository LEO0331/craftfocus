import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { AsciiPet } from '@/components/AsciiPet';
import { Card } from '@/components/Card';
import { PixelGridSprite } from '@/components/PixelGridSprite';
import { resolveAsciiAnimalBadge } from '@/constants/asciiPets';
import { theme } from '@/constants/theme';
import { useI18n } from '@/hooks/useI18n';

interface CraftPostCardProps {
  authorName?: string;
  authorAnimalId?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  pixelImageUrl?: string;
  pixelPalette?: Record<string, string> | null;
  pixelGrid?: string[] | null;
  likes?: number;
  comments?: number;
  seedCost?: number;
  claimedByMe?: boolean;
  onPress?: () => void;
  likedByMe?: boolean;
  layout?: 'default' | 'compact';
  claimLabel?: string;
  onClaimPress?: () => void;
}

export function CraftPostCard({
  authorName,
  authorAnimalId = 'cat',
  title,
  description,
  imageUrl,
  pixelImageUrl,
  pixelPalette,
  pixelGrid,
  likes = 0,
  comments = 0,
  seedCost = 0,
  claimedByMe = false,
  onPress,
  likedByMe = false,
  layout = 'default',
  claimLabel,
  onClaimPress,
}: CraftPostCardProps) {
  const { t } = useI18n();
  const displayImageUrl = pixelImageUrl ?? imageUrl;
  const compact = layout === 'compact';

  const content = (
    <Card>
      {compact ? (
        <View style={styles.compactHead}>
          {displayImageUrl ? (
            <Image source={{ uri: displayImageUrl }} style={styles.thumb} accessibilityLabel={t('craft.card.image')} />
          ) : pixelPalette && pixelGrid ? (
            <View style={styles.thumbSprite} accessibilityLabel={t('craft.card.imageFallback')}>
              <PixelGridSprite palette={pixelPalette} grid={pixelGrid} size={30} />
            </View>
          ) : (
            <View style={styles.thumbFallback} accessibilityLabel={t('craft.card.imageFallback')}>
              <Text style={styles.thumbFallbackText}>PXL</Text>
            </View>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
      ) : (
        <>
          {displayImageUrl ? <Image source={{ uri: displayImageUrl }} style={styles.image} accessibilityLabel={t('craft.card.image')} /> : null}
          {!displayImageUrl && pixelPalette && pixelGrid ? (
            <View style={styles.imageSpriteWrap} accessibilityLabel={t('craft.card.imageFallback')}>
              <PixelGridSprite palette={pixelPalette} grid={pixelGrid} size={96} />
            </View>
          ) : null}
          <Text style={styles.title}>{title}</Text>
        </>
      )}
      <View style={styles.authorRow}>
        <AsciiPet art={resolveAsciiAnimalBadge(authorAnimalId)} compact />
        <Text style={styles.meta}>
          {t('craft.card.by')} {authorName ?? t('craft.card.unknownAuthor')}
        </Text>
      </View>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      <View style={styles.row}>
        <Text style={[styles.meta, likedByMe ? styles.liked : null]}>♥ {likes}</Text>
        <Text style={styles.meta}>💬 {comments}</Text>
        <Text style={[styles.meta, styles.price]}>{seedCost} 🌱</Text>
      </View>
      <View style={styles.footerRow}>
        <Text style={[styles.meta, claimedByMe ? styles.claimed : null]}>
          {claimedByMe ? t('craft.card.claimed') : t('craft.card.unclaimed')}
        </Text>
        {onClaimPress && claimLabel ? (
          <Pressable
            onPress={onClaimPress}
            style={styles.claimChip}
            accessibilityRole="button"
            accessibilityLabel={claimLabel}
          >
            <Text style={styles.claimChipText}>{claimLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('craft.card.openPost', { title })}
      accessibilityHint={t('craft.card.openPostHint')}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  liked: {
    color: theme.colors.danger,
    fontWeight: '700',
  },
  claimed: {
    color: theme.colors.primaryDark,
    fontWeight: '700',
  },
  image: {
    width: '100%',
    aspectRatio: 1.4,
    borderRadius: theme.radius.md,
    backgroundColor: '#E5DFD1',
  },
  thumb: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#E5DFD1',
  },
  thumbFallback: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#EADCC6',
    borderWidth: 1,
    borderColor: '#CDBB9D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbSprite: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#EADCC6',
    borderWidth: 1,
    borderColor: '#CDBB9D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageSpriteWrap: {
    width: '100%',
    aspectRatio: 1.4,
    borderRadius: theme.radius.md,
    backgroundColor: '#EADCC6',
    borderWidth: 1,
    borderColor: '#CDBB9D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbFallbackText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7A5C37',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    flexShrink: 1,
  },
  meta: {
    color: theme.colors.muted,
    fontSize: 13,
  },
  description: {
    color: theme.colors.text,
    lineHeight: 20,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  compactHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    color: theme.colors.info,
    fontWeight: '700',
  },
  claimChip: {
    minWidth: 92,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFF4E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimChipText: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
});
