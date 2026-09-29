import * as THREE from 'three';

import { audio } from '../core/audio';
import { PLAYER } from '../core/constants';
import type { World } from '../game/world';
import { pointBlocked } from '../world/physics';
import { glowSprite, mat, sphere } from './models';

type ShotKind = 'player' | 'enemy' | 'fireball';

interface Shot {
  obj: THREE.Group;
  vel: THREE.Vector3;
  life: number;
  dmg: number;
  kind: ShotKind;
  active: boolean;
  radius: number;
  gravity: number;
}

const tmp = new THREE.Vector3();

/** Pooled projectiles: Kai's blaster bolts, his charged fireballs, and enemy spit. */
export class Shots {
  private pool: Shot[] = [];

  constructor(private world: World) {
    const pGeo = new THREE.CapsuleGeometry(0.1, 0.5, 4, 8).rotateX(Math.PI / 2);
    const pMat = mat('#bff4ff', { emissive: '#5ee0ff', ei: 2.2 });
    const eMat = mat('#ffd0f0', { emissive: '#ff4fb8', ei: 2 });
    const fMat = mat('#fff2c0', { emissive: '#ff9a2a', ei: 3 });
    const add = (kind: ShotKind, n: number, build: (g: THREE.Group) => void, radius: number) => {
      for (let i = 0; i < n; i++) {
        const obj = new THREE.Group();
        build(obj);
        obj.visible = false;
        this.world.scene.add(obj);
        this.pool.push({ obj, vel: new THREE.Vector3(), life: 0, dmg: 1, kind, active: false, radius, gravity: 0 });
      }
    };
    add('player', 24, (g) => g.add(new THREE.Mesh(pGeo, pMat), glowSprite('#5ee0ff', 1.1, 0.7)), 0.3);
    add('enemy', 46, (g) => g.add(new THREE.Mesh(sphere(0.26, 12), eMat), glowSprite('#ff4fb8', 1.5, 0.75)), 0.32);
    add(
      'fireball',
      3,
      (g) => g.add(new THREE.Mesh(sphere(0.55, 18), fMat), glowSprite('#ffb04a', 3.6, 0.9), glowSprite('#ff5a1a', 6, 0.35)),
      0.6,
    );
  }

  fire(owner: ShotKind, origin: THREE.Vector3, dir: THREE.Vector3, speed: number, dmg: number, gravity = 0) {
    const s = this.pool.find((p) => !p.active && p.kind === owner);
    if (!s) return;
    s.active = true;
    s.obj.visible = true;
    s.obj.position.copy(origin);
    s.vel.copy(dir).multiplyScalar(speed);
    s.life = owner === 'enemy' ? 4 : PLAYER.shotRange / speed;
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
    if (s.kind === 'fireball') {
      this.world.explode(p, 2.8, s.dmg);
      return;
    }
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
      if (s.kind === 'fireball') {
        s.obj.rotation.z += dt * 8;
        w.particles.emit(p.x, p.y, p.z, { count: 3, color: Math.random() < 0.5 ? '#ffb04a' : '#ff5a1a', speed: 1.2, life: 0.45, size: 0.8, gravity: -1 });
      }
      if (s.life <= 0) {
        if (s.kind === 'fireball') this.pop(s, '');
        s.active = false;
        s.obj.visible = false;
        continue;
      }
      if (pointBlocked(w.grid, w.boxes, p.x, p.y, p.z)) {
        // Crates and doors are boxes; let breakables react to the hit first.
        if (s.kind === 'player') w.hitAt(p, s.radius + 0.3, s.dmg, 'shot');
        this.pop(s, s.kind === 'enemy' ? '#ff8ad8' : '#7fe6ff');
        continue;
      }
      if (s.kind !== 'enemy') {
        if (s.kind === 'fireball' ? w.targetAt(p, s.radius) : w.hitAt(p, s.radius, s.dmg, 'shot')) {
          this.pop(s, '#bff4ff');
          audio.play('hit');
        }
      } else {
        const pl = w.player;
        const dx = pl.body.x - p.x;
        const dz = pl.body.z - p.z;
        const dy = pl.body.y + 0.9 - p.y;
        // A spin bats shots away a little before they reach Kai.
        const reach = pl.body.r + s.radius + (pl.spinning ? 0.9 : 0);
        if (dx * dx + dz * dz < reach * reach && Math.abs(dy) < 1.4) {
          if (pl.spinning) {
            const back = tmp.copy(s.vel).setY(0).multiplyScalar(-1).normalize();
            this.pop(s, '#bff4ff');
            this.fire('player', p.clone(), back.clone(), PLAYER.shotSpeed, 1 + (w.save.upgrades.blaster ?? 0));
            audio.play('zap', 2.4);
          } else {
            pl.hurt(s.dmg, p.x, p.z);
            this.pop(s, '#ff8ad8');
          }
        }
      }
    }
  }

  /** Wipes out enemy shots close to a point (BOLT's force pulse). Returns how many were destroyed. */
  clearNear(at: THREE.Vector3, radius: number): number {
    let n = 0;
    for (const s of this.pool) {
      if (!s.active || s.kind !== 'enemy' || s.obj.position.distanceToSquared(at) > radius * radius) continue;
      this.pop(s, '#bff4ff');
      n += 1;
    }
    return n;
  }
}
