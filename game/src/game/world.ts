import * as THREE from 'three';

import { audio, type Track } from '../core/audio';
import { haptic } from '../core/bridge';
import { CELL, PLAYER } from '../core/constants';
import type { Input } from '../core/input';
import { damp } from '../core/math';
import type { Quality, SaveData } from '../core/save';
import { Bolt } from '../entities/bolt';
import { makeBoss, type Boss } from '../entities/bosses';
import { makeEnemy, type Enemy } from '../entities/enemies';
import type { Entity, HitKind, Interactable, Target } from '../entities/entity';
import { Beams, Rings } from '../entities/fx';
import { BoltField, Canister, HeartPickup, PowerCell, Shard, UpgradePickup } from '../entities/pickups';
import { Player } from '../entities/player';
import {
  BoltFind,
  BouncePad,
  BreakWall,
  Checkpoint,
  Cocoon,
  Conveyor,
  Crate,
  Door,
  Exit,
  Faller,
  FloorSwitch,
  Laser,
  Platform,
  Sign,
  Socket,
  Terminal,
  Trigger,
  Vendor,
  Vent,
  ZapFloor,
  type FloorFx,
} from '../entities/props';
import { Shots } from '../entities/shots';
import { buildLevel, type BuiltLevel } from '../world/builder';
import { buildDecor, type DecorPlacement } from '../world/decor';
import { Grid, parseLevel } from '../world/grid';
import type { Ability, Cond, EnemyKind, LevelDef, Line, ParsedLevel, PlacedEntity } from '../world/levelTypes';
import { Ambience, Particles } from '../world/particles';
import { pointBlocked, type Box, type Ground } from '../world/physics';
import { buildSky } from '../world/sky';
import { THEMES, type Theme } from '../world/themes';

export type Collectible = 'shard' | 'canister' | 'colonist' | 'ability';

export interface WorldHooks {
  say(lines: Line[], then?: () => void): void;
  toast(text: string, who?: 'bolt' | 'halcyon' | 'colonist' | 'kai'): void;
  hack(length: number, done: (ok: boolean) => void): void;
  shop(): void;
  complete(): void;
  checkpoint(): void;
  collect(kind: Collectible, id: string): void;
  hud(): void;
  bossBar(name: string | null, frac: number): void;
  down(): void;
  music(track: Track): void;
  objective(text: string): void;
  ending(kind: 'saved' | 'friends'): void;
}

export interface ResumeState {
  checkpoint: string | null;
  flags: string[];
  taken: string[];
  dead: string[];
}

const PITCH = 0.86;
/** Strength of the studio reflections; the game assigns the environment map itself. */
const ENV_LIGHT = 0.45;
const tmpV = new THREE.Vector3();
const NO_BOXES: Box[] = [];

export class World {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly level: ParsedLevel;
  readonly grid: Grid;
  readonly theme: Theme;
  readonly def: LevelDef;
  readonly boxes: Box[] = [];
  readonly player: Player;
  readonly bolt: Bolt;
  readonly particles: Particles;
  readonly ambience: Ambience;
  readonly shots: Shots;
  readonly beams: Beams;
  readonly rings: Rings;
  readonly boltField: BoltField;
  readonly flags = new Set<string>();
  readonly taken = new Set<string>();
  readonly dead = new Set<string>();
  private entities: Entity[] = [];
  private movers: Entity[] = [];
  private targets: Target[] = [];
  private interactables: Interactable[] = [];
  private enemies: Enemy[] = [];
  private floor = new Map<number, FloorFx>();
  private checkpoints: Checkpoint[] = [];
  private activeCheckpoint: Checkpoint | null = null;
  private built: BuiltLevel;
  private hemi: THREE.HemisphereLight;
  private sun: THREE.DirectionalLight;
  private fog: THREE.Fog;
  private fogColor: THREE.Color;
  boss: Boss | null = null;
  focus: Interactable | null = null;
  time = 0;
  cutscene = false;
  darkness = 0;
  cameraYaw = 0;
  private camTarget = new THREE.Vector3();
  private shakeAmt = 0;
  private objT = 0;
  private lastObjective = '';
  private shieldCd = 0;

  constructor(
    def: LevelDef,
    readonly save: SaveData,
    readonly hooks: WorldHooks,
    quality: Quality,
    resume: ResumeState | null,
  ) {
    this.def = def;
    this.level = parseLevel(def);
    this.grid = new Grid(this.level.width, this.level.depth, this.level.cells);
    this.theme = THEMES[def.id];
    if (resume) {
      for (const f of resume.flags) this.flags.add(f);
      for (const t of resume.taken) this.taken.add(t);
      for (const d of resume.dead) this.dead.add(d);
    }
    if (def.index > 1) this.flags.add('bolt');

    const th = this.theme;
    this.fogColor = new THREE.Color(th.fog);
    this.fog = new THREE.Fog(th.fog, th.fogNear, th.fogFar);
    this.scene.fog = this.fog;
    this.scene.background = new THREE.Color(th.skyTop);
    this.camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.3, 500);

    this.hemi = new THREE.HemisphereLight(th.hemiSky, th.hemiGround, th.hemi);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(th.sun, th.sunI);
    const shadows = quality !== 'low';
    this.sun.castShadow = shadows;
    if (shadows) {
      const size = quality === 'high' ? 2048 : 1024;
      this.sun.shadow.mapSize.set(size, size);
      const cam = this.sun.shadow.camera;
      cam.left = -22;
      cam.right = 22;
      cam.top = 22;
      cam.bottom = -22;
      cam.near = 1;
      cam.far = 80;
      this.sun.shadow.bias = -0.0008;
      this.sun.shadow.normalBias = 0.04;
    }
    this.scene.add(this.sun, this.sun.target);

    this.built = buildLevel(this.level, this.grid, th, shadows);
    this.scene.add(this.built.group);
    const span = Math.max(this.level.width, this.level.depth) * CELL;
    this.scene.add(buildSky(th, new THREE.Vector3((this.level.width * CELL) / 2, 0, (this.level.depth * CELL) / 2), span));

    this.particles = new Particles(quality === 'low' ? 900 : 1600);
    this.scene.add(this.particles.points);
    this.ambience = new Ambience(th.mood);
    this.scene.add(this.ambience.points);
    this.beams = new Beams(this.scene);
    this.rings = new Rings(this.scene);

    const sp = this.level.spawn;
    this.player = new Player(this, Grid.center(sp.cx), sp.h, Grid.center(sp.cz), sp.facing);
    this.cameraYaw = sp.facing + Math.PI;
    this.shots = new Shots(this);
    this.boltField = new BoltField(this);
    this.bolt = new Bolt(this);
    this.bolt.active = this.flags.has('bolt');

    for (const pe of this.level.entities) this.spawnSpec(pe);
    this.scene.add(buildDecor(this.decorItems, th.accent, this.boxes));

    if (resume?.checkpoint) {
      const cp = this.checkpoints.find((c) => c.id === resume.checkpoint);
      if (cp) {
        cp.setActive(true);
        this.activeCheckpoint = cp;
        this.player.teleport(cp.spot.x, cp.spot.y, cp.spot.z + 1.2);
      }
    }
    const pb = this.player.body;
    this.bolt.place(pb.x - 1, pb.y + 2, pb.z + 1);
    this.camTarget.set(pb.x, pb.y + 1.2, pb.z);
    this.placeCamera(0);
  }

  /* ---------------- spawning ---------------- */

  private spawnSpec(pe: PlacedEntity) {
    const { spec, cx, cz, h, id } = pe;
    const s = this.save;
    switch (spec.type) {
      case 'bolt':
        this.boltField.add(Grid.center(cx), h + 1, Grid.center(cz));
        break;
      case 'crate':
        if (!this.taken.has(id)) this.addEntity(new Crate(this, id, cx, cz, h, spec.loot, spec.metal));
        break;
      case 'heart':
        if (!this.taken.has(id)) this.addEntity(new HeartPickup(this, id, cx, cz, h, id));
        break;
      case 'canister':
        if (!s.canisters.includes(id)) this.addEntity(new Canister(this, id, cx, cz, h));
        break;
      case 'shard':
        if (!s.shards.includes(id)) this.addEntity(new Shard(this, id, cx, cz, h));
        break;
      case 'upgrade':
        if (!s.abilities.includes(spec.ability)) this.addEntity(new UpgradePickup(this, id, cx, cz, h, spec.ability));
        break;
      case 'checkpoint': {
        const cp = this.addEntity(new Checkpoint(this, id, cx, cz, h));
        this.checkpoints.push(cp);
        break;
      }
      case 'enemy':
        if (!this.dead.has(id)) {
          const e = makeEnemy(this, id, spec.enemy, cx, cz, h, spec.variant);
          e.room = spec.room;
          this.addEntity(e);
          this.registerEnemy(e);
        }
        break;
      case 'boss':
        if (!this.flags.has('boss')) {
          const b = this.addEntity(makeBoss(this, id, spec.boss, cx, cz, h));
          this.boss = b;
        }
        break;
      case 'door':
        this.addEntity(new Door(this, id, cx, cz, h, spec.open));
        break;
      case 'switch':
        this.addEntity(new FloorSwitch(this, id, cx, cz, h, spec.flag, spec.timed));
        break;
      case 'terminal':
        this.addEntity(new Terminal(this, id, cx, cz, h, spec.flag, spec.length));
        break;
      case 'cell':
        if (!this.taken.has(id)) this.addEntity(new PowerCell(this, id, cx, cz, h));
        break;
      case 'socket':
        this.addEntity(new Socket(this, id, cx, cz, h, spec.flag));
        break;
      case 'platform':
        this.movers.push(new Platform(this, id, cx, cz, h, spec));
        break;
      case 'faller':
        this.movers.push(new Faller(this, id, cx, cz, h));
        break;
      case 'bounce':
        this.addEntity(new BouncePad(this, id, cx, cz, h));
        break;
      case 'vent':
        this.addEntity(new Vent(this, id, cx, cz, h, spec.period, spec.offset));
        break;
      case 'laser':
        this.addEntity(new Laser(this, id, cx, cz, h, spec));
        break;
      case 'zap':
        this.addEntity(new ZapFloor(this, id, cx, cz, h, spec.period, spec.offset));
        break;
      case 'conveyor':
        this.addEntity(new Conveyor(this, id, cx, cz, h, spec.dx, spec.dz, spec.speed));
        break;
      case 'cocoon':
        if (!s.colonists.includes(id)) this.addEntity(new Cocoon(this, id, cx, cz, h, spec.name, spec.line));
        break;
      case 'vendor':
        this.addEntity(new Vendor(this, id, cx, cz, h));
        break;
      case 'sign':
        this.addEntity(new Sign(this, id, cx, cz, h, spec.text));
        break;
      case 'trigger':
        this.addEntity(new Trigger(this, id, cx, cz, spec));
        break;
      case 'exit':
        this.addEntity(new Exit(this, id, cx, cz, h));
        break;
      case 'breakwall':
        if (!this.taken.has(id)) this.addEntity(new BreakWall(this, id, cx, cz, h));
        break;
      case 'boltfind':
        if (!this.flags.has('bolt')) this.addEntity(new BoltFind(this, id, cx, cz, h));
        break;
      case 'decor':
        this.decorItems.push({
          kind: spec.kind,
          x: Grid.center(cx),
          y: h,
          z: Grid.center(cz),
          rot: spec.rot ?? 0,
          scale: spec.scale ?? 1,
          solid: spec.solid ?? true,
        });
        break;
      default:
        break;
    }
  }

  private decorItems: DecorPlacement[] = [];

  addEntity<T extends Entity>(e: T): T {
    this.entities.push(e);
    return e;
  }

  forget(e: Entity) {
    for (const list of [this.entities, this.movers] as Entity[][]) {
      const i = list.indexOf(e);
      if (i >= 0) list.splice(i, 1);
    }
    const t = this.targets.indexOf(e as unknown as Target);
    if (t >= 0) this.targets.splice(t, 1);
    const it = this.interactables.indexOf(e as unknown as Interactable);
    if (it >= 0) this.interactables.splice(it, 1);
    const en = this.enemies.indexOf(e as unknown as Enemy);
    if (en >= 0) this.enemies.splice(en, 1);
  }

  addTarget(t: Target) {
    this.targets.push(t);
  }

  removeTarget(t: Target) {
    const i = this.targets.indexOf(t);
    if (i >= 0) this.targets.splice(i, 1);
  }

  addInteractable(i: Interactable) {
    this.interactables.push(i);
  }

  registerEnemy(e: Enemy) {
    this.enemies.push(e);
    this.targets.push(e);
  }

  spawnEnemy(kind: EnemyKind, cx: number, cz: number, variant?: string): Enemy {
    const c = this.grid.cell(cx, cz);
    const h = c.kind === 'void' || c.kind === 'wall' ? this.player.body.y : c.h;
    const e = makeEnemy(this, `spawn${Math.random()}`, kind, cx, cz, h + 0.5, variant);
    this.addEntity(e);
    this.registerEnemy(e);
    this.particles.emit(Grid.center(cx), h + 0.6, Grid.center(cz), { count: 18, color: '#ff9ae0', speed: 5, life: 0.5 });
    return e;
  }

  registerFloor(cx: number, cz: number, fx: FloorFx) {
    this.floor.set(cz * this.level.width + cx, fx);
  }

  floorEffect(g: Ground | null): FloorFx | undefined {
    if (!g || g.kind === 'box') return undefined;
    return this.floor.get(g.cz * this.level.width + g.cx);
  }

  /* ---------------- flags & conditions ---------------- */

  setFlag(f: string) {
    this.flags.add(f);
  }

  clearFlag(f: string) {
    this.flags.delete(f);
  }

  hasFlag(f: string) {
    return this.flags.has(f);
  }

  cond(c: Cond): boolean {
    if ('flag' in c) return this.flags.has(c.flag) || (c.flag.startsWith('ability:') && this.save.abilities.includes(c.flag.slice(8) as Ability));
    if ('clear' in c) return !this.enemies.some((e) => e.alive && e.room === c.clear);
    if ('boss' in c) return this.flags.has('boss');
    if ('all' in c) return c.all.every((x) => this.cond(x));
    return false;
  }

  get boltActive() {
    return this.bolt.active;
  }

  joinBolt() {
    this.flags.add('bolt');
    this.bolt.active = true;
    const p = this.player.body;
    this.bolt.place(p.x, p.y + 3, p.z);
    audio.play('upgrade');
    this.hooks.checkpoint();
  }

  dialogue(id: string): Line[] {
    return this.def.dialogues[id] ?? [];
  }

  markTaken(id: string) {
    this.taken.add(id);
  }

  canExit() {
    return this.def.boss ? this.flags.has('boss') : true;
  }

  heldCell(): PowerCell | null {
    for (const e of this.entities) if (e instanceof PowerCell && e.isHeld) return e;
    return null;
  }

  collect(kind: Collectible, id: string) {
    const s = this.save;
    if (kind === 'shard' && !s.shards.includes(id)) s.shards.push(id);
    if (kind === 'canister' && !s.canisters.includes(id)) s.canisters.push(id);
    if (kind === 'colonist' && !s.colonists.includes(id)) s.colonists.push(id);
    this.hooks.collect(kind, id);
    this.hooks.hud();
  }

  unlock(ability: Ability, id: string) {
    if (!this.save.abilities.includes(ability)) this.save.abilities.push(ability);
    this.hooks.collect('ability', ability);
    void id;
  }

  event(name: string) {
    if (name === 'bolt') this.joinBolt();
    else if (name.startsWith('music:')) this.hooks.music(name.slice(6) as Track);
    else if (name === 'shake') this.shake(0.6);
  }

  /* ---------------- combat ---------------- */

  findAimTarget(origin: THREE.Vector3, facing: number, range: number): Target | null {
    let best: Target | null = null;
    let bestScore = Infinity;
    for (const t of this.targets) {
      if (!t.alive || !t.aimable) continue;
      const dx = t.aim.x - origin.x;
      const dz = t.aim.z - origin.z;
      const d = Math.hypot(dx, dz);
      if (d > range || Math.abs(t.aim.y - origin.y) > 6) continue;
      let diff = Math.abs(Math.atan2(dx, dz) - facing) % (Math.PI * 2);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;
      if (diff > 1.05 && d > 5) continue;
      if (!this.clearLine(origin, t.aim)) continue;
      const score = d * (1 + diff * 1.4);
      if (score < bestScore) {
        bestScore = score;
        best = t;
      }
    }
    return best;
  }

  private clearLine(a: THREE.Vector3, b: THREE.Vector3) {
    // Only walls and floors block aim; a target's own collider (cocoons, bosses) must not hide it.
    const steps = Math.ceil(a.distanceTo(b) / 0.8);
    for (let i = 1; i < steps; i++) {
      tmpV.copy(a).lerp(b, i / steps);
      if (pointBlocked(this.grid, NO_BOXES, tmpV.x, tmpV.y, tmpV.z)) return false;
    }
    return true;
  }

  /** Hits the first target overlapping a sphere. Returns true if something was hit. */
  hitAt(p: THREE.Vector3, r: number, dmg: number, kind: HitKind): boolean {
    for (const t of this.targets) {
      if (!t.alive) continue;
      const rr = r + t.radius;
      if (t.aim.distanceToSquared(p) < rr * rr) {
        if (t.hit(dmg, kind, p)) return true;
      }
    }
    return false;
  }

  private hitAll(p: THREE.Vector3, r: number, dmg: number, kind: HitKind, skip?: Set<unknown>) {
    for (const t of [...this.targets]) {
      if (!t.alive || skip?.has(t)) continue;
      const dx = t.aim.x - p.x;
      const dz = t.aim.z - p.z;
      const dy = t.aim.y - p.y;
      if (dx * dx + dz * dz < (r + t.radius) ** 2 && Math.abs(dy) < 2.2) {
        skip?.add(t);
        t.hit(dmg, kind, p);
      }
    }
  }

  spinAttack(player: Player, hitSet: Set<unknown>) {
    const b = player.body;
    tmpV.set(b.x, b.y + 0.9, b.z);
    this.hitAll(tmpV.clone(), PLAYER.spinRadius, 1 + (this.save.upgrades.blaster ?? 0), 'spin', hitSet);
    if (Math.random() < 0.5) this.particles.emit(b.x, b.y + 0.9, b.z, { count: 2, color: '#ffffff', speed: 6, life: 0.2, size: 0.35, gravity: 0 });
  }

  groundPound(player: Player) {
    const b = player.body;
    const p = new THREE.Vector3(b.x, b.y + 0.3, b.z);
    this.hitAll(p, 2.8, 2 + (this.save.upgrades.blaster ?? 0), 'pound');
    this.rings.burst(b.x, b.y, b.z, 5, '#ffffff', 0.45);
    this.particles.emit(b.x, b.y + 0.2, b.z, { count: 26, color: '#ffffff', speed: 7, life: 0.5, size: 0.5, up: 1, gravity: 6 });
    this.shake(0.4);
    audio.play('pound');
    haptic('medium');
  }

  nearestEnemy(x: number, z: number, range: number): Target | null {
    let best: Target | null = null;
    let bd = range * range;
    for (const t of this.targets) {
      if (!t.alive || !t.aimable) continue;
      const d = (t.aim.x - x) ** 2 + (t.aim.z - z) ** 2;
      if (d < bd) {
        bd = d;
        best = t;
      }
    }
    return best;
  }

  dropBolts(pos: THREE.Vector3, n: number) {
    for (let i = 0; i < n; i++) this.boltField.add(pos.x, pos.y, pos.z, true);
  }

  dropHeart(pos: THREE.Vector3) {
    this.addEntity(HeartPickup.at(this, pos));
  }

  enemyDied(e: Enemy) {
    this.dead.add(e.id);
    const i = this.enemies.indexOf(e);
    if (i >= 0) this.enemies.splice(i, 1);
    this.removeTarget(e);
    if (e.room && !this.enemies.some((x) => x.alive && x.room === e.room)) {
      audio.play('success');
      this.hooks.toast('Area clear!', 'bolt');
    }
  }

  shake(a: number) {
    this.shakeAmt = Math.max(this.shakeAmt, a);
  }

  /* ---------------- checkpoints & bosses ---------------- */

  activateCheckpoint(cp: Checkpoint) {
    for (const c of this.checkpoints) c.setActive(c === cp);
    this.activeCheckpoint = cp;
    audio.play('checkpoint');
    this.player.heal(99);
    this.hooks.toast('Checkpoint saved!', 'bolt');
    this.hooks.checkpoint();
  }

  resumeState(): ResumeState {
    return {
      checkpoint: this.activeCheckpoint?.id ?? null,
      flags: [...this.flags],
      taken: [...this.taken],
      dead: [...this.dead],
    };
  }

  playerDown() {
    this.hooks.down();
  }

  respawn() {
    const cp = this.activeCheckpoint;
    const sp = this.level.spawn;
    const x = cp ? cp.spot.x : Grid.center(sp.cx);
    const y = cp ? cp.spot.y : sp.h;
    const z = cp ? cp.spot.z + 1.2 : Grid.center(sp.cz);
    this.player.teleport(x, y, z);
    this.player.revive();
    this.shots.clear();
    this.bolt.place(x - 1, y + 2, z + 1);
    if (this.boss?.started && !this.boss.defeated) {
      this.boss.reset();
      this.boss.started = false;
      this.hooks.bossBar(null, 0);
      this.hooks.music(this.def.music as Track);
    }
    if (this.player.carrying) {
      // Keep the power cell: it follows Kai back to the checkpoint.
    }
    this.camTarget.set(x, y + 1.2, z);
  }

  bossStarted(b: Boss) {
    this.boss = b;
    this.hooks.bossBar(b.title, b.hp / b.maxHp);
    this.hooks.music('boss');
    audio.play('roar');
    this.shake(0.5);
    const lines = this.dialogue('boss');
    if (lines.length) this.hooks.say(lines);
  }

  bossDefeated(_b: Boss) {
    this.flags.add('boss');
    this.hooks.bossBar(null, 0);
    this.hooks.music(this.def.music as Track);
    this.hooks.checkpoint();
    const lines = this.dialogue('bossDown');
    if (this.def.id === 'bridge') {
      this.hooks.say(lines, () => this.hooks.ending('saved'));
    } else if (lines.length) {
      this.hooks.say(lines);
    }
  }

  communed() {
    this.flags.add('boss');
    this.hooks.music('ending');
    this.hooks.say(this.dialogue('friends'), () => this.hooks.ending('friends'));
  }

  /* ---------------- per frame ---------------- */

  update(dt: number, input: Input, camSpeed: number) {
    this.time += dt;
    for (const m of this.movers) m.update(dt);
    this.player.update(dt, input);
    this.bolt.update(dt);
    for (const e of [...this.entities]) if (e.alive) e.update(dt);
    this.boltField.update(dt);
    this.shots.update(dt);
    this.beams.update(dt);
    this.rings.update(dt);
    this.particles.update(dt);
    this.built.update(dt, this.time);

    // BOLT's shield when nothing else needs the action button.
    this.shieldCd -= dt;
    this.focus = this.findFocus();
    if (input.take('action')) {
      if (this.focus) this.focus.interact();
      else if (this.save.abilities.includes('shield') && this.shieldCd <= 0) {
        this.player.shieldT = 3;
        this.shieldCd = 6;
        audio.play('shield');
      }
    }

    // Lights dim in dark rooms; BOLT's flashlight takes over.
    const cell = this.grid.cell(this.player.cellX, this.player.cellZ);
    this.darkness = damp(this.darkness, cell.dark ? 1 : 0, 3, dt);
    this.hemi.intensity = this.theme.hemi * (1 - 0.86 * this.darkness);
    this.scene.environmentIntensity = ENV_LIGHT * (1 - 0.9 * this.darkness);
    this.sun.intensity = this.theme.sunI * (1 - 0.92 * this.darkness);
    this.fog.color.copy(this.fogColor).multiplyScalar(1 - 0.7 * this.darkness);

    this.objT -= dt;
    if (this.objT <= 0) {
      this.objT = 0.3;
      const obj = this.def.objectives.find((o) => !this.cond(o.until));
      const text = obj?.text ?? '';
      if (text !== this.lastObjective) {
        this.lastObjective = text;
        this.hooks.objective(text);
      }
    }

    this.cameraYaw -= input.consumeCamDrag() * 0.0068 * camSpeed;
    this.placeCamera(dt);
    const p = this.player.body;
    this.ambience.update(dt, this.time, p.x, p.y, p.z);
  }

  /** Uniforms of the see-through shader, for props that should not hide Kai (doors). */
  get cutaway() {
    return this.built.cutaway;
  }

  get shieldReady() {
    return this.save.abilities.includes('shield') && this.shieldCd <= 0;
  }

  private findFocus(): Interactable | null {
    const p = this.player.body;
    let best: Interactable | null = null;
    let bd = Infinity;
    for (const it of this.interactables) {
      if (!it.alive) continue;
      const d = Math.hypot(it.spot.x - p.x, it.spot.z - p.z);
      if (d > it.range || Math.abs(it.spot.y - p.y) > 3) continue;
      if (!it.label()) continue;
      if (d < bd) {
        bd = d;
        best = it;
      }
    }
    return best;
  }

  private placeCamera(dt: number) {
    const p = this.player.body;
    const look = tmpV.set(p.x + p.vx * 0.12, p.y + 1.2, p.z + p.vz * 0.12);
    if (dt === 0) this.camTarget.copy(look);
    else {
      this.camTarget.x = damp(this.camTarget.x, look.x, 7, dt);
      this.camTarget.y = damp(this.camTarget.y, look.y, 4, dt);
      this.camTarget.z = damp(this.camTarget.z, look.z, 7, dt);
    }
    const dist = this.boss?.started && !this.boss.defeated ? 17 : 13;
    const cp = Math.cos(PITCH);
    const c = this.camera.position;
    c.set(
      this.camTarget.x + Math.sin(this.cameraYaw) * cp * dist,
      this.camTarget.y + Math.sin(PITCH) * dist,
      this.camTarget.z + Math.cos(this.cameraYaw) * cp * dist,
    );
    if (this.shakeAmt > 0) {
      c.x += (Math.random() - 0.5) * this.shakeAmt;
      c.y += (Math.random() - 0.5) * this.shakeAmt;
      c.z += (Math.random() - 0.5) * this.shakeAmt;
      this.shakeAmt = Math.max(0, this.shakeAmt - dt * 2.5);
    }
    this.camera.lookAt(this.camTarget);
    this.built.cutaway.uCam.value.copy(c);
    this.built.cutaway.uTarget.value.set(p.x, p.y, p.z);
    this.sun.position.set(p.x + 12, p.y + 30, p.z + 8);
    this.sun.target.position.set(p.x, p.y, p.z);
  }

  resize(w: number, h: number) {
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 1.2 ? 62 : 50;
    this.camera.updateProjectionMatrix();
    this.particles.setViewportHeight(h);
    this.ambience.setViewportHeight(h);
  }
}
