import { createPicture, type SkCanvas, type SkPicture } from '@shopify/react-native-skia';

import { tileAt } from '../../game/engine/mapParser';
import type { DeckTheme, ParsedDeck, TileKind } from '../../game/types';
import { circle, fill, glow, hash, line, oval, poly, rect, rrect, shade, stroke } from './draw';

const SOLIDISH: ReadonlySet<TileKind> = new Set(['wall', 'void']);

function drawStars(c: SkCanvas, x: number, y: number, T: number, tx: number, ty: number) {
  for (let i = 0; i < 3; i++) {
    const h = hash(tx, ty, i + 11);
    if (h < 0.55) {
      const sx = x + hash(tx, ty, i + 21) * T;
      const sy = y + hash(tx, ty, i + 31) * T;
      circle(c, sx, sy, 0.4 + h * 1.1, fill('#ffffff', 0.25 + h * 0.6));
    }
  }
}

function floorBase(c: SkCanvas, x: number, y: number, T: number, th: DeckTheme, tx: number, ty: number) {
  const alt = (tx + ty) % 2 === 0;
  rect(c, x, y, T, T, fill(alt ? th.floor : th.floorAlt));
  rect(c, x + 0.5, y + 0.5, T - 1, T - 1, stroke(shade(th.floor, -0.35), 1, 0.8));
  if (hash(tx, ty, 1) < 0.25) {
    const r = T * 0.04;
    circle(c, x + T * 0.15, y + T * 0.15, r, fill(shade(th.floor, 0.25), 0.7));
    circle(c, x + T * 0.85, y + T * 0.85, r, fill(shade(th.floor, 0.25), 0.7));
  }
  if (hash(tx, ty, 2) < 0.08) line(c, x + T * 0.2, y + T * 0.7, x + T * 0.55, y + T * 0.62, stroke(shade(th.floor, -0.4), 1));
}

export function drawTile(c: SkCanvas, deck: ParsedDeck, tx: number, ty: number, T: number) {
  const th = deck.def.theme;
  const kind = tileAt(deck, tx, ty);
  const x = tx * T;
  const y = ty * T;
  switch (kind) {
    case 'void':
      rect(c, x, y, T, T, fill(th.bg));
      drawStars(c, x, y, T, tx, ty);
      break;
    case 'wall': {
      const below = tileAt(deck, tx, ty + 1);
      const front = !SOLIDISH.has(below);
      rect(c, x, y, T, T, fill(th.wall));
      rect(c, x + 1, y + 1, T - 2, T * 0.3, fill(shade(th.wall, 0.08)));
      if (front) {
        rect(c, x, y + T * 0.62, T, T * 0.38, fill(shade(th.wall, -0.35)));
        line(c, x, y + T * 0.62, x + T, y + T * 0.62, stroke(th.wallTop, 1.5, 0.9));
        if (hash(tx, ty, 3) < 0.3) rect(c, x + T * 0.3, y + T * 0.72, T * 0.4, T * 0.1, fill(th.accent, 0.35));
      }
      const above = tileAt(deck, tx, ty - 1);
      if (!SOLIDISH.has(above)) line(c, x, y + 0.75, x + T, y + 0.75, stroke(th.wallTop, 1.5, 0.7));
      if (!SOLIDISH.has(tileAt(deck, tx - 1, ty))) line(c, x + 0.75, y, x + 0.75, y + T, stroke(th.wallTop, 1, 0.5));
      if (!SOLIDISH.has(tileAt(deck, tx + 1, ty))) line(c, x + T - 0.75, y, x + T - 0.75, y + T, stroke(th.wallTop, 1, 0.5));
      break;
    }
    case 'floor':
      floorBase(c, x, y, T, th, tx, ty);
      break;
    case 'grate':
      rect(c, x, y, T, T, fill(shade(th.floor, -0.3)));
      for (let i = 1; i < 5; i++) line(c, x + 2, y + (T * i) / 5, x + T - 2, y + (T * i) / 5, stroke(shade(th.floor, 0.12), 1.2));
      rect(c, x + 0.5, y + 0.5, T - 1, T - 1, stroke(shade(th.floor, -0.5), 1));
      break;
    case 'carpet': {
      rect(c, x, y, T, T, fill(shade(th.floor, 0.06)));
      const p = fill(shade(th.floor, 0.18), 0.6);
      if ((tx + ty) % 2 === 0) circle(c, x + T / 2, y + T / 2, T * 0.06, p);
      if (hash(tx, ty, 4) < 0.1) rect(c, x + T * 0.2, y + T * 0.2, T * 0.6, T * 0.6, stroke(shade(th.floor, 0.2), 1, 0.4));
      break;
    }
    case 'soil': {
      rect(c, x, y, T, T, fill('#2c2116'));
      for (let i = 0; i < 4; i++) {
        circle(c, x + hash(tx, ty, 40 + i) * T, y + hash(tx, ty, 50 + i) * T, T * 0.035, fill('#4a3826'));
      }
      break;
    }
    case 'vent':
      rect(c, x, y, T, T, fill('#1a1412'));
      for (let i = 0; i < 4; i++) rrect(c, x + T * 0.15, y + T * (0.14 + i * 0.2), T * 0.7, T * 0.1, 2, fill('#3d2a20'));
      rect(c, x + 0.5, y + 0.5, T - 1, T - 1, stroke('#5c3b28', 1));
      break;
    case 'bloom':
      floorBase(c, x, y, T, th, tx, ty);
      for (let i = 0; i < 3; i++) {
        const bx = x + (0.2 + hash(tx, ty, 60 + i) * 0.6) * T;
        const by = y + (0.2 + hash(tx, ty, 70 + i) * 0.6) * T;
        circle(c, bx, by, T * (0.12 + hash(tx, ty, 80 + i) * 0.12), fill('#b03a8f', 0.55));
      }
      break;
    case 'window': {
      rect(c, x, y, T, T, fill('#03050c'));
      drawStars(c, x, y, T, tx, ty);
      rect(c, x + 1, y + 1, T - 2, T - 2, stroke(th.wallTop, 2, 0.6));
      line(c, x, y + T / 2, x + T, y + T / 2, stroke(th.wall, 2));
      break;
    }
    case 'machine': {
      floorBase(c, x, y, T, th, tx, ty);
      rrect(c, x + 2, y + 2, T - 4, T - 4, 3, fill('#2a3140'));
      rect(c, x + 4, y + 4, T - 8, T * 0.18, fill('#3a4458'));
      const lit = hash(tx, ty, 5);
      circle(c, x + T * 0.28, y + T * 0.66, T * 0.07, fill(lit < 0.5 ? th.accent : '#ffb347', 0.9));
      line(c, x + T * 0.45, y + T * 0.66, x + T * 0.8, y + T * 0.66, stroke('#566178', 2));
      line(c, x + T * 0.45, y + T * 0.8, x + T * 0.8, y + T * 0.8, stroke('#566178', 2));
      break;
    }
    case 'pod': {
      floorBase(c, x, y, T, th, tx, ty);
      rrect(c, x + T * 0.12, y + T * 0.06, T * 0.76, T * 0.88, T * 0.3, fill('#c9d6e6'));
      rrect(c, x + T * 0.22, y + T * 0.16, T * 0.56, T * 0.6, T * 0.22, fill('#7fd6ff', 0.55));
      oval(c, x + T * 0.42, y + T * 0.35, T * 0.12, T * 0.07, fill('#ffffff', 0.5));
      circle(c, x + T * 0.5, y + T * 0.85, T * 0.05, fill('#7dff9a'));
      break;
    }
    case 'plant': {
      rect(c, x, y, T, T, fill('#2c2116'));
      rrect(c, x + 2, y + 2, T - 4, T - 4, 3, fill('#3b2a1a'));
      for (let i = 0; i < 5; i++) {
        const lx = x + (0.2 + hash(tx, ty, 90 + i) * 0.6) * T;
        const ly = y + (0.2 + hash(tx, ty, 95 + i) * 0.6) * T;
        circle(c, lx, ly, T * 0.17, fill(i % 2 ? '#3f8a3a' : '#5fae4a'));
      }
      if (hash(tx, ty, 7) < 0.3) circle(c, x + T * 0.6, y + T * 0.4, T * 0.08, fill('#ff5e6a'));
      break;
    }
    case 'crate': {
      floorBase(c, x, y, T, th, tx, ty);
      rrect(c, x + 3, y + 3, T - 6, T - 6, 2, fill('#7a5230'));
      rect(c, x + 3, y + 3, T - 6, T - 6, stroke('#4a311c', 1.5));
      line(c, x + 4, y + 4, x + T - 4, y + T - 4, stroke('#4a311c', 1.5));
      line(c, x + T - 4, y + 4, x + 4, y + T - 4, stroke('#4a311c', 1.5));
      break;
    }
    case 'console': {
      floorBase(c, x, y, T, th, tx, ty);
      rrect(c, x + 2, y + T * 0.25, T - 4, T * 0.6, 3, fill('#1e2636'));
      rect(c, x + T * 0.15, y + T * 0.33, T * 0.7, T * 0.22, fill(th.accent, 0.65));
      line(c, x + T * 0.2, y + T * 0.44, x + T * 0.6, y + T * 0.44, stroke('#ffffff', 1, 0.6));
      break;
    }
    case 'water': {
      rect(c, x, y, T, T, fill('#0f3b5a'));
      line(c, x + T * 0.15, y + T * 0.35, x + T * 0.5, y + T * 0.3, stroke('#5fb8e6', 1.2, 0.7));
      line(c, x + T * 0.45, y + T * 0.7, x + T * 0.85, y + T * 0.65, stroke('#5fb8e6', 1.2, 0.7));
      break;
    }
    case 'rubble': {
      floorBase(c, x, y, T, th, tx, ty);
      poly(c, [x + T * 0.1, y + T * 0.8, x + T * 0.3, y + T * 0.35, x + T * 0.6, y + T * 0.3, x + T * 0.9, y + T * 0.8], fill('#4a4d55'));
      poly(c, [x + T * 0.35, y + T * 0.85, x + T * 0.5, y + T * 0.55, x + T * 0.7, y + T * 0.85], fill('#62666f'));
      break;
    }
    case 'pit': {
      rect(c, x, y, T, T, fill('#120604'));
      rect(c, x, y, T, T, fill(th.accent, 0.08 + hash(tx, ty, 8) * 0.12));
      break;
    }
    case 'catwalk': {
      rect(c, x, y, T, T, fill('#120604'));
      rect(c, x, y + T * 0.12, T, T * 0.76, fill('#4a4f5a'));
      for (let i = 0; i < 4; i++) line(c, x + (T * (i + 0.5)) / 4, y + T * 0.14, x + (T * (i + 0.5)) / 4, y + T * 0.86, stroke('#2e323a', 1.5));
      line(c, x, y + T * 0.12, x + T, y + T * 0.12, stroke('#ffb347', 1.5, 0.8));
      line(c, x, y + T * 0.88, x + T, y + T * 0.88, stroke('#ffb347', 1.5, 0.8));
      break;
    }
    case 'pillar': {
      floorBase(c, x, y, T, th, tx, ty);
      circle(c, x + T / 2, y + T / 2, T * 0.36, fill(th.wall));
      circle(c, x + T / 2, y + T / 2 - 2, T * 0.3, fill(shade(th.wall, 0.15)));
      break;
    }
    case 'bed': {
      floorBase(c, x, y, T, th, tx, ty);
      rrect(c, x + 3, y + 4, T - 6, T - 8, 3, fill('#3b4a6b'));
      rrect(c, x + 5, y + 6, T * 0.35, T * 0.3, 2, fill('#c9d6e6'));
      break;
    }
  }
}

/** Glow elements that pulse over time (vents, bloom, pits). */
export function drawTileGlow(c: SkCanvas, deck: ParsedDeck, tx: number, ty: number, T: number, ventsHot: boolean) {
  const kind = tileAt(deck, tx, ty);
  const x = tx * T;
  const y = ty * T;
  if (kind === 'vent' && ventsHot) {
    rect(c, x + T * 0.1, y + T * 0.1, T * 0.8, T * 0.8, glow('#ff7a2a', T * 0.18, 0.75));
    for (let i = 0; i < 4; i++) rrect(c, x + T * 0.18, y + T * (0.16 + i * 0.2), T * 0.64, T * 0.06, 2, fill('#ffd27a', 0.9));
  } else if (kind === 'bloom') {
    circle(c, x + T * 0.5, y + T * 0.5, T * 0.28, glow('#ff6fcf', T * 0.2, 0.35));
  } else if (kind === 'pit') {
    rect(c, x, y, T, T, fill(deck.def.theme.accent, 0.12));
  }
}

export function recordStatic(deck: ParsedDeck, T: number): SkPicture {
  return createPicture(
    (c) => {
      for (let ty = 0; ty < deck.height; ty++) for (let tx = 0; tx < deck.width; tx++) drawTile(c, deck, tx, ty, T);
    },
    { width: deck.width * T, height: deck.height * T },
  );
}

export function recordGlow(deck: ParsedDeck, T: number, ventsHot: boolean): SkPicture {
  return createPicture(
    (c) => {
      for (let ty = 0; ty < deck.height; ty++) for (let tx = 0; tx < deck.width; tx++) drawTileGlow(c, deck, tx, ty, T, ventsHot);
    },
    { width: deck.width * T, height: deck.height * T },
  );
}
