import { DECK_ORDER } from '../src/game/constants';
import { ITEMS, MODULES, WEAPONS } from '../src/game/data/catalog';
import { DECK_DEFS, getDeck } from '../src/game/data/decks';
import { DIALOGUES } from '../src/game/data/dialogue';
import { ENEMIES } from '../src/game/data/enemies';
import { LOGS, MEMORIES, SURVIVORS } from '../src/game/data/story';
import { newGameData, travelTo } from '../src/game/engine/explore';
import { entitiesAt, tileAt, WALKABLE } from '../src/game/engine/mapParser';
import { applyEffects, evalCondition, type GameEvent } from '../src/game/engine/rules';
import type { Condition, DeckId, DialogueTree, DoorLock, Effect, EndingId, GameData, MapEntity } from '../src/game/types';

function checkEffect(fx: Effect, where: string) {
  switch (fx.type) {
    case 'item':
      expect(ITEMS[fx.id]).toBeDefined();
      break;
    case 'weapon':
      expect(WEAPONS[fx.id]).toBeDefined();
      break;
    case 'module':
      expect(MODULES[fx.id]).toBeDefined();
      break;
    case 'memory':
      expect(MEMORIES[fx.id]).toBeDefined();
      break;
    case 'log':
      if (!LOGS[fx.id]) throw new Error(`${where}: unknown log ${fx.id}`);
      break;
    case 'survivor':
      if (!SURVIVORS[fx.id]) throw new Error(`${where}: unknown survivor ${fx.id}`);
      break;
    case 'dialogue':
      if (!DIALOGUES[fx.id]) throw new Error(`${where}: unknown dialogue ${fx.id}`);
      break;
    case 'travel':
      expect(DECK_DEFS[fx.deck]).toBeDefined();
      break;
    case 'battle':
      for (const e of fx.enemies) expect(ENEMIES[e]).toBeDefined();
      break;
    default:
      break;
  }
}

function checkCondition(c: Condition | undefined, where: string) {
  if (!c) return;
  if ('item' in c && !ITEMS[c.item]) throw new Error(`${where}: unknown item ${c.item}`);
  if ('module' in c && !MODULES[c.module]) throw new Error(`${where}: unknown module ${c.module}`);
  if ('all' in c) c.all.forEach((x) => checkCondition(x, where));
  if ('any' in c) c.any.forEach((x) => checkCondition(x, where));
  if ('not' in c) checkCondition(c.not, where);
}

describe('dialogue trees', () => {
  for (const tree of Object.values(DIALOGUES)) {
    test(tree.id, () => {
      expect(tree.nodes[tree.start]).toBeDefined();
      const targets = new Set<string>();
      for (const [id, node] of Object.entries(tree.nodes)) {
        const where = `${tree.id}.${id}`;
        const outs = [node.next, ...(node.jump ?? []).map((j) => j.to), ...(node.choices ?? []).map((c) => c.next)].filter(
          (x): x is string => !!x,
        );
        for (const o of outs) {
          if (!tree.nodes[o]) throw new Error(`${where}: missing target node ${o}`);
          targets.add(o);
        }
        if (node.text) {
          const terminal = node.end || node.next || node.jump?.length || node.choices?.length;
          if (!terminal) throw new Error(`${where}: text node with no way forward`);
        } else if (!node.jump?.length && !node.next && !node.end) {
          throw new Error(`${where}: router node without jump/next`);
        }
        for (const fx of node.effects ?? []) checkEffect(fx, where);
        for (const j of node.jump ?? []) checkCondition(j.if, where);
        for (const c of node.choices ?? []) {
          checkCondition(c.if, where);
          for (const fx of c.effects ?? []) checkEffect(fx, where);
          if (!c.end && !c.next) {
            // a choice without next closes the dialogue, which is allowed
          }
        }
      }
      for (const id of Object.keys(tree.nodes)) {
        if (id !== tree.start && !targets.has(id)) throw new Error(`${tree.id}.${id}: unreachable node`);
      }
    });
  }
});

describe('decks', () => {
  for (const id of DECK_ORDER) {
    test(`${id} references resolve`, () => {
      const deck = getDeck(id);
      if (deck.def.arrival) expect(DIALOGUES[deck.def.arrival]).toBeDefined();
      expect(WALKABLE[tileAt(deck, deck.spawn.x, deck.spawn.y)]).toBe(true);
      for (const e of deck.entities) {
        const where = `${e.id}`;
        switch (e.def.kind) {
          case 'object':
          case 'trigger':
            if (!DIALOGUES[e.def.dialogue]) throw new Error(`${where}: missing dialogue ${e.def.dialogue}`);
            break;
          case 'enemy':
            e.def.enemies.forEach((x) => expect(ENEMIES[x]).toBeDefined());
            if (e.def.intro && !DIALOGUES[e.def.intro]) throw new Error(`${where}: missing intro ${e.def.intro}`);
            if (e.def.outro && !DIALOGUES[e.def.outro]) throw new Error(`${where}: missing outro ${e.def.outro}`);
            (e.def.onWin ?? []).forEach((fx) => checkEffect(fx, where));
            break;
          case 'pickup':
            e.def.give.forEach((fx) => checkEffect(fx, where));
            if (e.def.dialogue && !DIALOGUES[e.def.dialogue]) throw new Error(`${where}: missing dialogue`);
            break;
          default:
            break;
        }
      }
      const darkCount = deck.dark.reduce((a, b) => a + b, 0);
      expect(darkCount).toBeLessThan(deck.width * deck.height * 0.4);
    });
  }

  test('every log is placed exactly once', () => {
    const placed: string[] = [];
    for (const id of DECK_ORDER) {
      for (const e of getDeck(id).entities) {
        if (e.def.kind === 'pickup') for (const fx of e.def.give) if (fx.type === 'log') placed.push(fx.id);
      }
    }
    expect(placed.sort()).toEqual(Object.keys(LOGS).sort());
  });

  test('every memory except the first is placed exactly once', () => {
    const placed: string[] = [];
    for (const id of DECK_ORDER) {
      for (const e of getDeck(id).entities) {
        if (e.def.kind === 'pickup') for (const fx of e.def.give) if (fx.type === 'memory') placed.push(fx.id);
      }
    }
    expect(placed.sort()).toEqual(['mem2', 'mem3', 'mem4', 'mem5', 'mem6']);
  });
});

/* ---------------- progression solver ---------------- */

const POSITIVE = (fx: Effect) => !((fx.type === 'item' || fx.type === 'scrap') && (fx.qty ?? 1) < 0);

interface Solve {
  data: GameData;
  travels: Set<DeckId>;
  endings: Set<EndingId>;
  unreached: string[];
}

function lockOk(lock: DoorLock | undefined, d: GameData): boolean {
  if (!lock) return true;
  switch (lock.type) {
    case 'none':
      return true;
    case 'maint':
      return !!d.flags.bolt_joined;
    case 'security':
      return d.modules.includes('hack');
    case 'bloom':
      return d.weapons.includes('cutter');
    case 'keycard':
      return (d.inventory[lock.item] ?? 0) > 0;
    case 'flag':
      return !!d.flags[lock.flag];
  }
}

function solveDeck(start: GameData): Solve {
  let d = start;
  const deck = getDeck(d.deck);
  const travels = new Set<DeckId>();
  const endings = new Set<EndingId>();
  const exploredNodes = new Set<string>();

  const runEvents = (events: GameEvent[]) => {
    for (const ev of events) {
      if (ev.type === 'travel') travels.add(ev.deck);
      if (ev.type === 'ending') endings.add(ev.id);
      if (ev.type === 'dialogue') explore(DIALOGUES[ev.id], ev.self);
    }
  };

  const apply = (effects: Effect[] | undefined, self?: string) => {
    const r = applyEffects(d, (effects ?? []).filter(POSITIVE), { deck: d.deck, self });
    d = r.data;
    runEvents(r.events);
  };

  function explore(tree: DialogueTree | undefined, self?: string) {
    if (!tree) return;
    const stack = [tree.start];
    const seen = new Set<string>();
    while (stack.length) {
      const nid = stack.pop() as string;
      if (seen.has(nid)) continue;
      seen.add(nid);
      const node = tree.nodes[nid];
      if (!node) continue;
      const key = `${tree.id}.${nid}.${self ?? ''}`;
      if (!exploredNodes.has(key)) {
        exploredNodes.add(key);
        apply(node.effects, self);
      }
      const ctx = { deck: d.deck, self };
      for (const j of node.jump ?? []) if (evalCondition(j.if, d, ctx)) stack.push(j.to);
      if (node.next) stack.push(node.next);
      for (const c of node.choices ?? []) {
        if (!evalCondition(c.if, d, ctx)) continue;
        const ckey = `${tree.id}.${nid}.choice.${c.text}.${self ?? ''}`;
        if (!exploredNodes.has(ckey)) {
          exploredNodes.add(ckey);
          apply(c.effects, self);
        }
        if (c.next) stack.push(c.next);
      }
    }
  }

  if (deck.def.arrival) explore(DIALOGUES[deck.def.arrival]);

  const handled = new Set<string>();
  let progress = true;
  let reached = new Set<number>();
  while (progress) {
    progress = false;
    const before = JSON.stringify([d.flags, d.inventory, d.modules, d.weapons, d.memories]);
    reached = new Set<number>([deck.spawn.y * deck.width + deck.spawn.x]);
    const queue = [deck.spawn];
    while (queue.length) {
      const cur = queue.shift() as { x: number; y: number };
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = cur.x + dx;
        const ny = cur.y + dy;
        const idx = ny * deck.width + nx;
        if (nx < 0 || ny < 0 || nx >= deck.width || ny >= deck.height || reached.has(idx)) continue;
        const ents: MapEntity[] = entitiesAt(deck, nx, ny);
        let passable = WALKABLE[tileAt(deck, nx, ny)];
        for (const e of ents) {
          if (e.def.kind === 'door') {
            if (!lockOk(e.def.lock, d)) passable = false;
          } else if (e.def.kind === 'enemy') {
            if (!handled.has(e.id)) {
              handled.add(e.id);
              if (e.def.intro) explore(DIALOGUES[e.def.intro], e.id);
              const nd = { ...d, flags: { ...d.flags, [`defeated:${e.id}`]: 1 } };
              d = nd;
              apply(e.def.onWin, e.id);
              if (e.def.outro) explore(DIALOGUES[e.def.outro], e.id);
            }
          } else if (e.def.kind === 'object') {
            const visible = !e.def.showIf || evalCondition(e.def.showIf, d, { deck: d.deck, self: e.id });
            if (visible) {
              explore(DIALOGUES[e.def.dialogue], e.id);
              passable = false;
            }
          }
        }
        if (!passable) continue;
        reached.add(idx);
        queue.push({ x: nx, y: ny });
        for (const e of ents) {
          if (e.def.kind === 'pickup' && !handled.has(e.id)) {
            handled.add(e.id);
            d = { ...d, flags: { ...d.flags, [`taken:${e.id}`]: 1 } };
            apply(e.def.give, e.id);
            if (e.def.dialogue) explore(DIALOGUES[e.def.dialogue], e.id);
          }
          if (e.def.kind === 'trigger' && !handled.has(e.id)) {
            if (!e.def.if || evalCondition(e.def.if, d, { deck: d.deck, self: e.id })) {
              handled.add(e.id);
              explore(DIALOGUES[e.def.dialogue], e.id);
            }
          }
        }
      }
    }
    const after = JSON.stringify([d.flags, d.inventory, d.modules, d.weapons, d.memories]);
    if (after !== before) progress = true;
  }
  const unreached = deck.entities
    .filter((e) => (e.def.kind === 'pickup' || e.def.kind === 'enemy') && !handled.has(e.id))
    .map((e) => e.id);
  return { data: d, travels, endings, unreached };
}

describe('progression', () => {
  test('the whole game can be completed, with every pickup and survivor reachable', () => {
    let data = newGameData();
    data.minutesLeft = 1e9;
    const report: string[] = [];
    for (let i = 0; i < DECK_ORDER.length; i++) {
      const id = DECK_ORDER[i];
      const res = solveDeck(data);
      data = res.data;
      report.push(`${id}: modules=${data.modules.join(',')} weapons=${data.weapons.join(',')} memories=${data.memories.length}`);
      expect({ deck: id, unreached: res.unreached }).toEqual({ deck: id, unreached: [] });
      const next = DECK_ORDER[i + 1];
      if (next) {
        expect({ deck: id, canTravel: res.travels.has(next) }).toEqual({ deck: id, canTravel: true });
        data = travelTo(data, next).data;
      } else {
        expect(res.endings.has('escape')).toBe(true);
        expect(res.endings.has('saved')).toBe(true);
      }
    }
    expect(data.memories.length).toBe(6);
    expect(data.modules).toEqual(expect.arrayContaining(['floodlight', 'hack', 'shield', 'decoy', 'nanites', 'overcharge']));
    expect(data.weapons.sort()).toEqual(['cutter', 'rifle', 'wrench']);
    expect(data.survivors.sort()).toEqual(Object.keys(SURVIVORS).sort());
    expect(data.logs.length).toBe(Object.keys(LOGS).length);
    expect(data.flags.language_known).toBe(1);
    console.log(report.join('\n'));
  });
});
