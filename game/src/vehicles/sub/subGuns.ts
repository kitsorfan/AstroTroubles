import * as THREE from 'three';

import { audio } from '../../core/audio';
import type { World } from '../../game/world';
import { firstAt } from './seaView';
import { ORGAN, type OrganFight, type OrganEvents } from './organ';
import type { Dive, DiveEvents, Fish } from './swim';
import { TORPEDO_SPEED, makeTorpedoes, type SoundRings, type Torpedo } from './subFx';

/**
 * The Dolphin's torpedoes (BLAST): little gold torpedoes with a bubble trail. They bend toward a target
 * roughly ahead (aim assist: the nearest piranha, a singing buoy, or the Siren Organ's glowing pipe),
 * pop piranhas, knock buoys quiet, break pipes, and just fizz on rocks.
 */

export interface GunHits {
  fish(f: Fish): void;
  pipe(i: number, ok: boolean): void;
}

export class Guns {
  private torps: Torpedo[];
  private cd = 0;
  shotFish = 0;

  constructor(
    private world: World,
    scene: THREE.Object3D,
    private rings: SoundRings,
  ) {
    this.torps = makeTorpedoes(scene);
  }

  /** Where a torpedo should go: [x, y, distance ahead] of the best target near the line of fire, if any. */
  private target(d: Dive, organ: OrganFight | null): [number, number, number] | null {
    let best: [number, number, number] | null = null;
    let score = Infinity;
    const consider = (x: number, y: number, rel: number) => {
      if (rel < 2 || rel > 60) return;
      const off = Math.hypot(x - d.x, y - d.y);
      if (off > 4 + rel * 0.12) return;
      const sc = off * 3 + rel * 0.2;
      if (sc < score) {
        score = sc;
        best = [x, y, rel];
      }
    };
    for (const f of d.fish) if (f.alive && !f.fled) consider(f.x, f.y, f.s - d.s);
    for (const b of d.buoys) if (!b.quiet) consider(b.b.x, b.b.y, b.b.s - d.s);
    if (organ && d.holding && !organ.finale) {
      const p = organ.pipes[organ.lit];
      // The glowing pipe is always worth aiming at in the arena, wherever the sub is.
      if (p && p.hp > 0 && !best) best = [p.x, p.y, ORGAN.dist];
    }
    return best;
  }

  update(dt: number, fire: boolean, d: Dive, organ: OrganFight | null, ev: DiveEvents, oev: OrganEvents, hits: GunHits) {
    this.cd -= dt;
    if (fire && this.cd <= 0) this.fire(d, organ);
    for (const t of this.torps) {
      if (!t.alive) continue;
      t.rel += TORPEDO_SPEED * dt;
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.mesh.position.set(t.x, t.y, -t.rel);
      if (Math.random() < 0.6) this.world.particles.emit(t.x, t.y, -t.rel + 0.6, { count: 1, color: '#e8fbff', speed: 0.4, life: 0.5, size: 0.35, gravity: -1.2 });
      if (this.hit(t, d, organ, ev, oev, hits) || t.rel > 70) {
        t.alive = false;
        t.mesh.visible = false;
      }
    }
  }

  private fire(d: Dive, organ: OrganFight | null) {
    this.cd = 0.32;
    const t = this.torps.find((x) => !x.alive);
    if (!t) return;
    const aim = this.target(d, organ);
    t.alive = true;
    t.rel = 2.4;
    t.x = d.x;
    t.y = d.y - 0.35;
    const time = aim ? Math.max(0.05, (aim[2] - t.rel) / TORPEDO_SPEED) : 1;
    t.vx = aim ? (aim[0] - t.x) / time : 0;
    t.vy = aim ? (aim[1] - t.y) / time : 0;
    t.mesh.visible = true;
    audio.play('shoot', 0.7, 0.6);
    this.world.particles.emit(t.x, t.y, -2, { count: 5, color: '#e8fbff', speed: 1.5, life: 0.5, size: 0.4, gravity: -1.5 });
  }

  /** True if the torpedo hit something (and is used up). */
  private hit(t: Torpedo, d: Dive, organ: OrganFight | null, ev: DiveEvents, oev: OrganEvents, hits: GunHits): boolean {
    const s = d.s + t.rel;
    for (const f of d.fish) {
      if (!f.alive || Math.hypot(f.x - t.x, f.y - t.y, f.s - s) > 1.3) continue;
      f.alive = false;
      this.shotFish += 1;
      hits.fish(f);
      return true;
    }
    for (const b of d.buoys) {
      if (b.quiet || Math.hypot(b.b.x - t.x, b.b.y - t.y, b.b.s - s) > 1.8) continue;
      d.shootBuoy(b, ev);
      audio.play('hit', 0.8);
      this.rings.burst(b.b.x, b.b.y, -(b.b.s - d.s), 0.5, 2.4, '#ffd166', 0.4);
      return true;
    }
    if (organ && d.holding && t.rel >= ORGAN.dist - 1) {
      for (let i = 0; i < organ.pipes.length; i++) {
        const p = organ.pipes[i];
        if (p.hp <= 0 || Math.hypot(p.x - t.x, p.y - t.y) > 2.2) continue;
        hits.pipe(i, organ.hitPipe(i, oev));
        return true;
      }
      if (t.rel >= ORGAN.dist + 2) {
        this.world.particles.emit(t.x, t.y, -t.rel, { count: 8, color: '#ffd166', speed: 3, life: 0.4, size: 0.5, gravity: 0 });
        return true;
      }
    }
    // Rocks just fizz the torpedo out.
    const things = d.things;
    for (let i = firstAt(things, s - 3); i < things.length; i++) {
      const th = things[i];
      if (th.s > s + 3) break;
      if (th.kind !== 'rock' || Math.hypot(th.x - t.x, th.y - t.y, th.s - s) > th.r + 0.3) continue;
      this.world.particles.emit(t.x, t.y, -t.rel, { count: 6, color: '#e8fbff', speed: 2, life: 0.4, size: 0.4, gravity: -1 });
      return true;
    }
    return false;
  }

  clear() {
    for (const t of this.torps) {
      t.alive = false;
      t.mesh.visible = false;
    }
  }
}
