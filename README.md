# Hull Breach: Leviathan

A 3D action-adventure platformer for Android, built with three.js inside an Expo / React Native app.

The colony ship *Leviathan* is carrying ten thousand sleeping colonists when a glowing space plant called **the Bloom** grows over every deck and starts steering the ship toward a star. You play **Kai Reyes**, a junior engineer who wakes up early. Together with **BOLT**, a nervous little repair drone who's scared of the dark, Kai climbs six decks to reach the Bridge. Along the way you rescue colonists, collect memory shards, and find out what the Bloom really wants.

It's made for players around 10 and up: bright, forgiving, and about 2–3 hours long if you hunt for the secrets.

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

Open `game/dist/index.html` in a browser. Keyboard: **WASD / arrows** move, **Space** jumps, **J** blasts, **K** spins or ground-pounds, **L / Shift** dashes, **E** is the action button, **Q / R** turn the camera, **Esc** pauses. `npm run game:dev` rebuilds on every save.

## How to play

| Control | What it does |
| --- | --- |
| Left side of the screen | Joystick: move |
| Drag on the right side | Turn the camera |
| **JUMP** | Jump. Hold for higher jumps; with the Jet Boots, press again in mid-air |
| **BLAST** | Shoots; aims at the nearest enemy automatically |
| **SPIN** | Spin attack. In mid-air it becomes a **ground pound**, which presses red switches and hurts more |
| **DASH** | Zoom forward, even in mid-air (after the Engine Core) |
| BOLT button | Appears near terminals, pylons, signs and lifts. Also triggers BOLT's shield once you have it |

Kai finds a new ability on each deck, and it's needed to finish that deck:

| Deck | New trick | Boss |
| --- | --- | --- |
| 1. Cryo Deck | Find BOLT in the dark storeroom; hacking | Frost Warden |
| 2. Hydroponics | Jet Boots (double jump) | Vine Queen |
| 3. Engine Core | Dash Thrusters | Magma Golem |
| 4. Habitat Ring | Hover Pack (hold JUMP to float) | King Bloblin |
| 5. Security Deck | BOLT Shield (blocks lasers and shots) | WARDOG |
| 6. The Bridge | Everything at once | The Bloom Heart |

- **Hacking** is a light-pattern memory game: watch BOLT's lights, then repeat them.
- **Bolts** are money. Spend them at VENDY's shop on extra hearts, blaster power, rapid fire, a stronger BOLT zap and a bolt magnet.
- **Checkpoints** heal you. Falling or touching sludge, lava or electric water costs one heart and puts you back on the last safe ground. If you run out of hearts, you restart at the last checkpoint, and defeated enemies stay defeated.
- **Collectibles:** 18 memory shards (3 per deck), 12 colonists trapped in Bloom cocoons (blast them free), and a hidden heart canister on every deck. Some are tucked behind cracked walls (spin or blast them) or out over the void. The Elevator on the title screen lets you replay any deck you've reached.
- **Two endings.** Beat the Bloom Heart to save the ship. Collect all 18 shards and BOLT learns to *speak* to it instead, which unlocks the secret ending.

Progress saves at every checkpoint and when you leave the app.

## The story

A new game opens with a prologue out in space: a glowing seed strikes the *Leviathan*, the Bloom spreads over the hull, and the ship turns toward a burning star. Then Kai's cryo pod thaws. From there:

- **Captain's logs.** Captain Ines Mbeki left hologram messages on every deck as the Bloom took over. They tell you what happened, and where to find her drone, BOLT. On the Habitat Ring, the message is from Kai's Aunt Rosa instead.
- **Rescuing BOLT.** Kai finds the Captain's little drone switched off in a dark storeroom, fixes him, and he tags along.
- **HALCYON is infected.** By the Security Deck, Bloom pollen has scrambled the ship computer, who turns on you and sends WARDOG. Beating WARDOG lets BOLT reboot HALCYON. HALCYON then reveals that the Bloom isn't angry, it's lost, and thinks the star is its home.
- **Story characters.** Freeing Aunt Rosa (Security) and the Captain (the Bridge) from their cocoons plays a scene with each of them.

Cutscenes play in the game world with letterbox bars:

- Every deck opens with a fly-over, and every boss makes an entrance with its own name card.
- Boss defeats play in slow motion, and each deck ends with a lift ride.
- Between decks the lift climbs the outside of the ship while the crew talks, and the star looks bigger every time.
- Both endings have their own cinematic, followed by credits that list the colonists you rescued.

Tap to hurry a caption along, or press **SKIP** (or the Android back button) to skip a scene.

## Project layout

```text
game/                    the 3D game (TypeScript, three.js), bundled with esbuild
  build.mjs              bundles everything, fonts included, into one offline HTML page
  src/core/              input, audio (synthesized music and sound effects), save data, app bridge
  src/world/             grid level parser, physics, level mesh builder, sky, particles, decor
  src/entities/          Kai, BOLT, enemies, bosses, pickups and interactive props
  src/cinema/            cutscene director, in-deck cutscenes, the ship exterior and space cinematics
  src/game/              game state machine, world simulation, title scene, story text
  src/levels/            the six decks as ASCII maps plus legends, objectives and dialogue
  src/ui/                HUD, touch controls, menus, dialogue and hacking screens
  tools/                 level reachability checker (npm run game:check)
src/app/                 Expo Router screens: the WebView host (plus an iframe version for web)
src/generated/           game page as a string (generated, git-ignored)
__tests__/               Jest tests: deck data, reachability of every deck, physics
```

### Levels

Each deck is an ASCII map. `#` is a wall, space is open void, `.` is floor, `1`–`9` are raised floor (half a unit per step), `~` is a hazard (sludge, lava, electric water), and `_` is ice. Letters are placed from the deck's `legend`. `npm run game:check` simulates Kai's jump, double-jump, dash and hover ranges on every map. It reports anything you can't reach, and checks that each deck's new ability really is needed to finish it. The Jest suite runs the same checks.

## Development

```bash
npm run typecheck     # builds the game page, then runs tsc
npm run lint
npm test
npm run game:check    # per-deck reachability report (add a deck id and --map for a picture)
```
