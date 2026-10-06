import type { LevelDef } from '../world/levelTypes';

/**
 * Deck 4 — the Habitat Ring, where the colonists live. A loop of streets around an open atrium:
 * houses, a goo canal, the playground with the HOVER PACK, a timed market gate, the park and the
 * school. Glide from the launch tower to King Bloblin's island in the middle.
 */
export const habitat: LevelDef = {
  id: 'habitat',
  index: 4,
  name: 'Habitat Ring',
  subtitle: 'Home sweet (gooey) home',
  music: 'habitat',
  intro: 'intro',
  boss: 'bloblin',
  shardIds: ['s1', 's2', 's3'],
  colonistIds: ['c1', 'c2'],
  map: `
##########################################
#!844.....o.o.o.......#..x..x#+#.........#
#8844.z...............#TR....RY#.......V.#
#..x........e.........#...Rq...#.........#
#.....................#####.####.....C...#
#........u.....C.669A99...........h......#
#...............w6699O9..................#
###X###                            ......############
#......                            ......#......#...#
#......                            ....x.#.a..c.#.I.#
#......                            .t...........D...#
#......                            ..e...#.m..p.#...#
#..e...                            ...z..#......#...#
#......                            .....t############
#o.....       ..............       ......#
#......       .l....C.....l.       t.~~~.#
#o.....       ..............       ..~.~.#
#......       ..............       .s~?~.#
#o..n..       ..............       ..~~~.#
#......    #  ..............       .....t#
#o....d   *#  ......W.......       t...s.#
#......   .#  ..............       ......#
#o.....    #  ..............       ##M####
#......       ..............       ....~~#
#.x....       ..............       .~~.~~#
#......       ..............       ....i.#
#......       .l....L.....l.       .i....#
#......       ..............       ...P.x#
#.r....                            oo.g..#
#....e.                            z...9U#
#......                          ......89#
#......                          Q4b...88#
#......                          44....88#
#......                          .....666#
#......                          ...e.666#
#...l....l....l....l..~~~~~~..l..........#
#....j...x...e........~~oo~~...y.22..44..#
#..............n....e.~~..~~.....22..44..#
#..@..C.H.444...444...~~..~~..C.....b....#
#.........4o4...4K4...~~~~~~.............#
#.......oo444.k.444x..ff~~ff.............#
##########################################
`,
  legend: {
    a: { type: 'rune', group: 'vault', order: 4, color: '#5ee0ff' },
    c: { type: 'rune', group: 'vault', order: 2, color: '#ffd166' },
    m: { type: 'rune', group: 'vault', order: 1, color: '#7dff9a' },
    p: { type: 'rune', group: 'vault', order: 3, color: '#ff6fcf' },
    q: { type: 'sign', text: "Scribbled on the school whiteboard: \"Vault riddle, part one: GREEN is first and BLUE is last.\" The other clue must be written somewhere else on the Ring!" },
    r: { type: 'sign', text: "Scratched on a lamp post: \"Vault riddle, part two: GOLD comes just before PINK.\" The vault is on the far east side of the Ring." },
    D: { type: 'door', id: 'secretvault', open: { flag: 'vault' } },
    I: { type: 'prize', id: 'vault', reward: 'rapid' },
    W: { type: 'boss', boss: 'bloblin', room: 'arena' },
    L: { type: 'exit' },
    V: { type: 'vendor' },
    C: { type: 'checkpoint', id: 'cp' },
    e: { type: 'enemy', enemy: 'sporeling', variant: 'goo' },
    n: { type: 'enemy', enemy: 'snapper' },
    z: { type: 'enemy', enemy: 'buzzer' },
    s: { type: 'enemy', enemy: 'sentry' },
    u: { type: 'enemy', enemy: 'turret' },
    R: { type: 'enemy', enemy: 'sporeling', variant: 'goo', room: 'r1' },
    T: { type: 'terminal', flag: 't1', length: 5, puzzle: 'lights' },
    X: { type: 'door', id: 'westdoor', open: { flag: 't1' } },
    Y: { type: 'door', id: 'cabinet', open: { clear: 'r1' } },
    P: { type: 'switch', flag: 'gate', timed: 6 },
    M: { type: 'door', id: 'gate', open: { flag: 'gate' } },
    U: { type: 'upgrade', ability: 'glide', id: 'hover' },
    f: { type: 'faller', h: 0, floor: 'hazard' },
    j: { type: 'sign', text: 'Welcome to the Habitat Ring! Please do not feed the goo.' },
    y: { type: 'sign', text: 'PLAYGROUND. Bounce pads, climbing towers and a very shiny thing on top of the tallest one!' },
    g: { type: 'sign', text: 'The market gate only stays open for a few seconds after you pound the switch. Ready, set... DASH!' },
    w: { type: 'sign', text: 'The launch tower! Jump off the top and HOLD JUMP to hover all the way to the island in the middle.' },
    O: { type: 'marker', id: 'tower' },
    A: { type: 'trigger', id: 'ontower', event: 'flag:ontower', dialogue: 'tower', w: 4, d: 2, when: { flag: 'ability:glide' } },
    d: { type: 'sign', text: 'Something shiny is floating out there. Is that jump too far... or just far enough?' },
    '?': { type: 'shard', id: 's1' },
    '*': { type: 'shard', id: 's2' },
    '!': { type: 'shard', id: 's3' },
    K: { type: 'cocoon', id: 'c1', name: 'Mayor Livia', line: 'Oh my! The whole Ring owes you a parade!' },
    Q: { type: 'cocoon', id: 'c2', name: 'Teacher Chiron', line: 'Class, this is what a hero looks like. Thank you!' },
    '+': { type: 'canister', id: 'hc' },
    H: { type: 'holo', log: 'log', who: 'rosa' },
    l: { type: 'decor', kind: 'lamp' },
    t: { type: 'decor', kind: 'tree' },
    i: { type: 'decor', kind: 'kiosk' },
    k: { type: 'decor', kind: 'bench' },
  },
  objectives: [
    { until: { flag: 'ability:glide' }, text: 'Find the HOVER PACK in the playground' },
    { until: { flag: 'ontower' }, text: 'Climb the launch tower', at: 'tower' },
    { until: { boss: true }, text: 'Glide to the island in the middle and defeat King Bloblin', at: 'boss' },
    { until: { flag: 'never' }, text: 'Ride the lift up to Security', at: 'exit' },
  ],
  dialogues: {
    intro: [
      { who: 'halcyon', text: 'The Habitat Ring. Two thousand cosy homes, one school, one playground and... a lot of goo.' },
      { who: 'bolt', text: 'Look in the middle! A floating island. And something BIG and wobbly on it.' },
      { who: 'halcyon', text: 'GaScu has hidden the lift on that island. You will need to fly... or at least hover.' },
      { who: 'jason', text: 'The playground always had the best toys. Let’s start there!' },
    ],
    log: [
      { who: 'rosa', text: 'Jason, sweetie, if you wake up before me: don’t panic! It’s Aunt Rosa.' },
      { who: 'rosa', text: 'Something is in the air vents. I’m going up to the Security Deck to protect HALCYON’s computer core.' },
      { who: 'rosa', text: 'Whatever happens, remember what I always say: brave isn’t not being scared. Brave is being scared and going anyway.' },
      { who: 'jason', text: '...Brave is being scared and going anyway. Hang on, Aunt Rosa. I’m coming.' },
      { who: 'bolt', text: 'I am VERY scared and I am still going. Does that count?' },
      { who: 'jason', text: 'That totally counts.' },
    ],
    tower: [
      { who: 'bolt', text: 'Look, the pink light in the middle! That is King Bloblin’s island.' },
      { who: 'bolt', text: 'Run off the edge toward it and HOLD JUMP to hover all the way there.' },
    ],
    boss: [
      { who: 'bolt', text: 'KING BLOBLIN! He is made of goo, and he wobbles when he is angry!' },
      { who: 'halcyon', text: 'Every time you pop a blob, it splits into smaller ones. Pop them ALL! GROUND POUNDS hit extra hard.' },
    ],
    bossDown: [
      { who: 'bolt', text: 'The last little blob went POP! The King is just a puddle now.' },
      { who: 'halcyon', text: 'The lift to the Security Deck is re-re-ready. Bzzt.' },
      { who: 'bolt', text: 'HALCYON? Your voice sounds funny.' },
      { who: 'glitch', text: 'Just a h-h-hiccup. The air vents are full of... pollen. Nothing to w-w-worry about.' },
    ],
    'shard:s1': [
      { who: 'gascu', text: 'The ship-people grow flowers too! Maybe we are the same.' },
    ],
    'shard:s2': [
      { who: 'gascu', text: 'I tried to say hello. I flashed my lights: hello... hello... hello...' },
      { who: 'bolt', text: 'Flashing lights? That is how I talk to other robots!' },
    ],
    'shard:s3': [
      { who: 'gascu', text: 'Nobody understood me. Nobody flashed back.' },
    ],
  },
};
