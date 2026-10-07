import React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../../src/persistence/Store';
import { useAudio } from '../../src/audio/AudioProvider';
import { lessons, topicFor } from '../../src/content/catalog';
import { recommend } from '../../src/content/logic';
import { Body, Button, Heading, Icon, Label, Page, SectionTitle, styles } from '../../src/ui/components';
import { CosmicArt } from '../../src/ui/CosmicArt';
import { LessonCard } from '../../src/ui/LessonCard';
import { TopBar } from '../../src/ui/TopBar';
import { colors } from '../../src/ui/theme';
export default function Today() {
  const { state } = useStore();
  const audio = useAudio();
  const { width } = useWindowDimensions();
  const wide = width > 1150;
  const lesson = recommend(state.preferences, state.completedLessons);
  const day = Math.min(14, state.completedDays.length + 1);
  return <Page><TopBar />
    <View style={{ gap: 9 }}><Label style={{ color: colors.gold }}>A MOMENT FOR YOU</Label><Heading>Your daily{width < 560 ? '\n' : ' '}frequency.</Heading><Body>Come as you are. Leave a little more connected.</Body></View>
    <View style={{ flexDirection: wide ? 'row' : 'column', gap: 24, alignItems: 'stretch' }}>
      <View style={[styles.card, { flex: wide ? 1.6 : undefined }]}>
        <CosmicArt kind={lesson.artwork} style={{ height: wide ? 290 : width < 560 ? 225 : 290 }} />
        <View style={{ position: 'absolute', top: 20, left: 20, backgroundColor: '#070D1BAA', borderRadius: 20, paddingVertical: 7, paddingHorizontal: 12 }}><Label style={{ color: colors.gold, fontSize: 9 }}>CHOSEN FOR YOU</Label></View>
        <View style={{ padding: width < 560 ? 22 : 28, gap: 17 }}>
          <Label style={{ color: topicFor(lesson.topic).color }}>{topicFor(lesson.topic).label.toUpperCase()}  ·  {lesson.minutes} MIN</Label>
          <Text style={{ fontSize: width < 560 ? 28 : 34, lineHeight: width < 560 ? 34 : 40, fontWeight: '800', letterSpacing: -1, color: colors.ink }}>{lesson.title}</Text>
          <Body style={{ fontSize: 14, lineHeight: 22 }}>{lesson.description}</Body>
          <Button title="Play today’s practice" icon="play" onPress={() => { audio.playLesson(lesson); router.push('/player'); }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}><Label style={{ fontSize: 9, letterSpacing: 1 }}>AMBIENT SAMPLE · REFLECTIVE TEXT</Label><Pressable accessibilityRole="button" onPress={() => router.push(`/lesson/${lesson.id}`)}><Text style={{ color: colors.gold, fontSize: 12 }}>About this practice ↗</Text></Pressable></View>
        </View>
      </View>
      <View style={{ flex: wide ? 1 : undefined, gap: 23 }}>
        <View style={[styles.card, { padding: 24, gap: 22 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Label style={{ color: colors.gold }}>YOUR LISTENING PATH</Label><Icon name="feather" color={colors.gold} /></View>
          <View style={{ gap: 10 }}><Heading small>A practice, not{ '\n' }a perfect streak.</Heading><Body style={{ fontSize: 14 }}>Fourteen days of making room for yourself. Move at your own pace.</Body></View>
          <View style={{ flexDirection: 'row', gap: 7, flexWrap: 'wrap' }}>{Array.from({ length: 14 }, (_, i) => <View key={i} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: state.completedDays.includes(i) ? colors.gold : colors.elevated, borderWidth: 1, borderColor: i === day - 1 ? colors.gold : colors.line, alignItems: 'center', justifyContent: 'center' }}>{state.completedDays.includes(i) ? <Icon name="check" color={colors.bg} size={13} /> : <Text style={{ fontSize: 10, color: i === day - 1 ? colors.gold : colors.muted }}>{i + 1}</Text>}</View>)}</View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Label>{state.completedDays.length} OF 14 PRACTICED</Label><Text style={{ color: colors.gold, fontSize: 12 }}>Day {day}</Text></View>
          <Button title="Explore my path" icon="arrow-right" secondary onPress={() => router.navigate('/path')} />
        </View>
        <View style={{ padding: 7, gap: 13 }}><Icon name="sun" size={23} color={colors.gold} /><Text style={{ fontSize: 21, lineHeight: 29, fontWeight: '500', color: colors.ink }}>“You don’t have to become{ '\n' }someone else to begin.”</Text><Label style={{ fontSize: 9 }}>A THOUGHT TO TAKE WITH YOU</Label></View>
      </View>
    </View>
    <SectionTitle title="A moment to reset" right={<Pressable accessibilityRole="button" onPress={() => router.navigate('/library')}><Text style={{ color: colors.gold, fontSize: 13 }}>Explore library →</Text></Pressable>} />
    <View style={{ flexDirection: width < 390 ? 'column' : 'row', gap: 16 }}>{lessons.filter(l => l.quick).map(reset => <LessonCard key={reset.id} lesson={reset} compact />)}</View>
    <Body style={{ fontSize: 12 }}>You’re exploring a local demo. Audio is an original instrumental sample, not a final guided recording.</Body>
  </Page>;
}
