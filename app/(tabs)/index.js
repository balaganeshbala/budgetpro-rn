import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BudgetOverviewCard } from '../../src/components/BudgetOverviewCard';
import { CardView } from '../../src/components/common/CardView';
import { RowItemIcon } from '../../src/components/common/RowItemIcon';
import { SectionHeader } from '../../src/components/common/SectionHeader';
import { SettingsRow } from '../../src/components/common/SettingsRow';
import { getExpenseCategory, getIncomeCategory } from '../../src/constants/categories';
import { shortMonthNames } from '../../src/constants/months';
import { colors, radius, spacing, typography } from '../../src/constants/theme';
import { useBudgetStore } from '../../src/store/useBudgetStore';

const START_YEAR = 2023;
const PRIMARY_INCOME_CATEGORIES = new Set(['salary', 'business', 'rental', 'pension']);

function CategoryGridItem({ item, themeColors, onPress }) {
  const { categoryObj, remaining, status } = item;
  const fmt = v => `₹${Math.round(v).toLocaleString('en-IN')}`;
  const showRemaining = status === 'on_track' || status === 'overspent';
  const remainingColor = status === 'overspent' ? themeColors.adaptiveRed : themeColors.adaptiveGreen;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
    >
      <CardView style={styles.gridItemIconRow}>
        {/* <View style={[styles.gridItemIcon, { backgroundColor: categoryObj.color + '25' }]}>
          <Ionicons name={categoryObj.iconName} size={16} color={categoryObj.color} />
        </View> */}
        <RowItemIcon
            categoryIcon={categoryObj.iconName} 
            iconShape="circle" 
            iconColor={categoryObj.color}
            backgroundColor={categoryObj.color + '25'}
            containerSize={32}
            iconSize={15}
          />
        <Text style={[styles.gridItemName, { color: themeColors.text }]} numberOfLines={1}>
          {categoryObj.displayName}
        </Text>
        {showRemaining ? (
          <View style={styles.gridItemRemainingBlock}>
            <Text style={[styles.gridItemRemainingLabel, { color: themeColors.secondaryText }]}>
              {status === 'overspent' ? 'Overspent' : 'Remaining'}
            </Text>
            <Text style={[styles.gridItemRemaining, { color: remainingColor }]}>
              {fmt(Math.abs(remaining))}
            </Text>
          </View>
        ) : <View style={styles.gridItemRemainingBlock}>
            <Text style={[styles.gridItemRemainingLabel, { color: themeColors.secondaryText }]}>
              No Budget
            </Text>
            <Text style={[styles.gridItemRemaining, { color: remainingColor }]}>
              {fmt(0)}
            </Text>
          </View>}

        <Ionicons
          name="chevron-forward"
          size={15}
          color={themeColors.secondaryText}
        />
      </CardView>
    </TouchableOpacity>
  );
}
const now = new Date();
const CURRENT_MONTH = now.getMonth();
const CURRENT_YEAR = now.getFullYear();

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];
  const router = useRouter();

  const {
    userId, expenses, incomes, budgets, totalExpenses, totalIncome, totalBudget,
    isLoading, selectedMonth, selectedYear,
    setSelectedMonth, setSelectedYear, fetchTransactions,
  } = useBudgetStore();

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerYear, setPickerYear] = useState(selectedYear);

  const canGoPrev = selectedYear > START_YEAR || selectedMonth > 0;
  const canGoNext = !(selectedYear === CURRENT_YEAR && selectedMonth === CURRENT_MONTH);

  function prevMonth() {
    if (selectedMonth === 0) {
      setSelectedYear(selectedYear - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  }

  function nextMonth() {
    if (selectedMonth === 11) {
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  }

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
      let status;
      if (!hasBudgetEntry && spent > 0)      status = 'unplanned';
      else if (budget > 0 && spent > budget) status = 'overspent';
      else if (budget > 0)                   status = 'on_track';
      else                                   status = 'no_budget';
      return { cat, categoryObj: getExpenseCategory(cat), spent, budget, remaining, status, progress: budget > 0 ? spent / budget : 0 };
    });

    const priority = { unplanned: 0, overspent: 1, on_track: 2, no_budget: 3 };
    items.sort((a, b) => priority[a.status] !== priority[b.status] ? priority[a.status] - priority[b.status] : b.spent - a.spent);
    return items;
  }, [expenses, budgets]);

  const incomeSummary = useMemo(() => {
    let primaryTotal = 0, secondaryTotal = 0;
    const byCategory = {};
    incomes.forEach(i => {
      if (PRIMARY_INCOME_CATEGORIES.has(i.category)) primaryTotal += i.amount || 0;
      else secondaryTotal += i.amount || 0;
      byCategory[i.category] = (byCategory[i.category] || 0) + (i.amount || 0);
    });
    const categoryBreakdown = Object.entries(byCategory)
      .map(([cat, amount]) => ({ cat, amount, categoryObj: getIncomeCategory(cat) }))
      .sort((a, b) => b.amount - a.amount);
    return { primaryTotal, secondaryTotal, categoryBreakdown };
  }, [incomes]);

  useEffect(() => {
    if (userId) fetchTransactions();
  }, [userId]);

  function openPicker() {
    setPickerYear(selectedYear);
    setPickerVisible(true);
  }

  function selectMonth(monthIndex) {
    setSelectedMonth(monthIndex);
    setSelectedYear(pickerYear);
    setPickerVisible(false);
  }

  function isDisabled(monthIndex) {
    return pickerYear > CURRENT_YEAR ||
      (pickerYear === CURRENT_YEAR && monthIndex > CURRENT_MONTH);
  }

  function isSelected(monthIndex) {
    return monthIndex === selectedMonth && pickerYear === selectedYear;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.cardBackground }]} edges={['top']}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} backgroundColor={themeColors.cardBackground} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.cardBackground, borderBottomColor: themeColors.separator }]}>
        <Image source={require('../../src/assets/images/icon.png')} style={styles.appIcon} />
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} disabled={!canGoPrev} style={styles.navBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color={canGoPrev ? themeColors.text : themeColors.tertiaryText} />
          </TouchableOpacity>
          <TouchableOpacity onPress={openPicker} activeOpacity={0.7}>
            <Text style={[styles.monthLabel, { color: themeColors.text }]}>
              {shortMonthNames[selectedMonth]} {selectedYear}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={nextMonth} disabled={!canGoNext} style={styles.navBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={20} color={canGoNext ? themeColors.text : themeColors.tertiaryText} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => router.push('/profile')} style={styles.profileBtn} activeOpacity={0.7}>
          <Ionicons name="person-circle-outline" size={30} color={themeColors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ backgroundColor: themeColors.groupedBackground }} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom }]} showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">
        <View style={styles.budgetSection}>
          <BudgetOverviewCard
            title="Budget"
            totalBudget={totalBudget}
            totalSpent={totalExpenses}
            isLoading={isLoading}
            isPastMonth={selectedYear < CURRENT_YEAR || (selectedYear === CURRENT_YEAR && selectedMonth < CURRENT_MONTH)}
            onCreateBudget={() => router.push('/create-budget')}
            onEditBudget={() => router.push('/edit-budget')}
          />
        </View>

        {!isLoading && categoryBreakdown.length > 0 && (
          <View style={styles.categorySection}>
            <SectionHeader title="By Category" />
            {categoryBreakdown.map((item) => (
              <CategoryGridItem
                key={item.cat}
                item={item}
                themeColors={themeColors}
                onPress={() => router.push({ pathname: '/expense-category-detail', params: { cat: item.cat } })}
              />
            ))}
          </View>
        )}

        <View style={styles.insightsSection}>
          <SectionHeader title="Quick Links" />
          <CardView padding={0}>
          <SettingsRow
            iconName="cash-outline"
            iconColor={themeColors.adaptiveGreen}
            title="Income Details"
            onPress={() => router.push('/incomes-detail')}
          />
          {expenses.length > 0 && (
            <>
            <View style={[styles.divider, { backgroundColor: themeColors.separator }]} />
              <SettingsRow
                iconName="wallet"
                iconColor={themeColors.secondary}
                title="Savings Analysis"
                onPress={() => router.push('/savings-analysis')}
              />
            </>
          )}
        </CardView>
        </View>

      </ScrollView>

      {/* Month Picker Modal */}
      <Modal visible={pickerVisible} transparent onRequestClose={() => setPickerVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setPickerVisible(false)}>
          <Pressable style={[styles.pickerCard, { backgroundColor: themeColors.cardBackground }]} onPress={() => {}}>

            {/* Year row */}
            <View style={styles.yearRow}>
              <TouchableOpacity
                onPress={() => setPickerYear(y => y - 1)}
                disabled={pickerYear <= START_YEAR}
                style={styles.yearNav}
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={pickerYear <= START_YEAR ? themeColors.tertiaryText : themeColors.text}
                />
              </TouchableOpacity>

              <Text style={[styles.yearLabel, { color: themeColors.text }]}>{pickerYear}</Text>

              <TouchableOpacity
                onPress={() => setPickerYear(y => y + 1)}
                disabled={pickerYear >= CURRENT_YEAR}
                style={styles.yearNav}
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={pickerYear >= CURRENT_YEAR ? themeColors.tertiaryText : themeColors.text}
                />
              </TouchableOpacity>
            </View>

            {/* Month grid — 4 rows × 3 columns */}
            {Array.from({ length: 4 }, (_, row) => (
              <View key={row} style={styles.monthRow}>
                {Array.from({ length: 3 }, (_, col) => {
                  const idx = row * 3 + col;
                  const disabled = isDisabled(idx);
                  const selected = isSelected(idx);
                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => !disabled && selectMonth(idx)}
                      activeOpacity={disabled ? 1 : 0.7}
                      style={[
                        styles.monthCell,
                        selected && { backgroundColor: themeColors.primary },
                      ]}
                    >
                      <Text style={[
                        styles.monthCellText,
                        { color: disabled ? themeColors.tertiaryText : selected ? '#FFFFFF' : themeColors.text },
                      ]}>
                        {shortMonthNames[idx]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

          </Pressable>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  appIcon: {
    position: 'absolute',
    left: spacing.md + spacing.xs,
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  profileBtn: {
    position: 'absolute',
    right: spacing.md,
    padding: spacing.xs,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  navBtn: {
    padding: spacing.sm,
  },
  monthLabel: {
    fontSize: typography.sizes.lg,
    fontFamily: 'Manrope-SemiBold',
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  budgetSection: {
    marginHorizontal: -spacing.lg,
    marginTop: -spacing.lg,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(150,150,150,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerCard: {
    width: 300,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  yearNav: {
    padding: spacing.sm,
  },
  yearLabel: {
    fontSize: typography.sizes.xl,
    fontFamily: 'Manrope-Bold',
  },
  monthRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  monthCell: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  monthCellText: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Manrope-Medium',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.lg + 32 + spacing.md,
  },
  incomeTotalLabel: { fontSize: typography.sizes.sm, marginBottom: spacing.xs, marginTop: spacing.md },
  incomeTotalAmount: { fontSize: 32, fontFamily: typography.fonts.bold, marginBottom: spacing.lg },
  incomeSplitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  incomeSplitIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  incomeSplitLabel: { flex: 1, fontSize: typography.sizes.md, fontFamily: typography.fonts.medium },
  incomeSplitAmount: { fontSize: typography.sizes.md, fontFamily: typography.fonts.semibold },
  incomeDividerLine: { height: StyleSheet.hairlineWidth, marginVertical: spacing.md },
  incomeCategoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  incomeCategoryDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.md },
  incomeCategoryName: { flex: 1, fontSize: typography.sizes.md },
  incomeCategoryAmountCol: { alignItems: 'flex-end' },
  incomeCategoryAmount: { fontSize: typography.sizes.md, fontFamily: typography.fonts.semibold },
  incomeCategoryPct: { fontSize: typography.sizes.sm, marginTop: 2 },
  categorySection: {
    gap: spacing.sm,
  },
  insightsSection: {
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  gridItemIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  gridItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridItemName: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.regular,
  },
  gridItemRemainingBlock: {
    alignItems: 'flex-end',
  },
  gridItemRemainingLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    marginBottom: 2,
  },
  gridItemRemaining: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.bold,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.bold,
  },
});
