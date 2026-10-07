import { getLesson, lessons, type SessionLength, type Topic } from './catalog';
export type Preferences = { goals: Topic[]; length: SessionLength };
export const defaultPreferences: Preferences = { goals: ['self-trust', 'visibility'], length: 5 };
export function recommend(preferences: Preferences, completed: string[]) {
  return [...lessons].filter(l => !l.quick).sort((a, b) => {
    const score = (lesson: typeof a) => (preferences.goals.includes(lesson.topic) ? 8 : 0) - Math.abs(lesson.minutes - preferences.length) + (completed.includes(lesson.id) ? 0 : 2);
    return score(b) - score(a);
  })[0];
}
export function createJourney(preferences: Preferences): string[] {
  const preferred = lessons.filter(l => !l.quick && preferences.goals.includes(l.topic)).sort((a, b) => Math.abs(a.minutes - preferences.length) - Math.abs(b.minutes - preferences.length));
  const other = lessons.filter(l => !l.quick && !preferences.goals.includes(l.topic));
  const pool = [...preferred, ...other];
  return Array.from({ length: 14 }, (_, day) => pool[day % pool.length].id);
}
export function filterLessons(query: string, topic: Topic | 'all', favorites?: string[]) {
  const search = query.trim().toLowerCase();
  return lessons.filter(l => (topic === 'all' || l.topic === topic) && (!favorites || favorites.includes(l.id)) && `${l.title} ${l.description} ${l.topic}`.toLowerCase().includes(search));
}
export function clampPosition(position: number, duration: number) {
  const limit = Number.isFinite(duration) ? Math.max(0, duration) : 0;
  return Number.isFinite(position) ? Math.min(Math.max(0, position), limit) : 0;
}
export function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}
export const isLessonId = (value: unknown): value is string => typeof value === 'string' && !!getLesson(value);
