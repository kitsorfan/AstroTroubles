# AstroTroubles!

![AstroTroubles! title screen: Jason waving in front of the colony ship Syracusia, overgrown with pink GaScu vines](docs/store/en/feature-graphic.jpg)

*In Greek: Αστρομπελάδες*

A 3D action-adventure platformer for Android, built with three.js inside an Expo / React Native app. Open source under the MIT license, and coming to Google Play.

The colony ship *Syracusia* is carrying ten thousand sleeping colonists when a glowing space vine, the Galactic Cuscuta Echinochloa (**GaScu** for short), grows over every deck and starts steering the ship toward a star. You play **Jason**, a junior engineer who wakes up early. Together with **LUX**, a nervous little repair drone who's scared of the dark, Jason climbs six decks to reach the Bridge. Along the way you rescue colonists, collect memory shards, and find out what GaScu really wants.

It's made for players around 10 and up: bright, forgiving, and about 2–3 hours long if you hunt for the secrets.

| | |
| --- | --- |
| ![Jason and LUX fighting the Magma Golem inside a ring of fire](docs/store/en/01-boss-fight.jpg) | ![The Magma Golem's entrance, with its name card](docs/store/en/02-magma-golem.jpg) |
| ![Exploring the overgrown Hydroponics deck](docs/store/en/03-hydroponics.jpg) | ![CERBERUS, the chief security robot, behind its shield](docs/store/en/05-wardog.jpg) |
| ![A Horned Brute and a Spore Crawler next to the lava in the Engine Core](docs/store/en/06-engine-core.jpg) | ![The prologue: the GaScu seed takes root on the ship's hull](docs/store/en/07-prologue.jpg) |

## Highlights

- **The whole game is one offline HTML page.** The game is TypeScript and three.js, and esbuild bundles it, fonts included, into a single 1.5 MB page. The Expo app shows that page full screen in a WebView and handles what the page can't: saving, haptics, the Android back button and screen orientation.
- **No asset files.** Characters, bosses and levels are built from code, textures are drawn on canvases at runtime, and all music and sound effects are synthesized with the Web Audio API.
- **Levels are ASCII maps, checked by a solver.** A reachability checker simulates Jason's jumps, dashes and hovering on every deck. It reports anything Jason can't reach, checks that each deck really needs its new ability, and times the fastest route through every countdown puzzle to prove it can be beaten with time to spare. The Jest suite runs the same checks.
- **In-engine cutscenes.** A small cutscene director moves the camera through the real level and adds letterbox bars, boss name cards and slow-motion finishes.
- **Built for phones.** Each deck frees its GPU memory when you leave it. Shaders compile behind the title cards so play doesn't stutter. The quality preset on first launch is picked from the phone's CPU core count.
- **Two languages.** English and Greek, with a test that fails if any visible string is missing its Greek translation.

## Running it on your phone

You need Node 20+ and the **Expo Go** app (SDK 57) on an Android phone.

```bash
npm install
npm start          # builds the game page, then starts Expo
```

Scan the QR code with Expo Go. The game runs in a WebView (`react-native-webview`, included in Expo Go), so you don't need a custom build. Hold the phone in landscape.

To build an installable APK:

```bash
npx eas-cli@latest build -p android --profile preview
```

EAS runs `npm run game:build` automatically after installing dependencies (`eas-build-post-install`).

### Playing on a computer

```bash
npm run game:build     # writes game/dist/index.html
```

Open `game/dist/index.html` in a browser. Keyboard: **WASD / arrows** move, **Space** jumps, **J** blasts, **K** spins or ground-pounds, **L / Shift** dashes, **I** fires LUX's force pulse, **E** is the action button, **Q / R** turn the camera, **Esc** pauses. `npm run game:dev` rebuilds on every save.

## How to play

| Control | What it does |
| --- | --- |
| Left side of the screen | Joystick: move |
| Drag on the right side | Turn the camera |
| **JUMP** | Jump. Hold for higher jumps; with the Jet Boots, press again in mid-air |
| **BLAST** | Tap to shoot (it aims at the nearest enemy). The clip holds 6 shots, then Jason reloads. **Hold** to charge a big fireball that bursts on impact |
| **SPIN** | Spin attack that also blocks enemy attacks and bats their shots back (lasers and lava still hurt). Jason gets 3 spins in a row, then a long recharge. In mid-air it becomes a **ground pound**, which presses red switches, hurts more and never runs out |
| **DASH** | Zoom forward, even in mid-air (after the Engine Core), ramming through enemies for heavy damage. Each dash uses one of 3 energy cells, refilled at checkpoints and by violet energy cells (enemies drop them, and chargers sit before every jump that needs a dash) |
| **PULSE** | LUX's force pulse (after the Security Deck's armory): a shockwave that hits and stuns every enemy around Jason, wipes out their shots and shorts out lasers and zap floors for a few seconds. It takes 16 seconds to recharge |
| LUX button | Appears near terminals, pylons, signs, the shop and lifts |

A gold marker on screen points to where the current objective wants you to go, for example the launch tower and King Bloblin's island on the Habitat Ring, or the lift once a deck's boss is beaten.

Jason finds a new ability on each deck, and it's needed to finish that deck:

| Deck | New trick | Boss |
| --- | --- | --- |
| 1. Cryo Deck | Find LUX in the dark storeroom; hacking | Frost Warden |
| 2. Hydroponics | Jet Boots (double jump) | Vine Queen |
| 3. Engine Core | Dash Thrusters | Magma Golem |
| 4. Habitat Ring | Hover Pack (hold JUMP to float) | King Bloblin |
| 5. Security Deck | LUX's Force Pulse (shorts out lasers) | CERBERUS |
| 6. The Bridge | Everything at once | The Heart of GaScu, then GaScu Reborn |

- **Hacking** is a light-pattern memory game: watch LUX's lights, then repeat them.
- **LUX** lights dark rooms and hacks terminals, but in a fight he only stuns enemies now and then. Upgrade his zapper at PANDORA's shop to make it hurt.
- **Bolts** are money. Spend them at PANDORA's shop on extra hearts, blaster power, a bigger clip, quicker reloads, a stronger LUX zap and a bolt magnet.
- **Checkpoints** heal you. Falling or touching sludge, lava or electric water costs one heart and puts you back on the last safe ground. If you run out of hearts, you restart at the last checkpoint, and every enemy on the deck comes back. They also come back whenever you return to a deck, but rooms you've cleared stay open.
- **The final battle.** Beating the Heart of GaScu isn't the end: it pulls every vine on the ship into itself and rises again as GaScu Reborn, a floating titan that is only hurt while its great eye is open.

### Enemies

Each enemy type has a floating icon and a health bar, and the first time you meet one, a small card under your hearts names it and gives a tip:

| Enemy | Its plan |
| --- | --- |
| Spore Crawler | Hunts in packs. When one spots you it calls the others, and they surround you |
| Maw Plant | Hides among the roots and bites when you walk too close |
| Stinger Wasp | Circles you, shoots where you're going, and dives in while you reload |
| Warden Bot | Patrols, and sounds an alarm that wakes the guards nearby. Its front shield blocks shots, but it turns slowly and freezes to vent after each burst: hit the glowing pack on its back for triple damage |
| Spitter Pod | Lobs acid at where you'll be when it lands |
| Horned Brute | Charges; if it misses, it stomps in anger |

Enemies get tougher deck by deck: more health, faster attacks, sharper senses. They also scale up a little with every weapon upgrade you buy. From the Engine Core on, some are **elites** with a gold crown: bigger, tougher and worth more bolts.

### Side quests and rewards

Every deck has four side quests, listed with their rewards in the pause menu. LUX also explains each kind of collectible the first time you get close to one.

- **Free the colonists** trapped in pink GaScu cocoons (blast them open): 25 bolts each, plus a bonus when the whole deck is free.
- **Find the memory shards** (glowing pink crystals): a bolt bonus per deck and an extra heart for every 6. All 18 unlock the secret ending, where LUX *speaks* to GaScu instead of fighting it.
- **Find the hidden heart canister** for one more max heart. They're often behind cracked walls (spin or blast them).
- **Crack the secret vault.** Each deck has one, locked behind a harder puzzle, and the chest inside holds a free upgrade:

| Deck | Vault puzzle | Prize |
| --- | --- | --- |
| Cryo Deck | Step on the colour pads in the order a sign gives | Bigger Clip |
| Hydroponics | Ground-pound three switches within 21 seconds | +1 max heart |
| Engine Core | A four-colour code on islands in the lava | Blaster Power |
| Habitat Ring | The code is split between two signs on opposite sides of the Ring | Quick Reload |
| Security Deck | A 7-light hack switches off a laser corridor | LUX Zapper |
| The Bridge | Ground-pound four switches across the navigation room within 28 seconds | 300 bolts |

For the switch puzzles, a clock at the top of the screen counts down from the first switch, with a dot for each one that's down. A cracked vault stays open, even when you replay the deck.

The Elevator on the title screen lets you replay any deck you've reached.

Progress saves at every checkpoint and when you leave the app.

## The story

A new game opens with a prologue out in space: a glowing seed strikes the *Syracusia*, GaScu spreads over the hull, and the ship turns toward a burning star. Then Jason's cryo pod thaws. What happens next (**spoilers**):

- **Captain's logs.** Captain Atalanta left hologram messages on every deck as GaScu took over. They tell you what happened, and where to find her drone, LUX. On the Habitat Ring, the message is from Jason's Aunt Rosa instead.
- **Rescuing LUX.** Jason finds the Captain's little drone switched off in a dark storeroom, fixes him, and he tags along.
- **HALCYON is infected.** By the Security Deck, GaScu pollen has scrambled the ship computer, who turns on you and sends CERBERUS. Beating CERBERUS lets LUX reboot HALCYON. HALCYON then reveals that GaScu isn't angry, it's lost, and thinks the star is its home.
- **Story characters.** Freeing Aunt Rosa (Security) and the Captain (the Bridge) from their cocoons plays a scene with each of them.

Cutscenes play in the game world with letterbox bars:

- Every deck opens with a fly-over, and every boss makes an entrance with its own name card.
- Boss defeats play in slow motion, and each deck ends with a lift ride.
- Between decks the lift climbs the outside of the ship while the crew talks, and the star looks bigger every time.
- Both endings have their own cinematic, followed by credits that list the colonists you rescued.

Tap to hurry a caption along, or press **SKIP** (or the Android back button) to skip a scene.

## Languages

The game is in English and Greek: in Greek it is called **Αστρομπελάδες**, the ship is the **Συρακουσία**, Jason is **Ιάσωνας** and GaScu is **Γάκου** (Γαλαξιακή Κουσκούτα Εχινόχλοη), and the app shows that name on phones set to Greek (`assets/languages/el.json`, for builds made with EAS). The game starts in Greek on a phone set to Greek, and you can switch at any time in **Settings**. The Greek is written as natural Greek for young players rather than word for word. Every string the player sees goes through `tr()` (`game/src/core/i18n.ts`) with its English text as the key, and the Greek table lives in `game/src/i18n/el.ts`. The game and ship names are in `game/src/core/brand.ts`; story text refers to the ship as `{ship}`. `npm run game:i18n` lists anything still missing, and the Jest suite fails if a visible string has no Greek. Fredoka and Orbitron have no Greek letters, so the build fills them in with just the Greek glyphs of M PLUS Rounded 1c and Play.

## Project layout

```text
game/                    the 3D game (TypeScript, three.js), bundled with esbuild
  build.mjs              bundles everything, fonts included, into one offline HTML page
  src/core/              input, audio (synthesized music and sound effects), save data, app bridge, translations
  src/world/             grid level parser, physics, level mesh builder, sky, particles, decor
  src/entities/          Jason, LUX, enemies, bosses, pickups and interactive props
  src/cinema/            cutscene director, in-deck cutscenes, the ship exterior and space cinematics
  src/game/              game state machine, world simulation, title scene, story text
  src/levels/            the six decks as ASCII maps plus legends, objectives and dialogue
  src/i18n/              the Greek translation
  src/ui/                HUD, touch controls, menus, dialogue and hacking screens
  tools/                 level reachability checker (npm run game:check), translation check (npm run game:i18n),
                         app icon generator (npm run gen:icons)
  tests/                 Jest tests: deck data, reachability of every deck, physics, translations, review prompt
src/app/                 Expo Router screens: the WebView host (plus an iframe version for web)
src/generated/           game page as a string (generated, git-ignored)
assets/                  app icons and splash image, plus the app's name on phones set to Greek (languages/)
docs/                    privacy policy, plus the Google Play listing text, screenshots and store graphics
.claude/                 instructions and settings for Claude Code
```

The files left at the root are the ones each tool looks for there: `package.json`, `app.json` (Expo), `eas.json` (EAS builds), `tsconfig.json` and `eslint.config.js`.

### Levels

Each deck is an ASCII map. `#` is a wall, space is open void, `.` is floor, `1`–`9` are raised floor (half a unit per step), `~` is a hazard (sludge, lava, electric water), and `_` is ice. Letters are placed from the deck's `legend`. `npm run game:check` simulates Jason's jump, double-jump, dash and hover ranges on every map. It reports anything you can't reach, checks that each deck's new ability really is needed to finish it, that a checkpoint or energy charger (`=` in a map) sits before every jump that needs a dash, and that every countdown leaves time to spare: the fastest route may use at most half the clock, and even the slowest order of switches at most four fifths. The Jest suite runs the same checks.

## Development

```bash
npm run typecheck     # builds the game page, then runs tsc
npm run lint
npm test
npm run game:check    # per-deck reachability report (add a deck id and --map for a picture)
npm run game:i18n     # English strings still missing a Greek translation
```

## Releasing on Google Play

```bash
npx eas-cli@latest build -p android --profile production   # an .aab for Play Console
```

The Play listing text in English and Greek, the answers for Play Console's forms, the screenshots and the store graphics are in [docs/store/](docs/store/listing.md). The privacy policy the listing links to is [docs/privacy-policy.md](docs/privacy-policy.md).

The first time a player finishes decks 2, 4 and 6, the app asks Google Play to show its review card (`game/src/game/review.ts`, then `expo-store-review` in the app). Following Google's rules, it never shows a button or asks a question first. Google Play decides whether the card actually appears: it limits how often each player sees it, and it never shows in Expo Go or in builds that weren't installed from Play. To see it, install a build from an internal testing track.

## License

[MIT](LICENSE): you're free to read, change and reuse the code. The license covers the code; it doesn't give permission to publish another app under the AstroTroubles! name or logo. The embedded fonts (Fredoka, Orbitron, M PLUS Rounded 1c and Play) are under the SIL Open Font License 1.1.
