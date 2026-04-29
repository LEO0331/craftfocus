import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CategoryPicker } from '@/components/CategoryPicker';
import { BUILD_TARGETS } from '@/constants/categories';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { createCraftPost } from '@/lib/crafts';
import { generateSurprisePixelArt, pixelizeImage } from '@/lib/pixelize';
import { storageAdapter } from '@/lib/storage';
import { sanitizeText } from '@/lib/validation';

const CATEGORIES = ['leather', 'sewing', 'craft', 'other'] as const;
const LISTING_TYPES = ['catalog', 'custom'] as const;
const STORAGE_BUCKET = 'craft-images';

export default function NewCraftPostScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('craft');
  const [listingType, setListingType] = useState<(typeof LISTING_TYPES)[number]>('catalog');
  const [rewardItemId, setRewardItemId] = useState(BUILD_TARGETS[0]?.id ?? 'plant');
  const [seedCost, setSeedCost] = useState('25');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [pixelPreviewUri, setPixelPreviewUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPixelizing, setIsPixelizing] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9, allowsEditing: true });
    if (result.canceled || !result.assets?.length) return;
    setImageUri(result.assets[0].uri);
    setPixelPreviewUri(null);
  };

  const handlePixelize = async () => {
    if (!imageUri) return;
    setIsPixelizing(true);
    try {
      setPixelPreviewUri(await pixelizeImage(imageUri));
    } catch (error) {
      Alert.alert(t('craft.new.genPixel'), error instanceof Error ? error.message : t('common.unknownError'));
    } finally {
      setIsPixelizing(false);
    }
  };

  const handleSurprisePixel = async () => {
    setIsPixelizing(true);
    try {
      setPixelPreviewUri(await generateSurprisePixelArt());
    } catch (error) {
      Alert.alert(t('craft.new.surprise'), error instanceof Error ? error.message : t('common.unknownError'));
    } finally {
      setIsPixelizing(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return Alert.alert(t('craft.new.notSignedIn'), t('craft.new.signInAgain'));
    if (!imageUri) return Alert.alert(t('craft.new.missingImage'), t('craft.new.pickImageFirst'));

    setIsSaving(true);
    try {
      const safeTitle = sanitizeText(title, 80);
      const safeDescription = description ? sanitizeText(description, 500) : '';
      const timestamp = Date.now();
      const imagePath = `${user.id}/${timestamp}-original.jpg`;
      const uploadedImageUrl = await storageAdapter.uploadImage({ bucket: STORAGE_BUCKET, path: imagePath, uri: imageUri });

      let pixelImageUrl: string | null = null;
      if (pixelPreviewUri) {
        const pixelPath = `${user.id}/${timestamp}-pixel.png`;
        pixelImageUrl = await storageAdapter.uploadImage({ bucket: STORAGE_BUCKET, path: pixelPath, uri: pixelPreviewUri });
      }

      const id = await createCraftPost({
        userId: user.id,
        title: safeTitle,
        description: safeDescription,
        category,
        imageUrl: uploadedImageUrl,
        pixelImageUrl,
        listingCategory: category,
        seedCost: Math.max(1, Number(seedCost) || 1),
        listingType,
        rewardItemId: listingType === 'catalog' ? rewardItemId : null,
      });

      router.replace(`/crafts/${id}`);
    } catch (error) {
      Alert.alert(t('craft.new.publish'), error instanceof Error ? error.message : t('common.unknownError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{t('craft.new.title')}</Text>
      <Card>
        <TextInput placeholder={t('craft.new.fieldTitle')} value={title} onChangeText={setTitle} style={styles.input} />
        <TextInput placeholder={t('craft.new.fieldDescription')} value={description} onChangeText={setDescription} style={[styles.input, styles.textarea]} multiline />

        <CategoryPicker label={t('craft.new.category')} options={[...CATEGORIES]} selected={category} onSelect={setCategory} />
        <CategoryPicker label={t('craft.new.listingType')} options={[...LISTING_TYPES]} selected={listingType} onSelect={(value) => setListingType(value as 'catalog' | 'custom')} />

        {listingType === 'catalog' ? (
          <CategoryPicker
            label={t('craft.new.rewardItem')}
            options={BUILD_TARGETS.map((item) => item.id)}
            selected={rewardItemId}
            onSelect={(value) => setRewardItemId(value)}
            renderLabel={(id) => BUILD_TARGETS.find((target) => target.id === id)?.label ?? id}
          />
        ) : null}

        <TextInput placeholder={t('craft.new.seedCost')} keyboardType="number-pad" value={seedCost} onChangeText={setSeedCost} style={styles.input} />

        <Button label={imageUri ? t('craft.new.changeImage') : t('craft.new.pickImage')} onPress={pickImage} />
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : null}

        <Button label={isPixelizing ? t('craft.new.genPixeling') : t('craft.new.genPixel')} onPress={handlePixelize} disabled={!imageUri || isPixelizing} variant="secondary" />
        <Button label={isPixelizing ? t('craft.new.surprising') : t('craft.new.surprise')} onPress={handleSurprisePixel} disabled={isPixelizing} variant="secondary" />

        {pixelPreviewUri ? <Image source={{ uri: pixelPreviewUri }} style={styles.preview} /> : null}

        <Button label={isSaving ? t('craft.new.publishSaving') : t('craft.new.publish')} onPress={handleSave} disabled={isSaving} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md, maxWidth: 960, width: '100%', alignSelf: 'center' },
  heading: { fontSize: 24, fontWeight: '800', color: theme.colors.text },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  preview: { width: '100%', aspectRatio: 1.2, borderRadius: theme.radius.md, backgroundColor: '#E5DFD1' },
});
