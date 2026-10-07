import type { World } from '../game/world';
import type { VehicleKind } from '../world/levelTypes';
import { ArgoFlight } from './argo';
import type { Vehicle } from './vehicle';

export type { Vehicle, VehicleHud } from './vehicle';

/**
 * Builds the vehicle a level asks for. Only the Argo flies so far; the submarine (Sirens' Sea) and the
 * mech suit (Talos's Forge) will plug in here.
 */
export function makeVehicle(kind: VehicleKind, world: World): Vehicle {
  switch (kind) {
    case 'argo':
      return new ArgoFlight(world);
    default:
      throw new Error(`The ${kind} vehicle isn't built yet`);
  }
}
