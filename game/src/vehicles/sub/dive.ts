import { laneAt, seeded, type Beacon, type BoltPick, type Lane, type Radio, type Ring, type Rock } from '../course';

/**
 * The Dolphin's dive through the Sirens' Sea (chapter 3, level 4): plain data and the rules, with no
 * three.js, so the submarine (sub.ts), the level file (levels/sirens.ts) and the tests all share them.
 *
 * Course space is the Argo's: `s` is the distance swum along the course, `x` (left and right) and `y`
 * (down and up) place things inside the swimming corridor, centred on 0. The little sub swims forward on
 * its own; the player steers it, fires torpedoes (BLAST) and PINGs the sonar, which lights up hidden
 * doorways and pearls and stuns the piranha drones. When a siren buoy sings, the PING button becomes
 * SING: tap it on the beat and LUX's counter-song cancels the siren's pull.
 */

export const DIVE = {
  /** Forward speed (units a second), and in a fast current. */
  cruise: 13,
  rush: 21,
  /** How fast the sub changes forward speed. */
  accel: 30,
  /** Half the corridor's width and height (the seabed is just below it). */
  halfW: 10,
  halfH: 5.5,
  /** Steering speed at full stick. */
  steer: 11,
  /** The sub's hit radius. */
  radius: 1.0,
  hull: 5,
  invuln: 1.6,
  /** Sonar: a PING costs this much of the meter, which refills at this rate. */
  pingCost: 1 / 3,
  pingRecharge: 0.1,
  /** A PING reaches this far ahead, lights things up for this long, and stuns piranhas for this long. */
  pingReach: 36,
  pingReveal: 7,
  stun: 4,
  /** A ring counts if the sub crosses it this close to its centre; bolts and pearls are picked up from this far. */
  ringRadius: 2.4,
  pickup: 2.0,
  /** Swimming through kelp slows the sub to this share of its speed. */
  kelpDrag: 0.6,
  /** Distance before the boss arena where the sub starts to slow down. */
  brake: 24,
  /** A doorway in a Gardener gate: its radius. */
  doorR: 2.6,
} as const;

/** The sirens' song and LUX's counter-song. */
export const SONG = {
  /** Seconds between beats. */
  beat: 0.75,
  /** How close to a beat a SING tap must land (seconds either way). */
  window: 0.22,
  /** Notes on the beat that silence a buoy. */
  notes: 4,
  /** How far ahead a buoy starts singing (and how far behind it stops). */
  range: 56,
  behind: 4,
  /** The song makes the engine sleepy: the sub swims at this share of its speed while a buoy sings. */
  lull: 0.6,
  /** How hard it pulls at full song (units a second; full stick steers at DIVE.steer). */
  pull: 6.5,
  /** After each good note the pull stops for this long. */
  calm: 0.9,
  /** Torpedo hits that knock a buoy quiet instead. */
  hp: 3,
} as const;

/** A tall stalk of kelp growing up from the seabed: swimming through it slows the sub (it doesn't hurt). */
export interface Kelp {
  kind: 'kelp';
  s: number;
  x: number;
  /** How high its top reaches (in corridor y). */
  top: number;
}
/** A sunken Gardener column, from the seabed up past the corridor: steer round it. */
export interface Pillar {
  kind: 'pillar';
  s: number;
  x: number;
  r: number;
}
/** A Gardener gate across the whole corridor with round doorways: only one is open, and a PING shows which. */
export interface Door {
  kind: 'door';
  s: number;
  holes: [number, number][];
  open: number;
}
/** A hidden pearl: only a PING shows it, and it can only be picked up while it glows. */
export interface Pearl {
  kind: 'pearl';
  s: number;
  x: number;
  y: number;
}
/** One of Aeëtes's siren buoys: it sings, and its song pulls the sub toward it (and the rocks round it). */
export interface Buoy {
  kind: 'buoy';
  s: number;
  x: number;
  y: number;
  id: string;
}
/** A school of piranha drones swimming in to nibble the hull. */
export interface School {
  kind: 'fish';
  s: number;
  n: number;
  x?: number;
  y?: number;
}
/** A sea current between s and s + len: it pushes the sub sideways (vx, vy), and a `rush` carries it along fast. */
export interface Current {
  kind: 'current';
  s: number;
  len: number;
  vx: number;
  vy: number;
  rush?: boolean;
}
/** A deep, dark stretch: only the headlight and the sonar show the way. */
export interface Dark {
  kind: 'dark';
  s: number;
  len: number;
}
/** The boss arena: the sub stops here and fights the Siren Organ. */
export interface Arena {
  kind: 'arena';
  s: number;
}
/** The end: the sub rises to the surface at the coral strait. */
export interface Surface {
  kind: 'surface';
  s: number;
}

export type DiveThing = Rock | Ring | BoltPick | Beacon | Radio | Kelp | Pillar | Door | Pearl | Buoy | School | Current | Dark | Arena | Surface;

export interface DiveCourse {
  things: DiveThing[];
  /** The intended route: rings and bolts follow it, reefs keep clear of it, every open doorway sits on it. */
  guide: Lane;
}

/* ---------------- rules ---------------- */

/** True if a ball of radius `r` at (x, y) fits inside the corridor. */
export const inSea = (x: number, y: number, r = 0) => Math.abs(x) <= DIVE.halfW - r && Math.abs(y) <= DIVE.halfH - r;

/** Moves a forward speed toward a target speed for one step. */
export function approachV(v: number, target: number, dt: number): number {
  const dv = DIVE.accel * dt;
  return v < target ? Math.min(target, v + dv) : Math.max(target, v - dv);
}

/** How hard a singing buoy pulls when it is `rel` units ahead (0..1): it swells as the sub comes near. */
export function songStrength(rel: number): number {
  if (rel > SONG.range || rel < -SONG.behind) return 0;
  return Math.min(1, (SONG.range - rel) / 14);
}

/** Seconds from time `t` to the nearest beat of a song (negative if the beat just went by), and that beat's number. */
export function nearestBeat(t: number, beat: number = SONG.beat): { off: number; n: number } {
  const n = Math.round(t / beat);
  return { off: n * beat - t, n };
}

/** True if a point (x, y) passes through the open doorway of a gate (with the sub's radius to spare). */
export function throughDoor(d: Door, x: number, y: number): boolean {
  const [hx, hy] = d.holes[d.open];
  return Math.hypot(x - hx, y - hy) <= DIVE.doorR - DIVE.radius * 0.6;
}

/* ---------------- building a course ---------------- */

/** Rocks and coral heaps between s0 and s1, about one every `every` units, kept `clear` units off the lane. */
export function reef(seed: number, s0: number, s1: number, every: number, lane: Lane, minR: number, maxR: number, clear = 3.2): Rock[] {
  const rand = seeded(seed);
  const out: Rock[] = [];
  for (let s = s0; s < s1; s += every * (0.6 + rand() * 0.8)) {
    for (let tries = 0; tries < 8; tries++) {
      const r = minR + rand() * (maxR - minR);
      const x = (rand() * 2 - 1) * (DIVE.halfW + r * 0.3);
      // Most of the reef sits low, on the seabed.
      const y = -DIVE.halfH + rand() * rand() * DIVE.halfH * 2 + r * 0.3;
      const [lx, ly] = laneAt(lane, s);
      if (Math.hypot(x - lx, y - ly) < r + clear) continue;
      out.push({ kind: 'rock', s: Math.round(s * 10) / 10, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, r: Math.round(r * 10) / 10 });
      break;
    }
  }
  return out;
}

/** A kelp forest: stalks between s0 and s1, every `every` units, never right on the lane (but it only slows you). */
export function kelpForest(seed: number, s0: number, s1: number, every: number, lane: Lane, clear = 2.2): Kelp[] {
  const rand = seeded(seed);
  const out: Kelp[] = [];
  for (let s = s0; s < s1; s += every * (0.5 + rand())) {
    const [lx] = laneAt(lane, s);
    for (let tries = 0; tries < 6; tries++) {
      const x = (rand() * 2 - 1) * (DIVE.halfW + 1);
      if (Math.abs(x - lx) < clear) continue;
      const top = Math.round((-1 + rand() * (DIVE.halfH + 2.5)) * 10) / 10;
      out.push({ kind: 'kelp', s: Math.round(s * 10) / 10, x: Math.round(x * 10) / 10, top });
      break;
    }
  }
  return out;
}

/** A Gardener gate whose open doorway sits on the lane, with `n` sealed doorways spread out beside it. */
export function gate(lane: Lane, s: number, n: number, seed: number): Door {
  const rand = seeded(seed);
  const [lx, ly] = laneAt(lane, s);
  const holes: [number, number][] = [];
  const spots: [number, number][] = [
    [-6.5, 2.4],
    [0, 2.4],
    [6.5, 2.4],
    [-6.5, -2.6],
    [0, -2.6],
    [6.5, -2.6],
  ];
  // The open one goes where the lane is; the others take the spots far enough away from it.
  const open: [number, number] = [Math.round(lx * 10) / 10, Math.round(ly * 10) / 10];
  const others = spots.filter(([x, y]) => Math.hypot(x - open[0], y - open[1]) > DIVE.doorR * 2.2);
  while (holes.length < n && others.length) holes.push(others.splice(Math.floor(rand() * others.length), 1)[0]);
  const at = Math.floor(rand() * (holes.length + 1));
  holes.splice(at, 0, open);
  return { kind: 'door', s, holes, open: at };
}

/** Hidden pearls a little off a lane (a PING shows them). */
export function pearlsNear(seed: number, lane: Lane, at: number[]): Pearl[] {
  const rand = seeded(seed);
  return at.map((s) => {
    const [lx, ly] = laneAt(lane, s);
    const a = rand() * Math.PI * 2;
    const x = Math.max(-DIVE.halfW + 1.5, Math.min(DIVE.halfW - 1.5, lx + Math.cos(a) * 3.4));
    const y = Math.max(-DIVE.halfH + 1.2, Math.min(DIVE.halfH - 1.2, ly + Math.sin(a) * 2.4));
    return { kind: 'pearl', s, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  });
}

/** A siren buoy beside the lane, with a heap of rocks round it (the rocks it pulls you into). */
export function sirenSpot(id: string, lane: Lane, s: number, side: number, seed: number): (Buoy | Rock)[] {
  const rand = seeded(seed);
  const [lx, ly] = laneAt(lane, s);
  const x = Math.max(-DIVE.halfW + 1.5, Math.min(DIVE.halfW - 1.5, lx + side * 7));
  const y = Math.max(-DIVE.halfH + 1.5, Math.min(DIVE.halfH - 2, ly + 0.5));
  const out: (Buoy | Rock)[] = [{ kind: 'buoy', s, x, y, id }];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + rand();
    const r = 1.1 + rand() * 0.9;
    out.push({ kind: 'rock', s: Math.round((s - 3 + Math.sin(a) * 4) * 10) / 10, x: Math.round((x + Math.cos(a) * 2.6) * 10) / 10, y: Math.round((y - 1.5 + Math.sin(a * 2) * 1.6) * 10) / 10, r: Math.round(r * 10) / 10 });
  }
  return out;
}
