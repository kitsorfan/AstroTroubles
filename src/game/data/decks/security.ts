import type { DeckDef } from '../../types';

export const security: DeckDef = {
  id: 'security',
  index: 5,
  name: 'Security Deck',
  tagline: "Chief Dray's machines still follow orders.",
  tier: 5,
  arrival: 'security_arrival',
  leak: 'Atmosphere venting through a blast breach. Seal it in the lift lobby.',
  theme: {
    floor: '#281c1e',
    floorAlt: '#221719',
    wall: '#5a3438',
    wallTop: '#c0565e',
    accent: '#ff5e6a',
    glow: '#ffc2c6',
    bg: '#0c0405',
  },
  map: `
################################
#[[.[[.[[.#+++.E.++++#$$.....$$#
#.........#..........#$...5...$#
#[[.[[.[[.#..!!r!!...#.........#
#.........#..........#!!..m..!!#
#$..k...$$#|........|#.........#
#d.....[[.#....G.....#[..L....[#
#####D#########.##########Y#####
#...................q..........#
##########################D#####
#..#..#..##..........#$$$...$$$#
#..#..#..##.$$....$$.#.........#
#T|#||#||##....a.....#!!.R.o.!!#
#.........#..........#.........#
#.........D..........A.........#
#!!.....!!#.|......|.#$$.....$$#
#c........#....t.....#....N....#
#$$.....$$#.$$....$$.#!!.....!!#
#[[..k..[[#..........#.........#
#$$$...$$$#..........#$$$$$$$$$#
###############D################
#.........#..................V.#
#.[[...[[.#.$$..............$$.#
#....H....#....................#
#.........D....................#
#n.......u#............O.......#
#.[[...[[.#....@...............#
#$$.....$$#...+++..............#
################################
`,
  legend: {
    E: { kind: 'object', id: 'lift', sprite: 'elevator', dialogue: 'security_elevator', name: 'Bridge Lift' },
    r: { kind: 'object', id: 'override', sprite: 'console', dialogue: 'security_override', name: 'Lockdown Override' },
    G: {
      kind: 'enemy',
      id: 'wardog',
      enemies: ['wardog'],
      boss: true,
      intro: 'security_wardog_intro',
      outro: 'security_wardog_outro',
      onWin: [{ type: 'flag', key: 'security:boss' }],
    },
    '5': { kind: 'pickup', id: 'mem5', give: [{ type: 'memory', id: 'mem5' }] },
    m: { kind: 'pickup', id: 'modchip', give: [{ type: 'modChip' }] },
    L: { kind: 'pickup', id: 'log1', give: [{ type: 'log', id: 'log_security_1' }] },
    k: { kind: 'pickup', id: 'kit', give: [{ type: 'item', id: 'repair_kit' }] },
    d: { kind: 'pickup', id: 'dray_card', give: [{ type: 'item', id: 'keycard_dray' }], hidden: true },
    Y: { kind: 'door', id: 'dray_door', lock: { type: 'keycard', item: 'keycard_dray' } },
    q: { kind: 'enemy', id: 'corridor_guard', enemies: ['secbot', 'infected', 'secbot'] },
    T: {
      kind: 'object',
      id: 'tanaka',
      sprite: 'survivor',
      dialogue: 'security_tanaka',
      name: 'Officer Rin Tanaka',
      showIf: { noFlag: 'tanaka:done' },
      variant: 'tanaka',
    },
    c: { kind: 'pickup', id: 'log3', give: [{ type: 'log', id: 'log_security_3' }], hidden: true },
    a: { kind: 'enemy', id: 'hall_bots', enemies: ['secbot', 'secbot'] },
    t: { kind: 'trigger', id: 'hall', dialogue: 'security_hall' },
    A: { kind: 'door', id: 'armory_door', lock: { type: 'keycard', item: 'keycard_armory' } },
    R: { kind: 'pickup', id: 'rifle', give: [{ type: 'weapon', id: 'rifle' }], dialogue: 'security_rifle' },
    o: { kind: 'pickup', id: 'overcharge', give: [{ type: 'module', id: 'overcharge' }] },
    g: { kind: 'pickup', id: 'emp', give: [{ type: 'item', id: 'emp_grenade', qty: 2 }] },
    N: { kind: 'pickup', id: 'log2', give: [{ type: 'log', id: 'log_security_2' }] },
    n: { kind: 'pickup', id: 'nanites', give: [{ type: 'module', id: 'nanites' }], dialogue: 'security_nanites' },
    u: { kind: 'pickup', id: 'serum', give: [{ type: 'item', id: 'serum' }] },
    V: { kind: 'object', id: 'vendor', sprite: 'vendor', dialogue: 'vendor', name: 'Vend-O-Matic' },
  },
  objectives: [
    { until: { item: 'keycard_armory' }, text: 'Find a way into the armory. Someone in the brig (west) may help' },
    { until: { weapon: 'rifle' }, text: 'Open the armory (east of the central hall)' },
    { until: { flag: 'security:boss' }, text: 'Reach the command gate (north)' },
    { until: { flag: 'security:repaired' }, text: 'Override the bridge lockdown' },
    { until: { flag: 'never' }, text: 'Take the lift up to the Bridge' },
  ],
};
