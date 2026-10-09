import * as THREE from 'three';

import { rockGeometry, rockMaterial } from '../space';
import { DIVE } from './dive';
import { SEABED } from './seaView';

/**
 * The Sirens' Sea itself, around the Dolphin: a blue-green water sky with the bright surface far above,
 * rippled sand on the seabed, canyon walls of rock (and sunken Gardener ruins along the way), slanting
 * sunbeams, drifting specks of "marine snow" and little schools of friendly fish. It all scrolls with the
 * distance swum, so the sub stays near the origin like the Argo does.
 */

/** A little integer hash for placing scenery the same way every time. */
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d') as CanvasRenderingContext2D);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Rippled sand: pale stripes and a few pebbles. */
function sandTexture() {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#a89c7a';
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 18; i++) {
      g.strokeStyle = i % 2 ? 'rgba(255,248,220,0.35)' : 'rgba(120,100,60,0.25)';
      g.lineWidth = 5;
      g.beginPath();
      for (let x = 0; x <= 256; x += 16) g.lineTo(x, i * 14 + Math.sin(x * 0.05 + i) * 4);
      g.stroke();
    }
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(90,80,60,${0.2 + hash(i) * 0.3})`;
      g.beginPath();
      g.arc(hash(i + 3) * 256, hash(i + 9) * 256, 1.5 + hash(i + 5) * 3, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/** The water's surface seen from below: bright wobbly light cells. */
function surfaceTexture() {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#2a90b0';
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 30; i++) {
      const x = hash(i) * 256;
      const y = hash(i + 50) * 256;
      const r = 14 + hash(i + 20) * 26;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(230,255,255,0.9)');
      grad.addColorStop(1, 'rgba(230,255,255,0)');
      g.fillStyle = grad;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });
}

/** A soft vertical sunbeam. */
function beamTexture() {
  return canvasTexture(64, 256, (g) => {
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, 'rgba(220,250,255,0.55)');
    grad.addColorStop(1, 'rgba(220,250,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 256);
    const side = g.createLinearGradient(0, 0, 64, 0);
    side.addColorStop(0, 'rgba(0,0,0,1)');
    side.addColorStop(0.5, 'rgba(0,0,0,0)');
    side.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = side;
    g.fillRect(0, 0, 64, 256);
  });
}

const SLOT = 7;
const SHALLOW = new THREE.Color('#62d4ec');
const DEEP = new THREE.Color('#0a2a40');
const AHEAD = 170;
const SNOW = 260;

export class Sea {
  readonly group = new THREE.Group();
  readonly dome: THREE.Mesh;
  private domeTop: THREE.Color;
  private sand: THREE.CanvasTexture;
  private light: THREE.CanvasTexture;
  private walls: THREE.InstancedMesh;
  private ruins: THREE.InstancedMesh;
  private beams: THREE.Mesh[] = [];
  private beamMat: THREE.MeshBasicMaterial;
  private snow: THREE.Points;
  private snowBase: Float32Array;
  private fish: THREE.InstancedMesh;
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private e = new THREE.Euler();
  private p = new THREE.Vector3();
  private sc = new THREE.Vector3();

  /** `ruins`: stretches of the course [s0, s1] where sunken Gardener ruins line the canyon. */
  constructor(private ruinSpans: [number, number][]) {
    this.domeTop = new THREE.Color('#62d4ec');
    this.dome = new THREE.Mesh(
      new THREE.SphereGeometry(300, 32, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        fog: false,
        uniforms: { top: { value: this.domeTop }, mid: { value: new THREE.Color('#0b4f6e') }, bottom: { value: new THREE.Color('#021226') } },
        vertexShader: `varying vec3 vPos; void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vPos;
          void main(){ float h = normalize(vPos).y;
          vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.8, h)) : mix(mid, bottom, smoothstep(0.0, 0.5, -h));
          gl_FragColor = vec4(c, 1.0); }`,
      }),
    );
    this.dome.renderOrder = -9;
    this.group.add(this.dome);

    this.sand = sandTexture();
    this.sand.repeat.set(6, 22);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(90, 330).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: this.sand, roughness: 0.95 }));
    floor.position.set(0, SEABED - 0.6, -140);
    this.light = surfaceTexture();
    this.light.repeat.set(10, 10);
    const surface = new THREE.Mesh(
      new THREE.PlaneGeometry(700, 700).rotateX(Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: this.light, transparent: true, opacity: 0.75, fog: false, depthWrite: false }),
    );
    surface.position.set(0, 38, -150);
    this.group.add(floor, surface);

    const stone = rockMaterial('#4e6670');
    this.walls = new THREE.InstancedMesh(rockGeometry(31), stone, 120);
    this.ruins = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1.15, 1, 10).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ color: '#9ab8b0', roughness: 0.85, flatShading: true }), 60);
    this.fish = new THREE.InstancedMesh(new THREE.ConeGeometry(0.22, 0.8, 5).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5, emissive: '#204050', emissiveIntensity: 0.4 }), 48);
    this.fish.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(48 * 3), 3);
    const tint = ['#ffb84a', '#5ec8ff', '#ff7a9a', '#ffe066'].map((c) => new THREE.Color(c));
    for (let i = 0; i < 48; i++) this.fish.setColorAt(i, tint[Math.floor(i / 12)]);
    for (const im of [this.walls, this.ruins, this.fish]) {
      im.frustumCulled = false;
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.group.add(im);
    }

    this.beamMat = new THREE.MeshBasicMaterial({ map: beamTexture(), transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
    for (let i = 0; i < 9; i++) {
      const b = new THREE.Mesh(new THREE.PlaneGeometry(5, 46).translate(0, -23, 0), this.beamMat);
      this.beams.push(b);
      this.group.add(b);
    }

    const pos = new Float32Array(SNOW * 3);
    this.snowBase = new Float32Array(SNOW * 3);
    for (let i = 0; i < SNOW; i++) {
      this.snowBase[i * 3] = (hash(i) - 0.5) * 40;
      this.snowBase[i * 3 + 1] = (hash(i + 400) - 0.5) * 22;
      this.snowBase[i * 3 + 2] = hash(i + 800) * 70;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.snow = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#d8f6ff', size: 0.14, transparent: true, opacity: 0.7, depthWrite: false }));
    this.snow.frustumCulled = false;
    this.group.add(this.snow);
  }

  private inRuins(s: number) {
    return this.ruinSpans.some(([a, b]) => s >= a && s <= b);
  }

  private place(im: THREE.InstancedMesh, i: number, x: number, y: number, z: number, sx: number, sy: number, sz: number, ry = 0, rz = 0) {
    this.q.setFromEuler(this.e.set(0, ry, rz));
    this.m.compose(this.p.set(x, y, z), this.q, this.sc.set(sx, sy, sz));
    im.setMatrixAt(i, this.m);
  }

  /** Scrolls the sea to distance `s`; `dark` (0..1) dims the sunbeams and the far water in deep stretches. */
  update(s: number, t: number, cam: THREE.Vector3, dark: number) {
    this.dome.position.copy(cam);
    this.domeTop.copy(SHALLOW).lerp(DEEP, dark);
    this.sand.offset.y = s / (330 / 22);
    this.light.offset.set(t * 0.01, s / 70 + t * 0.006);

    // Canyon walls (boulders on both sides) and sunken ruins along some stretches.
    let w = 0;
    let r = 0;
    const k0 = Math.floor((s - 10) / SLOT);
    for (let k = k0; k * SLOT < s + AHEAD; k++) {
      const z = -(k * SLOT - s);
      for (const side of [-1, 1]) {
        const h = hash(k * 2 + (side > 0 ? 1 : 0));
        if (w < 120) this.place(this.walls, w++, side * (DIVE.halfW + 10 + h * 7), SEABED + h * 6, z, 3 + h * 3, 4 + h * 6, 3 + h * 3, k, 0);
        if (this.inRuins(k * SLOT) && h > 0.45 && r < 60) {
          const tall = 3 + hash(k + 70) * 10;
          this.place(this.ruins, r++, side * (DIVE.halfW + 3 + h * 2.5), SEABED - 0.5, z + 2, 1.1, tall, 1.1, 0, side * (hash(k + 5) - 0.5) * 0.4);
        }
      }
    }
    this.walls.count = w;
    this.ruins.count = r;
    this.walls.instanceMatrix.needsUpdate = true;
    this.ruins.instanceMatrix.needsUpdate = true;

    // Sunbeams slant down from the surface, a few ahead at a time.
    this.beamMat.opacity = 0.42 * (1 - dark);
    const b0 = Math.floor(s / 24);
    this.beams.forEach((b, i) => {
      const k = b0 + i;
      b.position.set((hash(k + 11) - 0.5) * 26, 30, -(k * 24 - s) - 10);
      b.rotation.set(0, hash(k + 3) * Math.PI, 0.25 + Math.sin(t * 0.3 + k) * 0.05);
    });

    // Marine snow drifting past.
    const pos = this.snow.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < SNOW; i++) {
      const z = ((this.snowBase[i * 3 + 2] + s) % 70) - 62;
      pos.setXYZ(i, this.snowBase[i * 3] + Math.sin(t * 0.4 + i) * 0.4, this.snowBase[i * 3 + 1] - ((t * 0.3) % 22), z);
    }
    pos.needsUpdate = true;

    // Four little schools of friendly fish swimming across, far to the sides.
    for (let i = 0; i < 48; i++) {
      const school = Math.floor(i / 12);
      const dir = school % 2 ? 1 : -1;
      const sx = ((t * 2.2 * dir + school * 30 + 400) % 60) - 30;
      const sz = -40 - school * 26;
      const a = i * 2.4;
      this.place(this.fish, i, sx + Math.cos(a) * 1.4, 2 - school * 1.5 + Math.sin(a) * 0.9 + Math.sin(t * 2 + i) * 0.2, sz + Math.sin(a * 1.3) * 1.5, 1, 1, 1, dir > 0 ? Math.PI / 2 : -Math.PI / 2, 0);
    }
    this.fish.instanceMatrix.needsUpdate = true;
  }
}
