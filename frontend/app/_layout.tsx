import React, { useEffect } from 'react';
import { AppState, View } from 'react-native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastHost } from '@/src/components/ToastHost';
import { actions, useStore } from '@/src/game/store';
import { colors } from '@/src/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  // Prewarm the app font and the Lucide icon font so icons render on first paint (Expo Go Android included).
  const [fontsLoaded, fontError] = useFonts({
    'Nunito-Regular': require('../assets/fonts/Nunito-Regular.ttf'),
    'Nunito-SemiBold': require('../assets/fonts/Nunito-SemiBold.ttf'),
    'Nunito-Bold': require('../assets/fonts/Nunito-Bold.ttf'),
    'Nunito-ExtraBold': require('../assets/fonts/Nunito-ExtraBold.ttf'),
    'Nunito-Black': require('../assets/fonts/Nunito-Black.ttf'),
    Lucide: require('@react-native-vector-icons/lucide/fonts/Lucide.ttf'),
  });
  const ready = useStore((s) => s.ready);
  const fontsReady = fontsLoaded || !!fontError;

  useEffect(() => { actions.boot(); }, []);
  useEffect(() => { if (fontsReady && ready) SplashScreen.hideAsync().catch(() => undefined); }, [fontsReady, ready]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background' || s === 'inactive') actions.onBackground();
      else if (s === 'active') actions.onForeground();
    });
    return () => sub.remove();
  }, []);

  if (!fontsReady || !ready) return <View style={{ flex: 1, backgroundColor: colors.surface }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.surface }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
        <ToastHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
