import { MAX_HEARTS, MAX_HEARTS_MK2 } from '../src/core/constants';
import { newSave, type SaveData, type UpgradeId } from '../src/core/save';
import { difficultyFor } from '../src/game/difficulty';
import { givePrize, shardMilestone } from '../src/game/quests';
import { UPGRADES, UPGRADE_MAX, buyUpgrade, heartCap, shopChapter, shopStock, upgradeCap } from '../src/game/shop';
import { CHAPTER_DECKS } from '../src/levels';

// newSave() reads navigator for its quality default; give Jest a stand-in.
beforeAll(() => {
  (globalThis as { navigator?: unknown }).navigator ??= { hardwareConcurrency: 8 };
});

const NEW: UpgradeId[] = ['armor', 'dashCell', 'spinCharge', 'grapple'];

/** A save with every ship upgrade maxed and 10 hearts: the usual state at the end of chapter 1. */
function maxedShip(onGaia: boolean): SaveData {
  const s = newSave();
  for (const u of UPGRADES) if (u.prices.length) s.upgrades[u.id] = u.prices.length;
  s.maxHearts = MAX_HEARTS;
  if (onGaia) s.unlocked = CHAPTER_DECKS[1].length + 1;
  return s;
}

describe('upgrade caps per chapter', () => {
  it('keeps the ship’s caps in chapter 1, exactly as before', () => {
    expect(UPGRADE_MAX[1]).toMatchObject({ heart: 3, blaster: 2, rapid: 2, clip: 2, boltZap: 2, magnet: 2 });
    for (const id of NEW) expect(UPGRADE_MAX[1][id]).toBe(0);
  });

  it('adds Mk II levels and four new upgrades on Gaia Nova', () => {
    for (const u of UPGRADES) expect(UPGRADE_MAX[2][u.id]).toBeGreaterThan(UPGRADE_MAX[1][u.id]);
    expect(UPGRADE_MAX[2]).toMatchObject({ heart: 5, blaster: 3, rapid: 3, clip: 3, boltZap: 3, magnet: 3 });
    for (const id of NEW) expect(UPGRADE_MAX[2][id]).toBeGreaterThan(0);
  });

  it('prices every Mk II level above the ship’s levels', () => {
    for (const u of UPGRADES) {
      const all = [...u.prices, ...u.mk2];
      for (let i = 1; i < all.length; i++) expect(all[i]).toBeGreaterThan(all[i - 1]);
    }
  });

  it('opens the chapter 2 stock once Gaia Nova is reached, or while playing there', () => {
    expect(shopChapter(newSave())).toBe(1);
    expect(shopChapter(newSave(), 'desert')).toBe(2);
    expect(shopChapter(maxedShip(true))).toBe(2);
    expect(upgradeCap('blaster', maxedShip(false))).toBe(2);
    expect(upgradeCap('blaster', maxedShip(true))).toBe(3);
  });
});

describe('the shop', () => {
  it('has nothing left to buy at the end of chapter 1', () => {
    const s = maxedShip(false);
    s.bolts = 99999;
    const stock = shopStock(s, 'bridge');
    expect(stock.upgrades.map((o) => o.item.id)).not.toContain('armor');
    expect(stock.upgrades.every((o) => o.price === null)).toBe(true);
    expect(buyUpgrade(s, 'blaster', 'bridge')).toBe(false);
  });

  it('sells Mk II levels and the new upgrades on Gaia Nova', () => {
    const s = maxedShip(true);
    s.bolts = 99999;
    const stock = shopStock(s, 'plains');
    expect(stock.upgrades).toHaveLength(UPGRADES.length);
    expect(stock.upgrades.every((o) => o.price !== null)).toBe(true);
    expect(buyUpgrade(s, 'blaster', 'plains')).toBe(true);
    expect(s.upgrades.blaster).toBe(3);
    expect(buyUpgrade(s, 'blaster', 'plains')).toBe(false);
    expect(buyUpgrade(s, 'armor', 'plains')).toBe(true);
    expect(s.upgrades.armor).toBe(1);
  });

  it('raises the heart limit with Heart Plating Mk II, up to 12', () => {
    const s = maxedShip(true);
    s.bolts = 99999;
    expect(heartCap(s)).toBe(MAX_HEARTS);
    expect(buyUpgrade(s, 'heart')).toBe(true);
    expect(s.maxHearts).toBe(MAX_HEARTS + 1);
    expect(buyUpgrade(s, 'heart')).toBe(true);
    expect(s.maxHearts).toBe(MAX_HEARTS_MK2);
    expect(buyUpgrade(s, 'heart')).toBe(false);
    expect(heartCap(s)).toBe(MAX_HEARTS_MK2);
  });

  it('goes straight to Mk II hearts if canisters already filled Jason up to 10', () => {
    const s = maxedShip(true);
    s.upgrades.heart = 1;
    s.bolts = 99999;
    const offer = shopStock(s).upgrades.find((o) => o.item.id === 'heart');
    expect(offer?.level).toBe(3);
    expect(buyUpgrade(s, 'heart')).toBe(true);
    expect(s.upgrades.heart).toBe(4);
    expect(s.maxHearts).toBe(MAX_HEARTS + 1);
  });

  it('lets canisters and pages fill the extra heart slots only after Mk II', () => {
    const s = maxedShip(true);
    for (let i = 1; i <= 6; i++) s.shards.push(`${CHAPTER_DECKS[2][0]}.s${i}`);
    shardMilestone(s, CHAPTER_DECKS[2][0]);
    expect(s.maxHearts).toBe(MAX_HEARTS);
  });
});

describe('vault prizes', () => {
  it('never go past the shop’s cap for the chapter', () => {
    const ship = maxedShip(false);
    const before = ship.bolts;
    givePrize('blaster', ship, 'bridge');
    expect(ship.upgrades.blaster).toBe(2);
    expect(ship.bolts).toBeGreaterThan(before);
    const gaia = maxedShip(true);
    expect(givePrize('blaster', gaia, 'volcano')).toContain('Blaster Power');
    expect(gaia.upgrades.blaster).toBe(3);
    givePrize('blaster', gaia, 'volcano');
    expect(gaia.upgrades.blaster).toBe(3);
    givePrize('heart', gaia, 'snow');
    expect(gaia.maxHearts).toBe(MAX_HEARTS + 1);
  });
});

describe('difficulty with Mk II', () => {
  it('counts Mk II weapon levels a little less than the ship’s', () => {
    const s = maxedShip(true);
    const base = difficultyFor(8, s).tier;
    s.upgrades.blaster = 3;
    const up = difficultyFor(8, s).tier - base;
    expect(up).toBeGreaterThan(0);
    expect(up).toBeLessThan(0.5);
  });
});
