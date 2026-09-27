import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { haptic, playSfx } from '../../game/audio/sound';
import { BATTLE_BASE_MINUTES, BATTLE_ROUND_MINUTES } from '../../game/constants';
import { BOLT_ABILITIES, BOLT_ABILITY_ORDER, DAMAGE_LABEL, ITEMS, WEAPONS } from '../../game/data/catalog';
import { getDeck } from '../../game/data/decks';
import { ENEMIES } from '../../game/data/enemies';
import {
  aliveEnemies,
  battleReducer,
  battleResult,
  canUseAbility,
  canUseItem,
  createBattle,
  isBattleOver,
  isHackable,
} from '../../game/engine/battle';
import { useGame } from '../../game/store/gameStore';
import type {
  BattleAction,
  BattleEnemy,
  BattleEvent,
  BattleState,
  BoltAbility,
  Encounter,
  FxKind,
  GameData,
  ItemId,
  SfxId,
  TargetRef,
} from '../../game/types';
import { Bar } from '../components/Bar';
import { BattleStage, type EnemySlot, type StageFx } from '../components/BattleStage';
import { Button, type IconName } from '../components/Button';
import { C, F, TONE_COLOR } from '../theme';

interface Float {
  id: number;
  key: string;
  text: string;
  color: string;
}

const ACTION_LOCK_MS = 450;
const ENEMY_STEP_MS = 700;
let floatSeq = 0;

function refKey(t: TargetRef): string {
  return t.side === 'enemy' ? `e${t.uid}` : t.side;
}

function FloatText({ f }: { f: Float }) {
  const y = useSharedValue(0);
  const o = useSharedValue(1);
  useEffect(() => {
    y.set(withTiming(-46, { duration: 900 }));
    o.set(withSequence(withTiming(1, { duration: 500 }), withTiming(0, { duration: 400 })));
  }, [y, o]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }], opacity: o.get() }));
  return (
    <Animated.Text style={[styles.float, { color: f.color, pointerEvents: 'none' }, style]}>
      {f.text}
    </Animated.Text>
  );
}

function Floats({ floats, k }: { floats: Float[]; k: string }) {
  return (
    <View style={[styles.floatLayer, { pointerEvents: 'none' }]}>
      {floats
        .filter((f) => f.key === k)
        .map((f) => (
          <FloatText key={f.id} f={f} />
        ))}
    </View>
  );
}

function StatusChips({ e }: { e: BattleEnemy }) {
  const def = ENEMIES[e.id];
  const chips: { t: string; c: string }[] = [];
  if (e.charging) chips.push({ t: 'CHARGING', c: C.bad });
  if (e.stun) chips.push({ t: 'STUN', c: C.gold });
  if (e.hacked) chips.push({ t: `HACKED ${e.hacked}`, c: C.good });
  if (e.blind) chips.push({ t: 'BLIND', c: '#ffffff' });
  if (e.burn) chips.push({ t: 'BURN', c: '#ff8a3d' });
  if (e.atkBuff) chips.push({ t: 'ATK+', c: C.bad });
  if (def.shielded) chips.push(e.shieldDown > 0 ? { t: `SHIELD DOWN ${e.shieldDown}`, c: C.good } : { t: 'SHIELDED', c: C.accent });
  if (e.listening) chips.push({ t: 'LISTENING', c: C.pink });
  if (!chips.length) return null;
  return (
    <View style={styles.chipRow}>
      {chips.map((ch) => (
        <Text key={ch.t} style={[styles.chip, { color: ch.c, borderColor: ch.c }]}>
          {ch.t}
        </Text>
      ))}
    </View>
  );
}

function EnemyCard({
  e,
  left,
  width,
  height,
  selected,
  floats,
  onSelect,
}: {
  e: BattleEnemy;
  left: number;
  width: number;
  height: number;
  selected: boolean;
  floats: Float[];
  onSelect: () => void;
}) {
  const def = ENEMIES[e.id];
  return (
    <Pressable onPress={onSelect} disabled={e.dead} style={[styles.enemyCard, { left, width, height, opacity: e.dead ? 0.35 : 1 }]}>
      <View style={[styles.enemyInfo, selected && !e.dead && { borderColor: C.gold }]}>
        <Text numberOfLines={1} style={[styles.enemyName, def.boss && { color: C.bad }]}>
          {e.name}
        </Text>
        <View style={styles.enemyHpTrack}>
          <View style={[styles.enemyHpFill, { width: `${Math.max(0, (e.hp / e.maxHp) * 100)}%` }]} />
        </View>
        {e.scanned ? (
          <Text numberOfLines={1} style={styles.scanned}>
            {Math.max(0, e.hp)}/{e.maxHp}
            {def.weak.length ? ` · WEAK ${def.weak.map((w) => DAMAGE_LABEL[w]).join('/')}` : ''}
            {def.resist.length ? ` · RES ${def.resist.map((w) => DAMAGE_LABEL[w]).join('/')}` : ''}
          </Text>
        ) : null}
        <StatusChips e={e} />
      </View>
      <View style={{ flex: 1 }}>
        <Floats floats={floats} k={`e${e.uid}`} />
      </View>
    </Pressable>
  );
}

function ActionTile({ label, sub, icon, color, disabled, onPress }: { label: string; sub?: string; icon: IconName; color: string; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, { borderColor: disabled ? C.border : color }, pressed && styles.tilePressed, disabled && { opacity: 0.4 }]}
    >
      <MaterialCommunityIcons name={icon} size={20} color={disabled ? C.faint : color} />
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={[styles.tileLabel, { color: disabled ? C.faint : C.text }]}>
          {label}
        </Text>
        {sub ? (
          <Text numberOfLines={1} style={styles.tileSub}>
            {sub}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const FX_SFX: Partial<Record<FxKind, SfxId>> = {
  zap: 'zap',
  fire: 'burn',
  emp: 'emp',
  frost: 'shield',
  flash: 'zap',
  hack: 'hack',
  scan: 'scan',
  light: 'heal',
};

function Battle({ data, encounter, seed, onFinish }: { data: GameData; encounter: Encounter; seed: number; onFinish: (s: BattleState) => void }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [state, setState] = useState(() => createBattle(data, encounter, seed));
  const stateRef = useRef(state);
  const [target, setTarget] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [itemsOpen, setItemsOpen] = useState(false);
  const [floats, setFloats] = useState<Float[]>([]);
  const [fx, setFx] = useState<StageFx[]>([]);
  const [gone, setGone] = useState<number[]>([]);
  const [anim, setAnim] = useState<Record<number, { hit: number; lunge: number }>>({});
  const shake = useSharedValue(0);
  const theme = getDeck(data.deck).def.theme;

  const stageW = Math.min(width, 640);
  const stageH = Math.min(Math.round(height * 0.4), 400);
  const floorY = stageH * 0.86;
  const alive = aliveEnemies(state);
  const visible = state.enemies.filter((e) => !e.dead || !gone.includes(e.uid));
  const slotW = stageW / Math.max(1, visible.length);
  const selected = alive.find((e) => e.uid === target) ?? alive[0];

  const slotFor = (e: BattleEnemy, i: number): EnemySlot => {
    const def = ENEMIES[e.id];
    const base = Math.min(slotW * 0.92, stageH * 0.6);
    const size = Math.round(Math.min(base * (def.size ?? 1), stageH * 0.8, slotW * 1.05));
    return {
      enemy: e,
      x: slotW * (i + 0.5),
      size,
      selected: selected?.uid === e.uid,
      hit: anim[e.uid]?.hit ?? 0,
      lunge: anim[e.uid]?.lunge ?? 0,
    };
  };
  const slots = visible.map(slotFor);

  // Translates the events produced by one reducer step into sound, floating numbers, stage effects and shakes.
  const present = (next: BattleState) => {
    const fresh: BattleEvent[] = next.events;
    if (!fresh.length) return;
    const sounds = new Set<SfxId>();
    const newFloats: Float[] = [];
    const newFx: StageFx[] = [];
    const bumps: Record<number, { hit?: boolean; lunge?: boolean }> = {};
    const deaths: number[] = [];
    let shakeAmt = 0;
    const posOf = (t?: TargetRef) => {
      if (t?.side === 'enemy') {
        const idx = next.enemies.filter((e) => !e.dead || !gone.includes(e.uid) || e.uid === t.uid).findIndex((e) => e.uid === t.uid);
        const n = Math.max(1, next.enemies.filter((e) => !e.dead || !gone.includes(e.uid) || e.uid === t.uid).length);
        return { x: (stageW / n) * (Math.max(0, idx) + 0.5), y: floorY - stageH * 0.3 };
      }
      return { x: stageW / 2, y: stageH * 0.9 };
    };
    const float = (t: TargetRef, text: string, color: string) => {
      floatSeq += 1;
      newFloats.push({ id: floatSeq, key: refKey(t), text, color });
    };
    for (const ev of fresh) {
      switch (ev.kind) {
        case 'damage':
          if (ev.target.side === 'enemy') {
            float(ev.target, `-${ev.amount}${ev.crit ? '!' : ''}`, ev.weak ? C.gold : ev.resist ? C.dim : ev.crit ? C.warn : '#ffffff');
            bumps[ev.target.uid] = { ...bumps[ev.target.uid], hit: true };
            sounds.add(ev.crit || ev.weak ? 'crit' : 'hit');
          } else {
            float(ev.target, `-${ev.amount}`, C.bad);
            if (ev.target.side === 'kai') {
              shakeAmt = Math.max(shakeAmt, ev.amount >= next.kai.maxHp * 0.15 ? 14 : 7);
              sounds.add('hurt');
            } else sounds.add('hit');
          }
          break;
        case 'heal':
          if (ev.amount > 0) {
            float(ev.target, `+${ev.amount}`, C.good);
            sounds.add('heal');
          }
          break;
        case 'miss':
          float(ev.target, 'MISS', C.dim);
          sounds.add('miss');
          break;
        case 'absorb':
          float(ev.target, `BLOCK ${ev.amount}`, C.accent);
          sounds.add('shield');
          break;
        case 'status':
          float(ev.target, ev.text, ev.text === 'CHARGING' ? C.bad : C.gold);
          if (ev.text === 'CHARGING') sounds.add('alarm');
          if (ev.text === 'SHIELD' || ev.text === 'DECOY') sounds.add('shield');
          break;
        case 'death':
          if (ev.target.side === 'enemy') deaths.push(ev.target.uid);
          sounds.add('death');
          break;
        case 'lunge':
          if (ev.source.side === 'enemy') bumps[ev.source.uid] = { ...bumps[ev.source.uid], lunge: true };
          break;
        case 'fx': {
          const p = posOf(ev.target);
          newFx.push({ id: ev.seq, kind: ev.fx, x: p.x, y: p.y });
          const snd = FX_SFX[ev.fx];
          if (snd) sounds.add(snd);
          break;
        }
        case 'summon':
          sounds.add('alarm');
          break;
      }
    }
    sounds.forEach((s) => playSfx(s));
    if (shakeAmt) {
      haptic(shakeAmt > 10 ? 'heavy' : 'hit');
      shake.set(
        withSequence(
          withTiming(shakeAmt, { duration: 40 }),
          withTiming(-shakeAmt, { duration: 60 }),
          withTiming(shakeAmt / 2, { duration: 50 }),
          withTiming(0, { duration: 60 }),
        ),
      );
    }
    if (newFloats.length) {
      setFloats((f) => [...f, ...newFloats]);
      const ids = new Set(newFloats.map((f) => f.id));
      setTimeout(() => setFloats((f) => f.filter((x) => !ids.has(x.id))), 1000);
    }
    if (newFx.length) {
      setFx((f) => [...f, ...newFx]);
      const ids = new Set(newFx.map((f) => f.id));
      setTimeout(() => setFx((f) => f.filter((x) => !ids.has(x.id))), 1000);
    }
    if (Object.keys(bumps).length) {
      setAnim((a) => {
        const next = { ...a };
        for (const [uid, b] of Object.entries(bumps)) {
          const cur = next[Number(uid)] ?? { hit: 0, lunge: 0 };
          next[Number(uid)] = { hit: cur.hit + (b.hit ? 1 : 0), lunge: cur.lunge + (b.lunge ? 1 : 0) };
        }
        return next;
      });
    }
    if (deaths.length) setTimeout(() => setGone((g) => [...g, ...deaths]), 750);
  };

  const run = (action: BattleAction) => {
    const prev = stateRef.current;
    const next = battleReducer(prev, action);
    if (next === prev) return;
    stateRef.current = next;
    setState(next);
    present(next);
  };

  useEffect(() => {
    if (state.phase !== 'enemy') return;
    const id = setTimeout(() => run({ type: 'ENEMY_ACT' }), ENEMY_STEP_MS);
    return () => clearTimeout(id);
    // Re-arm only when the battle state changes; `run` is recreated every render (e.g. float cleanup),
    // and depending on it would keep resetting the enemy-turn timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    if (state.phase === 'victory' || state.phase === 'communed') {
      playSfx('victory');
      haptic('success');
    } else if (state.phase === 'defeat') {
      playSfx('defeat');
      haptic('warning');
    }
  }, [state.phase]);

  const act = (action: BattleAction) => {
    if (busy) return;
    run(action);
    setItemsOpen(false);
    setBusy(true);
    setTimeout(() => setBusy(false), ACTION_LOCK_MS);
  };

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.get() }] }));
  const k = state.kai;
  const b = state.bolt;
  const over = isBattleOver(state);
  const battleItems = (Object.keys(state.inventory) as ItemId[]).filter(
    (id) => id !== 'repair_kit' && ITEMS[id].battle && (state.inventory[id] ?? 0) > 0,
  );
  const kaiStatus: string[] = [];
  if (k.shield > 0) kaiStatus.push(`SHIELD ${k.shield}`);
  if (k.poison > 0) kaiStatus.push(`POISON ${k.poison}`);
  if (k.burn > 0) kaiStatus.push('BURNING');
  if (k.frozen > 0) kaiStatus.push('FROZEN');
  if (k.boost > 0) kaiStatus.push(`STIM ${k.boost}`);
  if (k.brace) kaiStatus.push('BRACED');
  const lastLog = state.log.slice(-5);
  const phaseLabel =
    state.phase === 'kai' ? "KAI'S TURN" : state.phase === 'bolt' ? "BOLT'S TURN" : state.phase === 'enemy' ? 'ENEMY TURN' : '';
  const title = state.boss ? state.enemies[0]?.name.toUpperCase() : 'HOSTILES';

  return (
    <Animated.View style={[styles.root, { paddingTop: insets.top + 4, paddingBottom: insets.bottom + 6 }, shakeStyle]}>
      <View style={styles.topBar}>
        <Text style={styles.round}>ROUND {state.round}</Text>
        <Text numberOfLines={1} style={[styles.title, state.boss && { color: C.bad }]}>
          {state.boss ? 'BOSS // ' : ''}
          {title}
        </Text>
        <Text style={[styles.phase, { color: state.phase === 'enemy' ? C.bad : state.phase === 'bolt' ? C.bolt : C.warn }]}>{phaseLabel}</Text>
      </View>

      <View style={{ width: stageW, height: stageH, alignSelf: 'center' }}>
        <BattleStage width={stageW} height={stageH} theme={theme} slots={slots} fx={fx} />
        {visible.map((e, i) => (
          <EnemyCard
            key={e.uid}
            e={e}
            left={slotW * i}
            width={slotW}
            height={stageH}
            selected={selected?.uid === e.uid}
            floats={floats}
            onSelect={() => {
              setTarget(e.uid);
              playSfx('select');
            }}
          />
        ))}
      </View>

      <View style={styles.log}>
        {lastLog.map((l) => (
          <Text key={l.id} style={[styles.logLine, { color: TONE_COLOR[l.tone] }]} numberOfLines={2}>
            {l.text}
          </Text>
        ))}
      </View>

      <View style={styles.party}>
        <View style={styles.partyRow}>
          <Text style={styles.partyName}>KAI</Text>
          <Bar value={k.hp} max={k.maxHp} color={C.hp} extra={k.shield} extraColor={C.accent} height={10} />
          <Floats floats={floats} k="kai" />
        </View>
        {kaiStatus.length > 0 && <Text style={styles.partyStatus}>{kaiStatus.join(' · ')}</Text>}
        {b.active && (
          <View style={styles.partyRow}>
            <Text style={[styles.partyName, { color: C.bolt }]}>BOLT</Text>
            {b.ko ? (
              <Text style={[styles.partyStatus, { flex: 1, color: C.bad }]}>OFFLINE (use Spare Parts to reboot)</Text>
            ) : (
              <Bar value={b.hp} max={b.maxHp} color={C.boltHp} height={10} />
            )}
            <View style={styles.pips}>
              {Array.from({ length: b.maxEnergy }, (_, i) => (
                <View key={i} style={[styles.pip, i < b.energy && styles.pipOn]} />
              ))}
            </View>
            <Floats floats={floats} k="bolt" />
          </View>
        )}
        {b.active && b.decoy > 0 && <Text style={[styles.partyStatus, { color: C.bolt }]}>DECOY ACTIVE ({b.decoy})</Text>}
      </View>

      <View style={styles.actions}>
        {state.phase === 'kai' && !itemsOpen && (
          <>
            <View style={styles.weaponRow}>
              {k.weapons.map((w) => (
                <Pressable
                  key={w}
                  onPress={() => {
                    if (!busy) run({ type: 'KAI_SWAP', weapon: w });
                  }}
                  style={[styles.weaponChip, k.weapon === w && styles.weaponChipOn]}
                >
                  <MaterialCommunityIcons name={WEAPONS[w].icon as IconName} size={14} color={k.weapon === w ? C.bg : C.warn} />
                  <Text style={[styles.weaponChipText, k.weapon === w && { color: C.bg }]}>{DAMAGE_LABEL[WEAPONS[w].dtype]}</Text>
                </Pressable>
              ))}
              <Text style={styles.freeNote}>swap is free</Text>
            </View>
            <View style={styles.grid}>
              <ActionTile
                label="Attack"
                sub={`${WEAPONS[k.weapon].name}${selected ? ` > ${selected.name}` : ''}`}
                icon={WEAPONS[k.weapon].icon as IconName}
                color={C.warn}
                disabled={busy || !selected}
                onPress={() => selected && act({ type: 'KAI_ATTACK', target: selected.uid })}
              />
              <ActionTile
                label="Repair Kit"
                sub={`x${state.inventory.repair_kit ?? 0} · heal 45%`}
                icon="medical-bag"
                color={C.good}
                disabled={busy || !canUseItem(state, 'repair_kit')}
                onPress={() => act({ type: 'KAI_REPAIR' })}
              />
              <ActionTile
                label="Items"
                sub={battleItems.length ? `${battleItems.length} types` : 'none'}
                icon="bag-personal"
                color={C.accent}
                disabled={busy || battleItems.length === 0}
                onPress={() => setItemsOpen(true)}
              />
              <ActionTile label="Brace" sub="halve damage" icon="shield-account" color={C.dim} disabled={busy} onPress={() => act({ type: 'KAI_BRACE' })} />
              {state.canFlee && <ActionTile label="Flee" sub="costs time" icon="run-fast" color={C.dim} disabled={busy} onPress={() => act({ type: 'KAI_FLEE' })} />}
            </View>
          </>
        )}
        {state.phase === 'kai' && itemsOpen && (
          <ScrollView style={{ maxHeight: 220 }} contentContainerStyle={styles.grid}>
            {battleItems.map((id) => (
              <ActionTile
                key={id}
                label={`${ITEMS[id].name} x${state.inventory[id]}`}
                sub={ITEMS[id].target === 'enemy' && selected ? `> ${selected.name}` : ITEMS[id].desc}
                icon={ITEMS[id].icon as IconName}
                color={C.accent}
                disabled={busy || !canUseItem(state, id)}
                onPress={() => act({ type: 'KAI_ITEM', item: id, target: selected?.uid })}
              />
            ))}
            <ActionTile label="Back" icon="arrow-left" color={C.dim} onPress={() => setItemsOpen(false)} />
          </ScrollView>
        )}
        {state.phase === 'bolt' && (
          <View style={styles.grid}>
            {state.canCommune && (
              <ActionTile
                label="SPEAK"
                sub={`light-language ${state.commune}/3`}
                icon="lightbulb-on"
                color={C.pink}
                disabled={busy || !canUseAbility(state, 'speak')}
                onPress={() => act({ type: 'BOLT', ability: 'speak' })}
              />
            )}
            {BOLT_ABILITY_ORDER.filter((a) => {
              const def = BOLT_ABILITIES[a];
              return !def.module || b.modules.includes(def.module);
            }).map((a: BoltAbility) => {
              const def = BOLT_ABILITIES[a];
              const needsTarget = def.target === 'enemy';
              const usable = canUseAbility(state, a, needsTarget ? selected?.uid : undefined);
              let sub = `${def.cost ? `EN ${def.cost} · ` : ''}${def.desc}`;
              if (a === 'hack' && selected && !isHackable(selected)) sub = 'select a robot';
              return (
                <ActionTile
                  key={a}
                  label={def.name}
                  sub={sub}
                  icon={def.icon as IconName}
                  color={C.bolt}
                  disabled={busy || !usable}
                  onPress={() => act({ type: 'BOLT', ability: a, target: needsTarget ? selected?.uid : undefined })}
                />
              );
            })}
          </View>
        )}
        {state.phase === 'enemy' && <Text style={styles.waiting}>Enemies are acting...</Text>}
      </View>

      {over && (
        <Animated.View entering={FadeIn.duration(250)} style={styles.resultBackdrop}>
          <View style={styles.resultCard}>
            {state.phase === 'victory' && (
              <>
                <Text style={[styles.resultTitle, { color: C.good }]}>VICTORY</Text>
                <Text style={styles.resultLine}>+{state.rewards.xp} XP · +{state.rewards.scrap} scrap</Text>
                {Object.entries(state.rewards.items).map(([id, n]) => (
                  <Text key={id} style={styles.resultLine}>
                    Found: {ITEMS[id as ItemId].name} x{n}
                  </Text>
                ))}
                <Text style={styles.resultSub}>Battle time: {BATTLE_BASE_MINUTES + state.round * BATTLE_ROUND_MINUTES} minutes of reactor life</Text>
              </>
            )}
            {state.phase === 'defeat' && (
              <>
                <Text style={[styles.resultTitle, { color: C.bad }]}>KAI HAS FALLEN</Text>
                <Text style={styles.resultLine}>{`BOLT's sensors flicker. "Kai? Kai, get up..."`}</Text>
              </>
            )}
            {state.phase === 'fled' && (
              <>
                <Text style={[styles.resultTitle, { color: C.warn }]}>ESCAPED</Text>
                <Text style={styles.resultLine}>You live to fight another minute.</Text>
              </>
            )}
            {state.phase === 'communed' && (
              <>
                <Text style={[styles.resultTitle, { color: C.pink }]}>IT IS LISTENING</Text>
                <Text style={styles.resultLine}>{"The Heart's light turns blue, then gold."}</Text>
              </>
            )}
            <Button label="Continue" icon="arrow-right" onPress={() => onFinish(state)} style={{ marginTop: 16, alignSelf: 'stretch' }} />
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

export function BattleScreen() {
  const encounter = useGame((s) => s.encounter);
  const seed = useGame((s) => s.battleSeed);
  const battleKey = useGame((s) => s.battleKey);
  const data = useGame((s) => s.data);
  const finishBattle = useGame((s) => s.finishBattle);
  if (!encounter) return <View style={styles.root} />;
  return <Battle key={battleKey} data={data} encounter={encounter} seed={seed} onFinish={(s) => finishBattle(battleResult(s))} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 6, gap: 8 },
  round: { fontFamily: F.head, fontSize: 10, color: C.dim, letterSpacing: 1.5 },
  title: { flex: 1, fontFamily: F.title, fontSize: 13, color: C.text, textAlign: 'center', letterSpacing: 1 },
  phase: { fontFamily: F.head, fontSize: 10, letterSpacing: 1.5 },
  enemyCard: { position: 'absolute', top: 0, paddingHorizontal: 3 },
  enemyInfo: {
    backgroundColor: 'rgba(6,10,20,0.82)',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 7,
    padding: 5,
    gap: 3,
  },
  enemyName: { fontFamily: F.head, fontSize: 10, color: C.text },
  enemyHpTrack: { height: 6, backgroundColor: '#2a1a22', borderRadius: 3, overflow: 'hidden' },
  enemyHpFill: { height: '100%', backgroundColor: C.bad },
  scanned: { fontFamily: F.mono, fontSize: 9, color: C.good },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  chip: { fontFamily: F.head, fontSize: 7, borderWidth: 1, borderRadius: 4, paddingHorizontal: 3, paddingVertical: 1 },
  floatLayer: { position: 'absolute', left: 0, right: 0, top: 30, alignItems: 'center' },
  float: {
    position: 'absolute',
    fontFamily: F.title,
    fontSize: 20,
    textShadowColor: '#000000',
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },
  log: {
    marginHorizontal: 10,
    marginTop: 6,
    padding: 8,
    minHeight: 92,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    gap: 2,
  },
  logLine: { fontFamily: F.mono, fontSize: 12, lineHeight: 16 },
  party: { marginHorizontal: 10, marginTop: 6, gap: 4 },
  partyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  partyName: { fontFamily: F.head, fontSize: 11, color: C.warn, width: 36 },
  partyStatus: { fontFamily: F.head, fontSize: 9, color: C.gold, letterSpacing: 1, marginLeft: 44 },
  pips: { flexDirection: 'row', gap: 3 },
  pip: { width: 8, height: 12, borderRadius: 2, backgroundColor: '#2a2f3a' },
  pipOn: { backgroundColor: C.energy },
  actions: { flex: 1, marginTop: 8, paddingHorizontal: 10, justifyContent: 'flex-end' },
  weaponRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  weaponChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: C.warn,
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  weaponChipOn: { backgroundColor: C.warn },
  weaponChipText: { fontFamily: F.head, fontSize: 10, color: C.warn },
  freeNote: { fontFamily: F.mono, fontSize: 10, color: C.faint },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tile: {
    width: '48.8%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: C.panel,
  },
  tilePressed: { backgroundColor: C.panelHi, transform: [{ scale: 0.97 }] },
  tileLabel: { fontFamily: F.head, fontSize: 12 },
  tileSub: { fontFamily: F.mono, fontSize: 10, color: C.dim },
  waiting: { fontFamily: F.head, fontSize: 12, color: C.bad, textAlign: 'center', letterSpacing: 2, paddingVertical: 30 },
  resultBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(2,4,10,0.8)', justifyContent: 'center', padding: 24 },
  resultCard: { backgroundColor: '#0d1322', borderWidth: 1.5, borderColor: C.borderHi, borderRadius: 16, padding: 20, alignItems: 'center', gap: 6 },
  resultTitle: { fontFamily: F.title, fontSize: 24, letterSpacing: 2, marginBottom: 6, textAlign: 'center' },
  resultLine: { fontFamily: F.mono, fontSize: 14, color: C.text, textAlign: 'center' },
  resultSub: { fontFamily: F.mono, fontSize: 11, color: C.dim, marginTop: 4 },
});
