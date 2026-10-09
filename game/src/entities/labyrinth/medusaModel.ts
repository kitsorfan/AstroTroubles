import * as THREE from 'three';

import { boxG, cyl, glowSprite, mat, mesh, ownMat, sphere, torus } from '../models';
import { cableSnake, LAB } from './gaze';

/**
 * MEDUSA's look: a huge gold mask of a face on a carved stone plinth, with one great green eye (her
 * gaze lens) and a crown of waving cable snakes. The head faces +Z.
 */
export interface MedusaModel {
  root: THREE.Group;
  head: THREE.Group;
  /** The gaze lens: iris material (its glow shows the charge), the lids, and the eye's centre. */
  iris: THREE.MeshStandardMaterial;
  lidTop: THREE.Mesh;
  lidBottom: THREE.Mesh;
  eye: THREE.Group;
  eyeGlow: THREE.Sprite;
  /** Gold of the mask (it flashes when hit), and the cable snakes with their beads. */
  gold: THREE.MeshStandardMaterial;
  snakes: { group: THREE.Group; beads: THREE.Mesh[]; base: THREE.Euler }[];
  /** The knot of snakes she ties over her eye in the second half of the fight (an arrow target). */
  knot: THREE.Group;
  knotRing: THREE.MeshBasicMaterial;
  /** Little stars that circle her while she's dazzled. */
  stars: THREE.Group;
}

/** Height of the gaze lens above the plinth's floor, and the head's size. */
export const MEDUSA_EYE_Y = 4.4;
export const MEDUSA_R = 2;

export function makeMedusaModel(): MedusaModel {
  const root = new THREE.Group();
  const stone = mat(LAB.stone, { rough: 0.9 });
  const dark = mat(LAB.stoneDark, { rough: 0.9 });
  const gold = ownMat('#f0c25a', { metal: 0.75, rough: 0.28, emissive: '#3a2a00', ei: 0.3 });
  const bronze = mat('#a8743a', { metal: 0.7, rough: 0.35 });
  // The plinth: two carved steps and a short column.
  root.add(mesh(cyl(2.6, 2.9, 0.8, 12), dark, 0, 0.4, 0));
  root.add(mesh(cyl(2.1, 2.4, 0.6, 12), stone, 0, 1.1, 0));
  root.add(mesh(cyl(1.2, 1.5, 1.4, 12), stone, 0, 2.1, 0));
  root.add(mesh(torus(2.25, 0.08), mat(LAB.gold, { metal: 0.7, rough: 0.3 }), 0, 1.42, 0, false).rotateX(Math.PI / 2));
  // Green light-runes carved round the plinth.
  const rune = mat('#7dff9a', { emissive: '#7dff9a', ei: 1.4 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const r = mesh(boxG(0.28, 0.28, 0.05), rune, Math.sin(a) * 2.42, 1.1, Math.cos(a) * 2.42, false);
    r.rotation.y = a;
    root.add(r);
  }

  const head = new THREE.Group();
  head.position.y = MEDUSA_EYE_Y;
  root.add(head);
  const face = mesh(sphere(MEDUSA_R, 28), gold, 0, 0, 0);
  face.scale.set(1, 1.12, 0.82);
  head.add(face);
  // A dark band across the brow, high cheeks with gems, a small calm mouth, and a gold crown band.
  const band = mesh(torus(MEDUSA_R * 0.86, 0.12), bronze, 0, 0.75, 0.1, false);
  band.rotation.x = Math.PI / 2 - 0.15;
  head.add(band);
  const gem = mat('#7dff9a', { emissive: '#3dff8a', ei: 1.5, rough: 0.1 });
  for (const sx of [-1, 1]) {
    head.add(mesh(sphere(0.16, 10), gem, sx * 1.05, -0.35, 1.38, false));
    const brow = mesh(boxG(0.9, 0.14, 0.2), bronze, sx * 0.62, 0.62, 1.5, false);
    brow.rotation.z = sx * 0.22;
    head.add(brow);
  }
  const mouth = mesh(new THREE.TorusGeometry(0.4, 0.07, 6, 16, Math.PI), bronze, 0, -1.05, 1.42, false);
  mouth.rotation.z = Math.PI;
  mouth.scale.y = 0.5;
  head.add(mouth);

  // The gaze lens: a big round eye in the middle of the face.
  const eye = new THREE.Group();
  eye.position.set(0, 0.05, 1.42);
  const white = mesh(sphere(0.78, 20), mat('#f2fbf4', { rough: 0.25 }), 0, 0, 0, false);
  white.scale.set(1.15, 0.95, 0.6);
  eye.add(white);
  const iris = ownMat('#5dff9a', { emissive: '#3dff8a', ei: 1.6, rough: 0.15 });
  const irisM = mesh(sphere(0.42, 18), iris, 0, 0, 0.34, false);
  irisM.scale.set(1, 1, 0.45);
  eye.add(irisM);
  const pupil = mesh(boxG(0.12, 0.5, 0.06), mat('#08140c'), 0, 0, 0.53, false);
  eye.add(pupil);
  eye.add(mesh(sphere(0.08, 8), mat('#ffffff', { emissive: '#ffffff', ei: 1 }), -0.16, 0.16, 0.52, false));
  const lidTop = mesh(new THREE.SphereGeometry(0.84, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), gold, 0, 0, 0, false);
  lidTop.scale.set(1.2, 1, 0.66);
  const lidBottom = lidTop.clone();
  lidBottom.rotation.x = Math.PI;
  eye.add(lidTop, lidBottom);
  eye.add(mesh(torus(0.86, 0.09), bronze, 0, 0, 0.05, false));
  const eyeGlow = glowSprite('#7dff9a', 3, 0.3);
  eyeGlow.position.z = 0.7;
  eye.add(eyeGlow);
  head.add(eye);

  // The cable snakes: a crown of them on top and round the back of the head.
  const snakes: MedusaModel['snakes'] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const sn = cableSnake(7, 0.2);
    const base = new THREE.Euler(Math.cos(a) * 0.9 - 0.5, 0, -Math.sin(a) * 0.9);
    sn.group.position.set(Math.sin(a) * 1.25, 1.35 + Math.cos(a) * 0.25, Math.cos(a) * 0.6 - 0.45);
    sn.group.rotation.copy(base);
    head.add(sn.group);
    snakes.push({ group: sn.group, beads: sn.beads, base });
  }

  // The knot: snakes tied in a ball over her eye, with a teal ring that says "shoot here".
  const knot = new THREE.Group();
  knot.position.set(0, 0.1, 2.05);
  const goldC = mat(LAB.gold, { metal: 0.7, rough: 0.3 });
  for (let i = 0; i < 6; i++) {
    const t = mesh(torus(0.62, 0.16), goldC, 0, 0, 0, false);
    t.rotation.set(i * 0.7, i * 1.1, i * 0.4);
    knot.add(t);
  }
  const knotRing = new THREE.MeshBasicMaterial({ color: '#5fe0c8', transparent: true, opacity: 0.9, toneMapped: false, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.12, 32), knotRing);
  ring.position.z = 0.35;
  knot.add(ring);
  knot.add(glowSprite('#5fe0c8', 2.6, 0.5));
  knot.visible = false;
  head.add(knot);

  const stars = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    stars.add(mesh(sphere(0.22, 8), mat('#fff6c0', { emissive: '#ffd166', ei: 2 }), Math.cos(i * 1.26) * 2.6, 0, Math.sin(i * 1.26) * 2.6, false));
  }
  stars.position.y = MEDUSA_R + 0.9;
  stars.visible = false;
  head.add(stars);

  return { root, head, iris, lidTop, lidBottom, eye, eyeGlow, gold, snakes, knot, knotRing, stars };
}
