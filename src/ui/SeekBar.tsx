import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from './theme';
import { clampPosition, formatTime } from '../content/logic';
import { seekInteraction, type SeekAction, type SeekInteraction } from './seekInteraction';

type Props = {
  position: number;
  duration: number;
  onSeek: (seconds: number) => void;
  disabled?: boolean;
  onScrubbingChange?: (scrubbing: boolean) => void;
};

export function SeekBar({ position, duration, onSeek, disabled, onScrubbingChange }: Props) {
  const [interaction, setInteraction] = useState<SeekInteraction>({ phase: 'idle' });
  const interactionRef = useRef(interaction);
  const onScrubbingRef = useRef(onScrubbingChange);
  onScrubbingRef.current = onScrubbingChange;
  const [focused, setFocused] = useState(false);
  const unavailable = !!disabled || !Number.isFinite(duration) || duration <= 0;
  const transition = useCallback((action: SeekAction) => {
    const previous = interactionRef.current;
    const next = seekInteraction(previous, action);
    interactionRef.current = next;
    if (previous !== next) setInteraction(next);
    if ((previous.phase === 'dragging') !== (next.phase === 'dragging')) {
      onScrubbingRef.current?.(next.phase === 'dragging');
    }
  }, []);
  const reset = useCallback(() => transition({ type: 'reset' }), [transition]);
  useEffect(() => { transition({ type: 'position', value: position }); }, [position, transition]);
  useEffect(() => { if (unavailable) reset(); }, [unavailable, reset]);
  useEffect(() => {
    if (interaction.phase !== 'seeking') return;
    // A failed seek must not strand the thumb; normal 250 ms transport ticks acknowledge it first.
    const timer = setTimeout(reset, 2000);
    return () => clearTimeout(timer);
  }, [interaction, reset]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => { if (state !== 'active') reset(); });
    return () => { subscription.remove(); onScrubbingRef.current?.(false); };
  }, [reset]);

  const value = clampPosition(interaction.phase === 'idle' ? position : interaction.value, duration);
  const commit = (seconds: number) => {
    if (unavailable) { reset(); return; }
    const target = clampPosition(seconds, duration);
    transition({ type: 'commit', value: target, duration });
    onSeek(target);
  };
  const begin = (seconds: number) => {
    if (!unavailable) transition({ type: 'start', value: seconds, duration });
  };
  const move = (seconds: number) => {
    if (!unavailable) transition({ type: 'move', value: seconds, duration });
  };
  const spokenValue = `${formatTime(value)} of ${formatTime(duration)}`;

  if (Platform.OS !== 'web') return <View
    testID="native-seek-bar"
    accessible accessibilityRole="adjustable" accessibilityLabel="Seek audio"
    accessibilityState={{ disabled: unavailable }}
    accessibilityValue={{ min: 0, max: duration || 1, now: value, text: spokenValue }}
    accessibilityActions={[{ name: 'increment', label: 'Forward 15 seconds' }, { name: 'decrement', label: 'Back 15 seconds' }]}
    onAccessibilityAction={event => {
      if (unavailable) return;
      if (event.nativeEvent.actionName === 'increment') commit(value + 15);
      else if (event.nativeEvent.actionName === 'decrement') commit(value - 15);
    }}
    style={{ height: 48, justifyContent: 'center', width: '100%', opacity: unavailable ? .4 : 1 }}>
    <Slider
      testID="native-seek-control"
      accessible={false} importantForAccessibility="no"
      style={{ width: '100%', height: 48 }}
      minimumValue={0} maximumValue={duration > 0 ? duration : 1}
      // Native UISlider / SeekBar owns its thumb while dragging. Do not write audio ticks back to it.
      value={interaction.phase === 'dragging' ? interaction.nativeValue : value}
      disabled={unavailable} tapToSeek step={0} thumbSize={18}
      minimumTrackTintColor={colors.gold} maximumTrackTintColor="#493957" thumbTintColor={colors.gold}
      onSlidingStart={begin} onValueChange={move} onSlidingComplete={commit}
    />
  </View>;

  const percent = duration > 0 ? value / duration * 100 : 0;
  return <View style={{ height: 44, justifyContent: 'center' }}>
    <View pointerEvents="none" style={{ height: 4, backgroundColor: '#493957', borderRadius: 3, width: '100%', opacity: unavailable ? .4 : 1 }}>
      <LinearGradient colors={['#FFE7AB', colors.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${percent}%`, height: 4, borderRadius: 3 }} />
      <View style={{ position: 'absolute', left: `${percent}%`, marginLeft: -7, top: -5, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.gold, borderWidth: 1, borderColor: colors.goldLight, boxShadow: focused ? '0 0 0 5px rgba(238,198,118,0.25)' : '0 0 10px rgba(238,198,118,0.12)' }} />
    </View>
    {React.createElement('input', {
      type: 'range', min: 0, max: duration || 1, step: 1, value, disabled: unavailable,
      'aria-label': 'Seek audio', 'aria-valuetext': spokenValue,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        const target = Number(event.target.value);
        if (interactionRef.current.phase === 'dragging') move(target);
        else commit(target); // Keyboard and assistive input commits immediately.
      },
      onPointerDown: (event: React.PointerEvent<HTMLInputElement>) => {
        begin(Number(event.currentTarget.value));
        event.currentTarget.setPointerCapture(event.pointerId);
      },
      onPointerUp: () => { if (interactionRef.current.phase === 'dragging') commit(interactionRef.current.value); },
      onPointerCancel: reset,
      onFocus: () => setFocused(true),
      onBlur: () => { setFocused(false); if (interactionRef.current.phase === 'dragging') reset(); },
      style: { position: 'absolute', width: '100%', height: 44, opacity: .01, cursor: unavailable ? 'default' : 'pointer', margin: 0, touchAction: 'none' },
    })}
  </View>;
}
