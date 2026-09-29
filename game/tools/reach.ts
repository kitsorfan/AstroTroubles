/**
 * Level reachability checker.
 *
 * Models Kai's movement envelope (walk, jump, jet boots, dash, hover, bounce pads, vents and
 * moving platforms) on a level grid and reports which entities cannot be reached from the spawn.
 * Doors are treated as open: the checker proves the geometry works, the level's conditions
 * decide the order.
 */
import { CELL, GRAVITY, PLAYER, STEP_UP } from '../src/core/constants';
import type { Ability, Cond, ParsedLevel, PlacedEntity, Spec } from '../src/world/levelTypes';

type SpotKind = 'floor' | 'plat' | 'pad' | 'vent';

interface Spot {
  cx: number;
  cz: number;
  h: number;
  kind: SpotKind;
  group: number;
}

/**
 * Horizontal distance Kai covers is scaled by MARGIN (a safety margin for kids' thumbs); EDGE is how far
 * the take-off and landing spots can sit from the cell centres (world units).
 */
const MARGIN = 0.9;
const EDGE = 1.6;

function flight(v: number, dh: number): number | null {
  const disc = v * v - 2 * GRAVITY * dh;
  if (disc < 0) return null;
  return (v + Math.sqrt(disc)) / GRAVITY;
}

/** Largest centre-to-centre distance (in cells) for a jump that ends `dh` higher. */
export function jumpReach(dh: number, abilities: Ability[], launch: number = PLAYER.jumpV): number {
  const has = (a: Ability) => abilities.includes(a);
  const speed = PLAYER.speed;
  const options: number[] = [];
  const apex1 = (launch * launch) / (2 * GRAVITY);
  const t1 = launch / GRAVITY;
  const dashBonus = has('dash') ? PLAYER.dashSpeed * PLAYER.dashTime - speed * PLAYER.dashTime : 0;

  // Single jump.
  if (dh <= apex1 - 0.3) {
    const t = flight(launch, dh);
    if (t !== null) options.push(speed * t + dashBonus);
    if (has('glide') && dh <= apex1 - 0.3) options.push(speed * (t1 + (apex1 - dh) / PLAYER.glideFall) + dashBonus);
  }
  // Double jump from the apex.
  if (has('doubleJump')) {
    const v2 = PLAYER.doubleJumpV;
    const apex2 = apex1 + (v2 * v2) / (2 * GRAVITY);
    if (dh <= apex2 - 0.3) {
      const t2 = flight(v2, dh - apex1);
      if (t2 !== null) options.push(speed * (t1 + t2) + dashBonus);
      if (has('glide')) options.push(speed * (t1 + v2 / GRAVITY + (apex2 - dh) / PLAYER.glideFall) + dashBonus);
    }
  }
  if (!options.length) return 0;
  const units = Math.max(...options) * MARGIN + EDGE;
  return Math.min(units / CELL, 9);
}

function maxRise(abilities: Ability[], launch: number) {
  let apex = (launch * launch) / (2 * GRAVITY);
  if (abilities.includes('doubleJump')) apex += (PLAYER.doubleJumpV * PLAYER.doubleJumpV) / (2 * GRAVITY);
  return apex - 0.3;
}

const SOLID_DECOR = (s: Spec) => s.type === 'decor' && s.solid !== false;

export interface ReachResult {
  reached: Set<string>;
  spots: Spot[];
  missing: PlacedEntity[];
  /** Walkable cells that can never be reached (often a sign of a broken layout). */
  orphanCells: [number, number][];
  /** Spots visited on the way from the spawn to a cell, for debugging layouts. */
  pathTo(cx: number, cz: number): string[];
}

/** Doors that need an ability Kai does not have yet stay shut; every other condition is assumed reachable. */
function opens(c: Cond, abilities: Ability[]): boolean {
  if ('flag' in c) return !c.flag.startsWith('ability:') || abilities.includes(c.flag.slice(8) as Ability);
  if ('all' in c) return c.all.every((x) => opens(x, abilities));
  return true;
}

/** Cells holding doors that stay shut for this set of abilities; they block walking and jumping alike. */
function shutDoors(level: ParsedLevel, abilities: Ability[]): Set<number> {
  const shut = new Set<number>();
  for (const e of level.entities) if (e.spec.type === 'door' && !opens(e.spec.open, abilities)) shut.add(e.cz * level.width + e.cx);
  return shut;
}

export function buildSpots(level: ParsedLevel, abilities: Ability[] = []): Spot[] {
  const spots: Spot[] = [];
  const blocked = shutDoors(level, abilities);
  for (const e of level.entities) if (SOLID_DECOR(e.spec)) blocked.add(e.cz * level.width + e.cx);
  const special = new Map<number, SpotKind>();
  for (const e of level.entities) {
    if (e.spec.type === 'bounce') special.set(e.cz * level.width + e.cx, 'pad');
    if (e.spec.type === 'vent') special.set(e.cz * level.width + e.cx, 'vent');
  }
  for (let cz = 0; cz < level.depth; cz++) {
    for (let cx = 0; cx < level.width; cx++) {
      const idx = cz * level.width + cx;
      const c = level.cells[idx];
      if (c.kind !== 'floor' && c.kind !== 'ice' && c.kind !== 'grate') continue;
      if (blocked.has(idx)) continue;
      spots.push({ cx, cz, h: c.h, kind: special.get(idx) ?? 'floor', group: -1 });
    }
  }
  let group = 0;
  for (const e of level.entities) {
    const s = e.spec;
    if (s.type === 'faller') spots.push({ cx: e.cx, cz: e.cz, h: e.h, kind: 'floor', group: -1 });
    if (s.type !== 'platform') continue;
    group += 1;
    const size = s.size ?? 1;
    const pts = [[0, 0, 0], ...s.path.map(([dx, dz, dy]) => [dx, dz, dy ?? 0])];
    const seen = new Set<string>();
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[Math.min(i + 1, pts.length - 1)];
      const steps = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) * 4));
      for (let k = 0; k <= steps; k++) {
        const f = k / steps;
        const px = a[0] + (b[0] - a[0]) * f;
        const pz = a[1] + (b[1] - a[1]) * f;
        const ph = e.h + (a[2] + (b[2] - a[2]) * f) * 0.5;
        for (let ox = 0; ox < size; ox++) {
          for (let oz = 0; oz < size; oz++) {
            const cx = e.cx + Math.round(px) + ox;
            const cz = e.cz + Math.round(pz) + oz;
            const key = `${cx},${cz},${ph.toFixed(2)}`;
            if (seen.has(key)) continue;
            seen.add(key);
            spots.push({ cx, cz, h: ph, kind: 'plat', group });
          }
        }
      }
    }
  }
  return spots;
}

function lineClear(level: ParsedLevel, shut: Set<number>, a: Spot, b: Spot) {
  const top = Math.max(a.h, b.h) + 0.6;
  const d = Math.hypot(b.cx - a.cx, b.cz - a.cz);
  const steps = Math.ceil(d * 4);
  for (let i = 1; i < steps; i++) {
    const f = i / steps;
    const cx = Math.round(a.cx + (b.cx - a.cx) * f);
    const cz = Math.round(a.cz + (b.cz - a.cz) * f);
    if ((cx === a.cx && cz === a.cz) || (cx === b.cx && cz === b.cz)) continue;
    const c = level.cells[cz * level.width + cx];
    if (!c) return false;
    if (c.kind === 'wall' || shut.has(cz * level.width + cx)) return false;
    if (c.kind !== 'void' && c.kind !== 'hazard' && c.h > top) return false;
  }
  return true;
}

/** Every spot Kai can stand on, and the jumps between them. */
interface JumpGraph {
  spots: Spot[];
  /** Spot index of the spawn point. */
  start: number;
  /** Spots Kai can get to from spot `ai` in one move. */
  next(ai: number): number[];
}

/**
 * `doors` decides which ability-gated doors are open; `moves` decides how far Kai can jump. They only
 * differ when checking what a single ability (the dash) is needed for.
 */
function jumpGraph(level: ParsedLevel, doors: Ability[], moves: Ability[] = doors): JumpGraph {
  const spots = buildSpots(level, doors);
  const shut = shutDoors(level, doors);
  const byCell = new Map<string, number[]>();
  spots.forEach((s, i) => {
    const k = `${s.cx},${s.cz}`;
    const list = byCell.get(k) ?? [];
    list.push(i);
    byCell.set(k, list);
  });
  const riseJump = maxRise(moves, PLAYER.jumpV);
  const risePad = maxRise(moves, PLAYER.bounceV);
  const reachCache = new Map<string, number>();
  const envelope = (dh: number, launch: number) => {
    const k = `${dh.toFixed(2)}|${launch}`;
    let v = reachCache.get(k);
    if (v === undefined) {
      v = jumpReach(dh, moves, launch);
      reachCache.set(k, v);
    }
    return v;
  };
  const start = spots.findIndex((s) => s.cx === level.spawn.cx && s.cz === level.spawn.cz && s.kind !== 'plat');
  if (start < 0) throw new Error('spawn is not on a walkable cell');
  const edges = new Map<number, number[]>();
  const next = (ai: number) => {
    const known = edges.get(ai);
    if (known) return known;
    const out: number[] = [];
    const a = spots[ai];
    const launch = a.kind === 'pad' ? PLAYER.bounceV : PLAYER.jumpV;
    const rise = a.kind === 'pad' ? risePad : a.kind === 'vent' ? 8 : riseJump;
    const radius = a.kind === 'vent' ? 3 : 9;
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const list = byCell.get(`${a.cx + dx},${a.cz + dz}`);
        if (!list) continue;
        for (const bi of list) {
          if (bi === ai) continue;
          const b = spots[bi];
          const dh = b.h - a.h;
          const d = Math.hypot(dx, dz);
          let ok = false;
          if (a.group >= 0 && a.group === b.group) ok = true;
          else if (Math.abs(dx) + Math.abs(dz) === 1 && dh <= STEP_UP) ok = true;
          else if (dh <= rise) {
            const max = a.kind === 'vent' ? 2.5 : envelope(dh, launch);
            ok = d <= max && lineClear(level, shut, a, b);
          }
          if (ok) out.push(bi);
        }
      }
    }
    edges.set(ai, out);
    return out;
  };
  return { spots, start, next };
}

/** Breadth-first flood from `from`, skipping anything in `skip`. Returns the new spots and their parents. */
function flood(g: JumpGraph, from: number[], skip?: Set<number>): { seen: Set<number>; parent: Map<number, number> } {
  const seen = new Set<number>(from.filter((i) => !skip?.has(i)));
  const parent = new Map<number, number>();
  const queue = [...seen];
  for (let q = 0; q < queue.length; q++) {
    const ai = queue[q];
    for (const bi of g.next(ai)) {
      if (seen.has(bi) || skip?.has(bi)) continue;
      seen.add(bi);
      parent.set(bi, ai);
      queue.push(bi);
    }
  }
  return { seen, parent };
}

export function reach(level: ParsedLevel, abilities: Ability[]): ReachResult {
  const g = jumpGraph(level, abilities);
  const spots = g.spots;
  const f = flood(g, [g.start]);
  const seen = new Uint8Array(spots.length);
  for (const i of f.seen) seen[i] = 1;
  const parent = new Int32Array(spots.length).fill(-1);
  for (const [b, a] of f.parent) parent[b] = a;

  const reached = new Set<string>();
  spots.forEach((s, i) => {
    if (seen[i]) reached.add(`${s.cx},${s.cz}`);
  });
  const near = (e: PlacedEntity) => {
    if (reached.has(`${e.cx},${e.cz}`)) return true;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (reached.has(`${e.cx + dx},${e.cz + dz}`)) return true;
    return false;
  };
  const missing = level.entities.filter((e) => isTarget(e.spec) && !near(e));
  const orphanCells: [number, number][] = [];
  for (const s of spots) if (s.kind !== 'plat' && !reached.has(`${s.cx},${s.cz}`)) orphanCells.push([s.cx, s.cz]);
  const pathTo = (cx: number, cz: number) => {
    const out: string[] = [];
    for (let i = spots.findIndex((s, k) => seen[k] && s.cx === cx && s.cz === cz); i >= 0; i = parent[i]) {
      out.push(`${spots[i].cx},${spots[i].cz}@${spots[i].h}`);
    }
    return out.reverse();
  };
  return { reached, spots, missing, orphanCells, pathTo };
}

export const TARGET_TYPES = [
  'shard',
  'cocoon',
  'canister',
  'upgrade',
  'exit',
  'boss',
  'terminal',
  'switch',
  'cell',
  'socket',
  'boltfind',
  'checkpoint',
  'vendor',
  'holo',
  'prize',
  'rune',
] as const;

function isTarget(s: Spec) {
  return (TARGET_TYPES as readonly string[]).includes(s.type);
}

/** Collectibles may need abilities from later decks; everything else must work with what you have. */
export function isCollectible(s: Spec) {
  return s.type === 'shard' || s.type === 'cocoon' || s.type === 'canister';
}

/** ASCII view of a reach result: '·' reached, '?' walkable but unreached. */
export function renderReach(level: ParsedLevel, r: ReachResult): string {
  const rows: string[] = [];
  const ents = new Map(level.entities.map((e) => [`${e.cx},${e.cz}`, e]));
  for (let cz = 0; cz < level.depth; cz++) {
    let row = `${String(cz).padStart(3)} `;
    for (let cx = 0; cx < level.width; cx++) {
      const c = level.cells[cz * level.width + cx];
      const e = ents.get(`${cx},${cz}`);
      const hit = r.reached.has(`${cx},${cz}`);
      if (e && isTarget(e.spec)) row += hit ? e.spec.type[0].toUpperCase() : '!';
      else if (c.kind === 'wall') row += '#';
      else if (c.kind === 'void') row += e?.spec.type === 'platform' ? 'p' : ' ';
      else if (c.kind === 'hazard') row += '~';
      else row += hit ? (c.dark ? ':' : '·') : '?';
    }
    rows.push(row);
  }
  return rows.join('\n');
}

/** Spots Kai must dash from: the landing can't be reached from there (or anywhere near) without a dash. */
export function dashTakeoffs(level: ParsedLevel, abilities: Ability[]): Spot[] {
  if (!abilities.includes('dash')) return [];
  const full = jumpGraph(level, abilities);
  const walk = jumpGraph(level, abilities, abilities.filter((a) => a !== 'dash'));
  const known = flood(walk, [walk.start]).seen;
  const takeoffs = new Set<number>();
  let frontier = [...known];
  // Cross one "layer" of dash jumps at a time: everything reachable after a dash, without dashing again.
  for (;;) {
    const landings: number[] = [];
    for (const a of frontier) {
      for (const b of full.next(a)) {
        if (known.has(b)) continue;
        takeoffs.add(a);
        landings.push(b);
      }
    }
    if (!landings.length) break;
    const more = flood(walk, landings, known).seen;
    for (const i of more) known.add(i);
    frontier = [...more];
  }
  return [...takeoffs].map((i) => full.spots[i]);
}

/** How close (in cells) a checkpoint or energy cell must be to a dash takeoff. */
export const REFILL_RANGE = 7;

/**
 * Dash takeoffs with no refill (checkpoint or energy cell) within REFILL_RANGE that Kai can walk to
 * and then walk back from to the takeoff. Takeoffs next to each other count as one jump: one refill
 * anywhere along it is enough.
 */
export function refillGaps(level: ParsedLevel, abilities: Ability[]): Spot[] {
  const takeoffs = dashTakeoffs(level, abilities);
  if (!takeoffs.length) return [];
  const walk = jumpGraph(level, abilities, abilities.filter((a) => a !== 'dash'));
  const at = (cx: number, cz: number) => walk.spots.findIndex((s) => s.cx === cx && s.cz === cz && s.kind !== 'plat');
  const refills = level.entities
    .filter((e) => e.spec.type === 'energy' || e.spec.type === 'checkpoint')
    .map((e) => ({ cx: e.cx, cz: e.cz, from: flood(walk, [at(e.cx, e.cz)].filter((i) => i >= 0)).seen }));
  const ok = (t: Spot) => {
    const ti = at(t.cx, t.cz);
    return refills.some((r) => Math.hypot(r.cx - t.cx, r.cz - t.cz) <= REFILL_RANGE && ti >= 0 && r.from.has(ti));
  };
  // Group neighbouring takeoffs (same ledge) so one refill covers the whole ledge.
  const groups: Spot[][] = [];
  for (const t of takeoffs) {
    const g = groups.find((list) => list.some((o) => Math.abs(o.cx - t.cx) <= 1 && Math.abs(o.cz - t.cz) <= 1 && Math.abs(o.h - t.h) < 0.6));
    if (g) g.push(t);
    else groups.push([t]);
  }
  // Merge groups that became connected through later members.
  for (let changed = true; changed; ) {
    changed = false;
    for (let i = 0; i < groups.length && !changed; i++) {
      for (let j = i + 1; j < groups.length && !changed; j++) {
        if (groups[i].some((a) => groups[j].some((b) => Math.abs(a.cx - b.cx) <= 1 && Math.abs(a.cz - b.cz) <= 1 && Math.abs(a.h - b.h) < 0.6))) {
          groups[i].push(...groups.splice(j, 1)[0]);
          changed = true;
        }
      }
    }
  }
  return groups.filter((g) => !g.some(ok)).flat();
}
