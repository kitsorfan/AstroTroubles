import * as THREE from 'three';

import { damp } from '../../core/math';
import type { World } from '../../game/world';
import { Grid } from '../../world/grid';
import type { EnemyModel } from '../aliens';
import { Enemy } from '../enemies';
import { Entity } from '../entity';
import { blobShadow, boxG, cone, cyl, glowSprite, mat, mesh, ownMat, sphere, torus } from '../models';
import { WEEDER_TUNING } from './gardenData';

/**
 * A WEEDER DRONE, Aeëtes's saboteur in the Garden of Colchis (chapter 3): a round gold drone with a
 * rotor on top, garden shears for arms and a tank of gold weed-killer underneath. It floats around
 * snipping flowers until it spots a hero, then hovers a few steps away (it backs off if you get too
 * close) and sprays: its tank glows and hisses (the warning), and a gold circle spreads on the ground
 * where you stand. A moment later the weed-killer splashes down there: step off the circle! It never
 * touches you itself, so a few blasts (or arrows) and it pops. Its timings are in `gardenData.ts`.
 */
const GOLD = '#f2c14e';
const SPRAY = '#d8e84a';

/** The weed-killer circle: it spreads, blinks, then splashes (a hit if a hero is inside), and the grass under it wilts for a moment. */
export class WeedSplash extends Entity {
  private t = 0;
  private disc: THREE.Mesh;
  private ring: THREE.Mesh;
  private done = false;

  constructor(
    world: World,
    private x: number,
    private y: number,
    private z: number,
    private delay = WEEDER_TUNING.splash,
    private r = WEEDER_TUNING.radius,
  ) {
    super(world, `splash${Math.random()}`);
    this.disc = new THREE.Mesh(new THREE.CircleGeometry(r, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: SPRAY, transparent: true, opacity: 0.3, depthWrite: false, toneMapped: false }));
    this.ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.14, r, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false }));
    this.disc.position.set(x, y + 0.06, z);
    this.ring.position.set(x, y + 0.07, z);
    this.obj.add(this.disc, this.ring);
  }

  update(dt: number) {
    this.t += dt;
    const w = this.world;
    const dm = this.disc.material as THREE.MeshBasicMaterial;
    const rm = this.ring.material as THREE.MeshBasicMaterial;
    if (!this.done) {
      const k = Math.min(1, this.t / this.delay);
      this.disc.scale.setScalar(0.3 + k * 0.7);
      dm.opacity = 0.2 + k * 0.4 + (k > 0.7 ? Math.sin(this.t * 30) * 0.15 : 0);
      if (this.t < this.delay) return;
      this.done = true;
      const p = w.player.body;
      if (Math.hypot(p.x - this.x, p.z - this.z) < this.r + p.r * 0.5 && p.y < this.y + 1.4) w.player.hurt(1, this.x, this.z);
      w.soundAt('sputter', this.x, this.z, 1.3, 20);
      w.particles.emit(this.x, this.y + 0.2, this.z, { count: 22, color: SPRAY, speed: 4, up: 3, life: 0.6, size: 0.45 });
      w.particles.emit(this.x, this.y + 0.2, this.z, { count: 10, color: GOLD, speed: 2, up: 4, life: 0.5, size: 0.3 });
      dm.color.set('#8a7a3a');
      this.ring.visible = false;
      return;
    }
    // The wilted patch fades away.
    const fade = Math.max(0, 1 - (this.t - this.delay) / 1.4);
    dm.opacity = 0.45 * fade;
    rm.opacity = 0;
    if (fade <= 0) this.remove();
  }
}

/** The weeder's look: gold dome, red eye, spinning rotor, shear arms, and the glass tank of weed-killer. */
function makeWeederModel(): EnemyModel & { rotor: THREE.Group; tank: THREE.MeshStandardMaterial; shears: THREE.Group[]; eye: THREE.MeshStandardMaterial } {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const gold = ownMat(GOLD, { emissive: '#ffb020', ei: 0.08, rough: 0.25, metal: 0.8 });
  const dark = mat('#6a5a3a', { rough: 0.5, metal: 0.6 });
  const eye = ownMat('#ff3a4c', { emissive: '#ff3a4c', ei: 2 });
  const tank = ownMat('#cfe86a', { emissive: SPRAY, ei: 0.4, rough: 0.1, metal: 0.1 });
  const dome = mesh(sphere(0.45, 18), gold, 0, 0, 0);
  dome.scale.set(1, 0.75, 1);
  body.add(dome);
  body.add(mesh(torus(0.46, 0.05), dark, 0, -0.05, 0, false).rotateX(Math.PI / 2));
  body.add(mesh(sphere(0.11, 12), eye, 0, 0.06, 0.42, false));
  // Rotor on a little mast.
  body.add(mesh(cyl(0.04, 0.05, 0.3, 6), dark, 0, 0.45, 0));
  const rotor = new THREE.Group();
  rotor.position.y = 0.6;
  for (let i = 0; i < 3; i++) {
    const blade = mesh(boxG(0.9, 0.03, 0.12), dark, 0, 0, 0, false);
    blade.rotation.y = (i / 3) * Math.PI;
    rotor.add(blade);
  }
  body.add(rotor);
  // The tank of weed-killer, with a nozzle.
  const glass = mesh(sphere(0.26, 14), tank, 0, -0.38, 0, false);
  glass.scale.set(1, 0.8, 1);
  body.add(glass);
  body.add(mesh(cone(0.07, 0.22, 8), dark, 0, -0.62, 0, false).rotateX(Math.PI));
  // Two pairs of garden shears for arms.
  const shears: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(s * 0.45, -0.1, 0.15);
    for (const k of [-1, 1]) {
      const blade = mesh(boxG(0.05, 0.04, 0.42), mat('#d8dde6', { metal: 0.9, rough: 0.2 }), 0, 0, 0.2, false);
      blade.rotation.y = k * 0.25;
      arm.add(blade);
    }
    body.add(arm);
    shears.push(arm);
  }
  const shadow = blobShadow(1.1);
  root.add(shadow);
  root.add(glowSprite(SPRAY, 1.2, 0.15));
  return { root, body, flash: [gold], parts: { shadow }, rotor, tank, shears, eye };
}

type Mode = 'idle' | 'warn' | 'rest';

/** When the next weeder on this level may start spraying (they take turns). */
const nextSpray = new WeakMap<World, number>();

let WeederClass: (new (world: World, id: string, x: number, y: number, z: number) => Enemy) | null = null;

/** Builds a weeder drone (the class extends `Enemy`, so it is defined on first use, like the robots). */
export function makeWeeder(world: World, id: string, x: number, y: number, z: number): Enemy {
  WeederClass ??= weederClass();
  return new WeederClass(world, id, x, y, z);
}

function weederClass() {
  const T = WEEDER_TUNING;
  return class Weeder extends Enemy {
    private mode: Mode = 'idle';
    private modeT = 1 + Math.random() * 1.5;
    private side = Math.random() < 0.5 ? -1 : 1;
    private floorY: number;
    private m: ReturnType<typeof makeWeederModel>;

    constructor(world: World, id: string, x: number, y: number, z: number) {
      const model = makeWeederModel();
      super(world, id, x, y + T.hover, z, T.hp, 0.55, model);
      this.m = model;
      this.floorY = y;
      this.flying = true;
      this.contact = false;
      this.kind = 'weeder';
      this.bolts = 4;
      this.aimHeight = 0;
      this.badgeY = 1.2;
    }

    private setMode(m: Mode, t: number) {
      this.mode = m;
      this.modeT = t;
    }

    protected think(dt: number) {
      const b = this.body;
      const p = this.player.body;
      const g = this.world.grid;
      this.modeT -= dt;
      // Snipping about at home while nobody is near.
      let tx = this.home.x + Math.cos(this.t * 0.5) * 1.8;
      let tz = this.home.z + Math.sin(this.t * 0.5) * 1.8;
      let follow = 1.2;
      if (this.aggro) {
        // Hover a few steps from the hero, drifting round to one side, and back off if they get close.
        const dx = b.x - p.x;
        const dz = b.z - p.z;
        const d = Math.hypot(dx, dz) || 1;
        const a = Math.atan2(dz, dx) + this.side * dt * 0.6;
        tx = p.x + Math.cos(a) * T.keep;
        tz = p.z + Math.sin(a) * T.keep;
        follow = d < T.keep - 1.5 ? 2.6 : 1.4;
      }
      switch (this.mode) {
        case 'idle':
          if (this.aggro) this.setMode('rest', 1 + Math.random());
          break;
        case 'rest':
          if (!this.aggro) this.setMode('idle', 1);
          else if (this.modeT <= 0 && this.distToPlayer() < 12 && this.world.time >= (nextSpray.get(this.world) ?? 0)) {
            // Weeders take turns: never two circles at once, so there's always time to step aside.
            nextSpray.set(this.world, this.world.time + T.warn + T.gap);
            this.setMode('warn', T.warn);
            this.world.soundAt('vent', b.x, b.z, 1.8, 18);
          }
          break;
        case 'warn':
          // Holds still, tank blazing: here comes the spray.
          tx = b.x;
          tz = b.z;
          if (this.modeT <= 0) {
            this.spray();
            this.side = -this.side;
            this.setMode('rest', T.rest / this.rate);
          }
          break;
      }
      const nx = damp(b.x, tx, follow * this.spd, dt);
      const nz = damp(b.z, tz, follow * this.spd, dt);
      const c = g.cell(Grid.toCell(nx), Grid.toCell(nz));
      if (c.kind !== 'wall') {
        b.x = nx;
        b.z = nz;
        if (c.kind !== 'void') this.floorY = damp(this.floorY, c.h, 3, dt);
      }
      b.y = damp(b.y, Math.max(this.floorY, p.y) + T.hover + Math.sin(this.t * 2.4) * 0.15, 2.5, dt);
      this.pose(dt);
    }

    /** Sprays weed-killer where the hero stands (and, on later levels, a second circle where they're going). */
    private spray() {
      const w = this.world;
      const p = this.player.body;
      const c = w.grid.cell(Grid.toCell(p.x), Grid.toCell(p.z));
      const y = c.kind === 'void' ? p.y : c.h;
      w.addEntity(new WeedSplash(w, p.x, y, p.z));
      if (this.tier >= 3) {
        const ahead = this.lead(0.9);
        w.addEntity(new WeedSplash(w, ahead.x, y, ahead.z));
      }
      const b = this.body;
      w.soundAt('enemyShoot', b.x, b.z, 1.4, 20);
      w.particles.emit(b.x, b.y - 0.6, b.z, { count: 14, color: SPRAY, speed: 3, life: 0.5, size: 0.35, gravity: 6 });
    }

    private pose(dt: number) {
      const b = this.body;
      const warn = this.mode === 'warn';
      this.facePlayer(dt, 4);
      this.m.rotor.rotation.y += dt * (warn ? 30 : 18);
      this.m.tank.emissiveIntensity = warn ? 2.5 + Math.sin(this.t * 40) * 1.2 : 0.4;
      const snip = Math.sin(this.t * (this.aggro ? 14 : 6)) * 0.25;
      this.m.shears[0].rotation.y = snip;
      this.m.shears[1].rotation.y = -snip;
      this.m.body.rotation.x = warn ? 0.35 : 0.08;
      this.m.body.rotation.z = Math.sin(this.t * 1.7) * 0.08;
      if (warn && Math.random() < dt * 20) this.world.particles.emit(b.x, b.y - 0.6, b.z, { count: 1, color: SPRAY, speed: 0.6, life: 0.4, size: 0.25, gravity: 4 });
      const shadow = this.m.parts.shadow;
      const c = this.world.grid.cell(Grid.toCell(b.x), Grid.toCell(b.z));
      shadow.visible = c.kind !== 'void';
      shadow.position.y = c.h - b.y + 0.03;
    }
  };
}
