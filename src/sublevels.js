// Playable adaptations of five Backrooms Wiki articles (Chinese translations, CC BY-SA 3.0):
//   Level 0.1 "Zenith Station" (CutTheBirch), Level 0.2 "Remodeled Mess" (PandaShark71004),
//   Level 0.3 "Ice Rooms" (CursedSliver),
//   Level 0.5 "Drenched Sanatorium" (FuneralBouncer), Level 0.7 "The Reminiscence District" (T-Dragon).
// Credits are in README.md and the in-game footer. Puzzles, scene text and J.H. notes are original.
// The scenes themselves live in src/levels/level0-*.js; this file collects them.
import { L01_SCENES } from './levels/level0-1.js';
import { L02_SCENES } from './levels/level0-2.js';
import { L03_SCENES } from './levels/level0-3.js';
import { L05_SCENES } from './levels/level0-5.js';
import { L07_SCENES, L1_OLD } from './levels/level0-7.js';

export const SUBLEVELS = {
  '0.1': { name: 'LEVEL 0.1', sub: '天頂站', drain: 1, thirst: 1.5, hunger: 1 },
  '0.3': { name: 'LEVEL 0.3', sub: '冰室', drain: 1.5, thirst: 1.2, hunger: 1.6 },
  '0.5': { name: 'LEVEL 0.5', sub: '淵閉療舍', drain: 2.5, thirst: 2.5, hunger: 1.4 },
  '0.7': { name: 'LEVEL 0.7', sub: '憶域', drain: 2, thirst: 2, hunger: 1.5 },
};

export const SUBLEVEL_SCENES = {
  ...L02_SCENES,
  ...L1_OLD,
  ...L01_SCENES,
  ...L03_SCENES,
  ...L05_SCENES,
  ...L07_SCENES,
};
