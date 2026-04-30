import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { createCraftPost } from '@/lib/crafts';
import { convertImageToPixelSprite, pixelizeImage, type PixelGridSpriteData } from '@/lib/pixelize';
import { ensureProfileRow } from '@/lib/profiles';
import { storageAdapter } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { sanitizeText } from '@/lib/validation';

const STORAGE_BUCKET = 'craft-images';
const TITLE_MAX = 20;
const DESCRIPTION_MAX = 60;
const SEED_MIN = 1;
const SEED_MAX = 100;
type FieldKey = 'title' | 'description' | 'seedCost' | 'image';
type FieldErrors = Partial<Record<FieldKey, string>>;

export default function NewCraftPostScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [seedCost, setSeedCost] = useState('25');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [pixelPreviewUri, setPixelPreviewUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPixelizing, setIsPixelizing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pixelSpriteData, setPixelSpriteData] = useState<PixelGridSpriteData | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9, allowsEditing: true });
    if (result.canceled || !result.assets?.length) return;
    setImageUri(result.assets[0].uri);
    setPixelPreviewUri(null);
    setPixelSpriteData(null);
    setFieldErrors((prev) => ({ ...prev, image: undefined }));
  };

  const handlePixelize = async () => {
    if (!imageUri) return;
    setIsPixelizing(true);
    try {
      const nextPixelPreviewUri = await pixelizeImage(imageUri);
      setPixelPreviewUri(nextPixelPreviewUri);
      setPixelSpriteData(await convertImageToPixelSprite(nextPixelPreviewUri));
    } catch (error) {
      Alert.alert(t('craft.new.genPixel'), error instanceof Error ? error.message : t('common.unknownError'));
    } finally {
      setIsPixelizing(false);
    }
  };

  const validateForm = (): { valid: boolean; parsedSeedCost: number } => {
    const nextErrors: FieldErrors = {};

    if (!title.trim()) nextErrors.title = t('craft.new.titleRequired');
    if (!description.trim()) nextErrors.description = t('craft.new.descriptionRequired');
    if (!imageUri) nextErrors.image = t('craft.new.pickImageFirst');
    if (!seedCost.trim()) {
      nextErrors.seedCost = t('craft.new.seedCostRequired');
    }

    const parsedSeedCost = Number(seedCost);
    if (!Number.isFinite(parsedSeedCost) || parsedSeedCost < SEED_MIN || parsedSeedCost > SEED_MAX) {
      nextErrors.seedCost = t('craft.new.seedCostRequired');
    }

    setFieldErrors(nextErrors);
    return { valid: Object.keys(nextErrors).length === 0, parsedSeedCost };
  };

  const handleSave = async () => {
    if (!user?.id) return Alert.alert(t('craft.new.notSignedIn'), t('craft.new.signInAgain'));
    const validation = validateForm();
    if (!validation.valid) {
      setSaveError(t('craft.new.publishFailed'));
      return;
    }
    const parsedSeedCost = validation.parsedSeedCost;
    const imageUriToUpload = imageUri;
    if (!imageUriToUpload) {
      setFieldErrors((prev) => ({ ...prev, image: t('craft.new.pickImageFirst') }));
      return;
    }

    setIsSaving(true);
    try {
      setSaveError(null);
      await ensureProfileRow(user.id, user.email);

      const startOfUtcDay = new Date();
      startOfUtcDay.setUTCHours(0, 0, 0, 0);
      const endOfUtcDay = new Date(startOfUtcDay);
      endOfUtcDay.setUTCDate(endOfUtcDay.getUTCDate() + 1);
      const { count: todayCraftCount, error: countError } = await supabase
        .from('craft_posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfUtcDay.toISOString())
        .lt('created_at', endOfUtcDay.toISOString());
      if (countError) throw countError;
      if ((todayCraftCount ?? 0) >= 10) {
        throw new Error(t('craft.new.dailyLimitReached'));
      }

      const safeTitle = sanitizeText(title, TITLE_MAX);
      const safeDescription = description ? sanitizeText(description, DESCRIPTION_MAX) : '';
      const timestamp = Date.now();
      const imagePath = `${user.id}/${timestamp}-original.jpg`;
      const uploadedImageUrl = await storageAdapter.uploadImage({ bucket: STORAGE_BUCKET, path: imagePath, uri: imageUriToUpload });

      let pixelImageUrl: string | null = null;
      if (pixelPreviewUri) {
        try {
          const pixelPath = `${user.id}/${timestamp}-pixel.png`;
          pixelImageUrl = await storageAdapter.uploadImage({ bucket: STORAGE_BUCKET, path: pixelPath, uri: pixelPreviewUri });
        } catch {
          pixelImageUrl = null;
        }
      }

      const spriteData = pixelSpriteData ?? (await convertImageToPixelSprite(pixelPreviewUri ?? imageUriToUpload));

      const id = await createCraftPost({
        userId: user.id,
        title: safeTitle,
        description: safeDescription,
        category: 'craft',
        imageUrl: uploadedImageUrl,
        pixelImageUrl,
        pixelPalette: spriteData?.palette ?? null,
        pixelGrid: spriteData?.grid ?? null,
        listingCategory: 'custom',
        seedCost: Math.min(SEED_MAX, Math.max(SEED_MIN, Math.floor(parsedSeedCost))),
        listingType: 'custom',
        rewardItemId: null,
      });

      if (!id) {
        throw new Error(t('craft.new.publishFailed'));
      }
      router.push(`/crafts/${id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('common.unknownError');
      setSaveError(message);
      Alert.alert(t('craft.new.publish'), message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{t('craft.new.title')}</Text>
      <Card>
        <TextInput
          placeholder={t('craft.new.fieldTitle')}
          value={title}
          onChangeText={(value) => {
            setTitle(value);
            if (fieldErrors.title) setFieldErrors((prev) => ({ ...prev, title: undefined }));
          }}
          maxLength={TITLE_MAX}
          style={[styles.input, fieldErrors.title ? styles.inputError : null]}
          accessibilityLabel={t('craft.new.fieldTitle')}
        />
        {fieldErrors.title ? <Text style={styles.errorText}>{fieldErrors.title}</Text> : null}
        <Text style={styles.helperText}>
          {t('craft.new.titleLimitHint', { count: title.length, max: TITLE_MAX })}
        </Text>
        <TextInput
          placeholder={t('craft.new.fieldDescription')}
          value={description}
          onChangeText={(value) => {
            setDescription(value);
            if (fieldErrors.description) setFieldErrors((prev) => ({ ...prev, description: undefined }));
          }}
          maxLength={DESCRIPTION_MAX}
          style={[styles.input, styles.textarea, fieldErrors.description ? styles.inputError : null]}
          multiline
          accessibilityLabel={t('craft.new.fieldDescription')}
        />
        {fieldErrors.description ? <Text style={styles.errorText}>{fieldErrors.description}</Text> : null}
        <Text style={styles.helperText}>
          {t('craft.new.descriptionLimitHint', { count: description.length, max: DESCRIPTION_MAX })}
        </Text>
        <TextInput
          placeholder={t('craft.new.seedCost')}
          keyboardType="number-pad"
          value={seedCost}
          onChangeText={(value) => {
            setSeedCost(value);
            if (fieldErrors.seedCost) setFieldErrors((prev) => ({ ...prev, seedCost: undefined }));
          }}
          style={[styles.input, fieldErrors.seedCost ? styles.inputError : null]}
          accessibilityLabel={t('craft.new.seedCost')}
        />
        {fieldErrors.seedCost ? <Text style={styles.errorText}>{fieldErrors.seedCost}</Text> : null}
        <Text style={styles.helperText}>{t('craft.new.seedCostLimitHint', { min: SEED_MIN, max: SEED_MAX })}</Text>

        <Button label={imageUri ? t('craft.new.changeImage') : t('craft.new.pickImage')} onPress={pickImage} />
        {fieldErrors.image ? <Text style={styles.errorText}>{fieldErrors.image}</Text> : null}
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} accessibilityLabel={t('craft.new.originalImage')} /> : null}

        <Button label={isPixelizing ? t('craft.new.genPixeling') : t('craft.new.genPixel')} onPress={handlePixelize} disabled={!imageUri || isPixelizing} variant="secondary" />

        {pixelPreviewUri ? <Image source={{ uri: pixelPreviewUri }} style={styles.preview} accessibilityLabel={t('craft.new.pixelPreview')} /> : null}

        <Button label={isSaving ? t('craft.new.publishSaving') : t('craft.new.publish')} onPress={handleSave} disabled={isSaving} />
        {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
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
  inputError: {
    borderColor: theme.colors.danger,
    borderWidth: 2,
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  preview: { width: '100%', aspectRatio: 1.2, borderRadius: theme.radius.md, backgroundColor: '#E5DFD1' },
  helperText: { color: theme.colors.muted, fontSize: 12, fontWeight: '600' },
  errorText: { color: theme.colors.danger, fontWeight: '700' },
});
