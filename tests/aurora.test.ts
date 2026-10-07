import test from 'node:test';
import assert from 'node:assert/strict';
import { auroraPoint, auroraRibbon, AURORA_WIDTH, AURORA_HEIGHT, TAU } from '../src/ui/auroraGeometry';

test('aurora loops continuously in shape and slope, including its extended edges', () => {
  for (let layer = 0; layer < 6; layer++) {
    assert.equal(auroraRibbon(0, layer, 1), auroraRibbon(TAU, layer, 1));
    for (const x of [-100, 0, 200, 700, AURORA_WIDTH, 1300]) {
      const first = auroraPoint(x, 0, layer, 1, false);
      const last = auroraPoint(x, TAU, layer, 1, false);
      assert.ok(Math.abs(first.y - last.y) < 1e-9);
      assert.ok(Math.abs(first.derivative - last.derivative) < 1e-9);
    }
  }
});

test('flowing aurora deforms rather than translating a fixed texture', () => {
  const phase = .8;
  // A translated snapshot would match after shifting x by its main wave speed.
  const shift = phase / TAU * AURORA_WIDTH;
  const differences = [100, 300, 500, 900].map(x => auroraPoint(x, phase, 0, 1, false).y - auroraPoint(x - shift, 0, 0, 1, false).y);
  assert.ok(Math.max(...differences) - Math.min(...differences) > 10);
  assert.notEqual(auroraRibbon(0, 0, 1), auroraRibbon(phase, 0, 1));
});

test('the dominant wave crest keeps flowing rightward through a complete cycle', () => {
  for (let layer = 0; layer < 6; layer++) {
    let previous: number | undefined;
    let wraps = 0;
    for (let frame = 0; frame <= 120; frame++) {
      let crest = 0, maximum = -Infinity;
      for (let x = 0; x < AURORA_WIDTH; x += 2) {
        const y = (auroraPoint(x, frame / 120 * TAU, layer, 1, false).y + auroraPoint(x, frame / 120 * TAU, layer, 1, true).y) / 2;
        if (y > maximum) { maximum = y; crest = x; }
      }
      if (previous !== undefined) {
        let movement = crest - previous;
        if (movement < -AURORA_WIDTH / 2) { movement += AURORA_WIDTH; wraps++; }
        assert.ok(movement > 0, 'The crest must not ping-pong backward');
      }
      previous = crest;
    }
    assert.equal(wraps, 1);
  }
});

test('playing increases wave amplitude and all ribbons remain within their canvas', () => {
  const range = (energy: number) => {
    const values = Array.from({ length: 121 }, (_, i) => auroraPoint(i * 10, 1, 0, energy, false).y);
    return Math.max(...values) - Math.min(...values);
  };
  assert.ok(range(1) > range(.2) * 1.5);
  for (let layer = 0; layer < 6; layer++) for (let phase = 0; phase < TAU; phase += .2) {
    for (let x = -100; x <= 1300; x += 100) for (const lower of [false, true]) {
      const point = auroraPoint(x, phase, layer, 1, lower);
      assert.ok(Number.isFinite(point.y) && Number.isFinite(point.derivative));
      assert.ok(point.y > 0 && point.y < AURORA_HEIGHT);
    }
  }
});
