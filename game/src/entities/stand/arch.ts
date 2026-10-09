import * as THREE from 'three';

import { CELL } from '../../core/constants';
import type { World } from '../../game/world';
import { Entity } from '../entity';
import { boxG, cyl, glowSprite, mat, mesh, sphere, torus } from '../models';

/**
 * The Sky Gate of Colchis (Brennus's Last Stand): the Gardeners' great arch of pale stone at the end
 * of the sky-dock, glowing with teal light-runes. The Argo flies through it at the end of the level.
 * `span` is the distance between the two pillars (world units); it stands across the x axis.
 */
export class SkyArch extends Entity {
  private runes: THREE.MeshStandardMaterial;
  private halo: THREE.Sprite;

  constructor(world: World, id: string, cx: number, cz: number, h: number, span = 18) {
    super(world, id);
    const stone = mat('#e2d6c0', { rough: 0.75 });
    const trim = mat('#c9a24a', { metal: 0.7, rough: 0.3 });
    this.runes = new THREE.MeshStandardMaterial({ color: '#5ee0c8', emissive: '#5ee0c8', emissiveIntensity: 1.6 });
    const g = new THREE.Group();
    g.position.set(cx * CELL + CELL / 2, h, cz * CELL + CELL / 2);
    const tall = 15;
    for (const sx of [-1, 1]) {
      const x = (sx * span) / 2;
      g.add(mesh(boxG(3, 1, 3), stone, x, 0.5, 0));
      g.add(mesh(cyl(1.1, 1.3, tall, 10), stone, x, tall / 2, 0));
      g.add(mesh(boxG(2.8, 0.4, 2.8), trim, x, tall, 0));
      // Teal light-runes up the face of each pillar.
      for (let i = 0; i < 6; i++) g.add(mesh(sphere(i % 2 ? 0.2 : 0.28, 10), this.runes, x - sx * 0.2, 2 + i * 2.1, 1.12, false));
    }
    // The curve on top: half a thick ring of stone, with a gold rim and the rune "home" at the crown.
    const ring = mesh(new THREE.TorusGeometry(span / 2, 1.2, 10, 32, Math.PI), stone, 0, tall, 0);
    g.add(ring);
    const rim = mesh(new THREE.TorusGeometry(span / 2 + 1.1, 0.15, 6, 32, Math.PI), trim, 0, tall, 0, false);
    g.add(rim);
    g.add(mesh(torus(1.1, 0.22), this.runes, 0, tall + span / 2, 1.2, false));
    g.add(mesh(sphere(0.45, 12), this.runes, 0, tall + span / 2, 1.2, false));
    this.halo = glowSprite('#5ee0c8', span * 1.1, 0.25);
    this.halo.position.set(0, tall * 0.7, 0);
    g.add(this.halo);
    this.obj.add(g);
  }

  update() {
    const t = this.world.time;
    this.runes.emissiveIntensity = 1.4 + Math.sin(t * 1.5) * 0.4;
    this.halo.material.opacity = 0.2 + Math.sin(t * 0.8) * 0.06;
  }
}
