import React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../../src/persistence/Store';
import { useAudio } from '../../src/audio/AudioProvider';
import { lessons, topicFor } from '../../src/content/catalog';
import { recommend } from '../../src/content/logic';
import { Body, Button, DemoLabel, Heading, Icon, IconButton, Label, Page, SectionTitle } from '../../src/ui/components';
import { CosmicArt } from '../../src/ui/CosmicArt';
import { LessonCard } from '../../src/ui/LessonCard';
import { TopBar } from '../../src/ui/TopBar';
import { colors, fonts } from '../../src/ui/theme';

export default function Today() {
  const { state } = useStore();
  const audio = useAudio();
  const { width } = useWindowDimensions();
  const wide = width > 1100;
  const lesson = recommend(state.preferences, state.completedLessons);
  const nextDay = state.journey.findIndex((_, i) => !state.completedDays.includes(i));
  const day = nextDay === -1 ? 14 : nextDay + 1;
  const resets = <View style={{ gap: 4 }}><SectionTitle title="A moment to reset" />{lessons.filter(l => l.quick).map(reset => <LessonCard key={reset.id} lesson={reset} compact />)}<Pressable accessibilityRole="button" accessibilityLabel="Explore library" onPress={() => router.navigate('/library')} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 }}><Text style={{ color: colors.gold, fontFamily: fonts.body, fontSize: 12 }}>Explore the library</Text><Icon name="arrow-right" color={colors.gold} size={15} /></Pressable></View>;
  const path = <Pressable accessibilityRole="button" accessibilityLabel="Explore my path" onPress={() => router.navigate('/path')} style={({ pressed }) => ({ gap: 16, paddingVertical: 18, opacity: pressed ? .7 : 1 })}>
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}><Text style={{ color: colors.ink, fontFamily: fonts.body, fontSize: 12 }}>Day {String(day).padStart(2, '0')} of your 14-day path</Text><DemoLabel /></View>
    <View style={{ flexDirection: 'row', gap: 5 }}>{Array.from({ length: 14 }, (_, i) => <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: state.completedDays.includes(i) ? colors.gold : i === nextDay ? '#A17C47' : colors.line }} />)}</View>
    {wide && <Body style={{ fontSize: 13 }}>A practice, not a perfect streak. Move at your own pace.</Body>}
  </Pressable>;
  return <Page><TopBar />
    <View style={{ gap: 12 }}>
      <Label style={{ fontSize: 9 }}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}</Label>
      <Heading style={{ fontSize: wide ? 64 : 50, lineHeight: wide ? 65 : 51 }}>Make room{width < 600 ? '\n' : ' '}for yourself.</Heading>
      <Body style={{ fontSize: 14 }}>A few quiet minutes. A little more self-trust.</Body>
    </View>
    <View style={{ flexDirection: wide ? 'row' : 'column', gap: wide ? 54 : 28, alignItems: 'stretch' }}>
      <View style={{ flex: wide ? 1.4 : undefined, gap: 18 }}>
        <View><CosmicArt kind={lesson.artwork === 'orbit' ? 'sunrise' : lesson.artwork} style={{ height: wide ? 275 : width < 600 ? 185 : 260, borderRadius: 13 }} /><View style={{ position: 'absolute', top: 12, left: 12, paddingHorizontal: 9, paddingVertical: 4, backgroundColor: '#08060BCC', borderRadius: 5 }}><Label style={{ fontSize: 8, letterSpacing: 1.2, color: colors.ink }}>SAMPLE</Label></View></View>
        <View style={{ gap: 9 }}><Label style={{ fontSize: 9 }}>{topicFor(lesson.topic).short.toUpperCase()}  ·  {lesson.minutes} MIN</Label><Heading style={{ fontSize: wide ? 40 : 33, lineHeight: wide ? 43 : 36, letterSpacing: -.4 }}>{lesson.title}</Heading><View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}><Body style={{ fontSize: 13, flex: 1 }}>Ambient sample + reflective text</Body><IconButton name="info" size={17} color={colors.muted} label="About this practice" onPress={() => router.push(`/lesson/${lesson.id}`)} /></View></View>
        <Button title="Start listening" icon="play" onPress={() => { if (audio.lesson?.id === lesson.id) { if (audio.error) audio.retry(); else if (!audio.playing && !audio.starting) audio.toggle(); } else audio.playLesson(lesson); router.push('/player'); }} />
      </View>
      <View style={{ flex: wide ? 1 : undefined, gap: wide ? 22 : 12 }}>
        {resets}
        {path}
        {wide && <View style={{ gap: 15, borderTopWidth: 1, borderColor: colors.line, paddingTop: 25 }}><Icon name="sun" size={22} color={colors.gold} /><Text style={{ fontFamily: fonts.display, fontSize: 31, lineHeight: 37, color: colors.ink }}>You don’t have to become someone else to begin.</Text><Label style={{ fontSize: 8 }}>A THOUGHT TO TAKE WITH YOU</Label></View>}
      </View>
    </View>
    <Body style={{ fontSize: 11, lineHeight: 18 }}>You’re exploring a local demo with illustrative practices and original ambient samples. Final guided recordings are not included.</Body>
  </Page>;
}
