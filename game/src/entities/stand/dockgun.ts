import * as THREE from 'three';

import { audio } from '../../core/audio';
import { CELL } from '../../core/constants';
import { dampAngle, damp } from '../../core/math';
import type { World } from '../../game/world';
import { Enemy } from '../enemies';
import { Entity } from '../entity';
import { boxG, cyl, glowSprite, mat, mesh, ownMat, sphere } from '../models';
import { gearEmblem } from '../robotModels';

/** How far a dock gun reaches, how often it fires, and how hard its shells hit. */
export const DOCK_GUN = { range: 17, every: 0.85, speed: 24, damage: 1 };

/**
 * A Legion dock gun (Brennus's Last Stand): one of the old Thorn Legion's twin-barrelled guns, which
 * Brennus's robots carried up to Colchis's sky-dock. It sleeps (barrels down, lens dark) until a
 * command post with `order: 'guns'` sets its flag; then its lens turns green and it fires at
 * Aeëtes's machines in range. Nothing can hurt it: it's a friend.
 */
export class DockGun extends Entity {
  readonly spot: THREE.Vector3;
  private head = new THREE.Group();
  private barrels = new THREE.Group();
  private lens: THREE.MeshStandardMaterial;
  private glow: THREE.Sprite;
  private flash: THREE.Sprite;
  private yaw = Math.PI;
  private pitch = 0.5;
  private cd = 0.6;
  private side = 1;
  private awake = false;

  constructor(
    world: World,
    id: string,
    cx: number,
    cz: number,
    h: number,
    readonly flag: string,
  ) {
    super(world, id);
    this.spot = new THREE.Vector3(cx * CELL + CELL / 2, h, cz * CELL + CELL / 2);
    const olive = mat('#4a5632', { rough: 0.55, metal: 0.35 });
    const dark = mat('#26221e', { rough: 0.6, metal: 0.4 });
    const brass = mat('#c9a24a', { metal: 0.75, rough: 0.3 });
    const g = new THREE.Group();
    g.position.copy(this.spot);
    g.add(mesh(cyl(0.9, 1.05, 0.4, 16), dark, 0, 0.2, 0));
    g.add(mesh(cyl(0.6, 0.7, 0.5, 14), olive, 0, 0.6, 0));
    this.head.position.y = 1.05;
    const dome = mesh(sphere(0.62, 18), olive, 0, 0.1, 0);
    dome.scale.set(1, 0.75, 1);
    this.head.add(dome);
    this.head.add(mesh(boxG(1.3, 0.16, 0.5), brass, 0, 0.05, 0));
    const gear = gearEmblem(0.2, mat('#c8282e', { emissive: '#c8282e', ei: 0.5 }));
    gear.position.set(0.66, 0.15, 0);
    gear.rotation.y = Math.PI / 2;
    this.head.add(gear);
    this.lens = ownMat('#2a2a2a', { emissive: '#000000', ei: 0 });
    this.head.add(mesh(sphere(0.16, 12), this.lens, 0, 0.42, 0.34, false));
    this.glow = glowSprite('#3dff8a', 1.1, 0);
    this.glow.position.set(0, 0.42, 0.4);
    this.head.add(this.glow);
    // Twin barrels on a pivot.
    this.barrels.position.set(0, 0.15, 0.2);
    for (const sx of [-0.22, 0.22]) {
      const b = mesh(cyl(0.11, 0.13, 1.4, 12), dark, sx, 0, 0.7);
      b.rotation.x = Math.PI / 2;
      this.barrels.add(b);
      this.barrels.add(mesh(cyl(0.15, 0.15, 0.16, 12), brass, sx, 0, 1.36).rotateX(Math.PI / 2));
    }
    this.flash = glowSprite('#ffd166', 1.4, 0);
    this.flash.position.set(0, 0, 1.6);
    this.barrels.add(this.flash);
    this.head.add(this.barrels);
    g.add(this.head);
    this.obj.add(g);
  }

  private wake() {
    this.awake = true;
    this.lens.color.set('#3dff8a');
    this.lens.emissive.set('#3dff8a');
    this.lens.emissiveIntensity = 1.8;
    this.glow.material.opacity = 0.6;
    this.world.rings.burst(this.spot.x, this.spot.y + 0.05, this.spot.z, 3, '#3dff8a', 0.4);
    this.world.particles.emit(this.spot.x, this.spot.y + 1.4, this.spot.z, { count: 20, color: '#3dff8a', speed: 4, life: 0.6, size: 0.5 });
    audio.play('charged', 1.2, 0.6);
  }

  /** The nearest of Aeëtes's machines in range (never the boss: that fight is Brennus's own). */
  private target(): Enemy | null {
    const t = this.world.nearestEnemy(this.spot.x, this.spot.z, DOCK_GUN.range);
    return t instanceof Enemy && t.alive ? t : null;
  }

  update(dt: number) {
    const t = this.world.time;
    if (!this.awake) {
      if (this.world.hasFlag(this.flag)) this.wake();
      // Asleep: barrels drooping, a slow nod.
      this.barrels.rotation.x = 0.55 + Math.sin(t * 0.8) * 0.03;
      return;
    }
    const e = this.world.cutscene ? null : this.target();
    this.cd -= dt;
    if (e) {
      const dx = e.aim.x - this.spot.x;
      const dz = e.aim.z - this.spot.z;
      const dy = e.aim.y - (this.spot.y + 1.2);
      this.yaw = dampAngle(this.yaw, Math.atan2(dx, dz), 6, dt);
      this.pitch = damp(this.pitch, -Math.atan2(dy, Math.hypot(dx, dz)), 6, dt);
      if (this.cd <= 0) {
        this.cd = DOCK_GUN.every;
        this.side = -this.side;
        const from = new THREE.Vector3(this.spot.x + Math.sin(this.yaw) * 1.6 + Math.cos(this.yaw) * 0.22 * this.side, this.spot.y + 1.2, this.spot.z + Math.cos(this.yaw) * 1.6 - Math.sin(this.yaw) * 0.22 * this.side);
        const dir = e.aim.clone().sub(from).normalize();
        this.world.shots.fire('player', from, dir, DOCK_GUN.speed, DOCK_GUN.damage);
        this.world.soundAt('enemyShoot', this.spot.x, this.spot.z, 0.8, 22);
        this.flash.material.opacity = 1;
      }
    } else {
      this.yaw += dt * 0.4;
      this.pitch = damp(this.pitch, 0, 3, dt);
    }
    this.flash.material.opacity = damp(this.flash.material.opacity, 0, 14, dt);
    this.head.rotation.y = this.yaw;
    this.barrels.rotation.x = this.pitch;
    this.glow.material.opacity = 0.45 + Math.sin(t * 4) * 0.15;
  }
}
