/** Chapter 3's storybook panels (the Argonauts' voyage), by panel id. */
import { ch3Aeetes, ch3Argo, ch3Fading } from './art/ch3a';
import { ch3Atalanta, ch3Phineus } from './art/ch3b';
import { ch3Brennus, ch3Map } from './art/ch3c';
import { ch3Dragon, ch3Garden } from './art/ch3-garden';
import type { PanelId } from './ids';

export const CH3_ART: Partial<Record<PanelId, () => string>> = {
  'ch3-fading': ch3Fading,
  'ch3-argo': ch3Argo,
  'ch3-aeetes': ch3Aeetes,
  'ch3-atalanta': ch3Atalanta,
  'ch3-phineus': ch3Phineus,
  'ch3-brennus': ch3Brennus,
  'ch3-map': ch3Map,
  'ch3-garden': ch3Garden,
  'ch3-dragon': ch3Dragon,
};
