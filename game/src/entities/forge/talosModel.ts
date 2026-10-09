import * as THREE from 'three';

import { blobShadow, boxG, cone, cyl, glowSprite, mat, mesh, ownMat, sphere, torus } from '../models';

/** Talos's colours: old dark bronze, green patina, the Gardeners' teal light-lines, golden ichor, and Aeëtes's gold crown. */
export const TALOS_COLORS = {
  bronze: '#a8692a',
  bronzeLight: '#d8944a',
  patina: '#4a9a7a',
  iron: '#2e2622',
  ichor: '#ffd04a',
  /** His eye while Aeëtes's crown controls him, and once he is himself again. */
  angry: '#ff3a2a',
  calm: '#5ff0d0',
};

/** One leg: thigh group at the hip, a knee group, an ankle group with the foot. */
export interface TalosLeg {
  hip: THREE.Group;
  knee: THREE.Group;
  ankle: THREE.Group;
}

export interface TalosModel {
  root: THREE.Group;
  /** Everything above the legs (it bobs and leans), with the hips at its origin. */
  hips: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  elbowR: THREE.Group;
  legL: TalosLeg;
  legR: TalosLeg;
  /** The three bronze plates around his right ankle (knocked off by punches). */
  plates: THREE.Mesh[];
  /** The plug in his right heel (it slides out a third at a time), and the glowing ichor vein down that leg. */
  plug: THREE.Group;
  vein: THREE.MeshStandardMaterial;
  /** Aeëtes's gold control crown, and his eye. */
  crown: THREE.Group;
  eye: THREE.MeshStandardMaterial;
  eyeGlow: THREE.Sprite;
  ankleGlow: THREE.Sprite;
  plugGlow: THREE.Sprite;
  shadow: THREE.Mesh;
}

/** Hip height above his feet when he stands. */
export const TALOS_HIP = 4.55;
/** Thigh and shin length. */
export const TALOS_LEG = 2.1;

/**
 * TALOS, the Gardeners' bronze guardian: about three times the mech's height. A barrel chest with the
 * light-word for “keep safe” carved on it, long legs with greaves, a round helmet head with one wide eye
 * and a leaf crest, a great forge hammer in his right hand, and Aeëtes's gold control crown bolted on top.
 * His right ankle wears three armour plates, and in his right heel is the plug that holds in his golden
 * ichor (a glowing vein runs down the back of that leg to it).
 */
export function makeTalos(): TalosModel {
  const C = TALOS_COLORS;
  const root = new THREE.Group();
  const bronze = mat(C.bronze, { rough: 0.45, metal: 0.75 });
  const light = mat(C.bronzeLight, { rough: 0.35, metal: 0.8 });
  const patina = mat(C.patina, { rough: 0.7, metal: 0.25 });
  const iron = mat(C.iron, { rough: 0.6, metal: 0.5 });
  const lines = mat('#bff8ea', { emissive: '#5ff0d0', ei: 1.1 });
  const vein = ownMat(C.ichor, { emissive: C.ichor, ei: 1.6 });
  const plateMat = ownMat(C.bronzeLight, { emissive: '#ffb04a', ei: 0.1, rough: 0.3, metal: 0.85 });

  const hips = new THREE.Group();
  hips.position.y = TALOS_HIP;
  root.add(hips);

  const leg = (sx: number): TalosLeg => {
    const hip = new THREE.Group();
    hip.position.set(sx * 1.35, 0, 0);
    hip.add(mesh(sphere(0.7, 14), iron, 0, 0, 0));
    hip.add(mesh(cyl(0.62, 0.5, TALOS_LEG, 14), bronze, 0, -TALOS_LEG / 2, 0));
    const knee = new THREE.Group();
    knee.position.y = -TALOS_LEG;
    knee.add(mesh(sphere(0.55, 14), iron, 0, 0, 0));
    knee.add(mesh(boxG(0.8, 0.6, 0.3), light, 0, 0, 0.45));
    knee.add(mesh(cyl(0.5, 0.42, TALOS_LEG, 14), bronze, 0, -TALOS_LEG / 2, 0));
    // A greave on the front of the shin, with a patina edge.
    knee.add(mesh(boxG(0.7, 1.5, 0.22), light, 0, -1.05, 0.42));
    knee.add(mesh(boxG(0.74, 0.12, 0.26), patina, 0, -1.8, 0.42, false));
    const ankle = new THREE.Group();
    ankle.position.y = -TALOS_LEG;
    ankle.add(mesh(sphere(0.48, 12), iron, 0, 0, 0));
    const foot = mesh(boxG(1.3, 0.5, 2.1), bronze, 0, -0.1, 0.35);
    ankle.add(foot);
    ankle.add(mesh(boxG(1.34, 0.2, 0.5), patina, 0, -0.2, 1.3, false));
    knee.add(ankle);
    hip.add(knee);
    hips.add(hip);
    return { hip, knee, ankle };
  };
  const legL = leg(-1);
  const legR = leg(1);

  // The right ankle's armour plates, and the plug in the heel (a bronze bolt with a ring to pull).
  const plates: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const a = -0.9 + i * 0.9;
    const p = mesh(boxG(0.7, 0.75, 0.16), plateMat, Math.sin(a) * 0.62, 0.15, Math.cos(a) * 0.62);
    p.rotation.y = a;
    legR.ankle.add(p);
    plates.push(p);
  }
  const plug = new THREE.Group();
  plug.position.set(0, -0.05, -0.75);
  const bolt = mesh(cyl(0.22, 0.26, 0.6, 12), light, 0, 0, -0.1);
  bolt.rotation.x = Math.PI / 2;
  plug.add(bolt);
  const ring = mesh(torus(0.3, 0.07), mat('#ffe08a', { metal: 0.9, rough: 0.2 }), 0, 0, -0.45, false);
  plug.add(ring);
  legR.ankle.add(plug);
  // The ichor vein: a glowing gold line down the back of the right leg.
  legR.hip.add(mesh(cyl(0.09, 0.09, TALOS_LEG, 6), vein, 0, -TALOS_LEG / 2, -0.55, false));
  legR.knee.add(mesh(cyl(0.09, 0.09, TALOS_LEG, 6), vein, 0, -TALOS_LEG / 2, -0.45, false));
  const ankleGlow = glowSprite('#ffd166', 2.6, 0);
  ankleGlow.position.set(0, 0.2, 0);
  legR.ankle.add(ankleGlow);
  const plugGlow = glowSprite(C.ichor, 2.2, 0);
  plugGlow.position.set(0, 0, -0.9);
  legR.ankle.add(plugGlow);

  // Hips and torso: an iron belt, a barrel chest with the Gardeners' carving, broad shoulders.
  hips.add(mesh(cyl(1.6, 1.5, 0.8, 18), iron, 0, 0.2, 0));
  const torso = new THREE.Group();
  torso.position.y = 0.6;
  hips.add(torso);
  const chest = mesh(sphere(2.1, 22), bronze, 0, 1.9, 0);
  chest.scale.set(1.05, 1.0, 0.8);
  torso.add(chest);
  torso.add(mesh(torus(1.9, 0.12), patina, 0, 1.1, 0, false).rotateX(Math.PI / 2));
  torso.add(mesh(boxG(1.6, 1.2, 0.3), light, 0, 2.2, 1.55, false));
  // The carving on the chest: a ring of glowing leaves (“keep safe”).
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const leaf = mesh(sphere(0.12, 8), lines, Math.cos(a) * 0.45, 2.2 + Math.sin(a) * 0.4, 1.72, false);
    leaf.scale.set(1.6, 0.7, 0.4);
    leaf.rotation.z = a;
    torso.add(leaf);
  }
  for (const sx of [-1, 1]) torso.add(mesh(sphere(0.95, 16), light, sx * 2.2, 3.1, 0));

  // The head: a round helmet with a leaf crest and one wide eye; Aeëtes's gold crown bolted on top.
  const head = new THREE.Group();
  head.position.y = 4.35;
  torso.add(head);
  head.add(mesh(cyl(0.55, 0.7, 0.5, 12), iron, 0, -0.35, 0));
  head.add(mesh(sphere(1.05, 18), bronze, 0, 0.35, 0));
  const eye = ownMat('#ffd0c0', { emissive: C.angry, ei: 2.2 });
  head.add(mesh(boxG(1.3, 0.28, 0.2), eye, 0, 0.35, 0.95, false));
  const eyeGlow = glowSprite(C.angry, 2.4, 0.6);
  eyeGlow.position.set(0, 0.35, 1.1);
  head.add(eyeGlow);
  const crest = mesh(cone(0.25, 1.1, 6), patina, 0, 1.45, -0.1);
  crest.scale.set(0.4, 1, 1.6);
  head.add(crest);
  const crown = new THREE.Group();
  crown.position.y = 1.0;
  const gold = mat('#ffd04a', { metal: 0.9, rough: 0.2, emissive: '#ffb020', ei: 0.2 });
  crown.add(mesh(cyl(0.75, 0.8, 0.3, 14), gold, 0, 0, 0));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    crown.add(mesh(cone(0.14, 0.4, 5), gold, Math.cos(a) * 0.68, 0.32, Math.sin(a) * 0.68, false));
  }
  crown.add(mesh(sphere(0.18, 10), mat('#ff3a4c', { emissive: '#ff3a4c', ei: 1.6 }), 0, 0.05, 0.8, false));
  head.add(crown);

  // Arms: the left hand an open fist, the right holding the great forge hammer (head pointing forward when raised).
  const arm = (sx: number) => {
    const a = new THREE.Group();
    a.position.set(sx * 2.6, 3.0, 0);
    a.add(mesh(sphere(0.62, 12), iron, 0, 0, 0));
    a.add(mesh(cyl(0.5, 0.42, 1.9, 12), bronze, 0, -1.0, 0));
    const elbow = new THREE.Group();
    elbow.position.y = -1.95;
    elbow.add(mesh(sphere(0.45, 12), iron, 0, 0, 0));
    elbow.add(mesh(cyl(0.44, 0.5, 1.7, 12), bronze, 0, -0.9, 0));
    elbow.add(mesh(boxG(0.95, 0.85, 0.95), light, 0, -1.95, 0));
    a.add(elbow);
    torso.add(a);
    return { a, elbow };
  };
  const L = arm(-1);
  const R = arm(1);
  const hammer = new THREE.Group();
  hammer.position.set(0, -1.95, 0);
  hammer.add(mesh(cyl(0.16, 0.16, 3.4, 8), iron, 0, 0, 0.9).rotateX(Math.PI / 2));
  hammer.add(mesh(boxG(1.3, 1.1, 1.8), light, 0, 0, 2.7));
  hammer.add(mesh(boxG(1.34, 0.2, 1.84), patina, 0, 0.45, 2.7, false));
  R.elbow.add(hammer);

  const shadow = blobShadow(7);
  root.add(shadow);
  return {
    root,
    hips,
    torso,
    head,
    armL: L.a,
    armR: R.a,
    elbowR: R.elbow,
    legL,
    legR,
    plates,
    plug,
    vein,
    crown,
    eye,
    eyeGlow,
    ankleGlow,
    plugGlow,
    shadow,
  };
}
