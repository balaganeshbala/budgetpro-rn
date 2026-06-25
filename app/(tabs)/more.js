import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CardView } from '../../src/components/common/CardView';
import { SectionHeader } from '../../src/components/common/SectionHeader';
import { SettingsRow } from '../../src/components/common/SettingsRow';
import { colors, spacing, typography } from '../../src/constants/theme';

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.groupedBackground }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        <SectionHeader title="Analysis" />
        <CardView padding={0}>
          <SettingsRow
            iconName="trending-up"
            iconColor="#007AFF"
            title="Monthly Trends"
            onPress={() => router.push('/monthly-trends')}
          />
          <View style={[styles.divider, { backgroundColor: themeColors.separator }]} />
          <SettingsRow
            iconName="bar-chart"
            iconColor="#AF52DE"
            title="Year-over-Year"
            onPress={() => router.push('/year-comparison')}
          />
        </CardView>

        <SectionHeader title="Tracking" style={{ marginTop: 20 }}/>
        <CardView padding={0}>
          <SettingsRow
            iconName="wallet"
            iconColor="#FF9500"
            title="Major Expenses"
            onPress={() => router.push('/major-expenses')}
          />
          <View style={[styles.divider, { backgroundColor: themeColors.separator }]} />
          <SettingsRow
            iconName="repeat"
            iconColor="#34C759"
            title="Recurring Expenses"
            onPress={() => router.push('/recurring-expenses')}
          />
        </CardView>

        <SectionHeader title="Planning" style={{ marginTop: 20 }}/>
        <CardView padding={0}>
          <SettingsRow
            iconName="trophy"
            iconColor="#FFD60A"
            title="Financial Goals"
            onPress={() => router.push('/financial-goals')}
          />
        </CardView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  sectionHeader: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  card: { overflow: 'hidden' },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.lg + 32 + spacing.md,
  },
});
