import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EmptyDataIndicatorView from '../src/components/EmptyDataIndicatorView';
import { TransactionRow } from '../src/components/TransactionRow';
import { CardView } from '../src/components/common/CardView';
import { getMajorExpenseCategory } from '../src/constants/categories';
import { colors, radius, spacing, typography } from '../src/constants/theme';
import { useBudgetStore } from '../src/store/useBudgetStore';

const START_YEAR = 2023;
const CURRENT_YEAR = new Date().getFullYear();

const YEARS = Array.from({ length: CURRENT_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i);

const YEAR_ROWS = [];
for (let i = 0; i < YEARS.length; i += 3) {
    const row = YEARS.slice(i, i + 3);
    while (row.length < 3) row.push(null);
    YEAR_ROWS.push(row);
}

export default function MajorExpensesScreen() {
    const insets = useSafeAreaInsets();
    const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const themeColors = colors[scheme];
    const router = useRouter();

    const userId = useBudgetStore(state => state.userId);
    const majorExpenses = useBudgetStore(state => state.majorExpenses);
    const totalMajorExpenses = useBudgetStore(state => state.totalMajorExpenses);
    const selectedMajorYear = useBudgetStore(state => state.selectedMajorYear);
    const majorExpensesLoading = useBudgetStore(state => state.majorExpensesLoading);
    const setSelectedMajorYear = useBudgetStore(state => state.setSelectedMajorYear);
    const fetchMajorExpenses = useBudgetStore(state => state.fetchMajorExpenses);

    const [pickerVisible, setPickerVisible] = useState(false);

    const categoryBreakdown = useMemo(() => {
        const byCategory = {};
        majorExpenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
        return Object.entries(byCategory)
            .map(([cat, amount]) => ({ cat, amount, categoryObj: getMajorExpenseCategory(cat) }))
            .sort((a, b) => b.amount - a.amount);
    }, [majorExpenses]);

    useEffect(() => {
        if (userId) fetchMajorExpenses();
    }, [userId]);

    const fmt = (v) => Math.round(v).toLocaleString('en-IN');

    return (
        <View style={[styles.container, { backgroundColor: themeColors.groupedBackground }]}>
            <Stack.Screen
                options={{
                    title: 'Major Expenses',
                    headerBackTitle: '',
                    headerStyle: { backgroundColor: themeColors.cardBackground },
                    headerTitleStyle: { color: themeColors.text, fontFamily: typography.fonts.medium },
                    headerRight: () => (
                        <View style={styles.headerRight}>
                            <TouchableOpacity onPress={() => router.push('/add-major-expense')} activeOpacity={0.7}>
                                <Ionicons name="add-circle-outline" size={30} color={themeColors.primary} />
                            </TouchableOpacity>
                        </View>
                    ),
                }}
            />

            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
            >
                {/* Year Picker */}
                <TouchableOpacity
                    onPress={() => setPickerVisible(true)}
                    style={[styles.yearButton, { borderColor: themeColors.separator, backgroundColor: themeColors.cardBackground }]}
                    activeOpacity={0.7}
                >
                    <Ionicons name="calendar" size={16} color={themeColors.primary} style={styles.calendarIcon} />
                    <Text style={[styles.yearButtonLabel, { color: themeColors.primary }]}>{selectedMajorYear}</Text>
                </TouchableOpacity>

                {/* Summary Card */}
                <CardView>
                    <Text style={[styles.totalLabel, { color: themeColors.secondaryText }]}>Total Major Expenses</Text>
                    <Text style={[styles.totalAmount, { color: themeColors.text }]}>₹{fmt(totalMajorExpenses)}</Text>

                    {categoryBreakdown.length > 0 && (
                        <>
                            <View style={[styles.dividerLine, { backgroundColor: themeColors.separator }]} />
                            <Text style={[styles.byCategory, { color: themeColors.secondaryText }]}>By Category</Text>
                            {categoryBreakdown.map(({ cat, amount, categoryObj }) => {
                                const pct = totalMajorExpenses > 0 ? ((amount / totalMajorExpenses) * 100).toFixed(1) : '0.0';
                                return (
                                    <View key={cat} style={styles.categoryRow}>
                                        <View style={[styles.categoryDot, { backgroundColor: categoryObj.color }]} />
                                        <Text style={[styles.categoryName, { color: themeColors.text }]}>{categoryObj.displayName}</Text>
                                        <View style={styles.categoryAmountCol}>
                                            <Text style={[styles.categoryAmount, { color: themeColors.text }]}>₹{fmt(amount)}</Text>
                                            <Text style={[styles.categoryPct, { color: themeColors.secondaryText }]}>{pct}%</Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </>
                    )}
                </CardView>

                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Major Expenses</Text>

                {majorExpensesLoading ? (
                    <View style={[styles.loadingCard, { backgroundColor: themeColors.cardBackground }]}>
                        <ActivityIndicator color={themeColors.primary} />
                    </View>
                ) : (
                    <CardView padding={0}>
                        {majorExpenses.length === 0 ? (
                            <EmptyDataIndicatorView
                                icon='wallet-outline'
                                title='No Major Expenses'
                                bodyText={'Tap + to record a major expense for ' + selectedMajorYear}
                            />
                        ) : (
                            majorExpenses.map((item, index) => {
                                const category = getMajorExpenseCategory(item.category);
                                const dateStr = new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
                                const isLast = index === majorExpenses.length - 1;
                                return (
                                    <View key={item.id?.toString()}>
                                        <TransactionRow
                                            title={item.name}
                                            amount={item.amount}
                                            dateString={`${category.displayName} • ${dateStr}`}
                                            categoryIcon={category.iconName}
                                            iconColor={category.color}
                                            backgroundColor={category.color + '25'}
                                            iconShape="roundedRectangle"
                                            showChevron={true}
                                            onPress={() => router.push({ pathname: '/edit-major-expense', params: { transaction: JSON.stringify(item) } })}
                                        />
                                        {!isLast && <View style={[styles.divider, { backgroundColor: themeColors.separator }]} />}
                                    </View>
                                );
                            })
                        )}
                    </CardView>
                )}
            </ScrollView>

            <Modal visible={pickerVisible} transparent onRequestClose={() => setPickerVisible(false)}>
                <Pressable style={styles.overlay} onPress={() => setPickerVisible(false)}>
                    <Pressable style={[styles.pickerCard, { backgroundColor: themeColors.cardBackground }]} onPress={() => {}}>
                        {YEAR_ROWS.map((row, rowIdx) => (
                            <View key={rowIdx} style={styles.yearRow}>
                                {row.map((year, colIdx) => {
                                    if (year === null) return <View key={colIdx} style={styles.yearCell} />;
                                    const isSelected = year === selectedMajorYear;
                                    return (
                                        <TouchableOpacity
                                            key={colIdx}
                                            onPress={() => { setSelectedMajorYear(year); setPickerVisible(false); }}
                                            activeOpacity={0.7}
                                            style={[styles.yearCell, isSelected && { backgroundColor: themeColors.primary }]}
                                        >
                                            <Text style={[
                                                styles.yearCellText,
                                                { color: isSelected ? '#FFFFFF' : themeColors.text },
                                            ]}>
                                                {year}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))}
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerRight: {
        width: 36,
        alignItems: 'center',
        gap: spacing.sm,
    },
    yearButton: {
        width: 100,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: radius.pill,
        borderWidth: 1,
        gap: 5
    },
    calendarIcon: { marginRight: spacing.xs },
    yearButtonLabel: { fontSize: typography.sizes.md, fontFamily: typography.fonts.semibold },
    scroll: { padding: spacing.lg, gap: spacing.md },
    totalLabel: { fontSize: typography.sizes.sm, marginBottom: spacing.xs, fontFamily: typography.fonts.regular },
    totalAmount: { fontSize: 32, fontFamily: typography.fonts.bold, marginBottom: spacing.lg },
    dividerLine: { height: StyleSheet.hairlineWidth, marginVertical: spacing.md },
    byCategory: { fontSize: typography.sizes.sm, marginBottom: spacing.md, fontFamily: typography.fonts.regular },
    categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
    categoryDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.md },
    categoryName: { flex: 1, fontSize: typography.sizes.md, fontFamily: typography.fonts.regular },
    categoryAmountCol: { alignItems: 'flex-end' },
    categoryAmount: { fontSize: typography.sizes.md, fontFamily: typography.fonts.semibold },
    categoryPct: { fontSize: typography.sizes.sm, marginTop: 2, fontFamily: typography.fonts.regular },
    sectionTitle: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.bold },
    loadingCard: { borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center' },
    emptyState: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
    emptyTitle: { fontSize: typography.sizes.md, fontFamily: typography.fonts.semibold },
    emptySubtitle: { fontSize: typography.sizes.sm, textAlign: 'center' },
    divider: { height: StyleSheet.hairlineWidth, marginLeft: spacing.md + 40 + spacing.md },
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
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    yearCell: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: radius.sm,
        alignItems: 'center',
    },
    yearCellText: {
        fontSize: typography.sizes.sm,
        fontFamily: typography.fonts.medium,
    },
});
