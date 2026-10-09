import * as THREE from 'three';

import { ease, type Director, type Rig } from '../../cinema/director';
import { audio } from '../../core/audio';
import { haptic } from '../../core/bridge';
import { BOSS_CARD, FLYOVER } from '../../game/story';
import { ORGAN } from './organ';
import type { SubDive } from './sub';
import type { OrganBattle } from './subBattle';

/**
 * The dive's cutscenes: the Dolphin dropping into the Sirens' Sea, the first siren's song (a storybook
 * picture of LUX singing back), THE SIREN ORGAN's entrance and its shattering, and the sub rising to
 * the surface at the coral strait.
 */

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

function chase(sub: SubDive): Rig {
  return sub.cameraPose({ pos: V(), look: V(), fov: 55 }, 0);
}

/** The opening: the Dolphin drops from the surface in a cloud of bubbles, then the camera tucks in behind it. */
export async function diveIntro(d: Director, sub: SubDive) {
  const w = sub.world;
  const end = chase(sub);
  const off = sub.offset;
  off.set(0, 14, 8);
  d.cut(V(9, -2, -10), V(0, 10, 2), 50);
  d.fade('#000000', 1, 0);
  audio.play('vent', 0.6);
  const caption = d.caption(FLYOVER[w.def.id], 6);
  let bubbles = 0;
  await Promise.all([
    d.fade('#000000', 0, 1.2),
    d.tween(
      4.5,
      (k) => {
        off.set(0, 14 * (1 - k), 8 * (1 - k));
        if (k > bubbles) {
          bubbles = k + 0.05;
          w.particles.emit(off.x, off.y + 1, off.z + 1, { count: 6, color: '#e8fbff', speed: 1.5, life: 1.2, size: 0.5, gravity: -2 });
        }
      },
      ease.out,
    ),
    d.fly(
      [
        { pos: V(9, -2, -10), look: V(0, 8, 2) },
        { pos: V(-7, 2, -6), look: V(0, 1, 0) },
        { pos: end.pos, look: end.look },
      ],
      6,
    ),
  ]);
  off.set(0, 0, 0);
  await caption;
  d.rig.fov = end.fov;
  await d.say(w.dialogue('intro'));
}

/** The first siren's song: a storybook picture of LUX singing back, like Orpheus did. */
export async function sirenStory(d: Director, sub: SubDive) {
  await d.panel('ch3-sirens', { lines: sub.world.dialogue('sirens') });
  const back = chase(sub);
  d.cut(back.pos, back.look, back.fov);
}

/** THE SIREN ORGAN rises out of the gloom: its pipes light up one by one, then the name card. */
export async function organIntro(d: Director, sub: SubDive, battle: OrganBattle) {
  const w = sub.world;
  const card = BOSS_CARD.organ;
  const z = -ORGAN.dist;
  d.cut(V(12, 1, -6), V(0, 0, z), 52);
  await d.cam(V(9, 4, z + 36), V(0, 0, z), 2.2, ease.inOut, 50);
  for (let i = 0; i < battle.model.pipes.length; i++) {
    const p = battle.model.pipes[i];
    p.glow.visible = true;
    audio.play(`tone${i % 4}` as 'tone0', 0.7 + i * 0.08);
    await d.wait(0.22);
  }
  audio.play('roar', 0.7);
  w.shake(0.8);
  w.flash(0, 0, z + 4, card.color, 70, 0.7);
  sub.rings.burst(0, -3, z + 2, 2, 14, card.color, 1.2);
  haptic('heavy');
  await d.cam(V(0, 0.5, z + 29), V(0, 0.5, z), 1.2, ease.inOut, 50);
  await d.title(battle.fight.title, card.sub, card.color);
  await d.say(w.dialogue('boss'));
  const back = chase(sub);
  await d.cam(back.pos, back.look, 1, ease.inOut, back.fov);
}

/** LUX's last note shatters the Organ: pink sparks, gold bits sinking, and quiet at last. */
export async function organOutro(d: Director, sub: SubDive, battle: OrganBattle) {
  const w = sub.world;
  const z = -ORGAN.dist;
  d.timeScale = 0.4;
  await d.cam(V(12, 4, z + 32), V(0, 0, z), 1, ease.inOut, 50);
  for (let i = 0; i < 6; i++) {
    const p = battle.model.pipes[i];
    const at = p.group.position;
    w.particles.emit(at.x, at.y, z + 1, { count: 30, color: i % 2 ? '#ffffff' : '#ff6fb0', speed: 7, life: 1, size: 0.9, gravity: 1 });
    w.flash(at.x, at.y, z + 2, '#ff6fb0', 60, 0.3);
    w.shake(0.4);
    if (i % 2 === 0) audio.play('explode', 0.9);
    await d.wait(0.3);
  }
  d.timeScale = 1;
  await d.tween(1.6, (k) => {
    battle.model.root.position.y = -k * 6;
    battle.model.root.rotation.z = k * 0.15;
  });
  battle.model.root.visible = false;
  await d.say(w.dialogue('bossDown'));
  const back = chase(sub);
  d.cut(back.pos, back.look, back.fov);
}

/** The end: the Dolphin rises toward the light and pops up at the coral strait. */
export async function surfaceOutro(d: Director, sub: SubDive) {
  const w = sub.world;
  const off = sub.offset;
  d.cut(V(7, -3, 6), V(0, 2, -4), 50);
  audio.play('dash', 0.7);
  await Promise.all([
    d.tween(4, (k) => off.set(0, k * 26, -k * 10), ease.in),
    d.cam(V(5, 6, 4), V(0, 24, -10), 4, ease.inOut, 54),
    d.fade('#e8fbff', 1, 3.6),
  ]);
  await d.panel('ch3-strait', { lines: w.dialogue('finish') });
  await d.fade('#000000', 1, 0.8);
  off.set(0, 0, 0);
}
