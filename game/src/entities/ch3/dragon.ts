import * as THREE from 'three';

import { audio } from '../../core/audio';
import { haptic } from '../../core/bridge';
import { damp } from '../../core/math';
import type { World } from '../../game/world';
import type { Speaker } from '../../world/levelTypes';
import { Boss } from '../bossBase';
import type { HitKind, Target } from '../entity';
import { Shockwave, Strike } from '../hazards';
import { DRAGON, makeDragonModel, SEGS } from './dragonModel';
import { PYLON_KINDS, Pylon } from './pylons';

/**
 * THE SLEEPLESS DRAGON (chapter 3, the Garden of Colchis): a huge serpent of vines and crystal, coiled
 * around the great crystal tree in front of the Fleece vault. It has guarded the Fleece for a thousand
 * years without a wink of sleep, and Aeëtes's drones have been poking it all week. It isn't evil and it
 * can't be beaten: blasts and arrows only make it blink. The heroes light the four LULLABY PYLONS around
 * its lawn (see `pylons.ts`, one hero's skill each), and with every pylon LUX and IRIS sing another verse:
 * it gets drowsy for a moment, then shakes it off a little crosser. With all four lit, it curls up
 * around its tree and falls asleep (the boss bar is how awake it still is).
 *
 * Its moves, each with a clear warning:
 * - TAIL SLAM: the tail rises and rattles its crystals, then slams: a ring rolls across the lawn (jump it).
 *   Two rings from the second pylon on.
 * - CRYSTAL BREATH: it rears up, its mouth glows, then it breathes a fan of crystal shards at the hero
 *   (two fans from the first pylon on). Three hits on its head while it glows make it sneeze instead.
 * - CRYSTAL RAIN (from the first pylon on): it shakes its tree and crystals drop on glowing circles.
 */

const HP = PYLON_KINDS.length;
/** The coil around the tree: its radius and how far it climbs. */
const COIL_R = 4.3;
const COIL = { from: 9, to: 22, step: 0.5 };
/** How long it naps after each verse of the lullaby, and the rest between moves. */
const DROWSY = 3.6;
const REST = [2.6, 2.3, 2.1, 1.9];

type State = 'watch' | 'wake' | 'idle' | 'slamWarn' | 'slam' | 'breathWarn' | 'breath' | 'rainWarn' | 'drowsy';
type Move = 'slam' | 'breath' | 'rain';

const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

/** What the droids say after each verse (LUX is `bolt`). */
const VERSES: { who: Speaker; text: string }[] = [
  { who: 'bolt', text: 'The first verse! Sing with me, IRIS: “Sleep, sleep...” Look, its eyes are drooping!' },
  { who: 'iris', text: 'Two words of the lullaby are glowing. It is fighting to stay awake, poor thing.' },
  { who: 'bolt', text: 'Three! Its head is SO heavy now. One more pylon!' },
];

export class Dragon extends Boss implements Target {
  readonly title = 'THE SLEEPLESS DRAGON';
  protected focusHeight = 5.2;
  readonly aim = new THREE.Vector3();
  radius = 1.7;
  aimable = false;
  /** 0 wide awake, 1 fast asleep (the lullaby cutscene raises it). */
  sleepK = 0;
  private m = makeDragonModel();
  private pylons: Pylon[] = [];
  private state: State = 'watch';
  private stateT = 0;
  private turn = 0;
  private lit = 0;
  /** Angle of the head around the tree, the head's spot, and where it looks. */
  private headA = Math.PI / 2;
  private head = new THREE.Vector3();
  private look = new THREE.Vector3();
  private tail = 0;
  private flinch = 0;
  private breathHits = 0;
  private volleys = 0;
  private slams = 0;
  private hinted = { hurt: false, sneeze: false };
  private pts: THREE.Vector3[] = Array.from({ length: SEGS }, () => new THREE.Vector3());

  constructor(world: World, id: string, cx: number, cz: number, h: number) {
    super(world, id, cx, cz, h, HP);
    this.m.root.position.copy(this.center);
    this.obj.add(this.m.root);
    // The tree and the coil around it are solid (a little inside the coil's outline).
    const r = COIL_R * 0.84;
    const c = this.center;
    world.boxes.push({ minX: c.x - r, maxX: c.x + r, minZ: c.z - r, maxZ: c.z + r, bottom: h - 1, top: h + 9, solid: true, dx: 0, dy: 0, dz: 0, owner: this });
    world.addTarget(this);
    this.head.set(c.x, h + 5, c.z + 6);
    this.pose(0);
  }

  get where(): THREE.Vector3 {
    return this.center;
  }

  get size() {
    return 3.4;
  }

  /** Where the cutscenes look: its head. */
  get focus(): THREE.Vector3 {
    return this.head.clone();
  }

  /** The pylons stand on the level's `pylon:<kind>` markers (made on first use: the markers load after the boss). */
  private ensurePylons() {
    if (this.pylons.length) return;
    for (const kind of PYLON_KINDS) {
      const at = this.world.marker(`pylon:${kind}`);
      if (at) this.pylons.push(this.world.addEntity(new Pylon(this.world, kind, at, () => this.verse())));
    }
  }

  private set(state: State, t: number) {
    this.state = state;
    this.stateT = t;
  }

  protected onIntro() {
    this.set('wake', 0);
  }

  protected onStart() {
    this.ensurePylons();
    for (const p of this.pylons) p.active = true;
    this.set('idle', 2.2);
    audio.play('roar', 0.7);
  }

  reset() {
    this.hp = this.maxHp;
    this.lit = 0;
    this.turn = 0;
    this.tail = 0;
    this.set('watch', 0);
    for (const p of this.pylons) p.reset();
  }

  /** A pylon was lit: another verse of the lullaby. */
  private verse() {
    if (this.defeated) return;
    this.lit += 1;
    this.damage(1);
    if (this.defeated) return;
    const v = VERSES[Math.min(VERSES.length - 1, this.lit - 1)];
    this.world.hooks.toast(v.text, v.who);
    this.set('drowsy', DROWSY);
    this.tail = 0;
    this.m.mouthGlow.material.opacity = 0;
    this.notes(26);
  }

  /** Music notes of light flying from both droids to its head. */
  private notes(n: number) {
    const w = this.world;
    for (const d of [w.lux, w.iris]) {
      const p = d.pos;
      tmp.copy(this.head).sub(p).multiplyScalar(0.9);
      for (let i = 0; i < n / 2; i++) {
        const k = 0.6 + Math.random() * 0.5;
        w.particles.emit(p.x, p.y, p.z, { count: 1, color: Math.random() < 0.5 ? DRAGON.glow : '#ff9ad8', speed: 0.4, life: 1.1, size: 0.45, gravity: 0, drag: 0, vel: [tmp.x * k, tmp.y * k + 1, tmp.z * k] });
      }
    }
  }

  /** No more verses to sing: the last pylon put it to sleep. A gentle finish, no explosions. */
  protected finish() {
    this.defeated = true;
    this.aimable = false;
    this.m.mouthGlow.material.opacity = 0;
    const c = this.center;
    this.notes(40);
    audio.play('success');
    haptic('success');
    this.world.dropBolts(tmp.set(c.x, c.y + 2, c.z + COIL_R + 1.5), 40);
    this.world.bossDefeated(this);
  }

  hit(_dmg: number, kind: HitKind): boolean {
    if (!this.started || this.defeated) return true;
    const w = this.world;
    this.flinch = 1;
    w.particles.emit(this.aim.x, this.aim.y, this.aim.z, { count: 6, color: DRAGON.crystal, speed: 3, life: 0.3, size: 0.35 });
    audio.play('zap', 1.6, 0.7);
    if (this.state === 'breathWarn') {
      this.breathHits += 1;
      if (this.breathHits >= 3) this.sneeze();
      return true;
    }
    if (!this.hinted.hurt && kind !== 'zap' && kind !== 'pulse') {
      this.hinted.hurt = true;
      w.hooks.toast('Blasts just make it blink! It’s only guarding the Fleece. Light the LULLABY PYLONS instead!', 'iris');
    }
    return true;
  }

  /** Enough hits on the nose while it charges its breath: it sneezes the crystals away harmlessly. */
  private sneeze() {
    const w = this.world;
    audio.play('sputter', 0.7);
    w.particles.emit(this.aim.x, this.aim.y, this.aim.z, { count: 24, color: DRAGON.crystal, speed: 6, life: 0.6, size: 0.4 });
    this.m.mouthGlow.material.opacity = 0;
    this.set('idle', REST[this.lit] + 0.6);
    if (!this.hinted.sneeze) {
      this.hinted.sneeze = true;
      w.hooks.toast('Ha! It sneezed! Hitting its nose while it glows stops the crystal breath.', 'bolt');
    }
  }

  /** Its next move: tail slam and crystal breath, plus crystal rain once the lullaby has begun. */
  private nextMove() {
    const pool: Move[] = this.lit >= 1 ? ['slam', 'breath', 'rain'] : ['slam', 'breath'];
    const move = pool[this.turn % pool.length];
    this.turn += 1;
    if (move === 'slam') {
      this.slams = this.lit >= 2 ? 2 : 1;
      this.set('slamWarn', 1);
      audio.play('vent', 0.5);
    } else if (move === 'breath') {
      this.volleys = this.lit >= 1 ? 2 : 1;
      this.breathHits = 0;
      this.set('breathWarn', 1.2);
      audio.play('charge', 0.6);
    } else {
      this.set('rainWarn', 0.9);
      audio.play('roar', 1.3, 0.5);
    }
  }

  update(dt: number) {
    this.t += dt;
    const w = this.world;
    const p = this.player.body;
    const c = this.center;
    this.flinch = Math.max(0, this.flinch - dt * 4);
    // The head follows the hero around the tree (slowly, so it can be outrun).
    const want = Math.atan2(p.z - c.z, p.x - c.x);
    let da = want - this.headA;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    const turnRate = this.defeated ? 0 : this.state === 'breath' || this.state === 'drowsy' ? 0.15 : 0.8;
    this.headA += Math.max(-turnRate * dt, Math.min(turnRate * dt, da));
    if (this.defeated) {
      this.sleepK = Math.max(this.sleepK, damp(this.sleepK, 1, 0.8, dt));
      if (Math.random() < dt * 1.2) w.particles.emit(this.head.x, this.head.y + 1.2, this.head.z, { count: 1, color: '#ffffff', speed: 0.2, up: 1.2, life: 2, size: 0.7, gravity: -0.4 });
      this.pose(dt);
      return;
    }
    if (!this.started) {
      this.ensurePylons();
      if (this.state !== 'wake' && this.playerDist() < 15 && Math.abs(p.y - c.y) < 4) this.begin();
      this.pose(dt);
      return;
    }
    this.stateT -= dt;
    switch (this.state) {
      case 'watch':
      case 'wake':
        this.set('idle', 1.5);
        break;
      case 'idle':
        if (this.stateT <= 0) this.nextMove();
        break;
      case 'slamWarn':
        // The tail rises, rattling its crystals.
        this.tail = damp(this.tail, 1, 6, dt);
        if (this.stateT <= 0) this.slam();
        break;
      case 'slam':
        this.tail = damp(this.tail, 0, 10, dt);
        if (this.stateT <= 0) {
          if (this.slams > 0) this.set('slamWarn', 0.55);
          else this.set('idle', REST[this.lit]);
        }
        break;
      case 'breathWarn':
        this.m.mouthGlow.material.opacity = Math.min(1, 1.2 - Math.max(0, this.stateT));
        if (Math.random() < dt * 16) w.particles.emit(this.aim.x + (Math.random() - 0.5) * 3, this.aim.y + (Math.random() - 0.5) * 3, this.aim.z + (Math.random() - 0.5) * 3, { count: 1, color: DRAGON.crystal, speed: 0.5, life: 0.35, size: 0.3, gravity: 0 });
        if (this.stateT <= 0) this.breathe();
        break;
      case 'breath':
        if (this.stateT <= 0) {
          if (this.volleys > 0) this.breathe();
          else {
            this.m.mouthGlow.material.opacity = 0;
            this.set('idle', REST[this.lit]);
          }
        }
        break;
      case 'rainWarn':
        if (this.stateT <= 0) this.rain();
        break;
      case 'drowsy':
        // A big yawn and a nod... then it shakes itself awake, a little crosser.
        if (Math.random() < dt * 2) w.particles.emit(this.head.x, this.head.y + 1, this.head.z, { count: 1, color: '#ffffff', speed: 0.2, up: 1, life: 1.6, size: 0.6, gravity: -0.3 });
        if (this.stateT <= 0) {
          audio.play('roar', 0.9);
          w.shake(0.4);
          this.set('idle', 1.4);
        }
        break;
    }
    this.pose(dt);
  }

  /** The tail comes down: a ring rolls out across the lawn. */
  private slam() {
    const w = this.world;
    const c = this.center;
    this.slams -= 1;
    this.set('slam', 0.5);
    w.addEntity(new Shockwave(w, c.x, c.y, c.z, 24, 8.5, DRAGON.glow));
    audio.play('pound', 0.8);
    w.shake(0.5);
    const tip = this.pts[0];
    w.particles.emit(tip.x, c.y + 0.3, tip.z, { count: 26, color: '#8fd07a', speed: 7, up: 3, life: 0.7, size: 0.7 });
  }

  /** A fan of crystal shards at the hero. */
  private breathe() {
    const w = this.world;
    const p = this.player.body;
    this.volleys -= 1;
    this.set('breath', 0.55);
    const from = this.aim.clone();
    const dir = tmp.set(p.x - from.x, p.y + 0.9 - from.y, p.z - from.z).normalize();
    const n = 5;
    for (let i = 0; i < n; i++) {
      const a = (i - (n - 1) / 2) * 0.17 + (this.volleys % 2 ? 0.085 : 0);
      w.shots.fire('enemy', from, tmp2.copy(dir).applyAxisAngle(UP, a), 12, 1);
    }
    audio.play('enemyShoot', 0.6);
    w.particles.emit(from.x, from.y, from.z, { count: 14, color: DRAGON.crystal, speed: 5, life: 0.4, size: 0.4 });
  }

  /** It shakes its tree: crystals fall on glowing circles around the hero (one right under them). */
  private rain() {
    const w = this.world;
    const p = this.player.body;
    const n = 3 + this.lit;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = i === 0 ? 0 : 2.5 + Math.random() * 3.5;
      w.addEntity(new Strike(w, p.x + Math.cos(a) * r, this.center.y, p.z + Math.sin(a) * r, 1.3, 1.3, DRAGON.crystal, 'ice'));
    }
    w.shake(0.3);
    this.set('idle', REST[this.lit] + 1);
  }

  /** Where the head wants to be (radius from the tree, height) in each state. */
  private headSpot(): [number, number] {
    const t = this.t;
    switch (this.state) {
      case 'breathWarn':
        return [5, 6.4];
      case 'breath':
        return [7.2, 4.4];
      case 'slamWarn':
      case 'slam':
        return [5.8, 5.8];
      case 'drowsy':
        return [5.2, 3.2 + Math.sin(t * 1.6) * 0.35];
      default:
        return [6.2, 5 + Math.sin(t * 1.3) * 0.4];
    }
  }

  /** Places the head, the neck, the coil around the tree and the tail, and animates the face. */
  private pose(dt: number) {
    const m = this.m;
    const c = this.center;
    const t = this.t;
    const k = this.sleepK;
    const p = this.player.body;
    let [rh, hh] = this.headSpot();
    // Asleep: the head rests on top of its own coil.
    rh += (COIL_R + 0.6 - rh) * k - this.flinch * 0.5;
    hh += (3.7 - hh) * k + this.flinch * 0.6;
    const tx = c.x + Math.cos(this.headA) * rh;
    const tz = c.z + Math.sin(this.headA) * rh;
    const rate = dt > 0 ? (this.state === 'breath' ? 9 : 3.5) : 1000;
    this.head.set(damp(this.head.x, tx, rate, dt || 1), damp(this.head.y, c.y + hh, rate, dt || 1), damp(this.head.z, tz, rate, dt || 1));
    // Where it looks: at the hero while awake, down at its coil as it nods off.
    if (k > 0.01 || this.state === 'drowsy') {
      const a = this.headA + 0.9;
      this.look.set(c.x + Math.cos(a) * COIL_R, c.y + 2.2 - k, c.z + Math.sin(a) * COIL_R);
    } else this.look.set(p.x, p.y + 1, p.z);
    m.head.position.copy(this.head).sub(c);
    m.head.lookAt(this.look);
    // The face: the jaw opens to breathe and to yawn, the eyelids droop with the lullaby.
    const yawn = this.state === 'drowsy' ? Math.max(0, Math.sin((DROWSY - this.stateT) * 1.4)) * 0.6 : 0;
    const open = this.state === 'breathWarn' ? 0.45 : this.state === 'breath' ? 0.75 : this.state === 'rainWarn' ? 0.5 : yawn;
    m.jaw.rotation.x = damp(m.jaw.rotation.x, open * (1 - k), 8, dt || 1);
    const blink = Math.sin(t * 0.9) > 0.985 ? 1 : 0;
    const shut = Math.max(k, this.state === 'drowsy' ? 0.7 : this.lit * 0.12, blink);
    for (const lid of m.lids) {
      lid.scale.y = 0.25 + shut * 0.8;
      lid.position.y = 0.3 - shut * 0.08;
    }
    m.eyeMat.emissiveIntensity = 1.6 * (1 - shut * 0.8);
    m.gemMat.emissiveIntensity = 1 + this.lit * 0.6 + Math.sin(t * 3) * 0.3;
    m.spikeMat.emissiveIntensity = 0.5 + this.tail * 2 + (this.state === 'rainWarn' ? 1.5 : 0);
    m.leafMat.emissiveIntensity = 0.5 + this.lit * 0.3 + Math.sin(t * 2) * 0.15;
    if (this.state === 'rainWarn') m.tree.rotation.z = Math.sin(t * 40) * 0.015;
    else m.tree.rotation.z = 0;
    // The body: a coil around the tree that turns with the head, a tail trailing out over the lawn...
    const pts = this.pts;
    const turns = COIL.to - COIL.from;
    const a0 = this.headA - 1.1 - turns * COIL.step;
    for (let i = COIL.from; i <= COIL.to; i++) {
      const a = a0 + (i - COIL.from) * COIL.step;
      const r = COIL_R + Math.sin(t * 1.4 + i * 0.5) * 0.06 * (1 - k * 0.5);
      pts[i].set(Math.cos(a) * r, 0.85 + ((i - COIL.from) / turns) * 1.9, Math.sin(a) * r);
    }
    for (let i = COIL.from - 1; i >= 0; i--) {
      const n = COIL.from - i;
      const a = a0 - n * 0.3;
      const lift = this.tail * Math.pow(n / COIL.from, 1.4) * 4.5;
      const r = COIL_R + n * 0.62 - lift * 0.3;
      pts[i].set(Math.cos(a) * r, m.radii[i] * 0.9 + lift + Math.sin(t * 2 + i) * 0.05 * (1 - k), Math.sin(a) * r);
    }
    // ...and a neck that arcs up from the top of the coil to the head.
    const A = pts[COIL.to];
    const B = tmp.copy(m.head.position).add(tmp2.copy(m.head.position).sub(A).setY(0).normalize().multiplyScalar(-1.3));
    B.y -= 0.3;
    const C = tmp2.copy(A).lerp(B, 0.3);
    C.y += 3.2 * (1 - k * 0.7);
    const span = SEGS - COIL.to;
    for (let i = COIL.to + 1; i < SEGS; i++) {
      const u = (i - COIL.to) / span;
      pts[i].set(0, 0, 0).addScaledVector(A, (1 - u) * (1 - u)).addScaledVector(C, 2 * u * (1 - u)).addScaledVector(B, u * u);
    }
    for (let i = 0; i < SEGS; i++) {
      const s = m.segs[i];
      s.position.copy(pts[i]);
      const next = i < SEGS - 1 ? pts[i + 1] : m.head.position;
      s.lookAt(tmp.copy(next).add(c));
    }
    // Its weak spot, for blasters and arrows: the snout.
    m.head.updateWorldMatrix(true, false);
    m.head.localToWorld(this.aim.set(0, -0.1, 1.1));
    this.aimable = this.started && !this.defeated;
  }
}