# ROOMS0120

An original 2D point-and-click horror puzzle game set in the Backrooms. The UI and story are in Traditional Chinese.

You "noclip" out of reality into Level 0 (大廳). Follow the notes left by another wanderer, J.H., and make your way through Level 1 (宜居地帶) and Level 2 (管線夢境) to a door with a green EXIT sign.

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

## How it's built

| File | What it does |
| --- | --- |
| `src/render.js` | Procedural one-point-perspective renderer: rooms, boxes, pipes, notes, the flashlight darkness mask, the smiler, film grain and the camcorder overlay. Every scene is drawn in code; there are no image files. |
| `src/scenes.js` | The scene graph: each scene's room parameters, extra drawing and clickable hotspots (go, look, take, or use an item). |
| `src/items.js` | Inventory items, combinations and icons. |
| `src/notes.js` | J.H.'s notes. |
| `src/audio.js` | WebAudio-synthesised ambience for each level, plus sound effects. There are no audio files. |
| `src/main.js` | State, input, inventory, modals (notes, keypad, pressure dials), saving and the game loop. |

### Mechanics

- **Sanity (清醒度):** drops with every step and with every scare. Almond water restores it. If it reaches 0, you get the "lost" ending, and you can retry from the start of the current level.
- **Darkness:** stay in a dark room without your flashlight on and a smiler will find you.
- **Saving:** the game autosaves on every move and also has a manual save button. Saves live in `localStorage`, and a checkpoint is stored each time you enter a new level.

## Credits

The Backrooms setting, its level names, almond water and smilers come from the community fiction on [The Backrooms Wiki](https://backrooms-wiki.wikidot.com/), licensed [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). This game's story, characters, notes, puzzles and code are original.
