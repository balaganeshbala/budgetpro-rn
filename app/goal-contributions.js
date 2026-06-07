import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CardView } from '../src/components/common/CardView';
import { useBudgetStore } from '../src/store/useBudgetStore';
import { colors, spacing, typography } from '../src/constants/theme';

const fmt = (v) => '₹' + Math.round(v).toLocaleString('en-IN');
const fmtDate = (s) => new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function GoalContributionsScreen() {
    const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const themeColors = colors[scheme];
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const activeGoal = useBudgetStore(state => state.activeGoal);

    const contributions = (activeGoal?.goal_contributions || []).sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return b.id - a.id;
    });

    const monthGroups = (() => {
        const map = {};
        contributions.forEach(c => {
            const key = c.date.slice(0, 7);
            if (!map[key]) map[key] = { key, items: [] };
            map[key].items.push(c);
        });
        return Object.values(map)
            .sort((a, b) => b.key.localeCompare(a.key))
            .map(g => ({
                ...g,
                label: new Date(g.key + '-02').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
                total: g.items.reduce((sum, c) => sum + c.amount, 0),
            }));
    })();

    return (
        <View style={[styles.container, { backgroundColor: themeColors.groupedBackground }]}>
            <Stack.Screen
                options={{
                    title: 'All Contributions',
                    headerBackButtonDisplayMode: 'minimal',
                    headerStyle: { backgroundColor: themeColors.cardBackground },
                    headerTintColor: themeColors.primary,
                    headerTitleStyle: { color: themeColors.text, fontFamily: typography.fonts.semibold },
                }}
            />

            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
            >
                {monthGroups.map(group => (
                    <View key={group.key}>
                        <View style={styles.monthHeader}>
                            <Text style={[styles.monthLabel, { color: themeColors.secondaryText }]}>{group.label}</Text>
                            <Text style={[styles.monthTotal, { color: themeColors.secondaryText }]}>+{fmt(group.total)}</Text>
                        </View>

                        <CardView padding={0}>
                            {group.items.map((c, idx) => (
                                <View key={c.id}>
                                    <TouchableOpacity
                                        style={styles.row}
                                        activeOpacity={0.7}
                                        onPress={() => router.push({
                                            pathname: '/edit-contribution',
                                            params: { contribution: JSON.stringify(c) },
                                        })}
                                    >
                                        <View style={[styles.dot, { backgroundColor: themeColors.primary + '30' }]}>
                                            <Ionicons name="arrow-up" size={14} color={themeColors.primary} />
                                        </View>
                                        <View style={styles.rowBody}>
                                            <Text style={[styles.rowName, { color: themeColors.text }]}>{c.name}</Text>
                                            <Text style={[styles.rowDate, { color: themeColors.secondaryText }]}>{fmtDate(c.date)}</Text>
                                        </View>
                                        <View style={styles.rowRight}>
                                            <Text style={styles.rowAmount}>+{fmt(c.amount)}</Text>
                                            <Ionicons name="chevron-forward" size={14} color={themeColors.tertiaryText} />
                                        </View>
                                    </TouchableOpacity>
                                    {idx < group.items.length - 1 && (
                                        <View style={[styles.divider, { backgroundColor: themeColors.separator }]} />
                                    )}
                                </View>
                            ))}
                        </CardView>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: spacing.lg, gap: spacing.md },
    monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
    monthLabel: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
    monthTotal: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.medium },
    row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
    dot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    rowBody: { flex: 1 },
    rowName: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.medium, marginBottom: 2 },
    rowDate: { fontSize: typography.sizes.xs },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    rowAmount: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.semibold, color: '#34C759' },
    divider: { height: StyleSheet.hairlineWidth, marginLeft: spacing.md + 32 + spacing.md },
});
