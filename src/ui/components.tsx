import React, { type ComponentProps } from 'react';
import { Pressable, Text, View, ScrollView, StyleSheet, useWindowDimensions, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from './theme';
export type IconName = ComponentProps<typeof Feather>['name'];
export const Icon = ({ name, size = 20, color = colors.ink }: { name: IconName; size?: number; color?: string }) => <Feather name={name} size={size} color={color} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden />;
export function Label({ children, style }: React.PropsWithChildren<{ style?: StyleProp<TextStyle> }>) { return <Text style={[styles.label, style]}>{children}</Text>; }
export function Body({ children, style }: React.PropsWithChildren<{ style?: StyleProp<TextStyle> }>) { return <Text style={[styles.body, style]}>{children}</Text>; }
export function Heading({ children, small = false, style }: React.PropsWithChildren<{ small?: boolean; style?: StyleProp<TextStyle> }>) { return <Text style={[styles.heading, small && { fontSize: 25, lineHeight: 31 }, style]}>{children}</Text>; }
export function Button({ title, onPress, icon, secondary, disabled, testID }: { title: string; onPress: () => void; icon?: IconName; secondary?: boolean; disabled?: boolean; testID?: string }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled }} aria-disabled={disabled} testID={testID} onPress={onPress} disabled={disabled} style={({ pressed }) => [{ opacity: disabled ? .4 : pressed ? .8 : 1, borderRadius: 30, overflow: 'hidden', alignSelf: 'stretch' }, styles.focus]}>
    <LinearGradient colors={secondary ? [colors.elevated, colors.elevated] : ['#F9DB94', '#E6B85C']} start={{ x: 0, y: 0 }} end={{ x: .6, y: 1 }} style={[styles.button, secondary && { borderWidth: 1, borderColor: colors.line }]}>
      {icon && <Icon name={icon} size={20} color={secondary ? colors.ink : colors.bg} />}<Text style={[styles.buttonText, secondary && { color: colors.ink }]}>{title}</Text>
    </LinearGradient>
  </Pressable>;
}
export function IconButton({ name, label, onPress, color, selected, size = 22 }: { name: IconName; label: string; onPress: () => void; color?: string; selected?: boolean; size?: number }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={selected === undefined ? undefined : { selected }} aria-pressed={selected} onPress={onPress} style={({ pressed }) => [{ minWidth: 46, minHeight: 46, alignItems: 'center', justifyContent: 'center', opacity: pressed ? .6 : 1 }, styles.focus]}><Icon name={name} size={size} color={color} /></Pressable>;
}
export function Pill({ title, selected, onPress, testID }: { title: string; selected?: boolean; onPress: () => void; testID?: string }) {
  return <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ selected: !!selected }} aria-pressed={!!selected} onPress={onPress} style={({ pressed }) => [styles.pill, selected && { backgroundColor: colors.gold, borderColor: colors.gold }, pressed && { opacity: .7 }, styles.focus]}><Text style={{ color: selected ? colors.bg : colors.ink, fontSize: 14, fontWeight: selected ? '700' : '500' }}>{title}</Text></Pressable>;
}
export function Page({ children, style, transparent = false }: React.PropsWithChildren<{ style?: StyleProp<ViewStyle>; transparent?: boolean }>) {
  const { width } = useWindowDimensions();
  return <ScrollView style={{ flex: 1, backgroundColor: transparent ? 'transparent' : colors.bg }} contentContainerStyle={[{ padding: width > 760 ? 38 : 22, paddingBottom: 36, alignItems: 'center' }, style]}><View style={{ width: '100%', maxWidth: 1120, gap: 26 }}>{children}</View></ScrollView>;
}
export function SectionTitle({ title, right }: { title: string; right?: React.ReactNode }) { return <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}><Text style={styles.sectionTitle}>{title}</Text>{right}</View>; }
export const styles = StyleSheet.create({
  label: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 2.1, lineHeight: 18 },
  body: { color: colors.muted, fontSize: 15, lineHeight: 24 },
  heading: { color: colors.ink, fontSize: 43, lineHeight: 48, fontWeight: '800', letterSpacing: -1.5 },
  button: { minHeight: 54, paddingHorizontal: 25, paddingVertical: 15, flexDirection: 'row', gap: 11, alignItems: 'center', justifyContent: 'center', borderRadius: 30 },
  buttonText: { color: colors.bg, fontWeight: '700', fontSize: 16, flexShrink: 1 },
  pill: { minHeight: 44, borderRadius: 24, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 18, paddingVertical: 12, justifyContent: 'center' },
  sectionTitle: { color: colors.ink, fontSize: 21, fontWeight: '700', letterSpacing: -.4, flexShrink: 1 },
  card: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 20, overflow: 'hidden' },
  focus: {},
});
