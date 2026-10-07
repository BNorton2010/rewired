/** Prepare one native source completely before issuing play. React status may still describe the old source. */
export interface PreparationPlayer {
  readonly isLoaded: boolean;
  readonly duration: number;
  replace(source: { uri: string }): void;
  seekTo(seconds: number, before?: number, after?: number): Promise<void>;
  setPlaybackRate(speed: number): void;
  addListener(event: 'playbackStatusUpdate', listener: (status: { isLoaded: boolean; error?: string | null }) => void): { remove(): void };
}
export async function prepareNativePlayback(player: PreparationPlayer, options: {
  source: () => Promise<{ uri: string }>; position: number; speed: () => number; signal: AbortSignal;
}) {
  // React Native's AbortSignal shim has neither throwIfAborted() nor reason.
  const cancelled = () => Object.assign(new Error('Playback preparation cancelled'), { name: 'AbortError' });
  const check = () => { if (options.signal.aborted) throw cancelled(); };
  const source = await options.source(); check();
  player.replace(source);
  await new Promise<void>((resolve, reject) => {
    if (player.isLoaded) { resolve(); return; }
    const cleanup = () => { subscription.remove(); options.signal.removeEventListener('abort', abort); };
    const abort = () => { cleanup(); reject(cancelled()); };
    const subscription = player.addListener('playbackStatusUpdate', status => {
      if (status.error) { cleanup(); reject(new Error(status.error)); }
      else if (status.isLoaded && player.isLoaded) { cleanup(); resolve(); }
    });
    options.signal.addEventListener('abort', abort, { once: true });
    if (options.signal.aborted) abort();
    else if (player.isLoaded) { cleanup(); resolve(); }
  });
  check();
  const position = Number.isFinite(options.position) && options.position < player.duration ? Math.max(0, options.position) : 0;
  await player.seekTo(position, 0, 0); check();
  player.setPlaybackRate(options.speed());
}
