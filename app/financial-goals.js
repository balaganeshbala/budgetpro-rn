import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { colors, spacing, typography } from '../src/constants/theme';

export default function FinancialGoalsScreen() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];

  return (
    <View style={[styles.container, { backgroundColor: themeColors.groupedBackground }]}>
      <Stack.Screen options={{ title: 'Financial Goals', headerBackTitle: '' }} />
      <View style={styles.body}>
        <Ionicons name="trophy-outline" size={48} color={themeColors.tertiaryText} />
        <Text style={[styles.title, { color: themeColors.text }]}>Coming Soon</Text>
        <Text style={[styles.subtitle, { color: themeColors.secondaryText }]}>Set and track your savings targets</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  title: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.semibold },
  subtitle: { fontSize: typography.sizes.sm },
});
