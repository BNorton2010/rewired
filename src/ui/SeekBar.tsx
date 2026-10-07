import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors } from './theme';
export function SeekBar({ position, duration, onSeek, disabled }: { position: number; duration: number; onSeek: (seconds: number) => void; disabled?: boolean }) {
  const [draft, setDraft] = useState<number | null>(null);
  const value = Math.min(duration || 0, draft ?? position);
  if (Platform.OS === 'web') return <View style={{ height: 36, justifyContent: 'center' }}>{React.createElement('input', {
    type: 'range', min: 0, max: duration || 1, step: 1, value, disabled,
    'aria-label': 'Seek audio', 'aria-valuetext': `${Math.floor(value)} seconds of ${Math.floor(duration)} seconds`,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => onSeek(Number(event.target.value)),
    style: { width: '100%', height: 26, accentColor: colors.gold, cursor: 'pointer', margin: 0 },
  })}</View>;
  return <Slider accessibilityLabel="Seek audio" accessibilityValue={{ min: 0, max: duration || 1, now: value }} style={{ height: 40, width: '100%' }} minimumValue={0} maximumValue={duration || 1} value={value} disabled={disabled} minimumTrackTintColor={colors.gold} maximumTrackTintColor={colors.line} thumbTintColor={colors.gold} onSlidingStart={() => setDraft(position)} onValueChange={setDraft} onSlidingComplete={seconds => { setDraft(null); onSeek(seconds); }} />;
}
