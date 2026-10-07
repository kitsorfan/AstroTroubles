import * as THREE from 'three';

import { audio } from '../core/audio';
import { haptic } from '../core/bridge';
import type { Boss } from '../entities/bossBase';
import { makeSnare } from '../entities/companionModels';
import { ROGUE_SCALE, type RogueLux } from '../entities/gaia/rogue';
import type { BoltFind } from '../entities/props';
import type { World } from '../game/world';
import { Grid } from '../world/grid';
import { BOSS_CARD } from '../game/story';
import { ease, type Director, type Rig } from './director';

/**
 * The cutscenes of LUX's story in chapter 2: Brennus's snare drone carries LUX off after BOREAS
 * falls (Frostpeak Tundra), Jason wakes IRIS in the jungle roots, and in Mount Atlantas the
 * reprogrammed LUX appears, and later comes home when IRIS sings the control chip off him.
 */

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

function jason(w: World) {
  const b = w.player.body;
  return V(b.x, b.y, b.z);
}

/** Flat unit vector from a to b. */
function toward(a: THREE.Vector3, b: THREE.Vector3) {
  const v = V(b.x - a.x, 0, b.z - a.z);
  return v.lengthSq() < 1e-6 ? V(0, 0, 1) : v.normalize();
}

function face(w: World, at: THREE.Vector3) {
  const p = w.player.body;
  w.player.facing = Math.atan2(at.x - p.x, at.z - p.z);
}

function follow(w: World, dist = 13): Rig {
  return w.followPose({ pos: V(), look: V(), fov: 50 }, dist);
}

/** How far Jason can run straight ahead (up to `max`) before a wall, a drop or a step gets in the way. */
function runRoom(w: World, from: THREE.Vector3, dir: THREE.Vector3, max: number) {
  const start = w.grid.cell(Grid.toCell(from.x), Grid.toCell(from.z));
  for (let s = 0.5; s <= max; s += 0.5) {
    const c = w.grid.cell(Grid.toCell(from.x + dir.x * (s + 0.6)), Grid.toCell(from.z + dir.z * (s + 0.6)));
    if (c.kind === 'wall' || c.kind === 'void' || c.kind === 'hazard' || Math.abs(c.h - start.h) > 0.3) return s - 0.5;
  }
  return max;
}

/* ---------------- Frostpeak Tundra: LUX is taken ---------------- */

/**
 * BOREAS is down and LUX is doing a victory spin... when a black drone drops out of the blizzard,
 * snaps its cage shut around him and carries him off toward the volcano. Jason runs after it, too
 * late, while Brennus gloats over the radio.
 */
export async function luxTaken(d: Director, w: World) {
  const lux = w.lux;
  const k = jason(w);
  const fwd = V(Math.sin(w.player.facing), 0, Math.cos(w.player.facing));
  const side = V(fwd.z, 0, -fwd.x);
  // LUX floats a few steps ahead of Jason, celebrating.
  const spot = k.clone().addScaledVector(fwd, 2.6).add(V(0, 1.9, 0));
  const hold = spot.clone();
  lux.override = hold;
  const snare = makeSnare();
  snare.cage.scale.y = 0.15;
  const sky = spot.clone().addScaledVector(fwd, 6).add(V(0, 16, 0));
  snare.root.position.copy(sky);
  w.scene.add(snare.root);
  let run = 0;
  let step = 0;
  w.player.pose = (m) => {
    if (run <= 0) return;
    const s = Math.sin(step) * 0.9 * run;
    m.legL.rotation.x = s;
    m.legR.rotation.x = -s;
    m.armL.rotation.x = -s * 0.8;
    m.armR.rotation.x = s * 0.8;
    m.armR.rotation.z = -0.4 * run;
  };
  const spinRotors = (dt = 0.6) => {
    for (const r of snare.rotors) r.rotation.y += dt;
  };
  try {
    face(w, spot);
    await d.cam(k.clone().addScaledVector(side, 5).addScaledVector(fwd, -1.5).add(V(0, 2.4, 0)), k.clone().lerp(spot, 0.6).add(V(0, 0.4, 0)), 1.1, ease.inOut, 46);
    // A happy loop-the-loop...
    audio.play('djump', 1.2);
    await d.tween(1.1, (x) => {
      hold.copy(spot).add(V(Math.sin(x * Math.PI * 2) * 0.6, Math.sin(x * Math.PI) * 0.8, 0));
      lux.model.root.rotation.z = x * Math.PI * 2;
    });
    lux.model.root.rotation.z = 0;
    hold.copy(spot);
    // ...until the alarm goes off and the drone drops out of the snow.
    audio.play('alarm');
    w.flash(spot.x, spot.y + 4, spot.z, '#ff3a4c', 40, 0.4);
    await Promise.all([
      d.cam(k.clone().addScaledVector(side, 6.5).addScaledVector(fwd, -2).add(V(0, 2.4, 0)), spot.clone().add(V(0, 0.3, 0)), 1.3, ease.inOut, 50),
      d.tween(
        1.4,
        (x) => {
          snare.root.position.lerpVectors(sky, spot.clone().add(V(0, 1.15, 0)), x);
          spinRotors();
          if (Math.random() < 0.5) w.particles.emit(snare.root.position.x, snare.root.position.y - 0.4, snare.root.position.z, { count: 1, color: '#e8f2ff', speed: 1.5, life: 0.6, size: 0.6 });
        },
        ease.out,
      ),
    ]);
    // SNAP.
    audio.play('shield', 0.8);
    haptic('heavy');
    w.shake(0.4);
    await d.tween(0.25, (x) => {
      snare.cage.scale.y = 0.15 + 0.85 * x;
      spinRotors();
    });
    w.flash(spot.x, spot.y, spot.z, '#ff3a4c', 60, 0.4);
    w.particles.emit(spot.x, spot.y, spot.z, { count: 30, color: '#ff4a5a', speed: 5, life: 0.5, size: 0.5 });
    lux.model.iris.emissiveIntensity = 5;
    await d.say(w.dialogue('trap'));
    // Up and away, toward the volcano. Jason runs after it.
    const from = snare.root.position.clone();
    const away = from.clone().addScaledVector(fwd, 18).add(V(0, 12, 0));
    const body = w.player.body;
    const k0 = jason(w);
    const reach = runRoom(w, k0, fwd, 3.4);
    const cam0 = d.rig.pos.clone();
    const cam1 = k.clone().addScaledVector(side, 3).addScaledVector(fwd, -4).add(V(0, 1.6, 0));
    audio.play('dash', 0.6);
    await d.tween(
      2.6,
      (x) => {
        snare.root.position.lerpVectors(from, away, x * x);
        hold.copy(snare.root.position).add(V(0, -1.15, 0));
        lux.model.root.rotation.z = Math.sin(x * 30) * 0.3;
        spinRotors(0.8);
        run = x < 0.75 ? 1 : 1 - (x - 0.75) * 4;
        step += 0.35;
        const go = (Math.min(x, 0.75) / 0.75) * reach;
        body.x = k0.x + fwd.x * go;
        body.z = k0.z + fwd.z * go;
        // The camera hangs back behind Jason and watches the drone go.
        d.rig.pos.lerpVectors(cam0, cam1, ease.inOut(Math.min(1, x * 1.6)));
        d.rig.look.copy(snare.root.position).lerp(jason(w).add(V(0, 1.4, 0)), 0.35 * (1 - x));
      },
      ease.linear,
    );
    run = 0;
    snare.root.visible = false;
    lux.active = false;
    await d.panel('ch2-luxtaken', { lines: w.dialogue('taken') });
  } finally {
    w.player.pose = null;
    lux.override = null;
    lux.model.root.rotation.z = 0;
    w.scene.remove(snare.root);
    // LUX is gone: from here on Jason is on his own (helmet lamp, wrist computer, HALCYON on the radio).
    w.refreshCompanions();
  }
  const back = follow(w);
  await d.cam(back.pos, back.look, 1.1);
}

/* ---------------- Thornwood Jungle: IRIS wakes up ---------------- */

/**
 * In the roots by the landing site, Jason finds a slim droid switched off and tangled in vines. He
 * clears the vines and touches two wires together: her visor flickers through every colour, she
 * rises, unfolds her fins and swims a slow circle around him in the air.
 */
export async function irisFound(d: Director, w: World, find: BoltFind) {
  const s = find.spot.clone();
  const k = jason(w);
  face(w, s);
  const dir = toward(s, k);
  const side = V(dir.z, 0, -dir.x);
  const iris = find.model;
  let kneel = 0;
  w.player.pose = (m) => {
    m.body.position.y = -0.3 * kneel;
    m.body.rotation.x = 0.45 * kneel;
    m.armR.rotation.x = -1.3 * kneel;
    m.armL.rotation.x = -1.1 * kneel;
    m.head.rotation.x = 0.35 * kneel;
  };
  find.waking = true;
  // She lies tipped over in the roots, facing Jason.
  iris.root.rotation.y = Math.atan2(dir.x, dir.z);
  const hue = new THREE.Color();
  try {
    await Promise.all([
      d.cam(s.clone().addScaledVector(dir, 2.8).addScaledVector(side, 1.1).add(V(0, 1.3, 0)), s.clone().add(V(0, 0.45, 0)), 1.2, ease.inOut, 42),
      d.tween(0.8, (x) => (kneel = x)),
    ]);
    // Leaves and vines pulled away, then a spark: her visor stutters through the rainbow.
    await d.tween(
      1.8,
      (x) => {
        if (Math.random() < 0.3) w.particles.emit(s.x, s.y + 0.4, s.z, { count: 3, color: x < 0.5 ? '#5f9a3a' : '#ffd166', speed: 3, life: 0.4, size: 0.35 });
        hue.setHSL((x * 3) % 1, 0.9, 0.62);
        iris.iris.color.copy(hue);
        iris.iris.emissive.copy(hue);
        iris.iris.emissiveIntensity = Math.random() < x ? 2.4 : 0.2;
      },
      ease.linear,
    );
    audio.play('tone0');
    iris.glow.visible = true;
    haptic('light');
    await d.say(w.dialogue('irisWake'));
    // Up she floats, slow and graceful, and turns a full circle to look at everything.
    audio.play('tone1');
    const y0 = iris.root.position.y;
    const z0 = iris.root.rotation.z;
    await Promise.all([
      d.tween(
        1.6,
        (x) => {
          iris.root.position.y = y0 + x * 1.7;
          iris.root.rotation.z = z0 * (1 - x);
          iris.root.rotation.y = x * Math.PI * 2;
        },
        ease.inOut,
      ),
      d.tween(0.9, (x) => (kneel = 1 - x)),
      d.cam(k.clone().lerp(s, 0.5).addScaledVector(side, 5).add(V(0, 2.4, 0)), s.clone().add(V(0, 1.5, 0)), 1.4, ease.inOut, 44),
    ]);
    // A slow, swimming circle around Jason, trailing rainbow sparkles.
    const c = jason(w);
    const r0 = V(iris.root.position.x - c.x, 0, iris.root.position.z - c.z);
    const a0 = Math.atan2(r0.x, r0.z);
    audio.play('tone2');
    await d.tween(
      2.4,
      (x) => {
        const a = a0 + x * Math.PI * 2;
        const r = 1.8 + Math.sin(x * Math.PI) * 0.5;
        iris.root.position.set(c.x + Math.sin(a) * r, c.y + 2.1 + Math.sin(x * Math.PI * 2) * 0.25, c.z + Math.cos(a) * r);
        iris.root.rotation.y = a + Math.PI / 2;
        hue.setHSL(x % 1, 0.9, 0.65);
        w.particles.emit(iris.root.position.x, iris.root.position.y, iris.root.position.z, { count: 1, color: '#' + hue.getHexString(), speed: 0.3, life: 0.6, size: 0.4, gravity: 0 });
        face(w, iris.root.position);
      },
      ease.inOut,
    );
    await d.panel('ch2-iris', { lines: w.dialogue('irisJoin') });
  } finally {
    w.player.pose = null;
    const at = iris.root.position.clone();
    w.joinBolt('iris');
    w.iris.place(at.x, at.y, at.z);
    find.remove();
  }
  const back = follow(w);
  await d.cam(back.pos, back.look, 1);
}

/* ---------------- Mount Atlantas: Shadow LUX ---------------- */

/** Brennus shows off what he did to LUX; IRIS spots the control chip on his back. */
export async function rogueIntro(d: Director, w: World, b: Boss) {
  const rogue = b as RogueLux;
  const f = rogue.focus;
  const k = jason(w);
  face(w, f);
  const u = toward(f, k);
  const side = V(u.z, 0, -u.x);
  const card = BOSS_CARD.rogue;
  w.bolt.override = k.clone().addScaledVector(side, -1.4).add(V(0, 2, 0));
  try {
    await d.cam(k.clone().addScaledVector(u, 5.5).addScaledVector(side, 2.4).add(V(0, 3.2, 0)), f.clone().lerp(k, 0.2), 1.2, ease.inOut, 48);
    await d.say(w.dialogue('rogue'));
    // Close on him: the red eye blazes.
    await d.cam(f.clone().addScaledVector(u, 4.8).addScaledVector(side, 1).add(V(0, -0.2, 0)), f, 1.2, ease.inOut, 42);
    audio.play('alarm');
    w.shake(0.5);
    w.flash(f.x, f.y, f.z, card.color, 60, 0.6);
    w.rings.burst(f.x, f.y - 1.5, f.z, 5, card.color, 0.6);
    w.particles.emit(f.x, f.y, f.z, { count: 40, color: card.color, speed: 7, life: 0.8, size: 0.6 });
    haptic('heavy');
    await d.title(b.title, card.sub, card.color);
    await d.say(w.dialogue('rogueFight'));
    const fight = follow(w, 17);
    await d.cam(fight.pos, fight.look, 1, ease.inOut, fight.fov);
  } finally {
    w.bolt.override = null;
  }
}

/**
 * The chip is cracked. IRIS sings her three light-words, the chip pops off, the thorny armour falls
 * away piece by piece, and LUX's eye turns cyan again. Then the hug (as much as a drone can hug).
 */
export async function luxReunion(d: Director, w: World, b: Boss) {
  const rogue = b as RogueLux;
  rogue.freeing = true;
  const m = rogue.model;
  const c = rogue.pos.clone();
  const k = jason(w);
  face(w, c);
  const u = toward(c, k);
  const side = V(u.z, 0, -u.x);
  const beacon = k.clone().lerp(c, 0.5).addScaledVector(side, 1.2).add(V(0, 2.4, 0));
  w.iris.override = beacon;
  const pieces = [...rogue.parts.armour.children].map((o) => ({
    o,
    p0: o.position.clone(),
    v: V(o.position.x * 6 + (Math.random() - 0.5), 2 + Math.random() * 2, o.position.z * 6 + (Math.random() - 0.5)),
  }));
  try {
    await d.cam(k.clone().addScaledVector(u, 4.5).addScaledVector(side, 3.2).add(V(0, 2.6, 0)), c.clone().lerp(beacon, 0.4), 1.4, ease.inOut, 46);
    await d.say(w.dialogue('rogueDown'));
    // Hello... safe... together.
    const words: [string, 'tone0' | 'tone1' | 'tone2'][] = [
      ['#5e9bff', 'tone0'],
      ['#ff6fcf', 'tone1'],
      ['#ffd166', 'tone2'],
    ];
    for (const [color, tone] of words) {
      audio.play(tone);
      w.flash(beacon.x, beacon.y, beacon.z, color, 50, 0.6);
      w.beams.zap(w.iris.pos.clone(), c.clone(), color);
      w.particles.emit(beacon.x, beacon.y, beacon.z, { count: 18, color, speed: 4, life: 0.8, size: 0.6, gravity: 0 });
      m.iris.color.set('#5ee0ff');
      m.iris.emissive.set('#5ee0ff');
      await d.tween(0.85, (x) => {
        const cyan = Math.random() < x * 0.8;
        m.iris.emissive.set(cyan ? '#5ee0ff' : '#ff2a3a');
        m.iris.color.copy(m.iris.emissive);
      });
    }
    // CRACK: the chip pops off and the armour falls away.
    audio.play('break');
    audio.play('explode', 1.4);
    haptic('heavy');
    w.shake(0.5);
    w.flash(c.x, c.y, c.z, '#ffffff', 80, 0.6);
    w.particles.emit(c.x, c.y, c.z, { count: 40, color: '#ff3a4c', speed: 8, life: 0.7, size: 0.5 });
    m.iris.color.set('#5ee0ff');
    m.iris.emissive.set('#5ee0ff');
    m.glow.material.color.set('#5ee0ff');
    await Promise.all([
      d.tween(
        1.4,
        (x) => {
          for (const p of pieces) {
            p.o.position.set(p.p0.x + p.v.x * x, p.p0.y + p.v.y * x - 6 * x * x, p.p0.z + p.v.z * x);
            p.o.rotation.x += 0.2;
          }
          m.root.scale.setScalar(ROGUE_SCALE + (1 - ROGUE_SCALE) * x);
          rogue.pos.y = c.y + 0.4 * x;
        },
        ease.out,
      ),
      d.cam(c.clone().addScaledVector(u, 3).addScaledVector(side, 1).add(V(0, 0.3, 0)), c.clone().add(V(0, 0.2, 0)), 1.4, ease.inOut, 40),
    ]);
    rogue.parts.armour.visible = false;
    m.iris.emissiveIntensity = 2.4;
    await d.wait(0.5);
    // He blinks, looks around, and zooms straight to Jason.
    audio.play('djump');
    const from = rogue.pos.clone();
    const to = k.clone().addScaledVector(u, 0.9).add(V(0, 1.7, 0));
    await Promise.all([
      d.tween(0.9, (x) => rogue.pos.lerpVectors(from, to, x), ease.inOut),
      d.cam(k.clone().lerp(c, 0.4).addScaledVector(side, 4.2).add(V(0, 2.2, 0)), k.clone().add(V(0, 1.4, 0)), 1.1, ease.inOut, 44),
    ]);
    await d.panel('ch2-luxback', { lines: w.dialogue('luxBack') });
  } finally {
    const at = rogue.pos.clone();
    rogue.remove();
    w.iris.override = null;
    w.refreshCompanions();
    w.lux.place(at.x, at.y, at.z);
  }
  const back = follow(w);
  await d.cam(back.pos, back.look, 1);
}
