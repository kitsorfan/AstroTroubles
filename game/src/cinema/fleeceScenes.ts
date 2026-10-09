import * as THREE from 'three';

import { audio } from '../core/audio';
import { haptic } from '../core/bridge';
import type { GoldenKing } from '../entities/ch3/goldenKing';
import type { World } from '../game/world';
import { ease, type Director, type Rig } from './director';

/**
 * Cutscenes of the Golden Fleece (the game's last level) that play inside the level: Aeëtes puts on the
 * Fleece (`kingRises`), grows into the giant Golden King (`kingGrows`), and the end of the fight
 * (`fleeceWon`): he is caught in the Fleece's vines and the Fleece floats free. With every light-stone,
 * LUX and IRIS then speak to it in Gardener light-words and its seeds wake up (the secret ending).
 */

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

function hero(w: World) {
  const b = w.player.body;
  return V(b.x, b.y, b.z);
}

function follow(w: World, dist = 17): Rig {
  return w.followPose({ pos: V(), look: V(), fov: 50 }, dist);
}

/** A camera spot `dist` away from `at`, on the hero's side, `up` high. */
function beside(w: World, at: THREE.Vector3, dist: number, up: number, turn = 0.5) {
  const k = hero(w);
  const a = Math.atan2(k.x - at.x, k.z - at.z) + turn;
  return V(at.x + Math.sin(a) * dist, at.y + up, at.z + Math.cos(a) * dist);
}

/** Phase 1 → 2: Aeëtes flies down to the altar, grabs the Fleece and wears it. Gold armour, gold vines. */
export async function kingRises(d: Director, w: World, king: GoldenKing) {
  const altar = king.altarSpot;
  try {
    await d.cam(beside(w, altar, 9, 3.5), altar.clone().add(V(0, 0.8, 0)), 1.2, ease.inOut, 46);
    await d.say(w.dialogue('wear'));
    audio.play('charged', 0.6);
    await d.tween(
      3,
      (k) => {
        king.wearFleece(k);
        if (Math.random() < 0.6) {
          const f = king.where;
          w.particles.emit(f.x + (Math.random() - 0.5) * 3, f.y + Math.random() * 3, f.z + (Math.random() - 0.5) * 3, { count: 2, color: '#ffd166', speed: 1.5, up: 1, life: 1, size: 0.6, gravity: -0.5 });
        }
      },
      ease.inOut,
    );
    king.wearFleece(1);
    const f = king.focus;
    audio.play('roar', 0.8);
    haptic('heavy');
    w.shake(0.7);
    w.flash(f.x, f.y, f.z, '#ffd166', 90, 0.7);
    w.rings.burst(f.x, king.where.y + 0.05, f.z, 8, '#ffd166', 0.7);
    await d.cam(beside(w, f, 6, 0.6, 0.2), f.clone(), 0.9, ease.out, 44);
    await d.panel('ch3-goldenking', { lines: w.dialogue('armour') });
  } finally {
    king.wearFleece(1);
  }
  const back = follow(w);
  await d.cam(back.pos, back.look, 1, ease.inOut, back.fov);
}

/** Phase 2 → 3: the Fleece's vines root him to the floor, and he grows into a giant. */
export async function kingGrows(d: Director, w: World, king: GoldenKing) {
  try {
    const c = king.where;
    await d.cam(beside(w, c, 10, 2), c.clone().add(V(0, 2, 0)), 1, ease.inOut, 48);
    await d.say(w.dialogue('grow'));
    audio.play('roar', 0.6, 0.8);
    await Promise.all([
      d.tween(
        3.2,
        (k) => {
          king.growHuge(k);
          if (Math.random() < 0.3) w.shake(0.3);
        },
        ease.inOut,
      ),
      d.cam(beside(w, c, 17, 4), c.clone().add(V(0, 5, 0)), 3.2, ease.inOut, 50),
    ]);
    king.growHuge(1);
    haptic('heavy');
    w.flash(c.x, c.y + 6, c.z, '#ffd166', 80, 0.6);
    await d.say(w.dialogue('giant'));
  } finally {
    king.growHuge(1);
  }
  const back = follow(w, 19);
  await d.cam(back.pos, back.look, 1, ease.inOut, back.fov);
}

/**
 * The end of the fight: the Fleece lets go of Aeëtes and its vines wrap him up, the Fleece floats down to
 * the altar, and everyone has their say. With every Gardener light-stone, LUX and IRIS sing the Fleece
 * its own words in light, and its seeds wake up.
 */
export async function fleeceWon(d: Director, w: World, king: GoldenKing, words: boolean) {
  const c = king.where;
  const altar = king.altarSpot;
  d.timeScale = 0.4;
  try {
    await Promise.all([
      d.tween(
        3.4,
        (k) => {
          king.caught(k);
          if (Math.random() < 0.5) w.particles.emit(king.fleeceAt.x, king.fleeceAt.y, king.fleeceAt.z, { count: 2, color: '#ffd166', speed: 1, life: 1, size: 0.6, gravity: -0.3 });
        },
        ease.inOut,
      ),
      d.cam(beside(w, c, 11, 4, 0.9), c.clone().add(V(0, 2.5, 0)), 3.4, ease.inOut, 48),
    ]);
    d.timeScale = 1;
    king.caught(1);
    await d.cam(beside(w, c, 6, 1.6, 0.4), c.clone().add(V(0, 1.2, 0)), 1, ease.inOut, 44);
    await d.say(w.dialogue('bossDown'));
    await d.cam(beside(w, altar, 7, 2.5, -0.4), altar.clone(), 1.2, ease.inOut, 46);
    if (words) {
      // LUX and IRIS fly up beside the Fleece and say hello in Gardener light-words.
      const lux = altar.clone().add(V(-1.4, 2.2, 0.8));
      const iris = altar.clone().add(V(1.4, 2.4, 0.8));
      w.lux.override = lux;
      w.iris.override = iris;
      await d.wait(1);
      await d.say(w.dialogue('gardenWords'));
      const colours = ['#5ec8ff', '#7dff9a', '#ff6fcf', '#ffd166', '#c37bff'];
      for (let i = 0; i < colours.length; i++) {
        const from = i % 2 ? iris : lux;
        audio.play(`tone${i % 4}` as 'tone0');
        w.beams.zap(from, altar, colours[i]);
        w.flash(altar.x, altar.y + 0.5, altar.z, colours[i], 50, 0.5);
        w.particles.emit(altar.x, altar.y + 0.5, altar.z, { count: 24, color: colours[i], speed: 4, life: 0.9, size: 0.5, gravity: -0.5 });
        await d.wait(0.7);
      }
      audio.play('upgrade');
      await d.tween(
        2.4,
        () => {
          const a = Math.random() * Math.PI * 2;
          w.particles.emit(altar.x + Math.cos(a) * 1.5, altar.y + 0.5, altar.z + Math.sin(a) * 1.5, { count: 2, color: Math.random() < 0.5 ? '#ffd166' : '#7dff9a', speed: 1.2, up: 3, life: 1.6, size: 0.5, gravity: -0.6 });
        },
        ease.linear,
      );
      await d.say(w.dialogue('seedsAwake'));
    } else await d.say(w.dialogue('fleeceWon'));
    await Promise.all([d.cam(beside(w, altar, 16, 9, -0.2), altar.clone(), 2.4), (async () => {
      await d.wait(1);
      await d.fade('#ffffff', 1, 1.4);
    })()]);
  } finally {
    d.timeScale = 1;
    king.caught(1);
    w.lux.override = null;
    w.iris.override = null;
  }
}
