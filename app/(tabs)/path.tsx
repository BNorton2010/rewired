import React from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../../src/persistence/Store';
import { getLesson, topicFor } from '../../src/content/catalog';
import { Body, DemoLabel, Heading, Icon, IconButton, Label, Page, SectionTitle } from '../../src/ui/components';
import { TopBar } from '../../src/ui/TopBar';
import { CosmicArt } from '../../src/ui/CosmicArt';
import { colors, fonts } from '../../src/ui/theme';

export default function Path() {
  const { state, markDay } = useStore();
  const { width } = useWindowDimensions();
  const next = state.journey.findIndex((_, i) => !state.completedDays.includes(i));
  return <Page><TopBar />
    <View style={{ gap: 12 }}><Label style={{ color: colors.gold, fontSize: 9 }}>YOUR 14-DAY LISTENING JOURNEY</Label><Heading>A path back{width < 600 ? '\n' : ' '}to you.</Heading><Body style={{ fontSize: 14 }}>Small practices, at your own pace.</Body></View>
    <View style={{ gap: 20, paddingVertical: 8 }}>
      <CosmicArt kind="moon" style={{ height: width < 600 ? 110 : 210, borderRadius: 13 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}><View style={{ gap: 8, flex: 1 }}><Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 29, lineHeight: 33 }}>{state.completedDays.length} / 14 days practiced</Text><Body style={{ fontSize: 12, lineHeight: 20 }}>{next === -1 ? 'This path is yours to revisit whenever you need it.' : 'Progress is listening and reflection, not a score.'}</Body></View><Icon name="feather" size={26} color={colors.gold} /></View>
      <View accessibilityRole="progressbar" accessibilityLabel="Listening journey progress" accessibilityValue={{ min: 0, max: 14, now: state.completedDays.length }} aria-valuemin={0} aria-valuemax={14} aria-valuenow={state.completedDays.length} style={{ flexDirection: 'row', gap: 5 }}>{state.journey.map((_, i) => <View key={i} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: state.completedDays.includes(i) ? colors.gold : colors.line }} />)}</View>
    </View>
    <View style={{ gap: 10 }}><SectionTitle title="Your next small step" /><Body style={{ fontSize: 12, lineHeight: 20 }}>Finish listening, or tap a circle to mark a practiced day. Every day is available.</Body></View>
    <View>{state.journey.map((id, day) => {
      const lesson = getLesson(id)!;
      const done = state.completedDays.includes(day);
      return <View key={day} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 17, gap: 11, borderBottomWidth: 1, borderColor: colors.line }}>
        <View style={{ alignItems: 'center', width: 30, gap: 4 }}><Label style={{ fontSize: 7, letterSpacing: 1 }}>DAY</Label><Text style={{ color: done ? colors.gold : colors.muted, fontFamily: fonts.display, fontSize: 27, lineHeight: 29 }}>{String(day + 1).padStart(2, '0')}</Text>{next === day && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.gold }} />}</View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Day ${day + 1}: ${lesson.title}`} onPress={() => router.push(`/lesson/${lesson.id}`)} style={({ pressed }) => ({ flex: 1, flexDirection: 'row', gap: 12, alignItems: 'center', opacity: pressed ? .65 : 1 })}>
          {width >= 360 && <CosmicArt kind={lesson.artwork} style={{ width: 46, height: 55, borderRadius: 8 }} />}
          <View style={{ flex: 1, gap: 6 }}><Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 24, lineHeight: 27 }}>{lesson.title}</Text><Text style={{ color: colors.muted, fontFamily: fonts.body, fontSize: 9 }}>{topicFor(lesson.topic).short} · {lesson.minutes} min · Sample</Text></View>
        </Pressable>
        <IconButton name={done ? 'check-circle' : 'circle'} size={20} label={done ? `Day ${day + 1} completed` : `Mark day ${day + 1} practiced`} color={done ? colors.gold : colors.subtle} onPress={() => { if (!done) markDay(day); }} />
      </View>;
    })}</View>
    <DemoLabel /><Body style={{ fontSize: 11, lineHeight: 18 }}>A reflective listening journey, not a psychological assessment or a promise of an outcome. Favorites and progress are stored on this device.</Body>
  </Page>;
}
