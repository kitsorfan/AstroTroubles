import * as THREE from 'three';

import { blobShadow, boxG, capsule, cyl, glowSprite, makeFace, mat, mesh, ownMat, sphere, torus, type HeroModel } from '../models';

/** General Brennus's colours: the Legion's olive uniform, gold braid, his red monocle and red gear. */
export const BRENNUS_COLORS = {
  olive: '#5a6a3a',
  oliveDark: '#3a4426',
  gold: '#e8b84a',
  red: '#c8282e',
  skin: '#d9a888',
  grey: '#d4d4dc',
  boots: '#2a2018',
  gloves: '#a8783a',
  /** The cannon's muzzle and charge glow. */
  glow: '#ff9a3a',
  /** Celestia's sprout in its pot. */
  sprout: '#ff8ad8',
};

export interface BrennusModel extends HeroModel {
  /** The arm cannon on his right forearm, its muzzle glow (charging), and the barrel's heat glow. */
  cannon: THREE.Group;
  chargeGlow: THREE.Sprite;
  heat: THREE.MeshStandardMaterial;
  /** The big Legion shield on his left arm. */
  shield: THREE.Group;
  /** Celestia's little sprout in a pot on his belt. */
  sprout: THREE.Group;
  /** The red monocle, which glints brighter in the dark. */
  visor: THREE.MeshStandardMaterial;
}

/** A gear emblem drawn flat, facing +z. */
function gear(r: number, m: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(torus(r * 0.68, r * 0.22), m, 0, 0, 0, false));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const t = mesh(boxG(r * 0.32, r * 0.32, r * 0.2), m, Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92, 0, false);
    t.rotation.z = a;
    g.add(t);
  }
  return g;
}

/**
 * General Brennus, old and sturdy: a broad olive uniform with gold epaulettes and buttons, a peaked
 * cap, a big grey moustache, a scar and a red monocle. A brass arm cannon on his right forearm, the
 * Legion's big shield on his left, leather gloves (good for gardening, too) and Celestia's tiny sprout
 * in a pot on his belt. Taller and wider than Jason, with the same friendly chunky proportions.
 */
export function makeBrennus(): BrennusModel {
  const C = BRENNUS_COLORS;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const olive = mat(C.olive, { rough: 0.65 });
  const dark = mat(C.oliveDark, { rough: 0.7 });
  const gold = mat(C.gold, { rough: 0.3, metal: 0.7 });
  const red = mat(C.red, { emissive: C.red, ei: 0.25, rough: 0.5 });
  const boots = mat(C.boots, { rough: 0.5, metal: 0.2 });
  const gloves = mat(C.gloves, { rough: 0.75 });

  // Legs: olive trousers with a red stripe, tall black boots.
  const legL = new THREE.Group();
  const legR = new THREE.Group();
  legL.position.set(-0.19, 0.7, 0);
  legR.position.set(0.19, 0.7, 0);
  for (const leg of [legL, legR]) {
    leg.add(mesh(capsule(0.15, 0.24), dark, 0, -0.24, 0));
    leg.add(mesh(boxG(0.035, 0.34, 0.035), red, leg === legL ? -0.15 : 0.15, -0.22, 0, false));
    leg.add(mesh(capsule(0.15, 0.14), boots, 0, -0.5, 0.01));
    leg.add(mesh(boxG(0.28, 0.12, 0.42), boots, 0, -0.64, 0.07));
  }
  body.add(legL, legR);

  // Torso: a barrel chest in the olive tunic, gold buttons, a belt with a gold buckle.
  const torso = mesh(capsule(0.4, 0.34), olive, 0, 1.13, 0);
  torso.scale.set(1.05, 1, 0.85);
  body.add(torso);
  for (let i = 0; i < 4; i++) body.add(mesh(sphere(0.035, 8), gold, 0.1, 0.98 + i * 0.12, 0.34 - i * 0.004, false));
  body.add(mesh(cyl(0.42, 0.43, 0.1, 20), mat('#2a2018', { rough: 0.5 }), 0, 0.86, 0));
  body.add(mesh(boxG(0.16, 0.11, 0.05), gold, 0, 0.86, 0.38, false));
  // Medals and his red gear badge on the chest.
  for (const [x, c] of [
    [-0.22, '#ffd166'],
    [-0.13, '#7fd4ff'],
  ] as [number, string][]) {
    body.add(mesh(boxG(0.06, 0.04, 0.03), mat('#c8282e'), x, 1.32, 0.32, false));
    body.add(mesh(cyl(0.035, 0.035, 0.02, 10), mat(c, { metal: 0.6, rough: 0.3 }), x, 1.25, 0.33, false).rotateX(Math.PI / 2));
  }
  const badge = gear(0.07, red);
  badge.position.set(0.2, 1.3, 0.33);
  body.add(badge);
  // Gold epaulettes with fringes.
  for (const sx of [-1, 1]) {
    const ep = mesh(boxG(0.3, 0.06, 0.3), gold, sx * 0.42, 1.52, 0);
    ep.rotation.z = sx * -0.25;
    body.add(ep);
    for (let i = 0; i < 4; i++) body.add(mesh(cyl(0.012, 0.012, 0.1, 4), gold, sx * (0.5 + 0.02 * i), 1.44, -0.1 + i * 0.07, false));
  }
  // Celestia's sprout in a little clay pot on his belt.
  const sprout = new THREE.Group();
  sprout.position.set(-0.36, 0.86, 0.22);
  sprout.add(mesh(cyl(0.09, 0.07, 0.13, 12), mat('#c46a3a', { rough: 0.8 }), 0, 0, 0));
  sprout.add(mesh(cyl(0.08, 0.08, 0.02, 12), mat('#4a2e1a', { rough: 0.9 }), 0, 0.065, 0, false));
  sprout.add(mesh(cyl(0.008, 0.008, 0.12, 4), mat('#3f9a4a'), 0, 0.12, 0, false));
  for (const s of [-1, 1]) {
    const leaf = mesh(sphere(0.04, 8), mat('#5ec86a', { rough: 0.6 }), s * 0.04, 0.15, 0, false);
    leaf.scale.set(1.4, 0.4, 0.8);
    leaf.rotation.z = s * 0.4;
    sprout.add(leaf);
  }
  sprout.add(mesh(sphere(0.03, 8), mat(C.sprout, { emissive: C.sprout, ei: 1.4 }), 0, 0.19, 0, false));
  sprout.add(glowSprite(C.sprout, 0.35, 0.5).translateY(0.19));
  body.add(sprout);

  // Head: an old face with a big grey moustache, bushy brows, a scar and a red monocle; a peaked cap.
  const head = new THREE.Group();
  head.position.set(0, 1.78, 0.02);
  const face = makeFace({ r: 0.3, skin: C.skin, iris: '#4a5a6a', brow: '#c8c8d0' });
  face.group.position.set(0, -0.02, 0.04);
  head.add(face.group);
  const grey = mat(C.grey, { rough: 0.8 });
  for (const sx of [-1, 1]) {
    const tash = mesh(capsule(0.05, 0.12), grey, sx * 0.09, -0.13, 0.27, false);
    tash.rotation.z = sx * 1.2;
    head.add(tash);
    // Grey hair at the sides, under the cap.
    head.add(mesh(sphere(0.1, 10), grey, sx * 0.27, 0.0, -0.05, false));
  }
  head.add(mesh(boxG(0.02, 0.14, 0.02), mat('#b06a5a'), 0.13, 0.06, 0.29, false).rotateZ(0.3));
  const visor = ownMat('#ff3a3a', { emissive: '#ff2a2a', ei: 0.6, rough: 0.1 });
  head.add(mesh(torus(0.08, 0.016), gold, -0.1, 0.0, 0.335, false));
  head.add(mesh(cyl(0.075, 0.075, 0.012, 16), visor, -0.1, 0.0, 0.33, false).rotateX(Math.PI / 2));
  head.add(mesh(cyl(0.004, 0.004, 0.26, 4), gold, -0.16, -0.12, 0.24, false).rotateZ(0.4));
  // The cap: band, crown, peak, gold braid and the red gear badge.
  head.add(mesh(cyl(0.31, 0.3, 0.12, 22), dark, 0, 0.2, 0));
  const crown = mesh(cyl(0.36, 0.31, 0.1, 22), olive, 0, 0.3, -0.02);
  crown.scale.z = 1.08;
  head.add(crown);
  const peak = mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.03, 18, 1, false, -Math.PI / 2, Math.PI),mat('#1e1a14', { rough: 0.3, metal: 0.3 }), 0, 0.15, 0.08);
  peak.rotation.x = 0.2;
  head.add(peak);
  head.add(mesh(torus(0.305, 0.015), gold, 0, 0.17, 0.0, false).rotateX(Math.PI / 2));
  const cap = gear(0.05, red);
  cap.position.set(0, 0.25, 0.31);
  head.add(cap);
  body.add(head);

  // Arms: olive sleeves with gold cuffs and leather gloves; the cannon on the right, the shield on the left.
  const armL = new THREE.Group();
  const armR = new THREE.Group();
  armL.position.set(-0.52, 1.42, 0);
  armR.position.set(0.52, 1.42, 0);
  for (const arm of [armL, armR]) {
    arm.add(mesh(capsule(0.12, 0.3), olive, 0, -0.26, 0));
    arm.add(mesh(cyl(0.13, 0.13, 0.06, 12), gold, 0, -0.42, 0, false));
    arm.add(mesh(sphere(0.13, 12), gloves, 0, -0.55, 0));
  }
  const cannon = new THREE.Group();
  cannon.position.set(0, -0.42, 0.02);
  // Along the forearm: it points down at rest and straight ahead when he aims.
  cannon.rotation.x = Math.PI;
  cannon.scale.setScalar(0.78);
  const brass = mat('#c9a24a', { rough: 0.3, metal: 0.8 });
  cannon.add(mesh(cyl(0.15, 0.17, 0.42, 14), mat('#3a3a32', { rough: 0.5, metal: 0.5 }), 0, 0.12, 0));
  const heat = ownMat('#4a3a30', { emissive: C.glow, ei: 0, rough: 0.4, metal: 0.6 });
  cannon.add(mesh(cyl(0.11, 0.12, 0.34, 14), heat, 0, 0.45, 0));
  for (const y of [0.0, 0.3, 0.6]) cannon.add(mesh(torus(0.15, 0.03), brass, 0, y, 0, false).rotateX(Math.PI / 2));
  cannon.add(mesh(cyl(0.07, 0.07, 0.04, 12), mat('#110c08'), 0, 0.63, 0, false));
  armR.add(cannon);
  const chargeGlow = glowSprite(C.glow, 1, 0.9);
  chargeGlow.position.set(0, -0.95, 0);
  chargeGlow.scale.setScalar(0.001);
  armR.add(chargeGlow);
  const shield = new THREE.Group();
  shield.position.set(-0.08, -0.4, 0.14);
  const plate = mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.08, 6).rotateX(Math.PI / 2).rotateZ(Math.PI / 6), mat(C.oliveDark, { rough: 0.5, metal: 0.4 }), 0, 0, 0);
  plate.scale.set(0.85, 1.1, 1);
  shield.add(plate);
  const rim = mesh(torus(0.45, 0.04), gold, 0, 0, 0.03, false);
  rim.scale.set(0.85, 1.1, 1);
  shield.add(rim);
  const sg = gear(0.16, red);
  sg.position.z = 0.06;
  shield.add(sg);
  shield.rotation.y = -Math.PI / 2;
  armL.add(shield);
  body.add(armL, armR);

  const carry = new THREE.Group();
  carry.position.set(0, 2.6, 0);
  root.add(carry);
  root.add(blobShadow(1.6));
  return { root, body, head, armL, armR, legL, legR, carry, eyes: face.eyes, cannon, chargeGlow, heat, shield, sprout, visor };
}
