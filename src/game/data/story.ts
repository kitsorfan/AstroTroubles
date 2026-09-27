import type { DeckId, MemoryId } from '../types';

export interface MemoryDef {
  id: MemoryId;
  index: number;
  title: string;
  deck: DeckId;
  dialogue: string;
  summary: string;
}

export const MEMORIES: Record<MemoryId, MemoryDef> = {
  mem1: {
    id: 'mem1',
    index: 1,
    title: 'Warm Case',
    deck: 'cryo',
    dialogue: 'mem1',
    summary: 'Carrying a warm, pulsing case down a corridor for Captain Voss.',
  },
  mem2: {
    id: 'mem2',
    index: 2,
    title: 'The Signal',
    deck: 'hydro',
    dialogue: 'mem2',
    summary: 'The Seed was found drifting, blinking in prime numbers. The Captain ordered it brought aboard.',
  },
  mem3: {
    id: 'mem3',
    index: 3,
    title: 'First Contact',
    deck: 'engine',
    dialogue: 'mem3',
    summary: 'BOLT blinked its work light at the Seed, and the Seed blinked back: "Hello."',
  },
  mem4: {
    id: 'mem4',
    index: 4,
    title: 'Refugee',
    deck: 'habitat',
    dialogue: 'mem4',
    summary: 'Captain Voss called the Bloom a refugee. Chief Dray called it an invasion.',
  },
  mem5: {
    id: 'mem5',
    index: 5,
    title: 'The Purge',
    deck: 'security',
    dialogue: 'mem5',
    summary: 'Dray burned the lab. BOLT shielded the Seed. Then darkness.',
  },
  mem6: {
    id: 'mem6',
    index: 6,
    title: 'The Language',
    deck: 'bridge',
    dialogue: 'mem6',
    summary: 'Light is how it speaks. Blue, blue, gold: hello. White, blue: safe. Gold, gold, gold: together.',
  },
};

export const MEMORY_ORDER: MemoryId[] = ['mem1', 'mem2', 'mem3', 'mem4', 'mem5', 'mem6'];

export interface LogDef {
  id: string;
  deck: DeckId;
  title: string;
  author: string;
  body: string;
}

const LOG_LIST: LogDef[] = [
  {
    id: 'log_cryo_1',
    deck: 'cryo',
    title: 'Revival Protocol',
    author: 'HALCYON (ship intelligence)',
    body:
      'AUTOMATED NOTICE. Reactor containment degrading. Estimated failure in 72 hours. Crew revival protocol initiated. Qualified engineering candidates found: 1. REYES, KAI (Junior Engineer, Grade 2). WARNING: revival will be unsupervised. Medical staff unavailable. Command staff unavailable. Everyone is unavailable.',
  },
  {
    id: 'log_cryo_2',
    deck: 'cryo',
    title: 'Tech Log: Warden Unit',
    author: 'Cryo Technician Anika Solberg',
    body:
      "The Warden has been acting up since the lab incident. It keeps 'maintaining' the Bloom growth like it's part of the pods, and it won't let anyone near the lift controls. If it gets aggressive, an EMP pulse scrambles its logic. Watch the coolant tanks: when they glow white, it's about to surge. Get behind something. Or someone.",
  },
  {
    id: 'log_cryo_3',
    deck: 'cryo',
    title: 'Pre-launch Message',
    author: 'Mia Reyes',
    body:
      "Kai, if you're hearing this, something went wrong and you woke up before me. Typical. Don't be a hero, okay? ...Okay, be a little bit of a hero. But only a little. I'll see you on the other side, under a real sky. Love you, dork. -Mia",
  },
  {
    id: 'log_hydro_1',
    deck: 'hydro',
    title: 'Botany Journal',
    author: 'Dr. Priya Nair',
    body:
      "Day 12 of the growth. The Bloom doesn't compete with our crops. It weaves between them. The tomatoes are thriving, the soil pH has stabilized, and the blight in bed six is simply gone. It's almost as if it's gardening. I've asked to present this to the Captain. Chief Dray has asked me to stop 'fraternizing with the weeds.'",
  },
  {
    id: 'log_hydro_2',
    deck: 'hydro',
    title: 'Maintenance Memo',
    author: 'Grounds Crew',
    body:
      "Plasma cutter is in the tool shed by the east beds. Whoever keeps borrowing it: bring it back. Also, if you see the big vine thing by the pump station, DON'T try to prune it. It grows back faster than you can cut. Fire is the only thing that stops the regrowth.",
  },
  {
    id: 'log_hydro_3',
    deck: 'hydro',
    title: 'Seed Vault Order',
    author: 'Tech Hale',
    body:
      "Seed vault sealed with a security lock by order of Chief Dray. Nobody in, nobody out. Not even me, and I'm the one who waters the samples. Something from the lab is stored in there. Dray didn't want it burned with the rest. Funny, that.",
  },
  {
    id: 'log_engine_1',
    deck: 'engine',
    title: "Chief Engineer's Log",
    author: 'Chief Engineer Ruth Adeyemi',
    body:
      "Something has fused with the reactor slag in the core chamber. It feeds on heat. The hotter the core runs, the bigger it gets. Coolant canisters are stacked in the east bays. Cryo cracks its crust. Don't bother with torches. You'll only feed it.",
  },
  {
    id: 'log_engine_2',
    deck: 'engine',
    title: 'Safety Notice',
    author: 'Engineering Safety Office',
    body:
      'HEAT VENTS ACTIVE. Coolant loop offline. Vents will stay hot until the coolant control valve in the core chamber is restored. Until then, walk around them, not over them. Your boots are not rated for this. Neither are your feet.',
  },
  {
    id: 'log_engine_3',
    deck: 'engine',
    title: 'Scratched Note',
    author: 'Tech Sergeant Omar Haddad',
    body:
      "Leg's broken. Sealed myself in the pump room off the west tunnels. Rations for maybe two days. If anyone's out there, I'm the one banging on the pipes. Please. I have a daughter in cryo. She doesn't know any of this happened.",
  },
  {
    id: 'log_habitat_1',
    deck: 'habitat',
    title: 'Ring Announcement',
    author: 'Habitation Authority',
    body:
      'Attention residents: shelter in place. Security teams will escort you to the safe zone. Do not approach infected individuals. Report all Bloom growth. Remember: the infected are still our neighbors. Treatment is being developed. Please remain calm. Please remain calm. Please remain calm.',
  },
  {
    id: 'log_habitat_2',
    deck: 'habitat',
    title: "Juno's Diary",
    author: 'Juno Park, age 11',
    body:
      "The glowing lady in the park waves at me with lights. Mom says don't look at it. But I waved back with my flashlight and she waved AGAIN, faster! Blue blue yellow. I think that means hi. Mom says it doesn't mean anything. Mom hasn't come back from the store.",
  },
  {
    id: 'log_habitat_3',
    deck: 'habitat',
    title: "Captain's Memo",
    author: 'Captain Elena Voss',
    body:
      "Concierge: I've left a spare keycard at the front desk in case my door lock jams again. It opens my quarters here and on the bridge. Please keep it away from Chief Dray's people. -E.V.",
  },
  {
    id: 'log_security_1',
    deck: 'security',
    title: 'Standing Orders',
    author: 'Security Chief Marcus Dray',
    body:
      'All units: the Bloom organism is classified HOSTILE. Burn on sight. Crew who obstruct containment are to be confined in the brig. The Captain has been relieved of command for her own safety. The bridge is under lockdown until further notice. That is all.',
  },
  {
    id: 'log_security_2',
    deck: 'security',
    title: 'Armory Notice',
    author: 'Quartermaster',
    body:
      "Armory keycard issued to Officer Rin Tanaka. Pulse rifles and EMP ordnance inside. The WARDOG mech has been deployed at the command gate. Tech note: WARDOG's shield matrix can be disrupted by any competent intrusion suite. Please do not tell the Chief I wrote that down.",
  },
  {
    id: 'log_security_3',
    deck: 'security',
    title: 'Confession',
    author: 'Officer Rin Tanaka',
    body:
      "I locked the Captain out of her own bridge because Dray told me to. Then I stood at the lab door and watched him burn it. The colors it made... I still see them when I close my eyes. I'm sorry. I'm so sorry. If anyone reads this, it wasn't attacking us until we attacked it.",
  },
  {
    id: 'log_bridge_1',
    deck: 'bridge',
    title: 'Navigation Alert',
    author: 'HALCYON',
    body:
      'COURSE DEVIATION: 4.2 degrees. Helm unresponsive. Projected stellar intercept coincides with reactor failure. Manual correction required at the helm. HALCYON is sorry. HALCYON has been sorry for 97 days.',
  },
  {
    id: 'log_bridge_2',
    deck: 'bridge',
    title: 'Final Notes',
    author: 'Dr. Amara Okafor',
    body:
      "It isn't evil. It's frightened. The light near the core repeats three patterns over and over. I've matched two: 'hello' and 'safe?' It's asking if it's safe. Nobody has answered it. The drone might remember the rest. B-0LT-7 was there when it first spoke.",
  },
  {
    id: 'log_bridge_3',
    deck: 'bridge',
    title: 'Pod Bay Log',
    author: 'Captain Elena Voss',
    body:
      "Escape pods fueled and ready. I won't be using mine. A captain goes down with her ship, or she finds a way to save it. I'm going to try the second one. If I fail, whoever reads this: the pods are yours. No shame in living.",
  },
];

export const LOGS: Record<string, LogDef> = Object.fromEntries(LOG_LIST.map((l) => [l.id, l]));
export const LOG_ORDER: string[] = LOG_LIST.map((l) => l.id);

export const SURVIVORS: Record<string, { name: string; deck: DeckId; role: string }> = {
  nair: { name: 'Dr. Priya Nair', deck: 'hydro', role: 'Botanist' },
  haddad: { name: 'Sgt. Omar Haddad', deck: 'engine', role: 'Reactor Technician' },
  hollis: { name: 'Hollis Grant', deck: 'habitat', role: 'Retired Miner' },
  juno: { name: 'Juno Park', deck: 'habitat', role: 'Age 11' },
  tanaka: { name: 'Officer Rin Tanaka', deck: 'security', role: 'Security Officer' },
};
