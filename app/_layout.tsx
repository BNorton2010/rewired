import React from 'react';
import { ActivityIndicator, Text, View, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { StoreProvider, useStore } from '../src/persistence/Store';
import { AudioProvider } from '../src/audio/AudioProvider';
import { colors, fonts } from '../src/ui/theme';
function Root() {
  const { ready, storageError } = useStore();
  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond: require('../assets/fonts/CormorantGaramond-Medium.ttf'),
    DMSans: require('../assets/fonts/DMSans-Regular.ttf'),
    DMSansMedium: require('../assets/fonts/DMSans-Medium.ttf'),
    DMSansSemiBold: require('../assets/fonts/DMSans-SemiBold.ttf'),
  });
  // A font failure must not block listening. The platform falls back to its font.
  if (!ready || (!fontsLoaded && !fontError)) return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.gold} /><Text style={{ color: colors.muted, marginTop: 15 }}>Tuning in…</Text></View>;
  return <AudioProvider><StatusBar style="light" />
    {storageError && <Text accessibilityRole="alert" style={{ fontFamily: fonts.body, color: colors.gold, backgroundColor: colors.surface, padding: 16, paddingTop: Platform.OS === 'ios' ? 60 : 16 }}>{storageError}</Text>}
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'none' }}>
      <Stack.Screen name="(tabs)" /><Stack.Screen name="onboarding" /><Stack.Screen name="lesson/[id]" /><Stack.Screen name="player" options={{ presentation: 'modal' }} />
    </Stack>
  </AudioProvider>;
}
export default function Layout() { return <SafeAreaProvider><StoreProvider><Root /></StoreProvider></SafeAreaProvider>; }
