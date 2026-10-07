import type { PuzzleKind } from '../game/puzzles';
import type { PanelId } from '../ui/panels/ids';
import type { FlightCourse } from '../vehicles/course';

/**
 * Chapter 1 is the six decks of the colony ship; chapter 2 is six regions of the planet Gaia Nova;
 * chapter 3, The Argonauts, is the voyage of the Argo to the moon Colchis (its levels are being built
 * one by one: see `CHAPTER_PLAN` in levels/index.ts).
 */
export type DeckId = 'cryo' | 'hydro' | 'engine' | 'habitat' | 'security' | 'bridge' | 'plains' | 'desert' | 'snow' | 'rockies' | 'jungle' | 'volcano' | 'rocks';
/**
 * A level that is driven instead of walked: the vehicle replaces Jason on foot (see game/src/vehicles).
 * Only the Argo flies so far; the submarine and the mech suit are planned for later chapter 3 levels.
 */
export type VehicleKind = 'argo' | 'sub' | 'mech';
export type ThemeId = DeckId;
export type TileKind = 'void' | 'floor' | 'wall' | 'hazard' | 'ice' | 'grate';
export type Ability = 'doubleJump' | 'dash' | 'glide' | 'pulse' | 'grapple';
/** The last four are General Brennus's robots (chapter 2 only). */
export type EnemyKind = 'sporeling' | 'snapper' | 'buzzer' | 'sentry' | 'turret' | 'brute' | 'trooper' | 'minebot' | 'bulwark' | 'mortar';
export type BossKind = 'warden' | 'queen' | 'golem' | 'bloblin' | 'wardog' | 'heart' | 'reborn' | 'thresher' | 'driller' | 'boreas' | 'stheno' | 'hydra' | 'colossus';

/** Conditions that open doors or arm triggers. */
export type Cond = { flag: string } | { clear: string } | { boss: true } | { all: Cond[] };

interface Base {
  /** Floor height (in world units) under this entity. Defaults to the neighbours' height. */
  h?: number;
  /** Tile kind under this entity (defaults to floor, or void for moving platforms). */
  floor?: TileKind;
}

export type Spec = Base &
  (
    | { type: 'spawn'; facing?: number }
    | { type: 'bolt' }
    | { type: 'crate'; loot?: 'bolts' | 'heart' | 'big'; metal?: boolean }
    | { type: 'heart' }
    /** A dash energy cell that grows back a few seconds after Jason takes it (placed before dash jumps). */
    | { type: 'energy' }
    /** An invisible spot an objective can point the waypoint at (`at` in the objective). */
    | { type: 'marker'; id: string }
    | { type: 'canister'; id: string }
    | { type: 'shard'; id: string }
    | { type: 'upgrade'; ability: Ability; id: string }
    | { type: 'checkpoint'; id: string }
    | { type: 'enemy'; enemy: EnemyKind; room?: string; variant?: string }
    | { type: 'boss'; boss: BossKind; room: string }
    | { type: 'door'; id: string; open: Cond; color?: string }
    /** A floor pad in a code puzzle: step on every pad of the group in order to set the group's flag. */
    | { type: 'rune'; group: string; order: number; color: string }
    /** A vault chest with a reward: an upgrade level (or bolts, if that upgrade is maxed). */
    | { type: 'prize'; id: string; reward: 'blaster' | 'rapid' | 'clip' | 'boltZap' | 'magnet' | 'heart' | 'bolts' }
    /**
     * A red floor switch: a ground pound presses it and sets `flag`. A `timed` switch pops back up after
     * that many seconds. `together` switches share their flag and one clock: the first press starts
     * `timed` seconds, the flag is set once they are all down, and from then on they stay down.
     */
    | { type: 'switch'; flag: string; timed?: number; together?: boolean }
    /** A LUX HACK terminal: solving its puzzle (the memory lights unless `puzzle` says otherwise) sets `flag`. */
    | { type: 'terminal'; flag: string; length?: number; label?: string; puzzle?: PuzzleKind }
    | { type: 'cell' }
    | { type: 'socket'; flag: string }
    | {
        type: 'platform';
        /** Waypoints relative to the start, in cells: [dx, dz, dy]. */
        path: [number, number, number?][];
        speed?: number;
        wait?: number;
        size?: number;
        needs?: Cond;
      }
    | { type: 'faller' }
    | { type: 'bounce' }
    | { type: 'vent'; period?: number; offset?: number }
    /** `hardened` emitters guard puzzles, so LUX's force pulse can't short them out. */
    | { type: 'laser'; axis: 'x' | 'z'; length: number; period?: number; offset?: number; always?: boolean; off?: Cond; low?: boolean; hardened?: boolean }
    | { type: 'zap'; period?: number; offset?: number }
    | { type: 'conveyor'; dx: number; dz: number; speed?: number }
    | { type: 'cocoon'; id: string; name: string; line: string }
    | { type: 'vendor' }
    | { type: 'sign'; text: string }
    | { type: 'trigger'; id: string; dialogue?: string; event?: string; w?: number; d?: number; when?: Cond }
    | { type: 'dark' }
    | { type: 'exit' }
    | { type: 'breakwall' }
    | { type: 'boltfind' }
    /** A hologram projector that plays a recorded message (a dialogue key) the first time Jason walks past. */
    | { type: 'holo'; log: string; who?: HoloSpeaker }
    /** A glowing grapple ring: with the GRAPPLE hook, Jason can zip to it from far away (and land on the cell it sits on). */
    | { type: 'anchor' }
    /** A gust zone `w` x `d` cells around the letter that shoves Jason along (dx, dz) every `period` seconds. */
    | { type: 'wind'; dx: number; dz: number; w?: number; d?: number; period?: number; offset?: number; strength?: number }
    /** Quicksand (or deep snow, or bog): Jason wades slowly and sinks if he stands still too long. */
    | { type: 'quicksand' }
    /** A lane that a boulder (or log, or snowball) rolls down every `period` seconds: jump over it. */
    | { type: 'boulder'; axis: 'x' | 'z'; length: number; period?: number; offset?: number }
    | { type: 'decor'; kind: DecorKind; rot?: number; scale?: number; solid?: boolean }
  );

export type DecorKind =
  | 'pod'
  | 'console'
  | 'crystal'
  | 'pipes'
  | 'tank'
  | 'tree'
  | 'mushroom'
  | 'flowers'
  | 'crops'
  | 'barrel'
  | 'generator'
  | 'lamp'
  | 'bench'
  | 'kiosk'
  | 'fountain'
  | 'locker'
  | 'camera'
  | 'barrier'
  | 'globe'
  | 'bloom'
  | 'screen'
  /* Gaia Nova outdoors. */
  | 'rock'
  | 'boulder'
  | 'cactus'
  | 'pine'
  | 'palm'
  | 'bush'
  | 'grass'
  | 'fern'
  | 'icespike'
  | 'lavarock'
  | 'bones'
  | 'tent'
  | 'wreck'
  | 'thorns'
  | 'banner'
  | 'pillar';

/**
 * How a chapter ends. Chapter 1: GaScu is stopped (`saved`) or befriended (`friends`). Chapter 2:
 * Brennus is beaten (`freed`) or talked down with every journal page (`redeemed`). Chapter 3's
 * endings (the true final ones) come with its last level.
 */
export type EndingKind = 'saved' | 'friends' | 'freed' | 'redeemed';

/** Low props Jason walks straight through (they never block a cell). */
export const PASSABLE_DECOR: readonly DecorKind[] = ['grass', 'fern', 'bones', 'flowers', 'crops'];

/** Who can appear in a hologram log. */
export type HoloSpeaker = 'captain' | 'rosa' | 'hypatia' | 'brennus';

/** `glitch` is HALCYON while GaScu pollen scrambles its circuits. `aeetes` is chapter 3's villain. */
export type Speaker = 'jason' | 'bolt' | 'halcyon' | 'glitch' | 'colonist' | 'vendy' | 'gascu' | 'celestia' | 'captain' | 'rosa' | 'brennus' | 'hypatia' | 'aeetes';

export interface Line {
  who: Speaker;
  text: string;
  name?: string;
}

/** One storybook picture in a story scene, with what is said (or narrated) over it. */
export interface StoryBeat {
  panel: PanelId;
  lines?: Line[];
  caption?: string;
}

export interface LevelDef {
  id: DeckId;
  index: number;
  name: string;
  subtitle: string;
  music: string;
  map: string;
  legend: Record<string, Spec>;
  intro?: string;
  outro?: string;
  /** `at` points the HUD waypoint somewhere: a marker id, 'boss' or 'exit'. */
  objectives: { until: Cond; text: string; at?: string }[];
  /** Shards in this deck, for the pause menu and results. */
  shardIds: string[];
  colonistIds?: string[];
  dialogues: Record<string, Line[]>;
  /**
   * Storybook scenes: illustrated panels with lines. A `colonist:<id>` story plays when that cocoon is
   * freed (instead of its conversation); others play from a trigger's `story:<key>` event.
   */
  stories?: Record<string, StoryBeat[]>;
  boss?: BossKind;
  /**
   * Driven instead of walked: the vehicle replaces Jason on foot, with its own controls, camera and HUD.
   * A vehicle level still has a (tiny) map for the spawn, but its play happens on the vehicle's course.
   */
  vehicle?: VehicleKind;
  /** The Argo's flight course (for `vehicle: 'argo'`). */
  flight?: FlightCourse;
}

export interface Cell {
  kind: TileKind;
  /** Top of the floor (walls report their visual top). */
  h: number;
  dark: boolean;
}

export interface PlacedEntity {
  id: string;
  spec: Spec;
  cx: number;
  cz: number;
  h: number;
}

export interface ParsedLevel {
  def: LevelDef;
  width: number;
  depth: number;
  cells: Cell[];
  entities: PlacedEntity[];
  spawn: { cx: number; cz: number; h: number; facing: number };
}
