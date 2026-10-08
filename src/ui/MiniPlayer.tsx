import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAudio, useAudioProgress } from '../audio/AudioProvider';
import { colors, fonts } from './theme';
import { CosmicArt } from './CosmicArt';
import { PlayMedallion } from './PlayerControls';
function MiniProgress() {
  const { position, duration } = useAudioProgress();
  return <View style={{ height: 2, borderRadius: 2, backgroundColor: colors.line, marginTop: 3 }}><View style={{ height: 2, borderRadius: 2, width: `${Math.min(100, duration ? position / duration * 100 : 0)}%`, backgroundColor: colors.gold }} /></View>;
}
export function MiniPlayer() {
  const audio = useAudio();
  if (!audio.lesson) return null;
  return <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line, backgroundColor: '#100B16', paddingHorizontal: 18, paddingVertical: 10 }}>
    <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center', maxWidth: 1080, width: '100%', alignSelf: 'center' }}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Open player for ${audio.lesson.title}`} onPress={() => router.push('/player')} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}>
        <CosmicArt kind={audio.lesson.artwork} style={{ height: 50, width: 48, borderRadius: 8 }} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text numberOfLines={1} style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 22, lineHeight: 26 }}>{audio.lesson.title}</Text>
          <Text numberOfLines={1} style={{ color: colors.muted, fontFamily: fonts.body, fontSize: 10 }}>{audio.error ? 'Playback error · open player' : audio.loading ? 'Loading sample…' : audio.finished ? 'Practice complete' : `${audio.playing ? 'Playing' : 'Paused'} · Ambient sample`}</Text>
          <MiniProgress />
        </View>
      </Pressable>
      <PlayMedallion compact playing={audio.playing || audio.starting} loading={audio.loading} label={audio.playing || audio.starting ? 'Pause audio' : 'Play audio'} onPress={() => audio.error ? audio.retry() : audio.toggle()} />
    </View>
  </View>;
}
