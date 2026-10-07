import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Easing, Platform, View } from 'react-native';
import { colors } from './theme';
import { Label } from './components';

/** Decorative rhythm, not a measured representation of the sample's frequencies. */
export function PlaybackVisualizer({ playing, compact = false }: { playing: boolean; compact?: boolean }) {
  const phase = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(true);
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReduceMotion(value); });
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    const app = AppState.addEventListener('change', value => setActive(value === 'active'));
    return () => { mounted = false; motion.remove(); app.remove(); };
  }, []);
  useEffect(() => {
    if (!playing || reduceMotion || !active) { phase.setValue(0); return; }
    const loop = Animated.loop(Animated.timing(phase, { toValue: 1, duration: 3200, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web', isInteraction: false }));
    loop.start(); return () => { loop.stop(); phase.setValue(0); };
  }, [playing, reduceMotion, active, phase]);
  const bars = compact ? 8 : 32;
  return <View testID={compact ? 'mini-visualizer' : 'playback-visualizer'} style={compact ? { width: 32 } : { padding: 16, borderRadius: 20, backgroundColor: '#101A2B', borderColor: '#293A49', borderWidth: 1, overflow: 'hidden', gap: 10 }}>
    {!compact && <Label style={{ color: playing ? colors.teal : colors.muted, fontSize: 10 }}>{playing ? 'IN THE FLOW' : 'YOUR DAILY FREQUENCY'}</Label>}
    <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ height: compact ? 24 : 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: compact ? 2 : 4 }}>
      {Array.from({ length: bars }, (_, i) => {
        const height = compact ? 22 : 24 + 20 * Math.sin(Math.PI * (i + 1) / (bars + 1));
        const low = .22 + (i % 4) * .07;
        return <Animated.View key={i} testID={!compact && i === 0 ? 'playback-bar-0' : undefined} style={{ flex: 1, maxWidth: compact ? 3 : 5, height, borderRadius: 4, backgroundColor: i % 5 < 2 ? colors.teal : colors.gold, opacity: playing ? .85 : .4, transform: [{ scaleY: phase.interpolate({ inputRange: [0, .25, .5, .75, 1], outputRange: [low, .55 + (i % 3) * .15, .28 + (i % 5) * .12, .9 - (i % 4) * .12, low] }) }] }} />;
      })}
    </View>
  </View>;
}
