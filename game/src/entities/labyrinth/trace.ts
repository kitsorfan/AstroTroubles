/**
 * The rules of MEDUSA's gaze beams (Medusa's Labyrinth, chapter 3), with no three.js, so the tests
 * can check them: straight beams that bounce off Gardener mirrors and off Jason's Mirror Shield,
 * light crystals, dazzle eyes, and turn any hero they touch to stone for a moment (never damage).
 *
 * A beam is traced through the level in legs: each leg runs straight until it hits a wall, a floor
 * that is too high, a solid box, a crystal or an eye (a `BeamCatcher`), a mirror (it turns), or a
 * hero (the Mirror Shield bounces it; anyone else is petrified). Beams bounced off the shield get a
 * little aim help: they snap onto a catcher or mirror close to where they were going.
 */
import { GAZE, MIRROR } from '../../core/constants';
import type { Cell } from '../../world/levelTypes';
import type { Box } from '../../world/physics';
import { Grid } from '../../world/grid';

export interface Vec {
  x: number;
  y: number;
  z: number;
}

/** A small 3D vector with just what the tracer needs (three.js's Vector3 has the same x, y, z). */
export class V implements Vec {
  constructor(
    public x = 0,
    public y = 0,
    public z = 0,
  ) {}

  set(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  copy(v: Vec) {
    return this.set(v.x, v.y, v.z);
  }

  clone() {
    return new V(this.x, this.y, this.z);
  }

  add(v: Vec, k = 1) {
    return this.set(this.x + v.x * k, this.y + v.y * k, this.z + v.z * k);
  }

  lerp(a: Vec, b: Vec, k: number) {
    return this.set(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, a.z + (b.z - a.z) * k);
  }

  normalize() {
    const l = Math.hypot(this.x, this.y, this.z) || 1;
    return this.set(this.x / l, this.y / l, this.z / l);
  }
}

export const dist2 = (a: Vec, b: Vec) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2;

/** Anything a beam can land on: a light crystal, an eye-sentry's eye, MEDUSA's own eye. */
export interface BeamCatcher {
  readonly pos: Vec;
  readonly radius: number;
  /** False while beams pass straight through it (a shut eye). */
  readonly catching: boolean;
  /** Hit by a beam this frame. `bounced` is true if the beam came off a mirror or the Mirror Shield. */
  catchBeam(dt: number, bounced: boolean, source: unknown): void;
}

/** A Gardener mirror standing in a cell: it reflects beams about its flat unit `normal`. */
export interface BeamMirror {
  readonly pos: Vec;
  readonly normal: Vec;
  glint(): void;
}

/** What the tracer needs from the world: the grid, solid boxes, and the playing hero. */
export interface TraceWorld {
  grid: { width: number; cell(cx: number, cz: number): Cell };
  boxes: readonly Box[];
  player: {
    body: { x: number; y: number; z: number; r: number; h: number };
    down: boolean;
    /** The raised Mirror Shield's facing (flat, unit length), or null. */
    mirrorNormal(): Vec | null;
    /** Turns the playing hero to stone; true if it happened. */
    petrify(): boolean;
    mirrorGlint(): void;
  };
}

/** Per-world lookups: the mirrors by cell, and everything that can catch a beam. */
export interface LabWorld {
  mirrors: Map<number, BeamMirror>;
  catchers: BeamCatcher[];
}

const registry = new WeakMap<object, LabWorld>();

export function labWorld(world: object): LabWorld {
  let r = registry.get(world);
  if (!r) {
    r = { mirrors: new Map(), catchers: [] };
    registry.set(world, r);
  }
  return r;
}

/** Where a trace ended up. */
export interface BeamResult {
  /** The beam's corners, from the eye to where it stopped. */
  points: V[];
  /** It turned a hero to stone this frame. */
  stoned: boolean;
  /** It bounced off the Mirror Shield. */
  shielded: boolean;
  /** What caught it, if anything. */
  caught: BeamCatcher | null;
}

/** Reflects `d` about the flat unit normal `n` (keeps any vertical slope). */
export function reflectFlat<T extends Vec>(d: T, n: Vec): T {
  const k = 2 * (d.x * n.x + d.z * n.z);
  d.x -= k * n.x;
  d.z -= k * n.z;
  return d;
}

/** Angle between the flat parts of two directions (radians). */
function flatAngle(ax: number, az: number, bx: number, bz: number): number {
  const la = Math.hypot(ax, az) || 1;
  const lb = Math.hypot(bx, bz) || 1;
  return Math.acos(Math.max(-1, Math.min(1, (ax * bx + az * bz) / (la * lb))));
}

const blocks = (c: Cell, y: number) => c.kind === 'wall' || (c.kind !== 'void' && y < c.h);
const tmp = new V();

/** True if nothing but open floor lies between two points (walls and higher floors block). */
function clearGrid(world: TraceWorld, a: Vec, b: Vec): boolean {
  const steps = Math.ceil(Math.sqrt(dist2(a, b)) / 0.5);
  for (let i = 1; i < steps; i++) {
    tmp.lerp(a, b, i / steps);
    if (blocks(world.grid.cell(Grid.toCell(tmp.x), Grid.toCell(tmp.z)), tmp.y)) return false;
  }
  return true;
}

/**
 * Aim help for a beam bounced off the Mirror Shield: if a listening catcher (or a mirror) lies within
 * `GAZE.snap` of where the beam is going, in plain sight, the beam heads straight for it.
 */
function aimAssist(world: TraceWorld, lab: LabWorld, from: Vec, d: V) {
  let best: Vec | null = null;
  let bestA = GAZE.snap;
  for (const c of lab.catchers) {
    if (!c.catching) continue;
    const a = flatAngle(d.x, d.z, c.pos.x - from.x, c.pos.z - from.z);
    if (a < bestA && dist2(from, c.pos) < GAZE.range * GAZE.range && clearGrid(world, from, c.pos)) {
      bestA = a;
      best = c.pos;
    }
  }
  for (const m of lab.mirrors.values()) {
    const at = new V(m.pos.x, from.y, m.pos.z);
    const a = flatAngle(d.x, d.z, at.x - from.x, at.z - from.z);
    if (a < bestA && dist2(from, at) > 1.44 && clearGrid(world, from, at)) {
      bestA = a;
      best = at;
    }
  }
  if (best) d.set(best.x - from.x, best.y - from.y, best.z - from.z).normalize();
}

/** Solid boxes overlapping the flat bounding box of a leg (so the stepping only looks at a few). */
function boxesNear(world: TraceWorld, a: Vec, b: Vec, out: Box[]): Box[] {
  out.length = 0;
  const minX = Math.min(a.x, b.x) - 0.2;
  const maxX = Math.max(a.x, b.x) + 0.2;
  const minZ = Math.min(a.z, b.z) - 0.2;
  const maxZ = Math.max(a.z, b.z) + 0.2;
  for (const box of world.boxes) {
    if (box.solid && box.maxX > minX && box.minX < maxX && box.maxZ > minZ && box.minZ < maxZ) out.push(box);
  }
  return out;
}

const near: Box[] = [];
const prev = new V();
const p = new V();
const d = new V();
const end = new V();

/**
 * Traces one gaze beam from `origin` along `dir` and does what it does to whatever it meets this
 * frame (`dt` feeds crystals' charge). `source` is the eye it came from (it can't catch its own beam
 * on the way out); `range` is how far it reaches in all (world units).
 */
export function traceBeam(world: TraceWorld, origin: Vec, dir: Vec, source: unknown, dt: number, range: number = GAZE.range): BeamResult {
  const lab = labWorld(world);
  const res: BeamResult = { points: [new V().copy(origin)], stoned: false, shielded: false, caught: null };
  const pl = world.player;
  const b = pl.body;
  p.copy(origin);
  d.copy(dir).normalize();
  let left = range;
  let bounced = false;
  let skip: unknown = source;
  let lastMirror = -1;
  for (let leg = 0; leg < 10 && left > 0; leg++) {
    // How far this leg can go before the level itself (walls, higher floors) stops it.
    let len = 0;
    end.copy(p);
    while (len < left) {
      end.add(d, GAZE.step);
      len += GAZE.step;
      if (blocks(world.grid.cell(Grid.toCell(end.x), Grid.toCell(end.z)), end.y)) break;
    }
    boxesNear(world, p, end, near);
    let turned = false;
    for (let s = 0; s < len; s += GAZE.step) {
      prev.copy(p);
      p.add(d, GAZE.step);
      left -= GAZE.step;
      // A hero in the way: the Mirror Shield bounces the beam; anyone else turns to stone.
      const hx = p.x - b.x;
      const hz = p.z - b.z;
      if (hx * hx + hz * hz < (b.r + 0.2) * (b.r + 0.2) && p.y > b.y - 0.1 && p.y < b.y + b.h + 0.2 && !pl.down) {
        const n = pl.mirrorNormal();
        if (n && d.x * n.x + d.z * n.z < -MIRROR.arc) {
          p.set(b.x + n.x * 0.75, p.y, b.z + n.z * 0.75);
          reflectFlat(d, n);
          d.y = 0;
          d.normalize();
          aimAssist(world, lab, p, d);
          pl.mirrorGlint();
          res.points.push(p.clone());
          res.shielded = true;
          bounced = true;
          skip = null;
          lastMirror = -1;
          turned = true;
          break;
        }
        if (pl.petrify()) res.stoned = true;
        res.points.push(p.clone());
        return res;
      }
      // A crystal or an eye.
      let caught: BeamCatcher | null = null;
      for (const c of lab.catchers) {
        if (c === skip) {
          if (dist2(p, c.pos) > (c.radius + 0.4) * (c.radius + 0.4)) skip = null;
          continue;
        }
        if (c.catching && dist2(p, c.pos) < c.radius * c.radius) {
          caught = c;
          break;
        }
      }
      if (caught) {
        caught.catchBeam(dt, bounced, source);
        res.caught = caught;
        res.points.push(p.clone());
        return res;
      }
      // A mirror: turn where the beam crosses the mirror's face.
      const cx = Grid.toCell(p.x);
      const cz = Grid.toCell(p.z);
      const idx = cz * world.grid.width + cx;
      const m = lab.mirrors.get(idx);
      if (m) {
        if (idx !== lastMirror) {
          const s0 = (prev.x - m.pos.x) * m.normal.x + (prev.z - m.pos.z) * m.normal.z;
          const s1 = (p.x - m.pos.x) * m.normal.x + (p.z - m.pos.z) * m.normal.z;
          if (s0 * s1 <= 0 && s0 !== s1) {
            p.lerp(prev, p.clone(), s0 / (s0 - s1));
            reflectFlat(d, m.normal);
            m.glint();
            res.points.push(p.clone());
            bounced = true;
            lastMirror = idx;
            turned = true;
            break;
          }
        }
        // The mirror's own stand doesn't stop the beam.
        continue;
      }
      if (idx !== lastMirror) lastMirror = -1;
      // Walls, floors and solid things.
      let hit = false;
      for (const box of near) {
        if (p.x > box.minX && p.x < box.maxX && p.z > box.minZ && p.z < box.maxZ && p.y > box.bottom && p.y < box.top) {
          hit = true;
          break;
        }
      }
      if (hit || blocks(world.grid.cell(cx, cz), p.y)) {
        res.points.push(p.clone());
        return res;
      }
    }
    if (!turned) break;
  }
  res.points.push(p.clone());
  return res;
}
