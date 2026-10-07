import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAudio } from '../audio/AudioProvider';
import { colors } from './theme';
import { CosmicArt } from './CosmicArt';
import { IconButton } from './components';
export function MiniPlayer() {
  const audio = useAudio();
  if (!audio.lesson) return null;
  return <View style={{ borderTopWidth: 1, borderColor: colors.line, backgroundColor: '#101B2E', paddingHorizontal: 16, paddingVertical: 11 }}>
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', maxWidth: 1120, width: '100%', alignSelf: 'center' }}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Open player for ${audio.lesson.title}`} onPress={() => router.push('/player')} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CosmicArt kind={audio.lesson.artwork} style={{ height: 46, width: 46, borderRadius: 9 }} />
        <View style={{ flex: 1, gap: 4 }}><Text numberOfLines={1} style={{ color: colors.ink, fontWeight: '700', fontSize: 14 }}>{audio.lesson.title}</Text><Text style={{ color: colors.muted, fontSize: 11 }}>{audio.error ? 'Playback error · open player' : audio.loading ? 'Loading sample…' : audio.finished ? 'Practice complete' : `${audio.playing ? 'Playing' : 'Paused'} · ${audio.lesson.minutes} min · Demo sample`}</Text></View>
      </Pressable>
      <IconButton name={audio.playing ? 'pause' : 'play'} label={audio.playing ? 'Pause audio' : 'Play audio'} color={colors.gold} onPress={audio.toggle} />
    </View>
    <View style={{ height: 2, backgroundColor: colors.line, marginTop: 8 }}><View style={{ height: 2, width: `${Math.min(100, audio.duration ? audio.position / audio.duration * 100 : 0)}%`, backgroundColor: colors.gold }} /></View>
  </View>;
}
