import { tr } from '../core/i18n';
import type { Input } from '../core/input';
import type { VehicleKind } from '../world/levelTypes';
import type { VehicleHud } from './vehicle';

/**
 * The vehicle HUD, drawn over the usual one while a vehicle level is played: a BOOST button with its
 * meter (next to BLAST), a course progress bar at the top, a ring counter, and a big call-out in the
 * middle ("BOOST NOW!"). It brings its own styles, and hides Jason's on-foot buttons while it's on
 * (BLAST stays: it fires the vehicle's guns). The hearts are the usual ones, showing the hull.
 */

const CSS = `
#ui .vhud { position:absolute; inset:0; pointer-events:none; }
#ui .vhud.hidden { display:none; }
#ui .buttons.vehicle .btn.jump, #ui .buttons.vehicle .btn.spin, #ui .buttons.vehicle .btn.dash,
#ui .buttons.vehicle .btn.pulse, #ui .buttons.vehicle .btn.weapon, #ui .buttons.vehicle .ammo { display:none; }
#ui .buttons.vehicle .btn.shoot { right:0; bottom:14px; width:92px; height:92px; }
#ui .btn.boost { display:none; right:106px; bottom:0; width:80px; height:80px;
  background: radial-gradient(circle at 35% 30%, #ffe6a0, #e08a1a); pointer-events:auto; }
#ui .buttons.vehicle .btn.boost { display:flex; }
#ui .btn.boost .cd-ring circle { stroke:#fff6d0; }
#ui .btn.boost.on { box-shadow: 0 0 24px #ffd166, 0 4px 14px rgba(0,0,0,.45); }
#ui .btn.boost.empty svg, #ui .btn.boost.empty span { opacity:.45; }
#ui .btn.boost .slots { position:absolute; top:-12px; display:flex; gap:4px; }
#ui .btn.boost .slots i { width:14px; height:6px; border-radius:3px; background:rgba(0,0,0,.45); border:1px solid rgba(255,255,255,.4); }
#ui .btn.boost .slots i.full { background:#ffd166; box-shadow:0 0 6px #ffd166; }
#ui .vhud .vtrack { position:absolute; left:50%; transform:translateX(-50%); top:calc(54px + var(--safe-t, 0px));
  width:min(360px, 46vw); height:8px; border-radius:4px; background:rgba(10,14,40,.55); border:1px solid rgba(255,255,255,.25); }
#ui .vhud .vtrack .fill { position:absolute; left:0; top:0; bottom:0; border-radius:4px; background:linear-gradient(90deg,#5ee0ff,#ffd166); }
#ui .vhud .vtrack .mark { position:absolute; top:-3px; width:4px; height:14px; margin-left:-2px; border-radius:2px; background:#bff4ff; }
#ui .vhud .vtrack .ship { position:absolute; top:-9px; margin-left:-11px; width:22px; height:22px; border-radius:50%;
  background:#fff; border:2px solid #ffd166; box-shadow:0 0 8px #ffd166; font-size:12px; line-height:18px; text-align:center; }
#ui .vhud .vtrack .goal { position:absolute; right:-14px; top:-10px; width:24px; height:24px; border-radius:50%;
  background:radial-gradient(circle,#c8ff9a,#3a8a40); border:2px solid #ffd166; }
#ui .vhud .vcount { position:absolute; top:calc(62px + var(--safe-t, 0px)); right:calc(14px + var(--safe-r, 0px)); display:flex; gap:6px;
  align-items:center; padding:4px 12px; border-radius:999px; background:rgba(10,14,40,.6); border:1px solid rgba(255,209,102,.5);
  color:#ffd166; font:700 16px Orbitron, sans-serif; }
#ui .vhud .vcount svg { width:22px; height:22px; }
#ui .vhud .vprompt { position:absolute; left:50%; top:38%; transform:translate(-50%,-50%); padding:8px 22px; border-radius:16px;
  background:rgba(10,14,40,.55); color:#fff; font:800 22px Fredoka, sans-serif; letter-spacing:.04em; text-align:center;
  text-shadow:0 2px 6px rgba(0,0,0,.6); white-space:nowrap; transition:opacity .2s; }
#ui .vhud .vprompt.off, #ui .buttons.hidden ~ .vhud .vprompt { opacity:0; }
#ui .vhud .vprompt.urgent { color:#ffd166; border:2px solid #ffd166; font-size:30px; animation: vpulse .45s infinite alternate; }
@keyframes vpulse { from { transform:translate(-50%,-50%) scale(1); } to { transform:translate(-50%,-50%) scale(1.08); } }
@media (max-height: 460px) { #ui .vhud .vprompt { font-size:18px; } #ui .vhud .vprompt.urgent { font-size:24px; } }
#ui .btn.boost.sing { background: radial-gradient(circle at 35% 30%, #ffd0ec, #e04a9a); box-shadow: 0 0 22px #ff6fb0; }
#ui .vhud .vsong { position:absolute; left:50%; top:calc(84px + var(--safe-t, 0px)); transform:translateX(-50%); width:min(420px, 52vw);
  height:54px; border-radius:27px; background:rgba(10,14,40,.6); border:2px solid rgba(255,111,176,.7); }
@media (max-height: 460px) { #ui .vhud .vsong { top:calc(72px + var(--safe-t, 0px)); transform:translateX(-50%) scale(.82); } }
#ui .vhud .vsong.hidden, #ui .buttons.hidden ~ .vhud .vsong { display:none; }
#ui .vhud .vsong .target { position:absolute; left:14px; top:6px; width:38px; height:38px; border-radius:50%; border:4px solid #fff;
  box-shadow:0 0 12px #7fe6ff; box-sizing:border-box; }
#ui .vhud .vsong .target.hit { background:#7fe6ff; }
#ui .vhud .vsong i.note { position:absolute; top:13px; width:24px; height:24px; margin-left:-12px; border-radius:50%;
  background:radial-gradient(circle at 35% 30%, #fff, #ff6fb0); box-shadow:0 0 8px #ff6fb0; }
#ui .vhud .vsong .got { position:absolute; right:12px; bottom:-26px; color:#fff; font:800 16px Fredoka, sans-serif; text-shadow:0 2px 4px #000; }
`;

const RING_ICON = `<svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="8" ry="9" fill="none" stroke="#ffd166" stroke-width="3.4"/><ellipse cx="12" cy="12" rx="8" ry="9" fill="none" stroke="#fff6d0" stroke-width="1" opacity=".7"/></svg>`;
/** The sub's sonar (three arcs), and LUX's counter-song (a music note). */
const PING_ICON = `<svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="2.6" fill="#fff"/><path d="M10 7.5a6 6 0 0 1 0 9M13.5 4.5a10 10 0 0 1 0 15M17 2a13.5 13.5 0 0 1 0 20" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>`;
const SING_ICON = `<svg viewBox="0 0 24 24"><path d="M9 18V5l10-2v12" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/><circle cx="6.5" cy="18" r="3" fill="#fff"/><circle cx="16.5" cy="15" r="3" fill="#fff"/></svg>`;
const BOOST_ICON = `<svg viewBox="0 0 24 24"><path d="M3 15l7-3-7-3M9 17l8-5-8-5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="19.5" cy="12" r="2.6" fill="#fff"/></svg>`;

export class VehicleHudView {
  private el: HTMLElement;
  private btn: HTMLElement;
  private buttons: HTMLElement | null;
  private last = '';
  private lastPrompt = '';
  /** What the button says right now (BOOST, or the sub's PING and SING). */
  private label = 'BOOST';
  private song: HTMLElement;

  constructor(root: HTMLElement, input: Input) {
    if (!document.getElementById('vhud-css')) {
      const style = document.createElement('style');
      style.id = 'vhud-css';
      style.textContent = CSS;
      document.head.append(style);
    }
    this.el = document.createElement('div');
    this.el.className = 'vhud hidden';
    this.el.innerHTML = `<div class="vtrack"><div class="fill"></div><div class="marks"></div><div class="goal"></div><div class="ship">✦</div></div>
      <div class="vcount">${RING_ICON}<b>0</b></div><div class="vprompt off"></div>
      <div class="vsong hidden"><i class="target"></i><div class="notes"></div><div class="got"></div></div>`;
    this.song = this.el.querySelector('.vsong') as HTMLElement;
    const hud = root.querySelector('.hud-left')?.parentElement ?? root;
    hud.append(this.el);
    // BOOST sits with the other buttons (so it hides with them during cutscenes) and presses DASH.
    this.buttons = root.querySelector('.buttons');
    this.btn = document.createElement('div');
    this.btn.className = 'btn boost clickable';
    this.btn.dataset.b = 'dash';
    this.btn.innerHTML = `${BOOST_ICON}<span data-t="BOOST">${tr('BOOST')}</span><svg class="cd-ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" pathLength="100"/></svg><div class="slots"></div>`;
    this.buttons?.append(this.btn);
    const down = (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      this.btn.setPointerCapture?.(e.pointerId);
      this.btn.classList.add('down');
      input.press('dash', true);
    };
    const up = (e: PointerEvent) => {
      e.preventDefault();
      this.btn.classList.remove('down');
      input.press('dash', false);
    };
    this.btn.addEventListener('pointerdown', down);
    this.btn.addEventListener('pointerup', up);
    this.btn.addEventListener('pointercancel', up);
    this.btn.addEventListener('lostpointercapture', up);
  }

  /** Switches the vehicle HUD on (for a kind of vehicle) or off. */
  show(kind: VehicleKind | null) {
    this.el.classList.toggle('hidden', !kind);
    this.buttons?.classList.toggle('vehicle', !!kind);
    if (this.buttons) this.buttons.dataset.vehicle = kind ?? '';
    this.last = '';
    this.lastPrompt = '';
    this.setLabel('BOOST');
    this.song.classList.add('hidden');
  }

  /** Re-labels (and re-draws) the button: BOOST, PING or SING. */
  private setLabel(label: string) {
    if (label === this.label) return;
    this.label = label;
    const icon = label === 'PING' ? PING_ICON : label === 'SING' ? SING_ICON : BOOST_ICON;
    const old = this.btn.querySelector('svg:not(.cd-ring)');
    if (old) old.outerHTML = icon;
    const s = this.btn.querySelector('span');
    if (s) {
      s.dataset.t = label;
      s.textContent = tr(label);
    }
    this.btn.classList.toggle('sing', label === 'SING');
  }

  /** The counter-song's rhythm strip: notes slide in from the right to the ring. */
  private drawSong(song: VehicleHud['song']) {
    this.song.classList.toggle('hidden', !song);
    if (!song) return;
    const notes = this.song.querySelector('.notes') as HTMLElement;
    const shown = song.beats.filter((b) => b > -0.25 && b < 2.4);
    if (notes.childElementCount !== shown.length) notes.innerHTML = '<i class="note"></i>'.repeat(shown.length);
    // The ring sits 33px in; a beat 2.4 s away starts at the right end.
    const w = this.song.clientWidth || 360;
    notes.querySelectorAll<HTMLElement>('i').forEach((el, i) => (el.style.left = `${33 + (shown[i] / 2.4) * (w - 60)}px`));
    (this.song.querySelector('.target') as HTMLElement).classList.toggle('hit', shown.some((b) => Math.abs(b) < 0.12));
    (this.song.querySelector('.got') as HTMLElement).textContent = `♪ ${song.got} / ${song.need}`;
  }

  update(h: VehicleHud) {
    this.setLabel(h.button ?? 'BOOST');
    (this.el.querySelector('.vtrack') as HTMLElement).style.display = h.track === false ? 'none' : '';
    this.drawSong(h.song ?? null);
    const key = `${Math.round(h.boost * 30)}|${h.boostSlots}|${h.boosting}|${h.counter?.join(',')}|${Math.round(h.progress * 400)}|${h.marks.length}`;
    if (key !== this.last) {
      this.last = key;
      const full = Math.floor(h.boost * h.boostSlots + 1e-6);
      const slots = this.btn.querySelector('.slots') as HTMLElement;
      if (slots.childElementCount !== h.boostSlots) slots.innerHTML = '<i></i>'.repeat(h.boostSlots);
      slots.querySelectorAll('i').forEach((x, i) => x.classList.toggle('full', i < full));
      const ring = this.btn.querySelector<SVGCircleElement>('.cd-ring circle');
      if (ring) ring.style.strokeDashoffset = String(100 - h.boost * 100);
      this.btn.classList.toggle('on', h.boosting);
      this.btn.classList.toggle('empty', full === 0 && !h.boosting);
      const count = this.el.querySelector('.vcount') as HTMLElement;
      count.style.display = h.counter ? '' : 'none';
      if (h.counter) (count.querySelector('b') as HTMLElement).textContent = `${h.counter[1]} / ${h.counter[2]}`;
      (this.el.querySelector('.vtrack .fill') as HTMLElement).style.width = `${h.progress * 100}%`;
      (this.el.querySelector('.vtrack .ship') as HTMLElement).style.left = `${h.progress * 100}%`;
      const marks = this.el.querySelector('.vtrack .marks') as HTMLElement;
      if (marks.childElementCount !== h.marks.length) marks.innerHTML = h.marks.map((m) => `<i class="mark" style="left:${m * 100}%"></i>`).join('');
    }
    const pk = `${h.prompt}|${h.urgent}`;
    if (pk !== this.lastPrompt) {
      this.lastPrompt = pk;
      const p = this.el.querySelector('.vprompt') as HTMLElement;
      if (h.prompt) p.textContent = tr(h.prompt);
      p.classList.toggle('off', !h.prompt);
      p.classList.toggle('urgent', h.urgent);
    }
  }

  /** Re-labels the button after a language change. */
  applyLang() {
    const s = this.btn.querySelector('span');
    if (s) s.textContent = tr(this.label);
    this.lastPrompt = '';
  }
}
