import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    FlatList, Keyboard, Modal, Platform, Pressable,
    ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View
} from 'react-native';
import { colors, radius, spacing, typography } from '../constants/theme';
import { toYMD } from '../services/goalService';
import { AppButton } from './common/AppButton';
import { AppTextField } from './common/AppTextField';

const PRESET_EMOJIS = [
    '🎯', '🚗', '✈️', '🏠', '💍', '📱', '🏋️', '🎓',
    '💰', '🏖️', '🚀', '🎮', '🏥', '🎸', '📚', '🌎',
    '🏡', '🚢', '💻', '🏆', '🌱', '🎨', '🎪', '🛒',
];

const PRESET_COLORS = [
    '#216DF3', '#428F7D', '#FF6B6B', '#FF9500',
    '#9B59B6', '#E640A6', '#34C759', '#FFD700',
    '#1ABC9C', '#E74C3C', '#3498DB', '#F39C12',
];

const STATUSES = ['active', 'paused', 'completed'];
const STATUS_COLORS = { active: '#34C759', paused: '#FF9500', completed: '#216DF3' };

export const GoalForm = ({ initialData = null, onSave, isLoading = false }) => {
    const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const themeColors = colors[scheme];

    const defaultDate = initialData?.target_date
        ? new Date(initialData.target_date + 'T00:00:00')
        : new Date(Date.now() + 86400 * 30 * 1000);

    const [title, setTitle] = useState(initialData?.title || '');
    const [icon, setIcon] = useState(initialData?.icon || '🎯');
    const [colorHex, setColorHex] = useState(initialData?.color_hex || '#216DF3');
    const [targetAmount, setTargetAmount] = useState(initialData?.target_amount?.toString() || '');
    const [targetDate, setTargetDate] = useState(defaultDate);
    const [status, setStatus] = useState(initialData?.status || 'active');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const isFormValid = title.trim().length > 0 && Number(targetAmount) > 0;
    const isDirty = initialData ? (
        title.trim() !== (initialData.title || '') ||
        icon !== (initialData.icon || '🎯') ||
        colorHex !== (initialData.color_hex || '#216DF3') ||
        Number(targetAmount) !== (initialData.target_amount || 0) ||
        toYMD(targetDate) !== (initialData.target_date || '') ||
        status !== (initialData.status || 'active')
    ) : true;

    const handleSave = async () => {
        if (!isFormValid) return;
        await onSave({ title: title.trim(), icon, colorHex, targetAmount: Number(targetAmount), targetDate: toYMD(targetDate), status });
    };

    const dateLabel = targetDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <View style={[styles.screen, { backgroundColor: themeColors.cardBackground }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.formTitle, { color: themeColors.text }]}>Goal Details</Text>

                {/* Icon & Color row */}
                <View style={styles.iconColorRow}>
                    <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: colorHex }]}
                        onPress={() => { Keyboard.dismiss(); setShowEmojiPicker(true); }}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.iconEmoji}>{icon}</Text>
                        <View style={styles.editBadge}>
                            <Ionicons name="pencil" size={10} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <View style={styles.colorGrid}>
                        {PRESET_COLORS.map(c => (
                            <TouchableOpacity
                                key={c}
                                style={[styles.colorDot, { backgroundColor: c }, colorHex === c && styles.colorDotSelected]}
                                onPress={() => setColorHex(c)}
                                activeOpacity={0.7}
                            />
                        ))}
                    </View>
                </View>

                <AppTextField
                    hint="Goal Title"
                    iconName="flag-outline"
                    value={title}
                    onChangeText={setTitle}
                    autoCapitalize="words"
                    autoFocus={!initialData}
                />

                <AppTextField
                    hint="Target Amount"
                    iconText="₹"
                    value={targetAmount}
                    onChangeText={(t) => setTargetAmount(t.replace(/[^0-9.]/g, ''))}
                    keyboardType="decimal-pad"
                />

                {/* Target Date selector */}
                <TouchableOpacity
                    style={[styles.selector, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.inputBorder }]}
                    activeOpacity={0.7}
                    onPress={() => { Keyboard.dismiss(); setShowDatePicker(true); }}
                >
                    <View style={styles.selectorLeft}>
                        <Ionicons name="calendar-outline" size={24} color={themeColors.secondaryText} style={styles.selectorIcon} />
                        <Text style={[styles.selectorLabel, { color: themeColors.secondaryText }]}>Target Date</Text>
                    </View>
                    <Text style={[styles.selectorValue, { color: themeColors.primary }]}>{dateLabel}</Text>
                </TouchableOpacity>

                {/* Status segmented control */}
                <View style={[styles.statusRow, { backgroundColor: themeColors.groupedBackground }]}>
                    {STATUSES.map(s => {
                        const isSelected = status === s;
                        return (
                            <TouchableOpacity
                                key={s}
                                style={[styles.statusChip, isSelected && { backgroundColor: STATUS_COLORS[s] }]}
                                onPress={() => setStatus(s)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.statusChipText, { color: isSelected ? '#fff' : themeColors.secondaryText }]}>
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <AppButton
                    title={initialData ? 'Update Goal' : 'Save Goal'}
                    onPress={handleSave}
                    isEnabled={isFormValid && isDirty}
                    isLoading={isLoading}
                />
            </ScrollView>

            {/* Emoji Picker Modal */}
            <Modal visible={showEmojiPicker} transparent animationType="fade" onRequestClose={() => setShowEmojiPicker(false)}>
                <Pressable style={styles.overlay} onPress={() => setShowEmojiPicker(false)}>
                    <Pressable style={[styles.sheet, { backgroundColor: themeColors.cardBackground }]} onPress={() => {}}>
                        <Text style={[styles.sheetTitle, { color: themeColors.text }]}>Choose Icon</Text>
                        <FlatList
                            data={PRESET_EMOJIS}
                            numColumns={6}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.emojiCell, icon === item && { backgroundColor: colorHex + '30', borderRadius: radius.sm }]}
                                    onPress={() => { setIcon(item); setShowEmojiPicker(false); }}
                                >
                                    <Text style={styles.emojiText}>{item}</Text>
                                </TouchableOpacity>
                            )}
                            showsVerticalScrollIndicator={false}
                        />
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Date Picker */}
            {showDatePicker && (
                Platform.OS === 'ios' ? (
                    <Modal visible transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
                        <Pressable style={styles.overlay} onPress={() => setShowDatePicker(false)}>
                            <Pressable style={[styles.sheet, { backgroundColor: themeColors.cardBackground }]} onPress={() => {}}>
                                <Text style={[styles.sheetTitle, { color: themeColors.text }]}>Select Date</Text>
                                <DateTimePicker
                                    value={targetDate}
                                    mode="date"
                                    display="spinner"
                                    onChange={(_, d) => { if (d) setTargetDate(d); }}
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
                        value={targetDate}
                        mode="date"
                        display="default"
                        onChange={(event, d) => { setShowDatePicker(false); if (event.type === 'set' && d) setTargetDate(d); }}
                    />
                )
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1 },
    scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.lg },
    formTitle: { fontSize: typography.sizes.xl, fontFamily: typography.fonts.bold },
    iconColorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    iconButton: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
    iconEmoji: { fontSize: 32 },
    editBadge: {
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: 3,
    },
    colorGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    colorDot: { width: 28, height: 28, borderRadius: 14 },
    colorDotSelected: {
        borderWidth: 3, borderColor: '#fff',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3, shadowRadius: 2, elevation: 2,
    },
    selector: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        height: 55, borderRadius: radius.md, paddingHorizontal: spacing.md, borderWidth: 1,
    },
    selectorLeft: { flexDirection: 'row', alignItems: 'center' },
    selectorIcon: { marginRight: spacing.sm },
    selectorLabel: { fontSize: typography.sizes.md },
    selectorValue: { fontSize: typography.sizes.md, fontFamily: typography.fonts.medium },
    statusRow: { flexDirection: 'row', borderRadius: radius.md, padding: 4, gap: 4 },
    statusChip: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: 'center' },
    statusChipText: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.medium },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
    sheet: { width: '100%', borderRadius: radius.xl, overflow: 'hidden', padding: spacing.lg },
    sheetTitle: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.bold, textAlign: 'center', marginBottom: spacing.md },
    emojiCell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xs },
    emojiText: { fontSize: 28 },
    doneBtn: { borderRadius: radius.pill, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md },
    doneBtnText: { color: '#fff', fontSize: typography.sizes.md, fontFamily: typography.fonts.semibold },
});
