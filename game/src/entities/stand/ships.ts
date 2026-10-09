/**
 * Aeëtes's gold fleet over Colchis's sky-dock (Brennus's Last Stand): the big ships hanging in the
 * sky around the dock, and the little dropships that swoop in and drop his robots onto the bridges.
 */
import * as THREE from 'three';

import { audio } from '../../core/audio';
import type { World } from '../../game/world';
import type { EnemyKind } from '../../world/levelTypes';
import { Enemy } from '../enemies';
import { Entity } from '../entity';
import { boxG, cone, cyl, glowSprite, mat, mesh, sphere } from '../models';

/**
 * One of Aeëtes's gold ships: a long gold beetle with a dark glass dome, stubby fins, glowing amber
 * engines at the back and a red eye at the front (it faces +z). About `s` x 6 units long.
 */
export function makeGoldShip(s: number): THREE.Group {
  const g = new THREE.Group();
  const gold = mat('#f0c050', { metal: 0.8, rough: 0.25 });
  const dark = mat('#2a2230', { metal: 0.4, rough: 0.3 });
  const amber = mat('#ffb020', { emissive: '#ffb020', ei: 1.6 });
  const hull = mesh(sphere(1, 20), gold, 0, 0, 0);
  hull.scale.set(1.15, 0.7, 3);
  g.add(hull);
  const dome = mesh(sphere(0.62, 16), dark, 0, 0.45, 0.9);
  dome.scale.set(1, 0.7, 1.4);
  g.add(dome);
  g.add(mesh(boxG(3.6, 0.12, 1.2), gold, 0, -0.05, -0.8));
  for (const sx of [-1, 1]) {
    g.add(mesh(boxG(0.1, 0.9, 1), gold, sx * 1.8, 0.3, -1.1));
    const eng = mesh(cyl(0.32, 0.4, 0.9, 12), dark, sx * 0.7, -0.1, -2.7);
    eng.rotation.x = Math.PI / 2;
    g.add(eng);
    g.add(mesh(cyl(0.24, 0.24, 0.1, 12), amber, sx * 0.7, -0.1, -3.16, false).rotateX(Math.PI / 2));
    g.add(glowSprite('#ffb020', 1.6, 0.8).translateX(sx * 0.7).translateY(-0.1).translateZ(-3.3));
    // Claw cranes underneath.
    g.add(mesh(cyl(0.05, 0.05, 0.9, 6), dark, sx * 0.5, -0.9, 0.6));
    g.add(mesh(cone(0.14, 0.3, 6), dark, sx * 0.5, -1.4, 0.6).rotateX(Math.PI));
  }
  g.add(mesh(sphere(0.18, 10), mat('#ff3a4c', { emissive: '#ff3a4c', ei: 2 }), 0, 0.05, 2.95, false));
  g.add(glowSprite('#ff3a4c', 1.2, 0.6).translateZ(3.05));
  g.scale.setScalar(s);
  return g;
}

/** The big ships of the fleet, hanging in the sky round the dock and drifting a little. */
export class Fleet extends Entity {
  private ships: { g: THREE.Group; base: THREE.Vector3; phase: number }[] = [];

  constructor(world: World, cx: number, cz: number, w: number, d: number, h: number) {
    super(world, 'fleet');
    const spots: [number, number, number, number][] = [
      [-0.9, 0.15, 14, 2.4],
      [1.0, 0.3, 18, 3],
      [-1.1, 0.6, 22, 3.4],
      [1.15, 0.75, 12, 2.2],
      [0.2, -0.45, 26, 4],
      [-0.6, 1.25, 20, 2.8],
    ];
    spots.forEach(([fx, fz, up, s], i) => {
      const g = makeGoldShip(s);
      const base = new THREE.Vector3(cx + fx * w, h + up, cz + (fz - 0.5) * d);
      g.position.copy(base);
      // Every ship turns to face the dock.
      g.rotation.y = Math.atan2(cx - base.x, cz - base.z);
      this.obj.add(g);
      this.ships.push({ g, base, phase: i * 1.7 });
    });
  }

  update() {
    const t = this.world.time;
    for (const s of this.ships) {
      s.g.position.y = s.base.y + Math.sin(t * 0.4 + s.phase) * 0.8;
      s.g.position.x = s.base.x + Math.sin(t * 0.13 + s.phase) * 2;
      s.g.rotation.z = Math.sin(t * 0.5 + s.phase) * 0.04;
    }
  }
}

type Leg = 'in' | 'drop' | 'out';

/**
 * A dropship: swoops in from the sky, hovers over a red ring (the warning), lowers `n` robots on its
 * claws one by one, and flies off again. `dropped` gets every robot it puts down.
 */
export class Dropship extends Entity {
  private g: THREE.Group;
  private ring: THREE.Mesh;
  private leg: Leg = 'in';
  private t = 0;
  private from: THREE.Vector3;
  private over: THREE.Vector3;
  private away: THREE.Vector3;
  private left: number;
  private dropT = 0;

  constructor(
    world: World,
    private spot: THREE.Vector3,
    /** Floor cells right under it (the spot and its safe neighbours), where its robots land. */
    private cells: [number, number][],
    private kind: EnemyKind,
    n: number,
    private variant: string | undefined,
    private room: string,
    private dropped: (e: Enemy) => void,
  ) {
    super(world, `dropship${Math.random()}`);
    const a = Math.random() * Math.PI * 2;
    this.from = new THREE.Vector3(spot.x + Math.cos(a) * 60, spot.y + 30, spot.z + Math.sin(a) * 60);
    this.over = new THREE.Vector3(spot.x, spot.y + 7.5, spot.z);
    this.away = new THREE.Vector3(spot.x - Math.cos(a) * 70, spot.y + 34, spot.z - Math.sin(a) * 70);
    this.left = n;
    this.g = makeGoldShip(0.75);
    this.g.position.copy(this.from);
    this.obj.add(this.g);
    this.ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.5, 32), new THREE.MeshBasicMaterial({ color: '#ff3a4c', transparent: true, opacity: 0.6, depthWrite: false }));
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.set(spot.x, spot.y + 0.07, spot.z);
    this.obj.add(this.ring);
    audio.play('glide', 0.6, 0.6);
  }

  update(dt: number) {
    this.t += dt;
    const g = this.g;
    const ringMat = this.ring.material as THREE.MeshBasicMaterial;
    if (this.leg === 'in') {
      const k = Math.min(1, this.t / 2.6);
      const e = 1 - (1 - k) * (1 - k);
      g.position.lerpVectors(this.from, this.over, e);
      g.lookAt(this.over.x + (this.over.x - this.from.x), g.position.y, this.over.z + (this.over.z - this.from.z));
      ringMat.opacity = 0.35 + Math.abs(Math.sin(this.t * 6)) * 0.45;
      this.ring.scale.setScalar(1.6 - k * 0.6);
      if (k >= 1) {
        this.leg = 'drop';
        this.t = 0;
      }
    } else if (this.leg === 'drop') {
      g.position.y = this.over.y + Math.sin(this.t * 3) * 0.2;
      this.dropT -= dt;
      if (this.dropT <= 0 && this.left > 0 && !this.world.cutscene) {
        this.left -= 1;
        this.dropT = 0.5;
        this.drop();
      }
      if (this.left <= 0 && this.dropT <= 0) {
        this.leg = 'out';
        this.t = 0;
        this.ring.visible = false;
        audio.play('glide', 0.7, 0.5);
      }
    } else {
      const k = Math.min(1, this.t / 3);
      const e = k * k;
      g.position.lerpVectors(this.over, this.away, e);
      g.lookAt(this.away.x, this.away.y, this.away.z);
      if (k >= 1) this.remove();
    }
  }

  /** Lowers one robot: it falls from the claws onto the dock. */
  private drop() {
    const w = this.world;
    const [cx, cz] = this.cells[Math.floor(Math.random() * this.cells.length)];
    const e = w.spawnEnemy(this.kind, cx, cz, this.variant);
    e.room = this.room;
    // It falls from the ship (fliers just start up there).
    e.body.y = Math.max(e.body.y, this.over.y - 1.5);
    e.alert();
    w.particles.emit(this.over.x, this.over.y - 1.2, this.over.z, { count: 14, color: '#ffd166', speed: 4, life: 0.5, size: 0.45 });
    audio.play('blip', 0.7);
    this.dropped(e);
  }
}
