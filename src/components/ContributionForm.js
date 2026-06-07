import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Modal, Platform, Pressable, ScrollView,
    StyleSheet, Text, TouchableOpacity, useColorScheme, View
} from 'react-native';
import { colors, radius, spacing, typography } from '../constants/theme';
import { toYMD } from '../services/goalService';
import { AppButton } from './common/AppButton';
import { AppTextField } from './common/AppTextField';

export const ContributionForm = ({ initialData = null, goalTitle = '', onSave, isLoading = false }) => {
    const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const themeColors = colors[scheme];

    const defaultDate = initialData?.date
        ? new Date(initialData.date + 'T00:00:00')
        : new Date();

    const [name, setName] = useState(initialData?.name || '');
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [date, setDate] = useState(defaultDate);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const isFormValid = name.trim().length > 0 && Number(amount) > 0;
    const isDirty = initialData ? (
        name.trim() !== (initialData.name || '') ||
        Number(amount) !== (initialData.amount || 0) ||
        toYMD(date) !== (initialData.date || '')
    ) : true;

    const handleSave = async () => {
        if (!isFormValid) return;
        await onSave({ name: name.trim(), amount: Number(amount), date: toYMD(date) });
    };

    const dateLabel = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <View style={[styles.screen, { backgroundColor: themeColors.cardBackground }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets
                showsVerticalScrollIndicator={false}
            >
                {goalTitle ? (
                    <Text style={[styles.goalLabel, { color: themeColors.secondaryText }]}>{goalTitle}</Text>
                ) : null}
                <Text style={[styles.formTitle, { color: themeColors.text }]}>Contribution Details</Text>

                <AppTextField
                    hint="Description"
                    iconName="create-outline"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="sentences"
                    autoFocus={!initialData}
                />

                <AppTextField
                    hint="Amount"
                    iconText="₹"
                    value={amount}
                    onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
                    keyboardType="decimal-pad"
                />

                <TouchableOpacity
                    style={[styles.selector, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.inputBorder }]}
                    activeOpacity={0.7}
                    onPress={() => setShowDatePicker(true)}
                >
                    <View style={styles.selectorLeft}>
                        <Ionicons name="calendar-outline" size={24} color={themeColors.secondaryText} style={styles.selectorIcon} />
                        <Text style={[styles.selectorLabel, { color: themeColors.secondaryText }]}>Date</Text>
                    </View>
                    <Text style={[styles.selectorValue, { color: themeColors.primary }]}>{dateLabel}</Text>
                </TouchableOpacity>

                <AppButton
                    title={initialData ? 'Update Contribution' : 'Add Contribution'}
                    onPress={handleSave}
                    isEnabled={isFormValid && isDirty}
                    isLoading={isLoading}
                />
            </ScrollView>

            {showDatePicker && (
                Platform.OS === 'ios' ? (
                    <Modal visible transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
                        <Pressable style={styles.overlay} onPress={() => setShowDatePicker(false)}>
                            <Pressable style={[styles.sheet, { backgroundColor: themeColors.cardBackground }]} onPress={() => {}}>
                                <Text style={[styles.sheetTitle, { color: themeColors.text }]}>Select Date</Text>
                                <DateTimePicker
                                    value={date}
                                    mode="date"
                                    display="spinner"
                                    onChange={(_, d) => { if (d) setDate(d); }}
                                    style={{ width: '100%' }}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowDatePicker(false)}
                                    style={[styles.doneBtn, { backgroundColor: themeColors.primary }]}
                                >
                                    <Text style={styles.doneBtnText}>Done</Text>
                                </TouchableOpacity>
                            </Pressable>
                        </Pressable>
                    </Modal>
                ) : (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display="default"
                        onChange={(event, d) => { setShowDatePicker(false); if (event.type === 'set' && d) setDate(d); }}
                    />
                )
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1 },
    scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.lg },
    goalLabel: { fontSize: typography.sizes.sm },
    formTitle: { fontSize: typography.sizes.xl, fontFamily: typography.fonts.bold },
    selector: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        height: 55, borderRadius: radius.md, paddingHorizontal: spacing.md, borderWidth: 1,
    },
    selectorLeft: { flexDirection: 'row', alignItems: 'center' },
    selectorIcon: { marginRight: spacing.sm },
    selectorLabel: { fontSize: typography.sizes.md },
    selectorValue: { fontSize: typography.sizes.md, fontFamily: typography.fonts.medium },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
    sheet: { width: '100%', borderRadius: radius.xl, overflow: 'hidden', padding: spacing.lg },
    sheetTitle: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.bold, textAlign: 'center', marginBottom: spacing.md },
    doneBtn: { borderRadius: radius.pill, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md },
    doneBtnText: { color: '#fff', fontSize: typography.sizes.md, fontFamily: typography.fonts.semibold },
});
