import React, { createContext, useContext } from 'react';
import type { AudioControlsValue, AudioProgressValue } from './types';

const ControlsContext = createContext<AudioControlsValue | null>(null);
const ProgressContext = createContext<AudioProgressValue | null>(null);

export function AudioStateProvider({ controls, progress, children }: React.PropsWithChildren<{
  controls: AudioControlsValue;
  progress: AudioProgressValue;
}>) {
  return <ControlsContext.Provider value={controls}><ProgressContext.Provider value={progress}>{children}</ProgressContext.Provider></ControlsContext.Provider>;
}

export function useAudio() {
  const audio = useContext(ControlsContext);
  if (!audio) throw new Error('AudioProvider is missing');
  return audio;
}

export function useAudioProgress() {
  const progress = useContext(ProgressContext);
  if (!progress) throw new Error('AudioProvider is missing');
  return progress;
}
