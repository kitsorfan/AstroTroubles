import * as THREE from 'three';

import { glowSprite } from '../../entities/models';

/**
 * The little sub Dolphin, and the things it meets: Aeëtes's siren buoys and his piranha drones.
 * The Dolphin is shaped like its name: a round blue-and-white body with a dolphin's beak, a dorsal fin,
 * tail flukes with a propeller, side fins, and a big glass bubble on top where Jason steers and LUX
 * sits beside him. It points along -Z, up is +Y, and it is about 4 units long.
 */
export interface SubModel {
  root: THREE.Group;
  /** Tilts with the steering. */
  body: THREE.Group;
  /** The headlight beam (a spotlight, and a soft cone you can see in the water). */
  lamp: THREE.SpotLight;
  beam: THREE.Mesh;
  /** LUX in the cockpit: his eye glows pink while he sings. */
  luxEye: THREE.MeshBasicMaterial;
  update(t: number, thrust: number, singing: boolean): void;
}

const BLUE = '#3a8ad8';
const WHITE = '#eef6ff';
const GOLD = '#ffc94a';

export function makeSub(): SubModel {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const blue = new THREE.MeshStandardMaterial({ color: BLUE, roughness: 0.35, metalness: 0.15 });
  const white = new THREE.MeshStandardMaterial({ color: WHITE, roughness: 0.4, metalness: 0.05 });
  const gold = new THREE.MeshStandardMaterial({ color: GOLD, roughness: 0.3, metalness: 0.75, emissive: '#5a3a00', emissiveIntensity: 0.3 });
  const glass = new THREE.MeshStandardMaterial({ color: '#bff4ff', emissive: '#3fb6ff', emissiveIntensity: 0.25, roughness: 0.05, transparent: true, opacity: 0.38, depthWrite: false });

  // The body: blue on top, a white belly, and a rounded beak at the front.
  const top = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.55), blue);
  top.scale.set(1.05, 0.95, 2.1);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5), white);
  belly.scale.set(1.04, 0.82, 2.08);
  const beak = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.7, 6, 14).rotateX(Math.PI / 2), white);
  beak.position.set(0, -0.12, -2.25);
  body.add(top, belly, beak);
  // A gold stripe round the middle and a gold ring at the beak.
  const stripe = new THREE.Mesh(new THREE.TorusGeometry(1.03, 0.07, 8, 40), gold);
  stripe.scale.set(1.02, 0.92, 1);
  stripe.position.z = 0.4;
  body.add(stripe);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.06, 8, 24), gold);
  band.position.set(0, -0.12, -1.86);
  body.add(band);
  // Dorsal fin, side fins, and tail flukes.
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.quadraticCurveTo(0.2, 0.9, 0.9, 1.1);
  finShape.quadraticCurveTo(0.6, 0.5, 1.1, 0);
  finShape.closePath();
  const finG = new THREE.ExtrudeGeometry(finShape, { depth: 0.12, bevelEnabled: false }).translate(0, 0, -0.06);
  const dorsal = new THREE.Mesh(finG, blue);
  dorsal.rotation.y = Math.PI / 2;
  dorsal.position.set(0, 0.72, 1.1);
  body.add(dorsal);
  for (const s of [-1, 1]) {
    const fin = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 8), blue);
    fin.scale.set(0.7, 0.08, 0.36);
    fin.position.set(s * 1.15, -0.3, -0.2);
    fin.rotation.set(0, s * 0.4, s * -0.35);
    body.add(fin);
  }
  const tail = new THREE.Group();
  tail.position.set(0, 0, 2.05);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.45, 0.9, 14).rotateX(Math.PI / 2), blue);
  stem.position.z = 0.3;
  tail.add(stem);
  for (const s of [-1, 1]) {
    const fluke = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 8), blue);
    fluke.scale.set(0.72, 0.07, 0.3);
    fluke.position.set(s * 0.55, 0, 0.85);
    fluke.rotation.y = s * -0.5;
    tail.add(fluke);
  }
  const prop = new THREE.Group();
  prop.position.z = 0.9;
  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.05), gold);
    blade.position.y = 0.22;
    const arm = new THREE.Group();
    arm.rotation.z = (i / 3) * Math.PI * 2;
    arm.add(blade);
    prop.add(arm);
  }
  tail.add(prop);
  body.add(tail);

  // The cockpit bubble with Jason (orange suit) and LUX (white with a cyan eye) inside.
  const cockpit = new THREE.Group();
  cockpit.position.set(0, 0.62, -0.55);
  const jason = new THREE.Group();
  const suit = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), new THREE.MeshStandardMaterial({ color: '#ff8a2a', roughness: 0.5 }));
  suit.scale.set(1, 0.8, 0.9);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 10), new THREE.MeshStandardMaterial({ color: '#f4c8a0', roughness: 0.6 }));
  head.position.y = 0.32;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), new THREE.MeshStandardMaterial({ color: '#5a3418', roughness: 0.8 }));
  hair.position.y = 0.36;
  jason.add(suit, head, hair);
  jason.position.set(-0.22, 0.05, 0);
  const lux = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), white);
  const luxEye = new THREE.MeshBasicMaterial({ color: '#5ef0ff' });
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), luxEye);
  eye.position.set(0, 0.02, -0.17);
  lux.add(shell, eye);
  lux.position.set(0.3, 0.2, -0.1);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.62, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), glass);
  dome.scale.set(1, 0.95, 1.25);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.06, 8, 30).rotateX(Math.PI / 2), gold);
  rim.scale.set(1, 1.25, 1);
  cockpit.add(jason, lux, dome, rim);
  body.add(cockpit);

  // The headlight in the beak, with a soft visible cone.
  const lampHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff6c8' }));
  lampHead.position.set(0, -0.12, -2.62);
  lampHead.add(glowSprite('#fff2b0', 1.6, 0.7));
  body.add(lampHead);
  const lamp = new THREE.SpotLight('#fff2c8', 60, 42, 0.5, 0.6, 1.2);
  lamp.position.set(0, -0.1, -2.6);
  lamp.target.position.set(0, -1.2, -20);
  body.add(lamp, lamp.target);
  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(3.2, 16, 24, 1, true).rotateX(-Math.PI / 2).translate(0, 0, -8),
    new THREE.MeshBasicMaterial({ color: '#fff2c8', transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }),
  );
  beam.position.set(0, -0.15, -2.6);
  beam.rotation.x = -0.06;
  body.add(beam);

  return {
    root,
    body,
    lamp,
    beam,
    luxEye,
    update(t: number, thrust: number, singing: boolean) {
      prop.rotation.z = t * (8 + thrust * 16);
      tail.rotation.y = Math.sin(t * 2.4) * 0.12;
      lux.position.y = 0.2 + Math.sin(t * 3) * 0.03 + (singing ? Math.abs(Math.sin(t * 8)) * 0.06 : 0);
      luxEye.color.set(singing ? '#ff8ad0' : '#5ef0ff');
    },
  };
}

/* ---------------- siren buoys ---------------- */

export interface BuoyModel {
  root: THREE.Group;
  /** The pink speaker face: it glows while singing and goes grey when silenced. */
  voice: THREE.MeshStandardMaterial;
  glow: THREE.Sprite;
  update(t: number, singing: boolean, quiet: boolean): void;
}

/** A siren buoy: a gold ball on a long chain down to the seabed, with a pink speaker horn on its face. */
export function makeBuoy(): BuoyModel {
  const root = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: '#ffc23a', roughness: 0.3, metalness: 0.8, emissive: '#4a2a00', emissiveIntensity: 0.3 });
  const voice = new THREE.MeshStandardMaterial({ color: '#ff6fb0', emissive: '#ff3a9a', emissiveIntensity: 1.2, roughness: 0.3 });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1.1, 22, 16), gold);
  const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.25, 0.9, 20, 1, true).rotateX(Math.PI / 2), voice);
  horn.material.side = THREE.DoubleSide;
  horn.position.z = 1.15;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), voice);
  cap.position.z = 0.75;
  // A little crown of fins on top, and Aeëtes's eye on the crown.
  for (let i = 0; i < 5; i++) {
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.6, 6), gold);
    const a = (i / 5) * Math.PI * 2;
    fin.position.set(Math.cos(a) * 0.5, 1.15, Math.sin(a) * 0.5);
    root.add(fin);
  }
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 30, 6), new THREE.MeshStandardMaterial({ color: '#5a4a3a', roughness: 0.8 }));
  chain.position.y = -15.5;
  const glow = glowSprite('#ff6fb0', 5, 0.55);
  glow.position.z = 1.3;
  root.add(ball, horn, cap, chain, glow);
  return {
    root,
    voice,
    glow,
    update(t: number, singing: boolean, quiet: boolean) {
      ball.position.y = Math.sin(t * 1.3) * 0.15;
      const pulse = singing ? 1 + Math.abs(Math.sin(t * Math.PI * 1.333)) * 1.4 : 0.6;
      voice.color.set(quiet ? '#7a7a8a' : '#ff6fb0');
      voice.emissive.set(quiet ? '#000000' : '#ff3a9a');
      voice.emissiveIntensity = quiet ? 0 : pulse;
      glow.visible = !quiet;
      glow.scale.setScalar(singing ? 4 + pulse * 1.6 : 3);
    },
  };
}

/* ---------------- piranha drones ---------------- */

/** A piranha drone: a round gold fish robot with a forked tail, a toothy underbite and one red eye. Faces +Z (toward the sub). */
export function makePiranha(): THREE.Group {
  const g = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: '#ffb020', roughness: 0.3, metalness: 0.75, emissive: '#5a2a00', emissiveIntensity: 0.35 });
  const dark = new THREE.MeshStandardMaterial({ color: '#2a1a10', roughness: 0.6 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), gold);
  body.scale.set(0.75, 1, 1.1);
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 8, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5), dark);
  jaw.position.set(0, -0.12, 0.38);
  for (let i = 0; i < 4; i++) {
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 4), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
    tooth.position.set(-0.18 + i * 0.12, -0.08, 0.66);
    g.add(tooth);
  }
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.6, 4).rotateX(-Math.PI / 2), gold);
  tail.scale.set(0.25, 1, 1);
  tail.position.z = -0.75;
  tail.name = 'tail';
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff2a3a' }));
    eye.position.set(s * 0.33, 0.18, 0.32);
    g.add(eye);
  }
  g.add(body, jaw, tail);
  return g;
}
