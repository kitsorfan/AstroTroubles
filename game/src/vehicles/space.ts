import * as THREE from 'three';

import { Rng } from '../core/math';
import { glowSprite } from '../entities/models';

/**
 * Space scenery for chapter 3: the starry sky, the gas giant next door with its ring of moons (one of
 * them is Colchis), lumpy asteroids, and the glittering belt the Argo flies through. Shared by the
 * flight level and the Chapter 3 cinematics.
 */

/** A lumpy asteroid shape (radius about 1), different for every seed. */
export function rockGeometry(seed: number, detail = 2): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const rng = new Rng(seed);
  const bumps = [0, 1, 2, 3, 4].map(() => new THREE.Vector3(rng.next() - 0.5, rng.next() - 0.5, rng.next() - 0.5).normalize());
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    let k = 1;
    for (const [j, b] of bumps.entries()) k += Math.max(0, v.dot(b)) ** 3 * (j % 2 ? -0.22 : 0.28);
    k += Math.sin(v.x * 7 + seed) * Math.cos(v.y * 6) * 0.05;
    pos.setXYZ(i, v.x * k, v.y * k * 0.85, v.z * k);
  }
  const flat = g.toNonIndexed();
  flat.computeVertexNormals();
  g.dispose();
  return flat;
}

/** The asteroids' rock, with a few twinkling flecks in it. */
export function rockMaterial(color = '#857a96'): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0.08, flatShading: true });
}

/** Bands of colour for the gas giant: peach, cream and teal, with a big pink storm. */
function giantTexture(): THREE.CanvasTexture {
  const W = 512;
  const H = 256;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  const bands = ['#f6d7a8', '#e8a878', '#fbe8c8', '#7fc8c0', '#f0b890', '#fff0d8', '#d88a6a', '#9ad8d0', '#f6d0a0', '#e09870', '#fbe8c8'];
  const rng = new Rng(9);
  let y = 0;
  while (y < H) {
    const h = 8 + rng.next() * 26;
    g.fillStyle = bands[Math.floor(rng.next() * bands.length)];
    g.fillRect(0, y, W, h + 1);
    y += h;
  }
  // Soft wavy edges between the bands.
  for (let i = 0; i < 60; i++) {
    g.fillStyle = bands[i % bands.length];
    g.globalAlpha = 0.35;
    const yy = rng.next() * H;
    g.beginPath();
    for (let x = 0; x <= W; x += 16) g.lineTo(x, yy + Math.sin(x * 0.05 + i) * 4);
    g.lineTo(W, yy + 6);
    g.lineTo(0, yy + 6);
    g.fill();
  }
  g.globalAlpha = 1;
  const storm = g.createRadialGradient(330, 150, 0, 330, 150, 34);
  storm.addColorStop(0, '#ff8ab8');
  storm.addColorStop(0.6, '#e86a8a');
  storm.addColorStop(1, 'rgba(232,106,138,0)');
  g.fillStyle = storm;
  g.beginPath();
  g.ellipse(330, 150, 40, 18, 0, 0, Math.PI * 2);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The gas giant's rings: a soft striped band. */
function ringTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 4;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  const rng = new Rng(4);
  for (let x = 0; x < 256; x++) {
    const a = Math.sin((x / 256) * Math.PI) * (0.35 + rng.next() * 0.5);
    g.fillStyle = `rgba(${230 + rng.next() * 25},${200 + rng.next() * 40},${170 + rng.next() * 60},${a})`;
    g.fillRect(x, 0, 1, 4);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The colours of the moons in the ring; Colchis (the last) is green and gold. */
const MOONS = ['#c8b8a8', '#9ab0d0', '#e0c090', '#b8a0c8', '#a8c8b0', '#d8a888', '#c0c8d8', '#6ac070'];

export interface GasGiant {
  group: THREE.Group;
  /** The moon Colchis: green, with a faint golden glow. */
  colchis: THREE.Object3D;
  update(dt: number): void;
}

/** The gas giant with its tilted rings and a ring of moons around it (radius 1 = the planet). */
export function makeGasGiant(): GasGiant {
  const group = new THREE.Group();
  const tilt = new THREE.Group();
  tilt.rotation.set(0.32, 0, -0.24);
  group.add(tilt);
  const planet = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.MeshStandardMaterial({ map: giantTexture(), roughness: 0.9, fog: false }));
  tilt.add(planet);
  group.add(glowSprite('#ffc8a0', 3.2, 0.35));
  const ringG = new THREE.RingGeometry(1.35, 2.3, 96, 1);
  // Map the stripes across the ring's width.
  const uv = ringG.getAttribute('uv') as THREE.BufferAttribute;
  const p = ringG.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (Math.hypot(p.getX(i), p.getY(i)) - 1.35) / 0.95, 0.5);
  const ring = new THREE.Mesh(ringG, new THREE.MeshBasicMaterial({ map: ringTexture(), transparent: true, side: THREE.DoubleSide, depthWrite: false, fog: false }));
  ring.rotation.x = -Math.PI / 2;
  tilt.add(ring);
  // The ring of moons, a little outside the rings.
  const moons = new THREE.Group();
  let colchis: THREE.Object3D = moons;
  MOONS.forEach((color, i) => {
    const a = (i / MOONS.length) * Math.PI * 2 + 0.4;
    const r = i === MOONS.length - 1 ? 0.16 : 0.07 + (i % 3) * 0.03;
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), new THREE.MeshStandardMaterial({ color, roughness: 0.85, fog: false, emissive: i === MOONS.length - 1 ? '#2a5a10' : '#000000' }));
    m.position.set(Math.cos(a) * 2.9, Math.sin(a * 2) * 0.12, Math.sin(a) * 2.9);
    moons.add(m);
    if (i === MOONS.length - 1) {
      const halo = glowSprite('#ffd166', r * 3.5, 0.5);
      m.add(halo);
      colchis = m;
    }
  });
  tilt.add(moons);
  let t = 0;
  return {
    group,
    colchis,
    update(dt: number) {
      t += dt;
      planet.rotation.y += dt * 0.01;
      moons.rotation.y = t * 0.004;
    },
  };
}

/** Stars all around, and a few soft nebula clouds (radius `r`). Nothing here is touched by fog. */
export function makeStarSky(r: number, seed = 5): THREE.Group {
  const g = new THREE.Group();
  const rng = new Rng(seed);
  const n = 2200;
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const u = rng.next() * 2 - 1;
    const a = rng.next() * Math.PI * 2;
    const q = Math.sqrt(1 - u * u);
    pos.set([Math.cos(a) * q * r, u * r, Math.sin(a) * q * r], i * 3);
    c.setHSL(0.55 + rng.next() * 0.4, 0.5, 0.72 + rng.next() * 0.28);
    col.set([c.r, c.g, c.b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: 1.8, sizeAttenuation: false, vertexColors: true, fog: false, depthWrite: false })));
  for (let i = 0; i < 6; i++) {
    const neb = glowSprite(['#4a1a7a', '#1a3a7a', '#7a1a5a'][i % 3], r * (0.7 + rng.next() * 0.6), 0.22);
    (neb.material as THREE.SpriteMaterial).fog = false;
    const a = rng.next() * Math.PI * 2;
    neb.position.set(Math.cos(a) * r * 0.9, (rng.next() - 0.3) * r * 0.5, Math.sin(a) * r * 0.9);
    g.add(neb);
  }
  g.renderOrder = -10;
  return g;
}

/**
 * The glittering belt either side of the flight corridor: tumbling asteroids and sparkles that stream
 * past while the Argo flies (they wrap around, so the belt never ends). `thick` 0..1.
 */
export class Belt {
  readonly group = new THREE.Group();
  private rocks: THREE.InstancedMesh;
  private data: { x: number; y: number; z: number; s: number; rx: number; ry: number; spin: number }[] = [];
  private glitter: THREE.Points;
  private gpos: Float32Array;
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private e = new THREE.Euler();
  private v = new THREE.Vector3();
  private sc = new THREE.Vector3();
  static readonly LOOP = 520;

  constructor(thick: number, seed = 31) {
    const rng = new Rng(seed);
    const count = Math.round(140 + 160 * thick);
    this.rocks = new THREE.InstancedMesh(rockGeometry(seed, 1), rockMaterial('#7a7088'), count);
    for (let i = 0; i < count; i++) {
      const side = rng.next() < 0.5 ? -1 : 1;
      const far = rng.next();
      // Mostly to the sides and below, a few above: the corridor itself stays clear.
      const x = side * (13 + far * far * 70);
      const y = (rng.next() - 0.6) * (16 + far * 50);
      this.data.push({ x, y, z: -rng.next() * Belt.LOOP + 60, s: 0.6 + rng.next() * rng.next() * 6, rx: rng.next() * 6, ry: rng.next() * 6, spin: (rng.next() - 0.5) * 1.2 });
    }
    this.rocks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.rocks.frustumCulled = false;
    this.group.add(this.rocks);
    const gn = 500;
    this.gpos = new Float32Array(gn * 3);
    const gcol = new Float32Array(gn * 3);
    const c = new THREE.Color();
    for (let i = 0; i < gn; i++) {
      const side = rng.next() < 0.5 ? -1 : 1;
      this.gpos.set([side * (4 + rng.next() * 60), (rng.next() - 0.5) * 50, -rng.next() * Belt.LOOP + 60], i * 3);
      c.set(['#ffe6a0', '#bff4ff', '#ffc0f0', '#ffffff'][i % 4]);
      gcol.set([c.r, c.g, c.b], i * 3);
    }
    const gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.BufferAttribute(this.gpos, 3));
    gg.setAttribute('color', new THREE.BufferAttribute(gcol, 3));
    this.glitter = new THREE.Points(gg, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.glitter.frustumCulled = false;
    this.group.add(this.glitter);
    this.update(0, 0);
  }

  /** Streams everything past by `ds` units (the distance the Argo just flew). */
  update(dt: number, ds: number) {
    const L = Belt.LOOP;
    this.data.forEach((d, i) => {
      d.z += ds;
      if (d.z > 60) d.z -= L;
      d.rx += d.spin * dt;
      d.ry += d.spin * dt * 0.7;
      this.e.set(d.rx, d.ry, 0);
      this.q.setFromEuler(this.e);
      this.m.compose(this.v.set(d.x, d.y, d.z), this.q, this.sc.setScalar(d.s));
      this.rocks.setMatrixAt(i, this.m);
    });
    this.rocks.instanceMatrix.needsUpdate = true;
    const p = this.gpos;
    for (let i = 2; i < p.length; i += 3) {
      p[i] += ds;
      if (p[i] > 60) p[i] -= L;
    }
    (this.glitter.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.glitter.material as THREE.PointsMaterial).opacity = 0.6 + Math.sin(performance.now() * 0.004) * 0.25;
  }
}
