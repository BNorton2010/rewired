export const AURORA_WIDTH = 1200;
export const AURORA_HEIGHT = 300;
export const TAU = Math.PI * 2;
const widths = [26, 18, 12, 8, 4, 2];

/** All wave fronts travel rightward, but at different speeds so the silk evolves. */
export function auroraPoint(x: number, phase: number, layer: number, energy: number, lower: boolean) {
  'worklet';
  const t = x / AURORA_WIDTH * TAU;
  const offset = layer * .24;
  const breath = .86 + .14 * Math.sin(2 * phase + offset);
  const amplitude = (22 + 36 * energy) * breath;
  const main = t - phase + offset;
  const harmonic = 2 * t - phase + offset * 1.5;
  const ripple = 3 * t - 2 * phase + offset;
  const center = 150 + (layer - 2.5) * 3 + amplitude * (.72 * Math.sin(main) + .2 * Math.sin(harmonic) + .08 * Math.sin(ripple));
  const width = widths[layer] * (.65 + .35 * energy);
  const spread = width * (1 + .2 * Math.sin(t - 2 * phase + offset));
  const sign = lower ? 1 : -1;
  const derivative = (amplitude * (.72 * Math.cos(main) + .4 * Math.cos(harmonic) + .24 * Math.cos(ripple)) + sign * width * .2 * Math.cos(t - 2 * phase + offset)) * TAU / AURORA_WIDTH;
  return { x, y: center + sign * spread, derivative };
}

/** Modest geometry keeps path morphing on the native UI thread inexpensive. */
export function auroraRibbon(phase: number, layer: number, energy: number) {
  'worklet';
  const step = 100;
  const first = auroraPoint(-100, phase, layer, energy, false);
  let path = `M${first.x},${first.y.toFixed(2)}`;
  for (let side = 0; side < 2; side++) {
    const lower = side === 1;
    const start = lower ? 1300 : -100;
    const direction = lower ? -1 : 1;
    if (lower) path += ` L1300,${auroraPoint(1300, phase, layer, energy, true).y.toFixed(2)}`;
    for (let i = 0; i < 14; i++) {
      const a = auroraPoint(start + direction * i * step, phase, layer, energy, lower);
      const b = auroraPoint(a.x + direction * step, phase, layer, energy, lower);
      const control = (b.x - a.x) / 3;
      path += ` C${(a.x + control).toFixed(1)},${(a.y + a.derivative * control).toFixed(2)} ${(b.x - control).toFixed(1)},${(b.y - b.derivative * control).toFixed(2)} ${b.x},${b.y.toFixed(2)}`;
    }
  }
  return path + ' Z';
}
