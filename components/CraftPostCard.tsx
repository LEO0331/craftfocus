import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { theme } from '@/constants/theme';

interface CraftPostCardProps {
  authorName?: string;
  title: string;
  category: string;
  description?: string;
  imageUrl?: string;
  pixelImageUrl?: string;
  likes?: number;
  comments?: number;
  openToExchange?: boolean;
  onPress?: () => void;
  likedByMe?: boolean;
}

export function CraftPostCard({
  authorName,
  title,
  category,
  description,
  imageUrl,
  pixelImageUrl,
  likes = 0,
  comments = 0,
  openToExchange = false,
  onPress,
  likedByMe = false,
}: CraftPostCardProps) {
  const content = (
    <Card>
      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} accessibilityLabel="Craft post image" /> : null}
      {pixelImageUrl ? (
        <View style={styles.pixelWrap}>
          <Text style={styles.pixelLabel}>Pixel Preview</Text>
          <Image source={{ uri: pixelImageUrl }} style={styles.image} accessibilityLabel="Pixel-art preview of craft post" />
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.meta}>
        by {authorName ?? 'Unknown'} · {category}
      </Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      <View style={styles.row}>
        <Text style={[styles.meta, likedByMe ? styles.liked : null]}>♥ {likes}</Text>
        <Text style={styles.meta}>💬 {comments}</Text>
        <Text style={[styles.meta, openToExchange ? styles.exchange : null]}>
          {openToExchange ? 'Exchange open' : 'Closed'}
        </Text>
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
        accessibilityLabel={`Open craft post: ${title}`}
        accessibilityHint="Opens the craft post detail page"
      >
        {content}
      </Pressable>
    );
  }

const styles = StyleSheet.create({
  pixelWrap: {
    gap: 6,
  },
  pixelLabel: {
    color: theme.colors.muted,
    fontWeight: '600',
    fontSize: 12,
  },
  liked: {
    color: theme.colors.danger,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exchange: {
    color: theme.colors.info,
    fontWeight: '700',
  },
});
