import type { Speaker } from '../world/levelTypes';

export const ICON = {
  heart: (full: boolean) =>
    `<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.2C.8 8.4 2.9 4.5 6.7 4.5c2.2 0 3.6 1.2 5.3 3.1 1.7-1.9 3.1-3.1 5.3-3.1 3.8 0 5.9 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" fill="${full ? '#ff4d6d' : 'rgba(0,0,0,0.45)'}" stroke="${full ? '#ffd0da' : 'rgba(255,255,255,0.35)'}" stroke-width="1.6"/>${full ? '<ellipse cx="8" cy="9" rx="2" ry="1.3" fill="#fff" opacity=".6"/>' : ''}</svg>`,
  bolt: `<svg viewBox="0 0 24 24"><polygon points="12,2 20.7,7 20.7,17 12,22 3.3,17 3.3,7" fill="#ffd166" stroke="#fff2c2" stroke-width="1.2"/><circle cx="12" cy="12" r="3.6" fill="#b87a10"/></svg>`,
  shard: (got: boolean) =>
    `<svg viewBox="0 0 16 20"><polygon points="8,1 15,10 8,19 1,10" fill="${got ? '#ff6fcf' : 'rgba(0,0,0,0.4)'}" stroke="${got ? '#ffd6f2' : 'rgba(255,255,255,0.35)'}" stroke-width="1.3"/></svg>`,
  pause: `<svg viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1.5" fill="#fff"/><rect x="14" y="5" width="4" height="14" rx="1.5" fill="#fff"/></svg>`,
  jump: `<svg viewBox="0 0 24 24"><path d="M12 4l7 8h-4.5v8h-5v-8H5z" fill="#fff"/></svg>`,
  shoot: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" fill="#fff"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>`,
  spin: `<svg viewBox="0 0 24 24"><path d="M12 4a8 8 0 1 1-7.4 5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M3 4l1.8 5.6L10 7.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  dash: `<svg viewBox="0 0 24 24"><path d="M4 12h9M6 7h8M6 17h8" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M14 5l7 7-7 7z" fill="#fff"/></svg>`,
  cell: `<svg viewBox="0 0 24 24"><rect x="7" y="4" width="10" height="17" rx="2.5" fill="#3dff8a" stroke="#fff" stroke-width="1.5"/><rect x="10" y="2" width="4" height="3" rx="1" fill="#fff"/></svg>`,
  shield: `<svg viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 5-3.6 8.4-8 9.8C7.6 20.4 4 17 4 12V6z" fill="#fff" opacity=".9"/></svg>`,
  lock: `<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2.5" fill="#9fb0d6"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="#9fb0d6" stroke-width="2.4"/></svg>`,
  star: `<svg viewBox="0 0 24 24"><polygon points="12,2 14.9,8.6 22,9.3 16.6,14 18.2,21 12,17.3 5.8,21 7.4,14 2,9.3 9.1,8.6" fill="#ffd166"/></svg>`,
};

interface Person {
  id: string;
  skin: string;
  hair: string;
  iris: string;
  suit: string;
  style: 'short' | 'bun' | 'long' | 'none';
  extra?: string;
  under?: string;
}

const shade = (hex: string, f: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => c(v).toString(16).padStart(2, '0')).join('')}`;
};

/** A shaded cartoon portrait: shoulders, head, hair, big friendly eyes with sparkles, brows and a smile. */
function person(p: Person): string {
  const id = p.id;
  const hair = {
    short: `<path d="M19 37c-1-15 9-24 21-24s22 9 21 24c-3-7-8-11-13-12-4 4-12 5-18 2-5 2-9 5-11 10z" fill="${p.hair}"/>`,
    bun: `<circle cx="40" cy="12" r="8" fill="${p.hair}"/><path d="M19 37c-1-15 9-23 21-23s22 8 21 23c-4-8-11-12-21-12s-17 4-21 12z" fill="${p.hair}"/>`,
    long: `<path d="M17 60c-4-20-2-45 23-46 25 1 27 26 23 46l-6-2c2-10 2-19-2-26-5 3-18 4-28 0-4 7-4 16-2 26z" fill="${p.hair}"/>`,
    none: '',
  }[p.style];
  return `<svg viewBox="0 0 80 80">
    <defs>
      <radialGradient id="${id}s" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="${shade(p.skin, 1.12)}"/><stop offset="1" stop-color="${shade(p.skin, 0.82)}"/></radialGradient>
      <linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(p.suit, 1.15)}"/><stop offset="1" stop-color="${shade(p.suit, 0.75)}"/></linearGradient>
    </defs>
    ${p.under ?? ''}
    <path d="M10 82c1-14 12-22 30-22s29 8 30 22z" fill="url(#${id}c)"/>
    <rect x="34" y="50" width="12" height="12" rx="4" fill="${shade(p.skin, 0.85)}"/>
    <ellipse cx="20" cy="41" rx="4" ry="6" fill="${shade(p.skin, 0.9)}"/><ellipse cx="60" cy="41" rx="4" ry="6" fill="${shade(p.skin, 0.9)}"/>
    <ellipse cx="40" cy="38" rx="19" ry="21" fill="url(#${id}s)"/>
    ${hair}
    <ellipse cx="32.5" cy="40" rx="5" ry="5.8" fill="#fff"/><ellipse cx="47.5" cy="40" rx="5" ry="5.8" fill="#fff"/>
    <circle cx="33" cy="41" r="3.4" fill="${p.iris}"/><circle cx="47" cy="41" r="3.4" fill="${p.iris}"/>
    <circle cx="33" cy="41.3" r="1.7" fill="#120c10"/><circle cx="47" cy="41.3" r="1.7" fill="#120c10"/>
    <circle cx="31.8" cy="39.4" r="1.2" fill="#fff"/><circle cx="45.8" cy="39.4" r="1.2" fill="#fff"/>
    <path d="M27 32.5q5.5-3 11 0M42 32.5q5.5-3 11 0" stroke="${shade(p.hair, 0.9)}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M39 44q1.4 3 3 1.2" stroke="${shade(p.skin, 0.7)}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M33.5 49.5q6.5 5.5 13 0" stroke="#7a2a24" stroke-width="2.4" fill="#fff" stroke-linecap="round"/>
    <circle cx="26.5" cy="47" r="3.2" fill="#ff7a8a" opacity=".35"/><circle cx="53.5" cy="47" r="3.2" fill="#ff7a8a" opacity=".35"/>
    ${p.extra ?? ''}
  </svg>`;
}

const KAI = person({
  id: 'pk',
  skin: '#e8b48c',
  hair: '#4a2a18',
  iris: '#6a4020',
  suit: '#ff8a3d',
  style: 'short',
  under: `<circle cx="40" cy="37" r="30" fill="#dfe6f0"/><circle cx="40" cy="37" r="30" fill="none" stroke="#9aa6ba" stroke-width="2"/>
    <rect x="53" y="3" width="2.4" height="10" fill="#9aa6ba"/><circle cx="54.2" cy="3.5" r="3.4" fill="#ff5e6a"/>`,
  extra: `<path d="M16 30a26 26 0 0 1 48 0" fill="none" stroke="#ff8a3d" stroke-width="3"/>
    <path d="M24 22q8-6 16-6" stroke="#fff" stroke-width="2.5" opacity=".55" fill="none" stroke-linecap="round"/>
    <rect x="35" y="66" width="10" height="6" rx="2" fill="#5ee0ff"/>`,
});

const CAPTAIN = person({
  id: 'pc',
  skin: '#8a5a3c',
  hair: '#e8e8f0',
  iris: '#3a2410',
  suit: '#1c2a4f',
  style: 'short',
  extra: `<path d="M18 26q22-12 44 0v-6q-22-10-44 0z" fill="#1c2a4f"/><rect x="17" y="24" width="46" height="6" rx="3" fill="#0f1830"/>
    <circle cx="40" cy="18" r="3.6" fill="#ffd166"/><rect x="24" y="66" width="10" height="4" rx="1" fill="#ffd166"/><rect x="46" y="66" width="10" height="4" rx="1" fill="#ffd166"/>`,
});

const ROSA = person({
  id: 'pr',
  skin: '#c68a5e',
  hair: '#2a1a12',
  iris: '#3a2410',
  suit: '#8a1c26',
  style: 'bun',
  extra: `<path d="M34 64l6 6 6-6" fill="none" stroke="#ffd166" stroke-width="2.5"/><circle cx="25" cy="70" r="3.5" fill="#ffd166"/>`,
});

const COLONIST = person({ id: 'pn', skin: '#f0c8a0', hair: '#5a3a22', iris: '#2a6a8a', suit: '#e6edf7', style: 'long' });

export const PORTRAIT: Record<Speaker, string> = {
  kai: KAI,
  bolt: `<svg viewBox="0 0 80 80">
    <circle cx="40" cy="44" r="26" fill="#e6edf7"/>
    <rect x="14" y="48" width="52" height="5" fill="#9aa6ba"/>
    <circle cx="40" cy="42" r="13" fill="#16202e"/>
    <circle cx="40" cy="42" r="8.5" fill="#5ee0ff"/>
    <circle cx="36.5" cy="38.5" r="2.8" fill="#fff"/>
    <rect x="47" y="8" width="2.4" height="14" fill="#9aa6ba"/><circle cx="48.2" cy="8" r="4" fill="#ff5e6a"/>
    <circle cx="12" cy="44" r="6" fill="#9aa6ba"/><circle cx="68" cy="44" r="6" fill="#9aa6ba"/>
  </svg>`,
  halcyon: `<svg viewBox="0 0 80 80">
    <circle cx="40" cy="40" r="28" fill="#1b0e10"/>
    <circle cx="40" cy="40" r="22" fill="none" stroke="#ff7a3a" stroke-width="3"/>
    <circle cx="40" cy="40" r="12" fill="#ff7a3a"/>
    <circle cx="40" cy="40" r="4" fill="#ffe0c0"/>
  </svg>`,
  glitch: `<svg viewBox="0 0 80 80">
    <circle cx="40" cy="40" r="28" fill="#1b0a18"/>
    <circle cx="40" cy="40" r="22" fill="none" stroke="#ff4fd8" stroke-width="3" stroke-dasharray="9 5"/>
    <circle cx="43" cy="38" r="12" fill="#ff4fd8"/>
    <circle cx="37" cy="42" r="12" fill="#5ee0ff" opacity=".45"/>
    <circle cx="40" cy="40" r="4" fill="#ffe0f4"/>
    <path d="M18 30l14 6-6 4 12 8" stroke="#ffe0f4" stroke-width="2" fill="none"/>
  </svg>`,
  colonist: COLONIST,
  captain: CAPTAIN,
  rosa: ROSA,
  vendy: `<svg viewBox="0 0 80 80">
    <rect x="14" y="12" width="52" height="62" rx="10" fill="#8a2a5a"/>
    <rect x="20" y="18" width="40" height="28" rx="6" fill="#ffe0f4"/>
    <circle cx="32" cy="30" r="3.5" fill="#2a0f20"/><circle cx="48" cy="30" r="3.5" fill="#2a0f20"/>
    <path d="M33 37c4 4 10 4 14 0" stroke="#2a0f20" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <rect x="26" y="54" width="28" height="6" rx="3" fill="#2a0f20"/>
  </svg>`,
  bloom: `<svg viewBox="0 0 80 80">
    <circle cx="40" cy="40" r="30" fill="#2a0a2a"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7]
      .map((i) => {
        const a = (i / 8) * Math.PI * 2;
        const c = ['#5e9bff', '#ffd166', '#ff6fcf', '#7dff9a'][i % 4];
        return `<ellipse cx="${40 + Math.cos(a) * 16}" cy="${40 + Math.sin(a) * 16}" rx="8" ry="8" fill="${c}"/>`;
      })
      .join('')}
    <circle cx="40" cy="40" r="10" fill="#ffe0f4"/>
  </svg>`,
};

export const SPEAKER_NAME: Record<Speaker, string> = {
  kai: 'Kai',
  bolt: 'BOLT',
  halcyon: 'HALCYON',
  glitch: 'HALCYON?!',
  colonist: 'Colonist',
  captain: 'Captain Mbeki',
  rosa: 'Aunt Rosa',
  vendy: 'Vendy',
  bloom: 'The Bloom',
};

export const SPEAKER_COLOR: Record<Speaker, string> = {
  kai: '#ffb07a',
  bolt: '#7fe6ff',
  halcyon: '#ff8a6a',
  glitch: '#ff4fd8',
  colonist: '#ffd166',
  captain: '#ffd166',
  rosa: '#ff8a8a',
  vendy: '#ff9ae0',
  bloom: '#ff6fcf',
};
