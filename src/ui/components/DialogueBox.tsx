import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { playSfx } from '../../game/audio/sound';
import { currentNode, formatDialogueText, visibleChoices } from '../../game/engine/dialogue';
import { useGame } from '../../game/store/gameStore';
import type { SpeakerId } from '../../game/types';
import { C, F } from '../theme';
import { Portrait } from './Portrait';

const NAMES: Partial<Record<SpeakerId, string>> = {
  kai: 'Kai Reyes',
  bolt: 'BOLT',
  halcyon: 'HALCYON',
  log: 'Data Log',
  bloom: 'The Bloom',
  voss: 'Captain Voss',
  okafor: 'Dr. Okafor',
  dray: 'Chief Dray',
  nair: 'Dr. Nair',
  haddad: 'Sgt. Haddad',
  hollis: 'Hollis',
  juno: 'Juno',
  tanaka: 'Officer Tanaka',
  mia: 'Mia',
  vendor: 'Vend-O-Matic',
};

const NAME_COLOR: Partial<Record<SpeakerId, string>> = {
  kai: '#ffb07a',
  bolt: C.bolt,
  halcyon: '#ff8a6a',
  bloom: C.pink,
  log: C.gold,
  voss: C.gold,
};

export function DialogueBox() {
  const dialogue = useGame((s) => s.dialogue);
  const data = useGame((s) => s.data);
  const advance = useGame((s) => s.advance);
  const choose = useGame((s) => s.choose);
  const node = dialogue ? currentNode(dialogue) : undefined;
  const text = node?.text ? formatDialogueText(node.text, data) : '';
  const key = dialogue ? `${dialogue.tree.id}.${dialogue.nodeId}` : '';
  const [shown, setShown] = useState(0);
  const [shownKey, setShownKey] = useState(key);

  if (shownKey !== key) {
    setShownKey(key);
    setShown(0);
  }

  useEffect(() => {
    if (!text) return;
    let n = 0;
    const id = setInterval(() => {
      n = Math.min(text.length, n + 2);
      if (n % 10 === 0 && n < text.length) playSfx('blip');
      setShown((prev) => Math.max(prev, n));
      if (n >= text.length) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [key, text]);

  if (!dialogue || !node) return null;
  const done = shown >= text.length;
  const choices = visibleChoices(dialogue, data);
  const hasChoices = choices.some((c) => c.enabled);
  const speaker = node.speaker ?? 'narrator';
  const name = node.name ?? NAMES[speaker] ?? '';
  const narrator = speaker === 'narrator';

  const onTap = () => {
    if (!done) {
      setShown(text.length);
      return;
    }
    if (!hasChoices) advance();
  };

  return (
    <Animated.View entering={FadeInDown.duration(180)} style={styles.wrap}>
      <Pressable onPress={onTap} style={styles.box}>
        <View style={styles.row}>
          {!narrator && <Portrait speaker={speaker} size={60} />}
          <View style={styles.textCol}>
            {name ? <Text style={[styles.name, { color: NAME_COLOR[speaker] ?? C.accent }]}>{name}</Text> : null}
            <ScrollView style={styles.scroll} contentContainerStyle={{ flexGrow: 1 }}>
              <Text style={[styles.text, narrator && styles.narrator]}>{text.slice(0, shown)}</Text>
            </ScrollView>
          </View>
        </View>
        {done && hasChoices ? (
          <View style={styles.choices}>
            {choices.map((c) => (
              <Pressable
                key={c.index}
                disabled={!c.enabled}
                onPress={() => choose(c.index)}
                style={({ pressed }) => [styles.choice, !c.enabled && styles.choiceLocked, pressed && styles.choicePressed]}
              >
                <Text style={[styles.choiceText, !c.enabled && { color: C.faint }]}>
                  {c.enabled ? '> ' : ''}
                  {c.choice.text}
                </Text>
                {!c.enabled && c.choice.lockedHint ? <Text style={styles.hint}>{c.choice.lockedHint}</Text> : null}
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.more}>{done ? 'TAP TO CONTINUE' : ''}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 8, right: 8, bottom: 8 },
  box: {
    backgroundColor: 'rgba(8,13,26,0.97)',
    borderWidth: 1.5,
    borderColor: C.borderHi,
    borderRadius: 14,
    padding: 12,
    minHeight: 150,
  },
  row: { flexDirection: 'row', gap: 12 },
  textCol: { flex: 1 },
  name: { fontFamily: F.head, fontSize: 13, letterSpacing: 1, marginBottom: 4 },
  scroll: { maxHeight: 150 },
  text: { fontFamily: F.mono, fontSize: 15, lineHeight: 21, color: C.text },
  narrator: { color: '#b8c6e0', fontStyle: 'italic' },
  more: { fontFamily: F.head, fontSize: 9, color: C.dim, textAlign: 'right', marginTop: 6, letterSpacing: 1.5, height: 12 },
  choices: { marginTop: 10, gap: 6 },
  choice: {
    borderWidth: 1,
    borderColor: C.accent,
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: '#0f1a30',
  },
  choiceLocked: { borderColor: C.border, backgroundColor: '#0b1120' },
  choicePressed: { backgroundColor: '#1a2a48' },
  choiceText: { fontFamily: F.mono, fontSize: 14, color: C.text },
  hint: { fontFamily: F.mono, fontSize: 11, color: C.warn, marginTop: 2 },
});
