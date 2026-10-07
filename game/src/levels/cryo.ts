import type { LevelDef } from '../world/levelTypes';

/**
 * Deck 1 — the tutorial. Wake up, learn to jump, find LUX in the dark storeroom, hack a door,
 * clear a room, ground-pound a switch, slide across the ice hall and beat the Frost Warden.
 */
export const cryo: LevelDef = {
  id: 'cryo',
  index: 1,
  name: 'Cryo Deck',
  subtitle: 'Wake up, engineer!',
  music: 'cryo',
  intro: 'intro',
  boss: 'warden',
  shardIds: ['s1', 's2', 's3'],
  colonistIds: ['c1', 'c2'],
  map: `
           #########
           #...L...#
           #.......#
           #.......#
      #########B#########
      #i...............i#
      #.22...........22.#
      #.22...........22.#
      #.................#
      #.................#
      #.................#
      #........W........#
      #.................#
      #.................#
      #.................#
      #.................#
      #.22...........22.#
      #.22...........22.#
      #i...............i#
      ########...########
         #.............#
         #.o.o.....V...#
         #.............#
         #.....C.....h.#
         #.o.o.........#
    ##########...###########
    #....o.o.o......o.o.o..#
    #._________........4444#
    #._~~~____.___.....4?44#
    #._~~~____.___..e..4h44#
    #.________________.4444#
    #..______z_________....#
    #22.____________..b....#
    #K21.___~~~______......#
    #22.____~~~___e__......#
    #._______~~~___________#
    #.__e__________________#
    #...o...o...o...o...o..#
    #..........C...........#
    ##########...###########
    #......................#
    #                      #
    #                      #
    #                      #
    #          p           #
    #                      #
    #......................#
    #....q..P..............#
    #..o.o.o........o.o.o..#
    ###########E############
    #......................#
    #..R..............R....#
    #......................#
    #........2222..........#
    #.x......22R2........x.#
    #........2222..........#
    #......................#############
    #..........y...........#...........#
    ###########D############.a.......v.#
    #.......#T.............#...........#####
    #.m..m..#..............#.....u.....#...#
    #.o.o.o.#..............#...........#...#
    #.x.....O...................s......Z.Y.#
    #.......#..............#...........#...#
    #.r...%.#..............#...........#####
    #!....F.#......g.......#.x.......x.#
    #########..............#############
    ##############...#######
                  111
              3333333
              333

              333
          *3 x333xffff3Q3
          33 33333    333

              333
              333
            j.....
            .......
     #########...##########
     #d.d.d.d......d.d.d.d####
     #....................#..#
     #d........@..........G.+#
     #....................#..#
     #d.......c..c.......d####
     #.......oooooo.......#
     #d.d.d.d......d.d.d.d#
     ######################
`,
  legend: {
    a: { type: 'rune', group: 'vault', order: 1, color: '#ffd166' },
    u: { type: 'rune', group: 'vault', order: 2, color: '#ff6fcf' },
    v: { type: 'rune', group: 'vault', order: 3, color: '#5ee0ff' },
    s: { type: 'sign', text: "SECRET VAULT LOCK. Step on the glowing tiles in this order: GOLD, then PINK, then BLUE. Step on a wrong one and the code resets!" },
    Z: { type: 'door', id: 'secretvault', open: { flag: 'vault' } },
    Y: { type: 'prize', id: 'vault', reward: 'clip' },
    W: { type: 'boss', boss: 'warden', room: 'arena' },
    B: { type: 'door', id: 'bossdoor', open: { boss: true } },
    L: { type: 'exit' },
    V: { type: 'vendor' },
    C: { type: 'checkpoint', id: 'cp' },
    e: { type: 'enemy', enemy: 'sporeling', variant: 'frost' },
    z: { type: 'enemy', enemy: 'buzzer' },
    R: { type: 'enemy', enemy: 'sporeling', variant: 'frost', room: 'r1' },
    E: { type: 'door', id: 'r1door', open: { clear: 'r1' } },
    D: { type: 'door', id: 'hackdoor', open: { flag: 't1' } },
    T: { type: 'terminal', flag: 't1', length: 3 },
    O: { type: 'door', id: 'storedoor', open: { all: [] } },
    F: { type: 'boltfind' },
    P: { type: 'switch', flag: 'bridge1' },
    p: { type: 'platform', path: [[0, -3]], size: 2, speed: 2.6, wait: 1.2, needs: { flag: 'bridge1' }, h: 0 },
    f: { type: 'faller', h: 1.5 },
    g: { type: 'holo', log: 'log' },
    j: { type: 'sign', text: 'Tap JUMP to hop up the ledge. Hold JUMP longer to jump higher!' },
    y: { type: 'sign', text: 'Enemies ahead! Hold BLAST to shoot. It aims for you. The door opens when the room is clear.' },
    q: { type: 'sign', text: 'Red switches need a GROUND POUND. Jump, then press SPIN in mid-air to slam down!' },
    '*': { type: 'shard', id: 's1' },
    '?': { type: 'shard', id: 's2' },
    '!': { type: 'shard', id: 's3' },
    K: { type: 'cocoon', id: 'c1', name: 'Dr. Hypatia', line: 'Thank you! I was dreaming about pancakes...' },
    Q: { type: 'cocoon', id: 'c2', name: 'Chef Apicius', line: 'Free at last! I will cook everyone a feast when we land!' },
    G: { type: 'breakwall' },
    '+': { type: 'canister', id: 'hc' },
    d: { type: 'decor', kind: 'pod' },
    c: { type: 'decor', kind: 'console' },
    m: { type: 'decor', kind: 'locker' },
    r: { type: 'decor', kind: 'barrel' },
    i: { type: 'decor', kind: 'crystal' },
  },
  objectives: [
    { until: { flag: 'bolt' }, text: 'Find a way through the sealed door' },
    { until: { flag: 't1' }, text: 'Hack the door terminal with LUX' },
    { until: { clear: 'r1' }, text: 'Defeat the frozen sporelings' },
    { until: { flag: 'bridge1' }, text: 'Ground-pound the red switch' },
    { until: { boss: true }, text: 'Stop the Frost Warden' },
    { until: { all: [{ boss: true }, { flag: 'never' }] }, text: 'Ride the lift up to Hydroponics', at: 'exit' },
  ],
  dialogues: {
    wake: [
      { who: 'halcyon', text: 'Thawing complete! Good morning, crew member. You have been asleep for one hundred years. ...Just kidding. Six months.' },
      { who: 'jason', text: 'Brrr... HALCYON? Why is everything covered in ice... and pink vines?' },
    ],
    intro: [
      { who: 'halcyon', text: 'A space vine has grown over the whole ship: the Galactic Cuscuta Echinochloa. GaScu, for short. Everyone else is frozen in their pods or wrapped up in cocoons.' },
      { who: 'halcyon', text: 'Worse news: GaScu has steered us toward a star. Someone has to climb up to the Bridge, six decks above us, and turn us around.' },
      { who: 'jason', text: 'Someone? You mean... me?' },
      { who: 'halcyon', text: 'You are the only person awake, junior engineer Jason. So yes! Congratulations!' },
      { who: 'jason', text: 'Okay. Okay! Deep breath. Let’s do this.' },
    ],
    log: [
      { who: 'captain', text: 'Captain’s log. This is Captain Argus. A glowing comet just hit the hull. Wait... it isn’t a comet. It’s ALIVE.' },
      { who: 'captain', text: 'It’s growing through the air vents! Everyone, stay in your pods. LUX? LUX, where did you go?' },
      { who: 'captain', text: 'If anyone finds my little repair drone: he hides in the storeroom when he’s scared. Please look after him.' },
      { who: 'halcyon', text: 'That sealed door needs a drone to hack it. The storeroom is to the west. It is very dark in there... be brave, Jason.' },
    ],
    bolt: [
      { who: 'jason', text: 'Hey, little guy. You must be LUX. Hold still, I’ll fix that loose wire...' },
      { who: 'bolt', text: 'Bzzzt! LUX... online! Oh! Oh! A HUMAN! Hello, hello, hello!' },
      { who: 'bolt', text: 'I was hiding. The dark is scary. And the vines are scary. And the big BANG was very, VERY scary.' },
    ],
    boltJoin: [
      { who: 'jason', text: 'The Captain is looking for you. He left a message. Want to come with me to the Bridge?' },
      { who: 'bolt', text: 'The Captain! YES! I can light up dark places, zap bad guys and HACK terminals. Walk up to one and press the button!' },
      { who: 'bolt', text: 'Just... stay close, okay? I will be brave if you are brave.' },
    ],
    boss: [
      { who: 'halcyon', text: 'Warning! The FROST WARDEN guards the lift, and GaScu’s vines have scrambled its brain!' },
      { who: 'bolt', text: 'JUMP over its ice rings! When its chest hatch opens, BLAST the glowing core!' },
    ],
    bossDown: [
      { who: 'bolt', text: 'We did it! The Warden is just a sleepy old robot again.' },
      { who: 'jason', text: 'Sorry, big guy. Sweet dreams.' },
      { who: 'halcyon', text: 'The lift is unlocked. Next stop: Hydroponics!' },
    ],
    'shard:s1': [
      { who: 'bolt', text: 'A memory shard! GaScu crystals remember things. Look, it is showing a picture...' },
      { who: 'gascu', text: '...cold... so cold and dark out here between the stars...' },
      { who: 'bolt', text: 'That felt so lonely. There are 18 shards on the ship. Let’s find them all!' },
    ],
    'shard:s2': [
      { who: 'gascu', text: 'A giant warm ship, full of lights! Maybe... a friend?' },
    ],
    'shard:s3': [
      { who: 'gascu', text: 'I held on tight to the ship. I only wanted to be warm.' },
      { who: 'bolt', text: 'GaScu was scared of the dark... just like me.' },
    ],
  },
};
