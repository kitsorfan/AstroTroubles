/** World units per grid cell. */
export const CELL = 2;
/** Height of one floor step ('1' in a map = 0.5 units). */
export const STEP_H = 0.5;
/** How high a wall is drawn above the tallest neighbouring floor. */
export const WALL_H = 3.2;
/** Floors are drawn as columns reaching down to this depth. */
export const FLOOR_BOTTOM = -6;
/** Anything that falls below this is lost in the void. */
export const DEATH_Y = -12;

export const GRAVITY = 32;
export const MAX_FALL = 28;
/** Highest ledge you can walk onto without jumping. */
export const STEP_UP = 0.6;

export const PLAYER = {
  radius: 0.42,
  height: 1.7,
  speed: 7,
  accel: 38,
  airAccel: 22,
  iceAccel: 7,
  jumpV: 11.5,
  doubleJumpV: 10.5,
  jumpCut: 0.45,
  coyote: 0.12,
  jumpBuffer: 0.14,
  dashSpeed: 17,
  dashTime: 0.2,
  dashCooldown: 0.55,
  /** Dashes run on energy: one cell per dash, refilled at checkpoints and by energy pickups. */
  dashEnergy: 3,
  /** Ramming an enemy with a dash hits this hard (plus Blaster Power). */
  dashDamage: 3,
  dashHitRadius: 1.25,
  poundSpeed: 26,
  glideFall: 2.2,
  bounceV: 19,
  ventV: 17,
  invuln: 1.4,
  knockback: 9,
  shootCooldown: 0.3,
  /** A tap that lands during the cooldown is remembered this long, so quick tapping never drops shots. */
  shootBuffer: 0.25,
  /** Seconds BLAST must be held before it starts charging a fireball. */
  chargeDelay: 0.22,
  /** Shots per clip, reload time, and the charged fireball (hold BLAST). */
  clip: 6,
  reloadTime: 1.5,
  chargeTime: 0.8,
  fireballCost: 3,
  fireballSpeed: 17,
  shotSpeed: 24,
  shotRange: 22,
  spinTime: 0.4,
  spinRadius: 2.1,
  /**
   * Spins in a row before the long recharge. A spin also guards Jason: enemy attacks bounce off it
   * (hazards like lasers and lava still hurt).
   */
  spinCharges: 3,
  /** Seconds to recharge every spin once they are all used up (a partly used set recharges in proportion). */
  spinReload: 7,
  /** Seconds without spinning before a partly used set starts recharging. */
  spinTopUp: 3.5,
  aimRange: 12,
  magnetRange: 3.2,
};

export const START_HEARTS = 5;
export const MAX_HEARTS = 10;

/** LUX's force pulse: a shockwave that hits everything around Jason and overloads lasers, then recharges slowly. */
export const PULSE = {
  /** Enemies this close are hit, stunned and thrown back; enemy shots this close are wiped out. */
  radius: 8,
  /** Plus 2 for every LUX Zapper upgrade. */
  damage: 4,
  stun: 2.4,
  cooldown: 16,
  /** Laser emitters and zap floors this close short out for `overloadTime` seconds. */
  overloadRadius: 12,
  overloadTime: 6,
};

/** The grapple hook (found in the Glass Desert): zips Jason to a glowing anchor ring. */
export const GRAPPLE = {
  /** Farthest anchor Jason can reach, in cells (straight line). */
  range: 8,
  /** How much higher (or lower) than Jason an anchor may be, in world units. */
  rise: 7,
  /** Seconds for the zip: a base plus a little per unit of distance. */
  time: 0.32,
  timePerUnit: 0.022,
};

/** Wind, quicksand and rolling boulders on Gaia Nova. */
export const OUTDOOR = {
  /** Default push of a gust, in units per second (Jason runs at 7). */
  wind: 5,
  /** Seconds a gust blows, and how long it warns before it starts. */
  gust: 1.6,
  gustWarn: 0.7,
  /** How fast Jason wades through quicksand, and how long he can stand still in it before he sinks. */
  sandSpeed: 0.45,
  sinkTime: 2.6,
  /** Rolling boulders: speed (units per second) and how close they must be to knock Jason over. */
  boulderSpeed: 7,
  boulderRadius: 1.15,
};
