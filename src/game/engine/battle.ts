import { boltMaxEnergy, boltMaxHp, boltZapPower, kaiAtk, kaiDef, kaiMaxHp } from '../constants';
import { BOLT_ABILITIES, ITEMS, MOD_CHIP_POWER, WEAPONS } from '../data/catalog';
import { ENEMIES, TIER_NAMES, scaledStats } from '../data/enemies';
import type {
  BattleAction,
  BattleEnemy,
  BattleEvent,
  BattleResult,
  BattleState,
  BoltAbility,
  DamageType,
  EnemyDef,
  EnemyId,
  EnemyMove,
  Encounter,
  GameData,
  ItemId,
  LogTone,
  StatusKind,
} from '../types';
import { nextRandom } from './rng';

const MAX_LOG = 40;
export const MAX_ENEMIES = 4;
export const COMMUNE_STEPS = 3;
export const BOLT_TARGET_CHANCE = 0.3;

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type PartyTarget = 'kai' | 'bolt';

interface HitResult {
  dmg: number;
  crit: boolean;
  weak: boolean;
  resist: boolean;
  killed: boolean;
}

/* ---------------- setup ---------------- */

export function createBattle(data: GameData, encounter: Encounter, seed: number): BattleState {
  const level = data.level;
  const boltActive = data.flags.bolt_joined === 1;
  const maxEnergy = boltMaxEnergy(data.modules);
  const s: BattleState = {
    phase: 'kai',
    round: 1,
    rng: seed >>> 0,
    kai: {
      hp: Math.max(1, data.hp),
      maxHp: kaiMaxHp(level),
      atk: kaiAtk(level),
      def: kaiDef(level),
      level,
      weapon: data.weapon,
      weapons: [...data.weapons],
      modChips: data.modChips,
      shield: 0,
      shieldTurns: 0,
      poison: 0,
      poisonDmg: 0,
      burn: 0,
      frozen: 0,
      boost: 0,
      brace: false,
    },
    bolt: {
      active: boltActive,
      hp: boltActive ? Math.max(1, data.boltHp) : 0,
      maxHp: boltMaxHp(level, data.modules),
      energy: maxEnergy,
      maxEnergy,
      ko: false,
      modules: [...data.modules],
      decoy: 0,
      level,
    },
    enemies: [],
    inventory: { ...data.inventory },
    log: [],
    events: [],
    seq: 0,
    enemyCursor: 0,
    canFlee: encounter.canFlee ?? !encounter.boss,
    boss: !!encounter.boss,
    finale: !!encounter.finale,
    canCommune: !!encounter.finale && data.memories.length >= 6 && data.modules.includes('floodlight'),
    commune: 0,
    rewards: { xp: 0, scrap: 0, items: {} },
    nextUid: 1,
    tier: encounter.tier,
    kills: 0,
  };
  for (const id of encounter.enemies) addEnemy(s, id, encounter.tier);
  const first = s.enemies[0];
  if (s.boss && first) log(s, `${first.name} blocks the way!`, 'warn');
  else if (s.enemies.length === 1 && first) log(s, `${first.name} attacks!`, 'warn');
  else log(s, `${s.enemies.length} hostiles close in!`, 'warn');
  if (s.canCommune) log(s, 'BOLT: "Kai... I know the words. Let me SPEAK to it. Just don\'t hurt it while I do."', 'bolt');
  return s;
}

/* ---------------- helpers ---------------- */

function rand(s: BattleState): number {
  const [v, next] = nextRandom(s.rng);
  s.rng = next;
  return v;
}

function log(s: BattleState, text: string, tone: LogTone = 'info') {
  s.seq += 1;
  s.log.push({ id: s.seq, text, tone });
  if (s.log.length > MAX_LOG) s.log.splice(0, s.log.length - MAX_LOG);
}

function emit(s: BattleState, ev: DistributiveOmit<BattleEvent, 'seq'>) {
  s.seq += 1;
  s.events.push({ ...ev, seq: s.seq } as BattleEvent);
}

function cloneState(s: BattleState): BattleState {
  return {
    ...s,
    kai: { ...s.kai, weapons: [...s.kai.weapons] },
    bolt: { ...s.bolt, modules: [...s.bolt.modules] },
    enemies: s.enemies.map((e) => ({ ...e, cooldowns: { ...e.cooldowns } })),
    inventory: { ...s.inventory },
    log: [...s.log],
    events: [],
    rewards: { ...s.rewards, items: { ...s.rewards.items } },
  };
}

export function aliveEnemies(s: BattleState): BattleEnemy[] {
  return s.enemies.filter((e) => !e.dead);
}

export function enemyDef(e: BattleEnemy): EnemyDef {
  return ENEMIES[e.id];
}

export function isBattleOver(s: BattleState): boolean {
  return s.phase === 'victory' || s.phase === 'defeat' || s.phase === 'fled' || s.phase === 'communed';
}

function boltCanAct(s: BattleState): boolean {
  return s.bolt.active && !s.bolt.ko;
}

function targetEnemy(s: BattleState, uid?: number): BattleEnemy | undefined {
  const alive = aliveEnemies(s);
  return alive.find((e) => e.uid === uid) ?? alive[0];
}

function fill(text: string, e: BattleEnemy, target?: string): string {
  return text.replace(/\{e\}/g, e.name).replace(/\{t\}/g, target ?? 'Kai');
}

function partyName(t: PartyTarget): string {
  return t === 'kai' ? 'Kai' : 'BOLT';
}

function hitTags(r: HitResult): string {
  let out = '';
  if (r.crit) out += ' Critical!';
  if (r.weak) out += ' Weak spot!';
  if (r.resist) out += ' Resisted.';
  return out;
}

function nameFor(s: BattleState, id: EnemyId, tier: number): string {
  const def = ENEMIES[id];
  const base = def.boss ? def.name : `${TIER_NAMES[Math.min(tier, TIER_NAMES.length - 1)] ?? ''}${def.name}`;
  const same = s.enemies.filter((e) => e.id === id);
  if (same.length === 0) return base;
  if (same.length === 1 && !/ [A-Z]$/.test(same[0].name)) same[0].name = `${same[0].name} A`;
  return `${base} ${String.fromCharCode(65 + same.length)}`;
}

function addEnemy(s: BattleState, id: EnemyId, tier: number): BattleEnemy | null {
  if (aliveEnemies(s).length >= MAX_ENEMIES) return null;
  const def = ENEMIES[id];
  const st = scaledStats(def, tier);
  const e: BattleEnemy = {
    uid: s.nextUid++,
    id,
    name: nameFor(s, id, tier),
    hp: st.hp,
    maxHp: st.hp,
    atk: st.atk,
    def: st.def,
    tier,
    stun: 0,
    hacked: 0,
    blind: 0,
    burn: 0,
    poison: 0,
    scanned: false,
    charging: null,
    atkBuff: 0,
    shieldDown: 0,
    cooldowns: {},
    dead: false,
    listening: 0,
    fresh: false,
  };
  s.enemies.push(e);
  return e;
}

function killEnemy(s: BattleState, e: BattleEnemy, quiet = false) {
  const def = ENEMIES[e.id];
  if (def.next) {
    const nd = ENEMIES[def.next];
    e.id = def.next;
    e.name = nd.name;
    e.hp = nd.hp;
    e.maxHp = nd.hp;
    e.atk = nd.atk;
    e.def = nd.def;
    e.charging = null;
    e.stun = 0;
    e.burn = 0;
    e.blind = 0;
    e.scanned = false;
    e.cooldowns = {};
    log(s, 'The thorned shell splits apart! The Exposed Heart pulses beneath, raw and blinding.', 'warn');
    emit(s, { kind: 'fx', fx: 'flash', target: { side: 'enemy', uid: e.uid } });
    return;
  }
  e.hp = 0;
  e.dead = true;
  e.charging = null;
  s.kills += 1;
  emit(s, { kind: 'death', target: { side: 'enemy', uid: e.uid } });
  if (!quiet) log(s, `${e.name} is destroyed!`, 'good');
  const st = scaledStats(def, e.tier);
  s.rewards.xp += st.xp;
  const [lo, hi] = def.scrap;
  s.rewards.scrap += Math.round((lo + rand(s) * (hi - lo)) * st.scrapMul);
  for (const d of def.drops ?? []) {
    if (rand(s) < d.chance) s.rewards.items[d.item] = (s.rewards.items[d.item] ?? 0) + 1;
  }
}

function damageEnemy(s: BattleState, e: BattleEnemy, power: number, dtype: DamageType, critChance = 0): HitResult {
  const def = ENEMIES[e.id];
  const weak = def.weak.includes(dtype);
  const resist = !weak && def.resist.includes(dtype);
  const mult = weak ? 1.5 : resist ? 0.5 : 1;
  const crit = critChance > 0 && rand(s) < critChance;
  let raw = power * (0.9 + rand(s) * 0.2) * mult * (crit ? 1.5 : 1);
  if (def.shielded && e.shieldDown <= 0) raw *= 0.4;
  const dmg = Math.max(1, Math.round(raw - e.def));
  e.hp -= dmg;
  emit(s, { kind: 'damage', target: { side: 'enemy', uid: e.uid }, amount: dmg, crit, weak, resist });
  if (s.commune > 0 && s.phase !== 'communed' && (e.id === 'heart' || e.id === 'heart2')) {
    s.commune = 0;
    log(s, 'The Heart recoils from the attack and its light flares red. BOLT: "No, no, no! We were getting through to it!"', 'bad');
  }
  let killed = false;
  if (e.hp <= 0) {
    killed = true;
    killEnemy(s, e);
  }
  return { dmg, crit, weak, resist, killed };
}

function healKai(s: BattleState, fraction: number): number {
  const k = s.kai;
  const amt = Math.min(k.maxHp - k.hp, Math.round(k.maxHp * fraction));
  k.hp += amt;
  emit(s, { kind: 'heal', target: { side: 'kai' }, amount: amt });
  return amt;
}

/* ---------------- end conditions ---------------- */

function checkEnd(s: BattleState): boolean {
  if (isBattleOver(s)) return true;
  if (s.kai.hp <= 0) {
    s.kai.hp = 0;
    s.phase = 'defeat';
    log(s, 'Kai collapses...', 'bad');
    return true;
  }
  const alive = aliveEnemies(s);
  if (alive.length === 0) {
    s.phase = 'victory';
    log(s, 'All hostiles neutralized!', 'good');
    return true;
  }
  if (alive.every((e) => e.hacked > 0)) {
    log(s, 'With nothing left to fight, the hacked robots power down.', 'good');
    for (const e of alive) killEnemy(s, e, true);
    s.phase = 'victory';
    return true;
  }
  return false;
}

function startEnemyPhase(s: BattleState) {
  s.phase = 'enemy';
  s.enemyCursor = 0;
}

function afterKai(s: BattleState) {
  if (checkEnd(s)) return;
  if (boltCanAct(s)) s.phase = 'bolt';
  else startEnemyPhase(s);
}

function afterBolt(s: BattleState) {
  if (checkEnd(s)) return;
  startEnemyPhase(s);
}

function endRound(s: BattleState) {
  const k = s.kai;
  if (k.poison > 0) {
    const dmg = Math.min(k.hp - 1, k.poisonDmg);
    if (dmg > 0) {
      k.hp -= dmg;
      emit(s, { kind: 'damage', target: { side: 'kai' }, amount: dmg });
      log(s, `Spores burn in Kai's lungs: ${dmg} damage.`, 'bad');
    }
    k.poison -= 1;
    if (k.poison === 0) k.poisonDmg = 0;
  }
  if (k.burn > 0) {
    const dmg = Math.min(k.hp - 1, Math.max(3, Math.round(k.maxHp * 0.04)));
    if (dmg > 0) {
      k.hp -= dmg;
      emit(s, { kind: 'damage', target: { side: 'kai' }, amount: dmg });
      log(s, `Kai's suit smolders: ${dmg} damage.`, 'bad');
    }
    k.burn -= 1;
  }
  if (k.shieldTurns > 0) {
    k.shieldTurns -= 1;
    if (k.shieldTurns === 0 && k.shield > 0) {
      k.shield = 0;
      log(s, 'The shield flickers out.', 'info');
    }
  }
  if (k.boost > 0) k.boost -= 1;
  k.brace = false;

  const b = s.bolt;
  if (b.decoy > 0) b.decoy -= 1;
  if (boltCanAct(s)) b.energy = Math.min(b.maxEnergy, b.energy + 1);

  for (const e of s.enemies) {
    if (e.dead) continue;
    e.fresh = false;
    for (const key of Object.keys(e.cooldowns)) {
      if (e.cooldowns[key] > 0) e.cooldowns[key] -= 1;
    }
    if (e.blind > 0) e.blind -= 1;
    if (e.atkBuff > 0) e.atkBuff -= 1;
    if (e.shieldDown > 0) {
      e.shieldDown -= 1;
      if (e.shieldDown === 0) log(s, `${e.name}'s shield matrix comes back online.`, 'warn');
    }
    const def = ENEMIES[e.id];
    if (e.burn > 0) {
      const dmg = 3 + k.level;
      e.burn -= 1;
      e.hp -= dmg;
      emit(s, { kind: 'damage', target: { side: 'enemy', uid: e.uid }, amount: dmg });
      log(s, `${e.name} burns for ${dmg}.`, 'good');
      if (e.hp <= 0) killEnemy(s, e);
    } else if (def.regen && e.hp < e.maxHp && s.phase !== 'communed') {
      const amt = Math.min(e.maxHp - e.hp, Math.round(e.maxHp * def.regen));
      e.hp += amt;
      emit(s, { kind: 'heal', target: { side: 'enemy', uid: e.uid }, amount: amt });
      log(s, `${e.name} regenerates ${amt} HP.`, 'warn');
    }
  }

  s.round += 1;
  s.enemyCursor = 0;
  if (checkEnd(s)) return;
  if (k.frozen > 0) {
    k.frozen -= 1;
    log(s, 'Kai is frozen solid and loses a turn!', 'bad');
    if (boltCanAct(s)) s.phase = 'bolt';
    else startEnemyPhase(s);
  } else {
    s.phase = 'kai';
  }
}

/* ---------------- Kai ---------------- */

function kaiAttack(s: BattleState, uid: number) {
  const e = targetEnemy(s, uid);
  if (!e) return;
  const w = WEAPONS[s.kai.weapon];
  const def = ENEMIES[e.id];
  emit(s, { kind: 'lunge', source: { side: 'kai' } });
  emit(s, {
    kind: 'fx',
    fx: w.dtype === 'thermal' ? 'fire' : w.dtype === 'kinetic' ? 'shot' : 'slash',
    target: { side: 'enemy', uid: e.uid },
  });
  if (def.evade && rand(s) < def.evade) {
    emit(s, { kind: 'miss', target: { side: 'enemy', uid: e.uid } });
    log(s, `${e.name} dodges Kai's attack!`, 'info');
    return;
  }
  let power = s.kai.atk + w.power + s.kai.modChips * MOD_CHIP_POWER;
  if (s.kai.boost > 0) power *= 1.5;
  const r = damageEnemy(s, e, power, w.dtype, w.crit + (e.scanned ? 0.2 : 0));
  log(s, `Kai ${w.verb} ${e.name}: ${r.dmg} damage.${hitTags(r)}`, 'info');
  if (!r.killed && w.dtype === 'thermal' && ENEMIES[e.id].tags.includes('bloom')) {
    if (e.burn === 0) log(s, `${e.name} catches fire!`, 'good');
    e.burn = Math.max(e.burn, 2);
  }
}

export function canUseItem(s: BattleState, item: ItemId): boolean {
  if ((s.inventory[item] ?? 0) <= 0) return false;
  if (!ITEMS[item].battle) return false;
  if (item === 'spares') return s.bolt.active;
  if (item === 'battery') return boltCanAct(s) && s.bolt.energy < s.bolt.maxEnergy;
  if (item === 'repair_kit') return s.kai.hp < s.kai.maxHp;
  return true;
}

function applyItem(s: BattleState, item: ItemId, uid?: number) {
  s.inventory[item] = (s.inventory[item] ?? 0) - 1;
  const k = s.kai;
  const b = s.bolt;
  switch (item) {
    case 'repair_kit': {
      const amt = healKai(s, 0.45);
      emit(s, { kind: 'fx', fx: 'heal', target: { side: 'kai' } });
      log(s, `Kai patches up with a Repair Kit: +${amt} HP.`, 'good');
      break;
    }
    case 'spares': {
      const amt = Math.round(b.maxHp * 0.6);
      if (b.ko) {
        b.ko = false;
        b.hp = amt;
        log(s, 'BOLT reboots! "I saw a bright light. Is there a drone heaven? Was I there?"', 'bolt');
      } else {
        b.hp = Math.min(b.maxHp, b.hp + amt);
        log(s, `Kai bolts fresh plating onto BOLT: +${amt} HP.`, 'good');
      }
      emit(s, { kind: 'heal', target: { side: 'bolt' }, amount: amt });
      break;
    }
    case 'battery':
      b.energy = Math.min(b.maxEnergy, b.energy + 3);
      log(s, 'Kai slots a Power Cell into BOLT: +3 energy.', 'good');
      emit(s, { kind: 'status', target: { side: 'bolt' }, text: '+3 EN' });
      break;
    case 'stim':
      k.boost = 3;
      log(s, 'Kai injects an Adrenal Stim. Damage up for 3 turns!', 'good');
      emit(s, { kind: 'status', target: { side: 'kai' }, text: 'DMG UP' });
      break;
    case 'emp_grenade': {
      emit(s, { kind: 'fx', fx: 'emp' });
      let stunned = 0;
      for (const e of aliveEnemies(s)) {
        const r = damageEnemy(s, e, 18 + 4 * k.level, 'emp');
        const def = ENEMIES[e.id];
        if (!r.killed && !e.dead && def.tags.includes('robot') && !def.boss && rand(s) < 0.5) {
          e.stun = 1;
          e.charging = null;
          stunned += 1;
        }
      }
      log(s, `The EMP grenade detonates!${stunned ? ` ${stunned} robot${stunned > 1 ? 's' : ''} short-circuit.` : ''}`, 'good');
      break;
    }
    case 'incendiary': {
      emit(s, { kind: 'fx', fx: 'fire' });
      for (const e of aliveEnemies(s)) {
        const r = damageEnemy(s, e, 16 + 4 * k.level, 'thermal');
        if (!r.killed && !e.dead && ENEMIES[e.id].tags.includes('bloom')) e.burn = Math.max(e.burn, 3);
      }
      log(s, 'The incendiary charge erupts in a wall of fire!', 'good');
      break;
    }
    case 'coolant': {
      const e = targetEnemy(s, uid);
      if (!e) break;
      emit(s, { kind: 'fx', fx: 'frost', target: { side: 'enemy', uid: e.uid } });
      const wasCharging = !!e.charging;
      const r = damageEnemy(s, e, 30 + 4 * k.level, 'cryo');
      log(s, `Kai blasts ${e.name} with coolant: ${r.dmg} damage.${hitTags(r)}`, 'good');
      if (!e.dead) {
        e.burn = 0;
        if (wasCharging && e.charging) {
          e.charging = null;
          log(s, `The coolant vents ${e.name}'s charge!`, 'good');
        }
      }
      break;
    }
    case 'serum':
      k.poison = 0;
      k.poisonDmg = 0;
      log(s, "The serum clears the spores from Kai's lungs.", 'good');
      emit(s, { kind: 'fx', fx: 'heal', target: { side: 'kai' } });
      break;
    default:
      break;
  }
}

function flee(s: BattleState) {
  const chance = 0.55 + (boltCanAct(s) ? 0.15 : 0);
  if (rand(s) < chance) {
    s.phase = 'fled';
    log(s, 'Kai and BOLT retreat!', 'warn');
  } else {
    log(s, "Couldn't get away!", 'bad');
  }
}

/* ---------------- BOLT ---------------- */

export function canUseAbility(s: BattleState, ability: BoltAbility, uid?: number): boolean {
  const b = s.bolt;
  if (!boltCanAct(s)) return false;
  if (ability === 'speak') return s.canCommune && s.phase !== 'communed';
  const def = BOLT_ABILITIES[ability];
  if (def.module && !b.modules.includes(def.module)) return false;
  if (b.energy < def.cost) return false;
  if (ability === 'recharge') return b.energy < b.maxEnergy;
  if (ability === 'hack') {
    if (uid === undefined) return aliveEnemies(s).some((e) => isHackable(e));
    const e = targetEnemy(s, uid);
    return !!e && isHackable(e);
  }
  if (ability === 'repair') return s.kai.hp < s.kai.maxHp;
  return true;
}

export function isHackable(e: BattleEnemy): boolean {
  const def = ENEMIES[e.id];
  if (!def.tags.includes('robot') || e.dead) return false;
  if (def.shielded) return e.shieldDown <= 0;
  return !def.hackImmune && e.hacked <= 0;
}

const COMMUNE_LINES: [string, string][] = [
  [
    'BOLT pulses its light: blue, blue, gold. "Hello."',
    'The Heart shudders. Its thorns go still... then it pulses back, uncertain.',
  ],
  [
    'BOLT pulses: white, blue. "Safe. You are safe."',
    "The Heart's glow softens from red to violet. Its tendrils curl inward.",
  ],
  [
    'BOLT pulses: gold, gold, gold. "Together."',
    'For a long moment, nothing. Then the Heart answers, blue, blue, gold, and the thorns fall away.',
  ],
];

function boltAct(s: BattleState, ability: BoltAbility, uid?: number) {
  const b = s.bolt;
  const def = BOLT_ABILITIES[ability];
  b.energy -= def.cost;
  switch (ability) {
    case 'stun': {
      const e = targetEnemy(s, uid);
      if (!e) break;
      emit(s, { kind: 'fx', fx: 'zap', target: { side: 'enemy', uid: e.uid } });
      const r = damageEnemy(s, e, boltZapPower(b.level, b.modules), 'emp', 0.05);
      log(s, `BOLT zaps ${e.name}: ${r.dmg} damage.${hitTags(r)}`, 'bolt');
      if (!r.killed && !e.dead) {
        const ed = ENEMIES[e.id];
        let chance = ed.tags.includes('robot') ? 0.6 : 0.35;
        if (b.modules.includes('overcharge')) chance += 0.2;
        if (ed.boss) chance *= 0.4;
        if (rand(s) < chance) {
          e.stun = 1;
          log(s, `${e.name} is stunned!`, 'good');
          emit(s, { kind: 'status', target: { side: 'enemy', uid: e.uid }, text: 'STUNNED' });
        }
      }
      break;
    }
    case 'scan': {
      const e = targetEnemy(s, uid);
      if (!e) break;
      e.scanned = true;
      emit(s, { kind: 'fx', fx: 'scan', target: { side: 'enemy', uid: e.uid } });
      log(s, `SCAN ${e.name}: ${ENEMIES[e.id].scanText}`, 'bolt');
      break;
    }
    case 'shield': {
      const k = s.kai;
      k.shield = 10 + 3 * b.level + (b.modules.includes('plating') ? 6 : 0);
      k.shieldTurns = 2;
      emit(s, { kind: 'status', target: { side: 'kai' }, text: 'SHIELD' });
      log(s, `BOLT projects a shield around Kai (absorbs ${k.shield}).`, 'bolt');
      break;
    }
    case 'hack': {
      const e = targetEnemy(s, uid);
      if (!e) break;
      const ed = ENEMIES[e.id];
      emit(s, { kind: 'fx', fx: 'hack', target: { side: 'enemy', uid: e.uid } });
      if (ed.shielded) {
        e.shieldDown = 3;
        log(s, `BOLT cracks ${e.name}'s shield matrix! Shields down for 3 turns.`, 'good');
        emit(s, { kind: 'status', target: { side: 'enemy', uid: e.uid }, text: 'SHIELD DOWN' });
      } else if (rand(s) < (e.scanned ? 0.9 : 0.75)) {
        e.hacked = 2;
        e.charging = null;
        log(s, `BOLT hacks ${e.name}! It turns on its allies.`, 'good');
        emit(s, { kind: 'status', target: { side: 'enemy', uid: e.uid }, text: 'HACKED' });
      } else {
        log(s, `Hack failed. ${e.name}'s firewall held.`, 'bad');
      }
      break;
    }
    case 'flash':
      emit(s, { kind: 'fx', fx: 'flash' });
      for (const e of aliveEnemies(s)) e.blind = 2;
      log(s, 'BOLT fires a blinding flash! Enemies are blinded.', 'bolt');
      break;
    case 'decoy':
      b.decoy = 2;
      emit(s, { kind: 'status', target: { side: 'bolt' }, text: 'DECOY' });
      log(s, 'BOLT projects a dazzling hologram of itself. "Hey, ugly! Over here!"', 'bolt');
      break;
    case 'repair': {
      const amt = healKai(s, 0.35);
      emit(s, { kind: 'fx', fx: 'heal', target: { side: 'kai' } });
      log(s, `BOLT sprays repair nanites over Kai: +${amt} HP.`, 'bolt');
      break;
    }
    case 'recharge':
      b.energy = Math.min(b.maxEnergy, b.energy + 2);
      emit(s, { kind: 'status', target: { side: 'bolt' }, text: '+2 EN' });
      log(s, 'BOLT diverts power to its cells: +2 energy.', 'bolt');
      break;
    case 'speak': {
      const line = COMMUNE_LINES[Math.min(s.commune, COMMUNE_LINES.length - 1)];
      emit(s, { kind: 'fx', fx: 'light' });
      log(s, line[0], 'bolt');
      s.commune += 1;
      const heart = aliveEnemies(s).find((e) => e.id === 'heart' || e.id === 'heart2');
      if (heart) {
        heart.listening = 1;
        heart.charging = null;
      }
      log(s, line[1], 'good');
      if (s.commune >= COMMUNE_STEPS) {
        for (const e of aliveEnemies(s)) {
          if (e.id === 'tendril') {
            e.dead = true;
            e.hp = 0;
            emit(s, { kind: 'death', target: { side: 'enemy', uid: e.uid } });
          }
        }
        s.phase = 'communed';
      }
      break;
    }
  }
}

/* ---------------- enemies ---------------- */

function pickPartyTarget(s: BattleState): PartyTarget {
  if (boltCanAct(s) && s.bolt.decoy > 0) return 'bolt';
  if (boltCanAct(s) && rand(s) < BOLT_TARGET_CHANCE) return 'bolt';
  return 'kai';
}

function partyTargets(s: BattleState): PartyTarget[] {
  return boltCanAct(s) ? ['kai', 'bolt'] : ['kai'];
}

function applyKaiStatus(s: BattleState, e: BattleEnemy, status: { kind: StatusKind; turns: number; amount?: number }) {
  const k = s.kai;
  switch (status.kind) {
    case 'poison': {
      const dmg = Math.round((status.amount ?? 2) * (1 + 0.3 * (e.tier - 1)));
      k.poison = Math.max(k.poison, status.turns);
      k.poisonDmg = Math.max(k.poisonDmg, dmg);
      log(s, 'Kai is poisoned by spores!', 'bad');
      emit(s, { kind: 'status', target: { side: 'kai' }, text: 'POISONED' });
      break;
    }
    case 'burn':
      k.burn = Math.max(k.burn, status.turns);
      log(s, 'Kai is burning!', 'bad');
      emit(s, { kind: 'status', target: { side: 'kai' }, text: 'BURNING' });
      break;
    case 'freeze':
      if (k.frozen === 0) {
        k.frozen = 1;
        log(s, 'Kai is frozen solid!', 'bad');
        emit(s, { kind: 'status', target: { side: 'kai' }, text: 'FROZEN' });
      }
      break;
  }
}

/** Returns damage dealt, or -1 on a miss. */
function hitParty(s: BattleState, e: BattleEnemy, tgt: PartyTarget, raw: number, move: EnemyMove): number {
  const ref = tgt === 'kai' ? ({ side: 'kai' } as const) : ({ side: 'bolt' } as const);
  if (e.blind > 0 && rand(s) < 0.5) {
    emit(s, { kind: 'miss', target: ref });
    return -1;
  }
  const variance = 0.9 + rand(s) * 0.2;
  if (tgt === 'kai') {
    const k = s.kai;
    let dmg = Math.max(1, Math.round(raw * variance * (k.brace ? 0.5 : 1) - k.def));
    if (k.shield > 0) {
      const absorbed = Math.min(k.shield, dmg);
      k.shield -= absorbed;
      dmg -= absorbed;
      emit(s, { kind: 'absorb', target: ref, amount: absorbed });
      if (k.shield <= 0) {
        k.shieldTurns = 0;
        log(s, 'The shield shatters!', 'warn');
      }
    }
    if (dmg > 0) {
      k.hp = Math.max(0, k.hp - dmg);
      emit(s, { kind: 'damage', target: ref, amount: dmg });
    }
    if (move.status && k.hp > 0 && rand(s) < move.status.chance) applyKaiStatus(s, e, move.status);
    return dmg;
  }
  const b = s.bolt;
  const dmg = Math.max(1, Math.round(raw * variance - Math.floor(b.level / 2)));
  b.hp = Math.max(0, b.hp - dmg);
  emit(s, { kind: 'damage', target: ref, amount: dmg });
  if (b.hp <= 0) {
    b.ko = true;
    b.decoy = 0;
    log(s, 'BOLT is knocked offline!', 'bad');
    emit(s, { kind: 'status', target: ref, text: 'OFFLINE' });
  }
  return dmg;
}

function describeHits(results: [PartyTarget, number][]): string {
  const parts = results.map(([t, d]) => (d < 0 ? `${partyName(t)} dodges` : `${partyName(t)} -${d}`));
  return parts.length ? ` (${parts.join(', ')})` : '';
}

function pickMove(s: BattleState, e: BattleEnemy, def: EnemyDef): EnemyMove {
  const alive = aliveEnemies(s);
  const allies = alive.filter((x) => x.uid !== e.uid);
  const options = def.moves.filter((m) => {
    if ((e.cooldowns[m.id] ?? 0) > 0) return false;
    if (m.summon && alive.length >= MAX_ENEMIES) return false;
    if (m.heal && m.target === 'self' && e.hp >= e.maxHp) return false;
    switch (m.when) {
      case 'belowHalf':
        return e.hp < e.maxHp / 2;
      case 'belowThird':
        return e.hp < e.maxHp / 3;
      case 'hasAllies':
        return allies.length > 0;
      case 'fewAllies':
        return allies.length < 2;
      case 'damaged':
        return alive.some((x) => x.hp < x.maxHp * 0.7);
      default:
        return true;
    }
  });
  if (!options.length) return def.moves[0];
  const total = options.reduce((acc, m) => acc + m.weight, 0);
  let r = rand(s) * total;
  for (const m of options) {
    r -= m.weight;
    if (r <= 0) return m;
  }
  return options[options.length - 1];
}

function executeMove(s: BattleState, e: BattleEnemy, move: EnemyMove) {
  if (move.summon) {
    const added = addEnemy(s, move.summon, e.tier);
    log(s, fill(move.text, e), 'warn');
    if (added) {
      added.fresh = true;
      emit(s, { kind: 'summon', target: { side: 'enemy', uid: added.uid } });
    }
    return;
  }
  if (move.heal) {
    let target = e;
    if (move.target === 'ally') {
      target = aliveEnemies(s).reduce((best, x) => (x.hp / x.maxHp < best.hp / best.maxHp ? x : best), e);
    }
    const amt = Math.min(target.maxHp - target.hp, Math.round(target.maxHp * move.heal));
    target.hp += amt;
    emit(s, { kind: 'heal', target: { side: 'enemy', uid: target.uid }, amount: amt });
    log(s, `${fill(move.text, e)} (+${amt} HP)`, 'warn');
    return;
  }
  if (move.buff) {
    e.atkBuff = 3;
    emit(s, { kind: 'status', target: { side: 'enemy', uid: e.uid }, text: 'ATK UP' });
    log(s, fill(move.text, e), 'warn');
    return;
  }
  emit(s, { kind: 'lunge', source: { side: 'enemy', uid: e.uid } });
  const atk = e.atk * (e.atkBuff > 0 ? 1.4 : 1) * move.power;
  const results: [PartyTarget, number][] = [];
  if (move.target === 'all') {
    for (const t of partyTargets(s)) results.push([t, hitParty(s, e, t, atk, move)]);
    log(s, `${fill(move.text, e)}${describeHits(results)}`, 'bad');
    return;
  }
  const tgt = pickPartyTarget(s);
  const hits = move.hits ?? 1;
  let total = 0;
  let missed = 0;
  for (let i = 0; i < hits; i++) {
    if (s.kai.hp <= 0 || (tgt === 'bolt' && s.bolt.ko)) break;
    const d = hitParty(s, e, tgt, atk, move);
    if (d < 0) missed += 1;
    else total += d;
  }
  const suffix = missed === hits ? ` (${partyName(tgt)} dodges)` : ` (${partyName(tgt)} -${total})`;
  log(s, `${fill(move.text, e, partyName(tgt))}${suffix}`, 'bad');
}

function hackedTurn(s: BattleState, e: BattleEnemy) {
  const others = aliveEnemies(s).filter((x) => x.uid !== e.uid);
  e.hacked -= 1;
  if (!others.length) return;
  const victim = others[Math.floor(rand(s) * others.length)];
  emit(s, { kind: 'lunge', source: { side: 'enemy', uid: e.uid } });
  const dmg = Math.max(1, Math.round(e.atk * 1.3 * (0.9 + rand(s) * 0.2) - victim.def));
  victim.hp -= dmg;
  emit(s, { kind: 'damage', target: { side: 'enemy', uid: victim.uid }, amount: dmg });
  log(s, `${e.name} turns its weapons on ${victim.name}! (-${dmg})`, 'good');
  if (victim.hp <= 0) killEnemy(s, victim);
  if (e.hacked === 0 && !e.dead) log(s, `${e.name}'s hack wears off.`, 'warn');
}

function takeEnemyTurn(s: BattleState, e: BattleEnemy) {
  const def = ENEMIES[e.id];
  if (e.fresh) return;
  if (e.listening > 0) {
    e.listening -= 1;
    emit(s, { kind: 'fx', fx: 'light', target: { side: 'enemy', uid: e.uid } });
    log(s, `${e.name} pulses softly... listening.`, 'bolt');
    return;
  }
  if (e.stun > 0) {
    e.stun -= 1;
    log(s, e.charging ? `${e.name} is stunned! Its charge fizzles out.` : `${e.name} is stunned and can't act!`, 'good');
    e.charging = null;
    return;
  }
  if (e.hacked > 0) {
    hackedTurn(s, e);
    return;
  }
  let move: EnemyMove | undefined;
  if (e.charging) {
    move = def.moves.find((m) => m.id === e.charging);
    e.charging = null;
  } else {
    move = pickMove(s, e, def);
    if (move.charge) {
      e.charging = move.id;
      if (move.cooldown) e.cooldowns[move.id] = move.cooldown + 1;
      emit(s, { kind: 'status', target: { side: 'enemy', uid: e.uid }, text: 'CHARGING' });
      log(s, `WARNING: ${fill(move.charge, e)}`, 'warn');
      return;
    }
    if (move.cooldown) e.cooldowns[move.id] = move.cooldown;
  }
  if (!move) return;
  executeMove(s, e, move);
  if (def.swift && move.power > 0 && !e.dead && s.kai.hp > 0 && rand(s) < def.swift) {
    log(s, `${e.name} is fast. It strikes again!`, 'bad');
    executeMove(s, e, def.moves[0]);
  }
}

function enemyAct(s: BattleState) {
  while (s.enemyCursor < s.enemies.length && s.enemies[s.enemyCursor].dead) s.enemyCursor += 1;
  if (s.enemyCursor >= s.enemies.length) {
    endRound(s);
    return;
  }
  const e = s.enemies[s.enemyCursor];
  s.enemyCursor += 1;
  takeEnemyTurn(s, e);
  if (checkEnd(s)) return;
  const remaining = s.enemies.slice(s.enemyCursor).some((x) => !x.dead && !x.fresh);
  if (!remaining) endRound(s);
}

/* ---------------- reducer ---------------- */

export function battleReducer(state: BattleState, action: BattleAction): BattleState {
  if (isBattleOver(state)) return state;
  switch (action.type) {
    case 'KAI_ATTACK': {
      if (state.phase !== 'kai') return state;
      const s = cloneState(state);
      kaiAttack(s, action.target);
      afterKai(s);
      return s;
    }
    case 'KAI_REPAIR': {
      if (state.phase !== 'kai' || !canUseItem(state, 'repair_kit')) return state;
      const s = cloneState(state);
      applyItem(s, 'repair_kit');
      afterKai(s);
      return s;
    }
    case 'KAI_ITEM': {
      if (state.phase !== 'kai' || !canUseItem(state, action.item)) return state;
      const s = cloneState(state);
      applyItem(s, action.item, action.target);
      afterKai(s);
      return s;
    }
    case 'KAI_SWAP': {
      if (state.phase !== 'kai' || state.kai.weapon === action.weapon || !state.kai.weapons.includes(action.weapon)) return state;
      const s = cloneState(state);
      s.kai.weapon = action.weapon;
      log(s, `Kai switches to the ${WEAPONS[action.weapon].name}.`, 'info');
      return s;
    }
    case 'KAI_BRACE': {
      if (state.phase !== 'kai') return state;
      const s = cloneState(state);
      s.kai.brace = true;
      emit(s, { kind: 'status', target: { side: 'kai' }, text: 'BRACED' });
      log(s, 'Kai braces for impact. Incoming damage halved this round.', 'info');
      afterKai(s);
      return s;
    }
    case 'KAI_FLEE': {
      if (state.phase !== 'kai' || !state.canFlee) return state;
      const s = cloneState(state);
      flee(s);
      if (s.phase === 'kai') afterKai(s);
      return s;
    }
    case 'BOLT': {
      if (state.phase !== 'bolt' || !canUseAbility(state, action.ability, action.target)) return state;
      const s = cloneState(state);
      boltAct(s, action.ability, action.target);
      if (s.phase === 'communed') return s;
      afterBolt(s);
      return s;
    }
    case 'ENEMY_ACT': {
      if (state.phase !== 'enemy') return state;
      const s = cloneState(state);
      enemyAct(s);
      return s;
    }
  }
}

export function battleResult(s: BattleState): BattleResult {
  const outcome = s.phase === 'victory' || s.phase === 'defeat' || s.phase === 'fled' || s.phase === 'communed' ? s.phase : 'fled';
  return {
    outcome,
    kaiHp: s.kai.hp,
    boltHp: s.bolt.ko ? 0 : s.bolt.hp,
    inventory: s.inventory,
    weapon: s.kai.weapon,
    rounds: s.round,
    rewards: outcome === 'victory' ? s.rewards : null,
    kills: s.kills,
  };
}
