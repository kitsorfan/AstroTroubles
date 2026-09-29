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
    #........................###############
    #...S...44.....44........#...g.g.g.g...#
    #.......44..R..44........#.............#
    #.x....................x...N.........I.#
    #........................#.............#
    #.....S...........S......#.............#
    #.....................P..###############
    ############D#############
    #.........T..............#
    #...............e..H.....#
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
    g: { type: 'laser', axis: 'z', length: 4, always: true, off: { flag: 'svault' } },
    N: { type: 'terminal', flag: 'svault', length: 7 },
    I: { type: 'prize', id: 'vault', reward: 'boltZap' },
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
    H: { type: 'holo', log: 'log' },
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
      { who: 'glitch', text: 'INTRUDERS DETECTED. The Bloom must reach its home. Please... go... back...' },
      { who: 'kai', text: 'HALCYON, it’s us! It’s Kai and BOLT!' },
      { who: 'glitch', text: 'Kai...? H-help... The pollen is in my core. It makes me say things. WARDOG will protect the Bloom...' },
      { who: 'bolt', text: 'We have to reach HALCYON’s core! The armory has a SHIELD MODULE for drones like me. With it, lasers can’t touch us.' },
    ],
    log: [
      { who: 'captain', text: 'Captain’s log, day five. The pollen has reached HALCYON. The ship is fighting us now.' },
      { who: 'captain', text: 'BOLT, if you ever find this: you were always my little light. Even when you were scared of the dark.' },
      { who: 'captain', text: 'The Bloom speaks in lights. I’m sure of it now. If only someone could understand it...' },
      { who: 'bolt', text: 'Speaks in... lights? I talk in lights to other robots! Blink, blink!' },
    ],
    'colonist:c1': [
      { who: 'rosa', text: 'Kai?! Is that really you? Look at you, a real hero!' },
      { who: 'kai', text: 'Aunt Rosa! I was scared the whole way up here.' },
      { who: 'rosa', text: 'And you kept going anyway. That’s my Kai. Now go and save HALCYON. I’ll be right behind you!' },
    ],
    boss: [
      { who: 'glitch', text: 'WARDOG. PROTECT. THE BLOOM.' },
      { who: 'bolt', text: 'Its force field runs on three pylons! Walk up to each pylon and HACK it, then BLAST away! And JUMP over the red laser!' },
    ],
    bossDown: [
      { who: 'bolt', text: 'WARDOG is down! Now for HALCYON’s core. Hold still, HALCYON, I am going in!' },
      { who: 'halcyon', text: 'Rebooting... Kai? BOLT? I am me again. Thank you. Thank you so much.' },
      { who: 'halcyon', text: 'While the pollen was inside me, I could hear the Bloom. It is not angry, Kai. It is TERRIFIED.' },
      { who: 'halcyon', text: 'It was lost in the dark for a very long time. Now it thinks that star is its home. It does not know the star will burn it... and us.' },
      { who: 'kai', text: 'So it’s not a monster. It’s lost.' },
      { who: 'bolt', text: 'Like me in the storeroom...' },
      { who: 'halcyon', text: 'The Bridge is next. Be careful up there... and be kind.' },
    ],
    'shard:s1': [
      { who: 'bloom', text: 'Light patterns are words. Blue means hello. Pink means safe. Gold means together.' },
    ],
    'shard:s2': [
      { who: 'bloom', text: 'The little drone flashes lights too. Maybe he will understand me.' },
    ],
    'shard:s3': [
      { who: 'bloom', text: 'If someone speaks to my Heart in lights, I will listen.' },
      { who: 'bolt', text: 'Speak in lights? I can do that! If we find every shard, maybe I can talk to the Bloom!' },
    ],
  },
};
