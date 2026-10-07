import type { SaveData } from '../core/save';
import { ownedWeapons } from '../entities/weapons';

/** How tough enemies are on the current deck. */
export interface Difficulty {
  /** 0 on the first deck, rising with each deck and with Jason's weapon upgrades. */
  tier: number;
  hp: number;
  speed: number;
  /** Attack-rate multiplier: cooldowns are divided by it. */
  rate: number;
  /** How close Jason must get before enemies notice him. */
  aggro: number;
}

/**
 * Enemies get tougher, faster and more alert further up the ship, and a little more so for every
 * weapon upgrade Jason owns, so buying power never makes the game a walkover.
 */
export function difficultyFor(deckIndex: number, save: SaveData): Difficulty {
  const u = save.upgrades;
  // The ship's two levels of each weapon upgrade count fully; the Mk II level (Gaia Nova) a little
  // less, since the regions there already get tougher; each extra weapon is more choice than raw
  // power, so it counts for little.
  let ship = 0;
  let mk2 = 0;
  for (const lvl of [u.blaster ?? 0, u.rapid ?? 0, u.clip ?? 0]) {
    ship += Math.min(2, lvl);
    mk2 += Math.max(0, lvl - 2);
  }
  const arms = ownedWeapons(save.weapons).length - 1;
  // Chapter 3 keeps getting a little harder, but slowly: past Mount Atlantas (deck 12) each level adds a
  // quarter tier, so enemies stay close to the volcano's and every hero (even slow Brennus) can keep up.
  const base = Math.min(deckIndex, 12) - 1 + 0.25 * Math.max(0, deckIndex - 12);
  const tier = base + 0.5 * ship + 0.35 * mk2 + 0.1 * arms;
  return { tier, hp: 1 + 0.22 * tier, speed: 1 + 0.06 * tier, rate: 1 + 0.1 * tier, aggro: 11 + tier * 0.7 };
}
