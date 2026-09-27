import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { CRITICAL_TIME_MINUTES, LOW_TIME_MINUTES, boltMaxHp, formatClock, kaiMaxHp } from '../../game/constants';
import { WEAPONS } from '../../game/data/catalog';
import { getDeck } from '../../game/data/decks';
import { currentObjective, leaking, ventsActive } from '../../game/engine/explore';
import { useGame } from '../../game/store/gameStore';
import { C, F } from '../theme';
import { Bar } from './Bar';

function Chip({ icon, text, color }: { icon: 'weather-windy' | 'fire' | 'star-four-points'; text: string; color: string }) {
  return (
    <View style={[styles.chip, { borderColor: color }]}>
      <MaterialCommunityIcons name={icon} size={11} color={color} />
      <Text style={[styles.chipText, { color }]}>{text}</Text>
    </View>
  );
}

export function Hud() {
  const data = useGame((s) => s.data);
  const deck = getDeck(data.deck);
  const minutes = data.minutesLeft;
  const critical = minutes < CRITICAL_TIME_MINUTES;
  const low = minutes < LOW_TIME_MINUTES;
  const clockColor = critical ? C.bad : low ? C.warn : C.accent;
  const blink = useSharedValue(1);

  useEffect(() => {
    blink.set(critical ? withRepeat(withTiming(0.35, { duration: 500 }), -1, true) : 1);
  }, [critical, blink]);
  const blinkStyle = useAnimatedStyle(() => ({ opacity: blink.get() }));

  const boltJoined = !!data.flags.bolt_joined;
  const air = leaking(deck, data);
  const hot = ventsActive(deck, data);

  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={styles.deckIndex}>DECK {deck.def.index} / 6</Text>
          <Text style={[styles.deckName, { color: deck.def.theme.accent }]} numberOfLines={1}>
            {deck.def.name.toUpperCase()}
          </Text>
        </View>
        <Animated.View style={[styles.clock, { borderColor: clockColor }, blinkStyle]}>
          <MaterialCommunityIcons name="atom" size={14} color={clockColor} />
          <View>
            <Text style={[styles.clockLabel, { color: clockColor }]}>REACTOR</Text>
            <Text style={[styles.clockText, { color: clockColor }]}>{formatClock(minutes)}</Text>
          </View>
        </Animated.View>
      </View>
      <View style={styles.objective}>
        <MaterialCommunityIcons name="flag-checkered" size={12} color={C.gold} />
        <Text style={styles.objectiveText} numberOfLines={2}>
          {currentObjective(data)}
        </Text>
      </View>
      <View style={styles.bars}>
        <Bar label={`LV${data.level}`} value={data.hp} max={kaiMaxHp(data.level)} color={C.hp} height={9} />
        {boltJoined && <Bar label="BOLT" value={data.boltHp} max={boltMaxHp(data.level, data.modules)} color={C.boltHp} height={9} />}
      </View>
      <View style={styles.chips}>
        <Text style={styles.weapon}>
          {WEAPONS[data.weapon].name}
          {data.modChips ? ` +${data.modChips * 2}` : ''}
        </Text>
        <Text style={styles.scrap}>{data.scrap} scrap</Text>
        {air && <Chip icon="weather-windy" text="BAD AIR" color={C.warn} />}
        {hot && <Chip icon="fire" text="VENTS HOT" color="#ff8a3d" />}
        <Chip icon="star-four-points" text={`MEM ${data.memories.length}/6`} color={C.pink} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 8,
    backgroundColor: 'rgba(6,10,20,0.96)',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 5,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  deckIndex: { fontFamily: F.head, fontSize: 9, color: C.dim, letterSpacing: 2 },
  deckName: { fontFamily: F.title, fontSize: 16, letterSpacing: 1 },
  clock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#0a1222',
  },
  clockLabel: { fontFamily: F.head, fontSize: 8, letterSpacing: 1.5 },
  clockText: { fontFamily: F.title, fontSize: 17, letterSpacing: 1 },
  objective: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  objectiveText: { flex: 1, fontFamily: F.mono, fontSize: 12, color: C.text },
  bars: { flexDirection: 'row', gap: 10 },
  chips: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  weapon: { fontFamily: F.mono, fontSize: 11, color: C.dim },
  scrap: { fontFamily: F.mono, fontSize: 11, color: C.gold },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 },
  chipText: { fontFamily: F.head, fontSize: 8, letterSpacing: 1 },
});
