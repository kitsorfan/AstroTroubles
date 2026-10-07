import type { SaveData } from '../core/save';
import type { DeckId, LevelDef } from '../world/levelTypes';
import { bridge } from './bridge';
import { cryo } from './cryo';
import { desert } from './desert';
import { engine } from './engine';
import { habitat } from './habitat';
import { hydro } from './hydro';
import { jungle } from './jungle';
import { mine } from './mine';
import { plains } from './plains';
import { rocks } from './rocks';
import { rockies } from './rockies';
import { security } from './security';
import { snow } from './snow';
import { volcano } from './volcano';

/**
 * Every playable level in play order: the ship's six decks, the six regions of Gaia Nova, then the
 * chapter 3 levels built so far (the rest of chapter 3 is listed in `CHAPTER_PLAN`).
 */
export const LEVEL_ORDER: DeckId[] = ['cryo', 'hydro', 'engine', 'habitat', 'security', 'bridge', 'plains', 'desert', 'snow', 'rockies', 'jungle', 'volcano', 'rocks', 'mine'];

export const LEVELS: Record<DeckId, LevelDef> = { cryo, hydro, engine, habitat, security, bridge, plains, desert, snow, rockies, jungle, volcano, rocks, mine };

/** Chapter 1 is the colony ship, chapter 2 the planet Gaia Nova, chapter 3 the Argonauts' voyage to Colchis. */
export type Chapter = 1 | 2 | 3;

export const CHAPTERS: Chapter[] = [1, 2, 3];

export const CHAPTER_DECKS: Record<Chapter, DeckId[]> = { 1: LEVEL_ORDER.slice(0, 6), 2: LEVEL_ORDER.slice(6, 12), 3: LEVEL_ORDER.slice(12) };

/**
 * Every level each chapter will have once it's finished, by name. Chapter 3 is being built in batches:
 * the names past the levels that exist show as "coming soon" in the level select.
 */
export const CHAPTER_PLAN: Record<Chapter, string[]> = {
  1: CHAPTER_DECKS[1].map((id) => LEVELS[id].name),
  2: CHAPTER_DECKS[2].map((id) => LEVELS[id].name),
  3: [
    'The Clashing Rocks',
    'Harpy Isles',
    'Aeëtes’s Mine',
    'Sirens’ Sea',
    'Scylla’s Reef',
    'Talos’s Forge',
    'Medusa’s Labyrinth',
    'Brennus’s Last Stand',
    'The Garden of Colchis',
    'The Golden Fleece',
  ],
};

/** How many levels a chapter has when it is finished. */
export const chapterSize = (ch: Chapter) => CHAPTER_PLAN[ch].length;

/** The planned levels of a chapter that aren't built yet. */
export const comingSoon = (ch: Chapter) => CHAPTER_PLAN[ch].slice(CHAPTER_DECKS[ch].length);

export function chapterOf(id: DeckId): Chapter {
  return CHAPTERS.find((ch) => CHAPTER_DECKS[ch].includes(id)) ?? 1;
}

/** Position of a deck within its own chapter (1-6 on the ship and the planet, 1-10 in chapter 3). */
export function chapterIndex(id: DeckId): number {
  return CHAPTER_DECKS[chapterOf(id)].indexOf(id) + 1;
}

/**
 * The last level of a chapter ends with the chapter's finale instead of an exit. A chapter still being
 * built has no finale yet: its last level so far ends normally, and the next one is "coming soon".
 */
export function isFinale(id: DeckId): boolean {
  return chapterIndex(id) === chapterSize(chapterOf(id));
}

/** The first deck of the next chapter, if there is one. */
export function nextChapterStart(id: DeckId): DeckId | null {
  const ch = chapterOf(id);
  if (ch === CHAPTERS[CHAPTERS.length - 1]) return null;
  return CHAPTER_DECKS[(ch + 1) as Chapter][0] ?? null;
}

/** How many shards and colonists a chapter hides in all. */
export function chapterTotals(ch: Chapter): { shards: number; colonists: number } {
  let shards = 0;
  let colonists = 0;
  for (const id of CHAPTER_DECKS[ch]) {
    shards += LEVELS[id].shardIds.length;
    colonists += LEVELS[id].colonistIds?.length ?? 0;
  }
  return { shards, colonists };
}

/** Of the saved ids (`deck.s1`, `deck.c2`...), how many belong to this chapter. */
export function inChapter(ids: string[], ch: Chapter): number {
  const decks = CHAPTER_DECKS[ch];
  return ids.filter((x) => decks.includes(x.split('.')[0] as DeckId)).length;
}

/** True for a level that is flown or driven (the Argo, later the submarine and the mech suit). */
export const isVehicleLevel = (id: DeckId) => !!LEVELS[id].vehicle;

/** The levels Jason walks: the ones the reachability checker and the map tests look at. */
export const FOOT_LEVELS: DeckId[] = LEVEL_ORDER.filter((id) => !isVehicleLevel(id));

/**
 * Saves from before a chapter existed: a player who already saw a chapter's ending gets the next
 * chapter unlocked, and Continue goes there (so finishing chapter 2 before chapter 3 came out is enough).
 * Returns true if the save changed.
 */
export function catchUpChapters(save: Pick<SaveData, 'unlocked' | 'endings' | 'resume'>): boolean {
  const ended: Record<number, string[]> = { 1: ['saved', 'friends'], 2: ['freed', 'redeemed'] };
  let changed = false;
  for (const ch of CHAPTERS) {
    const next = CHAPTER_DECKS[(ch + 1) as Chapter]?.[0];
    if (!next || !(ended[ch] ?? []).some((e) => save.endings.includes(e))) continue;
    const index = LEVELS[next].index;
    if (save.unlocked >= index) continue;
    save.unlocked = index;
    save.resume ??= { deck: next, checkpoint: null, flags: [], taken: [], dead: [] };
    changed = true;
  }
  return changed;
}
