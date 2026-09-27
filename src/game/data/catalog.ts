import type { BoltAbility, DamageType, ItemId, ModuleId, WeaponId } from '../types';

export interface ItemDef {
  id: ItemId;
  name: string;
  desc: string;
  icon: string;
  battle: boolean;
  field: boolean;
  target?: 'enemy' | 'all' | 'self';
  price?: number;
  key?: boolean;
}

export const ITEMS: Record<ItemId, ItemDef> = {
  repair_kit: {
    id: 'repair_kit',
    name: 'Repair Kit',
    desc: "Suit sealant and med-gel. Restores 45% of Kai's HP.",
    icon: 'medical-bag',
    battle: true,
    field: true,
    target: 'self',
    price: 18,
  },
  spares: {
    id: 'spares',
    name: 'Spare Parts',
    desc: 'Servo fluid and patch plates. Repairs 60% of BOLT\'s HP and reboots it if offline.',
    icon: 'cog-transfer',
    battle: true,
    field: true,
    target: 'self',
    price: 15,
  },
  battery: {
    id: 'battery',
    name: 'Power Cell',
    desc: "Restores 3 of BOLT's energy in battle.",
    icon: 'battery-charging-high',
    battle: true,
    field: false,
    target: 'self',
    price: 12,
  },
  stim: {
    id: 'stim',
    name: 'Adrenal Stim',
    desc: 'Kai deals +50% damage for 3 turns.',
    icon: 'needle',
    battle: true,
    field: false,
    target: 'self',
    price: 20,
  },
  emp_grenade: {
    id: 'emp_grenade',
    name: 'EMP Grenade',
    desc: 'EMP burst that hits every enemy. Robots may short-circuit.',
    icon: 'flash-circle',
    battle: true,
    field: false,
    target: 'all',
    price: 25,
  },
  incendiary: {
    id: 'incendiary',
    name: 'Incendiary Charge',
    desc: 'Fire burst that hits every enemy and sets them burning.',
    icon: 'fire',
    battle: true,
    field: false,
    target: 'all',
    price: 25,
  },
  coolant: {
    id: 'coolant',
    name: 'Coolant Canister',
    desc: 'Cryogenic spray. Heavy cryo damage to one enemy and cancels a charging attack.',
    icon: 'snowflake',
    battle: true,
    field: false,
    target: 'enemy',
    price: 22,
  },
  serum: {
    id: 'serum',
    name: 'Anti-Spore Serum',
    desc: 'Cures poison. Can halt Bloom infection in a survivor.',
    icon: 'flask',
    battle: true,
    field: true,
    target: 'self',
    price: 30,
  },
  keycard_captain: {
    id: 'keycard_captain',
    name: "Captain's Keycard",
    desc: "Captain Voss's personal keycard. Opens her quarters.",
    icon: 'card-account-details-star',
    battle: false,
    field: false,
    key: true,
  },
  keycard_armory: {
    id: 'keycard_armory',
    name: 'Armory Keycard',
    desc: 'Red-striped security card. Opens the Security Deck armory.',
    icon: 'card-bulleted',
    battle: false,
    field: false,
    key: true,
  },
  keycard_dray: {
    id: 'keycard_dray',
    name: "Chief Dray's Keycard",
    desc: "Security Chief Marcus Dray's command card.",
    icon: 'card-account-details',
    battle: false,
    field: false,
    key: true,
  },
  sticker: {
    id: 'sticker',
    name: "Juno's Star Sticker",
    desc: 'Glittery and slightly sticky. BOLT insists on wearing it.',
    icon: 'star-face',
    battle: false,
    field: false,
    key: true,
  },
};

export interface WeaponDef {
  id: WeaponId;
  name: string;
  dtype: DamageType;
  power: number;
  crit: number;
  desc: string;
  icon: string;
  verb: string;
}

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  wrench: {
    id: 'wrench',
    name: "Engineer's Wrench",
    dtype: 'blunt',
    power: 5,
    crit: 0.08,
    desc: 'Heavy, reliable, and already covered in something green.',
    icon: 'wrench',
    verb: 'swings the wrench at',
  },
  cutter: {
    id: 'cutter',
    name: 'Plasma Cutter',
    dtype: 'thermal',
    power: 11,
    crit: 0.08,
    desc: 'Industrial cutting torch. Thermal damage. Burns through Bloom growth.',
    icon: 'torch',
    verb: 'sears',
  },
  rifle: {
    id: 'rifle',
    name: 'Pulse Rifle',
    dtype: 'kinetic',
    power: 19,
    crit: 0.15,
    desc: 'Security-issue pulse rifle. Kinetic damage, high critical rate.',
    icon: 'pistol',
    verb: 'fires a pulse burst at',
  },
};

export const MOD_CHIP_POWER = 2;

export interface ModuleDef {
  id: ModuleId;
  name: string;
  desc: string;
  icon: string;
  ability?: BoltAbility;
}

export const MODULES: Record<ModuleId, ModuleDef> = {
  stun: { id: 'stun', name: 'Stun Coil', desc: 'Zap: EMP damage with a chance to stun.', icon: 'lightning-bolt', ability: 'stun' },
  scan: {
    id: 'scan',
    name: 'Scanner Lens',
    desc: 'Scan: reveals weaknesses and HP. Scanned enemies take more critical hits. Also finds hidden items in the field.',
    icon: 'radar',
    ability: 'scan',
  },
  shield: { id: 'shield', name: 'Shield Emitter', desc: 'Shield: projects a barrier that absorbs damage for Kai.', icon: 'shield-half-full', ability: 'shield' },
  hack: {
    id: 'hack',
    name: 'Intrusion Suite',
    desc: 'Hack: turns robots against their allies. Cracks red security doors.',
    icon: 'console-network',
    ability: 'hack',
  },
  capacitor: { id: 'capacitor', name: 'Deep Capacitor', desc: '+2 maximum energy for BOLT.', icon: 'battery-plus' },
  floodlight: {
    id: 'floodlight',
    name: 'Floodlight Array',
    desc: 'Flash: blinds all enemies. BOLT lights a much wider area in the dark.',
    icon: 'flashlight',
    ability: 'flash',
  },
  plating: { id: 'plating', name: 'Reinforced Plating', desc: '+25 maximum HP for BOLT.', icon: 'shield-plus' },
  decoy: {
    id: 'decoy',
    name: 'Holo-Decoy Projector',
    desc: 'Decoy: a dazzling hologram draws every enemy attack to BOLT for 2 turns.',
    icon: 'account-multiple',
    ability: 'decoy',
  },
  nanites: { id: 'nanites', name: 'Repair Nanites', desc: "Repair Beam: restores 35% of Kai's HP.", icon: 'hospital-box', ability: 'repair' },
  overcharge: { id: 'overcharge', name: 'Overcharged Coil', desc: 'Zap deals 80% more damage and stuns more often.', icon: 'flash-alert' },
};

export interface AbilityDef {
  id: BoltAbility;
  name: string;
  cost: number;
  module?: ModuleId;
  target: 'enemy' | 'none';
  desc: string;
  icon: string;
}

export const BOLT_ABILITIES: Record<BoltAbility, AbilityDef> = {
  stun: { id: 'stun', name: 'Zap', cost: 1, module: 'stun', target: 'enemy', desc: 'EMP bolt. May stun.', icon: 'lightning-bolt' },
  scan: { id: 'scan', name: 'Scan', cost: 1, module: 'scan', target: 'enemy', desc: 'Reveal weakness.', icon: 'radar' },
  shield: { id: 'shield', name: 'Shield', cost: 2, module: 'shield', target: 'none', desc: 'Barrier on Kai.', icon: 'shield-half-full' },
  hack: { id: 'hack', name: 'Hack', cost: 3, module: 'hack', target: 'enemy', desc: 'Turn a robot.', icon: 'console-network' },
  flash: { id: 'flash', name: 'Flash', cost: 2, module: 'floodlight', target: 'none', desc: 'Blind all foes.', icon: 'flashlight' },
  decoy: { id: 'decoy', name: 'Decoy', cost: 2, module: 'decoy', target: 'none', desc: 'Draw all attacks.', icon: 'account-multiple' },
  repair: { id: 'repair', name: 'Repair', cost: 3, module: 'nanites', target: 'none', desc: 'Heal Kai 35%.', icon: 'hospital-box' },
  recharge: { id: 'recharge', name: 'Recharge', cost: 0, target: 'none', desc: '+2 energy.', icon: 'battery-charging' },
  speak: { id: 'speak', name: 'Speak', cost: 0, target: 'none', desc: 'Pulse the light-language.', icon: 'lightbulb-on' },
};

export const BOLT_ABILITY_ORDER: BoltAbility[] = ['stun', 'scan', 'shield', 'hack', 'flash', 'decoy', 'repair', 'recharge'];

export const DAMAGE_LABEL: Record<DamageType, string> = {
  blunt: 'Blunt',
  thermal: 'Thermal',
  kinetic: 'Kinetic',
  emp: 'EMP',
  cryo: 'Cryo',
};
