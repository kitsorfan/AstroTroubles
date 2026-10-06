import type { DeckId, LevelDef } from '../world/levelTypes';
import { bridge } from './bridge';
import { cryo } from './cryo';
import { desert } from './desert';
import { engine } from './engine';
import { habitat } from './habitat';
import { hydro } from './hydro';
import { jungle } from './jungle';
import { plains } from './plains';
import { rockies } from './rockies';
import { security } from './security';
import { snow } from './snow';
import { volcano } from './volcano';

/** Every deck and region in play order: the ship's six decks, then the six regions of Gaia Nova. */
export const LEVEL_ORDER: DeckId[] = ['cryo', 'hydro', 'engine', 'habitat', 'security', 'bridge', 'plains', 'desert', 'snow', 'rockies', 'jungle', 'volcano'];

export const LEVELS: Record<DeckId, LevelDef> = { cryo, hydro, engine, habitat, security, bridge, plains, desert, snow, rockies, jungle, volcano };

/** Chapter 1 is the colony ship, chapter 2 the planet Gaia Nova. */
export type Chapter = 1 | 2;

export const CHAPTERS: Chapter[] = [1, 2];

export const CHAPTER_DECKS: Record<Chapter, DeckId[]> = { 1: LEVEL_ORDER.slice(0, 6), 2: LEVEL_ORDER.slice(6) };

export function chapterOf(id: DeckId): Chapter {
  return CHAPTER_DECKS[1].includes(id) ? 1 : 2;
}

/** Position of a deck within its own chapter (1-6). */
export function chapterIndex(id: DeckId): number {
  return CHAPTER_DECKS[chapterOf(id)].indexOf(id) + 1;
}

/** The last deck of a chapter ends with the chapter's finale instead of an exit. */
export function isFinale(id: DeckId): boolean {
  const list = CHAPTER_DECKS[chapterOf(id)];
  return list[list.length - 1] === id;
}

/** The first deck of the next chapter, if there is one. */
export function nextChapterStart(id: DeckId): DeckId | null {
  const next = CHAPTER_DECKS[(chapterOf(id) + 1) as Chapter];
  return next?.[0] ?? null;
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
