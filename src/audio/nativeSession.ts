import type { AudioMetadata, AudioMode } from 'expo-audio';

// SDK 57's native audio module starts with background playback disabled. Always
// pass the complete playback mode: native Record defaults also apply to omitted
// fields, and another audio client in the Expo Go container shares AVAudioSession.
export const nativePlaybackMode: AudioMode = {
  playsInSilentMode: true,
  shouldPlayInBackground: true,
  interruptionMode: 'doNotMix',
  allowsRecording: false,
  allowsBackgroundRecording: false,
  shouldRouteThroughEarpiece: false,
};

/** Share the initial bridge call; foreground recovery can invalidate this cache. */
export function createNativePlaybackSession(setMode: (mode: AudioMode) => Promise<void>) {
  let ready = false;
  let generation = 0;
  let pending: Promise<void> | null = null;
  return {
    get ready() { return ready; },
    prepare() {
      if (ready) return Promise.resolve();
      if (pending) return pending;
      const attempt = generation;
      const preparation = setMode(nativePlaybackMode).then(() => {
        if (attempt === generation) ready = true;
      }).finally(() => {
        if (pending === preparation) pending = null;
      });
      pending = preparation;
      return preparation;
    },
    invalidate() { generation += 1; ready = false; pending = null; },
  };
}
type NativeSession = ReturnType<typeof createNativePlaybackSession>;
interface NativeTransport {
  play(): void;
  setActiveForLockScreen(active: boolean, metadata: AudioMetadata, options: { showSeekBackward: boolean; showSeekForward: boolean }): void;
  updateLockScreenMetadata(metadata: AudioMetadata): void;
}

/** A prepared resume reaches native play synchronously, before any promise yield. */
export async function startNativePlayback(player: NativeTransport, session: NativeSession, options: {
  current: () => boolean;
  metadata: AudioMetadata;
  lockScreenRegistered: boolean;
  metadataChanged?: boolean;
  onLockScreenRegistered?: () => void;
  onMetadataApplied?: () => void;
}) {
  if (!options.current()) return false;
  try {
    while (!session.ready) {
      await session.prepare();
      if (!options.current()) return false;
    }
    // SDK 57's native play() activates AVAudioSession itself. A separate
    // asynchronous activation and category reset on every tap delays transport.
    if (options.lockScreenRegistered && options.metadataChanged !== false) {
      player.updateLockScreenMetadata(options.metadata);
      options.onMetadataApplied?.();
    } else if (!options.lockScreenRegistered) {
      player.setActiveForLockScreen(true, options.metadata, { showSeekBackward: true, showSeekForward: true });
      options.onLockScreenRegistered?.();
      options.onMetadataApplied?.();
    }
    player.play();
    return true;
  } catch (failure) {
    // A cancelled attempt must not surface its eventual error over a newer
    // successful attempt or over the user's pause decision.
    if (!options.current()) return false;
    throw failure;
  }
}
