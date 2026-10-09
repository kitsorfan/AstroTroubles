import { GRAVITY, MECH, STEP_H } from '../src/core/constants';
import { HEROES, joinedRoster } from '../src/entities/heroes/heroes';
import { ANVIL_TUNING, TALOS_TUNING } from '../src/entities/forge/tuning';
import { BOSS_CARD, FLYOVER, INTEL, TRANSITIONS } from '../src/game/story';
import { CHAPTER_DECKS, CHAPTER_PLAN, LEVELS, chapterOf } from '../src/levels';
import { PANEL_IDS, panelSvg } from '../src/ui/panels';
import { parseLevel } from '../src/world/grid';
import type { HeroId } from '../src/world/levelTypes';
import { footHeroes, isCollectible, levelHeroes, mechReach, reach, vehicleStart } from '../tools/reach';

const level = parseLevel(LEVELS.forge);
const ALL = ['doubleJump', 'dash', 'glide', 'pulse', 'grapple'] as const;
const find = (pred: (e: (typeof level.entities)[number]) => boolean) => level.entities.filter(pred);
const blocked = (heroes: HeroId[]) =>
  reach(level, [...ALL], heroes)
    .missing.filter((e) => !isCollectible(e.spec))
    .map((e) => e.spec.type);

describe('Talos’s Forge', () => {
  it('is a chapter 3 level after Aeëtes’s Mine, with its story beats', () => {
    expect(chapterOf('forge')).toBe(3);
    expect(CHAPTER_DECKS[3].indexOf('forge')).toBeGreaterThan(CHAPTER_DECKS[3].indexOf('mine'));
    expect(CHAPTER_PLAN[3]).toContain(LEVELS.forge.name);
    expect(LEVELS.forge.boss).toBe('talos');
    expect(FLYOVER.forge).toContain('Talos');
    // It ends at the labyrinth gate, looking ahead to Medusa.
    expect(TRANSITIONS.forge.some((l) => l.text.includes('MEDUSA'))).toBe(true);
    expect(BOSS_CARD.talos.sub).toContain('Aeëtes');
    expect(INTEL.anvil.name).toBe('Anvil Drone');
    for (const key of ['intro', 'log', 'boss', 'bossDown', 'meet:mech', 'joined:mech', 'shard:s1', 'shard:s2', 'shard:s3']) {
      expect(LEVELS.forge.dialogues[key]?.length).toBeGreaterThan(0);
    }
    expect(LEVELS.forge.stories?.['meet:mech']?.[0].panel).toBe('ch3-mech');
    expect(LEVELS.forge.stories?.talos?.[0].panel).toBe('ch3-talos');
  });

  it('paints its two storybook panels', () => {
    for (const id of ['ch3-mech', 'ch3-talos'] as const) {
      expect(PANEL_IDS).toContain(id);
      expect(panelSvg(id)).toContain('<svg');
    }
  });

  it('starts on foot with Jason and Atalanta, and parks the mech for them in the forge', () => {
    expect(LEVELS.forge.heroes).toEqual(['jason', 'atalanta', 'mech']);
    expect(LEVELS.forge.joins).toEqual({ mech: 'mech' });
    expect(HEROES.mech.vehicle).toBe(true);
    expect(footHeroes(level)).toEqual(['jason', 'atalanta']);
    expect(levelHeroes(level)).toContain('mech');
    const parked = find((e) => e.spec.type === 'marker' && e.spec.id === 'mech');
    expect(parked).toHaveLength(1);
    expect(vehicleStart(level, 'mech')).toEqual([parked[0].cx, parked[0].cz]);
    // The trigger that puts everyone aboard only works once the forge is awake.
    const board = find((e) => e.spec.type === 'trigger' && e.spec.event === 'join:mech');
    expect(board).toHaveLength(1);
    expect(board[0].spec).toMatchObject({ when: { flag: 'forgelit' } });
  });

  it('makes the mech the only hero once everyone has climbed in', () => {
    const cast: HeroId[] = ['jason', 'atalanta', 'mech'];
    expect(joinedRoster(cast, (h) => h !== 'mech')).toEqual(['jason', 'atalanta']);
    expect(joinedRoster(cast, () => true)).toEqual(['mech']);
    // Levels without a vehicle are untouched.
    expect(joinedRoster(['jason', 'atalanta'], () => true)).toEqual(['jason', 'atalanta']);
  });

  it('needs Jason, Atalanta and the mech: each alone gets stuck', () => {
    // On foot: Atalanta's bullseye lowers the drawbridge, Jason's grapple reaches the ledge, her slide the terminal.
    expect(blocked(['jason'])).toEqual(expect.arrayContaining(['target', 'terminal', 'boss']));
    expect(blocked(['atalanta'])).toEqual(expect.arrayContaining(['terminal', 'boss']));
    // Nobody on foot gets through the bronze gate; the mech (from where it is parked) reaches the boss and the exit.
    const mech = blocked(['mech']);
    expect(mech).not.toContain('boss');
    expect(mech).not.toContain('exit');
    expect(blocked([...levelHeroes(level)])).toEqual([]);
  });

  it('has a bronze gate, cracked floor plates over a trench and a cellar, and red switches for the mech', () => {
    expect(find((e) => e.spec.type === 'bronzegate').length).toBeGreaterThan(0);
    const plates = find((e) => e.spec.type === 'brittle');
    expect(plates.length).toBeGreaterThanOrEqual(4);
    // Each plate sits over a cell well below its lid: the cellar the SLAM drops the mech into.
    for (const p of plates) if (p.spec.type === 'brittle') expect(p.spec.lid - p.h).toBeGreaterThanOrEqual(1.5);
    expect(find((e) => e.spec.type === 'switch')).toHaveLength(2);
    expect(find((e) => e.spec.type === 'shard')).toHaveLength(3);
    expect(find((e) => e.spec.type === 'canister')).toHaveLength(1);
    expect(find((e) => e.spec.type === 'prize' && e.spec.id === 'vault')).toHaveLength(1);
    const enemies = find((e) => e.spec.type === 'enemy');
    expect(enemies.length).toBeGreaterThanOrEqual(25);
    expect(enemies.filter((e) => e.spec.type === 'enemy' && e.spec.enemy === 'anvil').length).toBeGreaterThanOrEqual(6);
  });
});

describe('the bronze mech', () => {
  it('jumps four floor steps, and needs its THRUST for wide lava channels', () => {
    const apex = (MECH.jumpV * MECH.jumpV) / (2 * GRAVITY);
    expect(apex - 0.3).toBeGreaterThanOrEqual(4 * STEP_H);
    // A channel three cells wide is four cells centre to centre: the jump alone falls short, jump + thrust makes it.
    const plain = ((MECH.speed * ((2 * MECH.jumpV) / GRAVITY)) * 0.9 + 1.6) / 2;
    expect(plain).toBeLessThan(4);
    expect(mechReach(0)).toBeGreaterThanOrEqual(4);
    // But it is no Jason: nowhere near the nine cells his double jump and glide cover.
    expect(mechReach(0)).toBeLessThan(6);
  });

  it('is big and heavy, but still fits through a one-cell door', () => {
    expect(MECH.height).toBeGreaterThan(HEROES.jason.height);
    expect(MECH.radius * 2).toBeLessThan(2);
    expect(MECH.speed).toBeLessThan(HEROES.jason.speed);
    expect(MECH.slamSpeed).toBeGreaterThan(MECH.heavyLanding);
  });
});

describe('TALOS and the anvil drones', () => {
  it('takes three rounds: three ankle plates and a pull of the plug each', () => {
    expect(TALOS_TUNING.rounds).toBe(3);
    expect(TALOS_TUNING.plates).toBe(3);
    // Every round's numbers exist, and he only gets a little quicker.
    for (const list of [TALOS_TUNING.raise, TALOS_TUNING.stuck, TALOS_TUNING.walkSpeed]) expect(list).toHaveLength(3);
    expect(Math.min(...TALOS_TUNING.raise)).toBeGreaterThanOrEqual(1);
    // Generous windows: time to step out of the circle, walk over and punch three times.
    expect(Math.min(...TALOS_TUNING.stuck)).toBeGreaterThanOrEqual(3 * (MECH.punchTime + MECH.punchCooldown) + 1.5);
    expect(TALOS_TUNING.kneel).toBeGreaterThanOrEqual(6);
  });

  it('warns before every anvil, and comes down low enough to punch', () => {
    expect(ANVIL_TUNING.warn).toBeGreaterThanOrEqual(1);
    expect(ANVIL_TUNING.low + 1.6).toBeLessThan(MECH.height + 1);
    expect(ANVIL_TUNING.radius).toBeGreaterThan(MECH.radius);
  });
});
