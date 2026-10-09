/**
 * General Brennus's moves (chapter 3, on his own levels). While he is the playing hero, `Player` hands
 * him the controls every frame; he shares the body, hearts, armor and the physics step with Jason.
 *
 * - Slower than Jason, with one low jump (no jet boots, no grapple, no glide).
 * - CANNON (the BLAST button): a heavy shell that splashes where it lands. HOLD for the BIG BLAST, which
 *   smashes cracked walls and knocks robots' shields away. No clip: a short cooldown and an overheat
 *   meter instead (too many shots in a row and the cannon has to cool down).
 * - SHIELD (the SPIN button, held): a big shield in front of him. It blocks every shot and bump from the
 *   front (shots bounce back), but he walks slowly behind it. Let go to BASH forward.
 * - CHARGE (the DASH button): a shoulder charge that smashes crates and cracked walls and knocks robots
 *   over. Jump during it for a CHARGE-LEAP, the only way he gets across wide gaps.
 * - STOMP (SPIN in the air): a heavy landing that presses red switches like Jason's ground pound.
 * - COMMAND (the action button) at a Legion command post: see `heroes/legion.ts`.
 */
import * as THREE from 'three';

import { audio } from '../../core/audio';
import { haptic } from '../../core/bridge';
import { BRENNUS, OUTDOOR, PLAYER } from '../../core/constants';
import type { Input } from '../../core/input';
import { clamp, damp, dampAngle } from '../../core/math';
import type { World } from '../../game/world';
import type { Player } from '../player';
import { BRENNUS_COLORS, makeBrennus, type BrennusModel } from './brennusModel';
import { Cannon } from './cannon';

export class BrennusMoves {
  readonly model: BrennusModel;
  readonly cannon: Cannon;
  private coyote = 0;
  private jumpBuf = 0;
  private cut = true;
  private chargeT = 0;
  private chargeCd = 0;
  private chargeHit = new Set<unknown>();
  /** In the air after jumping out of a charge: he keeps a good part of its speed. */
  private leaping = false;
  /** SHIELD held, and the bash when it is let go. */
  shieldUp = false;
  private bashT = 0;
  private bashHit = new Set<unknown>();
  stomping = false;
  /** Cannon heat (0..1) and seconds left cooling after an overheat. */
  heat = 0;
  overheatT = 0;
  private shootCd = 0;
  private shootBuf = 0;
  private holdT = 0;
  private wasHeld = false;
  private chargedFx = false;
  private aimT = 0;
  private hinted = false;

  constructor(
    private p: Player,
    private world: World,
  ) {
    this.model = makeBrennus();
    this.cannon = new Cannon(world);
  }

  /** Charging or bashing (no hero switching then, and enemies bumped into don't hurt). */
  get busy() {
    return this.chargeT > 0 || this.bashT > 0 || this.stomping;
  }

  get charging() {
    return this.chargeT > 0 || this.bashT > 0;
  }

  /** True if the raised shield (or a bash) faces a hit coming from (x, z). */
  blocks(x: number, z: number): boolean {
    if (!this.shieldUp && this.bashT <= 0) return false;
    const b = this.p.body;
    const dx = x - b.x;
    const dz = z - b.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.05) return true;
    return (dx * Math.sin(this.p.facing) + dz * Math.cos(this.p.facing)) / d > BRENNUS.shieldArc;
  }

  /** A blocked hit: a clang and sparks off the shield. */
  clang() {
    const b = this.p.body;
    const f = this.p.facing;
    this.world.particles.emit(b.x + Math.sin(f) * 0.8, b.y + 1.1, b.z + Math.cos(f) * 0.8, { count: 12, color: '#ffd166', speed: 5, life: 0.3, size: 0.4 });
    audio.play('shield', 1.1);
    haptic('light');
    this.model.shield.position.z = 0.02;
  }

  /** Back to normal (teleports, cutscenes). */
  reset() {
    this.chargeT = 0;
    this.bashT = 0;
    this.leaping = false;
    this.shieldUp = false;
    this.stomping = false;
    this.p.pounding = false;
    this.holdT = 0;
    this.wasHeld = false;
    this.chargedFx = false;
    this.aimT = 0;
  }

  launched() {
    this.leaping = false;
    this.stomping = false;
    this.cut = true;
  }

  update(dt: number, input: Input) {
    const p = this.p;
    const w = this.world;
    const b = p.body;
    const { wx, wz, mag } = p.moveInput(input);
    this.coyote = b.grounded ? PLAYER.coyote : this.coyote - dt;
    this.jumpBuf -= dt;
    this.chargeCd -= dt;
    this.shootCd -= dt;
    this.aimT = Math.max(0, this.aimT - dt);
    if (b.grounded) this.leaping = false;

    // SHIELD: held on the ground; letting go bashes.
    const held = input.isHeld('spin') && b.grounded && this.chargeT <= 0 && !this.stomping;
    if (input.take('spin') && !b.grounded && !this.stomping && b.y > p.groundBelow() + 0.9) this.startStomp();
    if (this.shieldUp && !held) this.startBash();
    if (held && !this.shieldUp) {
      this.shieldUp = true;
      audio.play('shield', 0.8);
    }

    if (this.chargeT > 0) this.updateCharge(dt);
    else if (this.bashT > 0) this.updateBash(dt);
    else if (this.stomping) {
      p.vx = 0;
      p.vz = 0;
      b.vy = -BRENNUS.stompSpeed;
    } else {
      const onIce = b.grounded && b.ground?.kind === 'ice';
      const base = this.shieldUp ? BRENNUS.shieldSpeed : this.leaping ? BRENNUS.leapSpeed : BRENNUS.speed;
      const speed = base * (p.carrying ? 0.85 : 1) * (p.inMud ? OUTDOOR.sandSpeed : 1);
      const accel = b.grounded ? (onIce ? PLAYER.iceAccel : PLAYER.accel * 0.8) : this.leaping ? PLAYER.airAccel * 0.6 : PLAYER.airAccel;
      // During a leap he keeps going the way he charged, unless the stick says otherwise.
      if (this.leaping && mag < 0.1) p.steer(dt, Math.sin(p.facing), Math.cos(p.facing), 1, speed, accel);
      else p.steer(dt, wx, wz, mag, speed, accel);
      // Behind the shield he turns slowly, so it's easy to keep it pointed at trouble.
      if (this.shieldUp && mag > 0.1) p.facing = dampAngle(p.facing, Math.atan2(wx, wz), 5, dt);
    }

    this.updateJump(input);

    // CHARGE (the DASH button): only from the ground, buffered a moment so a press just before landing counts.
    if (input.take('dash')) {
      if (b.grounded && this.chargeCd <= 0 && !this.stomping) this.startCharge(wx, wz, mag);
      else if (b.grounded) audio.play('empty');
    }

    this.updateCannon(dt, input);
    this.cannon.update(dt);

    const ok = p.stepBody(dt, (impact) => {
      if (this.stomping) {
        this.stomping = false;
        p.pounding = false;
        w.groundPound(p);
        w.shake(0.75);
      } else if (impact > 8) {
        audio.play('land', 0.8);
        p.squash = 0.14;
        w.particles.emit(b.x, b.y + 0.1, b.z, { count: 8, color: '#c8b8a0', speed: 2, life: 0.35, size: 0.45, gravity: 1 });
      }
    });
    if (!ok) {
      this.reset();
      return;
    }
    this.animate(dt, Math.hypot(p.vx, p.vz) / BRENNUS.speed);
  }

  private updateJump(input: Input) {
    const p = this.p;
    const b = p.body;
    if (input.take('jump')) this.jumpBuf = PLAYER.jumpBuffer;
    if (this.jumpBuf > 0 && this.coyote > 0 && !this.shieldUp && this.bashT <= 0) {
      // Jumping out of a charge is a CHARGE-LEAP: it keeps most of the charge's speed.
      if (this.chargeT > 0) {
        this.chargeT = 0;
        this.leaping = true;
        p.noteMove('leap');
        p.vx = Math.sin(p.facing) * BRENNUS.leapSpeed;
        p.vz = Math.cos(p.facing) * BRENNUS.leapSpeed;
        audio.play('djump', 0.7);
      } else audio.play('jump', 0.8);
      b.vy = BRENNUS.jumpV;
      this.coyote = 0;
      this.jumpBuf = 0;
      this.cut = false;
      this.world.particles.emit(b.x, b.y + 0.1, b.z, { count: 10, color: '#d8ccb8', speed: 2.5, life: 0.35, size: 0.5, gravity: 2 });
    }
    if (!input.isHeld('jump') && b.vy > 0 && !this.cut) {
      b.vy *= PLAYER.jumpCut;
      this.cut = true;
    }
  }

  /* ---------------- charge, bash and stomp ---------------- */

  private startCharge(wx: number, wz: number, mag: number) {
    const p = this.p;
    if (mag > 0.1) p.facing = Math.atan2(wx, wz);
    this.shieldUp = false;
    this.chargeT = BRENNUS.chargeTime;
    this.chargeCd = BRENNUS.chargeTime + BRENNUS.chargeCooldown;
    this.chargeHit.clear();
    audio.play('dash', 0.7);
    audio.play('roar', 1.6, 0.4);
    haptic('medium');
  }

  /** The charge itself: straight ahead along the ground, smashing whatever is in front of him. */
  private updateCharge(dt: number) {
    const p = this.p;
    const b = p.body;
    this.chargeT -= dt;
    p.vx = Math.sin(p.facing) * BRENNUS.chargeSpeed;
    p.vz = Math.cos(p.facing) * BRENNUS.chargeSpeed;
    if (Math.random() < 0.8) this.world.particles.emit(b.x, b.y + 0.15, b.z, { count: 2, color: '#c8b8a0', speed: 1.8, life: 0.4, size: 0.6, up: 1 });
    this.world.smash(p, BRENNUS.chargeRadius, BRENNUS.chargeDamage + (this.world.save.upgrades.blaster ?? 0), this.chargeHit);
    // Running into a wall ends it with a thump.
    if (b.bumped) {
      this.chargeT = 0;
      this.world.shake(0.3);
      audio.play('pound', 1.3, 0.6);
    }
  }

  private startBash() {
    this.shieldUp = false;
    if (!this.p.body.grounded) return;
    this.bashT = BRENNUS.bashTime;
    this.bashHit.clear();
    audio.play('dash', 1.1, 0.6);
  }

  /** Letting go of the shield shoves it forward: a short, heavy bash. */
  private updateBash(dt: number) {
    const p = this.p;
    this.bashT -= dt;
    const k = Math.max(0, this.bashT / BRENNUS.bashTime);
    p.vx = Math.sin(p.facing) * BRENNUS.bashSpeed * k;
    p.vz = Math.cos(p.facing) * BRENNUS.bashSpeed * k;
    this.world.smash(p, 1.2, BRENNUS.bashDamage, this.bashHit);
  }

  private startStomp() {
    this.stomping = true;
    this.p.pounding = true;
    this.chargeT = 0;
    this.leaping = false;
    audio.play('spin', 0.8);
  }

  /* ---------------- the cannon ---------------- */

  /** True while the cannon is too hot to fire. */
  get overheated() {
    return this.overheatT > 0;
  }

  private addHeat(n: number) {
    this.heat = Math.min(1, this.heat + n);
    if (this.heat < 1) return;
    this.overheatT = BRENNUS.overheat;
    this.p.charge = 0;
    audio.play('fail', 0.8);
    this.world.particles.emit(this.p.body.x, this.p.body.y + 1.4, this.p.body.z, { count: 16, color: '#d8d8d8', speed: 2, up: 3, life: 0.9, size: 0.8, gravity: -1 });
    if (!this.hinted) {
      this.hinted = true;
      this.world.hooks.toast('Overheated! Wait a moment for the cannon to cool down.', 'brennus');
    }
  }

  private updateCannon(dt: number, input: Input) {
    const p = this.p;
    if (this.overheatT > 0) {
      this.overheatT -= dt;
      this.heat = Math.max(0, this.overheatT / BRENNUS.overheat);
      if (this.overheatT <= 0) {
        this.heat = 0;
        audio.play('reload', 0.9);
      }
    } else this.heat = Math.max(0, this.heat - BRENNUS.cool * dt);
    const ready = !this.overheated && !this.shieldUp && this.chargeT <= 0 && this.bashT <= 0 && !this.stomping;
    const held = input.isHeld('shoot');
    this.shootBuf = input.take('shoot') ? PLAYER.shootBuffer : this.shootBuf - dt;
    if (this.shootBuf > 0 && this.shootCd <= 0) {
      this.shootBuf = 0;
      if (ready) this.fire(false);
      else if (this.overheated) audio.play('empty');
    }
    if (held && ready) {
      this.holdT += dt;
      if (this.holdT > BRENNUS.chargeDelay) {
        if (p.charge === 0) audio.play('charge', 0.8);
        p.charge = Math.min(1, p.charge + dt / BRENNUS.blastCharge);
        if (p.charge >= 1 && !this.chargedFx) {
          this.chargedFx = true;
          audio.play('charged', 0.8);
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

  /** Fires a shell, or the big blast, at the best target in front (or straight ahead). */
  private fire(big: boolean) {
    const p = this.p;
    const w = this.world;
    const b = p.body;
    const origin = new THREE.Vector3(b.x, b.y + 1.15, b.z);
    const target = w.findAimTarget(origin, p.facing, BRENNUS.aimRange * (big ? 1.2 : 1));
    let dir: THREE.Vector3;
    if (target) {
      dir = target.aim.clone().sub(origin);
      p.facing = Math.atan2(dir.x, dir.z);
    } else dir = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing));
    dir.normalize();
    origin.x += Math.sin(p.facing) * 0.9 + Math.cos(p.facing) * 0.45;
    origin.z += Math.cos(p.facing) * 0.9 - Math.sin(p.facing) * 0.45;
    const bonus = w.save.upgrades.blaster ?? 0;
    const dmg = big ? BRENNUS.blastDamage + bonus * 2 : BRENNUS.shellDamage + bonus;
    if (!this.cannon.fire(origin, dir, big, dmg)) return;
    const rapid = w.save.upgrades.rapid ?? 0;
    this.shootCd = big ? 0.5 : BRENNUS.shellCooldown * Math.max(0.6, 1 - rapid * 0.12);
    this.aimT = big ? 0.6 : 0.4;
    // Rapid Fire also lets the cannon run a little cooler.
    this.addHeat((big ? BRENNUS.heatBlast : BRENNUS.heatShell) * Math.max(0.6, 1 - rapid * 0.1));
    p.vx -= dir.x * (big ? 5 : 1.5);
    p.vz -= dir.z * (big ? 5 : 1.5);
    w.flash(origin.x, origin.y, origin.z, BRENNUS_COLORS.glow, big ? 45 : 18, 0.2);
    w.particles.emit(origin.x, origin.y, origin.z, { count: big ? 16 : 6, color: '#d8ccb8', speed: 3, life: 0.4, size: 0.6 });
    audio.play(big ? 'fireball' : 'shoot', big ? 0.75 : 0.65);
    if (big) {
      w.shake(0.3);
      haptic('medium');
    }
  }

  /* ---------------- animation ---------------- */

  animate(dt: number, speedFrac: number) {
    const p = this.p;
    const m = this.model;
    const b = p.body;
    p.placeModel(m, dt, p.sink * 0.35);
    const air = !b.grounded;
    // A heavy, steady march.
    p.phase += dt * (4 + 7 * speedFrac);
    const s = Math.sin(p.phase);
    const walk = air ? 0 : clamp(speedFrac, 0, 1.3);
    const charging = this.chargeT > 0 || this.bashT > 0;
    m.legL.rotation.set(air ? (this.stomping ? -1.2 : -0.5) : s * 0.75 * walk, 0, 0);
    m.legR.rotation.set(air ? (this.stomping ? -1.2 : 0.3) : -s * 0.75 * walk, 0, 0);
    m.armL.rotation.set(air ? -0.8 : -s * 0.5 * walk, 0, air ? -0.3 : 0.08);
    m.armR.rotation.set(air ? -0.8 : s * 0.5 * walk - 0.15, 0, air ? 0.3 : -0.08);
    m.body.position.y = air ? 0 : Math.abs(s) * 0.06 * walk;
    m.body.rotation.set(charging ? 0.45 : walk * 0.06, m.body.rotation.y, 0);
    if (this.stomping) m.body.rotation.x = 0.25;
    // The shield: strapped to his left arm, or held up in front of him (pushed forward in a bash).
    const raised = this.shieldUp || this.bashT > 0 || this.chargeT > 0;
    if (raised) {
      m.armL.rotation.set(-1.45, 0.35, -0.15);
      m.shield.rotation.set(Math.PI / 2, 0, 0);
      m.shield.position.set(0.32, -0.62, damp(m.shield.position.z, this.bashT > 0 ? 0.35 : 0.12, 14, dt));
    } else {
      m.shield.rotation.set(0, -Math.PI / 2, 0);
      m.shield.position.set(-0.08, -0.4, 0.14);
    }
    // The cannon arm comes up to aim while he shoots or charges a blast.
    if ((this.aimT > 0 || p.charge > 0) && !raised) m.armR.rotation.set(-1.5, 0, 0.05);
    const glow = p.charge > 0 ? 0.4 + p.charge * 1.8 + (p.charge >= 1 ? Math.sin(p.phase * 3) * 0.3 : 0) : 0;
    m.chargeGlow.scale.setScalar(Math.max(0.001, glow));
    m.heat.emissiveIntensity = this.heat * 2.4 + (this.overheated ? Math.sin(p.phase * 4) * 0.5 + 0.5 : 0);
    if (this.overheated && Math.random() < 0.2) {
      const f = p.facing;
      this.world.particles.emit(b.x + Math.cos(f) * 0.55, b.y + 1.3, b.z - Math.sin(f) * 0.55, { count: 1, color: '#d8d8d8', speed: 0.6, up: 2, life: 0.8, size: 0.5, gravity: -1 });
    }
    m.sprout.rotation.z = Math.sin(p.phase) * 0.12 * walk;
    m.body.rotation.y = damp(m.body.rotation.y % (Math.PI * 2), 0, 20, dt);
    p.squash = Math.max(0, p.squash - dt);
    const sq = p.squash > 0 ? 1 - p.squash * 1.6 : 1;
    m.body.scale.set(2 - sq, sq, 2 - sq);
    m.visor.emissiveIntensity = 0.6 + this.world.darkness * 1.4;
    p.fx.update(dt, b.x, p.renderY, b.z, { pounding: this.stomping, hang: 0, hangMax: 1, airborne: air });
    p.pose?.(m, dt);
  }
}
