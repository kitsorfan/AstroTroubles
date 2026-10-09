/**
 * Talos's Forge puzzle props, made for the bronze mech: bronze gates only its PUNCH breaks open, and
 * cracked floor plates over cellars that its SLAM (or any heavy landing) smashes through.
 */
import * as THREE from 'three';

import { audio } from '../../core/audio';
import { haptic } from '../../core/bridge';
import { CELL } from '../../core/constants';
import type { World } from '../../game/world';
import type { Box } from '../../world/physics';
import { Entity, type HitKind, type Target } from '../entity';
import { boxG, glowSprite, mat, mesh, ownMat, sphere, torus } from '../models';

const center = (c: number) => c * CELL + CELL / 2;

const hinted = new WeakMap<World, Set<string>>();

/** A hint toast, only the first time on this level. */
function hintOnce(world: World, key: string, text: string) {
  let h = hinted.get(world);
  if (!h) hinted.set(world, (h = new Set()));
  if (h.has(key)) return;
  h.add(key);
  world.hooks.toast(text, 'bolt');
}

/** Bursts a prop apart: shards of bronze, dust, a thump. */
function burst(world: World, at: THREE.Vector3, color: string) {
  audio.play('explode');
  audio.play('break', 0.6);
  haptic('heavy');
  world.shake(0.6);
  world.hitStop(0.06);
  world.particles.emit(at.x, at.y, at.z, { count: 40, color, speed: 8, life: 0.9, size: 0.8, up: 3, gravity: 8 });
  world.particles.emit(at.x, at.y, at.z, { count: 20, color: '#b8a890', speed: 5, life: 0.8, size: 0.9, up: 1 });
}

/* ---------------- bronze gate ---------------- */

/**
 * A heavy bronze gate, a hand thick, with the Gardeners' leaf rivets on it: one cell of wall until the
 * mech PUNCHes it (or blasts it with a big cannon blast). Jason and Atalanta on foot can't dent it.
 */
export class BronzeGate extends Entity implements Target {
  readonly aim: THREE.Vector3;
  radius = 1.2;
  aimable = false;
  private box: Box;
  private door = new THREE.Group();
  private hits = 0;
  private wobble = 0;

  constructor(world: World, id: string, cx: number, cz: number, h: number) {
    super(world, id);
    const x = center(cx);
    const z = center(cz);
    this.aim = new THREE.Vector3(x, h + 1.2, z);
    const bronze = mat('#b8783a', { rough: 0.35, metal: 0.8 });
    const dark = mat('#5a3a20', { rough: 0.5, metal: 0.6 });
    const patina = mat('#4a9a7a', { rough: 0.7, metal: 0.25 });
    this.door.add(mesh(boxG(CELL, 3.8, CELL * 0.7), bronze, 0, 1.9, 0));
    this.door.add(mesh(boxG(CELL + 0.06, 0.25, CELL * 0.74), dark, 0, 3.7, 0));
    this.door.add(mesh(boxG(CELL + 0.06, 0.18, CELL * 0.74), patina, 0, 0.1, 0, false));
    // Rivets and a big leaf boss in the middle, on both faces.
    for (const sz of [-1, 1]) {
      const face = sz * CELL * 0.36;
      this.door.add(mesh(torus(0.42, 0.08), dark, 0, 1.9, face, false));
      this.door.add(mesh(sphere(0.2, 10), patina, 0, 1.9, face, false));
      for (const [rx, ry] of [
        [-0.7, 0.5],
        [0.7, 0.5],
        [-0.7, 3.2],
        [0.7, 3.2],
      ]) {
        this.door.add(mesh(sphere(0.09, 8), dark, rx, ry, face, false));
      }
    }
    this.door.position.set(x, h, z);
    this.obj.add(this.door);
    this.box = { minX: x - CELL / 2, maxX: x + CELL / 2, minZ: z - CELL / 2, maxZ: z + CELL / 2, bottom: h - 1, top: h + 60, solid: true, dx: 0, dy: 0, dz: 0, owner: this };
    world.boxes.push(this.box);
    world.addTarget(this);
  }

  hit(_dmg: number, kind: HitKind): boolean {
    if (!this.alive) return false;
    const mech = this.world.player.hero === 'mech';
    if (!mech || (kind !== 'smash' && kind !== 'blast')) {
      this.wobble = 0.5;
      audio.play('zap', 1.5, 0.5);
      hintOnce(this.world, 'gate', mech ? 'Bronze is tough! PUNCH it (the SPIN button).' : 'Solid bronze, a hand thick. Nothing on foot can open this.');
      return true;
    }
    // Two punches: the first dents it, the second knocks it flat.
    this.hits += 1;
    this.wobble = 1;
    if (this.hits < 2 && kind === 'smash') {
      audio.play('pound', 0.8);
      this.world.shake(0.3);
      this.door.rotation.z = 0.04;
      return true;
    }
    const w = this.world;
    burst(w, this.aim, '#d8944a');
    w.boxes.splice(w.boxes.indexOf(this.box), 1);
    w.removeTarget(this);
    w.markTaken(this.id);
    this.remove();
    return true;
  }

  update(dt: number) {
    this.wobble = Math.max(0, this.wobble - dt * 3);
    this.door.position.x = this.aim.x + Math.sin(this.world.time * 50) * 0.06 * this.wobble;
  }
}

/* ---------------- cracked floor plate ---------------- */

/**
 * A cracked iron floor plate at `lid` over a cellar (the cell's own floor, far below). It holds anyone
 * walking on it; the mech's SLAM, or a heavy landing, breaks it and drops the mech into the cellar.
 */
export class BrittleFloor extends Entity implements Target {
  readonly aim: THREE.Vector3;
  radius = 1;
  aimable = false;
  private box: Box;
  private plate = new THREE.Group();
  private glow: THREE.MeshStandardMaterial;

  constructor(world: World, id: string, cx: number, cz: number, lid: number) {
    super(world, id);
    const x = center(cx);
    const z = center(cz);
    this.aim = new THREE.Vector3(x, lid, z);
    const iron = mat('#4a3e38', { rough: 0.75, metal: 0.4 });
    this.glow = ownMat('#ff9a3a', { emissive: '#ff7a1a', ei: 1.2 });
    const slab = mesh(boxG(CELL, 0.4, CELL), iron, 0, -0.2, 0);
    this.plate.add(slab);
    // Glowing cracks across the top (hot metal shows through).
    for (const [rot, len] of [
      [0.4, 1.7],
      [-0.9, 1.2],
      [1.9, 0.9],
    ]) {
      const crack = mesh(boxG(len, 0.03, 0.07), this.glow, 0, 0.01, 0, false);
      crack.rotation.y = rot;
      this.plate.add(crack);
    }
    this.plate.position.set(x, lid, z);
    this.obj.add(this.plate);
    this.obj.add(glowSprite('#ff9a3a', 1.6, 0.18).translateX(x).translateY(lid + 0.2).translateZ(z));
    this.box = { minX: x - CELL / 2, maxX: x + CELL / 2, minZ: z - CELL / 2, maxZ: z + CELL / 2, bottom: lid - 0.4, top: lid, solid: true, dx: 0, dy: 0, dz: 0, owner: this };
    world.boxes.push(this.box);
    world.addTarget(this);
  }

  hit(_dmg: number, kind: HitKind): boolean {
    if (!this.alive) return false;
    const w = this.world;
    if (kind !== 'pound' || w.player.hero !== 'mech') {
      if (kind === 'pound') hintOnce(w, 'brittle', 'Not heavy enough! Only something as heavy as a mech can break these plates.');
      return false;
    }
    burst(w, this.aim, '#ff9a3a');
    w.boxes.splice(w.boxes.indexOf(this.box), 1);
    w.removeTarget(this);
    w.markTaken(this.id);
    this.remove();
    return true;
  }

  update() {
    this.glow.emissiveIntensity = 1 + Math.sin(this.world.time * 4 + this.aim.x) * 0.4;
  }
}
