import * as THREE from 'three';

import { audio } from '../core/audio';
import type { World } from '../game/world';
import { Entity } from './entity';
import { capsule, cone, mat, mesh, sphere } from './models';

/* ---------------- shared hazards ---------------- */

/** Expanding ring along the floor. Jump over it! */
export class Shockwave extends Entity {
  private r = 0.5;
  private ring: THREE.Mesh;
  private hitDone = false;

  constructor(
    world: World,
    private x: number,
    private y: number,
    private z: number,
    private maxR = 14,
    private speed = 9,
    color = '#7fe6ff',
  ) {
    super(world, `wave${Math.random()}`);
    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.18, 8, 48).rotateX(Math.PI / 2),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    this.ring.position.set(x, y + 0.25, z);
    this.obj.add(this.ring);
  }

  update(dt: number) {
    this.r += this.speed * dt;
    this.ring.scale.setScalar(this.r);
    (this.ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - this.r / this.maxR) * 0.9 + 0.1;
    const p = this.world.player.body;
    const d = Math.hypot(p.x - this.x, p.z - this.z);
    if (!this.hitDone && Math.abs(d - this.r) < 0.6 && p.y < this.y + 0.7) {
      this.hitDone = true;
      this.world.player.hurt(1, this.x, this.z);
    }
    if (this.r > this.maxR) this.remove();
  }
}

/** Glowing warning circle, then a strike from above. */
export class Strike extends Entity {
  private t = 0;
  private disc: THREE.Mesh;
  private rock: THREE.Mesh;

  constructor(
    world: World,
    private x: number,
    private y: number,
    private z: number,
    private delay = 1.1,
    private radius = 1.3,
    private color = '#ff5e6a',
    kind: 'ice' | 'rock' | 'missile' = 'rock',
  ) {
    super(world, `strike${Math.random()}`);
    this.disc = new THREE.Mesh(
      new THREE.CircleGeometry(radius, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, depthWrite: false }),
    );
    this.disc.position.set(x, y + 0.05, z);
    this.obj.add(this.disc);
    const g = kind === 'ice' ? cone(0.35, 1.4, 6) : kind === 'missile' ? capsule(0.18, 0.7) : sphere(0.55, 12);
    const m =
      kind === 'ice'
        ? mat('#dff6ff', { emissive: '#7fe6ff', ei: 0.8, rough: 0.1 })
        : kind === 'missile'
          ? mat('#c0c8d4', { emissive: '#ff5e6a', ei: 0.4, metal: 0.6 })
          : mat('#5a3a22', { emissive: '#ff7a1a', ei: 1.2 });
    this.rock = mesh(g, m, x, y + 14, z);
    if (kind === 'ice') this.rock.rotation.x = Math.PI;
    this.obj.add(this.rock);
  }

  update(dt: number) {
    this.t += dt;
    const k = Math.min(1, this.t / this.delay);
    (this.disc.material as THREE.MeshBasicMaterial).opacity = 0.2 + k * 0.45 + (k > 0.7 ? Math.sin(this.t * 30) * 0.15 : 0);
    this.rock.position.y = this.y + 14 * (1 - k * k);
    if (this.t >= this.delay) {
      const w = this.world;
      const p = w.player.body;
      if (Math.hypot(p.x - this.x, p.z - this.z) < this.radius + p.r && p.y < this.y + 1.6) w.player.hurt(1, this.x, this.z);
      audio.play('explode');
      w.particles.emit(this.x, this.y + 0.3, this.z, { count: 22, color: this.color, speed: 6, up: 3, life: 0.6, size: 0.6 });
      w.shake(0.12);
      this.remove();
    }
  }
}

