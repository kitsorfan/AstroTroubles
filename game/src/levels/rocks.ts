import { asteroidField, boltsAlong, clashRow, crystalsNear, ringsAlong, type CourseThing, type Lane } from '../vehicles/course';
import type { LevelDef } from '../world/levelTypes';

/**
 * Chapter 3, level 1 — The Clashing Rocks, flown in the Argo. A warm-up through the glittering belt
 * (steer, rings, crystals, boost), Aeëtes's gold salvage drones, then the Clashing Rocks themselves:
 * the Argo waits at each pair until LUX's dove shows the timing, then BOOSTs through. The finale is a
 * row of three slamming pairs right before the gate of the moons. Three checkpoint beacons split it
 * into four sections; losing all the hull hearts restarts the section.
 */

/** The intended route: rings and bolts follow it, asteroid fields keep clear of it, the dove flies it. */
const GUIDE: Lane = [
  [0, 0, 0],
  [120, 0, 0],
  [200, -4, 1],
  [300, 4, -1.5],
  [400, 0, 2],
  [480, -5, -1],
  [560, 0, 0],
  [700, 5, 2],
  [820, -3, -2],
  [940, 3, 1],
  [1060, -4, 2.5],
  [1150, 0, 0],
  [1300, 3, 0],
  [1450, -3, 1.5],
  [1600, 4, -2],
  [1750, -2, 2],
  [1900, 3, 0],
  [2050, -4, -1.5],
  [2200, 2, 2],
  [2350, 0, 0],
  [2580, 0, 0],
  [2650, 4, 2],
  [2760, -3, -1],
  [2830, 0, 0],
  [2900, 0, 0],
  [2960, 3, 1],
  [3040, -2, -1],
  [3070, 0, 0],
  [3180, 0, 0],
  [3250, 3, 2],
  [3300, 0, 0],
  [3400, -3, 1],
  [3500, 3, -1.5],
  [3600, 0, 0],
  [3790, 0, 0],
  [3850, 0, 1.5],
  [3900, 0, 0],
];

const things: CourseThing[] = [
  /* 1. The glittering belt: steering, rings, crystals and the boost. */
  { kind: 'radio', s: 20, dialogue: 'steer' },
  { kind: 'radio', s: 70, dialogue: 'rings' },
  ...ringsAlong(GUIDE, 80, 420, 34),
  ...boltsAlong(GUIDE, 432, 540, 6),
  { kind: 'radio', s: 560, dialogue: 'crystals' },
  ...crystalsNear(5, GUIDE, [600, 650, 730, 800, 870, 1010]),
  ...boltsAlong(GUIDE, 700, 790, 6),
  ...ringsAlong(GUIDE, 820, 1080, 44),
  { kind: 'radio', s: 880, dialogue: 'boost' },
  ...asteroidField(11, 150, 940, 18, GUIDE, 0.9, 2.6),
  // A thicker patch to weave through (or BOOST through).
  ...asteroidField(12, 950, 1120, 10, GUIDE, 1.5, 3.4, 3.4),
  { kind: 'checkpoint', s: 1150, id: 'cp1' },

  /* 2. Aeëtes's salvage drones. */
  { kind: 'radio', s: 1175, dialogue: 'drones' },
  { kind: 'drones', s: 1270, n: 3, formation: 'line' },
  { kind: 'drones', s: 1450, n: 5, formation: 'vee', y: 1 },
  { kind: 'drones', s: 1630, n: 4, formation: 'circle' },
  { kind: 'drones', s: 1820, n: 3, formation: 'column', x: -3 },
  { kind: 'drones', s: 1840, n: 3, formation: 'line', y: 2 },
  { kind: 'radio', s: 2000, dialogue: 'aeetes' },
  { kind: 'drones', s: 2050, n: 5, formation: 'vee', elite: true },
  { kind: 'drones', s: 2230, n: 4, formation: 'line', y: -1 },
  ...ringsAlong(GUIDE, 1300, 2300, 62),
  ...crystalsNear(6, GUIDE, [1330, 1520, 1700, 1980, 2150]),
  ...boltsAlong(GUIDE, 1590, 1670, 5),
  ...boltsAlong(GUIDE, 2250, 2330, 6),
  ...asteroidField(21, 1200, 2320, 26, GUIDE, 0.9, 2.2, 3.4),
  { kind: 'checkpoint', s: 2350, id: 'cp2' },

  /* 3. The Clashing Rocks: a pair from the sides, a pair from above and below, then two in a row. */
  { kind: 'radio', s: 2375, dialogue: 'rocksAhead' },
  { kind: 'hold', s: 2520, dialogue: 'dove' },
  { kind: 'clash', s: 2560, axis: 'x', period: 5, offset: 0 },
  ...ringsAlong(GUIDE, 2620, 2800, 45),
  ...asteroidField(31, 2610, 2810, 22, GUIDE, 1, 2.4, 3.4),
  { kind: 'hold', s: 2840, dialogue: 'hold2' },
  { kind: 'clash', s: 2880, axis: 'y', period: 4.8, offset: 0.7 },
  { kind: 'drones', s: 2960, n: 3, formation: 'line' },
  ...ringsAlong(GUIDE, 2920, 3060, 46),
  ...crystalsNear(7, GUIDE, [2990]),
  ...asteroidField(32, 2930, 3050, 24, GUIDE, 1, 2.2, 3.4),
  { kind: 'hold', s: 3080, dialogue: 'hold3' },
  ...clashRow(3120, ['x', 'y'], 36, 5.2, 1.3),
  ...boltsAlong(GUIDE, 3190, 3290, 6),
  { kind: 'checkpoint', s: 3300, id: 'cp3' },

  /* 4. The last gauntlet: three slamming pairs in a row, then the gate of the moons. */
  { kind: 'radio', s: 3320, dialogue: 'gauntlet' },
  { kind: 'drones', s: 3390, n: 5, formation: 'vee', elite: true },
  { kind: 'drones', s: 3510, n: 4, formation: 'circle' },
  ...ringsAlong(GUIDE, 3340, 3600, 52),
  ...crystalsNear(8, GUIDE, [3420, 3540]),
  ...boltsAlong(GUIDE, 3445, 3520, 6),
  ...asteroidField(41, 3340, 3610, 16, GUIDE, 1, 2.8, 3.4),
  { kind: 'hold', s: 3640, dialogue: 'last' },
  ...clashRow(3680, ['x', 'y', 'x'], 40, 5.6, 0.4),
  ...ringsAlong(GUIDE, 3800, 3880, 20),
  { kind: 'gate', s: 3900 },
];

export const rocks: LevelDef = {
  id: 'rocks',
  index: 13,
  name: 'The Clashing Rocks',
  subtitle: 'Fly the Argo to the ring of moons',
  music: 'argo',
  intro: 'intro',
  shardIds: [],
  vehicle: 'argo',
  flight: { things, guide: GUIDE, belt: 0.8 },
  // The flight happens on the course above; the map only holds the start.
  map: `
...
.@.
...
`,
  legend: { '@': { type: 'spawn', facing: Math.PI } },
  objectives: [
    { until: { flag: 'argo:cp1' }, text: 'Fly the Argo through the glittering belt' },
    { until: { flag: 'argo:cp2' }, text: 'Blast Aeëtes’s salvage drones' },
    { until: { flag: 'argo:cp3' }, text: 'Get through the Clashing Rocks: follow the dove!' },
    { until: { flag: 'argo:gate' }, text: 'Three more Clashing Rocks, then the gate of the moons!' },
    { until: { flag: 'never' }, text: 'On to the Harpy Isles' },
  ],
  dialogues: {
    intro: [
      { who: 'captain', text: 'Argo to crew: we are leaving Gaia Nova’s sky. Next stop, the ring of moons... and Colchis!' },
      { who: 'hypatia', text: 'The Golden Fleece is waiting there. If the old light-words are right, it can make Celestia strong again.' },
      { who: 'bolt', text: 'Um. Captain? Why is the space in front of us full of ROCKS?' },
      { who: 'captain', text: 'That is the asteroid belt. Jason, you have the sharpest eyes on board: you fly. I will keep the engines happy.' },
      { who: 'jason', text: 'Me? Flying the Argo? ...Best. Day. EVER.' },
    ],
    steer: [
      { who: 'halcyon', text: 'Steer with the stick, Jason. The Argo flies forward all by herself.' },
      { who: 'bolt', text: 'And BLAST shoots! Pew pew! ...Sorry. I am excited.' },
    ],
    rings: [{ who: 'halcyon', text: 'Those gold rings are old space buoys. Fly through them for luck!' }],
    crystals: [{ who: 'bolt', text: 'Pink crystals! They are full of bolts. BLAST them before we bump into them!' }],
    boost: [
      { who: 'halcyon', text: 'Try BOOST: a burst of speed inside a shield of light. Rocks just bounce off it!' },
      { who: 'bolt', text: 'The gold lights on the button show how many boosts are ready.' },
    ],
    drones: [
      { who: 'bolt', text: 'Jason! Gold flying saucers, straight ahead!' },
      { who: 'aeetes', text: 'Well, well. A shiny little boat, all alone in MY asteroid belt.' },
      { who: 'aeetes', text: 'My salvage drones will take it apart and sell the pieces. Nothing personal. Just business!' },
      { who: 'captain', text: 'Who IS that? Jason, shoot those drones down before they grab us!' },
    ],
    aeetes: [
      { who: 'aeetes', text: 'You are tougher than you look, little boat. I am Aeëtes, and everything shiny in this sky belongs to me.' },
      { who: 'hypatia', text: 'Aeëtes, the salvage king... He takes old ships and whole planets apart, and sells them.' },
      { who: 'jason', text: 'Well, he is NOT taking the Argo. Or the Fleece!' },
    ],
    rocksAhead: [
      { who: 'captain', text: 'There they are. The Clashing Rocks. They slam together like two giant hands.' },
      { who: 'bolt', text: 'Nope. Nope nope nope. Can we go around?' },
      { who: 'halcyon', text: 'Negative. They guard the only way to the moons. The Argo will stop and wait at each pair.' },
    ],
    dove: [
      { who: 'bolt', text: 'Wait! I read the old story. The Argonauts sent a DOVE through the Clashing Rocks first, to show them the way!' },
      { who: 'bolt', text: 'So I built one. Meet Dovey! Off you go, Dovey!' },
    ],
    doveSafe: [
      { who: 'jason', text: 'It made it! It only lost one tail feather.' },
      { who: 'bolt', text: 'Dovey went a little late. The trick is to go the moment the rocks OPEN. Never while they rumble and glow!' },
      { who: 'captain', text: 'Dovey will fly again every time they open. When the dove goes, you go: press BOOST!' },
    ],
    hold2: [{ who: 'bolt', text: 'This pair slams from the top and the bottom! Same trick: follow Dovey.' }],
    hold3: [{ who: 'halcyon', text: 'Two pairs in a row, and their rhythm is lined up. Launch with the dove and keep going!' }],
    gauntlet: [
      { who: 'captain', text: 'The gate of the moons is right behind the last three rocks. Steady, Jason.' },
      { who: 'aeetes', text: 'Go on, then. If the rocks don’t squash you, I will see you on Colchis.' },
    ],
    last: [
      { who: 'bolt', text: 'Three pairs. THREE! Dovey, you are the bravest bird I know.' },
      { who: 'jason', text: 'Wait for the dove... wait for it...' },
    ],
    finish: [
      { who: 'captain', text: 'We made it! The gate of the moons... and look: the whole ring of moons.' },
      { who: 'hypatia', text: 'That green one, glowing gold. That is Colchis. The Fleece is there.' },
      { who: 'bolt', text: 'Dovey says hello to the moons. Dovey also wants a snack.' },
      { who: 'jason', text: 'Hang on, Celestia. The Argonauts are coming!' },
    ],
  },
};
