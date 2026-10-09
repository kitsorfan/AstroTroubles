import * as THREE from 'three';

import { audio } from '../../core/audio';
import { CELL } from '../../core/constants';
import type { World } from '../../game/world';
import { Grid } from '../../world/grid';
import type { Box } from '../../world/physics';
import type { TideDef } from '../../world/levelTypes';
import { FLOOD, RAFT_TOP, TIDE_WARN, isTidal, tideLevel, tidePhase, type TideGauge, type TidePhase } from '../../world/tides';
import { Entity } from '../entity';
import type { Player } from '../player';
import type { FloorFx } from '../props';

/**
 * TIDES (Scylla's Reef). The water moon's big planet pulls its sea up and down every half minute: low
 * tide (dry sandbars between the coral), the tide coming in (the HUD gauge blinks first), high tide (the
 * flats are under water, rafts float up beside the high ledges) and the tide going out again.
 *
 * - Any walkable floor lower than the high-tide line minus `FLOOD` is a tidal flat. While the sea is
 *   more than `FLOOD` deep over it, a hero standing (or falling) there is washed back to the last dry
 *   spot, losing a heart like any fall into water. Tidal flats never count as a safe spot.
 * - One big sea plane rises and falls over the whole level (the "void" around the reef is deep sea).
 */

/** A soft ripple pattern for the sea (one canvas texture, scrolled by the tide). */
function rippleTexture(): THREE.CanvasTexture {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, S, S);
  g.strokeStyle = 'rgba(160, 225, 240, 0.9)';
  g.lineWidth = 3;
  for (let i = 0; i < 46; i++) {
    const x = (i * 97) % S;
    const y = (i * 61) % S;
    const r = 10 + ((i * 13) % 24);
    g.beginPath();
    g.ellipse(x, y, r, r * 0.45, 0, Math.PI * 1.1, Math.PI * 1.9);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class Tide extends Entity implements FloorFx {
  unsafe = true;
  /** The sea's height right now. */
  level: number;
  private water: THREE.Mesh;
  private tex: THREE.CanvasTexture | null = null;
  private last: TidePhase = 'low';
  private warned = false;
  private told = false;

  constructor(
    world: World,
    readonly def: TideDef,
  ) {
    super(world, 'tide');
    this.level = tideLevel(def, world.time);
    const lv = world.level;
    for (let cz = 0; cz < lv.depth; cz++) {
      for (let cx = 0; cx < lv.width; cx++) {
        const c = world.grid.cell(cx, cz);
        if ((c.kind === 'floor' || c.kind === 'grate' || c.kind === 'ice') && isTidal(def, c.h)) world.registerFloor(cx, cz, this);
      }
    }
    const span = Math.max(lv.width, lv.depth) * CELL + 260;
    const hasDom = typeof document !== 'undefined';
    this.tex = hasDom ? rippleTexture() : null;
    this.tex?.repeat.set(span / 14, span / 14);
    const m = new THREE.MeshStandardMaterial({ color: '#2aaecb', map: this.tex, transparent: true, opacity: 0.74, roughness: 0.12, metalness: 0.15, depthWrite: false });
    this.water = new THREE.Mesh(new THREE.PlaneGeometry(span, span).rotateX(-Math.PI / 2), m);
    this.water.position.set((lv.width * CELL) / 2, this.level, (lv.depth * CELL) / 2);
    this.water.renderOrder = 2;
    this.water.receiveShadow = true;
    this.obj.add(this.water);
  }

  /** Is the sea over this cell deep enough to sweep a hero away? */
  flooded(cx: number, cz: number): boolean {
    const c = this.world.grid.cell(cx, cz);
    if (c.kind === 'wall') return false;
    return c.kind === 'void' || c.kind === 'hazard' || this.level > c.h + FLOOD;
  }

  stand(p: Player) {
    const g = p.body.ground;
    if (!g || this.world.cutscene) return;
    const c = this.world.grid.cell(g.cx, g.cz);
    const depth = this.level - c.h;
    if (depth > FLOOD) this.wash(p);
    else if (depth > 0 && Math.random() < 0.25) {
      // Wading in the shallows: little splashes at the ankles.
      this.world.particles.emit(p.body.x, this.level + 0.05, p.body.z, { count: 1, color: '#e8fbff', speed: 1.5, life: 0.4, size: 0.3, up: 1.5 });
    }
  }

  /** Swept off by the sea: a splash, a heart, and back to the last dry spot. */
  private wash(p: Player) {
    const w = this.world;
    w.particles.emit(p.body.x, this.level + 0.1, p.body.z, { count: 26, color: '#e8fbff', speed: 6, life: 0.7, size: 0.5, up: 5 });
    w.rings.burst(p.body.x, this.level + 0.05, p.body.z, 4, '#bff4ff', 0.5);
    audio.play('vent', 1.4);
    if (!this.told) {
      this.told = true;
      w.hooks.toast('Splash! The tide washed us back. When the gauge blinks, get to high ground!', 'bolt');
    }
    p.washBack();
  }

  /** What the HUD gauge shows right now. */
  gauge(): TideGauge {
    const ph = tidePhase(this.def, this.world.time);
    return {
      fill: (this.level - this.def.low) / (this.def.high - this.def.low),
      phase: ph.phase,
      warn: ph.phase === 'low' && ph.left <= TIDE_WARN,
      secs: Math.ceil(ph.left),
    };
  }

  update(dt: number) {
    const w = this.world;
    this.level = tideLevel(this.def, w.time);
    this.water.position.y = this.level;
    if (this.tex) {
      this.tex.offset.x += dt * 0.012;
      this.tex.offset.y += dt * 0.007;
    }
    const ph = tidePhase(this.def, w.time);
    if (ph.phase !== this.last) {
      this.last = ph.phase;
      if (ph.phase === 'rising') audio.play('vent', 0.6);
      if (ph.phase === 'low') this.warned = false;
    }
    if (ph.phase === 'low' && ph.left <= TIDE_WARN && !this.warned) {
      this.warned = true;
      audio.play('blip', 0.7);
    }
    // Jumping or falling into deep water (off the reef, or over a flooded flat) is a splash too.
    const p = w.player;
    const b = p.body;
    if (!w.cutscene && !p.down && !p.zipping && b.y < this.level - FLOOD - 0.1 && b.vy <= 0 && this.flooded(Grid.toCell(b.x), Grid.toCell(b.z))) {
      const onBox = b.grounded && b.ground?.kind === 'box';
      if (!onBox) this.wash(p);
    }
  }
}

/**
 * A raft of driftwood lashed together, tied to a post on the tidal flats: it sits on the sand at low
 * tide and floats up with the sea, so at high tide it lifts whoever stands on it up beside the high ledges.
 */
export class Raft extends Entity {
  readonly box: Box;
  private mesh = new THREE.Group();
  private x: number;
  private z: number;
  private y: number;
  private readonly hw = CELL / 2 - 0.08;

  constructor(
    world: World,
    id: string,
    cx: number,
    cz: number,
    private floor: number,
  ) {
    super(world, id);
    this.x = Grid.center(cx);
    this.z = Grid.center(cz);
    this.y = floor + RAFT_TOP;
    const hw = this.hw;
    const logs = 3;
    const step = (hw * 2) / logs;
    const wood = new THREE.MeshStandardMaterial({ color: '#b0835a', roughness: 0.9 });
    const dark = new THREE.MeshStandardMaterial({ color: '#7a5636', roughness: 0.9 });
    for (let i = 0; i < logs; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(step / 2, step / 2, hw * 2, 10), i % 2 ? wood : dark);
      log.rotation.x = Math.PI / 2;
      log.position.set(-hw + step * (i + 0.5), -step / 2, 0);
      log.castShadow = true;
      this.mesh.add(log);
    }
    const rope = new THREE.MeshStandardMaterial({ color: '#e8d8a8', roughness: 1 });
    for (const z of [-hw * 0.6, hw * 0.6]) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(hw * 2 + 0.1, 0.1, 0.14), rope);
      r.position.set(0, -0.02, z);
      this.mesh.add(r);
    }
    // A little float of gold and white: rafts read as "this rides the sea".
    const buoy = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), new THREE.MeshStandardMaterial({ color: '#ff7a4a', roughness: 0.4, emissive: '#ff5a2a', emissiveIntensity: 0.25 }));
    buoy.position.set(hw - 0.15, 0.1, hw - 0.15);
    this.mesh.add(buoy);
    this.obj.add(this.mesh);
    this.box = { minX: this.x - hw, maxX: this.x + hw, minZ: this.z - hw, maxZ: this.z + hw, bottom: this.y - 0.5, top: this.y, solid: true, dx: 0, dy: 0, dz: 0, owner: this };
    world.boxes.push(this.box);
    this.mesh.position.set(this.x, this.y, this.z);
  }

  update() {
    const sea = this.world.tide?.level ?? -99;
    const afloat = sea > this.floor + RAFT_TOP - 0.2;
    const y = afloat ? sea + 0.2 + Math.sin(this.world.time * 2.2 + this.x) * 0.04 : this.floor + RAFT_TOP;
    this.box.dy = y - this.y;
    this.y = y;
    this.box.top = y;
    this.box.bottom = y - 0.5;
    this.mesh.position.y = y;
    this.mesh.rotation.z = afloat ? Math.sin(this.world.time * 1.7 + this.z) * 0.04 : 0;
  }
}
