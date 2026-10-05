import * as THREE from 'three';

/**
 * Visual effects for Jason's signature moves: the spin attack's energy swoosh, the ground pound's
 * charge-up and falling streak, and the crater, flash and shockwave left behind on impact.
 */

function canvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return [c, c.getContext('2d') as CanvasRenderingContext2D];
}

function tex(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

let swooshTex: THREE.Texture | null = null;
/** A crescent of light that fades from a blazing leading edge into a long tail. */
function swoosh(): THREE.Texture {
  if (swooshTex) return swooshTex;
  const S = 512;
  const [c, g] = canvas(S);
  const cx = S / 2;
  const steps = 160;
  const sweep = Math.PI * 1.75;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const a0 = -sweep + t * sweep;
    const a1 = a0 + sweep / steps + 0.01;
    const k = t * t;
    for (const [r, w, alpha] of [
      [S * 0.36, S * 0.2, 0.35],
      [S * 0.4, S * 0.08, 0.9],
      [S * 0.42, S * 0.025, 1],
    ] as const) {
      g.strokeStyle = `rgba(255,255,255,${alpha * k})`;
      g.lineWidth = w;
      g.beginPath();
      g.arc(cx, cx, r, a0, a1);
      g.stroke();
    }
  }
  swooshTex = tex(c);
  return swooshTex;
}

let streakTex: THREE.Texture | null = null;
/** Vertical glow that is brightest at the bottom, for the falling ground-pound streak. */
function streak(): THREE.Texture {
  if (streakTex) return streakTex;
  const [c, g] = canvas(128);
  const gr = g.createLinearGradient(0, 128, 0, 0);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  // Soft sides so the cylinder reads as a beam, not a tube.
  const side = g.createLinearGradient(0, 0, 128, 0);
  side.addColorStop(0, 'rgba(0,0,0,1)');
  side.addColorStop(0.3, 'rgba(0,0,0,0)');
  side.addColorStop(0.7, 'rgba(0,0,0,0)');
  side.addColorStop(1, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = side;
  g.fillRect(0, 0, 128, 128);
  streakTex = tex(c);
  return streakTex;
}

let flashTex: THREE.Texture | null = null;
function flashDisc(): THREE.Texture {
  if (flashTex) return flashTex;
  const [c, g] = canvas(256);
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.2, 'rgba(255,255,255,0.8)');
  gr.addColorStop(0.55, 'rgba(255,255,255,0.18)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  flashTex = tex(c);
  return flashTex;
}

/** Scorch mark and glowing cracks for a crater; each crater gets its own random crack pattern. */
function crater(): [THREE.Texture, THREE.Texture] {
  const [c, g] = canvas(256);
  const gr = g.createRadialGradient(128, 128, 10, 128, 128, 124);
  gr.addColorStop(0, 'rgba(8,8,12,0.85)');
  gr.addColorStop(0.45, 'rgba(10,10,16,0.55)');
  gr.addColorStop(1, 'rgba(10,10,16,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  const [c2, g2] = canvas(256);
  g2.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    let a = (i / 9) * Math.PI * 2 + Math.random() * 0.5;
    let x = 128;
    let y = 128;
    const len = 60 + Math.random() * 55;
    g2.beginPath();
    g2.moveTo(x, y);
    for (let s = 0; s < 6; s++) {
      a += (Math.random() - 0.5) * 0.9;
      x += Math.cos(a) * (len / 6);
      y += Math.sin(a) * (len / 6);
      g2.lineTo(x, y);
    }
    g2.lineWidth = 5 - (i % 3);
    g2.strokeStyle = 'rgba(255,255,255,0.95)';
    g2.stroke();
    g.lineWidth = 7;
    g.strokeStyle = 'rgba(0,0,0,0.5)';
    g.stroke();
  }
  return [tex(c), tex(c2)];
}

const additive = (map: THREE.Texture, color: string) =>
  new THREE.MeshBasicMaterial({ map, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false });

/** Effects that follow Jason: the spin swoosh, the pound charge-up glow and the falling streak. */
export class JasonFx {
  private spinRings: THREE.Mesh[] = [];
  private spinT = 0;
  private spinMax = 1;
  private beam: THREE.Mesh;
  private beamMat: THREE.MeshBasicMaterial;
  private orb: THREE.Mesh;
  private orbMat: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    const ring = new THREE.RingGeometry(0.35, 2.4, 64, 1).rotateX(-Math.PI / 2);
    for (const [color, scale] of [
      ['#9fefff', 1],
      ['#ffffff', 0.78],
    ] as const) {
      const me = new THREE.Mesh(ring, additive(swoosh(), color));
      me.scale.setScalar(scale);
      me.visible = false;
      me.renderOrder = 6;
      scene.add(me);
      this.spinRings.push(me);
    }
    this.beamMat = additive(streak(), '#bff4ff');
    this.beam = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.3, 4, 20, 1, true).translate(0, 2, 0), this.beamMat);
    this.beam.visible = false;
    this.beam.renderOrder = 6;
    scene.add(this.beam);
    this.orbMat = additive(flashDisc(), '#9fefff');
    this.orb = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), this.orbMat);
    this.orb.visible = false;
    scene.add(this.orb);
  }

  spin(duration: number) {
    this.spinT = duration;
    this.spinMax = duration;
  }

  update(dt: number, x: number, y: number, z: number, state: { pounding: boolean; hang: number; hangMax: number; airborne: boolean }) {
    // Spin: two stacked swooshes whirling around Jason, tilting when he spins in mid-air.
    this.spinT = Math.max(0, this.spinT - dt);
    const k = this.spinT / this.spinMax;
    this.spinRings.forEach((r, i) => {
      r.visible = this.spinT > 0;
      if (!r.visible) return;
      r.position.set(x, y + 0.8 + i * 0.12, z);
      r.rotation.y -= dt * (26 + i * 6);
      r.rotation.x = state.airborne ? Math.sin(r.rotation.y) * 0.25 : 0;
      (r.material as THREE.MeshBasicMaterial).opacity = Math.min(1, k * 2.2) * (i ? 0.8 : 1);
      r.scale.setScalar((i ? 0.78 : 1) * (0.85 + (1 - k) * 0.3));
    });
    // Ground pound: a charge-up orb while Jason hangs in the air, then a streak as he slams down.
    const charging = state.pounding && state.hang > 0;
    this.orb.visible = charging;
    if (charging) {
      const c = 1 - state.hang / state.hangMax;
      this.orb.position.set(x, y + 0.9, z);
      this.orb.scale.setScalar(0.6 + c * 0.9);
      this.orbMat.opacity = 0.35 + c * 0.5;
    }
    const falling = state.pounding && state.hang <= 0;
    this.beam.visible = falling;
    if (falling) {
      this.beam.position.set(x, y, z);
      this.beamMat.opacity = 0.85;
      this.beam.rotation.y += dt * 8;
    }
  }
}

interface Crater {
  scorch: THREE.Mesh;
  cracks: THREE.Mesh;
  flash: THREE.Mesh;
  life: number;
}

/** A small pool of ground-pound craters: a white flash, glowing cracks, then a slowly fading scorch. */
export class Impacts {
  private pool: Crater[] = [];
  private next = 0;

  constructor(scene: THREE.Scene) {
    const plane = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    for (let i = 0; i < 4; i++) {
      const [scorchT, crackT] = crater();
      const scorch = new THREE.Mesh(
        plane,
        new THREE.MeshBasicMaterial({ map: scorchT, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
      );
      const cracks = new THREE.Mesh(plane, additive(crackT, '#7fe6ff'));
      (cracks.material as THREE.MeshBasicMaterial).polygonOffset = true;
      (cracks.material as THREE.MeshBasicMaterial).polygonOffsetFactor = -3;
      (cracks.material as THREE.MeshBasicMaterial).polygonOffsetUnits = -3;
      const flash = new THREE.Mesh(plane, additive(flashDisc(), '#ffffff'));
      for (const m of [scorch, cracks, flash]) {
        m.visible = false;
        m.renderOrder = 2;
        scene.add(m);
      }
      this.pool.push({ scorch, cracks, flash, life: 0 });
    }
  }

  slam(x: number, y: number, z: number, size: number, color: string) {
    const c = this.pool[this.next];
    this.next = (this.next + 1) % this.pool.length;
    c.life = 3;
    for (const m of [c.scorch, c.cracks, c.flash]) {
      m.visible = true;
      m.position.set(x, y + 0.03, z);
      m.rotation.y = Math.random() * Math.PI * 2;
    }
    c.scorch.scale.setScalar(size);
    c.cracks.scale.setScalar(size * 0.9);
    (c.cracks.material as THREE.MeshBasicMaterial).color.set(color);
    c.flash.position.y = y + 0.08;
  }

  update(dt: number) {
    for (const c of this.pool) {
      if (c.life <= 0) continue;
      c.life -= dt;
      const age = 3 - c.life;
      const f = Math.max(0, 1 - age / 0.22);
      c.flash.visible = f > 0;
      c.flash.scale.setScalar(2 + (1 - f) * 5);
      (c.flash.material as THREE.MeshBasicMaterial).opacity = f * 0.75;
      (c.cracks.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - age / 1.2) ** 1.5;
      (c.scorch.material as THREE.MeshBasicMaterial).opacity = Math.min(1, c.life / 1.2);
      if (c.life <= 0) for (const m of [c.scorch, c.cracks, c.flash]) m.visible = false;
    }
  }
}
