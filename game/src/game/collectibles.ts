import { tr } from '../core/i18n';
import type { Chapter } from '../levels';

/**
 * What each chapter hides, and who (or what) it rescues. Every on-foot level has three collectibles
 * (the `shard` entities) and a few things to rescue (the `cocoon` entities):
 *
 * - Chapter 1, the ship: pink memory shards (GaScu's memories), and colonists in pink cocoons.
 * - Chapter 2, Gaia Nova: pages of Brennus's journal, and scientists in thorn cocoons.
 * - Chapter 3, the Argonauts: Gardener LIGHT-STONES, glowing rainbow stones left by Celestia's people;
 *   each one teaches LUX and IRIS another word of Celestia's light-language. What gets rescued is
 *   different on every level of chapter 3 (on the Harpy Isles: Phineus's food, from gold harpy nets).
 *
 * Later chapter 3 levels reuse all of this by simply placing `shard` and `cocoon` entities.
 */
export type FindKind = 'shard' | 'page' | 'stone';
export type RescueKind = 'colonist' | 'scientist' | 'supplies';

/** Chapter 3 has eight levels with a map to walk (the Clashing Rocks and the Sirens' Sea are flown or dived), with three light-stones each. */
export const LIGHT_STONES = 24;

export const findKind = (ch: Chapter): FindKind => (ch === 1 ? 'shard' : ch === 2 ? 'page' : 'stone');
export const rescueKind = (ch: Chapter): RescueKind => (ch === 1 ? 'colonist' : ch === 2 ? 'scientist' : 'supplies');

/** How many collectibles a chapter will have once it's finished (chapters 1 and 2 have 18). */
export const plannedFinds = (ch: Chapter, built: number): number => (ch === 3 ? Math.max(LIGHT_STONES, built) : built);

/** The names of a chapter's collectibles and rescues, for the pause menu and results card (translated). */
export function lootLabels(ch: Chapter): { finds: string; rescues: string } {
  switch (findKind(ch)) {
    case 'shard':
      return { finds: tr('Memory shards'), rescues: tr('Colonists rescued') };
    case 'page':
      return { finds: tr('Journal pages'), rescues: tr('Scientists freed') };
    case 'stone':
      return { finds: tr('Light-stones'), rescues: tr('Supplies won back') };
  }
}
