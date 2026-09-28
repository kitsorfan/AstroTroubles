import * as THREE from 'three';

import { audio } from '../core/audio';
import { damp, dampAngle } from '../core/math';
import type { World } from '../game/world';
import { makeBolt, type BoltModel } from './models';

const ZAP_RANGE = 6;

/** BOLT follows Kai, zaps nearby enemies, and lights up dark rooms. */
export class Bolt {
  readonly model: BoltModel;
  readonly pos = new THREE.Vector3();
  private yaw = 0;
  private zapCd = 2;
  private blinkT = 2;
  private light: THREE.SpotLight;
  private lightTarget = new THREE.Object3D();
  active = true;
  /** Extra offset so cutscenes can move BOLT somewhere specific. */
  override: THREE.Vector3 | null = null;
  private t = 0;

  constructor(private world: World) {
    this.model = makeBolt();
    world.scene.add(this.model.root);
    this.light = new THREE.SpotLight('#dff6ff', 0, 22, 0.62, 0.55, 1.1);
    this.light.target = this.lightTarget;
    world.scene.add(this.light, this.lightTarget);
    const p = world.player.body;
    this.pos.set(p.x - 1, p.y + 2, p.z + 1);
  }

  place(x: number, y: number, z: number) {
    this.pos.set(x, y, z);
  }

  update(dt: number) {
    const w = this.world;
    this.t += dt;
    this.model.root.visible = this.active;
    if (!this.active) {
      this.light.intensity = 0;
      return;
    }
    const pl = w.player;
    const f = pl.facing;
    const target = this.override
      ? this.override
      : new THREE.Vector3(
          pl.body.x - Math.sin(f) * 1.1 - Math.cos(f) * 1.0,
          pl.body.y + 2.0 + Math.sin(this.t * 2.2) * 0.12,
          pl.body.z - Math.cos(f) * 1.1 + Math.sin(f) * 1.0,
        );
    this.pos.x = damp(this.pos.x, target.x, 5, dt);
    this.pos.y = damp(this.pos.y, target.y, 5, dt);
    this.pos.z = damp(this.pos.z, target.z, 5, dt);
    this.model.root.position.copy(this.pos);

    // Look where Kai looks, or at the nearest threat.
    const threat = w.nearestEnemy(pl.body.x, pl.body.z, ZAP_RANGE);
    const lookYaw = threat ? Math.atan2(threat.aim.x - this.pos.x, threat.aim.z - this.pos.z) : f;
    this.yaw = dampAngle(this.yaw, lookYaw, 6, dt);
    this.model.root.rotation.y = this.yaw;
    this.model.shell.rotation.z = Math.sin(this.t * 1.7) * 0.08;

    this.blinkT -= dt;
    const lid = this.model.lid;
    if (this.blinkT < 0) {
      lid.scale.y = 1;
      if (this.blinkT < -0.12) this.blinkT = 2 + Math.random() * 3;
    } else {
      lid.scale.y = 0.05;
    }

    // Zap assist.
    this.zapCd -= dt;
    if (threat && this.zapCd <= 0 && !w.cutscene) {
      // BOLT is a helper, not a weapon: his zap only stuns until it is upgraded at VENDY's.
      const lvl = w.save.upgrades.boltZap ?? 0;
      this.zapCd = [8, 6, 4.5][lvl] ?? 4.5;
      w.beams.zap(this.pos.clone().add(new THREE.Vector3(0, 0, 0)), threat.aim.clone());
      threat.hit(lvl, 'zap', this.pos);
      audio.play('zap');
      this.model.iris.emissiveIntensity = 4;
    }
    this.model.iris.emissiveIntensity = damp(this.model.iris.emissiveIntensity, 1.6 + w.darkness * 1.5, 6, dt);

    // Flashlight in dark rooms.
    this.light.intensity = damp(this.light.intensity, w.darkness * 60, 5, dt);
    this.light.position.copy(this.pos);
    this.lightTarget.position.set(pl.body.x + Math.sin(f) * 4, pl.body.y, pl.body.z + Math.cos(f) * 4);
    this.model.glow.material.opacity = 0.3 + w.darkness * 0.4;
  }
}
