/**
 * Brennus's Last Stand: the lines he holds while the Argo flies in (`hold` entities), and the Argo's
 * approach bar on the HUD. A hold starts once its command post has woken the Legion's dock guns and
 * Brennus steps into its zone: Aeëtes's dropships bring their robots one by one while the Argo comes
 * closer. It only comes at full speed while the bridge is (nearly) clear, so fighting back helps.
 */
import * as THREE from 'three';

import { audio } from '../../core/audio';
import { haptic } from '../../core/bridge';
import { CELL } from '../../core/constants';
import type { World } from '../../game/world';
import { Grid } from '../../world/grid';
import type { Spec } from '../../world/levelTypes';
import type { Enemy } from '../enemies';
import { Entity } from '../entity';
import { glowSprite, mat, mesh, ownMat, sphere, cyl, torus } from '../models';
import { Dropship, Fleet } from './ships';

type HoldSpec = Extract<Spec, { type: 'hold' }>;

/** How the Argo's speed drops while Aeëtes's robots crowd the bridge (alive robots -> speed). */
export function argoPace(alive: number): number {
  return alive <= 2 ? 1 : alive <= 4 ? 0.5 : 0.2;
}

/** The time between two dropships at the least, and the most robots a hold lets loose at once. */
export const HOLD_TUNING = { firstDrop: 2, gap: 5, maxAlive: 5, retreat: 1.4 };

interface StandWorld {
  holds: Hold[];
  fleet: Fleet | null;
}

const registry = new WeakMap<World, StandWorld>();

function standWorld(world: World): StandWorld {
  let r = registry.get(world);
  if (!r) {
    r = { holds: [], fleet: null };
    registry.set(world, r);
  }
  return r;
}

/**
 * The Argo's approach bar: how far it has come (0..1), and whether Aeëtes's robots are slowing it
 * down right now. Null on every level without lines to hold.
 */
export function argoBar(world: World): { frac: number; slowed: boolean } | null {
  const r = registry.get(world);
  if (!r?.holds.length || world.vehicle) return null;
  if (world.hasFlag('boss')) return { frac: 1, slowed: false };
  let frac = 0;
  let slowed = false;
  for (const h of r.holds) {
    frac = Math.max(frac, h.argoAt);
    if (h.active) slowed = h.pace < 1;
  }
  return { frac, slowed };
}

/** Brennus was knocked out: every hold under way starts again when he comes back. */
export function resetHolds(world: World) {
  for (const h of registry.get(world)?.holds ?? []) h.reset();
}

type State = 'waiting' | 'active' | 'retreat' | 'done';

export class Hold extends Entity {
  private state: State = 'waiting';
  /** How far along this stretch the Argo is (0..1), and the time since the hold began. */
  private p = 0;
  private t = 0;
  private launched = 0;
  private lastDrop = -99;
  private robots: Enemy[] = [];
  private ships: Dropship[] = [];
  private cells: [number, number][] = [];
  private center: THREE.Vector3;
  private beacon = new THREE.Group();
  private lamp: THREE.MeshStandardMaterial;
  private halo: THREE.Sprite;
  pace = 1;

  constructor(
    world: World,
    id: string,
    private cx: number,
    private cz: number,
    h: number,
    private spec: HoldSpec,
  ) {
    super(world, id);
    this.center = new THREE.Vector3(Grid.center(cx), h, Grid.center(cz));
    const g = world.grid;
    for (let z = cz - Math.floor(spec.d / 2); z <= cz + Math.floor(spec.d / 2); z++) {
      for (let x = cx - Math.floor(spec.w / 2); x <= cx + Math.floor(spec.w / 2); x++) {
        const c = g.cell(x, z);
        if (!g.inside(x, z) || (c.kind !== 'floor' && c.kind !== 'grate') || Math.abs(c.h - h) > 1) continue;
        // Only cells with solid ground all round, so nobody lands on the edge of a drop.
        const safe = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].every(([dx, dz]) => {
          const n = g.cell(x + dx, z + dz);
          return n.kind === 'floor' || n.kind === 'grate' || n.kind === 'wall';
        });
        if (safe) this.cells.push([x, z]);
      }
    }
    // The beacon in the middle of the line: a Gardener lamp post, red while Aeëtes holds it, green once it is held.
    this.lamp = ownMat('#ff3a4c', { emissive: '#ff3a4c', ei: 1.4 });
    this.beacon.position.copy(this.center);
    this.beacon.add(mesh(cyl(0.35, 0.45, 0.3, 12), mat('#e8e0d0', { rough: 0.6 }), 0, 0.15, 0));
    this.beacon.add(mesh(cyl(0.1, 0.12, 3.4, 8), mat('#c9a24a', { metal: 0.7, rough: 0.3 }), 0, 1.9, 0));
    this.beacon.add(mesh(sphere(0.32, 14), this.lamp, 0, 3.75, 0, false));
    this.beacon.add(mesh(torus(0.42, 0.05), mat('#c9a24a', { metal: 0.7, rough: 0.3 }), 0, 3.75, 0, false).rotateX(Math.PI / 2));
    this.halo = glowSprite('#ff3a4c', 2.6, 0.5);
    this.halo.position.y = 3.75;
    this.beacon.add(this.halo);
    this.obj.add(this.beacon);
    const sw = standWorld(world);
    sw.holds.push(this);
    if (!sw.fleet) {
      sw.fleet = world.addEntity(new Fleet(world, (world.level.width * CELL) / 2, (world.level.depth * CELL) / 2, world.level.width * CELL, world.level.depth * CELL, h));
    }
    if (world.hasFlag(spec.flag)) this.finish(true);
  }

  get active() {
    return this.state === 'active';
  }

  /** Where the Argo is on its whole way in (0..1), as far as this hold goes. */
  get argoAt() {
    const [a, b] = this.spec.argo;
    if (this.state === 'done') return b;
    if (this.state === 'waiting') return this.world.cond(this.spec.start) ? a : 0;
    return a + (b - a) * Math.min(1, this.p);
  }

  private inZone() {
    const p = this.world.player.body;
    return Math.abs(Grid.toCell(p.x) - this.cx) <= this.spec.w / 2 && Math.abs(Grid.toCell(p.z) - this.cz) <= this.spec.d / 2 && Math.abs(p.y - this.center.y) < 3;
  }

  private aliveRobots() {
    return this.robots.filter((e) => e.alive).length;
  }

  reset() {
    if (this.state === 'done') return;
    for (const s of this.ships) if (s.alive) s.remove();
    this.ships = [];
    this.robots = [];
    this.state = 'waiting';
    this.p = 0;
    this.t = 0;
    this.launched = 0;
    this.lastDrop = -99;
  }

  private begin() {
    this.state = 'active';
    this.p = 0;
    this.t = 0;
    audio.play('alarm', 0.9, 0.6);
    this.world.hooks.toast('Here come Aeëtes’s dropships! Hold the line until the Argo gets here!', 'brennus');
  }

  /** A dropship for the next group of robots, to a spot not right on top of Brennus. */
  private launch() {
    const drop = this.spec.drops[this.launched];
    this.launched += 1;
    this.lastDrop = this.t;
    const pb = this.world.player.body;
    const far = this.cells.filter(([x, z]) => Math.hypot(Grid.center(x) - pb.x, Grid.center(z) - pb.z) > 7);
    const pool = far.length ? far : this.cells;
    const [x, z] = pool[Math.floor(Math.random() * pool.length)];
    const near = this.cells.filter(([nx, nz]) => Math.abs(nx - x) <= 1 && Math.abs(nz - z) <= 1);
    const c = this.world.grid.cell(x, z);
    const spot = new THREE.Vector3(Grid.center(x), c.h, Grid.center(z));
    const ship = new Dropship(this.world, spot, near, drop.enemy, drop.n, drop.variant, this.spec.room, (e) => this.robots.push(e));
    this.ships.push(this.world.addEntity(ship));
  }

  /** The Argo is through this stretch: the robots still here run for their ships, and the beacon goes green. */
  private finish(quiet = false) {
    this.state = 'done';
    this.lamp.color.set('#3dff8a');
    this.lamp.emissive.set('#3dff8a');
    this.halo.material.color.set('#3dff8a');
    if (quiet) return;
    const w = this.world;
    w.setFlag(this.spec.flag);
    audio.play('success');
    haptic('success');
    w.rings.burst(this.center.x, this.center.y + 0.05, this.center.z, 9, '#3dff8a', 0.7);
    w.flash(this.center.x, this.center.y + 3.7, this.center.z, '#3dff8a', 60, 0.6);
    w.hooks.toast('Line held! The Argo is getting closer!', 'brennus');
    w.hooks.checkpoint();
  }

  update(dt: number) {
    const w = this.world;
    this.halo.material.opacity = 0.4 + Math.sin(w.time * 3) * 0.15;
    if (this.state === 'done') return;
    if (this.state === 'waiting') {
      if (w.cond(this.spec.start) && !w.cutscene && this.inZone()) this.begin();
      return;
    }
    if (w.cutscene) return;
    this.t += dt;
    const alive = this.aliveRobots();
    if (this.state === 'retreat') {
      // Every robot left behind is beamed back up to the fleet.
      if (this.t >= HOLD_TUNING.retreat) {
        for (const e of this.robots) {
          if (!e.alive) continue;
          w.particles.emit(e.aim.x, e.aim.y, e.aim.z, { count: 18, color: '#ffd166', speed: 4, up: 4, life: 0.6, size: 0.5 });
          e.remove();
          w.enemyDied(e);
        }
        this.finish();
      }
      return;
    }
    this.pace = argoPace(alive);
    this.p += (dt / this.spec.time) * this.pace;
    const n = this.spec.drops.length;
    const due = this.launched < n && this.t >= HOLD_TUNING.firstDrop && this.t - this.lastDrop >= HOLD_TUNING.gap && this.p >= this.launched / n - 0.02 && alive < HOLD_TUNING.maxAlive;
    if (due) this.launch();
    if (this.p >= 1 && this.launched >= n) {
      this.p = 1;
      this.state = 'retreat';
      this.t = 0;
      if (alive) w.hooks.toast('Aeëtes’s robots are running back to their ships!', 'brennus');
    }
  }
}
