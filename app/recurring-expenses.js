import { Stack } from 'expo-router';
import { StyleSheet, useColorScheme, View } from 'react-native';
import EmptyDataIndicatorView from '../src/components/EmptyDataIndicatorView';
import { colors } from '../src/constants/theme';

export default function RecurringExpensesScreen() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];

  return (
    <View style={[styles.container, { backgroundColor: themeColors.groupedBackground }]}>
      <Stack.Screen options={{ title: 'Recurring Expenses', headerBackTitle: '' }} />
      <View style={styles.body}>
        <EmptyDataIndicatorView
          icon='repeat'
          title='Coming Soon'
          bodyText='Track subscriptions, EMIs, and regular bills'
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});
