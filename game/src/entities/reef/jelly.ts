import * as THREE from 'three';

import { audio } from '../../core/audio';
import { damp } from '../../core/math';
import type { World } from '../../game/world';
import { Grid } from '../../world/grid';
import type { EnemyModel } from '../aliens';
import { Enemy } from '../enemies';
import { blobShadow, cyl, glowSprite, mesh, ownMat, sphere } from '../models';

/**
 * A JELLYFISH-DRONE, one of Aeëtes's reef robots (Scylla's Reef): a see-through pink bell with
 * dangling cable tentacles. It bobs in the air over the reef (always a little above the sea, so it
 * rides the tide) and drifts slowly toward the hero. Every few seconds its tentacles light up (the
 * warning) and it lets out a ZAP: a ring of sparks around it. Stay out of the ring until the zap is
 * over, then blast it. It's soft: two hits and it pops.
 */
export const JELLY_TUNING = {
  hp: 2,
  /** Height it floats at above the floor (or the sea), and how fast it drifts. */
  float: 1.6,
  drift: 1.6,
  /** Seconds between zaps, the glowing warning, and the zap ring's radius. */
  every: 3.2,
  warn: 0.9,
  radius: 2.3,
};

/** The jellyfish-drone: a glassy pink bell with a glowing core and six cable tentacles. */
export function makeJellyModel(): EnemyModel & { tentacles: THREE.Object3D[]; tipMat: THREE.MeshStandardMaterial; bell: THREE.Mesh } {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const bellMat = ownMat('#ff9ad8', { emissive: '#ff6ac8', ei: 0.35, rough: 0.15, metal: 0.1 });
  bellMat.transparent = true;
  bellMat.opacity = 0.8;
  const bell = mesh(new THREE.SphereGeometry(0.6, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), bellMat, 0, 0, 0);
  bell.scale.set(1, 0.8, 1);
  body.add(bell);
  body.add(mesh(cyl(0.6, 0.55, 0.08, 18), ownMat('#d86ab8', { rough: 0.4 }), 0, 0.02, 0));
  const core = mesh(sphere(0.2, 12), ownMat('#bff4ff', { emissive: '#5ee0ff', ei: 1.4 }), 0, 0.2, 0, false);
  body.add(core);
  body.add(mesh(sphere(0.07, 8), ownMat('#ff3a4c', { emissive: '#ff3a4c', ei: 2 }), 0, 0.25, 0.42, false));
  const tipMat = ownMat('#7fe6ff', { emissive: '#7fe6ff', ei: 0.4 });
  const cable = ownMat('#c88ab8', { rough: 0.5, metal: 0.3 });
  const tentacles: THREE.Object3D[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const t = new THREE.Group();
    t.position.set(Math.cos(a) * 0.38, 0, Math.sin(a) * 0.38);
    t.add(mesh(cyl(0.035, 0.025, 0.9, 5), cable, 0, -0.45, 0, false));
    t.add(mesh(sphere(0.07, 6), tipMat, 0, -0.92, 0, false));
    body.add(t);
    tentacles.push(t);
  }
  const glow = glowSprite('#ff9ad8', 1.8, 0.3);
  body.add(glow);
  const shadow = blobShadow(1.4);
  root.add(shadow);
  return { root, body, flash: [bellMat], parts: { shadow }, tentacles, tipMat, bell };
}

let JellyClass: (new (world: World, id: string, x: number, y: number, z: number) => Enemy) | null = null;

/** Builds a jellyfish-drone (the class extends `Enemy`, so it is defined on first use, like the harpies). */
export function makeJelly(world: World, id: string, x: number, y: number, z: number): Enemy {
  JellyClass ??= jellyClass();
  return new JellyClass(world, id, x, y, z);
}

function jellyClass() {
  const T = JELLY_TUNING;
  return class Jelly extends Enemy {
    private m: ReturnType<typeof makeJellyModel>;
    private zapT = T.every * (0.5 + Math.random() * 0.5);
    private floor: number;

    constructor(world: World, id: string, x: number, y: number, z: number) {
      const model = makeJellyModel();
      super(world, id, x, y + T.float, z, T.hp, 0.55, model);
      this.m = model;
      this.floor = y;
      this.kind = 'jelly';
      this.flying = true;
      this.contact = false;
      this.bolts = 3;
      this.aimHeight = 0;
      this.badgeY = 1.2;
    }

    protected think(dt: number) {
      const b = this.body;
      const p = this.player.body;
      const w = this.world;
      // Drift toward the hero (but never far from home), over the floor or the sea, whichever is higher.
      const dx = p.x - b.x;
      const dz = p.z - b.z;
      const d = Math.hypot(dx, dz) || 1;
      const leash = Math.hypot(this.home.x - b.x, this.home.z - b.z);
      const go = this.aggro && d > 1.2 && leash < 7 ? T.drift * this.spd : 0;
      const nx = b.x + (dx / d) * go * dt;
      const nz = b.z + (dz / d) * go * dt;
      if (w.grid.cell(Grid.toCell(nx), Grid.toCell(nz)).kind !== 'wall') {
        b.x = nx;
        b.z = nz;
      }
      const sea = w.tide?.level ?? -99;
      const c = w.grid.cell(Grid.toCell(b.x), Grid.toCell(b.z));
      const under = c.kind === 'void' || c.kind === 'wall' ? this.floor : c.h;
      const base = Math.max(under, sea, this.floor - 2) + T.float;
      b.y = damp(b.y, base + Math.sin(this.t * 1.8) * 0.3, 2, dt);
      // The zap: tentacles light up, then a ring of sparks.
      if (this.aggro) this.zapT -= dt * this.rate;
      const warn = this.zapT < T.warn;
      if (this.zapT <= 0) {
        this.zapT = T.every;
        audio.play('zap', 0.8);
        w.rings.burst(b.x, b.y - 0.6, b.z, T.radius * 2, '#7fe6ff', 0.35);
        w.particles.emit(b.x, b.y - 0.6, b.z, { count: 24, color: '#bff4ff', speed: 7, life: 0.35, size: 0.3, gravity: 0 });
        const r = T.radius + p.r;
        if (d < r && p.y < b.y + 0.8 && p.y > b.y - 2.6) this.player.hurt(1, b.x, b.z);
      }
      this.facePlayer(dt, 2);
      // Pose: the bell pulses as it swims, the tentacles sway (and stiffen and glow before a zap).
      const pulse = Math.sin(this.t * 4);
      this.m.bell.scale.set(1 + pulse * 0.06, 0.8 - pulse * 0.08, 1 + pulse * 0.06);
      for (const [i, t] of this.m.tentacles.entries()) {
        t.rotation.x = warn ? Math.sin(this.t * 40 + i) * 0.08 : Math.sin(this.t * 2 + i) * 0.25;
        t.rotation.z = warn ? 0 : Math.cos(this.t * 1.7 + i) * 0.2;
      }
      this.m.tipMat.emissiveIntensity = warn ? 3 + Math.sin(this.t * 30) * 1.5 : 0.4;
      const shadow = this.m.parts.shadow;
      shadow.visible = c.kind !== 'void' && under > sea;
      shadow.position.y = under - b.y + 0.03;
    }
  };
}
