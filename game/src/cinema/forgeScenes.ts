import * as THREE from 'three';

import { audio } from '../core/audio';
import { haptic } from '../core/bridge';
import type { Boss } from '../entities/bossBase';
import { Talos } from '../entities/forge/talos';
import { TALOS_COLORS } from '../entities/forge/talosModel';
import { MECH_COLORS } from '../entities/heroes/mechModel';
import type { World } from '../game/world';
import { ease, type Director, type Rig } from './director';

/**
 * Talos's Forge cutscenes. `boardMech`: Jason and Atalanta find the Gardeners' bronze mech asleep in the
 * forge (dialogue `meet:mech`, then the storybook story `meet:mech`), it wakes, and they climb aboard:
 * from then on the mech is the only hero (`joined:mech` explains its buttons). `talosOutro`: Talos, his
 * plug pulled, sits down gently, his eye turns back to the Gardeners' teal, Aeëtes's crown pops off and
 * he nods (story `talos`, then `bossDown`).
 */

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

function follow(w: World, dist = 16): Rig {
  return w.followPose({ pos: V(), look: V(), fov: 50 }, dist);
}

export async function boardMech(d: Director, w: World) {
  const flag = w.def.joins?.mech;
  const pl = w.player;
  const mech = pl.mech;
  if (!flag || !mech || w.hasFlag(flag)) return;
  const m = mech.model;
  const s = m.root.position.clone();
  const fwd = V(Math.sin(m.root.rotation.y), 0, Math.cos(m.root.rotation.y));
  const side = V(fwd.z, 0, -fwd.x);
  const b = pl.body;
  try {
    // Jason walks up to it; the camera looks up at the sleeping mech from beside him.
    const k = V(b.x, b.y, b.z);
    const stand = s.clone().addScaledVector(fwd, 4);
    pl.facing = Math.atan2(s.x - stand.x, s.z - stand.z);
    await Promise.all([
      d.tween(1.2, (x) => {
        b.x = k.x + (stand.x - k.x) * x;
        b.z = k.z + (stand.z - k.z) * x;
      }),
      d.cam(s.clone().addScaledVector(fwd, 9).addScaledVector(side, 6.5).add(V(0, 3.4, 0)), s.clone().add(V(0, 2, 0)), 1.6, ease.inOut, 46),
    ]);
    await d.say(w.dialogue('meet:mech'));
    const beats = w.def.stories?.['meet:mech'];
    if (beats?.length) await d.story(beats);
    // It wakes up: the eye and the light-lines glow, the jets puff, and it straightens up.
    d.cut(s.clone().addScaledVector(fwd, 7).add(V(0, 2.6, 0)), s.clone().add(V(0, 2.4, 0)), 44);
    audio.play('charge', 0.6);
    await d.tween(1.4, (x) => {
      m.visor.emissiveIntensity = 0.2 + x * 2.5;
      m.lines.emissiveIntensity = 0.2 + x * 2;
      m.head.rotation.x = 0.4 * (1 - x);
      m.body.position.y = -0.25 * (1 - x);
    });
    audio.play('charged', 0.7);
    for (const j of m.jets) j.scale.setScalar(1.4);
    w.particles.emit(s.x, s.y + 1.8, s.z, { count: 30, color: MECH_COLORS.glow, speed: 4, life: 0.6, size: 0.7, gravity: -1 });
    // Everyone climbs aboard.
    w.flash(s.x, s.y + 2, s.z, MECH_COLORS.light, 50, 0.5);
    w.rings.burst(s.x, s.y + 0.05, s.z, 5, MECH_COLORS.light, 0.5);
    w.setFlag(flag);
    pl.heroJoined();
    pl.facing = m.root.rotation.y;
    audio.play('upgrade');
    haptic('success');
    await d.cam(s.clone().addScaledVector(fwd, 9).addScaledVector(side, -3).add(V(0, 4, 0)), s.clone().add(V(0, 2.4, 0)), 1.2, ease.inOut, 46);
    await d.say(w.dialogue('joined:mech'));
  } finally {
    // In case the scene was skipped before they climbed in.
    if (!w.hasFlag(flag)) {
      w.setFlag(flag);
      pl.heroJoined();
    }
    m.head.rotation.x = 0;
    m.body.position.y = 0;
    w.hooks.checkpoint();
  }
  const back = follow(w);
  await d.cam(back.pos, back.look, 1);
}

/** Talos sits down, free: the gold drains away, the crown pops off, his eye turns teal, and he nods. */
export async function talosOutro(d: Director, w: World, boss: Boss) {
  if (!(boss instanceof Talos)) return;
  const t = boss;
  const m = t.parts;
  const c = t.where.clone();
  const fwd = V(Math.sin(m.root.rotation.y), 0, Math.cos(m.root.rotation.y));
  const side = V(fwd.z, 0, -fwd.x);
  try {
    // A slow arc in front of him while he sinks down, golden light running out of his heel.
    const drain = (async () => {
      for (let i = 0; i < 14; i++) {
        await d.wait(0.22);
        const p = t.plugSpot();
        w.particles.emit(p.x, p.y, p.z, { count: 8, color: TALOS_COLORS.ichor, speed: 2.5, life: 1, size: 0.6, up: 1, gravity: 4 });
        m.vein.emissiveIntensity = Math.max(0.15, 1.6 - i * 0.11);
      }
    })();
    audio.play('pound', 0.4);
    await Promise.all([
      d.tween(
        3.2,
        (x) => {
          const a = -0.9 + x * 0.9;
          const dir = fwd.clone().applyAxisAngle(V(0, 1, 0), a);
          d.rig.pos.copy(c).addScaledVector(dir, 17 - x * 3).add(V(0, 7 - x * 2.5, 0));
          d.rig.look.copy(c).add(V(0, 5 - x * 2, 0));
        },
        ease.inOut,
      ),
      drain,
    ]);
    w.shake(0.5);
    // Aeëtes's crown pops off and his eye turns back to the Gardeners' teal.
    const head = m.head.getWorldPosition(V());
    w.particles.emit(head.x, head.y + 1, head.z, { count: 40, color: '#ffd04a', speed: 6, life: 0.9, size: 0.6, up: 3 });
    w.flash(head.x, head.y, head.z, TALOS_COLORS.calm, 70, 0.8);
    audio.play('zap', 0.6);
    t.calm();
    await d.cam(c.clone().addScaledVector(fwd, 11).addScaledVector(side, 2).add(V(0, 3.2, 0)), head.clone().add(V(0, -0.5, 0)), 1.2, ease.inOut, 42);
    // A slow, grateful nod.
    audio.play('tone2', 0.5);
    await d.tween(1.8, (x) => {
      m.head.rotation.x = Math.sin(x * Math.PI) * 0.4;
    });
    const beats = w.def.stories?.talos;
    if (beats?.length) await d.story(beats);
    await d.say(w.dialogue('bossDown'));
    const exit = w.exit;
    if (exit) {
      const e = exit.spot.clone();
      await d.cam(e.clone().addScaledVector(fwd, 8).add(V(0, 5, 0)), e.clone().add(V(0, 1, 0)), 1.6);
      w.rings.burst(e.x, e.y, e.z, 4, '#3dff8a', 0.8);
      w.flash(e.x, e.y + 1.5, e.z, '#3dff8a', 40, 0.8);
      audio.play('success');
      await d.wait(1.1);
    }
  } finally {
    t.calm();
    m.head.rotation.x = 0;
  }
  const back = follow(w);
  await d.cam(back.pos, back.look, 1.1);
}
