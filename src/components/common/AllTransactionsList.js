import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { getExpenseCategory, getIncomeCategory } from '../../constants/categories';
import { colors, radius, spacing, typography } from '../../constants/theme';
import EmptyDataIndicatorView from '../EmptyDataIndicatorView';
import { TransactionRow } from '../TransactionRow';
import { CardView } from './CardView';

const SORT_OPTIONS = [
  { label: 'Date (Newest First)', value: 'date_desc' },
  { label: 'Date (Oldest First)', value: 'date_asc' },
  { label: 'Amount (Highest First)', value: 'amount_desc' },
  { label: 'Amount (Lowest First)', value: 'amount_asc' },
];

/**
 * Shared sortable transaction list used in expenses-detail and incomes-detail.
 * @param {Object[]} items      - Array of expense or income objects
 * @param {'expense'|'income'} type
 */
export function AllTransactionsList({ items = [], type = 'expense' }) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState('date_desc');
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];

  const isExpense = type === 'expense';
  const editRoute = isExpense ? '/edit-expense' : '/edit-income';
  const getCategory = isExpense ? getExpenseCategory : getIncomeCategory;
  const getTitle = (item) => (isExpense ? item.name : item.source);
  const currentSortLabel = SORT_OPTIONS.find(s => s.value === sortBy)?.label;

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':    return new Date(a.date) - new Date(b.date) || a.id - b.id;
        case 'amount_desc': return b.amount - a.amount;
        case 'amount_asc':  return a.amount - b.amount;
        default:            return new Date(b.date) - new Date(a.date) || b.id - a.id;
      }
    });
  }, [items, sortBy]);

  const handleSortPress = () => {
    const labels = SORT_OPTIONS.map(o => o.label);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [...labels, 'Cancel'], cancelButtonIndex: labels.length, title: 'Sort By' },
        (idx) => { if (idx < labels.length) setSortBy(SORT_OPTIONS[idx].value); }
      );
    } else {
      Alert.alert('Sort By', undefined, [
        ...SORT_OPTIONS.map(o => ({ text: o.label, onPress: () => setSortBy(o.value) })),
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.sortLabel, { color: themeColors.secondaryText }]}>
          Sorted by: <Text style={{ color: themeColors.secondary }}>{currentSortLabel}</Text>
        </Text>
        <TouchableOpacity onPress={handleSortPress} style={{ padding: spacing.xs }}>
          <Ionicons name="swap-vertical-outline" size={22} color={themeColors.primary} />
        </TouchableOpacity>
      </View>

      {/* List card */}
      <CardView padding={0}>
        {sorted.map((item, index) => {
          const category = getCategory(item.category);
          const dateStr = new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
          const isLast = index === sorted.length - 1;
          return (
            <View key={item.id?.toString() || index.toString()}>
              <TransactionRow
                title={getTitle(item)}
                amount={item.amount}
                dateString={dateStr}
                categoryIcon={category.iconName}
                iconColor={themeColors.secondary}
                backgroundColor={themeColors.primary + '20'}
                iconShape="roundedRectangle"
                showChevron={true}
                onPress={() => router.push({ pathname: editRoute, params: { transaction: JSON.stringify(item) } })}
              />
              {!isLast && <View style={[styles.divider, { backgroundColor: themeColors.separator }]} />}
            </View>
          );
        })}
        {sorted.length === 0 && (
          <EmptyDataIndicatorView
            icon={isExpense ? 'receipt-outline' : 'cash-outline'}
            title={isExpense ? 'No Expense Yet' : 'No Income Yet'}
            bodyText={isExpense ? 'Add your expense to track spending' : 'Add your income to track savings'}
          />
        )}
      </CardView>
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  sortLabel: { fontSize: typography.sizes.sm },
  card: { borderRadius: radius.xl, overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: spacing.md + 40 + spacing.md },
  empty: { textAlign: 'center', padding: spacing.xl, fontSize: typography.sizes.md },
});
