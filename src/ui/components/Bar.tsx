import { StyleSheet, Text, View } from 'react-native';

import { C, F } from '../theme';

interface Props {
  value: number;
  max: number;
  color: string;
  label?: string;
  height?: number;
  showText?: boolean;
  extra?: number;
  extraColor?: string;
}

export function Bar({ value, max, color, label, height = 10, showText = true, extra = 0, extraColor = C.accent }: Props) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const extraPct = max > 0 ? Math.max(0, Math.min(1 - pct, extra / max)) : 0;
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.track, { height }]}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
        {extraPct > 0 && <View style={[styles.fill, { width: `${extraPct * 100}%`, backgroundColor: extraColor, opacity: 0.7 }]} />}
      </View>
      {showText ? (
        <Text style={styles.text}>
          {Math.max(0, Math.round(value))}/{max}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  label: { fontFamily: F.head, fontSize: 10, color: C.dim, minWidth: 30 },
  track: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1a2236',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a3a5c',
  },
  fill: { height: '100%' },
  text: { fontFamily: F.mono, fontSize: 11, color: C.text, minWidth: 48, textAlign: 'right' },
});
