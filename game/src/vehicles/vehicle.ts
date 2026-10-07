import type * as THREE from 'three';

import type { Director, Rig } from '../cinema/director';
import type { Input } from '../core/input';
import type { VehicleKind } from '../world/levelTypes';

/**
 * The vehicle framework. A level with `vehicle` in its LevelDef is driven instead of walked: the World
 * builds the vehicle (see `makeVehicle` in index.ts) and, every frame, lets it run instead of Jason on
 * foot. The vehicle owns its controls, its camera pose, its part of the scene and its HUD readouts;
 * the World keeps everything shared (the scene, lights, particles, cutscenes, objectives and hooks).
 *
 * Adding a vehicle (the submarine, the mech suit) means: a class implementing `Vehicle`, a case in
 * `makeVehicle`, and whatever course or map data it needs in the LevelDef. The game, the HUD and the
 * World already know what to do with it.
 */
export interface Vehicle {
  readonly kind: VehicleKind;
  /** Hull hearts (shown where Jason's hearts usually are). */
  readonly hull: number;
  readonly hullMax: number;
  /** Where the vehicle is in the world (for the sun's shadows and anything that follows it). */
  readonly pos: THREE.Vector3;
  /** One frame of play. While `cutscene` is true the vehicle idles and only keeps its clock running. */
  update(dt: number, input: Input, cutscene: boolean): void;
  /** Where the follow camera goes this frame. */
  cameraPose(out: Rig, dt: number): Rig;
  /** The opening shot when the level starts fresh (instead of the on-foot flyover). */
  intro(d: Director): Promise<void>;
  /** Back to the last checkpoint after the hull runs out (or from the pause menu). */
  respawn(): void;
  /** What the vehicle's HUD shows. */
  hud(): VehicleHud;
  /** Its stats so far, as [label, value] rows for the pause menu and the results (labels already translated). */
  stats(): [string, string][];
  /** Developer shortcut (`#deck=<id>&at=<n>`): jump ahead along the course. */
  skipTo?(at: number): void;
  /** Frees anything the vehicle added outside the scene (its HUD elements). */
  dispose(): void;
}

/** The vehicle HUD: hull hearts, a boost meter, a counter, a progress bar and a prompt. */
export interface VehicleHud {
  hull: number;
  hullMax: number;
  /** Boost meter 0..1, and how many boosts it holds when full. */
  boost: number;
  boostSlots: number;
  /** True while a boost is running (the button glows). */
  boosting: boolean;
  /** A counter in the top right: [icon kind, got, total]. */
  counter: ['ring', number, number] | null;
  /** How far along the course (0..1), with the checkpoint marks. */
  progress: number;
  marks: number[];
  /** A big call-out in the middle of the screen (already in English; the HUD translates it). */
  prompt: string | null;
  /** The prompt is urgent (flashing gold, e.g. "BOOST NOW!"). */
  urgent: boolean;
}
