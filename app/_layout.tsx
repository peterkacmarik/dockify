import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Session } from '@supabase/supabase-js';
import { useFonts } from 'expo-font';
import { router, Slot, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import 'react-native-reanimated';

import { ThemeProvider } from '../src/contexts/ThemeContext';
import '../src/lib/i18n'; // Initialize i18n
import { supabase } from '../src/lib/supabase';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // Force cache refresh
  const [loaded] = useFonts({});
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  const segments = useSegments();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitializing(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (session && !inTabsGroup) {
      // If signed in and not in tabs group, redirect to tabs
      router.replace('/(tabs)');
    } else if (!session && !inAuthGroup) {
      // If not signed in and not in auth group, redirect to login
      router.replace('/(auth)/login');
    }
  }, [session, initializing, segments]);

  useEffect(() => {
    if (loaded && !initializing) {
      SplashScreen.hideAsync();
    }
  }, [loaded, initializing]);

  if (!loaded || initializing) {
    return null;
  }

  return (
    <ThemeProvider>
      <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Slot />
      </NavThemeProvider>
    </ThemeProvider>
  );
}
