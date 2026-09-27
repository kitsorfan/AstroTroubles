import type { DeckDef } from '../../types';

export const cryo: DeckDef = {
  id: 'cryo',
  index: 1,
  name: 'Cryo Deck',
  tagline: '10,000 sleepers. One of them is awake.',
  tier: 1,
  arrival: 'cryo_intro',
  theme: {
    floor: '#1b2a3a',
    floorAlt: '#172433',
    wall: '#3a5570',
    wallTop: '#6f93b5',
    accent: '#7fd6ff',
    glow: '#bff0ff',
    bg: '#060b12',
  },
  map: `
##############################
#*.*.*.*.*.*#$$....$#........=
#...........#$....b$#.[[..[[.=
#*.*.*.*.*.*#...X...#........=
#.....@.....#$.....$#..l...w.=
#*.*.*.*.*.*#$$..$$$#........=
#...........#.......#.[[..[[.=
#*.*.*.*.*.*#$.....$#........=
######D#########D#######D#####
#.....h......................#
#............................#
####M#########D##########D####
#+++.++++#.........#.........#
#+..t..++#.[[...[[.#*.*.*.*.*#
#+.++.X++#.........#....3....#
#+.++..k+#k...H...s#*.*.p.*.*#
#+..1..++#.........#........n#
#+++.++++#!!.m...!!#*.*.*.*.j#
####D#########################
#.......2.........u..W......c#
#####################D########
           #.................#
           #..!!!..r.....!!..#
           #.................#
           #+++++++E+++++++++#
           ###################
`,
  legend: {
    b: {
      kind: 'object',
      id: 'bolt_broken',
      sprite: 'bolt_broken',
      dialogue: 'cryo_bolt',
      name: 'Broken Drone',
      showIf: { noFlag: 'bolt_joined' },
    },
    h: { kind: 'trigger', id: 'hint_door', dialogue: 'cryo_hint', if: { noFlag: 'bolt_joined' } },
    w: { kind: 'trigger', id: 'window', dialogue: 'cryo_window' },
    t: { kind: 'trigger', id: 'tunnel', dialogue: 'cryo_tunnel' },
    u: { kind: 'trigger', id: 'warden_warn', dialogue: 'cryo_warden_warn' },
    '1': { kind: 'enemy', id: 'tunnel_crawler', enemies: ['crawler'] },
    '2': { kind: 'enemy', id: 'hall_crawlers', enemies: ['crawler', 'crawler'] },
    '3': { kind: 'enemy', id: 'bayb_pack', enemies: ['crawler', 'swarm'] },
    W: {
      kind: 'enemy',
      id: 'warden',
      enemies: ['warden'],
      boss: true,
      intro: 'cryo_warden_intro',
      outro: 'cryo_warden_outro',
      onWin: [{ type: 'flag', key: 'cryo:boss' }],
    },
    r: { kind: 'object', id: 'relay', sprite: 'relay', dialogue: 'cryo_relay', name: 'Lift Power Relay' },
    E: { kind: 'object', id: 'lift', sprite: 'elevator', dialogue: 'cryo_elevator', name: 'Lift' },
    p: { kind: 'object', id: 'mia_pod', sprite: 'pod_mia', dialogue: 'cryo_mia', name: 'Cryo Pod C-117' },
    k: { kind: 'pickup', id: 'kit', give: [{ type: 'item', id: 'repair_kit' }] },
    s: { kind: 'pickup', id: 'shield', give: [{ type: 'module', id: 'shield' }], dialogue: 'cryo_shield' },
    l: { kind: 'pickup', id: 'log1', give: [{ type: 'log', id: 'log_cryo_1' }] },
    m: { kind: 'pickup', id: 'log2', give: [{ type: 'log', id: 'log_cryo_2' }] },
    n: { kind: 'pickup', id: 'log3', give: [{ type: 'log', id: 'log_cryo_3' }], hidden: true },
    j: { kind: 'pickup', id: 'scrap', give: [{ type: 'scrap', qty: 10 }] },
    c: { kind: 'pickup', id: 'alcove', give: [{ type: 'item', id: 'spares' }, { type: 'scrap', qty: 6 }] },
  },
  objectives: [
    { until: { flag: 'bolt_joined' }, text: 'Find a way through the maintenance door' },
    { until: { flag: 'cryo:boss' }, text: 'Reach the lift control room' },
    { until: { flag: 'cryo:repaired' }, text: 'Restart the lift power relay' },
    { until: { flag: 'never' }, text: 'Take the lift up to Hydroponics' },
  ],
};
