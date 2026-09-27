import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import type { Dir } from '../../game/types';
import { C } from '../theme';

const REPEAT_MS = 150;
const ICONS: Record<Dir, 'chevron-up' | 'chevron-down' | 'chevron-left' | 'chevron-right'> = {
  up: 'chevron-up',
  down: 'chevron-down',
  left: 'chevron-left',
  right: 'chevron-right',
};

interface KeyProps {
  dir: Dir;
  size: number;
  position: ViewStyle;
  disabled?: boolean;
  onStart: (dir: Dir) => void;
  onStop: () => void;
}

function Key({ dir, size, position, disabled, onStart, onStop }: KeyProps) {
  return (
    <Pressable
      onPressIn={() => onStart(dir)}
      onPressOut={onStop}
      hitSlop={6}
      style={({ pressed }) => [styles.key, { width: size, height: size }, position, pressed && styles.pressed]}
    >
      <MaterialCommunityIcons name={ICONS[dir]} size={size * 0.62} color={disabled ? C.faint : C.accent} />
    </Pressable>
  );
}

export function DPad({ onMove, size = 150, disabled }: { onMove: (dir: Dir) => void; size?: number; disabled?: boolean }) {
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  useEffect(() => {
    if (disabled && timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, [disabled]);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );

  const start = (dir: Dir) => {
    stop();
    if (disabled) return;
    onMove(dir);
    timer.current = setInterval(() => onMove(dir), REPEAT_MS);
  };

  const b = size / 3;
  return (
    <View style={{ width: size, height: size }}>
      <Key dir="up" size={b} position={{ position: 'absolute', left: b, top: 0 }} disabled={disabled} onStart={start} onStop={stop} />
      <Key dir="left" size={b} position={{ position: 'absolute', left: 0, top: b }} disabled={disabled} onStart={start} onStop={stop} />
      <View style={[styles.center, { position: 'absolute', left: b, top: b, width: b, height: b }]} />
      <Key dir="right" size={b} position={{ position: 'absolute', left: b * 2, top: b }} disabled={disabled} onStart={start} onStop={stop} />
      <Key dir="down" size={b} position={{ position: 'absolute', left: b, top: b * 2 }} disabled={disabled} onStart={start} onStop={stop} />
    </View>
  );
}

const styles = StyleSheet.create({
  key: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0e172b',
    borderWidth: 1.5,
    borderColor: '#2b3f66',
    borderRadius: 10,
  },
  pressed: { backgroundColor: '#1b2c4d', borderColor: C.accent },
  center: { backgroundColor: '#0a1222', borderRadius: 6 },
});
