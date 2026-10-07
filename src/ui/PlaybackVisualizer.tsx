import React, { useEffect, useId, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Easing, Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, G, Filter, FeGaussianBlur } from 'react-native-svg';

// Two visible periods plus a spare period on each side supply matching blur
// pixels at the repeat. Values and slopes meet without a visible loop reset.
function ribbon(phase: number, thickness: number, lift = 0) {
  const edge = (x: number, lower: boolean) => {
    const t = x / 1200 * Math.PI * 2;
    const center = 160 + lift + 62 * Math.sin(t + phase) + 9 * Math.sin(2 * t + phase * .7);
    const spread = thickness * (1 + .2 * Math.sin(t + phase + .8));
    const derivative = (62 * Math.cos(t + phase) + 18 * Math.cos(2 * t + phase * .7) + (lower ? 1 : -1) * thickness * .2 * Math.cos(t + phase + .8)) * Math.PI * 2 / 1200;
    return { x, y: center + (lower ? spread : -spread), derivative };
  };
  const segments = (lower: boolean, reverse: boolean) => {
    let d = '';
    for (let i = 0; i < 128; i++) {
      const a = edge(reverse ? 3600 - i * 37.5 : -1200 + i * 37.5, lower);
      const b = edge(reverse ? a.x - 37.5 : a.x + 37.5, lower);
      const step = (b.x - a.x) / 3;
      d += ` C${a.x + step},${(a.y + a.derivative * step).toFixed(2)} ${b.x - step},${(b.y - b.derivative * step).toFixed(2)} ${b.x},${b.y.toFixed(2)}`;
    }
    return d;
  };
  return `M-1200,${edge(-1200, false).y.toFixed(2)}${segments(false, false)} L3600,${edge(3600, true).y.toFixed(2)}${segments(true, true)} Z`;
}
const ribbons = [
  { d: ribbon(0, 31, -12), color: '#8359B7', opacity: .48 },
  { d: ribbon(1.8, 23, 4), color: '#9273CE', opacity: .55 },
  { d: ribbon(.65, 16, 8), color: '#61BFB7', opacity: .65 },
  { d: ribbon(3.5, 18, -3), color: '#BF8AE0', opacity: .5 },
  { d: ribbon(2.6, 12, 12), color: '#8BD3D1', opacity: .5 },
  { d: ribbon(4.5, 9, -9), color: '#E9BD77', opacity: .55 },
  { d: ribbon(.3, 5, -5), color: '#B69AEC', opacity: .65 },
  { d: ribbon(2.85, 3, 0), color: '#E8C98C', opacity: .6 },
];
const wisps = Array.from({ length: 8 }, (_, i) => ({
  d: ribbon((i % 4) * 1.1 + .12 * Math.floor(i / 4), .45 + i % 3 * .16, (i - 7) * 2),
  color: ['#C3A2E3', '#8FCFCB', '#EBC88B', '#9279BD'][i % 4],
}));

/** An atmospheric animation, not an analysis of the audio's actual frequencies. */
export const PlaybackVisualizer = React.memo(function PlaybackVisualizer({ playing, compact = false, style }: { playing: boolean; compact?: boolean; style?: StyleProp<ViewStyle> }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const phase = useRef(new Animated.Value(0)).current;
  const intensity = useRef(new Animated.Value(playing ? 1 : .28)).current;
  const [tileWidth, setTileWidth] = useState(compact ? 28 : 0);
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
    const duration = playing ? 14000 : 32000;
    const timing = (milliseconds: number) => Animated.timing(phase, { toValue: 1, duration: milliseconds, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web', isInteraction: false });
    // Change speed without changing position, jumping or reversing the river.
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
    const animation = Animated.timing(intensity, { toValue: playing ? 1 : .28, duration: reduceMotion ? 0 : 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web', isInteraction: false });
    animation.start(); return () => animation.stop();
  }, [playing, reduceMotion, intensity]);
  return <View testID={compact ? 'mini-visualizer' : 'playback-visualizer'} onLayout={event => setTileWidth(event.nativeEvent.layout.width)} pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[compact ? { width: 28, height: 22, overflow: 'hidden' } : { position: 'absolute', left: 0, right: 0, top: 0, height: 380, overflow: 'hidden' }, style]}>
    <Animated.View testID={!compact ? 'waveform-intensity' : undefined} style={{ width: '100%', height: '100%', opacity: intensity.interpolate({ inputRange: [.28, 1], outputRange: [compact ? .3 : .28, compact ? .85 : .72] }), transform: [{ scaleY: intensity.interpolate({ inputRange: [.28, 1], outputRange: [.6, 1] }) }] }}>
      <Animated.View shouldRasterizeIOS renderToHardwareTextureAndroid testID={!compact ? 'playback-wave-0' : undefined} style={{ position: 'absolute', left: -tileWidth, width: tileWidth * 2, height: '100%', transform: [{ translateX: phase.interpolate({ inputRange: [0, 1], outputRange: [0, tileWidth] }) }] }}>
        <Svg width={tileWidth * 2} height="100%" viewBox="0 0 2400 320" preserveAspectRatio="none">
          <Defs><Filter id={`wave-${id}-glow`} x="-10%" y="-50%" width="120%" height="200%"><FeGaussianBlur stdDeviation="14" /></Filter><Filter id={`wave-${id}-silk`} x="-10%" y="-50%" width="120%" height="200%"><FeGaussianBlur stdDeviation="2.5" /></Filter>{ribbons.map((r, i) => <LinearGradient key={i} id={`wave-${id}-${i}`} x1="0%" x2="0%" y1="0%" y2="100%">
            <Stop offset="0" stopColor={r.color} stopOpacity="0" />
            <Stop offset=".24" stopColor={r.color} stopOpacity=".02" />
            <Stop offset=".43" stopColor={r.color} stopOpacity=".42" />
            <Stop offset=".53" stopColor={r.color} stopOpacity=".85" />
            <Stop offset=".64" stopColor={r.color} stopOpacity=".18" />
            <Stop offset="1" stopColor={r.color} stopOpacity="0" />
          </LinearGradient>)}</Defs>
          <G filter={`url(#wave-${id}-glow)`}>{ribbons.slice(0, 4).map((r, i) => <Path key={i} d={r.d} fill={r.color} opacity=".35" />)}</G>
          <G filter={`url(#wave-${id}-silk)`}>
            {ribbons.map((r, i) => <Path key={`silk-${i}`} d={r.d} fill={r.color} opacity={r.opacity * .4} />)}
            {ribbons.map((r, i) => <Path key={i} d={r.d} fill={`url(#wave-${id}-${i})`} opacity={r.opacity} />)}
          </G>
          {wisps.map((w, i) => <Path key={`wisp-${i}`} d={w.d} fill={w.color} opacity={i % 3 ? .15 : .26} />)}
        </Svg>
      </Animated.View>
    </Animated.View>
  </View>;
});
