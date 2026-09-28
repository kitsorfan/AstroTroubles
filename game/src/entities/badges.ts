import * as THREE from 'three';

/**
 * Enemy icons and the floating badge (icon + health bar) above every enemy. The same drawings are
 * used for the "new threat" card in the UI.
 */

export type BadgeKind = 'sporeling' | 'snapper' | 'buzzer' | 'sentry' | 'turret' | 'brute' | 'blob';

const COLORS: Record<BadgeKind, string> = {
  sporeling: '#ff3fd0',
  snapper: '#ff4f7a',
  buzzer: '#ffcf3a',
  sentry: '#ff3a4c',
  turret: '#c6ff3a',
  brute: '#ff7a1a',
  blob: '#ff5fa8',
};

type G = CanvasRenderingContext2D;

function glyph(g: G, kind: BadgeKind) {
  g.fillStyle = '#fff';
  g.strokeStyle = '#fff';
  g.lineCap = 'round';
  g.lineJoin = 'round';
  switch (kind) {
    case 'sporeling': {
      // A crawling bug: round body, six legs, two red eyes.
      g.lineWidth = 6;
      for (const sx of [-1, 1]) {
        for (let i = 0; i < 3; i++) {
          g.beginPath();
          g.moveTo(64 + sx * 12, 60 + i * 10);
          g.lineTo(64 + sx * 34, 50 + i * 16);
          g.lineTo(64 + sx * 40, 70 + i * 16);
          g.stroke();
        }
      }
      g.beginPath();
      g.ellipse(64, 66, 22, 26, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#e0142a';
      g.beginPath();
      g.arc(56, 52, 5, 0, Math.PI * 2);
      g.arc(72, 52, 5, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case 'snapper': {
      // Open jaws full of fangs.
      g.beginPath();
      g.moveTo(26, 64);
      g.quadraticCurveTo(64, 10, 102, 64);
      g.lineTo(26, 64);
      g.moveTo(26, 70);
      g.quadraticCurveTo(64, 116, 102, 70);
      g.lineTo(26, 70);
      g.fill();
      g.fillStyle = COLORS.snapper;
      for (let i = 0; i < 5; i++) {
        const x = 36 + i * 14;
        g.beginPath();
        g.moveTo(x - 5, 60);
        g.lineTo(x + 5, 60);
        g.lineTo(x, 48);
        g.fill();
        g.beginPath();
        g.moveTo(x - 5, 74);
        g.lineTo(x + 5, 74);
        g.lineTo(x, 86);
        g.fill();
      }
      break;
    }
    case 'buzzer': {
      // A wasp: striped body, wings and a stinger.
      g.globalAlpha = 0.7;
      g.beginPath();
      g.ellipse(44, 40, 18, 10, -0.6, 0, Math.PI * 2);
      g.ellipse(84, 40, 18, 10, 0.6, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 1;
      g.beginPath();
      g.ellipse(64, 66, 16, 26, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = COLORS.buzzer;
      g.fillRect(48, 62, 32, 6);
      g.fillRect(48, 74, 32, 6);
      g.fillStyle = '#fff';
      g.beginPath();
      g.moveTo(58, 90);
      g.lineTo(70, 90);
      g.lineTo(64, 110);
      g.fill();
      break;
    }
    case 'sentry': {
      // A robot head with a red visor slit.
      g.beginPath();
      g.roundRect(30, 34, 68, 56, 12);
      g.fill();
      g.fillRect(60, 18, 8, 18);
      g.fillStyle = '#e0142a';
      g.fillRect(40, 54, 48, 12);
      g.fillStyle = '#fff';
      g.fillRect(24, 92, 80, 10);
      break;
    }
    case 'turret': {
      // A drop of acid over a root.
      g.beginPath();
      g.moveTo(64, 16);
      g.bezierCurveTo(92, 52, 92, 88, 64, 88);
      g.bezierCurveTo(36, 88, 36, 52, 64, 16);
      g.fill();
      g.lineWidth = 7;
      g.beginPath();
      g.moveTo(40, 104);
      g.quadraticCurveTo(64, 92, 88, 104);
      g.stroke();
      g.fillStyle = COLORS.turret;
      g.beginPath();
      g.arc(58, 60, 8, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case 'brute': {
      // A horned skull.
      g.beginPath();
      g.moveTo(34, 50);
      g.quadraticCurveTo(22, 22, 12, 18);
      g.quadraticCurveTo(30, 34, 44, 46);
      g.moveTo(94, 50);
      g.quadraticCurveTo(106, 22, 116, 18);
      g.quadraticCurveTo(98, 34, 84, 46);
      g.fill();
      g.beginPath();
      g.roundRect(34, 40, 60, 54, 20);
      g.fill();
      g.fillStyle = '#e0142a';
      g.fillRect(44, 58, 14, 7);
      g.fillRect(70, 58, 14, 7);
      g.fillStyle = COLORS.brute;
      g.fillRect(50, 78, 28, 6);
      break;
    }
    case 'blob': {
      g.beginPath();
      g.moveTo(24, 92);
      g.bezierCurveTo(20, 30, 108, 30, 104, 92);
      g.closePath();
      g.fill();
      g.fillStyle = '#ffd24a';
      g.beginPath();
      g.arc(52, 60, 7, 0, Math.PI * 2);
      g.arc(76, 60, 7, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = COLORS.blob;
      g.fillRect(48, 76, 32, 6);
      break;
    }
  }
}

const iconCache = new Map<string, HTMLCanvasElement>();

/** A round threat icon: dark disc, coloured rim (gold for elites) and a white glyph. */
export function enemyIcon(kind: BadgeKind, elite = false): HTMLCanvasElement {
  const key = `${kind}|${elite}`;
  const hit = iconCache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d') as G;
  g.fillStyle = 'rgba(12,8,20,0.88)';
  g.beginPath();
  g.arc(64, 64, 58, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = elite ? 9 : 6;
  g.strokeStyle = elite ? '#ffd166' : COLORS[kind];
  g.beginPath();
  g.arc(64, 64, 57, 0, Math.PI * 2);
  g.stroke();
  g.save();
  g.translate(64, 64);
  g.scale(0.72, 0.72);
  g.translate(-64, -64);
  glyph(g, kind);
  g.restore();
  if (elite) {
    // A little crown on top for tougher elites.
    g.fillStyle = '#ffd166';
    g.beginPath();
    g.moveTo(44, 16);
    g.lineTo(52, 2);
    g.lineTo(64, 12);
    g.lineTo(76, 2);
    g.lineTo(84, 16);
    g.closePath();
    g.fill();
  }
  iconCache.set(key, c);
  return c;
}

export function enemyIconUrl(kind: BadgeKind, elite = false): string {
  return enemyIcon(kind, elite).toDataURL();
}

const texCache = new Map<string, THREE.Texture>();
function iconTexture(kind: BadgeKind, elite: boolean) {
  const key = `${kind}|${elite}`;
  let t = texCache.get(key);
  if (!t) {
    t = new THREE.CanvasTexture(enemyIcon(kind, elite));
    t.colorSpace = THREE.SRGBColorSpace;
    texCache.set(key, t);
  }
  return t;
}

let white: THREE.Texture | null = null;
function whiteTexture() {
  if (!white) {
    const c = document.createElement('canvas');
    c.width = c.height = 4;
    const g = c.getContext('2d') as G;
    g.fillStyle = '#fff';
    g.fillRect(0, 0, 4, 4);
    white = new THREE.CanvasTexture(c);
  }
  return white;
}

/** Floating icon and health bar that always faces the camera. */
export class Badge {
  readonly group = new THREE.Group();
  private icon: THREE.Sprite;
  private back: THREE.Sprite;
  private fill: THREE.Sprite;
  private alarm: THREE.Sprite;
  private fillMat: THREE.SpriteMaterial;
  private alpha = 0;
  private width = 1.2;

  constructor(kind: BadgeKind, elite: boolean) {
    const sm = (map: THREE.Texture, color = '#ffffff') => new THREE.SpriteMaterial({ map, color, transparent: true, depthWrite: false, depthTest: false, opacity: 0 });
    this.icon = new THREE.Sprite(sm(iconTexture(kind, elite)));
    this.icon.scale.setScalar(elite ? 0.95 : 0.8);
    this.icon.position.y = 0.55;
    this.back = new THREE.Sprite(sm(whiteTexture(), '#140a14'));
    this.back.scale.set(this.width + 0.08, 0.16, 1);
    this.fillMat = sm(whiteTexture(), elite ? '#ffd166' : '#ff4d6d');
    this.fill = new THREE.Sprite(this.fillMat);
    this.fill.center.set(0, 0.5);
    this.fill.position.x = -this.width / 2;
    this.fill.scale.set(this.width, 0.1, 1);
    this.alarm = new THREE.Sprite(sm(alarmTexture()));
    this.alarm.scale.setScalar(0.9);
    this.alarm.position.y = 1.45;
    for (const s of [this.back, this.fill, this.icon, this.alarm]) {
      s.renderOrder = 20;
      this.group.add(s);
    }
  }

  /** Call each frame. `show` fades the badge in (enemy close and awake). */
  update(dt: number, show: boolean, hpFrac: number, alarmed: boolean, t: number) {
    this.alpha += ((show ? 1 : 0) - this.alpha) * Math.min(1, dt * 6);
    this.group.visible = this.alpha > 0.02;
    if (!this.group.visible) return;
    const a = this.alpha;
    (this.icon.material as THREE.SpriteMaterial).opacity = a;
    const damaged = hpFrac < 0.999;
    (this.back.material as THREE.SpriteMaterial).opacity = damaged ? a * 0.85 : 0;
    this.fillMat.opacity = damaged ? a : 0;
    this.fill.scale.x = Math.max(0.001, this.width * hpFrac);
    const am = this.alarm.material as THREE.SpriteMaterial;
    am.opacity = alarmed ? a * (0.6 + Math.sin(t * 14) * 0.4) : 0;
  }
}

let alarmTex: THREE.Texture | null = null;
function alarmTexture() {
  if (alarmTex) return alarmTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d') as G;
  g.fillStyle = '#ff2030';
  g.beginPath();
  g.moveTo(32, 4);
  g.lineTo(60, 58);
  g.lineTo(4, 58);
  g.closePath();
  g.fill();
  g.fillStyle = '#fff';
  g.fillRect(28, 20, 8, 22);
  g.fillRect(28, 46, 8, 7);
  alarmTex = new THREE.CanvasTexture(c);
  alarmTex.colorSpace = THREE.SRGBColorSpace;
  return alarmTex;
}
