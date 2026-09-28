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
