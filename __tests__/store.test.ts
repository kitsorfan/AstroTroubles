jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('../src/game/audio/sound', () => ({
  playSfx: jest.fn(),
  playMusic: jest.fn(),
  pauseMusic: jest.fn(),
  haptic: jest.fn(),
  configureAudio: jest.fn(),
}));

import { getDeck } from '../src/game/data/decks';
import { visibleChoices } from '../src/game/engine/dialogue';
import { useGame } from '../src/game/store/gameStore';
import { readSave } from '../src/game/store/saves';

const S = () => useGame.getState();

function clearModals(pickChoice: (texts: string[]) => number = () => 0) {
  for (let i = 0; i < 200; i++) {
    const s = S();
    if (s.transition) {
      s.dismissTransition();
      continue;
    }
    if (s.readingLog) {
      s.closeLog();
      continue;
    }
    if (!s.dialogue) return;
    const choices = visibleChoices(s.dialogue, s.data).filter((c) => c.enabled);
    if (choices.length) s.choose(choices[pickChoice(choices.map((c) => c.choice.text))].index);
    else s.advance();
  }
  throw new Error('dialogue never closed');
}

function walkTo(x: number, y: number) {
  S().walkTo(x, y);
  for (let i = 0; i < 300 && S().path.length; i++) S().stepPath();
}

/** Walks toward a tile, clearing story interruptions (triggers) on the way, until the expected dialogue opens. */
function reach(x: number, y: number, dialogueId: string) {
  for (let attempt = 0; attempt < 10; attempt++) {
    walkTo(x, y);
    if (S().dialogue?.tree.id === dialogueId) return;
    clearModals();
  }
  throw new Error(`never reached ${dialogueId}`);
}

function entityPos(id: string) {
  const e = getDeck(S().data.deck).entities.find((x) => x.id === id);
  if (!e) throw new Error(`no entity ${id}`);
  return e;
}

describe('game store: the opening of the game', () => {
  test('intro, BOLT, maintenance door, first battle, and saving', async () => {
    S().newGame();
    expect(S().screen).toBe('intro');
    S().beginGame();
    expect(S().screen).toBe('explore');
    expect(S().dialogue?.tree.id).toBe('cryo_intro');
    clearModals();

    const startMinutes = S().data.minutesLeft;
    const bolt = entityPos('cryo.bolt_broken');
    reach(bolt.x, bolt.y, 'cryo_bolt');
    expect(S().data.minutesLeft).toBeLessThan(startMinutes);
    clearModals();
    expect(S().data.flags.bolt_joined).toBe(1);
    expect(S().data.modules).toEqual(expect.arrayContaining(['stun', 'scan']));
    expect(S().data.memories).toContain('mem1');

    const maint = entityPos('cryo.door@4,11');
    reach(maint.x, maint.y, `door:${maint.id}`);
    const before = S().data.minutesLeft;
    clearModals((texts) => texts.findIndex((t) => t.startsWith('Hack')));
    expect(S().data.flags[`open:${maint.id}`]).toBe(1);
    expect(before - S().data.minutesLeft).toBe(10);

    const crawler = entityPos('cryo.tunnel_crawler');
    walkTo(crawler.x, crawler.y);
    clearModals();
    if (S().screen !== 'battle') walkTo(crawler.x, crawler.y);
    expect(S().screen).toBe('battle');
    expect(S().encounter?.id).toBe('cryo.tunnel_crawler');

    const xpBefore = S().data.xp;
    S().finishBattle({
      outcome: 'victory',
      kaiHp: 30,
      boltHp: 20,
      inventory: S().data.inventory,
      weapon: 'wrench',
      rounds: 2,
      rewards: { xp: 8, scrap: 3, items: {} },
      kills: 1,
    });
    expect(S().screen).toBe('explore');
    expect(S().data.flags['defeated:cryo.tunnel_crawler']).toBe(1);
    expect(S().data.xp).toBe(xpBefore + 8);
    expect(S().data.hp).toBe(30);

    await S().saveSlot('1');
    const saved = await readSave('1');
    expect(saved?.flags.bolt_joined).toBe(1);
    expect(saved?.pos).toEqual(S().data.pos);

    const snapshot = S().data;
    S().toTitle();
    expect(S().screen).toBe('title');
    expect(await S().loadSlot('1')).toBe(true);
    expect(S().screen).toBe('explore');
    expect(S().data.flags).toEqual(snapshot.flags);
  });

  test('losing a battle offers a retry with at least half HP', () => {
    S().newGame();
    S().beginGame();
    clearModals();
    S().loadGame({ ...S().data, hp: 5 });
    const crawler = entityPos('cryo.hall_crawlers');
    useGame.setState({ data: { ...S().data, flags: { ...S().data.flags, bolt_joined: 1 } } });
    S().loadGame({ ...S().data });
    // Start the encounter directly: walking there needs doors and fights.
    useGame.setState({
      encounter: { id: crawler.id, enemies: ['crawler', 'crawler'], tier: 1, returnPos: S().data.pos },
      preBattle: S().data,
      screen: 'battle',
    });
    S().finishBattle({ outcome: 'defeat', kaiHp: 0, boltHp: 0, inventory: {}, weapon: 'wrench', rounds: 3, rewards: null, kills: 0 });
    expect(S().screen).toBe('gameover');
    expect(S().gameOver).toBe('defeat');
    S().retryBattle();
    expect(S().screen).toBe('battle');
    expect(S().data.hp).toBeGreaterThanOrEqual(20);
  });

  test('running out of reactor time ends the game', () => {
    S().newGame();
    S().beginGame();
    clearModals();
    S().loadGame({ ...S().data, minutesLeft: 1 });
    const dirs = ['left', 'right', 'up', 'down'] as const;
    for (const d of dirs) {
      if (S().screen !== 'explore') break;
      S().move(d);
    }
    expect(S().screen).toBe('gameover');
    expect(S().gameOver).toBe('reactor');
  });
});
