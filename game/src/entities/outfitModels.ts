import * as THREE from 'three';

import type { UpgradeId } from '../core/save';
import { starTexture } from '../world/textures';
import type { AtalantaModel } from './heroes/atalantaModel';
import { boxG, cyl, glowSprite, mat, mesh, paintParts, sphere, torus, type JasonModel } from './models';
import { outfitFor } from './outfits';

/**
 * The outfits on the heroes' models (the catalogue is in outfits.ts). Each one repaints the hero's
 * tagged parts by colour role (see `tagParts` in models.ts) and adds a few pieces of its own. The
 * pieces go into the model's gear list, so they come off with it; upgrade gear is built first and
 * keeps its own colours, so it sits on top of any outfit.
 *
 * Jason's roles: suit (torso, arms), trim (boots, gloves), metal (backpack, belt), legs, helmet.
 * Atalanta's: suit, trim (boots, gloves, scarf, headband), legs, gold (belt, cuffs, soles), cape.
 */

type Put = (parent: THREE.Object3D, ...parts: THREE.Object3D[]) => void;
type Paint = Partial<Record<string, THREE.Material>>;

interface ClothOpts {
  emissive?: string;
  ei?: number;
  rough?: number;
  metal?: number;
  opacity?: number;
  map?: THREE.Texture;
  glowMap?: THREE.Texture;
}

const clothCache = new Map<string, THREE.MeshStandardMaterial>();

/** An outfit's material: two-sided (the helmet shell and capes are open shapes), shared by colour. */
function cloth(color: string, o: ClothOpts = {}): THREE.MeshStandardMaterial {
  const key = `${color}|${o.emissive ?? ''}|${o.ei ?? 0}|${o.rough ?? 0.55}|${o.metal ?? 0.1}|${o.opacity ?? 1}|${o.map?.uuid ?? ''}`;
  let m = clothCache.get(key);
  if (!m) {
    const see = (o.opacity ?? 1) < 1;
    m = new THREE.MeshStandardMaterial({
      color: o.map ? '#ffffff' : color,
      map: o.map ?? null,
      emissive: o.emissive ?? '#000000',
      emissiveMap: o.glowMap ?? null,
      emissiveIntensity: o.ei ?? (o.emissive ? 1 : 0),
      roughness: o.rough ?? 0.55,
      metalness: o.metal ?? 0.1,
      transparent: see,
      opacity: o.opacity ?? 1,
      depthWrite: !see,
      side: THREE.DoubleSide,
    });
    clothCache.set(key, m);
  }
  return m;
}

/** A crest, wreath or cape trim: a ring of `n` pieces placed by `at(i, k)` (k runs 0..1). */
function ring(n: number, at: (i: number, k: number) => THREE.Object3D): THREE.Object3D[] {
  return Array.from({ length: n }, (_, i) => at(i, n > 1 ? i / (n - 1) : 0));
}

/* ---------------- Jason ---------------- */

function jasonPaint(id: string): Paint {
  switch (id) {
    case 'bronze':
      return {
        suit: cloth('#c07a3a', { metal: 0.65, rough: 0.35 }),
        trim: cloth('#7a4a24', { rough: 0.7 }),
        legs: cloth('#8a1f1f', { rough: 0.6 }),
        metal: cloth('#8a6a40', { metal: 0.5, rough: 0.45 }),
        helmet: cloth('#d09a52', { metal: 0.7, rough: 0.3 }),
      };
    case 'fleece':
      return {
        suit: cloth('#2f4fae', { rough: 0.5 }),
        trim: cloth('#ffcf5a', { emissive: '#ff9a1a', ei: 0.15, metal: 0.6, rough: 0.3 }),
        legs: cloth('#1c2450', { rough: 0.6 }),
        metal: cloth('#22306e', { metal: 0.4, rough: 0.4 }),
        helmet: cloth('#f4ecd6', { metal: 0.3, rough: 0.35 }),
      };
    case 'starlight': {
      const stars = cloth('#1b2350', { map: starTexture(true), glowMap: starTexture(false), emissive: '#cfe6ff', ei: 1.1, rough: 0.45 });
      return {
        suit: stars,
        trim: cloth('#e8ecff', { metal: 0.5, rough: 0.3 }),
        legs: stars,
        metal: cloth('#c0c8e8', { metal: 0.6, rough: 0.3 }),
        helmet: cloth('#f4f6ff', { emissive: '#8a6aff', ei: 0.08, rough: 0.25, metal: 0.2 }),
      };
    }
    case 'captain':
      return {
        suit: cloth('#22336a', { rough: 0.55 }),
        trim: cloth('#f4f4f4', { rough: 0.5 }),
        legs: cloth('#2a2a36', { rough: 0.6 }),
        metal: cloth('#c9a040', { metal: 0.6, rough: 0.35 }),
        helmet: cloth('#25366a', { metal: 0.2, rough: 0.4 }),
      };
  }
  return {};
}

/**
 * Jason's outfit: repaint, then the pieces.
 * - Argonaut Bronze: a red horsehair crest over the helmet, and leather strips round his waist.
 * - Golden Fleece Cape: a woolly gold cape (under the backpack), a fleece collar and gold clasps.
 * - Starlight Explorer: glowing bands on his arms and legs, a gold star badge, a ring round the helmet.
 * - Captain's Coat: gold epaulettes (on top of any shoulder pads), gold buttons, coat tails, a gold
 *   band round the helmet.
 */
export function dressJasonOutfit(m: JasonModel, id: string | undefined, lv: (id: UpgradeId) => number, put: Put) {
  const o = outfitFor('jason', id);
  paintParts(m.body, o ? jasonPaint(o.id) : {});
  if (!o) return;
  const gold = mat('#ffcf5a', { emissive: '#ff9a1a', ei: 0.3, rough: 0.3, metal: 0.7 });
  if (o.id === 'bronze') {
    // The crest: plume pieces standing out of the helmet along its middle, front to back.
    const red = mat('#e0302a', { rough: 0.85 });
    const bronze = mat('#b8803a', { metal: 0.7, rough: 0.3 });
    const crest = ring(13, (_, k) => {
      const phi = -0.55 + k * 1.95;
      const g = new THREE.Group();
      g.position.set(0, Math.cos(phi) * 0.42, -Math.sin(phi) * 0.42);
      g.rotation.x = -phi;
      g.add(mesh(boxG(0.07, 0.05, 0.09), bronze, 0, 0.01, 0, false), mesh(boxG(0.05, 0.2 - Math.abs(k - 0.45) * 0.12, 0.085), red, 0, 0.11, 0, false));
      return g;
    });
    put(m.head, ...crest);
    // Pteruges: leather strips hanging round the waist, below the belt.
    const leather = mat('#7a4a24', { rough: 0.7 });
    put(
      m.body,
      ...ring(12, (i) => {
        const a = (i / 12) * Math.PI * 2;
        const strip = mesh(boxG(0.09, 0.2, 0.03), i % 2 ? leather : bronze, Math.sin(a) * 0.335, 0.6, Math.cos(a) * 0.335, false);
        strip.rotation.y = a;
        return strip;
      }),
    );
  } else if (o.id === 'fleece') {
    // The cape hangs from his shoulders under the backpack (which pokes through), down to his knees.
    const wool = cloth('#f2c14e', { emissive: '#b07010', ei: 0.3, rough: 0.85, metal: 0.15 });
    const cape = new THREE.Group();
    cape.position.set(0, 1.3, 0);
    cape.add(mesh(new THREE.CylinderGeometry(0.33, 0.45, 0.72, 18, 1, true, Math.PI / 2, Math.PI), wool, 0, -0.36, 0));
    // Woolly curls over the cape.
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 2 + ((i + 0.5 + (row % 2) * 0.5) / 6.5) * Math.PI;
        const y = -0.2 - row * 0.2;
        const r = 0.33 + (-y / 0.72) * 0.12 + 0.02;
        cape.add(mesh(sphere(0.045, 8), wool, Math.sin(a) * r, y, Math.cos(a) * r, false));
      }
    }
    put(m.body, cape);
    m.cape = cape;
    put(
      m.body,
      ...ring(9, (_, k) => {
        const a = Math.PI * 0.35 + k * Math.PI * 1.3;
        return mesh(sphere(0.075, 10), wool, Math.sin(a) * 0.27, 1.27, Math.cos(a) * 0.27, false);
      }),
    );
    for (const x of [-0.12, 0.12]) {
      const clasp = mesh(cyl(0.045, 0.045, 0.03, 12), gold, x, 1.22, 0.255, false);
      clasp.rotation.x = Math.PI / 2;
      put(m.body, clasp);
    }
  } else if (o.id === 'starlight') {
    const glow = mat('#bff8ff', { emissive: '#5ee0ff', ei: 1.6 });
    for (const arm of [m.armL, m.armR]) {
      const band = mesh(torus(0.105, 0.016), glow, 0, -0.14, 0, false);
      band.rotation.x = Math.PI / 2;
      put(arm, band);
    }
    for (const leg of [m.legL, m.legR]) {
      const band = mesh(torus(0.135, 0.016), glow, 0, -0.18, 0, false);
      band.rotation.x = Math.PI / 2;
      put(leg, band);
    }
    const star = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
      const r = i % 2 ? 0.035 : 0.08;
      if (i === 0) star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    put(m.body, mesh(new THREE.ShapeGeometry(star), mat('#ffe08a', { emissive: '#ffc94a', ei: 1.2 }), -0.15, 1.2, 0.27, false));
    // A thin glowing ring round the helmet, tilted like a planet's, with a star riding on it.
    const halo = new THREE.Group();
    halo.position.set(0, 0.06, 0);
    halo.rotation.set(0.35, 0, 0.2);
    const hoop = mesh(torus(0.55, 0.016), mat('#e6dcff', { emissive: '#a07aff', ei: 1.5 }), 0, 0, 0, false);
    hoop.rotation.x = Math.PI / 2;
    const spark = glowSprite('#d8c8ff', 0.3, 0.9);
    spark.position.set(0.55, 0, 0);
    halo.add(hoop, spark);
    put(m.head, halo);
  } else if (o.id === 'captain') {
    // Epaulettes sit on the shoulder (a little higher over Heart Plating's pads), fringe outwards.
    const top = lv('heart') >= 2 ? 0.16 : 0.12;
    for (const [arm, side] of [[m.armL, -1], [m.armR, 1]] as const) {
      const ep = new THREE.Group();
      ep.position.set(0, top, 0);
      ep.add(mesh(cyl(0.15, 0.15, 0.04, 16), gold, 0, 0, 0, false));
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i / 6) * Math.PI;
        ep.add(mesh(cyl(0.012, 0.012, 0.09, 5), gold, side * Math.cos(a) * 0.14, -0.05, Math.sin(a) * 0.14, false));
      }
      put(arm, ep);
    }
    for (const x of [-0.09, 0.09]) for (const y of [0.9, 1.02, 1.14]) put(m.body, mesh(sphere(0.025, 8), gold, x, y, 0.272, false));
    // Coat tails under the backpack, a little apart, with gold hems.
    const coat = jasonPaint('captain').suit as THREE.Material;
    for (const x of [-0.11, 0.11]) {
      const tail = new THREE.Group();
      tail.position.set(x, 0.74, -0.25);
      tail.rotation.set(0.12, 0, x * 0.6);
      tail.add(mesh(boxG(0.2, 0.42, 0.03), coat, 0, -0.21, 0), mesh(boxG(0.2, 0.03, 0.036), gold, 0, -0.41, 0, false));
      put(m.body, tail);
    }
    // A gold band round the helmet, open at the face.
    const open = Math.PI / 2 + 0.95;
    const band = mesh(new THREE.TorusGeometry(0.41, 0.022, 6, 24, Math.PI * 2 - 1.9).rotateX(Math.PI / 2), gold, 0, 0.1, 0, false);
    band.rotation.y = -open;
    put(m.head, band);
  }
}

/* ---------------- Atalanta ---------------- */

function atalantaPaint(id: string): Paint {
  switch (id) {
    case 'artemis':
      return {
        suit: cloth('#dde6f2', { metal: 0.35, rough: 0.35 }),
        trim: cloth('#f6f8ff', { rough: 0.4 }),
        legs: cloth('#3a4870', { rough: 0.55 }),
        gold: cloth('#cfd8e8', { metal: 0.7, rough: 0.25 }),
        cape: cloth('#1e2a5a', { emissive: '#2a3a8a', ei: 0.3, rough: 0.6 }),
      };
    case 'olympic':
      return {
        suit: cloth('#fbf8ef', { rough: 0.6 }),
        trim: cloth('#ffffff', { rough: 0.5 }),
        legs: cloth('#efe4c8', { rough: 0.6 }),
        gold: cloth('#ffcf5a', { emissive: '#ff9a1a', ei: 0.2, metal: 0.7, rough: 0.3 }),
        cape: cloth('#ffffff', { rough: 0.7 }),
      };
    case 'ranger':
      return {
        suit: cloth('#4f7a3a', { rough: 0.7 }),
        trim: cloth('#9a7448', { rough: 0.65 }),
        legs: cloth('#5a3f28', { rough: 0.7 }),
        gold: cloth('#a8743a', { metal: 0.5, rough: 0.4 }),
        cape: cloth('#2f5a2a', { rough: 0.8 }),
      };
    case 'crystal':
      return {
        suit: cloth('#c8f6ff', { emissive: '#5ee0ff', ei: 0.35, metal: 0.2, rough: 0.15 }),
        trim: cloth('#ffffff', { emissive: '#bff4ff', ei: 0.3, rough: 0.2 }),
        legs: cloth('#7fd8e8', { emissive: '#2a8aa0', ei: 0.2, rough: 0.25 }),
        gold: cloth('#ffd6ff', { emissive: '#ff9af0', ei: 0.45, metal: 0.3, rough: 0.2 }),
        cape: cloth('#e6d6ff', { emissive: '#b07aff', ei: 0.5, opacity: 0.75, rough: 0.2 }),
      };
  }
  return {};
}

/**
 * Atalanta's outfit: repaint, then the pieces.
 * - Huntress of Artemis: a glowing crescent moon on her brow, silver stars on a longer cape.
 * - Olympic Champion: a laurel wreath and a gold medal on a blue ribbon.
 * - Forest Ranger: a hood lowered behind her neck, a leaf brooch and a feather in her headband.
 * - Gardener's Crystal Dress: a glowing crystal skirt, a crystal tiara and two floating lights.
 */
export function dressAtalantaOutfit(m: AtalantaModel, id: string | undefined, put: Put) {
  const o = outfitFor('atalanta', id);
  paintParts(m.body, o ? atalantaPaint(o.id) : {});
  m.cape.scale.set(1, o?.id === 'artemis' ? 1.3 : 1, 1);
  m.cape.position.y = o?.id === 'artemis' ? 0.91 : 1.0;
  if (!o) return;
  if (o.id === 'artemis') {
    const moon = mat('#f4f8ff', { emissive: '#bcd4ff', ei: 1.2, metal: 0.4, rough: 0.2 });
    const crescent = mesh(new THREE.TorusGeometry(0.075, 0.02, 6, 16, Math.PI * 1.2), moon, 0, 0.22, 0.385, false);
    crescent.rotation.z = -Math.PI / 2 - Math.PI * 0.6;
    const glint = glowSprite('#cfe0ff', 0.32, 0.6);
    glint.position.set(0, 0.22, 0.4);
    put(m.head, crescent, glint);
    // Silver stars on the back of the cape (cape space: an open half-cylinder round her back).
    const star = mat('#ffffff', { emissive: '#dfe8ff', ei: 1.5 });
    for (const [a, y] of [[-0.35, 0.12], [0.3, 0.02], [-0.1, -0.12], [0.4, -0.2]] as const) {
      const r = 0.3 + ((0.31 - y) / 0.62) * 0.12 + 0.01;
      put(m.cape, mesh(sphere(0.022, 6), star, Math.sin(Math.PI + a) * r, y, Math.cos(Math.PI + a) * r, false));
    }
  } else if (o.id === 'olympic') {
    const leaf = mat('#7fb04a', { emissive: '#3a6a1a', ei: 0.15, rough: 0.5 });
    const tip = mat('#ffd36a', { emissive: '#ffae1a', ei: 0.5, metal: 0.6, rough: 0.3 });
    put(
      m.head,
      ...ring(16, (i, k) => {
        // Round the back and sides of her head, a gap over her forehead.
        const a = 0.6 + k * (Math.PI * 2 - 1.2);
        const l = mesh(sphere(0.05, 8), i % 4 === 3 ? tip : leaf, Math.sin(a) * 0.345, 0.2 + (i % 2) * 0.03, Math.cos(a) * 0.345 + 0.02, false);
        l.scale.set(1.6, 0.6, 0.5);
        l.rotation.set(0, a + Math.PI / 2, i % 2 ? 0.5 : -0.5);
        return l;
      }),
    );
    const ribbon = mat('#2a5aff', { rough: 0.6 });
    for (const x of [-0.06, 0.06]) {
      const r = mesh(boxG(0.035, 0.28, 0.012), ribbon, x, 1.1, 0.285, false);
      r.rotation.z = x > 0 ? 0.28 : -0.28;
      put(m.body, r);
    }
    const medal = mesh(cyl(0.07, 0.07, 0.022, 16), tip, 0, 0.94, 0.3, false);
    medal.rotation.x = Math.PI / 2;
    put(m.body, medal);
  } else if (o.id === 'ranger') {
    const green = cloth('#2f5a2a', { rough: 0.8 });
    const hood = mesh(new THREE.SphereGeometry(0.22, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), green, 0, 1.34, -0.2, false);
    hood.scale.set(1.25, 0.7, 0.9);
    hood.rotation.x = -2.2;
    put(m.body, hood);
    const leafM = mat('#6fbf4a', { emissive: '#2a7a1a', ei: 0.3, rough: 0.5 });
    const brooch = mesh(sphere(0.05, 8), leafM, 0.11, 1.26, 0.21, false);
    brooch.scale.set(1.5, 0.7, 0.4);
    brooch.rotation.z = 0.6;
    put(m.body, brooch, mesh(sphere(0.022, 6), mat('#e0b050', { metal: 0.6, rough: 0.3 }), 0.11, 1.26, 0.23, false));
    const feather = mesh(boxG(0.02, 0.24, 0.06), mat('#e8f0e0', { rough: 0.6 }), 0.32, 0.3, -0.06, false);
    feather.rotation.set(-0.3, 0, -0.45);
    put(m.head, feather, mesh(boxG(0.022, 0.08, 0.062), leafM, 0.36, 0.39, -0.09, false));
  } else if (o.id === 'crystal') {
    const glass = cloth('#d8fbff', { emissive: '#7fe6ff', ei: 0.55, opacity: 0.55, rough: 0.1, metal: 0.2 });
    const skirt = mesh(new THREE.CylinderGeometry(0.32, 0.5, 0.38, 20, 1, true), glass, 0, 0.62, 0, false);
    const hem = mesh(torus(0.5, 0.016), mat('#ffe6ff', { emissive: '#ff9af0', ei: 1.4 }), 0, 0.43, 0, false);
    hem.rotation.x = Math.PI / 2;
    put(m.body, skirt, hem);
    const gems = ['#7fe6ff', '#c9a6ff', '#ff9af0'];
    for (const [i, x] of [-0.1, 0, 0.1].entries()) {
      const g = mesh(new THREE.OctahedronGeometry(0.045, 0), mat(gems[i], { emissive: gems[i], ei: 1.2 }), x, x === 0 ? 0.29 : 0.25, x === 0 ? 0.3 : 0.29, false);
      g.scale.y = 1.6;
      put(m.head, g);
    }
    for (const x of [-0.5, 0.5]) {
      const mote = glowSprite(x < 0 ? '#9ff2ff' : '#ffb8f0', 0.35, 0.8);
      mote.position.set(x, 1.45, -0.1);
      put(m.body, mote);
    }
  }
}
