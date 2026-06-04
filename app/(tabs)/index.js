import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BudgetOverviewCard } from '../../src/components/BudgetOverviewCard';
import TransactionsSection from '../../src/components/TransactionsSection';
import { CardView } from '../../src/components/common/CardView';
import { SettingsRow } from '../../src/components/common/SettingsRow';
import { colors, radius, spacing, typography } from '../../src/constants/theme';
import { useBudgetStore } from '../../src/store/useBudgetStore';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const START_YEAR = 2023;
const now = new Date();
const CURRENT_MONTH = now.getMonth();
const CURRENT_YEAR = now.getFullYear();

export default function HomeScreen() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];
  const router = useRouter();

  const {
    userId, expenses, incomes, totalExpenses, totalIncome, totalBudget,
    isLoading, selectedMonth, selectedYear,
    setSelectedMonth, setSelectedYear, fetchTransactions,
  } = useBudgetStore();

  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState('Expenses');
  const [pickerYear, setPickerYear] = useState(selectedYear);

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
        <TouchableOpacity onPress={openPicker} style={[styles.monthButton, { backgroundColor: themeColors.cardBackground, borderColor: themeColors.separator }]} activeOpacity={0.7}>
          <Ionicons name="calendar" size={18} color={themeColors.primary} style={styles.calendarIcon} />
          <Text style={[styles.monthLabel, { color: themeColors.primary }]}>
            {MONTHS[selectedMonth]} {selectedYear}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ backgroundColor: themeColors.groupedBackground }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <BudgetOverviewCard
          title="Budget"
          totalBudget={totalBudget}
          totalSpent={totalExpenses}
          isLoading={isLoading}
          isPastMonth={selectedYear < CURRENT_YEAR || (selectedYear === CURRENT_YEAR && selectedMonth < CURRENT_MONTH)}
          onCreateBudget={() => router.push('/create-budget')}
          onEditBudget={() => router.push('/edit-budget')}
        />

        {!isLoading && totalBudget > 0 && (
          <TransactionsSection
            recentExpenses={expenses}
            recentIncomes={incomes}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            selectedTab={selectedTab}
            onTabChange={setSelectedTab}
          />
        )}

        {!isLoading && (totalIncome > 0 || totalExpenses > 0) && (
          <CardView padding={0}>
            <SettingsRow
              iconName="wallet"
              iconColor={themeColors.secondary}
              title="Savings Analysis"
              onPress={() => router.push('/savings-analysis')}
            />
            {/* <View style={[styles.divider, { backgroundColor: themeColors.separator }]} /> */}
          </CardView>
        )}
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
                        {SHORT_MONTHS[idx]}
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
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  monthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  calendarIcon: {
    marginRight: spacing.sm,
  },
  monthLabel: {
    fontSize: typography.sizes.md,
    fontFamily: 'Manrope-SemiBold',
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.lg,
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
});
