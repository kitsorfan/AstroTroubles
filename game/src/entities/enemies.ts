import * as THREE from 'three';

import { audio } from '../core/audio';
import { CELL } from '../core/constants';
import { damp, dampAngle } from '../core/math';
import type { World } from '../game/world';
import { Grid } from '../world/grid';
import type { EnemyKind } from '../world/levelTypes';
import { makeBody, moveBody, type Body } from '../world/physics';
import { Entity, type HitKind, type Target } from './entity';
import { makeBrute, makeBuzzer, makeSentry, makeSnapper, makeSporeling, makeTurret, type EnemyModel } from './aliens';

const v3 = new THREE.Vector3();
const WHITE = new THREE.Color('#ffffff');

export abstract class Enemy extends Entity implements Target {
  hp: number;
  readonly maxHp: number;
  readonly body: Body;
  readonly aim = new THREE.Vector3();
  radius: number;
  aimable = true;
  room?: string;
  protected aggro = false;
  protected flashT = 0;
  protected stagger = 0;
  protected yaw = Math.PI;
  protected home: THREE.Vector3;
  protected t = Math.random() * 10;
  protected contact = true;
  protected flying = false;
  protected aimHeight = 0.6;
  bolts = 3;
  heartChance = 0.12;
  private flashBase: { m: THREE.MeshStandardMaterial; e: THREE.Color; i: number }[] = [];
  private flashing = false;

  constructor(
    world: World,
    id: string,
    x: number,
    y: number,
    z: number,
    hp: number,
    radius: number,
    readonly model: EnemyModel,
  ) {
    super(world, id);
    this.hp = hp;
    this.maxHp = hp;
    this.radius = radius;
    this.body = makeBody(x, y, z, radius, radius * 2);
    this.home = new THREE.Vector3(x, y, z);
    this.obj.add(model.root);
    this.flashBase = model.flash.map((m) => ({ m, e: m.emissive.clone(), i: m.emissiveIntensity }));
  }

  protected get player() {
    return this.world.player;
  }

  protected distToPlayer() {
    const p = this.player.body;
    return Math.hypot(p.x - this.body.x, p.z - this.body.z);
  }

  protected facePlayer(dt: number, speed = 8) {
    const p = this.player.body;
    this.yaw = dampAngle(this.yaw, Math.atan2(p.x - this.body.x, p.z - this.body.z), speed, dt);
  }

  /** True if walking toward (dx, dz) stays on safe floor of about the same height. */
  protected safeAhead(dx: number, dz: number) {
    const g = this.world.grid;
    const d = Math.hypot(dx, dz) || 1;
    const ax = this.body.x + (dx / d) * (this.radius + 0.6);
    const az = this.body.z + (dz / d) * (this.radius + 0.6);
    const here = g.cell(Grid.toCell(this.body.x), Grid.toCell(this.body.z));
    const c = g.cell(Grid.toCell(ax), Grid.toCell(az));
    if (c.kind === 'void' || c.kind === 'wall' || c.kind === 'hazard') return false;
    return Math.abs(c.h - here.h) < 0.6;
  }

  hit(dmg: number, kind: HitKind, from: THREE.Vector3): boolean {
    if (!this.alive) return false;
    if (!this.canBeHit(kind, from)) {
      audio.play('zap', 1.8);
      this.world.particles.emit(this.aim.x, this.aim.y, this.aim.z, { count: 6, color: '#7fe6ff', speed: 3, life: 0.25, size: 0.35 });
      return true;
    }
    this.hp -= dmg;
    this.aggro = true;
    this.flashT = 0.12;
    this.stagger = kind === 'shot' ? 0.12 : 0.35;
    const dx = this.body.x - from.x;
    const dz = this.body.z - from.z;
    const d = Math.hypot(dx, dz) || 1;
    const kb = kind === 'shot' || kind === 'zap' ? 2.5 : 9;
    if (!this.flying) {
      this.body.vx += (dx / d) * kb;
      this.body.vz += (dz / d) * kb;
      if (kind !== 'shot') this.body.vy = Math.max(this.body.vy, 4);
    }
    this.world.particles.emit(this.aim.x, this.aim.y, this.aim.z, { count: 7, color: '#ffffff', speed: 4, life: 0.25, size: 0.35 });
    if (this.hp <= 0) this.die();
    return true;
  }

  protected canBeHit(_kind: HitKind, _from: THREE.Vector3) {
    return true;
  }

  die() {
    if (!this.alive) return;
    audio.play('pop');
    const c = this.model.flash[0]?.color ?? new THREE.Color('#ffffff');
    this.world.particles.emit(this.aim.x, this.aim.y, this.aim.z, { count: 26, color: c, speed: 7, life: 0.7, size: 0.6, up: 2 });
    this.world.particles.emit(this.aim.x, this.aim.y, this.aim.z, { count: 10, color: '#ffffff', speed: 4, life: 0.4, size: 0.4 });
    this.world.dropBolts(this.aim, this.bolts);
    if (Math.random() < this.heartChance) this.world.dropHeart(this.aim);
    this.world.enemyDied(this);
    this.remove();
  }

  protected abstract think(dt: number): void;

  update(dt: number) {
    if (!this.alive) return;
    this.t += dt;
    const dist = this.distToPlayer();
    if (!this.aggro && dist < 11 && Math.abs(this.player.body.y - this.body.y) < 5) this.aggro = true;
    if (this.aggro && dist > 30) this.aggro = false;
    if (this.stagger > 0 || this.world.cutscene) {
      // Staggered, or holding still while a cutscene plays (gravity still applies).
      this.stagger -= dt;
      this.body.vx = damp(this.body.vx, 0, 6, dt);
      this.body.vz = damp(this.body.vz, 0, 6, dt);
    } else {
      this.think(dt);
    }
    if (!this.flying) {
      moveBody(this.body, dt, this.world.grid, this.world.boxes, { stepUp: 0.55 });
      if (this.body.y < -12) {
        this.die();
        return;
      }
    }
    if (this.contact && !this.world.cutscene) this.touchPlayer();
    this.flashT -= dt;
    const flashing = this.flashT > 0;
    if (flashing !== this.flashing) {
      this.flashing = flashing;
      for (const f of this.flashBase) {
        f.m.emissive.copy(flashing ? WHITE : f.e);
        f.m.emissiveIntensity = flashing ? 1.4 : f.i;
      }
    }
    this.model.root.position.set(this.body.x, this.body.y, this.body.z);
    this.model.root.rotation.y = this.yaw;
    this.aim.set(this.body.x, this.body.y + this.aimHeight, this.body.z);
  }

  protected touchPlayer() {
    const p = this.player.body;
    const dx = p.x - this.body.x;
    const dz = p.z - this.body.z;
    const r = this.radius + p.r - 0.1;
    if (dx * dx + dz * dz < r * r && p.y < this.body.y + this.radius * 2 + 0.2 && p.y + p.h > this.body.y) {
      if (this.player.pounding && p.y > this.body.y + this.radius) return;
      this.player.hurt(1, this.body.x, this.body.z);
    }
  }
}

/* ---------------- Sporeling ---------------- */

class Sporeling extends Enemy {
  private hopT = Math.random();
  private squash = 0;

  constructor(world: World, id: string, x: number, y: number, z: number, variant: string) {
    const hp = variant === 'magma' ? 3 : 2;
    super(world, id, x, y, z, hp, 0.55, makeSporeling(variant));
    this.bolts = 3;
  }

  protected think(dt: number) {
    const b = this.body;
    this.hopT -= dt;
    if (b.grounded) {
      b.vx = damp(b.vx, 0, 10, dt);
      b.vz = damp(b.vz, 0, 10, dt);
      if (this.hopT <= 0) {
        this.hopT = this.aggro ? 0.55 + Math.random() * 0.3 : 1.4 + Math.random();
        this.squash = 0.15;
        const p = this.player.body;
        let dx = p.x - b.x;
        let dz = p.z - b.z;
        if (!this.aggro) {
          dx = this.home.x - b.x + (Math.random() - 0.5) * 3;
          dz = this.home.z - b.z + (Math.random() - 0.5) * 3;
        }
        const d = Math.hypot(dx, dz) || 1;
        b.vy = 7;
        if (this.safeAhead(dx, dz)) {
          const sp = this.aggro ? 4.6 : 2;
          b.vx = (dx / d) * sp;
          b.vz = (dz / d) * sp;
        }
        this.yaw = Math.atan2(dx, dz);
      }
    }
    this.squash = Math.max(0, this.squash - dt);
    const s = b.grounded ? 1 - this.squash * 1.5 : 1.12;
    this.model.body.scale.set(2 - s, s, 2 - s);
    // Legs skitter while it runs and fold up when it leaps.
    const moving = Math.hypot(b.vx, b.vz) > 0.5 ? 1 : 0.2;
    (this.model.limbs ?? []).forEach((leg, i) => {
      const side = i % 2 ? 1 : -1;
      leg.rotation.x = b.grounded ? Math.sin(this.t * 18 + i * 1.9) * 0.4 * moving : 0.3;
      leg.rotation.z = b.grounded ? 0 : side * 0.55;
    });
  }
}

/* ---------------- Snapper ---------------- */

class Snapper extends Enemy {
  private up = 0;
  private snapT = 1.2;
  private lunge = 0;
  private jaw = 0.1;

  constructor(world: World, id: string, x: number, y: number, z: number) {
    super(world, id, x, y, z, 3, 0.6, makeSnapper());
    this.bolts = 4;
    this.contact = false;
    this.aimHeight = 1.3;
  }

  protected canBeHit() {
    return this.up > 0.5;
  }

  protected think(dt: number) {
    const near = this.distToPlayer() < 6;
    this.up = damp(this.up, near ? 1 : 0, 6, dt);
    this.aimable = this.up > 0.5;
    this.body.vx = 0;
    this.body.vz = 0;
    this.facePlayer(dt, 6);
    const head = this.model.parts.head;
    this.model.body.position.y = (this.up - 1) * 1.4;
    // Jaws breathe while it waits, gape wide just before a bite, and slam shut on it.
    let open = 0.12 + Math.sin(this.t * 3) * 0.06;
    if (near) open = this.snapT < 0.45 ? 1 : 0.35;
    if (this.lunge > 0) open = 0.02;
    this.jaw = damp(this.jaw, open, this.lunge > 0 ? 30 : 10, dt);
    this.model.parts.jawTop.rotation.x = -this.jaw * 0.9;
    this.model.parts.jawBottom.rotation.x = this.jaw * 0.55;
    if (near) {
      this.snapT -= dt;
      const tele = this.snapT < 0.45;
      head.position.x = tele ? Math.sin(this.t * 60) * 0.06 : 0;
      if (this.snapT <= 0) {
        this.snapT = 1.8;
        this.lunge = 0.35;
        audio.play('hit', 0.6);
        if (this.distToPlayer() < 2.6) this.player.hurt(1, this.body.x, this.body.z);
      }
    }
    this.lunge = Math.max(0, this.lunge - dt);
    const k = this.lunge > 0 ? Math.sin((this.lunge / 0.35) * Math.PI) : 0;
    head.position.z = k * 1.1;
    head.scale.set(1 + k * 0.2, 1 - k * 0.1, 1 + k * 0.2);
  }
}

/* ---------------- Buzzer ---------------- */

class Buzzer extends Enemy {
  private shootT = 2;
  private orbit = Math.random() * Math.PI * 2;
  private baseY: number;

  constructor(world: World, id: string, x: number, y: number, z: number) {
    super(world, id, x, y + 2.6, z, 2, 0.5, makeBuzzer());
    this.flying = true;
    this.bolts = 4;
    this.baseY = y + 2.6;
    this.aimHeight = 0;
  }

  protected think(dt: number) {
    const b = this.body;
    const p = this.player.body;
    let tx = this.home.x + Math.cos(this.t * 0.8) * 2;
    let tz = this.home.z + Math.sin(this.t * 0.8) * 2;
    if (this.aggro) {
      this.orbit += dt * 0.7;
      tx = p.x + Math.cos(this.orbit) * 6;
      tz = p.z + Math.sin(this.orbit) * 6;
      this.baseY = damp(this.baseY, p.y + 2.8, 2, dt);
      this.shootT -= dt;
      const glow = this.shootT < 0.5;
      this.model.body.scale.setScalar(glow ? 1.12 + Math.sin(this.t * 40) * 0.05 : 1);
      if (this.shootT <= 0) {
        this.shootT = 2.3;
        const from = new THREE.Vector3(b.x, b.y, b.z);
        const dir = this.player.chest(v3).sub(from).normalize();
        this.world.shots.fire('enemy', from, dir, 8, 1);
        audio.play('enemyShoot');
      }
    }
    const nx = damp(b.x, tx, 1.5, dt);
    const nz = damp(b.z, tz, 1.5, dt);
    const g = this.world.grid;
    if (g.cell(Grid.toCell(nx), Grid.toCell(nz)).kind !== 'wall') {
      b.x = nx;
      b.z = nz;
    }
    b.y = this.baseY + Math.sin(this.t * 3) * 0.25;
    this.facePlayer(dt, 5);
    const flap = Math.sin(this.t * 70) * 0.6;
    this.model.parts.rotorL.rotation.z = flap;
    this.model.parts.rotorR.rotation.z = -flap;
    this.model.body.rotation.x = 0.15 + Math.sin(this.t * 2.2) * 0.06;
    const shadow = this.model.parts.shadow;
    const c = g.cell(Grid.toCell(b.x), Grid.toCell(b.z));
    shadow.visible = c.kind !== 'void';
    shadow.position.y = c.h - b.y + 0.03;
  }
}

/* ---------------- Sentry ---------------- */

class Sentry extends Enemy {
  private dir: [number, number];
  private burst = 0;
  private burstT = 0;
  private coolT = 1.5;

  constructor(world: World, id: string, x: number, y: number, z: number) {
    super(world, id, x, y, z, 4, 0.7, makeSentry());
    this.bolts = 6;
    this.heartChance = 0.2;
    this.aimHeight = 1.1;
    this.dir = [1, 0];
    this.yaw = Math.PI / 2;
  }

  protected canBeHit(kind: HitKind, from: THREE.Vector3) {
    if (kind !== 'shot') return true;
    const fx = Math.sin(this.yaw);
    const fz = Math.cos(this.yaw);
    const dx = from.x - this.body.x;
    const dz = from.z - this.body.z;
    const d = Math.hypot(dx, dz) || 1;
    return (dx * fx + dz * fz) / d < 0.35;
  }

  protected think(dt: number) {
    const b = this.body;
    const p = this.player.body;
    const dx = p.x - b.x;
    const dz = p.z - b.z;
    const d = Math.hypot(dx, dz);
    const fx = Math.sin(this.yaw);
    const fz = Math.cos(this.yaw);
    const inView = this.aggro && d < 11 && (dx * fx + dz * fz) / (d || 1) > 0.5;
    this.coolT -= dt;
    if (this.burst > 0) {
      b.vx = damp(b.vx, 0, 10, dt);
      b.vz = damp(b.vz, 0, 10, dt);
      this.facePlayer(dt, 4);
      this.burstT -= dt;
      if (this.burstT <= 0) {
        this.burstT = 0.28;
        this.burst -= 1;
        const from = new THREE.Vector3(b.x + fx * 0.8, b.y + 1.2, b.z + fz * 0.8);
        this.world.shots.fire('enemy', from, this.player.chest(v3).sub(from).normalize(), 10, 1);
        audio.play('enemyShoot', 1.3);
      }
      return;
    }
    if (inView && this.coolT <= 0) {
      this.burst = 3;
      this.burstT = 0.45;
      this.coolT = 3;
      return;
    }
    if (this.aggro && d < 11) {
      this.facePlayer(dt, 2.5);
      b.vx = damp(b.vx, 0, 8, dt);
      b.vz = damp(b.vz, 0, 8, dt);
      return;
    }
    // Patrol: roll forward until a wall or edge, then turn around.
    if (!this.safeAhead(this.dir[0], this.dir[1]) || b.bumped) this.dir = [-this.dir[0], -this.dir[1]];
    b.vx = this.dir[0] * 2.4;
    b.vz = this.dir[1] * 2.4;
    this.yaw = dampAngle(this.yaw, Math.atan2(this.dir[0], this.dir[1]), 6, dt);
  }
}

/* ---------------- Turret ---------------- */

class Turret extends Enemy {
  private shootT = 1.5;

  constructor(world: World, id: string, x: number, y: number, z: number) {
    super(world, id, x, y, z, 3, 0.7, makeTurret());
    this.bolts = 5;
    this.aimHeight = 1;
  }

  protected think(dt: number) {
    this.body.vx = 0;
    this.body.vz = 0;
    const d = this.distToPlayer();
    this.facePlayer(dt, 4);
    const head = this.model.parts.head;
    if (this.aggro && d < 14) {
      this.shootT -= dt;
      const swell = this.shootT < 0.5 ? 1 + (0.5 - this.shootT) * 0.5 : 1;
      head.scale.setScalar(swell);
      if (this.shootT <= 0) {
        this.shootT = 2.5;
        const b = this.body;
        const p = this.player.body;
        const from = new THREE.Vector3(b.x, b.y + 1.3, b.z);
        // Lob: aim so the arc lands near Kai.
        const flight = Math.max(0.7, d / 9);
        const g = 12;
        const vx = (p.x - b.x) / flight;
        const vz = (p.z - b.z) / flight;
        const vy = (p.y + 0.5 - from.y + 0.5 * g * flight * flight) / flight;
        const vel = new THREE.Vector3(vx, vy, vz);
        const speed = vel.length();
        this.world.shots.fire('enemy', from, vel.normalize(), speed, 1, g);
        audio.play('enemyShoot', 0.7);
      }
    } else {
      head.scale.setScalar(1 + Math.sin(this.t * 2) * 0.03);
    }
  }
}

/* ---------------- Brute ---------------- */

class Brute extends Enemy {
  private state: 'walk' | 'wind' | 'charge' | 'dizzy' = 'walk';
  private stateT = 0;
  private cd = 1.5;
  private chargeDir: [number, number] = [0, 1];

  constructor(world: World, id: string, x: number, y: number, z: number) {
    super(world, id, x, y, z, 10, 1.1, makeBrute());
    this.bolts = 15;
    this.heartChance = 0.7;
    this.aimHeight = 1.3;
    const skin = this.model.flash[0];
    this.calmGlow = skin.emissive.clone();
    this.calmGlowI = skin.emissiveIntensity;
  }

  private calmGlow: THREE.Color;
  private calmGlowI: number;

  protected canBeHit() {
    return true;
  }

  hit(dmg: number, kind: HitKind, from: THREE.Vector3): boolean {
    return super.hit(this.state === 'dizzy' ? dmg * 2 : dmg, kind, from);
  }

  protected think(dt: number) {
    const b = this.body;
    const p = this.player.body;
    const m = this.model;
    this.stateT -= dt;
    this.cd -= dt;
    const skin = m.flash[0];
    switch (this.state) {
      case 'walk': {
        if (!this.aggro) {
          b.vx = damp(b.vx, 0, 6, dt);
          b.vz = damp(b.vz, 0, 6, dt);
          break;
        }
        this.facePlayer(dt, 3);
        const dx = p.x - b.x;
        const dz = p.z - b.z;
        const d = Math.hypot(dx, dz) || 1;
        if (this.safeAhead(dx, dz) && d > 2) {
          b.vx = damp(b.vx, (dx / d) * 2.2, 4, dt);
          b.vz = damp(b.vz, (dz / d) * 2.2, 4, dt);
        } else {
          b.vx = damp(b.vx, 0, 6, dt);
          b.vz = damp(b.vz, 0, 6, dt);
        }
        const swing = Math.sin(this.t * 5);
        m.parts.armL.rotation.x = swing * 0.4;
        m.parts.armR.rotation.x = -swing * 0.4;
        if (d < 9 && this.cd <= 0) {
          this.state = 'wind';
          this.stateT = 0.9;
          this.chargeDir = [dx / d, dz / d];
          audio.play('roar');
        }
        break;
      }
      case 'wind':
        b.vx = damp(b.vx, 0, 10, dt);
        b.vz = damp(b.vz, 0, 10, dt);
        this.facePlayer(dt, 6);
        {
          const dx = p.x - b.x;
          const dz = p.z - b.z;
          const d = Math.hypot(dx, dz) || 1;
          this.chargeDir = [dx / d, dz / d];
        }
        skin.emissive.set('#ff3050');
        skin.emissiveIntensity = 0.4 + Math.abs(Math.sin(this.t * 20)) * 0.6;
        m.parts.armL.rotation.x = -2.4;
        m.parts.armR.rotation.x = -2.4;
        if (this.stateT <= 0) {
          this.state = 'charge';
          this.stateT = 1.3;
        }
        break;
      case 'charge':
        b.vx = this.chargeDir[0] * 11;
        b.vz = this.chargeDir[1] * 11;
        this.yaw = Math.atan2(this.chargeDir[0], this.chargeDir[1]);
        if (Math.random() < 0.5) this.world.particles.emit(b.x, b.y + 0.2, b.z, { count: 2, color: '#d8c8e8', speed: 2, life: 0.4, size: 0.6 });
        if (b.bumped || !this.safeAhead(this.chargeDir[0], this.chargeDir[1])) {
          b.vx = 0;
          b.vz = 0;
          this.state = 'dizzy';
          this.stateT = 2.2;
          this.world.shake(0.3);
          audio.play('pound');
        } else if (this.stateT <= 0) {
          this.state = 'walk';
          this.cd = 2;
        }
        break;
      case 'dizzy':
        b.vx = damp(b.vx, 0, 10, dt);
        b.vz = damp(b.vz, 0, 10, dt);
        this.yaw += dt * 3;
        if (Math.random() < 0.2) this.world.particles.emit(b.x, b.y + 2.6, b.z, { count: 1, color: '#ffd166', speed: 1.5, life: 0.5, size: 0.5, gravity: 0 });
        if (this.stateT <= 0) {
          this.state = 'walk';
          this.cd = 1.6;
        }
        break;
    }
    if (this.state !== 'wind' && this.flashT <= 0) {
      skin.emissive.copy(this.calmGlow);
      skin.emissiveIntensity = this.calmGlowI;
    }
    this.contact = this.state !== 'dizzy';
  }
}

export function makeEnemy(world: World, id: string, kind: EnemyKind, cx: number, cz: number, h: number, variant?: string): Enemy {
  const x = cx * CELL + CELL / 2;
  const z = cz * CELL + CELL / 2;
  switch (kind) {
    case 'sporeling':
      return new Sporeling(world, id, x, h, z, variant ?? 'default');
    case 'snapper':
      return new Snapper(world, id, x, h, z);
    case 'buzzer':
      return new Buzzer(world, id, x, h, z);
    case 'sentry':
      return new Sentry(world, id, x, h, z);
    case 'turret':
      return new Turret(world, id, x, h, z);
    case 'brute':
      return new Brute(world, id, x, h, z);
  }
}
