import { parseDeck } from '../../engine/mapParser';
import type { DeckDef, DeckId, ParsedDeck } from '../../types';
import { bridge } from './bridge';
import { cryo } from './cryo';
import { engine } from './engine';
import { habitat } from './habitat';
import { hydro } from './hydro';
import { security } from './security';

export const DECK_DEFS: Record<DeckId, DeckDef> = { cryo, hydro, engine, habitat, security, bridge };

const cache: Partial<Record<DeckId, ParsedDeck>> = {};

export function getDeck(id: DeckId): ParsedDeck {
  let deck = cache[id];
  if (!deck) {
    deck = parseDeck(DECK_DEFS[id]);
    cache[id] = deck;
  }
  return deck;
}
