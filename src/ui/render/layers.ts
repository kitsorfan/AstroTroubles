import { createPicture, type SkPicture } from '@shopify/react-native-skia';

import { ENEMIES } from '../../game/data/enemies';
import { isDoorOpen, isEnemyAlive, isObjectVisible, isPickupAvailable } from '../../game/engine/explore';
import { tileAt } from '../../game/engine/mapParser';
import type { Dir, GameData, ParsedDeck } from '../../game/types';
import { circle, fill, glow, rect, stroke } from './draw';
import { drawBolt, drawDoor, drawEnemy, drawKai, drawObject, drawPickup, pickupKind } from './sprites';

export function tileSizeFor(width: number): number {
  return Math.max(28, Math.floor(Math.min(width, 520) / 11));
}

export function recordEntities(deck: ParsedDeck, d: GameData, T: number): SkPicture {
  const th = deck.def.theme;
  return createPicture(
    (c) => {
      for (const e of deck.entities) {
        const x = e.x * T;
        const y = e.y * T;
        c.save();
        c.translate(x, y);
        switch (e.def.kind) {
          case 'door': {
            const horizontal = tileAt(deck, e.x - 1, e.y) === 'wall' && tileAt(deck, e.x + 1, e.y) === 'wall';
            drawDoor(c, T, e.def.lock, isDoorOpen(e, d), horizontal, th.wall);
            break;
          }
          case 'enemy': {
            if (!isEnemyAlive(e, d)) break;
            const def = ENEMIES[e.def.enemies[0]];
            const scale = e.def.finale ? 2.4 : e.def.boss ? 1.5 : 1;
            if (e.def.boss) circle(c, T / 2, T / 2, T * 0.55 * scale, glow('#ff3050', T * 0.25, 0.35));
            c.save();
            c.translate(T / 2, T * 0.9);
            c.scale(scale, scale);
            c.translate(-T / 2, -T * 0.9);
            drawEnemy(c, def.sprite, T, { shield: def.shielded });
            c.restore();
            if (e.def.enemies.length > 1) {
              circle(c, T * 0.86, T * 0.14, T * 0.13, fill('#ff5e6a'));
              circle(c, T * 0.86, T * 0.14, T * 0.13, stroke('#1b0b10', 1.2));
            }
            break;
          }
          case 'pickup':
            if (isPickupAvailable(e, d)) {
              drawPickup(c, pickupKind(e.def.give), T);
              if (e.def.hidden) circle(c, T / 2, T / 2, T * 0.42, stroke('#ffffff', 1, 0.5));
            }
            break;
          case 'object':
            if (isObjectVisible(e, d)) {
              drawObject(c, e.def.sprite, T, {
                variant: e.def.variant,
                sealed: e.def.sprite === 'breach' && !!d.flags[`${deck.id}:sealed`],
                accent: th.accent,
              });
            }
            break;
          default:
            break;
        }
        c.restore();
      }
    },
    { width: deck.width * T, height: deck.height * T },
  );
}

export function recordDarkness(deck: ParsedDeck, pos: { x: number; y: number }, radius: number, T: number): SkPicture {
  return createPicture(
    (c) => {
      for (let ty = 0; ty < deck.height; ty++) {
        for (let tx = 0; tx < deck.width; tx++) {
          if (!deck.dark[ty * deck.width + tx]) continue;
          const dist = Math.hypot(tx - pos.x, ty - pos.y);
          let a = 0;
          if (dist >= radius + 1) a = 0.96;
          else if (dist > radius - 0.5) a = Math.min(0.96, ((dist - (radius - 0.5)) / 1.5) * 0.96);
          if (a > 0.01) rect(c, tx * T - 0.5, ty * T - 0.5, T + 1, T + 1, fill('#000000', Math.round(a * 20) / 20));
        }
      }
    },
    { width: deck.width * T, height: deck.height * T },
  );
}

export function recordKai(facing: Dir, T: number): SkPicture {
  return createPicture((c) => drawKai(c, T, facing), { width: T, height: T });
}

export function recordBolt(facing: Dir, sticker: boolean, T: number): SkPicture {
  return createPicture(
    (c) => {
      c.save();
      c.translate(T * 0.15, T * 0.1);
      c.scale(0.7, 0.7);
      drawBolt(c, T, { facing, sticker });
      c.restore();
    },
    { width: T, height: T },
  );
}
