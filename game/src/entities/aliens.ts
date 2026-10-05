import * as THREE from 'three';

import { blobShadow, boxG, capsule, cone, cyl, glowSprite, mat, mesh, ownMat, sphere, torus } from './models';

/**
 * GaScu-infected creatures and robots: dark armour, glowing weak spots and eyes, and silhouettes that
 * read as dangerous from the camera's height.
 */

export interface EnemyModel {
  root: THREE.Group;
  body: THREE.Group;
  /** Materials that flash white when hit. */
  flash: THREE.MeshStandardMaterial[];
  parts: Record<string, THREE.Object3D>;
  limbs?: THREE.Object3D[];
  mats?: Record<string, THREE.MeshStandardMaterial>;
}

const Y = new THREE.Vector3(0, 1, 0);

/** A capsule stretched between two points: legs, arms, stingers. */
function limb(parent: THREE.Object3D, from: [number, number, number], to: [number, number, number], r: number, m: THREE.Material) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const d = b.clone().sub(a);
  const len = d.length();
  const me = mesh(capsule(r, Math.max(0.01, len - r * 2)), m);
  me.position.copy(a).addScaledVector(d, 0.5);
  me.quaternion.setFromUnitVectors(Y, d.normalize());
  parent.add(me);
  return me;
}

/** A spike pointing along a direction. */
function spike(parent: THREE.Object3D, at: [number, number, number], dir: [number, number, number], r: number, h: number, m: THREE.Material) {
  const me = mesh(cone(r, h, 6), m);
  const d = new THREE.Vector3(...dir).normalize();
  me.quaternion.setFromUnitVectors(Y, d);
  me.position.set(at[0] + (d.x * h) / 2, at[1] + (d.y * h) / 2, at[2] + (d.z * h) / 2);
  parent.add(me);
  return me;
}

const glowMat = (c: string, ei = 2.2) => mat(c, { emissive: c, ei, rough: 0.3 });

/* ---------------- crawler (sporeling) ---------------- */

const CRAWLER: Record<string, [string, string]> = {
  default: ['#2a1633', '#ff3fd0'],
  frost: ['#1a2838', '#7fe6ff'],
  magma: ['#2c1308', '#ff7a1a'],
  goo: ['#2a0f22', '#ff5fa8'],
  toxic: ['#172510', '#9dff3a'],
};

/** Six-legged spore crawler with a glowing abdomen, a cluster of eyes and snapping mandibles. */
export function makeSporeling(variant = 'default'): EnemyModel {
  const [shellC, glowC] = CRAWLER[variant] ?? CRAWLER.default;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const shell = ownMat(shellC, { emissive: glowC, ei: 0.05, rough: 0.32, metal: 0.25 });
  const plate = mat(new THREE.Color(shellC).multiplyScalar(1.6).getStyle(), { rough: 0.4, metal: 0.3 });
  const glow = glowMat(glowC);
  const abdomen = mesh(sphere(0.5, 20), shell, 0, 0.62, -0.28);
  abdomen.scale.set(1, 0.72, 1.15);
  body.add(abdomen);
  for (let i = 0; i < 3; i++) {
    const band = mesh(torus(0.42 - i * 0.07, 0.035), glow, 0, 0.66 + i * 0.05, -0.28 - i * 0.18, false);
    band.rotation.x = Math.PI / 2 + 0.25;
    band.scale.set(1, 1.1, 1);
    body.add(band);
  }
  body.add(mesh(sphere(0.12, 10), glow, 0.18, 0.95, -0.4, false), mesh(sphere(0.09, 10), glow, -0.2, 0.9, -0.5, false));
  const head = mesh(sphere(0.33, 18), plate, 0, 0.55, 0.3);
  head.scale.set(1.1, 0.78, 1);
  body.add(head);
  const eye = glowMat('#ff2a3a', 2.6);
  for (const [x, y, z, r] of [
    [0.1, 0.66, 0.58, 0.065],
    [-0.1, 0.66, 0.58, 0.065],
    [0.21, 0.6, 0.52, 0.045],
    [-0.21, 0.6, 0.52, 0.045],
  ] as const) {
    body.add(mesh(sphere(r, 8), eye, x, y, z, false));
  }
  for (const sx of [-1, 1]) {
    const m = spike(body, [sx * 0.12, 0.42, 0.55], [sx * -0.35, -0.25, 1], 0.05, 0.32, plate);
    m.castShadow = false;
  }
  for (let i = 0; i < 4; i++) spike(body, [0, 0.95 - i * 0.06, -0.05 - i * 0.18], [0, 1, -0.6], 0.06, 0.28 - i * 0.03, plate);
  const legs: THREE.Object3D[] = [];
  for (let i = 0; i < 6; i++) {
    const sx = i % 2 ? 1 : -1;
    const z = 0.25 - Math.floor(i / 2) * 0.28;
    const leg = new THREE.Group();
    leg.position.set(sx * 0.25, 0.5, z);
    limb(leg, [0, 0, 0], [sx * 0.38, 0.28, z * 0.3], 0.045, plate);
    limb(leg, [sx * 0.38, 0.28, z * 0.3], [sx * 0.62, -0.5, z * 0.6], 0.035, shell);
    body.add(leg);
    legs.push(leg);
  }
  root.add(blobShadow(1.5));
  return { root, body, flash: [shell], parts: { head }, limbs: legs };
}

/* ---------------- goo blob (King Bloblin) ---------------- */

/** Wobbling goo with a dark nucleus, a grinning maw and glowing eyes. */
export function makeGooBlob(scale = 1): EnemyModel {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const goo = ownMat('#c02a7a', { emissive: '#ff3fa8', ei: 0.35, rough: 0.12, metal: 0.05 });
  goo.transparent = true;
  goo.opacity = 0.82;
  const blob = mesh(sphere(0.55, 24), goo, 0, 0.5, 0);
  blob.scale.set(1, 0.88, 1);
  body.add(blob);
  body.add(mesh(sphere(0.24, 14), mat('#1a0612', { rough: 0.5 }), 0, 0.5, -0.05, false));
  const bubble = glowMat('#ffb0e0', 1.2);
  body.add(mesh(sphere(0.07, 8), bubble, 0.25, 0.75, 0.1, false), mesh(sphere(0.05, 8), bubble, -0.3, 0.6, -0.2, false), mesh(sphere(0.06, 8), bubble, 0.05, 0.85, -0.3, false));
  const eye = glowMat('#ffe14a', 2.6);
  body.add(mesh(sphere(0.07, 8), eye, 0.17, 0.66, 0.45, false), mesh(sphere(0.07, 8), eye, -0.17, 0.66, 0.45, false));
  const mouth = mesh(torus(0.2, 0.05), mat('#1a0612'), 0, 0.42, 0.47, false);
  mouth.scale.set(1.3, 0.5, 1);
  body.add(mouth);
  const tooth = mat('#f4e8d8', { rough: 0.4 });
  for (let i = 0; i < 6; i++) {
    const t = mesh(cone(0.035, 0.12, 5), tooth, -0.2 + i * 0.08, 0.46, 0.5, false);
    t.rotation.x = Math.PI;
    body.add(t);
  }
  root.add(blobShadow(1.4));
  root.scale.setScalar(scale);
  return { root, body, flash: [goo], parts: { blob } };
}

/* ---------------- maw plant (snapper) ---------------- */

/** A carnivorous alien plant: hinged jaws ringed with fangs and a glowing gullet. */
export function makeSnapper(): EnemyModel {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const stem = ownMat('#1d2a14', { emissive: '#9dff3a', ei: 0.04, rough: 0.5 });
  const flesh = ownMat('#4a0f1c', { emissive: '#ff2a50', ei: 0.08, rough: 0.35 });
  const thorn = mat('#0e140a', { rough: 0.6 });
  const fang = mat('#efe6d2', { rough: 0.35 });
  const gullet = glowMat('#ffd14a', 2.2);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const l = spike(root, [Math.cos(a) * 0.2, 0.05, Math.sin(a) * 0.2], [Math.cos(a), 0.35, Math.sin(a)], 0.14, 1.0, stem);
    l.scale.x = 0.5;
  }
  const trunk = mesh(cyl(0.11, 0.18, 1.3, 10), stem, 0, 0.62, 0);
  body.add(trunk);
  for (let i = 0; i < 6; i++) {
    const a = i * 2.1;
    spike(body, [Math.cos(a) * 0.12, 0.3 + i * 0.16, Math.sin(a) * 0.12], [Math.cos(a), 0.4, Math.sin(a)], 0.035, 0.22, thorn);
  }
  const head = new THREE.Group();
  head.position.y = 1.35;
  body.add(head);
  const jaw = (up: boolean) => {
    const g = new THREE.Group();
    g.position.set(0, 0, -0.32);
    const shell = mesh(new THREE.SphereGeometry(0.55, 20, 10, 0, Math.PI * 2, up ? 0 : Math.PI / 2, Math.PI / 2), flesh, 0, 0, 0.32);
    shell.scale.set(1, up ? 0.62 : 0.45, 1.15);
    g.add(shell);
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * 0.08 + (i / 8) * Math.PI * 0.84;
      const t = mesh(cone(0.045, up ? 0.22 : 0.18, 5), fang, Math.cos(a) * 0.5, up ? -0.02 : 0.02, 0.32 + Math.sin(a) * 0.56, false);
      if (up) t.rotation.x = Math.PI;
      g.add(t);
    }
    for (let i = 0; i < 3; i++) g.add(mesh(sphere(0.06, 8), glowMat('#ff4f7a', 1.6), (i - 1) * 0.28, up ? 0.28 : -0.2, 0.2 + (i % 2) * 0.2, false));
    head.add(g);
    return g;
  };
  const top = jaw(true);
  const bottom = jaw(false);
  head.add(mesh(sphere(0.26, 12), gullet, 0, 0, 0.08, false));
  root.add(blobShadow(1.5));
  return { root, body, flash: [flesh, stem], parts: { head, jawTop: top, jawBottom: bottom } };
}

/* ---------------- stinger wasp (buzzer) ---------------- */

/** An armoured wasp with compound eyes, a striped abdomen and a glowing stinger. */
export function makeBuzzer(): EnemyModel {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const shell = ownMat('#1e1a26', { emissive: '#ffcf3a', ei: 0.04, rough: 0.3, metal: 0.35 });
  const stripe = glowMat('#ffcf3a', 1.8);
  const eye = glowMat('#ff2a3a', 2.4);
  body.add(mesh(sphere(0.28, 16), shell, 0, 0, 0.05));
  const head = mesh(sphere(0.22, 14), shell, 0, 0.04, 0.38);
  body.add(head);
  body.add(mesh(sphere(0.11, 10), eye, 0.13, 0.08, 0.48, false), mesh(sphere(0.11, 10), eye, -0.13, 0.08, 0.48, false));
  for (const sx of [-1, 1]) limb(body, [sx * 0.08, 0.2, 0.46], [sx * 0.22, 0.48, 0.62], 0.015, shell);
  const abdomen = new THREE.Group();
  abdomen.position.set(0, -0.08, -0.25);
  abdomen.rotation.x = 0.45;
  const belly = mesh(sphere(0.3, 16), shell, 0, 0, -0.3);
  belly.scale.set(0.85, 0.85, 1.6);
  abdomen.add(belly);
  for (let i = 0; i < 3; i++) {
    const r = mesh(torus(0.25 - Math.abs(i - 1) * 0.05, 0.03), stripe, 0, 0, -0.18 - i * 0.2, false);
    abdomen.add(r);
  }
  const stinger = mesh(cone(0.06, 0.4, 8), glowMat('#ff4f7a', 2), 0, 0, -0.95, false);
  stinger.rotation.x = -Math.PI / 2;
  abdomen.add(stinger);
  body.add(abdomen);
  for (let i = 0; i < 3; i++) {
    for (const sx of [-1, 1]) limb(body, [sx * 0.12, -0.15, 0.1 - i * 0.12], [sx * 0.3, -0.5, 0.05 - i * 0.15], 0.02, shell);
  }
  const wingMat = new THREE.MeshStandardMaterial({ color: '#bfe8ff', emissive: '#7fcfff', emissiveIntensity: 0.4, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide });
  const wings: THREE.Object3D[] = [];
  for (const sx of [-1, 1]) {
    const w = new THREE.Group();
    w.position.set(sx * 0.12, 0.22, 0.05);
    for (const [len, z] of [
      [0.85, 0.05],
      [0.6, -0.18],
    ] as const) {
      const blade = new THREE.Mesh(boxG(len, 0.01, 0.2), wingMat);
      blade.position.set((sx * len) / 2, 0, z);
      w.add(blade);
    }
    body.add(w);
    wings.push(w);
  }
  const shadow = blobShadow(1.1);
  root.add(shadow);
  return { root, body, flash: [shell], parts: { rotorL: wings[0], rotorR: wings[1], shadow } };
}

/* ---------------- warden bot (sentry) ---------------- */

/** A heavy security robot on treads: armour plates, twin blasters and a scanning visor slit. */
export function makeSentry(): EnemyModel {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const armour = ownMat('#3a3f48', { emissive: '#ff3040', ei: 0.02, rough: 0.35, metal: 0.7 });
  const dark = mat('#16181d', { rough: 0.7, metal: 0.4 });
  const red = mat('#8a1c26', { rough: 0.45, metal: 0.4 });
  for (const sx of [-1, 1]) {
    body.add(mesh(boxG(0.34, 0.42, 1.1), dark, sx * 0.44, 0.21, 0));
    for (let i = 0; i < 4; i++) body.add(mesh(cyl(0.1, 0.1, 0.36, 10), mat('#2a2d33', { metal: 0.6 }), sx * 0.44, 0.2, -0.38 + i * 0.25).rotateZ(Math.PI / 2));
  }
  body.add(mesh(boxG(1.0, 0.62, 0.9), armour, 0, 0.78, 0));
  body.add(mesh(boxG(1.04, 0.12, 0.94), red, 0, 0.98, 0));
  for (const sx of [-1, 1]) {
    const pad = mesh(boxG(0.32, 0.3, 0.7), armour, sx * 0.62, 1.12, -0.02);
    pad.rotation.z = sx * -0.35;
    body.add(pad);
    body.add(mesh(cyl(0.07, 0.07, 0.7, 10), dark, sx * 0.6, 0.9, 0.42).rotateX(Math.PI / 2));
    body.add(mesh(cyl(0.075, 0.075, 0.06, 10), glowMat('#ff5a3a', 2), sx * 0.6, 0.9, 0.79, false).rotateX(Math.PI / 2));
  }
  const head = new THREE.Group();
  head.position.set(0, 1.28, 0.05);
  head.add(mesh(boxG(0.7, 0.36, 0.62), armour));
  head.add(mesh(boxG(0.74, 0.08, 0.3), dark, 0, 0.2, -0.1));
  const eyeMat = ownMat('#ff2030', { emissive: '#ff2030', ei: 3 });
  head.add(mesh(boxG(0.54, 0.07, 0.04), eyeMat, 0, 0.02, 0.32, false));
  head.add(mesh(cyl(0.015, 0.015, 0.4, 6), dark, 0.26, 0.38, -0.15));
  head.add(mesh(sphere(0.04, 8), glowMat('#ff2030', 3), 0.26, 0.6, -0.15, false));
  body.add(head);
  const shield = new THREE.Mesh(
    boxG(1.3, 1.25, 0.06),
    new THREE.MeshStandardMaterial({ color: '#5ecbff', emissive: '#3fb6ff', emissiveIntensity: 1.2, transparent: true, opacity: 0.38, depthWrite: false }),
  );
  shield.position.set(0, 0.95, 0.78);
  body.add(shield);
  // The weak spot: an exposed power pack on its back, glowing so Jason knows where to aim.
  const pack = new THREE.Group();
  pack.position.set(0, 0.86, -0.5);
  pack.add(mesh(boxG(0.7, 0.56, 0.2), dark));
  const coreMat = ownMat('#ffd166', { emissive: '#ffb020', ei: 2.4 });
  const core = mesh(cyl(0.17, 0.17, 0.12, 16), coreMat, 0, 0, -0.12, false);
  core.rotation.x = Math.PI / 2;
  pack.add(core);
  for (const sx of [-1, 1]) pack.add(mesh(cyl(0.05, 0.05, 0.5, 8), red, sx * 0.28, 0, -0.1));
  const coreGlow = glowSprite('#ffb020', 1.1, 0.55);
  coreGlow.position.set(0, 0, -0.2);
  pack.add(coreGlow);
  body.add(pack);
  root.add(blobShadow(1.8));
  return { root, body, flash: [armour], parts: { shield, head, pack, coreGlow }, mats: { eye: eyeMat, core: coreMat } };
}

/* ---------------- spitter pod (turret) ---------------- */

/** A rooted, pulsing acid sac with a fanged maw that lobs glowing globs. */
export function makeTurret(): EnemyModel {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const flesh = ownMat('#3a1238', { emissive: '#ff3fd0', ei: 0.06, rough: 0.3 });
  const rootM = mat('#1c0c1c', { rough: 0.7 });
  const vein = glowMat('#ff4fd8', 1.5);
  const acid = glowMat('#c6ff3a', 2.6);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    limb(root, [0, 0.25, 0], [Math.cos(a) * 1.0, 0.03, Math.sin(a) * 1.0], 0.09 - (i % 2) * 0.03, rootM);
  }
  body.add(mesh(cyl(0.22, 0.32, 0.6, 10), rootM, 0, 0.35, 0));
  const head = new THREE.Group();
  head.position.y = 1.0;
  const sac = mesh(sphere(0.58, 22), flesh);
  sac.scale.set(1, 0.95, 1.05);
  head.add(sac);
  for (let i = 0; i < 4; i++) {
    const r = mesh(torus(0.56, 0.02), vein, 0, 0, 0, false);
    r.rotation.set(Math.PI / 2 + (i - 1.5) * 0.35, i * 0.8, 0);
    head.add(r);
  }
  head.add(mesh(sphere(0.2, 12), acid, 0, 0.02, 0.44, false));
  const fang = mat('#efe6d2', { rough: 0.35 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    spike(head, [Math.cos(a) * 0.26, Math.sin(a) * 0.26, 0.5], [-Math.cos(a), -Math.sin(a), 0.8], 0.04, 0.2, fang);
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    spike(head, [Math.cos(a) * 0.3, 0.45, Math.sin(a) * 0.3 - 0.1], [Math.cos(a) * 0.4, 1, Math.sin(a) * 0.4], 0.07, 0.35, rootM);
  }
  body.add(head);
  root.add(blobShadow(2));
  return { root, body, flash: [flesh], parts: { head } };
}

/* ---------------- horned brute ---------------- */

/** A hulking armoured beast: horns, burning eyes, crushing claws and GaScu growths on its back. */
export function makeBrute(): EnemyModel {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const skin = ownMat('#241830', { emissive: '#ff3050', ei: 0.04, rough: 0.4, metal: 0.25 });
  const plate = mat('#3a2c48', { rough: 0.35, metal: 0.4 });
  const horn = mat('#d8cbb4', { rough: 0.45 });
  const bloom = glowMat('#ff4fd8', 1.8);
  const eye = glowMat('#ff2a1a', 3);
  const torso = mesh(sphere(1, 24), skin, 0, 1.3, -0.1);
  torso.scale.set(1.15, 0.92, 1);
  body.add(torso);
  for (let i = 0; i < 3; i++) {
    const p = mesh(sphere(0.75 - i * 0.12, 16), plate, 0, 1.85 - i * 0.18, -0.55 - i * 0.35);
    p.scale.set(1.2, 0.5, 0.8);
    body.add(p);
  }
  body.add(mesh(sphere(0.22, 12), bloom, 0.55, 2.05, -0.6, false), mesh(sphere(0.17, 12), bloom, -0.6, 1.95, -0.45, false), mesh(sphere(0.14, 12), bloom, 0.1, 2.2, -0.95, false));
  const head = new THREE.Group();
  head.position.set(0, 1.55, 0.85);
  const skull = mesh(sphere(0.45, 18), plate);
  skull.scale.set(1.1, 0.85, 1);
  head.add(skull);
  head.add(mesh(boxG(0.12, 0.05, 0.05), eye, 0.2, 0.08, 0.4, false), mesh(boxG(0.12, 0.05, 0.05), eye, -0.2, 0.08, 0.4, false));
  for (const sx of [-1, 1]) {
    spike(head, [sx * 0.35, 0.2, 0.05], [sx, 0.9, 0.35], 0.12, 0.75, horn);
    spike(head, [sx * 0.2, -0.28, 0.35], [sx * 0.2, 0.9, 0.5], 0.05, 0.26, horn);
  }
  body.add(head);
  const arm = (sx: number) => {
    const g = new THREE.Group();
    g.position.set(sx * 1.1, 1.6, 0.2);
    limb(g, [0, 0, 0], [sx * 0.25, -0.7, 0.25], 0.3, skin);
    limb(g, [sx * 0.25, -0.7, 0.25], [sx * 0.1, -1.3, 0.6], 0.24, plate);
    for (let i = 0; i < 3; i++) spike(g, [sx * 0.1 + (i - 1) * 0.12, -1.4, 0.7], [(i - 1) * 0.3, -0.4, 1], 0.07, 0.4, horn);
    body.add(g);
    return g;
  };
  const armL = arm(-1);
  const armR = arm(1);
  for (const sx of [-1, 1]) limb(body, [sx * 0.5, 0.8, -0.2], [sx * 0.65, 0.05, -0.1], 0.3, skin);
  root.add(blobShadow(3.2));
  return { root, body, flash: [skin], parts: { armL, armR, head } };
}
