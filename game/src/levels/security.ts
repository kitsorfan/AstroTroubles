import type { LevelDef } from '../world/levelTypes';

/**
 * Deck 5 — the Security Deck. Time your way past blinking lasers, hover over the electric pool,
 * search the dark cell block, hack the armory for BOLT's SHIELD MODULE, brave the laser gauntlet
 * and shut down WARDOG by hacking its three pylons.
 */
export const security: LevelDef = {
  id: 'security',
  index: 5,
  name: 'Security Deck',
  subtitle: 'Lasers, cameras and one very big robot dog',
  music: 'security',
  intro: 'intro',
  boss: 'wardog',
  shardIds: ['s1', 's2', 's3'],
  colonistIds: ['c1', 'c2'],
  map: `
            #########
            #.......#
            #...L...#
            #.......#
       #########B#########
       #m...............m#
       #.................#
       #.................#
       #.................#
       #.................#
       #.................#
       #.................#
       #........W........#
       #.................#
       #.................#
       #.................#
       #.................#
       #.................#
       #.................#
       #m...............m#
       ########...########
          #...........#
       ####.oo.....V..#
       #+.G...........#
       ####.....C.....#
          #..........h#
          #####...#####
             #.....#
             #q....#
             #kkkkk#
             #q....#
             #.....#####
             #....j..!o#
             #.....#####
             #.....#
             #q....#
             #kkkkk#
             #q....#
             #..y..#
           #####Z#####
           #.........#
           #.o..U..o.#
           #.........#
    ############Y#############
    #........................#
    #...S...44.....44...S....#
    #.......44..R..44........#
    #.x....................x.#
    #........................#
    #.....S...........S......#
    #.....................P..#
    ############D#############
    #.........T..............#
    #...............e........#
    #........................#
    #######O##########O#######
    ######..............######
    #....#.o...o...o..o.#....#
    #.K......z.............?.#
    #....#..............#....#
    ######......%.......######
    #....#..............#....#
    #..o............z.....x..#
    #....#..............#....#
    ############O#############
    ############.#############
    #....s......C.....s..444*#
    #....................4444#
    #~~~~~~~~~~~~~~~~~~~~~~~~#
    #~~~~~~~~~~~~~~~~~~~~~~~~#
    #~~~~~~~~~~~~~~~~~~~~~~~~#
    #~~~~~~~~~~~~~~~~~~~~~~~~#
    #~~~~~~~~~~~~~~~~~~~~~~~~#
    #.......444444444........#
    #.......4444w4444........#
    #.u...x............x...u.#
    #........................#
    ############.#############
         #.............#
         #a............#
         #.o.o.....o.o.#
         #c............#
         #.o.o.....o.o.#
         #n............#
         #......l......#
         ######...######
           #.........#
           #.m..@..m.#
           #.........#
           ###########
`,
  legend: {
    W: { type: 'boss', boss: 'wardog', room: 'arena' },
    B: { type: 'door', id: 'bossdoor', open: { boss: true } },
    L: { type: 'exit' },
    V: { type: 'vendor' },
    C: { type: 'checkpoint', id: 'cp' },
    e: { type: 'enemy', enemy: 'sporeling', variant: 'toxic' },
    z: { type: 'enemy', enemy: 'buzzer' },
    s: { type: 'enemy', enemy: 'sentry' },
    u: { type: 'enemy', enemy: 'turret' },
    S: { type: 'enemy', enemy: 'sentry', room: 'r1' },
    R: { type: 'enemy', enemy: 'brute', room: 'r1' },
    T: { type: 'terminal', flag: 't1', length: 5 },
    D: { type: 'door', id: 'armorydoor', open: { flag: 't1' } },
    Y: { type: 'door', id: 'shielddoor', open: { clear: 'r1' } },
    U: { type: 'upgrade', ability: 'shield', id: 'shield' },
    Z: { type: 'door', id: 'gauntletdoor', open: { flag: 'ability:shield' } },
    O: { type: 'door', id: 'celldoor', open: { all: [] } },
    q: { type: 'laser', axis: 'x', length: 4, always: true },
    k: { type: 'zap', period: 2.4 },
    a: { type: 'laser', axis: 'x', length: 12, period: 3, offset: 0 },
    c: { type: 'laser', axis: 'x', length: 12, period: 3, offset: 1 },
    n: { type: 'laser', axis: 'x', length: 12, period: 3, offset: 2 },
    l: { type: 'sign', text: 'Red lasers blink on and off. Wait until one switches off, then run past it!' },
    w: { type: 'sign', text: 'The water below is electric! Jump off this ledge and HOLD JUMP to hover over it.' },
    y: { type: 'sign', text: 'These lasers never switch off. Press BOLT’s SHIELD button, then run through while the bubble is up!' },
    j: { type: 'sign', text: 'Safe spot. Wait here until the SHIELD button glows again, then go for the second half!' },
    '?': { type: 'shard', id: 's1' },
    '*': { type: 'shard', id: 's2' },
    '!': { type: 'shard', id: 's3' },
    K: { type: 'cocoon', id: 'c1', name: 'Aunt Rosa Reyes', line: 'Kai?! Is that really you? Oh, I am SO proud of you!' },
    P: { type: 'cocoon', id: 'c2', name: 'Chief Dana', line: 'Those lasers were my idea. Sorry about that! Thanks for the rescue.' },
    G: { type: 'breakwall' },
    '+': { type: 'canister', id: 'hc' },
    m: { type: 'decor', kind: 'camera', solid: false },
  },
  objectives: [
    { until: { flag: 't1' }, text: 'Find the armory terminal and hack it' },
    { until: { clear: 'r1' }, text: 'Defeat the armory guards' },
    { until: { flag: 'ability:shield' }, text: 'Grab the SHIELD MODULE' },
    { until: { boss: true }, text: 'Brave the laser gauntlet and stop WARDOG' },
    { until: { flag: 'never' }, text: 'Ride the lift up to the Bridge' },
  ],
  dialogues: {
    intro: [
      { who: 'halcyon', text: 'The Security Deck, home of the ship’s guard robots. The Bloom has made them extra grumpy.' },
      { who: 'bolt', text: 'Lasers! Cameras! A giant robot DOG! Can we go home now?' },
      { who: 'kai', text: 'Stay close, BOLT. We’ll find a way through together.' },
      { who: 'halcyon', text: 'The armory has a SHIELD MODULE made for drones like BOLT. With it, lasers cannot touch you.' },
    ],
    boss: [
      { who: 'halcyon', text: 'That is WARDOG, the chief security robot! Its force field is powered by three pylons.' },
      { who: 'bolt', text: 'Walk up to each pylon and HACK it to drop the shield, then BLAST away! And JUMP over the red laser sweep!' },
    ],
    bossDown: [
      { who: 'bolt', text: 'WARDOG is down! Good doggy. Sleepy doggy.' },
      { who: 'halcyon', text: 'Only the Bridge is left. The Bloom Heart is waiting there... and so are the ship’s controls.' },
    ],
    'shard:s1': [{ who: 'bloom', text: 'Light patterns are words. Blue means hello. Pink means safe. Gold means together.' }],
    'shard:s2': [{ who: 'bloom', text: 'The little drone flashes lights too. Maybe he will understand me.' }],
    'shard:s3': [
      { who: 'bloom', text: 'If someone speaks to my Heart in lights, I will listen.' },
      { who: 'bolt', text: 'Speak in lights? I can do that! If we find every shard, maybe I can talk to the Bloom!' },
    ],
  },
};
