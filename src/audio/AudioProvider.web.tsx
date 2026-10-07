import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Asset } from 'expo-asset';
import { getLesson, type Lesson } from '../content/catalog';
import { clampPosition } from '../content/logic';
import { useStore } from '../persistence/Store';
import { audioSources } from './sources';
import type { AudioContextValue } from './types';

// Web has a separate transport: browser play promises, autoplay rules, and tab lifetimes
// differ from the native audio session. Expo selects this module on web automatically.
const Context = createContext<AudioContextValue | null>(null);
export function AudioProvider({ children }: React.PropsWithChildren) {
  const store = useStore();
  const storeRef = useRef(store); storeRef.current = store;
  const mediaRef = useRef<HTMLAudioElement | null>(null);
  const selected = useRef<Lesson | undefined>(undefined);
  const pendingSeek = useRef<number | null>(null);
  const completed = useRef(false);
  const restored = useRef(false);
  const lastSavedAt = useRef(0);
  const loadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lesson, setLesson] = useState<Lesson>();
  const playRequest = useRef(0);
  const [starting, setStarting] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const persist = useCallback(() => {
    const media = mediaRef.current;
    if (media && selected.current && pendingSeek.current === null && !completed.current) storeRef.current.setPosition(selected.current.id, clampPosition(media.currentTime, media.duration));
  }, []);
  useEffect(() => {
    const media = new Audio();
    media.preload = 'auto'; mediaRef.current = media;
    const clearLoading = () => { setLoading(false); if (loadTimer.current) { clearTimeout(loadTimer.current); loadTimer.current = null; } };
    media.onloadedmetadata = () => {
      setDuration(media.duration);
      if (pendingSeek.current !== null) { media.currentTime = clampPosition(pendingSeek.current, media.duration); pendingSeek.current = null; }
      setPosition(media.currentTime);
    };
    media.oncanplay = clearLoading;
    media.onplaying = () => { setPlaying(true); setStarting(false); setError(null); clearLoading(); };
    media.onpause = () => { setStarting(false); setPlaying(false); persist(); };
    media.onwaiting = () => setLoading(true);
    media.onseeked = () => { setPosition(media.currentTime); persist(); };
    media.ontimeupdate = () => {
      setPosition(media.currentTime);
      if (Date.now() - lastSavedAt.current > 3000) { lastSavedAt.current = Date.now(); persist(); }
    };
    media.onended = () => {
      if (completed.current || !selected.current) return;
      completed.current = true; setPlaying(false); setFinished(true); clearLoading();
      storeRef.current.complete(selected.current.id);
    };
    media.onerror = () => { setStarting(false); setPlaying(false); clearLoading(); setError('The audio sample could not be loaded. Check your connection to the development server and retry.'); };
    window.addEventListener('pagehide', persist);
    const visibility = () => { if (document.hidden) persist(); };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      persist(); media.onpause = null; media.pause(); media.removeAttribute('src'); media.load();
      window.removeEventListener('pagehide', persist); document.removeEventListener('visibilitychange', visibility);
      if (loadTimer.current) clearTimeout(loadTimer.current);
    };
  }, [persist]);
  const start = useCallback(() => {
    const media = mediaRef.current;
    if (!media) return;
    setError(null); setStarting(true);
    const attempt = ++playRequest.current;
    // Catch only this player's promise. AbortError is expected if the user pauses
    // or chooses a different sample before the previous play request resolves.
    void media.play().catch((failure: unknown) => {
      if (attempt !== playRequest.current) return;
      setStarting(false);
      if (failure instanceof DOMException && failure.name === 'AbortError') return;
      setPlaying(false); setLoading(false);
      setError(failure instanceof DOMException && failure.name === 'NotAllowedError' ? 'Your browser blocked playback. Tap play to start the sample.' : 'Playback could not start. Please retry the sample.');
    });
  }, []);
  const load = useCallback((item: Lesson, autoplay: boolean) => {
    const media = mediaRef.current;
    if (!media) return;
    playRequest.current++; setStarting(false); persist(); media.pause();
    selected.current = item; setLesson(item); setError(null); setLoading(true); setPlaying(false);
    completed.current = false;
    const saved = storeRef.current.state.positions[item.id] ?? 0;
    pendingSeek.current = saved; setPosition(saved); setDuration(0);
    setFinished(!autoplay && saved === 0 && storeRef.current.state.completedLessons.includes(item.id));
    media.src = Asset.fromModule(audioSources[item.minutes]).uri;
    media.playbackRate = storeRef.current.state.speed; media.preservesPitch = true;
    media.load();
    storeRef.current.setLastLesson(item.id);
    lastSavedAt.current = Date.now();
    if (loadTimer.current) clearTimeout(loadTimer.current);
    loadTimer.current = setTimeout(() => { setLoading(false); setError('The sample is taking too long to load. Please retry.'); }, 15000);
    if (autoplay) start();
  }, [persist, start]);
  useEffect(() => {
    if (!store.ready || restored.current) return;
    restored.current = true;
    const previous = getLesson(store.state.lastLesson);
    if (previous) load(previous, false);
  }, [store.ready, store.state.lastLesson, load]);
  const seek = useCallback((seconds: number) => {
    const media = mediaRef.current;
    if (!media || !Number.isFinite(media.duration)) return;
    completed.current = false; setFinished(false);
    const target = clampPosition(seconds, media.duration);
    media.currentTime = target; setPosition(target); persist();
  }, [persist]);
  const toggle = useCallback(() => {
    const media = mediaRef.current;
    if (!media || !selected.current) return;
    if (error) { load(selected.current, true); return; }
    if (!media.paused || starting) { playRequest.current++; setStarting(false); media.pause(); persist(); }
    else { if (media.ended || completed.current) seek(0); setFinished(false); start(); }
  }, [error, starting, load, persist, seek, start]);
  const playLesson = useCallback((item: Lesson) => {
    if (selected.current?.id === item.id) { if (mediaRef.current?.paused) toggle(); }
    else load(item, true);
  }, [load, toggle]);
  const changeSpeed = useCallback(() => {
    const speeds = [.75, 1, 1.25, 1.5, 2];
    const speed = speeds[(speeds.indexOf(storeRef.current.state.speed) + 1) % speeds.length];
    if (mediaRef.current) mediaRef.current.playbackRate = speed;
    storeRef.current.setSpeed(speed);
  }, []);
  return <Context.Provider value={{ lesson, playing, starting, loading, position, duration, error, finished, speed: store.state.speed, playLesson, toggle, seek, skip: seconds => seek((mediaRef.current?.currentTime ?? 0) + seconds), changeSpeed, retry: () => { if (selected.current) load(selected.current, true); } }}>{children}</Context.Provider>;
}
export function useAudio() {
  const audio = useContext(Context);
  if (!audio) throw new Error('AudioProvider is missing');
  return audio;
}
