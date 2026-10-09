import { newSave } from '../src/core/save';
import { deckQuests, payQuests } from '../src/game/quests';
import { BOSS_CARD, FLYOVER, INTEL, TRANSITIONS } from '../src/game/story';
import { CHAPTER_DECKS, CHAPTER_PLAN, LEVELS, chapterIndex, chapterOf, isFinale, isVehicleLevel } from '../src/levels';
import { laneAt } from '../src/vehicles/course';
import { DIVE, SONG, inSea, nearestBeat, songStrength, throughDoor, type Door, type DiveCourse } from '../src/vehicles/sub/dive';
import { ORGAN, OrganFight } from '../src/vehicles/sub/organ';
import { diveGoals, diveTotals, recordDive } from '../src/vehicles/sub/quests';
import { Dive, type DiveEvents } from '../src/vehicles/sub/swim';
import { parseLevel } from '../src/world/grid';

// newSave() reads navigator for its quality default; give Jest a stand-in.
beforeAll(() => {
  (globalThis as { navigator?: unknown }).navigator ??= { hardwareConcurrency: 8 };
});

const def = LEVELS.sirens;
const course = def.dive as DiveCourse;
const things = [...course.things].sort((a, b) => a.s - b.s);
const end = things.find((t) => t.kind === 'surface')?.s ?? 0;
const dt = 1 / 60;

/** Steers toward the guide a little way ahead. */
function follow(d: Dive): { steerX: number; steerY: number } {
  const [gx, gy] = laneAt(course.guide, d.s + 3);
  return { steerX: Math.max(-1, Math.min(1, (gx - d.x) * 1.5)), steerY: Math.max(-1, Math.min(1, (gy - d.y) * 1.5)) };
}

describe('the Sirens’ Sea level', () => {
  it('is chapter 3’s fourth level, dived in the submarine, with THE SIREN ORGAN for a boss', () => {
    expect(CHAPTER_DECKS[3].indexOf('sirens')).toBe(CHAPTER_DECKS[3].indexOf('mine') + 1);
    expect(chapterOf('sirens')).toBe(3);
    expect(CHAPTER_PLAN[3][chapterIndex('sirens') - 1]).toBe(def.name);
    expect(isVehicleLevel('sirens')).toBe(true);
    expect(isFinale('sirens')).toBe(false);
    expect(def.vehicle).toBe('sub');
    expect(def.boss).toBe('organ');
    expect(parseLevel(def).spawn).toBeTruthy();
    expect(BOSS_CARD.organ.sub).not.toBe('');
    expect(INTEL.piranha.name).toBe('Piranha Drone');
    expect(FLYOVER.sirens).not.toBe('');
    // The lines after the dive lead on to Scylla's Reef.
    expect(TRANSITIONS.sirens.length).toBeGreaterThan(3);
    expect(def.objectives[def.objectives.length - 1].text).toContain('Scylla');
  });

  it('has every dialogue its course and cutscenes use', () => {
    const keys = new Set(['intro', 'sirens', 'boss', 'bossDown', 'finish']);
    for (const t of things) if (t.kind === 'radio') keys.add(t.dialogue);
    for (const k of keys) expect([k, (def.dialogues[k]?.length ?? 0) > 0]).toEqual([k, true]);
  });

  it('has its own side quests: rings, siren buoys and hidden pearls', () => {
    const save = newSave();
    const qs = deckQuests('sirens', save);
    expect(qs.map((q) => q.id.split(':')[1])).toEqual(['rings', 'buoys', 'pearls']);
    expect(qs.every((q) => !q.done)).toBe(true);
    const t = diveTotals(def);
    expect(t.buoys).toBe(4);
    expect(t.pearls).toBeGreaterThanOrEqual(8);
    const goal = diveGoals(def);
    expect(goal.rings).toBeGreaterThan(30);
    recordDive(save, 'sirens', { rings: goal.rings, buoys: 2 });
    expect(payQuests('sirens', save)).toHaveLength(1);
    recordDive(save, 'sirens', { buoys: 4, allPearls: true });
    expect(payQuests('sirens', save)).toHaveLength(2);
    expect(payQuests('sirens', save)).toHaveLength(0);
  });
});

describe('the Sirens’ Sea course', () => {
  it('ends at the surface after the arena, with checkpoints along the way and everything inside the sea', () => {
    expect(things[things.length - 1].kind).toBe('surface');
    const arena = things.find((t) => t.kind === 'arena');
    expect(arena && arena.s < end).toBe(true);
    const beacons = things.filter((t) => t.kind === 'checkpoint');
    expect(beacons.length).toBe(4);
    // A checkpoint right before the boss.
    expect((arena?.s ?? 0) - beacons[beacons.length - 1].s).toBeLessThan(150);
    for (const t of things) {
      if (t.kind === 'ring' || t.kind === 'bolt' || t.kind === 'pearl' || t.kind === 'buoy') expect([t.kind, t.s, inSea(t.x, t.y, 1)]).toEqual([t.kind, t.s, true]);
    }
    for (const [s, x, y] of course.guide) expect([s, inSea(x, y, 1)]).toEqual([s, true]);
  });

  it('takes four to six minutes at cruising speed', () => {
    const minutes = end / DIVE.cruise / 60;
    expect(minutes).toBeGreaterThan(4);
    expect(minutes).toBeLessThan(6);
  });

  it('keeps the guide route steerable and clear of every rock and column', () => {
    for (let s = 0; s < end; s += 1) {
      const [x0, y0] = laneAt(course.guide, s);
      const [x1, y1] = laneAt(course.guide, s + 1);
      expect(Math.hypot(x1 - x0, y1 - y0) * DIVE.rush).toBeLessThan(DIVE.steer * 0.8);
    }
    for (const t of things) {
      const [gx, gy] = laneAt(course.guide, t.s);
      if (t.kind === 'rock') expect([t.s, Math.hypot(t.x - gx, t.y - gy) > t.r + DIVE.radius + 0.4]).toEqual([t.s, true]);
      if (t.kind === 'pillar') expect([t.s, Math.abs(t.x - gx) > t.r + DIVE.radius + 0.5]).toEqual([t.s, true]);
    }
  });

  it('puts every Gardener gate’s open doorway on the route, and the sealed ones well away from it', () => {
    const doors = things.filter((t): t is Door => t.kind === 'door');
    expect(doors.length).toBe(5);
    for (const d of doors) {
      const [gx, gy] = laneAt(course.guide, d.s);
      expect(throughDoor(d, gx, gy)).toBe(true);
      // The route runs straight into the doorway (no last-moment swerve).
      const [bx, by] = laneAt(course.guide, d.s - 25);
      expect(Math.hypot(bx - gx, by - gy)).toBeLessThan(0.5);
      d.holes.forEach(([x, y], i) => {
        if (i !== d.open) expect(Math.hypot(x - gx, y - gy)).toBeGreaterThan(DIVE.doorR * 2);
      });
    }
  });

  it('never hides a pearl or a ring inside a rock', () => {
    const rocks = things.filter((t) => t.kind === 'rock');
    for (const p of things) {
      if (p.kind !== 'pearl' && p.kind !== 'ring') continue;
      const inside = rocks.filter((r) => r.kind === 'rock' && Math.hypot(r.x - p.x, r.y - p.y, r.s - p.s) < r.r + 1.2);
      expect([p.kind, p.s, inside.length]).toEqual([p.kind, p.s, 0]);
    }
  });

  it('can be swum start to finish by following the route, PINGing at gates and piranhas, and singing back at the sirens', () => {
    const d = new Dive(course);
    const got = { hurt: 0, rings: 0, bonks: 0, silenced: 0 };
    const ev: DiveEvents = {
      hurt: () => (got.hurt += 1),
      ring: () => (got.rings += 1),
      door: (_d, ok) => (got.bonks += ok ? 0 : 1),
      silenced: () => (got.silenced += 1),
      arena: () => d.release(),
    };
    let lastBeat = -1;
    let time = 0;
    while (!d.finished && time < 900) {
      let ping = false;
      if (d.singer) {
        const { off, n } = nearestBeat(d.t);
        if (Math.abs(off) < 0.05 && n !== lastBeat) {
          ping = true;
          lastBeat = n;
        }
      } else {
        const gate = things.some((t) => t.kind === 'door' && t.s - d.s > 5 && t.s - d.s < 30);
        const fish = d.fish.some((f) => f.alive && !f.stun && f.s - d.s < 30);
        ping = (gate && d.reveal <= 0) || (fish && d.meter >= DIVE.pingCost);
      }
      d.step(dt, { ...follow(d), ping }, ev);
      // Torpedo every dizzy piranha.
      for (const f of d.fish) if (f.stun > 0) f.alive = false;
      time += dt;
    }
    expect(d.finished).toBe(true);
    expect(got).toEqual({ hurt: 0, rings: things.filter((t) => t.kind === 'ring').length, bonks: 0, silenced: 4 });
    expect(d.hull).toBe(DIVE.hull);
    expect(time / 60).toBeGreaterThan(4);
    expect(time / 60).toBeLessThan(7);
  });
});

describe('the siren buoys', () => {
  const b1 = things.find((t) => t.kind === 'buoy');
  if (!b1 || b1.kind !== 'buoy') throw new Error('no buoy');

  it('sing louder as the sub comes near, and stop once it is past', () => {
    expect(songStrength(SONG.range + 1)).toBe(0);
    expect(songStrength(SONG.range - 7)).toBeCloseTo(0.5);
    expect(songStrength(5)).toBe(1);
    expect(songStrength(-SONG.behind - 1)).toBe(0);
  });

  it('pull a sub that just lets go of the stick onto the rocks', () => {
    const d = new Dive(course);
    d.restart(b1.s - SONG.range - 10);
    let hurt = 0;
    while (d.s < b1.s + 10) d.step(dt, { steerX: 0, steerY: 0, ping: false }, { hurt: () => (hurt += 1) });
    expect(hurt).toBeGreaterThanOrEqual(1);
  });

  it('go quiet when LUX sings four notes on the beat, and then stop pulling', () => {
    const d = new Dive(course);
    d.restart(b1.s - SONG.range - 10);
    let hurt = 0;
    let last = -1;
    while (d.s < b1.s + 10) {
      const { off, n } = nearestBeat(d.t);
      const ping = !!d.singer && Math.abs(off) < 0.05 && n !== last;
      if (ping) last = n;
      d.step(dt, { steerX: 0, steerY: 0, ping }, { hurt: () => (hurt += 1) });
    }
    const st = d.buoys.find((b) => b.b === b1);
    expect(st?.quiet).toBe('song');
    expect(st?.notes).toBe(SONG.notes);
    expect(hurt).toBe(0);
  });

  it('don’t count a note off the beat, or the same beat twice', () => {
    const d = new Dive(course);
    d.restart(b1.s - 20);
    d.step(dt, { steerX: 0, steerY: 0, ping: false });
    const st = d.singer;
    expect(st).toBeTruthy();
    // Half way between two beats: a miss.
    d.t = Math.round(d.t / SONG.beat) * SONG.beat + SONG.beat / 2;
    d.step(0, { steerX: 0, steerY: 0, ping: true });
    expect(st?.notes).toBe(0);
    d.t = Math.round(d.t / SONG.beat) * SONG.beat;
    d.step(0, { steerX: 0, steerY: 0, ping: true });
    d.step(0, { steerX: 0, steerY: 0, ping: true });
    expect(st?.notes).toBe(1);
  });

  it('can be torpedoed quiet instead', () => {
    const d = new Dive(course);
    const st = d.buoys[0];
    for (let i = 0; i < SONG.hp; i++) d.shootBuoy(st, {});
    expect(st.quiet).toBe('shot');
  });
});

describe('the sonar and the gates', () => {
  it('bonks a sub that swims at a sealed doorway, and sends it back a little', () => {
    const door = things.find((t): t is Door => t.kind === 'door') as Door;
    const sealed = door.holes.find((_, i) => i !== door.open) as [number, number];
    const d = new Dive(course);
    d.restart(door.s - 12);
    d.x = sealed[0];
    d.y = sealed[1];
    let bonk = 0;
    for (let i = 0; i < 120 && !bonk; i++) d.step(dt, { steerX: 0, steerY: 0, ping: false }, { door: (_d, ok) => (bonk += ok ? 0 : 1) });
    expect(bonk).toBe(1);
    expect(d.s).toBeLessThan(door.s);
    expect(d.hull).toBe(DIVE.hull - 1);
  });

  it('PINGs for a third of the meter, stuns piranhas ahead, and shows pearls for a while', () => {
    const d = new Dive(course);
    d.spawnSchool(4, 20);
    d.step(dt, { steerX: 0, steerY: 0, ping: true });
    expect(d.meter).toBeCloseTo(1 - DIVE.pingCost, 1);
    expect(d.reveal).toBeGreaterThan(DIVE.pingReveal - 0.1);
    expect(d.fish.every((f) => f.stun > 0)).toBe(true);
  });

  it('only picks up a pearl while a PING still lights it', () => {
    const pearl = things.find((t) => t.kind === 'pearl');
    if (!pearl || pearl.kind !== 'pearl') throw new Error('no pearl');
    const swim = (ping: boolean) => {
      const d = new Dive(course);
      d.restart(pearl.s - 8);
      let n = 0;
      for (let i = 0; i < 120; i++) {
        d.x = pearl.x;
        d.y = pearl.y;
        d.step(dt, { steerX: 0, steerY: 0, ping: ping && i === 0 }, { pearl: () => (n += 1) });
      }
      return n;
    };
    expect(swim(false)).toBe(0);
    expect(swim(true)).toBe(1);
  });
});

describe('THE SIREN ORGAN', () => {
  /** Plays the fight: swims into the hole of each ring, torpedoes the glowing pipe, and sings the last song. */
  function fight(dodge: boolean, sing: boolean) {
    const o = new OrganFight();
    let x = 0;
    let y = 0;
    let hits = 0;
    let fire = 0;
    let time = 0;
    let last = -1;
    while (!o.done && time < 240) {
      // Swim toward the middle of the nearest ring.
      const w = o.waves.reduce<(typeof o.waves)[number] | null>((a, b) => (!a || b.rel < a.rel ? b : a), null);
      if (dodge && w) {
        const dx = w.cx - x;
        const dy = w.cy - y;
        const dd = Math.hypot(dx, dy);
        const step = Math.min(dd, DIVE.steer * dt);
        if (dd > 0.01) {
          x += (dx / dd) * step;
          y += (dy / dd) * step;
        }
      }
      o.update(dt, x, y, { pass: (_w, hit) => (hits += hit ? 1 : 0) });
      o.checkRound();
      fire -= dt;
      if (fire <= 0 && !o.finale) {
        fire = 0.8;
        o.hitPipe(o.lit);
      }
      if (sing && o.finale) {
        // Tap on each beat of the last song, as its note reaches the ring.
        const { off, n } = nearestBeat(o.t - o.finale.t0, ORGAN.finaleBeat);
        const beat = o.finale.t0 + n * ORGAN.finaleBeat;
        if (Math.abs(off) < 0.03 && beat !== last) {
          last = beat;
          o.sing();
        }
      }
      time += dt;
    }
    return { o, hits, time };
  }

  it('can be beaten without a scratch by dodging through the rings, torpedoing the glowing pipe and singing back', () => {
    const { o, hits, time } = fight(true, true);
    expect(o.done).toBe(true);
    expect(o.frac).toBe(0);
    expect(hits).toBe(0);
    expect(time).toBeGreaterThan(20);
    expect(time).toBeLessThan(150);
  });

  it('hurts a sub that never moves, and is never beaten without the last song', () => {
    const still = fight(false, true);
    expect(still.hits).toBeGreaterThan(3);
    const mute = fight(true, false);
    expect(mute.o.done).toBe(false);
    expect(mute.o.standing).toBe(0);
  });

  it('only breaks the glowing pipe, and speeds its song up as the pipes break', () => {
    const o = new OrganFight();
    const other = (o.lit + 1) % ORGAN.pipes.length;
    expect(o.hitPipe(other)).toBe(false);
    expect(o.hitPipe(o.lit)).toBe(true);
    expect(ORGAN.every[2]).toBeLessThan(ORGAN.every[0]);
    expect(ORGAN.travel[2]).toBeLessThan(ORGAN.travel[0]);
    const phases: number[] = [];
    for (let i = 0; i < 2000 && o.standing > 0; i++) {
      // Between two glowing pipes they're all capped for a rest: wait it out.
      if (o.lit < 0) o.update(0.25, 0, 0);
      else o.hitPipe(o.lit, { phase: (n) => phases.push(n) });
    }
    expect(phases).toEqual([2, 3, 4]);
  });
});
