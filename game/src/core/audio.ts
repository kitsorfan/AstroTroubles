export type Sfx =
  | 'jump'
  | 'djump'
  | 'land'
  | 'shoot'
  | 'hit'
  | 'pop'
  | 'bolt'
  | 'heart'
  | 'hurt'
  | 'dash'
  | 'pound'
  | 'spin'
  | 'door'
  | 'checkpoint'
  | 'fail'
  | 'success'
  | 'roar'
  | 'explode'
  | 'bounce'
  | 'vent'
  | 'zap'
  | 'shard'
  | 'upgrade'
  | 'select'
  | 'blip'
  | 'enemyShoot'
  | 'break'
  | 'glide'
  | 'shield'
  | 'pulse'
  | 'reload'
  | 'empty'
  | 'charge'
  | 'charged'
  | 'fireball'
  | 'alarm'
  | 'sputter'
  | 'tone0'
  | 'tone1'
  | 'tone2'
  | 'tone3';

export type Track = 'title' | 'cryo' | 'hydro' | 'engine' | 'habitat' | 'security' | 'bridge' | 'plains' | 'desert' | 'snow' | 'rockies' | 'jungle' | 'volcano' | 'boss' | 'ending';

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

interface Song {
  bpm: number;
  /** One chord (MIDI root + quality) per bar. */
  chords: [number, 'maj' | 'min' | 'sus'][];
  bass: string;
  arp: string;
  drums: { k: string; s: string; h: string };
  lead: 'tri' | 'square' | 'bell';
  padLevel: number;
}

// Pattern strings are 16 steps per bar. Digits pick chord tones (0 root, 1 third, 2 fifth, 3 octave), '.' rests.
const SONGS: Record<Track, Song> = {
  title: {
    bpm: 84,
    chords: [
      [57, 'min'],
      [53, 'maj'],
      [48, 'maj'],
      [55, 'maj'],
    ],
    bass: '0.......0.......',
    arp: '0.1.2.3.2.1.0...',
    drums: { k: '................', s: '................', h: '........x.......' },
    lead: 'bell',
    padLevel: 0.9,
  },
  cryo: {
    bpm: 100,
    chords: [
      [52, 'min'],
      [48, 'maj'],
      [55, 'maj'],
      [50, 'maj'],
    ],
    bass: '0...0...0...0.2.',
    arp: '3.2.1.2.3.2.1.0.',
    drums: { k: 'x.......x.......', s: '....x.......x...', h: '..x...x...x...x.' },
    lead: 'bell',
    padLevel: 0.7,
  },
  hydro: {
    bpm: 112,
    chords: [
      [50, 'min'],
      [46, 'maj'],
      [53, 'maj'],
      [48, 'maj'],
    ],
    bass: '0..0..2.0..0.2..',
    arp: '0.2.1.3.0.2.1.3.',
    drums: { k: 'x..x....x..x....', s: '....x.......x..x', h: 'x.x.x.x.x.x.x.x.' },
    lead: 'tri',
    padLevel: 0.5,
  },
  engine: {
    bpm: 120,
    chords: [
      [45, 'min'],
      [45, 'min'],
      [41, 'maj'],
      [40, 'maj'],
    ],
    bass: '0.0.0.0.0.0.2.3.',
    arp: '0...2...1...3...',
    drums: { k: 'x...x...x...x...', s: '....x.......x...', h: '.x.x.x.x.x.x.x.x' },
    lead: 'square',
    padLevel: 0.45,
  },
  habitat: {
    bpm: 108,
    chords: [
      [48, 'maj'],
      [45, 'min'],
      [41, 'maj'],
      [43, 'maj'],
    ],
    bass: '0...2...0.0.2...',
    arp: '0.1.2.1.3.2.1.2.',
    drums: { k: 'x.......x.x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
    lead: 'tri',
    padLevel: 0.55,
  },
  security: {
    bpm: 126,
    chords: [
      [48, 'min'],
      [44, 'maj'],
      [46, 'maj'],
      [43, 'maj'],
    ],
    bass: '00.000.000.000.2',
    arp: '0123012301230123',
    drums: { k: 'x..x..x.x..x..x.', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx' },
    lead: 'square',
    padLevel: 0.4,
  },
  bridge: {
    bpm: 116,
    chords: [
      [50, 'min'],
      [46, 'maj'],
      [48, 'maj'],
      [45, 'maj'],
    ],
    bass: '0...0.0.2...0...',
    arp: '3.2.1.0.1.2.3.2.',
    drums: { k: 'x.......x..x....', s: '....x.......x...', h: '..x...x...x...x.' },
    lead: 'bell',
    padLevel: 0.8,
  },
  /* Gaia Nova. */
  // Open fields: a bright, bouncy major tune.
  plains: {
    bpm: 104,
    chords: [
      [50, 'maj'],
      [55, 'maj'],
      [57, 'maj'],
      [47, 'min'],
    ],
    bass: '0...2...0...2.0.',
    arp: '0.2.3.2.1.2.3.2.',
    drums: { k: 'x.......x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
    lead: 'tri',
    padLevel: 0.8,
  },
  // Hot sand and old ruins: a dusty minor sway with a lazy beat.
  desert: {
    bpm: 96,
    chords: [
      [52, 'min'],
      [53, 'maj'],
      [52, 'min'],
      [50, 'maj'],
    ],
    bass: '0..0..0.2..0..0.',
    arp: '0.1.2.1.3.2.1.0.',
    drums: { k: 'x..x....x..x....', s: '........x.......', h: '..x...x...x...x.' },
    lead: 'bell',
    padLevel: 0.7,
  },
  // A slow, glittering blizzard.
  snow: {
    bpm: 88,
    chords: [
      [45, 'min'],
      [41, 'maj'],
      [48, 'maj'],
      [43, 'maj'],
    ],
    bass: '0.......0...2...',
    arp: '3...2...1...2...',
    drums: { k: 'x...............', s: '........x.......', h: '....x.......x...' },
    lead: 'bell',
    padLevel: 1,
  },
  // Climbing music: steady and heroic.
  rockies: {
    bpm: 118,
    chords: [
      [48, 'maj'],
      [52, 'min'],
      [53, 'maj'],
      [55, 'maj'],
    ],
    bass: '0.0.0.2.0.0.2.3.',
    arp: '0.2.3.2.0.2.3.2.',
    drums: { k: 'x...x...x...x.x.', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
    lead: 'tri',
    padLevel: 0.6,
  },
  // Drums in the undergrowth.
  jungle: {
    bpm: 110,
    chords: [
      [50, 'min'],
      [48, 'maj'],
      [46, 'maj'],
      [45, 'sus'],
    ],
    bass: '0..0.0..2..0.2..',
    arp: '0.1.0.2.0.1.0.3.',
    drums: { k: 'x..x..x...x..x..', s: '....x..x....x...', h: 'xxx.xxx.xxx.xxx.' },
    lead: 'tri',
    padLevel: 0.6,
  },
  // The fortress in the volcano: fast, dark and driving.
  volcano: {
    bpm: 132,
    chords: [
      [45, 'min'],
      [46, 'maj'],
      [45, 'min'],
      [44, 'maj'],
    ],
    bass: '0.00.0.00.0.0200',
    arp: '0.2.3.2.0.2.1.2.',
    drums: { k: 'x.x.x.x.x.x.x.x.', s: '....x.......x.x.', h: 'x.xxx.xxx.xxx.xx' },
    lead: 'square',
    padLevel: 0.5,
  },
  boss: {
    bpm: 144,
    chords: [
      [52, 'min'],
      [48, 'maj'],
      [50, 'maj'],
      [47, 'maj'],
    ],
    bass: '0.00.00.0.00.020',
    arp: '0.2.3.2.0.2.3.2.',
    drums: { k: 'x.x.x.x.x.x.x.x.', s: '....x.......x.xx', h: 'x.xxx.xxx.xxx.xx' },
    lead: 'square',
    padLevel: 0.5,
  },
  ending: {
    bpm: 76,
    chords: [
      [53, 'maj'],
      [55, 'maj'],
      [52, 'min'],
      [57, 'min'],
    ],
    bass: '0.......2.......',
    arp: '0...1...2...3...',
    drums: { k: '................', s: '................', h: '................' },
    lead: 'bell',
    padLevel: 1,
  },
};

function chordNotes(root: number, q: 'maj' | 'min' | 'sus'): number[] {
  const third = q === 'maj' ? 4 : q === 'min' ? 3 : 5;
  return [root, root + third, root + 7, root + 12];
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxBus!: GainNode;
  private musicBus!: GainNode;
  private noise!: AudioBuffer;
  private track: Track | null = null;
  private wanted: Track | null = null;
  private step = 0;
  private nextTime = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastPlay = new Map<Sfx, number>();
  musicVolume = 0.55;
  sfxVolume = 0.8;

  /** Must be called from a user gesture on mobile. */
  unlock() {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      this.master.connect(comp).connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain();
      this.musicBus = this.ctx.createGain();
      this.sfxBus.connect(this.master);
      this.musicBus.connect(this.master);
      this.applyVolumes();
      const len = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.timer = setInterval(() => this.schedule(), 25);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    if (this.wanted !== this.track) this.music(this.wanted);
  }

  suspend(on: boolean) {
    if (!this.ctx) return;
    if (on) void this.ctx.suspend();
    else void this.ctx.resume();
  }

  setVolumes(music: number, sfx: number) {
    this.musicVolume = music;
    this.sfxVolume = sfx;
    this.applyVolumes();
  }

  private applyVolumes() {
    if (!this.ctx) return;
    this.musicBus.gain.value = this.musicVolume * 0.42;
    this.sfxBus.gain.value = this.sfxVolume;
  }

  /* ---------------- building blocks ---------------- */

  private env(g: GainNode, t: number, a: number, d: number, peak: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  private tone(t: number, type: OscillatorType, f0: number, f1: number, dur: number, vol: number, bus: GainNode, attack = 0.005) {
    const ctx = this.ctx as AudioContext;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    this.env(g, t, attack, dur, vol);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + attack + dur + 0.05);
  }

  private hiss(t: number, dur: number, vol: number, type: BiquadFilterType, f0: number, f1: number, bus: GainNode, attack = 0.003) {
    const ctx = this.ctx as AudioContext;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const filt = ctx.createBiquadFilter();
    filt.type = type;
    filt.frequency.setValueAtTime(f0, t);
    filt.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
    filt.Q.value = type === 'bandpass' ? 1.6 : 0.7;
    const g = ctx.createGain();
    this.env(g, t, attack, dur, vol);
    src.connect(filt).connect(g).connect(bus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + attack + dur + 0.05);
  }

  /** Plays a sound effect. `volume` below 1 is for sounds out in the world, quieter the further away they are. */
  play(name: Sfx, pitch = 1, volume = 1) {
    if (!this.ctx || this.ctx.state !== 'running' || volume < 0.02) return;
    const now = this.ctx.currentTime;
    const last = this.lastPlay.get(name) ?? 0;
    if (now - last < 0.035) return;
    this.lastPlay.set(name, now);
    let b = this.sfxBus;
    if (volume < 0.999) {
      b = this.ctx.createGain();
      b.gain.value = volume;
      b.connect(this.sfxBus);
    }
    const t = now + 0.005;
    const p = pitch;
    switch (name) {
      case 'jump':
        this.tone(t, 'square', 320 * p, 640 * p, 0.12, 0.12, b);
        break;
      case 'djump':
        this.tone(t, 'triangle', 480 * p, 1100 * p, 0.16, 0.2, b);
        this.hiss(t, 0.18, 0.12, 'highpass', 3000, 6000, b);
        break;
      case 'land':
        this.hiss(t, 0.08, 0.18, 'lowpass', 900, 200, b);
        break;
      case 'shoot':
        this.tone(t, 'square', 1100 * p, 280 * p, 0.09, 0.1, b);
        this.tone(t, 'sine', 1600 * p, 600 * p, 0.06, 0.08, b);
        break;
      case 'hit':
        this.hiss(t, 0.07, 0.35, 'bandpass', 2400, 900, b);
        this.tone(t, 'sine', 220, 90, 0.09, 0.25, b);
        break;
      case 'pop':
        this.tone(t, 'sine', 500 * p, 1300 * p, 0.12, 0.3, b);
        this.hiss(t, 0.15, 0.2, 'bandpass', 3000, 1200, b);
        break;
      case 'bolt':
        this.tone(t, 'sine', midi(88) * p, midi(88) * p, 0.06, 0.13, b);
        this.tone(t + 0.05, 'sine', midi(95) * p, midi(95) * p, 0.1, 0.12, b);
        break;
      case 'heart':
        [72, 76, 79, 84].forEach((n, i) => this.tone(t + i * 0.06, 'triangle', midi(n), midi(n), 0.12, 0.2, b));
        break;
      case 'hurt':
        this.tone(t, 'sawtooth', 380, 110, 0.28, 0.2, b);
        this.hiss(t, 0.15, 0.25, 'lowpass', 2000, 300, b);
        break;
      case 'dash':
        this.hiss(t, 0.22, 0.3, 'bandpass', 800, 4000, b);
        break;
      case 'pound':
        this.tone(t, 'sine', 170, 38, 0.35, 0.6, b);
        this.hiss(t, 0.3, 0.35, 'lowpass', 1500, 120, b);
        break;
      case 'spin':
        this.hiss(t, 0.3, 0.25, 'bandpass', 600, 2600, b, 0.03);
        break;
      case 'door':
        this.tone(t, 'sawtooth', 90, 180, 0.4, 0.1, b, 0.05);
        this.hiss(t, 0.4, 0.12, 'lowpass', 400, 1600, b, 0.05);
        break;
      case 'checkpoint':
        [72, 76, 79, 84, 88].forEach((n, i) => this.tone(t + i * 0.07, 'triangle', midi(n), midi(n), 0.2, 0.18, b));
        break;
      case 'fail':
        this.tone(t, 'square', 220, 150, 0.35, 0.14, b);
        break;
      case 'success':
        [67, 72, 76, 79].forEach((n, i) => this.tone(t + i * 0.08, 'square', midi(n), midi(n), 0.14, 0.1, b));
        this.tone(t + 0.32, 'triangle', midi(84), midi(84), 0.4, 0.2, b);
        break;
      case 'roar':
        this.tone(t, 'sawtooth', 130, 55, 0.9, 0.22, b, 0.08);
        this.tone(t, 'sawtooth', 137, 58, 0.9, 0.18, b, 0.08);
        this.hiss(t, 0.9, 0.2, 'lowpass', 800, 200, b, 0.1);
        break;
      case 'explode':
        this.hiss(t, 0.7, 0.55, 'lowpass', 2400, 90, b);
        this.tone(t, 'sine', 140, 30, 0.6, 0.5, b);
        break;
      case 'bounce':
        this.tone(t, 'sine', 180, 760, 0.28, 0.35, b);
        this.tone(t, 'triangle', 360, 1500, 0.2, 0.12, b);
        break;
      case 'vent':
        this.hiss(t, 0.7, 0.18, 'highpass', 1200, 3000, b, 0.05);
        break;
      case 'zap':
        this.tone(t, 'square', 1800 * p, 300 * p, 0.16, 0.08, b);
        this.hiss(t, 0.12, 0.12, 'highpass', 5000, 2000, b);
        break;
      case 'shard':
        [84, 88, 91, 96].forEach((n, i) => {
          this.tone(t + i * 0.09, 'sine', midi(n), midi(n), 0.5, 0.18, b);
          this.tone(t + i * 0.09, 'sine', midi(n + 12), midi(n + 12), 0.3, 0.05, b);
        });
        break;
      case 'upgrade':
        [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => this.tone(t + i * 0.07, 'square', midi(n), midi(n), 0.16, 0.08, b));
        this.tone(t + 0.5, 'triangle', midi(84), midi(84), 0.8, 0.22, b);
        break;
      case 'select':
        this.tone(t, 'square', 880, 880, 0.05, 0.07, b);
        break;
      case 'blip':
        this.tone(t, 'square', 620 * p, 620 * p, 0.03, 0.035, b);
        break;
      case 'enemyShoot':
        this.tone(t, 'sine', 600, 200, 0.18, 0.12, b);
        break;
      case 'break':
        this.hiss(t, 0.22, 0.4, 'bandpass', 1400, 500, b);
        this.tone(t, 'triangle', 300, 120, 0.15, 0.15, b);
        break;
      case 'glide':
        this.hiss(t, 0.25, 0.08, 'bandpass', 1200, 900, b, 0.05);
        break;
      case 'shield':
        this.tone(t, 'sine', 300, 900, 0.35, 0.2, b, 0.03);
        this.tone(t, 'triangle', 450, 1350, 0.35, 0.08, b, 0.03);
        break;
      case 'pulse':
        // A deep thump, a rush of air and a rising electric shimmer.
        this.tone(t, 'sine', 120, 34, 0.6, 0.7, b);
        this.hiss(t, 0.55, 0.4, 'lowpass', 3200, 150, b);
        this.tone(t + 0.02, 'sawtooth', 220, 1760, 0.4, 0.07, b, 0.02);
        this.hiss(t + 0.05, 0.35, 0.16, 'highpass', 4000, 9000, b, 0.02);
        break;
      case 'reload':
        this.tone(t, 'square', 260, 520, 0.05, 0.08, b);
        this.hiss(t + 0.08, 0.06, 0.18, 'bandpass', 3000, 2000, b);
        this.tone(t + 0.16, 'square', 700, 700, 0.04, 0.09, b);
        break;
      case 'empty':
        this.tone(t, 'square', 180, 160, 0.04, 0.08, b);
        this.hiss(t, 0.03, 0.12, 'bandpass', 2500, 2500, b);
        break;
      case 'charge':
        this.tone(t, 'sawtooth', 160, 900, 0.75, 0.06, b, 0.05);
        this.tone(t, 'sine', 320, 1800, 0.75, 0.08, b, 0.05);
        break;
      case 'charged':
        this.tone(t, 'triangle', 1400, 1400, 0.12, 0.12, b);
        this.tone(t + 0.07, 'triangle', 1870, 1870, 0.16, 0.1, b);
        break;
      case 'fireball':
        this.tone(t, 'sawtooth', 420, 90, 0.45, 0.22, b);
        this.hiss(t, 0.5, 0.4, 'lowpass', 3000, 300, b);
        break;
      case 'sputter':
        // A soft electrical crackle (not a blaster "pew": no falling pitch).
        this.hiss(t, 0.05, 0.1, 'highpass', 4000, 4000, b);
        this.hiss(t + 0.06, 0.03, 0.06, 'highpass', 6000, 6000, b);
        break;
      case 'alarm':
        for (let i = 0; i < 3; i++) {
          this.tone(t + i * 0.26, 'square', 880, 660, 0.22, 0.09, b);
        }
        break;
      case 'tone0':
      case 'tone1':
      case 'tone2':
      case 'tone3': {
        const n = [64, 68, 71, 76][Number(name.slice(4))];
        this.tone(t, 'triangle', midi(n), midi(n), 0.35, 0.28, b);
        this.tone(t, 'sine', midi(n + 12), midi(n + 12), 0.25, 0.08, b);
        break;
      }
    }
  }

  /* ---------------- music ---------------- */

  music(track: Track | null) {
    this.wanted = track;
    if (!this.ctx || track === this.track) return;
    this.track = track;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.12;
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || !this.track || ctx.state !== 'running') return;
    const song = SONGS[this.track];
    const stepDur = 60 / song.bpm / 4;
    while (this.nextTime < ctx.currentTime + 0.14) {
      this.playStep(song, this.step, this.nextTime, stepDur);
      this.step += 1;
      this.nextTime += stepDur;
    }
  }

  private playStep(song: Song, step: number, t: number, sd: number) {
    const b = this.musicBus;
    const bar = Math.floor(step / 16) % song.chords.length;
    const s = step % 16;
    const [root, q] = song.chords[bar];
    const notes = chordNotes(root, q);
    if (s === 0) {
      for (const n of notes.slice(0, 3)) {
        this.tone(t, 'sawtooth', midi(n), midi(n), sd * 15, 0.035 * song.padLevel, b, sd * 3);
        this.tone(t, 'triangle', midi(n + 12) * 1.003, midi(n + 12) * 1.003, sd * 15, 0.03 * song.padLevel, b, sd * 3);
      }
    }
    const bc = song.bass[s];
    if (bc && bc !== '.') {
      const n = notes[Number(bc)] - 12;
      this.tone(t, 'square', midi(n), midi(n), sd * 1.6, 0.07, b);
      this.tone(t, 'sine', midi(n - 12), midi(n - 12), sd * 1.8, 0.16, b);
    }
    const ac = song.arp[s];
    if (ac && ac !== '.') {
      const n = notes[Number(ac)] + 12;
      if (song.lead === 'bell') {
        this.tone(t, 'sine', midi(n), midi(n), sd * 3, 0.07, b);
        this.tone(t, 'sine', midi(n + 12), midi(n + 12), sd * 1.5, 0.025, b);
      } else if (song.lead === 'tri') {
        this.tone(t, 'triangle', midi(n), midi(n), sd * 1.5, 0.08, b);
      } else {
        this.tone(t, 'square', midi(n), midi(n), sd * 1.1, 0.035, b);
      }
    }
    if (song.drums.k[s] === 'x') this.tone(t, 'sine', 150, 42, 0.22, 0.45, b);
    if (song.drums.s[s] === 'x') {
      this.hiss(t, 0.12, 0.16, 'bandpass', 1800, 1200, b);
      this.tone(t, 'triangle', 220, 160, 0.07, 0.08, b);
    }
    if (song.drums.h[s] === 'x') this.hiss(t, 0.03, 0.05, 'highpass', 7000, 9000, b);
  }
}

export const audio = new AudioEngine();
