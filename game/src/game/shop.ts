import { MAX_HEARTS, MAX_HEARTS_MK2 } from '../core/constants';
import type { SaveData, UpgradeId } from '../core/save';
import { WEAPONS, WEAPON_ORDER, ownedWeapons, type Weapon, type WeaponId } from '../entities/weapons';
import { CHAPTERS, CHAPTER_DECKS, chapterOf, type Chapter } from '../levels';
import type { DeckId } from '../world/levelTypes';

/**
 * PANDORA's shop: what she sells, for how much, and what buying does to the save. The shop screen
 * (ui.ts) only draws this.
 *
 * On the ship she sells the six classic upgrades. Once Jason reaches Gaia Nova she adds "Mk II"
 * levels on top of them, four new upgrades and the weapons. Chapter 2 pays far more bolts, so the
 * new stock costs more: a thorough player can buy most of it by the volcano, but not by the desert.
 */

export interface Upgrade {
  id: UpgradeId;
  name: string;
  desc: string;
  /** Prices of each level sold on the ship (empty: only sold on Gaia Nova). */
  prices: number[];
  /** Prices of the extra "Mk II" levels sold on Gaia Nova. */
  mk2: number[];
}

export const UPGRADES: Upgrade[] = [
  { id: 'heart', name: 'Heart Plating', desc: '+1 max heart', prices: [150, 300, 500], mk2: [550, 800] },
  { id: 'blaster', name: 'Blaster Power', desc: '+1 damage for blasts, spins, pounds and dashes (fireballs +2)', prices: [250, 600], mk2: [900] },
  { id: 'clip', name: 'Bigger Clip', desc: '+2 shots before you need to reload', prices: [160, 380], mk2: [480] },
  { id: 'rapid', name: 'Quick Reload', desc: 'Shoot and reload faster', prices: [200, 450], mk2: [600] },
  { id: 'boltZap', name: 'LUX Zapper', desc: 'LUX’s zap hurts instead of just stunning, and his force pulse hits harder', prices: [180, 420], mk2: [550] },
  { id: 'magnet', name: 'Bolt Magnet', desc: 'Pull in bolts from farther away', prices: [120, 300], mk2: [350] },
  { id: 'armor', name: 'Armor Plating', desc: 'Blocks one hit. Comes back at checkpoints, or after a while.', prices: [], mk2: [450, 800] },
  { id: 'dashCell', name: 'Dash Cell', desc: '+1 dash before your energy runs out', prices: [], mk2: [350, 650] },
  { id: 'spinCharge', name: 'Spin Charge', desc: '+1 spin in a row before the recharge', prices: [], mk2: [450] },
  { id: 'grapple', name: 'Grapple Range', desc: 'Zip to grapple rings from farther away, and faster', prices: [], mk2: [400] },
];

const upgrade = (id: UpgradeId) => UPGRADES.find((u) => u.id === id) as Upgrade;

/** True once Jason has reached Gaia Nova (any chapter 2 region unlocked), or is playing there (or beyond) right now. */
export function gaiaReached(save: SaveData, deck?: DeckId): boolean {
  return save.unlocked > CHAPTER_DECKS[1].length || (!!deck && chapterOf(deck) >= 2);
}

/**
 * Which chapter's stock the shop shows (and which caps vault prizes respect). Chapter 3 sells the
 * same stock as chapter 2 for now.
 */
export function shopChapter(save: SaveData, deck?: DeckId): Chapter {
  return gaiaReached(save, deck) ? 2 : 1;
}

/** The highest level of each upgrade, per chapter: the ship's levels, then the Mk II ones from Gaia Nova on. */
export const UPGRADE_MAX = Object.fromEntries(
  CHAPTERS.map((ch) => [ch, Object.fromEntries(UPGRADES.map((u) => [u.id, u.prices.length + (ch >= 2 ? u.mk2.length : 0)]))]),
) as Record<Chapter, Record<UpgradeId, number>>;

/** The highest level of an upgrade this save can reach right now. */
export function upgradeCap(id: UpgradeId, save: SaveData, deck?: DeckId): number {
  return UPGRADE_MAX[shopChapter(save, deck)][id];
}

/** How many hearts Jason can have: 10, plus one for each level of Heart Plating Mk II. */
export function heartCap(save: SaveData): number {
  const mk2 = Math.max(0, (save.upgrades.heart ?? 0) - upgrade('heart').prices.length);
  return Math.min(MAX_HEARTS_MK2, MAX_HEARTS + mk2);
}

/**
 * An upgrade's level as the shop counts it. On Gaia Nova, if canisters and shards already filled
 * Jason up to 10 hearts, the ship's Heart Plating levels he skipped would add nothing, so the shop
 * goes straight to Mk II (which raises the limit).
 */
function levelOf(save: SaveData, item: Upgrade, ch: Chapter): number {
  const level = save.upgrades[item.id] ?? 0;
  if (item.id === 'heart' && ch === 2 && level < item.prices.length && save.maxHearts >= MAX_HEARTS) return item.prices.length;
  return level;
}

export interface UpgradeOffer {
  item: Upgrade;
  level: number;
  max: number;
  /** How many of the levels are the ship's (the rest are Mk II). */
  base: number;
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
  const upgrades = UPGRADES.filter((item) => ch === 2 || item.prices.length > 0).map((item) => {
    const level = levelOf(save, item, ch);
    const tiers = ch === 2 ? [...item.prices, ...item.mk2] : item.prices;
    return { item, level, max: tiers.length, base: item.prices.length, price: level < tiers.length ? tiers[level] : null };
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

/**
 * Raises an upgrade one level (bought or won in a vault), keeping max hearts in step with Heart
 * Plating. Returns false if it is already at this save's cap.
 */
export function levelUp(save: SaveData, id: UpgradeId, deck?: DeckId): boolean {
  const level = levelOf(save, upgrade(id), shopChapter(save, deck));
  if (level >= upgradeCap(id, save, deck)) return false;
  if (id === 'heart' && level < upgrade('heart').prices.length && save.maxHearts >= MAX_HEARTS) return false;
  save.upgrades[id] = level + 1;
  if (id === 'heart') save.maxHearts = Math.min(heartCap(save), save.maxHearts + 1);
  return true;
}

/** Buys the next level of an upgrade. Returns false if it is maxed or Jason can't afford it. */
export function buyUpgrade(save: SaveData, id: UpgradeId, deck?: DeckId): boolean {
  const offer = shopStock(save, deck).upgrades.find((o) => o.item.id === id);
  if (!offer || offer.price === null || save.bolts < offer.price) return false;
  const price = offer.price;
  if (!levelUp(save, id, deck)) return false;
  save.bolts -= price;
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
