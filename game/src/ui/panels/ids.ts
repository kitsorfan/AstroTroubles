/**
 * The storybook illustrations shown during cutscenes: big cartoon pictures of the key moments of
 * the story, shown between (or over) the 3D shots while the narration or dialogue plays.
 */
export const PANEL_IDS = [
  // Chapter 1: the ship.
  'ch1-ship',
  'ch1-comet',
  'ch1-grow',
  'ch1-wake',
  'ch1-lux',
  'ch1-heart',
  'ch1-saved',
  'ch1-friends',
  // Chapter 2: Gaia Nova.
  'ch2-arrival',
  'ch2-broadcast',
  'ch2-drones',
  // LUX is taken, Jason meets IRIS, and LUX comes home.
  'ch2-luxtaken',
  'ch2-iris',
  'ch2-luxback',
  // Forty years ago: the first expedition.
  'past-expedition',
  'past-order',
  'past-mutiny',
  'past-launch',
  'ch2-colossus',
  'ch2-grandma',
  'ch2-freed',
  'ch2-redeemed',
  // Chapter 3: the Argonauts.
  'ch3-fading',
  'ch3-argo',
  'ch3-aeetes',
  // The Harpy Isles: Atalanta, and old Phineus's stolen dinner.
  'ch3-atalanta',
  'ch3-phineus',
  // General Brennus's own level: on the way to Aeëtes's mine, and the golden map.
  'ch3-brennus',
  'ch3-map',
  // The Sirens' Sea: LUX's counter-song, and the Dolphin surfacing at the coral strait.
  'ch3-sirens',
  'ch3-surface',
  // Scylla's Reef: Scylla on her rock above Charybdis, and the Argo sailing through the calm strait.
  'ch3-scylla',
  'ch3-strait',
  // Talos's Forge: the sleeping bronze mech, and Talos sitting down, free.
  'ch3-mech',
  'ch3-talos',
  // Medusa's Labyrinth: the Mirror Shield in the Gardeners' shrine, and MEDUSA asleep by the open gate.
  'ch3-mirror',
  'ch3-medusa',
  // Brennus's Last Stand: the old general on the sky-dock as the gold fleet comes, and his salute to the Argo.
  'ch3-stand',
  'ch3-salute',
  // The Garden of Colchis: arriving in the Gardeners' garden, and the dragon sung to sleep.
  'ch3-garden',
  'ch3-dragon',
  // The Golden Fleece: Brennus and his squad join the Argonauts, Aeëtes in the Fleece armour, and the
  // game's final endings (the Fleece over Celestia; the secret one: a valley of little Celestias).
  'ch3-squad',
  'ch3-goldenking',
  'ch3-home',
  'ch3-gardeners',
] as const;

export type PanelId = (typeof PANEL_IDS)[number];

/** Every illustration is drawn on this canvas (16:9). */
export const PANEL_W = 1600;
export const PANEL_H = 900;
