import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, LayoutAnimation, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { colors, radius, spacing, typography } from '../constants/theme';
import { CardView } from './common/CardView';
import { SectionHeader } from './common/SectionHeader';
import EmptyDataIndicatorView from './EmptyDataIndicatorView';

const SkeletonBox = ({ width, height, style }) => {
  const opacity = useRef(new Animated.Value(0.4)).current;
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const bg = scheme === 'dark' ? '#3A3A3C' : '#E0E0E0';

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius.sm, backgroundColor: bg, opacity }, style]}
    />
  );
};


export const BudgetOverviewCard = ({ title = 'Budget', totalBudget, totalSpent, isLoading = false, isPastMonth = false, onCreateBudget, onEditBudget }) => {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];
  const [isExpanded, setIsExpanded] = useState(false);

  const remainingBudget = totalBudget - totalSpent;
  const isOverBudget = totalSpent > totalBudget;
  const usagePercentage = totalBudget > 0 ? Math.floor((totalSpent / totalBudget) * 100) : 0;

  const usageBasedColor = isOverBudget 
    ? themeColors.adaptiveRed 
    : usagePercentage > 80 
      ? themeColors.warning 
      : themeColors.adaptiveGreen;

  const spentBasedColor = isOverBudget ? themeColors.adaptiveRed : themeColors.text;

  const formatAmount = (val) => Math.round(val).toLocaleString('en-IN');

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <CardView padding={spacing.lg}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <SectionHeader title={title} />
          {totalBudget > 0 && (
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: themeColors.primary + '15' }]}
              onPress={onEditBudget}
            >
              <Ionicons name="pencil" size={14} color={themeColors.primary} />
              <Text style={[styles.editButtonText, { color: themeColors.primary }]}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <View style={styles.skeletonContainer}>
            <SkeletonBox width={80} height={14} />
            <SkeletonBox width={160} height={36} style={{ marginTop: spacing.xs }} />
            <View style={styles.skeletonDivider} />
            <View style={styles.skeletonStatsRow}>
              <View style={styles.skeletonStatBox}>
                <SkeletonBox width={70} height={12} />
                <SkeletonBox width={90} height={20} style={{ marginTop: 6 }} />
              </View>
              <View style={styles.skeletonStatBox}>
                <SkeletonBox width={70} height={12} />
                <SkeletonBox width={90} height={20} style={{ marginTop: 6 }} />
              </View>
            </View>
            <SkeletonBox width="100%" height={8} style={{ borderRadius: 4, marginTop: spacing.sm }} />
          </View>
        ) : totalBudget === 0 ? (
          isPastMonth ? (
            <EmptyDataIndicatorView
              icon="pie-chart-outline"
              title="No Budget Data Available"
              bodyText="Budget data for past months cannot be created. Please select the current month to set a budget."
            />
          ) : (
            <EmptyDataIndicatorView
              icon="pie-chart-outline"
              title="No Budget Created Yet"
              bodyText="Create your budget to track your expenses"
              actionLabel="Create Budget"
              onAction={onCreateBudget}
            />
          )
        ) : (
          <>
        <TouchableOpacity 
          style={styles.remainingSection} 
          activeOpacity={0.7} 
          onPress={toggleExpand}
        >
          <View>
            <Text style={[styles.remainingLabel, { color: themeColors.secondaryText }]}>
              {isOverBudget ? "Overspent" : "Remaining"}
            </Text>
            <Text style={[styles.remainingAmount, { color: spentBasedColor }]}>
              ₹{formatAmount(Math.abs(remainingBudget))}
            </Text>
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={24} 
            color={themeColors.secondaryText} 
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={[styles.divider, { backgroundColor: themeColors.separator }]} />

            {/* Total Budget & Spent */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: themeColors.secondaryText }]}>
                  Total Budget
                </Text>
                <Text style={[styles.statAmount, { color: themeColors.text }]}>
                  ₹{formatAmount(totalBudget)}
                </Text>
              </View>

              <View style={[styles.verticalDivider, { backgroundColor: themeColors.separator }]} />

              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: themeColors.secondaryText }]}>
                  Total Spent
                </Text>
                <Text style={[styles.statAmount, { color: themeColors.text }]}>
                  ₹{formatAmount(totalSpent)}
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            {totalBudget > 0 && (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={[styles.progressLabel, { color: themeColors.secondaryText }]}>
                    Budget Usage
                  </Text>
                  <Text style={[styles.progressPercent, { color: usageBasedColor }]}>
                    {usagePercentage}%
                  </Text>
                </View>

                <View style={[styles.progressBarBackground, { backgroundColor: themeColors.groupedBackground }]}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { 
                        backgroundColor: usageBasedColor,
                        width: `${Math.min(usagePercentage, 100)}%` 
                      }
                    ]} 
                  />
                </View>
              </View>
            )}
          </View>
        )}
          </>
        )}
      </View>
    </CardView>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.fonts.bold,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    gap: 4,
  },
  editButtonText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
  },
  remainingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remainingLabel: {
    fontSize: typography.sizes.md,
    marginBottom: spacing.xs,
  },
  remainingAmount: {
    fontSize: 32,
    fontFamily: typography.fonts.bold,
  },
  expandedContent: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  divider: {
    height: 1,
    width: '100%',
    opacity: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    gap: 4,
  },
  statLabel: {
    fontSize: typography.sizes.sm,
  },
  statAmount: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.semibold,
  },
  verticalDivider: {
    width: 1,
    height: 30,
    marginHorizontal: spacing.md,
    opacity: 0.5,
  },
  progressSection: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
  },
  progressPercent: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  skeletonContainer: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  skeletonDivider: {
    height: 1,
    backgroundColor: 'transparent',
    marginVertical: spacing.sm,
  },
  skeletonStatsRow: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  skeletonStatBox: {
    flex: 1,
  },
});
