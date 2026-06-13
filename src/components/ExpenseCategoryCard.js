import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { radius, spacing, typography } from '../constants/theme';

export function ExpenseCategoryCard({ item, totalBudget, themeColors, onPress }) {
  const { categoryObj, spent, budget, remaining, status, progress } = item;
  const pct = totalBudget > 0 ? Math.round((budget / totalBudget) * 100) : 0;

  const pillConfig = {
    unplanned: { label: 'Unplanned', bg: themeColors.warning + '20', text: themeColors.warning },
    overspent: { label: 'Overspent', bg: themeColors.adaptiveRed + '20', text: themeColors.adaptiveRed },
    on_track:  { label: 'On Track',  bg: themeColors.adaptiveGreen + '20', text: themeColors.adaptiveGreen },
    no_budget: { label: 'No Budget', bg: themeColors.groupedBackground, text: themeColors.secondaryText },
  }[status];

  const progressColor = status === 'overspent' ? themeColors.adaptiveRed : themeColors.adaptiveGreen;
  const fmt = (v) => Math.round(v).toLocaleString('en-IN');
  const showProgress = (status === 'overspent' || status === 'on_track');
  const showBudgetRow = status !== 'unplanned';

  return (
    <TouchableOpacity style={styles.categoryCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.categoryCardHeader}>
        <View style={[styles.categoryIconCircle, { backgroundColor: categoryObj.color + '25' }]}>
          <Ionicons name={categoryObj.iconName} size={20} color={categoryObj.color} />
        </View>
        <View style={styles.categoryCardMeta}>
          <Text style={[styles.categoryCardName, { color: themeColors.text }]}>{categoryObj.displayName}</Text>
          <Text style={[styles.categoryCardPct, { color: themeColors.secondaryText }]}>
            {status === 'unplanned' ? 'No budget set' : `${pct}% of total budget`}
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: pillConfig.bg }]}>
          <Text style={[styles.pillText, { color: pillConfig.text }]}>{pillConfig.label}</Text>
        </View>
      </View>

      {showBudgetRow && (
        <View style={styles.categoryCardStats}>
          <View>
            <Text style={[styles.statLabel, { color: themeColors.secondaryText }]}>Budget</Text>
            <Text style={[styles.statValue, { color: themeColors.text }]}>₹{fmt(budget)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.statLabel, { color: themeColors.secondaryText }]}>Remaining</Text>
            <Text style={[styles.statValue, { color: status === 'overspent' ? themeColors.adaptiveRed : themeColors.text }]}>
              {status === 'overspent' ? '-' : ''}₹{fmt(Math.abs(remaining))}
            </Text>
          </View>
        </View>
      )}

      {!showBudgetRow && (
        <View>
          <Text style={[styles.statLabel, { color: themeColors.secondaryText }]}>Spent</Text>
          <Text style={[styles.statValue, { color: themeColors.warning }]}>₹{fmt(spent)}</Text>
        </View>
      )}

      {showProgress && (
        <View style={[styles.progressTrack, { backgroundColor: themeColors.groupedBackground }]}>
          <View style={[styles.progressFill, { backgroundColor: progressColor, width: `${Math.min(progress * 100, 100)}%` }]} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  categoryCard: { gap: spacing.md, paddingTop: spacing.lg },
  categoryCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  categoryIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  categoryCardMeta: { flex: 1 },
  categoryCardName: { fontSize: typography.sizes.md, fontFamily: typography.fonts.semibold },
  categoryCardPct: { fontSize: typography.sizes.sm, marginTop: 2 },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  pillText: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.semibold },
  categoryCardStats: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { fontSize: typography.sizes.sm },
  statValue: { fontSize: typography.sizes.md, fontFamily: typography.fonts.semibold, marginTop: 2 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
});
