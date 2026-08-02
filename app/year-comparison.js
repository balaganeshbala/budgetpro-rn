import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CardView } from '../src/components/common/CardView';
import { RowItemIcon } from '../src/components/common/RowItemIcon';
import { SectionHeader } from '../src/components/common/SectionHeader';
import EmptyDataIndicatorView from '../src/components/EmptyDataIndicatorView';
import { shortMonthNames } from '../src/constants/months';
import { colors, spacing, typography } from '../src/constants/theme';
import { offlineCache } from '../src/services/offlineCache';
import { transactionService } from '../src/services/transactionService';
import { useBudgetStore } from '../src/store/useBudgetStore';

const MODES = ['Expenses', 'Income', 'Savings'];
const CHART_HEIGHT = 180;
const X_AXIS_HEIGHT = 28;
const Y_LABEL_WIDTH = 36;
const CHART_PAD_RIGHT = 8;

function getModeColor(mode, tc) {
  if (mode === 'Income') return tc.adaptiveGreen;
  if (mode === 'Expenses') return tc.adaptiveRed;
  return tc.primary;
}

function getValues(byYear, year, mode) {
  return Array.from({ length: 12 }, (_, i) => {
    const m = byYear[year]?.[i + 1];
    if (!m) return 0;
    if (mode === 'Income') return m.totalIncome;
    if (mode === 'Expenses') return m.totalExpense;
    return Math.max(0, m.savings);
  });
}

// ── Grouped Bar Chart ──────────────────────────────────────────────────────────

function YearBarChart({ byYear, currentYear, priorYear, mode, tc, onTouchActive }) {
  const [chartWidth, setChartWidth] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedBar, setSelectedBar] = useState(null); // 'prior' | 'current'

  const onTouchActiveRef = useRef(null);
  onTouchActiveRef.current = onTouchActive;

  const color = getModeColor(mode, tc);
  const currentValues = getValues(byYear, currentYear, mode);
  const priorValues = getValues(byYear, priorYear, mode);

  const maxVal = Math.max(1, ...currentValues, ...priorValues);
  const drawWidth = chartWidth - Y_LABEL_WIDTH - CHART_PAD_RIGHT;
  const groupWidth = drawWidth > 0 ? drawWidth / 12 : 0;
  const barWidth = Math.max(4, groupWidth * 0.35);
  const barGap = Math.max(2, groupWidth * 0.06);

  const groupCenterX = (i) => Y_LABEL_WIDTH + (i + 0.5) * groupWidth;
  const priorBarLeft = (i) => groupCenterX(i) - barGap / 2 - barWidth;
  const currentBarLeft = (i) => groupCenterX(i) + barGap / 2;
  const barH = (v) => (v / maxVal) * CHART_HEIGHT;

  const fmtY = (v) => {
    if (v >= 100000) return `₹${Math.round(v / 1000)}k`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(1)}k`;
    return `₹${Math.round(v)}`;
  };

  const activeGroupRef = useRef(null);
  const activeBarRef = useRef(null);
  const handleTouchRef = useRef(null);
  handleTouchRef.current = (x) => {
    if (groupWidth <= 0 || x < Y_LABEL_WIDTH) return;
    const idx = Math.max(0, Math.min(11, Math.floor((x - Y_LABEL_WIDTH) / groupWidth)));
    const bar = x < groupCenterX(idx) ? 'prior' : 'current';
    if (idx !== activeGroupRef.current || bar !== activeBarRef.current) {
      activeGroupRef.current = idx;
      activeBarRef.current = bar;
      setSelectedGroup(idx);
      setSelectedBar(bar);
      Haptics.selectionAsync();
    }
  };

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderGrant: (e) => { onTouchActiveRef.current?.(true); handleTouchRef.current(e.nativeEvent.locationX); },
    onPanResponderMove: (e) => handleTouchRef.current(e.nativeEvent.locationX),
    onPanResponderRelease: () => { onTouchActiveRef.current?.(false); activeGroupRef.current = null; activeBarRef.current = null; setSelectedGroup(null); setSelectedBar(null); },
    onPanResponderTerminate: () => { onTouchActiveRef.current?.(false); activeGroupRef.current = null; activeBarRef.current = null; setSelectedGroup(null); setSelectedBar(null); },
  })).current;

  const hasContent = chartWidth > 0 && groupWidth > 0;
  const sel = selectedGroup;
  const cornerR = Math.min(3, barWidth / 2);
  const TTIP_W = 96;

  return (
    <View
      onLayout={e => setChartWidth(e.nativeEvent.layout.width)}
      style={[styles.chartContainer, { height: CHART_HEIGHT + X_AXIS_HEIGHT }]}
      {...panResponder.panHandlers}
    >
      {hasContent && (
        <>
          {/* Y-axis grid lines + labels */}
          {[0, 0.5, 1].map((frac) => (
            <View key={frac}>
              <View style={[styles.gridLineH, {
                top: CHART_HEIGHT - frac * CHART_HEIGHT,
                left: Y_LABEL_WIDTH,
                backgroundColor: tc.separator,
                width: drawWidth + CHART_PAD_RIGHT,
              }]} />
              <Text style={[styles.yLabel, {
                color: tc.secondaryText,
                top: CHART_HEIGHT - frac * CHART_HEIGHT - 8,
              }]} numberOfLines={1}>
                {fmtY(frac * maxVal)}
              </Text>
            </View>
          ))}

          {/* Bars */}
          {Array.from({ length: 12 }, (_, i) => {
            const cv = currentValues[i];
            const pv = priorValues[i];
            const cvH = barH(cv);
            const pvH = barH(pv);
            const noneSelected = sel === null;
            const priorActive = sel === i && selectedBar === 'prior';
            const currentActive = sel === i && selectedBar === 'current';

            return (
              <View key={i}>
                {pvH > 0 && (
                  <View style={[styles.bar, {
                    left: priorBarLeft(i),
                    top: CHART_HEIGHT - pvH,
                    width: barWidth,
                    height: pvH,
                    backgroundColor: color + '55',
                    borderTopLeftRadius: cornerR,
                    borderTopRightRadius: cornerR,
                    opacity: noneSelected || priorActive ? 1 : 0.25,
                  }]} />
                )}
                {cvH > 0 && (
                  <View style={[styles.bar, {
                    left: currentBarLeft(i),
                    top: CHART_HEIGHT - cvH,
                    width: barWidth,
                    height: cvH,
                    backgroundColor: color,
                    borderTopLeftRadius: cornerR,
                    borderTopRightRadius: cornerR,
                    opacity: noneSelected || currentActive ? 1 : 0.25,
                  }]} />
                )}
              </View>
            );
          })}

          {/* X-axis labels */}
          {Array.from({ length: 12 }, (_, i) => (
            <Text key={i} style={[styles.axisLabel, {
              color: sel === i ? tc.text : tc.secondaryText,
              fontFamily: sel === i ? typography.fonts.semibold : typography.fonts.regular,
              left: groupCenterX(i) - 14,
              top: CHART_HEIGHT + 6,
            }]}>
              {shortMonthNames[i]}
            </Text>
          ))}

          {/* Tooltip — only for the touched bar */}
          {sel !== null && selectedBar !== null && (() => {
            const isPrior = selectedBar === 'prior';
            const val = isPrior ? priorValues[sel] : currentValues[sel];
            const year = isPrior ? priorYear : currentYear;
            if (val <= 0) return null;

            const cx = groupCenterX(sel);
            const tipLeft = isPrior
              ? Math.max(Y_LABEL_WIDTH, Math.min(cx - 4 - TTIP_W, chartWidth - TTIP_W))
              : Math.max(Y_LABEL_WIDTH, Math.min(cx + 4, chartWidth - TTIP_W));
            const tipTop = Math.max(4, CHART_HEIGHT - barH(val) - 44);

            return (
              <View style={[styles.tooltip, { left: tipLeft, top: tipTop, width: TTIP_W }]}>
                <Text style={styles.tooltipYear}>{year}</Text>
                <Text style={styles.tooltipAmount} numberOfLines={1}>₹{Math.round(val).toLocaleString('en-IN')}</Text>
              </View>
            );
          })()}
        </>
      )}
    </View>
  );
}

// ── Stat Row ─────────────────────────────────────────────────────────────────

function StatRow({ icon, iconColor, label, value, valueColor, tc, last }) {
  return (
    <View style={[styles.statRow, last && { marginBottom: 0 }]}>
      <RowItemIcon
        categoryIcon={icon}
        iconShape="circle"
        iconColor={iconColor}
        backgroundColor={iconColor + '22'}
      />
      <Text style={[styles.statLabel, { color: tc.text }]}>{label}</Text>
      <Text style={[styles.statValue, { color: valueColor ?? tc.text }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function YearComparisonScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const tc = colors[scheme];
  const userId = useBudgetStore(s => s.userId);
  const { width } = useWindowDimensions();
  const pagerRef = useRef(null);

  const [trendData, setTrendData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [chartActive, setChartActive] = useState(false);
  const [selectedCurrentYear, setSelectedCurrentYear] = useState(0);
  const [selectedPriorYear, setSelectedPriorYear] = useState(0);
  const [activeYearPicker, setActiveYearPicker] = useState(null); // 'current' | 'prior' | null

  useEffect(() => {
    if (!userId) return;
    (async () => {
      // 1. Show cached data immediately — no spinner if cache exists
      const cached = await offlineCache.loadSummaries();
      if (cached) {
        setTrendData(cached);
        setIsLoading(false);
      }

      // 2. Fetch fresh data in the background
      try {
        const data = await transactionService.fetchAllMonthlySummaries(userId);
        setTrendData(data);
        offlineCache.saveSummaries(data);
      } catch (e) {
        console.error(e);
      } finally {
        // Only clear spinner here if no cache was available to clear it earlier
        if (!cached) setIsLoading(false);
      }
    })();
  }, [userId]);

  useEffect(() => {
    const ys = [...new Set(trendData.map(d => d.year))].sort((a, b) => b - a);
    if (ys.length >= 2) {
      setSelectedCurrentYear(ys[0]);
      setSelectedPriorYear(ys[1]);
    }
  }, [trendData]);

  function scrollToPage(page) {
    pagerRef.current?.scrollTo({ x: page * width, animated: true });
    setCurrentPage(page);
  }

  function onPageChange(e) {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentPage(page);
  }

  // Group trend data by year → month
  const byYear = {};
  for (const d of trendData) {
    if (!byYear[d.year]) byYear[d.year] = {};
    byYear[d.year][d.month] = d;
  }

  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);
  const currentYear = selectedCurrentYear || years[0] || 0;
  const priorYear = selectedPriorYear || years[1] || 0;

  const hasData = trendData.some(d => d.totalExpense > 0 || d.totalIncome > 0);
  const fmt = (v) => `₹${Math.round(v).toLocaleString('en-IN')}`;
  const fmtSigned = (v) => `${v >= 0 ? '+' : '−'}₹${Math.round(Math.abs(v)).toLocaleString('en-IN')}`;

  return (
    <>
      <Stack.Screen options={{
        title: 'Year-over-Year',
        headerTitleStyle: { fontFamily: typography.fonts.medium },
        headerBackButtonDisplayMode: 'minimal',
      }} />

      {isLoading ? (
        <View style={[styles.centered, { backgroundColor: tc.groupedBackground }]}>
          <ActivityIndicator />
        </View>
      ) : !hasData || years.length < 2 ? (
        <View style={[styles.centered, { backgroundColor: tc.groupedBackground }]}>
          <EmptyDataIndicatorView
            icon="bar-chart-outline"
            title="No Data Yet"
            bodyText="Add expenses and income across two years to compare them"
          />
        </View>
      ) : (
        <View style={styles.flex}>
          {/* Mode tab bar */}
          <View style={[styles.tabBar, { backgroundColor: tc.cardBackground, borderBottomColor: tc.separator }]}>
            {MODES.map((mode, i) => {
              const active = i === currentPage;
              return (
                <TouchableOpacity
                  key={mode}
                  activeOpacity={0.8}
                  onPress={() => scrollToPage(i)}
                  style={[styles.tabItem, active && { borderBottomColor: tc.primary }]}
                >
                  <Text style={[styles.tabText, { color: active ? tc.primary : tc.secondaryText }, active && { fontFamily: typography.fonts.semibold }]}>
                    {mode}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Year picker bar */}
          <View style={[styles.yearBar, { backgroundColor: tc.cardBackground, borderBottomColor: tc.separator }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveYearPicker('current')}
              style={[styles.yearDropdown, { borderColor: tc.separator, backgroundColor: tc.groupedBackground }]}
            >
              <Text style={[styles.yearDropdownText, { color: tc.text }]}>{currentYear || '—'}</Text>
              <Ionicons name="chevron-down" size={14} color={tc.secondaryText} />
            </TouchableOpacity>
            <Text style={[styles.yearVs, { color: tc.secondaryText }]}>vs</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveYearPicker('prior')}
              style={[styles.yearDropdown, { borderColor: tc.separator, backgroundColor: tc.groupedBackground }]}
            >
              <Text style={[styles.yearDropdownText, { color: tc.text }]}>{priorYear || '—'}</Text>
              <Ionicons name="chevron-down" size={14} color={tc.secondaryText} />
            </TouchableOpacity>
          </View>

          {/* Horizontal pager */}
          <ScrollView
            ref={pagerRef}
            horizontal
            pagingEnabled
            scrollEnabled={!chartActive}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onPageChange}
            style={styles.pager}
            bounces={false}
          >
            {MODES.map(mode => {
              const color = getModeColor(mode, tc);
              const currentValues = getValues(byYear, currentYear, mode);
              const priorValues = getValues(byYear, priorYear, mode);
              const currentTotal = currentValues.reduce((s, v) => s + v, 0);
              const priorTotal = priorValues.reduce((s, v) => s + v, 0);
              const delta = currentTotal - priorTotal;
              const deltaPercent = priorTotal > 0 ? (delta / priorTotal) * 100 : null;
              const currentAvg = currentValues.filter(v => v > 0);
              const priorAvg = priorValues.filter(v => v > 0);
              const currentMonthlyAvg = currentAvg.length > 0 ? currentTotal / currentAvg.length : 0;
              const priorMonthlyAvg = priorAvg.length > 0 ? priorTotal / priorAvg.length : 0;
              const deltaColor = mode === 'Expenses'
                ? (delta <= 0 ? tc.adaptiveGreen : tc.adaptiveRed)
                : (delta >= 0 ? tc.adaptiveGreen : tc.adaptiveRed);
              const trendIcon = delta >= 0 ? 'trending-up-outline' : 'trending-down-outline';

              return (
                <ScrollView
                  key={mode}
                  style={[styles.page, { width, backgroundColor: tc.groupedBackground }]}
                  contentContainerStyle={[styles.pageContent, { paddingBottom: insets.bottom + 20 }]}
                  scrollEnabled={!chartActive}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  overScrollMode="never"
                >
                  {/* Chart card */}
                  <CardView>
                    <SectionHeader title={`${mode} Comparison`} style={{ marginBottom: spacing.md }} />

                    {/* Legend */}
                    <View style={styles.legend}>
                      <View style={[styles.legendSwatch, { backgroundColor: color + '55' }]} />
                      <Text style={[styles.legendText, { color: tc.secondaryText }]}>{priorYear}</Text>
                      <View style={[styles.legendSwatch, { backgroundColor: color, marginLeft: spacing.md }]} />
                      <Text style={[styles.legendText, { color: tc.secondaryText }]}>{currentYear}</Text>
                    </View>

                    <YearBarChart
                      byYear={byYear}
                      currentYear={currentYear}
                      priorYear={priorYear}
                      mode={mode}
                      tc={tc}
                      onTouchActive={setChartActive}
                    />
                  </CardView>

                  {/* Summary card */}
                  <CardView>
                    <SectionHeader title="Year Summary" style={{ marginBottom: spacing.lg }} />

                    {/* Table header */}
                    <View style={styles.tableRow}>
                      <View style={styles.tableLabelCol} />
                      <Text style={[styles.tableHeader, { color: color + '99' }]}>{priorYear}</Text>
                      <Text style={[styles.tableHeader, { color: color }]}>{currentYear}</Text>
                    </View>

                    <View style={[styles.tableDivider, { backgroundColor: tc.separator }]} />

                    {/* Total row */}
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableLabel, { color: tc.secondaryText }]}>Total</Text>
                      <Text style={[styles.tableCell, { color: tc.text }]} numberOfLines={1} adjustsFontSizeToFit>{fmt(priorTotal)}</Text>
                      <Text style={[styles.tableCell, { color: tc.text }]} numberOfLines={1} adjustsFontSizeToFit>{fmt(currentTotal)}</Text>
                    </View>

                    {/* Avg / Month row */}
                    <View style={[styles.tableRow, { marginBottom: 0 }]}>
                      <Text style={[styles.tableLabel, { color: tc.secondaryText }]}>Avg / Month</Text>
                      <Text style={[styles.tableCell, { color: tc.text }]} numberOfLines={1} adjustsFontSizeToFit>
                        {priorAvg.length > 0 ? fmt(priorMonthlyAvg) : '—'}
                      </Text>
                      <Text style={[styles.tableCell, { color: tc.text }]} numberOfLines={1} adjustsFontSizeToFit>
                        {currentAvg.length > 0 ? fmt(currentMonthlyAvg) : '—'}
                      </Text>
                    </View>

                    <View style={[styles.tableDivider, { backgroundColor: tc.separator, marginTop: spacing.lg }]} />

                    {/* Difference & Percentage as separate rows */}
                    <StatRow
                      icon={trendIcon}
                      iconColor={deltaColor}
                      label="Difference"
                      value={fmtSigned(delta)}
                      valueColor={deltaColor}
                      tc={tc}
                    />
                    <StatRow
                      icon="stats-chart-outline"
                      iconColor={deltaColor}
                      label="Percentage"
                      value={deltaPercent != null ? `${deltaPercent >= 0 ? '+' : ''}${deltaPercent.toFixed(1)}%` : '—'}
                      valueColor={deltaColor}
                      tc={tc}
                      last
                    />
                  </CardView>
                </ScrollView>
              );
            })}
          </ScrollView>

          {/* Year picker modal — shared across both dropdowns */}
          <Modal
            visible={activeYearPicker !== null}
            animationType="none"
            transparent
            onRequestClose={() => setActiveYearPicker(null)}
          >
            <TouchableWithoutFeedback onPress={() => setActiveYearPicker(null)}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={() => {}}>
                  <View style={[styles.modalContent, { backgroundColor: tc.cardBackground }]}>
                    <View style={styles.modalHeader}>
                      <Text style={[styles.modalTitle, { color: tc.text }]}>
                        {activeYearPicker === 'current' ? 'Year' : 'Compare Year'}
                      </Text>
                      <TouchableOpacity onPress={() => setActiveYearPicker(null)} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={tc.secondaryText} />
                      </TouchableOpacity>
                    </View>
                    {years.map(y => {
                      const isSelected = activeYearPicker === 'current' ? y === currentYear : y === priorYear;
                      return (
                        <TouchableOpacity
                          key={y}
                          style={[styles.optionItem, { borderBottomColor: tc.separator }]}
                          onPress={() => {
                            if (activeYearPicker === 'current') setSelectedCurrentYear(y);
                            else setSelectedPriorYear(y);
                            setActiveYearPicker(null);
                          }}
                        >
                          <Text style={[styles.optionText, { color: tc.text }]}>{y}</Text>
                          {isSelected && <Ionicons name="checkmark" size={24} color={tc.primary} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>
      )}
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center' },
  flex: { flex: 1 },

  tabBar: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tabItem: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -StyleSheet.hairlineWidth,
  },
  tabText: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.medium },

  pager: { flex: 1 },
  page: { flex: 1 },
  pageContent: { padding: spacing.lg, gap: spacing.md },

  yearBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  yearDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  yearDropdownText: { fontSize: typography.sizes.md, fontFamily: typography.fonts.semibold },
  yearVs: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.regular },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(150,150,150,0.4)',
    padding: spacing.xl,
  },
  modalContent: { width: '100%', borderRadius: 20, overflow: 'hidden' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    position: 'relative',
  },
  modalTitle: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.bold },
  closeButton: { position: 'absolute', right: spacing.xl },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: { fontSize: typography.sizes.md, fontFamily: typography.fonts.medium },

  legend: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.lg },
  legendSwatch: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.regular },

  chartContainer: { position: 'relative' },
  gridLineH: { position: 'absolute', height: StyleSheet.hairlineWidth, opacity: 0.6 },
  yLabel: {
    position: 'absolute',
    left: 0,
    width: Y_LABEL_WIDTH - 4,
    fontSize: 10,
    fontFamily: typography.fonts.regular,
    textAlign: 'right',
  },
  bar: { position: 'absolute' },
  axisLabel: { position: 'absolute', fontSize: 9, width: 28, textAlign: 'center' },

  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  tooltipYear: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontFamily: typography.fonts.medium,
  },
  tooltipAmount: {
    color: '#fff',
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.bold,
  },

  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statLabel: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.regular,
  },
  statValue: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.bold,
    maxWidth: 150,
    textAlign: 'right',
  },

  tableRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  tableLabelCol: { flex: 1.2 },
  tableLabel: { flex: 1.2, fontSize: typography.sizes.sm, fontFamily: typography.fonts.regular },
  tableHeader: { flex: 1, fontSize: typography.sizes.sm, fontFamily: typography.fonts.bold, textAlign: 'right' },
  tableCell: { flex: 1, fontSize: typography.sizes.sm, fontFamily: typography.fonts.semibold, textAlign: 'right' },
  tableDivider: { height: StyleSheet.hairlineWidth, marginBottom: spacing.lg },
});
