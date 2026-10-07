import React, { useId } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Icon, type IconName } from './components';
import { colors, fonts } from './theme';

export function PlaybackGlyph({ paused, size = 30 }: { paused: boolean; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
    {paused ? <Path d="M10 5.5 Q9 5 9 7 L9 25 Q9 27 11 26 L26 17 Q27.5 16 26 15 Z" fill={colors.bg} /> : <><Rect x="7" y="5" width="6" height="22" rx="2.3" fill={colors.bg} /><Rect x="19" y="5" width="6" height="22" rx="2.3" fill={colors.bg} /></>}
  </Svg>;
}
export function PlayMedallion({ playing, loading, onPress, compact = false, label, testID }: { playing: boolean; loading?: boolean; onPress: () => void; compact?: boolean; label: string; testID?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const size = compact ? 44 : 88;
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => ({ width: size, height: size, borderRadius: size / 2, opacity: pressed ? .85 : 1, transform: [{ scale: pressed ? .96 : 1 }], boxShadow: compact ? undefined : '0px 5px 24px rgba(220, 160, 64, 0.2)' })}>
    <LinearGradient colors={['#FFF0BE', '#C08B3B', '#67431D', '#F3CC7E']} locations={[0, .38, .7, 1]} start={{ x: .15, y: 0 }} end={{ x: .85, y: 1 }} style={{ width: size, height: size, borderRadius: size / 2, padding: compact ? 1 : 2 }}>
      <LinearGradient colors={['#FFE9AD', '#EDC16B', '#DCA34B', '#EDC372']} locations={[0, .4, .8, 1]} start={{ x: .25, y: 0 }} end={{ x: .85, y: 1 }} style={{ flex: 1, borderRadius: size / 2, borderWidth: 1, borderColor: '#FFE7A96B', alignItems: 'center', justifyContent: 'center' }}>
        {!compact && <Svg width="100%" height="100%" viewBox="0 0 100 100" aria-hidden pointerEvents="none" style={{ position: 'absolute' }}><Defs><RadialGradient id={`medallion-${id}`} cx="30%" cy="15%" r="78%"><Stop offset="0" stopColor="#FFF3CC" stopOpacity=".55" /><Stop offset=".5" stopColor="#FFF3CC" stopOpacity=".1" /><Stop offset="1" stopColor="#FFF3CC" stopOpacity="0" /></RadialGradient></Defs><Circle cx="50" cy="50" r="49" fill={`url(#medallion-${id})`} /></Svg>}
        {loading ? <ActivityIndicator color={colors.bg} size={compact ? 'small' : 'large'} /> : <PlaybackGlyph paused={!playing} size={compact ? 20 : 33} />}
      </LinearGradient>
    </LinearGradient>
  </Pressable>;
}
function SkipButton({ forward, disabled, onPress }: { forward?: boolean; disabled?: boolean; onPress: () => void }) {
  return <View style={{ alignItems: 'center', gap: 10, flex: 1 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Skip ${forward ? 'forward' : 'back'} 15 seconds`} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => ({ width: 62, height: 62, borderRadius: 31, opacity: disabled ? .35 : pressed ? .65 : 1 })}>
      <LinearGradient colors={['#D5B4808C', '#514052', '#A27E514A']} start={{ x: .1, y: 0 }} end={{ x: .8, y: 1 }} style={{ flex: 1, padding: 1, borderRadius: 31 }}>
        <LinearGradient colors={['#241A28', '#0F0A15']} style={{ flex: 1, borderRadius: 31, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 38, height: 38 }}>
            <Svg width="38" height="38" viewBox="0 0 40 40" style={{ transform: [{ scaleX: forward ? -1 : 1 }] }} aria-hidden>
              <Path d="M14 7 A14 14 0 1 1 6 19" stroke={colors.goldLight} strokeWidth="1.7" strokeLinecap="round" fill="none" />
              <Path d="M8 7 L15 2 L15 12 Z" fill={colors.goldLight} />
            </Svg>
            <Text style={{ position: 'absolute', top: 11, left: 0, right: 0, textAlign: 'center', fontFamily: fonts.medium, fontSize: 13, color: colors.ink }} allowFontScaling={false}>15</Text>
          </View>
        </LinearGradient>
      </LinearGradient>
    </Pressable>
    <Text style={{ color: colors.muted, fontFamily: fonts.medium, fontSize: 9, letterSpacing: 1.1, textAlign: 'center' }}>{forward ? 'FORWARD' : 'BACK'} 15s</Text>
  </View>;
}
export function TransportControls({ playing, starting, loading, canSkip, onToggle, onSkip }: { playing: boolean; starting: boolean; loading: boolean; canSkip: boolean; onToggle: () => void; onSkip: (seconds: number) => void }) {
  return <View testID="transport-controls" style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 12, paddingTop: 8 }}>
    <View style={{ flex: 1, paddingTop: 13 }}><SkipButton disabled={!canSkip} onPress={() => onSkip(-15)} /></View>
    <PlayMedallion playing={playing || starting} loading={loading} label={playing || starting ? 'Pause practice' : 'Play practice'} testID="player-toggle" onPress={onToggle} />
    <View style={{ flex: 1, paddingTop: 13 }}><SkipButton forward disabled={!canSkip} onPress={() => onSkip(15)} /></View>
  </View>;
}
function PlayerAction({ icon, title, label, onPress, selected, expanded, children }: React.PropsWithChildren<{ icon?: IconName; title: string; label: string; onPress: () => void; selected?: boolean; expanded?: boolean }>) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ ...(selected !== undefined ? { selected } : {}), ...(expanded !== undefined ? { expanded } : {}) }} aria-pressed={selected} aria-expanded={expanded} onPress={onPress} style={({ pressed }) => ({ flex: 1, minHeight: 78, gap: 9, paddingHorizontal: 5, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', opacity: pressed ? .65 : 1 })}>
    {icon ? <Icon name={icon} size={23} color={selected ? colors.gold : colors.goldLight} /> : children}
    <Text style={{ color: colors.muted, fontFamily: fonts.body, fontSize: 11, textAlign: 'center' }}>{title}</Text>
  </Pressable>;
}
export function PlayerToolbar({ speed, onSpeed, showText, onText, saved, onSave }: { speed: number; onSpeed: () => void; showText: boolean; onText: () => void; saved: boolean; onSave: () => void }) {
  return <LinearGradient colors={['#261A2B88', '#100B16CC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderWidth: 1, borderColor: '#57425C70', borderRadius: 22, flexDirection: 'row', alignItems: 'center' }}>
    <PlayerAction title="Speed" label={`Playback speed ${speed}x. Change speed`} onPress={onSpeed}><Text style={{ fontFamily: fonts.body, color: colors.goldLight, fontSize: 22, lineHeight: 25 }}>{speed}×</Text></PlayerAction>
    <View style={{ width: 1, height: 29, backgroundColor: colors.line }} />
    <PlayerAction icon="align-left" title="Reflective text" label="Reflective text" expanded={showText} onPress={onText} />
    <View style={{ width: 1, height: 29, backgroundColor: colors.line }} />
    <PlayerAction icon="heart" title={saved ? 'Saved' : 'Save'} label={saved ? 'Remove practice from saved' : 'Save practice'} selected={saved} onPress={onSave} />
  </LinearGradient>;
}
