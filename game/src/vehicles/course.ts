/**
 * The Argo's flight course: plain data and the rules of flight, with no three.js, so the flight
 * controller (argo.ts), the level file (levels/rocks.ts) and the tests all share them.
 *
 * Course space: `s` is the distance flown along the course (forward, in world units); `x` (left and
 * right) and `y` (down and up) place things inside the flight corridor, centred on 0. The Argo flies
 * forward on its own at `FLIGHT.cruise`; the player steers inside the corridor, shoots and boosts.
 */

export const FLIGHT = {
  /** Forward speed (units a second) while cruising. */
  cruise: 24,
  /** Forward speed while boosting, and when launching through the Clashing Rocks. */
  launch: 42,
  /** How fast the Argo changes forward speed (units a second, per second). */
  accel: 120,
  /** Half the corridor's width and height. */
  halfW: 9,
  halfH: 5,
  /** Steering speed at full stick. */
  steer: 14,
  /** The Argo's hit radius. */
  radius: 1.0,
  /** Hull hearts. */
  hull: 5,
  /** Seconds of blinking safety after a hit. */
  invuln: 1.6,
  /** A boost lasts this long, costs this much of the meter, and the meter refills at this rate. */
  boostTime: 1.1,
  boostCost: 1 / 3,
  boostRecharge: 0.085,
  /** Distance before a hold line where the Argo starts to slow down. */
  brake: 34,
  /** A ring counts if the Argo crosses it this close to its centre. */
  ringRadius: 2.5,
  /** Bolts are picked up from this far away. */
  pickup: 2.0,
} as const;

/** The Clashing Rocks: how wide they open, how thick they are, and the parts of one slam cycle (seconds). */
export const CLASH = {
  /** Half the gap when wide open, side to side ('x') or top to bottom ('y'). */
  openX: 6.5,
  openY: 4.4,
  /** Thickness of the rocks along the course. */
  depth: 16,
  reopen: 0.9,
  telegraph: 1.1,
  slam: 0.25,
  shut: 0.7,
} as const;

export interface Rock {
  kind: 'rock';
  s: number;
  x: number;
  y: number;
  r: number;
}
/** A glittering crystal asteroid: blast it for bolts (flying into it still bumps the Argo). */
export interface Crystal {
  kind: 'crystal';
  s: number;
  x: number;
  y: number;
}
/** A gold ring to fly through. */
export interface Ring {
  kind: 'ring';
  s: number;
  x: number;
  y: number;
}
/** A single bolt. */
export interface BoltPick {
  kind: 'bolt';
  s: number;
  x: number;
  y: number;
}
/** A wave of Aeëtes's salvage drones: they fly in ahead of the Argo, hover in formation and shoot. */
export interface DroneWave {
  kind: 'drones';
  s: number;
  n: number;
  formation: 'line' | 'vee' | 'circle' | 'column';
  /** Centre of the formation. */
  x?: number;
  y?: number;
  /** Gold-plated elites take three hits instead of two. */
  elite?: boolean;
}
/** A pair of Clashing Rocks that slam together on a rhythm, from the sides ('x') or from above and below ('y'). */
export interface Clash {
  kind: 'clash';
  s: number;
  axis: 'x' | 'y';
  period: number;
  /** Shifts the rhythm (seconds), so a row of pairs can open one after another. */
  offset: number;
}
/** A hold line before Clashing Rocks: the Argo slows to a hover there and waits for BOOST. LUX's dove shows the timing. */
export interface Hold {
  kind: 'hold';
  s: number;
  /** Lines (a dialogue key) said the first time the Argo stops here. */
  dialogue?: string;
}
/** A checkpoint beacon: the hull is mended and a lost section restarts from here. */
export interface Beacon {
  kind: 'checkpoint';
  s: number;
  id: string;
}
/** Radio chatter (a dialogue key) shown as little speech toasts while flying. */
export interface Radio {
  kind: 'radio';
  s: number;
  dialogue: string;
}
/** The gate of the moons: flying through it finishes the level. */
export interface Finish {
  kind: 'gate';
  s: number;
}

export type CourseThing = Rock | Crystal | Ring | BoltPick | DroneWave | Clash | Hold | Beacon | Radio | Finish;

export interface FlightCourse {
  /** Everything along the course (any order; the flight sorts it by `s`). */
  things: CourseThing[];
  /**
   * The intended route through the course: the rings and bolts follow it and the asteroid fields keep
   * clear of it. LUX's dove flies it, and the tests fly it to prove the course can be finished.
   */
  guide: Lane;
  /** The scenery: how thick the glittering belt is on either side of the corridor (0..1). */
  belt: number;
}

/* ---------------- the rules ---------------- */

/** Where a Clashing Rocks pair is in its cycle: its gap (half-width), and how strongly it warns of a slam (0..1). */
export function clashState(c: Clash, t: number): { gap: number; warn: number; phase: number } {
  const open = c.axis === 'x' ? CLASH.openX : CLASH.openY;
  const P = c.period;
  const u = (((t + c.offset) % P) + P) % P;
  const shutAt = P - CLASH.shut;
  const slamAt = shutAt - CLASH.slam;
  const warnAt = slamAt - CLASH.telegraph;
  if (u < CLASH.reopen) {
    const k = u / CLASH.reopen;
    return { gap: open * k * (2 - k), warn: 0, phase: u };
  }
  if (u < warnAt) return { gap: open, warn: 0, phase: u };
  if (u < slamAt) {
    const k = (u - warnAt) / CLASH.telegraph;
    // The rocks creep in a little while they rumble: a warning you can see as well as hear.
    return { gap: open * (1 - 0.08 * k), warn: k, phase: u };
  }
  if (u < shutAt) {
    const k = (u - slamAt) / CLASH.slam;
    return { gap: open * 0.92 * (1 - k * k), warn: 1, phase: u };
  }
  return { gap: 0, warn: 1, phase: u };
}

/** Seconds until a pair next starts to open (its cycle begins with the reopening). */
export function untilOpen(c: Clash, t: number): number {
  const u = (((t + c.offset) % c.period) + c.period) % c.period;
  return u === 0 ? 0 : c.period - u;
}

/** True while the Argo's body is between the two rocks of a pair. */
export function inClash(c: Clash, s: number): boolean {
  return Math.abs(s - c.s) < CLASH.depth / 2 + FLIGHT.radius * 0.5;
}

/** The furthest the Argo may be from the middle while it is between the rocks (they funnel it into the gap). */
export const clashRoom = (c: Clash) => (c.axis === 'x' ? CLASH.openX : CLASH.openY) - FLIGHT.radius - 0.3;

/** True if the rocks of a pair catch the Argo at (x, y) at time t. */
export function crushed(c: Clash, s: number, x: number, y: number, t: number): boolean {
  if (!inClash(c, s)) return false;
  const along = c.axis === 'x' ? Math.abs(x) : Math.abs(y);
  return clashState(c, t).gap < along + FLIGHT.radius;
}

/** Moves a forward speed toward a target speed for one step. */
export function approach(v: number, target: number, dt: number): number {
  const dv = FLIGHT.accel * dt;
  return v < target ? Math.min(target, v + dv) : Math.max(target, v - dv);
}

/** The forward speed the Argo wants at `s`, slowing down to stop at the next hold line (if it is waiting at one). */
export function holdSpeed(s: number, hold: Hold | null): number {
  if (!hold) return FLIGHT.cruise;
  const left = hold.s - s;
  if (left <= 0.05) return 0;
  if (left >= FLIGHT.brake) return FLIGHT.cruise;
  // Ease to a stop: fast enough to arrive, gentle at the end.
  return Math.max(1.2, FLIGHT.cruise * Math.sqrt(left / FLIGHT.brake));
}

/** The pairs of Clashing Rocks that belong to a hold line: every pair after it, up to the next hold or beacon. */
export function holdGroup(things: CourseThing[], hold: Hold): Clash[] {
  const after = things.filter((t) => t.s > hold.s).sort((a, b) => a.s - b.s);
  const out: Clash[] = [];
  for (const t of after) {
    if (t.kind === 'clash') out.push(t);
    else if (t.kind === 'hold' || t.kind === 'checkpoint' || t.kind === 'gate') break;
  }
  return out;
}

/** True if a ball of radius `r` at (x, y) fits inside the corridor. */
export const inCorridor = (x: number, y: number, r = 0) => Math.abs(x) <= FLIGHT.halfW - r && Math.abs(y) <= FLIGHT.halfH - r;

/* ---------------- building a course ---------------- */

/** A seeded random generator (mulberry32), so a course is the same every time. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A path through the corridor: [s, x, y] points, followed in straight lines between them. */
export type Lane = [number, number, number][];

/** Where a lane is at `s` (held flat before its first point and after its last). */
export function laneAt(lane: Lane, s: number): [number, number] {
  if (s <= lane[0][0]) return [lane[0][1], lane[0][2]];
  for (let i = 1; i < lane.length; i++) {
    const [s1, x1, y1] = lane[i];
    if (s <= s1) {
      const [s0, x0, y0] = lane[i - 1];
      const k = (s - s0) / Math.max(1e-6, s1 - s0);
      // Smoothstep between points, so the lane curves instead of zig-zagging.
      const e = k * k * (3 - 2 * k);
      return [x0 + (x1 - x0) * e, y0 + (y1 - y0) * e];
    }
  }
  const last = lane[lane.length - 1];
  return [last[1], last[2]];
}

/** Gold rings along a lane, every `step` units from s0 to s1. */
export function ringsAlong(lane: Lane, s0: number, s1: number, step: number): Ring[] {
  const out: Ring[] = [];
  for (let s = s0; s <= s1 + 1e-6; s += step) {
    const [x, y] = laneAt(lane, s);
    out.push({ kind: 'ring', s, x, y });
  }
  return out;
}

/** A trail of bolts along a lane, every `step` units from s0 to s1. */
export function boltsAlong(lane: Lane, s0: number, s1: number, step: number): BoltPick[] {
  const out: BoltPick[] = [];
  for (let s = s0; s <= s1 + 1e-6; s += step) {
    const [x, y] = laneAt(lane, s);
    out.push({ kind: 'bolt', s, x, y });
  }
  return out;
}

/**
 * A field of asteroids between s0 and s1, about one every `every` units, sized minR..maxR, kept at
 * least `clear` units away from the lane (so there is always a way through), and inside the corridor.
 */
export function asteroidField(seed: number, s0: number, s1: number, every: number, lane: Lane, minR: number, maxR: number, clear = 3.2): Rock[] {
  const rand = seeded(seed);
  const out: Rock[] = [];
  for (let s = s0; s < s1; s += every * (0.6 + rand() * 0.8)) {
    for (let tries = 0; tries < 8; tries++) {
      const r = minR + rand() * (maxR - minR);
      const x = (rand() * 2 - 1) * (FLIGHT.halfW + r * 0.4);
      const y = (rand() * 2 - 1) * (FLIGHT.halfH + r * 0.3);
      const [lx, ly] = laneAt(lane, s);
      if (Math.hypot(x - lx, y - ly) < r + clear) continue;
      out.push({ kind: 'rock', s: Math.round(s * 10) / 10, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, r: Math.round(r * 10) / 10 });
      break;
    }
  }
  return out;
}

/** Crystal asteroids dotted near a lane (but off it, so they are a choice: blast them for bolts). */
export function crystalsNear(seed: number, lane: Lane, at: number[]): Crystal[] {
  const rand = seeded(seed);
  return at.map((s) => {
    const [lx, ly] = laneAt(lane, s);
    const a = rand() * Math.PI * 2;
    const x = Math.max(-FLIGHT.halfW + 1.5, Math.min(FLIGHT.halfW - 1.5, lx + Math.cos(a) * 4.2));
    const y = Math.max(-FLIGHT.halfH + 1.2, Math.min(FLIGHT.halfH - 1.2, ly + Math.sin(a) * 2.8));
    return { kind: 'crystal', s, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  });
}

/** A row of Clashing Rocks pairs `gap` units apart whose rhythms line up for a ship launched at `FLIGHT.launch`. */
export function clashRow(s: number, axes: ('x' | 'y')[], gap: number, period: number, offset = 0): Clash[] {
  return axes.map((axis, i) => ({ kind: 'clash', s: s + i * gap, axis, period, offset: Math.round((offset - (i * gap) / FLIGHT.launch) * 1000) / 1000 }));
}
