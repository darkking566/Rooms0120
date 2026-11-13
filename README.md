# ROOMS0120

An original 2D point-and-click horror puzzle game set in the Backrooms. The UI and story are in Traditional Chinese.

You "noclip" out of reality into Level 0 (門檻 / "Threshold"). You then make your way through Level 1 (宜居地帶 / "The Habitable Zone") and Level 2 (廢棄維修通道 / "Abandoned Utility Halls") to a door with a green EXIT sign. Along the way you follow notes signed "J.H.", but Level 0's Isolation Effect means nobody else could have left them…

Level 0 also has four optional sublevels. From the starting room, enter the side room with pillars, then go forward into **異常交界**. The four visible entrances lead to:

| Level | Playable adaptation |
| --- | --- |
| 0.1 天頂站 | Repair a steel-and-glass station's airlock: take the robot's fuse, isolate power, then replace the fuse. Observe the hollow spherical station, collect supplies, return to Level 0 or noclip into Level 1. |
| 0.3 冰室 | Cold drains sanity while exploring. Take an insulation mat, seal the cold-air vent, then start the construction heater to thaw a return passage. Reading notes pauses the cold. |
| 0.5 淵閉療舍 | Wade through flooded corridors into an abandoned hospital. A drowned pursuer keeps tracking you; lure it back into the water to dissolve it, then take the metal stairs to Level 1. You can also retreat up the entrance stairs. |
| 0.7 憶域 | Explore representative modern, Victorian, medieval and Egyptian districts. Take an ancient rubbing back to the N.T.G. archive terminal. Static-filled exits are blocked; walk back through increasingly modern districts to return to Level 0. |

These routes, repair puzzles and J.H. notes are game adaptations, rather than a full reproduction of each article. The original Level 0 → 1 → 2 route remains available. New levels use the same inventory, autosave and entry checkpoints; existing v1 saves remain compatible.

## Run

```bash
npm start
```

Then open <http://localhost:8080>. There are no dependencies; Node 18 or newer is enough. Because the game uses ES modules, it has to be served over HTTP; opening `index.html` directly from disk will not work.

## Test

```bash
npm test
```

Plays the whole game in headless Chromium with real mouse clicks. It also checks the smiler scare, the wrong-code and wrong-pressure paths, save/load, and the phone layout. It needs Playwright with Chromium installed; set `SHOTS=<dir>` to also save a screenshot of every scene.

The second suite walks all four sublevels, including unsafe repairs, cold and pursuit timers, paused hazards while reading, one-time rewards, item persistence, checkpoints, old saves and phone taps. To use a system-installed Chromium, run `CHROMIUM_PATH=/path/to/chromium npm test`.

## How it's built

| File | What it does |
| --- | --- |
| `src/render.js` | Procedural one-point-perspective renderer: rooms, boxes, pipes, notes, the flashlight darkness mask, the smiler, film grain and the camcorder overlay. Every scene is drawn in code; there are no image files. |
| `src/scenes.js` | The scene graph: each scene's room parameters, extra drawing and clickable hotspots (go, look, take, or use an item). |
| `src/sublevels.js` | Level 0's branch entrances and the four sublevels: procedural scenery, repair puzzles, cold, pursuit and historical districts. |
| `src/items.js` | Inventory items, combinations and icons. |
| `src/notes.js` | J.H.'s notes. |
| `src/audio.js` | WebAudio-synthesised ambience for each level, plus sound effects. There are no audio files. |
| `src/main.js` | State, input, inventory, modals (notes, keypad, pressure dials), saving and the game loop. |

### Mechanics

Most mechanics follow the Backrooms Wiki setting:

- **Level 0:** the Peripheral Shift keeps rearranging the corridor behind you. Keep walking until a flickering wall appears, then throw yourself through it.
- **Level 1, Flickering:** after you open a crate, every light in the halls goes out. You then have a few seconds to get through a door with a green EXIT light into the safer corridors. If you stay in the halls, something finds you.
- **Level 1 → Level 2:** a smooth threshold. Keep walking in the direction where pipes and gauges start to appear.
- **Smilers:** they are attracted to light. With your flashlight on near one, it closes in. Switch the light off, keep the cursor on its eyes (eye contact) until it backs away, and don't panic-click away. A whole nest is too many to stare down.
- **Level 2 wiring:** the lights are wired in series, so one cracked tube darkens the whole hall. Replace it and the smilers retreat from the light.
- **Sanity (清醒度):** drops with every step and with every scare. Almond water restores it. If it reaches 0, you get the "lost" ending, and you can retry from the start of the current level.
- **Saving:** the game autosaves on every move and also has a manual save button. Saves live in `localStorage`, and a checkpoint is stored each time you enter a new level.

## Credits

The Backrooms setting comes from the community fiction on [The Backrooms Wiki](https://backrooms-wiki.wikidot.com/), licensed [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). That includes the level names, the Peripheral Shift, the Isolation Effect, Flickering, almond water, the M.E.G. and the smilers, drawn mainly from the articles *Level 0 — "Threshold"* (DivineAtlas, DrAkimoto and RobertGoerman), *Level 1 — "The Habitable Zone"* (Praetor3005 and DivineAtlas), *Level 2* and *Entity 3 — "Smilers"* (Palico22, rewritten by Stretchsterz). This game's story, characters, notes, puzzles and code are original.

The added sublevel settings are adapted from these Chinese Wiki pages, each under **CC BY-SA 3.0**. The setting adaptations in this game are shared under the same license. All graphics and sounds are generated in code; no article images or audio are reused.

| Source | Original author | Chinese translation |
| --- | --- | --- |
| [Level 0.1 — 天頂站](https://backrooms-wiki-cn.wikidot.com/level-0-1) | CutTheBirch | Ambersight |
| [Level 0.3 — 冰室](https://backrooms-wiki-cn.wikidot.com/level-0-3) | CursedSliver | Ambersight |
| [Level 0.5 — 淵閉療舍](https://backrooms-wiki-cn.wikidot.com/level-0-5) | FuneralBouncer | xuziqi |
| [Level 0.7 — 憶域](https://backrooms-wiki-cn.wikidot.com/level-0-7), including its linked historical district archive | T-Dragon | jiaoyanerlan2, KkKkK_1234, owl4513 |
