# ROOMS0120

An original 2D point-and-click horror puzzle game set in the Backrooms. The UI and story are in Traditional Chinese.

You "noclip" out of reality into Level 0 (門檻 / "Threshold"). You then make your way through Level 1 (宜居地帶 / "The Habitable Zone") and Level 2 (廢棄維修通道 / "Abandoned Utility Halls") to a door with a green EXIT sign. Along the way you follow notes signed "J.H.", but Level 0's Isolation Effect means nobody else could have left them…

Level 0 also has four optional sublevels. Their entrances are spread across Level 0 and follow how each wiki article says the sublevel is reached:

| Level | Way in | Based on the article |
| --- | --- | --- |
| 0.1 天頂站 | A sleek, broken station inside Level 0. Time your way through an airlock door stuck in a loop, then explore the ring corridor: crew quarters (one rest, a keycard), a galley whose cooking arm lays a seventh tray, and a hydroponic greenhouse. The far section is cooking at +68°C; the climate console can only cool it by shutting down another section, and you choose which (cutting the airlock closes the way back). The observation deck looks into the hollow shell; a flickering hull breach noclips you to Level 1, or sometimes back to Level 0. |
| 0.3 冰室 | Level 0, frozen; the cold wears down sanity. Task Force 104-CX's work site holds their emails, a blowtorch with a frozen canister and a roll of wool carpet. The live vent hops around its room: wrap it when it lands within reach, the heater can finally warm the camp, and the blowtorch lights. Melt through the ice to a room full of frozen figures — hollow inside — and on to the "clean, tidy, comfortable, warm" room they finished, which lets you out. |
| 0.5 淵閉療舍 | Knee-deep brown water and an echo that hurts. Drinking it quenches thirst but makes you sick; a sparking lamp has to be passed between bursts. The hospital has beds — and sleeping in one wakes the Drowned, which follows you without rest and loops the corridors back to the water. Lure it into the water to dissolve it, sleep for real, then follow the corridor to the metal stairs down into Level 1. |
| 0.7 憶域 | A time bubble of past Level 0s: a modern stretch whose exits are sealed by "no signal" static, then bulbs and candles (toxic wallpaper, an N.T.G. pack with the only water), a Victorian hall where a voice calls from a doorway (don't answer), castle corridors where only the torch-lit archway is safe, a Roman marble hall and Egyptian corridors with a Growler in the dark. Rub the carving and get out by walking back, or sleep in the alcove: with something from the present you wake in the modern stretch, without it you wake beside a rift into an old Level 1. |

These routes, puzzles and J.H. notes are game adaptations, rather than a full reproduction of each article. The original Level 0 → 1 → 2 route remains available. New levels use the same inventory, autosave and entry checkpoints; existing v1 saves remain compatible.

## Run

```bash
npm start
```

Then open <http://localhost:8080>. There are no dependencies; Node 18 or newer is enough. Because the game uses ES modules, it has to be served over HTTP; opening `index.html` directly from disk will not work.

## Test

```bash
npm test
```

First runs a quick static check (`tests/integrity.mjs`, no browser): every scene, item, note, ending and flag the code names must exist, and save migration must keep old saves playable. `npm run test:integrity` runs only that part. Then it plays the whole game in headless Chromium with real mouse clicks. It also checks the Level 0 viewfinder puzzles, the cubicle reset, the smiler scare, the wrong-code and wrong-pressure paths, save/load, and the phone layout. It needs Playwright with Chromium installed; set `SHOTS=<dir>` to also save a screenshot of every scene.

The second suite walks all four sublevels, including unsafe repairs, cold and pursuit timers, paused hazards while reading, one-time rewards, item persistence, checkpoints, old saves and phone taps. To use a system-installed Chromium, run `CHROMIUM_PATH=/path/to/chromium npm test`. Otherwise install the pinned Playwright with `npm install` and `npx playwright install chromium`. GitHub Actions runs `npm test` on every push and pull request (`.github/workflows/test.yml`).

The browser tests load the game with `?seed=120`, so every random event happens the same way on every run. You can do the same while playing to reproduce a run.

## How it's built

| File | What it does |
| --- | --- |
| `src/render.js` | Procedural one-point-perspective renderer: rooms, boxes, pipes, notes, the flashlight darkness mask, the smiler, film grain and the camcorder overlay. Every scene is drawn in code; there are no image files. |
| `src/scenes.js` | The scene graph: collects every level's scenes into one map and defines the levels (`LEVELS`). Each scene has room parameters, extra drawing and clickable hotspots (go, look, take, or use an item). |
| `src/levels/level0.js`, `level1.js`, `level2.js` | The scenes of Levels 0, 1 and 2, with their scenery and puzzles. Shared helpers (`BACK`, `FORWARD`, palettes, smilers) are in `src/levels/common.js`. |
| `src/sublevels.js` | Collects the sublevels' scenes and defines their levels. |
| `src/levels/level0-1.js` … `level0-7.js` | The B.N.T.G. pillar route and Levels 0.1, 0.2, 0.3, 0.5 and 0.7 (plus the old Level 1 behind 0.7's rift): procedural scenery, repair puzzles, cold, pursuit and historical districts. Their shared helpers are in `src/levels/sublevel-kit.js`. |
| `src/items.js` | Inventory items, combinations and icons. |
| `src/notes.js` | J.H.'s notes. |
| `src/audio.js` | WebAudio-synthesised ambience for each level, plus sound effects. There are no audio files. |
| `src/main.js` | State, input, inventory, the camcorder viewfinder, modals (notes, keypad, pressure dials), saving and the game loop. |
| `src/endings.js` | The ending texts, and `COMPLETIONS`: the endings that finish the game (they clear the save and offer no retry). |
| `src/scares.js` | The jump-scare drawing for each kind of monster. To add a monster, add its drawing here and pass its name to `g.scare()`. |
| `src/flavor.js` | Whispers at low sanity and what Level 1's phantom supply crates can hold. |
| `src/save.js` | Save migration. Every save and checkpoint goes through it, so old saves keep working. When you rename a scene, add it to `SCENE_ALIASES`; when you change the save format, bump `SAVE_VERSION` and add a step to `MIGRATIONS`. A save whose scene no longer exists wakes up in Level 0 instead of being thrown away. |
| `src/rng.js` | Gameplay randomness (`rand()`, `pick()`), seedable with `?seed=<n>`. Use it for anything that changes what happens; cosmetic noise can keep using `Math.random`. |

### Mechanics

Most mechanics follow the Backrooms Wiki setting:

- **Level 0:** the Peripheral Shift keeps rearranging the corridor behind you, and the Isolation Effect means every note you find must have been written by… you. Level 0 now has nineteen scenes, plus Level 0.2 and a puzzle chain built on one rule original to this game: the Peripheral Shift only fools the eye.
  - A rod from the low room knocks down a soaked ceiling tile in the wet room, dropping a **camcorder**. Raise it (button or `V`) to look through the viewfinder: rooms show their stable layout, including chalk marks, a doorway behind the pillars and the flickering wall.
  - Beyond the pillars lie the **cubicles**: three identical exits per room. A wrong turn, or looking back, sends you to the first cubicle. Chalk arrows visible only through the lens show the way.
  - In the **faded room**, J.H.'s old camp, the tally marks on the wall count differently through the lens. The true count opens a locker holding a tape.
  - With the tape in, the camcorder records (the REC overlay appears). Whatever is being recorded can't be rearranged, so only then can you throw yourself through the flickering wall into Level 1.
  - **Blackout Zone** (off the low room): pitch dark, ankle-deep water and near silence. Follow the one humming light by ear; it is panned left, right or ahead and moves whenever you go the wrong way. The camcorder's night mode shows the exits but not the way.
  - **Manila Room**: the one place in Level 0 where people can see each other. Someone is sitting in the corner, and M.E.G.'s survival sheet is on the wall. It is a dead end.
  - **Red Rooms**: after enough loops, a red-lit corner appears. Turn back at once and you get away with a sanity hit; go deeper or linger and you get the Red Rooms ending.
  - **Stairs** (off the pillar room): the step count changes every time you count. Up leads to the **arches**, pale rooms full of archways and the steadiest place in the level: rest there to restore sanity and store a checkpoint (once every few moves). Down leads to the **holes**: rows of pitch-black pits where the light only reaches the next row and sometimes dips so floor and pit look the same. Step only on solid floor; a pit means the fall ending. A bag waits on the far side.
  - **Level 0.2 "Remodeled Mess"**: a doorway off the wet room leads into a corridor where the carpet dries and the hum quiets, and on into a freshly remodelled hall with working WiFi, a clean restroom (water, a wet paper towel, a warning from J.H.) and the 102-CX site office. Take the screwdriver from its toolbox and everything collapses into a half-built wooden house: grab tape #2, keep the dust out with the towel, cross the caved-in hall on the joist that isn't cracking and time your dash past the falling ceiling tiles to the Level 0 door within 40 seconds. Next visit it is all good as new, but stepping into the office brings it down again.
  - **Extra tapes**: #2 in Level 0.2, #3 behind the whispering outlet in the hallway (unscrew it), #4 lying just inside the Red Rooms. Watch them on the camcorder. Show all three to the figure in the Manila Room and he stands up and follows you out, turning the escape into the archived ending.
  - **Above the ceiling**: a folding ladder from the dry corridor lets you climb through the low room's ceiling hole into the crawlspace above the tiles. It links the low room, the wet room (the camcorder can be taken from above too) and, once you unscrew a grille, the faded room, skipping the cubicles. A key sits deep in a duct; hook it out with the rod.
  - **The archive**: the key opens the one arch with a door. Filing cabinets of one-line "records", an index card, drawer 0120 standing empty, and a stick of chalk. Filing the camcorder in drawer 0120 gives the 0120 ending.
  - **Tools with several uses**: the rod is no longer used up; it pokes the wet tile, hooks the key and probes pits safely. The ladder climbs into the ceiling and bridges a pit. The screwdriver opens the outlet and the grille. Chalk writes on the wall by the first note and marks the looping corridor (the mark is gone next lap, though the viewfinder shows otherwise). The far side of the holes now leads into the Blackout Zone.
  - The story is deliberately vague: faces don't come into focus, signatures and dates disagree, and nothing states who J.H. is.
  - Almond water found soaking in the carpet is tainted, and the hum sometimes surges without warning. A dark figure is sometimes standing at the end of the hallway.
- **Level 1, Flickering:** after you open a crate, every light in the halls goes out. You then have a few seconds to get through a door with a green EXIT light into the safer corridors. If you stay in the halls, something finds you.
- **Arriving in Level 1:** each way in leaves its own trace at the warehouse entrance: a frosted hull fragment from Zenith Station, wet footprints and an M.E.G. blanket left for whoever climbs up from the sanatorium, or a horseshoe if you came through Level 0.7's rift, which first drops you into the old Level 1, a concrete garage full of empty horse stalls where the typist left a page in a typewriter.
- **Level 1, the wider Habitable Zone:** the office lockbox now holds a key, not the valve handle. Head into the fog-filled parking hall off the warehouse entrance and keep the red light ahead of you (lose it and you're back at the start) to reach an abandoned M.E.G. outpost, where the valve sits in a locked supply cage. Side areas: the Garden behind the outpost's sealed door (linger and it starts taking you; shears free a bag tangled in the vines), deeper corridors with an infirmary and a padded room whose door locks behind you (only the viewfinder shows the latch), and a construction sector where faceless Backrooms Remodeling Co. workers keep bricking up the way back to the yellow rooms.
- **Something in the halls:** every step through Level 1's halls brings a figure in the fog a little closer; ducking into the corridors or the outpost shakes it off. Let it reach you and you lose sanity and find yourself back in the corridors. Supply crates sometimes appear behind you, and vanish if you walk away.
- **Level 1 → Level 2:** a smooth threshold. Keep walking in the direction where pipes and gauges start to appear.
- **Smilers:** they are attracted to light. With your flashlight on near one, it closes in. Switch the light off, keep the cursor on its eyes (eye contact) until it backs away, and don't panic-click away. A whole nest is too many to stare down.
- **Level 2 wiring:** the lights are wired in series, so one cracked tube darkens the whole hall. Replace it and the smilers retreat from the light.
- **Level 2, the utility halls:**
  - **Newcomer camp** (the cream steel door in the first tunnel): an abandoned camp with bunks, claw marks on the door, a registration book where every entry has the same date, a barrel of almond water, and a toolbox with a wrench. Rest on the bunk once to restore sanity and store a checkpoint.
  - **Boiler room** (behind the pressure door): the heat drains water while the steam leak is open. Shut the leaking valve with the wrench to reach the far door. The pipes deliver things upstream: open the hatch.
  - **Dead railway**: a burnt-out battery cart on narrow-gauge tracks, the cause of the level-wide blackout. The white door with a painted circle opens on a **void room**, lit only by the doorway behind you. Step in without the camcorder recording and you can only take one step before the doorway is lost (the void ending). With the viewfinder raised, the doorway stays fixed in the corner of the screen and you can walk deep enough to find tape #5.
  - **Narrow brick corridor**: something knocks inside the walls and grabs you if you linger. The bright window at the end is not a way out. Take the steel door marked 監控.
  - **Monitor room**: a wall of screens showing rooms you have visited, and a terminal asking for one line in record 0120. "對象離開了。" leads on to the usual escape; "歸檔。" ends the game with the filed ending; writing your own name is only possible after watching tape #5, and turns the escape into the closed-case ending (結案).
- **Sanity (清醒度):** drops with every step and with every scare. Almond water restores it.
- **Water (水分) and food (飽足):** every step uses some up, faster on deeper levels. Almond water quenches thirst (tainted carpet water makes it worse, and Level 1's puddle helps a little at a cost); energy bars and a can of peaches fill you up. Resting in the arches costs a little of both. At zero, each step drains extra sanity, and losing all sanity that way gives the dehydration or starvation ending. If it reaches 0, you get the "lost" ending, and you can retry from the start of the current level.
- **Saving:** the game autosaves on every move and also has a manual save button. Saves live in `localStorage`, and a checkpoint is stored each time you enter a new level.

## Credits

The Backrooms setting comes from the community fiction on [The Backrooms Wiki](https://backrooms-wiki.wikidot.com/), licensed [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). That includes the level names, the Peripheral Shift, the Isolation Effect, Flickering, almond water, the M.E.G. and the smilers, drawn mainly from the articles *Level 0 — "Threshold"*, *Red Rooms* (scutoid studios), *The Manila Room*, *Level 0.2 — "Remodeled Mess"* (PandaShark71004) (DivineAtlas, DrAkimoto and RobertGoerman), *Level 1 — "The Habitable Zone"* (Praetor3005 and DivineAtlas), *Level 2 — "Abandoned Utility Halls"* (u/M654z, rewritten by 1000dumplings, current page by Boring Talking; Level 2's camps, void rooms, Windows, wall-burrowing Wranglers, heat and the B.N.T.G. railway blackout come from it) and *Entity 3 — "Smilers"* (Palico22, rewritten by Stretchsterz). This game's story, characters, notes, puzzles and code are original.

The added sublevel settings are adapted from these Chinese Wiki pages, each under **CC BY-SA 3.0**. The setting adaptations in this game are shared under the same license. All graphics and sounds are generated in code; no article images or audio are reused.

| Source | Original author | Chinese translation |
| --- | --- | --- |
| [Level 0.1 — 天頂站](https://backrooms-wiki-cn.wikidot.com/level-0-1) | CutTheBirch | Ambersight |
| [Level 0.3 — 冰室](https://backrooms-wiki-cn.wikidot.com/level-0-3) | CursedSliver | Ambersight |
| [Level 0.5 — 淵閉療舍](https://backrooms-wiki-cn.wikidot.com/level-0-5) | FuneralBouncer | xuziqi |
| [Level 0.7 — 憶域](https://backrooms-wiki-cn.wikidot.com/level-0-7), including its linked historical district archive | T-Dragon | jiaoyanerlan2, KkKkK_1234, owl4513 |
