import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SCAN_MINUTES } from '../../game/constants';
import { useGame } from '../../game/store/gameStore';
import type { IconName } from '../components/Button';
import { DialogueBox } from '../components/DialogueBox';
import { DPad } from '../components/DPad';
import { Hud } from '../components/Hud';
import { MapCanvas } from '../components/MapCanvas';
import { DeckTransition, LogReader, Toasts } from '../components/Overlays';
import { PauseMenu } from '../components/PauseMenu';
import { C, F } from '../theme';

const PATH_STEP_MS = 125;

function ActionButton({ icon, label, sub, onPress, disabled, color = C.accent }: { icon: IconName; label: string; sub?: string; onPress: () => void; disabled?: boolean; color?: string }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.action, { borderColor: disabled ? C.border : color }, pressed && styles.actionPressed, disabled && { opacity: 0.45 }]}
    >
      <MaterialCommunityIcons name={icon} size={22} color={disabled ? C.faint : color} />
      <View>
        <Text style={[styles.actionLabel, { color: disabled ? C.faint : C.text }]}>{label}</Text>
        {sub ? <Text style={styles.actionSub}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

export function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [mapSize, setMapSize] = useState({ w: 0, h: 0 });
  const move = useGame((s) => s.move);
  const scan = useGame((s) => s.scan);
  const setMenu = useGame((s) => s.setMenu);
  const path = useGame((s) => s.path);
  const stepPath = useGame((s) => s.stepPath);
  const modal = useGame((s) => !!s.dialogue || !!s.readingLog || !!s.transition || !!s.menu);
  const boltJoined = useGame((s) => !!s.data.flags.bolt_joined);

  useEffect(() => {
    if (!path.length || modal) return;
    const id = setTimeout(stepPath, PATH_STEP_MS);
    return () => clearTimeout(id);
  }, [path, modal, stepPath]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Hud />
      <View
        style={styles.mapArea}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setMapSize({ w: Math.floor(width), h: Math.floor(height) });
        }}
      >
        {mapSize.h > 0 && <MapCanvas width={mapSize.w} height={mapSize.h} />}
        <Toasts />
      </View>
      <View style={[styles.controls, { paddingBottom: insets.bottom + 10 }]}>
        <DPad onMove={move} disabled={modal} size={156} />
        <View style={styles.actions}>
          <ActionButton icon="radar" label="SCAN" sub={boltJoined ? `${SCAN_MINUTES} min` : 'needs drone'} onPress={scan} disabled={!boltJoined || modal} color={C.bolt} />
          <ActionButton icon="map-outline" label="MAP" onPress={() => setMenu('map')} disabled={modal} />
          <ActionButton icon="menu" label="MENU" sub="gear · save" onPress={() => setMenu('pause')} disabled={modal} color={C.gold} />
        </View>
      </View>
      <View style={[StyleSheet.absoluteFill, { paddingBottom: insets.bottom, pointerEvents: 'box-none' }]}>
        <DialogueBox />
      </View>
      <LogReader />
      <PauseMenu />
      <DeckTransition />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  mapArea: { flex: 1, overflow: 'hidden' },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 10,
    backgroundColor: 'rgba(6,10,20,0.98)',
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  actions: { gap: 8, width: 138 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: C.panel,
  },
  actionPressed: { backgroundColor: C.panelHi, transform: [{ scale: 0.97 }] },
  actionLabel: { fontFamily: F.head, fontSize: 13, letterSpacing: 1 },
  actionSub: { fontFamily: F.mono, fontSize: 10, color: C.dim },
});
