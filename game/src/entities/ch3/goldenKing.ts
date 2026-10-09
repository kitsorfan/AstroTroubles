import * as THREE from 'three';

import { audio, type Track } from '../../core/audio';
import { haptic } from '../../core/bridge';
import { damp, dampAngle } from '../../core/math';
import type { World } from '../../game/world';
import { Grid } from '../../world/grid';
import { Boss } from '../bossBase';
import type { Enemy } from '../enemies';
import type { HitKind, Target } from '../entity';
import { Shockwave, Strike } from '../hazards';
import { glowSprite, mat, mesh, ownMat, sphere, torus } from '../models';
import { kingGrows, kingRises } from '../../cinema/fleeceScenes';
import { makeAeetes, makeAltar } from './goldenKingModel';

/**
 * AEËTES, THE GOLDEN KING: the last boss of the game (chapter 3, the Golden Fleece), in three phases
 * that need all three heroes. HP 60 (plus a little for Blaster Power), a third per phase; getting
 * knocked out restarts the phase you reached, never the whole fight.
 *
 * 1. THE COLLECTOR. Aeëtes rides his gold hover-disc round the Fleece chamber inside a gold bubble that
 *    three spinning ring-drones hold up. He rolls gold rings across the floor (jump them), rains gold
 *    coins on red circles and calls gold drones. Shoot the three ring-drones down (any hero) and the
 *    bubble pops: he tumbles off his disc, dizzy, and anyone can hit him.
 * 2. THE FLEECE ARMOUR. He grabs the Golden Fleece and wears it: gold armour that nothing gets through.
 *    He stamps and CHARGES like a ram; General Brennus's SHIELD stops him dead (or he crashes into a
 *    pillar) and he staggers, armour cracked: hit him then. Gold vines also whip up out of the floor in
 *    a line toward the hero.
 * 3. THE GOLDEN KING. The Fleece's vines root him in the middle of the chamber and he grows huge. Three
 *    gold vines tie him to the floor: only Atalanta's POWER ARROW cuts their glowing knots. With all
 *    three cut he slumps forward, and the crystal clasp on his chest is in reach: Brennus's CHARGE (or
 *    big cannon blast) cracks it. Then only Jason can hit the seed-core inside: BLAST it, or POUND it.
 *    Meanwhile he slams the floor (jump the shock rings) and rains coins.
 * At zero he isn't destroyed: the Fleece lets go of him and its vines wrap him up, caught.
 */

const HP = 60;
/** Health at which each phase ends. */
const FLOORS = [40, 20, 0];
/** The ring-drones' orbit, phase 1's hover circle, and phase 3's vine knots (world units). */
const DRONE_ORBIT = 1.9;
const HOVER = { r: 6, y: 1.7 };
const KNOT_R = 9;
const GIANT = 2.8;
const CHARGE_SPEED = 11;

type Phase = 1 | 2 | 3;
type State = 'hover' | 'toss' | 'coins' | 'summon' | 'dizzy' | 'walk' | 'rev' | 'charge' | 'stunned' | 'whip' | 'rooted' | 'slam' | 'bare' | 'open' | 'change';

/** One of the three gold ring-drones that hold up Aeëtes's bubble in phase 1. Any hit knocks it out. */
class RingDrone implements Target {
  alive = true;
  readonly aim = new THREE.Vector3();
  radius = 0.7;
  aimable = true;
  hp = 2;
  readonly group = new THREE.Group();

  constructor(
    private king: GoldenKing,
    readonly index: number,
  ) {
    const m = ownMat('#ffd166', { emissive: '#ffb020', ei: 1.2, metal: 0.8, rough: 0.2 });
    this.group.add(mesh(torus(0.38, 0.09), m, 0, 0, 0, false), mesh(sphere(0.14, 10), mat('#ff3a4c', { emissive: '#ff3a4c', ei: 2 }), 0, 0, 0, false), glowSprite('#ffd166', 1.6, 0.6));
  }

  hit(dmg: number, _kind: HitKind, _from: THREE.Vector3): boolean {
    if (!this.alive) return false;
    this.hp -= dmg;
    this.king.world.particles.emit(this.aim.x, this.aim.y, this.aim.z, { count: 8, color: '#ffd166', speed: 4, life: 0.3, size: 0.4 });
    audio.play('hit', 1.5);
    if (this.hp <= 0) this.king.droneDown(this);
    return true;
  }
}

/** A glowing knot where one of the Golden King's vines roots into the floor (phase 3). Only a power arrow cuts it. */
class VineKnot implements Target {
  alive = true;
  readonly aim: THREE.Vector3;
  radius = 0.9;
  aimable = true;
  readonly group = new THREE.Group();
  readonly mat: THREE.MeshStandardMaterial;

  constructor(
    private king: GoldenKing,
    readonly at: THREE.Vector3,
  ) {
    this.aim = at.clone().add(new THREE.Vector3(0, 1.2, 0));
    this.mat = ownMat('#ffe08a', { emissive: '#ff9a10', ei: 1.4, metal: 0.4, rough: 0.3 });
    const knot = mesh(sphere(0.55, 14), this.mat, 0, 1.2, 0, false);
    knot.scale.set(1, 1.3, 1);
    // A target ring around it: "aim here".
    const ring = mesh(torus(0.8, 0.06), mat('#ffffff', { emissive: '#ff5e6a', ei: 1.5 }), 0, 1.2, 0, false);
    this.group.add(knot, ring, glowSprite('#ffd166', 2.4, 0.5).translateY(1.2));
    this.group.position.copy(at);
  }

  powerArrow(): boolean {
    if (!this.alive) return false;
    this.king.knotCut(this);
    return true;
  }

  hit(_dmg: number, kind: HitKind): boolean {
    if (!this.alive) return false;
    audio.play('zap', 1.9, 0.6);
    this.king.world.particles.emit(this.aim.x, this.aim.y, this.aim.z, { count: 5, color: '#ffe08a', speed: 3, life: 0.25, size: 0.35 });
    if (kind !== 'zap' && kind !== 'pulse') this.king.hint('knot', () => this.king.world.hooks.toast('These gold vines are too tough for that! Switch to Atalanta and cut the glowing knots with POWER ARROWS: hold BOW.', 'bolt'));
    return true;
  }
}

export class GoldenKing extends Boss implements Target {
  readonly title = 'AEËTES, THE GOLDEN KING';
  readonly music: Track = 'king';
  protected focusHeight = 2.2;
  readonly aim = new THREE.Vector3();
  radius = 1.2;
  aimable = false;
  phase: Phase = 1;
  private state: State = 'hover';
  private stateT = 2;
  private m = makeAeetes();
  private altar = makeAltar();
  /** Where his feet are, and which way he faces. */
  private pos = new THREE.Vector3();
  private yaw = Math.PI;
  private floorY: number;
  private orbit = 0;
  private turn = 0;
  private dir = new THREE.Vector2();
  private drones: RingDrone[] = [];
  private knots: VineKnot[] = [];
  private tethers: THREE.Mesh[] = [];
  private bubble: THREE.Mesh;
  private stars = new THREE.Group();
  private helpers: Enemy[] = [];
  private pillars: THREE.Vector3[] = [];
  private hinted = new Set<string>();
  /** Damage taken in the current open window (phase 3 caps it, so the fight has a rhythm). */
  private windowDmg = 0;
  /** How much he has grown (1 normally, GIANT in phase 3) and how far he slumps forward (0..1). */
  private grow = 1;
  private slump = 0;

  constructor(world: World, id: string, cx: number, cz: number, h: number) {
    super(world, id, cx, cz, h, HP + 6 * (world.save.upgrades.blaster ?? 0));
    this.floorY = h;
    // He starts on his disc beside the altar, admiring the Fleece.
    this.pos.set(this.center.x, h + HOVER.y, this.center.z + 4);
    this.altar.root.position.set(this.center.x, h, this.center.z);
    this.bubble = new THREE.Mesh(
      new THREE.SphereGeometry(1.9, 24, 16),
      new THREE.MeshStandardMaterial({ color: '#ffe08a', emissive: '#ffb020', emissiveIntensity: 0.6, transparent: true, opacity: 0.22, depthWrite: false, roughness: 0.1 }),
    );
    for (let i = 0; i < 4; i++) this.stars.add(mesh(sphere(0.16, 8), mat('#fff6c0', { emissive: '#ffd166', ei: 2 }), Math.cos(i * 1.57) * 0.9, 0, Math.sin(i * 1.57) * 0.9, false));
    this.stars.visible = false;
    this.obj.add(this.m.root, this.altar.root, this.bubble, this.stars);
    // Rock pillars he can crash into when he charges (solid pillars near the altar).
    for (const e of world.level.entities) {
      if (e.spec.type === 'decor' && e.spec.kind === 'pillar' && e.spec.solid !== false && Math.hypot(e.cx - cx, e.cz - cz) < 14) this.pillars.push(new THREE.Vector3(Grid.center(e.cx), e.h, Grid.center(e.cz)));
    }
    for (let i = 0; i < 3; i++) {
      const d = new RingDrone(this, i);
      this.drones.push(d);
      this.obj.add(d.group);
      world.addTarget(d);
    }
    // The knots where his vines root in phase 3, and the vines themselves (hidden until then).
    for (let i = 0; i < 3; i++) {
      const a = Math.PI / 2 + (i * Math.PI * 2) / 3;
      const k = new VineKnot(this, new THREE.Vector3(this.center.x + Math.cos(a) * KNOT_R, h, this.center.z + Math.sin(a) * KNOT_R));
      k.group.visible = false;
      k.alive = false;
      this.knots.push(k);
      this.obj.add(k.group);
      world.addTarget(k);
      const vine = mesh(new THREE.CylinderGeometry(0.16, 0.3, 1, 8, 1, true).translate(0, 0.5, 0).rotateX(Math.PI / 2), mat('#e8b030', { emissive: '#ffb020', ei: 0.7, metal: 0.4, rough: 0.4 }), 0, 0, 0, false);
      vine.visible = false;
      this.tethers.push(vine);
      this.obj.add(vine);
    }
    world.addTarget(this);
    this.sync(0);
  }

  get where(): THREE.Vector3 {
    return this.pos.clone().setY(this.floorY);
  }

  get size() {
    return this.phase === 3 ? 5 : this.phase === 2 ? 3 : 2.4;
  }

  /** Where the Fleece lies on its altar (for the cutscene where he takes it). */
  get altarSpot(): THREE.Vector3 {
    return new THREE.Vector3(this.center.x, this.floorY + 1, this.center.z);
  }

  /** Shows a hint toast once per fight. */
  hint(key: string, show: () => void) {
    if (this.hinted.has(key)) return;
    this.hinted.add(key);
    show();
  }

  private set(state: State, t: number) {
    this.state = state;
    this.stateT = t;
  }

  /** The health this phase can't go below (the next phase starts there). */
  private get floor() {
    return FLOORS[this.phase - 1];
  }

  protected onStart() {
    this.windowDmg = 0;
    if (this.phase === 1) {
      this.set('hover', 2.5);
      this.orbit = Math.atan2(this.pos.z - this.center.z, this.pos.x - this.center.x);
      this.raiseDrones();
      this.hint('p1', () => this.world.hooks.toast('His gold bubble is held up by three spinning rings! Shoot the rings down, then hit Aeëtes!', 'bolt'));
    } else if (this.phase === 2) this.set('walk', 2.5);
    else this.rootDown();
    audio.play('roar', 0.9);
  }

  /** Knocked out: back to the start of the phase reached (health, place and pieces), waiting for the hero. */
  reset() {
    this.hp = this.phase === 1 ? this.maxHp : FLOORS[this.phase - 2];
    this.clearHelpers();
    this.slump = 0;
    this.stars.visible = false;
    this.aimable = false;
    if (this.phase === 1) {
      this.pos.set(this.center.x, this.floorY + HOVER.y, this.center.z + 4);
      this.set('hover', 2);
      for (const d of this.drones) d.alive = false;
    } else if (this.phase === 2) {
      this.pos.set(this.center.x, this.floorY, this.center.z + 3);
      this.set('walk', 2);
    } else {
      this.pos.set(this.center.x, this.floorY, this.center.z);
      this.set('rooted', 3);
      for (const k of this.knots) k.alive = false;
    }
    this.sync(0);
  }

  /* ---------------- the pieces of each phase ---------------- */

  /** Phase 1: the three ring-drones spin up again and the bubble closes. */
  private raiseDrones() {
    for (const d of this.drones) {
      d.alive = true;
      d.hp = 2;
    }
  }

  /** A ring-drone falls; with all three down the bubble pops and he tumbles off his disc, dizzy. */
  droneDown(d: RingDrone) {
    const w = this.world;
    d.alive = false;
    w.particles.emit(d.aim.x, d.aim.y, d.aim.z, { count: 24, color: '#ffd166', speed: 6, life: 0.5, size: 0.5 });
    audio.play('pop', 0.8);
    if (this.drones.some((x) => x.alive)) return;
    audio.play('explode', 1.2);
    w.flash(this.pos.x, this.pos.y + 1, this.pos.z, '#ffd166', 60, 0.4);
    w.shake(0.4);
    this.set('dizzy', 6.5);
    this.hint('dizzy', () => this.world.hooks.toast('His bubble popped! He’s dizzy: hit him now, everybody!', 'atalanta'));
  }

  /** Gold drones he calls in phase 1 (never more than three about). */
  private summon() {
    this.helpers = this.helpers.filter((e) => e.alive);
    const w = this.world;
    for (let i = this.helpers.length; i < 3 && i < this.helpers.length + 2; i++) {
      const a = Math.random() * Math.PI * 2;
      this.helpers.push(w.spawnEnemy('buzzer', Grid.toCell(this.center.x + Math.cos(a) * 6), Grid.toCell(this.center.z + Math.sin(a) * 6), 'sand'));
    }
    audio.play('alarm', 1.6, 0.4);
  }

  private clearHelpers() {
    for (const e of this.helpers) if (e.alive) e.die();
    this.helpers = [];
  }

  /** Phase 3: his vines root into the floor at the three knots. */
  private rootDown() {
    this.pos.set(this.center.x, this.floorY, this.center.z);
    for (const k of this.knots) {
      k.alive = true;
      k.group.visible = true;
      k.mat.emissiveIntensity = 1.4;
    }
    this.slump = 0;
    this.set('rooted', 3);
    this.hint('p3', () => this.world.hooks.toast('Gold vines hold him to the floor! Atalanta: cut the three glowing knots with POWER ARROWS!', 'iris'));
  }

  /** One of his vines is cut; with all three cut he slumps forward, his chest clasp in reach. */
  knotCut(k: VineKnot) {
    const w = this.world;
    k.alive = false;
    k.group.visible = false;
    w.particles.emit(k.aim.x, k.aim.y, k.aim.z, { count: 30, color: '#ffd166', speed: 7, life: 0.6, size: 0.55, up: 2 });
    w.flash(k.aim.x, k.aim.y, k.aim.z, '#ffd166', 50, 0.3);
    audio.play('break', 0.8);
    haptic('medium');
    if (this.knots.some((x) => x.alive)) {
      this.hint('knot1', () => this.world.hooks.toast('Snip! That vine is cut. Two more knots!', 'atalanta'));
      return;
    }
    audio.play('roar', 0.7, 0.8);
    w.shake(0.5);
    this.set('bare', 15);
    this.hint('bare', () => this.world.hooks.toast('He’s slumped down! Now General Brennus: CHARGE into the crystal clasp on his chest!', 'brennus'));
  }

  /** Brennus cracks the crystal clasp: the seed-core inside is open, for Jason. */
  private crackClasp() {
    const w = this.world;
    audio.play('break');
    audio.play('explode', 1.4);
    w.shake(0.6);
    w.hitStop(0.08);
    w.particles.emit(this.aim.x, this.aim.y, this.aim.z, { count: 36, color: '#fff6c8', speed: 8, life: 0.6, size: 0.5 });
    this.windowDmg = 0;
    this.set('open', 9);
    this.hint('open', () => this.world.hooks.toast('The clasp cracked! Jason: BLAST the glowing seed-core, or jump up and GROUND-POUND it!', 'brennus'));
  }

  private get hero() {
    return this.world.player.hero;
  }

  /** Takes damage, but never below the phase's floor: reaching it starts the next phase (or ends the fight). */
  private hurtBy(n: number) {
    if (n <= 0) return;
    this.hp = Math.max(this.floor, this.hp - n);
    this.world.hooks.bossBar(this.title, this.hp / this.maxHp);
    this.m.armourMat.emissiveIntensity = 3;
    this.m.coreMat.emissiveIntensity = 4;
    audio.play('hit', 0.8);
    if (this.hp > this.floor) return;
    if (this.phase === 3) this.finish();
    else this.change();
  }

  hit(dmg: number, kind: HitKind, from?: THREE.Vector3): boolean {
    void from;
    if (!this.started || this.defeated || this.state === 'change') return true;
    const ping = () => {
      audio.play('zap', 1.5);
      this.world.particles.emit(this.aim.x, this.aim.y, this.aim.z, { count: 6, color: '#ffe08a', speed: 3, life: 0.25, size: 0.35 });
    };
    const quiet = kind === 'zap' || kind === 'pulse';
    switch (this.state) {
      case 'dizzy':
      case 'stunned':
        this.hurtBy(kind === 'smash' ? dmg + 2 : kind === 'blast' || kind === 'pound' ? dmg + 1 : dmg);
        return true;
      case 'bare':
        if (kind === 'smash' || (kind === 'blast' && this.hero === 'brennus')) this.crackClasp();
        else {
          ping();
          if (!quiet) this.hint('clasp', () => this.world.hooks.toast('The crystal clasp is too hard for that! Switch to General Brennus and CHARGE into it: the DASH button.', 'bolt'));
        }
        return true;
      case 'open': {
        if (this.hero !== 'jason' || quiet) {
          ping();
          if (!quiet) this.hint('core', () => this.world.hooks.toast('Only Jason’s blaster can reach the seed-core! Switch to Jason: BLAST it, or POUND it!', 'bolt'));
          return true;
        }
        const n = Math.min(kind === 'pound' ? dmg + 3 : kind === 'blast' ? dmg + 2 : dmg, 11 - this.windowDmg);
        this.windowDmg += n;
        this.hurtBy(n);
        if (this.windowDmg >= 11 && this.state === 'open') this.stateT = Math.min(this.stateT, 0.4);
        return true;
      }
      default:
        ping();
        if (quiet) return true;
        if (this.phase === 1) this.hint('shield1', () => this.world.hooks.toast('Shots bounce off his gold bubble! Shoot the three spinning rings around him first!', 'bolt'));
        else if (this.phase === 2) this.hint('armour', () => this.world.hooks.toast('The Fleece armour is too strong! Stop his charge with General Brennus’s SHIELD, or make him crash into a pillar!', 'bolt'));
        else this.hint('rooted', () => this.world.hooks.toast('Cut his gold vines first: Atalanta’s POWER ARROWS on the glowing knots!', 'bolt'));
        return true;
    }
  }

  /** Phase 1 or 2 is over: a cutscene (he puts on the Fleece, or grows huge), then the next phase. */
  private change() {
    const w = this.world;
    const from = this.phase;
    this.set('change', 99);
    this.aimable = false;
    this.clearHelpers();
    for (const d of this.drones) d.alive = false;
    w.shots.clear();
    this.phase = (from + 1) as Phase;
    void w.hooks.cutscene((d) => (from === 1 ? kingRises(d, w, this) : kingGrows(d, w, this))).then(() => {
      this.wearFleece(1);
      if (this.phase === 3) this.growHuge(1);
      this.onStart();
      w.hooks.bossBar(this.title, this.hp / this.maxHp);
      w.hooks.checkpoint();
    });
  }

  /** The end: not an explosion. The Fleece lets go of him (the finale cutscene does the rest). */
  protected finish() {
    this.defeated = true;
    const w = this.world;
    this.aimable = false;
    for (const k of this.knots) {
      k.alive = false;
      k.group.visible = false;
    }
    this.clearHelpers();
    w.shots.clear();
    audio.play('upgrade');
    haptic('heavy');
    w.shake(0.8);
    w.flash(this.aim.x, this.aim.y, this.aim.z, '#ffd166', 90, 0.9);
    w.particles.emit(this.aim.x, this.aim.y, this.aim.z, { count: 60, color: '#ffd166', speed: 10, life: 1.2, size: 0.8, up: 2 });
    w.dropBolts(this.aim.clone(), 50);
    w.bossDefeated(this);
  }

  /* ---------------- the fight ---------------- */

  update(dt: number) {
    this.t += dt;
    if (!this.started) {
      if (!this.defeated && this.playerDist() < 12) this.begin();
      // Before the fight he floats beside the altar, admiring the Fleece.
      if (this.phase === 1 && !this.defeated) {
        this.pos.y = this.floorY + HOVER.y + Math.sin(this.t * 2) * 0.15;
        const c = this.center;
        this.yaw = dampAngle(this.yaw, Math.atan2(c.x - this.pos.x, c.z - this.pos.z), 3, dt);
      }
      this.sync(dt);
      return;
    }
    if (this.defeated || this.world.cutscene || this.state === 'change') {
      this.sync(dt);
      return;
    }
    dt *= this.tempo(dt);
    this.stateT -= dt;
    if (this.phase === 1) this.phase1(dt);
    else if (this.phase === 2) this.phase2(dt);
    else this.phase3(dt);
    this.sync(dt);
  }

  private get angry() {
    return this.hp <= this.floor + 10;
  }

  /** Gold coins rain down on red circles around the hero. */
  private coins(n: number) {
    const p = this.player.body;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = i === 0 ? 0 : 2 + Math.random() * 3;
      this.world.addEntity(new Strike(this.world, p.x + Math.cos(a) * r, this.floorY, p.z + Math.sin(a) * r, 1.2 + i * 0.12, 1.2, '#ffd166', 'rock'));
    }
    audio.play('bolt', 0.6);
  }

  /** A gold ring rolls out across the floor from him: jump it. */
  private wave(speed: number, maxR = 16) {
    this.world.addEntity(new Shockwave(this.world, this.pos.x, this.floorY, this.pos.z, maxR, speed, '#ffd166'));
  }

  private phase1(dt: number) {
    const p = this.player.body;
    const c = this.center;
    if (this.state === 'dizzy') {
      // Off his disc and sitting on the floor, seeing stars.
      this.pos.y = damp(this.pos.y, this.floorY, 6, dt);
      if (this.stateT <= 0) {
        this.raiseDrones();
        this.set('hover', 2);
        audio.play('roar', 1.1, 0.7);
        this.wave(8);
      }
      return;
    }
    this.pos.y = damp(this.pos.y, this.floorY + HOVER.y + Math.sin(this.t * 2) * 0.2, 3, dt);
    this.orbit += dt * 0.32;
    this.pos.x = damp(this.pos.x, c.x + Math.cos(this.orbit) * HOVER.r, 1.4, dt);
    this.pos.z = damp(this.pos.z, c.z + Math.sin(this.orbit) * HOVER.r, 1.4, dt);
    this.yaw = dampAngle(this.yaw, Math.atan2(p.x - this.pos.x, p.z - this.pos.z), 4, dt);
    if (this.stateT > 0) return;
    this.turn += 1;
    const pick = this.turn % 3;
    if (pick === 1) {
      this.wave(7.5);
      if (this.angry) this.wave(11);
      audio.play('charged', 0.8);
    } else if (pick === 2) this.coins(this.angry ? 5 : 3);
    else if (this.helpers.filter((e) => e.alive).length < 2) this.summon();
    else this.coins(4);
    this.set('hover', this.angry ? 2.6 : 3.2);
  }

  /** True if a cliff, the edge or a pillar is right in front of him. */
  private blocked(dx: number, dz: number): boolean {
    for (const ahead of [1.4, 2.2]) {
      const x = this.pos.x + dx * ahead;
      const z = this.pos.z + dz * ahead;
      const cell = this.world.grid.cell(Grid.toCell(x), Grid.toCell(z));
      if (cell.kind === 'wall' || cell.kind === 'void' || cell.h > this.floorY + 0.6) return true;
      if (this.pillars.some((q) => Math.hypot(q.x - x, q.z - z) < 1.5)) return true;
    }
    return false;
  }

  private stun(seconds: number, why: 'shield' | 'crash') {
    const w = this.world;
    this.set('stunned', seconds);
    audio.play('explode');
    haptic('heavy');
    w.shake(0.7);
    w.flash(this.pos.x, this.pos.y + 2, this.pos.z, '#ffd166', 60, 0.4);
    w.particles.emit(this.pos.x + this.dir.x * 1.5, this.pos.y + 1.5, this.pos.z + this.dir.y * 1.5, { count: 30, color: '#ffe08a', speed: 7, life: 0.6, size: 0.6 });
    if (why === 'shield') this.hint('shielded', () => this.world.hooks.toast('CLANG! He bounced right off General Brennus’s shield! His armour is cracked: hit him now!', 'bolt'));
    else this.hint('crashed', () => this.world.hooks.toast('He crashed into the pillar! His armour is cracked: hit him now!', 'bolt'));
  }

  private phase2(dt: number) {
    const p = this.player.body;
    const pos = this.pos;
    const toX = p.x - pos.x;
    const toZ = p.z - pos.z;
    const dist = Math.hypot(toX, toZ);
    let speed = 0;
    let dx = Math.sin(this.yaw);
    let dz = Math.cos(this.yaw);
    switch (this.state) {
      case 'walk':
        this.yaw = dampAngle(this.yaw, Math.atan2(toX, toZ), 3, dt);
        speed = dist > 5 ? 2.4 : 0.6;
        if (this.stateT <= 0) {
          this.turn += 1;
          if (this.turn % 3 === 0) {
            this.set('whip', 1.8);
            // Golden seed pods drop in a line toward the hero.
            for (let i = 0; i < 6; i++) this.world.addEntity(new Strike(this.world, pos.x + (toX / (dist || 1)) * (2 + i * 2), this.floorY, pos.z + (toZ / (dist || 1)) * (2 + i * 2), 0.8 + i * 0.12, 1.1, '#ffd166', 'rock'));
            audio.play('roar', 1.3, 0.6);
          } else {
            this.set('rev', this.angry ? 1.0 : 1.3);
            audio.play('roar', 0.8, 0.8);
            this.hint('rev', () => this.world.hooks.toast('He’s lowering his horns to charge! General Brennus: hold up your SHIELD toward him!', 'bolt'));
          }
        }
        break;
      case 'rev':
        this.yaw = dampAngle(this.yaw, Math.atan2(toX, toZ), 7, dt);
        if (Math.random() < 0.4) this.world.particles.emit(pos.x, pos.y + 0.2, pos.z, { count: 2, color: '#ffe08a', speed: 2, up: 1, life: 0.5, size: 0.6 });
        if (this.stateT <= 0) {
          this.set('charge', 2.6);
          this.dir.set(Math.sin(this.yaw), Math.cos(this.yaw));
          audio.play('dash', 0.5);
          haptic('medium');
        }
        break;
      case 'charge': {
        speed = CHARGE_SPEED;
        dx = this.dir.x;
        dz = this.dir.y;
        if (Math.random() < 0.7) this.world.particles.emit(pos.x - dx * 1.2, pos.y + 0.3, pos.z - dz * 1.2, { count: 2, color: '#ffe08a', speed: 2, up: 1, life: 0.5, size: 0.8 });
        const fx = pos.x + dx * 1.3;
        const fz = pos.z + dz * 1.3;
        if (Math.hypot(p.x - fx, p.z - fz) < 1.9 && p.y < pos.y + 2.6) {
          if (this.player.shieldBlocks(pos.x, pos.z)) {
            speed = 0;
            pos.x -= dx * 1.2;
            pos.z -= dz * 1.2;
            this.stun(this.angry ? 4.2 : 4.8, 'shield');
            break;
          }
          this.player.hurt(1, pos.x, pos.z);
        }
        if (this.blocked(dx, dz)) {
          speed = 0;
          this.stun(this.angry ? 3.6 : 4.2, 'crash');
        } else if (this.stateT <= 0) this.set('walk', 1.5);
        break;
      }
      case 'stunned':
        if (this.stateT <= 0) {
          this.set('walk', this.angry ? 2 : 2.6);
          this.wave(8, 12);
          audio.play('pound');
        }
        break;
      case 'whip':
        if (this.stateT <= 0) this.set('walk', 2);
        break;
    }
    if (speed > 0 && !this.blocked(dx, dz)) {
      pos.x += dx * speed * dt;
      pos.z += dz * speed * dt;
    }
    pos.y = this.floorY;
    if (this.state !== 'stunned' && this.state !== 'charge' && dist < 1.8 && p.y < pos.y + 2.6) this.player.hurt(1, pos.x, pos.z);
  }

  private phase3(dt: number) {
    const p = this.player.body;
    const pos = this.pos;
    const dist = Math.hypot(p.x - pos.x, p.z - pos.z);
    switch (this.state) {
      case 'rooted':
        this.slump = damp(this.slump, 0, 3, dt);
        this.yaw = dampAngle(this.yaw, Math.atan2(p.x - pos.x, p.z - pos.z), 1.2, dt);
        if (this.stateT <= 0) {
          this.turn += 1;
          if (this.turn % 3 === 0) this.coins(this.angry ? 5 : 4);
          else {
            // Both fists slam the floor: a shock ring (and, once he's angry, a second one).
            this.wave(8, 20);
            this.world.shake(0.5);
            audio.play('pound', 0.6);
            if (this.angry) {
              this.set('slam', 0.9);
              break;
            }
          }
          this.set('rooted', 3.2);
        }
        break;
      case 'slam':
        if (this.stateT <= 0) {
          this.wave(11, 20);
          audio.play('pound', 0.7);
          this.set('rooted', 3);
        }
        break;
      case 'bare':
        this.slump = damp(this.slump, 1, 3, dt);
        if (this.stateT <= 0) {
          this.rootDown();
          this.world.hooks.toast('Oh no, the vines grew back! Atalanta, cut them again!', 'iris');
        }
        break;
      case 'open':
        this.slump = damp(this.slump, 1, 3, dt);
        if (this.stateT <= 0) {
          // He heaves himself up again, the vines regrow, and a shock ring rolls out.
          this.rootDown();
          this.wave(9, 20);
          audio.play('roar', 0.7);
        }
        break;
    }
    if ((this.state === 'rooted' || this.state === 'slam') && dist < 2.4 && p.y < this.floorY + 4) this.player.hurt(1, pos.x, pos.z);
  }

  /* ---------------- looks (the cutscenes drive these too) ---------------- */

  /** 0..1: how far the Fleece has wrapped round him, how far he has grown, and how caught he is at the end. */
  private dressed = 0;
  private caughtK = 0;
  /** Where the Fleece floats while it changes hands (null: on the altar, or worn). */
  readonly fleeceAt = new THREE.Vector3();
  private cage: THREE.Group | null = null;

  /** 0..1: he flies to the altar and the Fleece wraps round him as gold armour (the look of phase 2). */
  wearFleece(k: number) {
    this.dressed = k;
    this.grow = 1 + 0.4 * k;
    if (k > 0 && k < 1 && this.phase <= 2) {
      const c = this.center;
      this.pos.x = damp(this.pos.x, c.x, 3, 1 / 60);
      this.pos.z = damp(this.pos.z, c.z + 1.6, 3, 1 / 60);
      this.pos.y = damp(this.pos.y, this.floorY + (k < 0.6 ? 0.6 : 0), 3, 1 / 60);
    }
  }

  /** 0..1: the Fleece's vines root him in the middle of the chamber and he grows huge (phase 3). */
  growHuge(k: number) {
    this.grow = 1.4 + (GIANT - 1.4) * k;
    const c = this.center;
    this.pos.set(this.pos.x + (c.x - this.pos.x) * Math.min(1, k * 2), this.floorY, this.pos.z + (c.z - this.pos.z) * Math.min(1, k * 2));
  }

  /** 0..1: the end. The armour falls away, he shrinks back, and gold vines wrap him up; the Fleece floats free. */
  caught(k: number) {
    this.caughtK = k;
    this.slump = damp(this.slump, 0, 4, 1 / 60);
    this.grow = Math.max(1, (this.phase === 3 ? GIANT : 1.4) * (1 - k) + k);
    if (!this.cage) {
      this.cage = new THREE.Group();
      const vine = mat('#e8b030', { emissive: '#ffb020', ei: 0.8, metal: 0.4, rough: 0.4 });
      for (let i = 0; i < 4; i++) {
        const r = mesh(torus(0.55, 0.06), vine, 0, 0.5 + i * 0.45, 0, false);
        r.rotation.set(Math.PI / 2 + (i % 2 ? 0.3 : -0.3), 0, i * 0.7);
        this.cage.add(r);
      }
      this.cage.add(mesh(sphere(0.12, 8), mat('#ff6fcf', { emissive: '#ff6fcf', ei: 1.5 }), 0.4, 2.2, 0.3, false));
      this.obj.add(this.cage);
    }
    this.cage.visible = k > 0.4;
    this.cage.scale.setScalar(Math.min(1, (k - 0.4) * 3));
    this.cage.position.copy(this.pos).setY(this.floorY);
    // The Fleece rises off him and floats gently down to the altar.
    const top = this.where.add(new THREE.Vector3(0, 3.5, 0));
    const altar = this.altarSpot;
    this.fleeceAt.lerpVectors(top, altar, Math.max(0, (k - 0.3) / 0.7));
    this.fleeceAt.y += Math.sin(k * Math.PI) * 1.5;
  }

  private sync(dt: number) {
    const m = this.m;
    const d = this.dressed;
    const free = this.caughtK > 0.3;
    m.root.position.copy(this.pos);
    m.root.position.y -= this.slump * 0.35 * this.grow;
    m.root.rotation.y = this.yaw;
    m.root.scale.setScalar(this.grow);
    m.body.rotation.x = this.slump * 1.05;
    const dizzy = this.state === 'dizzy' || this.state === 'stunned';
    m.disc.visible = d < 0.3 && this.phase === 1 && this.state !== 'dizzy' && !this.defeated;
    m.cloak.visible = d >= 0.5 && !free;
    m.armour.visible = m.core.visible = d >= 0.7 && !free;
    m.clasp.visible = d >= 0.7 && !free && this.state !== 'open';
    m.vines.visible = d >= 0.85 && !free;
    // The Fleece: on its altar, then worn, then (at the end) floating down to the altar again.
    const f = this.altar.fleece;
    f.visible = d < 0.5 || free;
    if (free) {
      f.position.set(this.fleeceAt.x - this.center.x, this.fleeceAt.y - this.floorY, this.fleeceAt.z - this.center.z);
      f.rotation.x = -Math.PI / 2 + Math.sin(this.t * 2) * 0.2;
    } else if (d > 0 && d < 0.5) {
      // Lifting off the altar toward him.
      const k = d / 0.5;
      f.position.set((this.pos.x - this.center.x) * k, 0.9 + k * 1.6, -0.5 + (this.pos.z - this.center.z + 0.5) * k);
    } else f.position.set(0, 0.9, -0.5);
    // Arms: gesturing while he floats, flung up while dizzy, low and heavy in the armour.
    const wave = Math.sin(this.t * 3);
    m.armL.rotation.set(dizzy ? -2.6 : this.phase === 1 ? -0.6 + wave * 0.3 : -0.3, 0, -0.2);
    m.armR.rotation.set(dizzy ? -2.6 : this.phase === 1 ? -1.2 - wave * 0.4 : this.state === 'rev' ? -1.4 : -0.3, 0, 0.2);
    m.head.rotation.z = dizzy ? Math.sin(this.t * 6) * 0.25 : 0;
    m.body.position.y = this.phase === 1 && !dizzy ? Math.sin(this.t * 2.4) * 0.05 : 0;
    // The ring-drones and the bubble they hold up.
    const anyDrone = this.phase === 1 && this.drones.some((x) => x.alive);
    this.drones.forEach((dr, i) => {
      const a = this.t * 2.2 + (i * Math.PI * 2) / 3;
      dr.group.visible = dr.alive && this.phase === 1;
      dr.group.position.set(this.pos.x + Math.cos(a) * DRONE_ORBIT, this.pos.y + 1.3 + Math.sin(this.t * 3 + i) * 0.25, this.pos.z + Math.sin(a) * DRONE_ORBIT);
      dr.group.rotation.y = a * 2;
      dr.aim.copy(dr.group.position);
      dr.aimable = dr.alive && this.started;
    });
    this.bubble.visible = anyDrone;
    this.bubble.position.set(this.pos.x, this.pos.y + 1.2, this.pos.z);
    this.bubble.scale.setScalar(1 + Math.sin(this.t * 4) * 0.03);
    // Dizzy stars over his head.
    this.stars.visible = dizzy && !this.defeated;
    this.stars.position.set(this.pos.x, this.pos.y + 2.7 * this.grow, this.pos.z);
    this.stars.rotation.y += dt * 4;
    // Phase 3: the vines from his back to the knots in the floor.
    m.root.updateMatrixWorld(true);
    const back = new THREE.Vector3(0, 2.1, -0.4).applyMatrix4(m.body.matrixWorld);
    this.knots.forEach((k, i) => {
      const vine = this.tethers[i];
      k.group.visible = k.alive;
      vine.visible = k.alive && this.phase === 3 && !this.defeated;
      if (!vine.visible) return;
      const end = k.aim;
      vine.position.copy(back);
      vine.lookAt(end);
      vine.scale.set(1, 1, back.distanceTo(end));
      k.mat.emissiveIntensity = 1.2 + Math.sin(this.t * 5 + i) * 0.5;
    });
    // Where he can be hit: the seed-core in his chest once he wears the Fleece, his chest before that.
    if (d >= 0.7) m.core.getWorldPosition(this.aim);
    else this.aim.set(this.pos.x, this.pos.y + 1.6, this.pos.z);
    this.radius = this.phase === 3 ? 1.5 : 1.2;
    this.aimable = !this.defeated && (this.state === 'dizzy' || this.state === 'stunned' || this.state === 'bare' || this.state === 'open');
    // Glows settle back after a hit; the core pulses while it's open, the clasp while it's in reach.
    m.armourMat.emissiveIntensity = damp(m.armourMat.emissiveIntensity, dizzy ? 1 + Math.sin(this.t * 10) * 0.5 : 0.4, 6, dt);
    m.coreMat.emissiveIntensity = damp(m.coreMat.emissiveIntensity, this.state === 'open' ? 2.5 + Math.sin(this.t * 9) : 1.4, 6, dt);
    m.claspMat.emissiveIntensity = this.state === 'bare' ? 1.4 + Math.sin(this.t * 8) * 0.8 : 0.8;
  }
}
