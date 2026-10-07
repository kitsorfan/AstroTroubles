import * as THREE from 'three';

import { ease, type Director, type Rig } from '../cinema/director';
import { audio } from '../core/audio';
import { FLYOVER } from '../game/story';
import type { ArgoFlight } from './argo';
import { CLASH, clashState, type Clash, type Hold } from './course';

/**
 * The flight level's cutscenes: the opening (the Argo sets off into the belt), LUX's dove showing the
 * way through the first Clashing Rocks, and the Argo sailing through the gate of the moons at the end.
 */

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

function chase(a: ArgoFlight): Rig {
  return a.cameraPose({ pos: V(), look: V(), fov: 50 }, 0);
}

/** The opening: a slow swing from the ram's head on the prow round to the chase camera. */
export async function flightIntro(d: Director, a: ArgoFlight) {
  const w = a.world;
  const end = chase(a);
  d.cut(V(-5.5, 1.6, -12), V(0, 1.2, 0), 42);
  d.fade('#000000', 1, 0);
  audio.play('dash', 0.6, 0.6);
  const caption = d.caption(FLYOVER[w.def.id], 6);
  await Promise.all([
    d.fade('#000000', 0, 1.2),
    d.fly(
      [
        { pos: V(-8, 4, -3), look: V(0, 1.4, -1) },
        { pos: V(4, 5, 7), look: V(0, 1, -4) },
        { pos: end.pos, look: end.look },
      ],
      6.5,
    ),
  ]);
  await caption;
  d.rig.fov = end.fov;
  await d.say(w.dialogue('intro'));
}

/**
 * LUX's dove at the first Clashing Rocks. Like the dove in the myth, it goes a little late and the rocks
 * snip off a tail feather: so the trick is to go the moment they OPEN.
 */
export async function doveScene(d: Director, a: ArgoFlight, h: Hold, group: Clash[]) {
  const w = a.world;
  const f = a.flight;
  const first = group[0];
  a.autoDove = false;
  try {
    const rel = first.s - f.s;
    d.cut(V(10, 4, 6), V(-1, 0.5, -rel * 0.7), 50);
    await d.say(w.dialogue('dove'));
    // Wait for a late moment in the rocks' rhythm, just like the myth's dove.
    const P = first.period;
    const late = P - CLASH.shut - CLASH.slam - (CLASH.depth / 2 + 8 + rel) / 42 - 0.12;
    const u = clashState(first, f.t).phase;
    await d.wait((((late - u) % P) + P) % P);
    a.launchDove(h, group);
    audio.play('blip', 1.4);
    let snipped = false;
    await d.tween(
      2.8,
      () => {
        const p = a.dove.root.position;
        d.rig.pos.set(p.x + 7, p.y + 2.6, p.z + 10);
        d.rig.look.set(p.x, p.y, p.z - 4);
        if (!snipped && clashState(first, f.t).gap < 0.4) {
          // SNAP! The rocks close right behind it and pinch off one tail feather.
          snipped = true;
          a.dove.tail.visible = false;
          w.particles.emit(p.x, p.y, p.z + 3, { count: 8, color: '#ffffff', speed: 1.2, life: 2.2, size: 1.4, gravity: -0.4, drag: 1.5 });
        }
      },
      ease.linear,
    );
    a.dove.tail.visible = false;
    await d.say(w.dialogue('doveSafe'));
    const back = chase(a);
    d.cut(back.pos, back.look, back.fov);
  } finally {
    a.autoDove = true;
  }
}

/** The end: the Argo sails through the gate of the moons, and the moons of the gas giant fill the sky. */
export async function flightOutro(d: Director, a: ArgoFlight) {
  const w = a.world;
  const off = a.offset;
  off.set(0, 0, 46);
  d.cut(V(20, 5, -14), V(0, 0, 18), 52);
  audio.play('dash', 0.9);
  await Promise.all([
    d.tween(5, (k) => off.set(0, Math.sin(k * Math.PI) * 1.5, 46 - k * 120), ease.inOut),
    d.cam(V(10, 7, -30), V(0, 1, -80), 5, ease.inOut),
  ]);
  const g = a.giantPosition();
  await d.cam(V(0, 6, -60), g, 3, ease.inOut, 46);
  await d.say(w.dialogue('finish'));
  await d.fade('#000000', 1, 1);
  off.set(0, 0, 0);
}
