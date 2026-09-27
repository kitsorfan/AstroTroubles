import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { MAX_LEVEL, XP_TABLE, boltMaxEnergy, boltMaxHp, formatClock, kaiAtk, kaiDef, kaiMaxHp } from '../../game/constants';
import { ITEMS, MODULES, MOD_CHIP_POWER, WEAPONS } from '../../game/data/catalog';
import { getDeck } from '../../game/data/decks';
import { LOG_ORDER, LOGS, MEMORIES, MEMORY_ORDER, SURVIVORS } from '../../game/data/story';
import { canUseFieldItem } from '../../game/engine/explore';
import { useGame, type Menu } from '../../game/store/gameStore';
import type { ItemId, ModuleId, WeaponId } from '../../game/types';
import { C, F } from '../theme';
import { Button, type IconName } from './Button';
import { MiniMap } from './MiniMap';
import { SaveSlots } from './SaveSlots';

const MODULE_ORDER: ModuleId[] = ['stun', 'scan', 'shield', 'hack', 'capacitor', 'floodlight', 'plating', 'decoy', 'nanites', 'overcharge'];

const TABS: { id: Exclude<Menu, null | 'pause'>; label: string; icon: IconName }[] = [
  { id: 'inventory', label: 'Gear', icon: 'bag-personal' },
  { id: 'bolt', label: 'BOLT', icon: 'robot' },
  { id: 'map', label: 'Map', icon: 'map' },
  { id: 'logs', label: 'Logs', icon: 'cassette' },
  { id: 'save', label: 'Save', icon: 'content-save' },
  { id: 'load', label: 'Load', icon: 'folder-open' },
  { id: 'settings', label: 'Settings', icon: 'cog' },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Inventory() {
  const data = useGame((s) => s.data);
  const consumeItem = useGame((s) => s.consumeItem);
  const equip = useGame((s) => s.equip);
  const items = (Object.keys(data.inventory) as ItemId[]).filter((k) => (data.inventory[k] ?? 0) > 0);
  const nextXp = data.level < MAX_LEVEL ? XP_TABLE[data.level + 1] : null;
  return (
    <>
      <Section title="KAI REYES // JUNIOR ENGINEER">
        <Text style={styles.body}>
          Level {data.level} · XP {data.xp}
          {nextXp ? ` / ${nextXp}` : ' (max)'}
        </Text>
        <Text style={styles.body}>
          HP {data.hp}/{kaiMaxHp(data.level)} · ATK {kaiAtk(data.level)} · DEF {kaiDef(data.level)} · Mods +{data.modChips * MOD_CHIP_POWER}
        </Text>
        <Text style={styles.body}>
          Scrap {data.scrap} · Kills {data.kills} · Survivors saved {data.survivors.length}/{Object.keys(SURVIVORS).length}
        </Text>
      </Section>
      <Section title="WEAPONS">
        {(['wrench', 'cutter', 'rifle'] as WeaponId[]).map((w) => {
          const def = WEAPONS[w];
          const owned = data.weapons.includes(w);
          return (
            <View key={w} style={styles.row}>
              <MaterialCommunityIcons name={def.icon as IconName} size={20} color={owned ? C.warn : C.faint} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, !owned && { color: C.faint }]}>{owned ? def.name : '???'}</Text>
                {owned && (
                  <Text style={styles.small}>
                    {def.dtype.toUpperCase()} · Power {def.power} · {def.desc}
                  </Text>
                )}
              </View>
              {owned &&
                (data.weapon === w ? (
                  <Text style={styles.equipped}>EQUIPPED</Text>
                ) : (
                  <Button small label="Equip" onPress={() => equip(w)} />
                ))}
            </View>
          );
        })}
      </Section>
      <Section title="ITEMS">
        {items.length === 0 && <Text style={styles.small}>Nothing but lint.</Text>}
        {items.map((id) => {
          const def = ITEMS[id];
          return (
            <View key={id} style={styles.row}>
              <MaterialCommunityIcons name={def.icon as IconName} size={20} color={def.key ? C.gold : C.good} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>
                  {def.name} {def.key ? '' : `x${data.inventory[id]}`}
                </Text>
                <Text style={styles.small}>{def.desc}</Text>
              </View>
              {def.field && <Button small label="Use" disabled={!canUseFieldItem(data, id)} onPress={() => consumeItem(id)} />}
            </View>
          );
        })}
      </Section>
    </>
  );
}

function BoltPanel() {
  const data = useGame((s) => s.data);
  const replay = useGame((s) => s.replayMemory);
  if (!data.flags.bolt_joined) {
    return <Text style={styles.body}>{"You haven't found a drone yet. HALCYON mentioned one in the storage closet..."}</Text>;
  }
  return (
    <>
      <Section title="B-0LT-7 // MAINTENANCE DRONE">
        <Text style={styles.body}>
          HP {data.boltHp}/{boltMaxHp(data.level, data.modules)} · Energy {boltMaxEnergy(data.modules)} per battle
        </Text>
        <Text style={styles.small}>Sarcastic. Loyal. Afraid of the dark.</Text>
      </Section>
      <Section title="MODULES">
        {MODULE_ORDER.map((m) => {
          const def = MODULES[m];
          const has = data.modules.includes(m);
          return (
            <View key={m} style={styles.row}>
              <MaterialCommunityIcons name={def.icon as IconName} size={20} color={has ? C.bolt : C.faint} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, !has && { color: C.faint }]}>{has ? def.name : 'Missing part'}</Text>
                <Text style={styles.small}>{has ? def.desc : 'Somewhere on the ship...'}</Text>
              </View>
            </View>
          );
        })}
      </Section>
      <Section title={`MEMORY FILES ${data.memories.length}/6`}>
        {MEMORY_ORDER.map((m) => {
          const def = MEMORIES[m];
          const has = data.memories.includes(m);
          return (
            <View key={m} style={styles.row}>
              <MaterialCommunityIcons name={has ? 'star-four-points' : 'lock'} size={18} color={has ? C.pink : C.faint} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, !has && { color: C.faint }]}>
                  {String(def.index).padStart(2, '0')} · {has ? def.title : 'CORRUPTED'}
                </Text>
                {has && <Text style={styles.small}>{def.summary}</Text>}
              </View>
              {has && <Button small label="Replay" onPress={() => replay(m)} />}
            </View>
          );
        })}
      </Section>
    </>
  );
}

function LogsPanel() {
  const data = useGame((s) => s.data);
  const openLog = useGame((s) => s.openLog);
  return (
    <Section title={`DATA LOGS ${data.logs.length}/${LOG_ORDER.length}`}>
      {LOG_ORDER.map((id) => {
        const log = LOGS[id];
        const has = data.logs.includes(id);
        return (
          <Pressable key={id} disabled={!has} onPress={() => openLog(id)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
            <MaterialCommunityIcons name="cassette" size={18} color={has ? C.gold : C.faint} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemName, !has && { color: C.faint }]}>{has ? log.title : '???'}</Text>
              <Text style={styles.small}>
                {getDeck(log.deck).def.name}
                {has ? ` · ${log.author}` : ''}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </Section>
  );
}

function SettingsPanel() {
  const settings = useGame((s) => s.settings);
  const setSettings = useGame((s) => s.setSettings);
  const rows: { key: keyof typeof settings; label: string }[] = [
    { key: 'sfx', label: 'Sound effects' },
    { key: 'music', label: 'Music' },
    { key: 'haptics', label: 'Vibration' },
  ];
  return (
    <Section title="SETTINGS">
      {rows.map((r) => (
        <View key={r.key} style={styles.row}>
          <Text style={[styles.itemName, { flex: 1 }]}>{r.label}</Text>
          <Switch value={settings[r.key]} onValueChange={(v) => setSettings({ [r.key]: v })} trackColor={{ true: C.accent, false: C.border }} />
        </View>
      ))}
    </Section>
  );
}

export function PauseMenu() {
  const menu = useGame((s) => s.menu);
  const setMenu = useGame((s) => s.setMenu);
  const data = useGame((s) => s.data);
  const saveSlot = useGame((s) => s.saveSlot);
  const loadSlot = useGame((s) => s.loadSlot);
  const toTitle = useGame((s) => s.toTitle);
  const { width } = useWindowDimensions();
  const [confirmQuit, setConfirmQuit] = useState(false);
  if (!menu) return null;
  const tab = menu === 'pause' ? 'inventory' : menu;

  return (
    <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={styles.backdrop}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>PAUSED</Text>
          <Text style={styles.subtitle}>
            {getDeck(data.deck).def.name} · Reactor {formatClock(data.minutesLeft)}
          </Text>
        </View>
        <Pressable onPress={() => setMenu(null)} style={styles.close} hitSlop={10}>
          <MaterialCommunityIcons name="close" size={26} color={C.text} />
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.tabs}>
        {TABS.map((t) => (
          <Pressable key={t.id} onPress={() => setMenu(t.id)} style={[styles.tab, tab === t.id && styles.tabActive]}>
            <MaterialCommunityIcons name={t.icon} size={16} color={tab === t.id ? C.bg : C.accent} />
            <Text style={[styles.tabText, tab === t.id && { color: C.bg }]}>{t.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {tab === 'inventory' && <Inventory />}
        {tab === 'bolt' && <BoltPanel />}
        {tab === 'logs' && <LogsPanel />}
        {tab === 'map' && (
          <Section title={getDeck(data.deck).def.name.toUpperCase()}>
            <MiniMap data={data} width={Math.min(width - 48, 480)} />
            <Text style={[styles.small, { marginTop: 8 }]}>
              Orange: you · Red: hostiles · Yellow: items · Green: lift and med stations · Pink: survivors · Grey: closed doors
            </Text>
          </Section>
        )}
        {tab === 'save' && (
          <Section title="SAVE GAME">
            <SaveSlots mode="save" onPick={(slot) => saveSlot(slot)} />
          </Section>
        )}
        {tab === 'load' && (
          <Section title="LOAD GAME">
            <SaveSlots
              mode="load"
              onPick={async (slot) => {
                await loadSlot(slot);
              }}
            />
          </Section>
        )}
        {tab === 'settings' && <SettingsPanel />}
        <View style={styles.footer}>
          <Button label="Resume" icon="play" onPress={() => setMenu(null)} style={{ flex: 1 }} />
          <Button
            label={confirmQuit ? 'Really quit?' : 'Quit to title'}
            icon="exit-to-app"
            color={C.bad}
            onPress={() => {
              if (!confirmQuit) {
                setConfirmQuit(true);
                return;
              }
              setConfirmQuit(false);
              toTitle();
            }}
            style={{ flex: 1 }}
          />
        </View>
        {confirmQuit && <Text style={styles.warn}>Unsaved progress since your last save or autosave will be lost.</Text>}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(3,6,14,0.97)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 8 },
  title: { fontFamily: F.title, fontSize: 22, color: C.accent, letterSpacing: 3 },
  subtitle: { fontFamily: F.mono, fontSize: 12, color: C.dim },
  close: { padding: 4 },
  tabs: { paddingHorizontal: 12, gap: 6, paddingBottom: 8 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: C.accent,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  tabActive: { backgroundColor: C.accent },
  tabText: { fontFamily: F.head, fontSize: 11, color: C.accent },
  content: { padding: 16, paddingTop: 4, gap: 12, paddingBottom: 40 },
  section: { borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, backgroundColor: C.panel, gap: 6 },
  sectionTitle: { fontFamily: F.head, fontSize: 11, color: C.dim, letterSpacing: 2, marginBottom: 2 },
  body: { fontFamily: F.mono, fontSize: 13, color: C.text },
  small: { fontFamily: F.mono, fontSize: 11, color: C.dim },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  itemName: { fontFamily: F.head, fontSize: 12, color: C.text },
  equipped: { fontFamily: F.head, fontSize: 10, color: C.good },
  footer: { flexDirection: 'row', gap: 10, marginTop: 4 },
  warn: { fontFamily: F.mono, fontSize: 11, color: C.warn, textAlign: 'center' },
});
