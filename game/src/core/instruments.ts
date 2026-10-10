/**
 * The music's instruments: recipes for the synthesizer in audio.ts (no samples). Each note is one to
 * three oscillators through an envelope, sometimes a lowpass filter that sweeps shut (plucks, brass),
 * and the song's shared vibrato and echo. Plain data, so the songs and the tests can use the names.
 */

/** Custom waveforms, as harmonic strengths (fundamental first), built once into PeriodicWaves. */
export const WAVES = {
  /** A drawbar organ: fundamental, octave, twelfth, two octaves and a little sparkle. */
  organ: [1, 0.8, 0.55, 0.45, 0, 0.3, 0, 0.22],
  /** A flue pipe: round, with a soft octave. */
  pipe: [1, 0.5, 0.28, 0.16, 0.09, 0.05],
  /** A reed (clarinet, the Greek aulos and klarino): mostly odd harmonics, hollow and nasal. */
  reed: [1, 0.06, 0.62, 0.05, 0.42, 0.04, 0.3, 0.03, 0.2, 0.02, 0.12],
  /** A sung "aah": strong low harmonics, a dip, then a bright formant. */
  choir: [1, 0.55, 0.7, 0.3, 0.18, 0.22, 0.1, 0.05],
  /** Bright, buzzy strings (bouzouki, saz): every harmonic, slowly falling. */
  nasal: [1, 0.9, 0.78, 0.65, 0.58, 0.48, 0.42, 0.34, 0.3, 0.24, 0.2, 0.16],
} as const;

export type WaveName = keyof typeof WAVES;
export type Wave = 'sine' | 'square' | 'sawtooth' | 'triangle' | WaveName;

/** A second oscillator in a note: `ratio` times the pitch, at `gain`, optionally dying away faster. */
export interface Layer {
  ratio: number;
  gain: number;
  wave?: Wave;
  /** Seconds this partial lasts (a bright attack: marimba, kalimba, bells). */
  decay?: number;
}

export interface Inst {
  wave: Wave;
  layers?: Layer[];
  /** A copy of the main oscillator detuned by this many cents (chorus, paired strings, the aulos's twin pipes). */
  detune?: number;
  /** Envelope: attack, decay (seconds), sustain (share of the peak; 0 rings out like a pluck) and release. */
  a: number;
  d: number;
  s: number;
  r: number;
  /** A keytracked lowpass: cutoff at `mul` times the pitch, starting at `env` times it and closing over `time`. */
  lp?: { mul: number; env?: number; q?: number; time?: number };
  /** Vibrato from the song's shared LFO: 1 gentle, 2 wide. */
  vib?: 1 | 2;
  gain: number;
  /** Sends the note into the song's echo. */
  echo?: boolean;
  /** Through the song's overdrive (distorted bass and guitar). */
  dirt?: boolean;
  /** A puff of noise at the start (breath on a flute, a pick on a string). */
  chiff?: number;
  /** Tremolo picking (bouzouki, santouri): long notes are struck again every this many steps. */
  trem?: number;
}

export const INSTRUMENTS = {
  /* ---- mallets and bells ---- */
  bell: { wave: 'sine', layers: [{ ratio: 4, gain: 0.22, decay: 0.3 }], a: 0.002, d: 1.1, s: 0, r: 0.2, gain: 0.13, echo: true },
  glock: { wave: 'sine', layers: [{ ratio: 2.76, gain: 0.3, decay: 0.25 }, { ratio: 5.4, gain: 0.12, decay: 0.08 }], a: 0.001, d: 0.8, s: 0, r: 0.1, gain: 0.11, echo: true },
  musicbox: { wave: 'sine', layers: [{ ratio: 3, gain: 0.18, decay: 0.15 }, { ratio: 6.2, gain: 0.08, decay: 0.05 }], a: 0.001, d: 0.7, s: 0, r: 0.1, gain: 0.12, echo: true },
  celesta: { wave: 'sine', layers: [{ ratio: 2, gain: 0.25, decay: 0.4 }, { ratio: 4, gain: 0.1, decay: 0.06 }], a: 0.002, d: 1, s: 0, r: 0.1, gain: 0.13, echo: true },
  marimba: { wave: 'sine', layers: [{ ratio: 4, gain: 0.35, decay: 0.06 }], a: 0.002, d: 0.45, s: 0, r: 0.05, gain: 0.19 },
  kalimba: { wave: 'sine', layers: [{ ratio: 5.4, gain: 0.3, decay: 0.05 }], a: 0.002, d: 0.7, s: 0, r: 0.05, gain: 0.15, chiff: 0.025, echo: true },
  steel: { wave: 'sine', layers: [{ ratio: 2, gain: 0.5, decay: 0.4 }, { ratio: 3, gain: 0.28, decay: 0.15 }], a: 0.004, d: 0.55, s: 0, r: 0.05, gain: 0.12 },
  /* ---- plucked strings ---- */
  pluck: { wave: 'sawtooth', lp: { mul: 1.5, env: 9, q: 2, time: 0.12 }, a: 0.002, d: 0.35, s: 0, r: 0.05, gain: 0.09 },
  pizz: { wave: 'sawtooth', detune: 8, lp: { mul: 1.5, env: 6, q: 1, time: 0.06 }, a: 0.003, d: 0.2, s: 0, r: 0.03, gain: 0.1, echo: true },
  lyre: { wave: 'triangle', layers: [{ ratio: 2, gain: 0.3, decay: 0.3 }], lp: { mul: 4, env: 10, time: 0.2 }, a: 0.002, d: 1.2, s: 0, r: 0.2, gain: 0.15, echo: true },
  harp: { wave: 'triangle', layers: [{ ratio: 2, gain: 0.18, decay: 0.5 }], a: 0.002, d: 1.4, s: 0, r: 0.2, gain: 0.12, echo: true },
  bouzouki: { wave: 'nasal', detune: 6, layers: [{ ratio: 2, gain: 0.35, wave: 'nasal' }], lp: { mul: 3, env: 8, q: 1.5, time: 0.1 }, a: 0.002, d: 0.45, s: 0, r: 0.05, gain: 0.08, chiff: 0.02, trem: 1, echo: true },
  laouto: { wave: 'nasal', detune: 5, lp: { mul: 2, env: 6, q: 1, time: 0.08 }, a: 0.002, d: 0.35, s: 0, r: 0.04, gain: 0.08 },
  santouri: { wave: 'triangle', detune: 7, layers: [{ ratio: 2, gain: 0.4, decay: 0.3 }, { ratio: 3, gain: 0.18, decay: 0.12 }], a: 0.001, d: 0.9, s: 0, r: 0.1, gain: 0.09, trem: 1, echo: true },
  twang: { wave: 'sawtooth', detune: 5, lp: { mul: 2.5, env: 6, q: 3, time: 0.15 }, a: 0.002, d: 0.7, s: 0, r: 0.05, gain: 0.08, echo: true },
  guitar: { wave: 'sawtooth', detune: 12, dirt: true, lp: { mul: 5, env: 3, time: 0.08 }, a: 0.002, d: 0.22, s: 0.3, r: 0.03, gain: 0.05 },
  /* ---- winds ---- */
  flute: { wave: 'sine', layers: [{ ratio: 2, gain: 0.12 }, { ratio: 1, gain: 0.25, wave: 'triangle' }], a: 0.05, d: 0.2, s: 0.85, r: 0.12, gain: 0.13, vib: 1, chiff: 0.05, echo: true },
  pan: { wave: 'sine', layers: [{ ratio: 2, gain: 0.08 }], a: 0.025, d: 0.15, s: 0.7, r: 0.1, gain: 0.14, vib: 1, chiff: 0.11, echo: true },
  whistle: { wave: 'sine', a: 0.03, d: 0.1, s: 0.9, r: 0.08, gain: 0.12, vib: 2, echo: true },
  reed: { wave: 'reed', lp: { mul: 5 }, a: 0.03, d: 0.1, s: 0.9, r: 0.08, gain: 0.09, vib: 2, echo: true },
  aulos: { wave: 'reed', detune: 12, lp: { mul: 6 }, a: 0.04, d: 0.1, s: 0.9, r: 0.08, gain: 0.07, vib: 2, chiff: 0.02, echo: true },
  /* ---- brass and bowed ---- */
  brass: { wave: 'sawtooth', detune: 7, lp: { mul: 1.4, env: 4, q: 1, time: 0.15 }, a: 0.04, d: 0.25, s: 0.8, r: 0.1, gain: 0.09, vib: 1 },
  horn: { wave: 'triangle', layers: [{ ratio: 1, gain: 0.3, wave: 'sawtooth' }], lp: { mul: 2, env: 3, time: 0.2 }, a: 0.06, d: 0.2, s: 0.85, r: 0.15, gain: 0.14, vib: 1 },
  fiddle: { wave: 'sawtooth', detune: 5, lp: { mul: 4, q: 1 }, a: 0.03, d: 0.15, s: 0.85, r: 0.08, gain: 0.065, vib: 2, echo: true },
  strings: { wave: 'sawtooth', detune: 12, lp: { mul: 3, q: 0.5 }, a: 0.12, d: 0.3, s: 0.9, r: 0.25, gain: 0.07, vib: 1 },
  /* ---- keys, voices, synths ---- */
  organ: { wave: 'organ', a: 0.008, d: 0.1, s: 1, r: 0.05, gain: 0.06, vib: 1 },
  pipe: { wave: 'pipe', layers: [{ ratio: 2, gain: 0.45, wave: 'pipe' }, { ratio: 3, gain: 0.22 }], a: 0.03, d: 0.1, s: 1, r: 0.15, gain: 0.07, echo: true },
  choir: { wave: 'choir', detune: 9, lp: { mul: 5, q: 0.7 }, a: 0.2, d: 0.3, s: 0.9, r: 0.35, gain: 0.07, vib: 1, echo: true },
  square: { wave: 'square', lp: { mul: 8 }, a: 0.004, d: 0.15, s: 0.6, r: 0.05, gain: 0.05 },
  tri: { wave: 'triangle', a: 0.004, d: 0.2, s: 0.7, r: 0.06, gain: 0.13 },
  saw: { wave: 'sawtooth', detune: 9, lp: { mul: 4, env: 6, q: 3, time: 0.15 }, a: 0.005, d: 0.2, s: 0.7, r: 0.08, gain: 0.06, vib: 1, echo: true },
  /* ---- basses ---- */
  bass: { wave: 'square', layers: [{ ratio: 0.5, gain: 2.2, wave: 'sine' }], lp: { mul: 6 }, a: 0.004, d: 0.25, s: 0.5, r: 0.05, gain: 0.07 },
  sub: { wave: 'sine', layers: [{ ratio: 1, gain: 0.3, wave: 'triangle' }], a: 0.01, d: 0.3, s: 0.8, r: 0.08, gain: 0.19 },
  pickbass: { wave: 'triangle', layers: [{ ratio: 1, gain: 0.25, wave: 'sawtooth' }], lp: { mul: 3, env: 6, time: 0.08 }, a: 0.003, d: 0.5, s: 0.3, r: 0.06, gain: 0.2 },
  synbass: { wave: 'sawtooth', layers: [{ ratio: 0.5, gain: 1.5, wave: 'sine' }], lp: { mul: 2.5, env: 6, q: 4, time: 0.1 }, a: 0.004, d: 0.2, s: 0.5, r: 0.05, gain: 0.09 },
  acid: { wave: 'sawtooth', lp: { mul: 1.5, env: 14, q: 10, time: 0.12 }, a: 0.003, d: 0.18, s: 0.4, r: 0.04, gain: 0.09 },
  dist: { wave: 'sawtooth', detune: 10, layers: [{ ratio: 0.5, gain: 0.8, wave: 'sine' }], dirt: true, lp: { mul: 6 }, a: 0.004, d: 0.2, s: 0.7, r: 0.05, gain: 0.08 },
  tuba: { wave: 'sawtooth', layers: [{ ratio: 1, gain: 1, wave: 'sine' }], lp: { mul: 1.2, env: 3, time: 0.1 }, a: 0.03, d: 0.2, s: 0.7, r: 0.08, gain: 0.13 },
  /* ---- pads ---- */
  pad: { wave: 'sawtooth', detune: 10, lp: { mul: 2.5, q: 0.4 }, a: 0.4, d: 0.5, s: 0.8, r: 0.6, gain: 0.05 },
  glass: { wave: 'sine', layers: [{ ratio: 2, gain: 0.8, wave: 'triangle' }], a: 0.3, d: 0.5, s: 0.9, r: 0.5, gain: 0.05 },
  drone: { wave: 'reed', lp: { mul: 3 }, a: 0.5, d: 0.5, s: 1, r: 0.6, gain: 0.06 },
} satisfies Record<string, Inst>;

export type InstName = keyof typeof INSTRUMENTS;
