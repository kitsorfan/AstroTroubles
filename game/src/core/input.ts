export type ButtonName = 'jump' | 'shoot' | 'spin' | 'dash' | 'action' | 'pause';

const KEYMAP: Record<string, ButtonName> = {
  Space: 'jump',
  KeyJ: 'shoot',
  Enter: 'shoot',
  KeyK: 'spin',
  KeyL: 'dash',
  ShiftLeft: 'dash',
  ShiftRight: 'dash',
  KeyE: 'action',
  KeyF: 'action',
  Escape: 'pause',
  KeyP: 'pause',
};

const STICK_RADIUS = 58;

export class Input {
  moveX = 0;
  moveZ = 0;
  camDrag = 0;
  private held = new Set<ButtonName>();
  private pressed = new Set<ButtonName>();
  private keys = new Set<string>();
  private stickId: number | null = null;
  private stickOrigin = { x: 0, y: 0 };
  private stickVec = { x: 0, y: 0 };
  private camId: number | null = null;
  private camLast = 0;
  enabled = true;
  onStick?: (active: boolean, ox: number, oy: number, kx: number, ky: number) => void;

  constructor(private surface: HTMLElement) {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      const b = KEYMAP[e.code];
      if (b) this.press(b, true);
      if (e.code === 'Space') e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      const b = KEYMAP[e.code];
      if (b) this.press(b, false);
    });
    window.addEventListener('blur', () => this.reset());
    surface.addEventListener('pointerdown', (e) => this.onDown(e));
    surface.addEventListener('pointermove', (e) => this.onMove(e));
    surface.addEventListener('pointerup', (e) => this.onUp(e));
    surface.addEventListener('pointercancel', (e) => this.onUp(e));
  }

  private onDown(e: PointerEvent) {
    if (!this.enabled) return;
    const left = e.clientX < window.innerWidth * 0.45;
    if (left && this.stickId === null) {
      this.stickId = e.pointerId;
      this.stickOrigin = { x: e.clientX, y: e.clientY };
      this.stickVec = { x: 0, y: 0 };
      this.onStick?.(true, e.clientX, e.clientY, 0, 0);
    } else if (!left && this.camId === null) {
      this.camId = e.pointerId;
      this.camLast = e.clientX;
    }
    this.surface.setPointerCapture?.(e.pointerId);
  }

  private onMove(e: PointerEvent) {
    if (e.pointerId === this.stickId) {
      let dx = e.clientX - this.stickOrigin.x;
      let dy = e.clientY - this.stickOrigin.y;
      const d = Math.hypot(dx, dy);
      if (d > STICK_RADIUS) {
        // Let the stick follow the thumb so a long drag never "sticks" at the edge.
        const over = d - STICK_RADIUS;
        this.stickOrigin.x += (dx / d) * over;
        this.stickOrigin.y += (dy / d) * over;
        dx = (dx / d) * STICK_RADIUS;
        dy = (dy / d) * STICK_RADIUS;
      }
      this.stickVec = { x: dx / STICK_RADIUS, y: dy / STICK_RADIUS };
      this.onStick?.(true, this.stickOrigin.x, this.stickOrigin.y, dx, dy);
    } else if (e.pointerId === this.camId) {
      this.camDrag += e.clientX - this.camLast;
      this.camLast = e.clientX;
    }
  }

  private onUp(e: PointerEvent) {
    if (e.pointerId === this.stickId) {
      this.stickId = null;
      this.stickVec = { x: 0, y: 0 };
      this.onStick?.(false, 0, 0, 0, 0);
    }
    if (e.pointerId === this.camId) this.camId = null;
  }

  press(b: ButtonName, down: boolean) {
    if (down) {
      if (!this.held.has(b)) this.pressed.add(b);
      this.held.add(b);
    } else {
      this.held.delete(b);
    }
  }

  isHeld(b: ButtonName) {
    return this.enabled && this.held.has(b);
  }

  /** True once per press; consumed on read. */
  take(b: ButtonName) {
    if (!this.pressed.has(b)) return false;
    this.pressed.delete(b);
    return this.enabled;
  }

  /** Called once per frame before gameplay reads input. */
  poll() {
    let kx = 0;
    let kz = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) kx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) kx += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) kz -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) kz += 1;
    if (this.keys.has('KeyQ')) this.camDrag -= 6;
    if (this.keys.has('KeyR')) this.camDrag += 6;
    let x = kx + this.stickVec.x;
    let z = kz + this.stickVec.y;
    const m = Math.hypot(x, z);
    if (m > 1) {
      x /= m;
      z /= m;
    }
    // Small dead zone so a resting thumb doesn't drift.
    if (m < 0.12) {
      x = 0;
      z = 0;
    }
    this.moveX = this.enabled ? x : 0;
    this.moveZ = this.enabled ? z : 0;
  }

  consumeCamDrag() {
    const d = this.camDrag;
    this.camDrag = 0;
    return this.enabled ? d : 0;
  }

  /** Clears edge presses, e.g. after closing a menu so the tap doesn't leak into gameplay. */
  flush() {
    this.pressed.clear();
  }

  reset() {
    this.held.clear();
    this.pressed.clear();
    this.keys.clear();
    this.stickId = null;
    this.camId = null;
    this.stickVec = { x: 0, y: 0 };
    this.onStick?.(false, 0, 0, 0, 0);
  }
}
