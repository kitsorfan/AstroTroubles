import * as THREE from 'three';

import { audio } from '../core/audio';
import { haptic } from '../core/bridge';
import { CELL, DEATH_Y, GAZE, GEAR, GRAPPLE, HERO_SWITCH, MIRROR, OUTDOOR, PLAYER } from '../core/constants';
import type { Input } from '../core/input';
import { clamp, damp, dampAngle } from '../core/math';
import type { World } from '../game/world';
import { Grid } from '../world/grid';
import type { Ability, HeroId } from '../world/levelTypes';
import { makeBody, moveBody, type Body } from '../world/physics';
import { dressJason, makeJason, type HeroModel, type JasonModel } from './models';
import type { Target } from './entity';
import { Arrows } from './heroes/arrows';
import { AtalantaMoves } from './heroes/atalanta';
import { BrennusMoves } from './heroes/brennus';
import { Follower } from './heroes/follower';
import { HEROES, heroDev, heroRoster, nextHero, switchBlock, type SwitchBlock } from './heroes/heroes';
import { makeMirrorShield, stoneSkin, type MirrorShieldModel } from './labyrinth/stone';
import { JasonFx } from './moveFx';
import { SPREAD, WEAPONS, equippedWeapon, nextWeapon, ownedWeapons, type WeaponId } from './weapons';

/** How long Jason hangs in the air (and flips) before a ground pound slams down. */
const POUND_HANG = 0.18;

const tmp = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
const MIRROR_N = new THREE.Vector3();

/**
 * The player: one body, one set of hearts, armor and spins, and whichever hero is in control. Jason's
 * moves live here; other heroes take over the controls through their own moveset (Atalanta's is in
 * `heroes/atalanta.ts`) while sharing the body, the physics step and the hit rules below.
 */
export class Player {
  readonly body: Body;
  /** Jason's model (always built: he's in every level, playing or following). */
  readonly jason: JasonModel;
  /** The hero in control, and every hero this level lets the player switch to (in switch order). */
  hero: HeroId;
  /** Every hero on this level, including any who only join partway through (see `LevelDef.joins`). */
  private readonly cast: HeroId[];
  /** Atalanta's moves and model (built only on levels where she can play). */
  readonly ata: AtalantaMoves | null;
  /** General Brennus's moves, model and cannon (built only on his own levels). */
  readonly bren: BrennusMoves | null;
  /** Her arrows in flight (they keep flying after a switch). */
  readonly arrows: Arrows | null;
  /** The hero not in control, walking along behind. */
  private follower: Follower | null = null;
  /** Seconds before the next switch is allowed. */
  swapCd = 0;
  facing: number;
  hearts: number;
  invuln = 0;
  private jumps = 0;
  private coyote = 0;
  private jumpBuf = 0;
  private cut = false;
  private dashT = 0;
  private dashCd = 0;
  private airDashed = false;
  private dashHit = new Set<unknown>();
  /** Dash energy cells left: one per dash, refilled at checkpoints and by energy pickups. */
  energy: number = PLAYER.dashEnergy;
  pounding = false;
  private poundHang = 0;
  /** Seconds left on the current spin (Jason) or spinning kick (Atalanta). */
  private spinT = 0;
  private spinHit = new Set<unknown>();
  /** Spins left before the long recharge. */
  spins: number = PLAYER.spinCharges;
  /** Armor points left (Armor Plating), the time since one was last lost, and the shield bubble. */
  armor = 0;
  private armorT = 0;
  private shield: THREE.Mesh | null = null;
  private shieldT = 0;
  /** Seconds left recharging spins (0 = not recharging). */
  private spinReloadT = 0;
  private spinReloadMax = 1;
  private sinceSpin = 99;
  private shootCd = 0;
  private shootPose = 0;
  /** Shots left in the clip; the clip refills after a reload. */
  ammo: number;
  /** Seconds left on the current reload (0 = not reloading). */
  reloadT = 0;
  /** 0..1 fireball charge while BLAST is held. */
  charge = 0;
  private holdT = 0;
  private wasHeld = false;
  /** Seconds a tap stays queued while the blaster cools down. */
  private shootBuf = 0;
  /** A grapple zip in progress: where Jason left from, where he lands, where the rope hooks on, and how far along it is (0..1). */
  private zip: { from: THREE.Vector3; to: THREE.Vector3; hook: THREE.Vector3; k: number; time: number } | null = null;
  /** Seconds left wading through quicksand (refreshed every frame he stands in it), and how far he has sunk. */
  private mudT = 0;
  sink = 0;
  private sinceShot = 99;
  private chargedFx = false;
  private blinkT = 2;
  gliding = false;
  squash = 0;
  phase = 0;
  renderY: number;
  private safe = new THREE.Vector3();
  private safeT = 0;
  private wasGrounded = true;
  airTime = 0;
  /** Horizontal velocity the hero is steering (the body's own is reset by collisions). */
  vx = 0;
  vz = 0;
  down = false;
  carrying: THREE.Object3D | null = null;
  readonly fx: JasonFx;
  /** Seconds since the last hit; the HUD uses it to show hearts. */
  sinceHurt = 99;
  /** Lets a cutscene pose the playing hero's model (called after the normal animation each frame). */
  pose: ((m: HeroModel, dt: number) => void) | null = null;
  /** Jason's Mirror Shield (from Medusa's Labyrinth on): raised while SPIN is held on the ground. */
  mirrorUp = false;
  /** Seconds SPIN has been held on the ground so far (a tap spins, a hold raises the shield), or -1. */
  private spinHold = -1;
  private mirror: MirrorShieldModel | null = null;
  private mirrorFlash = 0;
  private glintT = 0;
  /** MEDUSA's gaze: seconds each hero has left as stone, and then safe from the next gaze. */
  private stoneT = new Map<HeroId, number>();
  private stoneSafe = new Map<HeroId, number>();
  private stoneHinted = false;

  constructor(
    private world: World,
    x: number,
    y: number,
    z: number,
    facing: number,
  ) {
    this.body = makeBody(x, y, z, PLAYER.radius, PLAYER.height);
    this.body.grounded = true;
    this.jason = makeJason();
    dressJason(this.jason, world.save.upgrades, this.weapon);
    this.cast = heroRoster(world.def.heroes, heroDev);
    this.hero = this.roster[0];
    const withAtalanta = this.cast.includes('atalanta');
    this.ata = withAtalanta ? new AtalantaMoves(this, world) : null;
    this.arrows = withAtalanta ? new Arrows(world) : null;
    this.bren = this.roster.includes('brennus') ? new BrennusMoves(this, world) : null;
    this.body.h = HEROES[this.hero].height;
    this.facing = facing;
    this.hearts = world.save.maxHearts;
    this.energy = this.energyMax;
    this.spins = this.spinMax;
    this.armor = this.armorMax;
    this.ammo = this.clipSize;
    this.renderY = y;
    this.safe.set(x, y, z);
    world.scene.add(this.jason.root);
    if (this.ata) world.scene.add(this.ata.model.root);
    if (this.bren) world.scene.add(this.bren.model.root);
    this.fx = new JasonFx(world.scene);
    this.showHero();
  }

  /**
   * The heroes the player can switch between right now, in switch order: the level's heroes, minus
   * any whose join flag isn't set yet (a developer's hero list ignores the join flags).
   */
  get roster(): HeroId[] {
    const joins = this.world.def.joins ?? {};
    if (heroDev.heroes?.length) return this.cast;
    return this.cast.filter((h) => {
      const flag = joins[h];
      return !flag || this.world.hasFlag(flag);
    });
  }

  /** Where the hero who isn't playing stands right now (null on single-hero levels). */
  get partner(): { x: number; y: number; z: number; facing: number } | null {
    return this.nextHero && this.follower ? this.follower.spot : null;
  }

  /**
   * A hero joins (their join flag was just set): they appear beside the playing hero, ready to follow,
   * or at the given spot. The HUD then shows the switch button.
   */
  heroJoined(at?: THREE.Vector3) {
    this.showHero();
    const b = this.body;
    if (at) this.follower?.place(at.x, at.y, at.z, this.facing);
    else this.follower?.placeNear(b.x, b.y, b.z, this.facing);
    this.world.hooks.hud();
  }

  /** Heroes who haven't joined yet wait at the spot given for them (Atalanta by her skiff), or stay hidden. */
  showWaiting(at: (id: HeroId) => THREE.Vector3 | undefined) {
    const now = this.roster;
    for (const id of this.cast) {
      if (now.includes(id)) continue;
      const m = this.modelOf(id);
      const p = at(id);
      m.root.visible = !!p;
      if (p) m.root.position.copy(p);
    }
  }

  /** The model of any hero on this level (for cutscenes). */
  heroModel(id: HeroId): HeroModel {
    return this.modelOf(id);
  }

  /** The playing hero's model. */
  get model(): HeroModel {
    return this.modelOf(this.hero);
  }

  private modelOf(id: HeroId): HeroModel {
    if (id === 'brennus' && this.bren) return this.bren.model;
    return id === 'atalanta' && this.ata ? this.ata.model : this.jason;
  }

  /** Shows the playing hero, and hands the other one (if any) to the follower. */
  private showHero() {
    // Jason's model is always built; on a level without him (General Brennus's own) it stays hidden.
    if (!this.cast.includes('jason')) this.jason.root.visible = false;
    for (const id of this.cast) this.modelOf(id).root.visible = id === this.hero;
    const other = nextHero(this.roster, this.hero);
    if (!other) return;
    const m = this.modelOf(other);
    m.root.visible = true;
    if (this.follower) this.follower.swap(m, other);
    else {
      this.follower = new Follower(this.world, m, other);
      const b = this.body;
      this.follower.placeNear(b.x, b.y, b.z, this.facing);
    }
  }

  /** Why switching heroes isn't possible right now (null: it is). */
  switchBlocked(): SwitchBlock | null {
    const b = this.body;
    return switchBlock({
      roster: this.roster,
      current: this.hero,
      cooldown: this.swapCd,
      grounded: b.grounded || this.coyote > 0,
      locked: this.down || this.world.cutscene,
      busy: this.zip !== null || this.dashT > 0 || this.pounding || (this.ata?.busy ?? false) || (this.bren?.busy ?? false),
      cramped: this.ata?.cramped ?? false,
    });
  }

  /** The hero a switch would change to (for the HUD), or null on single-hero levels. */
  get nextHero(): HeroId | null {
    return nextHero(this.roster, this.hero);
  }

  /** 0..1 while the switch cools down (1 = ready). */
  get swapReady() {
    return 1 - Math.max(0, this.swapCd) / HERO_SWITCH.cooldown;
  }

  /**
   * Switches to the next hero, right where the current one stands, in a flash of light. The hero who
   * was playing steps aside and follows along. Hearts, bolts, armor and spins are shared.
   */
  switchHero(): boolean {
    const next = this.nextHero;
    if (!next || this.switchBlocked()) {
      if (next && !this.down && !this.world.cutscene) audio.play('empty');
      return false;
    }
    const w = this.world;
    const b = this.body;
    const was = this.hero;
    this.cancelCharge();
    this.mirrorUp = false;
    this.spinHold = -1;
    this.ata?.reset();
    this.bren?.reset();
    // Jason reloads while he follows along, so his clip is full when he's back.
    this.ammo = this.clipSize;
    this.reloadT = 0;
    this.hero = next;
    this.swapCd = HERO_SWITCH.cooldown;
    b.h = HEROES[next].height;
    this.showHero();
    this.follower?.placeNear(b.x, b.y, b.z, this.facing);
    this.refreshGear();
    const color = HEROES[next].color;
    w.particles.emit(b.x, b.y + 1, b.z, { count: 40, color: '#ffffff', speed: 6, life: 0.55, size: 0.55, up: 1.5 });
    w.particles.emit(b.x, b.y + 1, b.z, { count: 24, color, speed: 4, life: 0.7, size: 0.5, up: 2 });
    w.rings.burst(b.x, b.y + 0.05, b.z, 4.5, color, 0.4);
    w.flash(b.x, b.y + 1.4, b.z, color, 35, 0.3);
    this.squash = 0.2;
    audio.play('charged', was === 'jason' ? 1.25 : 0.9);
    audio.play('djump', 1.4, 0.6);
    haptic('light');
    // The playing hero's droid takes the lead (chapter 3: LUX with Jason, IRIS with Atalanta).
    w.refreshCompanions();
    w.hooks.hud();
    return true;
  }

  /** Puts on the gear for any newly bought upgrades, with a little sparkle when something changed. */
  refreshGear() {
    if (this.ata?.dress()) this.world.hooks.hud();
    const before = this.jason.gearKey;
    dressJason(this.jason, this.world.save.upgrades, this.weapon);
    if (this.jason.gearKey === before || this.hero !== 'jason') return;
    const b = this.body;
    this.world.particles.emit(b.x, b.y + 1, b.z, { count: 26, color: '#ffd166', speed: 4, life: 0.6, size: 0.45, up: 2 });
    this.squash = 0.25;
  }

  get zipping() {
    return this.zip !== null;
  }

  /** Fires the grapple at an anchor's hook and zips over to land on `land`. */
  grappleTo(land: THREE.Vector3, hook: THREE.Vector3) {
    if (this.zip || this.down) return;
    const b = this.body;
    const from = new THREE.Vector3(b.x, b.y, b.z);
    const to = land.clone().add(new THREE.Vector3(0, 0.05, 0));
    this.zip = { from, to, hook: hook.clone(), k: 0, time: (GRAPPLE.time + from.distanceTo(to) * GRAPPLE.timePerUnit) * (this.world.save.upgrades.grapple ? GEAR.grappleZip : 1) };
    this.facing = Math.atan2(to.x - b.x, to.z - b.z);
    this.pounding = false;
    this.dashT = 0;
    this.sink = 0;
    this.shootPose = 0.5;
    audio.play('zap', 1.8);
    audio.play('dash', 1.3);
    haptic('light');
  }

  /** The zip itself: an arc from Jason to the anchor, with the rope drawn from his hand to the hook. */
  private updateZip(dt: number) {
    const z = this.zip;
    if (!z) return;
    const b = this.body;
    z.k = Math.min(1, z.k + dt / z.time);
    const e = z.k * z.k * (3 - 2 * z.k);
    const lift = Math.min(3, z.from.distanceTo(z.to) * 0.12) * Math.sin(z.k * Math.PI);
    b.x = z.from.x + (z.to.x - z.from.x) * e;
    b.z = z.from.z + (z.to.z - z.from.z) * e;
    b.y = z.from.y + (z.to.y - z.from.y) * e + lift;
    b.vx = 0;
    b.vz = 0;
    b.vy = 0;
    this.vx = 0;
    this.vz = 0;
    const w = this.world;
    const hand = new THREE.Vector3(b.x + Math.sin(this.facing) * 0.6, b.y + 1.2, b.z + Math.cos(this.facing) * 0.6);
    if (z.k < 0.92) w.beams.zap(hand, z.hook, '#7fe6ff');
    if (Math.random() < 0.6) w.particles.emit(b.x, b.y + 0.9, b.z, { count: 1, color: '#bff4ff', speed: 0.6, life: 0.35, size: 0.4, gravity: 0 });
    if (z.k >= 1) {
      this.zip = null;
      b.grounded = false;
      this.jumps = 1;
      this.airDashed = false;
      this.cut = true;
      w.particles.emit(b.x, b.y + 0.2, b.z, { count: 10, color: '#ffffff', speed: 2.5, life: 0.35, size: 0.4, gravity: 2 });
      audio.play('land');
    }
    this.animate(dt, 0.6);
  }

  /** Called every frame Jason stands in quicksand: he slows down and slowly sinks (faster if he stands still). */
  wade(dt: number) {
    this.mudT = 0.12;
    const moving = Math.hypot(this.vx, this.vz) > 1;
    this.sink += dt * (moving ? 0.45 : 1);
    if (Math.random() < 0.25) this.world.particles.emit(this.body.x, this.body.y + 0.1, this.body.z, { count: 1, color: '#c8a66a', speed: 1, life: 0.4, size: 0.4, up: 1 });
    if (this.sink >= OUTDOOR.sinkTime) {
      this.sink = 0;
      this.world.hooks.toast('Quicksand! Keep moving, or jump out of it fast.', 'bolt');
      this.fellOff();
    }
  }

  has(a: Ability) {
    return this.world.save.abilities.includes(a);
  }

  /* ---------------- gear bought on Gaia Nova ---------------- */

  /** Dash energy cells (Dash Cell adds one per level). */
  get energyMax() {
    return PLAYER.dashEnergy + (this.world.save.upgrades.dashCell ?? 0);
  }

  /** Spins in a row before the long recharge (Spin Charge adds one). */
  get spinMax() {
    return PLAYER.spinCharges + (this.world.save.upgrades.spinCharge ?? 0);
  }

  /** Armor points (Armor Plating): each blocks one hit. */
  get armorMax() {
    return this.world.save.upgrades.armor ?? 0;
  }

  /** How far the grapple reaches, in cells (Grapple Range adds a little). */
  get grappleRange() {
    // Only Jason has the hook: with anyone else, no anchor is ever in reach.
    if (this.hero !== 'jason') return 0;
    return GRAPPLE.range + (this.world.save.upgrades.grapple ?? 0) * GEAR.grappleCells;
  }

  /** After a shop purchase: new armor, dash cells and spins are ready to use straight away. */
  refill() {
    this.rechargeArmor();
    this.gainEnergy(99);
    if (this.spinReloadT <= 0) this.spins = this.spinMax;
    this.world.hooks.hud();
  }

  /** Fills the armor back up (checkpoints, getting back up). */
  rechargeArmor() {
    if (this.armor >= this.armorMax) return;
    this.armor = this.armorMax;
    this.shieldFx(0.8);
    this.world.hooks.hud();
  }

  /** Armor Plating takes the hit instead of a heart: a bright shield flash, and a moment of safety. */
  private absorb(fromX?: number, fromZ?: number) {
    this.armor -= 1;
    this.armorT = 0;
    this.invuln = PLAYER.invuln;
    this.sinceHurt = 0;
    this.shieldFx(1.6);
    audio.play('zap', 0.7);
    haptic('medium');
    this.world.shake(0.2);
    const b = this.body;
    this.world.particles.emit(b.x, b.y + 1, b.z, { count: 18, color: '#9fe0ff', speed: 5, life: 0.45, size: 0.45 });
    if (fromX !== undefined && fromZ !== undefined) {
      const d = Math.hypot(b.x - fromX, b.z - fromZ) || 1;
      this.vx = ((b.x - fromX) / d) * PLAYER.knockback * 0.6;
      this.vz = ((b.z - fromZ) / d) * PLAYER.knockback * 0.6;
    }
    this.world.hooks.hud();
  }

  /** Shows the shield bubble around Jason for a moment (`power` sets how bright it starts). */
  private shieldFx(power: number) {
    if (!this.shield) {
      const m = new THREE.MeshBasicMaterial({ color: '#7fd4ff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      this.shield = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 2), m);
      this.world.scene.add(this.shield);
    }
    this.shieldT = power;
  }

  /** Armor slowly comes back while Jason stays out of trouble; the bubble fades and shimmers. */
  private updateArmor(dt: number) {
    if (this.armor < this.armorMax) {
      this.armorT += dt;
      if (this.armorT >= GEAR.armorRecharge) {
        this.armorT = 0;
        this.armor += 1;
        this.shieldFx(0.8);
        audio.play('charged', 1.3);
        this.world.hooks.hud();
      }
    }
    if (!this.shield) return;
    this.shieldT = Math.max(0, this.shieldT - dt * 1.6);
    const m = this.shield.material as THREE.MeshBasicMaterial;
    m.opacity = Math.min(0.45, this.shieldT * 0.3);
    this.shield.visible = m.opacity > 0.01;
    if (this.shield.visible) {
      const b = this.body;
      this.shield.position.set(b.x, this.renderY + 0.95, b.z);
      this.shield.rotation.y += dt * 2;
      this.shield.scale.setScalar(1 + (1.6 - Math.min(1.6, this.shieldT)) * 0.12);
    }
  }

  get clipSize() {
    return PLAYER.clip + (this.world.save.upgrades.clip ?? 0) * 2;
  }

  /** Jason's blaster is reloading (enemies take the chance to rush in). Atalanta's bow never reloads. */
  get reloading() {
    return this.hero === 'jason' && this.reloadT > 0;
  }

  /** 0..1 while reloading. */
  get reloadProgress() {
    return this.reloadT > 0 ? 1 - this.reloadT / this.reloadTime : 0;
  }

  private get reloadTime() {
    return PLAYER.reloadTime * (1 - (this.world.save.upgrades.rapid ?? 0) * 0.2);
  }

  /** True while a ground spin (or Atalanta's spinning kick) is whirling, and guarding the hero. */
  get spinning() {
    return this.spinT > 0;
  }

  /** Dashing (Jason) or sliding (Atalanta): enemies bumped into don't hurt. */
  get dashing() {
    return this.dashT > 0 || (this.ata?.sliding ?? false) || (this.bren?.charging ?? false);
  }

  /** True if General Brennus's raised shield (or Jason's Mirror Shield) faces a hit coming from (x, z): shots bounce off it. */
  shieldBlocks(x: number, z: number): boolean {
    if (this.hero === 'jason' && this.mirrorUp) {
      const dx = x - this.body.x;
      const dz = z - this.body.z;
      const d = Math.hypot(dx, dz);
      return d < 0.05 || (dx * Math.sin(this.facing) + dz * Math.cos(this.facing)) / d > 0.3;
    }
    return this.hero === 'brennus' && !!this.bren?.blocks(x, z);
  }

  /** A hit blocked by a shield: Brennus's clangs, Jason's Mirror Shield rings and flashes. */
  clang() {
    if (this.hero === 'brennus') {
      this.bren?.clang();
      return;
    }
    this.mirrorFlash = 1;
    const b = this.body;
    const f = this.facing;
    this.world.particles.emit(b.x + Math.sin(f) * 0.8, b.y + 1.1, b.z + Math.cos(f) * 0.8, { count: 12, color: '#bff4ff', speed: 5, life: 0.3, size: 0.4 });
    audio.play('shield', 1.6);
  }

  /**
   * The facing of Jason's raised Mirror Shield as a flat unit vector (gaze beams that hit it from the
   * front bounce off), or null when it isn't up.
   */
  mirrorNormal(): THREE.Vector3 | null {
    if (this.hero !== 'jason' || !this.mirrorUp || this.stoneLeft() > 0) return null;
    return MIRROR_N.set(Math.sin(this.facing), 0, Math.cos(this.facing));
  }

  /** A beam is bouncing off the Mirror Shield: it shines (and rings now and then). */
  mirrorGlint() {
    this.mirrorFlash = Math.max(this.mirrorFlash, 0.8);
    if (this.glintT > 0) return;
    this.glintT = 0.45;
    audio.play('charged', 2.2, 0.35);
  }

  /** Raises the Mirror Shield (or, with `up` false, just straps it on Jason's back). */
  private raiseMirror(up = true) {
    if (up) {
      this.mirrorUp = true;
      audio.play('shield', 1.3);
    }
    if (!this.mirror) {
      this.mirror = makeMirrorShield();
      this.mirror.group.position.set(0, 1.05, 0.5);
      this.jason.body.add(this.mirror.group);
    }
  }

  /** Seconds the hero (the playing one by default) has left as stone. */
  stoneLeft(id: HeroId = this.hero): number {
    return this.stoneT.get(id) ?? 0;
  }

  /**
   * MEDUSA's gaze caught the playing hero: they turn to stone for a moment (no damage), unless they
   * only just broke free. Returns true if they were petrified.
   */
  petrify(): boolean {
    const id = this.hero;
    if (this.down || this.world.cutscene || this.zip || this.stoneT.has(id) || this.stoneSafe.has(id)) return false;
    this.stoneT.set(id, GAZE.stone);
    this.mirrorUp = false;
    this.spinHold = -1;
    this.dashT = 0;
    this.pounding = false;
    this.cancelCharge();
    this.ata?.reset();
    this.bren?.reset();
    stoneSkin(this.model.root, true);
    const b = this.body;
    const w = this.world;
    w.particles.emit(b.x, b.y + 1, b.z, { count: 24, color: '#c8d0c8', speed: 4, life: 0.6, size: 0.5, up: 1 });
    w.rings.burst(b.x, b.y + 0.05, b.z, 2.5, '#7dff9a', 0.3);
    audio.play('shield', 0.55);
    haptic('medium');
    w.shake(0.15);
    if (!this.stoneHinted) {
      this.stoneHinted = true;
      if (this.nextHero) w.hooks.toast('Turned to stone! It wears off in a moment, or tap SWITCH to play the other hero.', 'bolt');
      else w.hooks.toast('Turned to stone! Hold still, it wears off in a moment.', 'bolt');
    }
    w.hooks.hud();
    return true;
  }

  /** Counts the stone down for every hero; a hero who breaks free shakes off a shower of stone chips. */
  private tickStone(dt: number) {
    this.glintT -= dt;
    for (const [id, t] of this.stoneSafe) {
      if (t - dt <= 0) this.stoneSafe.delete(id);
      else this.stoneSafe.set(id, t - dt);
    }
    for (const [id, t] of this.stoneT) {
      if (t - dt > 0) {
        this.stoneT.set(id, t - dt);
        continue;
      }
      this.stoneT.delete(id);
      this.stoneSafe.set(id, GAZE.safe);
      stoneSkin(this.modelOf(id).root, false);
      const at = this.modelOf(id).root.position;
      this.world.particles.emit(at.x, at.y + 1, at.z, { count: 30, color: '#9aa39a', speed: 6, life: 0.6, size: 0.45, up: 3 });
      audio.play('land', 1.4);
    }
  }

  /**
   * Starts a spin (Jason) or a spinning kick (Atalanta) from the shared set of charges. Returns false
   * (with a dud sound) when they are all used up.
   */
  startSpin(time = PLAYER.spinTime): boolean {
    if (this.spinT > 0) return false;
    if (this.spins <= 0) {
      audio.play('empty');
      return false;
    }
    this.spins -= 1;
    this.sinceSpin = 0;
    this.spinReloadT = 0;
    if (this.spins === 0) this.startSpinReload();
    this.spinT = time;
    this.fx.spin(time);
    this.spinHit.clear();
    audio.play('spin');
    this.world.hooks.hud();
    return true;
  }

  /** Spin timers: the whirl itself (hitting what it touches) and the recharge of used charges. */
  tickSpins(dt: number) {
    const w = this.world;
    this.sinceSpin += dt;
    if (this.spinReloadT > 0) {
      this.spinReloadT -= dt;
      if (this.spinReloadT <= 0) {
        this.spinReloadT = 0;
        this.spins = this.spinMax;
        audio.play('reload', 1.6);
        w.hooks.hud();
      }
    } else if (this.spins < this.spinMax && this.sinceSpin > PLAYER.spinTopUp) {
      this.startSpinReload();
    }
    if (this.spinT > 0) {
      this.spinT -= dt;
      w.spinAttack(this, this.spinHit);
    }
  }

  /** Seconds left on the current spin or kick. */
  get spinLeft() {
    return Math.max(0, this.spinT);
  }

  /** True while wading through quicksand (it slows every hero down). */
  get inMud() {
    return this.mudT > 0;
  }

  /** The stick turned into a world direction (relative to the camera) and how hard it is pushed. */
  moveInput(input: Input): { wx: number; wz: number; mag: number } {
    const yaw = this.world.cameraYaw;
    const mx = input.moveX;
    const mz = input.moveZ;
    let wx = Math.cos(yaw) * mx + Math.sin(yaw) * mz;
    let wz = -Math.sin(yaw) * mx + Math.cos(yaw) * mz;
    const len = Math.hypot(wx, wz);
    if (len > 0.01) {
      wx /= len;
      wz /= len;
    }
    return { wx, wz, mag: Math.min(1, len) };
  }

  /** 0..1 while the spins recharge. */
  get spinReloadProgress() {
    return this.spinReloadT > 0 ? 1 - this.spinReloadT / this.spinReloadMax : 0;
  }

  private startSpinReload() {
    const missing = this.spinMax - this.spins;
    this.spinReloadMax = (PLAYER.spinReload * missing) / this.spinMax;
    this.spinReloadT = this.spinReloadMax;
  }

  /** Tops up dash energy; returns true if anything was added. */
  gainEnergy(n: number): boolean {
    if (this.energy >= this.energyMax) return false;
    this.energy = Math.min(this.energyMax, this.energy + n);
    this.world.hooks.hud();
    return true;
  }

  private startReload() {
    if (this.reloadT > 0 || this.ammo >= this.clipSize) return;
    this.reloadT = this.reloadTime;
    audio.play('reload', 0.8);
    this.world.hooks.hud();
  }

  get pos() {
    return tmp.set(this.body.x, this.body.y, this.body.z);
  }

  /** Point near the chest used by enemies to aim at Jason. */
  chest(out = new THREE.Vector3()) {
    return out.set(this.body.x, this.body.y + 1.05, this.body.z);
  }

  /** `hazard` damage (lasers, zap floors, lava) gets through a spin; enemy and boss attacks do not. */
  hurt(n: number, fromX?: number, fromZ?: number, hazard = false) {
    if (this.invuln > 0 || this.down || this.world.cutscene) return;
    if (this.spinT > 0 && !hazard) {
      // The spin guards Jason: the attack glances off in a spray of sparks.
      audio.play('zap', 2.4);
      this.world.particles.emit(this.body.x, this.body.y + 1, this.body.z, { count: 14, color: '#bff4ff', speed: 6, life: 0.35, size: 0.4 });
      return;
    }
    if (!hazard && fromX !== undefined && fromZ !== undefined && this.shieldBlocks(fromX, fromZ)) {
      // Brennus's shield (or Jason's Mirror Shield) takes it: a clang, and a little slide back.
      this.clang();
      const d = Math.hypot(this.body.x - fromX, this.body.z - fromZ) || 1;
      this.vx = ((this.body.x - fromX) / d) * 3;
      this.vz = ((this.body.z - fromZ) / d) * 3;
      this.invuln = 0.3;
      return;
    }
    if (this.armor > 0) {
      this.absorb(fromX, fromZ);
      return;
    }
    this.armorT = 0;
    this.hearts = Math.max(0, this.hearts - n);
    this.invuln = PLAYER.invuln;
    this.sinceHurt = 0;
    audio.play('hurt');
    haptic('heavy');
    this.world.shake(0.35);
    if (fromX !== undefined && fromZ !== undefined) {
      const dx = this.body.x - fromX;
      const dz = this.body.z - fromZ;
      const d = Math.hypot(dx, dz) || 1;
      this.body.vx = (dx / d) * PLAYER.knockback;
      this.body.vz = (dz / d) * PLAYER.knockback;
      this.vx = this.body.vx;
      this.vz = this.body.vz;
      this.body.vy = Math.max(this.body.vy, 6);
    }
    this.world.particles.emit(this.body.x, this.body.y + 1, this.body.z, { count: 16, color: '#ff5e6a', speed: 5, life: 0.5, size: 0.45 });
    this.world.hooks.hud();
    if (this.hearts <= 0) {
      this.down = true;
      this.world.playerDown();
    }
  }

  heal(n: number) {
    this.hearts = Math.min(this.world.save.maxHearts, this.hearts + n);
    this.world.hooks.hud();
  }

  teleport(x: number, y: number, z: number) {
    this.body.x = x;
    this.body.y = y;
    this.body.z = z;
    this.body.vx = this.body.vy = this.body.vz = 0;
    this.vx = this.vz = 0;
    this.renderY = y;
    this.safe.set(x, y, z);
    this.pounding = false;
    this.dashT = 0;
    this.mirrorUp = false;
    this.spinHold = -1;
    this.ata?.reset();
    this.bren?.reset();
    this.follower?.placeNear(x, y, z, this.facing);
  }

  /** Throws Jason upward (bounce pads, steam vents); the double jump is available again afterwards. */
  launch(vy: number) {
    this.body.vy = vy;
    this.body.grounded = false;
    this.pounding = false;
    this.jumps = 1;
    this.cut = true;
    this.coyote = 0;
    this.wasGrounded = false;
    this.ata?.launched();
    this.bren?.launched();
  }

  revive() {
    this.down = false;
    this.hearts = this.world.save.maxHearts;
    this.ammo = this.clipSize;
    this.reloadT = 0;
    this.charge = 0;
    this.energy = this.energyMax;
    this.spins = this.spinMax;
    this.armor = this.armorMax;
    this.armorT = 0;
    this.spinReloadT = 0;
    this.invuln = 1.5;
    this.world.hooks.hud();
  }

  private fellOff() {
    audio.play('hurt');
    this.world.particles.emit(this.body.x, this.body.y + 0.5, this.body.z, { count: 20, color: this.world.theme.hazard, speed: 6, life: 0.6, up: 4 });
    this.invuln = 0;
    this.hurt(1, undefined, undefined, true);
    if (this.down) return;
    this.teleport(this.safe.x, this.safe.y + 0.1, this.safe.z);
    this.invuln = PLAYER.invuln;
  }

  update(dt: number, input: Input) {
    const w = this.world;
    const b = this.body;
    this.invuln = Math.max(0, this.invuln - dt);
    this.sinceHurt += dt;
    this.swapCd -= dt;
    this.updateArmor(dt);
    this.arrows?.update(dt);
    this.follower?.update(dt, this);
    this.tickStone(dt);
    this.mirrorFlash = Math.max(0, this.mirrorFlash - dt * 3);
    if (this.down || w.cutscene) {
      this.cancelCharge();
      this.mirrorUp = false;
      this.spinHold = -1;
      this.zip = null;
      this.ata?.reset();
      this.bren?.reset();
      if (this.ata && this.hero === 'atalanta') this.ata.animate(dt, 0);
      else if (this.bren && this.hero === 'brennus') {
        this.bren.cannon.update(dt);
        this.bren.animate(dt, 0);
      } else this.animate(dt, 0);
      return;
    }
    if (this.zip) {
      this.updateZip(dt);
      return;
    }
    // Quicksand slows the hero down while in it; out of it, they climb back up.
    this.mudT -= dt;
    if (this.mudT <= 0) this.sink = Math.max(0, this.sink - dt * 2);

    if (input.take('swap')) this.switchHero();
    // Turned to stone by MEDUSA's gaze: frozen in place (gravity still pulls) until it wears off,
    // though the player can switch to the other hero meanwhile.
    if (this.stoneLeft() > 0) {
      this.vx = 0;
      this.vz = 0;
      for (const k of ['jump', 'spin', 'dash', 'shoot', 'weapon'] as const) input.take(k);
      if (this.stepBody(dt, () => {})) this.placeModel(this.model, dt, this.sink * 0.35);
      return;
    }
    if (this.ata && this.hero === 'atalanta') {
      this.ata.update(dt, input);
      return;
    }
    if (this.bren && this.hero === 'brennus') {
      this.bren.update(dt, input);
      return;
    }

    // Camera-relative movement.
    const { wx, wz, mag } = this.moveInput(input);

    const ground = b.grounded ? b.ground : null;
    const onIce = ground?.kind === 'ice';
    const accel = b.grounded ? (onIce ? PLAYER.iceAccel : PLAYER.accel) : PLAYER.airAccel;
    const speed = (this.mirrorUp ? MIRROR.speed : PLAYER.speed) * (this.carrying ? 0.85 : 1) * (this.mudT > 0 ? OUTDOOR.sandSpeed : 1);

    if (this.dashT > 0) {
      this.dashT -= dt;
      this.vx = Math.sin(this.facing) * PLAYER.dashSpeed;
      this.vz = Math.cos(this.facing) * PLAYER.dashSpeed;
      b.vy = Math.max(b.vy, -1);
      if (Math.random() < 0.8) w.particles.emit(b.x, b.y + 0.9, b.z, { count: 2, color: '#7fe6ff', speed: 1, life: 0.35, size: 0.5, gravity: 0 });
      // A dash is a ram: anything in the way takes a heavy hit.
      w.dashAttack(this, this.dashHit);
    } else if (this.pounding) {
      this.vx = 0;
      this.vz = 0;
    } else {
      const before = this.facing;
      this.steer(dt, wx, wz, mag, speed, accel);
      // Behind the Mirror Shield he turns slowly, so it's easy to aim a bounced beam.
      if (this.mirrorUp && mag > 0.1) this.facing = dampAngle(before, Math.atan2(wx, wz), MIRROR.turn, dt);
    }

    // Timers.
    this.coyote = b.grounded ? PLAYER.coyote : this.coyote - dt;
    this.jumpBuf -= dt;
    this.dashCd -= dt;
    this.shootCd -= dt;
    this.shootPose = Math.max(0, this.shootPose - dt);
    if (b.grounded) {
      this.jumps = 0;
      this.airDashed = false;
    }

    // Jump / double jump / glide.
    if (input.take('jump')) this.jumpBuf = PLAYER.jumpBuffer;
    if (this.jumpBuf > 0 && !this.pounding) {
      if (this.coyote > 0 && this.jumps === 0) {
        b.vy = PLAYER.jumpV;
        this.jumps = 1;
        this.coyote = 0;
        this.jumpBuf = 0;
        this.cut = false;
        audio.play('jump');
        w.particles.emit(b.x, b.y + 0.1, b.z, { count: 8, color: '#ffffff', speed: 2.5, life: 0.35, size: 0.4, gravity: 2 });
      } else if (!b.grounded && this.jumps < 2 && this.has('doubleJump')) {
        b.vy = PLAYER.doubleJumpV;
        this.jumps = 2;
        this.jumpBuf = 0;
        this.cut = true;
        audio.play('djump');
        haptic('light');
        w.particles.emit(b.x, b.y + 0.4, b.z, { count: 18, color: '#7fe6ff', speed: 4, life: 0.45, size: 0.5, gravity: 4 });
      }
    }
    if (!input.isHeld('jump') && b.vy > 0 && !this.cut && this.jumps === 1) {
      b.vy *= PLAYER.jumpCut;
      this.cut = true;
    }
    this.gliding = !b.grounded && b.vy < 0 && input.isHeld('jump') && this.has('glide') && !this.pounding && this.dashT <= 0;
    if (this.gliding) {
      b.vy = Math.max(b.vy, -PLAYER.glideFall);
      if (Math.random() < 0.15) audio.play('glide');
    }

    // Dash: each one burns a cell of energy.
    if (input.take('dash') && this.has('dash') && this.dashCd <= 0 && !this.pounding && (b.grounded || !this.airDashed)) {
      if (this.energy < 1) {
        audio.play('empty');
        this.dashCd = 0.3;
        w.hooks.dashEmpty();
      } else {
        this.energy -= 1;
        this.dashT = PLAYER.dashTime;
        this.dashCd = PLAYER.dashCooldown;
        this.dashHit.clear();
        if (!b.grounded) this.airDashed = true;
        if (mag > 0.1) this.facing = Math.atan2(wx, wz);
        audio.play('dash');
        haptic('light');
        w.hooks.hud();
      }
    }

    // Spin (ground, from a set of three) / ground pound (air, always available for switches).
    // With the Mirror Shield, a tap of SPIN on the ground still spins, and holding it raises the shield.
    if (input.take('spin') && !this.pounding) {
      if (b.grounded || this.airTime < 0.05) {
        if (this.has('mirror')) this.spinHold = 0;
        else this.startSpin();
      } else if (b.y > this.groundBelow() + 0.9) {
        this.pounding = true;
        this.poundHang = POUND_HANG;
        this.dashT = 0;
        audio.play('spin', 1.4);
      }
    }
    if (this.spinHold >= 0) {
      this.spinHold += dt;
      if (!input.isHeld('spin')) {
        this.spinHold = -1;
        this.startSpin();
      } else if (this.spinHold >= MIRROR.hold) {
        this.spinHold = -1;
        this.raiseMirror();
      }
    } else if (!this.mirrorUp && input.isHeld('spin') && this.has('mirror') && b.grounded && this.spinT <= 0 && !this.pounding) {
      // SPIN still held from before (landing, or breaking out of stone): the shield comes straight up.
      this.raiseMirror();
    }
    if (this.mirrorUp && (!input.isHeld('spin') || !b.grounded)) this.mirrorUp = false;
    this.tickSpins(dt);
    if (this.pounding) {
      if (this.poundHang > 0) {
        this.poundHang -= dt;
        b.vy = 2;
      } else {
        b.vy = -PLAYER.poundSpeed;
      }
    }

    // Blaster: tap to shoot (limited clip, then reload); hold to charge a big fireball. X / the weapon button switches weapons.
    if (input.take('weapon')) this.cycleWeapon();
    // Both hands are busy behind the Mirror Shield.
    if (this.mirrorUp) {
      this.cancelCharge();
      input.take('shoot');
    } else this.updateBlaster(dt, input);

    const ok = this.stepBody(dt, (impact) => {
      if (this.pounding) {
        this.pounding = false;
        w.groundPound(this);
      } else if (impact > 8) {
        audio.play('land');
        this.squash = 0.12;
        w.particles.emit(b.x, b.y + 0.1, b.z, { count: 6, color: '#ffffff', speed: 2, life: 0.3, size: 0.35, gravity: 1 });
      }
    });
    if (!ok) return;
    this.animate(dt, Math.hypot(this.vx, this.vz) / PLAYER.speed);
  }

  /** Eases the steered velocity toward the stick direction at `speed`, and turns the hero to face it. */
  steer(dt: number, wx: number, wz: number, mag: number, speed: number, accel: number) {
    const tx = wx * mag * speed;
    const tz = wz * mag * speed;
    const k = 1 - Math.exp(-(accel / speed) * dt * 1.6);
    this.vx += (tx - this.vx) * k;
    this.vz += (tz - this.vz) * k;
    if (mag > 0.1 && this.spinT <= 0) this.facing = dampAngle(this.facing, Math.atan2(wx, wz), 16, dt);
  }

  /**
   * One physics step for whichever hero is playing: ride platforms, move and collide, land (calling
   * `onLand` with the impact speed), floor effects, hazards, the last safe spot and falling off the
   * world. Returns false if the hero fell or touched a hazard (and was put back).
   */
  stepBody(dt: number, onLand: (impact: number) => void): boolean {
    const w = this.world;
    const b = this.body;
    // Ride moving platforms.
    if (b.grounded && b.ground?.box) {
      const box = b.ground.box;
      b.x += box.dx;
      b.z += box.dz;
      b.y += box.dy;
    }
    b.vx = this.vx;
    b.vz = this.vz;
    const vyBefore = b.vy;
    moveBody(b, dt, w.grid, w.boxes);
    this.vx = b.vx;
    this.vz = b.vz;

    if (!b.grounded) this.airTime += dt;
    if (b.grounded && !this.wasGrounded) {
      onLand(-vyBefore);
      this.airTime = 0;
      const fx = w.floorEffect(b.ground);
      fx?.land?.(this);
    }
    if (b.grounded) {
      const fx = w.floorEffect(b.ground);
      fx?.stand?.(this, dt);
      if (b.ground?.kind === 'hazard') {
        this.fellOff();
        return false;
      }
      this.safeT -= dt;
      if (this.safeT <= 0 && b.ground && b.ground.kind !== 'box' && !fx?.unsafe && !(this.ata?.cramped ?? false)) {
        const c = w.grid.cell(b.ground.cx, b.ground.cz);
        this.safe.set(Grid.center(b.ground.cx), c.h, Grid.center(b.ground.cz));
        this.safeT = 0.25;
      }
    }
    this.wasGrounded = b.grounded;
    if (b.y < DEATH_Y) {
      this.fellOff();
      return false;
    }
    return true;
  }

  /** Jason's jump state as Atalanta's moveset needs it: true while the coyote window is open. */
  get canCoyote() {
    return this.coyote > 0;
  }

  /** Places a hero model on the body: height smoothing, shadow, blinking, the hurt flicker and cutscene poses. */
  placeModel(m: HeroModel, dt: number, sinkBy = 0) {
    const b = this.body;
    this.renderY = b.grounded ? damp(this.renderY, b.y, 22, dt) : b.y;
    if (Math.abs(this.renderY - b.y) > 1.2) this.renderY = b.y;
    m.root.position.set(b.x, this.renderY - Math.min(0.9, sinkBy), b.z);
    m.root.rotation.y = this.facing;
    const shadow = m.root.children[m.root.children.length - 1];
    shadow.position.y = Math.max(0.02, this.groundBelow() - this.renderY + 0.03);
    shadow.visible = this.groundBelow() > -50;
    this.blinkT -= dt;
    const blink = this.blinkT < 0.12;
    if (this.blinkT < 0) this.blinkT = 2 + Math.random() * 3;
    for (const e of m.eyes) e.scale.y = blink ? 0.12 : 1;
    m.root.visible = this.invuln <= 0 || Math.floor(this.invuln * 12) % 2 === 0 || this.down;
    if (this.carrying) this.carrying.rotation.y += dt * 2;
  }

  /** Height of the floor under the hero, or -99 over a void or a wall. */
  groundBelow(): number {
    const c = this.world.grid.cell(Grid.toCell(this.body.x), Grid.toCell(this.body.z));
    return c.kind === 'void' || c.kind === 'wall' ? -99 : c.h;
  }

  /** Drops a half-built fireball (Jason was knocked down, or a cutscene took over). */
  private cancelCharge() {
    this.charge = 0;
    this.holdT = 0;
    this.wasHeld = false;
    this.chargedFx = false;
    this.shootBuf = 0;
  }

  private updateBlaster(dt: number, input: Input) {
    const held = input.isHeld('shoot');
    this.shootBuf = input.take('shoot') ? PLAYER.shootBuffer : this.shootBuf - dt;
    this.sinceShot += dt;
    if (this.reloadT > 0) {
      this.reloadT -= dt;
      if (this.reloadT <= 0) {
        this.reloadT = 0;
        this.ammo = this.clipSize;
        audio.play('reload', 1.3);
        this.world.hooks.hud();
      }
    } else if (!held && this.ammo < this.clipSize && this.sinceShot > 1.8) {
      // Top the clip up after a short break from shooting.
      this.startReload();
    }
    // A tap fires as soon as the blaster is ready, so quick tapping never swallows a shot.
    if (this.shootBuf > 0 && this.spinT <= 0 && this.shootCd <= 0) {
      this.shootBuf = 0;
      if (this.reloadT > 0) audio.play('empty');
      else if (this.ammo <= 0) {
        audio.play('empty');
        this.startReload();
      } else this.shoot();
    }
    // Holding BLAST charges a fireball. It costs a few shots from the clip: if the clip is too low,
    // holding reloads it while the charge builds, and the fireball is ready once both are done.
    if (held) {
      this.holdT += dt;
      if (this.holdT > PLAYER.chargeDelay && this.spinT <= 0) {
        if (this.reloadT <= 0 && this.ammo < PLAYER.fireballCost) this.startReload();
        if (this.charge === 0) audio.play('charge');
        // The ring stops just short of full until the reload finishes.
        const cap = this.reloadT > 0 ? 0.95 : 1;
        this.charge = Math.min(cap, this.charge + dt / PLAYER.chargeTime);
        if (this.charge >= 1 && !this.chargedFx) {
          this.chargedFx = true;
          audio.play('charged');
          haptic('light');
        }
        const b = this.body;
        const gx = b.x + Math.sin(this.facing) * 0.6 + Math.cos(this.facing) * 0.3;
        const gz = b.z + Math.cos(this.facing) * 0.6 - Math.sin(this.facing) * 0.3;
        if (Math.random() < 0.5 + this.charge * 0.5) {
          const a = Math.random() * Math.PI * 2;
          this.world.particles.emit(gx + Math.cos(a) * 1.1, b.y + 1 + Math.sin(a) * 0.8, gz + Math.sin(a) * 1.1, { count: 1, color: this.chargeColor, speed: 0.2, life: 0.25, size: 0.35, gravity: 0 });
        }
      }
    } else if (this.wasHeld) {
      if (this.charge >= 1) this.fireball();
      this.charge = 0;
      this.holdT = 0;
      this.chargedFx = false;
    }
    this.wasHeld = held;
  }

  /** Where shots leave the blaster, and which way they fly (auto-aiming at the best target). */
  private aimShot(range: number): [THREE.Vector3, THREE.Vector3, Target | null] {
    const w = this.world;
    const b = this.body;
    const origin = new THREE.Vector3(b.x, b.y + 1.05, b.z);
    const target = w.findAimTarget(origin, this.facing, range);
    let dir: THREE.Vector3;
    if (target) {
      dir = target.aim.clone().sub(origin);
      this.facing = Math.atan2(dir.x, dir.z);
    } else {
      dir = new THREE.Vector3(Math.sin(this.facing), 0, Math.cos(this.facing));
    }
    dir.normalize();
    origin.x += Math.sin(this.facing) * 0.55 + Math.cos(this.facing) * 0.3;
    origin.z += Math.cos(this.facing) * 0.55 - Math.sin(this.facing) * 0.3;
    return [origin, dir, target];
  }

  /** The equipped weapon (the Blaster unless Jason bought and picked another). */
  get weapon(): WeaponId {
    return equippedWeapon(this.world.save.weapons, this.world.save.weapon);
  }

  /** Switches to the next weapon Jason owns. */
  cycleWeapon() {
    const s = this.world.save;
    if (ownedWeapons(s.weapons).length < 2) return;
    s.weapon = nextWeapon(s.weapons, this.weapon);
    this.cancelCharge();
    this.shootCd = Math.max(this.shootCd, 0.15);
    this.refreshGear();
    audio.play('reload', WEAPONS[this.weapon].pitch * 1.2);
    haptic('light');
    this.world.hooks.hud();
  }

  /** The colour of the charge glow at the muzzle (gold once a Blaster fireball is ready). */
  private get chargeColor() {
    const wp = WEAPONS[this.weapon];
    if (wp.id === 'blaster') return this.charge >= 1 ? '#ffd166' : '#ff9a3d';
    return this.charge >= 1 ? wp.core : wp.glow;
  }

  /** Shot damage: the Blaster's 1 + Blaster Power, times the weapon's power. */
  private get shotDamage() {
    return (1 + (this.world.save.upgrades.blaster ?? 0)) * WEAPONS[this.weapon].power;
  }

  private shoot() {
    const w = this.world;
    const wp = WEAPONS[this.weapon];
    const rapid = w.save.upgrades.rapid ?? 0;
    this.shootCd = PLAYER.shootCooldown * Math.max(0.4, 1 - rapid * 0.15) * wp.cooldown;
    const [origin, dir, target] = this.aimShot(PLAYER.aimRange * (wp.id === 'seeker' ? 1.3 : 1));
    if (wp.id === 'spread') {
      for (const k of [-1, 0, 1]) w.shots.fire('player', origin, dir.clone().applyAxisAngle(UP, k * SPREAD.angle), wp.speed, this.shotDamage, 0, { weapon: wp.id });
    } else {
      w.shots.fire('player', origin, dir, wp.speed, this.shotDamage, 0, { weapon: wp.id, target: wp.id === 'seeker' ? target : null });
    }
    this.ammo -= 1;
    this.sinceShot = 0;
    this.shootPose = 0.18;
    audio.play('shoot', wp.pitch * (0.95 + Math.random() * 0.1));
    if (wp.id === 'thunder') audio.play('zap', 2.2, 0.5);
    if (this.ammo <= 0) this.startReload();
    w.hooks.hud();
  }

  private fireball() {
    const w = this.world;
    const wp = WEAPONS[this.weapon];
    const [origin, dir, target] = this.aimShot((PLAYER.aimRange + 4) * (wp.id === 'seeker' ? 1.3 : 1));
    const dmg = (4 + (w.save.upgrades.blaster ?? 0) * 2) * wp.power;
    const speed = wp.id === 'seeker' ? PLAYER.fireballSpeed * 0.75 : PLAYER.fireballSpeed;
    const opts = { weapon: wp.id, target: wp.id === 'seeker' ? target : null };
    if (wp.id === 'spread') {
      // Three smaller fireballs in a fan.
      let n = 0;
      for (const k of [-1, 0, 1]) if (w.shots.fire('fireball', origin, dir.clone().applyAxisAngle(UP, k * SPREAD.angle * 1.3), speed, dmg, 0, opts)) n += 1;
      if (!n) return;
    } else if (!w.shots.fire('fireball', origin, dir, speed, dmg, 0, opts)) return;
    this.ammo = Math.max(0, this.ammo - PLAYER.fireballCost);
    this.sinceShot = 0;
    this.shootPose = 0.4;
    this.shootCd = 0.4;
    // A kick of recoil.
    this.vx -= dir.x * 4;
    this.vz -= dir.z * 4;
    audio.play('fireball', wp.id === 'blaster' ? 1 : wp.pitch);
    haptic('medium');
    w.shake(0.25);
    w.flash(origin.x, origin.y, origin.z, wp.id === 'blaster' ? '#ffb04a' : wp.glow, 30, 0.25);
    if (this.ammo <= 0) this.startReload();
    w.hooks.hud();
  }

  private animate(dt: number, speedFrac: number) {
    const m = this.jason;
    const b = this.body;
    this.placeModel(m, dt, this.sink * 0.35);

    const air = !b.grounded;
    this.phase += dt * (5 + 9 * speedFrac);
    const s = Math.sin(this.phase);
    const walk = air ? 0 : clamp(speedFrac, 0, 1);
    m.legL.rotation.x = air ? -0.6 : s * 0.95 * walk;
    m.legR.rotation.x = air ? 0.35 : -s * 0.95 * walk;
    m.armL.rotation.x = air ? -2.4 : -s * 0.7 * walk;
    m.armL.rotation.z = this.gliding ? -1.3 : air ? -0.3 : 0.05;
    m.armR.rotation.z = this.gliding ? 1.3 : 0;
    m.armR.rotation.x = this.shootPose > 0 || this.charge > 0 ? -1.5 : air ? -2.4 : s * 0.7 * walk;
    // The Mirror Shield: hung at his side, or held out in front while SPIN is held.
    if (!this.mirror && this.has('mirror')) this.raiseMirror(false);
    if (this.mirror) {
      const g = this.mirror.group;
      if (this.mirrorUp) {
        m.armL.rotation.set(-1.4, 0.35, -0.1);
        m.armR.rotation.set(-1.2, -0.35, 0.1);
        g.position.set(0, 1.05, damp(g.position.z, 0.55, 14, dt));
        g.rotation.set(0, 0, 0);
        g.scale.setScalar(1);
      } else {
        // Hung at his left side, edge-on to the camera behind him, so it never hides him.
        g.position.set(-0.4, 0.92, -0.02);
        g.rotation.set(0, -Math.PI / 2, 0.12);
        g.scale.setScalar(0.55);
      }
      this.mirror.face.emissiveIntensity = 0.3 + this.mirrorFlash * 2.5;
      this.mirror.glow.material.opacity = this.mirrorFlash * 0.9;
    }
    m.body.position.y = air ? 0 : Math.abs(s) * 0.07 * walk + Math.sin(this.phase * 0.5) * 0.01;
    // Ground pound: a quick front flip while hanging in the air, then feet-first down.
    const flip = this.poundHang > 0 ? (1 - this.poundHang / POUND_HANG) * Math.PI * 2 : 0.2;
    m.body.rotation.x = this.dashT > 0 ? 0.45 : this.pounding ? flip : walk * 0.08;
    if (this.spinT > 0) m.body.rotation.y += dt * 28;
    else m.body.rotation.y = damp(m.body.rotation.y % (Math.PI * 2), 0, 20, dt);
    this.squash = Math.max(0, this.squash - dt);
    const sq = this.squash > 0 ? 1 - this.squash * 1.6 : 1;
    m.body.scale.set(2 - sq, sq, 2 - sq);
    const jet = this.jumps === 2 && b.vy > 0 ? 0.9 : this.gliding ? 0.7 : this.dashT > 0 ? 1.1 : 0.01;
    for (const j of m.jets) {
      const target = jet * (0.85 + Math.random() * 0.3);
      j.scale.setScalar(damp(j.scale.x, target, 20, dt));
    }
    m.visor.emissiveIntensity = 0.35 + this.world.darkness * 1.2;
    const glow = this.charge > 0 ? 0.4 + this.charge * 1.6 + (this.charge >= 1 ? Math.sin(this.phase * 3) * 0.3 : 0) : 0;
    m.gunGlow.scale.setScalar(Math.max(0.001, glow));
    m.gunGlow.material.color.set(this.chargeColor);
    this.fx.update(dt, b.x, this.renderY, b.z, { pounding: this.pounding, hang: this.poundHang, hangMax: POUND_HANG, airborne: !b.grounded });
    this.pose?.(m, dt);
  }

  get cellX() {
    return Math.floor(this.body.x / CELL);
  }

  get cellZ() {
    return Math.floor(this.body.z / CELL);
  }
}
