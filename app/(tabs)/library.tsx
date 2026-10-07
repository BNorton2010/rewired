import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { topics, type Topic } from '../../src/content/catalog';
import { filterLessons } from '../../src/content/logic';
import { useStore } from '../../src/persistence/Store';
import { Body, DemoLabel, Heading, Icon, Label, Page, Pill } from '../../src/ui/components';
import { TopBar } from '../../src/ui/TopBar';
import { LessonCard } from '../../src/ui/LessonCard';
import { CosmicArt } from '../../src/ui/CosmicArt';
import { colors, fonts } from '../../src/ui/theme';

export default function Library() {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<Topic | 'all'>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const { state } = useStore();
  const { width } = useWindowDimensions();
  const columns = width >= 1100 ? 2 : 1;
  const found = filterLessons(query, topic, onlyFavorites ? state.favorites : undefined);
  const featured = !query.trim() && topic === 'all' && !onlyFavorites ? found.find(l => l.id === 'receiving') : undefined;
  const rows = featured ? found.filter(l => l.id !== featured.id) : found;
  return <Page><TopBar />
    <View style={{ gap: 13 }}><Heading>Find your{width < 600 ? '\n' : ' '}frequency.</Heading><Body style={{ fontSize: 14 }}>A little space for whatever you need today.</Body></View>
    <View style={{ flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, paddingHorizontal: 16, borderRadius: 14, minHeight: 52, alignItems: 'center' }}><Icon name="search" size={18} color={colors.muted} /><TextInput accessibilityLabel="Search lessons" placeholder="Search practices" placeholderTextColor={colors.subtle} value={query} onChangeText={setQuery} style={{ flex: 1, fontFamily: fonts.body, color: colors.ink, fontSize: 14, minHeight: 52, paddingVertical: 13 }} /></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 3 }}><Pill title="All" selected={topic === 'all'} onPress={() => setTopic('all')} />{topics.map(t => <Pill key={t.id} title={t.short} selected={topic === t.id} onPress={() => setTopic(t.id)} />)}<Pill title="♥ Favorites" selected={onlyFavorites} onPress={() => setOnlyFavorites(v => !v)} /></ScrollView>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><Label style={{ fontSize: 9 }}>{found.length} {found.length === 1 ? 'PRACTICE' : 'PRACTICES'}</Label><Label style={{ fontSize: 8 }}>ILLUSTRATIVE DEMO CONTENT</Label></View>
    {featured && <Pressable accessibilityRole="button" accessibilityLabel={`Open ${featured.title}, ${featured.minutes} minute demo sample`} onPress={() => router.push(`/lesson/${featured.id}`)} style={({ pressed }) => ({ minHeight: width < 600 ? 210 : 285, borderRadius: 14, overflow: 'hidden', opacity: pressed ? .8 : 1 })}>
      <CosmicArt kind={featured.artwork} style={{ position: 'absolute', width: '100%', height: '100%' }} />
      <LinearGradient colors={['transparent', '#08060BEF']} style={{ position: 'absolute', width: '100%', height: '100%' }} start={{ x: 0, y: .15 }} end={{ x: 0, y: 1 }} />
      <View style={{ flex: 1, padding: 20, justifyContent: 'flex-end', gap: 7 }}><Text style={{ fontFamily: fonts.display, fontSize: width < 600 ? 30 : 40, lineHeight: width < 600 ? 32 : 43, color: colors.ink }}>{featured.title}</Text><Label style={{ fontSize: 8, color: '#DED2E4' }}>MONEY & RECEIVING · {featured.minutes} MIN · SAMPLE</Label></View>
    </Pressable>}
    {found.length ? <View style={{ gap: 5 }}>{Array.from({ length: Math.ceil(rows.length / columns) }, (_, row) => <View key={row} style={{ flexDirection: 'row', gap: 32 }}>{rows.slice(row * columns, (row + 1) * columns).map(lesson => <View key={lesson.id} style={{ flex: 1 }}><LessonCard lesson={lesson} /></View>)}{rows.slice(row * columns, (row + 1) * columns).length < columns && <View style={{ flex: 1 }} />}</View>)}</View> : <View style={{ paddingVertical: 42, gap: 16, alignItems: 'center' }}><Icon name={onlyFavorites ? 'heart' : 'search'} size={26} color={colors.gold} /><Heading small style={{ textAlign: 'center' }}>{onlyFavorites ? 'Make room for your favorites' : 'No practices found'}</Heading><Body style={{ textAlign: 'center' }}>{onlyFavorites ? 'Tap the heart on a practice to save it here. You can also clear your search or filters.' : 'Try a different search or topic.'}</Body></View>}
    <DemoLabel />
  </Page>;
}
