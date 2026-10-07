export type PlaybackDiagnosticEvent =
  | 'provider-ready' | 'source-selected' | 'source-cached' | 'source-ready' | 'source-error' | 'load-timeout'
  | 'play-requested' | 'pause-requested' | 'mode-requested' | 'mode-applied' | 'mode-error'
  | 'activation-requested' | 'activation-applied' | 'activation-error' | 'play-issued' | 'start-cancelled'
  | 'start-error' | 'start-timeout' | 'native-status' | 'native-error' | 'completed' | 'app-state'
  | 'seek-requested' | 'seek-completed' | 'seek-error';
export interface PlaybackDiagnosticSnapshot {
  appState: string | null;
  lesson: string | undefined;
  intendedPlaying: boolean;
  prepared: boolean;
  loaded: boolean;
  playing: boolean;
  buffering: boolean;
  position: number;
  duration: number;
  playbackState?: string;
  timeControlStatus?: string;
  waitingReason?: string;
  nativeError?: boolean;
  mediaServicesReset?: boolean;
}
export interface PlaybackDiagnosticRuntime {
  platform: string;
  osVersion: string;
  environment: string;
  appVersion: string | undefined;
  expoGoVersion: string | null;
  sdkVersion: string | undefined;
  updateId: string | null;
  previewRevision?: string;
}
const shortIdentifier = (value: unknown) => typeof value === 'string' && /^[a-zA-Z0-9_.-]{1,64}$/.test(value) ? value : null;
const seconds = (value: number) => Number.isFinite(value) ? Math.round(Math.max(0, Math.min(86400, value)) * 10) / 10 : 0;
function sanitizedSnapshot(snapshot: PlaybackDiagnosticSnapshot) {
  return {
    appState: ['active', 'inactive', 'background', 'extension', 'unknown'].includes(snapshot.appState ?? '') ? snapshot.appState : 'unknown',
    lesson: shortIdentifier(snapshot.lesson),
    intendedPlaying: !!snapshot.intendedPlaying, prepared: !!snapshot.prepared,
    loaded: !!snapshot.loaded, playing: !!snapshot.playing, buffering: !!snapshot.buffering,
    position: seconds(snapshot.position), duration: seconds(snapshot.duration),
    playbackState: ['unknown', 'readyToPlay', 'failed', 'idle', 'ready', 'buffering', 'ended'].includes(snapshot.playbackState ?? '') ? snapshot.playbackState : 'unknown',
    timeControlStatus: ['unknown', 'playing', 'paused', 'waitingToPlayAtSpecifiedRate'].includes(snapshot.timeControlStatus ?? '') ? snapshot.timeControlStatus : 'unknown',
    waitingReason: ['unknown', 'evaluatingBufferingRate', 'noItemToPlay', 'toMinimizeStalls'].includes(snapshot.waitingReason ?? '') ? snapshot.waitingReason : 'unknown',
    nativeError: !!snapshot.nativeError, mediaServicesReset: !!snapshot.mediaServicesReset,
  };
}
function errorCode(error: unknown) {
  // Native exception messages may contain file URLs. Retain only recognized
  // audio error codes or numeric OS codes, never arbitrary messages/objects.
  const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
  if (typeof code === 'number' && Number.isSafeInteger(code)) return code;
  if (typeof code === 'string' && /^ERR_(?:AUDIO|PLAYBACK|SESSION|PLAYER|AV)[A-Z_]{0,48}$/.test(code)) return code;
  const message = typeof error === 'string' ? error : error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : '';
  const osCode = message.slice(0, 500).match(/(?:OSStatus(?:\s+error)?|(?:NSOSStatus|AVFoundation|NSCocoa)ErrorDomain\s+Code=)\s*[:=]?\s*(-?\d{1,10})/i)?.[1];
  if (osCode) return Number(osCode);
  return undefined;
}

/** Local, memory-only breadcrumbs for a device issue; no credentials, file URLs or device identifiers. */
export function createPlaybackDiagnostics(runtime: PlaybackDiagnosticRuntime, clock = () => new Date()) {
  const events: Array<ReturnType<typeof sanitizedSnapshot> & { at: string; event: PlaybackDiagnosticEvent; failed?: boolean; code?: number | string }> = [];
  const session: { modeAppliedAt: string | null; activationAppliedAt: string | null; lastErrorAt: string | null; lastErrorCode?: number | string } = { modeAppliedAt: null, activationAppliedAt: null, lastErrorAt: null };
  return {
    record(event: PlaybackDiagnosticEvent, snapshot: PlaybackDiagnosticSnapshot, error?: unknown) {
      const at = clock().toISOString();
      if (event === 'mode-applied') session.modeAppliedAt = at;
      if (event === 'activation-applied') session.activationAppliedAt = at;
      if (event === 'mode-error' || event === 'activation-error') { session.lastErrorAt = at; session.lastErrorCode = errorCode(error); }
      events.push({ at, event, ...sanitizedSnapshot(snapshot), ...(error === undefined ? {} : { failed: true, code: errorCode(error) }) });
      if (events.length > 30) events.splice(0, events.length - 30);
    },
    report(snapshot: PlaybackDiagnosticSnapshot) {
      return JSON.stringify({
        report: 'Re-Wired FM local playback report', version: 1, createdAt: clock().toISOString(),
        runtime: {
          platform: shortIdentifier(runtime.platform), osVersion: shortIdentifier(runtime.osVersion),
          environment: shortIdentifier(runtime.environment), appVersion: shortIdentifier(runtime.appVersion),
          expoGoVersion: shortIdentifier(runtime.expoGoVersion), sdkVersion: shortIdentifier(runtime.sdkVersion),
          updateId: typeof runtime.updateId === 'string' && /^[a-f0-9-]{36}$/i.test(runtime.updateId) ? runtime.updateId : null,
          previewRevision: shortIdentifier(runtime.previewRevision),
        },
        session: { ...session, activationOwner: 'native-player.play' }, current: sanitizedSnapshot(snapshot), events,
      }, null, 2);
    },
  };
}
