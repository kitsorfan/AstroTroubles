import * as THREE from 'three';

import { audio } from '../core/audio';
import { CELL } from '../core/constants';
import type { World } from '../game/world';
import { pointBlocked, type Box } from '../world/physics';
import { Boss } from './bossBase';
import { Entity, type HitKind, type Target } from './entity';
import { cone, glowSprite, mat, mesh, torus } from './models';
import { FLAME, WEAPONS, burnDps, flameTick, type ArmsUpgrades } from './weapons';

/**
 * The Flamethrower: which targets its cone reaches, what burning does to them, the flames themselves
 * (a few particles and glow sprites, cheap on phones) and the brambles it burns away.
 */

/** Anything that can be set on fire (enemies; bosses burn only briefly). */
interface Burnable {
  ignite(seconds: number, dps: number): void;
}

const canBurn = (t: unknown): t is Burnable => typeof (t as Partial<Burnable>).ignite === 'function';

const tmp = new THREE.Vector3();

/** True if (tx, tz) lies inside the flame cone: within `range` of the nozzle and `half` radians of `dir`. */
export function inCone(ox: number, oz: number, dirX: number, dirZ: number, tx: number, tz: number, range: number, half: number, pad = 0): boolean {
  const dx = tx - ox;
  const dz = tz - oz;
  const d = Math.hypot(dx, dz);
  if (d > range + pad) return false;
  // Right at the nozzle everything is in the flame.
  if (d < 0.9 + pad) return true;
  const dl = Math.hypot(dirX, dirZ) || 1;
  const cos = (dx * dirX + dz * dirZ) / (d * dl);
  // A target's own size widens the cone a little for it.
  return Math.acos(Math.max(-1, Math.min(1, cos))) <= half + Math.atan2(pad, d);
}

/** Every bramble on the deck, for the flame to find (they can't be aimed at). */
const brambles = new Set<Bramble>();

/**
 * One tick of flame from `origin` along `dir`: hurts and ignites the enemies (and bosses) in the cone,
 * and scorches brambles. Walls and cliffs stop the fire. Returns how many targets it reached.
 */
export function burnCone(w: World, origin: THREE.Vector3, dir: THREE.Vector3, up: ArmsUpgrades): number {
  const range = WEAPONS.flame.range;
  const dmg = flameTick(up);
  let n = 0;
  const reaches = (t: Target) => {
    if (Math.abs(t.aim.y - origin.y) > 2.4) return false;
    if (!inCone(origin.x, origin.z, dir.x, dir.z, t.aim.x, t.aim.z, range, FLAME.cone, t.radius)) return false;
    // The fire can't go through walls: check the way there.
    for (const k of [0.35, 0.7]) {
      tmp.copy(origin).lerp(t.aim, k);
      if (pointBlocked(w.grid, [], tmp.x, tmp.y, tmp.z)) return false;
    }
    return true;
  };
  for (const t of w.targetsNear(origin, range + 2)) {
    if (!reaches(t) || !t.hit(dmg, 'burn', origin)) continue;
    n += 1;
    ignite(w, t, up);
  }
  for (const b of brambles) {
    // Brambles left over from an earlier deck are forgotten.
    if (b.world !== w) brambles.delete(b);
    else if (b.alive && reaches(b)) b.hit(dmg, 'burn');
  }
  return n;
}

/** Sets a target burning: enemies for the full time, bosses only briefly (a boss's weak spot passes it on). */
export function ignite(w: World, t: Target, up: ArmsUpgrades) {
  const dps = burnDps(up);
  if (t instanceof Boss) t.ignite(FLAME.burn * FLAME.bossBurn, dps);
  else if (canBurn(t)) t.ignite(FLAME.burn, dps);
  else if (w.boss?.started && !w.boss.defeated && t.aim.distanceTo(w.boss.where) < 14) w.boss.ignite(FLAME.burn * FLAME.bossBurn, dps);
}

const FLAME_COLORS = ['#ffd166', '#ffa030', '#ff7a1a', '#ff4a10'];

/**
 * The fire coming out of the nozzle: three flickering glow sprites along the cone, plus a stream of
 * particles that roll forward, swell and rise. All of it is hidden while the Flamethrower rests.
 */
export class FlameJet {
  private glows: THREE.Sprite[];
  private level = 0;
  private t = 0;
  private flashT = 0;

  constructor(private w: World) {
    this.glows = [
      glowSprite('#ffc860', 1, 0.6),
      glowSprite('#ff8a20', 1, 0.5),
      glowSprite('#ff4a10', 1, 0.38),
    ];
    for (const g of this.glows) {
      g.visible = false;
      g.renderOrder = 6;
      w.scene.add(g);
    }
  }

  /** Call every frame: `on` while the Flamethrower burns, from the nozzle along `dir`. */
  update(dt: number, on: boolean, origin: THREE.Vector3, dir: THREE.Vector3) {
    this.t += dt;
    this.level = Math.max(0, Math.min(1, this.level + (on ? dt * 9 : -dt * 7)));
    const show = this.level > 0.02;
    const range = WEAPONS.flame.range;
    this.glows.forEach((g, i) => {
      g.visible = show;
      if (!show) return;
      const along = [0.7, 2.1, 3.7][i] * (0.6 + this.level * 0.4);
      const flicker = 0.85 + Math.sin(this.t * (31 + i * 7)) * 0.1 + Math.random() * 0.1;
      g.position.copy(origin).addScaledVector(dir, along);
      g.position.y += i * 0.25;
      g.scale.setScalar([0.8, 1.9, 2.8][i] * this.level * flicker);
    });
    if (!on) return;
    const speed = WEAPONS.flame.speed;
    const life = (range / speed) * 0.9;
    for (let i = 0; i < 4; i++) {
      const c = FLAME_COLORS[(Math.random() * FLAME_COLORS.length) | 0];
      const s = speed * (0.75 + Math.random() * 0.4);
      this.w.particles.emit(origin.x, origin.y, origin.z, { count: 1, color: c, vel: [dir.x * s, dir.y * s + 0.6, dir.z * s], speed: 2.4, spread: 1, life, size: 0.45 + i * 0.2, gravity: -3, drag: 0.6 });
    }
    // A warm light on the ground around the flames, now and then.
    this.flashT -= dt;
    if (this.flashT <= 0) {
      this.flashT = 0.18;
      tmp.copy(origin).addScaledVector(dir, 2.2);
      this.w.flash(tmp.x, tmp.y, tmp.z, '#ff8a2a', 12, 0.2);
    }
  }

  /** A puff of grey smoke at the nozzle (the tank ran dry). */
  smoke(origin: THREE.Vector3) {
    this.w.particles.emit(origin.x, origin.y, origin.z, { count: 6, color: '#8a8a8a', speed: 1.2, life: 0.7, size: 0.6, gravity: -2 });
  }

  dispose() {
    for (const g of this.glows) g.removeFromParent();
  }
}

/** Seconds a bramble takes to shrivel away once it caught fire. */
const SHRIVEL = 0.7;

/**
 * A wall of thorny brambles filling one cell. Only fire gets through it: the Flamethrower burns it
 * away in a moment, and a charged fireball (or Brennus's cannon blast) sets it alight too.
 */
export class Bramble extends Entity implements Target {
  readonly aim: THREE.Vector3;
  radius = 1.2;
  aimable = false;
  private hp = 1.2;
  private box: Box;
  private bush = new THREE.Group();
  private burnT = -1;
  private static hinted = new WeakSet<World>();

  constructor(world: World, id: string, cx: number, cz: number, h: number) {
    super(world, id);
    const x = cx * CELL + CELL / 2;
    const z = cz * CELL + CELL / 2;
    this.aim = new THREE.Vector3(x, h + 1, z);
    const leaf = mat('#2f4a1c', { rough: 0.85 });
    const vine = mat('#4f6a28', { rough: 0.8 });
    const dark = mat('#3a2a1a', { rough: 0.9 });
    const thorn = mat('#e8dcb8', { rough: 0.6 });
    // A thick, lumpy hedge filling the cell...
    const lumps: [number, number, number, number][] = [
      [0, 0.75, 0, 0.95],
      [-0.45, 0.55, 0.3, 0.6],
      [0.45, 0.6, -0.3, 0.62],
      [0.3, 1.45, 0.25, 0.6],
      [-0.3, 1.5, -0.2, 0.55],
    ];
    for (const [lx, ly, lz, r] of lumps) {
      const lump = mesh(new THREE.IcosahedronGeometry(r, 1), leaf, lx, ly, lz);
      lump.scale.set(1.05, 0.85, 1.05);
      this.bush.add(lump);
    }
    // ...wrapped in twisting woody vines bristling with pale thorns.
    for (let i = 0; i < 5; i++) {
      const ring = mesh(torus(0.8 + (i % 2) * 0.12, 0.07), i % 2 ? vine : dark, 0, 0.35 + i * 0.33, 0);
      ring.rotation.set(Math.PI / 2 + Math.sin(i * 1.7) * 0.35, 0, Math.cos(i * 1.3) * 0.3);
      this.bush.add(ring);
    }
    for (let k = 0; k < 18; k++) {
      const a = k * 2.4;
      const y = 0.3 + (k % 6) * 0.3;
      const r = 0.85 - Math.abs(y - 0.9) * 0.25;
      const spike = mesh(cone(0.06, 0.32, 5), thorn, Math.cos(a) * r, y, Math.sin(a) * r);
      // Point each thorn outward.
      spike.rotation.set(0, 0, -Math.PI / 2);
      spike.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -a);
      this.bush.add(spike);
    }
    this.bush.position.set(x, h, z);
    this.obj.add(this.bush);
    this.box = { minX: x - CELL / 2, maxX: x + CELL / 2, minZ: z - CELL / 2, maxZ: z + CELL / 2, bottom: h - 1, top: h + 60, solid: true, dx: 0, dy: 0, dz: 0, owner: this };
    world.boxes.push(this.box);
    world.addTarget(this);
    brambles.add(this);
  }

  hit(dmg: number, kind: HitKind): boolean {
    if (!this.alive || this.burnT >= 0) return this.alive;
    const w = this.world;
    if (kind !== 'burn' && kind !== 'blast') {
      // Thorns shrug off everything but fire.
      w.particles.emit(this.aim.x, this.aim.y, this.aim.z, { count: 5, color: '#7fa04a', speed: 3, life: 0.3, size: 0.35 });
      audio.play('land', 1.4);
      if (!Bramble.hinted.has(w)) {
        Bramble.hinted.add(w);
        w.hooks.toast('Thorny brambles! Fire burns them away.', 'bolt');
      }
      return true;
    }
    this.hp -= kind === 'blast' ? 99 : dmg;
    w.particles.emit(this.aim.x, this.aim.y, this.aim.z, { count: 4, color: '#ff9a2a', speed: 2, life: 0.4, size: 0.5, gravity: -3 });
    if (this.hp <= 0) {
      this.burnT = 0;
      audio.play('fireball', 0.7, 0.8);
      w.boxes.splice(w.boxes.indexOf(this.box), 1);
      w.removeTarget(this);
      w.markTaken(this.id);
    }
    return true;
  }

  update(dt: number) {
    if (this.burnT < 0) return;
    this.burnT += dt;
    const k = Math.min(1, this.burnT / SHRIVEL);
    this.bush.scale.set(1 - k * 0.6, 1 - k * 0.95, 1 - k * 0.6);
    const a = this.aim;
    if (Math.random() < 0.8) this.world.particles.emit(a.x + (Math.random() - 0.5) * 1.6, a.y - 0.6 + Math.random() * 1.6 * (1 - k), a.z + (Math.random() - 0.5) * 1.6, { count: 2, color: FLAME_COLORS[(Math.random() * 4) | 0], speed: 1, life: 0.5, size: 0.7, gravity: -4 });
    if (k >= 1) {
      this.world.particles.emit(a.x, a.y - 0.5, a.z, { count: 16, color: '#5a5a5a', speed: 2, life: 1, size: 0.8, gravity: -1.5 });
      brambles.delete(this);
      this.remove();
    }
  }
}
