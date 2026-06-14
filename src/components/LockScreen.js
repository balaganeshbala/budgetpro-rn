import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect } from 'react';
import { AppState, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../constants/theme';

export function LockScreen({ onUnlock, requireAuth }) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];

  useEffect(() => {
    if (!requireAuth) return;
    if (AppState.currentState === 'active') authenticate();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') authenticate();
    });
    return () => sub.remove();
  }, [requireAuth]);

  async function authenticate() {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Budget Pro',
      disableDeviceFallback: false,
    });
    if (result.success) onUnlock();
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: themeColors.primary + '18' }]}>
          <Ionicons name="lock-closed" size={40} color={themeColors.primary} />
        </View>
        <Text style={[styles.title, { color: themeColors.text }]}>Budget Pro is Locked</Text>
        <Text style={[styles.subtitle, { color: themeColors.secondaryText }]}>Authenticate to continue</Text>
        {requireAuth && (
          <TouchableOpacity
            style={[styles.unlockBtn, { backgroundColor: themeColors.primary }]}
            onPress={authenticate}
            activeOpacity={0.8}
          >
            <Ionicons name="finger-print" size={20} color="#fff" />
            <Text style={styles.unlockBtnText}>Unlock</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.fonts.bold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.regular,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.pill,
    marginTop: spacing.md,
  },
  unlockBtnText: {
    color: '#fff',
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.semibold,
  },
});
