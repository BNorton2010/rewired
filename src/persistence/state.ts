import { topics, type SessionLength, type Topic } from '../content/catalog';
import { createJourney, defaultPreferences, isLessonId, type Preferences } from '../content/logic';
export type LocalState = {
  version: 1; onboarded: boolean; preferences: Preferences; favorites: string[];
  completedLessons: string[]; completedDays: number[]; journey: string[];
  positions: Record<string, number>; lastLesson: string | null; speed: number;
};
export const newState = (): LocalState => ({ version: 1, onboarded: false, preferences: defaultPreferences, favorites: [], completedLessons: [], completedDays: [], journey: createJourney(defaultPreferences), positions: {}, lastLesson: null, speed: 1 });
export function decodeState(raw: string | null): LocalState {
  if (!raw) return newState();
  const value = JSON.parse(raw);
  if (!value || value.version !== 1) throw new Error('Unsupported local data version. Your saved data has been preserved.');
  const goals: Topic[] = Array.isArray(value.preferences?.goals) ? value.preferences.goals.filter((goal: unknown) => topics.some(t => t.id === goal)) : [];
  const length = [3, 5, 9].includes(value.preferences?.length) ? value.preferences.length as SessionLength : 5;
  const preferences = { goals: goals.length ? [...new Set(goals)] : defaultPreferences.goals, length };
  const ids = (list: unknown) => Array.isArray(list) ? [...new Set(list.filter(isLessonId))] : [];
  const positions: Record<string, number> = {};
  for (const [id, position] of Object.entries(value.positions ?? {})) {
    if (isLessonId(id) && typeof position === 'number' && Number.isFinite(position) && position >= 0) positions[id] = position;
  }
  return { ...newState(), onboarded: value.onboarded === true, preferences, favorites: ids(value.favorites), completedLessons: ids(value.completedLessons),
    completedDays: Array.isArray(value.completedDays) ? [...new Set<number>(value.completedDays.filter((day: unknown) => Number.isInteger(day) && Number(day) >= 0 && Number(day) < 14))] : [],
    journey: Array.isArray(value.journey) && value.journey.length === 14 && value.journey.every(isLessonId) ? value.journey : createJourney(preferences),
    positions, lastLesson: isLessonId(value.lastLesson) ? value.lastLesson : null, speed: [0.75, 1, 1.25, 1.5, 2].includes(value.speed) ? value.speed : 1 };
}
