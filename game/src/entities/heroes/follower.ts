import * as THREE from 'three';

import { audio } from '../../core/audio';
import { ATALANTA, BRENNUS, CELL, GRAPPLE, GRAVITY, HERO_SWITCH, PLAYER } from '../../core/constants';
import { clamp, damp, dampAngle } from '../../core/math';
import type { World } from '../../game/world';
import { Grid } from '../../world/grid';
import type { HeroId } from '../../world/levelTypes';
import { pointBlocked } from '../../world/physics';
import type { HeroModel } from '../models';
import type { Player } from '../player';
import { atalantaReach, atalantaRise, brennusReach, jumpReach, maxRise } from './envelope';
import { canCopy, HEROES, type HeroMove, type TrailMove } from './heroes';

/** A footprint of the playing hero, and the special moves that got them there. */
interface Crumb {
  x: number;
  y: number;
  z: number;
  moves: TrailMove[];
}

/** An arc through the air (a jump, or a zip along Jason's grapple line) from one spot to another. */
interface Leap {
  from: THREE.Vector3;
  to: THREE.Vector3;
  k: number;
  time: number;
  height: number;
  /** Where the grapple rope hooks on (a tandem zip with Jason), or null for a jump. */
  hook: THREE.Vector3 | null;
  /** Climbing a cliff (Atalanta following Atalanta): straight up the face, then over the lip. */
  climb?: boolean;
}

/** Being helped up a ledge: the rope drops, then the follower climbs it to the helper. */
interface Rope {
  from: THREE.Vector3;
  to: THREE.Vector3;
  t: number;
  drop: number;
  climb: number;
}

type State = 'follow' | 'route' | 'wait';

const FOLLOWER_HEIGHT: Record<HeroId, number> = { jason: PLAYER.height, atalanta: PLAYER.height, brennus: BRENNUS.height, mech: 3.4 };
const SIDES = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
] as const;

let waitTex: THREE.CanvasTexture | null = null;

/** A little speech bubble with three dots, over a hero who is waiting for the others to make a way. */
function waitTexture(): THREE.CanvasTexture {
  if (waitTex) return waitTex;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 96;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.fillStyle = 'rgba(255,255,255,0.95)';
  g.strokeStyle = '#1a1630';
  g.lineWidth = 6;
  g.beginPath();
  g.roundRect(8, 8, 112, 60, 26);
  g.moveTo(52, 66);
  g.lineTo(62, 88);
  g.lineTo(74, 66);
  g.fill();
  g.stroke();
  g.fillStyle = '#1a1630';
  for (const x of [38, 64, 90]) {
    g.beginPath();
    g.arc(x, 38, 8, 0, Math.PI * 2);
    g.fill();
  }
  waitTex = new THREE.CanvasTexture(c);
  waitTex.colorSpace = THREE.SRGBColorSpace;
  return waitTex;
}

/**
 * The hero you're not playing. It walks along the trail of spots the playing hero stood on, but only
 * copies what its own hero can do: a jump it can make, a crawl if it is Atalanta, a climb if it can
 * climb. When the way on needs a move it doesn't have, it looks for another way round (a door the
 * leader opened, a bridge that came out), and otherwise WAITS there, with a little "..." bubble, while
 * the leader may only scout a short way ahead (see `Player.tether`). A leader standing above it lowers
 * a hand or a rope and pulls it up, and when Jason grapples with a follower close by, it grabs on and
 * zips along. It never fights and nothing attacks it.
 */
export class Follower {
  private trail: Crumb[] = [];
  private x = 0;
  private y = 0;
  private z = 0;
  private facing = 0;
  private phase = 0;
  private sampleT = 0;
  private seq = -1;
  private state: State = 'follow';
  private route: { x: number; y: number; z: number }[] = [];
  private lookT = 0;
  private leap: Leap | null = null;
  private rope: Rope | null = null;
  private ropeMesh: THREE.Mesh | null = null;
  private bubble: THREE.Sprite;
  /** Seconds this hero has been waiting (the bubble pops up after a moment). */
  private waitT = 0;
  /**
   * Place in the line behind the leader: 0 walks close behind, 1 (the third hero, on the Golden Fleece)
   * a little further back and on the other side, so the two followers don't bump into each other.
   */
  slot = 0;

  constructor(
    private world: World,
    private model: HeroModel,
    private id: HeroId,
  ) {
    this.bubble = new THREE.Sprite(new THREE.SpriteMaterial({ map: waitTexture(), depthTest: false, transparent: true }));
    this.bubble.scale.set(1.1, 0.82, 1);
    this.bubble.renderOrder = 10;
    this.bubble.visible = false;
    world.scene.add(this.bubble);
  }

  /** Which hero this follower is walking as. */
  get hero(): HeroId {
    return this.id;
  }

  /** True while it is stuck behind something it can't get past, waiting for the leader to make a way. */
  get waiting() {
    return this.state === 'wait' && !this.rope;
  }

  /** In the middle of a jump, a zip or a climb up a rope (no switching to it then). */
  get busy() {
    return this.leap !== null || this.rope !== null || this.crawlPose;
  }

  /** How far behind the leader this follower keeps. */
  private get gap() {
    return HERO_SWITCH.followDist + this.slot * 1.8;
  }

  /** Where the follower stands and which way it faces (for the droid that tags along with it). */
  get spot() {
    return { x: this.x, y: this.y, z: this.z, facing: this.facing };
  }

  /** Hands the follower a different hero (after a switch). */
  swap(model: HeroModel, id: HeroId) {
    this.model = model;
    this.id = id;
  }

  /** Puts the follower somewhere at once (a switch, a checkpoint, a cutscene), and forgets the trail. */
  place(x: number, y: number, z: number, facing: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.facing = facing;
    this.trail = [];
    this.route = [];
    this.leap = null;
    this.endRope();
    this.state = 'follow';
    this.waitT = 0;
    this.model.root.position.set(x, y, z);
  }

  /**
   * Puts the follower beside a hero standing at (x, y, z): to their right, else their left, else just
   * behind, wherever the floor is at about the same height (so the camera sees both of them).
   */
  placeNear(x: number, y: number, z: number, facing: number) {
    const g = this.world.grid;
    const sides = [-Math.PI / 2 - 0.5, Math.PI / 2 + 0.5, Math.PI];
    // The second follower takes the other side first, and stands a little further off.
    if (this.slot > 0) sides.unshift(sides.splice(1, 1)[0]);
    const r = 1.5 + this.slot * 0.6;
    for (const a of sides) {
      const px = x + Math.sin(facing + a) * r;
      const pz = z + Math.cos(facing + a) * r;
      const c = g.cell(Grid.toCell(px), Grid.toCell(pz));
      if (c.kind === 'wall' || c.kind === 'void' || c.kind === 'hazard' || Math.abs(c.h - y) > 0.6) continue;
      this.place(px, c.h, pz, facing);
      return;
    }
    this.place(x, y, z, facing);
  }

  /** Lays a footprint where the playing hero stands on solid ground, noting how they got there. */
  private sample(dt: number, p: Player) {
    const b = p.body;
    this.sampleT -= dt;
    if (this.sampleT > 0 || !b.grounded || b.ground?.kind === 'hazard') return;
    this.sampleT = 0.1;
    const moves: TrailMove[] = [];
    if (p.landSeq !== this.seq) {
      this.seq = p.landSeq;
      moves.push(...p.landMoves);
    }
    if (p.ata?.crawling && p.hero === 'atalanta') moves.push('crawl');
    const last = this.trail[this.trail.length - 1];
    if (last && !moves.length && Math.hypot(last.x - b.x, last.z - b.z) < 0.5 && Math.abs(last.y - b.y) < 0.3) return;
    this.trail.push({ x: b.x, y: b.y, z: b.z, moves });
    if (this.trail.length > 160) this.trail.shift();
  }

  /** Jason's abilities count for him; everyone else's moves come with the hero. */
  private has = (m: HeroMove) => this.id !== 'jason' || !['doubleJump', 'glide', 'dash', 'grapple'].includes(m) || this.world.save.abilities.includes(m as never);

  /**
   * True if this hero could get from where it stands to footprint `c` on its own: the special moves
   * used must be ones it has, the gap within its own jump, and nothing in the way at its height.
   */
  private canReach(c: Crumb): 'walk' | 'jump' | 'zip' | 'climb' | null {
    if (!canCopy(this.id, c.moves, this.has)) return null;
    const d = Math.hypot(c.x - this.x, c.z - this.z);
    const dh = c.y - this.y;
    const crawl = c.moves.includes('crawl');
    if (this.lineBlocked(c, crawl)) return null;
    if (c.moves.includes('grapple')) return d <= GRAPPLE.range * CELL && Math.abs(dh) <= GRAPPLE.rise ? 'zip' : null;
    if (d < 1.4 && Math.abs(dh) < 0.6) return 'walk';
    const launch = c.moves.includes('launch');
    if (launch) return dh <= 9 && d <= 7 * CELL ? 'jump' : null;
    if (dh < -10) return null;
    const cells = d / CELL;
    const wall = c.moves.includes('walljump') || c.moves.includes('wallrun') || c.moves.includes('climb');
    if (this.id === 'jason') {
      const ab = this.world.save.abilities;
      return dh <= maxRise(ab, PLAYER.jumpV) && cells <= jumpReach(dh, ab) ? 'jump' : null;
    }
    if (this.id === 'atalanta') {
      if (c.moves.includes('climb')) return dh <= 14 && cells <= 2.5 ? 'climb' : null;
      return dh <= atalantaRise(ATALANTA.jumpV, wall) && cells <= atalantaReach(dh, ATALANTA.sprintSpeed, wall) ? 'jump' : null;
    }
    if (this.id === 'brennus') {
      const rise = (BRENNUS.jumpV * BRENNUS.jumpV) / (2 * GRAVITY) - 0.3;
      return dh <= rise && cells <= brennusReach(dh, c.moves.includes('leap')) ? 'jump' : null;
    }
    return null;
  }

  /** True if a wall, a shut door or a low ceiling stands between the follower and a spot, at its height. */
  private lineBlocked(c: { x: number; y: number; z: number }, crawl: boolean): boolean {
    const w = this.world;
    // Atalanta can always drop low and crawl under something, so only her crawling height counts.
    const head = crawl || this.id === 'atalanta' ? 0.55 : Math.min(FOLLOWER_HEIGHT[this.id] - 0.3, 1.4);
    for (const f of [0.25, 0.5, 0.75, 1]) {
      const x = this.x + (c.x - this.x) * f;
      const z = this.z + (c.z - this.z) * f;
      const y = Math.max(this.y, c.y) + head;
      if (pointBlocked(w.grid, w.boxes, x, y, z)) return true;
    }
    return false;
  }

  /** True if this hero fits standing (or crawling, for Atalanta) on cell (cx, cz) at floor height h. */
  private fits(cx: number, cz: number, h: number): boolean {
    const w = this.world;
    const x = Grid.center(cx);
    const z = Grid.center(cz);
    const tall = this.id === 'atalanta' ? 0.6 : FOLLOWER_HEIGHT[this.id] - 0.2;
    return !pointBlocked(w.grid, w.boxes, x, h + 0.3, z) && !pointBlocked(w.grid, w.boxes, x, h + tall, z);
  }

  /**
   * A walking route (cell centres) from the follower to the leader over plain floor, using only steps
   * and hops this hero can make. Finds the way round once the leader opens a door or brings out a
   * bridge. Null if there is none (yet).
   */
  private findRoute(p: Player): { x: number; y: number; z: number }[] | null {
    const g = this.world.grid;
    const b = p.body;
    const sx = Grid.toCell(this.x);
    const sz = Grid.toCell(this.z);
    const tx = Grid.toCell(b.x);
    const tz = Grid.toCell(b.z);
    const rise = this.id === 'jason' ? Math.min(2.4, maxRise(this.world.save.abilities, PLAYER.jumpV)) : this.id === 'atalanta' ? 2.4 : 1.3;
    const key = (cx: number, cz: number) => cz * g.width + cx;
    const prev = new Map<number, number>();
    const start = key(sx, sz);
    prev.set(start, -1);
    const queue = [start];
    const goal = key(tx, tz);
    const floorAt = (cx: number, cz: number) => {
      const c = g.cell(cx, cz);
      return c.kind === 'wall' || c.kind === 'void' || c.kind === 'hazard' ? null : c.h;
    };
    while (queue.length) {
      const k = queue.shift() as number;
      if (k === goal) break;
      const cx = k % g.width;
      const cz = (k - cx) / g.width;
      const h = floorAt(cx, cz) ?? this.y;
      for (const [dx, dz] of SIDES) {
        const nx = cx + dx;
        const nz = cz + dz;
        if (!g.inside(nx, nz) || Math.abs(nx - sx) > 40 || Math.abs(nz - sz) > 40) continue;
        const nk = key(nx, nz);
        if (prev.has(nk)) continue;
        const nh = floorAt(nx, nz);
        if (nh === null || nh - h > rise || nh - h < -6) continue;
        // No cutting corners past a wall.
        if (dx && dz && (floorAt(cx + dx, cz) === null || floorAt(cx, cz + dz) === null)) continue;
        if (!this.fits(nx, nz, nh)) continue;
        prev.set(nk, k);
        queue.push(nk);
      }
    }
    if (!prev.has(goal)) return null;
    const out: { x: number; y: number; z: number }[] = [];
    for (let k = goal; k !== start && k >= 0; k = prev.get(k) as number) {
      const cx = k % g.width;
      const cz = (k - cx) / g.width;
      out.push({ x: Grid.center(cx), y: floorAt(cx, cz) ?? 0, z: Grid.center(cz) });
    }
    return out.reverse();
  }

  /** Jason fired the grapple with this follower close by: it grabs on and zips along with him. */
  tandem(to: THREE.Vector3, hook: THREE.Vector3, time: number, p: Player) {
    if (this.busy || Math.hypot(p.body.x - this.x, p.body.z - this.z) > HERO_SWITCH.tandem) return;
    const back = new THREE.Vector3(this.x - p.body.x, 0, this.z - p.body.z).setLength(0.9);
    const land = to.clone().add(back);
    const c = this.world.grid.cell(Grid.toCell(land.x), Grid.toCell(land.z));
    if (c.kind === 'wall' || c.kind === 'void' || c.kind === 'hazard' || Math.abs(c.h - to.y) > 0.5) land.set(to.x, to.y, to.z);
    this.leap = { from: new THREE.Vector3(this.x, this.y, this.z), to: land, k: 0, time: time + 0.05, height: 0, hook: hook.clone() };
    this.trail = [];
    this.state = 'follow';
  }

  update(dt: number, p: Player) {
    this.sample(dt, p);
    const m = this.model;
    // Still stone from MEDUSA's gaze: a statue stays put.
    if (p.stoneLeft(this.id) > 0) {
      this.bubble.visible = false;
      return;
    }
    let speed = 0;
    let air = false;
    if (this.rope) air = this.updateRope(dt, p);
    else if (this.leap) {
      air = true;
      this.updateLeap(dt);
    } else speed = this.walk(dt, p);

    m.root.position.set(this.x, this.y, this.z);
    m.root.rotation.y = this.facing;
    const shadow = m.root.children[m.root.children.length - 1];
    const floor = this.world.grid.standTop(Grid.toCell(this.x), Grid.toCell(this.z));
    shadow.position.y = air ? Math.max(0.02, floor - this.y + 0.03) : 0.03;
    this.animate(dt, speed, air);
    // The "..." bubble, once it has been waiting a moment.
    this.waitT = this.waiting ? this.waitT + dt : 0;
    this.bubble.visible = this.waitT > 0.6;
    if (this.bubble.visible) this.bubble.position.set(this.x, this.y + FOLLOWER_HEIGHT[this.id] + 0.9 + Math.sin(this.waitT * 3) * 0.08, this.z);
  }

  /** Walking along the trail (or a route found round an obstacle), or waiting. Returns its speed. */
  private walk(dt: number, p: Player): number {
    const b = p.body;
    const lead = Math.hypot(b.x - this.x, b.z - this.z);
    // Close to the leader again: whatever the trail says, carry on from here.
    if (lead <= this.gap && Math.abs(b.y - this.y) < 1.5) {
      if (this.state !== 'follow') this.trail = [];
      this.state = 'follow';
      this.route = [];
      this.facing = dampAngle(this.facing, Math.atan2(b.x - this.x, b.z - this.z), 4, dt);
      return 0;
    }
    this.lookT -= dt;
    if (this.state === 'wait') {
      this.facing = dampAngle(this.facing, Math.atan2(b.x - this.x, b.z - this.z), 3, dt);
      if (this.lookT > 0) return 0;
      this.lookT = 0.35;
      if (this.tryHelp(p)) return 0;
      // The way on might be open again (the leader came back over), or a way round may have opened.
      const next = this.nextCrumb(b);
      if (next && this.canReach(next)) this.state = 'follow';
      else {
        const r = this.findRoute(p);
        if (r) {
          this.route = r;
          this.state = 'route';
        }
      }
      return 0;
    }
    if (this.state === 'route') return this.walkRoute(dt, p);

    const target = this.nextCrumb(b);
    if (!target) {
      // No footprints left to follow (just after a switch, or the leader went straight up): find a way
      // to the leader, or wait (where a leader standing above can help).
      if (this.lookT <= 0) {
        this.lookT = 0.35;
        const r = this.findRoute(p);
        if (r) {
          this.route = r;
          this.state = 'route';
        } else this.startWait();
      }
      return 0;
    }
    const how = this.canReach(target);
    if (!how) {
      const r = this.findRoute(p);
      if (r) {
        this.route = r;
        this.state = 'route';
      } else this.startWait();
      return 0;
    }
    if (how === 'climb') {
      const rise = Math.max(0.5, target.y - this.y);
      this.leap = { from: new THREE.Vector3(this.x, this.y, this.z), to: new THREE.Vector3(target.x, target.y, target.z), k: 0, time: rise / ATALANTA.climbSpeed + ATALANTA.climbMantle, height: 0, hook: null, climb: true };
      this.trail.shift();
      return 0;
    }
    if (how === 'jump' || how === 'zip') {
      const d = Math.hypot(target.x - this.x, target.z - this.z);
      const hook = how === 'zip' ? new THREE.Vector3(target.x, target.y + 2.2, target.z) : null;
      const time = how === 'zip' ? GRAPPLE.time + d * GRAPPLE.timePerUnit + 0.1 : clamp(0.32 + d * 0.045 + Math.max(0, target.y - this.y) * 0.04, 0.35, 1.1);
      this.leap = { from: new THREE.Vector3(this.x, this.y, this.z), to: new THREE.Vector3(target.x, target.y, target.z), k: 0, time, height: how === 'zip' ? 0.6 : 0.9 + d * 0.06, hook };
      this.trail.shift();
      if (how === 'jump') audio.play('jump', HEROES[this.id].jumpV > PLAYER.jumpV ? 1.15 : 0.95, 0.35);
      else audio.play('zap', 1.8, 0.4);
      return 0;
    }
    return this.stepToward(dt, target, lead, target.moves.includes('crawl'));
  }

  /** The oldest footprint that is still far enough behind the leader (dropping the ones already reached). */
  private nextCrumb(b: { x: number; y: number; z: number }): Crumb | null {
    while (this.trail.length) {
      const c = this.trail[0];
      if (Math.hypot(c.x - this.x, c.z - this.z) < 0.35 && Math.abs(c.y - this.y) < 0.6) {
        this.trail.shift();
        continue;
      }
      // Footprints close to the leader are where it stands anyway (unless the leader is far above or below).
      if (Math.hypot(c.x - b.x, c.z - b.z) < this.gap && Math.abs(c.y - b.y) < 1.5) return null;
      return c;
    }
    return null;
  }

  private startWait() {
    if (this.state === 'wait') return;
    this.state = 'wait';
    this.lookT = 0.35;
    this.route = [];
  }

  /** Walks toward a spot on foot (a small hop up a step). Returns the speed. */
  private stepToward(dt: number, c: { x: number; y: number; z: number }, lead: number, crawl: boolean): number {
    const dx = c.x - this.x;
    const dz = c.z - this.z;
    const d = Math.hypot(dx, dz);
    // Under a low ceiling she crawls, whatever the footprints say.
    if (this.id === 'atalanta' && pointBlocked(this.world.grid, this.world.boxes, this.x, this.y + 1.3, this.z)) crawl = true;
    let speed = Math.min(HERO_SWITCH.followSpeed, HEROES[this.id].speed * (lead > 6 ? 1.4 : 1));
    if (crawl) speed = ATALANTA.crawlSpeed * 1.3;
    const step = Math.min(d, speed * dt);
    if (d > 0.01) {
      this.x += (dx / d) * step;
      this.z += (dz / d) * step;
      this.facing = dampAngle(this.facing, Math.atan2(dx, dz), 12, dt);
    }
    this.y = damp(this.y, c.y, 14, dt);
    this.crawlPose = crawl;
    return speed;
  }

  private crawlPose = false;

  /** Following a route round an obstacle, cell by cell (hopping up and down steps). */
  private walkRoute(dt: number, p: Player): number {
    const b = p.body;
    const lead = Math.hypot(b.x - this.x, b.z - this.z);
    const c = this.route[0];
    if (!c) {
      this.state = 'follow';
      this.trail = [];
      return 0;
    }
    if (Math.hypot(c.x - this.x, c.z - this.z) < 0.3 && Math.abs(c.y - this.y) < 0.3) {
      this.route.shift();
      return 0;
    }
    // A door shut again (or something rolled in the way): wait and look again.
    if (this.lineBlocked(c, false) || !this.fits(Grid.toCell(c.x), Grid.toCell(c.z), c.y)) {
      this.startWait();
      return 0;
    }
    if (Math.abs(c.y - this.y) > 0.6) {
      const d = Math.hypot(c.x - this.x, c.z - this.z);
      this.leap = { from: new THREE.Vector3(this.x, this.y, this.z), to: new THREE.Vector3(c.x, c.y, c.z), k: 0, time: clamp(0.3 + d * 0.05, 0.3, 0.7), height: 0.7, hook: null };
      this.route.shift();
      return 0;
    }
    return this.stepToward(dt, c, lead, false);
  }

  /** The arc of a jump (or a zip on the grapple line). */
  private updateLeap(dt: number) {
    const l = this.leap;
    if (!l) return;
    l.k = Math.min(1, l.k + dt / l.time);
    const k = l.hook ? 1 - Math.pow(1 - l.k, 2) : l.k;
    const top = Math.max(l.from.y, l.to.y) - Math.min(l.from.y, l.to.y);
    if (l.climb) {
      // Up the face (most of the time), then over the lip onto the top.
      const split = 1 - ATALANTA.climbMantle / l.time;
      const up = Math.min(1, l.k / split);
      const over = Math.max(0, (l.k - split) / (1 - split));
      this.y = l.from.y + (l.to.y - l.from.y) * up;
      this.x = l.from.x + (l.to.x - l.from.x) * over;
      this.z = l.from.z + (l.to.z - l.from.z) * over;
      this.phase += dt * 6;
    } else {
      this.x = l.from.x + (l.to.x - l.from.x) * k;
      this.z = l.from.z + (l.to.z - l.from.z) * k;
      this.y = l.from.y + (l.to.y - l.from.y) * k + Math.sin(k * Math.PI) * (l.height + (l.hook ? 0 : top * 0.25));
    }
    this.facing = dampAngle(this.facing, Math.atan2(l.to.x - l.from.x, l.to.z - l.from.z), 14, dt);
    if (l.hook) this.drawRope(new THREE.Vector3(this.x, this.y + 1.3, this.z), l.hook, '#c8a46a');
    if (l.k >= 1) {
      this.leap = null;
      this.hideRope();
      this.world.particles.emit(this.x, this.y + 0.1, this.z, { count: 5, color: '#ffffff', speed: 1.8, life: 0.25, size: 0.3, gravity: 1 });
    }
  }

  /**
   * A leader standing right above a waiting follower lends a hand: Atalanta drops a climbing rope,
   * Jason lowers his grapple line, General Brennus reaches down. Then the follower climbs up.
   */
  private tryHelp(p: Player): boolean {
    const b = p.body;
    if (!b.grounded || p.busyHelping || p.down || this.world.cutscene) return false;
    const rise = b.y - this.y;
    const across = Math.hypot(b.x - this.x, b.z - this.z);
    if (rise < HERO_SWITCH.helpMinRise || rise > HERO_SWITCH.helpMaxRise || across > HERO_SWITCH.helpReach) return false;
    if (Math.hypot(p.vx, p.vz) > 3) return false;
    // The rope hangs from the lip straight down to the follower: nothing may be in the way.
    const w = this.world;
    for (const f of [0.3, 0.6, 0.95]) if (pointBlocked(w.grid, w.boxes, this.x, this.y + 1.2 + rise * f, this.z)) return false;
    if (pointBlocked(w.grid, w.boxes, (this.x + b.x) / 2, b.y + 0.9, (this.z + b.z) / 2)) return false;
    const to = new THREE.Vector3(b.x + (this.x - b.x) * 0.35, b.y, b.z + (this.z - b.z) * 0.35);
    this.rope = { from: new THREE.Vector3(this.x, this.y, this.z), to, t: 0, drop: HERO_SWITCH.helpDrop, climb: Math.max(0.5, rise / HERO_SWITCH.helpClimb) };
    p.lendHand(this, new THREE.Vector3(this.x, this.y, this.z));
    audio.play('zap', 0.9, 0.3);
    this.state = 'follow';
    this.trail = [];
    return true;
  }

  /** The hand-up in progress. Returns true while the follower is off the ground. */
  private updateRope(dt: number, p: Player): boolean {
    const r = this.rope;
    if (!r) return false;
    r.t += dt;
    const b = p.body;
    const hand = new THREE.Vector3(b.x + (this.x - b.x) * 0.25, b.y + 0.5, b.z + (this.z - b.z) * 0.25);
    const color = p.hero === 'atalanta' ? '#d9b26a' : p.hero === 'jason' ? '#7fe6ff' : '#5a4a3a';
    if (r.t < r.drop) {
      // The rope unrolls down the wall.
      const k = r.t / r.drop;
      this.drawRope(hand, hand.clone().lerp(new THREE.Vector3(this.x, this.y + 1.6, this.z), k), color);
      this.facing = dampAngle(this.facing, Math.atan2(b.x - this.x, b.z - this.z), 10, dt);
      return false;
    }
    const k = Math.min(1, (r.t - r.drop) / r.climb);
    // Up the rope hand over hand, then a little step onto the top.
    const up = Math.min(1, k / 0.8);
    const over = Math.max(0, (k - 0.8) / 0.2);
    this.y = r.from.y + (r.to.y - r.from.y) * up;
    this.x = r.from.x + (r.to.x - r.from.x) * over;
    this.z = r.from.z + (r.to.z - r.from.z) * over;
    this.phase += dt * 9;
    this.drawRope(hand, new THREE.Vector3(this.x, this.y + 1.5, this.z), color);
    if (k >= 1) {
      this.endRope();
      p.lendHand(null);
      this.placeNear(b.x, b.y, b.z, p.facing);
      audio.play('land', 1.1, 0.5);
      return false;
    }
    return true;
  }

  private endRope() {
    if (!this.rope) return;
    this.rope = null;
    this.hideRope();
  }

  /** A rope (or grapple line) between two points. */
  private drawRope(a: THREE.Vector3, b: THREE.Vector3, color: string) {
    if (!this.ropeMesh) {
      this.ropeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 6, 1).translate(0, 0.5, 0).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color }));
      this.world.scene.add(this.ropeMesh);
    }
    const r = this.ropeMesh;
    (r.material as THREE.MeshBasicMaterial).color.set(color);
    r.visible = true;
    r.position.copy(a);
    r.lookAt(b);
    r.scale.set(1, 1, Math.max(0.01, a.distanceTo(b)));
  }

  private hideRope() {
    if (this.ropeMesh) this.ropeMesh.visible = false;
  }

  /** Walking, crawling, flying through the air or climbing the rope. */
  private animate(dt: number, speed: number, air: boolean) {
    const m = this.model;
    const walk = clamp(speed / 7, 0, 1.3);
    this.phase += dt * (5 + 9 * walk);
    const s = Math.sin(this.phase);
    if ((this.rope && this.rope.t >= this.rope.drop) || this.leap?.climb) {
      // Hand over hand up the rope (or the handholds), feet against the wall.
      m.armL.rotation.set(-2.7 + s * 0.4, 0, -0.2);
      m.armR.rotation.set(-2.7 - s * 0.4, 0, 0.2);
      m.legL.rotation.set(-0.8 + s * 0.4, 0, 0);
      m.legR.rotation.set(-0.8 - s * 0.4, 0, 0);
      m.body.position.y = 0;
      m.body.rotation.set(-0.1, 0, 0);
    } else if (this.crawlPose && !air && walk > 0) {
      m.body.position.y = -0.5;
      m.body.rotation.set(0.9, 0, 0);
      m.legL.rotation.set(-1.2 + s * 0.5, 0, 0);
      m.legR.rotation.set(-1.2 - s * 0.5, 0, 0);
      m.armL.rotation.set(-1.3 - s * 0.4, 0, 0);
      m.armR.rotation.set(-1.3 + s * 0.4, 0, 0);
    } else {
      const zip = this.leap?.hook;
      m.legL.rotation.set(air ? -0.6 : s * 0.9 * walk, 0, 0);
      m.legR.rotation.set(air ? 0.35 : -s * 0.9 * walk, 0, 0);
      m.armL.rotation.set(zip ? -2.9 : air ? -2 : -s * 0.7 * walk, 0, 0.05);
      m.armR.rotation.set(zip ? -2.9 : air ? -2 : s * 0.7 * walk, 0, -0.05);
      m.body.position.y = air ? 0 : Math.abs(s) * 0.07 * walk;
      m.body.rotation.set(walk * 0.08, 0, 0);
    }
    if (!speed) this.crawlPose = false;
    m.body.scale.set(1, 1, 1);
    m.root.visible = true;
  }

  /** Takes the bubble and the rope out of the scene (the level is over). */
  dispose() {
    this.bubble.removeFromParent();
    this.ropeMesh?.removeFromParent();
  }
}
