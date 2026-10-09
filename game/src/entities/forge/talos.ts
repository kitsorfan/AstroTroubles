import * as THREE from 'three';

import { audio } from '../../core/audio';
import { haptic } from '../../core/bridge';
import { CELL } from '../../core/constants';
import { damp, dampAngle } from '../../core/math';
import type { World } from '../../game/world';
import { makeBody, moveBody, type Body } from '../../world/physics';
import { Boss } from '../bossBase';
import type { Enemy } from '../enemies';
import type { HitKind, Interactable, Target } from '../entity';
import { Shockwave } from '../hazards';
import { TALOS_TUNING } from './tuning';
import { TALOS_COLORS, TALOS_HIP, makeTalos, type TalosLeg, type TalosModel } from './talosModel';

type State = 'walk' | 'raise' | 'stomp' | 'stuck' | 'free' | 'hammer' | 'slam' | 'rivets' | 'kneel' | 'rise' | 'sit';


const tmp = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

/**
 * TALOS, the Gardeners' bronze guardian giant (the boss of Talos's Forge), reprogrammed by Aeëtes's
 * gold crown to stomp anyone who lands. HP 15: three rounds of three ankle plates and a pull of the plug.
 *
 * - He walks his rounds of the arena, now and then turning on the mech.
 * - STOMP: he lifts his right foot over the mech (a red circle shows where), stamps down (a shockwave
 *   rolls out: jump it), and the foot sticks in the floor for a few seconds, the ankle armour glowing.
 *   PUNCH the plates off (a big cannon blast also knocks one off; shells just ping).
 * - HAMMER: he raises his forge hammer (a red strip shows where it lands) and brings it down.
 * - With all three plates off he drops to one knee, his heel turned up: walk round and PULL the plug.
 *   It comes out a third of the way, golden light leaks out, and he gets up for another round (in round
 *   two Aeëtes sends anvil drones, in round three he also throws hot rivets).
 * - After the third pull the ichor drains away and he sits down gently, free; his eye turns from
 *   Aeëtes's red back to the Gardeners' teal, and the crown falls off. Nobody blows up.
 */
export class Talos extends Boss implements Target, Interactable {
  readonly title = 'TALOS';
  protected focusHeight = 8;
  readonly aim = new THREE.Vector3();
  radius = 1.2;
  aimable = false;
  readonly spot = new THREE.Vector3();
  range = 3.6;
  reachY = 4;
  private body: Body;
  private model: TalosModel;
  private state: State = 'walk';
  private stateT = 2.5;
  private round = 0;
  private plates = TALOS_TUNING.plates;
  private yaw = Math.PI;
  private orbitA = 0;
  private phase = 0;
  private count = 0;
  private home: THREE.Vector3;
  private target = new THREE.Vector3();
  private disc: THREE.Mesh;
  private strip: THREE.Mesh;
  private hinted = new Set<string>();
  /** How far the plug has come out (0..1). */
  private plugOut = 0;
  private droneWave = 0;
  /** The anvil drones Aeëtes sent in during the fight. */
  private drones: Enemy[] = [];

  constructor(world: World, id: string, cx: number, cz: number, h: number) {
    super(world, id, cx, cz, h, TALOS_TUNING.rounds * (TALOS_TUNING.plates + TALOS_TUNING.plugDamage));
    this.home = this.center.clone();
    this.body = makeBody(this.center.x, h, this.center.z - 4, 2, 9);
    this.model = makeTalos();
    this.obj.add(this.model.root);
    const red = (geo: THREE.BufferGeometry) =>
      new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#ff3a3a', transparent: true, opacity: 0.38, depthWrite: false }));
    this.disc = red(new THREE.CircleGeometry(TALOS_TUNING.stompRadius, 36).rotateX(-Math.PI / 2));
    this.strip = red(new THREE.PlaneGeometry(TALOS_TUNING.hammerHalf * 2, TALOS_TUNING.hammerLength).rotateX(-Math.PI / 2).translate(0, 0, TALOS_TUNING.hammerLength / 2));
    this.disc.visible = false;
    this.strip.visible = false;
    this.obj.add(this.disc, this.strip);
    world.addTarget(this);
    world.addInteractable(this);
    this.sync(0, 0);
  }

  get where(): THREE.Vector3 {
    return new THREE.Vector3(this.body.x, this.body.y, this.body.z);
  }

  /** Where the plug in his heel is (for cutscenes). */
  plugSpot(): THREE.Vector3 {
    this.model.root.updateMatrixWorld(true);
    return this.model.plug.getWorldPosition(new THREE.Vector3());
  }

  /** The model, for the cutscene when he sits down. */
  get parts(): TalosModel {
    return this.model;
  }

  private hint(key: string, show: () => void) {
    if (this.hinted.has(key)) return;
    this.hinted.add(key);
    show();
  }

  /* ---------------- the plug ---------------- */

  private get kneeling() {
    return this.state === 'kneel';
  }

  label() {
    return this.kneeling && !this.defeated ? 'PULL' : null;
  }

  interact() {
    if (!this.kneeling || this.defeated) return;
    const w = this.world;
    const p = this.plugSpot();
    this.round += 1;
    this.plugOut = this.round / TALOS_TUNING.rounds;
    this.hp = Math.max(0, this.hp - TALOS_TUNING.plugDamage);
    w.hooks.bossBar(this.title, this.hp / this.maxHp);
    // Golden light spills out of his heel.
    w.particles.emit(p.x, p.y, p.z, { count: 40, color: TALOS_COLORS.ichor, speed: 5, life: 1.1, size: 0.7, up: 3, gravity: 3 });
    w.flash(p.x, p.y + 1, p.z, TALOS_COLORS.ichor, 60, 0.6);
    w.rings.burst(p.x, this.body.y + 0.05, p.z, 6, TALOS_COLORS.ichor, 0.6);
    audio.play('upgrade', 0.6);
    audio.play('pound', 0.6);
    haptic('heavy');
    w.shake(0.5);
    if (this.hp <= 0) {
      this.finish();
      return;
    }
    if (this.round === 1) w.hooks.toast('The plug moved! It’s stuck tight, though. Knock his armour off again and pull some more!', 'bolt');
    else w.hooks.toast('Almost out! One more pull!', 'bolt');
    this.setState('rise', 1.6);
  }

  /** Free: no explosion. He sits down (the cutscene shows it), his eye turns teal and the crown falls off. */
  protected finish() {
    this.defeated = true;
    this.state = 'sit';
    this.aimable = false;
    this.disc.visible = false;
    this.strip.visible = false;
    const w = this.world;
    w.shots.clear();
    for (const e of this.drones) if (e.alive) e.die();
    this.drones.length = 0;
    const c = this.where;
    w.dropBolts(new THREE.Vector3(c.x, c.y + 2, c.z), 40);
    w.bossDefeated(this);
  }

  /** The cutscene (or a skip) calls this: Aeëtes's crown pops off and his eye goes back to the Gardeners' teal. */
  calm() {
    const m = this.model;
    m.eye.emissive.set(TALOS_COLORS.calm);
    m.eyeGlow.material.color.set(TALOS_COLORS.calm);
    m.crown.visible = false;
    m.vein.emissiveIntensity = 0.15;
    m.plugGlow.material.opacity = 0;
  }

  /* ---------------- getting hit ---------------- */

  hit(dmg: number, kind: HitKind, from: THREE.Vector3): boolean {
    if (!this.started || this.defeated) return true;
    void dmg;
    if (this.state !== 'stuck' || this.plates <= 0) {
      audio.play('zap', 1.2, 0.6);
      return true;
    }
    if (kind !== 'smash' && kind !== 'blast') {
      // Shells and shots just ping off the thick bronze.
      audio.play('zap', 1.6, 0.6);
      this.hint('ping', () => this.world.hooks.toast('Too thick for little shells! Get close and PUNCH his ankle (the SPIN button).', 'bolt'));
      return true;
    }
    this.plates -= 1;
    this.hp = Math.max(0, this.hp - 1);
    this.world.hooks.bossBar(this.title, this.hp / this.maxHp);
    const plate = this.model.plates[this.plates];
    plate.visible = false;
    this.world.particles.emit(this.aim.x, this.aim.y, this.aim.z, { count: 26, color: TALOS_COLORS.bronzeLight, speed: 8, life: 0.8, size: 0.7, up: 2, gravity: 8 });
    this.world.particles.emit(from.x, from.y, from.z, { count: 10, color: '#ffffff', speed: 5, life: 0.3, size: 0.4 });
    audio.play('explode', 1.4, 0.5);
    this.world.shake(0.4);
    if (this.plates <= 0) this.kneel();
    return true;
  }

  /** All three plates off: he drops to one knee with his heel turned up. */
  private kneel() {
    this.setState('kneel', TALOS_TUNING.kneel);
    this.disc.visible = false;
    audio.play('pound', 0.5);
    this.world.shake(0.8);
    haptic('heavy');
    this.hint('kneel', () => this.world.hooks.toast('He’s down on one knee! Walk round behind him and PULL the plug in his heel!', 'bolt'));
  }

  reset() {
    this.hp = this.maxHp;
    this.round = 0;
    this.plates = TALOS_TUNING.plates;
    for (const p of this.model.plates) p.visible = true;
    this.plugOut = 0;
    this.body.x = this.home.x;
    this.body.z = this.home.z - 4;
    this.droneWave = 0;
    this.drones.length = 0;
    this.disc.visible = false;
    this.strip.visible = false;
    this.setState('walk', 3);
  }

  private setState(s: State, t: number) {
    this.state = s;
    this.stateT = t;
  }

  /* ---------------- the fight ---------------- */

  protected onStart() {
    this.orbitA = Math.atan2(this.body.z - this.home.z, this.body.x - this.home.x);
    this.setState('walk', 2.5);
  }

  /** Where his right foot comes down when he stomps from where he stands now. */
  private landing(out: THREE.Vector3) {
    const b = this.body;
    const s = Math.sin(this.yaw);
    const c = Math.cos(this.yaw);
    return out.set(b.x + 1.35 * c + 1.1 * s, b.y, b.z - 1.35 * s + 1.1 * c);
  }

  update(dt: number) {
    this.t += dt;
    const b = this.body;
    if (!this.started) {
      if (this.playerDist() < 15) this.begin();
      this.sync(dt, 0);
      return;
    }
    if (this.defeated) {
      this.sync(dt, 0);
      return;
    }
    const p = this.player.body;
    const r = Math.min(this.round, TALOS_TUNING.rounds - 1);
    const toX = p.x - b.x;
    const toZ = p.z - b.z;
    this.stateT -= dt;
    let speed = 0;
    switch (this.state) {
      case 'walk': {
        // His rounds: a slow circle around the middle of the arena.
        this.orbitA += (dt * TALOS_TUNING.walkSpeed[r]) / TALOS_TUNING.orbit;
        const tx = this.home.x + Math.cos(this.orbitA) * TALOS_TUNING.orbit - b.x;
        const tz = this.home.z + Math.sin(this.orbitA) * TALOS_TUNING.orbit - b.z;
        this.yaw = dampAngle(this.yaw, Math.atan2(tx, tz), 2, dt);
        speed = Math.min(TALOS_TUNING.walkSpeed[r], Math.hypot(tx, tz) * 2);
        if (this.round >= 1 && this.droneWave < this.round) this.callDrones();
        if (this.stateT <= 0) this.chooseAttack();
        break;
      }
      case 'raise': {
        // Turns on the mech and steps so the lifted right foot hangs over the red circle.
        this.yaw = dampAngle(this.yaw, Math.atan2(toX, toZ), 4, dt);
        const land = this.landing(tmp);
        const dx = this.target.x - land.x;
        const dz = this.target.z - land.z;
        const d = Math.hypot(dx, dz);
        if (d > 0.2) {
          b.x += (dx / d) * Math.min(d, 5 * dt);
          b.z += (dz / d) * Math.min(d, 5 * dt);
        }
        if (this.stateT <= 0) this.stomp();
        break;
      }
      case 'stomp':
        if (this.stateT <= 0) this.setState('stuck', TALOS_TUNING.stuck[r]);
        break;
      case 'stuck':
        // He tugs at his foot, the ankle glowing: punch now!
        if (Math.random() < dt * 6) this.world.particles.emit(this.aim.x, this.body.y + 0.2, this.aim.z, { count: 2, color: '#c8b8a0', speed: 2, life: 0.5, size: 0.7, up: 1 });
        if (this.stateT <= 0) {
          this.setState('free', 0.9);
          audio.play('roar', 0.45, 0.6);
        }
        break;
      case 'free':
        if (this.stateT <= 0) this.setState('walk', 2.4 - r * 0.4);
        break;
      case 'hammer':
        this.yaw = dampAngle(this.yaw, Math.atan2(toX, toZ), this.stateT > 0.5 ? 3 : 0.5, dt);
        this.strip.position.set(b.x, b.y + 0.07, b.z);
        this.strip.rotation.y = this.yaw;
        (this.strip.material as THREE.MeshBasicMaterial).opacity = 0.3 + 0.18 * Math.sin(this.t * 14);
        if (this.stateT <= 0) this.slam();
        break;
      case 'slam':
        if (this.stateT <= 0) {
          if (this.round >= 2) this.setState('rivets', 1.2);
          else this.setState('walk', 3 - r * 0.4);
        }
        break;
      case 'rivets':
        this.yaw = dampAngle(this.yaw, Math.atan2(toX, toZ), 3, dt);
        if (this.stateT <= 0.6 && this.stateT + dt > 0.6) this.throwRivets();
        if (this.stateT <= 0) this.setState('walk', 2.4);
        break;
      case 'kneel':
        if (Math.random() < dt * 5) {
          const q = this.plugSpot();
          this.world.particles.emit(q.x, q.y, q.z, { count: 1, color: TALOS_COLORS.ichor, speed: 1, life: 0.6, size: 0.5, up: 1.5 });
        }
        if (this.stateT <= 0) {
          // Too slow: he gets back up, and his armour plates are back on.
          this.hint('late', () => this.world.hooks.toast('He’s back up, and the armour is back on! Next time, pull the plug while he kneels.', 'bolt'));
          this.setState('rise', 1.4);
        }
        break;
      case 'rise':
        if (this.stateT <= 0) {
          this.plates = TALOS_TUNING.plates;
          for (const m of this.model.plates) m.visible = true;
          audio.play('roar', 0.4);
          this.setState('walk', 2.2);
        }
        break;
      case 'sit':
        break;
    }
    b.vx = Math.sin(this.yaw) * speed;
    b.vz = Math.cos(this.yaw) * speed;
    moveBody(b, dt, this.world.grid, [], { stepUp: 0.6 });
    this.sync(dt, speed);
    this.pushOut();
  }

  private chooseAttack() {
    this.count += 1;
    const p = this.player.body;
    if (this.count % 3 === 0) {
      this.setState('hammer', TALOS_TUNING.raise[Math.min(this.round, 2)] + 0.2);
      this.strip.visible = true;
      audio.play('charge', 0.4);
      return;
    }
    // Stomp: the circle sits where the mech stands right now.
    this.target.set(p.x, this.body.y, p.z);
    this.disc.position.set(p.x, this.body.y + 0.06, p.z);
    this.disc.visible = true;
    this.setState('raise', TALOS_TUNING.raise[Math.min(this.round, 2)]);
    audio.play('roar', 0.35, 0.7);
    this.hint('stomp', () => this.world.hooks.toast('Talos is lifting his foot! Get out of the red circle, then PUNCH his ankle while his foot is stuck!', 'bolt'));
  }

  private stomp() {
    const w = this.world;
    const land = this.landing(tmp).clone();
    this.disc.visible = false;
    this.setState('stomp', 0.35);
    w.addEntity(new Shockwave(w, land.x, this.body.y, land.z, 13, 8, '#ffb050'));
    w.shake(1);
    w.hitStop(0.08);
    w.flash(land.x, land.y + 1, land.z, '#ffb050', 60, 0.4);
    w.particles.emit(land.x, land.y + 0.3, land.z, { count: 40, color: '#b8a890', speed: 9, life: 0.8, size: 0.9, up: 1, gravity: 2 });
    w.rings.burst(land.x, land.y + 0.05, land.z, TALOS_TUNING.stompRadius * 2.4, '#ffb050', 0.5);
    audio.play('pound', 0.5);
    audio.play('explode', 0.6, 0.7);
    haptic('heavy');
    const p = this.player.body;
    if (Math.hypot(p.x - land.x, p.z - land.z) < TALOS_TUNING.stompRadius && p.y < land.y + 2) this.player.hurt(1, land.x, land.z);
  }

  private slam() {
    const w = this.world;
    const b = this.body;
    this.strip.visible = false;
    this.setState('slam', 1.1);
    const s = Math.sin(this.yaw);
    const c = Math.cos(this.yaw);
    const hx = b.x + s * 6.5;
    const hz = b.z + c * 6.5;
    w.addEntity(new Shockwave(w, hx, b.y, hz, 10, 8, '#ffb050'));
    w.shake(1);
    w.hitStop(0.08);
    w.flash(hx, b.y + 1, hz, '#ffb050', 60, 0.4);
    w.particles.emit(hx, b.y + 0.3, hz, { count: 40, color: '#ffd8a0', speed: 9, life: 0.7, size: 0.8, up: 2, gravity: 4 });
    audio.play('pound', 0.45);
    audio.play('explode', 0.7, 0.6);
    // Anyone in the strip in front of him gets bonked.
    const p = this.player.body;
    const along = (p.x - b.x) * s + (p.z - b.z) * c;
    const across = Math.abs((p.x - b.x) * c - (p.z - b.z) * s);
    if (along > 0 && along < TALOS_TUNING.hammerLength && across < TALOS_TUNING.hammerHalf + p.r && p.y < b.y + 2) this.player.hurt(1, hx, hz);
  }

  /** Round three: three hot rivets lobbed at the mech. */
  private throwRivets() {
    const w = this.world;
    const p = this.player.body;
    const from = this.model.armL.getWorldPosition(new THREE.Vector3());
    for (const k of [-0.3, 0, 0.3]) {
      const dir = new THREE.Vector3(p.x - from.x, 0, p.z - from.z);
      const d = dir.length() || 1;
      dir.normalize().applyAxisAngle(UP, k);
      dir.y = 0.35;
      dir.normalize();
      w.shots.fire('enemy', from, dir, Math.min(16, 6 + d * 0.45), 1, 9);
    }
    audio.play('enemyShoot', 0.5);
  }

  /** Aeëtes sends two anvil drones at the start of rounds two and three. */
  private callDrones() {
    this.droneWave = this.round;
    const w = this.world;
    const cx = Math.floor(this.home.x / CELL);
    const cz = Math.floor(this.home.z / CELL);
    for (const dx of [-9, 9]) this.drones.push(w.spawnEnemy('anvil', cx + dx, cz + (this.round === 1 ? -5 : 5)));
    w.hooks.toast('Aeëtes is sending anvil drones! Blast them with the CANNON.', 'bolt');
  }

  /** His feet are solid: the mech is pushed out of them instead of walking through. */
  private pushOut() {
    if (this.state === 'sit') return;
    const pb = this.player.body;
    for (const leg of [this.model.legL, this.model.legR]) {
      if (leg === this.model.legR && this.state === 'raise') continue;
      const f = leg.ankle.getWorldPosition(tmp);
      if (pb.y > f.y + 1.2) continue;
      const dx = pb.x - f.x;
      const dz = pb.z - f.z;
      const d = Math.hypot(dx, dz);
      const min = 1.15 + pb.r;
      if (d < min && d > 1e-4) {
        pb.x = f.x + (dx / d) * min;
        pb.z = f.z + (dz / d) * min;
      }
    }
  }

  /* ---------------- posing ---------------- */

  private poseLeg(leg: TalosLeg, hip: number, knee: number, dt: number, k = 10) {
    leg.hip.rotation.x = damp(leg.hip.rotation.x, hip, k, dt);
    leg.knee.rotation.x = damp(leg.knee.rotation.x, knee, k, dt);
    // The foot stays flat on the ground while he walks and stomps.
    leg.ankle.rotation.x = damp(leg.ankle.rotation.x, -(hip + knee), k, dt);
  }

  private sync(dt: number, speed: number) {
    const m = this.model;
    const b = this.body;
    const st = this.state;
    m.root.position.set(b.x, b.y, b.z);
    m.root.rotation.y = this.yaw;
    this.phase += dt * speed * 0.9;
    const s = Math.sin(this.phase);
    const walk = Math.min(1, speed / 2);
    let hipY = TALOS_HIP - Math.abs(Math.cos(this.phase)) * 0.15 * walk;
    let lean = 0;
    // Legs.
    if (st === 'kneel' || st === 'sit' || (st === 'rise' && this.stateT > 0.7)) {
      if (st === 'sit') {
        // Sitting on the ground, legs out in front, leaning back a little.
        hipY = damp(m.hips.position.y, 1.3, 1.2, dt);
        this.poseLeg(m.legL, -1.45, 0.55, dt, 1.5);
        this.poseLeg(m.legR, -1.4, 0.45, dt, 1.5);
        m.legL.ankle.rotation.x = damp(m.legL.ankle.rotation.x, 0.5, 1.5, dt);
        m.legR.ankle.rotation.x = damp(m.legR.ankle.rotation.x, 0.6, 1.5, dt);
        lean = -0.12;
      } else {
        // Down on his left knee, the right shin lying back with the heel (and the plug) turned up.
        hipY = damp(m.hips.position.y, 2.75, 5, dt);
        this.poseLeg(m.legL, -1.45, 1.45, dt, 5);
        m.legR.hip.rotation.x = damp(m.legR.hip.rotation.x, 0.05, 5, dt);
        m.legR.knee.rotation.x = damp(m.legR.knee.rotation.x, 1.52, 5, dt);
        m.legR.ankle.rotation.x = damp(m.legR.ankle.rotation.x, 0, 5, dt);
        lean = 0.3;
      }
    } else if (st === 'raise') {
      this.poseLeg(m.legL, 0.1, 0.1, dt);
      this.poseLeg(m.legR, -1.0, 1.1, dt, 6);
      lean = -0.08;
    } else if (st === 'stomp' || st === 'stuck') {
      this.poseLeg(m.legL, 0.15, 0.2, dt, 20);
      this.poseLeg(m.legR, -0.45, 0.45, dt, 20);
      hipY -= 0.25;
      lean = 0.15;
      if (st === 'stuck') m.hips.rotation.z = Math.sin(this.t * 9) * 0.03;
    } else {
      this.poseLeg(m.legL, s * 0.35 * walk, Math.max(0, -s) * 0.5 * walk, dt);
      this.poseLeg(m.legR, -s * 0.35 * walk, Math.max(0, s) * 0.5 * walk, dt);
      m.hips.rotation.z = damp(m.hips.rotation.z, s * 0.04 * walk, 6, dt);
    }
    if (st !== 'stuck') m.hips.rotation.z = damp(m.hips.rotation.z, 0, 6, dt);
    m.hips.position.y = hipY;
    m.torso.rotation.x = damp(m.torso.rotation.x, lean, 4, dt);
    // Arms: swinging, the hammer raised high, slammed down, a lean on the hammer while kneeling.
    let armR = -s * 0.25 * walk;
    let elbowR = -0.3;
    let armL = s * 0.25 * walk;
    if (st === 'hammer') {
      armR = -2.9;
      elbowR = -0.4;
    } else if (st === 'slam') {
      armR = -1.2;
      elbowR = -0.25;
    } else if (st === 'rivets') {
      armL = this.stateT > 0.6 ? -2.6 : -1.2;
    } else if (st === 'kneel') {
      armR = -0.6;
      elbowR = -0.5;
    } else if (st === 'sit') {
      // The hammer laid down in front of him.
      armR = 0.15;
      elbowR = 0;
      armL = -0.2;
    }
    m.armR.rotation.x = damp(m.armR.rotation.x, armR, st === 'slam' ? 18 : 5, dt);
    m.elbowR.rotation.x = damp(m.elbowR.rotation.x, elbowR, 5, dt);
    m.armL.rotation.x = damp(m.armL.rotation.x, armL, 5, dt);
    // Glows: the stuck ankle, the plug while he kneels, his eye, and the ichor vein (fading as it drains).
    const stuck = st === 'stuck' && this.plates > 0;
    m.ankleGlow.material.opacity = damp(m.ankleGlow.material.opacity, stuck ? 0.7 + Math.sin(this.t * 10) * 0.2 : 0, 8, dt);
    if (!this.defeated) {
      m.plugGlow.material.opacity = damp(m.plugGlow.material.opacity, st === 'kneel' ? 0.85 + Math.sin(this.t * 8) * 0.15 : 0, 6, dt);
      m.vein.emissiveIntensity = 1.6 * (1 - this.plugOut * 0.6) + (st === 'kneel' ? Math.sin(this.t * 6) * 0.3 : 0);
      m.eye.emissiveIntensity = 2 + Math.sin(this.t * 3) * 0.3;
    }
    m.plug.position.z = damp(m.plug.position.z, -0.75 - this.plugOut * 0.5, 4, dt);
    m.root.updateMatrixWorld(true);
    // The weak spot: the stuck ankle, or the plug in the heel.
    if (st === 'kneel') m.plug.getWorldPosition(this.aim);
    else m.legR.ankle.getWorldPosition(this.aim);
    this.aimable = stuck;
    this.spot.copy(st === 'kneel' ? this.aim : this.where);
    this.spot.y = b.y;
    m.shadow.position.y = 0.03;
  }
}
