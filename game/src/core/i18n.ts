import { EL } from '../i18n/el';
import { GAME_NAME, SHIP } from './brand';

/**
 * Translations. The English text is the key: every string shown on screen goes through `tr()`, which
 * swaps in the Greek version when Greek is on and fills in `{placeholders}`. Strings without a
 * translation (numbers, names, anything already translated) pass through unchanged.
 */
export type Lang = 'en' | 'el';

export const LANGS: { id: Lang; name: string }[] = [
  { id: 'en', name: 'English' },
  { id: 'el', name: 'Ελληνικά' },
];

let current: Lang = 'en';
let table: Record<string, string> = {};

export function setLang(l: Lang) {
  current = l;
  table = l === 'el' ? EL : {};
  document.documentElement.lang = l;
  document.title = tr(GAME_NAME);
}

export function lang(): Lang {
  return current;
}

/** Greek if the phone is set to Greek, English otherwise. */
export function detectLang(): Lang {
  const langs = [...(navigator.languages ?? []), navigator.language ?? ''];
  return langs.some((l) => l?.toLowerCase().startsWith('el')) ? 'el' : 'en';
}

/** Placeholders every string may use without passing them in (translated like the rest). */
const GLOBAL: Record<string, string> = { ship: SHIP };

export function tr(s: string, vars?: Record<string, string | number>): string {
  const out = table[s] ?? s;
  if (!out.includes('{')) return out;
  return out.replace(/\{(\w+)\}/g, (m, k: string) => (vars && k in vars ? String(vars[k]) : GLOBAL[k] ? tr(GLOBAL[k]) : m));
}

/** The combining accent (tonos) that Greek capitals leave off. */
const ACUTE = new RegExp(String.fromCharCode(0x301), 'g');

/** Upper case the way each language writes it: Greek capitals drop their accents (Υδροπονία → ΥΔΡΟΠΟΝΙΑ). */
export function upper(s: string): string {
  return s.toUpperCase().normalize('NFD').replace(ACUTE, '').normalize('NFC');
}
