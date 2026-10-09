/**
 * Talos's Forge tuning, kept free of three.js so the tests can read it: the anvil drones and TALOS.
 */

/** The anvil drone (see `anvil.ts`). */
export const ANVIL_TUNING = {
  hp: 3,
  /** Height above the hero while it carries the anvil, and how fast it follows. */
  hover: 5.5,
  follow: 1.4,
  /** Seconds between drops, the red-circle warning, and the circle's radius. */
  rest: 2.6,
  warn: 1.1,
  radius: 1.5,
  /** Seconds the anvil sits on the ground before the drone swoops down for it, and how low it comes. */
  lie: 1.3,
  fetch: 1.6,
  low: 1.3,
};

/** The fight's numbers, per round (he gets a little quicker after each pull). */
export const TALOS_TUNING = {
  rounds: 3,
  plates: 3,
  /** Health: one per ankle plate, two per pull of the plug. */
  plugDamage: 2,
  /** Seconds the stomp is telegraphed (red circle), the foot stays stuck, and he kneels with the plug out. */
  raise: [1.4, 1.2, 1.05],
  stuck: [4.2, 3.8, 3.4],
  kneel: 8,
  /** The red circle under the stomping foot, and the hammer's strip (length and half-width). */
  stompRadius: 2.1,
  hammerLength: 10,
  hammerHalf: 1.3,
  walkSpeed: [2.4, 2.8, 3.2],
  /** How far from the arena's middle he walks his rounds. */
  orbit: 7,
};
