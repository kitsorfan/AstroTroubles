import { tr } from '../core/i18n';
import type { SaveData, UpgradeId } from '../core/save';
import { LEVELS, chapterOf, chapterTotals, inChapter } from '../levels';
import type { DeckId, LevelDef } from '../world/levelTypes';
import { heartCap, levelUp } from './shop';

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
  boltZap: 'LUX Zapper',
  magnet: 'Bolt Magnet',
  heart: '+1 max heart',
  armor: 'Armor Plating',
  dashCell: 'Dash Cell',
  spinCharge: 'Spin Charge',
  grapple: 'Grapple Range',
};

/** Shop upgrade levels per chapter (vault prizes never go past the shop's maximum). */
export { UPGRADE_MAX } from './shop';

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
  const planet = chapterOf(id) === 2;
  const out: Quest[] = [];
  const cols = def.colonistIds ?? [];
  const freed = cols.filter((c) => save.colonists.includes(`${id}.${c}`)).length;
  out.push({
    id: `${id}:colonists`,
    text: planet ? tr('Free the captured scientists (blast their thorn cocoons)') : tr('Free the trapped colonists (blast their pink cocoons)'),
    done: freed === cols.length,
    progress: `${freed} / ${cols.length}`,
    reward: tr('+{each} bolts each, +{bonus} bonus', { each: COLONIST_BOLTS, bonus: QUEST_BOLTS }),
  });
  const found = def.shardIds.filter((s) => save.shards.includes(`${id}.${s}`)).length;
  out.push({
    id: `${id}:shards`,
    text: planet ? tr('Find the pages of Brennus’s journal (glowing gold pages)') : tr('Find the memory shards (glowing pink crystals)'),
    done: found === def.shardIds.length,
    progress: `${found} / ${def.shardIds.length}`,
    reward: tr('+{bonus} bolts · every {n} give a heart', { bonus: QUEST_BOLTS, n: SHARDS_PER_HEART }),
  });
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
    const planet = chapterOf(id) === 2;
    if (q.id.endsWith(':colonists')) {
      save.bolts += QUEST_BOLTS;
      out.push(planet ? tr('Side quest done: every scientist here is free! +{n} bolts', { n: QUEST_BOLTS }) : tr('Side quest done: every colonist on this deck is free! +{n} bolts', { n: QUEST_BOLTS }));
    } else if (q.id.endsWith(':shards')) {
      save.bolts += QUEST_BOLTS;
      out.push(planet ? tr('Side quest done: every journal page here found! +{n} bolts', { n: QUEST_BOLTS }) : tr('Side quest done: all memory shards here found! +{n} bolts', { n: QUEST_BOLTS }));
    }
  }
  return out;
}

/**
 * Every few shards of a chapter give Jason another heart. All 18 memory shards teach LUX GaScu's
 * language; all 18 journal pages tell Brennus's whole story. Counted per chapter (`deck` is where
 * the shard was found).
 */
export function shardMilestone(save: SaveData, deck: DeckId): string | null {
  const ch = chapterOf(deck);
  const n = inChapter(save.shards, ch);
  const total = chapterTotals(ch).shards;
  if (n === total) return ch === 1 ? tr('ALL 18 memory shards! LUX has learned GaScu’s light-language...') : tr('ALL 18 journal pages! Now you know Brennus’s whole story...');
  if (n % SHARDS_PER_HEART === 0) {
    save.maxHearts = Math.min(heartCap(save), save.maxHearts + 1);
    return ch === 1 ? tr('{n} memory shards! +1 max heart', { n }) : tr('{n} journal pages! +1 max heart', { n });
  }
  const left = SHARDS_PER_HEART - (n % SHARDS_PER_HEART);
  return ch === 1 ? tr('Memory shard {n} / 18 · {left} more for an extra heart', { n, left }) : tr('Journal page {n} / 18 · {left} more for an extra heart', { n, left });
}

/**
 * Applies a vault prize: a free level of an upgrade, never past what the shop sells in this chapter
 * (on Gaia Nova that includes the Mk II levels). Returns what Jason got.
 */
export function givePrize(reward: string, save: SaveData, deck?: DeckId): string {
  if (reward === 'bolts') {
    save.bolts += 300;
    return tr('VAULT PRIZE: 300 bolts!');
  }
  const id = reward as UpgradeId;
  if (!levelUp(save, id, deck)) {
    save.bolts += 150;
    return tr('VAULT PRIZE: 150 bolts ({name} is already maxed)', { name: tr(UPGRADE_NAME[id]) });
  }
  return tr('VAULT PRIZE: free upgrade, {name}!', { name: tr(UPGRADE_NAME[id]) });
}

/** What LUX says the first time Jason gets close to each kind of thing. */
export const HINTS: Record<string, string> = {
  cocoon: 'See that pink cocoon? A colonist is trapped inside! BLAST it to set them free. Every colonist you save gives you bolts.',
  shard: 'A memory shard! Each one shows a piece of GaScu’s story. Every 6 give you an extra heart, and all 18 unlock a secret ending!',
  canister: 'A heart canister! Grab it for one more max heart.',
  prize: 'A vault chest! Open it for a FREE upgrade. Vaults are always locked behind a puzzle...',
  rune: 'Code pads! Step on them in the right order. There must be a sign with the code somewhere.',
  scientist: 'A thorn cocoon! One of Dr. Hypatia’s scientists is trapped inside. BLAST it to set them free!',
  page: 'A page from General Brennus’s journal! Every 6 give you an extra heart, and all 18 might help us reach him...',
  anchor: 'A grapple ring! With a hook, we could zip right over to those. I wonder where we could find one...',
  bolt: 'Bolts! They are money. Spend them at PANDORA’s shop on upgrades like a bigger clip.',
  vendor: 'That is PANDORA’s shop! Trade bolts for upgrades. Tap SHOP to look.',
};
