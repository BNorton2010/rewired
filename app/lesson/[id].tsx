import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../src/persistence/Store';
import { useAudio } from '../../src/audio/AudioProvider';
import { getLesson, topicFor } from '../../src/content/catalog';
import { Body, Button, Heading, IconButton, Label, Page, SectionTitle } from '../../src/ui/components';
import { CosmicArt } from '../../src/ui/CosmicArt';
import { MiniPlayer } from '../../src/ui/MiniPlayer';
import { colors, fonts } from '../../src/ui/theme';
export default function LessonDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = getLesson(id);
  const { state, favorite } = useStore();
  const audio = useAudio();
  const { width } = useWindowDimensions();
  if (!lesson) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><Page><Heading small>Practice not found</Heading><Button title="Back to library" onPress={() => router.replace('/library')} /></Page></SafeAreaView>;
  const saved = state.favorites.includes(lesson.id);
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><Page>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}><IconButton framed name="arrow-left" label="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace('/library')} /><Label style={{ fontSize: 8 }}>ABOUT THE PRACTICE</Label><IconButton framed name="heart" label={saved ? 'Remove favorite' : 'Add favorite'} selected={saved} color={saved ? colors.gold : colors.ink} onPress={() => favorite(lesson.id)} /></View>
    <View style={{ maxWidth: 720, width: '100%', alignSelf: 'center', gap: 27 }}>
      <CosmicArt kind={lesson.artwork} style={{ height: width < 600 ? 225 : 300, borderRadius: 15 }} />
      <View style={{ gap: 13 }}><Label style={{ fontSize: 9 }}>{topicFor(lesson.topic).label.toUpperCase()} · {lesson.minutes} MIN · SAMPLE</Label><Heading style={{ fontSize: 44, lineHeight: 47 }}>{lesson.title}</Heading><Body>{lesson.description}</Body></View>
      <Button title="Play this practice" icon="play" onPress={() => { audio.playLesson(lesson); router.push('/player'); }} />
      <View style={{ paddingVertical: 22, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line, gap: 11 }}><Label style={{ color: colors.gold, fontSize: 9 }}>ILLUSTRATIVE DEMO CONTENT</Label><Body style={{ fontSize: 13, lineHeight: 22 }}>This practice pairs reflective reading with an original {lesson.minutes}-minute ambient audio sample. The audio is instrumental; the text below is not spoken in the sample. Final guided recordings are not included.</Body></View>
      <SectionTitle title="Reflective text" />{lesson.transcript.map((paragraph, i) => <View key={i} style={{ flexDirection: 'row', gap: 17 }}><Text style={{ color: colors.gold, fontFamily: fonts.display, fontSize: 22, lineHeight: 28 }}>{String(i + 1).padStart(2, '0')}</Text><Body style={{ flex: 1, color: '#DAD0E0', fontSize: 16, lineHeight: 28 }}>{paragraph}</Body></View>)}
      <Body style={{ fontSize: 11, lineHeight: 19 }}>A reflective practice for everyday use. Choose a comfortable volume and pause whenever you need to.</Body>
    </View>
  </Page><MiniPlayer /></SafeAreaView>;
}
