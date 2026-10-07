import React, { useEffect, useId, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedProps, useAnimatedStyle, useDerivedValue, useFrameCallback, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Stop, Path, G, Filter, FeGaussianBlur, Mask, Rect } from 'react-native-svg';
import { auroraRibbon, AURORA_HEIGHT, AURORA_WIDTH, TAU } from './auroraGeometry';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const golds = ['#A67A43', '#C29558', '#D8B477', '#EDD099', '#F0DBB0', '#BE955E'];

function Ribbon({ id, index, phase, energy }: { id: string; index: number; phase: SharedValue<number>; energy: SharedValue<number> }) {
  const geometry = useDerivedValue(() => auroraRibbon(phase.value, index, energy.value));
  const animatedProps = useAnimatedProps(() => ({ d: geometry.value }));
  return <>
    {index === 0 && <AnimatedPath animatedProps={animatedProps} fill={golds[index]} opacity={.16} filter={`url(#wave-${id}-glow)`} />}
    <AnimatedPath id={`wave-${id}-ribbon-${index}`} animatedProps={animatedProps} fill={`url(#wave-${id}-${index})`} opacity={index < 3 ? .5 : .7} filter={`url(#wave-${id}-silk)`} />
  </>;
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
  const mounted = useRef(true);
  const frame = useFrameCallback(info => {
    'worklet';
    // Morph at 30 fps on the native UI thread, without React renders or JS timers.
    elapsed.value += Math.min(info.timeSincePreviousFrame ?? 0, 64);
    if (elapsed.value < 1000 / 30) return;
    phase.value = (phase.value + elapsed.value / tempo.value * TAU) % TAU;
    elapsed.value = 0;
  }, false);
  useEffect(() => {
    mounted.current = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted.current) setReduceMotion(value); });
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    const app = AppState.addEventListener('change', value => setActive(value === 'active'));
    return () => { mounted.current = false; motion.remove(); app.remove(); };
  }, []);
  useEffect(() => {
    elapsed.value = 0;
    frame.setActive(active && !reduceMotion);
    return () => frame.setActive(false);
  }, [active, reduceMotion, frame, elapsed]);
  useEffect(() => {
    energy.value = withTiming(playing ? 1 : .2, { duration: reduceMotion ? 0 : 1400, easing: Easing.inOut(Easing.quad) });
    tempo.value = withTiming(playing ? 10000 : 26000, { duration: reduceMotion ? 0 : 1000 });
  }, [playing, reduceMotion, energy, tempo]);
  const intensity = useAnimatedStyle(() => ({ opacity: compact ? .2 + .45 * energy.value : .08 + .16 * energy.value }));
  return <View testID={compact ? 'mini-visualizer' : 'playback-visualizer'} pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[compact ? { width: 28, height: 22, overflow: 'hidden' } : { position: 'absolute', left: 0, right: 0, top: 0, height: 380, overflow: 'hidden', zIndex: 0 }, style]}>
    <Animated.View testID={!compact ? 'waveform-intensity' : undefined} style={[{ width: '100%', height: '100%' }, intensity]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${AURORA_WIDTH} ${AURORA_HEIGHT}`} preserveAspectRatio="none">
        <Defs>
          <Filter id={`wave-${id}-glow`} x="-20%" y="-50%" width="140%" height="200%"><FeGaussianBlur stdDeviation="10" /></Filter>
          <Filter id={`wave-${id}-silk`} x="-20%" y="-50%" width="140%" height="200%"><FeGaussianBlur stdDeviation="1.5" /></Filter>
          <LinearGradient id={`wave-${id}-fade`} x1="0%" x2="0%" y1="0%" y2="100%">
            <Stop offset="0" stopColor="white" stopOpacity="0" /><Stop offset=".3" stopColor="white" /><Stop offset=".65" stopColor="white" /><Stop offset="1" stopColor="white" stopOpacity="0" />
          </LinearGradient>
          <Mask id={`wave-${id}-mask`}><Rect width={AURORA_WIDTH} height={AURORA_HEIGHT} fill={`url(#wave-${id}-fade)`} /></Mask>
          {golds.map((color, i) => <LinearGradient key={i} id={`wave-${id}-${i}`} x1="0%" x2="0%" y1="0%" y2="100%">
            <Stop offset="0" stopColor={color} stopOpacity="0" /><Stop offset=".3" stopColor={color} stopOpacity=".12" /><Stop offset=".5" stopColor={color} stopOpacity=".9" /><Stop offset=".7" stopColor={color} stopOpacity=".12" /><Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>)}
        </Defs>
        <G mask={`url(#wave-${id}-mask)`}>
          {golds.map((_, index) => <Ribbon key={index} id={id} index={index} phase={phase} energy={energy} />)}
        </G>
      </Svg>
    </Animated.View>
  </View>;
});
