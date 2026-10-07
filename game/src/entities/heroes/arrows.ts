import * as THREE from 'three';

import { audio } from '../../core/audio';
import { ATALANTA } from '../../core/constants';
import type { World } from '../../game/world';
import { pointBlocked } from '../../world/physics';
import type { Target } from '../entity';
import { glowSprite } from '../models';
import { ATALANTA_COLORS, makeArrowMesh } from './atalantaModel';
import { heroWorld } from './heroProps';

interface Arrow {
  obj: THREE.Group;
  glow: THREE.Sprite;
  vel: THREE.Vector3;
  life: number;
  dmg: number;
  /** A charged power arrow: it pierces enemies and sets off arrow targets. */
  power: boolean;
  /** Enemies it has already gone through, and how many more it can. */
  pierced: Set<Target>;
  left: number;
  /** Seconds left stuck in a wall (it fades out), or 0 while flying. */
  stuck: number;
  active: boolean;
}

const POOL = 18;
const tmp = new THREE.Vector3();

/** Atalanta's arrows: long, straight and quick; power arrows glow and fly through several enemies. */
export class Arrows {
  private pool: Arrow[] = [];

  constructor(private world: World) {
    for (let i = 0; i < POOL; i++) {
      const obj = makeArrowMesh();
      const glow = glowSprite(ATALANTA_COLORS.glow, 1.6, 0.8);
      glow.position.z = 0.45;
      obj.add(glow);
      obj.visible = false;
      world.scene.add(obj);
      this.pool.push({ obj, glow, vel: new THREE.Vector3(), life: 0, dmg: 1, power: false, pierced: new Set(), left: 0, stuck: 0, active: false });
    }
  }

  /** Looses an arrow. Returns false if every arrow is already in flight. */
  fire(origin: THREE.Vector3, dir: THREE.Vector3, power: boolean, dmg: number): boolean {
    const a = this.pool.find((p) => !p.active);
    if (!a) return false;
    const speed = power ? ATALANTA.powerSpeed : ATALANTA.arrowSpeed;
    a.active = true;
    a.obj.visible = true;
    a.obj.position.copy(origin);
    a.obj.scale.setScalar(power ? 1.35 : 1);
    a.vel.copy(dir).normalize().multiplyScalar(speed);
    a.life = (power ? ATALANTA.powerRange : ATALANTA.arrowRange) / speed;
    a.dmg = dmg;
    a.power = power;
    a.pierced.clear();
    a.left = power ? ATALANTA.pierce : 1;
    a.stuck = 0;
    a.glow.scale.setScalar(power ? 2.6 : 1.2);
    (a.glow.material as THREE.SpriteMaterial).opacity = power ? 0.95 : 0.6;
    a.obj.lookAt(tmp.copy(origin).add(dir));
    return true;
  }

  private stop(a: Arrow) {
    a.active = false;
    a.obj.visible = false;
  }

  /** Sticks the arrow where it is for a moment (into a wall, a crate, a target). */
  private stick(a: Arrow) {
    a.stuck = 0.9;
    a.vel.set(0, 0, 0);
    (a.glow.material as THREE.SpriteMaterial).opacity = 0;
  }

  update(dt: number) {
    const w = this.world;
    const targets = heroWorld(w).targets;
    for (const a of this.pool) {
      if (!a.active) continue;
      if (a.stuck > 0) {
        a.stuck -= dt;
        if (a.stuck <= 0) this.stop(a);
        continue;
      }
      a.life -= dt;
      if (a.life <= 0) {
        this.stop(a);
        continue;
      }
      const p = a.obj.position;
      // Two half steps a frame, so a fast arrow can't skip over a thin target.
      for (let k = 0; k < 2 && a.active && a.stuck <= 0; k++) {
        p.addScaledVector(a.vel, dt / 2);
        this.collide(a, p, targets);
      }
      if (a.active && a.stuck <= 0 && Math.random() < (a.power ? 0.9 : 0.35)) {
        w.particles.emit(p.x, p.y, p.z, { count: 1, color: a.power ? '#ffffff' : ATALANTA_COLORS.glow, speed: 0.3, life: 0.3, size: a.power ? 0.45 : 0.28, gravity: 0 });
      }
    }
  }

  private collide(a: Arrow, p: THREE.Vector3, targets: ReturnType<typeof heroWorld>['targets']) {
    const w = this.world;
    for (const t of targets) {
      if (!t.alive || t.center.distanceToSquared(p) > t.radius * t.radius) continue;
      if (a.power) {
        t.struck();
        this.stick(a);
      } else {
        t.tink();
        w.particles.emit(p.x, p.y, p.z, { count: 6, color: '#ffffff', speed: 3, life: 0.25, size: 0.3 });
        this.stop(a);
      }
      return;
    }
    if (pointBlocked(w.grid, w.boxes, p.x, p.y, p.z)) {
      // Crates and cracked walls are boxes: let them take the hit first.
      w.hitAt(p, 0.6, a.dmg, 'shot');
      w.particles.emit(p.x, p.y, p.z, { count: 5, color: ATALANTA_COLORS.glow, speed: 3, life: 0.25, size: 0.3 });
      audio.play('land', 2.2, 0.4);
      this.stick(a);
      return;
    }
    if (!a.power) {
      const t = w.hitAt(p, 0.32, a.dmg, 'shot');
      if (t) {
        w.particles.emit(p.x, p.y, p.z, { count: 8, color: ATALANTA_COLORS.glow, speed: 4, life: 0.3, size: 0.4 });
        audio.play('hit', 1.3);
        this.stop(a);
      }
      return;
    }
    // A power arrow goes straight through enemies, hitting each one once, until a shield stops it.
    for (const t of w.targetsNear(p, 1.6)) {
      if (a.pierced.has(t) || t.aim.distanceTo(p) > t.radius + 0.4) continue;
      a.pierced.add(t);
      if (!(t.powerArrow ? t.powerArrow(a.dmg, p.clone()) : t.hit(a.dmg, 'shot', p.clone()))) {
        this.stick(a);
        return;
      }
      w.particles.emit(p.x, p.y, p.z, { count: 16, color: '#ffffff', speed: 6, life: 0.35, size: 0.45 });
      w.rings.burst(t.aim.x, t.aim.y - 0.6, t.aim.z, 2.4, ATALANTA_COLORS.glow, 0.25);
      audio.play('hit', 0.9);
      w.hitStop(0.03);
      a.left -= 1;
      if (a.left <= 0) {
        this.stop(a);
        return;
      }
    }
  }

  clear() {
    for (const a of this.pool) this.stop(a);
  }
}
