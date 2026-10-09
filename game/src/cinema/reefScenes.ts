import * as THREE from 'three';

import { audio } from '../core/audio';
import type { World } from '../game/world';
import type { Director } from './director';

/**
 * Scylla's Reef. `straitClear` plays after SCYLLA is beaten: the camera swings out over Charybdis as
 * the whirlpool slows to a gentle swirl, then the storybook picture of the Argo sailing through the
 * calm strait (the level's `strait` story).
 */

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

export async function straitClear(d: Director, w: World) {
  const at = w.marker('charybdis');
  if (at) {
    // High over the whirlpool, looking down as it calms.
    await d.cam(at.clone().add(V(9, 11, 9)), at.clone(), 1.6);
    audio.play('success', 0.8);
    w.rings.burst(at.x, (w.tide?.level ?? at.y - 2) + 0.2, at.z, 9, '#bff4ff', 1.2);
    await d.wait(1.4);
  }
  const beats = w.def.stories?.strait;
  if (beats?.length) await d.story(beats);
}
