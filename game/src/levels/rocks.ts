import { asteroidField, boltsAlong, clashRow, crystalsNear, ringsAlong, type CourseThing, type Lane } from '../vehicles/course';
import type { LevelDef } from '../world/levelTypes';

/**
 * Chapter 3, level 1 — The Clashing Rocks, flown in the Argo. A warm-up through the glittering belt
 * (steer, the throttle lever, rings, crystals), Aeëtes's gold salvage drones, then the Clashing Rocks
 * themselves: twenty slamming pairs. The Argo never stops by itself: Jason eases the lever down to wait
 * for a pair and pushes it all the way up the moment the rocks open (rows of pairs are timed for full
 * speed). LUX's dove flies through the very first pair once, and that's the last of it; after that Jason
 * reads the rocks himself, with three ROCKETs for the pairs he'd rather blow up. Four checkpoint beacons
 * split it into five sections; losing all the hull hearts restarts the section (and gives back the
 * rockets fired in it).
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
  [2700, 0, 0],
  [2770, 4, 2],
  [2880, -3, -1],
  [2950, 0, 0],
  [3020, 0, 0],
  [3080, 3, 1],
  [3160, -2, -1],
  [3190, 0, 0],
  [3300, 0, 0],
  [3370, 3, 2],
  [3420, 0, 0],
  [3500, -3, 1],
  [3580, 3, -1.5],
  [3640, 0, 0],
  [3770, 0, 0],
  [3820, 3, 1.5],
  [3900, 0, 0],
  [4060, 0, 0],
  [4120, -3, -1],
  [4180, 0, 0],
  [4350, 0, 0],
  [4410, 3, 1],
  [4490, -3, -1],
  [4560, 0, 0],
  [4720, 0, 0],
  [4770, -3, 1.5],
  [4820, 0, 0],
  [4940, 0, 0],
  [4990, 3, -1],
  [5050, 0, 0],
  [5220, 0, 0],
  [5270, 0, 1.5],
  [5320, 0, 0],
];

const things: CourseThing[] = [
  /* 1. The glittering belt: steering, the throttle lever, rings and crystals. */
  { kind: 'radio', s: 20, dialogue: 'steer' },
  { kind: 'radio', s: 70, dialogue: 'rings' },
  ...ringsAlong(GUIDE, 80, 420, 34),
  ...boltsAlong(GUIDE, 432, 540, 6),
  { kind: 'radio', s: 560, dialogue: 'crystals' },
  ...crystalsNear(5, GUIDE, [600, 650, 730, 800, 870, 1010]),
  ...boltsAlong(GUIDE, 700, 790, 6),
  ...ringsAlong(GUIDE, 820, 1080, 44),
  { kind: 'radio', s: 880, dialogue: 'lever' },
  ...asteroidField(11, 150, 940, 18, GUIDE, 0.9, 2.6),
  // A thicker patch to weave through (slowly, with the lever pulled down).
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

  /* 3. The Clashing Rocks: a pair from the sides, a pair from above and below, then two in a row. LUX's dove goes first, once. */
  { kind: 'radio', s: 2365, dialogue: 'rocksAhead' },
  { kind: 'dove', s: 2420 },
  { kind: 'clash', s: 2680, axis: 'x', period: 5, offset: 0 },
  ...ringsAlong(GUIDE, 2740, 2920, 45),
  ...asteroidField(31, 2730, 2930, 22, GUIDE, 1, 2.4, 3.4),
  { kind: 'radio', s: 2900, dialogue: 'hold2' },
  { kind: 'clash', s: 3000, axis: 'y', period: 4.8, offset: 0.7 },
  { kind: 'drones', s: 3080, n: 3, formation: 'line' },
  ...ringsAlong(GUIDE, 3040, 3180, 46),
  ...crystalsNear(7, GUIDE, [3110]),
  ...asteroidField(32, 3050, 3170, 24, GUIDE, 1, 2.2, 3.4),
  { kind: 'radio', s: 3140, dialogue: 'hold3' },
  ...clashRow(3240, ['x', 'y'], 36, 5.2, 1.3),
  ...boltsAlong(GUIDE, 3310, 3410, 6),
  { kind: 'checkpoint', s: 3420, id: 'cp3' },

  /* 4. The rock field: eight more pairs, in rows of two and three, and no dove to show the timing. */
  { kind: 'radio', s: 3440, dialogue: 'field' },
  { kind: 'drones', s: 3510, n: 5, formation: 'vee', elite: true },
  ...ringsAlong(GUIDE, 3460, 3620, 40),
  ...crystalsNear(8, GUIDE, [3540]),
  ...boltsAlong(GUIDE, 3565, 3620, 6),
  ...asteroidField(41, 3460, 3620, 16, GUIDE, 1, 2.8, 3.4),
  { kind: 'radio', s: 3600, dialogue: 'hold4' },
  ...clashRow(3700, ['y', 'x'], 36, 5.2, 0.9),
  { kind: 'drones', s: 3840, n: 4, formation: 'circle' },
  ...ringsAlong(GUIDE, 3780, 3890, 36),
  ...crystalsNear(9, GUIDE, [3850]),
  ...asteroidField(42, 3780, 3890, 18, GUIDE, 1, 2.4, 3.4),
  { kind: 'radio', s: 3860, dialogue: 'hold5' },
  ...clashRow(3960, ['y', 'x', 'y'], 38, 5.6, 0.2),
  { kind: 'drones', s: 4120, n: 3, formation: 'line', y: 1 },
  ...ringsAlong(GUIDE, 4070, 4170, 33),
  ...boltsAlong(GUIDE, 4080, 4160, 6),
  ...asteroidField(43, 4070, 4170, 18, GUIDE, 1, 2.4, 3.4),
  { kind: 'radio', s: 4140, dialogue: 'hold6' },
  ...clashRow(4240, ['x', 'x', 'y'], 38, 5.6, 1.6),
  { kind: 'checkpoint', s: 4360, id: 'cp4' },

  /* 5. The last gauntlet: eight more pairs, the trickiest rows of all, then the gate of the moons. */
  { kind: 'radio', s: 4370, dialogue: 'gauntlet' },
  { kind: 'drones', s: 4440, n: 5, formation: 'vee', elite: true },
  ...ringsAlong(GUIDE, 4390, 4540, 50),
  ...crystalsNear(10, GUIDE, [4460, 4520]),
  ...asteroidField(51, 4390, 4540, 15, GUIDE, 1, 2.8, 3.4),
  { kind: 'radio', s: 4520, dialogue: 'hold7' },
  ...clashRow(4620, ['x', 'y', 'x'], 38, 5.6, 0.7),
  { kind: 'drones', s: 4780, n: 4, formation: 'circle', elite: true },
  ...ringsAlong(GUIDE, 4730, 4810, 40),
  ...asteroidField(52, 4730, 4810, 16, GUIDE, 1, 2.4, 3.4),
  { kind: 'radio', s: 4780, dialogue: 'hold8' },
  ...clashRow(4880, ['y', 'y'], 36, 4.9, 1.1),
  { kind: 'drones', s: 5000, n: 3, formation: 'column', x: 2 },
  ...ringsAlong(GUIDE, 4960, 5040, 40),
  ...crystalsNear(11, GUIDE, [5010]),
  ...asteroidField(53, 4960, 5040, 16, GUIDE, 1, 2.4, 3.4),
  { kind: 'radio', s: 5010, dialogue: 'last' },
  ...clashRow(5110, ['x', 'y', 'x'], 40, 5.6, 0.4),
  ...ringsAlong(GUIDE, 5230, 5300, 20),
  { kind: 'gate', s: 5320 },
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
    { until: { flag: 'argo:cp3' }, text: 'Get through the Clashing Rocks: go the moment they open!' },
    { until: { flag: 'argo:cp4' }, text: 'Cross the field of Clashing Rocks' },
    { until: { flag: 'argo:gate' }, text: 'The last Clashing Rocks, then the gate of the moons!' },
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
      { who: 'halcyon', text: 'Steer with the stick, Jason. The SPEED lever next to BLAST sets how fast we fly: up is faster, down is slower.' },
      { who: 'bolt', text: 'And BLAST shoots! Pew pew! ...Sorry. I am excited.' },
    ],
    rings: [{ who: 'halcyon', text: 'Those gold rings are old space buoys. Fly through them for luck!' }],
    crystals: [{ who: 'bolt', text: 'Pink crystals! They are full of bolts. BLAST them before we bump into them!' }],
    lever: [
      { who: 'halcyon', text: 'A thick patch of rocks ahead. Pull the lever down to slow us right down and weave through.' },
      { who: 'bolt', text: 'And push it all the way up when it’s clear! WHEEE!' },
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
    ],
    dove: [{ who: 'bolt', text: 'Wait! In the old story, a DOVE flew through the rocks first. So I built one. Off you go, Dovey!' }],
    doveSafe: [
      { who: 'jason', text: 'It made it! It only lost one tail feather.' },
      { who: 'bolt', text: 'Dovey went a little late. Go the moment the rocks OPEN, never while they rumble and glow!' },
      { who: 'captain', text: 'That was Dovey’s only run, Jason. Ease off and wait for each pair to open... then full speed!' },
    ],
    hold2: [
      { who: 'bolt', text: 'This pair slams from the top and the bottom! No dove this time: watch the glow, and go when they open.' },
      { who: 'bolt', text: 'And if a pair looks too scary, we have three ROCKETS. Press ROCKET and... KA-BOOM! Only three, though. Save them!' },
    ],
    hold3: [{ who: 'halcyon', text: 'Two pairs in a row, and their rhythm is lined up. Go full speed when they open, and keep going!' }],
    field: [
      { who: 'captain', text: 'More Clashing Rocks ahead. A whole field of them, Jason.' },
      { who: 'aeetes', text: 'Still flying, little boat? My rocks have only just warmed up.' },
    ],
    hold4: [{ who: 'bolt', text: 'Two more! Top and bottom first, then the sides. You can do it!' }],
    hold5: [{ who: 'halcyon', text: 'Three pairs in a row. Count the rhythm: rumble, slam... open. GO!' }],
    hold6: [
      { who: 'jason', text: 'Three more. Breathe, Jason. Breathe.' },
      { who: 'bolt', text: 'Breathing is a good idea. I would do it too, if I had lungs.' },
    ],
    gauntlet: [
      { who: 'captain', text: 'The gate of the moons is just past the last eight pairs. Steady, Jason.' },
      { who: 'aeetes', text: 'Go on, then. If the rocks don’t squash you, I will see you on Colchis.' },
    ],
    hold7: [{ who: 'bolt', text: 'Sides, then top and bottom, then sides again. Wait for them to open...' }],
    hold8: [{ who: 'halcyon', text: 'Two pairs, both slamming from above and below, and faster. Nearly there!' }],
    last: [
      { who: 'bolt', text: 'The last three pairs! Dovey is watching from the window, cheering for you.' },
      { who: 'jason', text: 'No dove, no problem. Wait for it... wait for it...' },
    ],
    finish: [
      { who: 'captain', text: 'We made it! The gate of the moons... and look: the whole ring of moons.' },
      { who: 'hypatia', text: 'That green one, glowing gold. That is Colchis. The Fleece is there.' },
      { who: 'bolt', text: 'Dovey says hello to the moons. Dovey also wants a snack.' },
      { who: 'jason', text: 'Hang on, Celestia. The Argonauts are coming!' },
    ],
  },
};
