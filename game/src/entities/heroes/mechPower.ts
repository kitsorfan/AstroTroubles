/**
 * The bronze mech's STRENGTH (Talos's Forge), its stand-in for hearts while the heroes ride it. Pure
 * numbers (no three.js), so the tests can drive it:
 *
 * - A hit drains a slice of strength (a hero would lose a whole heart); lava drains a bigger slice.
 * - A while after the last hit, strength slowly comes back.
 * - At 0 the mech overheats: the heroes hop out and it cools down for `MECH.cool` seconds, filling back
 *   up as it cools. Until it has cooled it can't be boarded.
 */
import { MECH } from '../../core/constants';

export interface MechPower {
  /** 0..MECH.strength. */
  strength: number;
  /** Seconds since the last hit. */
  sinceHit: number;
  /** Seconds of cooling left after overheating (0: cool, ready to board). */
  cool: number;
}

export const freshPower = (): MechPower => ({ strength: MECH.strength, sinceHit: 99, cool: 0 });

/** What one hit costs: `n` hearts' worth of an enemy attack, or a touch of lava. */
export function hitCost(n: number, hazard: boolean): number {
  return hazard ? MECH.hazardCost : Math.max(1, n) * MECH.hitCost;
}

/** A hit: strength drains (never below 0) and the regeneration waits again. */
export function drain(s: MechPower, n: number, hazard = false): MechPower {
  return { ...s, strength: Math.max(0, s.strength - hitCost(n, hazard)), sinceHit: 0 };
}

/** Out of strength: it has to cool down before it works again. */
export const spent = (s: MechPower) => s.strength <= 0;

/** Starts the cool-down after overheating. */
export function overheat(s: MechPower): MechPower {
  return { ...s, strength: 0, cool: MECH.cool };
}

/**
 * One step of `dt` seconds. Cooling down, strength fills back up in step with the cooling (full the moment
 * it is ready). Otherwise strength comes back slowly once no hit has landed for a while (parked or not).
 */
export function stepPower(s: MechPower, dt: number): MechPower {
  const sinceHit = s.sinceHit + dt;
  if (s.cool > 0) {
    const cool = Math.max(0, s.cool - dt);
    return { strength: MECH.strength * (1 - cool / MECH.cool), sinceHit, cool };
  }
  if (sinceHit < MECH.regenDelay || s.strength >= MECH.strength) return { ...s, sinceHit };
  return { ...s, sinceHit, strength: Math.min(MECH.strength, s.strength + MECH.regen * dt) };
}

/** 0..1 through the cool-down (1: cool again). */
export const coolProgress = (s: MechPower) => (s.cool > 0 ? 1 - s.cool / MECH.cool : 1);
