import { Canvas, createPicture, Picture } from '@shopify/react-native-skia';
import { useMemo } from 'react';

import { getDeck } from '../../game/data/decks';
import { isEnemyAlive, isObjectVisible, isPickupAvailable } from '../../game/engine/explore';
import { WALKABLE } from '../../game/engine/mapParser';
import type { GameData } from '../../game/types';
import { circle, fill, rect } from '../render/draw';

export function MiniMap({ data, width }: { data: GameData; width: number }) {
  const deck = getDeck(data.deck);
  const s = Math.floor(width / deck.width);
  const w = s * deck.width;
  const h = s * deck.height;
  const flagCount = Object.keys(data.flags).length;
  const pic = useMemo(
    () =>
      createPicture(
        (c) => {
          const th = deck.def.theme;
          rect(c, 0, 0, w, h, fill('#03050a'));
          for (let y = 0; y < deck.height; y++) {
            for (let x = 0; x < deck.width; x++) {
              const t = deck.tiles[y * deck.width + x];
              if (t === 'void') continue;
              const color = t === 'wall' ? th.wall : WALKABLE[t] ? (deck.dark[y * deck.width + x] ? '#10141f' : th.floor) : '#2a3040';
              rect(c, x * s, y * s, s, s, fill(t === 'vent' ? '#5a2a14' : color));
            }
          }
          for (const e of deck.entities) {
            const cx = e.x * s + s / 2;
            const cy = e.y * s + s / 2;
            if (e.def.kind === 'enemy' && isEnemyAlive(e, data)) circle(c, cx, cy, s * (e.def.boss ? 0.6 : 0.4), fill('#ff4757'));
            if (e.def.kind === 'pickup' && isPickupAvailable(e, data)) circle(c, cx, cy, s * 0.3, fill('#ffd166'));
            if (e.def.kind === 'door' && !data.flags[`open:${e.id}`]) rect(c, e.x * s, e.y * s, s, s, fill('#8a93a3'));
            if (e.def.kind === 'object' && isObjectVisible(e, data)) {
              const col =
                e.def.sprite === 'elevator'
                  ? '#7dff9a'
                  : e.def.sprite === 'medstation'
                    ? '#3ddc84'
                    : e.def.sprite === 'survivor'
                      ? '#ff6fcf'
                      : e.def.sprite === 'breach'
                        ? '#ff5e6a'
                        : '#5ee0ff';
              rect(c, e.x * s, e.y * s, s, s, fill(col));
            }
          }
        },
        { width: w, height: h },
      ),
    // Entity markers change only when flags change; flag keys are append-only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deck, s, w, h, flagCount],
  );
  const kx = data.pos.x * s + s / 2;
  const ky = data.pos.y * s + s / 2;
  const marker = useMemo(
    () => createPicture((c) => circle(c, kx, ky, Math.max(3, s * 0.7), fill('#ff8a3d')), { width: w, height: h }),
    [kx, ky, s, w, h],
  );
  return (
    <Canvas style={{ width: w, height: h, alignSelf: 'center' }}>
      <Picture picture={pic} />
      <Picture picture={marker} />
    </Canvas>
  );
}
