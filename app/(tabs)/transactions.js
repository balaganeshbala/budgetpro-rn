import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AllTransactionsList } from '../../src/components/common/AllTransactionsList';
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

const TABS = ['Expenses', 'Incomes'];

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];
  const router = useRouter();

  const { width } = useWindowDimensions();
  const { expenses, incomes, selectedMonth, selectedYear, setSelectedMonth, setSelectedYear } = useBudgetStore();

  const [pickerVisible, setPickerVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pickerYear, setPickerYear] = useState(selectedYear);
  const pagerRef = useRef(null);

  function scrollToPage(page) {
    pagerRef.current?.scrollTo({ x: page * width, animated: true });
    setCurrentPage(page);
  }

  function onPageChange(e) {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentPage(page);
  }

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

      {/* Header row: month picker + add button */}
      <View style={[styles.header, { backgroundColor: themeColors.cardBackground, borderBottomColor: themeColors.separator }]}>
        <TouchableOpacity onPress={openPicker} style={[styles.monthButton, { borderColor: themeColors.separator }]} activeOpacity={0.7}>
          <Ionicons name="calendar" size={18} color={themeColors.primary} style={styles.calendarIcon} />
          <Text style={[styles.monthLabel, { color: themeColors.primary }]}>
            {MONTHS[selectedMonth]} {selectedYear}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: themeColors.primary + '15' }]}
          onPress={() => router.push(currentPage === 0 ? '/add-expense' : '/add-income')}
        >
          <Ionicons name="add" size={14} color={themeColors.primary} />
          <Text style={[styles.addButtonText, { color: themeColors.primary }]}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: themeColors.cardBackground, borderBottomColor: themeColors.separator }]}>
        {TABS.map((tab, i) => {
          const active = i === currentPage;
          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.8}
              onPress={() => scrollToPage(i)}
              style={[styles.tabItem, active && { borderBottomColor: themeColors.primary }]}
            >
              <Text style={[styles.tabText, { color: active ? themeColors.primary : themeColors.secondaryText }, active && { fontFamily: typography.fonts.semibold }]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onPageChange}
        style={styles.pager}
        bounces={false}
      >
        {[{ items: expenses, type: 'expense' }, { items: incomes, type: 'income' }].map(({ items, type }) => (
          <ScrollView
            key={type}
            style={[styles.page, { width, backgroundColor: themeColors.groupedBackground }]}
            contentContainerStyle={[styles.pageContent, { paddingBottom: insets.bottom }]}
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
          >
            <AllTransactionsList items={items} type={type} />
          </ScrollView>
        ))}
      </ScrollView>

      {/* Month picker modal */}
      <Modal visible={pickerVisible} transparent onRequestClose={() => setPickerVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setPickerVisible(false)}>
          <Pressable style={[styles.pickerCard, { backgroundColor: themeColors.cardBackground }]} onPress={() => {}}>

            <View style={styles.yearRow}>
              <TouchableOpacity onPress={() => setPickerYear(y => y - 1)} disabled={pickerYear <= START_YEAR} style={styles.yearNav}>
                <Ionicons name="chevron-back" size={20} color={pickerYear <= START_YEAR ? themeColors.tertiaryText : themeColors.text} />
              </TouchableOpacity>
              <Text style={[styles.yearLabel, { color: themeColors.text }]}>{pickerYear}</Text>
              <TouchableOpacity onPress={() => setPickerYear(y => y + 1)} disabled={pickerYear >= CURRENT_YEAR} style={styles.yearNav}>
                <Ionicons name="chevron-forward" size={20} color={pickerYear >= CURRENT_YEAR ? themeColors.tertiaryText : themeColors.text} />
              </TouchableOpacity>
            </View>

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
                      style={[styles.monthCell, selected && { backgroundColor: themeColors.primary }]}
                    >
                      <Text style={[styles.monthCellText, { color: disabled ? themeColors.tertiaryText : selected ? '#FFFFFF' : themeColors.text }]}>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  calendarIcon: { marginRight: spacing.sm },
  monthLabel: {
    fontSize: typography.sizes.md,
    fontFamily: 'Manrope-SemiBold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    gap: 4,
  },
  addButtonText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -StyleSheet.hairlineWidth,
  },
  tabText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
  },
  pager: { flex: 1 },
  page: { flex: 1 },
  pageContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
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
  yearNav: { padding: spacing.sm },
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
});
