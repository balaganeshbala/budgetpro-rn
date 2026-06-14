import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CardView } from '../src/components/common/CardView';
import EmptyDataIndicatorView from '../src/components/EmptyDataIndicatorView';
import { colors, radius, spacing, typography } from '../src/constants/theme';
import { useBudgetStore } from '../src/store/useBudgetStore';

const STATUS_COLORS = { active: '#34C759', paused: '#FF9500', completed: '#216DF3' };
const fmt = (v) => '₹' + Math.round(v).toLocaleString('en-IN');

function GoalCard({ goal, onPress }) {
    const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const themeColors = colors[scheme];

    const currentAmount = (goal.goal_contributions || []).reduce((sum, c) => sum + c.amount, 0);
    const progress = goal.target_amount > 0 ? Math.min(currentAmount / goal.target_amount, 1) : 0;
    const statusColor = STATUS_COLORS[goal.status] || '#216DF3';
    const goalColor = goal.color_hex || '#216DF3';
    const targetDateStr = new Date(goal.target_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
            <CardView>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>{goal.icon || '🎯'}</Text>
                    <Text style={[styles.cardTitle, { color: themeColors.text }]}>{goal.title}</Text>
                    <View style={[styles.statusPill, { backgroundColor: statusColor + '20' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{goal.status}</Text>
                    </View>
                </View>

                <View style={[styles.progressTrack, { backgroundColor: themeColors.separator }]}>
                    <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: goalColor }]} />
                </View>

                <View style={styles.cardAmounts}>
                    <View>
                        <Text style={[styles.amountLabel, { color: themeColors.secondaryText }]}>Current</Text>
                        <Text style={[styles.amountValue, { color: themeColors.text }]}>{fmt(currentAmount)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.amountLabel, { color: themeColors.secondaryText }]}>Target</Text>
                        <Text style={[styles.amountValue, { color: themeColors.text }]}>{fmt(goal.target_amount)}</Text>
                    </View>
                </View>

                <View style={styles.cardDate}>
                    <Ionicons name="calendar-outline" size={12} color={themeColors.secondaryText} />
                    <Text style={[styles.dateText, { color: themeColors.secondaryText }]}>Target: {targetDateStr}</Text>
                </View>
            </CardView>
        </TouchableOpacity>
    );
}

export default function FinancialGoalsScreen() {
    const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const themeColors = colors[scheme];
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const userId = useBudgetStore(state => state.userId);
    const goals = useBudgetStore(state => state.goals);
    const goalsLoading = useBudgetStore(state => state.goalsLoading);
    const fetchGoals = useBudgetStore(state => state.fetchGoals);

    useEffect(() => {
        if (userId) fetchGoals();
    }, [userId]);

    return (
        <View style={[styles.container, { backgroundColor: themeColors.groupedBackground }]}>
            <Stack.Screen
                options={{
                    title: 'Financial Goals',
                    headerBackTitle: '',
                    headerStyle: { backgroundColor: themeColors.cardBackground },
                    headerTitleStyle: { color: themeColors.text, fontFamily: typography.fonts.medium },
                    headerRight: () => (
                        <View style={styles.headerRight}>
                            <TouchableOpacity onPress={() => router.push('/add-financial-goal')} activeOpacity={0.7}>
                                <Ionicons name="add-circle-outline" size={30} color={themeColors.primary} />
                            </TouchableOpacity>
                        </View>
                    ),
                }}
            />

            {goalsLoading && goals.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator color={themeColors.primary} />
                </View>
            ) : goals.length === 0 ? (
                <View style={styles.center}>
                    <EmptyDataIndicatorView
                    icon='golf'
                    title='No Financial Goals'
                    bodyText='Set up goals to track your savings and larger expenses'
                />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    overScrollMode="never"
                >
                    {goals.map(goal => (
                        <GoalCard
                            key={goal.goal_id}
                            goal={goal}
                            onPress={() => router.push({ pathname: '/financial-goal-details', params: { goalId: goal.goal_id } })}
                        />
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerRight: { width: 37, alignItems: 'center', gap: spacing.sm },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingHorizontal: spacing.xl },
    scroll: { padding: spacing.lg, gap: spacing.md },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
    cardIcon: { fontSize: 28, marginRight: spacing.sm },
    cardTitle: { flex: 1, fontSize: typography.sizes.lg, fontFamily: typography.fonts.semibold },
    statusPill: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm },
    statusText: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.medium, textTransform: 'capitalize' },
    progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: spacing.md },
    progressFill: { height: '100%', borderRadius: 4 },
    cardAmounts: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
    amountLabel: { fontSize: typography.sizes.xs, marginBottom: 2 },
    amountValue: { fontSize: typography.sizes.md, fontFamily: typography.fonts.medium },
    cardDate: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dateText: { fontSize: typography.sizes.xs },
    emptyTitle: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.semibold, textAlign: 'center' },
    emptySubtitle: { fontSize: typography.sizes.sm, textAlign: 'center' },
});
