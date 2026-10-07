import * as THREE from 'three';

import { cone, cyl, glowSprite, mat, mesh, ownMat, sphere, torus, boxG, type BoltModel } from './models';

/**
 * The other droids of chapter 2: IRIS (the rainbow droid from the jungle), the clamp-on armour and
 * control chip Brennus bolts onto LUX, and the snare drone that carries LUX off in the tundra.
 */

/* ---------------- IRIS ---------------- */

export interface IrisModel extends BoltModel {
  fins: THREE.Object3D[];
  halo: THREE.Mesh;
  haloMat: THREE.MeshStandardMaterial;
}

/**
 * IRIS: a slim pearl teardrop with a dark visor band, one rainbow eye that drifts through every
 * colour, two little fin-wings and a glowing halo ring floating over her head.
 */
export function makeIris(): IrisModel {
  const root = new THREE.Group();
  const shell = new THREE.Group();
  root.add(shell);
  const pearl = mat('#eef0fb', { rough: 0.25, metal: 0.25 });
  const lilac = mat('#b9a8e8', { rough: 0.35, metal: 0.35 });
  const glass = mat('#141428', { rough: 0.15, metal: 0.3 });
  // The teardrop: a tall oval with a point underneath.
  const body = mesh(sphere(0.3, 26), pearl);
  body.scale.set(1, 1.18, 0.95);
  shell.add(body);
  const tip = mesh(cone(0.2, 0.36, 18), pearl, 0, -0.42, 0);
  tip.rotation.x = Math.PI;
  shell.add(tip);
  shell.add(mesh(sphere(0.05, 10), lilac, 0, -0.6, 0));
  // A lilac seam around the middle.
  const band = mesh(torus(0.292, 0.026), lilac, 0, -0.1, 0);
  band.rotation.x = Math.PI / 2;
  shell.add(band);
  // The visor: a dark glass strip across the face, with the rainbow eye in it.
  const visor = mesh(sphere(0.31, 24), glass, 0, 0.06, 0.01, false);
  visor.scale.set(0.98, 0.34, 0.98);
  shell.add(visor);
  const iris = ownMat('#ff6fcf', { emissive: '#ff6fcf', ei: 1.8 });
  const eye = mesh(sphere(0.085, 16), iris, 0, 0.06, 0.27, false);
  eye.scale.set(1.5, 0.75, 0.7);
  shell.add(eye);
  shell.add(mesh(sphere(0.026, 8), mat('#ffffff', { emissive: '#ffffff', ei: 1 }), -0.05, 0.09, 0.32, false));
  // The visor shutter that drops for a blink.
  const lid = mesh(sphere(0.315, 20), pearl, 0, 0.13, 0.01, false);
  lid.scale.set(1, 0.05, 1);
  shell.add(lid);
  // Fin-wings, swept back like a little fish.
  const fins: THREE.Object3D[] = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.27, -0.02, -0.05);
    const fin = mesh(boxG(0.3, 0.16, 0.025), lilac, s * 0.14, 0, -0.04);
    fin.rotation.set(0, s * 0.5, s * -0.35);
    pivot.add(fin);
    pivot.add(mesh(sphere(0.045, 10), pearl, 0, 0, 0));
    shell.add(pivot);
    fins.push(pivot);
  }
  // The halo antenna: a thin stalk and a glowing ring floating over her head.
  shell.add(mesh(cyl(0.014, 0.014, 0.16), lilac, 0, 0.42, -0.02));
  const haloMat = ownMat('#ffe9a8', { emissive: '#ffd166', ei: 1.6 });
  const halo = mesh(torus(0.13, 0.018), haloMat, 0, 0.52, -0.02, false);
  halo.rotation.x = Math.PI / 2;
  shell.add(halo);
  const glow = glowSprite('#c9a8ff', 1.3, 0.35);
  glow.position.y = -0.5;
  root.add(glow);
  // A touch smaller than she is drawn, so she sits next to LUX's size.
  shell.scale.setScalar(0.85);
  return { root, shell, iris, glow, lid, fins, halo, haloMat };
}

/** The colour IRIS's eye shows at time t: a slow trip around the rainbow. */
export function rainbow(t: number, out: THREE.Color): THREE.Color {
  return out.setHSL((t * 0.12) % 1, 0.9, 0.62);
}

/* ---------------- LUX under Brennus's control ---------------- */

export interface RogueParts {
  armour: THREE.Group;
  chip: THREE.MeshStandardMaterial;
  chipGlow: THREE.Sprite;
}

/**
 * Bolts Brennus's clamp-on armour onto a LUX model: dark plates with thorny spikes around his
 * middle, a red control chip clamped on his back, and a red eye.
 */
export function armLux(m: BoltModel): RogueParts {
  const armour = new THREE.Group();
  const plate = mat('#2a1e26', { rough: 0.45, metal: 0.6 });
  const red = mat('#a8202a', { emissive: '#ff2a3a', ei: 0.5, rough: 0.4 });
  const ring = mesh(torus(0.38, 0.07), plate, 0, -0.06, 0);
  ring.rotation.x = Math.PI / 2;
  armour.add(ring);
  // Thorny spikes all the way round.
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < 8; i++) {
    // Skip the front one so his eye stays visible.
    if (i === 0) continue;
    const a = (i / 8) * Math.PI * 2;
    const out = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
    const spike = mesh(cone(0.06, 0.24, 6), i % 2 ? red : plate, out.x * 0.46, -0.06, out.z * 0.46);
    spike.quaternion.setFromUnitVectors(up, out);
    armour.add(spike);
  }
  // A clamp over the top of his head, with two more spikes.
  const clamp = mesh(torus(0.3, 0.045), plate, 0, 0.12, -0.04);
  clamp.rotation.y = Math.PI / 2;
  clamp.scale.set(1, 1.15, 1);
  armour.add(clamp);
  for (const s of [-1, 1]) {
    const horn = mesh(cone(0.05, 0.2, 6), red, s * 0.18, 0.42, -0.04);
    horn.rotation.z = -s * 0.5;
    armour.add(horn);
  }
  // The control chip on his back: the weak spot.
  const chip = ownMat('#5a0a14', { emissive: '#ff2a3a', ei: 1.2 });
  armour.add(mesh(boxG(0.24, 0.2, 0.08), plate, 0, 0.02, -0.38));
  armour.add(mesh(boxG(0.16, 0.13, 0.05), chip, 0, 0.02, -0.43, false));
  const chipGlow = glowSprite('#ff3a4c', 0.9, 0.5);
  chipGlow.position.set(0, 0.02, -0.5);
  armour.add(chipGlow);
  m.shell.add(armour);
  m.iris.color.set('#ff2a3a');
  m.iris.emissive.set('#ff2a3a');
  m.glow.material.color.set('#ff3a4c');
  return { armour, chip, chipGlow };
}

/* ---------------- Brennus's snare drone ---------------- */

export interface SnareModel {
  root: THREE.Group;
  rotors: THREE.Object3D[];
  /** The net cage under it; scale.y opens (0) and closes (1) it. */
  cage: THREE.Group;
  eye: THREE.MeshStandardMaterial;
}

/** A black four-rotor drone with a red eye and a cage of red-hot bars hanging under it. */
export function makeSnare(): SnareModel {
  const root = new THREE.Group();
  const dark = mat('#24202e', { rough: 0.4, metal: 0.6 });
  const steel = mat('#5a5470', { rough: 0.35, metal: 0.7 });
  const body = mesh(sphere(0.55, 18), dark);
  body.scale.set(1.3, 0.55, 1.3);
  root.add(body);
  const eye = ownMat('#ff3a4c', { emissive: '#ff3a4c', ei: 2 });
  root.add(mesh(sphere(0.14, 12), eye, 0, -0.08, 0.66, false));
  const rotors: THREE.Object3D[] = [];
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i / 4) * Math.PI * 2;
    const arm = mesh(boxG(1.1, 0.08, 0.12), dark, Math.cos(a) * 0.75, 0.05, Math.sin(a) * 0.75);
    arm.rotation.y = -a;
    root.add(arm);
    const rotor = new THREE.Group();
    rotor.position.set(Math.cos(a) * 1.3, 0.16, Math.sin(a) * 1.3);
    rotor.add(mesh(boxG(0.9, 0.02, 0.1), steel, 0, 0, 0, false));
    rotor.add(mesh(boxG(0.1, 0.02, 0.9), steel, 0, 0, 0, false));
    root.add(rotor);
    rotors.push(rotor);
  }
  // The cage: a ring at the top, red bars down to a ring at the bottom.
  const cage = new THREE.Group();
  const bar = mat('#ff4a5a', { emissive: '#ff2a3a', ei: 0.9, rough: 0.4 });
  const top = mesh(torus(0.55, 0.04), dark, 0, 0, 0);
  top.rotation.x = Math.PI / 2;
  cage.add(top);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    cage.add(mesh(cyl(0.022, 0.022, 1.1, 6), bar, Math.cos(a) * 0.55, -0.55, Math.sin(a) * 0.55, false));
  }
  const bottom = mesh(torus(0.55, 0.04), dark, 0, -1.1, 0);
  bottom.rotation.x = Math.PI / 2;
  cage.add(bottom);
  cage.position.y = -0.35;
  root.add(cage);
  const glow = glowSprite('#ff3a4c', 2, 0.3);
  glow.position.y = -0.9;
  root.add(glow);
  return { root, rotors, cage, eye };
}
