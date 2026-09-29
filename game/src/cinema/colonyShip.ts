import * as THREE from 'three';

import { Rng } from '../core/math';
import { glowSprite } from '../entities/models';

/**
 * The colony ship SYRACUSIA seen from outside. It points along +X: engines at the back (-X), the
 * Bridge tower at the front. Bloom vines grow over the hull from the point where the seed struck.
 */

const LEN = 110;
const R = 7;

function hullTextures(): [THREE.Texture, THREE.Texture] {
  const W = 1024;
  const H = 512;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  const e = document.createElement('canvas');
  e.width = W;
  e.height = H;
  const ge = e.getContext('2d') as CanvasRenderingContext2D;
  ge.fillStyle = '#000';
  ge.fillRect(0, 0, W, H);
  const rng = new Rng(7);
  g.fillStyle = '#5d6682';
  g.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 32) {
    for (let x = 0; x < W; x += 64) {
      const v = 0.82 + rng.next() * 0.3;
      const col = new THREE.Color('#5d6682').multiplyScalar(v);
      g.fillStyle = `#${col.getHexString()}`;
      g.fillRect(x + 1, y + 1, 62, 30);
    }
  }
  g.strokeStyle = 'rgba(0,0,0,0.35)';
  g.lineWidth = 2;
  for (let y = 0; y <= H; y += 32) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y);
    g.stroke();
  }
  // Window strips (they glow warm through the emissive map).
  for (let row = 0; row < 6; row++) {
    const y = 40 + row * 78;
    for (let x = 8; x < W; x += 18) {
      if (rng.next() < 0.25) continue;
      const lit = rng.next() < 0.8;
      g.fillStyle = lit ? '#ffe2a8' : '#1c2238';
      g.fillRect(x, y, 10, 6);
      if (lit) {
        ge.fillStyle = rng.next() < 0.15 ? '#9fe8ff' : '#ffcf8a';
        ge.fillRect(x, y, 10, 6);
      }
    }
  }
  // A few big hatch markings.
  for (let i = 0; i < 10; i++) {
    g.fillStyle = 'rgba(255,209,102,0.5)';
    g.fillRect(rng.next() * W, rng.next() * H, 30, 4);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const te = new THREE.CanvasTexture(e);
  te.colorSpace = THREE.SRGBColorSpace;
  for (const x of [t, te]) {
    x.wrapS = x.wrapT = THREE.RepeatWrapping;
    x.repeat.set(2, 3);
    x.anisotropy = 8;
  }
  return [t, te];
}

interface Vine {
  mesh: THREE.Mesh;
  count: number;
  start: number;
}

interface Pod {
  mesh: THREE.Mesh;
  at: number;
  size: number;
}

export class ColonyShip {
  readonly group = new THREE.Group();
  /** The glowing lift pod that climbs along the spine between decks. */
  readonly lift: THREE.Group;
  /** Where the Bloom seed hit, in ship space. */
  readonly impact = new THREE.Vector3(-18, R + 0.2, 0);
  private vines: Vine[] = [];
  private pods: Pod[] = [];
  private flowers: THREE.Mesh[] = [];
  readonly vineMat: THREE.MeshStandardMaterial;
  readonly podMat: THREE.MeshStandardMaterial;
  private engineGlow: THREE.Sprite[] = [];
  private t = 0;
  private growth = 0;

  constructor() {
    const [map, emap] = hullTextures();
    const hull = new THREE.MeshStandardMaterial({ map, emissiveMap: emap, emissive: '#ffffff', emissiveIntensity: 1.3, roughness: 0.6, metalness: 0.35 });
    const dark = new THREE.MeshStandardMaterial({ color: '#2c3350', roughness: 0.6, metalness: 0.6 });
    const light = new THREE.MeshStandardMaterial({ color: '#7a83a4', roughness: 0.5, metalness: 0.45 });
    const glowWarm = new THREE.MeshStandardMaterial({ color: '#ffd9a0', emissive: '#ffc070', emissiveIntensity: 2.2 });
    const glowCyan = new THREE.MeshStandardMaterial({ color: '#bff4ff', emissive: '#6fe3ff', emissiveIntensity: 3 });
    const g = this.group;
    const add = (geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => {
      const me = new THREE.Mesh(geo, m);
      me.position.set(x, y, z);
      g.add(me);
      return me;
    };

    add(new THREE.CylinderGeometry(R, R, LEN, 40, 1).rotateZ(Math.PI / 2), hull);
    // Deck rings: each one is a deck of the ship, with a band of lit windows.
    for (let i = 0; i < 6; i++) {
      const x = -40 + i * 16;
      add(new THREE.TorusGeometry(R + 2.6, 1.3, 14, 48).rotateY(Math.PI / 2), light, x, 0, 0);
      add(new THREE.TorusGeometry(R + 2.6, 0.18, 6, 48).rotateY(Math.PI / 2), glowWarm, x + 1.32, 0, 0);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        add(new THREE.BoxGeometry(3.2, 0.8, 0.8), dark, x, Math.cos(a) * (R + 1.2), Math.sin(a) * (R + 1.2)).rotation.x = a;
      }
    }
    // Nose and Bridge tower at the front.
    add(new THREE.CylinderGeometry(0.01, R, 18, 40).rotateZ(-Math.PI / 2), hull, LEN / 2 + 9, 0, 0);
    add(new THREE.BoxGeometry(12, 4, 9), light, 44, R + 1.6, 0);
    const dome = add(new THREE.SphereGeometry(4.2, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#9fb4ff', emissive: '#6f7fff', emissiveIntensity: 0.5, roughness: 0.1, metalness: 0.3 }), 46, R + 3.6, 0);
    dome.scale.set(1.3, 0.8, 1);
    add(new THREE.BoxGeometry(9, 0.5, 9.4), glowCyan, 44, R + 3.7, 0);
    for (const z of [-2.5, 2.5]) add(new THREE.CylinderGeometry(0.12, 0.12, 7, 6), light, 40, R + 7, z);
    // Engines at the back.
    add(new THREE.CylinderGeometry(R, R + 3, 14, 40).rotateZ(Math.PI / 2), dark, -LEN / 2 - 7, 0, 0);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
      const y = Math.cos(a) * 5.2;
      const z = Math.sin(a) * 5.2;
      add(new THREE.CylinderGeometry(2.2, 3, 5, 24).rotateZ(Math.PI / 2), light, -LEN / 2 - 16, y, z);
      add(new THREE.CircleGeometry(2.4, 24).rotateY(-Math.PI / 2), glowCyan, -LEN / 2 - 18.6, y, z);
      const s = glowSprite('#7fe6ff', 16, 0.8);
      s.position.set(-LEN / 2 - 20, y, z);
      g.add(s);
      this.engineGlow.push(s);
    }
    // Spine truss along the top, with the lift pod riding it.
    add(new THREE.BoxGeometry(LEN - 6, 0.5, 0.5), light, 0, R + 2.2, -1.2);
    add(new THREE.BoxGeometry(LEN - 6, 0.5, 0.5), light, 0, R + 2.2, 1.2);
    for (let x = -LEN / 2 + 5; x < LEN / 2 - 4; x += 4) add(new THREE.BoxGeometry(0.3, 2.2, 0.3), dark, x, R + 1.2, 0);
    this.lift = new THREE.Group();
    this.lift.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.9, 1.6, 6, 12).rotateZ(Math.PI / 2), glowCyan));
    const lg = glowSprite('#9fefff', 7, 0.9);
    this.lift.add(lg);
    this.lift.position.set(-40, R + 3.2, 0);
    this.lift.visible = false;
    g.add(this.lift);
    // Solar wings.
    const solar = new THREE.MeshStandardMaterial({ color: '#23407a', emissive: '#1a3a8a', emissiveIntensity: 0.35, roughness: 0.25, metalness: 0.7 });
    for (const z of [-1, 1]) {
      add(new THREE.BoxGeometry(2, 0.6, 6), dark, -8, 0, z * (R + 3));
      const wing = add(new THREE.BoxGeometry(26, 0.25, 11), solar, -8, 0, z * (R + 11));
      for (let i = -2; i <= 2; i++) add(new THREE.BoxGeometry(0.2, 0.3, 11), light, -8 + i * 5.2, 0, z * (R + 11));
      wing.rotation.x = z * 0.12;
    }

    // The Bloom: glowing tendrils winding from the impact point toward the Bridge, dotted with pods.
    this.vineMat = new THREE.MeshStandardMaterial({ color: '#ff4fd8', emissive: '#ff2fc0', emissiveIntensity: 1.6, roughness: 0.4 });
    this.podMat = new THREE.MeshStandardMaterial({ color: '#ff8ae0', emissive: '#ff4fd8', emissiveIntensity: 1.3, roughness: 0.3 });
    const rng = new Rng(3);
    for (let v = 0; v < 9; v++) {
      const towardBridge = v < 6;
      const pts: THREE.Vector3[] = [];
      const turns = 0.6 + rng.next() * 0.9;
      const a0 = Math.PI / 2 + (rng.next() - 0.5) * 0.6;
      const x0 = this.impact.x + (rng.next() - 0.5) * 3;
      const x1 = towardBridge ? 38 + rng.next() * 8 : -52 + rng.next() * 6;
      const spin = rng.next() < 0.5 ? 1 : -1;
      for (let i = 0; i <= 40; i++) {
        const f = i / 40;
        const a = a0 + spin * f * turns * Math.PI * 2;
        const r = R + 0.35 + Math.sin(f * 30 + v) * 0.12;
        pts.push(new THREE.Vector3(x0 + (x1 - x0) * f, Math.sin(a) * r, Math.cos(a) * r));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const geo = new THREE.TubeGeometry(curve, 160, 0.32 - v * 0.015, 6, false);
      const mesh = new THREE.Mesh(geo, this.vineMat);
      g.add(mesh);
      this.vines.push({ mesh, count: geo.index ? geo.index.count : 0, start: v * 0.03 });
      for (let k = 0; k < 7; k++) {
        const f = 0.08 + (k / 7) * 0.9 + rng.next() * 0.04;
        const size = 0.7 + rng.next() * 0.9;
        const pod = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), this.podMat);
        pod.position.copy(curve.getPoint(Math.min(1, f)));
        pod.scale.setScalar(0.001);
        g.add(pod);
        this.pods.push({ mesh: pod, at: f, size });
        if (k % 2 === 0) {
          const flower = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.4, 6).translate(0, 0.9, 0), new THREE.MeshStandardMaterial({ color: '#fff4c0', emissive: '#ffd166', emissiveIntensity: 1.6 }));
          flower.position.copy(pod.position);
          flower.lookAt(pod.position.clone().multiplyScalar(2).setX(pod.position.x));
          flower.rotateX(Math.PI / 2);
          flower.scale.setScalar(0.001);
          flower.visible = false;
          g.add(flower);
          this.flowers.push(flower);
        }
      }
    }
    // The spot where the seed struck: a big pulsing Bloom knot.
    const knot = new THREE.Mesh(new THREE.SphereGeometry(2.4, 20, 14), this.podMat);
    knot.position.copy(this.impact);
    knot.scale.set(1.3, 0.55, 1.3);
    knot.scale.multiplyScalar(0.001);
    g.add(knot);
    this.pods.push({ mesh: knot, at: 0, size: 1 });
    this.setGrowth(0);
  }

  /** How far the Bloom has spread over the hull (0 = none, 1 = everywhere). */
  setGrowth(g: number) {
    this.growth = g;
    for (const v of this.vines) {
      const k = THREE.MathUtils.clamp((g - v.start) / (1 - v.start), 0, 1);
      v.mesh.visible = k > 0;
      v.mesh.geometry.setDrawRange(0, Math.floor((v.count * k) / 6) * 6);
    }
    for (const p of this.pods) {
      const k = THREE.MathUtils.clamp((g - p.at) * 6, 0, 1);
      const base = p.at === 0 ? 1 : p.size;
      p.mesh.visible = k > 0;
      p.mesh.scale.setScalar(Math.max(0.001, base * k));
      if (p.at === 0) p.mesh.scale.set(1.3 * k + 0.001, 0.55 * k + 0.001, 1.3 * k + 0.001);
    }
  }

  get spread() {
    return this.growth;
  }

  /** Turns the Bloom gold and opens its flowers (the friendship ending). */
  setGold(k: number) {
    const pink = new THREE.Color('#ff4fd8');
    const gold = new THREE.Color('#ffd166');
    this.vineMat.color.copy(pink).lerp(gold, k);
    this.vineMat.emissive.copy(new THREE.Color('#ff2fc0')).lerp(new THREE.Color('#ffb020'), k);
    this.podMat.color.copy(new THREE.Color('#ff8ae0')).lerp(new THREE.Color('#fff0b0'), k);
    this.podMat.emissive.copy(new THREE.Color('#ff4fd8')).lerp(new THREE.Color('#ffc040'), k);
    this.flowers.forEach((f, i) => {
      const fk = THREE.MathUtils.clamp(k * 1.6 - (i / this.flowers.length) * 0.6, 0, 1);
      f.visible = fk > 0;
      f.scale.setScalar(Math.max(0.001, fk * 1.3));
    });
  }

  /** Spine position (ship space x) of each deck: Cryo at the back, the Bridge at the front. */
  static deckX(index: number) {
    return -40 + (index - 1) * 16.8;
  }

  update(dt: number) {
    this.t += dt;
    for (const [i, s] of this.engineGlow.entries()) s.material.opacity = 0.7 + Math.sin(this.t * 13 + i * 2) * 0.12;
    this.vineMat.emissiveIntensity = 1.4 + Math.sin(this.t * 1.7) * 0.35;
  }
}
