import { ATALANTA, PLAYER } from '../../core/constants';
import type { AtalantaUpgradeId } from '../../core/save';

/**
 * Atalanta's numbers with her shop upgrades (chapter 3) applied. Her moves read these instead of the
 * bare `ATALANTA` constants, so the level checker (which uses the constants) always plans for an
 * Atalanta with no upgrades: upgrades only ever make things easier.
 *
 * - Hunter's Bow: quick arrows +0.5 damage and power arrows +1 per level.
 * - Quick Draw: the power arrow charges 20% faster per level, and both arrows come back sooner.
 * - Wind Sandals: a faster sprint that starts sooner (so longer running jumps), and a little more run speed.
 * - Climber's Gloves: +1.5 seconds of grip per level, and she climbs a little faster.
 * - Iron Kick: +1 kick damage per level, and a wider kick.
 * - Triple Arrow: the power arrow looses two more beside it, in a fan.
 */
export interface AtalantaStats {
  speed: number;
  sprintSpeed: number;
  sprintBuild: number;
  climbGrip: number;
  climbSpeed: number;
  chargeTime: number;
  /** Seconds between quick arrows (before Quick Reload) and after a power arrow. */
  arrowCooldown: number;
  powerCooldown: number;
  /** Extra damage on top of the Blaster Power bonus. */
  arrowDamage: number;
  powerDamage: number;
  kickDamage: number;
  kickRadius: number;
  triple: boolean;
}

export function atalantaStats(ups: Partial<Record<AtalantaUpgradeId, number>> | undefined): AtalantaStats {
  const lv = (id: AtalantaUpgradeId) => Math.max(0, ups?.[id] ?? 0);
  return {
    speed: ATALANTA.speed + lv('sandals') * 0.3,
    sprintSpeed: ATALANTA.sprintSpeed + lv('sandals') * 0.8,
    sprintBuild: ATALANTA.sprintBuild * Math.max(0.3, 1 - lv('sandals') * 0.3),
    climbGrip: ATALANTA.climbGrip + lv('gloves') * 1.5,
    climbSpeed: ATALANTA.climbSpeed * (1 + lv('gloves') * 0.12),
    chargeTime: ATALANTA.chargeTime * Math.max(0.3, 1 - lv('draw') * 0.2),
    arrowCooldown: ATALANTA.arrowCooldown * Math.max(0.5, 1 - lv('draw') * 0.15),
    powerCooldown: 0.4 * Math.max(0.4, 1 - lv('draw') * 0.25),
    arrowDamage: lv('bow') * 0.5,
    powerDamage: lv('bow'),
    kickDamage: lv('kick'),
    kickRadius: PLAYER.spinRadius * (1 + lv('kick') * 0.15),
    triple: lv('triple') > 0,
  };
}
