import React, { type ComponentProps } from 'react';
import { Pressable, Text, View, ScrollView, StyleSheet, useWindowDimensions, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from './theme';
export type IconName = ComponentProps<typeof Feather>['name'];
export const Icon = ({ name, size = 20, color = colors.ink }: { name: IconName; size?: number; color?: string }) => name === 'play' ? <Svg width={size} height={size} viewBox="0 0 24 24" aria-hidden><Path d="M6 3.8 Q6 2.5 7.5 3.4 L20 11 Q21.5 12 20 13 L7.5 20.6 Q6 21.5 6 20.2 Z" fill={color} /></Svg> : <Feather name={name} size={size} color={color} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden />;
export function Label({ children, style }: React.PropsWithChildren<{ style?: StyleProp<TextStyle> }>) { return <Text style={[styles.label, style]}>{children}</Text>; }
export function Body({ children, style }: React.PropsWithChildren<{ style?: StyleProp<TextStyle> }>) { return <Text style={[styles.body, style]}>{children}</Text>; }
export function Heading({ children, small = false, style }: React.PropsWithChildren<{ small?: boolean; style?: StyleProp<TextStyle> }>) { return <Text accessibilityRole="header" style={[styles.heading, small && { fontSize: 30, lineHeight: 34 }, style]}>{children}</Text>; }
export function Wordmark({ small = false }: { small?: boolean }) { return <Text style={{ color: colors.goldLight, fontFamily: fonts.display, fontSize: small ? 19 : 22, letterSpacing: small ? 3 : 3.8, flexShrink: 1 }}>RE-WIRED FM</Text>; }
export function DemoLabel() { return <View style={{ flexDirection: 'row', gap: 7, alignItems: 'center' }}><Label style={{ fontSize: 9, letterSpacing: 1.3 }}>LOCAL DEMO</Label><View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.gold }} /></View>; }
export function Button({ title, onPress, icon, secondary, disabled, testID }: { title: string; onPress: () => void; icon?: IconName; secondary?: boolean; disabled?: boolean; testID?: string }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled }} aria-disabled={disabled} testID={testID} onPress={onPress} disabled={disabled} style={({ pressed }) => ({ opacity: disabled ? .4 : pressed ? .8 : 1, borderRadius: 14, overflow: 'hidden', alignSelf: 'stretch' })}>
    <LinearGradient colors={secondary ? [colors.elevated, colors.surface] : ['#FFE1A0', '#E6AD50']} start={{ x: .15, y: 0 }} end={{ x: .75, y: 1 }} style={[styles.button, secondary && { borderWidth: 1, borderColor: colors.line }]}>
      {icon && <Icon name={icon} size={19} color={secondary ? colors.ink : colors.bg} />}<Text style={[styles.buttonText, secondary && { color: colors.ink }]}>{title}</Text>
    </LinearGradient>
  </Pressable>;
}
export function IconButton({ name, label, onPress, color, selected, size = 22, framed = false }: { name: IconName; label: string; onPress: () => void; color?: string; selected?: boolean; size?: number; framed?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={selected === undefined ? undefined : { selected }} aria-pressed={selected} onPress={onPress} style={({ pressed }) => ({ minWidth: 46, minHeight: 46, borderRadius: 24, alignItems: 'center', justifyContent: 'center', opacity: pressed ? .6 : 1, ...(framed ? { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface } : {}) })}><Icon name={name} size={size} color={color} /></Pressable>;
}
export function Pill({ title, selected, onPress, testID }: { title: string; selected?: boolean; onPress: () => void; testID?: string }) {
  return <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ selected: !!selected }} aria-pressed={!!selected} onPress={onPress} style={({ pressed }) => [styles.pill, selected && { backgroundColor: colors.gold, borderColor: colors.gold }, pressed && { opacity: .7 }]}><Text style={{ color: selected ? colors.bg : colors.muted, fontSize: 13, fontFamily: selected ? fonts.strong : fonts.body }}>{title}</Text></Pressable>;
}
export function Page({ children, style, transparent = false }: React.PropsWithChildren<{ style?: StyleProp<ViewStyle>; transparent?: boolean }>) {
  const { width } = useWindowDimensions();
  return <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1, backgroundColor: transparent ? 'transparent' : colors.bg }} contentContainerStyle={[{ padding: width > 760 ? 40 : 24, paddingTop: width > 760 ? 30 : 12, paddingBottom: 36, alignItems: 'center' }, style]}><View style={{ width: '100%', maxWidth: 1080, gap: 28 }}>{children}</View></ScrollView>;
}
export function SectionTitle({ title, right }: { title: string; right?: React.ReactNode }) { return <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}><Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>{right}</View>; }
export const styles = StyleSheet.create({
  label: { color: colors.muted, fontFamily: fonts.medium, fontSize: 10, letterSpacing: 1.8, lineHeight: 17 },
  body: { color: colors.muted, fontFamily: fonts.body, fontSize: 15, lineHeight: 24 },
  heading: { color: colors.ink, fontFamily: fonts.display, fontSize: 50, lineHeight: 51, letterSpacing: -1.2 },
  button: { minHeight: 52, paddingHorizontal: 22, paddingVertical: 14, flexDirection: 'row', gap: 11, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: '#FFE1A035' },
  buttonText: { color: colors.bg, fontFamily: fonts.strong, fontSize: 15, flexShrink: 1 },
  pill: { minHeight: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 18, paddingVertical: 11, justifyContent: 'center' },
  sectionTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 28, lineHeight: 33, flexShrink: 1 },
  card: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
});
