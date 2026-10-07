/**
 * General Brennus's old Thorn Legion robots, the ones Aeëtes stole and painted gold. They still know
 * their old general's voice: at a command post (`legion.ts`) Brennus can march one onto a heavy plate,
 * or turn a whole squad back to his side (`AllyBot`).
 */
import * as THREE from 'three';

import { audio } from '../../core/audio';
import { CELL, STEP_UP } from '../../core/constants';
import { damp, dampAngle } from '../../core/math';
import type { World } from '../../game/world';
import { Grid } from '../../world/grid';
import type { EnemyModel } from '../aliens';
import { Entity } from '../entity';
import { glowSprite, mat, mesh, torus } from '../models';
import { makeTrooper, paintRobot } from '../robotModels';
import { legionWorld, type HeavyPlate } from './legion';

const WALK = 2.6;

/** Steps of a walk across the grid from one cell to the nearest cell holding a heavy plate (breadth first). */
export function pathToPlate(world: World, cx: number, cz: number, plates: { cx: number; cz: number }[]): [number, number][] | null {
  const g = world.grid;
  const key = (x: number, z: number) => z * g.width + x;
  const goal = new Set(plates.map((p) => key(p.cx, p.cz)));
  const prev = new Map<number, number>([[key(cx, cz), -1]]);
  const queue: [number, number][] = [[cx, cz]];
  for (let q = 0; q < queue.length; q++) {
    const [x, z] = queue[q];
    if (goal.has(key(x, z))) {
      const out: [number, number][] = [];
      for (let k = key(x, z); k >= 0; k = prev.get(k) ?? -1) out.push([k % g.width, Math.floor(k / g.width)]);
      return out.reverse();
    }
    const h = g.cell(x, z).h;
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const nz = z + dz;
      const c = g.cell(nx, nz);
      if (!g.inside(nx, nz) || prev.has(key(nx, nz))) continue;
      if ((c.kind !== 'floor' && c.kind !== 'grate' && c.kind !== 'ice') || Math.abs(c.h - h) > STEP_UP) continue;
      prev.set(key(nx, nz), key(x, z));
      queue.push([nx, nz]);
    }
  }
  return null;
}

/** A gold Legion robot standing idle, waiting for its orders: on its post's flag it marches onto the nearest plate. */
export class LegionBot extends Entity {
  private model: EnemyModel;
  private pos: THREE.Vector3;
  private path: [number, number][] | null = null;
  private step = 0;
  private yaw = Math.PI;
  private stride = 0;
  private parked = false;
  private plate: HeavyPlate | null = null;

  constructor(
    world: World,
    id: string,
    cx: number,
    cz: number,
    h: number,
    readonly flag: string,
  ) {
    super(world, id);
    this.model = makeTrooper();
    paintRobot(this.model.root, 'gold');
    this.pos = new THREE.Vector3(Grid.center(cx), h, Grid.center(cz));
    this.obj.add(this.model.root);
    this.place();
  }

  private place() {
    this.model.root.position.copy(this.pos);
    this.model.root.rotation.y = this.yaw;
  }

  private nearestPlate(): HeavyPlate | null {
    const plates = legionWorld(this.world).plates.filter((p) => !p.heldBy);
    let best: HeavyPlate | null = null;
    let bd = Infinity;
    for (const p of plates) {
      const d = p.spot.distanceTo(this.pos);
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
    return best;
  }

  /** Arrives (or, on a resumed level, is already standing) on its plate. */
  private park(p: HeavyPlate) {
    this.parked = true;
    this.plate = p;
    p.heldBy = this;
    this.pos.copy(p.spot).setY(p.spot.y + 0.06);
    this.place();
  }

  update(dt: number) {
    const m = this.model;
    const t = this.world.time;
    if (this.parked) {
      // Standing to attention on the plate, its lens glowing green: it's on Brennus's side now.
      m.body.position.y = 0;
      const lens = m.mats?.lens;
      if (lens) lens.emissive.set('#3dff8a');
      return;
    }
    if (!this.world.hasFlag(this.flag)) {
      // Idle: a little look around now and then.
      m.parts.gun.rotation.y = Math.sin(t * 0.7) * 0.2;
      return;
    }
    if (!this.path) {
      const plates = legionWorld(this.world).plates.filter((p) => !p.heldBy);
      const target = this.nearestPlate();
      this.path = pathToPlate(this.world, Grid.toCell(this.pos.x), Grid.toCell(this.pos.z), plates) ?? [];
      this.step = 0;
      if (!this.path.length && target) this.park(target);
      audio.play('blip', 1.8);
      return;
    }
    const next = this.path[this.step];
    if (!next) {
      const plate = legionWorld(this.world).plates.find((p) => !p.heldBy && Grid.toCell(this.pos.x) === p.cx && Grid.toCell(this.pos.z) === p.cz) ?? this.nearestPlate();
      if (plate) this.park(plate);
      return;
    }
    const tx = Grid.center(next[0]);
    const tz = Grid.center(next[1]);
    const dx = tx - this.pos.x;
    const dz = tz - this.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.08) this.step += 1;
    else {
      const s = Math.min(d, WALK * dt);
      this.pos.x += (dx / d) * s;
      this.pos.z += (dz / d) * s;
      this.yaw = dampAngle(this.yaw, Math.atan2(dx, dz), 8, dt);
    }
    this.pos.y = damp(this.pos.y, this.world.grid.cell(Grid.toCell(this.pos.x), Grid.toCell(this.pos.z)).h, 12, dt);
    this.stride += dt * 8;
    const legs = m.limbs ?? [];
    if (legs[0]) legs[0].rotation.x = Math.sin(this.stride) * 0.6;
    if (legs[1]) legs[1].rotation.x = -Math.sin(this.stride) * 0.6;
    m.body.position.y = Math.abs(Math.cos(this.stride)) * 0.05;
    this.place();
    if (Math.random() < 0.1) this.world.particles.emit(this.pos.x, this.pos.y + 0.1, this.pos.z, { count: 1, color: '#c8b8a0', speed: 1, life: 0.4, size: 0.4, up: 0.5 });
  }

  /** The plate it is standing on (for tests and the reach checker's sake: one robot, one plate). */
  get onPlate() {
    return this.plate;
  }
}

/**
 * A Legion robot back on its old general's side: olive paint again and a green lens. It stays near the
 * place it was turned, and fires at Aeëtes's machines there (it never gets hurt; it's a friend).
 */
export class AllyBot extends Entity {
  private model: EnemyModel;
  private pos: THREE.Vector3;
  private home: THREE.Vector3;
  private yaw: number;
  private cd = 0.8;
  private stride = 0;

  constructor(world: World, x: number, y: number, z: number, yaw: number) {
    super(world, `ally${Math.random()}`);
    this.model = makeTrooper();
    paintRobot(this.model.root, 'legion');
    const lens = this.model.mats?.lens;
    if (lens) {
      lens.color.set('#3dff8a');
      lens.emissive.set('#3dff8a');
    }
    // A green ring over its head: "friend".
    const ring = mesh(torus(0.32, 0.04), mat('#3dff8a', { emissive: '#3dff8a', ei: 1.6 }), 0, 2.35, 0, false);
    ring.rotation.x = Math.PI / 2;
    this.model.root.add(ring, glowSprite('#3dff8a', 1.2, 0.5).translateY(2.35));
    this.pos = new THREE.Vector3(x, y, z);
    this.home = this.pos.clone();
    this.yaw = yaw;
    this.obj.add(this.model.root);
    world.particles.emit(x, y + 1.2, z, { count: 24, color: '#3dff8a', speed: 4, life: 0.6, size: 0.5 });
    world.rings.burst(x, y + 0.05, z, 3, '#3dff8a', 0.4);
    legionWorld(world).allies.push(this);
  }

  update(dt: number) {
    const w = this.world;
    const enemy = w.nearestEnemy(this.pos.x, this.pos.z, 14);
    const p = w.player.body;
    let goal: THREE.Vector3 | null = null;
    if (enemy) {
      this.yaw = dampAngle(this.yaw, Math.atan2(enemy.aim.x - this.pos.x, enemy.aim.z - this.pos.z), 6, dt);
      if (enemy.aim.distanceTo(this.pos) > 7) goal = enemy.aim;
      this.cd -= dt;
      if (this.cd <= 0) {
        this.cd = 1.3;
        const from = new THREE.Vector3(this.pos.x + Math.sin(this.yaw) * 0.9, this.pos.y + 1.1, this.pos.z + Math.cos(this.yaw) * 0.9);
        const dir = enemy.aim.clone().sub(from).normalize();
        w.shots.fire('player', from, dir, 16, 1);
        w.soundAt('enemyShoot', this.pos.x, this.pos.z, 1.4, 20);
      }
    } else if (Math.hypot(p.x - this.pos.x, p.z - this.pos.z) > 4) goal = new THREE.Vector3(p.x, p.y, p.z);
    let moving = false;
    if (goal) {
      const dx = goal.x - this.pos.x;
      const dz = goal.z - this.pos.z;
      const d = Math.hypot(dx, dz) || 1;
      const nx = this.pos.x + (dx / d) * 2.6 * dt;
      const nz = this.pos.z + (dz / d) * 2.6 * dt;
      const c = w.grid.cell(Grid.toCell(nx), Grid.toCell(nz));
      // It keeps to its own patch of ground, and never steps off a ledge.
      const leash = Math.hypot(nx - this.home.x, nz - this.home.z) < CELL * 5;
      if (leash && (c.kind === 'floor' || c.kind === 'grate') && Math.abs(c.h - this.pos.y) <= STEP_UP) {
        this.pos.x = nx;
        this.pos.z = nz;
        this.pos.y = damp(this.pos.y, c.h, 12, dt);
        moving = true;
        if (!enemy) this.yaw = dampAngle(this.yaw, Math.atan2(dx, dz), 6, dt);
      }
    }
    const m = this.model;
    if (moving) this.stride += dt * 8;
    const legs = m.limbs ?? [];
    if (legs[0]) legs[0].rotation.x = moving ? Math.sin(this.stride) * 0.6 : 0;
    if (legs[1]) legs[1].rotation.x = moving ? -Math.sin(this.stride) * 0.6 : 0;
    m.root.position.copy(this.pos);
    m.root.rotation.y = this.yaw;
  }
}
