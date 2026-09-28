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

/* ---------------- Kai ---------------- */

export interface KaiModel {
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
 * A friendly face: skin, eyes with irises and a sparkle, brows, a small nose, a smile and rosy
 * cheeks. `r` is the head radius; the face looks along +Z.
 */
export function makeFace(opts: { r: number; skin: string; iris?: string; brow?: string; smile?: boolean }): { group: THREE.Group; eyes: THREE.Object3D[] } {
  const { r, skin } = opts;
  const g = new THREE.Group();
  const skinM = mat(skin, { rough: 0.62 });
  g.add(mesh(sphere(r, 28), skinM, 0, 0, 0));
  const white = mat('#fbfbff', { rough: 0.25 });
  const iris = mat(opts.iris ?? '#5a3a22', { rough: 0.3 });
  const pupil = mat('#0c0a10', { rough: 0.2 });
  const shine = mat('#ffffff', { emissive: '#ffffff', ei: 1 });
  const brow = mat(opts.brow ?? '#3a2416', { rough: 0.7 });
  const eyes: THREE.Object3D[] = [];
  const surf = (x: number, y: number) => Math.sqrt(Math.max(0, r * r - x * x - y * y));
  for (const sx of [-1, 1]) {
    const ex = sx * r * 0.34;
    const ey = r * 0.06;
    const e = new THREE.Group();
    e.position.set(ex, ey, surf(ex, ey) - r * 0.07);
    const w = mesh(sphere(r * 0.2, 16), white, 0, 0, 0, false);
    w.scale.set(1, 1.2, 0.55);
    e.add(w);
    const ir = mesh(sphere(r * 0.13, 14), iris, 0, -r * 0.01, r * 0.075, false);
    ir.scale.z = 0.5;
    e.add(ir);
    e.add(mesh(sphere(r * 0.07, 10), pupil, 0, -r * 0.01, r * 0.1, false));
    e.add(mesh(sphere(r * 0.035, 8), shine, -sx * r * 0.04, r * 0.045, r * 0.125, false));
    g.add(e);
    eyes.push(e);
    const b = mesh(boxG(r * 0.3, r * 0.06, r * 0.06), brow, ex, ey + r * 0.3, surf(ex, ey + r * 0.3) - r * 0.02, false);
    b.rotation.z = sx * -0.14;
    g.add(b);
    const cheek = mesh(sphere(r * 0.13, 10), mat('#ff8a9a', { rough: 0.8, opacity: 0.4 }), sx * r * 0.55, -r * 0.2, surf(sx * r * 0.55, -r * 0.2) - r * 0.06, false);
    cheek.scale.z = 0.4;
    g.add(cheek);
  }
  g.add(mesh(sphere(r * 0.085, 10), mat(new THREE.Color(skin).multiplyScalar(0.9).getStyle(), { rough: 0.6 }), 0, -r * 0.14, surf(0, -r * 0.14) - r * 0.01, false));
  const mouth = mesh(new THREE.TorusGeometry(r * 0.17, r * 0.035, 6, 14, Math.PI), mat('#8a2a2a', { rough: 0.5 }), 0, -r * 0.33, surf(0, -r * 0.4) - r * 0.02, false);
  if (opts.smile !== false) mouth.rotation.z = Math.PI;
  g.add(mouth);
  return { group: g, eyes };
}

export function makeKai(): KaiModel {
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

  // Head: Kai's face inside an open-front helmet with a thin glass visor.
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

/** Scanlines for hologram light. */
function scanTexture() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 64;
  const x = c.getContext('2d') as CanvasRenderingContext2D;
  for (let y = 0; y < 64; y++) {
    const v = y % 4 < 2 ? 255 : 110;
    x.fillStyle = `rgb(${v},${v},${v})`;
    x.fillRect(0, y, 4, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 6);
  return t;
}

/** Face drawn in light for a hologram head (the front of a sphere is at u = 0.25). */
function holoFaceTexture(who: 'captain' | 'rosa') {
  const W = 256;
  const H = 128;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.fillStyle = '#9a9a9a';
  g.fillRect(0, 0, W, H);
  const cx = W * 0.25;
  const eye = (x: number) => {
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.ellipse(x, 58, 7, 9, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#202020';
    g.beginPath();
    g.arc(x, 60, 4, 0, Math.PI * 2);
    g.fill();
  };
  eye(cx - 13);
  eye(cx + 13);
  g.strokeStyle = '#ffffff';
  g.lineWidth = 3;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(cx - 20, 44);
  g.lineTo(cx - 7, who === 'captain' ? 42 : 45);
  g.moveTo(cx + 7, who === 'captain' ? 42 : 45);
  g.lineTo(cx + 20, 44);
  g.stroke();
  g.beginPath();
  g.arc(cx, 76, 9, 0.2 * Math.PI, 0.8 * Math.PI);
  g.stroke();
  g.fillStyle = '#d0d0d0';
  g.fillRect(cx - 2, 64, 4, 8);
  for (let y = 0; y < H; y += 4) {
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.fillRect(0, y, W, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * A full figure made of light for hologram messages: face, uniform and accessories. Returns the
 * group and its materials (so the projector can flicker them).
 */
export function makeHoloFigure(who: 'captain' | 'rosa', color: string): { group: THREE.Group; mats: THREE.MeshBasicMaterial[] } {
  const g = new THREE.Group();
  const scan = scanTexture();
  const body = new THREE.MeshBasicMaterial({ color, map: scan, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const faceM = new THREE.MeshBasicMaterial({ color, map: holoFaceTexture(who), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const m = (geo: THREE.BufferGeometry, x: number, y: number, z: number, mt = body) => {
    const me = new THREE.Mesh(geo, mt);
    me.position.set(x, y, z);
    g.add(me);
    return me;
  };
  // Legs and boots.
  for (const sx of [-1, 1]) {
    m(new THREE.CapsuleGeometry(0.1, 0.42, 4, 10), sx * 0.12, 0.34, 0);
    m(new THREE.BoxGeometry(0.16, 0.08, 0.26), sx * 0.12, 0.05, 0.04);
  }
  // Torso, shoulders and arms (one hand raised, as if talking).
  const torso = m(new THREE.CapsuleGeometry(0.24, 0.42, 4, 14), 0, 0.92, 0);
  torso.scale.z = 0.8;
  m(new THREE.BoxGeometry(0.62, 0.12, 0.3), 0, 1.22, 0);
  m(new THREE.CapsuleGeometry(0.07, 0.36, 4, 8), -0.34, 0.95, 0);
  const raised = m(new THREE.CapsuleGeometry(0.07, 0.34, 4, 8), 0.36, 1.18, 0.1);
  raised.rotation.set(-0.9, 0, -0.5);
  m(new THREE.SphereGeometry(0.06, 8, 6), -0.34, 0.7, 0);
  m(new THREE.SphereGeometry(0.06, 8, 6), 0.44, 1.38, 0.28);
  m(new THREE.CylinderGeometry(0.08, 0.09, 0.12, 10), 0, 1.33, 0);
  // Head with a drawn face (rotated so the face looks forward).
  const head = m(new THREE.SphereGeometry(0.22, 24, 16), 0, 1.56, 0, faceM);
  head.rotation.y = 0;
  if (who === 'captain') {
    m(new THREE.CylinderGeometry(0.24, 0.23, 0.12, 20), 0, 1.76, 0);
    m(new THREE.BoxGeometry(0.34, 0.03, 0.18), 0, 1.71, 0.2);
    m(new THREE.SphereGeometry(0.04, 8, 6), 0, 1.78, 0.24);
    for (const sx of [-1, 1]) m(new THREE.BoxGeometry(0.16, 0.04, 0.2), sx * 0.3, 1.29, 0);
  } else {
    m(new THREE.SphereGeometry(0.11, 10, 8), 0, 1.74, -0.14);
    const hair = m(new THREE.SphereGeometry(0.23, 16, 10, 0, Math.PI * 2, 0, 1.3), 0, 1.58, -0.02);
    hair.scale.set(1.04, 1, 1.04);
    m(new THREE.BoxGeometry(0.4, 0.34, 0.32), 0, 0.98, 0.02);
  }
  return { group: g, mats: [body, faceM] };
}

/* ---------------- BOLT ---------------- */

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
