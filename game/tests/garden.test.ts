import { PYLONS, PYLON_KINDS, WEEDER_TUNING } from '../src/entities/ch3/gardenData';
import { BOSS_CARD, FLYOVER, INTEL, TRANSITIONS } from '../src/game/story';
import { CHAPTER_DECKS, CHAPTER_PLAN, LEVELS, chapterOf, isFinale } from '../src/levels';
import { PANEL_IDS, panelSvg } from '../src/ui/panels';
import { parseLevel } from '../src/world/grid';
import type { Ability, PlacedEntity, Spec } from '../src/world/levelTypes';
import { isCollectible, reach } from '../tools/reach';

const def = LEVELS.garden;
const level = parseLevel(def);
const ALL: Ability[] = ['doubleJump', 'dash', 'glide', 'pulse', 'grapple'];
const NO_GRAPPLE: Ability[] = ['doubleJump', 'dash', 'glide', 'pulse'];
const find = (pred: (e: PlacedEntity) => boolean) => level.entities.filter(pred);
const one = (pred: (e: PlacedEntity) => boolean) => {
  const list = find(pred);
  expect(list).toHaveLength(1);
  return list[0];
};
const at = (e: PlacedEntity) => `${e.cx},${e.cz}`;
// Reachability is slow on a level this size: work each case out once.
const cache = new Map<string, ReturnType<typeof reach>>();
const reachOf = (abilities: Ability[], heroes?: ('jason' | 'atalanta')[]) => {
  const key = `${abilities.join()}|${heroes?.join() ?? 'both'}`;
  let r = cache.get(key);
  if (!r) cache.set(key, (r = reach(level, abilities, heroes)));
  return r;
};
const marker = (id: string) => one((e) => e.spec.type === 'marker' && e.spec.id === id);
const runes = (group: string) =>
  find((e) => e.spec.type === 'rune' && e.spec.group === group)
    .map((e) => e.spec as Extract<Spec, { type: 'rune' }>)
    .sort((a, b) => a.order - b.order)
    .map((r) => r.color);

describe('the Garden of Colchis', () => {
  it('is a chapter 3 level on foot for Jason and Atalanta, with the Fleece vault coming next', () => {
    expect(chapterOf('garden')).toBe(3);
    expect(CHAPTER_DECKS[3]).toContain('garden');
    expect(CHAPTER_PLAN[3]).toContain(def.name);
    expect(isFinale('garden')).toBe(false);
    expect(def.vehicle).toBeUndefined();
    expect(def.heroes).toEqual(['jason', 'atalanta']);
    expect(def.joins).toBeUndefined();
    expect(def.boss).toBe('dragon');
    expect(FLYOVER.garden).toContain('Garden of Colchis');
    expect(BOSS_CARD.dragon.sub).toBeTruthy();
    expect(TRANSITIONS.garden.length).toBeGreaterThan(2);
    expect(TRANSITIONS.garden.some((l) => l.text.includes('Fleece'))).toBe(true);
    expect(def.objectives[def.objectives.length - 1].at).toBe('exit');
  });

  it('needs both heroes: each one alone gets stuck somewhere', () => {
    const jason = reachOf(ALL, ['jason']).missing.filter((e) => !isCollectible(e.spec)).map((e) => e.spec.type);
    const atalanta = reachOf(ALL, ['atalanta']).missing.filter((e) => !isCollectible(e.spec)).map((e) => e.spec.type);
    expect(jason).toContain('target');
    expect(atalanta).toContain('switch');
    expect(reachOf(ALL).missing).toEqual([]);
  });

  it('locks its gates with light-words spelled in the light-stones’ colours', () => {
    // HOME is blue then green (as Brennus read it in the mine); FRIEND is the whole rainbow, red to violet.
    expect(runes('home')).toEqual(['#5ec8ff', '#7dff9a']);
    expect(runes('friend')).toEqual(['#ff5e6a', '#ffb347', '#ffe066', '#7dff9a', '#5ec8ff', '#c37bff']);
    // The vault riddle: SLEEP (violet, white), then GROW (pink, green).
    expect(runes('vault')).toEqual(['#c37bff', '#ffffff', '#ff6fcf', '#7dff9a']);
    const door = (flag: string) => find((e) => e.spec.type === 'door' && 'flag' in e.spec.open && e.spec.open.flag === flag);
    for (const flag of ['home', 'friend', 'vault']) expect(door(flag)).toHaveLength(1);
    one((e) => e.spec.type === 'prize' && e.spec.id === 'vault');
    const signs = find((e) => e.spec.type === 'sign').map((e) => (e.spec as { text: string }).text);
    expect(signs.some((t) => t.includes('HOME: blue, then green'))).toBe(true);
    expect(signs.some((t) => t.includes('red, orange, yellow, green, blue and violet'))).toBe(true);
    expect(signs.some((t) => t.includes('SLEEP glows violet, then white'))).toBe(true);
  });

  it('puts the four lullaby pylons where only the right hero can light them', () => {
    expect(PYLON_KINDS).toHaveLength(4);
    const heroes = PYLON_KINDS.map((k) => PYLONS[k].hero);
    expect(heroes.filter((h) => h === 'jason')).toHaveLength(2);
    expect(heroes.filter((h) => h === 'atalanta')).toHaveLength(2);
    const jason = reachOf(ALL, ['jason']).reached;
    const climber = reachOf(NO_GRAPPLE, ['jason']).reached;
    const atalanta = reachOf(ALL, ['atalanta']).reached;
    // SKY (power arrow) and GROW (ground pound) stand on the lawn.
    for (const k of ['sky', 'grow']) expect(jason.has(at(marker(`pylon:${k}`))) && atalanta.has(at(marker(`pylon:${k}`)))).toBe(true);
    // HOME is on a hedge shelf only Atalanta's wall-jump reaches; FRIEND on a column only the grapple reaches.
    const home = at(marker('pylon:home'));
    expect(atalanta.has(home)).toBe(true);
    expect(jason.has(home)).toBe(false);
    const friend = at(marker('pylon:friend'));
    expect(jason.has(friend)).toBe(true);
    expect(climber.has(friend)).toBe(false);
    expect(atalanta.has(friend)).toBe(false);
    for (const k of PYLON_KINDS) expect(PYLONS[k].how === 'touch' || PYLONS[k].text.length > 0).toBe(true);
  });

  it('hides side quests for each hero: a light-stone behind a low gap, a net on a grapple stump', () => {
    const s2 = one((e) => e.spec.type === 'shard' && e.spec.id === 's2');
    expect(reachOf(ALL, ['atalanta']).reached.has(at(s2))).toBe(true);
    expect(reachOf(ALL, ['jason']).reached.has(at(s2))).toBe(false);
    const c2 = one((e) => e.spec.type === 'cocoon' && e.spec.id === 'c2');
    expect(reachOf(ALL, ['jason']).reached.has(at(c2))).toBe(true);
    expect(reachOf(ALL, ['atalanta']).reached.has(at(c2))).toBe(false);
  });

  it('has the gadgets, enemies and side quests of a full level', () => {
    const count = (t: string) => find((e) => e.spec.type === t).length;
    expect(count('shard')).toBe(3);
    expect(count('cocoon')).toBe(3);
    expect(count('canister')).toBe(1);
    expect(count('vendor')).toBe(1);
    expect(count('holo')).toBe(1);
    expect(count('checkpoint')).toBeGreaterThanOrEqual(3);
    expect(count('anchor')).toBeGreaterThanOrEqual(3);
    expect(count('wallrun')).toBeGreaterThan(0);
    expect(count('lowgap')).toBeGreaterThan(0);
    expect(count('target')).toBeGreaterThan(0);
    const enemies = count('enemy');
    expect(enemies).toBeGreaterThanOrEqual(25);
    expect(enemies).toBeLessThanOrEqual(40);
    expect(find((e) => e.spec.type === 'enemy' && e.spec.enemy === 'weeder').length).toBeGreaterThanOrEqual(6);
    expect(INTEL.weeder.tip).toContain('circle');
    expect(WEEDER_TUNING.warn).toBeGreaterThan(0.5);
    expect(WEEDER_TUNING.splash).toBeGreaterThan(1);
  });

  it('opens with the garden and ends with the dragon asleep, in the storybook', () => {
    expect(def.stories?.opening?.[0].panel).toBe('ch3-garden');
    expect(def.stories?.lullaby?.[0].panel).toBe('ch3-dragon');
    for (const key of ['intro', 'log', 'boss', 'bossDown', 'crystal', 'shard:s1', 'shard:s2', 'shard:s3']) expect(def.dialogues[key]?.length).toBeGreaterThan(0);
    for (const id of ['ch3-garden', 'ch3-dragon'] as const) {
      expect(PANEL_IDS).toContain(id);
      const svg = panelSvg(id);
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg).not.toContain(`>${id}</text>`);
    }
  });
});
