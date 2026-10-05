import { audio } from '../core/audio';
import { GAME_NAME, SHIP } from '../core/brand';
import { LANGS, tr, upper } from '../core/i18n';
import type { ButtonName, Input } from '../core/input';
import type { Quality, SaveData, Settings, UpgradeId } from '../core/save';
import type { Line, Speaker } from '../world/levelTypes';
import { emblemSvg } from './emblem';
import { ICON, SPEAKER_COLOR, SPEAKER_NAME, portrait } from './icons';

const $ = <T extends HTMLElement = HTMLElement>(root: ParentNode, sel: string) => root.querySelector(sel) as T;

function h(html: string): HTMLElement {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild as HTMLElement;
}

/** A label that follows the language setting (see `applyLang`). */
const label = (en: string) => `<span data-t="${en}">${tr(en)}</span>`;

export interface ShopItem {
  id: UpgradeId;
  name: string;
  desc: string;
  prices: number[];
  icon: string;
}

export const SHOP: ShopItem[] = [
  { id: 'heart', name: 'Heart Plating', desc: '+1 max heart', prices: [150, 300, 500], icon: ICON.heart(true) },
  { id: 'blaster', name: 'Blaster Power', desc: '+1 damage for blasts, spins, pounds and dashes (fireballs +2)', prices: [250, 600], icon: ICON.shoot },
  { id: 'clip', name: 'Bigger Clip', desc: '+2 shots before you need to reload', prices: [160, 380], icon: ICON.cell },
  { id: 'rapid', name: 'Quick Reload', desc: 'Shoot and reload faster', prices: [200, 450], icon: ICON.dash },
  { id: 'boltZap', name: 'LUX Zapper', desc: 'LUX’s zap hurts instead of just stunning, and his force pulse hits harder', prices: [180, 420], icon: ICON.star },
  { id: 'magnet', name: 'Bolt Magnet', desc: 'Pull in bolts from farther away', prices: [120, 300], icon: ICON.bolt },
];

export interface DeckInfo {
  index: number;
  id: string;
  name: string;
  color: string;
  shards: number;
  shardTotal: number;
  unlocked: boolean;
  completed: boolean;
}

/** Everything the ability buttons show, refreshed every frame. */
export interface AbilityHud {
  spins: number;
  spinMax: number;
  /** 0..1 while the spins recharge. */
  spinReload: number;
  dash: boolean;
  energy: number;
  energyMax: number;
  pulse: boolean;
  /** 0..1, 1 = ready. */
  pulseCharge: number;
  pulseLeft: number;
}

/** Where to draw the objective waypoint: screen position, whether it's pinned to the edge, and how far it is. */
export interface WaypointHud {
  x: number;
  y: number;
  edge: boolean;
  /** Direction of the edge arrow, in radians (0 = right, clockwise). */
  angle: number;
  dist: number;
}

export class UI {
  private hud: HTMLElement;
  private overlay: HTMLElement;
  private toastEl: HTMLElement;
  private toastT: ReturnType<typeof setTimeout> | null = null;
  private stickEl: HTMLElement;
  private actionEl: HTMLElement;
  private dashBtn: HTMLElement;
  private spinBtn: HTMLElement;
  private pulseBtn: HTMLElement;
  private wpEl: HTMLElement;
  private bossEl: HTMLElement;
  private fpsEl: HTMLElement;
  private lastHearts = -1;
  private lastBolts = -1;
  onAction?: () => void;
  onPause?: () => void;
  private fadeEl: HTMLElement;
  private cine: HTMLElement;
  private skipBtn: HTMLElement;
  private onSkip: (() => void) | null = null;
  private onCineTap: (() => void) | null = null;
  private glitchT: ReturnType<typeof setTimeout> | null = null;
  private objectiveText = '';
  private bossName: string | null = null;

  constructor(
    private root: HTMLElement,
    private input: Input,
  ) {
    const ring = (cls: string) => `<svg class="${cls}" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" pathLength="100"/></svg>`;
    this.hud = h(`<div class="hidden">
      <div class="hud-left"><div class="hearts"></div><div class="counter bolts">${ICON.bolt}<b>0</b></div></div>
      <div class="hud-top"><div class="objective hidden"></div><div class="bossbar hidden"><div class="name"></div><div class="track"><div class="fill"></div></div></div></div>
      <div class="hud-right"><div class="shards"></div><div class="round-btn clickable pause">${ICON.pause}</div></div>
      <div class="waypoint hidden"><i class="wp-arrow"></i><i class="wp-gem"></i><b></b></div>
      <div class="stick hidden"><div class="knob"></div></div>
      <div class="stick-hint">${label('MOVE')}</div>
      <div class="buttons">
        <div class="btn jump clickable" data-b="jump">${ICON.jump}${label('JUMP')}</div>
        <div class="btn shoot clickable" data-b="shoot">${ICON.shoot}${label('BLAST')}${ring('charge-ring')}</div>
        <div class="ammo"><div class="pips"></div><div class="reload"><i></i></div></div>
        <div class="btn spin clickable" data-b="spin">${ICON.spin}${label('SPIN')}${ring('cd-ring')}<div class="charges"></div></div>
        <div class="btn dash clickable hidden" data-b="dash">${ICON.dash}${label('DASH')}<div class="charges"></div></div>
        <div class="btn pulse clickable hidden" data-b="pulse">${ICON.pulse}${label('PULSE')}${ring('cd-ring')}<em></em></div>
      </div>
      <div class="action clickable hidden">${portrait('bolt')}<b></b></div>
      <div class="toast"><div class="portrait"></div><div class="t"></div></div>
      <div class="threat"><img alt=""/><div><div class="tag">${label('NEW ENEMY')}</div><b></b><p></p></div></div>
      <div class="fps"></div>
    </div>`);
    this.overlay = h(`<div class="overlay hidden"></div>`);
    this.fadeEl = h(`<div class="fade"></div>`);
    this.cine = h(`<div class="cine">
      <div class="tap"></div><div class="bar top"></div><div class="bar bottom"></div>
      <div class="caption"></div><div class="bosscard"></div><div class="glitch-fx"></div>
    </div>`);
    this.skipBtn = h(`<button class="skip clickable hidden">${label('SKIP')} ▶▶</button>`);
    // Order matters: fades under everything, cutscene bars under dialogue, and the skip button on top.
    root.append(this.fadeEl, this.hud, this.cine, this.overlay, this.skipBtn, h(`<div class="reward-banner"></div>`));
    this.skipBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.onSkip?.();
    });
    $(this.cine, '.tap').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.onCineTap?.();
    });
    this.toastEl = $(this.hud, '.toast');
    this.stickEl = $(this.hud, '.stick');
    this.actionEl = $(this.hud, '.action');
    this.dashBtn = $(this.hud, '.btn.dash');
    this.spinBtn = $(this.hud, '.btn.spin');
    this.pulseBtn = $(this.hud, '.btn.pulse');
    this.wpEl = $(this.hud, '.waypoint');
    this.bossEl = $(this.hud, '.bossbar');
    this.fpsEl = $(this.hud, '.fps');

    for (const btn of this.hud.querySelectorAll<HTMLElement>('.btn')) {
      const name = btn.dataset.b as ButtonName;
      const down = (e: PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        btn.setPointerCapture?.(e.pointerId);
        btn.classList.add('down');
        this.input.press(name, true);
      };
      const up = (e: PointerEvent) => {
        e.preventDefault();
        btn.classList.remove('down');
        this.input.press(name, false);
      };
      btn.addEventListener('pointerdown', down);
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('lostpointercapture', up);
    }
    this.actionEl.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.input.press('action', true);
      this.input.press('action', false);
    });
    $(this.hud, '.pause').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.onPause?.();
    });
    input.onStick = (active, ox, oy, kx, ky) => {
      this.stickEl.classList.toggle('hidden', !active);
      $(this.hud, '.stick-hint').classList.toggle('hidden', active);
      if (!active) return;
      this.stickEl.style.left = `${ox}px`;
      this.stickEl.style.top = `${oy}px`;
      $(this.stickEl, '.knob').style.transform = `translate(${kx}px, ${ky}px)`;
    };
  }

  /** Re-labels the HUD after the language changes (menus are rebuilt every time they open). */
  applyLang() {
    for (const el of this.root.querySelectorAll<HTMLElement>('[data-t]')) el.textContent = tr(el.dataset.t ?? '');
    this.setObjective(this.objectiveText);
    if (this.bossName) $(this.bossEl, '.name').textContent = tr(this.bossName);
    this.lastAbility = '';
  }

  /* ---------------- HUD ---------------- */

  showHud(on: boolean) {
    this.hud.classList.toggle('hidden', !on);
  }

  showControls(on: boolean) {
    for (const sel of ['.buttons', '.stick-hint']) $(this.hud, sel).classList.toggle('hidden', !on);
    if (!on) {
      this.actionEl.classList.add('hidden');
      this.setWaypoint(null);
    }
  }

  setHearts(n: number, max: number) {
    const el = $(this.hud, '.hearts');
    if (n < this.lastHearts) {
      el.classList.remove('shake');
      void el.offsetWidth;
      el.classList.add('shake');
    }
    this.lastHearts = n;
    el.innerHTML = Array.from({ length: max }, (_, i) => ICON.heart(i < n)).join('');
  }

  setBolts(n: number) {
    const el = $(this.hud, '.bolts');
    if (n !== this.lastBolts && this.lastBolts >= 0) {
      el.classList.remove('pop');
      void el.offsetWidth;
      el.classList.add('pop');
    }
    this.lastBolts = n;
    $(el, 'b').textContent = String(n);
  }

  setShards(got: boolean[]) {
    $(this.hud, '.shards').innerHTML = got.map((g) => ICON.shard(g)).join('');
  }

  setObjective(text: string) {
    this.objectiveText = text;
    const el = $(this.hud, '.objective');
    el.textContent = tr(text);
    el.classList.toggle('hidden', !text);
  }

  setBoss(name: string | null, frac: number) {
    this.bossName = name;
    this.bossEl.classList.toggle('hidden', !name);
    if (!name) return;
    $(this.bossEl, '.name').textContent = tr(name);
    $(this.bossEl, '.fill').style.width = `${Math.max(0, frac) * 100}%`;
  }

  /** The LUX button next to things he can use (terminals, pylons, the shop, lifts). */
  setAction(text: string | null) {
    this.actionEl.classList.toggle('hidden', !text);
    if (text) $(this.actionEl, 'b').textContent = tr(text);
  }

  private lastAbility = '';

  /** Spin charges, dash energy and LUX's force pulse on their buttons. */
  setAbilities(a: AbilityHud) {
    const key = `${a.spins}|${Math.round(a.spinReload * 30)}|${a.dash}|${a.energy}|${a.pulse}|${Math.round(a.pulseCharge * 40)}|${Math.ceil(a.pulseLeft)}`;
    if (key === this.lastAbility) return;
    this.lastAbility = key;
    const pips = (el: HTMLElement, n: number, max: number) => {
      const box = $(el, '.charges');
      if (box.childElementCount !== max) box.innerHTML = '<i></i>'.repeat(max);
      box.querySelectorAll('i').forEach((p, i) => p.classList.toggle('full', i < n));
    };
    const fill = (el: HTMLElement, k: number) => {
      const c = el.querySelector<SVGCircleElement>('.cd-ring circle');
      if (c) c.style.strokeDashoffset = String(100 - k * 100);
    };
    pips(this.spinBtn, a.spins, a.spinMax);
    this.spinBtn.classList.toggle('empty', a.spins === 0);
    this.spinBtn.classList.toggle('recharging', a.spinReload > 0);
    fill(this.spinBtn, a.spinReload);
    this.dashBtn.classList.toggle('hidden', !a.dash);
    if (a.dash) {
      pips(this.dashBtn, a.energy, a.energyMax);
      this.dashBtn.classList.toggle('empty', a.energy === 0);
    }
    this.pulseBtn.classList.toggle('hidden', !a.pulse);
    if (a.pulse) {
      const ready = a.pulseCharge >= 1;
      this.pulseBtn.classList.toggle('ready', ready);
      this.pulseBtn.classList.toggle('empty', !ready);
      fill(this.pulseBtn, a.pulseCharge);
      $(this.pulseBtn, 'em').textContent = ready ? '' : String(Math.ceil(a.pulseLeft));
    }
  }

  /** Shakes the DASH button when Jason tries to dash on an empty tank. */
  dashEmpty() {
    this.dashBtn.classList.remove('nope');
    void this.dashBtn.offsetWidth;
    this.dashBtn.classList.add('nope');
  }

  /** The gold objective marker: over the target, or pinned to the screen edge pointing at it. */
  setWaypoint(w: WaypointHud | null) {
    this.wpEl.classList.toggle('hidden', !w);
    if (!w) return;
    this.wpEl.style.transform = `translate(${Math.round(w.x)}px, ${Math.round(w.y)}px)`;
    this.wpEl.classList.toggle('edge', w.edge);
    $(this.wpEl, '.wp-arrow').style.transform = `rotate(${w.angle}rad)`;
    $(this.wpEl, 'b').textContent = `${Math.round(w.dist)} m`;
  }

  private rewardQueue: string[] = [];
  private rewardBusy = false;

  /** A gold banner across the top of the screen for rewards. Several in a row queue up. */
  reward(text: string) {
    this.rewardQueue.push(tr(text));
    if (!this.rewardBusy) this.nextReward();
  }

  private nextReward() {
    const el = $(this.root, '.reward-banner');
    const text = this.rewardQueue.shift();
    if (!text) {
      this.rewardBusy = false;
      return;
    }
    this.rewardBusy = true;
    el.textContent = text;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    audio.play('bolt', 1.2);
    setTimeout(() => this.nextReward(), 2600);
  }

  private lastAmmo = '';

  /** Ammo pips above BLAST, the reload bar, and the fireball charge ring. */
  setAmmo(ammo: number, clip: number, reload: number, charge: number) {
    const key = `${ammo}|${clip}|${Math.round(reload * 20)}|${Math.round(charge * 20)}`;
    if (key === this.lastAmmo) return;
    this.lastAmmo = key;
    const box = $(this.hud, '.ammo');
    const pips = $(box, '.pips');
    if (pips.childElementCount !== clip) pips.innerHTML = '<i></i>'.repeat(clip);
    pips.querySelectorAll('i').forEach((el, i) => el.classList.toggle('full', i < ammo));
    box.classList.toggle('reloading', reload > 0);
    $<HTMLElement>(box, '.reload i').style.width = `${Math.round(reload * 100)}%`;
    const ring = this.hud.querySelector<SVGCircleElement>('.charge-ring circle');
    if (ring) {
      ring.style.strokeDashoffset = String(100 - charge * 100);
      ring.classList.toggle('full', charge >= 1);
    }
  }

  private threatQueue: [string, string, string, string][] = [];
  private threatBusy = false;

  /** A small card about an enemy the first time Jason meets one (one card at a time, out of the way). */
  threat(icon: string, name: string, tip: string, color: string) {
    this.threatQueue.push([icon, name, tip, color]);
    if (!this.threatBusy) this.nextThreat();
  }

  private nextThreat() {
    const next = this.threatQueue.shift();
    const el = $(this.hud, '.threat');
    if (!next) {
      this.threatBusy = false;
      return;
    }
    this.threatBusy = true;
    const [icon, name, tip, color] = next;
    $<HTMLImageElement>(el, 'img').src = icon;
    $(el, 'b').textContent = tr(name);
    $(el, 'b').style.color = color;
    $(el, 'p').textContent = tr(tip);
    el.classList.add('show');
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => this.nextThreat(), 500);
    }, 4200);
  }

  setFps(text: string) {
    this.fpsEl.textContent = text;
  }

  toast(text: string, who: Speaker = 'bolt') {
    const t = tr(text);
    $(this.toastEl, '.portrait').innerHTML = portrait(who);
    $(this.toastEl, '.t').textContent = t;
    this.toastEl.classList.add('show');
    if (this.toastT) clearTimeout(this.toastT);
    this.toastT = setTimeout(() => this.toastEl.classList.remove('show'), 2400 + t.length * 35);
  }

  /* ---------------- overlays ---------------- */

  /** Swaps in a fresh overlay element so listeners and inline styles never leak between screens. */
  private fresh(className: string): HTMLElement {
    const el = document.createElement('div');
    el.className = className;
    this.overlay.replaceWith(el);
    this.overlay = el;
    return el;
  }

  private open(html: string, dim = true): HTMLElement {
    const el = this.fresh(`overlay clickable${dim ? ' dim' : ''}`);
    el.innerHTML = html;
    return el;
  }

  close() {
    this.fresh('overlay hidden');
  }

  private button(el: HTMLElement, sel: string, fn: () => void) {
    const b = el.querySelector<HTMLElement>(sel);
    b?.addEventListener('click', (e) => {
      e.stopPropagation();
      audio.play('select');
      fn();
    });
  }

  /** Shows lines one at a time; tap to advance. Returns a function that closes it early. */
  dialogue(lines: Line[], done: () => void): () => void {
    if (!lines.length) {
      done();
      return () => {};
    }
    let i = 0;
    let shown = 0;
    let text = '';
    let finished = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    const el = this.open(`<div class="dialogue"><div class="portrait"></div><div style="flex:1"><div class="who"></div><div class="text"></div></div><div class="more">${tr('TAP')} ▶</div></div>`, false);
    el.style.alignItems = 'flex-end';
    const box = $(el, '.dialogue');
    const render = () => {
      const line = lines[i];
      text = tr(line.text);
      $(el, '.portrait').innerHTML = portrait(line.who);
      const who = $(el, '.who');
      who.textContent = tr(line.name ?? SPEAKER_NAME[line.who]);
      who.style.color = SPEAKER_COLOR[line.who];
      box.classList.toggle('glitchy', line.who === 'glitch');
      shown = 0;
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        shown = Math.min(text.length, shown + 2);
        $(el, '.text').textContent = text.slice(0, shown);
        if (shown % 6 === 0) audio.play('blip', line.who === 'bolt' ? 1.4 : line.who === 'halcyon' || line.who === 'glitch' ? 0.7 : 1);
        if (shown >= text.length && timer) {
          clearInterval(timer);
          timer = null;
        }
      }, 28);
    };
    const finish = () => {
      if (finished) return;
      finished = true;
      if (timer) clearInterval(timer);
      window.removeEventListener('keydown', onKey);
      this.close();
      done();
    };
    const advance = () => {
      if (shown < text.length) {
        shown = text.length;
        $(el, '.text').textContent = text;
        if (timer) clearInterval(timer);
        timer = null;
        return;
      }
      i += 1;
      if (i >= lines.length) finish();
      else render();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE' || e.code === 'KeyJ') advance();
    };
    el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      advance();
    });
    window.addEventListener('keydown', onKey);
    render();
    return finish;
  }

  /* ---------------- cinematics ---------------- */

  /** Letterbox bars and a skip button while a cutscene plays. Taps elsewhere hurry captions along. */
  cinema(on: boolean, onSkip?: () => void, onTap?: () => void) {
    this.cine.classList.toggle('on', on);
    this.skipBtn.classList.toggle('hidden', !on);
    this.onSkip = on ? (onSkip ?? null) : null;
    this.onCineTap = on ? (onTap ?? null) : null;
    if (!on) {
      this.caption(null);
      this.cine.classList.remove('glitching');
    }
  }

  caption(text: string | null) {
    const el = $(this.cine, '.caption');
    if (text) el.innerHTML = tr(text);
    el.classList.toggle('show', !!text);
  }

  bossCard(name: string, sub: string, color: string) {
    const el = $(this.cine, '.bosscard');
    el.innerHTML = `<div class="name" style="color:${color}">${tr(name)}</div><div class="sub">${tr(sub)}</div>`;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  }

  /** Fades the whole screen to (or from) a colour. The fade layer sits under captions and dialogue. */
  fade(color: string, to: number, seconds: number) {
    this.fadeEl.style.transition = `opacity ${seconds}s linear`;
    this.fadeEl.style.background = color;
    this.fadeEl.style.opacity = String(to);
  }

  glitch(seconds: number) {
    this.cine.classList.add('glitching');
    if (this.glitchT) clearTimeout(this.glitchT);
    this.glitchT = setTimeout(() => this.cine.classList.remove('glitching'), seconds * 1000);
  }

  /** Scrolling end credits; tap (after a moment) to finish early. */
  credits(html: string, done: () => void) {
    const el = this.open(`<div class="credits"><div class="roll">${html}</div></div>`);
    const roll = $(el, '.roll');
    let over = false;
    const finish = () => {
      if (over) return;
      over = true;
      done();
    };
    roll.addEventListener('animationend', finish);
    const start = performance.now();
    el.addEventListener('pointerdown', () => {
      if (performance.now() - start > 1500) finish();
    });
  }

  /** Simon-says light puzzle: watch LUX's pattern, then repeat it. */
  hack(length: number, done: (ok: boolean) => void) {
    const el = this.open(`<div class="panel hack">
      <h2>${tr('LUX HACK')}</h2>
      <div class="msg">${tr('Watch the lights...')}</div>
      <div class="pads"><div class="pad"></div><div class="pad"></div><div class="pad"></div><div class="pad"></div></div>
      <div class="dots">${'<i></i>'.repeat(length)}</div>
      <button class="menu-btn danger giveup" style="width:auto;padding:8px 16px;font-size:15px">${tr('Give up')}</button>
    </div>`);
    const pads = [...el.querySelectorAll<HTMLElement>('.pad')];
    const dots = [...el.querySelectorAll<HTMLElement>('.dots i')];
    const msg = $(el, '.msg');
    const seq = Array.from({ length }, () => Math.floor(Math.random() * 4));
    for (let k = 1; k < seq.length; k++) if (seq[k] === seq[k - 1] && Math.random() < 0.6) seq[k] = (seq[k] + 1 + Math.floor(Math.random() * 3)) % 4;
    let pos = 0;
    let listening = false;
    let finished = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const flash = (i: number, ms = 360) => {
      pads[i].classList.add('lit');
      audio.play(`tone${i}` as 'tone0');
      timers.push(setTimeout(() => pads[i].classList.remove('lit'), ms));
    };
    const show = () => {
      listening = false;
      pos = 0;
      dots.forEach((d) => d.classList.remove('on'));
      msg.textContent = tr('Watch the lights...');
      seq.forEach((p, k) => timers.push(setTimeout(() => flash(p), 700 + k * 560)));
      timers.push(
        setTimeout(() => {
          listening = true;
          msg.textContent = tr('Your turn! Repeat the pattern.');
        }, 700 + seq.length * 560),
      );
    };
    const end = (ok: boolean) => {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      window.removeEventListener('keydown', onKey);
      timers.push(
        setTimeout(
          () => {
            this.close();
            done(ok);
          },
          ok ? 700 : 0,
        ),
      );
    };
    const tap = (i: number) => {
      if (!listening || finished) return;
      flash(i, 220);
      if (seq[pos] === i) {
        dots[pos].classList.add('on');
        pos += 1;
        if (pos >= seq.length) {
          listening = false;
          msg.textContent = tr('Hacked!');
          audio.play('success');
          end(true);
        }
      } else {
        listening = false;
        msg.textContent = tr('Oops! Watch again...');
        audio.play('fail');
        timers.push(setTimeout(show, 900));
      }
    };
    pads.forEach((p, i) =>
      p.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        tap(i);
      }),
    );
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, number> = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3, KeyW: 0, KeyD: 1, KeyS: 2, KeyA: 3 };
      if (map[e.code] !== undefined) tap(map[e.code]);
    };
    window.addEventListener('keydown', onKey);
    this.button(el, '.giveup', () => end(false));
    show();
  }

  title(opts: { canContinue: boolean; continueText: string; hasDecks: boolean; onContinue: () => void; onNew: () => void; onDecks: () => void; onSettings: () => void }) {
    const el = this.open(`<div class="overlay title-screen" style="position:absolute">
      <div class="title-logo"><div class="name logo">${upper(tr(GAME_NAME))}</div><div class="tag">${tr('Six decks. One brave engineer. One very nervous robot.')}</div></div>
      <div class="title-menu">
        ${opts.canContinue ? `<button class="menu-btn primary cont">▶ ${tr('Continue')} <small>${tr(opts.continueText)}</small></button>` : ''}
        <button class="menu-btn ${opts.canContinue ? '' : 'primary'} new">${opts.canContinue ? tr('New Game') : `▶ ${tr('New Game')}`}</button>
        ${opts.hasDecks ? `<button class="menu-btn decks">${tr('Elevator: replay decks')}</button>` : ''}
        <button class="menu-btn settings">${tr('Settings')}</button>
      </div>
    </div>`, false);
    el.style.padding = '0';
    this.button(el, '.cont', opts.onContinue);
    this.button(el, '.new', opts.onNew);
    this.button(el, '.decks', opts.onDecks);
    this.button(el, '.settings', opts.onSettings);
  }

  /**
   * The boot splash: emblem and logo animate in over black, a loading bar fills while the game warms
   * up (`ready`), then the 3D title scene fades in behind "TAP TO START".
   */
  tapToStart(ready: Promise<void>, done: () => void) {
    const el = this.open(`<div class="boot">
      <div class="boot-bg"></div>
      <div class="boot-core">
        <div class="boot-emblem">${emblemSvg(180)}</div>
        <div class="boot-logo"><span>${upper(tr(GAME_NAME))}</span></div>
        <div class="boot-tag">${tr('Six decks. One brave engineer. One very nervous robot.')}</div>
        <div class="boot-load"><i></i></div>
        <div class="boot-tap">${tr('TAP TO START')}</div>
      </div>
      <div class="boot-foot">${tr('Headphones on for the best adventure')}</div>
    </div>`, false);
    el.style.padding = '0';
    const bar = $<HTMLElement>(el, '.boot-load i');
    let loaded = false;
    let fake = 0;
    const tick = setInterval(() => {
      fake = Math.min(0.9, fake + 0.04);
      bar.style.width = `${Math.round((loaded ? 1 : fake) * 100)}%`;
    }, 50);
    const minShow = new Promise((r) => setTimeout(r, 1500));
    void Promise.all([ready, minShow]).then(() => {
      loaded = true;
      clearInterval(tick);
      bar.style.width = '100%';
      setTimeout(() => el.querySelector('.boot')?.classList.add('ready'), 250);
    });
    const go = () => {
      if (!loaded) return;
      window.removeEventListener('keydown', go);
      done();
    };
    el.addEventListener('pointerdown', go);
    window.addEventListener('keydown', go);
  }

  confirm(text: string, yes: () => void, no: () => void) {
    const el = this.open(`<div class="panel" style="width:min(420px,80vw)"><h2>${tr('Are you sure?')}</h2><p style="font-size:17px">${tr(text)}</p>
      <div class="grid2"><button class="menu-btn danger yes">${tr('Yes')}</button><button class="menu-btn no">${tr('No')}</button></div></div>`);
    this.button(el, '.yes', yes);
    this.button(el, '.no', no);
  }

  card(index: number, name: string, sub: string, color: string, done: () => void) {
    this.open(`<div class="card"><div class="deck">${tr('DECK {n} OF 6', { n: index })}</div><div class="deckname" style="color:${color}">${upper(tr(name))}</div><div class="sub">${tr(sub)}</div></div>`);
    setTimeout(() => {
      this.close();
      done();
    }, 2300);
  }

  pause(opts: { deck: string; shards: string; colonists: string; quests: { text: string; done: boolean; progress: string; reward: string }[]; onResume: () => void; onSettings: () => void; onHelp: () => void; onRestart: () => void; onQuit: () => void }) {
    const el = this.open(`<div class="panel pause-panel">
      <h2>${tr('PAUSED')} · ${upper(tr(opts.deck))}</h2>
      <div class="row">
        <div class="col-menu">
          <button class="menu-btn primary resume">▶ ${tr('Resume')}</button>
          <button class="menu-btn help">${tr('How to play')}</button>
          <button class="menu-btn settings">${tr('Settings')}</button>
          <button class="menu-btn restart">${tr('Back to last checkpoint')}</button>
          <button class="menu-btn danger quit">${tr('Save & quit to title')}</button>
        </div>
        <div class="col-info">
          <div class="stat"><span>${tr('Memory shards')}</span><b>${opts.shards}</b></div>
          <div class="stat"><span>${tr('Colonists rescued')}</span><b>${opts.colonists}</b></div>
          <div class="quests"><div class="qh">${tr('SIDE QUESTS ON THIS DECK')}</div>${opts.quests
            .map((q) => `<div class="q ${q.done ? 'done' : ''}"><i>${q.done ? '✔' : ''}</i><div><b>${q.text}</b><small>${q.progress} · ${tr('Reward')}: ${q.reward}</small></div></div>`)
            .join('')}</div>
        </div>
      </div></div>`);
    this.button(el, '.resume', opts.onResume);
    this.button(el, '.help', opts.onHelp);
    this.button(el, '.settings', opts.onSettings);
    this.button(el, '.restart', opts.onRestart);
    this.button(el, '.quit', opts.onQuit);
  }

  help(back: () => void) {
    const item = (color: string, name: string, text: string) => `<div><b style="color:${color}">${name}</b>: ${text}</div>`;
    const el = this.open(`<div class="panel help-panel"><h2>${tr('HOW TO PLAY')}</h2>
      <div class="help-grid">
        ${item('var(--accent)', tr('Move'), tr('drag on the left side. Drag on the right side to turn the camera.'))}
        ${item('#7dff9a', tr('JUMP'), tr('tap for a hop, hold for a big jump. With the Jet Boots, jump again in mid-air.'))}
        ${item('#7fe6ff', tr('BLAST'), tr('tap to shoot (it aims for you). HOLD to charge a big FIREBALL, then let go.'))}
        ${item('#ffd166', tr('SPIN'), tr('a spin attack that also blocks enemy attacks. You get 3 in a row, then a long recharge. In mid-air it becomes a GROUND POUND for red switches.'))}
        ${item('#b58cff', tr('DASH'), tr('ram through enemies and zoom over gaps. Each dash uses one energy cell: refill at checkpoints and with violet energy cells.'))}
        ${item('#8ab4ff', tr('PULSE'), tr('LUX’s force pulse hits every enemy around you and shorts out lasers for a few seconds. It takes a long time to recharge.'))}
      </div>
      <p class="keys">${tr('Keyboard: WASD move · Space jump · J blast · K spin/pound · L dash · I pulse · E use · Q/R camera · Esc pause')}</p>
      <button class="menu-btn primary back">${tr('Got it!')}</button></div>`);
    this.button(el, '.back', back);
  }

  settings(s: Settings, change: (s: Settings) => void, back: () => void, reset?: () => void) {
    const q: Quality[] = ['low', 'medium', 'high'];
    const qName: Record<Quality, string> = { low: tr('Low'), medium: tr('Medium'), high: tr('High') };
    const el = this.open(`<div class="panel settings-panel">
      <div class="panel-head"><h2>${tr('SETTINGS')}</h2><button class="icon-btn back" aria-label="${tr('Done')}">${ICON.close}</button></div>
      <div class="settings-grid">
        <label class="slider"><span>${tr('Music')}</span><input type="range" min="0" max="1" step="0.05" value="${s.music}" class="music"/></label>
        <label class="slider"><span>${tr('Sounds')}</span><input type="range" min="0" max="1" step="0.05" value="${s.sfx}" class="sfx"/></label>
        <label class="slider"><span>${tr('Camera speed')}</span><input type="range" min="0.4" max="2" step="0.1" value="${s.camSpeed}" class="cam"/></label>
        <div class="slider"><span>${tr('Graphics')}</span><div class="seg quality">${q.map((x) => `<button data-q="${x}" class="${s.quality === x ? 'on' : ''}">${qName[x]}</button>`).join('')}</div></div>
        <div class="slider"><span>${tr('Vibration')}</span><div class="seg vib"><button data-v="1" class="${s.haptics ? 'on' : ''}">${tr('On')}</button><button data-v="0" class="${s.haptics ? '' : 'on'}">${tr('Off')}</button></div></div>
        <div class="slider"><span>${ICON.globe}</span><div class="seg lang">${LANGS.map((l) => `<button data-l="${l.id}" class="${s.lang === l.id ? 'on' : ''}">${l.name}</button>`).join('')}</div></div>
      </div>
      <p class="note">${tr('Graphics changes apply when you enter the next deck.')}</p>
      <div class="grid2"><button class="menu-btn primary done">${tr('Done')}</button>${reset ? `<button class="menu-btn danger reset">${tr('Erase save')}</button>` : '<span></span>'}</div></div>`);
    const cur = { ...s };
    const emit = () => change({ ...cur });
    $<HTMLInputElement>(el, '.music').addEventListener('input', (e) => {
      cur.music = Number((e.target as HTMLInputElement).value);
      emit();
    });
    $<HTMLInputElement>(el, '.sfx').addEventListener('input', (e) => {
      cur.sfx = Number((e.target as HTMLInputElement).value);
      emit();
      audio.play('bolt');
    });
    $<HTMLInputElement>(el, '.cam').addEventListener('input', (e) => {
      cur.camSpeed = Number((e.target as HTMLInputElement).value);
      emit();
    });
    const seg = (sel: string, pick: (b: HTMLElement) => void) => {
      for (const b of el.querySelectorAll<HTMLElement>(`${sel} button`)) {
        b.addEventListener('click', () => {
          pick(b);
          el.querySelectorAll(`${sel} button`).forEach((x) => x.classList.toggle('on', x === b));
          audio.play('select');
          emit();
        });
      }
    };
    seg('.quality', (b) => (cur.quality = b.dataset.q as Quality));
    seg('.vib', (b) => (cur.haptics = b.dataset.v === '1'));
    for (const b of el.querySelectorAll<HTMLElement>('.lang button')) {
      b.addEventListener('click', () => {
        if (cur.lang === b.dataset.l) return;
        cur.lang = b.dataset.l as Settings['lang'];
        audio.play('select');
        emit();
        // Redraw this screen in the new language.
        this.settings(cur, change, back, reset);
      });
    }
    this.button(el, '.back', back);
    this.button(el, '.done', back);
    if (reset) this.button(el, '.reset', reset);
  }

  shop(save: SaveData, buy: (item: ShopItem) => void, close: () => void) {
    const render = (bought?: UpgradeId) => {
      const items = SHOP.map((it) => {
        const lvl = save.upgrades[it.id] ?? 0;
        const maxed = lvl >= it.prices.length;
        const price = it.prices[lvl];
        const afford = !maxed && save.bolts >= price;
        const stars = `<span class="stars">${'★'.repeat(lvl)}<em>${'★'.repeat(it.prices.length - lvl)}</em></span>`;
        return `<div class="shop-item ${maxed ? 'maxed' : ''} ${bought === it.id ? 'bought' : ''}"><div class="icon">${it.icon}</div><div class="info"><b>${tr(it.name)}</b>${stars}<i>${tr(it.desc)}</i></div>
          <button class="buy" data-id="${it.id}" ${afford ? '' : 'disabled'}>${maxed ? tr('MAX') : `${ICON.bolt}${price}`}</button></div>`;
      }).join('');
      const el = this.open(`<div class="panel shop-panel">
        <div class="panel-head"><div class="portrait">${portrait('vendy')}</div>
        <div class="shop-title"><h2>${tr('PANDORA’S UPGRADES')}</h2><div class="tagline">${tr('“Bolts in, awesome out!”')}</div></div>
        <div class="counter">${ICON.bolt}<b>${save.bolts}</b></div><button class="icon-btn close" aria-label="${tr('Leave shop')}">${ICON.close}</button></div>
        <div class="shop-grid">${items}</div></div>`);
      for (const b of el.querySelectorAll<HTMLElement>('.buy')) {
        b.addEventListener('click', () => {
          const it = SHOP.find((x) => x.id === b.dataset.id);
          if (!it) return;
          buy(it);
          render(it.id);
        });
      }
      this.button(el, '.close', close);
    };
    render();
  }

  results(r: { deck: string; time: string; bolts: number; shards: string; colonists: string; next: string | null }, next: () => void) {
    const el = this.open(`<div class="panel card" style="width:min(520px,88vw)">
      <div class="deck">${tr('DECK COMPLETE')}</div><div class="deckname" style="color:var(--good);font-size:34px">${upper(tr(r.deck))}</div>
      <div class="stat"><span>${tr('Time')}</span><b>${r.time}</b></div>
      <div class="stat"><span>${tr('Bolts collected')}</span><b>${r.bolts}</b></div>
      <div class="stat"><span>${tr('Memory shards')}</span><b>${r.shards}</b></div>
      ${r.colonists ? `<div class="stat"><span>${tr('Colonists rescued')}</span><b>${r.colonists}</b></div>` : ''}
      <button class="menu-btn primary next" style="margin-top:14px">${r.next ? `${tr('Ride the lift to {deck}', { deck: tr(r.next) })} ▲` : tr('Continue')}</button></div>`);
    this.button(el, '.next', next);
  }

  decks(list: DeckInfo[], pick: (id: string) => void, back: () => void) {
    const el = this.open(`<div class="panel" style="width:min(760px,92vw)"><h2>${tr('ELEVATOR')}</h2>
      <div class="grid2">${list
        .map(
          (d) => `<button class="menu-btn deck" data-id="${d.id}" ${d.unlocked ? '' : 'disabled'} style="border-color:${d.color}">
          <span style="color:${d.color};font-family:Orbitron,sans-serif;font-weight:800">${d.index}</span> ${d.unlocked ? tr(d.name) : '???'}
          <small>${d.unlocked ? `${d.completed ? '✓ ' : ''}◆ ${d.shards}/${d.shardTotal}` : ICON.lock}</small></button>`,
        )
        .join('')}</div>
      <button class="menu-btn back" style="margin-top:10px">${tr('Back')}</button></div>`);
    for (const b of el.querySelectorAll<HTMLElement>('.deck')) {
      b.addEventListener('click', () => {
        audio.play('select');
        pick(b.dataset.id as string);
      });
    }
    this.button(el, '.back', back);
  }

  down(done: () => void) {
    this.open(`<div class="big-msg" style="color:#ff8aa0">${tr('OUCH!')}</div>`);
    setTimeout(() => {
      this.close();
      done();
    }, 1600);
  }

  message(html: string) {
    this.open(html);
  }

  ending(kind: 'saved' | 'friends', paragraphs: string[], stats: [string, string][], done: () => void) {
    const color = kind === 'friends' ? 'var(--pink)' : 'var(--good)';
    const title = kind === 'friends' ? tr('THE GARDEN BETWEEN STARS') : tr('THE {ship} IS SAVED!', { ship: upper(tr(SHIP)) });
    const el = this.open(`<div class="panel" style="width:min(820px,94vw);text-align:center">
      <div class="deck" style="letter-spacing:.3em;color:var(--dim);font-family:Orbitron,sans-serif">${kind === 'friends' ? tr('SECRET ENDING') : tr('THE END')}</div>
      <div class="big-msg" style="color:${color};margin:6px 0 12px">${title}</div>
      <div class="story" style="font-size:17px;max-width:none">${paragraphs.map((p) => `<p>${tr(p)}</p>`).join('')}</div>
      <div class="grid2" style="text-align:left;margin:8px 0">${stats.map(([k, v]) => `<div class="stat"><span>${tr(k)}</span><b>${v}</b></div>`).join('')}</div>
      <button class="menu-btn primary done">${tr('Back to title')}</button></div>`);
    this.button(el, '.done', done);
  }
}
