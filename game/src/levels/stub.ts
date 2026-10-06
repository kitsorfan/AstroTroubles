import type { Ability, BossKind, DeckId, LevelDef } from '../world/levelTypes';

/**
 * A tiny placeholder region with every piece the checks expect (spawn, log, boss, exit, three
 * shards, two cocoons, a canister and a vault). Used only while a region's real map is being built.
 */
export function stubLevel(opts: { id: DeckId; index: number; name: string; boss: BossKind; ability?: Ability; finale?: boolean }): LevelDef {
  const gate = opts.ability ? 'E' : '.';
  return {
    id: opts.id,
    index: opts.index,
    name: opts.name,
    subtitle: 'Under construction',
    music: opts.id,
    intro: 'intro',
    boss: opts.boss,
    shardIds: ['s1', 's2', 's3'],
    colonistIds: ['c1', 'c2'],
    map: `
#########
#...W...#
#.......#
####B####
#.......#
#.${opts.finale ? '.' : 'L'}.C.V.#
#.?.!.*.#
#.Q...R.#
#.+.H.${opts.ability ? 'U' : '.'}.#
####${gate}####
#..k.Z.I#
#...@...#
#########
`,
    legend: {
      W: { type: 'boss', boss: opts.boss, room: 'arena' },
      B: { type: 'door', id: 'bossdoor', open: { flag: opts.ability ? `ability:${opts.ability}` : 'start' } },
      ...(opts.finale ? {} : { L: { type: 'exit' } }),
      C: { type: 'checkpoint', id: 'cp' },
      V: { type: 'vendor' },
      '?': { type: 'shard', id: 's1' },
      '!': { type: 'shard', id: 's2' },
      '*': { type: 'shard', id: 's3' },
      Q: { type: 'cocoon', id: 'c1', name: 'Scientist', line: 'Thank you!' },
      R: { type: 'cocoon', id: 'c2', name: 'Scientist', line: 'Thank you!' },
      '+': { type: 'canister', id: 'heart' },
      H: { type: 'holo', log: 'log' },
      ...(opts.ability ? { U: { type: 'upgrade', ability: opts.ability, id: 'up' }, E: { type: 'door', id: 'gate', open: { all: [] } } } : {}),
      k: { type: 'switch', flag: 'vault' },
      Z: { type: 'door', id: 'secretvault', open: { flag: 'vault' } },
      I: { type: 'prize', id: 'vault', reward: 'bolts' },
    },
    objectives: [{ until: { boss: true }, text: 'Under construction', at: 'boss' }],
    dialogues: {
      intro: [{ who: 'bolt', text: 'Under construction' }],
      log: [{ who: 'bolt', text: 'Under construction' }],
      boss: [{ who: 'bolt', text: 'Under construction' }],
      bossDown: [{ who: 'bolt', text: 'Under construction' }],
      'shard:s1': [{ who: 'bolt', text: 'Under construction' }],
      'shard:s2': [{ who: 'bolt', text: 'Under construction' }],
      'shard:s3': [{ who: 'bolt', text: 'Under construction' }],
    },
  };
}
