import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Dimensions, FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../src/constants/theme';
import { useBudgetStore } from '../src/store/useBudgetStore';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    image: require('../src/assets/images/onboarding-1.png'),
    title: 'Know where your\nmoney goes',
    body: 'Log expenses and income in seconds. See exactly where every penny is spent, by category.',
  },
  {
    image: require('../src/assets/images/onboarding-2.png'),
    title: 'Spot trends,\nstay in control',
    body: 'See monthly spending trends and category breakdowns so you always know what\'s happening with your money.',
  },
  {
    image: require('../src/assets/images/onboarding-3.png'),
    title: 'Plan your\nfinancial future',
    body: 'Create savings goals, log contributions, and watch your progress grow.',
    imageMarginBottom: spacing.lg,
    imageMarginTop: -spacing.xxl,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems[0]) setCurrentIndex(viewableItems[0].index ?? 0);
  }, []);

  async function finish() {
    useBudgetStore.setState({ onboardingDone: true });
    await AsyncStorage.setItem('@onboarding_complete', 'true');
    router.replace('/login');
  }

  function goNext() {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      finish();
    }
  }

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={[styles.root, { backgroundColor: themeColors.groupedBackground }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={StyleSheet.absoluteFill}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Image
              source={item.image}
              style={[
                styles.illustration,
                item.imageMarginBottom != null && { marginBottom: item.imageMarginBottom },
                item.imageMarginTop != null && { marginTop: item.imageMarginTop },
              ]}
              contentFit="contain"
            />
            <Text style={[styles.title, { color: themeColors.text }]}>{item.title}</Text>
            <Text style={[styles.body, { color: themeColors.secondaryText }]}>{item.body}</Text>
          </View>
        )}
      />
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.skipRow} pointerEvents="box-none">
          {!isLast && (
            <TouchableOpacity onPress={finish} style={styles.skipBtn} activeOpacity={0.7}>
              <Text style={[styles.skipText, { color: themeColors.secondaryText }]}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.bottomSection}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: themeColors.tertiaryText },
                  i === currentIndex && { width: 24, backgroundColor: themeColors.secondary },
                ]}
              />
            ))}
          </View>
          <TouchableOpacity style={[styles.button, { backgroundColor: themeColors.primary }]} onPress={goNext} activeOpacity={0.85}>
            <Text style={[styles.buttonText, { color: themeColors.white }]}>
              {isLast ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  slide: {
    width,
    height,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingBottom: 160,
  },
  illustration: {
    width: 280,
    height: 280,
    marginBottom: spacing.xxxl,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Manrope-Bold',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: spacing.lg,
  },
  body: {
    fontSize: typography.sizes.md,
    fontFamily: 'Manrope-Regular',
    textAlign: 'center',
    lineHeight: 26,
  },
  overlay: { flex: 1, justifyContent: 'space-between' },
  skipRow: { alignItems: 'flex-end', paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  skipBtn: { padding: spacing.sm },
  skipText: {
    fontSize: typography.sizes.md,
    fontFamily: 'Manrope-SemiBold',
  },
  bottomSection: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  dot: { width: 8, height: 8, borderRadius: 4 },
  button: {
    paddingVertical: 16,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  buttonText: { fontSize: typography.sizes.md, fontFamily: 'Manrope-Bold' },
});
