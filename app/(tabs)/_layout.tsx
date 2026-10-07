import React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Redirect, Tabs, router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/persistence/Store';
import { colors, fonts } from '../../src/ui/theme';
import { DemoLabel, Icon, Label, Wordmark, type IconName } from '../../src/ui/components';
import { MiniPlayer } from '../../src/ui/MiniPlayer';
import { CosmicArt } from '../../src/ui/CosmicArt';
const navigation: { name: string; label: string; href: '/' | '/library' | '/path'; icon: IconName }[] = [
  { name: 'index', label: 'Today', href: '/', icon: 'sun' }, { name: 'library', label: 'Library', href: '/library', icon: 'book-open' }, { name: 'path', label: 'My Path', href: '/path', icon: 'feather' },
];
function Nav({ vertical = false }: { vertical?: boolean }) {
  const pathname = usePathname();
  return <View style={{ flexDirection: vertical ? 'column' : 'row', gap: vertical ? 8 : 0 }}>{navigation.map(item => {
    const active = pathname === item.href;
    return <Pressable key={item.name} accessibilityRole="tab" accessibilityState={{ selected: active }} aria-selected={active} accessibilityLabel={item.label} onPress={() => router.navigate(item.href)} style={({ pressed }) => ({ flex: vertical ? undefined : 1, flexDirection: vertical ? 'row' : 'column', gap: vertical ? 13 : 6, alignItems: 'center', padding: vertical ? 16 : 11, minHeight: 62, borderRadius: 12, backgroundColor: vertical && active ? '#EEC6760C' : 'transparent', opacity: pressed ? .65 : 1 })}><Icon name={item.icon} size={vertical ? 19 : 21} color={active ? colors.gold : colors.muted} /><Text style={{ color: active ? colors.gold : colors.muted, fontFamily: active ? fonts.medium : fonts.body, fontSize: vertical ? 14 : 10 }}>{item.label}</Text></Pressable>;
  })}</View>;
}
export default function TabLayout() {
  const { state } = useStore();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const desktop = width >= 960;
  if (!state.onboarded) return <Redirect href="/onboarding" />;
  return <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg, paddingTop: insets.top }}>
    {desktop && <View style={{ width: 242, borderRightWidth: 1, borderColor: colors.line, paddingHorizontal: 23, paddingTop: 42, paddingBottom: 30 }}>
      <View style={{ gap: 10, marginBottom: 54 }}><Wordmark small /><Label style={{ fontSize: 8, letterSpacing: 1.5 }}>A QUIETER KIND OF AMBITION</Label></View>
      <Nav vertical />
      <View style={{ flex: 1 }} />
      <View style={{ gap: 18, marginBottom: 25 }}><CosmicArt kind="orbit" style={{ height: 128, borderRadius: 12 }} /><Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 27, lineHeight: 32 }}>A practice. A pause.{ '\n' }A return to yourself.</Text></View>
      <Pressable accessibilityRole="button" onPress={() => router.push('/onboarding')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}><Icon name="sliders" size={16} color={colors.muted} /><Text style={{ color: colors.muted, fontFamily: fonts.body, fontSize: 12 }}>Your preferences</Text></Pressable>
      <View style={{ marginTop: 18 }}><DemoLabel /></View>
    </View>}
    <View style={{ flex: 1 }}>
      <Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg }, animation: 'none' }} tabBar={() => <View style={{ paddingBottom: insets.bottom, backgroundColor: colors.bg }}><MiniPlayer />{!desktop && <View style={{ borderTopWidth: 1, borderColor: colors.line }}><Nav /></View>}</View>}>
        {navigation.map(item => <Tabs.Screen key={item.name} name={item.name} options={{ title: item.label }} />)}
      </Tabs>
    </View>
  </View>;
}
