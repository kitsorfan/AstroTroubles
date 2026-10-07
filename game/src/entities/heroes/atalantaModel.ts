import * as THREE from 'three';

import { blobShadow, boxG, capsule, cyl, glowSprite, makeFace, mat, mesh, ownMat, sphere, type HeroModel } from '../models';

/** Atalanta's colours: a teal-and-white scout suit with gold trim, dark auburn hair, green eyes. */
export const ATALANTA_COLORS = {
  teal: '#2fb7a3',
  tealDark: '#1d7a6e',
  white: '#eef3f6',
  gold: '#ffc94a',
  skin: '#c68a5e',
  hair: '#6a2618',
  eyes: '#3f9a4a',
  /** The bowstring and arrows glow this colour. */
  glow: '#8ff8e4',
};

export interface AtalantaModel extends HeroModel {
  /** The bow slung across her back, and the one in her left hand while she shoots. */
  bowBack: THREE.Group;
  bowHand: THREE.Group;
  /** The arrow on the string while she draws. */
  nocked: THREE.Group;
  /** The glowing string (brighter as Blaster Power upgrades the bow). */
  string: THREE.MeshStandardMaterial;
  /** Glow at the arrow tip while a power arrow charges. */
  chargeGlow: THREE.Sprite;
  braid: THREE.Group;
  cape: THREE.Mesh;
  suit: THREE.MeshStandardMaterial;
  /** The light visor band's lens, which glows brighter in dark rooms. */
  visor: THREE.MeshStandardMaterial;
  gearKey: string;
}

/** A recurve bow along local Y (limbs) bulging toward +Z, the string at the back. */
function makeBow(string: THREE.MeshStandardMaterial): THREE.Group {
  const g = new THREE.Group();
  const pts = [
    [0, -0.62, 0.06],
    [0, -0.56, -0.01],
    [0, -0.42, 0.07],
    [0, -0.18, 0.12],
    [0, 0, 0.12],
    [0, 0.18, 0.12],
    [0, 0.42, 0.07],
    [0, 0.56, -0.01],
    [0, 0.62, 0.06],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const limbs = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.028, 6, false);
  g.add(mesh(limbs, mat(ATALANTA_COLORS.white, { rough: 0.35, metal: 0.2 })));
  g.add(mesh(cyl(0.045, 0.045, 0.2, 10), mat(ATALANTA_COLORS.gold, { rough: 0.3, metal: 0.6 }), 0, 0, 0.12));
  for (const y of [-0.42, 0.42]) g.add(mesh(sphere(0.035, 8), mat(ATALANTA_COLORS.gold, { metal: 0.6, rough: 0.3 }), 0, y, 0.075, false));
  g.add(mesh(cyl(0.008, 0.008, 1.12, 4), string, 0, 0, -0.005, false));
  return g;
}

/** An arrow along +Z: a white shaft, a teal glowing head and gold fletching. */
export function makeArrowMesh(): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(cyl(0.018, 0.018, 0.9, 5).rotateX(Math.PI / 2), mat(ATALANTA_COLORS.white, { rough: 0.4 }), 0, 0, 0, false));
  g.add(mesh(new THREE.ConeGeometry(0.05, 0.16, 6).rotateX(Math.PI / 2), mat(ATALANTA_COLORS.glow, { emissive: ATALANTA_COLORS.glow, ei: 1.4 }), 0, 0, 0.5, false));
  for (const r of [0, Math.PI / 2]) {
    const f = mesh(boxG(0.12, 0.004, 0.16), mat(ATALANTA_COLORS.gold, { rough: 0.5 }), 0, 0, -0.38, false);
    f.rotation.z = r;
    g.add(f);
  }
  return g;
}

/**
 * Atalanta, the colony's fastest runner and best archer: about 13, with Jason's chunky friendly
 * proportions, a long braid, a light visor band instead of a helmet, a short cape, running boots and a
 * white-and-gold recurve bow with a glowing string.
 */
export function makeAtalanta(): AtalantaModel {
  const C = ATALANTA_COLORS;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const suit = ownMat(C.teal, { rough: 0.5 });
  const white = mat(C.white, { rough: 0.45 });
  const dark = mat(C.tealDark, { rough: 0.6 });
  const gold = mat(C.gold, { rough: 0.35, metal: 0.5 });

  // Legs: dark teal leggings and white running boots with gold-trimmed soles.
  const legL = new THREE.Group();
  const legR = new THREE.Group();
  legL.position.set(-0.15, 0.62, 0);
  legR.position.set(0.15, 0.62, 0);
  for (const leg of [legL, legR]) {
    leg.add(mesh(capsule(0.12, 0.26), dark, 0, -0.27, 0));
    leg.add(mesh(capsule(0.125, 0.12), white, 0, -0.44, 0.01));
    leg.add(mesh(boxG(0.22, 0.1, 0.34), white, 0, -0.56, 0.06));
    leg.add(mesh(boxG(0.23, 0.04, 0.36), gold, 0, -0.615, 0.06, false));
  }
  body.add(legL, legR);

  // Torso: teal scout suit, a white chest panel, gold belt.
  const torso = mesh(capsule(0.29, 0.3), suit, 0, 0.98, 0);
  torso.scale.set(1, 1, 0.84);
  body.add(torso);
  body.add(mesh(boxG(0.2, 0.26, 0.08), white, 0, 1.05, 0.22));
  body.add(mesh(boxG(0.06, 0.06, 0.04), mat(C.glow, { emissive: C.glow, ei: 1 }), 0.06, 1.1, 0.27, false));
  body.add(mesh(cyl(0.31, 0.31, 0.08, 18), gold, 0, 0.78, 0));
  body.add(mesh(boxG(0.1, 0.09, 0.05), mat(C.white, { metal: 0.3 }), 0, 0.78, 0.29, false));

  // Scarf around the neck and a short cape over the back.
  body.add(mesh(new THREE.TorusGeometry(0.2, 0.07, 8, 20).rotateX(Math.PI / 2), white, 0, 1.3, 0));
  const capeMat = new THREE.MeshStandardMaterial({ color: C.teal, roughness: 0.6, side: THREE.DoubleSide });
  const cape = mesh(new THREE.CylinderGeometry(0.3, 0.42, 0.62, 16, 1, true, Math.PI / 2, Math.PI), capeMat, 0, 1.0, -0.04);
  body.add(cape);
  const capeTrim = mesh(new THREE.TorusGeometry(0.42, 0.018, 4, 20, Math.PI).rotateX(Math.PI / 2).rotateY(Math.PI), gold, 0, 0.69, -0.04, false);
  body.add(capeTrim);

  // The bow across her back, and a little quiver.
  const string = ownMat(C.glow, { emissive: C.glow, ei: 1.2 });
  // Slung flat across her back, limbs from shoulder to hip.
  const bowBack = new THREE.Group();
  const slung = makeBow(string);
  slung.rotation.y = Math.PI / 2;
  bowBack.add(slung);
  bowBack.position.set(0, 1.0, -0.4);
  bowBack.rotation.z = 0.75;
  body.add(bowBack);
  const quiver = new THREE.Group();
  quiver.position.set(0.2, 1.05, -0.36);
  quiver.rotation.z = -0.35;
  quiver.add(mesh(cyl(0.08, 0.07, 0.42, 10), dark, 0, 0, 0));
  quiver.add(mesh(cyl(0.085, 0.085, 0.04, 10), gold, 0, 0.21, 0, false));
  for (const x of [-0.03, 0.03]) quiver.add(mesh(boxG(0.03, 0.12, 0.08), mat(C.gold), x, 0.3, 0, false));
  body.add(quiver);

  // Head: her face, dark auburn hair with a side-swept fringe, a long braid, and the visor band.
  const head = new THREE.Group();
  head.position.set(0, 1.5, 0);
  const face = makeFace({ r: 0.3, skin: C.skin, iris: C.eyes, brow: '#4a1a10' });
  face.group.position.set(0, -0.02, 0.05);
  head.add(face.group);
  const hair = mat(C.hair, { rough: 0.75 });
  const front = Math.PI / 2;
  const win = 1.05;
  const shell = mesh(new THREE.SphereGeometry(0.335, 28, 18, front + win, Math.PI * 2 - win * 2), hair, 0, 0.02, 0.02);
  head.add(shell);
  head.add(mesh(new THREE.SphereGeometry(0.336, 24, 10, 0, Math.PI * 2, 0, 0.95), hair, 0, 0.02, 0.02));
  const fringe = mesh(sphere(0.22, 14), hair, 0.07, 0.21, 0.17, false);
  fringe.scale.set(1.4, 0.45, 0.85);
  fringe.rotation.z = -0.25;
  head.add(fringe);
  const braid = new THREE.Group();
  braid.position.set(0, -0.08, -0.3);
  for (let i = 0; i < 6; i++) {
    const r = 0.085 - i * 0.007;
    braid.add(mesh(sphere(r, 10), hair, (i % 2 ? 1 : -1) * 0.02, -0.12 * i, -0.02 * i, false));
  }
  braid.add(mesh(cyl(0.05, 0.05, 0.04, 10), gold, 0, -0.72, -0.12, false));
  const tuft = mesh(sphere(0.06, 8), hair, 0, -0.8, -0.13, false);
  tuft.scale.set(1, 1.5, 1);
  braid.add(tuft);
  head.add(braid);
  head.add(mesh(new THREE.TorusGeometry(0.338, 0.026, 6, 32).rotateX(Math.PI / 2), white, 0, 0.17, 0.02, false));
  const visor = ownMat(C.glow, { emissive: C.glow, ei: 0.5 });
  visor.transparent = true;
  visor.opacity = 0.75;
  head.add(mesh(new THREE.SphereGeometry(0.348, 20, 4, front - 0.7, 1.4, 0.98, 0.16), visor, 0, 0.02, 0.02, false));
  body.add(head);

  // Arms: teal sleeves, white gloves; the left hand holds the bow while she shoots.
  const armL = new THREE.Group();
  const armR = new THREE.Group();
  armL.position.set(-0.38, 1.16, 0);
  armR.position.set(0.38, 1.16, 0);
  for (const arm of [armL, armR]) {
    arm.add(mesh(capsule(0.095, 0.24), suit, 0, -0.22, 0));
    arm.add(mesh(cyl(0.1, 0.1, 0.05, 10), gold, 0, -0.34, 0, false));
    arm.add(mesh(sphere(0.115, 12), white, 0, -0.44, 0));
  }
  const bowHand = makeBow(string);
  bowHand.position.set(0, -0.46, 0.02);
  // Upright when the arm is raised, canted a little like an archer's.
  bowHand.rotation.set(Math.PI / 2, 0, 0.3);
  bowHand.visible = false;
  armL.add(bowHand);
  const nocked = makeArrowMesh();
  nocked.visible = false;
  root.add(nocked);
  const chargeGlow = glowSprite(C.glow, 0.9, 0.9);
  chargeGlow.scale.setScalar(0.001);
  root.add(chargeGlow);
  body.add(armL, armR);

  const carry = new THREE.Group();
  carry.position.set(0, 2.35, 0);
  root.add(carry);

  root.add(blobShadow(1.3));
  return { root, body, head, armL, armR, legL, legR, carry, eyes: face.eyes, bowBack, bowHand, nocked, string, chargeGlow, braid, cape, suit, visor, gearKey: '' };
}

/** Blaster Power makes her bowstring and arrowheads glow brighter and golder. */
export function dressAtalanta(m: AtalantaModel, power: number) {
  const key = String(power);
  if (key === m.gearKey) return false;
  m.gearKey = key;
  const c = new THREE.Color(ATALANTA_COLORS.glow).lerp(new THREE.Color(ATALANTA_COLORS.gold), Math.min(1, power / 4));
  m.string.color.copy(c);
  m.string.emissive.copy(c);
  m.string.emissiveIntensity = 1.2 + power * 0.35;
  return true;
}
