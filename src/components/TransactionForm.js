import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
  View
} from 'react-native';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';
import { colors, radius, spacing, typography } from '../constants/theme';
import { useBudgetStore } from '../store/useBudgetStore';
import { AppButton } from './common/AppButton';
import { AppTextField } from './common/AppTextField';
import { CardView } from './common/CardView';

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

// Returns a flat array of 7-aligned day numbers (null = empty cell)
function buildCalendarDays(month, year) {
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = Array(firstDayOfWeek).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
}

export const TransactionForm = ({
  transactionType = 'expense', // 'expense' | 'income'
  initialData = null,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];

  const nameRef = useRef(null);

  const selectedMonth = useBudgetStore(state => state.selectedMonth);
  const selectedYear = useBudgetStore(state => state.selectedYear);

  // Clamp the initial date to the selected month/year
  const resolveInitialDate = () => {
    if (initialData?.date) {
      return new Date(initialData.date);
    }
    const today = new Date();
    if (today.getMonth() === selectedMonth && today.getFullYear() === selectedYear) {
      return today;
    }
    return new Date(selectedYear, selectedMonth, 1);
  };

  // State
  const [name, setName] = useState(initialData?.name || initialData?.source || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [selectedCategory, setSelectedCategory] = useState(initialData?.category || (transactionType === 'expense' ? EXPENSE_CATEGORIES[0].value : INCOME_CATEGORIES[0].value));
  const [date, setDate] = useState(resolveInitialDate);

  // Modals state
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const categories = transactionType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const isFormValid = name.trim().length > 0 && amount.length > 0 && !isNaN(Number(amount));

  // In edit mode, only enable the Update button when something has actually changed
  const isDirty = initialData
    ? name.trim() !== (initialData.name || initialData.source || '').trim()
      || amount !== (initialData.amount?.toString() || '')
      || selectedCategory !== initialData.category
      || date.toISOString().slice(0, 10) !== new Date(initialData.date).toISOString().slice(0, 10)
    : true;

  const isSaveEnabled = isFormValid && isDirty;

  const resetForm = () => {
    setName('');
    setAmount('');
    setSelectedCategory(transactionType === 'expense' ? EXPENSE_CATEGORIES[0].value : INCOME_CATEGORIES[0].value);
    setDate(resolveInitialDate());
  };

  const handleSave = async () => {
    if (!isFormValid) return;

    // Serialise as UTC midnight so timezone offsets don't shift the date back a day.
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const payload = {
      amount: Number(amount),
      date: utcDate.toISOString(),
      category: selectedCategory,
    };

    if (transactionType === 'expense') {
      payload.name = name.trim();
    } else {
      payload.source = name.trim();
    }

    await onSave(payload);

    const storeError = useBudgetStore.getState().error;
    if (storeError) {
      Alert.alert('Error', storeError);
      return;
    }

    if (!initialData) {
      Alert.alert(
        transactionType === 'expense' ? 'Expense added successfully!' : 'Income added successfully!',
        '',
        [
          {
            text: 'Add Another',
            onPress: () => {
              resetForm();
              setTimeout(() => nameRef.current?.focus(), 100);
            },
          },
          {
            text: 'Done',
            style: 'default',
            onPress: () => onCancel(),
          },
        ]
      );
    }
  };

  const selectedCategoryObj = categories.find(c => c.value === selectedCategory);

  const calendarDays = buildCalendarDays(selectedMonth, selectedYear);
  const calendarWeeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    calendarWeeks.push(calendarDays.slice(i, i + 7));
  }

  const today = new Date();
  const isCurrentMonth = today.getMonth() === selectedMonth && today.getFullYear() === selectedYear;

  const handleDayPress = (day) => {
    setDate(new Date(selectedYear, selectedMonth, day));
    setShowDatePicker(false);
  };

  const renderCategoryItem = ({ item }) => {
    const isSelected = selectedCategory === item.value;
    return (
      <TouchableOpacity 
        style={[styles.categoryItem, { borderBottomColor: themeColors.separator }]}
        onPress={() => {
          setSelectedCategory(item.value);
          setShowCategoryPicker(false);
        }}
      >
        <View style={styles.categoryItemLeft}>
          <Ionicons name={item.iconName} size={24} color={item.color} style={{ marginRight: spacing.md }} />
          <Text style={[styles.categoryItemText, { color: themeColors.text }]}>{item.displayName}</Text>
        </View>
        {isSelected && <Ionicons name="checkmark" size={24} color={themeColors.primary} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: themeColors.groupedBackground }]}>
    <CardView padding={spacing.lg}>
      <View style={styles.container}>
        
        <Text style={[styles.formTitle, { color: themeColors.text }]}>
          {transactionType === 'expense' ? 'Expense Details' : 'Income Details'}
        </Text>

        {/* Name Field */}
        <AppTextField
          ref={nameRef}
          hint={transactionType === 'expense' ? 'Expense Name' : 'Income Source'}
          iconName={transactionType === 'expense' ? 'bag-outline' : 'briefcase-outline'}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoFocus={true}
        />

        {/* Amount Field */}
        <AppTextField
          hint="Amount"
          iconText="₹"
          value={amount}
          onChangeText={(text) => {
            const filtered = text.replace(/[^0-9.]/g, '');
            setAmount(filtered);
          }}
          keyboardType="decimal-pad"
        />

        {/* Category Field */}
        <TouchableOpacity 
          style={[styles.selectorButton, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.inputBorder }]}
          activeOpacity={0.7}
          onPress={() => { Keyboard.dismiss(); setShowCategoryPicker(true); }}
        >
          <View style={styles.selectorLeft}>
            <Ionicons name="triangle-outline" size={24} color={themeColors.secondaryText} style={styles.icon} />
            <Text style={[styles.selectorLabel, { color: themeColors.text }]}>Category</Text>
          </View>
          <View style={styles.selectorRight}>
             <Text style={[styles.selectedCategoryText, { color: themeColors.primary }]}>
               {selectedCategoryObj?.displayName}
             </Text>
             <Ionicons name="chevron-down" size={16} color={themeColors.primary} style={{ marginLeft: 4 }} />
          </View>
        </TouchableOpacity>

        {/* Date Field */}
        <TouchableOpacity
          style={[styles.selectorButton, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.inputBorder }]}
          activeOpacity={0.7}
          onPress={() => { Keyboard.dismiss(); setShowDatePicker(true); }}
        >
          <View style={styles.selectorLeft}>
            <Ionicons name="calendar-outline" size={24} color={themeColors.secondaryText} style={styles.icon} />
            <Text style={[styles.selectorLabel, { color: themeColors.text }]}>Date</Text>
          </View>
          <View style={styles.selectorRight}>
            <Text style={[styles.selectedCategoryText, { color: themeColors.primary }]}>
              {date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
            <Ionicons name="chevron-down" size={16} color={themeColors.primary} style={{ marginLeft: 4 }} />
          </View>
        </TouchableOpacity>

        {/* Save Button */}
        <AppButton
          title={`${initialData ? 'Update' : 'Save'} ${transactionType === 'expense' ? 'Expense' : 'Income'}`}
          onPress={handleSave}
          isEnabled={isSaveEnabled}
          isLoading={isLoading}
        />

        {/* Calendar Date Picker Modal */}
        <Modal visible={showDatePicker} animationType="none" transparent={true} onRequestClose={() => setShowDatePicker(false)}>
          <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
            <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.cardBackground }]}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: themeColors.text }]}>Select Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={themeColors.secondaryText} />
                </TouchableOpacity>
              </View>

              {/* Month Label */}
              <Text style={[styles.calendarMonthLabel, { color: themeColors.text }]}>
                {MONTH_NAMES[selectedMonth]} {selectedYear}
              </Text>

              {/* Day Name Headers */}
              <View style={styles.calendarDayNames}>
                {DAY_NAMES.map(d => (
                  <Text key={d} style={[styles.calendarDayName, { color: themeColors.secondaryText }]}>{d}</Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {calendarWeeks.map((week, wi) => (
                  <View key={wi} style={styles.calendarWeek}>
                    {week.map((day, di) => {
                      if (!day) {
                        return <View key={di} style={styles.calendarCell} />;
                      }
                      const isSelected = date.getDate() === day &&
                        date.getMonth() === selectedMonth &&
                        date.getFullYear() === selectedYear;
                      const isToday = isCurrentMonth && today.getDate() === day;

                      return (
                        <TouchableOpacity
                          key={di}
                          style={[
                            styles.calendarCell,
                            isSelected && { backgroundColor: themeColors.primary, borderRadius: 20 },
                          ]}
                          onPress={() => handleDayPress(day)}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.calendarDayText,
                            { color: isSelected ? '#fff' : themeColors.text },
                            isToday && !isSelected && { color: themeColors.primary, fontFamily: typography.fonts.bold },
                          ]}>
                            {day}
                          </Text>
                          {isToday && !isSelected && (
                            <View style={[styles.todayDot, { backgroundColor: themeColors.primary }]} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Category Picker Modal */}
        <Modal visible={showCategoryPicker} animationType="none" transparent={true} onRequestClose={() => setShowCategoryPicker(false)}>
          <TouchableWithoutFeedback onPress={() => setShowCategoryPicker(false)}>
            <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
                <View style={[styles.modalContent, { backgroundColor: themeColors.cardBackground }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: themeColors.text }]}>Select Category</Text>
                        <TouchableOpacity onPress={() => setShowCategoryPicker(false)} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={themeColors.secondaryText} />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                      data={categories}
                      keyExtractor={(item) => item.value}
                      renderItem={renderCategoryItem}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ paddingBottom: spacing.xl }}
                    />
                </View>
          </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

      </View>
    </CardView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    gap: spacing.lg,
  },
  formTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.fonts.bold,
    marginBottom: spacing.xs,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 55,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: spacing.sm,
  },
  selectorLabel: {
    fontSize: typography.sizes.md,
    color: '#8E8E93',
  },
  selectedCategoryText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.medium,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(150,150,150,0.4)',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    position: 'relative',
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.bold,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.xl,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  categoryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryItemText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.medium,
  },
  // Calendar styles
  calendarMonthLabel: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.bold,
    textAlign: 'center',
    paddingBottom: spacing.md,
  },
  calendarDayNames: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  calendarDayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
  },
  calendarGrid: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: 4,
  },
  calendarWeek: {
    flexDirection: 'row',
  },
  calendarCell: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayText: {
    fontSize: typography.sizes.md,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 4,
  },
});
