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
  poundSpeed: 26,
  glideFall: 2.2,
  bounceV: 19,
  ventV: 17,
  invuln: 1.4,
  knockback: 9,
  shootCooldown: 0.24,
  shotSpeed: 24,
  shotRange: 22,
  spinTime: 0.4,
  spinRadius: 2.1,
  aimRange: 15,
  magnetRange: 3.2,
};

export const START_HEARTS = 5;
export const MAX_HEARTS = 10;
