import { CELL, STEP_H, WALL_H } from '../core/constants';
import type { Cell, LevelDef, ParsedLevel, PlacedEntity, Spec, TileKind } from './levelTypes';

/** Markers every deck understands. Deck legends can override them. */
export const DEFAULT_LEGEND: Record<string, Spec> = {
  '@': { type: 'spawn' },
  o: { type: 'bolt' },
  x: { type: 'crate' },
  X: { type: 'crate', loot: 'big', metal: true },
  h: { type: 'heart' },
  '=': { type: 'energy' },
  b: { type: 'bounce' },
  f: { type: 'faller' },
  '%': { type: 'dark' },
};

const TILE_CHARS: Record<string, { kind: TileKind; h: number }> = {
  ' ': { kind: 'void', h: 0 },
  '#': { kind: 'wall', h: 0 },
  '.': { kind: 'floor', h: 0 },
  '~': { kind: 'hazard', h: -0.35 },
  _: { kind: 'ice', h: 0 },
  ',': { kind: 'grate', h: 0 },
};
for (let i = 1; i <= 9; i++) TILE_CHARS[String(i)] = { kind: 'floor', h: i * STEP_H };

const DARK_LIMIT = 900;

export class Grid {
  constructor(
    readonly width: number,
    readonly depth: number,
    readonly cells: Cell[],
  ) {}

  inside(cx: number, cz: number) {
    return cx >= 0 && cz >= 0 && cx < this.width && cz < this.depth;
  }

  cell(cx: number, cz: number): Cell {
    if (!this.inside(cx, cz)) return { kind: 'void', h: 0, dark: false };
    return this.cells[cz * this.width + cx];
  }

  /** Height that blocks sideways movement: walls are infinitely tall, voids never block. */
  obstacleTop(cx: number, cz: number): number {
    const c = this.cell(cx, cz);
    if (c.kind === 'wall') return Infinity;
    if (c.kind === 'void') return -Infinity;
    return c.h;
  }

  /** Height you can stand on, or -Infinity for walls and voids. */
  standTop(cx: number, cz: number): number {
    const c = this.cell(cx, cz);
    if (c.kind === 'wall' || c.kind === 'void') return -Infinity;
    return c.h;
  }

  static toCell(v: number) {
    return Math.floor(v / CELL);
  }

  static center(c: number) {
    return c * CELL + CELL / 2;
  }
}

/** Height and tile kind most common among a marker's walkable neighbours. */
function majority(rows: string[], x: number, z: number): { h: number; kind: TileKind } {
  const counts = new Map<string, number>();
  for (const [dx, dz] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    const ch = rows[z + dz]?.[x + dx];
    const t = ch !== undefined ? TILE_CHARS[ch] : undefined;
    if (t && (t.kind === 'floor' || t.kind === 'ice' || t.kind === 'grate')) {
      const key = `${t.kind}|${t.h}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  let best = 'floor|0';
  let bestN = 0;
  for (const [key, n] of counts) {
    const h = Number(key.split('|')[1]);
    if (n > bestN || (n === bestN && h > Number(best.split('|')[1]))) {
      best = key;
      bestN = n;
    }
  }
  const [kind, h] = best.split('|');
  return { h: Number(h), kind: kind as TileKind };
}

export function parseLevel(def: LevelDef): ParsedLevel {
  const rows = def.map.split('\n').map((r) => r.replace(/\r$/, ''));
  while (rows.length && rows[0].trim() === '') rows.shift();
  while (rows.length && rows[rows.length - 1].trim() === '') rows.pop();
  const depth = rows.length;
  const width = Math.max(...rows.map((r) => r.length));
  const cells: Cell[] = [];
  const legend = { ...DEFAULT_LEGEND, ...def.legend };
  const placed: { spec: Spec; cx: number; cz: number; ch: string; h: number }[] = [];
  const counts: Record<string, number> = {};
  const darkSeeds: [number, number][] = [];
  let spawn: ParsedLevel['spawn'] | null = null;

  for (let z = 0; z < depth; z++) {
    for (let x = 0; x < width; x++) {
      const ch = rows[z][x] ?? ' ';
      const tile = TILE_CHARS[ch];
      if (tile) {
        cells.push({ kind: tile.kind, h: tile.h, dark: false });
        continue;
      }
      const spec = legend[ch];
      if (!spec) throw new Error(`${def.id}: unknown map character '${ch}' at ${x},${z}`);
      const near = majority(rows, x, z);
      const floor: TileKind = spec.floor ?? (spec.type === 'platform' || spec.type === 'faller' ? 'void' : near.kind);
      const h = spec.h ?? near.h;
      cells.push({ kind: floor, h: floor === 'hazard' ? -0.35 : h, dark: false });
      if (spec.type === 'spawn') {
        if (spawn) throw new Error(`${def.id}: two spawn points`);
        spawn = { cx: x, cz: z, h, facing: spec.facing ?? Math.PI };
      } else if (spec.type === 'dark') {
        darkSeeds.push([x, z]);
      } else {
        placed.push({ spec, cx: x, cz: z, ch, h });
        counts[ch] = (counts[ch] ?? 0) + 1;
      }
    }
  }
  if (!spawn) throw new Error(`${def.id}: no spawn point`);

  for (let z = 0; z < depth; z++) {
    for (let x = 0; x < width; x++) {
      const c = cells[z * width + x];
      if (c.kind !== 'wall') continue;
      let top = 0;
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const nz = z + dz;
          if (nx < 0 || nz < 0 || nx >= width || nz >= depth) continue;
          const n = cells[nz * width + nx];
          if (n.kind !== 'wall' && n.kind !== 'void') top = Math.max(top, n.h);
        }
      }
      c.h = top + WALL_H;
    }
  }

  const entities: PlacedEntity[] = placed.map((p) => {
    const explicit = 'id' in p.spec && typeof p.spec.id === 'string' ? p.spec.id : null;
    const id = explicit && counts[p.ch] === 1 ? `${def.id}.${explicit}` : `${def.id}.${explicit ?? p.spec.type}@${p.cx},${p.cz}`;
    return { id, spec: p.spec, cx: p.cx, cz: p.cz, h: p.h };
  });
  const seen = new Set<string>();
  for (const e of entities) {
    if (seen.has(e.id)) throw new Error(`${def.id}: duplicate entity id ${e.id}`);
    seen.add(e.id);
  }

  const doorCells = new Set(entities.filter((e) => e.spec.type === 'door').map((e) => e.cz * width + e.cx));
  for (const [sx, sz] of darkSeeds) {
    const stack = [sz * width + sx];
    let filled = 0;
    while (stack.length) {
      const idx = stack.pop() as number;
      const c = cells[idx];
      if (c.dark || c.kind === 'wall' || doorCells.has(idx)) continue;
      c.dark = true;
      filled += 1;
      if (filled > DARK_LIMIT) throw new Error(`${def.id}: dark region at ${sx},${sz} leaks`);
      const x = idx % width;
      const z = Math.floor(idx / width);
      if (x > 0) stack.push(idx - 1);
      if (x < width - 1) stack.push(idx + 1);
      if (z > 0) stack.push(idx - width);
      if (z < depth - 1) stack.push(idx + width);
    }
  }

  return { def, width, depth, cells, entities, spawn };
}
