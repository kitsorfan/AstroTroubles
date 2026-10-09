/**
 * How far and how high each hero can jump: the movement envelopes shared by the level checker
 * (`game/tools/reach.ts`) and by the hero who follows along (`follower.ts`), so a follower only ever
 * copies a move its own hero could make. Distances are centre-to-centre in cells.
 */
import { ATALANTA, BRENNUS, CELL, GRAVITY, MECH, PLAYER } from '../../core/constants';
import type { Ability } from '../../world/levelTypes';

/**
 * Horizontal distance is scaled by MARGIN (a safety margin for kids' thumbs); EDGE is how far the
 * take-off and landing spots can sit from the cell centres (world units).
 */
export const MARGIN = 0.9;
export const EDGE = 1.6;

/** Seconds in the air for a jump at `v` that lands `dh` higher (null if it can't get that high). */
export function flight(v: number, dh: number): number | null {
  const disc = v * v - 2 * GRAVITY * dh;
  if (disc < 0) return null;
  return (v + Math.sqrt(disc)) / GRAVITY;
}

/** Largest centre-to-centre distance (in cells) for one of Jason's jumps that ends `dh` higher. */
export function jumpReach(dh: number, abilities: Ability[], launch: number = PLAYER.jumpV): number {
  const has = (a: Ability) => abilities.includes(a);
  const speed = PLAYER.speed;
  const options: number[] = [];
  const apex1 = (launch * launch) / (2 * GRAVITY);
  const t1 = launch / GRAVITY;
  const dashBonus = has('dash') ? PLAYER.dashSpeed * PLAYER.dashTime - speed * PLAYER.dashTime : 0;

  // Single jump.
  if (dh <= apex1 - 0.3) {
    const t = flight(launch, dh);
    if (t !== null) options.push(speed * t + dashBonus);
    if (has('glide') && dh <= apex1 - 0.3) options.push(speed * (t1 + (apex1 - dh) / PLAYER.glideFall) + dashBonus);
  }
  // Double jump from the apex.
  if (has('doubleJump')) {
    const v2 = PLAYER.doubleJumpV;
    const apex2 = apex1 + (v2 * v2) / (2 * GRAVITY);
    if (dh <= apex2 - 0.3) {
      const t2 = flight(v2, dh - apex1);
      if (t2 !== null) options.push(speed * (t1 + t2) + dashBonus);
      if (has('glide')) options.push(speed * (t1 + v2 / GRAVITY + (apex2 - dh) / PLAYER.glideFall) + dashBonus);
    }
  }
  if (!options.length) return 0;
  const units = Math.max(...options) * MARGIN + EDGE;
  return Math.min(units / CELL, 9);
}

/** Highest rise for Jason from a launch speed (with the jet boots' double jump, if he has them). */
export function maxRise(abilities: Ability[], launch: number) {
  let apex = (launch * launch) / (2 * GRAVITY);
  if (abilities.includes('doubleJump')) apex += (PLAYER.doubleJumpV * PLAYER.doubleJumpV) / (2 * GRAVITY);
  return apex - 0.3;
}

/**
 * Largest centre-to-centre distance (in cells) for one of the mech's jumps that ends `dh` higher: its
 * one jump at walking speed, plus a THRUST in the air (which holds it up while the jets fire).
 */
export function mechReach(dh: number, launch: number = MECH.jumpV): number {
  if (dh > (launch * launch) / (2 * GRAVITY) - 0.3) return 0;
  const t = flight(launch, dh);
  if (t === null) return 0;
  const units = MECH.speed * t + (MECH.thrustSpeed - MECH.speed) * MECH.thrustTime;
  return Math.min((units * MARGIN + EDGE) / CELL, 9);
}

/**
 * Largest centre-to-centre distance (in cells) for one of Atalanta's jumps that ends `dh` higher:
 * her single jump at `speed` (a sprint after a run-up), plus a wall-jump off a wall she passes.
 */
export function atalantaReach(dh: number, speed: number, wallJump: boolean, launch: number = ATALANTA.jumpV): number {
  const options: number[] = [];
  const apex1 = (launch * launch) / (2 * GRAVITY);
  const t1 = launch / GRAVITY;
  if (dh <= apex1 - 0.3) {
    const t = flight(launch, dh);
    if (t !== null) options.push(speed * t);
  }
  if (wallJump) {
    const v2 = ATALANTA.wallJumpV;
    const apex2 = apex1 + (v2 * v2) / (2 * GRAVITY);
    if (dh <= apex2 - 0.3) {
      const t2 = flight(v2, dh - apex1);
      // After the kick she moves at her normal running speed, not a sprint.
      if (t2 !== null) options.push(Math.min(speed, ATALANTA.speed) * (t1 + t2));
    }
  }
  if (!options.length) return 0;
  return Math.min((Math.max(...options) * MARGIN + EDGE) / CELL, 9);
}

/** Highest rise for Atalanta from a launch speed (with a wall-jump when a wall is in reach). */
export function atalantaRise(launch: number, wallJump: boolean) {
  let apex = (launch * launch) / (2 * GRAVITY);
  if (wallJump) apex += (ATALANTA.wallJumpV * ATALANTA.wallJumpV) / (2 * GRAVITY);
  return apex - 0.3;
}

/**
 * Largest centre-to-centre distance (in cells) for one of General Brennus's jumps that ends `dh`
 * higher: his low jump at walking speed, or a charge-leap (a jump out of his CHARGE keeps its speed).
 */
export function brennusReach(dh: number, leap: boolean, launch: number = BRENNUS.jumpV): number {
  if (dh > (launch * launch) / (2 * GRAVITY) - 0.3) return 0;
  const t = flight(launch, dh);
  if (t === null) return 0;
  const speed = leap ? BRENNUS.leapSpeed : BRENNUS.speed;
  return Math.min((speed * t * MARGIN + EDGE) / CELL, 9);
}
