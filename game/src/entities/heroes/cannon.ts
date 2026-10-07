import * as THREE from 'three';

import { audio } from '../../core/audio';
import { BRENNUS } from '../../core/constants';
import type { World } from '../../game/world';
import { pointBlocked } from '../../world/physics';
import type { Target } from '../entity';
import { glowSprite, mat, sphere } from '../models';
import { BRENNUS_COLORS } from './brennusModel';

interface Shell {
  obj: THREE.Group;
  vel: THREE.Vector3;
  life: number;
  dmg: number;
  big: boolean;
  active: boolean;
}

const tmp = new THREE.Vector3();

/**
 * General Brennus's arm cannon: heavy, slow shells on a low arc that splash whatever is around where
 * they land, and the charged BIG BLAST (a glowing cannonball that explodes: it smashes cracked walls and
 * knocks robots' shields away).
 */
export class Cannon {
  private pool: Shell[] = [];

  constructor(private world: World) {
    const shellMat = mat('#3a3028', { metal: 0.6, rough: 0.35 });
    const hot = mat('#ffd08a', { emissive: BRENNUS_COLORS.glow, ei: 2.4 });
    for (let i = 0; i < 12; i++) {
      const big = i >= 9;
      const obj = new THREE.Group();
      const r = big ? 0.42 : 0.22;
      obj.add(new THREE.Mesh(sphere(r, 14), big ? hot : shellMat));
      obj.add(glowSprite(BRENNUS_COLORS.glow, big ? 3.6 : 1.3, big ? 0.9 : 0.6));
      obj.visible = false;
      world.scene.add(obj);
      this.pool.push({ obj, vel: new THREE.Vector3(), life: 0, dmg: 1, big, active: false });
    }
  }

  /** Fires a shell (or the big blast) from `origin` along `dir`. Returns false if none is free. */
  fire(origin: THREE.Vector3, dir: THREE.Vector3, big: boolean, dmg: number): boolean {
    const s = this.pool.find((x) => !x.active && x.big === big);
    if (!s) return false;
    s.active = true;
    s.obj.visible = true;
    s.obj.position.copy(origin);
    const speed = big ? BRENNUS.blastSpeed : BRENNUS.shellSpeed;
    // A slight upward kick so the arc lands about where he aimed.
    s.vel.copy(dir).multiplyScalar(speed);
    s.vel.y += BRENNUS.shellGravity * 0.35;
    s.life = 1.6;
    s.dmg = dmg;
    return true;
  }

  clear() {
    for (const s of this.pool) {
      s.active = false;
      s.obj.visible = false;
    }
  }

  update(dt: number) {
    const w = this.world;
    for (const s of this.pool) {
      if (!s.active) continue;
      s.life -= dt;
      s.vel.y -= BRENNUS.shellGravity * dt;
      const p = s.obj.position;
      p.addScaledVector(s.vel, dt);
      s.obj.rotation.z += dt * 10;
      if (Math.random() < (s.big ? 1 : 0.5)) {
        w.particles.emit(p.x, p.y, p.z, { count: s.big ? 2 : 1, color: Math.random() < 0.5 ? BRENNUS_COLORS.glow : '#5a4a3a', speed: 0.8, life: 0.4, size: s.big ? 0.8 : 0.45, gravity: -1 });
      }
      if (s.life <= 0 || pointBlocked(w.grid, w.boxes, p.x, p.y, p.z)) {
        this.burst(s, null);
        continue;
      }
      // A direct hit on anything aimable (enemies, the boss's weak spots).
      for (const t of w.targetsNear(p, 2.5)) {
        const rr = t.radius + (s.big ? 0.45 : 0.25);
        if (t.aim.distanceToSquared(p) < rr * rr) {
          this.burst(s, t);
          break;
        }
      }
    }
  }

  /** The shell lands: a direct hit, then the splash around it (or the big blast's explosion). */
  private burst(s: Shell, direct: Target | null) {
    const w = this.world;
    s.active = false;
    s.obj.visible = false;
    const p = tmp.copy(s.obj.position);
    if (s.big) {
      w.explode(p.clone(), BRENNUS.blastRadius, s.dmg);
      return;
    }
    // Crates and walls are boxes: they take the hit like any shot.
    const hit = direct ? (direct.hit(s.dmg, 'shot', p.clone()) ? direct : null) : w.hitAt(p.clone(), 0.6, s.dmg, 'shot');
    for (const t of w.targetsNear(p, BRENNUS.shellSplash + 1)) {
      if (t === hit || t.aim.distanceTo(p) > BRENNUS.shellSplash + t.radius) continue;
      t.hit(1, 'shot', p.clone());
    }
    w.particles.emit(p.x, p.y, p.z, { count: 16, color: BRENNUS_COLORS.glow, speed: 5, life: 0.4, size: 0.55 });
    w.particles.emit(p.x, p.y, p.z, { count: 8, color: '#6a5a4a', speed: 3, life: 0.6, size: 0.7, up: 1 });
    w.rings.burst(p.x, p.y - 0.4, p.z, BRENNUS.shellSplash * 2, BRENNUS_COLORS.glow, 0.25);
    w.soundAt('pound', p.x, p.z, 1.6, 24);
    if (hit) audio.play('hit', 0.8);
  }
}
