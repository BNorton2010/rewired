import assert from 'node:assert/strict';
import test from 'node:test';
import { seekInteraction, type SeekInteraction } from '../src/ui/seekInteraction';

test('transport updates cannot overwrite a thumb drag, and native value stays fixed during the drag', () => {
  let state: SeekInteraction = seekInteraction({ phase: 'idle' }, { type: 'start', value: 30, duration: 180 });
  state = seekInteraction(state, { type: 'move', value: 110.5, duration: 180 });
  state = seekInteraction(state, { type: 'position', value: 31 });
  assert.deepEqual(state, { phase: 'dragging', value: 110.5, nativeValue: 30 });
});

test('release retains the seek target until playback acknowledges it instead of jumping back', () => {
  let state: SeekInteraction = seekInteraction({ phase: 'idle' }, { type: 'commit', value: 90, duration: 180 });
  state = seekInteraction(state, { type: 'position', value: 20.5 });
  assert.deepEqual(state, { phase: 'seeking', value: 90 });
  state = seekInteraction(state, { type: 'position', value: 90.25 });
  assert.deepEqual(state, { phase: 'idle' });
});

test('an earlier asynchronous seek cannot acknowledge a newer target', () => {
  let state: SeekInteraction = seekInteraction({ phase: 'idle' }, { type: 'commit', value: 120, duration: 180 });
  state = seekInteraction(state, { type: 'commit', value: 15, duration: 180 });
  state = seekInteraction(state, { type: 'position', value: 120 });
  assert.deepEqual(state, { phase: 'seeking', value: 15 });
  assert.deepEqual(seekInteraction(state, { type: 'position', value: 15 }), { phase: 'idle' });
});

test('cancelling or timing out a gesture releases the override and late move events do nothing', () => {
  const dragging = seekInteraction({ phase: 'idle' }, { type: 'start', value: 30, duration: 180 });
  const reset = seekInteraction(dragging, { type: 'reset' });
  assert.deepEqual(reset, { phase: 'idle' });
  assert.equal(seekInteraction(reset, { type: 'move', value: 60, duration: 180 }), reset);
  const seeking = seekInteraction({ phase: 'idle' }, { type: 'commit', value: 30, duration: 180 });
  assert.deepEqual(seekInteraction(seeking, { type: 'reset' }), { phase: 'idle' });
});

test('seek targets remain inside the loaded audio even with invalid or out-of-track input', () => {
  assert.deepEqual(seekInteraction({ phase: 'idle' }, { type: 'commit', value: -15, duration: 180 }), { phase: 'seeking', value: 0 });
  assert.deepEqual(seekInteraction({ phase: 'idle' }, { type: 'commit', value: 500, duration: 180 }), { phase: 'seeking', value: 180 });
  assert.deepEqual(seekInteraction({ phase: 'idle' }, { type: 'commit', value: NaN, duration: 180 }), { phase: 'seeking', value: 0 });
});
