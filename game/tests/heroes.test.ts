import { ATALANTA, CELL, PLAYER } from '../src/core/constants';
import { HERO_IDS, HEROES, heroCan, heroRoster, nextHero, parseHeroes, switchBlock, type SwitchState } from '../src/entities/heroes/heroes';
import { heroCourse } from '../src/entities/heroes/course';
import { LOWGAP_CLEAR } from '../src/entities/heroes/heroProps';
import { LEVELS, LEVEL_ORDER } from '../src/levels';
import { Grid, parseLevel } from '../src/world/grid';
import type { HeroId, LevelDef, Spec } from '../src/world/levelTypes';
import { makeBody, moveBody, type Box } from '../src/world/physics';
import { atalantaReach, jumpReach, reach, wallRunStrips } from '../tools/reach';

// heroProps builds three.js props; the test only needs its constants, so give it the real module.
jest.mock('three', () => process.getBuiltinModule('node:module').createRequire(__filename)('three'));

describe('hero table', () => {
  it('describes every hero, keyed by its own id', () => {
    for (const id of HERO_IDS) {
      expect(HEROES[id].id).toBe(id);
      expect(HEROES[id].moves.length).toBeGreaterThan(0);
      expect(HEROES[id].speed).toBeGreaterThan(0);
      expect(HEROES[id].color).toMatch(/^#[0-9a-f]{6}$/);
    }
    expect(HERO_IDS).toEqual(['jason', 'atalanta', 'brennus']);
  });

  it('keeps Jason and Atalanta playable, and Brennus waiting for his levels', () => {
    expect(HEROES.jason.playable).toBe(true);
    expect(HEROES.atalanta.playable).toBe(true);
    expect(HEROES.brennus.playable).toBe(false);
  });

  it('gives each hero moves of their own', () => {
    for (const m of ['grapple', 'pound', 'weapons', 'doubleJump', 'dash'] as const) {
      expect(heroCan('jason', m)).toBe(true);
      expect(heroCan('atalanta', m)).toBe(false);
    }
    for (const m of ['sprint', 'wallJump', 'wallRun', 'slide', 'bow', 'kick'] as const) {
      expect(heroCan('atalanta', m)).toBe(true);
      expect(heroCan('jason', m)).toBe(false);
    }
    // Brennus: slow and strong.
    expect(HEROES.brennus.speed).toBeLessThan(HEROES.jason.speed);
    expect(heroCan('brennus', 'smash')).toBe(true);
  });

  it('makes Atalanta the quicker runner with the higher single jump', () => {
    expect(ATALANTA.speed).toBeGreaterThan(PLAYER.speed);
    expect(ATALANTA.sprintSpeed).toBeGreaterThan(ATALANTA.speed);
    expect(ATALANTA.jumpV).toBeGreaterThan(PLAYER.jumpV);
    // But Jason's jet boots still take him higher than her single jump.
    const apex = (v: number) => (v * v) / 64;
    expect(apex(PLAYER.jumpV) + apex(PLAYER.doubleJumpV)).toBeGreaterThan(apex(ATALANTA.jumpV));
    // Her bow outranges his blaster, and a slide fits under a low gap while standing doesn't.
    expect(ATALANTA.arrowRange).toBeGreaterThan(PLAYER.shotRange);
    expect(ATALANTA.crouchHeight).toBeLessThan(LOWGAP_CLEAR);
    expect(PLAYER.height).toBeGreaterThan(LOWGAP_CLEAR);
  });
});

describe('hero roster and switching', () => {
  it('defaults to Jason alone', () => {
    expect(heroRoster()).toEqual(['jason']);
    expect(heroRoster([])).toEqual(['jason']);
  });

  it('uses the level list, dropping unplayable heroes and repeats', () => {
    expect(heroRoster(['atalanta', 'jason'])).toEqual(['atalanta', 'jason']);
    expect(heroRoster(['jason', 'brennus', 'jason'])).toEqual(['jason']);
    expect(heroRoster(['brennus'])).toEqual(['jason']);
  });

  it('lets the developer hash override the list and the starting hero', () => {
    expect(heroRoster(['jason'], { heroes: ['jason', 'atalanta'] })).toEqual(['jason', 'atalanta']);
    expect(heroRoster(['jason', 'atalanta'], { hero: 'atalanta' })).toEqual(['atalanta', 'jason']);
    expect(heroRoster(undefined, { hero: 'atalanta' })).toEqual(['atalanta', 'jason']);
    expect(parseHeroes('Jason, atalanta,bolt,,')).toEqual(['jason', 'atalanta']);
    expect(parseHeroes(null)).toEqual([]);
  });

  it('cycles through the roster', () => {
    expect(nextHero(['jason'], 'jason')).toBeNull();
    expect(nextHero(['jason', 'atalanta'], 'jason')).toBe('atalanta');
    expect(nextHero(['jason', 'atalanta'], 'atalanta')).toBe('jason');
    const three: HeroId[] = ['jason', 'atalanta', 'brennus'];
    expect(nextHero(three, 'atalanta')).toBe('brennus');
    expect(nextHero(three, 'brennus')).toBe('jason');
  });

  const ok: SwitchState = { roster: ['jason', 'atalanta'], current: 'jason', cooldown: 0, grounded: true, locked: false, busy: false, cramped: false };

  it('switches only on the ground, between moves, with room to stand and after the cooldown', () => {
    expect(switchBlock(ok)).toBeNull();
    expect(switchBlock({ ...ok, roster: ['jason'] })).toBe('alone');
    expect(switchBlock({ ...ok, locked: true })).toBe('locked');
    expect(switchBlock({ ...ok, busy: true })).toBe('busy');
    expect(switchBlock({ ...ok, grounded: false })).toBe('air');
    expect(switchBlock({ ...ok, cramped: true })).toBe('cramped');
    expect(switchBlock({ ...ok, cooldown: 0.2 })).toBe('cooldown');
  });

  it('leaves every existing level to Jason alone', () => {
    for (const id of LEVEL_ORDER) expect(heroRoster(LEVELS[id].heroes)).toEqual(['jason']);
  });
});

describe('slide under a low gap', () => {
  // A corridor with a low gap's box over cell 3: its bottom is LOWGAP_CLEAR above the floor.
  const grid = new Grid(7, 1, Array.from({ length: 7 }, () => ({ kind: 'floor' as const, h: 0, dark: false })));
  const gap: Box = { minX: 3 * CELL, maxX: 4 * CELL, minZ: 0, maxZ: CELL, bottom: LOWGAP_CLEAR, top: 60, solid: true, dx: 0, dy: 0, dz: 0 };
  const run = (h: number) => {
    const b = makeBody(CELL * 1.5, 0, CELL / 2, PLAYER.radius, h);
    b.grounded = true;
    for (let i = 0; i < 120; i++) {
      b.vx = 8;
      moveBody(b, 1 / 60, grid, [gap]);
    }
    return b.x;
  };

  it('stops a standing hero and lets a sliding one through', () => {
    expect(run(PLAYER.height)).toBeLessThan(3 * CELL);
    expect(run(ATALANTA.crouchHeight)).toBeGreaterThan(4 * CELL);
  });
});

/** A test level: the map plus a legend, with both heroes unless told otherwise. */
function level(map: string[], legend: Record<string, Spec> = {}, heroes: HeroId[] = ['jason', 'atalanta']) {
  const def: LevelDef = { id: 'plains', index: 13, name: 'test', subtitle: '', music: 'plains', map: `\n${map.join('\n')}\n`, legend, objectives: [], shardIds: [], dialogues: {}, heroes };
  return parseLevel(def);
}
const missingWith = (lv: ReturnType<typeof level>, heroes: HeroId[]) => reach(lv, [], heroes).missing.map((e) => e.spec.type);

describe('reach checker with heroes', () => {
  it('works out jump envelopes for Atalanta', () => {
    // A sprint jump goes farther than a standing one, and farther than Jason's single jump.
    expect(atalantaReach(0, ATALANTA.sprintSpeed, false)).toBeGreaterThan(atalantaReach(0, ATALANTA.speed, false));
    expect(atalantaReach(0, ATALANTA.speed, false)).toBeGreaterThan(jumpReach(0, []));
    // A wall-jump reaches ledges her single jump can't.
    expect(atalantaReach(3.5, ATALANTA.speed, false)).toBe(0);
    expect(atalantaReach(3.5, ATALANTA.speed, true)).toBeGreaterThan(1);
  });

  it('lets only Atalanta crawl through a low gap', () => {
    const lv = level(['#########', '#@..L..C#', '#########'], { L: { type: 'lowgap' }, C: { type: 'checkpoint', id: 'cp' } });
    expect(missingWith(lv, ['jason'])).toEqual(['checkpoint']);
    expect(missingWith(lv, ['atalanta'])).toEqual([]);
    expect(missingWith(lv, ['jason', 'atalanta'])).toEqual([]);
  });

  it('lets her sprint-jump a gap only with a run-up', () => {
    // A four-cell jump (centre to centre) over a three-cell gap.
    const runUp = level(['@....   .C'], { C: { type: 'checkpoint', id: 'cp' } });
    expect(missingWith(runUp, ['jason'])).toEqual(['checkpoint']);
    expect(missingWith(runUp, ['atalanta'])).toEqual([]);
    const noRoom = level(['@', '.   .C'].map((r) => r.padEnd(6, ' ')), { C: { type: 'checkpoint', id: 'cp' } });
    expect(missingWith(noRoom, ['atalanta'])).toEqual(['checkpoint']);
  });

  it('runs along wall-run strips', () => {
    // Eight cells from ledge to ledge, along a stripe on the wall above the gap.
    const lv = level(['WWWWWWWWWWW', '@.       .C', '..       ..'], { W: { type: 'wallrun' }, C: { type: 'checkpoint', id: 'cp' } });
    expect(wallRunStrips(lv)).toContainEqual({ nx: 0, nz: 1, line: 1, from: 0, to: 10 });
    expect(missingWith(lv, ['jason'])).toEqual(['checkpoint']);
    expect(missingWith(lv, ['atalanta'])).toEqual([]);
    // The same gap along a plain wall is too far for her.
    const plain = level(['###########', '@.       .C', '..       ..'], { C: { type: 'checkpoint', id: 'cp' } });
    expect(missingWith(plain, ['atalanta'])).toEqual(['checkpoint']);
  });

  it('needs a clear shot from Atalanta for an arrow target', () => {
    const open = level(['@...          T'], { T: { type: 'target', flag: 'gate' } });
    expect(missingWith(open, ['jason'])).toEqual(['target']);
    expect(missingWith(open, ['jason', 'atalanta'])).toEqual([]);
    const walled = level(['@...    #     T'], { T: { type: 'target', flag: 'gate' } });
    expect(missingWith(walled, ['atalanta'])).toEqual(['target']);
  });

  it('lets the heroes take turns: her crawl, then his double jump', () => {
    // Through the low gap (Atalanta only), then up a ledge too high for her jump with no wall to kick off (Jason's jet boots).
    const lv = level(['####    ', '#@.L..6C', '####    '], { L: { type: 'lowgap' }, C: { type: 'checkpoint', id: 'cp' } });
    const both = reach(lv, ['doubleJump'], ['jason', 'atalanta']).missing.map((e) => e.spec.type);
    expect(both).toEqual([]);
    expect(reach(lv, ['doubleJump'], ['jason']).missing.map((e) => e.spec.type)).toEqual(['checkpoint']);
    expect(reach(lv, ['doubleJump'], ['atalanta']).missing.map((e) => e.spec.type)).toEqual(['checkpoint']);
  });
});

describe('the dev practice course', () => {
  const lv = parseLevel(heroCourse('plains', 'Course'));

  it('is all reachable when you can switch, and needs Atalanta', () => {
    expect(reach(lv, []).missing.map((e) => e.id)).toEqual([]);
    expect(reach(lv, [], ['jason']).missing.map((e) => e.spec.type)).toContain('checkpoint');
  });
});
