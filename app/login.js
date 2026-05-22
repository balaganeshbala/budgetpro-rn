import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../src/components/common/AppButton';
import { AppTextField } from '../src/components/common/AppTextField';
import { colors, radius, spacing, typography } from '../src/constants/theme';
import { supabase } from '../src/services/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    setError('');
    try {
      const redirectUrl = 'budgetprorn://login-callback';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
      });
      if (error) { setError(error.message); return; }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      if (result.type === 'success' && result.url) {
        // Strip fragment (#) before parsing — Supabase appends a trailing # that corrupts the code value
        const urlWithoutFragment = result.url.split('#')[0];
        const code = urlWithoutFragment.split('?')[1]
          ? new URLSearchParams(urlWithoutFragment.split('?')[1]).get('code')
          : null;
        if (code) {
          const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
          if (sessionError) setError(sessionError.message);
        } else {
          setError('No authorization code returned.');
        }
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets={true}>

        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.secondary }]}>Welcome Back!</Text>
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
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color={themeColors.secondaryText} />
              </TouchableOpacity>
            )}
          />

          {error ? (
            <Text style={[styles.error, { color: themeColors.error }]}>{error}</Text>
          ) : null}

          <AppButton
            title="Sign In"
            onPress={handleSignIn}
            isEnabled={isFormValid && !isLoading && !isGoogleLoading}
            isLoading={isLoading}
          />

          {/* OR divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: themeColors.separator }]} />
            <Text style={[styles.dividerText, { color: themeColors.secondaryText }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: themeColors.separator }]} />
          </View>

          {/* Google Sign In */}
          <TouchableOpacity
            style={[styles.googleButton, { borderColor: themeColors.separator, backgroundColor: themeColors.background }]}
            onPress={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            activeOpacity={0.7}
          >
            <Image
              source={require('../src/assets/images/google-logo.png')} 
              contentFit="contain" // Controls how it scales
              style={styles.image}
            />
            <Text style={[styles.googleButtonText, { color: themeColors.text }]}>
              {isGoogleLoading ? 'Signing in…' : 'Sign in with Google'}
            </Text>
          </TouchableOpacity>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing.lg, justifyContent: 'top', marginTop: 60 },
  header: { alignItems: 'center', marginBottom: 48 },
  title: { fontSize: 32, fontFamily: 'Manrope-Bold', marginBottom: spacing.xs },
  subtitle: { fontSize: typography.sizes.md, fontFamily: 'Manrope-Regular' },
  form: { gap: spacing.md },
  error: { fontSize: typography.sizes.sm, fontFamily: 'Manrope-Regular', textAlign: 'center' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontSize: typography.sizes.sm, fontFamily: 'Manrope-Medium' },
  image: {
    width: 20,
    height: 20,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  googleButtonText: { fontSize: typography.sizes.md, fontFamily: 'Manrope-SemiBold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { fontSize: typography.sizes.md, fontFamily: 'Manrope-Regular' },
  footerLink: { fontSize: typography.sizes.md, fontFamily: 'Manrope-SemiBold' },
});
