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
  visor: THREE.MeshStandardMaterial;
  suit: THREE.MeshStandardMaterial;
  carry: THREE.Group;
}

export function makeKai(): KaiModel {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const suit = ownMat('#ff8a3d', { rough: 0.5 });
  const white = mat('#eef3fa', { rough: 0.35 });
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

  const head = new THREE.Group();
  head.position.set(0, 1.5, 0);
  head.add(mesh(sphere(0.42, 24), white, 0, 0, 0));
  const visor = ownMat('#10223c', { emissive: '#3fcfff', ei: 0.35, rough: 0.12, metal: 0.4 });
  const vis = mesh(sphere(0.35, 24), visor, 0, -0.02, 0.17);
  vis.scale.set(1, 0.66, 0.62);
  head.add(vis);
  head.add(mesh(torus(0.42, 0.045), suit, 0, 0, 0));
  head.children[head.children.length - 1].rotation.x = Math.PI / 2;
  head.add(mesh(cyl(0.02, 0.02, 0.28), grey, 0.24, 0.42, -0.08));
  head.add(mesh(sphere(0.055, 10), mat('#ff5e6a', { emissive: '#ff5e6a', ei: 1 }), 0.24, 0.58, -0.08, false));
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
  body.add(armL, armR);

  const carry = new THREE.Group();
  carry.position.set(0, 2.35, 0);
  root.add(carry);

  root.add(blobShadow(1.3));
  return { root, body, head, armL, armR, legL, legR, jets, visor, suit, carry };
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
  const white = mat('#e6edf7', { rough: 0.3, metal: 0.2 });
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

/* ---------------- enemies ---------------- */

export interface EnemyModel {
  root: THREE.Group;
  body: THREE.Group;
  /** Materials that flash white when hit. */
  flash: THREE.MeshStandardMaterial[];
  parts: Record<string, THREE.Object3D>;
  mats?: Record<string, THREE.MeshStandardMaterial>;
}

function eyes(parent: THREE.Object3D, y: number, z: number, spread: number, r: number, angry = false) {
  const white = mat('#ffffff', { rough: 0.3 });
  const black = mat('#111111', { rough: 0.3 });
  for (const sx of [-1, 1]) {
    parent.add(mesh(sphere(r, 14), white, sx * spread, y, z, false));
    parent.add(mesh(sphere(r * 0.5, 10), black, sx * spread, y, z + r * 0.62, false));
    if (angry) {
      const brow = mesh(boxG(r * 2, r * 0.35, r * 0.4), black, sx * spread, y + r * 0.95, z + r * 0.3, false);
      brow.rotation.z = sx * 0.4;
      parent.add(brow);
    }
  }
}

const SPORE_COLORS: Record<string, [string, string]> = {
  default: ['#9b4dd6', '#ff8ad8'],
  frost: ['#8fd6ff', '#ffffff'],
  magma: ['#ff6a2a', '#ffd166'],
  goo: ['#ff5fa8', '#ffe0f0'],
  toxic: ['#7fdc3a', '#e8ff9a'],
};

export function makeSporeling(variant = 'default', scale = 1): EnemyModel {
  const [c1, c2] = SPORE_COLORS[variant] ?? SPORE_COLORS.default;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const skin = ownMat(c1, { emissive: c1, ei: 0.18, rough: 0.4 });
  const blob = mesh(sphere(0.55, 22), skin, 0, 0.5, 0);
  blob.scale.set(1, 0.85, 1);
  body.add(blob);
  const spot = mat(c2, { emissive: c2, ei: 0.5 });
  body.add(mesh(sphere(0.13, 10), spot, 0.3, 0.8, -0.2, false), mesh(sphere(0.1, 10), spot, -0.33, 0.7, -0.25, false), mesh(sphere(0.09, 10), spot, 0.05, 0.95, -0.3, false));
  eyes(body, 0.6, 0.38, 0.19, 0.15);
  body.add(mesh(sphere(0.12, 10), skin, -0.25, 0.08, 0.1), mesh(sphere(0.12, 10), skin, 0.25, 0.08, 0.1));
  root.add(blobShadow(1.3));
  root.scale.setScalar(scale);
  return { root, body, flash: [skin], parts: { blob } };
}

export function makeSnapper(): EnemyModel {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const green = ownMat('#3fae4a', { emissive: '#3fae4a', ei: 0.15, rough: 0.45 });
  const red = mat('#d63a5a', { emissive: '#d63a5a', ei: 0.3 });
  const leaf = mat('#2e7a36', { rough: 0.6 });
  for (let i = 0; i < 5; i++) {
    const l = mesh(cone(0.28, 0.9, 6), leaf, Math.cos((i / 5) * Math.PI * 2) * 0.35, 0.15, Math.sin((i / 5) * Math.PI * 2) * 0.35);
    l.rotation.z = Math.cos((i / 5) * Math.PI * 2) * 1.2;
    l.rotation.x = -Math.sin((i / 5) * Math.PI * 2) * 1.2;
    root.add(l);
  }
  const stem = mesh(cyl(0.12, 0.16, 1.2), green, 0, 0.6, 0);
  body.add(stem);
  const head = new THREE.Group();
  head.position.y = 1.3;
  const top = mesh(sphere(0.5, 18), green, 0, 0, 0);
  top.scale.set(1, 0.62, 1);
  const inner = mesh(sphere(0.44, 16), red, 0, -0.04, 0.06, false);
  inner.scale.set(0.95, 0.4, 0.95);
  head.add(top, inner);
  const teeth = mat('#ffffff');
  for (let i = 0; i < 6; i++) {
    const t = mesh(cone(0.06, 0.16, 5), teeth, Math.cos((i / 6) * Math.PI - Math.PI) * 0.32, -0.12, 0.3 + Math.sin((i / 6) * Math.PI) * 0.1, false);
    t.rotation.x = Math.PI;
    head.add(t);
  }
  eyes(head, 0.26, 0.26, 0.17, 0.11, true);
  body.add(head);
  root.add(blobShadow(1.4));
  return { root, body, flash: [green], parts: { head } };
}

export function makeBuzzer(): EnemyModel {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const metal = ownMat('#8a93a6', { rough: 0.35, metal: 0.6 });
  body.add(mesh(sphere(0.42, 20), metal));
  const eye = mat('#ff3b5c', { emissive: '#ff3b5c', ei: 1.6 });
  body.add(mesh(sphere(0.14, 12), eye, 0, 0, 0.36, false));
  const vine = mat('#e0479f', { emissive: '#e0479f', ei: 0.4 });
  const t = mesh(torus(0.44, 0.05), vine);
  t.rotation.set(1.2, 0.3, 0);
  body.add(t);
  body.add(mesh(sphere(0.1, 10), mat('#ff8ad8', { emissive: '#ff8ad8', ei: 0.8 }), 0.25, 0.3, -0.1, false));
  const rotors: THREE.Object3D[] = [];
  for (const sx of [-1, 1]) {
    body.add(mesh(cyl(0.04, 0.04, 0.5), metal, sx * 0.45, 0.1, 0).rotateZ(Math.PI / 2));
    const r = mesh(cyl(0.34, 0.34, 0.02, 18), mat('#dfe6f2', { opacity: 0.55 }), sx * 0.72, 0.18, 0, false);
    body.add(r);
    rotors.push(r);
  }
  const shadow = blobShadow(1.1);
  root.add(shadow);
  return { root, body, flash: [metal], parts: { rotorL: rotors[0], rotorR: rotors[1], shadow } };
}

export function makeSentry(): EnemyModel {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const shell = ownMat('#5b6272', { rough: 0.4, metal: 0.5 });
  const red = mat('#c9354a', { rough: 0.5 });
  body.add(mesh(boxG(1, 0.9, 0.9), shell, 0, 0.95, 0));
  body.add(mesh(boxG(1.04, 0.16, 0.94), red, 0, 1.2, 0));
  const dome = mesh(sphere(0.38, 18), shell, 0, 1.45, 0);
  dome.scale.set(1, 0.7, 1);
  body.add(dome);
  const eyeMat = ownMat('#ff3040', { emissive: '#ff3040', ei: 1.8 });
  body.add(mesh(sphere(0.12, 12), eyeMat, 0, 1.47, 0.3, false));
  const wheel = mat('#23262d', { rough: 0.8 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) body.add(mesh(cyl(0.2, 0.2, 0.14, 14), wheel, sx * 0.45, 0.22, sz * 0.3).rotateZ(Math.PI / 2));
  const shield = new THREE.Mesh(
    boxG(1.25, 1.2, 0.08),
    new THREE.MeshStandardMaterial({ color: '#5ecbff', emissive: '#3fb6ff', emissiveIntensity: 0.9, transparent: true, opacity: 0.45, depthWrite: false }),
  );
  shield.position.set(0, 1.05, 0.72);
  body.add(shield);
  root.add(blobShadow(1.6));
  return { root, body, flash: [shell], parts: { shield }, mats: { eye: eyeMat } };
}

export function makeTurret(): EnemyModel {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  root.add(mesh(cyl(0.55, 0.7, 0.35, 16), mat('#3b3350', { rough: 0.6, metal: 0.3 }), 0, 0.17, 0));
  const bulb = ownMat('#b53fbf', { emissive: '#b53fbf', ei: 0.2, rough: 0.4 });
  const head = new THREE.Group();
  head.position.y = 0.95;
  head.add(mesh(sphere(0.52, 20), bulb));
  const mouth = mesh(torus(0.2, 0.07), mat('#ffd166', { emissive: '#ffd166', ei: 1.2 }), 0, 0.05, 0.47, false);
  head.add(mouth);
  const petal = mat('#ff8ad8', { rough: 0.5 });
  for (let i = 0; i < 6; i++) {
    const p = mesh(cone(0.18, 0.5, 6), petal, Math.cos((i / 6) * Math.PI * 2) * 0.45, -0.25, Math.sin((i / 6) * Math.PI * 2) * 0.45);
    p.rotation.z = Math.cos((i / 6) * Math.PI * 2) * 2.2;
    p.rotation.x = -Math.sin((i / 6) * Math.PI * 2) * 2.2;
    head.add(p);
  }
  body.add(head);
  eyes(head, 0.28, 0.4, 0.2, 0.1, true);
  root.add(blobShadow(1.6));
  return { root, body, flash: [bulb], parts: { head } };
}

export function makeBrute(): EnemyModel {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const skin = ownMat('#7a4fa0', { emissive: '#7a4fa0', ei: 0.12, rough: 0.5 });
  const torso = mesh(sphere(1, 24), skin, 0, 1.25, 0);
  torso.scale.set(1.1, 0.95, 0.95);
  body.add(torso);
  const armL = new THREE.Group();
  const armR = new THREE.Group();
  armL.position.set(-1.05, 1.5, 0.1);
  armR.position.set(1.05, 1.5, 0.1);
  armL.add(mesh(capsule(0.32, 0.8), skin, 0, -0.55, 0));
  armR.add(mesh(capsule(0.32, 0.8), skin, 0, -0.55, 0));
  body.add(armL, armR);
  eyes(body, 1.55, 0.82, 0.3, 0.2, true);
  const bulb = mat('#ff6fcf', { emissive: '#ff6fcf', ei: 0.9 });
  body.add(mesh(sphere(0.25, 12), bulb, 0.4, 2.1, -0.4, false), mesh(sphere(0.2, 12), bulb, -0.5, 2.0, -0.3, false), mesh(sphere(0.18, 12), bulb, 0, 2.2, -0.6, false));
  body.add(mesh(capsule(0.28, 0.2), skin, -0.45, 0.3, 0), mesh(capsule(0.28, 0.2), skin, 0.45, 0.3, 0));
  root.add(blobShadow(3));
  return { root, body, flash: [skin], parts: { armL, armR } };
}
