import React, { useState } from 'react';
import { View, Text, TextInput, useWindowDimensions } from 'react-native';
import { topics, type Topic } from '../../src/content/catalog';
import { filterLessons } from '../../src/content/logic';
import { useStore } from '../../src/persistence/Store';
import { Body, Heading, Icon, Label, Page, Pill } from '../../src/ui/components';
import { TopBar } from '../../src/ui/TopBar';
import { LessonCard } from '../../src/ui/LessonCard';
import { colors } from '../../src/ui/theme';
export default function Library() {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<Topic | 'all'>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const { state } = useStore();
  const { width } = useWindowDimensions();
  const columns = width > 1280 ? 3 : width > 650 ? 2 : 1;
  const found = filterLessons(query, topic, onlyFavorites ? state.favorites : undefined);
  return <Page><TopBar /><View style={{ gap: 10 }}><Label style={{ color: colors.gold }}>THE LIBRARY</Label><Heading>Find your frequency.</Heading><Body>A little self-trust. A clearer mind. Room to create.</Body></View>
    <View style={{ flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: '#3B5276', backgroundColor: colors.surface, paddingHorizontal: 18, borderRadius: 30, minHeight: 54, alignItems: 'center' }}><Icon name="search" color={colors.muted} /><TextInput accessibilityLabel="Search lessons" placeholder="What do you need today?" placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} style={{ flex: 1, color: colors.ink, fontSize: 16, minHeight: 52, paddingVertical: 12 }} /></View>
    <View style={{ flexDirection: 'row', gap: 9, flexWrap: 'wrap' }}><Pill title="All" selected={topic === 'all'} onPress={() => setTopic('all')} />{topics.map(t => <Pill key={t.id} title={t.short} selected={topic === t.id} onPress={() => setTopic(t.id)} />)}<Pill title="♥ Favorites" selected={onlyFavorites} onPress={() => setOnlyFavorites(v => !v)} /></View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Label>{found.length} {found.length === 1 ? 'PRACTICE' : 'PRACTICES'}</Label><Label style={{ color: colors.muted, fontSize: 9 }}>ILLUSTRATIVE DEMO CONTENT</Label></View>
    {found.length ? <View style={{ gap: 20 }}>{Array.from({ length: Math.ceil(found.length / columns) }, (_, row) => <View key={row} style={{ flexDirection: 'row', gap: 20 }}>{found.slice(row * columns, (row + 1) * columns).map(lesson => <LessonCard key={lesson.id} lesson={lesson} />)}{Array.from({ length: Math.max(0, columns - found.slice(row * columns, (row + 1) * columns).length) }, (_, i) => <View key={i} style={{ flex: 1 }} />)}</View>)}</View> : <View style={{ padding: 40, gap: 15, alignItems: 'center' }}><Icon name={onlyFavorites ? 'heart' : 'search'} size={30} color={colors.gold} /><Text style={{ color: colors.ink, fontWeight: '700', fontSize: 20 }}>{onlyFavorites ? 'Make room for your favorites' : 'No practices found'}</Text><Body style={{ textAlign: 'center' }}>{onlyFavorites ? 'Tap the heart on a practice to save it here. You can also clear your search or filters.' : 'Try a different search or topic.'}</Body></View>}
  </Page>;
}
