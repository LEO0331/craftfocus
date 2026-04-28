import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { validateEmail, validatePassword } from '@/lib/validation';

export default function LoginScreen() {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    try {
      setSubmitting(true);
      await signIn(validateEmail(email), validatePassword(password));
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Login failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined, default: undefined })}
      style={styles.container}
    >
      <View style={styles.content}>
        <Card>
          <Text style={styles.title}>CraftFocus</Text>
          <Text style={styles.subtitle}>Focus, build, and share your craft journey.</Text>

          <TextInput
            placeholder="Email"
            value={email}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={setEmail}
            style={styles.input}
            accessibilityLabel="Email address"
            accessibilityHint="Enter your account email"
            textContentType="emailAddress"
            autoComplete="email"
          />
          <TextInput
            placeholder="Password"
            value={password}
            secureTextEntry
            onChangeText={setPassword}
            style={styles.input}
            accessibilityLabel="Password"
            accessibilityHint="Enter your account password"
            textContentType="password"
            autoComplete="password"
          />

          <Button label="Log In" onPress={handleLogin} disabled={submitting || isLoading} />

          <Text style={styles.footnote}>
            New here? <Link href="/auth/signup">Create account</Link>
          </Text>
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
  },
  subtitle: {
    color: theme.colors.muted,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  footnote: {
    color: theme.colors.muted,
  },
});
