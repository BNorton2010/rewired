import assert from 'node:assert/strict';
import test from 'node:test';
import { lessons } from '../src/content/catalog';
import { clampPosition, createJourney, defaultPreferences, filterLessons, recommend } from '../src/content/logic';
import { decodeState, newState } from '../src/persistence/state';

test('recommendations prioritize matching goals and session length', () => {
  assert.equal(recommend({ goals: ['focus'], length: 5 }, []).id, 'one-thing');
  assert.equal(recommend({ goals: ['receiving'], length: 9 }, []).id, 'receiving');
});
test('journey contains fourteen existing lessons and starts with selected goals', () => {
  const path = createJourney({ goals: ['creativity'], length: 5 });
  assert.equal(path.length, 14);
  assert.equal(path[0], 'without-force');
  assert.ok(path.every(id => lessons.some(lesson => lesson.id === id)));
  assert.deepEqual(path, createJourney({ goals: ['creativity'], length: 5 }));
});
test('search, topic filtering, and favorites intersect correctly', () => {
  assert.deepEqual(filterLessons(' doubt ', 'all').map(l => l.id), ['doubt']);
  assert.equal(filterLessons('doubt', 'receiving').length, 0);
  assert.deepEqual(filterLessons('', 'all', ['doubt']).map(l => l.id), ['doubt']);
  assert.equal(filterLessons('', 'all', []).length, 0);
});
test('saved preferences, path, favorites, positions and speed survive decoding', () => {
  const state = { ...newState(), onboarded: true, favorites: ['doubt'], completedLessons: ['doubt'], completedDays: [0, 2], positions: { doubt: 48 }, lastLesson: 'doubt', speed: 1.5 };
  assert.deepEqual(decodeState(JSON.stringify(state)), state);
});
test('invalid saved identifiers and unsafe positions are excluded', () => {
  const state = decodeState(JSON.stringify({ version: 1, favorites: ['missing', 'doubt', 'doubt'], completedDays: [-1, 0, 14, '2'], positions: { missing: 50, doubt: -1, 'be-seen': 26 }, speed: 100 }));
  assert.deepEqual(state.favorites, ['doubt']);
  assert.deepEqual(state.completedDays, [0]);
  assert.deepEqual(state.positions, { 'be-seen': 26 });
  assert.equal(state.speed, 1);
});
test('corrupt or unknown versions are surfaced, not silently replaced', () => {
  assert.throws(() => decodeState('{broken'));
  assert.throws(() => decodeState('{"version":2}'));
  assert.deepEqual(decodeState(null).preferences, defaultPreferences);
});
test('seeking clamps to the actual playable duration', () => {
  assert.equal(clampPosition(-15, 180), 0);
  assert.equal(clampPosition(500, 180), 180);
  assert.equal(clampPosition(Number.NaN, 180), 0);
  assert.equal(clampPosition(30, Number.NaN), 0);
});
