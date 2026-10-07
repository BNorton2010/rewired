import test from 'node:test';
import assert from 'node:assert/strict';
import { createNativePlaybackSession, nativePlaybackMode, startNativePlayback } from '../src/audio/nativeSession';

function deferred() { let resolve!: () => void; let reject!: (error: unknown) => void; const promise = new Promise<void>((r, j) => { resolve = r; reject = j; }); return { promise, resolve, reject }; }
function fixture() {
  const calls: unknown[] = [];
  const mode = deferred();
  const session = createNativePlaybackSession(value => { calls.push(['mode', value]); return mode.promise; });
  const player = {
    play: () => { calls.push('play'); },
    setActiveForLockScreen: (...args: unknown[]) => { calls.push(['lock', ...args]); },
    updateLockScreenMetadata: (...args: unknown[]) => { calls.push(['metadata', ...args]); },
  };
  return { calls, mode, session, player };
}
const metadata = { title: 'Illustrative practice', artist: 'Re-Wired FM · Demo ambient sample' };

test('cold native startup awaits the complete background mode before remote controls and native play', async () => {
  const f = fixture();
  const task = startNativePlayback(f.player, f.session, { current: () => true, metadata, lockScreenRegistered: false });
  assert.equal(f.calls.length, 1);
  assert.equal(nativePlaybackMode.shouldPlayInBackground, true);
  assert.equal(nativePlaybackMode.playsInSilentMode, true);
  assert.equal(nativePlaybackMode.interruptionMode, 'doNotMix');
  assert.equal(nativePlaybackMode.allowsRecording, false);
  assert.equal(f.calls.includes('play'), false);
  f.mode.resolve(); assert.equal(await task, true);
  assert.deepEqual(f.calls.slice(1), [['lock', true, metadata, { showSeekBackward: true, showSeekForward: true }], 'play']);
});

test('provider preparation and an early play share one configuration bridge call', async () => {
  const f = fixture();
  const preparing = f.session.prepare();
  const task = startNativePlayback(f.player, f.session, { current: () => true, metadata, lockScreenRegistered: false });
  assert.equal(f.calls.length, 1);
  f.mode.resolve(); await preparing; assert.equal(await task, true);
  assert.equal(f.session.ready, true);
  assert.equal(f.calls.filter(call => Array.isArray(call) && call[0] === 'mode').length, 1);
});

test('a warmed resume issues native play synchronously with no asynchronous activation or metadata rewrite', async () => {
  const f = fixture(); f.mode.resolve(); await f.session.prepare(); f.calls.length = 0;
  const task = startNativePlayback(f.player, f.session, { current: () => true, metadata, lockScreenRegistered: true, metadataChanged: false });
  // Check before awaiting: the sound starts in this turn, not after a bridge or a
  // promise callback. SDK 57's player.play owns native AVAudioSession activation.
  assert.deepEqual(f.calls, ['play']);
  assert.equal(await task, true);
});

test('a warm play-pause-play sequence does not queue an older play behind the pause', async () => {
  const f = fixture(); f.mode.resolve(); await f.session.prepare(); f.calls.length = 0;
  let generation = 0, intendedPlaying = false;
  const start = () => {
    intendedPlaying = true;
    const attempt = ++generation;
    return startNativePlayback(f.player, f.session, { current: () => generation === attempt && intendedPlaying, metadata, lockScreenRegistered: true, metadataChanged: false });
  };
  const first = start();
  intendedPlaying = false; generation += 1; f.calls.push('pause');
  const latest = start();
  assert.deepEqual(f.calls, ['play', 'pause', 'play']);
  await Promise.all([first, latest]);
  assert.deepEqual(f.calls, ['play', 'pause', 'play']);
});

test('a pause or replaced source while initial configuration is pending cannot autoplay or register stale metadata', async () => {
  const f = fixture(); let current = true;
  const task = startNativePlayback(f.player, f.session, { current: () => current, metadata, lockScreenRegistered: false });
  current = false; f.mode.resolve(); assert.equal(await task, false);
  assert.equal(f.calls.length, 1);
});

test('changing lessons updates remote metadata before play without resetting the prepared category', async () => {
  const f = fixture(); f.mode.resolve(); await f.session.prepare(); f.calls.length = 0;
  await startNativePlayback(f.player, f.session, { current: () => true, metadata, lockScreenRegistered: true, metadataChanged: true });
  assert.deepEqual(f.calls, [['metadata', metadata], 'play']);
});

test('native play activation failure propagates without claiming successful playback', async () => {
  const f = fixture(); f.mode.resolve(); await f.session.prepare();
  f.player.play = () => { throw new Error('Audio session interrupted'); };
  await assert.rejects(startNativePlayback(f.player, f.session, { current: () => true, metadata, lockScreenRegistered: false }), /interrupted/);
  assert.equal(f.calls.includes('play'), false);
});

test('cold play-pause-play starts only the latest intent after the shared mode becomes ready', async () => {
  const f = fixture(); let generation = 0, intendedPlaying = false, registered = false;
  const start = () => {
    intendedPlaying = true;
    const attempt = ++generation;
    return startNativePlayback(f.player, f.session, {
      current: () => generation === attempt && intendedPlaying,
      metadata, lockScreenRegistered: registered, onLockScreenRegistered: () => { registered = true; },
    });
  };
  const older = start(); intendedPlaying = false; generation += 1;
  const newer = start(); f.mode.resolve();
  assert.equal(await older, false); assert.equal(await newer, true);
  assert.equal(f.calls.filter(call => Array.isArray(call) && call[0] === 'mode').length, 1);
  assert.equal(f.calls.filter(call => Array.isArray(call) && call[0] === 'lock').length, 1);
  assert.equal(f.calls.filter(call => call === 'play').length, 1); assert.equal(registered, true);
});

test('a cancelled configuration failure stays silent and a later play can retry setup', async () => {
  const f = fixture(); let current = true;
  const task = startNativePlayback(f.player, f.session, { current: () => current, metadata, lockScreenRegistered: false });
  current = false; f.mode.reject(new Error('Superseded setup')); assert.equal(await task, false);
  assert.equal(f.session.ready, false);
  let attempts = 0;
  const retryable = createNativePlaybackSession(async () => { if (attempts++ === 0) throw new Error('Initial setup failure'); });
  await assert.rejects(retryable.prepare(), /Initial/);
  await retryable.prepare(); assert.equal(retryable.ready, true); assert.equal(attempts, 2);
});

test('foreground reconfiguration does not activate or resume the native transport', async () => {
  const f = fixture(); f.mode.resolve(); await f.session.prepare(); f.calls.length = 0;
  f.session.invalidate(); await f.session.prepare();
  assert.equal(f.session.ready, true);
  assert.deepEqual(f.calls, [['mode', nativePlaybackMode]]);
});

test('an obsolete preparation cannot mark a later foreground recovery ready', async () => {
  const first = deferred(), latest = deferred(); let attempts = 0;
  const session = createNativePlaybackSession(() => attempts++ === 0 ? first.promise : latest.promise);
  const oldPreparation = session.prepare(); session.invalidate();
  const currentPreparation = session.prepare();
  first.resolve(); await oldPreparation; assert.equal(session.ready, false);
  latest.resolve(); await currentPreparation; assert.equal(session.ready, true);
});

test('a foreground invalidation during cold play waits for the current category before transport', async () => {
  const f = fixture(), latest = deferred(); let attempts = 0;
  const session = createNativePlaybackSession(() => attempts++ === 0 ? f.mode.promise : latest.promise);
  const playing = startNativePlayback(f.player, session, { current: () => true, metadata, lockScreenRegistered: false });
  session.invalidate(); const foreground = session.prepare();
  f.mode.resolve(); await new Promise<void>(resolve => setImmediate(resolve));
  assert.equal(f.calls.includes('play'), false);
  latest.resolve(); await foreground;
  assert.equal(await playing, true); assert.equal(f.calls.filter(call => call === 'play').length, 1);
});

test('lock registration and metadata acknowledgement are synchronous before native play', async () => {
  const f = fixture(); f.mode.resolve(); let registered = false, applied = false;
  f.player.play = () => { assert.equal(registered, true); assert.equal(applied, true); f.calls.push('play'); };
  await startNativePlayback(f.player, f.session, { current: () => true, metadata, lockScreenRegistered: false,
    onLockScreenRegistered: () => { registered = true; }, onMetadataApplied: () => { applied = true; } });
});
