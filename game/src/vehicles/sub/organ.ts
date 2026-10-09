import { DIVE, SONG, nearestBeat } from './dive';

/**
 * THE SIREN ORGAN (chapter 3, level 4's boss), the rules only: a giant sonic platform Aeëtes sank in the
 * Gardener gate. Six tall pipes stand in an arc in front of the Dolphin, one glowing at a time: the
 * glowing pipe sings, and each note it sings is a ring of sound that swims at the sub. Swim through the
 * hole in the middle of a ring (or stay well outside it). Torpedoes break the glowing pipe. As the pipes
 * break the song speeds up: with four left the Organ raises a siren buoy, with two left it sends piranha
 * drones. With every pipe broken, its great horn sings one last song, and LUX sings back: land enough
 * notes on the beat and the Organ shatters.
 */

export const ORGAN = {
  /** How far in front of the sub the pipes stand. */
  dist: 46,
  pipeHp: 3,
  /** Where the pipes stand (corridor x, y of their glowing mouths). */
  pipes: [
    [-8, -1.5],
    [-5, 2],
    [-1.8, 4],
    [1.8, 4],
    [5, 2],
    [8, -1.5],
  ] as [number, number][],
  /** A ring's radius when it reaches the sub, and the thickness of its sound band. */
  ringR: 3.8,
  band: 0.85,
  /** Seconds a ring takes to reach the sub, and seconds between rings, by phase (6-5 pipes, 4-3, 2-1). */
  travel: [3.2, 2.8, 2.5],
  every: [3.0, 2.3, 1.8],
  /** A glowing pipe hands over to the next one after this long. */
  litTime: 7,
  /** The final song duel: beats in a round, and good notes needed to win it. */
  finaleBeats: 8,
  finaleNeed: 5,
  finaleBeat: 0.7,
} as const;

export interface Pipe {
  x: number;
  y: number;
  hp: number;
}

/** A ring of sound swimming at the sub: `rel` is how far ahead it is, `R` its radius right now. */
export interface Wave {
  cx: number;
  cy: number;
  rel: number;
  speed: number;
  R: number;
  from: number;
}

export interface OrganEvents {
  wave?(w: Wave): void;
  /** A ring reached the sub: `hit` if the sub was on its band. */
  pass?(w: Wave, hit: boolean): void;
  lit?(i: number): void;
  pipeHit?(i: number, broke: boolean): void;
  /** The fight moved to a new phase (2: a siren buoy rises, 3: piranhas, 4: the final song). */
  phase?(n: number): void;
  finaleRound?(): void;
  finaleNote?(good: boolean, notes: number): void;
  beaten?(): void;
}

export class OrganFight {
  readonly title = 'THE SIREN ORGAN';
  pipes: Pipe[] = [];
  waves: Wave[] = [];
  lit = 2;
  t = 0;
  phase = 1;
  done = false;
  /** The final song: when its first beat falls, how many good notes so far, and beats already sung. */
  finale: { t0: number; notes: number; sung: Set<number> } | null = null;
  private waveT = 1.5;
  private litT = 0;
  private finaleWait = 0;
  private rnd = 1;

  constructor() {
    this.reset();
  }

  reset() {
    this.pipes = ORGAN.pipes.map(([x, y]) => ({ x, y, hp: ORGAN.pipeHp }));
    this.waves = [];
    this.lit = 2;
    this.t = 0;
    this.phase = 1;
    this.done = false;
    this.finale = null;
    this.waveT = 2;
    this.litT = 0;
    this.finaleWait = 0;
    this.rnd = 1;
  }

  /** Pipes still standing. */
  get standing(): number {
    return this.pipes.filter((p) => p.hp > 0).length;
  }

  /** How much fight is left (0..1), for the boss bar: the pipes, then the final song. */
  get frac(): number {
    const pipes = this.pipes.reduce((n, p) => n + p.hp, 0);
    const song = this.finale ? ORGAN.finaleNeed - Math.min(ORGAN.finaleNeed, this.finale.notes) : ORGAN.finaleNeed;
    return this.done ? 0 : (pipes + song) / (ORGAN.pipes.length * ORGAN.pipeHp + ORGAN.finaleNeed);
  }

  /** A little seeded wobble, so the fight is the same every time (and in the tests). */
  private rand(): number {
    this.rnd = (this.rnd * 16807) % 2147483647;
    return this.rnd / 2147483647;
  }

  private nextLit(ev: OrganEvents) {
    const alive = this.pipes.map((p, i) => (p.hp > 0 ? i : -1)).filter((i) => i >= 0);
    if (!alive.length) return;
    const at = alive.indexOf(this.lit);
    this.lit = alive[(at + 1 + Math.floor(this.rand() * Math.max(1, alive.length - 1))) % alive.length];
    this.litT = 0;
    ev.lit?.(this.lit);
  }

  /** Fires a ring from the glowing pipe, its hole a little to one side of the sub. */
  private fire(subX: number, subY: number, ev: OrganEvents) {
    const k = Math.min(2, this.phase - 1);
    let a = this.rand() * Math.PI * 2;
    let cx = 0;
    let cy = 0;
    for (let tries = 0; tries < 8; tries++, a += Math.PI / 4) {
      cx = subX + Math.cos(a) * ORGAN.ringR;
      cy = subY + Math.sin(a) * ORGAN.ringR;
      if (Math.abs(cx) < DIVE.halfW - 2 && Math.abs(cy) < DIVE.halfH - 1.5) break;
    }
    const w: Wave = { cx, cy, rel: ORGAN.dist, speed: ORGAN.dist / ORGAN.travel[k], R: 0.8, from: this.lit };
    w.cx = Math.max(-DIVE.halfW + 2, Math.min(DIVE.halfW - 2, w.cx));
    w.cy = Math.max(-DIVE.halfH + 1.5, Math.min(DIVE.halfH - 1.5, w.cy));
    this.waves.push(w);
    ev.wave?.(w);
  }

  update(dt: number, subX: number, subY: number, ev: OrganEvents = {}) {
    if (this.done) return;
    this.t += dt;
    // Rings swim in and grow; the moment one reaches the sub, the sub is either in its band or not.
    for (const w of this.waves) {
      w.rel -= w.speed * dt;
      w.R = 0.8 + (ORGAN.ringR - 0.8) * (1 - Math.max(0, w.rel) / ORGAN.dist);
      if (w.rel <= 0) {
        const d = Math.hypot(subX - w.cx, subY - w.cy);
        ev.pass?.(w, Math.abs(d - ORGAN.ringR) < ORGAN.band + DIVE.radius);
      }
    }
    this.waves = this.waves.filter((w) => w.rel > 0);
    if (this.finale) return;
    if (this.finaleWait > 0) {
      this.finaleWait -= dt;
      if (this.finaleWait <= 0) this.startRound(ev);
      return;
    }
    const k = Math.min(2, this.phase - 1);
    this.litT += dt;
    if (this.litT > ORGAN.litTime) this.nextLit(ev);
    this.waveT -= dt;
    if (this.waveT <= 0) {
      this.waveT = ORGAN.every[k];
      this.fire(subX, subY, ev);
    }
  }

  /** A torpedo reached a pipe: only the glowing one breaks (the others are capped in gold). */
  hitPipe(i: number, ev: OrganEvents = {}): boolean {
    const p = this.pipes[i];
    if (!p || p.hp <= 0 || i !== this.lit || this.finale || this.done) return false;
    p.hp -= 1;
    const broke = p.hp <= 0;
    ev.pipeHit?.(i, broke);
    if (!broke) return true;
    const n = this.standing;
    const phase = n === 0 ? 4 : n <= 2 ? 3 : n <= 4 ? 2 : 1;
    if (phase !== this.phase) {
      this.phase = phase;
      ev.phase?.(phase);
    }
    if (n === 0) {
      // Silence for a moment, then the great horn sings its last song.
      this.waves = [];
      this.finaleWait = 2.2;
    } else this.nextLit(ev);
    return true;
  }

  private startRound(ev: OrganEvents) {
    this.finale = { t0: this.t + 1.5, notes: 0, sung: new Set() };
    ev.finaleRound?.();
  }

  /** The beats of the final song still to come, as seconds from now (for the HUD's note strip). */
  finaleBeats(): number[] {
    const f = this.finale;
    if (!f) return [];
    const out: number[] = [];
    for (let i = 0; i < ORGAN.finaleBeats; i++) {
      const at = f.t0 + i * ORGAN.finaleBeat - this.t;
      if (at > -0.3) out.push(at);
    }
    return out;
  }

  /** LUX sings a note in the final song. Returns whether it landed on a beat. */
  sing(ev: OrganEvents = {}): boolean {
    const f = this.finale;
    if (!f || this.done) return false;
    const { off, n } = nearestBeat(this.t - f.t0, ORGAN.finaleBeat);
    const good = n >= 0 && n < ORGAN.finaleBeats && Math.abs(off) <= SONG.window && !f.sung.has(n);
    if (good) {
      f.sung.add(n);
      f.notes += 1;
    }
    ev.finaleNote?.(good, f.notes);
    if (f.notes >= ORGAN.finaleNeed) {
      this.done = true;
      ev.beaten?.();
    }
    return good;
  }

  /** Called every frame during the final song: when a round's beats are over without enough notes, another round starts. */
  checkRound(ev: OrganEvents = {}) {
    const f = this.finale;
    if (!f || this.done) return;
    if (this.t > f.t0 + ORGAN.finaleBeats * ORGAN.finaleBeat + 0.6) this.startRound(ev);
  }
}
