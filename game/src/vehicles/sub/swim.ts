import { laneAt, type Beacon, type BoltPick, type Radio, type Ring, type Rock } from '../course';
import { DIVE, SONG, approachV, nearestBeat, songStrength, throughDoor, type Arena, type Buoy, type Current, type Dark, type DiveCourse, type DiveThing, type Door, type Pearl, type School } from './dive';

/**
 * The Dolphin's dive, step by step: forward speed, steering, currents and kelp, bumping into reefs and
 * sunken columns, Gardener gates, rings, bolts and hidden pearls, the sonar PING, the piranha drones,
 * and the siren buoys (their pull, and LUX's counter-song). No three.js: the submarine draws it, and
 * the tests swim it with an autopilot.
 */

export interface DiveInput {
  /** Stick: -1..1 left/right and down/up. */
  steerX: number;
  steerY: number;
  /** The PING / SING button was pressed this step. */
  ping: boolean;
}

/** A siren buoy while the dive goes on: how many good notes LUX has sung at it, torpedo hits left, and if it went quiet. */
export interface BuoyState {
  b: Buoy;
  notes: number;
  hp: number;
  quiet: '' | 'song' | 'shot';
  /** The beat numbers already sung (each beat counts once). */
  sung: Set<number>;
}

/** A piranha drone. `stun` counts down after a PING; `fled` once it nibbled the hull and swims off. */
export interface Fish {
  s: number;
  x: number;
  y: number;
  stun: number;
  fled: boolean;
  alive: boolean;
  wiggle: number;
}

export interface DiveEvents {
  bump?(thing: Rock | { kind: 'pillar' | 'buoy'; s: number; x: number; y: number }): void;
  door?(d: Door, ok: boolean): void;
  ring?(r: Ring): void;
  bolt?(b: BoltPick): void;
  pearl?(p: Pearl): void;
  beacon?(b: Beacon): void;
  radio?(r: Radio): void;
  ping?(): void;
  empty?(): void;
  /** A buoy started to sing (the first time the sub comes in range). */
  song?(b: BuoyState): void;
  note?(b: BuoyState, good: boolean): void;
  silenced?(b: BuoyState): void;
  school?(fish: Fish[]): void;
  nibble?(f: Fish): void;
  kelp?(): void;
  hurt?(): void;
  arena?(a: Arena): void;
  finish?(): void;
}

export class Dive {
  readonly things: DiveThing[];
  s = 0;
  x = 0;
  y = 0;
  v: number = DIVE.cruise;
  t = 0;
  hull: number = DIVE.hull;
  invuln = 0;
  /** Sonar meter (0..1), and how long what the last PING lit up stays lit. */
  meter = 1;
  reveal = 0;
  /** While the pull is calmed by a good note. */
  calm = 0;
  /** Stopped in the boss arena. */
  holding = false;
  arenaDone = false;
  finished = false;
  inKelp = false;
  /** Rings, bolts and pearls taken (indices into `things`). */
  readonly gone = new Set<number>();
  readonly buoys: BuoyState[];
  readonly fish: Fish[] = [];
  /** Bumps and wrong doorways since the start, and since the last checkpoint. */
  bumps = 0;
  doorBonks = 0;
  private passed = 0;
  private sentSchools = new Set<number>();
  private heard = new Set<string>();
  private kelpT = 0;

  constructor(readonly course: DiveCourse) {
    this.things = [...course.things].sort((a, b) => a.s - b.s);
    this.buoys = this.things.filter((t): t is Buoy => t.kind === 'buoy').map((b) => ({ b, notes: 0, hp: SONG.hp, quiet: '', sung: new Set() }));
    this.restart(0);
  }

  /** Back to distance `s` on the guide route (a checkpoint restart): everything ahead comes back. */
  restart(s: number) {
    this.s = s;
    [this.x, this.y] = laneAt(this.course.guide, s);
    this.v = DIVE.cruise;
    this.holding = false;
    this.invuln = 0;
    this.hull = DIVE.hull;
    this.calm = 0;
    this.reveal = 0;
    for (const i of [...this.gone]) if (this.things[i].s > s) this.gone.delete(i);
    for (const b of this.buoys) {
      if (b.b.s <= s) continue;
      b.notes = 0;
      b.hp = SONG.hp;
      b.quiet = '';
      b.sung.clear();
      this.heard.delete(b.b.id);
    }
    for (const i of [...this.sentSchools]) if (this.things[i].s > s) this.sentSchools.delete(i);
    this.fish.length = 0;
    this.passed = this.things.findIndex((t) => t.s > s);
    if (this.passed < 0) this.passed = this.things.length;
  }

  /** The arena ahead (not yet won), if any. */
  get arena(): Arena | null {
    if (this.arenaDone) return null;
    return (this.things.find((t) => t.kind === 'arena') as Arena | undefined) ?? null;
  }

  /** The dark stretch the sub is in, if any. */
  get dark(): Dark | null {
    for (const t of this.things) if (t.kind === 'dark' && this.s >= t.s && this.s < t.s + t.len) return t;
    return null;
  }

  /** The current the sub is in, if any. */
  get current(): Current | null {
    for (const t of this.things) if (t.kind === 'current' && this.s >= t.s && this.s < t.s + t.len) return t;
    return null;
  }

  /** The loudest buoy singing at the sub right now (the nearest one in range that isn't quiet). */
  get singer(): BuoyState | null {
    let best: BuoyState | null = null;
    let bestRel = Infinity;
    for (const b of this.buoys) {
      const rel = b.b.s - this.s;
      if (b.quiet || songStrength(rel) <= 0 || rel >= bestRel) continue;
      best = b;
      bestRel = rel;
    }
    return best;
  }

  /** Adds a buoy during the dive (the Siren Organ raises its own). */
  addBuoy(b: Buoy): BuoyState {
    const st: BuoyState = { b, notes: 0, hp: SONG.hp, quiet: '', sung: new Set() };
    this.buoys.push(st);
    return st;
  }

  /** Sends in a school of piranhas `ahead` units in front of the sub. */
  spawnSchool(n: number, ahead: number, x = this.x, y = this.y, ev: DiveEvents = {}): Fish[] {
    const out: Fish[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const f: Fish = { s: this.s + ahead + (i % 3) * 2.5, x: x + Math.cos(a) * 2.2, y: y + Math.sin(a) * 1.4, stun: 0, fled: false, alive: true, wiggle: i * 1.7 };
      this.fish.push(f);
      out.push(f);
    }
    ev.school?.(out);
    return out;
  }

  /** Loses a hull heart (unless still blinking from the last hit). Returns true if it hurt. */
  hurt(ev: DiveEvents): boolean {
    if (this.invuln > 0 || this.finished) return false;
    this.hull = Math.max(0, this.hull - 1);
    this.invuln = DIVE.invuln;
    ev.hurt?.();
    return true;
  }

  /** A torpedo hit a buoy: after SONG.hp hits it falls quiet. */
  shootBuoy(b: BuoyState, ev: DiveEvents): void {
    if (b.quiet) return;
    b.hp -= 1;
    if (b.hp > 0) return;
    b.quiet = 'shot';
    ev.silenced?.(b);
  }

  /** PING, or SING while a buoy sings: a note on the beat counts toward silencing it. */
  private press(ev: DiveEvents) {
    const singer = this.singer;
    if (singer) {
      const { off, n } = nearestBeat(this.t);
      const good = Math.abs(off) <= SONG.window && !singer.sung.has(n);
      if (good) {
        singer.sung.add(n);
        singer.notes += 1;
        this.calm = SONG.calm;
      }
      ev.note?.(singer, good);
      if (good && singer.notes >= SONG.notes) {
        singer.quiet = 'song';
        ev.silenced?.(singer);
      }
      return;
    }
    if (this.meter < DIVE.pingCost - 1e-6) {
      ev.empty?.();
      return;
    }
    this.meter -= DIVE.pingCost;
    this.reveal = DIVE.pingReveal;
    for (const f of this.fish) if (f.alive && f.s - this.s < DIVE.pingReach && f.s - this.s > -3) f.stun = DIVE.stun;
    ev.ping?.();
  }

  step(dt: number, input: DiveInput, ev: DiveEvents = {}) {
    if (this.finished) return;
    this.t += dt;
    this.invuln = Math.max(0, this.invuln - dt);
    this.reveal = Math.max(0, this.reveal - dt);
    this.calm = Math.max(0, this.calm - dt);
    this.meter = Math.min(1, this.meter + DIVE.pingRecharge * dt);
    if (input.ping) this.press(ev);

    // Forward: cruising, rushing along in a fast current, slowed by kelp, or braking for the arena.
    const cur = this.current;
    let want: number = cur?.rush ? DIVE.rush : DIVE.cruise;
    if (this.inKelp) want *= DIVE.kelpDrag;
    // A siren's song makes the engine sleepy: the sub slows down while one sings at it (time to sing back).
    if (this.singer) want *= SONG.lull;
    const arena = this.arena;
    if (arena) {
      const left = arena.s - this.s;
      if (left < DIVE.brake) want = Math.min(want, Math.max(1, DIVE.cruise * Math.sqrt(Math.max(0, left) / DIVE.brake)));
    }
    this.v = this.holding ? 0 : approachV(this.v, want, dt);
    const s0 = this.s;
    this.s += this.v * dt;
    if (arena && this.s >= arena.s - 0.05) {
      this.s = arena.s;
      if (!this.holding) {
        this.holding = true;
        this.v = 0;
        ev.arena?.(arena);
      }
    }

    // Steering, currents, and the siren's pull.
    this.x += input.steerX * DIVE.steer * dt;
    this.y += input.steerY * DIVE.steer * dt;
    if (cur) {
      this.x += cur.vx * dt;
      this.y += cur.vy * dt;
    }
    const singer = this.singer;
    if (singer) {
      if (!this.heard.has(singer.b.id)) {
        this.heard.add(singer.b.id);
        ev.song?.(singer);
      }
      if (this.calm <= 0) {
        const k = songStrength(singer.b.s - this.s) * SONG.pull * dt;
        const dx = singer.b.x - this.x;
        const dy = singer.b.y - this.y;
        const d = Math.hypot(dx, dy);
        if (d > 0.3) {
          this.x += (dx / d) * Math.min(k, d);
          this.y += (dy / d) * Math.min(k, d);
        }
      }
    }
    this.x = Math.max(-DIVE.halfW + 0.6, Math.min(DIVE.halfW - 0.6, this.x));
    this.y = Math.max(-DIVE.halfH + 0.6, Math.min(DIVE.halfH - 0.6, this.y));

    this.swimFish(dt, ev);
    this.touch(s0, ev);
  }

  /** Piranhas swim in toward the sub, home in on it, and nibble; stunned ones just drift. */
  private swimFish(dt: number, ev: DiveEvents) {
    for (let i = this.passed; i < this.things.length; i++) {
      const th = this.things[i];
      if (th.s > this.s + 70) break;
      if (th.kind !== 'fish' || this.sentSchools.has(i)) continue;
      this.sentSchools.add(i);
      const school = th as School;
      this.spawnSchool(school.n, th.s - this.s, school.x ?? this.x, school.y ?? this.y, ev);
    }
    for (const f of this.fish) {
      if (!f.alive) continue;
      f.wiggle += dt * 9;
      if (f.stun > 0) {
        f.stun = Math.max(0, f.stun - dt);
        f.s += this.v * dt * 0.2;
        f.y += dt * 0.4;
        continue;
      }
      if (f.fled) {
        f.s += dt * 8;
        f.y += dt * 4;
        if (f.y > DIVE.halfH + 6) f.alive = false;
        continue;
      }
      // They dart toward the sub, and steer at it (a little slower than the sub can dodge).
      f.s -= dt * 7;
      const k = Math.min(1, dt * 1.6);
      f.x += (this.x - f.x) * k * 0.9 + Math.sin(f.wiggle) * dt * 1.5;
      f.y += (this.y - f.y) * k * 0.9;
      if (f.s < this.s - 8) f.alive = false;
      else if (Math.hypot(f.x - this.x, f.y - this.y, f.s - this.s) < 1.4) {
        if (this.hurt(ev)) ev.nibble?.(f);
        f.fled = true;
      }
    }
    for (let i = this.fish.length - 1; i >= 0; i--) if (!this.fish[i].alive) this.fish.splice(i, 1);
  }

  /** Bumps, pickups, gates and everything the sub swam past between s0 and now. */
  private touch(s0: number, ev: DiveEvents) {
    const R = DIVE.radius;
    let kelp = false;
    for (let i = Math.max(0, this.passed - 60); i < this.things.length; i++) {
      const th = this.things[i];
      if (th.s > this.s + 8) break;
      if (th.s < s0 - 8 || this.gone.has(i)) continue;
      switch (th.kind) {
        case 'rock':
          if (Math.hypot(th.x - this.x, th.y - this.y, th.s - this.s) < th.r + R && this.hurt(ev)) {
            this.gone.add(i);
            this.bumps += 1;
            ev.bump?.(th);
          }
          break;
        case 'pillar':
          if (Math.abs(th.s - this.s) < th.r + R * 0.6 && Math.abs(th.x - this.x) < th.r + R * 0.6 && this.hurt(ev)) {
            this.bumps += 1;
            this.x += Math.sign(this.x - th.x || 1) * 1.5;
            ev.bump?.({ kind: 'pillar', s: th.s, x: th.x, y: this.y });
          }
          break;
        case 'kelp':
          if (Math.abs(th.s - this.s) < 1.4 && Math.abs(th.x - this.x) < 1.3 && this.y < th.top) kelp = true;
          break;
        case 'bolt':
          if (Math.abs(th.s - this.s) < 1.5 && Math.hypot(th.x - this.x, th.y - this.y) < DIVE.pickup) {
            this.gone.add(i);
            ev.bolt?.(th);
          }
          break;
        case 'pearl':
          if (this.reveal > 0 && Math.abs(th.s - this.s) < 1.6 && Math.hypot(th.x - this.x, th.y - this.y) < DIVE.pickup + 0.4) {
            this.gone.add(i);
            ev.pearl?.(th);
          }
          break;
        case 'ring':
          if (th.s > s0 && th.s <= this.s && Math.hypot(th.x - this.x, th.y - this.y) < DIVE.ringRadius) {
            this.gone.add(i);
            ev.ring?.(th);
          }
          break;
        case 'door':
          if (th.s > s0 && th.s <= this.s) {
            const ok = throughDoor(th, this.x, this.y);
            if (!ok) {
              // BONK: a sealed doorway. Back off a little and try again.
              this.hurt(ev);
              this.doorBonks += 1;
              this.s = th.s - 7;
              this.v = 0;
            }
            ev.door?.(th, ok);
            if (!ok) return;
          }
          break;
      }
    }
    for (const b of this.buoys) {
      if (b.quiet || Math.abs(b.b.s - this.s) > 1.5) continue;
      if (Math.hypot(b.b.x - this.x, b.b.y - this.y) < 1.2 + R && this.hurt(ev)) {
        this.bumps += 1;
        ev.bump?.({ kind: 'buoy', s: b.b.s, x: b.b.x, y: b.b.y });
      }
    }
    if (kelp && !this.inKelp && this.t - this.kelpT > 2) {
      this.kelpT = this.t;
      ev.kelp?.();
    }
    this.inKelp = kelp;
    while (this.passed < this.things.length && this.things[this.passed].s <= this.s) {
      const th = this.things[this.passed];
      this.passed += 1;
      if (th.kind === 'checkpoint') {
        this.hull = DIVE.hull;
        ev.beacon?.(th);
      } else if (th.kind === 'radio') ev.radio?.(th);
      else if (th.kind === 'surface') {
        this.finished = true;
        ev.finish?.();
        return;
      }
    }
  }

  /** The boss is beaten: the sub swims on to the surface. */
  release() {
    this.arenaDone = true;
    this.holding = false;
  }
}
