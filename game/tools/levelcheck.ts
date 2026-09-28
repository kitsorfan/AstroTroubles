/**
 * Prints a reachability report for every deck: `node game/tools/run.mjs levelcheck [deck] [--map]`.
 */
import { LEVELS, LEVEL_ORDER } from '../src/levels';
import { parseLevel } from '../src/world/grid';
import type { Ability, DeckId } from '../src/world/levelTypes';
import { deckAbilities } from './deckAbilities';
import { isCollectible, reach, renderReach } from './reach';

const ALL: Ability[] = ['doubleJump', 'dash', 'glide', 'shield'];

function check(id: DeckId, showMap: boolean) {
  const level = parseLevel(LEVELS[id]);
  const { before, after } = deckAbilities(level);
  const lines: string[] = [`== ${id} (${level.width}x${level.depth}) abilities: [${before.join(', ')}] -> [${after.join(', ')}]`];
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
