import * as THREE from 'three';

import { audio } from '../../core/audio';
import type { World } from '../../game/world';
import type { Box } from '../../world/physics';
import { Boss } from '../bossBase';
import type { HitKind, Target } from '../entity';
import { Shockwave, Strike } from '../hazards';
import { boxG, glowSprite, mat, mesh, ownMat, sphere } from '../models';

/**
 * A stand-in boss used while a Gaia Nova boss is being built: a big block that stomps out shockwaves,
 * drops rocks around Jason, and opens its glowing core every few seconds.
 */
export class PlaceholderBoss extends Boss implements Target {
  readonly title: string = 'BOSS';
  readonly aim = new THREE.Vector3();
  radius = 1.6;
  aimable = false;
  private core: THREE.MeshStandardMaterial;
  private state: 'idle' | 'stomp' | 'rain' | 'open' = 'idle';
  private stateT = 2;
  private count = 0;
  private box: Box;

  constructor(world: World, id: string, cx: number, cz: number, h: number, hp: number, color: string) {
    super(world, id, cx, cz, h, hp);
    const c = this.center;
    this.obj.add(mesh(boxG(3, 3, 3), mat('#3a3a44', { metal: 0.4, rough: 0.5 }), c.x, h + 1.5, c.z));
    this.core = ownMat(color, { emissive: color, ei: 0.4 });
    this.obj.add(mesh(sphere(0.8, 16), this.core, c.x, h + 3.4, c.z), glowSprite(color, 4, 0.4).translateX(c.x).translateY(h + 3.4).translateZ(c.z));
    this.aim.set(c.x, h + 3.4, c.z);
    this.box = { minX: c.x - 1.5, maxX: c.x + 1.5, minZ: c.z - 1.5, maxZ: c.z + 1.5, bottom: h, top: h + 3, solid: true, dx: 0, dy: 0, dz: 0 };
    world.boxes.push(this.box);
    world.addTarget(this);
  }

  hit(dmg: number, _kind: HitKind): boolean {
    if (!this.started) return true;
    if (this.state !== 'open') {
      audio.play('zap', 1.6);
      return true;
    }
    this.damage(dmg);
    this.core.emissiveIntensity = 3;
    audio.play('hit');
    return true;
  }

  reset() {
    this.hp = this.maxHp;
    this.state = 'idle';
    this.stateT = 2;
  }

  update(dt: number) {
    this.t += dt;
    if (!this.started) {
      if (this.playerDist() < 12) this.begin();
      return;
    }
    if (this.defeated) return;
    const c = this.center;
    const p = this.player.body;
    this.stateT -= dt;
    if (this.stateT <= 0) {
      this.count += 1;
      this.state = (['stomp', 'open', 'rain', 'open'] as const)[this.count % 4];
      this.stateT = this.state === 'open' ? 3.2 : 1.6;
      if (this.state === 'stomp') this.world.addEntity(new Shockwave(this.world, c.x, c.y, c.z, 14, 7, this.world.theme.accent));
      if (this.state === 'rain') for (let i = 0; i < 4; i++) this.world.addEntity(new Strike(this.world, p.x + (Math.random() - 0.5) * 6, c.y, p.z + (Math.random() - 0.5) * 6, 1.1, 1.2, '#ff5e6a', 'rock'));
    }
    this.aimable = this.state === 'open';
    this.core.emissiveIntensity = Math.max(this.state === 'open' ? 2 : 0.4, this.core.emissiveIntensity - dt * 4);
    if (Math.hypot(p.x - c.x, p.z - c.z) < 2.4 && p.y < c.y + 3) this.player.hurt(1, c.x, c.z);
  }
}
