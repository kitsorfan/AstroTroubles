import {
  CLASH,
  FLIGHT,
  approach,
  clashRoom,
  crushed,
  laneAt,
  type Beacon,
  type BoltPick,
  type Clash,
  type CourseThing,
  type Crystal,
  type DoveCue,
  type FlightCourse,
  type Radio,
  type Ring,
  type Rock,
} from './course';

/**
 * The Argo's flight, step by step: the throttle lever and forward speed, steering, and bumping into
 * the course (asteroids, crystals, rings, bolts, the Clashing Rocks). The Argo never stops by itself:
 * the player slows down to wait for the rocks and pushes the lever up to dart through. No three.js:
 * the flight controller draws it, and the tests fly it with an autopilot.
 */

export interface FlightInput {
  /** Stick: -1..1 left/right and down/up. */
  steerX: number;
  steerY: number;
  /** The lever dragged to this position (0 stops, 1 is full speed) this step. */
  lever?: number;
  /** A key held to move the lever: +1 up, -1 down. */
  leverMove?: number;
  /** ROCKET was pressed this step. */
  rocket?: boolean;
}

/** What happened during a step, for sounds, effects and the HUD. */
export interface FlightEvents {
  bump?(thing: Rock | Crystal): void;
  crush?(c: Clash): void;
  ring?(r: Ring): void;
  bolt?(b: BoltPick): void;
  beacon?(b: Beacon): void;
  radio?(r: Radio): void;
  /** The Argo passed the spot where LUX's dove sets off. */
  dove?(d: DoveCue): void;
  /** A rocket set off toward a pair of Clashing Rocks (it lands after `eta` seconds). */
  rocket?(c: Clash, eta: number): void;
  /** A rocket reached its pair and blew it to bits. */
  blast?(c: Clash): void;
  /** ROCKET pressed with no Clashing Rocks in range, or none left. */
  noRocket?(why: 'range' | 'empty'): void;
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
  /** The throttle lever: 0 holds the Argo still, 1 is full speed. */
  lever: number = FLIGHT.lever;
  hull: number = FLIGHT.hull;
  invuln = 0;
  /** Rings and bolts taken, crystals and rocks broken (indices into `things`). */
  readonly gone = new Set<number>();
  finished = false;
  /** Crushes and bumps since the start (for the side quests). */
  crushes = 0;
  bumps = 0;
  private passed = 0;
  /** Rockets left, and how many there were at the last checkpoint (a lost section gets them back). */
  rockets: number = FLIGHT.rockets;
  private savedRockets: number = FLIGHT.rockets;
  /** Pairs of Clashing Rocks blown to bits, and rockets still on their way (seconds to go). */
  readonly broken = new Set<Clash>();
  readonly flying: { c: Clash; eta: number; total: number }[] = [];

  constructor(readonly course: FlightCourse) {
    this.things = [...course.things].sort((a, b) => a.s - b.s);
    this.restart(0);
  }

  /** Puts the Argo back at distance `s` on the guide route at cruising speed (a checkpoint restart). */
  restart(s: number) {
    this.s = s;
    [this.x, this.y] = laneAt(this.course.guide, s);
    this.v = FLIGHT.cruise;
    this.lever = FLIGHT.lever;
    this.invuln = 0;
    this.hull = FLIGHT.hull;
    this.rockets = this.savedRockets;
    this.flying.length = 0;
    for (const c of [...this.broken]) if (c.s > s) this.broken.delete(c);
    // Everything ahead comes back: rings to fly through again, crystals to blast again.
    for (const i of [...this.gone]) if (this.things[i].s > s) this.gone.delete(i);
    this.passed = this.things.findIndex((t) => t.s > s);
    if (this.passed < 0) this.passed = this.things.length;
  }

  /** The speed the lever asks for. */
  get target() {
    return this.lever * FLIGHT.top;
  }

  /** The next pair of Clashing Rocks a rocket would lock on to: the nearest one ahead, not yet hit or targeted. */
  rocketTarget(): Clash | null {
    for (const th of this.things) {
      if (th.kind !== 'clash' || this.broken.has(th) || this.flying.some((r) => r.c === th)) continue;
      if (th.s < this.s - CLASH.depth / 2) continue;
      return th.s - this.s <= FLIGHT.rocketRange ? th : null;
    }
    return null;
  }

  /** Fires a rocket at the next pair of Clashing Rocks ahead. Returns true if one went. */
  fireRocket(ev: FlightEvents = {}): boolean {
    if (this.rockets <= 0) {
      ev.noRocket?.('empty');
      return false;
    }
    const c = this.rocketTarget();
    if (!c) {
      ev.noRocket?.('range');
      return false;
    }
    this.rockets -= 1;
    const eta = Math.max(0.15, (c.s - this.s) / FLIGHT.rocketSpeed);
    this.flying.push({ c, eta, total: eta });
    ev.rocket?.(c, eta);
    return true;
  }

  /** The pairs of Clashing Rocks within `ahead` units in front (and just behind), not counting broken ones. */
  clashesNear(ahead = 300): Clash[] {
    const out: Clash[] = [];
    for (const th of this.things) {
      if (th.kind !== 'clash' || this.broken.has(th)) continue;
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

    // Rockets: off they go, and any that arrive blow their pair of rocks to bits.
    if (input.rocket) this.fireRocket(ev);
    for (let i = this.flying.length - 1; i >= 0; i--) {
      const r = this.flying[i];
      r.eta -= dt;
      if (r.eta > 0) continue;
      this.flying.splice(i, 1);
      this.broken.add(r.c);
      ev.blast?.(r.c);
    }

    // Forward speed follows the throttle lever, with a little weight to it.
    if (input.lever !== undefined) this.lever = input.lever;
    else if (input.leverMove) this.lever += input.leverMove * FLIGHT.leverRate * dt;
    this.lever = Math.max(0, Math.min(1, this.lever));
    this.v = approach(this.v, this.target, dt);
    const s0 = this.s;
    this.s += this.v * dt;

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
        // The rocks spit the Argo back out in front of the pair (but never into the pair before it),
        // with the engines knocked down to a stop: push the lever up again when the rocks open.
        const prev = this.clashesNear(CLASH.depth * 4).filter((p) => p.s < c.s).pop();
        let back = c.s - CLASH.depth / 2 - FLIGHT.spit;
        if (prev) back = Math.max(back, prev.s + CLASH.depth / 2 + FLIGHT.radius + 1);
        this.s = Math.min(this.s, back);
        this.v = 0;
        this.lever = 0;
        this.passed = this.things.findIndex((th) => th.s > this.s);
        if (this.passed < 0) this.passed = this.things.length;
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
          if (this.hurt(ev)) {
            this.gone.add(i);
            this.bumps += 1;
            ev.bump?.(th);
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
      if (th.kind === 'checkpoint') {
        this.savedRockets = this.rockets;
        ev.beacon?.(th);
      }
      else if (th.kind === 'radio') ev.radio?.(th);
      else if (th.kind === 'dove') ev.dove?.(th);
      else if (th.kind === 'gate') {
        this.finished = true;
        ev.finish?.();
        return;
      }
    }
  }
}
