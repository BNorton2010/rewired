/** Native sliders can emit completion after cancellation. Keep that sequence
 * separate from transport position, and expire only the touch that scheduled it. */
export function createNativeSeekGesture(onInterrupted: () => void) {
  let cancelled = false;
  let generation = 0;
  let endTimer: ReturnType<typeof setTimeout> | null = null;
  const clearEnd = () => {
    if (endTimer !== null) clearTimeout(endTimer);
    endTimer = null;
  };
  return {
    start() {
      clearEnd();
      generation++;
      cancelled = false;
    },
    cancel() {
      clearEnd();
      generation++;
      cancelled = true;
      onInterrupted();
    },
    end() {
      clearEnd();
      const endedGeneration = generation;
      // Let the slider's normal completion commit first. If it never arrives,
      // discard the held thumb rather than stranding the interaction.
      endTimer = setTimeout(() => {
        endTimer = null;
        if (!cancelled && generation === endedGeneration) onInterrupted();
      }, 0);
    },
    complete(commit: () => void) {
      clearEnd();
      if (!cancelled) commit();
    },
    dispose: clearEnd,
  };
}
