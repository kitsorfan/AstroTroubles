import type { LevelDef } from '../world/levelTypes';

/**
 * Deck 3 — the reactor deck. Run up a conveyor bridge over lava, ride steam vents, carry two power
 * cells to restart the coolant pumps, earn the DASH THRUSTERS and cool down the Magma Golem.
 */
export const engine: LevelDef = {
  id: 'engine',
  index: 3,
  name: 'Engine Core',
  subtitle: 'Hot hot hot!',
  music: 'engine',
  intro: 'intro',
  boss: 'golem',
  shardIds: ['s1', 's2', 's3'],
  colonistIds: ['c1', 'c2'],
  map: `
           #########
           #...L...#
           #.......#
      #########B#########
      #.................#
      #.................#
      #..22.........22..#
      #..22.........22..#
      #.................#
      #.................#
      #.................#
      #........W........#
      #.................#
      #.................#
      #.................#
      #..22.........22..#
      #..22.........22..#
      #.................#
      #.................#
      ########...########
         #.............#
         #.o.o.....V...#
         #.............#
         #.....C.....h.#
         #.............#
    ##########...###########
    #......................#
    #...o.o.o......o.o.o...#
    #~~~~~~~~~~~~~~~~~~~~~~#
    #~~~~~~~~~~~~~~~~~~~22~#
    #~~~~~~~~~~~~~~~~~~~2*~#
    #~~~~~~~~~~~~~~~~~~~~~~#
    #~~~~~~~......=~~~~~~~~#
    #~~~~~~~...d...~~~~~~~~#
    #~~~~~~~~~~~~~~~~~~~~~~#
    #~~~~~~~~~~~~~~~~~~~~~~#
    #~~~~~~~~~~~~~~~~~~~~~~#
    #......................#
    #..........C...........#
    ###########E############
    #######.........########
    #####+G.o..U..o.########
    #######.........########
    ###########Y############
    #........k...K.........#
    #.................H....#
    #~~~~~~~~..........888?#
    #Z.~~~~~~..........88Z8#
    #..~~~~~~..........8888#
    #~~~~~~~~..........8888#
    #~~~~~~~~....e.....8888#
    #~~~~~~~~..........8u88#
    #~~~~~~~~..........8888#
    #~~~~~~~~....x.....8888#############
    #~~~~~~~~..........8888#...........#
    #~~~~~~~~...r......8888#.~~~~~~~~~.#
    #~~~~~~A~..........8888#.~a~~~~~i~.#
    #~~~~~~~~.......g..8888#.~~~~~~~~~.#####
    #.............e..v.....#.~~~~l~~~~.#...#
    #.......................n~~~~~~~~~.D.I.#
    #..x.......C.......x...#.~~~~m~~~~.#...#
    #P.....................#.~~~~~~~~~.#####
    ##########...###########...........#
    #......................#############
    #~~~~~~~~~ccc~~~~~~444!#
    #~~~~~~~~~ccc~~~~~~4444#
    #~~~~~~~~~ccc~~~~~~4u44#
    #~~~~~~~~~ccc~~~~~~4444#
    #~~~~~~~~~ccc~~~~~~4Q44#
    #~~~~~~~~~ccc~~~~~~4444#
    #~~~~~~~~~ccc~~~~~~4444#
    #.................v....#
    #....e.........e.......#
    #..x.............s...x.#
    #......................#
    #...o.o.o.......o.o.o..#
    #......................#
    ##########...###########
         #.............#
         #.....@.......#
         #.............#
         ###############
`,
  legend: {
    a: { type: 'rune', group: 'vault', order: 1, color: '#5ee0ff', floor: 'floor', h: 0 },
    i: { type: 'rune', group: 'vault', order: 2, color: '#ffd166', floor: 'floor', h: 0 },
    l: { type: 'rune', group: 'vault', order: 3, color: '#7dff9a', floor: 'floor', h: 0 },
    m: { type: 'rune', group: 'vault', order: 4, color: '#ff4f5e', floor: 'floor', h: 0 },
    n: { type: 'sign', text: "COOLANT VAULT. Step on the four pads in the right order. Clues: BLUE goes first. RED goes last. GOLD comes right after BLUE. The pads sit on little islands, so jump carefully!" },
    D: { type: 'door', id: 'secretvault', open: { flag: 'vault' } },
    I: { type: 'prize', id: 'vault', reward: 'blaster' },
    W: { type: 'boss', boss: 'golem', room: 'arena' },
    B: { type: 'door', id: 'bossdoor', open: { boss: true } },
    L: { type: 'exit' },
    V: { type: 'vendor' },
    C: { type: 'checkpoint', id: 'cp' },
    e: { type: 'enemy', enemy: 'sporeling', variant: 'magma' },
    u: { type: 'enemy', enemy: 'turret' },
    r: { type: 'enemy', enemy: 'brute' },
    c: { type: 'conveyor', dx: 0, dz: 1, speed: 3.2 },
    v: { type: 'vent', period: 3.2 },
    Z: { type: 'cell' },
    k: { type: 'socket', flag: 'pump1' },
    K: { type: 'socket', flag: 'pump2' },
    Y: { type: 'door', id: 'pumpdoor', open: { all: [{ flag: 'pump1' }, { flag: 'pump2' }] } },
    U: { type: 'upgrade', ability: 'dash', id: 'dash' },
    E: { type: 'door', id: 'dashdoor', open: { flag: 'ability:dash' } },
    A: { type: 'platform', path: [[-5, -7]], size: 2, speed: 3.2, wait: 1.2, h: 0, floor: 'hazard' },
    s: { type: 'sign', text: 'Steam vents puff you way up high! Wait for the puff, then step right in.' },
    g: { type: 'sign', text: 'Heavy bots charge in a straight line. Jump aside and let them crash into a wall, then hit them while they are dizzy!' },
    d: { type: 'sign', text: 'That gap is HUGE! Jump, jump again, then press DASH at the top to zoom across.' },
    '!': { type: 'shard', id: 's1' },
    '?': { type: 'shard', id: 's2' },
    '*': { type: 'shard', id: 's3' },
    P: { type: 'cocoon', id: 'c1', name: 'Engineer Argus', line: 'Did somebody fix the pumps? Great job, kiddo!' },
    Q: { type: 'cocoon', id: 'c2', name: 'Grandpa Nestor', line: 'I have not moved that fast in years. Thank you, young one!' },
    H: { type: 'holo', log: 'log' },
    G: { type: 'breakwall' },
    '+': { type: 'canister', id: 'hc' },
  },
  objectives: [
    { until: { all: [{ flag: 'pump1' }, { flag: 'pump2' }] }, text: 'Bring two power cells to the coolant pumps' },
    { until: { flag: 'ability:dash' }, text: 'Grab the DASH THRUSTERS' },
    { until: { boss: true }, text: 'Dash across the lava and cool down the Magma Golem' },
    { until: { flag: 'never' }, text: 'Ride the lift up to the Habitat Ring', at: 'exit' },
  ],
  dialogues: {
    intro: [
      { who: 'halcyon', text: 'Welcome to the Engine Core. Please do not touch the lava. Or the other lava. Or that lava over there.' },
      { who: 'bolt', text: 'The coolant pumps are switched off! No wonder it is so hot in here.' },
      { who: 'halcyon', text: 'Plug two power cells into the pumps and the lab door will open. The DASH THRUSTERS are inside.' },
      { who: 'jason', text: 'Two cells, two pumps. Easy peasy!' },
    ],
    log: [
      { who: 'captain', text: 'Captain’s log, day three. Someone has locked the helm and pointed us at the star. It wasn’t me.' },
      { who: 'captain', text: 'GaScu’s roots have reached the Bridge controls. I think that star looks like home to it.' },
      { who: 'captain', text: 'Engineering, if anyone is awake: restart the coolant pumps before the engines melt!' },
      { who: 'jason', text: 'Engineering... that’s me! Junior engineer, but still!' },
    ],
    boss: [
      { who: 'halcyon', text: 'The MAGMA GOLEM! It is made of melted engine parts and GaScu roots.' },
      { who: 'bolt', text: 'It is way too hot to hurt! Wait until it cools down and turns grey, then jump on its back and GROUND POUND!' },
    ],
    bossDown: [
      { who: 'bolt', text: 'Phew! It is just a pile of warm, sleepy rocks now.' },
      { who: 'halcyon', text: 'Engines cooling down. Great work! But we are still heading for that star.' },
      { who: 'jason', text: 'Then we keep climbing. Next deck!' },
    ],
    'shard:s1': [
      { who: 'gascu', text: 'The engine felt so warm, like a little sun. I love suns.' },
    ],
    'shard:s2': [
      { who: 'gascu', text: 'I pointed the ship at the big bright star. It looked just like home.' },
    ],
    'shard:s3': [
      { who: 'gascu', text: 'My home was a garden around a star. It went dark a long, long time ago.' },
      { who: 'bolt', text: 'So GaScu is trying to go home... but that star is far too hot for the ship!' },
    ],
  },
};
