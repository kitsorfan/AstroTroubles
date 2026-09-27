import type { DeckDef } from '../../types';

export const bridge: DeckDef = {
  id: 'bridge',
  index: 6,
  name: 'The Bridge',
  tagline: 'The Bloom has taken the helm.',
  tier: 6,
  arrival: 'bridge_arrival',
  theme: {
    floor: '#161b33',
    floorAlt: '#12162b',
    wall: '#34406e',
    wallTop: '#7f8fe0',
    accent: '#ff6fcf',
    glow: '#ffc6ef',
    bg: '#04050d',
  },
  map: `
################################
#==============================#
#%%%%...!!!!!!!!!!!!!!!!...%%%%#
#%%..........................%%#
#%.............Z..............%#
#%%..........................%%#
#%%%%%%..................%%%%%%#
#%%%%%%%%%%%%%....%%%%%%%%%%%%%#
###############B################
#=+=+=+=+=#....s.....#$$.....$$#
#.........#..%.w..%..#[.......[#
#..P......#..........#[...6...[#
#.........#.%......%.#.........#
#.........D..........K.........#
#!!.....l.#..|....|..#!!..m..!!#
#.........#....b.....#.........#
#$$.....$$#.n........#$$.....$$#
#=+=+=+=+=#..%....%..#[[.....[[#
###############D################
#..............................#
#.$$....o...................$$.#
#......H.......................#
#.....................k........#
#..........e...................#
#..............@...............#
#............+++++.............#
################################
`,
  legend: {
    Z: {
      kind: 'enemy',
      id: 'heart',
      enemies: ['heart'],
      boss: true,
      finale: true,
      canFlee: false,
      intro: 'bridge_heart_intro',
      onWin: [
        { type: 'flag', key: 'bridge:boss' },
        { type: 'dialogue', id: 'bridge_victory' },
      ],
    },
    s: { kind: 'enemy', id: 'gate_sentinels', enemies: ['sentinel', 'sentinel'] },
    w: { kind: 'trigger', id: 'final_warning', dialogue: 'bridge_warning' },
    b: { kind: 'enemy', id: 'hall_pack', enemies: ['brute', 'swarm', 'swarm'] },
    n: { kind: 'pickup', id: 'log2', give: [{ type: 'log', id: 'log_bridge_2' }] },
    P: { kind: 'object', id: 'pods', sprite: 'escape_pod', dialogue: 'bridge_pods', name: 'Escape Pod Console' },
    l: { kind: 'pickup', id: 'log3', give: [{ type: 'log', id: 'log_bridge_3' }] },
    '6': { kind: 'pickup', id: 'mem6', give: [{ type: 'memory', id: 'mem6' }] },
    m: { kind: 'pickup', id: 'modchip', give: [{ type: 'modChip' }], hidden: true },
    K: { kind: 'door', id: 'captain_door', lock: { type: 'keycard', item: 'keycard_captain' } },
    o: { kind: 'pickup', id: 'log1', give: [{ type: 'log', id: 'log_bridge_1' }] },
    k: { kind: 'pickup', id: 'kit', give: [{ type: 'item', id: 'repair_kit', qty: 2 }] },
    e: { kind: 'enemy', id: 'foyer_brute', enemies: ['brute', 'sentinel'] },
  },
  objectives: [
    { until: { flag: 'bridge:boss' }, text: 'Cut through to the command deck and face the Bloom Heart' },
    { until: { flag: 'never' }, text: 'Correct the Leviathan\'s course' },
  ],
};
