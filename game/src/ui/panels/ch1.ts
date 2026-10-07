/** Chapter 1's storybook panels (on the colony ship), by panel id. */
import { ch1Comet, ch1Grow, ch1Ship } from './art/ch1a';
import { ch1Heart, ch1Lux, ch1Wake } from './art/ch1b';
import type { PanelId } from './ids';

export const CH1_ART: Partial<Record<PanelId, () => string>> = {
  'ch1-ship': ch1Ship,
  'ch1-comet': ch1Comet,
  'ch1-grow': ch1Grow,
  'ch1-wake': ch1Wake,
  'ch1-lux': ch1Lux,
  'ch1-heart': ch1Heart,
};
