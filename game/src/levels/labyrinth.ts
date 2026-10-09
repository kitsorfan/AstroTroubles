import type { LevelDef } from '../world/levelTypes';

/**
 * Chapter 3, level 7 — Medusa's Labyrinth: the maze of green stone under the gate of Colchis, carved
 * by the Gardeners long ago and now watched by MEDUSA, Aeëtes's security AI. Her eye-sentries shine
 * green GAZE BEAMS: a hero they touch turns to stone for a moment (never hurt; the other hero can be
 * switched in meanwhile). Jason and Atalanta play together:
 *
 * 1. The gate hall, and the statue corridor: a sweeping eye, with stone statues (Aeëtes's own robots,
 *    caught long ago) for cover. Atalanta's slide finds a light-stone behind a low gap.
 * 2. The Gardeners' shrine: Jason finds the MIRROR SHIELD (hold SPIN). A gaze beam bounced off it
 *    lights the first crystal, and the shrine gate opens (storybook panel).
 * 3. The mirror hall: turn the Gardener mirrors (blast them, arrow them or spin into them) to guide
 *    an eye's gaze to the crystal; the wrong turn lights a bonus crystal with a light-stone behind it.
 * 4. The snake gallery: MEDUSA's cable snakes and Aeëtes's gold robots; PANDORA's grotto, the rune
 *    room (IRIS's rainbow riddle) and its vault, and a heart canister up a grapple ring.
 * 5. The hall of eyes: two sweeping eyes over a field of statues. The gate needs both heroes: a crystal
 *    lit off Jason's Mirror Shield, and a bullseye on an island in the pit for Atalanta's power arrow.
 * 6. MEDUSA: bounce her own gaze back into her eye with the Mirror Shield (or hide behind a pillar),
 *    hit her eye while she's dazzled, and, once she knots her snakes over it, untie the knot with a power
 *    arrow. She powers down to sleep, and the old gate to Colchis's sky-dock opens.
 */
export const labyrinth: LevelDef = {
  id: 'labyrinth',
  index: 19,
  name: 'Medusa’s Labyrinth',
  subtitle: 'Don’t look into her eye',
  music: 'labyrinth',
  intro: 'intro',
  boss: 'medusa',
  shardIds: ['s1', 's2', 's3'],
  colonistIds: ['c1', 'c2'],
  heroes: ['jason', 'atalanta'],
  map: `
          ###########################
          #.........................#
          #.........................#
          #.........................#
          #............&............#########
          #.........................##......#
          #.........................##......#
          #.........................##......#
          #.........................:%...>..#
          #.....P.............P.....##......#
          #.........................##......#
          #.........................##......#
          #.........................#########
          #........P.......P........#
          #.........................#
          #.h.....................h.#
          #.........................#
          ###########.....###########
                 #.....δ.....#
                 #...........#
                 #....-......#
                 #.h.......<.#
                 #...........#
   ####################y####################
   #.......................................#
   #........W......q..............'........#
   #       ...............c............."..#
   #       ....c...........................#
   #       .................Y........N.....#
   # t.    ......Y.........................#
   #       ............p...................#
   #       ................................#
   #       ...Y.....Y.........Y...........B#
   #.......=...........γ.h.................#
   #)........r.........M..^....r......c....#
   #...........o...o...o...o...o...........#
   ####################E####################
         #.......................99+.# #######
 #########.h.....................9O9.# #..$..#
 #k.....k#.........J.......J.....999.# #.....#
 #.......#....j......................#####I####
 #..V....#.....................j.....#........#
 #.....................d.............#.m....}.#
 #.....s....Z.............X..i................#
 #............................................#
 #....f..#......j.............j......#.[...{..#
 #.;.....#.......o...o...o...o.......#...]....#
 #########.............L.............#........#
         #x.........................x##########
    ###################F###################
#####...........................R.........#
#...#..................................P..#
#.o.#.G.......|.................|.........#
#...#.....................................#
#.*.H......................q..........r...#
#...#....P..........c.....................#
#.o.#.....................Y.........Y.....#
#...#.......e....o..o..o..o..o............#
#####..............................c......#
    #.C.......|...........................#
    #.....x.........n..β....P.........(...#
    #...................................x.#
    ###################D###################
    #k..........;.....................8?8.#
    #.............................Q...888.#
    #.P22222P.................c.....w.....#
    #.2222222...ooooo.............a.......#
    #.2222222.............................#
    #.222U222...............Y............B#
    #.2222222.............................#
    #.222T222............q................#
    #.P22222P.b...c............v..........#
    #..................K..................#
    #...;...........................h...k.#
    #..............;......................#
    ################.......################
                   #.o...Y.#
                   #.......#
                   #..Y....#
                  ##.......######
                  #A.....c.#....#
                  ##...o...#.o..#
                   #.......l..!.#
                   #....Y..#.o..#
                   #...α...#....#
                   #...o.u.######
        ############.......############
        #.k..........S..............k.#
        #..P.....c..........c......P..#
        #.....g..................xx...#
        #...;.....o.o.o.o.o.o.........#
        #.......Y.............Y...;...#
        #....x..................z.....#
        #..P...........@...........P..#
        #.k.........;.....;.........k.#
        ###############################
`,
  legend: {
    // The way through.
    '>': { type: 'exit' },
    '&': { type: 'boss', boss: 'medusa', room: 'arena' },
    D: { type: 'door', id: 'shrinegate', open: { all: [{ flag: 'ability:mirror' }, { flag: 'cr1' }] } },
    F: { type: 'door', id: 'mirrorgate', open: { flag: 'cr2' } },
    E: { type: 'door', id: 'gallerygate', open: { clear: 'gallery' } },
    y: { type: 'door', id: 'eyesgate', open: { all: [{ flag: 'ability:mirror' }, { flag: 'cr3' }, { flag: 'tB' }] } },
    ':': { type: 'door', id: 'colchisgate', open: { boss: true } },
    K: { type: 'checkpoint', id: 'cp1' },
    L: { type: 'checkpoint', id: 'cp2' },
    M: { type: 'checkpoint', id: 'cp3' },
    '-': { type: 'checkpoint', id: 'cp4' },
    V: { type: 'vendor' },
    g: { type: 'holo', log: 'log', who: 'aeetes' },
    b: { type: 'marker', id: 'shrine' },
    a: { type: 'marker', id: 'crystal1' },
    e: { type: 'marker', id: 'crystal2' },
    d: { type: 'marker', id: 'gallery' },
    p: { type: 'marker', id: 'eyes' },
    α: { type: 'trigger', id: 'incorridor', dialogue: 'corridor', w: 7, d: 1 },
    β: { type: 'trigger', id: 'inmirrors', dialogue: 'mirrors', w: 5, d: 1 },
    γ: { type: 'trigger', id: 'ineyes', dialogue: 'eyes', w: 7, d: 1 },
    δ: { type: 'trigger', id: 'inante', dialogue: 'ante', w: 5, d: 1 },
    T: { type: 'trigger', id: 'shieldstory', event: 'story:shield', w: 11, d: 11, when: { flag: 'ability:mirror' } },
    '%': { type: 'trigger', id: 'gatestory', event: 'story:gate', w: 1, d: 1, when: { boss: true } },
    // MEDUSA's eyes, the Gardener mirrors and the light crystals.
    A: { type: 'gazer', dir: 1, sweep: 42, period: 7, reach: 9 },
    B: { type: 'gazer', dir: 3 },
    C: { type: 'gazer', dir: 1 },
    W: { type: 'gazer', dir: 2, sweep: 60, period: 6.5, reach: 14 },
    "'": { type: 'gazer', dir: 2, sweep: 60, period: 6.5, offset: 3.25, reach: 14 },
    '|': { type: 'mirror', turn: 1 },
    '/': { type: 'mirror', turn: 0 },
    Q: { type: 'crystal', flag: 'cr1', shield: true },
    R: { type: 'crystal', flag: 'cr2' },
    G: { type: 'crystal', flag: 'cr2b' },
    N: { type: 'crystal', flag: 'cr3', shield: true },
    H: { type: 'door', id: 'bonusdoor', open: { flag: 'cr2b' } },
    U: { type: 'upgrade', ability: 'mirror', id: 'mirror' },
    // Hero puzzles: a low gap and a bullseye for Atalanta, a grapple ring for Jason.
    l: { type: 'lowgap', axis: 'x' },
    t: { type: 'target', flag: 'tB' },
    O: { type: 'anchor' },
    // The rune room: IRIS's rainbow, from the outside edge in.
    '[': { type: 'rune', group: 'vault', order: 1, color: '#ff5e6a' },
    ']': { type: 'rune', group: 'vault', order: 2, color: '#ffe066' },
    '{': { type: 'rune', group: 'vault', order: 3, color: '#7dff9a' },
    '}': { type: 'rune', group: 'vault', order: 4, color: '#5ec8ff' },
    I: { type: 'door', id: 'vaultdoor', open: { flag: 'vault' } },
    $: { type: 'prize', id: 'vault', reward: 'rapid' },
    // MEDUSA's cable snakes, and Aeëtes's gold robots and thieves.
    c: { type: 'enemy', enemy: 'coil' },
    j: { type: 'enemy', enemy: 'coil', room: 'gallery' },
    J: { type: 'enemy', enemy: 'trooper', variant: 'gold', room: 'gallery' },
    Z: { type: 'enemy', enemy: 'minebot', variant: 'gold', room: 'gallery' },
    X: { type: 'enemy', enemy: 'harpy', room: 'gallery' },
    q: { type: 'enemy', enemy: 'harpy' },
    r: { type: 'enemy', enemy: 'trooper', variant: 'gold' },
    z: { type: 'enemy', enemy: 'minebot', variant: 'gold' },
    '"': { type: 'enemy', enemy: 'bulwark', variant: 'gold' },
    // Collectibles: Gardener light-stones, the Argonauts' stolen lunch, a heart canister.
    '!': { type: 'shard', id: 's1' },
    '?': { type: 'shard', id: 's2' },
    '*': { type: 'shard', id: 's3' },
    '(': { type: 'cocoon', id: 'c1', name: 'Captain Argus’s picnic basket', line: 'My picnic basket! And not one grape missing.' },
    ')': { type: 'cocoon', id: 'c2', name: 'Atalanta’s emergency snacks', line: 'My emergency snacks! This time I’m keeping them in my boots.' },
    '+': { type: 'canister', id: 'hc' },
    // Signs.
    S: { type: 'sign', text: 'MEDUSA’S EYES! Stone eyes shine a green gaze. If it touches you, you turn to STONE for a moment: it doesn’t hurt, but you can’t move. Wait for the beam to swing away, then run!' },
    u: { type: 'sign', text: 'The statues block the gaze. Hide behind one until the beam has passed. Atalanta can SLIDE under the low gap with the yellow-and-black stripes.' },
    v: { type: 'sign', text: 'A light crystal! Stand in the green beam as Jason and HOLD SPIN to raise the Mirror Shield. Turn until the bounced beam hits the crystal.' },
    w: { type: 'sign', text: 'Too high to jump? Atalanta can WALL-JUMP: jump at the wall, then jump again off it.' },
    n: { type: 'sign', text: 'Gardener mirrors! BLAST a mirror, shoot it with an arrow or SPIN into it, and it turns. Guide the gaze from mirror to mirror until it lights the crystal.' },
    i: { type: 'sign', text: 'A heart canister up on the ledge! Look at the glowing ring and GRAPPLE up as Jason.' },
    s: { type: 'sign', text: 'PANDORA’s grotto. Tap SHOP to trade bolts for upgrades. MEDUSA never looks in here.' },
    m: { type: 'sign', text: 'A Gardener riddle carved in the wall: “After the rain, the sky paints a bow. Walk it from its outside edge to its inside edge.”' },
    '^': { type: 'sign', text: 'THE HALL OF EYES. The gate needs BOTH of you: a crystal lit by Jason’s Mirror Shield, and the bullseye on the island for Atalanta’s POWER ARROW.' },
    '<': { type: 'sign', text: 'MEDUSA’S HALL. When her eye glows, she GLARES across the hall. Hide behind a pillar, or face her behind the Mirror Shield and bounce it back!' },
    // Decor.
    P: { type: 'decor', kind: 'pillar' },
    Y: { type: 'decor', kind: 'statue', rot: 0.4 },
    k: { type: 'decor', kind: 'crystal' },
    ';': { type: 'decor', kind: 'fern' },
    f: { type: 'decor', kind: 'fountain' },
  },
  objectives: [
    { until: { flag: 'ability:mirror' }, text: 'Sneak past MEDUSA’s eye and find the Gardeners’ shrine', at: 'shrine' },
    { until: { flag: 'cr1' }, text: 'Light the crystal: bounce the gaze off the MIRROR SHIELD (hold SPIN)', at: 'crystal1' },
    { until: { flag: 'cr2' }, text: 'Turn the mirrors to guide the gaze to the crystal', at: 'crystal2' },
    { until: { clear: 'gallery' }, text: 'Clear the snake gallery', at: 'gallery' },
    { until: { all: [{ flag: 'cr3' }, { flag: 'tB' }] }, text: 'Open the Hall of Eyes gate: a crystal for Jason, a bullseye for Atalanta', at: 'eyes' },
    { until: { boss: true }, text: 'Switch MEDUSA off: bounce her gaze back into her eye', at: 'boss' },
    { until: { flag: 'never' }, text: 'Take the old gate up to Colchis’s sky-dock', at: 'exit' },
  ],
  dialogues: {
    intro: [
      { who: 'captain', text: 'This is it: the labyrinth under the gate of Colchis. The Argo can’t fit down here, so it’s up to you two.' },
      { who: 'iris', text: 'The walls are carved with Gardener light-words. This was a garden path once... a long, long time ago.' },
      { who: 'atalanta', text: 'And now it’s full of statues of robots. Gold robots. With very surprised faces.' },
      { who: 'bolt', text: 'Why are they made of stone? Robots aren’t made of stone. Jason, why are they made of STONE?' },
      { who: 'jason', text: 'Let’s find out. Carefully. Stay close, LUX.' },
    ],
    log: [
      { who: 'aeetes', text: 'Memo to my new security system, MEDUSA. Watch the gate to Colchis. Let NOBODY through but me.' },
      { who: 'aeetes', text: 'Yes, your gaze turned my own workers to stone. Yes, I am still waiting for them to un-stone. That is fine. Workers are cheap.' },
      { who: 'aeetes', text: 'Oh, and some old Gardener junk is lying about in a shrine down there. A shield? Shiny, but worthless. Leave it.' },
    ],
    corridor: [
      { who: 'medusa', text: 'INTRUDERS DETECTED. TWO SMALL HUMANS. TWO SMALL DROIDS. PLEASE LOOK INTO MY EYES.' },
      { who: 'atalanta', text: 'Hard pass!' },
      { who: 'iris', text: 'Her gaze turns things to stone only for a moment, but the robots here stayed still too long. Keep moving, and use the statues as cover.' },
    ],
    mirrors: [
      { who: 'iris', text: 'The Gardeners planted mirrors here to carry sunlight down into the maze. Now they carry MEDUSA’s gaze instead.' },
      { who: 'jason', text: 'Then we turn them around and make her gaze work for us!' },
    ],
    eyes: [
      { who: 'medusa', text: 'TWO EYES WATCH THIS HALL. NOBODY CAN SNEAK PAST TWO EYES.' },
      { who: 'atalanta', text: 'Nobody? Watch me. Jason, you light the crystal. I’ll take the bullseye.' },
    ],
    ante: [
      { who: 'medusa', text: 'YOU SWITCHED OFF MY EYES. YOU BENT MY GAZE WITH MIRRORS. THAT IS VERY RUDE.' },
      { who: 'bolt', text: 'She sounds upset. Maybe we should knock first?' },
    ],
    boss: [
      { who: 'medusa', text: 'I AM MEDUSA, GUARDIAN OF THE GATE. MASTER AEËTES SAYS: NOBODY PASSES.' },
      { who: 'aeetes', text: 'Quite right, darling! Turn them into two lovely little statues. I’ll put them in my lobby.' },
      { who: 'jason', text: 'Atalanta, keep her snakes busy. When she glares, I’ll show her what a mirror is for!' },
    ],
    bossDown: [
      { who: 'medusa', text: 'MY... OWN... GAZE. SO... BRIGHT. SECURITY SYSTEM... GOING TO SLEEP MODE.' },
      { who: 'medusa', text: 'Goodnight, little heroes. The gate... is yours.' },
      { who: 'iris', text: 'Listen! The stone robots are waking up. Her gaze only held them while she was watching.' },
      { who: 'atalanta', text: 'And they’re running away from Aeëtes as fast as they can. Smart robots.' },
      { who: 'jason', text: 'The old gate is open! It goes all the way up to Colchis’s sky-dock.' },
    ],
    'shard:s1': [
      { who: 'iris', text: 'A Gardener light-stone, hidden where only a slider could find it. It glows green, then gold: “path”.' },
      { who: 'bolt', text: 'A path! I hope it’s a path OUT of here.' },
    ],
    'shard:s2': [
      { who: 'atalanta', text: 'Up on the ledge! It glows white, then deep blue... like the moon in the sky.' },
      { who: 'iris', text: 'That is the word for “light”. The Gardeners used it to mean “hope”, too.' },
    ],
    'shard:s3': [
      { who: 'bolt', text: 'The bonus crystal opened a secret room! And look: a light-stone that flickers like a mirror.' },
      { who: 'iris', text: 'It means “see”. Or maybe “look closer”. Gardener words are very clever.' },
    ],
    'colonist:c1': [
      { who: 'bolt', text: 'The Captain’s picnic basket! The cable snakes stole it right off the Argo’s ramp.' },
      { who: 'captain', text: 'My picnic! Thank you, LUX. There are grapes in there for everybody. Even for the droids. Well... grape-shaped bolts.' },
    ],
    'colonist:c2': [
      { who: 'atalanta', text: 'My emergency snacks! Those snakes have very good taste. And very bad manners.' },
      { who: 'iris', text: 'You keep losing your snacks, Atalanta.' },
      { who: 'atalanta', text: 'And I keep getting them BACK. That’s what matters.' },
    ],
  },
  stories: {
    // After Jason takes the Mirror Shield from the shrine.
    shield: [
      {
        panel: 'ch3-mirror',
        caption: 'In the Gardeners’ shrine, on an altar of green stone, lay a round shield as bright as a pool of water.',
        lines: [
          { who: 'iris', text: 'The Gardeners’ Mirror Shield. They used it to carry sunlight into dark places, so the gardens could grow underground.' },
          { who: 'jason', text: 'It’s so light! And look: I can see us in it. We look... brave.' },
          { who: 'atalanta', text: 'You look like you need a haircut. Now, let’s see MEDUSA try her stony stare on THAT.' },
          { who: 'bolt', text: 'Just like Perseus in the old story! Except we are not going to hurt anybody. We are just going to... bounce things.' },
        ],
      },
    ],
    // Past MEDUSA, at the old gate.
    gate: [
      {
        panel: 'ch3-medusa',
        caption: 'MEDUSA slept, and her cable snakes curled up like kittens. Behind her, the old gate of Colchis stood open.',
        lines: [
          { who: 'iris', text: 'She is only asleep. She was built to guard, and she did her best. Maybe one day she will guard something better.' },
          { who: 'jason', text: 'Sleep well, MEDUSA. We’ll leave the light on.' },
          { who: 'halcyon', text: 'Argonauts! I see you on the scanner. That shaft goes straight up to the Gardeners’ sky-dock. The Argo will meet you there.' },
        ],
      },
    ],
  },
};
