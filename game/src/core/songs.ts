import type { InstName } from './instruments';

/**
 * The soundtrack, written as data for the synthesizer in audio.ts: every level has its own song, and
 * every boss its own theme. The ship's decks (chapter 1) are synthy, Gaia Nova's regions (chapter 2)
 * sound like their biome, and the Argonauts' voyage (chapter 3) has Greek colour: bouzouki, lyre, aulos
 * and santouri, the old modes (Dorian, Phrygian, Hijaz) and the dance meters 7/8 and 9/8.
 *
 * A song is a few sections (A, B, ...) played in the order of its `form`, each with its chords, a
 * written tune (`melody`) and maybe a second voice (`counter`), over repeating bass, arpeggio and drum
 * patterns. The small bosses of a chapter share their chapter's boss theme, each in its own key, speed
 * and instruments (`vary`); the story bosses have themes of their own.
 */

/**
 * Drum lanes: k kick, s snare, c clap, h hi-hat, o open hat, z shaker, t low tom (or doum), m high tom,
 * r rim (woodblock, the darbuka's tek), j jingles (tambourine, riq), x crash, b big drum (taiko,
 * timpani), a anvil. In a lane, 'x' is a hit, 'X' an accent, 'g' a ghost note and '.' a rest.
 */
export type Lane = 'k' | 's' | 'c' | 'h' | 'o' | 'z' | 't' | 'm' | 'r' | 'j' | 'x' | 'b' | 'a';
export type Drums = Partial<Record<Lane, string>>;

/** How the kick and snare sound: a drum machine, a rock kit, hand drums, a marching band or brushes. */
export type Kit = 'electro' | 'rock' | 'hand' | 'march' | 'soft';

export interface Voices {
  lead: InstName;
  counter?: InstName;
  arp?: InstName;
  bass?: InstName;
  pad?: InstName;
  drone?: InstName;
}

/** The song's room: a lowpass on the whole mix (Hz), and an echo `echo` steps long. */
export interface Fx {
  cutoff: number;
  echo?: number;
  fb?: number;
  wet?: number;
}

/**
 * Bass and arpeggio patterns, one character a step, played over the chord of the moment: '0' root,
 * '1' third, '2' fifth, '3' octave, '4' seventh (or the ninth if the chord has none), '5' and '6' the
 * third and fifth an octave up, '7' the fifth below; 'c' strikes the whole chord, '-' holds, '.' rests.
 */
interface Parts {
  bass?: string;
  arp?: string;
  drums?: Drums;
}

export interface Section extends Parts {
  /** Chords, bars split by '|': 'Am | F | C G' (two in a bar split it in half). */
  chords: string;
  /**
   * The tune: notes like 'a4', 'c#5' or 'bb4' ('.' rests), each one unit long (an eighth note unless
   * the song says otherwise) or ':n' units; '~' slides into a note from the one before, '|' marks bars.
   */
  melody?: string;
  counter?: string;
  voices?: Partial<Voices>;
  /** No pad or drone in this section. */
  bare?: boolean;
}

export interface Song extends Parts {
  bpm: number;
  /** Steps (16th notes) in a bar: 16 for 4/4, 12 for 3/4 and 6/8, 14 for 7/8, 18 for 9/8, 20 for 5/4. */
  bar?: number;
  /** Steps in one unit of a melody (2: eighth notes). */
  unit?: number;
  /** How late the off-beats come, in steps: every second 16th, or every second 8th with `shuffle`. */
  swing?: number;
  shuffle?: boolean;
  /** Semitones to move everything by (boss variations). */
  key?: number;
  voices: Voices;
  kit?: Kit;
  /** A note held under every bar (the Greek ison), like 'd3'. */
  drone?: string;
  fx: Fx;
  /** A tom fill ends every section and a cymbal starts the next. */
  fills?: boolean;
  /** The sections in play order, like 'AABA'; it loops. */
  form: string;
  sections: Record<string, Section>;
  /** Level trim, so every level's song sits at about the same loudness (and bosses a little louder). */
  gain?: number;
}

/** The small bosses of a chapter play their chapter's boss theme, in their own key, speed and colours. */
function vary(base: Song, v: Omit<Partial<Song>, 'voices' | 'fx'> & { voices?: Partial<Voices>; fx?: Partial<Fx> }): Song {
  return { ...base, ...v, voices: { ...base.voices, ...v.voices }, fx: { ...base.fx, ...v.fx } };
}

/* ---------------- chapter boss themes (each small boss plays a variation) ---------------- */

// The ship's machines: a hard synth riff in E minor over a squelching acid bass.
const SHIP_BOSS: Song = {
  bpm: 144,
  voices: { lead: 'saw', arp: 'square', bass: 'acid', pad: 'pad' },
  kit: 'electro',
  fx: { cutoff: 7000, echo: 3, fb: 0.3, wet: 0.2 },
  fills: true,
  bass: '0.03.00.0.30.020',
  arp: '0323032303230323',
  drums: { k: 'x...x...x...x...', s: '....x.......x...', c: '............x.x.', h: 'xgxgxgxgxgxgxgxg' },
  form: 'AABB',
  sections: {
    A: { chords: 'Em | C | D | B', melody: 'e5 e5 g5 e5 b5:2 a5 g5 | e5 e5 g5 e5 c6:2 b5 g5 | f#5:2 a5:2 d6:2 c6 a5 | b5:4 d#5:4' },
    B: { chords: 'Am | Em | C | B', melody: 'a5:3 b5 c6:2 b5 a5 | g5:3 f#5 e5:4 | e6:3 d6 c6:2 b5 a5 | b5:2 f#5:2 d#5:2 b4:2' },
  },
};

// Gaia Nova's beasts and machines: driving adventure rock in B minor, brass over chugging guitars.
const GAIA_BOSS: Song = {
  bpm: 148,
  gain: 0.85,
  voices: { lead: 'brass', arp: 'guitar', bass: 'synbass', pad: 'strings' },
  kit: 'rock',
  fx: { cutoff: 8000, echo: 3, fb: 0.25, wet: 0.15 },
  fills: true,
  bass: '0.0.0.00.0.0.2.3',
  arp: 'c.c.c.cc.c.c.c.c',
  drums: { k: 'x.x...x.x.x...x.', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
  form: 'AABB',
  sections: {
    A: { chords: 'Bm | G | A | F#', melody: 'b4:2 d5 f#5 b5:2 a5 f#5 | g5:2 b5 d6 b5:2 a5 g5 | a5:2 c#6 e6 a5:2 g5 e5 | f#5:4 a#5:4' },
    B: { chords: 'Em | G | Bm | F#', melody: 'e5:3 f#5 g5:2 b5:2 | d6:3 c#6 b5:2 g5:2 | f#5:3 e5 d5:2 b4:2 | c#5:2 e5:2 f#5:4' },
  },
};

// Aeëtes's monsters: a fast Greek battle dance in 7/8 (2+2+3), Phrygian, bouzouki over laouto and darbuka.
const MYTH_BOSS: Song = {
  bpm: 168,
  gain: 0.8,
  bar: 14,
  voices: { lead: 'bouzouki', counter: 'brass', arp: 'laouto', bass: 'pickbass', pad: 'strings' },
  kit: 'hand',
  fx: { cutoff: 8000, echo: 2, fb: 0.25, wet: 0.15 },
  fills: true,
  bass: '0.0.2.2.0.0.3.',
  arp: 'c.c.c.c.c...c.',
  drums: { k: 'x...x...x.....', r: '..x...x...x.x.', j: 'g.g.g.g.g.g.g.', t: '........x...x.' },
  form: 'AABB',
  sections: {
    A: { chords: 'Em | F | G | F', melody: 'e5:2 f5:2 g5:3 | a5:2 g5:2 f5:3 | g5 a5 b5:2 d6:3 | c6:2 b5:2 a5 g5 f5' },
    B: { chords: 'Am | G | F | E', melody: 'e6:2 d6:2 c6:3 | d6:2 c6:2 b5:3 | c6 b5 a5:2 f5:3 | e5:2 g#5:2 b5:3', counter: 'a4:7 | g4:7 | f4:7 | e4:7' },
  },
};

const ALL_SONGS = {
  /* ---------------- title and ending ---------------- */

  // The main theme: a wistful, heroic tune in A minor on strings over glittering bells, then a horn lifts it.
  title: {
    bpm: 92,
    gain: 0.81,
    voices: { lead: 'strings', counter: 'strings', arp: 'bell', bass: 'sub', pad: 'choir' },
    kit: 'soft',
    fx: { cutoff: 9000, echo: 3, fb: 0.35, wet: 0.3 },
    bass: '0.......0...2...',
    arp: '0.2.3.2.4.2.3.2.',
    drums: { k: 'x...............', m: '..............g.', z: '..g...g...g...g.' },
    form: 'AB',
    sections: {
      A: {
        chords: 'Am | F | C | G | Am | F | Dm | E',
        melody: 'a4:3 e5 e5:2 d5 c5 | c5:2 a4:2 f5:4 | e5:3 d5 c5:2 g4:2 | d5:6 . . | a4:3 e5 a5:2 g5 e5 | f5:3 e5 c5:2 a4:2 | d5:2 f5:2 a5:2 g5 f5 | e5:6 g#4:2',
      },
      B: {
        chords: 'F | G | Em | Am | F | G | C | E',
        melody: 'a5:4 g5:2 f5:2 | g5:3 f5 e5:2 d5:2 | e5:4 b4:2 e5:2 | c5:6 . . | a5:4 c6:2 a5:2 | b5:4 g5:2 d5:2 | e5:2 g5:2 c6:4 | b5:4 g#5:4',
        counter: 'f4:8 | d4:8 | g4:8 | e4:8 | c5:8 | d5:8 | e5:8 | e5:4 d5:4',
        voices: { lead: 'horn' },
        bass: '0.....0.2.......',
        drums: { k: 'x.......x.......', s: '........x.......', z: '..g...g...g...g.', t: '............x.x.' },
      },
    },
  },

  // The endings: the title's tune turned to F major, slow, on the lyre, with a choir for the last lines.
  ending: {
    bpm: 76,
    gain: 0.5,
    voices: { lead: 'lyre', arp: 'harp', bass: 'sub', pad: 'strings' },
    kit: 'soft',
    fx: { cutoff: 8000, echo: 4, fb: 0.35, wet: 0.3 },
    bass: '0-------2-------',
    arp: '0..2..3..5..3...',
    form: 'AB',
    sections: {
      A: {
        chords: 'F | Dm | Bb | C | F | Am | Bb C | F',
        melody: 'c5:3 a5 a5:2 g5 f5 | f5:2 d5:2 a5:4 | bb5:3 a5 g5:2 f5:2 | g5:6 . . | c5:3 a5 c6:2 bb5 a5 | a5:3 g5 e5:2 c5:2 | d5:2 f5:2 e5:2 g5:2 | f5:6 . .',
      },
      B: {
        chords: 'Bb | C | Am Dm | Gm C',
        melody: 'f5:4 bb5:4 | e5:2 g5:2 c6:4 | c6:4 a5:4 | bb5:4 g5:2 e5:2',
        voices: { lead: 'choir' },
        drums: { k: 'x...............', t: '............g.g.' },
      },
    },
  },

  /* ---------------- chapter 1: the colony ship ---------------- */

  // Cryo Deck: frozen and crystalline. A glockenspiel tune with long icy echoes over a slow electro beat.
  cryo: {
    bpm: 100,
    gain: 0.86,
    voices: { lead: 'glock', arp: 'pluck', bass: 'sub', pad: 'glass' },
    kit: 'electro',
    fx: { cutoff: 6500, echo: 3, fb: 0.45, wet: 0.35 },
    bass: '0.......0.....2.',
    arp: '0.2.3.2.4.2.3.2.',
    drums: { k: 'x.......x.......', s: '....x.......x...', h: '..x...x...x...x.', z: 'g.g.g.g.g.g.g.g.' },
    form: 'AABA',
    sections: {
      A: { chords: 'Em | CM7 | G | D', melody: 'b5:2 . e6 d6 b5:2 . | g5:3 f#5 e5:2 b4:2 | d5:2 . g5 a5 b5:2 d6 | a5:6 . .' },
      B: {
        chords: 'Am | Em | C | B',
        melody: 'c6:2 b5 a5 e5:2 a5:2 | g5:3 f#5 e5:4 | e5:2 g5 c6 b5:2 g5:2 | f#5:4 d#5:4',
        drums: { k: 'x.........x.....', s: '........x.......', z: 'g.g.g.g.g.g.g.g.' },
      },
    },
  },

  // Hydroponics: a bubbly, swung marimba groove in D Dorian, kalimba drops, a shaker in the leaves.
  hydro: {
    bpm: 112,
    gain: 0.8,
    swing: 0.3,
    voices: { lead: 'marimba', arp: 'kalimba', bass: 'pickbass', pad: 'pad' },
    kit: 'electro',
    fx: { cutoff: 8000, echo: 2, fb: 0.3, wet: 0.25 },
    bass: '0..0..2...0.3.2.',
    arp: '..2...4...2...3.',
    drums: { k: 'x.....x...x.....', c: '....x.......x...', z: 'gxgxgxgxgxgxgxgx' },
    form: 'AABB',
    sections: {
      A: { chords: 'Dm7 | G | Dm7 | G', melody: 'd5 f5 a5 . g5 f5 d5 . | b4:2 d5 g5:2 f5 e5 d5 | d5 f5 a5 c6 b5 a5 g5 f5 | e5:2 d5 b4 d5:4' },
      B: { chords: 'Bb | C | Am | Dm', melody: 'f5:2 d5 f5 bb5:2 a5 g5 | g5:2 e5 g5 c6:2 bb5 a5 | a5:3 g5 e5:2 c5:2 | d5:6 . .' },
    },
  },

  // Engine Core: industrial and hot. A Phrygian saw riff over a squelching acid bass and clanking rims.
  engine: {
    bpm: 120,
    voices: { lead: 'saw', bass: 'acid', pad: 'pad' },
    kit: 'electro',
    fx: { cutoff: 5000, echo: 3, fb: 0.3, wet: 0.2 },
    fills: true,
    bass: '0.0.3.00.0.3.0.3',
    drums: { k: 'x...x...x...x...', c: '....x.......x...', h: 'g.x.g.x.g.x.g.x.', r: '...x......x..x..' },
    form: 'AABB',
    sections: {
      A: { chords: 'A5 | A5 | Bb5 | A5', melody: 'a4:2 . a4 c5:2 b4 a4 | e5:3 d5 c5:2 bb4:2 | bb4:2 . d5 f5:2 e5 d5 | e5:4 . . . .' },
      B: { chords: 'F5 | G5 | Bb5 | A5', melody: 'f5:2 e5 f5 a5:2 g5 f5 | g5:2 f5 g5 bb5:2 a5 g5 | f5:2 d5 bb4 f5:2 e5 d5 | e5:4 a4:4' },
    },
  },

  // Habitat Ring: homely and funky. A swung whistle-like tune, organ stabs and a bouncing bass, brushed drums.
  habitat: {
    bpm: 108,
    gain: 0.78,
    swing: 0.35,
    voices: { lead: 'tri', arp: 'organ', bass: 'pickbass', pad: 'glass' },
    kit: 'soft',
    fx: { cutoff: 9000, echo: 2, fb: 0.2, wet: 0.15 },
    bass: '0.0..0.23..0.2..',
    arp: '..c...c...c...c.',
    drums: { k: 'x.....x.x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', o: '..............x.' },
    form: 'AABB',
    sections: {
      A: { chords: 'C | Am7 | Dm7 | G7', melody: 'e5 g5 . c6 . g5 e5 g5 | a5:2 g5 e5 c5:2 . . | d5 f5 . a5 . f5 d5 f5 | g5:2 f5 d5 b4:2 g4:2' },
      B: { chords: 'F | Em7 | Dm7 | G7', melody: 'a5:2 . c6 a5 g5 f5 . | g5:2 . b5 g5 e5 d5 . | f5 e5 d5 c5 d5:2 f5:2 | g5:4 b5:2 d6:2' },
    },
  },

  // Security Deck: a tense spy-movie riff in C minor over pulsing octaves and a whirring saw arpeggio.
  security: {
    bpm: 126,
    gain: 0.86,
    voices: { lead: 'square', arp: 'saw', bass: 'synbass', pad: 'pad' },
    kit: 'electro',
    fx: { cutoff: 7000, echo: 3, fb: 0.4, wet: 0.25 },
    bass: '0.3.0.3.0.3.0.3.',
    arp: '0213021302130213',
    drums: { k: 'x...x...x...x...', c: '....x.......x...', h: 'ggxgggxgggxgggxg' },
    form: 'AABB',
    sections: {
      A: { chords: 'Cm | Cm | Ab | G', melody: 'c5:2 eb5:2 g5 f#5 g5:2 | c6:2 bb5 g5 ab5:2 g5:2 | ab5:2 g5 f5 eb5:2 c5:2 | d5:2 b4:2 g4:4' },
      B: {
        chords: 'Fm | Ab | Bb | G',
        melody: 'f5:3 ab5 c6:4 | eb6:3 c6 ab5:4 | d6:3 bb5 f5:2 d6:2 | b5:4 g5:2 f5:2',
        drums: { k: 'x...x...x...x...', c: '....x.......x...', h: 'ggxgggxgggxgggxg', o: '..x...x...x...x.' },
      },
    },
  },

  // The Bridge: cinematic and grand. Soaring strings in D minor, then brass and choir, with rolling toms.
  bridge: {
    bpm: 116,
    gain: 0.83,
    voices: { lead: 'strings', counter: 'choir', arp: 'pluck', bass: 'synbass', pad: 'pad' },
    kit: 'rock',
    fx: { cutoff: 8000, echo: 3, fb: 0.35, wet: 0.25 },
    fills: true,
    bass: '0.0.0.0.0.0.0.0.',
    arp: '0230423042304230',
    drums: { k: 'x.....x...x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
    form: 'AABB',
    sections: {
      A: { chords: 'Dm | Bb | C | A', melody: 'd5:3 a4 d5:2 f5:2 | bb5:3 a5 g5:2 f5:2 | e5:3 f5 g5:2 c5:2 | e5:2 c#5:2 a4:4' },
      B: {
        chords: 'Gm | Bb | F | A7',
        melody: 'bb5:4 a5:2 g5:2 | f5:4 d5:2 f5:2 | c6:4 a5:2 f5:2 | e5:3 g5 c#5:4',
        counter: 'd5:8 | d5:8 | c5:8 | c#5:8',
        voices: { lead: 'brass' },
      },
    },
  },

  /* ---------------- chapter 2: Gaia Nova ---------------- */

  // Whispering Plains: a bright pastoral jig in 6/8, a flute over strummed strings and a brushed beat.
  plains: {
    bpm: 144,
    gain: 0.68,
    bar: 12,
    voices: { lead: 'flute', arp: 'pluck', bass: 'pickbass', pad: 'glass' },
    kit: 'soft',
    fx: { cutoff: 9000, echo: 6, fb: 0.25, wet: 0.2 },
    bass: '0.....2.....',
    arp: '0.2.3.4.3.2.',
    drums: { k: 'x...........', s: '......x.....', z: 'x.g.g.x.g.g.' },
    form: 'ABAC',
    sections: {
      A: {
        chords: 'D | G | D | A | D | G | A | D',
        melody: 'a5:2 f#5 d5:2 f#5 | g5:2 b5 d6:2 b5 | a5:2 f#5 a5 g5 f#5 | e5:3 . . a4 | a5:2 f#5 d5:2 f#5 | g5:2 b5 d6:2 b5 | e5 f#5 e5 c#5 b4 c#5 | d5:5 .',
      },
      B: {
        chords: 'Bm | G | D | A | Bm | G | Em | A',
        melody: 'f#5:2 d5 b4:2 d5 | e5:2 g5 b5:2 g5 | a5:2 f#5 d5:2 f#5 | e5:3 c#5:3 | d5:2 f#5 b5:2 a5 | g5:2 b5 d6:2 b5 | e6:2 d6 b5 g5 e5 | a5:3 . . a4',
      },
      C: {
        chords: 'G | D | Em | A | G | D | A | D',
        melody: 'b5:2 a5 g5:2 b5 | a5:2 f#5 d5:2 a5 | g5:2 e5 b4:2 e5 | c#5:3 e5:3 | d6:2 b5 g5:2 b5 | a5:2 f#5 d5:2 f#5 | e5 g5 f#5 e5 d5 c#5 | d5:5 .',
        voices: { lead: 'horn' },
      },
    },
  },

  // Glass Desert: a lonely spaghetti-western shuffle in E minor, a whistled tune, twangy guitar, hoofbeats.
  desert: {
    bpm: 96,
    gain: 0.68,
    swing: 0.6,
    shuffle: true,
    voices: { lead: 'whistle', arp: 'twang', bass: 'pickbass', pad: 'strings' },
    kit: 'soft',
    fx: { cutoff: 6000, echo: 2, fb: 0.3, wet: 0.3 },
    bass: '0.......2.......',
    arp: '0.2.c...0.2.c...',
    drums: { k: 'x.......x.......', t: 'x.x...x.x.x...x.', r: '....x.......x...', z: 'x.x.x.x.x.x.x.x.' },
    form: 'AABB',
    sections: {
      A: { chords: 'Em | Em | D | Em', melody: 'e5:3 b4 e5:2 g5:2 | f#5:3 e5 d5:2 b4:2 | d5:3 a4 d5:2 f#5:2 | e5:6 . .' },
      B: { chords: 'Am | Em | B7 | Em', melody: 'a5:3 g5 e5:2 c5:2 | b4:3 e5 g5:4 | f#5:3 a5 d#5:2 b4:2 | e5:6 . .', voices: { lead: 'twang' } },
    },
  },

  // Frostpeak Tundra: a slow, glittering waltz in A minor, celesta over harp and strings, sleigh jingles.
  snow: {
    bpm: 132,
    gain: 0.9,
    bar: 12,
    voices: { lead: 'celesta', arp: 'harp', bass: 'sub', pad: 'strings' },
    kit: 'soft',
    fx: { cutoff: 7500, echo: 4, fb: 0.4, wet: 0.3 },
    bass: '0...........',
    arp: '....c...c...',
    drums: { k: 'g...........', j: '....g...g...' },
    form: 'ABAC',
    sections: {
      A: {
        chords: 'Am | F | C | E | Am | F | Dm | E',
        melody: 'c6:3 b5 a5:2 | a5:3 g5 f5:2 | e5:2 g5:2 c6:2 | b5:6 | c6:3 b5 a5:2 | a5:3 b5 c6:2 | d6:3 c6 a5:2 | g#5:4 . .',
      },
      B: {
        chords: 'F | G | Em | Am | Dm | Am | E | E',
        melody: 'a5:2 c6:2 f6:2 | e6:3 d6 b5:2 | g5:2 b5:2 e6:2 | c6:6 | f5:3 e5 d5:2 | e5:3 d5 c5:2 | b4:3 c5 d5:2 | e5:4 . .',
      },
      C: {
        chords: 'C | G | Am | Em | F | C | Dm E | Am',
        melody: 'e6:3 d6 c6:2 | d6:3 c6 b5:2 | c6:2 a5:2 e5:2 | g5:6 | a5:3 g5 f5:2 | e5:2 g5:2 c6:2 | d6:3 b5:3 | a5:6',
        voices: { lead: 'strings' },
      },
    },
  },

  // Titan Rockies: heroic mountain rock in G Mixolydian, a horn call over chugging guitars.
  rockies: {
    bpm: 118,
    gain: 0.58,
    voices: { lead: 'horn', arp: 'guitar', bass: 'pickbass', pad: 'strings' },
    kit: 'rock',
    fx: { cutoff: 8000, echo: 4, fb: 0.25, wet: 0.2 },
    fills: true,
    bass: '0.0.0.0.0.0.0.2.',
    arp: 'c..c..c.c..c..c.',
    drums: { k: 'x.....x.x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
    form: 'AABB',
    sections: {
      A: { chords: 'G | F | C | G', melody: 'd5:3 g5 g5:2 a5 b5 | c6:3 a5 f5:4 | e5:3 g5 c6:2 b5 a5 | g5:6 . .' },
      B: { chords: 'Em | C | D | D', melody: 'b5:3 a5 g5:2 e5:2 | c6:3 b5 a5:2 g5:2 | a5:3 f#5 d5:2 f#5:2 | a5:4 c6:2 b5 a5' },
    },
  },

  // Thornwood Jungle: tribal toms and a shaker, a pan flute in D Dorian, a kalimba in three against four.
  jungle: {
    bpm: 110,
    gain: 0.66,
    voices: { lead: 'pan', arp: 'kalimba', bass: 'pickbass', pad: 'pad' },
    kit: 'hand',
    fx: { cutoff: 7000, echo: 3, fb: 0.3, wet: 0.25 },
    bass: '0..0..2...0..2..',
    arp: '0..2..4..2..'.repeat(4),
    drums: { k: 'x.....x...x.....', t: '...x..x....x..x.', m: '.x.......x.x....', z: 'xgxgxgxgxgxgxgxg' },
    form: 'AABB',
    sections: {
      A: { chords: 'Dm | C | Bb | C', melody: 'a5:2 . f5 g5:2 a5 c6 | g5:4 e5:2 c5:2 | d5:2 . f5 bb5:2 a5 g5 | a5:4 g5:2 e5:2' },
      B: { chords: 'Dm | Am | Bb | Asus A', melody: 'd6:3 c6 a5:2 f5:2 | e5:3 g5 a5:4 | bb5:2 a5 g5 f5:2 d5:2 | e5:4 c#5:4' },
    },
  },

  // Mount Atlantas: the Legion's fortress. A dark, driving march, galloping distorted bass, a doom choir.
  volcano: {
    bpm: 132,
    gain: 0.52,
    voices: { lead: 'saw', bass: 'dist', pad: 'choir' },
    kit: 'rock',
    fx: { cutoff: 5500, echo: 3, fb: 0.25, wet: 0.15 },
    fills: true,
    bass: '0.000.000.000.00',
    drums: { k: 'x.x.x.x.x.x.x.x.', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', b: 'x.......x.......' },
    form: 'AABB',
    sections: {
      A: { chords: 'Am | F | Dm | E', melody: 'a4:2 a4 a4 c5:2 e5:2 | f5:3 e5 d5:2 c5:2 | d5:2 d5 d5 f5:2 a5:2 | g#5:4 e5:4' },
      B: { chords: 'Am | Bb | Am | E', melody: 'e6:3 d6 c6:2 a5:2 | bb5:3 a5 g5:2 f5:2 | a5:3 g5 e5:2 c5:2 | b4:2 c5 d5 e5:4' },
    },
  },

  /* ---------------- chapter 3: the Argonauts ---------------- */

  // The Clashing Rocks: the Argo under full sail. Heroic D Mixolydian brass, a galloping beat, bouzouki.
  argo: {
    bpm: 132,
    gain: 0.58,
    voices: { lead: 'brass', counter: 'bouzouki', arp: 'pizz', bass: 'pickbass', pad: 'strings' },
    kit: 'rock',
    fx: { cutoff: 9000, echo: 3, fb: 0.3, wet: 0.2 },
    fills: true,
    bass: '0.0.2.0.0.0.2.3.',
    arp: '3.33.22.3.33.22.',
    drums: { k: 'x...x.x.x...x.x.', s: '....x.......x...', h: 'x.xxx.xxx.xxx.xx' },
    form: 'AABB',
    sections: {
      A: { chords: 'D | C | G | D', melody: 'd5:2 a5:3 f#5 g5 a5 | g5:3 e5 c5:4 | d5:2 g5:3 a5 b5 d6 | a5:6 . .' },
      B: {
        chords: 'Bm | G | Em | A',
        melody: 'b5:3 a5 f#5:2 d5:2 | g5:3 a5 b5:4 | e6:3 d6 b5:2 g5:2 | a5:4 c#6:2 e6:2',
        counter: 'f#5:4 d5:4 | d5:4 b4:4 | g5:4 e5:4 | e5:4 a5:4',
      },
    },
  },

  // Harpy Isles: an airy, skipping 9/8 (2+2+2+3) in F, a flute over lyre, frame drum and riq.
  isles: {
    bpm: 140,
    gain: 0.62,
    bar: 18,
    voices: { lead: 'flute', arp: 'lyre', bass: 'pickbass', pad: 'glass' },
    kit: 'hand',
    fx: { cutoff: 9000, echo: 4, fb: 0.35, wet: 0.3 },
    bass: '0.......2...0.....',
    arp: '0...2...3...2.4...',
    drums: { k: 'x.......x.........', r: '....x.......x...x.', j: '..x...x...x...x.x.' },
    form: 'ABAC',
    sections: {
      A: { chords: 'F | Gm | C | F', melody: 'c6:2 a5:2 f5:2 a5:3 | bb5:2 g5:2 d5:2 g5:3 | e5 f5 g5:2 c6:2 bb5:3 | a5:2 g5:2 f5:5' },
      B: { chords: 'Dm | Bb | C | C', melody: 'd6:2 c6:2 a5:2 f5:3 | d6:2 bb5:2 f5:2 d5:3 | e5:2 g5:2 c6:2 e6:3 | d6 c6 bb5:2 g5:2 e5:3' },
      C: {
        chords: 'Bb | F | Gm | C',
        melody: 'd6:2 c6:2 bb5:2 f5:3 | a5:2 c6:2 f6:2 c6:3 | bb5:2 a5:2 g5:2 d5:3 | e5 f5 g5:2 bb5:2 c6:3',
        voices: { lead: 'aulos' },
      },
    },
  },

  // Aeëtes's Mine: General Brennus's old soldier's march in A minor, tuba and snare, then a klarino lament.
  mine: {
    bpm: 104,
    gain: 0.8,
    voices: { lead: 'brass', arp: 'laouto', bass: 'tuba', pad: 'strings' },
    kit: 'march',
    drone: 'a2',
    fx: { cutoff: 5000, echo: 3, fb: 0.3, wet: 0.2 },
    bass: '0.......2.......',
    arp: '....c.......c...',
    drums: { k: 'x.......x.......', s: '....x.......x.gg' },
    form: 'AB',
    sections: {
      A: {
        chords: 'Am | E | Am | E | Am | Dm | E | Am',
        melody: 'e5:2 c5 a4 e5:2 c5 a4 | g#4:2 b4 d5 e5:4 | a5:2 g5 f5 e5:2 d5 c5 | b4:6 . . | e5:2 c5 a4 e5:2 a5:2 | f5:3 e5 d5:2 a5:2 | g#5:2 f5 e5 d5:2 b4:2 | a4:6 . .',
      },
      B: {
        chords: 'Dm | Am | E | Am',
        melody: 'a5:2 ~bb5 a5 g5:2 f5:2 | e5:3 f5 e5:2 c5:2 | d5:2 e5 f5 g#5:2 b5:2 | a5:6 . .',
        voices: { lead: 'reed' },
        drums: { k: 'x.......x.......', s: '............x...' },
      },
    },
  },

  // The Sirens' Sea: a dreamy underwater barcarolle in 6/8, wordless siren voices over a rippling harp.
  sirens: {
    bpm: 120,
    gain: 0.8,
    bar: 12,
    voices: { lead: 'choir', arp: 'harp', bass: 'sub', pad: 'glass' },
    kit: 'soft',
    fx: { cutoff: 4500, echo: 6, fb: 0.45, wet: 0.4 },
    bass: '0.....2.....',
    arp: '0.2.3.5.3.2.',
    drums: { k: 'g...........', z: 'g.....g.....' },
    form: 'ACBAD',
    sections: {
      A: { chords: 'Dm | Gm | A | Dm', melody: 'a5:3 g5 f5 e5 | d5:3 g5 a5 bb5 | e5:3 c#5:2 e5 | d5:6' },
      C: { chords: 'Dm | Gm | A | Dm', melody: 'a5:3 bb5 a5 g5 | f5:3 d5 e5 f5 | e5:2 g5 a5:2 c#5 | d5:6' },
      B: { chords: 'Bb | F | Gm | A', melody: 'f5:3 bb5:3 | a5:3 c6:2 a5 | bb5:3 a5 g5 f5 | e5:6' },
      D: { chords: 'Gm | Dm | Bb | A', melody: 'g5:3 bb5:3 | a5:3 f5:3 | d6:3 c6 bb5 a5 | a5:6', counter: 'd5:6 | f5:6 | f5:6 | e5:6', voices: { counter: 'flute' } },
    },
  },

  // Scylla's Reef: a sunny island syrtos in G, a fiddle with santouri and laouto, darbuka and riq.
  reef: {
    bpm: 116,
    voices: { lead: 'fiddle', counter: 'santouri', arp: 'laouto', bass: 'pickbass' },
    kit: 'hand',
    fx: { cutoff: 8500, echo: 3, fb: 0.25, wet: 0.2 },
    bass: '0.....2.0...2...',
    arp: 'c.....c.c...c...',
    drums: { k: 'x.......x.......', r: '......x.....x...', j: '..x...x...x...x.' },
    form: 'AABB',
    sections: {
      A: { chords: 'G | C | D | G', melody: 'd5 g5 b5 a5 g5:2 d5:2 | e5 g5 c6 b5 a5:2 g5:2 | f#5 a5 d6 c6 b5 a5 g5 f#5 | g5:6 . .' },
      B: {
        chords: 'Em | C | D | D',
        melody: 'b5:2 e6 d6 b5:2 g5:2 | c6:2 e6 d6 c6:2 a5:2 | d6 c6 b5 a5 f#5 g5 a5 f#5 | a5:4 f#5:4',
        counter: 'e5:4 g5:4 | e5:4 c5:4 | f#5:4 d5:4 | d5:8',
      },
    },
  },

  // Talos's Forge: a giant's stomp in G minor, low brass, an anvil on every beat, a big drum and a choir.
  forge: {
    bpm: 98,
    gain: 0.7,
    voices: { lead: 'brass', bass: 'dist', pad: 'choir' },
    kit: 'rock',
    fx: { cutoff: 4500, echo: 4, fb: 0.3, wet: 0.2 },
    bass: '0..0....0..0..3.',
    drums: { k: 'x.......x.......', b: 'x.......x.......', s: '........x.......', a: 'x...x...x...x...', h: '..x...x...x...x.' },
    form: 'AABB',
    sections: {
      A: { chords: 'Gm | Ab | Gm | F', melody: 'g4:3 bb4 d5:4 | eb5:3 c5 ab4:4 | d5:2 bb4 g4 d5:2 f5:2 | f5:3 eb5 d5:2 c5:2' },
      B: { chords: 'Eb | F | Gm | D', melody: 'g5:4 bb5:4 | a5:3 c6 a5:2 f5:2 | bb5:3 a5 g5:2 d5:2 | f#5:4 d5:2 a4:2' },
    },
  },

  // Medusa's Labyrinth: a pizzicato tiptoe in D Phrygian over a drone, long stone-hall echoes, a reed.
  labyrinth: {
    bpm: 92,
    gain: 1.1,
    voices: { lead: 'pizz', counter: 'reed', arp: 'glock', bass: 'pickbass', pad: 'drone' },
    kit: 'soft',
    drone: 'd3',
    fx: { cutoff: 5000, echo: 6, fb: 0.5, wet: 0.35 },
    bass: '0...2...0...2...',
    arp: '........................6.......',
    drums: { k: 'g.......g.......', r: '..g...g...g...g.' },
    form: 'AABB',
    sections: {
      A: { chords: 'Dm | Eb | Dm | Eb', melody: 'd5 . f5 . a5 . f5 . | g5 . eb5 . bb4 . eb5 . | d5 . a5 . f5 g5 a5 . | bb5 . g5 . eb5:2 . .' },
      B: {
        chords: 'Cm | Bb | Eb | D',
        melody: 'c5 . eb5 . g5 . eb5 . | bb4 . d5 . f5 . d5 . | eb5 . g5 . bb5 . g5 . | a5 . f#5 . d5:2 . .',
        counter: 'a5:6 g5:2 | f5:6 d5:2 | eb5:6 g5:2 | f#5:8',
      },
    },
  },

  // Brennus's Last Stand: the Mine's march made brave, a D major brass fanfare over a marching snare.
  stand: {
    bpm: 118,
    gain: 0.5,
    voices: { lead: 'brass', counter: 'strings', bass: 'tuba', pad: 'strings' },
    kit: 'march',
    fx: { cutoff: 9000, echo: 3, fb: 0.2, wet: 0.15 },
    fills: true,
    bass: '0...2...0...2...',
    drums: { k: 'x...x...x...x.x.', s: 'x.ggx.g.x.ggx.gg', b: 'x.......x.......' },
    form: 'ABAC',
    sections: {
      A: {
        chords: 'D | A | D | A | D | G | A | D',
        melody: 'a5:2 f#5 d5 a5:2 f#5 d5 | c#5:2 e5 g5 a5:4 | d6:2 c#6 b5 a5:2 g5 f#5 | e5:6 . . | a5:2 f#5 d5 a5:2 d6:2 | b5:3 a5 g5:2 d6:2 | c#6:2 b5 a5 g5:2 e5:2 | d5:6 . .',
      },
      B: {
        chords: 'Bm | G | Em | A',
        melody: 'f#5:4 b5:4 | d6:3 c#6 b5:2 g5:2 | e6:3 d6 b5:4 | a5:2 c#6 e6 a6:4',
        counter: 'd5:8 | b4:8 | g5:8 | e5:4 c#5:4',
      },
      // The march's trio, in G: a horn takes the tune.
      C: { chords: 'G | D | A | D', melody: 'd5:3 g5 b5:2 d6:2 | a5:3 f#5 d5:4 | e5:2 a5 c#6 e6:2 c#6:2 | d6:6 . .', voices: { lead: 'horn' } },
    },
  },

  // The Garden of Colchis: Lydian wonder in G, a flute over rippling harp and a soft choir.
  garden: {
    bpm: 92,
    gain: 0.48,
    voices: { lead: 'flute', arp: 'harp', bass: 'sub', pad: 'choir' },
    kit: 'soft',
    fx: { cutoff: 8000, echo: 3, fb: 0.4, wet: 0.35 },
    bass: '0-------0-------',
    arp: '0.2.3.5.4.3.2.3.',
    drums: { z: 'g...g...g...g...', r: '........g.......' },
    form: 'AABB',
    sections: {
      A: { chords: 'G | A | G | A', melody: 'd5:2 g5:2 a5:2 b5:2 | c#6:4 b5:2 a5:2 | b5:2 d6:2 g5:2 a5:2 | a5:6 . .' },
      B: { chords: 'Em | C | D | D', melody: 'g5:3 f#5 e5:2 b5:2 | e6:4 d6:2 c6:2 | a5:3 b5 a5:2 f#5:2 | d5:6 . .' },
    },
  },

  // The Golden Fleece: the tree-temple at twilight. A swaying kalamatianos (7/8, 3+2+2), bouzouki and choir.
  fleece: {
    bpm: 112,
    gain: 0.9,
    bar: 14,
    voices: { lead: 'bouzouki', counter: 'choir', arp: 'laouto', bass: 'pickbass', pad: 'choir' },
    kit: 'hand',
    fx: { cutoff: 8000, echo: 6, fb: 0.3, wet: 0.25 },
    bass: '0.....2...0...',
    arp: 'c.....c...c...',
    drums: { k: 'x.....x.......', r: '...g......x.x.', j: '..g.g.g.g.g.g.' },
    form: 'AABC',
    sections: {
      A: { chords: 'Dm | C | Bb | A', melody: 'd5:3 f5:2 a5:2 | g5:3 e5:2 c5:2 | f5 g5 a5 bb5:2 a5:2 | a5:3 c#5:2 e5:2' },
      B: { chords: 'F | C | Gm | A', melody: 'a5:3 c6:2 a5:2 | g5:3 e5:2 g5:2 | bb5:3 a5:2 g5:2 | e5:3 c#5:2 a4:2', counter: 'f4:7 | e4:7 | d4:7 | c#4:7' },
      C: {
        chords: 'Bb | C | Dm | Dm | Gm | C | A | A',
        melody: 'd6:3 c6:2 bb5:2 | c6:3 bb5:2 a5:2 | a5:3 f5:2 d5:2 | a5:7 | bb5:3 a5:2 g5:2 | g5:3 f5:2 e5:2 | e5:3 f5:2 g5:2 | a5:7',
        voices: { lead: 'santouri' },
      },
    },
  },

  /* ---------------- bosses: chapter 1 ---------------- */

  // FROST WARDEN: the ship's boss riff, cold, with glockenspiel and long echoes.
  warden: vary(SHIP_BOSS, { gain: 1.2, key: -2, bpm: 140, voices: { arp: 'glock' }, fx: { cutoff: 9000, fb: 0.45, wet: 0.3 } }),
  // VINE QUEEN: higher and swung, a marimba under a square lead.
  queen: vary(SHIP_BOSS, { key: 2, bpm: 138, swing: 0.25, voices: { lead: 'square', arp: 'marimba', bass: 'synbass' } }),
  // MAGMA GOLEM: lower and heavier, a distorted bass and guitar.
  golem: vary(SHIP_BOSS, { gain: 1.1, key: -4, bpm: 146, kit: 'rock', voices: { bass: 'dist', arp: 'guitar' } }),
  // KING BLOBLIN: bouncy and comic, a chiptune lead with organ, swung.
  bloblin: vary(SHIP_BOSS, { key: 5, bpm: 152, swing: 0.3, voices: { lead: 'square', arp: 'organ', bass: 'bass' } }),
  // CERBERUS: the security robot's version, brass over a whirring saw.
  wardog: vary(SHIP_BOSS, { gain: 1.2, key: 1, bpm: 150, voices: { lead: 'brass', arp: 'saw' }, fx: { echo: 2 } }),

  // THE HEART OF GASCU: an eerie choir in C# minor over a lub-dub heartbeat and plucked vines.
  heart: {
    bpm: 126,
    voices: { lead: 'choir', counter: 'choir', arp: 'pluck', bass: 'sub', pad: 'glass' },
    kit: 'electro',
    fx: { cutoff: 6000, echo: 3, fb: 0.4, wet: 0.3 },
    bass: '0..0....0..0....',
    arp: '0212041202120412',
    drums: { k: 'X..x....X..x....', s: '........x.......', h: 'gxggxgxggxgxggxg', z: '..x...x...x...x.' },
    form: 'AABB',
    sections: {
      A: { chords: 'C#m | A | F#m | G#', melody: 'g#5:4 e5:2 c#5:2 | a5:4 c#6:2 e5:2 | f#5:3 a5 c#6:2 b5 a5 | g#5:4 b#4:4' },
      B: {
        chords: 'A | B | C#m | G#',
        melody: 'e5:3 f#5 g#5:2 a5:2 | b5:3 a5 g#5:2 f#5:2 | e5:3 d#5 c#5:2 e5:2 | d#5:4 b#4:4',
        counter: 'c#5:8 | d#5:8 | e5:8 | d#5:8',
        voices: { lead: 'strings' },
      },
    },
  },

  // GASCU REBORN: the ship's last battle. Fast, huge, D minor: brass and choir over distorted bass and toms.
  reborn: {
    bpm: 152,
    gain: 0.7,
    voices: { lead: 'brass', counter: 'choir', arp: 'saw', bass: 'dist', pad: 'pad' },
    kit: 'rock',
    fx: { cutoff: 8000, echo: 3, fb: 0.3, wet: 0.2 },
    fills: true,
    bass: '0.00.00.0.00.0.0',
    arp: '0234023402340234',
    drums: { k: 'x.x.x.x.x.x.x.x.', s: '....x.......x...', h: 'xgxgxgxgxgxgxgxg', b: 'x.......x.......' },
    form: 'AABB',
    sections: {
      A: { chords: 'Dm | Bb | Gm | A', melody: 'd6:2 c6 a5 d6:2 e6 f6 | f6:2 d6:2 bb5:4 | g5:2 bb5:2 d6:3 c6 | a5:4 c#6:4' },
      B: { chords: 'Bb | C | Dm | A', melody: 'f6:3 e6 d6:2 bb5:2 | e6:3 d6 c6:2 g5:2 | a5:3 d6 f6:4 | e6:4 c#6:4', counter: 'd5:8 | e5:8 | f5:8 | e5:8' },
    },
  },

  /* ---------------- bosses: chapter 2 ---------------- */

  // THE THRESHER: Gaia's boss rock with a horn and plucked strings.
  thresher: vary(GAIA_BOSS, { gain: 0.75, key: 3, bpm: 146, voices: { lead: 'horn', arp: 'pluck' } }),
  // THE DUNE DRILLER: a saw lead and western twang.
  driller: vary(GAIA_BOSS, { key: 5, bpm: 150, voices: { lead: 'saw', arp: 'twang' } }),
  // BOREAS: icy strings, a glockenspiel and a choir.
  boreas: vary(GAIA_BOSS, { key: -2, bpm: 144, voices: { lead: 'strings', arp: 'glock', pad: 'choir' }, fx: { echo: 4, fb: 0.4, wet: 0.25 } }),
  // STHENO: the gunship, fastest and loudest, all distortion.
  stheno: vary(GAIA_BOSS, { bpm: 156, voices: { bass: 'dist' } }),
  // THE THORN HYDRA: hand drums and a marimba under a saw lead.
  hydra: vary(GAIA_BOSS, { key: -4, bpm: 150, kit: 'hand', voices: { lead: 'saw', arp: 'marimba' } }),

  // SHADOW LUX: LUX's own four notes turned dark. A glitchy chiptune in E minor with stuttering echoes.
  rogue: {
    bpm: 138,
    gain: 1.2,
    unit: 1,
    voices: { lead: 'square', arp: 'pluck', bass: 'synbass', pad: 'pad' },
    kit: 'electro',
    fx: { cutoff: 6500, echo: 3, fb: 0.5, wet: 0.3 },
    bass: '0..0..0..0..0.0.',
    arp: '0.3.0.3.0.3.0.3.',
    drums: { k: 'x..x..x...x..x..', c: '....x.......x...', h: 'gxggxgxggxgxggxg' },
    form: 'AABB',
    sections: {
      A: {
        chords: 'Em | F | Em | B',
        melody: 'e5 . g5 . b5 . e6 . e6 e6 . b5 g5 . e5 . | f5 . a5 . c6 . f6 . f6 f6 . c6 a5 . f5 . | e6 d6 b5 g5 e6 d6 b5 g5 e6:2 . . b5:2 g5:2 | f#5:4 d#5:4 b4:8',
      },
      B: {
        chords: 'C | D | Em | B',
        melody: 'e5:4 . g5 . e5 c5:4 . . g4:2 | f#5:4 . a5 . f#5 d5:4 . . a4:2 | g5:2 f#5:2 e5:2 b5:2 g5:2 e6:2 b5:2 g5:2 | b4:2 d#5:2 f#5:2 b5:2 d#6:4 . . . .',
      },
    },
  },

  // THE COLOSSUS: Brennus's war machine. A C minor march on taiko drums, a machine-gun bass, brass and choir.
  colossus: {
    bpm: 136,
    gain: 0.57,
    voices: { lead: 'brass', counter: 'choir', bass: 'dist', pad: 'choir' },
    kit: 'rock',
    fx: { cutoff: 6500, echo: 3, fb: 0.25, wet: 0.15 },
    fills: true,
    bass: '0000000000003020',
    drums: { k: 'x...x...x...x...', b: 'X..x..x.X..x..x.', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
    form: 'AABB',
    sections: {
      A: { chords: 'Cm | Ab | Fm | G', melody: 'c5:3 c5 eb5:2 g5:2 | ab5:3 g5 f5:2 eb5:2 | f5:3 ab5 c6:2 bb5 ab5 | g5:4 b4:4' },
      B: { chords: 'Cm | Bb | Ab | G', melody: 'g5:2 c6:2 eb6:4 | d6:2 bb5:2 f5:4 | eb6:3 d6 c6:2 ab5:2 | b5:4 d6:2 g6:2', counter: 'c5:8 | d5:8 | c5:8 | b4:8' },
    },
  },

  /* ---------------- bosses: chapter 3 ---------------- */

  // AELLO: the Harpy Queen's battle dance, higher, a shrieking aulos.
  aello: vary(MYTH_BOSS, { key: 5, bpm: 172, voices: { lead: 'aulos', counter: 'flute' } }),
  // THE GOLD EXCAVATOR: brass and klarino over the marching snare (Brennus's fight).
  excavator: vary(MYTH_BOSS, { bpm: 164, kit: 'march', voices: { lead: 'brass', counter: 'reed', bass: 'tuba' } }),
  // SCYLLA: a fiddle and santouri at sea.
  scylla: vary(MYTH_BOSS, { key: 3, bpm: 168, voices: { lead: 'fiddle', arp: 'santouri' } }),
  // THE GOLDEN RAM: the fastest, brass and bouzouki over a march (Brennus again).
  ram: vary(MYTH_BOSS, { key: -2, bpm: 176, kit: 'march', voices: { lead: 'brass', counter: 'bouzouki', bass: 'tuba' } }),

  // THE SIREN ORGAN: a D minor toccata on the pipe organ itself, pedal notes, a siren choir and timpani.
  organ: {
    bpm: 128,
    gain: 0.82,
    voices: { lead: 'pipe', arp: 'pipe', bass: 'pipe', pad: 'choir' },
    kit: 'soft',
    fx: { cutoff: 7000, echo: 4, fb: 0.35, wet: 0.3 },
    bass: '0-------0---2---',
    arp: '0125212501252125',
    drums: { b: 'x.......x.......', k: 'x...............', z: '..g...g...g...g.' },
    form: 'AABB',
    sections: {
      A: { chords: 'Dm | A | Dm | A', melody: 'd6:2 a5 f5 d5:2 a5:2 | c#6:2 e6 c#6 a5:2 e5:2 | f6:2 e6 d6 a5:2 f5:2 | e5:4 c#5:4' },
      B: { chords: 'Gm | Dm | A | Dm', melody: 'g5:2 bb5 d6 g6:4 | f6:2 e6 d6 a5:4 | e6:2 c#6 a5 g5:2 e5:2 | d5:6 . .' },
    },
  },

  // TALOS: the bronze giant stomps in 5/4 (3+2), anvils on every beat, distorted bass, brass and choir.
  talos: {
    bpm: 116,
    gain: 0.86,
    bar: 20,
    voices: { lead: 'brass', bass: 'dist', pad: 'choir' },
    kit: 'rock',
    fx: { cutoff: 5000, echo: 4, fb: 0.3, wet: 0.2 },
    fills: true,
    bass: '0..00..00...0..02...',
    drums: { k: 'x.......x...x.......', b: 'X...........X.......', a: 'x...x...x...x...x...', s: '........x.......x...', h: '..x...x...x...x...x.' },
    form: 'AABB',
    sections: {
      A: { chords: 'Gm | Ab | Gm | D', melody: 'g4:3 g4 bb4:2 d5:2 g5:2 | ab5:3 g5 f5:2 eb5:2 c5:2 | d5:3 eb5 d5:2 bb4:2 g4:2 | f#5:4 d5:2 a4:4' },
      B: { chords: 'Eb | Cm | Ab | D', melody: 'g5:3 bb5 eb6:6 | c6:3 bb5 g5:2 eb5:4 | ab5:3 g5 f5:2 eb5:2 c5:2 | d5:4 f#5:2 a5:4' },
    },
  },

  // MEDUSA: a snake-charmer's aulos in D Hijaz over a drone, darbuka and riq, sliding between notes.
  medusa: {
    bpm: 132,
    voices: { lead: 'aulos', arp: 'pizz', bass: 'synbass', pad: 'drone' },
    kit: 'hand',
    drone: 'd3',
    fx: { cutoff: 6000, echo: 3, fb: 0.4, wet: 0.3 },
    bass: '0..0..0.0..0..0.',
    arp: '0.1.0.2.0.1.0.2.',
    drums: { k: 'x.....x...x.....', r: '..x.x..g..x.x.x.', j: 'gxgxgxgxgxgxgxgx', b: 'x...............' },
    form: 'AABB',
    sections: {
      A: { chords: 'D | Eb | Cm | D', melody: 'd5:2 eb5 f#5 g5:2 f#5 eb5 | eb5:3 d5 eb5 f#5 g5:2 | a5:2 bb5 a5 g5:2 f#5 eb5 | d5:6 . .' },
      B: { chords: 'Gm | D | Eb | D', melody: 'bb5:3 a5 g5:2 d6:2 | c6:2 bb5 a5 ~f#5:4 | bb5:2 g5 eb5 f#5:2 g5:2 | a5:2 f#5:2 d5:4' },
    },
  },

  // THE SLEEPLESS DRAGON: a tense lullaby in 6/8, a music box over a slow lub-dub heartbeat, a hummed choir.
  dragon: {
    bpm: 108,
    gain: 0.74,
    bar: 12,
    voices: { lead: 'musicbox', counter: 'choir', arp: 'harp', bass: 'sub', pad: 'strings' },
    kit: 'soft',
    fx: { cutoff: 6000, echo: 6, fb: 0.45, wet: 0.35 },
    bass: '0-----2-----',
    arp: '..2..3..2..3',
    drums: { k: 'x.g...x.g...', b: 'g.......................' },
    form: 'AABB',
    sections: {
      A: { chords: 'Em | C | Am | B', melody: 'b5:2 g5 e5:2 g5 | c6:2 g5 e5:2 g5 | a5:2 c6 e6:2 c6 | b5:4 . .' },
      B: { chords: 'Em | Cm | Am | B7', melody: 'e6:3 d6:2 b5 | eb6:3 d6:2 c6 | c6:2 b5 a5:2 e5 | d#5:3 f#5:2 a5', counter: 'g4:6 | g4:6 | e4:6 | f#4:6' },
    },
  },

  // AEËTES, THE GOLDEN KING: the title's tune as a battle hymn, brass and choir, then bouzouki in E Hijaz.
  goldenking: {
    bpm: 152,
    gain: 0.68,
    voices: { lead: 'brass', counter: 'brass', arp: 'pizz', bass: 'dist', pad: 'choir' },
    kit: 'rock',
    fx: { cutoff: 8000, echo: 3, fb: 0.25, wet: 0.15 },
    fills: true,
    bass: '0.00.0.20.00.0.3',
    arp: '0202030302020303',
    drums: { k: 'x.x.x.x.x.x.x.x.', s: '....x.......x.xx', h: 'xgxgxgxgxgxgxgxg', b: 'x.......x.......' },
    form: 'AABB',
    sections: {
      A: { chords: 'Am | F | G | E', melody: 'a5:3 e6 e6:2 d6 c6 | c6:2 a5:2 f6:4 | d6:3 c6 b5:2 g5:2 | g#5:4 b5:4' },
      B: {
        chords: 'E | F | Dm | E',
        melody: 'e5:2 f5 g#5 b5:2 a5 g#5 | a5:2 c6 a5 f5:2 e5 f5 | d6:2 c6 b5 a5:2 g#5 f5 | e5:6 . .',
        counter: 'b4:8 | c5:8 | a4:8 | g#4:8',
        voices: { lead: 'bouzouki' },
      },
    },
  },
} satisfies Record<string, Song>;

export type Track = keyof typeof ALL_SONGS;

export const SONGS: Record<Track, Song> = ALL_SONGS;

/* ---------------- reading the notation ---------------- */

export interface Chord {
  /** MIDI root, C3 to B3. */
  root: number;
  /** Semitones above the root. */
  iv: number[];
}

export interface Note {
  m: number;
  /** Length in steps. */
  len: number;
  /** Slides in from this note. */
  from?: number;
}

export interface Pattern {
  s: string;
  /** Each struck step's length (a step plus the '-' holds after it). */
  len: number[];
}

/** One section where it falls in the song. */
export interface Part {
  id: string;
  start: number;
  steps: number;
  /** The chord at each step, and how long a chord that starts there lasts (0 elsewhere). */
  chord: Chord[];
  change: number[];
  melody: (Note | undefined)[] | null;
  counter: (Note | undefined)[] | null;
  bass: Pattern | null;
  arp: Pattern | null;
  drums: [Lane, string][];
  voices: Voices;
  bare: boolean;
}

export interface Compiled {
  name: string;
  song: Song;
  bar: number;
  /** Steps in one time round the form. */
  steps: number;
  parts: Part[];
  drone: number | null;
}

const PC: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };

const QUALITY: Record<string, number[]> = {
  '': [0, 4, 7],
  m: [0, 3, 7],
  '7': [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  M7: [0, 4, 7, 11],
  sus: [0, 5, 7],
  sus2: [0, 2, 7],
  '5': [0, 7, 12],
  dim: [0, 3, 6],
  '+': [0, 4, 8],
  '6': [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
};

/** 'c#5' → 73. */
export function noteNumber(s: string): number {
  const m = /^([a-g])(#|b)?(-?\d)$/.exec(s);
  if (!m) throw new Error(`not a note: ${s}`);
  return 12 * (Number(m[3]) + 1) + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}

function parseChord(s: string, key: number): Chord {
  const m = /^([A-G])(#|b)?(.*)$/.exec(s);
  const iv = m ? QUALITY[m[3]] : undefined;
  if (!m || !iv) throw new Error(`not a chord: ${s}`);
  const pc = PC[m[1].toLowerCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + key;
  return { root: 48 + (((pc % 12) + 12) % 12), iv };
}

/** The pitch (semitones over the root) of a pattern character on a chord. */
export function chordTone(c: Chord, ch: string): number {
  const iv = c.iv;
  switch (ch) {
    case '0':
      return 0;
    case '1':
      return iv[1];
    case '2':
      return iv[2];
    case '3':
      return 12;
    case '4':
      return iv.length > 3 ? iv[3] : 14;
    case '5':
      return iv[1] + 12;
    case '6':
      return iv[2] + 12;
    default:
      return iv[2] - 12;
  }
}

function parseLine(name: string, s: string, steps: number, unit: number, bar: number, key: number): (Note | undefined)[] {
  const out: (Note | undefined)[] = new Array(steps).fill(undefined);
  let pos = 0;
  let prev: number | undefined;
  for (const tok of s.split(/\s+/)) {
    if (!tok) continue;
    if (tok === '|') {
      if (pos % bar !== 0) throw new Error(`${name}: a bar line at step ${pos}, not on a bar`);
      continue;
    }
    const [body, n] = tok.split(':');
    const len = (n ? Number(n) : 1) * unit;
    if (!Number.isInteger(len) || len <= 0) throw new Error(`${name}: bad length in ${tok}`);
    const slide = body.startsWith('~');
    const note = slide ? body.slice(1) : body;
    if (note !== '.') {
      const m = noteNumber(note) + key;
      if (pos < steps) out[pos] = { m, len, from: slide ? prev : undefined };
      prev = m;
    }
    pos += len;
  }
  if (pos !== steps) throw new Error(`${name}: the tune is ${pos} steps long, its section ${steps}`);
  return out;
}

function parsePattern(name: string, s: string | undefined): Pattern | null {
  if (!s) return null;
  if (!/^[0-7c.-]+$/.test(s)) throw new Error(`${name}: bad pattern ${s}`);
  const len = [...s].map((_, i) => {
    let n = 1;
    while (s[i + n] === '-') n += 1;
    return n;
  });
  return { s, len };
}

/** Reads a song's notation into the per-step form the player uses (and checks it: the tests run this on every song). */
export function compileSong(name: string, song: Song): Compiled {
  const bar = song.bar ?? 16;
  const unit = song.unit ?? 2;
  const key = song.key ?? 0;
  const built = new Map<string, Omit<Part, 'start'>>();
  const parts: Part[] = [];
  let start = 0;
  for (const id of song.form) {
    let p = built.get(id);
    if (!p) {
      const sec = song.sections[id];
      if (!sec) throw new Error(`${name}: no section ${id}`);
      const where = `${name} ${id}`;
      const bars = sec.chords.split('|').map((b) => b.trim().split(/\s+/));
      const steps = bars.length * bar;
      const chord: Chord[] = [];
      const change: number[] = new Array(steps).fill(0);
      bars.forEach((names, b) => {
        if (bar % names.length) throw new Error(`${where}: can't split a bar into ${names.length} chords`);
        const each = bar / names.length;
        names.forEach((n, i) => {
          const c = parseChord(n, key);
          change[b * bar + i * each] = each;
          for (let k = 0; k < each; k++) chord.push(c);
        });
      });
      const drums = Object.entries(sec.drums ?? song.drums ?? {}) as [Lane, string][];
      for (const [lane, pat] of drums) if (!/^[xXg.]+$/.test(pat)) throw new Error(`${where}: bad drum lane ${lane}`);
      p = {
        id,
        steps,
        chord,
        change,
        melody: sec.melody ? parseLine(where, sec.melody, steps, unit, bar, key) : null,
        counter: sec.counter ? parseLine(`${where} counter`, sec.counter, steps, unit, bar, key) : null,
        bass: parsePattern(where, sec.bass ?? song.bass),
        arp: parsePattern(where, sec.arp ?? song.arp),
        drums,
        voices: { ...song.voices, ...sec.voices },
        bare: !!sec.bare,
      };
      built.set(id, p);
    }
    parts.push({ ...p, start });
    start += p.steps;
  }
  return { name, song, bar, steps: start, parts, drone: song.drone ? noteNumber(song.drone) + key : null };
}
