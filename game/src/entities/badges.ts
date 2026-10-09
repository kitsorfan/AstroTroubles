import * as THREE from 'three';

/**
 * Enemy icons and the floating badge (icon + health bar) above every enemy. The same drawings are
 * used for the "new threat" card in the UI.
 */

export type BadgeKind = 'sporeling' | 'snapper' | 'buzzer' | 'sentry' | 'turret' | 'brute' | 'blob' | 'trooper' | 'minebot' | 'bulwark' | 'mortar' | 'harpy' | 'piranha';

const COLORS: Record<BadgeKind, string> = {
  sporeling: '#ff3fd0',
  snapper: '#ff4f7a',
  buzzer: '#ffcf3a',
  sentry: '#ff3a4c',
  turret: '#c6ff3a',
  brute: '#ff7a1a',
  blob: '#ff5fa8',
  trooper: '#ff2a2a',
  minebot: '#ff8a3a',
  bulwark: '#c9a24a',
  mortar: '#ff6fcf',
  harpy: '#ffc94a',
  piranha: '#ffb020',
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
    case 'trooper': {
      // A round helmet with one big red lens and an antenna.
      g.beginPath();
      g.arc(64, 66, 34, Math.PI, 0);
      g.lineTo(98, 84);
      g.quadraticCurveTo(64, 100, 30, 84);
      g.closePath();
      g.fill();
      g.fillRect(84, 14, 6, 22);
      g.beginPath();
      g.arc(87, 14, 7, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#e0142a';
      g.beginPath();
      g.arc(64, 66, 15, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#fff';
      g.beginPath();
      g.arc(59, 61, 4, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case 'minebot': {
      // A round bomb with a little head and a sparking antenna.
      g.beginPath();
      g.arc(64, 78, 30, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.arc(64, 46, 16, Math.PI, 0);
      g.fill();
      g.fillRect(62, 14, 5, 20);
      g.fillStyle = COLORS.minebot;
      g.beginPath();
      g.arc(64, 14, 7, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#e0142a';
      g.beginPath();
      g.arc(64, 42, 6, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case 'bulwark': {
      // A tower shield with Brennus's gear in the middle.
      g.beginPath();
      g.moveTo(30, 22);
      g.lineTo(98, 22);
      g.lineTo(98, 70);
      g.quadraticCurveTo(98, 98, 64, 112);
      g.quadraticCurveTo(30, 98, 30, 70);
      g.closePath();
      g.fill();
      g.fillStyle = '#e0142a';
      g.beginPath();
      g.arc(64, 62, 14, 0, Math.PI * 2);
      g.fill();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.fillRect(64 + Math.cos(a) * 17 - 4, 62 + Math.sin(a) * 17 - 4, 8, 8);
      }
      g.fillStyle = '#fff';
      g.beginPath();
      g.arc(64, 62, 5, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case 'mortar': {
      // A dome with a fat barrel, and the dotted arc of its shell.
      g.beginPath();
      g.arc(46, 96, 26, Math.PI, 0);
      g.closePath();
      g.fill();
      g.save();
      g.translate(50, 80);
      g.rotate(0.6);
      g.fillRect(-10, -40, 20, 40);
      g.restore();
      g.fillStyle = COLORS.mortar;
      for (let i = 0; i < 5; i++) {
        const t = 0.15 + i * 0.2;
        g.beginPath();
        g.arc(70 + t * 40, 46 - Math.sin(t * Math.PI) * 30, 4, 0, Math.PI * 2);
        g.fill();
      }
      g.strokeStyle = '#e0142a';
      g.lineWidth = 5;
      g.beginPath();
      g.ellipse(108, 100, 12, 5, 0, 0, Math.PI * 2);
      g.stroke();
      break;
    }
    case 'harpy': {
      // A bird with spread wings, a hooked beak and grabbing claws holding a bolt.
      g.beginPath();
      g.moveTo(64, 50);
      g.quadraticCurveTo(38, 26, 12, 40);
      g.quadraticCurveTo(34, 50, 44, 66);
      g.quadraticCurveTo(64, 74, 84, 66);
      g.quadraticCurveTo(94, 50, 116, 40);
      g.quadraticCurveTo(90, 26, 64, 50);
      g.fill();
      g.beginPath();
      g.arc(64, 54, 13, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.moveTo(58, 62);
      g.lineTo(64, 74);
      g.lineTo(70, 62);
      g.fill();
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(56, 76);
      g.lineTo(52, 92);
      g.moveTo(72, 76);
      g.lineTo(76, 92);
      g.stroke();
      g.fillStyle = COLORS.harpy;
      g.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        g.lineTo(64 + Math.cos(a) * 10, 100 + Math.sin(a) * 10);
      }
      g.fill();
      g.fillStyle = '#e0142a';
      g.beginPath();
      g.arc(64, 52, 5, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case 'piranha': {
      // A round little fish with a forked tail, a big underbite full of teeth and one red eye.
      g.beginPath();
      g.ellipse(58, 64, 34, 28, 0, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.moveTo(86, 64);
      g.lineTo(116, 40);
      g.lineTo(106, 64);
      g.lineTo(116, 88);
      g.closePath();
      g.fill();
      g.fillStyle = 'rgba(12,8,20,0.88)';
      g.beginPath();
      g.moveTo(24, 66);
      g.lineTo(52, 72);
      g.lineTo(26, 86);
      g.closePath();
      g.fill();
      g.fillStyle = '#fff';
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.moveTo(30 + i * 8, 70);
        g.lineTo(34 + i * 8, 78);
        g.lineTo(38 + i * 8, 71);
        g.fill();
      }
      g.fillStyle = '#e0142a';
      g.beginPath();
      g.arc(46, 52, 7, 0, Math.PI * 2);
      g.fill();
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
