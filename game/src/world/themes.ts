import type { ThemeId } from './levelTypes';

export type ParticleMood = 'snow' | 'spores' | 'embers' | 'petals' | 'sparks' | 'motes';

export interface Theme {
  skyTop: string;
  skyBottom: string;
  fog: string;
  fogNear: number;
  fogFar: number;
  floor: string;
  floorLine: string;
  floorSide: string;
  ice: string;
  wall: string;
  /** Colour of the wall light strips and trims. */
  wallTrim: string;
  edge: string;
  hazard: string;
  hazardDeep: string;
  hemiSky: string;
  hemiGround: string;
  hemi: number;
  sun: string;
  sunI: number;
  accent: string;
  mood: ParticleMood;
  /** Open to space (stars below the walkways) instead of deep machinery shafts. */
  space: boolean;
  /** Bloom strength for this deck's light strips and glowing hazards. */
  bloom: number;
}

export const THEMES: Record<ThemeId, Theme> = {
  cryo: {
    skyTop: '#02060e',
    skyBottom: '#0a1c30',
    fog: '#061222',
    fogNear: 44,
    fogFar: 145,
    floor: '#6b7784',
    floorLine: '#3c4652',
    floorSide: '#2a323c',
    ice: '#7a9db2',
    wall: '#4b5968',
    wallTrim: '#6fe3ff',
    edge: '#6fe3ff',
    hazard: '#55eaff',
    hazardDeep: '#06384a',
    hemiSky: '#bfe4ff',
    hemiGround: '#0e1a28',
    hemi: 0.8,
    sun: '#eaf6ff',
    sunI: 1.55,
    accent: '#6fe3ff',
    mood: 'snow',
    space: false,
    bloom: 0.55,
  },
  hydro: {
    skyTop: '#030805',
    skyBottom: '#10220f',
    fog: '#0a160b',
    fogNear: 42,
    fogFar: 140,
    floor: '#61675a',
    floorLine: '#3b4232',
    floorSide: '#2b2a22',
    ice: '#bfe0a8',
    wall: '#46503f',
    wallTrim: '#b8ff5a',
    edge: '#c8ff5a',
    hazard: '#8cff2a',
    hazardDeep: '#1c4208',
    hemiSky: '#f4f0c8',
    hemiGround: '#121c0c',
    hemi: 0.95,
    sun: '#fff2d6',
    sunI: 1.55,
    accent: '#b8ff5a',
    mood: 'spores',
    space: false,
    bloom: 0.5,
  },
  engine: {
    skyTop: '#060201',
    skyBottom: '#2a0c03',
    fog: '#160804',
    fogNear: 42,
    fogFar: 138,
    floor: '#5f5853',
    floorLine: '#3a322c',
    floorSide: '#2a221e',
    ice: '#c9b8a8',
    wall: '#4e443e',
    wallTrim: '#ffa23a',
    edge: '#ffb13a',
    hazard: '#ff6a12',
    hazardDeep: '#5a1400',
    hemiSky: '#ffd6ae',
    hemiGround: '#1e0e06',
    hemi: 0.9,
    sun: '#ffe0c0',
    sunI: 1.5,
    accent: '#ffa23a',
    mood: 'embers',
    space: false,
    bloom: 0.55,
  },
  habitat: {
    skyTop: '#05030c',
    skyBottom: '#1e1034',
    fog: '#110a1f',
    fogNear: 46,
    fogFar: 155,
    floor: '#6b6676',
    floorLine: '#443e52',
    floorSide: '#2c2638',
    ice: '#d8d0ff',
    wall: '#4f4861',
    wallTrim: '#ff7fd0',
    edge: '#ffc85a',
    hazard: '#c05cff',
    hazardDeep: '#34105a',
    hemiSky: '#ffe0f4',
    hemiGround: '#1a1228',
    hemi: 1.0,
    sun: '#fff0f8',
    sunI: 1.5,
    accent: '#ff7fd0',
    mood: 'petals',
    space: true,
    bloom: 0.5,
  },
  security: {
    skyTop: '#050203',
    skyBottom: '#200a0e',
    fog: '#12070a',
    fogNear: 42,
    fogFar: 138,
    floor: '#60646c',
    floorLine: '#3a3d44',
    floorSide: '#26292f',
    ice: '#c8ccd6',
    wall: '#454a54',
    wallTrim: '#ff3a4c',
    edge: '#ff5a66',
    hazard: '#5ec0ff',
    hazardDeep: '#0c2c52',
    hemiSky: '#ffe2e2',
    hemiGround: '#150c0e',
    hemi: 0.9,
    sun: '#ffffff',
    sunI: 1.55,
    accent: '#ff3a4c',
    mood: 'sparks',
    space: false,
    bloom: 0.6,
  },
  bridge: {
    skyTop: '#02030a',
    skyBottom: '#171040',
    fog: '#0a0820',
    fogNear: 48,
    fogFar: 160,
    floor: '#565d83',
    floorLine: '#343a64',
    floorSide: '#1e2348',
    ice: '#cfd6ff',
    wall: '#363e72',
    wallTrim: '#ff5fc8',
    edge: '#ff8ad8',
    hazard: '#ff4fbf',
    hazardDeep: '#4a0a3a',
    hemiSky: '#e4d8ff',
    hemiGround: '#120e2e',
    hemi: 1.0,
    sun: '#fff2ff',
    sunI: 1.55,
    accent: '#ff5fc8',
    mood: 'motes',
    space: true,
    bloom: 0.6,
  },
};
