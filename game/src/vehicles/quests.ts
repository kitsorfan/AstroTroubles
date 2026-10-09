import { tr } from '../core/i18n';
import type { FlightRecord, SaveData } from '../core/save';
import type { DeckId, LevelDef } from '../world/levelTypes';

/**
 * Side quests for a flight level (instead of the on-foot ones: there are no cocoons or vaults in
 * space). They are kept as the best results of any single flight in `save.flights`.
 */

/** Rings and drones a flight needs for its quests: most of them, not every last one. */
export const RING_SHARE = 0.8;
export const DRONE_SHARE = 0.7;
export const FLIGHT_QUEST_BOLTS = { rings: 60, drones: 60, dove: 100 } as const;

export interface FlightQuest {
  id: string;
  text: string;
  done: boolean;
  progress: string;
  reward: string;
  /** Bolts paid when it's done. */
  pay: number;
}

/** How many rings and drones a flight level has in all. */
export function flightTotals(def: LevelDef): { rings: number; drones: number } {
  let rings = 0;
  let drones = 0;
  for (const th of def.flight?.things ?? []) {
    if (th.kind === 'ring') rings += 1;
    else if (th.kind === 'drones') drones += th.n;
  }
  return { rings, drones };
}

export function flightGoals(def: LevelDef): { rings: number; drones: number } {
  const t = flightTotals(def);
  return { rings: Math.round(t.rings * RING_SHARE), drones: Math.round(t.drones * DRONE_SHARE) };
}

export function flightRecord(save: SaveData, id: DeckId): FlightRecord {
  return save.flights?.[id] ?? { rings: 0, drones: 0, clean: false };
}

/** Keeps the best of a flight's results. Returns true if anything improved. */
export function recordFlight(save: SaveData, id: DeckId, run: Partial<FlightRecord>): boolean {
  const old = flightRecord(save, id);
  const next: FlightRecord = { rings: Math.max(old.rings, run.rings ?? 0), drones: Math.max(old.drones, run.drones ?? 0), clean: old.clean || !!run.clean };
  if (next.rings === old.rings && next.drones === old.drones && next.clean === old.clean) return false;
  (save.flights ??= {})[id] = next;
  return true;
}

export function flightQuests(id: DeckId, def: LevelDef, save: SaveData): FlightQuest[] {
  const goal = flightGoals(def);
  const best = flightRecord(save, id);
  const bolts = (n: number) => tr('+{bonus} bolts', { bonus: n });
  return [
    {
      id: `${id}:rings`,
      text: tr('Fly through {n} gold rings in one flight', { n: goal.rings }),
      done: best.rings >= goal.rings,
      progress: `${Math.min(best.rings, goal.rings)} / ${goal.rings}`,
      reward: bolts(FLIGHT_QUEST_BOLTS.rings),
      pay: FLIGHT_QUEST_BOLTS.rings,
    },
    {
      id: `${id}:drones`,
      text: tr('Shoot down {n} salvage drones in one flight', { n: goal.drones }),
      done: best.drones >= goal.drones,
      progress: `${Math.min(best.drones, goal.drones)} / ${goal.drones}`,
      reward: bolts(FLIGHT_QUEST_BOLTS.drones),
      pay: FLIGHT_QUEST_BOLTS.drones,
    },
    {
      id: `${id}:dove`,
      text: tr('Fly through all twenty Clashing Rocks without getting squished (rockets allowed!)'),
      done: best.clean,
      progress: best.clean ? tr('done') : tr('not yet'),
      reward: bolts(FLIGHT_QUEST_BOLTS.dove),
      pay: FLIGHT_QUEST_BOLTS.dove,
    },
  ];
}
