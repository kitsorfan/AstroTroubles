import { Rng } from '../core/math';
import { grey, ice, mix, shade, Sheet, type DeckSurfaces, type Surface } from './surfaces';
import type { Outdoor, Theme } from './themes';

/**
 * Natural surfaces for the outdoor regions of Gaia Nova: grass, sand, snow, mountain rock, jungle
 * moss and volcanic basalt for the ground; layered cliff faces for walls; plank bridges for grates;
 * and the valley floor far below. Painted like the ship's surfaces (colour, height, glow), but with
 * soft blobs, strokes and strata instead of panels and bolts.
 */

/** Soft colour (and height) blobs: the base "noise" of every natural surface. */
function blobs(s: Sheet, rng: Rng, n: number, colors: string[], rMin: number, rMax: number, alpha: number, height = 0) {
  for (let i = 0; i < n; i++) {
    const x = rng.next() * s.w;
    const y = rng.next() * s.hgt;
    const r = rMin + rng.next() * (rMax - rMin);
    const col = colors[Math.floor(rng.next() * colors.length)];
    // One strength per blob, shared by its wrapped copies, so the halves match across the texture edge.
    const a = alpha * (0.5 + rng.next() * 0.5);
    const ah = Math.abs(height) * (0.5 + rng.next() * 0.5);
    for (const [ox, oy] of wraps(s, x - r, y - r, x + r, y + r)) {
      const cx = x + ox;
      const cy = y + oy;
      const g = s.c.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, col);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      s.c.globalAlpha = a;
      s.c.fillStyle = g;
      s.c.fillRect(cx - r, cy - r, r * 2, r * 2);
      if (height) {
        const gh = s.h.createRadialGradient(cx, cy, 0, cx, cy, r);
        gh.addColorStop(0, height > 0 ? 'rgba(255,255,255,1)' : 'rgba(0,0,0,1)');
        gh.addColorStop(1, 'rgba(0,0,0,0)');
        s.h.globalAlpha = ah;
        s.h.fillStyle = gh;
        s.h.fillRect(cx - r, cy - r, r * 2, r * 2);
      }
    }
  }
  s.c.globalAlpha = 1;
  s.h.globalAlpha = 1;
}

/** Fine speckle so close-ups never look flat. */
function speckle(s: Sheet, rng: Rng, n: number, light: number, dark: number, size = 1.6) {
  for (let i = 0; i < n; i++) {
    const v = rng.next();
    s.c.fillStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * light})` : `rgba(0,0,0,${v * dark})`;
    s.c.fillRect(rng.next() * s.w, rng.next() * s.hgt, size, size);
  }
}

/**
 * Copies of a shape shifted by whole texture widths, for every copy that would show: drawing all of
 * them makes the texture tile without seams. `minX`..`maxY` is the shape's bounding box.
 */
function wraps(s: Sheet, minX: number, minY: number, maxX: number, maxY: number): [number, number][] {
  const out: [number, number][] = [];
  for (const ox of [-s.w, 0, s.w]) {
    for (const oy of [-s.hgt, 0, s.hgt]) {
      if (maxX + ox < 0 || minX + ox > s.w || maxY + oy < 0 || minY + oy > s.hgt) continue;
      out.push([ox, oy]);
    }
  }
  return out;
}

/** Strokes a polyline on the given layers at every wrapped position. */
function polyline(s: Sheet, pts: [number, number][], layers: CanvasRenderingContext2D[]) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const pad = 8;
  for (const [ox, oy] of wraps(s, Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) + pad, Math.max(...ys) + pad)) {
    for (const ctx of layers) {
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x + ox, y + oy) : ctx.lineTo(x + ox, y + oy)));
      ctx.stroke();
    }
  }
}

/** Short strokes: grass blades, pine needles, scratches. */
function strokes(s: Sheet, rng: Rng, n: number, colors: string[], len: number, width: number, angle: number, spread: number, height = 0) {
  s.c.lineCap = 'round';
  s.h.lineCap = 'round';
  s.c.lineWidth = width;
  s.h.lineWidth = width;
  if (height) s.h.strokeStyle = grey(0.5 + height);
  for (let i = 0; i < n; i++) {
    const x = rng.next() * s.w;
    const y = rng.next() * s.hgt;
    const a = angle + (rng.next() - 0.5) * spread;
    const l = len * (0.5 + rng.next());
    s.c.strokeStyle = colors[Math.floor(rng.next() * colors.length)];
    polyline(
      s,
      [
        [x, y],
        [x + Math.cos(a) * l, y + Math.sin(a) * l],
      ],
      height ? [s.c, s.h] : [s.c],
    );
  }
}

/** A rounded pebble or stone, lit from the top left. */
function pebble(s: Sheet, x: number, y: number, rx: number, ry: number, color: string, rot = 0) {
  const r = Math.max(rx, ry);
  for (const [ox, oy] of wraps(s, x - r, y - r, x + r, y + r)) {
    const px = x + ox;
    const py = y + oy;
    const g = s.c.createRadialGradient(px - rx * 0.3, py - ry * 0.3, 0, px, py, r);
    g.addColorStop(0, shade(color, 1.35));
    g.addColorStop(1, shade(color, 0.7));
    s.c.fillStyle = g;
    s.c.beginPath();
    s.c.ellipse(px, py, rx, ry, rot, 0, Math.PI * 2);
    s.c.fill();
    const gh = s.h.createRadialGradient(px, py, 0, px, py, r);
    gh.addColorStop(0, grey(0.95));
    gh.addColorStop(1, grey(0.5));
    s.h.fillStyle = gh;
    s.h.beginPath();
    s.h.ellipse(px, py, rx, ry, rot, 0, Math.PI * 2);
    s.h.fill();
  }
}

/** A wandering crack (in rock, ice or crust); `glow` makes it a seam of lava. */
function crack(s: Sheet, rng: Rng, x: number, y: number, steps: number, step: number, color: string, glow?: string, width = glow ? 3 : 1.6) {
  const pts: [number, number][] = [[x, y]];
  let a = rng.next() * Math.PI * 2;
  for (let k = 0; k < steps; k++) {
    a += (rng.next() - 0.5) * 1.4;
    x += Math.cos(a) * step;
    y += Math.sin(a) * step;
    pts.push([x, y]);
  }
  s.c.lineWidth = width;
  s.h.lineWidth = width + 1;
  s.c.strokeStyle = color;
  s.h.strokeStyle = grey(0.15);
  const layers = [s.c, s.h];
  if (glow) {
    s.glowUsed = true;
    s.g.strokeStyle = glow;
    s.g.lineWidth = 4;
    layers.push(s.g);
  }
  polyline(s, pts, layers);
}

/* ---------------- ground ---------------- */

function ground(theme: Theme, o: Outdoor, variant: number, seed: number, size = 512): Surface {
  const S = size;
  const k = S / 512;
  // Every variant shares the same base (so neighbouring patches match); only its extras differ.
  const rng = new Rng(seed);
  const d = new Rng(seed * 31 + variant * 977 + 5);
  const base = theme.floor;
  const s = new Sheet(S, S, base, 0.5);
  const light = shade(base, 1.18);
  const dark = shade(base, 0.78);
  switch (o.ground) {
    case 'grass': {
      blobs(s, rng, 70, [light, dark, o.ground2], 30 * k, 110 * k, 0.45, 0.15);
      if (variant === 1) blobs(s, d, 6, [theme.floorSide, shade(theme.floorSide, 1.2)], 40 * k, 90 * k, 0.55, -0.2);
      strokes(s, rng, 2600 * k * k, [shade(base, 1.35), shade(base, 0.62), shade(o.ground2, 1.2), shade(o.ground2, 0.8)], 9 * k, 1.6, -Math.PI / 2, 1.1, 0.22);
      if (variant === 2) {
        for (let i = 0; i < 70; i++) {
          const c = ['#ffffff', '#ffe066', '#ff8ad0', '#9ad0ff'][Math.floor(d.next() * 4)];
          const x = d.next() * S;
          const y = d.next() * S;
          for (let p = 0; p < 5; p++) {
            const a = (p / 5) * Math.PI * 2;
            s.c.fillStyle = c;
            s.c.beginPath();
            s.c.arc(x + Math.cos(a) * 3 * k, y + Math.sin(a) * 3 * k, 2.2 * k, 0, Math.PI * 2);
            s.c.fill();
          }
          s.c.fillStyle = '#ffcf3a';
          s.c.fillRect(x - 1.2, y - 1.2, 2.4, 2.4);
        }
      }
      for (let i = 0; i < 10; i++) pebble(s, rng.next() * S, rng.next() * S, (3 + rng.next() * 5) * k, (2 + rng.next() * 4) * k, '#8a8478', rng.next() * 3);
      break;
    }
    case 'sand': {
      blobs(s, rng, 50, [light, dark, o.ground2], 40 * k, 140 * k, 0.35, 0.1);
      // Wind ripples: wavy bands of light and shade.
      for (let y = 0; y < S; y += 14 * k) {
        const phase = rng.next() * Math.PI * 2;
        const amp = (3 + rng.next() * 4) * k;
        for (const [off, col, hv] of [
          [0, 'rgba(255,255,255,0.16)', 0.72],
          [4 * k, 'rgba(0,0,0,0.13)', 0.32],
        ] as const) {
          s.c.strokeStyle = col;
          s.h.strokeStyle = grey(hv);
          s.c.lineWidth = 2.4 * k;
          s.h.lineWidth = 3 * k;
          s.c.beginPath();
          s.h.beginPath();
          for (let x = 0; x <= S; x += 8) {
            const yy = y + off + Math.sin((x / S) * Math.PI * 4 + phase) * amp;
            if (x === 0) {
              s.c.moveTo(x, yy);
              s.h.moveTo(x, yy);
            } else {
              s.c.lineTo(x, yy);
              s.h.lineTo(x, yy);
            }
          }
          s.c.stroke();
          s.h.stroke();
        }
      }
      speckle(s, rng, 5000 * k * k, 0.25, 0.18, 1.3);
      if (variant === 2) for (let i = 0; i < 18; i++) pebble(s, d.next() * S, d.next() * S, (3 + d.next() * 6) * k, (2 + d.next() * 4) * k, shade(o.rock, 1.1), d.next() * 3);
      if (variant === 1) blobs(s, d, 10, [shade(o.rock, 0.9)], 20 * k, 50 * k, 0.35, 0.1);
      break;
    }
    case 'snow': {
      blobs(s, rng, 60, ['#ffffff', '#eef4ff', '#dde8f8'], 40 * k, 130 * k, 0.35, 0.2);
      // Soft drifts: gentle blue shading on the lee side of each bump.
      blobs(s, rng, 24, ['#b8cdee'], 20 * k, 60 * k, 0.12, -0.1);
      for (let i = 0; i < 260 * k * k; i++) {
        s.c.fillStyle = `rgba(255,255,255,${0.5 + rng.next() * 0.5})`;
        s.c.fillRect(rng.next() * S, rng.next() * S, 1.6, 1.6);
      }
      if (variant === 1) {
        // Footprints of something big wandering by.
        let x = d.next() * S;
        let y = 0;
        while (y < S) {
          pebble(s, x, y, 7 * k, 11 * k, shade(base, 0.82), 0);
          x += (d.next() - 0.5) * 30 * k;
          y += 44 * k;
        }
      }
      if (variant === 2) for (let i = 0; i < 8; i++) pebble(s, d.next() * S, d.next() * S, (5 + d.next() * 8) * k, (3 + d.next() * 5) * k, o.rock, d.next() * 3);
      break;
    }
    case 'rock': {
      blobs(s, rng, 40, [light, dark], 40 * k, 120 * k, 0.4, 0.1);
      // Big flat stones with dark seams between them.
      for (let i = 0; i < 9; i++) {
        const x = rng.next() * S;
        const y = rng.next() * S;
        pebble(s, x, y, (50 + rng.next() * 50) * k, (35 + rng.next() * 40) * k, shade(base, 0.9 + rng.next() * 0.25), rng.next() * 3);
      }
      for (let i = 0; i < 8; i++) crack(s, rng, rng.next() * S, rng.next() * S, 6, 20 * k, 'rgba(0,0,0,0.45)');
      if (variant !== 0) {
        blobs(s, d, variant === 2 ? 26 : 12, [o.ground2, shade(o.ground2, 0.8)], 14 * k, 50 * k, 0.6, 0.1);
        strokes(s, d, (variant === 2 ? 900 : 400) * k * k, [shade(o.ground2, 1.3), shade(o.ground2, 0.7)], 7 * k, 1.4, -Math.PI / 2, 1.2, 0.15);
      }
      speckle(s, rng, 2500 * k * k, 0.2, 0.25);
      break;
    }
    case 'jungle': {
      blobs(s, rng, 60, [shade(theme.floorSide, 1.1), dark, o.ground2], 30 * k, 100 * k, 0.5, 0.12);
      // Fallen leaves in every green, and a few pink petals.
      for (let i = 0; i < 520 * k * k; i++) {
        const x = rng.next() * S;
        const y = rng.next() * S;
        const pink = rng.next() < 0.04;
        s.c.fillStyle = pink ? '#ff8ad0' : [shade(base, 1.3), shade(base, 0.8), shade(o.ground2, 1.2), '#7a8a2a'][Math.floor(rng.next() * 4)];
        s.c.beginPath();
        s.c.ellipse(x, y, (pink ? 3 : 6) * k, (pink ? 2 : 2.6) * k, rng.next() * Math.PI, 0, Math.PI * 2);
        s.c.fill();
      }
      // Roots snaking across the floor (a tangle of extra ones on some patches).
      for (let i = 0; i < 3; i++) crack(s, rng, rng.next() * S, rng.next() * S, 8, 28 * k, shade(theme.floorSide, 0.8), undefined, (4 + rng.next() * 5) * k);
      if (variant === 1) for (let i = 0; i < 4; i++) crack(s, d, d.next() * S, d.next() * S, 8, 28 * k, shade(theme.floorSide, 0.8), undefined, (4 + d.next() * 5) * k);
      if (variant === 2) for (let i = 0; i < 40; i++) pebble(s, d.next() * S, d.next() * S, 3 * k, 2 * k, '#ff6fcf', 0);
      speckle(s, rng, 2000 * k * k, 0.12, 0.25);
      break;
    }
    case 'basalt': {
      blobs(s, rng, 40, [light, dark], 40 * k, 120 * k, 0.4, 0.1);
      // The tops of basalt columns: rough hexagons with dark seams. The grid repeats exactly once per
      // texture (5 columns, 6 rows), and each column's shade comes from its place in the grid, so the
      // copies drawn past the edges match and the texture tiles without a seam.
      const cols = 5;
      const rows = 6;
      const colW = S / cols;
      const rowH = S / rows;
      const rx = colW / 1.732;
      const ry = rowH / 1.5;
      const tones = Array.from({ length: cols * rows }, () => [0.85 + rng.next() * 0.35, 0.55 + rng.next() * 0.2]);
      for (let row = -1; row <= rows; row++) {
        for (let col = -1; col <= cols; col++) {
          const x = col * colW + (((row % 2) + 2) % 2 ? colW / 2 : 0);
          const y = row * rowH;
          const [tone, hv] = tones[(((row % rows) + rows) % rows) * cols + (((col % cols) + cols) % cols)];
          s.c.fillStyle = shade(base, tone);
          s.h.fillStyle = grey(hv);
          for (const ctx of [s.c, s.h]) {
            ctx.beginPath();
            for (let p = 0; p < 6; p++) {
              const a = (p / 6) * Math.PI * 2 + Math.PI / 6;
              const px = x + Math.cos(a) * (rx - 3);
              const py = y + Math.sin(a) * (ry - 3);
              if (p === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
          }
        }
      }
      if (variant !== 0) for (let i = 0; i < (variant === 2 ? 6 : 3); i++) crack(s, d, d.next() * S, d.next() * S, 7, 24 * k, '#ffb04a', '#ff6a12');
      speckle(s, rng, 2500 * k * k, 0.12, 0.3);
      break;
    }
  }
  return s.surface(o.ground === 'snow' ? 0.8 : 1.4);
}

/* ---------------- cliffs ---------------- */

/** One cliff face is 2 units wide and 3.2 tall: rock strata, cracks, and a lip of the ground on top. */
function cliff(theme: Theme, o: Outdoor, variant: number, seed: number): Surface {
  const W = 256;
  const H = 512;
  const rng = new Rng(seed);
  const s = new Sheet(W, H, o.rock, 0.5);
  // Horizontal strata, each a slightly different shade, with a lit top edge.
  let y = 0;
  while (y < H) {
    const band = (18 + rng.next() * 46) * (o.ground === 'basalt' ? 0.6 : 1);
    const c = mix(o.rock, o.rockDark, rng.next() * 0.7);
    s.rect(0, y, W, band, c, 0.45 + rng.next() * 0.25);
    s.c.fillStyle = 'rgba(255,255,255,0.08)';
    s.c.fillRect(0, y, W, 2);
    s.c.fillStyle = 'rgba(0,0,0,0.25)';
    s.c.fillRect(0, y + band - 3, W, 3);
    s.h.fillStyle = grey(0.2);
    s.h.fillRect(0, y + band - 2, W, 2);
    y += band;
  }
  if (o.ground === 'basalt') {
    // Volcanic columns: tall vertical joints.
    for (let x = 0; x < W; x += 32 + rng.next() * 20) s.seam(x, 0, 3, H, 0.5);
  }
  blobs(s, rng, 30, [shade(o.rock, 1.2), shade(o.rockDark, 0.9)], 20, 70, 0.35, 0.15);
  for (let i = 0; i < 6 + variant * 2; i++) crack(s, rng, rng.next() * W, rng.next() * H, 7, 18, 'rgba(0,0,0,0.5)', o.ground === 'basalt' && variant === 2 && i < 3 ? '#ff6a12' : undefined);
  speckle(s, rng, 3000, 0.18, 0.3);
  // The top lip: grass hanging over, a snow cap, a sand crust...
  const lip = o.ground === 'snow' ? '#f4f8ff' : o.ground === 'sand' ? theme.floor : o.ground === 'basalt' ? shade(theme.floor, 0.9) : theme.floor;
  if (o.ground !== 'rock' || variant !== 0) {
    s.rect(0, 0, W, 14, lip, 0.8);
    for (let x = 0; x < W; x += 6) {
      const d = 10 + rng.next() * (o.ground === 'grass' || o.ground === 'jungle' ? 34 : 18);
      s.c.fillStyle = shade(lip, 0.85 + rng.next() * 0.3);
      s.c.beginPath();
      s.c.moveTo(x, 10);
      s.c.lineTo(x + 6, 10);
      s.c.lineTo(x + 3, d);
      s.c.closePath();
      s.c.fill();
    }
  }
  if ((o.ground === 'jungle' || o.ground === 'grass') && variant >= 2) {
    // Hanging vines and moss.
    for (let i = 0; i < 6; i++) {
      const x = rng.next() * W;
      const len = 120 + rng.next() * 260;
      s.c.strokeStyle = shade(o.ground2, 0.8 + rng.next() * 0.4);
      s.c.lineWidth = 3;
      s.c.beginPath();
      s.c.moveTo(x, 0);
      s.c.bezierCurveTo(x + 14, len * 0.3, x - 14, len * 0.6, x + (rng.next() - 0.5) * 20, len);
      s.c.stroke();
      for (let l = 20; l < len; l += 16) {
        s.c.fillStyle = shade(o.ground2, 1 + rng.next() * 0.3);
        s.c.beginPath();
        s.c.ellipse(x + Math.sin(l * 0.05) * 8, l, 6, 3, rng.next(), 0, Math.PI * 2);
        s.c.fill();
      }
    }
  }
  if (o.ground === 'sand' && variant === 3) {
    // Old glyphs carved into the sandstone, still faintly glowing in GaScu's colours.
    const cols = ['#5e9bff', '#ff6fcf', '#ffd166'];
    for (let i = 0; i < 3; i++) {
      const gx = 40 + i * 70;
      const gy = 180 + rng.next() * 60;
      const col = cols[i];
      s.glowUsed = true;
      s.g.strokeStyle = col;
      s.c.strokeStyle = shade(col, 0.8);
      s.g.lineWidth = 4;
      s.c.lineWidth = 4;
      for (const ctx of [s.g, s.c]) {
        ctx.beginPath();
        ctx.arc(gx, gy, 18, 0, Math.PI * 2);
        ctx.moveTo(gx, gy - 30);
        ctx.lineTo(gx, gy + 30);
        ctx.stroke();
      }
    }
  }
  if (o.ground === 'snow') blobs(s, rng, 14, ['#ffffff'], 10, 40, 0.4, 0.1);
  return s.surface(1.6);
}

/** The top of a cliff column, seen from above. */
function cap(theme: Theme, o: Outdoor, seed: number): Surface {
  return ground(theme, o, 0, seed, 256);
}

/** Exposed sides of floor blocks: earth, roots and stones. */
function side(theme: Theme, o: Outdoor, seed: number): Surface {
  const S = 256;
  const rng = new Rng(seed);
  const base = o.ground === 'snow' || o.ground === 'rock' || o.ground === 'basalt' ? o.rock : theme.floorSide;
  const s = new Sheet(S, S, base, 0.5);
  blobs(s, rng, 40, [shade(base, 1.2), shade(base, 0.75)], 15, 50, 0.45, 0.15);
  for (let i = 0; i < 26; i++) pebble(s, rng.next() * S, rng.next() * S, 4 + rng.next() * 9, 3 + rng.next() * 6, shade(o.rock, 0.9 + rng.next() * 0.3), rng.next() * 3);
  if (o.ground === 'grass' || o.ground === 'jungle') {
    for (let i = 0; i < 5; i++) crack(s, rng, rng.next() * S, rng.next() * S, 6, 16, shade(theme.floorSide, 0.6), undefined, 2 + rng.next() * 3);
  }
  // The ground's own colour lips over the top edge.
  s.rect(0, 0, S, 10, theme.floor, 0.8);
  speckle(s, rng, 1500, 0.15, 0.3);
  return s.surface(1.6);
}

/** Wooden plank bridges and boardwalks (the `,` tile outdoors). */
function planks(theme: Theme, o: Outdoor, seed: number): Surface {
  const S = 512;
  const rng = new Rng(seed);
  const wood = o.ground === 'basalt' ? '#4a4048' : o.ground === 'snow' ? '#7a5a40' : '#8a6038';
  const s = new Sheet(S, S, shade(wood, 0.35), 0.1);
  const n = 6;
  const pw = S / n;
  for (let i = 0; i < n; i++) {
    const c = shade(wood, 0.85 + rng.next() * 0.3);
    s.plate(i * pw + 3, 0, pw - 6, S, c, 0.75, 4, 0.3);
    // Wood grain.
    for (let g = 0; g < 14; g++) {
      const x = i * pw + 8 + rng.next() * (pw - 16);
      s.c.strokeStyle = `rgba(0,0,0,${0.08 + rng.next() * 0.1})`;
      s.c.lineWidth = 1;
      s.c.beginPath();
      s.c.moveTo(x, 0);
      s.c.bezierCurveTo(x + 6, S * 0.3, x - 6, S * 0.6, x + 3, S);
      s.c.stroke();
    }
    for (const y of [24, S - 24]) s.bolt(i * pw + pw / 2, y, 4, '#6a6a70');
  }
  if (o.ground === 'snow') blobs(s, rng, 16, ['#ffffff'], 10, 40, 0.5, 0.1);
  return s.surface(1.6);
}

/** The valley floor far below the play area (or a lava lake under the volcano). */
function below(theme: Theme, o: Outdoor, seed: number): Surface {
  const S = 512;
  const rng = new Rng(seed);
  const s = new Sheet(S, S, o.below, 0.5);
  blobs(s, rng, 90, [shade(o.below, 1.25), shade(o.below, 0.7), theme.floor], 20, 90, 0.5, 0.2);
  if (o.belowGlow) {
    s.glowUsed = true;
    for (let i = 0; i < 40; i++) {
      const x = rng.next() * S;
      const y = rng.next() * S;
      const r = 20 + rng.next() * 70;
      const g = s.g.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, '#ffb04a');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      s.g.fillStyle = g;
      s.g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 16; i++) crack(s, rng, rng.next() * S, rng.next() * S, 8, 30, '#3a1008');
  }
  speckle(s, rng, 3000, 0.15, 0.25, 2);
  return s.surface(1);
}

/** Paints every surface for an outdoor region. Not cached: the textures are freed with the region. */
export function outdoorSurfaces(theme: Theme, o: Outdoor): DeckSurfaces {
  return {
    floors: [0, 1, 2].map((v) => ground(theme, o, v, 111)),
    grate: planks(theme, o, 121),
    ice: ice(theme, 131),
    walls: [0, 1, 2, 3].map((v) => cliff(theme, o, v, 141 + v)),
    cap: cap(theme, o, 151),
    side: side(theme, o, 161),
    abyss: below(theme, o, 171),
  };
}
