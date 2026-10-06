import * as THREE from 'three';

import type { ParticleMood } from './themes';

const VERT = `
attribute float size;
attribute float alpha;
attribute vec3 tint;
varying float vAlpha;
varying vec3 vTint;
uniform float scale;
uniform float maxPx;
void main() {
  vAlpha = alpha;
  vTint = tint;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = min(maxPx, size * scale / max(0.1, -mv.z));
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = `
varying float vAlpha;
varying vec3 vTint;
void main() {
  vec2 p = gl_PointCoord - 0.5;
  float d = length(p);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vTint * (0.6 + a * 0.8), a * vAlpha);
}`;

export interface EmitOpts {
  count: number;
  color: string | THREE.Color;
  speed?: number;
  up?: number;
  life?: number;
  size?: number;
  gravity?: number;
  spread?: number;
  drag?: number;
  /** A base velocity added to every particle (wind streaks, sprays). */
  vel?: [number, number, number];
}

export class Particles {
  readonly points: THREE.Points;
  private readonly max: number;
  private pos: Float32Array;
  private vel: Float32Array;
  private tint: Float32Array;
  private size: Float32Array;
  private baseSize: Float32Array;
  private alpha: Float32Array;
  private life: Float32Array;
  private maxLife: Float32Array;
  private grav: Float32Array;
  private drag: Float32Array;
  private cursor = 0;
  private geo: THREE.BufferGeometry;
  private mat: THREE.ShaderMaterial;
  private tmp = new THREE.Color();

  constructor(max: number) {
    this.max = max;
    this.pos = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3);
    this.tint = new Float32Array(max * 3);
    this.size = new Float32Array(max);
    this.baseSize = new Float32Array(max);
    this.alpha = new Float32Array(max);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max);
    this.grav = new Float32Array(max);
    this.drag = new Float32Array(max);
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('tint', new THREE.BufferAttribute(this.tint, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('size', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { scale: { value: 400 }, maxPx: { value: 4096 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
  }

  setViewportHeight(h: number) {
    this.mat.uniforms.scale.value = h * 0.9;
  }

  emit(x: number, y: number, z: number, o: EmitOpts) {
    this.tmp.set(o.color);
    const speed = o.speed ?? 4;
    const spread = o.spread ?? 1;
    for (let n = 0; n < o.count; n++) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % this.max;
      const a = Math.random() * Math.PI * 2;
      const u = Math.random() * 2 - 1;
      const s = Math.sqrt(1 - u * u);
      const v = speed * (0.4 + Math.random() * 0.6);
      this.pos[i * 3] = x;
      this.pos[i * 3 + 1] = y;
      this.pos[i * 3 + 2] = z;
      const [bx, by, bz] = o.vel ?? [0, 0, 0];
      this.vel[i * 3] = Math.cos(a) * s * v * spread + bx;
      this.vel[i * 3 + 1] = u * v * spread + (o.up ?? 0) + by;
      this.vel[i * 3 + 2] = Math.sin(a) * s * v * spread + bz;
      this.tint[i * 3] = this.tmp.r;
      this.tint[i * 3 + 1] = this.tmp.g;
      this.tint[i * 3 + 2] = this.tmp.b;
      const life = (o.life ?? 0.6) * (0.6 + Math.random() * 0.6);
      this.life[i] = life;
      this.maxLife[i] = life;
      this.baseSize[i] = (o.size ?? 0.5) * (0.6 + Math.random() * 0.7);
      this.grav[i] = o.gravity ?? 6;
      this.drag[i] = o.drag ?? 1.5;
    }
  }

  update(dt: number) {
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) {
        this.alpha[i] = 0;
        continue;
      }
      this.life[i] -= dt;
      const k = Math.max(0, this.life[i] / this.maxLife[i]);
      const dr = Math.exp(-this.drag[i] * dt);
      this.vel[i * 3] *= dr;
      this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * dr - this.grav[i] * dt;
      this.vel[i * 3 + 2] *= dr;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.alpha[i] = k;
      this.size[i] = this.baseSize[i] * (0.4 + 0.6 * k);
    }
    for (const name of ['position', 'tint', 'size', 'alpha']) (this.geo.getAttribute(name) as THREE.BufferAttribute).needsUpdate = true;
  }
}

interface MoodCfg {
  color: string;
  count: number;
  fall: number;
  size: number;
  sway: number;
  /** Steady wind (units per second) blowing the particles sideways. */
  wind?: [number, number];
  /** Normal blending, so dark particles (ash) can darken the view; the rest add light. */
  solid?: boolean;
  alpha?: number;
}

const MOOD: Record<ParticleMood, MoodCfg> = {
  snow: { color: '#dff6ff', count: 260, fall: 1.4, size: 0.35, sway: 0.6 },
  spores: { color: '#d8ff8a', count: 160, fall: -0.25, size: 0.3, sway: 0.9 },
  embers: { color: '#ffae4a', count: 180, fall: -1.2, size: 0.28, sway: 0.5 },
  petals: { color: '#ffb8e8', count: 150, fall: 0.8, size: 0.34, sway: 1.2 },
  sparks: { color: '#ffd0d4', count: 110, fall: 0.2, size: 0.22, sway: 0.4 },
  motes: { color: '#f0c8ff', count: 200, fall: -0.4, size: 0.3, sway: 0.8 },
  pollen: { color: '#fff0a0', count: 170, fall: -0.15, size: 0.26, sway: 1.1, wind: [0.6, 0.2] },
  dust: { color: '#f4dcb0', count: 260, fall: 0.15, size: 0.3, sway: 0.4, wind: [5.5, 1.2], solid: true, alpha: 0.45 },
  snowfall: { color: '#ffffff', count: 360, fall: 2.2, size: 0.34, sway: 0.7, wind: [1.6, 0.6], solid: true, alpha: 0.75 },
  leaves: { color: '#9adf5a', count: 130, fall: 0.9, size: 0.38, sway: 1.6, wind: [0.4, 0.3], solid: true, alpha: 0.8 },
  ash: { color: '#3a2a28', count: 240, fall: 0.6, size: 0.32, sway: 0.5, wind: [0.8, -0.4], solid: true, alpha: 0.6 },
};

/** Drifting ambient particles that wrap around the camera target. */
export class Ambience {
  readonly points: THREE.Points;
  private pos: Float32Array;
  private seed: Float32Array;
  private readonly cfg: MoodCfg;
  private readonly R = 22;

  constructor(mood: ParticleMood) {
    this.cfg = MOOD[mood];
    const n = this.cfg.count;
    this.pos = new Float32Array(n * 3);
    this.seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      this.pos[i * 3] = (Math.random() * 2 - 1) * this.R;
      this.pos[i * 3 + 1] = Math.random() * 14 - 2;
      this.pos[i * 3 + 2] = (Math.random() * 2 - 1) * this.R;
      this.seed[i] = Math.random() * 100;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    const size = new Float32Array(n).fill(this.cfg.size);
    const alpha = new Float32Array(n).fill(this.cfg.alpha ?? 0.32);
    const c = new THREE.Color(this.cfg.color);
    const tint = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      tint[i * 3] = c.r;
      tint[i * 3 + 1] = c.g;
      tint[i * 3 + 2] = c.b;
    }
    geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));
    geo.setAttribute('tint', new THREE.BufferAttribute(tint, 3));
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { scale: { value: 400 }, maxPx: { value: 12 } },
      transparent: true,
      depthWrite: false,
      blending: this.cfg.solid ? THREE.NormalBlending : THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
  }

  setViewportHeight(h: number) {
    const u = (this.points.material as THREE.ShaderMaterial).uniforms;
    u.scale.value = h * 0.9;
    u.maxPx.value = Math.max(6, h * 0.022) * (window.devicePixelRatio || 1);
  }

  update(dt: number, time: number, cx: number, cy: number, cz: number) {
    const R = this.R;
    const n = this.cfg.count;
    for (let i = 0; i < n; i++) {
      const s = this.seed[i];
      const [wx, wz] = this.cfg.wind ?? [0, 0];
      // Gusts: the wind rises and falls, a little differently for each particle.
      const gust = 0.6 + 0.4 * Math.sin(time * 0.9 + s * 0.3);
      let x = this.pos[i * 3] + (Math.sin(time * 0.7 + s) * this.cfg.sway + wx * gust) * dt;
      let y = this.pos[i * 3 + 1] - this.cfg.fall * dt;
      let z = this.pos[i * 3 + 2] + (Math.cos(time * 0.6 + s) * this.cfg.sway + wz * gust) * dt;
      if (y < -3) y += 16;
      if (y > 13) y -= 16;
      if (x - cx > R) x -= R * 2;
      if (x - cx < -R) x += R * 2;
      if (z - cz > R) z -= R * 2;
      if (z - cz < -R) z += R * 2;
      this.pos[i * 3] = x;
      this.pos[i * 3 + 1] = y;
      this.pos[i * 3 + 2] = z;
    }
    this.points.position.set(0, cy - 2, 0);
    (this.points.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
  }
}
