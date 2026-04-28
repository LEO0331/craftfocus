import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { validateEmail, validatePassword } from '@/lib/validation';

export default function SignupScreen() {
  const { signUp, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSignup = async () => {
    try {
      setSubmitting(true);
      await signUp(validateEmail(email), validatePassword(password));
      Alert.alert('Check your email', 'Confirm your email, then log in.');
      router.replace('/auth/login');
    } catch (error) {
      Alert.alert('Signup failed', error instanceof Error ? error.message : 'Please try again.');
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
          <Text style={styles.title}>Create Account</Text>

          <TextInput
            placeholder="Email"
            value={email}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={setEmail}
            style={styles.input}
          />
          <TextInput
            placeholder="Password"
            value={password}
            secureTextEntry
            onChangeText={setPassword}
            style={styles.input}
          />

          <Button label="Sign Up" onPress={handleSignup} disabled={submitting || isLoading} />

          <Text style={styles.footnote}>
            Already registered? <Link href="/auth/login">Log in</Link>
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
