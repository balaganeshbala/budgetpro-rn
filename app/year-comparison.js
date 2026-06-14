import { Stack } from 'expo-router';
import { StyleSheet, useColorScheme, View } from 'react-native';
import EmptyDataIndicatorView from '../src/components/EmptyDataIndicatorView';
import { colors, typography } from '../src/constants/theme';

export default function YearComparisonScreen() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];

  return (
    <View style={[styles.container, { backgroundColor: themeColors.groupedBackground }]}>
      <Stack.Screen options={{ title: 'Year-over-Year', headerBackTitle: '', headerTitleStyle: { fontFamily: typography.fonts.medium } }} />
      <View style={styles.body}>
        <EmptyDataIndicatorView
          icon='bar-chart-outline'
          title='Coming Soon'
          bodyText='Compare your spending across years'
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
