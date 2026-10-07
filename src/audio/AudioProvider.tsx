import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { getLesson, type Lesson } from '../content/catalog';
import { clampPosition } from '../content/logic';
import { useStore } from '../persistence/Store';
import { audioSources } from './sources';
import type { AudioContextValue } from './types';
const Context = createContext<AudioContextValue | null>(null);
export function AudioProvider({ children }: React.PropsWithChildren) {
  const store = useStore();
  const storeRef = useRef(store); storeRef.current = store;
  const player = useAudioPlayer(null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const [lesson, setLesson] = useState<Lesson>();
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const selected = useRef<Lesson | undefined>(undefined);
  const pendingSeek = useRef<number | null>(null);
  const completionHandled = useRef(false);
  const restored = useRef(false);
  const lastSavedAt = useRef(0);
  const loadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionReady = useRef(Promise.resolve());
  useEffect(() => {
    sessionReady.current = setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix', allowsRecording: false }).catch(() => setError('The audio session could not be configured. Please retry playback.'));
    return () => { if (loadTimer.current) clearTimeout(loadTimer.current); };
  }, []);
  const savePosition = useCallback(() => {
    if (selected.current && player.isLoaded && pendingSeek.current === null && !completionHandled.current) {
      storeRef.current.setPosition(selected.current.id, clampPosition(player.currentTime, player.duration));
    }
  }, [player]);
  const activateLockScreen = useCallback((item: Lesson) => {
    if (Platform.OS === 'web') return;
    player.setActiveForLockScreen(true, { title: item.title, artist: 'Re-Wired FM · Demo ambient sample', albumTitle: 'Your daily frequency' }, { showSeekBackward: true, showSeekForward: true });
  }, [player]);
  const load = useCallback((item: Lesson, autoplay: boolean) => {
    savePosition();
    player.pause();
    selected.current = item; setLesson(item); setFinished(false); setError(null); setLoading(true);
    completionHandled.current = false;
    pendingSeek.current = storeRef.current.state.positions[item.id] ?? 0;
    lastSavedAt.current = Date.now();
    if (loadTimer.current) clearTimeout(loadTimer.current);
    loadTimer.current = setTimeout(() => { setLoading(false); setError('This sample is taking too long to load. Check your connection to the development server and retry.'); }, 15000);
    try {
      player.replace(audioSources[item.minutes]);
      player.setPlaybackRate(storeRef.current.state.speed);
      storeRef.current.setLastLesson(item.id);
      if (autoplay) {
        // On web, play must stay inside the initiating user gesture.
        if (Platform.OS === 'web') player.play();
        else void sessionReady.current.then(() => { if (selected.current?.id === item.id) { activateLockScreen(item); player.play(); } }).catch(() => setError('Playback could not start. Try again.'));
      }
    } catch { setLoading(false); setError('The sample could not be loaded. Please try again.'); }
  }, [player, savePosition, activateLockScreen]);
  useEffect(() => {
    if (store.ready && !restored.current) {
      restored.current = true;
      const previous = getLesson(store.state.lastLesson);
      if (previous) load(previous, false);
    }
  }, [store.ready, store.state.lastLesson, load]);
  useEffect(() => {
    if (!lesson) return;
    if (status.error) { setError('Audio playback failed. Please retry the sample.'); setLoading(false); }
    if (status.isLoaded) {
      setLoading(false);
      if (loadTimer.current) { clearTimeout(loadTimer.current); loadTimer.current = null; }
      if (pendingSeek.current !== null) {
        const position = clampPosition(pendingSeek.current, status.duration);
        pendingSeek.current = null;
        void player.seekTo(position).catch(() => setError('Your listening position could not be restored. Try seeking again.'));
      }
      if (status.didJustFinish && !completionHandled.current) {
        completionHandled.current = true; setFinished(true);
        store.complete(lesson.id);
      } else if (!completionHandled.current && Date.now() - lastSavedAt.current > 3000) {
        lastSavedAt.current = Date.now(); savePosition();
      }
    }
  }, [status, lesson, player, store.complete, savePosition]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', next => { if (next !== 'active') savePosition(); });
    if (Platform.OS === 'web') window.addEventListener('pagehide', savePosition);
    return () => { subscription.remove(); if (Platform.OS === 'web') window.removeEventListener('pagehide', savePosition); savePosition(); };
  }, [savePosition]);
  const seek = useCallback((seconds: number) => {
    if (!player.isLoaded) return;
    completionHandled.current = false; setFinished(false);
    const position = clampPosition(seconds, player.duration);
    void player.seekTo(position).then(savePosition).catch(() => setError('Could not seek. Please try again.'));
  }, [player, savePosition]);
  const toggle = useCallback(() => {
    if (!selected.current) return;
    if (error) { load(selected.current, true); return; }
    try {
      if (player.playing) { player.pause(); savePosition(); }
      else {
        if (completionHandled.current) {
          const item = selected.current;
          void player.seekTo(0).then(() => {
            completionHandled.current = false; setFinished(false);
            activateLockScreen(item); player.play();
          }).catch(() => setError('The sample could not be restarted. Please retry.'));
          return;
        }
        activateLockScreen(selected.current); player.play();
      }
    } catch { setError('Playback could not start. Please try again.'); }
  }, [player, savePosition, activateLockScreen, error, load, seek]);
  const playLesson = useCallback((item: Lesson) => { if (selected.current?.id === item.id) { if (!player.playing) toggle(); } else load(item, true); }, [player, toggle, load]);
  const changeSpeed = useCallback(() => {
    const speeds = [.75, 1, 1.25, 1.5, 2];
    const speed = speeds[(speeds.indexOf(storeRef.current.state.speed) + 1) % speeds.length];
    try { player.setPlaybackRate(speed); storeRef.current.setSpeed(speed); } catch { setError('Playback speed could not be changed on this device.'); }
  }, [player]);
  return <Context.Provider value={{ lesson, playing: status.playing, loading: loading || status.isBuffering, position: status.currentTime, duration: status.duration, error, finished, speed: store.state.speed, playLesson, toggle, seek, skip: seconds => seek(player.currentTime + seconds), changeSpeed, retry: () => { if (selected.current) load(selected.current, true); } }}>{children}</Context.Provider>;
}
export function useAudio() {
  const audio = useContext(Context);
  if (!audio) throw new Error('AudioProvider is missing');
  return audio;
}
