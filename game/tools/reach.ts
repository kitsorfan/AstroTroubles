/**
 * Level reachability checker.
 *
 * Models the heroes' movement envelopes on a level grid and reports which entities cannot be reached
 * from the spawn: Jason (walk, jump, jet boots, dash, hover, grapple), Atalanta on levels that let
 * the player switch to her (her strong jump, sprint long jumps after a run-up, wall-jumps, wall-runs
 * along `wallrun` strips, crawling through low gaps, and power arrows for `target` bullseyes),
 * General Brennus on his own levels (a low jump, charge-leaps over wide gaps, and smashing `cracked`
 * walls nobody else gets through), plus bounce pads, vents and moving platforms. Heroes switch anywhere on the ground, so a spot either
 * hero reaches counts for both. Doors are treated as open: the checker proves the geometry works,
 * the level's conditions decide the order.
 */
import { ATALANTA, BRENNUS, CELL, GRAPPLE, GRAVITY, PLAYER, STEP_UP } from '../src/core/constants';
import { heroRoster } from '../src/entities/heroes/heroes';
import { PASSABLE_DECOR, type Ability, type Cond, type HeroId, type ParsedLevel, type PlacedEntity, type Spec } from '../src/world/levelTypes';

type SpotKind = 'floor' | 'plat' | 'pad' | 'vent';

interface Spot {
  cx: number;
  cz: number;
  h: number;
  kind: SpotKind;
  group: number;
}

/**
 * Horizontal distance Jason covers is scaled by MARGIN (a safety margin for kids' thumbs); EDGE is how far
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

const SOLID_DECOR = (s: Spec) => s.type === 'decor' && s.solid !== false && !PASSABLE_DECOR.includes(s.kind);

export interface ReachResult {
  reached: Set<string>;
  spots: Spot[];
  missing: PlacedEntity[];
  /** Walkable cells that can never be reached (often a sign of a broken layout). */
  orphanCells: [number, number][];
  /** Spots visited on the way from the spawn to a cell, for debugging layouts. */
  pathTo(cx: number, cz: number): string[];
}

/** Doors that need an ability Jason does not have yet stay shut; every other condition is assumed reachable. */
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

/** True if the grapple rope from `a` to the anchor at `b` doesn't pass through a wall, a shut door or a cliff. */
function ropeClear(level: ParsedLevel, shut: Set<number>, a: Spot, b: Spot) {
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
    // The rope runs 1.5 above Jason's chest line; a floor higher than that blocks it.
    if (c.kind !== 'void' && c.kind !== 'hazard' && c.h > a.h + (b.h - a.h) * f + 1.5) return false;
  }
  return true;
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

/** Every spot a hero can stand on, and the jumps between them. */
interface JumpGraph {
  spots: Spot[];
  /** Spot index of the spawn point. */
  start: number;
  /** Spots the heroes can get to from spot `ai` in one move. */
  next(ai: number): number[];
}

/** The heroes a level lets the player use (the checker ignores the developer's hash options). */
export function levelHeroes(level: ParsedLevel): HeroId[] {
  return heroRoster(level.def.heroes);
}

/** Cells holding a low gap: only Atalanta's slide fits through, and nobody can jump over or into one. */
function lowGaps(level: ParsedLevel): Set<number> {
  return new Set(level.entities.filter((e) => e.spec.type === 'lowgap').map((e) => e.cz * level.width + e.cx));
}

/**
 * Largest centre-to-centre distance (in cells) for one of Atalanta's jumps that ends `dh` higher:
 * her single jump at `speed` (a sprint after a run-up), plus a wall-jump off a wall she passes.
 */
export function atalantaReach(dh: number, speed: number, wallJump: boolean, launch: number = ATALANTA.jumpV): number {
  const options: number[] = [];
  const apex1 = (launch * launch) / (2 * GRAVITY);
  const t1 = launch / GRAVITY;
  if (dh <= apex1 - 0.3) {
    const t = flight(launch, dh);
    if (t !== null) options.push(speed * t);
  }
  if (wallJump) {
    const v2 = ATALANTA.wallJumpV;
    const apex2 = apex1 + (v2 * v2) / (2 * GRAVITY);
    if (dh <= apex2 - 0.3) {
      const t2 = flight(v2, dh - apex1);
      // After the kick she moves at her normal running speed, not a sprint.
      if (t2 !== null) options.push(Math.min(speed, ATALANTA.speed) * (t1 + t2));
    }
  }
  if (!options.length) return 0;
  return Math.min((Math.max(...options) * MARGIN + EDGE) / CELL, 9);
}

/** Cells holding a cracked wall (`cracked`): only General Brennus can smash through. */
function crackedCells(level: ParsedLevel): Set<number> {
  return new Set(level.entities.filter((e) => e.spec.type === 'cracked').map((e) => e.cz * level.width + e.cx));
}

/**
 * Largest centre-to-centre distance (in cells) for one of General Brennus's jumps that ends `dh`
 * higher: his low jump at walking speed, or a charge-leap (a jump out of his CHARGE keeps its speed).
 */
export function brennusReach(dh: number, leap: boolean, launch: number = BRENNUS.jumpV): number {
  if (dh > (launch * launch) / (2 * GRAVITY) - 0.3) return 0;
  const t = flight(launch, dh);
  if (t === null) return 0;
  const speed = leap ? BRENNUS.leapSpeed : BRENNUS.speed;
  return Math.min((speed * t * MARGIN + EDGE) / CELL, 9);
}

/** Highest rise for Atalanta from a launch speed (with a wall-jump when a wall is in reach). */
function atalantaRise(launch: number, wallJump: boolean) {
  let apex = (launch * launch) / (2 * GRAVITY);
  if (wallJump) apex += (ATALANTA.wallJumpV * ATALANTA.wallJumpV) / (2 * GRAVITY);
  return apex - 0.3;
}

/** A row of cells in front of wall-run walls, all facing the same way: Atalanta can run along it. */
interface RunStrip {
  /** Outward normal of the wall faces. */
  nx: number;
  nz: number;
  /** The fixed coordinate of the row (cz for a row along x, cx for one along z), and its extent. */
  line: number;
  from: number;
  to: number;
}

/** Groups the open faces of `wallrun` cells into strips she can run along. */
export function wallRunStrips(level: ParsedLevel): RunStrip[] {
  const marks = level.entities.filter((e) => e.spec.type === 'wallrun');
  const faces = new Map<string, number[]>();
  for (const e of marks) {
    for (const [nx, nz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      if (e.cx + nx < 0 || e.cx + nx >= level.width) continue;
      const f = level.cells[(e.cz + nz) * level.width + (e.cx + nx)];
      if (!f || f.kind === 'wall') continue;
      // Faces along x (normal ±z) share a row cz + nz; faces along z share a column cx + nx.
      const key = `${nx},${nz},${nz ? e.cz + nz : e.cx + nx}`;
      const list = faces.get(key) ?? [];
      list.push(nz ? e.cx : e.cz);
      faces.set(key, list);
    }
  }
  const out: RunStrip[] = [];
  for (const [key, list] of faces) {
    const [nx, nz, line] = key.split(',').map(Number);
    list.sort((a, b) => a - b);
    let from = list[0];
    for (let i = 1; i <= list.length; i++) {
      if (i < list.length && list[i] === list[i - 1] + 1) continue;
      out.push({ nx, nz, line, from, to: list[i - 1] });
      from = list[i];
    }
  }
  return out;
}

/** Cells along the strip's length a wall-run carries her (plus a jump on and off at either end). */
const RUN_CELLS = (ATALANTA.wallRunTime * ATALANTA.sprintSpeed * MARGIN) / CELL;

/**
 * `doors` decides which ability-gated doors are open; `moves` decides how far Jason can jump. They only
 * differ when checking what a single ability (the dash) is needed for. `heroes` are the heroes the
 * player can switch between (anywhere on the ground), so a spot either one reaches works for both.
 */
function jumpGraph(level: ParsedLevel, doors: Ability[], moves: Ability[] = doors, heroes: HeroId[] = levelHeroes(level)): JumpGraph {
  const jason = heroes.includes('jason');
  const atalanta = heroes.includes('atalanta');
  const brennus = heroes.includes('brennus');
  // Cracked walls only fall to General Brennus's big blast or charge: for anyone else they are walls.
  const cracked = brennus ? new Set<number>() : crackedCells(level);
  const spots = buildSpots(level, doors).filter((s) => s.kind === 'plat' || !cracked.has(s.cz * level.width + s.cx));
  const shut = shutDoors(level, doors);
  const low = lowGaps(level);
  // Low gaps block jumps and grapple ropes like walls do: they can only be crawled through.
  const solid = new Set([...shut, ...low, ...cracked]);
  const byCell = new Map<string, number[]>();
  spots.forEach((s, i) => {
    const k = `${s.cx},${s.cz}`;
    const list = byCell.get(k) ?? [];
    list.push(i);
    byCell.set(k, list);
  });
  const isLow = (s: Spot) => s.kind !== 'plat' && low.has(s.cz * level.width + s.cx);
  const walkable = (cx: number, cz: number, h: number) => {
    const idx = cz * level.width + cx;
    const c = level.cells[idx];
    return !!c && cx >= 0 && cx < level.width && (c.kind === 'floor' || c.kind === 'ice' || c.kind === 'grate') && !solid.has(idx) && Math.abs(c.h - h) <= STEP_UP;
  };
  const isWall = (cx: number, cz: number) => level.cells[cz * level.width + cx]?.kind === 'wall' && cx >= 0 && cx < level.width;
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
  // Grapple anchors: with the hook, any spot in range (and in sight) can zip to an anchor's own cell.
  const anchors =
    jason && moves.includes('grapple')
      ? level.entities.filter((e) => e.spec.type === 'anchor').flatMap((e) => spots.flatMap((s, i) => (s.cx === e.cx && s.cz === e.cz && s.kind !== 'plat' ? [i] : [])))
      : [];
  const strips = atalanta ? wallRunStrips(level) : [];
  /** True if a wall is right beside some cell of the jump line (not the landing): she can kick off it. */
  const wallOnLine = (a: Spot, b: Spot) => {
    const steps = Math.max(1, Math.ceil(Math.hypot(b.cx - a.cx, b.cz - a.cz) * 2));
    for (let i = 0; i < steps; i++) {
      const cx = Math.round(a.cx + ((b.cx - a.cx) * i) / steps);
      const cz = Math.round(a.cz + ((b.cz - a.cz) * i) / steps);
      if (isWall(cx + 1, cz) || isWall(cx - 1, cz) || isWall(cx, cz + 1) || isWall(cx, cz - 1)) return true;
    }
    return false;
  };
  /** Two cells of level floor straight behind the takeoff: room to break into a sprint. */
  const runUp = (a: Spot, dx: number, dz: number) => {
    const d = Math.hypot(dx, dz) || 1;
    for (let k = 1; k <= 2; k++) if (!walkable(Math.round(a.cx - (dx / d) * k), Math.round(a.cz - (dz / d) * k), a.h)) return false;
    return true;
  };
  /** Strips spot `s` stands beside (in the row in front of the wall, or one further out), with its place along them. */
  const besideStrips = (s: Spot) =>
    strips.flatMap((st, i) => {
      const across = st.nz ? (s.cz - st.line) * st.nz : (s.cx - st.line) * st.nx;
      const along = st.nz ? s.cx : s.cz;
      return across >= 0 && across <= 1 && along >= st.from - 2 && along <= st.to + 2 ? [{ i, along }] : [];
    });

  const jasonEdges = (ai: number, out: Set<number>) => {
    const a = spots[ai];
    const launch = a.kind === 'pad' ? PLAYER.bounceV : PLAYER.jumpV;
    const rise = a.kind === 'pad' ? risePad : a.kind === 'vent' ? 8 : riseJump;
    const radius = a.kind === 'vent' ? 3 : 9;
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const list = byCell.get(`${a.cx + dx},${a.cz + dz}`);
        if (!list) continue;
        for (const bi of list) {
          if (bi === ai || out.has(bi)) continue;
          const b = spots[bi];
          if (isLow(b)) continue;
          const dh = b.h - a.h;
          const d = Math.hypot(dx, dz);
          let ok = false;
          if (a.group >= 0 && a.group === b.group) ok = true;
          else if (Math.abs(dx) + Math.abs(dz) === 1 && dh <= STEP_UP) ok = true;
          else if (dh <= rise) {
            const max = a.kind === 'vent' ? 2.5 : envelope(dh, launch);
            ok = d <= max && lineClear(level, solid, a, b);
          }
          if (ok) out.add(bi);
        }
      }
    }
    for (const bi of anchors) {
      if (bi === ai || out.has(bi)) continue;
      const b = spots[bi];
      if (Math.hypot(b.cx - a.cx, b.cz - a.cz) <= GRAPPLE.range && Math.abs(b.h - a.h) <= GRAPPLE.rise && ropeClear(level, solid, a, b)) out.add(bi);
    }
  };

  const atalantaEdges = (ai: number, out: Set<number>) => {
    const a = spots[ai];
    const lowA = isLow(a);
    const launch = a.kind === 'pad' ? PLAYER.bounceV : ATALANTA.jumpV;
    const radius = lowA ? 1 : a.kind === 'vent' ? 3 : 6;
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const list = byCell.get(`${a.cx + dx},${a.cz + dz}`);
        if (!list) continue;
        for (const bi of list) {
          if (bi === ai || out.has(bi)) continue;
          const b = spots[bi];
          const dh = b.h - a.h;
          const d = Math.hypot(dx, dz);
          let ok = false;
          if (a.group >= 0 && a.group === b.group) ok = true;
          else if (Math.abs(dx) + Math.abs(dz) === 1 && dh <= STEP_UP) ok = true;
          else if (lowA || isLow(b)) ok = false;
          else if (a.kind === 'vent') ok = dh <= 8 && d <= 2.5 && lineClear(level, solid, a, b);
          else {
            const wall = wallOnLine(a, b);
            if (dh > atalantaRise(launch, wall)) continue;
            const speed = runUp(a, dx, dz) ? ATALANTA.sprintSpeed : ATALANTA.speed;
            ok = d <= atalantaReach(dh, speed, wall, launch) && lineClear(level, solid, a, b);
          }
          if (ok) out.add(bi);
        }
      }
    }
    // Wall-runs: from beside a strip to anywhere else beside it, a run's length away, about as high.
    if (lowA) return;
    for (const sa of besideStrips(a)) {
      const st = strips[sa.i];
      const len = Math.min(st.to - st.from + 1, RUN_CELLS) + 3;
      for (let along = st.from - 2; along <= st.to + 2; along++) {
        if (Math.abs(along - sa.along) > len) continue;
        for (let across = 0; across <= 1; across++) {
          const cx = st.nz ? along : st.line + across * st.nx;
          const cz = st.nz ? st.line + across * st.nz : along;
          for (const bi of byCell.get(`${cx},${cz}`) ?? []) {
            const b = spots[bi];
            if (bi !== ai && !out.has(bi) && !isLow(b) && b.h - a.h <= 1.5) out.add(bi);
          }
        }
      }
    }
  };

  /** General Brennus: one low jump at walking speed, or a charge-leap (jumping out of a charge) that carries much farther. */
  const brennusEdges = (ai: number, out: Set<number>) => {
    const a = spots[ai];
    const pad = a.kind === 'pad';
    const launch = pad ? PLAYER.bounceV : BRENNUS.jumpV;
    const rise = a.kind === 'vent' ? 8 : (launch * launch) / (2 * GRAVITY) - 0.3;
    const radius = a.kind === 'vent' ? 3 : 6;
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (const bi of byCell.get(`${a.cx + dx},${a.cz + dz}`) ?? []) {
          if (bi === ai || out.has(bi)) continue;
          const b = spots[bi];
          if (isLow(b)) continue;
          const dh = b.h - a.h;
          const d = Math.hypot(dx, dz);
          let ok = false;
          if (a.group >= 0 && a.group === b.group) ok = true;
          else if (Math.abs(dx) + Math.abs(dz) === 1 && dh <= STEP_UP) ok = true;
          else if (a.kind === 'vent') ok = dh <= 8 && d <= 2.5 && lineClear(level, solid, a, b);
          else if (dh <= rise) ok = d <= brennusReach(dh, !pad, launch) && lineClear(level, solid, a, b);
          if (ok) out.add(bi);
        }
      }
    }
  };

  const edges = new Map<number, number[]>();
  const next = (ai: number) => {
    const known = edges.get(ai);
    if (known) return known;
    const out = new Set<number>();
    if (jason && !isLow(spots[ai])) jasonEdges(ai, out);
    if (atalanta) atalantaEdges(ai, out);
    if (brennus && !isLow(spots[ai])) brennusEdges(ai, out);
    const list = [...out];
    edges.set(ai, list);
    return list;
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

/**
 * True if Atalanta, standing on `s`, can see the bullseye of the arrow target `t` and is within a
 * power arrow's range: no wall, and no floor higher than the arrow's straight path, in between.
 */
function arrowSight(level: ParsedLevel, s: Spot, t: PlacedEntity): boolean {
  const d = Math.hypot(t.cx - s.cx, t.cz - s.cz);
  if (d * CELL > ATALANTA.powerRange - CELL) return false;
  const y0 = s.h + 1.15;
  const y1 = t.h + 2.3;
  const steps = Math.ceil(d * 4);
  for (let i = 1; i < steps; i++) {
    const f = i / steps;
    const cx = Math.round(s.cx + (t.cx - s.cx) * f);
    const cz = Math.round(s.cz + (t.cz - s.cz) * f);
    if ((cx === s.cx && cz === s.cz) || (cx === t.cx && cz === t.cz)) continue;
    const c = level.cells[cz * level.width + cx];
    if (!c || c.kind === 'wall') return false;
    if (c.kind !== 'void' && c.kind !== 'hazard' && c.h > y0 + (y1 - y0) * f) return false;
  }
  return true;
}

export function reach(level: ParsedLevel, abilities: Ability[], heroes: HeroId[] = levelHeroes(level)): ReachResult {
  const g = jumpGraph(level, abilities, abilities, heroes);
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
  // Arrow targets are hit from afar: by a power arrow, from any spot Atalanta reaches with a clear shot.
  const archer = heroes.includes('atalanta');
  const hit = (e: PlacedEntity) => archer && spots.some((s, i) => seen[i] === 1 && arrowSight(level, s, e));
  const missing = level.entities.filter((e) => isTarget(e.spec) && (e.spec.type === 'target' ? !hit(e) : !near(e)));
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
  'target',
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

/** Spots Jason must dash from: the landing can't be reached from there (or anywhere near) without a dash. */
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

/** A ground pound from the floor: a hop, the hang and the slam, rounded up for landing on the switch. */
export const POUND_TIME = 0.8;

/** True if Jason can run from `a` to `b` in a straight line: floor all the way, no step too tall. */
function runClear(level: ParsedLevel, blocked: Set<number>, a: Spot, b: Spot) {
  const steps = Math.ceil(Math.hypot(b.cx - a.cx, b.cz - a.cz) * 4);
  let h = a.h;
  for (let i = 1; i <= steps; i++) {
    const cx = Math.round(a.cx + ((b.cx - a.cx) * i) / steps);
    const cz = Math.round(a.cz + ((b.cz - a.cz) * i) / steps);
    const idx = cz * level.width + cx;
    const c = level.cells[idx];
    if (!c || (c.kind !== 'floor' && c.kind !== 'ice' && c.kind !== 'grate') || blocked.has(idx) || Math.abs(c.h - h) > STEP_UP) return false;
    h = c.h;
  }
  return true;
}

/**
 * Seconds for one move: running at full speed, or the jump's flight if that takes longer. Dashes are
 * left out, so every time is a little slow on purpose.
 */
function moveTime(level: ParsedLevel, blocked: Set<number>, a: Spot, b: Spot, heroes: HeroId[] = ['jason']): number {
  // The slowest hero on the level sets the pace: General Brennus, else Jason, else Atalanta (her jump, then a wall-jump).
  const jason = heroes.includes('jason');
  const brennus = heroes.includes('brennus');
  const run = (Math.hypot(b.cx - a.cx, b.cz - a.cz) * CELL) / (brennus ? BRENNUS.speed : jason ? PLAYER.speed : ATALANTA.speed);
  if (runClear(level, blocked, a, b)) return run;
  const jumpV = brennus ? BRENNUS.jumpV : jason ? PLAYER.jumpV : ATALANTA.jumpV;
  const launch = a.kind === 'pad' ? PLAYER.bounceV : a.kind === 'vent' ? PLAYER.ventV : jumpV;
  const dh = b.h - a.h;
  const apex = (launch * launch) / (2 * GRAVITY);
  const air = dh <= apex - 0.3 ? flight(launch, dh) : launch / GRAVITY + (flight(jason ? PLAYER.doubleJumpV : ATALANTA.wallJumpV, dh - apex) ?? Infinity);
  return Math.max(run, air ?? Infinity);
}

/**
 * Fastest times (seconds) from the cell `from` to every cell, running and jumping at full speed. Moving
 * platforms are left out: timed puzzles shouldn't make you wait for one.
 */
export function travelTimes(level: ParsedLevel, abilities: Ability[], from: [number, number]): (cx: number, cz: number) => number {
  const heroes = levelHeroes(level);
  const g = jumpGraph(level, abilities, abilities, heroes);
  const blocked = shutDoors(level, abilities);
  for (const i of lowGaps(level)) blocked.add(i);
  for (const e of level.entities) if (SOLID_DECOR(e.spec)) blocked.add(e.cz * level.width + e.cx);
  const time = new Float64Array(g.spots.length).fill(Infinity);
  const done = new Uint8Array(g.spots.length);
  const start = g.spots.findIndex((s) => s.cx === from[0] && s.cz === from[1] && s.kind !== 'plat');
  if (start < 0) throw new Error(`no floor at ${from}`);
  time[start] = 0;
  // Dijkstra with a plain scan for the next spot: decks have a few thousand spots, so this stays quick.
  const open = new Set([start]);
  while (open.size) {
    let ai = -1;
    for (const i of open) if (ai < 0 || time[i] < time[ai]) ai = i;
    open.delete(ai);
    done[ai] = 1;
    for (const bi of g.next(ai)) {
      if (done[bi] || g.spots[bi].kind === 'plat') continue;
      const t = time[ai] + moveTime(level, blocked, g.spots[ai], g.spots[bi], heroes);
      if (t < time[bi]) {
        time[bi] = t;
        open.add(bi);
      }
    }
  }
  const best = new Map<string, number>();
  g.spots.forEach((s, i) => {
    const k = `${s.cx},${s.cz}`;
    best.set(k, Math.min(best.get(k) ?? Infinity, time[i]));
  });
  return (cx, cz) => best.get(`${cx},${cz}`) ?? Infinity;
}

export interface TimedRoute {
  flag: string;
  /** Seconds on the clock. */
  clock: number;
  /** The fastest way through at full speed, from the first press: every switch, or out through the door. */
  best: number;
  /** The slowest order through the switches, for players who don't plan a route (same as `best` for a door). */
  worst: number;
  /** Switches in the fastest order (or the switch and then its door). */
  route: string[];
}

const orders = <T>(list: T[]): T[][] => (list.length <= 1 ? [list] : list.flatMap((x, i) => orders([...list.slice(0, i), ...list.slice(i + 1)]).map((rest) => [x, ...rest])));

/**
 * Every clock on the deck and the fastest way to beat it. Switches that go `together` must all be
 * pounded, in the best order, before time runs out; a timed switch on its own opens a door for a few
 * seconds, so the race is from the switch out through that door.
 */
export function timedRoutes(level: ParsedLevel, abilities: Ability[]): TimedRoute[] {
  const out: TimedRoute[] = [];
  const at = (e: PlacedEntity) => `${e.cx},${e.cz}`;
  const timed = level.entities.filter((e) => e.spec.type === 'switch' && e.spec.timed);
  for (const flag of new Set(timed.map((e) => (e.spec as { flag: string }).flag))) {
    const group = timed.filter((e) => (e.spec as { flag: string }).flag === flag);
    const spec = group[0].spec as { timed: number; together?: boolean };
    if (spec.together) {
      const from = group.map((e) => travelTimes(level, abilities, [e.cx, e.cz]));
      let best = Infinity;
      let worst = 0;
      let route: PlacedEntity[] = [];
      for (const o of orders(group.map((_, i) => i))) {
        let t = 0;
        for (let k = 1; k < o.length; k++) t += from[o[k - 1]](group[o[k]].cx, group[o[k]].cz) + POUND_TIME;
        worst = Math.max(worst, t);
        if (t < best) (best = t), (route = o.map((i) => group[i]));
      }
      out.push({ flag, clock: spec.timed, best, worst, route: route.map(at) });
    } else {
      const door = level.entities.find((e) => e.spec.type === 'door' && 'flag' in e.spec.open && e.spec.open.flag === flag);
      if (!door) continue;
      for (const s of group) {
        const t = travelTimes(level, abilities, [s.cx, s.cz])(door.cx, door.cz);
        out.push({ flag, clock: spec.timed, best: t, worst: t, route: [at(s), at(door)] });
      }
    }
  }
  return out;
}

/** How close (in cells) a checkpoint or energy cell must be to a dash takeoff. */
export const REFILL_RANGE = 7;

/**
 * Dash takeoffs with no refill (checkpoint or energy cell) within REFILL_RANGE that Jason can walk to
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
