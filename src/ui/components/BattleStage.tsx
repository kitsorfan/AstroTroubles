import { Canvas, Circle, createPicture, Group, LinearGradient, Oval, Path, Picture, Rect, Skia, vec } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ENEMIES } from '../../game/data/enemies';
import type { BattleEnemy, DeckTheme, FxKind } from '../../game/types';
import { fill, line, stroke } from '../render/draw';
import { drawEnemy } from '../render/sprites';

export interface EnemySlot {
  enemy: BattleEnemy;
  x: number;
  size: number;
  selected: boolean;
  hit: number;
  lunge: number;
}

export interface StageFx {
  id: number;
  kind: FxKind;
  x: number;
  y: number;
}

function EnemyNode({ slot, baseY }: { slot: EnemySlot; baseY: number }) {
  const { enemy, size } = slot;
  const def = ENEMIES[enemy.id];
  const shielded = !!def.shielded && enemy.shieldDown <= 0;
  const pic = useMemo(
    () => createPicture((c) => drawEnemy(c, def.sprite, size, { shield: shielded }), { width: size, height: size }),
    [def.sprite, size, shielded],
  );
  const x = useSharedValue(slot.x);
  const dx = useSharedValue(0);
  const dy = useSharedValue(0);
  const alpha = useSharedValue(0);
  const scale = useSharedValue(0.6);
  const bob = useSharedValue(0);

  useEffect(() => {
    alpha.set(withTiming(1, { duration: 300 }));
    scale.set(withTiming(1, { duration: 300, easing: Easing.out(Easing.back(1.6)) }));
  }, [alpha, scale]);

  useEffect(() => {
    x.set(withTiming(slot.x, { duration: 300 }));
  }, [slot.x, x]);

  useEffect(() => {
    if (!slot.hit) return;
    dx.set(withSequence(withTiming(10, { duration: 40 }), withTiming(-10, { duration: 60 }), withTiming(6, { duration: 50 }), withTiming(0, { duration: 60 })));
  }, [slot.hit, dx]);

  useEffect(() => {
    if (!slot.lunge) return;
    dy.set(withSequence(withTiming(22, { duration: 110, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 180 })));
  }, [slot.lunge, dy]);

  useEffect(() => {
    if (enemy.dead) {
      alpha.set(withTiming(0, { duration: 600 }));
      scale.set(withTiming(0.5, { duration: 600 }));
    }
  }, [enemy.dead, alpha, scale]);

  useEffect(() => {
    bob.set(withRepeat(withTiming(-4, { duration: 900, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [bob]);

  const transform = useDerivedValue(() => [
    { translateX: x.get() - size / 2 + dx.get() },
    { translateY: baseY - size + dy.get() + bob.get() },
    { translateX: size / 2 },
    { translateY: size },
    { scale: scale.get() },
    { translateX: -size / 2 },
    { translateY: -size },
  ]);

  const ringColor = enemy.hacked > 0 ? '#7dff9a' : slot.selected ? '#ffd166' : 'transparent';
  return (
    <Group transform={transform} opacity={alpha}>
      <Oval x={size * 0.16} y={size * 0.8} width={size * 0.68} height={size * 0.16} color={ringColor} style="stroke" strokeWidth={2.5} opacity={0.9} />
      <Picture picture={pic} />
      {enemy.charging ? <Circle cx={size / 2} cy={size / 2} r={size * 0.5} color="#ff3040" opacity={0.18} /> : null}
    </Group>
  );
}

function zapPath(x0: number, y0: number, x1: number, y1: number) {
  const p = Skia.PathBuilder.Make();
  p.moveTo(x0, y0);
  const steps = 7;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const off = (i % 2 ? 1 : -1) * (10 + (i * 7) % 13);
    p.lineTo(x0 + (x1 - x0) * t + off, y0 + (y1 - y0) * t);
  }
  p.lineTo(x1, y1);
  return p.detach();
}

const FX_DURATION: Record<FxKind, number> = {
  zap: 380,
  fire: 520,
  emp: 600,
  frost: 520,
  flash: 450,
  hack: 520,
  scan: 700,
  light: 900,
  slash: 280,
  shot: 260,
  heal: 500,
};

function FxNode({ fx, width, height }: { fx: StageFx; width: number; height: number }) {
  const prog = useSharedValue(0);
  useEffect(() => {
    prog.set(withTiming(1, { duration: FX_DURATION[fx.kind], easing: Easing.out(Easing.quad) }));
  }, [prog, fx.kind]);
  const fade = useDerivedValue(() => 1 - prog.get());
  const grow = useDerivedValue(() => 10 + prog.get() * 60);
  const wide = useDerivedValue(() => prog.get() * Math.max(width, height));
  const halfFade = useDerivedValue(() => (1 - prog.get()) * 0.8);
  const scanY = useDerivedValue(() => fx.y - 50 + prog.get() * 100);
  const core = useDerivedValue(() => 6 + prog.get() * 35);

  switch (fx.kind) {
    case 'zap': {
      const p = zapPath(width / 2, height, fx.x, fx.y);
      return (
        <Group opacity={fade}>
          <Path path={p} color="#5ee0ff" style="stroke" strokeWidth={7} opacity={0.35} />
          <Path path={p} color="#e6fbff" style="stroke" strokeWidth={2.5} />
        </Group>
      );
    }
    case 'shot': {
      const p = Skia.PathBuilder.Make().moveTo(width / 2, height).lineTo(fx.x, fx.y).detach();
      return <Path path={p} color="#ffd166" style="stroke" strokeWidth={4} opacity={fade} />;
    }
    case 'slash': {
      const p = Skia.PathBuilder.Make().moveTo(fx.x - 40, fx.y - 30).quadTo(fx.x + 10, fx.y - 10, fx.x + 40, fx.y + 35).detach();
      return <Path path={p} color="#ffffff" style="stroke" strokeWidth={5} opacity={fade} />;
    }
    case 'fire':
      return (
        <Group opacity={fade}>
          <Circle cx={fx.x} cy={fx.y} r={grow} color="#ff7a2a" opacity={0.55} />
          <Circle cx={fx.x} cy={fx.y} r={core} color="#ffd27a" opacity={0.8} />
        </Group>
      );
    case 'frost':
      return (
        <Group opacity={fade}>
          <Circle cx={fx.x} cy={fx.y} r={grow} color="#bff0ff" opacity={0.5} />
          <Circle cx={fx.x} cy={fx.y} r={grow} color="#ffffff" style="stroke" strokeWidth={3} />
        </Group>
      );
    case 'emp':
      return <Circle cx={width / 2} cy={height * 0.55} r={wide} color="#5e9bff" style="stroke" strokeWidth={10} opacity={halfFade} />;
    case 'flash':
      return <Rect x={0} y={0} width={width} height={height} color="#ffffff" opacity={halfFade} />;
    case 'light':
      return (
        <Group opacity={fade}>
          <Rect x={0} y={0} width={width} height={height} color="#ffd166" opacity={0.18} />
          <Circle cx={fx.x || width / 2} cy={fx.y || height / 2} r={wide} color="#ffe9a8" opacity={0.25} />
        </Group>
      );
    case 'scan':
      return (
        <Group opacity={fade}>
          <Rect x={fx.x - 60} y={scanY} width={120} height={3} color="#7dff9a" />
          <Circle cx={fx.x} cy={fx.y} r={60} color="#7dff9a" style="stroke" strokeWidth={1.5} />
        </Group>
      );
    case 'hack':
      return (
        <Group opacity={fade}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Rect key={i} x={fx.x - 45 + ((i * 37) % 90)} y={fx.y - 40 + ((i * 53) % 80)} width={10} height={10} color="#7dff9a" />
          ))}
        </Group>
      );
    case 'heal':
      return <Circle cx={fx.x} cy={fx.y} r={grow} color="#7dff9a" opacity={halfFade} />;
  }
}

export function BattleStage({
  width,
  height,
  theme,
  slots,
  fx,
}: {
  width: number;
  height: number;
  theme: DeckTheme;
  slots: EnemySlot[];
  fx: StageFx[];
}) {
  const floorY = height * 0.86;
  const bg = useMemo(
    () =>
      createPicture(
        (c) => {
          const horizon = height * 0.5;
          for (let i = 0; i <= 10; i++) {
            const x = (width * i) / 10;
            line(c, width / 2 + (x - width / 2) * 0.25, horizon, x, height, stroke(theme.wallTop, 1, 0.18));
          }
          for (let i = 0; i < 6; i++) {
            const t = i / 6;
            const y = horizon + (height - horizon) * t * t;
            line(c, 0, y, width, y, stroke(theme.wallTop, 1, 0.12 + t * 0.1));
          }
          for (let i = 0; i < 40; i++) {
            const px = ((i * 97) % 100) / 100;
            const py = ((i * 61) % 100) / 100;
            c.drawCircle(px * width, py * horizon, 1 + (i % 3) * 0.5, fill('#ffffff', 0.15 + (i % 5) * 0.08));
          }
        },
        { width, height },
      ),
    [width, height, theme.wallTop],
  );
  return (
    <Canvas style={{ width, height, pointerEvents: 'none' }}>
      <Rect x={0} y={0} width={width} height={height}>
        <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={[theme.bg, theme.floor, '#000000']} />
      </Rect>
      <Picture picture={bg} />
      {slots.map((s) => (
        <EnemyNode key={s.enemy.uid} slot={s} baseY={floorY} />
      ))}
      {fx.map((f) => (
        <FxNode key={f.id} fx={f} width={width} height={height} />
      ))}
    </Canvas>
  );
}

