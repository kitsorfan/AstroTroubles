# Hull Breach: Leviathan

A sci-fi action-adventure for Android, built with Expo and React Native.

The colony ship *Leviathan* is carrying 10,000 sleeping colonists when an alien organism called **the Bloom** overruns it. You play **Kai Reyes**, a junior engineer who wakes up early with 72 hours of reactor life left to climb six decks, reach the Bridge, and keep the ship from drifting into a star. You aren't alone: **BOLT**, a sarcastic maintenance drone that's afraid of the dark, lights your way, hacks doors, and fights beside you. It also carries corrupted memories of the day the Bloom came aboard.

## Running it on Android

You need Node 20+ and the **Expo Go** app (SDK 57) on your phone.

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go. Every native module the game uses (Skia, Reanimated, expo-audio, expo-haptics, AsyncStorage) ships inside Expo Go, so you don't need a custom build.

With an Android emulator running, press `a` in the Expo terminal, or run `npm run android`.

### Building an installable APK

```bash
npx eas-cli@latest build -p android --profile preview
```

The `preview` profile in `eas.json` builds a sideloadable `.apk`, and `production` builds a Play Store `.aab`. The Android package name is `com.hullbreach.leviathan` (set in `app.json`).

### Web preview (optional)

The web preview is handy for quick checks. Skia needs its CanvasKit runtime copied in once:

```bash
npm run web:setup
npm run web
```

## How to play

| Action | How |
| --- | --- |
| **Move** | D-pad (hold to keep walking), or tap any tile to walk there |
| **Interact** | Walk into doors, people, terminals, lifts and med stations |
| **Scan** | BOLT reveals hidden items nearby (costs 5 minutes) |
| **Menu** | Gear, BOLT's modules and memory files, logs, deck map, save/load, settings. The Android back button opens it too |

**The clock is the real enemy.** Every step costs a minute. Fights, hacking doors, repairs, resting, and rescuing survivors cost more. The main path takes about 30 of the 72 hours, so there's time to explore, but not enough to do everything.

**Battles** are turn-based: Kai acts, then BOLT, then the enemies.

- Kai can **Attack** with the wrench, plasma cutter or pulse rifle (swapping weapons is free), use a **Repair Kit** or another item, **Brace** to halve incoming damage, or **Flee** (not possible against bosses).
- BOLT spends energy on **Zap**, **Scan**, **Shield**, **Hack**, **Flash**, **Decoy** and **Repair**, or uses **Recharge** to regain it. New abilities come from parts found around the ship.
- **Scan** reveals weaknesses and resistances. Hitting a weakness deals +50% damage.
- When an enemy shows **CHARGING**, a big attack is coming next turn. Shield, brace, or cancel it (a stun or a coolant canister works).

**Hazards:** Hydroponics, the Habitation Ring and the Security Deck leak bad air that drains health until you seal the breach. Engineering's heat vents burn until you restore the coolant loop.

**Choices:** five survivors can be saved at the cost of time (and Anti-Spore Serum for the infected ones). Saving them earns rewards and changes the epilogue.

**Endings:**

1. **The Long Drift**: escape in a pod from the Bridge.
2. **Dawn over Thalassa**: destroy the Bloom Heart and correct course.
3. **Secret ending**: restore all six of BOLT's memory files, then choose to *listen* instead of fight.

### The six decks

| Deck | What's there | Boss |
| --- | --- | --- |
| 1. Cryo Deck | Tutorial. Find BOLT in a dark closet | Cryo-Warden |
| 2. Hydroponics | Overgrown jungle, spore-choked air, the plasma cutter and hacking | Vine Behemoth |
| 3. Engineering Core | Reactor pit, heat vents, dark tunnels, BOLT's floodlight | Slag Titan |
| 4. Habitation Ring | Empty city, vending machines, two survivors, the holo-theater | Hive Matron |
| 5. Security Deck | Rogue robots, the brig, the armory and pulse rifle | WARDOG Mech |
| 6. The Bridge | Escape pods, the Captain's secrets | Bloom Heart |

## Project layout

```text
src/app/              Expo Router entry (a single screen that hosts the game)
src/game/
  types.ts            Shared game types
  constants.ts        Clock costs, stat formulas, XP table
  data/               Content: decks (ASCII maps + legends), dialogue JSON, enemies, items, story
  engine/             Pure game logic: battle reducer, rules/effects, dialogue runtime,
                      exploration, map parser, pathfinding
  store/              Zustand game store (event queue, saves, settings)
  audio/              Sound effects and music via expo-audio, plus haptics
src/ui/
  render/             Skia drawing: tiles, sprites, map layers
  components/         Map canvas, HUD, D-pad, dialogue box, pause menu, battle stage...
  screens/            Title, intro, exploration, battle, game over, endings
assets/audio/         Generated WAV sound effects and music loops
scripts/              Asset generators and level-design tools
__tests__/            Jest tests
```

### How it fits together

- **Engine and UI are separate.** Everything in `src/game/engine` is pure TypeScript with no React, so it's fully unit-tested. Exploration functions take `GameData` and return new data plus a list of events (sounds, toasts, dialogues, battles). The store runs modal events (dialogues, battles, lift rides, log readers) through a queue so they never overlap.
- **Battles** use a seeded, pure reducer (`engine/battle.ts`). The battle screen feeds its events into floating damage numbers, Skia effects and screen shake.
- **Maps** are ASCII art in `src/game/data/decks/*.ts`. Symbols are tiles (`#` wall, `.` floor, `~` heat vent, and so on). Letters and digits are markers resolved through each deck's `legend`. `D`/`M`/`S`/`B` are doors (plain, maintenance, security, Bloom-choked), `H` is a med station, `O` a hull breach, `X` seeds a dark room, and `@` is the spawn point.
- **Dialogue** trees are JSON (`src/game/data/dialogue/*.json`). Nodes can branch on conditions (flags, items, modules, memories, time) and apply effects (items, XP, time costs, battles, travel, endings).
- **Rendering**: each deck's static tiles are recorded once into a Skia picture. Entities, darkness (BOLT's light radius) and the animated Kai/BOLT/camera sit in layers on top, driven by Reanimated shared values.
- **Saving**: three manual slots plus an autosave in AsyncStorage. The game autosaves on reaching a new deck, after boss fights, and when the app goes to the background.

## Development

```bash
npm test            # Jest: content validation, full-game progression solver, battle and balance sims, store flow
npm run typecheck   # TypeScript
npm run lint        # ESLint (expo config)
npm run gen:audio   # regenerate assets/audio/*.wav (synthesized, no external assets)
npm run gen:icons   # regenerate the app icon, adaptive icon layers, splash and favicon
```

The tests include a **progression solver** that plays through every deck with only the abilities you'd have at that point. It fails if any deck can't be completed, or if any item, survivor, log or memory file is unreachable. The **balance simulation** plays each boss fight 200 times with a typical loadout.

Level-design helpers (not part of `npm test`):

```bash
DECK=hydro npx jest --rootDir . --testMatch "<rootDir>/scripts/print-map.test.ts"    # print a map with coordinates and dark regions
npx jest --rootDir . --testMatch "<rootDir>/scripts/time-budget.test.ts"             # estimate reactor time per deck
```

All art is drawn in code with Skia, all audio is synthesized by `scripts/gen-audio.mjs`, and the fonts are Orbitron and Share Tech Mono (SIL Open Font License, via `@expo-google-fonts`).
