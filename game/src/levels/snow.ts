import type { LevelDef } from '../world/levelTypes';

/**
 * Region 3 of Gaia Nova — the Frostpeak Tundra. Slide across a frozen lake, dodge giant snowballs and
 * wade through deep snow, GRAPPLE up an icy cliff, brave the gusts on the blizzard ridge, hop the
 * frozen river, hack the laser fence and the gate of Brennus's prison camp, beat the camp guards and
 * face BOREAS, the yeti-shaped warden, in its ice rink. The dark ice cave hides a captured scientist.
 */
export const snow: LevelDef = {
  id: 'snow',
  index: 9,
  name: 'Frostpeak Tundra',
  subtitle: 'Brennus’s prison camp',
  music: 'snow',
  intro: 'intro',
  boss: 'boreas',
  shardIds: ['s1', 's2', 's3'],
  colonistIds: ['c1', 'c2'],
  map: `
                    #########
                    #t..L..t#
                    #.......#
            ############B############
            #ii...................ii#
            #i.........___.........i#
            #......._________.......#
            #....._____________.....#
            #....____.......____....#
            #...___...........___...#
            #..____...........____..#
            #..___.............___..#
            #..___.............___..#
            #..___......W......___..#
            #..___.............___..#
            #..___.............___..#
            #..____...........____..#
            #...___...........___...#
            #....____.......____....#
            #....._____________.....#
            #......._________.......#
            #..........___..........#
            #ii...................ii#
            ###########...###########
              #J.................J#
              #....o....y....o....#
              #.V...............h.#
              #.........C.........#
              #M.....o.....o.....x#
   #####################E#####################
   #...#...#.....J.....o.....J.........#.....#
   #.x.#.Q.#.o.........................#.oIo.#
   #...#...#......S.........S..........#.....#
   ##.###.###.#........................###N###
   #...........F.....H.........F..v..........#
   #.............................____~~~____.#
   #.M.............Z.......M....._p__~~~__p_.#
   #.............................____~_~____.#
   #x..z.........S.....o.....S...~~~~~_~~~~~.#
   #.............................~~~__p__~~~.#
   #M...o......t......o.o......t.~~~_____~~~.#
   #####################D#####################
   #.u..FF............J...J...R/.....FF....u.#
   #...................>.....................#
   #l........................................#
   #.F.....F..........................F....F.#
   #..........s...................s..........#
   #..T]...g.........................g.......#
   #..t.....o.o.o..........o.o.o........t....#
##############....A.....[|..............t....#
#...i...#....#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#.K.....#..*.#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#...i...#..g.#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
###.#####....#~~~~~__~~~~~~~__~~~~~~~__~~~~~~#
#i......#....#~~~~~_A~~~~~~~_o~~~~~~~_o~~~~~~#
#.g.o.o......#~~~~~__~~~~~~~__~~~~~~~__~~~~~~#
#...i....##.##~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
######.####.##~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#.o........n.#c.........o.o.......s..........#
#....%..o....O...<..g.......C..............t.#
#i.h.....i...#tt.....x...........t....h......#
########################################99999#
   #99999999z999999999999999999z9999999999999#
   #99}9&999999999999999999999999999999999999#
   #99C9999999k99oo99999w99oo99999$99o9999999#
   #9A99999999999999999999^999999999999999999#
 # #9999999c99999c9999c999999c99999c99999c999#
 #111111111
 #1j1111o11
 #111)11111             99
 #11h111111             !9
 #111111111              ######################
 #tt1111111o1o1o1111z1t11#t...........z......t#
 #1111111111111111111111Y#...s................#
 #11qqqqqqqq11qqqqqqqqq11#..qqqqqqqqqqqqqqqq..#
 #11qqqqqqqq11qqqqqqqqq11#..qqqqqqqqqqqqqqqq..#
 #U1111111111111111111111#..qqqqqq....qqqqqq..#
 #11e1111d111111111111111#..qqqqqq.+o.qqqqqq..#
 #................G......#..qqqqqq....qqqqqq..#
 #....g..................#.eqqqqqqqqqqqqqqqq..#
 #......................r#..qqqqqqqqqqqqqqqq..#
 #....................x.......................#
 #...{...........g.............g.......G.....i#
##.........#####################################
##.t(.....~~~~~~?8~~~~~~~~~~~~~~~~~~...........#
##...C..n.~~~~~~8A~~~~~~~~~~~~~~~~~~.t.........#
##........~~~~~~~~~~~~~~~~~~~~~~~~~~.........t.#
##........___o__o______~~~~~~~~~~~~~...........#
##........_________o___~~~.o..~~~~~~.......t...#
##t.......~~~_~~~~~~~__~~~...x~~~~~~..;........#
##~~~~~~~~~~....~~~~~__~~~..n.~~~~~~...........#
##~~~~~~~~~~..n.~~~~~__~~~....~~~~~~..........t#
##~~~~~~~~~~.h..~~~~~__~~~~~~~~~_o__..a........#
##~~~~~~~~~~....~~~~~_____g__o______.....@.....#
##~~~~~~~~~~~~~~~~~~~__________g____...........#
##~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~____........M..#
##~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~...M.......#
##~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~...........#
################################################
`,
  legend: {
    W: { type: 'boss', boss: 'boreas', room: 'arena' },
    B: { type: 'door', id: 'bossdoor', open: { boss: true } },
    L: { type: 'exit' },
    V: { type: 'vendor' },
    C: { type: 'checkpoint', id: 'cp' },
    H: { type: 'holo', log: 'log', who: 'brennus' },
    '?': { type: 'shard', id: 's1' },
    '!': { type: 'shard', id: 's2' },
    '*': { type: 'shard', id: 's3' },
    K: { type: 'cocoon', id: 'c1', name: 'Dr. Galen', line: 'The Colossus! Brennus is building a giant machine with GaScu as its heart!' },
    Q: { type: 'cocoon', id: 'c2', name: 'Engineer Ariadne', line: 'I fixed the camp heaters for Brennus. I made them extra cosy for us prisoners. Ha!' },
    '+': { type: 'canister', id: 'hc' },
    A: { type: 'anchor' },
    // The camp: a laser fence, two hacks for the gate, the guards' yard and the warden's door.
    T: { type: 'terminal', flag: 'fence', length: 5, puzzle: 'lights' },
    R: { type: 'terminal', flag: 'gate', length: 6, puzzle: 'grid' },
    l: { type: 'laser', axis: 'x', length: 40, always: true, off: { flag: 'fence' }, hardened: true },
    D: { type: 'door', id: 'campgate', open: { all: [{ flag: 'fence' }, { flag: 'gate' }] } },
    E: { type: 'door', id: 'yarddoor', open: { clear: 'yard' } },
    O: { type: 'door', id: 'cavedoor', open: { all: [] } },
    // Secret vault: three timed switches on the frozen pond.
    p: { type: 'switch', flag: 'vault', timed: 14, together: true },
    N: { type: 'door', id: 'secretvault', open: { flag: 'vault' } },
    I: { type: 'prize', id: 'vault', reward: 'heart' },
    // Enemies.
    s: { type: 'enemy', enemy: 'sentry', variant: 'snow' },
    S: { type: 'enemy', enemy: 'sentry', variant: 'snow', room: 'yard' },
    Z: { type: 'enemy', enemy: 'brute', variant: 'yeti', room: 'yard' },
    G: { type: 'enemy', enemy: 'brute', variant: 'yeti' },
    g: { type: 'enemy', enemy: 'sporeling', variant: 'snow' },
    z: { type: 'enemy', enemy: 'buzzer', variant: 'snow' },
    u: { type: 'enemy', enemy: 'turret', variant: 'snow' },
    n: { type: 'enemy', enemy: 'snapper', variant: 'snow' },
    // Tundra weather: blizzard gusts on the ridge, rolling snowballs and deep snow drifts.
    k: { type: 'wind', dx: 0, dz: 1, w: 9, d: 5, period: 4.5, offset: 0, strength: 4.5 },
    w: { type: 'wind', dx: 0, dz: 1, w: 9, d: 5, period: 4.5, offset: 1.5, strength: 4.5 },
    $: { type: 'wind', dx: 0, dz: 1, w: 9, d: 5, period: 4.5, offset: 3, strength: 4.5 },
    r: { type: 'boulder', axis: 'x', length: -22, period: 8, offset: 0 },
    U: { type: 'boulder', axis: 'x', length: 22, period: 8, offset: 2.5 },
    Y: { type: 'boulder', axis: 'x', length: -22, period: 8, offset: 5 },
    q: { type: 'quicksand' },
    // Waypoints and story triggers.
    '(': { type: 'marker', id: 'lake' },
    ')': { type: 'marker', id: 'cliff' },
    '[': { type: 'marker', id: 'river' },
    ']': { type: 'marker', id: 'fence' },
    '/': { type: 'marker', id: 'gate' },
    '{': { type: 'trigger', id: 'onslope', event: 'flag:lake', dialogue: 'slope', w: 9, d: 3 },
    '}': { type: 'trigger', id: 'onridge', event: 'flag:ridge', dialogue: 'blizzard', w: 5, d: 5 },
    '|': { type: 'trigger', id: 'atcamp', event: 'flag:river', dialogue: 'camp', w: 31, d: 1 },
    // Signs.
    a: { type: 'sign', text: 'Frozen lake! Ice is slippery: you keep sliding after you let go. Move gently, and stay out of the freezing water!' },
    ';': { type: 'sign', text: 'See the glowing blue rings? Get close, face one and press GRAPPLE to zip straight over to it.' },
    d: { type: 'sign', text: 'Giant snowballs roll across this slope! Watch where they come from, let one roll past, then run.' },
    e: { type: 'sign', text: 'Deep snow! You wade very slowly in it. Keep moving, or you will sink! Look for the firm path.' },
    j: { type: 'sign', text: 'This icy cliff is too tall to jump. Face the glowing ring at the top and press GRAPPLE!' },
    '&': { type: 'sign', text: 'Blizzard ridge! When snow streaks across, a big gust is coming. Hide behind a rock, or SPIN to dig your boots in.' },
    '^': { type: 'sign', text: 'A journal page on that ice pillar! Wait for the wind to calm down, then jump.' },
    '<': { type: 'sign', text: 'The river is freezing cold! Hop across the ice floes, or GRAPPLE from ring to ring.' },
    '>': { type: 'sign', text: 'PRISON CAMP. The gate needs two hacks: the terminal by the west watchtower switches off the laser fence, then the one by the gate unlocks it.' },
    v: { type: 'sign', text: 'SECRET VAULT. GROUND POUND all THREE red switches on the frozen pond within 14 seconds. Careful, the ice is slippery!' },
    y: { type: 'sign', text: 'BOREAS guards the ice rink ahead. Heal up, buy upgrades, and remember: spin to block, blast its back!' },
    // Decor.
    t: { type: 'decor', kind: 'pine' },
    i: { type: 'decor', kind: 'icespike' },
    c: { type: 'decor', kind: 'rock' },
    M: { type: 'decor', kind: 'tent' },
    J: { type: 'decor', kind: 'banner' },
    F: { type: 'decor', kind: 'thorns' },
  },
  objectives: [
    { until: { flag: 'lake' }, text: 'Slide across the frozen lake', at: 'lake' },
    { until: { flag: 'ridge' }, text: 'Climb the snowball slope and GRAPPLE up the icy cliff', at: 'cliff' },
    { until: { flag: 'river' }, text: 'Brave the blizzard ridge and cross the frozen river', at: 'river' },
    { until: { flag: 'fence' }, text: 'Hack the watchtower terminal to switch off the laser fence', at: 'fence' },
    { until: { flag: 'gate' }, text: 'Hack the gate terminal to open the prison camp', at: 'gate' },
    { until: { clear: 'yard' }, text: 'Defeat the camp guards' },
    { until: { boss: true }, text: 'Defeat BOREAS, the camp warden', at: 'boss' },
    { until: { flag: 'never' }, text: 'Fly the shuttle to the Titan Rockies', at: 'exit' },
  ],
  dialogues: {
    intro: [
      { who: 'halcyon', text: 'Frostpeak Tundra. Temperature: VERY cold. Please wear a scarf.' },
      { who: 'jason', text: 'I don’t have a scarf.' },
      { who: 'bolt', text: 'I am a robot. I do not even have a NECK.' },
      { who: 'halcyon', text: 'The prison camp is at the top of the valley. Brennus’s guard robot, BOREAS, patrols it.' },
    ],
    log: [
      { who: 'brennus', text: 'This is General Brennus. Prisoners, listen. You are not being punished. You are being... kept safe.' },
      { who: 'brennus', text: 'Out there, Gaia Nova is wild. Storms. Ice. Things with teeth. In here, everything does as it is told.' },
      { who: 'brennus', text: 'Soon my Colossus will be finished, and nothing on this planet will ever be wild again.' },
    ],
    slope: [
      { who: 'bolt', text: 'Jason, look up! Snowballs! GIANT snowballs! Rolling this way!' },
      { who: 'jason', text: 'Then we time it. Let one roll past, then run.' },
    ],
    blizzard: [
      { who: 'halcyon', text: 'Wind warning! Strong gusts on the ridge. When the snow streaks sideways, hold on tight.' },
      { who: 'bolt', text: 'Hold on to WHAT? I am a very small robot!' },
    ],
    camp: [
      { who: 'halcyon', text: 'There is the prison camp. The gate is locked, and a laser fence guards it.' },
      { who: 'bolt', text: 'Leave the hacking to me. You keep the guards busy!' },
    ],
    boss: [
      { who: 'brennus', text: 'BOREAS, my faithful warden. Put these intruders on ice.' },
      { who: 'bolt', text: 'It is a giant snow-robot! With FISTS!' },
      { who: 'jason', text: 'Spin to block, blast its back. Just like the Warden Bots on the ship.' },
    ],
    bossDown: [
      { who: 'bolt', text: 'BOREAS is down! The cell doors are opening!' },
      { who: 'halcyon', text: 'Every prisoner from the tundra camp is safe. But Dr. Hypatia was not among them.' },
      { who: 'jason', text: 'Then Brennus kept her for himself. We keep going.' },
    ],
    'shard:s1': [
      { who: 'bolt', text: 'A journal page! “I took the Gorgon and flew to the farthest world on the map: Gaia Nova. No rules here. No one to say no.”' },
      { who: 'jason', text: 'He ran away. Like when you’re in trouble and you hide in your room.' },
    ],
    'shard:s2': [
      { who: 'bolt', text: '“Forty winters alone. The robots are my only crew. They never argue. They never laugh, either.”' },
      { who: 'bolt', text: 'That is the saddest thing I have ever read. And I have read a LOT of error logs.' },
    ],
    'shard:s3': [
      { who: 'bolt', text: '“The old seed from the dead world never grew. I need a living one. I need the one they call GaScu.”' },
      { who: 'jason', text: 'So he knew about GaScu all along.' },
    ],
  },
};
