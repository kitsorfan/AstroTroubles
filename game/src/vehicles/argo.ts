import * as THREE from 'three';

import type { Director, Rig } from '../cinema/director';
import { audio } from '../core/audio';
import { haptic } from '../core/bridge';
import type { Input } from '../core/input';
import { tr } from '../core/i18n';
import { damp } from '../core/math';
import type { World } from '../game/world';
import type { Line } from '../world/levelTypes';
import { makeArgo, makeDove, makeRocket, type ArgoModel, type DoveModel } from './argoModel';
import { flightIntro, flightOutro, doveScene } from './argoScenes';
import { CLASH, FLIGHT, clashState, holdGroup, laneAt, untilOpen, type Beacon, type Clash, type Hold } from './course';
import { CourseView, lowerBound } from './courseView';
import { Drones, type Drone } from './drones';
import { Flight, type FlightEvents } from './flight';
import { recordFlight } from './quests';
import { Belt, makeGasGiant, makeStarSky, type GasGiant } from './space';
import type { Vehicle, VehicleHud } from './vehicle';

/**
 * The Argo in flight (chapter 3, level 1): it flies forward on its own while the player steers it
 * around the corridor, blasts Aeëtes's salvage drones and pink crystals, flies through gold rings,
 * boosts (a burst of speed in a shield of light), and launches through the Clashing Rocks. LUX's dove
 * shows the timing at the first pair only; after that Jason reads the rocks himself, and has three
 * rockets to blow up the pairs he'd rather not risk. The rules of flight live in flight.ts; this
 * draws it and adds the shooting.
 */

interface Laser {
  alive: boolean;
  rel: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mesh: THREE.Object3D;
}

const LASER_SPEED = 120;

/** A rocket on its way to a pair of Clashing Rocks (the flight times it; this draws it). */
interface RocketView {
  c: Clash;
  mesh: THREE.Object3D;
  /** Where it left the Argo (corridor x, y). */
  x0: number;
  y0: number;
}
/** Marks an English HUD text for translation (the HUD translates it when it shows it). */
const label = (en: string) => en;
const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();

export class ArgoFlight implements Vehicle {
  readonly kind = 'argo' as const;
  readonly flight: Flight;
  readonly model: ArgoModel;
  readonly dove: DoveModel;
  readonly drones: Drones;
  readonly pos = new THREE.Vector3();
  private view: CourseView;
  private belt: Belt;
  private giant: GasGiant;
  private lasers: Laser[] = [];
  private fireCd = 0;
  private time = 0;
  private steerVX = 0;
  private steerVY = 0;
  private camPos = new THREE.Vector3();
  private camLook = new THREE.Vector3();
  private camReady = false;
  /** Drones shot down this flight, and the count at the last checkpoint. */
  dronesShot = 0;
  private savedDrones = 0;
  private radioQueue: Line[] = [];
  private radioT = 0;
  /** Dialogue keys already played (hold-line talks and radio chatter). */
  private said = new Set<string>();
  /** Drone waves already sent (indices into the course). */
  private sent = new Set<number>();
  /** The dove's run through the rocks: where it started, when, and where it stops. */
  doveRun: { from: number; t0: number; until: number } | null = null;
  /** While false (during the dove's cutscene) the dove only flies when told to. */
  autoDove = true;
  /** Moves the drawn Argo away from its flight position (the ending cutscene sails it through the gate). */
  readonly offset = new THREE.Vector3();
  private lastOpen = 0;
  /** Distance of the last checkpoint reached (where a lost section restarts). */
  private cpS = 0;
  private wrecked = false;
  private emptyHintAt = -99;
  private warned = new Set<Clash>();
  /** Distance of the gate of the moons (the end), and the checkpoint marks for the progress bar. */
  readonly length: number;
  private beacons: Beacon[];
  private ringTotal: number;
  private rocketViews: RocketView[] = [];
  private rocketHintAt = -99;
  /** The hold line where LUX's dove shows the timing (the first one); after it, Jason is on his own. */
  private doveHold: Hold | null;

  constructor(readonly world: World) {
    const course = world.def.flight;
    if (!course) throw new Error(`${world.def.id} has no flight course`);
    this.flight = new Flight(course);
    const things = this.flight.things;
    this.length = things.find((t) => t.kind === 'gate')?.s ?? things[things.length - 1].s;
    this.beacons = things.filter((t): t is Beacon => t.kind === 'checkpoint');
    this.ringTotal = things.filter((t) => t.kind === 'ring').length;
    this.doveHold = things.find((t): t is Hold => t.kind === 'hold' && t.dialogue === 'dove') ?? null;
    const scene = world.scene;
    // Space is big: let the camera see the gas giant far away.
    world.camera.far = 1600;
    world.camera.updateProjectionMatrix();
    scene.add(makeStarSky(1100));
    this.giant = makeGasGiant();
    scene.add(this.giant.group);
    this.belt = new Belt(course.belt);
    scene.add(this.belt.group);
    this.view = new CourseView(things);
    scene.add(this.view.group);
    this.model = makeArgo();
    // A little smaller than life, so the corridor ahead stays in view over the sail.
    this.model.root.scale.setScalar(0.72);
    scene.add(this.model.root);
    this.dove = makeDove();
    this.dove.root.visible = false;
    scene.add(this.dove.root);
    this.drones = new Drones(scene);
    const beamG = new THREE.CylinderGeometry(0.08, 0.08, 2.4, 6).rotateX(Math.PI / 2);
    const beamM = new THREE.MeshBasicMaterial({ color: '#bff8ff' });
    for (let i = 0; i < 32; i++) {
      const mesh = new THREE.Mesh(beamG, beamM);
      mesh.visible = false;
      scene.add(mesh);
      this.lasers.push({ alive: false, rel: 0, x: 0, y: 0, vx: 0, vy: 0, mesh });
    }
    // Back at the furthest checkpoint reached, when resuming a saved flight.
    for (const b of this.beacons) if (world.flags.has(`argo:${b.id}`)) this.cpS = Math.max(this.cpS, b.s);
    if (this.cpS > 0) this.flight.restart(this.cpS);
    this.visuals(0, 0);
  }

  get hull() {
    return this.flight.hull;
  }

  get hullMax() {
    return FLIGHT.hull as number;
  }

  /** How many rings this flight has gone through. */
  get rings(): number {
    let n = 0;
    for (const i of this.flight.gone) if (this.flight.things[i].kind === 'ring') n += 1;
    return n;
  }

  /* ---------------- per frame ---------------- */

  update(dt: number, input: Input, cutscene: boolean) {
    const f = this.flight;
    this.time += dt;
    if (cutscene || f.finished) {
      // Cutscenes keep the rocks' rhythm and the dove going, but the Argo just hovers.
      f.t += dt;
      this.drones.update(dt, f, true, () => undefined);
      this.updateDove(dt);
      this.visuals(dt, 0);
      return;
    }
    const s0 = f.s;
    const boost = input.take('dash') || input.take('jump');
    const rocket = input.take('spin');
    f.step(dt, { steerX: input.moveX, steerY: -input.moveZ, boost, rocket }, this.events);
    this.fireCd -= dt;
    if (input.take('shoot') || (input.isHeld('shoot') && this.fireCd <= 0)) this.fire();
    this.sendWaves();
    const calm = f.holding || f.launchUntil > f.s;
    const hit = this.drones.update(dt, f, calm, (from) => {
      if (from.z > -70) audio.play('enemyShoot', 0.8, 0.5);
    });
    if (hit) {
      if (f.boosting) this.sparks(f.x, f.y, -1, '#ffd166', 10);
      else f.hurt(this.events);
    }
    this.updateLasers(dt);
    this.updateRockets();
    this.updateDove(dt);
    this.updateRadio(dt);
    this.visuals(dt, f.s - s0);
    if (f.hull <= 0 && !this.wrecked) {
      this.wrecked = true;
      this.world.playerDown();
    }
  }

  /** Flight events: sounds, effects, the HUD and the save. */
  private events: FlightEvents = {
    bump: (th, shielded) => {
      const r = th.kind === 'rock' ? th.r : 1.2;
      const z = -(th.s - this.flight.s);
      this.world.particles.emit(th.x, th.y, z, { count: 16 + Math.round(r * 6), color: th.kind === 'crystal' ? '#ff8ae0' : '#a89cb8', speed: 6, life: 0.9, size: 1.2, gravity: 0, vel: [0, 0, this.flight.v] });
      audio.play(shielded ? 'bounce' : 'break', shielded ? 1.2 : 0.8);
      this.world.shake(shielded ? 0.25 : 0.5);
    },
    crush: (c) => {
      this.world.shake(1.4);
      this.world.flash(0, 0, -4, '#ff7a2a', 60, 0.4);
      audio.play('pound', 0.6);
      haptic('heavy');
      this.sparks(this.flight.x, this.flight.y, -2, '#ffb84a', 30);
      if (!this.warned.has(c)) {
        this.warned.add(c);
        if (this.flight.rockets > 0) this.world.hooks.toast('BONK! The rocks spat us back out. Wait for them to OPEN, then BOOST! Or blow them up with a ROCKET!', 'bolt');
        else this.world.hooks.toast('BONK! The rocks spat us back out. Wait for them to OPEN, then BOOST!', 'bolt');
      }
    },
    rocket: (c) => {
      const f = this.flight;
      const mesh = makeRocket();
      mesh.position.set(f.x, f.y - 0.3, -1.5);
      this.world.scene.add(mesh);
      this.rocketViews.push({ c, mesh, x0: f.x, y0: f.y - 0.3 });
      audio.play('fireball', 0.8);
      haptic('medium');
      this.world.hooks.hud();
    },
    blast: (c) => {
      const f = this.flight;
      const rel = c.s - f.s;
      const v = this.rocketViews.findIndex((r) => r.c === c);
      if (v >= 0) {
        this.world.scene.remove(this.rocketViews[v].mesh);
        this.rocketViews.splice(v, 1);
      }
      // KA-BOOM: the two rocks burst into tumbling chunks, dust and a ring of fire.
      this.world.flash(0, 0, -rel, '#ffb020', 90, 0.5);
      audio.play('explode', 0.7);
      audio.play('pound', 0.5);
      this.world.shake(Math.max(0.3, 1.2 - rel / 160));
      haptic('heavy');
      for (const side of [-1, 1]) {
        const x = c.axis === 'x' ? side * 6 : 0;
        const y = c.axis === 'y' ? side * 5 : 0;
        this.world.particles.emit(x, y, -rel, { count: 40, color: '#8a7a92', speed: 12, life: 1.6, size: 2.2, gravity: 0, drag: 0.6, vel: [0, 0, f.v] });
        this.world.particles.emit(x, y, -rel, { count: 30, color: '#ffb020', speed: 9, life: 0.9, size: 1.6, gravity: 0, vel: [0, 0, f.v] });
      }
      this.world.particles.emit(0, 0, -rel, { count: 30, color: '#ffe6a0', speed: 14, life: 0.6, size: 1.2, gravity: 0, vel: [0, 0, f.v] });
      this.world.save.bolts += 10;
      this.world.hooks.hud();
    },
    noRocket: (why) => {
      if (this.time - this.rocketHintAt < 4) return;
      this.rocketHintAt = this.time;
      if (why === 'empty') this.world.hooks.toast('No rockets left! From here on, it’s all timing.', 'bolt');
      else this.world.hooks.toast('No Clashing Rocks in range yet. Save the rocket for when they’re close!', 'bolt');
    },
    ring: (r) => {
      audio.play('bolt', 1.6);
      this.sparks(r.x, r.y, -0.5, '#ffd166', 14);
      this.saveRun();
    },
    bolt: () => {
      this.world.save.bolts += 2;
      audio.play('bolt', 1.2, 0.7);
      this.world.hooks.hud();
    },
    beacon: (b) => this.reachBeacon(b),
    radio: (r) => this.queueRadio(r.dialogue),
    hold: (h) => this.reachHold(h),
    launch: () => {
      audio.play('dash', 0.8);
      haptic('medium');
      this.world.shake(0.3);
    },
    boost: () => {
      audio.play('dash', 1.3);
      haptic('light');
    },
    empty: () => {
      if (this.time - this.emptyHintAt > 15) {
        this.emptyHintAt = this.time;
        this.world.hooks.toast('The boost is still charging! Watch the gold lights on the button.', 'bolt');
      }
    },
    hurt: () => {
      audio.play('hurt');
      haptic('warning');
      this.world.shake(0.7);
      this.world.hooks.hud();
    },
    finish: () => {
      this.saveRun(true);
      this.world.flags.add('argo:gate');
      void this.world.hooks.cutscene((d) => flightOutro(d, this)).then(() => this.world.hooks.complete());
    },
  };

  private sparks(x: number, y: number, z: number, color: string, n: number) {
    this.world.particles.emit(x, y, z, { count: n, color, speed: 5, life: 0.6, size: 1, gravity: 0, vel: [0, 0, this.flight.v * 0.6] });
  }

  /** Keeps this flight's best results in the save and pays out any finished side quest. */
  private saveRun(finished = false) {
    const f = this.flight;
    const better = recordFlight(this.world.save, this.world.def.id, { rings: this.rings, drones: this.dronesShot, clean: finished && f.crushes === 0 });
    if (better) this.world.hooks.progress();
  }

  private reachBeacon(b: Beacon) {
    const f = this.flight;
    this.cpS = b.s;
    this.savedDrones = this.dronesShot;
    this.world.flags.add(`argo:${b.id}`);
    f.hull = FLIGHT.hull;
    audio.play('checkpoint');
    this.world.hooks.toast('Checkpoint! The hull is mended.', 'halcyon');
    this.world.hooks.checkpoint();
    this.world.hooks.hud();
  }

  private reachHold(h: Hold) {
    const group = holdGroup(this.flight.things, h);
    if (group.length) this.lastOpen = untilOpen(group[0], this.flight.t);
    if (!h.dialogue || this.said.has(h.dialogue)) return;
    this.said.add(h.dialogue);
    if (h.dialogue === 'dove' && !this.world.flags.has('argo:dove')) {
      this.world.flags.add('argo:dove');
      void this.world.hooks.cutscene((d) => doveScene(d, this, h, group));
    } else this.world.hooks.say(this.world.dialogue(h.dialogue));
  }

  private queueRadio(key: string) {
    if (this.said.has(key)) return;
    this.said.add(key);
    this.radioQueue.push(...this.world.dialogue(key));
  }

  private updateRadio(dt: number) {
    this.radioT -= dt;
    if (this.radioT > 0 || !this.radioQueue.length) return;
    const line = this.radioQueue.shift() as Line;
    this.world.hooks.toast(line.text, line.who);
    this.radioT = 2.4 + line.text.length * 0.045;
  }

  /** Sends in each drone wave a little before the Argo reaches it. */
  private sendWaves() {
    const f = this.flight;
    if (f.holding) return;
    const things = f.things;
    for (let i = lowerBound(things, f.s - 5); i < things.length; i++) {
      const th = things[i];
      if (th.s > f.s + 60) break;
      if (th.kind !== 'drones' || this.sent.has(i)) continue;
      this.sent.add(i);
      this.drones.spawn(th);
    }
  }

  /* ---------------- guns ---------------- */

  /** Twin lasers from the oar tips; they bend a little toward a drone roughly ahead (aim assist). */
  private fire() {
    const f = this.flight;
    this.fireCd = 0.17;
    const target = this.drones.target(f.x, f.y);
    for (const side of [-1, 1]) {
      const l = this.lasers.find((x) => !x.alive);
      if (!l) return;
      l.alive = true;
      l.rel = 3.5;
      l.x = f.x + side * 0.9;
      l.y = f.y - 0.1;
      const time = target ? Math.max(0.05, (target.rel - l.rel) / LASER_SPEED) : 1;
      l.vx = target ? (target.x - l.x) / time : 0;
      l.vy = target ? (target.y - l.y) / time : 0;
      l.mesh.visible = true;
    }
    audio.play('shoot', 1.25, 0.6);
  }

  private updateLasers(dt: number) {
    const f = this.flight;
    const things = f.things;
    for (const l of this.lasers) {
      if (!l.alive) continue;
      l.rel += LASER_SPEED * dt;
      l.x += l.vx * dt;
      l.y += l.vy * dt;
      l.mesh.position.set(l.x, l.y, -l.rel);
      let done = l.rel > 160;
      const d = done ? null : this.drones.hitAt(l.x, l.y, l.rel, 0.3);
      if (d) {
        this.hitDrone(d);
        done = true;
      }
      // Crystals shatter into bolts; plain rocks just spark.
      for (let i = lowerBound(things, f.s + l.rel - 3); !done && i < things.length; i++) {
        const th = things[i];
        if (th.s > f.s + l.rel + 3) break;
        if (f.gone.has(i) || (th.kind !== 'rock' && th.kind !== 'crystal')) continue;
        const r = th.kind === 'rock' ? th.r : 1.5;
        if (Math.hypot(th.x - l.x, th.y - l.y, th.s - f.s - l.rel) > r + 0.3) continue;
        done = true;
        if (th.kind === 'crystal') {
          f.gone.add(i);
          this.world.save.bolts += 6;
          this.world.hooks.hud();
          audio.play('break', 1.3);
          this.world.particles.emit(th.x, th.y, -(th.s - f.s), { count: 26, color: '#ff8ae0', speed: 7, life: 0.8, size: 1.3, gravity: 0, vel: [0, 0, f.v] });
          this.world.particles.emit(th.x, th.y, -(th.s - f.s), { count: 10, color: '#ffd166', speed: 5, life: 0.8, size: 1.1, gravity: 0, vel: [0, 0, f.v] });
        } else this.sparks(l.x, l.y, -l.rel, '#bff8ff', 5);
      }
      if (done) {
        l.alive = false;
        l.mesh.visible = false;
      }
    }
  }

  private hitDrone(d: Drone) {
    d.hp -= 1;
    d.hitFlash = 1;
    const at = tmp.set(d.x, d.y, -d.rel);
    if (d.hp > 0) {
      audio.play('hit', 1.2, 0.7);
      this.sparks(at.x, at.y, at.z, '#fff0c0', 6);
      return;
    }
    this.drones.remove(d);
    audio.play('explode', 1.1);
    this.world.flash(at.x, at.y, at.z, '#ffb020', 40, 0.3);
    this.world.particles.emit(at.x, at.y, at.z, { count: 30, color: '#ffb020', speed: 8, life: 0.8, size: 1.4, gravity: 0, vel: [0, 0, this.flight.v] });
    this.world.particles.emit(at.x, at.y, at.z, { count: 14, color: '#2a2630', speed: 5, life: 1, size: 1.6, gravity: 0, vel: [0, 0, this.flight.v] });
    this.world.save.bolts += d.elite ? 15 : 5;
    this.dronesShot += 1;
    this.world.hooks.hud();
    this.saveRun();
  }

  /* ---------------- rockets ---------------- */

  /** Flies each rocket from where it left the Argo toward its pair, arriving when the flight says it lands. */
  private updateRockets() {
    const f = this.flight;
    for (const r of this.rocketViews) {
      const fly = f.flying.find((x) => x.c === r.c);
      if (!fly) continue;
      const k = 1 - fly.eta / fly.total;
      const rel = (r.c.s - f.s) * k;
      r.mesh.position.set(r.x0 * (1 - k), r.y0 * (1 - k) + Math.sin(k * Math.PI) * 1.5, -Math.max(1.5, rel));
      r.mesh.rotation.z = this.time * 10;
      const p = r.mesh.position;
      this.world.particles.emit(p.x, p.y, p.z + 1, { count: 1, color: Math.random() < 0.5 ? '#ffd166' : '#d8d0e0', speed: 0.8, life: 0.5, size: 0.9, gravity: 0, vel: [0, 0, f.v * 0.7] });
    }
  }

  private clearRockets() {
    for (const r of this.rocketViews) this.world.scene.remove(r.mesh);
    this.rocketViews = [];
  }

  /* ---------------- LUX's dove ---------------- */

  /** Sends the dove through the rocks of a hold line, flying the guide route at launch speed. */
  launchDove(h: Hold, group: Clash[]) {
    const last = group[group.length - 1];
    this.doveRun = { from: h.s, t0: this.flight.t, until: (last ? last.s : h.s) + CLASH.depth / 2 + 8 };
    this.dove.tail.visible = true;
  }

  private updateDove(dt: number) {
    const f = this.flight;
    const d = this.dove;
    // Only the first pair gets the dove: after that Jason reads the rocks on his own.
    const held = f.holding ? f.hold : null;
    const h = held && held === this.doveHold ? held : null;
    const run = this.doveRun;
    if (!run && h && this.autoDove) {
      // While waiting at a hold line the dove sets off on its own every time the rocks start to open.
      const group = holdGroup(f.things, h);
      if (group.length) {
        const u = untilOpen(group[0], f.t);
        if (u > this.lastOpen + 0.5) this.launchDove(h, group);
        this.lastOpen = u;
      }
    }
    if (this.doveRun) {
      const r = this.doveRun;
      const s = r.from + (f.t - r.t0) * FLIGHT.launch;
      const [gx, gy] = laneAt(this.flight.course.guide, Math.min(s, r.until));
      const past = Math.max(0, s - r.until);
      d.root.visible = true;
      d.root.position.set(gx, gy + 0.6 + past * 0.25, -(s - f.s));
      d.root.rotation.set(-Math.min(0.6, past * 0.05), 0, Math.sin(f.t * 3) * 0.15);
      d.flap(this.time, 1);
      if (past > 40) {
        this.doveRun = null;
        d.tail.visible = true;
      }
    } else if (h) {
      // Perched in the air just above the Argo's bow, ready to go.
      d.root.visible = true;
      d.root.position.set(f.x + 1.6, f.y + 1.9 + Math.sin(this.time * 3) * 0.12, -2.6);
      d.root.rotation.set(0, 0, 0);
      d.flap(this.time, 0.5);
    } else d.root.visible = false;
    void dt;
  }

  /* ---------------- drawing ---------------- */

  private visuals(dt: number, ds: number) {
    const f = this.flight;
    const m = this.model;
    if (dt > 0) {
      // Bank with the steering (never more than full stick, even after a jump back to a checkpoint).
      const cap = FLIGHT.steer;
      this.steerVX = damp(this.steerVX, Math.max(-cap, Math.min(cap, (f.x - this.pos.x) / dt)), 8, dt);
      this.steerVY = damp(this.steerVY, Math.max(-cap, Math.min(cap, (f.y - this.pos.y) / dt)), 8, dt);
    }
    this.pos.set(f.x, f.y, 0);
    m.root.position.copy(this.pos).add(this.offset);
    m.body.rotation.set(this.steerVY * 0.025, -this.steerVX * 0.012, -this.steerVX * 0.035);
    const launched = f.launchUntil > f.s;
    const thrust = f.boosting || launched ? 1 : Math.min(0.6, f.v / FLIGHT.launch);
    m.update(this.time, thrust);
    m.body.visible = f.invuln <= 0 || Math.floor(f.invuln * 14) % 2 === 0;
    m.shield.visible = f.boosting;
    if (f.boosting) (m.shield.material as THREE.MeshBasicMaterial).opacity = 0.16 + Math.sin(this.time * 24) * 0.05;
    this.view.update(f.s, f.t, f.gone, f.broken);
    this.belt.update(dt, ds);
    this.giant.update(dt);
    // The gas giant and its moons loom closer as the flight goes on.
    const k = Math.min(1, f.s / this.length);
    this.giant.group.position.set(-260 + k * 60, 90 - k * 30, -980 + k * 260);
    this.giant.group.scale.setScalar(190 + k * 50);
    if (dt > 0 && Math.random() < 0.7) {
      for (const side of [-1, 1]) this.world.particles.emit(f.x + side * 0.36, f.y - 0.1, 2.6, { count: 1, color: f.boosting ? '#ffd166' : '#7fe6ff', speed: 0.3, life: 0.3, size: 0.35, gravity: 0, vel: [0, 0, 18 + f.v * 0.5] });
    }
    // Dust shakes off the Clashing Rocks while they rumble, and the slam is loud.
    for (const c of this.view.visibleClashes) {
      const rel = c.s - f.s;
      if (rel > 150 || dt === 0) continue;
      const st = clashState(c, f.t);
      if (st.warn > 0 && st.gap > 0.5 && Math.random() < 0.5) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const x = c.axis === 'x' ? side * st.gap : (Math.random() - 0.5) * 12;
        const y = c.axis === 'y' ? side * st.gap : (Math.random() - 0.5) * 8;
        this.world.particles.emit(x, y, -rel + (Math.random() - 0.5) * CLASH.depth, { count: 2, color: '#c8a888', speed: 1.5, life: 1, size: 1.6, gravity: 0, vel: [0, 0, f.v] });
      }
      const prev = clashState(c, f.t - dt);
      if (prev.warn === 0 && st.warn > 0 && rel < 120) audio.play('roar', 0.45, 0.6);
      if (prev.gap > 0.05 && st.gap <= 0.05 && rel < 120) {
        audio.play('pound', 0.7, Math.max(0.3, 1 - rel / 120));
        this.world.shake(Math.max(0.15, 0.9 - rel / 100));
        this.world.particles.emit(0, 0, -rel, { count: 24, color: '#ffcf8a', speed: 9, life: 0.7, size: 1.3, gravity: 0, vel: [0, 0, f.v] });
      }
    }
  }

  cameraPose(out: Rig, dt: number): Rig {
    const f = this.flight;
    const want = tmp.set(f.x * 0.55, f.y * 0.5 + 4.6, 12.5);
    const look = tmp2.set(f.x * 0.8, f.y * 0.7 + 0.4, -22);
    if (!this.camReady || dt === 0) {
      this.camPos.copy(want);
      this.camLook.copy(look);
      this.camReady = true;
    } else {
      this.camPos.lerp(want, 1 - Math.exp(-6 * dt));
      this.camLook.lerp(look, 1 - Math.exp(-8 * dt));
    }
    out.pos.copy(this.camPos);
    out.look.copy(this.camLook);
    const speed = Math.max(0, Math.min(1, (f.v - FLIGHT.cruise) / (FLIGHT.launch - FLIGHT.cruise)));
    out.fov = 50 + speed * 10;
    return out;
  }

  /** Where the gas giant hangs in the sky right now. */
  giantPosition(): THREE.Vector3 {
    return this.giant.group.position.clone();
  }

  intro(d: Director): Promise<void> {
    return flightIntro(d, this);
  }

  respawn() {
    const f = this.flight;
    f.restart(this.cpS);
    this.drones.clear();
    for (const l of this.lasers) {
      l.alive = false;
      l.mesh.visible = false;
    }
    for (const i of [...this.sent]) if (f.things[i].s > this.cpS) this.sent.delete(i);
    this.dronesShot = this.savedDrones;
    this.doveRun = null;
    this.clearRockets();
    this.radioQueue = [];
    this.wrecked = false;
    this.camReady = false;
    this.world.hooks.hud();
  }

  hud(): VehicleHud {
    const f = this.flight;
    let prompt: string | null = null;
    let urgent = false;
    // The "wait for the dove / BOOST NOW!" call-out is the first pair's lesson only.
    const h = f.holding && f.hold === this.doveHold ? f.hold : null;
    if (h) {
      const group = holdGroup(f.things, h);
      if (group.length) {
        const first = group[0];
        const last = group[group.length - 1];
        // The latest moment to launch and still clear the last pair before it slams.
        const exit = (last.s + CLASH.depth / 2 + FLIGHT.radius - h.s) / FLIGHT.launch + FLIGHT.launch / (2 * FLIGHT.accel);
        const slamAt = first.period - CLASH.shut - CLASH.slam;
        const safe = Math.max(0.3, Math.min(1.6, slamAt + 0.1 - exit));
        const u = clashState(first, f.t).phase;
        urgent = u <= safe;
        prompt = urgent ? label('BOOST NOW!') : label('Wait for the dove...');
      }
    }
    return {
      hull: f.hull,
      hullMax: FLIGHT.hull,
      boost: f.meter,
      boostSlots: Math.round(1 / FLIGHT.boostCost),
      boosting: f.boosting || f.launchUntil > f.s,
      counter: ['ring', this.rings, this.ringTotal],
      rockets: [f.rockets, FLIGHT.rockets, !!f.rocketTarget()],
      progress: Math.min(1, f.s / this.length),
      marks: this.beacons.map((b) => b.s / this.length),
      prompt,
      urgent,
    };
  }

  stats(): [string, string][] {
    return [
      [tr('Gold rings'), `${this.rings} / ${this.ringTotal}`],
      [tr('Drones shot down'), `${this.dronesShot}`],
      [tr('Squished by the rocks'), `${this.flight.crushes}`],
    ];
  }

  skipTo(at: number) {
    this.flight.restart(at);
    this.drones.clear();
    this.clearRockets();
    this.camReady = false;
  }

  dispose() {
    this.doveRun = null;
    this.clearRockets();
  }
}
