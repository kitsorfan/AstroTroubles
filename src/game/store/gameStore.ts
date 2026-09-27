import { create } from 'zustand';

import { configureAudio, haptic, playMusic, playSfx } from '../audio/sound';
import { DECK_ORDER, kaiMaxHp, kaiAtk } from '../constants';
import { getDeck } from '../data/decks';
import { MEMORIES } from '../data/story';
import {
  advanceDialogue,
  chooseOption,
  getTree,
  startDialogue,
  type DialogueState,
  type DialogueStep,
} from '../engine/dialogue';
import {
  applyBattleResult,
  ctxFor,
  newGameData,
  scanArea,
  travelTo,
  tryMove,
  applyFieldItem,
} from '../engine/explore';
import { findPath } from '../engine/pathfinding';
import { randomSeed } from '../engine/rng';
import { MODAL_EVENT_TYPES, type GameEvent, type GameOverReason, type ToastTone } from '../engine/rules';
import type { BattleResult, DialogueTree, Dir, Encounter, EndingId, GameData, ItemId, MemoryId, WeaponId } from '../types';
import { DEFAULT_SETTINGS, readSave, readSettings, writeSave, writeSettings, type Settings, type SlotId } from './saves';

export type Screen = 'title' | 'intro' | 'explore' | 'battle' | 'gameover' | 'ending';
export type Menu = 'pause' | 'inventory' | 'bolt' | 'logs' | 'map' | 'save' | 'load' | 'settings' | null;

export interface Toast {
  id: number;
  text: string;
  tone: ToastTone;
}

export interface Transition {
  title: string;
  subtitle: string;
  key: number;
}

interface State {
  screen: Screen;
  data: GameData;
  dialogue: DialogueState | null;
  readingLog: string | null;
  queue: GameEvent[];
  encounter: Encounter | null;
  battleSeed: number;
  battleKey: number;
  preBattle: GameData | null;
  checkpoint: GameData | null;
  menu: Menu;
  toasts: Toast[];
  scanPulse: number;
  hurtPulse: number;
  transition: Transition | null;
  ending: EndingId | null;
  gameOver: GameOverReason | null;
  path: Dir[];
  settings: Settings;
}

interface Actions {
  newGame: () => void;
  beginGame: () => void;
  loadGame: (data: GameData) => void;
  loadSlot: (slot: SlotId) => Promise<boolean>;
  saveSlot: (slot: SlotId) => Promise<void>;
  autosave: () => void;
  move: (dir: Dir) => boolean;
  walkTo: (x: number, y: number) => void;
  stepPath: () => void;
  clearPath: () => void;
  scan: () => void;
  advance: () => void;
  choose: (index: number) => void;
  closeLog: () => void;
  openLog: (id: string) => void;
  replayMemory: (id: MemoryId) => void;
  finishBattle: (result: BattleResult) => void;
  retryBattle: () => void;
  retryCheckpoint: () => void;
  setMenu: (menu: Menu) => void;
  consumeItem: (item: ItemId) => void;
  equip: (weapon: WeaponId) => void;
  dismissToast: (id: number) => void;
  dismissTransition: () => void;
  toTitle: () => void;
  setSettings: (patch: Partial<Settings>) => void;
  initSettings: () => Promise<void>;
}

export type GameStore = State & Actions;

let toastSeq = 0;
const MAX_TOASTS = 4;

export const useGame = create<GameStore>()((set, get) => {
  const isModal = (s: State = get()) => s.screen !== 'explore' || !!s.dialogue || !!s.readingLog || !!s.transition;

  const pushToast = (text: string, tone: ToastTone = 'info') => {
    toastSeq += 1;
    const toast = { id: toastSeq, text, tone };
    set((s) => ({ toasts: [...s.toasts, toast].slice(-MAX_TOASTS) }));
  };

  const applyStep = (step: DialogueStep) => {
    set({ data: step.data, dialogue: step.state });
    process(step.events);
    if (!step.state) flush();
  };

  const openDialogue = (tree: DialogueTree | undefined, self?: string) => {
    if (!tree) return;
    const data = get().data;
    applyStep(startDialogue(tree, data, ctxFor(data, self)));
  };

  const startBattle = (encounter: Encounter) => {
    const data = get().data;
    set({
      encounter,
      preBattle: data,
      battleSeed: randomSeed(),
      battleKey: get().battleKey + 1,
      screen: 'battle',
      path: [],
      menu: null,
    });
    playMusic(encounter.boss ? 'boss' : 'battle');
    playSfx('alarm');
    haptic('heavy');
  };

  const doTravel = (deck: GameData['deck']) => {
    const r = travelTo(get().data, deck);
    const def = getDeck(deck).def;
    set({
      data: r.data,
      path: [],
      transition: { title: def.name, subtitle: `DECK ${def.index} // ${def.tagline}`, key: Date.now() },
    });
    process(r.events);
    set({ checkpoint: get().data });
    void writeSave('auto', get().data).catch(() => {});
  };

  const handle = (ev: GameEvent) => {
    switch (ev.type) {
      case 'sfx':
        playSfx(ev.id);
        break;
      case 'toast':
        pushToast(ev.text, ev.tone);
        break;
      case 'levelup': {
        const lv = ev.level;
        pushToast(`LEVEL UP! Kai is level ${lv}. Max HP ${kaiMaxHp(lv)}, ATK ${kaiAtk(lv)}`, 'good');
        haptic('success');
        break;
      }
      case 'scanfx':
        set((s) => ({ scanPulse: s.scanPulse + 1 }));
        break;
      case 'dialogue':
        openDialogue(getTree(ev.id), ev.self);
        break;
      case 'inline':
        openDialogue(ev.tree, ev.self);
        break;
      case 'battle':
        startBattle(ev.encounter);
        break;
      case 'travel':
        doTravel(ev.deck);
        break;
      case 'ending':
        set({ screen: 'ending', ending: ev.id, dialogue: null, queue: [], path: [], menu: null });
        playMusic('title');
        void writeSave('auto', get().data).catch(() => {});
        break;
      case 'log':
        set({ readingLog: ev.id });
        break;
      case 'gameover':
        set({ screen: 'gameover', gameOver: ev.reason, dialogue: null, queue: [], path: [], menu: null, readingLog: null });
        playMusic(null);
        playSfx('defeat');
        break;
    }
  };

  function process(events: GameEvent[]) {
    for (const ev of events) {
      if (ev.type !== 'gameover' && MODAL_EVENT_TYPES.has(ev.type) && isModal()) {
        set((s) => ({ queue: [...s.queue, ev] }));
      } else {
        handle(ev);
      }
      if (get().screen === 'gameover') return;
    }
  }

  function flush() {
    while (!isModal() && get().queue.length) {
      const [ev, ...rest] = get().queue;
      set({ queue: rest });
      handle(ev);
    }
  }

  const beginExplore = () => {
    set({ screen: 'explore', menu: null });
    playMusic('explore');
  };

  return {
    screen: 'title',
    data: newGameData(),
    dialogue: null,
    readingLog: null,
    queue: [],
    encounter: null,
    battleSeed: 1,
    battleKey: 0,
    preBattle: null,
    checkpoint: null,
    menu: null,
    toasts: [],
    scanPulse: 0,
    hurtPulse: 0,
    transition: null,
    ending: null,
    gameOver: null,
    path: [],
    settings: DEFAULT_SETTINGS,

    newGame: () => {
      const data = newGameData();
      set({
        data,
        checkpoint: data,
        screen: 'intro',
        dialogue: null,
        readingLog: null,
        queue: [],
        encounter: null,
        toasts: [],
        ending: null,
        gameOver: null,
        path: [],
        transition: null,
        menu: null,
      });
      playMusic('title');
    },

    beginGame: () => {
      beginExplore();
      const arrival = getDeck(get().data.deck).def.arrival;
      if (arrival) openDialogue(getTree(arrival));
    },

    loadGame: (data) => {
      set({
        data,
        checkpoint: data,
        dialogue: null,
        readingLog: null,
        queue: [],
        encounter: null,
        toasts: [],
        ending: null,
        gameOver: null,
        path: [],
        transition: null,
      });
      beginExplore();
      pushToast(`Loaded: ${getDeck(data.deck).def.name}`, 'info');
    },

    loadSlot: async (slot) => {
      const data = await readSave(slot);
      if (!data) return false;
      get().loadGame(data);
      return true;
    },

    saveSlot: async (slot) => {
      await writeSave(slot, get().data);
      pushToast(slot === 'auto' ? 'Autosaved.' : `Saved to slot ${slot}.`, 'good');
      playSfx('pickup');
    },

    autosave: () => {
      const s = get();
      if (s.screen !== 'explore') return;
      void writeSave('auto', s.data).catch(() => {});
    },

    move: (dir) => {
      const s = get();
      if (s.screen !== 'explore' || isModal(s) || s.menu) return false;
      const hpBefore = s.data.hp;
      const r = tryMove(s.data, dir);
      set({ data: r.data });
      if (r.data.hp < hpBefore) set((st) => ({ hurtPulse: st.hurtPulse + 1 }));
      process(r.events);
      if (!r.moved || isModal()) set({ path: [] });
      return r.moved;
    },

    walkTo: (x, y) => {
      const s = get();
      if (s.screen !== 'explore' || isModal(s) || s.menu) return;
      const path = findPath(getDeck(s.data.deck), s.data, { x, y });
      if (!path?.length) {
        playSfx('bump');
        return;
      }
      set({ path });
      playSfx('select');
    },

    stepPath: () => {
      const [next, ...rest] = get().path;
      if (!next) return;
      set({ path: rest });
      get().move(next);
    },

    clearPath: () => set({ path: [] }),

    scan: () => {
      const s = get();
      if (s.screen !== 'explore' || isModal(s) || s.menu || !s.data.flags.bolt_joined) return;
      const r = scanArea(s.data);
      set({ data: r.data, path: [] });
      process(r.events);
    },

    advance: () => {
      const s = get();
      if (!s.dialogue) return;
      applyStep(advanceDialogue(s.dialogue, s.data));
    },

    choose: (index) => {
      const s = get();
      if (!s.dialogue) return;
      playSfx('select');
      applyStep(chooseOption(s.dialogue, s.data, index));
    },

    closeLog: () => {
      set({ readingLog: null });
      flush();
    },

    openLog: (id) => set({ readingLog: id }),

    replayMemory: (id) => {
      set({ menu: null });
      openDialogue(getTree(MEMORIES[id].dialogue));
    },

    finishBattle: (result) => {
      const s = get();
      const enc = s.encounter;
      if (!enc) return;
      if (result.outcome === 'defeat') {
        set({ screen: 'gameover', gameOver: 'defeat' });
        playMusic(null);
        playSfx('defeat');
        return;
      }
      const r = applyBattleResult(s.data, enc, result);
      set({ data: r.data, encounter: null, preBattle: null, screen: 'explore' });
      playMusic('explore');
      process(r.events);
      if (result.outcome === 'communed') process([{ type: 'dialogue', id: 'bridge_communion' }]);
      if (enc.boss && get().screen === 'explore') void writeSave('auto', get().data).catch(() => {});
      flush();
    },

    retryBattle: () => {
      const s = get();
      if (!s.preBattle || !s.encounter) return;
      const max = kaiMaxHp(s.preBattle.level);
      const data = { ...s.preBattle, hp: Math.max(s.preBattle.hp, Math.round(max * 0.5)) };
      set({ data, gameOver: null });
      startBattle(s.encounter);
    },

    retryCheckpoint: () => {
      const cp = get().checkpoint;
      if (!cp) return;
      get().loadGame(cp);
    },

    setMenu: (menu) => {
      const s = get();
      if (menu && (s.screen !== 'explore' || s.dialogue || s.readingLog)) return;
      set({ menu, path: [] });
      playSfx('select');
    },

    consumeItem: (item) => {
      const r = applyFieldItem(get().data, item);
      set({ data: r.data });
      process(r.events);
    },

    equip: (weapon) => {
      const d = get().data;
      if (!d.weapons.includes(weapon) || d.weapon === weapon) return;
      set({ data: { ...d, weapon } });
      playSfx('select');
    },

    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

    dismissTransition: () => {
      set({ transition: null });
      flush();
    },

    toTitle: () => {
      set({
        screen: 'title',
        dialogue: null,
        readingLog: null,
        queue: [],
        encounter: null,
        menu: null,
        path: [],
        transition: null,
        toasts: [],
      });
      playMusic('title');
    },

    setSettings: (patch) => {
      const settings = { ...get().settings, ...patch };
      set({ settings });
      configureAudio(settings);
      void writeSettings(settings).catch(() => {});
    },

    initSettings: async () => {
      const settings = await readSettings();
      set({ settings });
      configureAudio(settings);
    },
  };
});

export function deckProgress(d: GameData): number {
  return DECK_ORDER.indexOf(d.deck) + 1;
}
