import type { DeckId, HeroId, Speaker } from '../world/levelTypes';

/**
 * Who flies along with Jason, worked out from the region and the deck's flags alone (so old saves
 * need nothing new):
 *
 * - Chapter 1 from the Cryo Deck's storeroom on, and the first regions of Gaia Nova: LUX.
 * - Frostpeak Tundra (snow): LUX, until BOREAS falls. Then a trap snaps shut on him and Brennus's
 *   drone carries him off (the `boss` flag is set by then, so a resumed deck has no LUX either).
 * - Titan Rockies: nobody. Jason hacks with his wrist computer and lights the dark with his helmet lamp.
 * - Thornwood Jungle: nobody, until Jason switches IRIS on in the roots near the landing site (`iris`).
 * - Mount Atlantas: IRIS, while Brennus's reprogrammed LUX lies in wait. Once LUX is beaten and
 *   himself again (`luxback`), LUX leads and IRIS floats along a little further back.
 * - Chapter 3: both droids sail with the Argonauts (see `voyagePlan`).
 */
export type CompanionSkin = 'lux' | 'iris';

/** Whatever helps Jason hack terminals and light the dark: a droid, or his own wrist computer. */
export type Helper = CompanionSkin | 'wrist';

export interface CompanionPlan {
  /** The droid that zaps, lights rooms and fires the force pulse (null: Jason is on his own). */
  lead: CompanionSkin | null;
  /** A second droid that just floats along behind (IRIS, once LUX is back). */
  tag: CompanionSkin | null;
}

/** The flags that matter here. */
export const IRIS_FLAG = 'iris';
export const LUX_BACK_FLAG = 'luxback';
/** The marker where Brennus's reprogrammed LUX waits for Jason. */
export const ROGUE_MARKER = 'rogue';

/** What the chapter 3 plan looks at: the chapter, the hero playing, and whether Atalanta is with us. */
export interface Crew {
  chapter: number;
  hero: HeroId;
  /** Atalanta is on this level and has joined (she brings IRIS along). */
  atalanta: boolean;
}

/**
 * Chapter 3: LUX is Jason's droid and IRIS is Atalanta's. Whoever is playing has their droid in the lead
 * (lighting, hacking, zapping, the force pulse and the hints) while the other droid tags along with the
 * other hero. Before Atalanta joins (and on levels without her), LUX leads and IRIS tags along.
 */
export function voyagePlan(crew: Crew): CompanionPlan {
  return crew.atalanta && crew.hero === 'atalanta' ? { lead: 'iris', tag: 'lux' } : { lead: 'lux', tag: 'iris' };
}

export function companionPlan(deck: DeckId, has: (flag: string) => boolean, crew?: Crew): CompanionPlan {
  switch (deck) {
    case 'snow':
      return { lead: has('boss') ? null : 'lux', tag: null };
    case 'rockies':
      return { lead: null, tag: null };
    case 'jungle':
      return { lead: has(IRIS_FLAG) ? 'iris' : null, tag: null };
    case 'volcano':
      return has(LUX_BACK_FLAG) ? { lead: 'lux', tag: 'iris' } : { lead: 'iris', tag: null };
    default:
      if (crew?.chapter === 3) return voyagePlan(crew);
      return { lead: has('bolt') ? 'lux' : null, tag: null };
  }
}

/**
 * Who helps Jason hack and see in the dark. On Gaia Nova, without a droid, Jason does it himself;
 * on the ship before he finds LUX there is nobody yet (the terminals there wait for LUX).
 */
export function helperOf(deck: DeckId, plan: CompanionPlan): Helper | null {
  if (plan.lead) return plan.lead;
  return deck === 'snow' || deck === 'rockies' || deck === 'jungle' || deck === 'volcano' ? 'wrist' : null;
}

/**
 * Lines and toasts written for LUX (`bolt`) when LUX isn't there: IRIS says them if she is around,
 * otherwise toasts come over HALCYON's radio and dialogue lines are Jason thinking out loud. While LUX
 * only tags along (chapter 3, playing Atalanta), he still says his own lines, and IRIS gives the hints.
 */
export function voiceOf(who: Speaker, plan: CompanionPlan, toast: boolean): Speaker {
  if (who !== 'bolt' || plan.lead === 'lux' || (!toast && plan.tag === 'lux')) return who;
  if (plan.lead === 'iris') return 'iris';
  return toast ? 'halcyon' : 'jason';
}
