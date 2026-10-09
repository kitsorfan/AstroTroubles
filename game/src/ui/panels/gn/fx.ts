/**
 * The graphic-novel kit's atmosphere and effects: skies, nebulae, stars, god-rays, haze, clouds, sea,
 * crags, halftone dots, speed lines, cast shadows, sparks, the vignette and the paper grain. All of them
 * draw through a `Pen` so their gradients and patterns get unique ids.
 */
import { add, dir, dPoly, dSmooth, H, INK, lerp, mix, mul, type P, type Pen, r1, rng, type Stop, W } from './core';

/** A full-panel sky: a vertical gradient (top to bottom), overscanned so the camera move never shows an edge. */
export function sky(pen: Pen, s: Stop[]): string {
  return `<rect x="-80" y="-60" width="${W + 160}" height="${H + 120}" fill="${pen.lin(s)}"/>`;
}

/**
 * A nebula: overlapping soft clouds of colour around (x, y), about `r` across, with a few darker dust
 * lanes through it. `colors` go from the bright core outward.
 */
export function nebula(pen: Pen, x: number, y: number, r: number, colors: string[], seed = 1, op = 0.8): string {
  const rand = rng(seed);
  let out = '';
  colors.forEach((c, i) => {
    for (let j = 0; j < 3; j++) {
      const a = rand() * Math.PI * 2;
      const d = r * (0.1 + rand() * 0.45) * (i + 1) * 0.5;
      const rx = r * (0.35 + rand() * 0.4) * (1 - i * 0.12);
      const ry = rx * (0.35 + rand() * 0.35);
      const cx = x + Math.cos(a) * d;
      const cy = y + Math.sin(a) * d * 0.6;
      out += `<g transform="translate(${r1(cx)} ${r1(cy)}) rotate(${Math.round(rand() * 180)})">${pen.glow(0, 0, rx, c, op * (0.55 + rand() * 0.45), ry)}</g>`;
    }
  });
  // Dust lanes: soft dark wisps.
  let dust = '';
  for (let i = 0; i < 3; i++) {
    const a = rand() * Math.PI;
    const cx = x + (rand() - 0.5) * r;
    const cy = y + (rand() - 0.5) * r * 0.5;
    const l = r * (0.4 + rand() * 0.4);
    const p0: P = [cx - Math.cos(a) * l, cy - Math.sin(a) * l * 0.4];
    const p1: P = [cx + Math.cos(a) * l, cy + Math.sin(a) * l * 0.4];
    const m = lerp(p0, p1, 0.5);
    dust += pen.brush([p0, add(m, [0, -l * 0.1]), p1], l * 0.12, '#000010', [0.5, 0.5], 0.18);
  }
  return out + dust;
}

/** A field of stars in a box: tiny dots, some brighter, a few with four-point glints. */
export function starfield(pen: Pen, seed: number, n: number, x = 0, y = 0, w = W, h = H, color = '#f4f6ff'): string {
  const rand = rng(seed);
  const dots = ['', '', ''];
  let glints = '';
  for (let i = 0; i < n; i++) {
    const sx = Math.round(x + rand() * w);
    const sy = Math.round(y + rand() * h);
    const s = rand();
    dots[s < 0.6 ? 0 : s < 0.92 ? 1 : 2] += `M${sx} ${sy}h0`;
    if (s > 0.975) glints += spark(pen, sx, sy, 10 + rand() * 10, color, 0.9);
  }
  return `<g stroke="${color}" stroke-linecap="round"><path d="${dots[0]}" stroke-width="1.6" opacity=".5"/><path d="${dots[1]}" stroke-width="2.6" opacity=".8"/><path d="${dots[2]}" stroke-width="3.8"/></g>${glints}`;
}

/** A four-point glint (a lens sparkle), with a soft glow. */
export function spark(pen: Pen, x: number, y: number, r: number, color = '#ffffff', op = 1): string {
  const k = r * 0.12;
  const d = `M${r1(x)} ${r1(y - r)}Q${r1(x + k)} ${r1(y - k)} ${r1(x + r)} ${r1(y)}Q${r1(x + k)} ${r1(y + k)} ${r1(x)} ${r1(y + r)}Q${r1(x - k)} ${r1(y + k)} ${r1(x - r)} ${r1(y)}Q${r1(x - k)} ${r1(y - k)} ${r1(x)} ${r1(y - r)}Z`;
  return pen.glow(x, y, r * 0.9, color, op * 0.6) + `<path d="${d}" fill="${color}"${op < 1 ? ` opacity="${op}"` : ''}/>`;
}

/**
 * God-rays: soft beams fanning out from a light source at (x, y). `angles` are the beams' directions
 * (degrees, as `dir` measures them) and `spread` their width in degrees; they fade out over `length`.
 */
export function godRays(pen: Pen, x: number, y: number, angles: number[], spread: number, length: number, color: string, op = 0.35): string {
  const fill = pen.rad(
    [
      [0, color, op],
      [0.5, color, op * 0.45],
      [1, color, 0],
    ],
    x,
    y,
    length,
    true,
  );
  const o: P = [x, y];
  const d = angles
    .map((a, i) => {
      const w = spread * (0.6 + ((i * 37) % 10) / 15);
      return dPoly([o, add(o, mul(dir(a - w / 2), length)), add(o, mul(dir(a + w / 2), length))]);
    })
    .join('');
  return `<path d="${d}" fill="${fill}"/>`;
}

/** A band of haze across the panel from y0 to y1, thickest in the middle (atmospheric perspective). */
export function haze(pen: Pen, y0: number, y1: number, color: string, op = 0.6): string {
  const fill = pen.lin([
    [0, color, 0],
    [0.5, color, op],
    [1, color, 0],
  ]);
  return `<rect x="-80" y="${r1(y0)}" width="${W + 160}" height="${r1(y1 - y0)}" fill="${fill}"/>`;
}

/** A wash of colour fading in from the bottom of the panel (from y down), for mist or ground glow. */
export function wash(pen: Pen, y: number, color: string, op = 0.7, up = false): string {
  const fill = pen.lin(up ? [[0, color, op], [1, color, 0]] : [[0, color, 0], [1, color, op]]);
  return up ? `<rect x="-80" y="-60" width="${W + 160}" height="${r1(y + 60)}" fill="${fill}"/>` : `<rect x="-80" y="${r1(y)}" width="${W + 160}" height="${r1(H + 60 - y)}" fill="${fill}"/>`;
}

/**
 * A cumulus cloud: a bank of round puffs with a sunlit top, a shaded underside and (with `ink`) a thin
 * outline. Centre-bottom at (x, y), `w` wide. Far clouds pass no ink and a colour close to the haze.
 */
export function cloud(pen: Pen, x: number, y: number, w: number, light: string, shade: string, o: { seed?: number; ink?: boolean; rim?: number; flat?: boolean } = {}): string {
  const rand = rng(o.seed ?? 7);
  const pts: P[] = [];
  const n = 7;
  const h = w * (o.flat ? 0.22 : 0.42);
  pts.push([x - w / 2, y]);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const bump = Math.sin(t * Math.PI) * (0.55 + rand() * 0.45);
    pts.push([x - w / 2 + w * t + (rand() - 0.5) * w * 0.05, y - h * bump]);
  }
  pts.push([x + w / 2, y]);
  // Scalloped top: each puff is an arc between neighbouring points.
  let d = `M${r1(x - w / 2)} ${r1(y)}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const rr = Math.max(8, Math.hypot(b[0] - a[0], b[1] - a[1]) * (0.55 + rand() * 0.2));
    d += `A${r1(rr)} ${r1(rr)} 0 0 1 ${r1(b[0])} ${r1(b[1])}`;
  }
  d += `Q${r1(x)} ${r1(y + h * 0.12)} ${r1(x - w / 2)} ${r1(y)}Z`;
  return pen.form(d, light, { sh: h * 0.45, shade, line: o.ink ? 2 : 0, heavy: o.ink ? 2.4 : 0, rim: o.rim ?? 0, warm: 0 });
}

/**
 * A craggy rock or cliff: a jagged outline from the points (clockwise), shaded by the key light, with
 * cracks brushed in. `seed` varies the cracks.
 */
export function crag(pen: Pen, pts: P[], color: string, o: { seed?: number; sh?: number; cracks?: number; strata?: number; rim?: number; hatch?: 0 | 1 | 2 | 3; line?: number; shade?: string } = {}): string {
  const rand = rng(o.seed ?? 3);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [px, py] of pts) {
    minX = Math.min(minX, px);
    maxX = Math.max(maxX, px);
    minY = Math.min(minY, py);
    maxY = Math.max(maxY, py);
  }
  const w = maxX - minX;
  const h = maxY - minY;
  const cracks: [P[], number][] = [];
  for (let i = 0; i < (o.cracks ?? 6); i++) {
    const sx = minX + w * (0.15 + rand() * 0.7);
    const sy = minY + h * (0.1 + rand() * 0.5);
    const l = h * (0.15 + rand() * 0.3);
    const a = (rand() - 0.5) * 50;
    const p1 = add([sx, sy], mul(dir(a), l * 0.5));
    const p2 = add(p1, mul(dir(a + (rand() - 0.5) * 60), l * 0.5));
    cracks.push([[[sx, sy], p1, p2], 2 + rand() * 2.5]);
  }
  // Strata: long, gently sloping ledges across the rock, each with a lit lip above a dark line.
  const strata: [P[], number][] = [];
  const lips: [P[], number][] = [];
  for (let i = 0; i < (o.strata ?? 0); i++) {
    const sy = minY + h * (0.2 + (0.7 * (i + rand() * 0.6)) / (o.strata ?? 1));
    const x0 = minX + w * rand() * 0.3;
    const x1 = minX + w * (0.55 + rand() * 0.45);
    const tilt = (rand() - 0.5) * h * 0.06;
    const line: P[] = [
      [x0, sy],
      [(x0 + x1) / 2, sy + tilt + (rand() - 0.5) * 12],
      [x1, sy + tilt * 2],
    ];
    strata.push([line, 3 + rand() * 2.5]);
    lips.push([line.map(([lx, ly]) => [lx, ly - 4] as P), 2.5]);
  }
  const inner = pen.brushes(cracks.concat(strata), INK, [0.2, 0.6], 0.75) + (lips.length ? pen.brushes(lips, pen.light.rimColor, [0.3, 0.5], 0.55) : '');
  return pen.form(dPoly(pts), color, { sh: o.sh ?? w * 0.22, hatch: o.hatch ?? 2, rim: o.rim ?? 0, inner, line: o.line, shade: o.shade });
}

/**
 * Halftone dots over a shape (path data `d`): printed-comic texture for skies and big shadows. `size`
 * is the dot spacing; dots are drawn in `color`.
 */
export function halftone(pen: Pen, d: string, color: string, size = 9, op = 0.35, angle = 20): string {
  const id = pen.shared(`ht${Math.round(size)}${color.slice(1)}`, (id) => `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse" patternTransform="rotate(${angle})"><circle cx="${size / 2}" cy="${size / 2}" r="${r1(size * 0.26)}" fill="${color}"/></pattern>`);
  return `<path d="${d}" fill="url(#${id})" opacity="${op}"/>`;
}

/**
 * Focus lines: thin tapered wedges pointing at (cx, cy), from radius `r0` out to `r1` (past the panel
 * edges), for a moment of shock or speed. One path.
 */
export function speedLines(cx: number, cy: number, r0: number, rOut: number, n: number, seed = 5, color = '#ffffff', op = 0.5): string {
  const rand = rng(seed);
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 360 + rand() * (300 / n);
    const w = 0.4 + rand() * 1.4;
    const ri = r0 * (1 + rand() * 0.5);
    const p = add([cx, cy], mul(dir(a), ri));
    const q1 = add([cx, cy], mul(dir(a - w), rOut));
    const q2 = add([cx, cy], mul(dir(a + w), rOut));
    d += dPoly([p, q1, q2]);
  }
  return `<path d="${d}" fill="${color}" opacity="${op}"/>`;
}

/**
 * Motion streaks behind something moving: `n` tapered lines from (x, y) back along `deg` (the
 * direction the streaks trail), `l` long, spread over `spread` across.
 */
export function streaks(pen: Pen, x: number, y: number, deg: number, l: number, n: number, spread: number, color = '#ffffff', op = 0.7, seed = 9): string {
  const rand = rng(seed);
  const d = dir(deg);
  const side: P = [-d[1], d[0]];
  const list: [P[], number][] = [];
  for (let i = 0; i < n; i++) {
    const o = (i / Math.max(1, n - 1) - 0.5) * spread;
    const s = add([x, y], mul(side, o));
    const ll = l * (0.5 + rand() * 0.5);
    list.push([[add(s, mul(d, ll * 0.1 * rand())), add(s, mul(d, ll))], 2 + rand() * 3]);
  }
  return pen.brushes(list, color, [0.1, 0.9], op);
}

/**
 * A cast shadow on the ground under something at (x, y): a flat ellipse stretched away from the key
 * light, dark and hatched at its core.
 */
export function castShadow(pen: Pen, x: number, y: number, rx: number, ry: number, op = 0.45, color = INK): string {
  const dx = -pen.L[0] * rx * 0.5;
  const fill = pen.rad([
    [0, color, op],
    [0.6, color, op * 0.7],
    [1, color, 0],
  ]);
  return `<ellipse cx="${r1(x + dx)}" cy="${r1(y)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${fill}"/>`;
}

/**
 * A long cast shadow on the ground from something standing at (x, y) against a low light: a dark wedge
 * running away from the light along `deg` (as `dir` measures it), `w` wide at the feet, fading out over `len`.
 */
export function longShadow(pen: Pen, x: number, y: number, deg: number, len: number, w: number, op = 0.55): string {
  const d = dir(deg);
  const n: P = [-d[1], d[0]];
  const e = add([x, y], mul(d, len));
  const fill = pen.lin(
    [
      [0, INK, op],
      [1, INK, 0],
    ],
    r1(x),
    r1(y),
    r1(e[0]),
    r1(e[1]),
    true,
  );
  return `<path d="${dPoly([add([x, y], mul(n, w / 2)), add(e, mul(n, w * 0.8)), add(e, mul(n, -w * 0.8)), add([x, y], mul(n, -w / 2))])}" fill="${fill}"/>`;
}

/**
 * The sea from height y down to the bottom: a gradient from the horizon colour to the near colour, with
 * tapered ripple lines that get bigger toward the viewer and a glitter path under the sun at `sunX`.
 */
export function sea(pen: Pen, y: number, far: string, near: string, o: { seed?: number; sunX?: number; ripple?: string; glint?: string } = {}): string {
  const rand = rng(o.seed ?? 4);
  let out = `<rect x="-80" y="${y}" width="${W + 160}" height="${H + 60 - y}" fill="${pen.lin([[0, far], [1, near]])}"/>`;
  const rip: [P[], number][] = [];
  const glints: [P[], number][] = [];
  for (let i = 0; i < 70; i++) {
    const t = rand() ** 1.6;
    const ry = y + 6 + t * (H - y);
    const k = 0.25 + t * 1.6;
    const rx = -60 + rand() * (W + 120);
    const l = (30 + rand() * 60) * k;
    rip.push([[[rx, ry], [rx + l / 2, ry - 2 * k], [rx + l, ry]], 1.5 * k + 1]);
    if (o.sunX !== undefined && Math.abs(rx - o.sunX) < 60 + t * 220) glints.push([[[rx, ry + 3], [rx + l * 0.6, ry + 3]], 2.5 * k + 1]);
  }
  out += pen.brushes(rip, o.ripple ?? mix(near, '#ffffff', 0.35), [0.4, 0.4], 0.55);
  if (glints.length) out += pen.brushes(glints, o.glint ?? '#fff6d8', [0.5, 0.5], 0.9);
  return out;
}

/** The cinematic vignette: the corners fall off into the shadow colour, pulling the eye to the middle. */
export function vignette(pen: Pen, strength = 0.6, color = '#05040c'): string {
  const fill = pen.rad(
    [
      [0.5, color, 0],
      [0.82, color, strength * 0.55],
      [1, color, strength],
    ],
    0.5,
    0.5,
    0.75,
  );
  return `<rect x="-80" y="-60" width="${W + 160}" height="${H + 120}" fill="${fill}"/>`;
}

/**
 * Paper and ink grain over the whole panel (an feTurbulence filter). Use it at most once per panel,
 * last, at a low opacity: it is the only filter in the style.
 */
export function grain(pen: Pen, op = 0.09): string {
  const id = pen.shared('grain', (id) => `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .1  0 0 0 0 .08  0 0 0 0 .06  0 0 0 1.6 -.55"/></filter>`);
  return `<rect width="${W}" height="${H}" filter="url(#${id})" opacity="${op}"/>`;
}

/** A soft light bloom on top of everything (for a sun or a hot glow): a big faint glow plus a bright core. */
export function bloom(pen: Pen, x: number, y: number, r: number, color: string, op = 0.8): string {
  return pen.glow(x, y, r * 2.4, color, op * 0.35) + pen.glow(x, y, r, color, op) + pen.glow(x, y, r * 0.3, '#ffffff', op);
}

/**
 * A ringed gas giant hanging in the sky (the one Colchis orbits): soft bands, a night side turned away
 * from `lightDir` (from the planet toward its sun), a thin tilted ring, faded by `haze` (0..1) into the sky colour `sky`.
 */
export function gasGiant(pen: Pen, x: number, y: number, r: number, o: { lightDir?: P; haze?: number; sky?: string; bands?: string[]; tilt?: number } = {}): string {
  const bands = o.bands ?? ['#f6d7a8', '#e8a878', '#fbe8c8', '#7fc8c0', '#f0b890', '#fff0d8', '#d88a6a', '#9ad8d0'];
  const ld = o.lightDir ?? [-0.6, -0.3];
  const tilt = o.tilt ?? -14;
  const clip = pen.uid();
  pen.def(clip, `<clipPath id="${clip}"><circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}"/></clipPath>`);
  let stripes = '';
  bands.forEach((c, i) => {
    const by = y - r + (i + 0.5) * ((2 * r) / bands.length);
    stripes += `<path d="M${r1(x - r * 1.2)} ${r1(by)}Q${r1(x)} ${r1(by + r * 0.08)} ${r1(x + r * 1.2)} ${r1(by)}" stroke="${c}" stroke-width="${r1((2.3 * r) / bands.length)}" fill="none"/>`;
  });
  const night = pen.rad(
    [
      [0, '#000000', 0],
      [0.62, '#000000', 0],
      [1, '#120a2a', 0.85],
    ],
    0.5 + ld[0] * 0.25,
    0.5 + ld[1] * 0.25,
    0.72,
  );
  const ringBack = `M${r1(x - r * 1.9)} ${r1(y)}A${r1(r * 1.9)} ${r1(r * 0.4)} 0 0 1 ${r1(x + r * 1.9)} ${r1(y)}`;
  const ringFront = `M${r1(x + r * 1.9)} ${r1(y)}A${r1(r * 1.9)} ${r1(r * 0.4)} 0 0 1 ${r1(x - r * 1.9)} ${r1(y)}`;
  const ring = (d: string) => `<path d="${d}" fill="none" stroke="#f4e0c0" stroke-width="${r1(r * 0.14)}" opacity=".7" transform="rotate(${tilt} ${r1(x)} ${r1(y)})"/><path d="${d}" fill="none" stroke="#fff6e0" stroke-width="${r1(r * 0.03)}" opacity=".8" transform="rotate(${tilt} ${r1(x)} ${r1(y)})"/>`;
  let out = pen.glow(x, y, r * 1.5, '#ffe6c8', 0.35) + ring(ringBack);
  out += `<g clip-path="url(#${clip})"><circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="${bands[0]}"/>${stripes}<ellipse cx="${r1(x + r * 0.3)}" cy="${r1(y + r * 0.3)}" rx="${r1(r * 0.2)}" ry="${r1(r * 0.08)}" fill="#ff9ab8" opacity=".8"/></g>`;
  out += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="${night}"/>`;
  out += ring(ringFront);
  if (o.haze) out += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r * 1.02)}" fill="${o.sky ?? '#9ad0e0'}" opacity="${o.haze}"/>`;
  return out;
}

/**
 * Tufts of grass along a line from x0 to x1 at height y: `n` clumps of tapered blades up to `h` tall,
 * leaning a little, in `color`, with a lighter blade or two in each catching the light (`light`).
 */
export function grass(pen: Pen, x0: number, x1: number, y: number, n: number, h: number, color: string, light: string, seed = 1): string {
  const rand = rng(seed);
  const dark: [P[], number][] = [];
  const lit: [P[], number][] = [];
  for (let i = 0; i < n; i++) {
    const cx = x0 + ((x1 - x0) * (i + rand() * 0.8)) / n;
    const cy = y + (rand() - 0.5) * h * 0.3;
    const blades = 3 + Math.floor(rand() * 3);
    for (let b = 0; b < blades; b++) {
      const lean = (rand() - 0.5) * h * 0.9;
      const bh = h * (0.5 + rand() * 0.5);
      const bx = cx + (b - blades / 2) * h * 0.08;
      const blade: [P[], number] = [
        [
          [bx, cy],
          [bx + lean * 0.3, cy - bh * 0.55],
          [bx + lean, cy - bh],
        ],
        h * 0.09,
      ];
      (b === 1 ? lit : dark).push(blade);
    }
  }
  return pen.brushes(dark, color, [0.02, 0.85]) + pen.brushes(lit, light, [0.02, 0.85], 0.9);
}

/** A smooth filled silhouette (closed) through points, flat colour, no ink: for far-away shapes in the haze. */
export function silhouette(pts: P[], color: string, op = 1): string {
  return `<path d="${dSmooth(pts)}" fill="${color}"${op < 1 ? ` opacity="${op}"` : ''}/>`;
}
