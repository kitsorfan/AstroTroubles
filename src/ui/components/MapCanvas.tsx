import { Canvas, Circle, Group, Picture, RadialGradient, Rect, vec } from '@shopify/react-native-skia';
import { useEffect, useMemo, useRef } from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { SCAN_RADIUS } from '../../game/constants';
import { getDeck } from '../../game/data/decks';
import { lightRadius, ventsActive } from '../../game/engine/explore';
import { useGame } from '../../game/store/gameStore';
import { recordBolt, recordDarkness, recordEntities, recordKai, tileSizeFor } from '../render/layers';
import { recordGlow, recordStatic } from '../render/tiles';

interface Props {
  width: number;
  height: number;
}

function cameraFor(pos: { x: number; y: number }, T: number, mapW: number, mapH: number, w: number, h: number) {
  const cx = pos.x * T + T / 2 - w / 2;
  const cy = pos.y * T + T / 2 - h / 2;
  return {
    x: mapW <= w ? (mapW - w) / 2 : Math.max(0, Math.min(mapW - w, cx)),
    y: mapH <= h ? (mapH - h) / 2 : Math.max(0, Math.min(mapH - h, cy)),
  };
}

export function MapCanvas({ width, height }: Props) {
  const data = useGame((s) => s.data);
  const scanPulse = useGame((s) => s.scanPulse);
  const hurtPulse = useGame((s) => s.hurtPulse);
  const walkTo = useGame((s) => s.walkTo);

  const deck = getDeck(data.deck);
  const T = tileSizeFor(width);
  const mapW = deck.width * T;
  const mapH = deck.height * T;
  const cam = cameraFor(data.pos, T, mapW, mapH, width, height);
  const hot = ventsActive(deck, data);
  const boltJoined = !!data.flags.bolt_joined;
  const sticker = (data.inventory.sticker ?? 0) > 0;
  const flagCount = Object.keys(data.flags).length;
  const radius = lightRadius(data);

  const staticPic = useMemo(() => recordStatic(deck, T), [deck, T]);
  const glowPic = useMemo(() => recordGlow(deck, T, hot), [deck, T, hot]);
  // Entity visuals only change when flags or modules change; flags are append-only so their count is a cheap signature.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const entityPic = useMemo(() => recordEntities(deck, data, T), [deck, T, flagCount, data.modules.length]);
  const darkPic = useMemo(() => recordDarkness(deck, data.pos, radius, T), [deck, data.pos, radius, T]);
  const kaiPic = useMemo(() => recordKai(data.facing, T), [data.facing, T]);
  const boltPic = useMemo(() => recordBolt(data.facing, sticker, T), [data.facing, sticker, T]);

  const camX = useSharedValue(cam.x);
  const camY = useSharedValue(cam.y);
  const kx = useSharedValue(data.pos.x * T);
  const ky = useSharedValue(data.pos.y * T);
  const bx = useSharedValue(data.boltPos.x * T);
  const by = useSharedValue(data.boltPos.y * T);
  const pulse = useSharedValue(0.5);
  const scanProg = useSharedValue(1);
  const hurt = useSharedValue(0);
  const lastDeck = useRef(data.deck);

  useEffect(() => {
    const snap = lastDeck.current !== data.deck;
    lastDeck.current = data.deck;
    const t = (v: number) => (snap ? v : withTiming(v, { duration: 120, easing: Easing.linear }));
    kx.set(t(data.pos.x * T));
    ky.set(t(data.pos.y * T));
    bx.set(t(data.boltPos.x * T));
    by.set(t(data.boltPos.y * T));
    camX.set(snap ? cam.x : withTiming(cam.x, { duration: 160 }));
    camY.set(snap ? cam.y : withTiming(cam.y, { duration: 160 }));
  }, [data.deck, data.pos.x, data.pos.y, data.boltPos.x, data.boltPos.y, cam.x, cam.y, T, kx, ky, bx, by, camX, camY]);

  useEffect(() => {
    pulse.set(withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [pulse]);

  useEffect(() => {
    if (scanPulse === 0) return;
    scanProg.set(0);
    scanProg.set(withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) }));
  }, [scanPulse, scanProg]);

  useEffect(() => {
    if (hurtPulse === 0) return;
    hurt.set(withSequence(withTiming(0.35, { duration: 60 }), withTiming(0, { duration: 350 })));
  }, [hurtPulse, hurt]);

  const camTransform = useDerivedValue(() => [{ translateX: -camX.get() }, { translateY: -camY.get() }]);
  const kaiTransform = useDerivedValue(() => [{ translateX: kx.get() }, { translateY: ky.get() }]);
  const boltTransform = useDerivedValue(() => [{ translateX: bx.get() }, { translateY: by.get() - T * 0.18 }]);
  const scanR = useDerivedValue(() => scanProg.get() * SCAN_RADIUS * T);
  const scanOpacity = useDerivedValue(() => (1 - scanProg.get()) * 0.9);
  const scanCx = useDerivedValue(() => kx.get() + T / 2);
  const scanCy = useDerivedValue(() => ky.get() + T / 2);

  const onPress = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    const tx = Math.floor((locationX + cam.x) / T);
    const ty = Math.floor((locationY + cam.y) / T);
    walkTo(tx, ty);
  };

  return (
    <Pressable onPress={onPress} style={{ width, height }}>
      <Canvas style={{ width, height, pointerEvents: 'none' }}>
        <Rect x={0} y={0} width={width} height={height} color={deck.def.theme.bg} />
        <Group transform={camTransform}>
          <Picture picture={staticPic} />
          <Group opacity={pulse}>
            <Picture picture={glowPic} />
          </Group>
          <Picture picture={entityPic} />
          <Picture picture={darkPic} />
          {boltJoined && (
            <Group transform={boltTransform}>
              <Picture picture={boltPic} />
            </Group>
          )}
          <Group transform={kaiTransform}>
            <Picture picture={kaiPic} />
          </Group>
          <Circle cx={scanCx} cy={scanCy} r={scanR} style="stroke" strokeWidth={3} color="#5ee0ff" opacity={scanOpacity} />
        </Group>
        <Rect x={0} y={0} width={width} height={height}>
          <RadialGradient
            c={vec(width / 2, height / 2)}
            r={Math.max(width, height) * 0.72}
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']}
            positions={[0, 0.55, 1]}
          />
        </Rect>
        <Rect x={0} y={0} width={width} height={height} color="#ff2030" opacity={hurt} />
      </Canvas>
    </Pressable>
  );
}
