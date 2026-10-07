import * as THREE from 'three';

import { audio } from '../core/audio';
import { damp, dampAngle } from '../core/math';
import type { CompanionSkin } from '../game/companions';
import type { World } from '../game/world';
import { makeIris, rainbow, type IrisModel } from './companionModels';
import { glowSprite, makeBolt, type BoltModel } from './models';

const ZAP_RANGE = 6;
const tmpC = new THREE.Color();
const tmpV = new THREE.Vector3();

/** The deck's one flashlight: a spotlight that whoever lights the way points each frame. */
export class Torch {
  readonly light = new THREE.SpotLight('#dff6ff', 0, 22, 0.62, 0.55, 1.1);
  private target = new THREE.Object3D();

  constructor(scene: THREE.Scene) {
    this.light.target = this.target;
    scene.add(this.light, this.target);
  }

  shine(from: THREE.Vector3, at: THREE.Vector3, color: string, intensity: number, dt: number) {
    this.light.color.set(color);
    this.light.intensity = damp(this.light.intensity, intensity, 5, dt);
    this.light.position.copy(from);
    this.target.position.copy(at);
  }

  /** Nobody is lighting the way: fade it out. */
  dim(dt: number) {
    this.light.intensity = damp(this.light.intensity, 0, 5, dt);
  }
}

/**
 * Jason's droid: LUX (or, in the jungle and the volcano, IRIS). The lead droid follows Jason, zaps
 * nearby enemies, lights up dark rooms and fires the force pulse. A `tag` droid just floats along
 * a little further back (IRIS, once LUX is home again).
 */
export class Bolt {
  readonly model: BoltModel;
  readonly pos = new THREE.Vector3();
  private yaw = 0;
  private zapCd = 2;
  private blinkT = 2;
  active = true;
  /** The lead droid does the work; a tag-along just follows. */
  role: 'lead' | 'tag' = 'lead';
  /** Extra offset so cutscenes can move the droid somewhere specific. */
  override: THREE.Vector3 | null = null;
  private t = 0;

  /**
   * `torch` is the deck's one flashlight, shared by the droids and Jason's helmet lamp (only one of
   * them is ever lighting the way), so the number of lights in the scene never changes.
   */
  constructor(
    private world: World,
    readonly skin: CompanionSkin,
    private torch: Torch,
  ) {
    this.model = skin === 'iris' ? makeIris() : makeBolt();
    world.scene.add(this.model.root);
    const p = world.player.body;
    this.pos.set(p.x - 1, p.y + 2, p.z + 1);
    this.t = skin === 'iris' ? 1.7 : 0;
  }

  place(x: number, y: number, z: number) {
    this.pos.set(x, y, z);
  }

  private flareT = 0;

  /** The force pulse: the droid's eye blazes and its glow balloons for a moment. */
  flare() {
    this.flareT = 0.6;
    this.model.iris.emissiveIntensity = 8;
  }

  /** The droid's eye colour right now (IRIS's drifts around the rainbow). */
  get eyeColor(): string {
    return '#' + this.model.iris.emissive.getHexString();
  }

  update(dt: number) {
    const w = this.world;
    this.t += dt;
    this.model.root.visible = this.active;
    const lead = this.role === 'lead';
    if (!this.active) return;
    const pl = w.player;
    const f = pl.facing;
    // The lead floats at Jason's shoulder; a tag-along hangs back on the other side.
    const back = lead ? 1.1 : 2.4;
    const side = lead ? 1.0 : -1.5;
    const target = this.override
      ? this.override
      : new THREE.Vector3(
          pl.body.x - Math.sin(f) * back - Math.cos(f) * side,
          pl.body.y + (lead ? 2.0 : 2.5) + Math.sin(this.t * 2.2) * 0.12,
          pl.body.z - Math.cos(f) * back + Math.sin(f) * side,
        );
    const k = lead ? 5 : 3;
    this.pos.x = damp(this.pos.x, target.x, k, dt);
    this.pos.y = damp(this.pos.y, target.y, k, dt);
    this.pos.z = damp(this.pos.z, target.z, k, dt);
    this.model.root.position.copy(this.pos);

    // Look where Jason looks, or at the nearest threat.
    const threat = lead ? w.nearestEnemy(pl.body.x, pl.body.z, ZAP_RANGE) : null;
    const lookYaw = threat ? Math.atan2(threat.aim.x - this.pos.x, threat.aim.z - this.pos.z) : f;
    this.yaw = dampAngle(this.yaw, lookYaw, 6, dt);
    this.model.root.rotation.y = this.yaw;
    this.model.shell.rotation.z = Math.sin(this.t * 1.7) * 0.08;
    if (this.skin === 'iris') this.animateIris(this.model as IrisModel);

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
      // A droid is a helper, not a weapon: the zap only stuns until it is upgraded at PANDORA's.
      const lvl = w.save.upgrades.boltZap ?? 0;
      this.zapCd = [8, 6, 4.5, 3.5][lvl] ?? 3.5;
      w.beams.zap(this.pos.clone(), threat.aim.clone(), this.skin === 'iris' ? this.eyeColor : undefined);
      threat.hit(lvl, 'zap', this.pos);
      audio.play('zap', this.skin === 'iris' ? 1.25 : 1);
      this.model.iris.emissiveIntensity = 4;
    }
    this.model.iris.emissiveIntensity = damp(this.model.iris.emissiveIntensity, 1.6 + (lead ? w.darkness * 1.5 : 0), 6, dt);

    // Flashlight in dark rooms.
    if (lead) this.torch.shine(this.pos, tmpV.set(pl.body.x + Math.sin(f) * 4, pl.body.y, pl.body.z + Math.cos(f) * 4), this.skin === 'iris' ? '#f0e6ff' : '#dff6ff', w.darkness * 60, dt);
    this.flareT = Math.max(0, this.flareT - dt);
    this.model.glow.material.opacity = 0.3 + (lead ? w.darkness * 0.4 : 0) + this.flareT * 1.2;
    this.model.glow.scale.setScalar(1.3 + this.flareT * 6);
  }

  /** IRIS's eye drifts around the rainbow, her fins flutter and her halo turns. */
  private animateIris(m: IrisModel) {
    rainbow(this.t, tmpC);
    m.iris.color.copy(tmpC);
    m.iris.emissive.copy(tmpC);
    m.glow.material.color.copy(tmpC).lerp(new THREE.Color('#ffffff'), 0.35);
    const flap = Math.sin(this.t * 7) * 0.35;
    m.fins[0].rotation.z = flap;
    m.fins[1].rotation.z = -flap;
    m.halo.rotation.z = this.t * 1.2;
    m.haloMat.emissiveIntensity = 1.4 + Math.sin(this.t * 3) * 0.4;
  }
}

/**
 * Jason's helmet lamp, for when no droid is around to light the way: a spotlight from his forehead
 * that brightens in dark rooms, plus a small glow on the helmet so you can see it is switched on.
 */
export class HelmetLamp {
  private dot: THREE.Sprite;
  private from = new THREE.Vector3();
  private at = new THREE.Vector3();
  on = false;

  constructor(
    private world: World,
    private torch: Torch,
  ) {
    this.dot = glowSprite('#fff1d6', 0.6, 0);
    world.scene.add(this.dot);
  }

  update(dt: number) {
    const w = this.world;
    const b = w.player.body;
    const f = w.player.facing;
    const k = this.on ? w.darkness : 0;
    if (this.on) {
      this.from.set(b.x + Math.sin(f) * 0.3, b.y + 2.1, b.z + Math.cos(f) * 0.3);
      this.at.set(b.x + Math.sin(f) * 5, b.y, b.z + Math.cos(f) * 5);
      this.torch.shine(this.from, this.at, '#fff1d6', k * 55, dt);
    }
    this.dot.position.set(b.x + Math.sin(f) * 0.32, b.y + 1.95, b.z + Math.cos(f) * 0.32);
    this.dot.material.opacity = damp(this.dot.material.opacity, k * 0.9, 5, dt);
  }
}
