import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Lesson } from '../content/catalog';
import { topicFor } from '../content/catalog';
import { useStore } from '../persistence/Store';
import { useAudio } from '../audio/AudioProvider';
import { CosmicArt } from './CosmicArt';
import { Icon, IconButton } from './components';
import { PlayMedallion } from './PlayerControls';
import { colors, fonts } from './theme';

// Library and quick resets share a quiet row instead of a nested stack of cards.
export function LessonCard({ lesson, compact = false }: { lesson: Lesson; compact?: boolean }) {
  const { state, favorite } = useStore();
  const audio = useAudio();
  const saved = state.favorites.includes(lesson.id);
  const active = audio.lesson?.id === lesson.id;
  const playing = active && (audio.playing || audio.starting);
  return <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.line }}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${lesson.title}, ${lesson.minutes} minute demo sample`} onPress={() => router.push(`/lesson/${lesson.id}`)} style={({ pressed }) => ({ flex: 1, flexDirection: 'row', gap: 15, alignItems: 'center', opacity: pressed ? .65 : 1 })}>
      <CosmicArt kind={lesson.artwork} style={{ width: compact ? 58 : 66, height: compact ? 62 : 72, borderRadius: 9 }} />
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: compact ? 24 : 26, lineHeight: compact ? 27 : 29 }}>{lesson.title}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}><Text style={{ fontFamily: fonts.medium, fontSize: 9, letterSpacing: .8, color: colors.muted }}>{topicFor(lesson.topic).short.toUpperCase()} · {lesson.minutes} MIN · SAMPLE</Text>{state.completedLessons.includes(lesson.id) && <Icon name="check" size={12} color={colors.gold} />}</View>
      </View>
    </Pressable>
    {compact ? <PlayMedallion compact playing={playing} loading={active && audio.loading} label={`${playing ? 'Pause' : 'Play'} ${lesson.title}`} onPress={() => { if (active) { if (audio.error) audio.retry(); else audio.toggle(); } else audio.playLesson(lesson); router.push('/player'); }} /> : <IconButton name="heart" size={20} label={saved ? `Unfavorite ${lesson.title}` : `Favorite ${lesson.title}`} selected={saved} color={saved ? colors.gold : colors.muted} onPress={() => favorite(lesson.id)} />}
  </View>;
}
