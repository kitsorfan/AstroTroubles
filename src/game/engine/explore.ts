import {
  BATTLE_BASE_MINUTES,
  BATTLE_ROUND_MINUTES,
  BLOOM_BURN_MINUTES,
  ELEVATOR_MINUTES,
  FLEE_MINUTES,
  MAINT_HACK_MINUTES,
  O2_STEPS_PER_HP,
  SAVE_VERSION,
  SCAN_MINUTES,
  SCAN_RADIUS,
  SECURITY_HACK_MINUTES,
  START_MINUTES,
  STEP_MINUTES,
  VENT_DAMAGE,
  boltMaxHp,
  formatDuration,
  kaiMaxHp,
} from '../constants';
import { ITEMS } from '../data/catalog';
import { getDeck } from '../data/decks';
import type {
  BattleResult,
  DeckId,
  Dir,
  DialogueCtx,
  DialogueTree,
  DoorLock,
  Encounter,
  GameData,
  ItemId,
  MapEntity,
  ParsedDeck,
  Vec,
} from '../types';
import { entitiesAt, tileAt, WALKABLE } from './mapParser';
import { addXp, applyEffects, cloneData, encounterFor, evalCondition, spendTime, type GameEvent } from './rules';

export const DIRS: Record<Dir, Vec> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export interface Outcome {
  data: GameData;
  events: GameEvent[];
}

export function newGameData(): GameData {
  const deck = getDeck('cryo');
  const now = Date.now();
  return {
    version: SAVE_VERSION,
    deck: 'cryo',
    pos: { ...deck.spawn },
    facing: 'down',
    boltPos: { ...deck.spawn },
    level: 1,
    xp: 0,
    hp: kaiMaxHp(1),
    weapon: 'wrench',
    weapons: ['wrench'],
    modChips: 0,
    boltHp: 0,
    modules: [],
    memories: [],
    inventory: { repair_kit: 1 },
    scrap: 0,
    minutesLeft: START_MINUTES,
    steps: 0,
    flags: { 'visited:cryo': 1 },
    logs: [],
    survivors: [],
    kills: 0,
    battles: 0,
    startedAt: now,
    savedAt: now,
  };
}

export function ctxFor(d: GameData, self?: string): DialogueCtx {
  return { deck: d.deck, self };
}

/* ---------------- entity state ---------------- */

export function isDoorOpen(ent: MapEntity, d: GameData): boolean {
  return !!d.flags[`open:${ent.id}`];
}

export function isEnemyAlive(ent: MapEntity, d: GameData): boolean {
  return !d.flags[`defeated:${ent.id}`];
}

export function isPickupAvailable(ent: MapEntity, d: GameData): boolean {
  if (ent.def.kind !== 'pickup' || d.flags[`taken:${ent.id}`]) return false;
  return !ent.def.hidden || !!d.flags[`revealed:${ent.id}`];
}

export function isObjectVisible(ent: MapEntity, d: GameData): boolean {
  if (ent.def.kind !== 'object') return false;
  return !ent.def.showIf || evalCondition(ent.def.showIf, d, ctxFor(d, ent.id));
}

export function isTriggerArmed(ent: MapEntity, d: GameData): boolean {
  if (ent.def.kind !== 'trigger') return false;
  if (!ent.def.repeat && d.flags[`fired:${ent.id}`]) return false;
  return !ent.def.if || evalCondition(ent.def.if, d, ctxFor(d, ent.id));
}

/** True when the entity currently occupies its tile and stops movement. */
export function isBlocking(ent: MapEntity, d: GameData): boolean {
  switch (ent.def.kind) {
    case 'door':
      return !isDoorOpen(ent, d);
    case 'enemy':
      return isEnemyAlive(ent, d);
    case 'object':
      return isObjectVisible(ent, d);
    default:
      return false;
  }
}

export function ventsActive(deck: ParsedDeck, d: GameData): boolean {
  return !!deck.def.ventsOffFlag && !d.flags[deck.def.ventsOffFlag];
}

export function leaking(deck: ParsedDeck, d: GameData): boolean {
  return !!deck.def.leak && !d.flags[`${deck.id}:sealed`];
}

export function lightRadius(d: GameData): number {
  if (!d.flags.bolt_joined) return 1.5;
  return d.modules.includes('floodlight') ? 4.5 : 2.5;
}

export function currentObjective(d: GameData): string {
  const deck = getDeck(d.deck);
  const ctx = ctxFor(d);
  for (const o of deck.def.objectives) {
    if (!evalCondition(o.until, d, ctx)) return o.text;
  }
  return deck.def.objectives[deck.def.objectives.length - 1]?.text ?? '';
}

/* ---------------- doors ---------------- */

const HACK_QUIPS = [
  'Maintenance lock. Easy. Stand back and admire the master at work.',
  "A maintenance lock? Please. I've cracked toasters with better security.",
  'Ooh, a lock. I love locks. Locks love me. Give me a second.',
  "Standard maintenance override. I could do this in my sleep. Do I sleep? I don't know.",
];

function hash(x: number, y: number): number {
  return Math.abs((x * 73856093) ^ (y * 19349663));
}

function hackPrompt(ent: MapEntity, lock: DoorLock): DialogueTree {
  const openFx = { type: 'flag' as const, key: `open:${ent.id}` };
  if (lock.type === 'security') {
    return {
      id: `door:${ent.id}`,
      start: 'q',
      nodes: {
        q: {
          speaker: 'bolt',
          text: 'Red security lock. Military encryption. My Intrusion Suite can crack it, but it will take a while.',
          choices: [
            {
              text: `Crack it (${formatDuration(SECURITY_HACK_MINUTES)})`,
              effects: [{ type: 'time', minutes: SECURITY_HACK_MINUTES }, openFx, { type: 'sfx', id: 'hack' }],
              next: 'done',
            },
            { text: 'Leave it for now', end: true },
          ],
        },
        done: { speaker: 'bolt', text: 'Encryption shredded. Door open. Try to look impressed.', end: true },
      },
    };
  }
  if (lock.type === 'bloom') {
    return {
      id: `door:${ent.id}`,
      start: 'q',
      nodes: {
        q: {
          speaker: 'kai',
          text: 'Thick Bloom growth has sealed this doorway shut. The plasma cutter could burn through it.',
          choices: [
            {
              text: `Burn it (${formatDuration(BLOOM_BURN_MINUTES)})`,
              effects: [{ type: 'time', minutes: BLOOM_BURN_MINUTES }, openFx, { type: 'sfx', id: 'burn' }],
              next: 'done',
            },
            { text: 'Leave it', end: true },
          ],
        },
        done: {
          speaker: 'bolt',
          text: 'It smells like burnt salad and regret. The way is clear.',
          end: true,
        },
      },
    };
  }
  return {
    id: `door:${ent.id}`,
    start: 'q',
    nodes: {
      q: {
        speaker: 'bolt',
        text: HACK_QUIPS[hash(ent.x, ent.y) % HACK_QUIPS.length],
        choices: [
          {
            text: `Hack it (${formatDuration(MAINT_HACK_MINUTES)})`,
            effects: [{ type: 'time', minutes: MAINT_HACK_MINUTES }, openFx, { type: 'sfx', id: 'hack' }],
            next: 'done',
          },
          { text: 'Leave it', end: true },
        ],
      },
      done: { speaker: 'bolt', text: "Aaand... open. You're welcome.", end: true },
    },
  };
}

function lockedMessage(lock: DoorLock, d: GameData): string | null {
  switch (lock.type) {
    case 'maint':
      return d.flags.bolt_joined ? null : 'Maintenance lock. You need an override... or a maintenance drone.';
    case 'security':
      return d.modules.includes('hack')
        ? null
        : d.flags.bolt_joined
          ? 'Red security lock. BOLT: "Military encryption. I\'d need an Intrusion Suite for that one."'
          : 'Red security lock. Heavy encryption.';
    case 'bloom':
      return d.weapons.includes('cutter') ? null : 'Dense Bloom growth seals the door. You need something hot enough to burn through it.';
    case 'keycard':
      return (d.inventory[lock.item] ?? 0) > 0 ? null : `Locked. Requires: ${ITEMS[lock.item].name}.`;
    case 'flag':
      return d.flags[lock.flag] ? null : lock.hint;
    default:
      return null;
  }
}

function handleDoor(d: GameData, ent: MapEntity): { pass: boolean; data: GameData; events: GameEvent[] } {
  if (ent.def.kind !== 'door') return { pass: true, data: d, events: [] };
  const lock: DoorLock = ent.def.lock ?? { type: 'none' };
  const blocked = lockedMessage(lock, d);
  if (blocked) {
    return {
      pass: false,
      data: d,
      events: [
        { type: 'sfx', id: 'bump' },
        { type: 'toast', text: blocked, tone: 'warn' },
      ],
    };
  }
  if (lock.type === 'maint' || lock.type === 'security' || lock.type === 'bloom') {
    return { pass: false, data: d, events: [{ type: 'inline', tree: hackPrompt(ent, lock), self: ent.id }] };
  }
  const next = cloneData(d);
  next.flags[`open:${ent.id}`] = 1;
  const events: GameEvent[] = [{ type: 'sfx', id: 'door' }];
  if (lock.type === 'keycard') events.push({ type: 'toast', text: `${ITEMS[lock.item].name} accepted.`, tone: 'good' });
  return { pass: true, data: next, events };
}

/* ---------------- movement ---------------- */

export function tryMove(data: GameData, dir: Dir): Outcome & { moved: boolean } {
  const deck = getDeck(data.deck);
  const delta = DIRS[dir];
  const tx = data.pos.x + delta.x;
  const ty = data.pos.y + delta.y;
  let d: GameData = data.facing === dir ? data : { ...data, facing: dir };
  const events: GameEvent[] = [];
  const ents = entitiesAt(deck, tx, ty);

  for (const ent of ents) {
    if (ent.def.kind === 'door' && !isDoorOpen(ent, d)) {
      const r = handleDoor(d, ent);
      if (!r.pass) return { data: r.data, events: r.events, moved: false };
      d = r.data;
      events.push(...r.events);
    } else if (ent.def.kind === 'enemy' && isEnemyAlive(ent, d)) {
      if (ent.def.intro) return { data: d, events: [{ type: 'dialogue', id: ent.def.intro, self: ent.id }], moved: false };
      const enc = encounterFor(ent, d);
      return { data: d, events: enc ? [{ type: 'battle', encounter: enc }] : [], moved: false };
    } else if (ent.def.kind === 'object' && isObjectVisible(ent, d)) {
      return { data: d, events: [{ type: 'dialogue', id: ent.def.dialogue, self: ent.id }], moved: false };
    }
  }

  const tile = tileAt(deck, tx, ty);
  if (!WALKABLE[tile]) return { data: d, events: [{ type: 'sfx', id: 'bump' }], moved: false };

  const next = cloneData(d);
  const prev = next.pos;
  next.pos = { x: tx, y: ty };
  if (next.flags.bolt_joined) next.boltPos = prev;
  next.steps += 1;
  events.push({ type: 'sfx', id: 'step' });
  spendTime(next, STEP_MINUTES, events);
  d = next;

  for (const ent of ents) {
    if (ent.def.kind === 'pickup' && isPickupAvailable(ent, d)) {
      const taken = cloneData(d);
      taken.flags[`taken:${ent.id}`] = 1;
      const r = applyEffects(taken, ent.def.give, ctxFor(taken, ent.id));
      d = r.data;
      events.push(...r.events);
      if (ent.def.dialogue) events.push({ type: 'dialogue', id: ent.def.dialogue, self: ent.id });
    }
  }
  for (const ent of ents) {
    if (ent.def.kind === 'trigger' && isTriggerArmed(ent, d)) {
      if (!ent.def.repeat) {
        d = cloneData(d);
        d.flags[`fired:${ent.id}`] = 1;
      }
      events.push({ type: 'dialogue', id: ent.def.dialogue, self: ent.id });
    }
  }

  if (tile === 'vent' && ventsActive(deck, d)) {
    const dmg = Math.max(3, Math.round(kaiMaxHp(d.level) * VENT_DAMAGE));
    d = { ...d, hp: Math.max(1, d.hp - dmg) };
    events.push({ type: 'sfx', id: 'hurt' });
    events.push({ type: 'toast', text: `Scalding vent! -${dmg} HP`, tone: 'bad' });
  }

  if (leaking(deck, d)) {
    if (d.steps % O2_STEPS_PER_HP === 0 && d.hp > 1) d = { ...d, hp: d.hp - 1 };
    if (d.steps % 40 === 0) events.push({ type: 'toast', text: deck.def.leak ?? 'Air quality critical.', tone: 'warn' });
  }

  return { data: d, events, moved: true };
}

/* ---------------- BOLT scan ---------------- */

export function scanArea(data: GameData): Outcome {
  const deck = getDeck(data.deck);
  const d = cloneData(data);
  const events: GameEvent[] = [{ type: 'sfx', id: 'scan' }, { type: 'scanfx' }];
  spendTime(d, SCAN_MINUTES, events);
  let found = 0;
  let remaining = 0;
  for (const ent of deck.entities) {
    if (ent.def.kind !== 'pickup' || !ent.def.hidden) continue;
    if (d.flags[`taken:${ent.id}`] || d.flags[`revealed:${ent.id}`]) continue;
    if (Math.hypot(ent.x - d.pos.x, ent.y - d.pos.y) <= SCAN_RADIUS) {
      d.flags[`revealed:${ent.id}`] = 1;
      found += 1;
    } else {
      remaining += 1;
    }
  }
  let text = found
    ? `BOLT: "Scan complete. ${found} hidden signature${found > 1 ? 's' : ''} revealed nearby!"`
    : 'BOLT: "Scan complete. Nothing hidden around here."';
  if (remaining) text += ` (${remaining} faint signal${remaining > 1 ? 's' : ''} elsewhere on this deck.)`;
  events.push({ type: 'toast', text, tone: 'bolt' });
  return { data: d, events };
}

/* ---------------- travel ---------------- */

export function travelTo(data: GameData, deckId: DeckId): Outcome {
  const deck = getDeck(deckId);
  const d = cloneData(data);
  const events: GameEvent[] = [{ type: 'sfx', id: 'elevator' }];
  d.deck = deckId;
  d.pos = { ...deck.spawn };
  d.boltPos = { ...deck.spawn };
  d.facing = 'up';
  spendTime(d, ELEVATOR_MINUTES, events);
  if (!d.flags[`visited:${deckId}`]) {
    d.flags[`visited:${deckId}`] = 1;
    if (deck.def.arrival) events.push({ type: 'dialogue', id: deck.def.arrival });
  }
  return { data: d, events };
}

/* ---------------- items outside battle ---------------- */

export function canUseFieldItem(d: GameData, item: ItemId): boolean {
  if ((d.inventory[item] ?? 0) <= 0 || !ITEMS[item].field) return false;
  if (item === 'repair_kit') return d.hp < kaiMaxHp(d.level);
  if (item === 'spares') return !!d.flags.bolt_joined && d.boltHp < boltMaxHp(d.level, d.modules);
  return false;
}

export function applyFieldItem(data: GameData, item: ItemId): Outcome {
  if (!canUseFieldItem(data, item)) return { data, events: [] };
  const d = cloneData(data);
  d.inventory[item] = (d.inventory[item] ?? 0) - 1;
  if (!d.inventory[item]) delete d.inventory[item];
  const events: GameEvent[] = [{ type: 'sfx', id: 'heal' }];
  if (item === 'repair_kit') {
    const max = kaiMaxHp(d.level);
    const amt = Math.min(max - d.hp, Math.round(max * 0.45));
    d.hp += amt;
    events.push({ type: 'toast', text: `Repair Kit used: +${amt} HP`, tone: 'good' });
  } else if (item === 'spares') {
    const max = boltMaxHp(d.level, d.modules);
    const amt = Math.min(max - d.boltHp, Math.round(max * 0.6));
    d.boltHp += amt;
    events.push({ type: 'toast', text: `BOLT repaired: +${amt} HP`, tone: 'bolt' });
  }
  return { data: d, events };
}

/* ---------------- battle results ---------------- */

export function battleMinutes(result: BattleResult): number {
  return BATTLE_BASE_MINUTES + result.rounds * BATTLE_ROUND_MINUTES + (result.outcome === 'fled' ? FLEE_MINUTES : 0);
}

export function applyBattleResult(data: GameData, enc: Encounter, result: BattleResult): Outcome {
  let d = cloneData(data);
  const events: GameEvent[] = [];
  d.hp = Math.max(1, Math.min(kaiMaxHp(d.level), result.kaiHp));
  if (d.flags.bolt_joined) {
    const bmax = boltMaxHp(d.level, d.modules);
    if (result.boltHp <= 0) {
      d.boltHp = Math.round(bmax * 0.25);
      events.push({ type: 'toast', text: 'BOLT reboots with a sad beep. (25% HP)', tone: 'bolt' });
    } else {
      d.boltHp = Math.min(bmax, result.boltHp);
    }
  }
  const inv: GameData['inventory'] = {};
  for (const [k, v] of Object.entries(result.inventory) as [ItemId, number][]) if (v > 0) inv[k] = v;
  d.inventory = inv;
  d.weapon = result.weapon;
  d.battles += 1;
  d.kills += result.kills;
  spendTime(d, battleMinutes(result), events);

  if (result.outcome === 'fled') {
    d.pos = { ...enc.returnPos };
    events.push({ type: 'toast', text: 'You slipped away. The threat remains.', tone: 'warn' });
    return { data: d, events };
  }
  if (result.outcome === 'victory' || result.outcome === 'communed') {
    d.flags[`defeated:${enc.id}`] = 1;
  }
  if (result.outcome === 'victory' && result.rewards) {
    const r = result.rewards;
    const parts: string[] = [];
    if (r.xp) parts.push(`+${r.xp} XP`);
    if (r.scrap) {
      d.scrap += r.scrap;
      parts.push(`+${r.scrap} scrap`);
    }
    for (const [item, qty] of Object.entries(r.items) as [ItemId, number][]) {
      d.inventory[item] = (d.inventory[item] ?? 0) + qty;
      parts.push(`${ITEMS[item].name}${qty > 1 ? ` x${qty}` : ''}`);
    }
    if (parts.length) events.push({ type: 'toast', text: parts.join('  '), tone: 'good' });
    addXp(d, r.xp, events);
    if (enc.onWin?.length) {
      const res = applyEffects(d, enc.onWin, ctxFor(d, enc.id));
      d = res.data;
      events.push(...res.events);
    }
    if (enc.outro) events.push({ type: 'dialogue', id: enc.outro, self: enc.id });
  }
  return { data: d, events };
}
