import * as THREE from 'three';

import { audio } from '../../core/audio';
import { damp, dampAngle } from '../../core/math';
import type { World } from '../../game/world';
import type { EnemyModel } from '../aliens';
import { Enemy } from '../enemies';
import { blobShadow, cone, mat, mesh, ownMat, sphere } from '../models';

/**
 * A CABLE SNAKE, one of MEDUSA's helpers in her labyrinth (chapter 3): a long gold cable with a
 * snake's head and two green eyes. It slithers toward the hero in a wavy line, REARS UP with its eyes
 * blazing and a hiss (the warning), then LUNGES straight ahead. After a lunge it lies flat for a moment,
 * tangled: the best time to blast it. A spin or a slide knocks it out of a lunge.
 */
export const COIL_TUNING = {
  hp: 3,
  /** Slither speed, how close it gets before rearing, the rear-up warning, and the lunge. */
  speed: 3.4,
  reach: 4.2,
  warn: 0.75,
  lunge: 13,
  lungeTime: 0.32,
  /** Lying tangled after a lunge. */
  rest: 1.3,
};

type Mode = 'lurk' | 'slither' | 'rear' | 'lunge' | 'rest';

const SEGMENTS = 9;
const GAP = 0.32;

interface CoilModel extends EnemyModel {
  segs: THREE.Mesh[];
  head: THREE.Group;
  eyes: THREE.MeshStandardMaterial;
  jaw: THREE.Mesh;
}

function makeCoilModel(): CoilModel {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const gold = ownMat('#e8b84a', { metal: 0.7, rough: 0.3 });
  const dark = mat('#3a3a2a', { metal: 0.5, rough: 0.5 });
  const segs: THREE.Mesh[] = [];
  for (let i = 0; i < SEGMENTS; i++) {
    const r = 0.22 - i * 0.014;
    const s = mesh(sphere(r, 10), i % 2 ? gold : dark, 0, r, 0);
    segs.push(s);
    // Segments are placed in world space each frame, so they live on the root's parent level (see `pose`).
    root.add(s);
  }
  const head = new THREE.Group();
  const skull = mesh(sphere(0.3, 14), gold, 0, 0, 0);
  skull.scale.set(1, 0.7, 1.35);
  head.add(skull);
  const eyes = ownMat('#c8ffd8', { emissive: '#7dff9a', ei: 2 });
  head.add(mesh(sphere(0.07, 8), eyes, 0.15, 0.1, 0.26, false), mesh(sphere(0.07, 8), eyes, -0.15, 0.1, 0.26, false));
  const jaw = mesh(sphere(0.24, 10), dark, 0, -0.12, 0.08);
  jaw.scale.set(0.9, 0.35, 1.2);
  head.add(jaw);
  const fang = mat('#fff6e0');
  for (const sx of [-1, 1]) {
    const f = mesh(cone(0.03, 0.12, 5), fang, sx * 0.1, -0.1, 0.36, false);
    f.rotation.x = Math.PI;
    head.add(f);
  }
  root.add(head);
  const shadow = blobShadow(1.2);
  root.add(shadow);
  return { root, body, flash: [gold, eyes], parts: { shadow }, segs, head, eyes, jaw };
}

let CoilClass: (new (world: World, id: string, x: number, y: number, z: number) => Enemy) | null = null;

/** Builds a cable snake (the class extends `Enemy`, so it is defined on first use, like the robots). */
export function makeCoil(world: World, id: string, x: number, y: number, z: number): Enemy {
  CoilClass ??= coilClass();
  return new CoilClass(world, id, x, y, z);
}

function coilClass() {
  const T = COIL_TUNING;
  return class Coil extends Enemy {
    private mode: Mode = 'lurk';
    private modeT = 0;
    private m: CoilModel;
    /** Where the head has been, newest first: the body follows the trail. */
    private trail: THREE.Vector3[] = [];
    private dir = new THREE.Vector3();
    private wiggle = Math.random() * 6;

    constructor(world: World, id: string, x: number, y: number, z: number) {
      const model = makeCoilModel();
      super(world, id, x, y, z, T.hp, 0.5, model);
      this.m = model;
      this.kind = 'coil';
      this.bolts = 3;
      this.aimHeight = 0.4;
      this.badgeY = 1.4;
      for (let i = 0; i < SEGMENTS * 3; i++) this.trail.push(new THREE.Vector3(x, y, z + i * 0.12));
      this.yaw = Math.random() * Math.PI * 2;
    }

    private setMode(m: Mode, t: number) {
      this.mode = m;
      this.modeT = t;
    }

    protected think(dt: number) {
      const b = this.body;
      const p = this.player.body;
      this.modeT -= dt;
      const dist = this.distToPlayer();
      switch (this.mode) {
        case 'lurk':
          // Coiled up, swaying, until it notices the hero.
          b.vx = damp(b.vx, 0, 6, dt);
          b.vz = damp(b.vz, 0, 6, dt);
          if (this.aggro) this.setMode('slither', 0.5);
          break;
        case 'slither': {
          // A wavy line toward the hero.
          this.wiggle += dt * 7;
          const to = Math.atan2(p.x - b.x, p.z - b.z) + Math.sin(this.wiggle) * 0.6;
          this.yaw = dampAngle(this.yaw, to, 5, dt);
          const dx = Math.sin(this.yaw);
          const dz = Math.cos(this.yaw);
          const ok = this.safeAhead(dx, dz);
          const sp = T.speed * this.spd;
          b.vx = ok ? dx * sp : 0;
          b.vz = ok ? dz * sp : 0;
          if (!this.aggro) this.setMode('lurk', 1);
          else if (dist < T.reach && this.modeT <= 0 && Math.abs(p.y - b.y) < 1.5) {
            this.setMode('rear', T.warn / this.rate);
            audio.play('vent', 2.4, 0.5);
          }
          break;
        }
        case 'rear':
          // Up on its tail, eyes blazing, hissing: "here I come!"
          b.vx = damp(b.vx, 0, 10, dt);
          b.vz = damp(b.vz, 0, 10, dt);
          this.facePlayer(dt, 6);
          if (this.modeT <= 0) {
            this.dir.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
            this.setMode('lunge', T.lungeTime);
            audio.play('dash', 1.8, 0.5);
          }
          break;
        case 'lunge': {
          const ok = this.safeAhead(this.dir.x, this.dir.z);
          b.vx = ok ? this.dir.x * T.lunge : 0;
          b.vz = ok ? this.dir.z * T.lunge : 0;
          if (this.modeT <= 0 || !ok) {
            this.setMode('rest', T.rest);
            b.vx = b.vz = 0;
          }
          break;
        }
        case 'rest':
          b.vx = damp(b.vx, 0, 8, dt);
          b.vz = damp(b.vz, 0, 8, dt);
          if (this.modeT <= 0) this.setMode('slither', 1.2);
          break;
      }
    }

    /** It only bites during a lunge (or if the hero walks right into its head). */
    protected touchPlayer(): boolean {
      if (this.mode !== 'lunge' && this.mode !== 'rear') return false;
      if (this.player.spinning || this.player.dashing) {
        if (this.mode === 'lunge') {
          const pb = this.player.body;
          this.hit(1, 'spin', new THREE.Vector3(pb.x, pb.y, pb.z));
          this.setMode('rest', T.rest);
        }
        return false;
      }
      return super.touchPlayer(1);
    }

    update(dt: number) {
      super.update(dt);
      if (this.alive) this.pose(dt);
    }

    /** Lays the gold body along the trail behind the head; rearing lifts the front up. */
    private pose(dt: number) {
      const b = this.body;
      const m = this.m;
      const head = this.trail[0];
      if (head.distanceTo(b) > 0.12) {
        const last = this.trail.pop() as THREE.Vector3;
        last.set(b.x, b.y, b.z);
        this.trail.unshift(last);
      } else if (this.mode === 'lurk' || this.mode === 'rest') {
        // Coiled in place: gently pull the tail around in a ring.
        this.wiggle += dt * 1.5;
      }
      // The model's root follows the body (the base class sets its position and yaw); segments are
      // placed relative to it, turned back by the yaw.
      const rear = this.mode === 'rear' ? 1 : this.mode === 'lunge' ? 0.5 : 0;
      const cos = Math.cos(this.yaw);
      const sin = Math.sin(this.yaw);
      const sc = m.root.scale.x || 1;
      const coiled = this.mode === 'lurk' || this.mode === 'rest';
      for (let i = 0; i < SEGMENTS; i++) {
        const k = Math.min(this.trail.length - 1, Math.round((i + 1) * (GAP / 0.12)));
        let wx = this.trail[k].x - b.x;
        let wz = this.trail[k].z - b.z;
        if (coiled) {
          // Coiled: a little spiral around the head.
          const a = i * 0.8 + this.wiggle * 0.3;
          wx = Math.cos(a) * (0.25 + i * 0.05);
          wz = Math.sin(a) * (0.25 + i * 0.05);
        }
        const lift = rear * Math.max(0, 3 - i) * 0.32;
        m.segs[i].position.set((wx * cos - wz * sin) / sc, 0.2 + lift, (wx * sin + wz * cos) / sc);
      }
      m.head.position.set(0, 0.32 + rear * 1.05, 0.15 + rear * 0.1);
      m.head.rotation.x = rear ? -0.25 : 0;
      m.jaw.rotation.x = this.mode === 'rear' ? 0.5 + Math.sin(this.t * 30) * 0.1 : this.mode === 'lunge' ? 0.6 : 0.05;
      m.eyes.emissiveIntensity = this.mode === 'rear' ? 3 + Math.sin(this.t * 40) * 2 : 1.8;
      this.aim.set(b.x, b.y + 0.4 + rear * 1, b.z);
      const shadow = m.parts.shadow;
      shadow.position.set(0, 0.03, 0);
    }
  };
}
