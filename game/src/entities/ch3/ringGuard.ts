import * as THREE from 'three';

import { audio } from '../../core/audio';
import { damp } from '../../core/math';
import type { World } from '../../game/world';
import { Grid } from '../../world/grid';
import type { EnemyModel } from '../aliens';
import { Enemy } from '../enemies';
import type { HitKind } from '../entity';
import { blobShadow, boxG, capsule, cone, cyl, glowSprite, mat, mesh, ownMat, sphere, torus } from '../models';

/**
 * A RING GUARD, one of Aeëtes's gold butler robots (chapter 3, the Golden Fleece): a tall, polite gold
 * robot with a bow tie, one red eye and a big gold ring it holds up in front like a shield. Shots from
 * the front ping off the ring. Every few seconds it winds up (the ring glows and spins in its hand) and
 * throws the ring like a boomerang: it skims out at knee height toward the hero and comes back. Jump
 * over the ring, and while it's away the guard has nothing to hide behind.
 */
export const RING_GUARD = {
  hp: 4,
  /** How close it likes to stand, and its walking speed. */
  keep: 6,
  speed: 2.2,
  /** The glowing wind-up before a throw, the ring's flight out and back, and the rest between throws. */
  windup: 0.9,
  flight: 2.3,
  rest: 2.6,
  /** Farthest the ring flies, and the height of its flight above the guard's feet. */
  reach: 9,
  ringY: 0.5,
  /** Half-angle (radians) of the front the ring covers while it's held up. */
  guardArc: 1.2,
};

type Mode = 'guard' | 'windup' | 'throw';

const tmp = new THREE.Vector3();

/** The gold butler robot. Feet at the origin, facing +z. */
function makeRingGuardModel(): EnemyModel & { eyeMat: THREE.MeshStandardMaterial } {
  const root = new THREE.Group();
  const body = new THREE.Group();
  const gold = ownMat('#e8b83a', { metal: 0.8, rough: 0.25 });
  const dark = mat('#3a2a3a', { metal: 0.4, rough: 0.5 });
  const white = mat('#fff6e8', { rough: 0.6 });
  const eyeMat = ownMat('#ff3a4c', { emissive: '#ff3a4c', ei: 2.2 });
  // A hovering base instead of legs (it glides like a very fancy waiter).
  const base = mesh(cyl(0.34, 0.42, 0.3, 18), dark, 0, 0.32, 0);
  body.add(base);
  body.add(glowSprite('#ffd166', 1.1, 0.5).translateY(0.12));
  // Egg-shaped gold body with a white shirt front and a red bow tie.
  const torso = mesh(sphere(0.42, 20), gold, 0, 1.0, 0);
  torso.scale.set(1, 1.25, 0.9);
  body.add(torso);
  const shirt = mesh(sphere(0.3, 16), white, 0, 1.05, 0.17);
  shirt.scale.set(0.8, 1.2, 0.6);
  body.add(shirt);
  for (const sx of [-1, 1]) {
    const bow = mesh(cone(0.09, 0.16, 4), mat('#c8202e', { rough: 0.5 }), sx * 0.08, 1.36, 0.36);
    bow.rotation.z = sx * Math.PI / 2;
    body.add(bow);
  }
  // Head: a gold dome with one wide red eye and a little antenna.
  const head = mesh(sphere(0.26, 18), gold, 0, 1.72, 0);
  head.scale.set(1, 0.9, 1);
  body.add(head);
  const eye = mesh(boxG(0.3, 0.07, 0.06), eyeMat, 0, 1.74, 0.23);
  body.add(eye);
  body.add(mesh(cyl(0.015, 0.015, 0.22, 6), dark, 0, 2.0, 0));
  body.add(mesh(sphere(0.05, 8), eyeMat, 0, 2.12, 0));
  // Thin arms reaching forward to hold the ring.
  const limbs: THREE.Object3D[] = [];
  for (const sx of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(sx * 0.4, 1.2, 0.05);
    const a = mesh(capsule(0.06, 0.4), gold, 0, -0.1, 0.2);
    a.rotation.x = Math.PI / 2.4;
    arm.add(a);
    arm.add(mesh(sphere(0.08, 10), white, 0, -0.18, 0.44));
    body.add(arm);
    limbs.push(arm);
  }
  root.add(body, blobShadow(1.1));
  return { root, body, flash: [gold], parts: { torso, head }, limbs, mats: { gold, eye: eyeMat }, eyeMat };
}

let RingGuardClass: (new (world: World, id: string, x: number, y: number, z: number) => Enemy) | null = null;

/** Builds a ring guard (the class extends `Enemy`, so it is defined on first use, like the harpy drones). */
export function makeRingGuard(world: World, id: string, x: number, y: number, z: number): Enemy {
  RingGuardClass ??= ringGuardClass();
  return new RingGuardClass(world, id, x, y, z);
}

function ringGuardClass() {
  return class RingGuard extends Enemy {
    private mode: Mode = 'guard';
    private modeT = 1.5 + Math.random();
    private ring = new THREE.Group();
    private ringMat: THREE.MeshStandardMaterial;
    private ringGlow: THREE.Sprite;
    private flightT = 0;
    private from = new THREE.Vector3();
    private to = new THREE.Vector3();
    private ringPos = new THREE.Vector3();
    private hitThisThrow = false;
    private m: ReturnType<typeof makeRingGuardModel>;

    constructor(world: World, id: string, x: number, y: number, z: number) {
      const model = makeRingGuardModel();
      super(world, id, x, y, z, RING_GUARD.hp, 0.5, model);
      this.m = model;
      this.kind = 'ringguard';
      this.bolts = 4;
      this.aimHeight = 1.1;
      this.badgeY = 2.5;
      this.ringMat = ownMat('#ffd166', { emissive: '#ffb020', ei: 0.6, metal: 0.85, rough: 0.2 });
      const band = mesh(torus(0.62, 0.08), this.ringMat, 0, 0, 0, false);
      const shield = new THREE.Mesh(new THREE.CircleGeometry(0.56, 28), new THREE.MeshBasicMaterial({ color: '#ffe8a0', transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }));
      this.ringGlow = glowSprite('#ffd166', 2.2, 0.35);
      this.ring.add(band, shield, this.ringGlow);
      this.obj.add(this.ring);
    }

    /** The ring held up in front stops anything coming from ahead (unless the ring is away). */
    protected canBeHit(kind: HitKind, from: THREE.Vector3) {
      if (this.mode === 'throw' || kind === 'pound' || kind === 'pulse' || kind === 'blast' || kind === 'smash') return true;
      const a = Math.atan2(from.x - this.body.x, from.z - this.body.z);
      let d = Math.abs(a - this.yaw) % (Math.PI * 2);
      if (d > Math.PI) d = Math.PI * 2 - d;
      if (d < RING_GUARD.guardArc) {
        this.ringMat.emissiveIntensity = 2.5;
        audio.play('zap', 2.4, 0.5);
        return false;
      }
      return true;
    }

    private setMode(m: Mode, t: number) {
      this.mode = m;
      this.modeT = t;
    }

    protected think(dt: number) {
      const b = this.body;
      const T = RING_GUARD;
      this.modeT -= dt * this.rate;
      let move = 0;
      switch (this.mode) {
        case 'guard': {
          this.facePlayer(dt, 6);
          if (!this.aggro) break;
          // Glides to a polite distance and keeps it.
          const d = this.distToPlayer();
          move = d > T.keep + 1 ? 1 : d < T.keep - 2 ? -0.6 : 0;
          if (this.modeT <= 0 && d < T.reach + 2) {
            this.setMode('windup', T.windup);
            audio.play('charged', 1.6, 0.5);
          }
          break;
        }
        case 'windup':
          this.facePlayer(dt, 8);
          if (this.modeT <= 0) {
            // Out it goes, toward where the hero is heading, and back.
            this.setMode('throw', T.flight);
            this.flightT = 0;
            this.hitThisThrow = false;
            this.from.set(b.x, b.y + T.ringY, b.z);
            this.lead(0.3, this.to);
            const dx = this.to.x - b.x;
            const dz = this.to.z - b.z;
            const len = Math.hypot(dx, dz) || 1;
            const reach = Math.min(T.reach, len + 2.5);
            this.to.set(b.x + (dx / len) * reach, b.y + T.ringY, b.z + (dz / len) * reach);
            audio.play('glide', 1.6, 0.6);
          }
          break;
        case 'throw':
          // No ring to hide behind: it backs away a little, flapping its arms.
          this.facePlayer(dt, 3);
          if (this.modeT <= 0) this.setMode('guard', T.rest);
          break;
      }
      if (move !== 0) {
        const dx = Math.sin(this.yaw) * move;
        const dz = Math.cos(this.yaw) * move;
        if (this.safeAhead(dx, dz)) {
          b.vx = damp(b.vx, dx * T.speed * this.spd, 6, dt);
          b.vz = damp(b.vz, dz * T.speed * this.spd, 6, dt);
        } else {
          b.vx = damp(b.vx, 0, 8, dt);
          b.vz = damp(b.vz, 0, 8, dt);
        }
      } else {
        b.vx = damp(b.vx, 0, 8, dt);
        b.vz = damp(b.vz, 0, 8, dt);
      }
    }

    update(dt: number) {
      super.update(dt);
      if (!this.alive) return;
      this.pose(dt);
    }

    /** Where the ring is: in the guard's hands, spinning while it winds up, or skimming out and back. */
    private pose(dt: number) {
      const b = this.body;
      const T = RING_GUARD;
      const fx = Math.sin(this.yaw);
      const fz = Math.cos(this.yaw);
      const r = this.ring;
      this.ringMat.emissiveIntensity = damp(this.ringMat.emissiveIntensity, this.mode === 'windup' ? 2.2 : 0.6, 6, dt);
      this.ringGlow.material.opacity = this.mode === 'guard' ? 0.25 : 0.6;
      const arms = this.m.limbs ?? [];
      if (this.mode === 'throw') {
        this.flightT += dt * this.tempo;
        const k = Math.min(1, this.flightT / T.flight);
        // Out (ease-out), then home to wherever the guard is now (ease-in).
        if (k < 0.5) this.ringPos.lerpVectors(this.from, this.to, 1 - (1 - k * 2) ** 2);
        else this.ringPos.lerpVectors(this.to, tmp.set(b.x, b.y + T.ringY, b.z), (k * 2 - 1) ** 2);
        r.position.copy(this.ringPos);
        r.rotation.set(-Math.PI / 2, 0, this.t * 14);
        if (Math.random() < 0.5) this.world.particles.emit(this.ringPos.x, this.ringPos.y, this.ringPos.z, { count: 1, color: '#ffd166', speed: 0.4, life: 0.35, size: 0.4, gravity: 0 });
        this.ringHits();
        for (const a of arms) a.rotation.x = Math.sin(this.t * 12) * 0.6;
        // It never flies through walls: a wall in the way sends it straight home.
        if (k < 0.5 && this.world.grid.cell(Grid.toCell(this.ringPos.x), Grid.toCell(this.ringPos.z)).kind === 'wall') {
          this.to.copy(this.ringPos);
          this.flightT = T.flight / 2;
        }
      } else {
        const spin = this.mode === 'windup' ? this.t * 18 : 0;
        r.position.set(b.x + fx * 0.75, b.y + 1.15, b.z + fz * 0.75);
        r.rotation.set(0, this.yaw, spin);
        for (const a of arms) a.rotation.x = 0;
      }
    }

    /** The skimming ring knocks the hero over unless they jump it (once per throw). */
    private ringHits() {
      if (this.hitThisThrow || this.world.cutscene) return;
      const p = this.player.body;
      const dx = p.x - this.ringPos.x;
      const dz = p.z - this.ringPos.z;
      if (dx * dx + dz * dz > 1.0 || p.y > this.ringPos.y + 0.35 || p.y + p.h < this.ringPos.y - 0.4) return;
      if (this.player.shieldBlocks(this.ringPos.x, this.ringPos.z)) {
        // CLANG: General Brennus's shield bats it straight back home.
        audio.play('zap', 1.2);
        this.to.copy(this.ringPos);
        this.flightT = Math.max(this.flightT, RING_GUARD.flight / 2);
        this.hitThisThrow = true;
        return;
      }
      this.hitThisThrow = true;
      this.player.hurt(1, this.ringPos.x, this.ringPos.z);
    }
  };
}
