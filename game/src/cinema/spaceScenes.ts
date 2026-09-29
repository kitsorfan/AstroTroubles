import * as THREE from 'three';

import { audio } from '../core/audio';
import { haptic } from '../core/bridge';
import { ENDING_CAPTIONS, PROLOGUE, TRANSITIONS } from '../game/story';
import type { DeckId } from '../world/levelTypes';
import { ease, type Director } from './director';
import { ColonyShip } from './colonyShip';
import type { ShipScene } from './shipScene';

/**
 * Cinematics staged outside the ship. The SYRACUSIA points along +X; the star lies straight ahead,
 * getting bigger with every deck Kai climbs.
 */

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

function after(d: Director, seconds: number, fn: () => Promise<void> | void) {
  return (async () => {
    await d.wait(seconds);
    await fn();
  })();
}

/* ---------------- prologue ---------------- */

export async function prologue(d: Director, s: ShipScene) {
  const ship = s.ship;
  s.setChapter(0);
  s.setStar(1600);
  // At first the ship is cruising somewhere else; the star is off to one side.
  ship.group.rotation.y = -0.6;
  d.cut(V(-150, 20, 60), V(-40, 0, 0), 40);
  d.fade('#000000', 1, 0);
  await d.fade('#000000', 0, 1.6);

  // 1. A slow tracking shot along the hull.
  await Promise.all([d.cam(V(-30, 14, 48), V(10, 0, 0), 9, ease.inOut), d.caption(PROLOGUE.ship, 4.5).then(() => d.caption(PROLOGUE.quiet, 4))]);

  // 2. Something comes out of the dark.
  ship.group.updateMatrixWorld(true);
  const impact = ship.impact.clone().applyMatrix4(ship.group.matrixWorld);
  const from = impact.clone().add(V(-260, 150, -220));
  s.comet.visible = true;
  s.comet.position.copy(from);
  s.comet.lookAt(impact);
  s.comet.rotateY(-Math.PI / 2);
  const cometShot = d.cam(V(-80, 40, 70), impact.clone().lerp(from, 0.12), 1.2, ease.inOut, 55);
  const caption = d.caption(PROLOGUE.comet, 3.2);
  await cometShot;
  audio.play('glide');
  await d.tween(
    2.6,
    (k) => {
      s.comet.position.lerpVectors(from, impact, k);
      d.rig.look.lerpVectors(impact.clone().lerp(from, 0.12), impact, k);
      if (Math.random() < 0.8) s.particles.emit(s.comet.position.x, s.comet.position.y, s.comet.position.z, { count: 2, color: '#ff8ae0', speed: 1, life: 0.9, size: 1.6, gravity: 0 });
    },
    ease.in,
  );
  await caption;
  s.comet.visible = false;
  audio.play('explode');
  audio.play('roar');
  haptic('heavy');
  s.flash(impact.x, impact.y + 4, impact.z, '#ff6fcf', 900);
  s.shake(2.2);
  s.particles.emit(impact.x, impact.y + 1, impact.z, { count: 120, color: '#ff8ae0', speed: 16, life: 1.4, size: 2.2, gravity: 0 });

  // 3. The Bloom takes root and spreads over the hull.
  await Promise.all([
    d.cam(V(-44, 26, 34), V(-10, 4, 0), 2.2, ease.inOut, 45),
    d.caption(PROLOGUE.seed, 4.5),
    d.tween(5.5, (k) => ship.setGrowth(k * 0.55), ease.out),
  ]);
  await Promise.all([d.cam(V(20, 30, 62), V(5, 0, 0), 5), d.caption(PROLOGUE.grow, 4.5), d.tween(5, (k) => ship.setGrowth(0.55 + k * 0.25), ease.inOut)]);

  // 4. The ship turns toward the star.
  await Promise.all([
    d.cam(V(-95, 18, 26), V(120, 25, -30), 2.2),
    d.caption(PROLOGUE.turn, 5),
    after(d, 0.8, () =>
      d.tween(
        4.4,
        (k) => {
          ship.group.rotation.y = -0.6 * (1 - k);
          s.setStar(1600 - k * 300);
        },
        ease.inOut,
      ),
    ),
  ]);

  // 5. Push in toward the Cryo Deck...
  const cryo = V(ColonyShip.deckX(1), 9, 0);
  await Promise.all([d.cam(cryo.clone().add(V(-6, 6, 18)), cryo, 4.5, ease.in), d.caption(PROLOGUE.wake, 4), after(d, 3, () => d.fade('#ffffff', 1, 1.5))]);
}

/* ---------------- between decks ---------------- */

export async function interlude(d: Director, s: ShipScene, from: DeckId, index: number) {
  const ship = s.ship;
  ship.group.rotation.y = 0;
  s.setChapter(index);
  ship.lift.visible = true;
  const x0 = ColonyShip.deckX(index);
  const x1 = ColonyShip.deckX(index + 1);
  ship.lift.position.x = x0;
  d.cut(V(-70, 24, 70), V(20, 0, 0), 42);
  d.fade('#000000', 1, 0);
  const lines = TRANSITIONS[from];
  await Promise.all([
    d.fade('#000000', 0, 1.2),
    d.cam(V(x0 - 26, 12, 30), V(x1 + 40, 6, -10), 4, ease.inOut),
    d.tween(
      9,
      (k) => {
        ship.lift.position.x = x0 + (x1 - x0) * k;
        s.setStar(1500 - (index + k) * 190);
      },
      ease.inOut,
    ),
    after(d, 1.2, () => d.say(lines)),
  ]);
  await d.fade('#000000', 1, 0.8);
  ship.lift.visible = false;
}

/* ---------------- endings ---------------- */

export async function ending(d: Director, s: ShipScene, kind: 'saved' | 'friends') {
  const ship = s.ship;
  const text = ENDING_CAPTIONS[kind];
  s.setChapter(6);
  ship.group.rotation.y = 0;
  ship.setGold(0);
  d.cut(V(-60, 16, 40), V(60, 8, -8), 44);
  d.fade('#ffffff', 1, 0);
  await d.fade('#ffffff', 0, 2);

  if (kind === 'saved') {
    // The ship swings away from the star, and the vines let go.
    await Promise.all([
      d.caption(text[0], 5),
      d.cam(V(-40, 30, 70), V(20, 0, 0), 5),
      d.tween(
        5,
        (k) => {
          ship.group.rotation.y = -1.1 * k;
        },
        ease.inOut,
      ),
    ]);
    await Promise.all([d.caption(text[1], 5), d.tween(5, (k) => ship.setGrowth(0.95 * (1 - k)), ease.inOut)]);
  } else {
    // The Bloom turns gold and flowers, then gently steers toward its new home.
    audio.play('upgrade');
    await Promise.all([
      d.caption(text[0], 6),
      d.cam(V(-30, 22, 42), V(5, 4, 0), 6),
      d.tween(6, (k) => ship.setGold(k), ease.inOut),
      d.tween(
        6,
        () => {
          if (Math.random() < 0.7) {
            const x = -50 + Math.random() * 100;
            const a = Math.random() * Math.PI * 2;
            s.particles.emit(x, Math.sin(a) * 8, Math.cos(a) * 8, { count: 1, color: '#ffd166', speed: 2, life: 2, size: 1.2, gravity: -0.2 });
          }
        },
        ease.linear,
      ),
    ]);
    await Promise.all([
      d.caption(text[1], 5.5),
      d.tween(
        5.5,
        (k) => {
          ship.group.rotation.y = -1.1 * k;
        },
        ease.inOut,
      ),
      d.cam(V(-40, 30, 70), V(20, 0, 0), 5.5),
    ]);
  }

  // A new world comes into view along the new heading.
  const heading = V(Math.cos(-1.1), 0, -Math.sin(-1.1));
  const home = heading.clone().multiplyScalar(620).add(V(0, -40, 0));
  s.planet.visible = true;
  s.planet.position.copy(home);
  await Promise.all([d.caption(text[2], 5.5), d.cam(V(-70, 14, -60), home, 5.5, ease.inOut)]);
  await Promise.all([
    d.caption(text[3], 6),
    d.cam(home.clone().lerp(V(0, 10, 0), 0.62).add(V(-20, 18, 0)), home, 7, ease.inOut),
    after(d, 5, () => d.fade('#000000', 1, 1.8)),
  ]);
}
