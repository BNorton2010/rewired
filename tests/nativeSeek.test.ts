import test from 'node:test';
import assert from 'node:assert/strict';
import { createNativeSeekQueue, shouldHandleNativeCompletion } from '../src/audio/nativeSeek';

function deferred() { let resolve!: () => void; let reject!: (error: unknown) => void; const promise = new Promise<void>((r, j) => { resolve = r; reject = j; }); return { promise, resolve, reject }; }
function fixture() {
  const calls: number[][] = [], waits: ReturnType<typeof deferred>[] = [];
  const queue = createNativeSeekQueue((...args) => { calls.push(args); const wait = deferred(); waits.push(wait); return wait.promise; });
  return { calls, waits, queue };
}
const tick = () => new Promise<void>(resolve => setImmediate(resolve));

test('rapid native seeks serialize, use exact tolerances and retain the newest queued destination', async () => {
  const f = fixture();
  const first = f.queue.seek(30), superseded = f.queue.seek(60), latest = f.queue.seek(90);
  assert.deepEqual(f.calls, [[30, 0, 0]]);
  assert.equal(await superseded, false);
  f.waits[0].resolve(); await tick();
  assert.equal(await first, false); assert.deepEqual(f.calls, [[30, 0, 0], [90, 0, 0]]);
  f.waits[1].resolve(); assert.equal(await latest, true);
});

test('source replacement cancels pending seeks and does not commit a stale in-flight completion', async () => {
  const f = fixture(); const active = f.queue.seek(45), pending = f.queue.seek(75);
  f.queue.cancel(); assert.equal(await pending, false);
  f.waits[0].resolve(); assert.equal(await active, false);
  assert.equal(await f.queue.seek(120), false); assert.equal(f.calls.length, 1);
});

test('a canceled native seek may reject without discarding the latest queued request', async () => {
  const f = fixture(); const first = f.queue.seek(20), latest = f.queue.seek(100);
  f.waits[0].reject(new Error('Previous seek canceled')); await tick();
  assert.equal(await first, false); assert.deepEqual(f.calls[1], [100, 0, 0]);
  f.waits[1].resolve(); assert.equal(await latest, true);
});

test('the final native seek failure reaches the UI and the queue remains reusable', async () => {
  const f = fixture(); const task = f.queue.seek(50); const rejected = assert.rejects(task, /decoder/);
  f.waits[0].reject(new Error('decoder seek failure')); await rejected;
  const retry = f.queue.seek(55); f.waits[1].resolve(); assert.equal(await retry, true);
});

test('a fulfilled native promise cannot acknowledge a canceled seek that never reached its destination', async () => {
  const calls: number[][] = [];
  const queue = createNativeSeekQueue(async (...args) => { calls.push(args); }, () => 42);
  await assert.rejects(queue.seek(100), { code: 'ERR_AUDIO_SEEK' });
  assert.deepEqual(calls, [[100, 0, 0]]); // No arbitrary retry or restart of the transport.
});

test('final seek acknowledgement accepts a small amount of ongoing playback after the exact seek', async () => {
  const queue = createNativeSeekQueue(async () => {}, () => 100.6);
  assert.equal(await queue.seek(100), true);
});

test('replaced sources do not read or acknowledge the released player after an old native seek completes', async () => {
  const wait = deferred(); let reads = 0;
  const queue = createNativeSeekQueue(() => wait.promise, () => { reads += 1; throw new Error('Released native object'); });
  const task = queue.seek(100); queue.cancel(); wait.resolve();
  assert.equal(await task, false); assert.equal(reads, 0);
});

test('old playhead completion during a backward seek preserves the journey and latest playback intent', async () => {
  const f = fixture(); let pending: number | null = 40, completed = false, intendedPlaying = true, position = 180;
  const handleFinish = () => {
    if (shouldHandleNativeCompletion(true, pending, 180, position)) { completed = true; intendedPlaying = false; }
  };
  const seek = f.queue.seek(pending);
  handleFinish(); assert.equal(completed, false); assert.equal(intendedPlaying, true);
  f.waits[0].resolve(); assert.equal(await seek, true); pending = null; position = 40;
  assert.equal(shouldHandleNativeCompletion(false, pending, 180, position), false);
  position = 180;
  handleFinish(); assert.equal(completed, true); assert.equal(intendedPlaying, false);
});

test('deliberate seek to the endpoint still permits completion while a seek before it does not', () => {
  assert.equal(shouldHandleNativeCompletion(true, 180, 180, 180), true);
  assert.equal(shouldHandleNativeCompletion(true, 179.9, 180, 180), false);
  assert.equal(shouldHandleNativeCompletion(false, 180, 180, 180), false);
});

test('a late old endpoint notification cannot complete a practice after a backward seek was acknowledged', () => {
  const pendingPosition = null; // Latest native seek is already acknowledged.
  let completed = false;
  if (shouldHandleNativeCompletion(true, pendingPosition, 180, 40)) completed = true;
  assert.equal(completed, false);
  assert.equal(shouldHandleNativeCompletion(true, pendingPosition, 180, 179.99), true);
});
