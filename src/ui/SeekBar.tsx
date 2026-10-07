import React, { useState } from 'react';
import { Platform, View, type GestureResponderEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from './theme';
import { formatTime } from '../content/logic';

export function SeekBar({ position, duration, onSeek, disabled }: { position: number; duration: number; onSeek: (seconds: number) => void; disabled?: boolean }) {
  const [draft, setDraft] = useState<number | null>(null);
  const [width, setWidth] = useState(1);
  const [focused, setFocused] = useState(false);
  const value = Math.max(0, Math.min(duration || 0, draft ?? position));
  const percent = duration ? value / duration * 100 : 0;
  const valueAt = (event: GestureResponderEvent) => Math.round(Math.max(0, Math.min(1, event.nativeEvent.locationX / width)) * duration);
  const track = <View pointerEvents="none" style={{ height: 4, backgroundColor: '#493957', borderRadius: 3, width: '100%', opacity: disabled ? .4 : 1 }}>
    <LinearGradient colors={['#FFE7AB', colors.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${percent}%`, height: 4, borderRadius: 3 }} />
    <View style={{ position: 'absolute', left: `${percent}%`, marginLeft: -7, top: -5, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.gold, borderWidth: 1, borderColor: colors.goldLight, boxShadow: focused ? '0 0 0 5px rgba(238,198,118,0.25)' : '0 0 10px rgba(238,198,118,0.12)' }} />
  </View>;
  if (Platform.OS === 'web') return <View style={{ height: 44, justifyContent: 'center' }}>
    {track}
    {React.createElement('input', {
      type: 'range', min: 0, max: duration || 1, step: 1, value, disabled,
      'aria-label': 'Seek audio', 'aria-valuetext': `${formatTime(value)} of ${formatTime(duration)}`,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => onSeek(Number(event.target.value)),
      onFocus: () => setFocused(true), onBlur: () => setFocused(false),
      style: { position: 'absolute', width: '100%', height: 44, opacity: .01, cursor: disabled ? 'default' : 'pointer', margin: 0 },
    })}
  </View>;
  // Native responder gestures keep the same custom track and thumb as the web.
  // VoiceOver/TalkBack can adjust without dragging; a seek commits on release.
  return <View testID="native-seek-bar" accessible accessibilityRole="adjustable" accessibilityLabel="Seek audio" accessibilityState={{ disabled }} accessibilityValue={{ min: 0, max: duration || 1, now: value, text: `${formatTime(value)} of ${formatTime(duration)}` }} accessibilityActions={[{ name: 'increment', label: 'Forward 15 seconds' }, { name: 'decrement', label: 'Back 15 seconds' }]}
    onAccessibilityAction={event => { if (!disabled) onSeek(Math.max(0, Math.min(duration, position + (event.nativeEvent.actionName === 'increment' ? 15 : -15)))); }}
    onLayout={event => setWidth(event.nativeEvent.layout.width)}
    onStartShouldSetResponder={() => !disabled && duration > 0}
    onMoveShouldSetResponder={() => !disabled && duration > 0}
    onResponderGrant={event => setDraft(valueAt(event))}
    onResponderMove={event => setDraft(valueAt(event))}
    onResponderRelease={event => { onSeek(valueAt(event)); setDraft(null); }}
    onResponderTerminate={() => setDraft(null)}
    onResponderTerminationRequest={() => false}
    style={{ height: 44, justifyContent: 'center', width: '100%' }}>{track}</View>;
}
