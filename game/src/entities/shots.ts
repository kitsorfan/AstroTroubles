import * as THREE from 'three';

import { audio } from '../core/audio';
import { PLAYER } from '../core/constants';
import type { World } from '../game/world';
import { pointBlocked } from '../world/physics';
import { glowSprite, mat, sphere } from './models';

interface Shot {
  obj: THREE.Group;
  vel: THREE.Vector3;
  life: number;
  dmg: number;
  owner: 'player' | 'enemy';
  active: boolean;
  radius: number;
  gravity: number;
}

const tmp = new THREE.Vector3();

/** Pooled projectiles for Kai's blaster and enemy spit. */
export class Shots {
  private pool: Shot[] = [];

  constructor(private world: World) {
    const pGeo = new THREE.CapsuleGeometry(0.1, 0.5, 4, 8).rotateX(Math.PI / 2);
    const pMat = mat('#bff4ff', { emissive: '#5ee0ff', ei: 2.2 });
    const eMat = mat('#ffd0f0', { emissive: '#ff4fb8', ei: 2 });
    for (let i = 0; i < 70; i++) {
      const owner: Shot['owner'] = i < 30 ? 'player' : 'enemy';
      const obj = new THREE.Group();
      if (owner === 'player') {
        obj.add(new THREE.Mesh(pGeo, pMat));
        obj.add(glowSprite('#5ee0ff', 1.1, 0.7));
      } else {
        obj.add(new THREE.Mesh(sphere(0.26, 12), eMat));
        obj.add(glowSprite('#ff4fb8', 1.5, 0.75));
      }
      obj.visible = false;
      world.scene.add(obj);
      this.pool.push({ obj, vel: new THREE.Vector3(), life: 0, dmg: 1, owner, active: false, radius: owner === 'player' ? 0.3 : 0.32, gravity: 0 });
    }
  }

  fire(owner: 'player' | 'enemy', origin: THREE.Vector3, dir: THREE.Vector3, speed: number, dmg: number, gravity = 0) {
    const s = this.pool.find((p) => !p.active && p.owner === owner);
    if (!s) return;
    s.active = true;
    s.obj.visible = true;
    s.obj.position.copy(origin);
    s.vel.copy(dir).multiplyScalar(speed);
    s.life = owner === 'player' ? PLAYER.shotRange / speed : 4;
    s.dmg = dmg;
    s.gravity = gravity;
    s.obj.lookAt(tmp.copy(origin).add(dir));
  }

  clear() {
    for (const s of this.pool) {
      s.active = false;
      s.obj.visible = false;
    }
  }

  private pop(s: Shot, color: string) {
    s.active = false;
    s.obj.visible = false;
    const p = s.obj.position;
    this.world.particles.emit(p.x, p.y, p.z, { count: 8, color, speed: 4, life: 0.3, size: 0.4 });
  }

  update(dt: number) {
    const w = this.world;
    for (const s of this.pool) {
      if (!s.active) continue;
      s.life -= dt;
      s.vel.y -= s.gravity * dt;
      const p = s.obj.position;
      p.addScaledVector(s.vel, dt);
      if (s.gravity) s.obj.lookAt(tmp.copy(p).add(s.vel));
      if (s.life <= 0) {
        s.active = false;
        s.obj.visible = false;
        continue;
      }
      if (pointBlocked(w.grid, w.boxes, p.x, p.y, p.z)) {
        // Crates and doors are boxes; let breakables react to the hit first.
        if (s.owner === 'player') w.hitAt(p, s.radius + 0.3, s.dmg, 'shot');
        this.pop(s, s.owner === 'player' ? '#7fe6ff' : '#ff8ad8');
        continue;
      }
      if (s.owner === 'player') {
        if (w.hitAt(p, s.radius, s.dmg, 'shot')) {
          this.pop(s, '#bff4ff');
          audio.play('hit');
        }
      } else {
        const pl = w.player;
        const dx = pl.body.x - p.x;
        const dz = pl.body.z - p.z;
        const dy = pl.body.y + 0.9 - p.y;
        if (dx * dx + dz * dz < (pl.body.r + s.radius) ** 2 && Math.abs(dy) < 1.1) {
          pl.hurt(s.dmg, p.x, p.z);
          this.pop(s, '#ff8ad8');
        }
      }
    }
  }
}
