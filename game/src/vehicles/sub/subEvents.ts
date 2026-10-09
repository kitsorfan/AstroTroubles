import * as THREE from 'three';

import { audio } from '../../core/audio';
import { haptic } from '../../core/bridge';
import { recordDive } from './quests';
import type { SubDive } from './sub';
import type { DiveEvents } from './swim';
import { sirenStory, surfaceOutro } from './subScenes';

/**
 * What the Dolphin's dive events do: sounds, bubbles and rings, toasts and hints, bolts, checkpoints,
 * the save (the dive's side quests), the arena, and the surface at the end.
 */
export function diveEvents(sub: SubDive): DiveEvents {
  const w = sub.world;
  const d = () => sub.dive;
  const save = () => {
    const pearls = sub.count('pearl');
    const better = recordDive(w.save, w.def.id, { rings: sub.count('ring'), buoys: sub.silenced, allPearls: pearls >= sub.pearlTotal && sub.pearlTotal > 0 });
    if (better) w.hooks.progress();
  };
  let bonks = 0;
  return {
    bump: (th) => {
      const z = -(th.s - d().s);
      w.particles.emit(th.x, th.y, z, { count: 18, color: th.kind === 'buoy' ? '#ffd166' : '#a8c0b8', speed: 4, life: 0.8, size: 1, gravity: 0 });
      audio.play('break', 0.6);
      w.shake(0.5);
      // Bumped into the rocks round a singing buoy: the song pulled us. Tell how to fight it.
      if (d().singer) sub.tellOnce('pulled', 'The song pulled us onto the rocks! Steer away, tap SING on the beat, or torpedo the buoy!');
    },
    door: (door, ok) => {
      if (ok) {
        audio.play('success', 1.3, 0.6);
        const [x, y] = door.holes[door.open];
        sub.rings.burst(x, y, -0.5, 2, 4, '#7dff9a', 0.6);
        return;
      }
      bonks += 1;
      audio.play('pound', 0.8);
      w.shake(0.8);
      haptic('warning');
      w.hooks.toast(bonks > 1 ? 'BONK! PING first: the open doorway glows GREEN.' : 'BONK! That doorway is sealed. PING to see which one is open!', 'bolt');
    },
    ring: (r) => {
      audio.play('bolt', 1.5);
      w.particles.emit(r.x, r.y, -0.5, { count: 12, color: '#ffd166', speed: 3, life: 0.6, size: 0.8, gravity: 0 });
      save();
    },
    bolt: () => {
      w.save.bolts += 2;
      audio.play('bolt', 1.2, 0.7);
      w.hooks.hud();
    },
    pearl: (p) => {
      w.save.bolts += 10;
      audio.play('shard', 1.4, 0.8);
      w.particles.emit(p.x, p.y, -0.5, { count: 16, color: '#ffd0f0', speed: 3, life: 0.8, size: 0.8, gravity: 0 });
      w.hooks.hud();
      sub.tellOnce('pearl', 'A hidden pearl! Only a PING shows them. +10 bolts!');
      save();
    },
    beacon: (b) => {
      sub.cpS = b.s;
      sub.savedSilenced = sub.silenced;
      w.flags.add(`sub:${b.id}`);
      audio.play('checkpoint');
      w.hooks.toast('Checkpoint! The hull is mended.', 'halcyon');
      w.hooks.checkpoint();
      w.hooks.hud();
    },
    radio: (r) => sub.queueRadio(r.dialogue),
    ping: () => {
      audio.play('pulse', 1.3);
      haptic('light');
      const dv = d();
      for (let i = 0; i < 3; i++) setTimeout(() => sub.rings.burst(dv.x, dv.y, -2 - i * 6, 1.5 + i * 2, 12 + i * 4, '#7fe6ff', 0.9), i * 120);
      const stunned = dv.fish.filter((f) => f.stun > 0).length;
      if (stunned) sub.tellOnce('stun', 'Zapped! The piranhas are dizzy. Quick, torpedo them!');
    },
    empty: () => sub.tellOnce('empty', 'The sonar is still charging! Watch the lights on the PING button.'),
    song: () => {
      audio.play('alarm', 1.6, 0.4);
      // The first siren: a storybook picture of LUX singing back (the dive waits while it plays).
      if (!sub.said.has('sirens')) {
        sub.said.add('sirens');
        void w.hooks.cutscene((dir) => sirenStory(dir, sub));
      } else sub.tellOnce('song2', 'Another siren! Tap SING when the notes reach the ring!');
    },
    note: (b, good) => {
      const dv = d();
      if (!good) {
        audio.play('empty', 1.2, 0.5);
        return;
      }
      audio.play(`tone${b.notes % 4}` as 'tone0', 1.5, 0.9);
      // LUX's note flies from the sub to the buoy.
      const z = -(b.b.s - dv.s);
      const t = 0.7;
      const vel = { x: (b.b.x - dv.x) / t, y: (b.b.y - dv.y) / t, z: z / t };
      sub.rings.burst(dv.x, dv.y + 0.6, -1, 0.4, 1.4, '#7fe6ff', t, new THREE.Vector3(vel.x, vel.y, vel.z));
    },
    silenced: (b) => {
      const dv = d();
      sub.rings.burst(b.b.x, b.b.y, -(b.b.s - dv.s), 1, 5, b.quiet === 'song' ? '#7fe6ff' : '#ffd166', 0.8);
      audio.play('success', 1.1);
      if (b.b.id.startsWith('organ')) return;
      sub.silenced += 1;
      w.save.bolts += 10;
      w.hooks.hud();
      w.hooks.toast(b.quiet === 'song' ? 'LUX out-sang the siren! It went quiet. +10 bolts' : 'Buoy switched off! +10 bolts', 'bolt');
      save();
    },
    school: () => {
      w.hooks.threat('piranha');
      audio.play('alarm', 1.2, 0.5);
    },
    nibble: () => audio.play('spin', 1.6),
    kelp: () => audio.play('glide', 0.8, 0.5),
    hurt: () => {
      audio.play('hurt');
      haptic('warning');
      w.shake(0.6);
      w.hooks.hud();
    },
    arena: () => sub.battle.begin(),
    finish: () => {
      w.flags.add('sub:surface');
      save();
      void w.hooks.cutscene((dir) => surfaceOutro(dir, sub)).then(() => w.hooks.complete());
    },
  };
}

