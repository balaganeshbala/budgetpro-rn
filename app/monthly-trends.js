import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CardView } from '../src/components/common/CardView';
import { RowItemIcon } from '../src/components/common/RowItemIcon';
import { SectionHeader } from '../src/components/common/SectionHeader';
import EmptyDataIndicatorView from '../src/components/EmptyDataIndicatorView';
import { colors, radius, spacing, typography } from '../src/constants/theme';
import { transactionService } from '../src/services/transactionService';
import { useBudgetStore } from '../src/store/useBudgetStore';

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MODES = ['Expenses', 'Income', 'Savings'];
const CHART_HEIGHT = 180;
const X_AXIS_HEIGHT = 28;
const Y_LABEL_WIDTH = 40;
const CHART_PAD_RIGHT = 20;

function getModeColor(mode, tc) {
  if (mode === 'Income') return tc.adaptiveGreen;
  if (mode === 'Expenses') return tc.adaptiveRed;
  return tc.primary;
}

function getSavingsRateColor(rate, tc) {
  if (rate < 0) return tc.error;
  if (rate < 10) return tc.adaptiveRed;
  if (rate < 20) return tc.warning;
  return tc.adaptiveGreen;
}

// ── Line Chart ────────────────────────────────────────────────────────────────

function TrendLineChart({ data, mode, tc }) {
  const [chartWidth, setChartWidth] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const color = getModeColor(mode, tc);

  const values = data.map(d => Math.max(0,
    mode === 'Income' ? d.totalIncome :
    mode === 'Expenses' ? d.totalExpense :
    d.savings
  ));

  const maxVal = Math.max(0, ...values);
  const padding = maxVal * 0.15 || 1000;
  const yMin = 0;
  const yMax = maxVal + padding;
  const yRange = yMax - yMin;

  const drawWidth = chartWidth - Y_LABEL_WIDTH - CHART_PAD_RIGHT;
  const getX = (i) => data.length <= 1 ? Y_LABEL_WIDTH + drawWidth / 2 : Y_LABEL_WIDTH + (i / (data.length - 1)) * drawWidth;
  const getY = (v) => CHART_HEIGHT - ((v - yMin) / yRange) * CHART_HEIGHT;

  const fmtYLabel = (v) => {
    const abs = Math.abs(v);
    const sign = v < 0 ? '−' : '';
    if (abs >= 100000) return `${sign}₹${Math.round(abs / 1000)}k`;
    if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}k`;
    return `${sign}₹${Math.round(abs)}`;
  };

  const activeIndexRef = useRef(null);
  const handleTouchRef = useRef(null);
  handleTouchRef.current = (x) => {
    if (data.length <= 1 || drawWidth <= 0) return;
    const step = drawWidth / (data.length - 1);
    const idx = Math.max(0, Math.min(Math.round((x - Y_LABEL_WIDTH) / step), data.length - 1));
    if (idx !== activeIndexRef.current) {
      activeIndexRef.current = idx;
      setSelectedIndex(idx);
      Haptics.selectionAsync();
    }
  };

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderGrant: (e) => handleTouchRef.current(e.nativeEvent.locationX),
    onPanResponderMove: (e) => handleTouchRef.current(e.nativeEvent.locationX),
    onPanResponderRelease: () => { activeIndexRef.current = null; setSelectedIndex(null); },
    onPanResponderTerminate: () => { activeIndexRef.current = null; setSelectedIndex(null); },
  })).current;

  const labelInterval = data.length > 20 ? 6 : data.length > 12 ? 3 : data.length > 6 ? 2 : 1;
  const hasContent = chartWidth > 0 && data.length >= 2;
  const points = hasContent ? data.map((_, i) => ({ x: getX(i), y: getY(values[i]) })) : [];

  return (
    <View
      onLayout={e => setChartWidth(e.nativeEvent.layout.width)}
      style={[styles.chartContainer, { height: CHART_HEIGHT + X_AXIS_HEIGHT }]}
      {...panResponder.panHandlers}
    >
      {hasContent && (
        <>
          {/* Horizontal grid lines + Y-axis labels */}
          {[0, 0.5, 1].map((frac) => {
            const yVal = yMax - frac * yRange;
            return (
              <View key={frac}>
                <View
                  style={[styles.gridLineH, {
                    top: frac * CHART_HEIGHT,
                    left: Y_LABEL_WIDTH,
                    backgroundColor: tc.separator,
                    width: drawWidth + CHART_PAD_RIGHT,
                  }]}
                />
                <Text
                  style={[styles.yLabel, {
                    color: tc.secondaryText,
                    top: frac * CHART_HEIGHT - 8,
                  }]}
                  numberOfLines={1}
                >
                  {fmtYLabel(yVal)}
                </Text>
              </View>
            );
          })}

          {/* Vertical grid lines — one per data point */}
          {points.map((p, i) => (
            <View
              key={i}
              style={[styles.gridLineV, {
                left: p.x,
                backgroundColor: tc.separator,
                height: CHART_HEIGHT,
              }]}
            />
          ))}

          {/* Line segments */}
          {points.slice(0, -1).map((p, i) => {
            const next = points[i + 1];
            const dx = next.x - p.x;
            const dy = next.y - p.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            return (
              <View
                key={i}
                style={[styles.lineSegment, {
                  width: length + 2,
                  left: (p.x + next.x) / 2 - (length + 2) / 2,
                  top: (p.y + next.y) / 2 - 1.5,
                  backgroundColor: color,
                  transform: [{ rotate: `${angle}deg` }],
                }]}
              />
            );
          })}

          {/* Dots */}
          {points.map((p, i) => (
            <View
              key={i}
              style={[styles.dot, {
                backgroundColor: (selectedIndex === null || selectedIndex === i) ? color : 'transparent',
                left: p.x - 4,
                top: p.y - 4,
              }]}
            />
          ))}

          {/* Selected state */}
          {selectedIndex !== null && (
            <>
              <View style={[styles.indicatorLine, {
                backgroundColor: tc.tertiaryText,
                left: points[selectedIndex].x,
                height: CHART_HEIGHT,
              }]} />

              <View style={[styles.tooltip, {
                left: Math.max(Y_LABEL_WIDTH, Math.min(points[selectedIndex].x - 45, chartWidth - 90)),
                top: Math.max(4, points[selectedIndex].y - 52),
              }]}>
                <Text style={styles.tooltipMonth}>
                  {SHORT_MONTHS[data[selectedIndex].month - 1]} {data[selectedIndex].year}
                </Text>
                <Text style={styles.tooltipValue}>
                  ₹{Math.round(Math.abs(values[selectedIndex])).toLocaleString('en-IN')}
                </Text>
              </View>
            </>
          )}

          {/* X-axis labels */}
          {data.map((d, i) => {
            if (i !== 0 && i % labelInterval !== 0 && i !== data.length - 1) return null;
            return (
              <Text
                key={i}
                style={[styles.axisLabel, {
                  color: tc.secondaryText,
                  left: getX(i) - 20,
                  top: CHART_HEIGHT + 6,
                }]}
              >
                {SHORT_MONTHS[d.month - 1]} '{String(d.year).slice(2)}
              </Text>
            );
          })}
        </>
      )}
    </View>
  );
}

// ── Average Row ───────────────────────────────────────────────────────────────

function AvgRow({ icon, iconColor, title, value, valueColor, tc, last }) {
  return (
    <View style={[styles.avgRow, last && { marginBottom: 0 }]}>
      <RowItemIcon
        categoryIcon={icon}
        iconShape="circle"
        iconColor={iconColor}
        backgroundColor={iconColor + '22'}
      />
      <Text style={[styles.avgLabel, { color: tc.text }]}>{title}</Text>
      <Text style={[styles.avgValue, { color: valueColor }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function MonthlyTrendsScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const tc = colors[scheme];
  const userId = useBudgetStore(s => s.userId);

  const [trendData, setTrendData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMode, setSelectedMode] = useState('Expenses');

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const data = await transactionService.fetchMonthlyTrends(userId);
        setTrendData(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [userId]);

  const incomeMonths = trendData.filter(d => d.totalIncome > 0);
  const expenseMonths = trendData.filter(d => d.totalExpense > 0);
  const savingsMonths = trendData.filter(d => d.savings > 0);

  const avgIncome = incomeMonths.length ? incomeMonths.reduce((s, d) => s + d.totalIncome, 0) / incomeMonths.length : 0;
  const avgExpense = expenseMonths.length ? expenseMonths.reduce((s, d) => s + d.totalExpense, 0) / expenseMonths.length : 0;
  const avgSavings = savingsMonths.length ? savingsMonths.reduce((s, d) => s + d.savings, 0) / savingsMonths.length : 0;
  const avgSavingsRate = avgIncome > 0 ? (avgSavings / avgIncome) * 100 : 0;

  const hasData = trendData.some(d => d.totalExpense > 0 || d.totalIncome > 0);

  const fmt = (v) => `₹${Math.round(v).toLocaleString('en-IN')}`;
  const fmtSigned = (v) => `${v >= 0 ? '+' : '−'}₹${Math.round(Math.abs(v)).toLocaleString('en-IN')}`;

  return (
    <>
      <Stack.Screen options={{ title: 'Monthly Trends', headerTitleStyle: { fontFamily: typography.fonts.medium }, headerBackTitle: '' }} />

      {isLoading ? (
        <View style={[styles.centered, { backgroundColor: tc.groupedBackground }]}>
          <ActivityIndicator />
        </View>
      ) : !hasData ? (
        <View style={[styles.centered, { backgroundColor: tc.groupedBackground }]}>
          <EmptyDataIndicatorView
            icon="trending-up"
            title="No Data Available"
            bodyText="Add some expenses and income to see your trends"
          />
        </View>
      ) : (
        <ScrollView
          style={{ backgroundColor: tc.groupedBackground }}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          {/* Segmented Picker */}
          <View style={[styles.segmentedContainer, { backgroundColor: tc.groupedBackground }]}>
            {MODES.map(mode => (
              <TouchableOpacity
                key={mode}
                style={[styles.segment, selectedMode === mode && { backgroundColor: tc.cardBackground, ...styles.activeSegment }]}
                onPress={() => setSelectedMode(mode)}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, {
                  color: selectedMode === mode ? tc.text : tc.secondaryText,
                  fontFamily: selectedMode === mode ? typography.fonts.semibold : typography.fonts.regular,
                }]}>
                  {mode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Trend Chart */}
          <CardView>
            <SectionHeader
              title={`${selectedMode} Trend`}
              subtitle="Last Two Years"
              style={{ marginBottom: spacing.xl }}
            />
            <TrendLineChart data={trendData} mode={selectedMode} tc={tc} />
          </CardView>

          {/* Monthly Averages */}
          <CardView>
            <SectionHeader
              title="Monthly Averages"
              subtitle="Active Months"
              style={{ marginBottom: spacing.xl }}
            />
            <AvgRow
              icon="add-circle-outline"
              iconColor={tc.adaptiveGreen}
              title="Income"
              value={fmt(avgIncome)}
              valueColor={tc.text}
              tc={tc}
            />
            <AvgRow
              icon="remove-circle-outline"
              iconColor={tc.adaptiveRed}
              title="Expenses"
              value={fmt(avgExpense)}
              valueColor={tc.text}
              tc={tc}
            />
            <AvgRow
              icon="briefcase-outline"
              iconColor={tc.secondary}
              title="Net Savings"
              value={fmtSigned(avgSavings)}
              valueColor={avgSavings >= 0 ? tc.adaptiveGreen : tc.error}
              tc={tc}
            />
            <AvgRow
              icon="analytics-outline"
              iconColor={getSavingsRateColor(avgSavingsRate, tc)}
              title="Savings Rate"
              value={`${avgSavingsRate.toFixed(1)}%`}
              valueColor={getSavingsRateColor(avgSavingsRate, tc)}
              tc={tc}
              last
            />
          </CardView>
        </ScrollView>
      )}
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center' },
  content: { padding: spacing.lg, gap: spacing.md },

  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: radius.sm,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm - 2,
  },
  activeSegment: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 1,
  },
  segmentText: {
    fontSize: typography.sizes.sm,
  },

  chartContainer: {
    position: 'relative',
  },
  gridLineH: {
    position: 'absolute',
    height: StyleSheet.hairlineWidth,
    opacity: 0.6,
  },
  yLabel: {
    position: 'absolute',
    left: 0,
    width: Y_LABEL_WIDTH - 4,
    fontSize: 10,
    fontFamily: typography.fonts.regular,
    textAlign: 'right',
  },
  gridLineV: {
    position: 'absolute',
    width: StyleSheet.hairlineWidth,
    opacity: 0.4,
  },
  lineSegment: {
    position: 'absolute',
    height: 3,
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  indicatorLine: {
    position: 'absolute',
    width: 1,
    top: 0,
    opacity: 0.5,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.82)',
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    width: 90,
  },
  tooltipMonth: {
    color: '#fff',
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.bold,
    textAlign: 'center',
  },
  tooltipValue: {
    color: '#fff',
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
    textAlign: 'center',
  },
  axisLabel: {
    position: 'absolute',
    fontSize: 10,
    fontFamily: typography.fonts.regular,
    width: 40,
    textAlign: 'center',
  },

  avgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  avgLabel: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.regular,
  },
  avgValue: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.bold,
    maxWidth: 130,
  },
});
