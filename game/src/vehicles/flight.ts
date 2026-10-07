import {
  CLASH,
  FLIGHT,
  approach,
  clashRoom,
  crushed,
  holdGroup,
  holdSpeed,
  laneAt,
  type Beacon,
  type BoltPick,
  type Clash,
  type CourseThing,
  type Crystal,
  type FlightCourse,
  type Hold,
  type Radio,
  type Ring,
  type Rock,
} from './course';

/**
 * The Argo's flight, step by step: forward speed, steering, boosts, hold lines and launches, and
 * bumping into the course (asteroids, crystals, rings, bolts, the Clashing Rocks). No three.js: the
 * flight controller draws it, and the tests fly it with an autopilot.
 */

export interface FlightInput {
  /** Stick: -1..1 left/right and down/up. */
  steerX: number;
  steerY: number;
  /** BOOST was pressed this step. */
  boost: boolean;
}

/** What happened during a step, for sounds, effects and the HUD. */
export interface FlightEvents {
  bump?(thing: Rock | Crystal, shielded: boolean): void;
  crush?(c: Clash): void;
  ring?(r: Ring): void;
  bolt?(b: BoltPick): void;
  beacon?(b: Beacon): void;
  radio?(r: Radio): void;
  /** The Argo has stopped at a hold line and waits for BOOST. */
  hold?(h: Hold): void;
  launch?(h: Hold): void;
  boost?(): void;
  /** BOOST pressed with an empty meter. */
  empty?(): void;
  /** Lost a hull heart (from anything). */
  hurt?(): void;
  finish?(): void;
}

export class Flight {
  /** Everything on the course, sorted by `s`. */
  readonly things: CourseThing[];
  /** Distance flown, place in the corridor, forward speed and the clock (the Clashing Rocks' rhythm). */
  s = 0;
  x = 0;
  y = 0;
  v: number = FLIGHT.cruise;
  t = 0;
  hull: number = FLIGHT.hull;
  invuln = 0;
  /** Boost meter (0..1) and the time left on the current boost. */
  meter = 1;
  boostT = 0;
  /** True while stopped at a hold line. */
  holding = false;
  /** While launched through a row of Clashing Rocks, the distance where the sprint ends. */
  launchUntil = -1;
  /** Hold lines already launched from (by `s`), so the Argo doesn't stop at them again. */
  private cleared = new Set<number>();
  /** Rings and bolts taken, crystals and rocks broken (indices into `things`). */
  readonly gone = new Set<number>();
  finished = false;
  /** Crushes and bumps since the start (for the side quests). */
  crushes = 0;
  bumps = 0;
  private passed = 0;

  constructor(readonly course: FlightCourse) {
    this.things = [...course.things].sort((a, b) => a.s - b.s);
    this.restart(0);
  }

  /** Puts the Argo back at distance `s` on the guide route at cruising speed (a checkpoint restart). */
  restart(s: number) {
    this.s = s;
    [this.x, this.y] = laneAt(this.course.guide, s);
    this.v = FLIGHT.cruise;
    this.holding = false;
    this.launchUntil = -1;
    this.boostT = 0;
    this.invuln = 0;
    this.hull = FLIGHT.hull;
    for (const s0 of [...this.cleared]) if (s0 > s) this.cleared.delete(s0);
    // Everything ahead comes back: rings to fly through again, crystals to blast again.
    for (const i of [...this.gone]) if (this.things[i].s > s) this.gone.delete(i);
    this.passed = this.things.findIndex((t) => t.s > s);
    if (this.passed < 0) this.passed = this.things.length;
  }

  /** The hold line ahead that the Argo is going to stop at, if any. */
  get hold(): Hold | null {
    if (this.launchUntil > this.s) return null;
    for (let i = this.passed - 1; i < this.things.length; i++) {
      const th = this.things[Math.max(0, i)];
      if (th.s < this.s - 0.5) continue;
      if (th.kind === 'hold' && !this.cleared.has(th.s)) return th;
      if (th.s > this.s + FLIGHT.brake + 2) break;
    }
    return null;
  }

  get boosting() {
    return this.boostT > 0;
  }

  /** The pairs of Clashing Rocks within `ahead` units in front (and just behind). */
  clashesNear(ahead = 300): Clash[] {
    const out: Clash[] = [];
    for (const th of this.things) {
      if (th.kind !== 'clash') continue;
      if (th.s > this.s - CLASH.depth && th.s < this.s + ahead) out.push(th);
    }
    return out;
  }

  /** Loses a hull heart (unless still blinking from the last hit). Returns true if it hurt. */
  hurt(ev: FlightEvents): boolean {
    if (this.invuln > 0 || this.finished) return false;
    this.hull = Math.max(0, this.hull - 1);
    this.invuln = FLIGHT.invuln;
    ev.hurt?.();
    return true;
  }

  step(dt: number, input: FlightInput, ev: FlightEvents = {}) {
    if (this.finished) return;
    this.t += dt;
    this.invuln = Math.max(0, this.invuln - dt);
    if (this.boostT > 0) this.boostT = Math.max(0, this.boostT - dt);
    else this.meter = Math.min(1, this.meter + FLIGHT.boostRecharge * dt);

    const hold = this.hold;
    if (input.boost) {
      if (this.holding && hold) {
        // Launch! Sprint through every pair of rocks after this hold line.
        const group = holdGroup(this.things, hold);
        this.cleared.add(hold.s);
        this.holding = false;
        this.launchUntil = (group.length ? group[group.length - 1].s : hold.s) + CLASH.depth / 2 + 6;
        ev.launch?.(hold);
      } else if (!this.holding && this.boostT <= 0) {
        if (this.meter >= FLIGHT.boostCost - 1e-6) {
          this.meter -= FLIGHT.boostCost;
          this.boostT = FLIGHT.boostTime;
          ev.boost?.();
        } else ev.empty?.();
      }
    }

    // Forward speed: sprinting, boosting, braking for a hold line, or cruising.
    const launched = this.launchUntil > this.s;
    let want: number = launched || this.boostT > 0 ? FLIGHT.launch : FLIGHT.cruise;
    const h = launched ? null : this.hold;
    if (h) want = Math.min(want, holdSpeed(this.s, h));
    this.v = approach(this.v, want, dt);
    const s0 = this.s;
    this.s += this.v * dt;
    if (h && this.s >= h.s - 0.05) {
      this.s = Math.min(this.s, h.s);
      if (!this.holding) {
        this.holding = true;
        this.v = 0;
        ev.hold?.(h);
      }
    }

    // Steering inside the corridor; between Clashing Rocks the rock faces funnel the Argo into the gap.
    this.x += input.steerX * FLIGHT.steer * dt;
    this.y += input.steerY * FLIGHT.steer * dt;
    this.x = Math.max(-FLIGHT.halfW + 0.6, Math.min(FLIGHT.halfW - 0.6, this.x));
    this.y = Math.max(-FLIGHT.halfH + 0.6, Math.min(FLIGHT.halfH - 0.6, this.y));
    for (const c of this.clashesNear(CLASH.depth)) {
      if (Math.abs(this.s - c.s) > CLASH.depth / 2 + 5) continue;
      const room = clashRoom(c);
      if (c.axis === 'x') this.x = Math.max(-room, Math.min(room, this.x));
      else this.y = Math.max(-room, Math.min(room, this.y));
      if (crushed(c, this.s, this.x, this.y, this.t)) {
        this.crushes += 1;
        this.hurt(ev);
        ev.crush?.(c);
        // The rocks spit the Argo back out to the hold line of its row.
        const back = this.things.filter((th): th is Hold => th.kind === 'hold' && th.s < c.s).pop();
        if (back) {
          this.cleared.delete(back.s);
          this.s = back.s;
          this.holding = true;
          ev.hold?.(back);
        } else this.s = c.s - CLASH.depth / 2 - 8;
        this.v = 0;
        this.launchUntil = -1;
        this.passed = this.things.findIndex((th) => th.s > this.s);
        return;
      }
    }

    this.touch(s0, ev);
  }

  /** Bumps, pickups and everything the Argo flew past between s0 and the current distance. */
  private touch(s0: number, ev: FlightEvents) {
    const R = FLIGHT.radius;
    for (let i = Math.max(0, this.passed - 40); i < this.things.length; i++) {
      const th = this.things[i];
      if (th.s > this.s + 8) break;
      if (th.s < s0 - 8 || this.gone.has(i)) continue;
      if (th.kind === 'rock' || th.kind === 'crystal') {
        const r = th.kind === 'rock' ? th.r : 1.3;
        if (Math.hypot(th.x - this.x, th.y - this.y, th.s - this.s) < r + R) {
          // A boost wraps the Argo in light: rocks just bounce off it.
          const shielded = this.boostT > 0;
          if (shielded || this.hurt(ev)) {
            this.gone.add(i);
            this.bumps += shielded ? 0 : 1;
            ev.bump?.(th, shielded);
          }
        }
      } else if (th.kind === 'bolt') {
        if (Math.abs(th.s - this.s) < 1.5 && Math.hypot(th.x - this.x, th.y - this.y) < FLIGHT.pickup) {
          this.gone.add(i);
          ev.bolt?.(th);
        }
      } else if (th.kind === 'ring') {
        if (th.s > s0 && th.s <= this.s && Math.hypot(th.x - this.x, th.y - this.y) < FLIGHT.ringRadius) {
          this.gone.add(i);
          ev.ring?.(th);
        }
      }
    }
    while (this.passed < this.things.length && this.things[this.passed].s <= this.s) {
      const th = this.things[this.passed];
      this.passed += 1;
      if (th.kind === 'checkpoint') ev.beacon?.(th);
      else if (th.kind === 'radio') ev.radio?.(th);
      else if (th.kind === 'gate') {
        this.finished = true;
        ev.finish?.();
        return;
      }
    }
  }
}
