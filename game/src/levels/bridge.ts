import type { LevelDef } from '../world/levelTypes';

/**
 * Deck 6 — the Bridge, the grand finale. Cross the broken observation gallery, fetch the navigation
 * power cell from the dark crew wing, carry it through the laser hall, hack the navigation computer,
 * ride the lift up the Spine and face the Bloom Heart. With all 18 shards, BOLT can talk to it instead.
 */
export const bridge: LevelDef = {
  id: 'bridge',
  index: 6,
  name: 'The Bridge',
  subtitle: 'The heart of the Bloom',
  music: 'bridge',
  intro: 'intro',
  boss: 'heart',
  shardIds: ['s1', 's2', 's3'],
  colonistIds: ['c1', 'c2'],
  map: `
      #######################
      #99c99c9999n9999c99c99#
      #999999999999999999999#
      #999999999999999999999#
      #9f99999999999999999f9#
      #999999999999999999999#
      #999999999999999999999#
      #999999999999999999999#
      #999999999999999999999#
      #9999999999W9999999999#
      #999999999999999999999#
      #999999999999999999999#
      #999999999999999999999#
      #999999999999999999999#
      #9999f99999999999f9999#
      #999999999999999999999#
      #999999999999999999999#
      #999999999999999999999#
      #9f99999999999999999f9#
      #999999999999999999999#
      ##########999##########
          #9999999999999#
          #9h9999y999V99#
          #9999999999999#
          #999999C999999#
          #99o9999999o99#
          #9999999999999#
    ############999############
    #        999999999        #
    #        999999999        #
    #                         #
    #9999    999              #
    #9o99    999          9!  #
    #999d    999          99  #
    #9o99                     #
    #9999                     #
    #9999                     #
    #                         #
    #    A                    #
    #                         #
    #.................j.......#
    #............C............#
    #############N#############
    #.........................#
    #...T.................k...#
    #.........o.o.o.o.........#
    #.........................#
    #.......s.........s.......#
    #.........................#
    #............r............####
    #....x...............x....G.+#
    #.........................####
    #.Q..........C............#
    #.........................#
 ###############...############
 #....#....##.........#
 #....#...o##a........#
 #.Z..#..K.##.........#
 #........o##q........#
 #..u.#....##YYYYYYYYY#
 #....#.e.o##.........#
 #.?..#....##q........#
 #........o##.........#
 #....#..x.##i........#
 #.%......o##.........#
 #.........##....l....#
 #####O#########...####
 #.......................
 #............m..........
 #        F
 #        F
 #        F
 #.x...........v.........
 #......C...........e....     .*
 #...e..................w     ..
 #.....................x.
 #
 #
 #                P
 #
 #.......................
 #..o..o..o..o.......x...
 #.......................
          ######...######
          #.............#
          #.c....g....c.#
          #.............#
          #......@......#
          #.............#
          ###############
`,
  legend: {
    W: { type: 'boss', boss: 'heart', room: 'heart' },
    V: { type: 'vendor' },
    C: { type: 'checkpoint', id: 'cp' },
    e: { type: 'enemy', enemy: 'sporeling', variant: 'toxic' },
    v: { type: 'enemy', enemy: 'buzzer' },
    s: { type: 'enemy', enemy: 'sentry' },
    r: { type: 'enemy', enemy: 'brute' },
    u: { type: 'enemy', enemy: 'turret' },
    T: { type: 'terminal', flag: 't1', length: 6 },
    Z: { type: 'cell' },
    k: { type: 'socket', flag: 'nav' },
    N: { type: 'door', id: 'spinedoor', open: { all: [{ flag: 't1' }, { flag: 'nav' }] } },
    O: { type: 'door', id: 'wingdoor', open: { all: [] } },
    A: { type: 'platform', path: [[0, -2, 8]], size: 2, speed: 2.4, wait: 1.4, h: 0 },
    P: { type: 'platform', path: [[0, -2]], size: 2, speed: 2.6, wait: 1, h: 0 },
    F: { type: 'faller', h: 0 },
    a: { type: 'laser', axis: 'x', length: 8, period: 2.8, offset: 0 },
    i: { type: 'laser', axis: 'x', length: 8, period: 2.8, offset: 1.4 },
    q: { type: 'laser', axis: 'x', length: 8, always: true },
    Y: { type: 'zap', period: 2.6 },
    g: { type: 'trigger', id: 'captain', dialogue: 'captain', w: 5, d: 1 },
    l: { type: 'sign', text: 'Two of these lasers never switch off. Pop BOLT’s SHIELD and run for it, even while carrying a power cell!' },
    m: { type: 'sign', text: 'OBSERVATION GALLERY. The floor is broken! Cross the crumbling tiles quickly, or hover over the gap.' },
    w: { type: 'sign', text: 'Something shiny is floating outside the window. Only a long hover will get you there.' },
    j: { type: 'sign', text: 'Hop on the lift! It carries you up the Spine.' },
    d: { type: 'sign', text: 'Next ledge is far away: jump, double jump, then DASH. Or hover if you are feeling fancy.' },
    y: { type: 'sign', text: 'The Bloom Heart is just ahead. Heal up, buy upgrades, and remember: BOLT believes in you!' },
    '*': { type: 'shard', id: 's1' },
    '?': { type: 'shard', id: 's2' },
    '!': { type: 'shard', id: 's3' },
    K: { type: 'cocoon', id: 'c1', name: 'Captain Ines Mbeki', line: 'You made it all the way up here? Incredible. The ship is in good hands!' },
    Q: { type: 'cocoon', id: 'c2', name: 'Navigator Jun', line: 'Thank you! The star charts are in the navigation computer. Go, go, go!' },
    G: { type: 'breakwall' },
    '+': { type: 'canister', id: 'hc' },
    c: { type: 'decor', kind: 'console' },
    n: { type: 'decor', kind: 'screen' },
    f: { type: 'decor', kind: 'bloom', solid: false },
  },
  objectives: [
    { until: { flag: 'nav' }, text: 'Find the navigation power cell in the dark crew wing' },
    { until: { flag: 't1' }, text: 'Hack the navigation terminal' },
    { until: { boss: true }, text: 'Ride up the Spine and reach the Bloom Heart' },
    { until: { flag: 'never' }, text: 'Save the Leviathan!' },
  ],
  dialogues: {
    intro: [
      { who: 'halcyon', text: 'The Bridge. The star is getting very, very close. I can feel my circuits sweating.' },
      { who: 'bolt', text: 'The Bloom Heart is up here somewhere. It is steering the whole ship!' },
      { who: 'kai', text: 'Then we take the controls back. One last deck, BOLT. Let’s do this.' },
    ],
    captain: [
      { who: 'captain', text: 'This is Captain Ines Mbeki. If anyone can hear this... the Bloom has taken the Bridge.' },
      { who: 'captain', text: 'The navigation computer needs its power cell and a clean hack. Then the lift up the Spine will open. Good luck, whoever you are!' },
    ],
    boss: [
      { who: 'halcyon', text: 'There it is: THE BLOOM HEART, steering us straight toward the star!' },
      { who: 'bolt', text: 'Pop the four pods around it first. Then BLAST the Heart whenever its petals open up!' },
      { who: 'bolt', text: 'Hmm... if we had ALL 18 memory shards, maybe I could learn to SPEAK to it instead...' },
    ],
    bossDown: [
      { who: 'bolt', text: 'The Heart is shrinking... it is turning into a tiny little seed!' },
      { who: 'halcyon', text: 'The vines are letting go of the controls! Kai, grab the steering wheel!' },
      { who: 'kai', text: 'Hold on, everybody! Turning the ship... NOW!' },
    ],
    speak: [
      { who: 'bolt', text: 'Kai, wait! I learned the Bloom’s light-words from the shards. Blue is hello. Pink is safe. Gold is together.' },
      { who: 'bolt', text: 'Help me flash them to the Heart. Repeat my pattern, gently, just like a hack!' },
    ],
    friends: [
      { who: 'bloom', text: '...hello? ...safe? ...together?' },
      { who: 'bolt', text: 'YES! Together! You do not have to be scared anymore!' },
      { who: 'bloom', text: 'Friends... I never had friends before. I am sorry I made everyone so sleepy.' },
      { who: 'kai', text: 'It’s okay. Can you help us turn the ship away from the star?' },
      { who: 'bloom', text: 'I know a better place. A blue world, with warm rain and lots of room to grow. Hold on tight!' },
    ],
    'shard:s1': [{ who: 'bloom', text: 'I am so tired of being scared all the time.' }],
    'shard:s2': [{ who: 'bloom', text: 'The star is getting closer. It is too hot. I do not want anyone to get hurt.' }],
    'shard:s3': [
      { who: 'bloom', text: 'Please... someone... flash back.' },
      { who: 'bolt', text: 'I will. I promise.' },
    ],
  },
};
