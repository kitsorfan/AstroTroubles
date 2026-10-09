import type { TideDef } from './levelTypes';

/**
 * The tide's clock and rules (Scylla's Reef), kept free of three.js so the reachability checker and
 * the tests can use them. The sea itself (the water, the gauge, rafts) is in `entities/reef/tide.ts`.
 */

/** How deep the sea can get over a floor before it sweeps a hero off it. */
export const FLOOD = 0.35;
/** Seconds of warning (the gauge blinks, LUX shouts) before the tide starts coming in. */
export const TIDE_WARN = 4;

export type TidePhase = 'low' | 'rising' | 'high' | 'falling';

const smooth = (k: number) => k * k * (3 - 2 * k);

/** Total length of one tide cycle, in seconds. */
export const tidePeriod = (def: TideDef) => def.phases.reduce((a, b) => a + b, 0);

/** Where in the cycle the sea is at time `t`: the phase, how far through it (0..1) and the seconds left in it. */
export function tidePhase(def: TideDef, t: number): { phase: TidePhase; k: number; left: number } {
  const names: TidePhase[] = ['low', 'rising', 'high', 'falling'];
  let x = ((t % tidePeriod(def)) + tidePeriod(def)) % tidePeriod(def);
  for (let i = 0; i < 4; i++) {
    const len = def.phases[i];
    if (x < len) return { phase: names[i], k: x / len, left: len - x };
    x -= len;
  }
  return { phase: 'low', k: 0, left: def.phases[0] };
}

/** The sea's height at time `t`. */
export function tideLevel(def: TideDef, t: number): number {
  const { phase, k } = tidePhase(def, t);
  const span = def.high - def.low;
  if (phase === 'low') return def.low;
  if (phase === 'high') return def.high;
  return phase === 'rising' ? def.low + span * smooth(k) : def.high - span * smooth(k);
}

/** True if a floor this high ever goes under water. */
export const isTidal = (def: TideDef, h: number) => h < def.high - FLOOD;

/** What the HUD's tide gauge shows. */
export interface TideGauge {
  /** Sea level from 0 (low tide) to 1 (high tide). */
  fill: number;
  phase: TidePhase;
  /** The tide is about to come in. */
  warn: boolean;
  /** Whole seconds until the tide turns. */
  secs: number;
}

/** How high a raft's deck sits above the sand it rests on at low tide. */
export const RAFT_TOP = 0.3;
