import type { LevelDef } from '../world/levelTypes';

/**
 * Deck 1 — the tutorial. Wake up, learn to jump, find BOLT in the dark storeroom, hack a door,
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
    #......................#
    #..........y...........#
    ###########D############
    #.......#T.............#
    #.m..m..#..............#
    #.o.o.o.#..............#
    #.x.....O..............#
    #.......#..............#
    #.r...%.#..............#
    #!....F.#......g.......#
    #########..............#
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
    g: { type: 'trigger', id: 'needbolt', dialogue: 'needbolt', w: 5, d: 2 },
    j: { type: 'sign', text: 'Tap JUMP to hop up the ledge. Hold JUMP longer to jump higher!' },
    y: { type: 'sign', text: 'Enemies ahead! Hold BLAST to shoot. It aims for you. The door opens when the room is clear.' },
    q: { type: 'sign', text: 'Red switches need a GROUND POUND. Jump, then press SPIN in mid-air to slam down!' },
    '*': { type: 'shard', id: 's1' },
    '?': { type: 'shard', id: 's2' },
    '!': { type: 'shard', id: 's3' },
    K: { type: 'cocoon', id: 'c1', name: 'Dr. Mira Okafor', line: 'Thank you! I was dreaming about pancakes...' },
    Q: { type: 'cocoon', id: 'c2', name: 'Chef Tobias', line: 'Free at last! I will cook everyone a feast when we land!' },
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
    { until: { flag: 't1' }, text: 'Hack the door terminal with BOLT' },
    { until: { clear: 'r1' }, text: 'Defeat the frozen sporelings' },
    { until: { flag: 'bridge1' }, text: 'Ground-pound the red switch' },
    { until: { boss: true }, text: 'Stop the Frost Warden' },
    { until: { all: [{ boss: true }, { flag: 'never' }] }, text: 'Ride the lift up to Hydroponics' },
  ],
  dialogues: {
    intro: [
      { who: 'halcyon', text: 'Wake up! Wake up! Crew member detected. Hello! I am HALCYON, the ship computer.' },
      { who: 'kai', text: 'Ugh... my head. Why is everything covered in ice?' },
      { who: 'halcyon', text: 'A space plant called the Bloom has grown over the whole LEVIATHAN. The ship is drifting toward a star!' },
      { who: 'halcyon', text: 'Please climb up to the Bridge, six decks above us, and steer us to safety. No pressure! (Lots of pressure.)' },
      { who: 'kai', text: 'Junior engineer Kai Reyes, reporting for duty. Let’s go!' },
    ],
    needbolt: [
      { who: 'halcyon', text: 'Hmm. The door ahead is sealed, and only a repair drone can hack its terminal.' },
      { who: 'halcyon', text: 'My sensors show a drone in the dark storeroom to the west. It is very dark in there. Be brave!' },
    ],
    bolt: [
      { who: 'kai', text: 'Hey, little guy. Are you okay? Let me fix that loose wire...' },
      { who: 'bolt', text: 'Bzzzt! BOLT online! Oh! A HUMAN! Hello, hello, hello!' },
      { who: 'bolt', text: 'I was hiding in here. The dark is scary. But you are not scary!' },
      { who: 'kai', text: 'I’m going up to the Bridge. Want to come?' },
      { who: 'bolt', text: 'YES! I can light up dark rooms, zap bad guys, and HACK terminals. Walk up to one and press the ACTION button!' },
    ],
    boss: [
      { who: 'halcyon', text: 'Warning! The FROST WARDEN security robot is tangled in Bloom vines. It thinks you are an intruder!' },
      { who: 'bolt', text: 'JUMP over its ice rings! When the chest hatch opens, BLAST the glowing core!' },
    ],
    bossDown: [
      { who: 'bolt', text: 'You did it! The Warden is just a sleepy old robot again.' },
      { who: 'halcyon', text: 'The lift to the Hydroponics Deck is unlocked. Onward and upward!' },
    ],
    'shard:s1': [
      { who: 'bolt', text: 'A memory shard! Bloom crystals remember things. Look, it is showing a picture...' },
      { who: 'bloom', text: '...cold... so cold and dark out here between the stars...' },
      { who: 'bolt', text: 'That felt so lonely. There are 18 shards on the ship. Let’s find them all!' },
    ],
    'shard:s2': [{ who: 'bloom', text: 'A giant warm ship, full of lights! Maybe... a friend?' }],
    'shard:s3': [
      { who: 'bloom', text: 'I held on tight to the ship. I only wanted to be warm.' },
      { who: 'bolt', text: 'The Bloom was scared of the dark, just like me...' },
    ],
  },
};
