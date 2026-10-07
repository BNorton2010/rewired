import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudio } from '../src/audio/AudioProvider';
import { useStore } from '../src/persistence/Store';
import { recommend, formatTime } from '../src/content/logic';
import { topicFor } from '../src/content/catalog';
import { Body, Button, Heading, Icon, IconButton, Label, styles } from '../src/ui/components';
import { CosmicArt } from '../src/ui/CosmicArt';
import { PlaybackVisualizer } from '../src/ui/PlaybackVisualizer';
import { TransportControls, PlayerToolbar } from '../src/ui/PlayerControls';
import { SeekBar } from '../src/ui/SeekBar';
import { colors, fonts } from '../src/ui/theme';

export default function PlayerScreen() {
  const audio = useAudio();
  const store = useStore();
  const [showText, setShowText] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [bodyTop, setBodyTop] = useState(320);
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const lesson = audio.lesson ?? recommend(store.state.preferences, store.state.completedLessons);
  const saved = store.state.favorites.includes(lesson.id);
  const wide = width >= 1000;
  const artworkSize = wide ? 410 : Math.min(width - 64, 330, Math.max(190, (height - insets.top - insets.bottom) * .32));
  const auroraStyle = useMemo(() => ({ top: wide ? 40 : Math.max(0, bodyTop - 75), height: wide ? 440 : 360 + Math.max(0, fontScale - 1) * 80 }), [wide, bodyTop, fontScale]);
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
    <ScrollView testID="player-scroll" keyboardShouldPersistTaps="handled" directionalLockEnabled contentContainerStyle={{ alignItems: 'center', paddingTop: 8, paddingBottom: 24 }}>
      <View style={{ width: '100%', maxWidth: 1080, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <IconButton framed name="chevron-down" label="Close player" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} />
        <Label style={{ color: colors.purple, fontSize: 9 }}>NOW PLAYING</Label>
        <IconButton framed name="heart" label={saved ? 'Remove favorite' : 'Add favorite'} selected={saved} color={saved ? colors.gold : colors.ink} onPress={() => store.favorite(lesson.id)} />
      </View>
      <View style={{ width: '100%', marginTop: wide ? 60 : 22, position: 'relative' }}>
        <PlaybackVisualizer playing={audio.playing && !audio.loading} style={auroraStyle} />
        <View testID="player-foreground" style={{ position: 'relative', zIndex: 1, flexDirection: wide ? 'row' : 'column', gap: wide ? 66 : 23, maxWidth: 1000, width: '100%', alignSelf: 'center', alignItems: 'center', paddingHorizontal: wide ? 24 : 0 }}>
          <CosmicArt kind={lesson.artwork} orbit={lesson.artwork === 'sunrise'} style={{ width: artworkSize, height: artworkSize, borderRadius: 16, borderWidth: 1, borderColor: '#6A486C30' }} />
          <View onLayout={event => setBodyTop(event.nativeEvent.layout.y)} style={{ flex: wide ? 1 : undefined, gap: 18, maxWidth: 460, width: '100%', paddingHorizontal: wide ? 0 : 28 }}>
            <View style={{ gap: 8, alignItems: 'center' }}>
              <Label style={{ fontSize: 9, textAlign: 'center', color: colors.muted }}>{topicFor(lesson.topic).short.toUpperCase()}  ·  SAMPLE AUDIO</Label>
              <Heading style={{ fontSize: wide ? 45 : 39, lineHeight: wide ? 47 : 41, textAlign: 'center', letterSpacing: -.7, maxWidth: wide ? 430 : 280 }}>{lesson.title}</Heading>
              <Body style={{ fontSize: 13, lineHeight: 20, textAlign: 'center', color: '#D2C8DB' }}>Ambient sample + reflective text</Body>
            </View>
            <View style={{ marginTop: 0 }}>
              <SeekBar position={audio.position} duration={audio.duration} onSeek={audio.seek} disabled={!audio.lesson || audio.loading} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text testID="audio-position" style={{ color: colors.muted, fontFamily: fonts.body, fontVariant: ['tabular-nums'], fontSize: 11 }}>{formatTime(audio.position)}</Text>
                <Text style={{ color: colors.muted, fontFamily: fonts.body, fontVariant: ['tabular-nums'], fontSize: 11 }}>{audio.duration ? formatTime(audio.duration) : `${lesson.minutes}:00`}</Text>
              </View>
            </View>
            <TransportControls playing={audio.playing} starting={audio.starting} loading={audio.loading} canSkip={!!audio.lesson && !audio.loading} onSkip={audio.skip} onToggle={() => audio.error ? audio.retry() : audio.lesson ? audio.toggle() : audio.playLesson(lesson)} />
            <PlayerToolbar speed={audio.speed} onSpeed={audio.changeSpeed} showText={showText} onText={() => setShowText(v => !v)} saved={saved} onSave={() => store.favorite(lesson.id)} />
            {audio.error && <View accessibilityRole="alert" style={[styles.card, { padding: 17, gap: 14 }]}><Body style={{ color: colors.gold }}>{audio.error}</Body><Button title="Retry audio" onPress={audio.retry} secondary /></View>}
            {audio.finished && <View style={{ padding: 17, gap: 8, borderTopWidth: 1, borderColor: colors.line }}><Label style={{ color: colors.gold }}>PRACTICE COMPLETE</Label><Body>Your listening progress is saved. Take a moment before your next step.</Body></View>}
            <View style={{ gap: 5, alignItems: 'center', paddingTop: 1 }}>
              <Label style={{ fontSize: 8, letterSpacing: 1.4, textAlign: 'center' }}>ILLUSTRATIVE AUDIO SAMPLE</Label>
              <Pressable accessibilityRole="button" accessibilityLabel="Playback information" accessibilityState={{ expanded: showInfo }} onPress={() => setShowInfo(v => !v)} style={{ minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' }}><Text style={{ color: colors.muted, fontFamily: fonts.body, fontSize: 10 }}>Playback information <Text style={{ color: colors.gold }}>↗</Text></Text></Pressable>
            </View>
            {showInfo && <View style={{ gap: 12 }}>
              <Body style={{ fontSize: 12, lineHeight: 20 }}>{Platform.OS === 'web' ? 'Browser preview: playback starts after a tap. Background audio and media controls depend on your browser and may stop when the tab sleeps. Use the native app to check screen-lock playback.' : 'Native demo: background audio and lock-screen controls are configured. Calls and disconnected headphones can pause playback. Tap play to resume when you are ready.'}</Body>
              {audio.getPlaybackReport && <>
                <Body style={{ fontSize: 12, lineHeight: 20 }}>If screen-lock playback stops, this report helps us check what happened. It contains recent playback events and app versions; no credentials or file addresses.</Body>
                <Button title="Share playback report" secondary onPress={() => { void Share.share({ message: audio.getPlaybackReport!() }).catch(() => {}); }} />
              </>}
            </View>}
          </View>
        </View>
      </View>
      {showText && <View style={{ maxWidth: 680, width: '100%', paddingHorizontal: 28, gap: 20, marginTop: 34 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Icon name="sun" color={colors.gold} size={18} /><Body style={{ flex: 1, color: colors.ink }}>{lesson.intention}</Body></View>
        <Heading small>Reflective text</Heading><Body style={{ fontSize: 13 }}>Reading companion for the demo. This text is not narrated in the ambient sample.</Body>
        {lesson.transcript.map((paragraph, i) => <Body key={i} style={{ color: '#DAD0E0', fontSize: 16, lineHeight: 28 }}>{paragraph}</Body>)}
      </View>}
    </ScrollView>
  </SafeAreaView>;
}
