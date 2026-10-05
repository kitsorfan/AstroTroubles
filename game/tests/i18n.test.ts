import { checkGreek } from '../tools/i18n';

describe('Greek translation', () => {
  const r = checkGreek();

  it('translates every string the player can see', () => {
    expect(r.missing).toEqual([]);
  });

  it('keeps every {placeholder} of the English', () => {
    expect(r.badVars).toEqual([]);
  });

  it('has no leftover entries for text the game no longer shows', () => {
    expect(r.unused).toEqual([]);
  });
});
