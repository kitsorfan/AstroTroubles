/** Chapter 2's storybook panels (Gaia Nova and the flashbacks), by panel id. */
import { ch2Arrival, ch2Broadcast, ch2Drones } from './art/ch2a';
import { pastExpedition, pastOrder } from './art/ch2b';
import { pastLaunch, pastMutiny } from './art/ch2c';
import { ch2Colossus, ch2Grandma } from './art/ch2d';
import { ch2Freed, ch2Redeemed } from './art/ch2e';
import type { PanelId } from './ids';

export const CH2_ART: Partial<Record<PanelId, () => string>> = {
  'ch2-arrival': ch2Arrival,
  'ch2-broadcast': ch2Broadcast,
  'ch2-drones': ch2Drones,
  'past-expedition': pastExpedition,
  'past-order': pastOrder,
  'past-mutiny': pastMutiny,
  'past-launch': pastLaunch,
  'ch2-colossus': ch2Colossus,
  'ch2-grandma': ch2Grandma,
  'ch2-freed': ch2Freed,
  'ch2-redeemed': ch2Redeemed,
};
