// Rasterizes LUX's face into the app icon, Android adaptive icon layers and favicon.
// Run: npm run gen:icons
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'assets', 'images');

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function writePng(name, w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  writeFileSync(join(OUT, name), png);
  console.log(`${name} ${w}x${h} ${(png.length / 1024).toFixed(1)} KB`);
}

const hex = (h, a = 1) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
};

// Primitives in normalized [0,1] space. `hard` ones are supersampled, `glow` ones fall off smoothly.
function boltShapes() {
  return [
    { t: 'glow', cx: 0.5, cy: 0.86, r: 0.24, c: hex('#5ee0ff', 0.55) },
    { t: 'ellipse', cx: 0.215, cy: 0.54, rx: 0.065, ry: 0.115, c: hex('#8d99ae') },
    { t: 'ellipse', cx: 0.785, cy: 0.54, rx: 0.065, ry: 0.115, c: hex('#8d99ae') },
    { t: 'circle', cx: 0.5, cy: 0.52, r: 0.285, c: hex('#5f6b80') },
    { t: 'circle', cx: 0.5, cy: 0.52, r: 0.268, c: hex('#d9e2ef') },
    { t: 'band', cx: 0.5, cy: 0.52, r: 0.268, y0: 0.6, y1: 0.645, c: hex('#aab5c7') },
    { t: 'line', x0: 0.575, y0: 0.27, x1: 0.64, y1: 0.14, w: 0.02, c: hex('#5f6b80') },
    { t: 'glow', cx: 0.645, cy: 0.135, r: 0.08, c: hex('#ff5e6a', 0.8) },
    { t: 'circle', cx: 0.645, cy: 0.135, r: 0.034, c: hex('#ff5e6a') },
    { t: 'circle', cx: 0.5, cy: 0.49, r: 0.135, c: hex('#16202e') },
    { t: 'glow', cx: 0.5, cy: 0.49, r: 0.16, c: hex('#5ee0ff', 0.55) },
    { t: 'circle', cx: 0.5, cy: 0.49, r: 0.092, c: hex('#5ee0ff') },
    { t: 'circle', cx: 0.5, cy: 0.49, r: 0.05, c: hex('#bff4ff') },
    { t: 'circle', cx: 0.468, cy: 0.455, r: 0.024, c: hex('#ffffff') },
    { t: 'star', cx: 0.35, cy: 0.655, r: 0.05, c: hex('#ffd166') },
  ];
}

function inside(p, x, y) {
  switch (p.t) {
    case 'circle':
      return (x - p.cx) ** 2 + (y - p.cy) ** 2 <= p.r * p.r;
    case 'ellipse':
      return ((x - p.cx) / p.rx) ** 2 + ((y - p.cy) / p.ry) ** 2 <= 1;
    case 'band':
      return y >= p.y0 && y <= p.y1 && (x - p.cx) ** 2 + (y - p.cy) ** 2 <= p.r * p.r;
    case 'line': {
      const dx = p.x1 - p.x0;
      const dy = p.y1 - p.y0;
      const t = Math.max(0, Math.min(1, ((x - p.x0) * dx + (y - p.y0) * dy) / (dx * dx + dy * dy)));
      return (x - (p.x0 + t * dx)) ** 2 + (y - (p.y0 + t * dy)) ** 2 <= (p.w / 2) ** 2;
    }
    case 'star': {
      const a = Math.atan2(y - p.cy, x - p.cx) + Math.PI / 2;
      const d = Math.hypot(x - p.cx, y - p.cy);
      const k = (((a / (2 * Math.PI)) * 5) % 1 + 1) % 1;
      const edge = p.r * (0.45 + 0.55 * Math.abs(1 - 2 * k));
      return d <= edge;
    }
    default:
      return false;
  }
}

function blend(dst, c, alpha) {
  const a = c[3] * alpha;
  const outA = a + dst[3] * (1 - a);
  if (outA <= 0) return [0, 0, 0, 0];
  return [
    (c[0] * a + dst[0] * dst[3] * (1 - a)) / outA,
    (c[1] * a + dst[1] * dst[3] * (1 - a)) / outA,
    (c[2] * a + dst[2] * dst[3] * (1 - a)) / outA,
    outA,
  ];
}

function render({ size, scale = 1, background = null, mono = false, stars = false }) {
  const shapes = boltShapes();
  const buf = Buffer.alloc(size * size * 4);
  const ss = size >= 256 ? 2 : 4;
  let seed = 3;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const starList = stars ? Array.from({ length: 70 }, () => [rnd(), rnd(), 0.0015 + rnd() * 0.004, 0.3 + rnd() * 0.7]) : [];
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let acc = [0, 0, 0, 0];
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const nx = (px + (sx + 0.5) / ss) / size;
          const ny = (py + (sy + 0.5) / ss) / size;
          let col = [0, 0, 0, 0];
          if (background) {
            const d = Math.hypot(nx - 0.5, ny - 0.45);
            const t = Math.min(1, d / 0.75);
            col = [background[0][0] * (1 - t) + background[1][0] * t, background[0][1] * (1 - t) + background[1][1] * t, background[0][2] * (1 - t) + background[1][2] * t, 1];
            for (const [sx0, sy0, r, a] of starList) if ((nx - sx0) ** 2 + (ny - sy0) ** 2 < r * r) col = blend(col, [255, 255, 255, 1], a);
            const pink = Math.hypot(nx - 0.82, ny - 0.84);
            if (pink < 0.35) col = blend(col, hex('#ff6fcf'), 0.28 * (1 - pink / 0.35) ** 2);
          }
          const x = 0.5 + (nx - 0.5) / scale;
          const y = 0.5 + (ny - 0.5) / scale;
          for (const p of shapes) {
            if (p.t === 'glow') {
              if (mono) continue;
              const d = Math.hypot(x - p.cx, y - p.cy) / p.r;
              if (d < 1) col = blend(col, p.c, (1 - d) ** 2);
            } else if (inside(p, x, y)) {
              col = blend(col, mono ? [255, 255, 255, 1] : p.c, 1);
            }
          }
          acc = [acc[0] + col[0] * col[3], acc[1] + col[1] * col[3], acc[2] + col[2] * col[3], acc[3] + col[3]];
        }
      }
      const n = ss * ss;
      const a = acc[3] / n;
      const i = (py * size + px) * 4;
      buf[i] = a > 0 ? Math.round(acc[0] / acc[3]) : 0;
      buf[i + 1] = a > 0 ? Math.round(acc[1] / acc[3]) : 0;
      buf[i + 2] = a > 0 ? Math.round(acc[2] / acc[3]) : 0;
      buf[i + 3] = Math.round(a * 255);
    }
  }
  return buf;
}

const BG = [hex('#16244a'), hex('#05070d')];
writePng('icon.png', 1024, 1024, render({ size: 1024, background: BG, stars: true, scale: 0.92 }));
writePng('android-icon-background.png', 512, 512, render({ size: 512, background: BG, stars: true, scale: 0.0001 }));
writePng('android-icon-foreground.png', 512, 512, render({ size: 512, scale: 0.62 }));
writePng('android-icon-monochrome.png', 512, 512, render({ size: 512, scale: 0.62, mono: true }));
// splash-icon.png is the game emblem (game/src/ui/emblem.ts, also saved as splash-emblem.svg), not LUX's face.
writePng('favicon.png', 48, 48, render({ size: 48, background: BG, scale: 0.95 }));
