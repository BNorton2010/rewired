interface SeekRequest {
  seconds: number;
  resolve(committed: boolean): void;
  reject(error: unknown): void;
}

/** AVPlayer cancels overlapping seeks. Issue one at a time, retaining only the latest destination. */
export function createNativeSeekQueue(seek: (seconds: number, before: number, after: number) => Promise<void>, position?: () => number) {
  let pending: SeekRequest | null = null;
  let running = false;
  let disposed = false;
  const flush = async () => {
    running = true;
    while (pending && !disposed) {
      const current = pending;
      pending = null;
      try {
        // The SDK defaults to infinite tolerances on iOS, which may land away
        // from the thumb's destination. These practices use cached local files.
        await seek(current.seconds, 0, 0);
        if (!disposed && pending === null && position) {
          // SDK 57's iOS wrapper resolves even when AVPlayer reports a cancelled
          // seek. Confirm the final destination instead of claiming success.
          const actual = position();
          if (!Number.isFinite(actual) || Math.abs(actual - current.seconds) > 1) {
            throw Object.assign(new Error('The native player did not reach the requested seek position.'), { code: 'ERR_AUDIO_SEEK' });
          }
        }
        current.resolve(!disposed && pending === null);
      } catch (error) {
        if (disposed || pending) current.resolve(false);
        else current.reject(error);
      }
    }
    running = false;
  };
  return {
    seek(seconds: number) {
      if (disposed) return Promise.resolve(false);
      return new Promise<boolean>((resolve, reject) => {
        pending?.resolve(false);
        pending = { seconds, resolve, reject };
        if (!running) void flush();
      });
    },
    cancel() {
      disposed = true;
      pending?.resolve(false);
      pending = null;
    },
  };
}

/** A pre-seek playhead reaching its old endpoint must not complete a backward seek. */
export function shouldHandleNativeCompletion(didJustFinish: boolean, pendingPosition: number | null, duration: number, position: number) {
  if (!didJustFinish) return false;
  if (!Number.isFinite(duration) || duration <= 0) return pendingPosition === null;
  if (pendingPosition !== null && pendingPosition < duration) return false;
  // A queued terminal notification can arrive after a backward seek has been
  // acknowledged. Read the live native playhead before completing the journey.
  return Number.isFinite(position) && position >= duration - 1;
}
