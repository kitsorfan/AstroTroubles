import { MAX_HEARTS } from '../core/constants';
import type { SaveData, UpgradeId } from '../core/save';
import { WEAPONS, WEAPON_ORDER, ownedWeapons, type Weapon, type WeaponId } from '../entities/weapons';
import { CHAPTER_DECKS, chapterOf, type Chapter } from '../levels';
import type { DeckId } from '../world/levelTypes';

/**
 * PANDORA's shop: what she sells, for how much, and what buying does to the save. The shop screen
 * (ui.ts) only draws this. Weapons go on sale once Jason reaches Gaia Nova.
 */

export interface Upgrade {
  id: UpgradeId;
  name: string;
  desc: string;
  /** Prices of each level, in order. */
  prices: number[];
}

export const UPGRADES: Upgrade[] = [
  { id: 'heart', name: 'Heart Plating', desc: '+1 max heart', prices: [150, 300, 500] },
  { id: 'blaster', name: 'Blaster Power', desc: '+1 damage for blasts, spins, pounds and dashes (fireballs +2)', prices: [250, 600] },
  { id: 'clip', name: 'Bigger Clip', desc: '+2 shots before you need to reload', prices: [160, 380] },
  { id: 'rapid', name: 'Quick Reload', desc: 'Shoot and reload faster', prices: [200, 450] },
  { id: 'boltZap', name: 'LUX Zapper', desc: 'LUX’s zap hurts instead of just stunning, and his force pulse hits harder', prices: [180, 420] },
  { id: 'magnet', name: 'Bolt Magnet', desc: 'Pull in bolts from farther away', prices: [120, 300] },
];

/** True once Jason has reached Gaia Nova (any chapter 2 region unlocked), or is playing there right now. */
export function gaiaReached(save: SaveData, deck?: DeckId): boolean {
  return save.unlocked > CHAPTER_DECKS[1].length || (!!deck && chapterOf(deck) === 2);
}

/** Which chapter's stock the shop shows. */
export function shopChapter(save: SaveData, deck?: DeckId): Chapter {
  return gaiaReached(save, deck) ? 2 : 1;
}

export interface UpgradeOffer {
  item: Upgrade;
  level: number;
  max: number;
  /** Price of the next level, or null once maxed. */
  price: number | null;
}

export interface WeaponOffer {
  weapon: Weapon;
  owned: boolean;
  equipped: boolean;
  /** Price, or null once owned. */
  price: number | null;
}

/** Everything on sale right now, with levels and prices for this save. */
export function shopStock(save: SaveData, deck?: DeckId): { upgrades: UpgradeOffer[]; weapons: WeaponOffer[] } {
  const ch = shopChapter(save, deck);
  const upgrades = UPGRADES.map((item) => {
    const level = save.upgrades[item.id] ?? 0;
    const max = item.prices.length;
    return { item, level, max, price: level < max ? item.prices[level] : null };
  });
  const owned = ownedWeapons(save.weapons);
  const weapons =
    ch === 1
      ? []
      : WEAPON_ORDER.map((id) => {
          const have = owned.includes(id);
          return { weapon: WEAPONS[id], owned: have, equipped: have && save.weapon === id, price: have ? null : WEAPONS[id].price };
        });
  return { upgrades, weapons };
}

/** Buys the next level of an upgrade. Returns false if it is maxed or Jason can't afford it. */
export function buyUpgrade(save: SaveData, id: UpgradeId, deck?: DeckId): boolean {
  const offer = shopStock(save, deck).upgrades.find((o) => o.item.id === id);
  if (!offer || offer.price === null || save.bolts < offer.price) return false;
  if (id === 'heart' && save.maxHearts >= MAX_HEARTS) return false;
  save.bolts -= offer.price;
  save.upgrades[id] = offer.level + 1;
  if (id === 'heart') save.maxHearts = Math.min(MAX_HEARTS, save.maxHearts + 1);
  return true;
}

/** Buys a weapon and equips it. Returns false if it isn't on sale, is owned already, or costs too much. */
export function buyWeapon(save: SaveData, id: WeaponId, deck?: DeckId): boolean {
  const offer = shopStock(save, deck).weapons.find((o) => o.weapon.id === id);
  if (!offer || offer.price === null || save.bolts < offer.price) return false;
  save.bolts -= offer.price;
  save.weapons = ownedWeapons([...save.weapons, id]);
  save.weapon = id;
  return true;
}

/** Equips a weapon Jason owns. */
export function equipWeapon(save: SaveData, id: WeaponId): boolean {
  if (!ownedWeapons(save.weapons).includes(id)) return false;
  save.weapon = id;
  return true;
}
