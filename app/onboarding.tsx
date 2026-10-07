import React, { useState } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { topics, type SessionLength, type Topic } from '../src/content/catalog';
import { useStore } from '../src/persistence/Store';
import { CosmicArt } from '../src/ui/CosmicArt';
import { Body, Button, DemoLabel, Heading, Icon, Label, Page, Pill, Wordmark } from '../src/ui/components';
import { colors, fonts } from '../src/ui/theme';

export default function Onboarding() {
  const store = useStore();
  const [goals, setGoals] = useState<Topic[]>(store.state.preferences.goals);
  const [length, setLength] = useState<SessionLength>(store.state.preferences.length);
  const { width } = useWindowDimensions();
  const wide = width >= 850;
  const editing = store.state.onboarded;
  const finish = () => { store.savePreferences({ goals, length }); router.replace('/'); };
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><Page>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 15, flexWrap: 'wrap' }}><Wordmark /><DemoLabel /></View>
    <View style={{ flexDirection: wide ? 'row' : 'column', gap: wide ? 60 : 30, alignItems: wide ? 'center' : 'stretch' }}>
      <View style={{ flex: wide ? .9 : undefined, gap: 20 }}>
        <View style={{ minHeight: wide ? 610 : 215, borderRadius: 16, overflow: 'hidden' }}>
          <CosmicArt kind="sunrise" style={{ position: 'absolute', width: '100%', height: '100%' }} />
          <LinearGradient colors={['transparent', '#08060BDF']} style={{ position: 'absolute', width: '100%', height: '100%' }} />
          <View style={{ padding: wide ? 30 : 23, flex: 1, justifyContent: 'flex-end', gap: 12 }}><Label style={{ color: colors.goldLight, fontSize: 8 }}>TUNE IN TO YOUR NEXT SELF</Label><Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: wide ? 48 : 35, lineHeight: wide ? 51 : 38 }}>A little space{ '\n' }to come back to you.</Text></View>
        </View>
        {wide && <Body style={{ fontSize: 13 }}>Daily practices for creators building a meaningful life. No perfect streak required.</Body>}
      </View>
      <View style={{ flex: wide ? 1 : undefined, gap: 24 }}>
        <View style={{ gap: 11 }}><Label style={{ color: colors.gold, fontSize: 9 }}>{editing ? 'YOUR PREFERENCES' : 'MAKE IT YOURS'}</Label><Heading style={{ fontSize: wide ? 48 : 42, lineHeight: wide ? 50 : 44 }}>What are you{ '\n' }ready to shift?</Heading><Body style={{ fontSize: 14 }}>Choose what matters most right now.</Body></View>
        <View style={{ gap: 8 }}>{topics.map(topic => {
          const selected = goals.includes(topic.id);
          return <Pressable key={topic.id} accessibilityRole="checkbox" accessibilityLabel={topic.label} accessibilityState={{ checked: selected }} aria-checked={selected} onPress={() => setGoals(g => selected ? g.filter(x => x !== topic.id) : [...g, topic.id])} style={({ pressed }) => ({ borderWidth: 1, borderRadius: 13, borderColor: selected ? '#D7B2719C' : colors.line, padding: 15, gap: 13, flexDirection: 'row', alignItems: 'center', opacity: pressed ? .7 : 1, backgroundColor: selected ? '#EEC67609' : colors.surface })}>
            <View style={{ width: 31, height: 31, justifyContent: 'center', alignItems: 'center' }}><Icon name={topic.icon} color={selected ? colors.gold : colors.muted} size={20} /></View>
            <Text style={{ flex: 1, color: colors.ink, fontFamily: fonts.display, fontSize: 24, lineHeight: 27 }}>{topic.label}</Text>
            <View style={{ width: 21, height: 21, borderRadius: 11, borderWidth: 1, borderColor: selected ? colors.gold : colors.subtle, backgroundColor: selected ? colors.gold : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{selected && <Icon name="check" color={colors.bg} size={13} />}</View>
          </Pressable>;
        })}</View>
        <View style={{ gap: 12 }}><Label style={{ fontSize: 9 }}>HOW MUCH SPACE DO YOU HAVE?</Label><View style={{ flexDirection: 'row', gap: 9, flexWrap: 'wrap' }}>{([3, 5, 9] as const).map(minutes => <Pill key={minutes} title={`${minutes} minutes`} selected={length === minutes} onPress={() => setLength(minutes)} />)}</View></View>
        <Button title={editing ? 'Save preferences' : 'Build my listening path'} icon="arrow-right" onPress={finish} disabled={!goals.length} testID="finish-onboarding" />
        <Body style={{ fontSize: 11, lineHeight: 19 }}>{editing ? 'Your existing path and progress stay saved. Recommendations reflect your new preferences.' : 'Free local demo. Preferences stay on this device. Includes illustrative practices and ambient audio samples.'}</Body>
        {editing && <Pressable accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: colors.muted, fontFamily: fonts.body, textAlign: 'center', fontSize: 13 }}>Cancel</Text></Pressable>}
      </View>
    </View>
  </Page></SafeAreaView>;
}
