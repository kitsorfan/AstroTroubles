export type DeckId = 'cryo' | 'hydro' | 'engine' | 'habitat' | 'security' | 'bridge';
export type ThemeId = DeckId;
export type TileKind = 'void' | 'floor' | 'wall' | 'hazard' | 'ice' | 'grate';
export type Ability = 'doubleJump' | 'dash' | 'glide' | 'pulse';
export type EnemyKind = 'sporeling' | 'snapper' | 'buzzer' | 'sentry' | 'turret' | 'brute';
export type BossKind = 'warden' | 'queen' | 'golem' | 'bloblin' | 'wardog' | 'heart' | 'reborn';

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
    /** `latch` doors stay open once opened (for puzzles whose switches time out). */
    | { type: 'door'; id: string; open: Cond; color?: string; latch?: boolean }
    /** A floor pad in a code puzzle: step on every pad of the group in order to set the group's flag. */
    | { type: 'rune'; group: string; order: number; color: string }
    /** A vault chest with a reward: an upgrade level (or bolts, if that upgrade is maxed). */
    | { type: 'prize'; id: string; reward: 'blaster' | 'rapid' | 'clip' | 'boltZap' | 'magnet' | 'heart' | 'bolts' }
    | { type: 'switch'; flag: string; timed?: number }
    | { type: 'terminal'; flag: string; length?: number; label?: string }
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
    | { type: 'holo'; log: string; who?: 'captain' | 'rosa' }
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
  | 'screen';

/** `glitch` is HALCYON while GaScu pollen scrambles its circuits. */
export type Speaker = 'jason' | 'bolt' | 'halcyon' | 'glitch' | 'colonist' | 'vendy' | 'gascu' | 'captain' | 'rosa';

export interface Line {
  who: Speaker;
  text: string;
  name?: string;
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
  boss?: BossKind;
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
