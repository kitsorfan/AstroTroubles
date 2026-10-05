import type { Ability, DeckId } from '../world/levelTypes';
import { post } from './bridge';
import { START_HEARTS } from './constants';
import { detectLang, type Lang } from './i18n';

export type UpgradeId = 'blaster' | 'rapid' | 'clip' | 'boltZap' | 'magnet' | 'heart';
export type Quality = 'low' | 'medium' | 'high';

export interface Settings {
  music: number;
  sfx: number;
  quality: Quality;
  camSpeed: number;
  haptics: boolean;
  lang: Lang;
}

export interface SaveData {
  version: 1;
  /** Highest deck index the player may enter (1-6). */
  unlocked: number;
  /** Deck and checkpoint to resume from, with the deck's switches, pickups and defeated enemies. */
  resume: { deck: DeckId; checkpoint: string | null; flags: string[]; taken: string[]; dead: string[] } | null;
  bolts: number;
  maxHearts: number;
  abilities: Ability[];
  upgrades: Partial<Record<UpgradeId, number>>;
  /** Enemy kinds Jason has already met (their threat card has been shown). */
  bestiary?: string[];
  /** Vault prizes already opened. */
  prizes?: string[];
  /** First-time hints BOLT has already given (about cocoons, shards, bolts...). */
  hints?: string[];
  /** Side quests finished (their reward has been paid). */
  quests?: string[];
  shards: string[];
  canisters: string[];
  colonists: string[];
  completed: DeckId[];
  bestTimes: Partial<Record<DeckId, number>>;
  endings: string[];
  settings: Settings;
  playSeconds: number;
}

/** Named after the game's old title; kept so existing saves carry over. */
const KEY = 'leviathan3d.save.v1';

export function defaultSettings(): Settings {
  const lowEnd = (navigator.hardwareConcurrency ?? 8) <= 4;
  return { music: 0.6, sfx: 0.85, quality: lowEnd ? 'low' : 'medium', camSpeed: 1, haptics: true, lang: detectLang() };
}

export function newSave(): SaveData {
  return {
    version: 1,
    unlocked: 1,
    resume: null,
    bolts: 0,
    maxHearts: START_HEARTS,
    abilities: [],
    upgrades: {},
    shards: [],
    canisters: [],
    colonists: [],
    completed: [],
    bestTimes: {},
    endings: [],
    settings: defaultSettings(),
    playSeconds: 0,
  };
}

function isSave(v: unknown): v is SaveData {
  const s = v as Partial<SaveData> | null;
  return !!s && s.version === 1 && typeof s.unlocked === 'number' && Array.isArray(s.shards) && Array.isArray(s.abilities);
}

export function loadSave(): SaveData | null {
  const sources = [window.__SAVE__, (() => {
    try {
      return localStorage.getItem(KEY) ?? undefined;
    } catch {
      return undefined;
    }
  })()];
  let best: SaveData | null = null;
  for (const raw of sources) {
    if (!raw) continue;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isSave(parsed) && (!best || parsed.playSeconds > best.playSeconds)) best = parsed;
    } catch {
      // ignore corrupt copies
    }
  }
  if (best) {
    best.settings = { ...defaultSettings(), ...best.settings };
    // BOLT's old shield module became the force pulse.
    best.abilities = best.abilities.map((a) => ((a as string) === 'shield' ? 'pulse' : a));
  }
  return best;
}

export function writeSave(s: SaveData) {
  const raw = JSON.stringify(s);
  try {
    localStorage.setItem(KEY, raw);
  } catch {
    // storage full or unavailable: the app bridge below still keeps a copy
  }
  post({ type: 'save', data: raw });
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  post({ type: 'save', data: '' });
}
