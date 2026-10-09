import type { HeroId } from '../../world/levelTypes';

/**
 * The Garden of Colchis's rules as plain data (no three.js, so the tests can read them): the four
 * lullaby pylons around the Sleepless Dragon's lawn, and the weeder drones' timings.
 *
 * Each pylon is one word of the Gardeners' lullaby and needs one hero's skill to light: SKY a power
 * arrow (Atalanta), GROW a ground pound (Jason), HOME a touch up on a hedge shelf only Atalanta's
 * wall-jump reaches, FRIEND a touch on a crystal column only Jason's grapple reaches. `text` is the
 * hint for a hero who tries the wrong thing.
 */
export type PylonKind = 'sky' | 'grow' | 'home' | 'friend';

export const PYLON_KINDS: PylonKind[] = ['sky', 'grow', 'home', 'friend'];

export const PYLONS: Record<PylonKind, { word: string; color: string; hero: HeroId; how: 'arrow' | 'pound' | 'touch'; text: string }> = {
  sky: { word: 'SKY', color: '#5ec8ff', hero: 'atalanta', how: 'arrow', text: 'The SKY pylon only wakes up for a POWER ARROW. Switch to Atalanta and HOLD the BOW button!' },
  grow: { word: 'GROW', color: '#ff6fcf', hero: 'jason', how: 'pound', text: 'The GROW pylon wants a GROUND POUND on its stone. Switch to Jason: jump, then pound!' },
  home: { word: 'HOME', color: '#7dff9a', hero: 'atalanta', how: 'touch', text: '' },
  friend: { word: 'FRIEND', color: '#ffe066', hero: 'jason', how: 'touch', text: '' },
};

/** Weeder drones: health, hover height, how far they keep from the hero, and the spray's warning, rest and splash timings. */
export const WEEDER_TUNING = {
  hp: 2,
  hover: 2.6,
  keep: 4.5,
  warn: 0.8,
  rest: 2.6,
  splash: 1.15,
  radius: 1.5,
};
