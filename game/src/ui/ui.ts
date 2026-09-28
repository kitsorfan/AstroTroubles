import { audio } from '../core/audio';
import type { ButtonName, Input } from '../core/input';
import type { Quality, SaveData, Settings, UpgradeId } from '../core/save';
import type { Line, Speaker } from '../world/levelTypes';
import { ICON, PORTRAIT, SPEAKER_COLOR, SPEAKER_NAME } from './icons';

const $ = <T extends HTMLElement = HTMLElement>(root: ParentNode, sel: string) => root.querySelector(sel) as T;

function h(html: string): HTMLElement {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild as HTMLElement;
}

export interface ShopItem {
  id: UpgradeId;
  name: string;
  desc: string;
  prices: number[];
  icon: string;
}

export const SHOP: ShopItem[] = [
  { id: 'heart', name: 'Heart Plating', desc: '+1 max heart', prices: [150, 300, 500], icon: ICON.heart(true) },
  { id: 'blaster', name: 'Blaster Power', desc: '+1 damage for blasts, spins and pounds', prices: [250, 600], icon: ICON.shoot },
  { id: 'rapid', name: 'Rapid Fire', desc: 'Shoot faster', prices: [200, 450], icon: ICON.dash },
  { id: 'boltZap', name: 'BOLT Zapper', desc: 'BOLT zaps enemies more often', prices: [180, 420], icon: ICON.star },
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

export class UI {
  private hud: HTMLElement;
  private overlay: HTMLElement;
  private toastEl: HTMLElement;
  private toastT: ReturnType<typeof setTimeout> | null = null;
  private stickEl: HTMLElement;
  private actionEl: HTMLElement;
  private dashBtn: HTMLElement;
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

  constructor(
    private root: HTMLElement,
    private input: Input,
  ) {
    this.hud = h(`<div class="hidden">
      <div class="hud-left"><div class="hearts"></div><div class="counter bolts">${ICON.bolt}<b>0</b></div></div>
      <div class="hud-top"><div class="objective hidden"></div><div class="bossbar hidden"><div class="name"></div><div class="track"><div class="fill"></div></div></div></div>
      <div class="hud-right"><div class="shards"></div><div class="round-btn clickable pause">${ICON.pause}</div></div>
      <div class="stick hidden"><div class="knob"></div></div>
      <div class="stick-hint">MOVE</div>
      <div class="buttons">
        <div class="btn jump clickable" data-b="jump">${ICON.jump}<span>JUMP</span></div>
        <div class="btn shoot clickable" data-b="shoot">${ICON.shoot}<span>BLAST</span></div>
        <div class="btn spin clickable" data-b="spin">${ICON.spin}<span>SPIN</span></div>
        <div class="btn dash clickable hidden" data-b="dash">${ICON.dash}<span>DASH</span></div>
      </div>
      <div class="action clickable hidden">${PORTRAIT.bolt}<b></b></div>
      <div class="toast"><div class="portrait"></div><div class="t"></div></div>
      <div class="fps"></div>
    </div>`);
    this.overlay = h(`<div class="overlay hidden"></div>`);
    this.fadeEl = h(`<div class="fade"></div>`);
    this.cine = h(`<div class="cine">
      <div class="tap"></div><div class="bar top"></div><div class="bar bottom"></div>
      <div class="caption"></div><div class="bosscard"></div><div class="glitch-fx"></div>
    </div>`);
    this.skipBtn = h(`<button class="skip clickable hidden">SKIP ▶▶</button>`);
    // Order matters: fades under everything, cutscene bars under dialogue, and the skip button on top.
    root.append(this.fadeEl, this.hud, this.cine, this.overlay, this.skipBtn);
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

  /* ---------------- HUD ---------------- */

  showHud(on: boolean) {
    this.hud.classList.toggle('hidden', !on);
  }

  showControls(on: boolean) {
    for (const sel of ['.buttons', '.stick-hint']) $(this.hud, sel).classList.toggle('hidden', !on);
    if (!on) this.actionEl.classList.add('hidden');
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
    const el = $(this.hud, '.objective');
    el.textContent = text;
    el.classList.toggle('hidden', !text);
  }

  setBoss(name: string | null, frac: number) {
    this.bossEl.classList.toggle('hidden', !name);
    if (!name) return;
    $(this.bossEl, '.name').textContent = name;
    $(this.bossEl, '.fill').style.width = `${Math.max(0, frac) * 100}%`;
  }

  setAction(label: string | null, kind: 'action' | 'shield' = 'action') {
    this.actionEl.classList.toggle('hidden', !label);
    this.actionEl.classList.toggle('shield', kind === 'shield');
    if (label) $(this.actionEl, 'b').textContent = label;
  }

  setDash(on: boolean) {
    this.dashBtn.classList.toggle('hidden', !on);
  }

  setFps(text: string) {
    this.fpsEl.textContent = text;
  }

  toast(text: string, who: Speaker = 'bolt') {
    $(this.toastEl, '.portrait').innerHTML = PORTRAIT[who];
    $(this.toastEl, '.t').textContent = text;
    this.toastEl.classList.add('show');
    if (this.toastT) clearTimeout(this.toastT);
    this.toastT = setTimeout(() => this.toastEl.classList.remove('show'), 2400 + text.length * 35);
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
    let finished = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    const el = this.open(`<div class="dialogue"><div class="portrait"></div><div style="flex:1"><div class="who"></div><div class="text"></div></div><div class="more">TAP ▶</div></div>`, false);
    el.style.alignItems = 'flex-end';
    const box = $(el, '.dialogue');
    const render = () => {
      const line = lines[i];
      $(el, '.portrait').innerHTML = PORTRAIT[line.who];
      const who = $(el, '.who');
      who.textContent = line.name ?? SPEAKER_NAME[line.who];
      who.style.color = SPEAKER_COLOR[line.who];
      box.classList.toggle('glitchy', line.who === 'glitch');
      shown = 0;
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        shown = Math.min(line.text.length, shown + 2);
        $(el, '.text').textContent = line.text.slice(0, shown);
        if (shown % 6 === 0) audio.play('blip', line.who === 'bolt' ? 1.4 : line.who === 'halcyon' || line.who === 'glitch' ? 0.7 : 1);
        if (shown >= line.text.length && timer) {
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
      const line = lines[i];
      if (shown < line.text.length) {
        shown = line.text.length;
        $(el, '.text').textContent = line.text;
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
    if (text) el.innerHTML = text;
    el.classList.toggle('show', !!text);
  }

  bossCard(name: string, sub: string, color: string) {
    const el = $(this.cine, '.bosscard');
    el.innerHTML = `<div class="name" style="color:${color}">${name}</div><div class="sub">${sub}</div>`;
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

  /** Simon-says light puzzle: watch BOLT's pattern, then repeat it. */
  hack(length: number, done: (ok: boolean) => void) {
    const el = this.open(`<div class="panel hack">
      <h2>BOLT HACK</h2>
      <div class="msg">Watch the lights...</div>
      <div class="pads"><div class="pad"></div><div class="pad"></div><div class="pad"></div><div class="pad"></div></div>
      <div class="dots">${'<i></i>'.repeat(length)}</div>
      <button class="menu-btn danger giveup" style="width:auto;padding:8px 16px;font-size:15px">Give up</button>
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
      msg.textContent = 'Watch the lights...';
      seq.forEach((p, k) => timers.push(setTimeout(() => flash(p), 700 + k * 560)));
      timers.push(
        setTimeout(() => {
          listening = true;
          msg.textContent = 'Your turn! Repeat the pattern.';
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
          msg.textContent = 'Hacked!';
          audio.play('success');
          end(true);
        }
      } else {
        listening = false;
        msg.textContent = 'Oops! Watch again...';
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
      <div class="title-logo"><div class="kicker">HULL BREACH</div><div class="name logo">LEVIATHAN</div><div class="tag">Six decks. One brave engineer. One very nervous robot.</div></div>
      <div class="title-menu">
        ${opts.canContinue ? `<button class="menu-btn primary cont">▶ Continue <small>${opts.continueText}</small></button>` : ''}
        <button class="menu-btn ${opts.canContinue ? '' : 'primary'} new">${opts.canContinue ? 'New Game' : '▶ New Game'}</button>
        ${opts.hasDecks ? '<button class="menu-btn decks">Elevator: replay decks</button>' : ''}
        <button class="menu-btn settings">Settings</button>
      </div>
    </div>`, false);
    el.style.padding = '0';
    this.button(el, '.cont', opts.onContinue);
    this.button(el, '.new', opts.onNew);
    this.button(el, '.decks', opts.onDecks);
    this.button(el, '.settings', opts.onSettings);
  }

  tapToStart(done: () => void) {
    const el = this.open(`<div class="overlay title-screen" style="position:absolute">
      <div class="title-logo"><div class="kicker">HULL BREACH</div><div class="name logo">LEVIATHAN</div></div>
      <div class="tap-start">Tap to start</div></div>`, false);
    el.style.padding = '0';
    const go = () => {
      window.removeEventListener('keydown', go);
      done();
    };
    el.addEventListener('pointerdown', go, { once: true });
    window.addEventListener('keydown', go);
  }

  confirm(text: string, yes: () => void, no: () => void) {
    const el = this.open(`<div class="panel" style="width:min(420px,80vw)"><h2>Are you sure?</h2><p style="font-size:17px">${text}</p>
      <div class="grid2"><button class="menu-btn danger yes">Yes</button><button class="menu-btn no">No</button></div></div>`);
    this.button(el, '.yes', yes);
    this.button(el, '.no', no);
  }

  story(pages: string[], done: () => void) {
    let i = 0;
    const el = this.open(`<div class="story"></div><div style="position:absolute;bottom:calc(14px + var(--safe-b));right:calc(24px + var(--safe-r));display:flex;gap:10px"><button class="menu-btn skip" style="width:auto;padding:8px 16px;font-size:15px">Skip</button></div>`);
    const story = $(el, '.story');
    const next = () => {
      if (i >= pages.length) {
        window.removeEventListener('keydown', next);
        done();
        return;
      }
      story.innerHTML = `<p>${pages[i]}</p><p style="font-size:14px;color:var(--dim)">tap to continue</p>`;
      i += 1;
    };
    el.addEventListener('pointerdown', next);
    window.addEventListener('keydown', next);
    this.button(el, '.skip', () => {
      i = pages.length;
      next();
    });
    next();
  }

  card(index: number, name: string, sub: string, color: string, done: () => void) {
    this.open(`<div class="card"><div class="deck">DECK ${index} OF 6</div><div class="deckname" style="color:${color}">${name.toUpperCase()}</div><div class="sub">${sub}</div></div>`);
    setTimeout(() => {
      this.close();
      done();
    }, 2300);
  }

  pause(opts: { deck: string; shards: string; colonists: string; onResume: () => void; onSettings: () => void; onHelp: () => void; onRestart: () => void; onQuit: () => void }) {
    const el = this.open(`<div class="panel" style="width:min(760px,90vw)">
      <h2>PAUSED · ${opts.deck}</h2>
      <div class="row">
        <div style="flex:1">
          <button class="menu-btn primary resume">▶ Resume</button>
          <button class="menu-btn help">How to play</button>
          <button class="menu-btn settings">Settings</button>
          <button class="menu-btn restart">Back to last checkpoint</button>
          <button class="menu-btn danger quit">Save & quit to title</button>
        </div>
        <div style="flex:1">
          <div class="stat"><span>Memory shards</span><b>${opts.shards}</b></div>
          <div class="stat"><span>Colonists rescued</span><b>${opts.colonists}</b></div>
          <p style="color:var(--dim);font-size:14px;line-height:1.4">Find all 18 memory shards across the ship to learn BOLT's secret... and see the hidden ending.</p>
        </div>
      </div></div>`);
    this.button(el, '.resume', opts.onResume);
    this.button(el, '.help', opts.onHelp);
    this.button(el, '.settings', opts.onSettings);
    this.button(el, '.restart', opts.onRestart);
    this.button(el, '.quit', opts.onQuit);
  }

  help(back: () => void) {
    const el = this.open(`<div class="panel" style="width:min(780px,92vw)"><h2>HOW TO PLAY</h2>
      <div class="grid2" style="font-size:16px;line-height:1.4">
        <div><b style="color:var(--accent)">Move</b>: drag anywhere on the left side.<br/><b style="color:var(--accent)">Camera</b>: drag on the right side.</div>
        <div><b style="color:#7dff9a">JUMP</b>: tap for a hop, hold for a big jump. With Jet Boots, jump again in the air!</div>
        <div><b style="color:#7fe6ff">BLAST</b>: shoots at the nearest enemy. Hold to keep firing.</div>
        <div><b style="color:#ffd166">SPIN</b>: spin attack on the ground. In the air it becomes a <b>GROUND POUND</b>, which presses big red switches!</div>
        <div><b style="color:#ff9ae0">DASH</b>: zoom across gaps (after you find the Dash Thrusters).</div>
        <div><b style="color:#5ee0ff">BOLT button</b>: appears near things BOLT can use: hacking, power cells, the shop.</div>
      </div>
      <p style="color:var(--dim);font-size:14px">Keyboard: WASD move · Space jump · J blast · K spin/pound · L dash · E use · Q/R camera · Esc pause</p>
      <button class="menu-btn primary back">Got it!</button></div>`);
    this.button(el, '.back', back);
  }

  settings(s: Settings, change: (s: Settings) => void, back: () => void, reset?: () => void) {
    const q: Quality[] = ['low', 'medium', 'high'];
    const el = this.open(`<div class="panel" style="width:min(560px,90vw)"><h2>SETTINGS</h2>
      <div class="slider">Music <input type="range" min="0" max="1" step="0.05" value="${s.music}" class="music"/></div>
      <div class="slider">Sounds <input type="range" min="0" max="1" step="0.05" value="${s.sfx}" class="sfx"/></div>
      <div class="slider">Camera speed <input type="range" min="0.4" max="2" step="0.1" value="${s.camSpeed}" class="cam"/></div>
      <div class="slider">Graphics <div class="seg quality">${q.map((x) => `<button data-q="${x}" class="${s.quality === x ? 'on' : ''}">${x[0].toUpperCase() + x.slice(1)}</button>`).join('')}</div></div>
      <div class="slider">Vibration <div class="seg vib"><button data-v="1" class="${s.haptics ? 'on' : ''}">On</button><button data-v="0" class="${s.haptics ? '' : 'on'}">Off</button></div></div>
      <p style="color:var(--dim);font-size:13px;margin:4px 0 8px">Graphics changes apply when you enter the next deck.</p>
      <div class="grid2"><button class="menu-btn primary back">Done</button>${reset ? '<button class="menu-btn danger reset">Erase save</button>' : ''}</div></div>`);
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
    for (const b of el.querySelectorAll<HTMLElement>('.quality button')) {
      b.addEventListener('click', () => {
        cur.quality = b.dataset.q as Quality;
        el.querySelectorAll('.quality button').forEach((x) => x.classList.toggle('on', x === b));
        emit();
      });
    }
    for (const b of el.querySelectorAll<HTMLElement>('.vib button')) {
      b.addEventListener('click', () => {
        cur.haptics = b.dataset.v === '1';
        el.querySelectorAll('.vib button').forEach((x) => x.classList.toggle('on', x === b));
        emit();
      });
    }
    this.button(el, '.back', back);
    if (reset) this.button(el, '.reset', reset);
  }

  shop(save: SaveData, buy: (item: ShopItem) => void, close: () => void) {
    const render = () => {
      const items = SHOP.map((it) => {
        const lvl = save.upgrades[it.id] ?? 0;
        const maxed = lvl >= it.prices.length;
        const price = it.prices[lvl];
        const afford = !maxed && save.bolts >= price;
        return `<div class="shop-item"><div class="icon">${it.icon}</div><div class="info"><b>${it.name} ${'★'.repeat(lvl)}${'☆'.repeat(it.prices.length - lvl)}</b><i>${it.desc}</i></div>
          <button class="buy" data-id="${it.id}" ${afford ? '' : 'disabled'}>${maxed ? 'MAX' : `${ICON.bolt}${price}`}</button></div>`;
      }).join('');
      const el = this.open(`<div class="panel" style="width:min(820px,94vw)">
        <div class="row" style="align-items:center;margin-bottom:10px"><div class="portrait" style="width:64px;height:64px">${PORTRAIT.vendy}</div>
        <div style="flex:1"><h2 style="margin:0">VENDY'S UPGRADES</h2><div style="color:var(--dim)">"Bolts in, awesome out!"</div></div>
        <div class="counter" style="font-size:20px">${ICON.bolt}<b>${save.bolts}</b></div></div>
        <div class="grid2">${items}</div>
        <button class="menu-btn primary close" style="margin-top:12px">Leave shop</button></div>`);
      for (const b of el.querySelectorAll<HTMLElement>('.buy')) {
        b.addEventListener('click', () => {
          const it = SHOP.find((x) => x.id === b.dataset.id);
          if (!it) return;
          buy(it);
          render();
        });
      }
      this.button(el, '.close', close);
    };
    render();
  }

  results(r: { deck: string; time: string; bolts: number; shards: string; colonists: string; next: string | null }, next: () => void) {
    const el = this.open(`<div class="panel card" style="width:min(520px,88vw)">
      <div class="deck">DECK COMPLETE</div><div class="deckname" style="color:var(--good);font-size:34px">${r.deck.toUpperCase()}</div>
      <div class="stat"><span>Time</span><b>${r.time}</b></div>
      <div class="stat"><span>Bolts collected</span><b>${r.bolts}</b></div>
      <div class="stat"><span>Memory shards</span><b>${r.shards}</b></div>
      ${r.colonists ? `<div class="stat"><span>Colonists rescued</span><b>${r.colonists}</b></div>` : ''}
      <button class="menu-btn primary next" style="margin-top:14px">${r.next ? `Ride the lift to ${r.next} ▲` : 'Continue'}</button></div>`);
    this.button(el, '.next', next);
  }

  decks(list: DeckInfo[], pick: (id: string) => void, back: () => void) {
    const el = this.open(`<div class="panel" style="width:min(760px,92vw)"><h2>ELEVATOR</h2>
      <div class="grid2">${list
        .map(
          (d) => `<button class="menu-btn deck" data-id="${d.id}" ${d.unlocked ? '' : 'disabled'} style="border-color:${d.color}">
          <span style="color:${d.color};font-family:Orbitron;font-weight:800">${d.index}</span> ${d.unlocked ? d.name : '???'}
          <small>${d.unlocked ? `${d.completed ? '✓ ' : ''}◆ ${d.shards}/${d.shardTotal}` : ICON.lock}</small></button>`,
        )
        .join('')}</div>
      <button class="menu-btn back" style="margin-top:10px">Back</button></div>`);
    for (const b of el.querySelectorAll<HTMLElement>('.deck')) {
      b.addEventListener('click', () => {
        audio.play('select');
        pick(b.dataset.id as string);
      });
    }
    this.button(el, '.back', back);
  }

  down(done: () => void) {
    this.open(`<div class="big-msg" style="color:#ff8aa0">OUCH!</div>`);
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
    const title = kind === 'friends' ? 'THE GARDEN BETWEEN STARS' : 'THE LEVIATHAN IS SAVED!';
    const el = this.open(`<div class="panel" style="width:min(820px,94vw);text-align:center">
      <div class="deck" style="letter-spacing:.3em;color:var(--dim);font-family:Orbitron">${kind === 'friends' ? 'SECRET ENDING' : 'THE END'}</div>
      <div class="big-msg" style="color:${color};margin:6px 0 12px">${title}</div>
      <div class="story" style="font-size:17px;max-width:none">${paragraphs.map((p) => `<p>${p}</p>`).join('')}</div>
      <div class="grid2" style="text-align:left;margin:8px 0">${stats.map(([k, v]) => `<div class="stat"><span>${k}</span><b>${v}</b></div>`).join('')}</div>
      <button class="menu-btn primary done">Back to title</button></div>`);
    this.button(el, '.done', done);
  }
}
