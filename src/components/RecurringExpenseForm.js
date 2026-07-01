import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    useColorScheme,
    View,
} from 'react-native';
import { EXPENSE_CATEGORIES } from '../constants/categories';
import { shortMonthNames } from '../constants/months';
import { colors, radius, spacing, typography } from '../constants/theme';
import { AppButton } from './common/AppButton';
import { AppTextField } from './common/AppTextField';

function ordinal(n) {
    const v = n % 100;
    return n + (['th', 'st', 'nd', 'rd'][(v - 20) % 10] || ['th', 'st', 'nd', 'rd'][v] || 'th');
}

export const RecurringExpenseForm = ({ initialData = null, onSave, onCancel, isLoading = false }) => {
    const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const themeColors = colors[scheme];

    const [name, setName] = useState(initialData?.name || '');
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [category, setCategory] = useState(initialData?.category || EXPENSE_CATEGORIES[0].value);
    const [frequency, setFrequency] = useState(initialData?.frequency || 'monthly');
    const [billingDay, setBillingDay] = useState(initialData?.billing_day?.toString() || '');
    const [billingMonth, setBillingMonth] = useState(initialData?.billing_month || 1);
    const [notes, setNotes] = useState(initialData?.notes || '');
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [showMonthPicker, setShowMonthPicker] = useState(false);

    const selectedCategoryObj = EXPENSE_CATEGORIES.find(c => c.value === category);

    const isFormValid =
        name.trim().length > 0 &&
        amount.length > 0 &&
        !isNaN(Number(amount)) &&
        Number(amount) > 0;

    const isDirty = initialData
        ? name.trim() !== (initialData.name || '').trim()
            || amount !== (initialData.amount?.toString() || '')
            || category !== initialData.category
            || frequency !== initialData.frequency
            || billingDay !== (initialData.billing_day?.toString() || '')
            || billingMonth !== (initialData.billing_month || 1)
            || notes.trim() !== (initialData.notes || '').trim()
        : true;

    const handleSave = () => {
        if (!isFormValid) return;
        const dayNum = parseInt(billingDay, 10);
        onSave({
            name: name.trim(),
            amount: Number(amount),
            category,
            frequency,
            billingDay: !isNaN(dayNum) && dayNum >= 1 && dayNum <= 31 ? dayNum : null,
            billingMonth: frequency === 'yearly' ? billingMonth : null,
            notes: notes.trim() || null,
        });
    };

    return (
        <KeyboardAvoidingView style={[styles.screen, { backgroundColor: themeColors.groupedBackground }]} behavior="padding" enabled={Platform.OS !== 'ios'}>
            <ScrollView
                contentContainerStyle={[styles.scrollContent, Platform.OS === 'android' && { paddingBottom: spacing.xl + 80 }]}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                <View style={styles.container}>
                    <Text style={[styles.formTitle, { color: themeColors.text }]}>Recurring Expense Details</Text>

                    <AppTextField
                        hint="Name"
                        iconName="repeat-outline"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        autoFocus={true}
                    />

                    <AppTextField
                        hint="Amount"
                        iconText="₹"
                        value={amount}
                        onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
                        keyboardType="decimal-pad"
                    />

                    {/* Category picker */}
                    <TouchableOpacity
                        style={[styles.selectorButton, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.inputBorder }]}
                        activeOpacity={0.7}
                        onPress={() => { Keyboard.dismiss(); setShowCategoryPicker(true); }}
                    >
                        <View style={styles.selectorLeft}>
                            <Ionicons name="triangle-outline" size={24} color={themeColors.secondaryText} style={styles.icon} />
                            <Text style={[styles.selectorLabel, { color: themeColors.secondaryText }]}>Category</Text>
                        </View>
                        <View style={styles.selectorRight}>
                            <Text style={[styles.selectedValueText, { color: themeColors.primary }]}>{selectedCategoryObj?.displayName}</Text>
                            <Ionicons name="chevron-down" size={16} color={themeColors.primary} style={{ marginLeft: 4 }} />
                        </View>
                    </TouchableOpacity>

                    {/* Frequency toggle */}
                    <View style={styles.frequencyRow}>
                        <Text style={[styles.frequencyLabel, { color: themeColors.secondaryText }]}>Frequency</Text>
                        <View style={[styles.segmentedControl, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.inputBorder }]}>
                            {['monthly', 'yearly'].map(f => (
                                <TouchableOpacity
                                    key={f}
                                    style={[styles.segmentButton, frequency === f && { backgroundColor: themeColors.primary }]}
                                    onPress={() => setFrequency(f)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.segmentLabel, { color: frequency === f ? '#fff' : themeColors.text }]}>
                                        {f.charAt(0).toUpperCase() + f.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Billing month (yearly only) */}
                    {frequency === 'yearly' && (
                        <TouchableOpacity
                            style={[styles.selectorButton, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.inputBorder }]}
                            activeOpacity={0.7}
                            onPress={() => { Keyboard.dismiss(); setShowMonthPicker(true); }}
                        >
                            <View style={styles.selectorLeft}>
                                <Ionicons name="calendar-outline" size={24} color={themeColors.secondaryText} style={styles.icon} />
                                <Text style={[styles.selectorLabel, { color: themeColors.secondaryText }]}>Billing Month</Text>
                            </View>
                            <View style={styles.selectorRight}>
                                <Text style={[styles.selectedValueText, { color: themeColors.primary }]}>{shortMonthNames[billingMonth - 1]}</Text>
                                <Ionicons name="chevron-down" size={16} color={themeColors.primary} style={{ marginLeft: 4 }} />
                            </View>
                        </TouchableOpacity>
                    )}

                    {/* Billing day */}
                    <AppTextField
                        hint={frequency === 'yearly'
                            ? `Billing Day${billingDay ? ' (day ' + ordinal(parseInt(billingDay, 10)) + ')' : ' (optional)'}`
                            : `Billing Day${billingDay ? ' (due on the ' + ordinal(parseInt(billingDay, 10)) + ')' : ' (optional)'}`
                        }
                        iconName="today-outline"
                        value={billingDay}
                        onChangeText={(t) => {
                            const n = t.replace(/[^0-9]/g, '');
                            if (n.length <= 2) setBillingDay(n);
                        }}
                        keyboardType="number-pad"
                    />

                    <AppTextField
                        hint="Notes (optional)"
                        iconName="create-outline"
                        value={notes}
                        onChangeText={setNotes}
                        autoCapitalize="sentences"
                    />

                    <AppButton
                        title={initialData ? 'Update' : 'Save'}
                        onPress={handleSave}
                        isEnabled={isFormValid && isDirty}
                        isLoading={isLoading}
                    />
                </View>
            </ScrollView>

            {/* Category picker modal */}
            <Modal visible={showCategoryPicker} transparent animationType="none" onRequestClose={() => setShowCategoryPicker(false)}>
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
                                    data={EXPENSE_CATEGORIES}
                                    keyExtractor={item => item.value}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={{ paddingBottom: spacing.xl }}
                                    renderItem={({ item }) => {
                                        const isSelected = category === item.value;
                                        return (
                                            <TouchableOpacity
                                                style={[styles.pickerItem, { borderBottomColor: themeColors.separator }]}
                                                onPress={() => { setCategory(item.value); setShowCategoryPicker(false); }}
                                            >
                                                <View style={styles.pickerItemLeft}>
                                                    <Ionicons name={item.iconName} size={24} color={item.color} style={{ marginRight: spacing.md }} />
                                                    <Text style={[styles.pickerItemText, { color: themeColors.text }]}>{item.displayName}</Text>
                                                </View>
                                                {isSelected && <Ionicons name="checkmark" size={24} color={themeColors.primary} />}
                                            </TouchableOpacity>
                                        );
                                    }}
                                />
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Month picker modal */}
            <Modal visible={showMonthPicker} transparent animationType="none" onRequestClose={() => setShowMonthPicker(false)}>
                <TouchableWithoutFeedback onPress={() => setShowMonthPicker(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback onPress={() => {}}>
                            <View style={[styles.modalContent, { backgroundColor: themeColors.cardBackground }]}>
                                <View style={styles.modalHeader}>
                                    <Text style={[styles.modalTitle, { color: themeColors.text }]}>Billing Month</Text>
                                    <TouchableOpacity onPress={() => setShowMonthPicker(false)} style={styles.closeButton}>
                                        <Ionicons name="close" size={24} color={themeColors.secondaryText} />
                                    </TouchableOpacity>
                                </View>
                                <FlatList
                                    data={shortMonthNames.map((m, i) => ({ label: m, value: i + 1 }))}
                                    keyExtractor={item => item.value.toString()}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={{ paddingBottom: spacing.xl }}
                                    renderItem={({ item }) => {
                                        const isSelected = billingMonth === item.value;
                                        return (
                                            <TouchableOpacity
                                                style={[styles.pickerItem, { borderBottomColor: themeColors.separator }]}
                                                onPress={() => { setBillingMonth(item.value); setShowMonthPicker(false); }}
                                            >
                                                <Text style={[styles.pickerItemText, { color: themeColors.text }]}>{item.label}</Text>
                                                {isSelected && <Ionicons name="checkmark" size={24} color={themeColors.primary} />}
                                            </TouchableOpacity>
                                        );
                                    }}
                                />
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1 },
    scrollContent: { padding: spacing.lg },
    container: { gap: spacing.lg },
    formTitle: { fontSize: typography.sizes.xl, fontFamily: typography.fonts.bold, marginBottom: spacing.xs },
    selectorButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        height: 55, borderRadius: radius.md, paddingHorizontal: spacing.md, borderWidth: 1,
    },
    selectorLeft: { flexDirection: 'row', alignItems: 'center' },
    selectorRight: { flexDirection: 'row', alignItems: 'center' },
    icon: { marginRight: spacing.sm },
    selectorLabel: { fontSize: typography.sizes.md, fontFamily: typography.fonts.regular },
    selectedValueText: { fontSize: typography.sizes.md, fontFamily: typography.fonts.medium },
    frequencyRow: { gap: spacing.sm },
    frequencyLabel: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.regular, marginLeft: spacing.xs },
    segmentedControl: {
        flexDirection: 'row', borderRadius: radius.md, borderWidth: 1, overflow: 'hidden', height: 44,
    },
    segmentButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    segmentLabel: { fontSize: typography.sizes.md, fontFamily: typography.fonts.medium },
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
    pickerItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: spacing.lg, paddingHorizontal: spacing.xl,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    pickerItemLeft: { flexDirection: 'row', alignItems: 'center' },
    pickerItemText: { fontSize: typography.sizes.md, fontFamily: typography.fonts.medium },
});
