import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
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

const DONUT_SIZE = 100;
const DONUT_STROKE = 20;

const SAFE_GRADIENT = ['#C3DAFA', '#DAD7F7'];
const SPENT_GRADIENT = ['#496BF6', '#52AEF9'];

const SAFE_DOT_COLOR = SAFE_GRADIENT[0];
const SPENT_DOT_COLOR = SPENT_GRADIENT[0];

export default function DonutArc({ percentage = 0, size = 100, strokeWidth = 20, bgColor, centerColor }) {
  // 1. Clamp the percentage between 0 and 100
  const pct = Math.min(Math.max(percentage, 0), 100);

  // 2. Math for the SVG Circle
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate how much of the stroke is missing based on the percentage
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          {/* Safe Gradient (Track) */}
          <LinearGradient id="safeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={SAFE_GRADIENT[0]} />
            <Stop offset="100%" stopColor={SAFE_GRADIENT[1]} />
          </LinearGradient>
          
          {/* Spent Gradient (Progress) */}
          <LinearGradient id="spentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={SPENT_GRADIENT[0]} />
            <Stop offset="100%" stopColor={SPENT_GRADIENT[1]} />
          </LinearGradient>
        </Defs>

        {/* Layer 1: Background Track (Safe) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#safeGrad)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Layer 2: Progress Arc (Spent) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#spentGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="butt" // Change to "round" if you want rounded ends
          transform={`rotate(-90 ${size / 2} ${size / 2})`} // Rotates so 0% starts at 12 o'clock
        />
      </Svg>

      {/* Center Hole & Text Content */}
      <View
        style={{
          position: 'absolute',
          width: size - strokeWidth * 2,
          height: size - strokeWidth * 2,
          borderRadius: (size - strokeWidth * 2) / 2,
          backgroundColor: bgColor || 'transparent',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {centerColor && (
          <>
            <Text style={{ fontSize: 13, fontFamily: 'Manrope-Bold', color: centerColor, lineHeight: 16 }}>
              {Math.round(percentage)}%
            </Text>
            <Text style={{ fontSize: 9, fontFamily: 'Manrope-Medium', color: centerColor, opacity: 0.6, lineHeight: 12 }}>
              used
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

export const BudgetOverviewCard = ({ title = 'Budget', totalBudget, totalSpent, isLoading = false, isPastMonth = false, onCreateBudget, onEditBudget }) => {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];

  const remainingBudget = totalBudget - totalSpent;
  const isOverBudget = totalSpent > totalBudget;
  const usagePercentage = totalBudget > 0 ? Math.floor((totalSpent / totalBudget) * 100) : 0;

  const statusColor = isOverBudget
    ? themeColors.adaptiveRed
    : usagePercentage > 95
      ? themeColors.warning
      : themeColors.adaptiveGreen;

  const statusLabel = isOverBudget ? 'Over Budget' : usagePercentage > 95 ? 'Warning' : 'On Track';

  const formatAmount = (val) => `₹${Math.round(val).toLocaleString('en-IN')}`;

  return (
    <CardView style={{ borderRadius: 0 }} padding={spacing.lg}>
      {/* Header */}
      <View style={styles.headerRow}>
        <SectionHeader title={title} />
        {totalBudget > 0 && (
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: themeColors.primary + '15' }]}
            onPress={onEditBudget}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={14} color={themeColors.primary} />
            <Text style={[styles.editButtonText, { color: themeColors.primary }]}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <CardView style={styles.skeletonPanel}>
          {/* Left skeleton */}
          <View style={styles.skeletonLeft}>
            <SkeletonBox width={70} height={20} style={{ borderRadius: radius.pill }} />
            <SkeletonBox width={140} height={34} style={{ marginTop: spacing.sm }} />
            <SkeletonBox width={80} height={13} style={{ marginTop: 4 }} />
            <View style={[styles.skeletonDivider, { backgroundColor: themeColors.separator }]} />
            <SkeletonBox width={110} height={13} />
            <SkeletonBox width={110} height={13} style={{ marginTop: spacing.xs }} />
          </View>
          {/* Right skeleton — circle */}
          <View style={[styles.skeletonCircle, { borderColor: themeColors.separator }]} />
        </CardView>
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
        <CardView style={ styles.splitPanel }>
          {/* ── Left: remaining + details ── */}
          <View style={styles.leftCol}>
            {/* Status badge */}
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
            </View>

            {/* Big remaining amount */}
            <Text style={[styles.remainingAmount, { color: themeColors.text }]}>
              {formatAmount(Math.abs(remainingBudget))}
            </Text>
            <Text style={[styles.remainingLabel, { color: themeColors.secondaryText }]}>
              {isOverBudget ? 'Overspent' : 'Remaining'}
            </Text>

            <View style={[styles.detailDivider, { backgroundColor: themeColors.separator }]} />

            {/* Budget & Spent detail rows */}
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: themeColors.secondaryText }]}>Budget</Text>
              <Text style={[styles.detailAmount, { color: themeColors.text }]}>{formatAmount(totalBudget)}</Text>
            </View>
            <View style={[styles.detailRow, { marginTop: spacing.xs }]}>
              <Text style={[styles.detailLabel, { color: themeColors.secondaryText }]}>Spent</Text>
              <Text style={[styles.detailAmount, { color: themeColors.text }]}>{formatAmount(totalSpent)}</Text>
            </View>
          </View>

          {/* ── Vertical divider ── */}
          <View style={[styles.panelDivider, { backgroundColor: themeColors.separator }]} />

          {/* ── Right: liquid-fill gauge ── */}
          <View style={styles.rightCol}>
            <DonutArc
              percentage={usagePercentage}
              size={DONUT_SIZE}
              strokeWidth={DONUT_STROKE}
              bgColor={themeColors.cardBackground}
              centerColor={themeColors.text}
            />
            {/* <View style={[styles.ring, { borderColor: statusColor }]}>
              <View style={[
                styles.ringFill,
                { height: `${Math.min(usagePercentage, 100)}%`, backgroundColor: statusColor + '28' },
              ]} />
              <View style={styles.ringTextWrap}>
                <Text style={[styles.ringPercent, { color: themeColors.text }]}>
                  {usagePercentage}
                  <Text style={[styles.ringPercentSign, { color: themeColors.secondaryText }]}>%</Text>
                </Text>
                <Text style={[styles.ringLabel, { color: themeColors.secondaryText }]}>used</Text>
              </View>
            </View> */}
          </View>
        </CardView>
      )}
    </CardView>
  );
};

const RING_SIZE = 90;

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
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

  // ── Split panel ──
  splitPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg
  },
  leftCol: {
    flex: 1,
    gap: 0,
  },
  panelDivider: {
    width: 0,
    alignSelf: 'stretch',
    opacity: 0.5,
  },
  rightCol: {
    width: RING_SIZE + spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Status badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    gap: 5,
    marginBottom: spacing.sm,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
  },

  // Remaining
  remainingAmount: {
    fontSize: 28,
    fontFamily: typography.fonts.bold,
    lineHeight: 34,
  },
  remainingLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    marginTop: 2,
  },

  // Detail rows
  detailDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
  },
  detailAmount: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
  },

  // Liquid-fill gauge
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 3,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  ringTextWrap: {
    alignItems: 'center',
  },
  ringPercent: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.fonts.bold,
    lineHeight: 26,
  },
  ringPercentSign: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
  },
  ringLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    marginTop: 1,
  },

  // Skeleton
  skeletonPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  skeletonLeft: {
    flex: 1,
    gap: 0,
  },
  skeletonDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.md,
  },
  skeletonCircle: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 3,
  },
});
