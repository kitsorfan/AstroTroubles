import * as THREE from 'three';

import { audio } from '../../core/audio';
import { damp } from '../../core/math';
import type { World } from '../../game/world';
import { Enemy } from '../enemies';
import type { HitKind } from '../entity';
import { makeRamlingModel, type RamParts } from './ramModels';

/**
 * A RAMLING, one of Aeëtes's little gold ram robots (Brennus's Last Stand). It trots up, PAWS the
 * ground (its visor flashes and a red lane shows where it will run), then CHARGES in a straight line.
 * Its gold forehead is armour: plain shots from the front bounce off. Hold up the SHIELD and it bonks
 * its head and wobbles about, dizzy (it takes double damage then), or step aside and let it run into
 * a wall. A big blast or a charge knocks it about from any side.
 */
export const RAMLING_TUNING = {
  hp: 4,
  /** Paws the ground this long before a charge (never shorter on hard levels: only more often). */
  paw: 1.0,
  charge: 10,
  chargeTime: 1.2,
  /** Dizzy after bonking a shield, and after running into a wall. */
  bonk: 2.6,
  crash: 1.6,
  rest: 2.2,
  /** Starts pawing when Brennus is this close. */
  range: 9,
  lane: 10,
};

type Mode = 'trot' | 'paw' | 'charge' | 'dizzy';

let RamlingClass: (new (world: World, id: string, x: number, y: number, z: number) => Enemy) | null = null;

/** Builds a ramling (the class extends `Enemy`, so it is defined on first use, like the robots). */
export function makeRamling(world: World, id: string, x: number, y: number, z: number): Enemy {
  RamlingClass ??= ramlingClass();
  return new RamlingClass(world, id, x, y, z);
}

let laneMat: THREE.MeshBasicMaterial | null = null;

function ramlingClass() {
  const T = RAMLING_TUNING;
  return class Ramling extends Enemy {
    private mode: Mode = 'trot';
    private modeT = 1 + Math.random();
    private dir = new THREE.Vector2(0, 1);
    private ram: RamParts;
    private lane: THREE.Mesh;
    private stride = 0;
    private bonked = false;

    constructor(world: World, id: string, x: number, y: number, z: number) {
      const model = makeRamlingModel();
      super(world, id, x, y, z, T.hp, 0.6, model);
      this.ram = model.ram;
      this.kind = 'ramling';
      this.bolts = 5;
      this.heartChance = 0.18;
      this.aimHeight = 0.6;
      // The badge height is scaled with the model: about 1.5 units over its feet.
      this.badgeY = 2.4;
      laneMat ??= new THREE.MeshBasicMaterial({ color: '#ff3a4c', transparent: true, opacity: 0.35, depthWrite: false });
      this.lane = new THREE.Mesh(new THREE.PlaneGeometry(1.2, T.lane), laneMat);
      this.lane.rotation.x = -Math.PI / 2;
      this.lane.visible = false;
      this.obj.add(this.lane);
    }

    /** Its gold forehead turns plain shots aside (not while it's dizzy). */
    protected canBeHit(kind: HitKind, from: THREE.Vector3) {
      if (this.mode === 'dizzy' || kind !== 'shot') return true;
      const dx = from.x - this.body.x;
      const dz = from.z - this.body.z;
      const d = Math.hypot(dx, dz) || 1;
      return (dx * Math.sin(this.yaw) + dz * Math.cos(this.yaw)) / d < 0.5;
    }

    hit(dmg: number, kind: HitKind, from: THREE.Vector3): boolean {
      return super.hit(this.mode === 'dizzy' ? dmg * 2 : dmg, kind, from);
    }

    private setMode(m: Mode, t: number) {
      this.mode = m;
      this.modeT = t;
      this.lane.visible = m === 'paw';
    }

    private aimAtPlayer() {
      const tgt = this.lead(0.3);
      const dx = tgt.x - this.body.x;
      const dz = tgt.z - this.body.z;
      const d = Math.hypot(dx, dz) || 1;
      this.dir.set(dx / d, dz / d);
    }

    private dizzy(seconds: number, shield: boolean) {
      const b = this.body;
      b.vx = -this.dir.x * (shield ? 7 : 3);
      b.vz = -this.dir.y * (shield ? 7 : 3);
      b.vy = 3.5;
      this.setMode('dizzy', seconds);
      this.world.shake(shield ? 0.35 : 0.2);
      this.world.particles.emit(b.x + this.dir.x * 0.8, b.y + 1.2, b.z + this.dir.y * 0.8, { count: 14, color: '#ffd166', speed: 5, life: 0.4, size: 0.4 });
      audio.play('pound', shield ? 1.5 : 1.2);
      if (shield && !this.bonked) {
        this.bonked = true;
        this.world.hooks.toast('BONK! It bumped its head on your shield. Hit it while it’s dizzy!', 'brennus');
      }
    }

    protected think(dt: number) {
      const b = this.body;
      const p = this.player.body;
      const r = this.ram;
      this.modeT -= dt;
      const dist = this.distToPlayer();
      let moving = false;
      switch (this.mode) {
        case 'trot': {
          if (!this.aggro) {
            b.vx = damp(b.vx, 0, 6, dt);
            b.vz = damp(b.vz, 0, 6, dt);
            break;
          }
          this.facePlayer(dt, 4);
          const dx = p.x - b.x;
          const dz = p.z - b.z;
          const d = Math.hypot(dx, dz) || 1;
          const want = d > 6 && this.safeAhead(dx, dz) ? 3.2 * this.spd : 0;
          b.vx = damp(b.vx, (dx / d) * want, 4, dt);
          b.vz = damp(b.vz, (dz / d) * want, 4, dt);
          moving = want > 0;
          if (dist < T.range && this.modeT <= 0) {
            this.aimAtPlayer();
            this.setMode('paw', T.paw);
            audio.play('roar', 2.6, 0.35);
          }
          break;
        }
        case 'paw': {
          b.vx = damp(b.vx, 0, 10, dt);
          b.vz = damp(b.vz, 0, 10, dt);
          // It keeps aiming for the first half of the warning, then the lane is set.
          if (this.modeT > T.paw / 2) this.aimAtPlayer();
          this.yaw = Math.atan2(this.dir.x, this.dir.y);
          r.legs[0].rotation.x = Math.sin(this.t * 22) * 0.7 - 0.3;
          r.head.rotation.x = 0.35;
          r.visor.emissiveIntensity = 1.5 + Math.abs(Math.sin(this.t * 24)) * 2.5;
          if (Math.random() < 0.4) this.world.particles.emit(b.x + this.dir.x * 0.5, b.y + 0.1, b.z + this.dir.y * 0.5, { count: 1, color: '#e8dcc8', speed: 1.5, up: 1, life: 0.4, size: 0.5 });
          this.lane.position.set(b.x + this.dir.x * (T.lane / 2 + 0.5), b.y + 0.06, b.z + this.dir.y * (T.lane / 2 + 0.5));
          this.lane.rotation.z = -Math.atan2(this.dir.x, this.dir.y);
          if (this.modeT <= 0) {
            this.setMode('charge', T.chargeTime);
            audio.play('dash', 1.3, 0.6);
          }
          break;
        }
        case 'charge': {
          const s = T.charge * this.spd;
          b.vx = this.dir.x * s;
          b.vz = this.dir.y * s;
          moving = true;
          this.yaw = Math.atan2(this.dir.x, this.dir.y);
          r.head.rotation.x = 0.45;
          if (Math.random() < 0.5) this.world.particles.emit(b.x, b.y + 0.15, b.z, { count: 1, color: '#e8dcc8', speed: 2, life: 0.4, size: 0.55 });
          const fx = b.x + this.dir.x * 0.7;
          const fz = b.z + this.dir.y * 0.7;
          if (Math.hypot(p.x - fx, p.z - fz) < 1.25 && Math.abs(p.y - b.y) < 1.6 && this.player.shieldBlocks(b.x, b.z)) {
            // CLONK: it runs head first into Brennus's shield.
            this.player.hurt(1, b.x, b.z);
            this.dizzy(T.bonk, true);
          } else if (b.bumped || !this.safeAhead(this.dir.x, this.dir.y)) this.dizzy(T.crash, false);
          else if (this.modeT <= 0) this.setMode('trot', T.rest / this.rate);
          break;
        }
        case 'dizzy':
          b.vx = damp(b.vx, 0, 5, dt);
          b.vz = damp(b.vz, 0, 5, dt);
          this.yaw += dt * 2.5;
          r.head.rotation.x = Math.sin(this.t * 6) * 0.25;
          if (Math.random() < 0.25) this.world.particles.emit(b.x, b.y + 2, b.z, { count: 1, color: '#ffd166', speed: 1.5, life: 0.5, size: 0.45, gravity: 0 });
          if (this.modeT <= 0) this.setMode('trot', T.rest / this.rate);
          break;
      }
      if (this.mode !== 'paw') {
        r.visor.emissiveIntensity = damp(r.visor.emissiveIntensity, 1.6, 6, dt);
        if (this.mode !== 'charge' && this.mode !== 'dizzy') r.head.rotation.x = damp(r.head.rotation.x, 0, 6, dt);
      }
      // Trotting legs, and a little bounce.
      if (moving) this.stride += dt * (this.mode === 'charge' ? 22 : 12);
      const swing = moving ? Math.sin(this.stride) * 0.6 : 0;
      r.legs.forEach((l, i) => {
        if (this.mode === 'paw' && i === 0) return;
        l.rotation.x = i === 0 || i === 3 ? swing : -swing;
      });
      r.body.position.y = moving ? Math.abs(Math.sin(this.stride)) * 0.08 : 0;
      this.contact = this.mode !== 'dizzy';
    }
  };
}
