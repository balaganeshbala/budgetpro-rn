import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../src/components/common/AppButton';
import { AppTextField } from '../src/components/common/AppTextField';
import { colors, spacing, typography } from '../src/constants/theme';
import { supabase } from '../src/services/supabase';

export default function LoginScreen() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isFormValid = email.trim().length > 0 && password.length > 0;

  async function handleSignIn() {
    if (!isFormValid) return;
    setIsLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setError(error.message);
    setIsLoading(false);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.primary }]}>Welcome Back!</Text>
            <Text style={[styles.subtitle, { color: themeColors.secondaryText }]}>Sign in to continue</Text>
          </View>

          <View style={styles.form}>
            <AppTextField
              hint="Email"
              iconName="mail-outline"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />

            <AppTextField
              hint="Password"
              iconName="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              isSecure={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
              trailingContent={() => (
                <TouchableOpacity onPress={() => setShowPassword(p => !p)}>
                  <Text style={[styles.showHide, { color: themeColors.secondaryText }]}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              )}
            />

            {error ? (
              <Text style={[styles.error, { color: themeColors.error }]}>{error}</Text>
            ) : null}

            <AppButton
              title="Sign In"
              onPress={handleSignIn}
              isEnabled={isFormValid && !isLoading}
              isLoading={isLoading}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: themeColors.secondaryText }]}>
              Don't have an account?
            </Text>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={[styles.footerLink, { color: themeColors.primary }]}> Sign Up</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 48 },
  title: { fontSize: 32, fontFamily: 'Manrope-Bold', marginBottom: spacing.xs },
  subtitle: { fontSize: typography.sizes.md, fontFamily: 'Manrope-Regular' },
  form: { gap: spacing.md },
  showHide: { fontSize: typography.sizes.sm, fontFamily: 'Manrope-Medium' },
  error: { fontSize: typography.sizes.sm, fontFamily: 'Manrope-Regular', textAlign: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { fontSize: typography.sizes.md, fontFamily: 'Manrope-Regular' },
  footerLink: { fontSize: typography.sizes.md, fontFamily: 'Manrope-SemiBold' },
});
