import * as THREE from 'three';

import { damp, dampAngle } from '../core/math';
import type { World } from '../game/world';
import { Grid } from '../world/grid';
import type { EnemyKind } from '../world/levelTypes';
import { Enemy } from './enemies';
import { Entity, type HitKind } from './entity';
import { LEGION, makeBulwark, makeMinebot, makeMortar, makeShell, makeTrooper, paintRobot } from './robotModels';

/**
 * General Brennus's robots (the Thorn Legion's machines), met only on Gaia Nova. Every attack has a
 * clear warning first (a glowing lens, a beeping light, a red circle on the ground) and a fair window
 * to dodge it, and each robot has one simple trick to beat it:
 * - Legion Trooper: strafes sideways and fires slow three-shot bursts after its lens glows. Keep moving.
 * - Roller Mine: rolls up, beeps for a second, then pops. Shoot it before it beeps, or run.
 * - Shield Bulwark: its shield blocks shots from the front. Hit it from behind, or pound / zap it.
 * - Mortar Bot: lobs shells onto red target circles. Step out of the circle, then get up close.
 */

export const ROBOT_KINDS = ['trooper', 'minebot', 'bulwark', 'mortar'] as const;
export type RobotKind = (typeof ROBOT_KINDS)[number];

export const isRobot = (k: EnemyKind): k is RobotKind => (ROBOT_KINDS as readonly string[]).includes(k);

/** Warnings and dodge windows are fixed times: harder decks make robots attack more often, never with less warning. */
export const ROBOT_TUNING = {
  /** Trooper: lens glow before a burst, shots per burst, gap between shots, shot speed, rest between bursts. */
  trooper: { hp: 3, aim: 0.85, shots: 3, gap: 0.3, speed: 7.5, rest: 3.2, range: 13 },
  /** Roller Mine: how long it beeps before it pops, and how far the pop reaches. */
  minebot: { hp: 2, fuse: 1.1, blast: 2.6, roll: 4.2 },
  /** Bulwark: how long the shield stays down after a pound or a zap, and the shield bash's wind-up. */
  bulwark: { hp: 5, down: 3.5, wind: 0.8, turn: 1.25, walk: 1.3 },
  /** Mortar: barrel glow before a shot, shell flight time (the target circle shows all of it), rest between shots. */
  mortar: { hp: 3, charge: 0.7, flight: 1.4, rest: 3.4, splash: 1.5, minRange: 3, range: 17 },
};

type RobotClass = new (world: World, id: string, x: number, y: number, z: number) => Enemy;
let classes: Record<RobotKind, RobotClass> | null = null;

/**
 * Builds one of Brennus's robots. The classes extend `Enemy`, and enemies.ts imports this file for
 * `makeEnemy`, so they are defined on first use rather than when the module loads.
 */
export function makeRobot(world: World, id: string, kind: RobotKind, x: number, y: number, z: number, variant?: string): Enemy {
  classes ??= { trooper: trooperClass(), minebot: minebotClass(), bulwark: bulwarkClass(), mortar: mortarClass() };
  const e = new classes[kind](world, id, x, y, z);
  // `gold`: one of the Legion robots Aeëtes stole and painted gold (chapter 3).
  if (variant === 'gold') paintRobot(e.model.root, 'gold');
  return e;
}

/** Floor height at a world position (or `fallback` over void and walls). */
function floorAt(world: World, x: number, z: number, fallback: number) {
  const c = world.grid.cell(Grid.toCell(x), Grid.toCell(z));
  return c.kind === 'void' || c.kind === 'wall' ? fallback : c.h;
}

/** A flat red circle on the ground with a ring that shrinks onto it: "something lands here". */
class WarnCircle {
  readonly group = new THREE.Group();
  private disc: THREE.Mesh;
  private ring: THREE.Mesh;
  private discMat: THREE.MeshBasicMaterial;
  private ringMat: THREE.MeshBasicMaterial;

  constructor(radius: number, color = '#ff3a3a') {
    const m = (opacity: number) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    this.discMat = m(0);
    this.ringMat = m(0);
    this.disc = new THREE.Mesh(new THREE.CircleGeometry(radius, 32).rotateX(-Math.PI / 2), this.discMat);
    this.ring = new THREE.Mesh(new THREE.RingGeometry(radius * 0.86, radius, 40).rotateX(-Math.PI / 2), this.ringMat);
    this.disc.renderOrder = 2;
    this.ring.renderOrder = 3;
    this.group.add(this.disc, this.ring);
    this.group.visible = false;
  }

  /** k goes 0 -> 1 as the hit gets closer; the outer ring closes in and everything blinks at the end. */
  show(x: number, y: number, z: number, k: number, t: number) {
    this.group.visible = true;
    this.group.position.set(x, y + 0.06, z);
    const blink = k > 0.7 ? 0.5 + 0.5 * Math.sin(t * 34) : 1;
    this.discMat.opacity = (0.16 + k * 0.3) * blink;
    this.ringMat.opacity = 0.9 * blink;
    this.ring.scale.setScalar(1 + (1 - k) * 0.7);
  }

  hide() {
    this.group.visible = false;
  }
}

/** A mortar shell: arcs high from the barrel and lands on its red target circle after a fixed time. */
class MortarShell extends Entity {
  private t = 0;
  private shell = makeShell();
  private warn: WarnCircle;
  private apex: number;

  constructor(
    world: World,
    private from: THREE.Vector3,
    private to: THREE.Vector3,
    private flight: number,
    private splash: number,
  ) {
    super(world, `shell${Math.random()}`);
    this.warn = new WarnCircle(splash);
    this.apex = 4 + from.distanceTo(to) * 0.18;
    this.obj.add(this.shell, this.warn.group);
    this.shell.position.copy(from);
  }

  update(dt: number) {
    this.t += dt;
    const k = Math.min(1, this.t / this.flight);
    const s = this.shell.position;
    s.lerpVectors(this.from, this.to, k);
    s.y += this.apex * 4 * k * (1 - k);
    this.shell.rotation.x += dt * 9;
    this.warn.show(this.to.x, this.to.y, this.to.z, k, this.t);
    if (Math.random() < 0.5) this.world.particles.emit(s.x, s.y, s.z, { count: 1, color: LEGION.pollen, speed: 0.6, life: 0.4, size: 0.4, gravity: 0 });
    if (k < 1) return;
    const w = this.world;
    const p = w.player.body;
    const { x, y, z } = this.to;
    if (Math.hypot(p.x - x, p.z - z) < this.splash + p.r * 0.5 && p.y < y + 1.6 && p.y > y - 1) w.player.hurt(1, x, z);
    w.particles.emit(x, y + 0.3, z, { count: 22, color: '#ffb04a', speed: 6, up: 3, life: 0.55, size: 0.6 });
    w.particles.emit(x, y + 0.3, z, { count: 10, color: LEGION.pollen, speed: 4, up: 2, life: 0.5, size: 0.5 });
    w.rings.burst(x, y + 0.05, z, this.splash * 2.2, '#ff9a5a', 0.35);
    w.soundAt('explode', x, z, 1.2, 22);
    w.shake(0.12);
    this.remove();
  }
}

/* ---------------- Legion Trooper: strafes and fires slow three-shot bursts ---------------- */

function trooperClass() {
  const T = ROBOT_TUNING.trooper;
  return class Trooper extends Enemy {
    private side = Math.random() < 0.5 ? -1 : 1;
    private strafeT = 1;
    private coolT = 1.6;
    private aimT = 0;
    private burst = 0;
    private burstT = 0;
    private dir: [number, number] = [1, 0];
    private stride = 0;

    constructor(world: World, id: string, x: number, y: number, z: number) {
      super(world, id, x, y, z, T.hp, 0.55, makeTrooper());
      this.bolts = 5;
      this.heartChance = 0.15;
      this.aimHeight = 1.1;
      this.kind = 'trooper';
      this.badgeY = 2.35;
    }

    protected think(dt: number) {
      const b = this.body;
      const p = this.player.body;
      const dx = p.x - b.x;
      const dz = p.z - b.z;
      const d = Math.hypot(dx, dz) || 1;
      this.coolT -= dt;
      let vx = 0;
      let vz = 0;
      if (!this.aggro) {
        // On patrol: march to and fro, turning at edges, walls and a few cells from its post.
        const away = (b.x - this.home.x) * this.dir[0] + (b.z - this.home.z) * this.dir[1] > 4;
        if (!this.safeAhead(this.dir[0], this.dir[1]) || b.bumped || away) this.dir = [-this.dir[0], -this.dir[1]];
        vx = this.dir[0] * 1.4;
        vz = this.dir[1] * 1.4;
        this.yaw = dampAngle(this.yaw, Math.atan2(this.dir[0], this.dir[1]), 6, dt);
      } else if (this.aimT > 0) {
        // The warning: it plants its feet and its lens glows brighter and brighter.
        this.aimT -= dt;
        this.facePlayer(dt, 7);
        if (this.aimT <= 0) {
          this.burst = T.shots;
          this.burstT = 0;
        }
      } else if (this.burst > 0) {
        this.facePlayer(dt, 2.5);
        this.burstT -= dt;
        if (this.burstT <= 0) this.fire(d);
      } else {
        // Sidestep across Jason's line of fire, closing in or backing off to keep about 7 units away.
        this.facePlayer(dt, 6);
        this.strafeT -= dt;
        if (this.strafeT <= 0) {
          this.side = -this.side;
          this.strafeT = 1.2 + Math.random() * 1.3;
        }
        const nx = dx / d;
        const nz = dz / d;
        const range = d > 9 ? 0.9 : d < 5 ? -0.9 : 0;
        let mx = -nz * this.side + nx * range;
        let mz = nx * this.side + nz * range;
        if (!this.safeAhead(mx, mz) || b.bumped) {
          this.side = -this.side;
          this.strafeT = 1.5;
          mx = nx * range;
          mz = nz * range;
        }
        const m = Math.hypot(mx, mz);
        if (m > 0.01 && this.safeAhead(mx, mz)) {
          vx = (mx / m) * 2.6 * this.spd;
          vz = (mz / m) * 2.6 * this.spd;
        }
        if (this.coolT <= 0 && d < T.range && Math.abs(p.y - b.y) < 4) {
          this.aimT = T.aim;
          this.world.soundAt('blip', b.x, b.z, 1.6, 18);
        }
      }
      b.vx = damp(b.vx, vx, 8, dt);
      b.vz = damp(b.vz, vz, 8, dt);
      this.animate(dt);
    }

    private fire(d: number) {
      const b = this.body;
      const p = this.player.body;
      this.burstT = T.gap;
      this.burst -= 1;
      if (this.burst === 0) this.coolT = T.rest / this.rate;
      const s = this.model.root.scale.y;
      const fx = Math.sin(this.yaw);
      const fz = Math.cos(this.yaw);
      const from = new THREE.Vector3(b.x + fx * 1.1 * s + fz * 0.16, b.y + 1.1 * s, b.z + fz * 1.1 * s - fx * 0.16);
      // Aims where Jason is now (no leading), so running sideways always dodges it.
      const to = new THREE.Vector3(p.x, p.y + 0.9, p.z);
      const dir = to.sub(from).normalize();
      if (d < 1.5) dir.set(fx, 0, fz);
      this.world.shots.fire('enemy', from, dir, T.speed * Math.min(this.spd, 1.25), 1);
      this.world.soundAt('enemyShoot', b.x, b.z, 1.15, 22);
      this.world.particles.emit(from.x, from.y, from.z, { count: 5, color: '#ffd166', speed: 3, life: 0.2, size: 0.35 });
      this.model.parts.gun.position.z = 0.3;
    }

    private animate(dt: number) {
      const m = this.model;
      const b = this.body;
      const speed = Math.hypot(b.vx, b.vz);
      this.stride += dt * speed * 3.2;
      const swing = Math.sin(this.stride) * Math.min(1, speed / 1.5) * 0.6;
      const legs = m.limbs ?? [];
      if (legs[0]) legs[0].rotation.x = swing;
      if (legs[1]) legs[1].rotation.x = -swing;
      m.body.position.y = Math.abs(Math.cos(this.stride)) * 0.05 * Math.min(1, speed);
      m.parts.gun.position.z = damp(m.parts.gun.position.z, 0.42, 12, dt);
      // Lens: calm glow, swelling to a bright flare during the warning and while firing.
      const warn = this.aimT > 0 ? 1 - this.aimT / T.aim : this.burst > 0 ? 1 : 0;
      const lens = m.mats?.lens;
      if (lens) lens.emissiveIntensity = 2 + warn * 5 + (warn > 0 ? Math.sin(this.t * 40) * 0.8 : 0);
      const flare = m.parts.flare as THREE.Sprite;
      (flare.material as THREE.SpriteMaterial).opacity = warn * 0.95;
      flare.scale.setScalar(0.4 + warn * 1.1);
    }
  };
}

/* ---------------- Roller Mine: rolls up, beeps, pops ---------------- */

function minebotClass() {
  const T = ROBOT_TUNING.minebot;
  return class Minebot extends Enemy {
    private state: 'idle' | 'roll' | 'fuse' = 'idle';
    private stateT = 0;
    private fuseT = 0;
    private beepT = 0;
    private boomed = false;
    private warn = new WarnCircle(T.blast);

    constructor(world: World, id: string, x: number, y: number, z: number) {
      super(world, id, x, y, z, T.hp, 0.5, makeMinebot());
      this.bolts = 3;
      this.heartChance = 0.08;
      this.aimHeight = 0.6;
      this.kind = 'minebot';
      this.badgeY = 1.75;
      // It is a bomb, not a biter: bumping into it does nothing, only its pop hurts.
      this.contact = false;
      this.obj.add(this.warn.group);
    }

    protected onWake() {
      this.world.soundAt('blip', this.body.x, this.body.z, 2.2, 18);
    }

    protected think(dt: number) {
      const b = this.body;
      const p = this.player.body;
      const dx = p.x - b.x;
      const dz = p.z - b.z;
      const d = Math.hypot(dx, dz) || 1;
      const m = this.model;
      this.stateT += dt;
      if (this.state === 'idle') {
        b.vx = damp(b.vx, 0, 6, dt);
        b.vz = damp(b.vz, 0, 6, dt);
        m.parts.head.rotation.y = Math.sin(this.t * 1.3) * 0.9;
        if (this.aggro) this.go('roll');
      } else if (this.state === 'roll') {
        this.facePlayer(dt, 5);
        m.parts.head.rotation.y = damp(m.parts.head.rotation.y, 0, 8, dt);
        const s = T.roll * this.spd;
        const ok = this.safeAhead(dx, dz);
        b.vx = damp(b.vx, ok ? (dx / d) * s : 0, 5, dt);
        b.vz = damp(b.vz, ok ? (dz / d) * s : 0, 5, dt);
        if (d < 1.9 || (this.stateT > 5 && d < 4) || (!ok && d < 3)) this.go('fuse');
        else if (!this.aggro) this.go('idle');
      } else {
        // The warning: it stops, blinks red, beeps faster and faster and puffs up. Then: pop!
        b.vx = damp(b.vx, 0, 10, dt);
        b.vz = damp(b.vz, 0, 10, dt);
        this.fuseT -= dt;
        const k = 1 - Math.max(0, this.fuseT) / T.fuse;
        this.beepT -= dt;
        if (this.beepT <= 0) {
          this.beepT = 0.28 - k * 0.2;
          this.world.soundAt('blip', b.x, b.z, 1.6 + k * 1.4, 20);
        }
        this.warn.show(b.x, b.y, b.z, k, this.t);
        m.body.scale.setScalar(1 + k * 0.22 + Math.sin(this.t * 50) * 0.03 * k);
        if (this.fuseT <= 0) {
          this.detonate();
          return;
        }
      }
      // The ball rolls under its little head; the antenna light blinks faster when it is about to pop.
      const speed = Math.hypot(b.vx, b.vz);
      m.parts.ball.rotation.x += (speed * dt) / 0.46;
      const fuse = this.state === 'fuse';
      const rate = fuse ? 6 + (1 - this.fuseT / T.fuse) * 14 : this.aggro ? 3 : 1;
      const on = Math.sin(this.t * rate * Math.PI) > 0;
      const light = m.mats?.light;
      if (light) light.emissiveIntensity = on ? (fuse ? 6 : 2.5) : 0.3;
      const flare = m.parts.flare as THREE.Sprite;
      (flare.material as THREE.SpriteMaterial).opacity = fuse && on ? 0.9 : 0;
      flare.scale.setScalar(fuse ? 1.2 : 0.5);
    }

    private go(state: 'idle' | 'roll' | 'fuse') {
      this.state = state;
      this.stateT = 0;
      if (state === 'fuse') {
        this.fuseT = T.fuse;
        this.beepT = 0;
      }
    }

    private detonate() {
      const b = this.body;
      const p = this.player.body;
      const at = new THREE.Vector3(b.x, b.y + 0.6, b.z);
      if (Math.hypot(p.x - b.x, p.z - b.z) < T.blast + p.r * 0.5 && Math.abs(p.y - b.y) < 2) this.player.hurt(1, b.x, b.z);
      // It blew itself up: barely anything left to collect.
      this.boomed = true;
      this.bolts = 1;
      this.heartChance = 0;
      this.die();
      // The pop also knocks out crates and other robots and creatures close by.
      this.world.explode(at, T.blast - 0.5, 2);
    }

    die() {
      if (!this.alive) return;
      this.warn.hide();
      if (!this.boomed) {
        // Blasted before it could pop: it just fizzles out with a puff of smoke.
        this.world.particles.emit(this.aim.x, this.aim.y, this.aim.z, { count: 14, color: '#8a8f80', speed: 2.5, up: 2, life: 0.8, size: 0.7, gravity: -1 });
      }
      super.die();
    }
  };
}

/* ---------------- Shield Bulwark: blocks from the front, weak behind ---------------- */

/** Decks where LUX already told Jason how to get past the Bulwark's shield. */
const shieldHinted = new WeakSet<World>();

function bulwarkClass() {
  const T = ROBOT_TUNING.bulwark;
  return class Bulwark extends Enemy {
    private downT = 0;
    private windT = 0;
    private bashT = 0;
    private cd = 2;
    private lower = 0;

    constructor(world: World, id: string, x: number, y: number, z: number) {
      super(world, id, x, y, z, T.hp, 0.9, makeBulwark());
      this.bolts = 10;
      this.heartChance = 0.45;
      this.aimHeight = 1.3;
      this.kind = 'bulwark';
      this.badgeY = 2.9;
    }

    private get shieldUp() {
      return this.downT <= 0;
    }

    /** -1 straight behind it, 1 straight in front of it. */
    private facingDot(from: THREE.Vector3) {
      const dx = from.x - this.body.x;
      const dz = from.z - this.body.z;
      const d = Math.hypot(dx, dz) || 1;
      return (dx * Math.sin(this.yaw) + dz * Math.cos(this.yaw)) / d;
    }

    hit(dmg: number, kind: HitKind, from: THREE.Vector3): boolean {
      if (!this.alive) return false;
      // A ground pound shakes the shield out of its hands; LUX's zap and pulse jolt its arm.
      const knocks = kind === 'pound' || kind === 'zap' || kind === 'pulse' || kind === 'blast' || kind === 'smash';
      if (this.shieldUp && !knocks && this.facingDot(from) > 0.3) {
        this.block(from);
        return true;
      }
      if (this.shieldUp && knocks) this.dropShield();
      const back = this.facingDot(from) < -0.3;
      const ok = super.hit(back ? dmg * 2 : dmg, kind, from);
      // Heavy: knockback barely moves it.
      this.body.vx *= 0.3;
      this.body.vz *= 0.3;
      if (back && this.alive) this.world.particles.emit(this.aim.x, this.aim.y, this.aim.z, { count: 12, color: LEGION.pollen, speed: 4, life: 0.4, size: 0.4 });
      return ok;
    }

    private block(from: THREE.Vector3) {
      const fx = Math.sin(this.yaw);
      const fz = Math.cos(this.yaw);
      const s = this.model.root.scale.y;
      const x = this.body.x + fx * 1.05 * s;
      const z = this.body.z + fz * 1.05 * s;
      const y = Math.min(this.body.y + 2 * s, Math.max(this.body.y + 0.4, from.y));
      this.world.particles.emit(x, y, z, { count: 10, color: '#ffd166', speed: 5, life: 0.3, size: 0.35 });
      this.world.soundAt('shield', this.body.x, this.body.z, 1.4, 20);
      this.model.parts.shield.position.z = 0.88;
      if (!shieldHinted.has(this.world)) {
        shieldHinted.add(this.world);
        this.world.hooks.toast('Its shield blocks shots! Get behind it, or ground-pound near it!', 'bolt');
      }
    }

    private dropShield() {
      this.downT = T.down;
      this.windT = 0;
      this.bashT = 0;
      this.world.soundAt('break', this.body.x, this.body.z, 0.7, 20);
      this.world.particles.emit(this.body.x, this.body.y + 0.3, this.body.z, { count: 16, color: '#a89a7a', speed: 4, up: 1, life: 0.6, size: 0.7 });
    }

    protected think(dt: number) {
      const b = this.body;
      const p = this.player.body;
      const dx = p.x - b.x;
      const dz = p.z - b.z;
      const d = Math.hypot(dx, dz) || 1;
      const m = this.model;
      this.cd -= dt;
      let walk = 0;
      if (this.downT > 0) {
        // Shield on the ground: it fumbles for it, wide open from every side.
        this.downT -= dt;
        if (Math.random() < 0.15) this.world.particles.emit(b.x, b.y + 2.6, b.z, { count: 1, color: '#ffd166', speed: 1.5, life: 0.5, size: 0.5, gravity: 0 });
        if (this.downT <= 0) {
          this.world.soundAt('shield', b.x, b.z, 0.8, 20);
          this.cd = Math.max(this.cd, 1);
        }
      } else if (this.windT > 0) {
        // The warning: it pulls the shield back and its visor flashes. Then it shoves.
        this.windT -= dt;
        this.turnTo(Math.atan2(dx, dz), dt, 0.6);
        if (this.windT <= 0) {
          this.bashT = 0.3;
          this.world.soundAt('pound', b.x, b.z, 1.3, 18);
        }
      } else if (this.bashT > 0) {
        this.bashT -= dt;
        const fx = Math.sin(this.yaw);
        const fz = Math.cos(this.yaw);
        b.vx = fx * 7 * this.spd;
        b.vz = fz * 7 * this.spd;
        if (!this.safeAhead(fx, fz)) {
          b.vx = 0;
          b.vz = 0;
        }
        const ahead = dx * fx + dz * fz;
        if (ahead > 0 && ahead < 2.4 * m.root.scale.y && Math.abs(dx * fz - dz * fx) < 1.3 && Math.abs(p.y - b.y) < 1.5) {
          this.player.hurt(1, b.x, b.z);
          this.bashT = 0;
        }
        if (this.bashT <= 0) this.cd = 2.6 / this.rate;
      } else if (this.aggro) {
        // Plods toward Jason, turning slowly: quick feet can run round to its back.
        this.turnTo(Math.atan2(dx, dz), dt, 1);
        const fx = Math.sin(this.yaw);
        const fz = Math.cos(this.yaw);
        if (d > 2.3 && this.safeAhead(fx, fz)) walk = T.walk * this.spd;
        if (d < 3 && this.cd <= 0 && (dx * fx + dz * fz) / d > 0.6) this.windT = T.wind;
      }
      if (this.bashT <= 0) {
        b.vx = damp(b.vx, Math.sin(this.yaw) * walk, 6, dt);
        b.vz = damp(b.vz, Math.cos(this.yaw) * walk, 6, dt);
      }
      this.animate(dt, walk);
    }

    /** Swings toward an angle, but never faster than its slow turn speed. */
    private turnTo(target: number, dt: number, k: number) {
      let a = (target - this.yaw) % (Math.PI * 2);
      if (a > Math.PI) a -= Math.PI * 2;
      if (a < -Math.PI) a += Math.PI * 2;
      const max = T.turn * k * (this.elite ? 1.15 : 1) * dt;
      this.yaw += Math.max(-max, Math.min(max, a));
    }

    private animate(dt: number, walk: number) {
      const m = this.model;
      const legs = m.limbs ?? [];
      const step = Math.sin(this.t * 4) * Math.min(1, walk) * 0.35;
      if (legs[0]) legs[0].rotation.x = step;
      if (legs[1]) legs[1].rotation.x = -step;
      m.body.rotation.z = step * 0.12;
      // Shield: held high, pulled back for a bash, or lying on the ground.
      this.lower = damp(this.lower, this.downT > 0 ? 1 : 0, 6, dt);
      const sh = m.parts.shield;
      const pull = this.windT > 0 ? 1 - this.windT / ROBOT_TUNING.bulwark.wind : 0;
      const push = this.bashT > 0 ? 1 : 0;
      sh.position.z = damp(sh.position.z, 0.98 - pull * 0.35 + push * 0.4 + this.lower * 0.6, 14, dt);
      sh.position.y = 1.12 - this.lower * 0.95;
      sh.rotation.x = this.lower * 1.35;
      const eye = m.mats?.eye;
      if (eye) eye.emissiveIntensity = 2.6 + pull * 5 + (pull > 0 ? Math.sin(this.t * 40) : 0);
      const core = m.mats?.core;
      if (core) core.emissiveIntensity = this.downT > 0 ? 3.5 + Math.sin(this.t * 14) * 1.2 : 2.4 + Math.sin(this.t * 3) * 0.4;
    }
  };
}

/* ---------------- Mortar Bot: lobs shells onto red target circles ---------------- */

function mortarClass() {
  const T = ROBOT_TUNING.mortar;
  return class Mortar extends Enemy {
    private coolT = 1.5 + T.charge;
    private recoil = 0;
    private pitch = 0.7;

    constructor(world: World, id: string, x: number, y: number, z: number) {
      super(world, id, x, y, z, T.hp, 0.75, makeMortar());
      this.bolts = 6;
      this.heartChance = 0.2;
      this.aimHeight = 0.8;
      this.kind = 'mortar';
      this.badgeY = 2.3;
    }

    protected think(dt: number) {
      const b = this.body;
      const p = this.player.body;
      const dx = p.x - b.x;
      const dz = p.z - b.z;
      const d = Math.hypot(dx, dz) || 1;
      const m = this.model;
      let vx = 0;
      let vz = 0;
      let charge = 0;
      if (this.aggro) {
        this.facePlayer(dt, 3);
        if (d <= T.minRange) {
          // Too close to aim at: it shuffles backwards, beeping crossly.
          if (this.safeAhead(-dx, -dz)) {
            vx = (-dx / d) * 1.1;
            vz = (-dz / d) * 1.1;
          }
          this.coolT = Math.max(this.coolT, T.charge + 0.3);
        } else if (d < T.range && Math.abs(p.y - b.y) < 6) {
          this.coolT -= dt;
          charge = Math.max(0, 1 - this.coolT / T.charge);
          if (this.coolT <= 0) {
            this.fire();
            this.coolT = T.rest / this.rate + T.charge;
          }
        }
        this.pitch = damp(this.pitch, 0.35 + Math.min(1, d / T.range) * 0.45, 3, dt);
      } else {
        this.pitch = damp(this.pitch, 0.7, 3, dt);
      }
      b.vx = damp(b.vx, vx, 8, dt);
      b.vz = damp(b.vz, vz, 8, dt);
      // Barrel tilts with range, fills with pink light before each shot, and kicks back when it fires.
      this.recoil = Math.max(0, this.recoil - dt * 3);
      m.parts.barrel.rotation.x = this.pitch - this.recoil * 0.25;
      m.parts.tube.position.y = -this.recoil * 0.25;
      m.parts.tube.scale.setScalar(1 + charge * 0.12);
      const c = m.mats?.charge;
      if (c) c.emissiveIntensity = 1 + charge * 6;
      const glowS = m.parts.chargeGlow as THREE.Sprite;
      (glowS.material as THREE.SpriteMaterial).opacity = charge * 0.9;
      const flare = m.parts.flare as THREE.Sprite;
      (flare.material as THREE.SpriteMaterial).opacity = charge * 0.6;
      flare.scale.setScalar(0.4 + charge * 0.6);
      const legs = m.limbs ?? [];
      const shuffle = Math.hypot(b.vx, b.vz) > 0.2 ? Math.sin(this.t * 14) * 0.25 : 0;
      legs.forEach((l, i) => (l.rotation.x = i % 2 ? shuffle : -shuffle));
    }

    private fire() {
      const b = this.body;
      const p = this.player.body;
      const s = this.model.root.scale.y;
      const from = new THREE.Vector3(b.x + Math.sin(this.yaw) * 0.6 * s, b.y + 1.8 * s, b.z + Math.cos(this.yaw) * 0.6 * s);
      const targets = [new THREE.Vector3(p.x, 0, p.z)];
      // Elites (and the last regions) send a second shell where Jason is running to.
      if (this.elite || this.tier >= 9) targets.push(this.lead(0.9).setY(0));
      for (const t of targets) {
        t.y = floorAt(this.world, t.x, t.z, p.y);
        this.world.addEntity(new MortarShell(this.world, from.clone(), t, T.flight, T.splash));
      }
      this.recoil = 1;
      this.world.soundAt('enemyShoot', b.x, b.z, 0.55, 24);
      this.world.particles.emit(from.x, from.y, from.z, { count: 10, color: '#c8c0b0', speed: 2.5, up: 2, life: 0.6, size: 0.7, gravity: -1 });
    }
  };
}
