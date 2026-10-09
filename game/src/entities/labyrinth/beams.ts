/**
 * MEDUSA's gaze beams (Medusa's Labyrinth, chapter 3): straight green beams of light that bounce off
 * Gardener mirrors and off Jason's Mirror Shield, light up crystals, dazzle eyes, and turn any hero
 * they touch to stone for a moment (never any damage).
 *
 * A beam is traced through the level in legs: each leg runs straight until it hits a wall, a floor
 * that is too high, a solid box, a crystal or an eye (a `BeamCatcher`), a mirror (it turns), or a
 * hero (the Mirror Shield bounces it; anyone else is petrified). Bounced beams get a little aim
 * help: they snap onto a catcher or mirror close to where they were going, so kids can aim them.
 */
import * as THREE from 'three';

import { GAZE, MIRROR } from '../../core/constants';
import type { World } from '../../game/world';
import { Grid } from '../../world/grid';
import type { Box } from '../../world/physics';

/** Anything a beam can land on: a light crystal, an eye-sentry's eye, MEDUSA's own eye. */
export interface BeamCatcher {
  readonly pos: THREE.Vector3;
  readonly radius: number;
  /** False while it lets beams pass straight through it (a shut eye, a crystal already lit still stops them). */
  readonly catching: boolean;
  /** Hit by a beam this frame. `bounced` is true if the beam came off a mirror or the Mirror Shield. */
  catchBeam(dt: number, bounced: boolean, source: unknown): void;
}

/** A Gardener mirror standing in a cell: it reflects beams about its `normal` (flat, unit length). */
export interface BeamMirror {
  readonly pos: THREE.Vector3;
  readonly normal: THREE.Vector3;
  glint(): void;
}

/** Per-world lookups: the mirrors by cell, and everything that can catch a beam. */
export interface LabWorld {
  mirrors: Map<number, BeamMirror>;
  catchers: BeamCatcher[];
}

const registry = new WeakMap<World, LabWorld>();

export function labWorld(world: World): LabWorld {
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
  points: THREE.Vector3[];
  /** It turned a hero to stone this frame. */
  stoned: boolean;
  /** It bounced off the Mirror Shield. */
  shielded: boolean;
  /** What caught it, if anything. */
  caught: BeamCatcher | null;
}

/** Reflects `d` about the flat unit normal `n` (keeps any vertical slope). */
export function reflectFlat(d: THREE.Vector3, n: THREE.Vector3): THREE.Vector3 {
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

const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();

/** True if nothing but open floor lies between two points (walls and higher floors block). */
function clearGrid(world: World, a: THREE.Vector3, b: THREE.Vector3): boolean {
  const steps = Math.ceil(a.distanceTo(b) / 0.5);
  for (let i = 1; i < steps; i++) {
    tmpA.copy(a).lerp(b, i / steps);
    const c = world.grid.cell(Grid.toCell(tmpA.x), Grid.toCell(tmpA.z));
    if (c.kind === 'wall' || (c.kind !== 'void' && tmpA.y < c.h)) return false;
  }
  return true;
}

/**
 * Aim help for a bounced beam: if a catcher that is listening (or a mirror) lies within `GAZE.snap`
 * of where the beam is going, in plain sight, the beam heads straight for it.
 */
function aimAssist(world: World, lab: LabWorld, from: THREE.Vector3, d: THREE.Vector3, skip: unknown) {
  let best: THREE.Vector3 | null = null;
  let bestA = GAZE.snap;
  for (const c of lab.catchers) {
    if (!c.catching || c === skip) continue;
    const a = flatAngle(d.x, d.z, c.pos.x - from.x, c.pos.z - from.z);
    if (a < bestA && from.distanceTo(c.pos) < GAZE.range && clearGrid(world, from, c.pos)) {
      bestA = a;
      best = c.pos;
    }
  }
  for (const m of lab.mirrors.values()) {
    tmpB.set(m.pos.x, from.y, m.pos.z);
    const a = flatAngle(d.x, d.z, tmpB.x - from.x, tmpB.z - from.z);
    if (a < bestA && from.distanceTo(tmpB) > 1.2 && clearGrid(world, from, tmpB)) {
      bestA = a;
      best = tmpB.clone();
    }
  }
  if (best) d.copy(best).sub(from).normalize();
}

/** Boxes that overlap the flat bounding box of a leg (so the stepping only looks at a few). */
function boxesNear(world: World, a: THREE.Vector3, b: THREE.Vector3, out: Box[]): Box[] {
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
const prev = new THREE.Vector3();
const p = new THREE.Vector3();
const d = new THREE.Vector3();
const end = new THREE.Vector3();

/**
 * Traces one gaze beam from `origin` along `dir` and does what it does to whatever it meets this
 * frame (`dt` feeds crystals' charge). `source` is the eye it came from (it can't catch its own beam
 * on the way out).
 */
export function traceBeam(world: World, origin: THREE.Vector3, dir: THREE.Vector3, source: unknown, dt: number, range: number = GAZE.range): BeamResult {
  const lab = labWorld(world);
  const res: BeamResult = { points: [origin.clone()], stoned: false, shielded: false, caught: null };
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
      end.addScaledVector(d, GAZE.step);
      len += GAZE.step;
      const c = world.grid.cell(Grid.toCell(end.x), Grid.toCell(end.z));
      if (c.kind === 'wall' || (c.kind !== 'void' && end.y < c.h)) break;
    }
    boxesNear(world, p, end, near);
    let turned = false;
    for (let s = 0; s < len; s += GAZE.step) {
      prev.copy(p);
      p.addScaledVector(d, GAZE.step);
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
          aimAssist(world, lab, p, d, null);
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
          if (p.distanceToSquared(c.pos) > (c.radius + 0.4) * (c.radius + 0.4)) skip = null;
          continue;
        }
        if (c.catching && p.distanceToSquared(c.pos) < c.radius * c.radius) {
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
            p.lerpVectors(prev, p, s0 / (s0 - s1));
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
      if (!hit) {
        const c = world.grid.cell(cx, cz);
        hit = c.kind === 'wall' || (c.kind !== 'void' && p.y < c.h);
      }
      if (hit) {
        res.points.push(p.clone());
        return res;
      }
    }
    if (!turned) break;
  }
  res.points.push(p.clone());
  return res;
}

/* ---------------- the beam's look ---------------- */

const CORE_GEO = new THREE.CylinderGeometry(0.07, 0.07, 1, 6, 1, true).rotateX(Math.PI / 2).translate(0, 0, 0.5);
const HALO_GEO = new THREE.CylinderGeometry(0.22, 0.22, 1, 8, 1, true).rotateX(Math.PI / 2).translate(0, 0, 0.5);

/** A glowing beam drawn along a trace's corners (up to 11 legs), with a splash of light where it stops. */
export class BeamFx {
  readonly group = new THREE.Group();
  private cores: THREE.Mesh[] = [];
  private halos: THREE.Mesh[] = [];
  private coreMat: THREE.MeshBasicMaterial;
  private haloMat: THREE.MeshBasicMaterial;
  private splash: THREE.Sprite;

  constructor(color: string) {
    this.coreMat = new THREE.MeshBasicMaterial({ color: '#f4fff6', transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false });
    this.haloMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    for (let i = 0; i < 11; i++) {
      const c = new THREE.Mesh(CORE_GEO, this.coreMat);
      const h = new THREE.Mesh(HALO_GEO, this.haloMat);
      c.frustumCulled = h.frustumCulled = false;
      c.visible = h.visible = false;
      this.cores.push(c);
      this.halos.push(h);
      this.group.add(c, h);
    }
    const tex = splashTexture();
    this.splash = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    this.splash.scale.setScalar(1.4);
    this.group.add(this.splash);
  }

  /** Draws the beam through `pts` (or hides it with an empty list); `pulse` swells the halo. */
  show(pts: readonly THREE.Vector3[], pulse = 0) {
    for (let i = 0; i < this.cores.length; i++) {
      const a = pts[i];
      const z = pts[i + 1];
      const on = !!a && !!z && a.distanceToSquared(z) > 1e-4;
      this.cores[i].visible = this.halos[i].visible = on;
      if (!on) continue;
      for (const m of [this.cores[i], this.halos[i]]) {
        m.position.copy(a);
        m.lookAt(z);
        m.scale.set(1, 1, a.distanceTo(z));
      }
    }
    this.halos.forEach((h) => h.scale.setX(1 + pulse * 0.6).setY(1 + pulse * 0.6));
    this.haloMat.opacity = 0.3 + pulse * 0.25;
    const last = pts[pts.length - 1];
    this.splash.visible = pts.length > 1;
    if (last) this.splash.position.copy(last);
    this.splash.scale.setScalar(1.2 + pulse * 0.8 + Math.random() * 0.25);
  }

  hide() {
    this.show([]);
  }
}

let splashTex: THREE.Texture | null = null;

function splashTexture(): THREE.Texture {
  if (splashTex) return splashTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  if (g) {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.3, 'rgba(255,255,255,0.6)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 64, 64);
  }
  splashTex = new THREE.CanvasTexture(c);
  return splashTex;
}
