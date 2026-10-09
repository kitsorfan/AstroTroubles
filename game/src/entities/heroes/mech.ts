/**
 * The Gardeners' bronze mech suit (Talos's Forge, chapter 3). Jason and Atalanta find it asleep in the
 * forge and climb in: from then on it is the only hero (see `joinedRoster`), Jason at the controls in its
 * chest and Atalanta on its shoulder. `Player` hands it the controls every frame; it shares the body,
 * hearts and the physics step with the heroes on foot.
 *
 * - Big and heavy: a little slower than Jason, one strong hydraulic jump (no double jump, glide or grapple).
 * - THRUST (the DASH button): a burst of its back jets straight ahead, on the ground or once per jump.
 *   Gravity pauses while it lasts, so a jump and a THRUST carry it over lava channels.
 * - PUNCH (the SPIN button): a one-two of bronze fists. It breaks bronze gates, crates and cracked walls,
 *   and knocks robots flat (and Talos's ankle armour off).
 * - SLAM (SPIN in the air): straight down like a ground pound. It presses red switches and smashes
 *   cracked floors (any heavy landing from high up does too).
 * - CANNON (the BLAST button): a heavy shell on a slow rhythm; HOLD for a BIG BLAST. No overheating.
 */
import * as THREE from 'three';

import { audio } from '../../core/audio';
import { haptic } from '../../core/bridge';
import { BRENNUS, MECH, OUTDOOR, PLAYER } from '../../core/constants';
import type { Input } from '../../core/input';
import { clamp, damp } from '../../core/math';
import type { World } from '../../game/world';
import type { HeroModel } from '../models';
import type { Player } from '../player';
import { Cannon } from './cannon';
import { MECH_COLORS, makeMech, type MechModel } from './mechModel';

export class MechMoves {
  readonly model: MechModel;
  readonly cannon: Cannon;
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
  private shootCd = 0;
  private shootBuf = 0;
  private holdT = 0;
  private wasHeld = false;
  private chargedFx = false;
  private aimT = 0;
  private stepPhase = 0;
  /** Jason (in the cockpit) and Atalanta (on the shoulder), once they have climbed in. */
  private riders: { jason: HeroModel | null; atalanta: HeroModel | null } = { jason: null, atalanta: null };
  private waveT = 4;

  constructor(
    private p: Player,
    private world: World,
  ) {
    this.model = makeMech();
    this.cannon = new Cannon(world);
  }

  /** Punching, slamming or thrusting (no hero switching then, and enemies bumped mid-THRUST don't hurt). */
  get busy() {
    return this.thrustT > 0 || this.slamming || this.punchT > 0;
  }

  get thrusting() {
    return this.thrustT > 0;
  }

  /** Back to normal (teleports, cutscenes). */
  reset() {
    this.thrustT = 0;
    this.punchT = 0;
    this.slamming = false;
    this.p.pounding = false;
    this.holdT = 0;
    this.wasHeld = false;
    this.chargedFx = false;
    this.aimT = 0;
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

  update(dt: number, input: Input) {
    const p = this.p;
    const w = this.world;
    const b = p.body;
    const { wx, wz, mag } = p.moveInput(input);
    this.coyote = b.grounded ? PLAYER.coyote : this.coyote - dt;
    this.jumpBuf -= dt;
    this.thrustCd -= dt;
    this.punchCd -= dt;
    this.shootCd -= dt;
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
      const punching = this.punchT > 0;
      const speed = MECH.speed * (p.inMud ? OUTDOOR.sandSpeed : 1) * (punching ? 0.35 : 1);
      const accel = b.grounded ? (onIce ? PLAYER.iceAccel : PLAYER.accel * 0.7) : PLAYER.airAccel * 0.8;
      p.steer(dt, wx, wz, mag, speed, accel);
    }
    if (this.punchT > 0) this.updatePunch(dt);

    this.updateJump(input);

    // THRUST (the DASH button): on the ground, or once per jump.
    if (input.take('dash')) {
      if (this.thrustCd <= 0 && !this.slamming && (b.grounded || this.coyote > 0 || !this.airThrust)) this.startThrust(wx, wz, mag);
      else audio.play('empty');
    }

    this.updateCannon(dt, input);
    this.cannon.update(dt);

    const ok = p.stepBody(dt, (impact) => {
      if (this.slamming || impact > MECH.heavyLanding) {
        // A SLAM (or a long drop): the ground shakes, switches press, cracked floors give way.
        this.slamming = false;
        p.pounding = false;
        w.groundPound(p);
        w.shake(0.8);
        w.rings.burst(b.x, b.y + 0.05, b.z, 8, MECH_COLORS.glow, 0.45);
      } else if (impact > 6) {
        audio.play('pound', 1.5, 0.5);
        p.squash = 0.16;
        w.shake(0.2);
        w.particles.emit(b.x, b.y + 0.1, b.z, { count: 12, color: '#b8a890', speed: 3, life: 0.4, size: 0.6, gravity: 1 });
      }
    });
    if (!ok) {
      this.reset();
      return;
    }
    this.animate(dt, Math.hypot(p.vx, p.vz) / MECH.speed);
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
      const dmg = MECH.punchDamage + (this.world.save.upgrades.blaster ?? 0);
      const b = p.body;
      const reach = MECH.punchReach - 0.6;
      // `smash` hits just in front of the hero: step the hit point out to the fist first.
      const ox = Math.sin(p.facing) * reach;
      const oz = Math.cos(p.facing) * reach;
      b.x += ox;
      b.z += oz;
      this.world.smash(p, MECH.punchRadius, dmg, this.punchHit);
      b.x -= ox;
      b.z -= oz;
      if (this.punchHit.size === 0) audio.play('dash', 1.6, 0.4);
    }
  }

  private startSlam() {
    this.slamming = true;
    this.p.pounding = true;
    this.thrustT = 0;
    this.punchT = 0;
    audio.play('spin', 0.5);
  }

  /* ---------------- the cannon ---------------- */

  private updateCannon(dt: number, input: Input) {
    const p = this.p;
    const ready = this.thrustT <= 0 && !this.slamming && this.punchT <= 0;
    const held = input.isHeld('shoot');
    this.shootBuf = input.take('shoot') ? PLAYER.shootBuffer : this.shootBuf - dt;
    if (this.shootBuf > 0 && this.shootCd <= 0 && ready) {
      this.shootBuf = 0;
      this.fire(false);
    }
    if (held && ready) {
      this.holdT += dt;
      if (this.holdT > BRENNUS.chargeDelay) {
        if (p.charge === 0) audio.play('charge', 0.7);
        p.charge = Math.min(1, p.charge + dt / BRENNUS.blastCharge);
        if (p.charge >= 1 && !this.chargedFx) {
          this.chargedFx = true;
          audio.play('charged', 0.7);
          haptic('light');
        }
      }
    } else if (this.wasHeld || !ready) {
      if (p.charge >= 1 && ready) this.fire(true);
      p.charge = 0;
      this.holdT = 0;
      this.chargedFx = false;
    }
    this.wasHeld = held && ready;
  }

  /** A shell (or the big blast) from the right forearm, at the best target in front (or straight ahead). */
  private fire(big: boolean) {
    const p = this.p;
    const w = this.world;
    const b = p.body;
    const origin = new THREE.Vector3(b.x, b.y + 1.5, b.z);
    const target = w.findAimTarget(origin, p.facing, MECH.aimRange * (big ? 1.2 : 1));
    let dir: THREE.Vector3;
    if (target) {
      dir = target.aim.clone().sub(origin);
      p.facing = Math.atan2(dir.x, dir.z);
    } else dir = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing));
    dir.normalize();
    origin.x += Math.sin(p.facing) * 1.3 + Math.cos(p.facing) * 1.1;
    origin.z += Math.cos(p.facing) * 1.3 - Math.sin(p.facing) * 1.1;
    const bonus = w.save.upgrades.blaster ?? 0;
    const dmg = big ? BRENNUS.blastDamage + 1 + bonus * 2 : BRENNUS.shellDamage + bonus;
    if (!this.cannon.fire(origin, dir, big, dmg)) return;
    const rapid = w.save.upgrades.rapid ?? 0;
    this.shootCd = big ? 0.6 : MECH.shellCooldown * Math.max(0.6, 1 - rapid * 0.12);
    this.aimT = big ? 0.7 : 0.45;
    p.vx -= dir.x * (big ? 4 : 1);
    p.vz -= dir.z * (big ? 4 : 1);
    w.flash(origin.x, origin.y, origin.z, MECH_COLORS.glow, big ? 50 : 20, 0.2);
    w.particles.emit(origin.x, origin.y, origin.z, { count: big ? 18 : 7, color: '#e8d8b8', speed: 3, life: 0.45, size: 0.7 });
    audio.play(big ? 'fireball' : 'shoot', big ? 0.6 : 0.5);
    if (big) {
      w.shake(0.35);
      haptic('medium');
    }
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
    p.phase += dt * (3 + 5 * speedFrac);
    const s = Math.sin(p.phase);
    if (walk > 0.3) {
      const step = Math.floor(p.phase / Math.PI);
      if (step !== this.stepPhase) {
        this.stepPhase = step;
        this.world.soundAt('pound', b.x, b.z, 1.9, 10);
        this.world.particles.emit(b.x, b.y + 0.05, b.z, { count: 3, color: '#b8a890', speed: 1.5, life: 0.35, size: 0.6, gravity: 1 });
      }
    }
    m.legL.rotation.set(air ? (this.slamming ? -0.2 : -0.6) : s * 0.55 * walk, 0, 0);
    m.legR.rotation.set(air ? (this.slamming ? -0.2 : 0.3) : -s * 0.55 * walk, 0, 0);
    m.armL.rotation.set(air ? -0.5 : -s * 0.4 * walk, 0, air ? -0.5 : 0.06);
    m.armR.rotation.set(air ? -0.5 : s * 0.4 * walk, 0, air ? 0.5 : -0.06);
    m.body.position.y = air ? 0 : Math.abs(s) * 0.08 * walk;
    m.body.rotation.set(this.thrustT > 0 ? 0.3 : walk * 0.05, 0, Math.sin(p.phase) * 0.03 * walk);
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
    // The cannon arm comes up to aim while it shoots or charges a blast.
    if ((this.aimT > 0 || p.charge > 0) && this.punchT <= 0 && !this.slamming) m.armR.rotation.set(-1.5, 0, 0.05);
    const glow = p.charge > 0 ? 0.5 + p.charge * 2 + (p.charge >= 1 ? Math.sin(p.phase * 3) * 0.3 : 0) : 0;
    m.chargeGlow.scale.setScalar(Math.max(0.001, glow));
    const jet = this.thrustT > 0 ? 1.6 + Math.random() * 0.4 : air ? 0.6 : 0.001;
    for (const j of m.jets) j.scale.setScalar(damp(j.scale.x, jet, 20, dt));
    m.lines.emissiveIntensity = 1 + this.world.darkness * 1.5 + (this.thrustT > 0 ? 1 : 0);
    m.visor.emissiveIntensity = 1.3 + this.world.darkness * 1.4;
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
