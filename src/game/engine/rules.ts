import {
  CRITICAL_TIME_MINUTES,
  DECK_ORDER,
  LOW_TIME_MINUTES,
  boltMaxHp,
  kaiMaxHp,
  levelForXp,
} from '../constants';
import { ITEMS, MODULES, WEAPONS } from '../data/catalog';
import { getDeck } from '../data/decks';
import { MEMORIES, SURVIVORS } from '../data/story';
import type {
  Condition,
  DeckId,
  DialogueCtx,
  DialogueTree,
  Effect,
  Encounter,
  EndingId,
  GameData,
  MapEntity,
  SfxId,
} from '../types';

export type ToastTone = 'info' | 'good' | 'bad' | 'warn' | 'bolt';
export type GameOverReason = 'reactor' | 'defeat';

export type GameEvent =
  | { type: 'sfx'; id: SfxId }
  | { type: 'toast'; text: string; tone?: ToastTone }
  | { type: 'levelup'; level: number }
  | { type: 'scanfx' }
  | { type: 'dialogue'; id: string; self?: string }
  | { type: 'inline'; tree: DialogueTree; self?: string }
  | { type: 'battle'; encounter: Encounter }
  | { type: 'travel'; deck: DeckId }
  | { type: 'ending'; id: EndingId }
  | { type: 'log'; id: string }
  | { type: 'gameover'; reason: GameOverReason };

export const MODAL_EVENT_TYPES: ReadonlySet<GameEvent['type']> = new Set([
  'dialogue',
  'inline',
  'battle',
  'travel',
  'ending',
  'log',
  'gameover',
]);

export function deckTier(deck: DeckId): number {
  return DECK_ORDER.indexOf(deck) + 1;
}

export function resolveKey(key: string, ctx?: Partial<DialogueCtx>): string {
  let out = key;
  if (ctx?.self) out = out.replace(/\$self/g, ctx.self);
  if (ctx?.deck) out = out.replace(/\$deck/g, ctx.deck);
  return out;
}

export function evalCondition(c: Condition | undefined, d: GameData, ctx?: Partial<DialogueCtx>): boolean {
  if (!c) return true;
  if ('flag' in c) return !!d.flags[resolveKey(c.flag, ctx)];
  if ('noFlag' in c) return !d.flags[resolveKey(c.noFlag, ctx)];
  if ('item' in c) return (d.inventory[c.item] ?? 0) >= (c.min ?? 1);
  if ('module' in c) return d.modules.includes(c.module);
  if ('noModule' in c) return !d.modules.includes(c.noModule);
  if ('weapon' in c) return d.weapons.includes(c.weapon);
  if ('memories' in c) return d.memories.length >= c.memories;
  if ('scrap' in c) return d.scrap >= c.scrap;
  if ('timeBelow' in c) return d.minutesLeft < c.timeBelow;
  if ('timeAtLeast' in c) return d.minutesLeft >= c.timeAtLeast;
  if ('survivors' in c) return d.survivors.length >= c.survivors;
  if ('level' in c) return d.level >= c.level;
  if ('all' in c) return c.all.every((x) => evalCondition(x, d, ctx));
  if ('any' in c) return c.any.some((x) => evalCondition(x, d, ctx));
  if ('not' in c) return !evalCondition(c.not, d, ctx);
  return true;
}

export function cloneData(d: GameData): GameData {
  return {
    ...d,
    pos: { ...d.pos },
    boltPos: { ...d.boltPos },
    weapons: [...d.weapons],
    modules: [...d.modules],
    memories: [...d.memories],
    inventory: { ...d.inventory },
    flags: { ...d.flags },
    logs: [...d.logs],
    survivors: [...d.survivors],
  };
}

const TIME_THRESHOLDS: { at: number; text: string }[] = [
  { at: 24 * 60, text: 'HALCYON: Reactor at 33%. Twenty-four hours remain.' },
  { at: LOW_TIME_MINUTES, text: 'HALCYON: Reactor critical. Twelve hours remain.' },
  { at: CRITICAL_TIME_MINUTES, text: 'HALCYON: WARNING. Four hours to stellar intercept.' },
  { at: 60, text: 'HALCYON: One hour. Please hurry, Kai.' },
];

export function timeWarnings(before: number, after: number, events: GameEvent[]) {
  for (const t of TIME_THRESHOLDS) {
    if (before > t.at && after <= t.at) {
      events.push({ type: 'sfx', id: 'alarm' });
      events.push({ type: 'toast', text: t.text, tone: 'warn' });
    }
  }
  if (before > 0 && after <= 0) events.push({ type: 'gameover', reason: 'reactor' });
}

export function spendTime(d: GameData, minutes: number, events: GameEvent[]) {
  const before = d.minutesLeft;
  d.minutesLeft -= minutes;
  timeWarnings(before, d.minutesLeft, events);
}

export function addXp(d: GameData, qty: number, events: GameEvent[]) {
  d.xp += qty;
  const target = levelForXp(d.xp);
  while (d.level < target) {
    d.level += 1;
    const max = kaiMaxHp(d.level);
    d.hp = Math.min(max, d.hp + (max - kaiMaxHp(d.level - 1)) + Math.round(max * 0.25));
    if (d.flags.bolt_joined) d.boltHp = Math.min(boltMaxHp(d.level, d.modules), d.boltHp + 8);
    events.push({ type: 'levelup', level: d.level });
    events.push({ type: 'sfx', id: 'levelup' });
  }
}

export function encounterFor(ent: MapEntity, d: GameData): Encounter | null {
  if (ent.def.kind !== 'enemy') return null;
  const deck = getDeck(d.deck);
  return {
    id: ent.id,
    enemies: ent.def.enemies,
    tier: ent.def.tier ?? deck.def.tier,
    boss: ent.def.boss,
    onWin: ent.def.onWin,
    canFlee: ent.def.canFlee,
    finale: ent.def.finale,
    outro: ent.def.outro,
    returnPos: { ...d.pos },
  };
}

function applyEffect(d: GameData, fx: Effect, ctx: DialogueCtx, events: GameEvent[]) {
  switch (fx.type) {
    case 'flag':
      d.flags[resolveKey(fx.key, ctx)] = fx.value ?? 1;
      break;
    case 'unflag':
      delete d.flags[resolveKey(fx.key, ctx)];
      break;
    case 'item': {
      const qty = fx.qty ?? 1;
      const next = Math.max(0, (d.inventory[fx.id] ?? 0) + qty);
      if (next === 0) delete d.inventory[fx.id];
      else d.inventory[fx.id] = next;
      if (qty > 0) {
        events.push({ type: 'toast', text: `+${qty} ${ITEMS[fx.id].name}`, tone: 'good' });
        events.push({ type: 'sfx', id: 'pickup' });
      }
      break;
    }
    case 'scrap':
      d.scrap = Math.max(0, d.scrap + fx.qty);
      if (fx.qty > 0) {
        events.push({ type: 'toast', text: `+${fx.qty} scrap`, tone: 'good' });
        events.push({ type: 'sfx', id: 'pickup' });
      }
      break;
    case 'weapon':
      if (!d.weapons.includes(fx.id)) {
        d.weapons.push(fx.id);
        d.weapon = fx.id;
        events.push({ type: 'toast', text: `New weapon: ${WEAPONS[fx.id].name} (equipped)`, tone: 'good' });
        events.push({ type: 'sfx', id: 'levelup' });
      }
      break;
    case 'module':
      if (!d.modules.includes(fx.id)) {
        d.modules.push(fx.id);
        if (fx.id === 'plating') d.boltHp += 25;
        events.push({ type: 'toast', text: `BOLT upgrade: ${MODULES[fx.id].name}`, tone: 'bolt' });
        events.push({ type: 'sfx', id: 'levelup' });
      }
      break;
    case 'memory':
      if (!d.memories.includes(fx.id)) {
        d.memories.push(fx.id);
        const m = MEMORIES[fx.id];
        events.push({ type: 'toast', text: `Memory file ${m.index}/6 restored: ${m.title}`, tone: 'bolt' });
        events.push({ type: 'sfx', id: 'scan' });
        events.push({ type: 'dialogue', id: m.dialogue });
      }
      break;
    case 'log':
      if (!d.logs.includes(fx.id)) {
        d.logs.push(fx.id);
        events.push({ type: 'sfx', id: 'pickup' });
        events.push({ type: 'log', id: fx.id });
      }
      break;
    case 'modChip':
      d.modChips += 1;
      events.push({ type: 'toast', text: 'Weapon mod installed: +2 damage to all weapons', tone: 'good' });
      events.push({ type: 'sfx', id: 'levelup' });
      break;
    case 'xp':
      events.push({ type: 'toast', text: `+${fx.qty} XP`, tone: 'good' });
      addXp(d, fx.qty, events);
      break;
    case 'time':
      spendTime(d, fx.minutes, events);
      break;
    case 'heal': {
      if (fx.kai) {
        const max = kaiMaxHp(d.level);
        d.hp = Math.min(max, d.hp + Math.round(max * fx.kai));
      }
      if (fx.bolt && d.flags.bolt_joined) {
        const bmax = boltMaxHp(d.level, d.modules);
        d.boltHp = Math.min(bmax, d.boltHp + Math.round(bmax * fx.bolt));
      }
      events.push({ type: 'sfx', id: 'heal' });
      break;
    }
    case 'damage':
      d.hp = Math.max(1, d.hp - fx.kai);
      events.push({ type: 'sfx', id: 'hurt' });
      break;
    case 'sealBreach':
      d.flags[`${ctx.deck}:sealed`] = 1;
      events.push({ type: 'toast', text: 'Breach sealed. Air pressure stabilizing.', tone: 'good' });
      events.push({ type: 'sfx', id: 'door' });
      break;
    case 'survivor':
      if (!d.survivors.includes(fx.id)) {
        d.survivors.push(fx.id);
        events.push({ type: 'toast', text: `${SURVIVORS[fx.id]?.name ?? 'Survivor'} is safe.`, tone: 'good' });
        events.push({ type: 'sfx', id: 'heal' });
      }
      break;
    case 'boltJoin':
      d.flags.bolt_joined = 1;
      for (const m of ['stun', 'scan'] as const) if (!d.modules.includes(m)) d.modules.push(m);
      d.boltHp = boltMaxHp(d.level, d.modules);
      d.boltPos = { ...d.pos };
      events.push({ type: 'toast', text: 'BOLT joined you!', tone: 'bolt' });
      events.push({ type: 'sfx', id: 'levelup' });
      break;
    case 'toast':
      events.push({ type: 'toast', text: fx.text, tone: 'info' });
      break;
    case 'battle':
      events.push({
        type: 'battle',
        encounter: {
          id: fx.id ?? ctx.self ?? 'scripted',
          enemies: fx.enemies,
          tier: fx.tier ?? deckTier(ctx.deck),
          boss: fx.boss,
          onWin: fx.onWin,
          canFlee: fx.canFlee,
          finale: fx.finale,
          returnPos: { ...d.pos },
        },
      });
      break;
    case 'fight': {
      const ent = getDeck(ctx.deck).entities.find((e) => e.id === ctx.self);
      const enc = ent ? encounterFor(ent, d) : null;
      if (enc) events.push({ type: 'battle', encounter: enc });
      break;
    }
    case 'travel':
      events.push({ type: 'travel', deck: fx.deck });
      break;
    case 'ending':
      events.push({ type: 'ending', id: fx.id });
      break;
    case 'dialogue':
      events.push({ type: 'dialogue', id: fx.id });
      break;
    case 'sfx':
      events.push({ type: 'sfx', id: fx.id });
      break;
  }
}

export function applyEffects(data: GameData, effects: Effect[] | undefined, ctx: DialogueCtx): { data: GameData; events: GameEvent[] } {
  const events: GameEvent[] = [];
  if (!effects?.length) return { data, events };
  const d = cloneData(data);
  for (const fx of effects) applyEffect(d, fx, ctx, events);
  return { data: d, events };
}
