import * as THREE from 'three';

import { cone, cyl, glowSprite, mat, mesh, ownMat, sphere, torus } from '../models';

/** The Sleepless Dragon's colours: leafy vine-green, pale crystal and minty light-word glow. */
export const DRAGON = {
  body: '#3f8f4a',
  bodyDark: '#2a6a36',
  belly: '#8fd07a',
  crystal: '#9fe8ff',
  violet: '#c9a0ff',
  glow: '#7dffc8',
  eye: '#ffcf4a',
  bark: '#e8e0f4',
};

/** Body segments from the tail tip (0) to the base of the head (SEGS - 1). */
export const SEGS = 30;

export interface DragonModel {
  /** Sits at the centre of the arena, on the floor. Everything else is placed relative to it. */
  root: THREE.Group;
  segs: THREE.Group[];
  radii: number[];
  head: THREE.Group;
  jaw: THREE.Group;
  lids: THREE.Mesh[];
  pupils: THREE.Mesh[];
  eyeMat: THREE.MeshStandardMaterial;
  gemMat: THREE.MeshStandardMaterial;
  spikeMat: THREE.MeshStandardMaterial;
  mouthGlow: THREE.Sprite;
  /** The great crystal tree it curls around. */
  tree: THREE.Group;
  leafMat: THREE.MeshStandardMaterial;
}

/** How thick the body is along its length: a thin tail, a long thick middle, a slightly slimmer neck. */
function radius(i: number): number {
  if (i < 9) return 0.28 + (i / 9) * 0.6;
  if (i < 23) return 0.88;
  return 0.88 - ((i - 23) / (SEGS - 23)) * 0.2;
}

/** The great tree: a pale twisting trunk of living crystal-wood, branches and a canopy of glowing crystals and leaves. */
function makeTree(leafMat: THREE.MeshStandardMaterial): THREE.Group {
  const tree = new THREE.Group();
  const bark = mat(DRAGON.bark, { rough: 0.5, metal: 0.1 });
  const crystal = mat(DRAGON.crystal, { emissive: DRAGON.crystal, ei: 0.6, rough: 0.1 });
  const violet = mat(DRAGON.violet, { emissive: DRAGON.violet, ei: 0.6, rough: 0.1 });
  tree.add(mesh(cyl(1.2, 1.9, 7.5, 12), bark, 0, 3.75, 0));
  // Roots spreading over the lawn.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const root = mesh(cyl(0.18, 0.45, 2.6, 6), bark, Math.cos(a) * 2, 0.3, Math.sin(a) * 2);
    root.rotation.set(Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2);
    tree.add(root);
  }
  // Branches, each tipped with a crystal cluster.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const b = mesh(cyl(0.18, 0.4, 3.4, 7), bark, Math.cos(a) * 1.4, 8, Math.sin(a) * 1.4);
    b.rotation.set(Math.sin(a) * 0.8, 0, -Math.cos(a) * 0.8);
    tree.add(b);
    for (let k = 0; k < 3; k++) {
      const c = mesh(cone(0.3, 1.4 + k * 0.3, 5), i % 2 ? violet : crystal, Math.cos(a) * (2.8 + k * 0.2), 9.2 + k * 0.4, Math.sin(a) * (2.8 + k * 0.2), false);
      c.rotation.set(Math.sin(a + k) * 0.5, 0, -Math.cos(a + k) * 0.5);
      tree.add(c);
    }
  }
  // A canopy of glowing leaves.
  for (let i = 0; i < 14; i++) {
    const a = i * 2.4;
    const r = 1.5 + (i % 4) * 0.9;
    const leaf = mesh(sphere(0.9 + (i % 3) * 0.3, 10), leafMat, Math.cos(a) * r, 9.6 + (i % 3) * 0.7, Math.sin(a) * r, false);
    leaf.scale.y = 0.55;
    tree.add(leaf);
  }
  tree.add(glowSprite(DRAGON.glow, 11, 0.25).translateY(10));
  return tree;
}

/** Builds the dragon: a long serpent of vine and crystal, a horned head, and the tree it guards. */
export function makeDragonModel(): DragonModel {
  const root = new THREE.Group();
  const bodyMat = mat(DRAGON.body, { emissive: '#103a1a', ei: 0.4, rough: 0.6 });
  const darkMat = mat(DRAGON.bodyDark, { rough: 0.8 });
  const spikeMat = ownMat(DRAGON.crystal, { emissive: DRAGON.glow, ei: 0.5, rough: 0.1 });
  const leafMat = ownMat('#ff9ad8', { emissive: '#ff6fcf', ei: 0.5, rough: 0.5 });
  const tree = makeTree(leafMat);
  root.add(tree);
  // The body: a chain of vine-wrapped spheres with crystal spikes along the back.
  const segs: THREE.Group[] = [];
  const radii: number[] = [];
  for (let i = 0; i < SEGS; i++) {
    const r = radius(i);
    radii.push(r);
    const g = new THREE.Group();
    const ball = mesh(sphere(r, 14), bodyMat, 0, 0, 0);
    ball.scale.set(1, 0.92, 1.25);
    g.add(ball);
    if (i % 2 === 0) g.add(mesh(torus(r * 0.98, r * 0.12), darkMat, 0, 0, 0, false));
    if (i % 2 === 1 || i < 9) {
      const spike = mesh(cone(r * 0.32, r * 1.1, 5), spikeMat, 0, r * 1.15, 0, false);
      spike.rotation.x = -0.35;
      g.add(spike);
    }
    if (i === 0) g.add(mesh(cone(0.3, 1.2, 6), spikeMat, 0, 0, -0.7, false).rotateX(-Math.PI / 2));
    segs.push(g);
    root.add(g);
  }
  // The head.
  const head = new THREE.Group();
  head.scale.setScalar(1.6);
  const skull = mesh(sphere(0.85, 18), bodyMat, 0, 0, 0);
  skull.scale.set(1, 0.78, 1.25);
  head.add(skull);
  const snout = mesh(sphere(0.6, 16), bodyMat, 0, -0.08, 0.95);
  snout.scale.set(0.85, 0.62, 1.15);
  head.add(snout);
  const belly = mat(DRAGON.belly, { rough: 0.7 });
  const jaw = new THREE.Group();
  jaw.position.set(0, -0.32, 0.2);
  const jawMesh = mesh(sphere(0.55, 14), belly, 0, -0.05, 0.75);
  jawMesh.scale.set(0.8, 0.32, 1.25);
  jaw.add(jawMesh);
  head.add(jaw);
  const eyeMat = ownMat(DRAGON.eye, { emissive: '#ffb020', ei: 1.6, rough: 0.2 });
  const lids: THREE.Mesh[] = [];
  const pupils: THREE.Mesh[] = [];
  for (const s of [-1, 1]) {
    head.add(mesh(sphere(0.19, 12), eyeMat, s * 0.46, 0.22, 0.72, false));
    const pupil = mesh(sphere(0.07, 8), mat('#1a1208'), s * 0.5, 0.22, 0.88, false);
    head.add(pupil);
    pupils.push(pupil);
    const lid = mesh(sphere(0.23, 12), bodyMat, s * 0.46, 0.3, 0.72, false);
    lid.scale.set(1, 0.25, 1);
    head.add(lid);
    lids.push(lid);
    // Crystal horns, swept back.
    const horn = mesh(cone(0.16, 1.3, 6), spikeMat, s * 0.42, 0.75, -0.35, false);
    horn.rotation.set(-0.9, 0, s * -0.25);
    head.add(horn);
    // Leafy frills at the cheeks.
    const frill = mesh(cone(0.22, 0.9, 5), mat('#5fb35a', { rough: 0.6 }), s * 0.85, 0, -0.1, false);
    frill.rotation.set(0, 0, s * 1.3);
    head.add(frill);
  }
  // A crystal mane down the back of the head.
  for (let k = 0; k < 4; k++) {
    const c = mesh(cone(0.14 - k * 0.02, 0.8 - k * 0.12, 5), spikeMat, 0, 0.62 - k * 0.08, -0.25 - k * 0.32, false);
    c.rotation.x = -0.8;
    head.add(c);
  }
  // The light-word gem on its brow.
  const gemMat = ownMat(DRAGON.glow, { emissive: DRAGON.glow, ei: 1.2, rough: 0.1 });
  head.add(mesh(new THREE.OctahedronGeometry(0.17, 0), gemMat, 0, 0.52, 0.62, false));
  const mouthGlow = glowSprite(DRAGON.crystal, 2.4, 0);
  mouthGlow.position.set(0, -0.2, 1.7);
  head.add(mouthGlow);
  root.add(head);
  return { root, segs, radii, head, jaw, lids, pupils, eyeMat, gemMat, spikeMat, mouthGlow, tree, leafMat };
}
