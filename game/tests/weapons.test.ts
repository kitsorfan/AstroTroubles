import { migrateSave, newSave, type SaveData } from '../src/core/save';
import { WEAPONS, WEAPON_ORDER, equippedWeapon, nextWeapon, ownedWeapons } from '../src/entities/weapons';
import { difficultyFor } from '../src/game/difficulty';
import { buyWeapon, equipWeapon, gaiaReached, shopStock } from '../src/game/shop';
import { CHAPTER_DECKS } from '../src/levels';

// newSave() reads navigator for its quality default; give Jest a stand-in.
beforeAll(() => {
  (globalThis as { navigator?: unknown }).navigator ??= { hardwareConcurrency: 8 };
});

/** A save that has just arrived on Gaia Nova. */
function onGaia(): SaveData {
  const s = newSave();
  s.unlocked = CHAPTER_DECKS[1].length + 1;
  return s;
}

describe('weapons', () => {
  it('starts every new save with just the Blaster', () => {
    const s = newSave();
    expect(s.weapons).toEqual(['blaster']);
    expect(s.weapon).toBe('blaster');
  });

  it('gives old saves the Blaster and drops weapons it does not know', () => {
    const old = newSave() as Partial<SaveData>;
    delete old.weapons;
    delete old.weapon;
    const s = migrateSave(old as SaveData);
    expect(s.weapons).toEqual(['blaster']);
    expect(s.weapon).toBe('blaster');
    const odd = migrateSave({ ...newSave(), weapons: ['frost', 'laserSword'], weapon: 'laserSword' });
    expect(odd.weapons).toEqual(['blaster', 'frost']);
    expect(odd.weapon).toBe('blaster');
  });

  it('cycles through the owned weapons in shop order and wraps round', () => {
    const owned = ['seeker', 'blaster', 'spread'];
    expect(ownedWeapons(owned)).toEqual(['blaster', 'spread', 'seeker']);
    expect(nextWeapon(owned, 'blaster')).toBe('spread');
    expect(nextWeapon(owned, 'spread')).toBe('seeker');
    expect(nextWeapon(owned, 'seeker')).toBe('blaster');
    // With only the Blaster there is nothing to switch to.
    expect(nextWeapon(['blaster'], 'blaster')).toBe('blaster');
    // An unknown or unowned weapon falls back to the Blaster.
    expect(equippedWeapon(owned, 'frost')).toBe('blaster');
  });

  it('makes enemies only a little tougher for each extra weapon', () => {
    const s = onGaia();
    const base = difficultyFor(8, s).tier;
    s.weapons = [...WEAPON_ORDER];
    const all = difficultyFor(8, s).tier;
    expect(all).toBeGreaterThan(base);
    expect(all - base).toBeLessThanOrEqual(0.5);
  });

  it('prices every weapon but the Blaster, cheapest first', () => {
    const prices = WEAPON_ORDER.map((id) => WEAPONS[id].price);
    expect(prices[0]).toBe(0);
    for (let i = 2; i < prices.length; i++) expect(prices[i]).toBeGreaterThan(prices[i - 1]);
  });
});

describe('weapon shop', () => {
  it('sells no weapons on the ship', () => {
    const s = newSave();
    s.bolts = 9999;
    expect(gaiaReached(s)).toBe(false);
    expect(shopStock(s, 'bridge').weapons).toEqual([]);
    expect(buyWeapon(s, 'spread', 'bridge')).toBe(false);
    expect(s.bolts).toBe(9999);
  });

  it('sells every weapon once Gaia Nova is reached (or while playing there)', () => {
    expect(shopStock(onGaia()).weapons.map((o) => o.weapon.id)).toEqual(WEAPON_ORDER);
    expect(shopStock(newSave(), 'plains').weapons).toHaveLength(WEAPON_ORDER.length);
  });

  it('buys a weapon, equips it, and never sells it twice', () => {
    const s = onGaia();
    s.bolts = WEAPONS.frost.price - 1;
    expect(buyWeapon(s, 'frost')).toBe(false);
    s.bolts += 1;
    expect(buyWeapon(s, 'frost')).toBe(true);
    expect(s.bolts).toBe(0);
    expect(s.weapons).toEqual(['blaster', 'frost']);
    expect(s.weapon).toBe('frost');
    s.bolts = 9999;
    expect(buyWeapon(s, 'frost')).toBe(false);
    expect(s.bolts).toBe(9999);
    const offer = shopStock(s).weapons.find((o) => o.weapon.id === 'frost');
    expect(offer).toMatchObject({ owned: true, equipped: true, price: null });
  });

  it('only equips weapons Jason owns', () => {
    const s = onGaia();
    expect(equipWeapon(s, 'thunder')).toBe(false);
    expect(s.weapon).toBe('blaster');
    s.weapons.push('thunder');
    expect(equipWeapon(s, 'thunder')).toBe(true);
    expect(s.weapon).toBe('thunder');
  });
});
