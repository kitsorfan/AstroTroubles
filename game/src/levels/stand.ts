import type { LevelDef } from '../world/levelTypes';

/**
 * Chapter 3, level 8 — Brennus's Last Stand, played as General Brennus alone. Aeëtes's gold fleet has
 * come to shut Colchis's ancient sky-dock, the only way down through the clouds to the Gardeners'
 * garden. Brennus (who said he was flying home) holds the dock with his old Legion so the Argo can slip
 * through. A defence level built on his moves; the Argo's approach shows as a bar at the top.
 *
 * 1. The Landing Pier: ramlings (Aeëtes's little gold ram robots: SHIELD their charge and they bonk
 *    their heads), and a cracked wall across the bridge (BIG BLAST or CHARGE).
 * 2. The Outer Dock, the first line to HOLD: a command post wakes the Legion's dock guns, then
 *    dropships bring Aeëtes's robots while the Argo flies in. It only flies at full speed while the
 *    dock is (nearly) clear, so fighting back helps. Held, the beacon turns green and the gate opens.
 * 3. The Lantern Terrace: a crate barricade to CHARGE through, a walkway over the clouds swept by gold
 *    troopers (SHIELD up and march), a cracked wall to a light-stone, a heavy plate one of Brennus's
 *    robots stands on to open the vault room, and PANDORA's tip of a vault.
 * 4. The Great Bridge, the second line: more guns, bigger drops, and a "fight" post that turns the
 *    gold Legion robots Aeëtes drops back to Brennus's side.
 * 5. The Sky Gate: PANDORA's shop, then THE GOLDEN RAM in the arena under the great arch. SHIELD its
 *    charge so its horns lock, CHARGE it into a stone pillar, BLAST its open engine. Then the Argo
 *    slips through the arch behind him, and Brennus salutes, dented and proud.
 * Side quests: three Gardener light-stones (two on islets only a CHARGE-LEAP reaches, one behind a
 * cracked wall), a heart canister on the west islet, and the vault.
 */
export const stand: LevelDef = {
  id: 'stand',
  index: 16,
  name: 'Brennus’s Last Stand',
  subtitle: 'Hold the sky-dock until the Argo is through',
  music: 'stand',
  intro: 'intro',
  boss: 'ram',
  heroes: ['brennus'],
  shardIds: ['s1', 's2', 's3'],
  map: `
                 ############
                 #.|......|.#
                 #....E.....#
                 #..........#
                 #]........]#
     #################J##################
     #.........[..............[.........#
     #.]..............|...............].#
     #..................................#
     #.....|......................|.....#
     #..................................#
     #..................................#
     #..................................#
     #................W.................#
     #..................................#
     #..................................#
     #..................................#
     #.....|......................|.....#
     #..................................#
     #.]..............|...............].#
     #...................w..............#
     ################....################
              #]..............]#
              #.......;........#
              #..q..........P..#
              #.......-........#
              #...oo.........h.#
              ########H#########
                     ,,,,
                     ,,,,
                     ,,,,
        #############....#############
        #.......[.....D......[.......#
        #..j......................j..#
         .............d..............
         .........R........R.........
        #...e....................e...#
        #.............^...u.c........#  ....
        #.....|................|......  .o..
        #.............B...............  ..T.
        #......o..............o.....n.  .o..
        #.....|................|.....#  ....
         ............................
         .............o..............
        #...........*.:..............#
        #..j.....i.r......+.......j..#
        #............................#
                     ,,,,
                     ,,,,
     ################....################
     #.e.e......F.............###########
     #........................###########
       ...#####################.........#
       .?.##..U.o.o.###########.]..I..].#
       ...##.....o..###########.........#
       .o.#####%###################V#####
       ...##..................#.........#
       ...##.R............R...#.........#
       .o.##...l......d.....O.#...e..o..#
       ...##...............e..#.........#
       ...##......N...........L..o......#
       ...##.y.....s..........#.........#
       .v.xx...........k......#.....e...#
       ...xx..................#..t...g..#
     #######........e.....Y...#.......x.#
     #######........../.......#.........#
     #################G##################
          .]......................].
          .....e....................
          ..Q....................Q..
          ........R........R........
          ............&.............
    ....  ....|................|....
    ..o.  ............A.............
    .C..  .n....o............o......
    ....  ..........................
    ....  ....|................|....
          ............o.............
          ..........$...............
          ..Q....a.p......K......Q..
          ..........."..............
                     ,,,,
                     ,,,,
                     ,,,,
              #######%%%%#######
            .]...R....!.........].
            ................R.....
            ......................
            ......................  ....
            ........Z......m....n.  ..S.
            .h....o...............  .o..
            ....{........o........  ....
            ..........@......o....
            ..x...............Xx..
            ......................
`,
  legend: {
    // The way through.
    E: { type: 'exit' },
    J: { type: 'door', id: 'archgate', open: { boss: true } },
    H: { type: 'door', id: 'bridgegate', open: { flag: 'hold2' } },
    G: { type: 'door', id: 'terracegate', open: { flag: 'hold1' } },
    W: { type: 'boss', boss: 'ram', room: 'arena' },
    K: { type: 'checkpoint', id: 'cp1' },
    k: { type: 'checkpoint', id: 'cp2' },
    '+': { type: 'checkpoint', id: 'cp3' },
    q: { type: 'checkpoint', id: 'cp4' },
    P: { type: 'vendor' },
    Y: { type: 'holo', log: 'log', who: 'captain' },
    '!': { type: 'marker', id: 'crack' },
    $: { type: 'marker', id: 'post1' },
    '&': { type: 'marker', id: 'beacon1' },
    '?': { type: 'marker', id: 'walk' },
    '*': { type: 'marker', id: 'post2' },
    '^': { type: 'marker', id: 'beacon2' },
    '-': { type: 'marker', id: 'plaza' },
    '"': { type: 'trigger', id: 'onouter', event: 'flag:outer', w: 6, d: 1, dialogue: 'outer' },
    '/': { type: 'trigger', id: 'interrace', event: 'flag:terrace', w: 4, d: 1, dialogue: 'terrace' },
    ':': { type: 'trigger', id: 'onbridge', event: 'flag:bridge', w: 8, d: 2, dialogue: 'bridge' },
    ';': { type: 'trigger', id: 'atgate', event: 'flag:plaza', w: 8, d: 2, dialogue: 'plaza' },
    // The lines Brennus holds, and the Legion's dock guns that hold them with him.
    p: { type: 'post', flag: 'guns1', order: 'guns' },
    r: { type: 'post', flag: 'guns2', order: 'guns' },
    u: { type: 'post', flag: 'turn', order: 'fight', room: 'wave2' },
    Q: { type: 'dockgun', flag: 'guns1' },
    j: { type: 'dockgun', flag: 'guns2' },
    A: {
      type: 'hold',
      start: { flag: 'guns1' },
      flag: 'hold1',
      argo: [0, 0.4],
      time: 40,
      w: 23,
      d: 13,
      room: 'wave1',
      drops: [
        { enemy: 'ramling', n: 2 },
        { enemy: 'trooper', n: 1, variant: 'gold' },
        { enemy: 'harpy', n: 1 },
        { enemy: 'trooper', n: 2, variant: 'gold' },
        { enemy: 'ramling', n: 2 },
      ],
    },
    B: {
      type: 'hold',
      start: { flag: 'guns2' },
      flag: 'hold2',
      argo: [0.4, 0.8],
      time: 50,
      w: 27,
      d: 13,
      room: 'wave2',
      drops: [
        { enemy: 'trooper', n: 2, variant: 'gold' },
        { enemy: 'ramling', n: 2 },
        { enemy: 'bulwark', n: 1, variant: 'gold' },
        { enemy: 'harpy', n: 1 },
        { enemy: 'trooper', n: 3, variant: 'gold' },
        { enemy: 'mortar', n: 1, variant: 'gold' },
        { enemy: 'ramling', n: 2 },
      ],
    },
    // General Brennus's puzzles.
    '%': { type: 'cracked' },
    l: { type: 'legionbot', flag: 'march' },
    N: { type: 'post', flag: 'march', order: 'plate' },
    O: { type: 'plate', flag: 'plate' },
    L: { type: 'door', id: 'plategate', open: { flag: 'plate' } },
    // The vault: Aeëtes's lockbox, cracked with Brennus's old Legion wrist computer.
    t: { type: 'terminal', flag: 'vault', length: 5, puzzle: 'lights' },
    V: { type: 'door', id: 'vaultdoor', open: { flag: 'vault' } },
    I: { type: 'prize', id: 'vault', reward: 'heart' },
    C: { type: 'canister', id: 'hc' },
    // Gardener light-stones.
    S: { type: 'shard', id: 's1' },
    T: { type: 'shard', id: 's2' },
    U: { type: 'shard', id: 's3' },
    // Aeëtes's machines.
    e: { type: 'enemy', enemy: 'trooper', variant: 'gold' },
    R: { type: 'enemy', enemy: 'ramling' },
    d: { type: 'enemy', enemy: 'harpy' },
    F: { type: 'enemy', enemy: 'bulwark', variant: 'gold' },
    D: { type: 'enemy', enemy: 'mortar', variant: 'gold' },
    // Signs.
    Z: { type: 'sign', text: 'RAMLINGS! Aeëtes’s little gold rams paw the ground, then charge head first. Hold up your SHIELD and they bonk their silly heads. Then hit them while they’re dizzy!' },
    m: { type: 'sign', text: 'Aeëtes cracked the stone to block the bridge. HOLD the CANNON for a BIG BLAST, or CHARGE into it.' },
    n: { type: 'sign', text: 'Too far to jump! CHARGE (the DASH button), then JUMP while you charge: a CHARGE-LEAP.' },
    a: { type: 'sign', text: 'The bar at the top is the ARGO coming in. Wake the dock guns at the COMMAND POST, then hold the dock by the beacon. The Argo only flies at full speed while the dock is clear of Aeëtes’s robots!' },
    y: { type: 'sign', text: 'A crate barricade! CHARGE straight through it.' },
    v: { type: 'sign', text: 'Gold troopers shoot down this walkway. HOLD the SHIELD and march: every shot bounces off.' },
    s: { type: 'sign', text: 'The gate to the east only opens while something heavy stands on its plate. One of your old robots is standing about doing nothing. Give it an order!' },
    g: { type: 'sign', text: 'Aeëtes’s lockbox. Your old Legion wrist computer can crack it.' },
    i: { type: 'sign', text: 'The last line before the Sky Gate. Wake the guns, hold the beacon, and the Argo will be nearly here.' },
    c: { type: 'sign', text: 'Aeëtes drops your old Legion robots here, painted gold. Use this COMMAND POST and they’ll fight for you instead!' },
    w: { type: 'sign', text: 'The Golden Ram charges like a bull. SHIELD its horns, CHARGE it into a stone pillar, then BLAST its open engine!' },
    // Decor.
    '|': { type: 'decor', kind: 'pillar' },
    ']': { type: 'decor', kind: 'lamp' },
    '[': { type: 'decor', kind: 'banner' },
    '{': { type: 'decor', kind: 'wreck', scale: 1.2, rot: 0.5 },
  },
  objectives: [
    { until: { flag: 'outer' }, text: 'Smash the cracked wall and cross to the Outer Dock', at: 'crack' },
    { until: { flag: 'guns1' }, text: 'Wake the Legion dock guns at the command post', at: 'post1' },
    { until: { flag: 'hold1' }, text: 'Hold the Outer Dock by the beacon until the Argo gets closer', at: 'beacon1' },
    { until: { flag: 'bridge' }, text: 'Charge through the barricade and march up the walkway behind your shield', at: 'walk' },
    { until: { flag: 'guns2' }, text: 'Wake the dock guns on the Great Bridge', at: 'post2' },
    { until: { flag: 'hold2' }, text: 'Hold the Great Bridge until the Argo is nearly here', at: 'beacon2' },
    { until: { boss: true }, text: 'Stop the Golden Ram before it shuts the Sky Gate', at: 'boss' },
    { until: { flag: 'never' }, text: 'Board your lifeboat behind the arch and follow the Argo', at: 'exit' },
  ],
  stories: {
    // Before the flyover: Brennus and his Legion on the sky-dock, the gold fleet on the horizon.
    opening: [
      {
        panel: 'ch3-stand',
        caption: 'High above Colchis, an old stone dock floats in the clouds. Its great arch is the only way down to the Gardeners’ garden.',
        lines: [
          { who: 'brennus', text: 'Colchis’s sky-dock. The Gardeners built it to welcome their friends. Today it welcomes the Argo.' },
          { who: 'halcyon', text: 'General, Aeëtes’s whole gold fleet is on its way to shut that arch. The Argo needs a few minutes to get through.' },
          { who: 'brennus', text: 'Then she shall have them. Legion! Guns on the bridges. Nobody touches that arch.' },
          { who: 'celestia', text: '...brave... ...friend...' },
          { who: 'brennus', text: 'Hmph. Yes, little sprout. One last stand. And then I would very much like a cup of tea.' },
        ],
      },
    ],
    // After the Golden Ram: the Argo slips through the arch, and Brennus salutes.
    salute: [
      {
        panel: 'ch3-salute',
        caption: 'Low over the dock, white and gold, the Argo slipped through the great arch.',
        lines: [
          { who: 'captain', text: 'Argo to the sky-dock! We are through the gate! Brennus... thank you.' },
          { who: 'jason', text: 'Look! He’s saluting! General, you were AMAZING!' },
          { who: 'brennus', text: 'A few dents. Nothing a cup of tea won’t fix. Now go and find that Fleece, Argonauts.' },
        ],
      },
    ],
  },
  dialogues: {
    'shard:s1': [
      { who: 'brennus', text: 'A Gardener light-stone, on an islet in the clouds. The sprout is glowing back at it. Sky blue, then white... “sky”, I suppose.' },
    ],
    'shard:s2': [
      { who: 'brennus', text: 'Another one, out on the ledge. Green, then gold, warm as a hand on your shoulder. I think it means “friend”.' },
    ],
    'shard:s3': [
      { who: 'brennus', text: 'Aeëtes walled this one in. It shines gold and purple, slow and steady. Even an old soldier can read this one: “stand”.' },
    ],
    intro: [
      { who: 'brennus', text: 'Yes, yes. I told everyone I was flying home. I lied. A little.' },
      { who: 'aeetes', text: 'General Brennus! AGAIN! Don’t you ever retire?' },
      { who: 'brennus', text: 'I tried. Gardening, tea, a nice comfortable brig. Then you came along.' },
      { who: 'aeetes', text: 'My fleet will shut that arch long before your little Argo gets here. Ships! Drop the troops!' },
      { who: 'brennus', text: 'Legion, with me. We hold the dock until the Argo is through.' },
    ],
    log: [
      { who: 'captain', text: 'Brennus, it’s Argus. I’m beaming this to the dock’s old beacon in case your radio is off again.' },
      { who: 'captain', text: 'The Argo is coming in low, under Aeëtes’s fleet. Every line you hold brings her closer. Keep the beacons green.' },
      { who: 'captain', text: 'And Brennus... come back in one piece. That’s an order. Well. A request.' },
    ],
    outer: [
      { who: 'aeetes', text: 'You can’t hold a whole dock with a few rusty robots, old man!' },
      { who: 'brennus', text: 'Watch me. Command post first: those dock guns have been asleep long enough.' },
    ],
    terrace: [
      { who: 'halcyon', text: 'The Argo is getting closer, General! Two more lines to hold.' },
      { who: 'brennus', text: 'One at a time, HALCYON. One at a time.' },
    ],
    bridge: [
      { who: 'aeetes', text: 'Fine! Have some of YOUR old robots back. I painted them gold. They work for ME now!' },
      { who: 'brennus', text: 'Robots painted gold are still my robots, Aeëtes. They remember my voice.' },
    ],
    plaza: [
      { who: 'halcyon', text: 'General, something huge just landed by the arch. It has... horns?' },
      { who: 'brennus', text: 'Of course it does. Shop first, then horns.' },
    ],
    boss: [
      { who: 'aeetes', text: 'Meet my GOLDEN RAM! Solid gold, and it butts like a battleship. Butt him off my dock, Ram!' },
      { who: 'brennus', text: 'A big golden sheep. Aeëtes, you have more money than sense.' },
      { who: 'brennus', text: 'Come on then, woolly. Let us see whose head is harder.' },
    ],
    bossDown: [
      { who: 'aeetes', text: 'My Ram! It’s... lying down?! Get UP, you overpriced lawn ornament!' },
      { who: 'brennus', text: 'It is having a little nap. Engines need a rest, Aeëtes. So do old generals.' },
      { who: 'halcyon', text: 'General! The Argo is right behind you. Coming through the arch... NOW!' },
    ],
  },
};
