import * as THREE from 'three';

import type { Fish } from './swim';
import { makePiranha } from './subModel';

/**
 * The Dolphin's effects and little helpers: rings of sound (the sirens' songs, LUX's counter-song, the
 * sonar PING and the Siren Organ's sound waves), torpedoes with bubble trails, and the piranha drones'
 * models. Positions are in the sub's frame: x, y in the corridor and z = -(distance ahead).
 */

interface SoundRing {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  t: number;
  life: number;
  r0: number;
  r1: number;
  alive: boolean;
  /** Drifts this way while it grows (LUX's notes fly to the buoy). */
  vel: THREE.Vector3;
}

/** Expanding, fading rings that face the camera (they stand up, facing along the course). */
export class SoundRings {
  private pool: SoundRing[] = [];

  constructor(scene: THREE.Object3D, n = 40) {
    const geo = new THREE.TorusGeometry(1, 0.07, 6, 40);
    for (let i = 0; i < n; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: '#ff6fb0', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      scene.add(mesh);
      this.pool.push({ mesh, mat, t: 0, life: 1, r0: 0, r1: 1, alive: false, vel: new THREE.Vector3() });
    }
  }

  burst(x: number, y: number, z: number, r0: number, r1: number, color: string, life = 0.8, vel?: THREE.Vector3) {
    const r = this.pool.find((p) => !p.alive);
    if (!r) return;
    r.alive = true;
    r.t = 0;
    r.life = life;
    r.r0 = r0;
    r.r1 = r1;
    r.mat.color.set(color);
    r.mesh.position.set(x, y, z);
    r.vel.copy(vel ?? new THREE.Vector3());
    r.mesh.visible = true;
  }

  /** Moves every ring along the course by `ds` (the sub swam that far), and grows and fades them. */
  update(dt: number, ds: number) {
    for (const r of this.pool) {
      if (!r.alive) continue;
      r.t += dt;
      const k = r.t / r.life;
      if (k >= 1) {
        r.alive = false;
        r.mesh.visible = false;
        continue;
      }
      r.mesh.position.addScaledVector(r.vel, dt);
      r.mesh.position.z += ds;
      r.mesh.scale.setScalar(r.r0 + (r.r1 - r.r0) * (1 - (1 - k) ** 2));
      r.mat.opacity = 0.9 * (1 - k);
    }
  }

  clear() {
    for (const r of this.pool) {
      r.alive = false;
      r.mesh.visible = false;
    }
  }
}

export interface Torpedo {
  alive: boolean;
  /** Distance ahead of the sub, and place in the corridor. */
  rel: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mesh: THREE.Object3D;
}

export const TORPEDO_SPEED = 46;

/** A pool of little gold torpedoes with a glowing tip. */
export function makeTorpedoes(scene: THREE.Object3D, n = 16): Torpedo[] {
  const bodyG = new THREE.CapsuleGeometry(0.16, 0.7, 4, 10).rotateX(Math.PI / 2);
  const bodyM = new THREE.MeshStandardMaterial({ color: '#ffd166', emissive: '#ff9a20', emissiveIntensity: 0.8, roughness: 0.3, metalness: 0.7 });
  const tipM = new THREE.MeshBasicMaterial({ color: '#bff8ff' });
  const out: Torpedo[] = [];
  for (let i = 0; i < n; i++) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(bodyG, bodyM));
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), tipM);
    tip.position.z = -0.52;
    g.add(tip);
    g.visible = false;
    scene.add(g);
    out.push({ alive: false, rel: 0, x: 0, y: 0, vx: 0, vy: 0, mesh: g });
  }
  return out;
}

/** The piranha drones' models, one per live fish (the pool grows if a big school comes). */
export class FishView {
  private models: THREE.Group[] = [];

  constructor(private scene: THREE.Object3D) {}

  update(fish: Fish[], s: number, t: number) {
    while (this.models.length < fish.length) {
      const m = makePiranha();
      m.scale.setScalar(0.8);
      this.scene.add(m);
      this.models.push(m);
    }
    this.models.forEach((m, i) => {
      const f = fish[i];
      m.visible = !!f;
      if (!f) return;
      m.position.set(f.x, f.y, -(f.s - s));
      // Stunned fish float belly-up, dazed; the others wiggle at the sub, mouths first.
      m.rotation.set(0, f.fled ? Math.PI : 0, f.stun > 0 ? Math.PI + Math.sin(t * 3) * 0.2 : Math.sin(f.wiggle) * 0.25);
      const tail = m.getObjectByName('tail');
      if (tail) tail.rotation.y = f.stun > 0 ? 0 : Math.sin(f.wiggle * 1.6) * 0.6;
    });
  }
}

/**
 * The Siren Organ's sound waves: thick pink rings swimming at the sub, with the safe hole in the middle
 * glowing a soft cyan. `tube` is the band's thickness as a share of the radius (exact when a ring arrives).
 */
export class WaveView {
  private rings: THREE.Mesh[] = [];
  private mat = new THREE.MeshBasicMaterial({ color: '#ff6fb0', transparent: true, opacity: 0.75, depthWrite: false, fog: false });
  private hole = new THREE.MeshBasicMaterial({ color: '#bff8ff', transparent: true, opacity: 0.14, depthWrite: false, fog: false });
  private geo: THREE.TorusGeometry;
  private disc: THREE.CircleGeometry;

  constructor(
    private scene: THREE.Object3D,
    tube: number,
  ) {
    this.geo = new THREE.TorusGeometry(1, tube, 10, 48);
    this.disc = new THREE.CircleGeometry(1 - tube, 32);
  }

  update(waves: { cx: number; cy: number; rel: number; R: number }[], t: number) {
    while (this.rings.length < waves.length) {
      const ring = new THREE.Mesh(this.geo, this.mat);
      ring.add(new THREE.Mesh(this.disc, this.hole));
      this.scene.add(ring);
      this.rings.push(ring);
    }
    this.rings.forEach((r, i) => {
      const w = waves[i];
      r.visible = !!w;
      if (!w) return;
      r.position.set(w.cx, w.cy, -w.rel);
      r.scale.set(w.R, w.R, w.R);
    });
    this.mat.opacity = 0.65 + Math.sin(t * 12) * 0.12;
  }

  clear() {
    for (const r of this.rings) r.visible = false;
  }
}
