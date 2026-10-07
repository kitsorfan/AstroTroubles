import type { LevelDef } from '../world/levelTypes';

/**
 * Region 5 of Gaia Nova — the Thornwood Jungle. Brennus pumps Celestia's pollen into the swamp and the
 * jungle is getting sick. Hop along the boardwalks and sinking logs over the toxic swamp to the
 * first pollen pump, wade through the bog and bounce up the giant mushrooms, find the second pump
 * in the dark root caves, zip across the treetops on grapple rings to the third, and then face the
 * Thorn Hydra in its swamp pool.
 */
export const jungle: LevelDef = {
  id: 'jungle',
  index: 11,
  name: 'Thornwood Jungle',
  subtitle: 'Where the pollen runs wild',
  music: 'jungle',
  intro: 'intro',
  boss: 'hydra',
  shardIds: ['s1', 's2', 's3'],
  colonistIds: ['c1', 'c2'],
  map: `
                   #############
                   #p..w...w..p#
                   #.....L.....#
                   #.e.......e.#
                   ######B######
                    ####...####
                   ###w.....w###
                  ##.p.......p.##
                 #m.....2A2.....m#
                ##.b..,,222,,..b.##
               ##...,,,,,,,,,,,...##
               ##...a,,,~~~,,,a...##
               #.;.,,,~~~~~~~,,,.i.#
              ##...,,,~~~~~~~,,,...##
              ##..22,~~~~~~~~~,22..##
              ##e.A2,~~~~W~~~~,2A.e##
              ##..22,~~~~~~~~~,22..##
              ##...,,,~~~~~~~,,,...##
               #.i.,,,~~~~~~~,,,.;.#
               ##...a,,,~~~,,,a...##
               ##...,,,,,,,,,,,...##
                ##.b..,,222,,..b.##
                 #m.....2A2.....m#
                  ##.y.......y.##
                   ####.....####
                    ###.....###
                      #.....#
               ########.....########
               #d.................d#
               #..h............V...#
               #.........C.........#
               #.e..oo.......oo..e.#
               #c.....d.....d.....c#
#########################G##########################
                      p......p.m     o9999o
                      .....s..b.     9999K9
                      .C....S...     9999Y9
                      ..o.o..|..     9A9999
            /         e.s......t     999^99
                 t66                 99999d
                 6A6                         777p
                 66o                         7A77
                                  /          77P7
 ........                                    o777
 ..p...p.   88t         /
 ........   8A8              o55
 ...oo...   o88              5A5
 .....J..                    55?
 ........
 .e......
 ........
#####Q##############################################
#..%....m#....###########888888888....w...<.w.#....#
#....o.x.#..R.###########8p888n888....r..l....#..I.#
#.....#..#....###########888888888...j......k.Z....#
#m.............m#########888888888..m..g.w....#....#
#..n........s.%.#########888C88888.b.......m..######
#...............12345678#888888888.....q..F....q...#
#..........#....12345678O888888E88....qq......qq...#
###...###.......12345678#888888888..............999#
###...###.:.....#########8oo8888e8.b....qqq...b.9+9#
#....o..H....#..#########888888888..m)..qq..|m..999#
#.....s.....#...#########..........................#
#...#........oo.#########............qq.....qq.....#
#.U.......m.....#########..qq....F..qqq....qq...z..#
#..N...%.################...qqx....................#
#*.......################................&....oo...#
########################################D###########
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~t..C......:..p.~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.p.........h..t~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~v~~,~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~,~~~~~~~~~~~#
#~~~~~~2222~~~~~~~p...........~~~~~~~e22222~~~~~~~~#
#~~~~~~2oo2~~~~~~~.F..dc..cd..~~~~~~~2222o2~~~~~~~~#
#~~~~~~2222,,,,~~~......TM....~~~~~~~222222~~~~~~~~#
#~~~~~~p222,n,,,,,............,,,ff,,222222~~~~~~~~#
#~~~~~~2222,,,,~~~............~~~~~~~222^22~~~~~~~~#
#~~~~~~2oX2,,,,~~~.[..o...o.:.~~~~~~~222222~~~~~~~~#
#~~~~~~2222~~~~~~~...........p~~~~~~~22222p~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~,~~~~~~~~~~~~~~~~~~~~~,~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~f~~~~~~~~~~~v~~~~~~~~~,~~~~~~~~#
#~~~~~~~~~~~~~~v~~~~f~~~~~~~~~~~~~~~~~~~~~f~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~,~~~~~~~~.p.o~~~~~~~~~f~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~,~~~~~~~~..o.~~~~~~~~~,~~~~~~~~#
#...........~~~~~~.(...~~~~~~io..~~~~~~~~~,~~~~~~~~#
#.p....x.e..~~~~~~..n..~~~~~~~~~~~~~~~~~~~,~~~~~~~~#
#...........~~~~~~.....~~~~~~~v~~~~~~~~~.p.....o~~~#
#.......oo..,,o,o,.....~~~~~~~~~~~~~~~~~........~~~#
#...>.......~~~~~~...p.~~~~~~~~~~~~~~~~~....n...~~~#
#...........~~~~~~e...x~~~~~~~~~~~~~~~~~......!.~~~#
#.....@.....~~~~~~~~~~~~~~~~~~~~~~~~~~~~o.......~~~#
#e.w........~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#.........p.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
####################################################
`,
  legend: {
    W: { type: 'boss', boss: 'hydra', room: 'arena' },
    B: { type: 'door', id: 'bossdoor', open: { boss: true } },
    L: { type: 'exit' },
    V: { type: 'vendor' },
    C: { type: 'checkpoint', id: 'cp' },
    A: { type: 'anchor' },
    f: { type: 'faller', h: 0, floor: 'hazard' },
    q: { type: 'quicksand' },
    ';': { type: 'crate', loot: 'heart' },
    // The three pollen pumps and the gates they open.
    T: { type: 'terminal', flag: 'pump1', length: 4, puzzle: 'lights' },
    U: { type: 'terminal', flag: 'pump2', length: 5, puzzle: 'grid' },
    Y: { type: 'terminal', flag: 'pump3', length: 5, puzzle: 'pattern' },
    M: { type: 'marker', id: 'pump1' },
    N: { type: 'marker', id: 'pump2' },
    K: { type: 'marker', id: 'pump3' },
    D: { type: 'door', id: 'boggate', open: { flag: 'pump1' } },
    O: { type: 'door', id: 'cavemouth', open: { all: [] } },
    Q: { type: 'door', id: 'rootgate', open: { flag: 'pump2' } },
    G: { type: 'door', id: 'pumpgate', open: { all: [{ flag: 'pump1' }, { flag: 'pump2' }, { flag: 'pump3' }] } },
    // The flower vault: sun (gold), sky (blue), Celestia (pink), leaves (green).
    g: { type: 'rune', group: 'vault', order: 1, color: '#ffd166' },
    j: { type: 'rune', group: 'vault', order: 2, color: '#5ee0ff' },
    k: { type: 'rune', group: 'vault', order: 3, color: '#ff6fcf' },
    l: { type: 'rune', group: 'vault', order: 4, color: '#7dff9a' },
    Z: { type: 'door', id: 'secretvault', open: { flag: 'vault' } },
    I: { type: 'prize', id: 'vault', reward: 'boltZap' },
    // Enemies.
    s: { type: 'enemy', enemy: 'sporeling', variant: 'jungle' },
    n: { type: 'enemy', enemy: 'snapper', variant: 'jungle' },
    u: { type: 'enemy', enemy: 'turret', variant: 'jungle' },
    r: { type: 'enemy', enemy: 'brute', variant: 'jungle' },
    z: { type: 'enemy', enemy: 'buzzer', variant: 'jungle' },
    v: { type: 'enemy', enemy: 'buzzer', variant: 'jungle', floor: 'hazard' },
    '/': { type: 'enemy', enemy: 'buzzer', variant: 'jungle', floor: 'void', h: 2 },
    /* General Brennus’s robots. */
    F: { type: 'enemy', enemy: 'trooper' },
    ':': { type: 'enemy', enemy: 'minebot' },
    '|': { type: 'enemy', enemy: 'bulwark' },
    '^': { type: 'enemy', enemy: 'mortar' },
    // Signs.
    '>': { type: 'sign', text: 'Welcome to the Thornwood Jungle! The green swamp is toxic, so stay on the wooden planks and the mossy islands.' },
    '(': { type: 'sign', text: 'Mossy logs sink as soon as you step on them. Don’t stop: hop, hop, hop!' },
    '[': { type: 'sign', text: 'POLLEN PUMP! Brennus is pumping Celestia’s pollen into the swamp. Walk up to the terminal and HACK it to switch the pump off.' },
    '&': { type: 'sign', text: 'Bog ahead! The mud slows you down, and if you stand still too long you start to sink. Keep moving!' },
    ')': { type: 'sign', text: 'Giant mushrooms are super bouncy. Jump on one to fly up onto the high ridge!' },
    E: { type: 'sign', text: 'The root caves are pitch dark. Stay close to LUX: his light shows the way to the second pump.' },
    J: { type: 'sign', text: 'Glowing rings hang from the treetops. Face one and press GRAPPLE to zip across, like swinging on a vine!' },
    S: { type: 'sign', text: 'The last pump is up on the tallest tree. Zip up with the GRAPPLE, or bounce up on the mushroom!' },
    '<': { type: 'sign', text: 'VAULT RIDDLE: Step on the flower pads in the order the jungle wakes up. First the sun, then the sky, then Celestia’s favourite colour. The leaves wake up last.' },
    // Story.
    H: { type: 'holo', log: 'log', who: 'brennus' },
    R: { type: 'cocoon', id: 'c1', name: 'Biologist Melissa', line: 'The jungle can heal! Once the pumps stop, it will grow back greener than ever.' },
    P: { type: 'cocoon', id: 'c2', name: 'Chemist Democritus', line: 'I swapped Brennus’s pollen tanks for lemonade. He has NOT noticed yet.' },
    '!': { type: 'shard', id: 's1' },
    '?': { type: 'shard', id: 's2' },
    '*': { type: 'shard', id: 's3' },
    '+': { type: 'canister', id: 'hc' },
    // Decor.
    p: { type: 'decor', kind: 'palm' },
    t: { type: 'decor', kind: 'tree' },
    e: { type: 'decor', kind: 'fern', solid: false },
    i: { type: 'decor', kind: 'bush' },
    m: { type: 'decor', kind: 'mushroom', solid: false, scale: 1.6 },
    y: { type: 'decor', kind: 'bloom', solid: false },
    w: { type: 'decor', kind: 'flowers', solid: false },
    a: { type: 'decor', kind: 'thorns' },
    d: { type: 'decor', kind: 'banner' },
    c: { type: 'decor', kind: 'tank' },
  },
  objectives: [
    { until: { flag: 'pump1' }, text: 'Cross the swamp and shut down pollen pump 1', at: 'pump1' },
    { until: { flag: 'pump2' }, text: 'Shut down pollen pump 2 in the dark root caves', at: 'pump2' },
    { until: { flag: 'pump3' }, text: 'Swing across the treetops and shut down pollen pump 3', at: 'pump3' },
    { until: { boss: true }, text: 'The pumps are off! Stop the Thorn Hydra', at: 'boss' },
    { until: { flag: 'never' }, text: 'Fly the shuttle to Mount Atlantas', at: 'exit' },
  ],
  dialogues: {
    intro: [
      { who: 'halcyon', text: 'The Thornwood Jungle. Pollen levels: off the charts.' },
      { who: 'bolt', text: 'The trees look sick. Grey and droopy. Celestia’s pollen should make things GROW, not wilt.' },
      { who: 'jason', text: 'Brennus is pumping too much of it. He’s hurting the whole jungle.' },
      { who: 'halcyon', text: 'Find the pollen pumps and shut them down. Something big is drinking that pollen... and growing.' },
    ],
    log: [
      { who: 'brennus', text: 'Personal log. The jungle is dying. The pollen was supposed to make my Legion strong. It is making everything sick.' },
      { who: 'brennus', text: 'Hypatia says Celestia cries in its cage at night. I told her plants do not cry.' },
      { who: 'brennus', text: '...I can hear it too.' },
    ],
    boss: [
      { who: 'bolt', text: 'Something is moving in the swamp... three somethings!' },
      { who: 'jason', text: 'A hydra made of thorns. The pollen made it.' },
      { who: 'bolt', text: 'Cut off one head and two grow back! That happens in the old stories!' },
      { who: 'jason', text: 'Then we go for the heart, not the heads.' },
    ],
    bossDown: [
      { who: 'bolt', text: 'The Hydra is crumbling... into flowers!' },
      { who: 'celestia', text: '...thank... you...' },
      { who: 'jason', text: 'Celestia! Hang on. We’re coming to get you.' },
      { who: 'halcyon', text: 'The volcano is just past the jungle. This is it, Jason.' },
    ],
    'shard:s1': [
      { who: 'bolt', text: 'A journal page! “Celestia’s pollen makes my machines unstoppable. But the jungle is getting sick. Was that... me?”' },
      { who: 'jason', text: 'Yes. But it’s not too late to stop.' },
    ],
    'shard:s2': [
      { who: 'bolt', text: '“Hypatia says Celestia cries in its cage. Plants do not cry. ...Do they?”' },
      { who: 'bolt', text: 'Celestia cries in light. I have seen it. It is pink and very, very sad.' },
    ],
    'shard:s3': [
      { who: 'bolt', text: '“Today I found Grandma’s old seed packet in my coat pocket. Tomatoes. Forty years, and I never planted them.”' },
      { who: 'jason', text: 'He still has them. After all this time.' },
    ],
  },
};
