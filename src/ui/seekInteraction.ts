import { clampPosition } from '../content/logic';

export type SeekInteraction =
  | { phase: 'idle' }
  | { phase: 'dragging'; value: number; nativeValue: number }
  | { phase: 'seeking'; value: number };

export type SeekAction =
  | { type: 'start' | 'move' | 'commit'; value: number; duration: number }
  | { type: 'position'; value: number }
  | { type: 'reset' };

/** A transport tick cannot move a finger-held thumb or replace an unacknowledged seek. */
export function seekInteraction(state: SeekInteraction, action: SeekAction): SeekInteraction {
  if (action.type === 'reset') return { phase: 'idle' };
  if (action.type === 'position') {
    return state.phase === 'seeking' && Number.isFinite(action.value) && Math.abs(action.value - state.value) <= 1
      ? { phase: 'idle' }
      : state;
  }
  const value = clampPosition(action.value, action.duration);
  if (action.type === 'start') return { phase: 'dragging', value, nativeValue: value };
  if (action.type === 'commit') return { phase: 'seeking', value };
  return state.phase === 'dragging' ? { ...state, value } : state;
}
