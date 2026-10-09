import * as THREE from 'three';

import { audio } from '../../core/audio';
import { haptic } from '../../core/bridge';
import { damp } from '../../core/math';
import type { World } from '../../game/world';
import { Grid } from '../../world/grid';
import type { Box } from '../../world/physics';
import { Boss } from '../bossBase';
import type { HitKind, Target } from '../entity';
import { Shockwave } from '../hazards';
import { cyl, mat, mesh, ownMat, torus } from '../models';
import { Charybdis } from './charybdis';
import { makeScyllaModel, stretch, SCYLLA, type ArmModel } from './scyllaModel';

/**
 * SCYLLA (chapter 3, Scylla's Reef): Aeëtes's six-armed crane robot, bolted onto the great rock of the
 * strait to snatch every ship that sails past. She needs BOTH heroes:
 * - Her arms take turns to SLAM down where the hero stands (a red ring shrinks first: step out of it)
 *   or SWEEP low across the reef (a gold arc on the floor shows where: jump over the claw).
 * - While an arm is raised or stuck in the floor after a slam, its elbow joint glows blue. Only
 *   Atalanta's charged POWER ARROW jams a glowing joint: the arm sparks and drops.
 * - Jam TWO arms and Scylla overloads: she slumps, and the three base plates around her turret pop
 *   open. Switch to Jason and GROUND-POUND one. Each crushed plate is a third of her health, and the two
 *   jammed arms stay broken, so every round she has fewer arms (and swings them faster).
 * Meanwhile CHARYBDIS, the whirlpool in the middle of the arena, pulls everything toward its centre
 * every few seconds (its foam ring spins faster first): walk out of it, or spin to dig in.
 */

/** Health: three plates, one third each. */
const HP = 30;
const PLATE_DAMAGE = HP / 3;
/** How many jammed arms overload her, and how long the plates stay open. */
const JAMS = 2;
const OPEN = 9;
/** Arm reach from the turret, slam and sweep timings. */
const REACH = 11;
const SLAM = { warn: 1.25, drop: 0.18, stuck: 2.3, back: 0.8, radius: 1.9 };
const SWEEP = { warn: 1.1, time: 1.5, back: 0.8, width: 1.4 };
/** Seconds between attacks (less as she loses arms). */
const PACE = [2.4, 2.0, 1.6];

type ArmState = 'rest' | 'raise' | 'drop' | 'stuck' | 'sweepWarn' | 'sweep' | 'back' | 'jammed' | 'broken';
type Mode = 'idle' | 'fight' | 'overload' | 'rise';

const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();

/** A gold ring on the floor that shrinks onto the spot a claw is about to slam. */
class SlamMark {
  readonly group = new THREE.Group();
  private ring: THREE.Mesh;
  private disc: THREE.Mesh;
  private ringMat = new THREE.MeshBasicMaterial({ color: '#ff5e6a', transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  private discMat = new THREE.MeshBasicMaterial({ color: '#ff9a3a', transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });

  constructor() {
    this.ring = new THREE.Mesh(new THREE.RingGeometry(SLAM.radius - 0.25, SLAM.radius, 40).rotateX(-Math.PI / 2), this.ringMat);
    this.disc = new THREE.Mesh(new THREE.CircleGeometry(SLAM.radius, 32).rotateX(-Math.PI / 2), this.discMat);
    this.ring.renderOrder = 3;
    this.disc.renderOrder = 3;
    this.group.add(this.disc, this.ring);
    this.group.visible = false;
  }

  show(p: THREE.Vector3, k: number, t: number) {
    this.group.visible = true;
    this.group.position.set(p.x, p.y + 0.07, p.z);
    this.ring.scale.setScalar(1 + (1 - k) * 1.2);
    const blink = k > 0.7 ? 0.5 + 0.5 * Math.sin(t * 30) : 1;
    this.ringMat.opacity = 0.9 * blink;
    this.discMat.opacity = (0.15 + k * 0.3) * blink;
  }

  hide() {
    this.group.visible = false;
  }
}

/** A gold arc on the floor: "a claw sweeps through here". */
class SweepMark {
  readonly mesh: THREE.Mesh;
  private m = new THREE.MeshBasicMaterial({ color: '#ffd166', transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });

  constructor() {
    this.mesh = new THREE.Mesh(new THREE.RingGeometry(1, 2, 48, 1, 0, 1), this.m);
    this.mesh.renderOrder = 3;
    this.mesh.visible = false;
  }

  show(c: THREE.Vector3, r: number, a0: number, a1: number, t: number) {
    // The ring lies in the floor plane: angles measured like atan2(dx, dz) map to ring angles via (PI/2 - a).
    const start = Math.min(a0, a1);
    const len = Math.abs(a1 - a0);
    this.mesh.geometry.dispose();
    this.mesh.geometry = new THREE.RingGeometry(r - SWEEP.width / 2, r + SWEEP.width / 2, 48, 1, Math.PI / 2 - start - len, len).rotateX(-Math.PI / 2);
    this.mesh.position.set(c.x, c.y + 0.06, c.z);
    this.m.opacity = 0.35 + 0.25 * Math.sin(t * 16);
    this.mesh.visible = true;
  }

  hide() {
    this.mesh.visible = false;
  }
}

/** One crane arm: where it rests, what it is doing, and the claw's position (relative to the turret). */
interface Arm {
  m: ArmModel;
  /** Its own direction from the turret (radians, like atan2(dx, dz)). */
  home: number;
  state: ArmState;
  t: number;
  claw: THREE.Vector3;
  from: THREE.Vector3;
  to: THREE.Vector3;
  /** For a sweep: radius and start/end angles. */
  r: number;
  a0: number;
  a1: number;
  hit: boolean;
  joint: Joint;
  mark: SlamMark;
}

/** An arm's elbow: a target only Atalanta's power arrow can jam (while it glows). */
class Joint implements Target {
  readonly aim = new THREE.Vector3();
  radius = 0.7;
  aimable = false;
  alive = true;

  constructor(
    private boss: Scylla,
    private arm: () => Arm,
  ) {}

  /** Glowing: raised to slam, or stuck in the floor after one. */
  get open() {
    const s = this.arm().state;
    return s === 'raise' || s === 'stuck' || s === 'sweepWarn';
  }

  powerArrow(): boolean {
    return this.boss.jam(this.arm());
  }

  hit(_dmg: number, kind: HitKind): boolean {
    this.boss.ping(this.aim, kind, this.open);
    return true;
  }
}

/** One of the three hatch plates around her turret: only a GROUND POUND crushes it, while it's open. */
class Plate implements Target {
  readonly aim: THREE.Vector3;
  radius = 0.9;
  aimable = false;
  alive = true;
  crushed = false;
  open = 0;
  readonly lid: THREE.Group;
  readonly glow: THREE.MeshStandardMaterial;

  constructor(
    private boss: Scylla,
    x: number,
    y: number,
    z: number,
  ) {
    this.aim = new THREE.Vector3(x, y + 0.3, z);
    this.lid = new THREE.Group();
    this.glow = ownMat('#5a4a3a', { emissive: '#7fe6ff', ei: 0, rough: 0.4, metal: 0.6 });
    this.lid.add(mesh(cyl(0.95, 1.05, 0.22, 16), mat(SCYLLA.bronze, { metal: 0.6, rough: 0.45 }), 0, 0.11, 0));
    this.lid.add(mesh(cyl(0.7, 0.7, 0.06, 16), this.glow, 0, 0.25, 0, false));
    this.lid.add(mesh(torus(0.85, 0.05), mat(SCYLLA.gold, { metal: 0.8, rough: 0.3 }), 0, 0.23, 0, false).rotateX(Math.PI / 2));
    this.lid.position.set(x, y, z);
  }

  hit(_dmg: number, kind: HitKind): boolean {
    if (kind === 'pound' && this.open > 0.5 && !this.crushed) return this.boss.crush(this);
    if (kind === 'pound') this.boss.ping(this.aim, kind, false);
    return false;
  }
}

export class Scylla extends Boss implements Target {
  readonly title = 'SCYLLA';
  protected focusHeight = 5;
  readonly aim = new THREE.Vector3();
  radius = 2.4;
  aimable = false;
  private m = makeScyllaModel();
  private arms: Arm[] = [];
  private plates: Plate[] = [];
  private mode: Mode = 'idle';
  private modeT = 0;
  private nextT = 2;
  private turn = 0;
  /** Arms jammed this round, and plates crushed so far. */
  private jammed = 0;
  private round = 0;
  private floorY: number;
  private front = 0;
  private sweepMark = new SweepMark();
  private whirl: Charybdis | null = null;
  private hinted = new Set<string>();
  private base: Box;
  private cabYaw = 0;

  constructor(world: World, id: string, cx: number, cz: number, h: number) {
    super(world, id, cx, cz, h, HP);
    this.floorY = h;
    const c = this.center;
    this.m.root.position.copy(c);
    this.obj.add(this.m.root, this.sweepMark.mesh);
    for (let i = 0; i < 6; i++) {
      const arm: Arm = {
        m: this.m.arms[i],
        home: 0,
        state: 'rest',
        t: 0,
        claw: new THREE.Vector3(),
        from: new THREE.Vector3(),
        to: new THREE.Vector3(),
        r: 6,
        a0: 0,
        a1: 0,
        hit: false,
        joint: null as unknown as Joint,
        mark: new SlamMark(),
      };
      arm.joint = new Joint(this, () => arm);
      this.obj.add(arm.mark.group);
      this.arms.push(arm);
      world.addTarget(arm.joint);
    }
    // The turret is solid: nobody walks through her.
    this.base = { minX: c.x - 2.1, maxX: c.x + 2.1, minZ: c.z - 2.1, maxZ: c.z + 2.1, bottom: h, top: h + 4, solid: true, dx: 0, dy: 0, dz: 0, owner: this };
    world.boxes.push(this.base);
    world.addTarget(this);
    this.aimArms(0);
    this.sync(0);
  }

  get size() {
    return 3.4;
  }

  /** Arms still able to fight (not broken for good). */
  private get working() {
    return this.arms.filter((a) => a.state !== 'broken');
  }

  /** Points the arms (and the plates) toward the arena: the side the whirlpool is on. */
  private aimArms(front: number) {
    this.front = front;
    this.arms.forEach((a, i) => {
      a.home = front + (i - 2.5) * 0.42;
      this.restSpot(a, a.claw);
    });
    for (const p of this.plates) {
      p.alive = false;
      p.lid.removeFromParent();
      this.world.removeTarget(p);
    }
    this.plates = [];
    for (const off of [-0.9, 0, 0.9]) {
      const x = this.center.x + Math.sin(front + off) * 3.6;
      const z = this.center.z + Math.cos(front + off) * 3.6;
      const c = this.world.grid.cell(Grid.toCell(x), Grid.toCell(z));
      const p = new Plate(this, x, c.kind === 'floor' ? c.h : this.floorY, z);
      this.plates.push(p);
      this.obj.add(p.lid);
      this.world.addTarget(p);
    }
  }

  /** Where an arm's claw hangs while it waits (relative to the turret). */
  private restSpot(a: Arm, out: THREE.Vector3) {
    const sway = Math.sin(this.t * 1.3 + a.home * 3) * 0.25;
    return out.set(Math.sin(a.home) * 4.4, 3.4 + sway, Math.cos(a.home) * 4.4);
  }

  private shoulder(a: Arm, out: THREE.Vector3) {
    return out.set(Math.sin(a.home) * 0.9, this.m.shoulderY, Math.cos(a.home) * 0.9);
  }

  /** A world spot as seen from the turret (the arms are posed relative to it). */
  private local(p: THREE.Vector3, out: THREE.Vector3) {
    return out.copy(p).sub(this.center);
  }

  update(dt: number) {
    this.t += dt;
    const w = this.world;
    if (!this.whirl) {
      // Charybdis waits in the middle of the arena (a marker); the arms reach toward it.
      const at = w.marker('charybdis');
      if (at) {
        this.whirl = w.addEntity(new Charybdis(w, at));
        this.aimArms(Math.atan2(at.x - this.center.x, at.z - this.center.z));
      }
    }
    if (this.whirl) this.whirl.active = this.started && !this.defeated;
    if (!this.started || this.defeated) {
      if (!this.started && !this.defeated && this.playerDist() < 24) this.begin();
      for (const a of this.arms) this.stepArm(a, dt);
      this.sync(dt);
      return;
    }
    this.modeT -= dt;
    switch (this.mode) {
      case 'idle':
      case 'fight':
        this.nextT -= dt;
        if (this.nextT <= 0) {
          this.attack();
          this.nextT = PACE[Math.min(this.round, PACE.length - 1)];
          // With her last two arms she sometimes swings both at once.
          if (this.round >= 2 && this.turn % 2 === 0) this.attack();
        }
        break;
      case 'overload':
        if (this.modeT <= 0) {
          // Too slow: she shakes it off, the plates close and the jammed arms work again.
          this.mode = 'fight';
          this.nextT = 1.5;
          for (const a of this.arms) {
            if (a.state !== 'jammed') continue;
            a.state = 'back';
            a.t = 0;
            a.from.copy(a.claw);
          }
          this.jammed = 0;
          w.hooks.toast('She shook it off! Jam two arms again, then pound a plate quickly.', 'bolt');
        }
        break;
      case 'rise':
        if (this.modeT <= 0) {
          // Back up with a roar, and a ring of shaken rock rolls out from her base: jump it.
          this.mode = 'fight';
          this.nextT = 1.4;
          w.addEntity(new Shockwave(w, this.center.x, this.floorY, this.center.z, 13, 8, '#ffd166'));
          audio.play('pound');
          audio.play('roar', 0.9);
          w.shake(0.5);
        }
        break;
    }
    for (const a of this.arms) this.stepArm(a, dt);
    this.sync(dt);
  }

  /** One arm's move this frame. */
  private stepArm(a: Arm, dt: number) {
    const p = this.player.body;
    a.t += dt;
    switch (a.state) {
      case 'rest':
        this.restSpot(a, tmp);
        a.claw.lerp(tmp, Math.min(1, dt * 3));
        break;
      case 'raise': {
        // Up over the spot, while the red ring shrinks onto it.
        tmp.set(a.to.x, a.to.y + 4.6, a.to.z);
        a.claw.lerpVectors(a.from, tmp, smooth(Math.min(1, a.t / 0.6)));
        a.mark.show(tmp2.copy(a.to).add(this.center), Math.min(1, a.t / SLAM.warn), this.t);
        if (a.t >= SLAM.warn) {
          a.state = 'drop';
          a.t = 0;
          a.from.copy(a.claw);
        }
        break;
      }
      case 'drop': {
        const k = Math.min(1, a.t / SLAM.drop);
        tmp.set(a.to.x, a.to.y + 0.7, a.to.z);
        a.claw.lerpVectors(a.from, tmp, k * k);
        if (k >= 1) {
          this.impact(a);
          a.state = 'stuck';
          a.t = 0;
        }
        break;
      }
      case 'stuck':
        if (a.t >= SLAM.stuck) {
          a.state = 'back';
          a.t = 0;
          a.from.copy(a.claw);
        }
        break;
      case 'sweepWarn':
        // The claw drops to knee height at one end of the arc; the gold arc shows its path.
        tmp.set(Math.sin(a.a0) * a.r, 0.8, Math.cos(a.a0) * a.r);
        a.claw.lerpVectors(a.from, tmp, smooth(Math.min(1, a.t / (SWEEP.warn * 0.8))));
        this.sweepMark.show(this.center, a.r, a.a0, a.a1, this.t);
        if (a.t >= SWEEP.warn) {
          a.state = 'sweep';
          a.t = 0;
          audio.play('dash', 0.6);
        }
        break;
      case 'sweep': {
        const k = Math.min(1, a.t / SWEEP.time);
        const ang = a.a0 + (a.a1 - a.a0) * smooth(k);
        a.claw.set(Math.sin(ang) * a.r, 0.8, Math.cos(ang) * a.r);
        this.sweepMark.show(this.center, a.r, a.a0, a.a1, this.t);
        const x = this.center.x + a.claw.x;
        const z = this.center.z + a.claw.z;
        if (Math.random() < 0.5) this.world.particles.emit(x, this.floorY + 0.2, z, { count: 1, color: '#e8dcc8', speed: 2, life: 0.4, size: 0.5 });
        // Jump over it!
        if (!a.hit && this.started && Math.hypot(p.x - x, p.z - z) < SWEEP.width / 2 + 0.7 && p.y < this.floorY + 1.0) {
          a.hit = true;
          this.player.hurt(1, x, z);
        }
        if (k >= 1) {
          a.state = 'back';
          a.t = 0;
          a.from.copy(a.claw);
          this.sweepMark.hide();
        }
        break;
      }
      case 'back':
        this.restSpot(a, tmp);
        a.claw.lerpVectors(a.from, tmp, smooth(Math.min(1, a.t / SLAM.back)));
        if (a.t >= SLAM.back) a.state = 'rest';
        break;
      case 'jammed':
      case 'broken': {
        // Limp: the claw sags onto the floor below it, sparking now and then.
        const c = this.world.grid.cell(Grid.toCell(this.center.x + a.from.x), Grid.toCell(this.center.z + a.from.z));
        const ground = c.kind === 'floor' ? c.h - this.floorY + 0.5 : -1.5;
        tmp.set(a.from.x, ground, a.from.z);
        a.claw.lerpVectors(a.from, tmp, Math.min(1, (a.t / 0.45) ** 2));
        const spark = a.state === 'jammed' ? 0.25 : 0.04;
        if (Math.random() < spark) {
          const j = a.joint.aim;
          this.world.particles.emit(j.x, j.y, j.z, { count: 3, color: a.state === 'jammed' ? '#bff4ff' : '#ffb04a', speed: 4, life: 0.4, size: 0.3 });
        }
        break;
      }
    }
  }

  /** A claw hits the floor: anyone in the ring is hurt, and from round two a little shockwave rolls out. */
  private impact(a: Arm) {
    const w = this.world;
    const p = this.player.body;
    const x = this.center.x + a.to.x;
    const y = this.floorY + a.to.y;
    const z = this.center.z + a.to.z;
    a.mark.hide();
    audio.play('pound', 0.8);
    haptic('medium');
    w.shake(0.5);
    w.particles.emit(x, y + 0.3, z, { count: 26, color: '#e8dcc8', speed: 7, life: 0.6, size: 0.7, up: 3 });
    w.rings.burst(x, y + 0.05, z, SLAM.radius * 2.4, '#ffd166', 0.4);
    if (Math.hypot(p.x - x, p.z - z) < SLAM.radius + 0.3 && p.y < y + 1.6) this.player.hurt(1, x, z);
    if (this.round >= 1) w.addEntity(new Shockwave(w, x, y, z, 4 + this.round * 1.5, 7, '#ffd166'));
  }

  /** Poses the model: arms between shoulder, elbow and claw, the joints' glow, the plates, the cab. */
  private sync(dt: number) {
    const p = this.player.body;
    const open = this.mode === 'overload';
    for (const a of this.arms) {
      const m = a.m;
      const s = this.shoulder(a, tmp);
      const c = a.claw;
      // The elbow rides above the middle of the arm, pushed out a little: a crane's bend.
      const e = tmp2.copy(s).add(c).multiplyScalar(0.5);
      const reach = Math.hypot(c.x - s.x, c.z - s.z);
      e.y += 1.4 + reach * 0.12;
      e.x += Math.sin(a.home) * 0.6;
      e.z += Math.cos(a.home) * 0.6;
      stretch(m.upper, s, e);
      m.elbow.position.copy(e);
      const wrist = c.clone().add(new THREE.Vector3(0, 0.35, 0));
      stretch(m.lower, e, wrist);
      m.claw.position.copy(wrist);
      m.claw.rotation.y = a.home;
      a.joint.aim.copy(e).add(this.center);
      const limp = a.state === 'jammed' || a.state === 'broken';
      const spread = limp ? 0.7 : a.state === 'raise' || a.state === 'sweepWarn' ? 0.55 + Math.sin(this.t * 18) * 0.1 : a.state === 'drop' || a.state === 'stuck' ? 0.05 : 0.25;
      for (const f of m.fingers) f.rotation.x = damp(f.rotation.x, spread, 10, dt);
      const glow = a.joint.open && this.started && !this.defeated && this.mode === 'fight';
      a.joint.aimable = glow;
      m.jointMat.emissiveIntensity = damp(m.jointMat.emissiveIntensity, glow ? 2.6 + Math.sin(this.t * 10) * 0.6 : 0.1, 10, dt);
      m.jointMat.color.set(a.state === 'broken' ? '#4a4048' : a.state === 'jammed' ? '#6a8a9a' : '#9ab0b8');
      m.jointGlow.material.opacity = damp(m.jointGlow.material.opacity, glow ? 0.85 : 0, 8, dt);
      m.eyeMat.emissiveIntensity = limp || this.defeated ? 0.1 : a.state === 'raise' || a.state === 'sweepWarn' ? 3 + Math.sin(this.t * 30) * 2 : 1.6;
    }
    for (const pl of this.plates) {
      const want = open && !pl.crushed ? 1 : 0;
      pl.open = damp(pl.open, want, 6, dt);
      pl.lid.position.y = pl.aim.y - 0.3 + (pl.crushed ? -0.12 : pl.open * 0.3);
      pl.lid.rotation.x = pl.open * 0.25;
      pl.glow.emissiveIntensity = pl.crushed ? 0 : pl.open * (2.4 + Math.sin(this.t * 9) * 0.8);
      pl.glow.color.set(pl.crushed ? '#2a2420' : '#5a4a3a');
    }
    // The cab watches the hero (within reason), and slumps when she overloads or is beaten.
    const toP = Math.atan2(p.x - this.center.x, p.z - this.center.z);
    const look = this.front + Math.max(-1.1, Math.min(1.1, angleDiff(toP, this.front)));
    this.cabYaw = damp(this.cabYaw, this.started ? look : this.front, 3, dt);
    const cab = this.m.cab;
    cab.rotation.y = this.cabYaw;
    cab.rotation.x = damp(cab.rotation.x, this.defeated ? 0.45 : open ? 0.3 : 0, 4, dt);
    this.m.eyeMat.emissiveIntensity = this.defeated ? 0.05 : open ? (Math.sin(this.t * 25) > 0 ? 2.5 : 0.2) : 2.2;
    if (open && Math.random() < 0.3) this.world.particles.emit(this.center.x, this.center.y + 5.4, this.center.z, { count: 2, color: '#ffd166', speed: 4, life: 0.4, size: 0.35 });
    this.aim.set(this.center.x, this.center.y + 5.2, this.center.z);
  }

  protected onStart() {
    this.mode = 'fight';
    this.nextT = 1.5;
    audio.play('roar', 0.7);
  }

  reset() {
    this.hp = this.maxHp;
    this.mode = 'idle';
    this.jammed = 0;
    this.round = 0;
    this.turn = 0;
    for (const a of this.arms) {
      a.state = 'rest';
      a.mark.hide();
    }
    for (const p of this.plates) {
      p.crushed = false;
      p.open = 0;
    }
    this.sweepMark.hide();
    this.started = false;
  }

  /** Shows a hint once (by key). */
  private hint(key: string, text: string, who: 'bolt' | 'atalanta' | 'iris' | 'jason' = 'bolt') {
    if (this.hinted.has(key)) return;
    this.hinted.add(key);
    this.world.hooks.toast(text, who);
  }

  /** Something bounced off her gold (a joint that isn't glowing, a closed plate, her armour). */
  ping(at: THREE.Vector3, kind: HitKind, jointOpen: boolean) {
    if (!this.started || this.defeated) return;
    const w = this.world;
    audio.play('zap', 1.8);
    w.particles.emit(at.x, at.y, at.z, { count: 6, color: '#ffe08a', speed: 3, life: 0.25, size: 0.35 });
    if (kind === 'zap' || kind === 'pulse') return;
    if (jointOpen && w.player.hero === 'atalanta') this.hint('bow', 'Plain arrows just bounce off! Hold BOW to charge a POWER ARROW, then let go at the glowing joint.', 'iris');
    else if (jointOpen) this.hint('jason', 'That glowing joint needs Atalanta’s POWER ARROW! Switch to her and jam it.', 'bolt');
    else if (kind === 'pound') this.hint('plate', 'The plates are shut tight. Jam two of her arms first, and they’ll pop open!', 'bolt');
    else this.hint('armour', 'Her gold armour is too thick! Watch her elbows: when one glows blue, a POWER ARROW can jam it.', 'bolt');
  }

  /** Her body: everything bounces off. */
  hit(_dmg: number, kind: HitKind): boolean {
    this.ping(this.aim, kind, false);
    return true;
  }

  /** A power arrow hit an elbow. Returns true (the arrow stops on it). */
  jam(a: Arm): boolean {
    if (!this.started || this.defeated || this.mode !== 'fight') return true;
    const w = this.world;
    if (!a.joint.open) {
      this.ping(a.joint.aim, 'shot', false);
      this.hint('wait', 'Not yet! Wait until her elbow glows blue, then shoot.', 'iris');
      return true;
    }
    a.state = 'jammed';
    a.t = 0;
    a.from.copy(a.claw);
    a.mark.hide();
    if (a.r > 0 && this.arms.every((o) => o.state !== 'sweep' && o.state !== 'sweepWarn')) this.sweepMark.hide();
    this.jammed += 1;
    const j = a.joint.aim;
    audio.play('explode', 1.5);
    audio.play('zap', 0.6);
    haptic('medium');
    w.shake(0.35);
    w.hitStop(0.06);
    w.flash(j.x, j.y, j.z, '#7fe6ff', 50, 0.3);
    w.particles.emit(j.x, j.y, j.z, { count: 30, color: '#bff4ff', speed: 8, life: 0.6, size: 0.5 });
    const left = Math.min(JAMS, this.working.length) - this.jammed;
    if (left > 0) this.hint(`jam${this.round}`, 'Jammed! One more arm, and she’ll overload!', 'atalanta');
    else this.overload();
    return true;
  }

  /** Two arms jammed: she slumps and her base plates pop open for Jason. */
  private overload() {
    const w = this.world;
    this.mode = 'overload';
    this.modeT = OPEN;
    this.sweepMark.hide();
    for (const a of this.arms) {
      a.mark.hide();
      if (a.state !== 'jammed' && a.state !== 'broken' && a.state !== 'rest') {
        a.state = 'back';
        a.t = 0;
        a.from.copy(a.claw);
      }
    }
    audio.play('alarm', 0.8);
    audio.play('explode', 0.9);
    w.shake(0.6);
    w.flash(this.aim.x, this.aim.y, this.aim.z, '#ff9a3a', 70, 0.5);
    this.hint(`open${this.round}`, 'She’s overloaded! Switch to Jason and GROUND-POUND a glowing plate by her base!', 'atalanta');
  }

  /** Jason pounded an open plate: a third of her health, and her two jammed arms are broken for good. */
  crush(p: Plate): boolean {
    if (this.mode !== 'overload') return false;
    const w = this.world;
    p.crushed = true;
    p.open = 0;
    audio.play('break');
    audio.play('explode', 0.8);
    haptic('heavy');
    w.shake(0.9);
    w.hitStop(0.1);
    w.flash(p.aim.x, p.aim.y + 1, p.aim.z, '#7fe6ff', 90, 0.5);
    w.particles.emit(p.aim.x, p.aim.y + 0.3, p.aim.z, { count: 50, color: '#ffd166', speed: 10, life: 0.8, size: 0.7, up: 6 });
    for (const a of this.arms) if (a.state === 'jammed') a.state = 'broken';
    this.jammed = 0;
    this.round += 1;
    this.damage(PLATE_DAMAGE);
    if (this.defeated) return true;
    this.mode = 'rise';
    this.modeT = 1.6;
    return true;
  }

  /** Arms she can swing right now. */
  private ready() {
    return this.arms.filter((a) => a.state === 'rest');
  }

  /** Picks the next attack: two slams, then a sweep (two at once with her last arms). */
  private attack() {
    const ready = this.ready();
    if (!ready.length) return;
    const p = this.player.body;
    const kind = this.turn % 3 === 2 ? 'sweep' : 'slam';
    this.turn += 1;
    // The arm whose side the hero is on.
    const toP = Math.atan2(p.x - this.center.x, p.z - this.center.z);
    ready.sort((a, b) => Math.abs(angleDiff(a.home, toP)) - Math.abs(angleDiff(b.home, toP)));
    const a = ready[0];
    a.t = 0;
    a.hit = false;
    a.from.copy(a.claw);
    if (kind === 'slam') {
      a.state = 'raise';
      this.local(tmp.set(p.x, this.floorY, p.z), a.to);
      const d = Math.hypot(a.to.x, a.to.z);
      if (d > REACH) a.to.multiplyScalar(REACH / d);
      if (d < 2.6) a.to.multiplyScalar(2.6 / Math.max(0.1, d));
      // Slam onto the floor under the spot (wherever it is: the arena, a ledge or the whirlpool's rim).
      const c = this.world.grid.cell(Grid.toCell(this.center.x + a.to.x), Grid.toCell(this.center.z + a.to.z));
      a.to.y = c.kind === 'floor' ? c.h - this.floorY : 0;
      audio.play('roar', 1.6, 0.4);
    } else {
      a.state = 'sweepWarn';
      a.r = Math.min(REACH - 1, Math.max(3.4, Math.hypot(p.x - this.center.x, p.z - this.center.z)));
      const dir = Math.sign(angleDiff(toP, a.home)) || 1;
      a.a0 = toP - dir * 1.3;
      a.a1 = toP + dir * 1.3;
      audio.play('glide', 0.5);
    }
  }
}

const smooth = (k: number) => k * k * (3 - 2 * k);

/** Signed difference between two angles, in -PI..PI. */
function angleDiff(a: number, b: number) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

