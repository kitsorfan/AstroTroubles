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

/**
 * A night sky full of little stars, for the Starlight Explorer outfit: `base` is the cloth (navy with
 * white stars), the other the same stars alone on black, used as the glow map so only they shine.
 */
export function starTexture(base: boolean): THREE.Texture {
  const key = `stars|${base}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const S = 128;
  const [c, g] = canvas(S);
  g.fillStyle = base ? '#1b2350' : '#000000';
  g.fillRect(0, 0, S, S);
  // The same stars in both maps: a fixed little random sequence.
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 46; i++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const r = 0.6 + rnd() * (i % 7 === 0 ? 2.4 : 1.1);
    g.fillStyle = i % 5 === 0 ? '#bfe0ff' : i % 3 === 0 ? '#ffe8a8' : '#ffffff';
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  const t = finish(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 1);
  cache.set(key, t);
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
