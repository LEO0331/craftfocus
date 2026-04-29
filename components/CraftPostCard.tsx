import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { AsciiPet } from '@/components/AsciiPet';
import { Card } from '@/components/Card';
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
  likes?: number;
  comments?: number;
  seedCost?: number;
  claimedByMe?: boolean;
  onPress?: () => void;
  likedByMe?: boolean;
}

export function CraftPostCard({
  authorName,
  authorAnimalId = 'cat',
  title,
  description,
  imageUrl,
  pixelImageUrl,
  likes = 0,
  comments = 0,
  seedCost = 0,
  claimedByMe = false,
  onPress,
  likedByMe = false,
}: CraftPostCardProps) {
  const { t } = useI18n();
  const displayImageUrl = pixelImageUrl ?? imageUrl;

  const content = (
    <Card>
      {displayImageUrl ? <Image source={{ uri: displayImageUrl }} style={styles.image} accessibilityLabel={t('craft.card.image')} /> : null}
      <Text style={styles.title}>{title}</Text>
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
      <Text style={[styles.meta, claimedByMe ? styles.claimed : null]}>
        {claimedByMe ? t('craft.card.claimed') : t('craft.card.unclaimed')}
      </Text>
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
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
  price: {
    color: theme.colors.info,
    fontWeight: '700',
  },
});
