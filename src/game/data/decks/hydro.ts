import type { DeckDef } from '../../types';

export const hydro: DeckDef = {
  id: 'hydro',
  index: 2,
  name: 'Hydroponics',
  tagline: 'The garden grew teeth.',
  tier: 2,
  arrival: 'hydro_arrival',
  leak: 'Spore-choked air is poisoning you. Seal the ruptured scrubber by the lift.',
  theme: {
    floor: '#1d2b1c',
    floorAlt: '#182417',
    wall: '#3c5a36',
    wallTop: '#7fae62',
    accent: '#9dff6a',
    glow: '#d8ffb0',
    bg: '#050b05',
  },
  map: `
################################
#$$.....$$#+++.E..+++#^^%%%%%^^#
#$...q...$#..........#^%%...%%^#
#.........#.+..r...+.#%%..N..%%#
#$...X...$#..........#%...m...%#
#$$....z$$#.::....::.#^^.....^^#
#.........#....V.....#.........#
#####S#########B##########D#####
#..............................#
#####D#########.##########S#####
#....f....#""""""""""#.........#
#.[[...[[.#"^^^""^^^"#$$.....$$#
#.........#"^^^c"^^^"#$...C...$#
#!!..i..!!#""""""""""#.........#
#a......$$#"^^^""^^^"#e$$...$$j#
###########"^^^""^^^"###########
#$$$...$$$#""g"""""""#.........#
#$.......$#"^^^""^^^"#.[[...[[.#
#....X....D"^^^""^^^"D....H....#
#$..w..h.$#""""""""""#.........#
#$$$u.$$$$#^^""""""^^#k.......k#
###############.################
#$$...........""...........%%$$#
#$...........................O$#
#..^^^^....................^^^^#
#..............................#
#..............@...............#
#............+++++.............#
################################
`,
  legend: {
    E: { kind: 'object', id: 'lift', sprite: 'elevator', dialogue: 'hydro_elevator', name: 'Lift' },
    r: { kind: 'object', id: 'pumps', sprite: 'valve', dialogue: 'hydro_pumps', name: 'Grow-Lamp Power Junction' },
    V: {
      kind: 'enemy',
      id: 'vine',
      enemies: ['vine'],
      boss: true,
      intro: 'hydro_vine_intro',
      outro: 'hydro_vine_outro',
      onWin: [{ type: 'flag', key: 'hydro:boss' }],
    },
    q: { kind: 'pickup', id: 'mem2', give: [{ type: 'memory', id: 'mem2' }] },
    z: { kind: 'pickup', id: 'capacitor', give: [{ type: 'module', id: 'capacitor' }], hidden: true },
    N: {
      kind: 'object',
      id: 'nair',
      sprite: 'survivor',
      dialogue: 'hydro_nair',
      name: 'Dr. Priya Nair',
      showIf: { noFlag: 'nair:done' },
      variant: 'nair',
    },
    m: { kind: 'pickup', id: 'modchip', give: [{ type: 'modChip' }], hidden: true },
    f: { kind: 'enemy', id: 'office_guard', enemies: ['swarm', 'crawler'] },
    i: { kind: 'pickup', id: 'hack', give: [{ type: 'module', id: 'hack' }], dialogue: 'hydro_hack' },
    a: { kind: 'pickup', id: 'log1', give: [{ type: 'log', id: 'log_hydro_1' }] },
    c: { kind: 'enemy', id: 'field_crawlers', enemies: ['crawler', 'crawler'] },
    g: { kind: 'enemy', id: 'field_pack', enemies: ['swarm', 'crawler', 'swarm'] },
    C: { kind: 'pickup', id: 'cutter', give: [{ type: 'weapon', id: 'cutter' }], dialogue: 'hydro_cutter' },
    e: { kind: 'pickup', id: 'log2', give: [{ type: 'log', id: 'log_hydro_2' }] },
    j: { kind: 'pickup', id: 'scrap', give: [{ type: 'scrap', qty: 14 }] },
    w: { kind: 'enemy', id: 'compost_infected', enemies: ['infected'] },
    h: { kind: 'pickup', id: 'log3', give: [{ type: 'log', id: 'log_hydro_3' }], hidden: true },
    u: { kind: 'pickup', id: 'serum', give: [{ type: 'item', id: 'serum' }] },
    k: { kind: 'pickup', id: 'kit', give: [{ type: 'item', id: 'repair_kit' }] },
  },
  objectives: [
    { until: { module: 'hack' }, text: "Explore Hydroponics. Try the botanist's office (west)" },
    { until: { weapon: 'cutter' }, text: 'Crack the tool shed (east) and find a cutting tool' },
    { until: { flag: 'hydro:boss' }, text: 'Burn through the growth to the pump station (north)' },
    { until: { flag: 'hydro:repaired' }, text: 'Reroute grow-lamp power to the lift' },
    { until: { flag: 'never' }, text: 'Take the lift up to Engineering' },
  ],
};
