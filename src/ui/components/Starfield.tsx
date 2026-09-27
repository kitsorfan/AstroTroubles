import { Canvas, createPicture, Group, Picture, RadialGradient, Rect, vec } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { Easing, useDerivedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { circle, fill, glow, rect, rrect } from '../render/draw';

function stars(w: number, h: number, count: number, seed: number, maxR: number) {
  return createPicture(
    (c) => {
      let s = seed;
      const r = () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
      };
      for (let i = 0; i < count; i++) {
        const size = 0.4 + r() * maxR;
        circle(c, r() * w, r() * h, size, fill('#ffffff', 0.25 + r() * 0.7));
      }
    },
    { width: w, height: h },
  );
}

function ship(w: number) {
  const L = w * 0.9;
  const H = L * 0.12;
  return createPicture(
    (c) => {
      rrect(c, 0, H * 0.3, L, H * 0.45, H * 0.2, fill('#1d2740'));
      rect(c, L * 0.05, H * 0.1, L * 0.18, H * 0.85, fill('#232f4d'));
      rect(c, L * 0.3, 0, L * 0.12, H, fill('#26345a'));
      rect(c, L * 0.55, H * 0.15, L * 0.2, H * 0.7, fill('#212c48'));
      rrect(c, L * 0.8, H * 0.2, L * 0.2, H * 0.6, H * 0.3, fill('#2a3a62'));
      for (let i = 0; i < 26; i++) circle(c, L * 0.08 + i * L * 0.034, H * 0.52, 1.3, fill(i % 5 === 0 ? '#ffd166' : '#5ee0ff', 0.8));
      circle(c, L * 0.36, H * 0.4, H * 0.28, glow('#ff6fcf', H * 0.2, 0.55));
      circle(c, L * 0.63, H * 0.6, H * 0.22, glow('#ff6fcf', H * 0.16, 0.45));
      circle(c, L * 0.18, H * 0.35, H * 0.16, glow('#ff6fcf', H * 0.12, 0.4));
      circle(c, -H * 0.1, H * 0.52, H * 0.25, glow('#5ee0ff', H * 0.2, 0.7));
    },
    { width: L, height: H },
  );
}

export function Starfield({ width, height, showShip = true }: { width: number; height: number; showShip?: boolean }) {
  const far = useMemo(() => stars(width, height, 120, 7, 0.8), [width, height]);
  const near = useMemo(() => stars(width, height, 40, 99, 1.6), [width, height]);
  const shipPic = useMemo(() => ship(width), [width]);
  const t = useSharedValue(0);
  const drift = useSharedValue(0);

  useEffect(() => {
    t.set(withRepeat(withTiming(1, { duration: 60000, easing: Easing.linear }), -1, false));
    drift.set(withRepeat(withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [t, drift]);

  const farT = useDerivedValue(() => [{ translateX: -t.get() * width }]);
  const farT2 = useDerivedValue(() => [{ translateX: width - t.get() * width }]);
  const nearT = useDerivedValue(() => [{ translateX: -((t.get() * 3) % 1) * width }]);
  const nearT2 = useDerivedValue(() => [{ translateX: width - ((t.get() * 3) % 1) * width }]);
  const shipT = useDerivedValue(() => [{ translateX: width * 0.05 }, { translateY: height * 0.58 + drift.get() * 8 }]);

  return (
    <Canvas style={{ position: 'absolute', left: 0, top: 0, width, height, pointerEvents: 'none' }}>
      <Rect x={0} y={0} width={width} height={height} color="#03040a" />
      <Rect x={0} y={0} width={width} height={height}>
        <RadialGradient c={vec(width * 0.95, height * 0.2)} r={width * 0.9} colors={['#ffcf7a', 'rgba(255,122,58,0.33)', 'rgba(3,4,10,0)']} positions={[0, 0.18, 1]} />
      </Rect>
      <Group transform={farT}>
        <Picture picture={far} />
      </Group>
      <Group transform={farT2}>
        <Picture picture={far} />
      </Group>
      <Group transform={nearT}>
        <Picture picture={near} />
      </Group>
      <Group transform={nearT2}>
        <Picture picture={near} />
      </Group>
      {showShip && (
        <Group transform={shipT}>
          <Picture picture={shipPic} />
        </Group>
      )}
    </Canvas>
  );
}
