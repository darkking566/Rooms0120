# ROOMS0120

An original 2D point-and-click horror puzzle game set in the Backrooms. The UI and story are in Traditional Chinese.

You "noclip" out of reality into Level 0 (門檻 / "Threshold"). You then make your way through Level 1 (宜居地帶 / "The Habitable Zone") and Level 2 (廢棄維修通道 / "Abandoned Utility Halls") to a door with a green EXIT sign. Along the way you follow notes signed "J.H.", but Level 0's Isolation Effect means nobody else could have left them…

## Run

```bash
npm start
```

Then open <http://localhost:8080>. There are no dependencies; Node 18 or newer is enough. Because the game uses ES modules, it has to be served over HTTP; opening `index.html` directly from disk will not work.

## Test

```bash
npm test
```

Plays the whole game in headless Chromium with real mouse clicks. It also checks the Level 0 viewfinder puzzles, the cubicle reset, the smiler scare, the wrong-code and wrong-pressure paths, save/load, and the phone layout. It needs Playwright with Chromium installed; set `SHOTS=<dir>` to also save a screenshot of every scene.

## How it's built

| File | What it does |
| --- | --- |
| `src/render.js` | Procedural one-point-perspective renderer: rooms, boxes, pipes, notes, the flashlight darkness mask, the smiler, film grain and the camcorder overlay. Every scene is drawn in code; there are no image files. |
| `src/scenes.js` | The scene graph: each scene's room parameters, extra drawing and clickable hotspots (go, look, take, or use an item). |
| `src/items.js` | Inventory items, combinations and icons. |
| `src/notes.js` | J.H.'s notes. |
| `src/audio.js` | WebAudio-synthesised ambience for each level, plus sound effects. There are no audio files. |
| `src/main.js` | State, input, inventory, the camcorder viewfinder, modals (notes, keypad, pressure dials), saving and the game loop. |

### Mechanics

Most mechanics follow the Backrooms Wiki setting:

- **Level 0:** the Peripheral Shift keeps rearranging the corridor behind you, and the Isolation Effect means every note you find must have been written by… you. Level 0 now has eleven scenes and a puzzle chain built on one rule original to this game: the Peripheral Shift only fools the eye.
  - A rod from the low room knocks down a soaked ceiling tile in the wet room, dropping a **camcorder**. Raise it (button or `V`) to look through the viewfinder: rooms show their stable layout, including chalk marks, a doorway behind the pillars and the flickering wall.
  - Beyond the pillars lie the **cubicles**: three identical exits per room. A wrong turn, or looking back, sends you to the first cubicle. Chalk arrows visible only through the lens show the way.
  - In the **faded room**, J.H.'s old camp, the tally marks on the wall count differently through the lens. The true count opens a locker holding a tape.
  - With the tape in, the camcorder records (the REC overlay appears). Whatever is being recorded can't be rearranged, so only then can you throw yourself through the flickering wall into Level 1.
  - **Blackout Zone** (off the low room): pitch dark, ankle-deep water and near silence. Follow the one humming light by ear; it is panned left, right or ahead and moves whenever you go the wrong way. The camcorder's night mode shows the exits but not the way.
  - **Manila Room**: the one place in Level 0 where people can see each other. Someone is sitting in the corner, and M.E.G.'s survival sheet is on the wall. It is a dead end.
  - **Red Rooms**: after enough loops, a red-lit corner appears. Turn back at once and you get away with a sanity hit; go deeper or linger and you get the Red Rooms ending.
  - Almond water found soaking in the carpet is tainted, and the hum sometimes surges without warning. A dark figure is sometimes standing at the end of the hallway.
- **Level 1, Flickering:** after you open a crate, every light in the halls goes out. You then have a few seconds to get through a door with a green EXIT light into the safer corridors. If you stay in the halls, something finds you.
- **Level 1 → Level 2:** a smooth threshold. Keep walking in the direction where pipes and gauges start to appear.
- **Smilers:** they are attracted to light. With your flashlight on near one, it closes in. Switch the light off, keep the cursor on its eyes (eye contact) until it backs away, and don't panic-click away. A whole nest is too many to stare down.
- **Level 2 wiring:** the lights are wired in series, so one cracked tube darkens the whole hall. Replace it and the smilers retreat from the light.
- **Sanity (清醒度):** drops with every step and with every scare. Almond water restores it. If it reaches 0, you get the "lost" ending, and you can retry from the start of the current level.
- **Saving:** the game autosaves on every move and also has a manual save button. Saves live in `localStorage`, and a checkpoint is stored each time you enter a new level.

## Credits

The Backrooms setting comes from the community fiction on [The Backrooms Wiki](https://backrooms-wiki.wikidot.com/), licensed [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). That includes the level names, the Peripheral Shift, the Isolation Effect, Flickering, almond water, the M.E.G. and the smilers, drawn mainly from the articles *Level 0 — "Threshold"*, *Red Rooms* (scutoid studios), *The Manila Room* (DivineAtlas, DrAkimoto and RobertGoerman), *Level 1 — "The Habitable Zone"* (Praetor3005 and DivineAtlas), *Level 2* and *Entity 3 — "Smilers"* (Palico22, rewritten by Stretchsterz). This game's story, characters, notes, puzzles and code are original.
