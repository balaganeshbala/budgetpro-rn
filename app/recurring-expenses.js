import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TransactionRow } from '../src/components/TransactionRow';
import { CardView } from '../src/components/common/CardView';
import EmptyDataIndicatorView from '../src/components/EmptyDataIndicatorView';
import { getExpenseCategory } from '../src/constants/categories';
import { shortMonthNames } from '../src/constants/months';
import { colors, radius, spacing, typography } from '../src/constants/theme';
import { useBudgetStore } from '../src/store/useBudgetStore';

const fmt = (v) => '₹' + Math.round(v).toLocaleString('en-IN');

function ordinal(n) {
    const v = n % 100;
    return n + (['th', 'st', 'nd', 'rd'][(v - 20) % 10] || ['th', 'st', 'nd', 'rd'][v] || 'th');
}

function dueDateLabel(item) {
    if (!item.billing_day) return null;
    const day = ordinal(item.billing_day);
    if (item.frequency === 'yearly' && item.billing_month) {
        return `due ${shortMonthNames[item.billing_month - 1]} ${day}`;
    }
    return `due on the ${day}`;
}

export default function RecurringExpensesScreen() {
    const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const themeColors = colors[scheme];
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const userId = useBudgetStore(state => state.userId);
    const recurringExpenses = useBudgetStore(state => state.recurringExpenses);
    const recurringLoading = useBudgetStore(state => state.recurringLoading);
    const fetchRecurringExpenses = useBudgetStore(state => state.fetchRecurringExpenses);

    useEffect(() => {
        if (userId) fetchRecurringExpenses();
    }, [userId]);

    const { monthly, yearly, totalMonthly } = useMemo(() => {
        const monthly = recurringExpenses
            .filter(e => e.frequency === 'monthly')
            .sort((a, b) => (a.billing_day ?? 99) - (b.billing_day ?? 99));
        const yearly = recurringExpenses
            .filter(e => e.frequency === 'yearly')
            .sort((a, b) => {
                const mDiff = (a.billing_month ?? 99) - (b.billing_month ?? 99);
                return mDiff !== 0 ? mDiff : (a.billing_day ?? 99) - (b.billing_day ?? 99);
            });
        const monthlyTotal = monthly.reduce((s, e) => s + e.amount, 0);
        const yearlyMonthlyEquiv = yearly.reduce((s, e) => s + e.amount / 12, 0);
        return { monthly, yearly, totalMonthly: monthlyTotal + yearlyMonthlyEquiv };
    }, [recurringExpenses]);

    const renderItem = (item, isLast) => {
        const cat = getExpenseCategory(item.category);
        const due = dueDateLabel(item);
        const sub = due ? `${cat.displayName} · ${due}` : cat.displayName;
        return (
            <View key={item.id}>
                <TransactionRow
                    title={item.name}
                    amount={item.amount}
                    dateString={sub}
                    categoryIcon={cat.iconName}
                    iconColor={cat.color}
                    backgroundColor={cat.color + '25'}
                    iconShape="roundedRectangle"
                    showChevron={true}
                    onPress={() => router.push({ pathname: '/edit-recurring-expense', params: { item: JSON.stringify(item) } })}
                />
                {!isLast && <View style={[styles.divider, { backgroundColor: themeColors.separator }]} />}
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: themeColors.groupedBackground }]}>
            <Stack.Screen
                options={{
                    title: 'Recurring Expenses',
                    headerBackButtonDisplayMode: 'minimal',
                    headerStyle: { backgroundColor: themeColors.cardBackground },
                    headerTitleStyle: { color: themeColors.text, fontFamily: typography.fonts.medium },
                    headerRight: () => (
                        <TouchableOpacity onPress={() => router.push('/add-recurring-expense')} activeOpacity={0.7} style={styles.headerBtn}>
                            <Ionicons name="add-circle-outline" size={30} color={themeColors.primary} />
                        </TouchableOpacity>
                    ),
                }}
            />

            {recurringLoading && recurringExpenses.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator color={themeColors.primary} />
                </View>
            ) : recurringExpenses.length === 0 ? (
                <View style={styles.center}>
                    <EmptyDataIndicatorView
                        icon="repeat"
                        title="No Recurring Expenses"
                        bodyText="Track subscriptions, EMIs, and regular bills"
                    />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    overScrollMode="never"
                >
                    {/* Summary card */}
                    <CardView>
                        <Text style={[styles.summaryLabel, { color: themeColors.secondaryText }]}>Monthly Cost</Text>
                        <Text style={[styles.summaryTotal, { color: themeColors.text }]}>{fmt(totalMonthly)}<Text style={[styles.summaryUnit, { color: themeColors.secondaryText }]}>/mo</Text></Text>

                        {monthly.length > 0 && yearly.length > 0 && (
                            <View style={[styles.dividerLine, { backgroundColor: themeColors.separator }]} />
                        )}

                        {monthly.length > 0 && (
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryRowLabel, { color: themeColors.secondaryText }]}>
                                    Monthly · {monthly.length} {monthly.length === 1 ? 'item' : 'items'}
                                </Text>
                                <Text style={[styles.summaryRowValue, { color: themeColors.text }]}>
                                    {fmt(monthly.reduce((s, e) => s + e.amount, 0))}/mo
                                </Text>
                            </View>
                        )}

                        {yearly.length > 0 && (
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryRowLabel, { color: themeColors.secondaryText }]}>
                                    Yearly · {yearly.length} {yearly.length === 1 ? 'item' : 'items'}
                                </Text>
                                <Text style={[styles.summaryRowValue, { color: themeColors.text }]}>
                                    {fmt(yearly.reduce((s, e) => s + e.amount, 0))}/yr
                                </Text>
                            </View>
                        )}
                    </CardView>

                    {/* Monthly section */}
                    {monthly.length > 0 && (
                        <>
                            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Monthly</Text>
                            <CardView padding={0}>
                                {monthly.map((item, i) => renderItem(item, i === monthly.length - 1))}
                            </CardView>
                        </>
                    )}

                    {/* Yearly section */}
                    {yearly.length > 0 && (
                        <>
                            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Yearly</Text>
                            <CardView padding={0}>
                                {yearly.map((item, i) => renderItem(item, i === yearly.length - 1))}
                            </CardView>
                        </>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    headerBtn: { width: 37, alignItems: 'center' },
    scroll: { padding: spacing.lg, gap: spacing.md },
    summaryLabel: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.regular, marginBottom: spacing.xs },
    summaryTotal: { fontSize: 32, fontFamily: typography.fonts.bold },
    summaryUnit: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.regular },
    dividerLine: { height: StyleSheet.hairlineWidth, marginVertical: spacing.md },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
    summaryRowLabel: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.regular },
    summaryRowValue: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.semibold },
    sectionTitle: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.bold },
    divider: { height: StyleSheet.hairlineWidth, marginLeft: spacing.md + 40 + spacing.md },
    loadingCard: { borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center' },
});
