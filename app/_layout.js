import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { Appearance, AppState, Modal, useColorScheme } from 'react-native';
import { LockScreen } from '../src/components/LockScreen';
import { colors, typography } from '../src/constants/theme';
import { supabase } from '../src/services/supabase';
import { useBudgetStore } from '../src/store/useBudgetStore';

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ fade: false });

export default function RootLayout() {
  const [session, setSession] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const onboardingDone = useBudgetStore(s => s.onboardingDone);
  // 'hidden' | 'privacy' (screen shown, no auth) | 'auth' (screen shown, auth required)
  const [lockState, setLockState] = useState('hidden');
  const backgroundTimeRef = useRef(null);
  const requireAuthRef = useRef(false);  // stays true until successful unlock
  const biometricEnabledRef = useRef(false); // kept in sync; read sync in inactive/background handlers
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const [fontsLoaded, fontError] = useFonts({
    'Manrope-Regular':  require('../src/assets/fonts/Manrope-Regular.ttf'),
    'Manrope-Light':    require('../src/assets/fonts/Manrope-Light.ttf'),
    'Manrope-Medium':   require('../src/assets/fonts/Manrope-Medium.ttf'),
    'Manrope-SemiBold': require('../src/assets/fonts/Manrope-SemiBold.ttf'),
    'Manrope-Bold':     require('../src/assets/fonts/Manrope-Bold.ttf'),
  });
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.getItem('@theme_preference').then(pref => {
      Appearance.setColorScheme(pref === 'light' || pref === 'dark' ? pref : null);
    });
  }, []);

  useEffect(() => {
    // Fast local reads — no network, unblocks home screen immediately
    Promise.all([
      AsyncStorage.getItem('@biometric_lock_enabled'),
      AsyncStorage.getItem('@onboarding_complete'),
      AsyncStorage.getItem('@cached_user_id'),
    ]).then(([biometricPref, onboardingPref, cachedUserId]) => {
      biometricEnabledRef.current = biometricPref === 'true';
      if (cachedUserId) {
        // Pre-warm: home screen can render cached data while session validates
        useBudgetStore.setState({ userId: cachedUserId });
        useBudgetStore.getState().fetchTransactions();
        if (biometricPref === 'true') {
          requireAuthRef.current = true;
          setLockState('auth');
        }
      }

      // Validate session in background (may do a network refresh if token expired)
      supabase.auth.getSession().then(({ data: { session } }) => {
        useBudgetStore.setState({
          onboardingDone: onboardingPref === 'true' || !!session,
          userId: session?.user?.id ?? null,
        });
        setSession(session);
        if (!session) {
          AsyncStorage.removeItem('@cached_user_id');
        } else if (biometricPref === 'true') {
          requireAuthRef.current = true;
          setLockState('auth');
        }
        setInitialized(true);
      });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        AsyncStorage.setItem('@cached_user_id', session.user.id);
      } else {
        AsyncStorage.removeItem('@cached_user_id');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Flush any queued writes from a previous offline session on startup
    NetInfo.fetch().then(state => {
      if (state.isConnected) useBudgetStore.getState().flushWriteQueue();
    });
  }, []);

  useEffect(() => {
    let prevConnected = true;
    const unsub = NetInfo.addEventListener(state => {
      const isConnected = !!state.isConnected;
      useBudgetStore.setState({ isOffline: !isConnected });
      if (!prevConnected && isConnected) {
        useBudgetStore.getState().flushWriteQueue();
      }
      prevConnected = isConnected;
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const isPublicRoute = ['login', 'signup', 'login-callback', 'onboarding'].includes(segments[0]);

    if (!session) {
      if (!onboardingDone && segments[0] !== 'onboarding') {
        router.replace('/onboarding');
      } else if (onboardingDone && inAuthGroup) {
        router.replace('/login');
      }
    } else if (session && isPublicRoute) {
      router.replace('/(tabs)');
    }
  }, [session, initialized, segments, onboardingDone]);

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'inactive' || nextState === 'background') {
        // Set background time on the first of inactive/background.
        // Android may only fire 'inactive' for the overview screen (no 'background' follows),
        // so we record the time here too — 'background' overwrites it with a nearly identical timestamp if it fires.
        if (!backgroundTimeRef.current) backgroundTimeRef.current = Date.now();
        // Show privacy screen immediately so app switcher never captures content
        if (biometricEnabledRef.current) {
          setLockState(s => s === 'auth' ? 'auth' : 'privacy');
        }
      } else if (nextState === 'active') {
        const backgroundedAt = backgroundTimeRef.current;
        backgroundTimeRef.current = null;

        // Re-read settings so changes made while backgrounded are respected
        const [enabled, timeout] = await Promise.all([
          AsyncStorage.getItem('@biometric_lock_enabled'),
          AsyncStorage.getItem('@biometric_lock_timeout'),
        ]);
        biometricEnabledRef.current = enabled === 'true';

        if (backgroundedAt === null) {
          if (!requireAuthRef.current) setLockState('hidden');
          return;
        }

        if (enabled !== 'true') {
          requireAuthRef.current = false;
          setLockState('hidden');
          return;
        }

        const elapsed = (Date.now() - backgroundedAt) / 1000;
        if (elapsed >= parseInt(timeout ?? '0', 10) || requireAuthRef.current) {
          requireAuthRef.current = true;
          setLockState('auth');
        } else {
          setLockState('hidden');
        }
      }
    });
    return () => sub.remove();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <>
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.cardBackground },
        headerTintColor: theme.text,
        headerTitleStyle: { color: theme.text, fontFamily: typography.fonts.medium },
      }}
    >
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false, title: '' }} />
      <Stack.Screen name="login" options={{ headerShown: false, title: '' }} />
      <Stack.Screen name="login-callback" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ title: '' }} />
      <Stack.Screen name="add-expense" options={{ presentation: 'modal', title: 'Add Expense' }} />
      <Stack.Screen name="add-income" options={{ presentation: 'modal', title: 'Add Income' }} />
      <Stack.Screen name="edit-expense" options={{ presentation: 'modal' }} />
      <Stack.Screen name="edit-income" options={{ presentation: 'modal' }} />
      <Stack.Screen name="expenses-detail" options={{}} />
      <Stack.Screen name="incomes-detail" options={{}} />
      <Stack.Screen name="create-budget" options={{}} />
      <Stack.Screen name="edit-budget" options={{ presentation: 'modal' }} />
      <Stack.Screen name="about" options={{ title: 'About Budget Pro', presentation: 'modal' }} />
      <Stack.Screen name="profile" options={{ title: 'Profile', headerBackButtonDisplayMode: 'minimal' }} />
      <Stack.Screen name="settings" options={{ headerBackButtonDisplayMode: 'minimal' }} />
      <Stack.Screen name="add-major-expense" options={{ presentation: 'modal' }} />
      <Stack.Screen name="edit-major-expense" options={{ presentation: 'modal' }} />
      <Stack.Screen name="financial-goals" options={{ headerBackButtonDisplayMode: 'minimal' }} />
      <Stack.Screen name="financial-goal-details" options={{ headerBackButtonDisplayMode: 'minimal' }} />
      <Stack.Screen name="goal-contributions" options={{ headerBackButtonDisplayMode: 'minimal' }} />
      <Stack.Screen name="add-financial-goal" options={{ presentation: 'modal' }} />
      <Stack.Screen name="edit-financial-goal" options={{ presentation: 'modal' }} />
      <Stack.Screen name="add-contribution" options={{ presentation: 'modal' }} />
      <Stack.Screen name="edit-contribution" options={{ presentation: 'modal' }} />
      <Stack.Screen name="add-recurring-expense" options={{ presentation: 'modal' }} />
      <Stack.Screen name="edit-recurring-expense" options={{ presentation: 'modal' }} />
    </Stack>
    <Modal visible={lockState !== 'hidden' && !!session} animationType="none" statusBarTranslucent>
      <LockScreen
        requireAuth={lockState === 'auth'}
        onUnlock={() => { requireAuthRef.current = false; setLockState('hidden'); }}
      />
    </Modal>
    </>
  );
}
