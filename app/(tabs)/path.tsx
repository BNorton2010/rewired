import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../../src/persistence/Store';
import { getLesson, topicFor } from '../../src/content/catalog';
import { Body, Heading, Icon, IconButton, Label, Page, SectionTitle, styles } from '../../src/ui/components';
import { TopBar } from '../../src/ui/TopBar';
import { CosmicArt } from '../../src/ui/CosmicArt';
import { colors } from '../../src/ui/theme';
export default function Path() {
  const { state, markDay } = useStore();
  const next = state.journey.findIndex((_, i) => !state.completedDays.includes(i));
  return <Page><TopBar /><View style={{ gap: 10 }}><Label style={{ color: colors.gold }}>YOUR 14-DAY LISTENING JOURNEY</Label><Heading>A path back to you.</Heading><Body>Small practices. Your own pace. Return whenever you’re ready.</Body></View>
    <View style={[styles.card, { padding: 26, gap: 17 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}><View style={{ gap: 7 }}><Text style={{ color: colors.ink, fontSize: 25, fontWeight: '700' }}>{state.completedDays.length}<Text style={{ color: colors.muted, fontSize: 17 }}> / 14 days practiced</Text></Text><Body style={{ fontSize: 13 }}>{state.completedDays.length === 14 ? 'You have reached the end of this path. Every practice is still yours to revisit.' : 'Progress is listening and reflection, not a score.'}</Body></View><Icon name="feather" size={30} color={colors.gold} /></View>
      <View accessibilityRole="progressbar" accessibilityLabel="Listening journey progress" accessibilityValue={{ min: 0, max: 14, now: state.completedDays.length }} aria-valuemin={0} aria-valuemax={14} aria-valuenow={state.completedDays.length} style={{ height: 5, borderRadius: 3, backgroundColor: colors.line }}><View style={{ height: 5, borderRadius: 3, backgroundColor: colors.gold, width: `${state.completedDays.length / 14 * 100}%` }} /></View>
    </View>
    <SectionTitle title="Your next small step" /><Body style={{ fontSize: 13 }}>Listening to the end completes the next matching day. You can also tap the circle to mark a day you’ve practiced yourself. No days are locked.</Body>
    <View style={{ gap: 12 }}>{state.journey.map((id, day) => {
      const lesson = getLesson(id)!;
      const done = state.completedDays.includes(day);
      return <View key={day} style={[styles.card, { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, borderColor: next === day ? '#E4BD6B90' : colors.line }]}>
        <View style={{ alignItems: 'center', width: 36, gap: 3 }}><Label style={{ fontSize: 8, letterSpacing: .6 }}>DAY</Label><Text style={{ color: done ? colors.teal : colors.gold, fontSize: 21, fontWeight: '700' }}>{String(day + 1).padStart(2, '0')}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Day ${day + 1}: ${lesson.title}`} onPress={() => router.push(`/lesson/${lesson.id}`)} style={{ flex: 1, flexDirection: 'row', gap: 13, alignItems: 'center' }}><CosmicArt kind={lesson.artwork} style={{ width: 54, height: 64, borderRadius: 9 }} /><View style={{ flex: 1, gap: 5 }}><Text style={{ color: colors.ink, fontSize: 15, fontWeight: '700', lineHeight: 21 }}>{lesson.title}</Text><Text style={{ color: colors.muted, fontSize: 11 }}>{topicFor(lesson.topic).short} · {lesson.minutes} min · Sample</Text></View></Pressable>
        <IconButton name={done ? 'check-circle' : 'circle'} label={done ? `Day ${day + 1} completed` : `Mark day ${day + 1} practiced`} color={done ? colors.teal : colors.muted} onPress={() => { if (!done) markDay(day); }} />
      </View>;
    })}</View>
    <Body style={{ fontSize: 12 }}>This is a reflective listening journey, not a psychological assessment or a promise of a particular outcome. Favorites and progress are stored only on this device.</Body>
  </Page>;
}
