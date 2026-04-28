import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Switch, Text, TextInput } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CategoryPicker } from '@/components/CategoryPicker';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { createCraftPost } from '@/lib/crafts';
import { pixelizeImage } from '@/lib/pixelize';
import { storageAdapter } from '@/lib/storage';
import { sanitizeText } from '@/lib/validation';

const CATEGORIES = ['leather', 'sewing', 'craft', 'other'] as const;
const STORAGE_BUCKET = 'craft-images';

export default function NewCraftPostScreen() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('craft');
  const [openToExchange, setOpenToExchange] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [pixelPreviewUri, setPixelPreviewUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPixelizing, setIsPixelizing] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: true,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    setImageUri(result.assets[0].uri);
    setPixelPreviewUri(null);
  };

  const handlePixelize = async () => {
    if (!imageUri) {
      return;
    }

    setIsPixelizing(true);
    try {
      const pixelUri = await pixelizeImage(imageUri);
      setPixelPreviewUri(pixelUri);
    } catch (error) {
      Alert.alert('Pixel preview failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsPixelizing(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert('Not signed in', 'Please sign in again.');
      return;
    }
    if (!imageUri) {
      Alert.alert('Missing image', 'Please pick an image before posting.');
      return;
    }

    setIsSaving(true);
    try {
      const safeTitle = sanitizeText(title, 80);
      const safeDescription = description ? sanitizeText(description, 500) : '';
      const timestamp = Date.now();
      const imagePath = `${user.id}/${timestamp}-original.jpg`;
      const uploadedImageUrl = await storageAdapter.uploadImage({
        bucket: STORAGE_BUCKET,
        path: imagePath,
        uri: imageUri,
      });

      let pixelImageUrl: string | null = null;
      if (pixelPreviewUri?.startsWith('data:image')) {
        pixelImageUrl = pixelPreviewUri;
      } else if (pixelPreviewUri) {
        const pixelPath = `${user.id}/${timestamp}-pixel.png`;
        pixelImageUrl = await storageAdapter.uploadImage({
          bucket: STORAGE_BUCKET,
          path: pixelPath,
          uri: pixelPreviewUri,
        });
      }

      const id = await createCraftPost({
        userId: user.id,
        title: safeTitle,
        description: safeDescription,
        category,
        imageUrl: uploadedImageUrl,
        pixelImageUrl,
        openToExchange,
      });

      router.replace(`/crafts/${id}`);
    } catch (error) {
      Alert.alert(
        'Failed to create post',
        error instanceof Error
          ? `${error.message}\n\nTip: create a public storage bucket named "${STORAGE_BUCKET}" in Supabase.`
          : 'Unknown error'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Upload Craft Work</Text>

      <Card>
        <TextInput placeholder="Title" value={title} onChangeText={setTitle} style={styles.input} />
        <TextInput
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.textarea]}
          multiline
        />

        <CategoryPicker label="Category" options={[...CATEGORIES]} selected={category} onSelect={setCategory} />

        <Button label={imageUri ? 'Change Image' : 'Pick Image'} onPress={pickImage} />

        {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : null}

        <Button
          label={isPixelizing ? 'Generating Pixel Preview...' : 'Generate Pixel Preview (Experimental)'}
          onPress={handlePixelize}
          disabled={!imageUri || isPixelizing}
          variant="secondary"
        />

        {pixelPreviewUri ? <Image source={{ uri: pixelPreviewUri }} style={styles.preview} /> : null}

        <Text style={styles.label}>Open to exchange</Text>
        <Switch value={openToExchange} onValueChange={setOpenToExchange} />

        <Button label={isSaving ? 'Saving...' : 'Publish Craft Post'} onPress={handleSave} disabled={isSaving} />
      </Card>
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
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  label: {
    color: theme.colors.muted,
    fontWeight: '600',
  },
  preview: {
    width: '100%',
    aspectRatio: 1.2,
    borderRadius: theme.radius.md,
    backgroundColor: '#E5DFD1',
  },
});
