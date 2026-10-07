import type { Ability, DeckId } from '../world/levelTypes';
import { post } from './bridge';
import { START_HEARTS } from './constants';
import { detectLang, type Lang } from './i18n';
import { equippedWeapon, ownedWeapons } from '../entities/weapons';

/** Shop upgrades. The last four are only sold on Gaia Nova (chapter 2). */
export type UpgradeId = 'blaster' | 'rapid' | 'clip' | 'boltZap' | 'magnet' | 'heart' | 'armor' | 'dashCell' | 'spinCharge' | 'grapple';
export type Quality = 'low' | 'medium' | 'high';

export interface Settings {
  music: number;
  sfx: number;
  quality: Quality;
  camSpeed: number;
  haptics: boolean;
  lang: Lang;
}

/** A flight level's best results: the most rings and drones in one flight, and whether the dove's way was ever flown clean. */
export interface FlightRecord {
  rings: number;
  drones: number;
  clean: boolean;
}

export interface SaveData {
  version: 1;
  /** Highest level index the player may enter (1-6 on the ship, 7-12 on Gaia Nova, 13 on for chapter 3). */
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
  /** First-time hints LUX has already given (about cocoons, shards, bolts...). */
  hints?: string[];
  /** Side quests finished (their reward has been paid). */
  quests?: string[];
  /** Deck numbers after which the app has already asked for a store review (see game/review.ts). */
  reviewAsks?: number[];
  shards: string[];
  canisters: string[];
  colonists: string[];
  completed: DeckId[];
  bestTimes: Partial<Record<DeckId, number>>;
  endings: string[];
  settings: Settings;
  playSeconds: number;
  /** True once the arrival at Gaia Nova (the start of chapter 2) has been shown. */
  gaiaIntro?: boolean;
  /** True once the building of the Argo (the start of chapter 3) has been shown. */
  argoIntro?: boolean;
  /** Best results on the flight levels (rings, drones, a clean run), for their side quests. */
  flights?: Partial<Record<DeckId, FlightRecord>>;
  /** Weapons Jason owns (see entities/weapons.ts); the Blaster is always one of them. */
  weapons: string[];
  /** The weapon he has equipped. */
  weapon: string;
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
    weapons: ['blaster'],
    weapon: 'blaster',
  };
}

/** Brings a save from an older version of the game up to date: fields added since get their defaults. */
export function migrateSave(s: SaveData): SaveData {
  // LUX's old shield module became the force pulse.
  s.abilities = s.abilities.map((a) => ((a as string) === 'shield' ? 'pulse' : a));
  s.upgrades ??= {};
  // Weapons came with chapter 2: older saves own just the Blaster.
  s.weapons = ownedWeapons(Array.isArray(s.weapons) ? s.weapons : []);
  s.weapon = equippedWeapon(s.weapons, s.weapon);
  return s;
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
    migrateSave(best);
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
