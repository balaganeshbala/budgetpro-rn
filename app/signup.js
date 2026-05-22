import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../src/components/common/AppButton';
import { AppTextField } from '../src/components/common/AppTextField';
import { colors, spacing, typography } from '../src/constants/theme';
import { supabase } from '../src/services/supabase';

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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isFormValid =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    password === confirmPassword;

  async function handleSignUp() {
    if (!isFormValid) return;
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
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
      setSuccess('Account created! Check your email to confirm.');
    }
    setIsLoading(false);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets={true}>

          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.primary }]}>Create Account</Text>
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
            {success ? (
              <Text style={[styles.message, { color: themeColors.success }]}>{success}</Text>
            ) : null}

            <AppButton
              title="Sign Up"
              onPress={handleSignUp}
              isEnabled={isFormValid && !isLoading}
              isLoading={isLoading}
            />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing.lg, justifyContent: 'top' },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontFamily: 'Manrope-Bold', marginBottom: spacing.xs },
  subtitle: { fontSize: typography.sizes.md, fontFamily: 'Manrope-Regular' },
  form: { gap: spacing.md },
  showHide: { fontSize: typography.sizes.sm, fontFamily: 'Manrope-Medium' },
  message: { fontSize: typography.sizes.sm, fontFamily: 'Manrope-Regular', textAlign: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { fontSize: typography.sizes.md, fontFamily: 'Manrope-Regular' },
  footerLink: { fontSize: typography.sizes.md, fontFamily: 'Manrope-SemiBold' },
});
