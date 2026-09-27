import { kaiMaxHp } from '../src/game/constants';
import { WEAPONS } from '../src/game/data/catalog';
import { ENEMIES } from '../src/game/data/enemies';
import { aliveEnemies, battleReducer, canUseAbility, canUseItem, createBattle, isHackable } from '../src/game/engine/battle';
import { newGameData } from '../src/game/engine/explore';
import type { BattleAction, BattleState, EnemyId, Encounter, GameData, ItemId, ModuleId, WeaponId } from '../src/game/types';

function makeData(opts: {
  level: number;
  weapons: WeaponId[];
  weapon?: WeaponId;
  modules?: ModuleId[];
  inventory?: Partial<Record<ItemId, number>>;
  modChips?: number;
  memories?: number;
}): GameData {
  const d = newGameData();
  d.level = opts.level;
  d.hp = kaiMaxHp(opts.level);
  d.weapons = opts.weapons;
  d.weapon = opts.weapon ?? opts.weapons[opts.weapons.length - 1];
  d.modules = opts.modules ?? ['stun', 'scan', 'shield'];
  d.inventory = opts.inventory ?? {};
  d.modChips = opts.modChips ?? 0;
  d.flags.bolt_joined = 1;
  d.boltHp = 999;
  d.memories = (['mem1', 'mem2', 'mem3', 'mem4', 'mem5', 'mem6'] as const).slice(0, opts.memories ?? 1);
  return d;
}

function enc(enemies: EnemyId[], tier: number, extra: Partial<Encounter> = {}): Encounter {
  return { id: 'test', enemies, tier, returnPos: { x: 0, y: 0 }, ...extra };
}

function start(d: GameData, e: Encounter, seed = 42): BattleState {
  const s = createBattle(d, e, seed);
  s.bolt.hp = s.bolt.maxHp;
  return s;
}

describe('battle mechanics', () => {
  test('thermal weakness deals more damage than a blunt hit', () => {
    const wrench = makeData({ level: 3, weapons: ['wrench'] });
    const cutter = makeData({ level: 3, weapons: ['wrench', 'cutter'] });
    wrench.modChips = 6; // equalize raw power so only the multiplier differs
    const a = battleReducer(start(wrench, enc(['vine'], 2)), { type: 'KAI_ATTACK', target: 1 });
    const b = battleReducer(start(cutter, enc(['vine'], 2)), { type: 'KAI_ATTACK', target: 1 });
    const dmgA = ENEMIES.vine.hp - a.enemies[0].hp;
    const dmgB = ENEMIES.vine.hp - b.enemies[0].hp;
    expect(dmgB).toBeGreaterThan(dmgA * 2);
    expect(b.enemies[0].burn).toBeGreaterThan(0);
  });

  test('the same seed gives the same battle', () => {
    const d = makeData({ level: 2, weapons: ['wrench'] });
    const run = () => {
      let s = start(d, enc(['crawler', 'crawler'], 1), 777);
      for (let i = 0; i < 30 && s.phase !== 'victory' && s.phase !== 'defeat'; i++) {
        const t = aliveEnemies(s)[0]?.uid ?? 1;
        if (s.phase === 'kai') s = battleReducer(s, { type: 'KAI_ATTACK', target: t });
        else if (s.phase === 'bolt') s = battleReducer(s, { type: 'BOLT', ability: 'stun', target: t });
        else s = battleReducer(s, { type: 'ENEMY_ACT' });
      }
      return s.log.map((l) => l.text).join('|');
    };
    expect(run()).toEqual(run());
  });

  test('shield absorbs damage before HP', () => {
    const d = makeData({ level: 2, weapons: ['wrench'] });
    let s = start(d, enc(['warden'], 1, { boss: true }));
    s = battleReducer(s, { type: 'KAI_BRACE' });
    s = battleReducer(s, { type: 'BOLT', ability: 'shield' });
    expect(s.kai.shield).toBeGreaterThan(0);
    const hp = s.kai.hp;
    const shield = s.kai.shield;
    for (let i = 0; i < 5 && s.phase === 'enemy'; i++) s = battleReducer(s, { type: 'ENEMY_ACT' });
    const took = hp - s.kai.hp;
    const absorbed = shield - s.kai.shield;
    expect(took + absorbed).toBeGreaterThanOrEqual(0);
    expect(s.log.some((l) => /shield|BOLT/i.test(l.text))).toBe(true);
  });

  test('hacking the last robot ends the battle', () => {
    const d = makeData({ level: 5, weapons: ['wrench'], modules: ['stun', 'scan', 'shield', 'hack'] });
    let s = start(d, enc(['secbot'], 3));
    expect(isHackable(s.enemies[0])).toBe(true);
    let tries = 0;
    while (s.phase !== 'victory' && tries++ < 10) {
      if (s.phase === 'kai') s = battleReducer(s, { type: 'KAI_BRACE' });
      else if (s.phase === 'bolt') {
        s.bolt.energy = s.bolt.maxEnergy;
        s = battleReducer(s, { type: 'BOLT', ability: canUseAbility(s, 'hack', s.enemies[0].uid) ? 'hack' : 'recharge', target: s.enemies[0].uid });
      } else s = battleReducer(s, { type: 'ENEMY_ACT' });
    }
    expect(s.phase).toBe('victory');
  });

  test('bosses cannot be hacked, but WARDOG loses its shield instead', () => {
    const d = makeData({ level: 8, weapons: ['rifle'], modules: ['stun', 'scan', 'shield', 'hack'] });
    let s = start(d, enc(['wardog'], 5, { boss: true }));
    s = battleReducer(s, { type: 'KAI_BRACE' });
    s = battleReducer(s, { type: 'BOLT', ability: 'hack', target: s.enemies[0].uid });
    expect(s.enemies[0].shieldDown).toBe(3);
    const warden = start(d, enc(['warden'], 1, { boss: true }));
    expect(isHackable(warden.enemies[0])).toBe(false);
  });

  test('the Bloom Heart splits into its exposed phase', () => {
    const d = makeData({ level: 9, weapons: ['rifle'], modChips: 50 });
    let s = start(d, enc(['heart'], 6, { boss: true, finale: true }));
    s.enemies[0].hp = 1;
    s = battleReducer(s, { type: 'KAI_ATTACK', target: s.enemies[0].uid });
    expect(s.enemies[0].id).toBe('heart2');
    expect(s.enemies[0].dead).toBe(false);
    expect(s.phase).not.toBe('victory');
  });

  test('speaking three times to the Heart ends in communion, but attacking it resets progress', () => {
    const d = makeData({ level: 9, weapons: ['rifle'], modules: ['stun', 'scan', 'shield', 'floodlight'], memories: 6 });
    let s = start(d, enc(['heart'], 6, { boss: true, finale: true }));
    expect(s.canCommune).toBe(true);
    const cycle = (kai: BattleAction) => {
      s = battleReducer(s, kai);
      if (s.phase === 'bolt') s = battleReducer(s, { type: 'BOLT', ability: 'speak' });
      for (let i = 0; i < 8 && s.phase === 'enemy'; i++) s = battleReducer(s, { type: 'ENEMY_ACT' });
      if (s.kai.hp < s.kai.maxHp / 2) s.kai.hp = s.kai.maxHp;
    };
    cycle({ type: 'KAI_BRACE' });
    expect(s.commune).toBe(1);
    cycle({ type: 'KAI_ATTACK', target: s.enemies[0].uid });
    expect(s.commune).toBe(1);
    cycle({ type: 'KAI_BRACE' });
    cycle({ type: 'KAI_BRACE' });
    expect(s.phase).toBe('communed');
  });

  test('no communion without every memory', () => {
    const d = makeData({ level: 9, weapons: ['rifle'], modules: ['stun', 'floodlight'], memories: 5 });
    expect(start(d, enc(['heart'], 6, { finale: true })).canCommune).toBe(false);
  });

  test('Kai falling ends the battle in defeat', () => {
    const d = makeData({ level: 1, weapons: ['wrench'] });
    let s = start(d, enc(['brute', 'brute'], 6));
    for (let i = 0; i < 200 && s.phase !== 'defeat'; i++) {
      if (s.phase === 'kai') s = battleReducer(s, { type: 'KAI_ATTACK', target: aliveEnemies(s)[0].uid });
      else if (s.phase === 'bolt') s = battleReducer(s, { type: 'BOLT', ability: 'recharge' });
      else if (s.phase === 'enemy') s = battleReducer(s, { type: 'ENEMY_ACT' });
      if (s.phase === 'bolt' && !canUseAbility(s, 'recharge')) s = { ...s, phase: 'enemy', enemyCursor: 0 };
    }
    expect(s.phase).toBe('defeat');
  });

  test('items are consumed and invalid actions are ignored', () => {
    const d = makeData({ level: 3, weapons: ['wrench'], inventory: { emp_grenade: 1 } });
    let s = start(d, enc(['secbot', 'secbot'], 2));
    expect(canUseItem(s, 'repair_kit')).toBe(false);
    const same = battleReducer(s, { type: 'KAI_REPAIR' });
    expect(same).toBe(s);
    s = battleReducer(s, { type: 'KAI_ITEM', item: 'emp_grenade' });
    expect(s.inventory.emp_grenade).toBe(0);
    expect(s.enemies.every((e) => e.hp < e.maxHp)).toBe(true);
  });
});

/* ---------------- balance simulation ---------------- */

function bestWeapon(s: BattleState, targetId: EnemyId): WeaponId {
  const def = ENEMIES[targetId];
  let best = s.kai.weapon;
  let bestScore = -Infinity;
  for (const w of s.kai.weapons) {
    const wd = WEAPONS[w];
    const mult = def.weak.includes(wd.dtype) ? 1.5 : def.resist.includes(wd.dtype) ? 0.5 : 1;
    const score = (s.kai.atk + wd.power) * mult;
    if (score > bestScore) {
      bestScore = score;
      best = w;
    }
  }
  return best;
}

function policy(s: BattleState): BattleAction {
  const alive = aliveEnemies(s);
  const boss = alive.find((e) => ENEMIES[e.id].boss);
  const charging = alive.find((e) => e.charging);
  const weakest = [...alive].sort((a, b) => a.hp - b.hp)[0];
  if (s.phase === 'kai') {
    if (s.kai.hp < s.kai.maxHp * 0.4 && canUseItem(s, 'repair_kit')) return { type: 'KAI_REPAIR' };
    if (s.bolt.ko && canUseItem(s, 'spares')) return { type: 'KAI_ITEM', item: 'spares' };
    if (charging && canUseItem(s, 'coolant')) return { type: 'KAI_ITEM', item: 'coolant', target: charging.uid };
    if (boss?.id === 'titan' && canUseItem(s, 'coolant')) return { type: 'KAI_ITEM', item: 'coolant', target: boss.uid };
    if (alive.length >= 2 && canUseItem(s, 'incendiary')) return { type: 'KAI_ITEM', item: 'incendiary' };
    if (alive.some((e) => ENEMIES[e.id].tags.includes('robot')) && canUseItem(s, 'emp_grenade')) return { type: 'KAI_ITEM', item: 'emp_grenade' };
    const target = alive.length > 1 ? (alive.find((e) => !ENEMIES[e.id].boss) ?? weakest) : weakest;
    const w = bestWeapon(s, target.id);
    if (w !== s.kai.weapon) return { type: 'KAI_SWAP', weapon: w };
    if (charging && !s.bolt.active) return { type: 'KAI_BRACE' };
    return { type: 'KAI_ATTACK', target: target.uid };
  }
  const main = boss ?? weakest;
  if (charging && canUseAbility(s, 'shield')) return { type: 'BOLT', ability: 'shield' };
  if (s.kai.hp < s.kai.maxHp * 0.45 && canUseAbility(s, 'repair')) return { type: 'BOLT', ability: 'repair' };
  const shieldedBoss = alive.find((e) => ENEMIES[e.id].shielded && e.shieldDown <= 0);
  if (shieldedBoss && canUseAbility(s, 'hack', shieldedBoss.uid)) return { type: 'BOLT', ability: 'hack', target: shieldedBoss.uid };
  const robot = alive.find((e) => isHackable(e) && !ENEMIES[e.id].shielded);
  if (robot && alive.length > 1 && canUseAbility(s, 'hack', robot.uid)) return { type: 'BOLT', ability: 'hack', target: robot.uid };
  if (!main.scanned && canUseAbility(s, 'scan', main.uid)) return { type: 'BOLT', ability: 'scan', target: main.uid };
  if (canUseAbility(s, 'stun', main.uid) && s.bolt.energy >= 3) return { type: 'BOLT', ability: 'stun', target: main.uid };
  if (canUseAbility(s, 'recharge')) return { type: 'BOLT', ability: 'recharge' };
  if (canUseAbility(s, 'stun', main.uid)) return { type: 'BOLT', ability: 'stun', target: main.uid };
  return { type: 'BOLT', ability: 'recharge' };
}

function simulate(d: GameData, e: Encounter, seed: number) {
  let s = createBattle(d, e, seed);
  for (let i = 0; i < 800; i++) {
    if (s.phase === 'victory' || s.phase === 'defeat' || s.phase === 'communed' || s.phase === 'fled') break;
    const action = s.phase === 'enemy' ? ({ type: 'ENEMY_ACT' } as const) : policy(s);
    let next = battleReducer(s, action);
    if (next === s && s.phase === 'bolt') next = { ...s, phase: 'enemy', enemyCursor: 0 };
    if (next === s && s.phase === 'kai') next = battleReducer(s, { type: 'KAI_BRACE' });
    if (action.type === 'KAI_SWAP') next = battleReducer(next, policy(next));
    s = next;
  }
  return { win: s.phase === 'victory', rounds: s.round, hpLeft: s.kai.hp / s.kai.maxHp };
}

const SCENARIOS: { name: string; data: GameData; enc: Encounter; minWin: number; maxWin?: number }[] = [
  { name: 'cryo: tunnel crawler (L1)', data: makeData({ level: 1, weapons: ['wrench'], modules: ['stun', 'scan'] }), enc: enc(['crawler'], 1), minWin: 0.97 },
  { name: 'cryo: hall crawlers (L2)', data: makeData({ level: 2, weapons: ['wrench'], modules: ['stun', 'scan'], inventory: { repair_kit: 1 } }), enc: enc(['crawler', 'crawler'], 1), minWin: 0.9 },
  { name: 'BOSS cryo-warden (L2)', data: makeData({ level: 2, weapons: ['wrench'], inventory: { repair_kit: 2 } }), enc: enc(['warden'], 1, { boss: true }), minWin: 0.75, maxWin: 1 },
  { name: 'hydro: field pack (L3)', data: makeData({ level: 3, weapons: ['wrench', 'cutter'], inventory: { repair_kit: 1 } }), enc: enc(['swarm', 'crawler', 'swarm'], 2), minWin: 0.9 },
  { name: 'hydro: compost infected (L3)', data: makeData({ level: 3, weapons: ['wrench'], inventory: { repair_kit: 1 } }), enc: enc(['infected'], 2), minWin: 0.9 },
  {
    name: 'BOSS vine behemoth (L4)',
    data: makeData({ level: 4, weapons: ['wrench', 'cutter'], modules: ['stun', 'scan', 'shield', 'hack'], inventory: { repair_kit: 3 } }),
    enc: enc(['vine'], 2, { boss: true }),
    minWin: 0.7,
  },
  {
    name: 'engine: tunnel welders (L5)',
    data: makeData({ level: 5, weapons: ['wrench', 'cutter'], modules: ['stun', 'scan', 'shield', 'hack'], inventory: { repair_kit: 2 } }),
    enc: enc(['welder', 'crawler'], 3),
    minWin: 0.9,
  },
  {
    name: 'BOSS slag titan (L5, 4 coolant)',
    data: makeData({
      level: 5,
      weapons: ['wrench', 'cutter'],
      modules: ['stun', 'scan', 'shield', 'hack', 'floodlight'],
      inventory: { repair_kit: 3, coolant: 4 },
      modChips: 1,
    }),
    enc: enc(['titan'], 3, { boss: true }),
    minWin: 0.7,
  },
  {
    name: 'habitat: theater guard (L6)',
    data: makeData({ level: 6, weapons: ['wrench', 'cutter'], modules: ['stun', 'scan', 'shield', 'hack', 'floodlight'], inventory: { repair_kit: 2 }, modChips: 1 }),
    enc: enc(['infected', 'swarm', 'infected'], 4),
    minWin: 0.85,
  },
  {
    name: 'BOSS hive matron (L7)',
    data: makeData({
      level: 7,
      weapons: ['wrench', 'cutter'],
      modules: ['stun', 'scan', 'shield', 'hack', 'floodlight', 'decoy'],
      inventory: { repair_kit: 3, incendiary: 1 },
      modChips: 2,
    }),
    enc: enc(['matron'], 4, { boss: true }),
    minWin: 0.7,
  },
  {
    name: 'security: corridor guard (L8)',
    data: makeData({
      level: 8,
      weapons: ['wrench', 'cutter', 'rifle'],
      modules: ['stun', 'scan', 'shield', 'hack', 'floodlight', 'decoy', 'overcharge'],
      inventory: { repair_kit: 2 },
      modChips: 3,
    }),
    enc: enc(['secbot', 'infected', 'secbot'], 5),
    minWin: 0.85,
  },
  {
    name: 'BOSS wardog (L8)',
    data: makeData({
      level: 8,
      weapons: ['wrench', 'cutter', 'rifle'],
      modules: ['stun', 'scan', 'shield', 'hack', 'floodlight', 'decoy', 'overcharge', 'nanites'],
      inventory: { repair_kit: 3, emp_grenade: 2 },
      modChips: 3,
    }),
    enc: enc(['wardog'], 5, { boss: true }),
    minWin: 0.7,
  },
  {
    name: 'bridge: gate sentinels (L9)',
    data: makeData({
      level: 9,
      weapons: ['wrench', 'cutter', 'rifle'],
      modules: ['stun', 'scan', 'shield', 'hack', 'floodlight', 'decoy', 'overcharge', 'nanites'],
      inventory: { repair_kit: 2 },
      modChips: 4,
    }),
    enc: enc(['sentinel', 'sentinel'], 6),
    minWin: 0.85,
  },
  {
    name: 'BOSS bloom heart (L9)',
    data: makeData({
      level: 9,
      weapons: ['wrench', 'cutter', 'rifle'],
      modules: ['stun', 'scan', 'shield', 'hack', 'floodlight', 'decoy', 'overcharge', 'nanites', 'plating', 'capacitor'],
      inventory: { repair_kit: 4 },
      modChips: 5,
    }),
    enc: enc(['heart'], 6, { boss: true, finale: true }),
    minWin: 0.65,
  },
];

describe('balance', () => {
  const rows: string[] = [];
  afterAll(() => console.log(`scenario | win% | avg rounds | avg hp left\n${rows.join('\n')}`));
  for (const sc of SCENARIOS) {
    test(sc.name, () => {
      const N = 200;
      let wins = 0;
      let rounds = 0;
      let hp = 0;
      for (let i = 0; i < N; i++) {
        const r = simulate(sc.data, sc.enc, 1000 + i * 7919);
        if (r.win) wins += 1;
        rounds += r.rounds;
        hp += r.win ? r.hpLeft : 0;
      }
      const rate = wins / N;
      rows.push(`${sc.name} | ${(rate * 100).toFixed(0)}% | ${(rounds / N).toFixed(1)} | ${((hp / Math.max(1, wins)) * 100).toFixed(0)}%`);
      expect(rate).toBeGreaterThanOrEqual(sc.minWin);
      if (sc.maxWin !== undefined) expect(rate).toBeLessThanOrEqual(sc.maxWin);
    });
  }
});
