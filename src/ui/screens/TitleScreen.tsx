import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatClock } from '../../game/constants';
import { DECK_DEFS } from '../../game/data/decks';
import { useGame } from '../../game/store/gameStore';
import { latestSlot, listSaves, type SaveMeta } from '../../game/store/saves';
import { Button } from '../components/Button';
import { SaveSlots } from '../components/SaveSlots';
import { Starfield } from '../components/Starfield';
import { C, F } from '../theme';

type Panel = 'none' | 'load' | 'help' | 'settings';

const HELP: { h: string; t: string }[] = [
  { h: 'The clock', t: 'The reactor fails in 72 hours. Every step costs a minute. Fights, hacking doors, repairs, resting and rescuing survivors cost more. When the clock hits zero, the Leviathan falls into the star.' },
  { h: 'Moving', t: 'Use the D-pad (hold to keep walking) or tap any tile to walk there. Walk into doors, people and objects to interact.' },
  { h: 'BOLT', t: 'Your drone lights up dark rooms, hacks yellow maintenance locks and scans for hidden items. Find parts to unlock new abilities, and recover its lost memory files.' },
  { h: 'Battles', t: 'Kai acts, then BOLT, then the enemies. Scan to reveal weaknesses: hitting a weakness deals 50% more damage. Swapping weapons is free. When an enemy is CHARGING, shield, brace or cancel it.' },
  { h: 'Hazards', t: 'Contaminated or venting decks slowly drain health until you seal the breach. Heat vents burn when you step on them.' },
  { h: 'Choices', t: 'Saving survivors costs time and serums but earns rewards and changes the ending. There are three endings. One of them is hidden.' },
  { h: 'Saving', t: 'Save anytime from the menu (3 slots). The game autosaves when you reach a new deck, after boss fights, and when you leave the app.' },
];

export function TitleScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const newGame = useGame((s) => s.newGame);
  const loadSlot = useGame((s) => s.loadSlot);
  const settings = useGame((s) => s.settings);
  const setSettings = useGame((s) => s.setSettings);
  const [panel, setPanel] = useState<Panel>('none');
  const [latest, setLatest] = useState<SaveMeta | null>(null);
  const [confirmNew, setConfirmNew] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const slot = await latestSlot();
      if (!slot) return;
      const all = await listSaves();
      if (alive) setLatest(all[slot]);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <View style={styles.root}>
      <Starfield width={width} height={height} />
      <View style={[styles.content, { paddingTop: insets.top + height * 0.08, paddingBottom: insets.bottom + 24 }]}>
        <Animated.View entering={FadeInDown.duration(900)} style={styles.titleWrap}>
          <Text style={styles.kicker}>HULL BREACH</Text>
          <Text style={styles.title}>LEVIATHAN</Text>
          <Text style={styles.tagline}>10,000 sleepers. 72 hours. One engineer and a very nervous robot.</Text>
        </Animated.View>
        <View style={{ flex: 1 }} />
        <Animated.View entering={FadeIn.delay(500).duration(700)} style={styles.menu}>
          {latest && (
            <Button
              label="Continue"
              icon="play"
              sub={`${DECK_DEFS[latest.deck].name} · Lv ${latest.level} · ${formatClock(latest.minutesLeft)} left`}
              onPress={() => {
                void loadSlot(latest.slot);
              }}
            />
          )}
          <Button
            label={confirmNew ? 'Start over? Tap again' : 'New Game'}
            icon="rocket-launch"
            color={confirmNew ? C.warn : C.accent}
            onPress={() => {
              if (latest && !confirmNew) {
                setConfirmNew(true);
                return;
              }
              newGame();
            }}
          />
          <Button label="Load Game" icon="folder-open" onPress={() => setPanel('load')} />
          <View style={styles.row}>
            <Button label="How to Play" icon="help-circle" onPress={() => setPanel('help')} style={{ flex: 1 }} small />
            <Button label="Settings" icon="cog" onPress={() => setPanel('settings')} style={{ flex: 1 }} small />
          </View>
        </Animated.View>
        <Text style={styles.footer}>v1.0 · a sci-fi action-adventure</Text>
      </View>

      {panel !== 'none' && (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={styles.modal}>
          <View style={[styles.modalCard, { marginTop: insets.top + 20, marginBottom: insets.bottom + 20 }]}>
            <Text style={styles.modalTitle}>{panel === 'load' ? 'LOAD GAME' : panel === 'help' ? 'HOW TO PLAY' : 'SETTINGS'}</Text>
            <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 10, paddingBottom: 6 }}>
              {panel === 'load' && (
                <SaveSlots
                  mode="load"
                  onPick={async (slot) => {
                    await loadSlot(slot);
                  }}
                />
              )}
              {panel === 'help' &&
                HELP.map((h) => (
                  <View key={h.h}>
                    <Text style={styles.helpHead}>{h.h}</Text>
                    <Text style={styles.helpText}>{h.t}</Text>
                  </View>
                ))}
              {panel === 'settings' &&
                (
                  [
                    ['sfx', 'Sound effects'],
                    ['music', 'Music'],
                    ['haptics', 'Vibration'],
                  ] as const
                ).map(([k, label]) => (
                  <View key={k} style={styles.settingRow}>
                    <Text style={styles.helpText}>{label}</Text>
                    <Switch value={settings[k]} onValueChange={(v) => setSettings({ [k]: v })} trackColor={{ true: C.accent, false: C.border }} />
                  </View>
                ))}
            </ScrollView>
            <Pressable onPress={() => setPanel('none')} style={styles.closeBtn}>
              <Text style={styles.closeText}>CLOSE</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#03040a' },
  content: { flex: 1, paddingHorizontal: 28 },
  titleWrap: { alignItems: 'center' },
  kicker: { fontFamily: F.head, fontSize: 16, color: C.pink, letterSpacing: 8 },
  title: {
    fontFamily: F.title,
    fontSize: 44,
    color: C.text,
    letterSpacing: 4,
    marginTop: 4,
    textShadowColor: C.accent,
    textShadowRadius: 18,
    textShadowOffset: { width: 0, height: 0 },
  },
  tagline: { fontFamily: F.mono, fontSize: 13, color: C.dim, textAlign: 'center', marginTop: 12, maxWidth: 320 },
  menu: { gap: 10, width: '100%', maxWidth: 420, alignSelf: 'center' },
  row: { flexDirection: 'row', gap: 10 },
  footer: { fontFamily: F.mono, fontSize: 10, color: C.faint, textAlign: 'center', marginTop: 16 },
  modal: { ...StyleSheet.absoluteFill, backgroundColor: C.overlay, justifyContent: 'center', paddingHorizontal: 18 },
  modalCard: { backgroundColor: '#0b1120', borderWidth: 1.5, borderColor: C.borderHi, borderRadius: 16, padding: 16, maxHeight: '88%' },
  modalTitle: { fontFamily: F.title, fontSize: 18, color: C.accent, letterSpacing: 2, marginBottom: 12 },
  helpHead: { fontFamily: F.head, fontSize: 12, color: C.gold, letterSpacing: 1 },
  helpText: { fontFamily: F.mono, fontSize: 13, color: C.text, lineHeight: 19 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeBtn: { alignSelf: 'flex-end', marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: C.accent, borderRadius: 8 },
  closeText: { fontFamily: F.head, fontSize: 12, color: C.accent, letterSpacing: 2 },
});
