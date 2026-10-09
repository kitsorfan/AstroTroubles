import * as THREE from 'three';

import { audio } from '../../core/audio';
import { CELL } from '../../core/constants';
import { tr } from '../../core/i18n';
import { damp } from '../../core/math';
import type { World } from '../../game/world';
import type { Box } from '../../world/physics';
import { Entity, type Target } from '../entity';
import { cyl, glowSprite, mat, mesh, sphere, torus } from '../models';

const cx2x = (c: number) => c * CELL + CELL / 2;

const box = (x: number, z: number, hw: number, bottom: number, top: number, owner: unknown): Box => ({ minX: x - hw, maxX: x + hw, minZ: z - hw, maxZ: z + hw, bottom, top, solid: true, dx: 0, dy: 0, dz: 0, owner });

/**
 * A Gardener seed-sprite (the Garden of Colchis's rescues): a glowing seed with a leaf on its head,
 * two shining eyes and little leaf-wings, curled up asleep in the net.
 */
function seedSprite(loot: THREE.Group, seed: number) {
  const colors = ['#7dffc8', '#ffe066', '#ff9ad8'];
  const glow = colors[seed % colors.length];
  const body = mesh(sphere(0.32, 14), mat('#f4ffe8', { emissive: glow, ei: 0.8, rough: 0.4 }), 0, 0.5, 0);
  body.scale.set(1, 1.2, 1);
  loot.add(body);
  for (const s of [-1, 1]) {
    loot.add(mesh(sphere(0.06, 8), mat('#1a2a1a'), s * 0.11, 0.58, 0.27, false));
    const wing = mesh(sphere(0.2, 8), mat('#8fe07a', { emissive: '#5fb35a', ei: 0.3 }), s * 0.36, 0.55, -0.05, false);
    wing.scale.set(1, 0.25, 0.6);
    wing.rotation.z = s * 0.5;
    loot.add(wing);
  }
  const leaf = mesh(sphere(0.14, 8), mat('#5fb35a'), 0.06, 0.95, 0, false);
  leaf.scale.set(0.6, 1.4, 0.3);
  leaf.rotation.z = -0.4;
  loot.add(leaf);
  loot.add(glowSprite(glow, 1.6, 0.6).translateY(0.5));
}

/**
 * A gold harpy net (chapter 3's `cocoon`): Aeëtes's drones stuffed something they stole into it and
 * staked it to the ground. Blast it three times and it bursts; what was inside hops out, sparkles and
 * zips home to its owner (on the Harpy Isles: Phineus's food). Counts like a freed colonist.
 */
export class SupplyNet extends Entity implements Target {
  readonly aim: THREE.Vector3;
  radius = 1;
  aimable = true;
  private hp = 3;
  private net = new THREE.Group();
  private loot = new THREE.Group();
  private freedT = -1;
  private base: THREE.Vector3;

  constructor(
    world: World,
    id: string,
    cx: number,
    cz: number,
    h: number,
    private name: string,
    private line: string,
  ) {
    super(world, id);
    const x = cx2x(cx);
    const z = cx2x(cz);
    this.base = new THREE.Vector3(x, h, z);
    this.aim = new THREE.Vector3(x, h + 1.1, z);
    // The stolen goods: a wicker basket of bread and fruit (a different mix for each net).
    const seed = [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
    if (world.def.id === 'garden') seedSprite(this.loot, seed);
    else {
      this.loot.add(mesh(cyl(0.5, 0.38, 0.45, 12), mat('#b0783a', { rough: 0.9 }), 0, 0.25, 0));
      this.loot.add(mesh(torus(0.5, 0.05), mat('#8a5a2a', { rough: 0.9 }), 0, 0.48, 0, false).rotateX(Math.PI / 2));
      const fruit = ['#ff4d4d', '#ffd166', '#8a4ad8', '#7dcf4a', '#ff9a3a'];
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + seed;
        this.loot.add(mesh(sphere(0.15, 10), mat(fruit[(i + seed) % fruit.length], { rough: 0.5 }), Math.cos(a) * 0.25, 0.55 + (i % 2) * 0.08, Math.sin(a) * 0.25, false));
      }
    }
    this.loot.position.set(x, h + 0.35, z);
    // The net: crossed gold cords around the bundle, tied to a stake, with a little glow.
    const cord = mat('#f2c14e', { emissive: '#ffb020', ei: 0.35, metal: 0.6, rough: 0.3 });
    for (let i = 0; i < 4; i++) {
      const r = mesh(torus(0.85, 0.04), cord, 0, 0, 0, false);
      r.rotation.set(Math.PI / 2, (i / 4) * Math.PI, 0);
      r.rotateX(Math.PI / 2);
      this.net.add(r);
    }
    for (const y of [-0.35, 0.1, 0.5]) {
      const ring = mesh(torus(Math.sqrt(0.85 * 0.85 - y * y), 0.035), cord, 0, y, 0, false);
      ring.rotation.x = Math.PI / 2;
      this.net.add(ring);
    }
    this.net.add(mesh(sphere(0.14, 10), cord, 0, 0.92, 0));
    this.net.add(glowSprite('#ffd166', 2.6, 0.3));
    this.net.position.set(x, h + 1, z);
    this.obj.add(this.net, this.loot);
    this.obj.add(mesh(cyl(0.06, 0.08, 1.2, 6), mat('#6a4a2a'), x + 0.9, h + 0.6, z));
    world.addTarget(this);
    world.boxes.push(box(x, z, 0.75, h, h + 2, this));
  }

  hit(): boolean {
    if (this.hp <= 0) return false;
    this.hp -= 1;
    audio.play('hit');
    this.net.scale.setScalar(1.15);
    if (this.hp <= 0) this.free();
    return true;
  }

  private free() {
    const w = this.world;
    audio.play('pop');
    audio.play('bolt');
    w.particles.emit(this.aim.x, this.aim.y, this.aim.z, { count: 40, color: '#ffd166', speed: 7, life: 0.9, size: 0.6 });
    this.net.visible = false;
    this.freedT = 0;
    this.aimable = false;
    w.removeTarget(this);
    const mine = w.boxes.find((b) => b.owner === this);
    if (mine) w.boxes.splice(w.boxes.indexOf(mine), 1);
    w.collect('colonist', this.id);
    const key = `colonist:${this.id.split('.')[1]}`;
    const lines = w.dialogue(key);
    if (w.def.stories?.[key]?.length) w.playStory(key);
    else if (lines.length) w.hooks.say(lines);
    else w.hooks.toast(tr('{name}: “{line}”', { name: tr(this.name), line: tr(this.line) }), 'phineus');
  }

  update(dt: number) {
    if (this.freedT < 0) {
      this.net.scale.setScalar(damp(this.net.scale.x, 1 + Math.sin(this.world.time * 2) * 0.03, 8, dt));
      this.net.rotation.y += dt * 0.4;
      return;
    }
    // A happy hop, then the basket sparkles away home.
    this.freedT += dt;
    const t = this.freedT;
    this.loot.position.y = this.base.y + 0.35 + Math.abs(Math.sin(t * 6)) * 0.5 * Math.max(0, 1 - t / 2);
    this.loot.rotation.y += dt * 3;
    if (t > 2.2) {
      this.loot.scale.setScalar(Math.max(0.01, 1 - (t - 2.2) * 2.5));
      if (t > 2.6) {
        this.world.particles.emit(this.base.x, this.base.y + 0.8, this.base.z, { count: 20, color: '#ffe08a', speed: 4, life: 0.6, up: 3 });
        this.remove();
      }
    }
  }
}
