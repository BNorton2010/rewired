import test from 'node:test';
import assert from 'node:assert/strict';
import { nativePlaybackMode, startNativePlayback } from '../src/audio/nativeSession';

function deferred() { let resolve!: () => void; let reject!: (error: unknown) => void; const promise = new Promise<void>((r, j) => { resolve = r; reject = j; }); return { promise, resolve, reject }; }
function fixture() {
  const calls: unknown[] = [];
  const mode = deferred(), active = deferred();
  const session = {
    setMode: (value: typeof nativePlaybackMode) => { calls.push(['mode', value]); return mode.promise; },
    setActive: (value: boolean) => { calls.push(['active', value]); return active.promise; },
  };
  const player = {
    play: () => { calls.push('play'); },
    setActiveForLockScreen: (...args: unknown[]) => { calls.push(['lock', ...args]); },
    updateLockScreenMetadata: (...args: unknown[]) => { calls.push(['metadata', ...args]); },
  };
  return { calls, mode, active, session, player };
}
const tick = () => new Promise<void>(resolve => setImmediate(resolve));
const metadata = { title: 'Illustrative practice', artist: 'Re-Wired FM · Demo ambient sample' };

test('native startup configures background playback and awaits activation before remote controls and play', async () => {
  const f = fixture();
  const task = startNativePlayback(f.player, f.session, { current: () => true, metadata, lockScreenRegistered: false });
  assert.equal(f.calls.length, 1);
  assert.equal(nativePlaybackMode.shouldPlayInBackground, true);
  assert.equal(nativePlaybackMode.playsInSilentMode, true);
  assert.equal(nativePlaybackMode.interruptionMode, 'doNotMix');
  assert.equal(nativePlaybackMode.allowsRecording, false);
  f.mode.resolve(); await tick(); assert.deepEqual(f.calls[1], ['active', true]);
  assert.equal(f.calls.includes('play'), false);
  f.active.resolve(); assert.equal(await task, true);
  assert.deepEqual(f.calls.slice(2), [['lock', true, metadata, { showSeekBackward: true, showSeekForward: true }], 'play']);
});

test('a pause or replaced source while session configuration is pending cannot reactivate or autoplay it', async () => {
  const f = fixture(); let current = true;
  const task = startNativePlayback(f.player, f.session, { current: () => current, metadata, lockScreenRegistered: false });
  current = false; f.mode.resolve(); assert.equal(await task, false);
  assert.equal(f.calls.length, 1);
});

test('a pause during native activation cannot start the player or register stale metadata', async () => {
  const f = fixture(); let current = true;
  const task = startNativePlayback(f.player, f.session, { current: () => current, metadata, lockScreenRegistered: false });
  f.mode.resolve(); await tick(); current = false; f.active.resolve();
  assert.equal(await task, false); assert.equal(f.calls.length, 2);
});

test('resuming keeps the existing remote command registration and refreshes metadata', async () => {
  const f = fixture(); f.mode.resolve(); f.active.resolve();
  await startNativePlayback(f.player, f.session, { current: () => true, metadata, lockScreenRegistered: true });
  assert.deepEqual(f.calls.slice(2), [['metadata', metadata], 'play']);
});

test('activation failure propagates without pretending the audio is playing', async () => {
  const f = fixture(); f.mode.resolve();
  f.session.setActive = async value => { f.calls.push(['active', value]); throw new Error('Audio session interrupted'); };
  await assert.rejects(startNativePlayback(f.player, f.session, { current: () => true, metadata, lockScreenRegistered: false }), /interrupted/);
  assert.equal(f.calls.includes('play'), false);
  assert.equal(f.calls.length, 2);
});

test('play-pause-play invalidates the older pending start even after playback intent becomes true again', async () => {
  const f = fixture(), oldMode = deferred(), newMode = deferred();
  let generation = 0, intendedPlaying = false, registered = false, configurations = 0;
  f.session.setMode = value => { f.calls.push(['mode', value]); return configurations++ === 0 ? oldMode.promise : newMode.promise; };
  const start = () => {
    intendedPlaying = true;
    const currentGeneration = ++generation;
    return startNativePlayback(f.player, f.session, {
      current: () => generation === currentGeneration && intendedPlaying,
      metadata, lockScreenRegistered: registered, onLockScreenRegistered: () => { registered = true; },
    });
  };
  const older = start();
  intendedPlaying = false; generation += 1; // Pause invalidates every pending await.
  const newer = start();
  newMode.resolve(); f.active.resolve(); assert.equal(await newer, true);
  oldMode.resolve(); assert.equal(await older, false);
  assert.equal(f.calls.filter(call => Array.isArray(call) && call[0] === 'active').length, 1);
  assert.equal(f.calls.filter(call => Array.isArray(call) && call[0] === 'lock').length, 1);
  assert.equal(f.calls.filter(call => call === 'play').length, 1); assert.equal(registered, true);
});

test('a superseded session failure cannot overwrite a newer successful playback attempt', async () => {
  const f = fixture(), oldMode = deferred(), newMode = deferred(); let generation = 0, configurations = 0;
  f.session.setMode = value => { f.calls.push(['mode', value]); return configurations++ === 0 ? oldMode.promise : newMode.promise; };
  const start = () => {
    const currentGeneration = ++generation;
    return startNativePlayback(f.player, f.session, { current: () => currentGeneration === generation, metadata, lockScreenRegistered: false });
  };
  const older = start(), newer = start(); newMode.resolve(); f.active.resolve();
  assert.equal(await newer, true);
  oldMode.reject(new Error('Old audio session error')); assert.equal(await older, false);
  assert.equal(f.calls.filter(call => call === 'play').length, 1);
});

test('lock registration is acknowledged synchronously before play and later startup bookkeeping', async () => {
  const f = fixture(); f.mode.resolve(); f.active.resolve(); let registered = false;
  f.player.play = () => { assert.equal(registered, true); f.calls.push('play'); };
  await startNativePlayback(f.player, f.session, { current: () => true, metadata, lockScreenRegistered: false, onLockScreenRegistered: () => { registered = true; } });
});
