import type { DeckDef } from '../../types';

export const engine: DeckDef = {
  id: 'engine',
  index: 3,
  name: 'Engineering Core',
  tagline: 'Something is feeding on the reactor.',
  tier: 3,
  arrival: 'engine_arrival',
  ventsOffFlag: 'engine:repaired',
  theme: {
    floor: '#2b211a',
    floorAlt: '#241b15',
    wall: '#5e4331',
    wallTop: '#c07a45',
    accent: '#ffb35c',
    glow: '#ffe0a8',
    bg: '#0d0704',
  },
  map: `
################################
#+++++++#..+++.E.+++...#$$...$$#
#+,,,,,,DT.............#$..3..$#
#+,++,++#..............#.......#
#+,+,,P+#..!!..r...!!..#!!...!!#
#+,,,,,+#~~..........~~#m......#
#+++,+++#..............#[.....[#
#+,,,,,+###################S####
#+,+++,+#..............#.......#
#+,+F,,+#.~~~~~~~~~~~~.#$$...$$#
#+,+++,+#..&&&&&&&&&&..#$..c..$#
#+,,X,,+#..&&&&&&&&&&..#$..l..$#
#+++w+++#..&&&&&&&&&&..D..y....#
#+h,,,,+#..----c-----..#$.....$#
#+,+,+,+#..&&&&&&&&&&..#$..H..$#
#+,,,,,+#..&&&&&&&&&&..#$.....$#
#+,+++,+#..&&&&&&&&&&..#$$...$$#
#+,,k,,,M.~~........~~.#.c...c.#
#+++++++#..............#$.....$#
#+++++++#..b.......~~..#$..k..$#
#+++++++#..............#$$$$$$$#
###############D################
#...........................V..#
#.$$..........n.............$$.#
#......~~~.........~~~.........#
#..............................#
#..............@...............#
#............+++++.............#
################################
`,
  legend: {
    E: { kind: 'object', id: 'lift', sprite: 'elevator', dialogue: 'engine_elevator', name: 'Lift' },
    T: {
      kind: 'enemy',
      id: 'titan',
      enemies: ['titan'],
      boss: true,
      intro: 'engine_titan_intro',
      outro: 'engine_titan_outro',
      onWin: [{ type: 'flag', key: 'engine:boss' }],
    },
    r: { kind: 'object', id: 'valve', sprite: 'valve', dialogue: 'engine_coolant', name: 'Coolant Control Valve' },
    '3': { kind: 'pickup', id: 'mem3', give: [{ type: 'memory', id: 'mem3' }] },
    m: { kind: 'pickup', id: 'modchip', give: [{ type: 'modChip' }] },
    P: {
      kind: 'object',
      id: 'haddad',
      sprite: 'survivor',
      dialogue: 'engine_haddad',
      name: 'Sgt. Omar Haddad',
      showIf: { noFlag: 'haddad:done' },
      variant: 'haddad',
    },
    F: { kind: 'pickup', id: 'floodlight', give: [{ type: 'module', id: 'floodlight' }], dialogue: 'engine_floodlight' },
    h: { kind: 'pickup', id: 'log3', give: [{ type: 'log', id: 'log_engine_3' }], hidden: true },
    w: { kind: 'enemy', id: 'tunnel_welders', enemies: ['welder', 'crawler'] },
    k: { kind: 'pickup', id: 'kit', give: [{ type: 'item', id: 'repair_kit' }] },
    c: { kind: 'pickup', id: 'coolant', give: [{ type: 'item', id: 'coolant' }] },
    l: { kind: 'pickup', id: 'log1', give: [{ type: 'log', id: 'log_engine_1' }] },
    n: { kind: 'pickup', id: 'log2', give: [{ type: 'log', id: 'log_engine_2' }] },
    y: { kind: 'enemy', id: 'bay_welders', enemies: ['welder', 'welder'] },
    b: { kind: 'enemy', id: 'hall_guard', enemies: ['secbot', 'crawler'] },
    V: { kind: 'object', id: 'vendor', sprite: 'vendor', dialogue: 'vendor', name: 'Vend-O-Matic' },
  },
  objectives: [
    { until: { flag: 'engine:boss' }, text: 'Find a route to the core control chamber (north)' },
    { until: { flag: 'engine:repaired' }, text: 'Restore the coolant loop at the control valve' },
    { until: { flag: 'never' }, text: 'Take the lift up to the Habitation Ring' },
  ],
};
