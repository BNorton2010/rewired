import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { Easing, useAnimatedProps, useAnimatedStyle, useDerivedValue, useFrameCallback, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { auroraRibbon, AURORA_HEIGHT, AURORA_WIDTH, TAU } from './auroraGeometry';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const ribbons = [
  { layer: 0, gold: '#D6A655', opacity: .55 },
  { layer: 1, gold: '#EBC576', opacity: .6 },
  { layer: 2, gold: '#F6D797', opacity: .55 },
  { layer: 4, gold: '#FFE8B2', opacity: .6 },
];

function Ribbon({ id, index, phase, energy }: { id: string; index: number; phase: SharedValue<number>; energy: SharedValue<number> }) {
  const ribbon = ribbons[index];
  const geometry = useDerivedValue(() => auroraRibbon(phase.value, ribbon.layer, energy.value));
  const animatedProps = useAnimatedProps(() => ({ d: geometry.value }));
  return <AnimatedPath id={`wave-${id}-ribbon-${index}`} animatedProps={animatedProps} fill={`url(#wave-${id}-${index})`} opacity={ribbon.opacity} />;
}

/** Decorative gold silk, not a measurement of the sample's audio frequencies. */
export const PlaybackVisualizer = React.memo(function PlaybackVisualizer({ playing, compact = false, style }: { playing: boolean; compact?: boolean; style?: StyleProp<ViewStyle> }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const phase = useSharedValue(0);
  const elapsed = useSharedValue(0);
  const energy = useSharedValue(playing ? 1 : .2);
  const tempo = useSharedValue(playing ? 10000 : 26000);
  const [reduceMotion, setReduceMotion] = useState(true);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [focused, setFocused] = useState(false);
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const mounted = useRef(true);
  const frame = useFrameCallback(info => {
    'worklet';
    // Morph at 30 fps on the native UI thread, without React renders or JS timers.
    elapsed.value += Math.min(info.timeSincePreviousFrame ?? 0, 64);
    if (elapsed.value < 1000 / 30) return;
    phase.value = (phase.value + elapsed.value / tempo.value * TAU) % TAU;
    elapsed.value = 0;
  }, false);
  // Native stacks can retain a player behind another route. It must not keep
  // morphing hidden SVG paths while the user scrolls a different screen.
  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => setFocused(false);
  }, []));
  useEffect(() => {
    mounted.current = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted.current) setReduceMotion(value); });
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    const app = AppState.addEventListener('change', value => setActive(value === 'active'));
    return () => { mounted.current = false; motion.remove(); app.remove(); };
  }, []);
  useEffect(() => {
    elapsed.value = 0;
    frame.setActive(active && focused && !reduceMotion);
    return () => frame.setActive(false);
  }, [active, focused, reduceMotion, frame, elapsed]);
  useEffect(() => {
    energy.value = withTiming(playing ? 1 : .2, { duration: reduceMotion ? 0 : 1400, easing: Easing.inOut(Easing.quad) });
    tempo.value = withTiming(playing ? 10000 : 26000, { duration: reduceMotion ? 0 : 1000 });
  }, [playing, reduceMotion, energy, tempo]);
  // Gradient fills provide softness directly. SVG filters/masks rasterize large
  // offscreen images on iOS for every redraw, competing with transport touches.
  // A desktop ribbon covers a much larger area. Use a quieter wide layout,
  // while keeping the phone's paused wave clearly visible without a blur pass.
  const intensity = useAnimatedStyle(() => ({ opacity: compact ? .2 + .45 * energy.value : wide ? .3 + .34 * energy.value : .46 + .36 * energy.value }));
  return <View testID={compact ? 'mini-visualizer' : 'playback-visualizer'} pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[compact ? { width: 28, height: 22, overflow: 'hidden' } : { position: 'absolute', left: 0, right: 0, top: 0, height: 380, overflow: 'hidden', zIndex: 0 }, style]}>
    <Animated.View testID={!compact ? 'waveform-intensity' : undefined} style={[{ width: '100%', height: '100%' }, intensity]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${AURORA_WIDTH} ${AURORA_HEIGHT}`} preserveAspectRatio="none">
        <Defs>
          {ribbons.map(({ gold }, i) => <LinearGradient key={i} id={`wave-${id}-${i}`} gradientUnits="objectBoundingBox" x1="0%" x2="0%" y1="0%" y2="100%">
            <Stop offset="0" stopColor={gold} stopOpacity="0" /><Stop offset=".25" stopColor={gold} stopOpacity=".12" /><Stop offset=".5" stopColor={gold} stopOpacity=".75" /><Stop offset=".75" stopColor={gold} stopOpacity=".12" /><Stop offset="1" stopColor={gold} stopOpacity="0" />
          </LinearGradient>)}
        </Defs>
        {ribbons.map((_, index) => <Ribbon key={index} id={id} index={index} phase={phase} energy={energy} />)}
      </Svg>
    </Animated.View>
  </View>;
});
