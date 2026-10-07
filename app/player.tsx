import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudio } from '../src/audio/AudioProvider';
import { useStore } from '../src/persistence/Store';
import { recommend, formatTime } from '../src/content/logic';
import { topicFor } from '../src/content/catalog';
import { Body, Button, Heading, Icon, IconButton, Label, Page, styles } from '../src/ui/components';
import { CosmicArt } from '../src/ui/CosmicArt';
import { PlaybackVisualizer } from '../src/ui/PlaybackVisualizer';
import { SeekBar } from '../src/ui/SeekBar';
import { colors } from '../src/ui/theme';
export default function PlayerScreen() {
  const audio = useAudio();
  const store = useStore();
  const [showText, setShowText] = useState(false);
  const { width } = useWindowDimensions();
  const lesson = audio.lesson ?? recommend(store.state.preferences, store.state.completedLessons);
  const saved = store.state.favorites.includes(lesson.id);
  const wide = width > 1000;
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><PlaybackVisualizer playing={audio.playing && !audio.loading} /><Page transparent style={{ paddingTop: 15 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><IconButton name="chevron-down" label="Close player" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} /><Label>NOW PLAYING · DEMO</Label><IconButton name="heart" label={saved ? 'Remove favorite' : 'Add favorite'} selected={saved} color={saved ? colors.gold : colors.ink} onPress={() => store.favorite(lesson.id)} /></View>
    <View style={{ flexDirection: wide ? 'row' : 'column', gap: wide ? 60 : 28, maxWidth: 960, width: '100%', alignSelf: 'center', alignItems: wide ? 'center' : 'stretch' }}>
      <CosmicArt kind={lesson.artwork === 'sunrise' ? 'orbit' : lesson.artwork} orbit style={{ flex: wide ? 1 : undefined, height: wide ? 440 : Math.min(width - 44, 360), maxWidth: wide ? undefined : 420, width: wide ? undefined : '100%', alignSelf: 'center', borderRadius: 26, borderWidth: 1, borderColor: colors.line }} />
      <View style={{ flex: wide ? 1 : undefined, gap: 23, maxWidth: wide ? undefined : 560, width: '100%', alignSelf: 'center' }}>
        <View style={{ gap: 11 }}><Label style={{ color: topicFor(lesson.topic).color }}>{topicFor(lesson.topic).label.toUpperCase()}</Label><Heading style={{ fontSize: wide ? 36 : 29, lineHeight: wide ? 42 : 35 }}>{lesson.title}</Heading><Body>Ambient sample + reflective text</Body></View>
        <View><SeekBar position={audio.position} duration={audio.duration} onSeek={audio.seek} disabled={!audio.lesson || audio.loading} /><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text testID="audio-position" style={{ color: colors.muted, fontSize: 12 }}>{formatTime(audio.position)}</Text><Text style={{ color: colors.muted, fontSize: 12 }}>{audio.duration ? formatTime(audio.duration) : `${lesson.minutes}:00`}</Text></View></View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
          <View style={{ alignItems: 'center' }}><IconButton name="rotate-ccw" label="Skip back 15 seconds" size={28} onPress={() => audio.skip(-15)} /><Label style={{ fontSize: 10 }}>15 SEC</Label></View>
          <Pressable accessibilityRole="button" accessibilityLabel={audio.playing || audio.starting ? 'Pause practice' : 'Play practice'} testID="player-toggle" onPress={() => audio.lesson ? audio.toggle() : audio.playLesson(lesson)} style={({ pressed }) => ({ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', opacity: pressed ? .8 : 1 })}>{audio.loading ? <ActivityIndicator color={colors.bg} /> : <Icon name={audio.playing || audio.starting ? 'pause' : 'play'} size={31} color={colors.bg} />}</Pressable>
          <View style={{ alignItems: 'center' }}><IconButton name="rotate-cw" label="Skip forward 15 seconds" size={28} onPress={() => audio.skip(15)} /><Label style={{ fontSize: 10 }}>15 SEC</Label></View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}><Pressable accessibilityRole="button" accessibilityLabel={`Playback speed ${audio.speed}x. Change speed`} onPress={audio.changeSpeed} style={{ minHeight: 46, justifyContent: 'center', padding: 12 }}><Text style={{ color: colors.ink, fontSize: 16, fontWeight: '600' }}>{audio.speed}×</Text></Pressable><Pressable accessibilityRole="button" accessibilityState={{ expanded: showText }} aria-expanded={showText} accessibilityLabel="Reflective text" onPress={() => setShowText(v => !v)} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', padding: 12, minHeight: 46 }}><Icon name="file-text" size={19} /><Text style={{ color: colors.ink, fontSize: 14 }}>Reflective text</Text></Pressable></View>
        {audio.error && <View accessibilityRole="alert" style={[styles.card, { padding: 17, gap: 14 }]}><Body style={{ color: colors.gold }}>{audio.error}</Body><Button title="Retry audio" onPress={audio.retry} secondary /></View>}
        {audio.finished && <View style={[styles.card, { padding: 17, gap: 8, borderColor: colors.teal }]}><Label style={{ color: colors.teal }}>PRACTICE COMPLETE</Label><Body>Your listening progress is saved. Take a moment before your next step.</Body></View>}
        <View style={[styles.card, { flexDirection: 'row', padding: 19, alignItems: 'center', gap: 15, borderColor: '#2F777F' }]}><Icon name="activity" color={colors.teal} size={23} /><Text style={{ color: colors.ink, fontSize: 14, lineHeight: 21, flex: 1 }}>{lesson.intention}</Text></View>
        <Body style={{ fontSize: 11, lineHeight: 18 }}>{Platform.OS === 'web' ? 'Browser preview: playback starts after a tap. Background audio and media controls depend on your browser and may stop when the tab sleeps. Use a native development build to test device background playback.' : 'Native demo: background audio and lock-screen controls are configured. Calls and disconnected headphones can pause playback. Tap play to resume when you are ready.'}</Body>
      </View>
    </View>
    {showText && <View style={{ maxWidth: 720, width: '100%', alignSelf: 'center', gap: 20, marginTop: 20 }}><Heading small>Reflective text</Heading><Body style={{ fontSize: 13 }}>Reading companion for the demo. This text is not narrated in the ambient sample.</Body>{lesson.transcript.map((paragraph, i) => <Body key={i} style={{ color: '#D1D9E8', fontSize: 16, lineHeight: 28 }}>{paragraph}</Body>)}</View>}
  </Page></SafeAreaView>;
}
