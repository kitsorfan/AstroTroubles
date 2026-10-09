/**
 * The graphic-novel kit's core: the ink palette, small 2D geometry helpers, and the `Pen` every drawing
 * goes through. A pen knows the panel's lighting (a key light, a rim light and a shadow tint), hands
 * out ids that are unique on the page (prefixed with the panel id), collects the shared `<defs>`, and
 * draws the two basic marks of the style:
 *
 * - `form`: a filled shape with cel shadow on the side away from the key light, hatching in the deep
 *   part of that shadow, a rim-light line on the side facing the rim light, and an ink outline that is
 *   heavier on the shadow side.
 * - `brush`: a tapered ink stroke (thin, thick, thin), for creases, folds, cracks and accents.
 *
 * See STYLE.md next to this file for how to use it.
 */
import { PANEL_H, PANEL_W } from '../ids';

export const W = PANEL_W;
export const H = PANEL_H;

/** A point or a direction. */
export type P = [number, number];

/** The ink: a blue-black, never pure black. */
export const INK = '#0d0a16';

/** Rounds to one decimal so the markup stays small. */
export const r1 = (n: number) => Math.round(n * 10) / 10;

/** Point maths. */
export const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]];
export const mul = (a: P, k: number): P => [a[0] * k, a[1] * k];
export const len = (a: P) => Math.hypot(a[0], a[1]);
export const unit = (a: P): P => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l];
};
/** The direction turned a quarter turn (to the right of travel on screen, y down). */
export const perp = (a: P): P => [-a[1], a[0]];
export const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const dot = (a: P, b: P) => a[0] * b[0] + a[1] * b[1];
/** A direction from an angle in degrees: 0 points down, 90 right, 180 up, -90 left. */
export const dir = (deg: number): P => [Math.sin((deg * Math.PI) / 180), Math.cos((deg * Math.PI) / 180)];
/** The angle (as `dir` measures it) of a direction. */
export const angle = (a: P) => (Math.atan2(a[0], a[1]) * 180) / Math.PI;
/** A point rotated by `deg` (clockwise on screen) around the origin. */
export const rotP = (a: P, deg: number): P => {
  const r = (deg * Math.PI) / 180;
  return [a[0] * Math.cos(r) - a[1] * Math.sin(r), a[0] * Math.sin(r) + a[1] * Math.cos(r)];
};

/** "x y" for path data. */
export const pt = (a: P) => `${r1(a[0])} ${r1(a[1])}`;

/** A straight polyline path through the points. */
export const dPoly = (pts: P[], close = true) => pts.map((p, i) => `${i ? 'L' : 'M'}${pt(p)}`).join('') + (close ? 'Z' : '');

/** A smooth path through the points (quadratic curves through the midpoints), optionally closed. */
export function dSmooth(pts: P[], close = true): string {
  const n = pts.length;
  if (n < 3) return dPoly(pts, close);
  const mid = (a: P, b: P): P => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  if (close) {
    let d = `M${pt(mid(pts[n - 1], pts[0]))}`;
    for (let i = 0; i < n; i++) d += `Q${pt(pts[i])} ${pt(mid(pts[i], pts[(i + 1) % n]))}`;
    return d + 'Z';
  }
  let d = `M${pt(pts[0])}`;
  for (let i = 1; i < n - 1; i++) d += `Q${pt(pts[i])} ${pt(i === n - 2 ? pts[n - 1] : mid(pts[i], pts[i + 1]))}`;
  return d;
}

/** Samples a Catmull-Rom spline through the points (`k` samples per span), for strokes that bend smoothly. */
export function spline(pts: P[], k = 6): P[] {
  if (pts.length < 3) {
    const out: P[] = [];
    for (let i = 0; i <= k; i++) out.push(lerp(pts[0], pts[pts.length - 1], i / k));
    return out;
  }
  const out: P[] = [pts[0]];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 1; j <= k; j++) {
      const t = j / k;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return out;
}

/** Two colours multiplied (like a multiply layer): the result is never lighter than either. */
export function multiply(a: string, b: string): string {
  const p = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  let out = '#';
  for (let i = 0; i < 3; i++) out += Math.round((p(a, i) * p(b, i)) / 255).toString(16).padStart(2, '0');
  return out;
}

/** A colour mixed toward another (t = 0 keeps a, 1 gives b). Both as #rrggbb. */
export function mix(a: string, b: string, t: number): string {
  const p = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  let out = '#';
  for (let i = 0; i < 3; i++) out += Math.round(p(a, i) + (p(b, i) - p(a, i)) * t).toString(16).padStart(2, '0');
  return out;
}

/** A seeded random generator (mulberry32), so scattering is the same every time. */
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

/** A group placed at (x, y), scaled, optionally mirrored and rotated (degrees, clockwise). */
export function at(x: number, y: number, s: number, body: string, flip = false, rot = 0): string {
  const tr = x || y ? `translate(${r1(x)} ${r1(y)})` : '';
  const sc = s === 1 && !flip ? '' : flip ? ` scale(${-r1(s * 1000) / 1000} ${r1(s * 1000) / 1000})` : ` scale(${r1(s * 1000) / 1000})`;
  const ro = rot ? ` rotate(${r1(rot)})` : '';
  const t = (tr + sc + ro).trim();
  return t ? `<g transform="${t}">${body}</g>` : body;
}

/** A gradient stop list: [offset, colour, opacity?]. */
export type Stop = [number, string, number?];
const stops = (s: Stop[]) => s.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('');

/** The panel's lighting. Directions point from the subject toward the light, on screen ([-1, -1] = top left). */
export interface Light {
  /** Where the key light comes from. */
  key: P;
  /** The key light's colour: lit surfaces lean a little toward it. */
  keyColor: string;
  /** Where the rim (back) light comes from: usually opposite the key, or from behind. */
  rim: P;
  rimColor: string;
  /** The colour shadows lean toward (a deep blue, purple or teal). */
  shadow: string;
  /** How far shadows lean toward `shadow` (0..1, default 0.5). */
  depth?: number;
  /** The angle (degrees) of the hatching lines (default 35). */
  hatchAngle?: number;
}

/** Shared per panel: the id prefix and counter and the collected defs. */
interface Store {
  prefix: string;
  n: number;
  defs: Map<string, string>;
  /** Path data already defined, by shape (so repeats share a definition). */
  shapes: Map<string, string>;
}

/** Options for `Pen.form`. */
export interface FormOpts {
  /** How deep the cel shadow reaches in from the side away from the key light (local units; 0 = none). */
  sh?: number;
  /** The shadow colour (default: the fill leaned toward the panel's shadow tint). */
  shade?: string;
  /** Hatching in the deep half of the shadow: 0 none, 1 lines, 2 cross-hatch, 3 dense cross-hatch. */
  hatch?: 0 | 1 | 2 | 3;
  /** Width of the rim-light line on the side facing the rim light (0 = none). */
  rim?: number;
  /** Ink outline width (0 = no outline). Default 2.6. */
  line?: number;
  /** Extra ink weight on the shadow side (default 0.9 x line on forms with `sh` of 14 or more, else none). */
  heavy?: number;
  /** The long axis of an elongated form (a limb, a torso): its shadow then runs along its side. */
  axis?: P;
  /** Markup drawn inside the shape (clipped to it) after the shading: patterns, panel lines, decals. */
  inner?: string;
  /** Lean the lit side toward the key light colour (default 0.12). */
  warm?: number;
  /** A gradient or pattern to fill the lit side with instead of the flat colour (a `url(#...)`). */
  paint?: string;
}

/**
 * The drawing context for one panel. Make one with `Pen.scene(panelId, light)`, draw with it, and wrap
 * the result with `pen.svg(body)`. Characters drawn mirrored or rotated get a `pen.local(flip, rot)`
 * so their shading still follows the panel's light.
 */
export class Pen {
  private constructor(
    private readonly st: Store,
    readonly light: Light,
    /** The key and rim light directions in this pen's local coordinates (unit vectors). */
    readonly L: P,
    readonly R: P,
  ) {}

  /** A pen for a whole panel. `id` is the panel id: every id this pen makes starts with it. */
  static scene(id: string, light: Light): Pen {
    return new Pen({ prefix: id, n: 0, defs: new Map(), shapes: new Map() }, light, unit(light.key), unit(light.rim));
  }

  /** The same pen for drawing inside a mirrored (`flip`), rotated (`rot` degrees) group. */
  local(flip = false, rot = 0): Pen {
    const f = (p: P): P => rotP(flip ? [-p[0], p[1]] : p, -rot);
    return new Pen(this.st, this.light, f(this.L), f(this.R));
  }

  /** The same panel (ids and defs) under a different light, e.g. for a backlit giant against the sun. */
  relight(light: Partial<Light>): Pen {
    const l = { ...this.light, ...light };
    return new Pen(this.st, l, unit(l.key), unit(l.rim));
  }

  /** A new id, unique on the page. */
  uid(): string {
    return `${this.st.prefix}-${(this.st.n++).toString(36)}`;
  }

  /** Adds a definition once (by key) to the panel's `<defs>`. */
  def(key: string, markup: string): void {
    if (!this.st.defs.has(key)) this.st.defs.set(key, markup);
  }

  /** The id of a shared definition with this key (made with `make(id)` the first time). */
  shared(key: string, make: (id: string) => string): string {
    const id = `${this.st.prefix}_${key}`;
    if (!this.st.defs.has(id)) this.st.defs.set(id, make(id));
    return id;
  }

  /** A linear gradient (x1 y1 x2 y2 in 0..1 of the shape's box, or user units with `user`). Returns its `url(#...)`. */
  lin(s: Stop[], x1 = 0, y1 = 0, x2 = 0, y2 = 1, user = false): string {
    const id = this.uid();
    this.def(id, `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${user ? ' gradientUnits="userSpaceOnUse"' : ''}>${stops(s)}</linearGradient>`);
    return `url(#${id})`;
  }

  /** A radial gradient (centre and radius in 0..1 of the shape's box, or user units with `user`). Returns its `url(#...)`. */
  rad(s: Stop[], cx = 0.5, cy = 0.5, r = 0.5, user = false, fx?: number, fy?: number): string {
    const id = this.uid();
    const f = fx === undefined ? '' : ` fx="${fx}" fy="${fy}"`;
    this.def(id, `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${f}${user ? ' gradientUnits="userSpaceOnUse"' : ''}>${stops(s)}</radialGradient>`);
    return `url(#${id})`;
  }

  /** A colour as it looks lit by the key light. */
  lit(c: string, k = 0.12): string {
    return mix(c, this.light.keyColor, k);
  }

  /**
   * A colour as it looks in shadow: multiplied by the panel's shadow tint (which keeps it rich instead of
   * muddy), `k` = how deep (0..1, default the light's `depth`).
   */
  dark(c: string, k = this.light.depth ?? 0.5): string {
    return mix(c, multiply(c, this.light.shadow), Math.min(1, k * 1.6));
  }

  /** The hatching pattern for a level (1 lines, 2 cross-hatch, 3 dense cross-hatch), as a `url(#...)`. */
  hatch(level: 1 | 2 | 3, color: string = INK): string {
    const a = this.light.hatchAngle ?? 35;
    const id = this.shared(`h${level}${color === INK ? '' : color.slice(1)}`, (id) => {
      const s = level === 3 ? 4.4 : 6;
      const w = level === 3 ? 1.5 : 1.35;
      const lines = level === 1 ? `M0 0V${s}` : `M0 0V${s}M0 0H${s}`;
      return `<pattern id="${id}" width="${s}" height="${s}" patternUnits="userSpaceOnUse" patternTransform="rotate(${a})"><path d="${lines}" stroke="${color}" stroke-width="${w}" opacity=".85"/></pattern>`;
    });
    return `url(#${id})`;
  }

  /**
   * A shaded, inked shape (see the file comment). `d` is its path data in this pen's coordinates. The
   * shadow depth `sh` should be about a third of the shape's width for round forms, less for flat ones.
   *
   * Layers: the ink outline under everything (so the lit layer on top thins it on the lit side and the
   * line swells on the shadow side), an extra offset ink weight on the shadow side, the shadow colour,
   * hatching, the lit colour shifted toward the light, and the rim line, all clipped to the shape.
   */
  form(d: string, fill: string, o: FormOpts = {}): string {
    // Identical shapes (a hand, an eye) share one definition and one clip path.
    let k = this.st.shapes.get(d);
    if (!k) {
      k = this.uid();
      this.st.shapes.set(d, k);
      this.def(k, `<path id="${k}" d="${d}"/>`);
    }
    const sh = o.sh ?? 0;
    const line = o.line ?? 2.6;
    const heavy = o.heavy ?? (sh >= 14 ? line * 0.9 : 0);
    const shade = o.shade ?? this.dark(fill);
    const lit = o.paint ?? this.lit(fill, o.warm ?? 0.12);
    // A long form (a limb, a torso) is shaded across its length, not along it: the light's shift is
    // turned to cross the form's axis.
    let Ls = this.L;
    if (o.axis) {
      const a = unit(o.axis);
      const along = dot(Ls, a);
      Ls = unit(sub(Ls, mul(a, along * 0.85)));
    }
    const T = (v: P, m: number) => `translate(${r1(v[0] * m)} ${r1(v[1] * m)})`;
    let out = '';
    if (line && heavy) out += `<use href="#${k}" fill="${INK}" transform="${T(Ls, -heavy)}"/>`;
    const needClip = sh > 0 || !!o.inner || !!o.rim;
    const stroke = line ? ` stroke="${INK}" stroke-width="${r1(line * 2)}"` : '';
    if (!needClip) {
      out += `<use href="#${k}" fill="${lit}"${stroke}/>`;
      if (line) out += `<use href="#${k}" fill="${lit}"/>`;
    } else {
      this.def(k + '_c', `<clipPath id="${k}_c"><use href="#${k}"/></clipPath>`);
      out += `<use href="#${k}" fill="${sh > 0 ? shade : lit}"${stroke}/><g clip-path="url(#${k}_c)">`;
      if (sh > 0 && o.hatch) out += `<use href="#${k}" fill="${this.hatch(o.hatch)}"/>`;
      // The rim goes under the lit layer, so it only shows along the shadowed edge (where a back light would catch it).
      if (o.rim) out += `<use href="#${k}" fill="none" stroke="${this.light.rimColor}" stroke-width="${r1(o.rim * 2)}" transform="${T(this.R, -(line * 0.75 + o.rim * 0.5))}"/>`;
      if (sh > 0) out += `<use href="#${k}" fill="${lit}" transform="${T(Ls, sh)}"/>`;
      else if (line) out += `<use href="#${k}" fill="${lit}" transform="${T(Ls, line * 0.5)}"/>`;
      if (o.inner) out += o.inner;
      out += '</g>';
    }
    return out;
  }

  /**
   * A tapered brush stroke along the points (a smooth curve through them): it swells to `w` in the
   * middle and thins to a point at the ends (`taper` = how much of each end tapers, 0..1).
   */
  brush(pts: P[], w: number, color: string = INK, taper: [number, number] = [0.35, 0.45], op = 1): string {
    return `<path d="${brushD(pts, w, taper)}" fill="${color}"${op < 1 ? ` opacity="${op}"` : ''}/>`;
  }

  /** Several brush strokes of one colour in a single path (cheaper): each is [points, width]. */
  brushes(list: [P[], number][], color: string = INK, taper: [number, number] = [0.35, 0.45], op = 1): string {
    return `<path d="${list.map(([p, w]) => brushD(p, w, taper)).join('')}" fill="${color}"${op < 1 ? ` opacity="${op}"` : ''}/>`;
  }

  /** A soft round glow (radial gradient fading to nothing), shared per colour. */
  glow(x: number, y: number, r: number, color: string, op = 1, ry = r): string {
    const id = this.shared(`g${color.slice(1)}`, (id) => `<radialGradient id="${id}">${stops([[0, color, 0.9], [0.35, color, 0.4], [1, color, 0]])}</radialGradient>`);
    return `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(r)}" ry="${r1(ry)}" fill="url(#${id})"${op < 1 ? ` opacity="${r1(op * 100) / 100}"` : ''}/>`;
  }

  /**
   * The whole panel: an `<svg>` with the collected defs and the body. Mark parallax layers in the body
   * with `layer(depth, ...)`.
   */
  svg(body: string): string {
    const defs = [...this.st.defs.values()].join('');
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" stroke-linejoin="round" stroke-linecap="round"><defs>${squeeze(defs)}</defs>${squeeze(body)}</svg>`;
  }
}

/**
 * A parallax layer: a top-level group the full-screen panel drifts at its own speed (1 = with the
 * camera, below 1 = farther away and slower, above 1 = nearer and faster). Use 2 to 5 per panel, in
 * order from back to front.
 */
export const layer = (depth: number, body: string) => `<g data-depth="${depth}">${body}</g>`;

/** The outline of a tapered stroke (used by `Pen.brush`). */
export function brushD(pts: P[], w: number, taper: [number, number] = [0.35, 0.45]): string {
  const s = spline(pts, pts.length > 3 ? 3 : 4);
  const n = s.length;
  const cum = [0];
  for (let i = 1; i < n; i++) cum.push(cum[i - 1] + len(sub(s[i], s[i - 1])));
  const total = cum[n - 1] || 1;
  const left: P[] = [];
  const right: P[] = [];
  for (let i = 0; i < n; i++) {
    const t = cum[i] / total;
    const a = taper[0] ? Math.min(1, t / taper[0]) : 1;
    const b = taper[1] ? Math.min(1, (1 - t) / taper[1]) : 1;
    const ease = (v: number) => Math.sin((v * Math.PI) / 2);
    const hw = (w / 2) * Math.max(0.06, ease(a) * ease(b));
    const tan = unit(sub(s[Math.min(n - 1, i + 1)], s[Math.max(0, i - 1)]));
    const nrm = perp(tan);
    left.push(add(s[i], mul(nrm, hw)));
    right.push(add(s[i], mul(nrm, -hw)));
  }
  return dPoly([...left, ...right.reverse()]);
}

/**
 * Shortens path data to keep the markup small: big shapes (over 150 units across, all absolute
 * commands) lose their decimals, and no path keeps a space before a minus sign or a leading zero.
 */
const squeeze = (svg: string) =>
  svg.replace(/ d="([^"]*)"/g, (_, d: string) => {
    if (/^[MLQCZ\d\s.-]+$/.test(d)) {
      const nums = d.match(/-?\d+(\.\d+)?/g) ?? [];
      let lo = Infinity;
      let hi = -Infinity;
      for (const s of nums) {
        const v = +s;
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
      if (hi - lo > 150) d = d.replace(/-?\d+\.\d+/g, (s) => String(Math.round(+s)));
    }
    return ` d="${d.replace(/ -/g, '-').replace(/(^|[^\d.])0\./g, '$1.')}"`;
  });
