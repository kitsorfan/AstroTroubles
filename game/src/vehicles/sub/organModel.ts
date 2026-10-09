import * as THREE from 'three';

import { glowSprite } from '../../entities/models';
import { ORGAN } from './organ';

/**
 * THE SIREN ORGAN, drawn: a giant gold pipe organ Aeëtes bolted onto a coral-covered Gardener platform
 * on the seabed. Six tall pipes bend forward at the top into trumpet mouths (one glows pink and sings
 * at a time; the others wear gold caps), a huge pink siren horn sits in the middle under Aeëtes's gold
 * eyepatch-screen, and a long gold keyboard runs along the front, its keys playing themselves.
 * The mouths sit at the (x, y) of ORGAN.pipes, on the model's z = 0 plane, facing +Z (toward the sub).
 */
export interface OrganPipeView {
  group: THREE.Group;
  mouth: THREE.MeshStandardMaterial;
  cap: THREE.Mesh;
  glow: THREE.Sprite;
  broken: boolean;
}

export interface OrganModel {
  root: THREE.Group;
  pipes: OrganPipeView[];
  horn: THREE.MeshStandardMaterial;
  hornGlow: THREE.Sprite;
  update(t: number, lit: number, finale: boolean, tempo: number): void;
  breakPipe(i: number): void;
}

const SEABED = -9;

export function makeOrgan(): OrganModel {
  const root = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: '#e0a830', roughness: 0.45, metalness: 0.7, emissive: '#3a2000', emissiveIntensity: 0.2 });
  const darkGold = new THREE.MeshStandardMaterial({ color: '#a8701a', roughness: 0.5, metalness: 0.7 });
  const stone = new THREE.MeshStandardMaterial({ color: '#6a8a8a', roughness: 0.9, flatShading: true });
  const coral = ['#ff7a8a', '#ffb84a', '#c87aff'].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, emissive: c, emissiveIntensity: 0.15 }));

  // The Gardener platform: a wide round plinth of old stone with glowing teal light-words round its rim.
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(15, 17, 4, 10), stone);
  plinth.position.set(0, SEABED - 1, -4);
  root.add(plinth);
  for (let i = 0; i < 14; i++) {
    const a = Math.PI * (0.15 + (i / 13) * 0.7);
    const word = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.1), new THREE.MeshBasicMaterial({ color: '#4ae0d8' }));
    word.position.set(Math.cos(a) * 16.1, SEABED - 0.6, -4 + Math.sin(a) * 16.1);
    word.lookAt(0, SEABED - 0.6, -4);
    root.add(word);
  }
  // Coral growing all over the old stone.
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    const r = 8 + (i % 4) * 2;
    const c = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8 + (i % 3) * 0.5, 0), coral[i % 3]);
    c.position.set(Math.cos(a) * r, SEABED + 1 + (i % 2) * 0.4, -4 + Math.sin(a) * r * 0.6);
    c.scale.y = 1.4;
    root.add(c);
  }

  // The keyboard along the front: a gold desk with keys that bob up and down.
  const desk = new THREE.Mesh(new THREE.BoxGeometry(18, 1.6, 2.4), gold);
  desk.position.set(0, SEABED + 1.8, 2);
  root.add(desk);
  const keys: THREE.Mesh[] = [];
  for (let i = 0; i < 24; i++) {
    const k = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.25, 1.4), new THREE.MeshStandardMaterial({ color: i % 3 === 1 ? '#1a1420' : '#fff8ea', roughness: 0.4 }));
    k.position.set(-8.1 + i * 0.7, SEABED + 2.75, 2.5);
    keys.push(k);
    root.add(k);
  }

  // The great siren horn in the middle, and Aeëtes's gold eye above it.
  const horn = new THREE.MeshStandardMaterial({ color: '#ff6fb0', emissive: '#ff3a9a', emissiveIntensity: 0.8, roughness: 0.3, side: THREE.DoubleSide });
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 0.8, 4.5, 28, 1, true).rotateX(Math.PI / 2), horn);
  bell.position.set(0, -3.2, -1);
  const throat = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 6, 16), darkGold);
  throat.position.set(0, SEABED + 3.5, -3.6);
  const hornGlow = glowSprite('#ff6fb0', 9, 0.5);
  hornGlow.position.set(0, -3.2, 1.4);
  root.add(bell, throat, hornGlow);
  const eye = new THREE.Group();
  const eyeRim = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.3, 10, 30), gold);
  const eyeScreen = new THREE.Mesh(new THREE.CircleGeometry(1.4, 28), new THREE.MeshBasicMaterial({ color: '#ffd166' }));
  const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.55, 20), new THREE.MeshBasicMaterial({ color: '#3a1a00' }));
  pupil.position.z = 0.02;
  eye.add(eyeRim, eyeScreen, pupil);
  eye.position.set(0, 1.2, -2.5);
  root.add(eye);

  // The six pipes: a tall gold tube from the platform up to its mouth, bent forward into a trumpet.
  const pipes: OrganPipeView[] = ORGAN.pipes.map(([x, y], i) => {
    const group = new THREE.Group();
    const h = y - SEABED + 1;
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.9, h, 18), i % 2 ? darkGold : gold);
    tube.position.set(0, -h / 2 - 0.6, -2.4);
    const elbow = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.75, 12, 18, Math.PI / 2), i % 2 ? darkGold : gold);
    elbow.rotation.set(0, Math.PI / 2, 0);
    elbow.position.set(0, -0.6, -1.2);
    const mouth = new THREE.MeshStandardMaterial({ color: '#ff8ad0', emissive: '#ff3a9a', emissiveIntensity: 0.2, roughness: 0.3, side: THREE.DoubleSide });
    const trumpet = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 0.75, 1.6, 22, 1, true).rotateX(Math.PI / 2), mouth);
    trumpet.position.set(0, 0, -0.2);
    const cap = new THREE.Mesh(new THREE.CircleGeometry(1.55, 22), gold);
    cap.position.set(0, 0, 0.62);
    const glow = glowSprite('#ff6fb0', 4.5, 0.75);
    glow.position.z = 0.8;
    group.add(tube, elbow, trumpet, cap, glow);
    group.position.set(x, y, 0);
    root.add(group);
    return { group, mouth, cap, glow, broken: false };
  });

  return {
    root,
    pipes,
    horn,
    hornGlow,
    update(t: number, lit: number, finale: boolean, tempo: number) {
      pipes.forEach((p, i) => {
        if (p.broken) return;
        const on = !finale && i === lit;
        p.cap.visible = !on;
        p.glow.visible = on;
        p.mouth.emissiveIntensity = on ? 1.2 + Math.abs(Math.sin(t * 6 * tempo)) * 1.2 : 0.15;
        p.group.scale.setScalar(on ? 1 + Math.abs(Math.sin(t * 6 * tempo)) * 0.06 : 1);
      });
      keys.forEach((k, i) => (k.position.y = SEABED + 2.75 - (Math.sin(t * 7 * tempo + i * 1.9) > 0.7 ? 0.18 : 0)));
      const sing = finale ? 1.5 + Math.abs(Math.sin(t * 9)) * 1.5 : 0.6 + Math.abs(Math.sin(t * 3 * tempo)) * 0.5;
      horn.emissiveIntensity = sing;
      hornGlow.scale.setScalar(finale ? 10 + Math.sin(t * 9) * 2 : 8);
      pupil.position.x = Math.sin(t * 0.7) * 0.5;
    },
    breakPipe(i: number) {
      const p = pipes[i];
      p.broken = true;
      p.cap.visible = false;
      p.glow.visible = false;
      p.mouth.color.set('#5a4a5a');
      p.mouth.emissiveIntensity = 0;
      // The top snaps off and the pipe leans over, with a few holes in it.
      p.group.rotation.z = (i < 3 ? 1 : -1) * 0.35;
      p.group.position.y -= 1.2;
      p.group.scale.set(1, 0.85, 1);
    },
  };
}
