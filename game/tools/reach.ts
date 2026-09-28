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

export function reach(level: ParsedLevel, abilities: Ability[]): ReachResult {
  const spots = buildSpots(level, abilities);
  const shut = shutDoors(level, abilities);
  const byCell = new Map<string, number[]>();
  spots.forEach((s, i) => {
    const k = `${s.cx},${s.cz}`;
    const list = byCell.get(k) ?? [];
    list.push(i);
    byCell.set(k, list);
  });
  const riseJump = maxRise(abilities, PLAYER.jumpV);
  const risePad = maxRise(abilities, PLAYER.bounceV);
  const reachCache = new Map<string, number>();
  const envelope = (dh: number, launch: number) => {
    const k = `${dh.toFixed(2)}|${launch}`;
    let v = reachCache.get(k);
    if (v === undefined) {
      v = jumpReach(dh, abilities, launch);
      reachCache.set(k, v);
    }
    return v;
  };

  const start = spots.findIndex((s) => s.cx === level.spawn.cx && s.cz === level.spawn.cz && s.kind !== 'plat');
  if (start < 0) throw new Error('spawn is not on a walkable cell');
  const seen = new Uint8Array(spots.length);
  const parent = new Int32Array(spots.length).fill(-1);
  const queue = [start];
  seen[start] = 1;
  while (queue.length) {
    const ai = queue.shift() as number;
    const a = spots[ai];
    const launch = a.kind === 'pad' ? PLAYER.bounceV : PLAYER.jumpV;
    const rise = a.kind === 'pad' ? risePad : a.kind === 'vent' ? 8 : riseJump;
    const radius = a.kind === 'vent' ? 3 : 9;
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const list = byCell.get(`${a.cx + dx},${a.cz + dz}`);
        if (!list) continue;
        for (const bi of list) {
          if (seen[bi]) continue;
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
          if (ok) {
            seen[bi] = 1;
            parent[bi] = ai;
            queue.push(bi);
          }
        }
      }
    }
  }

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
