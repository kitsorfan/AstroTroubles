/**
 * The storybook kit's basics: the palette, the ink outline, gradients, limbs and a seeded random
 * generator for scattering stars and leaves. Everything returns SVG markup as a string.
 *
 * Characters only use flat fills and see-through shading shapes, so they never need gradient ids;
 * the scenery that does takes an `id` prefix (the panel id) so ids stay unique on the page.
 */
import { PANEL_H, PANEL_W } from '../ids';

export const W = PANEL_W;
export const H = PANEL_H;

/** The storybook palette. */
export const C = {
  ink: '#1a1630',
  navy: '#0b1030',
  navy2: '#1a1f4a',
  star: '#f4f6ff',
  pink: '#ff6fcf',
  pinkLight: '#ffd6f2',
  cyan: '#7fe6ff',
  gold: '#ffd166',
  orange: '#ff8a3d',
  green: '#5f9a3a',
  green2: '#86b84e',
  sky: '#3f86d6',
  lava: '#ff6a12',
  lavaDark: '#3a1810',
  olive: '#3e4a2a',
  red: '#a8202a',
  hello: '#5e9bff',
  white: '#ffffff',
  grey: '#9aa6ba',
  steel: '#6b7488',
};

/** Rounds to one decimal so the markup stays small. */
export const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * The bold ink outline used on characters and props (`w` = stroke width). Whole widths use short
 * shared classes to keep the markup small.
 */
export const ink = (w = 6) => (Number.isInteger(w) && w >= 2 && w <= 8 ? `class="sb${w}"` : `class="sbI" stroke-width="${r1(w)}"`);

const WIDTHS = [2, 3, 4, 5, 6, 7, 8];

/**
 * Shared styles and shapes, the same in every panel (prefixed so they can't clash with the page):
 * the ink classes, a leaf (`#sbLf`, coloured by the `fill` of its `<use>`), a five-petal flower
 * (`#sbFl`, petals from `fill`, centre from `color`), a big jungle leaf (`#sbBl`, `fill`), a dark
 * Heart petal (`#sbPt`, edge glow from `color`) and a bloom petal (`#sbBp`, `fill`). A panel only
 * carries the shapes it uses.
 */
const STYLE = `<style>.sbI,${WIDTHS.map((w) => `.sb${w}`).join(',')}{stroke:${C.ink};stroke-linejoin:round;stroke-linecap:round}${WIDTHS.map((w) => `.sb${w}{stroke-width:${w}px}`).join('')}.sbL{fill:none;stroke-linecap:round;stroke-linejoin:round}</style>`;
const SHAPES: Record<string, string> = {
  sbLf: `<path d="M0 0Q30 -28 76 0Q30 28 0 0Z" class="sb4"/><path d="M6 0Q36 -4 64 0" fill="none" stroke="#fff" stroke-width="3" opacity=".3" stroke-linecap="round"/>`,
  sbFl: `<g class="sb3"><circle cy="-12.4" r="9.6"/><circle cx="11.8" cy="-3.8" r="9.6"/><circle cx="7.3" cy="10" r="9.6"/><circle cx="-7.3" cy="10" r="9.6"/><circle cx="-11.8" cy="-3.8" r="9.6"/></g><circle r="7.2" fill="currentColor" class="sb3"/>`,
  sbBl: `<path d="M0 0Q60 -70 170 -40Q240 -10 250 0Q240 10 170 40Q60 70 0 0Z" class="sb5"/><path d="M10 0Q120 -6 236 0M90 -2L120 -40M150 -2L180 -32M90 2L120 40M150 2L180 32" fill="none" stroke="#000" stroke-width="4" opacity=".18"/>`,
  sbPt: `<path d="M-46 -60Q-70 -170 0 -210Q70 -170 46 -60Z" fill="#3a1838" class="sb5"/><path d="M-30 -80Q-40 -160 0 -190" fill="none" stroke="currentColor" stroke-width="5" opacity=".6" stroke-linecap="round"/>`,
  sbBp: `<path d="M0 -36Q-44 -90 0 -140Q44 -90 0 -36Z" class="sb5"/><path d="M0 -50Q-10 -90 0 -122" fill="none" stroke="#fff" stroke-width="4" opacity=".5" stroke-linecap="round"/>`,
};
const shared = (body: string) =>
  STYLE +
  `<defs>${Object.entries(SHAPES)
    .filter(([k]) => body.includes(`#${k}"`))
    .map(([k, v]) => `<g id="${k}">${v}</g>`)
    .join('')}</defs>`;

/** A group placed at (x, y), scaled, optionally mirrored (facing left) and rotated. */
export function at(x: number, y: number, s: number, body: string, flip = false, rot = 0): string {
  const sc = s === 1 && !flip ? '' : flip ? ` scale(${-s} ${s})` : ` scale(${s})`;
  const ro = rot ? ` rotate(${rot})` : '';
  return `<g transform="translate(${r1(x)} ${r1(y)})${sc}${ro}">${body}</g>`;
}

/** A straight polyline path ("M x y L x y ..."). */
export const poly = (pts: number[][]) => pts.map((p, i) => `${i ? 'L' : 'M'}${r1(p[0])} ${r1(p[1])}`).join('');

/** A smooth path through points (quadratic curves through the midpoints). */
export function smooth(pts: number[][], close = false): string {
  if (pts.length < 3) return poly(pts) + (close ? 'Z' : '');
  const mid = (a: number[], b: number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const n = pts.length;
  if (close) {
    let d = `M${r1(mid(pts[n - 1], pts[0])[0])} ${r1(mid(pts[n - 1], pts[0])[1])}`;
    for (let i = 0; i < n; i++) {
      const m = mid(pts[i], pts[(i + 1) % n]);
      d += `Q${r1(pts[i][0])} ${r1(pts[i][1])} ${r1(m[0])} ${r1(m[1])}`;
    }
    return d + 'Z';
  }
  let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
  for (let i = 1; i < n - 1; i++) {
    const m = i === n - 2 ? pts[n - 1] : mid(pts[i], pts[i + 1]);
    d += `Q${r1(pts[i][0])} ${r1(pts[i][1])} ${r1(m[0])} ${r1(m[1])}`;
  }
  return d;
}

/**
 * An outlined limb (arm, leg, vine) along points: a thick ink stroke under a coloured one, so any
 * angle looks hand-inked. `w` is the coloured width.
 */
export function limb(pts: number[][], color: string, w: number, outline = 6, curved = false): string {
  const d = curved ? smooth(pts) : poly(pts);
  return `<path d="${d}" class="sbL sbI" stroke-width="${w + outline * 2}"/><path d="${d}" class="sbL" stroke="${color}" stroke-width="${w}"/>`;
}

/** Several outlined limbs of the same colour in one go (e.g. both legs). */
export function limbs(list: number[][][], color: string, w: number, outline = 6): string {
  const d = list.map(poly).join('');
  return `<path d="${d}" class="sbL sbI" stroke-width="${w + outline * 2}"/><path d="${d}" class="sbL" stroke="${color}" stroke-width="${w}"/>`;
}

/** A gradient stop list: [offset, colour, opacity?]. */
type Stop = [number, string, number?];
const stops = (s: Stop[]) =>
  s.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('');

/** A vertical (or angled) linear gradient definition. */
export const lin = (id: string, s: Stop[], x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops(s)}</linearGradient>`;

/** A radial gradient definition (centre in 0..1 units of the shape's box). */
export const rad = (id: string, s: Stop[], cx = 0.5, cy = 0.5, r = 0.5) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(s)}</radialGradient>`;

/** A soft round glow that fades to nothing: define once with `glowDef`, place with `glow`. */
export const glowDef = (id: string, color: string, core = 0.9) =>
  rad(id, [
    [0, color, core],
    [0.4, color, core * 0.45],
    [1, color, 0],
  ]);
export const glow = (id: string, x: number, y: number, r: number, op = 1, ry = r) =>
  `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(r)}" ry="${r1(ry)}" fill="url(#${id})"${op < 1 ? ` opacity="${op}"` : ''}/>`;

/** A full-panel background rectangle with a vertical gradient. */
export const backdrop = (id: string, s: Stop[]) =>
  `<defs>${lin(id, s)}</defs><rect width="${W}" height="${H}" fill="url(#${id})"/>`;

/** Darkened edges that pull the eye to the middle. */
export const vignette = (id: string, strength = 0.55, color = '#0b0820') =>
  `<defs>${rad(id, [
    [0.55, color, 0],
    [1, color, strength],
  ])}</defs><rect width="${W}" height="${H}" fill="url(#${id})"/>`;

/** A seeded random generator (mulberry32), so the scattering is the same every time. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A field of stars in a box, a few of them twinkling crosses. */
export function stars(seed: number, n: number, x = 0, y = 0, w = W, h = H, color: string = C.star): string {
  const rand = rng(seed);
  // Each star is a zero-length round-capped stroke: three sizes, three paths.
  const dots = ['', '', ''];
  let sparks = '';
  for (let i = 0; i < n; i++) {
    const sx = Math.round(x + rand() * w);
    const sy = Math.round(y + rand() * h);
    const s = rand();
    if (s > 0.94) sparks += `M${sx - 9} ${sy}H${sx + 9}M${sx} ${sy - 9}V${sy + 9}`;
    dots[s < 0.5 ? 0 : s < 0.85 ? 1 : 2] += `M${sx} ${sy}h0`;
  }
  return `<g stroke="${color}" stroke-linecap="round"><path d="${dots[0]}" stroke-width="2.4" opacity=".55"/><path d="${dots[1]}" stroke-width="3.6"/><path d="${dots[2]}" stroke-width="5.4"/>${sparks ? `<path d="${sparks}" stroke-width="2" opacity=".8"/>` : ''}</g>`;
}

/** A puffy cloud made of overlapping bumps (centre-bottom at x, y). */
export function cloud(x: number, y: number, s: number, color: string, op = 1): string {
  const d = `M-120 0Q-130 -40 -80 -46Q-70 -90 -20 -84Q10 -120 56 -88Q100 -96 104 -50Q140 -40 124 0Z`;
  return at(x, y, s, `<path d="${d}" fill="${color}"${op < 1 ? ` opacity="${op}"` : ''}/>`);
}

/** A rolling ridge of hills across the panel from height y (amp = bump size), filled to the bottom. */
export function ridge(seed: number, y: number, amp: number, color: string, bumps = 6, x0 = -20, x1 = W + 20): string {
  const rand = rng(seed);
  const pts: number[][] = [];
  for (let i = 0; i <= bumps; i++) pts.push([x0 + ((x1 - x0) * i) / bumps, y - rand() * amp]);
  return `<path d="${smooth(pts)}L${x1} ${H + 10}L${x0} ${H + 10}Z" fill="${color}"/>`;
}

/** The whole panel's svg wrapper. */
export const panel = (body: string) => `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${shared(body)}${squeeze(body)}</svg>`;

/** Shortens path data (no space before a minus sign, no leading zero) to keep the markup small. */
const squeeze = (svg: string) => svg.replace(/ d="([^"]*)"/g, (_, d: string) => ` d="${d.replace(/ -/g, '-').replace(/(^|[^\d.])0\./g, '$1.')}"`);

/** A colour mixed toward another (t = 0 keeps a, 1 gives b). Both as #rrggbb. */
export function mix(a: string, b: string, t: number): string {
  const p = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  let out = '#';
  for (let i = 0; i < 3; i++) out += Math.round(p(a, i) + (p(b, i) - p(a, i)) * t).toString(16).padStart(2, '0');
  return out;
}
