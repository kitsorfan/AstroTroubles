import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import type { MusicId, SfxId } from '../types';

const SFX: Record<SfxId, number> = {
  step: require('../../../assets/audio/step.wav'),
  bump: require('../../../assets/audio/bump.wav'),
  door: require('../../../assets/audio/door.wav'),
  hack: require('../../../assets/audio/hack.wav'),
  pickup: require('../../../assets/audio/pickup.wav'),
  select: require('../../../assets/audio/select.wav'),
  blip: require('../../../assets/audio/blip.wav'),
  hit: require('../../../assets/audio/hit.wav'),
  crit: require('../../../assets/audio/crit.wav'),
  miss: require('../../../assets/audio/miss.wav'),
  zap: require('../../../assets/audio/zap.wav'),
  shield: require('../../../assets/audio/shield.wav'),
  heal: require('../../../assets/audio/heal.wav'),
  burn: require('../../../assets/audio/burn.wav'),
  emp: require('../../../assets/audio/emp.wav'),
  death: require('../../../assets/audio/death.wav'),
  levelup: require('../../../assets/audio/levelup.wav'),
  alarm: require('../../../assets/audio/alarm.wav'),
  victory: require('../../../assets/audio/victory.wav'),
  defeat: require('../../../assets/audio/defeat.wav'),
  scan: require('../../../assets/audio/scan.wav'),
  elevator: require('../../../assets/audio/elevator.wav'),
  hurt: require('../../../assets/audio/hurt.wav'),
};

const MUSIC: Record<MusicId, number> = {
  explore: require('../../../assets/audio/explore.wav'),
  battle: require('../../../assets/audio/battle.wav'),
  boss: require('../../../assets/audio/boss.wav'),
  title: require('../../../assets/audio/title.wav'),
};

const SFX_VOLUME: Partial<Record<SfxId, number>> = { step: 0.35, blip: 0.5, select: 0.6 };
const MUSIC_VOLUME = 0.4;
const POOL_SIZE = 3;

let sfxOn = true;
let musicOn = true;
let hapticsOn = true;
let modeSet = false;
const pools = new Map<SfxId, AudioPlayer[]>();
let musicPlayer: AudioPlayer | null = null;
let currentMusic: MusicId | null = null;

function ensureMode() {
  if (modeSet) return;
  modeSet = true;
  setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false }).catch(() => {});
}

export function configureAudio(opts: { sfx: boolean; music: boolean; haptics: boolean }) {
  sfxOn = opts.sfx;
  hapticsOn = opts.haptics;
  if (musicOn !== opts.music) {
    musicOn = opts.music;
    const track = currentMusic;
    currentMusic = null;
    stopMusicPlayer();
    if (musicOn && track) playMusic(track);
    else currentMusic = track;
  }
}

export function playSfx(id: SfxId) {
  if (!sfxOn) return;
  ensureMode();
  try {
    let pool = pools.get(id);
    if (!pool) {
      pool = [];
      pools.set(id, pool);
    }
    let player = pool.find((p) => !p.playing);
    if (!player && pool.length < POOL_SIZE) {
      player = createAudioPlayer(SFX[id]);
      pool.push(player);
    }
    player ??= pool[0];
    player.volume = SFX_VOLUME[id] ?? 1;
    void player.seekTo(0);
    player.play();
  } catch {
    // Audio is best-effort; a failed sound must never break gameplay.
  }
}

function stopMusicPlayer() {
  if (!musicPlayer) return;
  try {
    musicPlayer.pause();
    musicPlayer.remove();
  } catch {
    // ignore
  }
  musicPlayer = null;
}

export function playMusic(id: MusicId | null) {
  if (id === currentMusic) return;
  currentMusic = id;
  stopMusicPlayer();
  if (!id || !musicOn) return;
  ensureMode();
  try {
    musicPlayer = createAudioPlayer(MUSIC[id]);
    musicPlayer.loop = true;
    musicPlayer.volume = MUSIC_VOLUME;
    musicPlayer.play();
  } catch {
    musicPlayer = null;
  }
}

export function pauseMusic(paused: boolean) {
  try {
    if (paused) musicPlayer?.pause();
    else musicPlayer?.play();
  } catch {
    // ignore
  }
}

export type HapticKind = 'tap' | 'hit' | 'heavy' | 'success' | 'warning';

export function haptic(kind: HapticKind) {
  if (!hapticsOn || Platform.OS === 'web') return;
  const run = () => {
    switch (kind) {
      case 'tap':
        return Haptics.selectionAsync();
      case 'hit':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      case 'heavy':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      case 'success':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      case 'warning':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };
  run().catch(() => {});
}
