import { newSave } from '../src/core/save';
import { deckQuests, payQuests } from '../src/game/quests';
import { FLYOVER, TRANSITIONS } from '../src/game/story';
import {
  CHAPTERS,
  CHAPTER_DECKS,
  CHAPTER_PLAN,
  LEVELS,
  LEVEL_ORDER,
  catchUpChapters,
  chapterIndex,
  chapterOf,
  chapterSize,
  comingSoon,
  isFinale,
  isVehicleLevel,
  nextChapterStart,
} from '../src/levels';
import { CLASH, FLIGHT, clashState, holdGroup, inCorridor, laneAt, type Clash, type FlightCourse, type Hold } from '../src/vehicles/course';
import { Flight, type FlightEvents } from '../src/vehicles/flight';
import { flightGoals, flightTotals, recordFlight } from '../src/vehicles/quests';
import { parseLevel } from '../src/world/grid';
import type { DeckId } from '../src/world/levelTypes';

// newSave() reads navigator for its quality default; give Jest a stand-in.
beforeAll(() => {
  (globalThis as { navigator?: unknown }).navigator ??= { hardwareConcurrency: 8 };
});

// The Argo's flights (the submarine's dive has its own tests in sirens.test.ts).
const FLIGHTS = LEVEL_ORDER.filter((id) => isVehicleLevel(id) && LEVELS[id].vehicle === 'argo');

describe('three chapters', () => {
  it('splits the levels into the ship, Gaia Nova and the Argonauts', () => {
    expect(CHAPTERS).toEqual([1, 2, 3]);
    expect(chapterOf('cryo')).toBe(1);
    expect(chapterOf('volcano')).toBe(2);
    expect(chapterOf('rocks')).toBe(3);
    expect(chapterIndex('rocks')).toBe(1);
    expect(chapterSize(3)).toBe(10);
    expect(CHAPTER_PLAN[3][0]).toBe(LEVELS.rocks.name);
    expect(comingSoon(3)).toHaveLength(10 - CHAPTER_DECKS[3].length);
  });

  it('leads each chapter on to the next, and keeps chapter 3’s finale for its last level', () => {
    expect(nextChapterStart('bridge')).toBe('plains');
    expect(nextChapterStart('volcano')).toBe('rocks');
    expect(nextChapterStart('rocks')).toBeNull();
    expect(isFinale('bridge')).toBe(true);
    expect(isFinale('volcano')).toBe(true);
    // The Clashing Rocks is level 1 of 10: it ends with the Argo sailing on, not a finale.
    expect(isFinale('rocks')).toBe(false);
    expect(TRANSITIONS.rocks.length).toBeGreaterThan(0);
    expect(FLYOVER.rocks).not.toBe('');
  });

  it('opens chapter 3 for an old save that already saw chapter 2’s ending', () => {
    const old = newSave();
    old.unlocked = 12;
    old.endings = ['saved', 'freed'];
    old.completed = [...CHAPTER_DECKS[1], ...CHAPTER_DECKS[2]];
    old.resume = null;
    expect(catchUpChapters(old)).toBe(true);
    expect(old.unlocked).toBe(LEVELS.rocks.index);
    expect((old.resume as { deck: string } | null)?.deck).toBe('rocks');
    // Nothing more to do the second time, and a save mid-way through chapter 2 is left alone.
    expect(catchUpChapters(old)).toBe(false);
    const mid = newSave();
    mid.unlocked = 9;
    mid.endings = ['saved'];
    mid.resume = { deck: 'snow', checkpoint: 'cp1', flags: [], taken: [], dead: [] };
    expect(catchUpChapters(mid)).toBe(false);
    expect(mid.resume?.deck).toBe('snow');
  });

  it('keeps a save from before chapter 2 working (it opens Gaia Nova)', () => {
    const old = newSave();
    old.unlocked = 6;
    old.endings = ['friends'];
    catchUpChapters(old);
    expect(old.unlocked).toBe(LEVELS.plains.index);
    expect((old.resume as { deck: string } | null)?.deck).toBe('plains');
  });
});

describe('flight levels', () => {
  it('declare a vehicle and a course, and still parse as a level', () => {
    expect(FLIGHTS).toContain('rocks');
    for (const id of FLIGHTS) {
      const def = LEVELS[id];
      expect(def.vehicle).toBe('argo');
      expect(def.flight?.things.length).toBeGreaterThan(100);
      const level = parseLevel(def);
      expect(level.spawn).toBeTruthy();
      expect(def.dialogues[def.intro ?? 'intro']?.length).toBeGreaterThan(0);
    }
  });

  it('have every dialogue their course and cutscenes use', () => {
    for (const id of FLIGHTS) {
      const def = LEVELS[id];
      const keys = new Set(['intro', 'finish', 'doveSafe']);
      for (const t of def.flight?.things ?? []) {
        if (t.kind === 'radio') keys.add(t.dialogue);
        if (t.kind === 'hold' && t.dialogue) keys.add(t.dialogue);
      }
      for (const k of keys) expect([k, (def.dialogues[k]?.length ?? 0) > 0]).toEqual([k, true]);
    }
  });

  it('have their own side quests: rings, drones and the dove', () => {
    const save = newSave();
    const qs = deckQuests('rocks', save);
    expect(qs.map((q) => q.id.split(':')[1])).toEqual(['rings', 'drones', 'dove']);
    expect(qs.every((q) => !q.done)).toBe(true);
    const goal = flightGoals(LEVELS.rocks);
    expect(goal.rings).toBeGreaterThan(20);
    expect(goal.drones).toBeLessThanOrEqual(flightTotals(LEVELS.rocks).drones);
    recordFlight(save, 'rocks', { rings: goal.rings, drones: 3 });
    expect(payQuests('rocks', save)).toHaveLength(1);
    expect(save.bolts).toBe(60);
    expect(payQuests('rocks', save)).toHaveLength(0);
    // Best results only ever go up.
    expect(recordFlight(save, 'rocks', { rings: 1, drones: 1 })).toBe(false);
    recordFlight(save, 'rocks', { clean: true });
    expect(payQuests('rocks', save)).toHaveLength(1);
  });
});

describe.each(FLIGHTS)('%s course', (id: DeckId) => {
  const course = LEVELS[id].flight as FlightCourse;
  const things = [...course.things].sort((a, b) => a.s - b.s);
  const end = things.find((t) => t.kind === 'gate')?.s ?? 0;

  it('ends at the gate, with checkpoints along the way and everything inside the corridor', () => {
    expect(things.filter((t) => t.kind === 'gate')).toHaveLength(1);
    expect(things[things.length - 1].kind).toBe('gate');
    const beacons = things.filter((t) => t.kind === 'checkpoint');
    expect(beacons.length).toBeGreaterThanOrEqual(2);
    for (const t of things) {
      if (t.kind === 'ring' || t.kind === 'bolt' || t.kind === 'crystal') expect([t.kind, t.s, inCorridor(t.x, t.y, 1)]).toEqual([t.kind, t.s, true]);
    }
    for (const [s, x, y] of course.guide) expect([s, inCorridor(x, y, 1)]).toEqual([s, true]);
  });

  it('takes about three to five minutes at cruising speed', () => {
    const minutes = end / FLIGHT.cruise / 60;
    expect(minutes).toBeGreaterThan(2.4);
    expect(minutes).toBeLessThan(4.5);
  });

  it('keeps the guide route steerable and clear of every asteroid', () => {
    for (let s = 0; s < end; s += 1) {
      const [x0, y0] = laneAt(course.guide, s);
      const [x1, y1] = laneAt(course.guide, s + 1);
      // Never steeper than the Argo can steer at cruising speed (with room to spare).
      expect(Math.hypot(x1 - x0, y1 - y0) * FLIGHT.cruise).toBeLessThan(FLIGHT.steer * 0.7);
    }
    for (const t of things) {
      if (t.kind !== 'rock' && t.kind !== 'crystal') continue;
      const r = t.kind === 'rock' ? t.r : 1.3;
      const [gx, gy] = laneAt(course.guide, t.s);
      expect([t.kind, t.s, Math.hypot(t.x - gx, t.y - gy) > r + FLIGHT.radius + 0.5]).toEqual([t.kind, t.s, true]);
    }
  });

  it('never hides a crystal inside an asteroid', () => {
    const rocks = things.filter((t) => t.kind === 'rock');
    for (const c of things) {
      if (c.kind !== 'crystal') continue;
      const inside = rocks.filter((r) => r.kind === 'rock' && Math.hypot(r.x - c.x, r.y - c.y, r.s - c.s) < r.r + 1.6);
      expect([c.s, inside.length]).toEqual([c.s, 0]);
    }
  });

  it('puts a hold line before every pair of Clashing Rocks, with nothing in the way', () => {
    const clashes = things.filter((t): t is Clash => t.kind === 'clash');
    expect(clashes.length).toBeGreaterThanOrEqual(5);
    const holds = things.filter((t): t is Hold => t.kind === 'hold');
    const grouped = new Set(holds.flatMap((h) => holdGroup(things, h)));
    for (const c of clashes) {
      expect(grouped.has(c)).toBe(true);
      // The pair sits in the middle of the guide route, and no asteroid floats inside its rocks.
      const [gx, gy] = laneAt(course.guide, c.s);
      expect(Math.hypot(gx, gy)).toBeLessThan(0.5);
      const near = things.filter((t) => (t.kind === 'rock' || t.kind === 'ring' || t.kind === 'crystal') && Math.abs(t.s - c.s) < CLASH.depth);
      expect(near).toEqual([]);
    }
    for (const h of holds) {
      const group = holdGroup(things, h);
      expect(group.length).toBeGreaterThan(0);
      expect(group[0].s - CLASH.depth / 2 - h.s).toBeGreaterThan(15);
    }
  });

  it('can be flown start to finish by following the guide and launching with the dove, without a scratch', () => {
    const f = new Flight(course);
    const hits = { bump: 0, crush: 0, rings: 0, holds: 0 };
    const ev: FlightEvents = {
      bump: () => (hits.bump += 1),
      crush: () => (hits.crush += 1),
      ring: () => (hits.rings += 1),
      hold: () => (hits.holds += 1),
    };
    const dt = 1 / 60;
    let time = 0;
    while (!f.finished && time < 600) {
      // Steer toward the guide a little way ahead.
      const [gx, gy] = laneAt(course.guide, f.s + 4);
      const steerX = Math.max(-1, Math.min(1, (gx - f.x) * 2));
      const steerY = Math.max(-1, Math.min(1, (gy - f.y) * 2));
      // At a hold line, go the moment the rocks start to open (just like the dove).
      const h = f.holding ? f.hold : null;
      const boost = !!h && clashState(holdGroup(f.things, h)[0], f.t).phase < 0.1;
      f.step(dt, { steerX, steerY, boost }, ev);
      time += dt;
    }
    expect(f.finished).toBe(true);
    expect(hits).toEqual({ bump: 0, crush: 0, rings: things.filter((t) => t.kind === 'ring').length, holds: things.filter((t) => t.kind === 'hold').length });
    expect(f.hull).toBe(FLIGHT.hull);
    // Three to five minutes of flying, waits at the rocks included.
    expect(time / 60).toBeGreaterThan(2.5);
    expect(time / 60).toBeLessThan(5);
  });

  it('squishes a launch while the rocks rumble, and sends the Argo back to its hold line', () => {
    const h = things.find((t): t is Hold => t.kind === 'hold') as Hold;
    const first = holdGroup(things, h)[0];
    const f = new Flight(course);
    f.restart(h.s - 20);
    const dt = 1 / 60;
    let crushes = 0;
    // Wait at the line until the rocks start to rumble, then launch: too late.
    let launched = false;
    for (let i = 0; i < 60 * 30 && !crushes; i++) {
      const st = clashState(first, f.t);
      const boost = f.holding && !launched && st.warn > 0.15;
      if (boost) launched = true;
      f.step(dt, { steerX: 0, steerY: 0, boost }, { crush: () => (crushes += 1) });
    }
    expect(crushes).toBe(1);
    expect(f.holding).toBe(true);
    expect(f.s).toBe(h.s);
    expect(f.hull).toBe(FLIGHT.hull - 1);
  });

  it('gives a fair window to launch at every hold line: over a second, even for the last row of three', () => {
    for (const h of things.filter((t): t is Hold => t.kind === 'hold')) {
      const group = holdGroup(things, h);
      const P = group[0].period;
      let safe = 0;
      const samples = 100;
      for (let k = 0; k < samples; k++) {
        const f = new Flight(course);
        f.restart(h.s - 1);
        // Arrive at the line, then wait for this moment in the rhythm.
        f.step(0.1, { steerX: 0, steerY: 0, boost: false });
        const want = (k / samples) * P;
        const u = clashState(group[0], f.t).phase;
        f.t += (((want - u) % P) + P) % P;
        let crushed = false;
        f.step(1 / 60, { steerX: 0, steerY: 0, boost: true }, { crush: () => (crushed = true) });
        for (let i = 0; i < 60 * 4 && !crushed && f.s < group[group.length - 1].s + CLASH.depth; i++) f.step(1 / 60, { steerX: 0, steerY: 0, boost: false }, { crush: () => (crushed = true) });
        if (!crushed) safe += P / samples;
      }
      expect([h.s, safe > 1.2]).toEqual([h.s, true]);
    }
  });
});
