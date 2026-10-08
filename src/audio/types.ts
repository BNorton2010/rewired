import type { Lesson } from '../content/catalog';
export type AudioContextValue = {
  lesson: Lesson | undefined; playing: boolean; starting: boolean; loading: boolean; position: number; duration: number;
  error: string | null; finished: boolean; speed: number;
  playLesson: (lesson: Lesson) => void; toggle: () => void; seek: (seconds: number) => void;
  skip: (seconds: number) => void; changeSpeed: () => void; retry: () => void;
  /** Optional native-only, sanitized local troubleshooting report. */
  getPlaybackReport?: () => string;
};
// A ticking playhead should redraw its seek/progress UI, not the artwork,
// library rows or transport buttons that only need playback state.
export type AudioControlsValue = Omit<AudioContextValue, 'position' | 'duration'>;
export type AudioProgressValue = Pick<AudioContextValue, 'position' | 'duration'>;
