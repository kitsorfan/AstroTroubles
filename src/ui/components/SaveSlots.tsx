import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatClock } from '../../game/constants';
import { DECK_DEFS } from '../../game/data/decks';
import { listSaves, SLOTS, type SaveMeta, type SlotId } from '../../game/store/saves';
import { C, F } from '../theme';

interface Props {
  mode: 'save' | 'load';
  onPick: (slot: SlotId) => void | Promise<void>;
}

export function SaveSlots({ mode, onPick }: Props) {
  const [saves, setSaves] = useState<Record<SlotId, SaveMeta | null> | null>(null);
  const [armed, setArmed] = useState<SlotId | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    listSaves().then((s) => {
      if (alive) setSaves(s);
    });
    return () => {
      alive = false;
    };
  }, [version]);

  const slots = mode === 'save' ? SLOTS.filter((s) => s !== 'auto') : SLOTS;

  if (!saves) return <Text style={styles.dim}>Reading memory banks...</Text>;

  return (
    <View style={{ gap: 8 }}>
      {slots.map((slot) => {
        const meta = saves[slot];
        const disabled = mode === 'load' && !meta;
        const needsConfirm = mode === 'save' && !!meta && armed !== slot;
        return (
          <Pressable
            key={slot}
            disabled={disabled}
            onPress={async () => {
              if (needsConfirm) {
                setArmed(slot);
                return;
              }
              setArmed(null);
              await onPick(slot);
              setVersion((v) => v + 1);
            }}
            style={({ pressed }) => [styles.slot, disabled && { opacity: 0.4 }, pressed && { backgroundColor: C.panelHi }, armed === slot && { borderColor: C.warn }]}
          >
            <Text style={styles.slotName}>{slot === 'auto' ? 'AUTOSAVE' : `SLOT ${slot}`}</Text>
            {meta ? (
              <>
                <Text style={styles.slotInfo}>
                  {DECK_DEFS[meta.deck].name} · Lv {meta.level} · Reactor {formatClock(meta.minutesLeft)}
                </Text>
                <Text style={styles.slotSub}>
                  Memories {meta.memories}/6 · Survivors {meta.survivors} · {new Date(meta.savedAt).toLocaleString()}
                </Text>
              </>
            ) : (
              <Text style={styles.slotSub}>Empty</Text>
            )}
            {armed === slot && <Text style={styles.confirm}>Tap again to overwrite</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { fontFamily: F.mono, color: C.dim },
  slot: { borderWidth: 1.5, borderColor: C.border, borderRadius: 10, padding: 12, backgroundColor: C.panel },
  slotName: { fontFamily: F.head, fontSize: 12, color: C.accent, letterSpacing: 1.5 },
  slotInfo: { fontFamily: F.mono, fontSize: 13, color: C.text, marginTop: 3 },
  slotSub: { fontFamily: F.mono, fontSize: 11, color: C.dim, marginTop: 2 },
  confirm: { fontFamily: F.head, fontSize: 10, color: C.warn, marginTop: 4 },
});
