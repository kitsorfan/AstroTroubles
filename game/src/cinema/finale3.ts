import * as THREE from 'three';

import { audio } from '../core/audio';
import { haptic } from '../core/bridge';
import { tr } from '../core/i18n';
import { glowSprite } from '../entities/models';
import { ENDING_CAPTIONS } from '../game/story';
import { makeArgo } from '../vehicles/argoModel';
import type { EndingKind } from '../world/levelTypes';
import { ease, type Director } from './director';
import type { MoonScene } from './moonScene';
import { PlanetScene } from './planetScene';

/**
 * The game's final endings (chapter 3): the Argo carries the Golden Fleece home across the ring of
 * moons (`fleeceVoyage`), lands in the colony's valley on Gaia Nova, and the Argonauts lay the Fleece
 * over Celestia (`fleeceHome`). The secret ending (`gardeners`) adds the Fleece's woken seeds: golden
 * sparks trailing the Argo, and a valley full of little Celestias. Then: THE END.
 */

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

/** Part 1, in space: the Argo sails home with the Fleece glowing in her hold. */
export async function fleeceVoyage(d: Director, m: MoonScene, kind: EndingKind) {
  const text = ENDING_CAPTIONS[kind];
  const argo = m.argo.root;
  const glow = glowSprite('#ffd166', 9, 0.9);
  glow.position.set(0, 1.5, 2);
  argo.add(glow);
  argo.position.set(0, 0, 0);
  argo.rotation.set(0, Math.PI - 0.3, 0);
  m.thrust = 0.9;
  const seeds = kind === 'gardeners';
  d.cut(V(-20, 8, -26), V(0, 1, 0), 46);
  d.fade('#ffffff', 1, 0);
  audio.music('ending');
  await Promise.all([d.fade('#ffffff', 0, 2), d.caption(text[0], 6), d.cam(V(-14, 5, -18), V(0, 1, 6), 6, ease.inOut)]);
  await Promise.all([
    d.caption(text[1], 6),
    d.tween(
      7,
      (k) => {
        argo.position.set(k * 30, k * 6, k * 160);
        glow.material.opacity = 0.7 + Math.sin(k * 40) * 0.2;
        if (Math.random() < (seeds ? 0.9 : 0.4)) {
          const p = argo.position;
          m.particles.emit(p.x, p.y + 1, p.z - 4, { count: 1, color: seeds && Math.random() < 0.5 ? '#7dff9a' : '#ffd166', speed: 0.6, life: 1.6, size: 3, gravity: 0 });
        }
      },
      ease.linear,
    ),
    d.cam(V(30, 12, 40), V(20, 4, 140), 7, ease.inOut),
  ]);
  await d.fade('#000000', 1, 0.9);
}

/** Part 2, over Gaia Nova: the Argo comes home to the plains, the Fleece over Celestia, the valley in bloom. */
export async function fleeceHome(d: Director, p: PlanetScene, kind: EndingKind) {
  const text = ENDING_CAPTIONS[kind];
  const plains = PlanetScene.region('plains', 0);
  p.shuttle.visible = false;
  const argo = makeArgo();
  const ship = new THREE.Group();
  argo.root.rotation.y = -Math.PI / 2;
  argo.root.scale.setScalar(1.6);
  ship.add(argo.root);
  p.scene.add(ship);
  const pad = plains.clone().add(V(10, 3.5, 20));
  const sky = pad.clone().add(V(-150, 110, 70));
  let t = 0;
  // Down she comes out of the sky, and settles in the valley (the camera waits on a hill and watches her come).
  const eye = pad.clone().add(V(40, 10, 55));
  ship.position.copy(sky);
  d.cut(eye, sky.clone().lerp(pad, 0.4), 46);
  d.fade('#000000', 1, 0);
  await Promise.all([
    d.fade('#000000', 0, 1.2),
    d.tween(
      6,
      (k) => {
        t += 1 / 60;
        argo.update(t, 1 - k * 0.7);
        ship.position.lerpVectors(sky, pad, 1 - (1 - k) * (1 - k));
        ship.rotation.z = -0.4 * (1 - k);
        d.rig.pos.lerpVectors(eye, pad.clone().add(V(-30, 12, 46)), k);
        // Keep the valley in the picture as well as the ship coming down into it.
        d.rig.look.copy(ship.position).lerp(pad, 0.4);
      },
      ease.linear,
    ),
  ]);
  audio.play('land', 0.6);
  p.shake(0.4);
  // The Fleece laid over Celestia, in the middle of the colony garden.
  await d.panel('ch3-home', { caption: text[2], seconds: 7 });
  if (kind === 'gardeners') await d.panel('ch3-gardeners', { caption: text[3], seconds: 8 });
  // The whole valley bursts into bloom (with little Celestias everywhere in the secret ending).
  const seeds = kind === 'gardeners';
  await Promise.all([
    seeds ? Promise.resolve() : d.caption(text[3], 6.5),
    d.cam(plains.clone().add(V(-40, 40, 90)), plains.clone().add(V(40, 10, 0)), 7, ease.inOut),
    d.tween(
      7,
      () => {
        for (let i = 0; i < 4; i++) {
          const x = plains.x + (Math.random() - 0.5) * 240;
          const z = plains.z + (Math.random() - 0.5) * 240;
          const r = Math.random();
          const color = r < 0.35 ? '#ffd166' : r < 0.6 ? '#ff6fcf' : seeds && r < 0.85 ? '#7dff9a' : '#ffffff';
          p.particles.emit(x, PlanetScene.ground(x, z) + 1, z, { count: 1, color, speed: 0.5, up: 3, life: 3, size: 3, gravity: 0 });
        }
      },
      ease.linear,
    ),
  ]);
  haptic('success');
  audio.play('success');
  await d.title(tr('THE END'), tr('The Argonauts came home'), '#ffd166');
  await d.wait(1.2);
  await d.fade('#000000', 1, 1.6);
}
