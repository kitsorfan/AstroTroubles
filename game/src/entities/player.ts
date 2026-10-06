import * as THREE from 'three';

import { audio } from '../core/audio';
import { haptic } from '../core/bridge';
import { CELL, DEATH_Y, GRAPPLE, OUTDOOR, PLAYER } from '../core/constants';
import type { Input } from '../core/input';
import { clamp, damp, dampAngle } from '../core/math';
import type { World } from '../game/world';
import { Grid } from '../world/grid';
import type { Ability } from '../world/levelTypes';
import { makeBody, moveBody, type Body } from '../world/physics';
import { dressJason, makeJason, type JasonModel } from './models';
import { JasonFx } from './moveFx';

/** How long Jason hangs in the air (and flips) before a ground pound slams down. */
const POUND_HANG = 0.18;

const tmp = new THREE.Vector3();

export class Player {
  readonly body: Body;
  readonly model: JasonModel;
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
  private spinT = 0;
  private spinHit = new Set<unknown>();
  /** Spins left before the long recharge. */
  spins: number = PLAYER.spinCharges;
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
  private sink = 0;
  private sinceShot = 99;
  private chargedFx = false;
  private blinkT = 2;
  gliding = false;
  private squash = 0;
  private phase = 0;
  private renderY: number;
  private safe = new THREE.Vector3();
  private safeT = 0;
  private wasGrounded = true;
  private airTime = 0;
  private vx = 0;
  private vz = 0;
  down = false;
  carrying: THREE.Object3D | null = null;
  private fx: JasonFx;
  /** Seconds since the last hit; the HUD uses it to show hearts. */
  sinceHurt = 99;
  /** Lets a cutscene pose Jason's model (called after the normal animation each frame). */
  pose: ((m: JasonModel, dt: number) => void) | null = null;

  constructor(
    private world: World,
    x: number,
    y: number,
    z: number,
    facing: number,
  ) {
    this.body = makeBody(x, y, z, PLAYER.radius, PLAYER.height);
    this.body.grounded = true;
    this.model = makeJason();
    dressJason(this.model, world.save.upgrades);
    this.facing = facing;
    this.hearts = world.save.maxHearts;
    this.ammo = this.clipSize;
    this.renderY = y;
    this.safe.set(x, y, z);
    world.scene.add(this.model.root);
    this.fx = new JasonFx(world.scene);
  }

  /** Puts on the gear for any newly bought upgrades, with a little sparkle when something changed. */
  refreshGear() {
    const before = this.model.gearKey;
    dressJason(this.model, this.world.save.upgrades);
    if (this.model.gearKey === before) return;
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
    this.zip = { from, to, hook: hook.clone(), k: 0, time: GRAPPLE.time + from.distanceTo(to) * GRAPPLE.timePerUnit };
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

  get clipSize() {
    return PLAYER.clip + (this.world.save.upgrades.clip ?? 0) * 2;
  }

  get reloading() {
    return this.reloadT > 0;
  }

  /** 0..1 while reloading. */
  get reloadProgress() {
    return this.reloadT > 0 ? 1 - this.reloadT / this.reloadTime : 0;
  }

  private get reloadTime() {
    return PLAYER.reloadTime * (1 - (this.world.save.upgrades.rapid ?? 0) * 0.2);
  }

  /** True while a ground spin is whirling (and guarding Jason). */
  get spinning() {
    return this.spinT > 0;
  }

  get dashing() {
    return this.dashT > 0;
  }

  /** 0..1 while the spins recharge. */
  get spinReloadProgress() {
    return this.spinReloadT > 0 ? 1 - this.spinReloadT / this.spinReloadMax : 0;
  }

  private startSpinReload() {
    const missing = PLAYER.spinCharges - this.spins;
    this.spinReloadMax = (PLAYER.spinReload * missing) / PLAYER.spinCharges;
    this.spinReloadT = this.spinReloadMax;
  }

  /** Tops up dash energy; returns true if anything was added. */
  gainEnergy(n: number): boolean {
    if (this.energy >= PLAYER.dashEnergy) return false;
    this.energy = Math.min(PLAYER.dashEnergy, this.energy + n);
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
  }

  revive() {
    this.down = false;
    this.hearts = this.world.save.maxHearts;
    this.ammo = this.clipSize;
    this.reloadT = 0;
    this.charge = 0;
    this.energy = PLAYER.dashEnergy;
    this.spins = PLAYER.spinCharges;
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
    if (this.down || w.cutscene) {
      this.cancelCharge();
      this.zip = null;
      this.animate(dt, 0);
      return;
    }
    if (this.zip) {
      this.updateZip(dt);
      return;
    }
    // Quicksand slows Jason down while he is in it; out of it, he climbs back up.
    this.mudT -= dt;
    if (this.mudT <= 0) this.sink = Math.max(0, this.sink - dt * 2);

    // Camera-relative movement.
    const yaw = w.cameraYaw;
    const mx = input.moveX;
    const mz = input.moveZ;
    let wx = Math.cos(yaw) * mx + Math.sin(yaw) * mz;
    let wz = -Math.sin(yaw) * mx + Math.cos(yaw) * mz;
    const len = Math.hypot(wx, wz);
    const mag = Math.min(1, len);
    if (len > 0.01) {
      wx /= len;
      wz /= len;
    }

    const ground = b.grounded ? b.ground : null;
    const onIce = ground?.kind === 'ice';
    const accel = b.grounded ? (onIce ? PLAYER.iceAccel : PLAYER.accel) : PLAYER.airAccel;
    const speed = PLAYER.speed * (this.carrying ? 0.85 : 1) * (this.mudT > 0 ? OUTDOOR.sandSpeed : 1);

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
      const tx = wx * mag * speed;
      const tz = wz * mag * speed;
      const k = 1 - Math.exp(-(accel / speed) * dt * 1.6);
      this.vx += (tx - this.vx) * k;
      this.vz += (tz - this.vz) * k;
      if (mag > 0.1 && this.spinT <= 0) this.facing = dampAngle(this.facing, Math.atan2(wx, wz), 16, dt);
    }

    // Timers.
    this.coyote = b.grounded ? PLAYER.coyote : this.coyote - dt;
    this.jumpBuf -= dt;
    this.dashCd -= dt;
    this.shootCd -= dt;
    this.shootPose = Math.max(0, this.shootPose - dt);
    this.sinceSpin += dt;
    if (this.spinReloadT > 0) {
      this.spinReloadT -= dt;
      if (this.spinReloadT <= 0) {
        this.spinReloadT = 0;
        this.spins = PLAYER.spinCharges;
        audio.play('reload', 1.6);
        w.hooks.hud();
      }
    } else if (this.spins < PLAYER.spinCharges && this.sinceSpin > PLAYER.spinTopUp) {
      this.startSpinReload();
    }
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
    if (input.take('spin') && !this.pounding) {
      if (b.grounded || this.airTime < 0.05) {
        if (this.spinT <= 0 && this.spins > 0) {
          this.spins -= 1;
          this.sinceSpin = 0;
          this.spinReloadT = 0;
          if (this.spins === 0) this.startSpinReload();
          this.spinT = PLAYER.spinTime;
          this.fx.spin(PLAYER.spinTime);
          this.spinHit.clear();
          audio.play('spin');
          w.hooks.hud();
        } else if (this.spinT <= 0) {
          audio.play('empty');
        }
      } else if (b.y > this.groundBelow() + 0.9) {
        this.pounding = true;
        this.poundHang = POUND_HANG;
        this.dashT = 0;
        audio.play('spin', 1.4);
      }
    }
    if (this.spinT > 0) {
      this.spinT -= dt;
      w.spinAttack(this, this.spinHit);
    }
    if (this.pounding) {
      if (this.poundHang > 0) {
        this.poundHang -= dt;
        b.vy = 2;
      } else {
        b.vy = -PLAYER.poundSpeed;
      }
    }

    // Blaster: tap to shoot (limited clip, then reload); hold to charge a big fireball.
    this.updateBlaster(dt, input);

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
      const impact = -vyBefore;
      if (this.pounding) {
        this.pounding = false;
        w.groundPound(this);
      } else if (impact > 8) {
        audio.play('land');
        this.squash = 0.12;
        w.particles.emit(b.x, b.y + 0.1, b.z, { count: 6, color: '#ffffff', speed: 2, life: 0.3, size: 0.35, gravity: 1 });
      }
      this.airTime = 0;
      const fx = w.floorEffect(b.ground);
      fx?.land?.(this);
    }
    if (b.grounded) {
      const fx = w.floorEffect(b.ground);
      fx?.stand?.(this, dt);
      if (b.ground?.kind === 'hazard') {
        this.fellOff();
        return;
      }
      this.safeT -= dt;
      if (this.safeT <= 0 && b.ground && b.ground.kind !== 'box' && !fx?.unsafe) {
        const c = w.grid.cell(b.ground.cx, b.ground.cz);
        this.safe.set(Grid.center(b.ground.cx), c.h, Grid.center(b.ground.cz));
        this.safeT = 0.25;
      }
    }
    this.wasGrounded = b.grounded;
    if (b.y < DEATH_Y) {
      this.fellOff();
      return;
    }

    this.animate(dt, Math.hypot(this.vx, this.vz) / PLAYER.speed);
  }

  private groundBelow(): number {
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
          this.world.particles.emit(gx + Math.cos(a) * 1.1, b.y + 1 + Math.sin(a) * 0.8, gz + Math.sin(a) * 1.1, { count: 1, color: this.charge >= 1 ? '#ffd166' : '#ff9a3d', speed: 0.2, life: 0.25, size: 0.35, gravity: 0 });
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
  private aimShot(range: number): [THREE.Vector3, THREE.Vector3] {
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
    return [origin, dir];
  }

  private shoot() {
    const w = this.world;
    const rapid = w.save.upgrades.rapid ?? 0;
    this.shootCd = PLAYER.shootCooldown * (1 - rapid * 0.15);
    const [origin, dir] = this.aimShot(PLAYER.aimRange);
    w.shots.fire('player', origin, dir, PLAYER.shotSpeed, 1 + (w.save.upgrades.blaster ?? 0));
    this.ammo -= 1;
    this.sinceShot = 0;
    this.shootPose = 0.18;
    audio.play('shoot', 0.95 + Math.random() * 0.1);
    if (this.ammo <= 0) this.startReload();
    w.hooks.hud();
  }

  private fireball() {
    const w = this.world;
    const [origin, dir] = this.aimShot(PLAYER.aimRange + 4);
    const dmg = 4 + (w.save.upgrades.blaster ?? 0) * 2;
    if (!w.shots.fire('fireball', origin, dir, PLAYER.fireballSpeed, dmg)) return;
    this.ammo = Math.max(0, this.ammo - PLAYER.fireballCost);
    this.sinceShot = 0;
    this.shootPose = 0.4;
    this.shootCd = 0.4;
    // A kick of recoil.
    this.vx -= dir.x * 4;
    this.vz -= dir.z * 4;
    audio.play('fireball');
    haptic('medium');
    w.shake(0.25);
    w.flash(origin.x, origin.y, origin.z, '#ffb04a', 30, 0.25);
    if (this.ammo <= 0) this.startReload();
    w.hooks.hud();
  }

  private animate(dt: number, speedFrac: number) {
    const m = this.model;
    const b = this.body;
    this.renderY = b.grounded ? damp(this.renderY, b.y, 22, dt) : b.y;
    if (Math.abs(this.renderY - b.y) > 1.2) this.renderY = b.y;
    m.root.position.set(b.x, this.renderY - Math.min(0.9, this.sink * 0.35), b.z);
    m.root.rotation.y = this.facing;
    const shadow = m.root.children[m.root.children.length - 1];
    shadow.position.y = Math.max(0.02, this.groundBelow() - this.renderY + 0.03);
    shadow.visible = this.groundBelow() > -50;

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
    m.gunGlow.material.color.set(this.charge >= 1 ? '#ffd166' : '#ff9a3d');
    this.blinkT -= dt;
    const blink = this.blinkT < 0.12;
    if (this.blinkT < 0) this.blinkT = 2 + Math.random() * 3;
    for (const e of m.eyes) e.scale.y = blink ? 0.12 : 1;
    m.root.visible = this.invuln <= 0 || Math.floor(this.invuln * 12) % 2 === 0 || this.down;
    if (this.carrying) this.carrying.rotation.y += dt * 2;
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
