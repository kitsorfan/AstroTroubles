import { BlurStyle, PaintStyle, Skia, StrokeCap, type SkCanvas, type SkPaint, type SkPath } from '@shopify/react-native-skia';

const cache = new Map<string, SkPaint>();

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Lighten (amt > 0) or darken (amt < 0) a hex color. */
export function shade(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = (v: number) => {
    const out = amt >= 0 ? v + (255 - v) * amt : v * (1 + amt);
    return Math.max(0, Math.min(255, Math.round(out)));
  };
  return `#${[f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const m = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `#${[m(r1, r2), m(g1, g2), m(b1, b2)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function fill(color: string, alpha = 1): SkPaint {
  const key = `f${color}${alpha}`;
  let p = cache.get(key);
  if (!p) {
    p = Skia.Paint();
    p.setAntiAlias(true);
    p.setColor(Skia.Color(color));
    if (alpha < 1) p.setAlphaf(alpha);
    cache.set(key, p);
  }
  return p;
}

export function stroke(color: string, width: number, alpha = 1): SkPaint {
  const key = `s${color}${width}${alpha}`;
  let p = cache.get(key);
  if (!p) {
    p = Skia.Paint();
    p.setAntiAlias(true);
    p.setColor(Skia.Color(color));
    p.setStyle(PaintStyle.Stroke);
    p.setStrokeWidth(width);
    p.setStrokeCap(StrokeCap.Round);
    if (alpha < 1) p.setAlphaf(alpha);
    cache.set(key, p);
  }
  return p;
}

export function glow(color: string, sigma: number, alpha = 1): SkPaint {
  const key = `g${color}${sigma}${alpha}`;
  let p = cache.get(key);
  if (!p) {
    p = Skia.Paint();
    p.setAntiAlias(true);
    p.setColor(Skia.Color(color));
    if (alpha < 1) p.setAlphaf(alpha);
    p.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, Math.max(0.5, sigma), true));
    cache.set(key, p);
  }
  return p;
}

export function rect(c: SkCanvas, x: number, y: number, w: number, h: number, p: SkPaint) {
  c.drawRect(Skia.XYWHRect(x, y, w, h), p);
}

export function rrect(c: SkCanvas, x: number, y: number, w: number, h: number, r: number, p: SkPaint) {
  c.drawRRect(Skia.RRectXY(Skia.XYWHRect(x, y, w, h), r, r), p);
}

export function circle(c: SkCanvas, x: number, y: number, r: number, p: SkPaint) {
  c.drawCircle(x, y, r, p);
}

export function oval(c: SkCanvas, cx: number, cy: number, rx: number, ry: number, p: SkPaint) {
  c.drawOval(Skia.XYWHRect(cx - rx, cy - ry, rx * 2, ry * 2), p);
}

export function line(c: SkCanvas, x0: number, y0: number, x1: number, y1: number, p: SkPaint) {
  c.drawLine(x0, y0, x1, y1, p);
}

export function polyPath(pts: number[], close = true): SkPath {
  const b = Skia.PathBuilder.Make();
  b.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) b.lineTo(pts[i], pts[i + 1]);
  if (close) b.close();
  return b.detach();
}

export function poly(c: SkCanvas, pts: number[], p: SkPaint, close = true) {
  c.drawPath(polyPath(pts, close), p);
}

export function star(c: SkCanvas, cx: number, cy: number, r: number, p: SkPaint, points = 5, inner = 0.45) {
  const pts: number[] = [];
  for (let i = 0; i < points * 2; i++) {
    const rr = i % 2 === 0 ? r : r * inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    pts.push(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  poly(c, pts, p);
}

/** Deterministic pseudo-random value in [0, 1) for a tile. */
export function hash(x: number, y: number, n = 0): number {
  let h = (x * 374761393 + y * 668265263 + n * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export function withTranslate(c: SkCanvas, x: number, y: number, fn: () => void) {
  c.save();
  c.translate(x, y);
  fn();
  c.restore();
}
