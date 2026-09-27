// Dev tool: estimates reactor time spent on each deck's main path.
// Run: npx jest --rootDir . --testMatch "<rootDir>/scripts/time-budget.test.ts"
import { getDeck } from '../src/game/data/decks';
import { entitiesAt, tileAt, WALKABLE } from '../src/game/engine/mapParser';
import type { DeckId, ParsedDeck } from '../src/game/types';

function dist(deck: ParsedDeck, from: { x: number; y: number }, to: { x: number; y: number }): number {
  const key = (x: number, y: number) => y * deck.width + x;
  const seen = new Map<number, number>([[key(from.x, from.y), 0]]);
  const q = [from];
  while (q.length) {
    const c = q.shift() as { x: number; y: number };
    const d = seen.get(key(c.x, c.y)) as number;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = c.x + dx;
      const ny = c.y + dy;
      if (nx === to.x && ny === to.y) return d + 1;
      if (seen.has(key(nx, ny))) continue;
      const solid = entitiesAt(deck, nx, ny).some((e) => e.def.kind === 'object');
      if (!WALKABLE[tileAt(deck, nx, ny)] || solid) continue;
      seen.set(key(nx, ny), d + 1);
      q.push({ x: nx, y: ny });
    }
  }
  return Infinity;
}

const ROUTES: Record<DeckId, { stops: string[]; repair: number; fights: number; hacks: number }> = {
  cryo: { stops: ['bolt_broken', 'door@4,11', 'tunnel_crawler', 'hall_crawlers', 'warden', 'relay', 'lift'], repair: 60, fights: 3, hacks: 10 },
  hydro: { stops: ['office_guard', 'hack', 'door@26,9', 'cutter', 'door@15,7', 'vine', 'pumps', 'lift'], repair: 150, fights: 2, hacks: 30 },
  engine: { stops: ['door@8,17', 'tunnel_welders', 'floodlight', 'titan', 'valve', 'lift'], repair: 240, fights: 2, hacks: 10 },
  habitat: { stops: ['door@16,5', 'decoy', 'theater_guard', 'matron', 'junction', 'lift'], repair: 180, fights: 2, hacks: 0 },
  security: { stops: ['tanaka', 'armory_door', 'rifle', 'door@26,9', 'corridor_guard', 'wardog', 'override', 'lift'], repair: 150, fights: 2, hacks: 0 },
  bridge: { stops: ['gate_sentinels', 'door@15,8', 'heart'], repair: 0, fights: 2, hacks: 10 },
};

test('main path time budget', () => {
  let total = 0;
  const lines: string[] = [];
  for (const [id, route] of Object.entries(ROUTES) as [DeckId, (typeof ROUTES)[DeckId]][]) {
    const deck = getDeck(id);
    let pos = deck.spawn;
    let steps = 0;
    for (const stop of route.stops) {
      const e = deck.entities.find((x) => x.id === `${id}.${stop}`);
      if (!e) throw new Error(`${id}: no ${stop}`);
      steps += dist(deck, pos, e);
      pos = { x: e.x, y: e.y };
    }
    const battles = route.fights * (8 + 6 * 2) + (id === 'bridge' ? 0 : 1) * (8 + 10 * 2);
    const minutes = steps + route.repair + battles + route.hacks + (id === 'bridge' ? 0 : 30);
    total += minutes;
    lines.push(`${id}: ${steps} steps, ~${minutes} min (${(minutes / 60).toFixed(1)} h)`);
  }
  lines.push(`TOTAL main path ≈ ${(total / 60).toFixed(1)} h of 72 h`);
  console.log(lines.join('\n'));
});
