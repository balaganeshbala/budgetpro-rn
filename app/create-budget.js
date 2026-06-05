import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Alert, ScrollView,
    StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View
} from 'react-native';
import { EXPENSE_CATEGORIES } from '../src/constants/categories';
import { colors, radius, spacing, typography } from '../src/constants/theme';
import { useBudgetStore } from '../src/store/useBudgetStore';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

export default function CreateBudgetScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const saveBudgets = useBudgetStore(state => state.saveBudgets);
    const selectedMonth = useBudgetStore(state => state.selectedMonth);
    const selectedYear = useBudgetStore(state => state.selectedYear);

    const [amounts, setAmounts] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const themeColors = colors[scheme];

    const totalBudget = Object.values(amounts).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
    const fmt = (v) => Math.round(v).toLocaleString('en-IN');
    const monthLabel = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;

    const handleSave = async () => {
        const budgetData = EXPENSE_CATEGORIES.map(cat => ({
            category: cat.value,
            amount: parseFloat(amounts[cat.value]) || 0,
        }));

        setIsSaving(true);
        try {
            await saveBudgets(budgetData);
            router.back();
        } catch (e) {
            Alert.alert('Error', e.message || 'Failed to save budget');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Create Budget',
                    headerBackTitle: '',
                    headerRight: () => (
                        <TouchableOpacity onPress={handleSave} disabled={isSaving} style={{ padding: 8 }}>
                            <Text style={[styles.saveBtn, { color: themeColors.primary, opacity: isSaving ? 0.5 : 1 }]}>
                                {isSaving ? 'Saving…' : 'Save'}
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
                    {/* Description card */}
                    <View style={[styles.card, { backgroundColor: themeColors.cardBackground }]}>
                        <Text style={[styles.descTitle, { color: themeColors.secondaryText }]}>
                            Set your budget for {monthLabel}
                        </Text>
                        <Text style={[styles.descBody, { color: themeColors.secondaryText }]}>
                            Enter budget amounts for each category to track your spending throughout the month.
                        </Text>
                    </View>

                    {/* Total Budget */}
                    <View style={[styles.card, styles.totalRow, { backgroundColor: themeColors.cardBackground }]}>
                        <Text style={[styles.totalLabel, { color: themeColors.text }]}>Total Budget</Text>
                        <Text style={[styles.totalAmount, { color: themeColors.text }]}>₹{fmt(totalBudget)}</Text>
                    </View>

                    {/* Budget Categories */}
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Budget Categories</Text>

                    {EXPENSE_CATEGORIES.map(cat => {
                        const value = amounts[cat.value] || '';
                        const hasAmount = parseFloat(value) > 0;
                        return (
                            <View key={cat.value} style={[styles.card, styles.categoryRow, { backgroundColor: themeColors.cardBackground }]}>
                                <View style={[styles.iconCircle, { backgroundColor: cat.color + '25' }]}>
                                    <Ionicons name={cat.iconName} size={22} color={cat.color} />
                                </View>
                                <View style={styles.categoryMeta}>
                                    <Text style={[styles.categoryName, { color: themeColors.text }]}>{cat.displayName}</Text>
                                    <Text style={[styles.categorySubtitle, { color: themeColors.secondaryText }]}>
                                        {hasAmount ? `₹${fmt(parseFloat(value))}` : 'No budget set'}
                                    </Text>
                                </View>
                                <View style={[styles.inputBox, { borderColor: themeColors.separator }]}>
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
    descTitle: { fontSize: typography.sizes.md, marginBottom: spacing.xs },
    descBody: { fontSize: typography.sizes.sm, lineHeight: 20 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.bold },
    totalAmount: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.bold },
    sectionTitle: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.bold },
    categoryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    categoryMeta: { flex: 1 },
    categoryName: { fontSize: typography.sizes.md, fontFamily: typography.fonts.medium },
    categorySubtitle: { fontSize: typography.sizes.sm, marginTop: 2 },
    inputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.sm, height: 40, minWidth: 90 },
    rupee: { fontSize: typography.sizes.md, marginRight: 4 },
    input: { fontSize: typography.sizes.md, minWidth: 60, textAlign: 'right' },
    saveBtn: { fontSize: typography.sizes.md, fontFamily: typography.fonts.semibold },
});
