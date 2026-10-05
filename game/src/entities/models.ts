import * as THREE from 'three';

import { glowTexture, shadowTexture } from '../world/textures';

const matCache = new Map<string, THREE.Material>();

export function mat(color: string, opts: { emissive?: string; ei?: number; rough?: number; metal?: number; opacity?: number } = {}): THREE.MeshStandardMaterial {
  const key = `${color}|${opts.emissive ?? ''}|${opts.ei ?? 0}|${opts.rough ?? 0.55}|${opts.metal ?? 0.1}|${opts.opacity ?? 1}`;
  let m = matCache.get(key) as THREE.MeshStandardMaterial | undefined;
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      emissive: opts.emissive ?? '#000000',
      emissiveIntensity: opts.ei ?? (opts.emissive ? 1 : 0),
      roughness: opts.rough ?? 0.55,
      metalness: opts.metal ?? 0.1,
      transparent: (opts.opacity ?? 1) < 1,
      opacity: opts.opacity ?? 1,
    });
    matCache.set(key, m);
  }
  return m;
}

/** Unique (non-shared) material, for parts that flash or change color. */
export function ownMat(color: string, opts: { emissive?: string; ei?: number; rough?: number; metal?: number } = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: opts.emissive ?? '#000000',
    emissiveIntensity: opts.ei ?? (opts.emissive ? 1 : 0),
    roughness: opts.rough ?? 0.55,
    metalness: opts.metal ?? 0.1,
  });
}

const geoCache = new Map<string, THREE.BufferGeometry>();
function geo<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  let g = geoCache.get(key) as T | undefined;
  if (!g) {
    g = make();
    geoCache.set(key, g);
  }
  return g;
}

export const sphere = (r: number, seg = 20) => geo(`s${r}|${seg}`, () => new THREE.SphereGeometry(r, seg, Math.max(8, Math.round(seg * 0.7))));
export const capsule = (r: number, len: number) => geo(`c${r}|${len}`, () => new THREE.CapsuleGeometry(r, len, 6, 14));
export const cyl = (rt: number, rb: number, h: number, seg = 16) => geo(`y${rt}|${rb}|${h}|${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg));
export const boxG = (w: number, h: number, d: number) => geo(`b${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d));
export const cone = (r: number, h: number, seg = 12) => geo(`k${r}|${h}|${seg}`, () => new THREE.ConeGeometry(r, h, seg));
export const torus = (r: number, t: number) => geo(`t${r}|${t}`, () => new THREE.TorusGeometry(r, t, 10, 28));

export function mesh(g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0, shadow = true): THREE.Mesh {
  const me = new THREE.Mesh(g, m);
  me.position.set(x, y, z);
  me.castShadow = shadow;
  return me;
}

export function glowSprite(color: string, size: number, opacity = 0.8): THREE.Sprite {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  s.scale.set(size, size, size);
  return s;
}

export function blobShadow(size: number): THREE.Mesh {
  const m = new THREE.Mesh(
    geo('shadowPlane', () => new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)),
    new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }),
  );
  m.scale.set(size, 1, size);
  m.renderOrder = 1;
  return m;
}

/* ---------------- Jason ---------------- */

export interface JasonModel {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  jets: THREE.Sprite[];
  /** The helmet lamp, which glows brighter in dark rooms. */
  visor: THREE.MeshStandardMaterial;
  suit: THREE.MeshStandardMaterial;
  carry: THREE.Group;
  /** Eye groups, squashed to blink. */
  eyes: THREE.Object3D[];
  /** Glow at the blaster's muzzle while a fireball charges. */
  gunGlow: THREE.Sprite;
}

/**
 * A face with natural proportions: almond eyes under skin-coloured lids, slim brows, a defined nose
 * and a small, calm mouth. `r` is the head radius; the face looks along +Z.
 */
export function makeFace(opts: { r: number; skin: string; iris?: string; brow?: string; smile?: boolean }): { group: THREE.Group; eyes: THREE.Object3D[] } {
  const { r, skin } = opts;
  const g = new THREE.Group();
  const skinM = mat(skin, { rough: 0.62 });
  const skinDark = mat(new THREE.Color(skin).multiplyScalar(0.88).getStyle(), { rough: 0.6 });
  const head = mesh(sphere(r, 28), skinM, 0, 0, 0);
  // A touch narrower at the jaw than a ball.
  head.scale.set(0.94, 1.04, 1);
  g.add(head);
  const white = mat('#f1ede6', { rough: 0.3 });
  const iris = mat(opts.iris ?? '#5a3a22', { rough: 0.3 });
  const pupil = mat('#0c0a10', { rough: 0.2 });
  const shine = mat('#ffffff', { emissive: '#ffffff', ei: 0.6 });
  const brow = mat(opts.brow ?? '#3a2416', { rough: 0.7 });
  const eyes: THREE.Object3D[] = [];
  const surf = (x: number, y: number) => Math.sqrt(Math.max(0, r * r - x * x - y * y));
  const lidGeo = new THREE.SphereGeometry(r * 0.15, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  for (const sx of [-1, 1]) {
    const ex = sx * r * 0.33;
    const ey = r * 0.04;
    const e = new THREE.Group();
    e.position.set(ex, ey, surf(ex, ey) - r * 0.06);
    const w = mesh(sphere(r * 0.14, 16), white, 0, 0, 0, false);
    w.scale.set(1.2, 0.85, 0.5);
    e.add(w);
    const ir = mesh(sphere(r * 0.09, 14), iris, 0, -r * 0.005, r * 0.05, false);
    ir.scale.z = 0.45;
    e.add(ir);
    e.add(mesh(sphere(r * 0.042, 10), pupil, 0, -r * 0.005, r * 0.068, false));
    e.add(mesh(sphere(r * 0.016, 6), shine, -sx * r * 0.025, r * 0.03, r * 0.078, false));
    // The upper lid covers the top of the eye, so it looks out calmly instead of staring.
    const lid = mesh(lidGeo, skinDark, 0, r * 0.052, r * 0.004, false);
    lid.scale.set(1.25, 0.45, 0.62);
    e.add(lid);
    g.add(e);
    eyes.push(e);
    const b = mesh(boxG(r * 0.32, r * 0.045, r * 0.05), brow, ex, ey + r * 0.24, surf(ex, ey + r * 0.24) - r * 0.015, false);
    b.rotation.z = sx * -0.08;
    g.add(b);
  }
  // Nose: a bridge and a tip rather than a button.
  const bridge = mesh(boxG(r * 0.07, r * 0.26, r * 0.08), skinDark, 0, -r * 0.05, surf(0, -r * 0.05) - r * 0.02, false);
  bridge.rotation.x = -0.25;
  g.add(bridge);
  const tip = mesh(sphere(r * 0.075, 10), skinDark, 0, -r * 0.18, surf(0, -r * 0.18) - r * 0.005, false);
  tip.scale.set(1.25, 0.85, 0.9);
  g.add(tip);
  const mouth = mesh(new THREE.TorusGeometry(r * 0.12, r * 0.022, 6, 14, Math.PI), mat('#7a3a34', { rough: 0.5 }), 0, -r * 0.36, surf(0, -r * 0.4) - r * 0.015, false);
  mouth.scale.y = 0.45;
  if (opts.smile !== false) mouth.rotation.z = Math.PI;
  g.add(mouth);
  return { group: g, eyes };
}

export function makeJason(): JasonModel {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const suit = ownMat('#ff8a3d', { rough: 0.5 });
  const white = mat('#cdd5e0', { rough: 0.45 });
  const grey = mat('#6f7a8e', { rough: 0.5, metal: 0.35 });
  const dark = mat('#2a3242', { rough: 0.6 });

  const legL = new THREE.Group();
  const legR = new THREE.Group();
  legL.position.set(-0.16, 0.62, 0);
  legR.position.set(0.16, 0.62, 0);
  legL.add(mesh(capsule(0.13, 0.26), dark, 0, -0.28, 0));
  legR.add(mesh(capsule(0.13, 0.26), dark, 0, -0.28, 0));
  legL.add(mesh(boxG(0.24, 0.12, 0.34), white, 0, -0.55, 0.05));
  legR.add(mesh(boxG(0.24, 0.12, 0.34), white, 0, -0.55, 0.05));
  body.add(legL, legR);

  const torso = mesh(capsule(0.31, 0.3), suit, 0, 0.98, 0);
  torso.scale.set(1, 1, 0.86);
  body.add(torso);
  body.add(mesh(boxG(0.22, 0.14, 0.06), mat('#5ee0ff', { emissive: '#5ee0ff', ei: 0.9 }), 0, 1.02, 0.27, false));
  body.add(mesh(cyl(0.33, 0.33, 0.1, 18), grey, 0, 0.78, 0));

  const pack = mesh(boxG(0.48, 0.52, 0.26), grey, 0, 1.02, -0.3);
  body.add(pack);
  body.add(mesh(cyl(0.07, 0.1, 0.16), dark, -0.13, 0.7, -0.32), mesh(cyl(0.07, 0.1, 0.16), dark, 0.13, 0.7, -0.32));
  const jets = [glowSprite('#7fe6ff', 0.01), glowSprite('#7fe6ff', 0.01)];
  jets[0].position.set(-0.13, 0.55, -0.32);
  jets[1].position.set(0.13, 0.55, -0.32);
  body.add(...jets);

  // Head: Jason's face inside an open-front helmet with a thin glass visor.
  const head = new THREE.Group();
  head.position.set(0, 1.5, 0);
  const face = makeFace({ r: 0.3, skin: '#e8b48c', iris: '#6a4020', brow: '#4a2a18' });
  face.group.position.set(0, -0.02, 0.05);
  head.add(face.group);
  const hair = mat('#4a2a18', { rough: 0.8 });
  const fringe = mesh(sphere(0.24, 16), hair, 0, 0.2, 0.16, false);
  fringe.scale.set(1.35, 0.5, 0.9);
  head.add(fringe);
  const front = Math.PI / 2;
  const win = 0.95;
  const shellMat = new THREE.MeshStandardMaterial({ color: '#dfe6f0', roughness: 0.35, metalness: 0.15, side: THREE.DoubleSide });
  head.add(mesh(new THREE.SphereGeometry(0.42, 32, 20, front + win, Math.PI * 2 - win * 2), shellMat));
  head.add(mesh(new THREE.SphereGeometry(0.42, 16, 8, front - win, win * 2, 0, 0.62), shellMat));
  head.add(mesh(new THREE.SphereGeometry(0.42, 16, 8, front - win, win * 2, 2.3, Math.PI - 2.3), shellMat));
  const glass = new THREE.MeshStandardMaterial({ color: '#bfeaff', roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.16, depthWrite: false });
  head.add(mesh(new THREE.SphereGeometry(0.425, 24, 12, front - win - 0.02, win * 2 + 0.04, 0.6, 1.72), glass, 0, 0, 0, false));
  head.add(mesh(new THREE.TorusGeometry(0.3, 0.05, 8, 24).rotateX(Math.PI / 2), suit, 0, -0.34, 0));
  head.add(mesh(cyl(0.02, 0.02, 0.28), grey, 0.24, 0.42, -0.08));
  head.add(mesh(sphere(0.055, 10), mat('#ff5e6a', { emissive: '#ff5e6a', ei: 1 }), 0.24, 0.58, -0.08, false));
  const visor = ownMat('#dffaff', { emissive: '#5ee0ff', ei: 0.35 });
  head.add(mesh(cyl(0.06, 0.07, 0.07, 14).rotateX(Math.PI / 2), visor, 0, 0.35, 0.25, false));
  body.add(head);

  const armL = new THREE.Group();
  const armR = new THREE.Group();
  armL.position.set(-0.4, 1.16, 0);
  armR.position.set(0.4, 1.16, 0);
  armL.add(mesh(capsule(0.1, 0.24), suit, 0, -0.22, 0));
  armR.add(mesh(capsule(0.1, 0.24), suit, 0, -0.22, 0));
  armL.add(mesh(sphere(0.12, 12), white, 0, -0.44, 0));
  armR.add(mesh(sphere(0.12, 12), white, 0, -0.44, 0));
  const gun = mesh(boxG(0.16, 0.18, 0.46), grey, 0, -0.48, 0.16);
  armR.add(gun);
  armR.add(mesh(cyl(0.06, 0.06, 0.08), mat('#5ee0ff', { emissive: '#5ee0ff', ei: 1.4 }), 0, -0.48, 0.42, false));
  armR.children[armR.children.length - 1].rotation.x = Math.PI / 2;
  const gunGlow = glowSprite('#ff9a3d', 0.9, 0.9);
  gunGlow.position.set(0, -0.48, 0.5);
  gunGlow.scale.setScalar(0.001);
  armR.add(gunGlow);
  body.add(armL, armR);

  const carry = new THREE.Group();
  carry.position.set(0, 2.35, 0);
  root.add(carry);

  root.add(blobShadow(1.3));
  return { root, body, head, armL, armR, legL, legR, jets, visor, suit, carry, eyes: face.eyes, gunGlow };
}

const SKINS = ['#f2c9a0', '#e0ac7e', '#c68a5e', '#9a6a44', '#f5d8bc', '#7a4e32'];
const HAIRS = ['#2a1a12', '#5a3a22', '#c8a060', '#1a1a1a', '#8a3a22', '#e8e8f0'];
const SUITS = ['#e6edf7', '#9fd0ff', '#ffd6a0', '#c8f0c0', '#f0c8e8'];

/** A colonist in a jumpsuit with a proper face; `seed` varies skin, hair, style and suit. */
export function makeColonist(seed: number): THREE.Group {
  const pick = <T,>(list: T[], n: number) => list[Math.abs(Math.floor(seed * 7919 + n * 104729)) % list.length];
  const g = new THREE.Group();
  const suit = mat(pick(SUITS, 1), { rough: 0.5 });
  const skin = pick(SKINS, 2);
  const hairC = mat(pick(HAIRS, 3), { rough: 0.8 });
  g.add(mesh(capsule(0.28, 0.5), suit, 0, 0.8, 0));
  g.add(mesh(capsule(0.1, 0.36), mat('#3a4458'), -0.13, 0.28, 0), mesh(capsule(0.1, 0.36), mat('#3a4458'), 0.13, 0.28, 0));
  const face = makeFace({ r: 0.28, skin, iris: pick(['#5a3a22', '#2a6a8a', '#3a7a3a', '#2a1a12'], 4), brow: pick(HAIRS, 3) });
  face.group.position.set(0, 1.45, 0);
  g.add(face.group);
  const style = Math.abs(Math.floor(seed * 31)) % 3;
  const top = mesh(sphere(0.29, 18), hairC, 0, 1.52, -0.04);
  top.scale.set(1.02, 0.8, 1.02);
  g.add(top);
  if (style === 1) g.add(mesh(sphere(0.12, 12), hairC, 0, 1.62, -0.24));
  if (style === 2) {
    const back = mesh(capsule(0.22, 0.3), hairC, 0, 1.3, -0.12);
    g.add(back);
  }
  const arm = new THREE.Group();
  arm.position.set(0.32, 1.1, 0);
  arm.add(mesh(capsule(0.08, 0.3), suit, 0, -0.25, 0));
  arm.add(mesh(sphere(0.07, 8), mat(skin), 0, -0.47, 0));
  g.add(arm);
  const armL = new THREE.Group();
  armL.position.set(-0.32, 1.1, 0);
  armL.add(mesh(capsule(0.08, 0.3), suit, 0, -0.25, 0));
  g.add(armL);
  g.add(blobShadow(1));
  g.userData.arm = arm;
  return g;
}

/**
 * Light for hologram figures: bright at the silhouette's rim (fresnel), fainter through the middle,
 * with fine scanlines rolling up, a brighter band sweeping up now and then, and a fade where the
 * figure meets the projector's beam.
 */
export function holoMaterial(color: string, map: THREE.Texture | null = null, fill = 0.2): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(color) },
      opacity: { value: 0 },
      time: { value: 0 },
      base: { value: 0 },
      map: { value: map },
      useMap: { value: map ? 1 : 0 },
      fill: { value: fill },
    },
    vertexShader: `
      varying vec3 vN;
      varying vec3 vView;
      varying float vY;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vY = wp.y;
        vN = normalize(mat3(modelMatrix) * normal);
        vView = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      uniform vec3 color;
      uniform float opacity;
      uniform float time;
      uniform float base;
      uniform sampler2D map;
      uniform float useMap;
      uniform float fill;
      varying vec3 vN;
      varying vec3 vView;
      varying float vY;
      varying vec2 vUv;
      void main() {
        float rim = pow(1.0 - abs(dot(normalize(vN), normalize(vView))), 1.6);
        float scan = 0.72 + 0.28 * sin(vY * 140.0 - time * 9.0);
        float sweep = smoothstep(0.92, 1.0, fract(vY * 0.45 - time * 0.35)) * 0.8;
        float tex = useMap > 0.5 ? texture2D(map, vUv).r : 1.0;
        float h = vY - base;
        float fade = smoothstep(0.0, 0.25, h);
        float a = (fill + rim * 0.95 + sweep) * scan * tex * fade * opacity;
        gl_FragColor = vec4(color * (0.75 + rim * 0.8 + sweep), a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/**
 * A face drawn in light for a hologram head (the front of a sphere is at u = 0.25): eyes under their
 * lids, brows, the line of the nose, lips, and the hairline, like a slightly grainy recording.
 */
function holoFaceTexture(who: 'captain' | 'rosa') {
  const W = 512;
  const H = 256;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.fillStyle = '#9a9a9a';
  g.fillRect(0, 0, W, H);
  const cx = W * 0.25;
  // Hair: the top of the head and the back, darker so the face stands out.
  g.fillStyle = who === 'captain' ? '#b4b4b4' : '#4a4a4a';
  g.fillRect(0, 0, W, who === 'captain' ? 70 : 88);
  if (who === 'rosa') {
    // Hair swept back from the face, framing it on both sides.
    g.beginPath();
    g.ellipse(cx, 92, 70, 44, 0, Math.PI, 0);
    g.fill();
    g.fillRect(cx + 70, 0, W - cx - 140, 150);
  }
  g.fillStyle = '#d2d2d2';
  g.beginPath();
  g.ellipse(cx, 130, 58, 64, 0, 0, Math.PI * 2);
  g.fill();
  const line = (w: number, color: string, pts: number[]) => {
    g.strokeStyle = color;
    g.lineWidth = w;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(pts[0], pts[1]);
    g.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]);
    g.stroke();
  };
  for (const s of [-1, 1]) {
    const ex = cx + s * 24;
    // Eye socket shadow, the white, the iris under the lid, and the lid line.
    g.fillStyle = 'rgba(40,40,40,0.35)';
    g.beginPath();
    g.ellipse(ex, 118, 16, 9, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#e8e8e8';
    g.beginPath();
    g.moveTo(ex - 11, 120);
    g.quadraticCurveTo(ex, 110, ex + 11, 119);
    g.quadraticCurveTo(ex, 126, ex - 11, 120);
    g.fill();
    g.fillStyle = '#2a2a2a';
    g.beginPath();
    g.arc(ex + 1, 119.5, 4.6, 0, Math.PI * 2);
    g.fill();
    line(2.6, '#1e1e1e', [ex - 12, 120, ex, 108, ex + 12, 118]);
    // Brows: straighter and heavier for the Captain.
    line(who === 'captain' ? 5 : 4, '#262626', [ex - 13, 104, ex, who === 'captain' ? 99 : 97, ex + 13, 103]);
  }
  // Nose: one side in shadow, then the tip.
  line(2.2, 'rgba(30,30,30,0.7)', [cx + 3, 120, cx + 6, 135, cx + 6, 144]);
  line(2.4, '#2a2a2a', [cx - 8, 146, cx, 151, cx + 8, 146]);
  // Lips.
  g.fillStyle = '#5a5a5a';
  g.beginPath();
  g.moveTo(cx - 16, 164);
  g.quadraticCurveTo(cx, 158, cx + 16, 164);
  g.quadraticCurveTo(cx, 172, cx - 16, 164);
  g.fill();
  line(2.2, '#1e1e1e', [cx - 17, 164, cx, 167, cx + 17, 164]);
  // Jaw shadow along the bottom of the face.
  line(3, 'rgba(40,40,40,0.5)', [cx - 44, 170, cx, 206, cx + 44, 170]);
  // Grain and scanlines, like an old recording.
  for (let i = 0; i < 1800; i++) {
    g.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)';
    g.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }
  for (let y = 0; y < H; y += 4) {
    g.fillStyle = 'rgba(0,0,0,0.18)';
    g.fillRect(0, y, W, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A lathe profile, as [radius, height] pairs from the bottom up. */
const lathe = (pts: [number, number][], seg = 22) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);

/** A limb segment (a tapered capsule) hanging down from its joint. */
function limb(r0: number, r1: number, len: number) {
  const g = new THREE.CylinderGeometry(r0, r1, len, 12, 1, false);
  g.translate(0, -len / 2, 0);
  return g;
}

/**
 * A full figure made of light for hologram messages, with real proportions: a tapered torso and
 * jacket, arms that bend at the elbow (one raised, as if talking), and the Captain's peaked cap and
 * epaulettes or Aunt Rosa's hair bun and security vest. Returns the group and its materials, so the
 * projector can drive their flicker.
 */
export function makeHoloFigure(who: 'captain' | 'rosa', color: string): { group: THREE.Group; mats: THREE.ShaderMaterial[] } {
  const g = new THREE.Group();
  const body = holoMaterial(color);
  // The head glows through its middle too, so the face reads clearly.
  const faceM = holoMaterial(color, holoFaceTexture(who), 0.75);
  const add = (geo: THREE.BufferGeometry, x: number, y: number, z: number, m: THREE.Material = body) => {
    const me = new THREE.Mesh(geo, m);
    me.position.set(x, y, z);
    g.add(me);
    return me;
  };
  // Legs and shoes.
  for (const sx of [-1, 1]) {
    add(limb(0.075, 0.055, 0.8), sx * 0.1, 0.86, 0);
    const shoe = add(new THREE.CapsuleGeometry(0.05, 0.12, 4, 8).rotateX(Math.PI / 2), sx * 0.1, 0.05, 0.04);
    shoe.scale.set(1.1, 0.8, 1);
  }
  // Torso: hips, waist, chest and shoulders in one smooth profile, flattened front to back.
  const torso = add(
    lathe([
      [0, 0],
      [0.16, 0.02],
      [0.18, 0.12],
      [0.155, 0.32],
      [0.19, 0.5],
      [0.22, 0.62],
      [0.2, 0.68],
      [0.07, 0.72],
      [0, 0.73],
    ]),
    0,
    0.8,
    0,
  );
  torso.scale.z = 0.66;
  // The jacket hem flares a little over the hips.
  const hem = add(
    lathe([
      [0.19, 0],
      [0.17, 0.14],
    ]),
    0,
    0.74,
    0,
  );
  hem.scale.z = 0.7;
  // Arms: the left hangs relaxed, the right is raised mid-gesture.
  const arm = (sx: number, shoulder: number, elbow: number) => {
    const upper = new THREE.Group();
    upper.position.set(sx * 0.25, 1.44, 0);
    upper.rotation.set(shoulder, 0, sx * 0.12);
    const up = new THREE.Mesh(limb(0.055, 0.045, 0.3), body);
    upper.add(up);
    const lower = new THREE.Group();
    lower.position.y = -0.3;
    lower.rotation.x = elbow;
    lower.add(new THREE.Mesh(limb(0.045, 0.035, 0.27), body));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), body);
    hand.position.y = -0.3;
    hand.scale.set(0.8, 1.2, 0.6);
    lower.add(hand);
    upper.add(lower);
    g.add(upper);
  };
  arm(-1, 0.05, -0.15);
  arm(1, -0.35, -1.5);
  add(new THREE.CylinderGeometry(0.05, 0.06, 0.12, 12), 0, 1.58, 0);
  // Head, a little taller than wide, with the face drawn in light.
  const head = add(new THREE.SphereGeometry(0.115, 28, 20), 0, 1.74, 0.01, faceM);
  head.scale.set(0.92, 1.12, 0.98);
  if (who === 'captain') {
    // Peaked cap, badge, epaulettes and a line of buttons down the jacket.
    add(new THREE.CylinderGeometry(0.128, 0.118, 0.07, 22), 0, 1.86, 0);
    const top = add(new THREE.CylinderGeometry(0.14, 0.128, 0.03, 22), 0, 1.905, -0.01);
    top.scale.z = 1.08;
    const peak = add(new THREE.CylinderGeometry(0.12, 0.12, 0.012, 20, 1, false, -Math.PI / 2, Math.PI), 0, 1.83, 0.02);
    peak.rotation.x = 0.25;
    add(new THREE.SphereGeometry(0.018, 8, 6), 0, 1.88, 0.125);
    for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.12, 0.018, 0.1), sx * 0.19, 1.49, 0);
    for (let i = 0; i < 4; i++) add(new THREE.SphereGeometry(0.012, 6, 4), 0.03, 1.02 + i * 0.1, 0.13);
  } else {
    // Hair drawn back into a bun, and the security vest over the uniform.
    const hair = add(new THREE.SphereGeometry(0.122, 22, 14, 0, Math.PI * 2, 0, 1.45), 0, 1.755, -0.012);
    hair.scale.set(0.95, 1.08, 1.02);
    add(new THREE.SphereGeometry(0.055, 12, 10), 0, 1.86, -0.11);
    const vest = add(
      lathe([
        [0.18, 0],
        [0.2, 0.2],
        [0.215, 0.36],
        [0.19, 0.44],
      ]),
      0,
      1.0,
      0,
    );
    vest.scale.z = 0.74;
    add(new THREE.BoxGeometry(0.06, 0.07, 0.01), 0.09, 1.3, 0.155);
  }
  // Everything shares the same projection; the faces keep their own texture.
  return { group: g, mats: [body, faceM] };
}

/* ---------------- LUX ---------------- */

export interface BoltModel {
  root: THREE.Group;
  shell: THREE.Group;
  iris: THREE.MeshStandardMaterial;
  glow: THREE.Sprite;
  lid: THREE.Mesh;
}

export function makeBolt(): BoltModel {
  const root = new THREE.Group();
  const shell = new THREE.Group();
  root.add(shell);
  const white = mat('#c9d2de', { rough: 0.4, metal: 0.2 });
  const grey = mat('#7b8699', { rough: 0.45, metal: 0.4 });
  shell.add(mesh(sphere(0.36, 26), white));
  const band = mesh(torus(0.355, 0.05), grey);
  band.rotation.x = Math.PI / 2;
  band.position.y = -0.06;
  shell.add(band);
  shell.add(mesh(sphere(0.17, 18), mat('#16202e', { rough: 0.3 }), 0, 0.03, 0.25));
  const iris = ownMat('#5ee0ff', { emissive: '#5ee0ff', ei: 1.6 });
  shell.add(mesh(sphere(0.105, 16), iris, 0, 0.03, 0.34, false));
  shell.add(mesh(sphere(0.035, 8), mat('#ffffff', { emissive: '#ffffff', ei: 1 }), -0.035, 0.07, 0.43, false));
  const lid = mesh(sphere(0.18, 18), white, 0, 0.03, 0.25, false);
  lid.scale.set(1, 0.05, 1);
  lid.position.y = 0.22;
  shell.add(lid);
  shell.add(mesh(sphere(0.11, 12), grey, -0.37, -0.02, 0), mesh(sphere(0.11, 12), grey, 0.37, -0.02, 0));
  shell.add(mesh(cyl(0.018, 0.018, 0.3), grey, 0.1, 0.46, -0.05));
  shell.add(mesh(sphere(0.055, 10), mat('#ff5e6a', { emissive: '#ff5e6a', ei: 1.5 }), 0.1, 0.63, -0.05, false));
  const glow = glowSprite('#5ee0ff', 1.3, 0.35);
  glow.position.y = -0.45;
  root.add(glow);
  return { root, shell, iris, glow, lid };
}
