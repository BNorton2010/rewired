import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { Asset } from 'expo-asset';
import Constants from 'expo-constants';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { getLesson, type Lesson } from '../content/catalog';
import { clampPosition } from '../content/logic';
import { useStore } from '../persistence/Store';
import { audioSources } from './sources';
import { prepareNativePlayback } from './nativePreparation';
import { createNativePlaybackSession, nativePlaybackMode, startNativePlayback } from './nativeSession';
import { createNativeSeekQueue, shouldHandleNativeCompletion } from './nativeSeek';
import { createPlaybackDiagnostics, type PlaybackDiagnosticEvent } from './nativeDiagnostics';
import { AudioStateProvider } from './contexts';
import { previewRevision } from '../preview';
export { useAudio, useAudioProgress } from './contexts';
export function AudioProvider({ children }: React.PropsWithChildren) {
  const store = useStore();
  const storeRef = useRef(store); storeRef.current = store;
  // Prevent the SDK's delayed pause deactivation from racing a replacement/buffering source.
  // Keep the selected session available for iOS remote play after a lock-screen pause.
  const player = useAudioPlayer(null, { updateInterval: 250, keepAudioSessionActive: true });
  const status = useAudioPlayerStatus(player);
  const [lesson, setLesson] = useState<Lesson>();
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [seekPosition, setSeekPosition] = useState<number | null>(null);
  const selected = useRef<Lesson | undefined>(undefined);
  const request = useRef<AbortController | null>(null);
  const prepared = useRef(false);
  const wantsPlay = useRef(false);
  const pendingStart = useRef(false);
  const completionHandled = useRef(false);
  const restored = useRef(false);
  const lastSavedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockScreenRegistered = useRef(false);
  const lockScreenLesson = useRef<string | null>(null);
  const seekQueue = useRef<ReturnType<typeof createNativeSeekQueue> | null>(null);
  const seekGeneration = useRef(0);
  const pendingSeekPosition = useRef<number | null>(null);
  const startGeneration = useRef(0);
  const lastDiagnosticStatus = useRef('');
  const lastNativeFlags = useRef({ error: false, mediaServicesReset: false });
  const diagnostics = useRef<ReturnType<typeof createPlaybackDiagnostics> | null>(null);
  if (!diagnostics.current) diagnostics.current = createPlaybackDiagnostics({
    platform: Platform.OS, osVersion: String(Platform.Version), environment: Constants.executionEnvironment,
    appVersion: Constants.expoConfig?.version, expoGoVersion: Constants.expoVersion,
    sdkVersion: Constants.expoConfig?.sdkVersion, updateId: Constants.manifest2?.id ?? null,
    previewRevision,
  });
  const diagnosticSnapshot = useCallback(() => {
    // Diagnostics must not throw if an in-flight session callback arrives after
    // the native shared object has been released during a reload/unmount.
    const snapshot = { appState: AppState.currentState, lesson: selected.current?.id, intendedPlaying: wantsPlay.current, prepared: prepared.current,
      loaded: false, playing: false, buffering: false, position: 0, duration: 0,
      playbackState: 'unknown', timeControlStatus: 'unknown', waitingReason: 'unknown',
      nativeError: lastNativeFlags.current.error, mediaServicesReset: lastNativeFlags.current.mediaServicesReset };
    try {
      const native = player.currentStatus;
      return { ...snapshot, loaded: native.isLoaded, playing: native.playing, buffering: native.isBuffering,
        position: native.currentTime, duration: native.duration, playbackState: native.playbackState,
        timeControlStatus: native.timeControlStatus, waitingReason: native.reasonForWaitingToPlay };
    } catch { return snapshot; }
  }, [player]);
  const record = useCallback((event: PlaybackDiagnosticEvent, failure?: unknown, appState?: string) => {
    diagnostics.current?.record(event, { ...diagnosticSnapshot(), ...(appState ? { appState } : {}) }, failure);
  }, [diagnosticSnapshot]);
  const configureMode = useCallback(async () => {
    record('mode-requested');
    try { await setAudioModeAsync(nativePlaybackMode); record('mode-applied'); }
    catch (failure) { record('mode-error', failure); throw failure; }
  }, [record]);
  const session = useMemo(() => createNativePlaybackSession(configureMode), [configureMode]);
  const setPendingStart = useCallback((value: boolean) => { pendingStart.current = value; setStarting(value); }, []);
  const clearTimer = useCallback(() => { if (timer.current) clearTimeout(timer.current); timer.current = null; }, []);
  const savePosition = useCallback(() => {
    if (selected.current && prepared.current && player.isLoaded && !completionHandled.current) {
      storeRef.current.setPosition(selected.current.id, clampPosition(pendingSeekPosition.current ?? player.currentTime, player.duration));
    }
  }, [player]);
  const start = useCallback(async (signal: AbortSignal) => {
    if (!prepared.current || !wantsPlay.current || signal.aborted) return;
    const generation = ++startGeneration.current;
    const item = selected.current!;
    const current = () => generation === startGeneration.current && !signal.aborted && wantsPlay.current && selected.current === item && prepared.current;
    setPendingStart(true);
    try {
      const metadata = { title: item.title, artist: 'Re-Wired FM · Demo ambient sample', albumTitle: 'Your daily frequency' };
      const started = await startNativePlayback(player, session, {
        current,
        metadata, lockScreenRegistered: lockScreenRegistered.current,
        metadataChanged: lockScreenLesson.current !== item.id,
        onLockScreenRegistered: () => { lockScreenRegistered.current = true; },
        onMetadataApplied: () => { lockScreenLesson.current = item.id; },
      });
      if (!started || !current()) { record('start-cancelled'); return; }
      record('play-issued');
      clearTimer();
      // The native transport is readable immediately; a warmed play should not
      // wait for the 250 ms position observer to update its button or artwork.
      if (player.playing) { setPlaying(true); setPendingStart(false); return; }
      timer.current = setTimeout(() => {
        if (current() && !player.playing) {
          wantsPlay.current = false; player.pause(); setPlaying(false); setPendingStart(false); setLoading(false);
          record('start-timeout');
          setError('Playback did not start. Please retry the sample.');
        }
      }, 15000);
    } catch (failure) {
      if (!current()) { record('start-cancelled'); return; }
      record('start-error', failure);
      wantsPlay.current = false; setPlaying(false); setPendingStart(false); setLoading(false); setError('The audio session could not start. Please retry playback.');
    }
  }, [player, clearTimer, session, record, setPendingStart]);
  const load = useCallback((item: Lesson, autoplay: boolean) => {
    startGeneration.current += 1;
    savePosition(); request.current?.abort(); clearTimer(); player.pause(); setPlaying(false);
    seekQueue.current?.cancel(); seekQueue.current = null; seekGeneration.current += 1; pendingSeekPosition.current = null; setSeekPosition(null);
    const controller = new AbortController(); request.current = controller;
    prepared.current = false; wantsPlay.current = autoplay; completionHandled.current = false;
    lastNativeFlags.current = { error: false, mediaServicesReset: false }; lastDiagnosticStatus.current = '';
    selected.current = item; setLesson(item); setFinished(false); setError(null); setLoading(true); setPendingStart(autoplay);
    record('source-selected'); if (autoplay) record('play-requested');
    storeRef.current.setLastLesson(item.id); lastSavedAt.current = Date.now();
    timer.current = setTimeout(() => {
      controller.abort(); wantsPlay.current = false; player.pause(); setPlaying(false); setLoading(false); setPendingStart(false);
      record('load-timeout');
      setError('This sample is taking too long to load. Check your connection and retry.');
    }, 30000);
    void prepareNativePlayback(player, {
      source: async () => {
        // Local files survive screen lock and do not depend on the preview server staying reachable.
        const asset = Asset.fromModule(audioSources[item.minutes]); await asset.downloadAsync();
        if (!asset.localUri) throw new Error('Sample could not be cached');
        if (!controller.signal.aborted) record('source-cached');
        return { uri: asset.localUri };
      },
      position: storeRef.current.getPosition(item.id),
      speed: () => storeRef.current.state.speed,
      signal: controller.signal,
    }).then(async () => {
      if (controller.signal.aborted) return;
      prepared.current = true;
      record('source-ready');
      seekQueue.current = createNativeSeekQueue((seconds, before, after) => player.seekTo(seconds, before, after), () => player.currentTime);
      clearTimer(); setLoading(false);
      if (wantsPlay.current) await start(controller.signal);
      else setPendingStart(false);
    }).catch(failure => {
      if (controller.signal.aborted) return;
      clearTimer(); wantsPlay.current = false; setPlaying(false); setLoading(false); setPendingStart(false);
      record('source-error', failure);
      setError('The sample could not be loaded. Please retry.');
    });
  }, [player, savePosition, clearTimer, start, record, setPendingStart]);
  useEffect(() => {
    if (store.ready && !restored.current) {
      restored.current = true;
      const previous = getLesson(store.state.lastLesson);
      if (previous) load(previous, false);
    }
  }, [store.ready, store.state.lastLesson, load]);
  useEffect(() => {
    const subscription = player.addListener('playbackStatusUpdate', next => {
      if (!prepared.current || !selected.current) return;
      if (next.mediaServicesDidReset && !lastNativeFlags.current.mediaServicesReset) session.invalidate();
      lastNativeFlags.current = { error: !!next.error, mediaServicesReset: !!next.mediaServicesDidReset };
      const key = `${next.playing}|${next.isLoaded}|${next.isBuffering}|${next.didJustFinish}|${!!next.error}|${next.mediaServicesDidReset}|${next.timeControlStatus}|${next.reasonForWaitingToPlay}`;
      if (key !== lastDiagnosticStatus.current) { lastDiagnosticStatus.current = key; record('native-status'); }
      if (next.error) { wantsPlay.current = false; record('native-error', next.error); clearTimer(); setPendingStart(false); setPlaying(false); setError('Audio playback failed. Please retry the sample.'); }
      else {
        // A queued status can describe the frame before a rapid pause. Read the
        // current native transport instead of reviving stale playback intent.
        const actuallyPlaying = player.playing;
        setPlaying(actuallyPlaying);
        if (actuallyPlaying) { wantsPlay.current = true; clearTimer(); setPendingStart(false); }
        else if (!pendingStart.current) wantsPlay.current = false;
      }
      if (shouldHandleNativeCompletion(next.didJustFinish, pendingSeekPosition.current, player.duration, player.currentTime) && !completionHandled.current) {
        completionHandled.current = true; wantsPlay.current = false; setPlaying(false); setPendingStart(false); setFinished(true);
        record('completed');
        storeRef.current.complete(selected.current.id);
      } else if (!completionHandled.current && Date.now() - lastSavedAt.current > 3000) {
        lastSavedAt.current = Date.now(); savePosition();
      }
    });
    return () => subscription.remove();
  }, [player, clearTimer, savePosition, record, session, setPendingStart]);
  useEffect(() => {
    // Configure the module before the first source is downloaded. Foreground
    // recovery reapplies the category, but never starts an interrupted player.
    record('provider-ready');
    void session.prepare().catch(() => {
      // A play tap retries configuration and presents an actionable error.
    });
  }, [session, record]);
  useEffect(() => {
    // Backgrounding saves progress; it must never pause the transport.
    const subscription = AppState.addEventListener('change', next => {
      record('app-state', undefined, next);
      if (next !== 'active') savePosition();
      if (next === 'active') {
        // Reassert only on return to foreground, never during an interruption.
        // Do not play or activate: a call, headset disconnect or remote pause
        // retains the OS's transport decision.
        session.invalidate();
        void session.prepare().catch(() => {});
      }
    });
    return () => { startGeneration.current += 1; subscription.remove(); savePosition(); request.current?.abort(); seekQueue.current?.cancel(); clearTimer(); player.clearLockScreenControls(); };
  }, [player, savePosition, clearTimer, session, record]);
  const seek = useCallback((seconds: number) => {
    if (!prepared.current || !player.isLoaded || !seekQueue.current) return;
    completionHandled.current = false; setFinished(false);
    const destination = clampPosition(seconds, player.duration);
    const generation = ++seekGeneration.current;
    const controller = request.current;
    pendingSeekPosition.current = destination;
    record('seek-requested');
    setSeekPosition(destination);
    void seekQueue.current.seek(destination).then(committed => {
      if (!committed || generation !== seekGeneration.current || controller !== request.current || controller?.signal.aborted) return;
      pendingSeekPosition.current = null; setSeekPosition(null); savePosition(); record('seek-completed');
    }).catch(failure => {
      if (generation !== seekGeneration.current || controller !== request.current || controller?.signal.aborted) return;
      pendingSeekPosition.current = null; setSeekPosition(null); setError('Could not seek. Please try again.');
      record('seek-error', failure);
    });
  }, [player, savePosition, record]);
  const resume = useCallback(() => {
    if (!selected.current) return;
    wantsPlay.current = true; setPendingStart(true);
    record('play-requested');
    if (!prepared.current || !request.current) return;
    if (completionHandled.current) { load(selected.current, true); return; }
    void start(request.current.signal);
  }, [load, start, record, setPendingStart]);
  const toggle = useCallback(() => {
    if (!selected.current) return;
    if (error) { load(selected.current, true); return; }
    if (player.playing || pendingStart.current) { startGeneration.current += 1; wantsPlay.current = false; setPendingStart(false); setPlaying(false); player.pause(); record('pause-requested'); if (prepared.current) clearTimer(); savePosition(); }
    else resume();
  }, [player, error, load, clearTimer, savePosition, resume, record, setPendingStart]);
  const playLesson = useCallback((item: Lesson) => {
    if (selected.current?.id !== item.id || error) load(item, true);
    else if (!player.playing && !pendingStart.current) resume();
  }, [player, error, load, resume]);
  const changeSpeed = useCallback(() => {
    const speeds = [.75, 1, 1.25, 1.5, 2];
    const speed = speeds[(speeds.indexOf(storeRef.current.state.speed) + 1) % speeds.length];
    try { if (prepared.current) player.setPlaybackRate(speed); storeRef.current.setSpeed(speed); } catch { setError('Playback speed could not be changed on this device.'); }
  }, [player]);
  const skip = useCallback((seconds: number) => seek((pendingSeekPosition.current ?? player.currentTime) + seconds), [player, seek]);
  const retry = useCallback(() => { if (selected.current) load(selected.current, true); }, [load]);
  const getPlaybackReport = useCallback(() => diagnostics.current!.report(diagnosticSnapshot()), [diagnosticSnapshot]);
  const isPlaying = prepared.current && playing;
  const isLoading = loading || (prepared.current && (playing || starting) && status.isBuffering);
  const controls = useMemo(() => ({ lesson, playing: isPlaying, starting, loading: isLoading, error, finished, speed: store.state.speed, playLesson, toggle, seek, skip, changeSpeed, retry, getPlaybackReport }),
    [lesson, isPlaying, starting, isLoading, error, finished, store.state.speed, playLesson, toggle, seek, skip, changeSpeed, retry, getPlaybackReport]);
  const position = prepared.current ? (seekPosition ?? player.currentTime) : 0;
  const duration = prepared.current ? player.duration : 0;
  const progress = useMemo(() => ({ position, duration }), [position, duration]);
  return <AudioStateProvider controls={controls} progress={progress}>{children}</AudioStateProvider>;
}
