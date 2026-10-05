import { newSave } from '../game/src/core/save';
import { REVIEW_DECKS, takeReviewAsk } from '../game/src/game/review';
import { LEVELS, LEVEL_ORDER } from '../game/src/levels';

// newSave() reads navigator for its quality default; give Jest a stand-in.
beforeAll(() => {
  (globalThis as { navigator?: unknown }).navigator ??= { hardwareConcurrency: 8 };
});

describe('store review prompt', () => {
  it('asks after decks 2, 4 and 6, and after no other deck', () => {
    const save = newSave();
    const asked = LEVEL_ORDER.filter((id) => takeReviewAsk(save, LEVELS[id].index)).map((id) => LEVELS[id].index);
    expect(asked).toEqual([2, 4, 6]);
    expect(REVIEW_DECKS).toEqual([2, 4, 6]);
  });

  it('asks only once per deck, so replays and the second ending stay quiet', () => {
    const save = newSave();
    expect(takeReviewAsk(save, 2)).toBe(true);
    expect(takeReviewAsk(save, 2)).toBe(false);
    expect(takeReviewAsk(save, 6)).toBe(true);
    expect(takeReviewAsk(save, 6)).toBe(false);
    expect(save.reviewAsks).toEqual([2, 6]);
  });

  it('still asks at the next milestone for saves made before the prompt existed', () => {
    const save = newSave();
    save.completed = ['cryo', 'hydro', 'engine'];
    delete save.reviewAsks;
    expect(takeReviewAsk(save, 4)).toBe(true);
  });
});
