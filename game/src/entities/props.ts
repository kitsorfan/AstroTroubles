import * as THREE from 'three';

import { audio } from '../core/audio';
import { haptic } from '../core/bridge';
import { CELL, PLAYER } from '../core/constants';
import { damp } from '../core/math';
import type { World } from '../game/world';
import type { Cond, Spec } from '../world/levelTypes';
import type { Box } from '../world/physics';
import { stripeTexture } from '../world/textures';
import { Entity, type HitKind, type Interactable, type Target } from './entity';
import { blobShadow, boxG, cyl, glowSprite, makeBolt, mat, mesh, ownMat, sphere, torus } from './models';
import type { Player } from './player';

export interface FloorFx {
  stand?(p: Player, dt: number): void;
  land?(p: Player): void;
  unsafe?: boolean;
}

const cx2x = (c: number) => c * CELL + CELL / 2;

function makeBox(x: number, z: number, hw: number, hd: number, bottom: number, top: number, owner?: unknown): Box {
  return { minX: x - hw, maxX: x + hw, minZ: z - hd, maxZ: z + hd, bottom, top, solid: true, dx: 0, dy: 0, dz: 0, owner };
}

/* ---------------- crates ---------------- */

export class Crate extends Entity implements Target {
  readonly aim: THREE.Vector3;
  radius = 0.95;
  aimable = false;
  private box: Box;

  constructor(
    world: World,
    id: string,
    cx: number,
    cz: number,
    h: number,
    private loot: 'bolts' | 'heart' | 'big' = 'bolts',
    private metal = false,
  ) {
    super(world, id);
    const x = cx2x(cx);
    const z = cx2x(cz);
    const S = 1.4;
    const body = metal ? mat('#5b6272', { metal: 0.7, rough: 0.35 }) : mat('#c98a4a', { rough: 0.7 });
    const frame = metal ? new THREE.MeshStandardMaterial({ map: stripeTexture('#ffd166', '#2a2f3a'), roughness: 0.5 }) : mat('#8a5a2c', { rough: 0.8 });
    const g = new THREE.Group();
    g.add(mesh(boxG(S, S, S), frame));
    g.add(mesh(boxG(S * 0.8, S * 1.01, S * 0.8), body, 0, 0, 0));
    g.add(mesh(boxG(S * 1.01, S * 0.8, S * 0.8), body));
    g.add(mesh(boxG(S * 0.8, S * 0.8, S * 1.01), body));
    if (!metal) g.add(mesh(boxG(0.5, 0.5, S * 1.02), mat('#ffd166', { emissive: '#ffb020', ei: 0.4 })));
    g.position.set(x, h + S / 2, z);
    this.obj.add(g);
    this.box = makeBox(x, z, S / 2, S / 2, h, h + S, this);
    world.boxes.push(this.box);
    world.addTarget(this);
    this.aim = new THREE.Vector3(x, h + 0.7, z);
  }

  hit(_dmg: number, kind: HitKind): boolean {
    if (!this.alive) return false;
    if (this.metal && kind !== 'pound') {
      audio.play('zap', 2);
      return true;
    }
    this.smash();
    return true;
  }

  private smash() {
    const w = this.world;
    audio.play('break');
    haptic('light');
    w.particles.emit(this.aim.x, this.aim.y, this.aim.z, { count: 20, color: this.metal ? '#aab4c4' : '#e0a060', speed: 7, life: 0.7, size: 0.5, up: 3 });
    w.boxes.splice(w.boxes.indexOf(this.box), 1);
    w.removeTarget(this);
    if (this.loot === 'heart') w.dropHeart(this.aim);
    w.dropBolts(this.aim, this.loot === 'big' ? 14 : 4);
    w.markTaken(this.id);
    this.remove();
  }
}

/* ---------------- checkpoints ---------------- */

export class Checkpoint extends Entity {
  active = false;
  readonly spot: THREE.Vector3;
  private ring: THREE.Mesh;
  private ringMat: THREE.MeshStandardMaterial;
  private beam: THREE.Sprite;
  private t = 0;

  constructor(world: World, id: string, cx: number, cz: number, h: number) {
    super(world, id);
    const x = cx2x(cx);
    const z = cx2x(cz);
    this.spot = new THREE.Vector3(x, h, z);
    const base = mat('#3a4458', { metal: 0.5, rough: 0.4 });
    this.obj.add(mesh(cyl(0.9, 1, 0.25, 24), base, x, h + 0.12, z));
    this.ringMat = ownMat('#8a93a6', { emissive: '#8a93a6', ei: 0.3 });
    this.ring = mesh(torus(0.75, 0.08), this.ringMat, x, h + 0.3, z, false);
    this.ring.rotation.x = Math.PI / 2;
    this.obj.add(this.ring);
    this.obj.add(mesh(cyl(0.12, 0.16, 2.2, 10), base, x - 0.85, h + 1.1, z), mesh(cyl(0.12, 0.16, 2.2, 10), base, x + 0.85, h + 1.1, z));
    this.beam = glowSprite('#3dff8a', 0.01, 0.6);
    this.beam.position.set(x, h + 1.4, z);
    this.obj.add(this.beam);
  }

  setActive(on: boolean) {
    this.active = on;
    this.ringMat.color.set(on ? '#3dff8a' : '#8a93a6');
    this.ringMat.emissive.set(on ? '#3dff8a' : '#8a93a6');
    this.ringMat.emissiveIntensity = on ? 1.2 : 0.3;
  }

  update(dt: number) {
    this.t += dt;
    this.ring.rotation.z += dt * (this.active ? 2 : 0.4);
    this.beam.scale.setScalar(this.active ? 2.2 + Math.sin(this.t * 3) * 0.3 : 0.01);
    if (this.active) return;
    const p = this.world.player.body;
    if ((p.x - this.spot.x) ** 2 + (p.z - this.spot.z) ** 2 < 2 && Math.abs(p.y - this.spot.y) < 1.5) this.world.activateCheckpoint(this);
  }
}

/* ---------------- doors ---------------- */

const COND_COLOR = (c: Cond): string => ('flag' in c ? '#ffd166' : 'clear' in c ? '#ff5e6a' : 'boss' in c ? '#c77dff' : '#ffb347');

export class Door extends Entity {
  private box: Box;
  private slab: THREE.Group;
  private t = 0;
  private baseY: number;
  private wasOpen = false;
  private lampMat: THREE.MeshStandardMaterial;

  constructor(
    world: World,
    id: string,
    cx: number,
    cz: number,
    h: number,
    private cond: Cond,
  ) {
    super(world, id);
    const x = cx2x(cx);
    const z = cx2x(cz);
    const g = world.grid;
    const alongX = g.cell(cx - 1, cz).kind === 'wall' || g.cell(cx + 1, cz).kind === 'wall';
    const w = alongX ? CELL : 0.5;
    const d = alongX ? 0.5 : CELL;
    this.baseY = h;
    this.slab = new THREE.Group();
    const color = COND_COLOR(cond);
    const metal = ownMat('#4a5468', { metal: 0.5, rough: 0.4 });
    const seam = ownMat('#2a3242');
    this.lampMat = ownMat(color, { emissive: color, ei: 1.3 });
    this.slab.add(mesh(boxG(w, 3.2, d), metal, 0, 1.6, 0));
    this.slab.add(mesh(boxG(alongX ? w * 0.9 : d * 0.1 + 0.52, 0.18, alongX ? d + 0.04 : d * 0.9), this.lampMat, 0, 1.9, 0, false));
    this.slab.add(mesh(boxG(alongX ? 0.12 : 0.54, 2.8, alongX ? d + 0.02 : 0.12), seam, 0, 1.5, 0, false));
    this.slab.position.set(x, h, z);
    this.obj.add(this.slab);
    this.box = makeBox(x, z, w / 2, d / 2, h - 1, h + 3.2, this);
    world.boxes.push(this.box);
  }

  update(dt: number) {
    const open = this.world.cond(this.cond);
    if (open !== this.wasOpen) {
      this.wasOpen = open;
      audio.play('door');
      if (open) this.world.particles.emit(this.slab.position.x, this.baseY + 2, this.slab.position.z, { count: 12, color: '#ffffff', speed: 3, life: 0.5 });
    }
    this.t = damp(this.t, open ? 1 : 0, 5, dt);
    this.slab.position.y = this.baseY - this.t * 3.3;
    this.box.solid = this.t < 0.6;
    this.lampMat.emissiveIntensity = open ? 0.3 : 1 + Math.sin(this.world.time * 4) * 0.3;
  }
}

/* ---------------- switches, terminals, sockets ---------------- */

export class FloorSwitch extends Entity implements Target {
  readonly aim: THREE.Vector3;
  radius = 1.3;
  aimable = false;
  private pressed = false;
  private timer = 0;
  private cap: THREE.Mesh;
  private capMat: THREE.MeshStandardMaterial;

  constructor(
    world: World,
    id: string,
    cx: number,
    cz: number,
    private h: number,
    private flag: string,
    private timed?: number,
  ) {
    super(world, id);
    const x = cx2x(cx);
    const z = cx2x(cz);
    this.aim = new THREE.Vector3(x, h + 0.3, z);
    this.obj.add(mesh(cyl(0.85, 0.95, 0.16, 24), mat('#3a4458', { metal: 0.5 }), x, h + 0.08, z));
    this.capMat = ownMat('#ff5e6a', { emissive: '#ff5e6a', ei: 0.8 });
    this.cap = mesh(cyl(0.62, 0.66, 0.24, 24), this.capMat, x, h + 0.28, z);
    this.obj.add(this.cap);
    const arrow = mesh(new THREE.ConeGeometry(0.28, 0.5, 4), mat('#ffffff', { emissive: '#ffffff', ei: 0.6 }), x, h + 1.6, z, false);
    arrow.rotation.x = Math.PI;
    this.obj.add(arrow);
    this.arrow = arrow;
    world.addTarget(this);
  }

  private arrow: THREE.Mesh;

  hit(_dmg: number, kind: HitKind): boolean {
    if (kind !== 'pound' || (this.pressed && !this.timed)) return false;
    this.press();
    return true;
  }

  private press() {
    this.pressed = true;
    this.world.setFlag(this.flag);
    this.capMat.color.set('#3dff8a');
    this.capMat.emissive.set('#3dff8a');
    audio.play('success');
    haptic('medium');
    if (this.timed) {
      this.timer = this.timed;
      this.world.hooks.toast(`Hurry! ${this.timed} seconds!`, 'bolt');
    }
  }

  update(dt: number) {
    this.cap.position.y = this.h + (this.pressed ? 0.1 : 0.28);
    this.arrow.visible = !this.pressed;
    this.arrow.position.y = this.h + 1.6 + Math.sin(this.world.time * 4) * 0.2;
    if (this.timed && this.pressed) {
      const before = Math.ceil(this.timer);
      this.timer -= dt;
      if (Math.ceil(this.timer) !== before && this.timer > 0) audio.play('blip', 1.5);
      if (this.timer <= 0) {
        this.pressed = false;
        this.world.clearFlag(this.flag);
        this.capMat.color.set('#ff5e6a');
        this.capMat.emissive.set('#ff5e6a');
        audio.play('fail');
      }
    }
  }
}

export class Terminal extends Entity implements Interactable {
  readonly spot: THREE.Vector3;
  range = 2.6;
  private done = false;
  private screen: THREE.MeshStandardMaterial;

  constructor(
    world: World,
    id: string,
    cx: number,
    cz: number,
    h: number,
    private flag: string,
    private length = 4,
  ) {
    super(world, id);
    const x = cx2x(cx);
    const z = cx2x(cz);
    this.spot = new THREE.Vector3(x, h, z);
    const base = mat('#3a4458', { metal: 0.5, rough: 0.4 });
    this.obj.add(mesh(boxG(1.2, 1.1, 0.8), base, x, h + 0.55, z));
    this.screen = ownMat('#5ee0ff', { emissive: '#5ee0ff', ei: 1.4 });
    const scr = mesh(boxG(1, 0.7, 0.08), this.screen, x, h + 1.4, z, false);
    scr.rotation.x = -0.4;
    this.obj.add(scr);
    this.obj.add(glowSprite('#5ee0ff', 2.2, 0.35).translateX(x).translateY(h + 1.4).translateZ(z));
    world.boxes.push(makeBox(x, z, 0.6, 0.4, h, h + 1.1));
    world.addInteractable(this);
    if (world.hasFlag(flag)) this.finish(true);
  }

  label() {
    if (this.done) return null;
    return this.world.boltActive ? 'HACK' : null;
  }

  interact() {
    this.world.hooks.hack(this.length, (ok) => {
      if (ok) this.finish(false);
    });
  }

  private finish(silent: boolean) {
    this.done = true;
    this.world.setFlag(this.flag);
    this.screen.color.set('#3dff8a');
    this.screen.emissive.set('#3dff8a');
    if (!silent) audio.play('success');
  }
}

export class Socket extends Entity implements Interactable {
  readonly spot: THREE.Vector3;
  range = 2.6;
  private filled = false;
  private core: THREE.Mesh;

  constructor(
    world: World,
    id: string,
    cx: number,
    cz: number,
    h: number,
    private flag: string,
  ) {
    super(world, id);
    const x = cx2x(cx);
    const z = cx2x(cz);
    this.spot = new THREE.Vector3(x, h, z);
    this.obj.add(mesh(cyl(0.6, 0.75, 1, 18), mat('#3a4458', { metal: 0.5 }), x, h + 0.5, z));
    this.obj.add(mesh(torus(0.4, 0.07), mat('#3dff8a', { emissive: '#3dff8a', ei: 0.7 }), x, h + 1.02, z).rotateX(Math.PI / 2));
    this.core = mesh(cyl(0.26, 0.26, 0.7, 16), mat('#bfffd0', { emissive: '#3dff8a', ei: 1.6 }), x, h + 1.3, z);
    this.core.visible = false;
    this.obj.add(this.core);
    world.boxes.push(makeBox(x, z, 0.6, 0.6, h, h + 1));
    world.addInteractable(this);
    if (world.hasFlag(flag)) this.fill(true);
  }

  label() {
    if (this.filled) return null;
    return this.world.player.carrying ? 'PLACE CELL' : null;
  }

  interact() {
    const cell = this.world.heldCell();
    if (!cell) return;
    cell.place();
    this.fill(false);
  }

  private fill(silent: boolean) {
    this.filled = true;
    this.core.visible = true;
    this.world.setFlag(this.flag);
    if (!silent) {
      audio.play('success');
      haptic('success');
      this.world.particles.emit(this.spot.x, this.spot.y + 1.3, this.spot.z, { count: 30, color: '#3dff8a', speed: 6, life: 0.7 });
    }
  }
}

/* ---------------- platforms ---------------- */

export class Platform extends Entity {
  readonly box: Box;
  private points: THREE.Vector3[];
  private idx = 0;
  private dir = 1;
  private waitT = 0;
  private pos: THREE.Vector3;
  private mesh: THREE.Group;
  private half: number;

  constructor(
    world: World,
    id: string,
    cx: number,
    cz: number,
    h: number,
    spec: Extract<Spec, { type: 'platform' }>,
  ) {
    super(world, id);
    const size = spec.size ?? 1;
    this.half = (CELL * size) / 2 - 0.05;
    const x0 = cx2x(cx) + (size - 1) * (CELL / 2);
    const z0 = cx2x(cz) + (size - 1) * (CELL / 2);
    this.points = [new THREE.Vector3(x0, h, z0), ...spec.path.map(([dx, dz, dy]) => new THREE.Vector3(x0 + dx * CELL, h + (dy ?? 0) * 0.5, z0 + dz * CELL))];
    this.pos = this.points[0].clone();
    this.speed = spec.speed ?? 3;
    this.wait = spec.wait ?? 0.7;
    this.needs = spec.needs;
    const hw = this.half;
    this.mesh = new THREE.Group();
    this.mesh.add(mesh(boxG(hw * 2, 0.5, hw * 2), mat('#5a6478', { metal: 0.55, rough: 0.35 }), 0, -0.25, 0));
    const trim = new THREE.MeshStandardMaterial({ map: stripeTexture('#ffd166', '#2a2f3a'), roughness: 0.5 });
    this.mesh.add(mesh(boxG(hw * 2 + 0.06, 0.12, hw * 2 + 0.06), trim, 0, -0.06, 0));
    this.mesh.add(mesh(cyl(0.2, 0.3, 0.3, 10), mat(world.theme.accent, { emissive: world.theme.accent, ei: 1.4 }), 0, -0.6, 0, false));
    this.mesh.add(glowSprite(world.theme.accent, 1.4, 0.5).translateY(-0.8));
    this.obj.add(this.mesh);
    this.box = makeBox(this.pos.x, this.pos.z, hw, hw, h - 0.5, h, this);
    world.boxes.push(this.box);
  }

  private speed: number;
  private wait: number;
  private needs?: Cond;

  update(dt: number) {
    const before = this.pos.clone();
    const running = !this.needs || this.world.cond(this.needs);
    if (running && this.points.length > 1) {
      if (this.waitT > 0) this.waitT -= dt;
      else {
        const next = this.idx + this.dir;
        const target = this.points[next];
        const to = target.clone().sub(this.pos);
        const d = to.length();
        const step = this.speed * dt;
        if (d <= step) {
          this.pos.copy(target);
          this.idx = next;
          if (this.idx === this.points.length - 1 || this.idx === 0) {
            this.dir = -this.dir;
            this.waitT = this.wait;
          }
        } else {
          this.pos.addScaledVector(to, step / d);
        }
      }
    }
    this.box.dx = this.pos.x - before.x;
    this.box.dy = this.pos.y - before.y;
    this.box.dz = this.pos.z - before.z;
    this.box.minX = this.pos.x - this.half;
    this.box.maxX = this.pos.x + this.half;
    this.box.minZ = this.pos.z - this.half;
    this.box.maxZ = this.pos.z + this.half;
    this.box.top = this.pos.y;
    this.box.bottom = this.pos.y - 0.5;
    this.mesh.position.copy(this.pos);
  }
}

export class Faller extends Entity {
  readonly box: Box;
  private state: 'idle' | 'shake' | 'fall' | 'gone' = 'idle';
  private t = 0;
  private y: number;
  private vy = 0;
  private mesh: THREE.Group;
  private home: THREE.Vector3;

  constructor(world: World, id: string, cx: number, cz: number, h: number) {
    super(world, id);
    const x = cx2x(cx);
    const z = cx2x(cz);
    this.home = new THREE.Vector3(x, h, z);
    this.y = h;
    this.mesh = new THREE.Group();
    this.mesh.add(mesh(boxG(CELL - 0.1, 0.45, CELL - 0.1), mat('#8a6a4a', { rough: 0.8 }), 0, -0.22, 0));
    this.mesh.add(mesh(boxG(CELL - 0.3, 0.05, CELL - 0.3), mat('#ffb347', { emissive: '#ff8a1a', ei: 0.3 }), 0, 0.01, 0));
    this.mesh.position.copy(this.home);
    this.obj.add(this.mesh);
    this.box = makeBox(x, z, CELL / 2 - 0.05, CELL / 2 - 0.05, h - 0.45, h, this);
    world.boxes.push(this.box);
  }

  update(dt: number) {
    const standing = this.world.player.body.grounded && this.world.player.body.ground?.box === this.box;
    this.t += dt;
    this.box.dy = 0;
    switch (this.state) {
      case 'idle':
        if (standing) {
          this.state = 'shake';
          this.t = 0;
          audio.play('break', 0.6);
        }
        this.mesh.position.set(this.home.x, this.home.y, this.home.z);
        break;
      case 'shake':
        this.mesh.position.x = this.home.x + Math.sin(this.t * 60) * 0.06;
        if (this.t > 0.55) {
          this.state = 'fall';
          this.t = 0;
          this.vy = 0;
        }
        break;
      case 'fall': {
        this.vy -= 20 * dt;
        const prev = this.y;
        this.y += this.vy * dt;
        this.box.dy = this.y - prev;
        this.box.top = this.y;
        this.box.bottom = this.y - 0.45;
        this.mesh.position.y = this.y;
        if (this.t > 0.5) this.box.solid = false;
        if (this.t > 1.2) {
          this.state = 'gone';
          this.t = 0;
          this.mesh.visible = false;
        }
        break;
      }
      case 'gone':
        if (this.t > 2.5) {
          this.state = 'idle';
          this.y = this.home.y;
          this.box.top = this.y;
          this.box.bottom = this.y - 0.45;
          this.box.solid = true;
          this.mesh.visible = true;
          this.mesh.position.copy(this.home);
        }
        break;
    }
  }
}

/* ---------------- floor gadgets ---------------- */

export class BouncePad extends Entity implements FloorFx {
  private spring: THREE.Group;
  private t = 1;

  constructor(world: World, id: string, cx: number, cz: number, h: number) {
    super(world, id);
    const x = cx2x(cx);
    const z = cx2x(cz);
    this.obj.add(mesh(cyl(0.9, 1, 0.2, 24), mat('#3a4458', { metal: 0.5 }), x, h + 0.1, z));
    this.spring = new THREE.Group();
    this.spring.add(mesh(cyl(0.75, 0.75, 0.16, 24), mat('#ff6fcf', { emissive: '#ff6fcf', ei: 0.9 }), 0, 0, 0));
    this.spring.add(mesh(torus(0.5, 0.06), mat('#ffffff', { emissive: '#ffffff', ei: 0.5 }), 0, 0.09, 0).rotateX(Math.PI / 2));
    this.spring.position.set(x, h + 0.3, z);
    this.obj.add(this.spring);
    world.registerFloor(cx, cz, this);
  }

  land(p: Player) {
    const v = p.pounding ? PLAYER.bounceV * 1.25 : PLAYER.bounceV;
    p.launch(v);
    this.t = 0;
    audio.play('bounce');
    haptic('light');
    this.world.particles.emit(p.body.x, p.body.y + 0.2, p.body.z, { count: 14, color: '#ff9ae0', speed: 5, life: 0.5, size: 0.5 });
  }

  stand(p: Player) {
    this.land(p);
  }

  update(dt: number) {
    this.t += dt;
    const k = this.t < 0.3 ? Math.sin((this.t / 0.3) * Math.PI) : 0;
    this.spring.scale.set(1 - k * 0.15, 1 + k * 3, 1 - k * 0.15);
  }
}

export class Vent extends Entity implements FloorFx {
  unsafe = true;
  private x: number;
  private z: number;
  private h: number;
  private glow: THREE.Sprite;
  private wasOn = false;

  constructor(
    world: World,
    id: string,
    cx: number,
    cz: number,
    h: number,
    private period = 3.2,
    private offset = 0,
  ) {
    super(world, id);
    this.x = cx2x(cx);
    this.z = cx2x(cz);
    this.h = h;
    this.obj.add(mesh(cyl(0.85, 0.95, 0.14, 20), mat('#2a2f3a', { metal: 0.6 }), this.x, h + 0.07, this.z));
    for (let i = 0; i < 4; i++) {
      this.obj.add(mesh(boxG(1.2, 0.05, 0.12), mat('#ffb347', { emissive: '#ff8a1a', ei: 0.6 }), this.x, h + 0.15, this.z - 0.45 + i * 0.3, false));
    }
    this.glow = glowSprite('#ffe0b0', 3, 0);
    this.glow.position.set(this.x, h + 1.5, this.z);
    this.obj.add(this.glow);
    world.registerFloor(cx, cz, this);
  }

  get on() {
    return (this.world.time + this.offset) % this.period < 1.5;
  }

  update(dt: number) {
    const on = this.on;
    const soon = !on && (this.world.time + this.offset) % this.period > this.period - 0.6;
    if (on && !this.wasOn) audio.play('vent');
    this.wasOn = on;
    this.glow.material.opacity = damp(this.glow.material.opacity, on ? 0.55 : 0, 8, dt);
    const w = this.world;
    if (on || (soon && Math.random() < 0.3)) {
      w.particles.emit(this.x + (Math.random() - 0.5), this.h + 0.3, this.z + (Math.random() - 0.5), {
        count: on ? 3 : 1,
        color: '#f4f0ea',
        speed: 1.5,
        up: on ? 13 : 3,
        life: on ? 0.8 : 0.4,
        size: on ? 1.3 : 0.6,
        gravity: 0,
        drag: 0.8,
      });
    }
    if (!on) return;
    const p = w.player.body;
    if (Math.abs(p.x - this.x) < 1.1 && Math.abs(p.z - this.z) < 1.1 && p.y < this.h + 8 && p.y > this.h - 0.5) {
      if (p.vy < PLAYER.ventV - 2) {
        w.player.launch(PLAYER.ventV);
        haptic('light');
      }
    }
  }
}

export class Laser extends Entity {
  private beam: THREE.Mesh;
  private beamMat: THREE.MeshBasicMaterial;
  private a: THREE.Vector3;
  private b: THREE.Vector3;
  private y: number;
  private wasOn = false;

  constructor(
    world: World,
    id: string,
    cx: number,
    cz: number,
    h: number,
    private spec: Extract<Spec, { type: 'laser' }>,
  ) {
    super(world, id);
    const x = cx2x(cx);
    const z = cx2x(cz);
    const len = spec.length * CELL;
    this.y = h + (spec.low ? 0.45 : 1);
    this.a = new THREE.Vector3(x, this.y, z);
    this.b = spec.axis === 'x' ? new THREE.Vector3(x + len, this.y, z) : new THREE.Vector3(x, this.y, z + len);
    const post = mat('#2a2f3a', { metal: 0.6 });
    const cap = mat('#ff4757', { emissive: '#ff4757', ei: 1.2 });
    for (const p of [this.a, this.b]) {
      this.obj.add(mesh(cyl(0.18, 0.24, this.y - h + 0.5, 10), post, p.x, h + (this.y - h + 0.5) / 2, p.z));
      this.obj.add(mesh(sphere(0.18, 10), cap, p.x, this.y + 0.25, p.z, false));
    }
    // A solid red core (additive would wash out to white over bright floors) inside a soft glow.
    this.beamMat = new THREE.MeshBasicMaterial({ color: '#ff2238', transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false });
    const geo = new THREE.CylinderGeometry(0.07, 0.07, len, 8);
    if (spec.axis === 'x') geo.rotateZ(Math.PI / 2);
    else geo.rotateX(Math.PI / 2);
    this.beam = new THREE.Mesh(geo, this.beamMat);
    this.beam.position.copy(this.a).lerp(this.b, 0.5);
    this.obj.add(this.beam);
    const halo = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#ff4757', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    halo.scale.set(spec.axis === 'x' ? 1 : 3, spec.axis === 'x' ? 3 : 3, spec.axis === 'x' ? 3 : 1);
    this.beam.add(halo);
  }

  get on() {
    if (this.spec.off && this.world.cond(this.spec.off)) return false;
    if (this.spec.always) return true;
    const period = this.spec.period ?? 3;
    return (this.world.time + (this.spec.offset ?? 0)) % period < period * 0.55;
  }

  update() {
    const on = this.on;
    if (on !== this.wasOn) {
      this.wasOn = on;
      if (on) audio.play('zap', 0.7);
    }
    const period = this.spec.period ?? 3;
    const phase = (this.world.time + (this.spec.offset ?? 0)) % period;
    const warn = !on && !this.spec.always && phase > period - 0.5;
    this.beam.visible = on || warn;
    this.beamMat.opacity = on ? 0.9 : Math.sin(this.world.time * 40) > 0 ? 0.3 : 0.05;
    if (!on) return;
    const p = this.world.player.body;
    // The beam covers its end cells completely, so nobody can sneak past by hugging a wall.
    const minX = Math.min(this.a.x, this.b.x) - CELL / 2;
    const maxX = Math.max(this.a.x, this.b.x) + CELL / 2;
    const minZ = Math.min(this.a.z, this.b.z) - CELL / 2;
    const maxZ = Math.max(this.a.z, this.b.z) + CELL / 2;
    const inside = this.spec.axis === 'x' ? p.x > minX && p.x < maxX && Math.abs(p.z - this.a.z) < 0.5 : p.z > minZ && p.z < maxZ && Math.abs(p.x - this.a.x) < 0.5;
    if (inside && p.y < this.y + 0.15 && p.y + p.h > this.y - 0.15) {
      const fromX = this.spec.axis === 'x' ? p.x : this.a.x + (p.x < this.a.x ? 1 : -1);
      const fromZ = this.spec.axis === 'z' ? p.z : this.a.z + (p.z < this.a.z ? 1 : -1);
      this.world.player.hurt(1, fromX, fromZ);
    }
  }
}

export class ZapFloor extends Entity implements FloorFx {
  unsafe = true;
  private plateMat: THREE.MeshStandardMaterial;
  private x: number;
  private z: number;
  private h: number;

  constructor(
    world: World,
    id: string,
    cx: number,
    cz: number,
    h: number,
    private period = 3,
    private offset = 0,
  ) {
    super(world, id);
    this.x = cx2x(cx);
    this.z = cx2x(cz);
    this.h = h;
    this.plateMat = ownMat('#3a4458', { emissive: '#6ec8ff', ei: 0, metal: 0.6 });
    this.obj.add(mesh(boxG(CELL - 0.15, 0.08, CELL - 0.15), this.plateMat, this.x, h + 0.04, this.z));
    world.registerFloor(cx, cz, this);
  }

  get on() {
    return (this.world.time + this.offset) % this.period < this.period * 0.45;
  }

  stand(p: Player) {
    if (this.on) p.hurt(1, this.x + (Math.random() - 0.5) * 0.1, this.z + (Math.random() - 0.5) * 0.1);
  }

  update() {
    const phase = (this.world.time + this.offset) % this.period;
    const on = this.on;
    const warn = !on && phase > this.period - 0.5;
    this.plateMat.emissiveIntensity = on ? 1.6 : warn ? (Math.sin(this.world.time * 30) > 0 ? 0.6 : 0) : 0;
    if (on && Math.random() < 0.25) {
      this.world.particles.emit(this.x + (Math.random() - 0.5) * 1.6, this.h + 0.2, this.z + (Math.random() - 0.5) * 1.6, { count: 2, color: '#bfe8ff', speed: 3, up: 2, life: 0.25, size: 0.35 });
    }
  }
}

function arrowTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.fillStyle = '#2a2f3a';
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#ffd166';
  g.beginPath();
  g.moveTo(16, 44);
  g.lineTo(32, 20);
  g.lineTo(48, 44);
  g.lineTo(40, 44);
  g.lineTo(32, 32);
  g.lineTo(24, 44);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export class Conveyor extends Entity implements FloorFx {
  private tex: THREE.Texture;

  constructor(
    world: World,
    id: string,
    cx: number,
    cz: number,
    h: number,
    private dx: number,
    private dz: number,
    private speed = 3.2,
  ) {
    super(world, id);
    this.tex = arrowTexture();
    const m = new THREE.MeshStandardMaterial({ map: this.tex, emissive: '#ffd166', emissiveMap: this.tex, emissiveIntensity: 0.35, roughness: 0.6 });
    const plane = mesh(new THREE.PlaneGeometry(CELL - 0.1, CELL - 0.1), m, cx2x(cx), h + 0.02, cx2x(cz), false);
    plane.rotation.x = -Math.PI / 2;
    plane.rotation.z = -Math.atan2(dx, -dz);
    plane.receiveShadow = true;
    this.obj.add(plane);
    world.registerFloor(cx, cz, this);
  }

  stand(p: Player, dt: number) {
    p.body.x += this.dx * this.speed * dt;
    p.body.z += this.dz * this.speed * dt;
  }

  update(dt: number) {
    this.tex.offset.y -= dt * this.speed * 0.5;
  }
}

/* ---------------- story props ---------------- */

export class Cocoon extends Entity implements Target {
  readonly aim: THREE.Vector3;
  radius = 1;
  aimable = true;
  private hp = 3;
  private pod: THREE.Group;
  private freedT = -1;
  private person: THREE.Group;

  constructor(
    world: World,
    id: string,
    cx: number,
    cz: number,
    h: number,
    private name: string,
    private line: string,
  ) {
    super(world, id);
    const x = cx2x(cx);
    const z = cx2x(cz);
    this.aim = new THREE.Vector3(x, h + 1.2, z);
    this.pod = new THREE.Group();
    const skin = mat('#ff8ad8', { emissive: '#ff5fc8', ei: 0.35, rough: 0.35, opacity: 0.92 });
    const pod = mesh(sphere(0.9, 22), skin, 0, 1.2, 0);
    pod.scale.set(0.9, 1.35, 0.9);
    this.pod.add(pod);
    for (let i = 0; i < 5; i++) {
      const vine = mesh(torus(0.9, 0.06), mat('#8a2f75', { rough: 0.6 }), 0, 0.6 + i * 0.35, 0);
      vine.rotation.x = Math.PI / 2 + (i % 2 ? 0.3 : -0.3);
      vine.scale.setScalar(0.85 + Math.sin(i) * 0.1);
      this.pod.add(vine);
    }
    this.pod.add(glowSprite('#ff6fcf', 3, 0.35).translateY(1.2));
    this.pod.position.set(x, h, z);
    this.obj.add(this.pod);
    this.person = makeColonist();
    this.person.position.set(x, h, z);
    this.person.visible = false;
    this.obj.add(this.person);
    world.addTarget(this);
    world.boxes.push(makeBox(x, z, 0.75, 0.75, h, h + 2.4, this));
  }

  hit(): boolean {
    if (this.hp <= 0) return false;
    this.hp -= 1;
    audio.play('hit');
    this.pod.scale.setScalar(1.12);
    if (this.hp <= 0) this.free();
    return true;
  }

  private free() {
    const w = this.world;
    audio.play('pop');
    audio.play('heart');
    w.particles.emit(this.aim.x, this.aim.y, this.aim.z, { count: 40, color: '#ff9ae0', speed: 7, life: 0.9, size: 0.6 });
    this.pod.visible = false;
    this.person.visible = true;
    this.freedT = 0;
    this.aimable = false;
    w.removeTarget(this);
    const box = w.boxes.find((b) => b.owner === this);
    if (box) w.boxes.splice(w.boxes.indexOf(box), 1);
    w.collect('colonist', this.id);
    w.hooks.toast(`${this.name}: "${this.line}"`, 'colonist');
  }

  update(dt: number) {
    this.pod.scale.setScalar(damp(this.pod.scale.x, 1 + Math.sin(this.world.time * 2) * 0.03, 8, dt));
    if (this.freedT >= 0) {
      this.freedT += dt;
      this.person.rotation.y = Math.atan2(this.world.player.body.x - this.person.position.x, this.world.player.body.z - this.person.position.z);
      const arm = this.person.children[3];
      arm.rotation.z = -2.4 + Math.sin(this.freedT * 10) * 0.5;
      if (this.freedT > 4) {
        this.person.scale.setScalar(Math.max(0.01, 1 - (this.freedT - 4) * 2));
        if (this.freedT > 4.5) {
          this.world.particles.emit(this.person.position.x, this.person.position.y + 1, this.person.position.z, { count: 20, color: '#7fe6ff', speed: 4, life: 0.6 });
          this.remove();
        }
      }
    }
  }
}

function makeColonist(): THREE.Group {
  const g = new THREE.Group();
  const suit = mat('#e6edf7', { rough: 0.5 });
  const skin = mat('#f0c8a0', { rough: 0.6 });
  g.add(mesh(capsule2(0.28, 0.5), suit, 0, 0.8, 0));
  g.add(mesh(sphere(0.3, 16), skin, 0, 1.45, 0));
  g.add(mesh(sphere(0.31, 16), mat('#5a3a22'), 0, 1.55, -0.05));
  const arm = new THREE.Group();
  arm.position.set(0.32, 1.1, 0);
  arm.add(mesh(capsule2(0.08, 0.3), suit, 0, -0.25, 0));
  g.add(arm);
  g.add(blobShadow(1));
  return g;
}

function capsule2(r: number, l: number) {
  return new THREE.CapsuleGeometry(r, l, 4, 10);
}

export class Vendor extends Entity implements Interactable {
  readonly spot: THREE.Vector3;
  range = 2.8;
  private face: THREE.Group;
  private t = 0;

  constructor(world: World, id: string, cx: number, cz: number, h: number) {
    super(world, id);
    const x = cx2x(cx);
    const z = cx2x(cz);
    this.spot = new THREE.Vector3(x, h, z);
    const body = mat('#8a2a5a', { rough: 0.4, metal: 0.3 });
    this.obj.add(mesh(boxG(1.4, 2.2, 1), body, x, h + 1.1, z));
    this.face = new THREE.Group();
    this.face.add(mesh(boxG(1.1, 0.8, 0.06), mat('#ffe0f4', { emissive: '#ffb0e0', ei: 0.8 }), 0, 0, 0, false));
    const eye = mat('#2a0f20');
    this.face.add(mesh(sphere(0.09, 10), eye, -0.25, 0.08, 0.05, false), mesh(sphere(0.09, 10), eye, 0.25, 0.08, 0.05, false));
    this.face.add(mesh(torus(0.14, 0.03), eye, 0, -0.14, 0.05, false));
    this.face.position.set(x, h + 1.6, z + 0.52);
    this.obj.add(this.face);
    this.obj.add(mesh(cyl(0.03, 0.03, 0.5), mat('#e6edf7'), x, h + 2.45, z), mesh(sphere(0.1, 10), mat('#ffd166', { emissive: '#ffd166', ei: 1.4 }), x, h + 2.72, z, false));
    this.obj.add(glowSprite('#ff8ad8', 3.5, 0.3).translateX(x).translateY(h + 1.4).translateZ(z + 0.6));
    world.boxes.push(makeBox(x, z, 0.7, 0.5, h, h + 2.2));
    world.addInteractable(this);
  }

  label() {
    return 'SHOP';
  }

  interact() {
    this.world.hooks.shop();
  }

  update(dt: number) {
    this.t += dt;
    this.face.position.y = this.spot.y + 1.6 + Math.sin(this.t * 3) * 0.03;
  }
}

export class Sign extends Entity implements Interactable {
  readonly spot: THREE.Vector3;
  range = 2.4;
  private panel: THREE.Mesh;

  constructor(
    world: World,
    id: string,
    cx: number,
    cz: number,
    h: number,
    private text: string,
  ) {
    super(world, id);
    const x = cx2x(cx);
    const z = cx2x(cz);
    this.spot = new THREE.Vector3(x, h, z);
    this.obj.add(mesh(cyl(0.08, 0.1, 1.2, 8), mat('#3a4458', { metal: 0.5 }), x, h + 0.6, z));
    this.panel = mesh(boxG(1, 0.62, 0.05), mat(world.theme.accent, { emissive: world.theme.accent, ei: 0.9, opacity: 0.8 }), x, h + 1.45, z, false);
    this.obj.add(this.panel);
    world.addInteractable(this);
  }

  label() {
    return 'READ';
  }

  interact() {
    this.world.hooks.say([{ who: 'bolt', text: this.text }]);
  }

  update() {
    this.panel.rotation.y = this.world.time * 0.6;
  }
}

export class Trigger extends Entity {
  private done = false;

  constructor(
    world: World,
    id: string,
    private cx: number,
    private cz: number,
    private spec: Extract<Spec, { type: 'trigger' }>,
  ) {
    super(world, id);
    this.done = world.taken.has(id);
  }

  update() {
    if (this.done) return;
    const p = this.world.player;
    const w = this.spec.w ?? 1;
    const d = this.spec.d ?? 1;
    const inX = p.cellX >= this.cx - Math.floor((w - 1) / 2) && p.cellX <= this.cx + Math.ceil((w - 1) / 2);
    const inZ = p.cellZ >= this.cz - Math.floor((d - 1) / 2) && p.cellZ <= this.cz + Math.ceil((d - 1) / 2);
    if (!inX || !inZ || (this.spec.when && !this.world.cond(this.spec.when))) return;
    this.done = true;
    this.world.markTaken(this.id);
    if (this.spec.dialogue) this.world.hooks.say(this.world.dialogue(this.spec.dialogue));
    if (this.spec.event) this.world.event(this.spec.event);
  }
}

export class Exit extends Entity implements Interactable {
  readonly spot: THREE.Vector3;
  range = 2.8;
  private ring: THREE.Mesh;
  private ringMat: THREE.MeshStandardMaterial;

  constructor(world: World, id: string, cx: number, cz: number, h: number) {
    super(world, id);
    const x = cx2x(cx);
    const z = cx2x(cz);
    this.spot = new THREE.Vector3(x, h, z);
    this.obj.add(mesh(cyl(1.3, 1.4, 0.3, 28), mat('#3a4458', { metal: 0.5 }), x, h + 0.15, z));
    this.ringMat = ownMat('#ff5e6a', { emissive: '#ff5e6a', ei: 1 });
    this.ring = mesh(torus(1.1, 0.1), this.ringMat, x, h + 0.35, z, false);
    this.ring.rotation.x = Math.PI / 2;
    this.obj.add(this.ring);
    for (const sx of [-1, 1]) this.obj.add(mesh(boxG(0.3, 3.6, 0.3), mat('#56637e', { metal: 0.5 }), x + sx * 1.35, h + 1.8, z));
    this.obj.add(mesh(boxG(3, 0.3, 0.3), mat('#56637e', { metal: 0.5 }), x, h + 3.6, z));
    world.addInteractable(this);
  }

  label() {
    return this.world.canExit() ? 'RIDE LIFT' : null;
  }

  interact() {
    this.world.hooks.complete();
  }

  update(dt: number) {
    const open = this.world.canExit();
    this.ringMat.color.set(open ? '#3dff8a' : '#ff5e6a');
    this.ringMat.emissive.set(open ? '#3dff8a' : '#ff5e6a');
    this.ring.rotation.z += dt * (open ? 2 : 0.3);
    if (open && Math.random() < 0.2) {
      this.world.particles.emit(this.spot.x + (Math.random() - 0.5) * 2, this.spot.y + 0.3, this.spot.z + (Math.random() - 0.5) * 2, { count: 1, color: '#3dff8a', speed: 0.5, up: 4, life: 0.8, size: 0.4, gravity: 0 });
    }
  }
}

/** BOLT, switched off and hiding in the dark, waiting for someone to fix him. */
export class BoltFind extends Entity implements Interactable {
  readonly spot: THREE.Vector3;
  range = 2.8;
  private model = makeBolt();
  private t = 0;

  constructor(world: World, id: string, cx: number, cz: number, h: number) {
    super(world, id);
    this.spot = new THREE.Vector3(cx2x(cx), h, cx2x(cz));
    this.model.root.position.set(this.spot.x, h + 0.35, this.spot.z);
    this.model.root.rotation.z = 0.9;
    this.model.iris.emissiveIntensity = 0.2;
    this.model.glow.visible = false;
    this.obj.add(this.model.root);
    world.addInteractable(this);
  }

  label() {
    return 'FIX DRONE';
  }

  interact() {
    const w = this.world;
    w.hooks.say(w.dialogue('bolt'), () => {
      w.joinBolt();
      w.bolt.place(this.spot.x, this.spot.y + 1, this.spot.z);
      this.remove();
    });
  }

  update(dt: number) {
    this.t += dt;
    if (Math.random() < 0.04) {
      this.world.particles.emit(this.spot.x + 0.3, this.spot.y + 0.6, this.spot.z, { count: 3, color: '#ffd166', speed: 3, life: 0.3, size: 0.3 });
      audio.play('zap', 2.2);
    }
    this.model.iris.emissiveIntensity = Math.random() < 0.05 ? 1.2 : 0.2;
  }
}

export class BreakWall extends Entity implements Target {
  readonly aim: THREE.Vector3;
  radius = 1.2;
  aimable = false;
  private hp = 3;
  private box: Box;
  private block: THREE.Mesh;

  constructor(world: World, id: string, cx: number, cz: number, h: number) {
    super(world, id);
    const x = cx2x(cx);
    const z = cx2x(cz);
    this.aim = new THREE.Vector3(x, h + 1, z);
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const g = c.getContext('2d') as CanvasRenderingContext2D;
    g.fillStyle = world.theme.wall;
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = 'rgba(0,0,0,0.6)';
    g.lineWidth = 4;
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.moveTo(64, 64);
      let px = 64;
      let py = 64;
      for (let k = 0; k < 4; k++) {
        px += (Math.random() - 0.5) * 60;
        py += (Math.random() - 0.5) * 60;
        g.lineTo(px, py);
      }
      g.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.block = mesh(boxG(CELL, 3.2, CELL), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }), x, h + 1.6, z);
    this.obj.add(this.block);
    this.box = makeBox(x, z, CELL / 2, CELL / 2, h - 1, h + 3.2, this);
    world.boxes.push(this.box);
    world.addTarget(this);
  }

  hit(): boolean {
    if (!this.alive) return false;
    this.hp -= 1;
    audio.play('break', 0.8);
    this.block.scale.setScalar(0.96);
    if (this.hp <= 0) {
      const w = this.world;
      audio.play('explode');
      w.shake(0.3);
      w.particles.emit(this.aim.x, this.aim.y, this.aim.z, { count: 40, color: w.theme.wall, speed: 8, life: 0.9, size: 0.8, up: 3 });
      w.boxes.splice(w.boxes.indexOf(this.box), 1);
      w.removeTarget(this);
      w.markTaken(this.id);
      w.hooks.toast('A secret passage!', 'bolt');
      this.remove();
    }
    return true;
  }

  update(dt: number) {
    this.block.scale.setScalar(damp(this.block.scale.x, 1, 10, dt));
  }
}
