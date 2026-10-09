import { tr } from '../../core/i18n';
import type { SaveData } from '../../core/save';
import type { DeckId, LevelDef } from '../../world/levelTypes';
import { RING_SHARE, flightRecord, recordFlight, type FlightQuest } from '../quests';

/**
 * Side quests for a dive (the Sirens' Sea): gold rings, siren buoys silenced, and every hidden pearl.
 * They keep the best results of a single dive in the same save record as the Argo's flights: `rings`,
 * `drones` (here: buoys silenced) and `clean` (here: every pearl found in one dive).
 */

export const DIVE_QUEST_BOLTS = { rings: 60, buoys: 80, pearls: 100 } as const;

/** How many rings, buoys and pearls a dive has in all. */
export function diveTotals(def: LevelDef): { rings: number; buoys: number; pearls: number } {
  const things = def.dive?.things ?? [];
  const n = (k: string) => things.filter((t) => t.kind === k).length;
  return { rings: n('ring'), buoys: n('buoy'), pearls: n('pearl') };
}

/** Most of the rings, and every buoy on the course (the Siren Organ's own buoys don't count). */
export function diveGoals(def: LevelDef): { rings: number; buoys: number } {
  const t = diveTotals(def);
  return { rings: Math.round(t.rings * RING_SHARE), buoys: t.buoys };
}

/** Keeps the best of a dive's results. Returns true if anything improved. */
export function recordDive(save: SaveData, id: DeckId, run: { rings?: number; buoys?: number; allPearls?: boolean }): boolean {
  return recordFlight(save, id, { rings: run.rings, drones: run.buoys, clean: run.allPearls });
}

export function diveQuests(id: DeckId, def: LevelDef, save: SaveData): FlightQuest[] {
  const goal = diveGoals(def);
  const best = flightRecord(save, id);
  const bolts = (n: number) => tr('+{bonus} bolts', { bonus: n });
  return [
    {
      id: `${id}:rings`,
      text: tr('Swim through {n} gold rings in one dive', { n: goal.rings }),
      done: best.rings >= goal.rings,
      progress: `${Math.min(best.rings, goal.rings)} / ${goal.rings}`,
      reward: bolts(DIVE_QUEST_BOLTS.rings),
      pay: DIVE_QUEST_BOLTS.rings,
    },
    {
      id: `${id}:buoys`,
      text: tr('Silence all {n} siren buoys in one dive (sing back, or torpedo them)', { n: goal.buoys }),
      done: best.drones >= goal.buoys,
      progress: `${Math.min(best.drones, goal.buoys)} / ${goal.buoys}`,
      reward: bolts(DIVE_QUEST_BOLTS.buoys),
      pay: DIVE_QUEST_BOLTS.buoys,
    },
    {
      id: `${id}:pearls`,
      text: tr('PING to find every hidden pearl in one dive'),
      done: best.clean,
      progress: best.clean ? tr('done') : tr('not yet'),
      reward: bolts(DIVE_QUEST_BOLTS.pearls),
      pay: DIVE_QUEST_BOLTS.pearls,
    },
  ];
}
