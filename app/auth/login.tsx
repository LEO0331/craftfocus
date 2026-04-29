import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { validateEmail, validatePassword } from '@/lib/validation';

export default function LoginScreen() {
  const { signIn, isLoading } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setSubmitting(true);
      setAuthError(null);
      await signIn(validateEmail(email), validatePassword(password));
      router.replace('/(tabs)/home');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('auth.retry');
      setAuthError(message);
      Alert.alert(t('auth.loginFailed'), message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined, default: undefined })} style={styles.container}>
      <View style={styles.content}>
        <Card>
          <Text style={styles.title}>{t('auth.appTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>

          <TextInput
            placeholder={t('auth.email')}
            value={email}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={setEmail}
            style={styles.input}
            accessibilityLabel={t('auth.email')}
            textContentType="emailAddress"
            autoComplete="email"
          />
          <TextInput
            placeholder={t('auth.password')}
            value={password}
            secureTextEntry
            onChangeText={setPassword}
            style={styles.input}
            accessibilityLabel={t('auth.password')}
            textContentType="password"
            autoComplete="password"
          />

          <Button label={t('auth.login')} onPress={handleLogin} disabled={submitting || isLoading} />
          {authError ? (
            <Text accessibilityRole="alert" style={styles.errorText}>
              {authError}
            </Text>
          ) : null}

          <Text style={styles.footnote}>
            {t('auth.newHere')} <Link href="/auth/signup">{t('auth.createAccount')}</Link>
          </Text>
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1, justifyContent: 'center', padding: theme.spacing.lg, maxWidth: 520, width: '100%', alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: theme.colors.text },
  subtitle: { color: theme.colors.muted, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  footnote: { color: theme.colors.muted },
  errorText: { color: theme.colors.danger, fontWeight: '600' },
});
