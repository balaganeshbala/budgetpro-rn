import AsyncStorage from '@react-native-async-storage/async-storage';
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

export default function RootLayout() {
  const [session, setSession] = useState(null);
  const [initialized, setInitialized] = useState(false);
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
    Promise.all([
      supabase.auth.getSession(),
      AsyncStorage.getItem('@biometric_lock_enabled'),
    ]).then(([{ data: { session } }, biometricPref]) => {
      biometricEnabledRef.current = biometricPref === 'true';
      useBudgetStore.setState({ userId: session?.user?.id ?? null });
      setSession(session);
      if (biometricPref === 'true' && session) {
        requireAuthRef.current = true;
        setLockState('auth');
      }
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const isPublicRoute = segments[0] === 'login' || segments[0] === 'signup' || segments[0] === 'login-callback';

    if (!session && inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (session && isPublicRoute) {
      // Redirect to tabs if authenticated but trying to access login/signup
      router.replace('/(tabs)');
    }
  }, [session, initialized, segments]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && initialized) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError, initialized]);

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

  if (!initialized || (!fontsLoaded && !fontError)) return null;

  return (
    <>
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.cardBackground },
        headerTintColor: theme.text,
        headerTitleStyle: { color: theme.text, fontFamily: typography.fonts.medium },
      }}
    >
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
