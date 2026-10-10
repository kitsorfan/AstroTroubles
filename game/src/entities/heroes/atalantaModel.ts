import * as THREE from 'three';

import type { AtalantaUpgradeId } from '../../core/save';
import { blobShadow, boxG, capsule, cyl, glowSprite, makeFace, mat, mesh, ownMat, sphere, tagParts, torus, type HeroModel } from '../models';
import { dressAtalantaOutfit } from '../outfitModels';

/** Atalanta's colours: a teal-and-white scout suit with gold trim, dark auburn hair, green eyes. */
export const ATALANTA_COLORS = {
  teal: '#2fb7a3',
  tealDark: '#1d7a6e',
  white: '#eef3f6',
  gold: '#ffc94a',
  skin: '#c68a5e',
  hair: '#6a2618',
  eyes: '#3f9a4a',
  /** The bowstring and arrows glow this colour. */
  glow: '#8ff8e4',
};

export interface AtalantaModel extends HeroModel {
  /** The bow slung across her back, and the one in her left hand while she shoots. */
  bowBack: THREE.Group;
  bowHand: THREE.Group;
  /** The arrow on the string while she draws. */
  nocked: THREE.Group;
  /** The glowing string (brighter as Blaster Power upgrades the bow). */
  string: THREE.MeshStandardMaterial;
  /** Glow at the arrow tip while a power arrow charges. */
  chargeGlow: THREE.Sprite;
  braid: THREE.Group;
  cape: THREE.Mesh;
  suit: THREE.MeshStandardMaterial;
  /** The light visor band's lens, which glows brighter in dark rooms. */
  visor: THREE.MeshStandardMaterial;
  /** The quiver on her back (Hunter's Bow fills it), and both bows' own groups (Triple Arrow decorates them). */
  quiver: THREE.Group;
  bows: THREE.Group[];
  /** Parts added by her upgrades and outfit (see `dressAtalanta`), and what they were built for. */
  gear: THREE.Object3D[];
  gearKey: string;
}

/** A recurve bow along local Y (limbs) bulging toward +Z, the string at the back. */
function makeBow(string: THREE.MeshStandardMaterial): THREE.Group {
  const g = new THREE.Group();
  const pts = [
    [0, -0.62, 0.06],
    [0, -0.56, -0.01],
    [0, -0.42, 0.07],
    [0, -0.18, 0.12],
    [0, 0, 0.12],
    [0, 0.18, 0.12],
    [0, 0.42, 0.07],
    [0, 0.56, -0.01],
    [0, 0.62, 0.06],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const limbs = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.028, 6, false);
  g.add(mesh(limbs, mat(ATALANTA_COLORS.white, { rough: 0.35, metal: 0.2 })));
  g.add(mesh(cyl(0.045, 0.045, 0.2, 10), mat(ATALANTA_COLORS.gold, { rough: 0.3, metal: 0.6 }), 0, 0, 0.12));
  for (const y of [-0.42, 0.42]) g.add(mesh(sphere(0.035, 8), mat(ATALANTA_COLORS.gold, { metal: 0.6, rough: 0.3 }), 0, y, 0.075, false));
  g.add(mesh(cyl(0.008, 0.008, 1.12, 4), string, 0, 0, -0.005, false));
  return g;
}

/** An arrow along +Z: a white shaft, a teal glowing head and gold fletching. */
export function makeArrowMesh(): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(cyl(0.018, 0.018, 0.9, 5).rotateX(Math.PI / 2), mat(ATALANTA_COLORS.white, { rough: 0.4 }), 0, 0, 0, false));
  g.add(mesh(new THREE.ConeGeometry(0.05, 0.16, 6).rotateX(Math.PI / 2), mat(ATALANTA_COLORS.glow, { emissive: ATALANTA_COLORS.glow, ei: 1.4 }), 0, 0, 0.5, false));
  for (const r of [0, Math.PI / 2]) {
    const f = mesh(boxG(0.12, 0.004, 0.16), mat(ATALANTA_COLORS.gold, { rough: 0.5 }), 0, 0, -0.38, false);
    f.rotation.z = r;
    g.add(f);
  }
  return g;
}

/**
 * Atalanta, the colony's fastest runner and best archer: about 13, with Jason's chunky friendly
 * proportions, a long braid, a light visor band instead of a helmet, a short cape, running boots and a
 * white-and-gold recurve bow with a glowing string.
 */
export function makeAtalanta(): AtalantaModel {
  const C = ATALANTA_COLORS;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const suit = ownMat(C.teal, { rough: 0.5 });
  const white = mat(C.white, { rough: 0.45 });
  const dark = mat(C.tealDark, { rough: 0.6 });
  const gold = mat(C.gold, { rough: 0.35, metal: 0.5 });

  // Legs: dark teal leggings and white running boots with gold-trimmed soles.
  const legL = new THREE.Group();
  const legR = new THREE.Group();
  legL.position.set(-0.15, 0.62, 0);
  legR.position.set(0.15, 0.62, 0);
  for (const leg of [legL, legR]) {
    leg.add(mesh(capsule(0.12, 0.26), dark, 0, -0.27, 0));
    leg.add(mesh(capsule(0.125, 0.12), white, 0, -0.44, 0.01));
    leg.add(mesh(boxG(0.22, 0.1, 0.34), white, 0, -0.56, 0.06));
    leg.add(mesh(boxG(0.23, 0.04, 0.36), gold, 0, -0.615, 0.06, false));
  }
  body.add(legL, legR);

  // Torso: teal scout suit, a white chest panel, gold belt.
  const torso = mesh(capsule(0.29, 0.3), suit, 0, 0.98, 0);
  torso.scale.set(1, 1, 0.84);
  body.add(torso);
  body.add(mesh(boxG(0.2, 0.26, 0.08), white, 0, 1.05, 0.22));
  body.add(mesh(boxG(0.06, 0.06, 0.04), mat(C.glow, { emissive: C.glow, ei: 1 }), 0.06, 1.1, 0.27, false));
  body.add(mesh(cyl(0.31, 0.31, 0.08, 18), gold, 0, 0.78, 0));
  body.add(mesh(boxG(0.1, 0.09, 0.05), mat(C.white, { metal: 0.3 }), 0, 0.78, 0.29, false));

  // Scarf around the neck and a short cape over the back.
  body.add(mesh(new THREE.TorusGeometry(0.2, 0.07, 8, 20).rotateX(Math.PI / 2), white, 0, 1.3, 0));
  const capeMat = new THREE.MeshStandardMaterial({ color: C.teal, roughness: 0.6, side: THREE.DoubleSide });
  const cape = mesh(new THREE.CylinderGeometry(0.3, 0.42, 0.62, 16, 1, true, Math.PI / 2, Math.PI), capeMat, 0, 1.0, -0.04);
  body.add(cape);
  const capeTrim = mesh(new THREE.TorusGeometry(0.42, 0.018, 4, 20, Math.PI).rotateX(Math.PI / 2).rotateY(Math.PI), gold, 0, 0.69, -0.04, false);
  body.add(capeTrim);

  // The bow across her back, and a little quiver.
  const string = ownMat(C.glow, { emissive: C.glow, ei: 1.2 });
  // Slung flat across her back, limbs from shoulder to hip.
  const bowBack = new THREE.Group();
  const slung = makeBow(string);
  slung.rotation.y = Math.PI / 2;
  bowBack.add(slung);
  bowBack.position.set(0, 1.0, -0.4);
  bowBack.rotation.z = 0.75;
  body.add(bowBack);
  const quiver = new THREE.Group();
  quiver.position.set(0.2, 1.05, -0.36);
  quiver.rotation.z = -0.35;
  quiver.add(mesh(cyl(0.08, 0.07, 0.42, 10), dark, 0, 0, 0));
  quiver.add(mesh(cyl(0.085, 0.085, 0.04, 10), gold, 0, 0.21, 0, false));
  for (const x of [-0.03, 0.03]) quiver.add(mesh(boxG(0.03, 0.12, 0.08), mat(C.gold), x, 0.3, 0, false));
  body.add(quiver);
  // Her bow and quiver keep their colours whatever she wears.
  for (const g of [slung, quiver]) g.traverse((o) => (o.userData.keep = true));

  // Head: her face, dark auburn hair with a side-swept fringe, a long braid, and the visor band.
  const head = new THREE.Group();
  head.position.set(0, 1.5, 0);
  const face = makeFace({ r: 0.3, skin: C.skin, iris: C.eyes, brow: '#4a1a10' });
  face.group.position.set(0, -0.02, 0.05);
  head.add(face.group);
  const hair = mat(C.hair, { rough: 0.75 });
  const front = Math.PI / 2;
  const win = 1.05;
  const shell = mesh(new THREE.SphereGeometry(0.335, 28, 18, front + win, Math.PI * 2 - win * 2), hair, 0, 0.02, 0.02);
  head.add(shell);
  head.add(mesh(new THREE.SphereGeometry(0.336, 24, 10, 0, Math.PI * 2, 0, 0.95), hair, 0, 0.02, 0.02));
  const fringe = mesh(sphere(0.22, 14), hair, 0.07, 0.21, 0.17, false);
  fringe.scale.set(1.4, 0.45, 0.85);
  fringe.rotation.z = -0.25;
  head.add(fringe);
  const braid = new THREE.Group();
  braid.position.set(0, -0.08, -0.3);
  for (let i = 0; i < 6; i++) {
    const r = 0.085 - i * 0.007;
    braid.add(mesh(sphere(r, 10), hair, (i % 2 ? 1 : -1) * 0.02, -0.12 * i, -0.02 * i, false));
  }
  braid.add(mesh(cyl(0.05, 0.05, 0.04, 10), gold, 0, -0.72, -0.12, false));
  const tuft = mesh(sphere(0.06, 8), hair, 0, -0.8, -0.13, false);
  tuft.scale.set(1, 1.5, 1);
  braid.add(tuft);
  head.add(braid);
  head.add(mesh(new THREE.TorusGeometry(0.338, 0.026, 6, 32).rotateX(Math.PI / 2), white, 0, 0.17, 0.02, false));
  const visor = ownMat(C.glow, { emissive: C.glow, ei: 0.5 });
  visor.transparent = true;
  visor.opacity = 0.75;
  head.add(mesh(new THREE.SphereGeometry(0.348, 20, 4, front - 0.7, 1.4, 0.98, 0.16), visor, 0, 0.02, 0.02, false));
  body.add(head);

  // Arms: teal sleeves, white gloves; the left hand holds the bow while she shoots.
  const armL = new THREE.Group();
  const armR = new THREE.Group();
  armL.position.set(-0.38, 1.16, 0);
  armR.position.set(0.38, 1.16, 0);
  for (const arm of [armL, armR]) {
    arm.add(mesh(capsule(0.095, 0.24), suit, 0, -0.22, 0));
    arm.add(mesh(cyl(0.1, 0.1, 0.05, 10), gold, 0, -0.34, 0, false));
    arm.add(mesh(sphere(0.115, 12), white, 0, -0.44, 0));
  }
  const bowHand = makeBow(string);
  bowHand.position.set(0, -0.46, 0.02);
  // Upright when the arm is raised, canted a little like an archer's.
  bowHand.rotation.set(Math.PI / 2, 0, 0.3);
  bowHand.visible = false;
  bowHand.traverse((o) => (o.userData.keep = true));
  armL.add(bowHand);
  const nocked = makeArrowMesh();
  nocked.visible = false;
  root.add(nocked);
  const chargeGlow = glowSprite(C.glow, 0.9, 0.9);
  chargeGlow.scale.setScalar(0.001);
  root.add(chargeGlow);
  body.add(armL, armR);

  const carry = new THREE.Group();
  carry.position.set(0, 2.35, 0);
  root.add(carry);

  root.add(blobShadow(1.3));
  // What an outfit repaints (see outfitModels.ts).
  tagParts(body, new Map<THREE.Material, string>([[suit, 'suit'], [white, 'trim'], [dark, 'legs'], [gold, 'gold'], [capeMat, 'cape']]));
  return { root, body, head, armL, armR, legL, legR, carry, eyes: face.eyes, bowBack, bowHand, nocked, string, chargeGlow, braid, cape, suit, visor, quiver, bows: [slung, bowHand], gear: [], gearKey: '' };
}

const ATA_GEAR: AtalantaUpgradeId[] = ['bow', 'draw', 'sandals', 'gloves', 'kick', 'triple'];

/**
 * What Atalanta has bought shows on her, like Jason's gear:
 * - Blaster Power: her bowstring and arrowheads glow brighter and golder.
 * - Hunter's Bow: arrows in her quiver (three, then five), then gold fletching and a gold band.
 * - Quick Draw: a leather bracer on her bow arm, then a glowing gem on it.
 * - Wind Sandals: little white wings on her boots, then bigger gold ones.
 * - Climber's Gloves: leather gloves, then gold cuffs on them.
 * - Iron Kick: bronze shin guards, then gold ones with a glowing edge.
 * - Triple Arrow: three gold gems on the bow's grip.
 * Her `outfit` repaints her underneath and adds its own pieces. Returns true if anything changed.
 */
export function dressAtalanta(m: AtalantaModel, power: number, ups: Partial<Record<AtalantaUpgradeId, number>> = {}, outfit?: string) {
  const lv = (id: AtalantaUpgradeId) => ups[id] ?? 0;
  const key = `${power}|${ATA_GEAR.map(lv).join('')}|${outfit ?? ''}`;
  if (key === m.gearKey) return false;
  m.gearKey = key;
  const c = new THREE.Color(ATALANTA_COLORS.glow).lerp(new THREE.Color(ATALANTA_COLORS.gold), Math.min(1, power / 4));
  m.string.color.copy(c);
  m.string.emissive.copy(c);
  m.string.emissiveIntensity = 1.2 + power * 0.35;
  for (const o of m.gear) o.removeFromParent();
  m.gear = [];
  const put = (parent: THREE.Object3D, ...parts: THREE.Object3D[]) => {
    parent.add(...parts);
    m.gear.push(...parts);
  };
  const C = ATALANTA_COLORS;
  const goldGlow = mat('#ffd36a', { emissive: '#ffae1a', ei: 0.9, metal: 0.6, rough: 0.3 });
  const teal = mat(C.glow, { emissive: C.glow, ei: 1 });
  const leather = mat('#8a5a30', { rough: 0.7 });
  const shaft = mat(C.white, { rough: 0.4 });

  // Hunter's Bow: arrows standing in the quiver (it is tilted; they follow it).
  const bow = lv('bow');
  const arrows = bow >= 2 ? 5 : bow >= 1 ? 3 : 0;
  for (let i = 0; i < arrows; i++) {
    const x = (i - (arrows - 1) / 2) * 0.03;
    const z = i % 2 ? 0.025 : -0.02;
    put(m.quiver, mesh(cyl(0.012, 0.012, 0.3, 5), shaft, x, 0.3, z, false), mesh(boxG(0.05, 0.09, 0.008), bow >= 3 ? goldGlow : teal, x, 0.42, z, false));
  }
  if (bow >= 3) {
    put(m.quiver, mesh(cyl(0.086, 0.081, 0.04, 10), goldGlow, 0, 0, 0, false));
    const glint = glowSprite('#ffd36a', 0.35, 0.6);
    glint.position.set(0, 0.42, 0);
    put(m.quiver, glint);
  }

  // Quick Draw: a bracer on her bow (left) forearm.
  const draw = lv('draw');
  if (draw >= 1) put(m.armL, mesh(cyl(0.108, 0.1, 0.13, 12), leather, 0, -0.28, 0, false));
  if (draw >= 2) {
    const gem = glowSprite(C.glow, 0.25, 0.8);
    gem.position.set(0, -0.28, 0.12);
    put(m.armL, mesh(sphere(0.03, 8), teal, 0, -0.28, 0.105, false), gem);
  }

  // Wind Sandals: wings on the outside of each boot.
  const sandals = lv('sandals');
  if (sandals >= 1) {
    const feather = sandals >= 2 ? goldGlow : mat('#ffffff', { rough: 0.5 });
    for (const [leg, side] of [[m.legL, -1], [m.legR, 1]] as const) {
      const wing = new THREE.Group();
      wing.position.set(side * 0.12, -0.52, -0.04);
      for (let i = 0; i < 3; i++) {
        const f = mesh(boxG(0.015, 0.05, 0.12 + i * 0.035), feather, 0, 0.02 + i * 0.03, -0.06 - i * 0.015, false);
        f.rotation.x = 0.35 + i * 0.25;
        wing.add(f);
      }
      wing.rotation.y = -side * 0.25;
      if (sandals >= 2) {
        wing.scale.setScalar(1.35);
        wing.add(glowSprite('#ffe8a0', 0.3, 0.5));
      }
      put(leg, wing);
    }
  }

  // Climber's Gloves: over her hands.
  const gloves = lv('gloves');
  if (gloves >= 1) {
    for (const arm of [m.armL, m.armR]) {
      put(arm, mesh(sphere(0.124, 12), mat('#a0703a', { rough: 0.75 }), 0, -0.44, 0));
      if (gloves >= 2) {
        const cuff = mesh(torus(0.1, 0.022), goldGlow, 0, -0.37, 0, false);
        cuff.rotation.x = Math.PI / 2;
        put(arm, cuff);
      }
    }
  }

  // Iron Kick: shin guards.
  const kick = lv('kick');
  if (kick >= 1) {
    const guard = kick >= 2 ? goldGlow : mat('#c08a4a', { metal: 0.6, rough: 0.35 });
    for (const leg of [m.legL, m.legR]) {
      put(leg, mesh(boxG(0.16, 0.2, 0.05), guard, 0, -0.32, 0.115));
      if (kick >= 2) put(leg, mesh(boxG(0.17, 0.025, 0.055), teal, 0, -0.42, 0.117, false));
    }
  }

  // Triple Arrow: three gems on the grip of both bows.
  if (lv('triple') >= 1) {
    for (const g of m.bows) for (const y of [-0.07, 0, 0.07]) put(g, mesh(sphere(0.024, 8), goldGlow, 0, y, 0.17, false));
  }

  dressAtalantaOutfit(m, outfit, put);
  return true;
}
