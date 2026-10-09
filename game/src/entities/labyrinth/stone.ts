/**
 * Stone skins (a hero caught by MEDUSA's gaze looks like a grey statue for a moment) and the
 * Gardeners' Mirror Shield that Jason carries from Medusa's Labyrinth on.
 */
import * as THREE from 'three';

import { glowSprite, mat, mesh, ownMat, torus } from '../models';

const STONE = new THREE.MeshStandardMaterial({ color: '#9aa39a', roughness: 0.95, metalness: 0 });
const saved = new WeakMap<THREE.Mesh, THREE.Material | THREE.Material[]>();

/** Turns every mesh of a model to grey stone (`on`), or back to its own colours. */
export function stoneSkin(root: THREE.Object3D, on: boolean) {
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    if (on) {
      if (saved.has(o)) return;
      saved.set(o, o.material);
      o.material = STONE;
    } else {
      const m = saved.get(o);
      if (!m) return;
      o.material = m;
      saved.delete(o);
    }
  });
}

export interface MirrorShieldModel {
  group: THREE.Group;
  /** The polished face: it flashes when a beam bounces off it. */
  face: THREE.MeshStandardMaterial;
  glow: THREE.Sprite;
}

/**
 * The Mirror Shield: a round shield of polished silver-blue Gardener glass in a bronze rim, with a
 * golden sun of light-words in the middle. It faces +Z (Jason holds it out in front of him).
 */
export function makeMirrorShield(): MirrorShieldModel {
  const group = new THREE.Group();
  const bronze = mat('#c8964e', { metal: 0.75, rough: 0.3 });
  const face = ownMat('#e6fbff', { emissive: '#7fe6ff', ei: 0.3, metal: 0.95, rough: 0.04 });
  const disc = mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 28).rotateX(Math.PI / 2), face, 0, 0, 0.03, false);
  const back = mesh(new THREE.SphereGeometry(0.58, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(-Math.PI / 2), bronze, 0, 0, 0, false);
  back.scale.z = 0.25;
  group.add(disc, back, mesh(torus(0.57, 0.05), bronze, 0, 0, 0.03, false));
  // The little golden sun of light-words.
  const sun = mat('#ffe08a', { emissive: '#ffc94a', ei: 1.2 });
  group.add(mesh(new THREE.CircleGeometry(0.12, 16), sun, 0, 0, 0.065, false));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const ray = mesh(new THREE.PlaneGeometry(0.05, 0.14), sun, Math.cos(a) * 0.22, Math.sin(a) * 0.22, 0.065, false);
    ray.rotation.z = a - Math.PI / 2;
    group.add(ray);
  }
  const glow = glowSprite('#bff4ff', 1.8, 0);
  glow.position.z = 0.2;
  group.add(glow);
  return { group, face, glow };
}
