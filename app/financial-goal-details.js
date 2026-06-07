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

    const monthGroups = (() => {
        const map = {};
        contributions.forEach(c => {
            const key = c.date.slice(0, 7); // "2026-01"
            if (!map[key]) map[key] = { key, contributions: [], total: 0 };
            map[key].contributions.push(c);
            map[key].total += c.amount;
        });
        return Object.values(map)
            .sort((a, b) => b.key.localeCompare(a.key))
            .map(g => ({
                ...g,
                label: new Date(g.key + '-02').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
            }));
    })();
    const remaining = Math.max(0, activeGoal.target_amount - currentAmount);
    const progress = activeGoal.target_amount > 0 ? Math.min(currentAmount / activeGoal.target_amount, 1) : 0;
    const progressPct = Math.round(progress * 100);
    const goalColor = activeGoal.color_hex || '#216DF3';
    const statusColor = STATUS_COLORS[activeGoal.status] || '#216DF3';

    return (
        <View style={[styles.container, { backgroundColor: themeColors.groupedBackground }]}>
            <Stack.Screen
                options={{
                    title: 'Goal Details',
                    headerBackButtonDisplayMode: 'minimal',
                    headerStyle: { backgroundColor: themeColors.cardBackground },
                    headerTintColor: themeColors.primary,
                    headerTitleStyle: { color: themeColors.text, fontFamily: typography.fonts.semibold },
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
                            <Text style={[styles.progressPct, { color: themeColors.text }]}>{progressPct}%</Text>
                            <Text style={[styles.progressCompleted, { color: themeColors.secondaryText }]}>completed</Text>
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
                            { label: 'Current', value: fmt(currentAmount), icon: 'cash-outline' },
                            { label: 'Remaining', value: fmt(remaining), icon: 'hourglass-outline' },
                            { label: 'Date', value: fmtDate(activeGoal.target_date), icon: 'calendar-outline' },
                        ].map(({ label, value, icon }) => (
                            <View key={label} style={[styles.statItem, { backgroundColor: themeColors.groupedBackground }]}>
                                <Ionicons name={icon} size={14} color={themeColors.secondaryText} />
                                <Text style={[styles.statLabel, { color: themeColors.secondaryText }]}>{label}</Text>
                                <Text style={[styles.statValue, { color: themeColors.text }]}>{value}</Text>
                            </View>
                        ))}
                    </View>
                </CardView>

                {/* Contributions section */}
                <CardView padding={5}>
                    {/* Header */}
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
                            {monthGroups.map((group, idx) => (
                                <View key={group.key}>
                                    <View style={styles.groupRow}>
                                        <View>
                                            <Text style={[styles.groupMonth, { color: themeColors.text }]}>{group.label}</Text>
                                            <Text style={[styles.groupCount, { color: themeColors.secondaryText }]}>
                                                {group.contributions.length} {group.contributions.length === 1 ? 'contribution' : 'contributions'}
                                            </Text>
                                        </View>
                                        <Text style={styles.groupAmount}>+{fmt(group.total)}</Text>
                                    </View>
                                    {idx < monthGroups.length - 1 && (
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
    progressHeader: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, marginBottom: spacing.sm },
    progressPct: { fontSize: typography.sizes.xxxl, fontFamily: typography.fonts.bold },
    progressCompleted: { fontSize: typography.sizes.sm },
    progressTrack: { height: 10, borderRadius: 5, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 5 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    statItem: { width: '47.5%', borderRadius: radius.md, padding: spacing.md, alignItems: 'center', gap: 4 },
    statLabel: { fontSize: typography.sizes.xs },
    statValue: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.semibold, textAlign: 'center' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
    sectionTitle: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.bold },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill },
    addBtnText: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.semibold },
    emptyContributions: { textAlign: 'center', paddingVertical: spacing.xl, fontSize: typography.sizes.md },
    viewAllBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: spacing.lg, gap: 4 },
    viewAllText: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.semibold },
    groupRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
    groupMonth: { fontSize: typography.sizes.md, fontFamily: typography.fonts.semibold, marginBottom: 2 },
    groupCount: { fontSize: typography.sizes.xs },
    groupAmount: { fontSize: typography.sizes.md, fontFamily: typography.fonts.semibold, color: '#34C759' },
    rowDivider: { height: StyleSheet.hairlineWidth, marginLeft: spacing.md },
});
