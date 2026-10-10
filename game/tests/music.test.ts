import { SONGS, compileSong, type Compiled, type Track } from '../src/core/songs';
import { LEVELS, LEVEL_ORDER, chapterOf, type Chapter } from '../src/levels';
import type { BossKind } from '../src/world/levelTypes';

/** Every boss kind (a missing one is a type error here), with the chapter it is fought in. */
const BOSS_CHAPTER: Record<BossKind, Chapter> = {
  warden: 1, queen: 1, golem: 1, bloblin: 1, wardog: 1, heart: 1, reborn: 1,
  thresher: 2, driller: 2, boreas: 2, stheno: 2, hydra: 2, colossus: 2, rogue: 2,
  aello: 3, excavator: 3, scylla: 3, organ: 3, talos: 3, medusa: 3, ram: 3, dragon: 3, goldenking: 3,
};
const BOSSES = Object.keys(BOSS_CHAPTER) as BossKind[];

/** The bosses that come on in a level after (or instead of) its main one. */
const EXTRA_BOSSES: Partial<Record<string, BossKind[]>> = { bridge: ['reborn'], volcano: ['rogue'] };

const compiled = new Map<Track, Compiled>();
const song = (t: Track) => {
  let c = compiled.get(t);
  if (!c) compiled.set(t, (c = compileSong(t, SONGS[t])));
  return c;
};

/** Notes and drum hits a second, over the whole song. */
function busyness(t: Track): number {
  const c = song(t);
  let n = 0;
  for (const p of c.parts) {
    for (let l = 0; l < p.steps; l++) {
      if (p.melody?.[l]) n++;
      if (p.counter?.[l]) n++;
      for (const pat of [p.bass, p.arp]) if (pat && /[0-7c]/.test(pat.s[l % pat.s.length])) n++;
      for (const [, d] of p.drums) if (d[l % d.length] !== '.') n++;
    }
  }
  return n / ((c.steps * 15) / c.song.bpm);
}

/** A song's tune, by its intervals and rhythm (the same tune in another key or tempo looks the same). */
function tune(t: Track): string {
  const p = song(t).parts[0];
  const notes = (p.melody ?? []).map((n, i) => (n ? [i, n.m] : null)).filter((n): n is number[] => !!n);
  return notes.map(([i, m], k) => `${i}:${k ? m - notes[k - 1][1] : 0}`).join(' ');
}

describe('the soundtrack', () => {
  it('reads every song without errors, tunes and chords lining up with the bars', () => {
    for (const t of Object.keys(SONGS) as Track[]) {
      const c = song(t);
      expect(c.steps).toBeGreaterThan(0);
      for (const p of c.parts) {
        for (const pat of [p.bass?.s, p.arp?.s, ...p.drums.map(([, d]) => d)]) {
          if (pat) expect(pat.length % c.bar === 0 || c.bar % pat.length === 0).toBe(true);
        }
        for (const n of [...(p.melody ?? []), ...(p.counter ?? [])]) if (n) expect(n.m).toBeGreaterThanOrEqual(43);
        for (const n of p.melody ?? []) if (n) expect(n.m).toBeLessThanOrEqual(93);
      }
    }
  });

  it('loops for at least a quarter of a minute on every level', () => {
    for (const id of LEVEL_ORDER) {
      const c = song(LEVELS[id].music);
      expect((c.steps * 15) / c.song.bpm).toBeGreaterThan(25);
    }
  });

  it('gives every level its own song, with its own tune', () => {
    const tracks = LEVEL_ORDER.map((id) => LEVELS[id].music);
    expect(new Set(tracks).size).toBe(tracks.length);
    const tunes = [...tracks, 'title', 'ending'].map((t) => tune(t as Track));
    expect(new Set(tunes).size).toBe(tunes.length);
  });

  it('gives every boss its own track, apart from the levels', () => {
    const levelTracks = new Set<string>(LEVEL_ORDER.map((id) => LEVELS[id].music));
    for (const b of BOSSES) {
      // A boss's music is the track named after its kind (Boss.music).
      expect(SONGS).toHaveProperty(b);
      expect(levelTracks.has(b)).toBe(false);
    }
    for (const id of LEVEL_ORDER) {
      const boss = LEVELS[id].boss;
      if (boss) expect(BOSS_CHAPTER[boss]).toBe(chapterOf(id));
    }
  });

  it('plays a chapter boss theme for the small bosses (each with its own key, speed or sound), and a theme of its own for each story boss', () => {
    const byTune = new Map<string, BossKind[]>();
    for (const b of BOSSES) byTune.set(tune(b), [...(byTune.get(tune(b)) ?? []), b]);
    const shared = [...byTune.values()].filter((g) => g.length > 1);
    // One shared theme in each chapter, never across chapters.
    expect(shared.map((g) => new Set(g.map((b) => BOSS_CHAPTER[b])).size)).toEqual([1, 1, 1]);
    for (const g of shared) {
      const looks = g.map((b) => {
        const s = SONGS[b];
        return JSON.stringify([s.key ?? 0, s.bpm, s.voices, s.kit, s.swing]);
      });
      expect(new Set(looks).size).toBe(g.length);
    }
    const story: BossKind[] = ['heart', 'reborn', 'colossus', 'rogue', 'organ', 'talos', 'medusa', 'dragon', 'goldenking'];
    for (const b of story) expect(byTune.get(tune(b))).toEqual([b]);
    const levelTunes = new Set(LEVEL_ORDER.map((id) => tune(LEVELS[id].music)));
    for (const b of BOSSES) expect(levelTunes.has(tune(b))).toBe(false);
  });

  it('makes every boss fight busier and faster-moving than its level', () => {
    for (const id of LEVEL_ORDER) {
      const level = LEVELS[id];
      for (const b of [level.boss, ...(EXTRA_BOSSES[id] ?? [])]) {
        if (!b) continue;
        expect(busyness(b)).toBeGreaterThan(busyness(level.music));
      }
    }
  });
});
