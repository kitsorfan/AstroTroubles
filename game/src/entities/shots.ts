import * as THREE from 'three';

import { audio } from '../core/audio';
import { PLAYER } from '../core/constants';
import type { World } from '../game/world';
import { pointBlocked } from '../world/physics';
import { Boss } from './bossBase';
import type { Target } from './entity';
import { glowSprite, mat, sphere } from './models';
import { FROST, SEEKER, THUNDER, WEAPONS, WEAPON_ORDER, type WeaponId } from './weapons';

type ShotKind = 'player' | 'enemy' | 'fireball';

interface Shot {
  obj: THREE.Group;
  vel: THREE.Vector3;
  life: number;
  dmg: number;
  kind: ShotKind;
  /** Which of Jason's weapons fired it (enemy shots are always 'blaster'). */
  weapon: WeaponId;
  active: boolean;
  radius: number;
  gravity: number;
  /** What a Seeker shot is chasing. */
  target: Target | null;
}

export interface FireOpts {
  weapon?: WeaponId;
  /** A Seeker shot's quarry. */
  target?: Target | null;
}

/** Anything the Frost Ray can chill: enemies (which can also freeze) and bosses (which only slow a little). */
interface Chillable {
  chill(seconds: number, freeze?: boolean, slow?: number): void;
}

const canChill = (t: unknown): t is Chillable => typeof (t as Partial<Chillable>).chill === 'function';

const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();

/** How many of each weapon's shots and charged shots can fly at once. */
const POOL: Record<WeaponId, [number, number]> = { blaster: [24, 4], spread: [30, 9], frost: [16, 3], thunder: [16, 3], seeker: [14, 4] };

/** Pooled projectiles: Jason's shots (one look per weapon), his charged shots, and enemy spit. */
export class Shots {
  private pool: Shot[] = [];

  constructor(private world: World) {
    const eMat = mat('#ffd0f0', { emissive: '#ff4fb8', ei: 2 });
    const add = (kind: ShotKind, weapon: WeaponId, n: number, build: (g: THREE.Group) => void, radius: number) => {
      for (let i = 0; i < n; i++) {
        const obj = new THREE.Group();
        build(obj);
        obj.visible = false;
        this.world.scene.add(obj);
        this.pool.push({ obj, vel: new THREE.Vector3(), life: 0, dmg: 1, kind, weapon, active: false, radius, gravity: 0, target: null });
      }
    };
    for (const id of WEAPON_ORDER) {
      const wp = WEAPONS[id];
      const [shots, balls] = POOL[id];
      const core = mat(wp.core, { emissive: wp.glow, ei: 2.2 });
      add('player', id, shots, (g) => g.add(...shotLook(id, core, wp.glow)), id === 'seeker' ? 0.36 : 0.3);
      const fMat = mat(id === 'blaster' ? '#fff2c0' : wp.core, { emissive: id === 'blaster' ? '#ff9a2a' : wp.glow, ei: 3 });
      const [hot, outer] = id === 'blaster' ? ['#ffb04a', '#ff5a1a'] : [wp.glow, wp.core];
      const r = id === 'spread' ? 0.42 : 0.55;
      add('fireball', id, balls, (g) => g.add(new THREE.Mesh(sphere(r, 18), fMat), glowSprite(hot, r * 6.5, 0.9), glowSprite(outer, r * 11, 0.35)), r + 0.05);
    }
    add('enemy', 'blaster', 46, (g) => g.add(new THREE.Mesh(sphere(0.26, 12), eMat), glowSprite('#ff4fb8', 1.5, 0.75)), 0.32);
  }

  /** Launches a pooled projectile. Returns false if every one of that kind is already in flight. */
  fire(owner: ShotKind, origin: THREE.Vector3, dir: THREE.Vector3, speed: number, dmg: number, gravity = 0, opts: FireOpts = {}): boolean {
    const weapon = owner === 'enemy' ? 'blaster' : (opts.weapon ?? 'blaster');
    const s = this.pool.find((p) => !p.active && p.kind === owner && p.weapon === weapon);
    if (!s) return false;
    s.active = true;
    s.obj.visible = true;
    s.obj.position.copy(origin);
    s.vel.copy(dir).multiplyScalar(speed);
    s.life = owner === 'enemy' ? 4 : (PLAYER.shotRange * WEAPONS[weapon].range) / speed;
    s.dmg = dmg;
    s.gravity = gravity;
    s.target = opts.target ?? null;
    s.obj.lookAt(tmp.copy(origin).add(dir));
    return true;
  }

  clear() {
    for (const s of this.pool) {
      s.active = false;
      s.obj.visible = false;
      s.target = null;
    }
  }

  private pop(s: Shot, color: string) {
    s.active = false;
    s.obj.visible = false;
    s.target = null;
    const p = s.obj.position;
    if (s.kind === 'fireball') {
      this.world.explode(p, 2.8, s.dmg);
      this.chargedBurst(s, p);
      return;
    }
    this.world.particles.emit(p.x, p.y, p.z, { count: 8, color, speed: 4, life: 0.3, size: 0.4 });
  }

  update(dt: number) {
    const w = this.world;
    for (const s of this.pool) {
      if (!s.active) continue;
      s.life -= dt;
      s.vel.y -= s.gravity * dt;
      if (s.kind !== 'enemy' && s.weapon === 'seeker') this.steer(s, dt);
      const p = s.obj.position;
      p.addScaledVector(s.vel, dt);
      if (s.gravity || s.target) s.obj.lookAt(tmp.copy(p).add(s.vel));
      if (s.kind === 'fireball') {
        s.obj.rotation.z += dt * 8;
        const wp = WEAPONS[s.weapon];
        const a = s.weapon === 'blaster' ? '#ffb04a' : wp.glow;
        const b = s.weapon === 'blaster' ? '#ff5a1a' : wp.core;
        w.particles.emit(p.x, p.y, p.z, { count: 3, color: Math.random() < 0.5 ? a : b, speed: 1.2, life: 0.45, size: 0.8, gravity: -1 });
      } else if (s.kind === 'player') {
        this.trail(s, dt);
      }
      if (s.life <= 0) {
        if (s.kind === 'fireball') this.pop(s, '');
        s.active = false;
        s.obj.visible = false;
        s.target = null;
        continue;
      }
      if (pointBlocked(w.grid, w.boxes, p.x, p.y, p.z)) {
        // Crates and doors are boxes; let breakables react to the hit first.
        if (s.kind === 'player') w.hitAt(p, s.radius + 0.3, s.dmg, 'shot');
        this.pop(s, s.kind === 'enemy' ? '#ff8ad8' : WEAPONS[s.weapon].glow);
        continue;
      }
      if (s.kind === 'fireball') {
        if (w.targetAt(p, s.radius)) {
          this.pop(s, '');
          audio.play('hit');
        }
      } else if (s.kind === 'player') {
        const t = w.hitAt(p, s.radius, s.dmg, 'shot');
        if (t) {
          this.onHit(s, t, p.clone());
          this.pop(s, WEAPONS[s.weapon].core);
          audio.play('hit', WEAPONS[s.weapon].pitch);
        }
      } else {
        const pl = w.player;
        const dx = pl.body.x - p.x;
        const dz = pl.body.z - p.z;
        const dy = pl.body.y + 0.9 - p.y;
        // A spin bats shots away a little before they reach Jason.
        // General Brennus's raised shield stops them a step in front of him.
        const shielded = pl.shieldBlocks(p.x, p.z);
        const reach = pl.body.r + s.radius + (pl.spinning ? 0.9 : shielded ? 0.7 : 0);
        if (dx * dx + dz * dz < reach * reach && Math.abs(dy) < 1.4) {
          if (pl.spinning || shielded) {
            if (shielded) pl.bren?.clang();
            const back = tmp.copy(s.vel).setY(0).multiplyScalar(-1).normalize();
            this.pop(s, '#bff4ff');
            this.fire('player', p.clone(), back.clone(), PLAYER.shotSpeed, 1 + (w.save.upgrades.blaster ?? 0));
            audio.play('zap', 2.4);
          } else {
            pl.hurt(s.dmg, p.x, p.z);
            this.pop(s, '#ff8ad8');
          }
        }
      }
    }
  }

  /** Wipes out enemy shots close to a point (LUX's force pulse). Returns how many were destroyed. */
  clearNear(at: THREE.Vector3, radius: number): number {
    let n = 0;
    for (const s of this.pool) {
      if (!s.active || s.kind !== 'enemy' || s.obj.position.distanceToSquared(at) > radius * radius) continue;
      this.pop(s, '#bff4ff');
      n += 1;
    }
    return n;
  }

  /* ---------------- special weapons ---------------- */

  /** A shot connected: the Frost Ray chills, the Thunder Arc jumps on to more enemies. */
  private onHit(s: Shot, t: Target, at: THREE.Vector3) {
    if (s.weapon === 'frost') this.chillOne(t, FROST.chill, false);
    else if (s.weapon === 'thunder') this.chain(t, at, THUNDER.jumps, s.dmg * THUNDER.power);
  }

  /** A charged shot burst: a frost blast freezes everything around it, a thunder blast throws lightning out. */
  private chargedBurst(s: Shot, at: THREE.Vector3) {
    const w = this.world;
    if (s.weapon === 'frost') {
      for (const t of w.targetsNear(at, 3.6)) this.chillOne(t, FROST.freeze, true);
      w.rings.burst(at.x, at.y - 0.8, at.z, 7, '#bfeeff', 0.5);
      w.particles.emit(at.x, at.y, at.z, { count: 30, color: '#dff6ff', speed: 7, life: 0.8, size: 0.6, up: 2 });
    } else if (s.weapon === 'thunder') {
      const near = w.targetsNear(at, THUNDER.range + 2).filter((t) => t.aim.distanceTo(at) > 2.8 + t.radius);
      for (const t of near.slice(0, THUNDER.chargedJumps)) this.zapTo(at, t, s.dmg * THUNDER.power);
      if (near.length) audio.play('zap', 1.2);
    }
  }

  /** Chills one target: enemies slow down (or freeze solid), bosses only slow a little. */
  private chillOne(t: Target, seconds: number, freeze: boolean) {
    const w = this.world;
    if (t instanceof Boss) t.chill(FROST.bossChill, false, FROST.bossSlow);
    else if (canChill(t)) t.chill(seconds, freeze, FROST.slow);
    else if (w.boss?.started && !w.boss.defeated && t.aim.distanceTo(w.boss.where) < 14) {
      // A boss's pods and weak spots pass the cold on to the boss.
      w.boss.chill(FROST.bossChill, false, FROST.bossSlow);
    } else return;
    w.particles.emit(t.aim.x, t.aim.y, t.aim.z, { count: freeze ? 16 : 8, color: '#bfeeff', speed: 3, life: 0.5, size: 0.45 });
    if (freeze) audio.play('land', 1.8);
  }

  /** Thunder Arc: lightning jumps from the enemy that was hit to `jumps` more nearby, one after another. */
  private chain(first: Target, at: THREE.Vector3, jumps: number, dmg: number) {
    const done = new Set<Target>([first]);
    let from = at;
    let n = 0;
    for (let i = 0; i < jumps; i++) {
      const next = this.world.targetsNear(from, THUNDER.range).find((t) => !done.has(t));
      if (!next) break;
      done.add(next);
      this.zapTo(from, next, dmg);
      from = next.aim.clone();
      n += 1;
    }
    if (n) audio.play('zap', 1.5);
  }

  private zapTo(from: THREE.Vector3, t: Target, dmg: number) {
    const w = this.world;
    const to = t.aim.clone();
    w.beams.zap(from.clone(), to, '#d6b4ff');
    w.particles.emit(to.x, to.y, to.z, { count: 10, color: '#fff7b0', speed: 5, life: 0.3, size: 0.4 });
    t.hit(dmg, 'shot', from);
  }

  /** Seeker shots turn toward their quarry (and find a new one close by if it is gone). */
  private steer(s: Shot, dt: number) {
    const p = s.obj.position;
    if (!s.target?.alive) {
      const ahead = tmp2.copy(s.vel).normalize();
      s.target = this.world.targetsNear(p, 9).find((t) => tmp.copy(t.aim).sub(p).normalize().dot(ahead) > 0.2) ?? null;
      if (!s.target) return;
    }
    const speed = s.vel.length();
    const want = tmp.copy(s.target.aim).sub(p).normalize();
    const cur = tmp2.copy(s.vel).normalize();
    cur.lerp(want, Math.min(1, SEEKER.turn * dt)).normalize();
    s.vel.copy(cur).multiplyScalar(speed);
  }

  /** A little trail behind the special shots, so each weapon reads at a glance. */
  private trail(s: Shot, dt: number) {
    if (s.weapon === 'blaster' || s.weapon === 'spread') return;
    const p = s.obj.position;
    const wp = WEAPONS[s.weapon];
    if (s.weapon === 'thunder') {
      const g = s.obj.children[1];
      g.scale.setScalar(1.3 + Math.random() * 0.9);
    }
    if (Math.random() < dt * 30) this.world.particles.emit(p.x, p.y, p.z, { count: 1, color: s.weapon === 'frost' ? '#ffffff' : wp.glow, speed: 0.5, life: 0.3, size: 0.3, gravity: 0 });
  }
}

/** The look of one weapon's shot: a bright bolt, an ice shard, a lightning dart, a homing orb... */
function shotLook(id: WeaponId, core: THREE.Material, glow: string): THREE.Object3D[] {
  switch (id) {
    case 'spread':
      return [new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.34, 4, 8).rotateX(Math.PI / 2), core), glowSprite(glow, 0.9, 0.75)];
    case 'frost': {
      const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), core);
      shard.scale.set(0.8, 0.8, 2.2);
      return [shard, glowSprite(glow, 1.2, 0.7)];
    }
    case 'thunder':
      return [new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.62, 4, 6).rotateX(Math.PI / 2), core), glowSprite(glow, 1.6, 0.85), glowSprite('#ffffff', 0.6, 0.9)];
    case 'seeker':
      return [new THREE.Mesh(sphere(0.17, 12), core), glowSprite(glow, 1.4, 0.8)];
    default:
      return [new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.5, 4, 8).rotateX(Math.PI / 2), core), glowSprite(glow, 1.1, 0.7)];
  }
}
