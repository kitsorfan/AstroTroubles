import * as THREE from 'three';

import { audio } from '../../core/audio';
import type { World } from '../../game/world';
import type { EnemyModel } from '../aliens';
import { Enemy } from '../enemies';
import type { HitKind } from '../entity';
import { blobShadow, boxG, cyl, glowSprite, mat, mesh, ownMat, sphere } from '../models';

/**
 * A CRAB-DRONE, one of Aeëtes's gold reef robots (Scylla's Reef). It scuttles sideways around the
 * hero, holding its two big claws up in front like a shield (shots from the front just ping off).
 * Every few seconds it rears up, opens its claws wide and shakes them (the warning), then lunges
 * and SNAPS. Right after a snap its claws hang open and its soft middle shows: that's the moment to
 * blast it, or hit it from the side or behind, or jump on it with a ground pound.
 */
export const CRAB_TUNING = {
  hp: 3,
  /** How close it circles, how fast it scuttles, and the reach of a snap. */
  orbit: 3.4,
  speed: 3.2,
  reach: 2.3,
  /** The open-claws warning, the snap, and how long its guard stays down afterwards. */
  warn: 0.75,
  lunge: 0.3,
  open: 1.4,
  rest: 2.6,
};

type Mode = 'idle' | 'circle' | 'warn' | 'lunge' | 'open';

/** The crab-drone: a gold shell with coral spots, stalk eyes, six legs and two big claws. */
export function makeCrabModel(): EnemyModel & { claws: THREE.Group[]; jaws: THREE.Object3D[]; legs: THREE.Object3D[]; eyeMat: THREE.MeshStandardMaterial } {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const shell = ownMat('#f2a84e', { emissive: '#ff8a2a', ei: 0.08, rough: 0.35, metal: 0.6 });
  const dark = mat('#a8602a', { rough: 0.45, metal: 0.5 });
  const spot = mat('#ff6a7a', { rough: 0.5 });
  const eyeMat = ownMat('#ff3a4c', { emissive: '#ff3a4c', ei: 2 });
  const top = mesh(sphere(0.55, 16), shell, 0, 0.55, 0);
  top.scale.set(1.25, 0.55, 1);
  body.add(top);
  body.add(mesh(cyl(0.62, 0.5, 0.18, 14), dark, 0, 0.42, 0));
  for (const [x, z] of [
    [0.3, -0.15],
    [-0.35, 0.05],
    [0.05, 0.3],
  ]) {
    const s = mesh(sphere(0.1, 8), spot, x, 0.8, z, false);
    s.scale.set(1, 0.4, 1);
    body.add(s);
  }
  // Eyes on stalks.
  for (const sx of [-1, 1]) {
    body.add(mesh(cyl(0.035, 0.04, 0.32, 6), dark, sx * 0.18, 0.9, 0.38));
    body.add(mesh(sphere(0.085, 10), eyeMat, sx * 0.18, 1.07, 0.4, false));
  }
  // Six legs, three a side, bent like little tents.
  const legs: THREE.Object3D[] = [];
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const leg = new THREE.Group();
      leg.position.set(sx * 0.55, 0.42, -0.25 + i * 0.25);
      const up = mesh(cyl(0.04, 0.05, 0.45, 6), dark, sx * 0.18, 0.08, 0);
      up.rotation.z = sx * -1.1;
      const down = mesh(cyl(0.035, 0.02, 0.5, 6), dark, sx * 0.4, -0.18, 0);
      down.rotation.z = sx * 0.35;
      leg.add(up, down);
      body.add(leg);
      legs.push(leg);
    }
  }
  // Two big claws held up in front: an arm, and a pincer of two jaws.
  const claws: THREE.Group[] = [];
  const jaws: THREE.Object3D[] = [];
  for (const sx of [-1, 1]) {
    const c = new THREE.Group();
    c.position.set(sx * 0.42, 0.62, 0.5);
    const arm = mesh(cyl(0.07, 0.09, 0.4, 8), dark, 0, 0, 0.12);
    arm.rotation.x = Math.PI / 2;
    c.add(arm);
    const upper = new THREE.Group();
    upper.position.set(0, 0.04, 0.34);
    const u = mesh(boxG(0.3, 0.14, 0.42), shell, 0, 0.06, 0.18);
    upper.add(u);
    const lower = new THREE.Group();
    lower.position.set(0, -0.04, 0.34);
    lower.add(mesh(boxG(0.24, 0.1, 0.36), dark, 0, -0.04, 0.16));
    c.add(upper, lower);
    body.add(c);
    claws.push(c);
    jaws.push(upper, lower);
  }
  const glow = glowSprite('#ffb04a', 1.4, 0.18);
  glow.position.y = 0.6;
  body.add(glow);
  const shadow = blobShadow(1.8);
  root.add(shadow);
  return { root, body, flash: [shell], parts: { shadow }, claws, jaws, legs, eyeMat };
}

let CrabClass: (new (world: World, id: string, x: number, y: number, z: number) => Enemy) | null = null;

/** Builds a crab-drone (the class extends `Enemy`, so it is defined on first use, like the harpies). */
export function makeCrab(world: World, id: string, x: number, y: number, z: number): Enemy {
  CrabClass ??= crabClass();
  return new CrabClass(world, id, x, y, z);
}

function crabClass() {
  const T = CRAB_TUNING;
  return class Crab extends Enemy {
    private mode: Mode = 'idle';
    private modeT = 1 + Math.random();
    private side = Math.random() < 0.5 ? 1 : -1;
    private m: ReturnType<typeof makeCrabModel>;
    private lungeDir = new THREE.Vector3();
    private bitten = false;

    constructor(world: World, id: string, x: number, y: number, z: number) {
      const model = makeCrabModel();
      super(world, id, x, y, z, T.hp, 0.7, model);
      this.m = model;
      this.kind = 'crab';
      this.contact = false;
      this.bolts = 4;
      this.aimHeight = 0.6;
      this.badgeY = 1.6;
    }

    /** The claws guard the front, except while they hang open after a snap. */
    protected canBeHit(kind: HitKind, from: THREE.Vector3) {
      if (this.mode === 'open' || this.mode === 'lunge' || kind !== 'shot') return true;
      const fx = Math.sin(this.yaw);
      const fz = Math.cos(this.yaw);
      const dx = from.x - this.body.x;
      const dz = from.z - this.body.z;
      const d = Math.hypot(dx, dz) || 1;
      // Shots from more than ~60 degrees off its nose get past the claws.
      return (dx * fx + dz * fz) / d < 0.5;
    }

    private setMode(m: Mode, t: number) {
      this.mode = m;
      this.modeT = t;
    }

    protected think(dt: number) {
      const b = this.body;
      const p = this.player.body;
      this.modeT -= dt;
      const dx = p.x - b.x;
      const dz = p.z - b.z;
      const d = Math.hypot(dx, dz) || 1;
      let vx = 0;
      let vz = 0;
      switch (this.mode) {
        case 'idle':
          if (this.aggro) this.setMode('circle', T.rest / this.rate);
          this.facePlayer(dt, 3);
          break;
        case 'circle': {
          // Scuttle sideways around the hero, drifting in to snapping range.
          const tx = -dz / d;
          const tz = dx / d;
          const inward = (d - T.orbit) * 0.8;
          vx = (tx * this.side + (dx / d) * inward) * T.speed * this.spd;
          vz = (tz * this.side + (dz / d) * inward) * T.speed * this.spd;
          if (!this.safeAhead(vx, vz)) {
            this.side = -this.side;
            vx = 0;
            vz = 0;
          }
          this.facePlayer(dt, 6);
          if (!this.aggro) this.setMode('idle', 1);
          else if (this.modeT <= 0 && d < T.orbit + 2.5) {
            this.setMode('warn', T.warn / this.rate);
            audio.play('zap', 0.6, 0.5);
          }
          break;
        }
        case 'warn':
          this.facePlayer(dt, 8);
          if (this.modeT <= 0) {
            this.lungeDir.set(dx / d, 0, dz / d);
            this.bitten = false;
            this.setMode('lunge', T.lunge);
            audio.play('dash', 1.6, 0.5);
          }
          break;
        case 'lunge':
          vx = this.lungeDir.x * 9;
          vz = this.lungeDir.z * 9;
          if (!this.safeAhead(vx, vz)) {
            vx = 0;
            vz = 0;
          }
          if (!this.bitten && d < T.reach && Math.abs(p.y - b.y) < 1.5) {
            this.bitten = true;
            audio.play('hit', 0.7);
            this.player.hurt(1, b.x, b.z);
          }
          if (this.modeT <= 0) this.setMode('open', T.open);
          break;
        case 'open':
          if (this.modeT <= 0) {
            this.side = Math.random() < 0.5 ? 1 : -1;
            this.setMode('circle', T.rest / this.rate);
          }
          break;
      }
      b.vx = vx;
      b.vz = vz;
      this.pose(dt, Math.hypot(vx, vz));
    }

    private pose(dt: number, speed: number) {
      const m = this.m;
      const warn = this.mode === 'warn';
      const open = this.mode === 'open';
      // Claws: up and closed while guarding, wide and shaking in the warning, snapped, then hanging open.
      const gape = warn ? 0.7 : this.mode === 'lunge' ? 0.05 : open ? 0.5 : 0.12;
      for (let i = 0; i < m.jaws.length; i++) m.jaws[i].rotation.x = i % 2 ? gape * 0.7 : -gape;
      for (const [i, c] of m.claws.entries()) {
        c.rotation.x = open ? 0.5 : warn ? -0.5 : -0.2;
        c.rotation.z = warn ? Math.sin(this.t * 40 + i) * 0.12 : 0;
      }
      m.body.position.y = warn ? 0.15 : this.mode === 'lunge' ? 0.05 : Math.abs(Math.sin(this.t * 14)) * 0.04 * Math.min(1, speed / 2);
      // Little legs patter while it scuttles.
      for (const [i, l] of m.legs.entries()) l.rotation.x = speed > 0.5 ? Math.sin(this.t * 22 + i * 1.3) * 0.35 : 0;
      m.eyeMat.emissiveIntensity = warn ? 3 + Math.sin(this.t * 30) * 2 : open ? 0.6 : 2;
      void dt;
    }
  };
}
