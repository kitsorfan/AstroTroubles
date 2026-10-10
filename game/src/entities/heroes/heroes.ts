/**
 * The hero table and the rules for switching between heroes. Pure data and functions (no three.js),
 * so the reachability checker and the tests can use them too.
 *
 * Adding a hero: give it a row in HEROES (its moves, speed and button names), a model, and a moveset
 * that `Player` hands control to while it is the active hero (see `heroes/atalanta.ts`). Levels list
 * the heroes they allow in `LevelDef.heroes`.
 */
import { ATALANTA, BRENNUS, MECH, PLAYER } from '../../core/constants';
import type { HeroId, Speaker } from '../../world/levelTypes';

/**
 * Everything a hero can do. Jason's first four also need the matching ability (found on the ship and
 * on Gaia Nova); the others come with the hero.
 */
export type HeroMove =
  /* Jason */
  | 'doubleJump'
  | 'glide'
  | 'dash'
  | 'grapple'
  | 'pound'
  | 'weapons'
  | 'spin'
  /* Atalanta */
  | 'sprint'
  | 'wallJump'
  | 'wallRun'
  | 'climb'
  | 'slide'
  | 'bow'
  | 'kick'
  /* Brennus: SHIELD, CANNON, his CHARGE (it smashes cracked walls and crates), the STOMP, and COMMAND at Legion posts */
  | 'shield'
  | 'cannon'
  | 'smash'
  | 'stomp'
  | 'command'
  /* The bronze mech (Talos's Forge): its PUNCH breaks bronze gates, its SLAM cracked floors, its THRUST crosses gaps (plus a flamethrower) */
  | 'punch'
  | 'slam'
  | 'thrust'
  | 'flame';

export interface HeroDef {
  id: HeroId;
  /**
   * A vehicle the other heroes climb into (the bronze mech): once it joins (see `LevelDef.joins`) it is the
   * only hero in the roster, with the others riding inside. Until then it stands parked at the marker
   * named after it, and later the heroes can climb out and leave it parked again (see `parkedFlag`).
   */
  vehicle?: boolean;
  /** Speaker key for the hero's portrait and name. */
  speaker: Speaker;
  /** The hero's colour (switch button ring, flashes). */
  color: string;
  /** False until the hero's moveset is in the game: such a hero is left out of every roster. */
  playable: boolean;
  /** Running speed and jump strength (world units per second). */
  speed: number;
  jumpV: number;
  /** Body height while standing. */
  height: number;
  /** What the BLAST, SPIN and DASH buttons do for this hero (button labels). */
  buttons: { shoot: string; spin: string; dash: string };
  moves: readonly HeroMove[];
}

export const HEROES: Record<HeroId, HeroDef> = {
  jason: {
    id: 'jason',
    speaker: 'jason',
    color: '#ff8a3d',
    playable: true,
    speed: PLAYER.speed,
    jumpV: PLAYER.jumpV,
    height: PLAYER.height,
    buttons: { shoot: 'BLAST', spin: 'SPIN', dash: 'DASH' },
    moves: ['doubleJump', 'glide', 'dash', 'grapple', 'pound', 'weapons', 'spin'],
  },
  atalanta: {
    id: 'atalanta',
    speaker: 'atalanta',
    color: '#2fb7a3',
    playable: true,
    speed: ATALANTA.speed,
    jumpV: ATALANTA.jumpV,
    height: PLAYER.height,
    buttons: { shoot: 'BOW', spin: 'KICK', dash: 'SLIDE' },
    moves: ['sprint', 'wallJump', 'wallRun', 'climb', 'slide', 'bow', 'kick'],
  },
  // Slow and strong, on his own levels (see `heroes/brennus.ts`): a cannon, a shield, a smashing charge,
  // a heavy stomp, and his old Legion robots obey him at command posts.
  brennus: {
    id: 'brennus',
    speaker: 'brennus',
    color: '#8a1a22',
    playable: true,
    speed: BRENNUS.speed,
    jumpV: BRENNUS.jumpV,
    height: BRENNUS.height,
    buttons: { shoot: 'CANNON', spin: 'SHIELD', dash: 'CHARGE' },
    moves: ['cannon', 'shield', 'smash', 'stomp', 'command'],
  },
  // The Gardeners' bronze mech suit (see `heroes/mech.ts`): Jason at the controls, Atalanta on its shoulder.
  mech: {
    id: 'mech',
    speaker: 'jason',
    color: '#d89a3a',
    playable: true,
    vehicle: true,
    speed: MECH.speed,
    jumpV: MECH.jumpV,
    height: MECH.height,
    buttons: { shoot: 'FLAME', spin: 'PUNCH', dash: 'THRUST' },
    moves: ['flame', 'punch', 'slam', 'thrust'],
  },
};

export const HERO_IDS = Object.keys(HEROES) as HeroId[];

export const heroCan = (id: HeroId, move: HeroMove) => HEROES[id].moves.includes(move);

/**
 * Developer overrides from the browser hash (`&heroes=jason,atalanta`, `&hero=atalanta`), set by
 * the game before a deck starts. Never used in the app.
 */
export const heroDev: { heroes?: HeroId[]; hero?: HeroId; course?: boolean } = {};

/** Reads a comma-separated hero list, dropping anything that isn't a hero. */
export function parseHeroes(list: string | null | undefined): HeroId[] {
  return (list ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is HeroId => (HERO_IDS as string[]).includes(s));
}

/**
 * The heroes the player can use on a level, the starting one first: the level's list (default just
 * Jason), or the developer's list, plus the developer's starting hero. Unplayable heroes and repeats
 * are dropped; there is always at least Jason.
 */
export function heroRoster(level?: readonly HeroId[], dev: { heroes?: HeroId[]; hero?: HeroId } = {}): HeroId[] {
  const base = dev.heroes?.length ? dev.heroes : level?.length ? level : ['jason' as HeroId];
  const list = dev.hero ? [dev.hero, ...base] : [...base];
  const out = list.filter((h, i) => HEROES[h]?.playable && list.indexOf(h) === i);
  return out.length ? out : ['jason'];
}

/**
 * Who can play right now, from the level's cast and who has joined: heroes still waiting to join are
 * left out, and once a vehicle hero (the bronze mech) has joined it is the only one, because everyone
 * else rides inside it.
 */
export function joinedRoster(cast: readonly HeroId[], joined: (h: HeroId) => boolean): HeroId[] {
  const list = cast.filter(joined);
  const ride = list.find((h) => HEROES[h].vehicle);
  return ride ? [ride] : list;
}

/**
 * The story flag set while everyone has climbed out of a vehicle hero (the bronze mech) and left it
 * parked: the roster is the heroes on foot again until they climb back in. A checkpoint reload clears it
 * (everyone starts back aboard).
 */
export const parkedFlag = (vehicle: HeroId) => `parked:${vehicle}`;

/** The hero a switch changes to (the next one in the roster), or null when there is nobody to switch to. */
export function nextHero(roster: readonly HeroId[], current: HeroId): HeroId | null {
  if (roster.length < 2) return null;
  const i = roster.indexOf(current);
  return roster[(i + 1) % roster.length];
}

/** What the switch rules look at. */
/**
 * A special move that got the playing hero from one footprint to the next (see `Player.landMoves`):
 * Jason's double jump, air dash, glide and grapple, Atalanta's wall-jump, wall-run, climb and crawl,
 * General Brennus's charge-leap, and a bounce pad or updraft (`launch`) that throws anyone.
 */
export type TrailMove = 'double' | 'dash' | 'glide' | 'grapple' | 'launch' | 'walljump' | 'wallrun' | 'climb' | 'crawl' | 'leap';

const TRAIL_MOVE: Record<TrailMove, HeroMove | null> = {
  double: 'doubleJump',
  dash: 'dash',
  glide: 'glide',
  grapple: 'grapple',
  launch: null,
  walljump: 'wallJump',
  wallrun: 'wallRun',
  climb: 'climb',
  crawl: 'slide',
  leap: 'smash',
};

/**
 * True if `hero` can copy a footprint reached with `moves` (a bounce pad works for anyone). Moves
 * like the double jump also need the hero's matching ability (`has`).
 */
export function canCopy(hero: HeroId, moves: Iterable<TrailMove>, has: (m: HeroMove) => boolean = () => true): boolean {
  for (const m of moves) {
    const need = TRAIL_MOVE[m];
    if (need && (!HEROES[hero].moves.includes(need) || !has(need))) return false;
  }
  return true;
}

export interface SwitchState {
  roster: readonly HeroId[];
  current: HeroId;
  /** Seconds left on the switch cooldown. */
  cooldown: number;
  grounded: boolean;
  /** In a cutscene, knocked down, or a menu is open. */
  locked: boolean;
  /** In the middle of a move that can't be cut short (a dash, slide, zip, pound or wall-run). */
  busy: boolean;
  /** Under a low ceiling where a standing hero wouldn't fit. */
  cramped: boolean;
}

export type SwitchBlock = 'alone' | 'locked' | 'cooldown' | 'air' | 'busy' | 'cramped';

/**
 * Why a switch can't happen right now, or null if it can. Switching only happens on the ground, so
 * the reachability checker can treat every floor spot as a place where either hero can carry on.
 */
export function switchBlock(s: SwitchState): SwitchBlock | null {
  if (!nextHero(s.roster, s.current)) return 'alone';
  if (s.locked) return 'locked';
  if (s.busy) return 'busy';
  if (!s.grounded) return 'air';
  if (s.cramped) return 'cramped';
  if (s.cooldown > 0) return 'cooldown';
  return null;
}
