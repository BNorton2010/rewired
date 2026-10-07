import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { DemoLabel, IconButton, Label, Wordmark } from './components';
import { colors } from './theme';
export function TopBar() {
  const { width } = useWindowDimensions();
  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
    {width < 960 ? <Wordmark /> : <Label>A QUIETER KIND OF AMBITION</Label>}
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>{width >= 960 && <DemoLabel />}<IconButton name="settings" label="Edit preferences" color={colors.muted} size={19} onPress={() => router.push('/onboarding')} /></View>
  </View>;
}
