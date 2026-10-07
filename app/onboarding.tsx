import React, { useState } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { topics, type SessionLength, type Topic } from '../src/content/catalog';
import { useStore } from '../src/persistence/Store';
import { CosmicArt } from '../src/ui/CosmicArt';
import { Body, Button, Heading, Icon, Label, Page, Pill, styles } from '../src/ui/components';
import { colors } from '../src/ui/theme';
export default function Onboarding() {
  const store = useStore();
  const [goals, setGoals] = useState<Topic[]>(store.state.preferences.goals);
  const [length, setLength] = useState<SessionLength>(store.state.preferences.length);
  const { width } = useWindowDimensions();
  const wide = width >= 850;
  const editing = store.state.onboarded;
  const finish = () => { store.savePreferences({ goals, length }); router.replace('/'); };
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><Page>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={{ color: colors.ink, fontWeight: '800', letterSpacing: 2, fontSize: 20 }}>RE-WIRED FM<Text style={{ color: colors.gold }}>.</Text></Text><Label style={{ color: colors.teal }}>LOCAL DEMO</Label></View>
    <View style={{ flexDirection: wide ? 'row' : 'column', gap: wide ? 54 : 28, alignItems: wide ? 'center' : 'stretch' }}>
      <View style={{ flex: wide ? .9 : undefined, gap: 22 }}>
        <View style={{ minHeight: wide ? 490 : 200, borderRadius: wide ? 28 : 20, overflow: 'hidden', borderWidth: 1, borderColor: colors.line }}>
          <CosmicArt kind="sunrise" style={{ position: 'absolute', width: '100%', height: '100%' }} />
          <View style={{ padding: wide ? 34 : 24, flex: 1, justifyContent: 'flex-end', gap: 12 }}><Label style={{ color: colors.gold }}>TUNE IN TO YOUR NEXT SELF</Label><Text style={{ color: colors.ink, fontSize: wide ? 42 : 30, lineHeight: wide ? 48 : 35, fontWeight: '800', letterSpacing: -1 }}>A little space{ '\n' }to come back to you.</Text></View>
        </View>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}><Icon name="headphones" color={colors.gold} size={19} /><Body style={{ fontSize: 13, lineHeight: 21, flex: 1 }}>Daily practices for creators building a meaningful life. No perfect streak required.</Body></View>
      </View>
      <View style={{ flex: wide ? 1 : undefined, gap: 23 }}>
        <View style={{ gap: 10 }}><Label style={{ color: colors.gold }}>{editing ? 'YOUR PREFERENCES' : 'MAKE IT YOURS'}</Label><Heading style={{ fontSize: wide ? 40 : 33, lineHeight: wide ? 46 : 39 }}>What are you{ '\n' }ready to shift?</Heading><Body>Choose what matters most right now.</Body></View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{topics.map(topic => {
          const selected = goals.includes(topic.id);
          return <Pressable key={topic.id} accessibilityRole="checkbox" accessibilityLabel={topic.label} accessibilityState={{ checked: selected }} aria-checked={selected} onPress={() => setGoals(g => selected ? g.filter(x => x !== topic.id) : [...g, topic.id])} style={({ pressed }) => [styles.card, { width: width > 420 ? '48%' : '100%', borderColor: selected ? colors.teal : colors.line, padding: 15, gap: 14, opacity: pressed ? .7 : 1, backgroundColor: selected ? '#10302E' : colors.surface }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Icon name={topic.icon} color={topic.color} size={22} /><View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: selected ? colors.teal : colors.muted, backgroundColor: selected ? colors.teal : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{selected && <Icon name="check" color={colors.bg} size={15} />}</View></View>
            <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 15 }}>{topic.label}</Text>
          </Pressable>;
        })}</View>
        <View style={{ gap: 12 }}><Label>HOW MUCH SPACE DO YOU HAVE?</Label><View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>{([3, 5, 9] as const).map(minutes => <Pill key={minutes} title={`${minutes} minutes`} selected={length === minutes} onPress={() => setLength(minutes)} />)}</View></View>
        <Button title={editing ? 'Save preferences' : 'Build my listening path'} icon="arrow-right" onPress={finish} disabled={!goals.length} testID="finish-onboarding" />
        <Body style={{ fontSize: 12, lineHeight: 19 }}>{editing ? 'Your existing path and progress will stay saved. Recommendations will reflect your new preferences.' : 'Free local demo. Preferences stay on this device. Includes illustrative practices and ambient audio samples.'}</Body>
        {editing && <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ paddingVertical: 8 }}><Text style={{ color: colors.muted, textAlign: 'center' }}>Cancel</Text></Pressable>}
      </View>
    </View>
  </Page></SafeAreaView>;
}
