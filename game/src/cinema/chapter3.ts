import * as THREE from 'three';

import { audio } from '../core/audio';
import { haptic } from '../core/bridge';
import { tr } from '../core/i18n';
import { AEETES_INTRO, ARGO_BUILT, FLEECE, PROLOGUE3, TRANSITIONS } from '../game/story';
import { makeArgo } from '../vehicles/argoModel';
import type { DeckId } from '../world/levelTypes';
import { ease, type Director } from './director';
import type { MoonScene } from './moonScene';
import { PlanetScene } from './planetScene';

/**
 * Chapter 3 cinematics: the opening (the first garden on Gaia Nova, Celestia fading, the Gardeners'
 * ruins, the Argo built and launched, the ring of moons, Aeëtes's golden fleet), and the Argo's hops
 * between levels.
 */

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

function after(d: Director, seconds: number, fn: () => Promise<void> | void) {
  return (async () => {
    await d.wait(seconds);
    await fn();
  })();
}

/** Part 1, over Gaia Nova: the garden, Celestia fading, the ruins, the Argo built, and lift-off. */
export async function argoPrologue(d: Director, p: PlanetScene) {
  const plains = PlanetScene.region('plains', 0);
  p.shuttle.visible = false;
  // The Argo, turned to point along +X like the planet scene's ships.
  const argo = makeArgo();
  const ship = new THREE.Group();
  argo.root.rotation.y = -Math.PI / 2;
  argo.root.scale.setScalar(1.6);
  ship.add(argo.root);
  p.scene.add(ship);
  const pad = plains.clone().add(V(10, 3.5, 20));
  ship.position.copy(pad);
  let t = 0;
  const tick = (thrust: number) => {
    t += 1 / 60;
    argo.update(t, thrust);
  };
  d.cut(plains.clone().add(V(-160, 70, 150)), plains.clone().add(V(0, 10, 0)), 46);
  d.fade('#000000', 1, 0);
  await d.title(tr('THE ARGONAUTS'), tr('Chapter 3'), '#ffd166');
  await Promise.all([d.fade('#000000', 0, 1.6), d.cam(plains.clone().add(V(-90, 40, 90)), pad, 6, ease.inOut), d.caption(PROLOGUE3.garden, 5.5)]);
  await d.panel('ch3-fading', { lines: FLEECE });
  await d.panel('ch3-argo', { caption: PROLOGUE3.argo, seconds: 4.5 });
  await d.panel('ch3-argo', { lines: ARGO_BUILT });
  // Lift-off: the Argo climbs out of the valley and up into the sky.
  d.cut(pad.clone().add(V(-30, 6, 34)), pad.clone().add(V(0, 3, 0)), 48);
  await d.caption(PROLOGUE3.crew, 3.2);
  audio.play('dash', 0.6);
  haptic('medium');
  p.shake(0.6);
  const sky = pad.clone().add(V(260, 420, -120));
  await Promise.all([
    d.caption(PROLOGUE3.launch, 5),
    d.tween(
      7,
      (k) => {
        tick(1);
        const e = k * k;
        ship.position.lerpVectors(pad, sky, e);
        ship.rotation.z = Math.min(0.6, k * 1.2);
        d.rig.look.copy(ship.position);
        if (Math.random() < 0.6) p.particles.emit(ship.position.x - 4, ship.position.y - 1, ship.position.z, { count: 1, color: '#bff4ff', speed: 1, life: 1.4, size: 4, gravity: 0 });
      },
      ease.linear,
    ),
    d.cam(pad.clone().add(V(-60, 30, 70)), sky, 7, ease.inOut),
  ]);
  await d.fade('#000000', 1, 0.8);
}

/** Part 2, in space: the ring of moons, and Aeëtes's golden salvage fleet. */
export async function argoVoyage(d: Director, m: MoonScene) {
  const argo = m.argo.root;
  argo.position.set(0, 0, 0);
  argo.rotation.set(0, 0.25, 0);
  m.thrust = 0.6;
  d.cut(V(-18, 6, 22), V(0, 1, -6), 46);
  d.fade('#000000', 1, 0);
  const giant = m.giant.group.position;
  await Promise.all([
    d.fade('#000000', 0, 1.2),
    d.caption(PROLOGUE3.moons, 5.5),
    d.tween(6, (k) => argo.position.set(0, 0, -k * 60), ease.linear),
    d.cam(V(14, 4, 10), giant.clone().multiplyScalar(0.05), 6, ease.inOut),
  ]);
  // Gold ships slide in out of the dark: Aeëtes's salvage fleet.
  const ships = m.fleet.map((f, i) => {
    f.visible = true;
    const end = V(70 + i * 55, -10 + i * 22, -170 - i * 70);
    const start = end.clone().add(V(260, 40, 120));
    f.position.copy(start);
    f.rotation.y = -0.9;
    return { f, start, end };
  });
  audio.play('roar', 0.5, 0.7);
  await Promise.all([
    d.caption(PROLOGUE3.gold, 3.5),
    d.tween(5, (k) => {
      for (const s of ships) s.f.position.lerpVectors(s.start, s.end, k);
    }),
    d.cam(V(-30, 14, 30), V(90, 10, -200), 5, ease.inOut),
  ]);
  await d.panel('ch3-aeetes', { lines: AEETES_INTRO });
  await d.fade('#000000', 1, 1);
}

/**
 * Between chapter 3 levels: the Argo sails on through the moons while the crew talks. `to` is the next
 * level, or null while it's still being built (the hop then ends on a "coming soon" card).
 */
export async function argoHop(d: Director, m: MoonScene, from: DeckId, to: string | null) {
  const argo = m.argo.root;
  argo.position.set(0, 0, 0);
  argo.rotation.set(0, -0.3, 0);
  m.thrust = 0.8;
  d.cut(V(16, 5, 14), V(0, 1, -10), 48);
  d.fade('#000000', 1, 0);
  await Promise.all([
    d.fade('#000000', 0, 1),
    d.tween(9, (k) => argo.position.set(-k * 20, k * 4, -k * 120), ease.linear),
    d.cam(V(-24, 10, -40), V(-60, 0, -400), 9, ease.inOut),
    after(d, 0.8, () => d.say(TRANSITIONS[from] ?? [])),
  ]);
  if (!to) {
    await d.title(tr('TO BE CONTINUED'), tr(PROLOGUE3.soon), '#ffd166');
    await d.wait(1);
  }
  await d.fade('#000000', 1, 0.8);
}
