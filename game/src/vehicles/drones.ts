import * as THREE from 'three';

import { glowSprite } from '../entities/models';
import { FLIGHT, type DroneWave } from './course';

/**
 * Aeëtes's salvage drones: shiny gold saucers with a black dome, one amber eye and two grabby claws,
 * built to tear old ships apart for scrap. In the flight they swoop in ahead of the Argo, hover in
 * formation, lob slow glowing blobs at it, and leave after a while. Positions are relative to the Argo:
 * `rel` is how far ahead (world z = -rel), `x` and `y` are in the corridor.
 */

interface DroneModel {
  root: THREE.Group;
  eye: THREE.MeshBasicMaterial;
  lights: THREE.Group;
}

function makeDroneModel(elite: boolean): DroneModel {
  const root = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: elite ? '#ffe08a' : '#e8b440', roughness: 0.25, metalness: 0.85, emissive: '#4a3000', emissiveIntensity: 0.3 });
  const black = new THREE.MeshStandardMaterial({ color: '#1c1a26', roughness: 0.3, metalness: 0.6 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.7, 0.32, 20), gold);
  root.add(disc);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), black);
  dome.position.y = 0.14;
  root.add(dome);
  const eye = new THREE.MeshBasicMaterial({ color: '#ffb020' });
  const eyeM = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), eye);
  eyeM.position.set(0, 0.05, 0.62);
  root.add(eyeM);
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.7), black);
    arm.position.set(s * 0.45, -0.22, 0.45);
    arm.rotation.x = 0.5;
    root.add(arm);
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 5).rotateX(Math.PI / 2), gold);
    claw.position.set(s * 0.45, -0.4, 0.8);
    root.add(claw);
  }
  // A ring of little lights around the rim, spinning.
  const lights = new THREE.Group();
  const lm = new THREE.MeshBasicMaterial({ color: elite ? '#ffffff' : '#ffd166' });
  for (let i = 0; i < 8; i++) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), lm);
    const a = (i / 8) * Math.PI * 2;
    l.position.set(Math.cos(a) * 0.9, 0, Math.sin(a) * 0.9);
    lights.add(l);
  }
  root.add(lights);
  if (elite) {
    // A gold crown on top: the elite drones are tougher and pay more.
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.22, 6, 1, true), gold);
    crown.position.y = 0.66;
    root.add(crown);
    root.scale.setScalar(1.3);
  }
  root.add(glowSprite('#ffb020', 1.2, 0.5));
  return { root, eye, lights };
}

export interface Drone {
  alive: boolean;
  rel: number;
  x: number;
  y: number;
  slotX: number;
  slotY: number;
  slotRel: number;
  hp: number;
  elite: boolean;
  t: number;
  state: 'in' | 'hover' | 'out';
  fireT: number;
  hitFlash: number;
  model: DroneModel;
}

interface Blob {
  alive: boolean;
  rel: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  sprite: THREE.Sprite;
}

/** How long a wave hangs around shooting before it gives up and flies off. */
const HOVER_TIME = 8.5;
/** How fast the blobs close in on the Argo (slow, so there is time to steer away). */
const BLOB_SPEED = 17;

export class Drones {
  readonly list: Drone[] = [];
  private blobs: Blob[] = [];
  private group = new THREE.Group();

  constructor(scene: THREE.Scene) {
    scene.add(this.group);
    for (let i = 0; i < 14; i++) {
      const model = makeDroneModel(i >= 11);
      model.root.visible = false;
      this.group.add(model.root);
      this.list.push({ alive: false, rel: 0, x: 0, y: 0, slotX: 0, slotY: 0, slotRel: 0, hp: 0, elite: i >= 11, t: 0, state: 'in', fireT: 0, hitFlash: 0, model });
    }
    for (let i = 0; i < 24; i++) {
      const sprite = glowSprite('#ff9a2a', 1.5, 0.95);
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff0c0' }));
      sprite.add(core);
      sprite.visible = false;
      this.group.add(sprite);
      this.blobs.push({ alive: false, rel: 0, x: 0, y: 0, vx: 0, vy: 0, sprite });
    }
  }

  /** Sends in a wave in formation. */
  spawn(w: DroneWave) {
    const cx = w.x ?? 0;
    const cy = w.y ?? 0;
    const mid = (w.n - 1) / 2;
    for (let i = 0; i < w.n; i++) {
      const elite = !!w.elite && i === Math.round(mid);
      const d = this.list.find((x) => !x.alive && x.elite === elite) ?? this.list.find((x) => !x.alive);
      if (!d) return;
      let sx = 0;
      let sy = 0;
      let sr = 0;
      if (w.formation === 'line') sx = (i - mid) * 3.4;
      else if (w.formation === 'vee') {
        sx = (i - mid) * 3.0;
        sy = Math.abs(i - mid) * 1.1;
        sr = Math.abs(i - mid) * 3;
      } else if (w.formation === 'circle') {
        const a = (i / w.n) * Math.PI * 2;
        sx = Math.cos(a) * 3.6;
        sy = Math.sin(a) * 2.4;
      } else {
        sy = (i % 2 ? 1 : -1) * 0.8;
        sr = i * 6;
      }
      d.alive = true;
      d.slotX = Math.max(-FLIGHT.halfW + 1, Math.min(FLIGHT.halfW - 1, cx + sx));
      d.slotY = Math.max(-FLIGHT.halfH + 1, Math.min(FLIGHT.halfH - 1, cy + sy));
      d.slotRel = 34 + sr;
      d.rel = 100 + sr + i * 4;
      d.x = d.slotX * 2.2;
      d.y = d.slotY + 6;
      d.hp = elite ? 3 : 2;
      d.t = 0;
      d.state = 'in';
      d.fireT = 2.2 + i * 0.7;
      d.hitFlash = 0;
      d.model.root.visible = true;
    }
  }

  /** True while any drone is around. */
  get active() {
    return this.list.some((d) => d.alive);
  }

  /**
   * Moves the drones and their blobs. `argo` is the Argo's place in the corridor; `calm` sends every
   * drone away (they won't follow the Argo into the Clashing Rocks). Returns true if a blob hit.
   */
  update(dt: number, argo: { x: number; y: number }, calm: boolean, fire: (from: THREE.Vector3) => void): boolean {
    const t = performance.now() / 1000;
    for (const d of this.list) {
      if (!d.alive) continue;
      d.t += dt;
      if (calm && d.state !== 'out') d.state = 'out';
      if (d.state === 'in') {
        const k = 1 - Math.exp(-2.4 * dt);
        d.rel += (d.slotRel - d.rel) * k;
        d.x += (d.slotX - d.x) * k;
        d.y += (d.slotY - d.y) * k;
        if (Math.abs(d.rel - d.slotRel) < 1.5) d.state = 'hover';
      } else if (d.state === 'hover') {
        // Sway around the slot, drifting a little toward the Argo so they stay a threat.
        const sx = d.slotX + Math.sin(d.t * 1.3 + d.slotY) * 1.6 + (argo.x - d.slotX) * 0.25;
        const sy = d.slotY + Math.cos(d.t * 1.7 + d.slotX) * 0.8;
        const k = 1 - Math.exp(-3 * dt);
        d.x += (sx - d.x) * k;
        d.y += (sy - d.y) * k;
        d.rel += (d.slotRel + Math.sin(d.t * 0.9) * 3 - d.rel) * k;
        d.fireT -= dt;
        if (d.fireT <= 0) {
          d.fireT = 2.3 + Math.random() * 1.2;
          this.shoot(d, argo);
          fire(new THREE.Vector3(d.x, d.y, -d.rel));
        }
        if (d.t > HOVER_TIME + 2) d.state = 'out';
      } else {
        d.rel += 34 * dt;
        d.y += 9 * dt;
        if (d.rel > 140) this.remove(d);
      }
      d.hitFlash = Math.max(0, d.hitFlash - dt * 4);
      const m = d.model;
      m.root.position.set(d.x, d.y, -d.rel);
      // The eye (on the saucer's +Z side) always looks back at the Argo.
      m.root.rotation.set(0.15 + Math.sin(d.t * 2) * 0.1, 0, Math.sin(d.t * 1.4) * 0.2);
      m.lights.rotation.y = t * 3;
      m.eye.color.set(d.hitFlash > 0 ? '#ffffff' : d.state === 'hover' && d.fireT < 0.6 ? '#ff3a3a' : '#ffb020');
    }
    let hit = false;
    for (const b of this.blobs) {
      if (!b.alive) continue;
      b.rel -= BLOB_SPEED * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.sprite.position.set(b.x, b.y, -b.rel);
      b.sprite.scale.setScalar(1.5 + Math.sin(t * 20) * 0.15);
      if (Math.abs(b.rel) < 1.2 && Math.hypot(b.x - argo.x, b.y - argo.y) < FLIGHT.radius + 0.5) {
        hit = true;
        this.drop(b);
      } else if (b.rel < -12) this.drop(b);
    }
    return hit;
  }

  private shoot(d: Drone, argo: { x: number; y: number }) {
    const b = this.blobs.find((x) => !x.alive);
    if (!b) return;
    const time = d.rel / BLOB_SPEED;
    b.alive = true;
    b.rel = d.rel - 1;
    b.x = d.x;
    b.y = d.y;
    b.vx = (argo.x - d.x) / time;
    b.vy = (argo.y - d.y) / time;
    b.sprite.visible = true;
  }

  private drop(b: Blob) {
    b.alive = false;
    b.sprite.visible = false;
  }

  /** The drone a laser at (x, y, rel) hits, if any. */
  hitAt(x: number, y: number, rel: number, r: number): Drone | null {
    for (const d of this.list) {
      if (!d.alive) continue;
      const size = d.elite ? 1.4 : 1.1;
      if (Math.abs(d.rel - rel) < size + r + 1 && Math.hypot(d.x - x, d.y - y) < size + r) return d;
    }
    return null;
  }

  /** The closest drone roughly ahead of (x, y), for aim assist. */
  target(x: number, y: number): Drone | null {
    let best: Drone | null = null;
    let bd = Infinity;
    for (const d of this.list) {
      if (!d.alive || d.state === 'out' || d.rel < 6 || d.rel > 90) continue;
      const off = Math.hypot(d.x - x, d.y - y);
      if (off > 2.2 + d.rel * 0.08) continue;
      const score = off * 3 + d.rel * 0.1;
      if (score < bd) {
        bd = score;
        best = d;
      }
    }
    return best;
  }

  /** Pops a drone out of the sky. */
  remove(d: Drone) {
    d.alive = false;
    d.model.root.visible = false;
  }

  /** Clears every drone and blob (a checkpoint restart). */
  clear() {
    for (const d of this.list) this.remove(d);
    for (const b of this.blobs) this.drop(b);
  }
}
