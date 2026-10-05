import { MAX_HEARTS } from '../src/core/constants';
import { newSave } from '../src/core/save';
import { difficultyFor } from '../src/game/difficulty';
import { COLONIST_BOLTS, QUEST_BOLTS, UPGRADE_MAX, deckQuests, givePrize, payQuests, shardMilestone } from '../src/game/quests';
import { LEVELS, LEVEL_ORDER } from '../src/levels';

// newSave() reads navigator for its quality default; give Jest a stand-in.
beforeAll(() => {
  (globalThis as { navigator?: unknown }).navigator ??= { hardwareConcurrency: 8 };
});

describe('difficulty', () => {
  it('rises deck by deck', () => {
    const save = newSave();
    const tiers = LEVEL_ORDER.map((id) => difficultyFor(LEVELS[id].index, save));
    for (let i = 1; i < tiers.length; i++) {
      expect(tiers[i].tier).toBeGreaterThan(tiers[i - 1].tier);
      expect(tiers[i].hp).toBeGreaterThan(tiers[i - 1].hp);
      expect(tiers[i].rate).toBeGreaterThan(tiers[i - 1].rate);
    }
    expect(tiers[0]).toMatchObject({ tier: 0, hp: 1, speed: 1, rate: 1 });
  });

  it('rises a little with weapon upgrades, so enemies keep up with Jason', () => {
    const save = newSave();
    const base = difficultyFor(2, save).tier;
    save.upgrades.blaster = 2;
    save.upgrades.clip = 1;
    expect(difficultyFor(2, save).tier).toBeCloseTo(base + 1.5);
  });
});

describe('side quests and rewards', () => {
  it('gives every deck its four side quests, including a vault', () => {
    const save = newSave();
    for (const id of LEVEL_ORDER) {
      const qs = deckQuests(id, save);
      expect(qs.map((q) => q.id.split(':')[1])).toEqual(['colonists', 'shards', 'canister', 'vault']);
      expect(qs.every((q) => !q.done)).toBe(true);
    }
  });

  it('pays the colonist and shard bonuses once each', () => {
    const save = newSave();
    save.colonists.push('cryo.c1', 'cryo.c2');
    expect(payQuests('cryo', save)).toHaveLength(1);
    expect(save.bolts).toBe(QUEST_BOLTS);
    expect(payQuests('cryo', save)).toHaveLength(0);
    save.shards.push('cryo.s1', 'cryo.s2', 'cryo.s3');
    payQuests('cryo', save);
    expect(save.bolts).toBe(QUEST_BOLTS * 2);
    expect(COLONIST_BOLTS).toBeGreaterThan(0);
  });

  it('gives an extra heart every six memory shards', () => {
    const save = newSave();
    const start = save.maxHearts;
    for (let i = 1; i <= 18; i++) {
      save.shards.push(`x.s${i}`);
      shardMilestone(save);
    }
    expect(save.maxHearts).toBe(Math.min(MAX_HEARTS, start + 2));
  });

  it('turns vault prizes into free upgrades, or bolts once maxed', () => {
    const save = newSave();
    expect(givePrize('clip', save)).toContain('Bigger Clip');
    expect(save.upgrades.clip).toBe(1);
    save.upgrades.clip = UPGRADE_MAX.clip;
    const before = save.bolts;
    givePrize('clip', save);
    expect(save.upgrades.clip).toBe(UPGRADE_MAX.clip);
    expect(save.bolts).toBeGreaterThan(before);
    givePrize('heart', save);
    expect(save.maxHearts).toBeGreaterThan(newSave().maxHearts);
  });
});
