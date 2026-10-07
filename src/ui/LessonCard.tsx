import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Lesson } from '../content/catalog';
import { topicFor } from '../content/catalog';
import { useStore } from '../persistence/Store';
import { CosmicArt } from './CosmicArt';
import { Icon, IconButton, Label, styles } from './components';
import { colors } from './theme';
export function LessonCard({ lesson, compact = false }: { lesson: Lesson; compact?: boolean }) {
  const { state, favorite } = useStore();
  const saved = state.favorites.includes(lesson.id);
  return <View style={[styles.card, { flex: 1 }]}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${lesson.title}, ${lesson.minutes} minute demo sample`} onPress={() => router.push(`/lesson/${lesson.id}`)}>
      <CosmicArt kind={lesson.artwork} style={{ height: compact ? 120 : 172 }} />
      <View style={{ padding: compact ? 15 : 19, gap: 9 }}>
        <Label style={{ color: topicFor(lesson.topic).color, letterSpacing: 1.4 }}>{topicFor(lesson.topic).short.toUpperCase()}</Label>
        <Text style={{ color: colors.ink, fontWeight: '700', fontSize: compact ? 18 : 21, lineHeight: compact ? 23 : 27, letterSpacing: -.5 }}>{lesson.title}</Text>
        <View style={{ flexDirection: 'row', gap: 7, alignItems: 'center' }}><Icon name="headphones" size={12} color={colors.muted} /><Text style={{ fontSize: 12, color: colors.muted }}>{lesson.minutes} min · Sample audio</Text>{state.completedLessons.includes(lesson.id) && <Icon name="check-circle" size={14} color={colors.teal} />}</View>
      </View>
    </Pressable>
    {!compact && <View style={{ position: 'absolute', top: 9, right: 9, borderRadius: 24, backgroundColor: '#070D1BD9' }}><IconButton name="heart" label={saved ? `Unfavorite ${lesson.title}` : `Favorite ${lesson.title}`} selected={saved} color={saved ? colors.gold : colors.ink} onPress={() => favorite(lesson.id)} /></View>}
  </View>;
}
