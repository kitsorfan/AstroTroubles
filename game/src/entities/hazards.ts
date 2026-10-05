import * as THREE from 'three';

import { audio } from '../core/audio';
import type { World } from '../game/world';
import { Entity } from './entity';
import { capsule, cone, mat, mesh, sphere } from './models';

/* ---------------- shared hazards ---------------- */

/** Height of the laser band above the floor; anything higher than this (any hop) is safe. */
const WAVE_TOP = 0.42;
const SEGMENTS = 96;

/** A flat ring whose width stays fixed while its radius changes (the vertices are moved each frame). */
class FlatRing {
  readonly mesh: THREE.Mesh;
  private pos: THREE.BufferAttribute;

  constructor(
    private width: number,
    mat: THREE.Material,
  ) {
    const g = new THREE.BufferGeometry();
    this.pos = new THREE.BufferAttribute(new Float32Array((SEGMENTS + 1) * 2 * 3), 3);
    this.pos.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', this.pos);
    const idx: number[] = [];
    for (let i = 0; i < SEGMENTS; i++) {
      const a = i * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
    g.setIndex(idx);
    this.mesh = new THREE.Mesh(g, mat);
    this.mesh.frustumCulled = false;
  }

  set(r: number) {
    const inner = Math.max(0.01, r - this.width / 2);
    const outer = r + this.width / 2;
    const a = this.pos.array as Float32Array;
    for (let i = 0; i <= SEGMENTS; i++) {
      const t = (i / SEGMENTS) * Math.PI * 2;
      const c = Math.cos(t);
      const s = Math.sin(t);
      a.set([c * inner, 0, s * inner, c * outer, 0, s * outer], i * 6);
    }
    this.pos.needsUpdate = true;
  }
}

/**
 * An expanding laser ring skimming the floor. It keeps the same thin width at every size and only
 * hits Jason while his feet are on the ground, so a quick hop at any moment clears it.
 */
export class Shockwave extends Entity {
  private r = 0.5;
  private beam: FlatRing;
  private hot: FlatRing;
  private halo: FlatRing;
  private wall: THREE.Mesh;
  private mats: [THREE.MeshBasicMaterial, number][] = [];
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
    const m = (c: string, opacity: number, additive: boolean) => {
      const mt = new THREE.MeshBasicMaterial({
        color: c,
        transparent: true,
        opacity,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      this.mats.push([mt, opacity]);
      return mt;
    };
    // Seen from above: a solid band of laser colour, a thin white-hot line down its middle, and a soft glow.
    this.halo = new FlatRing(1.1, m(color, 0.28, true));
    this.beam = new FlatRing(0.34, m(color, 0.95, false));
    this.hot = new FlatRing(0.07, m('#ffffff', 0.9, true));
    const h = y + WAVE_TOP;
    this.halo.mesh.position.set(x, y + 0.03, z);
    this.beam.mesh.position.set(x, h, z);
    this.hot.mesh.position.set(x, h + 0.01, z);
    // Seen from the side: a low wall of light down to the floor, so its height is easy to judge.
    this.wall = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, WAVE_TOP, SEGMENTS, 1, true), m(color, 0.35, true));
    this.wall.position.set(x, y + WAVE_TOP / 2, z);
    this.obj.add(this.halo.mesh, this.wall, this.beam.mesh, this.hot.mesh);
    this.place();
  }

  private place() {
    this.halo.set(this.r);
    this.beam.set(this.r);
    this.hot.set(this.r);
    this.wall.scale.set(this.r, 1, this.r);
  }

  update(dt: number) {
    this.r += this.speed * dt;
    this.place();
    const fade = Math.min(1, (this.maxR - this.r) / 2);
    for (const [mt, o] of this.mats) mt.opacity = o * fade;
    const p = this.world.player.body;
    const d = Math.hypot(p.x - this.x, p.z - this.z);
    if (!this.hitDone && Math.abs(d - this.r) < p.r + 0.17 && p.y < this.y + WAVE_TOP) {
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

