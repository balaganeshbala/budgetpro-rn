import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, InteractionManager, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { AllTransactionsList } from '../src/components/common/AllTransactionsList';
import { CardView } from '../src/components/common/CardView';
import { getExpenseCategory } from '../src/constants/categories';
import { colors, radius, spacing, typography } from '../src/constants/theme';
import { useBudgetStore } from '../src/store/useBudgetStore';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SORT_OPTIONS = [
  { label: 'Date (Newest First)', value: 'date_desc' },
  { label: 'Date (Oldest First)', value: 'date_asc' },
  { label: 'Amount (Highest First)', value: 'amount_desc' },
  { label: 'Amount (Lowest First)', value: 'amount_asc' },
];

function CategoryCard({ item, totalBudget, themeColors, onPress }) {
  const { categoryObj, spent, budget, remaining, status, progress } = item;
  const pct = totalBudget > 0 ? Math.round((budget / totalBudget) * 100) : 0;

  const pillConfig = {
    unplanned: { label: 'Unplanned', bg: themeColors.warning + '20', text: themeColors.warning },
    overspent: { label: 'Overspent', bg: themeColors.adaptiveRed + '20', text: themeColors.adaptiveRed },
    on_track:  { label: 'On Track',  bg: themeColors.adaptiveGreen + '20', text: themeColors.adaptiveGreen },
    no_budget: { label: 'No Budget', bg: themeColors.groupedBackground, text: themeColors.secondaryText },
  }[status];

  const progressColor = status === 'overspent' ? themeColors.adaptiveRed : themeColors.adaptiveGreen;
  const fmt = (v) => Math.round(v).toLocaleString('en-IN');
  const showProgress = (status === 'overspent' || status === 'on_track');
  const showBudgetRow = status !== 'unplanned';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <CardView style={[styles.categoryCard, { backgroundColor: themeColors.cardBackground }]}>
        {/* Header row */}
        <View style={styles.categoryCardHeader}>
          <View style={[styles.categoryIconCircle, { backgroundColor: categoryObj.color + '25' }]}>
            <Ionicons name={categoryObj.iconName} size={20} color={categoryObj.color} />
          </View>
          <View style={styles.categoryCardMeta}>
            <Text style={[styles.categoryCardName, { color: themeColors.text }]}>{categoryObj.displayName}</Text>
            <Text style={[styles.categoryCardPct, { color: themeColors.secondaryText }]}>
              {status === 'unplanned' ? 'No budget set' : `${pct}% of total budget`}
            </Text>
          </View>
          <View style={[styles.pill, { backgroundColor: pillConfig.bg }]}>
            <Text style={[styles.pillText, { color: pillConfig.text }]}>{pillConfig.label}</Text>
          </View>
        </View>

        {/* Budget / Remaining row — hidden for Unplanned */}
        {showBudgetRow && (
          <View style={styles.categoryCardStats}>
            <View>
              <Text style={[styles.statLabel, { color: themeColors.secondaryText }]}>Budget</Text>
              <Text style={[styles.statValue, { color: themeColors.text }]}>₹{fmt(budget)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.statLabel, { color: themeColors.secondaryText }]}>Remaining</Text>
              <Text style={[styles.statValue, { color: status === 'overspent' ? themeColors.adaptiveRed : themeColors.text }]}>
                {status === 'overspent' ? '-' : ''}₹{fmt(Math.abs(remaining))}
              </Text>
            </View>
          </View>
        )}

        {/* Spent row for Unplanned */}
        {!showBudgetRow && (
          <View>
            <Text style={[styles.statLabel, { color: themeColors.secondaryText }]}>Spent</Text>
            <Text style={[styles.statValue, { color: themeColors.warning }]}>₹{fmt(spent)}</Text>
          </View>
        )}

        {/* Progress bar — only for Overspent / On Track */}
        {showProgress && (
          <View style={[styles.progressTrack, { backgroundColor: themeColors.groupedBackground }]}>
            <View style={[styles.progressFill, { backgroundColor: progressColor, width: `${Math.min(progress * 100, 100)}%` }]} />
          </View>
        )}
      </CardView>
    </TouchableOpacity>
  );
}

export default function ExpensesDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const expenses = useBudgetStore(state => state.expenses);
  const budgets = useBudgetStore(state => state.budgets);
  const totalExpenses = useBudgetStore(state => state.totalExpenses);
  const totalBudget = useBudgetStore(state => state.totalBudget);
  const selectedMonth = useBudgetStore(state => state.selectedMonth);
  const selectedYear = useBudgetStore(state => state.selectedYear);

  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];
  const monthTitle = `${MONTHS[selectedMonth]} ${selectedYear}`;
  const fmt = (v) => Math.round(v).toLocaleString('en-IN');

  // Defer heavy rendering until after the navigation transition animation finishes
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setIsReady(true));
    return () => task.cancel();
  }, []);

  const categoryBreakdown = useMemo(() => {
    const byCategory = {};
    expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
    const budgetByCategory = {};
    budgets.forEach(b => { budgetByCategory[b.category] = b.amount; });

    const allCats = new Set([...Object.keys(byCategory), ...Object.keys(budgetByCategory)]);
    const items = Array.from(allCats).map(cat => {
      const spent = byCategory[cat] || 0;
      const hasBudgetEntry = cat in budgetByCategory;
      const budget = hasBudgetEntry ? budgetByCategory[cat] : 0;
      const remaining = budget - spent;

      // unplanned  — has expenses but NO entry in budget table at all
      // overspent  — in budget table, budget > 0, spent > budget
      // on_track   — in budget table, budget > 0, spent <= budget
      // no_budget  — in budget table but budget = 0, OR budgeted but nothing spent
      let status;
      if (!hasBudgetEntry && spent > 0)        status = 'unplanned';
      else if (budget > 0 && spent > budget)   status = 'overspent';
      else if (budget > 0)                     status = 'on_track';
      else                                     status = 'no_budget';

      return {
        cat,
        categoryObj: getExpenseCategory(cat),
        spent, budget, remaining, status,
        progress: budget > 0 ? spent / budget : 0,
      };
    });

    // Sort: unplanned (spent↓) → overspent (spent↓) → on_track (spent↓) → no_budget
    const priority = { unplanned: 0, overspent: 1, on_track: 2, no_budget: 3 };
    items.sort((a, b) => {
      if (priority[a.status] !== priority[b.status]) return priority[a.status] - priority[b.status];
      return b.spent - a.spent;
    });

    return items;
  }, [expenses, budgets]);


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
      <Stack.Screen options={{ title: monthTitle, headerBackTitle: '' }} />
      <ScrollView
        style={[styles.container, { backgroundColor: themeColors.groupedBackground }]}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        {/* Total Expenses Card */}
        <CardView>
          <Text style={[styles.totalLabel, { color: themeColors.secondaryText }]}>Total Expenses</Text>
          <Text style={[styles.totalAmount, { color: themeColors.text }]}>₹{fmt(totalExpenses)}</Text>
        </CardView>

        {/* Expense by Category — deferred until after animation */}
        {!isReady ? (
          <View style={[styles.card, { backgroundColor: themeColors.cardBackground, alignItems: 'center', justifyContent: 'center', height: 80 }]}>
            <ActivityIndicator color={themeColors.primary} />
          </View>
        ) : categoryBreakdown.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Expense by Category</Text>
            {categoryBreakdown.map(item => (
              <CategoryCard
                key={item.cat}
                item={item}
                totalBudget={totalBudget}
                themeColors={themeColors}
                onPress={() => router.push({ pathname: '/expense-category-detail', params: { cat: item.cat } })}
              />
            ))}
          </>
        ) : null}

        {/* All Expenses */}
        <AllTransactionsList items={expenses} type="expense" />

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
  card: { borderRadius: radius.xl, padding: spacing.lg },
  totalLabel: { fontSize: typography.sizes.sm, marginBottom: spacing.xs },
  totalAmount: { fontSize: 32, fontFamily: typography.fonts.bold },
  sectionTitle: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.bold, marginBottom: spacing.xs },
  // Category Card
  categoryCard: { borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  categoryCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  categoryIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  categoryCardMeta: { flex: 1 },
  categoryCardName: { fontSize: typography.sizes.md, fontFamily: typography.fonts.semibold },
  categoryCardPct: { fontSize: typography.sizes.sm, marginTop: 2 },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  pillText: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.semibold },
  categoryCardStats: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { fontSize: typography.sizes.sm },
  statValue: { fontSize: typography.sizes.md, fontFamily: typography.fonts.semibold, marginTop: 2 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  // All Expenses
  allExpensesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  sortButton: { padding: spacing.xs },
  sortLabel: { fontSize: typography.sizes.sm, marginBottom: spacing.xs },
  expenseRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  rowIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  rowMeta: { flex: 1 },
  rowName: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.medium },
  rowDate: { fontSize: typography.sizes.sm, marginTop: 2 },
  rowAmount: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.semibold },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: spacing.lg + 36 + spacing.md },
  emptyText: { textAlign: 'center', padding: spacing.xl, fontSize: typography.sizes.md },
});
