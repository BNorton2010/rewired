import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { IconButton, Label } from './components';
import { colors } from './theme';
export function TopBar() {
  const { width } = useWindowDimensions();
  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
    {width < 960 ? <View style={{ flex: 1, gap: 4 }}><Text style={{ fontSize: 20, fontWeight: '800', color: colors.ink, letterSpacing: 1.6 }}>RE-WIRED FM<Text style={{ color: colors.gold }}>.</Text></Text><Label style={{ color: colors.teal, fontSize: 9, letterSpacing: 1.1 }}>LOCAL DEMO</Label></View> : <Label>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}</Label>}
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>{width >= 960 && <View style={{ borderColor: '#72E2D540', borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}><Label style={{ color: colors.teal, fontSize: 9, letterSpacing: 1.1 }}>LOCAL DEMO</Label></View>}<IconButton name="sliders" label="Edit preferences" color={colors.muted} onPress={() => router.push('/onboarding')} /></View>
  </View>;
}
