import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createJourney, type Preferences } from '../content/logic';
import { decodeState, newState, type LocalState } from './state';
const KEY = 'rewired-fm.local-demo.v1';
type Store = {
  state: Omit<LocalState, 'positions'>; ready: boolean; storageError: string | null;
  savePreferences: (preferences: Preferences) => void; favorite: (id: string) => void;
  complete: (id: string) => void; markDay: (day: number) => void;
  setPosition: (id: string, seconds: number) => void; setLastLesson: (id: string) => void; setSpeed: (speed: number) => void;
  getPosition: (id: string) => number;
};
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: React.PropsWithChildren) {
  const [state, setState] = useState(newState);
  const stateRef = useRef(state); stateRef.current = state;
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const writable = useRef(false);
  const writeQueue = useRef(Promise.resolve());
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(KEY).then(raw => {
      const restored = decodeState(raw);
      if (mounted) { setState(restored); writable.current = true; }
    }).catch(() => { if (mounted) setStorageError('Local storage could not be read. Existing data is preserved; changes in this session may not survive a restart.'); })
      .finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    if (!ready || !writable.current) return;
    writeQueue.current = writeQueue.current.then(() => AsyncStorage.setItem(KEY, JSON.stringify(state))).catch(() => {
      setStorageError('Your latest changes could not be saved on this device. Please check available storage.');
    });
  }, [state, ready]);
  const savePreferences = useCallback((preferences: Preferences) => setState(s => ({ ...s, preferences, onboarded: true, journey: s.onboarded ? s.journey : createJourney(preferences) })), []);
  const favorite = useCallback((id: string) => setState(s => ({ ...s, favorites: s.favorites.includes(id) ? s.favorites.filter(x => x !== id) : [...s.favorites, id] })), []);
  const complete = useCallback((id: string) => setState(s => {
    const nextDay = s.journey.findIndex((_, day) => !s.completedDays.includes(day));
    return { ...s, completedLessons: [...new Set([...s.completedLessons, id])], completedDays: nextDay >= 0 && s.journey[nextDay] === id ? [...s.completedDays, nextDay] : s.completedDays, positions: { ...s.positions, [id]: 0 } };
  }), []);
  const markDay = useCallback((day: number) => setState(s => ({ ...s, completedDays: [...new Set([...s.completedDays, day])], completedLessons: [...new Set([...s.completedLessons, s.journey[day]])] })), []);
  const setPosition = useCallback((id: string, seconds: number) => setState(s => s.positions[id] === seconds ? s : ({ ...s, positions: { ...s.positions, [id]: seconds } })), []);
  const getPosition = useCallback((id: string) => stateRef.current.positions[id] ?? 0, []);
  const setLastLesson = useCallback((id: string) => setState(s => s.lastLesson === id ? s : ({ ...s, lastLesson: id })), []);
  const setSpeed = useCallback((speed: number) => setState(s => s.speed === speed ? s : ({ ...s, speed })), []);
  // Persist the complete state, but keep periodic position saves out of the
  // context read by screens and navigation. Transports read positions on load.
  const screenState = useMemo(() => {
    const { positions: _, ...visible } = state;
    return visible;
  }, [state.preferences, state.onboarded, state.journey, state.favorites, state.completedDays, state.completedLessons, state.lastLesson, state.speed]);
  const value = useMemo(() => ({ state: screenState, ready, storageError, savePreferences, favorite, complete, markDay, setPosition, getPosition, setLastLesson, setSpeed }),
    [screenState, ready, storageError, savePreferences, favorite, complete, markDay, setPosition, getPosition, setLastLesson, setSpeed]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useStore() {
  const store = useContext(Context);
  if (!store) throw new Error('StoreProvider is missing');
  return store;
}
