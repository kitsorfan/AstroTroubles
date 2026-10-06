import * as THREE from 'three';

import { Rng } from '../core/math';
import { glowSprite } from '../entities/models';
import type { DeckId } from '../world/levelTypes';
import { Particles } from '../world/particles';
import { glowTexture } from '../world/textures';
import type { Rig } from './director';

/**
 * Gaia Nova from the air: an island continent where the six regions of chapter 2 sit side by side,
 * from the Whispering Plains in the west to the volcano Mount Atlantas in the east. The shuttle
 * flies between them in the cinematics, and the chapter's ending is staged over it.
 */

type Region = 'plains' | 'desert' | 'snow' | 'rockies' | 'jungle' | 'volcano';

/** Where each region lies on the continent (world X, Z). */
const REGION: Record<Region, [number, number]> = {
  plains: [-430, 20],
  desert: [-250, 320],
  snow: [-60, -360],
  rockies: [190, -210],
  jungle: [320, 230],
  volcano: [520, -10],
};

const COLOR: Record<Region, string> = {
  plains: '#6aa83e',
  desert: '#e0c080',
  snow: '#eef4fc',
  rockies: '#8a8070',
  jungle: '#2f6a2a',
  volcano: '#3a2a28',
};

/** The volcano's crater rim height. */
const PEAK = 150;

/** How strongly each region claims a point (soft nearest-region blend). */
function weights(x: number, z: number): [Region, number][] {
  const out: [Region, number][] = [];
  let sum = 0;
  for (const r of Object.keys(REGION) as Region[]) {
    const [rx, rz] = REGION[r];
    const d = Math.hypot(x - rx, z - rz) + 1;
    const w = 1 / d ** 4;
    out.push([r, w]);
    sum += w;
  }
  return out.map(([r, w]) => [r, w / sum]);
}

/** Terrain height: rolling land per region, dunes, snowy hills, sharp mountains, and the volcano's cone. */
function height(x: number, z: number): number {
  const n = Math.sin(x * 0.011) * Math.cos(z * 0.013) * 6 + Math.sin(x * 0.031 + z * 0.02) * 3;
  let h = 0;
  for (const [r, w] of weights(x, z)) {
    let rh = 0;
    switch (r) {
      case 'plains':
        rh = 8 + n;
        break;
      case 'desert':
        rh = 10 + Math.abs(Math.sin(x * 0.045 + Math.sin(z * 0.02) * 2)) * 10;
        break;
      case 'snow':
        rh = 30 + n * 3 + Math.abs(Math.sin(x * 0.02) * Math.cos(z * 0.025)) * 30;
        break;
      case 'rockies':
        rh = 40 + Math.abs(Math.sin(x * 0.035) * Math.cos(z * 0.03)) * 90 + Math.abs(Math.sin(x * 0.08 + z * 0.05)) * 25;
        break;
      case 'jungle':
        rh = 10 + n * 1.5;
        break;
      case 'volcano':
        rh = 12 + n;
        break;
    }
    h += rh * w;
  }
  // The volcano's cone rises out of everything, with a crater on top.
  const [vx, vz] = REGION.volcano;
  const dv = Math.hypot(x - vx, z - vz);
  if (dv < 170) {
    const k = 1 - dv / 170;
    h = Math.max(h, PEAK * k * k * (3 - 2 * k) - (dv < 22 ? (22 - dv) * 1.6 : 0));
  }
  // An island: the land slopes down into the sea toward the edges.
  const edge = Math.hypot(x / 1.25, z) - 640;
  if (edge > 0) h -= edge * 0.35;
  return h;
}

/** A small, chunky shuttle with stubby wings and two glowing engines (it points along +X). */
function makeShuttle(): THREE.Group {
  const g = new THREE.Group();
  const hull = new THREE.MeshStandardMaterial({ color: '#e6edf7', roughness: 0.4, metalness: 0.3 });
  const trim = new THREE.MeshStandardMaterial({ color: '#ff8a3d', roughness: 0.5 });
  const glass = new THREE.MeshStandardMaterial({ color: '#5ee0ff', emissive: '#3fb6ff', emissiveIntensity: 0.8, roughness: 0.1 });
  g.add(new THREE.Mesh(new THREE.CapsuleGeometry(1.4, 4, 8, 16).rotateZ(Math.PI / 2), hull));
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1.0, 16, 12), glass);
  nose.position.set(2.6, 0.5, 0);
  nose.scale.set(1, 0.6, 0.9);
  g.add(nose);
  for (const s of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 2.6), hull);
    wing.position.set(-0.6, -0.3, s * 2);
    wing.rotation.y = s * 0.3;
    g.add(wing);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.22, 0.4), trim);
    stripe.position.set(-0.6, -0.3, s * 2.9);
    stripe.rotation.y = s * 0.3;
    g.add(stripe);
    const engine = glowSprite('#7fe6ff', 2.6, 0.9);
    engine.position.set(-3.6, 0, s * 0.8);
    g.add(engine);
  }
  const fin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 0.2), trim);
  fin.position.set(-2.2, 1.2, 0);
  g.add(fin);
  return g;
}

export class PlanetScene {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(48, 16 / 9, 1, 5000);
  readonly particles = new Particles(1200);
  readonly shuttle = makeShuttle();
  /** Extra shuttles for the colonists landing in the ending. */
  readonly fleet: THREE.Group[] = [];
  /** The volcano's glowing crater, which cools down in the ending. */
  readonly crater: THREE.Sprite;
  private craterLight: THREE.PointLight;
  private smoke = 1;
  private t = 0;
  private shakeAmt = 0;

  constructor() {
    const s = this.scene;
    s.background = new THREE.Color('#8ec4ee');
    s.fog = new THREE.Fog('#bcdcf2', 500, 2200);
    // A soft gradient sky.
    s.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(2600, 32, 16),
        new THREE.ShaderMaterial({
          side: THREE.BackSide,
          depthWrite: false,
          fog: false,
          uniforms: { top: { value: new THREE.Color('#3f86d6') }, bottom: { value: new THREE.Color('#dcefff') } },
          vertexShader: `varying vec3 vPos; void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
          fragmentShader: `uniform vec3 top; uniform vec3 bottom; varying vec3 vPos;
            void main(){ float h = normalize(vPos).y; gl_FragColor = vec4(mix(bottom, top, smoothstep(-0.05, 0.45, h)), 1.0); }`,
        }),
      ),
    );
    s.add(new THREE.HemisphereLight('#e2f2ff', '#4a5a2a', 1.1));
    const sun = new THREE.DirectionalLight('#fff3d8', 2.2);
    sun.position.set(300, 600, 200);
    s.add(sun);
    const disc = glowSprite('#fff6d0', 260, 0.9);
    disc.position.set(900, 700, -1400);
    s.add(disc);

    // The continent.
    const size = 1700;
    const seg = 220;
    const geo = new THREE.PlaneGeometry(size, size, seg, seg).rotateX(-Math.PI / 2);
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    const tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = height(x, z);
      pos.setY(i, h);
      c.setRGB(0, 0, 0);
      for (const [r, w] of weights(x, z)) c.add(tmp.set(COLOR[r]).multiplyScalar(w));
      // Snow on the high peaks, sand along the beaches, dark rock near the crater.
      if (h > 95) c.lerp(tmp.set('#f4f8ff'), Math.min(1, (h - 95) / 30));
      if (h < 4) c.lerp(tmp.set('#e8d8a8'), Math.min(1, (4 - h) / 5));
      const [vx, vz] = REGION.volcano;
      if (Math.hypot(x - vx, z - vz) < 60) c.lerp(tmp.set('#2a1a18'), 0.6);
      c.multiplyScalar(0.9 + Math.sin(x * 0.2) * Math.cos(z * 0.17) * 0.06);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    s.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true })));

    const sea = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#2a6ab8', roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.92 }));
    sea.position.y = 0.5;
    s.add(sea);

    // Trees and rocks, as instanced shapes coloured by region.
    const rng = new Rng(23);
    const crown = new THREE.SphereGeometry(1, 7, 5);
    const pine = new THREE.ConeGeometry(1, 2.6, 6).translate(0, 1.3, 0);
    const trees = new THREE.InstancedMesh(crown, new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), 700);
    const pines = new THREE.InstancedMesh(pine, new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), 500);
    let nt = 0;
    let np = 0;
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (let i = 0; i < 6000 && (nt < 700 || np < 500); i++) {
      const x = (rng.next() - 0.5) * 1300;
      const z = (rng.next() - 0.5) * 1100;
      const h = height(x, z);
      if (h < 3) continue;
      const [best] = weights(x, z).sort((a, b) => b[1] - a[1])[0];
      const r = 4 + rng.next() * 5;
      if ((best === 'jungle' || (best === 'plains' && rng.next() < 0.25)) && nt < 700) {
        m4.compose(new THREE.Vector3(x, h + r * 0.6, z), q, new THREE.Vector3(r, r * 0.9, r));
        trees.setMatrixAt(nt, m4);
        trees.setColorAt(nt++, tmp.set(best === 'jungle' ? '#1f5a1c' : '#3f7a2f').multiplyScalar(0.8 + rng.next() * 0.4));
      } else if ((best === 'snow' || best === 'rockies') && rng.next() < 0.6 && np < 500 && h < 110) {
        m4.compose(new THREE.Vector3(x, h, z), q, new THREE.Vector3(r * 0.6, r, r * 0.6));
        pines.setMatrixAt(np, m4);
        pines.setColorAt(np++, tmp.set(best === 'snow' ? '#e8f0f8' : '#2f5a34').multiplyScalar(0.85 + rng.next() * 0.3));
      }
    }
    trees.count = nt;
    pines.count = np;
    for (const im of [trees, pines]) {
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.computeBoundingSphere();
      s.add(im);
    }

    // Clouds drifting over the land.
    const cloudMat = new THREE.SpriteMaterial({ map: glowTexture(), color: '#ffffff', transparent: true, opacity: 0.6, depthWrite: false });
    for (let i = 0; i < 60; i++) {
      const cs = new THREE.Sprite(cloudMat);
      const w = 60 + rng.next() * 120;
      cs.scale.set(w * 1.8, w, 1);
      cs.position.set((rng.next() - 0.5) * 1600, 170 + rng.next() * 90, (rng.next() - 0.5) * 1400);
      s.add(cs);
    }

    // The crater glows, and lights the smoke above it.
    const [vx, vz] = REGION.volcano;
    this.crater = glowSprite('#ff6a12', 90, 0.9);
    this.crater.position.set(vx, PEAK - 6, vz);
    s.add(this.crater);
    this.craterLight = new THREE.PointLight('#ff6a12', 40000, 500, 2);
    this.craterLight.position.set(vx, PEAK + 20, vz);
    s.add(this.craterLight);

    s.add(this.shuttle);
    for (let i = 0; i < 5; i++) {
      const f = makeShuttle();
      f.visible = false;
      this.fleet.push(f);
      s.add(f);
    }
    this.particles.setViewportHeight(window.innerHeight);
    s.add(this.particles.points);
  }

  /** Where a region is, at a height above its ground. */
  static region(id: DeckId, above = 0): THREE.Vector3 {
    const [x, z] = REGION[(id in REGION ? id : 'plains') as Region];
    return new THREE.Vector3(x, height(x, z) + above, z);
  }

  /** Height of the land at a point. */
  static ground(x: number, z: number): number {
    return height(x, z);
  }

  /** 1 = the volcano smokes and glows; 0 = it has calmed down. */
  setSmoke(k: number) {
    this.smoke = k;
    this.crater.material.opacity = 0.2 + 0.7 * k;
    this.craterLight.intensity = 40000 * k;
  }

  /** Points the shuttle along its direction of travel. */
  aim(obj: THREE.Object3D, from: THREE.Vector3, to: THREE.Vector3) {
    obj.rotation.set(0, Math.atan2(-(to.z - from.z), to.x - from.x), 0);
  }

  shake(a: number) {
    this.shakeAmt = Math.max(this.shakeAmt, a);
  }

  resize(w: number, h: number) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.particles.setViewportHeight(h);
  }

  update(dt: number, rig: Rig) {
    this.t += dt;
    this.particles.update(dt);
    const [vx, vz] = REGION.volcano;
    if (Math.random() < 0.9 * this.smoke) {
      this.particles.emit(vx + (Math.random() - 0.5) * 20, PEAK, vz + (Math.random() - 0.5) * 20, { count: 2, color: Math.random() < 0.3 ? '#ff8a3a' : '#5a4a48', speed: 4, up: 22, life: 4, size: 16, gravity: -1, drag: 0.2 });
    }
    const c = this.camera;
    c.position.copy(rig.pos);
    if (this.shakeAmt > 0) {
      c.position.x += (Math.random() - 0.5) * this.shakeAmt;
      c.position.y += (Math.random() - 0.5) * this.shakeAmt;
      this.shakeAmt = Math.max(0, this.shakeAmt - dt * 3);
    }
    if (c.fov !== rig.fov) {
      c.fov = rig.fov;
      c.updateProjectionMatrix();
    }
    c.lookAt(rig.look);
  }
}
