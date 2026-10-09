/**
 * The props of Medusa's Labyrinth: MEDUSA's eye-sentries (stone eyes that shine gaze beams), the
 * Gardeners' turning mirrors, and the light crystals that open doors when a beam lights them.
 */
import * as THREE from 'three';

import { audio } from '../../core/audio';
import { haptic } from '../../core/bridge';
import { CELL, GAZE } from '../../core/constants';
import { damp, dampAngle } from '../../core/math';
import type { World } from '../../game/world';
import type { Box } from '../../world/physics';
import { Entity, type HitKind, type Target } from '../entity';
import { cone, cyl, glowSprite, mat, mesh, ownMat, sphere, torus, boxG } from '../models';
import { BeamFx, labWorld, traceBeam, type BeamCatcher, type BeamMirror } from './beams';

const center = (c: number) => c * CELL + CELL / 2;
const solidBox = (x: number, z: number, hw: number, bottom: number, top: number, owner: unknown): Box => ({ minX: x - hw, maxX: x + hw, minZ: z - hw, maxZ: z + hw, bottom, top, solid: true, dx: 0, dy: 0, dz: 0, owner });

/** The labyrinth's carved stone, and the green of MEDUSA's gaze. */
export const LAB = {
  stone: '#6f8a72',
  stoneDark: '#3f5446',
  gold: '#e8b84a',
  gaze: '#7dff9a',
};

/** Yaw (around y) that faces a map direction: 0 north, 1 east, 2 south, 3 west. */
export const dirYaw = (dir: 0 | 1 | 2 | 3) => [Math.PI, Math.PI / 2, 0, -Math.PI / 2][dir];

/** A little cable snake: a chain of gold beads with a green-eyed head, waving (for heads and hair). */
export function cableSnake(len: number, r: number): { group: THREE.Group; beads: THREE.Mesh[] } {
  const group = new THREE.Group();
  const gold = mat(LAB.gold, { metal: 0.7, rough: 0.3 });
  const beads: THREE.Mesh[] = [];
  for (let i = 0; i < len; i++) {
    const b = mesh(sphere(r * (1 - i * 0.06), 8), gold, 0, i * r * 1.5, 0, false);
    beads.push(b);
    group.add(b);
  }
  const head = beads[beads.length - 1];
  head.scale.set(1.2, 0.9, 1.5);
  const eye = mat('#c8ffd8', { emissive: LAB.gaze, ei: 2 });
  head.add(mesh(sphere(r * 0.3, 6), eye, r * 0.45, r * 0.25, r * 0.45, false), mesh(sphere(r * 0.3, 6), eye, -r * 0.45, r * 0.25, r * 0.45, false));
  return { group, beads };
}

/** Waves a cable snake's beads like a slow S curve. */
export function waveSnake(beads: THREE.Mesh[], t: number, amp: number, r: number) {
  beads.forEach((b, i) => {
    b.position.x = Math.sin(t * 2.2 + i * 0.9) * amp * (i / beads.length);
    b.position.z = Math.cos(t * 1.7 + i * 0.7) * amp * 0.5 * (i / beads.length);
    b.position.y = i * r * 1.5;
  });
}

/* ---------------- eye-sentry ---------------- */

/**
 * One of MEDUSA's eye-sentries: a carved stone bust with one big green eye and a crown of little cable
 * snakes. Its gaze beam turns heroes to stone for a moment; it can sweep from side to side. Bounce its
 * own gaze back into its eye (with the Mirror Shield, or through mirrors) and it shuts, dazzled.
 */
export class GazeSentry extends Entity implements BeamCatcher {
  readonly pos = new THREE.Vector3();
  readonly radius = 0.8;
  private head = new THREE.Group();
  private iris: THREE.MeshStandardMaterial;
  private lids: THREE.Mesh[] = [];
  private snakes: { beads: THREE.Mesh[] }[] = [];
  private beam = new BeamFx(LAB.gaze);
  private yaw0: number;
  private yaw: number;
  private sweep: number;
  private period: number;
  private t: number;
  /** Seconds left shut after being dazzled. */
  private shut = 0;
  private dir = new THREE.Vector3();
  private origin = new THREE.Vector3();
  private floorY: number;

  constructor(world: World, id: string, cx: number, cz: number, h: number, dir: 0 | 1 | 2 | 3, sweep = 0, period = 6, offset = 0) {
    super(world, id);
    const x = center(cx);
    const z = center(cz);
    this.floorY = h;
    this.yaw0 = this.yaw = dirYaw(dir);
    this.sweep = (sweep * Math.PI) / 180;
    this.period = period;
    this.t = offset;
    const stone = mat(LAB.stone, { rough: 0.9 });
    const dark = mat(LAB.stoneDark, { rough: 0.9 });
    const gold = mat(LAB.gold, { metal: 0.7, rough: 0.3 });
    // The plinth.
    this.obj.add(mesh(cyl(0.62, 0.75, 0.5, 10), dark, x, h + 0.25, z));
    this.obj.add(mesh(cyl(0.42, 0.5, 0.6, 10), stone, x, h + 0.75, z));
    // The head: a round stone face with one great eye, gold brow band and cable-snake hair.
    this.head.position.set(x, h + GAZE.eye, z);
    const face = mesh(sphere(0.62, 16), stone, 0, 0, 0);
    face.scale.set(1, 1, 0.85);
    this.head.add(face);
    this.head.add(mesh(torus(0.6, 0.06), gold, 0, 0.22, 0.02, false).rotateX(Math.PI / 2));
    const white = mesh(sphere(0.3, 14), mat('#eaf6ec', { rough: 0.3 }), 0, 0, 0.42, false);
    white.scale.set(1.2, 0.9, 0.6);
    this.head.add(white);
    this.iris = ownMat('#3dff8a', { emissive: LAB.gaze, ei: 2.2, rough: 0.2 });
    const iris = mesh(sphere(0.16, 12), this.iris, 0, 0, 0.56, false);
    iris.scale.set(1, 1, 0.5);
    this.head.add(iris);
    this.head.add(mesh(sphere(0.07, 8), mat('#08140c'), 0, 0, 0.63, false));
    for (const s of [1, -1]) {
      const lid = mesh(sphere(0.33, 12), stone, 0, s * 0.02, 0.4, false);
      lid.scale.set(1.25, 0.05, 0.75);
      this.lids.push(lid);
      this.head.add(lid);
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const sn = cableSnake(4, 0.09);
      sn.group.position.set(Math.cos(a) * 0.42, 0.38, Math.sin(a) * 0.35 - 0.1);
      sn.group.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.7);
      this.snakes.push(sn);
      this.head.add(sn.group);
    }
    this.head.add(glowSprite(LAB.gaze, 1.6, 0.4).translateZ(0.7));
    this.obj.add(this.head, this.beam.group);
    world.boxes.push(solidBox(x, z, 0.55, h, h + 2, this));
    labWorld(world).catchers.push(this);
  }

  get catching() {
    return this.shut <= 0;
  }

  /** Its own gaze (or any bounced beam) back in its eye: it shuts, dazzled, for a few seconds. */
  catchBeam(_dt: number, bounced: boolean) {
    if (!bounced || this.shut > 0) return;
    this.shut = GAZE.dazzle;
    const w = this.world;
    audio.play('zap', 0.7);
    audio.play('charged', 1.6, 0.6);
    haptic('light');
    w.particles.emit(this.pos.x, this.pos.y, this.pos.z, { count: 26, color: '#ffffff', speed: 5, life: 0.5, size: 0.45 });
    w.rings.burst(this.pos.x, this.floorY + 0.05, this.pos.z, 3, LAB.gaze, 0.35);
  }

  update(dt: number) {
    const w = this.world;
    this.t += dt;
    this.shut = Math.max(0, this.shut - dt);
    const open = this.shut <= 0 ? 1 : 0;
    for (const l of this.lids) l.scale.y = damp(l.scale.y, open ? 0.05 : 1, 10, dt);
    this.iris.emissiveIntensity = open ? 2 + Math.sin(this.t * 6) * 0.4 : 0.2;
    for (const s of this.snakes) for (let i = 0; i < s.beads.length; i++) s.beads[i].rotation.y = Math.sin(this.t * 3 + i) * 0.4;
    if (this.sweep > 0) this.yaw = this.yaw0 + Math.sin((this.t / this.period) * Math.PI * 2) * this.sweep;
    this.head.rotation.y = this.yaw;
    this.dir.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    this.pos.copy(this.head.position).addScaledVector(this.dir, 0.55);
    // Far away (or shut), the beam rests.
    const pb = w.player.body;
    const far = Math.hypot(pb.x - this.pos.x, pb.z - this.pos.z) > 60;
    if (!open || far || w.cutscene) {
      this.beam.hide();
      return;
    }
    this.origin.copy(this.head.position).addScaledVector(this.dir, 0.75);
    const r = traceBeam(w, this.origin, this.dir, this, dt);
    this.beam.show(r.points, r.shielded ? 1 : 0);
  }
}

/* ---------------- turning mirror ---------------- */

/**
 * A Gardener mirror on a bronze stand. It turns any beam a quarter turn; a shot, an arrow or a spin
 * turns the mirror itself a quarter turn ("/" and "\" in turn).
 */
export class MirrorPylon extends Entity implements Target, BeamMirror {
  readonly pos: THREE.Vector3;
  readonly normal = new THREE.Vector3();
  readonly aim: THREE.Vector3;
  readonly radius = 0.8;
  aimable = true;
  private turn: 0 | 1;
  private disc = new THREE.Group();
  private shine: THREE.MeshStandardMaterial;
  private cd = 0;
  private flash = 0;

  constructor(world: World, id: string, cx: number, cz: number, h: number, turn: 0 | 1 = 0) {
    super(world, id);
    const x = center(cx);
    const z = center(cz);
    this.pos = new THREE.Vector3(x, h + GAZE.eye, z);
    this.aim = this.pos.clone();
    this.turn = turn;
    const bronze = mat('#b8864a', { metal: 0.7, rough: 0.35 });
    const dark = mat(LAB.stoneDark, { rough: 0.9 });
    this.obj.add(mesh(cyl(0.65, 0.75, 0.3, 12), dark, x, h + 0.15, z));
    // Turning arrows carved in the base, glowing gold: "you can turn me".
    for (let i = 0; i < 2; i++) {
      const arc = mesh(new THREE.TorusGeometry(0.5, 0.04, 4, 14, Math.PI * 0.6), mat('#ffe08a', { emissive: '#ffb020', ei: 1.2 }), x, h + 0.31, z, false);
      arc.rotation.set(-Math.PI / 2, 0, i * Math.PI);
      this.obj.add(arc);
    }
    this.obj.add(mesh(cyl(0.08, 0.1, 1.1, 8), bronze, x, h + 0.75, z));
    this.disc.position.copy(this.pos);
    this.shine = ownMat('#dff8ff', { emissive: '#7fe6ff', ei: 0.25, metal: 0.95, rough: 0.05 });
    this.disc.add(mesh(cyl(0.62, 0.62, 0.08, 24).rotateX(Math.PI / 2), this.shine, 0, 0, 0.02, false));
    this.disc.add(mesh(cyl(0.66, 0.66, 0.1, 24).rotateX(Math.PI / 2), bronze, 0, 0, -0.04, false));
    this.disc.add(mesh(torus(0.66, 0.06), bronze, 0, 0, 0, false));
    // A Gardener light-word on the back.
    this.disc.add(mesh(boxG(0.3, 0.3, 0.04), mat('#5e9bff', { emissive: '#5e9bff', ei: 1.4 }), 0, 0, -0.1, false));
    this.obj.add(this.disc);
    this.setNormal();
    this.disc.rotation.y = Math.atan2(this.normal.x, this.normal.z);
    world.boxes.push(solidBox(x, z, 0.5, h, h + 2.1, this));
    world.addTarget(this);
    labWorld(world).mirrors.set(cz * world.grid.width + cx, this);
  }

  private setNormal() {
    this.normal.set(1, 0, this.turn === 0 ? 1 : -1).normalize();
  }

  /** A shot, arrow, spin or pound turns it a quarter turn. */
  hit(_dmg: number, _kind: HitKind): boolean {
    if (this.cd > 0) return true;
    this.cd = 0.35;
    this.turn = this.turn === 0 ? 1 : 0;
    this.setNormal();
    this.flash = 1;
    const w = this.world;
    audio.play('shield', 1.5);
    audio.play('bolt', 0.8, 0.5);
    w.particles.emit(this.pos.x, this.pos.y, this.pos.z, { count: 12, color: '#bff4ff', speed: 4, life: 0.35, size: 0.35 });
    return true;
  }

  powerArrow(dmg: number): boolean {
    return this.hit(dmg, 'shot');
  }

  glint() {
    this.flash = Math.max(this.flash, 0.5);
  }

  update(dt: number) {
    this.cd -= dt;
    this.flash = Math.max(0, this.flash - dt * 3);
    this.disc.rotation.y = dampAngle(this.disc.rotation.y, Math.atan2(this.normal.x, this.normal.z), 12, dt);
    this.shine.emissiveIntensity = 0.25 + this.flash * 2;
  }
}

/* ---------------- light crystal ---------------- */

/** A crystal cluster on a carved pedestal: a gaze beam held on it for a moment lights it for good, and sets its flag. */
export class LightCrystal extends Entity implements BeamCatcher {
  readonly pos: THREE.Vector3;
  readonly radius = 1;
  readonly catching = true;
  lit = false;
  private charge = 0;
  private beamT = 0;
  private gem: THREE.MeshStandardMaterial;
  private glow: THREE.Sprite;
  private cluster = new THREE.Group();

  constructor(
    world: World,
    id: string,
    cx: number,
    cz: number,
    h: number,
    readonly flag: string,
  ) {
    super(world, id);
    const x = center(cx);
    const z = center(cz);
    this.pos = new THREE.Vector3(x, h + GAZE.eye, z);
    const dark = mat(LAB.stoneDark, { rough: 0.9 });
    const gold = mat(LAB.gold, { metal: 0.7, rough: 0.3 });
    this.obj.add(mesh(cyl(0.6, 0.72, 0.6, 8), dark, x, h + 0.3, z));
    this.obj.add(mesh(torus(0.6, 0.05), gold, x, h + 0.6, z, false).rotateX(Math.PI / 2));
    this.gem = ownMat('#cfe8d4', { emissive: '#3a6a48', ei: 0.3, rough: 0.1, metal: 0.1 });
    this.cluster.position.set(x, h + 0.6, z);
    const spikes: [number, number, number, number][] = [
      [0, 0, 0.32, 1.7],
      [0.32, 0.12, 0.2, 1.1],
      [-0.28, -0.1, 0.22, 1.2],
      [0.1, -0.32, 0.18, 0.9],
      [-0.12, 0.3, 0.16, 0.8],
    ];
    for (const [sx, sz, r, len] of spikes) {
      const s = mesh(cone(r, len, 6), this.gem, sx, len / 2, sz);
      s.rotation.set(sz * 0.8, 0, -sx * 0.8);
      this.cluster.add(s);
    }
    this.glow = glowSprite(LAB.gaze, 3.4, 0);
    this.glow.position.set(0, 0.9, 0);
    this.cluster.add(this.glow);
    this.obj.add(this.cluster);
    world.boxes.push(solidBox(x, z, 0.55, h, h + 2.4, this));
    labWorld(world).catchers.push(this);
    if (world.hasFlag(flag)) this.setLit();
  }

  catchBeam(dt: number) {
    this.beamT = 0.12;
    if (this.lit) return;
    this.charge += dt;
    if (this.charge >= GAZE.catchTime) this.light();
  }

  private setLit() {
    this.lit = true;
    this.gem.color.set('#d8ffe0');
    this.gem.emissive.set(LAB.gaze);
    this.gem.emissiveIntensity = 1.4;
    this.glow.material.opacity = 0.8;
  }

  private light() {
    this.setLit();
    const w = this.world;
    w.setFlag(this.flag);
    w.particles.emit(this.pos.x, this.pos.y + 0.4, this.pos.z, { count: 40, color: LAB.gaze, speed: 7, life: 0.8, size: 0.6, up: 2 });
    w.rings.burst(this.pos.x, this.pos.y - GAZE.eye + 0.05, this.pos.z, 5, LAB.gaze, 0.5);
    w.flash(this.pos.x, this.pos.y, this.pos.z, LAB.gaze, 45, 0.5);
    audio.play('charged', 1.1);
    audio.play('success', 1.3, 0.6);
    haptic('medium');
    w.hooks.toast('Crystal lit!', 'bolt');
  }

  update(dt: number) {
    this.beamT -= dt;
    if (!this.lit) {
      if (this.beamT <= 0) this.charge = Math.max(0, this.charge - dt * 0.5);
      const k = this.charge / GAZE.catchTime;
      this.gem.emissiveIntensity = 0.3 + k * 2 + (this.beamT > 0 ? Math.random() * 0.4 : 0);
      this.glow.material.opacity = k * 0.7;
    } else {
      this.cluster.rotation.y += dt * 0.3;
      this.gem.emissiveIntensity = 1.3 + Math.sin(this.world.time * 3) * 0.25 + (this.beamT > 0 ? 0.6 : 0);
    }
  }
}
