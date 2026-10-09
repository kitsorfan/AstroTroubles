/**
 * Aeëtes's golden rams (Brennus's Last Stand): the little RAMLING robots and THE GOLDEN RAM, his huge
 * war machine. Both are the same chunky cartoon ram: a round body of curly gold "wool" plates, a
 * blocky head with a red visor, two big spiral horns and four stubby legs with dark hooves. The Golden
 * Ram also carries a roaring engine on its back under a hatch that pops open when it crashes.
 */
import * as THREE from 'three';

import { blobShadow, boxG, cone, cyl, glowSprite, mat, mesh, ownMat, sphere, torus } from '../models';
import type { EnemyModel } from '../aliens';

export const RAM_COLORS = {
  gold: '#e8b43a',
  goldLight: '#ffd870',
  goldDark: '#a8761c',
  hoof: '#2a2026',
  visor: '#ff3a4c',
  engine: '#ff9a2a',
  steel: '#8a8f9a',
};

export interface RamParts {
  root: THREE.Group;
  /** Everything but the legs (it bobs and tilts). */
  body: THREE.Group;
  head: THREE.Group;
  legs: THREE.Group[];
  /** The red visor (and the glow behind it), brighter while it paws the ground. */
  visor: THREE.MeshStandardMaterial;
  /** Materials that flash white when it is hit. */
  flash: THREE.MeshStandardMaterial[];
  /** The Golden Ram only: the engine core, its glow, and the two hatch lids that swing open. */
  engine?: THREE.Group;
  core?: THREE.MeshStandardMaterial;
  coreGlow?: THREE.Sprite;
  lids?: THREE.Group[];
}

/** One spiral horn: three shrinking curls, round the side of the head (sx = -1 left, 1 right). */
function horn(sx: number, m: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const curls: [number, number, number, number][] = [
    [0.32, 0.11, 0, 0],
    [0.21, 0.085, 0.04, 0.05],
    [0.11, 0.06, 0.07, 0.09],
  ];
  for (const [r, t, dx, dy] of curls) {
    const c = mesh(torus(r, t), m, dx * sx, dy, 0);
    c.rotation.y = Math.PI / 2;
    c.position.x = sx * (0.06 + dx);
    g.add(c);
  }
  return g;
}

/** Builds a ram. `big` adds the war machine's engine, rivets and Aeëtes's crest. */
export function makeRam(big: boolean): RamParts {
  const C = RAM_COLORS;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const gold = ownMat(C.gold, { metal: 0.75, rough: 0.28, emissive: '#000000' });
  const wool = ownMat(C.goldLight, { metal: 0.6, rough: 0.35, emissive: '#000000' });
  const dark = mat(C.goldDark, { metal: 0.6, rough: 0.4 });
  const hoof = mat(C.hoof, { rough: 0.6, metal: 0.3 });
  const visor = ownMat(C.visor, { emissive: C.visor, ei: 1.6 });
  // The body: a round belly under clusters of curly gold wool plates.
  const belly = mesh(sphere(0.62, 20), gold, 0, 0.95, -0.05);
  belly.scale.set(1, 0.82, 1.3);
  body.add(belly);
  const puffs: [number, number, number, number][] = [
    [0, 1.42, -0.1, 0.36],
    [0.38, 1.3, 0.28, 0.3],
    [-0.38, 1.3, 0.28, 0.3],
    [0.4, 1.28, -0.42, 0.3],
    [-0.4, 1.28, -0.42, 0.3],
    [0, 1.36, 0.42, 0.3],
    [0, 1.3, -0.62, 0.3],
    [0.52, 1.0, -0.05, 0.28],
    [-0.52, 1.0, -0.05, 0.28],
  ];
  for (const [x, y, z, r] of puffs) body.add(mesh(sphere(r, 12), wool, x, y, z));
  // Four stubby legs with dark hooves.
  const legs: THREE.Group[] = [];
  for (const [x, z] of [
    [-0.3, 0.42],
    [0.3, 0.42],
    [-0.3, -0.5],
    [0.3, -0.5],
  ]) {
    const leg = new THREE.Group();
    leg.position.set(x, 0.62, z);
    leg.add(mesh(cyl(0.12, 0.1, 0.5, 10), dark, 0, -0.25, 0));
    leg.add(mesh(cyl(0.14, 0.16, 0.16, 10), hoof, 0, -0.54, 0));
    root.add(leg);
    legs.push(leg);
  }
  // The head: a blocky gold face with a snout, a red visor and two big spiral horns.
  const head = new THREE.Group();
  head.position.set(0, 1.28, 0.78);
  head.add(mesh(boxG(0.56, 0.5, 0.5), gold, 0, 0, 0));
  head.add(mesh(boxG(0.4, 0.3, 0.3), gold, 0, -0.1, 0.32));
  head.add(mesh(sphere(0.04, 8), hoof, -0.09, -0.06, 0.48, false));
  head.add(mesh(sphere(0.04, 8), hoof, 0.09, -0.06, 0.48, false));
  head.add(mesh(boxG(0.5, 0.1, 0.06), visor, 0, 0.1, 0.26, false));
  head.add(glowSprite(C.visor, 0.7, 0.45).translateY(0.1).translateZ(0.3));
  head.add(mesh(sphere(0.2, 12), wool, 0, 0.28, -0.02));
  for (const sx of [-1, 1]) {
    const h = horn(sx, dark);
    h.position.set(sx * 0.3, 0.1, -0.08);
    head.add(h);
    const ear = mesh(cone(0.08, 0.26, 8), gold, sx * 0.34, 0.12, 0.1);
    ear.rotation.z = sx * -1.9;
    head.add(ear);
  }
  body.add(head);
  const flash = [gold, wool];
  const parts: RamParts = { root, body, head, legs, visor, flash };
  if (big) {
    // The engine on its back: a drum with a roaring orange core under two hatch lids.
    const engine = new THREE.Group();
    engine.position.set(0, 1.62, -0.2);
    const steel = mat(C.steel, { metal: 0.8, rough: 0.3 });
    engine.add(mesh(cyl(0.34, 0.38, 0.3, 16), steel, 0, 0, 0));
    const core = ownMat(C.engine, { emissive: C.engine, ei: 0.5 });
    engine.add(mesh(cyl(0.24, 0.24, 0.32, 16), core, 0, 0.02, 0, false));
    // Under the drum, a glowing column that shows once the engine pops up.
    engine.add(mesh(cyl(0.2, 0.26, 0.6, 14), core, 0, -0.42, 0, false));
    const coreGlow = glowSprite(C.engine, 2.4, 0);
    coreGlow.position.y = 0.2;
    engine.add(coreGlow);
    const lids: THREE.Group[] = [];
    for (const sx of [-1, 1]) {
      const hinge = new THREE.Group();
      hinge.position.set(sx * 0.36, 0.17, 0);
      const lid = mesh(boxG(0.36, 0.06, 0.66), gold, -sx * 0.18, 0, 0);
      hinge.add(lid);
      engine.add(hinge);
      lids.push(hinge);
    }
    // Two exhaust pipes behind it, and Aeëtes's gold "A" crest on the forehead.
    for (const sx of [-1, 1]) engine.add(mesh(cyl(0.06, 0.08, 0.5, 10), steel, sx * 0.2, 0.1, -0.42).rotateX(-0.9));
    body.add(engine);
    const crest = new THREE.Group();
    crest.position.set(0, 0.34, 0.27);
    for (const s of [-1, 1]) crest.add(mesh(boxG(0.04, 0.24, 0.03), visor, s * 0.05, 0, 0, false).rotateZ(s * -0.35));
    crest.add(mesh(boxG(0.1, 0.03, 0.03), visor, 0, -0.03, 0, false));
    head.add(crest);
    parts.engine = engine;
    parts.core = core;
    parts.coreGlow = coreGlow;
    parts.lids = lids;
  }
  root.add(blobShadow(big ? 2.2 : 1.8));
  return parts;
}

export const RAMLING_SCALE = 0.62;

/** The little ramling as an enemy model (the shared enemy code flashes it and hangs its badge). */
export function makeRamlingModel(): EnemyModel & { ram: RamParts } {
  const ram = makeRam(false);
  // Knee-high to General Brennus (the Golden Ram is the same model, much bigger).
  ram.root.scale.setScalar(RAMLING_SCALE);
  return { root: ram.root, body: ram.body, flash: ram.flash, parts: { head: ram.head }, limbs: ram.legs, ram };
}
