import * as THREE from 'three';

import type { EnemyModel } from '../aliens';
import { blobShadow, boxG, cone, cyl, glowSprite, mat, mesh, ownMat, sphere } from '../models';

/** Aeëtes's colours: polished gold with a red thief's eye. */
export const HARPY = {
  gold: '#f2c14e',
  goldDark: '#b8862a',
  eye: '#ff3a4c',
  claw: '#4a3a2a',
};

/**
 * A harpy drone: a gold mechanical bird with a round body, a hooked beak, one red eye, flat metal
 * wings that flap, a fan tail and two grabbing claws (with a sack for the bolts it steals).
 * `scale` makes the big ones (AELLO is built from the same parts).
 */
export function makeHarpyModel(scale = 1): EnemyModel & { wings: THREE.Group[]; claws: THREE.Group[]; sack: THREE.Mesh; eyeMat: THREE.MeshStandardMaterial } {
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.scale.setScalar(scale);
  root.add(body);
  const gold = ownMat(HARPY.gold, { emissive: '#ffb020', ei: 0.08, rough: 0.25, metal: 0.8 });
  const dark = mat(HARPY.goldDark, { rough: 0.35, metal: 0.7 });
  const eyeMat = ownMat(HARPY.eye, { emissive: HARPY.eye, ei: 2 });
  // Body and head.
  const torso = mesh(sphere(0.34, 18), gold, 0, 0, 0);
  torso.scale.set(0.9, 0.85, 1.25);
  body.add(torso);
  body.add(mesh(sphere(0.24, 16), gold, 0, 0.2, 0.36));
  const beak = mesh(cone(0.09, 0.28, 8), dark, 0, 0.13, 0.62);
  beak.rotation.x = Math.PI / 2 + 0.5;
  body.add(beak);
  body.add(mesh(sphere(0.085, 12), eyeMat, 0, 0.26, 0.55, false));
  // A little crest of gold feathers.
  for (let i = 0; i < 3; i++) {
    const f = mesh(boxG(0.04, 0.24, 0.08), dark, (i - 1) * 0.07, 0.46, 0.3 - Math.abs(i - 1) * 0.05);
    f.rotation.x = -0.5;
    f.rotation.z = (i - 1) * 0.3;
    body.add(f);
  }
  // Wings: two flat plates of three feathers each, hinged at the shoulders.
  const wings: THREE.Group[] = [];
  for (const sx of [-1, 1]) {
    const w = new THREE.Group();
    w.position.set(sx * 0.22, 0.1, 0.05);
    for (let i = 0; i < 3; i++) {
      const len = 0.9 - i * 0.18;
      const f = mesh(boxG(len, 0.04, 0.2), i === 0 ? gold : dark, (sx * len) / 2, 0, 0.08 - i * 0.17);
      f.rotation.y = sx * -0.12 * i;
      w.add(f);
    }
    body.add(w);
    wings.push(w);
  }
  // A fan tail.
  for (let i = 0; i < 3; i++) {
    const t = mesh(boxG(0.1, 0.03, 0.42), i === 1 ? gold : dark, (i - 1) * 0.11, 0.02, -0.52);
    t.rotation.y = (i - 1) * 0.35;
    body.add(t);
  }
  // Claws, and the sack the stolen bolts go into.
  const claws: THREE.Group[] = [];
  for (const sx of [-1, 1]) {
    const c = new THREE.Group();
    c.position.set(sx * 0.13, -0.26, 0.08);
    c.add(mesh(cyl(0.03, 0.03, 0.22, 6), dark, 0, -0.1, 0));
    for (const a of [-0.5, 0, 0.5]) {
      const toe = mesh(cone(0.025, 0.14, 5), mat(HARPY.claw), Math.sin(a) * 0.05, -0.24, Math.cos(a) * 0.05);
      toe.rotation.x = Math.PI;
      c.add(toe);
    }
    body.add(c);
    claws.push(c);
  }
  const sack = mesh(sphere(0.2, 12), mat('#8a5a2a', { rough: 0.9 }), 0, -0.48, 0.08);
  sack.visible = false;
  body.add(sack);
  const glow = glowSprite('#ffd166', 1.3, 0.25);
  body.add(glow);
  const shadow = blobShadow(1.2 * scale);
  root.add(shadow);
  return { root, body, flash: [gold], parts: { shadow }, wings, claws, sack, eyeMat };
}
