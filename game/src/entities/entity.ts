import * as THREE from 'three';

import type { World } from '../game/world';

/**
 * `blast` is the charged fireball's explosion, `dash` a ram with the Dash Thrusters, `pulse` LUX's force pulse,
 * `smash` General Brennus's shoulder charge or shield bash (heavy: it knocks robots over and shields away).
 */
export type HitKind = 'shot' | 'spin' | 'pound' | 'zap' | 'blast' | 'dash' | 'pulse' | 'smash';

export abstract class Entity {
  alive = true;
  readonly obj = new THREE.Group();

  constructor(
    readonly world: World,
    readonly id: string,
  ) {
    world.scene.add(this.obj);
  }

  update(_dt: number): void {}

  remove() {
    this.alive = false;
    this.obj.removeFromParent();
    this.world.forget(this);
  }
}

/** Anything the player can shoot, spin or pound. */
export interface Target {
  alive: boolean;
  aim: THREE.Vector3;
  radius: number;
  /** Auto-aim only locks onto aimable targets. */
  aimable: boolean;
  /** Returns true if the hit connected (projectiles stop on it). */
  hit(dmg: number, kind: HitKind, from: THREE.Vector3): boolean;
}

/** Anything the LUX/action button can use. */
export interface Interactable {
  alive: boolean;
  spot: THREE.Vector3;
  range: number;
  /** Button label, or null when it can't be used right now. */
  label(): string | null;
  interact(): void;
  /** How far above or below Jason it can be used from (default 3 units). */
  reachY?: number;
  /** Picked by where Jason is facing as well as by distance (grapple anchors). */
  aimed?: boolean;
}
