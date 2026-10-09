/** Chapter 3 panels for Talos's Forge: the sleeping bronze mech, and Talos sitting down, free. */
import { backdrop, panel } from '../kit';

/** 25. In the old forge, Jason, Atalanta, LUX and IRIS find the Gardeners' bronze mech asleep. */
export function ch3Mech(): string {
  return panel(backdrop('ch3-mech-b', [[0, '#3a2418'], [1, '#8a4a20']]));
}

/** 26. Talos sits by the sea at sunset, his eye teal again, nodding to the little mech. */
export function ch3Talos(): string {
  return panel(backdrop('ch3-talos-b', [[0, '#2f6f9a'], [1, '#ffc88a']]));
}
