import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import EmptyDataIndicatorView from './EmptyDataIndicatorView';
import { getExpenseCategory, getIncomeCategory } from '../constants/categories';
import { colors, radius, spacing, typography } from '../constants/theme';
import { TransactionRow } from './TransactionRow';
import { CardView } from './common/CardView';

const SegmentedControl = ({ tabs, selectedTab, onTabSelect, themeColors }) => {
    return (
        <View style={[segmentedStyles.container, { backgroundColor: themeColors.groupedBackground }]}>
            {tabs.map((tab) => {
                const isSelected = selectedTab === tab;
                return (
                    <TouchableOpacity
                        key={tab}
                        activeOpacity={0.8}
                        onPress={() => onTabSelect(tab)}
                        style={[
                            segmentedStyles.tabStyle,
                            isSelected && { backgroundColor: themeColors.cardBackground, ...segmentedStyles.activeTabStyle }
                        ]}
                    >
                        <Text style={[
                            segmentedStyles.tabTextStyle,
                            { color: themeColors.text },
                            isSelected && segmentedStyles.activeTabTextStyle
                        ]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

export default function TransactionsSection({ recentExpenses = [], recentIncomes = [], selectedMonth, selectedYear, selectedTab = 'Expenses', onTabChange }) {
    const router = useRouter();
    const tabs = ['Expenses', 'Incomes'];
    const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const themeColors = colors[scheme];

    const renderExpenses = () => {
        if (recentExpenses.length === 0) {
            return (
                <EmptyDataIndicatorView
                    icon="card-outline"
                    title="No Expenses Yet"
                    bodyText="Add your expense to track spending"
                    actionLabel="Add Expense"
                    onAction={() => router.push('/add-expense')}
                />
            );
        }

        const top5 = recentExpenses.slice(0, 5);

        return (
            <View style={styles.listContainer}>
                {top5.map((expense, index) => {
                    const isLast = index === top5.length - 1;
                    const category = getExpenseCategory(expense.category);
                    return (
                        <View key={expense.id?.toString() || index.toString()}>
                            <TransactionRow
                                title={expense.name}
                                amount={expense.amount}
                                dateString={new Date(expense.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                categoryIcon={category.iconName}
                                iconColor={themeColors.secondary}
                                backgroundColor={themeColors.primary + '20'}
                                iconShape="roundedRectangle"
                                showChevron={true}
                                onPress={() => router.push({ pathname: '/edit-expense', params: { transaction: JSON.stringify(expense) } })}
                            />
                            {!isLast && <View style={[styles.divider, { backgroundColor: themeColors.separator }]} />}
                        </View>
                    );
                })}

                <View style={[styles.divider, { backgroundColor: themeColors.separator }]} />
                <TouchableOpacity style={styles.moreDetailsButton} onPress={() => router.push('/expenses-detail')}>
                    <Text style={[styles.moreDetailsText, { color: themeColors.primary }]}>More Details</Text>
                    <Ionicons name="chevron-forward" size={12} color={themeColors.primary} />
                </TouchableOpacity>
            </View>
        );
    };

    const renderIncomes = () => {
        if (recentIncomes.length === 0) {
            return (
                <EmptyDataIndicatorView
                    icon="cash-outline"
                    title="No Incomes Yet"
                    bodyText="Add your income to track earnings"
                    actionLabel="Add Income"
                    onAction={() => router.push('/add-income')}
                />
            );
        }

        const top5 = recentIncomes.slice(0, 5);

        return (
            <View style={styles.listContainer}>
                {top5.map((income, index) => {
                    const isLast = index === top5.length - 1;
                    const category = getIncomeCategory(income.category);
                    return (
                        <View key={income.id?.toString() || index.toString()}>
                            <TransactionRow
                                title={income.source}
                                amount={income.amount}
                                dateString={new Date(income.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                categoryIcon={category.iconName}
                                iconColor={themeColors.secondary}
                                backgroundColor={themeColors.primary + '20'}
                                iconShape="roundedRectangle"
                                showChevron={true}
                                onPress={() => router.push({ pathname: '/edit-income', params: { transaction: JSON.stringify(income) } })}
                            />
                            {!isLast && <View style={[styles.divider, { backgroundColor: themeColors.separator }]} />}
                        </View>
                    );
                })}

                <View style={[styles.divider, { backgroundColor: themeColors.separator }]} />
                <TouchableOpacity style={styles.moreDetailsButton} onPress={() => router.push('/incomes-detail')}>
                    <Text style={[styles.moreDetailsText, { color: themeColors.primary }]}>More Details</Text>
                    <Ionicons name="chevron-forward" size={12} color={themeColors.primary} />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <CardView padding={0}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: themeColors.text }]}>Transactions</Text>

                <TouchableOpacity
                    style={[styles.addButtonLight, { backgroundColor: themeColors.primary + '15' }]}
                    onPress={() => {
                        if (selectedTab === 'Expenses') {
                            router.push('/add-expense');
                        } else {
                            router.push('/add-income');
                        }
                    }}
                >
                    <Ionicons name="add" size={14} color={themeColors.primary} />
                    <Text style={[styles.addButtonLightText, { color: themeColors.primary }]}>Add</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.segmentedControlWrapper}>
                <SegmentedControl
                    tabs={tabs}
                    selectedTab={selectedTab}
                    onTabSelect={onTabChange}
                    themeColors={themeColors}
                />
            </View>

            {selectedTab === 'Expenses' ? renderExpenses() : renderIncomes()}
        </CardView>
    );
}

const segmentedStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        borderRadius: radius.sm,
        padding: 2,
    },
    tabStyle: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.sm - 2,
    },
    activeTabStyle: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1.5,
        elevation: 1,
    },
    tabTextStyle: {
        fontSize: typography.sizes.sm,
        fontFamily: typography.fonts.medium,
    },
    activeTabTextStyle: {
        fontFamily: typography.fonts.semibold,
    }
});

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: typography.sizes.xl,
        fontFamily: typography.fonts.bold,
    },
    addButtonLight: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radius.pill,
        gap: 4,
    },
    addButtonLightText: {
        fontSize: typography.sizes.sm,
        fontFamily: typography.fonts.semibold,
    },
    segmentedControlWrapper: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    emptyContainer: {
        paddingVertical: spacing.xl,
        alignItems: 'center',
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        marginHorizontal: spacing.lg,
    },
    moreDetailsButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
        gap: 4,
    },
    moreDetailsText: {
        fontSize: typography.sizes.sm,
        fontFamily: typography.fonts.semibold,
    }
});
