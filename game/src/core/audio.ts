import { INSTRUMENTS, WAVES, type Inst, type InstName, type Wave, type WaveName } from './instruments';
import { SONGS, chordTone, compileSong, type Compiled, type Kit, type Lane, type Note, type Track } from './songs';

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

export type { Track } from './songs';

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

/** How loud each part of the band plays, against the instrument's own level. */
const ROLE = { lead: 1, counter: 0.7, arp: 0.6, bass: 1, pad: 0.7, drone: 0.5 } as const;

/**
 * At most this many music notes and drum hits sound at once (each is one to four oscillators); past
 * `SOFT_VOICES` the quieter parts (arpeggio, pad, hats and shakers) skip a note. Keeps phones cool.
 */
const MAX_VOICES = 36;
const SOFT_VOICES = 26;

/** Kick drums by kit: start and end pitch, length and level. */
const KICK: Record<Kit, [number, number, number, number]> = {
  electro: [155, 45, 0.22, 0.5],
  rock: [120, 48, 0.3, 0.5],
  hand: [95, 62, 0.28, 0.42],
  march: [90, 50, 0.35, 0.45],
  soft: [100, 50, 0.25, 0.32],
};

/** Snares by kit: the noise's filter, its length and level, and the drum body's pitch and level. */
const SNARE: Record<Kit, { type: BiquadFilterType; f: number; dur: number; vol: number; tone: number; body: number }> = {
  electro: { type: 'bandpass', f: 1800, dur: 0.12, vol: 0.18, tone: 220, body: 0.08 },
  rock: { type: 'bandpass', f: 1400, dur: 0.2, vol: 0.22, tone: 190, body: 0.12 },
  hand: { type: 'bandpass', f: 3200, dur: 0.05, vol: 0.14, tone: 900, body: 0.07 },
  march: { type: 'highpass', f: 2400, dur: 0.17, vol: 0.2, tone: 240, body: 0.06 },
  soft: { type: 'lowpass', f: 4000, dur: 0.15, vol: 0.1, tone: 200, body: 0.03 },
};

/** Everything one song plays through, faded out and dropped as the next song starts (no hanging notes). */
interface Chain {
  out: GainNode;
  lead: AudioNode;
  counter: AudioNode;
  arp: AudioNode;
  bass: AudioNode;
  pad: AudioNode;
  drums: AudioNode;
  hats: AudioNode;
  echo: AudioNode | null;
  dirt: AudioNode | null;
  /** Gentle and wide vibrato, fed into the detune of every note that wants it. */
  vib: [AudioNode, AudioNode];
  lfo: OscillatorNode;
}

/** The shared overdrive curve (distorted bass and guitars). */
function driveCurve(): Float32Array<ArrayBuffer> {
  const n = 1024;
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) c[i] = Math.tanh(((i / (n - 1)) * 2 - 1) * 3.2) * 0.8;
  return c;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxBus!: GainNode;
  private musicBus!: GainNode;
  private noise!: AudioBuffer;
  private track: Track | null = null;
  private wanted: Track | null = null;
  /** The song playing, read into steps, and the buses it plays through. */
  private song: Compiled | null = null;
  private chain: Chain | null = null;
  private songs = new Map<Track, Compiled>();
  private waves = new Map<WaveName, PeriodicWave>();
  private drive: Float32Array<ArrayBuffer> | null = null;
  /** When each music voice still sounding ends (see `room`). */
  private live: number[] = [];
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
      this.setup(new Ctor());
      this.timer = setInterval(() => this.schedule(), 25);
    }
    const ctx = this.ctx as AudioContext;
    if (ctx.state === 'suspended') void ctx.resume();
    if (this.wanted !== this.track) this.music(this.wanted);
  }

  /** Builds the mixer on a context (an OfflineAudioContext works too, for rendering a song to check its levels). */
  private setup(ctx: AudioContext) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    this.master.connect(comp).connect(ctx.destination);
    this.sfxBus = ctx.createGain();
    this.musicBus = ctx.createGain();
    this.sfxBus.connect(this.master);
    this.musicBus.connect(this.master);
    this.applyVolumes();
    const len = ctx.sampleRate;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
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
    this.musicBus.gain.value = this.musicVolume * 0.34;
    this.sfxBus.gain.value = this.sfxVolume;
  }

  /* ---------------- building blocks ---------------- */

  private env(g: GainNode, t: number, a: number, d: number, peak: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  private tone(t: number, type: OscillatorType, f0: number, f1: number, dur: number, vol: number, bus: AudioNode, attack = 0.005) {
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

  private hiss(t: number, dur: number, vol: number, type: BiquadFilterType, f0: number, f1: number, bus: AudioNode, attack = 0.003) {
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
    if (this.chain) this.dropChain(this.chain);
    this.chain = null;
    this.song = track ? this.compiled(track) : null;
    this.live.length = 0;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.12;
    if (this.song) this.chain = this.makeChain(this.song);
  }

  private compiled(track: Track): Compiled {
    let c = this.songs.get(track);
    if (!c) {
      c = compileSong(track, SONGS[track]);
      this.songs.set(track, c);
    }
    return c;
  }

  /** The song's buses: each part (panned a little apart) into the song's lowpass, with its echo, overdrive and vibrato. */
  private makeChain(c: Compiled): Chain {
    const ctx = this.ctx as AudioContext;
    const fx = c.song.fx;
    const out = ctx.createGain();
    out.gain.value = c.song.gain ?? 1;
    out.connect(this.musicBus);
    const room = ctx.createBiquadFilter();
    room.type = 'lowpass';
    room.frequency.value = fx.cutoff;
    room.Q.value = 0.5;
    room.connect(out);
    const bus = (pan: number) => {
      const g = ctx.createGain();
      if (pan && ctx.createStereoPanner) {
        const p = ctx.createStereoPanner();
        p.pan.value = pan;
        g.connect(p).connect(room);
      } else g.connect(room);
      return g;
    };
    let echo: AudioNode | null = null;
    if (fx.echo) {
      const send = ctx.createGain();
      send.gain.value = fx.wet ?? 0.25;
      const delay = ctx.createDelay(2);
      delay.delayTime.value = Math.min(1.9, (fx.echo * 15) / c.song.bpm);
      const tone = ctx.createBiquadFilter();
      tone.type = 'lowpass';
      tone.frequency.value = 2600;
      const fb = ctx.createGain();
      fb.gain.value = fx.fb ?? 0.3;
      send.connect(delay).connect(tone).connect(room);
      tone.connect(fb).connect(delay);
      echo = send;
    }
    let dirt: AudioNode | null = null;
    const dirty = c.parts.some((p) => Object.values(p.voices).some((v) => (INSTRUMENTS[v as InstName] as Inst).dirt));
    if (dirty) {
      const shaper = ctx.createWaveShaper();
      shaper.curve = this.drive ?? (this.drive = driveCurve());
      const tame = ctx.createBiquadFilter();
      tame.type = 'lowpass';
      tame.frequency.value = 3200;
      // The shaper squashes everything to nearly full level: bring it back down to sit with the band.
      const level = ctx.createGain();
      level.gain.value = 0.3;
      shaper.connect(tame).connect(level).connect(room);
      dirt = shaper;
    }
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 5.4;
    const vib = [9, 24].map((cents) => {
      const g = ctx.createGain();
      g.gain.value = cents;
      lfo.connect(g);
      return g;
    }) as [GainNode, GainNode];
    lfo.start();
    return { out, lead: bus(0), counter: bus(0.35), arp: bus(-0.35), bass: bus(0), pad: bus(0), drums: bus(0), hats: bus(0.25), echo, dirt, vib, lfo };
  }

  /** Fades a song out quickly and lets go of it: anything it still had scheduled plays into nothing. */
  private dropChain(ch: Chain) {
    const ctx = this.ctx as AudioContext;
    const t = ctx.currentTime;
    ch.out.gain.setValueAtTime(ch.out.gain.value, t);
    ch.out.gain.linearRampToValueAtTime(0, t + 0.15);
    ch.lfo.stop(t + 0.3);
    setTimeout(() => ch.out.disconnect(), 400);
  }

  private wave(o: OscillatorNode, w: Wave) {
    if (!(w in WAVES)) {
      o.type = w as OscillatorType;
      return;
    }
    let p = this.waves.get(w as WaveName);
    if (!p) {
      const amps = WAVES[w as WaveName];
      const real = new Float32Array(amps.length + 1);
      const imag = new Float32Array(amps.length + 1);
      amps.forEach((a, i) => (imag[i + 1] = a));
      p = (this.ctx as AudioContext).createPeriodicWave(real, imag);
      this.waves.set(w as WaveName, p);
    }
    o.setPeriodicWave(p);
  }

  /** Room for one more voice from `t` to `end`? Quiet parts (`soft`) give way first. */
  private room(t: number, end: number, soft: boolean): boolean {
    let n = 0;
    for (const e of this.live) if (e > t) this.live[n++] = e;
    this.live.length = n;
    if (n >= (soft ? SOFT_VOICES : MAX_VOICES)) return false;
    this.live.push(end);
    return true;
  }

  /** Plays one note of an instrument: MIDI note `m` (sliding in from `from`), held `len` seconds. */
  private note(ch: Chain, dest: AudioNode, inst: Inst, m: number, t: number, len: number, vel: number, soft: boolean, from?: number) {
    const ctx = this.ctx as AudioContext;
    const held = Math.max(len, inst.a);
    // A pluck rings out whatever its written length; a held note lasts its length, then lets go.
    const end = inst.s > 0 ? t + held + inst.r : t + inst.a + inst.d;
    if (!this.room(t, end, soft)) return;
    const f = midi(m);
    const peak = inst.gain * vel;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + inst.a);
    if (inst.s > 0) {
      g.gain.setTargetAtTime(peak * inst.s, t + inst.a, inst.d / 3);
      g.gain.setTargetAtTime(0, t + held, inst.r / 4);
    } else g.gain.setTargetAtTime(0, t + inst.a, inst.d / 4);
    g.connect(inst.dirt && ch.dirt ? ch.dirt : dest);
    if (inst.echo && ch.echo) g.connect(ch.echo);
    let head: AudioNode = g;
    if (inst.lp) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.Q.value = inst.lp.q ?? 0.7;
      const base = Math.min(15000, f * inst.lp.mul);
      if (inst.lp.env) {
        lp.frequency.setValueAtTime(Math.min(15000, f * inst.lp.env), t);
        lp.frequency.setTargetAtTime(base, t, (inst.lp.time ?? 0.1) / 2);
      } else lp.frequency.value = base;
      lp.connect(g);
      head = lp;
    }
    const glide = from !== undefined ? Math.min(0.12, len / 2) : 0;
    const osc = (w: Wave, ratio: number, cents: number, into: AudioNode) => {
      const o = ctx.createOscillator();
      this.wave(o, w);
      if (glide) {
        o.frequency.setValueAtTime(midi(from as number) * ratio, t);
        o.frequency.exponentialRampToValueAtTime(f * ratio, t + glide);
      } else o.frequency.value = f * ratio;
      o.detune.value = cents;
      if (inst.vib) ch.vib[inst.vib - 1].connect(o.detune);
      o.connect(into);
      o.start(t);
      o.stop(end + 0.02);
    };
    const half = (inst.detune ?? 0) / 2;
    osc(inst.wave, 1, -half, head);
    if (inst.detune) osc(inst.wave, 1, half, head);
    for (const l of inst.layers ?? []) {
      const lg = ctx.createGain();
      lg.gain.setValueAtTime(l.gain, t);
      if (l.decay) lg.gain.setTargetAtTime(0, t, l.decay / 4);
      lg.connect(head);
      osc(l.wave ?? 'sine', l.ratio, 0, lg);
    }
    if (inst.chiff) this.hiss(t, 0.04, inst.chiff * vel, 'bandpass', Math.min(9000, f * 3), Math.min(9000, f * 2), dest, 0.004);
  }

  /** Plays a written note (struck over and over with tremolo picking, if the instrument does that). */
  private line(ch: Chain, dest: AudioNode, inst: Inst, n: Note, t: number, sd: number, vel: number, soft: boolean) {
    if (inst.trem && n.len >= 3) {
      for (let k = 0; k < n.len; k += inst.trem) this.note(ch, dest, inst, n.m, t + k * sd, inst.trem * sd, vel * (k ? 0.7 : 1), true, k ? undefined : n.from);
    } else this.note(ch, dest, inst, n.m, t, n.len * sd, vel, soft, n.from);
  }

  /** One drum hit on `lane`, velocity `v`. */
  private drum(ch: Chain, kit: Kit, lane: Lane, t: number, v: number) {
    const hat = lane === 'h' || lane === 'o' || lane === 'z' || lane === 'j';
    const d = hat ? ch.hats : ch.drums;
    if (!this.room(t, t + (lane === 'x' ? 1.3 : 0.4), hat)) return;
    switch (lane) {
      case 'k': {
        const [f0, f1, dur, vol] = KICK[kit];
        this.tone(t, 'sine', f0, f1, dur, vol * v, d);
        if (kit === 'rock') this.hiss(t, 0.015, 0.08 * v, 'highpass', 3000, 3000, d);
        break;
      }
      case 's': {
        const s = SNARE[kit];
        this.hiss(t, s.dur, s.vol * v, s.type, s.f, s.f * 0.7, d);
        this.tone(t, 'triangle', s.tone, s.tone * 0.75, 0.07, s.body * v, d);
        break;
      }
      case 'c':
        this.hiss(t, 0.02, 0.14 * v, 'bandpass', 1300, 1300, d);
        this.hiss(t + 0.014, 0.13, 0.17 * v, 'bandpass', 1200, 1000, d);
        break;
      case 'h':
        this.hiss(t, 0.03, 0.05 * v, 'highpass', 7500, 9000, d);
        break;
      case 'o':
        this.hiss(t, 0.22, 0.045 * v, 'highpass', 6500, 7500, d);
        break;
      case 'z':
        this.hiss(t, 0.05, 0.045 * v, 'bandpass', 6000, 7000, d, 0.015);
        break;
      case 'j':
        this.hiss(t, 0.1, 0.05 * v, 'bandpass', 8000, 7000, d);
        this.hiss(t + 0.03, 0.07, 0.03 * v, 'bandpass', 9000, 8000, d);
        break;
      case 't':
        this.tone(t, 'sine', 110, 72, 0.32, 0.32 * v, d);
        this.hiss(t, 0.05, 0.05 * v, 'lowpass', 1200, 400, d);
        break;
      case 'm':
        this.tone(t, 'sine', 190, 130, 0.22, 0.26 * v, d);
        break;
      case 'r':
        this.tone(t, 'triangle', 1700, 1500, 0.035, 0.12 * v, d);
        this.hiss(t, 0.02, 0.05 * v, 'bandpass', 3000, 3000, d);
        break;
      case 'x':
        this.hiss(t, 1.3, 0.06 * v, 'highpass', 4500, 3000, d);
        break;
      case 'b':
        this.tone(t, 'sine', 85, 42, 0.7, 0.55 * v, d);
        this.hiss(t, 0.25, 0.12 * v, 'lowpass', 500, 150, d);
        break;
      case 'a':
        // An anvil: three inharmonic rings, the high ones dying first.
        this.tone(t, 'sine', 620, 620, 0.55, 0.07 * v, d);
        this.tone(t, 'sine', 1711, 1711, 0.3, 0.05 * v, d);
        this.tone(t, 'sine', 3348, 3348, 0.12, 0.03 * v, d);
        break;
    }
  }

  /* ---------------- the Flamethrower's roar ---------------- */

  private flameSrc: AudioBufferSourceNode | null = null;
  private flameGain: GainNode | null = null;
  private flameOn = false;
  private flameSeen = 0;

  /**
   * The Flamethrower's roar: a loop of rumbling, crackling filtered noise. Call it every frame with
   * whether the flames are burning; it fades in and out, and stops by itself if the calls stop (pause).
   */
  flame(on: boolean) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    if (on) this.flameSeen = ctx.currentTime;
    if (on === this.flameOn) return;
    this.flameOn = on;
    const t = ctx.currentTime;
    if (on) {
      if (!this.flameSrc) {
        const src = ctx.createBufferSource();
        src.buffer = this.noise;
        src.loop = true;
        const low = ctx.createBiquadFilter();
        low.type = 'lowpass';
        low.frequency.value = 900;
        low.Q.value = 0.9;
        // A fast wobble on the filter makes it crackle and flutter like real fire.
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 9;
        const depth = ctx.createGain();
        depth.gain.value = 380;
        lfo.connect(depth).connect(low.frequency);
        const g = ctx.createGain();
        g.gain.value = 0.0001;
        src.connect(low).connect(g).connect(this.sfxBus);
        src.start(t, Math.random() * 0.5);
        lfo.start(t);
        src.onended = () => lfo.stop();
        this.flameSrc = src;
        this.flameGain = g;
      }
      this.flameGain?.gain.setTargetAtTime(0.42, t, 0.04);
      // A whoosh as it lights.
      this.hiss(t, 0.25, 0.25, 'bandpass', 600, 2400, this.sfxBus, 0.02);
    } else if (this.flameSrc && this.flameGain) {
      this.flameGain.gain.setTargetAtTime(0.0001, t, 0.07);
      this.flameSrc.stop(t + 0.5);
      this.flameSrc = null;
      this.flameGain = null;
    }
  }

  private schedule() {
    const ctx = this.ctx;
    // The roar dies down if nobody keeps it going (the game paused mid-flame).
    if (ctx && this.flameOn && ctx.currentTime - this.flameSeen > 0.2) this.flame(false);
    if (!ctx || ctx.state !== 'running') return;
    this.fill(ctx.currentTime + 0.14);
  }

  /** Schedules the song's steps up to `until` (seconds, on the audio clock). */
  private fill(until: number) {
    const c = this.song;
    const ch = this.chain;
    if (!c || !ch) return;
    const sd = 15 / c.song.bpm;
    while (this.nextTime < until) {
      // With the music turned all the way down nothing is played, but the song keeps its place.
      if (this.musicVolume > 0.01) this.playStep(c, ch, this.step % c.steps, this.nextTime, sd);
      this.step += 1;
      this.nextTime += sd;
    }
  }

  private playStep(c: Compiled, ch: Chain, step: number, t0: number, sd: number) {
    const song = c.song;
    let p = c.parts[0];
    for (const q of c.parts) if (step >= q.start) p = q;
    const l = step - p.start;
    const s = l % c.bar;
    const late = song.shuffle ? s % 4 === 2 : s % 2 === 1;
    const t = t0 + (song.swing && late ? song.swing * sd : 0);
    const chord = p.chord[l];
    const v = p.voices;
    const inst = (n: InstName) => INSTRUMENTS[n] as Inst;
    if (!p.bare) {
      if (p.change[l] && v.pad) {
        const pad = inst(v.pad);
        for (const iv of chord.iv) this.note(ch, ch.pad, pad, chord.root + 12 + iv, t, p.change[l] * sd, ROLE.pad, true);
      }
      if (c.drone !== null && s === 0) {
        const dr = inst(v.drone ?? 'drone');
        this.note(ch, ch.pad, dr, c.drone, t, c.bar * sd, ROLE.drone, false);
        this.note(ch, ch.pad, dr, c.drone + 7, t, c.bar * sd, ROLE.drone * 0.6, true);
      }
    }
    if (p.bass && v.bass) {
      const i = l % p.bass.s.length;
      const k = p.bass.s[i];
      if (k !== '.' && k !== '-') this.note(ch, ch.bass, inst(v.bass), chord.root - 12 + (k === 'c' ? 0 : chordTone(chord, k)), t, p.bass.len[i] * sd, ROLE.bass * (s === 0 ? 1 : 0.85), false);
    }
    if (p.arp && v.arp) {
      const i = l % p.arp.s.length;
      const k = p.arp.s[i];
      const a = inst(v.arp);
      const len = p.arp.len[i] * sd;
      if (k === 'c') {
        // A strummed chord.
        [0, chord.iv[1], chord.iv[2]].forEach((iv, j) => this.note(ch, ch.arp, a, chord.root + 12 + iv, t + j * 0.012, len, ROLE.arp * 0.8, true));
      } else if (k !== '.' && k !== '-') this.note(ch, ch.arp, a, chord.root + 12 + chordTone(chord, k), t, len, ROLE.arp, true);
    }
    const accent = s === 0 ? 1 : s % 4 === 0 ? 0.9 : 0.8;
    const mel = p.melody?.[l];
    if (mel) this.line(ch, ch.lead, inst(v.lead), mel, t, sd, ROLE.lead * accent, false);
    const ctr = p.counter?.[l];
    if (ctr) this.line(ch, ch.counter, inst(v.counter ?? v.lead), ctr, t, sd, ROLE.counter * accent, false);
    if (!p.drums.length) return;
    const kit = song.kit ?? 'electro';
    // A fill: toms run down through the section's last four steps, and a cymbal starts the next.
    const fill = song.fills && l >= p.steps - 4;
    if (song.fills && l === 0) this.drum(ch, kit, 'x', t, 1);
    if (fill) this.drum(ch, kit, p.steps - l > 2 ? 'm' : 't', t, 1);
    for (const [lane, pat] of p.drums) {
      if (fill && lane === 's') continue;
      const hit = pat[l % pat.length];
      if (hit !== '.') this.drum(ch, kit, lane, t, hit === 'X' ? 1.3 : hit === 'g' ? 0.45 : 1);
    }
  }
}

export const audio = new AudioEngine();
