import { LEVELS, LEVEL_ORDER } from '../src/levels';
import { parseLevel } from '../src/world/grid';
import type { Ability, ParsedLevel } from '../src/world/levelTypes';

/** Abilities Jason owns when starting a deck (`before`), and after picking up the one found inside it (`after`). */
export function deckAbilities(level: ParsedLevel): { before: Ability[]; after: Ability[] } {
  const before: Ability[] = [];
  for (const id of LEVEL_ORDER) {
    if (id === level.def.id) break;
    for (const e of parseLevel(LEVELS[id]).entities) if (e.spec.type === 'upgrade') before.push(e.spec.ability);
  }
  const after = [...before];
  for (const e of level.entities) if (e.spec.type === 'upgrade') after.push(e.spec.ability);
  return { before, after };
}
