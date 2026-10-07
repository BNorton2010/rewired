import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareNativePlayback, type PreparationPlayer } from '../src/audio/nativePreparation';
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; }
function fixture() {
  const calls: unknown[] = [];
  const listeners = new Set<(status: { isLoaded: boolean; error?: string }) => void>();
  const seek = deferred<void>();
  const player: PreparationPlayer = {
    isLoaded: false, duration: 180,
    replace: source => { calls.push(['replace', source]); },
    seekTo: seconds => { calls.push(['seek', seconds]); return seek.promise; },
    setPlaybackRate: speed => { calls.push(['speed', speed]); },
    addListener: (_, listener) => { listeners.add(listener); return { remove: () => listeners.delete(listener) }; },
  };
  return { player, calls, listeners, seek, loaded: () => { Object.assign(player, { isLoaded: true }); for (const listener of listeners) listener({ isLoaded: true }); } };
}
const tick = () => new Promise<void>(resolve => setImmediate(resolve));
test('native source readiness and saved-position seek finish before playback is permitted', async () => {
  const f = fixture(); let permitted = false;
  const task = prepareNativePlayback(f.player, { source: async () => ({ uri: 'file:///sample.mp3' }), position: 45, speed: () => 1.25, signal: new AbortController().signal }).then(() => { permitted = true; });
  await tick(); assert.equal(f.calls.length, 1); assert.equal(permitted, false);
  f.loaded(); await tick(); assert.deepEqual(f.calls[1], ['seek', 45]); assert.equal(permitted, false);
  f.seek.resolve(); await task;
  assert.deepEqual(f.calls[2], ['speed', 1.25]); assert.equal(permitted, true); assert.equal(f.listeners.size, 0);
});
test('a superseded asset download cannot replace the new lesson', async () => {
  const f = fixture(), source = deferred<{ uri: string }>(), controller = new AbortController();
  const task = prepareNativePlayback(f.player, { source: () => source.promise, position: 0, speed: () => 1, signal: controller.signal });
  const rejected = assert.rejects(task); controller.abort(); source.resolve({ uri: 'old.mp3' });
  await rejected; assert.deepEqual(f.calls, []);
});
test('cancellation while loading removes its native subscription', async () => {
  const f = fixture(), controller = new AbortController();
  const task = prepareNativePlayback(f.player, { source: async () => ({ uri: 'file:///sample.mp3' }), position: 0, speed: () => 1, signal: controller.signal });
  await tick(); assert.equal(f.listeners.size, 1);
  const rejected = assert.rejects(task); controller.abort(); await rejected; assert.equal(f.listeners.size, 0);
});
test('cancellation during seek never permits stale autoplay', async () => {
  const f = fixture(), controller = new AbortController();
  const task = prepareNativePlayback(f.player, { source: async () => ({ uri: 'file:///sample.mp3' }), position: 20, speed: () => 1, signal: controller.signal });
  await tick(); f.loaded(); await tick();
  const rejected = assert.rejects(task); controller.abort(); f.seek.resolve(); await rejected;
  assert.equal(f.calls.length, 2);
});
test('saved position at the end restarts the sample instead of immediately completing', async () => {
  const f = fixture();
  const task = prepareNativePlayback(f.player, { source: async () => ({ uri: 'file:///sample.mp3' }), position: 180, speed: () => 1, signal: new AbortController().signal });
  await tick(); f.loaded(); await tick(); assert.deepEqual(f.calls[1], ['seek', 0]); f.seek.resolve(); await task;
});
test('native decoder failures reject preparation without seeking', async () => {
  const f = fixture();
  const task = prepareNativePlayback(f.player, { source: async () => ({ uri: 'bad.mp3' }), position: 0, speed: () => 1, signal: new AbortController().signal });
  await tick(); const rejected = assert.rejects(task, /decoder/);
  for (const listener of f.listeners) listener({ isLoaded: false, error: 'decoder failure' });
  await rejected; assert.equal(f.calls.length, 1); assert.equal(f.listeners.size, 0);
});
