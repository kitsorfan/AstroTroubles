/**
 * The Gardeners' bronze mech suit (Talos's Forge, chapter 3). Jason and Atalanta find it asleep in the
 * forge and climb in: while they ride it, it is the only hero (see `joinedRoster`), Jason at the controls
 * in its chest and Atalanta on its shoulder. `Player` hands it the controls every frame; it shares the
 * body and the physics step with the heroes on foot.
 *
 * - Big, heavy and slow (one strong hydraulic jump, no double jump, glide or grapple), but far stronger
 *   than anyone on foot: its punches, slam and flames flatten robots, and only it can fight TALOS.
 * - No hearts aboard: hits drain its STRENGTH (see `mechPower.ts`), which slowly comes back. At 0 it
 *   overheats: it kneels, everyone hops out, and it can't be boarded until it has cooled down (a ring
 *   over it fills up). The heroes' own hearts are untouched while they ride.
 * - GET OUT (the action button, on solid ground with room beside it): Jason and Atalanta climb out and
 *   play on foot; the empty mech stays parked, kneeling. CLIMB IN (the action button, close to it) puts
 *   everyone back aboard.
 * - THRUST (the DASH button): a burst of its back jets straight ahead, on the ground or once per jump.
 *   Gravity pauses while it lasts, so a jump and a THRUST carry it over lava channels.
 * - PUNCH (the SPIN button): a one-two of bronze fists. It breaks bronze gates, crates and cracked walls,
 *   and knocks robots flat (and Talos's ankle armour off).
 * - SLAM (SPIN in the air): straight down like a ground pound. It presses red switches and smashes
 *   cracked floors (any heavy landing from high up does too).
 * - FLAMETHROWER (the BLAST button, held): a big cone of fire from the right arm, auto-aimed, even at
 *   drones overhead. Its heat gauge empties as it burns and refills while it rests.
 */
import * as THREE from 'three';

import { audio } from '../../core/audio';
import { haptic } from '../../core/bridge';
import { MECH, OUTDOOR, PLAYER } from '../../core/constants';
import type { Input } from '../../core/input';
import { clamp, damp } from '../../core/math';
import type { World } from '../../game/world';
import type { Interactable } from '../entity';
import { FlameJet, burnCone, type ConeSpec } from '../flame';
import type { HeroModel } from '../models';
import type { Player } from '../player';
import { FLAME, stepFuel, type Tank } from '../weapons';
import { MECH_COLORS, makeMech, type MechModel } from './mechModel';
import { coolProgress, drain, freshPower, spent, stepPower, type MechPower } from './mechPower';

const tmp = new THREE.Vector3();
const HOT = new THREE.Color('#ff5a1a');
const COOL = new THREE.Color(MECH_COLORS.light);

/** Segments in the cool-down ring over the parked mech, red-hot at first and gold once nearly cool. */
const RING_SEGS = 20;
const RING_HOT = new THREE.Color('#ff3a1a');
const RING_DONE = new THREE.Color('#ffd166');

export class MechMoves implements Interactable {
  readonly model: MechModel;
  readonly radius: number = MECH.radius;
  private coyote = 0;
  private jumpBuf = 0;
  private cut = true;
  private thrustT = 0;
  private thrustCd = 0;
  private airThrust = false;
  private thrustDir = new THREE.Vector2();
  private punchT = 0;
  private punchCd = 0;
  private punchSide = 0;
  private punched = false;
  private punchHit = new Set<unknown>();
  slamming = false;
  private aimT = 0;
  private stepPhase = 0;
  /** Jason (in the cockpit) and Atalanta (on the shoulder), once they have climbed in. */
  private riders: { jason: HeroModel | null; atalanta: HeroModel | null } = { jason: null, atalanta: null };
  private waveT = 4;
  /** STRENGTH (instead of hearts) and the cool-down after it runs out. */
  power: MechPower = freshPower();
  /** The flamethrower's tank (seconds of fire left), and whether it is burning this frame. */
  tank: Tank = { fuel: MECH.flameFuel, dry: false, rest: 0 };
  flaming = false;
  private puffT = 0;
  private flameTickT = 0;
  private flameDir = new THREE.Vector3(0, 0, 1);
  private jet: FlameJet | null = null;
  /** Where it stands, kneeling, while nobody is aboard (null while the heroes ride it). */
  parked: THREE.Vector3 | null = null;
  private ring: { group: THREE.Group; segs: THREE.Mesh[]; on: THREE.MeshBasicMaterial; off: THREE.MeshBasicMaterial } | null = null;
  /** Overheated since it was parked: it says so when it has cooled down. */
  private wasHot = false;
  private toastT = 0;
  private smokeT = 0;

  /* The action button: GET OUT while aboard (when nothing else is in reach), CLIMB IN beside the parked mech. */
  alive = true;
  readonly range = MECH.boardRange;
  readonly reachY = 3;

  constructor(
    private p: Player,
    private world: World,
  ) {
    this.model = makeMech();
  }

  /** Punching, slamming or thrusting (no hero switching then, and enemies bumped mid-THRUST don't hurt). */
  get busy() {
    return this.thrustT > 0 || this.slamming || this.punchT > 0;
  }

  get thrusting() {
    return this.thrustT > 0;
  }

  /** 0..1 of its STRENGTH left. */
  get strength() {
    return this.power.strength / MECH.strength;
  }

  /** 0..1 fuel left in the flamethrower's tank. */
  get fuel() {
    return clamp(this.tank.fuel / MECH.flameFuel, 0, 1);
  }

  /** Back to normal (teleports, cutscenes). */
  reset() {
    this.thrustT = 0;
    this.punchT = 0;
    this.slamming = false;
    this.p.pounding = false;
    this.aimT = 0;
    this.puffT = 0;
    this.flaming = false;
    // The fire goes out at once.
    this.jet?.update(1, false, tmp.set(0, 0, 0), this.flameDir);
  }

  launched() {
    this.slamming = false;
    this.airThrust = false;
    this.cut = true;
  }

  /** Jason climbs into the cockpit and Atalanta onto the left shoulder: their models ride along from now on. */
  seat(jason: HeroModel, atalanta: HeroModel | null) {
    const sit = (m: HeroModel, at: THREE.Group, s: number, y: number) => {
      at.add(m.root);
      m.root.position.set(0, y, 0);
      m.root.rotation.set(0, 0, 0);
      m.root.scale.setScalar(s);
      m.root.visible = true;
      // Their own blob shadows stay off: the mech's shadow covers them.
      m.root.children[m.root.children.length - 1].visible = false;
    };
    sit(jason, this.model.cockpit, 0.62, -0.42);
    this.riders.jason = jason;
    if (atalanta) {
      sit(atalanta, this.model.perch, 0.6, 0.06);
      this.riders.atalanta = atalanta;
    }
  }

  /** Jason and Atalanta climb out: their models go back into the world, full size, with their shadows. */
  private unseat() {
    for (const m of [this.riders.jason, this.riders.atalanta]) {
      if (!m) continue;
      this.world.scene.add(m.root);
      m.root.scale.setScalar(1);
      m.root.rotation.set(0, 0, 0);
      m.root.children[m.root.children.length - 1].visible = true;
    }
    this.riders = { jason: null, atalanta: null };
  }

  /* ---------------- getting in and out ---------------- */

  get spot(): THREE.Vector3 {
    if (this.parked) return this.parked;
    const b = this.p.body;
    return tmp.set(b.x, b.y, b.z);
  }

  /** Aboard, GET OUT only shows when nothing else (a plug to pull, a shop) is in reach. */
  get fallback() {
    return !this.parked;
  }

  label() {
    const p = this.p;
    if (p.down) return null;
    if (!this.parked) return p.aboard && p.canLeaveMech() ? 'GET OUT' : null;
    return this.power.cool > 0 ? 'TOO HOT' : 'CLIMB IN';
  }

  interact() {
    if (!this.parked) {
      this.p.leaveMech(false);
      return;
    }
    if (this.power.cool > 0) {
      audio.play('empty');
      if (this.mayTalk()) this.world.hooks.toast('Still too hot! When the ring over the mech is full, climb back in.', 'bolt');
      return;
    }
    this.p.climbIn();
  }

  /** LUX's reminders come at most every few seconds. */
  private mayTalk() {
    if (this.world.time < this.toastT) return false;
    this.toastT = this.world.time + 4;
    return true;
  }

  /**
   * Parks the empty mech at (x, y, z), kneeling, and lets the riders out (`hot`: it overheated and has to
   * cool down before anyone can climb back in).
   */
  park(at: THREE.Vector3, facing: number, hot: boolean) {
    this.reset();
    this.parked = at.clone();
    const m = this.model;
    m.root.position.copy(at);
    m.root.rotation.y = facing;
    m.root.visible = true;
    m.body.scale.setScalar(1);
    m.chargeGlow.scale.setScalar(0.001);
    for (const j of m.jets) j.scale.setScalar(0.001);
    if (hot) {
      this.power = { ...this.power, strength: 0, cool: MECH.cool };
      this.wasHot = true;
      m.lines.emissive.copy(HOT);
      m.visor.emissive.copy(HOT);
    }
    this.unseat();
  }

  /** Everyone is back aboard: it stands up again, its light-lines teal. */
  unpark() {
    this.parked = null;
    this.cooled();
  }

  /** Full STRENGTH and a full tank, cooled down at once (checkpoints, starting again at one). */
  refill() {
    this.power = freshPower();
    this.tank = { fuel: MECH.flameFuel, dry: false, rest: 0 };
    this.cooled();
  }

  /** The overheating glow and the cool-down ring go away. */
  private cooled() {
    this.wasHot = false;
    if (this.ring) this.ring.group.visible = false;
    this.model.lines.emissive.copy(COOL);
    this.model.visor.emissive.copy(COOL);
  }

  /** It overheated (out of STRENGTH) but is still moving: it bails out as soon as it stands still on the ground. */
  get canBail() {
    return this.p.body.grounded && !this.busy;
  }

  /**
   * A hit while aboard: STRENGTH drains instead of a heart, with a clang and a little shove (no hop: it is
   * far too heavy). Lava (`hazard`) costs a bigger slice.
   */
  hurt(n: number, fromX?: number, fromZ?: number, hazard = false) {
    const p = this.p;
    const w = this.world;
    const b = p.body;
    const was = this.power.strength;
    this.power = drain(this.power, n, hazard);
    p.invuln = MECH.invuln;
    p.sinceHurt = 0;
    audio.play('shield', 0.55);
    audio.play('pound', 1.7, 0.45);
    haptic('medium');
    w.shake(0.25);
    w.particles.emit(b.x, b.y + 1.8, b.z, { count: 16, color: '#ffd8a0', speed: 6, life: 0.4, size: 0.45 });
    if (fromX !== undefined && fromZ !== undefined) {
      const d = Math.hypot(b.x - fromX, b.z - fromZ) || 1;
      p.vx += ((b.x - fromX) / d) * 3;
      p.vz += ((b.z - fromZ) / d) * 3;
    }
    if (spent(this.power) && was > 0) {
      audio.play('sputter', 0.5);
      w.hooks.toast('Out of STRENGTH! The mech is overheating: everybody out until it cools down!', 'bolt');
    } else if (this.power.strength < MECH.strength * 0.3 && was >= MECH.strength * 0.3) {
      w.hooks.toast('The mech’s STRENGTH is low! Keep away from hits for a bit and it comes back.', 'bolt');
    }
    w.hooks.hud();
  }

  /* ---------------- aboard ---------------- */

  update(dt: number, input: Input) {
    const p = this.p;
    const w = this.world;
    const b = p.body;
    const { wx, wz, mag } = p.moveInput(input);
    this.power = stepPower(this.power, dt);
    this.coyote = b.grounded ? PLAYER.coyote : this.coyote - dt;
    this.jumpBuf -= dt;
    this.thrustCd -= dt;
    this.punchCd -= dt;
    this.aimT = Math.max(0, this.aimT - dt);
    if (b.grounded) this.airThrust = false;

    // SPIN: a PUNCH on the ground, a SLAM in the air (high enough to be worth it).
    if (input.take('spin')) {
      if (!b.grounded && this.coyote <= 0 && !this.slamming && b.y > p.groundBelow() + 0.9) this.startSlam();
      else if (this.punchCd <= 0 && !this.slamming) this.startPunch(wx, wz, mag);
    }

    if (this.thrustT > 0) this.updateThrust(dt);
    else if (this.slamming) {
      p.vx = 0;
      p.vz = 0;
      b.vy = -MECH.slamSpeed;
    } else {
      const onIce = b.grounded && b.ground?.kind === 'ice';
      // It plants its feet to punch, and walks slower still while it pours out fire.
      const slow = this.punchT > 0 ? 0.35 : this.flaming ? 0.6 : 1;
      const speed = MECH.speed * (p.inMud ? OUTDOOR.sandSpeed : 1) * slow;
      const accel = b.grounded ? (onIce ? PLAYER.iceAccel : PLAYER.accel * 0.6) : PLAYER.airAccel * 0.8;
      p.steer(dt, wx, wz, mag, speed, accel);
    }
    if (this.punchT > 0) this.updatePunch(dt);

    this.updateJump(input);

    // THRUST (the DASH button): on the ground, or once per jump.
    if (input.take('dash')) {
      if (this.thrustCd <= 0 && !this.slamming && (b.grounded || this.coyote > 0 || !this.airThrust)) this.startThrust(wx, wz, mag);
      else audio.play('empty');
    }

    this.updateFlame(dt, input);

    const ok = p.stepBody(dt, (impact) => {
      if (this.slamming || impact > MECH.heavyLanding) {
        // A SLAM (or a long drop): the ground shakes, switches press, cracked floors give way, robots fly.
        this.slamming = false;
        p.pounding = false;
        w.groundPound(p, MECH.slamRadius, this.hard(MECH.slamDamage));
        w.shake(0.8);
        w.rings.burst(b.x, b.y + 0.05, b.z, MECH.slamRadius * 2.4, MECH_COLORS.glow, 0.45);
      } else if (impact > 6) {
        audio.play('pound', 1.5, 0.5);
        p.squash = 0.16;
        w.shake(0.2);
        w.particles.emit(b.x, b.y + 0.1, b.z, { count: 12, color: '#b8a890', speed: 3, life: 0.4, size: 0.6, gravity: 1 });
      }
    });
    this.tickFlame(dt);
    if (!ok) {
      this.reset();
      return;
    }
    this.animate(dt, Math.hypot(p.vx, p.vz) / MECH.speed);
  }

  /** Mech damage: the base, scaled to how tough the level's enemies are (plus Blaster Power). */
  private hard(base: number) {
    return base * this.world.difficulty.hp + (this.world.save.upgrades.blaster ?? 0);
  }

  private updateJump(input: Input) {
    const p = this.p;
    const b = p.body;
    if (input.take('jump')) this.jumpBuf = PLAYER.jumpBuffer;
    if (this.jumpBuf > 0 && this.coyote > 0 && !this.slamming) {
      b.vy = MECH.jumpV;
      this.coyote = 0;
      this.jumpBuf = 0;
      this.cut = false;
      audio.play('jump', 0.6);
      audio.play('dash', 0.5, 0.3);
      this.world.particles.emit(b.x, b.y + 0.1, b.z, { count: 16, color: '#d8ccb8', speed: 3.5, life: 0.4, size: 0.7, gravity: 2 });
    }
    if (!input.isHeld('jump') && b.vy > 0 && !this.cut) {
      b.vy *= PLAYER.jumpCut;
      this.cut = true;
    }
  }

  /* ---------------- thrust, punch and slam ---------------- */

  private startThrust(wx: number, wz: number, mag: number) {
    const p = this.p;
    if (mag > 0.1) p.facing = Math.atan2(wx, wz);
    this.thrustDir.set(Math.sin(p.facing), Math.cos(p.facing));
    this.thrustT = MECH.thrustTime;
    this.thrustCd = MECH.thrustTime + MECH.thrustCooldown;
    if (!p.body.grounded && this.coyote <= 0) this.airThrust = true;
    audio.play('dash', 0.65);
    audio.play('fireball', 1.4, 0.35);
    haptic('medium');
  }

  private updateThrust(dt: number) {
    const p = this.p;
    const b = p.body;
    this.thrustT -= dt;
    p.vx = this.thrustDir.x * MECH.thrustSpeed;
    p.vz = this.thrustDir.y * MECH.thrustSpeed;
    // The jets hold it up while they fire.
    if (!b.grounded) b.vy = Math.max(b.vy, 0);
    const f = p.facing;
    if (Math.random() < 0.9) this.world.particles.emit(b.x - Math.sin(f) * 1, b.y + 1.8, b.z - Math.cos(f) * 1, { count: 2, color: MECH_COLORS.glow, speed: 2, life: 0.35, size: 0.7, gravity: -1 });
    if (this.thrustT <= 0) {
      // Out of the burst at a sensible speed, not the full thrust.
      p.vx = this.thrustDir.x * MECH.speed;
      p.vz = this.thrustDir.y * MECH.speed;
    }
  }

  private startPunch(wx: number, wz: number, mag: number) {
    const p = this.p;
    // Turn toward the nearest thing worth punching (or the stick).
    const b = p.body;
    const t = this.world.findAimTarget(new THREE.Vector3(b.x, b.y + 1, b.z), p.facing, 3.2);
    if (t) p.facing = Math.atan2(t.aim.x - b.x, t.aim.z - b.z);
    else if (mag > 0.1) p.facing = Math.atan2(wx, wz);
    this.punchT = MECH.punchTime;
    this.punchCd = MECH.punchTime + MECH.punchCooldown;
    this.punchSide = 1 - this.punchSide;
    this.punched = false;
    this.punchHit.clear();
    audio.play('spin', 0.6, 0.6);
  }

  private updatePunch(dt: number) {
    const p = this.p;
    this.punchT -= dt;
    // The fist lands a third of the way in, with a little lunge.
    if (!this.punched && this.punchT <= MECH.punchTime * 0.66) {
      this.punched = true;
      p.vx += Math.sin(p.facing) * 4;
      p.vz += Math.cos(p.facing) * 4;
      const b = p.body;
      const reach = MECH.punchReach - 0.6;
      // `smash` hits just in front of the hero: step the hit point out to the fist first.
      const ox = Math.sin(p.facing) * reach;
      const oz = Math.cos(p.facing) * reach;
      b.x += ox;
      b.z += oz;
      this.world.smash(p, MECH.punchRadius, this.hard(MECH.punchDamage), this.punchHit);
      b.x -= ox;
      b.z -= oz;
      if (this.punchHit.size === 0) audio.play('dash', 1.6, 0.4);
      else this.world.hitStop(0.05);
    }
  }

  private startSlam() {
    this.slamming = true;
    this.p.pounding = true;
    this.thrustT = 0;
    this.punchT = 0;
    audio.play('spin', 0.5);
  }

  /* ---------------- the flamethrower ---------------- */

  /** Where the fire leaves the right fist (the arm raised forward). */
  private nozzle(out = new THREE.Vector3()) {
    const b = this.p.body;
    const f = this.p.facing;
    return out.set(b.x + Math.sin(f) * 1.75 + Math.cos(f) * 1.4, b.y + 2.2, b.z + Math.cos(f) * 1.75 - Math.sin(f) * 1.4);
  }

  /** The flames' size and bite: longer, wider and much hotter than Jason's Flamethrower. */
  private cone(): ConeSpec {
    const tough = this.world.difficulty.hp;
    const bonus = this.world.save.upgrades.blaster ?? 0;
    return {
      range: MECH.flameRange,
      cone: MECH.flameCone,
      reachY: MECH.flameReachY,
      dmg: (MECH.flameDps * tough + bonus) * MECH.flameTick,
      dps: MECH.flameDps * tough * 0.3,
    };
  }

  /** Hold BLAST to pour out fire (a tap gives a short puff), auto-aimed at the closest enemy in reach. */
  private updateFlame(dt: number, input: Input) {
    const p = this.p;
    const w = this.world;
    const ready = this.thrustT <= 0 && !this.slamming && this.punchT <= 0;
    const empty = this.tank.dry || this.tank.fuel <= 0;
    if (input.take('shoot')) {
      this.puffT = FLAME.puff;
      if (empty) {
        audio.play('empty');
        this.jet?.smoke(this.nozzle());
        if (this.mayTalk()) w.hooks.toast('The flamethrower is too hot! Let go of FLAME for a moment and the gauge fills up again.', 'bolt');
      }
    }
    this.puffT -= dt;
    this.flaming = (input.isHeld('shoot') || this.puffT > 0) && ready && !empty;
    if (!this.flaming) {
      this.flameTickT = 0;
      return;
    }
    this.aimT = 0.25;
    this.flameTickT -= dt;
    if (this.flameTickT > 0) return;
    this.flameTickT = MECH.flameTick;
    // Turn toward the nearest enemy in reach every tick (even a drone overhead), then roast the cone.
    const b = p.body;
    const t = w.findAimTarget(tmp.set(b.x, b.y + 2, b.z), p.facing, MECH.flameAim);
    if (t && Math.hypot(t.aim.x - b.x, t.aim.z - b.z) > 0.5) p.facing = Math.atan2(t.aim.x - b.x, t.aim.z - b.z);
    const noz = this.nozzle();
    if (t) this.flameDir.copy(t.aim).sub(noz).normalize();
    else this.flameDir.set(Math.sin(p.facing), -0.12, Math.cos(p.facing)).normalize();
    burnCone(w, noz, this.flameDir, w.save.upgrades, this.cone());
  }

  /** Every frame aboard: the tank drains or refills, and the fire, its light and its roar follow `flaming`. */
  private tickFlame(dt: number) {
    const was = this.tank.dry;
    this.tank = stepFuel(this.tank, this.flaming, dt, MECH.flameFuel, MECH.flameRefill);
    if (this.tank.dry && !was) {
      audio.play('sputter', 0.5);
      audio.play('empty');
      this.jet?.smoke(this.nozzle());
    }
    if (this.flaming && !this.jet) this.jet = new FlameJet(this.world, 1.6, MECH.flameRange);
    if (this.jet) {
      const f = this.p.facing;
      const dir = tmp.set(Math.sin(f), this.flameDir.y, Math.cos(f)).normalize();
      this.jet.update(dt, this.flaming, this.nozzle(), dir);
    }
  }

  /* ---------------- parked ---------------- */

  /**
   * Every frame while nobody is aboard: it kneels where it was left, its tank refills, its STRENGTH comes
   * back (cooling down first if it overheated, steaming, with a ring over it filling up).
   */
  updateParked(dt: number) {
    const at = this.parked;
    if (!at) return;
    const w = this.world;
    const m = this.model;
    const hot = this.power.cool > 0;
    this.power = stepPower(this.power, dt);
    this.tank = stepFuel(this.tank, false, dt, MECH.flameFuel, MECH.flameRefill);
    // Kneeling: one knee down, fists on the floor, head bowed.
    const k = 6;
    m.body.position.y = damp(m.body.position.y, -0.5, k, dt);
    m.body.rotation.x = damp(m.body.rotation.x, 0.22, k, dt);
    m.body.rotation.y = 0;
    m.body.rotation.z = 0;
    m.legL.rotation.x = damp(m.legL.rotation.x, -1.0, k, dt);
    m.legR.rotation.x = damp(m.legR.rotation.x, 0.85, k, dt);
    m.armL.rotation.x = damp(m.armL.rotation.x, -0.35, k, dt);
    m.armR.rotation.x = damp(m.armR.rotation.x, -0.35, k, dt);
    m.armL.rotation.z = damp(m.armL.rotation.z, 0.12, k, dt);
    m.armR.rotation.z = damp(m.armR.rotation.z, -0.12, k, dt);
    m.head.rotation.x = damp(m.head.rotation.x, 0.3, k, dt);
    for (const f of m.fists) f.scale.setScalar(1);
    const glow = 0.25 + w.darkness * 0.8;
    if (hot) {
      // Glowing orange and hissing steam while it cools.
      const pulse = 1.2 + Math.sin(w.time * 6) * 0.4;
      m.lines.emissiveIntensity = pulse;
      m.visor.emissiveIntensity = pulse;
      this.smokeT -= dt;
      if (this.smokeT <= 0) {
        this.smokeT = 0.12;
        w.particles.emit(at.x + (Math.random() - 0.5) * 1.4, at.y + 2.4, at.z + (Math.random() - 0.5) * 1.4, { count: 2, color: '#d8d8d8', speed: 1.2, life: 1, size: 0.9, gravity: -2.5, drag: 1 });
      }
      if (Math.random() < dt * 1.5) w.soundAt('vent', at.x, at.z, 1.3, 14);
    } else {
      m.lines.emissiveIntensity = glow + 0.5;
      m.visor.emissiveIntensity = glow + 0.6;
    }
    if (hot && this.power.cool <= 0) {
      // Cool again: the lines go back to teal, and LUX says so.
      m.lines.emissive.copy(COOL);
      m.visor.emissive.copy(COOL);
      w.particles.emit(at.x, at.y + 2.2, at.z, { count: 24, color: MECH_COLORS.light, speed: 4, life: 0.6, size: 0.5, up: 2 });
      audio.play('charged', 0.8);
      if (this.wasHot) w.hooks.toast('The mech has cooled down! Walk up to it and CLIMB IN.', 'bolt');
      this.wasHot = false;
    }
    this.updateRing(at, hot);
  }

  /** The cool-down ring over the parked mech: it fills up (red, orange, then gold) as the mech cools. */
  private updateRing(at: THREE.Vector3, hot: boolean) {
    if (!hot) {
      if (this.ring) this.ring.group.visible = false;
      return;
    }
    if (!this.ring) {
      const group = new THREE.Group();
      const on = new THREE.MeshBasicMaterial({ color: '#ff6a2a', depthTest: false, transparent: true, toneMapped: false });
      const off = new THREE.MeshBasicMaterial({ color: '#3a2418', depthTest: false, transparent: true, opacity: 0.8 });
      const geo = new THREE.PlaneGeometry(0.26, 0.46);
      const segs: THREE.Mesh[] = [];
      for (let i = 0; i < RING_SEGS; i++) {
        // Clockwise from the top, like a clock hand.
        const a = (i / RING_SEGS) * Math.PI * 2;
        const s = new THREE.Mesh(geo, off);
        s.position.set(Math.sin(a) * 0.95, Math.cos(a) * 0.95, 0);
        s.rotation.z = -a;
        s.renderOrder = 9;
        segs.push(s);
        group.add(s);
      }
      this.world.scene.add(group);
      this.ring = { group, segs, on, off };
    }
    const r = this.ring;
    const k = coolProgress(this.power);
    const lit = Math.floor(k * RING_SEGS + 0.001);
    r.segs.forEach((s, i) => (s.material = i < lit ? r.on : r.off));
    r.on.color.copy(RING_HOT).lerp(RING_DONE, k);
    r.group.visible = true;
    r.group.position.set(at.x, at.y + 4.3 + Math.sin(this.world.time * 2) * 0.08, at.z);
    r.group.quaternion.copy(this.world.camera.quaternion);
  }

  /* ---------------- animation ---------------- */

  animate(dt: number, speedFrac: number) {
    const p = this.p;
    const m = this.model;
    const b = p.body;
    p.placeModel(m, dt, p.sink * 0.3);
    const air = !b.grounded;
    // A big, slow, heavy stride, with a thud on every step.
    const walk = air ? 0 : clamp(speedFrac, 0, 1.3);
    p.phase += dt * (2.6 + 4 * speedFrac);
    const s = Math.sin(p.phase);
    if (walk > 0.3) {
      const step = Math.floor(p.phase / Math.PI);
      if (step !== this.stepPhase) {
        this.stepPhase = step;
        this.world.soundAt('pound', b.x, b.z, 1.7, 10);
        this.world.particles.emit(b.x, b.y + 0.05, b.z, { count: 4, color: '#b8a890', speed: 1.5, life: 0.35, size: 0.6, gravity: 1 });
      }
    }
    m.legL.rotation.set(air ? (this.slamming ? -0.2 : -0.6) : s * 0.55 * walk, 0, 0);
    m.legR.rotation.set(air ? (this.slamming ? -0.2 : 0.3) : -s * 0.55 * walk, 0, 0);
    m.armL.rotation.set(air ? -0.5 : -s * 0.4 * walk, 0, air ? -0.5 : 0.06);
    m.armR.rotation.set(air ? -0.5 : s * 0.4 * walk, 0, air ? 0.5 : -0.06);
    m.head.rotation.x = 0;
    m.body.position.y = air ? 0 : Math.abs(s) * 0.1 * walk;
    m.body.rotation.set(this.thrustT > 0 ? 0.3 : walk * 0.05, 0, Math.sin(p.phase) * 0.04 * walk);
    if (this.slamming) {
      // Both fists up over its head, ready to come down.
      m.armL.rotation.set(-2.7, 0, -0.2);
      m.armR.rotation.set(-2.7, 0, 0.2);
    }
    // PUNCH: the fist shoots straight out.
    if (this.punchT > 0) {
      const k = 1 - this.punchT / MECH.punchTime;
      const out = k < 0.35 ? k / 0.35 : 1 - (k - 0.35) / 0.65;
      const arm = this.punchSide ? m.armR : m.armL;
      const other = this.punchSide ? m.armL : m.armR;
      arm.rotation.set(-1.55 * out, 0, 0);
      other.rotation.set(-0.3, 0, 0);
      m.body.rotation.y = (this.punchSide ? -0.35 : 0.35) * out;
      m.fists[this.punchSide ? 1 : 0].scale.setScalar(1 + out * 0.25);
    } else {
      m.body.rotation.y = 0;
      for (const f of m.fists) f.scale.setScalar(1);
    }
    // The flame arm comes up while it pours out fire, with a pilot flame at the fist.
    if (this.aimT > 0 && this.punchT <= 0 && !this.slamming) m.armR.rotation.set(-1.5, 0, 0.05);
    const pilot = this.flaming ? 0.9 + Math.random() * 0.4 : 0.001;
    m.chargeGlow.scale.setScalar(damp(m.chargeGlow.scale.x, pilot, 20, dt));
    const jet = this.thrustT > 0 ? 1.6 + Math.random() * 0.4 : air ? 0.6 : 0.001;
    for (const j of m.jets) j.scale.setScalar(damp(j.scale.x, jet, 20, dt));
    // Low on STRENGTH: its light-lines flicker and it puffs smoke now and then.
    const weak = this.strength < 0.3;
    const flicker = weak && Math.sin(this.world.time * 17) > 0.6 ? 0.4 : 1;
    m.lines.emissiveIntensity = (1 + this.world.darkness * 1.5 + (this.thrustT > 0 ? 1 : 0)) * flicker;
    m.visor.emissiveIntensity = 1.3 + this.world.darkness * 1.4;
    if (weak && Math.random() < dt * 3) this.world.particles.emit(b.x, b.y + 2.6, b.z, { count: 2, color: '#6a6460', speed: 1, life: 0.8, size: 0.7, gravity: -2 });
    p.squash = Math.max(0, p.squash - dt);
    const sq = p.squash > 0 ? 1 - p.squash * 1.2 : 1;
    m.body.scale.set(2 - sq, sq, 2 - sq);
    this.poseRiders(dt, air);
    p.fx.update(dt, b.x, p.renderY, b.z, { pounding: this.slamming, hang: 0, hangMax: 1, airborne: air });
    p.pose?.(m, dt);
  }

  /** Jason sits at the controls; Atalanta sits on the shoulder, swinging her legs, and now and then waves. */
  private poseRiders(dt: number, air: boolean) {
    const { jason, atalanta } = this.riders;
    const t = this.world.time;
    if (jason) {
      jason.root.visible = true;
      jason.legL.rotation.set(-1.45, 0, 0.1);
      jason.legR.rotation.set(-1.45, 0, -0.1);
      jason.armL.rotation.set(-0.9 + (this.thrustT > 0 ? -0.3 : 0), 0, 0.1);
      jason.armR.rotation.set(-0.9 + Math.sin(t * 3) * 0.05, 0, -0.1);
      jason.body.rotation.set(-0.05, 0, 0);
    }
    if (atalanta) {
      atalanta.root.visible = true;
      this.waveT -= dt;
      if (this.waveT < -1.4) this.waveT = 5 + Math.random() * 5;
      const waving = this.waveT < 0;
      atalanta.legL.rotation.set(-1.35 + Math.sin(t * 2.4) * 0.25, 0, 0.12);
      atalanta.legR.rotation.set(-1.35 + Math.sin(t * 2.4 + 1.6) * 0.25, 0, -0.12);
      atalanta.armR.rotation.set(waving ? -2.6 : -0.2, 0, waving ? -0.3 + Math.sin(t * 14) * 0.35 : -0.25);
      // Holding on tight to the mech's head in the air.
      atalanta.armL.rotation.set(air ? -1.8 : -0.1, 0, air ? 0.9 : 0.25);
      atalanta.root.rotation.y = 0.35;
    }
  }
}
