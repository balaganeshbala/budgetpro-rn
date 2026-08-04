import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CardView } from '../src/components/common/CardView';
import { SectionHeader } from '../src/components/common/SectionHeader';
import { colors, radius, spacing, typography } from '../src/constants/theme';
import { goalService } from '../src/services/goalService';
import { useBudgetStore } from '../src/store/useBudgetStore';

const STATUS_COLORS = { active: '#34C759', paused: '#FF9500', completed: '#216DF3' };
const fmt = (v) => '₹' + Math.round(v).toLocaleString('en-IN');
const fmtDate = (s) => new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function FinancialGoalDetailsScreen() {
    const { goalId } = useLocalSearchParams();
    const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const themeColors = colors[scheme];
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const activeGoal = useBudgetStore(state => state.activeGoal);
    const setActiveGoal = useBudgetStore(state => state.setActiveGoal);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!goalId) return;
        setLoading(true);
        goalService.fetchGoalById(goalId)
            .then(data => setActiveGoal(data))
            .catch(e => Alert.alert('Error', e.message, [{ text: 'Go Back', onPress: () => router.back() }]))
            .finally(() => setLoading(false));
    }, [goalId]);

    if (loading || !activeGoal) {
        return (
            <View style={[styles.container, { backgroundColor: themeColors.groupedBackground }]}>
                <Stack.Screen options={{ title: 'Goal Details', headerBackButtonDisplayMode: 'minimal' }} />
                <View style={styles.center}><ActivityIndicator color={themeColors.primary} /></View>
            </View>
        );
    }

    const contributions = (activeGoal.goal_contributions || []).sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return b.id - a.id;
    });
    const currentAmount = contributions.reduce((sum, c) => sum + c.amount, 0);

    const nameGroups = (() => {
        const map = {};
        contributions.forEach(c => {
            if (!map[c.name]) map[c.name] = { name: c.name, count: 0, total: 0 };
            map[c.name].count += 1;
            map[c.name].total += c.amount;
        });
        return Object.values(map).sort((a, b) => b.total - a.total);
    })();
    const remaining = Math.max(0, activeGoal.target_amount - currentAmount);
    const progress = activeGoal.target_amount > 0 ? Math.min(currentAmount / activeGoal.target_amount, 1) : 0;
    const progressPct = Math.round(progress * 100);
    const goalColor = activeGoal.color_hex || '#216DF3';
    const statusColor = STATUS_COLORS[activeGoal.status] || '#216DF3';

    const today = new Date();
    const target = new Date(activeGoal.target_date + 'T00:00:00');
    const remainingMonths = (target.getFullYear() * 12 + target.getMonth()) - (today.getFullYear() * 12 + today.getMonth());
    const reqPerMonth = remainingMonths > 0 ? remaining / remainingMonths : remainingMonths === 0 ? remaining : 0;
    const monthsLeftLabel = remainingMonths > 0 ? `${remainingMonths} mo` : remainingMonths === 0 ? 'This month' : 'Overdue';
    const reqPerMonthLabel = remainingMonths >= 0 ? fmt(reqPerMonth) : '—';

    const distinctMonths = new Set(contributions.map(c => c.date.slice(0, 7))).size;
    const avgMonthly = distinctMonths > 0 ? currentAmount / distinctMonths : 0;
    const deficit = remainingMonths >= 0 && reqPerMonth > 0 ? Math.max(0, reqPerMonth - avgMonthly) : 0;
    const showBadge = activeGoal.status !== 'completed' && contributions.length > 0 && remainingMonths >= 0;
    const onTrack = avgMonthly >= reqPerMonth;

    return (
        <View style={[styles.container, { backgroundColor: themeColors.groupedBackground }]}>
            <Stack.Screen
                options={{
                    title: 'Goal Details',
                    headerBackButtonDisplayMode: 'minimal',
                    headerStyle: { backgroundColor: themeColors.cardBackground },
                    headerTitleStyle: { color: themeColors.text, fontFamily: typography.fonts.medium },
                    headerRight: () => (
                        <View style={styles.headerRight}>
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: '/edit-financial-goal', params: { goal: JSON.stringify(activeGoal) } })}
                            activeOpacity={0.7}
                        >
                            <Text style={{ color: themeColors.primary, fontFamily: typography.fonts.medium, fontSize: typography.sizes.md }}>
                                Edit
                            </Text>
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
                {/* Header Card */}
                <CardView>
                    <View style={styles.goalHeader}>
                        <View style={[styles.iconCircle, { backgroundColor: goalColor }]}>
                            <Text style={styles.iconEmoji}>{activeGoal.icon || '🎯'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.goalTitle, { color: themeColors.text }]}>{activeGoal.title}</Text>
                            <View style={[styles.statusPill, { backgroundColor: statusColor + '20' }]}>
                                <Text style={[styles.statusText, { color: statusColor }]}>{activeGoal.status}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: themeColors.separator }]} />

                    {/* Progress section */}
                    <View style={styles.progressSection}>
                        <View style={styles.progressHeader}>
                            <View style={styles.progressLeft}>
                                <Text style={[styles.progressPct, { color: themeColors.text }]}>{progressPct}%</Text>
                                <Text style={[styles.progressCompleted, { color: themeColors.secondaryText }]}>completed</Text>
                            </View>
                            {showBadge && (
                                <View style={[styles.trackBadge, { backgroundColor: onTrack ? '#34C75920' : '#FF950020' }]}>
                                    <Text style={[styles.trackBadgeText, { color: onTrack ? '#34C759' : '#FF9500' }]}>
                                        {onTrack ? 'On Track' : 'Behind'}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <View style={[styles.progressTrack, { backgroundColor: themeColors.separator }]}>
                            <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: goalColor }]} />
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: themeColors.separator }]} />

                    {/* Stats grid */}
                    <View style={styles.statsGrid}>
                        {[
                            { label: 'Target', value: fmt(activeGoal.target_amount), icon: 'flag-outline' },
                            { label: 'Saved', value: fmt(currentAmount), icon: 'cash-outline' },
                            { label: 'Remaining', value: fmt(remaining), icon: 'hourglass-outline' },
                            { label: 'Due Date', value: fmtDate(activeGoal.target_date), icon: 'calendar-outline' },
                            { label: 'Months Left', value: monthsLeftLabel, icon: 'timer-outline' },
                            { label: 'Req/Month', value: reqPerMonthLabel, icon: 'trending-up-outline' },
                            { label: 'Avg/Month', value: distinctMonths > 0 ? fmt(avgMonthly) : '—', icon: 'stats-chart-outline' },
                            { label: 'Deficit', value: deficit > 0 ? fmt(deficit) : '—', icon: 'trending-down-outline' },
                        ].map(({ label, value, icon }) => (
                            <View key={label} style={[styles.statItem, { backgroundColor: themeColors.groupedBackground }]}>
                                <Ionicons name={icon} size={18} color={themeColors.secondary} />
                                <Text style={[styles.statLabel, { color: themeColors.secondaryText }]}>{label}</Text>
                                <Text style={[styles.statValue, { color: themeColors.text }]}>{value}</Text>
                            </View>
                        ))}
                    </View>
                </CardView>

                {/* Contributions section */}
                <CardView padding={5}>
                    <View style={styles.cardHeader}>
                        <SectionHeader title="Contributions" />
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: '/add-contribution', params: { goalId: activeGoal.goal_id, goalTitle: activeGoal.title } })}
                            style={[styles.addBtn, { backgroundColor: themeColors.primary + '18' }]}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="add" size={16} color={themeColors.primary} />
                            <Text style={[styles.addBtnText, { color: themeColors.primary }]}>Add</Text>
                        </TouchableOpacity>
                    </View>

                    {contributions.length === 0 ? (
                        <Text style={[styles.emptyContributions, { color: themeColors.secondaryText }]}>
                            No contributions yet
                        </Text>
                    ) : (
                        <>
                            {contributions.slice(0, 5).map((c, idx) => (
                                <View key={c.id}>
                                    <TouchableOpacity
                                        style={styles.groupRow}
                                        activeOpacity={0.7}
                                        onPress={() => router.push({ pathname: '/edit-contribution', params: { contribution: JSON.stringify(c) } })}
                                    >
                                        <View>
                                            <Text style={[styles.groupMonth, { color: themeColors.text }]}>{c.name}</Text>
                                            <Text style={[styles.groupCount, { color: themeColors.secondaryText }]}>
                                                {new Date(c.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </Text>
                                        </View>
                                        <View style={styles.groupRowRight}>
                                            <Text style={styles.groupAmount}>+{fmt(c.amount)}</Text>
                                            <Ionicons name="chevron-forward" size={14} color={themeColors.tertiaryText} />
                                        </View>
                                    </TouchableOpacity>
                                    {idx < Math.min(contributions.length, 5) - 1 && (
                                        <View style={[styles.rowDivider, { backgroundColor: themeColors.separator }]} />
                                    )}
                                </View>
                            ))}
                            <View style={[styles.rowDivider, { backgroundColor: themeColors.separator }]} />
                            <TouchableOpacity
                                style={styles.viewAllBtn}
                                onPress={() => router.push('/goal-contributions')}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.viewAllText, { color: themeColors.primary }]}>View All</Text>
                                <Ionicons name="chevron-forward" size={12} color={themeColors.primary} />
                            </TouchableOpacity>
                        </>
                    )}
                </CardView>

                {/* By Name section */}
                {nameGroups.length > 0 && (
                    <CardView padding={5}>
                        <View style={[styles.cardHeader, { paddingBottom: 0 }]}>
                            <SectionHeader title="By Name" />
                        </View>
                        {nameGroups.map((group, idx) => (
                            <View key={group.name}>
                                <TouchableOpacity
                                    style={styles.groupRow}
                                    activeOpacity={0.7}
                                    onPress={() => router.push({ pathname: '/goal-contributions', params: { filterName: group.name } })}
                                >
                                    <View>
                                        <Text style={[styles.groupMonth, { color: themeColors.text }]}>{group.name}</Text>
                                        <Text style={[styles.groupCount, { color: themeColors.secondaryText }]}>
                                            {group.count} {group.count === 1 ? 'contribution' : 'contributions'}
                                        </Text>
                                    </View>
                                    <View style={styles.groupRowRight}>
                                        <Text style={styles.groupAmount}>+{fmt(group.total)}</Text>
                                        <Ionicons name="chevron-forward" size={14} color={themeColors.tertiaryText} />
                                    </View>
                                </TouchableOpacity>
                                {idx < nameGroups.length - 1 && (
                                    <View style={[styles.rowDivider, { backgroundColor: themeColors.separator }]} />
                                )}
                            </View>
                        ))}
                    </CardView>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    headerRight: { width: 50, alignItems: 'center' },
    scroll: { padding: spacing.lg, gap: spacing.md },
    goalHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
    iconCircle: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
    iconEmoji: { fontSize: 30 },
    goalTitle: { fontSize: typography.sizes.xl, fontFamily: typography.fonts.semibold, marginBottom: 4 },
    statusPill: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
    statusText: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.medium, textTransform: 'capitalize' },
    divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.md },
    progressSection: { marginBottom: spacing.xs },
    progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
    progressLeft: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
    progressPct: { fontSize: typography.sizes.xxxl, fontFamily: typography.fonts.bold },
    progressCompleted: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.medium },
    trackBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
    trackBadgeText: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.semibold },
    progressTrack: { height: 10, borderRadius: 5, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 5 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
    statItem: { width: '47.5%', borderRadius: radius.md, padding: spacing.md, alignItems: 'center', gap: 4 },
    statLabel: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.semibold },
    statValue: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.semibold, textAlign: 'center' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
    sectionTitle: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.bold },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill },
    addBtnText: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.semibold },
    emptyContributions: { textAlign: 'center', paddingVertical: spacing.xl, fontSize: typography.sizes.md },
    viewAllBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: spacing.lg, gap: 4 },
    viewAllText: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.semibold },
    groupRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
    groupRowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    groupMonth: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.semibold, marginBottom: 2 },
    groupCount: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.regular },
    groupAmount: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.semibold, color: '#34C759' },
    rowDivider: { height: StyleSheet.hairlineWidth, marginLeft: spacing.md },
});
