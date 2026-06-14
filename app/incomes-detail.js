import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AllTransactionsList } from '../src/components/common/AllTransactionsList';
import { CardView } from '../src/components/common/CardView';
import { SectionHeader } from '../src/components/common/SectionHeader';
import EmptyDataIndicatorView from '../src/components/EmptyDataIndicatorView';
import { getIncomeCategory } from '../src/constants/categories';
import { colors, radius, spacing, typography } from '../src/constants/theme';
import { useBudgetStore } from '../src/store/useBudgetStore';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                 'July', 'August', 'September', 'October', 'November', 'December'];

// Primary = main/stable income sources; Secondary = supplemental
const PRIMARY_CATEGORIES = new Set(['salary', 'business', 'rental', 'pension']);

export default function IncomesDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const incomes = useBudgetStore(state => state.incomes);
  const totalIncome = useBudgetStore(state => state.totalIncome);
  const selectedMonth = useBudgetStore(state => state.selectedMonth);
  const selectedYear = useBudgetStore(state => state.selectedYear);

  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];
  const monthTitle = `${MONTHS[selectedMonth]} ${selectedYear}`;
  const fmt = (v) => Math.round(v).toLocaleString('en-IN');

  const { primaryTotal, secondaryTotal } = useMemo(() => {
    let primary = 0, secondary = 0;
    incomes.forEach(i => {
      if (PRIMARY_CATEGORIES.has(i.category)) primary += i.amount || 0;
      else secondary += i.amount || 0;
    });
    return { primaryTotal: primary, secondaryTotal: secondary };
  }, [incomes]);

  const categoryBreakdown = useMemo(() => {
    const byCategory = {};
    incomes.forEach(i => { byCategory[i.category] = (byCategory[i.category] || 0) + i.amount; });
    return Object.entries(byCategory)
      .map(([cat, amount]) => ({ cat, amount, categoryObj: getIncomeCategory(cat) }))
      .sort((a, b) => b.amount - a.amount);
  }, [incomes]);

  return (
    <>
      <Stack.Screen
        options={{
          title: monthTitle,
          headerTitleStyle: { fontFamily: typography.fonts.medium },
          headerBackTitle: '',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/add-income')} style={{ paddingHorizontal: 4 }}>
              <Ionicons name="add-circle-outline" size={30} color={themeColors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      {incomes.length === 0 ? (
        <View style={[styles.emptyWrap, { backgroundColor: themeColors.groupedBackground }]}>
          <EmptyDataIndicatorView
            icon="cash-outline"
            title="No Income Yet"
            bodyText="Tap the + button to add your first income entry"
          />
        </View>
      ) : (
      <ScrollView
        style={[styles.container, { backgroundColor: themeColors.groupedBackground }]}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        {/* Main summary card */}
        <CardView>
          <SectionHeader title="Income Details"></SectionHeader>

          <Text style={[styles.totalLabel, { color: themeColors.secondaryText }]}>Total Income</Text>
          <Text style={[styles.totalAmount, { color: themeColors.text }]}>₹{fmt(totalIncome)}</Text>

          <View style={styles.splitRow}>
            <View style={[styles.splitIcon, { backgroundColor: themeColors.primary + '15' }]}>
              <Ionicons name="add-circle-outline" size={20} color={themeColors.secondary} />
            </View>
            <Text style={[styles.splitLabel, { color: themeColors.text }]}>Primary</Text>
            <Text style={[styles.splitAmount, { color: themeColors.adaptiveGreen }]}>{fmt(primaryTotal)}</Text>
          </View>

          <View style={styles.splitRow}>
            <View style={[styles.splitIcon, { backgroundColor: themeColors.primary + '15' }]}>
              <Ionicons name="star-outline" size={20} color={themeColors.secondary} />
            </View>
            <Text style={[styles.splitLabel, { color: themeColors.text }]}>Secondary</Text>
            <Text style={[styles.splitAmount, { color: themeColors.warning }]}>{fmt(secondaryTotal)}</Text>
          </View>

          {categoryBreakdown.length > 0 && (
            <View style={[styles.dividerLine, { backgroundColor: themeColors.separator }]} />
          )}

          {categoryBreakdown.length > 0 && (
            <>
              <Text style={[styles.byCategory, { color: themeColors.secondaryText }]}>
                Income by Category
              </Text>
              {categoryBreakdown.map(({ cat, amount, categoryObj }) => {
                const pct = totalIncome > 0 ? ((amount / totalIncome) * 100).toFixed(1) : '0.0';
                return (
                  <View key={cat} style={styles.categoryRow}>
                    <View style={[styles.categoryDot, { backgroundColor: categoryObj.color }]} />
                    <Text style={[styles.categoryName, { color: themeColors.text }]}>
                      {categoryObj.displayName}
                    </Text>
                    <View style={styles.categoryAmountCol}>
                      <Text style={[styles.categoryAmount, { color: themeColors.text }]}>₹{fmt(amount)}</Text>
                      <Text style={[styles.categoryPct, { color: themeColors.secondaryText }]}>{pct}%</Text>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </CardView>

        {/* All Incomes — shared component */}
        <AllTransactionsList items={incomes} type="income" />

      </ScrollView>
      )}
    </>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyWrap: { flex: 1, justifyContent: 'center' },
  content: { padding: spacing.lg, gap: spacing.md, },
  card: { borderRadius: radius.xl, padding: spacing.lg },
  totalLabel: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.regular, marginBottom: spacing.xs, marginTop: spacing.md },
  totalAmount: { fontSize: 32, fontFamily: typography.fonts.bold, marginBottom: spacing.lg },
  splitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  splitIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  splitLabel: { flex: 1, fontSize: typography.sizes.md, fontFamily: typography.fonts.medium },
  splitAmount: { fontSize: typography.sizes.md, fontFamily: typography.fonts.semibold },
  dividerLine: { height: StyleSheet.hairlineWidth, marginVertical: spacing.md },
  byCategory: { fontSize: typography.sizes.sm, marginBottom: spacing.md, fontFamily: typography.fonts.regular },
  categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  categoryDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.md },
  categoryName: { flex: 1, fontSize: typography.sizes.md, fontFamily: typography.fonts.regular },
  categoryAmountCol: { alignItems: 'flex-end' },
  categoryAmount: { fontSize: typography.sizes.md, fontFamily: typography.fonts.semibold },
  categoryPct: { fontSize: typography.sizes.sm, marginTop: 2 },
});
