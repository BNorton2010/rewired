import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Asset } from 'expo-asset';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { getLesson, type Lesson } from '../content/catalog';
import { clampPosition } from '../content/logic';
import { useStore } from '../persistence/Store';
import { audioSources } from './sources';
import { prepareNativePlayback } from './nativePreparation';
import type { AudioContextValue } from './types';
const Context = createContext<AudioContextValue | null>(null);
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
  const selected = useRef<Lesson | undefined>(undefined);
  const request = useRef<AbortController | null>(null);
  const prepared = useRef(false);
  const wantsPlay = useRef(false);
  const completionHandled = useRef(false);
  const restored = useRef(false);
  const lastSavedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockScreenRegistered = useRef(false);
  const clearTimer = useCallback(() => { if (timer.current) clearTimeout(timer.current); timer.current = null; }, []);
  const savePosition = useCallback(() => {
    if (selected.current && prepared.current && player.isLoaded && !completionHandled.current) {
      storeRef.current.setPosition(selected.current.id, clampPosition(player.currentTime, player.duration));
    }
  }, [player]);
  const start = useCallback(async (signal: AbortSignal) => {
    if (!prepared.current || !wantsPlay.current || signal.aborted) return;
    setStarting(true);
    try {
      // Reapply on every foreground/remote-interruption recovery; never swallow session failures.
      await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix', allowsRecording: false });
      if (signal.aborted || !wantsPlay.current) return;
      const item = selected.current!;
      const metadata = { title: item.title, artist: 'Re-Wired FM · Demo ambient sample', albumTitle: 'Your daily frequency' };
      if (lockScreenRegistered.current) player.updateLockScreenMetadata(metadata);
      else { player.setActiveForLockScreen(true, metadata, { showSeekBackward: true, showSeekForward: true }); lockScreenRegistered.current = true; }
      player.play();
      clearTimer();
      timer.current = setTimeout(() => {
        if (!signal.aborted && wantsPlay.current && !player.playing) {
          wantsPlay.current = false; player.pause(); setStarting(false); setLoading(false);
          setError('Playback did not start. Please retry the sample.');
        }
      }, 15000);
    } catch {
      if (!signal.aborted) { wantsPlay.current = false; setStarting(false); setLoading(false); setError('The audio session could not start. Please retry playback.'); }
    }
  }, [player, clearTimer]);
  const load = useCallback((item: Lesson, autoplay: boolean) => {
    savePosition(); request.current?.abort(); clearTimer(); player.pause();
    const controller = new AbortController(); request.current = controller;
    prepared.current = false; wantsPlay.current = autoplay; completionHandled.current = false;
    selected.current = item; setLesson(item); setFinished(false); setError(null); setLoading(true); setStarting(autoplay);
    storeRef.current.setLastLesson(item.id); lastSavedAt.current = Date.now();
    timer.current = setTimeout(() => {
      controller.abort(); wantsPlay.current = false; player.pause(); setLoading(false); setStarting(false);
      setError('This sample is taking too long to load. Check your connection and retry.');
    }, 30000);
    void prepareNativePlayback(player, {
      source: async () => {
        // Local files survive screen lock and do not depend on the preview server staying reachable.
        const asset = Asset.fromModule(audioSources[item.minutes]); await asset.downloadAsync();
        if (!asset.localUri) throw new Error('Sample could not be cached');
        return { uri: asset.localUri };
      },
      position: storeRef.current.state.positions[item.id] ?? 0,
      speed: () => storeRef.current.state.speed,
      signal: controller.signal,
    }).then(async () => {
      if (controller.signal.aborted) return;
      prepared.current = true; clearTimer(); setLoading(false);
      if (wantsPlay.current) await start(controller.signal);
      else setStarting(false);
    }).catch(() => {
      if (controller.signal.aborted) return;
      clearTimer(); wantsPlay.current = false; setLoading(false); setStarting(false);
      setError('The sample could not be loaded. Please retry.');
    });
  }, [player, savePosition, clearTimer, start]);
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
      if (next.error) { wantsPlay.current = false; clearTimer(); setStarting(false); setError('Audio playback failed. Please retry the sample.'); }
      if (next.playing) { wantsPlay.current = true; clearTimer(); setStarting(false); }
      if (next.didJustFinish && !completionHandled.current) {
        completionHandled.current = true; wantsPlay.current = false; setStarting(false); setFinished(true);
        storeRef.current.complete(selected.current.id);
      } else if (!completionHandled.current && Date.now() - lastSavedAt.current > 3000) {
        lastSavedAt.current = Date.now(); savePosition();
      }
    });
    return () => subscription.remove();
  }, [player, clearTimer, savePosition]);
  useEffect(() => {
    // Backgrounding saves progress; it must never pause the transport.
    const subscription = AppState.addEventListener('change', next => { if (next !== 'active') savePosition(); });
    return () => { subscription.remove(); savePosition(); request.current?.abort(); clearTimer(); player.clearLockScreenControls(); };
  }, [player, savePosition, clearTimer]);
  const seek = useCallback((seconds: number) => {
    if (!prepared.current || !player.isLoaded) return;
    completionHandled.current = false; setFinished(false);
    void player.seekTo(clampPosition(seconds, player.duration)).then(savePosition).catch(() => setError('Could not seek. Please try again.'));
  }, [player, savePosition]);
  const resume = useCallback(() => {
    if (!selected.current) return;
    wantsPlay.current = true; setStarting(true);
    if (!prepared.current || !request.current) return;
    if (completionHandled.current) { load(selected.current, true); return; }
    void start(request.current.signal);
  }, [load, start]);
  const toggle = useCallback(() => {
    if (!selected.current) return;
    if (error) { load(selected.current, true); return; }
    if (player.playing || starting) { wantsPlay.current = false; if (prepared.current) clearTimer(); setStarting(false); player.pause(); savePosition(); }
    else resume();
  }, [player, starting, error, load, clearTimer, savePosition, resume]);
  const playLesson = useCallback((item: Lesson) => {
    if (selected.current?.id !== item.id || error) load(item, true);
    else if (!player.playing && !starting) resume();
  }, [player, error, starting, load, resume]);
  const changeSpeed = useCallback(() => {
    const speeds = [.75, 1, 1.25, 1.5, 2];
    const speed = speeds[(speeds.indexOf(storeRef.current.state.speed) + 1) % speeds.length];
    try { if (prepared.current) player.setPlaybackRate(speed); storeRef.current.setSpeed(speed); } catch { setError('Playback speed could not be changed on this device.'); }
  }, [player]);
  return <Context.Provider value={{ lesson, playing: prepared.current && player.playing, starting, loading: loading || (prepared.current && status.isBuffering), position: prepared.current ? player.currentTime : 0, duration: prepared.current ? player.duration : 0, error, finished, speed: store.state.speed, playLesson, toggle, seek, skip: seconds => seek(player.currentTime + seconds), changeSpeed, retry: () => { if (selected.current) load(selected.current, true); } }}>{children}</Context.Provider>;
}
export function useAudio() {
  const audio = useContext(Context);
  if (!audio) throw new Error('AudioProvider is missing');
  return audio;
}
