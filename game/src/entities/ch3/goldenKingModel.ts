import * as THREE from 'three';

import { boxG, capsule, cone, cyl, glowSprite, mat, mesh, ownMat, sphere, torus } from '../models';

/**
 * Models for the game's last boss: Aeëtes (tall and thin, a long gold coat, slicked silver hair, a gold
 * eyepatch screen, rings on every finger and a too-wide smile) on his gold hover-disc; the Golden Fleece
 * (a living cloak of golden curls) on its altar; and the Fleece armour he grows into as the GOLDEN KING
 * (gold plates, a crown, gold vines sprouting from his shoulders, and a glowing seed-core in his chest
 * behind a crystal clasp). Feet at the origin, facing +z, about 2.3 units tall before he grows.
 */

export interface AeetesModel {
  root: THREE.Group;
  /** Everything that tilts and bobs (the man, his armour and cloak). */
  body: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  head: THREE.Group;
  /** The gold hover-disc he rides in phase 1. */
  disc: THREE.Group;
  /** The Fleece worn as a cloak (phase 2 on), the gold armour plates and crown, and the vines. */
  cloak: THREE.Group;
  armour: THREE.Group;
  vines: THREE.Group;
  /** The seed-core in his chest, and the crystal clasp shielding it. */
  coreMat: THREE.MeshStandardMaterial;
  core: THREE.Mesh;
  clasp: THREE.Mesh;
  claspMat: THREE.MeshStandardMaterial;
  /** Materials that flash when hit. */
  flash: THREE.MeshStandardMaterial[];
  rings: THREE.MeshStandardMaterial;
  armourMat: THREE.MeshStandardMaterial;
}

/** A heap of golden curls: the Fleece. `w` x `h` units, curved like a cloak or draped flat. */
export function makeFleece(w = 1.6, h = 1.1, curve = 0.5): THREE.Group {
  const g = new THREE.Group();
  const curl = mat('#ffcf4a', { emissive: '#ffb020', ei: 0.7, metal: 0.55, rough: 0.35 });
  const deep = mat('#e8a828', { emissive: '#ff9a10', ei: 0.5, metal: 0.5, rough: 0.4 });
  const cols = 7;
  const rows = 5;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const u = c / (cols - 1) - 0.5;
      const v = r / (rows - 1);
      const x = u * w;
      const y = -v * h;
      const z = -Math.cos(u * Math.PI) * curve * 0.4 + (r % 2) * 0.03;
      const s = mesh(sphere(0.13 + ((r * 7 + c * 3) % 4) * 0.015, 10), (r + c) % 3 ? curl : deep, x + (r % 2 ? 0.06 : 0), y, z, false);
      s.scale.set(1, 0.85, 0.7);
      g.add(s);
    }
  }
  g.add(glowSprite('#ffd166', Math.max(w, h) * 2.2, 0.45).translateY(-h / 2));
  return g;
}

export function makeAeetes(): AeetesModel {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const coat = ownMat('#d8a830', { metal: 0.6, rough: 0.35 });
  const coatDark = mat('#8a5a18', { metal: 0.5, rough: 0.4 });
  const skin = ownMat('#e8c0a0', { rough: 0.7 });
  const hair = mat('#d8dce6', { metal: 0.6, rough: 0.25 });
  const trousers = mat('#2a1a2a', { rough: 0.6 });
  const rings = ownMat('#fff0a0', { emissive: '#ffd166', ei: 1.6, metal: 0.8, rough: 0.2 });
  const patch = mat('#ffd166', { emissive: '#ff9a10', ei: 1.4, metal: 0.8 });
  // Thin legs and pointy shoes.
  for (const sx of [-1, 1]) {
    body.add(mesh(capsule(0.08, 0.7), trousers, sx * 0.13, 0.5, 0));
    body.add(mesh(cone(0.08, 0.3, 8), coatDark, sx * 0.13, 0.08, 0.1).rotateX(Math.PI / 2));
  }
  // The long gold coat, flaring at the hem, and a high collar.
  body.add(mesh(cyl(0.26, 0.48, 1.2, 20), coat, 0, 0.95, 0));
  body.add(mesh(cyl(0.3, 0.26, 0.5, 20), coat, 0, 1.7, 0));
  body.add(mesh(cyl(0.2, 0.28, 0.25, 16), coatDark, 0, 2.0, -0.04));
  body.add(mesh(boxG(0.06, 1.2, 0.06), coatDark, 0, 1.3, 0.3));
  // Head: long face, slicked silver hair, the gold eyepatch screen and a very wide smile.
  const head = new THREE.Group();
  head.position.set(0, 2.25, 0);
  const face = mesh(sphere(0.2, 18), skin, 0, 0, 0);
  face.scale.set(0.85, 1.15, 0.9);
  head.add(face);
  const slick = mesh(sphere(0.21, 16), hair, 0, 0.08, -0.04);
  slick.scale.set(0.9, 0.85, 1.15);
  head.add(slick);
  head.add(mesh(boxG(0.12, 0.08, 0.04), patch, 0.07, 0.04, 0.17));
  head.add(mesh(sphere(0.025, 8), mat('#1a1018'), -0.07, 0.04, 0.17));
  const smile = mesh(new THREE.TorusGeometry(0.1, 0.014, 6, 16, Math.PI), mat('#5a1a22'), 0, -0.07, 0.15);
  smile.rotation.z = Math.PI;
  head.add(smile);
  body.add(head);
  // Arms, with a glowing ring on every finger.
  const arm = (sx: number) => {
    const a = new THREE.Group();
    a.position.set(sx * 0.34, 1.9, 0);
    a.add(mesh(capsule(0.07, 0.55), coat, 0, -0.32, 0));
    const hand = mesh(sphere(0.08, 10), skin, 0, -0.68, 0);
    a.add(hand);
    for (let i = 0; i < 3; i++) a.add(mesh(torus(0.035, 0.012), rings, (i - 1) * 0.04, -0.7, 0.06, false));
    body.add(a);
    return a;
  };
  const armL = arm(-1);
  const armR = arm(1);
  // His gold hover-disc.
  const disc = new THREE.Group();
  disc.add(mesh(cyl(1.0, 0.7, 0.22, 28), coat, 0, -0.12, 0));
  disc.add(mesh(torus(1.0, 0.05), rings, 0, -0.02, 0, false).rotateX(Math.PI / 2));
  disc.add(glowSprite('#ffd166', 2.6, 0.5).translateY(-0.4));
  root.add(disc);
  // The Fleece armour: the cloak on his back, gold plates, a crown and the seed-core.
  const armourMat = ownMat('#ffd166', { emissive: '#ffa020', ei: 0.4, metal: 0.85, rough: 0.2 });
  const cloak = makeFleece(1.0, 1.6, 0.9);
  cloak.position.set(0, 2.05, -0.32);
  body.add(cloak);
  const armour = new THREE.Group();
  const chest = mesh(sphere(0.36, 16), armourMat, 0, 1.75, 0.04);
  chest.scale.set(1, 0.8, 0.75);
  armour.add(chest);
  for (const sx of [-1, 1]) {
    const pad = mesh(sphere(0.2, 12), armourMat, sx * 0.38, 2.0, 0);
    pad.scale.set(1.2, 0.7, 1);
    armour.add(pad);
    for (let i = 0; i < 3; i++) armour.add(mesh(cone(0.05, 0.22, 6), armourMat, sx * (0.32 + i * 0.07), 2.15 + (i === 1 ? 0.06 : 0), 0));
  }
  for (let i = 0; i < 5; i++) {
    const a = (i - 2) * 0.45;
    armour.add(mesh(cone(0.045, 0.2, 6), armourMat, Math.sin(a) * 0.17, 2.5, Math.cos(a) * 0.17 - 0.02));
  }
  armour.add(mesh(torus(0.18, 0.03), armourMat, 0, 2.42, 0).rotateX(Math.PI / 2));
  body.add(armour);
  const vines = new THREE.Group();
  const vineMat = mat('#e8b030', { emissive: '#ffb020', ei: 0.6, metal: 0.4, rough: 0.4 });
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const v = mesh(cyl(0.035, 0.06, 0.9, 6), vineMat, sx * (0.3 + i * 0.1), 2.3 + i * 0.12, -0.15 - i * 0.1);
      v.rotation.set(-0.5 - i * 0.2, 0, sx * (0.6 + i * 0.25));
      vines.add(v);
      vines.add(mesh(sphere(0.07, 8), vineMat, sx * (0.55 + i * 0.22), 2.6 + i * 0.25, -0.35 - i * 0.2));
    }
  }
  body.add(vines);
  const coreMat = ownMat('#c8ffb0', { emissive: '#7dff9a', ei: 1.4, rough: 0.15 });
  const core = mesh(sphere(0.13, 16), coreMat, 0, 1.75, 0.3, false);
  body.add(core);
  const claspMat = ownMat('#fff6c8', { emissive: '#ffd166', ei: 0.8, metal: 0.3, rough: 0.05 });
  claspMat.transparent = true;
  claspMat.opacity = 0.75;
  const clasp = mesh(new THREE.IcosahedronGeometry(0.24, 0), claspMat, 0, 1.75, 0.32, false);
  body.add(clasp);
  cloak.visible = armour.visible = vines.visible = core.visible = clasp.visible = false;
  return { root, body, armL, armR, head, disc, cloak, armour, vines, coreMat, core, clasp, claspMat, flash: [coat, skin, armourMat], rings, armourMat };
}

/** The stone altar the Fleece lies on, with the Fleece draped over it. Returns the altar and the Fleece. */
export function makeAltar(): { root: THREE.Group; fleece: THREE.Group } {
  const root = new THREE.Group();
  const stone = mat('#d8c8a0', { rough: 0.8 });
  const vein = mat('#ffd166', { emissive: '#ffb020', ei: 0.8, metal: 0.6 });
  root.add(mesh(cyl(1.1, 1.3, 0.35, 8), stone, 0, 0.17, 0));
  root.add(mesh(cyl(0.7, 0.85, 0.5, 8), stone, 0, 0.6, 0));
  root.add(mesh(torus(0.78, 0.04), vein, 0, 0.62, 0, false).rotateX(Math.PI / 2));
  const fleece = makeFleece(1.4, 1.0, 0.2);
  fleece.rotation.x = -Math.PI / 2;
  fleece.position.set(0, 0.9, -0.5);
  root.add(fleece);
  return { root, fleece };
}
