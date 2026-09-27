import { Canvas, createPicture, Picture, type SkCanvas } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { View } from 'react-native';

import type { SpeakerId } from '../../game/types';
import { circle, fill, glow, oval, rect, rrect, star, stroke } from '../render/draw';
import { drawBolt, drawObject } from '../render/sprites';
import { C } from '../theme';

function face(c: SkCanvas, s: number, skin: string, hair: string, body: string, extra?: (c: SkCanvas) => void) {
  rrect(c, s * 0.18, s * 0.7, s * 0.64, s * 0.4, s * 0.16, fill(body));
  circle(c, s / 2, s * 0.44, s * 0.24, fill(skin));
  oval(c, s / 2, s * 0.26, s * 0.25, s * 0.12, fill(hair));
  circle(c, s * 0.42, s * 0.46, s * 0.025, fill('#1b1b1b'));
  circle(c, s * 0.58, s * 0.46, s * 0.025, fill('#1b1b1b'));
  rect(c, s * 0.45, s * 0.56, s * 0.1, s * 0.015, fill('#5a3a2a'));
  extra?.(c);
}

function drawPortrait(c: SkCanvas, speaker: SpeakerId, s: number) {
  switch (speaker) {
    case 'kai':
      rrect(c, s * 0.16, s * 0.68, s * 0.68, s * 0.42, s * 0.16, fill('#ff8a3d'));
      circle(c, s / 2, s * 0.42, s * 0.28, fill('#e8eef8'));
      rrect(c, s * 0.3, s * 0.36, s * 0.4, s * 0.16, s * 0.08, fill('#5ee0ff'));
      oval(c, s * 0.4, s * 0.41, s * 0.06, s * 0.03, fill('#ffffff', 0.6));
      break;
    case 'bolt':
      drawBolt(c, s, { facing: 'down' });
      break;
    case 'halcyon':
      circle(c, s / 2, s / 2, s * 0.36, fill('#1b0e10'));
      circle(c, s / 2, s / 2, s * 0.3, stroke('#ff5e3a', 2));
      circle(c, s / 2, s / 2, s * 0.18, fill('#ff5e3a'));
      circle(c, s / 2, s / 2, s * 0.26, glow('#ff5e3a', s * 0.08, 0.5));
      circle(c, s / 2, s / 2, s * 0.06, fill('#ffe0c0'));
      break;
    case 'bloom':
      circle(c, s / 2, s / 2, s * 0.4, glow('#ff6fcf', s * 0.12, 0.6));
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8;
        oval(c, s / 2 + Math.cos(a) * s * 0.2, s / 2 + Math.sin(a) * s * 0.2, s * 0.1, s * 0.1, fill(i % 2 ? '#5e9bff' : '#ffd166'));
      }
      circle(c, s / 2, s / 2, s * 0.12, fill('#ffe0f4'));
      break;
    case 'log':
      rrect(c, s * 0.18, s * 0.28, s * 0.64, s * 0.44, s * 0.06, fill('#2a2f3a'));
      rect(c, s * 0.26, s * 0.34, s * 0.48, s * 0.14, fill('#ffd166'));
      circle(c, s * 0.36, s * 0.6, s * 0.05, fill('#c0c8d4'));
      circle(c, s * 0.64, s * 0.6, s * 0.05, fill('#c0c8d4'));
      break;
    case 'voss':
      face(c, s, '#e8c4a8', '#8a6a4a', '#1c2a4f', (cc) => {
        rrect(cc, s * 0.22, s * 0.14, s * 0.56, s * 0.12, s * 0.04, fill('#1c2a4f'));
        star(cc, s / 2, s * 0.2, s * 0.05, fill('#ffd166'));
        rect(cc, s * 0.3, s * 0.78, s * 0.12, s * 0.04, fill('#ffd166'));
      });
      break;
    case 'okafor':
      face(c, s, '#6b4630', '#1b120c', '#e8eef8', (cc) => {
        circle(cc, s * 0.42, s * 0.46, s * 0.07, stroke('#c0c8d4', 1.5));
        circle(cc, s * 0.58, s * 0.46, s * 0.07, stroke('#c0c8d4', 1.5));
      });
      break;
    case 'dray':
      face(c, s, '#d8b090', '#3a3a3a', '#6b1f26', (cc) => {
        rect(cc, s * 0.36, s * 0.4, s * 0.1, s * 0.02, fill('#1b1b1b'));
        rect(cc, s * 0.54, s * 0.4, s * 0.1, s * 0.02, fill('#1b1b1b'));
      });
      break;
    case 'mia':
      face(c, s, '#e8c0a0', '#2a1a10', '#ff6fcf');
      break;
    case 'nair':
    case 'haddad':
    case 'hollis':
    case 'juno':
    case 'tanaka':
      drawObject(c, 'survivor', s, { variant: speaker });
      break;
    case 'vendor':
      drawObject(c, 'vendor', s);
      break;
    default:
      break;
  }
}

export function Portrait({ speaker, size = 64 }: { speaker: SpeakerId; size?: number }) {
  const pic = useMemo(() => createPicture((c) => drawPortrait(c, speaker, size), { width: size, height: size }), [speaker, size]);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        backgroundColor: '#0e1628',
        borderWidth: 1,
        borderColor: C.borderHi,
        overflow: 'hidden',
      }}
    >
      <Canvas style={{ width: size, height: size }}>
        <Picture picture={pic} />
      </Canvas>
    </View>
  );
}
