import * as THREE from 'three';

import { audio } from '../core/audio';
import { haptic } from '../core/bridge';
import type { World } from '../game/world';
import { makeArgo } from '../vehicles/argoModel';
import { ease, type Director } from './director';

/**
 * Brennus's Last Stand, after the Golden Ram lies down: the Argo comes in low over the dock behind
 * General Brennus and slips through the great arch, while he turns and salutes, dented and proud.
 * Then the storybook picture of it (`stories.salute`).
 */

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

/** Right hand up at the brim of his cap. */
function salute(m: { armR: THREE.Object3D; head: THREE.Object3D }) {
  m.armR.rotation.set(-2.5, 0.2, -1.0);
  m.head.rotation.x = -0.15;
}

export async function argoThrough(d: Director, w: World) {
  const b = w.player.body;
  const k = V(b.x, b.y, b.z);
  // The arch is where the lifeboat waits (the exit), at the far end of the dock.
  const arch = w.exit ? w.exit.spot.clone() : k.clone().add(V(0, 0, -24));
  const toArch = V(arch.x - k.x, 0, arch.z - k.z).normalize();
  const side = V(toArch.z, 0, -toArch.x);
  const argo = makeArgo();
  argo.root.scale.setScalar(2.2);
  const from = k.clone().addScaledVector(toArch, -46).add(V(0, 16, 0));
  const over = k.clone().addScaledVector(toArch, 2).add(V(0, 9, 0));
  const to = arch.clone().addScaledVector(toArch, 40).add(V(0, 6, 0));
  argo.root.position.copy(from);
  w.scene.add(argo.root);
  w.player.facing = Math.atan2(-side.x, -side.z);
  try {
    // From beside Brennus, looking down the dock to the arch: here she comes, over his head.
    d.cut(k.clone().addScaledVector(side, -9).addScaledVector(toArch, -5).add(V(0, 3.2, 0)), k.clone().addScaledVector(toArch, 10).add(V(0, 4, 0)), 50);
    audio.play('glide', 0.5, 0.9);
    const path = new THREE.CatmullRomCurve3([from, over, arch.clone().add(V(0, 7, 0)), to]);
    const look = V();
    let saluted = false;
    await d.tween(
      5,
      (x) => {
        const p = path.getPointAt(x);
        argo.root.position.copy(p);
        path.getPointAt(Math.min(1, x + 0.01), look);
        // The model points along -Z: look away from where it's going.
        argo.root.lookAt(p.clone().multiplyScalar(2).sub(look));
        argo.update(w.time, 0.8);
        if (Math.random() < 0.5) w.particles.emit(p.x, p.y, p.z, { count: 1, color: '#9fe8ff', speed: 0.5, life: 0.8, size: 0.6, gravity: 0 });
        // Brennus turns to watch it go by, and salutes as it passes overhead.
        const look2 = V(p.x - b.x, 0, p.z - b.z);
        if (look2.lengthSq() > 1) w.player.facing = Math.atan2(look2.x, look2.z);
        if (x > 0.3 && !saluted) {
          saluted = true;
          w.player.pose = (m) => salute(m);
          audio.play('success', 0.8);
          haptic('success');
        }
        d.rig.look.lerp(p, 0.08);
      },
      ease.inOut,
    );
    w.flash(arch.x, arch.y + 6, arch.z, '#9fe8ff', 60, 0.8);
    w.rings.burst(arch.x, arch.y + 0.1, arch.z, 8, '#5ee0c8', 0.8);
    // Close on the old general, still saluting.
    await d.cam(k.clone().addScaledVector(toArch, 4.5).addScaledVector(side, 1.5).add(V(0, 2.2, 0)), k.clone().add(V(0, 1.7, 0)), 1.4, ease.inOut, 40);
    await d.wait(0.6);
    const beats = w.def.stories?.salute;
    if (beats?.length) await d.story(beats);
  } finally {
    argo.root.removeFromParent();
    w.player.pose = null;
  }
}
