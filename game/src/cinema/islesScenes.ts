import * as THREE from 'three';

import { audio } from '../core/audio';
import { haptic } from '../core/bridge';
import { HEROES } from '../entities/heroes/heroes';
import type { World } from '../game/world';
import type { HeroId } from '../world/levelTypes';
import { ease, type Director, type Rig } from './director';
import { boardMech } from './forgeScenes';

/**
 * Chapter 3 cutscenes on foot. `heroJoins`: Jason meets a hero who joins the Argonauts partway through
 * a level (Atalanta, by her stripped skiff on the Harpy Isles). The level's dialogues `meet:<hero>`
 * play in the world, its story `meet:<hero>` over storybook panels, then IRIS flies over to her new
 * friend, the hero joins the roster, and `joined:<hero>` explains switching.
 */

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

function follow(w: World, dist = 13): Rig {
  return w.followPose({ pos: V(), look: V(), fov: 50 }, dist);
}

export async function heroJoins(d: Director, w: World, hero: HeroId) {
  // The bronze mech doesn't walk over to join: everyone climbs aboard it (Talos's Forge).
  if (hero === 'mech') return boardMech(d, w);
  const flag = w.def.joins?.[hero];
  if (!flag || w.hasFlag(flag)) return;
  const pl = w.player;
  const m = pl.heroModel(hero);
  const s = m.root.position.clone();
  const b = pl.body;
  const start = V(b.x, b.y, b.z);
  const dir = V(s.x - start.x, 0, s.z - start.z).normalize();
  const side = V(dir.z, 0, -dir.x);
  // Jason walks up to her (to a few steps away), then they talk.
  const walk = Math.max(0, start.distanceTo(V(s.x, start.y, s.z)) - 3.4);
  const k = start.clone().addScaledVector(dir, walk);
  pl.facing = Math.atan2(dir.x, dir.z);
  m.root.visible = true;
  m.root.rotation.y = Math.atan2(-dir.x, -dir.z);
  const mid = k.clone().lerp(s, 0.5);
  const iris = w.iris;
  try {
    // A two-shot from the side: Jason on one side, the new hero on the other.
    await Promise.all([
      d.tween(
        Math.min(1.6, 0.3 + walk / 6),
        (x) => {
          b.x = start.x + dir.x * walk * x;
          b.z = start.z + dir.z * walk * x;
        },
        ease.inOut,
      ),
      d.cam(mid.clone().addScaledVector(side, 7.5).add(V(0, 2.6, 0)), mid.clone().add(V(0, 1.2, 0)), 1.6, ease.inOut, 44),
    ]);
    await d.say(w.dialogue(`meet:${hero}`));
    const beats = w.def.stories?.[`meet:${hero}`];
    if (beats?.length) await d.story(beats);
    d.cut(mid.clone().addScaledVector(side, 6).add(V(0, 2.6, 0)), mid.clone().add(V(0, 1.4, 0)), 46);
    // IRIS swoops over to her new friend in a rainbow loop.
    if (hero === 'atalanta') {
      const from = iris.pos.clone();
      const to = s.clone().add(V(0.9, 2.1, 0.6));
      const hue = new THREE.Color();
      iris.override = from.clone();
      audio.play('tone2');
      await d.tween(
        1.6,
        (x) => {
          iris.override?.lerpVectors(from, to, x).add(V(0, Math.sin(x * Math.PI) * 2, 0));
          hue.setHSL(x % 1, 0.9, 0.65);
          const p = iris.pos;
          w.particles.emit(p.x, p.y, p.z, { count: 1, color: '#' + hue.getHexString(), speed: 0.3, life: 0.6, size: 0.4, gravity: 0 });
        },
        ease.inOut,
      );
    }
    w.setFlag(flag);
    pl.heroJoined(s);
    w.refreshCompanions();
    const color = HEROES[hero].color;
    w.rings.burst(s.x, s.y + 0.05, s.z, 4, color, 0.5);
    w.particles.emit(s.x, s.y + 1, s.z, { count: 30, color, speed: 5, life: 0.7, size: 0.5, up: 2 });
    audio.play('upgrade');
    haptic('success');
    await d.say(w.dialogue(`joined:${hero}`));
  } finally {
    iris.override = null;
    // In case the scene was skipped before the join.
    if (!w.hasFlag(flag)) {
      w.setFlag(flag);
      pl.heroJoined(s);
      w.refreshCompanions();
    }
    w.hooks.checkpoint();
  }
  const back = follow(w);
  await d.cam(back.pos, back.look, 1);
}
