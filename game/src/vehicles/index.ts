import type { World } from '../game/world';
import type { VehicleKind } from '../world/levelTypes';
import { ArgoFlight } from './argo';
import { SubDive } from './sub/sub';
import type { Vehicle } from './vehicle';

export type { Vehicle, VehicleHud } from './vehicle';

/**
 * Builds the vehicle a level asks for: the Argo (The Clashing Rocks) and the little sub Dolphin (the
 * Sirens' Sea). The mech suit (Talos's Forge) will plug in here.
 */
export function makeVehicle(kind: VehicleKind, world: World): Vehicle {
  switch (kind) {
    case 'argo':
      return new ArgoFlight(world);
    case 'sub':
      return new SubDive(world);
    default:
      throw new Error(`The ${kind} vehicle isn't built yet`);
  }
}
