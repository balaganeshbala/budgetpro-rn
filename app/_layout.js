import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { supabase } from '../src/services/supabase';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [session, setSession] = useState(null);
  const [initialized, setInitialized] = useState(false);

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
    supabase.auth.getSession().then(({ data: { session } }) => {
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
    const isPublicRoute = segments[0] === 'login' || segments[0] === 'signup';

    if (!session && inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (session && isPublicRoute) {
      // Redirect to tabs if authenticated but trying to access login/signup
      router.replace('/(tabs)');
    }
  }, [session, initialized, segments]);

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!initialized || (!fontsLoaded && !fontError)) return null;

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false, title: '' }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="add-expense" options={{ presentation: 'modal', title: 'Add Expense' }} />
      <Stack.Screen name="add-income" options={{ presentation: 'modal', title: 'Add Income' }} />
      <Stack.Screen name="edit-expense" options={{ presentation: 'modal' }} />
      <Stack.Screen name="edit-income" options={{ presentation: 'modal' }} />
      <Stack.Screen name="expenses-detail" options={{}} />
      <Stack.Screen name="incomes-detail" options={{}} />
      <Stack.Screen name="create-budget" options={{}} />
      <Stack.Screen name="edit-budget" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
