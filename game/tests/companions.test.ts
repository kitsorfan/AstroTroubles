import { companionPlan, helperOf, IRIS_FLAG, LUX_BACK_FLAG, ROGUE_MARKER, voiceOf } from '../src/game/companions';
import { BOSS_CARD, TRANSITIONS } from '../src/game/story';
import { LEVELS } from '../src/levels';
import { PANEL_IDS, panelSvg } from '../src/ui/panels';
import { parseLevel } from '../src/world/grid';
import type { DeckId, Line } from '../src/world/levelTypes';

const flags = (...on: string[]) => (f: string) => on.includes(f);
const speakers = (lines: Line[] | undefined) => (lines ?? []).map((l) => l.who);

describe('who flies with Jason', () => {
  it('keeps LUX on the ship and in the first regions of Gaia Nova', () => {
    for (const deck of ['hydro', 'bridge', 'plains', 'desert'] as DeckId[]) {
      expect(companionPlan(deck, flags('bolt'))).toEqual({ lead: 'lux', tag: null });
    }
    // On the Cryo Deck, LUX only joins once Jason finds him.
    expect(companionPlan('cryo', flags()).lead).toBeNull();
    expect(helperOf('cryo', companionPlan('cryo', flags()))).toBeNull();
  });

  it('loses LUX in the tundra once BOREAS is beaten, also when the deck is resumed', () => {
    expect(companionPlan('snow', flags('bolt')).lead).toBe('lux');
    const after = companionPlan('snow', flags('bolt', 'boss'));
    expect(after.lead).toBeNull();
    expect(helperOf('snow', after)).toBe('wrist');
  });

  it('leaves Jason alone in the Rockies, with his wrist computer', () => {
    const plan = companionPlan('rockies', flags('bolt', 'boss'));
    expect(plan).toEqual({ lead: null, tag: null });
    expect(helperOf('rockies', plan)).toBe('wrist');
  });

  it('gives Jason IRIS in the jungle once he wakes her', () => {
    expect(companionPlan('jungle', flags('bolt')).lead).toBeNull();
    expect(companionPlan('jungle', flags('bolt', IRIS_FLAG))).toEqual({ lead: 'iris', tag: null });
  });

  it('brings LUX home in the volcano, with IRIS tagging along', () => {
    expect(companionPlan('volcano', flags('bolt'))).toEqual({ lead: 'iris', tag: null });
    expect(companionPlan('volcano', flags('bolt', LUX_BACK_FLAG))).toEqual({ lead: 'lux', tag: 'iris' });
  });

  it('hands lines written for LUX to whoever is there', () => {
    const lux = { lead: 'lux', tag: null } as const;
    const iris = { lead: 'iris', tag: null } as const;
    const alone = { lead: null, tag: null } as const;
    expect(voiceOf('bolt', lux, true)).toBe('bolt');
    expect(voiceOf('bolt', iris, false)).toBe('iris');
    expect(voiceOf('bolt', alone, true)).toBe('halcyon');
    expect(voiceOf('bolt', alone, false)).toBe('jason');
    expect(voiceOf('brennus', alone, false)).toBe('brennus');
  });
});

describe('the story of LUX in chapter 2', () => {
  it('writes the tundra trap and the Rockies without LUX in them', () => {
    expect(LEVELS.snow.dialogues.trap?.length).toBeGreaterThan(0);
    expect(speakers(LEVELS.snow.dialogues.taken)).toContain('brennus');
    for (const lines of Object.values(LEVELS.rockies.dialogues)) expect(speakers(lines)).not.toContain('bolt');
    for (const deck of ['snow', 'rockies'] as const) expect(speakers(TRANSITIONS[deck])).not.toContain('bolt');
  });

  it('hides IRIS in the jungle roots, behind a gate only she can open', () => {
    const level = parseLevel(LEVELS.jungle);
    const find = level.entities.filter((e) => e.spec.type === 'boltfind');
    expect(find).toHaveLength(1);
    expect(find[0].spec).toMatchObject({ who: 'iris' });
    expect(level.entities.some((e) => e.spec.type === 'door' && 'flag' in e.spec.open && e.spec.open.flag === IRIS_FLAG)).toBe(true);
    expect(LEVELS.jungle.objectives[0].until).toEqual({ flag: IRIS_FLAG });
    for (const key of ['irisWake', 'irisJoin']) expect(speakers(LEVELS.jungle.dialogues[key])).toContain('iris');
    for (const lines of Object.values(LEVELS.jungle.dialogues)) expect(speakers(lines)).not.toContain('bolt');
    expect(speakers(TRANSITIONS.jungle)).toContain('iris');
  });

  it('sets Shadow LUX in the volcano gatehouse, before the Colossus', () => {
    const level = parseLevel(LEVELS.volcano);
    const marker = level.entities.find((e) => e.spec.type === 'marker' && e.spec.id === ROGUE_MARKER);
    const boss = level.entities.find((e) => e.spec.type === 'boss');
    expect(marker).toBeDefined();
    expect(boss).toBeDefined();
    // The gatehouse comes before the crater (the volcano climbs north, toward smaller z).
    expect(marker!.cz).toBeGreaterThan(boss!.cz);
    expect(level.entities.some((e) => e.spec.type === 'door' && 'flag' in e.spec.open && e.spec.open.flag === LUX_BACK_FLAG)).toBe(true);
    for (const key of ['rogue', 'rogueFight', 'rogueDown', 'luxBack']) expect(LEVELS.volcano.dialogues[key]?.length).toBeGreaterThan(0);
    expect(speakers(LEVELS.volcano.dialogues.rogueFight)).toContain('rogue');
    expect(BOSS_CARD.rogue.sub).toBeTruthy();
  });

  it('paints a storybook picture for each moment', () => {
    for (const id of ['ch2-luxtaken', 'ch2-iris', 'ch2-luxback'] as const) {
      expect(PANEL_IDS).toContain(id);
      const svg = panelSvg(id);
      expect(svg.startsWith('<svg')).toBe(true);
      // A painted panel, not the stand-in sketch with its id written on it.
      expect(svg).not.toContain(`>${id}</text>`);
    }
  });
});
