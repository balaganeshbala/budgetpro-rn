import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CardView } from '../src/components/common/CardView';
import EmptyDataIndicatorView from '../src/components/EmptyDataIndicatorView';
import { TransactionRow } from '../src/components/TransactionRow';
import { getExpenseCategory } from '../src/constants/categories';
import { colors, radius, spacing, typography } from '../src/constants/theme';
import { useBudgetStore } from '../src/store/useBudgetStore';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

const SORT_OPTIONS = [
  { label: 'Date (Newest First)', value: 'date_desc' },
  { label: 'Date (Oldest First)', value: 'date_asc' },
  { label: 'Amount (Highest First)', value: 'amount_desc' },
  { label: 'Amount (Lowest First)', value: 'amount_asc' },
];

export default function ExpenseCategoryDetailScreen() {
  const insets = useSafeAreaInsets();
  const { cat } = useLocalSearchParams();
  const router = useRouter();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];

  const expenses = useBudgetStore(state => state.expenses);
  const budgets = useBudgetStore(state => state.budgets);
  const totalBudget = useBudgetStore(state => state.totalBudget);
  const selectedMonth = useBudgetStore(state => state.selectedMonth);
  const selectedYear = useBudgetStore(state => state.selectedYear);

  const [sortBy, setSortBy] = useState('date_desc');

  const categoryObj = getExpenseCategory(cat);
  const monthTitle = `${MONTHS[selectedMonth]} ${selectedYear}`;

  const { spent, budget, remaining, status, progress, pct, filtered } = useMemo(() => {
    const filtered = expenses.filter(e => e.category === cat);
    const spent = filtered.reduce((sum, e) => sum + e.amount, 0);
    const budgetEntry = budgets.find(b => b.category === cat);
    const hasBudgetEntry = !!budgetEntry;
    const budget = hasBudgetEntry ? budgetEntry.amount : 0;
    const remaining = budget - spent;
    const pct = totalBudget > 0 ? Math.round((budget / totalBudget) * 100) : 0;

    let status;
    if (!hasBudgetEntry && spent > 0)      status = 'unplanned';
    else if (budget > 0 && spent > budget) status = 'overspent';
    else if (budget > 0)                   status = 'on_track';
    else                                   status = 'no_budget';

    const progress = budget > 0 ? spent / budget : 0;
    return { spent, budget, remaining, status, progress, pct, filtered };
  }, [expenses, budgets, cat, totalBudget]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':    return new Date(a.date) - new Date(b.date) || a.id - b.id;
        case 'amount_desc': return b.amount - a.amount;
        case 'amount_asc':  return a.amount - b.amount;
        default:            return new Date(b.date) - new Date(a.date) || b.id - a.id;
      }
    });
  }, [filtered, sortBy]);

  const fmt = (v) => Math.round(v).toLocaleString('en-IN');

  const pillConfig = {
    unplanned: { label: 'Unplanned', bg: themeColors.warning + '20', text: themeColors.warning },
    overspent: { label: 'Overspent', bg: themeColors.adaptiveRed + '20', text: themeColors.adaptiveRed },
    on_track:  { label: 'On Track',  bg: themeColors.adaptiveGreen + '20', text: themeColors.adaptiveGreen },
    no_budget: { label: 'No Budget', bg: themeColors.groupedBackground, text: themeColors.secondaryText },
  }[status];

  const progressColor = status === 'overspent' ? themeColors.adaptiveRed : themeColors.adaptiveGreen;
  const showProgress = status === 'overspent' || status === 'on_track';
  const currentSortLabel = SORT_OPTIONS.find(s => s.value === sortBy)?.label;

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
      <Stack.Screen
        options={{
          title: monthTitle,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push({ pathname: '/add-expense', params: { cat } })} style={{ paddingHorizontal: 4 }}>
              <Ionicons name="add-circle-outline" size={30} color={themeColors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: themeColors.groupedBackground }]}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        {/* Category summary card */}
        <CardView>
          {/* Icon + name + pill */}
          <View style={styles.headerRow}>
            <View style={[styles.iconCircle, { backgroundColor: categoryObj.color + '25' }]}>
              <Ionicons name={categoryObj.iconName} size={24} color={categoryObj.color} />
            </View>
            <View style={styles.headerMeta}>
              <Text style={[styles.categoryName, { color: themeColors.text }]}>{categoryObj.displayName}</Text>
              <Text style={[styles.monthLabel, { color: themeColors.secondaryText }]}>{pct}% of total budget</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: pillConfig.bg }]}>
              <Text style={[styles.pillText, { color: pillConfig.text }]}>{pillConfig.label}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: themeColors.separator }]} />

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: themeColors.secondaryText }]}>Spent</Text>
              <Text style={[styles.statValue, { color: status === 'overspent' ? themeColors.adaptiveRed : themeColors.text }]}>
                ₹{fmt(spent)}
              </Text>
            </View>
            {status !== 'unplanned' && (
              <>
                <View style={[styles.verticalDivider, { backgroundColor: themeColors.separator }]} />
                <View style={styles.statBox}>
                  <Text style={[styles.statLabel, { color: themeColors.secondaryText }]}>Budget</Text>
                  <Text style={[styles.statValue, { color: themeColors.text }]}>₹{fmt(budget)}</Text>
                </View>
                <View style={[styles.verticalDivider, { backgroundColor: themeColors.separator }]} />
                <View style={styles.statBox}>
                  <Text style={[styles.statLabel, { color: themeColors.secondaryText }]}>Remaining</Text>
                  <Text style={[styles.statValue, { color: status === 'overspent' ? themeColors.adaptiveRed : themeColors.text }]}>
                    {status === 'overspent' ? '-' : ''}₹{fmt(Math.abs(remaining))}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Progress bar */}
          {showProgress && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={[styles.statLabel, { color: progressColor }]}>
                  {Math.round(progress * 100)}% used
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: themeColors.groupedBackground }]}>
                <View style={[styles.progressFill, { backgroundColor: progressColor, width: `${Math.min(progress * 100, 100)}%` }]} />
              </View>
            </View>
          )}
        </CardView>

        {/* Transactions list */}
        <View style={styles.listHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Transactions</Text>
          <TouchableOpacity onPress={handleSortPress} style={{ padding: spacing.xs }}>
            <Ionicons name="swap-vertical-outline" size={22} color={themeColors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.sortLabel, { color: themeColors.secondaryText }]}>
          Sorted by: <Text style={{ color: themeColors.secondary }}>{currentSortLabel}</Text>
        </Text>

        <CardView padding={0}>
          {sorted.length === 0 ? (
            <EmptyDataIndicatorView icon="receipt-outline" title="No Expenses Yet" />
          ) : (
            sorted.map((item, index) => {
              const dateStr = new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
              const isLast = index === sorted.length - 1;
              return (
                <View key={item.id?.toString() || index.toString()}>
                  <TransactionRow
                    title={item.name}
                    amount={item.amount}
                    dateString={dateStr}
                    categoryIcon={categoryObj.iconName}
                    iconColor={themeColors.secondary}
                    backgroundColor={themeColors.primary + '20'}
                    iconShape="roundedRectangle"
                    showChevron={true}
                    onPress={() => router.push({ pathname: '/edit-expense', params: { transaction: JSON.stringify(item) } })}
                  />
                  {!isLast && <View style={[styles.rowDivider, { backgroundColor: themeColors.separator }]} />}
                </View>
              );
            })
          )}
        </CardView>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  headerMeta: { flex: 1 },
  categoryName: { fontSize: typography.sizes.md, fontFamily: typography.fonts.semibold },
  monthLabel: { fontSize: typography.sizes.sm, marginTop: 2 },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  pillText: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.semibold },
  divider: { height: StyleSheet.hairlineWidth, marginBottom: spacing.md, opacity: 0.6 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statBox: { flex: 1, gap: 4 },
  statLabel: { fontSize: typography.sizes.sm },
  statValue: { fontSize: typography.sizes.md, fontFamily: typography.fonts.semibold },
  verticalDivider: { width: StyleSheet.hairlineWidth, height: 32, marginHorizontal: spacing.sm, opacity: 0.6 },
  progressSection: { gap: spacing.sm, marginTop: spacing.md },
  progressHeader: { flexDirection: 'row', justifyContent: 'flex-end' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  sectionTitle: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.bold },
  sortLabel: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.regular, marginBottom: spacing.xs },
  rowDivider: { height: StyleSheet.hairlineWidth, marginLeft: spacing.md + 40 + spacing.md },
});
