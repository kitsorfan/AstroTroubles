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
#ui .btn.rocket { display:none; right:12px; bottom:118px; width:66px; height:66px;
  background: radial-gradient(circle at 35% 30%, #ffb0a8, #c8282e); pointer-events:auto; }
#ui .buttons.vehicle .btn.rocket.has { display:flex; }
#ui .btn.rocket span { font-size:11px; }
#ui .btn.rocket.empty { filter:grayscale(.85) brightness(.75); }
#ui .btn.rocket.ready { box-shadow: 0 0 20px #ff7a5a, 0 4px 14px rgba(0,0,0,.45); }
#ui .btn.rocket .slots { position:absolute; top:-12px; display:flex; gap:4px; }
#ui .btn.rocket .slots i { width:10px; height:10px; border-radius:50%; background:rgba(0,0,0,.45); border:1px solid rgba(255,255,255,.4); }
#ui .btn.rocket .slots i.full { background:#ff7a5a; box-shadow:0 0 6px #ff7a5a; }
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
`;

const RING_ICON = `<svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="8" ry="9" fill="none" stroke="#ffd166" stroke-width="3.4"/><ellipse cx="12" cy="12" rx="8" ry="9" fill="none" stroke="#fff6d0" stroke-width="1" opacity=".7"/></svg>`;
const ROCKET_ICON = `<svg viewBox="0 0 24 24"><path d="M12 2c3 2.5 4 6 4 9.5V17H8v-5.5C8 8 9 4.5 12 2z" fill="#fff"/><circle cx="12" cy="9" r="1.8" fill="#c8282e"/><path d="M8 13l-3 4v2l3-1.5M16 13l3 4v2l-3-1.5" fill="#ffd0c8"/><path d="M10 18.5l2 3.5 2-3.5" fill="#ffd166"/></svg>`;
const BOOST_ICON = `<svg viewBox="0 0 24 24"><path d="M3 15l7-3-7-3M9 17l8-5-8-5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="19.5" cy="12" r="2.6" fill="#fff"/></svg>`;

export class VehicleHudView {
  private el: HTMLElement;
  private btn: HTMLElement;
  private rocketBtn: HTMLElement;
  private buttons: HTMLElement | null;
  private last = '';
  private lastPrompt = '';

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
      <div class="vcount">${RING_ICON}<b>0</b></div><div class="vprompt off"></div>`;
    const hud = root.querySelector('.hud-left')?.parentElement ?? root;
    hud.append(this.el);
    // BOOST sits with the other buttons (so it hides with them during cutscenes) and presses DASH.
    this.buttons = root.querySelector('.buttons');
    this.btn = document.createElement('div');
    this.btn.className = 'btn boost clickable';
    this.btn.dataset.b = 'dash';
    this.btn.innerHTML = `${BOOST_ICON}<span data-t="BOOST">${tr('BOOST')}</span><svg class="cd-ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" pathLength="100"/></svg><div class="slots"></div>`;
    this.buttons?.append(this.btn);
    // ROCKET (only on vehicles that carry rockets) presses SPIN, which is otherwise unused while flying.
    this.rocketBtn = document.createElement('div');
    this.rocketBtn.className = 'btn rocket clickable';
    this.rocketBtn.dataset.b = 'spin';
    this.rocketBtn.innerHTML = `${ROCKET_ICON}<span data-t="ROCKET">${tr('ROCKET')}</span><div class="slots"></div>`;
    this.buttons?.append(this.rocketBtn);
    for (const [btn, name] of [
      [this.btn, 'dash'],
      [this.rocketBtn, 'spin'],
    ] as const) {
      const down = (e: PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        btn.setPointerCapture?.(e.pointerId);
        btn.classList.add('down');
        input.press(name, true);
      };
      const up = (e: PointerEvent) => {
        e.preventDefault();
        btn.classList.remove('down');
        input.press(name, false);
      };
      btn.addEventListener('pointerdown', down);
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('lostpointercapture', up);
    }
  }

  /** Switches the vehicle HUD on (for a kind of vehicle) or off. */
  show(kind: VehicleKind | null) {
    this.el.classList.toggle('hidden', !kind);
    this.buttons?.classList.toggle('vehicle', !!kind);
    if (this.buttons) this.buttons.dataset.vehicle = kind ?? '';
    this.last = '';
    this.lastPrompt = '';
  }

  update(h: VehicleHud) {
    const key = `${Math.round(h.boost * 30)}|${h.boostSlots}|${h.boosting}|${h.counter?.join(',')}|${Math.round(h.progress * 400)}|${h.marks.length}|${h.rockets?.join(',')}`;
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
      const r = h.rockets;
      this.rocketBtn.classList.toggle('has', !!r);
      if (r) {
        const [left, max, ready] = r;
        const pips = this.rocketBtn.querySelector('.slots') as HTMLElement;
        if (pips.childElementCount !== max) pips.innerHTML = '<i></i>'.repeat(max);
        pips.querySelectorAll('i').forEach((x, i) => x.classList.toggle('full', i < left));
        this.rocketBtn.classList.toggle('empty', left === 0);
        this.rocketBtn.classList.toggle('ready', left > 0 && ready);
      }
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
    if (s) s.textContent = tr('BOOST');
    const r = this.rocketBtn.querySelector('span');
    if (r) r.textContent = tr('ROCKET');
    this.lastPrompt = '';
  }
}
