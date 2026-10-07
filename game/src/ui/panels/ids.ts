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
] as const;

export type PanelId = (typeof PANEL_IDS)[number];

/** Every illustration is drawn on this canvas (16:9). */
export const PANEL_W = 1600;
export const PANEL_H = 900;
