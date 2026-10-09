import * as THREE from 'three';

import { audio } from '../../core/audio';
import { damp } from '../../core/math';
import type { World } from '../../game/world';
import { Grid } from '../../world/grid';
import { Entity } from '../entity';
import type { FloorFx } from '../props';

/**
 * CHARYBDIS, the great whirlpool in the middle of Scylla's arena (a hole in the reef down to the sea).
 * It always turns slowly; during the fight, every `PERIOD` seconds it spins up (the warning: the foam
 * races round and it roars), then for a moment it PULLS everyone nearby toward its centre. Walking
 * away beats the pull; a spin digs in and halves it. Falling in is a splash like any fall into the sea.
 * Once Scylla is beaten it calms right down.
 */
export const CHARYBDIS = {
  period: 8.5,
  calm: 4.8,
  warn: 1.6,
  /** How hard it pulls (units per second; the hero walks at 7) and how far it reaches. */
  pull: 4.6,
  range: 12,
  /** Size of the spinning water. */
  radius: 7,
};

/** Cells this far (in cells) from the middle never count as a safe spot. */
const RIM = 4;

export type WhirlPhase = 'calm' | 'warn' | 'pull';

/** Where the whirlpool is in its rhythm at world time `t`. */
export function whirlPhase(t: number): WhirlPhase {
  const x = t % CHARYBDIS.period;
  if (x < CHARYBDIS.calm) return 'calm';
  if (x < CHARYBDIS.calm + CHARYBDIS.warn) return 'warn';
  return 'pull';
}

/** A spiral of foam on deep blue water. */
function spiralTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  const grad = g.createRadialGradient(S / 2, S / 2, 4, S / 2, S / 2, S / 2);
  grad.addColorStop(0, '#04263a');
  grad.addColorStop(0.5, '#0e5a7a');
  grad.addColorStop(1, 'rgba(42, 174, 203, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  g.strokeStyle = 'rgba(230, 250, 255, 0.85)';
  g.lineCap = 'round';
  for (let arm = 0; arm < 5; arm++) {
    g.lineWidth = 5;
    g.beginPath();
    for (let i = 0; i <= 60; i++) {
      const k = i / 60;
      const a = arm * ((Math.PI * 2) / 5) + k * Math.PI * 2.4;
      const r = 10 + k * (S / 2 - 16);
      const x = S / 2 + Math.cos(a) * r;
      const y = S / 2 + Math.sin(a) * r;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class Charybdis extends Entity implements FloorFx {
  /** The rim is never a safe spot: a hero swept in comes back a little farther from the edge. */
  unsafe = true;
  /** Pulling only happens during the fight. */
  active = false;
  private disc: THREE.Mesh;
  private foam: THREE.Mesh;
  private spin = 0.8;
  private told = false;
  private last: WhirlPhase = 'calm';

  constructor(
    world: World,
    readonly at: THREE.Vector3,
  ) {
    super(world, 'charybdis');
    const m = new THREE.MeshBasicMaterial({ map: spiralTexture(), color: '#ffffff', transparent: true, depthWrite: false, toneMapped: false });
    this.disc = new THREE.Mesh(new THREE.CircleGeometry(CHARYBDIS.radius, 40).rotateX(-Math.PI / 2), m);
    this.disc.renderOrder = 3;
    this.foam = new THREE.Mesh(
      new THREE.TorusGeometry(CHARYBDIS.radius * 0.45, 0.18, 6, 40).rotateX(Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: '#e8fbff', transparent: true, opacity: 0.6, depthWrite: false }),
    );
    this.obj.add(this.disc, this.foam);
    const cx = Grid.toCell(at.x);
    const cz = Grid.toCell(at.z);
    for (let dz = -RIM; dz <= RIM; dz++) {
      for (let dx = -RIM; dx <= RIM; dx++) {
        if (dx * dx + dz * dz > RIM * RIM) continue;
        const c = world.grid.cell(cx + dx, cz + dz);
        if (c.kind === 'floor') world.registerFloor(cx + dx, cz + dz, this);
      }
    }
  }

  update(dt: number) {
    const w = this.world;
    const sea = w.tide?.level ?? this.at.y - 2;
    const ph = this.active ? whirlPhase(w.time) : 'calm';
    const target = !this.active && w.boss?.defeated ? 0.25 : ph === 'pull' ? 6 : ph === 'warn' ? 3.5 : 1;
    this.spin = damp(this.spin, target, 3, dt);
    this.disc.position.set(this.at.x, sea + 0.08, this.at.z);
    this.disc.rotation.y -= this.spin * dt;
    this.foam.position.set(this.at.x, sea + 0.12, this.at.z);
    this.foam.rotation.y -= this.spin * 1.4 * dt;
    this.foam.scale.setScalar(1 + Math.sin(w.time * 3) * 0.05);
    if (ph !== this.last) {
      this.last = ph;
      if (ph === 'warn') {
        audio.play('roar', 0.5, 0.45);
        if (!this.told) {
          this.told = true;
          w.hooks.toast('Charybdis is spinning up! When it pulls, walk AWAY from the middle, or SPIN to dig in!', 'bolt');
        }
      }
      if (ph === 'pull') audio.play('vent', 0.5);
    }
    if (ph === 'calm') return;
    // Foam streaks racing round the rim.
    if (Math.random() < (ph === 'pull' ? 0.8 : 0.4)) {
      const a = Math.random() * Math.PI * 2;
      const r = 2 + Math.random() * 3;
      w.particles.emit(this.at.x + Math.cos(a) * r, sea + 0.2, this.at.z + Math.sin(a) * r, { count: 1, color: '#e8fbff', speed: 0, life: 0.6, size: 0.45, gravity: 0, drag: 0, vel: [-Math.sin(a) * 6, 0, Math.cos(a) * 6] });
    }
    if (ph !== 'pull') return;
    const p = w.player;
    const b = p.body;
    const dx = this.at.x - b.x;
    const dz = this.at.z - b.z;
    const d = Math.hypot(dx, dz);
    // Not right after a splash: one pull, one heart at most.
    if (w.cutscene || p.zipping || p.down || p.invuln > 0 || d < 0.3 || d > CHARYBDIS.range || b.y > this.at.y + 3) return;
    // Stronger closer in; a spin digs in.
    const k = (p.spinning ? 0.5 : 1) * (0.55 + 0.45 * (1 - d / CHARYBDIS.range));
    b.x += (dx / d) * CHARYBDIS.pull * k * dt;
    b.z += (dz / d) * CHARYBDIS.pull * k * dt;
    if (Math.random() < 0.4) w.particles.emit(b.x, b.y + 0.2, b.z, { count: 1, color: '#bff4ff', speed: 0, life: 0.4, size: 0.3, gravity: 0, drag: 0, vel: [(dx / d) * 5, 0, (dz / d) * 5] });
  }
}
