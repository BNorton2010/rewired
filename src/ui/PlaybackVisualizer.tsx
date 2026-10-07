import React, { useEffect, useId, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Easing, Platform, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { colors } from './theme';

// Periodic filled ribbons meet at identical heights/slopes on both tile edges.
// Translating two identical tiles rightward makes the loop reset invisible.
function ribbon(offset: number, thickness: number) {
  const points = Array.from({ length: 121 }, (_, i) => {
    const t = i / 120 * Math.PI * 2;
    const center = 100 + 23 * Math.sin(t + offset) + 9 * Math.sin(2 * t + offset);
    const spread = thickness * (1 + .24 * Math.sin(t + offset + 1));
    return { x: i * 10, top: center - spread, bottom: center + spread };
  });
  const edge = (p: typeof points[number], lower: boolean) => `${p.x},${(lower ? p.bottom : p.top).toFixed(3)}`;
  return `M${points.map(p => edge(p, false)).join(' L')} L${points.reverse().map(p => edge(p, true)).join(' L')} Z`;
}
const ribbons = [ribbon(0, 42), ribbon(1.7, 29), ribbon(3.5, 20)];

/** Decorative aurora, not measured audio frequencies. */
export function PlaybackVisualizer({ playing, compact = false }: { playing: boolean; compact?: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const phase = useRef(new Animated.Value(0)).current;
  const intensity = useRef(new Animated.Value(playing ? 1 : .28)).current;
  const [tileWidth, setTileWidth] = useState(compact ? 32 : 0);
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
    let cancelled = false;
    let motion: Animated.CompositeAnimation | undefined;
    if (reduceMotion || !active) { phase.stopAnimation(); return; }
    const duration = playing ? 14000 : 30000;
    const timing = (milliseconds: number) => Animated.timing(phase, { toValue: 1, duration: milliseconds, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web', isInteraction: false });
    // Preserve the stream's position when playback changes its speed.
    phase.stopAnimation(value => {
      if (cancelled) return;
      const progress = Math.min(1, Math.max(0, value));
      motion = timing(duration * (1 - progress));
      motion.start(({ finished }) => {
        if (!finished || cancelled) return;
        phase.setValue(0);
        motion = Animated.loop(timing(duration));
        motion.start();
      });
    });
    return () => { cancelled = true; motion?.stop(); };
  }, [playing, reduceMotion, active, phase]);
  useEffect(() => {
    const animation = Animated.timing(intensity, { toValue: playing ? 1 : .28, duration: reduceMotion ? 0 : 1000, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web', isInteraction: false });
    animation.start(); return () => animation.stop();
  }, [playing, reduceMotion, intensity]);
  return <View testID={compact ? 'mini-visualizer' : 'playback-visualizer'} onLayout={event => setTileWidth(event.nativeEvent.layout.width)} pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={compact ? { width: 32, height: 24, overflow: 'hidden' } : { position: 'absolute', left: 0, right: 0, top: '43%', height: 230, overflow: 'hidden' }}>
    <Animated.View testID={!compact ? 'waveform-intensity' : undefined} style={{ width: '100%', height: '100%', opacity: intensity.interpolate({ inputRange: [.28, 1], outputRange: [compact ? .35 : .13, compact ? .8 : .3] }), transform: [{ scaleY: intensity }] }}>
      <Animated.View testID={!compact ? 'playback-wave-0' : undefined} style={{ position: 'absolute', left: -tileWidth, width: tileWidth * 2, height: '100%', flexDirection: 'row', transform: [{ translateX: phase.interpolate({ inputRange: [0, 1], outputRange: [0, tileWidth] }) }] }}>
        {[0, 1].map(tile => <Svg key={tile} width={tileWidth} height="100%" viewBox="0 0 1200 200" preserveAspectRatio="none">
          <Defs>{ribbons.map((_, i) => <LinearGradient key={i} id={`wave-${id}-${tile}-${i}`} x1="0%" x2="0%" y1="0%" y2="100%">
            <Stop offset="0" stopColor={colors.teal} stopOpacity="0" />
            <Stop offset=".24" stopColor={colors.teal} stopOpacity=".25" />
            <Stop offset=".46" stopColor={i === 1 ? '#A48ADE' : colors.teal} stopOpacity=".9" />
            <Stop offset=".65" stopColor={i === 2 ? colors.gold : '#8874C9'} stopOpacity=".65" />
            <Stop offset="1" stopColor="#8874C9" stopOpacity="0" />
          </LinearGradient>)}</Defs>
          {ribbons.map((d, i) => <Path key={i} d={d} fill={`url(#wave-${id}-${tile}-${i})`} opacity={i ? .65 : 1} />)}
        </Svg>)}
      </Animated.View>
    </Animated.View>
  </View>;
}
