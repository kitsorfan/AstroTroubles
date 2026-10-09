import * as THREE from 'three';

import { blobShadow, boxG, cone, cyl, glowSprite, mat, mesh, ownMat, sphere, torus, type HeroModel } from '../models';

/** The bronze mech's colours: warm bronze, green patina, dark iron joints and the Gardeners' teal light-lines. */
export const MECH_COLORS = {
  bronze: '#c8862e',
  bronzeLight: '#e8b060',
  patina: '#5aa88a',
  iron: '#3a3230',
  glass: '#8fe8ff',
  light: '#5ff0d0',
  /** The cannon's muzzle and charge glow, and the jets. */
  glow: '#ffb04a',
};

export interface MechModel extends HeroModel {
  /** Where Jason sits (in the open cockpit in its chest) and where Atalanta sits (on its left shoulder). */
  cockpit: THREE.Group;
  perch: THREE.Group;
  /** The cannon on its right forearm and the glow at its muzzle while a big blast charges. */
  cannon: THREE.Group;
  chargeGlow: THREE.Sprite;
  /** The two back jets (THRUST), and the fists (they swell a little on a punch). */
  jets: THREE.Sprite[];
  fists: THREE.Mesh[];
  /** The Gardeners' light-lines on its chest and the eye, which brighten in the dark and when it powers up. */
  lines: THREE.MeshStandardMaterial;
  visor: THREE.MeshStandardMaterial;
}

/** A row of little glowing leaves: the Gardeners' light-writing engraved on the plates. */
function lightLine(m: THREE.Material, n: number, w: number): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const leaf = mesh(sphere(0.06, 8), m, (i - (n - 1) / 2) * (w / n), 0, 0, false);
    leaf.scale.set(1.6, 0.7, 0.4);
    leaf.rotation.z = i % 2 ? 0.5 : -0.5;
    g.add(leaf);
  }
  return g;
}

/**
 * The Gardeners' bronze mech suit, found asleep in Talos's forge: about twice Jason's height, chunky and
 * friendly. Round bronze body with green patina at the edges, an open glass cockpit in its chest (Jason
 * sits in it), a flat shoulder pad for Atalanta, big fists (the right forearm carries a cannon), two back
 * jets for THRUST, and a little round head with one wide teal eye. The last child of `root` is its shadow.
 */
export function makeMech(): MechModel {
  const C = MECH_COLORS;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const bronze = mat(C.bronze, { rough: 0.35, metal: 0.75 });
  const light = mat(C.bronzeLight, { rough: 0.3, metal: 0.8 });
  const patina = mat(C.patina, { rough: 0.6, metal: 0.3 });
  const iron = mat(C.iron, { rough: 0.6, metal: 0.5 });
  const lines = ownMat(C.light, { emissive: C.light, ei: 1.2 });
  const visor = ownMat('#c8fff4', { emissive: C.light, ei: 1.4 });

  // Legs: thick bronze thighs and shins on iron knee joints, wide flat feet with patina toes.
  const legL = new THREE.Group();
  const legR = new THREE.Group();
  legL.position.set(-0.5, 1.25, 0);
  legR.position.set(0.5, 1.25, 0);
  for (const leg of [legL, legR]) {
    leg.add(mesh(sphere(0.32, 14), iron, 0, 0, 0));
    leg.add(mesh(cyl(0.3, 0.26, 0.55, 14), bronze, 0, -0.32, 0));
    leg.add(mesh(sphere(0.25, 12), iron, 0, -0.66, 0.02));
    leg.add(mesh(boxG(0.36, 0.14, 0.12), light, 0, -0.66, 0.24, false));
    leg.add(mesh(cyl(0.27, 0.34, 0.5, 14), bronze, 0, -0.95, 0));
    const foot = mesh(boxG(0.62, 0.22, 0.86), bronze, 0, -1.14, 0.1);
    leg.add(foot);
    leg.add(mesh(boxG(0.64, 0.12, 0.2), patina, 0, -1.18, 0.5, false));
    body.add(leg);
  }

  // The body: a round bronze barrel with plates, the Gardener light-lines, and a hip skirt.
  body.add(mesh(cyl(0.72, 0.62, 0.5, 18), iron, 0, 1.45, 0));
  const torso = mesh(sphere(0.95, 22), bronze, 0, 2.05, -0.05);
  torso.scale.set(1.12, 0.9, 0.9);
  body.add(torso);
  body.add(mesh(torus(0.86, 0.07), patina, 0, 1.7, -0.05, false).rotateX(Math.PI / 2));
  for (const sx of [-1, 1]) {
    const plate = mesh(boxG(0.5, 0.5, 0.12), light, sx * 0.62, 2.05, 0.66, false);
    plate.rotation.y = sx * 0.45;
    body.add(plate);
    const ll = lightLine(lines, 4, 0.42);
    ll.position.set(sx * 0.62, 1.86, 0.74);
    ll.rotation.y = sx * 0.45;
    body.add(ll);
  }

  // The open cockpit in its chest: a seat, a glass dome over the front and two little control sticks.
  const cockpit = new THREE.Group();
  cockpit.position.set(0, 1.95, 0.32);
  body.add(cockpit);
  body.add(mesh(boxG(0.7, 0.12, 0.5), iron, 0, 1.92, 0.3, false));
  const dome = mesh(new THREE.SphereGeometry(0.62, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: C.glass, transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.1, depthWrite: false }), 0, 2.15, 0.5, false);
  dome.rotation.x = Math.PI / 2 - 0.35;
  body.add(dome);
  body.add(mesh(torus(0.6, 0.05), light, 0, 2.15, 0.5, false).rotateX(-0.35));
  for (const sx of [-0.2, 0.2]) body.add(mesh(cyl(0.03, 0.03, 0.3, 6), iron, sx, 2.05, 0.62, false));

  // The head: a little round dome on top, with one wide teal eye and a leaf crest.
  const head = new THREE.Group();
  head.position.set(0, 2.95, -0.1);
  head.add(mesh(sphere(0.36, 16), bronze, 0, 0, 0));
  head.add(mesh(cyl(0.2, 0.26, 0.2, 12), iron, 0, -0.3, 0));
  const eye = new THREE.Group();
  const lens = mesh(boxG(0.48, 0.12, 0.08), visor, 0, 0.02, 0.32, false);
  eye.add(lens);
  head.add(eye);
  const crest = mesh(cone(0.09, 0.4, 6), patina, 0, 0.42, 0, false);
  crest.scale.set(0.5, 1, 1.4);
  head.add(crest);
  body.add(head);

  // Arms: iron shoulder balls, bronze pauldrons, big fists. Atalanta's perch is the flat left pauldron.
  const armL = new THREE.Group();
  const armR = new THREE.Group();
  armL.position.set(-1.12, 2.35, 0);
  armR.position.set(1.12, 2.35, 0);
  const fists: THREE.Mesh[] = [];
  for (const [arm, sx] of [
    [armL, -1],
    [armR, 1],
  ] as [THREE.Group, number][]) {
    arm.add(mesh(sphere(0.3, 12), iron, 0, 0, 0));
    const pad = mesh(cyl(0.42, 0.46, 0.22, 14), light, sx * 0.05, 0.22, 0);
    arm.add(pad);
    arm.add(mesh(torus(0.44, 0.04), patina, sx * 0.05, 0.12, 0, false).rotateX(Math.PI / 2));
    arm.add(mesh(cyl(0.2, 0.18, 0.55, 12), bronze, 0, -0.38, 0));
    arm.add(mesh(sphere(0.19, 10), iron, 0, -0.7, 0));
    arm.add(mesh(cyl(0.22, 0.26, 0.5, 12), bronze, 0, -0.98, 0));
    const fist = mesh(boxG(0.48, 0.42, 0.48), light, 0, -1.38, 0.02);
    fists.push(fist);
    arm.add(fist);
    arm.add(mesh(boxG(0.5, 0.1, 0.12), patina, 0, -1.26, 0.25, false));
  }
  const perch = new THREE.Group();
  perch.position.set(-0.05, 0.34, 0);
  armL.add(perch);
  // The cannon along the right forearm, pointing down the arm (forward when the arm is raised).
  const cannon = new THREE.Group();
  cannon.position.set(0.3, -0.95, 0);
  cannon.add(mesh(cyl(0.13, 0.15, 0.85, 12), iron, 0, -0.1, 0));
  for (const y of [-0.35, 0.05, 0.25]) cannon.add(mesh(torus(0.15, 0.035), light, 0, y, 0, false).rotateX(Math.PI / 2));
  cannon.add(mesh(cyl(0.08, 0.08, 0.04, 10), mat('#110c08'), 0, -0.53, 0, false));
  armR.add(cannon);
  const chargeGlow = glowSprite(C.glow, 1.4, 0.9);
  chargeGlow.position.set(0.3, -1.6, 0);
  chargeGlow.scale.setScalar(0.001);
  armR.add(chargeGlow);
  body.add(armL, armR);

  // Two back jets, glowing when it THRUSTs (and a little while it walks).
  const jets: THREE.Sprite[] = [];
  for (const sx of [-0.42, 0.42]) {
    body.add(mesh(cyl(0.2, 0.26, 0.5, 12), iron, sx, 2.1, -0.9));
    const j = glowSprite(C.glow, 1.2, 0.9);
    j.position.set(sx, 1.78, -0.95);
    j.scale.setScalar(0.001);
    jets.push(j);
    body.add(j);
  }

  const carry = new THREE.Group();
  carry.position.set(0, 3.8, 0);
  root.add(carry);
  root.add(blobShadow(2.6));
  return { root, body, head, armL, armR, legL, legR, carry, eyes: [eye], cockpit, perch, cannon, chargeGlow, jets, fists, lines, visor };
}
