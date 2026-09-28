import type { DeckId, LevelDef } from '../world/levelTypes';
import { bridge } from './bridge';
import { cryo } from './cryo';
import { engine } from './engine';
import { habitat } from './habitat';
import { hydro } from './hydro';
import { security } from './security';

export const LEVEL_ORDER: DeckId[] = ['cryo', 'hydro', 'engine', 'habitat', 'security', 'bridge'];

export const LEVELS: Record<DeckId, LevelDef> = { cryo, hydro, engine, habitat, security, bridge };
