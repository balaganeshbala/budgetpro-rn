import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Alert, ScrollView,
    StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View
} from 'react-native';
import { CardView } from '../src/components/common/CardView';
import { EXPENSE_CATEGORIES } from '../src/constants/categories';
import { colors, radius, spacing, typography } from '../src/constants/theme';
import { useBudgetStore } from '../src/store/useBudgetStore';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

export default function EditBudgetScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const updateBudgets = useBudgetStore(state => state.updateBudgets);
    const selectedMonth = useBudgetStore(state => state.selectedMonth);
    const selectedYear = useBudgetStore(state => state.selectedYear);
    const budgets = useBudgetStore(state => state.budgets);
    const isStoreLoading = useBudgetStore(state => state.isLoading);

    const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const themeColors = colors[scheme];

    const [amounts, setAmounts] = useState({});
    const [originalAmounts, setOriginalAmounts] = useState({});
    const initializedRef = useRef(false);

    // Snapshot both amounts and originalAmounts once — when the store has
    // finished loading. Using useEffect avoids React Compiler closure issues
    // with useState lazy initialisers, and ensures we always read the latest
    // store data rather than a stale closure captured at mount time.
    useEffect(() => {
        if (initializedRef.current) return;
        if (isStoreLoading) return;

        const init = {};
        EXPENSE_CATEGORIES.forEach(cat => {
            const existing = budgets.find(b => b.category === cat.value);
            init[cat.value] = (existing && existing.amount > 0)
                ? String(Math.round(existing.amount))
                : '';
        });
        setAmounts(init);
        setOriginalAmounts(init);
        initializedRef.current = true;
    }, [budgets, isStoreLoading]);

    const [isSaving, setIsSaving] = useState(false);

    const totalBudget = Object.values(amounts).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
    const originalTotal = Object.values(originalAmounts).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
    const fmt = (v) => Math.round(v).toLocaleString('en-IN');
    const monthLabel = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;

    const hasChanges = EXPENSE_CATEGORIES.some(cat => {
        const current = parseFloat(amounts[cat.value]) || 0;
        const original = parseFloat(originalAmounts[cat.value]) || 0;
        return current !== original;
    });

    const categoryHasChanged = (catValue) => {
        const current = parseFloat(amounts[catValue]) || 0;
        const original = parseFloat(originalAmounts[catValue]) || 0;
        return current !== original;
    };

    const handleUpdate = () => {
        if (!hasChanges) return;

        Alert.alert(
            'Confirm Update',
            'Are you sure you want to update this budget?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Update',
                    onPress: async () => {
                        const budgetData = EXPENSE_CATEGORIES.map(cat => {
                            const existing = budgets.find(b => b.category === cat.value);
                            return {
                                id: existing?.id,
                                category: cat.value,
                                amount: parseFloat(amounts[cat.value]) || 0,
                            };
                        });
                        setIsSaving(true);
                        try {
                            await updateBudgets(budgetData);
                            router.back();
                        } catch (e) {
                            Alert.alert('Error', e.message || 'Failed to update budget');
                        } finally {
                            setIsSaving(false);
                        }
                    },
                },
            ]
        );
    };

    const difference = totalBudget - originalTotal;

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Edit Budget',
                    headerBackTitle: '',
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={handleUpdate}
                            disabled={!hasChanges || isSaving}
                            style={{ padding: 8 }}
                        >
                            <Text style={[
                                styles.updateBtn,
                                {
                                    color: hasChanges && !isSaving ? themeColors.primary : themeColors.secondaryText,
                                }
                            ]}>
                                {isSaving ? 'Saving…' : 'Update'}
                            </Text>
                        </TouchableOpacity>
                    ),
                }}
            />
            <ScrollView
                style={[styles.container, { backgroundColor: themeColors.groupedBackground }]}
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
                showsVerticalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
            >
                {/* Total Budget Card */}
                <CardView>
                    <Text style={[styles.totalLabel, { color: themeColors.secondaryText }]}>
                        Total Budget
                    </Text>

                    {hasChanges ? (
                        <>
                            <View style={styles.totalChangedRow}>
                                <Text style={[styles.totalAmount, { color: themeColors.text }]}>
                                    ₹{fmt(totalBudget)}
                                </Text>
                                <View style={[styles.updatedBadge, { backgroundColor: themeColors.warning + '22' }]}>
                                    <Text style={[styles.updatedBadgeText, { color: themeColors.warning }]}>Updated</Text>
                                </View>
                            </View>
                            <View style={styles.originalRow}>
                                <Text style={[styles.originalAmount, { color: themeColors.secondaryText }]}>
                                    was ₹{fmt(originalTotal)}
                                </Text>
                                <Text style={[
                                    styles.differenceText,
                                    { color: difference >= 0 ? themeColors.adaptiveGreen : themeColors.adaptiveRed }
                                ]}>
                                    {difference >= 0 ? '+' : ''}₹{fmt(Math.abs(difference))}
                                </Text>
                            </View>
                        </>
                    ) : (
                        <Text style={[styles.totalAmount, { color: themeColors.text }]}>
                            ₹{fmt(totalBudget)}
                        </Text>
                    )}

                    <Text style={[styles.monthSubtitle, { color: themeColors.secondaryText }]}>
                        {monthLabel}
                    </Text>
                </CardView>

                {/* Budget Categories */}
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Budget Categories</Text>

                {EXPENSE_CATEGORIES.map(cat => {
                    const value = amounts[cat.value] || '';
                    const changed = categoryHasChanged(cat.value);
                    const originalVal = originalAmounts[cat.value] || '0';

                    return (
                        <View
                            key={cat.value}
                            style={[
                                styles.card,
                                styles.categoryRow,
                                {
                                    backgroundColor: changed
                                        ? themeColors.warning + '0D'
                                        : themeColors.cardBackground,
                                    borderWidth: changed ? 1 : 0,
                                    borderColor: changed ? themeColors.warning + '55' : 'transparent',
                                }
                            ]}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: cat.color + '25' }]}>
                                <Ionicons name={cat.iconName} size={22} color={cat.color} />
                            </View>
                            <View style={styles.categoryMeta}>
                                <View style={styles.categoryNameRow}>
                                    <Text style={[styles.categoryName, { color: themeColors.text }]}>
                                        {cat.displayName}
                                    </Text>
                                    {changed && (
                                        <View style={[styles.changedDot, { backgroundColor: themeColors.warning }]} />
                                    )}
                                </View>
                                <Text style={[
                                    styles.categorySubtitle,
                                    { color: changed ? themeColors.warning : themeColors.secondaryText }
                                ]}>
                                    {changed
                                        ? `was ₹${fmt(parseFloat(originalVal))}`
                                        : parseFloat(value) > 0 ? `₹${fmt(parseFloat(value))}` : 'No budget set'
                                    }
                                </Text>
                            </View>
                            <View style={[
                                styles.inputBox,
                                {
                                    borderColor: changed ? themeColors.warning : themeColors.separator,
                                    borderWidth: changed ? 2 : 1,
                                }
                            ]}>
                                <Text style={[styles.rupee, { color: themeColors.secondaryText }]}>₹</Text>
                                <TextInput
                                    style={[styles.input, { color: themeColors.text }]}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor={themeColors.secondaryText}
                                    value={value}
                                    onChangeText={text => {
                                        const clean = text.replace(/[^0-9]/g, '');
                                        setAmounts(prev => ({ ...prev, [cat.value]: clean }));
                                    }}
                                />
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: spacing.lg, gap: spacing.md },
    card: { borderRadius: radius.xl, padding: spacing.lg },
    totalLabel: { fontSize: typography.sizes.sm, marginBottom: spacing.xs },
    totalAmount: { fontSize: 28, fontFamily: typography.fonts.bold },
    totalChangedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    updatedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
    updatedBadgeText: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.semibold },
    originalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
    originalAmount: { fontSize: typography.sizes.sm, textDecorationLine: 'line-through' },
    differenceText: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.semibold },
    monthSubtitle: { fontSize: typography.sizes.sm, marginTop: spacing.xs },
    sectionTitle: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.bold },
    categoryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    categoryMeta: { flex: 1 },
    categoryNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    categoryName: { fontSize: typography.sizes.md, fontFamily: typography.fonts.medium },
    changedDot: { width: 6, height: 6, borderRadius: 3 },
    categorySubtitle: { fontSize: typography.sizes.sm, marginTop: 2 },
    inputBox: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, paddingHorizontal: spacing.sm, height: 40, minWidth: 90 },
    rupee: { fontSize: typography.sizes.md, marginRight: 4 },
    input: { fontSize: typography.sizes.md, minWidth: 60, textAlign: 'right' },
    updateBtn: { fontSize: typography.sizes.md, fontFamily: typography.fonts.semibold },
});
