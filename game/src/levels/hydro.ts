import type { LevelDef } from '../world/levelTypes';

/**
 * Deck 2 — the ship's gardens. Bounce on mushrooms, ride lily pads over the sludge river,
 * hack into the seed vault for the JET BOOTS, double-jump up the atrium and face the Vine Queen.
 */
export const hydro: LevelDef = {
  id: 'hydro',
  index: 2,
  name: 'Hydroponics',
  subtitle: 'The garden that ate the ship',
  music: 'hydro',
  intro: 'intro',
  boss: 'queen',
  shardIds: ['s1', 's2', 's3'],
  colonistIds: ['c1', 'c2'],
  map: `
           #########
           #666L666#
           #6666666#
      #########B#########
      #66666666666666666#
      #66666666666666666#
      #66996666666669966#
      #66996666666669966#
      #66666666666666666#
      #66666666666666666#
      #66666666666666666#
      #66666666W66666666#
      #66666666666666666#
      #66666666666666666#
      #66666666666666666#
      #66996666666669966#
      #66996666666669966#
      #66666666666666666#
      #66666666666666666#
      ########666########
         #6666666666666#
         #6o6o66666V666#
         #6666666666666#
         #66666C66666h6#
         #6666666666666#
    ##########666###########
    #6666666666666666666666#
    #6666666o666666o6666666#
    #444                   #
    #4Q4   666666          #
    # f    6o66o6    99    #
    # f               9?   #
    # f                    #
    #444444444444  b       #
    #4o4444444o44 444      #
    #444444444444 444      #
    #                      #
    #                      #
    #.........J............#
    #..........C...........#
    #......................#
    ###########E############
    #######.........########
    #######.o..U..o.########
    #######.........########
    ###########Y############
    #......................#
    #..R....~~......~~..R..#
    #......................###
    #.x.......S..S.......x.G+#
    #......................###
    #..........y...........#
    ###########D############
    #........T......H......#
    #..o.o.o........o.o.o..#
    #..........C...........#
    #f~~~~~~~~~~~~~~~P~~~~~#
    #f~~~~~~~~~~~~~~~~~~~~~#
    #f~~~~~..~~~~~...~~~~~~#
    #f~~~~~.!~~~~~.o.~~~~~~#
    #f~~~~~~~~~~~~~~~~~~~~~#
    #fA~~~~~~~~~~~~~~~~~~~~#
    #f~~~~~~~~~~~~~~~~~~~~~#
    #......................#
    #.t....t.......t....t..#
    #.k...............u....#
    #..2222........2222..66#
    #..2cc2...e....2cc2..6K#
    #..2cc2........2cc2..o6#
    #..2222....n...2222..66#
  ###..........x.........o6#######
  #*G.....b..............66#66666#
  ###.z..................o6#66I66#
    #..2222........2222..66Z66666#
    #..2cc2....n...2cc2.w66#66666#
    #..2cc2........2cc2.b66#######
    #..2222..e.....2222..66#
    #...o.o.o..l...o.o.o...#
    ##########...###########
         #.............#
         #.....@.......#
         #.............#
         ###############
`,
  legend: {
    k: { type: 'switch', flag: 'hs1', timed: 20 },
    l: { type: 'switch', flag: 'hs2', timed: 20 },
    u: { type: 'switch', flag: 'hs3', timed: 20 },
    w: { type: 'sign', text: "SECRET VAULT (up on the ledge). It opens when all THREE red switches in this garden are down at the same time. Each one pops back up after 20 seconds, so plan your route and GROUND POUND fast!" },
    Z: { type: 'door', id: 'secretvault', open: { all: [{ flag: 'hs1' }, { flag: 'hs2' }, { flag: 'hs3' }] }, latch: true },
    I: { type: 'prize', id: 'vault', reward: 'heart' },
    W: { type: 'boss', boss: 'queen', room: 'arena' },
    B: { type: 'door', id: 'bossdoor', open: { boss: true } },
    L: { type: 'exit' },
    V: { type: 'vendor' },
    C: { type: 'checkpoint', id: 'cp' },
    e: { type: 'enemy', enemy: 'sporeling' },
    n: { type: 'enemy', enemy: 'snapper' },
    z: { type: 'enemy', enemy: 'buzzer' },
    R: { type: 'enemy', enemy: 'snapper', room: 'r1' },
    S: { type: 'enemy', enemy: 'sporeling', variant: 'toxic', room: 'r1' },
    D: { type: 'door', id: 'vaultdoor', open: { flag: 't1' } },
    T: { type: 'terminal', flag: 't1', length: 4 },
    Y: { type: 'door', id: 'innerdoor', open: { clear: 'r1' } },
    U: { type: 'upgrade', ability: 'doubleJump', id: 'boots' },
    E: { type: 'door', id: 'atriumdoor', open: { flag: 'ability:doubleJump' } },
    A: { type: 'platform', path: [[12, 0]], size: 2, speed: 4, wait: 1, h: 0, floor: 'hazard' },
    P: { type: 'platform', path: [[-14, 0]], size: 2, speed: 4, wait: 1, h: 0, floor: 'hazard' },
    f: { type: 'faller', h: 0, floor: 'hazard' },
    J: { type: 'sign', text: 'Too high to jump? Press JUMP, then press JUMP again in mid-air to fire your JET BOOTS!' },
    y: { type: 'sign', text: 'Snappers bite when you get close. Blast them from a distance, or SPIN when they open wide!' },
    '!': { type: 'shard', id: 's1' },
    '?': { type: 'shard', id: 's2' },
    '*': { type: 'shard', id: 's3' },
    K: { type: 'cocoon', id: 'c1', name: 'Gardener Chloe', line: 'My tomatoes! Oh, and thank you too, of course!' },
    Q: { type: 'cocoon', id: 'c2', name: 'Little Icarus', line: 'Whoa, that was so cool! Can I have jet boots too?' },
    G: { type: 'breakwall' },
    '+': { type: 'canister', id: 'hc' },
    H: { type: 'holo', log: 'log' },
    t: { type: 'decor', kind: 'tree' },
    c: { type: 'decor', kind: 'crops', solid: false },
  },
  objectives: [
    { until: { flag: 't1' }, text: 'Cross the sludge river and hack the seed vault' },
    { until: { clear: 'r1' }, text: 'Clear out the vault guards' },
    { until: { flag: 'ability:doubleJump' }, text: 'Grab the JET BOOTS' },
    { until: { boss: true }, text: 'Climb the atrium and stop the Vine Queen' },
    { until: { flag: 'never' }, text: 'Ride the lift up to the Engine Core', at: 'exit' },
  ],
  dialogues: {
    intro: [
      { who: 'bolt', text: 'Everything is so GREEN! And bitey. Some of those plants are definitely bitey.' },
      { who: 'halcyon', text: 'There are prototype JET BOOTS in the seed vault, across the sludge river. With them you can jump twice as high!' },
      { who: 'jason', text: 'Jet boots? Say no more!' },
    ],
    log: [
      { who: 'captain', text: 'Captain’s log, day two. GaScu went straight for the gardens. It loves light and water.' },
      { who: 'captain', text: 'It keeps wrapping sleeping people up in cocoons... gently. Like tucking them in with a blanket.' },
      { who: 'captain', text: 'I don’t think it wants to hurt us. I think it’s cold. And very, very lost.' },
      { who: 'bolt', text: 'That was the Captain’s voice! She sounds so tired...' },
    ],
    boss: [
      { who: 'halcyon', text: 'That is the VINE QUEEN! Her three golden bulbs power every vine on this deck.' },
      { who: 'bolt', text: 'Blast the bulbs! When she hides them behind her petals, dodge the big vine slam!' },
    ],
    bossDown: [
      { who: 'bolt', text: 'The vines are letting go! The garden can breathe again!' },
      { who: 'jason', text: 'Look, LUX. Even the broken vines are all pointing up.' },
      { who: 'halcyon', text: 'Toward the Bridge. Whatever is steering GaScu is up there. Next lift: the Engine Core.' },
    ],
    'shard:s1': [
      { who: 'gascu', text: 'Water and light! I grew and grew and grew. I did not know I was getting too big.' },
    ],
    'shard:s2': [
      { who: 'gascu', text: 'Little people in beds, all fast asleep. I wrapped them up to keep them warm.' },
    ],
    'shard:s3': [
      { who: 'gascu', text: 'The robots shouted at me. I got so scared that I made them sleepy too.' },
      { who: 'bolt', text: 'It was not trying to be mean. It was scared...' },
    ],
  },
};
