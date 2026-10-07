import type { SessionLength } from '../content/catalog';
// Replace these local assets with final recordings, or HTTPS audio sources, at this boundary.
export const audioSources: Record<SessionLength, number> = {
  3: require('../../assets/audio/ambient-3m.mp3'),
  5: require('../../assets/audio/ambient-5m.mp3'),
  9: require('../../assets/audio/ambient-9m.mp3'),
};
