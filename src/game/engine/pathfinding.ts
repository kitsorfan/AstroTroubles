import type { Dir, GameData, MapEntity, ParsedDeck, Vec } from '../types';
import { DIRS, isBlocking, ventsActive } from './explore';
import { entitiesAt, tileAt, WALKABLE } from './mapParser';

const ORDER: Dir[] = ['up', 'down', 'left', 'right'];

/** Closed doors that swing open (and let Kai through) as soon as he walks into them. */
function opensOnContact(e: MapEntity, d: GameData): boolean {
  if (e.def.kind !== 'door') return false;
  const lock = e.def.lock;
  if (!lock || lock.type === 'none') return true;
  if (lock.type === 'keycard') return (d.inventory[lock.item] ?? 0) > 0;
  if (lock.type === 'flag') return !!d.flags[lock.flag];
  return false;
}

/**
 * Shortest 4-way path to `to`. If the target tile holds something interactive (door, enemy, object)
 * the final step bumps into it. Active heat vents are avoided when any other route exists.
 */
export function findPath(deck: ParsedDeck, d: GameData, to: Vec): Dir[] | null {
  const from = d.pos;
  if (from.x === to.x && from.y === to.y) return null;
  if (to.x < 0 || to.y < 0 || to.x >= deck.width || to.y >= deck.height) return null;
  const targetInteractive = entitiesAt(deck, to.x, to.y).some((e) => isBlocking(e, d));
  const blockedAt = (x: number, y: number) => entitiesAt(deck, x, y).some((e) => isBlocking(e, d) && !opensOnContact(e, d));
  if (!targetInteractive && !WALKABLE[tileAt(deck, to.x, to.y)]) return null;

  const passes = ventsActive(deck, d) ? [false, true] : [true];
  for (const allowVents of passes) {
    const w = deck.width;
    const start = from.y * w + from.x;
    const goal = to.y * w + to.x;
    const prev = new Map<number, [number, Dir]>();
    const seen = new Set<number>([start]);
    const queue: number[] = [start];
    let found = false;
    for (let qi = 0; qi < queue.length && !found; qi++) {
      const cur = queue[qi];
      const cx = cur % w;
      const cy = Math.floor(cur / w);
      for (const dir of ORDER) {
        const nx = cx + DIRS[dir].x;
        const ny = cy + DIRS[dir].y;
        if (nx < 0 || ny < 0 || nx >= deck.width || ny >= deck.height) continue;
        const n = ny * w + nx;
        if (seen.has(n)) continue;
        if (n === goal) {
          prev.set(n, [cur, dir]);
          found = true;
          break;
        }
        const tile = tileAt(deck, nx, ny);
        if (!WALKABLE[tile] || blockedAt(nx, ny)) continue;
        if (!allowVents && tile === 'vent') continue;
        seen.add(n);
        prev.set(n, [cur, dir]);
        queue.push(n);
      }
    }
    if (!found) continue;
    const path: Dir[] = [];
    let node = goal;
    while (node !== start) {
      const step = prev.get(node);
      if (!step) return null;
      path.push(step[1]);
      node = step[0];
    }
    return path.reverse();
  }
  return null;
}
