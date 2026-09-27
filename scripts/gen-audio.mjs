// Synthesizes every sound effect and music loop as 16-bit mono WAV files in assets/audio.
// Run: node scripts/gen-audio.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'audio');
mkdirSync(OUT, { recursive: true });

let seed = 1234567;
function rnd() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}

function writeWav(name, samples, rate) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  let peak = 0;
  for (const s of samples) peak = Math.max(peak, Math.abs(s));
  const norm = peak > 0.98 ? 0.98 / peak : 1;
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i] * norm));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  writeFileSync(join(OUT, `${name}.wav`), buf);
  console.log(`${name}.wav  ${(buf.length / 1024).toFixed(1)} KB`);
}

const SFX_RATE = 22050;
const MUSIC_RATE = 16000;

const osc = {
  sine: (p) => Math.sin(2 * Math.PI * p),
  square: (p) => (p % 1 < 0.5 ? 1 : -1),
  pulse25: (p) => (p % 1 < 0.25 ? 1 : -1),
  saw: (p) => 2 * (p % 1) - 1,
  tri: (p) => 1 - 4 * Math.abs((p % 1) - 0.5),
};

function tone(buf, rate, { start = 0, dur, f0, f1 = f0, wave = 'square', vol = 0.3, attack = 0.005, release = 0.05, vibrato = 0 }) {
  const s0 = Math.floor(start * rate);
  const n = Math.floor(dur * rate);
  let phase = 0;
  for (let i = 0; i < n && s0 + i < buf.length; i++) {
    const t = i / rate;
    const k = i / n;
    const f = f0 * Math.pow(f1 / f0, k) * (1 + vibrato * Math.sin(2 * Math.PI * 6 * t));
    phase += f / rate;
    const env = Math.min(1, t / attack) * Math.min(1, (dur - t) / release);
    buf[s0 + i] += osc[wave](phase) * vol * Math.max(0, env);
  }
}

function noise(buf, rate, { start = 0, dur, vol = 0.3, attack = 0.002, release = 0.05, lowpass = 1, decay = 0 }) {
  const s0 = Math.floor(start * rate);
  const n = Math.floor(dur * rate);
  let last = 0;
  for (let i = 0; i < n && s0 + i < buf.length; i++) {
    const t = i / rate;
    const lp = typeof lowpass === 'function' ? lowpass(i / n) : lowpass;
    last = last + lp * (rnd() * 2 - 1 - last);
    const env = Math.min(1, t / attack) * Math.min(1, (dur - t) / release) * (decay ? Math.exp(-t * decay) : 1);
    buf[s0 + i] += last * vol * Math.max(0, env);
  }
}

function sfx(name, dur, build) {
  const buf = new Float32Array(Math.ceil(dur * SFX_RATE));
  build(buf, SFX_RATE);
  writeWav(name, buf, SFX_RATE);
}

const N = (semi) => 440 * Math.pow(2, (semi - 9) / 12); // semitone offset from C4 (0 = C4)

sfx('step', 0.05, (b, r) => noise(b, r, { dur: 0.05, vol: 0.18, lowpass: 0.25, release: 0.04 }));
sfx('bump', 0.12, (b, r) => tone(b, r, { dur: 0.12, f0: 110, f1: 55, wave: 'sine', vol: 0.6, release: 0.08 }));
sfx('door', 0.3, (b, r) => {
  noise(b, r, { dur: 0.3, vol: 0.35, lowpass: (k) => 0.05 + 0.3 * Math.sin(Math.PI * k), attack: 0.04, release: 0.12 });
  tone(b, r, { dur: 0.3, f0: 160, f1: 90, wave: 'tri', vol: 0.15 });
});
sfx('hack', 0.34, (b, r) => {
  [N(24), N(28), N(31), N(36)].forEach((f, i) => tone(b, r, { start: i * 0.075, dur: 0.06, f0: f, wave: 'square', vol: 0.18 }));
});
sfx('pickup', 0.28, (b, r) => {
  [N(24), N(28), N(31), N(36)].forEach((f, i) => tone(b, r, { start: i * 0.055, dur: 0.1, f0: f, wave: 'pulse25', vol: 0.2 }));
});
sfx('select', 0.05, (b, r) => tone(b, r, { dur: 0.05, f0: N(31), wave: 'square', vol: 0.15, release: 0.03 }));
sfx('blip', 0.03, (b, r) => tone(b, r, { dur: 0.03, f0: N(19), wave: 'pulse25', vol: 0.08, release: 0.02 }));
sfx('hit', 0.16, (b, r) => {
  noise(b, r, { dur: 0.12, vol: 0.5, lowpass: 0.6, decay: 25 });
  tone(b, r, { dur: 0.16, f0: 150, f1: 50, wave: 'sine', vol: 0.6, release: 0.1 });
});
sfx('crit', 0.3, (b, r) => {
  noise(b, r, { dur: 0.16, vol: 0.6, lowpass: 0.8, decay: 20 });
  tone(b, r, { dur: 0.2, f0: 180, f1: 45, wave: 'sine', vol: 0.7 });
  tone(b, r, { start: 0.02, dur: 0.25, f0: N(36), wave: 'tri', vol: 0.25, release: 0.2 });
});
sfx('miss', 0.14, (b, r) => noise(b, r, { dur: 0.14, vol: 0.25, lowpass: (k) => 0.6 - 0.5 * k, attack: 0.02, release: 0.1 }));
sfx('hurt', 0.18, (b, r) => {
  noise(b, r, { dur: 0.1, vol: 0.45, lowpass: 0.4, decay: 30 });
  tone(b, r, { dur: 0.18, f0: 220, f1: 90, wave: 'square', vol: 0.25 });
});
sfx('zap', 0.3, (b, r) => {
  const n = Math.floor(0.3 * r);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const f = 300 + rnd() * 1500;
    phase += f / r;
    const env = Math.min(1, i / 200) * (1 - i / n);
    b[i] += osc.square(phase) * 0.3 * env;
  }
  noise(b, r, { dur: 0.3, vol: 0.12, lowpass: 0.9 });
});
sfx('shield', 0.4, (b, r) => {
  tone(b, r, { dur: 0.4, f0: 300, f1: 900, wave: 'sine', vol: 0.4, vibrato: 0.04, attack: 0.05, release: 0.15 });
  tone(b, r, { dur: 0.4, f0: 450, f1: 1350, wave: 'tri', vol: 0.15, attack: 0.05, release: 0.15 });
});
sfx('heal', 0.5, (b, r) => {
  [N(12), N(16), N(19), N(24)].forEach((f, i) => tone(b, r, { start: i * 0.08, dur: 0.22, f0: f, wave: 'sine', vol: 0.3, release: 0.15 }));
});
sfx('burn', 0.4, (b, r) => {
  noise(b, r, { dur: 0.4, vol: 0.45, lowpass: 0.3, attack: 0.02, release: 0.2 });
  for (let i = 0; i < 12; i++) noise(b, r, { start: rnd() * 0.35, dur: 0.01, vol: 0.5, lowpass: 1 });
});
sfx('emp', 0.5, (b, r) => {
  tone(b, r, { dur: 0.5, f0: 900, f1: 60, wave: 'saw', vol: 0.3, release: 0.2 });
  noise(b, r, { dur: 0.4, vol: 0.3, lowpass: 0.5, decay: 8 });
});
sfx('death', 0.45, (b, r) => {
  tone(b, r, { dur: 0.4, f0: 600, f1: 80, wave: 'square', vol: 0.25 });
  noise(b, r, { start: 0.05, dur: 0.4, vol: 0.3, lowpass: 0.3, decay: 6 });
});
sfx('levelup', 0.8, (b, r) => {
  [N(12), N(16), N(19), N(24)].forEach((f, i) => tone(b, r, { start: i * 0.09, dur: 0.12, f0: f, wave: 'pulse25', vol: 0.22 }));
  [N(24), N(28), N(31)].forEach((f) => tone(b, r, { start: 0.38, dur: 0.4, f0: f, wave: 'square', vol: 0.12, release: 0.25 }));
});
sfx('alarm', 0.9, (b, r) => {
  for (let i = 0; i < 4; i++) tone(b, r, { start: i * 0.22, dur: 0.2, f0: i % 2 ? 660 : 880, wave: 'square', vol: 0.2 });
});
sfx('victory', 1.1, (b, r) => {
  const notes = [
    [N(19), 0, 0.12],
    [N(24), 0.13, 0.12],
    [N(28), 0.26, 0.12],
    [N(31), 0.39, 0.5],
  ];
  notes.forEach(([f, s, d]) => tone(b, r, { start: s, dur: d, f0: f, wave: 'pulse25', vol: 0.22, release: 0.08 }));
  [N(12), N(16), N(19)].forEach((f) => tone(b, r, { start: 0.39, dur: 0.6, f0: f, wave: 'tri', vol: 0.2, release: 0.3 }));
});
sfx('defeat', 1.3, (b, r) => {
  [N(16), N(12), N(9), N(5)].forEach((f, i) => tone(b, r, { start: i * 0.28, dur: 0.3, f0: f, wave: 'tri', vol: 0.3, release: 0.15 }));
});
sfx('scan', 0.7, (b, r) => {
  tone(b, r, { dur: 0.35, f0: 1500, f1: 1400, wave: 'sine', vol: 0.35, attack: 0.002, release: 0.33 });
  tone(b, r, { start: 0.3, dur: 0.35, f0: 1500, f1: 1400, wave: 'sine', vol: 0.12, attack: 0.002, release: 0.33 });
});
sfx('elevator', 1.2, (b, r) => {
  tone(b, r, { dur: 1.0, f0: 70, f1: 110, wave: 'saw', vol: 0.2, attack: 0.2, release: 0.3 });
  noise(b, r, { dur: 1.0, vol: 0.1, lowpass: 0.05, attack: 0.2, release: 0.3 });
  tone(b, r, { start: 0.95, dur: 0.25, f0: N(28), wave: 'sine', vol: 0.3, release: 0.2 });
});

/* ---------------- music ---------------- */

function music(name, bars, bpm, build) {
  const beat = 60 / bpm;
  const dur = bars * 4 * beat;
  const tail = 2.0;
  const buf = new Float32Array(Math.ceil((dur + tail) * MUSIC_RATE));
  build(buf, MUSIC_RATE, beat);
  const loopLen = Math.floor(dur * MUSIC_RATE);
  const out = buf.slice(0, loopLen);
  for (let i = loopLen; i < buf.length; i++) out[i - loopLen] += buf[i];
  writeWav(name, out, MUSIC_RATE);
}

function chordPad(b, r, start, dur, freqs, vol) {
  for (const f of freqs) {
    tone(b, r, { start, dur, f0: f, wave: 'sine', vol, attack: dur * 0.3, release: dur * 0.5, vibrato: 0.003 });
    tone(b, r, { start, dur, f0: f * 1.003, wave: 'tri', vol: vol * 0.4, attack: dur * 0.3, release: dur * 0.5 });
  }
}

// Semitone offsets relative to C4 for common chords.
const Am = [N(-3), N(0), N(4)];
const F = [N(-7), N(-3), N(0)];
const C = [N(-12), N(-5), N(4)];
const G = [N(-5), N(-1), N(2)];
const Em = [N(-8), N(-5), N(-1)];
const Dm = [N(-10), N(-7), N(-3)];

music('explore', 8, 70, (b, r, beat) => {
  const prog = [Am, F, C, G, Am, F, Dm, Em];
  prog.forEach((ch, i) => {
    chordPad(b, r, i * 4 * beat, 4 * beat * 1.15, ch, 0.09);
    tone(b, r, { start: i * 4 * beat, dur: 4 * beat, f0: ch[0] / 2, wave: 'sine', vol: 0.12, attack: 0.3, release: 1.2 });
    const arp = [ch[0] * 2, ch[1] * 2, ch[2] * 2, ch[1] * 2];
    arp.forEach((f, j) => {
      if ((i + j) % 3 === 0) tone(b, r, { start: (i * 4 + j) * beat + beat * 0.5, dur: beat * 1.5, f0: f, wave: 'sine', vol: 0.05, release: beat * 1.2 });
    });
  });
});

music('title', 8, 60, (b, r, beat) => {
  const prog = [Am, Em, F, C, Dm, Am, F, Em];
  prog.forEach((ch, i) => {
    chordPad(b, r, i * 4 * beat, 4 * beat * 1.2, ch, 0.08);
    tone(b, r, { start: i * 4 * beat, dur: 4 * beat, f0: ch[0] / 2, wave: 'sine', vol: 0.12, attack: 0.5, release: 1.5 });
    tone(b, r, { start: i * 4 * beat + beat, dur: beat * 3, f0: ch[2] * 4, wave: 'sine', vol: 0.04, attack: 0.005, release: beat * 2.8 });
  });
});

function drums(b, r, beat, bars, { hat = true, kickEvery = 1, snare = true, vol = 1 }) {
  for (let q = 0; q < bars * 4; q++) {
    const t = q * beat;
    if (q % kickEvery === 0) tone(b, r, { start: t, dur: 0.18, f0: 140, f1: 45, wave: 'sine', vol: 0.5 * vol, release: 0.12 });
    if (snare && q % 4 === 2) noise(b, r, { start: t, dur: 0.14, vol: 0.28 * vol, lowpass: 0.7, decay: 18 });
    if (hat) {
      noise(b, r, { start: t + beat / 2, dur: 0.04, vol: 0.12 * vol, lowpass: 0.95, decay: 60 });
      noise(b, r, { start: t, dur: 0.03, vol: 0.06 * vol, lowpass: 0.95, decay: 80 });
    }
  }
}

music('battle', 4, 132, (b, r, beat) => {
  const roots = [N(-15), N(-19), N(-17), N(-20)];
  const chords = [Am, F, G, Em];
  roots.forEach((root, bar) => {
    for (let e = 0; e < 8; e++) {
      const f = e % 2 ? root * 2 : root;
      tone(b, r, { start: (bar * 4 + e / 2) * beat, dur: beat * 0.45, f0: f, wave: 'square', vol: 0.14, release: 0.05 });
    }
    chords[bar].forEach((f, j) =>
      tone(b, r, { start: bar * 4 * beat + j * beat * 0.5, dur: beat * 0.4, f0: f * 2, wave: 'pulse25', vol: 0.06, release: 0.05 }),
    );
  });
  drums(b, r, beat, 4, {});
});

music('boss', 4, 150, (b, r, beat) => {
  const roots = [N(-15), N(-14), N(-15), N(-17)];
  roots.forEach((root, bar) => {
    for (let e = 0; e < 16; e++) {
      const f = [root, root * 2, root * 1.5, root * 2][e % 4];
      tone(b, r, { start: (bar * 4 + e / 4) * beat, dur: beat * 0.22, f0: f, wave: 'saw', vol: 0.09, release: 0.03 });
    }
    tone(b, r, { start: bar * 4 * beat, dur: beat * 4, f0: root * 4, wave: 'square', vol: 0.05, attack: 0.1, release: 0.4, vibrato: 0.01 });
  });
  drums(b, r, beat, 4, { kickEvery: 1, vol: 1.1 });
});

console.log('done');
