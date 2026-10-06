import * as THREE from 'three';

import { audio } from '../core/audio';
import { haptic } from '../core/bridge';
import { tr } from '../core/i18n';
import { BROADCAST, ENDING_CAPTIONS, PROLOGUE2, STOLEN, TRANSITIONS } from '../game/story';
import type { DeckId, EndingKind } from '../world/levelTypes';
import { ease, type Director } from './director';
import { PlanetScene } from './planetScene';
import type { ShipScene } from './shipScene';

/**
 * Chapter 2 cinematics: the {ship} arrives at Gaia Nova and GaScu is stolen (out in space), the
 * shuttle's descent and its hops between regions (over the planet), and the chapter's ending.
 */

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

function after(d: Director, seconds: number, fn: () => Promise<void> | void) {
  return (async () => {
    await d.wait(seconds);
    await fn();
  })();
}

/* ---------------- arrival (in space) ---------------- */

export async function arrival(d: Director, s: ShipScene) {
  const ship = s.ship;
  s.setChapter(0);
  s.setStar(2400);
  ship.setGrowth(0);
  ship.group.rotation.y = 0;
  // Gaia Nova fills the view ahead of the ship.
  const world = V(420, -60, -120);
  s.planet.visible = true;
  s.planet.position.copy(world);
  s.planet.scale.setScalar(2.4);
  d.cut(V(-120, 30, 90), V(60, 0, 0), 44);
  d.fade('#000000', 1, 0);
  await d.title(tr('GAIA NOVA'), tr('Chapter 2'), '#7fd0ff');
  await Promise.all([d.fade('#000000', 0, 1.6), d.cam(V(-60, 20, 70), world.clone().lerp(V(), 0.5), 6, ease.inOut), d.caption(PROLOGUE2.arrive, 5.5)]);
  await Promise.all([d.cam(V(80, 26, 60), world, 5.5, ease.inOut), d.caption(PROLOGUE2.team, 5)]);
  // A little shuttle drops away toward the planet... and goes quiet.
  ship.lift.visible = true;
  ship.lift.position.set(20, -4, 0);
  const from = ship.lift.position.clone();
  await Promise.all([
    d.caption(PROLOGUE2.quiet, 4),
    d.tween(4, (k) => ship.lift.position.lerpVectors(from, world.clone().lerp(from, 0.75), k), ease.in),
  ]);
  ship.lift.visible = false;
  await d.caption(PROLOGUE2.signal, 3);
  // The broadcast: static, then General Brennus.
  audio.play('zap', 0.5);
  d.glitch(1);
  await d.say(BROADCAST);
  // That night, the drones come for GaScu.
  await d.cam(V(-20, 18, 46), V(0, 2, 0), 2, ease.inOut);
  const drone = s.comet;
  drone.visible = true;
  const top = V(-8, 6, 0);
  const startPos = world.clone().lerp(top, 0.4);
  await Promise.all([
    d.caption(PROLOGUE2.snatch, 5),
    d.tween(
      2.2,
      (k) => {
        drone.position.lerpVectors(startPos, top, k);
        drone.lookAt(top);
      },
      ease.out,
    ),
  ]);
  audio.play('roar', 1.4);
  s.flash(top.x, top.y, top.z, '#ff6fcf', 500);
  s.shake(1);
  haptic('heavy');
  await d.tween(
    2.4,
    (k) => {
      drone.position.lerpVectors(top, world, k);
      drone.lookAt(world);
      if (Math.random() < 0.8) s.particles.emit(drone.position.x, drone.position.y, drone.position.z, { count: 2, color: '#ff8ae0', speed: 1, life: 0.9, size: 1.6, gravity: 0 });
    },
    ease.in,
  );
  drone.visible = false;
  await d.say(STOLEN);
  await d.fade('#000000', 1, 1);
}

/* ---------------- the shuttle's descent (over the planet) ---------------- */

export async function descent(d: Director, p: PlanetScene) {
  const land = PlanetScene.region('plains', 6);
  const high = land.clone().add(V(-320, 420, 160));
  const sh = p.shuttle;
  sh.position.copy(high);
  p.aim(sh, high, land);
  sh.rotation.z = -0.35;
  d.cut(high.clone().add(V(-40, 20, 40)), high, 46);
  d.fade('#000000', 1, 0);
  audio.play('dash', 0.6);
  await Promise.all([
    d.fade('#000000', 0, 1.4),
    d.caption(PROLOGUE2.down, 6),
    d.tween(
      8,
      (k) => {
        sh.position.lerpVectors(high, land, k);
        sh.rotation.z = -0.35 * (1 - k);
        d.rig.pos.copy(sh.position).add(V(-26 + k * 10, 10 + k * 6, 30 - k * 10));
        d.rig.look.copy(sh.position);
        if (Math.random() < 0.7) p.particles.emit(sh.position.x - 3, sh.position.y, sh.position.z, { count: 1, color: '#ffffff', speed: 1, life: 1.2, size: 4, gravity: 0 });
      },
      ease.inOut,
    ),
  ]);
  p.shake(1.2);
  audio.play('pound', 0.7);
  await d.fade('#000000', 1, 0.9);
}

/* ---------------- between regions ---------------- */

export async function hop(d: Director, p: PlanetScene, from: DeckId, to: DeckId) {
  const a = PlanetScene.region(from, 40);
  const b = PlanetScene.region(to, 40);
  // Fly high enough to clear the mountains in between.
  const mid = a.clone().lerp(b, 0.5);
  mid.y = Math.max(a.y, b.y, PlanetScene.ground(mid.x, mid.z) + 60) + 30;
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  const sh = p.shuttle;
  sh.position.copy(a);
  p.aim(sh, a, b);
  d.cut(a.clone().add(V(-30, 20, 40)), a, 48);
  d.fade('#000000', 1, 0);
  audio.play('dash', 0.7);
  await Promise.all([
    d.fade('#000000', 0, 1.1),
    d.tween(
      11,
      (k) => {
        const at = curve.getPoint(k);
        const next = curve.getPoint(Math.min(1, k + 0.01));
        sh.position.copy(at);
        p.aim(sh, at, next);
        sh.rotation.z = (next.y - at.y) * 0.4;
        const side = V(next.z - at.z, 0, -(next.x - at.x)).normalize();
        d.rig.pos.copy(at).addScaledVector(side, 34).add(V(0, 16, 0));
        d.rig.look.copy(at).lerp(b, 0.15);
      },
      ease.inOut,
    ),
    after(d, 1, () => d.say(TRANSITIONS[from])),
  ]);
  await d.fade('#000000', 1, 0.8);
}

/* ---------------- the chapter 2 ending ---------------- */

export async function finale(d: Director, p: PlanetScene, kind: EndingKind) {
  const text = ENDING_CAPTIONS[kind];
  const volcano = PlanetScene.region('volcano', 0);
  const plains = PlanetScene.region('plains', 0);
  p.shuttle.visible = false;
  d.cut(volcano.clone().add(V(-200, 90, 160)), volcano.clone().add(V(0, 60, 0)), 46);
  d.fade('#ffffff', 1, 0);
  await Promise.all([d.fade('#ffffff', 0, 2), d.caption(text[0], 5), d.cam(volcano.clone().add(V(-170, 120, 120)), volcano.clone().add(V(0, 70, 0)), 5, ease.inOut)]);
  // The volcano calms and the Thorn Legion goes quiet.
  await Promise.all([d.caption(text[1], 5.5), d.tween(5, (k) => p.setSmoke(1 - k), ease.inOut), d.cam(volcano.clone().add(V(-260, 160, -80)), volcano.clone().add(V(-120, 0, 60)), 5.5, ease.inOut)]);
  // Shuttles of colonists come down from the sky.
  const fleet = p.fleet.map((f, i) => {
    f.visible = true;
    const end = plains.clone().add(V(-60 + i * 30, 8, -40 + (i % 2) * 50));
    const start = end.clone().add(V(-200 - i * 40, 380 + i * 30, 120));
    f.position.copy(start);
    p.aim(f, start, end);
    return { f, start, end };
  });
  await Promise.all([
    d.caption(text[2], 6),
    d.cam(plains.clone().add(V(-120, 70, 140)), plains.clone().add(V(0, 20, 0)), 6, ease.inOut),
    d.tween(
      6,
      (k) => {
        for (const { f, start, end } of fleet) f.position.lerpVectors(start, end, k);
      },
      ease.out,
    ),
  ]);
  // Flowers spread across the valley: gold if Brennus helped, pink otherwise... both glow.
  const gold = kind === 'redeemed';
  await Promise.all([
    d.caption(text[3], 6.5),
    d.cam(plains.clone().add(V(-40, 40, 90)), plains.clone().add(V(40, 10, 0)), 7, ease.inOut),
    d.tween(
      7,
      () => {
        for (let i = 0; i < 3; i++) {
          const x = plains.x + (Math.random() - 0.5) * 220;
          const z = plains.z + (Math.random() - 0.5) * 220;
          p.particles.emit(x, PlanetScene.ground(x, z) + 1, z, { count: 1, color: Math.random() < 0.5 ? (gold ? '#ffd166' : '#ff6fcf') : '#ffffff', speed: 0.5, up: 3, life: 3, size: 3, gravity: 0 });
        }
      },
      ease.linear,
    ),
    after(d, 5.5, () => d.fade('#000000', 1, 1.6)),
  ]);
}
