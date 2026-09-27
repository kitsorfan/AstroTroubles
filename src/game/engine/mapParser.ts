import type { DeckDef, EntityDef, MapEntity, ParsedDeck, TileKind, Vec } from '../types';

export const TILE_CHARS: Record<string, TileKind> = {
  ' ': 'void',
  '#': 'wall',
  '.': 'floor',
  ',': 'grate',
  _: 'carpet',
  '"': 'soil',
  '~': 'vent',
  '%': 'bloom',
  '=': 'window',
  '+': 'machine',
  '*': 'pod',
  '^': 'plant',
  $: 'crate',
  '!': 'console',
  ':': 'water',
  ';': 'rubble',
  '&': 'pit',
  '|': 'pillar',
  '[': 'bed',
  '-': 'catwalk',
};

export const WALKABLE: Record<TileKind, boolean> = {
  void: false,
  wall: false,
  floor: true,
  grate: true,
  carpet: true,
  soil: true,
  vent: true,
  bloom: true,
  window: false,
  machine: false,
  pod: false,
  plant: false,
  crate: false,
  console: false,
  water: false,
  rubble: false,
  pit: false,
  pillar: false,
  bed: false,
  catwalk: true,
};

/** Markers shared by every deck. */
export const GLOBAL_MARKERS: Record<string, EntityDef> = {
  '@': { kind: 'spawn' },
  X: { kind: 'dark' },
  D: { kind: 'door', lock: { type: 'none' } },
  M: { kind: 'door', lock: { type: 'maint' } },
  S: { kind: 'door', lock: { type: 'security' } },
  B: { kind: 'door', lock: { type: 'bloom' } },
  H: { kind: 'object', id: 'med', sprite: 'medstation', dialogue: 'medstation', name: 'Med Station' },
  O: { kind: 'object', id: 'breach', sprite: 'breach', dialogue: 'breach', name: 'Hull Breach' },
};

const LIGHT_BLOCKING: ReadonlySet<TileKind> = new Set(['wall', 'void', 'window']);
const BLEND_EXCLUDE: ReadonlySet<TileKind> = new Set(['vent', 'bloom']);

function baseId(def: EntityDef): string {
  switch (def.kind) {
    case 'door':
      return def.id ?? 'door';
    case 'spawn':
      return 'spawn';
    case 'dark':
      return 'dark';
    default:
      return def.id;
  }
}

export function parseDeck(def: DeckDef): ParsedDeck {
  const lines = def.map.split('\n').map((l) => l.replace(/\r$/, ''));
  while (lines.length && lines[0].trim() === '') lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  const height = lines.length;
  const width = Math.max(...lines.map((l) => l.length));
  const tiles: TileKind[] = new Array(width * height).fill('void');
  const placed: { x: number; y: number; def: EntityDef; ch: string }[] = [];
  const markerCounts: Record<string, number> = {};
  const entityTiles: number[] = [];
  let spawn: Vec | null = null;
  const darkSeeds: Vec[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const ch = lines[y][x] ?? ' ';
      const idx = y * width + x;
      const tile = TILE_CHARS[ch];
      if (tile) {
        tiles[idx] = tile;
        continue;
      }
      const ent = def.legend[ch] ?? GLOBAL_MARKERS[ch];
      if (!ent) throw new Error(`Deck ${def.id}: unknown map character '${ch}' at ${x},${y}`);
      tiles[idx] = 'floor';
      entityTiles.push(idx);
      if (ent.kind === 'spawn') {
        if (spawn) throw new Error(`Deck ${def.id}: multiple spawn points`);
        spawn = { x, y };
      } else if (ent.kind === 'dark') {
        darkSeeds.push({ x, y });
      } else {
        placed.push({ x, y, def: ent, ch });
        markerCounts[ch] = (markerCounts[ch] ?? 0) + 1;
      }
    }
  }
  if (!spawn) throw new Error(`Deck ${def.id}: no spawn point`);

  for (const idx of entityTiles) {
    const x = idx % width;
    const y = Math.floor(idx / width);
    const counts: Partial<Record<TileKind, number>> = {};
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const t = tiles[ny * width + nx];
      if (WALKABLE[t] && !BLEND_EXCLUDE.has(t)) counts[t] = (counts[t] ?? 0) + 1;
    }
    let best: TileKind = 'floor';
    let bestN = 0;
    for (const [k, n] of Object.entries(counts) as [TileKind, number][]) {
      if (n > bestN) {
        best = k;
        bestN = n;
      }
    }
    tiles[idx] = best;
  }

  const entities: MapEntity[] = placed.map((p) => {
    const b = baseId(p.def);
    const unique = markerCounts[p.ch] === 1 && b !== 'door' && b !== 'med' && b !== 'breach';
    const id = unique ? `${def.id}.${b}` : `${def.id}.${b}@${p.x},${p.y}`;
    return { id, x: p.x, y: p.y, def: p.def };
  });
  const ids = new Set<string>();
  for (const e of entities) {
    if (ids.has(e.id)) throw new Error(`Deck ${def.id}: duplicate entity id ${e.id}`);
    ids.add(e.id);
  }

  const byTile = new Map<number, MapEntity[]>();
  for (const e of entities) {
    const idx = e.y * width + e.x;
    const list = byTile.get(idx);
    if (list) list.push(e);
    else byTile.set(idx, [e]);
  }

  const dark = new Uint8Array(width * height);
  const doorTiles = new Set(entities.filter((e) => e.def.kind === 'door').map((e) => e.y * width + e.x));
  for (const seed of darkSeeds) {
    const queue = [seed.y * width + seed.x];
    dark[queue[0]] = 1;
    while (queue.length) {
      const idx = queue.pop() as number;
      const x = idx % width;
      const y = Math.floor(idx / width);
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const n = ny * width + nx;
        if (dark[n] || LIGHT_BLOCKING.has(tiles[n]) || doorTiles.has(n)) continue;
        dark[n] = 1;
        queue.push(n);
      }
    }
  }

  return { id: def.id, def, width, height, tiles, entities, byTile, spawn, dark };
}

export function tileAt(deck: ParsedDeck, x: number, y: number): TileKind {
  if (x < 0 || y < 0 || x >= deck.width || y >= deck.height) return 'void';
  return deck.tiles[y * deck.width + x];
}

export function entitiesAt(deck: ParsedDeck, x: number, y: number): MapEntity[] {
  if (x < 0 || y < 0 || x >= deck.width || y >= deck.height) return [];
  return deck.byTile.get(y * deck.width + x) ?? [];
}
