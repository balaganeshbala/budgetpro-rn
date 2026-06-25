import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CardView } from '../src/components/common/CardView';
import { RowItemIcon } from '../src/components/common/RowItemIcon';
import { SectionHeader } from '../src/components/common/SectionHeader';
import EmptyDataIndicatorView from '../src/components/EmptyDataIndicatorView';
import { colors, radius, spacing, typography } from '../src/constants/theme';
import { shortMonthNames } from '../src/constants/months';
import { useBudgetStore } from '../src/store/useBudgetStore';

const CHART_HEIGHT = 150;
const BAR_WIDTH = 60;
const now = new Date();

// ── helpers ───────────────────────────────────────────────────────────────────

function getRateColor(rate, tc) {
  if (rate < 0)  return tc.error;
  if (rate < 10) return tc.adaptiveRed;
  if (rate < 20) return tc.warning;
  return tc.adaptiveGreen;
}

function getRateIcon(rate) {
  if (rate < 0)  return 'warning';
  if (rate < 10) return 'trending-down';
  if (rate < 20) return 'remove-outline';
  return 'trending-up';
}

function getRateMessage(rate) {
  if (rate < 0)  return "Warning: You're spending more than you earn.";
  if (rate < 10) return 'Your savings rate is low. Try to increase it to at least 10-15%.';
  if (rate < 20) return 'Good progress! Try to reach the recommended 20% savings rate.';
  return "Excellent! You're meeting or exceeding the recommended savings rate.";
}

function getRecommendations(savingsRate, totalExpenses, totalBudget, tc) {
  const items = [];

  if (savingsRate < 0) {
    items.push({ title: 'Urgent: Reduce Expenses', description: 'Your expenses exceed your income. Review and cut non-essential spending immediately.', icon: 'warning', color: tc.error });
  } else if (savingsRate < 10) {
    items.push({ title: 'Increase Savings Rate', description: 'Aim to save at least 10-15% of your income. Consider reducing discretionary spending.', icon: 'arrow-up-circle', color: tc.warning });
  } else if (savingsRate < 20) {
    items.push({ title: 'Good Progress', description: "You're saving well! Try to reach the recommended 20% savings rate for better financial security.", icon: 'checkmark-circle', color: tc.text });
  } else {
    items.push({ title: 'Excellent Savings', description: "Great job! You're exceeding the recommended savings rate. Consider investing for long-term growth.", icon: 'star', color: tc.adaptiveGreen });
  }

  if (totalBudget > 0 && totalExpenses > totalBudget) {
    items.push({ title: 'Budget Overspend', description: "You're spending more than budgeted. Review your categories and adjust your budget or spending habits.", icon: 'trending-down', color: tc.adaptiveRed });
  }

  items.push({ title: 'Emergency Fund', description: 'Ensure you have 3-6 months of expenses saved as an emergency fund for unexpected situations.', icon: 'shield-checkmark', color: tc.info });

  return items;
}

// ── sub-components ────────────────────────────────────────────────────────────

function SummaryRow({ icon, iconColor, iconBg, title, value, valueColor, tc, last }) {
  return (
    <View style={[styles.summaryRow, last && { marginBottom: 0 }]}>
      <RowItemIcon 
          categoryIcon={icon} 
          iconShape="circle" 
          iconColor={iconColor}
          backgroundColor={iconBg}
        />
      <Text style={[styles.summaryLabel, { color: tc.text }]}>{title}</Text>
      <Text style={[styles.summaryValue, { color: valueColor }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

function IncomeExpensesChart({ totalIncome, effectiveExpenses, tc }) {
  const bars = [
    { label: 'Income',   value: totalIncome,       color: tc.adaptiveGreen },
    { label: 'Expenses', value: effectiveExpenses,  color: tc.adaptiveRed  },
  ].filter(b => b.value > 0);

  if (bars.length === 0) return null;

  const maxVal = Math.max(...bars.map(b => b.value), 1);
  const fmt = (v) => '₹' + Math.round(v).toLocaleString('en-IN');

  return (
    <CardView>
      <SectionHeader title="Income vs Expenses" style={{ marginBottom: spacing.xl }}/>
      <View style={styles.chartBars}>
        {bars.map((bar, i) => {
          const barH = Math.max((bar.value / maxVal) * CHART_HEIGHT, 4);
          return (
            <View key={i} style={styles.barCol}>
              <Text style={[styles.barValueText, { color: tc.secondaryText }]}>{fmt(bar.value)}</Text>
              <View style={[styles.bar, { height: barH, backgroundColor: bar.color }]} />
            </View>
          );
        })}
      </View>
      <View style={styles.chartLabelRow}>
        {bars.map((bar, i) => (
          <Text key={i} style={[styles.barLabelText, { color: tc.secondaryText }]}>{bar.label}</Text>
        ))}
      </View>
    </CardView>
  );
}

// ── screen ────────────────────────────────────────────────────────────────────

export default function SavingsAnalysisScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const tc = colors[scheme];

  const totalIncome   = useBudgetStore(s => s.totalIncome);
  const totalExpenses = useBudgetStore(s => s.totalExpenses);
  const totalBudget   = useBudgetStore(s => s.totalBudget);
  const incomes       = useBudgetStore(s => s.incomes);
  const selectedMonth = useBudgetStore(s => s.selectedMonth);
  const selectedYear  = useBudgetStore(s => s.selectedYear);

  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
  const effectiveExpenses = isCurrentMonth ? Math.max(totalExpenses, totalBudget) : totalExpenses;

  const netSavings  = totalIncome - effectiveExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
  const rc          = getRateColor(savingsRate, tc);
  const savingsColor = netSavings >= 0 ? tc.adaptiveGreen : tc.error;

  const progressPct  = (Math.min(Math.max(savingsRate, 0), 40) / 40) * 100;
  const progressWidth = `${progressPct}%`;

  const fmt       = (v) => Math.round(Math.abs(v)).toLocaleString('en-IN');
  const fmtSigned = (v) => `${v >= 0 ? '+' : '−'}₹${Math.round(Math.abs(v)).toLocaleString('en-IN')}`;

  const recommendations = getRecommendations(savingsRate, totalExpenses, totalBudget, tc);

  return (
    <>
      <Stack.Screen options={{ title: `${shortMonthNames[selectedMonth]} ${selectedYear}`, headerBackTitle: '' }} />

      {incomes.length === 0 ? (
        <View style={[styles.emptyWrap, { backgroundColor: tc.groupedBackground }]}>
          <EmptyDataIndicatorView
            icon="trending-up"
            title="No Income Data Available"
            bodyText="Add income entries to view your savings analysis"
          />
        </View>
      ) : (
        <ScrollView
          style={[styles.container, { backgroundColor: tc.groupedBackground }]}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          {/* ── Summary Card ── */}
          <CardView>
            <SectionHeader title="Savings Analysis" style={{ marginBottom: spacing.xl }} />

            <SummaryRow
              icon="briefcase-outline"
              iconColor={tc.secondary}
              iconBg={tc.primary + '20'}
              title="Net Savings"
              value={fmtSigned(netSavings)}
              valueColor={savingsColor}
              tc={tc}
            />
            <SummaryRow
              icon="analytics-outline"
              iconColor={tc.secondary}
              iconBg={tc.primary + '20'}
              title="Savings Rate"
              value={`${savingsRate.toFixed(1)}%`}
              valueColor={rc}
              tc={tc}
            />
            <SummaryRow
              icon="add-circle-outline"
              iconColor={tc.secondary}
              iconBg={tc.primary + '20'}
              title="Income"
              value={`₹${fmt(totalIncome)}`}
              valueColor={tc.text}
              tc={tc}
            />
            <SummaryRow
              icon="remove-circle-outline"
              iconColor={tc.secondary}
              iconBg={tc.primary + '20'}
              title="Expenses"
              value={`₹${fmt(effectiveExpenses)}`}
              valueColor={tc.text}
              tc={tc}
              last
            />
          </CardView>

          {/* ── Income vs Expenses Bar Chart ── */}
          <IncomeExpensesChart
            totalIncome={totalIncome}
            effectiveExpenses={effectiveExpenses}
            tc={tc}
          />

          {/* ── Savings Rate Indicator ── */}
          <CardView>
            <SectionHeader title="Savings Rate" style={{ marginBottom: spacing.xl }}/>
            <Text style={[styles.rateSubtitle, { color: tc.secondaryText }]}>
              Financial experts recommend saving at least 20% of your income.
            </Text>

            {/* Percentage label (right-aligned) */}
            <View style={styles.ratePercentRow}>
              <View style={{ flex: 1 }} />
              <Text style={[styles.ratePercent, { color: rc }]}>{savingsRate.toFixed(1)}%</Text>
            </View>

            {/* Thick progress bar with markers */}
            <View style={[styles.progressBar, { backgroundColor: tc.groupedBackground }]}>
              <View style={[styles.progressFill, { backgroundColor: rc, width: progressWidth }]} />
              {[{ pct: 10, pos: '25%' }, { pct: 20, pos: '50%' }, { pct: 30, pos: '75%' }].map(m => (
                <View
                  key={m.pct}
                  style={[styles.marker, {
                    left: m.pos,
                    backgroundColor: savingsRate >= m.pct ? '#FFFFFF' : 'transparent',
                    borderColor: savingsRate >= m.pct ? rc : tc.tertiaryText,
                  }]}
                />
              ))}
            </View>

            {/* 0% / 20% / 40% labels */}
            <View style={styles.rateLabels}>
              <Text style={[styles.rateLabelText, { color: tc.secondaryText }]}>0%</Text>
              <Text style={[styles.rateLabelText, { color: tc.secondaryText }]}>20%</Text>
              <Text style={[styles.rateLabelText, { color: tc.secondaryText }]}>40%</Text>
            </View>

            {/* Message box */}
            <View style={[styles.messageBox, { backgroundColor: tc.groupedBackground }]}>
              <Ionicons name={getRateIcon(savingsRate)} size={16} color={tc.secondaryText} />
              <Text style={[styles.msgText, { color: tc.secondaryText }]}>{getRateMessage(savingsRate)}</Text>
            </View>
          </CardView>

          {/* ── Recommendations ── */}
          <CardView>
            <SectionHeader title="Recommendations" style={{ marginBottom: spacing.xl }}/>
            {recommendations.map((item, i) => (
              <View key={i} style={[styles.recItem, i > 0 && { marginTop: spacing.lg }]}>
                <View style={[styles.recIcon, { backgroundColor: item.color + '1A' }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <View style={styles.recContent}>
                  <Text style={[styles.recTitle, { color: tc.text }]}>{item.title}</Text>
                  <Text style={[styles.recDesc, { color: tc.secondaryText }]}>{item.description}</Text>
                </View>
              </View>
            ))}
          </CardView>
        </ScrollView>
      )}
    </>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyWrap: { flex: 1, justifyContent: 'center' },
  content: { padding: spacing.lg, gap: spacing.md },

  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.semibold,
    marginBottom: spacing.xl,
  },

  // Summary rows
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabel: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.regular
  },
  summaryValue: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.bold,
    maxWidth: 130,
  },

  // Bar chart
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT + 30,
    justifyContent: 'space-evenly',
  },
  barCol: {
    width: BAR_WIDTH + 50,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barValueText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: 6,
  },
  chartLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: spacing.sm,
  },
  barLabelText: {
    width: BAR_WIDTH + 50,
    textAlign: 'center',
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    justifyContent: 'center'
  },

  // Savings Rate Indicator
  rateSubtitle: {
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    marginBottom: spacing.md,
    fontFamily: typography.fonts.regular
  },
  ratePercentRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  ratePercent: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
  },
  progressBar: {
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 24,
  },
  marker: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    top: 8,
    marginLeft: -4,
  },
  rateLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    fontFamily: typography.fonts.regular
  },
  rateLabelText: {
    fontSize: typography.sizes.xs,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.sm,
    marginTop: spacing.md,
  },
  msgText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    lineHeight: 20,
  },

  // Recommendations
  recItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  recIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recContent: {
    flex: 1,
    gap: spacing.xs,
  },
  recTitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
  },
  recDesc: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    lineHeight: 20,
  },
});
