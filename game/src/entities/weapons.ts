/**
 * Jason's blasters. The Blaster is his from the start; on Gaia Nova PANDORA sells four more, and he
 * can switch between the ones he owns at any time (the weapon button, or X on a keyboard).
 *
 * Every weapon uses the same clip, reload and charge: tap BLAST to shoot, hold it for a charged shot.
 * Damage is the Blaster's (1 + Blaster Power) times the weapon's `power`.
 *
 * Plain data only (no three.js), so the shop and the tests can use it.
 */

export type WeaponId = 'blaster' | 'spread' | 'frost' | 'thunder' | 'seeker';

export interface Weapon {
  id: WeaponId;
  name: string;
  /** What PANDORA says about it in the shop. */
  desc: string;
  /** Shop price in bolts (0 = owned from the start). */
  price: number;
  /** Damage per shot, as a share of the Blaster's. */
  power: number;
  /** Shot speed (units per second) and how far shots fly, as a share of the Blaster's range. */
  speed: number;
  range: number;
  /** Time between shots, as a share of the Blaster's. */
  cooldown: number;
  /** Shot colours: the bright core and the glow around it. */
  core: string;
  glow: string;
  /** Pitch of the shot sound. */
  pitch: number;
}

export const WEAPONS: Record<WeaponId, Weapon> = {
  blaster: {
    id: 'blaster',
    name: 'Blaster',
    desc: 'Your trusty blaster. Hold BLAST for a fireball.',
    price: 0,
    power: 1,
    speed: 24,
    range: 1,
    cooldown: 1,
    core: '#bff4ff',
    glow: '#5ee0ff',
    pitch: 1,
  },
  spread: {
    id: 'spread',
    name: 'Spread Shot',
    desc: 'Three shots in a fan. Great against crowds!',
    price: 300,
    power: 0.6,
    speed: 22,
    range: 0.75,
    cooldown: 1.1,
    core: '#fff2b0',
    glow: '#ffb020',
    pitch: 0.8,
  },
  frost: {
    id: 'frost',
    name: 'Frost Ray',
    desc: 'Icy shots slow enemies. Charge it to freeze them!',
    price: 450,
    power: 0.8,
    speed: 22,
    range: 1,
    cooldown: 1,
    core: '#e8fbff',
    glow: '#7fd4ff',
    pitch: 1.35,
  },
  thunder: {
    id: 'thunder',
    name: 'Thunder Arc',
    desc: 'Lightning jumps on to two more enemies.',
    price: 600,
    power: 1,
    speed: 26,
    range: 0.9,
    cooldown: 1.15,
    core: '#fffbd0',
    glow: '#c58cff',
    pitch: 1.15,
  },
  seeker: {
    id: 'seeker',
    name: 'Seeker',
    desc: 'Slow shots that chase enemies for you.',
    price: 750,
    power: 1,
    speed: 14,
    range: 1.25,
    cooldown: 1.2,
    core: '#ffd0e0',
    glow: '#ff4f8a',
    pitch: 0.7,
  },
};

/** Shop and switching order. */
export const WEAPON_ORDER: WeaponId[] = ['blaster', 'spread', 'frost', 'thunder', 'seeker'];

/** Frost Ray: how long a shot chills an enemy (and how much it slows it), and how long a charged shot freezes it. */
export const FROST = { chill: 3, slow: 0.5, freeze: 2, bossChill: 1.2, bossSlow: 0.75 };

/** Thunder Arc: how many more enemies the lightning jumps to, how far, and how hard it hits them (share of the shot). */
export const THUNDER = { jumps: 2, chargedJumps: 4, range: 6.5, power: 0.6 };

/** Seeker: how fast its shots turn (radians per second), and how wide it looks for a target. */
export const SEEKER = { turn: 5, cone: 1.3 };

/** Spread Shot: the angle between its shots (radians). */
export const SPREAD = { angle: 0.24 };

export function isWeapon(id: string): id is WeaponId {
  return (WEAPON_ORDER as string[]).includes(id);
}

/** The weapons a save owns, in switching order (the Blaster is always there). */
export function ownedWeapons(owned: readonly string[] | undefined): WeaponId[] {
  return WEAPON_ORDER.filter((w) => w === 'blaster' || (owned ?? []).includes(w));
}

/** The next owned weapon after `current`, wrapping round to the Blaster. */
export function nextWeapon(owned: readonly string[] | undefined, current: string | undefined): WeaponId {
  const list = ownedWeapons(owned);
  const i = list.indexOf(current as WeaponId);
  return list[(i + 1) % list.length];
}

/** The equipped weapon, falling back to the Blaster if the save names one it doesn't own. */
export function equippedWeapon(owned: readonly string[] | undefined, current: string | undefined): WeaponId {
  const list = ownedWeapons(owned);
  return list.includes(current as WeaponId) ? (current as WeaponId) : 'blaster';
}
