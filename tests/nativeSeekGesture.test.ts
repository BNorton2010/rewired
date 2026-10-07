import assert from 'node:assert/strict';
import test from 'node:test';
import { createNativeSeekGesture } from '../src/ui/nativeSeekGesture';

test('a cancelled native drag cannot seek even if the slider subsequently emits completion', context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const events: string[] = [];
  const gesture = createNativeSeekGesture(() => events.push('release'));
  gesture.start();
  gesture.cancel();
  gesture.complete(() => events.push('seek'));
  context.mock.timers.runAll();
  assert.deepEqual(events, ['release']);
  gesture.start();
  gesture.complete(() => events.push('new seek'));
  assert.deepEqual(events, ['release', 'new seek']);
});

test('a new drag is not reset by the preceding touch-end fallback', context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  let released = 0;
  const gesture = createNativeSeekGesture(() => released++);
  gesture.start();
  gesture.end();
  gesture.start();
  context.mock.timers.runAll();
  assert.equal(released, 0);
  gesture.end();
  context.mock.timers.runAll();
  assert.equal(released, 1);
});

test('normal completion clears fallback and missing completion releases the held thumb', context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const events: string[] = [];
  const gesture = createNativeSeekGesture(() => events.push('release'));
  gesture.start();
  gesture.end();
  gesture.complete(() => events.push('seek'));
  context.mock.timers.runAll();
  assert.deepEqual(events, ['seek']);
  gesture.start();
  gesture.end();
  context.mock.timers.runAll();
  assert.deepEqual(events, ['seek', 'release']);
  // A completion arriving after the fallback can still commit the native value.
  gesture.complete(() => events.push('late seek'));
  assert.deepEqual(events, ['seek', 'release', 'late seek']);
});

test('disposing a mounted slider clears any pending fallback', context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  let released = false;
  const gesture = createNativeSeekGesture(() => { released = true; });
  gesture.start();
  gesture.end();
  gesture.dispose();
  context.mock.timers.runAll();
  assert.equal(released, false);
});
