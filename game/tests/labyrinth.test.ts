
import { CELL, GAZE } from '../src/core/constants';
import { V, labWorld, reflectFlat, traceBeam, type BeamCatcher, type TraceWorld } from '../src/entities/labyrinth/trace';
import { BOSS_CARD, FLYOVER, INTEL, TRANSITIONS } from '../src/game/story';
import { CHAPTER_DECKS, CHAPTER_PLAN, LEVELS, chapterOf, isFinale } from '../src/levels';
import { PANEL_IDS, panelSvg } from '../src/ui/panels';
import { Grid, parseLevel } from '../src/world/grid';
import type { Ability, PlacedEntity } from '../src/world/levelTypes';
import { isCollectible, reach } from '../tools/reach';

const level = parseLevel(LEVELS.labyrinth);
const ALL: Ability[] = ['doubleJump', 'dash', 'glide', 'pulse', 'grapple', 'mirror'];
const BEFORE: Ability[] = ['doubleJump', 'dash', 'glide', 'pulse', 'grapple'];
const find = (pred: (e: PlacedEntity) => boolean) => level.entities.filter(pred);
const one = (pred: (e: PlacedEntity) => boolean) => {
  const list = find(pred);
  expect(list).toHaveLength(1);
  return list[0];
};
const center = (c: number) => c * CELL + CELL / 2;

/** A stand-in hero for the beam tracer: where they stand, and whether the Mirror Shield is up. */
function fakeHero(x = -100, z = -100) {
  return {
    body: { x, y: 0, z, r: 0.45, h: 1.7 },
    down: false,
    shield: null as V | null,
    stoned: 0,
    glints: 0,
    mirrorNormal() {
      return this.shield;
    },
    petrify() {
      this.stoned += 1;
      return true;
    },
    mirrorGlint() {
      this.glints += 1;
    },
  };
}

/** A tiny world for the tracer: the level's grid, solid decor as boxes, and the stand-in hero. */
function fakeWorld(player = fakeHero()) {
  const grid = new Grid(level.width, level.depth, level.cells);
  const boxes = level.entities
    .filter((e) => e.spec.type === 'decor' && e.spec.solid !== false)
    .map((e) => ({ minX: center(e.cx) - 0.65, maxX: center(e.cx) + 0.65, minZ: center(e.cz) - 0.65, maxZ: center(e.cz) + 0.65, bottom: e.h, top: e.h + 3, solid: true, dx: 0, dy: 0, dz: 0 }));
  return { grid, boxes, player } as unknown as TraceWorld & { player: ReturnType<typeof fakeHero> };
}

/** Puts the level's mirrors (turned as given, by cell) and crystals (as catchers that record bounced hits) in the fake world. */
function furnish(w: TraceWorld, turns: Record<string, 0 | 1> = {}) {
  const lab = labWorld(w);
  const lit: string[] = [];
  for (const e of find((x) => x.spec.type === 'mirror')) {
    if (e.spec.type !== 'mirror') continue;
    const turn = turns[`${e.cx},${e.cz}`] ?? e.spec.turn ?? 0;
    lab.mirrors.set(e.cz * level.width + e.cx, { pos: new V(center(e.cx), 0, center(e.cz)), normal: new V(1, 0, turn === 0 ? 1 : -1).normalize(), glint() {} });
  }
  for (const e of find((x) => x.spec.type === 'crystal')) {
    if (e.spec.type !== 'crystal') continue;
    const flag = e.spec.flag;
    const c: BeamCatcher = {
      pos: new V(center(e.cx), e.h + GAZE.eye, center(e.cz)),
      radius: 1,
      catching: true,
      catchBeam: (_dt, bounced) => {
        if (bounced && !lit.includes(flag)) lit.push(flag);
      },
    };
    lab.catchers.push(c);
  }
  return lit;
}

/** Fires an eye-sentry of the level, straight along its `dir`. */
function fire(w: TraceWorld, e: PlacedEntity) {
  if (e.spec.type !== 'gazer') throw new Error('not a gazer');
  const yaw = [Math.PI, Math.PI / 2, 0, -Math.PI / 2][e.spec.dir];
  const dir = new V(Math.sin(yaw), 0, Math.cos(yaw));
  const origin = new V(center(e.cx), e.h + GAZE.eye, center(e.cz)).add(dir, 1.3);
  return traceBeam(w, origin, dir, e, 1);
}

describe('Medusa’s Labyrinth', () => {
  it('is a chapter 3 level on foot after Aeëtes’s Mine, with Brennus’s Last Stand next in the plan', () => {
    expect(chapterOf('labyrinth')).toBe(3);
    expect(CHAPTER_DECKS[3]).toContain('labyrinth');
    expect(CHAPTER_PLAN[3]).toContain(LEVELS.labyrinth.name);
    expect(isFinale('labyrinth')).toBe(false);
    expect(LEVELS.labyrinth.heroes).toEqual(['jason', 'atalanta']);
    expect(FLYOVER.labyrinth).toContain('Labyrinth');
    expect(TRANSITIONS.labyrinth.map((l) => l.who)).toContain('brennus');
    expect(TRANSITIONS.labyrinth.some((l) => l.text.includes('sky-dock'))).toBe(true);
    expect(BOSS_CARD.medusa.sub).toBeTruthy();
    expect(INTEL.coil.tip).toBeTruthy();
  });

  it('hands out the Mirror Shield, reachable without it, and the way to MEDUSA needs it', () => {
    const shield = one((e) => e.spec.type === 'upgrade');
    expect(shield.spec.type === 'upgrade' && shield.spec.ability).toBe('mirror');
    const before = reach(level, BEFORE);
    const missing = before.missing.map((e) => e.spec.type);
    expect(before.missing.map((e) => e.id)).not.toContain(shield.id);
    expect(missing).toContain('boss');
    expect(missing).toContain('crystal');
    expect(reach(level, ALL).missing).toEqual([]);
  });

  it('needs both heroes: Atalanta’s bullseye and Jason’s Mirror Shield crystals', () => {
    const jason = reach(level, ALL, ['jason']).missing.filter((e) => !isCollectible(e.spec)).map((e) => e.spec.type);
    const atalanta = reach(level, ALL, ['atalanta']).missing.filter((e) => !isCollectible(e.spec)).map((e) => e.spec.type);
    expect(jason).toContain('target');
    expect(atalanta).toContain('crystal');
    // The Hall of Eyes gate wants both, and the Mirror Shield itself.
    const gate = one((e) => e.spec.type === 'door' && e.id.endsWith('eyesgate'));
    expect(JSON.stringify(gate.spec.type === 'door' && gate.spec.open)).toContain('ability:mirror');
    expect(JSON.stringify(gate.spec.type === 'door' && gate.spec.open)).toContain('tB');
  });

  it('has the gaze puzzles, side quests and enemies of a full level', () => {
    const count = (t: string) => find((e) => e.spec.type === t).length;
    expect(count('gazer')).toBeGreaterThanOrEqual(5);
    expect(count('mirror')).toBeGreaterThanOrEqual(3);
    expect(count('crystal')).toBeGreaterThanOrEqual(4);
    expect(count('checkpoint')).toBeGreaterThanOrEqual(3);
    expect(count('vendor')).toBe(1);
    expect(count('shard')).toBe(3);
    expect(count('cocoon')).toBe(2);
    expect(count('canister')).toBe(1);
    expect(count('enemy')).toBeGreaterThanOrEqual(25);
    expect(find((e) => e.spec.type === 'enemy' && e.spec.enemy === 'coil').length).toBeGreaterThan(8);
    expect(find((e) => e.spec.type === 'prize' && e.spec.id === 'vault')).toHaveLength(1);
    expect(find((e) => e.spec.type === 'boss' && e.spec.boss === 'medusa')).toHaveLength(1);
    for (const key of ['intro', 'log', 'boss', 'bossDown', 'colonist:c1', 'colonist:c2']) expect(LEVELS.labyrinth.dialogues[key]?.length).toBeGreaterThan(0);
  });

  it('paints the Mirror Shield and MEDUSA asleep', () => {
    for (const id of ['ch3-mirror', 'ch3-medusa'] as const) {
      expect(PANEL_IDS).toContain(id);
      const svg = panelSvg(id);
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg).not.toContain(`>${id}</text>`);
    }
    expect(LEVELS.labyrinth.stories?.shield?.[0].panel).toBe('ch3-mirror');
    expect(LEVELS.labyrinth.stories?.gate?.[0].panel).toBe('ch3-medusa');
  });
});

describe('gaze beams', () => {
  it('reflect off a mirror a quarter turn: "/" sends an eastbound beam north, "\\" south', () => {
    const east = () => new V(1, 0, 0);
    const round = (v: V) => [v.x, v.y, v.z].map((n) => Math.round(n) + 0);
    expect(round(reflectFlat(east(), new V(1, 0, 1).normalize()))).toEqual([0, 0, -1]);
    expect(round(reflectFlat(east(), new V(1, 0, -1).normalize()))).toEqual([0, 0, 1]);
  });

  it('turn a hero they touch to stone, unless the Mirror Shield faces them: then the beam bounces', () => {
    const eye = one((e) => e.spec.type === 'gazer' && e.spec.dir === 3 && e.cz > 60);
    // Stand in the shrine eye's beam, a few cells along it.
    const hero = fakeHero(center(eye.cx - 7), center(eye.cz));
    const w = fakeWorld(hero);
    furnish(w);
    const r = fire(w, eye);
    expect(hero.stoned).toBe(1);
    expect(r.stoned).toBe(true);
    // Shield up, facing the eye (east): it bounces straight back into the eye.
    hero.shield = new V(1, 0, 0);
    const back = fire(w, eye);
    expect(hero.stoned).toBe(1);
    expect(back.shielded).toBe(true);
    expect(hero.glints).toBe(1);
  });

  it('only light a crystal once they have bounced (off the Mirror Shield or a mirror)', () => {
    const eye = one((e) => e.spec.type === 'gazer' && e.spec.dir === 3 && e.cz > 60);
    const crystal = one((e) => e.spec.type === 'crystal' && e.spec.flag === 'cr1');
    expect(crystal.cz).toBeLessThan(eye.cz);
    // Jason stands in the beam right below the crystal and faces north-east, between the eye and the crystal.
    const hero = fakeHero(center(crystal.cx), center(eye.cz));
    hero.shield = new V(1, 0, -1).normalize();
    const w = fakeWorld(hero);
    const lit = furnish(w);
    const r = fire(w, eye);
    expect(r.shielded).toBe(true);
    expect(lit).toEqual(['cr1']);
  });

  it('solve the mirror hall: the wrong turn lights the bonus crystal, the right turns open the gate', () => {
    const eye = one((e) => e.spec.type === 'gazer' && e.spec.dir === 1 && e.spec.sweep === undefined);
    const mirrors = find((e) => e.spec.type === 'mirror').sort((a, b) => a.cz - b.cz || a.cx - b.cx);
    const [m2, m3, m1] = [mirrors.find((m) => m.cx === eye.cx + 8 && m.cz < eye.cz), mirrors.find((m) => m.cx > eye.cx + 8), mirrors.find((m) => m.cz === eye.cz)];
    if (!m1 || !m2 || !m3) throw new Error('mirrors missing');
    const key = (m: PlacedEntity) => `${m.cx},${m.cz}`;
    // As placed, the first mirror sends the gaze into the floor of the hall: nothing lights.
    let w = fakeWorld();
    expect(furnish(w).length + fire(w, eye).points.length * 0).toBe(0);
    w = fakeWorld();
    let lit = furnish(w);
    fire(w, eye);
    expect(lit).toEqual([]);
    // Turn the first mirror: up to the second, which (as placed) sends it west to the bonus crystal.
    w = fakeWorld();
    lit = furnish(w, { [key(m1)]: 0 });
    fire(w, eye);
    expect(lit).toEqual(['cr2b']);
    // Turn the second and third mirrors too: across the hall and up into the gate's crystal.
    w = fakeWorld();
    lit = furnish(w, { [key(m1)]: 0, [key(m2)]: 0, [key(m3)]: 0 });
    fire(w, eye);
    expect(lit).toEqual(['cr2']);
  });

  it('lets the Hall of Eyes crystal be lit off the Mirror Shield from its eye’s beam', () => {
    const crystal = one((e) => e.spec.type === 'crystal' && e.spec.flag === 'cr3');
    const eye = one((e) => e.spec.type === 'gazer' && e.spec.dir === 3 && e.cz < 60);
    const hero = fakeHero(center(crystal.cx), center(eye.cz));
    hero.shield = new V(1, 0, -1).normalize();
    const w = fakeWorld(hero);
    const lit = furnish(w);
    fire(w, eye);
    expect(lit).toEqual(['cr3']);
  });
});
