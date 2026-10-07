import { audio } from '../../core/audio';
import { HERO_SWITCH } from '../../core/constants';
import { Grid } from '../../world/grid';
import { clamp, damp, dampAngle } from '../../core/math';
import type { World } from '../../game/world';
import type { HeroId } from '../../world/levelTypes';
import type { HeroModel } from '../models';
import type { Player } from '../player';
import { HEROES } from './heroes';

interface Crumb {
  x: number;
  y: number;
  z: number;
}

/**
 * The hero you're not playing: a simple, invulnerable companion who walks along the trail of spots the
 * playing hero stood on, hopping over gaps between them, and pops over in a flash of light when left
 * too far behind or stuck. It never fights and nothing attacks it.
 */
export class Follower {
  private trail: Crumb[] = [];
  private x = 0;
  private y = 0;
  private z = 0;
  private facing = 0;
  private phase = 0;
  private hop = 0;
  private hopFrom = 0;
  private hopTo = 0;
  private hopLen = 0;
  private stuck = 0;
  private sampleT = 0;

  constructor(
    private world: World,
    private model: HeroModel,
    private id: HeroId,
  ) {}

  /** Hands the follower a different hero (after a switch). */
  swap(model: HeroModel, id: HeroId) {
    this.model = model;
    this.id = id;
  }

  /** Puts the follower somewhere at once (a switch, a checkpoint, a teleport), and forgets the trail. */
  place(x: number, y: number, z: number, facing: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.facing = facing;
    this.hop = 0;
    this.trail = [];
    this.stuck = 0;
    this.model.root.position.set(x, y, z);
  }

  /**
   * Puts the follower beside a hero standing at (x, y, z): to their right, else their left, else just
   * behind, wherever the floor is at about the same height (so the camera sees both of them).
   */
  placeNear(x: number, y: number, z: number, facing: number) {
    const g = this.world.grid;
    for (const a of [-Math.PI / 2 - 0.5, Math.PI / 2 + 0.5, Math.PI]) {
      const px = x + Math.sin(facing + a) * 1.5;
      const pz = z + Math.cos(facing + a) * 1.5;
      const c = g.cell(Grid.toCell(px), Grid.toCell(pz));
      if (c.kind === 'wall' || c.kind === 'void' || c.kind === 'hazard' || Math.abs(c.h - y) > 0.6) continue;
      this.place(px, c.h, pz, facing);
      return;
    }
    this.place(x, y, z, facing);
  }

  /** Lays a breadcrumb where the playing hero stands on solid ground. */
  private sample(dt: number, p: Player) {
    const b = p.body;
    this.sampleT -= dt;
    if (this.sampleT > 0 || !b.grounded || b.ground?.kind === 'hazard' || p.ata?.cramped) return;
    this.sampleT = 0.1;
    const last = this.trail[this.trail.length - 1];
    if (last && Math.hypot(last.x - b.x, last.z - b.z) < 0.5 && Math.abs(last.y - b.y) < 0.3) return;
    this.trail.push({ x: b.x, y: b.y, z: b.z });
    if (this.trail.length > 80) this.trail.shift();
  }

  update(dt: number, p: Player) {
    this.sample(dt, p);
    const b = p.body;
    const m = this.model;
    const lead = Math.hypot(b.x - this.x, b.z - this.z);
    if (lead > HERO_SWITCH.teleportDist || Math.abs(b.y - this.y) > 8 || this.stuck > HERO_SWITCH.stuckTime) {
      this.popTo(p);
      return;
    }
    // Head for the oldest breadcrumb that is still far enough behind the leader.
    let target: Crumb | null = null;
    while (this.trail.length) {
      const c = this.trail[0];
      if (Math.hypot(c.x - this.x, c.z - this.z) < 0.35 && Math.abs(c.y - this.y) < 0.6) {
        this.trail.shift();
        continue;
      }
      if (Math.hypot(c.x - b.x, c.z - b.z) < HERO_SWITCH.followDist) break;
      target = c;
      break;
    }
    let speed = 0;
    if (target && lead > HERO_SWITCH.followDist) {
      const dx = target.x - this.x;
      const dz = target.z - this.z;
      const d = Math.hypot(dx, dz);
      // A gap or a ledge between crumbs: hop it.
      if (this.hop <= 0 && (Math.abs(target.y - this.y) > 0.6 || d > 1.6)) {
        this.hop = 1;
        this.hopFrom = this.y;
        this.hopTo = target.y;
        this.hopLen = Math.max(0.3, d / HERO_SWITCH.followSpeed);
      }
      speed = Math.min(HERO_SWITCH.followSpeed, HEROES[this.id].speed * (lead > 6 ? 1.4 : 1));
      if (this.hop > 0) speed = d / this.hopLen;
      const step = Math.min(d, speed * dt);
      if (d > 0.01) {
        this.x += (dx / d) * step;
        this.z += (dz / d) * step;
        this.facing = dampAngle(this.facing, Math.atan2(dx, dz), 12, dt);
      }
      this.stuck = step < 0.001 ? this.stuck + dt : 0;
    } else {
      this.stuck = 0;
      this.facing = dampAngle(this.facing, Math.atan2(b.x - this.x, b.z - this.z), 4, dt);
    }
    if (this.hop > 0) {
      this.hop = Math.max(0, this.hop - dt / this.hopLen);
      const k = 1 - this.hop;
      this.y = this.hopFrom + (this.hopTo - this.hopFrom) * k + Math.sin(k * Math.PI) * 1.2;
    } else if (target) {
      this.y = damp(this.y, target.y, 12, dt);
    }

    m.root.position.set(this.x, this.y, this.z);
    m.root.rotation.y = this.facing;
    const shadow = m.root.children[m.root.children.length - 1];
    shadow.position.y = this.hop > 0 ? Math.max(0.02, Math.min(this.hopFrom, this.hopTo) - this.y) : 0.03;
    const walk = clamp(speed / 7, 0, 1.3);
    this.phase += dt * (5 + 9 * walk);
    const s = Math.sin(this.phase);
    const air = this.hop > 0;
    m.legL.rotation.set(air ? -0.6 : s * 0.9 * walk, 0, 0);
    m.legR.rotation.set(air ? 0.35 : -s * 0.9 * walk, 0, 0);
    m.armL.rotation.set(air ? -2 : -s * 0.7 * walk, 0, 0.05);
    m.armR.rotation.set(air ? -2 : s * 0.7 * walk, 0, -0.05);
    m.body.position.y = air ? 0 : Math.abs(s) * 0.07 * walk;
    m.body.rotation.set(walk * 0.08, 0, 0);
    m.body.scale.set(1, 1, 1);
    m.root.visible = true;
  }

  /** Too far behind: a sparkle, and the follower appears right behind the leader. */
  private popTo(p: Player) {
    const b = p.body;
    const w = this.world;
    w.particles.emit(this.x, this.y + 1, this.z, { count: 14, color: HEROES[this.id].color, speed: 3, life: 0.4, size: 0.4 });
    const back = this.trail.length ? this.trail[this.trail.length - 1] : { x: b.x, y: b.y, z: b.z };
    this.placeNear(back.x, back.y, back.z, p.facing);
    w.particles.emit(this.x, this.y + 1, this.z, { count: 18, color: '#ffffff', speed: 3.5, life: 0.45, size: 0.45, up: 1 });
    audio.play('djump', 1.6, 0.4);
  }
}
