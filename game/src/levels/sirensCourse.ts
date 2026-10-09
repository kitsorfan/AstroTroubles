import { boltsAlong, laneAt, ringsAlong, type Lane } from '../vehicles/course';
import { DIVE, gate, kelpForest, pearlsNear, reef, sirenSpot, type DiveThing, type Pillar } from '../vehicles/sub/dive';

/**
 * The Sirens' Sea course (chapter 3, level 4), swum in the little sub Dolphin. Five stretches, split by
 * checkpoint beacons: the sunlit kelp shallows (steering, rings, the sonar PING and the first piranha
 * drones); the sunken Gardener ruins (columns, a sideways current, gates whose open doorway only a PING
 * shows, a dark tunnel with hidden pearls); the sirens' waters (siren buoys that pull the sub toward the
 * rocks until LUX out-sings them, and a fast current); the dark trench down to the great Gardener gate;
 * and THE SIREN ORGAN's arena, then up to the surface.
 */

/** The intended route: rings and bolts follow it, reefs and columns keep clear of it, every open doorway sits on it. */
export const GUIDE: Lane = [
  [0, 0, 1],
  [100, 0, 0],
  [180, -4, 1],
  [270, 4, -1],
  [360, 0, 2],
  [450, -5, 0],
  [540, 0, -1],
  [640, 4, 1.5],
  [760, 0, 0],
  [860, -3, 1],
  [960, 3, -1],
  [1080, 0, 0],
  [1160, 0, 0],
  [1220, -4, 2],
  [1300, -6.5, 2.4],
  [1360, -6.5, 2.4],
  [1420, 0, -1],
  [1480, 6.5, -2.6],
  [1530, 6.5, -2.6],
  [1600, 0, 0],
  [1700, 0, 0],
  [1800, 3, 1],
  [1920, -2, -1],
  [2050, 2, 1.5],
  [2160, -3, 0],
  [2280, 0, 1],
  [2400, 3, -1],
  [2520, -2, 2],
  [2640, 2, 0],
  [2760, -1, 1],
  [2900, 0, 0],
  [2990, 0, -2.6],
  [3050, 0, -2.6],
  [3120, -4, 0],
  [3200, -6.5, 2.4],
  [3250, -6.5, 2.4],
  [3330, 0, 0],
  [3400, 4, -1],
  [3500, 0, 0],
  [3640, 0, 0],
  [3700, 0, 3],
  [3760, 0, 4],
];

/** Sunken Gardener columns on alternate sides of the lane, `gap` units off it. */
function colonnade(s0: number, s1: number, every: number, gap = 4.2): Pillar[] {
  const out: Pillar[] = [];
  let side = 1;
  for (let s = s0; s <= s1; s += every, side = -side) {
    const [lx] = laneAt(GUIDE, s);
    const x = lx + side * gap;
    if (Math.abs(x) > DIVE.halfW + 1) continue;
    out.push({ kind: 'pillar', s, x: Math.round(x * 10) / 10, r: 1.3 });
  }
  return out;
}

export const SIRENS_COURSE: DiveThing[] = [
  /* 1. The sunlit shallows: steering, rings, kelp, the sonar and the first piranhas. */
  { kind: 'radio', s: 15, dialogue: 'steer' },
  { kind: 'radio', s: 80, dialogue: 'rings' },
  ...ringsAlong(GUIDE, 90, 380, 36),
  ...kelpForest(3, 160, 420, 7, GUIDE),
  { kind: 'radio', s: 200, dialogue: 'kelp' },
  ...boltsAlong(GUIDE, 400, 470, 6),
  { kind: 'radio', s: 470, dialogue: 'ping' },
  { kind: 'fish', s: 600, n: 4 },
  ...ringsAlong(GUIDE, 520, 740, 44),
  ...reef(11, 120, 740, 22, GUIDE, 0.9, 2.2, 3.4),
  ...kelpForest(4, 560, 740, 10, GUIDE),
  { kind: 'checkpoint', s: 760, id: 'cp1' },

  /* 2. The sunken Gardener ruins: columns, a current, gates with one open doorway, a dark tunnel and pearls. */
  { kind: 'radio', s: 780, dialogue: 'ruins' },
  ...colonnade(820, 1080, 26),
  { kind: 'current', s: 900, len: 110, vx: 3.2, vy: 0 },
  { kind: 'radio', s: 895, dialogue: 'current' },
  ...ringsAlong(GUIDE, 830, 1070, 40),
  ...boltsAlong(GUIDE, 1000, 1060, 5),
  { kind: 'radio', s: 1090, dialogue: 'door' },
  gate(GUIDE, 1160, 3, 21),
  { kind: 'dark', s: 1240, len: 330 },
  { kind: 'radio', s: 1235, dialogue: 'dark' },
  gate(GUIDE, 1360, 4, 22),
  ...pearlsNear(23, GUIDE, [1270, 1300, 1400, 1440, 1500]),
  gate(GUIDE, 1530, 4, 24),
  { kind: 'fish', s: 1450, n: 4 },
  ...colonnade(1580, 1660, 40, 4.6),
  ...ringsAlong(GUIDE, 1590, 1680, 45),
  { kind: 'checkpoint', s: 1700, id: 'cp2' },

  /* 3. The sirens' waters: buoys that sing and pull, LUX's counter-song, a fast current. */
  { kind: 'radio', s: 1720, dialogue: 'sirens' },
  ...sirenSpot('b1', GUIDE, 1880, 1, 31),
  ...ringsAlong(GUIDE, 1940, 2080, 46),
  ...sirenSpot('b2', GUIDE, 2130, -1, 32),
  { kind: 'radio', s: 2190, dialogue: 'aeetes' },
  { kind: 'current', s: 2240, len: 200, vx: 0, vy: 0, rush: true },
  { kind: 'radio', s: 2236, dialogue: 'rush' },
  ...ringsAlong(GUIDE, 2250, 2430, 30),
  ...kelpForest(5, 2250, 2440, 9, GUIDE, 2.6),
  ...sirenSpot('b3', GUIDE, 2560, 1, 33),
  { kind: 'fish', s: 2660, n: 5 },
  ...boltsAlong(GUIDE, 2700, 2780, 6),
  ...reef(12, 1760, 2880, 26, GUIDE, 1, 2.4, 3.6),
  ...pearlsNear(34, GUIDE, [2000, 2300, 2720]),
  { kind: 'checkpoint', s: 2900, id: 'cp3' },

  /* 4. The dark trench down to the great Gardener gate: everything together. */
  { kind: 'radio', s: 2920, dialogue: 'trench' },
  { kind: 'dark', s: 2930, len: 520 },
  gate(GUIDE, 3050, 4, 41),
  ...sirenSpot('b4', GUIDE, 3150, 1, 42),
  gate(GUIDE, 3250, 5, 43),
  { kind: 'fish', s: 3370, n: 5 },
  { kind: 'current', s: 3300, len: 90, vx: -2.8, vy: 0.8 },
  ...ringsAlong(GUIDE, 2960, 3460, 50),
  ...pearlsNear(44, GUIDE, [2980, 3100, 3300, 3420]),
  ...colonnade(3330, 3440, 36, 4.4),
  ...boltsAlong(GUIDE, 3440, 3490, 5),
  { kind: 'checkpoint', s: 3500, id: 'cp4' },

  /* 5. The Siren Organ, then up to the light. */
  { kind: 'radio', s: 3515, dialogue: 'organAhead' },
  { kind: 'arena', s: 3600 },
  ...ringsAlong(GUIDE, 3660, 3740, 20),
  { kind: 'surface', s: 3770 },
];

/** Every thing on the course, minus reef rocks that would sit on a Gardener gate (they look odd there). */
const gates = SIRENS_COURSE.filter((t) => t.kind === 'door').map((t) => t.s);
export const SIRENS_THINGS: DiveThing[] = SIRENS_COURSE.filter((t) => t.kind !== 'rock' || gates.every((g) => Math.abs(t.s - g) > 6));
