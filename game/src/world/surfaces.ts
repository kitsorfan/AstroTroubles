import * as THREE from 'three';

import { Rng } from '../core/math';
import { outdoorSurfaces } from './terrain';
import type { Theme } from './themes';

/**
 * Procedural sci-fi surfaces. Every painter draws three layers at once: colour, a height map (turned
 * into a normal map so panels, seams and bolts catch the light) and a glow layer for light strips
 * and screens.
 */

export interface Surface {
  map: THREE.Texture;
  normalMap: THREE.Texture;
  emissiveMap: THREE.Texture | null;
}

export interface DeckSurfaces {
  /** Floor plate variants: plain, tread plate and hatch. */
  floors: Surface[];
  grate: Surface;
  ice: Surface;
  /** Wall panel variants: panels, vent, screen and conduit. */
  walls: Surface[];
  cap: Surface;
  side: Surface;
  abyss: Surface;
}

type Ctx = CanvasRenderingContext2D;

export function ctx(w: number, h: number): Ctx {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c.getContext('2d') as Ctx;
}

export const shade = (hex: string, f: number) => `#${new THREE.Color(hex).multiplyScalar(f).getHexString()}`;
export const mix = (a: string, b: string, t: number) => `#${new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString()}`;
export const grey = (v: number) => {
  const c = Math.round(Math.max(0, Math.min(1, v)) * 255);
  return `rgb(${c},${c},${c})`;
};

export class Sheet {
  readonly c: Ctx;
  readonly h: Ctx;
  readonly g: Ctx;
  glowUsed = false;

  constructor(
    readonly w: number,
    readonly hgt: number,
    base: string,
    baseHeight = 0.5,
  ) {
    this.c = ctx(w, hgt);
    this.h = ctx(w, hgt);
    this.g = ctx(w, hgt);
    this.c.fillStyle = base;
    this.c.fillRect(0, 0, w, hgt);
    this.h.fillStyle = grey(baseHeight);
    this.h.fillRect(0, 0, w, hgt);
    this.g.fillStyle = '#000';
    this.g.fillRect(0, 0, w, hgt);
  }

  rect(x: number, y: number, w: number, h: number, color: string | null, height: number | null) {
    if (color) {
      this.c.fillStyle = color;
      this.c.fillRect(x, y, w, h);
    }
    if (height !== null) {
      this.h.fillStyle = grey(height);
      this.h.fillRect(x, y, w, h);
    }
  }

  /** A raised (or sunken) plate with sloped edges and a lit top rim. */
  plate(x: number, y: number, w: number, h: number, color: string, height: number, bevel = 6, from = 0.5) {
    this.c.fillStyle = color;
    this.c.fillRect(x, y, w, h);
    for (let i = 0; i < bevel; i++) {
      const t = (i + 1) / bevel;
      this.h.strokeStyle = grey(from + (height - from) * t);
      this.h.lineWidth = 1.2;
      this.h.strokeRect(x + i + 0.5, y + i + 0.5, w - i * 2 - 1, h - i * 2 - 1);
    }
    this.h.fillStyle = grey(height);
    this.h.fillRect(x + bevel, y + bevel, w - bevel * 2, h - bevel * 2);
    // Light catches the top-left rim, the bottom-right sits in shade.
    this.c.fillStyle = 'rgba(255,255,255,0.10)';
    this.c.fillRect(x, y, w, 2);
    this.c.fillRect(x, y, 2, h);
    this.c.fillStyle = 'rgba(0,0,0,0.22)';
    this.c.fillRect(x, y + h - 2, w, 2);
    this.c.fillRect(x + w - 2, y, 2, h);
  }

  seam(x: number, y: number, w: number, h: number, dark = 0.45) {
    this.c.fillStyle = `rgba(0,0,0,${dark})`;
    this.c.fillRect(x, y, w, h);
    this.h.fillStyle = grey(0.05);
    this.h.fillRect(x, y, w, h);
  }

  bolt(x: number, y: number, r: number, color: string) {
    const gc = this.c.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    gc.addColorStop(0, shade(color, 1.5));
    gc.addColorStop(1, shade(color, 0.55));
    this.c.fillStyle = gc;
    this.c.beginPath();
    this.c.arc(x, y, r, 0, Math.PI * 2);
    this.c.fill();
    const gh = this.h.createRadialGradient(x, y, 0, x, y, r);
    gh.addColorStop(0, grey(1));
    gh.addColorStop(1, grey(0.55));
    this.h.fillStyle = gh;
    this.h.beginPath();
    this.h.arc(x, y, r, 0, Math.PI * 2);
    this.h.fill();
  }

  glow(x: number, y: number, w: number, h: number, color: string, colorLayer = color) {
    this.glowUsed = true;
    this.g.fillStyle = color;
    this.g.fillRect(x, y, w, h);
    this.c.fillStyle = colorLayer;
    this.c.fillRect(x, y, w, h);
  }

  /** Horizontal pipe with round shading across its height. */
  pipeH(y: number, r: number, color: string, x0 = 0, x1 = this.w) {
    const gc = this.c.createLinearGradient(0, y - r, 0, y + r);
    gc.addColorStop(0, shade(color, 0.55));
    gc.addColorStop(0.35, shade(color, 1.35));
    gc.addColorStop(1, shade(color, 0.35));
    this.c.fillStyle = gc;
    this.c.fillRect(x0, y - r, x1 - x0, r * 2);
    const gh = this.h.createLinearGradient(0, y - r, 0, y + r);
    gh.addColorStop(0, grey(0.55));
    gh.addColorStop(0.5, grey(1));
    gh.addColorStop(1, grey(0.55));
    this.h.fillStyle = gh;
    this.h.fillRect(x0, y - r, x1 - x0, r * 2);
  }

  pipeV(x: number, r: number, color: string, y0 = 0, y1 = this.hgt) {
    const gc = this.c.createLinearGradient(x - r, 0, x + r, 0);
    gc.addColorStop(0, shade(color, 0.5));
    gc.addColorStop(0.35, shade(color, 1.35));
    gc.addColorStop(1, shade(color, 0.35));
    this.c.fillStyle = gc;
    this.c.fillRect(x - r, y0, r * 2, y1 - y0);
    const gh = this.h.createLinearGradient(x - r, 0, x + r, 0);
    gh.addColorStop(0, grey(0.55));
    gh.addColorStop(0.5, grey(1));
    gh.addColorStop(1, grey(0.55));
    this.h.fillStyle = gh;
    this.h.fillRect(x - r, y0, r * 2, y1 - y0);
  }

  /** Fine speckle, scratches and soft stains so nothing looks freshly printed. */
  wear(rng: Rng, amount: number, stain: string) {
    const { c, w, hgt } = this;
    for (let i = 0; i < 40 * amount; i++) {
      const x = rng.next() * w;
      const y = rng.next() * hgt;
      const r = 10 + rng.next() * 50;
      const gr = c.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, stain);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalAlpha = 0.05 + rng.next() * 0.08;
      c.fillStyle = gr;
      c.fillRect(x - r, y - r, r * 2, r * 2);
    }
    c.globalAlpha = 1;
    c.lineWidth = 1;
    for (let i = 0; i < 30 * amount; i++) {
      const x = rng.next() * w;
      const y = rng.next() * hgt;
      const a = rng.next() * Math.PI;
      const l = 6 + rng.next() * 30;
      c.strokeStyle = `rgba(255,255,255,${0.04 + rng.next() * 0.07})`;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      c.stroke();
    }
    for (let i = 0; i < 900 * amount; i++) {
      const v = rng.next();
      c.fillStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * 0.08})` : `rgba(0,0,0,${v * 0.12})`;
      c.fillRect(rng.next() * w, rng.next() * hgt, 1.5, 1.5);
    }
  }

  surface(normalStrength: number): Surface {
    const map = new THREE.CanvasTexture(this.c.canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    const normalMap = new THREE.CanvasTexture(heightToNormal(this.h, this.w, this.hgt, normalStrength));
    normalMap.colorSpace = THREE.NoColorSpace;
    let emissiveMap: THREE.Texture | null = null;
    if (this.glowUsed) {
      emissiveMap = new THREE.CanvasTexture(this.g.canvas);
      emissiveMap.colorSpace = THREE.SRGBColorSpace;
    }
    for (const t of [map, normalMap, emissiveMap]) {
      if (!t) continue;
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 8;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.generateMipmaps = true;
    }
    return { map, normalMap, emissiveMap };
  }
}

/** Sobel filter over a grey height map; returns a tangent-space normal map canvas. */
function heightToNormal(h: Ctx, w: number, hh: number, strength: number): HTMLCanvasElement {
  const src = h.getImageData(0, 0, w, hh).data;
  const out = ctx(w, hh);
  const img = out.createImageData(w, hh);
  const d = img.data;
  const at = (x: number, y: number) => src[(((y + hh) % hh) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < hh; y++) {
    for (let x = 0; x < w; x++) {
      const gx = at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1);
      const gy = at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1);
      // Canvas rows run downward while texture v runs upward, hence +gy for the green channel.
      let nx = -gx * strength;
      let ny = gy * strength;
      let nz = 1;
      const l = Math.hypot(nx, ny, nz);
      nx /= l;
      ny /= l;
      nz /= l;
      const i = (y * w + x) * 4;
      d[i] = (nx * 0.5 + 0.5) * 255;
      d[i + 1] = (ny * 0.5 + 0.5) * 255;
      d[i + 2] = (nz * 0.5 + 0.5) * 255;
      d[i + 3] = 255;
    }
  }
  out.putImageData(img, 0, 0);
  return out.canvas;
}

/* ---------------- floors ---------------- */

function floorPlate(theme: Theme, variant: number, seed: number, style: FloorStyle): Surface {
  const S = 512;
  const rng = new Rng(seed);
  const base = theme.floor;
  const s = new Sheet(S, S, shade(base, 0.8), 0.3);
  // Cell border: a deep seam shared with the neighbouring plates.
  s.seam(0, 0, S, 5, 0.6);
  s.seam(0, 0, 5, S, 0.6);
  s.plate(5, 5, S - 5, S - 5, base, 0.75, 9, 0.3);
  if (variant === 0) {
    // Two half plates with a recessed service panel.
    s.seam(S / 2 - 2, 5, 4, S - 5, 0.35);
    s.plate(60, 70, S / 2 - 110, S - 140, shade(base, 0.9), 0.55, 6, 0.75);
    s.plate(S / 2 + 50, 70, S / 2 - 110, S - 140, shade(base, 0.92), 0.55, 6, 0.75);
    for (const [x, y] of [
      [26, 26],
      [S / 2 - 24, 26],
      [26, S - 22],
      [S / 2 - 24, S - 22],
      [S / 2 + 26, 26],
      [S - 22, 26],
      [S / 2 + 26, S - 22],
      [S - 22, S - 22],
    ]) {
      s.bolt(x, y, 6, shade(base, 0.9));
    }
    // Faded stencil marks.
    s.c.fillStyle = 'rgba(255,255,255,0.12)';
    for (let i = 0; i < 3; i++) s.c.fillRect(80 + i * 18, S - 110, 10, 30);
  } else if (variant === 1) {
    // Diamond tread plate.
    s.h.save();
    s.c.save();
    for (let y = 30; y < S - 20; y += 28) {
      for (let x = 30; x < S - 20; x += 28) {
        const flip = ((x + y) / 28) % 2 === 0;
        const cx = x + ((y / 28) % 2) * 14;
        if (cx > S - 24) continue;
        for (const [g, col] of [
          [s.h, grey(0.95)],
          [s.c, shade(base, 1.18)],
        ] as const) {
          g.save();
          g.translate(cx, y);
          g.rotate(flip ? 0.78 : -0.78);
          g.fillStyle = col;
          g.fillRect(-9, -2.5, 18, 5);
          g.restore();
        }
      }
    }
    s.h.restore();
    s.c.restore();
    for (const [x, y] of [
      [24, 24],
      [S - 20, 24],
      [24, S - 20],
      [S - 20, S - 20],
    ]) {
      s.bolt(x, y, 7, shade(base, 0.9));
    }
  } else {
    // Round maintenance hatch with a glowing grille.
    const cx = S / 2;
    const cy = S / 2;
    const accent = theme.accent;
    s.c.fillStyle = shade(base, 0.62);
    s.c.beginPath();
    s.c.arc(cx, cy, 170, 0, Math.PI * 2);
    s.c.fill();
    for (let i = 0; i < 14; i++) {
      s.h.strokeStyle = grey(0.75 - i * 0.03);
      s.h.lineWidth = 2;
      s.h.beginPath();
      s.h.arc(cx, cy, 170 - i, 0, Math.PI * 2);
      s.h.stroke();
    }
    s.h.fillStyle = grey(0.35);
    s.h.beginPath();
    s.h.arc(cx, cy, 156, 0, Math.PI * 2);
    s.h.fill();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      s.bolt(cx + Math.cos(a) * 163, cy + Math.sin(a) * 163, 6, shade(base, 1));
    }
    for (let y = cy - 120; y <= cy + 120; y += 22) {
      const half = Math.sqrt(Math.max(0, 125 * 125 - (y - cy) ** 2));
      s.rect(cx - half, y - 5, half * 2, 10, '#05070a', 0.02);
      s.glow(cx - half + 6, y - 2, half * 2 - 12, 4, shade(accent, 0.55), shade(accent, 0.45));
    }
  }
  if (style === 'garden') {
    for (let i = 0; i < 18; i++) {
      const x = rng.next() * S;
      const y = rng.next() < 0.5 ? rng.next() * 60 : S - rng.next() * 60;
      const r = 20 + rng.next() * 40;
      const g = s.c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(70,120,40,0.35)');
      g.addColorStop(1, 'rgba(70,120,40,0)');
      s.c.fillStyle = g;
      s.c.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }
  const stain = style === 'soot' ? 'rgba(20,10,5,1)' : style === 'frost' ? 'rgba(220,245,255,1)' : 'rgba(0,0,0,1)';
  s.wear(rng, style === 'soot' ? 1.4 : 1, stain);
  // Grime collects along the seams.
  const edge = s.c.createLinearGradient(0, 0, 0, 40);
  edge.addColorStop(0, 'rgba(0,0,0,0.25)');
  edge.addColorStop(1, 'rgba(0,0,0,0)');
  s.c.fillStyle = edge;
  s.c.fillRect(0, 0, S, 40);
  return s.surface(2.2);
}

function grate(theme: Theme, seed: number): Surface {
  const S = 512;
  const s = new Sheet(S, S, '#07090c', 0.02);
  const metal = shade(theme.floorSide, 1.25);
  s.plate(0, 0, S, 26, metal, 0.85, 5, 0.3);
  s.plate(0, S - 26, S, 26, metal, 0.85, 5, 0.3);
  s.plate(0, 0, 26, S, metal, 0.85, 5, 0.3);
  s.plate(S - 26, 0, 26, S, metal, 0.85, 5, 0.3);
  // Glow leaking up from the machinery below.
  const g = s.g.createRadialGradient(S / 2, S / 2, 20, S / 2, S / 2, S * 0.6);
  g.addColorStop(0, shade(theme.accent, 0.5));
  g.addColorStop(1, shade(theme.accent, 0.08));
  s.g.fillStyle = g;
  s.g.fillRect(26, 26, S - 52, S - 52);
  s.glowUsed = true;
  for (let x = 38; x < S - 26; x += 26) s.plate(x, 26, 12, S - 52, metal, 0.8, 3, 0.2);
  for (let y = 90; y < S - 60; y += 110) s.plate(26, y, S - 52, 10, shade(metal, 0.85), 0.9, 3, 0.2);
  for (const [x, y] of [
    [13, 13],
    [S - 13, 13],
    [13, S - 13],
    [S - 13, S - 13],
  ]) {
    s.bolt(x, y, 6, metal);
  }
  s.wear(new Rng(seed), 0.6, 'rgba(0,0,0,1)');
  return s.surface(2.5);
}

export function ice(theme: Theme, seed: number): Surface {
  const S = 512;
  const rng = new Rng(seed);
  const s = new Sheet(S, S, theme.ice, 0.5);
  s.seam(0, 0, S, 4, 0.18);
  s.seam(0, 0, 4, S, 0.18);
  // Frozen plates under a frosty crust.
  s.plate(4, 4, S - 4, S - 4, theme.ice, 0.6, 12, 0.4);
  for (let i = 0; i < 60; i++) {
    const x = rng.next() * S;
    const y = rng.next() * S;
    const r = 20 + rng.next() * 70;
    const g = s.c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.22)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    s.c.fillStyle = g;
    s.c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  s.c.lineWidth = 1.5;
  s.h.lineWidth = 2;
  for (let i = 0; i < 14; i++) {
    let x = rng.next() * S;
    let y = rng.next() * S;
    s.c.strokeStyle = 'rgba(255,255,255,0.55)';
    s.h.strokeStyle = grey(0.35);
    s.c.beginPath();
    s.h.beginPath();
    s.c.moveTo(x, y);
    s.h.moveTo(x, y);
    for (let k = 0; k < 5; k++) {
      x += (rng.next() - 0.5) * 90;
      y += (rng.next() - 0.5) * 90;
      s.c.lineTo(x, y);
      s.h.lineTo(x, y);
    }
    s.c.stroke();
    s.h.stroke();
  }
  return s.surface(1.2);
}

/* ---------------- walls ---------------- */

/** One wall face is 2 units wide and 3.2 tall; the texture is 256 x 512 with v = 0 at the floor. */
function wall(theme: Theme, variant: number, seed: number, stripes: boolean): Surface {
  const W = 256;
  const H = 512;
  const rng = new Rng(seed);
  const base = theme.wall;
  const dark = shade(base, 0.55);
  const accent = theme.wallTrim;
  const s = new Sheet(W, H, base, 0.5);
  // Frame posts on both edges (half a post each, so neighbouring faces join into one).
  s.plate(0, 0, 12, H, shade(base, 0.8), 0.9, 4, 0.5);
  s.plate(W - 12, 0, 12, H, shade(base, 0.8), 0.9, 4, 0.5);
  // Top frame and ceiling light strip.
  s.plate(0, 0, W, 34, dark, 0.85, 5, 0.4);
  s.plate(12, 44, W - 24, 26, shade(base, 0.4), 0.7, 4, 0.5);
  s.glow(20, 51, W - 40, 12, accent, mix(accent, '#ffffff', 0.5));
  // Kick plate along the floor.
  s.plate(0, H - 66, W, 66, shade(base, 0.62), 0.8, 6, 0.4);
  if (stripes) {
    s.c.save();
    s.c.beginPath();
    s.c.rect(8, H - 56, W - 16, 40);
    s.c.clip();
    for (let x = -60; x < W + 60; x += 30) {
      s.c.fillStyle = '#e2b53a';
      s.c.beginPath();
      s.c.moveTo(x, H - 56);
      s.c.lineTo(x + 15, H - 56);
      s.c.lineTo(x + 55, H - 16);
      s.c.lineTo(x + 40, H - 16);
      s.c.fill();
    }
    s.c.restore();
    s.c.fillStyle = 'rgba(0,0,0,0.25)';
    s.c.fillRect(8, H - 56, W - 16, 40);
  } else {
    for (let x = 28; x < W; x += 50) s.bolt(x, H - 34, 5, shade(base, 0.8));
  }
  const top = 84;
  const bottom = H - 80;
  if (variant === 0) {
    // Two stacked panels.
    const mid = Math.round((top + bottom) / 2);
    s.plate(22, top, W - 44, mid - top - 6, shade(base, 1.05), 0.78, 7, 0.5);
    s.plate(22, mid + 6, W - 44, bottom - mid - 6, shade(base, 0.98), 0.78, 7, 0.5);
    s.seam(40, mid + 40, W - 80, 3, 0.3);
    for (const y of [top + 14, mid - 20, mid + 20, bottom - 14]) {
      s.bolt(36, y, 4.5, shade(base, 0.9));
      s.bolt(W - 36, y, 4.5, shade(base, 0.9));
    }
    s.rect(W / 2 - 30, mid + 60, 60, 18, shade(base, 0.7), 0.6);
    s.c.fillStyle = 'rgba(255,255,255,0.3)';
    s.c.fillRect(W / 2 - 22, mid + 66, 30, 6);
  } else if (variant === 1) {
    // Big vent grille with a pair of pipes.
    s.plate(22, top, W - 44, bottom - top, shade(base, 0.95), 0.75, 7, 0.5);
    s.rect(44, top + 40, W - 120, bottom - top - 80, '#07090c', 0.1);
    for (let y = top + 48; y < bottom - 44; y += 16) s.plate(44, y, W - 120, 7, shade(base, 0.7), 0.7, 2, 0.1);
    s.pipeV(W - 52, 11, shade(base, 1.2), top, bottom);
    s.pipeV(W - 28, 7, mix(base, accent, 0.25), top, bottom);
    for (const y of [top + 30, bottom - 30]) s.rect(W - 66, y - 5, 50, 10, shade(base, 0.6), 0.9);
  } else if (variant === 2) {
    // Wall terminal with a glowing display.
    s.plate(22, top, W - 44, bottom - top, shade(base, 1), 0.78, 7, 0.5);
    s.rect(40, top + 26, W - 80, 150, '#040608', 0.2);
    const scr = shade(accent, 0.35);
    s.glow(46, top + 32, W - 92, 138, scr, shade(accent, 0.18));
    s.g.strokeStyle = accent;
    s.c.strokeStyle = shade(accent, 0.8);
    for (const g of [s.g, s.c]) {
      g.lineWidth = 2;
      g.beginPath();
      for (let x = 0; x <= W - 110; x += 4) {
        const y = top + 110 + Math.sin(x * 0.09 + seed) * 18 + Math.sin(x * 0.23) * 6;
        if (x === 0) g.moveTo(52 + x, y);
        else g.lineTo(52 + x, y);
      }
      g.stroke();
    }
    for (let i = 0; i < 5; i++) s.glow(56 + i * 28, top + 44, 18, 8 + rng.next() * 30, accent, shade(accent, 0.6));
    for (let i = 0; i < 4; i++) {
      const col = ['#ff5e6a', '#7dff9a', '#ffd166', accent][i];
      s.glow(52 + i * 40, top + 200, 12, 12, col, col);
      s.rect(52 + i * 40 + 20, top + 202, 12, 8, shade(base, 0.6), 0.7);
    }
    s.plate(40, top + 240, W - 80, bottom - top - 262, shade(base, 0.92), 0.7, 5, 0.78);
  } else {
    // Conduits: a bundle of pipes and cables running along the wall.
    s.plate(22, top, W - 44, bottom - top, shade(base, 0.96), 0.72, 7, 0.5);
    s.rect(22, top + 120, W - 44, 190, shade(base, 0.5), 0.3);
    s.pipeH(top + 150, 16, shade(base, 1.3));
    s.pipeH(top + 196, 11, mix(base, accent, 0.35));
    s.pipeH(top + 232, 9, '#2b2f36');
    s.pipeH(top + 262, 13, shade(base, 1.1));
    s.pipeH(top + 292, 6, '#1d2026');
    for (const x of [40, W - 56]) s.plate(x, top + 124, 16, 184, shade(base, 0.75), 0.95, 3, 0.5);
    // Warning sign.
    s.c.fillStyle = '#e2b53a';
    s.c.beginPath();
    s.c.moveTo(W / 2, top + 26);
    s.c.lineTo(W / 2 + 34, top + 86);
    s.c.lineTo(W / 2 - 34, top + 86);
    s.c.fill();
    s.c.fillStyle = '#1b1b1b';
    s.c.fillRect(W / 2 - 4, top + 46, 8, 22);
    s.c.fillRect(W / 2 - 4, top + 72, 8, 7);
  }
  s.wear(rng, 0.8, 'rgba(0,0,0,1)');
  // Dirt creeps up from the floor.
  const g = s.c.createLinearGradient(0, H, 0, H - 140);
  g.addColorStop(0, 'rgba(0,0,0,0.35)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  s.c.fillStyle = g;
  s.c.fillRect(0, H - 140, W, 140);
  return s.surface(2);
}

function cap(theme: Theme, seed: number): Surface {
  const S = 256;
  const base = shade(theme.wall, 0.5);
  const s = new Sheet(S, S, base, 0.5);
  s.seam(0, 0, S, 3, 0.5);
  s.seam(0, 0, 3, S, 0.5);
  s.plate(3, 3, S - 3, S - 3, base, 0.7, 5, 0.5);
  for (let i = 1; i < 4; i++) s.seam(3, (S * i) / 4, S - 3, 2, 0.25);
  for (const [x, y] of [
    [16, 16],
    [S - 14, 16],
    [16, S - 14],
    [S - 14, S - 14],
  ]) {
    s.bolt(x, y, 4, shade(base, 1.3));
  }
  s.wear(new Rng(seed), 0.5, 'rgba(0,0,0,1)');
  return s.surface(1.5);
}

/** Sides of floor blocks and the shafts beneath them: hull plating, ribs and girders. */
function side(theme: Theme, seed: number): Surface {
  const S = 256;
  const base = theme.floorSide;
  const s = new Sheet(S, S, base, 0.5);
  for (let y = 0; y < S; y += 64) {
    s.plate(0, y, S, 60, shade(base, 1.05), 0.65, 4, 0.4);
    s.seam(0, y + 60, S, 4, 0.5);
  }
  s.plate(S / 2 - 18, 0, 36, S, shade(base, 0.8), 0.95, 5, 0.5);
  for (let y = 16; y < S; y += 32) s.bolt(S / 2, y, 4, shade(base, 1.2));
  s.plate(0, 0, S, 14, shade(base, 1.3), 0.9, 3, 0.5);
  s.wear(new Rng(seed), 0.7, 'rgba(0,0,0,1)');
  return s.surface(1.8);
}

/** The deep floor of the ship's machinery shafts, seen far below the walkways. */
function abyss(theme: Theme, seed: number): Surface {
  const S = 512;
  const rng = new Rng(seed);
  const base = shade(theme.floorSide, 0.55);
  const s = new Sheet(S, S, base, 0.4);
  for (let i = 0; i < 4; i++) {
    for (let k = 0; k < 4; k++) s.plate(i * 128 + 6, k * 128 + 6, 116, 116, shade(base, 0.9 + rng.next() * 0.25), 0.7, 5, 0.4);
  }
  for (let i = 0; i < 26; i++) {
    const x = rng.next() * S;
    const y = rng.next() * S;
    const col = rng.next() < 0.7 ? theme.accent : rng.next() < 0.5 ? '#ffd166' : '#ff5e6a';
    s.glow(x, y, 5 + rng.next() * 10, 4, col, col);
  }
  s.pipeH(200, 14, shade(base, 1.6));
  s.pipeV(330, 18, shade(base, 1.4));
  s.wear(rng, 1, 'rgba(0,0,0,1)');
  return s.surface(1.5);
}

type FloorStyle = 'metal' | 'garden' | 'soot' | 'frost';

/** Paints every surface for one deck. Not cached: the textures are freed with the deck to save memory. */
export function deckSurfaces(theme: Theme, key: string): DeckSurfaces {
  if (theme.outdoor) return outdoorSurfaces(theme, theme.outdoor);
  const style: FloorStyle = key === 'hydro' ? 'garden' : key === 'engine' ? 'soot' : key === 'cryo' ? 'frost' : 'metal';
  const stripes = key === 'engine' || key === 'security';
  const out: DeckSurfaces = {
    floors: [0, 1, 2].map((v) => floorPlate(theme, v, 11 + v, style)),
    grate: grate(theme, 21),
    ice: ice(theme, 31),
    walls: [0, 1, 2, 3].map((v) => wall(theme, v, 41 + v, stripes && v !== 2)),
    cap: cap(theme, 51),
    side: side(theme, 61),
    abyss: abyss(theme, 71),
  };
  return out;
}
