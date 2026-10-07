import type { Lesson } from '../content/catalog';
export type AudioContextValue = {
  lesson: Lesson | undefined; playing: boolean; loading: boolean; position: number; duration: number;
  error: string | null; finished: boolean; speed: number;
  playLesson: (lesson: Lesson) => void; toggle: () => void; seek: (seconds: number) => void;
  skip: (seconds: number) => void; changeSpeed: () => void; retry: () => void;
};
