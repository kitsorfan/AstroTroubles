/**
 * Prints a reachability report for every deck: `node game/tools/run.mjs levelcheck [deck] [--map]`.
 */
import { LEVELS, LEVEL_ORDER } from '../src/levels';
import { parseLevel } from '../src/world/grid';
import type { Ability, DeckId } from '../src/world/levelTypes';
import { deckAbilities } from './deckAbilities';
import { isCollectible, levelHeroes, reach, refillGaps, renderReach, timedRoutes } from './reach';

const ALL: Ability[] = ['doubleJump', 'dash', 'glide', 'pulse', 'grapple', 'mirror'];

function check(id: DeckId, showMap: boolean) {
  const def = LEVELS[id];
  if (def.flight) {
    // A flight level has no map to walk: its course is checked by game/tests/chapter3.test.ts.
    const n = (k: string) => def.flight?.things.filter((t) => t.kind === k).length ?? 0;
    console.log(`== ${id} (flight: ${def.vehicle}) rocks ${n('rock')} crystals ${n('crystal')} rings ${n('ring')} bolts ${n('bolt')} drone waves ${n('drones')} clashing pairs ${n('clash')} hold lines ${n('hold')} checkpoints ${n('checkpoint')}`);
    return;
  }
  const level = parseLevel(LEVELS[id]);
  const { before, after } = deckAbilities(level);
  const lines: string[] = [`== ${id} (${level.width}x${level.depth}) abilities: [${before.join(', ')}] -> [${after.join(', ')}]`];
  const heroes = levelHeroes(level);
  if (heroes.length === 1 && heroes[0] !== 'jason') lines.push(`  hero: ${heroes[0]} only (no switching on this level)`);
  else if (heroes.length > 1) {
    lines.push(`  heroes: ${heroes.join(' + ')} (switching anywhere on the ground)`);
    for (const h of heroes) {
      const alone = reach(level, after, [h]).missing.filter((e) => !isCollectible(e.spec));
      lines.push(`  ${h} alone can't reach: ${alone.map((e) => e.id).join(', ') || 'nothing (the other hero is never needed)'}`);
    }
  }
  const upgrade = level.entities.find((e) => e.spec.type === 'upgrade');
  if (upgrade) {
    const r0 = reach(level, before);
    if (r0.missing.some((e) => e.id === upgrade.id)) lines.push(`  !! upgrade ${upgrade.id} unreachable without it`);
    const gated = r0.missing.filter((e) => !isCollectible(e.spec)).map((e) => e.id);
    lines.push(`  before upgrade, blocked: ${gated.join(', ') || '(nothing: the upgrade gates nothing!)'}`);
    const exit = level.entities.find((e) => e.spec.type === 'exit');
    if (!gated.length && exit) lines.push(`  path to exit without it: ${r0.pathTo(exit.cx, exit.cz).join(' > ')}`);
  }
  const r = reach(level, after);
  const crit = r.missing.filter((e) => !isCollectible(e.spec));
  const later = r.missing.filter((e) => isCollectible(e.spec));
  const rAll = reach(level, ALL);
  const never = rAll.missing;
  lines.push(`  critical unreachable: ${crit.map((e) => `${e.id}(${e.cx},${e.cz})`).join(', ') || 'none'}`);
  lines.push(`  collectibles needing later abilities: ${later.map((e) => e.id).join(', ') || 'none'}`);
  lines.push(`  NEVER reachable: ${never.map((e) => `${e.id}(${e.cx},${e.cz})`).join(', ') || 'none'}`);
  lines.push(`  orphan floor cells (with all abilities): ${rAll.orphanCells.length}`);
  const dry = refillGaps(level, after);
  lines.push(`  dash jumps with no refill nearby: ${dry.map((t) => `${t.cx},${t.cz}`).join(', ') || 'none'}`);
  for (const t of timedRoutes(level, after)) lines.push(`  clock '${t.flag}': ${t.clock}s, fastest ${t.best.toFixed(1)}s (${Math.round((t.best / t.clock) * 100)}%), slowest order ${t.worst.toFixed(1)}s (${Math.round((t.worst / t.clock) * 100)}%), via ${t.route.join(' > ')}`);
  const count = (t: string) => level.entities.filter((e) => e.spec.type === t).length;
  const bolts = level.entities.filter((e) => e.spec.type === 'bolt').length;
  lines.push(`  shards ${count('shard')} cocoons ${count('cocoon')} canisters ${count('canister')} bolts ${bolts} crates ${count('crate')} enemies ${count('enemy')} checkpoints ${count('checkpoint')}`);
  if (showMap) lines.push(renderReach(level, r));
  console.log(lines.join('\n'));
}

const args: string[] = process.argv.slice(2);
const showMap = args.includes('--map');
const only = args.filter((a) => !a.startsWith('--')) as DeckId[];
for (const id of only.length ? only : LEVEL_ORDER) if (LEVELS[id]) check(id, showMap);
