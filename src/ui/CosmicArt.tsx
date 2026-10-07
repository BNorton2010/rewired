import React, { useId } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { ArtworkKind } from '../content/catalog';
// Original vector artwork. Static by design, so reduced-motion users receive the same experience.
export function CosmicArt({ kind = 'sunrise', style, orbit = false }: { kind?: ArtworkKind; style?: StyleProp<ViewStyle>; orbit?: boolean }) {
  const id = useId().replace(/:/g, '');
  const purple = kind === 'nebula' || kind === 'moon';
  const accent = purple ? '#A17AEA' : kind === 'ocean' ? '#36C9D6' : '#589EF4';
  return <View style={[{ backgroundColor: '#081326', overflow: 'hidden' }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id={`${id}sky`} x1="0" y1="0" x2="1" y2="1"><Stop stopColor="#040914" /><Stop offset=".5" stopColor={purple ? '#201C55' : '#102B56'} /><Stop offset="1" stopColor="#050B18" /></LinearGradient>
        <RadialGradient id={`${id}cloud`}><Stop stopColor={accent} stopOpacity=".56" /><Stop offset=".35" stopColor={accent} stopOpacity=".17" /><Stop offset="1" stopColor={accent} stopOpacity="0" /></RadialGradient>
        <RadialGradient id={`${id}sun`}><Stop stopColor="#FFF9D8" /><Stop offset=".12" stopColor="#FFD181" stopOpacity=".95" /><Stop offset=".4" stopColor="#E0A148" stopOpacity=".2" /><Stop offset="1" stopColor="#E0A148" stopOpacity="0" /></RadialGradient>
        <RadialGradient id={`${id}planet`} cx=".38" cy=".13" r=".8"><Stop stopColor={accent} /><Stop offset=".1" stopColor="#1E4A79" /><Stop offset=".37" stopColor="#0F2746" /><Stop offset="1" stopColor="#030712" /></RadialGradient>
        <LinearGradient id={`${id}shade`} x1="0" y1="0" x2="0" y2="1"><Stop stopColor="#070D1B" stopOpacity="0" /><Stop offset="1" stopColor="#070D1B" stopOpacity=".6" /></LinearGradient>
      </Defs>
      <Rect width="800" height="600" fill={`url(#${id}sky)`} />
      <G transform="rotate(-28 400 300)">
        {Array.from({ length: 12 }, (_, i) => <Ellipse key={i} cx={40 + i * 74} cy={300 + Math.sin(i * 2.3) * 60} rx={170 + (i % 3) * 40} ry={40 + (i % 4) * 20} fill={`url(#${id}cloud)`} />)}
      </G>
      {Array.from({ length: 130 }, (_, i) => <Circle key={i} cx={(i * 137.7 + 29) % 800} cy={(i * 81.9 + i * i * 2.1) % 600} r={i % 11 === 0 ? 1.7 : .65} fill={i % 4 === 0 ? '#EAD29B' : '#C3DAFF'} opacity={.24 + (i % 7) / 10} />)}
      {(kind === 'sunrise' || kind === 'ocean') && <>
        <Ellipse cx="470" cy="820" rx="790" ry="515" fill={`url(#${id}planet)`} stroke="#6EA7EA" strokeWidth="2" />
        <Path d="M -80 536 Q 275 163 900 422" fill="none" stroke="#8BCBFF" strokeOpacity=".3" strokeWidth="7" />
        <Circle cx="457" cy="322" r="170" fill={`url(#${id}sun)`} />
        <Ellipse cx="457" cy="326" rx="125" ry="9" fill={`url(#${id}sun)`} />
        <Path d="M-40 550 Q90 453 195 494 T398 446 T627 470 T850 445" stroke="#6996B9" strokeWidth="2" fill="none" opacity=".2" />
      </>}
      {(kind === 'moon' || kind === 'orbit' || orbit) && <>
        <Circle cx="421" cy="285" r="125" fill={`url(#${id}planet)`} stroke={accent} strokeWidth="1" />
        <Circle cx="448" cy="271" r="136" fill={`url(#${id}sun)`} opacity=".32" />
        {[174, 219, 263].map(r => <Ellipse key={r} cx="400" cy="300" rx={r} ry={r * .81} fill="none" stroke="#EBC26E" strokeWidth="1" opacity=".65" transform="rotate(-29 400 300)" />)}
        <Circle cx="205" cy="193" r="5" fill="#FFE2A1" /><Circle cx="623" cy="201" r="7" fill="#EDC575" />
      </>}
      {kind === 'nebula' && <G transform="translate(408 285)">{[1, 2, 3, 4, 5, 6].map(n => <Ellipse key={n} rx={35 + n * 32} ry={14 + n * 10} fill="none" stroke={n % 2 ? '#B897EE' : '#66BFF6'} strokeWidth={10 - n} opacity={.5 - n * .05} transform={`rotate(${n * 24})`} />)}<Circle r="110" fill={`url(#${id}sun)`} /></G>}
      <Rect width="800" height="600" fill={`url(#${id}shade)`} />
    </Svg>
  </View>;
}
