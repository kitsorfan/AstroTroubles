import * as THREE from 'three';

import type { EnemyModel } from './aliens';
import { blobShadow, boxG, capsule, cyl, glowSprite, mat, mesh, ownMat, sphere, torus } from './models';

/**
 * General Brennus's robots, the Thorn Legion: chunky, rounded machines in olive army paint with brass
 * trim, a red gear emblem and red lenses. Little pink lights in their vents and cores show the Celestia
 * pollen that powers them. Friendly toy-like shapes, but easy to read from the camera's height.
 */

export const LEGION = {
  armour: '#3e4a2a',
  dark: '#20261a',
  brass: '#c9a24a',
  red: '#d0302a',
  eye: '#ff2a2a',
  pollen: '#ff6fcf',
};

const Y = new THREE.Vector3(0, 1, 0);
const glow = (c: string, ei = 2.2) => mat(c, { emissive: c, ei, rough: 0.3 });

/** The shared paint set: armour flashes white when hit, so every robot gets its own copy. */
function paints() {
  const armour = ownMat(LEGION.armour, { emissive: '#ff3040', ei: 0.02, rough: 0.5, metal: 0.25 });
  // Marked so a repaint (Aeëtes's gold, see `paintRobot`) can find it.
  armour.userData.armour = true;
  return {
    armour,
    dark: mat(LEGION.dark, { rough: 0.6, metal: 0.4 }),
    brass: mat(LEGION.brass, { emissive: '#5a3a08', ei: 0.25, rough: 0.3, metal: 0.8 }),
    red: mat(LEGION.red, { emissive: LEGION.red, ei: 0.4, rough: 0.4 }),
    pollen: glow(LEGION.pollen, 2.4),
  };
}

/**
 * Repaints a robot's armour: `gold` is Aeëtes's shiny paint on the Legion robots he stole (chapter 3),
 * `legion` puts the old olive back (a robot that went back to General Brennus's side).
 */
export function paintRobot(root: THREE.Object3D, paint: 'gold' | 'legion') {
  root.traverse((o) => {
    const m = (o as THREE.Mesh).material;
    if (!(m instanceof THREE.MeshStandardMaterial) || !m.userData.armour) return;
    m.color.set(paint === 'gold' ? '#e2b236' : LEGION.armour);
    m.metalness = paint === 'gold' ? 0.75 : 0.25;
    m.roughness = paint === 'gold' ? 0.28 : 0.5;
  });
}

/** A capsule stretched between two points: arms and struts. */
function limb(parent: THREE.Object3D, from: [number, number, number], to: [number, number, number], r: number, m: THREE.Material) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const d = b.clone().sub(a);
  const len = d.length();
  const me = mesh(capsule(r, Math.max(0.01, len - r * 2)), m);
  me.position.copy(a).addScaledVector(d, 0.5);
  me.quaternion.setFromUnitVectors(Y, d.normalize());
  parent.add(me);
  return me;
}

/** Brennus's red gear emblem, facing +z. */
export function gearEmblem(r: number, m: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(torus(r * 0.68, r * 0.24), m, 0, 0, 0, false));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const tooth = mesh(boxG(r * 0.34, r * 0.34, r * 0.3), m, Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95, 0, false);
    tooth.rotation.z = a;
    g.add(tooth);
  }
  g.add(mesh(cyl(r * 0.24, r * 0.24, r * 0.3, 12), m, 0, 0, 0, false).rotateX(Math.PI / 2));
  return g;
}

/** A round red lens in a brass ring, facing +z, with a glow sprite that flares when it is about to fire. */
function lens(parent: THREE.Object3D, r: number, x: number, y: number, z: number, brass: THREE.Material) {
  const m = ownMat(LEGION.eye, { emissive: LEGION.eye, ei: 2 });
  const eye = mesh(sphere(r, 16), m, x, y, z, false);
  eye.scale.z = 0.55;
  parent.add(eye);
  parent.add(mesh(torus(r * 1.05, r * 0.25), brass, x, y, z + r * 0.15, false));
  const flare = glowSprite(LEGION.eye, r * 7, 0);
  flare.position.set(x, y, z + r * 0.6);
  parent.add(flare);
  return { m, flare };
}

/* ---------------- Legion Trooper ---------------- */

/** A stocky two-legged rifle robot: helmet with one big red lens, brass shoulders, a pollen tank on its back. */
export function makeTrooper(): EnemyModel {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const p = paints();
  const legs: THREE.Object3D[] = [];
  for (const sx of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(sx * 0.22, 0.78, 0);
    leg.add(mesh(capsule(0.13, 0.18), p.dark, 0, -0.2, 0));
    leg.add(mesh(sphere(0.14, 12), p.brass, 0, -0.4, 0.02));
    leg.add(mesh(capsule(0.12, 0.12), p.armour, 0, -0.55, 0));
    leg.add(mesh(boxG(0.3, 0.2, 0.44), p.armour, 0, -0.68, 0.06));
    body.add(leg);
    legs.push(leg);
  }
  body.add(mesh(sphere(0.3, 14), p.dark, 0, 0.86, 0));
  const torso = mesh(sphere(0.48, 22), p.armour, 0, 1.2, 0);
  torso.scale.set(1, 0.85, 0.8);
  body.add(torso);
  const belt = mesh(torus(0.37, 0.05), p.brass, 0, 0.93, 0, false);
  belt.rotation.x = Math.PI / 2;
  belt.scale.set(1, 0.82, 1);
  body.add(belt);
  const emblem = gearEmblem(0.13, p.red);
  emblem.position.set(0, 1.26, 0.39);
  body.add(emblem);
  for (const sx of [-1, 1]) {
    const pad = mesh(sphere(0.18, 14), p.brass, sx * 0.48, 1.42, 0);
    pad.scale.set(1, 0.7, 1);
    body.add(pad);
  }
  // Pollen tank on its back: the pink glow that powers it.
  const tank = new THREE.Group();
  tank.position.set(0, 1.22, -0.42);
  tank.add(mesh(cyl(0.16, 0.16, 0.46, 14), p.dark));
  tank.add(mesh(cyl(0.12, 0.12, 0.36, 14), p.pollen, 0, 0, -0.06, false));
  tank.add(glowSprite(LEGION.pollen, 0.9, 0.5));
  body.add(tank);
  // Helmet with one big lens.
  const head = new THREE.Group();
  head.position.set(0, 1.72, 0.02);
  const helmet = mesh(sphere(0.28, 18), p.armour);
  helmet.scale.set(1.05, 0.9, 1);
  head.add(helmet);
  const brim = mesh(torus(0.27, 0.04), p.brass, 0, -0.05, 0, false);
  brim.rotation.x = Math.PI / 2;
  head.add(brim);
  const eye = lens(head, 0.12, 0, 0.02, 0.24, p.brass);
  head.add(mesh(cyl(0.015, 0.015, 0.3, 6), p.dark, -0.16, 0.32, -0.06));
  head.add(mesh(sphere(0.05, 8), p.pollen, -0.16, 0.48, -0.06, false));
  body.add(head);
  // Rifle held in both hands.
  limb(body, [0.48, 1.36, 0], [0.24, 1.04, 0.32], 0.09, p.armour);
  limb(body, [-0.48, 1.36, 0], [0.06, 1.08, 0.55], 0.09, p.armour);
  const gun = new THREE.Group();
  gun.position.set(0.16, 1.07, 0.42);
  gun.add(mesh(boxG(0.16, 0.2, 0.72), p.dark));
  gun.add(mesh(cyl(0.06, 0.06, 0.34, 10), p.brass, 0, 0.02, 0.5).rotateX(Math.PI / 2));
  gun.add(mesh(boxG(0.06, 0.1, 0.2), p.red, 0, 0.14, -0.06));
  const muzzle = mesh(sphere(0.07, 10), glow(LEGION.eye, 2.4), 0, 0.02, 0.68, false);
  gun.add(muzzle);
  body.add(gun);
  root.add(blobShadow(1.5));
  return { root, body, flash: [p.armour], parts: { head, gun, flare: eye.flare, tank }, limbs: legs, mats: { lens: eye.m } };
}

/* ---------------- Roller Mine ---------------- */

/** A rolling ball robot with a little dome head on top (one red eye and an antenna light that blinks faster and faster). */
export function makeMinebot(): EnemyModel {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const p = paints();
  const ball = new THREE.Group();
  ball.position.y = 0.46;
  ball.add(mesh(sphere(0.46, 22), p.armour));
  const seamA = mesh(torus(0.465, 0.03), p.pollen, 0, 0, 0, false);
  const seamB = mesh(torus(0.465, 0.03), p.pollen, 0, 0, 0, false);
  seamB.rotation.x = Math.PI / 2;
  ball.add(seamA, seamB);
  for (const [x, y, z] of [
    [0.4, 0.2, 0.15],
    [-0.4, -0.2, 0.15],
    [0.15, -0.4, -0.2],
    [-0.15, 0.4, -0.2],
    [0.2, 0.15, -0.4],
    [-0.2, -0.15, 0.4],
  ] as const) {
    ball.add(mesh(sphere(0.07, 8), p.brass, x, y, z, false));
  }
  body.add(ball);
  const head = new THREE.Group();
  head.position.y = 0.88;
  const dome = mesh(sphere(0.27, 18), p.armour);
  dome.scale.set(1, 0.72, 1);
  head.add(dome);
  const rim = mesh(torus(0.27, 0.045), p.brass, 0, -0.02, 0, false);
  rim.rotation.x = Math.PI / 2;
  head.add(rim);
  const eye = lens(head, 0.09, 0, 0.04, 0.22, p.brass);
  const emblem = gearEmblem(0.06, p.red);
  emblem.position.set(0, 0.08, -0.24);
  emblem.rotation.y = Math.PI;
  head.add(emblem);
  head.add(mesh(cyl(0.015, 0.015, 0.26, 6), p.dark, 0.08, 0.3, -0.05));
  const light = ownMat(LEGION.eye, { emissive: LEGION.eye, ei: 1 });
  head.add(mesh(sphere(0.065, 10), light, 0.08, 0.45, -0.05, false));
  body.add(head);
  root.add(blobShadow(1.3));
  return { root, body, flash: [p.armour], parts: { ball, head, flare: eye.flare }, mats: { lens: eye.m, light } };
}

/* ---------------- Shield Bulwark ---------------- */

/**
 * A big, slow, round-bellied robot behind a tall brass-rimmed tower shield. Its pollen core glows on its
 * back, so it's easy to see where to hit it.
 */
export function makeBulwark(): EnemyModel {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const p = paints();
  const legs: THREE.Object3D[] = [];
  for (const sx of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(sx * 0.42, 0.62, 0);
    leg.add(mesh(cyl(0.22, 0.26, 0.5, 12), p.dark, 0, -0.25, 0));
    leg.add(mesh(boxG(0.46, 0.22, 0.62), p.armour, 0, -0.51, 0.06));
    body.add(leg);
    legs.push(leg);
  }
  const torso = mesh(sphere(0.78, 24), p.armour, 0, 1.3, 0);
  torso.scale.set(1.08, 0.9, 0.85);
  body.add(torso);
  const belt = mesh(torus(0.8, 0.07), p.brass, 0, 1.0, 0, false);
  belt.rotation.x = Math.PI / 2;
  belt.scale.set(1.02, 0.82, 1);
  body.add(belt);
  for (const sx of [-1, 1]) {
    const pad = mesh(sphere(0.3, 16), p.brass, sx * 0.82, 1.72, 0);
    pad.scale.set(1, 0.65, 1.1);
    body.add(pad);
  }
  // Small head sunk between the shoulders, with a red visor.
  const head = new THREE.Group();
  head.position.set(0, 2.02, 0.1);
  const dome = mesh(sphere(0.32, 18), p.armour);
  dome.scale.set(1.1, 0.8, 1);
  head.add(dome);
  const eyeMat = ownMat(LEGION.eye, { emissive: LEGION.eye, ei: 2.6 });
  const visor = mesh(boxG(0.4, 0.08, 0.06), eyeMat, 0, 0.02, 0.3, false);
  head.add(visor);
  head.add(mesh(sphere(0.06, 8), p.pollen, 0, 0.3, -0.05, false));
  body.add(head);
  // The weak spot: a caged pollen core on its back.
  const core = new THREE.Group();
  core.position.set(0, 1.35, -0.66);
  const coreMat = ownMat(LEGION.pollen, { emissive: LEGION.pollen, ei: 2.4 });
  core.add(mesh(sphere(0.24, 16), coreMat, 0, 0, 0, false));
  for (const a of [0, Math.PI / 2]) {
    const bar = mesh(torus(0.26, 0.035), p.brass, 0, 0, 0, false);
    bar.rotation.y = a + Math.PI / 4;
    core.add(bar);
  }
  const coreGlow = glowSprite(LEGION.pollen, 1.5, 0.6);
  coreGlow.position.z = -0.15;
  core.add(coreGlow);
  body.add(core);
  // A big fist on the right, the shield arm on the left.
  limb(body, [0.85, 1.6, 0], [0.95, 1.0, 0.35], 0.16, p.armour);
  const fist = mesh(sphere(0.24, 14), p.brass, 0.95, 0.9, 0.4);
  body.add(fist);
  limb(body, [-0.85, 1.6, 0], [-0.55, 1.15, 0.75], 0.16, p.armour);
  // The tower shield: olive face, brass rim and rivets, Brennus's gear in the middle.
  const shield = new THREE.Group();
  shield.position.set(0, 1.12, 0.98);
  shield.add(mesh(boxG(1.7, 1.86, 0.16), p.armour));
  for (const [w, h, x, y] of [
    [1.8, 0.14, 0, 0.93],
    [1.8, 0.14, 0, -0.93],
    [0.14, 1.9, 0.86, 0],
    [0.14, 1.9, -0.86, 0],
  ] as const) {
    shield.add(mesh(boxG(w, h, 0.22), p.brass, x, y, 0.02, false));
  }
  for (const [x, y] of [
    [0.6, 0.66],
    [-0.6, 0.66],
    [0.6, -0.66],
    [-0.6, -0.66],
  ] as const) {
    shield.add(mesh(sphere(0.06, 8), p.brass, x, y, 0.1, false));
  }
  const emblem = gearEmblem(0.34, p.red);
  emblem.position.set(0, 0.1, 0.12);
  shield.add(emblem);
  body.add(shield);
  root.add(blobShadow(2.6));
  return { root, body, flash: [p.armour], parts: { shield, head, fist, core, coreGlow }, limbs: legs, mats: { eye: eyeMat, core: coreMat } };
}

/* ---------------- Mortar Bot ---------------- */

/** A squat four-legged dome with a fat mortar barrel on top; the barrel fills with pink light before each shot. */
export function makeMortar(): EnemyModel {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const p = paints();
  const legs: THREE.Object3D[] = [];
  for (const [sx, sz] of [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ] as const) {
    const leg = new THREE.Group();
    leg.position.set(sx * 0.4, 0.45, sz * 0.4);
    limb(leg, [0, 0, 0], [sx * 0.4, -0.42, sz * 0.4], 0.09, p.dark);
    leg.add(mesh(sphere(0.12, 10), p.brass, sx * 0.4, -0.38, sz * 0.4));
    body.add(leg);
    legs.push(leg);
  }
  body.add(mesh(cyl(0.55, 0.62, 0.3, 18), p.dark, 0, 0.45, 0));
  const dome = mesh(sphere(0.64, 22), p.armour, 0, 0.62, 0);
  dome.scale.set(1, 0.72, 1);
  body.add(dome);
  const band = mesh(torus(0.63, 0.05), p.brass, 0, 0.6, 0, false);
  band.rotation.x = Math.PI / 2;
  body.add(band);
  const eye = lens(body, 0.11, 0, 0.78, 0.56, p.brass);
  // Spare shells racked on its back.
  for (let i = 0; i < 3; i++) {
    const s = mesh(capsule(0.08, 0.16), p.brass, (i - 1) * 0.2, 0.8, -0.56, false);
    s.rotation.x = 0.3;
    body.add(s);
  }
  // The barrel pivots up and down (it aims high for far targets) and kicks back when it fires.
  const barrel = new THREE.Group();
  barrel.position.set(0, 0.95, -0.05);
  barrel.rotation.x = 0.7;
  const tube = new THREE.Group();
  tube.add(mesh(cyl(0.24, 0.3, 1.0, 16), p.armour, 0, 0.42, 0));
  const muzzle = mesh(torus(0.24, 0.07), p.brass, 0, 0.92, 0, false);
  muzzle.rotation.x = Math.PI / 2;
  tube.add(muzzle);
  const charge = ownMat(LEGION.pollen, { emissive: LEGION.pollen, ei: 1 });
  tube.add(mesh(cyl(0.18, 0.18, 0.04, 14), charge, 0, 0.9, 0, false));
  const emblem = gearEmblem(0.12, p.red);
  emblem.position.set(0.29, 0.45, 0);
  emblem.rotation.y = Math.PI / 2;
  tube.add(emblem);
  const chargeGlow = glowSprite(LEGION.pollen, 1.2, 0);
  chargeGlow.position.y = 1.0;
  tube.add(chargeGlow);
  barrel.add(tube);
  body.add(barrel);
  root.add(blobShadow(2.2));
  return { root, body, flash: [p.armour], parts: { barrel, tube, flare: eye.flare, chargeGlow }, limbs: legs, mats: { lens: eye.m, charge } };
}

/** A mortar shell: a round olive bomb with a brass band and a pink pollen glow. */
export function makeShell(): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(sphere(0.26, 14), mat(LEGION.armour, { rough: 0.4, metal: 0.4 })));
  const band = mesh(torus(0.26, 0.04), mat(LEGION.brass, { metal: 0.8, rough: 0.3 }), 0, 0, 0, false);
  band.rotation.x = Math.PI / 2;
  g.add(band);
  g.add(glowSprite(LEGION.pollen, 1.1, 0.7));
  return g;
}
