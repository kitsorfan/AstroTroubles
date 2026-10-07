/**
 * Props for hero puzzles: arrow targets (only Atalanta's power arrows set them off), wall-run walls
 * (a glowing stripe she can run along) and low gaps (a crawl hole only her slide fits under).
 */
import * as THREE from 'three';

import { audio } from '../../core/audio';
import { haptic } from '../../core/bridge';
import { CELL, WALL_H } from '../../core/constants';
import type { World } from '../../game/world';
import type { Box } from '../../world/physics';
import { Entity } from '../entity';
import { boxG, cyl, glowSprite, mat, mesh, ownMat } from '../models';

/** How high the top of a low gap's crawl hole is above its floor (Jason stands 1.7 tall, Atalanta slides 0.8 low). */
export const LOWGAP_CLEAR = 0.95;

/** Per-world lookups the hero moves need: wall-run cells and arrow targets. */
export interface HeroWorld {
  wallRuns: Set<number>;
  targets: ArrowTarget[];
  /** True once the "charge a power arrow" hint was shown on this level. */
  hinted: boolean;
}

const registry = new WeakMap<World, HeroWorld>();

export function heroWorld(world: World): HeroWorld {
  let r = registry.get(world);
  if (!r) {
    r = { wallRuns: new Set(), targets: [], hinted: false };
    registry.set(world, r);
  }
  return r;
}

const center = (c: number) => c * CELL + CELL / 2;

/* ---------------- arrow target ---------------- */

/** A red-and-white bullseye on a post. A power arrow sets its flag; quick arrows just bounce off. */
export class ArrowTarget extends Entity {
  readonly center: THREE.Vector3;
  readonly radius = 0.85;
  done = false;
  private disc: THREE.Group;
  private rings: THREE.MeshStandardMaterial[] = [];
  private glow: THREE.Sprite;
  private wobble = 0;

  constructor(
    world: World,
    id: string,
    cx: number,
    cz: number,
    h: number,
    readonly flag: string,
  ) {
    super(world, id);
    const x = center(cx);
    const z = center(cz);
    this.center = new THREE.Vector3(x, h + 2.3, z);
    this.obj.add(mesh(cyl(0.09, 0.12, 1.6, 8), mat('#8a6a4a', { rough: 0.8 }), x, h + 0.8, z));
    this.obj.add(mesh(cyl(0.4, 0.5, 0.14, 12), mat('#5a4a3a', { rough: 0.8 }), x, h + 0.07, z));
    this.disc = new THREE.Group();
    this.disc.position.copy(this.center);
    const colors = ['#ff4d6d', '#ffffff', '#ff4d6d', '#ffffff', '#ffc94a'];
    colors.forEach((c, i) => {
      const m = ownMat(c, { emissive: c, ei: 0.25, rough: 0.5 });
      this.rings.push(m);
      const r = 0.85 - i * 0.17;
      const disc = mesh(cyl(r, r, 0.08 + i * 0.012, 28).rotateX(Math.PI / 2), m, 0, 0, 0, i === 0);
      this.disc.add(disc);
    });
    this.disc.add(mesh(new THREE.TorusGeometry(0.86, 0.05, 6, 32), mat('#ffc94a', { metal: 0.5, rough: 0.3 })));
    this.obj.add(this.disc);
    this.glow = glowSprite('#3dff8a', 3, 0);
    this.glow.position.copy(this.center);
    this.obj.add(this.glow);
    heroWorld(world).targets.push(this);
    if (world.hasFlag(flag)) this.setDone(false);
  }

  /** A power arrow hit the bullseye: the target turns green and its flag is set. */
  struck() {
    if (this.done) return;
    this.setDone(true);
    const w = this.world;
    w.setFlag(this.flag);
    w.particles.emit(this.center.x, this.center.y, this.center.z, { count: 30, color: '#3dff8a', speed: 6, life: 0.6, size: 0.5 });
    w.rings.burst(this.center.x, this.center.y - 2.2, this.center.z, 5, '#3dff8a', 0.4);
    audio.play('charged', 1.2);
    audio.play('bolt', 1.4);
    haptic('medium');
    w.hooks.toast('Bullseye!', 'bolt');
  }

  /** A quick arrow: a "tink", a wobble, and (once per level) a hint to charge a power arrow. */
  tink() {
    this.wobble = 1;
    audio.play('zap', 2.6, 0.6);
    const hw = heroWorld(this.world);
    if (this.done || hw.hinted) return;
    hw.hinted = true;
    this.world.hooks.toast('Too weak! HOLD the BOW button to charge a power arrow.', 'bolt');
  }

  private setDone(fx: boolean) {
    this.done = true;
    for (const m of this.rings) {
      m.color.set(m === this.rings[1] || m === this.rings[3] ? '#e6ffe8' : '#3dff8a');
      m.emissive.set('#3dff8a');
      m.emissiveIntensity = 0.6;
    }
    if (fx) this.wobble = 1.5;
  }

  update(dt: number) {
    this.wobble = Math.max(0, this.wobble - dt * 2.5);
    // Turns slowly so it can be seen (and hit) from any side; it stops once it's been hit.
    if (!this.done) this.disc.rotation.y += dt * 0.7;
    this.disc.rotation.z = Math.sin(this.world.time * 30) * 0.12 * this.wobble;
    (this.glow.material as THREE.SpriteMaterial).opacity = this.done ? 0.35 + Math.sin(this.world.time * 3) * 0.1 : 0;
  }
}

/* ---------------- wall-run wall ---------------- */

let stripeTex: THREE.CanvasTexture | null = null;

/** A teal running stripe with chevrons pointing both ways. */
function stripeTexture(): THREE.CanvasTexture {
  if (stripeTex) return stripeTex;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 64;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.fillStyle = 'rgba(20,90,80,0.85)';
  g.fillRect(0, 0, 128, 64);
  g.fillStyle = '#8ff8e4';
  g.fillRect(0, 4, 128, 5);
  g.fillRect(0, 55, 128, 5);
  g.strokeStyle = '#d6fff6';
  g.lineWidth = 7;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  for (const [x, d] of [
    [30, -1],
    [98, 1],
  ]) {
    for (const k of [0, 16]) {
      g.beginPath();
      g.moveTo(x + d * k - d * 8, 18);
      g.lineTo(x + d * k + d * 6, 32);
      g.lineTo(x + d * k - d * 8, 46);
      g.stroke();
    }
  }
  stripeTex = new THREE.CanvasTexture(c);
  stripeTex.colorSpace = THREE.SRGBColorSpace;
  return stripeTex;
}

/** Marks a wall cell as a wall-run wall: a glowing stripe on every open face. */
export class WallRun extends Entity {
  private mat: THREE.MeshBasicMaterial;

  constructor(world: World, id: string, cx: number, cz: number, h: number) {
    super(world, id);
    heroWorld(world).wallRuns.add(cz * world.grid.width + cx);
    this.mat = new THREE.MeshBasicMaterial({ map: stripeTexture(), transparent: true, toneMapped: false, side: THREE.DoubleSide });
    const x = center(cx);
    const z = center(cz);
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const n = world.grid.cell(cx + dx, cz + dz);
      if (n.kind === 'wall') continue;
      const floor = n.kind === 'void' || n.kind === 'hazard' ? h : n.h;
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(CELL, 1.1), this.mat);
      plane.position.set(x + dx * (CELL / 2 + 0.02), floor + 1.7, z + dz * (CELL / 2 + 0.02));
      plane.rotation.y = Math.atan2(dx, dz);
      this.obj.add(plane);
      // A glowing edge along the top too, so the wall reads from the camera above.
      const top = world.grid.cell(cx, cz).h;
      const edge = mesh(boxG(Math.abs(dz) * CELL + 0.2, 0.08, Math.abs(dx) * CELL + 0.2), this.edge, x + dx * (CELL / 2 - 0.1), top + 0.04, z + dz * (CELL / 2 - 0.1), false);
      this.obj.add(edge);
    }
  }

  private get edge() {
    return mat('#8ff8e4', { emissive: '#8ff8e4', ei: 1.4 });
  }

  update() {
    const t = this.world.time;
    this.mat.color.setScalar(0.8 + Math.sin(t * 4) * 0.2);
  }
}

/* ---------------- low gap ---------------- */

/** A wall with a crawl hole at the bottom (hazard stripes along its edge): only a slide fits under. */
export class LowGap extends Entity {
  readonly box: Box;

  constructor(world: World, id: string, cx: number, cz: number, h: number, axis?: 'x' | 'z') {
    super(world, id);
    const x = center(cx);
    const z = center(cz);
    const g = world.grid;
    // The way through runs between the walls on either side.
    const through = axis ?? (g.cell(cx - 1, cz).kind === 'wall' || g.cell(cx + 1, cz).kind === 'wall' ? 'z' : 'x');
    const top = h + WALL_H;
    const height = top - (h + LOWGAP_CLEAR);
    const wall = mat(world.theme.wall, { rough: 0.8 });
    const block = mesh(boxG(CELL, height, CELL), wall, x, h + LOWGAP_CLEAR + height / 2, z);
    this.obj.add(block);
    // Yellow and black stripes along the bottom edge on both open sides, and a dark hole beneath.
    const stripe = new THREE.MeshBasicMaterial({ map: hazardTexture(), toneMapped: false });
    for (const s of [-1, 1]) {
      const p = mesh(new THREE.PlaneGeometry(CELL, 0.22), stripe, x, h + LOWGAP_CLEAR + 0.11, z, false);
      if (through === 'z') p.position.z += s * (CELL / 2 + 0.02);
      else p.position.x += s * (CELL / 2 + 0.02);
      p.rotation.y = through === 'z' ? (s > 0 ? 0 : Math.PI) : s > 0 ? Math.PI / 2 : -Math.PI / 2;
      this.obj.add(p);
    }
    const shade = mesh(boxG(CELL - 0.04, 0.02, CELL - 0.04), mat('#000000', { opacity: 0.35 }), x, h + 0.02, z, false);
    this.obj.add(shade);
    this.box = { minX: x - CELL / 2, maxX: x + CELL / 2, minZ: z - CELL / 2, maxZ: z + CELL / 2, bottom: h + LOWGAP_CLEAR, top: h + 60, solid: true, dx: 0, dy: 0, dz: 0, owner: this };
    world.boxes.push(this.box);
  }
}

let hazardTex: THREE.CanvasTexture | null = null;

function hazardTexture(): THREE.CanvasTexture {
  if (hazardTex) return hazardTex;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 16;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.fillStyle = '#ffc94a';
  g.fillRect(0, 0, 128, 16);
  g.fillStyle = '#1a1a22';
  for (let x = -16; x < 128; x += 24) {
    g.beginPath();
    g.moveTo(x, 16);
    g.lineTo(x + 12, 0);
    g.lineTo(x + 24, 0);
    g.lineTo(x + 12, 16);
    g.fill();
  }
  hazardTex = new THREE.CanvasTexture(c);
  hazardTex.colorSpace = THREE.SRGBColorSpace;
  return hazardTex;
}
