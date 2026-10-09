import * as THREE from 'three';

import { blobShadow, boxG, cone, cyl, glowSprite, mat, mesh, ownMat, sphere, torus } from '../models';

/** Aeëtes's colours on Scylla: polished gold over dark bronze, with red work-lights for eyes. */
export const SCYLLA = {
  gold: '#f2c14e',
  bronze: '#6a4a2a',
  dark: '#3a2c22',
  eye: '#ff3a4c',
  joint: '#7fe6ff',
};

/** One of Scylla's six crane arms: two booms, a glowing elbow joint and a claw with a little face. */
export interface ArmModel {
  upper: THREE.Mesh;
  lower: THREE.Mesh;
  elbow: THREE.Group;
  jointMat: THREE.MeshStandardMaterial;
  jointGlow: THREE.Sprite;
  claw: THREE.Group;
  fingers: THREE.Group[];
  eyeMat: THREE.MeshStandardMaterial;
}

export interface ScyllaModel {
  root: THREE.Group;
  /** The cab on top of the neck (turns to watch the heroes). */
  cab: THREE.Group;
  eyeMat: THREE.MeshStandardMaterial;
  goldMat: THREE.MeshStandardMaterial;
  arms: ArmModel[];
  /** Height of the shoulders above the floor. */
  shoulderY: number;
}

const UP = new THREE.Vector3(0, 1, 0);
const tmp = new THREE.Vector3();

/** Stretches a unit-tall cylinder `m` between two points. */
export function stretch(m: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3) {
  tmp.subVectors(b, a);
  const len = tmp.length() || 0.001;
  m.position.copy(a).addScaledVector(tmp, 0.5);
  m.quaternion.setFromUnitVectors(UP, tmp.divideScalar(len));
  m.scale.set(1, len, 1);
}

function makeArm(gold: THREE.MeshStandardMaterial): ArmModel {
  const boom = mat(SCYLLA.bronze, { rough: 0.45, metal: 0.6 });
  const upper = mesh(cyl(0.22, 0.28, 1, 8), gold, 0, 0, 0);
  const lower = mesh(cyl(0.16, 0.22, 1, 8), boom, 0, 0, 0);
  const elbow = new THREE.Group();
  const jointMat = ownMat('#9ab0b8', { emissive: SCYLLA.joint, ei: 0.1, rough: 0.2, metal: 0.7 });
  elbow.add(mesh(sphere(0.42, 14), jointMat, 0, 0, 0));
  elbow.add(mesh(torus(0.42, 0.07), mat(SCYLLA.dark, { metal: 0.6 }), 0, 0, 0, false));
  const jointGlow = glowSprite(SCYLLA.joint, 2.6, 0);
  elbow.add(jointGlow);
  // The claw: a gold wrist with a little "face" (two red lights), and three fingers pointing down.
  const claw = new THREE.Group();
  const wrist = mesh(cyl(0.42, 0.5, 0.5, 10), gold, 0, 0.1, 0);
  claw.add(wrist);
  const eyeMat = ownMat(SCYLLA.eye, { emissive: SCYLLA.eye, ei: 2 });
  for (const sx of [-1, 1]) claw.add(mesh(sphere(0.09, 8), eyeMat, sx * 0.17, 0.22, 0.42, false));
  claw.add(mesh(boxG(0.36, 0.06, 0.05), mat(SCYLLA.dark), 0, 0.02, 0.47, false));
  const fingers: THREE.Group[] = [];
  for (let i = 0; i < 3; i++) {
    const f = new THREE.Group();
    const a = (i / 3) * Math.PI * 2;
    f.position.set(Math.cos(a) * 0.32, -0.1, Math.sin(a) * 0.32);
    f.rotation.y = -a;
    const seg = mesh(boxG(0.14, 0.7, 0.14), mat(SCYLLA.dark, { metal: 0.6, rough: 0.4 }), 0, -0.35, 0);
    const tip = mesh(cone(0.09, 0.3, 6), gold, 0, -0.8, 0);
    tip.rotation.x = Math.PI;
    f.add(seg, tip);
    claw.add(f);
    fingers.push(f);
  }
  return { upper, lower, elbow, jointMat, jointGlow, claw, fingers, eyeMat };
}

/**
 * SCYLLA, Aeëtes's six-armed crane robot: a wide turret base bolted onto the rock, a tall neck, a
 * cab with one big red eye and gold lamps, and six long crane arms (built separately, then posed by
 * the boss every frame). About 6 units tall.
 */
export function makeScyllaModel(): ScyllaModel {
  const root = new THREE.Group();
  const gold = ownMat(SCYLLA.gold, { emissive: '#ffb020', ei: 0.06, rough: 0.28, metal: 0.8 });
  const bronze = mat(SCYLLA.bronze, { rough: 0.45, metal: 0.6 });
  const dark = mat(SCYLLA.dark, { rough: 0.6, metal: 0.4 });
  // Turret base, with rivets and a ring of rust-red hazard paint.
  root.add(mesh(cyl(2.1, 2.4, 0.9, 20), bronze, 0, 0.45, 0));
  root.add(mesh(cyl(1.9, 2.1, 0.3, 20), gold, 0, 1.05, 0));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    root.add(mesh(sphere(0.1, 6), dark, Math.cos(a) * 2.25, 0.75, Math.sin(a) * 2.25, false));
  }
  // The neck: a lattice crane mast.
  root.add(mesh(cyl(0.7, 0.9, 3.4, 8), bronze, 0, 2.9, 0));
  for (let i = 0; i < 4; i++) root.add(mesh(torus(0.82 - i * 0.04, 0.06), gold, 0, 1.6 + i * 0.85, 0, false).rotateX(Math.PI / 2));
  // The cab, where the arms are hinged.
  const cab = new THREE.Group();
  cab.position.y = 4.8;
  const box = mesh(boxG(2.6, 1.5, 2.2), gold, 0, 0.4, 0);
  cab.add(box);
  cab.add(mesh(boxG(2.7, 0.2, 2.3), dark, 0, 1.2, 0));
  const eyeMat = ownMat(SCYLLA.eye, { emissive: SCYLLA.eye, ei: 2.2 });
  cab.add(mesh(sphere(0.42, 16), mat('#1a1418', { rough: 0.2 }), 0, 0.45, 1.05, false));
  cab.add(mesh(sphere(0.3, 14), eyeMat, 0, 0.45, 1.25, false));
  cab.add(mesh(torus(0.45, 0.07), gold, 0, 0.45, 1.12, false));
  // Two gold work-lamps like ears, and a little antenna with a flag of Aeëtes's gold.
  for (const sx of [-1, 1]) {
    cab.add(mesh(cyl(0.16, 0.22, 0.3, 10), dark, sx * 1.05, 1.4, 0.6));
    cab.add(mesh(sphere(0.15, 10), mat('#fff2b0', { emissive: '#ffd166', ei: 1.5 }), sx * 1.05, 1.55, 0.6, false));
  }
  cab.add(mesh(cyl(0.04, 0.04, 1.2, 5), dark, -0.8, 1.9, -0.6));
  cab.add(mesh(boxG(0.5, 0.3, 0.03), gold, -0.55, 2.3, -0.6));
  root.add(cab);
  const arms: ArmModel[] = [];
  for (let i = 0; i < 6; i++) {
    const a = makeArm(gold);
    root.add(a.upper, a.lower, a.elbow, a.claw);
    arms.push(a);
  }
  root.add(blobShadow(6));
  return { root, cab, eyeMat, goldMat: gold, arms, shoulderY: 5.6 };
}
