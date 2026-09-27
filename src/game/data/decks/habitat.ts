import type { DeckDef } from '../../types';

export const habitat: DeckDef = {
  id: 'habitat',
  index: 4,
  name: 'Habitation Ring',
  tagline: 'A city of ten thousand empty beds.',
  tier: 4,
  arrival: 'habitat_arrival',
  leak: 'Hull breach! Air is venting. Seal the breach at the west end of the main street.',
  theme: {
    floor: '#2a2233',
    floorAlt: '#241d2c',
    wall: '#5a4468',
    wallTop: '#b48ad0',
    accent: '#ff8ad8',
    glow: '#ffd0f2',
    bg: '#0a0610',
  },
  map: `
##################################
#[[__$____[[_#__#!!!!!!!!!!!!!!!!#
#____________D__#____P___________#
#_!!____Q___[#__#_______X________#
#[[______$$__#__#_[[[[[__[[[[[___#
##############__D________________#
#[[[__!!!___$#__#_[[[[[__[[[[[___#
#____________#__#_______d________#
#__4_________K__#_[[[[[__[[[[[__J#
#$___________#__#________________#
#[[__!!__[[__#__#___________e____#
##############__############D#####
#____n__________#^^^^^^^^^^^_^^^^#
#O______s_______#^""""""""""""""^#
####D#####D###__#^"^^"%%%%%%"^^"^#
#______#_____#__#^"^^"%::::%"^^"^#
#____[_#V___V#__#^"""b%::::%""H"^#
#______#_____#__#^"^^"%%%%%%"^^"^#
#u____k#_____#__#^"^^""""""""^^"^#
#[[__[[#__u__#__#^""""""m"""""""^#
#______#_____#a_#^%%%%%%"%%%%%%%^#
##############__#^%%%%%%Z%%%%%%%^#
#$$__!!!!__$$#__########_#########
#____________#__#________________#
#__c_________M__#_!!!___r____!!!_#
#_______!!___#__#________________#
#l___________#_@#________________#
#[[__$$__[[__#++#+++++++E++++++++#
##################################
`,
  legend: {
    Q: {
      kind: 'object',
      id: 'hollis',
      sprite: 'survivor',
      dialogue: 'habitat_hollis',
      name: 'Hollis Grant',
      showIf: { noFlag: 'hollis:done' },
      variant: 'hollis',
    },
    '4': { kind: 'pickup', id: 'mem4', give: [{ type: 'memory', id: 'mem4' }] },
    K: { kind: 'door', id: 'captain_door', lock: { type: 'keycard', item: 'keycard_captain' } },
    P: { kind: 'pickup', id: 'decoy', give: [{ type: 'module', id: 'decoy' }], dialogue: 'habitat_decoy' },
    d: { kind: 'pickup', id: 'log2', give: [{ type: 'log', id: 'log_habitat_2' }] },
    J: {
      kind: 'object',
      id: 'juno',
      sprite: 'survivor',
      dialogue: 'habitat_juno',
      name: 'Juno Park',
      showIf: { noFlag: 'juno:done' },
      variant: 'juno',
    },
    e: { kind: 'enemy', id: 'theater_guard', enemies: ['infected', 'swarm', 'infected'] },
    n: { kind: 'pickup', id: 'log1', give: [{ type: 'log', id: 'log_habitat_1' }] },
    s: { kind: 'enemy', id: 'street_pack', enemies: ['infected', 'crawler'] },
    a: { kind: 'enemy', id: 'avenue_brute', enemies: ['brute'] },
    b: { kind: 'enemy', id: 'park_pack', enemies: ['brute', 'swarm'] },
    m: { kind: 'pickup', id: 'modchip', give: [{ type: 'modChip' }], hidden: true },
    Z: {
      kind: 'enemy',
      id: 'matron',
      enemies: ['matron'],
      boss: true,
      intro: 'habitat_matron_intro',
      outro: 'habitat_matron_outro',
      onWin: [{ type: 'flag', key: 'habitat:boss' }],
    },
    r: { kind: 'object', id: 'junction', sprite: 'relay', dialogue: 'habitat_junction', name: 'Ring Power Junction' },
    E: { kind: 'object', id: 'lift', sprite: 'elevator', dialogue: 'habitat_elevator', name: 'Lift' },
    V: { kind: 'object', id: 'vendor', sprite: 'vendor', dialogue: 'vendor', name: 'Vend-O-Matic' },
    u: { kind: 'pickup', id: 'serum', give: [{ type: 'item', id: 'serum' }] },
    k: { kind: 'pickup', id: 'kit', give: [{ type: 'item', id: 'repair_kit', qty: 2 }] },
    c: { kind: 'pickup', id: 'captain_card', give: [{ type: 'item', id: 'keycard_captain' }] },
    l: { kind: 'pickup', id: 'log3', give: [{ type: 'log', id: 'log_habitat_3' }], hidden: true },
  },
  objectives: [
    { until: { flag: 'habitat:boss' }, text: 'Cross the Ring. The park beyond the holo-theater leads to the power junction' },
    { until: { flag: 'habitat:repaired' }, text: 'Restore the Ring power junction' },
    { until: { flag: 'never' }, text: 'Take the lift up to the Security Deck' },
  ],
};
