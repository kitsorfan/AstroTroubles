import * as THREE from 'three';

import type { Director, Rig } from '../../cinema/director';
import { audio } from '../../core/audio';
import { damp } from '../../core/math';
import type { Input } from '../../core/input';
import { tr } from '../../core/i18n';
import type { World } from '../../game/world';
import type { Line } from '../../world/levelTypes';
import type { Beacon } from '../course';
import type { Vehicle, VehicleHud } from '../vehicle';
import { DIVE, SONG, nearestBeat } from './dive';
import { ORGAN } from './organ';
import { Sea } from './seaScene';
import { SeaView } from './seaView';
import { OrganBattle } from './subBattle';
import { diveEvents } from './subEvents';
import { FishView, SoundRings } from './subFx';
import { Guns } from './subGuns';
import { makeSub, type SubModel } from './subModel';
import { diveIntro } from './subScenes';
import { Dive, type DiveEvents } from './swim';

/**
 * The little sub Dolphin (chapter 3, level 4, the Sirens' Sea): it swims forward on its own while the
 * player steers it through kelp, reefs and sunken Gardener ruins, fires torpedoes (BLAST) and PINGs the
 * sonar (the BOOST button), which lights up hidden doorways and pearls and stuns piranha drones. When a
 * siren buoy sings, the button turns into SING: LUX's counter-song, tapped on the beat. At the end the
 * sub stops before THE SIREN ORGAN (subBattle.ts), and after it, swims up to the surface.
 */

/** Marks an English HUD text for translation (the HUD translates it when it shows it). */
const label = (en: string) => en;
const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();
const FOG = new THREE.Color('#0b4f6e');
const FOG_DEEP = new THREE.Color('#03121f');

export class SubDive implements Vehicle {
  readonly kind = 'sub' as const;
  readonly dive: Dive;
  readonly model: SubModel;
  readonly view: SeaView;
  readonly sea: Sea;
  readonly rings: SoundRings;
  readonly guns: Guns;
  readonly battle: OrganBattle;
  readonly pos = new THREE.Vector3();
  /** Moves the drawn sub away from its swimming position (cutscenes use it). */
  readonly offset = new THREE.Vector3();
  private fishView: FishView;
  time = 0;
  /** How dark the water is around the sub (0..1, eased), and how bright the last PING still is. */
  dark = 0;
  private steerVX = 0;
  private steerVY = 0;
  private camPos = new THREE.Vector3();
  private camLook = new THREE.Vector3();
  private camReady = false;
  /** Distance of the last checkpoint reached (where a lost stretch restarts). */
  cpS = 0;
  private wrecked = false;
  private radioQueue: Line[] = [];
  private radioT = 0;
  readonly said = new Set<string>();
  readonly told = new Set<string>();
  /** Buoys silenced this dive (the Organ's own don't count), and the count at the last checkpoint. */
  silenced = 0;
  savedSilenced = 0;
  readonly length: number;
  readonly beacons: Beacon[];
  readonly ringTotal: number;
  readonly pearlTotal: number;
  readonly events: DiveEvents;
  private lastBeat = -1;

  constructor(readonly world: World) {
    const course = world.def.dive;
    if (!course) throw new Error(`${world.def.id} has no dive course`);
    this.dive = new Dive(course);
    const things = this.dive.things;
    this.length = things.find((t) => t.kind === 'surface')?.s ?? things[things.length - 1].s;
    this.beacons = things.filter((t): t is Beacon => t.kind === 'checkpoint');
    this.ringTotal = things.filter((t) => t.kind === 'ring').length;
    this.pearlTotal = things.filter((t) => t.kind === 'pearl').length;
    const scene = world.scene;
    world.camera.far = 420;
    world.camera.updateProjectionMatrix();
    // The ruins line the canyon where the course has Gardener columns and gates.
    const ruins: [number, number][] = [
      [760, 1720],
      [2900, 3520],
    ];
    this.sea = new Sea(ruins);
    scene.add(this.sea.group);
    this.view = new SeaView(things);
    scene.add(this.view.group);
    for (const b of this.dive.buoys) this.view.addBuoy(b);
    this.model = makeSub();
    scene.add(this.model.root);
    this.rings = new SoundRings(scene);
    this.guns = new Guns(world, scene, this.rings);
    this.fishView = new FishView(scene);
    this.events = diveEvents(this);
    this.battle = new OrganBattle(this);
    // Back at the furthest checkpoint reached, when resuming a saved dive.
    for (const b of this.beacons) if (world.flags.has(`sub:${b.id}`)) this.cpS = Math.max(this.cpS, b.s);
    if (world.flags.has('boss')) {
      this.battle.state = 'won';
      this.dive.release();
    }
    if (this.cpS > 0) this.dive.restart(this.cpS);
    this.visuals(0, 0);
  }

  get hull() {
    return this.dive.hull;
  }

  get hullMax() {
    return DIVE.hull as number;
  }

  /** Rings and pearls taken this dive. */
  count(kind: 'ring' | 'pearl'): number {
    let n = 0;
    for (const i of this.dive.gone) if (this.dive.things[i].kind === kind) n += 1;
    return n;
  }

  /* ---------------- per frame ---------------- */

  update(dt: number, input: Input, cutscene: boolean) {
    const d = this.dive;
    this.time += dt;
    if (cutscene || d.finished) {
      d.t += dt;
      this.battle.draw(d.s, this.time);
      this.visuals(dt, 0);
      return;
    }
    const s0 = d.s;
    let press = input.take('dash') || input.take('jump');
    if (press && this.battle.dueling && !d.singer) {
      this.battle.sing();
      press = false;
    }
    d.step(dt, { steerX: input.moveX, steerY: -input.moveZ, ping: press }, this.events);
    this.battle.update(dt);
    const fire = input.take('shoot') || input.isHeld('shoot');
    const organ = this.battle.state === 'fight' ? this.battle.fight : null;
    this.guns.update(dt, fire, d, organ, this.events, this.battle.events, {
      fish: (f) => {
        this.world.particles.emit(f.x, f.y, -(f.s - d.s), { count: 18, color: '#ffb020', speed: 5, life: 0.6, size: 0.8, gravity: 0 });
        this.world.save.bolts += 4;
        this.world.hooks.hud();
      },
      pipe: (_i, ok) => {
        if (!ok) this.tellOnce('capped', 'That pipe is capped in gold! Torpedo the GLOWING one.');
      },
    });
    this.singAlong();
    this.updateRadio(dt);
    this.battle.draw(d.s, this.time);
    this.visuals(dt, d.s - s0);
    if (d.hull <= 0 && !this.wrecked) {
      this.wrecked = true;
      this.world.playerDown();
    }
  }

  /** A toast said only once a dive. */
  tellOnce(key: string, text: string) {
    if (this.told.has(key)) return;
    this.told.add(key);
    this.world.hooks.toast(text, 'bolt');
  }

  /** While a buoy sings, it sends out a ring of sound on every beat. */
  private singAlong() {
    const singer = this.dive.singer;
    if (!singer) return;
    const { off, n } = nearestBeat(this.dive.t);
    if (n === this.lastBeat || off > 0) return;
    this.lastBeat = n;
    const b = singer.b;
    this.rings.burst(b.x, b.y, -(b.s - this.dive.s), 1, 6, '#ff6fb0', 1.1);
    // The siren's tune: four notes going round, softer while it's far away.
    const near = Math.max(0.25, 1 - (b.s - this.dive.s) / SONG.range);
    audio.play(['tone2', 'tone0', 'tone3', 'tone1'][((n % 4) + 4) % 4] as 'tone0', 0.75, 0.5 * near);
  }

  queueRadio(key: string) {
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

  /* ---------------- drawing ---------------- */

  private visuals(dt: number, ds: number) {
    const d = this.dive;
    const m = this.model;
    if (dt > 0) {
      const cap = DIVE.steer;
      this.steerVX = damp(this.steerVX, Math.max(-cap, Math.min(cap, (d.x - this.pos.x) / dt)), 6, dt);
      this.steerVY = damp(this.steerVY, Math.max(-cap, Math.min(cap, (d.y - this.pos.y) / dt)), 6, dt);
    }
    this.pos.set(d.x, d.y, 0);
    m.root.position.copy(this.pos).add(this.offset);
    m.root.position.y += Math.sin(this.time * 1.6) * 0.08;
    m.body.rotation.set(this.steerVY * 0.03, -this.steerVX * 0.02, -this.steerVX * 0.04);
    m.update(this.time, Math.min(1, d.v / DIVE.rush), !!d.singer || this.battle.dueling);
    m.body.visible = d.invuln <= 0 || Math.floor(d.invuln * 14) % 2 === 0;
    // Deep, dark stretches: the fog closes in (a PING pushes it back for a while), and the headlight matters.
    this.dark = damp(this.dark, d.dark ? 1 : 0, 1.5, Math.max(dt, 0.0001));
    const lit = Math.min(1, d.reveal / 2);
    const fog = this.world.scene.fog as THREE.Fog | null;
    if (fog) {
      const k = this.dark * (1 - lit * 0.6);
      fog.color.copy(FOG).lerp(FOG_DEEP, k);
      fog.near = 16 - k * 10;
      fog.far = 125 - k * 80;
    }
    m.lamp.intensity = 40 + this.dark * 80;
    (m.beam.material as THREE.MeshBasicMaterial).opacity = 0.05 + this.dark * 0.08;
    this.view.update(d.s, this.time, d.gone, Math.min(1, d.reveal / 1.5), d.singer, (s) => d.s >= s);
    this.sea.update(d.s, this.time, this.world.camera.position, this.dark);
    this.rings.update(dt, ds);
    this.fishView.update(d.fish, d.s, this.time);
    if (dt > 0) {
      // Bubbles from the propeller, and currents shown as streams of bubbles drifting across.
      if (Math.random() < 0.5) this.world.particles.emit(d.x, d.y + 0.1, 2.9, { count: 1, color: '#e8fbff', speed: 0.5, life: 0.8, size: 0.3, gravity: -1.5, vel: [0, 0, 6 + d.v * 0.4] });
      const cur = d.current;
      if (cur && Math.random() < 0.8) {
        const x = (Math.random() - 0.5) * DIVE.halfW * 2;
        const y = (Math.random() - 0.5) * DIVE.halfH * 2;
        this.world.particles.emit(x, y, -Math.random() * 30, { count: 2, color: cur.rush ? '#bff8ff' : '#9ae8ff', speed: 0.3, life: 1.2, size: 0.35, gravity: 0, vel: [cur.vx * 3, cur.vy * 3, cur.rush ? 20 : d.v] });
      }
    }
  }

  cameraPose(out: Rig, dt: number): Rig {
    const d = this.dive;
    const arena = d.holding;
    const want = arena ? tmp.set(d.x * 0.5, d.y * 0.5 + 4.2, 12.5) : tmp.set(d.x * 0.6, d.y * 0.55 + 3.4, 10.5);
    const look = arena ? tmp2.set(d.x * 0.4, d.y * 0.3 + 0.5, -30) : tmp2.set(d.x * 0.8, d.y * 0.7, -18);
    if (!this.camReady || dt === 0) {
      this.camPos.copy(want);
      this.camLook.copy(look);
      this.camReady = true;
    } else {
      this.camPos.lerp(want, 1 - Math.exp(-5 * dt));
      this.camLook.lerp(look, 1 - Math.exp(-6 * dt));
    }
    out.pos.copy(this.camPos);
    out.look.copy(this.camLook);
    out.fov = arena ? 58 : 55;
    return out;
  }

  intro(d: Director): Promise<void> {
    return diveIntro(d, this);
  }

  respawn() {
    const d = this.dive;
    d.restart(this.cpS);
    this.guns.clear();
    this.rings.clear();
    this.battle.reset();
    this.silenced = this.savedSilenced;
    this.radioQueue = [];
    this.wrecked = false;
    this.camReady = false;
    this.world.hooks.hud();
  }

  hud(): VehicleHud {
    const d = this.dive;
    const singer = d.singer;
    const duel = this.battle.dueling ? this.battle.fight.finale : null;
    let prompt: string | null = null;
    let urgent = false;
    let song: VehicleHud['song'] = null;
    if (singer) {
      const k = Math.round(d.t / SONG.beat);
      song = { beats: [0, 1, 2, 3, 4].map((i) => (k + i) * SONG.beat - d.t), got: singer.notes, need: SONG.notes };
      prompt = label('SING on the beat!');
    } else if (duel) {
      song = { beats: this.battle.fight.finaleBeats(), got: duel.notes, need: ORGAN.finaleNeed };
      prompt = label('Sing back! Tap SING on the beat!');
      urgent = true;
    } else if (this.battle.state === 'fight' && this.battle.fight.standing === ORGAN.pipes.length && this.battle.fight.t < 8) {
      prompt = label('Torpedo the GLOWING pipe!');
    } else if (d.reveal <= 0) {
      const door = d.things.find((t) => t.kind === 'door' && t.s > d.s && t.s - d.s < 40);
      if (door) prompt = label('PING to find the open door!');
    }
    return {
      hull: d.hull,
      hullMax: DIVE.hull,
      boost: d.meter,
      boostSlots: Math.round(1 / DIVE.pingCost),
      boosting: d.reveal > DIVE.pingReveal - 0.6,
      counter: ['ring', this.count('ring'), this.ringTotal],
      progress: Math.min(1, d.s / this.length),
      marks: this.beacons.map((b) => b.s / this.length),
      prompt,
      urgent,
      button: singer || duel ? label('SING') : label('PING'),
      song,
    };
  }

  stats(): [string, string][] {
    return [
      [tr('Gold rings'), `${this.count('ring')} / ${this.ringTotal}`],
      [tr('Siren buoys silenced'), `${this.silenced} / ${this.dive.buoys.filter((b) => !b.b.id.startsWith('organ')).length}`],
      [tr('Hidden pearls'), `${this.count('pearl')} / ${this.pearlTotal}`],
      [tr('Piranhas popped'), `${this.guns.shotFish}`],
    ];
  }

  skipTo(at: number) {
    this.dive.restart(at);
    this.guns.clear();
    this.camReady = false;
  }

  dispose() {
    this.radioQueue = [];
  }
}
