import * as THREE from 'three';

import type { UpgradeId } from '../core/save';
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

/**
 * The parts every hero model has, so cutscenes can pose whichever hero is playing. The root's last
 * child is always the blob shadow.
 */
export interface HeroModel {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  /** Where a carried power cell floats. */
  carry: THREE.Group;
  /** Eye groups, squashed to blink. */
  eyes: THREE.Object3D[];
}

export interface JasonModel extends HeroModel {
  jets: THREE.Sprite[];
  /** The helmet lamp, which glows brighter in dark rooms. */
  visor: THREE.MeshStandardMaterial;
  suit: THREE.MeshStandardMaterial;
  /** Glow at the blaster's muzzle while a fireball charges. */
  gunGlow: THREE.Sprite;
  /** Parts added by shop upgrades (see `dressJason`), and the upgrade levels they were built for. */
  gear: THREE.Object3D[];
  gearKey: string;
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
  return { root, body, head, armL, armR, legL, legR, jets, visor, suit, carry, eyes: face.eyes, gunGlow, gear: [], gearKey: '' };
}

/**
 * Every shop upgrade shows on Jason's suit, so you can see what he has bought:
 * - Heart Plating: a chest plate, then shoulder pads, then both turn gold.
 * - Blaster Power: glowing coils and a longer barrel, then a power cell on top.
 * - Bigger Clip: a drum magazine under the blaster, then a belt of spare cells.
 * - Quick Reload: cooling fins on the blaster, then a forearm gauntlet.
 * - LUX Zapper: a LUX link on his left wrist, then a second, crackling antenna.
 * - Bolt Magnet: a horseshoe magnet on his backpack, which grows and glows gold.
 * Gear hangs off the body, arms and head (never the root, whose last child is the shadow).
 */
export function dressJason(m: JasonModel, upgrades: Partial<Record<UpgradeId, number>>, weapon = 'blaster') {
  const lv = (id: UpgradeId) => upgrades[id] ?? 0;
  const key = (['heart', 'blaster', 'clip', 'rapid', 'boltZap', 'magnet', 'armor', 'dashCell', 'spinCharge', 'grapple'] as const).map(lv).join('') + weapon;
  if (key === m.gearKey) return;
  m.gearKey = key;
  for (const o of m.gear) o.removeFromParent();
  m.gear = [];
  const put = (parent: THREE.Object3D, ...parts: THREE.Object3D[]) => {
    parent.add(...parts);
    m.gear.push(...parts);
  };
  const silver = mat('#dfe6f0', { rough: 0.28, metal: 0.6 });
  const gold = mat('#ffcf5a', { emissive: '#ff9a1a', ei: 0.25, rough: 0.3, metal: 0.7 });
  const dark = mat('#2a3242', { rough: 0.6 });
  const steel = mat('#6f7a8e', { rough: 0.45, metal: 0.4 });
  const red = mat('#ff4d6d', { emissive: '#ff4d6d', ei: 0.9 });
  const fire = mat('#ffb04a', { emissive: '#ff8a1a', ei: 1.6 });
  const cyan = mat('#9ff2ff', { emissive: '#5ee0ff', ei: 1.3 });
  const zap = mat('#bcd4ff', { emissive: '#6a8cff', ei: 1.8 });

  // Heart Plating.
  const heart = lv('heart');
  if (heart >= 1) {
    const plate = heart >= 3 ? gold : silver;
    put(m.body, mesh(boxG(0.42, 0.3, 0.06), plate, 0, 1.0, 0.24), mesh(boxG(0.42, 0.04, 0.07), red, 0, 0.84, 0.235, false));
  }
  if (heart >= 2) {
    const pad = heart >= 3 ? gold : silver;
    for (const arm of [m.armL, m.armR]) {
      const p = mesh(sphere(0.15, 16), pad, 0, 0.02, 0);
      p.scale.set(1.25, 0.7, 1.15);
      put(arm, p);
    }
    // A little heart badge on the left pad.
    const badge = new THREE.Group();
    badge.add(mesh(sphere(0.035, 8), red, -0.025, 0.02, 0, false), mesh(sphere(0.035, 8), red, 0.025, 0.02, 0, false));
    const tip = mesh(boxG(0.05, 0.05, 0.03), red, 0, -0.01, 0, false);
    tip.rotation.z = Math.PI / 4;
    badge.add(tip);
    badge.position.set(-0.19, 0.02, 0);
    badge.rotation.y = -Math.PI / 2;
    put(m.armL, badge);
  }

  // Blaster Power: on the gun, which points along +Z in the right arm.
  const blaster = lv('blaster');
  if (blaster >= 1) {
    const barrel = mesh(cyl(0.045, 0.055, 0.2, 12), steel, 0, -0.48, 0.52);
    barrel.rotation.x = Math.PI / 2;
    put(m.armR, barrel);
    for (const z of [0.02, 0.22]) put(m.armR, mesh(torus(0.115, 0.022), blaster >= 2 ? gold : fire, 0, -0.48, z, false));
  }
  if (blaster >= 2) {
    const cell = mesh(cyl(0.045, 0.045, 0.3, 12), fire, 0, -0.35, 0.12, false);
    cell.rotation.x = Math.PI / 2;
    put(m.armR, cell, mesh(boxG(0.06, 0.05, 0.34), gold, 0, -0.38, 0.12));
  }

  // Bigger Clip.
  const clip = lv('clip');
  if (clip >= 1) {
    const drum = mesh(cyl(0.1, 0.1, 0.12, 16), dark, 0, -0.63, 0.12);
    drum.rotation.z = Math.PI / 2;
    const band = mesh(cyl(0.104, 0.104, 0.04, 16), cyan, 0, -0.63, 0.12, false);
    band.rotation.z = Math.PI / 2;
    put(m.armR, drum, band);
  }
  if (clip >= 2) {
    for (let i = 0; i < 6; i++) {
      const a = -0.9 + (i / 5) * 1.8;
      put(m.body, mesh(cyl(0.035, 0.035, 0.12, 8), cyan, Math.sin(a) * 0.36, 0.78, Math.cos(a) * 0.36, false));
    }
  }

  // Quick Reload.
  const rapid = lv('rapid');
  if (rapid >= 1) {
    for (const x of [-0.095, 0.095]) {
      for (const z of [0.0, 0.1, 0.2]) put(m.armR, mesh(boxG(0.03, 0.14, 0.05), rapid >= 2 ? cyan : steel, x, -0.48, z, false));
    }
  }
  if (rapid >= 2) {
    put(m.armR, mesh(cyl(0.125, 0.115, 0.18, 14), silver, 0, -0.3, 0), mesh(cyl(0.128, 0.128, 0.03, 14), cyan, 0, -0.3, 0, false));
  }

  // LUX Zapper.
  const lux = lv('boltZap');
  if (lux >= 1) {
    const ring = mesh(torus(0.11, 0.028), zap, 0, -0.36, 0, false);
    ring.rotation.x = Math.PI / 2;
    put(m.armL, ring);
  }
  if (lux >= 2) {
    const tipGlow = glowSprite('#7aa0ff', 0.35, 0.9);
    tipGlow.position.set(-0.24, 0.58, -0.08);
    put(m.head, mesh(cyl(0.02, 0.02, 0.28), steel, -0.24, 0.42, -0.08), mesh(sphere(0.055, 10), zap, -0.24, 0.58, -0.08, false), tipGlow);
  }

  // Bolt Magnet: a horseshoe on the back of the pack, ends pointing down.
  const magnet = lv('magnet');
  if (magnet >= 1) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.TorusGeometry(0.13, 0.045, 8, 16, Math.PI), red));
    const tips = magnet >= 2 ? gold : silver;
    g.add(mesh(boxG(0.09, 0.08, 0.09), tips, -0.13, -0.03, 0), mesh(boxG(0.09, 0.08, 0.09), tips, 0.13, -0.03, 0));
    if (magnet >= 2) {
      g.scale.setScalar(1.35);
      g.add(glowSprite('#ffd166', 0.7, 0.55));
    }
    g.position.set(0, 1.08, -0.47);
    put(m.body, g);
  }

  dressMk2(m, lv, put);
  dressWeapon(weapon, (...parts) => put(m.armR, ...parts));
}

/**
 * Gear for what PANDORA sells on Gaia Nova:
 * - Mk II levels: a glowing heart core on the chest plate, a third (cyan) blaster coil, a second
 *   drum band, a gold gauntlet ring, a gold antenna tip, and a brighter magnet glow.
 * - Armor Plating: blue shin guards, then a blue belt. Dash Cell: violet cells on the backpack.
 *   Spin Charge: a gold ring round the waist. Grapple Range: a coiled hook on the hip.
 */
function dressMk2(m: JasonModel, lv: (id: UpgradeId) => number, put: (parent: THREE.Object3D, ...parts: THREE.Object3D[]) => void) {
  const cyan = mat('#9ff2ff', { emissive: '#5ee0ff', ei: 1.3 });
  const gold = mat('#ffcf5a', { emissive: '#ff9a1a', ei: 0.6, rough: 0.3, metal: 0.7 });
  const blue = mat('#6fc4ff', { emissive: '#2f8fff', ei: 0.7, rough: 0.3, metal: 0.4 });
  const violet = mat('#d9c4ff', { emissive: '#8a5cff', ei: 1.2 });
  const steel = mat('#6f7a8e', { rough: 0.45, metal: 0.4 });
  if (lv('heart') >= 4) {
    const core = mesh(sphere(lv('heart') >= 5 ? 0.07 : 0.055, 12), mat('#ff6d8a', { emissive: '#ff2d55', ei: 1.8 }), 0, 1.0, 0.285, false);
    put(m.body, core);
  }
  if (lv('blaster') >= 3) put(m.armR, mesh(torus(0.115, 0.022), cyan, 0, -0.48, 0.12, false));
  if (lv('clip') >= 3) {
    const band = mesh(cyl(0.106, 0.106, 0.03, 16), gold, 0, -0.63, 0.12, false);
    band.rotation.z = Math.PI / 2;
    put(m.armR, band);
  }
  if (lv('rapid') >= 3) {
    const ring = mesh(torus(0.13, 0.02), gold, 0, -0.22, 0, false);
    ring.rotation.x = Math.PI / 2;
    put(m.armR, ring);
  }
  if (lv('boltZap') >= 3) put(m.head, mesh(sphere(0.06, 10), gold, -0.24, 0.62, -0.08, false));
  if (lv('magnet') >= 3) {
    const glow = glowSprite('#ffd166', 1.1, 0.5);
    glow.position.set(0, 1.08, -0.5);
    put(m.body, glow);
  }
  const armor = lv('armor');
  if (armor >= 1) for (const leg of [m.legL, m.legR]) put(leg, mesh(boxG(0.17, 0.2, 0.05), blue, 0, -0.3, 0.12));
  if (armor >= 2) put(m.body, mesh(cyl(0.33, 0.33, 0.07, 20), blue, 0, 0.62, 0));
  for (let i = 0; i < lv('dashCell'); i++) {
    const cell = mesh(cyl(0.04, 0.04, 0.16, 10), violet, -0.12 + i * 0.24, 0.92, -0.5, false);
    put(m.body, cell);
  }
  if (lv('spinCharge') >= 1) {
    const ring = mesh(torus(0.36, 0.022), gold, 0, 0.7, 0, false);
    ring.rotation.x = Math.PI / 2;
    put(m.body, ring);
  }
  if (lv('grapple') >= 1) {
    const coil = mesh(torus(0.08, 0.025), steel, -0.34, 0.66, 0.05);
    coil.rotation.y = Math.PI / 2;
    put(m.body, coil, mesh(cone(0.035, 0.09, 8), cyan, -0.36, 0.56, 0.05, false));
  }
}

/**
 * The equipped weapon shows on the blaster (which points along +Z in the right arm, muzzle near z 0.4):
 * a coloured band, plus three little barrels (Spread Shot), an ice crystal (Frost Ray), two spark
 * prongs (Thunder Arc), a targeting dome (Seeker) or a fuel tank and a long nozzle (Flamethrower).
 */
function dressWeapon(weapon: string, put: (...parts: THREE.Object3D[]) => void) {
  if (weapon === 'blaster') return;
  const colors: Record<string, [string, string]> = { spread: ['#ffd36a', '#ff9a1a'], frost: ['#d6f6ff', '#5ec8ff'], thunder: ['#fff36a', '#b07aff'], seeker: ['#ffb0c8', '#ff3f7a'], flame: ['#ffd08a', '#ff6a1a'] };
  const [c, e] = colors[weapon] ?? ['#ffffff', '#ffffff'];
  const glowM = mat(c, { emissive: e, ei: 1.4 });
  const band = mesh(cyl(0.118, 0.118, 0.06, 14), glowM, 0, -0.48, 0.3, false);
  band.rotation.x = Math.PI / 2;
  put(band);
  if (weapon === 'spread') {
    for (const k of [-1, 0, 1]) {
      const b = mesh(cyl(0.032, 0.04, 0.2, 10), glowM, k * 0.06, -0.48, 0.47, false);
      b.rotation.x = Math.PI / 2;
      b.rotation.z = -k * 0.35;
      put(b);
    }
  } else if (weapon === 'frost') {
    const crystal = mesh(new THREE.OctahedronGeometry(0.09, 0), mat(c, { emissive: e, ei: 1, opacity: 0.85 }), 0, -0.34, 0.2, false);
    crystal.scale.set(0.8, 1.6, 0.8);
    const nose = mesh(cone(0.07, 0.16, 8), glowM, 0, -0.48, 0.48, false);
    nose.rotation.x = Math.PI / 2;
    put(crystal, nose);
    const tip = glowSprite(e, 0.32, 0.8);
    tip.position.set(0, -0.48, 0.56);
    put(tip);
  } else if (weapon === 'thunder') {
    for (const x of [-0.06, 0.06]) put(mesh(boxG(0.025, 0.025, 0.2), glowM, x, -0.44, 0.48, false));
    const spark = glowSprite(e, 0.34, 0.9);
    spark.position.set(0, -0.44, 0.58);
    put(spark);
  } else if (weapon === 'seeker') {
    put(mesh(sphere(0.07, 12), glowM, 0, -0.37, 0.24, false), mesh(cyl(0.05, 0.05, 0.04, 12), mat('#2a3242', { rough: 0.6 }), 0, -0.48, 0.41, false));
    const lens = glowSprite(e, 0.26, 0.9);
    lens.position.set(0, -0.37, 0.3);
    put(lens);
  } else if (weapon === 'flame') {
    // A fuel tank slung under the gun, a long flared nozzle and a little blue pilot flame at its tip.
    const metal = mat('#5a4a40', { metal: 0.6, rough: 0.4 });
    const tank = mesh(cyl(0.075, 0.075, 0.3, 12), mat('#d8402a', { rough: 0.45 }), 0, -0.62, 0.12, false);
    tank.rotation.x = Math.PI / 2;
    const pipe = mesh(cyl(0.035, 0.045, 0.24, 10), metal, 0, -0.48, 0.5, false);
    pipe.rotation.x = Math.PI / 2;
    const flare = mesh(cyl(0.085, 0.045, 0.1, 12), metal, 0, -0.48, 0.66, false);
    flare.rotation.x = Math.PI / 2;
    const pilot = glowSprite('#7fd4ff', 0.2, 0.9);
    pilot.position.set(0, -0.48, 0.74);
    const ember = glowSprite(e, 0.3, 0.7);
    ember.position.set(0, -0.48, 0.74);
    put(tank, pipe, flare, pilot, ember);
  }
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
