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

const face = (skin: string, hair: string, suit: string) => `<svg viewBox="0 0 80 80">
  <rect x="14" y="56" width="52" height="30" rx="14" fill="${suit}"/>
  <circle cx="40" cy="38" r="20" fill="${skin}"/>
  <path d="M20 34c0-14 10-20 20-20s20 6 20 20c-6-6-12-8-20-8s-14 2-20 8z" fill="${hair}"/>
  <circle cx="33" cy="40" r="3" fill="#1b1b2a"/><circle cx="47" cy="40" r="3" fill="#1b1b2a"/>
  <path d="M34 49c4 3 8 3 12 0" stroke="#7a3a2a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <circle cx="28" cy="46" r="3" fill="#ff9aa0" opacity=".5"/><circle cx="52" cy="46" r="3" fill="#ff9aa0" opacity=".5"/>
</svg>`;

export const PORTRAIT: Record<Speaker, string> = {
  kai: `<svg viewBox="0 0 80 80">
    <rect x="14" y="58" width="52" height="28" rx="14" fill="#ff8a3d"/>
    <circle cx="40" cy="36" r="25" fill="#eef3fa"/>
    <rect x="21" y="27" width="38" height="20" rx="10" fill="#10223c"/>
    <rect x="24" y="29" width="14" height="6" rx="3" fill="#7fe6ff" opacity=".7"/>
    <circle cx="33" cy="37" r="2.6" fill="#7fe6ff"/><circle cx="47" cy="37" r="2.6" fill="#7fe6ff"/>
    <path d="M36 42c2.5 2 5.5 2 8 0" stroke="#7fe6ff" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="55" cy="12" r="3" fill="#ff5e6a"/><rect x="54" y="12" width="2" height="8" fill="#9aa6ba"/>
  </svg>`,
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
  colonist: face('#f0c8a0', '#5a3a22', '#e6edf7'),
  captain: `<svg viewBox="0 0 80 80">
    <rect x="14" y="56" width="52" height="30" rx="14" fill="#1c2a4f"/>
    <rect x="30" y="58" width="20" height="5" rx="2" fill="#ffd166"/>
    <circle cx="40" cy="40" r="20" fill="#8a5a3c"/>
    <path d="M20 36c0-14 10-19 20-19s20 5 20 19c-6-5-12-7-20-7s-14 2-20 7z" fill="#e8e8f0"/>
    <rect x="18" y="16" width="44" height="10" rx="4" fill="#1c2a4f"/>
    <rect x="22" y="24" width="36" height="4" rx="2" fill="#0f1830"/>
    <circle cx="40" cy="20" r="3.4" fill="#ffd166"/>
    <circle cx="33" cy="41" r="3" fill="#1b1b2a"/><circle cx="47" cy="41" r="3" fill="#1b1b2a"/>
    <path d="M34 50c4 2.6 8 2.6 12 0" stroke="#3a1a10" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  </svg>`,
  rosa: `<svg viewBox="0 0 80 80">
    <rect x="14" y="56" width="52" height="30" rx="14" fill="#8a1c26"/>
    <rect x="22" y="60" width="10" height="6" rx="2" fill="#ffd166"/>
    <circle cx="40" cy="12" r="9" fill="#2a1a12"/>
    <circle cx="40" cy="39" r="20" fill="#c68a5e"/>
    <path d="M20 36c0-14 10-20 20-20s20 6 20 20c-4-7-10-10-20-10s-16 3-20 10z" fill="#2a1a12"/>
    <circle cx="33" cy="41" r="3" fill="#1b1b2a"/><circle cx="47" cy="41" r="3" fill="#1b1b2a"/>
    <path d="M33 49c4 3.4 10 3.4 14 0" stroke="#5a2418" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <circle cx="28" cy="46" r="3" fill="#ff9aa0" opacity=".45"/><circle cx="52" cy="46" r="3" fill="#ff9aa0" opacity=".45"/>
  </svg>`,
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
