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

interface NativeSession {
  setMode(mode: AudioMode): Promise<void>;
  setActive(active: boolean): Promise<void>;
}
interface NativeTransport {
  play(): void;
  setActiveForLockScreen(active: boolean, metadata: AudioMetadata, options: { showSeekBackward: boolean; showSeekForward: boolean }): void;
  updateLockScreenMetadata(metadata: AudioMetadata): void;
}

/** Configure and activate before transport, guarding each asynchronous boundary. */
export async function startNativePlayback(player: NativeTransport, session: NativeSession, options: {
  current: () => boolean;
  metadata: AudioMetadata;
  lockScreenRegistered: boolean;
  onLockScreenRegistered?: () => void;
}) {
  if (!options.current()) return false;
  try {
    await session.setMode(nativePlaybackMode);
    if (!options.current()) return false;
    // setAudioModeAsync sets the native category; activation is a separate API.
    // Explicit activation also recovers an audio client disabled by a previous
    // session without relying on a background JavaScript timer to replay audio.
    await session.setActive(true);
    if (!options.current()) return false;
    if (options.lockScreenRegistered) player.updateLockScreenMetadata(options.metadata);
    else {
      player.setActiveForLockScreen(true, options.metadata, { showSeekBackward: true, showSeekForward: true });
      options.onLockScreenRegistered?.();
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
