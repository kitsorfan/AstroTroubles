/**
 * General Brennus's puzzle props (his own levels): cracked walls only his big blast or his charge can
 * smash, heavy plates, and the Legion command posts where his old robots obey his voice (the robots
 * themselves are in `legionBots.ts`).
 */
import * as THREE from 'three';

import { audio } from '../../core/audio';
import { haptic } from '../../core/bridge';
import { CELL } from '../../core/constants';
import type { World } from '../../game/world';
import type { Box } from '../../world/physics';
import { Entity, type HitKind, type Interactable, type Target } from '../entity';
import { boxG, cyl, glowSprite, mat, mesh, ownMat, sphere, torus } from '../models';
import { gearEmblem } from '../robotModels';
import type { AllyBot } from './legionBots';

const center = (c: number) => c * CELL + CELL / 2;

/** Per-world lookups for Brennus's puzzles: the heavy plates, the robots on his side, and one-time hints. */
export interface LegionWorld {
  plates: HeavyPlate[];
  allies: AllyBot[];
  hints: Set<string>;
}

const registry = new WeakMap<World, LegionWorld>();

export function legionWorld(world: World): LegionWorld {
  let r = registry.get(world);
  if (!r) {
    r = { plates: [], allies: [], hints: new Set() };
    registry.set(world, r);
  }
  return r;
}

/** Shows a toast only the first time on this level. */
function hintOnce(world: World, key: string, show: () => void) {
  const h = legionWorld(world).hints;
  if (h.has(key)) return;
  h.add(key);
  show();
}

/* ---------------- cracked wall ---------------- */

let crackTex: THREE.CanvasTexture | null = null;

/** Grey-brown rock split by glowing gold cracks. */
function crackTexture(): THREE.CanvasTexture {
  if (crackTex) return crackTex;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.fillStyle = '#6a5a4c';
  g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 40; i++) {
    g.fillStyle = i % 2 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.06)';
    g.fillRect(Math.random() * 128, Math.random() * 128, 6 + Math.random() * 14, 4 + Math.random() * 8);
  }
  g.lineCap = 'round';
  for (const [w, col] of [
    [7, '#3a2a18'],
    [3, '#ffc94a'],
  ] as [number, string][]) {
    g.strokeStyle = col;
    g.lineWidth = w;
    for (let i = 0; i < 5; i++) {
      g.beginPath();
      let x = 64;
      let y = 64;
      g.moveTo(x, y);
      const a = (i / 5) * Math.PI * 2 + 0.3;
      for (let k = 0; k < 4; k++) {
        x += Math.cos(a + (k % 2 ? 0.5 : -0.4)) * 16;
        y += Math.sin(a + (k % 2 ? 0.5 : -0.4)) * 16;
        g.lineTo(x, y);
      }
      g.stroke();
    }
  }
  crackTex = new THREE.CanvasTexture(c);
  crackTex.colorSpace = THREE.SRGBColorSpace;
  return crackTex;
}

/** A cracked rock wall veined with gold: one big blast or one charge smashes it, anything else just pings off. */
export class CrackedWall extends Entity implements Target {
  readonly aim: THREE.Vector3;
  radius = 1.2;
  aimable = false;
  private box: Box;
  private block: THREE.Mesh;
  private wobble = 0;

  constructor(world: World, id: string, cx: number, cz: number, h: number) {
    super(world, id);
    const x = center(cx);
    const z = center(cz);
    this.aim = new THREE.Vector3(x, h + 1, z);
    const m = new THREE.MeshStandardMaterial({ map: crackTexture(), emissive: '#ffb020', emissiveMap: crackTexture(), emissiveIntensity: 0.35, roughness: 0.85 });
    this.block = mesh(boxG(CELL, 3.6, CELL), m, x, h + 1.8, z);
    this.obj.add(this.block);
    this.obj.add(glowSprite('#ffc94a', 2.4, 0.25).translateX(x).translateY(h + 1.6).translateZ(z));
    this.box = { minX: x - CELL / 2, maxX: x + CELL / 2, minZ: z - CELL / 2, maxZ: z + CELL / 2, bottom: h - 1, top: h + 60, solid: true, dx: 0, dy: 0, dz: 0, owner: this };
    world.boxes.push(this.box);
    world.addTarget(this);
  }

  hit(_dmg: number, kind: HitKind): boolean {
    if (!this.alive) return false;
    // Only General Brennus is strong enough: his big cannon blast or his charge (Jason's fireball just scorches it).
    const brennus = this.world.player.hero === 'brennus';
    if (kind !== 'smash' && !(kind === 'blast' && brennus)) {
      this.wobble = 1;
      audio.play('zap', 2.2, 0.5);
      // (Only when the hero is close by: stray shots from far away, or from his robots, say nothing.)
      const b = this.world.player.body;
      if (Math.hypot(b.x - this.aim.x, b.z - this.aim.z) > 12) return true;
      if (brennus) hintOnce(this.world, 'cracked', () => this.world.hooks.toast('Too tough! HOLD the CANNON for a big blast, or CHARGE into it.', 'bolt'));
      else hintOnce(this.world, 'crackedHero', () => this.world.hooks.toast('Too tough for us! Only General Brennus can smash cracked rock: his big CANNON blast, or his CHARGE.', 'bolt'));
      return true;
    }
    const w = this.world;
    audio.play('explode');
    audio.play('break', 0.7);
    haptic('heavy');
    w.shake(0.5);
    w.particles.emit(this.aim.x, this.aim.y, this.aim.z, { count: 40, color: '#7a6a5a', speed: 8, life: 0.9, size: 0.9, up: 3 });
    w.particles.emit(this.aim.x, this.aim.y, this.aim.z, { count: 16, color: '#ffc94a', speed: 6, life: 0.6, size: 0.45, up: 2 });
    w.boxes.splice(w.boxes.indexOf(this.box), 1);
    w.removeTarget(this);
    w.markTaken(this.id);
    this.remove();
    return true;
  }

  update(dt: number) {
    this.wobble = Math.max(0, this.wobble - dt * 3);
    this.block.position.x = this.aim.x + Math.sin(this.world.time * 50) * 0.05 * this.wobble;
  }
}

/* ---------------- heavy plate ---------------- */

/**
 * A big brass pressure plate. It sets its flag while something heavy stands on it: Brennus himself
 * (only while he stays), or one of his robots (for good, once it marches onto it).
 */
export class HeavyPlate extends Entity {
  readonly spot: THREE.Vector3;
  /** The robot standing on it for good. */
  heldBy: unknown = null;
  private pressed = false;
  private top: THREE.Group;
  private ring: THREE.MeshStandardMaterial;
  private hinted = false;

  constructor(
    world: World,
    id: string,
    readonly cx: number,
    readonly cz: number,
    h: number,
    readonly flag: string,
  ) {
    super(world, id);
    this.spot = new THREE.Vector3(center(cx), h, center(cz));
    this.obj.position.copy(this.spot);
    this.obj.add(mesh(cyl(0.95, 1, 0.12, 24), mat('#2a2622', { rough: 0.7, metal: 0.4 }), 0, 0.06, 0));
    this.top = new THREE.Group();
    this.ring = ownMat('#c8282e', { emissive: '#c8282e', ei: 0.8 });
    this.top.add(mesh(cyl(0.8, 0.82, 0.12, 24), mat('#c9a24a', { metal: 0.75, rough: 0.3 }), 0, 0, 0));
    this.top.add(mesh(torus(0.82, 0.05), this.ring, 0, 0.05, 0, false).rotateX(Math.PI / 2));
    const g = gearEmblem(0.32, mat('#7a5a20', { metal: 0.6, rough: 0.4 }));
    g.rotation.x = -Math.PI / 2;
    g.position.y = 0.07;
    this.top.add(g);
    this.top.position.y = 0.16;
    this.obj.add(this.top);
    legionWorld(world).plates.push(this);
  }

  private brennusOn(): boolean {
    const pl = this.world.player;
    const b = pl.body;
    // Only the old general is heavy enough (Jason and Atalanta are far too light).
    return pl.hero === 'brennus' && b.grounded && Math.abs(b.x - this.spot.x) < CELL * 0.55 && Math.abs(b.z - this.spot.z) < CELL * 0.55 && Math.abs(b.y - this.spot.y) < 0.6;
  }

  update(dt: number) {
    const on = this.heldBy !== null || this.brennusOn();
    if (on !== this.pressed) {
      this.pressed = on;
      if (on) this.world.setFlag(this.flag);
      else this.world.clearFlag(this.flag);
      audio.play(on ? 'door' : 'blip', on ? 1.4 : 0.8);
      this.world.particles.emit(this.spot.x, this.spot.y + 0.3, this.spot.z, { count: 10, color: on ? '#3dff8a' : '#ff4f5e', speed: 3, life: 0.4, size: 0.4 });
      if (on && !this.heldBy && !this.hinted) {
        this.hinted = true;
        hintOnce(this.world, 'plate', () => this.world.hooks.toast('The plate only holds while something heavy stands on it. Find a robot to stand here for you!', 'bolt'));
      }
    }
    this.top.position.y = THREE.MathUtils.damp(this.top.position.y, on ? 0.06 : 0.16, 10, dt);
    this.ring.emissive.set(on ? '#3dff8a' : '#c8282e');
    this.ring.color.set(on ? '#3dff8a' : '#c8282e');
  }
}

/* ---------------- command post ---------------- */

/**
 * A Legion command post: a little brass lectern with Brennus's red gear and a loudspeaker. Brennus
 * walks up and gives the order (COMMAND), and his old robots obey (see `legionBots.ts`).
 */
export class CommandPost extends Entity implements Interactable {
  readonly spot: THREE.Vector3;
  range = 2.6;
  private lamp: THREE.MeshStandardMaterial;
  private glow: THREE.Sprite;
  private used = false;

  constructor(
    world: World,
    id: string,
    cx: number,
    cz: number,
    h: number,
    readonly flag: string,
    readonly order: 'plate' | 'carry' | 'fight' | 'guns',
    readonly room?: string,
  ) {
    super(world, id);
    this.spot = new THREE.Vector3(center(cx), h, center(cz));
    const g = new THREE.Group();
    g.position.copy(this.spot);
    const olive = mat('#4a5632', { rough: 0.6, metal: 0.3 });
    const brass = mat('#c9a24a', { metal: 0.75, rough: 0.3 });
    g.add(mesh(cyl(0.5, 0.6, 0.2, 12), mat('#2a2622', { rough: 0.7 }), 0, 0.1, 0));
    g.add(mesh(cyl(0.12, 0.16, 1.1, 10), olive, 0, 0.75, 0));
    const desk = mesh(boxG(0.9, 0.12, 0.6), olive, 0, 1.32, 0);
    desk.rotation.x = -0.35;
    g.add(desk);
    g.add(mesh(boxG(0.94, 0.04, 0.64), brass, 0, 1.38, 0.01, false).rotateX(-0.35));
    const gear = gearEmblem(0.22, mat('#c8282e', { emissive: '#c8282e', ei: 0.6 }));
    gear.position.set(0, 1.0, 0.18);
    g.add(gear);
    // The loudspeaker horn on a stalk.
    g.add(mesh(cyl(0.03, 0.03, 0.9, 6), brass, 0.36, 1.7, -0.2));
    const horn = mesh(cyl(0.22, 0.06, 0.36, 12), brass, 0.36, 2.15, -0.1);
    horn.rotation.x = Math.PI / 2 - 0.3;
    g.add(horn);
    this.lamp = ownMat('#ff3a3a', { emissive: '#ff3a3a', ei: 1.4 });
    g.add(mesh(sphere(0.09, 10), this.lamp, -0.3, 1.5, -0.1, false));
    this.glow = glowSprite('#ff3a3a', 1.2, 0.5);
    this.glow.position.set(-0.3, 1.5, -0.1);
    g.add(this.glow);
    this.obj.add(g);
    // On a level resumed after the order was given, the post shows it is done.
    if (order !== 'fight' && world.hasFlag(flag)) this.setUsed();
    world.addInteractable(this);
  }

  private setUsed() {
    this.used = true;
    this.lamp.color.set('#3dff8a');
    this.lamp.emissive.set('#3dff8a');
    this.glow.material.color.set('#3dff8a');
  }

  /** Only General Brennus's voice works here; a "fight" post works again while gold robots are left in its room. */
  private get ready() {
    if (this.world.player.hero !== 'brennus') return false;
    if (this.order === 'fight') return this.world.goldRobots(this.room).length > 0;
    return !this.used;
  }

  label() {
    return this.ready ? 'COMMAND' : null;
  }

  interact() {
    const w = this.world;
    w.setFlag(this.flag);
    w.rings.burst(this.spot.x, this.spot.y + 0.05, this.spot.z, 7, '#ff3a3a', 0.5);
    w.rings.burst(this.spot.x, this.spot.y + 2.2, this.spot.z, 4, '#ffd166', 0.4);
    audio.play('alarm', 1.4, 0.5);
    audio.play('success', 0.8);
    haptic('medium');
    if (this.order === 'plate') w.hooks.toast('Legion! Onto that plate, quick march!', 'brennus');
    else if (this.order === 'carry') w.hooks.toast('Hauler! Carry me across. Gently, please.', 'brennus');
    // Brennus's Last Stand: the Legion's dock guns wake up and hold the line with him.
    else if (this.order === 'guns') w.hooks.toast('Legion guns! Wake up and hold this line with me!', 'brennus');
    else {
      const n = w.turnRobots(this.room);
      if (n) w.hooks.toast('Legion! You know my voice. Stand with me!', 'brennus');
    }
    if (this.order !== 'fight') this.setUsed();
  }

  update() {
    if (!this.used) this.glow.material.opacity = 0.35 + Math.sin(this.world.time * 5) * 0.25;
  }
}
