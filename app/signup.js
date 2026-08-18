import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../src/components/common/AppButton';
import { AppTextField } from '../src/components/common/AppTextField';
import { colors, radius, spacing, typography } from '../src/constants/theme';
import { supabase } from '../src/services/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const isFormValid =
    fullName.trim().length > 0 &&
    isEmailValid &&
    password.length >= 6 &&
    password === confirmPassword;

  async function handleSignUp() {
    if (!isFormValid) return;
    setIsLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    if (error) {
      setError(error.message);
    } else {
      setEmailSent(true);
    }
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

  async function handleResend() {
    setResendLoading(true);
    setResendMessage('');
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
    setResendMessage(error ? error.message : 'Confirmation email resent!');
    setResendLoading(false);
  }

  if (emailSent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.confirmContainer}>
          <View style={[styles.confirmIcon, { backgroundColor: themeColors.primary + '22' }]}>
            <Ionicons name="mail-unread-outline" size={48} color={themeColors.primary} />
          </View>
          <Text style={[styles.title, { color: themeColors.secondary }]}>Check your email</Text>
          <Text style={[styles.confirmText, { color: themeColors.secondaryText }]}>
            We sent a confirmation link to{'\n'}
            <Text style={{ color: themeColors.text, fontFamily: 'Manrope-SemiBold' }}>{email.trim()}</Text>
            {'\n\n'}Click the link to activate your account.
          </Text>

          {resendMessage ? (
            <Text style={[styles.message, { color: resendMessage.includes('resent') ? themeColors.success : themeColors.error }]}>
              {resendMessage}
            </Text>
          ) : null}

          <TouchableOpacity onPress={handleResend} disabled={resendLoading} style={styles.resendRow}>
            <Text style={[styles.footerText, { color: themeColors.secondaryText }]}>
              {resendLoading ? 'Sending…' : "Didn't receive it?"}
            </Text>
            {!resendLoading && (
              <Text style={[styles.footerLink, { color: themeColors.primary }]}> Resend</Text>
            )}
          </TouchableOpacity>

          <AppButton title="Back to Sign In" onPress={() => router.replace('/login')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.groupedBackground }]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" enabled={Platform.OS !== 'ios'}>
        <ScrollView contentContainerStyle={[styles.scroll, Platform.OS === 'android' && { paddingBottom: 100 }]} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets bounces={false} overScrollMode="never">

          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.secondary }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: themeColors.secondaryText }]}>Sign up to get started</Text>
          </View>

          <View style={styles.form}>
            <AppTextField
              hint="Full Name"
              iconName="person-outline"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              returnKeyType="next"
            />

            <AppTextField
              hint="Email"
              iconName="mail-outline"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
            {email.length > 0 && !isEmailValid ? (
              <Text style={[styles.fieldError, { color: themeColors.error }]}>Enter a valid email address</Text>
            ) : null}

            <AppTextField
              hint="Password"
              iconName="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              isSecure={!showPassword}
              returnKeyType="next"
              trailingContent={() => (
                <TouchableOpacity onPress={() => setShowPassword(p => !p)}>
                  <Ionicons name={ showPassword ? 'eye-off' : 'eye' } size={22} color={ themeColors.secondaryText } />
                </TouchableOpacity>
              )}
            />

            <AppTextField
              hint="Confirm Password"
              iconName="lock-closed-outline"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isSecure={!showConfirmPassword}
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
              trailingContent={() => (
                <TouchableOpacity onPress={() => setShowConfirmPassword(p => !p)}>
                  <Ionicons name={ showConfirmPassword ? 'eye-off' : 'eye' } size={22} color={ themeColors.secondaryText } />
                </TouchableOpacity>
              )}
            />

            {error ? (
              <Text style={[styles.message, { color: themeColors.error }]}>{error}</Text>
            ) : null}

            <AppButton
              title="Sign Up"
              onPress={handleSignUp}
              isEnabled={isFormValid && !isLoading}
              isLoading={isLoading}
            />

            {/* OR divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: themeColors.separator }]} />
              <Text style={[styles.dividerText, { color: themeColors.secondaryText }]}>OR</Text>
              <View style={[styles.dividerLine, { backgroundColor: themeColors.separator }]} />
            </View>

            {/* Google Sign Up */}
            <TouchableOpacity
              style={[styles.googleButton, { borderColor: themeColors.separator, backgroundColor: themeColors.background }]}
              onPress={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              activeOpacity={0.7}
            >
              <Image
                source={require('../src/assets/images/google-logo.png')}
                contentFit="contain"
                style={styles.image}
              />
              <Text style={[styles.googleButtonText, { color: themeColors.text }]}>
                {isGoogleLoading ? 'Signing in…' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: themeColors.secondaryText }]}>
              Already have an account?
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={[styles.footerLink, { color: themeColors.primary }]}> Sign In</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
        </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing.lg, justifyContent: 'top', paddingBottom: 20 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontFamily: 'Manrope-Bold', marginBottom: spacing.xs },
  subtitle: { fontSize: typography.sizes.md, fontFamily: 'Manrope-Regular' },
  form: { gap: spacing.md },
  showHide: { fontSize: typography.sizes.sm, fontFamily: 'Manrope-Medium' },
  message: { fontSize: typography.sizes.sm, fontFamily: 'Manrope-Regular', textAlign: 'center' },
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
  fieldError: { fontSize: typography.sizes.sm, fontFamily: 'Manrope-Regular', marginTop: -spacing.xs },
  confirmContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.lg },
  confirmIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  confirmText: { fontSize: typography.sizes.md, fontFamily: 'Manrope-Regular', textAlign: 'center', lineHeight: 24 },
  resendRow: { flexDirection: 'row', alignItems: 'center' },
});
