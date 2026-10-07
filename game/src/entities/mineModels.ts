import * as THREE from 'three';

import { boxG, cyl, glowSprite, mat, mesh, sphere, torus } from './models';
import { gearEmblem } from './robotModels';

/**
 * Moving platforms dressed for Aeëtes's Mine: ore carts on rails, and General Brennus's old Legion
 * hauler robots (flying decks that carry him over a gap once he gives the order). The deck's top is at
 * y = 0, like every moving platform; `hw` is half its width.
 */

/** A rusty-gold ore cart: Brennus rides standing in its tub. Some gold nuggets roll around the corners. */
export function makeOreCart(hw: number): THREE.Group {
  const g = new THREE.Group();
  const iron = mat('#5a4a3e', { rough: 0.6, metal: 0.5 });
  const trim = mat('#c9a24a', { rough: 0.35, metal: 0.75 });
  const dark = mat('#2a2420', { rough: 0.7, metal: 0.4 });
  g.add(mesh(boxG(hw * 2, 0.3, hw * 2), iron, 0, -0.15, 0));
  // Low tub walls (they never block: the platform's collider is just the floor).
  for (const s of [-1, 1]) {
    g.add(mesh(boxG(hw * 2, 0.42, 0.1), iron, 0, 0.18, s * (hw - 0.05)));
    g.add(mesh(boxG(0.1, 0.42, hw * 2), iron, s * (hw - 0.05), 0.18, 0));
    g.add(mesh(boxG(hw * 2 + 0.06, 0.06, 0.14), trim, 0, 0.4, s * (hw - 0.05), false));
    g.add(mesh(boxG(0.14, 0.06, hw * 2 + 0.06), trim, s * (hw - 0.05), 0.4, 0, false));
  }
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const wheel = mesh(cyl(0.28, 0.28, 0.14, 12), dark, sx * (hw - 0.25), -0.4, sz * (hw * 0.6));
      wheel.rotation.z = Math.PI / 2;
      g.add(wheel);
    }
  }
  const gold = mat('#ffc94a', { emissive: '#a86a08', ei: 0.5, metal: 0.8, rough: 0.25 });
  for (const [x, z] of [
    [-0.55, -0.6],
    [0.6, -0.5],
    [0.55, 0.62],
  ]) {
    g.add(mesh(sphere(0.12, 8), gold, x * hw, 0.08, z * hw, false));
  }
  g.add(mesh(sphere(0.12, 10), mat('#fff0b0', { emissive: '#ffd166', ei: 2 }), 0, 0.2, hw - 0.05, false));
  return g;
}

/** A pair of rails with sleepers from `a` to `b` (world positions of the deck top), hung below the cart's wheels. */
export function railSegment(a: THREE.Vector3, b: THREE.Vector3): THREE.Group {
  const g = new THREE.Group();
  const d = b.clone().sub(a);
  const len = Math.hypot(d.x, d.z);
  if (len < 0.01) return g;
  const steel = mat('#8a8a90', { rough: 0.3, metal: 0.8 });
  const wood = mat('#6a4a2e', { rough: 0.85 });
  g.position.copy(a).add(b).multiplyScalar(0.5);
  g.position.y -= 0.7;
  g.rotation.y = Math.atan2(d.x, d.z);
  g.rotation.x = -Math.atan2(d.y, len);
  for (const s of [-0.55, 0.55]) g.add(mesh(boxG(0.08, 0.1, len + 0.2), steel, s, 0, 0, false));
  for (let k = -len / 2; k <= len / 2; k += 0.9) g.add(mesh(boxG(1.5, 0.08, 0.26), wood, 0, -0.08, k, false));
  return g;
}

/**
 * One of Brennus's old Legion haulers: a flat olive deck with a brass rim, four thruster pods glowing
 * underneath and a little robot head at the front with a lens (red while it waits, green on the move).
 */
export function makeHauler(hw: number): { group: THREE.Group; lens: THREE.MeshStandardMaterial } {
  const g = new THREE.Group();
  const olive = mat('#4a5632', { rough: 0.55, metal: 0.35 });
  const brass = mat('#c9a24a', { rough: 0.3, metal: 0.8 });
  const dark = mat('#20261a', { rough: 0.6, metal: 0.4 });
  g.add(mesh(boxG(hw * 2, 0.36, hw * 2), olive, 0, -0.18, 0));
  g.add(mesh(boxG(hw * 2 + 0.08, 0.1, hw * 2 + 0.08), brass, 0, -0.06, 0));
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const pod = new THREE.Group();
      pod.position.set(sx * (hw - 0.2), -0.5, sz * (hw - 0.2));
      pod.add(mesh(cyl(0.3, 0.22, 0.3, 12), dark, 0, 0, 0));
      pod.add(mesh(torus(0.3, 0.05), brass, 0, 0.05, 0, false).rotateX(Math.PI / 2));
      pod.add(glowSprite('#ff9a3a', 1.4, 0.7).translateY(-0.35));
      g.add(pod);
    }
  }
  const emblem = gearEmblem(0.28, mat('#c8282e', { emissive: '#c8282e', ei: 0.5 }));
  emblem.rotation.x = -Math.PI / 2;
  emblem.position.y = 0.01;
  g.add(emblem);
  // The robot's head at the front edge: a dome with one big lens.
  const lens = new THREE.MeshStandardMaterial({ color: '#ff3a3a', emissive: '#ff3a3a', emissiveIntensity: 1.6 });
  const head = new THREE.Group();
  head.position.set(0, -0.15, hw + 0.2);
  head.add(mesh(sphere(0.32, 14), olive, 0, 0, 0));
  head.add(mesh(sphere(0.13, 12), lens, 0, 0.02, 0.26, false));
  head.add(mesh(torus(0.14, 0.03), brass, 0, 0.02, 0.28, false));
  g.add(head);
  return { group: g, lens };
}
