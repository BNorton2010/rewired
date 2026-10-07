import React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Redirect, Tabs, router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/persistence/Store';
import { colors } from '../../src/ui/theme';
import { Icon, Label, type IconName } from '../../src/ui/components';
import { MiniPlayer } from '../../src/ui/MiniPlayer';
import { CosmicArt } from '../../src/ui/CosmicArt';
const navigation: { name: string; label: string; href: '/' | '/library' | '/path'; icon: IconName }[] = [
  { name: 'index', label: 'Today', href: '/', icon: 'home' }, { name: 'library', label: 'Library', href: '/library', icon: 'headphones' }, { name: 'path', label: 'My Path', href: '/path', icon: 'feather' },
];
function Nav({ vertical = false }: { vertical?: boolean }) {
  const pathname = usePathname();
  return <View style={{ flexDirection: vertical ? 'column' : 'row', gap: vertical ? 10 : 0 }}>{navigation.map(item => {
    const active = pathname === item.href;
    return <Pressable key={item.name} accessibilityRole="tab" accessibilityState={{ selected: active }} aria-selected={active} accessibilityLabel={item.label} onPress={() => router.navigate(item.href)} style={({ pressed }) => ({ flex: vertical ? undefined : 1, flexDirection: vertical ? 'row' : 'column', gap: vertical ? 13 : 5, alignItems: 'center', padding: vertical ? 16 : 12, minHeight: 55, borderRadius: 13, backgroundColor: vertical && active ? '#EBC46E12' : 'transparent', opacity: pressed ? .65 : 1 })}><Icon name={item.icon} size={vertical ? 19 : 22} color={active ? colors.gold : colors.muted} /><Text style={{ color: active ? colors.gold : colors.muted, fontSize: vertical ? 15 : 11, fontWeight: active ? '700' : '500' }}>{item.label}</Text></Pressable>;
  })}</View>;
}
export default function TabLayout() {
  const { state } = useStore();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const desktop = width >= 960;
  if (!state.onboarded) return <Redirect href="/onboarding" />;
  return <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg, paddingTop: insets.top }}>
    {desktop && <View style={{ width: 234, borderRightWidth: 1, borderColor: colors.line, paddingHorizontal: 22, paddingVertical: 36 }}>
      <View style={{ gap: 8, marginBottom: 54, paddingHorizontal: 10 }}><Text style={{ color: colors.ink, fontSize: 20, fontWeight: '800', letterSpacing: 2 }}>RE-WIRED FM<Text style={{ color: colors.gold }}>.</Text></Text><Label style={{ fontSize: 8, letterSpacing: 2 }}>TUNE IN TO YOUR NEXT SELF</Label></View>
      <Nav vertical />
      <View style={{ flex: 1 }} />
      <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 16, overflow: 'hidden', marginBottom: 23 }}><CosmicArt kind="orbit" style={{ height: 115 }} /><View style={{ padding: 15, gap: 8 }}><Label style={{ color: colors.gold }}>A LITTLE, EVERY DAY</Label><Text style={{ color: colors.ink, fontSize: 15, lineHeight: 21 }}>A practice. A pause.{ '\n' }A return to yourself.</Text></View></View>
      <Pressable accessibilityRole="button" onPress={() => router.push('/onboarding')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 }}><Icon name="sliders" size={17} color={colors.muted} /><Text style={{ color: colors.muted, fontSize: 13 }}>Your preferences</Text></Pressable>
      <Label style={{ color: colors.teal, marginTop: 13, letterSpacing: 1.2 }}>LOCAL DEMO · FREE TO EXPLORE</Label>
    </View>}
    <View style={{ flex: 1 }}>
      <Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg }, animation: 'none' }} tabBar={() => <View style={{ paddingBottom: insets.bottom, backgroundColor: colors.bg }}><MiniPlayer />{!desktop && <View style={{ borderTopWidth: 1, borderColor: colors.line }}><Nav /></View>}</View>}>
        {navigation.map(item => <Tabs.Screen key={item.name} name={item.name} options={{ title: item.label }} />)}
      </Tabs>
    </View>
  </View>;
}
