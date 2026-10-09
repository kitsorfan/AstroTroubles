import * as THREE from 'three';

import { audio } from '../../core/audio';
import { damp } from '../../core/math';
import type { World } from '../../game/world';
import { Grid } from '../../world/grid';
import type { EnemyModel } from '../aliens';
import { Enemy } from '../enemies';
import type { HitKind } from '../entity';
import { blobShadow, boxG, cyl, glowSprite, mat, mesh, ownMat, sphere } from '../models';

/**
 * An ANVIL DRONE, one of Aeëtes's gold work drones (Talos's Forge). It hovers high over the hero with an
 * iron anvil on a cable. A red circle shows where the anvil will land (the warning), then it lets go;
 * the anvil thumps down, sits there a moment, and the drone swoops down low to hook it back up. That's
 * the moment to PUNCH it (or blast it any time with the cannon). Gentle numbers: one heart if the anvil
 * lands on you, and the circle is big and slow.
 */
export const ANVIL_TUNING = {
  hp: 3,
  /** Height above the hero while it carries the anvil, and how fast it follows. */
  hover: 5.5,
  follow: 1.4,
  /** Seconds between drops, the red-circle warning, and the circle's radius. */
  rest: 2.6,
  warn: 1.1,
  radius: 1.5,
  /** Seconds the anvil sits on the ground before the drone swoops down for it, and how low it comes. */
  lie: 1.3,
  fetch: 1.6,
  low: 1.3,
};

type Mode = 'idle' | 'track' | 'warn' | 'drop' | 'lie' | 'fetch' | 'climb';

let AnvilClass: (new (world: World, id: string, x: number, y: number, z: number) => Enemy) | null = null;

/** Builds an anvil drone (the class extends `Enemy`, so it is defined on first use, like the harpy). */
export function makeAnvilDrone(world: World, id: string, x: number, y: number, z: number): Enemy {
  AnvilClass ??= anvilClass();
  return new AnvilClass(world, id, x, y, z);
}

/** The iron anvil (hanging under the drone, or falling and lying on the ground). */
function anvilMesh(): THREE.Group {
  const g = new THREE.Group();
  const iron = mat('#3a3640', { rough: 0.45, metal: 0.7 });
  g.add(mesh(boxG(0.9, 0.22, 0.5), iron, 0, 0.5, 0));
  g.add(mesh(boxG(0.36, 0.28, 0.34), iron, 0, 0.27, 0));
  g.add(mesh(boxG(0.7, 0.14, 0.5), iron, 0, 0.07, 0));
  const horn = mesh(cyl(0.02, 0.2, 0.42, 8), iron, 0.62, 0.5, 0);
  horn.rotation.z = Math.PI / 2;
  g.add(horn);
  return g;
}

function makeAnvilModel(): EnemyModel & { rotor: THREE.Group; hanging: THREE.Group; eye: THREE.MeshStandardMaterial; cable: THREE.Mesh } {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const gold = ownMat('#f2c14e', { emissive: '#ffb020', ei: 0.08, rough: 0.25, metal: 0.8 });
  const dark = mat('#8a6a2a', { rough: 0.4, metal: 0.6 });
  const eye = ownMat('#ff3a4c', { emissive: '#ff3a4c', ei: 2 });
  // A round gold pod with one red eye, a rotor on a mast, and two little side fans.
  const pod = mesh(sphere(0.42, 18), gold, 0, 0, 0);
  pod.scale.set(1, 0.7, 1);
  body.add(pod);
  body.add(mesh(sphere(0.1, 10), eye, 0, 0.02, 0.4, false));
  body.add(mesh(cyl(0.05, 0.05, 0.3, 6), dark, 0, 0.38, 0));
  const rotor = new THREE.Group();
  rotor.position.y = 0.55;
  for (const a of [0, Math.PI / 2]) {
    const blade = mesh(boxG(1.5, 0.04, 0.16), dark, 0, 0, 0);
    blade.rotation.y = a;
    rotor.add(blade);
  }
  body.add(rotor);
  for (const sx of [-1, 1]) body.add(mesh(cyl(0.16, 0.16, 0.1, 10), dark, sx * 0.48, 0, 0).rotateZ(Math.PI / 2));
  // The cable and the anvil under it.
  const cable = mesh(cyl(0.025, 0.025, 1, 5), dark, 0, -0.75, 0, false);
  body.add(cable);
  const hanging = anvilMesh();
  hanging.position.y = -1.9;
  body.add(hanging);
  body.add(glowSprite('#ffd166', 1.2, 0.2));
  const shadow = blobShadow(1.2);
  root.add(shadow);
  return { root, body, flash: [gold], parts: { shadow }, rotor, hanging, eye, cable };
}

function anvilClass() {
  const T = ANVIL_TUNING;
  return class AnvilDrone extends Enemy {
    private mode: Mode = 'idle';
    private modeT = 1 + Math.random() * 2;
    private m: ReturnType<typeof makeAnvilModel>;
    private baseY: number;
    /** The dropped anvil, the red circle under it, and where it lands. */
    private dropped = anvilMesh();
    private disc: THREE.Mesh;
    private target = new THREE.Vector3();
    private fallV = 0;

    constructor(world: World, id: string, x: number, y: number, z: number) {
      const model = makeAnvilModel();
      super(world, id, x, y + T.hover, z, T.hp, 0.55, model);
      this.m = model;
      this.flying = true;
      this.contact = false;
      this.kind = 'anvil';
      this.bolts = 4;
      this.aimHeight = 0;
      this.badgeY = 1;
      this.baseY = y + T.hover;
      this.dropped.visible = false;
      this.obj.add(this.dropped);
      this.disc = new THREE.Mesh(
        new THREE.CircleGeometry(T.radius, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: '#ff3a3a', transparent: true, opacity: 0.4, depthWrite: false }),
      );
      this.disc.visible = false;
      this.obj.add(this.disc);
    }

    hit(dmg: number, kind: HitKind, from: THREE.Vector3): boolean {
      const ok = super.hit(dmg, kind, from);
      // Knocked about while fetching: it gives up on the anvil for now and climbs away.
      if (ok && this.alive && this.mode === 'fetch') this.setMode('climb', 1.2);
      return ok;
    }

    die() {
      this.disc.visible = false;
      super.die();
    }

    private setMode(m: Mode, t: number) {
      this.mode = m;
      this.modeT = t;
    }

    /** The floor under a point (or the drone's own height minus a lot, over a void). */
    private floorAt(x: number, z: number) {
      const c = this.world.grid.cell(Grid.toCell(x), Grid.toCell(z));
      return c.kind === 'wall' || c.kind === 'void' ? null : c.h;
    }

    protected think(dt: number) {
      const b = this.body;
      const p = this.player.body;
      const g = this.world.grid;
      this.modeT -= dt;
      let tx = this.home.x + Math.cos(this.t * 0.6) * 1.4;
      let tz = this.home.z + Math.sin(this.t * 0.6) * 1.4;
      let ty = this.baseY + Math.sin(this.t * 2) * 0.25;
      let follow = T.follow;
      switch (this.mode) {
        case 'idle':
          if (this.aggro && this.modeT <= 0) this.setMode('track', T.rest / this.rate);
          break;
        case 'track':
          // Floats over the hero, a little behind where they are going.
          tx = p.x + p.vx * 0.3;
          tz = p.z + p.vz * 0.3;
          ty = p.y + T.hover;
          if (!this.aggro) this.setMode('idle', 1);
          else if (this.modeT <= 0) {
            const h = this.floorAt(p.x, p.z);
            if (h !== null && Math.abs(h - p.y) < 1.2) {
              this.target.set(p.x, h, p.z);
              this.disc.position.set(p.x, h + 0.06, p.z);
              this.disc.visible = true;
              this.setMode('warn', T.warn / Math.max(0.8, this.rate));
              audio.play('alarm', 2.2, 0.25);
            } else this.modeT = 0.5;
          }
          break;
        case 'warn':
          // Hangs right over the red circle, eye blazing: "look out below!"
          tx = this.target.x;
          tz = this.target.z;
          ty = this.target.y + T.hover;
          follow = 4;
          if (this.modeT <= 0) {
            this.setMode('drop', 3);
            this.m.hanging.visible = false;
            this.m.cable.visible = false;
            this.dropped.visible = true;
            this.dropped.position.set(b.x, b.y - 1.9, b.z);
            this.dropped.rotation.y = this.yaw;
            this.fallV = 0;
            audio.play('glide', 0.6, 0.6);
          }
          break;
        case 'drop': {
          // The anvil falls; the drone waits above.
          tx = b.x;
          tz = b.z;
          ty = b.y;
          this.fallV += 40 * dt;
          const a = this.dropped.position;
          a.y -= this.fallV * dt;
          if (a.y <= this.target.y) {
            a.y = this.target.y;
            this.disc.visible = false;
            this.land();
            this.setMode('lie', T.lie);
          }
          break;
        }
        case 'lie':
          tx = this.target.x;
          tz = this.target.z;
          ty = this.target.y + T.hover;
          if (this.modeT <= 0) this.setMode('fetch', T.fetch);
          break;
        case 'fetch':
          // Swoops down low to hook the anvil back up: punch it now!
          tx = this.target.x;
          tz = this.target.z;
          ty = this.target.y + T.low + 1.6;
          follow = 3;
          if (this.modeT <= 0) {
            this.dropped.visible = false;
            this.m.hanging.visible = true;
            this.m.cable.visible = true;
            this.setMode('climb', 1.2);
            audio.play('reload', 0.6, 0.5);
          }
          break;
        case 'climb':
          tx = b.x;
          tz = b.z;
          ty = p.y + T.hover;
          if (this.modeT <= 0) {
            // It always has its anvil back by the time it's up again.
            this.dropped.visible = false;
            this.m.hanging.visible = true;
            this.m.cable.visible = true;
            this.setMode('track', T.rest / this.rate);
          }
          break;
      }
      const nx = damp(b.x, tx, follow, dt);
      const nz = damp(b.z, tz, follow, dt);
      if (g.cell(Grid.toCell(nx), Grid.toCell(nz)).kind !== 'wall') {
        b.x = nx;
        b.z = nz;
      }
      b.y = damp(b.y, ty, 2.5, dt);
      this.pose(dt);
    }

    /** The anvil lands: a thump, dust, and one heart off anyone standing in the circle. */
    private land() {
      const w = this.world;
      const a = this.target;
      w.soundAt('pound', a.x, a.z, 0.8, 22);
      w.shake(0.25);
      w.rings.burst(a.x, a.y + 0.05, a.z, T.radius * 2.2, '#ffb04a', 0.3);
      w.particles.emit(a.x, a.y + 0.2, a.z, { count: 18, color: '#b8a890', speed: 5, life: 0.5, size: 0.7, up: 1, gravity: 2 });
      const p = this.player.body;
      if (Math.hypot(p.x - a.x, p.z - a.z) < T.radius + p.r * 0.5 && p.y < a.y + 1.2) this.player.hurt(1, a.x, a.z);
    }

    private pose(dt: number) {
      const b = this.body;
      const warn = this.mode === 'warn';
      if (this.mode === 'track' || this.mode === 'idle') this.facePlayer(dt, 3);
      this.m.rotor.rotation.y += dt * 28;
      this.m.body.rotation.z = Math.sin(this.t * 2.2) * 0.06;
      this.m.hanging.rotation.z = Math.sin(this.t * 1.7) * 0.12;
      this.m.eye.emissiveIntensity = warn ? 3 + Math.sin(this.t * 40) * 2 : 2;
      if (this.disc.visible) {
        const mtl = this.disc.material as THREE.MeshBasicMaterial;
        mtl.opacity = 0.3 + 0.2 * Math.sin(this.t * 14);
      }
      const shadow = this.m.parts.shadow;
      const c = this.world.grid.cell(Grid.toCell(b.x), Grid.toCell(b.z));
      shadow.visible = c.kind !== 'void';
      shadow.position.y = c.h - b.y + 0.03;
    }

    remove() {
      this.dropped.removeFromParent();
      this.disc.removeFromParent();
      super.remove();
    }
  };
}
