import * as THREE from 'three';

function canvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return [c, c.getContext('2d') as CanvasRenderingContext2D];
}

function finish(c: HTMLCanvasElement, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.needsUpdate = true;
  return t;
}

const cache = new Map<string, THREE.Texture>();

/** A sci-fi floor panel: bevelled plate, seams, rivets and light speckle. */
export function panelTexture(base: string, line: string, style: 'panel' | 'grate' | 'soil' | 'ice' = 'panel'): THREE.Texture {
  const key = `${base}|${line}|${style}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const S = 256;
  const [c, g] = canvas(S);
  g.fillStyle = base;
  g.fillRect(0, 0, S, S);
  if (style === 'soil') {
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`;
      g.fillRect(Math.random() * S, Math.random() * S, 3, 3);
      g.fillStyle = `rgba(255,255,220,${Math.random() * 0.08})`;
      g.fillRect(Math.random() * S, Math.random() * S, 2, 2);
    }
  }
  if (style === 'ice') {
    g.strokeStyle = 'rgba(255,255,255,0.35)';
    g.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      g.beginPath();
      const x = Math.random() * S;
      const y = Math.random() * S;
      g.moveTo(x, y);
      g.lineTo(x + (Math.random() - 0.5) * 120, y + (Math.random() - 0.5) * 120);
      g.stroke();
    }
  }
  // Bevelled plate edges.
  const m = 10;
  g.fillStyle = 'rgba(255,255,255,0.16)';
  g.fillRect(m, m, S - m * 2, 6);
  g.fillRect(m, m, 6, S - m * 2);
  g.fillStyle = 'rgba(0,0,0,0.22)';
  g.fillRect(m, S - m - 6, S - m * 2, 6);
  g.fillRect(S - m - 6, m, 6, S - m * 2);
  g.strokeStyle = line;
  g.lineWidth = 6;
  g.strokeRect(3, 3, S - 6, S - 6);
  if (style === 'grate') {
    g.strokeStyle = 'rgba(0,0,0,0.35)';
    g.lineWidth = 7;
    for (let i = 1; i < 8; i++) {
      g.beginPath();
      g.moveTo(24, (S * i) / 8);
      g.lineTo(S - 24, (S * i) / 8);
      g.stroke();
    }
  } else if (style === 'panel') {
    g.strokeStyle = line;
    g.lineWidth = 3;
    g.strokeRect(46, 46, S - 92, S - 92);
    g.fillStyle = line;
    for (const [x, y] of [
      [24, 24],
      [S - 24, 24],
      [24, S - 24],
      [S - 24, S - 24],
    ]) {
      g.beginPath();
      g.arc(x, y, 6, 0, Math.PI * 2);
      g.fill();
    }
  }
  for (let i = 0; i < 300; i++) {
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
    g.fillRect(Math.random() * S, Math.random() * S, 2, 2);
  }
  const t = finish(c);
  cache.set(key, t);
  return t;
}

/** Soft round sprite used for glows and particles. */
export function glowTexture(): THREE.Texture {
  const hit = cache.get('glow');
  if (hit) return hit;
  const S = 128;
  const [c, g] = canvas(S);
  const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.75)');
  grad.addColorStop(0.6, 'rgba(255,255,255,0.18)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  const t = finish(c, false);
  cache.set('glow', t);
  return t;
}

/** Radial gradient disc used as a soft blob shadow under characters. */
export function shadowTexture(): THREE.Texture {
  const hit = cache.get('shadow');
  if (hit) return hit;
  const S = 64;
  const [c, g] = canvas(S);
  const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  const t = finish(c, false);
  cache.set('shadow', t);
  return t;
}

/** Yellow/black hazard stripes for platform edges and warning floors. */
export function stripeTexture(a: string, b: string): THREE.Texture {
  const key = `stripe|${a}|${b}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const S = 64;
  const [c, g] = canvas(S);
  g.fillStyle = a;
  g.fillRect(0, 0, S, S);
  g.fillStyle = b;
  for (let i = -S; i < S * 2; i += 16) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i + 8, 0);
    g.lineTo(i + 8 + S, S);
    g.lineTo(i + S, S);
    g.fill();
  }
  const t = finish(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  cache.set(key, t);
  return t;
}
