import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CardView } from '../src/components/common/CardView';
import { SettingsRow } from '../src/components/common/SettingsRow';
import { colors, spacing, typography } from '../src/constants/theme';
import { supabase } from '../src/services/supabase';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];
  const router = useRouter();
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  }, []);

  const userName = session?.user?.user_metadata?.full_name
    ?? session?.user?.email?.split('@')[0]
    ?? 'User';
  const userEmail = session?.user?.email ?? '';

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/login');
        },
      },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.groupedBackground }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">
        {/* User Info */}
        <CardView padding={24}>
          <View style={styles.avatarRow}>
            <View style={[styles.avatar, { backgroundColor: themeColors.primary + '22' }]}>
              <Ionicons name="person" size={40} color={themeColors.primary} />
            </View>
            <Text style={[styles.userName, { color: themeColors.text }]}>{userName}</Text>
            <Text style={[styles.userEmail, { color: themeColors.secondaryText }]}>{userEmail}</Text>
          </View>
        </CardView>

        {/* Options */}
        <CardView padding={0}>
          <SettingsRow
            iconName="cog"
            iconColor="#929292"
            title="Settings"
            onPress={() => router.push('/settings')}
          />
          <View style={[styles.divider, { backgroundColor: themeColors.separator }]} />
          <SettingsRow
            iconName="information-circle"
            iconColor="#007AFF"
            title="About Budget Pro"
            onPress={() => router.push('/about')}
          />
          <View style={[styles.divider, { backgroundColor: themeColors.separator }]} />
          <SettingsRow
            iconName="log-out"
            iconColor="#FF3B30"
            title="Sign Out"
            showChevron={false}
            onPress={handleSignOut}
          />
        </CardView>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenTitle: {
    fontSize: typography.sizes.xxxl,
    fontFamily: typography.fonts.bold,
    marginBottom: spacing.sm,
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  avatarRow: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  userName: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.semibold,
  },
  userEmail: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.lg + 32 + spacing.md,
  },
});
