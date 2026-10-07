/** Chapter 2's storybook panels (Gaia Nova and the flashbacks), by panel id. */
import { ch2Arrival, ch2Broadcast, ch2Drones } from './art/ch2a';
import { pastExpedition, pastOrder } from './art/ch2b';
import { pastLaunch, pastMutiny } from './art/ch2c';
import type { PanelId } from './ids';

export const CH2_ART: Partial<Record<PanelId, () => string>> = {
  'ch2-arrival': ch2Arrival,
  'ch2-broadcast': ch2Broadcast,
  'ch2-drones': ch2Drones,
  'past-expedition': pastExpedition,
  'past-order': pastOrder,
  'past-mutiny': pastMutiny,
  'past-launch': pastLaunch,
};
