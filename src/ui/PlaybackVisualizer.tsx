import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Easing, Platform, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { colors } from './theme';

// A decorative, continuous wave; it does not claim to measure the sample's frequencies.
function wave(offset: number) {
  return Array.from({ length: 201 }, (_, i) => {
    const x = i * 6;
    const envelope = .25 + .75 * Math.sin(Math.PI * i / 200) ** 2;
    const y = 100 + envelope * (30 * Math.sin(i * .16 + offset) + 12 * Math.sin(i * .31 + offset));
    return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}
const paths = [wave(0), wave(1.4), wave(2.8)];
export function PlaybackVisualizer({ playing, compact = false }: { playing: boolean; compact?: boolean }) {
  const phase = useRef(new Animated.Value(0)).current;
  const intensity = useRef(new Animated.Value(playing ? 1 : .28)).current;
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
    if (reduceMotion || !active) { phase.setValue(0); return; }
    const loop = Animated.loop(Animated.timing(phase, { toValue: 1, duration: playing ? 7000 : 16000, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web', isInteraction: false }));
    loop.start(); return () => { loop.stop(); phase.setValue(0); };
  }, [playing, reduceMotion, active, phase]);
  useEffect(() => {
    const animation = Animated.timing(intensity, { toValue: playing ? 1 : .28, duration: reduceMotion ? 0 : 1000, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web', isInteraction: false });
    animation.start(); return () => animation.stop();
  }, [playing, reduceMotion, intensity]);
  return <View testID={compact ? 'mini-visualizer' : 'playback-visualizer'} pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={compact ? { width: 32, height: 24, overflow: 'hidden' } : { position: 'absolute', left: 0, right: 0, top: '43%', height: 230, overflow: 'hidden' }}>
    <Animated.View testID={!compact ? 'waveform-intensity' : undefined} style={{ width: '100%', height: '100%', opacity: intensity.interpolate({ inputRange: [.28, 1], outputRange: [compact ? .35 : .13, compact ? .8 : .3] }), transform: [{ scaleY: intensity }] }}>
      {paths.map((d, i) => <Animated.View key={i} testID={!compact && i === 0 ? 'playback-wave-0' : undefined} style={{ position: 'absolute', width: '130%', left: '-15%', height: '100%', opacity: i ? .55 : 1, transform: [
        { translateX: phase.interpolate({ inputRange: [0, .25, .5, .75, 1], outputRange: [0, i % 2 ? -22 : 22, 0, i % 2 ? 22 : -22, 0] }) },
        { scaleY: phase.interpolate({ inputRange: [0, .25, .5, .75, 1], outputRange: [1, 1.2 + i * .1, 1, .75 - i * .05, 1] }) },
      ] }}>
        <Svg width="100%" height="100%" viewBox="0 0 1200 200" preserveAspectRatio="none">
          <Defs><LinearGradient id={`wave-${i}`} x1="0" x2="1" y1="0" y2="0"><Stop offset="0" stopColor={colors.teal} stopOpacity="0" /><Stop offset=".25" stopColor={colors.teal} /><Stop offset=".65" stopColor={colors.gold} /><Stop offset="1" stopColor={colors.gold} stopOpacity="0" /></LinearGradient></Defs>
          {!compact && <Path d={d} stroke={`url(#wave-${i})`} strokeWidth="12" opacity=".08" fill="none" />}
          <Path d={d} stroke={`url(#wave-${i})`} strokeWidth={compact ? 6 : i ? 1.5 : 2.2} fill="none" />
        </Svg>
      </Animated.View>)}
    </Animated.View>
  </View>;
}
