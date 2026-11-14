// Scene graph. Each scene: a procedural room, extra drawing, and clickable hotspots.
// The scenes themselves live in src/scenes/, one file per level; this file puts them together.
// Setting details follow the Backrooms Wiki (CC BY-SA 3.0): Level 0 "Threshold", Level 1 "The Habitable Zone",
// Level 2 "Abandoned Utility Halls", Smilers (Entity 3). Story, notes and puzzles are original.
import { SUBLEVELS, SUBLEVEL_SCENES } from './sublevels.js';
import { LEVEL0_SCENES } from './scenes/level0.js';
import { LEVEL1_SCENES } from './scenes/level1.js';
import { LEVEL2_SCENES } from './scenes/level2.js';

export { smilerRect, drawSmilers } from './scenes/common.js';

export const LEVELS = {
  // drain: sanity per step; thirst / hunger: how fast water and food run out per step
  0: { name: 'LEVEL 0', sub: '門檻', drain: 1, thirst: 1.5, hunger: 1 },
  1: { name: 'LEVEL 1', sub: '宜居地帶', drain: 1.5, thirst: 2, hunger: 1.2 },
  2: { name: 'LEVEL 2', sub: '廢棄維修通道', drain: 2, thirst: 2.5, hunger: 1.5 },
  0.2: { name: 'LEVEL 0.2', sub: '重新裝修的爛攤子', drain: 1, thirst: 1.5, hunger: 1 },
  ...SUBLEVELS,
};

export const SCENES = {
  ...SUBLEVEL_SCENES,
  ...LEVEL0_SCENES,
  ...LEVEL1_SCENES,
  ...LEVEL2_SCENES,
};
