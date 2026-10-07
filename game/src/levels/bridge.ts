import type { LevelDef } from '../world/levelTypes';

/**
 * Deck 6 — the Bridge, the grand finale. Cross the broken observation gallery, fetch the navigation
 * power cell from the dark crew wing, carry it through the laser hall, hack the navigation computer,
 * ride the lift up the Spine and face the Heart of GaScu. With all 18 shards, LUX can talk to it instead.
 */
export const bridge: LevelDef = {
  id: 'bridge',
  index: 6,
  name: 'The Bridge',
  subtitle: 'The heart of GaScu',
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
    #############N###################
    #.p.......................#.....#
    #...T.................k...#..I..#
    #.........o.o.o.o.......H.D.....#
    #...................p.....#.....#
    #.......s.........s.......#######
    #............=............#
    #............r............####
    #....x...............x....G.+#
    #.........................####
    #.Q..........C............#
    #.p.....................p.#
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
    p: { type: 'switch', flag: 'vault', timed: 28, together: true },
    H: { type: 'sign', text: "SECRET VAULT. GROUND POUND all FOUR red switches in this room within 28 seconds. The clock starts with the first one, so plan your route!" },
    D: { type: 'door', id: 'secretvault', open: { flag: 'vault' } },
    I: { type: 'prize', id: 'vault', reward: 'bolts' },
    W: { type: 'boss', boss: 'heart', room: 'heart' },
    V: { type: 'vendor' },
    C: { type: 'checkpoint', id: 'cp' },
    e: { type: 'enemy', enemy: 'sporeling', variant: 'toxic' },
    v: { type: 'enemy', enemy: 'buzzer' },
    s: { type: 'enemy', enemy: 'sentry' },
    r: { type: 'enemy', enemy: 'brute' },
    u: { type: 'enemy', enemy: 'turret' },
    T: { type: 'terminal', flag: 't1', length: 6, puzzle: 'grid' },
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
    g: { type: 'holo', log: 'log' },
    l: { type: 'sign', text: 'Two of these lasers never switch off. Fire LUX’s PULSE to short them out, then run for it, even while carrying a power cell!' },
    m: { type: 'sign', text: 'OBSERVATION GALLERY. The floor is broken! Cross the crumbling tiles quickly, or hover over the gap.' },
    w: { type: 'sign', text: 'Something shiny is floating outside the window. Only a long hover will get you there.' },
    j: { type: 'sign', text: 'Hop on the lift! It carries you up the Spine.' },
    d: { type: 'sign', text: 'Next ledge is far away: jump, double jump, then DASH. Or hover if you are feeling fancy.' },
    y: { type: 'sign', text: 'The Heart of GaScu is just ahead. Heal up, buy upgrades, and remember: LUX believes in you!' },
    '*': { type: 'shard', id: 's1' },
    '?': { type: 'shard', id: 's2' },
    '!': { type: 'shard', id: 's3' },
    K: { type: 'cocoon', id: 'c1', name: 'Captain Atalanta', line: 'You made it all the way up here? Incredible. The ship is in good hands!' },
    Q: { type: 'cocoon', id: 'c2', name: 'Navigator Tiphys', line: 'Thank you! The star charts are in the navigation computer. Go, go, go!' },
    G: { type: 'breakwall' },
    '+': { type: 'canister', id: 'hc' },
    c: { type: 'decor', kind: 'console' },
    n: { type: 'decor', kind: 'screen' },
    f: { type: 'decor', kind: 'bloom', solid: false },
  },
  objectives: [
    { until: { flag: 'nav' }, text: 'Find the navigation power cell in the dark crew wing' },
    { until: { flag: 't1' }, text: 'Hack the navigation terminal' },
    { until: { boss: true }, text: 'Ride up the Spine and reach the Heart of GaScu' },
    { until: { flag: 'never' }, text: 'Save the {ship}!' },
  ],
  dialogues: {
    intro: [
      { who: 'halcyon', text: 'The Bridge. Temperature rising. Please hurry, Jason.' },
      { who: 'bolt', text: 'The Heart is right at the top. It is steering the whole ship!' },
      { who: 'jason', text: 'Then we take the wheel back. One last deck, LUX.' },
    ],
    log: [
      { who: 'captain', text: 'Captain’s log, last entry. GaScu has taken the Bridge. I’m going up to try to talk to it.' },
      { who: 'captain', text: 'To whoever finds this: the navigation computer needs its power cell and a hack. Then the lift up the Spine will open.' },
      { who: 'captain', text: 'And if you reach the Heart... remember that it’s scared. Be brave. Be kind.' },
    ],
    'colonist:c1': [
      { who: 'captain', text: 'Wha... LUX? My little light! You found a friend!' },
      { who: 'bolt', text: 'Captain! This is Jason. Jason is the BRAVEST!' },
      { who: 'captain', text: 'Jason, the junior engineer? Well, I think you’ve just earned a promotion. Now go. The Heart is at the top of the Spine.' },
    ],
    boss: [
      { who: 'halcyon', text: 'There it is: THE HEART OF GASCU, steering us straight into the star!' },
      { who: 'bolt', text: 'Pop the four pods around it first. Then BLAST the Heart whenever its petals open up!' },
    ],
    bossDown: [
      { who: 'bolt', text: 'The Heart is shrinking... it is turning into a tiny little seed!' },
      { who: 'halcyon', text: 'The vines are letting go of the controls! Jason, the steering wheel!' },
      { who: 'jason', text: 'Hold on, everybody! Turning the ship... NOW!' },
    ],
    fallen: [
      { who: 'bolt', text: 'We did it... did we do it? Jason, why is the floor shaking?' },
    ],
    reborn: [
      { who: 'halcyon', text: 'Warning! GaScu is pulling EVERY vine on the ship back into the Heart!' },
      { who: 'gascu', text: 'NO! The blue world is where HE is! I will NOT go back there! Never!' },
      { who: 'jason', text: 'It’s so scared, it’s fighting with everything it has left.' },
      { who: 'bolt', text: 'It only gets hurt when its big eye opens! Charge up a FIREBALL for that! And JUMP over its thorn rings and vine beams!' },
    ],
    speak: [
      { who: 'bolt', text: 'Jason, wait! I learned GaScu’s light-words from the shards. Blue is hello. Pink is safe. Gold is together.' },
      { who: 'bolt', text: 'Help me flash them to the Heart. Copy my pattern, gently, just like a hack!' },
    ],
    friends: [
      { who: 'gascu', text: '...hello? ...safe? ...together?' },
      { who: 'bolt', text: 'YES! Together! You don’t have to be scared anymore!' },
      { who: 'gascu', text: 'Friends... I never had friends before. I was only running away.' },
      { who: 'jason', text: 'Running into that star would burn you... and all of us. We won’t let anyone hurt you.' },
      { who: 'gascu', text: 'Even... on the blue world?' },
      { who: 'jason', text: 'Especially there. That’s where we’re all going to live. Together.' },
      { who: 'gascu', text: 'Together. Hold on tight!' },
    ],
    'shard:s1': [
      { who: 'gascu', text: 'I am so tired of being scared all the time.' },
    ],
    'shard:s2': [
      { who: 'gascu', text: 'The star is getting closer. It is too hot. I do not want anyone to get hurt.' },
    ],
    'shard:s3': [
      { who: 'gascu', text: 'Please... someone... flash back.' },
      { who: 'bolt', text: 'I will. I promise.' },
    ],
  },
};
