import * as THREE from 'three';

import { holoFaceArt } from '../ui/icons';
import type { HoloSpeaker } from '../world/levelTypes';
import { glowSprite, mat, mesh, ownMat } from './models';

/**
 * Holograms: the recorded messages a projector plays when Jason walks up to it. A figure made of
 * light (with the speaker's own face, from their portrait) stands in a soft cone of light over a
 * projector, built up from the feet in little cubes of light and torn by the odd glitch.
 *
 * Everything is additive, transparent and drawn in one pass (no extra render targets), and the dust
 * and sparks move on the GPU, so a hologram costs a few dozen draw calls and no per-frame uploads.
 */

/** The uniforms every part of one hologram shares, so the projector drives them all at once. */
export interface HoloUniforms {
  [name: string]: THREE.IUniform;
  color: THREE.IUniform<THREE.Color>;
  /** Overall brightness, 0 to 1 (the projector flickers it). */
  opacity: THREE.IUniform<number>;
  time: THREE.IUniform<number>;
  /** World height of the figure's feet and of the top of its head. */
  base: THREE.IUniform<number>;
  top: THREE.IUniform<number>;
  /** How much of the figure is built, from the feet up: 0 = nothing, 1 = all of it. */
  build: THREE.IUniform<number>;
  /** 0 = a clean signal; up to 1 = slices tearing sideways with the colours split apart. */
  glitch: THREE.IUniform<number>;
  /** Points' size scale, from the viewport height. */
  scale: THREE.IUniform<number>;
  /** How bright the projector's beam, dust and floor glow are, 0 to 1. */
  power: THREE.IUniform<number>;
}

export function holoUniforms(color: string): HoloUniforms {
  return {
    color: { value: new THREE.Color(color) },
    opacity: { value: 0 },
    time: { value: 0 },
    base: { value: 0 },
    top: { value: 2 },
    build: { value: 0 },
    glitch: { value: 0 },
    scale: { value: 600 },
    power: { value: 0 },
  };
}

const HASH = `
  float hash1(float n) { return fract(sin(n) * 43758.5453); }
  float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`;

/**
 * Light for hologram figures: bright at the silhouette's rim (fresnel), fainter through the middle,
 * with fine scanlines rolling up (split into red, green and blue when the signal glitches), a bright
 * band sweeping up now and then, thin dark interference lines and a little grain. While it is being
 * built, only the part below the build front is there, ragged in small cubes with a white-hot edge.
 */
export function holoMaterial(u: HoloUniforms, opts: { map?: THREE.Texture; fill?: number; dim?: number } = {}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...u,
      map: { value: opts.map ?? null },
      useMap: { value: opts.map ? 1 : 0 },
      fill: { value: opts.fill ?? 0.14 },
      dim: { value: opts.dim ?? 0.2 },
    },
    vertexShader: `
      uniform float time;
      uniform float glitch;
      varying vec3 vN;
      varying vec3 vView;
      varying vec3 vW;
      varying vec2 vUv;
      varying float vFront;
      varying float vTear;
      ${HASH}
      void main() {
        vUv = uv;
        vFront = normal.z;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        // Glitches tear the figure into thin slices that jump sideways across the screen for a moment.
        float slice = floor(wp.y * 18.0);
        float tick = floor(time * 15.0);
        float torn = step(1.0 - glitch * 0.4, hash1(slice * 12.9898 + tick * 78.233));
        vTear = torn * (hash1(slice * 3.7 + tick * 1.3) * 2.0 - 1.0);
        vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
        wp.xyz += right * vTear * 0.06;
        vW = wp.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        vView = cameraPosition - wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      uniform vec3 color;
      uniform float opacity;
      uniform float time;
      uniform float base;
      uniform float top;
      uniform float build;
      uniform float glitch;
      uniform sampler2D map;
      uniform float useMap;
      uniform float fill;
      uniform float dim;
      varying vec3 vN;
      varying vec3 vView;
      varying vec3 vW;
      varying vec2 vUv;
      varying float vFront;
      varying float vTear;
      ${HASH}
      void main() {
        float h = (vW.y - base) / (top - base);
        // Built from the feet up in small cubes of light, so the front is ragged.
        vec3 cell = floor(vW * 32.0);
        float rag = hash2(cell.xz * 0.37 + cell.y * 1.13);
        float d = build * 1.25 - 0.12 - h - rag * 0.12;
        if (d < 0.0) discard;
        float edge = (1.0 - smoothstep(0.0, 0.05, d)) * (1.0 - smoothstep(0.96, 1.0, build));
        float rim = 1.0 - min(1.0, abs(dot(normalize(vN), normalize(vView))));
        rim *= rim;
        // Fine scanlines rolling up, smoothed out where they get too fine to draw.
        float sy = vW.y * 1400.0 - time * 9.0;
        float split = 0.35 + glitch * 1.6;
        vec3 scan = 0.75 + 0.25 * vec3(sin(sy + split), sin(sy), sin(sy - split));
        scan = mix(vec3(0.8), scan, clamp(2.0 - fwidth(sy) * 0.6, 0.0, 1.0));
        // A brighter band sweeps up every few seconds; thin dark interference lines flick past.
        float bp = fract(time * 0.19) * 1.6 - 0.3;
        float bd = (h - bp) * 12.0;
        float band = exp(-bd * bd);
        float drop = step(0.94, hash2(vec2(floor(vW.y * 40.0), floor(time * 9.0)))) * 0.55;
        float grain = hash2(gl_FragCoord.xy * 0.71 + fract(time * 7.0) * 91.0);
        float tex = 1.0;
        float front = 0.0;
        if (useMap > 0.5) {
          front = smoothstep(-0.1, 0.4, vFront);
          tex = mix(0.3, texture2D(map, vUv).r, front);
        }
        float feet = smoothstep(-0.01, 0.03, h);
        float a = (fill * tex + rim * 0.7 + band * 0.25) * (1.0 - drop) * (0.9 + grain * 0.2);
        a = (a * feet + edge * 1.2) * opacity;
        vec3 c = color * (0.75 + rim * 0.8 + band * 0.5) * scan + edge * 0.9;
        // Torn slices flash magenta on one side and cyan on the other.
        c *= 1.0 + vec3(vTear, -abs(vTear) * 0.4, -vTear) * 0.9;
        // Light is added on top of the scene, but the figure also dims what is behind it a little
        // (the face most), so it reads in bright places and the dark lines of the face show.
        gl_FragColor = vec4(c * a, dim * feet * opacity);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
  });
}

/* ---------------- faces ---------------- */

/** The part of a portrait (in its 80 by 80 units) that is projected onto a hologram's face. */
const FACE = { x0: 22, x1: 58, y0: 14.5, y1: 58.5 };
const faceCache = new Map<HoloSpeaker, THREE.CanvasTexture>();

/**
 * A speaker's face for their hologram: their dialogue portrait (bare, without the comms screen)
 * redrawn in shades of grey. The skin is lifted to the same brightness for everyone, so the dark
 * lines of eyes, brows, lips, beards and glasses stand out on every face. Until the portrait has
 * loaded, a plain oval of light stands in.
 */
function holoFaceTexture(who: HoloSpeaker): THREE.Texture {
  const hit = faceCache.get(who);
  if (hit) return hit;
  const W = 256;
  const H = Math.round((W * (FACE.y1 - FACE.y0)) / (FACE.x1 - FACE.x0));
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
  g.fillStyle = '#2a2a2a';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#c8c8c8';
  g.beginPath();
  g.ellipse(W / 2, H * 0.55, W * 0.38, H * 0.4, 0, 0, Math.PI * 2);
  g.fill();
  const tex = new THREE.CanvasTexture(c);
  faceCache.set(who, tex);
  const { svg, skin } = holoFaceArt(who);
  const img = new Image();
  img.onload = () => {
    const unit = W / (FACE.x1 - FACE.x0);
    g.clearRect(0, 0, W, H);
    g.drawImage(img, -FACE.x0 * unit, -FACE.y0 * unit, 80 * unit, 80 * unit);
    const px = g.getImageData(0, 0, W, H);
    const d = px.data;
    const rgb = parseInt(skin.slice(1), 16);
    const skinL = (0.3 * ((rgb >> 16) & 255) + 0.59 * ((rgb >> 8) & 255) + 0.11 * (rgb & 255)) / 255;
    // A curve that puts every skin at the same brightness, keeps lighter things (beards, white hair,
    // the whites of the eyes) brighter still, and drops the lines and shadows right down to dark.
    const lum = new Float32Array(W * H);
    for (let i = 0; i < lum.length; i++) {
      const a = d[i * 4 + 3] / 255;
      const t = (0.3 * d[i * 4] + 0.59 * d[i * 4 + 1] + 0.11 * d[i * 4 + 2]) / 255 / Math.max(0.08, skinL);
      const v = t <= 1 ? 0.6 * Math.pow(Math.max(0, (t - 0.35) / 0.65), 0.8) : Math.min(1, 0.6 + (t - 1) * 0.5);
      lum[i] = a * v;
    }
    // Thicken the dark lines a little (the darkest of each pixel's neighbours, half and half), so the
    // eyes, brows and mouth still read when the face is small on screen.
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let m = 1;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const yy = Math.min(H - 1, Math.max(0, y + dy));
            const xx = Math.min(W - 1, Math.max(0, x + dx));
            m = Math.min(m, lum[yy * W + xx]);
          }
        }
        const i = y * W + x;
        const v = Math.round(255 * (0.06 + 0.94 * (lum[i] + m) * 0.5));
        d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v;
        d[i * 4 + 3] = 255;
      }
    }
    g.putImageData(px, 0, 0);
    tex.needsUpdate = true;
  };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return tex;
}

/**
 * A head shaped like the portraits': taller than wide, narrowing to the jaw and chin, the face a
 * little flatter than the back. The portrait is projected onto it straight from the front, with the
 * eyes level with the middle of the head.
 */
function headGeometry(r: number) {
  const g = new THREE.SphereGeometry(r, 32, 24);
  const p = g.attributes.position as THREE.BufferAttribute;
  const n = g.attributes.normal as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const ny = p.getY(i) / r;
    const jaw = ny < 0 ? 1 - 0.26 * ny * ny : 1 - 0.05 * ny * ny;
    const sx = 0.9 * jaw;
    const sy = 1.14;
    const sz = (p.getZ(i) > 0 ? 0.88 : 1.02) * (ny < 0 ? 1 - 0.15 * ny * ny : 1);
    const x = p.getX(i) * sx;
    const y = p.getY(i) * sy;
    p.setXYZ(i, x, y, p.getZ(i) * sz);
    const nv = new THREE.Vector3(n.getX(i) / sx, n.getY(i) / sy, n.getZ(i) / sz).normalize();
    n.setXYZ(i, nv.x, nv.y, nv.z);
    const px = 40 + (x / (0.9 * r)) * 15;
    const py = 37.2 - (y / (sy * r)) * 21.6;
    uv.setXY(i, (px - FACE.x0) / (FACE.x1 - FACE.x0), 1 - (py - FACE.y0) / (FACE.y1 - FACE.y0));
  }
  return g;
}

/* ---------------- the figure ---------------- */

/**
 * A lathe profile, as [radius, height] pairs from the bottom up, cut into short steps so a glitch
 * can tear it into slices.
 */
function lathe(pts: [number, number][], seg = 24, step = 0.035) {
  const out: THREE.Vector2[] = [];
  pts.forEach(([r, y], i) => {
    if (i > 0) {
      const [r0, y0] = pts[i - 1];
      const n = Math.max(1, Math.ceil(Math.hypot(r - r0, y - y0) / step));
      for (let k = 1; k < n; k++) out.push(new THREE.Vector2(r0 + ((r - r0) * k) / n, y0 + ((y - y0) * k) / n));
    }
    out.push(new THREE.Vector2(r, y));
  });
  return new THREE.LatheGeometry(out, seg);
}

/** A limb segment (a tapered tube) hanging down from its joint. */
function limb(r0: number, r1: number, len: number) {
  const g = new THREE.CylinderGeometry(r0, r1, len, 12, Math.max(2, Math.round(len / 0.035)), true);
  g.translate(0, -len / 2, 0);
  return g;
}

/** How an arm is held: forward swing and outward lift at the shoulder, forward and inward bend at the elbow. */
interface ArmPose {
  x: number;
  z: number;
  ex: number;
  ez: number;
}

/** An arm at rest and while its speaker talks, and how much it waves about with the words. */
interface ArmPlan {
  rest: ArmPose;
  talk: ArmPose;
  wave: number;
}

const RELAXED: ArmPose = { x: 0.04, z: 0.1, ex: -0.22, ez: 0 };
/** Hand on the hip, elbow out. */
const ON_HIP: ArmPose = { x: 0.12, z: 0.62, ex: 0, ez: 1.9 };
const GESTURE: ArmPose = { x: -0.55, z: 0.28, ex: -1.15, ez: 0.1 };

/** Each speaker's way of standing and talking. */
const ARMS: Record<HoloSpeaker, { left: ArmPlan; right: ArmPlan }> = {
  captain: { left: { rest: RELAXED, talk: { x: -0.1, z: 0.14, ex: -0.4, ez: 0 }, wave: 0.3 }, right: { rest: { ...RELAXED, ex: -0.4 }, talk: GESTURE, wave: 1 } },
  rosa: { left: { rest: ON_HIP, talk: ON_HIP, wave: 0 }, right: { rest: RELAXED, talk: GESTURE, wave: 1 } },
  // Dr. Hypatia holds her tablet up in her left hand and points things out with her right.
  hypatia: { left: { rest: { x: -0.2, z: 0.05, ex: -1.45, ez: 0.15 }, talk: { x: -0.25, z: 0.05, ex: -1.5, ez: 0.15 }, wave: 0.15 }, right: { rest: RELAXED, talk: { x: -0.65, z: 0.15, ex: -1.0, ez: 0.35 }, wave: 0.8 } },
  // General Brennus keeps one hand behind his back and jabs the air with the other.
  brennus: { left: { rest: { x: 0.35, z: 0.18, ex: -0.4, ez: 1.25 }, talk: { x: 0.35, z: 0.18, ex: -0.4, ez: 1.25 }, wave: 0 }, right: { rest: { ...RELAXED, ex: -0.3 }, talk: { x: -0.75, z: 0.2, ex: -1.0, ez: 0 }, wave: 1.2 } },
  atalanta: { left: { rest: ON_HIP, talk: ON_HIP, wave: 0 }, right: { rest: { ...RELAXED, ex: -0.3 }, talk: { x: -0.6, z: 0.4, ex: -1.3, ez: 0 }, wave: 1.3 } },
  // Aeëtes spreads both arms wide, like a showman.
  aeetes: { left: { rest: { x: -0.15, z: 0.35, ex: -0.5, ez: 0 }, talk: { x: -0.35, z: 0.7, ex: -0.7, ez: 0 }, wave: 0.7 }, right: { rest: { x: -0.15, z: 0.35, ex: -0.5, ez: 0 }, talk: { x: -0.35, z: 0.75, ex: -0.7, ez: 0 }, wave: 0.8 } },
};

export interface HoloFigure {
  group: THREE.Group;
  mats: THREE.ShaderMaterial[];
  /** The height of the top of the figure above its feet. */
  height: number;
  /** The height of its eyes above its feet. */
  eyes: number;
  /** Breathing and small shifts of weight, and gestures while `talk` (0 to 1) is up. */
  pose(t: number, talk: number): void;
}

/**
 * A full figure made of light for hologram messages, with real proportions: legs that bend at the
 * knee, a tapered torso, arms with elbows and hands, a neck and a head wearing the speaker's own face.
 * Each speaker has their own clothes and silhouette: the Captain's peaked cap and epaulettes, Aunt
 * Rosa's bun and security vest, Dr. Hypatia's lab coat, bun and tablet, General Brennus's tall cap,
 * medals and greatcoat, Atalanta's headband, braid and bow, and Aeëtes's slicked-back hair, high
 * collar, long coat and rings.
 */
export function makeHoloFigure(who: HoloSpeaker, u: HoloUniforms): HoloFigure {
  const g = new THREE.Group();
  const body = holoMaterial(u);
  // Small bright details (badges, buttons, rings, the headband) glow right through.
  const bright = holoMaterial(u, { fill: 0.6 });
  // The head glows through its middle too, so the face reads clearly.
  const faceM = holoMaterial(u, { map: holoFaceTexture(who), fill: 0.95, dim: 0.85 });
  const put = (parent: THREE.Object3D, geo: THREE.BufferGeometry, x: number, y: number, z: number, m: THREE.Material = body) => {
    const me = new THREE.Mesh(geo, m);
    me.position.set(x, y, z);
    parent.add(me);
    return me;
  };
  const ball = (r: number) => new THREE.SphereGeometry(r, 12, 9);

  // Legs, knees and shoes.
  for (const sx of [-1, 1]) {
    put(g, limb(0.082, 0.062, 0.44), sx * 0.1, 0.92, 0);
    put(g, ball(0.06), sx * 0.1, 0.48, 0.005);
    put(g, limb(0.06, 0.045, 0.42), sx * 0.1, 0.48, 0);
    const shoe = put(g, new THREE.CapsuleGeometry(0.052, 0.13, 4, 10).rotateX(Math.PI / 2), sx * 0.1, 0.05, 0.045);
    shoe.scale.set(1.05, 0.8, 1);
  }

  // Everything above the hips sways and breathes together.
  const spine = new THREE.Group();
  spine.position.y = 0.95;
  g.add(spine);
  const chest = new THREE.Group();
  spine.add(chest);
  const torso = put(
    chest,
    lathe([
      [0, -0.13],
      [0.16, -0.11],
      [0.18, -0.01],
      [0.155, 0.19],
      [0.19, 0.37],
      [0.225, 0.49],
      [0.205, 0.56],
      [0.13, 0.6],
      [0.06, 0.625],
      [0, 0.63],
    ]),
    0,
    0,
    0,
  );
  torso.scale.z = 0.64;
  put(spine, limb(0.048, 0.056, 0.1), 0, 0.67, 0);

  // Arms: shoulder, elbow and hand groups, so they can gesture.
  const arms: { shoulder: THREE.Group; elbow: THREE.Group; side: number; plan: ArmPlan; phase: number }[] = [];
  const hands: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.235, 0.505, 0);
    spine.add(shoulder);
    put(shoulder, ball(0.062), 0, 0, 0);
    put(shoulder, limb(0.058, 0.046, 0.29), 0, 0, 0);
    const elbow = new THREE.Group();
    elbow.position.y = -0.29;
    shoulder.add(elbow);
    put(elbow, ball(0.046), 0, 0, 0);
    put(elbow, limb(0.045, 0.034, 0.25), 0, 0, 0);
    const hand = new THREE.Group();
    hand.position.y = -0.27;
    elbow.add(hand);
    const palm = put(hand, ball(0.042), 0, -0.02, 0);
    palm.scale.set(0.75, 1.15, 0.5);
    const thumb = put(hand, new THREE.CapsuleGeometry(0.013, 0.035, 3, 6), side * -0.025, -0.01, 0.022);
    thumb.rotation.z = side * 0.5;
    hands.push(hand);
    arms.push({ shoulder, elbow, side, plan: side < 0 ? ARMS[who].left : ARMS[who].right, phase: side < 0 ? 2.1 : 0 });
  }
  const [handL] = hands;

  // The head, wearing the speaker's face.
  const head = new THREE.Group();
  head.position.y = 0.71;
  spine.add(head);
  const R = 0.112;
  const HEAD_Y = 0.1;
  put(head, headGeometry(R), 0, HEAD_Y, 0.01, faceM);
  const hy = HEAD_Y;
  /** A cap of hair over the crown and the back of the head, the face left clear. */
  const hairCap = (len: number, tilt: number, scale: [number, number, number]) => {
    const hair = put(head, new THREE.SphereGeometry(R * 1.04, 24, 14, 0, Math.PI * 2, 0, len), 0, hy + 0.004, -0.004);
    hair.rotation.x = tilt;
    hair.scale.set(...scale);
    return hair;
  };
  /** A peaked cap, low over the brow; Brennus's has a taller crown. */
  const peakedCap = (crown: number) => {
    // The band hugs the head at the brow line drawn on the face; the crown flares out over the top.
    put(head, new THREE.CylinderGeometry(0.098, 0.092, 0.04, 24, 2), 0, hy + 0.072, -0.004);
    const top = put(head, new THREE.CylinderGeometry(0.124 + crown * 0.15, 0.099, 0.05 + crown, 24, 3), 0, hy + 0.115 + crown / 2, -0.012);
    top.scale.z = 1.08;
    const lid = put(head, new THREE.CylinderGeometry(0.124 + crown * 0.15, 0.124 + crown * 0.15, 0.01, 24), 0, hy + 0.14 + crown, -0.012);
    lid.scale.z = 1.08;
    const peak = put(head, new THREE.CylinderGeometry(0.1, 0.1, 0.008, 20, 1, false, -Math.PI / 2, Math.PI), 0, hy + 0.054, 0.002);
    peak.rotation.x = 0.3;
    peak.scale.z = 1.35;
    const badge = put(head, new THREE.OctahedronGeometry(0.02), 0, hy + 0.11 + crown * 0.5, 0.11 + crown * 0.2, bright);
    badge.scale.z = 0.4;
  };

  if (who === 'captain' || who === 'brennus') {
    peakedCap(who === 'brennus' ? 0.04 : 0);
    // Epaulettes with a fringe, and a line of buttons down the jacket.
    for (const sx of [-1, 1]) {
      put(spine, new THREE.BoxGeometry(0.13, 0.02, 0.11), sx * 0.2, 0.545, 0, bright);
      for (let i = 0; i < 4; i++) put(spine, new THREE.CylinderGeometry(0.006, 0.006, 0.05, 4), sx * (0.15 + i * 0.03), 0.515, 0.045);
    }
    for (let i = 0; i < 4; i++) put(chest, ball(0.012), 0.035, 0.07 + i * 0.1, 0.12, bright);
  }
  if (who === 'captain') {
    // The jacket hem flares a little over the hips.
    const hem = put(g, lathe([[0.19, 0], [0.17, 0.14]]), 0, 0.8, 0);
    hem.scale.z = 0.7;
  } else if (who === 'brennus') {
    // A greatcoat to the knees with a belt, and a row of medals.
    const coat = put(g, lathe([[0.27, 0], [0.22, 0.3], [0.19, 0.48], [0.185, 0.56]]), 0, 0.42, 0);
    coat.scale.z = 0.72;
    const belt = put(spine, new THREE.TorusGeometry(0.168, 0.016, 6, 24), 0, 0.02, 0, bright);
    belt.rotation.x = Math.PI / 2;
    belt.scale.y = 0.66;
    for (let i = 0; i < 3; i++) put(chest, new THREE.BoxGeometry(0.03, 0.04, 0.01), -0.06 - i * 0.04, 0.38, 0.135, bright);
  } else if (who === 'rosa') {
    hairCap(1.5, -0.35, [0.92, 1.15, 1.0]);
    put(head, ball(0.055), 0, hy + 0.1, -0.11);
    // The security vest over the uniform, with its badge.
    const vest = put(chest, lathe([[0.185, 0], [0.205, 0.2], [0.22, 0.36], [0.2, 0.44]]), 0, 0.05, 0);
    vest.scale.z = 0.74;
    const badge = put(chest, new THREE.CylinderGeometry(0.03, 0.03, 0.01, 5).rotateX(Math.PI / 2), 0.09, 0.36, 0.16, bright);
    badge.rotation.z = Math.PI;
  } else if (who === 'hypatia') {
    // Hair up in a high bun with a pin, an open lab coat to the knees and her tablet.
    hairCap(1.45, -0.3, [0.92, 1.15, 1.0]);
    put(head, ball(0.06), 0, hy + 0.135, -0.07);
    const pin = put(head, new THREE.CylinderGeometry(0.005, 0.005, 0.14, 4), 0.02, hy + 0.15, -0.07, bright);
    pin.rotation.z = -0.9;
    const coat = put(g, lathe([[0.26, 0], [0.22, 0.25], [0.19, 0.5], [0.2, 0.75], [0.235, 0.98], [0.21, 1.04]]), 0, 0.46, 0);
    coat.scale.z = 0.7;
    for (const sx of [-1, 1]) {
      const lapel = put(chest, new THREE.BoxGeometry(0.05, 0.22, 0.01), sx * 0.07, 0.42, 0.135);
      lapel.rotation.z = sx * 0.3;
    }
    const tablet = put(handL, new THREE.BoxGeometry(0.15, 0.2, 0.012), 0.03, -0.05, 0.05, bright);
    tablet.rotation.set(-0.3, -0.5, 0.15);
  } else if (who === 'atalanta') {
    // A headband, a long braid over her shoulder, and the bow across her back.
    hairCap(1.55, -0.2, [0.93, 1.15, 1.02]);
    const band = put(head, new THREE.TorusGeometry(R * 1.0, 0.012, 6, 28), 0, hy + 0.06, 0.004, bright);
    band.rotation.x = Math.PI / 2 - 0.25;
    band.scale.set(0.95, 1.04, 1);
    // The braid: from behind her left ear, over her shoulder and down her front.
    const path = [new THREE.Vector3(-0.07, 0.75, -0.06), new THREE.Vector3(-0.15, 0.6, 0.06), new THREE.Vector3(-0.15, 0.3, 0.13)];
    for (let i = 0; i < 10; i++) {
      const k = i / 9;
      const at = k < 0.35 ? path[0].clone().lerp(path[1], k / 0.35) : path[1].clone().lerp(path[2], (k - 0.35) / 0.65);
      const bead = put(spine, ball(0.028 - k * 0.01), at.x, at.y, at.z);
      bead.scale.set(1, 1.35, 1);
    }
    put(spine, new THREE.SphereGeometry(0.012, 6, 4), -0.15, 0.28, 0.13, bright);
    const bow = put(spine, new THREE.TorusGeometry(0.36, 0.008, 4, 24, Math.PI * 0.7), 0.02, 0.3, -0.16);
    bow.rotation.set(0, 0, Math.PI * 0.5 + 0.35);
    const strap = put(chest, new THREE.TorusGeometry(0.2, 0.01, 4, 30), 0, 0.3, 0, bright);
    strap.rotation.set(Math.PI / 2, 0.7, 0);
    strap.scale.set(1, 0.68, 1);
    g.scale.setScalar(0.9);
  } else if (who === 'aeetes') {
    // Slicked-back hair, a high stiff collar, a long coat and a ring on every hand.
    const hair = hairCap(1.35, -0.55, [0.93, 1.08, 1.1]);
    hair.position.z -= 0.012;
    const collar = put(spine, lathe([[0.1, 0], [0.13, 0.08], [0.165, 0.14]], 20), 0, 0.6, -0.015, bright);
    collar.scale.z = 0.85;
    const coat = put(g, lathe([[0.3, 0], [0.24, 0.35], [0.2, 0.6], [0.225, 1.02], [0.2, 1.08]]), 0, 0.38, 0);
    coat.scale.z = 0.72;
    for (const hand of hands) {
      const ring = put(hand, new THREE.TorusGeometry(0.018, 0.007, 5, 12), 0, -0.035, 0.01, bright);
      ring.rotation.x = Math.PI / 2;
    }
  }

  return {
    group: g,
    mats: [body, bright, faceM],
    height: (who === 'brennus' ? 1.98 : 1.92) * g.scale.y,
    eyes: (spine.position.y + head.position.y + HEAD_Y) * g.scale.y,
    pose(t, talk) {
      const breathe = Math.sin(t * 1.7);
      chest.scale.set(1 + breathe * 0.012, 1 + breathe * 0.006, 1 + breathe * 0.02);
      spine.rotation.set(Math.sin(t * 0.45) * 0.012 + talk * Math.sin(t * 2.3) * 0.02, Math.sin(t * 0.31) * 0.05, Math.sin(t * 0.6) * 0.015);
      head.rotation.set(
        -0.03 + talk * (Math.sin(t * 4.7) * 0.05 + Math.sin(t * 7.3) * 0.025),
        Math.sin(t * 0.37) * 0.14 + talk * Math.sin(t * 1.9) * 0.08,
        Math.sin(t * 0.53) * 0.04,
      );
      for (const a of arms) {
        const { rest, talk: on, wave } = a.plan;
        const w = talk * wave;
        const p = a.phase;
        const mix = (r: number, o: number) => r + (o - r) * talk;
        a.shoulder.rotation.set(
          mix(rest.x, on.x) + w * (0.2 * Math.sin(t * 2.2 + p) + 0.1 * Math.sin(t * 3.7 + p)) + Math.sin(t * 0.8 + p) * 0.015,
          0,
          a.side * (mix(rest.z, on.z) + w * 0.08 * Math.sin(t * 1.6 + p)),
        );
        a.elbow.rotation.set(mix(rest.ex, on.ex) + w * 0.28 * Math.sin(t * 2.6 + p + 1), 0, -a.side * mix(rest.ez, on.ez));
      }
    },
  };
}

/* ---------------- the projector ---------------- */

/**
 * The cone of light from the projector's lens up to the figure: thickest where you look through its
 * middle, brightest at the lens, with slow rays turning in it and pulses travelling up.
 */
function beamMaterial(u: HoloUniforms, strength: number, rays: number) {
  return new THREE.ShaderMaterial({
    uniforms: { color: u.color, time: u.time, power: u.power, strength: { value: strength }, rays: { value: rays } },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vView;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vView = cameraPosition - wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      uniform vec3 color;
      uniform float time;
      uniform float power;
      uniform float strength;
      uniform float rays;
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vView;
      void main() {
        float y = vUv.y;
        float through = min(1.0, abs(dot(normalize(vN), normalize(vView))));
        through *= sqrt(through);
        float a1 = vUv.x * 6.2832;
        float ray = sin(a1 * rays + time * 0.7 + sin(y * 3.0 - time) * 0.6) * sin(a1 * (rays * 0.6 + 2.0) - time * 0.45);
        ray = smoothstep(-0.2, 1.0, ray);
        float fall = pow(max(1.0 - y, 0.0001), 1.4) * (1.0 - smoothstep(0.8, 1.0, y)) * smoothstep(0.0, 0.04, y);
        float pulse = 0.8 + 0.2 * sin(y * 26.0 - time * 5.0);
        float a = (0.18 + 0.82 * ray) * through * fall * pulse * power * strength;
        gl_FragColor = vec4(color * (1.0 + (1.0 - y) * 0.8), a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

/** A disc of light on the projector or the floor around it, with caustics swirling in it and rings running out. */
function causticMaterial(u: HoloUniforms, inner: number, strength: number) {
  return new THREE.ShaderMaterial({
    uniforms: { color: u.color, time: u.time, power: u.power, inner: { value: inner }, strength: { value: strength } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 color;
      uniform float time;
      uniform float power;
      uniform float inner;
      uniform float strength;
      varying vec2 vUv;
      void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        float r = length(p);
        float an = atan(p.y, p.x + 0.00001);
        float c1 = sin(an * 7.0 + time * 0.8 + sin(r * 9.0 - time * 1.3) * 1.6);
        float c2 = sin(an * 5.0 - time * 0.6 + r * 7.0 + sin(an * 3.0 + time) * 0.8);
        float caustic = pow(max(abs(c1 * c2), 0.0001), 0.6);
        caustic = smoothstep(0.35, 0.95, caustic);
        float rings = smoothstep(0.6, 1.0, sin(r * 34.0 - time * 3.0));
        float glow = pow(max(1.0 - r, 0.0001), 1.6);
        float a = glow * (0.4 + caustic * 0.9 + rings * 0.25) * smoothstep(inner, inner + 0.08, r);
        gl_FragColor = vec4(color * (1.0 + glow), a * power * strength);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

const POINT_FRAG = `
  uniform vec3 color;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = 1.0 - d * 2.0;
    gl_FragColor = vec4(color * (0.8 + a), a * a * vAlpha);
  }`;

/** `n` points whose positions are worked out in the vertex shader from a random seed each. */
function seededPoints(n: number, uniforms: Record<string, THREE.IUniform>, vertexShader: string) {
  const seeds = new Float32Array(n * 3);
  for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(seeds, 3));
  const pts = new THREE.Points(
    geo,
    new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader: POINT_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  pts.frustumCulled = false;
  return pts;
}

export interface HoloProjector {
  group: THREE.Group;
  /** Turns the rings, pulses the panels and lens, and keeps the sparks at the figure's build front. */
  update(t: number, dt: number, front: number): void;
}

/** The lens's height above the floor, and the height the cone of light reaches. */
const LENS_Y = 0.4;
const BEAM_TOP = 2.45;

/**
 * The projector: a stepped metal pedestal with light panels around its side and a glowing lip, a
 * ring of notched arcs turning on its top, three emitter prongs turning the other way around a glowing
 * lens, a cone of light from the lens up to the figure with dust drifting in it, caustics on its top
 * plate and a soft glow on the floor. `front` (for `update`) is the height of the figure's build
 * front above the floor, where sparks fly while it is built or taken apart.
 */
export function makeHoloProjector(u: HoloUniforms): HoloProjector {
  const g = new THREE.Group();
  const color = u.color.value.getStyle();
  const metal = mat('#2e3446', { metal: 0.65, rough: 0.38 });
  const dark = mat('#1a1e2a', { metal: 0.5, rough: 0.5 });
  const pedestal = mesh(
    new THREE.LatheGeometry(
      [
        [0, 0],
        [0.88, 0],
        [0.88, 0.07],
        [0.82, 0.11],
        [0.74, 0.25],
        [0.66, 0.28],
        [0.62, 0.3],
        [0, 0.3],
      ].map(([r, y]) => new THREE.Vector2(r, y)),
      40,
    ),
    metal,
  );
  g.add(pedestal);
  // A glowing lip around the foot, and light panels around the sloped side that chase each other.
  const glowMat = ownMat(color, { emissive: color, ei: 1.6 });
  const lip = mesh(new THREE.TorusGeometry(0.85, 0.018, 6, 48), glowMat, 0, 0.09, 0, false);
  lip.rotation.x = Math.PI / 2;
  g.add(lip);
  const panels = [ownMat(color, { emissive: color, ei: 1 }), ownMat(color, { emissive: color, ei: 1 })];
  const slope = Math.atan2(0.14, 0.08);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const p = mesh(new THREE.BoxGeometry(0.14, 0.05, 0.012), panels[i % 2], Math.sin(a) * 0.79, 0.18, Math.cos(a) * 0.79, false);
    p.rotation.set(0, a, 0);
    p.rotateX(-(Math.PI / 2 - slope));
    g.add(p);
  }
  // The top plate: a dark inset, then a ring of notched arcs turning slowly.
  const inset = mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.02, 40), dark, 0, 0.3, 0, false);
  g.add(inset);
  const ring = new THREE.Group();
  ring.position.y = 0.32;
  for (let i = 0; i < 3; i++) {
    const arc = mesh(new THREE.TorusGeometry(0.5, 0.022, 6, 24, Math.PI * 0.52), glowMat, 0, 0, 0, false);
    arc.rotation.set(Math.PI / 2, 0, (i / 3) * Math.PI * 2);
    ring.add(arc);
  }
  g.add(ring);
  // The emitter: a housing with a glowing lens, and three prongs around it turning the other way.
  g.add(mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.08, 24), metal, 0, 0.35, 0, false));
  const lensMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const lens = mesh(new THREE.SphereGeometry(0.11, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), lensMat, 0, 0.385, 0, false);
  lens.scale.y = 0.45;
  g.add(lens);
  const lensGlow = glowSprite(color, 0.9, 0.8);
  lensGlow.position.y = LENS_Y;
  g.add(lensGlow);
  const prongs = new THREE.Group();
  prongs.position.y = 0.33;
  for (let i = 0; i < 3; i++) {
    const arm = new THREE.Group();
    arm.rotation.y = (i / 3) * Math.PI * 2;
    const fin = mesh(new THREE.BoxGeometry(0.035, 0.16, 0.07), metal, 0, 0.07, 0.29, false);
    fin.rotation.x = -0.45;
    arm.add(fin);
    arm.add(mesh(new THREE.SphereGeometry(0.022, 8, 6), glowMat, 0, 0.15, 0.25, false));
    prongs.add(arm);
  }
  g.add(prongs);

  // The cone of light, with a brighter, narrower core.
  const beamH = BEAM_TOP - LENS_Y;
  const beam = mesh(new THREE.CylinderGeometry(0.62, 0.07, beamH, 40, 1, true), beamMaterial(u, 0.55, 9), 0, LENS_Y + beamH / 2, 0, false);
  const core = mesh(new THREE.CylinderGeometry(0.3, 0.04, beamH * 0.75, 24, 1, true), beamMaterial(u, 0.6, 5), 0, LENS_Y + beamH * 0.375, 0, false);
  beam.renderOrder = core.renderOrder = 2;
  g.add(beam, core);
  // Caustics on the top plate, and a soft glow on the floor around the pedestal.
  const plate = mesh(new THREE.CircleGeometry(0.6, 48).rotateX(-Math.PI / 2), causticMaterial(u, 0.3, 0.7), 0, 0.312, 0, false);
  const floor = mesh(new THREE.CircleGeometry(2, 48).rotateX(-Math.PI / 2), causticMaterial(u, 0.43, 0.35), 0, 0.012, 0, false);
  g.add(plate, floor);

  // Dust motes drifting up through the cone, twinkling.
  const dust = seededPoints(
    70,
    { color: u.color, time: u.time, power: u.power, scale: u.scale },
    `
    uniform float time;
    uniform float power;
    uniform float scale;
    varying float vAlpha;
    void main() {
      vec3 s = position;
      float y = fract(s.z + time * (0.04 + s.x * 0.05));
      float an = s.y * 6.2832 + time * (0.15 + s.z * 0.2) + sin(time * 0.7 + s.z * 9.0) * 0.4;
      float r = mix(0.07, 0.6, y) * sqrt(s.x);
      vec3 p = vec3(cos(an) * r, ${LENS_Y.toFixed(2)} + y * ${(beamH * 0.92).toFixed(2)}, sin(an) * r);
      vAlpha = power * smoothstep(0.0, 0.08, y) * (1.0 - smoothstep(0.6, 1.0, y));
      float tw = 0.5 + 0.5 * sin(time * (2.0 + s.y * 3.0) + s.z * 40.0);
      vAlpha *= 0.35 + 0.65 * tw * tw * tw;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = min(10.0, (0.022 + s.y * 0.02) * scale / max(0.1, -mv.z));
      gl_Position = projectionMatrix * mv;
    }`,
  );
  g.add(dust);

  // Sparks at the build front while the figure is built up or taken apart.
  const sparkU = { color: u.color, time: u.time, scale: u.scale, front: { value: 0 }, lit: { value: 0 } };
  const sparks = seededPoints(
    110,
    sparkU,
    `
    uniform float time;
    uniform float scale;
    uniform float front;
    uniform float lit;
    varying float vAlpha;
    void main() {
      vec3 s = position;
      float life = fract(s.z + time * (0.9 + s.x * 0.8));
      float an = s.x * 6.2832 + life * (s.y - 0.5) * 2.0;
      float r = 0.06 + s.y * 0.26 + life * 0.06;
      vec3 p = vec3(cos(an) * r, front + (s.y - 0.4) * 0.12 + life * 0.22, sin(an) * r * 0.75);
      vAlpha = lit * (1.0 - life) * (0.5 + 0.5 * sin(time * 30.0 + s.z * 50.0));
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = min(12.0, (0.02 + s.x * 0.025) * scale / max(0.1, -mv.z));
      gl_Position = projectionMatrix * mv;
    }`,
  );
  g.add(sparks);

  return {
    group: g,
    update(t, dt, front) {
      const power = u.power.value;
      ring.rotation.y += dt * (0.4 + power * 1.2);
      prongs.rotation.y -= dt * (0.3 + power * 1.8);
      glowMat.emissiveIntensity = 0.8 + power * 1.4;
      const chase = Math.sin(t * 4);
      panels[0].emissiveIntensity = 0.4 + power * (1.1 + chase * 0.7);
      panels[1].emissiveIntensity = 0.4 + power * (1.1 - chase * 0.7);
      lensMat.opacity = 0.5 + power * 0.5;
      lensGlow.material.opacity = 0.25 + power * 0.75;
      lensGlow.scale.setScalar(0.6 + power * 0.5 + Math.sin(t * 9) * 0.03);
      const b = u.build.value;
      sparkU.front.value = front;
      sparkU.lit.value = b > 0.002 && b < 0.995 ? 1 : 0;
    },
  };
}
