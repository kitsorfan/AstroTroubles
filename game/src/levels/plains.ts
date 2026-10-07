import type { LevelDef } from '../world/levelTypes';

/**
 * Gaia Nova, region 1: the Whispering Plains. The shuttle lands in the long grass. Jason and LUX cross
 * the river (stepping stones, a broken bridge, log rafts), find the science team's empty camp and
 * Dr. Hypatia's log, clear the Thorn Legion out of the harvested fields, hack Brennus's fence gate
 * and stop the Thresher, a harvester gone wild. The heart canister waits on a rock pillar that only
 * the grapple hook (found in the Glass Desert) can reach.
 */
export const plains: LevelDef = {
  id: 'plains',
  index: 7,
  name: 'Whispering Plains',
  subtitle: 'The landing site',
  music: 'plains',
  intro: 'intro',
  boss: 'thresher',
  shardIds: ['s1', 's2', 's3'],
  colonistIds: ['c1', 'c2'],
  map: `
                    44L44
                    44444
                    44444
        ############44444############
        #4444F4F44444444444444444444#
        #4o44444444444o44444444444o4#
        #444444444444444444444444444#
        #444##444F4444444444444##444#
        #444##44444444444444444##444#
        #444444444444444444F44444444#
        #4444444444444W4444444444444#
        #444444444444444444444444444#
        #44444444FF44444444444444444#
        #444444444444444444444444444#
        #444##44444444444444444##444#
        #444##44444444444444444##444#
        #4o44444F44444444444444444o4#
        #444444F44444444444444444444#
        ##############B##############
                 j444444444j
                 44V444444T4
                 44444C44&44
                 444o444o444
                 4h4444444v4
                 44444444444
                     333
                     2Y2
                     222
     22222222g2222222222222222222222222222
     22R222222222G22222222g222g2222222222244
     222c22c22cg2c22c22c22cw2c22c22c22222K445
     2o22222O2222222222222222222222222222244?
     2o2222222222222r222222222S222222222z2445
     222c22c22c22c22c22c22c22c22c22c2222224o5
     2222222gq22g22222222222222222222222U24o5
     g222G2222222g2222O2222222g22222222222K45
     222c22c22c22c22c22c22c22c22c2wc222222445
     222222222g222222222222222222222222a2244
     q2222g2222222222222222g222222qq2222223
  2u22222222222222222222222N2222222222222g2
  222N2tM222N2N222222222oo22k222g2222222222#####
  22M22g22Q22222222222222222222222222222222#222#
  2g2eg222222xF222F22222222F222222222222k22#222#
  2222Hg22222x222222222222222222g2222222222Z2I2#
  222t22$222F22222g2D2222222ooF22F2g2222g22#222#
  2222222E22222222222222222222222222p2222g2#222#
  22Mt222g22222N22g222222222222g22222222222#####
  2g2222222gg2FmF2222222222222222222F222222
  NX2222222t2222F2222222222222222k222222222
  222222222g2222222222222222222222222222222
    11111111oo11111111111111111111z11
    11111111111111z111111111111111111
  ~~~~~~~~~~~~~~~~~~~~~~~~,,~~~~~~~~~~~~~~~~~
  ~~~~~~~~1~~~~~~~~~~~~~~~,,~~~~~~~~~~~~~~~~~
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~P~~~~~~~~111~~~~
  ~~~~~~~~~1~~~~~~~~~~~~~~~~~~~~~~~~~~1*1~~~~
  ~~~~~~~~~~~~~~~~~~~~~~~~,,~~~A~~~~~~111~~~~
  ~~~~~~~~1~~~~~~~~~~~~~~~,,~~~~~~~~~~~~~~~~~
  ~~~~~~~~~~~~~~~~~~~~~~~~,,~~~~~~~~~~~~~~~~~
    11d111111111111111C111111111111111111
    1111111111111111111111111111111111111
    ......................g..............
    ...o.........tF..........tg..........
    ...t.....g..m.............t..      ..
    .9999......F.............K...      ..
    .9!99......g.................  +9  F.
    .9999gb...................e..  9^  ..
    .9999........................      ..
    .......i...F..g.........g....      ..
    .....g.....g.......................g.
    ...g......D...............ooF........
    ..........g....................F....g
    ............F...........e.g..F....g..
    .....n...................K..g......K.
    .....t..gg......................F.Ft.
    ...K...........................n....g
    g......g.go.oFo..........g...........
    ...t....K............................
    ....g.F..F............s..............
    ...tFF.F..........@....t.......g.....
    ...F......g.....J...J................
    .........................t....K.....F


`,
  legend: {
    W: { type: 'boss', boss: 'thresher', room: 'arena' },
    L: { type: 'exit' },
    B: { type: 'door', id: 'bossdoor', open: { flag: 't1' }, color: '#ff3a4c' },
    T: { type: 'terminal', flag: 't1', length: 4, puzzle: 'pattern' },
    '&': { type: 'marker', id: 'gate' },
    $: { type: 'marker', id: 'campsite' },
    Y: { type: 'door', id: 'fielddoor', open: { clear: 'r1' } },
    C: { type: 'checkpoint', id: 'cp' },
    V: { type: 'vendor' },
    H: { type: 'holo', log: 'log', who: 'hypatia' },
    E: { type: 'trigger', id: 'camp', dialogue: 'camp', event: 'flag:camp', w: 7, d: 5 },
    '?': { type: 'shard', id: 's1' },
    '!': { type: 'shard', id: 's2' },
    '*': { type: 'shard', id: 's3' },
    Q: { type: 'cocoon', id: 'c1', name: 'Botanist Daphne', line: 'Brennus took Dr. Hypatia and the others south, to the desert!' },
    R: { type: 'cocoon', id: 'c2', name: 'Geologist Cassius', line: 'This soil is perfect for farming. Well, it WAS, before that harvester came along.' },
    '+': { type: 'canister', id: 'heart', h: 4.5 },
    '^': { type: 'anchor', h: 4.5 },
    k: { type: 'switch', flag: 'vault', timed: 16, together: true },
    Z: { type: 'door', id: 'secretvault', open: { flag: 'vault' } },
    I: { type: 'prize', id: 'vault', reward: 'heart' },
    U: { type: 'wind', dx: 1, dz: 0, w: 5, d: 9, period: 4.5 },
    A: { type: 'platform', path: [[0, -4]], size: 2, speed: 2.4, wait: 1.2, h: 0.2, floor: 'hazard' },
    P: { type: 'platform', path: [[6, 0]], size: 2, speed: 2.6, wait: 1.2, h: 0.2, floor: 'hazard' },
    // Thorn Legion and the creatures of the plains.
    e: { type: 'enemy', enemy: 'sporeling', variant: 'legion' },
    G: { type: 'enemy', enemy: 'sporeling', variant: 'legion', room: 'r1' },
    S: { type: 'enemy', enemy: 'sentry', variant: 'legion', room: 'r1' },
    r: { type: 'enemy', enemy: 'brute', variant: 'rock', room: 'r1' },
    z: { type: 'enemy', enemy: 'buzzer', variant: 'legion' },
    n: { type: 'enemy', enemy: 'snapper' },
    u: { type: 'enemy', enemy: 'turret' },
    /* General Brennus’s robots. */
    D: { type: 'enemy', enemy: 'trooper' },
    m: { type: 'enemy', enemy: 'minebot' },
    O: { type: 'enemy', enemy: 'trooper', room: 'r1' },
    w: { type: 'enemy', enemy: 'minebot', room: 'r1' },
    // Decor.
    t: { type: 'decor', kind: 'tree' },
    N: { type: 'decor', kind: 'bush' },
    g: { type: 'decor', kind: 'grass', solid: false },
    F: { type: 'decor', kind: 'flowers', solid: false },
    c: { type: 'decor', kind: 'crops', solid: false },
    K: { type: 'decor', kind: 'rock' },
    M: { type: 'decor', kind: 'tent' },
    J: { type: 'decor', kind: 'wreck', rot: 0.6 },
    j: { type: 'decor', kind: 'banner' },
    q: { type: 'decor', kind: 'thorns' },
    // Signs.
    s: { type: 'sign', text: 'Welcome to Gaia Nova! The grass here hums when the wind blows. Head north to find the science team’s camp.' },
    d: { type: 'sign', text: 'River crossing! Hop over the stepping stones, or ride a log raft. Don’t fall in: the water is freezing.' },
    i: { type: 'sign', text: 'A bounce flower! Jump on it to fly up to the top of the mesa.' },
    a: { type: 'sign', text: 'WINDY RIDGE. Big gusts blow here every few seconds. Watch the dust: when it streaks past, stand behind a rock... or SPIN to dig in!' },
    p: { type: 'sign', text: 'SECRET VAULT. GROUND POUND all THREE red switches in this meadow within 16 seconds. The clock starts with the first one!' },
    v: { type: 'sign', text: 'Brennus’s fence. The gate lock is a terminal: LUX can hack it.' },
  },
  objectives: [
    { until: { flag: 'camp' }, text: 'Cross the river and find the science team’s camp', at: 'campsite' },
    { until: { clear: 'r1' }, text: 'Clear the Thorn Legion out of the fields' },
    { until: { flag: 't1' }, text: 'Hack the lock on Brennus’s fence gate', at: 'gate' },
    { until: { boss: true }, text: 'Stop the Thresher!', at: 'boss' },
    { until: { flag: 'never' }, text: 'Fly the shuttle to the Glass Desert', at: 'exit' },
  ],
  dialogues: {
    intro: [
      { who: 'halcyon', text: 'Shuttle landed! Mostly in one piece.' },
      { who: 'bolt', text: 'The grass is whispering! Listen... shhhh...' },
      { who: 'jason', text: 'That’s just the wind, LUX.' },
      { who: 'halcyon', text: 'Dr. Hypatia’s camp is to the north, across the river. And Jason... I am picking up machines. Lots of them.' },
    ],
    camp: [
      { who: 'bolt', text: 'The camp is empty. The tents are torn... and look, thorny cocoons!' },
      { who: 'jason', text: 'Brennus wrapped the scientists up, the way Celestia wrapped up the colonists. Let’s blast them free!' },
    ],
    log: [
      { who: 'hypatia', text: 'Field log, day one. Dr. Hypatia here. Gaia Nova is perfect: fresh water, rich soil, and grass that hums in the wind.' },
      { who: 'hypatia', text: 'Day three. We found metal footprints as big as a house. Something is harvesting the plains... and it is coming this way.' },
      { who: 'hypatia', text: 'If this is my last log: the machines all have the same symbol. A red gear wrapped in thorns. Whoever made them is still here.' },
    ],
    boss: [
      { who: 'halcyon', text: 'Jason, the giant harvester is coming straight for you!' },
      { who: 'brennus', text: 'My Thresher keeps the plains free of weeds. And you, boy, are a weed.' },
      { who: 'jason', text: 'Rude!' },
      { who: 'bolt', text: 'Its engine is on its back! Make it crash into a rock, then hit it there!' },
    ],
    bossDown: [
      { who: 'bolt', text: 'The Thresher is down! And look, there is a map in its cab!' },
      { who: 'halcyon', text: 'It shows Brennus’s camps: the desert, the tundra, the mountains... and a fortress inside the volcano.' },
      { who: 'jason', text: 'Then that’s where we’re going. One region at a time.' },
    ],
    'shard:s1': [
      { who: 'bolt', text: 'A page from a journal! “Journal of Cadet Brennus, age 12. Grandma’s greenhouse on Mars has 300 tomato plants. I gave every single one a name.”' },
      { who: 'jason', text: 'Brennus? General Brennus wrote this when he was a kid?' },
    ],
    'shard:s2': [
      { who: 'bolt', text: '“A dust storm broke the greenhouse glass. All the plants froze in one night. Grandma said: growing things are fragile, so we must protect them.”' },
      { who: 'bolt', text: 'Oh no. All 300 tomatoes...' },
    ],
    'shard:s3': [
      { who: 'bolt', text: '“I joined the Fleet today. I will protect things. ALL the things. Nothing will ever be taken from me again.”' },
      { who: 'jason', text: 'I think something went very wrong after this.' },
    ],
  },
};
