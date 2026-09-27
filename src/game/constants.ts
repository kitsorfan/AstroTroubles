import type { DeckId, ModuleId } from './types';

export const SAVE_VERSION = 1;

export const START_MINUTES = 72 * 60;
export const STEP_MINUTES = 1;
export const SCAN_MINUTES = 5;
export const SCAN_RADIUS = 7;
export const ELEVATOR_MINUTES = 30;
export const BATTLE_BASE_MINUTES = 8;
export const BATTLE_ROUND_MINUTES = 2;
export const FLEE_MINUTES = 10;
export const MAINT_HACK_MINUTES = 10;
export const SECURITY_HACK_MINUTES = 20;
export const BLOOM_BURN_MINUTES = 10;

/** Every N steps on an unsealed leaking deck costs 1 HP (never below 1). */
export const O2_STEPS_PER_HP = 3;
/** Fraction of max HP lost when stepping onto an active heat vent. */
export const VENT_DAMAGE = 0.07;

export const LOW_TIME_MINUTES = 12 * 60;
export const CRITICAL_TIME_MINUTES = 4 * 60;

export const MAX_LEVEL = 10;
/** Cumulative XP needed to reach each level (index = level). */
export const XP_TABLE = [0, 0, 30, 90, 180, 320, 520, 800, 1150, 1600, 2150];

export const DECK_ORDER: DeckId[] = ['cryo', 'hydro', 'engine', 'habitat', 'security', 'bridge'];

export function kaiMaxHp(level: number): number {
  return 40 + 10 * (level - 1);
}

export function kaiAtk(level: number): number {
  return 4 + 2 * (level - 1);
}

export function kaiDef(level: number): number {
  return Math.floor((level - 1) * 0.8);
}

export function boltMaxHp(level: number, modules: readonly ModuleId[]): number {
  return 30 + 4 * (level - 1) + (modules.includes('plating') ? 25 : 0);
}

export function boltMaxEnergy(modules: readonly ModuleId[]): number {
  return 5 + (modules.includes('capacitor') ? 2 : 0);
}

export function boltZapPower(level: number, modules: readonly ModuleId[]): number {
  const base = 4 + Math.round(level * 1.5);
  return modules.includes('overcharge') ? Math.round(base * 1.8) : base;
}

export function levelForXp(xp: number): number {
  let level = 1;
  for (let l = 2; l <= MAX_LEVEL; l++) {
    if (xp >= XP_TABLE[l]) level = l;
  }
  return level;
}

export function formatClock(minutes: number): string {
  const m = Math.max(0, Math.floor(minutes));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}
