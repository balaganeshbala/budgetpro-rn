import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    Keyboard,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    useColorScheme,
    View,
} from 'react-native';
import { MAJOR_EXPENSE_CATEGORIES } from '../constants/categories';
import { colors, radius, spacing, typography } from '../constants/theme';
import { AppButton } from './common/AppButton';
import { AppTextField } from './common/AppTextField';

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

function buildCalendarDays(month, year) {
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = Array(firstDayOfWeek).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
}

export const MajorExpenseForm = ({
    initialData = null,
    onSave,
    onCancel,
    isLoading = false,
}) => {
    const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const themeColors = colors[scheme];
    const nameRef = useRef(null);

    const resolveInitialDate = () => {
        if (initialData?.date) return new Date(initialData.date);
        return new Date();
    };

    const [name, setName] = useState(initialData?.name || '');
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [notes, setNotes] = useState(initialData?.notes || '');
    const [selectedCategory, setSelectedCategory] = useState(
        initialData?.category || MAJOR_EXPENSE_CATEGORIES[0].value
    );
    const [date, setDate] = useState(resolveInitialDate);
    const [calendarMonth, setCalendarMonth] = useState(resolveInitialDate().getMonth());
    const [calendarYear, setCalendarYear] = useState(resolveInitialDate().getFullYear());
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const isFormValid = name.trim().length > 0 && amount.length > 0 && !isNaN(Number(amount));

    const isDirty = initialData
        ? name.trim() !== (initialData.name || '').trim()
            || amount !== (initialData.amount?.toString() || '')
            || selectedCategory !== initialData.category
            || date.toISOString().slice(0, 10) !== new Date(initialData.date).toISOString().slice(0, 10)
            || notes.trim() !== (initialData.notes || '').trim()
        : true;

    const isSaveEnabled = isFormValid && isDirty;

    const resetForm = () => {
        setName('');
        setAmount('');
        setNotes('');
        setSelectedCategory(MAJOR_EXPENSE_CATEGORIES[0].value);
        const now = new Date();
        setDate(now);
        setCalendarMonth(now.getMonth());
        setCalendarYear(now.getFullYear());
    };

    const handleSave = async () => {
        if (!isFormValid) return;
        const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const payload = {
            name: name.trim(),
            amount: Number(amount),
            category: selectedCategory,
            date: utcDate.toISOString(),
            notes: notes.trim() || null,
        };
        await onSave(payload);
        if (!initialData) {
            Alert.alert(
                'Major expense added!',
                '',
                [
                    { text: 'Add Another', onPress: () => { resetForm(); setTimeout(() => nameRef.current?.focus(), 100); } },
                    { text: 'Done', style: 'default', onPress: () => onCancel() },
                ]
            );
        }
    };

    const openDatePicker = () => {
        setCalendarMonth(date.getMonth());
        setCalendarYear(date.getFullYear());
        Keyboard.dismiss();
        setShowDatePicker(true);
    };

    const prevMonth = () => {
        if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1); }
        else setCalendarMonth(m => m - 1);
    };

    const nextMonth = () => {
        if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1); }
        else setCalendarMonth(m => m + 1);
    };

    const handleDayPress = (day) => {
        setDate(new Date(calendarYear, calendarMonth, day));
        setShowDatePicker(false);
    };

    const calendarDays = buildCalendarDays(calendarMonth, calendarYear);
    const calendarWeeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) calendarWeeks.push(calendarDays.slice(i, i + 7));

    const today = new Date();
    const isCurrentCalendarMonth = today.getMonth() === calendarMonth && today.getFullYear() === calendarYear;
    const selectedCategoryObj = MAJOR_EXPENSE_CATEGORIES.find(c => c.value === selectedCategory);

    const renderCategoryItem = ({ item }) => {
        const isSelected = selectedCategory === item.value;
        return (
            <TouchableOpacity
                style={[styles.categoryItem, { borderBottomColor: themeColors.separator }]}
                onPress={() => { setSelectedCategory(item.value); setShowCategoryPicker(false); }}
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
        <View style={[styles.screen, { backgroundColor: themeColors.cardBackground }]}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                <View style={styles.container}>
                    <Text style={[styles.formTitle, { color: themeColors.text }]}>Major Expense Details</Text>

                    <AppTextField
                        ref={nameRef}
                        hint="Expense Name"
                        iconName="bag-outline"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        autoFocus={true}
                    />

                    <AppTextField
                        hint="Amount"
                        iconText="₹"
                        value={amount}
                        onChangeText={(text) => setAmount(text.replace(/[^0-9.]/g, ''))}
                        keyboardType="decimal-pad"
                    />

                    {/* Category selector */}
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
                            <Text style={[styles.selectedValueText, { color: themeColors.primary }]}>{selectedCategoryObj?.displayName}</Text>
                            <Ionicons name="chevron-down" size={16} color={themeColors.primary} style={{ marginLeft: 4 }} />
                        </View>
                    </TouchableOpacity>

                    {/* Date selector */}
                    <TouchableOpacity
                        style={[styles.selectorButton, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.inputBorder }]}
                        activeOpacity={0.7}
                        onPress={openDatePicker}
                    >
                        <View style={styles.selectorLeft}>
                            <Ionicons name="calendar-outline" size={24} color={themeColors.secondaryText} style={styles.icon} />
                            <Text style={[styles.selectorLabel, { color: themeColors.text }]}>Date</Text>
                        </View>
                        <View style={styles.selectorRight}>
                            <Text style={[styles.selectedValueText, { color: themeColors.primary }]}>
                                {date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color={themeColors.primary} style={{ marginLeft: 4 }} />
                        </View>
                    </TouchableOpacity>

                    <AppTextField
                        hint="Notes (optional)"
                        iconName="create-outline"
                        value={notes}
                        onChangeText={setNotes}
                        autoCapitalize="sentences"
                    />

                    <AppButton
                        title={initialData ? 'Update Major Expense' : 'Save Major Expense'}
                        onPress={handleSave}
                        isEnabled={isSaveEnabled}
                        isLoading={isLoading}
                    />

                    {/* Date picker modal */}
                    <Modal visible={showDatePicker} animationType="none" transparent onRequestClose={() => setShowDatePicker(false)}>
                        <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
                            <View style={styles.modalOverlay}>
                                <TouchableWithoutFeedback onPress={() => {}}>
                                    <View style={[styles.modalContent, { backgroundColor: themeColors.cardBackground }]}>
                                        <View style={styles.modalHeader}>
                                            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Select Date</Text>
                                            <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.closeButton}>
                                                <Ionicons name="close" size={24} color={themeColors.secondaryText} />
                                            </TouchableOpacity>
                                        </View>

                                        {/* Month navigation */}
                                        <View style={styles.monthNav}>
                                            <TouchableOpacity onPress={prevMonth} style={styles.monthNavBtn}>
                                                <Ionicons name="chevron-back" size={22} color={themeColors.text} />
                                            </TouchableOpacity>
                                            <Text style={[styles.calendarMonthLabel, { color: themeColors.text }]}>
                                                {MONTH_NAMES[calendarMonth]} {calendarYear}
                                            </Text>
                                            <TouchableOpacity onPress={nextMonth} style={styles.monthNavBtn}>
                                                <Ionicons name="chevron-forward" size={22} color={themeColors.text} />
                                            </TouchableOpacity>
                                        </View>

                                        <View style={styles.calendarDayNames}>
                                            {DAY_NAMES.map(d => (
                                                <Text key={d} style={[styles.calendarDayName, { color: themeColors.secondaryText }]}>{d}</Text>
                                            ))}
                                        </View>

                                        <View style={styles.calendarGrid}>
                                            {calendarWeeks.map((week, wi) => (
                                                <View key={wi} style={styles.calendarWeek}>
                                                    {week.map((day, di) => {
                                                        if (!day) return <View key={di} style={styles.calendarCell} />;
                                                        const isSelected = date.getDate() === day &&
                                                            date.getMonth() === calendarMonth &&
                                                            date.getFullYear() === calendarYear;
                                                        const isToday = isCurrentCalendarMonth && today.getDate() === day;
                                                        return (
                                                            <TouchableOpacity
                                                                key={di}
                                                                style={[styles.calendarCell, isSelected && { backgroundColor: themeColors.primary, borderRadius: 20 }]}
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

                    {/* Category picker modal */}
                    <Modal visible={showCategoryPicker} animationType="none" transparent onRequestClose={() => setShowCategoryPicker(false)}>
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
                                            data={MAJOR_EXPENSE_CATEGORIES}
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
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl },
    container: { gap: spacing.lg },
    formTitle: { fontSize: typography.sizes.xl, fontFamily: typography.fonts.bold, marginBottom: spacing.xs },
    selectorButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        height: 55, borderRadius: radius.md, paddingHorizontal: spacing.md, borderWidth: 1,
    },
    selectorLeft: { flexDirection: 'row', alignItems: 'center' },
    selectorRight: { flexDirection: 'row', alignItems: 'center' },
    icon: { marginRight: spacing.sm },
    selectorLabel: { fontSize: typography.sizes.md, color: '#8E8E93', fontFamily: typography.fonts.regular },
    selectedValueText: { fontSize: typography.sizes.md, fontFamily: typography.fonts.medium },
    modalOverlay: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(150,150,150,0.4)', padding: spacing.xl,
    },
    modalContent: { width: '100%', maxHeight: '80%', borderRadius: radius.xl, overflow: 'hidden' },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        padding: spacing.xl, position: 'relative',
    },
    modalTitle: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.bold },
    closeButton: { position: 'absolute', right: spacing.xl },
    monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
    monthNavBtn: { padding: spacing.xs },
    calendarMonthLabel: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.bold, textAlign: 'center' },
    calendarDayNames: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
    calendarDayName: { flex: 1, textAlign: 'center', fontSize: typography.sizes.sm, fontFamily: typography.fonts.medium },
    calendarGrid: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: 4 },
    calendarWeek: { flexDirection: 'row' },
    calendarCell: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center' },
    calendarDayText: { fontSize: typography.sizes.md },
    todayDot: { width: 4, height: 4, borderRadius: 2, position: 'absolute', bottom: 4 },
    categoryItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: spacing.lg, paddingHorizontal: spacing.xl,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    categoryItemLeft: { flexDirection: 'row', alignItems: 'center' },
    categoryItemText: { fontSize: typography.sizes.md, fontFamily: typography.fonts.medium },
});
