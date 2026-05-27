import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { CardView } from '../../src/components/common/CardView';
import { colors, spacing, typography } from '../../src/constants/theme';
import { supabase } from '../../src/services/supabase';

function SettingsRow({ iconName, iconColor, title, showChevron = true, onPress }) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '22' }]}>
        <Ionicons name={iconName} size={18} color={iconColor} />
      </View>
      <Text style={[styles.rowTitle, { color: themeColors.text }]}>{title}</Text>
      {showChevron && (
        <Ionicons name="chevron-forward" size={16} color={themeColors.secondaryText} />
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

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
        <CardView padding={0} style={styles.optionsCard}>
          <SettingsRow
            iconName="information-circle"
            iconColor="#007AFF"
            title="About BudgetPro"
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
  title: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.fonts.bold,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
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
  optionsCard: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.regular,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.lg + 32 + spacing.md,
  },
});
