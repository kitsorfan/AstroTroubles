import { CELL, GRAVITY, MAX_FALL, STEP_UP } from '../core/constants';
import { Grid } from './grid';
import type { TileKind } from './levelTypes';

/** A dynamic axis-aligned box: platforms, crates, doors, boss parts. */
export interface Box {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  bottom: number;
  top: number;
  solid: boolean;
  /** Movement since the previous frame, used to carry whatever stands on it. */
  dx: number;
  dy: number;
  dz: number;
  owner?: unknown;
}

export interface Ground {
  kind: TileKind | 'box';
  box?: Box;
  cx: number;
  cz: number;
}

export interface Body {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  r: number;
  h: number;
  grounded: boolean;
  ground: Ground | null;
  /** Set when a sideways collision happened this step. */
  bumped: boolean;
}

export function makeBody(x: number, y: number, z: number, r: number, h: number): Body {
  return { x, y, z, vx: 0, vy: 0, vz: 0, r, h, grounded: false, ground: null, bumped: false };
}

interface MoveOpts {
  gravity?: number;
  maxFall?: number;
  stepUp?: number;
  /** Radius used for standing checks; smaller than r so you can stand over edges. */
  footR?: number;
  noGravity?: boolean;
}

function pushOutOfRect(b: Body, minX: number, maxX: number, minZ: number, maxZ: number): boolean {
  const px = Math.max(minX, Math.min(b.x, maxX));
  const pz = Math.max(minZ, Math.min(b.z, maxZ));
  let dx = b.x - px;
  let dz = b.z - pz;
  const d2 = dx * dx + dz * dz;
  if (d2 >= b.r * b.r) return false;
  let d = Math.sqrt(d2);
  if (d < 1e-5) {
    // Centre is inside the rectangle: leave along the shallowest side.
    const left = b.x - minX;
    const right = maxX - b.x;
    const up = b.z - minZ;
    const down = maxZ - b.z;
    const m = Math.min(left, right, up, down);
    if (m === left) {
      dx = -1;
      dz = 0;
    } else if (m === right) {
      dx = 1;
      dz = 0;
    } else if (m === up) {
      dx = 0;
      dz = -1;
    } else {
      dx = 0;
      dz = 1;
    }
    d = 1;
    const target = m + b.r;
    b.x += dx * target;
    b.z += dz * target;
  } else {
    const push = b.r - d;
    dx /= d;
    dz /= d;
    b.x += dx * push;
    b.z += dz * push;
  }
  const vn = b.vx * dx + b.vz * dz;
  if (vn < 0) {
    b.vx -= vn * dx;
    b.vz -= vn * dz;
  }
  return true;
}

function circleHitsRect(x: number, z: number, r: number, minX: number, maxX: number, minZ: number, maxZ: number) {
  const px = Math.max(minX, Math.min(x, maxX));
  const pz = Math.max(minZ, Math.min(z, maxZ));
  return (x - px) ** 2 + (z - pz) ** 2 < r * r;
}

function resolveSideways(b: Body, grid: Grid, boxes: readonly Box[], stepUp: number) {
  for (let iter = 0; iter < 3; iter++) {
    let hit = false;
    const c0x = Grid.toCell(b.x - b.r);
    const c1x = Grid.toCell(b.x + b.r);
    const c0z = Grid.toCell(b.z - b.r);
    const c1z = Grid.toCell(b.z + b.r);
    for (let cz = c0z; cz <= c1z; cz++) {
      for (let cx = c0x; cx <= c1x; cx++) {
        if (grid.obstacleTop(cx, cz) > b.y + stepUp) {
          if (pushOutOfRect(b, cx * CELL, cx * CELL + CELL, cz * CELL, cz * CELL + CELL)) hit = true;
        }
      }
    }
    for (const box of boxes) {
      if (!box.solid) continue;
      if (box.top <= b.y + stepUp || box.bottom >= b.y + b.h) continue;
      if (pushOutOfRect(b, box.minX, box.maxX, box.minZ, box.maxZ)) hit = true;
    }
    if (!hit) break;
    b.bumped = true;
  }
}

/** Moves a body through the grid and boxes with gravity, wall sliding and landing. */
export function moveBody(b: Body, dt: number, grid: Grid, boxes: readonly Box[], opts: MoveOpts = {}) {
  const stepUp = opts.stepUp ?? STEP_UP;
  const footR = opts.footR ?? b.r * 0.72;
  const wasGrounded = b.grounded;
  b.bumped = false;

  const speed = Math.hypot(b.vx, b.vz);
  const steps = Math.max(1, Math.ceil((speed * dt) / (b.r * 0.6)));
  const sdt = dt / steps;
  for (let i = 0; i < steps; i++) {
    b.x += b.vx * sdt;
    b.z += b.vz * sdt;
    resolveSideways(b, grid, boxes, stepUp);
  }

  if (!opts.noGravity) b.vy = Math.max(b.vy - (opts.gravity ?? GRAVITY) * dt, -(opts.maxFall ?? MAX_FALL));
  const newY = b.y + b.vy * dt;

  let groundTop = -Infinity;
  let ground: Ground | null = null;
  const c0x = Grid.toCell(b.x - footR);
  const c1x = Grid.toCell(b.x + footR);
  const c0z = Grid.toCell(b.z - footR);
  const c1z = Grid.toCell(b.z + footR);
  for (let cz = c0z; cz <= c1z; cz++) {
    for (let cx = c0x; cx <= c1x; cx++) {
      const top = grid.standTop(cx, cz);
      if (top === -Infinity || top > b.y + stepUp || top <= groundTop) continue;
      if (!circleHitsRect(b.x, b.z, footR, cx * CELL, cx * CELL + CELL, cz * CELL, cz * CELL + CELL)) continue;
      groundTop = top;
      ground = { kind: grid.cell(cx, cz).kind, cx, cz };
    }
  }
  for (const box of boxes) {
    if (!box.solid) continue;
    const top = box.top;
    if (top > b.y + stepUp + Math.max(0, box.dy) || top <= groundTop) continue;
    if (!circleHitsRect(b.x, b.z, footR, box.minX, box.maxX, box.minZ, box.maxZ)) continue;
    groundTop = top;
    ground = { kind: 'box', box, cx: Grid.toCell(b.x), cz: Grid.toCell(b.z) };
  }

  if (b.vy <= 0 && (newY <= groundTop || (wasGrounded && groundTop > newY - stepUp && groundTop <= b.y + stepUp))) {
    b.y = groundTop;
    b.vy = 0;
    b.grounded = true;
    b.ground = ground;
  } else {
    b.y = newY;
    b.grounded = false;
    b.ground = null;
    if (b.vy > 0) {
      for (const box of boxes) {
        if (!box.solid || box.bottom < b.y + b.h - b.vy * dt - 0.01) continue;
        if (b.y + b.h > box.bottom && circleHitsRect(b.x, b.z, footR, box.minX, box.maxX, box.minZ, box.maxZ)) {
          b.y = box.bottom - b.h;
          b.vy = 0;
        }
      }
    }
  }
}

/** True if a point is inside solid geometry (walls, raised floors, solid boxes). */
export function pointBlocked(grid: Grid, boxes: readonly Box[], x: number, y: number, z: number): boolean {
  const cx = Grid.toCell(x);
  const cz = Grid.toCell(z);
  const c = grid.cell(cx, cz);
  if (c.kind === 'wall') return true;
  if (c.kind !== 'void' && y < c.h) return true;
  for (const box of boxes) {
    if (box.solid && x > box.minX && x < box.maxX && z > box.minZ && z < box.maxZ && y > box.bottom && y < box.top) return true;
  }
  return false;
}
