import { newSave } from '../src/core/save';
import { LIGHT_STONES, findKind, plannedFinds, rescueKind } from '../src/game/collectibles';
import { companionPlan, helperOf, voiceOf, voyagePlan } from '../src/game/companions';
import { HINTS, deckQuests, payQuests, shardMilestone } from '../src/game/quests';
import { BOSS_CARD, FLYOVER, INTEL, TRANSITIONS } from '../src/game/story';
import { CHAPTER_DECKS, CHAPTER_PLAN, LEVELS, chapterIndex, chapterOf, chapterTotals, comingSoon, isFinale } from '../src/levels';
import { PANEL_IDS, panelSvg } from '../src/ui/panels';
import { parseLevel } from '../src/world/grid';
import type { DeckId } from '../src/world/levelTypes';
import { isCollectible, reach } from '../tools/reach';

// newSave() reads navigator for its quality default; give Jest a stand-in.
beforeAll(() => {
  (globalThis as { navigator?: unknown }).navigator ??= { hardwareConcurrency: 8 };
});

const flags = (...on: string[]) => (f: string) => on.includes(f);
const level = parseLevel(LEVELS.harpies);
const ALL = ['doubleJump', 'dash', 'glide', 'pulse', 'grapple'] as const;
const find = (pred: (e: (typeof level.entities)[number]) => boolean) => level.entities.filter(pred);

describe('the Harpy Isles', () => {
  it('is chapter 3’s second level, after the Clashing Rocks, with Aeëtes’s Mine coming next', () => {
    expect(CHAPTER_DECKS[3].slice(0, 2)).toEqual(['rocks', 'harpies']);
    expect(chapterOf('harpies')).toBe(3);
    expect(chapterIndex('harpies')).toBe(2);
    expect(CHAPTER_PLAN[3][1]).toBe(LEVELS.harpies.name);
    expect(isFinale('harpies')).toBe(false);
    if (CHAPTER_DECKS[3].length === 2) expect(comingSoon(3)[0]).toBe('Aeëtes’s Mine');
    expect(FLYOVER.harpies).not.toBe('');
    // It ends with the Argo hearing that Brennus has gone after Aeëtes alone.
    expect(TRANSITIONS.harpies.map((l) => l.who)).toContain('brennus');
    expect(TRANSITIONS.rocks.some((l) => l.text.includes('beacon'))).toBe(true);
  });

  it('starts with Jason alone and lets Atalanta join at her skiff', () => {
    expect(LEVELS.harpies.heroes).toEqual(['jason', 'atalanta']);
    const flag = LEVELS.harpies.joins?.atalanta;
    expect(flag).toBe('atalanta');
    const meet = find((e) => e.spec.type === 'trigger' && e.spec.event === 'join:atalanta');
    expect(meet).toHaveLength(1);
    expect(find((e) => e.spec.type === 'marker' && e.spec.id === 'atalanta')).toHaveLength(1);
    // Jason can get to the meeting on his own (everything before it is his).
    const alone = reach(level, [...ALL], ['jason']);
    expect(alone.reached.has(`${meet[0].cx},${meet[0].cz}`)).toBe(true);
    for (const key of ['meet:atalanta', 'joined:atalanta', 'log']) expect(LEVELS.harpies.dialogues[key]?.length).toBeGreaterThan(0);
    expect(LEVELS.harpies.stories?.['meet:atalanta']?.[0].panel).toBe('ch3-atalanta');
    expect(LEVELS.harpies.stories?.phineus?.[0].panel).toBe('ch3-phineus');
  });

  it('needs both heroes: each one alone gets stuck somewhere', () => {
    const jason = reach(level, [...ALL], ['jason']).missing.filter((e) => !isCollectible(e.spec)).map((e) => e.spec.type);
    const atalanta = reach(level, [...ALL], ['atalanta']).missing.filter((e) => !isCollectible(e.spec)).map((e) => e.spec.type);
    expect(jason).toContain('target');
    expect(atalanta).toContain('switch');
    expect(atalanta).toContain('boss');
    expect(reach(level, [...ALL]).missing.filter((e) => !isCollectible(e.spec))).toEqual([]);
  });

  it('has the hero puzzles, gadgets and side quests of a full level', () => {
    const count = (t: string) => find((e) => e.spec.type === t).length;
    expect(count('target')).toBeGreaterThanOrEqual(2);
    expect(count('switch')).toBeGreaterThanOrEqual(2);
    expect(count('wallrun')).toBeGreaterThan(0);
    expect(count('lowgap')).toBeGreaterThan(0);
    expect(count('anchor')).toBeGreaterThan(2);
    expect(count('wind')).toBeGreaterThan(1);
    expect(count('vent')).toBeGreaterThan(0);
    expect(count('checkpoint')).toBeGreaterThanOrEqual(3);
    expect(count('vendor')).toBe(1);
    expect(count('enemy')).toBeGreaterThanOrEqual(25);
    expect(find((e) => e.spec.type === 'enemy' && e.spec.enemy === 'harpy').length).toBeGreaterThan(5);
    expect(find((e) => e.spec.type === 'prize' && e.spec.id === 'vault')).toHaveLength(1);
    expect(find((e) => e.spec.type === 'boss' && e.spec.boss === 'aello')).toHaveLength(1);
    expect(BOSS_CARD.aello.sub).toBeTruthy();
    expect(INTEL.harpy.tip).toBeTruthy();
  });

  it('paints the meeting with Atalanta and Phineus’s stolen dinner', () => {
    for (const id of ['ch3-atalanta', 'ch3-phineus'] as const) {
      expect(PANEL_IDS).toContain(id);
      const svg = panelSvg(id);
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg).not.toContain(`>${id}</text>`);
    }
  });
});

describe('the droids in chapter 3', () => {
  const crew = (hero: 'jason' | 'atalanta', atalanta: boolean) => ({ chapter: 3, hero, atalanta });

  it('sends both droids along: LUX leads until Atalanta joins, IRIS tags along', () => {
    expect(companionPlan('harpies', flags('bolt'), crew('jason', false))).toEqual({ lead: 'lux', tag: 'iris' });
    expect(helperOf('harpies', voyagePlan(crew('jason', false)))).toBe('lux');
  });

  it('gives the lead to the playing hero’s droid: LUX for Jason, IRIS for Atalanta', () => {
    expect(companionPlan('harpies', flags('bolt', 'atalanta'), crew('jason', true))).toEqual({ lead: 'lux', tag: 'iris' });
    expect(companionPlan('harpies', flags('bolt', 'atalanta'), crew('atalanta', true))).toEqual({ lead: 'iris', tag: 'lux' });
  });

  it('keeps LUX’s own lines his while he tags along, and IRIS gives the hints', () => {
    const plan = voyagePlan(crew('atalanta', true));
    expect(voiceOf('bolt', plan, false)).toBe('bolt');
    expect(voiceOf('bolt', plan, true)).toBe('iris');
  });

  it('leaves chapter 2 as it was', () => {
    expect(companionPlan('volcano', flags('bolt'), { chapter: 2, hero: 'jason', atalanta: false })).toEqual({ lead: 'iris', tag: null });
    expect(companionPlan('plains', flags('bolt'), { chapter: 2, hero: 'jason', atalanta: false })).toEqual({ lead: 'lux', tag: null });
    expect(voiceOf('bolt', { lead: 'iris', tag: null }, false)).toBe('iris');
  });
});

describe('Gardener light-stones', () => {
  it('are chapter 3’s collectible, with harpy nets of stolen supplies as its rescues', () => {
    expect([findKind(1), findKind(2), findKind(3)]).toEqual(['shard', 'page', 'stone']);
    expect([rescueKind(1), rescueKind(2), rescueKind(3)]).toEqual(['colonist', 'scientist', 'supplies']);
    expect(HINTS.stone).toBeTruthy();
    expect(HINTS.supplies).toBeTruthy();
  });

  it('come three to a level on foot, counted toward the whole planned chapter', () => {
    const foot = CHAPTER_DECKS[3].filter((id: DeckId) => !LEVELS[id].vehicle);
    for (const id of foot) expect(LEVELS[id].shardIds).toHaveLength(3);
    expect(chapterTotals(3).shards).toBe(foot.length * 3);
    expect(plannedFinds(3, chapterTotals(3).shards)).toBe(LIGHT_STONES);
    expect(plannedFinds(2, 18)).toBe(18);
  });

  it('give light-stone quests and milestones, and a heart every 6', () => {
    const save = newSave();
    const quests = deckQuests('harpies', save);
    expect(quests.map((q) => q.id.split(':')[1])).toEqual(['colonists', 'shards', 'canister', 'vault']);
    expect(quests[1].text).toContain('light-stones');
    save.shards.push('harpies.s1');
    expect(shardMilestone(save, 'harpies')).toContain(`/ ${LIGHT_STONES}`);
    // Three of them: halfway to the next heart.
    const hearts = save.maxHearts;
    save.shards.push('harpies.s2', 'harpies.s3');
    expect(shardMilestone(save, 'harpies')).toContain('3 /');
    expect(save.maxHearts).toBe(hearts);
    for (const c of ['c1', 'c2', 'c3']) save.colonists.push(`harpies.${c}`);
    expect(payQuests('harpies', save).length).toBeGreaterThan(0);
  });
});
