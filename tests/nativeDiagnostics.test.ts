import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlaybackDiagnostics, type PlaybackDiagnosticSnapshot } from '../src/audio/nativeDiagnostics';

const runtime = {
  platform: 'ios', osVersion: '26.0', environment: 'storeClient', appVersion: '0.1.0',
  expoGoVersion: '57.0.13', sdkVersion: '57.0.0', updateId: '01a11498-c304-7c58-99f6-b2f0266398dd',
};
const snapshot: PlaybackDiagnosticSnapshot = {
  appState: 'active', lesson: 'trust-again', intendedPlaying: true, prepared: true,
  loaded: true, playing: true, buffering: false, position: 41.2345, duration: 300.001,
};
const clock = () => new Date('2026-10-07T12:00:00.000Z');

test('device playback report retains only thirty recent lifecycle events and the current snapshot', () => {
  const diagnostic = createPlaybackDiagnostics(runtime, clock);
  diagnostic.record('mode-applied', snapshot);
  diagnostic.record('activation-applied', snapshot);
  for (let i = 0; i < 35; i++) diagnostic.record('native-status', { ...snapshot, position: i });
  diagnostic.record('app-state', { ...snapshot, appState: 'background', playing: false });
  const report = JSON.parse(diagnostic.report(snapshot));
  assert.equal(report.events.length, 30); assert.equal(report.events[0].position, 6);
  assert.equal(report.events.at(-1).event, 'app-state'); assert.equal(report.events.at(-1).appState, 'background');
  assert.equal(report.current.position, 41.2); assert.equal(report.current.duration, 300);
  assert.equal(report.runtime.expoGoVersion, '57.0.13'); assert.equal(report.runtime.updateId, runtime.updateId);
  assert.equal(report.session.modeAppliedAt, clock().toISOString()); assert.equal(report.session.activationAppliedAt, clock().toISOString());
});

test('playback diagnostics discard audio URLs, credential fields and native exception messages', () => {
  const marker = 'private-token-that-must-not-appear';
  const diagnostic = createPlaybackDiagnostics({ ...runtime, osVersion: `https://audio.example/${marker}` }, clock);
  diagnostic.record('activation-error', { ...snapshot, lesson: `file:///cache/${marker}.mp3`, audioUri: `https://${marker}` } as PlaybackDiagnosticSnapshot, {
    code: 'ERR_AUDIO_STATE', message: `file:///cache/${marker}.mp3`, token: marker, headers: { Authorization: marker },
  });
  const text = diagnostic.report({ ...snapshot, position: Number.NaN, duration: Number.POSITIVE_INFINITY });
  assert.equal(text.includes(marker), false); assert.equal(text.includes('file:'), false);
  assert.equal(text.includes('https:'), false); assert.equal(text.includes('Authorization'), false);
  const report = JSON.parse(text);
  assert.equal(report.events[0].code, 'ERR_AUDIO_STATE'); assert.equal(report.events[0].failed, true);
  assert.equal(report.events[0].lesson, null); assert.equal(report.runtime.osVersion, null);
  assert.equal(report.current.position, 0); assert.equal(report.current.duration, 0);
});

test('unexpected arbitrary error codes are omitted while numeric OS error codes remain useful', () => {
  const diagnostic = createPlaybackDiagnostics(runtime, clock);
  diagnostic.record('activation-error', snapshot, { code: 'account-secret-123' });
  diagnostic.record('activation-error', snapshot, { code: -50 });
  diagnostic.record('native-error', snapshot, 'Cannot read file:///private/cache.mp3 (OSStatus error -54.)');
  const report = JSON.parse(diagnostic.report(snapshot));
  assert.equal(report.events[0].code, undefined); assert.equal(report.events[1].code, -50);
  assert.equal(report.events[2].code, -54);
  assert.equal(diagnostic.report(snapshot).includes('file:///private/cache.mp3'), false);
});
