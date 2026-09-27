import { Skia, type SkCanvas } from '@shopify/react-native-skia';

import type { Dir, DoorLock, Effect, EnemySprite, ObjectSprite } from '../../game/types';
import { circle, fill, glow, line, oval, poly, rect, rrect, shade, star, stroke } from './draw';

/* ---------------- characters ---------------- */

export function drawShadow(c: SkCanvas, s: number, w = 0.32) {
  oval(c, s / 2, s * 0.88, s * w, s * 0.08, fill('#000000', 0.35));
}

export function drawKai(c: SkCanvas, s: number, facing: Dir) {
  drawShadow(c, s);
  const cx = s / 2;
  rect(c, cx - s * 0.14, s * 0.66, s * 0.1, s * 0.2, fill('#3b3f4a'));
  rect(c, cx + s * 0.04, s * 0.66, s * 0.1, s * 0.2, fill('#3b3f4a'));
  if (facing !== 'down') rrect(c, cx - s * 0.17, s * 0.4, s * 0.34, s * 0.26, s * 0.05, fill('#7c8698'));
  rrect(c, cx - s * 0.2, s * 0.38, s * 0.4, s * 0.32, s * 0.1, fill('#ff8a3d'));
  rect(c, cx - s * 0.2, s * 0.58, s * 0.4, s * 0.05, fill('#b85c24'));
  rrect(c, cx - s * 0.27, s * 0.42, s * 0.08, s * 0.2, s * 0.04, fill('#e8773a'));
  rrect(c, cx + s * 0.19, s * 0.42, s * 0.08, s * 0.2, s * 0.04, fill('#e8773a'));
  circle(c, cx, s * 0.27, s * 0.17, fill('#e8eef8'));
  circle(c, cx, s * 0.27, s * 0.17, stroke('#9aa6ba', 1));
  const vis = fill('#5ee0ff');
  if (facing === 'down') rrect(c, cx - s * 0.11, s * 0.24, s * 0.22, s * 0.1, s * 0.05, vis);
  else if (facing === 'left') rrect(c, cx - s * 0.16, s * 0.23, s * 0.14, s * 0.1, s * 0.05, vis);
  else if (facing === 'right') rrect(c, cx + s * 0.02, s * 0.23, s * 0.14, s * 0.1, s * 0.05, vis);
  else circle(c, cx, s * 0.2, s * 0.03, fill('#ff5e6a'));
}

export function drawBolt(c: SkCanvas, s: number, opts: { facing?: Dir; sticker?: boolean; broken?: boolean } = {}) {
  const cx = s / 2;
  const cy = s * 0.46;
  const broken = !!opts.broken;
  if (!broken) circle(c, cx, s * 0.84, s * 0.2, glow('#5ee0ff', s * 0.1, 0.45));
  else drawShadow(c, s, 0.26);
  const body = broken ? '#7c8492' : '#d3dcea';
  oval(c, cx - s * 0.27, cy + s * 0.02, s * 0.07, s * 0.12, fill(shade(body, -0.25)));
  oval(c, cx + s * 0.27, cy + s * 0.02, s * 0.07, s * 0.12, fill(shade(body, -0.25)));
  circle(c, cx, cy, s * 0.24, fill(body));
  circle(c, cx, cy, s * 0.24, stroke(shade(body, -0.4), 1.2));
  rect(c, cx - s * 0.24, cy + s * 0.06, s * 0.48, s * 0.05, fill(shade(body, -0.2)));
  line(c, cx + s * 0.08, cy - s * 0.22, cx + s * 0.14, cy - s * 0.36, stroke(shade(body, -0.4), 1.5));
  circle(c, cx + s * 0.14, cy - s * 0.37, s * 0.04, fill(broken ? '#5a2020' : '#ff5e6a'));
  let ex = 0;
  let ey = 0;
  if (opts.facing === 'left') ex = -s * 0.07;
  if (opts.facing === 'right') ex = s * 0.07;
  if (opts.facing === 'up') ey = -s * 0.07;
  const eye = broken ? '#3a4a55' : '#5ee0ff';
  circle(c, cx + ex, cy - s * 0.02 + ey, s * 0.11, fill('#16202e'));
  circle(c, cx + ex, cy - s * 0.02 + ey, s * 0.075, fill(eye));
  if (!broken) circle(c, cx + ex - s * 0.025, cy - s * 0.05 + ey, s * 0.025, fill('#ffffff', 0.9));
  if (opts.sticker) star(c, cx - s * 0.13, cy + s * 0.13, s * 0.06, fill('#ffd166'));
  if (broken) {
    line(c, cx + s * 0.2, cy - s * 0.1, cx + s * 0.3, cy - s * 0.2, stroke('#ffd166', 1.5));
    line(c, cx + s * 0.25, cy - s * 0.05, cx + s * 0.35, cy - s * 0.08, stroke('#ffd166', 1.5));
  }
}

/* ---------------- enemies ---------------- */

function eyes(c: SkCanvas, pts: [number, number][], r: number, color: string) {
  for (const [x, y] of pts) {
    circle(c, x, y, r * 1.8, glow(color, r, 0.6));
    circle(c, x, y, r, fill(color));
  }
}

function bloomBuds(c: SkCanvas, pts: [number, number, number][]) {
  for (const [x, y, r] of pts) {
    circle(c, x, y, r * 1.6, glow('#ff6fcf', r * 0.8, 0.45));
    circle(c, x, y, r, fill('#e0479f'));
    circle(c, x, y, r * 0.45, fill('#ffc6ef'));
  }
}

export function drawEnemy(c: SkCanvas, sprite: EnemySprite, s: number, opts: { shield?: boolean } = {}) {
  const cx = s / 2;
  switch (sprite) {
    case 'crawler': {
      drawShadow(c, s, 0.34);
      const leg = stroke('#3d1f45', s * 0.045);
      for (let i = -1; i <= 1; i++) {
        line(c, cx - s * 0.1, s * 0.62, cx - s * 0.36, s * 0.66 + i * s * 0.1, leg);
        line(c, cx + s * 0.1, s * 0.62, cx + s * 0.36, s * 0.66 + i * s * 0.1, leg);
      }
      oval(c, cx, s * 0.58, s * 0.26, s * 0.18, fill('#5a2d6b'));
      for (let i = 0; i < 5; i++) poly(c, [cx - s * 0.2 + i * s * 0.1, s * 0.46, cx - s * 0.16 + i * s * 0.1, s * 0.34, cx - s * 0.12 + i * s * 0.1, s * 0.46], fill('#8a3f9e'));
      bloomBuds(c, [
        [cx - s * 0.12, s * 0.56, s * 0.04],
        [cx + s * 0.14, s * 0.6, s * 0.035],
      ]);
      eyes(c, [
        [cx - s * 0.06, s * 0.66],
        [cx + s * 0.06, s * 0.66],
      ], s * 0.03, '#b7ff5e');
      break;
    }
    case 'swarm': {
      const pts: [number, number, number][] = [
        [0.5, 0.45, 0.1],
        [0.32, 0.38, 0.07],
        [0.66, 0.34, 0.08],
        [0.4, 0.6, 0.08],
        [0.62, 0.58, 0.07],
        [0.25, 0.55, 0.05],
        [0.75, 0.48, 0.05],
        [0.5, 0.22, 0.05],
        [0.55, 0.72, 0.05],
        [0.35, 0.22, 0.04],
      ];
      circle(c, cx, s * 0.47, s * 0.34, glow('#b8ff7a', s * 0.12, 0.25));
      pts.forEach(([x, y, r], i) => circle(c, x * s, y * s, r * s, fill(i % 2 ? '#c6ff8a' : '#ff9ad8', 0.8)));
      break;
    }
    case 'infected': {
      drawShadow(c, s, 0.26);
      rect(c, cx - s * 0.12, s * 0.62, s * 0.09, s * 0.24, fill('#39455c'));
      rect(c, cx + s * 0.03, s * 0.62, s * 0.09, s * 0.24, fill('#39455c'));
      rrect(c, cx - s * 0.16, s * 0.34, s * 0.32, s * 0.32, s * 0.06, fill('#4f6384'));
      line(c, cx - s * 0.15, s * 0.4, cx - s * 0.34, s * 0.5, stroke('#4f6384', s * 0.08));
      line(c, cx + s * 0.15, s * 0.4, cx + s * 0.34, s * 0.46, stroke('#4f6384', s * 0.08));
      circle(c, cx - s * 0.36, s * 0.51, s * 0.05, fill('#a6c9a0'));
      circle(c, cx + s * 0.36, s * 0.46, s * 0.05, fill('#a6c9a0'));
      circle(c, cx, s * 0.24, s * 0.13, fill('#a6c9a0'));
      rect(c, cx - s * 0.07, s * 0.44, s * 0.1, s * 0.05, fill('#e8eef8', 0.8));
      eyes(c, [
        [cx - s * 0.045, s * 0.24],
        [cx + s * 0.045, s * 0.24],
      ], s * 0.02, '#ff6fcf');
      bloomBuds(c, [
        [cx + s * 0.1, s * 0.14, s * 0.05],
        [cx - s * 0.14, s * 0.38, s * 0.045],
        [cx + s * 0.08, s * 0.5, s * 0.035],
      ]);
      break;
    }
    case 'secbot': {
      drawShadow(c, s, 0.28);
      rect(c, cx - s * 0.18, s * 0.66, s * 0.1, s * 0.2, fill('#2a2f3a'));
      rect(c, cx + s * 0.08, s * 0.66, s * 0.1, s * 0.2, fill('#2a2f3a'));
      rrect(c, cx - s * 0.24, s * 0.3, s * 0.48, s * 0.4, s * 0.05, fill('#4b5363'));
      rrect(c, cx - s * 0.24, s * 0.3, s * 0.48, s * 0.4, s * 0.05, stroke('#1f232b', 1.5));
      rect(c, cx - s * 0.18, s * 0.38, s * 0.36, s * 0.08, fill('#ff3040'));
      rect(c, cx - s * 0.18, s * 0.38, s * 0.36, s * 0.08, glow('#ff3040', s * 0.03, 0.8));
      rect(c, cx - s * 0.34, s * 0.4, s * 0.1, s * 0.22, fill('#3a404c'));
      rect(c, cx + s * 0.24, s * 0.4, s * 0.1, s * 0.22, fill('#3a404c'));
      line(c, cx + s * 0.16, s * 0.3, cx + s * 0.2, s * 0.16, stroke('#8a93a3', 1.5));
      circle(c, cx + s * 0.2, s * 0.15, s * 0.025, fill('#ffb347'));
      rect(c, cx - s * 0.14, s * 0.54, s * 0.28, s * 0.04, fill('#ffd166', 0.8));
      break;
    }
    case 'welder': {
      circle(c, cx, s * 0.86, s * 0.18, glow('#ff9a3d', s * 0.08, 0.4));
      line(c, cx + s * 0.15, s * 0.5, cx + s * 0.38, s * 0.66, stroke('#6b4a33', s * 0.06));
      circle(c, cx + s * 0.4, s * 0.68, s * 0.05, glow('#fff1a8', s * 0.04));
      circle(c, cx + s * 0.4, s * 0.68, s * 0.03, fill('#ffffff'));
      circle(c, cx, s * 0.45, s * 0.22, fill('#a0562c'));
      circle(c, cx, s * 0.45, s * 0.22, stroke('#5a2f16', 1.5));
      rect(c, cx - s * 0.22, s * 0.47, s * 0.44, s * 0.05, fill('#5a2f16'));
      eyes(c, [[cx - s * 0.03, s * 0.4]], s * 0.06, '#ffb347');
      const vine = stroke('#6fbf4f', s * 0.03);
      line(c, cx - s * 0.1, s * 0.6, cx - s * 0.2, s * 0.8, vine);
      line(c, cx + s * 0.05, s * 0.64, cx + s * 0.02, s * 0.86, vine);
      bloomBuds(c, [[cx - s * 0.16, s * 0.3, s * 0.04]]);
      break;
    }
    case 'brute': {
      drawShadow(c, s, 0.42);
      circle(c, cx - s * 0.16, s * 0.58, s * 0.2, fill('#5b4a66'));
      circle(c, cx + s * 0.16, s * 0.58, s * 0.2, fill('#5b4a66'));
      circle(c, cx, s * 0.44, s * 0.26, fill('#6e5a7c'));
      circle(c, cx, s * 0.72, s * 0.16, fill('#4a3b55'));
      line(c, cx - s * 0.26, s * 0.5, cx - s * 0.44, s * 0.76, stroke('#5b4a66', s * 0.11));
      line(c, cx + s * 0.26, s * 0.5, cx + s * 0.44, s * 0.76, stroke('#5b4a66', s * 0.11));
      eyes(c, [
        [cx - s * 0.08, s * 0.4],
        [cx + s * 0.08, s * 0.4],
        [cx, s * 0.34],
      ], s * 0.025, '#ff6fcf');
      bloomBuds(c, [
        [cx - s * 0.2, s * 0.3, s * 0.06],
        [cx + s * 0.22, s * 0.36, s * 0.05],
        [cx + s * 0.05, s * 0.58, s * 0.05],
        [cx - s * 0.12, s * 0.66, s * 0.04],
      ]);
      break;
    }
    case 'sentinel': {
      drawShadow(c, s, 0.3);
      rrect(c, cx - s * 0.26, s * 0.7, s * 0.52, s * 0.14, s * 0.04, fill('#2b3350'));
      rect(c, cx - s * 0.06, s * 0.5, s * 0.12, s * 0.22, fill('#39446b'));
      circle(c, cx, s * 0.42, s * 0.2, fill('#3a4775'));
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8;
        poly(c, [
          cx + Math.cos(a) * s * 0.18,
          s * 0.42 + Math.sin(a) * s * 0.18,
          cx + Math.cos(a + 0.2) * s * 0.3,
          s * 0.42 + Math.sin(a + 0.2) * s * 0.3,
          cx + Math.cos(a + 0.4) * s * 0.18,
          s * 0.42 + Math.sin(a + 0.4) * s * 0.18,
        ], fill('#c0418f'));
      }
      eyes(c, [[cx, s * 0.42]], s * 0.07, '#ff6fcf');
      break;
    }
    case 'tendril': {
      const p = Skia.PathBuilder.Make()
        .moveTo(cx - s * 0.08, s * 0.9)
        .cubicTo(cx - s * 0.3, s * 0.6, cx + s * 0.3, s * 0.45, cx, s * 0.2)
        .detach();
      c.drawPath(p, stroke('#5e2d6e', s * 0.12));
      c.drawPath(p, stroke('#a8489a', s * 0.05));
      bloomBuds(c, [[cx, s * 0.2, s * 0.08]]);
      break;
    }
    case 'warden': {
      drawShadow(c, s, 0.34);
      rrect(c, cx - s * 0.36, s * 0.2, s * 0.16, s * 0.42, s * 0.07, fill('#e8f4ff'));
      rrect(c, cx + s * 0.2, s * 0.2, s * 0.16, s * 0.42, s * 0.07, fill('#e8f4ff'));
      rrect(c, cx - s * 0.33, s * 0.26, s * 0.1, s * 0.3, s * 0.05, fill('#7fd6ff', 0.7));
      rrect(c, cx + s * 0.23, s * 0.26, s * 0.1, s * 0.3, s * 0.05, fill('#7fd6ff', 0.7));
      rect(c, cx - s * 0.16, s * 0.68, s * 0.1, s * 0.2, fill('#4a5566'));
      rect(c, cx + s * 0.06, s * 0.68, s * 0.1, s * 0.2, fill('#4a5566'));
      rrect(c, cx - s * 0.2, s * 0.24, s * 0.4, s * 0.48, s * 0.08, fill('#8a98ad'));
      rrect(c, cx - s * 0.13, s * 0.3, s * 0.26, s * 0.12, s * 0.05, fill('#1b2433'));
      eyes(c, [[cx, s * 0.36]], s * 0.035, '#bff0ff');
      const claw = stroke('#5c687a', s * 0.06);
      line(c, cx - s * 0.2, s * 0.5, cx - s * 0.42, s * 0.7, claw);
      line(c, cx + s * 0.2, s * 0.5, cx + s * 0.42, s * 0.7, claw);
      line(c, cx - s * 0.42, s * 0.7, cx - s * 0.36, s * 0.8, stroke('#5c687a', s * 0.04));
      line(c, cx + s * 0.42, s * 0.7, cx + s * 0.36, s * 0.8, stroke('#5c687a', s * 0.04));
      const vine = stroke('#d65aa8', s * 0.025);
      line(c, cx - s * 0.1, s * 0.46, cx + s * 0.12, s * 0.62, vine);
      line(c, cx + s * 0.14, s * 0.26, cx + s * 0.05, s * 0.5, vine);
      bloomBuds(c, [
        [cx + s * 0.12, s * 0.62, s * 0.045],
        [cx - s * 0.18, s * 0.26, s * 0.04],
      ]);
      break;
    }
    case 'vine': {
      circle(c, cx, s * 0.55, s * 0.4, glow('#5fae4a', s * 0.12, 0.25));
      const colors = ['#2f6b2a', '#3f8a3a', '#5fae4a'];
      for (let i = 0; i < 9; i++) {
        const b = Skia.PathBuilder.Make();
        const a = (i / 9) * Math.PI;
        b.moveTo(cx + Math.cos(a + Math.PI) * s * 0.4, s * 0.9);
        b.cubicTo(cx + Math.cos(a) * s * 0.5, s * 0.5, cx - Math.cos(a) * s * 0.3, s * 0.35, cx + Math.cos(a * 2) * s * 0.2, s * 0.15 + (i % 3) * s * 0.05);
        c.drawPath(b.detach(), stroke(colors[i % 3], s * (0.05 + (i % 3) * 0.015)));
      }
      oval(c, cx, s * 0.52, s * 0.16, s * 0.1, fill('#1a0d10'));
      for (let i = 0; i < 6; i++) poly(c, [cx - s * 0.14 + i * s * 0.056, s * 0.44, cx - s * 0.12 + i * s * 0.056, s * 0.5, cx - s * 0.1 + i * s * 0.056, s * 0.44], fill('#f0e6d0'));
      bloomBuds(c, [
        [cx - s * 0.28, s * 0.3, s * 0.06],
        [cx + s * 0.3, s * 0.34, s * 0.07],
        [cx + s * 0.05, s * 0.18, s * 0.05],
        [cx - s * 0.1, s * 0.72, s * 0.05],
      ]);
      eyes(c, [
        [cx - s * 0.08, s * 0.38],
        [cx + s * 0.08, s * 0.38],
      ], s * 0.025, '#ffd166');
      break;
    }
    case 'titan': {
      drawShadow(c, s, 0.44);
      circle(c, cx, s * 0.5, s * 0.42, glow('#ff7a2a', s * 0.14, 0.35));
      poly(c, [cx - s * 0.36, s * 0.86, cx - s * 0.4, s * 0.45, cx - s * 0.2, s * 0.2, cx + s * 0.18, s * 0.18, cx + s * 0.4, s * 0.42, cx + s * 0.36, s * 0.86], fill('#3a2a22'));
      poly(c, [cx - s * 0.22, s * 0.3, cx + s * 0.2, s * 0.28, cx + s * 0.12, s * 0.46, cx - s * 0.16, s * 0.48], fill('#4d372c'));
      const crack = stroke('#ffb347', s * 0.02);
      const crackGlow = glow('#ff7a2a', s * 0.03, 0.9);
      const cracks: number[][] = [
        [cx - s * 0.3, s * 0.5, cx - s * 0.1, s * 0.6, cx - s * 0.14, s * 0.8],
        [cx + s * 0.28, s * 0.46, cx + s * 0.08, s * 0.62, cx + s * 0.18, s * 0.82],
        [cx - s * 0.05, s * 0.52, cx + s * 0.02, s * 0.72],
      ];
      for (const pts of cracks) {
        const path = polyPathOpen(pts);
        c.drawPath(path, crackGlow);
        c.drawPath(path, crack);
      }
      eyes(c, [
        [cx - s * 0.08, s * 0.36],
        [cx + s * 0.08, s * 0.36],
      ], s * 0.035, '#ffe066');
      bloomBuds(c, [[cx + s * 0.26, s * 0.3, s * 0.05]]);
      break;
    }
    case 'matron': {
      circle(c, cx, s * 0.5, s * 0.44, glow('#ff6fcf', s * 0.14, 0.3));
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI * 2 * i) / 10;
        oval(c, cx + Math.cos(a) * s * 0.3, s * 0.52 + Math.sin(a) * s * 0.3, s * 0.12, s * 0.12, fill(i % 2 ? '#b03a8f' : '#d65aa8'));
      }
      circle(c, cx, s * 0.52, s * 0.28, fill('#6e3a6c'));
      const faces: [number, number][] = [
        [cx, s * 0.42],
        [cx - s * 0.13, s * 0.56],
        [cx + s * 0.13, s * 0.56],
        [cx, s * 0.66],
      ];
      for (const [x, y] of faces) {
        oval(c, x, y, s * 0.06, s * 0.075, fill('#c9b8b0'));
        circle(c, x - s * 0.02, y - s * 0.01, s * 0.01, fill('#2a0f20'));
        circle(c, x + s * 0.02, y - s * 0.01, s * 0.01, fill('#2a0f20'));
        oval(c, x, y + s * 0.035, s * 0.015, s * 0.01, fill('#2a0f20'));
      }
      bloomBuds(c, [
        [cx, s * 0.2, s * 0.07],
        [cx - s * 0.3, s * 0.28, s * 0.05],
        [cx + s * 0.3, s * 0.28, s * 0.05],
      ]);
      break;
    }
    case 'wardog': {
      drawShadow(c, s, 0.44);
      const legC = '#2a2f3a';
      line(c, cx - s * 0.26, s * 0.58, cx - s * 0.38, s * 0.86, stroke(legC, s * 0.06));
      line(c, cx - s * 0.1, s * 0.6, cx - s * 0.14, s * 0.88, stroke(legC, s * 0.06));
      line(c, cx + s * 0.1, s * 0.6, cx + s * 0.14, s * 0.88, stroke(legC, s * 0.06));
      line(c, cx + s * 0.26, s * 0.58, cx + s * 0.38, s * 0.86, stroke(legC, s * 0.06));
      rrect(c, cx - s * 0.32, s * 0.38, s * 0.64, s * 0.24, s * 0.06, fill('#5a6272'));
      rrect(c, cx - s * 0.16, s * 0.24, s * 0.32, s * 0.18, s * 0.05, fill('#6d7688'));
      rect(c, cx - s * 0.1, s * 0.3, s * 0.2, s * 0.05, fill('#ff3040'));
      rect(c, cx - s * 0.1, s * 0.3, s * 0.2, s * 0.05, glow('#ff3040', s * 0.02));
      rect(c, cx + s * 0.16, s * 0.3, s * 0.26, s * 0.06, fill('#3a404c'));
      rect(c, cx - s * 0.42, s * 0.32, s * 0.26, s * 0.06, fill('#3a404c'));
      rect(c, cx - s * 0.26, s * 0.46, s * 0.52, s * 0.04, fill('#ffd166', 0.8));
      if (opts.shield) {
        circle(c, cx, s * 0.52, s * 0.46, fill('#5ee0ff', 0.12));
        circle(c, cx, s * 0.52, s * 0.46, stroke('#5ee0ff', s * 0.02, 0.8));
      }
      break;
    }
    case 'heart':
    case 'heart2': {
      const exposed = sprite === 'heart2';
      circle(c, cx, s * 0.5, s * 0.46, glow(exposed ? '#ffc6ef' : '#ff3b6b', s * 0.16, exposed ? 0.55 : 0.35));
      if (!exposed) {
        for (let i = 0; i < 14; i++) {
          const a = (Math.PI * 2 * i) / 14;
          poly(c, [
            cx + Math.cos(a - 0.12) * s * 0.28,
            s * 0.5 + Math.sin(a - 0.12) * s * 0.28,
            cx + Math.cos(a) * s * 0.46,
            s * 0.5 + Math.sin(a) * s * 0.46,
            cx + Math.cos(a + 0.12) * s * 0.28,
            s * 0.5 + Math.sin(a + 0.12) * s * 0.28,
          ], fill('#5a1f3c'));
        }
        circle(c, cx, s * 0.5, s * 0.3, fill('#7a2450'));
        const seam = stroke('#ff6fcf', s * 0.018);
        line(c, cx - s * 0.2, s * 0.36, cx + s * 0.1, s * 0.62, seam);
        line(c, cx + s * 0.18, s * 0.34, cx - s * 0.04, s * 0.66, seam);
        circle(c, cx, s * 0.5, s * 0.08, glow('#ff6fcf', s * 0.05));
      } else {
        for (let i = 0; i < 12; i++) {
          const a = (Math.PI * 2 * i) / 12;
          line(c, cx, s * 0.5, cx + Math.cos(a) * s * 0.46, s * 0.5 + Math.sin(a) * s * 0.46, stroke('#ffc6ef', s * 0.012, 0.6));
        }
        circle(c, cx, s * 0.5, s * 0.3, fill('#d6488f'));
        circle(c, cx, s * 0.5, s * 0.22, fill('#ff8ad0'));
        circle(c, cx, s * 0.5, s * 0.13, fill('#ffe0f4'));
        circle(c, cx, s * 0.5, s * 0.13, glow('#ffffff', s * 0.06, 0.8));
      }
      break;
    }
  }
}

function polyPathOpen(pts: number[]) {
  const b = Skia.PathBuilder.Make();
  b.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) b.lineTo(pts[i], pts[i + 1]);
  return b.detach();
}

/* ---------------- map objects ---------------- */

const SURVIVOR_COLORS: Record<string, { body: string; skin: string; hair: string }> = {
  nair: { body: '#e8eef8', skin: '#a8744f', hair: '#1c1410' },
  haddad: { body: '#ff8a3d', skin: '#8a5a3c', hair: '#2a1d14' },
  hollis: { body: '#7a5a3a', skin: '#e0b89a', hair: '#cfd4dc' },
  juno: { body: '#ffd166', skin: '#f0c8a0', hair: '#3a2416' },
  tanaka: { body: '#2c3e6b', skin: '#f0d0b0', hair: '#111111' },
};

export function drawObject(c: SkCanvas, sprite: ObjectSprite, s: number, opts: { variant?: string; sealed?: boolean; accent?: string } = {}) {
  const cx = s / 2;
  const accent = opts.accent ?? '#5ee0ff';
  switch (sprite) {
    case 'terminal':
    case 'console':
      drawShadow(c, s, 0.3);
      rect(c, cx - s * 0.05, s * 0.55, s * 0.1, s * 0.3, fill('#2a3140'));
      rrect(c, cx - s * 0.3, s * 0.2, s * 0.6, s * 0.38, s * 0.05, fill('#1b2231'));
      rect(c, cx - s * 0.24, s * 0.26, s * 0.48, s * 0.26, fill(accent, 0.7));
      rect(c, cx - s * 0.24, s * 0.26, s * 0.48, s * 0.26, glow(accent, s * 0.06, 0.5));
      break;
    case 'elevator':
      rrect(c, s * 0.08, s * 0.05, s * 0.84, s * 0.9, s * 0.06, fill('#39445c'));
      rect(c, s * 0.14, s * 0.18, s * 0.34, s * 0.74, fill('#56637e'));
      rect(c, s * 0.52, s * 0.18, s * 0.34, s * 0.74, fill('#56637e'));
      poly(c, [cx, s * 0.06, cx - s * 0.1, s * 0.15, cx + s * 0.1, s * 0.15], fill('#7dff9a'));
      poly(c, [cx, s * 0.06, cx - s * 0.1, s * 0.15, cx + s * 0.1, s * 0.15], glow('#7dff9a', s * 0.04, 0.8));
      break;
    case 'medstation':
      drawShadow(c, s, 0.34);
      rrect(c, s * 0.14, s * 0.14, s * 0.72, s * 0.7, s * 0.08, fill('#e6eef8'));
      rect(c, cx - s * 0.08, s * 0.28, s * 0.16, s * 0.42, fill('#3ddc84'));
      rect(c, cx - s * 0.21, s * 0.41, s * 0.42, s * 0.16, fill('#3ddc84'));
      circle(c, cx, s * 0.49, s * 0.3, glow('#3ddc84', s * 0.1, 0.35));
      break;
    case 'relay':
    case 'valve':
      drawShadow(c, s, 0.34);
      rrect(c, s * 0.14, s * 0.18, s * 0.72, s * 0.66, s * 0.06, fill('#3a4252'));
      if (sprite === 'valve') {
        circle(c, cx, s * 0.5, s * 0.22, stroke('#ff5e6a', s * 0.07));
        line(c, cx - s * 0.22, s * 0.5, cx + s * 0.22, s * 0.5, stroke('#ff5e6a', s * 0.05));
        line(c, cx, s * 0.28, cx, s * 0.72, stroke('#ff5e6a', s * 0.05));
      } else {
        poly(c, [cx + s * 0.06, s * 0.24, cx - s * 0.16, s * 0.54, cx, s * 0.54, cx - s * 0.06, s * 0.78, cx + s * 0.16, s * 0.46, cx, s * 0.46], fill('#ffd166'));
        circle(c, cx, s * 0.5, s * 0.26, glow('#ffd166', s * 0.08, 0.4));
      }
      break;
    case 'breach':
      if (opts.sealed) {
        rrect(c, s * 0.12, s * 0.12, s * 0.76, s * 0.76, s * 0.08, fill('#6d7688'));
        for (const [x, y] of [
          [0.2, 0.2],
          [0.8, 0.2],
          [0.2, 0.8],
          [0.8, 0.8],
        ]) circle(c, x * s, y * s, s * 0.04, fill('#3a404c'));
        line(c, s * 0.2, s * 0.5, s * 0.8, s * 0.5, stroke('#ffb347', s * 0.03, 0.7));
      } else {
        poly(c, [s * 0.2, s * 0.3, s * 0.4, s * 0.14, s * 0.6, s * 0.2, s * 0.84, s * 0.12, s * 0.8, s * 0.42, s * 0.9, s * 0.66, s * 0.62, s * 0.86, s * 0.36, s * 0.8, s * 0.12, s * 0.62], fill('#05060a'));
        circle(c, cx, s * 0.5, s * 0.2, stroke('#5ee0ff', s * 0.02, 0.5));
        circle(c, cx, s * 0.5, s * 0.1, stroke('#5ee0ff', s * 0.02, 0.7));
        circle(c, cx, s * 0.5, s * 0.36, glow('#ff5e6a', s * 0.1, 0.35));
      }
      break;
    case 'vendor':
      drawShadow(c, s, 0.3);
      rrect(c, s * 0.16, s * 0.04, s * 0.68, s * 0.86, s * 0.06, fill('#8a2a5a'));
      rect(c, s * 0.24, s * 0.12, s * 0.52, s * 0.5, fill('#ffe0f4', 0.85));
      for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) circle(c, s * (0.33 + q * 0.17), s * (0.22 + r * 0.15), s * 0.045, fill(['#ff5e6a', '#5ee0ff', '#ffd166'][(r + q) % 3]));
      rect(c, s * 0.3, s * 0.7, s * 0.4, s * 0.08, fill('#2a0f20'));
      rect(c, s * 0.16, s * 0.04, s * 0.68, s * 0.86, glow('#ff6fcf', s * 0.05, 0.25));
      break;
    case 'survivor': {
      const col = SURVIVOR_COLORS[opts.variant ?? ''] ?? SURVIVOR_COLORS.nair;
      const small = opts.variant === 'juno';
      const k = small ? 0.8 : 1;
      drawShadow(c, s, 0.26);
      c.save();
      c.translate(cx, s * 0.9);
      c.scale(k, k);
      c.translate(-cx, -s * 0.9);
      rect(c, cx - s * 0.12, s * 0.64, s * 0.09, s * 0.22, fill('#2e3440'));
      rect(c, cx + s * 0.03, s * 0.64, s * 0.09, s * 0.22, fill('#2e3440'));
      rrect(c, cx - s * 0.18, s * 0.38, s * 0.36, s * 0.3, s * 0.08, fill(col.body));
      circle(c, cx, s * 0.26, s * 0.14, fill(col.skin));
      poly(c, [cx - s * 0.15, s * 0.24, cx - s * 0.12, s * 0.1, cx + s * 0.12, s * 0.1, cx + s * 0.15, s * 0.24, cx + s * 0.1, s * 0.16, cx - s * 0.1, s * 0.16], fill(col.hair));
      if (opts.variant !== 'haddad' && opts.variant !== 'juno') {
        bloomBuds(c, [[cx + s * 0.13, s * 0.44, s * 0.035]]);
      }
      c.restore();
      circle(c, cx + s * 0.28, s * 0.14, s * 0.07, fill('#ffd166'));
      rect(c, cx + s * 0.265, s * 0.08, s * 0.03, s * 0.07, fill('#1b1b1b'));
      circle(c, cx + s * 0.28, s * 0.18, s * 0.012, fill('#1b1b1b'));
      break;
    }
    case 'bolt_broken':
      c.save();
      c.translate(cx, s / 2);
      c.rotate(-20, 0, 0);
      c.translate(-cx, -s / 2);
      drawBolt(c, s, { broken: true });
      c.restore();
      break;
    case 'pod_mia':
      rrect(c, s * 0.12, s * 0.06, s * 0.76, s * 0.88, s * 0.3, fill('#c9d6e6'));
      rrect(c, s * 0.22, s * 0.16, s * 0.56, s * 0.6, s * 0.22, fill('#ffb3e0', 0.6));
      circle(c, cx, s * 0.46, s * 0.3, glow('#ff6fcf', s * 0.1, 0.4));
      circle(c, cx, s * 0.85, s * 0.05, fill('#7dff9a'));
      break;
    case 'escape_pod':
      drawShadow(c, s, 0.36);
      oval(c, cx, s * 0.5, s * 0.36, s * 0.4, fill('#d6dde8'));
      oval(c, cx, s * 0.4, s * 0.2, s * 0.14, fill('#5ee0ff', 0.7));
      rect(c, cx - s * 0.3, s * 0.62, s * 0.6, s * 0.06, fill('#ff8a3d'));
      circle(c, cx, s * 0.5, s * 0.4, glow('#5ee0ff', s * 0.1, 0.25));
      break;
    case 'seed':
    case 'heart':
      circle(c, cx, s * 0.5, s * 0.3, fill('#b03a8f'));
      circle(c, cx, s * 0.5, s * 0.36, glow('#ff6fcf', s * 0.1, 0.5));
      break;
    case 'sign':
    case 'locker':
    case 'hologram':
      rrect(c, s * 0.2, s * 0.15, s * 0.6, s * 0.7, s * 0.05, fill('#39445c'));
      rect(c, s * 0.28, s * 0.25, s * 0.44, s * 0.2, fill(accent, 0.6));
      break;
  }
}

/* ---------------- pickups ---------------- */

export type PickupKind = 'item' | 'weapon' | 'module' | 'memory' | 'log' | 'scrap' | 'chip' | 'key';

export function pickupKind(give: Effect[]): PickupKind {
  const fx = give[0];
  switch (fx?.type) {
    case 'weapon':
      return 'weapon';
    case 'module':
      return 'module';
    case 'memory':
      return 'memory';
    case 'log':
      return 'log';
    case 'scrap':
      return 'scrap';
    case 'modChip':
      return 'chip';
    case 'item':
      return fx.id.startsWith('keycard') ? 'key' : 'item';
    default:
      return 'item';
  }
}

export function drawPickup(c: SkCanvas, kind: PickupKind, s: number) {
  const cx = s / 2;
  const cy = s * 0.52;
  const colors: Record<PickupKind, string> = {
    item: '#3ddc84',
    weapon: '#ff8a3d',
    module: '#5ee0ff',
    memory: '#c77dff',
    log: '#ffd166',
    scrap: '#aab4c4',
    chip: '#ff8a3d',
    key: '#5e9bff',
  };
  const col = colors[kind];
  circle(c, cx, cy, s * 0.3, glow(col, s * 0.1, 0.55));
  switch (kind) {
    case 'item':
      rrect(c, cx - s * 0.16, cy - s * 0.12, s * 0.32, s * 0.24, s * 0.05, fill('#e8eef8'));
      rect(c, cx - s * 0.03, cy - s * 0.09, s * 0.06, s * 0.18, fill(col));
      rect(c, cx - s * 0.09, cy - s * 0.03, s * 0.18, s * 0.06, fill(col));
      break;
    case 'weapon':
      rrect(c, cx - s * 0.2, cy - s * 0.06, s * 0.4, s * 0.1, s * 0.03, fill('#8a93a3'));
      rrect(c, cx - s * 0.06, cy, s * 0.08, s * 0.16, s * 0.02, fill('#4a505c'));
      rect(c, cx + s * 0.14, cy - s * 0.05, s * 0.06, s * 0.08, fill(col));
      break;
    case 'module':
    case 'chip':
      rect(c, cx - s * 0.13, cy - s * 0.13, s * 0.26, s * 0.26, fill('#1b2433'));
      rect(c, cx - s * 0.08, cy - s * 0.08, s * 0.16, s * 0.16, fill(col));
      for (let i = 0; i < 3; i++) {
        const o = -s * 0.08 + i * s * 0.08;
        line(c, cx + o, cy - s * 0.2, cx + o, cy - s * 0.13, stroke('#c0c8d4', 1.2));
        line(c, cx + o, cy + s * 0.13, cx + o, cy + s * 0.2, stroke('#c0c8d4', 1.2));
      }
      break;
    case 'memory':
      poly(c, [cx, cy - s * 0.22, cx + s * 0.12, cy, cx, cy + s * 0.22, cx - s * 0.12, cy], fill(col));
      poly(c, [cx, cy - s * 0.22, cx + s * 0.05, cy, cx, cy + s * 0.22], fill('#ffffff', 0.45));
      break;
    case 'log':
      rrect(c, cx - s * 0.16, cy - s * 0.11, s * 0.32, s * 0.22, s * 0.03, fill('#2a2f3a'));
      rect(c, cx - s * 0.12, cy - s * 0.07, s * 0.24, s * 0.08, fill(col));
      circle(c, cx - s * 0.06, cy + s * 0.05, s * 0.025, fill('#c0c8d4'));
      circle(c, cx + s * 0.06, cy + s * 0.05, s * 0.025, fill('#c0c8d4'));
      break;
    case 'scrap':
      poly(c, [cx - s * 0.18, cy + s * 0.1, cx - s * 0.08, cy - s * 0.08, cx + s * 0.02, cy + s * 0.1], fill('#8a93a3'));
      poly(c, [cx - s * 0.02, cy + s * 0.12, cx + s * 0.1, cy - s * 0.1, cx + s * 0.2, cy + s * 0.12], fill('#aab4c4'));
      circle(c, cx - s * 0.02, cy - s * 0.1, s * 0.04, fill('#c0c8d4'));
      break;
    case 'key':
      rrect(c, cx - s * 0.16, cy - s * 0.11, s * 0.32, s * 0.22, s * 0.04, fill('#e8eef8'));
      rect(c, cx - s * 0.16, cy - s * 0.05, s * 0.32, s * 0.05, fill(col));
      break;
  }
}

/* ---------------- doors ---------------- */

export function lockColor(lock: DoorLock | undefined): string {
  switch (lock?.type) {
    case 'maint':
      return '#ffd166';
    case 'security':
      return '#ff4757';
    case 'bloom':
      return '#b03a8f';
    case 'keycard':
      return '#5e9bff';
    case 'flag':
      return '#8a93a3';
    default:
      return '#7dff9a';
  }
}

export function drawDoor(c: SkCanvas, s: number, lock: DoorLock | undefined, open: boolean, horizontal: boolean, frame: string) {
  const col = lockColor(lock);
  if (horizontal) {
    rect(c, 0, s * 0.3, s * 0.12, s * 0.4, fill(frame));
    rect(c, s * 0.88, s * 0.3, s * 0.12, s * 0.4, fill(frame));
    if (!open) {
      rect(c, s * 0.12, s * 0.32, s * 0.38, s * 0.36, fill('#4a5468'));
      rect(c, s * 0.5, s * 0.32, s * 0.38, s * 0.36, fill('#434c5f'));
      rect(c, s * 0.12, s * 0.46, s * 0.76, s * 0.08, fill(col));
      rect(c, s * 0.12, s * 0.46, s * 0.76, s * 0.08, glow(col, s * 0.04, 0.6));
    } else {
      rect(c, s * 0.12, s * 0.46, s * 0.04, s * 0.08, fill(col, 0.6));
      rect(c, s * 0.84, s * 0.46, s * 0.04, s * 0.08, fill(col, 0.6));
    }
  } else {
    rect(c, s * 0.3, 0, s * 0.4, s * 0.12, fill(frame));
    rect(c, s * 0.3, s * 0.88, s * 0.4, s * 0.12, fill(frame));
    if (!open) {
      rect(c, s * 0.32, s * 0.12, s * 0.36, s * 0.38, fill('#4a5468'));
      rect(c, s * 0.32, s * 0.5, s * 0.36, s * 0.38, fill('#434c5f'));
      rect(c, s * 0.46, s * 0.12, s * 0.08, s * 0.76, fill(col));
      rect(c, s * 0.46, s * 0.12, s * 0.08, s * 0.76, glow(col, s * 0.04, 0.6));
    }
  }
  if (!open && lock?.type === 'bloom') {
    for (let i = 0; i < 5; i++) circle(c, s * (0.2 + i * 0.15), s * (0.3 + (i % 2) * 0.4), s * 0.12, fill('#8a2f75', 0.9));
  }
}
