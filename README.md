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

- **Level 0:** the Peripheral Shift keeps rearranging the corridor behind you, and the Isolation Effect means every note you find must have been written by… you. Level 0 now has nineteen scenes, plus Level 0.2 and a puzzle chain built on one rule original to this game: the Peripheral Shift only fools the eye.
  - A rod from the low room knocks down a soaked ceiling tile in the wet room, dropping a **camcorder**. Raise it (button or `V`) to look through the viewfinder: rooms show their stable layout, including chalk marks, a doorway behind the pillars and the flickering wall.
  - Beyond the pillars lie the **cubicles**: three identical exits per room. A wrong turn, or looking back, sends you to the first cubicle. Chalk arrows visible only through the lens show the way.
  - In the **faded room**, J.H.'s old camp, the tally marks on the wall count differently through the lens. The true count opens a locker holding a tape.
  - With the tape in, the camcorder records (the REC overlay appears). Whatever is being recorded can't be rearranged, so only then can you throw yourself through the flickering wall into Level 1.
  - **Blackout Zone** (off the low room): pitch dark, ankle-deep water and near silence. Follow the one humming light by ear; it is panned left, right or ahead and moves whenever you go the wrong way. The camcorder's night mode shows the exits but not the way.
  - **Manila Room**: the one place in Level 0 where people can see each other. Someone is sitting in the corner, and M.E.G.'s survival sheet is on the wall. It is a dead end.
  - **Red Rooms**: after enough loops, a red-lit corner appears. Turn back at once and you get away with a sanity hit; go deeper or linger and you get the Red Rooms ending.
  - **Stairs** (off the pillar room): the step count changes every time you count. Up leads to the **arches**, pale rooms full of archways and the steadiest place in the level: rest there to restore sanity and store a checkpoint (once every few moves). Down leads to the **holes**: rows of pitch-black pits where the light only reaches the next row and sometimes dips so floor and pit look the same. Step only on solid floor; a pit means the fall ending. A bag waits on the far side.
  - **Level 0.2 "Remodeled Mess"**: a doorway off the wet room leads into a corridor where the carpet dries and the hum quiets, and on into a freshly remodelled room. Take the screwdriver from its toolbox and the walls fall away to a half-built wooden house: grab tape #2 and get out the door within 15 seconds, or the house comes down on you.
  - **Extra tapes**: #2 in Level 0.2, #3 behind the whispering outlet in the hallway (unscrew it), #4 lying just inside the Red Rooms. Watch them on the camcorder. Show all three to the figure in the Manila Room and he stands up and follows you out, turning the escape into the archived ending.
  - **Above the ceiling**: a folding ladder from the dry corridor lets you climb through the low room's ceiling hole into the crawlspace above the tiles. It links the low room, the wet room (the camcorder can be taken from above too) and, once you unscrew a grille, the faded room, skipping the cubicles. A key sits deep in a duct; hook it out with the rod.
  - **The archive**: the key opens the one arch with a door. Filing cabinets of one-line "records", an index card, drawer 0120 standing empty, and a stick of chalk. Filing the camcorder in drawer 0120 gives the 0120 ending.
  - **Tools with several uses**: the rod is no longer used up; it pokes the wet tile, hooks the key and probes pits safely. The ladder climbs into the ceiling and bridges a pit. The screwdriver opens the outlet and the grille. Chalk writes on the wall by the first note and marks the looping corridor (the mark is gone next lap, though the viewfinder shows otherwise). The far side of the holes now leads into the Blackout Zone.
  - The story is deliberately vague: faces don't come into focus, signatures and dates disagree, and nothing states who J.H. is.
  - Almond water found soaking in the carpet is tainted, and the hum sometimes surges without warning. A dark figure is sometimes standing at the end of the hallway.
- **Level 1, Flickering:** after you open a crate, every light in the halls goes out. You then have a few seconds to get through a door with a green EXIT light into the safer corridors. If you stay in the halls, something finds you.
- **Level 1, the wider Habitable Zone:** the office lockbox now holds a key, not the valve handle. Head into the fog-filled parking hall off the warehouse entrance and keep the red light ahead of you (lose it and you're back at the start) to reach an abandoned M.E.G. outpost, where the valve sits in a locked supply cage. Side areas: the Garden behind the outpost's sealed door (linger and it starts taking you; shears free a bag tangled in the vines), deeper corridors with an infirmary and a padded room whose door locks behind you (only the viewfinder shows the latch), and a construction sector where faceless Backrooms Remodeling Co. workers keep bricking up the way back to the yellow rooms.
- **Something in the halls:** every step through Level 1's halls brings a figure in the fog a little closer; ducking into the corridors or the outpost shakes it off. Let it reach you and you lose sanity and find yourself back in the corridors. Supply crates sometimes appear behind you, and vanish if you walk away.
- **Level 1 → Level 2:** a smooth threshold. Keep walking in the direction where pipes and gauges start to appear.
- **Smilers:** they are attracted to light. With your flashlight on near one, it closes in. Switch the light off, keep the cursor on its eyes (eye contact) until it backs away, and don't panic-click away. A whole nest is too many to stare down.
- **Level 2 wiring:** the lights are wired in series, so one cracked tube darkens the whole hall. Replace it and the smilers retreat from the light.
- **Sanity (清醒度):** drops with every step and with every scare. Almond water restores it.
- **Water (水分) and food (飽足):** every step uses some up, faster on deeper levels. Almond water quenches thirst (tainted carpet water makes it worse, and Level 1's puddle helps a little at a cost); energy bars and a can of peaches fill you up. Resting in the arches costs a little of both. At zero, each step drains extra sanity, and losing all sanity that way gives the dehydration or starvation ending. If it reaches 0, you get the "lost" ending, and you can retry from the start of the current level.
- **Saving:** the game autosaves on every move and also has a manual save button. Saves live in `localStorage`, and a checkpoint is stored each time you enter a new level.

## Credits

The Backrooms setting comes from the community fiction on [The Backrooms Wiki](https://backrooms-wiki.wikidot.com/), licensed [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). That includes the level names, the Peripheral Shift, the Isolation Effect, Flickering, almond water, the M.E.G. and the smilers, drawn mainly from the articles *Level 0 — "Threshold"*, *Red Rooms* (scutoid studios), *The Manila Room*, *Level 0.2 — "Remodeled Mess"* (PandaShark71004) (DivineAtlas, DrAkimoto and RobertGoerman), *Level 1 — "The Habitable Zone"* (Praetor3005 and DivineAtlas), *Level 2* and *Entity 3 — "Smilers"* (Palico22, rewritten by Stretchsterz). This game's story, characters, notes, puzzles and code are original.
