import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Image, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CardView } from '../src/components/common/CardView';
import { colors, spacing, typography } from '../src/constants/theme';

const FEATURES = [
  {
    icon: 'pie-chart',
    iconColor: '#216DF3',
    title: 'Budget Management',
    description: 'Create and track monthly budgets by category',
  },
  {
    icon: 'card',
    iconColor: '#FF9500',
    title: 'Expense Tracking',
    description: 'Record and categorize your daily expenses',
  },
  {
    icon: 'add-circle',
    iconColor: '#216DF3',
    title: 'Income Management',
    description: 'Track multiple income sources and earnings',
  },
  {
    icon: 'trending-up',
    iconColor: '#AF52DE',
    title: 'Financial Insights',
    description: 'Analyze spending patterns and savings',
  },
  {
    icon: 'calendar',
    iconColor: '#007AFF',
    title: 'Monthly Overview',
    description: 'View financial data by month and year',
  },
];

function FeatureRow({ icon, iconColor, title, description }) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];

  return (
    <View style={styles.featureRow}>
      <View style={[styles.featureIcon, { backgroundColor: iconColor + '33' }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.featureText}>
        <Text style={[styles.featureTitle, { color: themeColors.text }]}>{title}</Text>
        <Text style={[styles.featureDesc, { color: themeColors.secondaryText }]}>{description}</Text>
      </View>
    </View>
  );
}

export default function AboutScreen() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.groupedBackground }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* App Info */}
        <CardView padding={32}>
          <View style={styles.appInfo}>
            <Image
              source={require('../src/assets/images/icon.png')}
              style={styles.appIcon}
            />
            <Text style={[styles.appName, { color: themeColors.text }]}>Budget Pro</Text>
            <Text style={[styles.version, { color: themeColors.secondaryText }]}>Version {Constants.expoConfig?.version}</Text>
          </View>
        </CardView>

        {/* About */}
        <CardView padding={spacing.xl}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>About</Text>
          <Text style={[styles.body, { color: themeColors.secondaryText }]}>
            Budget Pro is a comprehensive personal finance application designed to help you manage budgets, track expenses & incomes, and achieve your financial goals.
          </Text>
          <Text style={[styles.body, { color: themeColors.secondaryText, marginTop: spacing.md }]}>
            Take control of your finances with intuitive tools for budget planning, expense tracking, and financial insights.
          </Text>
        </CardView>

        {/* Key Features */}
        <CardView padding={spacing.xl}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Key Features</Text>
          <View style={styles.featureList}>
            {FEATURES.map((f, i) => (
              <FeatureRow key={i} {...f} />
            ))}
          </View>
        </CardView>

        {/* Developer */}
        <CardView padding={spacing.xl}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Developer</Text>
          <Text style={[styles.body, { color: themeColors.secondaryText }]}>Built with ❤️ in India</Text>
          <Text style={[styles.caption, { color: themeColors.secondaryText, marginTop: spacing.sm }]}>
            © 2025 Clougeon. All rights reserved.
          </Text>
        </CardView>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  appInfo: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 18,
    marginBottom: spacing.xs,
  },
  appName: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.fonts.bold,
  },
  version: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.semibold,
    marginBottom: spacing.md,
  },
  body: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    lineHeight: 20,
  },
  caption: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
  },
  featureList: {
    gap: spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    gap: spacing.xs,
  },
  featureTitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
  },
  featureDesc: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    lineHeight: 18,
  },
});
