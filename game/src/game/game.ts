import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

import { Director, type Rig } from '../cinema/director';
import { flyover, wakeUp } from '../cinema/scenes';
import { ShipScene } from '../cinema/shipScene';
import * as space from '../cinema/spaceScenes';
import { audio, type Track } from '../core/audio';
import { haptic, inApp, post, setHaptics } from '../core/bridge';
import { MAX_HEARTS } from '../core/constants';
import { Input } from '../core/input';
import { clearSave, loadSave, newSave, writeSave, type SaveData, type Settings } from '../core/save';
import { LEVELS, LEVEL_ORDER } from '../levels';
import type { DeckId, Line } from '../world/levelTypes';
import { THEMES } from '../world/themes';
import { UI, type ShopItem } from '../ui/ui';
import { PostFx } from './post';
import { enemyIconUrl } from '../entities/badges';
import { deckQuests, givePrize, payQuests, shardMilestone } from './quests';
import { INTEL, creditsHtml, endingText } from './story';
import { TitleScene } from './title';
import { World, type WorldHooks } from './world';

type State = 'boot' | 'title' | 'menu' | 'card' | 'play' | 'dialogue' | 'hack' | 'shop' | 'pause' | 'down' | 'results' | 'ending' | 'cutscene' | 'cinema';

/** How a deck opens when it is entered fresh (not resumed from a checkpoint). */
type Opening = 'auto' | 'wake' | 'fly';

/** Frees everything a scene uploaded to the GPU. */
function disposeScene(scene: THREE.Scene) {
  scene.traverse((o) => {
    const any = o as THREE.Mesh;
    any.geometry?.dispose();
    const mats = Array.isArray(any.material) ? any.material : any.material ? [any.material] : [];
    for (const m of mats) {
      for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose();
      m.dispose();
    }
    if (o instanceof THREE.InstancedMesh) o.dispose();
    if (o instanceof THREE.Light) o.dispose();
  });
}

const ABILITY_LINES: Record<string, Line[]> = {
  doubleJump: [
    { who: 'bolt', text: 'JET BOOTS! Now you can jump again while you are in the air. Double jump!' },
    { who: 'kai', text: 'Up, up and away!' },
  ],
  dash: [
    { who: 'bolt', text: 'DASH THRUSTERS! Press DASH to zoom forward, even in mid-air. Great for long gaps!' },
    { who: 'kai', text: 'Nyoom!' },
  ],
  glide: [
    { who: 'bolt', text: 'A HOVER PACK! Hold JUMP while you fall to float gently down. Wheee!' },
    { who: 'kai', text: 'I can glide across the whole Ring with this!' },
  ],
  shield: [
    { who: 'bolt', text: 'SHIELD MODULE installed! Press my button to make a force bubble. It blocks lasers and shots for a few seconds.' },
    { who: 'kai', text: 'Now those laser walls are no problem.' },
  ],
};

export class Game {
  readonly renderer: THREE.WebGLRenderer;
  private input: Input;
  private ui: UI;
  private save: SaveData;
  private world: World | null = null;
  private title = new TitleScene();
  private envMap: THREE.Texture;
  private post: PostFx;
  private state: State = 'boot';
  private last = performance.now();
  private deckTime = 0;
  private boltsAtStart = 0;
  private frames = 0;
  private fpsT = 0;
  private hudT = 0;
  private director: Director | null = null;
  private ship: ShipScene | null = null;
  private queue: { script: (d: Director) => Promise<void>; resolve: () => void }[] = [];

  constructor(
    private canvas: HTMLCanvasElement,
    touch: HTMLElement,
    uiRoot: HTMLElement,
  ) {
    this.save = loadSave() ?? newSave();
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: this.save.settings.quality !== 'low', powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.92;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // A soft studio environment gives metal and glossy toys their shine.
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.title.scene.environment = this.envMap;
    this.title.scene.environmentIntensity = 0.55;
    this.post = new PostFx(this.renderer);
    this.input = new Input(touch);
    this.ui = new UI(uiRoot, this.input);
    this.ui.onPause = () => this.pause();
    this.applySettings(this.save.settings);
    window.addEventListener('resize', () => this.resize());
    this.resize();
    window.__onBack = () => this.back();
    window.__onPause = () => {
      if (this.state === 'play') this.pause();
      audio.suspend(true);
    };
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.state === 'play') this.pause();
        this.persist();
        audio.suspend(true);
      } else {
        audio.suspend(false);
      }
    });
    window.__game = this;
    requestAnimationFrame((t) => this.frame(t));
    // Warm up while the splash plays: fonts, and every shader the title scene needs.
    const renderer = this.renderer;
    const title = this.title;
    const ready = (async () => {
      await new Promise((r) => setTimeout(r, 60));
      try {
        await document.fonts?.ready;
      } catch {
        // fonts are embedded; carry on without waiting
      }
      renderer.compile(title.scene, title.camera);
    })();
    this.ui.tapToStart(ready, () => {
      audio.unlock();
      this.toTitle();
    });
  }

  private applySettings(s: Settings) {
    audio.setVolumes(s.music, s.sfx);
    setHaptics(s.haptics);
    const ratio = Math.min(window.devicePixelRatio || 1, s.quality === 'high' ? 2 : s.quality === 'medium' ? 1.5 : 1);
    this.renderer.setPixelRatio(ratio);
    this.resize();
    this.post.configure(s.quality);
  }

  private resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.title.resize(w, h);
    this.world?.resize(w, h);
    this.ship?.resize(w, h);
    this.post?.resize();
  }

  private persist() {
    if (this.world && this.state !== 'ending') {
      this.save.resume = { deck: this.world.def.id, ...this.world.resumeState() };
    }
    writeSave(this.save);
  }

  /* ---------------- menus ---------------- */

  private toTitle() {
    this.disposeWorld();
    this.ui.fade('#000000', 0, 0.5);
    this.state = 'title';
    this.ui.showHud(false);
    audio.music('title');
    const r = this.save.resume;
    this.ui.title({
      canContinue: !!r,
      continueText: r ? LEVELS[r.deck].name : '',
      hasDecks: this.save.unlocked > 1 || this.save.completed.length > 0,
      onContinue: () => r && this.startDeck(r.deck, true),
      onNew: () => {
        if (this.save.resume || this.save.completed.length) {
          this.ui.confirm('Start a brand new adventure? Your current progress will be erased.', () => this.newGame(), () => this.toTitle());
        } else this.newGame();
      },
      onDecks: () => this.deckSelect(),
      onSettings: () => this.settings(() => this.toTitle(), true),
    });
  }

  private newGame() {
    const settings = this.save.settings;
    this.save = newSave();
    this.save.settings = settings;
    writeSave(this.save);
    this.state = 'menu';
    audio.music('title');
    void this.cinema((d, ship) => space.prologue(d, ship)).then(() => this.startDeck('cryo', false, 'wake'));
  }

  private deckSelect() {
    this.state = 'menu';
    this.ui.decks(
      LEVEL_ORDER.map((id) => {
        const d = LEVELS[id];
        return {
          index: d.index,
          id,
          name: d.name,
          color: THEMES[id].accent,
          shards: d.shardIds.filter((s) => this.save.shards.includes(`${id}.${s}`)).length,
          shardTotal: d.shardIds.length,
          unlocked: d.index <= this.save.unlocked,
          completed: this.save.completed.includes(id),
        };
      }),
      (id) => this.startDeck(id as DeckId, false),
      () => this.toTitle(),
    );
  }

  private settings(back: () => void, allowReset = false) {
    const prev = this.state;
    this.state = 'menu';
    this.ui.settings(
      this.save.settings,
      (s) => {
        this.save.settings = s;
        this.applySettings(s);
        writeSave(this.save);
      },
      () => {
        this.state = prev === 'menu' ? 'menu' : prev;
        back();
      },
      allowReset
        ? () =>
            this.ui.confirm(
              'Erase ALL progress, shards and upgrades?',
              () => {
                clearSave();
                this.save = newSave();
                this.toTitle();
              },
              () => this.settings(back, allowReset),
            )
        : undefined,
    );
  }

  private pause() {
    if (this.state !== 'play' || !this.world) return;
    this.state = 'pause';
    this.input.reset();
    this.ui.showControls(false);
    const w = this.world;
    const d = w.def;
    this.ui.pause({
      deck: d.name.toUpperCase(),
      shards: `${d.shardIds.filter((s) => this.save.shards.includes(`${d.id}.${s}`)).length} / ${d.shardIds.length} here · ${this.save.shards.length} / 18 total`,
      colonists: `${this.save.colonists.length} / 12`,
      quests: deckQuests(d.id, this.save),
      onResume: () => this.resume(),
      onHelp: () => this.ui.help(() => this.pauseAgain()),
      onSettings: () => this.settings(() => this.pauseAgain()),
      onRestart: () => {
        this.resume();
        w.respawn();
      },
      onQuit: () => {
        this.persist();
        this.toTitle();
      },
    });
  }

  private pauseAgain() {
    this.state = 'play';
    this.pause();
  }

  private resume() {
    this.ui.close();
    this.ui.showControls(true);
    this.input.flush();
    this.state = 'play';
  }

  private back() {
    switch (this.state) {
      case 'play':
        this.pause();
        break;
      case 'pause':
        this.resume();
        break;
      case 'title':
        post({ type: 'exit' });
        break;
      case 'cutscene':
      case 'cinema':
        this.director?.skip();
        break;
      default:
        break;
    }
  }

  /* ---------------- decks ---------------- */

  private disposeWorld() {
    if (!this.world) return;
    // Free every buffer, texture, material and shadow map the deck uploaded; phones have little GPU memory.
    // Shared helpers (cached geometry, glow textures) are simply uploaded again when the next deck uses them.
    disposeScene(this.world.scene);
    this.world = null;
    this.queue = [];
    this.renderer.renderLists.dispose();
  }

  /* ---------------- cutscenes ---------------- */

  /** Queues an in-deck cutscene. It starts as soon as nothing else (dialogue, menus) is on screen. */
  private cutscene(script: (d: Director) => Promise<void>): Promise<void> {
    return new Promise((resolve) => this.queue.push({ script, resolve }));
  }

  private runCutscene() {
    const w = this.world;
    const job = this.queue.shift();
    if (!w || !job) return;
    const rig: Rig = { pos: w.camera.position.clone(), look: w.cameraLook.clone(), fov: w.camera.fov };
    const d = new Director(this.ui, rig);
    this.director = d;
    this.state = 'cutscene';
    this.input.reset();
    this.ui.showControls(false);
    this.ui.showHud(false);
    this.ui.setAction(null);
    this.ui.cinema(true, () => d.skip(), () => d.tap());
    w.cutscene = true;
    w.setCameraRig(rig);
    job
      .script(d)
      .catch((err: unknown) => console.error(err))
      .finally(() => {
        if (this.world === w) {
          w.cutscene = false;
          w.setCameraRig(null, d.skipping ? 0.35 : 0.9);
        }
        if (this.director === d) this.director = null;
        this.ui.cinema(false);
        if (this.state === 'cutscene') {
          this.state = 'play';
          this.ui.showHud(true);
          this.ui.showControls(true);
          this.input.flush();
          this.refreshHud();
        }
        job.resolve();
      });
  }

  /** Plays a cinematic out in space (prologue, the rides between decks, endings). */
  private async cinema(script: (d: Director, ship: ShipScene) => Promise<void>) {
    this.disposeWorld();
    this.ui.close();
    const ship = new ShipScene();
    ship.scene.environment = this.envMap;
    // Deep space has nothing bright to reflect: keep the studio reflections faint.
    ship.scene.environmentIntensity = 0.18;
    ship.resize(window.innerWidth, window.innerHeight);
    const rig: Rig = { pos: ship.camera.position.clone(), look: new THREE.Vector3(), fov: 45 };
    const d = new Director(this.ui, rig);
    this.ship = ship;
    this.director = d;
    this.state = 'cinema';
    this.input.reset();
    this.ui.showHud(false);
    this.ui.showControls(false);
    this.ui.cinema(true, () => d.skip(), () => d.tap());
    this.renderer.compile(ship.scene, ship.camera);
    try {
      await script(d, ship);
    } catch (err) {
      console.error(err);
    }
    this.ui.cinema(false);
    if (this.director === d) this.director = null;
    this.ship = null;
    disposeScene(ship.scene);
  }

  private startDeck(id: DeckId, resume: boolean, opening: Opening = 'auto') {
    this.disposeWorld();
    const def = LEVELS[id];
    this.state = 'card';
    this.ui.showHud(false);
    audio.music(def.music as Track);
    const r = resume && this.save.resume?.deck === id ? this.save.resume : null;
    const build = () => {
      const w = new World(def, this.save, this.hooks(), this.save.settings.quality, r ? { checkpoint: r.checkpoint, flags: r.flags ?? [], taken: r.taken ?? [], dead: r.dead ?? [] } : null);
      w.scene.environment = this.envMap;
      w.resize(window.innerWidth, window.innerHeight);
      // Compile every shader now so the first frames of play don't stutter.
      this.renderer.compile(w.scene, w.camera);
      return w;
    };
    // Build the deck behind its title card (after the card has painted) so the loading pause is hidden.
    let ready: World | null = null;
    const early = setTimeout(() => {
      ready = build();
    }, 80);
    this.ui.card(def.index, def.name, def.subtitle, THEMES[id].accent, () => {
      clearTimeout(early);
      this.world = ready ?? build();
      this.deckTime = 0;
      this.boltsAtStart = this.save.bolts;
      this.save.resume = { deck: id, ...this.world.resumeState() };
      writeSave(this.save);
      this.state = 'play';
      this.ui.showHud(true);
      this.ui.showControls(true);
      this.ui.setShards(def.shardIds.map((s) => this.save.shards.includes(`${id}.${s}`)));
      this.refreshHud();
      this.input.flush();
      const w = this.world;
      const how = r ? null : opening === 'auto' ? (id === 'cryo' ? 'wake' : 'fly') : opening;
      if (how !== 'wake') this.ui.fade('#000000', 0, 0.7);
      if (how === 'wake') void this.cutscene((d) => wakeUp(d, w));
      else if (how === 'fly') void this.cutscene((d) => flyover(d, w));
    });
  }

  private refreshHud() {
    const w = this.world;
    if (!w) return;
    this.ui.setHearts(w.player.hearts, this.save.maxHearts);
    this.ui.setBolts(this.save.bolts);
    this.ui.setDash(this.save.abilities.includes('dash'));
  }

  private hooks(): WorldHooks {
    return {
      say: (lines, then) => {
        if (!lines.length) {
          then?.();
          return;
        }
        const prev = this.state;
        this.state = 'dialogue';
        this.input.reset();
        this.ui.showControls(false);
        this.ui.dialogue(lines, () => {
          this.state = prev === 'dialogue' ? 'play' : prev === 'play' ? 'play' : prev;
          if (this.state === 'play') this.ui.showControls(true);
          this.input.flush();
          then?.();
        });
      },
      toast: (text, who) => this.ui.toast(text, who ?? 'bolt'),
      hack: (length, done) => {
        this.state = 'hack';
        this.input.reset();
        this.ui.showControls(false);
        this.ui.hack(length, (ok) => {
          this.state = 'play';
          this.ui.showControls(true);
          this.input.flush();
          done(ok);
        });
      },
      shop: () => {
        this.state = 'shop';
        this.input.reset();
        this.ui.showControls(false);
        this.ui.shop(
          this.save,
          (item) => this.buy(item),
          () => {
            this.ui.close();
            this.state = 'play';
            this.ui.showControls(true);
            this.input.flush();
            this.refreshHud();
            writeSave(this.save);
          },
        );
      },
      complete: () => this.completeDeck(),
      checkpoint: () => this.persist(),
      collect: (kind, id) => {
        const w = this.world;
        if (!w) return;
        if (kind === 'shard') {
          const d = w.def;
          this.ui.setShards(d.shardIds.map((s) => this.save.shards.includes(`${d.id}.${s}`)));
          const key = id.split('.')[1];
          const lines = d.dialogues[`shard:${key}`];
          const milestone = shardMilestone(this.save);
          if (milestone) this.ui.reward(milestone);
          if (this.save.shards.length % 6 === 0) w.player.heal(99);
          this.persist();
          haptic('success');
          if (lines) this.hooks().say(lines);
        } else if (kind === 'ability') {
          this.persist();
          this.refreshHud();
          this.hooks().say(ABILITY_LINES[id] ?? []);
        } else {
          this.persist();
        }
        for (const msg of payQuests(w.def.id, this.save)) this.ui.reward(msg);
        this.refreshHud();
      },
      hud: () => this.refreshHud(),
      bossBar: (name, frac) => this.ui.setBoss(name, frac),
      down: () => {
        this.state = 'down';
        this.input.reset();
        this.ui.showControls(false);
        haptic('warning');
        audio.play('fail');
        this.ui.down(() => {
          this.world?.respawn();
          this.state = 'play';
          this.ui.showControls(true);
          this.input.flush();
          this.refreshHud();
        });
      },
      music: (t) => audio.music(t),
      objective: (t) => this.ui.setObjective(t),
      ending: (kind) => this.ending(kind),
      cutscene: (script) => this.cutscene(script),
      prize: (reward) => {
        const w = this.world;
        const msg = givePrize(reward, this.save);
        this.ui.reward(msg);
        if (w) {
          w.player.heal(99);
          for (const m of payQuests(w.def.id, this.save)) this.ui.reward(m);
        }
        this.persist();
        this.refreshHud();
      },
      reward: (text) => this.ui.reward(text),
      threat: (kind) => {
        const info = INTEL[kind];
        const icon = enemyIconUrl(kind === 'elite' ? 'brute' : kind, kind === 'elite');
        this.ui.threat(icon, info.name, info.plan, kind === 'elite' ? '#ffd166' : '#ff8a9a');
        audio.play('alarm', 1);
      },
    };
  }

  private buy(item: ShopItem) {
    const lvl = this.save.upgrades[item.id] ?? 0;
    const price = item.prices[lvl];
    if (price === undefined || this.save.bolts < price) return;
    if (item.id === 'heart' && this.save.maxHearts >= MAX_HEARTS) return;
    this.save.bolts -= price;
    this.save.upgrades[item.id] = lvl + 1;
    if (item.id === 'heart') {
      this.save.maxHearts = Math.min(MAX_HEARTS, this.save.maxHearts + 1);
      this.world?.player.heal(99);
    }
    audio.play('upgrade');
    haptic('success');
    writeSave(this.save);
  }

  private completeDeck() {
    const w = this.world;
    if (!w) return;
    const d = w.def;
    this.state = 'results';
    this.input.reset();
    this.ui.showControls(false);
    this.ui.showHud(false);
    audio.play('success');
    if (!this.save.completed.includes(d.id)) this.save.completed.push(d.id);
    const nextId = LEVEL_ORDER[d.index] as DeckId | undefined;
    this.save.unlocked = Math.max(this.save.unlocked, Math.min(6, d.index + 1));
    const best = this.save.bestTimes[d.id];
    if (!best || this.deckTime < best) this.save.bestTimes[d.id] = Math.round(this.deckTime);
    this.save.resume = nextId ? { deck: nextId, checkpoint: null, flags: [], taken: [], dead: [] } : null;
    writeSave(this.save);
    const m = Math.floor(this.deckTime / 60);
    const s = Math.floor(this.deckTime % 60);
    const colonistsHere = d.colonistIds?.length ?? 0;
    this.ui.results(
      {
        deck: d.name,
        time: `${m}:${String(s).padStart(2, '0')}`,
        bolts: this.save.bolts - this.boltsAtStart,
        shards: `${d.shardIds.filter((x) => this.save.shards.includes(`${d.id}.${x}`)).length} / ${d.shardIds.length}`,
        colonists: colonistsHere ? `${d.colonistIds?.filter((c) => this.save.colonists.includes(`${d.id}.${c}`)).length} / ${colonistsHere}` : '',
        next: nextId ? LEVELS[nextId].name : null,
      },
      () => {
        this.ui.close();
        if (nextId) void this.cinema((dir, ship) => space.interlude(dir, ship, d.id, d.index)).then(() => this.startDeck(nextId, false, 'fly'));
        else this.toTitle();
      },
    );
  }

  private ending(kind: 'saved' | 'friends') {
    this.state = 'ending';
    this.input.reset();
    this.ui.showHud(false);
    if (!this.save.endings.includes(kind)) this.save.endings.push(kind);
    if (!this.save.completed.includes('bridge')) this.save.completed.push('bridge');
    this.save.resume = null;
    writeSave(this.save);
    audio.music('ending');
    const hours = Math.floor(this.save.playSeconds / 3600);
    const mins = Math.floor((this.save.playSeconds % 3600) / 60);
    void this.cinema((d, ship) => space.ending(d, ship, kind)).then(() => {
      this.state = 'ending';
      this.ui.credits(creditsHtml(kind, this.save), () => {
        this.ui.fade('#000000', 0, 0.6);
        this.ui.ending(
          kind,
          endingText(kind, this.save),
          [
            ['Memory shards', `${this.save.shards.length} / 18`],
            ['Colonists rescued', `${this.save.colonists.length} / 12`],
            ['Bolts in pocket', String(this.save.bolts)],
            ['Play time', `${hours}h ${mins}m`],
          ],
          () => this.toTitle(),
        );
      });
    });
  }

  /* ---------------- loop ---------------- */

  private frame(t: number) {
    requestAnimationFrame((n) => this.frame(n));
    const dt = Math.min(0.05, Math.max(0, (t - this.last) / 1000));
    this.last = t;
    this.frames += 1;
    this.fpsT += dt;
    if (this.fpsT >= 1) {
      if (!inApp() && location.hash.includes('fps')) this.ui.setFps(`${this.frames} fps`);
      this.frames = 0;
      this.fpsT = 0;
    }
    this.input.poll();
    if (this.state === 'cinema' && this.ship && this.director) {
      this.director.update(dt);
      this.ship.update(dt, this.director.rig);
      this.post.setStrength(0.4);
      this.post.render(this.ship.scene, this.ship.camera);
      return;
    }
    const w = this.world;
    if (w && this.state === 'play' && this.queue.length) this.runCutscene();
    if (w && this.state === 'cutscene' && this.director) {
      const d = this.director;
      d.update(dt);
      w.update(dt * d.timeScale, this.input, 0);
    }
    if (w && (this.state === 'play' || this.state === 'cutscene' || this.state === 'dialogue' || this.state === 'hack' || this.state === 'shop' || this.state === 'pause' || this.state === 'down' || this.state === 'results')) {
      if (this.state === 'play') {
        this.deckTime += dt;
        this.save.playSeconds += dt;
        if (this.input.take('pause')) {
          this.pause();
        } else {
          w.update(dt, this.input, this.save.settings.camSpeed);
          const pl = w.player;
          this.ui.setAmmo(pl.ammo, pl.clipSize, pl.reloadProgress, pl.charge);
          this.hudT -= dt;
          if (this.hudT <= 0) {
            this.hudT = 0.1;
            const f = w.focus;
            if (f) this.ui.setAction(f.label(), 'action');
            else if (w.shieldReady) this.ui.setAction('SHIELD', 'shield');
            else this.ui.setAction(null);
          }
        }
      }
      this.post.setStrength(w.theme.bloom);
      this.post.render(w.scene, w.camera);
      return;
    }
    this.title.update(dt);
    this.post.setStrength(0.2);
    this.post.render(this.title.scene, this.title.camera);
  }
}
