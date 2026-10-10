import { audio } from '../../core/audio';
import { haptic } from '../../core/bridge';
import { ORGAN, OrganFight, type OrganEvents } from './organ';
import { makeOrgan, type OrganModel } from './organModel';
import type { SubDive } from './sub';
import { WaveView } from './subFx';
import { organIntro, organOutro } from './subScenes';

/**
 * The fight with THE SIREN ORGAN, glued to the sub: the rules (organ.ts) and the model, the sound waves
 * swimming at the Dolphin, the boss bar, the siren buoy it raises at four pipes, the piranhas it calls
 * at two, LUX's final song duel, and the entrance and defeat cutscenes.
 */
export class OrganBattle {
  readonly fight = new OrganFight();
  model: OrganModel;
  private waves: WaveView;
  state: 'idle' | 'fight' | 'won' = 'idle';
  introSeen = false;
  /** Where the arena is (the sub stops here) and the pipes stand ORGAN.dist further on. */
  readonly arenaS: number;
  private schoolT = 0;
  private told = new Set<string>();

  constructor(private sub: SubDive) {
    this.arenaS = sub.dive.things.find((t) => t.kind === 'arena')?.s ?? Infinity;
    this.model = makeOrgan();
    sub.world.scene.add(this.model.root);
    this.waves = new WaveView(sub.world.scene, ORGAN.band / ORGAN.ringR);
  }

  /** LUX calls out what the Organ is doing (each only once a fight). */
  private toast(text: string, once: string) {
    if (this.told.has(once)) return;
    this.told.add(once);
    this.sub.world.hooks.toast(text, 'bolt');
  }

  /** The Dolphin reached the arena: the Organ's entrance the first time, straight into the fight after that. */
  begin() {
    const w = this.sub.world;
    w.hooks.music('organ');
    if (this.introSeen) {
      this.engage();
      return;
    }
    void w.hooks.cutscene((d) => organIntro(d, this.sub, this)).then(() => this.engage());
  }

  private engage() {
    this.introSeen = true;
    this.state = 'fight';
    this.sub.world.hooks.bossBar(this.fight.title, this.fight.frac);
  }

  /** LUX sings in the final song duel. */
  sing() {
    this.fight.sing(this.events);
  }

  get dueling(): boolean {
    return this.state === 'fight' && !!this.fight.finale;
  }

  update(dt: number) {
    if (this.state !== 'fight') return;
    const d = this.sub.dive;
    this.fight.update(dt, d.x, d.y, this.events);
    this.fight.checkRound(this.events);
    // With two pipes left, a school of piranhas swims in every so often.
    if (this.fight.phase === 3 && !this.fight.finale) {
      this.schoolT -= dt;
      if (this.schoolT <= 0) {
        this.schoolT = 11;
        d.spawnSchool(4, 34, d.x, d.y, this.sub.events);
      }
    }
  }

  /** Draws the Organ at distance `s` (the sub's), and its waves. */
  draw(s: number, t: number) {
    const rel = this.arenaS + ORGAN.dist - s;
    this.model.root.visible = rel < 200 && this.state !== 'won';
    this.model.root.position.set(0, 0, -rel);
    const tempo = 1 + (ORGAN.pipes.length - this.fight.standing) * 0.12;
    this.model.update(t, this.fight.lit, !!this.fight.finale, tempo);
    this.waves.update(this.state === 'fight' ? this.fight.waves : [], t);
  }

  readonly events: OrganEvents = {
    wave: (w) => {
      const p = this.fight.pipes[w.from];
      audio.play(`tone${w.from % 4}` as 'tone0', 0.8 + this.fight.phase * 0.1, 0.7);
      this.sub.rings.burst(p.x, p.y, -ORGAN.dist + 0.8, 0.5, 2.4, '#ff6fb0', 0.5);
    },
    pass: (w, hit) => {
      if (!hit) {
        this.sub.rings.burst(w.cx, w.cy, -0.5, ORGAN.ringR, ORGAN.ringR + 1.5, '#bff8ff', 0.35);
        return;
      }
      if (this.sub.dive.hurt(this.sub.events)) {
        this.toast('Swim through the HOLE in the middle of the rings! Or stay right outside them.', 'wave');
      }
    },
    lit: () => audio.play('blip', 1.4, 0.6),
    pipeHit: (i, broke) => {
      const w = this.sub.world;
      const p = this.fight.pipes[i];
      const z = -ORGAN.dist;
      w.particles.emit(p.x, p.y, z + 1, { count: broke ? 40 : 12, color: broke ? '#ff6fb0' : '#ffd166', speed: broke ? 8 : 4, life: 0.8, size: 0.8, gravity: 0 });
      audio.play(broke ? 'explode' : 'hit', broke ? 0.9 : 1.1);
      w.hooks.bossBar(this.fight.title, this.fight.frac);
      if (!broke) return;
      this.model.breakPipe(i);
      w.shake(0.5);
      haptic('heavy');
      w.save.bolts += 10;
      w.hooks.hud();
    },
    phase: (n) => {
      const d = this.sub.dive;
      if (n === 2) {
        // It raises a siren buoy beside the sub: sing back, or torpedo it.
        const side = d.x > 0 ? -1 : 1;
        const st = d.addBuoy({ kind: 'buoy', s: this.arenaS + 16, x: side * 7, y: -1.5, id: 'organ-b' });
        this.sub.view.addBuoy(st);
        this.toast('It raised a siren buoy! SING on the beat, or torpedo it!', 'raise');
      } else if (n === 3) {
        this.schoolT = 1.5;
        this.toast('Piranhas! PING them, then torpedo!', 'fish');
      } else if (n === 4) {
        this.toast('Every pipe is broken! Now its big horn sings... and I sing back!', 'duel');
      }
    },
    finaleRound: () => this.sub.world.hooks.toast('My turn! Tap SING every time a note reaches the ring!', 'bolt'),
    finaleNote: (good, notes) => {
      const p = this.sub.dive;
      if (good) {
        audio.play(`tone${notes % 4}` as 'tone0', 1.2 + notes * 0.05);
        this.sub.rings.burst(p.x, p.y + 0.6, -2, 0.4, 2.2, '#7fe6ff', 0.9);
        this.sub.world.hooks.bossBar(this.fight.title, this.fight.frac);
      } else audio.play('empty', 1, 0.5);
    },
    beaten: () => {
      const w = this.sub.world;
      this.state = 'won';
      w.hooks.bossBar(null, 0);
      w.flags.add('boss');
      w.save.bolts += 40;
      w.hooks.hud();
      w.hooks.checkpoint();
      // Its own buoys go quiet with it.
      for (const b of this.sub.dive.buoys) if (!b.quiet) b.quiet = 'song';
      this.waves.clear();
      void w.hooks.cutscene((d) => organOutro(d, this.sub, this)).then(() => {
        w.hooks.music(w.def.music);
        this.sub.dive.release();
      });
    },
  };

  /** Back to the start of the fight (the Dolphin was knocked out): every pipe stands again. */
  reset() {
    if (this.state === 'won') return;
    this.fight.reset();
    this.state = 'idle';
    this.waves.clear();
    this.sub.world.hooks.bossBar(null, 0);
    this.sub.world.scene.remove(this.model.root);
    this.model = makeOrgan();
    this.sub.world.scene.add(this.model.root);
    const d = this.sub.dive;
    for (let i = d.buoys.length - 1; i >= 0; i--) {
      if (!d.buoys[i].b.id.startsWith('organ')) continue;
      this.sub.view.removeBuoy(d.buoys[i]);
      d.buoys.splice(i, 1);
    }
  }
}
