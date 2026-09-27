import AsyncStorage from '@react-native-async-storage/async-storage';

import { DECK_ORDER, SAVE_VERSION } from '../constants';
import type { DeckId, GameData } from '../types';

export type SlotId = 'auto' | '1' | '2' | '3';
export const SLOTS: SlotId[] = ['auto', '1', '2', '3'];

export interface SaveMeta {
  slot: SlotId;
  deck: DeckId;
  level: number;
  minutesLeft: number;
  savedAt: number;
  memories: number;
  survivors: number;
}

const keyFor = (slot: SlotId) => `leviathan.save.${slot}`;

function isGameData(v: unknown): v is GameData {
  if (!v || typeof v !== 'object') return false;
  const d = v as Partial<GameData>;
  return (
    d.version === SAVE_VERSION &&
    typeof d.deck === 'string' &&
    DECK_ORDER.includes(d.deck as DeckId) &&
    typeof d.hp === 'number' &&
    typeof d.minutesLeft === 'number' &&
    !!d.pos &&
    !!d.flags &&
    Array.isArray(d.modules) &&
    Array.isArray(d.weapons)
  );
}

export async function writeSave(slot: SlotId, data: GameData): Promise<void> {
  const payload: GameData = { ...data, savedAt: Date.now() };
  await AsyncStorage.setItem(keyFor(slot), JSON.stringify(payload));
}

export async function readSave(slot: SlotId): Promise<GameData | null> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(slot));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isGameData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function deleteSave(slot: SlotId): Promise<void> {
  await AsyncStorage.removeItem(keyFor(slot));
}

export async function listSaves(): Promise<Record<SlotId, SaveMeta | null>> {
  const out = { auto: null, '1': null, '2': null, '3': null } as Record<SlotId, SaveMeta | null>;
  for (const slot of SLOTS) {
    const d = await readSave(slot);
    if (d) {
      out[slot] = {
        slot,
        deck: d.deck,
        level: d.level,
        minutesLeft: d.minutesLeft,
        savedAt: d.savedAt,
        memories: d.memories.length,
        survivors: d.survivors.length,
      };
    }
  }
  return out;
}

export async function latestSlot(): Promise<SlotId | null> {
  const all = await listSaves();
  let best: SaveMeta | null = null;
  for (const meta of Object.values(all)) {
    if (meta && (!best || meta.savedAt > best.savedAt)) best = meta;
  }
  return best?.slot ?? null;
}

export interface Settings {
  sfx: boolean;
  music: boolean;
  haptics: boolean;
}

const SETTINGS_KEY = 'leviathan.settings';
export const DEFAULT_SETTINGS: Settings = { sfx: true, music: true, haptics: true };

export async function readSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function writeSettings(s: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}
