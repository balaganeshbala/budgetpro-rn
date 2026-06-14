import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { colors } from '../src/constants/theme';
import { supabase } from '../src/services/supabase';
import { useBudgetStore } from '../src/store/useBudgetStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [session, setSession] = useState(null);
  const [initialized, setInitialized] = useState(false);
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      useBudgetStore.setState({ userId: session?.user?.id ?? null });
      setSession(session);
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

  if (!initialized || (!fontsLoaded && !fontError)) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.cardBackground },
        headerTintColor: theme.text,
        headerTitleStyle: { color: theme.text },
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
      <Stack.Screen name="settings" options={{}} />
      <Stack.Screen name="add-major-expense" options={{ presentation: 'modal' }} />
      <Stack.Screen name="edit-major-expense" options={{ presentation: 'modal' }} />
      <Stack.Screen name="financial-goals" options={{ headerBackTitle: '' }} />
      <Stack.Screen name="financial-goal-details" options={{ headerBackButtonDisplayMode: 'minimal' }} />
      <Stack.Screen name="goal-contributions" options={{ headerBackButtonDisplayMode: 'minimal' }} />
      <Stack.Screen name="add-financial-goal" options={{ presentation: 'modal' }} />
      <Stack.Screen name="edit-financial-goal" options={{ presentation: 'modal' }} />
      <Stack.Screen name="add-contribution" options={{ presentation: 'modal' }} />
      <Stack.Screen name="edit-contribution" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
