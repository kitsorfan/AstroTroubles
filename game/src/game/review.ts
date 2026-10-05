import type { SaveData } from '../core/save';

/** Decks whose finish is a good moment to ask for a store review: once Jason has seen enough of the game to judge it. */
export const REVIEW_DECKS = [2, 4, 6];

/**
 * True the first time the player finishes one of the review decks, and marks it so that deck never asks again
 * (replays from the Elevator, or the second ending, stay quiet). Google Play also limits how often its review card
 * may appear, so a later ask can show nothing at all.
 */
export function takeReviewAsk(save: SaveData, deckIndex: number): boolean {
  if (!REVIEW_DECKS.includes(deckIndex)) return false;
  const asked = (save.reviewAsks ??= []);
  if (asked.includes(deckIndex)) return false;
  asked.push(deckIndex);
  return true;
}
