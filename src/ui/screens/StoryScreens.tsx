import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatClock } from '../../game/constants';
import { endingContent } from '../../game/data/endings';
import { LOG_ORDER, SURVIVORS } from '../../game/data/story';
import { useGame } from '../../game/store/gameStore';
import { Button } from '../components/Button';
import { SaveSlots } from '../components/SaveSlots';
import { Starfield } from '../components/Starfield';
import { C, F } from '../theme';

const INTRO = [
  'Year 2291. The colony ship LEVIATHAN carries ten thousand sleeping colonists toward the world of Thalassa. The voyage takes two hundred years.',
  'One hundred and forty years in, something came aboard. The crew called it THE BLOOM.',
  'It spread through every deck. It took the robots. It took the crew. Now the reactor is failing, and the ship is drifting toward a star.',
  'In a cryo pod on Deck 1, a junior engineer named Kai Reyes is about to wake up.',
];

export function IntroScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const beginGame = useGame((s) => s.beginGame);
  const [step, setStep] = useState(0);
  const next = () => {
    if (step >= INTRO.length - 1) beginGame();
    else setStep(step + 1);
  };
  return (
    <Pressable style={styles.root} onPress={next}>
      <Starfield width={width} height={height} showShip={false} />
      <View style={[styles.introBody, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 30 }]}>
        {INTRO.slice(0, step + 1).map((p, i) => (
          <Animated.Text key={i} entering={FadeInDown.duration(700)} style={[styles.introText, i === step && { color: C.text }]}>
            {p}
          </Animated.Text>
        ))}
        <View style={{ flex: 1 }} />
        <View style={styles.introFooter}>
          <Text style={styles.tap}>{step >= INTRO.length - 1 ? 'TAP TO WAKE UP' : 'TAP TO CONTINUE'}</Text>
          <Pressable onPress={beginGame} hitSlop={12}>
            <Text style={styles.skip}>SKIP</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

export function GameOverScreen() {
  const insets = useSafeAreaInsets();
  const reason = useGame((s) => s.gameOver);
  const preBattle = useGame((s) => s.preBattle);
  const encounter = useGame((s) => s.encounter);
  const checkpoint = useGame((s) => s.checkpoint);
  const retryBattle = useGame((s) => s.retryBattle);
  const retryCheckpoint = useGame((s) => s.retryCheckpoint);
  const loadSlot = useGame((s) => s.loadSlot);
  const toTitle = useGame((s) => s.toTitle);
  const [showLoad, setShowLoad] = useState(false);
  const reactor = reason === 'reactor';
  return (
    <View style={[styles.root, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20, paddingHorizontal: 24 }]}>
      <Animated.View entering={FadeIn.duration(900)} style={{ alignItems: 'center' }}>
        <Text style={[styles.overTitle, { color: reactor ? C.warn : C.bad }]}>{reactor ? 'REACTOR FAILURE' : 'KAI HAS FALLEN'}</Text>
        <Text style={styles.overText}>
          {reactor
            ? 'The reactor fails with a sigh, not a bang. The Leviathan drifts silently into the light of Thalassa-B, ten thousand dreams still sleeping inside it.'
            : 'The lights dim. Somewhere far away, BOLT is shouting your name. It sounds scared of the dark.'}
        </Text>
      </Animated.View>
      <View style={{ flex: 1 }} />
      {showLoad ? (
        <ScrollView contentContainerStyle={{ gap: 8 }}>
          <SaveSlots
            mode="load"
            onPick={async (slot) => {
              await loadSlot(slot);
            }}
          />
          <Button label="Back" icon="arrow-left" onPress={() => setShowLoad(false)} small />
        </ScrollView>
      ) : (
        <View style={{ gap: 10 }}>
          {!reactor && preBattle && encounter && <Button label="Retry the battle" sub="HP restored to at least 50%" icon="restart" onPress={retryBattle} />}
          {checkpoint && <Button label="Restart this deck" sub="From when you arrived" icon="elevator" onPress={retryCheckpoint} />}
          <Button label="Load a save" icon="folder-open" onPress={() => setShowLoad(true)} />
          <Button label="Title screen" icon="home" color={C.dim} onPress={toTitle} />
        </View>
      )}
    </View>
  );
}

export function EndingScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const ending = useGame((s) => s.ending);
  const data = useGame((s) => s.data);
  const toTitle = useGame((s) => s.toTitle);
  if (!ending) return null;
  const content = endingContent(ending, data);
  const stats: [string, string][] = [
    ['Reactor time left', formatClock(data.minutesLeft)],
    ['Level', String(data.level)],
    ['Survivors saved', `${data.survivors.length}/${Object.keys(SURVIVORS).length}`],
    ['Memory files', `${data.memories.length}/6`],
    ['Logs found', `${data.logs.length}/${LOG_ORDER.length}`],
    ['Battles fought', String(data.battles)],
  ];
  return (
    <View style={styles.root}>
      <Starfield width={width} height={height} showShip={false} />
      <ScrollView contentContainerStyle={[styles.endBody, { paddingTop: insets.top + 50, paddingBottom: insets.bottom + 30 }]}>
        <Animated.Text entering={FadeIn.duration(1200)} style={styles.endKicker}>
          {content.subtitle.toUpperCase()}
        </Animated.Text>
        <Animated.Text entering={FadeIn.delay(400).duration(1200)} style={[styles.endTitle, { color: content.color, textShadowColor: content.color }]}>
          {content.title}
        </Animated.Text>
        {content.paragraphs.map((p, i) => (
          <Animated.Text key={i} entering={FadeInDown.delay(1200 + i * 900).duration(900)} style={styles.endText}>
            {p}
          </Animated.Text>
        ))}
        <Animated.View entering={FadeIn.delay(1400 + content.paragraphs.length * 900).duration(800)} style={styles.stats}>
          {stats.map(([k, v]) => (
            <View key={k} style={styles.statRow}>
              <Text style={styles.statKey}>{k}</Text>
              <Text style={styles.statVal}>{v}</Text>
            </View>
          ))}
          {ending !== 'communion' && (
            <Text style={styles.hint}>
              {data.memories.length < 6
                ? 'Somewhere, a hidden ending waits. Maybe BOLT has more to remember.'
                : 'BOLT remembered every word. Did you let it speak?'}
            </Text>
          )}
          <Button label="Return to title" icon="home" onPress={toTitle} style={{ marginTop: 16 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#03040a' },
  introBody: { flex: 1, paddingHorizontal: 28, gap: 18 },
  introText: { fontFamily: F.mono, fontSize: 17, lineHeight: 26, color: C.dim },
  introFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tap: { fontFamily: F.head, fontSize: 11, color: C.accent, letterSpacing: 3 },
  skip: { fontFamily: F.head, fontSize: 11, color: C.dim, letterSpacing: 3 },
  overTitle: { fontFamily: F.title, fontSize: 28, letterSpacing: 2, textAlign: 'center' },
  overText: { fontFamily: F.mono, fontSize: 15, lineHeight: 22, color: C.text, textAlign: 'center', marginTop: 16 },
  endBody: { paddingHorizontal: 26, gap: 16 },
  endKicker: { fontFamily: F.head, fontSize: 11, color: C.dim, letterSpacing: 3, textAlign: 'center' },
  endTitle: { fontFamily: F.title, fontSize: 28, textAlign: 'center', letterSpacing: 2, textShadowRadius: 16, textShadowOffset: { width: 0, height: 0 } },
  endText: { fontFamily: F.mono, fontSize: 15, lineHeight: 23, color: C.text },
  stats: { marginTop: 10, padding: 14, borderWidth: 1, borderColor: C.border, borderRadius: 12, backgroundColor: 'rgba(8,13,26,0.85)', gap: 6 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statKey: { fontFamily: F.mono, fontSize: 13, color: C.dim },
  statVal: { fontFamily: F.head, fontSize: 13, color: C.text },
  hint: { fontFamily: F.mono, fontSize: 12, color: C.pink, marginTop: 8, textAlign: 'center' },
});
