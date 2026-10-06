import type { LevelDef } from '../world/levelTypes';

/**
 * Region 2 of Gaia Nova — the Glass Desert. Sparkling dunes, Brennus's mining rigs and the glowing
 * ruins of GaScu's long-gone people. Wade through the quicksand field by the dig camp, lean into the
 * sandstorm gusts on the ridge and beat the drill-rig guards to open the crashed science shuttle,
 * whose cargo bay holds the GRAPPLE HOOK. Dodge the rolling rocks, zip from ring to ring over the tar
 * canyon, solve the light-lock in the ruins court, zip up to the glyph terrace and face the Dune
 * Driller in its sand pit.
 */
export const desert: LevelDef = {
  id: 'desert',
  index: 8,
  name: 'Glass Desert',
  subtitle: 'The ruins under the sand',
  music: 'desert',
  intro: 'intro',
  boss: 'driller',
  shardIds: ['s1', 's2', 's3'],
  colonistIds: ['c1', 'c2'],
  map: `
################################################
####################2u22222u2###################
####################22o2L2o22###################
####################222222222###################
######################22222#####################
####################222222222###################
###################22222222222##################
##################2222222222222#################
#################222222222222222################
#################222#2222222#222################
################22222222222222222###############
#############6h6222222222222222226x6############
#############6A622222222W222222226A6############
#############666222222222222222226h6############
################22222222222222222###############
#################222#2222222#222################
#################222222222222222################
##################2222222222222#################
###################22222222222##################
####################222222222###################
######################22222#####################
#######################222######################
##############2p22222222222222222p2#############
##############2222V22222222222h2222#############
##############22222o2222C2222o22222#############
##############22x222222222222222x22#############
##############2p22222o22222o22222p2#############
######################44444#####################
######################66666#####################
######################88888#####################
##############A9p9999999999999999p9#############
##############999o99999999g9999o999#############
##############999999o9o9999999p9999#############
#~~~~~~~~P~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~P~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#11p111p111111111111111111111111111p111111######
#1111J11111111qq11199*1111144Q411111j11111#1I1##
#11111111g11111q111A9911g114444111111111m1##D###
#111111oo111p111111111oo11p1111p11111i111111111#
#11t111111qq111111111111C1111111s1l111111111111#
#1x1111111q11111ps111R111111z111111o111k11111x1#
#11111o11111111111111111111111111p1111n11p111h1#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~P~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~P~~~~~~P+~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~P~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#...............u.......F..O..u.......##########
#.......s..........d.Z.........h...x..##x.U.x###
#................r....r.......C.....x.##.....###
#9999p9..................oo...........####K#####
#9!9999.........s.....................Y.......Y#
#99999A.......................v.....e.....M....#
#999999.....s............oo..........Y.......Y.#
#9p9999...........S.z...........S.E.....e.T..3N#
#999999................................Y....e33#
#........########################........#######
#............................x~~~.....o.h#######
#...S...........S.............~~~....y...#######
#..s..................qq...G..~~~........#######
#..........~~~~~~~~...q.......~~~......r.#######
#.G.....S..~~~2?~~~........z..~~~...o....#######
#..........~~~22~~~...........~~~........#######
#...c......~~~~~~~~.....s.....~~~....y.t.#######
#.........qqqqqqqqqq.........S~~~........#######
#.....qq..qqqqqqqqqq.S........~~~.....r..#######
#........oo.......oo.....qq...~~~..z.....#######
#.............w.....n.....q...~~~........#######
#.x......s..S...............x.~~~......c.#######
#.............................~~~........#######
#################################..............#
#........Sp......qq.....qqqq............u...9oX#
#.^...^.......qqqqq.oo.sqqqq...rr...C.......A9o#
#.............qqq.......qqqqz.............&....#
#.......H.....qqq.s.....qqqq................t..#
#.^...........qqq..qqqq..........ooo..........u#
#..................qqqqooo...qq.......=...B...X#
#...@......a...ooo.qqqq...s..qq.............&..#
#..................qqqq......qq..............x.#
#....S......p...........................u..x...#
################################################
`,
  legend: {
    W: { type: 'boss', boss: 'driller', room: 'arena' },
    L: { type: 'exit' },
    V: { type: 'vendor' },
    C: { type: 'checkpoint', id: 'cp' },
    H: { type: 'holo', log: 'log', who: 'hypatia' },
    U: { type: 'upgrade', ability: 'grapple', id: 'grapple' },
    T: { type: 'trigger', id: 'shuttle', dialogue: 'shuttle', event: 'flag:shuttle', w: 9, d: 3 },
    R: { type: 'trigger', id: 'ruins', event: 'flag:ruins', w: 21, d: 3 },
    M: { type: 'marker', id: 'wreck' },
    Z: { type: 'marker', id: 'canyon' },
    A: { type: 'anchor' },
    /* Rings on the sandstone pillars that stick up out of the tar. */
    P: { type: 'anchor', h: 4.5 },
    q: { type: 'quicksand' },
    w: { type: 'wind', dx: 0, dz: -1, w: 9, d: 4, period: 5, strength: 3.5 },
    y: { type: 'wind', dx: -1, dz: 0, w: 8, d: 5, period: 4.5, strength: 4 },
    O: { type: 'boulder', axis: 'z', length: 8, period: 4, offset: 0 },
    F: { type: 'boulder', axis: 'z', length: 8, period: 4, offset: 2 },
    s: { type: 'enemy', enemy: 'sporeling', variant: 'sand' },
    e: { type: 'enemy', enemy: 'sporeling', variant: 'sand', room: 'r1' },
    B: { type: 'enemy', enemy: 'brute', variant: 'sand' },
    E: { type: 'enemy', enemy: 'brute', variant: 'sand', room: 'r1' },
    t: { type: 'enemy', enemy: 'turret', variant: 'sand' },
    z: { type: 'enemy', enemy: 'buzzer', variant: 'sand' },
    n: { type: 'enemy', enemy: 'snapper', variant: 'sand' },
    g: { type: 'enemy', enemy: 'sentry', variant: 'legion' },
    K: { type: 'door', id: 'cargo', open: { clear: 'r1' } },
    D: { type: 'door', id: 'secretvault', open: { flag: 'vault' } },
    I: { type: 'prize', id: 'vault', reward: 'magnet' },
    j: { type: 'rune', group: 'vault', order: 1, color: '#5e9bff' },
    k: { type: 'rune', group: 'vault', order: 2, color: '#ff6fcf' },
    l: { type: 'rune', group: 'vault', order: 3, color: '#ffd166' },
    m: { type: 'rune', group: 'vault', order: 4, color: '#ffffff' },
    '!': { type: 'shard', id: 's1' },
    '?': { type: 'shard', id: 's2' },
    '*': { type: 'shard', id: 's3' },
    '+': { type: 'canister', id: 'gc', h: 4.5 },
    Q: { type: 'cocoon', id: 'c1', name: 'Archaeologist Thales', line: 'Those ruins are a library of light! Brennus wants to dig it all up.' },
    N: { type: 'cocoon', id: 'c2', name: 'Pilot Nike', line: 'My shuttle! Is it okay? ...Never mind. Thank you, kid!' },
    a: { type: 'sign', text: 'QUICKSAND! The soft, swirly sand slows you down, and if you stand still in it for too long, you sink. Keep moving, or jump across!' },
    c: { type: 'sign', text: 'SANDSTORM! When dust streaks start to fly, a gust is coming. Walk against the wind, or SPIN to dig your heels in!' },
    v: { type: 'sign', text: 'Rolling rocks! Listen for the rumble. Wait for a rock to roll past, then run across. Or JUMP right over it!' },
    d: { type: 'sign', text: 'GRAPPLE RINGS! Look at a glowing ring and press GRAPPLE to zip right over to it. Zip from ring to ring to cross the tar!' },
    J: { type: 'sign', text: 'The glyph terrace is way up high. Zip from ring to ring over the tar, all the way to the top!' },
    i: { type: 'sign', text: 'ANCIENT LIGHT-LOCK. Step on the four glowing pads in the right order. The glyphs say: WHITE always shines last. GOLD never shines first. PINK shines right after BLUE.' },
    p: { type: 'decor', kind: 'pillar' },
    Y: { type: 'decor', kind: 'wreck' },
    r: { type: 'decor', kind: 'rock' },
    G: { type: 'decor', kind: 'boulder' },
    S: { type: 'decor', kind: 'cactus' },
    u: { type: 'decor', kind: 'banner' },
    '&': { type: 'decor', kind: 'thorns' },
    '^': { type: 'decor', kind: 'tent' },
  },
  objectives: [
    { until: { flag: 'shuttle' }, text: 'Find the science team’s crashed shuttle', at: 'wreck' },
    { until: { flag: 'ability:grapple' }, text: 'Beat the guards and grab the GRAPPLE HOOK from the cargo bay', at: 'wreck' },
    { until: { flag: 'ruins' }, text: 'Zip across the tar canyon to the ruins', at: 'canyon' },
    { until: { boss: true }, text: 'Cross the ruins and beat the Dune Driller', at: 'boss' },
    { until: { flag: 'never' }, text: 'Fly the shuttle to Frostpeak Tundra', at: 'exit' },
  ],
  dialogues: {
    intro: [
      { who: 'halcyon', text: 'The Glass Desert. Dr. Hypatia’s team set up a dig site here, near the old ruins.' },
      { who: 'bolt', text: 'It is SO bright. Even my lights are squinting.' },
      { who: 'jason', text: 'The scientists’ shuttle should be around here somewhere. Maybe they left something useful behind.' },
    ],
    shuttle: [
      { who: 'bolt', text: 'That is the science team’s shuttle! It crashed... but the cargo hatch is open.' },
      { who: 'jason', text: 'Something in there is glowing. Let’s take a look.' },
    ],
    log: [
      { who: 'hypatia', text: 'Field log, Dr. Hypatia. The ruins under the sand are ancient... and the glyphs on the walls GLOW.' },
      { who: 'hypatia', text: 'Blue, pink, gold. The same colours as GaScu’s light-words. Someone lived here who spoke in light.' },
      { who: 'hypatia', text: 'Brennus’s drills are getting closer. If anyone finds this: the GRAPPLE HOOK is in our shuttle’s cargo bay. Use it.' },
    ],
    boss: [
      { who: 'brennus', text: 'So, the boy from the colony ship. My Dune Driller will bury you in sand, like everything else here.' },
      { who: 'bolt', text: 'It is a drilling machine as long as a river! And it is wrapped in GaScu vines!' },
      { who: 'jason', text: 'Then we unwrap it. Ready, LUX?' },
    ],
    bossDown: [
      { who: 'bolt', text: 'The Driller stopped! And look, the sand fell away from the ruins.' },
      { who: 'halcyon', text: 'The freed scientists say the others were taken north, to a prison camp in the tundra.' },
      { who: 'jason', text: 'Then north we go. The shuttle’s waiting.' },
    ],
    'shard:s1': [
      { who: 'bolt', text: 'Another journal page! “Captain Brennus’s log. I found an ancient seed on a dead world. It can grow on rock, on ice, even on metal.”' },
      { who: 'jason', text: 'A seed that grows on anything... that sounds like GaScu.' },
    ],
    'shard:s2': [
      { who: 'bolt', text: '“The Fleet says the seed is wild and must be left alone. But wild things get hurt. I want to make it STRONG.”' },
      { who: 'jason', text: 'He thinks being strong means nobody can ever hurt you.' },
    ],
    'shard:s3': [
      { who: 'bolt', text: '“They took my ship and my medals. Atalanta, my best student, would not even look at me.”' },
      { who: 'bolt', text: 'Atalanta... our Captain? She was his STUDENT?' },
    ],
  },
};
