import { MAX_HEARTS } from '../core/constants';
import { tr } from '../core/i18n';
import type { SaveData, UpgradeId } from '../core/save';
import { LEVELS } from '../levels';
import type { DeckId, LevelDef } from '../world/levelTypes';

/**
 * Side quests and rewards. Every deck has the same four side quests: rescue its colonists, find
 * its memory shards, find its heart canister and crack its secret vault. Finishing one pays out
 * straight away, so collecting things always feels worth it.
 */

export const COLONIST_BOLTS = 25;
export const QUEST_BOLTS = 50;
export const SHARDS_PER_HEART = 6;

export interface Quest {
  id: string;
  text: string;
  done: boolean;
  progress: string;
  reward: string;
}

const UPGRADE_NAME: Record<UpgradeId, string> = {
  blaster: 'Blaster Power +1',
  rapid: 'Quick Reload',
  clip: 'Bigger Clip (+2 shots)',
  boltZap: 'BOLT Zapper',
  magnet: 'Bolt Magnet',
  heart: '+1 max heart',
};

/** Shop upgrade levels (kept here so vault prizes never go past the shop's maximum). */
export const UPGRADE_MAX: Record<UpgradeId, number> = { heart: 3, blaster: 2, rapid: 2, clip: 2, boltZap: 2, magnet: 2 };

function entities(def: LevelDef, type: string) {
  return Object.values(def.legend).filter((s) => s.type === type);
}

function vaultReward(def: LevelDef): string {
  const prize = Object.values(def.legend).find((s) => s.type === 'prize');
  if (!prize || prize.type !== 'prize') return '';
  return prize.reward === 'bolts' ? tr('300 bolts') : tr(UPGRADE_NAME[prize.reward]);
}

export function deckQuests(id: DeckId, save: SaveData): Quest[] {
  const def = LEVELS[id];
  const out: Quest[] = [];
  const cols = def.colonistIds ?? [];
  const freed = cols.filter((c) => save.colonists.includes(`${id}.${c}`)).length;
  out.push({ id: `${id}:colonists`, text: tr('Free the trapped colonists (blast their pink cocoons)'), done: freed === cols.length, progress: `${freed} / ${cols.length}`, reward: tr('+{each} bolts each, +{bonus} bonus', { each: COLONIST_BOLTS, bonus: QUEST_BOLTS }) });
  const found = def.shardIds.filter((s) => save.shards.includes(`${id}.${s}`)).length;
  out.push({ id: `${id}:shards`, text: tr('Find the memory shards (glowing pink crystals)'), done: found === def.shardIds.length, progress: `${found} / ${def.shardIds.length}`, reward: tr('+{bonus} bolts · every {n} give a heart', { bonus: QUEST_BOLTS, n: SHARDS_PER_HEART }) });
  if (entities(def, 'canister').length) {
    const got = save.canisters.some((c) => c.startsWith(`${id}.`));
    out.push({ id: `${id}:canister`, text: tr('Find the hidden heart canister'), done: got, progress: got ? '1 / 1' : '0 / 1', reward: tr('+1 max heart') });
  }
  const vault = Object.values(def.legend).find((s) => s.type === 'prize');
  if (vault && vault.type === 'prize') {
    const open = (save.prizes ?? []).includes(`${id}.${vault.id}`);
    out.push({ id: `${id}:vault`, text: tr('Crack the secret vault'), done: open, progress: open ? tr('opened') : tr('locked'), reward: vaultReward(def) });
  }
  return out;
}

/** Pays out any side quest on this deck that just got finished. Returns the reward messages. */
export function payQuests(id: DeckId, save: SaveData): string[] {
  const done = (save.quests ??= []);
  const out: string[] = [];
  for (const q of deckQuests(id, save)) {
    if (!q.done || done.includes(q.id)) continue;
    done.push(q.id);
    if (q.id.endsWith(':colonists')) {
      save.bolts += QUEST_BOLTS;
      out.push(tr('Side quest done: every colonist on this deck is free! +{n} bolts', { n: QUEST_BOLTS }));
    } else if (q.id.endsWith(':shards')) {
      save.bolts += QUEST_BOLTS;
      out.push(tr('Side quest done: all memory shards here found! +{n} bolts', { n: QUEST_BOLTS }));
    }
  }
  return out;
}

/** Every few memory shards give Jason another heart; all 18 teach BOLT GaScu's language. */
export function shardMilestone(save: SaveData): string | null {
  const n = save.shards.length;
  if (n === 18) return tr('ALL 18 memory shards! BOLT has learned GaScu’s light-language...');
  if (n % SHARDS_PER_HEART === 0) {
    save.maxHearts = Math.min(MAX_HEARTS, save.maxHearts + 1);
    return tr('{n} memory shards! +1 max heart', { n });
  }
  return tr('Memory shard {n} / 18 · {left} more for an extra heart', { n, left: SHARDS_PER_HEART - (n % SHARDS_PER_HEART) });
}

/** Applies a vault prize. Returns what Jason got. */
export function givePrize(reward: string, save: SaveData): string {
  if (reward === 'bolts') {
    save.bolts += 300;
    return tr('VAULT PRIZE: 300 bolts!');
  }
  const id = reward as UpgradeId;
  const lvl = save.upgrades[id] ?? 0;
  if (lvl >= UPGRADE_MAX[id]) {
    save.bolts += 150;
    return tr('VAULT PRIZE: 150 bolts ({name} is already maxed)', { name: tr(UPGRADE_NAME[id]) });
  }
  save.upgrades[id] = lvl + 1;
  if (id === 'heart') save.maxHearts = Math.min(MAX_HEARTS, save.maxHearts + 1);
  return tr('VAULT PRIZE: free upgrade, {name}!', { name: tr(UPGRADE_NAME[id]) });
}

/** What BOLT says the first time Jason gets close to each kind of thing. */
export const HINTS: Record<string, string> = {
  cocoon: 'See that pink cocoon? A colonist is trapped inside! BLAST it to set them free. Every colonist you save gives you bolts.',
  shard: 'A memory shard! Each one shows a piece of GaScu’s story. Every 6 give you an extra heart, and all 18 unlock a secret ending!',
  canister: 'A heart canister! Grab it for one more max heart.',
  prize: 'A vault chest! Open it for a FREE upgrade. Vaults are always locked behind a puzzle...',
  rune: 'Code pads! Step on them in the right order. There must be a sign with the code somewhere.',
  bolt: 'Bolts! They are money. Spend them at VENDY’s shop on upgrades like a bigger clip.',
  vendor: 'That is VENDY’s shop! Trade bolts for upgrades. Tap SHOP to look.',
};
