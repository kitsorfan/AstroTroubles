export type DeckId = 'cryo' | 'hydro' | 'engine' | 'habitat' | 'security' | 'bridge';
export type Dir = 'up' | 'down' | 'left' | 'right';
export interface Vec {
  x: number;
  y: number;
}

export type DamageType = 'blunt' | 'thermal' | 'kinetic' | 'emp' | 'cryo';

export type ItemId =
  | 'repair_kit'
  | 'spares'
  | 'battery'
  | 'stim'
  | 'emp_grenade'
  | 'incendiary'
  | 'coolant'
  | 'serum'
  | 'keycard_captain'
  | 'keycard_armory'
  | 'keycard_dray'
  | 'sticker';

export type WeaponId = 'wrench' | 'cutter' | 'rifle';

export type ModuleId =
  | 'stun'
  | 'scan'
  | 'shield'
  | 'hack'
  | 'capacitor'
  | 'floodlight'
  | 'plating'
  | 'decoy'
  | 'nanites'
  | 'overcharge';

export type MemoryId = 'mem1' | 'mem2' | 'mem3' | 'mem4' | 'mem5' | 'mem6';

export type EnemyId =
  | 'crawler'
  | 'swarm'
  | 'infected'
  | 'secbot'
  | 'welder'
  | 'brute'
  | 'sentinel'
  | 'tendril'
  | 'warden'
  | 'vine'
  | 'titan'
  | 'matron'
  | 'wardog'
  | 'heart'
  | 'heart2';

export type EndingId = 'escape' | 'saved' | 'communion';

export type SfxId =
  | 'step'
  | 'bump'
  | 'door'
  | 'hack'
  | 'pickup'
  | 'select'
  | 'blip'
  | 'hit'
  | 'crit'
  | 'miss'
  | 'zap'
  | 'shield'
  | 'heal'
  | 'burn'
  | 'emp'
  | 'death'
  | 'levelup'
  | 'alarm'
  | 'victory'
  | 'defeat'
  | 'scan'
  | 'elevator'
  | 'hurt';

export type MusicId = 'explore' | 'battle' | 'boss' | 'title';

export type SpeakerId =
  | 'kai'
  | 'bolt'
  | 'halcyon'
  | 'narrator'
  | 'log'
  | 'bloom'
  | 'voss'
  | 'okafor'
  | 'dray'
  | 'nair'
  | 'haddad'
  | 'hollis'
  | 'juno'
  | 'tanaka'
  | 'mia'
  | 'vendor';

/* ---------------- Conditions & effects (used by dialogue JSON and map data) ---------------- */

export type Condition =
  | { flag: string }
  | { noFlag: string }
  | { item: ItemId; min?: number }
  | { module: ModuleId }
  | { noModule: ModuleId }
  | { weapon: WeaponId }
  | { memories: number }
  | { scrap: number }
  | { timeBelow: number }
  | { timeAtLeast: number }
  | { survivors: number }
  | { level: number }
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition };

export interface EncounterSpec {
  enemies: EnemyId[];
  tier?: number;
  boss?: boolean;
  id?: string;
  onWin?: Effect[];
  canFlee?: boolean;
  finale?: boolean;
}

export type Effect =
  | { type: 'flag'; key: string; value?: number }
  | { type: 'unflag'; key: string }
  | { type: 'item'; id: ItemId; qty?: number }
  | { type: 'scrap'; qty: number }
  | { type: 'weapon'; id: WeaponId }
  | { type: 'module'; id: ModuleId }
  | { type: 'memory'; id: MemoryId }
  | { type: 'log'; id: string }
  | { type: 'modChip' }
  | { type: 'xp'; qty: number }
  | { type: 'time'; minutes: number }
  | { type: 'heal'; kai?: number; bolt?: number }
  | { type: 'damage'; kai: number }
  | { type: 'sealBreach' }
  | { type: 'survivor'; id: string }
  | { type: 'boltJoin' }
  | { type: 'toast'; text: string }
  | ({ type: 'battle' } & EncounterSpec)
  | { type: 'travel'; deck: DeckId }
  | { type: 'ending'; id: EndingId }
  | { type: 'dialogue'; id: string }
  | { type: 'fight' }
  | { type: 'sfx'; id: SfxId };

/* ---------------- Dialogue ---------------- */

export interface DialogueChoice {
  text: string;
  next?: string;
  if?: Condition;
  /** When set, the choice is shown disabled with this hint instead of hidden when `if` fails. */
  lockedHint?: string;
  effects?: Effect[];
  end?: boolean;
}

export interface DialogueJump {
  if?: Condition;
  to: string;
}

export interface DialogueNode {
  speaker?: SpeakerId;
  name?: string;
  text?: string;
  next?: string;
  jump?: DialogueJump[];
  choices?: DialogueChoice[];
  effects?: Effect[];
  end?: boolean;
}

export interface DialogueTree {
  id: string;
  start: string;
  nodes: Record<string, DialogueNode>;
}

export interface DialogueCtx {
  self?: string;
  deck: DeckId;
}

/* ---------------- Maps ---------------- */

export type TileKind =
  | 'void'
  | 'wall'
  | 'floor'
  | 'grate'
  | 'carpet'
  | 'soil'
  | 'vent'
  | 'bloom'
  | 'window'
  | 'machine'
  | 'pod'
  | 'plant'
  | 'crate'
  | 'console'
  | 'water'
  | 'rubble'
  | 'pit'
  | 'pillar'
  | 'bed'
  | 'catwalk';

export type DoorLock =
  | { type: 'none' }
  | { type: 'maint' }
  | { type: 'security' }
  | { type: 'bloom' }
  | { type: 'keycard'; item: ItemId }
  | { type: 'flag'; flag: string; hint: string };

export type ObjectSprite =
  | 'terminal'
  | 'elevator'
  | 'medstation'
  | 'relay'
  | 'breach'
  | 'vendor'
  | 'survivor'
  | 'bolt_broken'
  | 'pod_mia'
  | 'escape_pod'
  | 'valve'
  | 'console'
  | 'seed'
  | 'heart'
  | 'sign'
  | 'locker'
  | 'hologram';

export type EntityDef =
  | { kind: 'spawn' }
  | { kind: 'dark' }
  | { kind: 'door'; id?: string; lock?: DoorLock }
  | {
      kind: 'enemy';
      id: string;
      enemies: EnemyId[];
      tier?: number;
      boss?: boolean;
      intro?: string;
      outro?: string;
      onWin?: Effect[];
      canFlee?: boolean;
      finale?: boolean;
    }
  | { kind: 'pickup'; id: string; give: Effect[]; hidden?: boolean; dialogue?: string }
  | {
      kind: 'object';
      id: string;
      sprite: ObjectSprite;
      dialogue: string;
      name?: string;
      showIf?: Condition;
      /** Survivor palette / variant key used by the renderer. */
      variant?: string;
    }
  | { kind: 'trigger'; id: string; dialogue: string; if?: Condition; repeat?: boolean };

export interface ObjectiveDef {
  until: Condition;
  text: string;
}

export interface DeckDef {
  id: DeckId;
  index: number;
  name: string;
  tagline: string;
  tier: number;
  map: string;
  legend: Record<string, EntityDef>;
  /** Hull breach / contaminated air drains HP until sealed. */
  leak?: string;
  /** Heat vents burn until this flag is set. */
  ventsOffFlag?: string;
  objectives: ObjectiveDef[];
  arrival?: string;
  theme: DeckTheme;
}

export interface DeckTheme {
  floor: string;
  floorAlt: string;
  wall: string;
  wallTop: string;
  accent: string;
  glow: string;
  bg: string;
}

export interface MapEntity {
  id: string;
  x: number;
  y: number;
  def: EntityDef;
}

export interface ParsedDeck {
  id: DeckId;
  def: DeckDef;
  width: number;
  height: number;
  tiles: TileKind[];
  entities: MapEntity[];
  byTile: Map<number, MapEntity[]>;
  spawn: Vec;
  dark: Uint8Array;
}

/* ---------------- Save data ---------------- */

export interface GameData {
  version: number;
  deck: DeckId;
  pos: Vec;
  facing: Dir;
  boltPos: Vec;
  level: number;
  xp: number;
  hp: number;
  weapon: WeaponId;
  weapons: WeaponId[];
  modChips: number;
  boltHp: number;
  modules: ModuleId[];
  memories: MemoryId[];
  inventory: Partial<Record<ItemId, number>>;
  scrap: number;
  minutesLeft: number;
  steps: number;
  flags: Record<string, number>;
  logs: string[];
  survivors: string[];
  kills: number;
  battles: number;
  startedAt: number;
  savedAt: number;
}

/* ---------------- Battle ---------------- */

export type StatusKind = 'poison' | 'freeze' | 'burn';

export interface EnemyMove {
  id: string;
  name: string;
  weight: number;
  power: number;
  target: 'one' | 'all' | 'self' | 'ally';
  hits?: number;
  charge?: string;
  status?: { kind: StatusKind; chance: number; turns: number; amount?: number };
  heal?: number;
  summon?: EnemyId;
  buff?: number;
  when?: 'belowHalf' | 'belowThird' | 'hasAllies' | 'fewAllies' | 'damaged';
  cooldown?: number;
  text: string;
}

export type EnemyTag = 'robot' | 'bloom' | 'organic';

export type EnemySprite =
  | 'crawler'
  | 'swarm'
  | 'infected'
  | 'secbot'
  | 'welder'
  | 'brute'
  | 'sentinel'
  | 'tendril'
  | 'warden'
  | 'vine'
  | 'titan'
  | 'matron'
  | 'wardog'
  | 'heart'
  | 'heart2';

export interface EnemyDef {
  id: EnemyId;
  name: string;
  boss?: boolean;
  hp: number;
  atk: number;
  def: number;
  evade?: number;
  weak: DamageType[];
  resist: DamageType[];
  tags: EnemyTag[];
  xp: number;
  scrap: [number, number];
  drops?: { item: ItemId; chance: number }[];
  moves: EnemyMove[];
  swift?: number;
  regen?: number;
  shielded?: boolean;
  next?: EnemyId;
  sprite: EnemySprite;
  scanText: string;
  hackImmune?: boolean;
  size?: number;
}

export interface KaiBattle {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  level: number;
  weapon: WeaponId;
  weapons: WeaponId[];
  modChips: number;
  shield: number;
  shieldTurns: number;
  poison: number;
  poisonDmg: number;
  burn: number;
  frozen: number;
  boost: number;
  brace: boolean;
}

export interface BoltBattle {
  active: boolean;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  ko: boolean;
  modules: ModuleId[];
  decoy: number;
  level: number;
}

export interface BattleEnemy {
  uid: number;
  id: EnemyId;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  tier: number;
  stun: number;
  hacked: number;
  blind: number;
  burn: number;
  poison: number;
  scanned: boolean;
  charging: string | null;
  atkBuff: number;
  shieldDown: number;
  cooldowns: Record<string, number>;
  dead: boolean;
  listening: number;
  fresh: boolean;
}

export type TargetRef = { side: 'enemy'; uid: number } | { side: 'kai' } | { side: 'bolt' };

export type FxKind = 'zap' | 'fire' | 'emp' | 'frost' | 'flash' | 'hack' | 'scan' | 'light' | 'slash' | 'shot' | 'heal';

export type BattleEvent =
  | { seq: number; kind: 'damage'; target: TargetRef; amount: number; crit?: boolean; weak?: boolean; resist?: boolean }
  | { seq: number; kind: 'heal'; target: TargetRef; amount: number }
  | { seq: number; kind: 'miss'; target: TargetRef }
  | { seq: number; kind: 'absorb'; target: TargetRef; amount: number }
  | { seq: number; kind: 'status'; target: TargetRef; text: string }
  | { seq: number; kind: 'death'; target: TargetRef }
  | { seq: number; kind: 'lunge'; source: TargetRef }
  | { seq: number; kind: 'fx'; fx: FxKind; target?: TargetRef }
  | { seq: number; kind: 'summon'; target: TargetRef };

export type LogTone = 'info' | 'good' | 'bad' | 'warn' | 'bolt';

export interface BattleLogLine {
  id: number;
  text: string;
  tone: LogTone;
}

export type BattlePhase = 'kai' | 'bolt' | 'enemy' | 'victory' | 'defeat' | 'fled' | 'communed';

export interface BattleRewards {
  xp: number;
  scrap: number;
  items: Partial<Record<ItemId, number>>;
}

export interface BattleState {
  phase: BattlePhase;
  round: number;
  rng: number;
  kai: KaiBattle;
  bolt: BoltBattle;
  enemies: BattleEnemy[];
  inventory: Partial<Record<ItemId, number>>;
  log: BattleLogLine[];
  events: BattleEvent[];
  seq: number;
  enemyCursor: number;
  canFlee: boolean;
  boss: boolean;
  finale: boolean;
  canCommune: boolean;
  commune: number;
  rewards: BattleRewards;
  nextUid: number;
  tier: number;
  kills: number;
}

export type BoltAbility =
  | 'stun'
  | 'scan'
  | 'shield'
  | 'hack'
  | 'flash'
  | 'decoy'
  | 'repair'
  | 'recharge'
  | 'speak';

export type BattleAction =
  | { type: 'KAI_ATTACK'; target: number }
  | { type: 'KAI_REPAIR' }
  | { type: 'KAI_ITEM'; item: ItemId; target?: number }
  | { type: 'KAI_SWAP'; weapon: WeaponId }
  | { type: 'KAI_FLEE' }
  | { type: 'KAI_BRACE' }
  | { type: 'BOLT'; ability: BoltAbility; target?: number }
  | { type: 'ENEMY_ACT' };

export interface Encounter extends EncounterSpec {
  id: string;
  tier: number;
  returnPos: Vec;
  outro?: string;
}

export interface BattleResult {
  outcome: 'victory' | 'defeat' | 'fled' | 'communed';
  kaiHp: number;
  boltHp: number;
  inventory: Partial<Record<ItemId, number>>;
  weapon: WeaponId;
  rounds: number;
  rewards: BattleRewards | null;
  kills: number;
}
