// Level 0 "Threshold": the yellow rooms, the ceiling crawlspace and the archive.
// Setting details follow the Backrooms Wiki (CC BY-SA 3.0). Story, notes and puzzles are original.
import { CX, H, P, W, bottle, bounds, box, boxRect, faceQuad, hex, mul, paper, pipe, poly, rgb, seg, shade, wallQuad } from '../render.js';
import { pick, rand } from '../rng.js';
import { annexDoor, drawAnnexEntrance } from './level0-1.js';
import { drawExit001Door, exit001Door } from './level0-01.js';
import { drawDzEntryVent, dzEntryVent } from './level0-1-dz.js';
import { drawDullWallEntrance, dullWallEntrance } from './level0-98.js';
import { squeezeGap } from './level0-7c.js';
import { BACK, FORWARD, LOOP_MSGS, PAL, hum } from './common.js';
import { clockOf, drawBag, drawBucket, drawCone, drawKettle, glow, outline, txt } from './sublevel-kit.js';

// ---------- LEVEL 0 ----------
// Level 0's own rule in this game: the Peripheral Shift only fools the eye. Seen through a camcorder's
// viewfinder, a room shows its stable layout, and whatever is being recorded can no longer be rearranged.
const PAL0 = {
  low: { wall: '#b9a554', ceil: '#c4ba86', floor: '#83723a', fog: '#211c0c', light: '#fff0b8' },
  wet: { wall: '#a89648', ceil: '#b9ae7c', floor: '#5f5428', fog: '#1a160a', light: '#f6ecc0' },
  faded: { wall: '#c4ba98', ceil: '#d2cbae', floor: '#6f6748', fog: '#1d1a12', light: '#fff6dc' },
  mottled: { wall: '#b7ab76', ceil: '#c8c29d', floor: '#7d7348', fog: '#201e14', light: '#f4ecc8' },
  firedoor: { wall: '#9a9682', ceil: '#b0ae9e', floor: '#6c6546', fog: '#1c1d18', light: '#e8eadc' },
  draft: { wall: '#b8b07a', ceil: '#c8c6a6', floor: '#7d7850', fog: '#1b1f1c', light: '#eef6f0' },
};
export const CHALK = 'rgba(236,250,255,0.9)';

const l0Start = {
  hw: 1.6, depth: 5, fogEnd: 13, pal: PAL.l0, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.5, 3.0, 4.3], backDoor: { x1: -0.35, x2: 0.35, top: -0.5 },
  openings: [{ side: 1, z1: 2.6, z2: 3.6, top: -0.6 }, { side: -1, z1: 3.4, z2: 4.3, top: -0.6 }], flick: hum,
};
const n1Quad = wallQuad(-1.6, -0.3, 0.1, 2.0, 2.4);
const almond0 = { p: P(0.6, 1, 2.2), z: 2.2 };

const l0Hall = {
  hw: 1, depth: 14, fogEnd: 9, pal: PAL.l0, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.4, 2.9, 4.4, 5.9, 7.4, 8.9, 10.4], flick: hum,
  openings: [{ side: -1, z1: 3.0, z2: 3.8, top: -0.6 }, { side: 1, z1: 3.6, z2: 4.5, top: -0.6 }],
};
const hallAtriumDoor = wallQuad(1, -0.6, 1, 3.6, 4.5);
const outletQuad = wallQuad(1, 0.55, 0.7, 1.9, 2.05);
// Level 0.3 per the wiki: Level 0 with ice everywhere, fed by vents that never stop blowing cold air.
const coldVent = wallQuad(1, -0.95, -0.6, 4.2, 5.4);
const frostPath = [P(0.35, 1, 4.4), P(1, 1, 4.4), P(1, 1, 9), P(0.75, 1, 9)];
const l0Loop = { ...l0Hall, openings: undefined, flickerLights: [1, 4] };

// Six expanded yellow-zone connector/buffer rooms to give Level 0 more breathing room and separate sub-level entrances
const l0Atrium = {
  hw: 2.3, depth: 6, fogEnd: 13, pal: PAL.l0, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.6, 3.4, 5.1], flickerLights: [2], flick: hum,
  backDoor: { x1: -0.38, x2: 0.38, top: -0.58 },
  openings: [{ side: -1, z1: 2.2, z2: 3.1, top: -0.6 }, { side: 1, z1: 3.4, z2: 4.3, top: -0.6 }],
};
const atriumStorageDoor = wallQuad(-2.3, -0.6, 1, 2.2, 3.1);
const atriumDraftDoor = wallQuad(2.3, -0.6, 1, 3.4, 4.3);
const atriumMottledDoor = faceQuad(-0.38, -0.58, 0.38, 1, 6);
const atriumPartition = { x1: -1.15, x2: -0.82, y1: -0.45, y2: 1, z1: 3.55, z2: 4.75, color: PAL.l0.wall, top: '#b8a556', edge: true };
const atriumChair = { x1: 0.85, x2: 1.35, y1: 0.45, y2: 1, z1: 2.2, z2: 2.65, color: '#9c9272', top: '#b4aa88', edge: true };

const l0Mottled = {
  hw: 1.25, depth: 8, fogEnd: 11, pal: PAL0.mottled, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.6, 3.6, 5.6, 7.2], flickerLights: [1], flick: hum,
  backDoor: { x1: -0.38, x2: 0.38, top: -0.56 },
};
const mottledPeelL = wallQuad(-1.25, -0.45, 0.52, 2.2, 3.3);
const mottledPeelR = wallQuad(1.25, -0.3, 0.4, 4.2, 5.2);

const l0Firedoor = {
  hw: 1, depth: 7, fogEnd: 10, pal: PAL0.firedoor, wallTex: 'concrete', tiles: true, floorTex: 'carpet',
  lights: [1.5, 3.4, 5.4], flickerLights: [0], flick: hum,
};
const firedoorPatch = wallQuad(1, -0.6, 0.7, 2.4, 4.0);

const l0Storage = {
  hw: 1.2, depth: 5.5, fogEnd: 11, pal: PAL.l0, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.7, 3.8], flick: hum,
};
const storageBoxes = [
  { x1: 0.52, x2: 1.12, y1: 0.56, y2: 1, z1: 2.0, z2: 2.65, color: '#9a7e56', top: '#b0936a', edge: true },
  { x1: 0.62, x2: 1.08, y1: 0.24, y2: 0.56, z1: 2.15, z2: 2.58, color: '#8f744f', top: '#a58962', edge: true },
  { x1: 0.48, x2: 1.1, y1: 0.62, y2: 1, z1: 3.25, z2: 3.9, color: '#8e734e', top: '#a48861', edge: true },
];

const l0Draft = {
  hw: 1, depth: 11, fogEnd: 9, pal: PAL0.draft, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.5, 3.2, 5.0, 6.8, 8.6], flickerLights: [2], flick: hum,
};
const draftThermo = wallQuad(-1, -0.18, 0.1, 2.15, 2.45);

const l0Colonnade = {
  hw: 2.2, depth: 8, fogEnd: 13, pal: PAL.l0, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.6, 3.6, 5.6, 7.2], flick: hum,
  openings: [{ side: 1, z1: 3.0, z2: 3.9, top: -0.65 }],
};
const colonnadePillars = [
  { x1: -1.15, x2: -0.8, y1: -1, y2: 1, z1: 7.0, z2: 7.35 },
  { x1: 0.8, x2: 1.15, y1: -1, y2: 1, z1: 7.0, z2: 7.35 },
  { x1: -1.15, x2: -0.8, y1: -1, y2: 1, z1: 5.6, z2: 5.95 },
  { x1: 0.8, x2: 1.15, y1: -1, y2: 1, z1: 5.6, z2: 5.95 },
  { x1: -1.15, x2: -0.8, y1: -1, y2: 1, z1: 3.6, z2: 3.95 },
  { x1: 0.8, x2: 1.15, y1: -1, y2: 1, z1: 3.6, z2: 3.95 },
  { x1: -1.15, x2: -0.8, y1: -1, y2: 1, z1: 1.9, z2: 2.25 },
].map((b) => ({ ...b, color: PAL.l0.wall }));
const colonnadeMark = faceQuad(-1.12, -0.22, -0.83, 0.14, 1.899);
const colonnadeKit = { x1: -0.78, x2: -0.44, y1: 0.78, y2: 1.0, z1: 1.95, z2: 2.30, color: '#455048', top: '#5d6c61', edge: true };
const cabinet = { x1: -1, x2: -0.55, y1: 0.25, y2: 1, z1: 2.0, z2: 2.5, color: '#7a5a33', edge: true };
const glitchWall = wallQuad(1, -1, 1, 2.2, 3.0);

const l0Pillar = {
  hw: 2.2, depth: 6, fogEnd: 12, pal: PAL.l0, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.6, 3.4, 5.2], flick: hum, openings: [{ side: -1, z1: 3.0, z2: 3.9, top: -0.6 }, { side: 1, z1: 3.0, z2: 3.9, top: -0.65 }],
};
const stairDoor = wallQuad(-2.2, -0.6, 1, 3.0, 3.9);
const pillars0 = [
  { x1: -1.1, x2: -0.75, y1: -1, y2: 1, z1: 4.2, z2: 4.55 },
  { x1: 0.75, x2: 1.1, y1: -1, y2: 1, z1: 4.2, z2: 4.55 },
  { x1: -1.1, x2: -0.75, y1: -1, y2: 1, z1: 2.4, z2: 2.75 },
  { x1: 0.75, x2: 1.1, y1: -1, y2: 1, z1: 2.4, z2: 2.75 },
].map((b) => ({ ...b, color: PAL.l0.wall }));
const n0bQuad = faceQuad(-1.06, -0.16, -0.8, 0.16, 2.399);
const hiddenDoor = faceQuad(-0.35, -0.5, 0.35, 1, 5.999);

// the low room behind the start room's left doorway
const l0Low = {
  hw: 2.4, depth: 4, fogEnd: 10, pal: PAL0.low, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.5, 3.0], flickerLights: [1], flick: hum, openings: [{ side: 1, z1: 2.8, z2: 3.6, top: -0.6 }],
};
const blackDoor = wallQuad(2.4, -0.6, 1, 2.8, 3.6);
const fallenTile = { x1: -1.1, x2: -0.3, y1: 0.95, y2: 1, z1: 2.1, z2: 2.6, color: '#d6cc96' };
const lowHole = [P(-1.1, -1, 2.1), P(-0.3, -1, 2.1), P(-0.3, -1, 2.6), P(-1.1, -1, 2.6)];
const rodA = P(0.15, 1, 1.75), rodB = P(1.5, 1, 2.6);
const n0cQuad = faceQuad(0.7, -0.25, 1.1, 0.15, 3.999);

// the soaked room off the hallway
const l0Wet = {
  hw: 1.6, depth: 6, fogEnd: 10, pal: PAL0.wet, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.6, 4.2], flickerLights: [1], flick: hum, openings: [{ side: -1, z1: 3.0, z2: 3.8, top: -0.6 }],
};
const wetTile = [P(-0.35, -1, 2.3), P(0.35, -1, 2.3), P(0.35, -1, 2.9), P(-0.35, -1, 2.9)];
const puddleC = P(0, 1, 2.6);
const n0dQuad = wallQuad(1.6, -0.25, 0.1, 3.4, 4.0);

// the cubicles beyond the pillar room: three identical exits, one right way
export const MAZE_PATH = ['right', 'ahead', 'left', 'right'];
const mazeBase = {
  hw: 1.4, depth: 5, fogEnd: 11, pal: PAL.l0, stripes: true, tiles: true, floorTex: 'carpet', flick: hum,
  backDoor: { x1: -0.4, x2: 0.4, top: -0.6 },
  openings: [{ side: -1, z1: 2.2, z2: 3.0, top: -0.6 }, { side: 1, z1: 2.2, z2: 3.0, top: -0.6 }],
};
const MAZE_ROOMS = [
  { ...mazeBase, lights: [1.6, 3.4] },
  { ...mazeBase, lights: [1.4, 2.6, 3.9], flickerLights: [2] },
  { ...mazeBase, lights: [2.0, 3.8], flickerLights: [0] },
  { ...mazeBase, lights: [1.5, 3.0, 4.2], flickerLights: [1] },
];
const mazeLeft = wallQuad(-1.4, -0.6, 1, 2.2, 3.0);
const mazeRight = wallQuad(1.4, -0.6, 1, 2.2, 3.0);
const mazeAhead = faceQuad(-0.4, -0.6, 0.4, 1, 5);
const n0eQuad = wallQuad(-1.4, -0.2, 0.15, 1.5, 1.85);

// the faded room: the oldest part of the level, where J.H. camped
const l0Faded = {
  hw: 1.8, depth: 4, fogEnd: 12, pal: PAL0.faded, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.6, 3.2], flickerLights: [1], flick: hum, openings: [{ side: 1, z1: 1.9, z2: 2.7, top: -0.6 }],
};
export const TALLY = { seen: 12, real: 23 };
const tallyArea = faceQuad(-1.5, -0.8, 0.5, -0.12, 3.999);
// Level 0.7 per the wiki: a time bubble of older Backrooms, left only by retracing your steps.
const olderDoor = wallQuad(1.8, -0.6, 1, 1.9, 2.7);
const locker = { x1: 1.1, x2: 1.75, y1: -0.65, y2: 1, z1: 3.1, z2: 3.7, color: '#6d7176', edge: true };
const mat = { x1: -1.65, x2: -0.65, y1: 0.95, y2: 1, z1: 1.9, z2: 2.9, color: '#a08660', edge: true };
const n0fQuad = wallQuad(-1.8, -0.35, 0.0, 2.2, 2.6);
const pile = [[0.55, 2.3], [0.8, 2.15], [0.68, 2.6], [1.0, 2.45], [0.4, 2.0], [1.2, 2.2]];

// Blackout Zone: no light, deep silence, ankle-deep fluid; the only guide is a hum that keeps moving.
export const BLACKOUT_STEPS = 3;
const DIRS = ['left', 'ahead', 'right'];
const DIR_ZH = { left: '左邊', ahead: '前面', right: '右邊' };
// Level 0.5 per the wiki: found as a flight of stairs down inside a blackout zone, lured by a familiar hum.
const sunkStairs = [P(0.3, 1, 1.5), P(1.1, 1, 1.5), P(1.1, 1, 1.95), P(0.3, 1, 1.95)];
const l0Blackout = {
  hw: 1.4, depth: 5, fogEnd: 6, wallTex: 'concrete', baseboard: false, tiles: true, lights: [],
  pal: { wall: '#6e6440', ceil: '#3a3420', floor: '#2a2614', fog: '#050403', light: '#fff0b8' },
  backDoor: { x1: -0.4, x2: 0.4, top: -0.6 },
  openings: [{ side: -1, z1: 2.2, z2: 3.0, top: -0.6 }, { side: 1, z1: 2.2, z2: 3.0, top: -0.6 }],
};
// Deeper Blackout Zone: substation, sparking flooded hall, duty room and the blind shaft into Manila Room.
const PAL_BO_EMER = { wall: '#4a3630', ceil: '#261816', floor: '#201814', fog: '#0b0404', light: '#ff5c4a' };
const PAL_BO_DARK = { wall: '#504b36', ceil: '#2a2618', floor: '#1f1c12', fog: '#040403', light: '#d8d0a0' };
const boRoom = (base) => (s) => ({
  ...base,
  pal: s.flags.bo_emer ? PAL_BO_EMER : PAL_BO_DARK,
  lights: s.flags.bo_emer ? base.emerLights : [],
});
const boSubDoor = wallQuad(-1.4, -0.5, 0.9, 1.45, 1.95);
const l0BoSub = boRoom({
  hw: 1.5, depth: 5.5, fogEnd: 8, wallTex: 'concrete', baseboard: false, tiles: true, emerLights: [2.2, 4.2],
  backDoor: { x1: -0.36, x2: 0.36, top: -0.55 },
});
const boPanelBox = { x1: -1.5, x2: -1.08, y1: -0.42, y2: 0.56, z1: 1.85, z2: 2.55, color: '#464a4c', top: '#5a6062', edge: true };
const boBreakerEmer = wallQuad(-1.07, -0.34, -0.02, 1.92, 2.38);
const boBreakerCut = wallQuad(-1.07, 0.16, 0.48, 1.92, 2.38);
const boLogQuad = wallQuad(1.5, -0.25, 0.15, 2.0, 2.55);
const l0BoFlood = boRoom({
  hw: 1.25, depth: 7, fogEnd: 8.5, wallTex: 'concrete', baseboard: false, tiles: true, emerLights: [2.0, 4.8],
  backDoor: { x1: -0.36, x2: 0.36, top: -0.55 },
  openings: [{ side: 1, z1: 3.1, z2: 4.1, top: -0.55 }],
});
const boArcOn = (s) => !s.flags.bo_cut && (clockOf(s) % 3.0) < 1.0;
const boLockerDoor = wallQuad(1.25, -0.55, 1, 3.1, 4.1);
const boPouch = { x1: -1.1, x2: -0.78, y1: 0.86, y2: 1, z1: 2.0, z2: 2.35, color: '#395566', top: '#4d7085', edge: true };
const l0BoLocker = boRoom({
  hw: 1.35, depth: 4.2, fogEnd: 8, wallTex: 'concrete', baseboard: false, tiles: true, emerLights: [2.0],
});
const boDesk = { x1: -0.65, x2: 0.65, y1: 0.45, y2: 1, z1: 2.5, z2: 3.2, color: '#4c4f52', top: '#606468', edge: true };
const boDeskNote = faceQuad(-0.45, 0.32, -0.05, 0.44, 2.49);
const boIntercom = wallQuad(1.35, -0.18, 0.16, 1.85, 2.3);
const l0BoPit = boRoom({
  hw: 1.7, depth: 6, fogEnd: 10, wallTex: 'concrete', baseboard: false, tiles: true, emerLights: [2.2, 4.6],
});
const boShaftQuad = [P(-0.7, -1, 2.4), P(0.7, -1, 2.4), P(0.7, -1, 3.8), P(-0.7, -1, 3.8)];
const boPitNote = wallQuad(-1.7, -0.25, 0.12, 2.0, 2.45);
const boManilaDoor = faceQuad(-0.36, -0.52, 0.36, 1, 5.99);
const pickDir = (prev) => { const o = DIRS.filter((d) => d !== prev); return pick(o); };
function blackoutStep(g, dir) {
  const b = g.s.bo || { step: 0, dir: pickDir() };
  if (dir !== b.dir) {
    g.s.bo = { step: 0, dir: pickDir(b.dir) }; g.sanity(-3);
    return g.go('l0_blackout', { msg: '你朝那個方向摸過去——腳下一沉，踩進了更深的積水。嗡嗡聲換了位置，黑暗裡的格局又變了。' });
  }
  if (b.step + 1 >= BLACKOUT_STEPS) {
    g.s.bo = null;
    return g.go('l0_manila', { msg: '你循著嗡嗡聲走，眼前忽然亮了起來——一間小小的方形房間，壁紙是米黃色的。' });
  }
  g.s.bo = { step: b.step + 1, dir: pickDir(b.dir) };
  g.go('l0_blackout', b.step === 0 ? { msg: '你的腳尖踢到一級台階。右手邊的地面往下陷，底下也有嗡嗡聲——同一個調子，只是比較悶，像隔著水。' } : {});
}

// The Manila Room: the one place in Level 0 where people can see each other.
const manilaFlick = (t) => (Math.sin(t * 0.37) > 0.985 ? 0.2 : 0.8 + 0.2 * Math.sin(t * 0.9));
const l0Manila = {
  hw: 1.3, depth: 3, fogEnd: 12, tiles: true, floorTex: 'concrete', lights: [1.7], flick: manilaFlick,
  pal: { wall: '#d8c494', ceil: '#e0d4b0', floor: '#6e5232', fog: '#2a2416', light: '#fff4d0' },
};
const jhTorso = faceQuad(-0.78, 0.18, -0.36, 0.78, 2.75);
const jhLegs = faceQuad(-0.86, 0.72, -0.16, 0.97, 2.55);
const jhHead = P(-0.57, 0.04, 2.75);
const megQuad = wallQuad(1.3, -0.3, 0.1, 1.8, 2.3);
// Manila Room furnishings, as the wiki describes them: one octagonal table, two chairs, cupboards under the table.
const TABLE_C = { x: 0.08, z: 2.1 }, TABLE_Y = 0.46;
const tableTop = Array.from({ length: 8 }, (_, i) => {
  const a = Math.PI / 8 + (i * Math.PI) / 4;
  return P(TABLE_C.x + 0.34 * Math.cos(a), TABLE_Y, TABLE_C.z + 0.26 * Math.sin(a));
});
const tableLegs = [[-0.12, 1.95], [0.28, 1.95], [-0.12, 2.25], [0.28, 2.25]];
const cupboard = { x1: -0.14, x2: 0.3, y1: 0.58, y2: 0.92, z1: 1.9, z2: 2.3, color: '#6a4626', top: '#6a4626', edge: true };
const chairR = { x1: 0.5, x2: 0.72, y1: 0.6, y2: 0.65, z1: 1.98, z2: 2.22, color: '#664222', top: '#784f2b', edge: true };
const chairRBack = { x1: 0.69, x2: 0.72, y1: 0.3, y2: 0.6, z1: 1.98, z2: 2.22, color: '#55351a', edge: true };
const chairL = { x1: -0.62, x2: -0.4, y1: 0.6, y2: 0.65, z1: 1.62, z2: 1.86, color: '#664222', top: '#784f2b', edge: true };
const chairLBack = { x1: -0.62, x2: -0.59, y1: 0.3, y2: 0.6, z1: 1.62, z2: 1.86, color: '#55351a', edge: true };
// the knife mark on the table edge; the room puts it right while nobody is looking
const carveAt = P(0.3, TABLE_Y + 0.01, 1.9);
const JH_LINES = [
  '那個人抬起頭。燈光下，他的臉很模糊，像一張沒對好焦的照片。「……這次比較晚。」',
  '「這是唯一一間看得見人的房間。」他頓了一下。「所以你看見的，不一定是人。」',
  '「地毯上的水別喝。」他從身後摸出一瓶杏仁水，推到你腳邊。',
  '「J——」他說了一個名字。嗡嗡聲正好在那一刻變大，你沒聽清楚。',
  '「帶子看過了吧。看了就會想起來。想起來……就走不了了。」他低下頭，不再說話。',
];

// Red Rooms: found at random after turning a corner; once you are properly inside, there is no way out.
const PAL_RED = { wall: '#7a2a1e', ceil: '#4a1812', floor: '#3b1a12', fog: '#140303', light: '#ff6a50' };
const l0Red = {
  hw: 1, depth: 10, fogEnd: 7, pal: PAL_RED, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.6, 3.6, 5.6, 7.6], flick: hum, openings: [{ side: 1, z1: 4.5, z2: 5.3, top: -0.6 }],
};
export const redCorner = (s) => s.loops >= 4 && s.loops % 2 === 0;
const l0LoopRed = { ...l0Loop, openings: [{ side: -1, z1: 3.2, z2: 4.0, top: -0.6 }] };
const redOpening = wallQuad(-1, -0.6, 1, 3.2, 4.0);
const peel = [[-1, -0.9, -0.2, 1.1, 1.9], [-1, 0.1, 0.8, 1.3, 2.4], [-1, -0.7, 0.5, 2.7, 3.8], [1, -0.8, 0.0, 1.2, 2.2], [1, 0.2, 0.9, 1.6, 3.0], [1, -0.6, 0.6, 3.2, 4.2]];
const shrooms = [[-0.85, 1.4], [-0.7, 1.9], [0.8, 1.6], [0.9, 2.5], [-0.9, 2.8], [0.75, 3.4]];

// Deeper into the Red Rooms. Every step further in (or back out) shortens how long you can stand anywhere
// in them: going back and forth does not reset the clock.
const l0RedHall = {
  hw: 1, depth: 8, fogEnd: 6.5, pal: PAL_RED, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.8, 4.2, 6.4], flick: hum, backDoor: { x1: -0.35, x2: 0.35, top: -0.6 },
  openings: [{ side: -1, z1: 2.8, z2: 3.5, top: -0.58 }, { side: 1, z1: 2.9, z2: 3.6, top: -0.58 }],
};
const l0RedCore = {
  hw: 1.2, depth: 5, fogEnd: 5.5, pal: { wall: '#480c07', ceil: '#280503', floor: '#1a0302', fog: '#080101', light: '#ff3020' },
  stripes: true, tiles: true, floorTex: 'carpet', lights: [1.8, 3.5], flick: hum, backDoor: { x1: -0.35, x2: 0.35, top: -0.6 },
};
const l0RedRadio = {
  hw: 1.25, depth: 4.5, fogEnd: 6, pal: { wall: '#662018', ceil: '#3d120e', floor: '#2f140e', fog: '#120303', light: '#ff5d47' },
  stripes: true, tiles: true, floorTex: 'carpet', lights: [1.8, 3.4], flick: hum,
};
const l0RedNest = {
  hw: 1.35, depth: 5, fogEnd: 6, pal: { wall: '#5c1812', ceil: '#340d0a', floor: '#280e0a', fog: '#100202', light: '#ff4b36' },
  stripes: true, tiles: true, floorTex: 'carpet', lights: [1.8, 3.6], flick: hum,
};
const redRadioDoor = wallQuad(-1, -0.58, 0.48, 2.8, 3.5);
const redNestDoor = wallQuad(1, -0.58, 0.48, 2.9, 3.6);
const redRelayCrate = { x1: -0.52, x2: 0.42, y1: 0.56, y2: 1, z1: 2.4, z2: 3.0, color: '#3b241c', top: '#4e3127', edge: true };
const redRelayBox = { x1: -0.34, x2: 0.24, y1: 0.26, y2: 0.56, z1: 2.5, z2: 2.92, color: '#2b2d30', top: '#3c4045', edge: true };
const redRadioNote = wallQuad(1.25, -0.22, 0.16, 1.9, 2.4);
const redWallCrate = { x1: -0.46, x2: 0.46, y1: 0.32, y2: 0.96, z1: 4.2, z2: 4.9, color: '#4d2b20', top: '#633728', edge: true };
const redPack = { x1: -0.65, x2: -0.25, y1: 0.76, y2: 1, z1: 2.1, z2: 2.5, color: '#3d3024', top: '#4f3f30', edge: true };
const redCystQuad = faceQuad(-0.7, -0.4, 0.7, 0.8, 4.99);
const hallShroom = [0.82, 2.6];
// Seconds you can stand in a Red Rooms scene before it keeps you: 9 at the entrance, two fewer for every
// step taken further in or back out, never less than 3.
export const redTime = (s) => Math.max(3, 9 - 2 * (s.flags.red_x || 0));
const redTrap = { after: redTime, end: 'red' };
const redStep = (g) => g.flag('red_x', (g.s.flags.red_x || 0) + 1);
const redHazard = (s) => `紅光正在收緊：此處最多停留 ${redTime(s)} 秒`;

// The Torment: per the wiki, a grey region that showed itself in Level 0 for a few hours and then vanished.
// Wanderers could only reach its edge; there is no known way in and no exit. Whatever touches it greys and
// turns to ash. Here it shows on odd loops from the fifth, for three of them, at the far end of the right wall.
export const tormentCorner = (s) => s.loops >= 5 && s.loops % 2 === 1
  && (s.flags.torment_from === undefined || s.loops <= s.flags.torment_from + 4);
const TORMENT_Z = [3.6, 4.4];
const l0LoopTorment = { ...l0Loop, openings: [{ side: 1, z1: TORMENT_Z[0], z2: TORMENT_Z[1], top: -0.6 }] };
const tormentOpening = wallQuad(1, -0.6, 1, TORMENT_Z[0], TORMENT_Z[1]);
// the yellow hallway, already losing its colour
const l0Torment = {
  hw: 1.1, depth: 8, fogEnd: 5, tiles: true, floorTex: 'carpet', lights: [], flick: hum,
  pal: { wall: '#a69f80', ceil: '#9c9682', floor: '#5f5a48', fog: '#8a8a8a', light: '#f0eee6' },
};
const EDGE_Z = 3.2; // where the carpet stops being carpet
const greyFloor = [P(-1.1, 1, EDGE_Z), P(1.1, 1, EDGE_Z), P(1.1, 1, 7.99), P(-1.1, 1, 7.99)];
const tormentLeaves = [[-0.5, 2.7], [0.35, 2.9], [-0.15, 2.45], [0.6, 2.6], [0.05, 3.0], [-0.75, 2.95], [0.2, 2.25]];
const evpBox = { x1: -0.55, x2: -0.2, y1: 0.86, y2: 1, z1: 2.95, z2: 3.25, color: '#2c2e30', top: '#3a3d40', edge: true };
const fogRect = [300, 140, 360, 170];
const torEdgePath = wallQuad(-1.1, -0.58, 0.35, 1.5, 2.35);
const torHazard = '灰霧正在侵蝕視線——別踏進濃霧深處';
const l0TorRing = {
  hw: 1.5, depth: 8, fogEnd: 5.5, floorTex: 'carpet', baseboard: false, lights: [],
  pal: { wall: '#8f8b7a', ceil: '#86847c', floor: '#525049', fog: '#7e7e7e', light: '#e8e8e4' },
};
const l0TorTree = {
  hw: 1.6, depth: 8, fogEnd: 5.5, floorTex: 'carpet', baseboard: false, lights: [],
  pal: { wall: '#82807a', ceil: '#7a7a78', floor: '#4a4946', fog: '#757575', light: '#e4e4e2' },
};
const l0TorStatue = {
  hw: 1.7, depth: 8.5, fogEnd: 5.2, floorTex: 'carpet', baseboard: false, lights: [],
  pal: { wall: '#787878', ceil: '#707070', floor: '#444444', fog: '#6e6e6e', light: '#e0e0e0' },
};
const torGraveQuad = faceQuad(-0.95, 0.05, -0.35, 0.98, 3.6);
const torKettle = { x1: 0.45, x2: 0.78, y1: 0.72, y2: 1, z1: 2.4, z2: 2.75, color: '#646666', top: '#7d8080', edge: true };
const torMegBoard = wallQuad(-1.6, -0.32, 0.25, 2.1, 2.9);
const torLeafBottle = { p: P(0.65, 1, 2.5), z: 2.5 };
const torStatueRect = [380, 130, 200, 200];
const torPlaqueRect = [395, 345, 170, 56];

// Stairs: a stairwell off the pillar room. Up to the arches, down to the holes.
const l0Stairs = {
  hw: 1.5, depth: 6, fogEnd: 11, pal: PAL.l0, stripes: true, tiles: true, floorTex: 'carpet', lights: [1.6], flick: hum,
};
const STEP_H = 0.2;
const stairsUp = Array.from({ length: 9 }, (_, i) => ({
  x1: -0.95, x2: 0.15, y1: 1 - (i + 1) * STEP_H, y2: 1, z1: 2.6 + i * 0.32, z2: 2.92 + i * 0.32, color: '#b6a256', edge: true,
})).reverse();
const stairsDown = [P(0.55, 1, 1.9), P(1.45, 1, 1.9), P(1.45, 1, 3.4), P(0.55, 1, 3.4)];
const railTop = [P(0.5, 0.35, 1.9), P(0.5, 0.35, 3.4)];

// Arches: pale walls with archways, deep wet carpet. The steadiest rooms in the level, so a place to rest.
const l0Arches = {
  hw: 1.8, depth: 6, fogEnd: 12, tiles: true, floorTex: 'carpet', lights: [1.8, 4.0], flick: hum,
  pal: { wall: '#ddd3a8', ceil: '#e2dabb', floor: '#7d7046', fog: '#24200f', light: '#fff8de' },
};
export const REST_EVERY = 8;
// archway outline on a side wall (x fixed), centred at depth zc: posts from the floor, round top
function wallArch(x, zc, half, top) {
  const pts = [P(x, 1, zc - half)];
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI - (Math.PI * i) / 12;
    pts.push(P(x, top - Math.sin(a) * half * 0.9, zc + Math.cos(a) * half));
  }
  pts.push(P(x, 1, zc + half));
  return pts;
}
function faceArch(xc, half, top, z) {
  const pts = [P(xc - half, 1, z)];
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI - (Math.PI * i) / 12;
    pts.push(P(xc + Math.cos(a) * half, top - Math.sin(a) * half, z));
  }
  pts.push(P(xc + half, 1, z));
  return pts;
}
const archesL = [wallArch(-1.8, 2.6, 0.45, -0.2), wallArch(-1.8, 4.4, 0.45, -0.2)];
const archesR = [wallArch(1.8, 2.6, 0.45, -0.2), wallArch(1.8, 4.4, 0.45, -0.2)];
const archBack = faceArch(0, 0.5, -0.1, 5.999);
// Deeper Arches Wing: endless cloister, reflective shallow pool, catalog antechamber & film vault.
const l0ArchCloister = {
  hw: 1.8, depth: 7, fogEnd: 13, tiles: true, floorTex: 'carpet', lights: [1.8, 4.2, 6.2], flick: hum,
  pal: { wall: '#e2dac0', ceil: '#e8e2cc', floor: '#7d734f', fog: '#252113', light: '#fff9e4' },
};
const archSketchQuad = faceQuad(-1.45, -0.35, -1.05, 0.05, 5.2);
const l0ArchPool = {
  hw: 1.9, depth: 6.5, fogEnd: 13, tiles: true, floorTex: 'concrete', lights: [2.0, 4.6], flick: hum,
  pal: { wall: '#d6d4be', ceil: '#e2e0cc', floor: '#5c6662', fog: '#1c2220', light: '#f4fff8' },
};
const archPoolC = P(0, 1, 3.1);
const archRack = { x1: 1.05, x2: 1.72, y1: 0.42, y2: 1, z1: 2.3, z2: 2.9, color: '#786852', top: '#8f7d64', edge: true };
const archPoolNote = wallQuad(-1.9, -0.25, 0.15, 2.1, 2.65);
const l0ArchCatalog = {
  hw: 1.5, depth: 5.5, fogEnd: 12, tiles: true, floorTex: 'carpet', lights: [1.9, 4.1], flick: hum,
  pal: { wall: '#cfc59e', ceil: '#dcd4b4', floor: '#706342', fog: '#1e1a0c', light: '#fff4d4' },
};
const catCabinet = { x1: -1.5, x2: -0.92, y1: -0.25, y2: 1, z1: 2.1, z2: 3.3, color: '#755c3c', top: '#8c6f4b', edge: true };
const catWindow = wallQuad(1.5, -0.4, 0.2, 2.2, 3.4);
const archiveVaultGate = wallQuad(1.05, -0.42, 0.85, 4.1, 5.1);
const l0ArchVault = {
  hw: 1.4, depth: 6, fogEnd: 11, tiles: true, floorTex: 'concrete', lights: [1.9, 4.3], flick: hum,
  pal: { wall: '#9a9a8c', ceil: '#b2b2a4', floor: '#50524c', fog: '#141512', light: '#e8f0e4' },
};
const vaultDesk = { x1: -0.62, x2: 0.62, y1: 0.48, y2: 1, z1: 3.1, z2: 3.8, color: '#4d5052', top: '#626668', edge: true };
const vaultRewinder = { x1: -0.26, x2: 0.26, y1: 0.28, y2: 0.48, z1: 3.25, z2: 3.65, color: '#26292c', top: '#383c40', edge: true };

// Holes (The Pitfalls): cavernous grid of vertical concrete shafts, suspended cable winch,
// deep shaft alcove, uncanny green-lit fake suburban street at the bottom, and twin steel beams.
export const HOLE_ROWS = 3;
export const LANES = ['left', 'mid', 'right'];
const LANE_X = { left: [-1.35, -0.45], mid: [-0.45, 0.45], right: [0.45, 1.35] };
const LANE_ZH = { left: '左前方', mid: '正前方', right: '右前方' };
const holesFlick = (t) => (Math.sin(t * 1.7) + Math.sin(t * 4.1 + 1) > 1.25 ? 0.22 : 0.95);
const l0Holes = {
  hw: 1.8, depth: 7, fogEnd: 4.5, pal: { ...PAL.l0, fog: '#060502' }, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.5, 4.2], flickerLights: [0], flick: holesFlick,
};
const laneTile = (lane, z1 = 1.7, z2 = 2.5) => {
  const [a, b] = LANE_X[lane];
  return [P(a + 0.06, 1, z1), P(b - 0.06, 1, z1), P(b - 0.06, 1, z2), P(a + 0.06, 1, z2)];
};
export function newHoleRow() {
  const pits = LANES.map(() => rand() < 0.6);
  if (pits.every(Boolean)) pits[Math.floor(rand() * 3)] = false;
  if (!pits.some(Boolean)) pits[Math.floor(rand() * 3)] = true;
  return pits;
}
function drawPitShaft(ctx, lane, z1, z2, R) {
  const [a, b] = LANE_X[lane];
  const x1 = a + 0.06, x2 = b - 0.06;
  const tl = P(x1, 1, z2), tr = P(x2, 1, z2), br = P(x2, 1, z1), bl = P(x1, 1, z1);
  // Deep pitch-black opening
  poly(ctx, [bl, br, tr, tl], '#020201');
  // Recessed back & side shaft concrete inner walls plunging downward inside the opening
  const drop = Math.min(72, Math.max(16, (bl[1] - tl[1]) * 0.72));
  ctx.save();
  poly(ctx, [bl, br, tr, tl]); ctx.clip();
  const gr = ctx.createLinearGradient(0, tl[1], 0, tl[1] + drop);
  gr.addColorStop(0, shade(R, '#6b5e30', z2));
  gr.addColorStop(0.55, shade(R, '#282312', z2));
  gr.addColorStop(1, '#020201');
  poly(ctx, [tl, tr, [tr[0], tr[1] + drop], [tl[0], tl[1] + drop]], gr);
  // Side wall shading inside pit
  poly(ctx, [tl, [tl[0], tl[1] + drop], bl], 'rgba(55,48,22,0.55)');
  poly(ctx, [tr, [tr[0], tr[1] + drop], br], 'rgba(35,30,14,0.65)');
  // Faint horizontal concrete seam inside the shaft
  seg(ctx, [tl[0], tl[1] + drop * 0.45], [tr[0], tr[1] + drop * 0.45], 'rgba(120,104,56,0.35)', 1.2);
  ctx.restore();
  // Caution rim bevel around the pit mouth
  ctx.strokeStyle = shade(R, '#8c7834', z1); ctx.lineWidth = 2; poly(ctx, [bl, br, tr, tl]); ctx.stroke();
}
function drawPitUpdraft(ctx, t, n = 14) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const p = (t * (0.25 + (i % 4) * 0.07) + i * 0.19) % 1;
    const x = 140 + ((i * 83) % 680) + Math.sin(t * 1.4 + i) * 16;
    const y = 470 - p * 310;
    ctx.fillStyle = `rgba(215,210,175,${p * (1 - p) * 0.9})`;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.restore();
}
// decorative far pits, fixed so the grid reads as a grid
const farPits = [['left', 3.0, 3.6], ['right', 3.0, 3.6], ['mid', 4.0, 4.6], ['left', 5.0, 5.6], ['right', 5.0, 5.6]];
const ledge = { x1: -1.2, x2: 1.2, y1: 0.97, y2: 1, z1: 1.6, z2: 3.2, color: '#9a8746' };
const bag = { x1: -0.25, x2: 0.3, y1: 0.7, y2: 1, z1: 2.5, z2: 2.85, color: '#4f5a3e', edge: true };
const peekPitRect = [795, 225, 130, 115];
// Deeper Pitfalls Wing: ledge + winch, vertical shaft alcove, uncanny fake-street bottom, twin beams & island.
const holeCatwalkDoor = wallQuad(-1.8, -0.52, 0.85, 2.3, 3.5);
const l0HoleLedge = {
  hw: 1.8, depth: 7, fogEnd: 5.8, pal: { ...PAL.l0, fog: '#050402' }, stripes: true, tiles: true, floorTex: 'concrete',
  lights: [1.8, 4.4], flick: holesFlick,
};
const ropePost = { x1: -1.65, x2: -1.35, y1: 0.35, y2: 1, z1: 2.2, z2: 2.55, color: '#6b5e3e', top: '#80714c', edge: true };
const holeCone = { x1: -1.52, x2: -1.18, y1: 0.68, y2: 1, z1: 3.4, z2: 3.75, color: '#d47c24', top: '#f0b840', edge: true };
const holeWinch = wallQuad(1.8, -0.36, 0.42, 2.15, 3.05);
const holeDescendRect = [635, 348, 175, 108];
const l0HoleShaft = {
  hw: 1.5, depth: 5.5, fogEnd: 8.5, floorTex: 'concrete', baseboard: false, lights: [2.2], flickerLights: [0], flick: holesFlick,
  pal: { wall: '#4a483c', ceil: '#1c1b15', floor: '#282620', fog: '#060605', light: '#ff7c5c' },
};
const shaftIntercom = wallQuad(-1.5, -0.25, 0.25, 2.2, 3.1);
const shaftHatch = faceQuad(-0.5, 0.06, 0.5, 0.96, 5.49);
const shaftUpRect = [350, 26, 260, 118];
const l0HolePitroom = {
  hw: 1.9, depth: 8.5, fogEnd: 11, floorTex: 'concrete', baseboard: false, lights: [],
  pal: { wall: '#28403c', ceil: '#0c1615', floor: '#222e2b', fog: '#060d0c', light: '#96ebd0' },
};
const pitHouseDoor = wallQuad(-1.9, -0.42, 0.96, 2.15, 3.35);
const pitPorchBox = { x1: -1.42, x2: -0.92, y1: 0.52, y2: 1, z1: 4.1, z2: 4.75, color: '#2b544c', top: '#3c6e64', edge: true };
const pitLampRect = [615, 130, 108, 220];
const pitGrate = wallQuad(1.9, 0.16, 0.96, 2.0, 2.85);
const l0HoleBridge = {
  hw: 1.8, depth: 7, fogEnd: 6.2, pal: { ...PAL.l0, fog: '#040302' }, stripes: true, tiles: true, floorTex: 'concrete',
  lights: [1.8, 4.6], flick: holesFlick,
};
const beamLeft = [P(-0.85, 1, 1.4), P(-0.35, 1, 1.4), P(-0.35, 1, 6.2), P(-0.85, 1, 6.2)];
const beamRight = [P(0.35, 1, 1.4), P(0.85, 1, 1.4), P(0.85, 1, 6.2), P(0.35, 1, 6.2)];
const bridgeAbyssRect = [415, 220, 130, 82];
const l0HoleNest = {
  hw: 1.6, depth: 6, fogEnd: 9, pal: { ...PAL.l0, fog: '#0b0904' }, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.8, 3.8], flick: hum,
};
const holeTinBox = { x1: -0.75, x2: -0.2, y1: 0.72, y2: 1, z1: 2.3, z2: 2.8, color: '#586468', top: '#707e84', edge: true };
const holeLadderUp = wallQuad(1.6, -0.82, 0.96, 2.2, 3.1);
const holeMapQuad = wallQuad(-1.6, -0.44, 0.24, 2.1, 3.2);
const holeSwitchQuad = faceQuad(-0.3, -0.38, 0.3, 0.12, 5.99);

let pitEchoT = 8;
let pitStalkT = 0;

function holeStep(g, lane, bridged = false) {
  const h = g.s.holes;
  if (h.pits[LANES.indexOf(lane)] && !bridged) return g.end('fall');
  if (h.row + 1 >= HOLE_ROWS) {
    g.s.holes = { row: HOLE_ROWS, pits: [false, false, false] };
    return g.go('l0_holes', { msg: '你跨過最後一排坑洞，腳下終於是完整的地板。牆邊靠著一個帆布背包。' });
  }
  g.s.holes = { row: h.row + 1, pits: newHoleRow() };
  g.go('l0_holes', { msg: `你屏住呼吸跨了過去。燈光照得到的下一排地板上，${holeText(g.s.holes.pits)}` });
}
const holeText = (pits) => {
  const open = LANES.filter((l, i) => pits[i]).map((l) => LANE_ZH[l]);
  return `${open.join('、')}是坑洞。`;
};
const holesHazard = (s) => (s.holes && s.holes.row < HOLE_ROWS
  ? `陷坑陣・第 ${s.holes.row + 1} / ${HOLE_ROWS} 排・燈閃熄時腳下會全黑`
  : null);
const pitroomHazard = (s) => {
  const d = s.flags.pit_dist ?? 3;
  if (d <= 1) return '坑底偽街・那個細長黑影離你只有幾步遠——快撤回坑壁！';
  if (d === 2) return '坑底偽街・街尾的黑影正朝你走近，嘴裡重複著「有人嗎」';
  return '坑底偽街・遠方路燈下似乎站著一個不尋常的細長人影';
};

function drawGlitchWall(ctx, R, t) {
  const on = Math.sin(t * 17) + Math.sin(t * 5.3) > -0.4;
  ctx.save();
  poly(ctx, glitchWall); ctx.clip();
  ctx.fillStyle = on ? 'rgba(255,250,220,0.18)' : 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 14; i++) {
    const y = 140 + ((i * 37 + t * 260) % 260);
    ctx.fillStyle = i % 2 ? 'rgba(90,255,255,0.10)' : 'rgba(255,60,90,0.10)';
    ctx.fillRect(630, y, 80, 2 + (i % 3) * 2);
  }
  ctx.restore();
  ctx.strokeStyle = on ? 'rgba(255,255,230,0.5)' : 'rgba(255,255,230,0.15)';
  ctx.lineWidth = 1.5;
  poly(ctx, glitchWall); ctx.stroke();
}

// A chalk arrow lying on the floor (y = 1), from world (x1, z1) to (x2, z2).
function floorArrow(ctx, x1, z1, x2, z2) {
  const a = P(x1, 1, z1), b = P(x2, 1, z2);
  const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz);
  const ux = dx / len, uz = dz / len;
  const h = 0.28;
  const l = P(x2 - ux * h - uz * h * 0.7, 1, z2 - uz * h + ux * h * 0.7);
  const r = P(x2 - ux * h + uz * h * 0.7, 1, z2 - uz * h - ux * h * 0.7);
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(200,255,220,0.8)'; ctx.shadowBlur = 8;
  seg(ctx, a, b, CHALK, 5);
  ctx.beginPath(); ctx.moveTo(l[0], l[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(r[0], r[1]); ctx.stroke();
  ctx.restore();
}

// Tally marks written as 正 characters (five strokes each) on the wall facing the viewer at depth z.
const ZHENG = [[0.1, 0.08, 0.9, 0.08], [0.5, 0.08, 0.5, 0.92], [0.5, 0.5, 0.82, 0.5], [0.24, 0.55, 0.24, 0.92], [0.04, 0.92, 0.96, 0.92]];
function drawTally(ctx, R, n, x0, y0, z, cell, color) {
  ctx.save(); ctx.lineCap = 'round';
  for (let k = 0; k < n; k++) {
    const gx = x0 + Math.floor(k / 5) * cell, [u1, v1, u2, v2] = ZHENG[k % 5];
    const w = cell * 0.8, h = cell * 0.95;
    seg(ctx, P(gx + u1 * w, y0 + v1 * h, z), P(gx + u2 * w, y0 + v2 * h, z), color, 3);
  }
  ctx.restore();
}

function mazeStep(g, dir) {
  const n = g.s.maze || 0;
  if (dir !== MAZE_PATH[n]) {
    g.s.maze = 0; g.sanity(-2);
    return g.go('l0_maze', { msg: '你走了進去——眼前又是第一間隔間。牆上的污漬、地上的紙條，都和剛才一模一樣。周邊轉移把你送回了原點。' });
  }
  if (n + 1 >= MAZE_PATH.length) {
    g.flag('maze_done'); g.s.maze = 0;
    return g.go('l0_faded', { msg: '你穿過最後一個門洞。空氣忽然變得乾燥，壁紙的顏色……淡了很多。' });
  }
  g.s.maze = n + 1;
  g.go('l0_maze', { msg: `又一間隔間，和剛才那間幾乎一樣，只有燈的位置不太一樣。${g.s.view ? '地上有一個新的粉筆箭頭。' : ''}` });
}

// ---------- LEVEL 0.2 "Remodeled Mess" ----------
// Reached from Level 0 where the hum quiets and the carpet dries out. Someone has remodelled these rooms,
// but the walls give way once you touch anything, revealing a half-built wooden house.
const l0Dry = {
  hw: 1.2, depth: 9, fogEnd: 11, stripes: true, tiles: true, floorTex: 'carpet', lights: [1.6, 3.6, 5.6, 7.6],
  pal: { wall: '#d4c272', ceil: '#ddd4a4', floor: '#a08e4e', fog: '#262010', light: '#fff6d4' },
  backDoor: { x1: -0.4, x2: 0.4, top: -0.55 },
};
const sheeting = wallQuad(-1.2, -1, 0.9, 1.4, 3.2);
const buckets = [
  { x1: 0.75, x2: 1.05, y1: 0.7, y2: 1, z1: 2.0, z2: 2.3, color: '#e8e4dc', edge: true },
  { x1: 0.55, x2: 0.8, y1: 0.76, y2: 1, z1: 2.5, z2: 2.75, color: '#dcd6c8', edge: true },
];
const dryDoor = faceQuad(-0.32, -0.5, 0.32, 1, 8.999);
const wetDryDoor = wallQuad(-1.6, -0.6, 1, 3.0, 3.8);
const c1Box = { x1: -1.02, x2: -0.48, y1: 0.54, y2: 1, z1: 2.35, z2: 2.95, color: '#9c7d54', top: '#b09166', edge: true };
const c1BoxNote = wallQuad(-1.19, 0.2, 0.48, 2.4, 2.7);

// a tape lying just inside the Red Rooms: worth the seconds it costs?
const tape4Box = { x1: -0.6, x2: -0.35, y1: 0.93, y2: 1, z1: 1.8, z2: 2.0, color: '#1e1e20', edge: true };
export const EXTRA_TAPES = ['tape2', 'tape3', 'tape4'];
export const allTapesWatched = (s) => EXTRA_TAPES.every((id) => s.flags[`watched_${id}`]);

function drawCaution(ctx, quad) {
  const b = bounds(quad);
  ctx.save(); poly(ctx, quad); ctx.clip();
  for (let x = b[0] - b[3]; x < b[0] + b[2]; x += 12) {
    ctx.fillStyle = '#e8c21e'; ctx.beginPath();
    ctx.moveTo(x, b[1] + b[3]); ctx.lineTo(x + 6, b[1] + b[3]); ctx.lineTo(x + 6 + b[3], b[1]); ctx.lineTo(x + b[3], b[1]); ctx.fill();
  }
  ctx.restore();
}
function cassette(ctx, R, b) {
  box(ctx, R, b);
  const c = P((b.x1 + b.x2) / 2, b.y1, (b.z1 + b.z2) / 2);
  ctx.fillStyle = shade(R, '#e9e1c1', b.z1); ctx.fillRect(c[0] - 6, c[1] - 2, 12, 3);
}

// ---------- above the ceiling tiles ----------
// "Whatever is up here isn't rearranged." A crawlspace linking the low room, the wet room and the faded room.
const PAL_CEIL = { wall: '#3a3424', ceil: '#1c1810', floor: '#5a5030', fog: '#050402', light: '#ffe9a8' };
const l0Ceil = { hw: 2.0, depth: 7, fogEnd: 6, pal: PAL_CEIL, baseboard: false, wallTex: 'concrete', lights: [] };
const ceilStash = { x1: -1.6, x2: -1.1, y1: 0.8, y2: 1, z1: 2.4, z2: 2.8, color: '#c8c4b0', edge: true };
const ceilHoleDown = [P(-0.45, 1, 1.35), P(0.45, 1, 1.35), P(0.45, 1, 1.9), P(-0.45, 1, 1.9)];
const wetFromAbove = [P(-1.5, 1, 2.2), P(-0.7, 1, 2.2), P(-0.7, 1, 2.9), P(-1.5, 1, 2.9)];
const grille = [P(0.6, 1, 2.6), P(1.4, 1, 2.6), P(1.4, 1, 3.4), P(0.6, 1, 3.4)];
const duct = { x1: -2.0, x2: -1.3, y1: -0.7, y2: -0.1, z1: 3.6, z2: 5.2, color: '#7a7a72', edge: true };
const ductMouth = faceQuad(-1.95, -0.65, -1.35, -0.15, 3.599);
const camAbove = P(-1.1, 0.96, 2.55);
// Deeper Ceiling Crawlspace: hot pipeway, overlook gap & J.H.'s high beam cache.
const ceilHatch = wallQuad(2.0, -0.25, 0.32, 2.1, 2.95);
const ceilGap = [P(-0.7, 1, 2.1), P(0.7, 1, 2.1), P(0.7, 1, 3.1), P(-0.7, 1, 3.1)];
const ceilPeekNote = wallQuad(-2.0, -0.18, 0.2, 2.1, 2.7);
const ceilJhBox = { x1: -0.55, x2: 0.2, y1: 0.65, y2: 1, z1: 2.4, z2: 2.95, color: '#6b6c62', top: '#84867a', edge: true };
const ceilDropPillar = [P(0.65, 1, 2.3), P(1.55, 1, 2.3), P(1.55, 1, 3.2), P(0.65, 1, 3.2)];
const ceilJhNote = wallQuad(-2.0, -0.24, 0.16, 2.3, 2.85);
// light leaking up through the seams between the tiles below
function tileSeams(ctx, R, skip = []) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,225,140,0.35)'; ctx.lineWidth = 1.5;
  for (let z = 1.3; z < R.depth; z += 0.55) seg(ctx, P(-R.hw, 1, z), P(R.hw, 1, z), ctx.strokeStyle, Math.max(0.6, 3 / z));
  for (let x = -R.hw; x <= R.hw; x += 0.6) seg(ctx, P(x, 1, 1), P(x, 1, R.depth), ctx.strokeStyle, 1);
  ctx.restore();
  void skip;
}
function glowQuad(ctx, q, a = 0.85) {
  ctx.save(); ctx.shadowColor = 'rgba(255,230,150,0.9)'; ctx.shadowBlur = 30;
  poly(ctx, q, `rgba(240,220,150,${a})`); ctx.restore();
}

// ---------- the archive behind the arches ----------
const l0Archive = {
  hw: 1.6, depth: 7, fogEnd: 11, tiles: true, floorTex: 'carpet', lights: [2.0, 4.6], flickerLights: [1], flick: hum,
  pal: { wall: '#b8aa78', ceil: '#cfc6a0', floor: '#6c6040', fog: '#1a1709', light: '#fff2cc' },
};
const cabinetsL = [1.6, 2.7, 3.8, 4.9].map((z) => ({ x1: -1.6, x2: -1.05, y1: -0.45, y2: 1, z1: z, z2: z + 0.9, color: '#7d7f78', edge: true }));
const cabinetsR = [1.6, 2.7, 3.8, 4.9].map((z) => ({ x1: 1.05, x2: 1.6, y1: -0.45, y2: 1, z1: z, z2: z + 0.9, color: '#7d7f78', edge: true }));
const archDesk = { x1: -0.7, x2: 0.7, y1: 0.4, y2: 1, z1: 5.9, z2: 6.5, color: '#5d4a36', edge: true };
const chalkAt = P(-0.35, 0.39, 5.95);
const cardQuad = faceQuad(0.15, 0.3, 0.45, 0.39, 5.899);
const drawer0120 = wallQuad(1.05, 0.1, 0.35, 1.7, 2.4);
const archDoor = archesR[1];
const wormQuad = faceQuad(-0.55, -0.88, 0.55, -0.05, 6.95);
const n04WarnQuad = faceQuad(-0.98, -0.45, -0.64, -0.1, 6.94);


export const LEVEL0_SCENES = {
  l0_start: {
    level: 0, title: '某個黃色的房間', room: l0Start,
    viewMsg: '觀景窗裡，地毯上浮出一個肉眼看不見的粉筆箭頭，指向那間有柱子的房間。旁邊寫著：J.H.',
    enter(g, { first }) {
      if (first) g.say('嗡——。日光燈的嗡嗡聲，潮濕地毯的霉味。你不記得自己是怎麼來到這裡的。');
    },
    draw(ctx, t, s, R) {
      paper(ctx, R, n1Quad, 2.2);
      if (!s.flags.l0_almond) bottle(ctx, R, almond0.p[0], almond0.p[1], 40, almond0.z);
    },
    drawView(ctx) {
      floorArrow(ctx, -0.5, 1.35, 1.25, 1.95);
      const c = P(-0.75, 1, 1.6);
      ctx.save(); ctx.fillStyle = CHALK; ctx.font = 'italic 600 22px ui-monospace, monospace';
      ctx.fillText('J.H.', c[0] - 30, c[1] + 10); ctx.restore();
    },
    hotspots: [
      FORWARD('l0_hall', '往前走', bounds(faceQuad(-0.35, -0.5, 0.35, 1, 5), 12)),
      { id: 'side', rect: bounds(wallQuad(1.6, -0.6, 1, 2.6, 3.6), 4), label: '旁邊的房間', cursor: 'go', click: (g) => g.go('l0_pillar') },
      { id: 'lowroom', rect: bounds(wallQuad(-1.6, -0.6, 1, 3.4, 4.3), 4), label: '左邊的門洞', cursor: 'go', click: (g) => g.go('l0_low') },
      {
        id: 'note', rect: bounds(n1Quad, 8), label: '牆上的紙條', cursor: 'look',
        click: (g) => g.read('n1', () => { if (!g.s.flags.n1_seen) { g.flag('n1_seen'); g.say('字跡……莫名地眼熟。'); } }),
        use: {
          chalk: (g) => {
            if (g.s.flags.wrote_start) return g.say('你已經寫過了。再寫一次，好像會有什麼東西被確定下來。');
            g.flag('wrote_start');
            g.say('你在紙條旁邊的牆上寫下兩個字：「別慌」。寫完你才發現，紙條上的那兩個字，筆順和你的一模一樣。');
          },
        },
      },
      {
        id: 'almond', when: (s) => !s.flags.l0_almond, rect: [almond0.p[0] - 20, almond0.p[1] - 50, 40, 58], label: '一個瓶子', cursor: 'take',
        click: (g) => { g.flag('l0_almond'); g.give('almond_wet', '一瓶杏仁水泡在濕地毯裡，瓶蓋是鬆的。你把它收了起來。'); },
      },
    ],
  },

  l0_low: {
    level: 0, title: '低矮的房間', room: l0Low,
    viewMsg: '觀景窗裡，對面的牆上畫著一個往上指的粉筆箭頭。',
    enter(g, { first }) {
      if (first) g.say('天花板低得像要壓下來，嗡嗡聲比哪裡都大。地上躺著一塊掉下來的天花板板。右邊的門洞後面一片漆黑。');
    },
    draw(ctx, t, s, R) {
      drawDzEntryVent(ctx, R, t);
      poly(ctx, blackDoor, 'rgba(4,3,1,0.92)');
      poly(ctx, lowHole, '#0b0904');
      ctx.strokeStyle = shade(R, '#6b6034', 2.3); ctx.lineWidth = 1.5; poly(ctx, lowHole); ctx.stroke();
      box(ctx, R, fallenTile);
      paper(ctx, R, n0cQuad, 4, '#efe8cc');
      if (!s.flags.rod) {
        ctx.save(); ctx.lineCap = 'round';
        seg(ctx, rodA, rodB, shade(R, '#8d8f91', 2.1), 6);
        seg(ctx, rodA, rodB, 'rgba(255,255,255,0.25)', 2);
        ctx.restore();
      }
    },
    drawView(ctx) {
      const a = P(-0.4, 0.3, 3.999), b = P(-0.4, -0.7, 3.999);
      ctx.save(); ctx.lineCap = 'round'; ctx.shadowColor = 'rgba(200,255,220,0.8)'; ctx.shadowBlur = 8;
      seg(ctx, a, b, CHALK, 4);
      ctx.beginPath(); ctx.moveTo(b[0] - 14, b[1] + 14); ctx.lineTo(b[0], b[1]); ctx.lineTo(b[0] + 14, b[1] + 14); ctx.stroke();
      ctx.restore();
    },
    hotspots: [
      BACK('l0_start'),
      {
        id: 'rod', when: (s) => !s.flags.rod, rect: bounds([rodA, rodB], 14), label: '金屬桿', cursor: 'take',
        click: (g) => { g.flag('rod'); g.give('rod', '一根金屬吊桿，跟著天花板板一起掉下來的。差不多有一個人高。'); },
      },
      { id: 'blackout', rect: bounds(blackDoor, 4), label: '漆黑的門洞', cursor: 'go', click: (g) => { g.s.bo = { step: 0, dir: pickDir() }; g.go('l0_blackout'); } },
      { id: 'dz_vent', rect: bounds(dzEntryVent, 6), label: '左牆冒著焦煙的小通風口', cursor: 'go', click: (g) => g.go('dz_vent') },
      {
        id: 'hole', rect: bounds(lowHole, 10), label: '天花板上的洞', cursor: 'look',
        click: (g) => g.say('天花板上破了一個洞，上面一片漆黑，聽不到嗡嗡聲。太高了，跳不上去。'),
        use: { ladder: (g) => g.go('l0_ceiling', { msg: '你把梯子架在洞口下面，爬了上去。' }) },
      },
      { id: 'note', rect: bounds(n0cQuad, 8), label: '牆角的紙條', cursor: 'look', click: (g) => g.read('n0c') },
    ],
  },

  l0_hall: {
    level: 0, title: '走廊', room: l0Hall,
    viewMsg: '觀景窗裡，插座旁邊刻著四個小小的數字：0120。',
    enter(g, { first }) { if (first) g.say('一條長長的走廊。盡頭消失在昏黃的霧裡。左右兩側各有一個門洞。'); },
    draw(ctx, t, s, R) {
      drawDullWallEntrance(ctx, R, t);
      poly(ctx, squeezeGap, '#060504');
      if (s.flags.outlet_open) {
        poly(ctx, outletQuad, '#0c0a05');
      } else {
        poly(ctx, outletQuad, shade(R, '#eeeadc', 1.95));
        const c = P(1, 0.62, 1.97);
        ctx.fillStyle = shade(R, '#222', 2); ctx.fillRect(c[0] - 3, c[1] - 6, 2, 5); ctx.fillRect(c[0] - 3, c[1] + 2, 2, 5);
      }
    },
    drawOver(ctx, t) {
      // a dark figure that is sometimes standing at the far end of the hall
      const a = Math.max(0, Math.min(0.7, (Math.sin(t * 0.45) - 0.6) * 3));
      if (a <= 0) return;
      const f = P(0.15, 1, 8.5), top = P(0.15, -0.55, 8.5), w = 0.16 * 480 / 8.5;
      ctx.fillStyle = `rgba(12,10,4,${a})`;
      ctx.fillRect(f[0] - w / 2, top[1] + w * 0.9, w, f[1] - top[1] - w * 0.9);
      ctx.beginPath(); ctx.arc(f[0], top[1] + w * 0.45, w * 0.45, 0, Math.PI * 2); ctx.fill();
    },
    drawView(ctx) {
      const c = P(1, 0.42, 1.98);
      ctx.save(); ctx.fillStyle = CHALK; ctx.font = '600 15px ui-monospace, monospace'; ctx.textAlign = 'right';
      ctx.fillText('0120', c[0] - 4, c[1]); ctx.restore();
    },
    hotspots: [
      { ...FORWARD('l0_loop', '繼續往前'), click: (g) => { g.s.loops = 1; g.go('l0_loop'); } },
      BACK('l0_start'),
      { id: 'wetroom', rect: bounds(wallQuad(-1, -0.6, 1, 3.0, 3.8), 4), label: '左邊的房間', cursor: 'go', click: (g) => g.go('l0_wet') },
      { id: 'dull_wall', rect: bounds(dullWallEntrance, 4), label: '異常光滑的黯黃色牆面', cursor: 'go', click: (g) => g.go('dull_entry') },
      { id: 'squeeze', rect: bounds(squeezeGap, 4), label: '右牆上一道黑暗的窄縫', cursor: 'go', click: (g) => g.go('sq_mouth') },
      { id: 'atrium', rect: bounds(hallAtriumDoor, 4), label: '右邊的寬敞門洞', cursor: 'go', click: (g) => g.go('l0_atrium') },
      {
        id: 'outlet', rect: bounds(outletQuad, 14), label: '牆上的插座', cursor: 'look',
        click: (g) => {
          if (g.s.flags.outlet_open) return g.closeup('l0_outlet', { msg: '插座後面的牆洞裡空空的。那個聲音已經停了。' });
          if (!g.s.flags.outlet) { g.flag('outlet'); g.sanity(-3); }
          g.closeup('l0_outlet', { msg: '插座裡傳出細小的聲音……是一個很熟悉的聲音，在叫你的名字。蓋板用兩顆螺絲固定著。' });
        },
        use: {
          screwdriver: (g) => {
            if (g.s.flags.outlet_open) return g.say('蓋板已經拆下來了。');
            g.flag('outlet_open'); g.sfx('screw');
            g.give('tape3', '你轉開螺絲，拆下蓋板。牆裡沒有電線——只有一台小小的錄音機，正循環播放著你的聲音。旁邊塞著一卷錄影帶，標籤寫著「#3」。');
          },
        },
      },
    ],
  },

  l0_wet: {
    level: 0, title: '濕透的房間', room: l0Wet,
    viewMsg: '觀景窗裡，水窪的倒影中站著一個人——舉著攝影機，鏡頭正對著你。',
    enter(g, { first }) {
      if (first) g.say('地毯濕得一踩就冒水。天花板有一塊被泡得發黃、往下垂，水一滴一滴落進地上的水窪。');
    },
    draw(ctx, t, s, R) {
      if (s.flags.tile_down) {
        poly(ctx, wetTile, '#0b0904');
      } else {
        poly(ctx, wetTile, shade(R, '#8f7a3a', 2.6));
        const c = P(0, -1, 2.6);
        const st = ctx.createRadialGradient(c[0], c[1], 2, c[0], c[1], 70);
        st.addColorStop(0, 'rgba(60,40,10,0.65)'); st.addColorStop(1, 'rgba(60,40,10,0)');
        ctx.save(); poly(ctx, wetTile); ctx.clip(); ctx.fillStyle = st; ctx.fillRect(0, 0, W, H); ctx.restore();
      }
      ctx.strokeStyle = shade(R, '#5a4c20', 2.6); ctx.lineWidth = 1.5; poly(ctx, wetTile); ctx.stroke();
      // puddle, ripples and the drip falling into it
      ctx.fillStyle = 'rgba(150,160,150,0.18)';
      ctx.beginPath(); ctx.ellipse(puddleC[0], puddleC[1], 150, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,250,220,0.10)';
      ctx.beginPath(); ctx.ellipse(puddleC[0] - 20, puddleC[1] - 3, 70, 5, 0, 0, Math.PI * 2); ctx.fill();
      const ph = (t * 0.8) % 1, top = P(0, -1, 2.6)[1];
      ctx.fillStyle = 'rgba(220,230,220,0.7)';
      ctx.beginPath(); ctx.ellipse(puddleC[0], top + ph * (puddleC[1] - top), 2, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(220,230,220,${0.35 * (1 - ph)})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(puddleC[0], puddleC[1], 10 + ph * 90, 2 + ph * 10, 0, 0, Math.PI * 2); ctx.stroke();
      paper(ctx, R, n0dQuad, 3.7, '#d9cfa8');
    },
    drawView(ctx) {
      // the reflection: someone standing upside down in the water, holding a camera
      ctx.save();
      ctx.beginPath(); ctx.ellipse(puddleC[0], puddleC[1], 150, 18, 0, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = 'rgba(10,20,12,0.85)';
      const x = puddleC[0] + 30, y = puddleC[1] - 18;
      ctx.fillRect(x - 9, y, 18, 26);
      ctx.beginPath(); ctx.ellipse(x, y + 32, 7, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(x - 16, y + 18, 10, 8);
      ctx.restore();
    },
    hotspots: [
      BACK('l0_hall'),
      {
        id: 'tile', rect: bounds(wetTile, 10), label: '下垂的天花板板', cursor: 'look',
        click: (g) => g.closeup('l0_wet_tile', {
          msg: g.s.flags.tile_down
            ? '天花板上只剩一個黑洞。水還在往下滴。'
            : '那塊天花板板泡得發脹，往下垂著，上面好像壓著什麼東西。太高了，手搆不到。',
        }),
        use: {
          rod: (g) => {
            if (g.s.flags.tile_down) return g.say('上面已經什麼都沒有了。');
            g.flag('tile_down'); g.sfx('open');
            if (g.s.flags.cam_got) return g.say('你用吊桿往上一頂——天花板板連同一灘髒水砸了下來。只有水。');
            g.flag('cam_got');
            g.give('camcorder', '你用吊桿往上一頂——天花板板連同一灘髒水砸了下來。水裡躺著一台攝影機，螢幕……還亮著。');
          },
          ladder: (g) => {
            if (!g.s.flags.tile_down) return g.say('板子還在。梯子架上去，頭也只會頂到濕透的板子。');
            g.go('l0_ceiling2', { msg: '你架起梯子，從洞口爬進天花板上方。' });
          },
        },
      },
      {
        id: 'puddle', rect: [puddleC[0] - 150, puddleC[1] - 20, 300, 40], label: '水窪', cursor: 'look',
        click: (g) => {
          if (g.s.view) {
            g.say('倒影裡的人舉著攝影機，鏡頭正對著你。你放下攝影機——水面上什麼都沒有。');
            if (!g.s.flags.reflection) { g.flag('reflection'); g.sanity(-3); }
            return;
          }
          g.say('水面映著頭頂的燈管。……卻沒有映出你。');
          if (!g.s.flags.puddle) { g.flag('puddle'); g.sanity(-3); }
        },
      },
      { id: 'note', rect: bounds(n0dQuad, 8), label: '泡過水的紙條', cursor: 'look', click: (g) => g.read('n0d') },
      { id: 'dryroom', rect: bounds(wallQuad(-1.6, -0.6, 1, 3.0, 3.8), 4), label: '左邊的門洞（地毯好像比較乾）', cursor: 'go', click: (g) => g.go('l0_dry') },
    ],
  },

  l0_loop: {
    level: 0, title: '走廊？', room: (s) => (redCorner(s) ? l0LoopRed : tormentCorner(s) ? l0LoopTorment : l0Loop),
    viewMsg: (s) => `觀景窗裡，右邊那面牆一直在閃${s.loops < 3 ? '——肉眼看過去，它卻完全正常。' : '。'}`,
    enter(g) {
      const n = g.s.loops;
      if (g.s.view && n < 3) g.say('觀景窗裡，右邊那面牆在閃。肉眼看過去，它卻完全正常。');
      else if (n <= 1) g.say('走廊一直延伸，看不到盡頭。');
      else if (n === 2) g.say('……你確定剛才走過這裡。但牆邊多了一個木櫃，之前沒有的。');
      else if (n === 3) g.say('右邊的牆……在閃。像訊號不良的螢幕一樣，一明一滅。');
      else g.say(LOOP_MSGS[n % LOOP_MSGS.length]);
      if (redCorner(g.s)) g.say('左邊多了一個轉角。轉角後面，透出一點暗紅色的光。');
      else if (tormentCorner(g.s)) {
        if (g.s.flags.torment_from === undefined) g.flag('torment_from', n);
        g.say(n === g.s.flags.torment_from
          ? '走廊盡頭，右邊的壁紙褪成了灰色，像一張洗過太多次的照片。那裡多了一個門洞，飄出冷冷的灰霧。'
          : '右邊那片灰色還在，而且比上一圈更大了。');
      } else if (g.s.flags.torment_from !== undefined && !g.s.flags.torment_gone && n % 2 === 1) {
        g.flag('torment_gone');
        g.say('走廊盡頭那片灰色不見了。右邊的壁紙又是黃色的——只是比旁邊的淡了一點點。');
      }
      const m = g.s.flags.chalk_loop;
      if (m !== undefined && n > m) g.say(g.s.view ? '你畫的記號不見了。……可是觀景窗裡，牆上密密麻麻全是記號，不只你畫的那一道。' : '你畫的記號不見了。牆面乾乾淨淨，像從來沒人碰過。');
    },
    draw(ctx, t, s, R) {
      if (s.loops >= 2) {
        box(ctx, R, cabinet);
        seg(ctx, P(-0.55, 0.5, 2.0), P(-1, 0.5, 2.0), shade(R, '#3a2a18', 2), 2);
        const k = P(-0.78, 0.38, 2.0);
        ctx.fillStyle = shade(R, '#d8c08a', 2); ctx.fillRect(k[0] - 6, k[1] - 2, 12, 4);
      }
      if (s.loops >= 3) drawGlitchWall(ctx, R, t);
      if (redCorner(s)) {
        ctx.save(); poly(ctx, redOpening); ctx.clip();
        ctx.fillStyle = `rgba(150,20,10,${0.45 + 0.1 * Math.sin(t * 2)})`; ctx.fillRect(0, 0, W, H);
        ctx.restore();
      } else if (tormentCorner(s)) {
        // the wallpaper around the opening has lost its colour, and the grey is spreading
        const grow = Math.min(2, (s.loops - (s.flags.torment_from ?? s.loops)) / 2);
        ctx.save(); poly(ctx, wallQuad(1, -1, 1, TORMENT_Z[0] - 0.5 - 0.3 * grow, TORMENT_Z[1] + 0.6)); ctx.clip();
        ctx.fillStyle = 'rgba(128,128,124,0.55)'; ctx.fillRect(0, 0, W, H);
        ctx.restore();
        ctx.save(); poly(ctx, tormentOpening); ctx.clip();
        ctx.fillStyle = `rgba(150,150,150,${0.8 + 0.05 * Math.sin(t * 0.7)})`; ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
    },
    drawView(ctx, t, s, R) {
      if (s.loops < 3) drawGlitchWall(ctx, R, t);
      if (s.flags.chalk_loop !== undefined) {
        // every mark anyone ever made here, still on the wall
        for (let i = 0; i < 26; i++) {
          const z = 1.3 + (i % 6) * 0.11, y = -0.4 + Math.floor(i / 6) * 0.22;
          seg(ctx, P(1, y, z), P(1, y + 0.14, z + 0.02), CHALK, 2);
        }
      }
    },
    hotspots: [
      { ...FORWARD('l0_loop', '繼續往前'), click: (g) => { g.s.loops++; g.go('l0_loop'); } },
      BACK('l0_hall'),
      {
        id: 'mark', rect: bounds(wallQuad(1, -0.5, 0.6, 1.25, 1.9), 4), label: '右邊的牆', cursor: 'look',
        click: (g) => g.say('黃色的壁紙。和別處一模一樣。'),
        use: {
          chalk: (g) => {
            g.flag('chalk_loop', g.s.loops);
            g.say('你用粉筆在牆上畫了一道記號。下一圈，你就會知道自己有沒有走回這裡。');
          },
        },
      },
      { id: 'redroom', when: redCorner, rect: bounds(redOpening, 4), label: '泛著紅光的轉角', cursor: 'go', click: (g) => g.go('l0_red') },
      { id: 'torment', when: tormentCorner, rect: bounds(tormentOpening, 4), label: '褪成灰色的門洞', cursor: 'go', click: (g) => g.go('l0_torment') },
      {
        id: 'cabinet', when: (s) => s.loops >= 2, rect: boxRect(cabinet, 6), label: '木櫃', cursor: 'look',
        click: (g) => {
          if (g.s.flags.cabinet) return g.say('抽屜是空的。');
          g.flag('cabinet');
          g.give('almond', '抽屜裡有一瓶杏仁水。瓶身上有人寫著：「撐下去。」字跡很像你的，又好像不太像。');
        },
      },
      {
        id: 'wall', when: (s) => s.loops >= 3 || s.view, rect: bounds(glitchWall, 2), label: '閃爍的牆', cursor: 'go',
        click: (g) => {
          if (!g.s.flags.tape_in) {
            g.sfx('thud'); g.sanity(-4);
            return g.say('你撞上了牆——硬的。手掌貼上去，冰冷而且平整。剛才明明在閃……是不是少了什麼？');
          }
          g.go('l1_arrive', { msg: '攝影機還在錄。你盯著螢幕裡那面閃爍的牆，朝它撞過去——沒有撞擊。只有一陣下墜感。腳下的地毯，變成了冰冷的水泥。' });
        },
      },
    ],
  },

  l0_pillar: {
    level: 0, title: '柱子的房間', room: l0Pillar,
    viewMsg: '螢幕裡，最遠的兩根柱子之間多了一個門洞。肉眼看過去，那裡只是一面牆。',
    enter(g, { first }) { if (first) g.say('一間空蕩蕩的大房間，柱子排成整齊的格子，一路延伸到看不見的地方。'); },
    draw(ctx, t, s, R) {
      if (s.view || s.flags.maze_found) {
        poly(ctx, hiddenDoor, rgb(mul(hex(R.pal.fog), 0.7)));
        poly(ctx, faceQuad(-0.29, -0.42, 0.29, 1, 8.5), shade(R, R.pal.wall, 8.5, 0.8));
      }
      for (const b of pillars0) box(ctx, R, b);
      paper(ctx, R, n0bQuad, 2.4, '#f2eed8');
    },
    hotspots: [
      BACK('l0_start'),
      { id: 'stairs', rect: bounds(stairDoor, 4), label: '左邊的樓梯間', cursor: 'go', click: (g) => g.go('l0_stairs') },
      {
        id: 'deeper', when: (s) => s.view || s.flags.maze_found, rect: bounds(hiddenDoor, 12), label: '柱子後面的門洞', cursor: 'go',
        click: (g) => {
          g.flag('maze_found');
          if (g.s.flags.maze_done) return g.go('l0_faded', { msg: '你記得每一個轉角。這一次，路沒有變。' });
          g.s.maze = 0;
          g.go('l0_maze', g.s.seen.l0_maze ? { msg: `你又回到了第一間隔間。${g.s.view ? '地上有一個粉筆箭頭。' : ''}` } : {});
        },
      },
      { id: 'colonnade', rect: bounds(annexDoor, 4), label: '右邊的柱列過道', cursor: 'go', click: (g) => g.go('l0_colonnade') },
      {
        id: 'note', rect: bounds(n0bQuad, 8), label: '柱子上的便條', cursor: 'look',
        click: (g) => g.read('n0b', () => {
          if (g.s.flags.n0b_seen) return;
          g.flag('n0b_seen'); g.sanity(-4);
          g.say('字跡很眼熟。眼熟到讓你不舒服。');
        }),
      },
    ],
  },

  l0_maze: {
    level: 0, title: '隔間', room: (s) => MAZE_ROOMS[(s.maze || 0) % MAZE_ROOMS.length],
    viewMsg: '觀景窗裡，地毯上有一個粉筆箭頭——肉眼完全看不到。',
    enter(g, { first }) {
      if (first) g.say(`一間小小的隔間。左、右、前面各有一個出口，看起來一模一樣。${g.s.view ? '地上有一個粉筆箭頭。' : ''}`);
    },
    draw(ctx, t, s, R) { if (!(s.maze || 0)) paper(ctx, R, n0eQuad, 1.7, '#efe7cf'); },
    drawView(ctx, t, s) {
      const dir = MAZE_PATH[s.maze || 0];
      if (dir === 'left') floorArrow(ctx, 0.5, 1.6, -0.75, 2.4);
      else if (dir === 'right') floorArrow(ctx, -0.5, 1.6, 0.75, 2.4);
      else floorArrow(ctx, 0, 1.35, 0, 2.8);
    },
    hotspots: [
      {
        id: 'back', rect: [330, 470, 300, 70], label: '往回走', cursor: 'back',
        click: (g) => { g.s.maze = 0; g.go('l0_pillar', { msg: '你一回頭，身後的隔間就全變了。等你回過神來，已經站在柱子的房間裡。' }); },
      },
      { id: 'left', rect: bounds(mazeLeft, 4), label: '左邊的出口', cursor: 'go', click: (g) => mazeStep(g, 'left') },
      { id: 'right', rect: bounds(mazeRight, 4), label: '右邊的出口', cursor: 'go', click: (g) => mazeStep(g, 'right') },
      { id: 'ahead', rect: bounds(mazeAhead, 14), label: '前面的出口', cursor: 'go', click: (g) => mazeStep(g, 'ahead') },
      { id: 'note', when: (s) => !(s.maze || 0), rect: bounds(n0eQuad, 8), label: '牆上的紙條', cursor: 'look', click: (g) => g.read('n0e') },
    ],
  },

  l0_faded: {
    level: 0, title: '褪色的房間', room: l0Faded,
    viewMsg: '鏡頭裡，牆上的刻痕比肉眼看到的多。',
    enter(g, { first }) {
      if (first) g.say('這間房間的壁紙褪了色，像一張曬了很多年的老照片。地上鋪著一張紙箱，旁邊堆滿了空瓶子。有人在這裡住過。');
    },
    draw(ctx, t, s, R) {
      drawTally(ctx, R, s.view ? TALLY.real : TALLY.seen, -1.45, -0.78, 3.999, 0.38, shade(R, '#4a3f25', 4));
      box(ctx, R, mat);
      for (const [x, z] of pile) {
        const p = P(x, 1, z);
        bottle(ctx, R, p[0], p[1], 34, z);
      }
      box(ctx, R, locker);
      for (let i = 0; i < 3; i++) seg(ctx, P(1.1, -0.45 + i * 0.08, 3.25), P(1.1, -0.45 + i * 0.08, 3.55), shade(R, '#3a3d40', 3.3), 1.5);
      const kp = P(1.1, 0.1, 3.2);
      ctx.fillStyle = shade(R, '#1f2a1f', 3.2); ctx.fillRect(kp[0] - 3, kp[1] - 10, 8, 18);
      const led = P(1.1, 0.02, 3.2);
      ctx.fillStyle = s.flags.locker_open ? '#3f3' : '#f33';
      ctx.beginPath(); ctx.arc(led[0] + 1, led[1], 2, 0, Math.PI * 2); ctx.fill();
      paper(ctx, R, n0fQuad, 2.4, '#e8dfc4');
      const glow = P(1.8, -0.2, 2.3);
      ctx.save(); ctx.fillStyle = 'rgba(255,200,110,0.16)'; ctx.shadowColor = '#ffb64c'; ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.ellipse(glow[0] - 20, glow[1], 18, 40, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    },
    hotspots: [
      {
        id: 'back', rect: [330, 470, 300, 70], label: '往回走', cursor: 'back',
        click: (g) => g.go('l0_pillar', { msg: '你一回頭，來時的隔間就不見了。眼前是那間有柱子的房間。' }),
      },
      {
        id: 'tally', rect: bounds(tallyArea, 6), label: '牆上的刻痕', cursor: 'look',
        click: (g) => g.closeup('l0_tally', {
          msg: g.s.view
            ? '鏡頭裡的記號多了好幾個：正、正、正、正、下。肉眼看到的，原來只是一部分。'
            : '牆上刻著一排「正」字記號，每個「正」是五筆：正、正、丅……一共十二筆。',
        }),
      },
      {
        id: 'locker', rect: boxRect(locker, 6), label: '上鎖的鐵櫃', cursor: 'look',
        click: (g) => {
          if (g.s.flags.locker_open) return g.say('鐵櫃已經空了。');
          g.keypad(String(TALLY.real), () => {
            g.flag('locker_open'); g.give('tape'); g.give('almond');
            g.say('鐵櫃「喀」地彈開：一卷錄影帶，還有一瓶杏仁水。');
          });
        },
      },
      {
        id: 'bottles', rect: bounds(pile.map(([x, z]) => P(x, 1, z)).concat([P(0.4, 0.7, 2.0), P(1.2, 0.7, 2.2)]), 12), label: '一堆空瓶', cursor: 'look',
        click: (g) => {
          g.say('幾十個空的杏仁水瓶子。標籤上都寫著日期：有的是 1 月 20 日，有的是 1 月 21 日，有的日期被反覆塗掉，看不出原本寫什麼。');
          if (!g.s.flags.bottles) { g.flag('bottles'); g.sanity(-3); }
        },
      },
      {
        id: 'mat', rect: boxRect(mat, 6), label: '紙箱', cursor: 'look',
        click: (g) => {
          if (g.s.flags.mat_bar) return g.say('一張壓扁的紙箱，被當成床墊。上面的凹痕，跟你的身形差不多大。');
          g.flag('mat_bar');
          g.give('bar', '一張壓扁的紙箱，被當成床墊。紙箱底下塞著一條沒拆封的能量棒——像是特地留給誰的。');
        },
      },
      { id: 'note', rect: bounds(n0fQuad, 8), label: '散落的日記', cursor: 'look', click: (g) => g.read('n0f') },
      {
        id: 'older', rect: bounds(olderDoor, 4), label: '更舊的那一頭', cursor: 'go',
        click: (g) => g.go('l07_modern', { msg: '門洞後面的壁紙比這裡還舊。你每走一步，燈管就換一種款式——像有人把這一層歷年的樣子，一層一層疊在了一起。' }),
      },
    ],
  },


  l0_blackout: {
    level: '0-blackout', title: '積水入口', room: l0Blackout, dark: true, nightshot: true,
    hum: (s) => s.bo?.dir,
    viewMsg: '攝影機切到了夜視模式。畫面很糊，但看得出三個出口，左手邊還有一道生鏽的斷牆缺口。',
    enter(g, { first }) {
      const dir = g.s.bo?.dir || 'ahead';
      g.say(`${first ? '伸手不見五指，安靜得可怕。牆摸起來很粗糙，地上積著到腳踝的水。' : ''}遠遠的，有一盞燈在嗡嗡作響——聲音從${DIR_ZH[dir]}傳來。`);
    },
    draw(ctx, t, s, R) {
      ctx.fillStyle = 'rgba(120,130,110,0.10)';
      const c = P(0, 1, 2.2);
      ctx.beginPath(); ctx.ellipse(c[0], c[1], 260, 40, 0, 0, Math.PI * 2); ctx.fill();
      poly(ctx, boSubDoor, s.flags.bo_emer ? 'rgba(110,22,18,0.55)' : '#050504');
      outline(ctx, boSubDoor, s.flags.bo_emer ? 'rgba(255,95,75,0.45)' : 'rgba(90,90,70,0.35)', 1.5);
      if (s.bo?.step === 1) poly(ctx, sunkStairs, '#020201');
    },
    drawOver(ctx, t, s) {
      if (s.flags.bo_emer) {
        const sp = P(-1.4, 0.1, 1.7);
        glow(ctx, Math.max(40, sp[0]), sp[1], 48, '#ff4a38', 0.28);
      }
      // the stairs give off a faint wet glint even through the dark, pulsing with the hum below
      if (s.bo?.step !== 1) return;
      const k = 0.5 + 0.5 * Math.sin(t * 2.2);
      for (let i = 0; i < 4; i++) {
        const z = 1.52 + i * 0.13;
        seg(ctx, P(0.34, 1, z), P(1.06, 1, z), `rgba(120,165,180,${(0.32 - i * 0.07) * (0.6 + 0.4 * k)})`, 2);
      }
    },
    hotspots: [
      {
        id: 'back', rect: [330, 470, 300, 70], label: '摸黑退回去', cursor: 'back',
        click: (g) => { g.s.bo = null; g.go('l0_low', { msg: '你一路摸著牆退回去，直到看見燈光。' }); },
      },
      {
        id: 'substation', rect: [16, 145, 118, 250], label: '摸著左側斷牆往配電間走', cursor: 'go',
        click: (g) => g.go('l0_bo_substation', { msg: '你沿著冰冷潮濕的斷牆摸進一間低矮的配電間。空氣裡有鐵鏽與舊電線的焦味。' }),
      },
      {
        id: 'down', when: (s) => s.bo?.step === 1, rect: bounds(sunkStairs, 6), label: '腳邊往下的台階', cursor: 'go',
        click: (g) => { g.s.bo = null; g.go('l05_flood'); },
      },
      { id: 'left', rect: bounds(mazeLeft, 4), label: '左邊', cursor: 'go', click: (g) => blackoutStep(g, 'left') },
      { id: 'right', rect: bounds(mazeRight, 4), label: '右邊', cursor: 'go', click: (g) => blackoutStep(g, 'right') },
      { id: 'ahead', rect: bounds(mazeAhead, 14), label: '前面', cursor: 'go', click: (g) => blackoutStep(g, 'ahead') },
    ],
  },

  l0_bo_substation: {
    level: '0-blackout', title: '積水配電間', room: l0BoSub,
    dark: (s) => !s.flags.bo_emer, nightshot: true,
    viewMsg: '夜視畫面裡，生鏽配電箱上的兩組手閘標籤特別清晰：上面寫著「應急紅燈」，下面寫著「濕區斷電」。',
    enter(g, { first }) {
      if (first) g.say('停電區裡竟藏著一間配電間。左牆掛著總配電箱，積水從門檻漫向更深的迴廊。');
    },
    draw(ctx, t, s, R) {
      ctx.fillStyle = 'rgba(90,110,105,0.14)';
      const p = P(0, 1, 2.6);
      ctx.beginPath(); ctx.ellipse(p[0], p[1], 240, 34, 0, 0, Math.PI * 2); ctx.fill();
      box(ctx, R, boPanelBox);
      poly(ctx, boBreakerEmer, s.flags.bo_emer ? '#9a2820' : '#2a2e30');
      outline(ctx, boBreakerEmer, s.flags.bo_emer ? '#ff6a58' : '#70767a', 1.5);
      poly(ctx, boBreakerCut, s.flags.bo_cut ? '#2b6a46' : '#332d22');
      outline(ctx, boBreakerCut, s.flags.bo_cut ? '#6ee6a0' : '#b89448', 1.5);
      paper(ctx, R, boLogQuad, 2.55, '#dcd6c0');
      if (s.flags.bo_emer) {
        const bulb = P(0, -0.95, 2.2);
        glow(ctx, bulb[0], bulb[1] + 10, 110, '#ff4838', 0.38);
      }
    },
    drawView(ctx, t, s) {
      const a = P(-1.07, -0.06, 2.18), b = P(-1.07, 0.28, 2.18);
      txt(ctx, s.flags.bo_emer ? '應急燈：開' : '應急燈：關', a[0] + 62, a[1], CHALK, 12, 'left');
      txt(ctx, s.flags.bo_cut ? '濕區電源：斷' : '濕區電源：通', b[0] + 62, b[1], CHALK, 12, 'left');
    },
    hotspots: [
      BACK('l0_blackout', '退回積水入口'),
      FORWARD('l0_bo_floodhall', '往更深的積水迴廊走', bounds(faceQuad(-0.36, -0.55, 0.36, 1, 5.5), 12)),
      {
        id: 'breaker_emer', rect: bounds(boBreakerEmer, 8), label: '應急紅燈總閘', cursor: 'look',
        click: (g) => {
          const on = !g.s.flags.bo_emer;
          g.flag('bo_emer', on); g.sfx('click');
          g.say(on
            ? '「喀嚓」一聲——頭頂與深處迴廊亮起暗紅色的應急燈。雖然昏暗，但終於看得清腳下的路了。'
            : '你拉下應急燈總閘，四周瞬間落回伸手不見五指的漆黑。');
        },
      },
      {
        id: 'breaker_cut', rect: bounds(boBreakerCut, 8), label: '濕區斷電閘', cursor: 'look',
        click: (g) => {
          const cut = !g.s.flags.bo_cut;
          g.flag('bo_cut', cut); g.sfx('click');
          g.say(cut
            ? '你拉下濕區斷電閘。深處迴廊傳來一聲沉悶的繼電器跳脫聲——水裡滋滋作響的漏電停了。'
            : '你推回濕區電源閘。遠處積水又開始啪滋啪滋地冒出電火花。');
        },
      },
      { id: 'log', rect: bounds(boLogQuad, 8), label: '貼在箱門的檢修單', cursor: 'look', click: (g) => g.read('n_bo_log') },
    ],
  },

  l0_bo_floodhall: {
    level: '0-blackout', title: '漏電深水迴廊', room: l0BoFlood,
    dark: (s) => !s.flags.bo_emer, nightshot: true,
    hazard: (s) => (s.flags.bo_cut ? null : '斷裂電纜正在往積水放電——先去配電間斷電，或趁電弧停歇時通過'),
    viewMsg: '觀景窗裡，天花板垂下的斷裂電纜正對著積水，遠端門洞透出極淡的微光。',
    enter(g, { first }) {
      if (first) g.say(g.s.flags.bo_cut
        ? '這段迴廊的積水更深，一條斷裂電纜垂在水面上，幸好電源已經切斷。右牆有扇小門。'
        : '這段迴廊的積水沒過腳踝。天花板垂落一條斷裂電纜，每隔幾秒就往水面炸出一團藍白電弧！');
    },
    draw(ctx, t, s, R) {
      ctx.fillStyle = 'rgba(95,120,130,0.16)';
      const c = P(0, 1, 3.0);
      ctx.beginPath(); ctx.ellipse(c[0], c[1], 290, 46, 0, 0, Math.PI * 2); ctx.fill();
      // severed power cable hanging from ceiling
      const top = P(0.08, -1, 2.9), tip = P(0.05, 0.72, 2.9), water = P(0.05, 1, 2.9);
      seg(ctx, top, tip, '#1d2022', 4);
      if (boArcOn(s)) {
        glow(ctx, water[0], water[1] - 12, 110, '#8fe8ff', 0.55);
        ctx.strokeStyle = '#d8f8ff'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(tip[0], tip[1]);
        ctx.lineTo(tip[0] - 16, (tip[1] + water[1]) / 2);
        ctx.lineTo(water[0] + 12, water[1] - 4);
        ctx.stroke();
      }
      if (!s.flags.bo_pouch) drawBag(ctx, R, boPouch, { stripe: '#88b8d0' });
      poly(ctx, boLockerDoor, 'rgba(6,6,8,0.85)');
      outline(ctx, boLockerDoor, s.flags.bo_emer ? 'rgba(210,90,75,0.45)' : 'rgba(110,115,110,0.35)', 1.5);
    },
    drawOver(ctx, t, s) {
      if (boArcOn(s)) {
        const w = P(0.05, 1, 2.9);
        glow(ctx, w[0], w[1] - 8, 95, '#6cd8ff', 0.4);
      }
    },
    hotspots: [
      BACK('l0_bo_substation', '退回配電間'),
      {
        id: 'pouch', when: (s) => !s.flags.bo_pouch, rect: boxRect(boPouch, 10), label: '飄在水邊的防水袋', cursor: 'take',
        click: (g) => { g.flag('bo_pouch'); g.give('almond', '你撈起那個密封防水袋，裡頭保著一瓶沒進水的杏仁水。'); },
      },
      {
        id: 'locker', rect: bounds(boLockerDoor, 6), label: '右側黑暗值班室', cursor: 'go',
        click: (g) => {
          if (boArcOn(g.s)) {
            g.sfx('sting'); g.sanity(-10);
            return g.say('藍白電弧正好在水面炸開！電流順著積水竄上腳踝，你狼狽退回原地。');
          }
          g.go('l0_bo_locker');
        },
      },
      {
        id: 'forward', rect: bounds(faceQuad(-0.36, -0.55, 0.36, 1, 7), 14), label: '往前走向失明天井', cursor: 'go',
        click: (g) => {
          if (boArcOn(g.s)) {
            g.sfx('sting'); g.sanity(-10);
            return g.say('電纜正在水面放電！差點被電昏，趁電弧停歇再衝過去，或回配電間拉下濕區斷電閘。');
          }
          g.go('l0_bo_pit');
        },
      },
    ],
  },

  l0_bo_locker: {
    level: '0-blackout', title: '黑暗值班室', room: l0BoLocker,
    dark: (s) => !s.flags.bo_emer, nightshot: true,
    viewMsg: '觀景窗裡，鐵桌對面坐著一個全身滴水的人影，正低頭看著桌上的報修單。',
    enter(g, { first }) {
      if (first) g.say('一間狹小的檢修值班室。積水只到鞋底，鐵桌上攤著一本報修紀錄，牆邊掛著舊對講機。');
    },
    draw(ctx, t, s, R) {
      box(ctx, R, boDesk);
      paper(ctx, R, boDeskNote, 2.5, '#e2dcc4');
      poly(ctx, boIntercom, shade(R, '#363b3e', 2.0));
      outline(ctx, boIntercom, '#687074', 1.5);
      const led = P(1.35, -0.05, 2.05);
      ctx.fillStyle = (t * 1.4 | 0) % 2 === 0 ? '#e6a23c' : '#4a3818';
      ctx.beginPath(); ctx.arc(led[0] - 8, led[1], 3, 0, Math.PI * 2); ctx.fill();
    },
    drawView(ctx) {
      const h = P(0.18, 0.02, 3.05);
      ctx.save(); ctx.fillStyle = 'rgba(180,255,210,0.22)';
      ctx.beginPath(); ctx.arc(h[0], h[1], 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(h[0] - 24, h[1] + 20, 48, 62);
      ctx.restore();
    },
    hotspots: [
      BACK('l0_bo_floodhall', '回到深水迴廊'),
      { id: 'desk_note', rect: bounds(boDeskNote, 10), label: '桌上的報修紀錄', cursor: 'look', click: (g) => g.read('n_bo_note') },
      {
        id: 'drawer', rect: [395, 345, 170, 68], label: '鐵桌抽屜', cursor: 'take',
        click: (g) => {
          if (g.s.flags.bo_bar) return g.say('抽屜裡只剩幾顆生鏽的保險絲，已經派不上用場了。');
          g.flag('bo_bar'); g.give('bar', '你在抽屜角落摸出一條還沒拆封的乾糧能量棒。');
        },
      },
      {
        id: 'intercom', rect: bounds(boIntercom, 8), label: '牆邊的舊對講機', cursor: 'look',
        click: (g) => {
          g.sfx('static');
          if (!g.s.flags.bo_intercom) {
            g.flag('bo_intercom');
            return g.closeup('bo_intercom', { msg: '沙沙的電流雜訊裡，竟傳來兩三個斷斷續續的鋼琴單音……像從迴廊盡頭的失明天井後面飄來的。' });
          }
          g.closeup('bo_intercom', { msg: '喇叭裡只剩潮濕的沙沙聲，偶爾夾著一下極輕的琴鍵聲。' });
        },
      },
    ],
  },

  l0_bo_pit: {
    level: '0-blackout', title: '失明天井', room: l0BoPit,
    dark: (s) => !s.flags.bo_emer, nightshot: true,
    viewMsg: '觀景窗抬頭望去，高得離譜的井頂排著一整片黃色天花板；正前方那扇小門散發出跟這片黑暗完全不同的穩定光譜。',
    enter(g, { first }) {
      if (first) g.say('迴廊在這裡猛然挑高，成了一座深不見底的黑水天井。抬頭勉強看得見極高處一格發黃的天花板，正前方有扇透出米黃微光的小門。');
    },
    draw(ctx, t, s, R) {
      poly(ctx, boShaftQuad, 'rgba(218,196,115,0.22)');
      outline(ctx, boShaftQuad, 'rgba(220,200,120,0.4)', 1.5);
      paper(ctx, R, boPitNote, 2.2, '#e2dac0');
      poly(ctx, boManilaDoor, shade(R, '#b8a272', 5.8));
      outline(ctx, boManilaDoor, '#e6d6a6', 2);
    },
    drawOver(ctx) {
      const m = P(0, 0.25, 5.99);
      glow(ctx, m[0], m[1], 70, '#ffe8b0', 0.26);
    },
    hotspots: [
      BACK('l0_bo_floodhall', '退回深水迴廊'),
      { id: 'pit_note', rect: bounds(boPitNote, 8), label: '井邊牆上的字條', cursor: 'look', click: (g) => g.read('n_bo_pit') },
      {
        id: 'shaft', rect: bounds(boShaftQuad, 12), label: '極高處的黃色天花板格柵', cursor: 'look',
        click: (g) => g.closeup('bo_shaft', { msg: '那裡高得像隔了十層樓，黃色的燈光微弱得像一張貼紙。看久了，會覺得整片停電區都在 Level 0 的地底。' }),
      },
      {
        id: 'manila_door', rect: bounds(boManilaDoor, 12), label: '泛著淡米黃微光的小門', cursor: 'go',
        click: (g) => {
          g.s.bo = null;
          g.go('l0_manila', { msg: '你推開天井盡頭那扇微暖的小門。積水停在門檻外面，牆裡隱約飄來輕輕的鋼琴聲。' });
        },
      },
    ],
  },

  l0_manila: {
    level: 0, title: '馬尼拉房間', room: l0Manila, quiet: 0.35,
    viewMsg: '觀景窗裡，那個人手上也舉著一台攝影機。他的螢幕裡，是你。',
    enter(g, { first }) {
      const f = g.s.flags;
      if (f.freed_jh) g.say('牆角空了。地板上只剩一個坐了很久的凹痕。');
      else if (first) g.say('牆角坐著一個人，抱著膝蓋。在這一層，你本來不可能看見任何人。房間中央是一張八角形的木桌，兩把椅子。嗡嗡聲退得很遠，牆裡隱約有人在彈鋼琴。');
      else g.say('那個人還坐在牆角。牆裡的鋼琴聲還在。');
      // the room mends itself while nobody is looking
      if (f.manila_carved !== undefined && !f.manila_healed) {
        g.flag('manila_healed');
        g.say('你在桌邊刻的那道痕不見了。木頭平平整整，像從來沒人碰過。');
      }
    },
    draw(ctx, t, s, R) {
      // floorboards
      for (let x = -1.3; x <= 1.3; x += 0.26) seg(ctx, P(x, 1, 1.05), P(x, 1, 2.99), shade(R, '#4a3520', 2, 0.6), 1);
      paper(ctx, R, megQuad, 2.0, '#f4f0e0');
      // the figure in the corner sits behind the table, so it is drawn first
      if (!s.flags.freed_jh) {
        poly(ctx, jhTorso, shade(R, '#3b3226', 2.7));
        poly(ctx, jhLegs, shade(R, '#2f281e', 2.6));
        ctx.fillStyle = shade(R, '#8a7058', 2.75);
        ctx.beginPath(); ctx.arc(jhHead[0], jhHead[1], 19, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = shade(R, '#2a2219', 2.75);
        ctx.beginPath(); ctx.arc(jhHead[0], jhHead[1] - 6, 19, Math.PI, 0); ctx.fill();
      }
      // the octagonal table: legs, the cupboard underneath, then the top with papers on it
      for (const [x, z] of tableLegs) seg(ctx, P(x, TABLE_Y + 0.02, z), P(x, 1, z), shade(R, '#4d3319', z), 4);
      box(ctx, R, cupboard);
      const cd = P(0.08, 0.75, 1.9);
      seg(ctx, P(0.08, 0.6, 1.9), P(0.08, 0.9, 1.9), shade(R, '#3a2614', 1.9), 1.5);
      ctx.fillStyle = shade(R, '#c8a868', 1.9); ctx.fillRect(cd[0] - 8, cd[1] - 2, 4, 4); ctx.fillRect(cd[0] + 4, cd[1] - 2, 4, 4);
      if (s.flags.manila_cupboard) {
        poly(ctx, [P(-0.12, 0.6, 1.89), P(0.06, 0.6, 1.89), P(0.06, 0.9, 1.89), P(-0.12, 0.9, 1.89)], shade(R, '#1c1208', 1.9));
      }
      poly(ctx, tableTop, shade(R, '#8c633a', TABLE_C.z));
      ctx.strokeStyle = shade(R, '#5a3d1f', 2); ctx.lineWidth = 2; poly(ctx, tableTop); ctx.stroke();
      paper(ctx, R, [P(-0.1, TABLE_Y - 0.005, 2.05), P(0.08, TABLE_Y - 0.005, 2.0), P(0.12, TABLE_Y - 0.005, 2.2), P(-0.06, TABLE_Y - 0.005, 2.25)], 2.1, '#f2ecd8');
      if (s.flags.manila_carved !== undefined && !s.flags.manila_healed) {
        seg(ctx, [carveAt[0] - 10, carveAt[1] - 1], [carveAt[0] + 8, carveAt[1] + 2], '#2a1a0c', 2);
      }
      box(ctx, R, chairR); box(ctx, R, chairRBack);
      seg(ctx, P(0.52, 0.65, 2.2), P(0.52, 1, 2.2), shade(R, '#4d3319', 2.2), 3);
      seg(ctx, P(0.52, 0.65, 2.0), P(0.52, 1, 2.0), shade(R, '#4d3319', 2.0), 3);
      box(ctx, R, chairL); box(ctx, R, chairLBack);
      seg(ctx, P(-0.42, 0.65, 1.64), P(-0.42, 1, 1.64), shade(R, '#4d3319', 1.64), 3);
      seg(ctx, P(-0.42, 0.65, 1.84), P(-0.42, 1, 1.84), shade(R, '#4d3319', 1.84), 3);
    },
    drawView(ctx, t, s) {
      if (s.flags.freed_jh) return;
      const c = P(-0.5, 0.5, 2.5);
      ctx.fillStyle = '#1b1c1e'; ctx.fillRect(c[0] - 18, c[1] - 12, 36, 24);
      if ((t * 1.2 | 0) % 2 === 0) { ctx.fillStyle = '#e33'; ctx.beginPath(); ctx.arc(c[0] + 10, c[1] - 5, 3, 0, Math.PI * 2); ctx.fill(); }
    },
    hotspots: [
      {
        id: 'back', rect: [330, 470, 300, 70], label: '離開房間', cursor: 'back',
        click: (g) => g.go('l0_low', { msg: '你走出房間，四周又是熟悉的黃色。回頭時，門已經不見了——你站在那間低矮的房間裡。' }),
      },
      {
        id: 'jh', when: (s) => !s.flags.freed_jh, rect: bounds([...jhTorso, ...jhLegs, [jhHead[0], jhHead[1] - 22]], 6), label: '牆角的人', cursor: 'look',
        use: {
          camcorder: (g) => {
            if (!allTapesWatched(g.s)) {
              const n = EXTRA_TAPES.filter((id) => g.s.flags[`watched_${id}`]).length;
              return g.say(`你把攝影機的螢幕轉向他。他看了一眼，搖搖頭。「這段我看過。」${n ? '「還少了幾段。」' : ''}`);
            }
            g.flag('freed_jh'); g.sfx('whirr');
            g.say('你把三卷帶子的畫面一段一段放給他看。看到最後，他笑了一下，像是認出了什麼。「……原來是這樣排的。」他扶著牆站起來，走出門外。你沒看見他離開——只是一眨眼，牆角就空了。');
          },
        },
        click: (g) => {
          const talk = (gg) => {
            const i = gg.s.flags.jh_talk || 0;
            gg.flag('met_jh');
            gg.say(JH_LINES[Math.min(i, JH_LINES.length - 1)]);
            if (i === 2) gg.give('almond');
            if (i === 4 && !gg.s.flags.jh_shock) { gg.flag('jh_shock'); gg.sanity(-5); }
            gg.flag('jh_talk', i + 1);
          };
          g.closeup('l0_manila_jh', {
            hotspots: [{
              id: 'jh', rect: [310, 125, 340, 325], label: '牆角的人（繼續對話）', cursor: 'look',
              click: talk,
            }],
          });
          talk(g);
        },
      },
      { id: 'note', rect: bounds(megQuad, 8), label: '牆上的文件', cursor: 'look', click: (g) => g.read('n_meg0') },
      {
        id: 'table', rect: bounds(tableTop, 4), label: '八角形的木桌', cursor: 'look',
        click: (g) => g.read('n_manila_secret', () => g.say('桌上的紙用十幾種語言寫成，有些被拿走了，留下一圈圈乾淨的印子。')),
        use: {
          knife: (g) => {
            if (g.s.flags.manila_carved !== undefined && !g.s.flags.manila_healed) return g.say('那道刻痕還在。');
            if (g.s.flags.manila_healed) return g.say('你沒有再刻。反正它會自己長好。');
            g.flag('manila_carved', g.s.moves); g.sfx('screw');
            g.say('你用軍刀在桌邊刻了一道短短的痕。木屑捲起來，落在地板上。');
          },
        },
      },
      {
        id: 'cupboard', rect: boxRect(cupboard, 6), label: '桌子底下的櫃子', cursor: 'look',
        click: (g) => {
          if (g.s.flags.manila_cupboard) return g.say('櫃子裡空了。下一個來補貨的人，不知道還要走多久。');
          g.flag('manila_cupboard'); g.sfx('open');
          g.give('almond'); g.give('bar');
          g.say('你拉開桌下的櫃門。裡面整整齊齊放著一瓶杏仁水和一條能量棒，旁邊壓著一張字條：「拿你需要的。剩下的留給下一個人。」');
        },
      },
      {
        id: 'chair', rect: boxRect(chairR, 10), label: '木椅', cursor: 'look',
        click: (g) => {
          if (g.s.flags.manila_rested) return g.say('你又坐了一會兒。鋼琴聲彈到同一段，又從頭開始。');
          g.flag('manila_rested'); g.sanity(15); g.checkpoint();
          g.say('你在桌邊坐下。鋼琴聲是從牆裡、從天花板裡傳出來的，很輕。你聽了很久，才發現自己的手已經不抖了。（清醒度 +15）');
        },
      },
    ],
  },

  l0_red: {
    level: '0-red', title: '入口轉角', room: l0Red, trap: redTrap, hazard: redHazard,
    viewMsg: '螢幕上全是雜訊。這裡的東西，連鏡頭都錄不下來。',
    enter(g) {
      g.sfx('sting');
      if (g.s.flags.red_x) return g.say('你回到了入口的轉角。來的方向還在——可是它好像比剛才窄了。');
      g.say('一切都泛著紅光。地毯又厚又黏，長著黑霉和小小的菇。剝落的黃色壁紙底下，露出深紅色的漆。——你的每一根神經都在叫你：馬上回頭。');
    },
    draw(ctx, t, s, R) {
      // what's left of the yellow wallpaper, torn into ragged strips over the crimson paint
      for (const [x, y1, y2, z1, z2] of peel) {
        const pts = [P(x, y1, z1), P(x, y1, z2)];
        for (let i = 0; i <= 6; i++) {
          const z = z2 - ((z2 - z1) * i) / 6;
          pts.push(P(x, y2 + (i % 2 ? 0.12 : -0.05) * Math.sin(i * 2.7 + z), z));
        }
        poly(ctx, pts, shade(R, '#c8b35e', (z1 + z2) / 2, 0.7));
        seg(ctx, P(x, y2, z1 + 0.1), P(x, y2 + 0.25, z1 + 0.3), shade(R, '#a8964e', z1, 0.6), 2);
      }
      if (!s.flags.tape4) cassette(ctx, R, tape4Box);
      for (const [x, z] of shrooms) {
        const p = P(x, 1, z), r = 14 / z;
        ctx.fillStyle = shade(R, '#d8c8b0', z); ctx.fillRect(p[0] - r * 0.2, p[1] - r * 1.2, r * 0.4, r * 1.2);
        ctx.fillStyle = shade(R, '#5a1a10', z); ctx.beginPath(); ctx.arc(p[0], p[1] - r * 1.2, r * 0.7, Math.PI, 0); ctx.fill();
        ctx.fillStyle = 'rgba(10,6,4,0.5)'; ctx.beginPath(); ctx.ellipse(p[0] + r * 2, p[1], r * 2.5, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      }
    },
    drawOver(ctx, t) {
      const gl = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, W * 0.7);
      gl.addColorStop(0, 'rgba(120,0,0,0)'); gl.addColorStop(1, `rgba(90,0,0,${0.45 + 0.1 * Math.sin(t * 1.3)})`);
      ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    },
    hotspots: [
      {
        id: 'back', rect: [330, 470, 300, 70], label: '馬上回頭', cursor: 'back',
        click: (g) => {
          const deep = g.s.flags.red_x;
          g.flag('red_x', 0); g.flag('red_anchored', false); g.sanity(deep ? -15 : -10);
          g.go('l0_loop', { free: true, msg: deep
            ? '你拚命往來的方向擠。壁紙的邊緣擦過你的肩膀，像一道正在合上的傷口——然後你跌進了黃色的走廊。身後只剩一面普通的牆。'
            : '你轉身就跑，頭也不回。等你停下來喘氣，四周又是黃色的走廊。……你差一點就回不來了。' });
        },
      },
      { ...FORWARD('l0_red_hall', '往紅光深處走'), click: (g) => { redStep(g); g.go('l0_red_hall'); } },
      {
        id: 'tape4', when: (s) => !s.flags.tape4, rect: boxRect(tape4Box, 16), label: '黏在地毯上的錄影帶', cursor: 'take',
        click: (g) => { g.flag('tape4'); g.give('tape4', '你彎腰把錄影帶從黏糊糊的地毯上扯下來。標籤寫著「#4」。——快走。'); },
      },
      { id: 'corner', rect: bounds(wallQuad(1, -0.6, 1, 4.5, 5.3), 4), label: '另一個轉角', cursor: 'go', click: (g) => g.end('red') },
    ],
  },

  l0_red_hall: {
    level: '0-red', title: '黏稠走廊', room: l0RedHall, trap: redTrap, hazard: redHazard,
    viewMsg: '螢幕上的雜訊在跳。雜訊裡，左右兩側的暗紅裂口後面都有微弱反光，盡頭站著一個人影。',
    enter(g, { first }) {
      g.sfx('sting'); g.sanity(-6);
      if (first) g.say('空氣又稠又熱，有一股銅鏽味。地毯黏著鞋底，每抬一次腳都要用力。左右牆各裂開一道暗紅岔口，牆邊有個被黑霉包住的背包。');
      else g.say('黏稠的紅色走廊。你回頭看了一眼——入口的轉角比你記得的遠。');
    },
    draw(ctx, t, s, R) {
      for (const [x, y1, y2, z1, z2] of peel) {
        poly(ctx, [P(x, y1, z1), P(x, y1, z2), P(x, y2, z2), P(x, y2, z1)], shade(R, '#4a100a', (z1 + z2) / 2));
      }
      poly(ctx, redRadioDoor, 'rgba(32,6,4,0.88)');
      outline(ctx, redRadioDoor, 'rgba(210,75,55,0.45)', 1.5);
      poly(ctx, redNestDoor, 'rgba(28,4,4,0.9)');
      outline(ctx, redNestDoor, 'rgba(185,55,40,0.45)', 1.5);
      for (const [x, z] of shrooms) {
        const p = P(x, 1, z), r = 20 / z;
        ctx.fillStyle = shade(R, '#7a1c12', z); ctx.beginPath(); ctx.arc(p[0], p[1] - r * 1.5, r * 0.9, Math.PI, 0); ctx.fill();
      }
      if (!s.flags.red_shroom_cut) {
        const p = P(hallShroom[0], 1, hallShroom[1]), r = 70 / hallShroom[1], k = 1 + 0.06 * Math.sin(t * 3);
        ctx.fillStyle = shade(R, '#a02818', hallShroom[1]); ctx.beginPath(); ctx.ellipse(p[0], p[1] - r, r * 1.4 * k, r * k, 0, Math.PI, 0); ctx.fill();
      }
      drawBag(ctx, R, redPack, { stripe: '#b89868', label: 'M.E.G.' });
      if (!s.flags.red_pack_looted) {
        ctx.strokeStyle = shade(R, '#1a0805', 2.3); ctx.lineWidth = 1.5;
        const a = P(-0.45, 0.76, 2.1);
        for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(a[0] - 20 + i * 10, a[1]); ctx.lineTo(a[0] - 26 + i * 12, a[1] + 30); ctx.stroke(); }
      }
    },
    drawOver(ctx, t) {
      const gl = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, W * 0.75);
      gl.addColorStop(0, 'rgba(150,0,0,0.1)'); gl.addColorStop(1, `rgba(120,0,0,${0.55 + 0.15 * Math.sin(t * 2)})`);
      ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    },
    hotspots: [
      {
        id: 'back', rect: [330, 470, 300, 70], label: '退回轉角', cursor: 'back',
        click: (g) => { redStep(g); g.go('l0_red', { msg: '你把鞋底從地毯上扯下來，一步一步退回去。' }); },
      },
      {
        id: 'radio_room', rect: bounds(redRadioDoor, 4), label: '左牆裂開的暗紅門洞', cursor: 'go',
        click: (g) => { redStep(g); g.go('l0_red_radio'); },
      },
      {
        id: 'nest_room', rect: bounds(redNestDoor, 4), label: '右牆長滿菌絲的裂口', cursor: 'go',
        click: (g) => { redStep(g); g.go('l0_red_nest'); },
      },
      {
        id: 'pack', rect: boxRect(redPack, 8), label: '被黑霉包住的背包', cursor: 'look',
        click: (g) => {
          if (g.s.flags.red_pack_looted) { g.sfx('static'); return g.say('背包空了。掛在肩帶上的無線電還開著，喇叭裡只剩沙沙聲。'); }
          g.flag('red_pack_looted'); g.sfx('static');
          g.give('knife'); g.give('bar');
          g.read('n_meg_red', () => g.say('背包裡有一把折疊刀和一條還沒拆的能量棒。肩帶上的無線電還開著——沙沙聲裡，偶爾有一個字。'));
        },
      },
      {
        id: 'shroom', when: (s) => !s.flags.red_shroom_cut, rect: bounds([P(hallShroom[0] - 0.3, 0.7, hallShroom[1]), P(hallShroom[0] + 0.3, 1, hallShroom[1])], 10), label: '牆根鼓起的菌囊', cursor: 'look',
        click: (g) => g.say('牆根長出一顆拳頭大的菌囊，像心臟一樣慢慢地脹、慢慢地縮。半透明的皮底下，裹著一個瓶子的形狀。徒手撕不開。'),
        use: {
          knife: (g) => {
            g.flag('red_shroom_cut'); g.sfx('steam');
            g.give('almond');
            g.say('你把刀插進菌囊。它像氣球一樣洩了，噴出一股溫熱的臭氣。裡面是一瓶還封著的杏仁水——不知道是從哪一層掉進來，被它吞下去的。');
          },
        },
      },
      { ...FORWARD('l0_red_core', '往更深處走'), click: (g) => { redStep(g); g.go('l0_red_core'); } },
    ],
  },

  l0_red_radio: {
    level: '0-red', title: '中繼死角', room: l0RedRadio, trap: redTrap, hazard: redHazard,
    viewMsg: '觀景窗裡，三個背對你的人影正低頭對著牆面刻「正」字，一筆接一筆。',
    enter(g, { first }) {
      g.sfx('static');
      if (first) g.say('一間逼仄的暗紅死角。M.E.G. 失聯小隊在木箱上架了臨時中繼電台，牆上密密麻麻刻滿凌亂的「正」字。');
    },
    draw(ctx, t, s, R) {
      drawTally(ctx, R, 19, -1.05, -0.55, 4.48, 0.36, shade(R, '#2c0704', 4.4));
      box(ctx, R, redRelayCrate);
      box(ctx, R, redRelayBox);
      const led = P(-0.05, 0.36, 2.5);
      ctx.fillStyle = s.flags.red_anchored ? '#44d678' : ((t * 3 | 0) % 2 ? '#ff4430' : '#6a120a');
      ctx.beginPath(); ctx.arc(led[0], led[1], 4, 0, Math.PI * 2); ctx.fill();
      paper(ctx, R, redRadioNote, 2.1, '#dfd2be');
    },
    drawOver(ctx, t) {
      const gl = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, W * 0.72);
      gl.addColorStop(0, 'rgba(130,0,0,0.08)'); gl.addColorStop(1, `rgba(110,0,0,${0.5 + 0.12 * Math.sin(t * 2.2)})`);
      ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    },
    drawView(ctx) {
      ctx.save(); ctx.fillStyle = 'rgba(255,140,120,0.22)';
      for (const x of [-0.65, 0, 0.65]) {
        const p = P(x, 1, 3.8), h = 115;
        ctx.beginPath(); ctx.arc(p[0], p[1] - h, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(p[0] - 18, p[1] - h + 16, 36, h - 16);
      }
      ctx.restore();
    },
    hotspots: [
      {
        id: 'back', rect: [330, 470, 300, 70], label: '退回黏稠走廊', cursor: 'back',
        click: (g) => { redStep(g); g.go('l0_red_hall'); },
      },
      {
        id: 'relay', rect: boxRect(redRelayBox, 12), label: 'M.E.G. 中繼電台', cursor: 'look',
        click: (g) => {
          if (g.s.flags.red_anchored) return g.closeup('l0_red_relay', { msg: '電台裡的真空管已經燒黑了，這一趟沒辦法再穩住一次。快走！' });
          g.flag('red_anchored', true); g.flag('red_x', 0); g.sfx('ok');
          g.closeup('l0_red_relay', { msg: '你把旋鈕調回 60Hz 的嗡嗡聲頻率。喇叭爆出一聲清脆的回音，周圍收緊的紅光明顯頓了一下——你重新搶回完整的逃生秒數！' });
        },
      },
      { id: 'transcript', rect: bounds(redRadioNote, 8), label: '失聯小隊錄音謄本', cursor: 'look', click: (g) => g.read('n_red_radio') },
    ],
  },

  l0_red_nest: {
    level: '0-red', title: '深紅菌巢', room: l0RedNest, trap: redTrap, hazard: redHazard,
    viewMsg: '觀景窗裡，整間房間的菌壁都在同一個節拍下緩慢收縮。',
    enter(g, { first }) {
      g.sfx('sting');
      if (first) g.say('裂口後面是一間被暗紅菌毯完全包覆的死室。遠牆半吞著一只結實的物資箱，空氣裡浮滿發燙的紅孢子。');
    },
    draw(ctx, t, s, R) {
      for (const [x, z] of [[-1.1, 1.8], [-1.0, 2.9], [1.05, 2.1], [1.15, 3.2], [-0.85, 3.8], [0.9, 4.0]]) {
        const p = P(x, 1, z), r = 34 / z, k = 1 + 0.05 * Math.sin(t * 2.8 + z);
        ctx.fillStyle = shade(R, '#881f14', z);
        ctx.beginPath(); ctx.ellipse(p[0], p[1] - r, r * 1.4 * k, r * k, 0, Math.PI, 0); ctx.fill();
      }
      box(ctx, R, redWallCrate);
      if (!s.flags.red_nest_cut) {
        const cb = boxRect(redWallCrate);
        ctx.strokeStyle = 'rgba(170,35,20,0.85)'; ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(cb[0] + (i * cb[2]) / 4, cb[1]);
          ctx.lineTo(cb[0] + ((4 - i) * cb[2]) / 4, cb[1] + cb[3]);
          ctx.stroke();
        }
      }
    },
    drawOver(ctx, t) {
      const gl = ctx.createRadialGradient(W / 2, H / 2, 45, W / 2, H / 2, W * 0.72);
      gl.addColorStop(0, 'rgba(160,10,10,0.12)'); gl.addColorStop(1, `rgba(120,0,0,${0.58 + 0.16 * Math.sin(t * 2.6)})`);
      ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    },
    drawView(ctx, t) {
      ctx.save(); ctx.strokeStyle = 'rgba(255,110,90,0.35)'; ctx.lineWidth = 2;
      const r = 40 + ((t * 90) % 210);
      ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    },
    hotspots: [
      {
        id: 'back', rect: [330, 470, 300, 70], label: '退回黏稠走廊', cursor: 'back',
        click: (g) => { redStep(g); g.go('l0_red_hall'); },
      },
      {
        id: 'wall_crate', rect: boxRect(redWallCrate, 12), label: '半融在菌壁裡的物資箱', cursor: 'look',
        click: (g) => {
          if (g.s.flags.red_nest_cut) return g.say('物資箱已經被你剖空，剩下的木板正慢慢沉進菌壁裡。');
          g.sanity(-5); g.sfx('sting');
          g.say('箱子裹滿了暗紅色的黏膜，手指一扯就被滾燙的孢子灼得生疼。需要用折疊刀割開！');
        },
        use: {
          knife: (g) => {
            if (g.s.flags.red_nest_cut) return g.say('箱子裡已經空了。');
            g.flag('red_nest_cut'); g.sfx('steam');
            g.give('almond');
            g.read('n_red_nest', () => g.say('你用折疊刀切開厚厚的菌膜，拉出一瓶密封杏仁水與一頁殘留的調查簡報。快撤！'));
          },
        },
      },
      {
        id: 'spores', rect: [60, 210, 175, 190], label: '搏動的暗紅菌蓋', cursor: 'look',
        click: (g) => g.say('整片牆根的菌蓋都在一下一下鼓脹，像是在替整條紅房間呼吸。'),
      },
    ],
  },

  l0_red_core: {
    level: '0-red', title: '血肉盡頭', room: l0RedCore, trap: redTrap, hazard: redHazard,
    viewMsg: '螢幕整片都是紅的。喇叭裡傳出一下、一下的心跳聲——不是你的。',
    enter(g) {
      g.sfx('sting'); g.sanity(-10);
      g.say('走廊在這裡結束了。盡頭的牆已經不是牆，是一大片暗紅色的肉，正在一下一下地起伏。你的每一根神經都在尖叫。');
    },
    draw(ctx, t, s, R) {
      poly(ctx, redCystQuad, shade(R, '#380a06', 4.9));
      const c = P(0, 0.2, 4.9);
      const pulse = s.flags.red_core_looted ? 0.85 : 1 + 0.1 * Math.sin(t * 3.5);
      ctx.fillStyle = shade(R, '#75180f', 4.8);
      ctx.beginPath(); ctx.ellipse(c[0], c[1], 80 * pulse, 95 * pulse, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = shade(R, '#280503', 4.7);
      ctx.beginPath(); ctx.ellipse(c[0], c[1], 45 * pulse, 55 * pulse, 0, 0, Math.PI * 2); ctx.fill();
    },
    drawOver(ctx, t) {
      const gl = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.7);
      gl.addColorStop(0, 'rgba(180,10,10,0.15)'); gl.addColorStop(1, `rgba(140,0,0,${0.65 + 0.2 * Math.sin(t * 3.5)})`);
      ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    },
    hotspots: [
      {
        id: 'back', rect: [330, 470, 300, 70], label: '往回跑', cursor: 'back',
        click: (g) => { redStep(g); g.go('l0_red_hall', { msg: '你轉身就跑。鞋底黏在地毯上，你連鞋帶一起扯了下來。' }); },
      },
      {
        id: 'walk_in', rect: [330, 140, 300, 180], label: '起伏的肉牆', cursor: 'go',
        click: (g) => g.end('red'),
      },
      {
        id: 'cyst', when: (s) => !s.flags.red_core_looted, rect: bounds(faceQuad(-0.35, 0.05, 0.35, 0.55, 4.9), 6), label: '肉牆中間的菌囊', cursor: 'look',
        click: (g) => g.closeup('l0_red_flesh', { msg: '肉牆正中間鼓起一顆大菌囊。裡面裹著一個方方正正的東西，像一本對折的筆記本。手一靠近，它就收縮一下。' }),
        use: {
          knife: (g) => {
            g.flag('red_core_looted'); g.sfx('steam');
            g.read('n_red_truth', () => g.say('紙上的字有一半被泡爛了。你把它塞進口袋。肉牆的起伏慢了下來——像是在等你。'));
          },
        },
      },
    ],
  },

  l0_stairs: {
    level: 0, title: '樓梯間', room: l0Stairs,
    viewMsg: '觀景窗裡，樓梯的階數和肉眼數的不一樣。',
    enter(g, { first }) {
      if (first) g.say('一座窄窄的樓梯往上延伸，穿過天花板。右邊的欄杆旁，另一道樓梯往下，沒入黑暗。');
    },
    draw(ctx, t, s, R) {
      poly(ctx, [P(-0.95, -1, 4.9), P(0.15, -1, 4.9), P(0.15, -1, 5.6), P(-0.95, -1, 5.6)], '#0d0b05');
      for (const b of stairsUp) box(ctx, R, b);
      poly(ctx, stairsDown, '#0a0804');
      for (let i = 1; i < 6; i++) {
        const z = 1.9 + i * 0.25, k = i / 6;
        seg(ctx, P(0.55, 1, z), P(1.45, 1, z), `rgba(150,130,70,${0.35 * (1 - k)})`, 2);
      }
      seg(ctx, railTop[0], railTop[1], shade(R, '#6b5a2e', 2.6), 4);
      for (const z of [1.9, 2.65, 3.4]) seg(ctx, P(0.5, 0.35, z), P(0.5, 1, z), shade(R, '#6b5a2e', z), 3);
    },
    hotspots: [
      BACK('l0_pillar'),
      { id: 'up', rect: bounds(stairsUp.flatMap((b) => [P(b.x1, b.y1, b.z1), P(b.x2, 1, b.z1)]), 6), label: '往上走', cursor: 'go', click: (g) => g.go('l0_arches', { msg: '你一階一階往上爬，爬了比天花板高得多的距離。' }) },
      {
        id: 'down', rect: bounds(stairsDown, 4), label: '往下走', cursor: 'go',
        click: (g) => { g.s.holes = { row: 0, pits: newHoleRow() }; g.go('l0_holes'); },
      },
      {
        id: 'steps', rect: [140, 300, 120, 60], label: '數一數階數', cursor: 'look',
        click: (g) => {
          const n = 11 + Math.floor(rand() * 7);
          g.say(`你數了一下，一共 ${n} 階。${g.s.flags.stairs_counted ? `上次數的時候是 ${g.s.flags.stairs_counted} 階。` : ''}`);
          g.flag('stairs_counted', n);
        },
      },
    ],
  },

  l0_arches: {
    level: '0-arches', title: '拱門主廳', room: l0Arches,
    viewMsg: '觀景窗裡和肉眼看到的一模一樣。這裡，大概是這一層最穩定的地方。',
    enter(g, { first }) {
      if (first) g.say('牆是淡淡的米白色，開滿了拱形的門洞。地毯又深又濕，可是這裡……很安靜。好像什麼都不會再變了。');
    },
    draw(ctx, t, s, R) {
      for (const a of [...archesL, ...archesR]) {
        poly(ctx, a, rgb(mul(hex(R.pal.fog), 1.4)));
        ctx.strokeStyle = shade(R, '#b8ad82', 3); ctx.lineWidth = 2; poly(ctx, a); ctx.stroke();
      }
      poly(ctx, archBack, rgb(mul(hex(R.pal.fog), 1.2)));
      ctx.strokeStyle = shade(R, '#b8ad82', 6); ctx.lineWidth = 2; poly(ctx, archBack); ctx.stroke();
      if (!s.flags.archive_open) {
        poly(ctx, archDoor, shade(R, '#8a6a42', 4.4));
        ctx.strokeStyle = shade(R, '#4a3820', 4.4); ctx.lineWidth = 2; poly(ctx, archDoor); ctx.stroke();
        const k = P(1.8, 0.25, 4.15); ctx.fillStyle = shade(R, '#d8c08a', 4.2); ctx.fillRect(k[0] - 2, k[1] - 3, 4, 6);
      }
      const c = P(-1.2, 1, 2.3);
      ctx.fillStyle = 'rgba(40,50,40,0.18)'; ctx.beginPath(); ctx.ellipse(c[0] + 60, c[1], 120, 16, 0, 0, Math.PI * 2); ctx.fill();
    },
    hotspots: [
      { ...BACK('l0_stairs', '走下樓梯'), click: (g) => g.go('l0_stairs') },
      {
        id: 'rest', rect: bounds(archesL[0], 6), label: '靠在拱門下休息', cursor: 'look',
        click: (g) => {
          const last = g.s.flags.rest_at;
          if (last !== undefined && g.s.moves - last < REST_EVERY) return g.say('你才剛休息過。再坐下去，你怕自己會不想站起來。');
          g.flag('rest_at', g.s.moves);
          g.sanity(25); g.drink(-8); g.eat(-8);
          g.checkpoint();
          g.say('你靠著拱門坐下，閉上眼睛。醒來時，房間還是原來的樣子——在這一層，這已經是奇蹟了。只是睡了一覺，又更渴、更餓了。（這裡記住了你的位置。）');
        },
      },
      {
        id: 'door', rect: bounds(archDoor, 4), label: '拱門裡的木門', cursor: 'go',
        click: (g) => {
          if (!g.s.flags.archive_open) return g.say('只有這一道拱門裝了門。門上了鎖，鑰匙孔是黃銅的。');
          g.go('l0_archive');
        },
        use: {
          key: (g) => {
            if (g.s.flags.archive_open) return g.say('門已經開了。');
            g.take('key'); g.flag('archive_open'); g.sfx('open');
            g.say('鑰匙轉得很順，像是常常有人來開。門後飄出一股舊紙張的味道。');
          },
        },
      },
      {
        id: 'arch', rect: bounds(archBack, 6), label: '穿過對面的深處拱門', cursor: 'go',
        click: (g) => g.go('l0_arch_cloister', { msg: '你穿過米白拱門。一道又一道同樣弧度的拱頂往前延伸，安靜得能聽見遠處滴水。' }),
      },
    ],
  },

  l0_arch_cloister: {
    level: '0-arches', title: '無盡拱廊', room: l0ArchCloister,
    viewMsg: '觀景窗裡的拱廊筆直對齊，左邊拱門透出冷藍水氣，右邊拱門飄著微弱的舊紙反光。',
    enter(g, { first }) {
      if (first) g.say('淡米白色的圓拱左右成排。這裡的日光燈既不閃爍，也沒有刺耳的嗡鳴。左右各有一道較寬的拱洞。');
    },
    draw(ctx, t, s, R) {
      for (const a of [...archesL, ...archesR]) {
        poly(ctx, a, rgb(mul(hex(R.pal.fog), 1.35)));
        ctx.strokeStyle = shade(R, '#c2b890', 3); ctx.lineWidth = 2; poly(ctx, a); ctx.stroke();
      }
      poly(ctx, archBack, rgb(mul(hex(R.pal.fog), 1.25)));
      ctx.strokeStyle = shade(R, '#c2b890', 6); ctx.lineWidth = 2; poly(ctx, archBack); ctx.stroke();
      paper(ctx, R, archSketchQuad, 6.8, '#efe8d2');
      const lp = P(-1.8, 0.2, 2.6), rp = P(1.8, 0.2, 2.6);
      glow(ctx, lp[0] + 24, lp[1], 44, '#a6d8d4', 0.22);
      glow(ctx, rp[0] - 24, rp[1], 44, '#ffe6b0', 0.2);
    },
    hotspots: [
      BACK('l0_arches', '回到拱門主廳'),
      { id: 'pool_arch', rect: bounds(archesL[0], 6), label: '左邊帶著水氣的拱門', cursor: 'go', click: (g) => g.go('l0_arch_pool') },
      { id: 'cat_arch', rect: bounds(archesR[0], 6), label: '右邊飄著紙味的拱門', cursor: 'go', click: (g) => g.go('l0_arch_catalog') },
      { id: 'sketch', rect: bounds(archSketchQuad, 12), label: '貼在遠牆的建築速寫', cursor: 'look', click: (g) => g.read('n_arch_sketch') },
      {
        id: 'echo', rect: [410, 210, 140, 120], label: '在拱廊中央拍手聽回音', cursor: 'look',
        click: (g) => {
          g.sfx('knock');
          g.flag('arch_echo');
          g.say('清脆的掌聲沿著拱頂盪開——左邊的回音低沉濕潤（後面是座積水池），右邊的回音乾淨短促（後面是編目索引室）。');
        },
      },
    ],
  },

  l0_arch_pool: {
    level: '0-arches', title: '拱頂積水池', room: l0ArchPool,
    viewMsg: '觀景窗對著水面拍下去——倒影裡終於有你自己，只是臉仍舊失焦。',
    enter(g, { first }) {
      if (first) g.say('米白拱門圍出一座清淺的水池，頭頂兩盞燈穩穩亮著。這裡的水清澈無味，沒有黃地毯那股霉氣。');
    },
    draw(ctx, t, s, R) {
      for (const a of [archesL[0], archesR[0]]) {
        poly(ctx, a, rgb(mul(hex(R.pal.fog), 1.3)));
        ctx.strokeStyle = shade(R, '#b4b29c', 3); ctx.lineWidth = 2; poly(ctx, a); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(130,175,175,0.28)';
      ctx.beginPath(); ctx.ellipse(archPoolC[0], archPoolC[1], 210, 32, 0, 0, Math.PI * 2); ctx.fill();
      const ph = (t * 0.45) % 1;
      ctx.strokeStyle = `rgba(220,245,245,${0.32 * (1 - ph)})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(archPoolC[0], archPoolC[1], 24 + ph * 145, 4 + ph * 20, 0, 0, Math.PI * 2); ctx.stroke();
      box(ctx, R, archRack);
      if (!s.flags.arch_pool_water) {
        const bp = P(1.38, 0.42, 2.55);
        bottle(ctx, R, bp[0], bp[1], 32, 2.55);
      }
      paper(ctx, R, archPoolNote, 2.3, '#f0ece0');
    },
    hotspots: [
      BACK('l0_arch_cloister', '回到無盡拱廊'),
      { id: 'pool_note', rect: bounds(archPoolNote, 10), label: '池邊牆上的字條', cursor: 'look', click: (g) => g.read('n_arch_pool') },
      {
        id: 'rack', rect: boxRect(archRack, 10), label: '水邊木架', cursor: 'take',
        click: (g) => {
          if (g.s.flags.arch_pool_water) return g.say('木架上只剩一條摺得整整齊齊的乾毛巾。');
          g.flag('arch_pool_water');
          g.give('almond', '木架上留著一瓶沒開過、乾乾淨淨的杏仁水。');
        },
      },
      {
        id: 'pool', rect: [archPoolC[0] - 160, archPoolC[1] - 26, 320, 52], label: '清淺的積水池', cursor: 'look',
        click: (g) => {
          if (!g.s.flags.arch_pool_calm) {
            g.flag('arch_pool_calm'); g.sanity(10); g.sfx('drip');
            return g.closeup('l0_arch_pool_cu', { msg: '你捧起冰涼的清水拍在臉上。水面映出你的輪廓，心情跟著平靜了下來。（清醒度 +10）' });
          }
          g.closeup('l0_arch_pool_cu', { msg: '水波一圈圈散開。這裡安靜得讓人幾乎忘了外面的黃色走廊。' });
        },
      },
    ],
  },

  l0_arch_catalog: {
    level: '0-arches', title: '編目索引室', room: l0ArchCatalog,
    viewMsg: '觀景窗透過右側毛玻璃望進去，隔壁上鎖的檔案室裡，有一個標著 0120 的抽屜正靜靜發亮。',
    enter(g, { first }) {
      if (first) g.say('一間沒有上鎖的小前廳，左邊排著木製索引卡片櫃，右牆嵌著一道隔開隔壁檔案室的毛玻璃窗。');
    },
    draw(ctx, t, s, R) {
      box(ctx, R, catCabinet);
      for (let i = 1; i < 4; i++) {
        const y = -0.25 + i * 0.3;
        seg(ctx, P(-0.92, y, 2.1), P(-0.92, y, 3.3), shade(R, '#4a3822', 2.4), 1.5);
      }
      poly(ctx, catWindow, 'rgba(210,220,210,0.22)');
      outline(ctx, catWindow, shade(R, '#88826a', 2.8), 2);
    },
    drawView(ctx) {
      const c = P(1.5, -0.08, 2.75);
      glow(ctx, c[0] - 22, c[1], 36, '#b8ffd0', 0.4);
      txt(ctx, '0120', c[0] - 26, c[1] + 4, CHALK, 13, 'right');
    },
    hotspots: [
      BACK('l0_arch_cloister', '回到無盡拱廊'),
      {
        id: 'index_cards', rect: boxRect(catCabinet, 10), label: '木製索引卡片櫃', cursor: 'look',
        click: (g) => g.read('n_arch_index'),
      },
      {
        id: 'glass_win', rect: bounds(catWindow, 8), label: '通往隔壁檔案室的毛玻璃窗', cursor: 'look',
        click: (g) => g.say(g.s.view
          ? '透過觀景窗，你隔著玻璃清楚看見隔壁檔案室裡寫著「0120」的空抽屜——而它的鑰匙就藏在低矮房間上方、天花板夾層的通風管裡。'
          : '毛玻璃後面排著一列鐵灰色檔案櫃，看得出那就是隔壁上鎖的檔案室。'),
      },
    ],
  },

  l0_holes: {
    level: '0-holes', title: '格狀坑陣', room: l0Holes, hazard: holesHazard,
    viewMsg: '夜視模式下，坑洞的垂直混凝土井壁清楚了一點，最底下隱約透出不自然的幽綠微光。',
    enter(g, { first }) {
      pitEchoT = 7 + rand() * 4;
      const h = g.s.holes || { row: HOLE_ROWS, pits: [false, false, false] };
      if (h.row >= HOLE_ROWS) return;
      if (first) g.say(`樓梯盡頭是一大片被鑿開的格狀陷坑廳，冷風夾著悶響從黑洞裡直往上灌。燈光只照得到眼前一排：${holeText(h.pits)}`);
      else if (h.row === 0) g.say(`又是那片深不見底的陷坑廳。眼前這一排，${holeText(h.pits)}`);
    },
    update(g, dt) {
      pitEchoT -= dt;
      if (pitEchoT <= 0) {
        pitEchoT = 8 + rand() * 5;
        g.sfx('knock');
        g.say('遠遠的坑底傳來一聲模糊的回音——像有人在幾十公尺下輕敲牆壁，又像一句含糊的「……有人嗎？」');
      }
    },
    draw(ctx, t, s, R) {
      const h = s.holes || { row: 0, pits: [false, false, false] };
      if (h.row >= HOLE_ROWS) {
        box(ctx, R, ledge);
        if (!s.flags.holes_bag) drawBag(ctx, R, bag, { stripe: '#d4c08a' });
        poly(ctx, faceQuad(0.7, -0.5, 1.3, 1, 6.999), '#050402');
        poly(ctx, holeCatwalkDoor, '#16130a');
        outline(ctx, holeCatwalkDoor, shade(R, '#b8a048', 2.8), 2);
        const cd = bounds(holeCatwalkDoor);
        txt(ctx, '懸壁窄道', cd[0] + cd[2] * 0.5, cd[1] + 22, '#e2d088', 10);
        drawPitUpdraft(ctx, t, 10);
        return;
      }
      // Deep 3D shaft pits in far rows and current row
      for (const [lane, z1, z2] of farPits) drawPitShaft(ctx, lane, z1, z2, R);
      LANES.forEach((lane, i) => {
        if (h.pits[i]) drawPitShaft(ctx, lane, 1.7, 2.5, R);
      });
      // Peeling yellow-black caution strip along the right inspection rim
      const pr = peekPitRect;
      ctx.save();
      ctx.fillStyle = 'rgba(20,18,12,0.72)'; ctx.fillRect(pr[0] + 18, pr[1] + 38, pr[2] - 32, 34);
      ctx.strokeStyle = '#d4b438'; ctx.lineWidth = 2; ctx.strokeRect(pr[0] + 18, pr[1] + 38, pr[2] - 32, 34);
      txt(ctx, '俯瞰坑口', pr[0] + pr[2] * 0.52, pr[1] + 59, '#f0e09a', 10);
      ctx.restore();
      drawPitUpdraft(ctx, t, 14);
      // when the light dips, the floor and the pits are the same black
      if (holesFlick(t) < 0.5) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, P(0, 1, R.depth)[1], W, H);
      }
    },
    hotspots: [
      {
        id: 'back', rect: [330, 470, 300, 70], label: '回到樓梯', cursor: 'back',
        click: (g) => {
          const across = g.s.holes?.row >= HOLE_ROWS;
          g.s.holes = null;
          g.go('l0_stairs', { msg: across ? '你回頭時，坑洞的排列已經全變了——靠牆的地方剛好空出一條路。你貼著牆走回樓梯口。' : '你小心翼翼地退回樓梯口。' });
        },
      },
      ...LANES.map((lane) => ({
        id: lane, when: (s) => s.holes && s.holes.row < HOLE_ROWS, rect: bounds(laneTile(lane), 4),
        label: `往${LANE_ZH[lane]}跨一步`, cursor: 'go',
        click: (g) => holeStep(g, lane),
        use: {
          rod: (g) => g.say(g.s.holes.pits[LANES.indexOf(lane)]
            ? '你用吊桿往前探——戳了個空。整根桿子伸下去，什麼都碰不到，只有冰冷的上升氣流。'
            : '你用吊桿往前探，桿尖敲到了地毯底下硬硬的地板。'),
          ladder: (g) => {
            if (!g.s.holes.pits[LANES.indexOf(lane)]) return g.say('那裡是地板，用不著梯子。');
            g.sfx('click');
            g.say('你把梯子橫架在坑口上，一格一格爬過去，再把梯子拉回來。');
            holeStep(g, lane, true);
          },
          almond_wet: (g) => {
            if (!g.s.holes.pits[LANES.indexOf(lane)]) return g.say('那裡是地板，不是坑。');
            g.take('almond_wet');
            g.say('你把那瓶濕掉的杏仁水丟進坑裡，豎起耳朵等。……一直等。始終沒有聽到落地的聲音。');
            if (!g.s.flags.holes_drop) { g.flag('holes_drop'); g.sanity(-3); }
          },
        },
      })),
      {
        id: 'peek_pit', when: (s) => s.holes && s.holes.row < HOLE_ROWS, rect: peekPitRect, label: '貼著警示帶俯瞰坑底', cursor: 'look',
        click: (g) => g.closeup('l0_pit_edge', {
          msg: g.s.view
            ? '觀景窗裡，坑底幽綠屋頂上方的垂直井壁邊，竟貼著一道細長漆黑的輪廓！'
            : '四面黃灰混凝土井壁一路垂直下沉，深得讓人眩暈——極遠的底端竟透出詭異的幽綠燈光，像有屋頂埋在底下。',
        }),
      },
      {
        id: 'catwalk', when: (s) => s.holes?.row >= HOLE_ROWS, rect: bounds(holeCatwalkDoor, 6), label: '左牆深處的貼壁窄道', cursor: 'go',
        click: (g) => g.go('l0_hole_ledge', { msg: '你側身踏上左牆邊那條狹窄的水泥沿，腳邊就是黑壓壓的無底深淵。右側牆壁釘著一台生鏽的手動垂降絞盤。' }),
      },
      {
        id: 'passage', when: (s) => s.holes?.row >= HOLE_ROWS, rect: bounds(faceQuad(0.7, -0.5, 1.3, 1, 6.999), 10), label: '對面牆上的黑洞', cursor: 'go',
        click: (g) => { g.s.holes = null; g.s.bo = { step: 0, dir: pick(['left', 'ahead', 'right']) }; g.go('l0_blackout', { msg: '你走進對面牆上的洞口。燈光在身後一下子就消失了。' }); },
      },
      {
        id: 'bag', when: (s) => s.holes?.row >= HOLE_ROWS && !s.flags.holes_bag, rect: boxRect(bag, 8), label: '帆布背包', cursor: 'take',
        click: (g) => {
          g.flag('holes_bag'); g.give('almond'); g.give('almond'); g.give('bar');
          g.say('背包裡有兩瓶沒開過的杏仁水、一條能量棒，還有一本被翻爛的筆記本。');
          g.read('n0g');
        },
      },
    ],
  },

  l0_hole_ledge: {
    level: '0-holes', title: '貼壁窄道與絞盤', room: l0HoleLedge,
    viewMsg: '觀景窗往下照去，尼龍測深繩直墜黑暗；右牆那台手動絞盤的鋼索一直連進十幾公尺下的坑壁暗格。',
    enter(g, { first }) {
      if (first) g.say('整間房間的地板幾乎全塌了，只剩貼著牆壁一尺寬的水泥沿。左邊是測深繩與被撞歪的警示錐，右邊牆上固定著一台生鏽的手動垂降絞盤。');
    },
    draw(ctx, t, s, R) {
      // Deep layered abyss across center floor with faint green glimmer far below
      const abyss = [P(-1.15, 1, 1.3), P(1.15, 1, 1.3), P(1.15, 1, 6.8), P(-1.15, 1, 6.8)];
      poly(ctx, abyss, '#020303');
      glow(ctx, 480, 395, 95, '#46b898', 0.14);
      outline(ctx, abyss, shade(R, '#887434', 3), 2);
      // Rope post & taut sounding rope on left
      box(ctx, R, ropePost);
      const rp = P(-1.35, 0.5, 2.35), drop = P(-0.85, 1, 2.55);
      seg(ctx, rp, drop, '#d8d2b4', 3);
      seg(ctx, drop, [drop[0], H], '#8a8672', 2);
      // Tilted hazard caution cone & skid marks near rim
      drawCone(ctx, R, holeCone);
      // Heavy industrial winch drum on right wall
      poly(ctx, holeWinch, s.flags.hole_winch_unlocked ? '#445848' : '#584438');
      outline(ctx, holeWinch, s.flags.hole_winch_unlocked ? '#8ce0a8' : '#b28466', 2);
      const wb = bounds(holeWinch);
      txt(ctx, s.flags.hole_winch_unlocked ? '絞盤已鬆開' : '垂降絞盤', wb[0] + wb[2] * 0.5, wb[1] + 24, '#ece4d0', 9);
      if (s.flags.hole_winch_unlocked) {
        // Steel cable lowered straight down into the shaft + glowing yellow worklamp
        const cTop = [wb[0] + wb[2] * 0.35, wb[1] + wb[3] * 0.72];
        seg(ctx, cTop, [720, 455], '#b8c4c8', 3.5);
        glow(ctx, 720, 400, 56, '#ffd878', 0.34);
        txt(ctx, '▼ 沿鋼索垂降', 722, 412, '#fff0b8', 11);
      }
      drawPitUpdraft(ctx, t, 14);
    },
    hotspots: [
      {
        id: 'back', rect: [330, 470, 300, 70], label: '退回格狀坑陣', cursor: 'back',
        click: (g) => { g.s.holes = { row: HOLE_ROWS, pits: [false, false, false] }; g.go('l0_holes'); },
      },
      FORWARD('l0_hole_bridge', '沿窄道走向橫樑危橋', [380, 170, 200, 140]),
      {
        id: 'rope', rect: boxRect(ropePost, 14), label: '綁著測深繩的鐵樁', cursor: 'look',
        click: (g) => {
          g.sfx('clank');
          g.read('n_holes_rope', () => g.say('你拉了拉尼龍繩。底下沉甸甸的，卻拉不上來——彷彿繩頭正緩緩往下墜。'));
        },
      },
      {
        id: 'caution_cone', rect: boxRect(holeCone, 10), label: '撞歪的黃色警示錐', cursor: 'look',
        click: (g) => g.say('警示錐被猛地撞偏了一半，旁邊水泥地上留著兩道急煞般的鞋跟刮痕，直直滑出坑緣。上一個在這裡滑倒的人……大概沒來得及抓住欄杆。'),
      },
      {
        id: 'winch', rect: bounds(holeWinch, 8), label: '手動垂降絞盤', cursor: 'look',
        click: (g) => {
          if (g.s.flags.hole_winch_unlocked) return g.say('絞盤的棘輪已經鬆開，鋼索正垂進底下的垂直坑道裡。');
          if (!g.s.flags.hole_winch_tried) {
            g.flag('hole_winch_tried'); g.sfx('clank');
            return g.say('生鏽的棘輪卡得很死，鋼索暫時放不下去。可以用金屬吊桿或扳手撬開，或者再咬牙硬拉一次試試。');
          }
          g.flag('hole_winch_unlocked'); g.sanity(-3); g.sfx('open');
          g.say('你雙手抵住鐵架死命一拉——鏽蝕的棘輪「喀」地鬆開！鋼索帶著吊燈一路垂進十幾公尺下的坑壁暗格，現在可以沿鋼索垂降下去了。');
        },
        use: {
          rod: (g) => {
            if (g.s.flags.hole_winch_unlocked) return g.say('絞盤已經放下去了。');
            g.flag('hole_winch_unlocked'); g.sfx('open');
            g.say('你把金屬吊桿插進棘輪縫裡輕輕一撬——鏽扣應聲彈開，鋼索穩穩垂進坑壁中段！');
          },
          wrench: (g) => {
            if (g.s.flags.hole_winch_unlocked) return g.say('絞盤已經放下去了。');
            g.flag('hole_winch_unlocked'); g.sfx('open');
            g.say('扳手一口咬住鏽死的六角栓——轉了半圈後棘輪鬆脫，鋼索帶著吊燈順利垂進坑壁中段！');
          },
        },
      },
      {
        id: 'descend', when: (s) => !!s.flags.hole_winch_unlocked, rect: holeDescendRect, label: '沿絞盤鋼索垂降至坑壁中段', cursor: 'go',
        click: (g) => g.go('l0_hole_shaft', { msg: '你雙腳蹬著潮濕的混凝土井壁，沿鋼索一點一點降進無底陷坑中段。頭頂的黃光縮成一個遙遠的小方框。' }),
      },
    ],
  },

  l0_hole_shaft: {
    level: '0-holes', title: '坑壁垂降中段', room: l0HoleShaft, quiet: 0.45,
    viewMsg: '觀景窗抬頭照向遙遠的坑口——黃色邊緣好像有個人影正探頭往下看。',
    enter(g, { first }) {
      if (first) g.say('你踩進離坑口十八公尺深的狹窄維修凹室。頭頂高處只剩一格昏黃的方框，左牆的紅燈對講機正沙沙作響，腳邊有扇通往坑底的鐵檢修門。');
    },
    draw(ctx, t, s, R) {
      // Distant blazing yellow square of Level 0 high overhead
      ctx.fillStyle = '#090906'; ctx.fillRect(365, 32, 230, 96);
      const flick = 0.85 + 0.15 * Math.sin(t * 14);
      ctx.fillStyle = `rgba(225,204,112,${0.82 * flick})`; ctx.fillRect(390, 42, 180, 74);
      glow(ctx, 480, 78, 120, '#ffe48a', 0.25 * flick);
      txt(ctx, '▲ 抬頭看坑口', 480, 84, '#2a2410', 11);
      // Taut winch steel cable dropping from overhead
      const sway = Math.sin(t * 1.9) * 5;
      seg(ctx, [425, 116], [420 + sway, 468], '#aeb8bc', 3);
      // Left wall crackling intercom box with red indicator lamp
      poly(ctx, shaftIntercom, '#2e3032');
      outline(ctx, shaftIntercom, '#7a7e82', 2);
      const ib = bounds(shaftIntercom);
      ctx.fillStyle = (t * 2.8 | 0) % 2 ? '#ff4432' : '#5e1410';
      ctx.beginPath(); ctx.arc(ib[0] + ib[2] * 0.72, ib[1] + 22, 4, 0, Math.PI * 2); ctx.fill();
      txt(ctx, '對講機', ib[0] + ib[2] * 0.48, ib[1] + ib[3] * 0.56, '#d8dcd8', 10);
      // Bottom center heavy iron hatch glowing eerie teal-green from below!
      poly(ctx, shaftHatch, '#182422');
      outline(ctx, shaftHatch, '#588c7e', 2.5);
      const hb = bounds(shaftHatch);
      glow(ctx, hb[0] + hb[2] * 0.5, hb[1] + hb[3] * 0.6, 85, '#5ad8b2', 0.28);
      txt(ctx, '▼ 坑底檢修門', hb[0] + hb[2] * 0.5, hb[1] + hb[3] * 0.52, '#a8f0d8', 11);
      drawPitUpdraft(ctx, t, 12);
    },
    hotspots: [
      {
        id: 'back', rect: [330, 470, 300, 70], label: '沿鋼索爬回貼壁窄道', cursor: 'back',
        click: (g) => g.go('l0_hole_ledge', { msg: '你雙手抓緊冰冷鋼索一路蹬牆爬回貼壁窄道，胸口劇烈起伏。' }),
      },
      {
        id: 'look_up', rect: shaftUpRect, label: '抬頭仰望遙遠的坑口', cursor: 'look',
        click: (g) => g.closeup('l0_pit_shaft', { msg: '頭頂十八公尺高的黃色坑口小得像一張郵票——剛才那一秒，似乎有一道黑影貼在坑邊往下張望。' }),
      },
      {
        id: 'shaft_intercom', rect: bounds(shaftIntercom, 8), label: '沙沙作響的坑壁對講機', cursor: 'look',
        click: (g) => {
          g.sfx('static');
          g.read('n_holes_voice');
        },
      },
      {
        id: 'hatch', rect: bounds(shaftHatch, 8), label: '推開透著綠光的坑底檢修門', cursor: 'go',
        click: (g) => g.go('l0_hole_pitroom', { msg: '你扳開生鏽的門閂鑽進坑底——眼前的景象讓你瞬間僵在原地：無底洞最深處，竟然蓋著一條泛著詭異綠光的郊區假街！' }),
      },
    ],
  },

  l0_hole_pitroom: {
    level: '0-holes', title: '坑底偽街廳', room: l0HolePitroom, quiet: 0.4, hazard: pitroomHazard,
    viewMsg: '觀景窗裡，右側暗角牆根閃著一塊寫著「0120」的隱藏排水鐵柵；街尾的黑影則僵硬得像由黑線條拼成。',
    enter(g, { first }) {
      g.flag('pit_dist', 3);
      pitStalkT = 0;
      if (first) g.say('高得看不見頂的漆黑水泥窟裡，竟然立著一排湖水綠色的假民宅外牆與嗡嗡作響的路燈。街盡頭有一道細長怪異的黑影正靜靜對著你——別在這裡久留！');
    },
    update(g, dt) {
      pitStalkT += dt;
      if (pitStalkT < 6.5) return;
      pitStalkT = 0;
      const next = (g.s.flags.pit_dist ?? 3) - 1;
      g.flag('pit_dist', next);
      if (next <= 0) {
        g.flag('pit_dist', 3);
        return g.scare('l0_hole_shaft', '那道細長扭曲的黑影猛地朝你撲來，喉嚨裡爆出扭曲的「有人嗎——」你連滾帶爬撞回坑壁檢修門，死命甩上鐵門！', 14, 'figure');
      }
      g.sfx('knock');
      g.say(next === 2
        ? '街尾的黑影往前跨了一大步，發出走調得像錄音帶卡住的呼喊：「……喂……有人嗎……」'
        : '它已經走進路燈光圈裡了！高得離譜的細長四肢正朝你衝過來——快往回跑！');
    },
    draw(ctx, t, s, R) {
      // Fake teal-green suburban clapboard house facade on left wall
      const hd = bounds(pitHouseDoor);
      poly(ctx, wallQuad(-1.9, -0.95, 1, 1.4, 5.8), '#2e4d46');
      poly(ctx, pitHouseDoor, '#d2dcd8');
      poly(ctx, wallQuad(-1.9, -0.34, 0.94, 2.28, 3.22), '#24423c');
      txt(ctx, '假屋正門', hd[0] + hd[2] * 0.5, hd[1] + 28, '#cfe8e0', 10);
      // Green porch utility box further down left side
      box(ctx, R, pitPorchBox);
      // Buzzing crooked iron streetlamp on right
      const lp = [668, 165], lb = [668, 355];
      seg(ctx, lp, lb, '#283230', 6);
      seg(ctx, lp, [620, 152], '#283230', 4);
      glow(ctx, 616, 162, 118, '#96f0d2', 0.36 + 0.06 * Math.sin(t * 12));
      ctx.fillStyle = '#d4fff0'; ctx.beginPath(); ctx.arc(616, 158, 7, 0, Math.PI * 2); ctx.fill();
      // Sticky warning note taped to lamp post
      ctx.fillStyle = '#ebe4c8'; ctx.fillRect(658, 252, 20, 26);
      // Tall wiry dark stalker silhouette advancing down the fake street based on pit_dist (3 -> 2 -> 1)
      const d = s.flags.pit_dist ?? 3;
      const sz = d >= 3 ? 7.6 : d === 2 ? 5.2 : 3.2;
      const sp = P(0.08, 1, sz);
      const h = 360 / sz;
      const jitter = Math.sin(t * 16) * (4 - d);
      ctx.save();
      ctx.strokeStyle = '#070a09'; ctx.lineWidth = Math.max(4, 20 / sz); ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sp[0] + jitter, sp[1]); ctx.lineTo(sp[0] - h * 0.08, sp[1] - h * 0.45);
      ctx.moveTo(sp[0] + h * 0.12 + jitter, sp[1]); ctx.lineTo(sp[0] + h * 0.06, sp[1] - h * 0.45);
      ctx.moveTo(sp[0], sp[1] - h * 0.42); ctx.lineTo(sp[0] + jitter * 0.6, sp[1] - h * 0.88);
      ctx.moveTo(sp[0] - h * 0.24, sp[1] - h * 0.56); ctx.lineTo(sp[0], sp[1] - h * 0.78); ctx.lineTo(sp[0] + h * 0.26, sp[1] - h * 0.54);
      ctx.stroke();
      ctx.fillStyle = '#050807'; ctx.beginPath(); ctx.ellipse(sp[0] + jitter * 0.8, sp[1] - h * 0.94, h * 0.07, h * 0.1, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // Hidden 0120 drainage grate on right near wall when spotted
      if (s.view || s.flags.hole_grate_found) {
        poly(ctx, pitGrate, '#14201c');
        outline(ctx, pitGrate, '#7cf0c4', 2);
        const gb = bounds(pitGrate);
        txt(ctx, '0120 柵', gb[0] + gb[2] * 0.5, gb[1] + 26, '#a4ffd8', 10);
      }
    },
    drawView(ctx) {
      const gb = bounds(pitGrate);
      glow(ctx, gb[0] + gb[2] * 0.5, gb[1] + gb[3] * 0.5, 45, '#8affcc', 0.35);
      txt(ctx, '0120', gb[0] + gb[2] * 0.5, gb[1] + gb[3] * 0.58, CHALK, 12);
    },
    hotspots: [
      {
        id: 'back', rect: [330, 470, 300, 70], label: '衝回坑壁垂降中段', cursor: 'back',
        click: (g) => { g.flag('pit_dist', 3); g.go('l0_hole_shaft', { msg: '你反手甩上鐵檢修門退回坑壁凹室，外面的嗡嗡聲和怪叫頓時被隔開。' }); },
      },
      {
        id: 'fake_house', rect: bounds(pitHouseDoor, 6), label: '推開湖水綠假屋的正門', cursor: 'look',
        click: (g) => g.closeup('l0_pit_facade', { msg: '門一推開，背後不到一吋就是潮濕發黃的 Level 0 壁紙與實心水泥——整條郊區街道根本只是一層舞台佈景！' }),
      },
      {
        id: 'streetlamp', rect: pitLampRect, label: '嗡嗡作響的路燈與警告紙條', cursor: 'look',
        click: (g) => g.read('n_holes_bottom'),
      },
      {
        id: 'porch_box', rect: boxRect(pitPorchBox, 10), label: '屋簷下的綠色配電箱', cursor: 'take',
        click: (g) => {
          if (g.s.flags.hole_pit_loot) return g.say('配電箱已經搜空了，只剩幾根沒接通的假電線。');
          g.flag('hole_pit_loot'); g.sfx('open');
          g.give('almond'); g.give('bar');
          g.say('你在假配電箱裡翻出前人匆忙藏進去的杏仁水和能量棒。趕快離開這條街！');
        },
      },
      {
        id: 'pit_grate', when: (s) => s.view || s.flags.hole_grate_found, rect: bounds(pitGrate, 8), label: '暗角標著 0120 的排水鐵柵', cursor: 'go',
        click: (g) => {
          g.flag('hole_grate_found'); g.flag('pit_dist', 3); g.sfx('open');
          g.go('l0_hole_nest', { msg: '你掀開標著 0120 的鐵柵鑽進維修豎井，一路沿壁梯爬出地面——竟然直接回到了高空維修中繼台！' });
        },
      },
    ],
  },

  l0_hole_bridge: {
    level: '0-holes', title: '橫樑危橋', room: l0HoleBridge,
    viewMsg: '觀景窗清楚照出左邊鋼樑底部的鏽蝕裂縫——右邊那根鋼樑才是結實的！橋下極深處還能看見幽綠屋頂。',
    enter(g, { first }) {
      if (first) g.say('整段地面徹底鏤空成無底黑坑，只有左右兩根窄鋼樑架向對岸中繼台。冷風呼呼往上灌，走錯一根可能會踩空！');
    },
    draw(ctx, t, s, R) {
      // Deep abyss chasm with faint eerie green roof lights WAY down below
      poly(ctx, [P(-1.75, 1, 1.2), P(1.75, 1, 1.2), P(1.75, 1, 6.8), P(-1.75, 1, 6.8)], '#020303');
      glow(ctx, 480, 385, 110, '#44b894', 0.16 + 0.03 * Math.sin(t * 2));
      // Left rusted steel I-beam (or reinforced if ladder laid)
      poly(ctx, beamLeft, shade(R, s.flags.hole_bridge_ladder ? '#8a8672' : '#6b4836', 2.6));
      outline(ctx, beamLeft, shade(R, s.flags.hole_bridge_ladder ? '#d6d2b8' : '#94684e', 2.6), 2);
      // Flaking rust dust falling off the left beam into the abyss
      if (!s.flags.hole_bridge_ladder) {
        for (let i = 0; i < 6; i++) {
          const p = (t * 0.8 + i * 0.17) % 1;
          const rp = P(-0.6, 1, 2.2 + (i % 3) * 0.6);
          ctx.fillStyle = `rgba(170,104,72,${(1 - p) * 0.7})`;
          ctx.fillRect(rp[0] - 8 + i * 3, rp[1] + p * 65, 2.5, 3);
        }
      }
      // Solid riveted right steel I-beam
      poly(ctx, beamRight, shade(R, '#686e72', 2.6));
      outline(ctx, beamRight, shade(R, '#a6b0b6', 2.6), 2);
      for (let z = 1.8; z < 5.8; z += 0.8) {
        seg(ctx, P(0.38, 1, z), P(0.82, 1, z), shade(R, '#484e52', z), 2);
      }
      drawPitUpdraft(ctx, t, 14);
    },
    drawView(ctx) {
      const l = P(-0.6, 1, 2.5), r = P(0.6, 1, 2.5);
      txt(ctx, '✕ 鏽裂', l[0], l[1] - 18, '#ff7a6a', 13);
      txt(ctx, '✓ 穩固', r[0], r[1] - 18, CHALK, 13);
    },
    hotspots: [
      BACK('l0_hole_ledge', '退回貼壁窄道'),
      {
        id: 'abyss_look', rect: bridgeAbyssRect, label: '探頭俯瞰橋下深淵', cursor: 'look',
        click: (g) => g.closeup('l0_pit_edge', { msg: '你抓住牆角探頭往下望——無底深淵最底端竟透著詭異的幽綠色街燈光，像有一整排假屋埋在下面。也許可以用窄道上的絞盤降下去看看。' }),
      },
      {
        id: 'beam_left', rect: bounds(beamLeft, 4), label: '左邊偏鏽的鋼樑', cursor: 'go',
        click: (g) => {
          if (g.s.flags.hole_bridge_ladder) {
            return g.go('l0_hole_nest', { msg: '你踩著橫架在左樑上的折疊梯穩穩過橋，抵達對岸中繼台。' });
          }
          g.sfx('clank'); g.sanity(-12);
          g.say('你剛踩上去，左邊鋼樑就猛地下沉發出刺耳嘎吱聲！你死抓著邊緣爬回來，心臟差點停掉。');
        },
        use: {
          rod: (g) => { g.sfx('clank'); g.flag('hole_beam_tested'); g.say('吊桿一敲，左樑傳出空洞鬆脫的震響，螺絲早就鏽斷了——千萬別踩這根！'); },
          ladder: (g) => {
            g.flag('hole_bridge_ladder'); g.sfx('click');
            g.go('l0_hole_nest', { msg: '你把鋁製折疊梯平鋪在鏽裂的左鋼樑上分攤重量，穩穩爬過深淵抵達對岸！' });
          },
        },
      },
      {
        id: 'beam_right', rect: bounds(beamRight, 4), label: '右邊灰色的鋼樑', cursor: 'go',
        click: (g) => g.go('l0_hole_nest', { msg: '你屏息踏著結實的右鋼樑一步步挪過去，終於踩上對岸完整的高空維修中繼台。' }),
        use: {
          rod: (g) => { g.sfx('clank'); g.flag('hole_beam_tested'); g.say('吊桿敲出紮實沉悶的金屬聲，右邊這根鋼樑穩得很，可以過！'); },
        },
      },
    ],
  },

  l0_hole_nest: {
    level: '0-holes', title: '高空維修中繼台', room: l0HoleNest,
    viewMsg: '觀景窗裡，這座孤島中繼台與維修鐵梯完全沒有閃動——它是陷坑區裡唯一穩定的結構錨點。',
    enter(g, { first }) {
      if (first) g.say('四面懸空的高空維修中繼台。角落藏著防水鐵盒，左牆釘著 M.E.G. 陷坑垂直剖面圖，正前方是作業照明燈開關，右牆釘著直通樓梯間的維修鐵梯。');
    },
    draw(ctx, t, s, R) {
      if (s.flags.hole_beacon_on) {
        glow(ctx, 480, 180, 320, '#fff0b0', 0.24);
      }
      box(ctx, R, holeTinBox);
      // Left wall M.E.G. Pitfalls cross-section blueprint
      paper(ctx, R, holeMapQuad, 2.65, '#e2d8bc');
      const mp = P(-1.6, -0.1, 2.65); txt(ctx, '剖面圖', mp[0], mp[1] + 4, '#2a2416', 9);
      // Center back floodlight switch panel
      poly(ctx, holeSwitchQuad, s.flags.hole_beacon_on ? '#3c5842' : '#3a3a36');
      outline(ctx, holeSwitchQuad, s.flags.hole_beacon_on ? '#96f0a8' : '#8a887a', 2);
      const swb = bounds(holeSwitchQuad);
      ctx.fillStyle = s.flags.hole_beacon_on ? '#76ff98' : '#d85a48';
      ctx.beginPath(); ctx.arc(swb[0] + swb[2] * 0.5, swb[1] + swb[3] * 0.35, 5, 0, Math.PI * 2); ctx.fill();
      txt(ctx, s.flags.hole_beacon_on ? '作業燈：開' : '作業照明開關', swb[0] + swb[2] * 0.5, swb[1] + swb[3] * 0.78, '#ece8d8', 9);
      // Right wall maintenance ladder straight up to stairwell
      poly(ctx, holeLadderUp, 'rgba(20,18,10,0.65)');
      const c = shade(R, '#b4b8bc', 2.6);
      seg(ctx, P(1.58, -0.82, 2.35), P(1.58, 0.96, 2.35), c, 4);
      seg(ctx, P(1.58, -0.82, 2.95), P(1.58, 0.96, 2.95), c, 4);
      for (let i = 0; i < 6; i++) {
        const y = -0.65 + i * 0.28;
        seg(ctx, P(1.58, y, 2.35), P(1.58, y, 2.95), c, 2.5);
      }
    },
    hotspots: [
      BACK('l0_hole_bridge', '回到橫樑危橋'),
      {
        id: 'depth_gauge', rect: bounds(holeMapQuad, 8), label: '陷坑區垂直剖面圖', cursor: 'look',
        click: (g) => g.closeup('l0_pit_map', { msg: '泛黃的 M.E.G. 工程剖面圖標出了整個陷坑區的垂直構造——包括深埋在地下三十六公尺的「坑底偽街廳」。' }),
      },
      {
        id: 'floodlight', rect: bounds(holeSwitchQuad, 10), label: '中繼台作業照明開關', cursor: 'look',
        click: (g) => {
          if (g.s.flags.hole_beacon_on) return g.say('暖白色的作業照明燈穩穩亮著，把四面深淵的邊緣照得清清楚楚。');
          g.flag('hole_beacon_on'); g.sfx('click'); g.sanity(8);
          g.say('「喀噠」一聲，頭頂的作業泛光燈亮了起來！沒有低頻嗡嗡聲的穩定暖光照亮了整座中繼台，心頭的壓迫感散了不少。（清醒度 +8）');
        },
      },
      {
        id: 'tin_box', rect: boxRect(holeTinBox, 10), label: '角落的防水鐵盒', cursor: 'take',
        click: (g) => {
          if (g.s.flags.hole_nest_loot) return g.say('鐵盒已經空了，只剩一點乾燥劑。');
          g.flag('hole_nest_loot'); g.sfx('open');
          g.give('almond'); g.give('bar');
          g.read('n_holes_island', () => g.say('鐵盒裡藏著一瓶乾淨杏仁水、一條能量棒，還有一張前人留下的筆記。'));
        },
      },
      {
        id: 'ladder_up', rect: bounds(holeLadderUp, 8), label: '直通樓梯間的維修鐵梯', cursor: 'go',
        click: (g) => { g.s.holes = null; g.go('l0_stairs', { msg: '你沿著維修鐵梯一口氣爬上去，推開活板門——正好回到樓梯間！不用再走一次暗坑了。' }); },
      },
    ],
  },

  l0_dry: {
    level: 0, title: '乾燥的走廊', room: l0Dry, quiet: 0.35,
    viewMsg: '觀景窗裡，走廊盡頭那扇門的門縫透出亮白色的光，像工地裡開著大燈。',
    enter(g, { first }) {
      if (first) g.say('越往裡走，腳下的地毯越乾。嗡嗡聲小了很多，空氣裡有新油漆的味道。牆邊掛著塑膠布，地上擺著油漆桶。');
    },
    draw(ctx, t, s, R) {
      poly(ctx, sheeting, 'rgba(235,240,245,0.28)');
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
      for (let i = 1; i < 6; i++) seg(ctx, P(-1.2, -1, 1.4 + i * 0.3), P(-1.2, 0.9, 1.5 + i * 0.3), ctx.strokeStyle, 1);
      for (const b of buckets.slice().reverse()) drawBucket(ctx, R, b, { band: '#d6a438' });
      if (!s.flags.ladder) {
        const c = shade(R, '#b8bcc0', 3.6);
        seg(ctx, P(1.2, -0.6, 3.4), P(0.95, 1, 3.4), c, 4); seg(ctx, P(1.2, -0.6, 3.8), P(0.95, 1, 3.8), c, 4);
        for (let i = 1; i < 7; i++) { const y = -0.6 + i * 0.23, x = 1.2 - (i * 0.23) * 0.156; seg(ctx, P(x, y, 3.4), P(x, y, 3.8), c, 2); }
      }
      poly(ctx, dryDoor, shade(R, '#a68a5c', 9));
      drawCaution(ctx, faceQuad(-0.32, -0.62, 0.32, -0.54, 8.999));
    },
    hotspots: [
      BACK('l0_wet'),
      {
        id: 'ladder', when: (s) => !s.flags.ladder, rect: bounds([P(1.2, -0.6, 3.4), P(0.95, 1, 3.8), P(1.2, -0.6, 3.8)], 10), label: '靠在牆上的折疊梯', cursor: 'take',
        click: (g) => { g.flag('ladder'); g.give('ladder', '一把鋁製折疊梯，收起來不算重。梯腳上沾著新油漆。'); },
      },
      { id: 'buckets', rect: bounds(buckets.flatMap((b) => [P(b.x1, b.y1, b.z1), P(b.x2, 1, b.z1)]), 8), label: '油漆桶', cursor: 'look', click: (g) => g.say('油漆還是濕的。標籤上印著一行小字：「後室重新裝修公司」。……在這種地方，誰會來裝修？') },
      { id: 'door', rect: bounds(dryDoor, 12), label: '施工中的門', cursor: 'go', click: (g) => g.go('l02_room', { msg: '你推開那扇門。門後的光白得發亮，空氣裡全是新油漆的味道。' }) },
    ],
  },

  l0_ceiling: {
    level: '0-ceiling', title: '夾層入口', room: l0Ceil, quiet: 0.25,
    viewMsg: '觀景窗裡什麼都沒變。這裡大概從來不會變。',
    enter(g, { first }) {
      if (first) g.say('你爬進天花板上方的夾層。這裡沒有燈，只有底下的光從板子縫隙間透上來。嗡嗡聲……在你腳下。');
    },
    draw(ctx, t, s, R) {
      tileSeams(ctx, R);
      glowQuad(ctx, ceilHoleDown);
      pipe(ctx, R, 1.2, -0.55, 0.16, '#6e6e66');
      pipe(ctx, R, -0.9, -1, 0.08, '#55554e', false);
      paper(ctx, R, faceQuad(0.6, 0.55, 1.0, 0.85, 6.999), 7, '#8f8770');
      if (!s.flags.ceil_stash) box(ctx, R, ceilStash);
    },
    hotspots: [
      { ...BACK('l0_low', '從洞口爬下去'), click: (g) => g.go('l0_low', { msg: '你踩著梯子爬回低矮的房間，順手把梯子收了下來。' }) },
      FORWARD('l0_ceiling2', '在夾層裡往前爬', [380, 200, 200, 120]),
      { id: 'note', rect: bounds(faceQuad(0.6, 0.55, 1.0, 0.85, 6.999), 10), label: '灰塵上的字', cursor: 'look', click: (g) => g.read('n0h') },
      {
        id: 'stash', when: (s) => !s.flags.ceil_stash, rect: boxRect(ceilStash, 8), label: '用塑膠袋包起來的東西', cursor: 'take',
        click: (g) => {
          g.flag('ceil_stash'); g.give('almond'); g.give('bar');
          g.say('塑膠袋裡包著一瓶杏仁水和一條能量棒，袋子上寫著「上面的不會被拿走」。灰塵很厚，可是袋子是新的。');
        },
      },
    ],
  },

  l0_ceiling2: {
    level: '0-ceiling', title: '通風交匯處', room: l0Ceil, quiet: 0.25,
    viewMsg: '觀景窗裡，通風管深處的東西反光得更亮了。正前方還有一條佈滿管線的深處夾層。',
    enter(g, { first }) {
      if (first) g.say('夾層往前延伸。左邊有一塊板子特別潮濕，右邊的地上有一片金屬格柵，牆邊伸出一截通風管，再往前還有更深的熱水管廊。');
    },
    draw(ctx, t, s, R) {
      tileSeams(ctx, R);
      if (s.flags.tile_down) glowQuad(ctx, wetFromAbove);
      else {
        poly(ctx, wetFromAbove, shade(R, '#4a3e1a', 2.5));
        if (!s.flags.cam_got) {
          ctx.fillStyle = '#1e1f22'; ctx.fillRect(camAbove[0] - 16, camAbove[1] - 12, 32, 14);
          if ((t * 1.2 | 0) % 2 === 0) { ctx.fillStyle = '#e33'; ctx.beginPath(); ctx.arc(camAbove[0] + 9, camAbove[1] - 8, 2, 0, Math.PI * 2); ctx.fill(); }
        }
      }
      if (s.flags.grille_open) glowQuad(ctx, grille);
      else {
        poly(ctx, grille, shade(R, '#6a6a62', 3));
        for (let i = 1; i < 6; i++) seg(ctx, P(0.6 + i * 0.133, 1, 2.6), P(0.6 + i * 0.133, 1, 3.4), shade(R, '#2a2a26', 3), 2);
      }
      box(ctx, R, duct);
      poly(ctx, ductMouth, '#050403');
      if (!s.flags.key) {
        const k = P(-1.65, -0.38, 4.6);
        ctx.fillStyle = `rgba(255,220,120,${0.5 + 0.4 * Math.sin(t * 3)})`; ctx.beginPath(); ctx.arc(k[0], k[1], 3, 0, Math.PI * 2); ctx.fill();
      }
    },
    hotspots: [
      BACK('l0_ceiling', '往回爬'),
      FORWARD('l0_ceil_pipes', '往深處熱水管廊爬', [400, 175, 160, 115]),
      {
        id: 'camcorder', when: (s) => !s.flags.cam_got && !s.flags.tile_down, rect: [camAbove[0] - 30, camAbove[1] - 26, 60, 36], label: '板子上的東西', cursor: 'take',
        click: (g) => { g.flag('cam_got'); g.give('camcorder', '濕透的板子上放著一台攝影機，像是有人特地擺在這裡。螢幕還亮著。'); },
      },
      {
        id: 'wetdrop', rect: bounds(wetFromAbove, 4), label: '潮濕的板子', cursor: 'go',
        click: (g) => {
          if (!g.s.flags.tile_down) return g.say('這塊板子泡得太軟了，撐不住你的重量。從底下把它頂掉，也許比較快。');
          g.go('l0_wet', { msg: '你從洞口垂下梯子，爬回濕透的房間。' });
        },
      },
      {
        id: 'grille', rect: bounds(grille, 4), label: '金屬格柵', cursor: 'go',
        click: (g) => {
          if (!g.s.flags.grille_open) return g.say('格柵用四顆螺絲鎖在框上。底下透出褪了色的光。');
          g.flag('maze_done');
          g.go('l0_faded', { msg: '你從格柵的洞口垂下梯子。底下是那間壁紙褪了色的房間——你沒有經過任何隔間就到了這裡。' });
        },
        use: {
          screwdriver: (g) => {
            if (g.s.flags.grille_open) return g.say('格柵已經拆下來了。');
            g.flag('grille_open'); g.sfx('screw');
            g.say('你一顆一顆轉開螺絲，把格柵挪到一邊。底下的房間，壁紙的顏色很淡。');
          },
        },
      },
      {
        id: 'duct', rect: boxRect(duct, 4), label: '通風管', cursor: 'look',
        click: (g) => g.say(g.s.flags.key ? '通風管裡空空的，只有灰塵。' : '通風管深處有東西在反光。太深了，手伸不進去。'),
        use: {
          rod: (g) => {
            if (g.s.flags.key) return g.say('裡面已經沒有東西了。');
            g.flag('key'); g.give('key', '你把吊桿伸進通風管，勾了好幾次，終於勾出一把小小的黃銅鑰匙。鑰匙上的標籤寫著：「別開」。');
          },
        },
      },
    ],
  },

  l0_ceil_pipes: {
    level: '0-ceiling', title: '熱水管廊', room: l0Ceil, quiet: 0.25,
    viewMsg: '觀景窗裡，每一條電纜槽都穩穩鎖在鋼樑上，完全不隨底下的房間變動。',
    enter(g, { first }) {
      if (first) g.say('夾層在這裡變得更低更悶，交錯著溫熱的鐵管與整排日光燈鎮流器。右牆有一片上了螺絲的檢修蓋。');
    },
    draw(ctx, t, s, R) {
      tileSeams(ctx, R);
      pipe(ctx, R, -1.4, -0.45, 0.18, '#7a6e5c');
      pipe(ctx, R, 1.35, -0.65, 0.14, '#6d7068');
      pipe(ctx, R, -0.4, -0.85, 0.1, '#5d6058', false);
      poly(ctx, ceilHatch, s.flags.ceil_hatch_open ? '#0c0a06' : shade(R, '#6c6e66', 2.4));
      outline(ctx, ceilHatch, '#9a9c92', 1.5);
    },
    hotspots: [
      BACK('l0_ceiling2', '退回通風交匯處'),
      FORWARD('l0_ceil_overlook', '繼續往前爬向亮縫處', [390, 175, 180, 115]),
      {
        id: 'hatch', rect: bounds(ceilHatch, 8), label: '上了螺絲的檢修蓋', cursor: 'look',
        click: (g) => {
          if (g.s.flags.ceil_hatch_open) return g.say('檢修蓋裡已經空了，只剩幾根溫熱的鎮流器電線。');
          g.say('檢修蓋用一字螺絲鎖緊，裡面似乎塞著一份折疊好的工程便條與補給。');
        },
        use: {
          screwdriver: (g) => {
            if (g.s.flags.ceil_hatch_open) return g.say('檢修蓋已經打開了。');
            g.flag('ceil_hatch_open'); g.sfx('screw');
            g.give('bar');
            g.read('n_ceil_pipes', () => g.say('你轉開螺絲，從檢修蓋裡掏出一條能量棒與一張工程便條。'));
          },
        },
      },
    ],
  },

  l0_ceil_overlook: {
    level: '0-ceiling', title: '俯瞰孔道', room: l0Ceil, quiet: 0.25,
    viewMsg: '把攝影機貼上腳邊那道寬板縫往下看——底下站著一個人，穿著和你一樣的外套，正往牆上貼紙條！',
    enter(g, { first }) {
      if (first) g.say('腳下的纖維板移開了一道寬縫，明晃晃的黃光從底下湧上來，剛好能俯瞰下面的走廊。左牆壓著一張發皺的字條。');
    },
    draw(ctx, t, s, R) {
      tileSeams(ctx, R);
      glowQuad(ctx, ceilGap, 0.9);
      outline(ctx, ceilGap, '#c8b35e', 2);
      paper(ctx, R, ceilPeekNote, 2.4, '#d8d0b6');
    },
    drawView(ctx) {
      const c = P(0, 1, 2.6);
      ctx.save(); ctx.fillStyle = 'rgba(20,30,20,0.75)';
      ctx.beginPath(); ctx.arc(c[0], c[1] - 4, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(c[0] - 20, c[1] + 6, 40, 16);
      ctx.restore();
    },
    hotspots: [
      BACK('l0_ceil_pipes', '退回熱水管廊'),
      FORWARD('l0_ceil_cache', '爬向鋼樑盡頭的暗角', [390, 160, 180, 110]),
      { id: 'peek_note', rect: bounds(ceilPeekNote, 8), label: '左牆發皺的字條', cursor: 'look', click: (g) => g.read('n_ceil_peek') },
      {
        id: 'peek', rect: bounds(ceilGap, 6), label: '透過寬板縫往下看', cursor: 'look',
        click: (g) => {
          if (g.s.view) {
            if (!g.s.flags.ceil_peeked) { g.flag('ceil_peeked'); g.sanity(-5); g.sfx('sting'); }
            return g.closeup('l0_ceil_peek_cu', { msg: '觀景窗裡，底下走廊有個人貼完紙條後忽然抬起頭，直直望著這道板縫！你猛地縮回身子，手心全是冷汗。' });
          }
          g.closeup('l0_ceil_peek_cu', { msg: '底下是一條空蕩蕩的黃色走廊，日光燈嗡嗡作響。肉眼看不見任何人。' });
        },
      },
    ],
  },

  l0_ceil_cache: {
    level: '0-ceiling', title: '高處藏匿點', room: l0Ceil, quiet: 0.25,
    viewMsg: '觀景窗裡，鐵盒周圍用粉筆畫著一圈清楚的保護記號：「J.H.」。',
    enter(g, { first }) {
      if (first) g.say('夾層在兩根主鋼樑間結束。角落放著一只畫了粉筆圈的鐵盒，左牆留著手記，右邊有塊鬆動的檢修板透出柱子房間的光。');
    },
    draw(ctx, t, s, R) {
      tileSeams(ctx, R);
      box(ctx, R, ceilJhBox);
      paper(ctx, R, ceilJhNote, 2.5, '#e2dac0');
      glowQuad(ctx, ceilDropPillar, 0.72);
      outline(ctx, ceilDropPillar, '#c2b068', 2);
    },
    drawView(ctx) {
      const c = P(-0.18, 0.65, 2.5);
      txt(ctx, 'J.H.', c[0], c[1] - 14, CHALK, 14);
    },
    hotspots: [
      BACK('l0_ceil_overlook', '退回俯瞰孔道'),
      { id: 'jh_note', rect: bounds(ceilJhNote, 10), label: '鋼樑旁的 J.H. 手記', cursor: 'look', click: (g) => g.read('n_ceil_jh') },
      {
        id: 'jh_box', rect: boxRect(ceilJhBox, 10), label: '粉筆圈裡的鐵盒', cursor: 'take',
        click: (g) => {
          if (g.s.flags.ceil_jh_box) return g.say('鐵盒已經空了，底部還留著一點白粉筆灰。');
          g.flag('ceil_jh_box'); g.sfx('open');
          g.give('almond', '鐵盒裡穩穩放著一瓶乾淨的杏仁水。果然——留在天花板上面的東西，真的不會被拿走。');
        },
      },
      {
        id: 'drop_pillar', rect: bounds(ceilDropPillar, 6), label: '鬆動的檢修板（往下跳）', cursor: 'go',
        click: (g) => g.go('l0_pillar', { msg: '你推開鬆動的檢修板順勢落地——正好回到空蕩蕩的柱子房間。' }),
      },
    ],
  },

  l0_archive: {
    level: '0-arches', title: '檔案室', room: l0Archive,
    viewMsg: '觀景窗裡，每一個抽屜的標籤都在閃——只有一個沒有。右側櫃間還透出一間冷冰冰的底片庫。',
    enter(g, { first }) {
      if (first) g.say('門後是一間狹長的房間，兩邊排滿了鐵灰色的檔案櫃。這一層不該有這種地方。這一層不該有任何人在記錄任何東西。');
    },
    draw(ctx, t, s, R) {
      for (const b of [...cabinetsL, ...cabinetsR].sort((a, b) => b.z1 - a.z1)) {
        box(ctx, R, b);
        const x = b.x1 < 0 ? b.x2 : b.x1;
        for (let i = 1; i < 4; i++) {
          const y = -0.45 + i * 0.36;
          seg(ctx, P(x, y, b.z1), P(x, y, b.z2), shade(R, '#4a4c46', b.z1), 1.5);
          const hz = (b.z1 + b.z2) / 2;
          const hp = P(x, y - 0.18, hz);
          ctx.fillStyle = shade(R, '#e9e4d4', hz); ctx.fillRect(hp[0] - 3, hp[1] - 2, 6, 4);
        }
      }
      poly(ctx, drawer0120, s.flags.archived_open ? '#0d0c08' : shade(R, '#8a8c84', 2));
      poly(ctx, archiveVaultGate, '#161918');
      outline(ctx, archiveVaultGate, shade(R, '#969c92', 4.5), 2);
      poly(ctx, wormQuad, '#1f0d2b');
      ctx.strokeStyle = '#62288a'; ctx.lineWidth = 2; poly(ctx, wormQuad); ctx.stroke();
      paper(ctx, R, n04WarnQuad, 6.9, '#f2ecd8');
      box(ctx, R, archDesk);
      if (!s.flags.chalk) { seg(ctx, chalkAt, [chalkAt[0] + 10, chalkAt[1] - 1], '#f2f0e8', 3); }
      poly(ctx, cardQuad, shade(R, '#f2ecd8', 5.9));
    },
    hotspots: [
      { ...BACK('l0_arches', '回到拱門的房間'), click: (g) => g.go('l0_arches') },
      {
        id: 'drawers', rect: [60, 150, 230, 300], label: '檔案櫃', cursor: 'look',
        click: (g) => g.read('n_records', () => {
          if (!g.s.flags.records_seen) { g.flag('records_seen'); g.sanity(-4); g.say('每一份記錄都只有一兩行。你翻了很久，找不到任何一個名字。'); }
        }),
      },
      {
        id: 'drawer0120', rect: bounds(drawer0120, 10), label: '標籤是新的抽屜', cursor: 'look',
        click: (g) => { g.flag('archived_open'); g.closeup('l0_drawer0120', { msg: '抽屜的標籤寫著「0120」，墨水還沒全乾。裡面是空的。大小……剛好放得下一台攝影機。' }); },
        use: {
          camcorder: (g) => {
            g.take('camcorder');
            g.end('archive');
          },
        },
      },
      {
        id: 'vault', rect: bounds(archiveVaultGate, 6), label: '右側鐵網隔門（底片庫）', cursor: 'go',
        click: (g) => g.go('l0_arch_vault'),
      },
      {
        id: 'chalk', when: (s) => !s.flags.chalk, rect: [chalkAt[0] - 16, chalkAt[1] - 14, 40, 24], label: '桌上的粉筆', cursor: 'take',
        click: (g) => { g.flag('chalk'); g.give('chalk', '一截用到很短的粉筆。指尖沾上的粉，和隔間地上的箭頭是同一種白。'); },
      },
      { id: 'card', rect: bounds(cardQuad, 12), label: '桌上的卡片', cursor: 'look', click: (g) => g.read('n0i') },
      { id: 'worm_note', rect: bounds(n04WarnQuad, 4), label: '洞口旁的紙條', cursor: 'look', click: (g) => g.read('n04_warn') },
      { id: 'wormhole', rect: bounds(wormQuad, 4), label: '牆後翻湧的宏蟲洞', cursor: 'go', click: (g) => g.go('l04_worm') },
    ],
  },

  l0_arch_vault: {
    level: '0-arches', title: '封存底片庫', room: l0ArchVault,
    viewMsg: '觀景窗裡，兩側架上所有空錄影帶殼同時亮起微弱的紅色「REC」反光。',
    enter(g, { first }) {
      if (first) g.say('鐵網門後是一間偏冷的恆溫庫房。兩排鐵架塞滿標籤全寫著「01/20」的錄影帶空殼，中央工作台擺著一台老式倒帶機。');
    },
    draw(ctx, t, s, R) {
      for (const side of [-1, 1]) {
        const x1 = side < 0 ? -1.4 : 0.96, x2 = side < 0 ? -0.96 : 1.4;
        for (const z of [1.8, 3.3, 4.7]) {
          box(ctx, R, { x1, x2, y1: -0.55, y2: 1, z1: z, z2: z + 0.95, color: '#5c5f5a', edge: true });
        }
      }
      box(ctx, R, vaultDesk);
      box(ctx, R, vaultRewinder);
      const rp = P(0, 0.36, 3.25);
      ctx.fillStyle = s.flags.vault_rewound ? '#4ad682' : '#d6453a';
      ctx.beginPath(); ctx.arc(rp[0] + 18, rp[1], 3, 0, Math.PI * 2); ctx.fill();
    },
    drawView(ctx, t) {
      if ((t * 1.5 | 0) % 2 === 0) {
        for (const x of [-0.95, 0.95]) for (const z of [2.1, 3.6, 5.0]) {
          const p = P(x, -0.1, z);
          ctx.fillStyle = 'rgba(255,60,50,0.65)';
          ctx.beginPath(); ctx.arc(p[0], p[1], 3, 0, Math.PI * 2); ctx.fill();
        }
      }
    },
    hotspots: [
      BACK('l0_archive', '回到檔案室'),
      {
        id: 'rewinder', rect: boxRect(vaultRewinder, 12), label: '工作台上的倒帶機', cursor: 'look',
        click: (g) => {
          g.sfx('whirr');
          g.flag('vault_rewound');
          g.read('n_arch_vault', () => g.say('倒帶機喀噠空轉了兩圈，側縫滑出一份發黃的清點單。'));
        },
      },
      {
        id: 'shelves', rect: [50, 150, 210, 280], label: '寫滿 01/20 的底片架', cursor: 'look',
        click: (g) => g.say('整排架子都是空的塑膠帶殼，每一格都工整貼著「01/20」，總共二十三捲。'),
      },
    ],
  },

  l0_torment: {
    level: '0-torment', title: '褪色邊界', room: l0Torment, quiet: 0.25, hazard: () => torHazard,
    viewMsg: '觀景窗裡，灰霧中有很多人影在墳墓之間走。左側還有一條尚未完全灰化的邊界石徑。',
    enter(g, { first }) {
      if (first) { g.sfx('static'); g.sanity(-5); }
      g.say(first
        ? '嗡嗡聲忽然遠了。壁紙的黃色一點一點褪掉，到了前面就只剩灰色。再過去，地毯變成了泥土，泥土上是一圈一圈的墳。霧裡有一輪月亮，一動也不動。一股說不出來的恐懼攫住了你。'
        : '灰色比剛才更靠近你了。霧裡的月亮還在同一個位置。');
    },
    draw(ctx, t, s, R) {
      // beyond the edge: grey ground, the lone moon, dead trees and graves in rings around a statue
      poly(ctx, greyFloor, '#5a5a5a');
      poly(ctx, torEdgePath, 'rgba(72,72,72,0.78)');
      outline(ctx, torEdgePath, 'rgba(185,185,180,0.45)', 1.5);
      ctx.save(); ctx.shadowColor = 'rgba(240,240,240,0.7)'; ctx.shadowBlur = 30;
      ctx.fillStyle = '#ededed'; ctx.beginPath(); ctx.arc(CX + 46, 205, 12, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      for (let ring = 0; ring < 3; ring++) {
        const z = 4.2 + ring * 1.1, n = 5 + ring * 2;
        for (let i = 0; i < n; i++) {
          const x = -1 + (2 * i) / (n - 1);
          const p = P(x * (0.55 + ring * 0.25), 1, z), w = 16 / z, h = 30 / z;
          ctx.fillStyle = ring % 2 ? '#444' : '#3c3c3c'; ctx.fillRect(p[0] - w, p[1] - h * 2, w * 2, h * 2);
        }
      }
      for (const x of [-0.9, 0.95]) {
        const p = P(x, 1, 5.2); ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + x * 8, p[1] - 90); ctx.lineTo(p[0] - x * 18, p[1] - 130);
        ctx.moveTo(p[0] + x * 6, p[1] - 70); ctx.lineTo(p[0] + x * 30, p[1] - 100); ctx.stroke();
      }
      // the statue at the centre: a man in a hat, broken at the shoulder
      const st = P(0, 1, 7.4);
      ctx.fillStyle = '#2e2e2e';
      ctx.fillRect(st[0] - 9, st[1] - 40, 18, 40); ctx.fillRect(st[0] - 13, st[1] - 44, 26, 4);
      ctx.beginPath(); ctx.arc(st[0], st[1] - 49, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(st[0] - 10, st[1] - 57, 20, 3); ctx.fillRect(st[0] - 5, st[1] - 63, 10, 6);
      // dead leaves blown over the edge onto the carpet
      for (const [x, z] of tormentLeaves) {
        const p = P(x, 1, z), r = 14 / z;
        ctx.fillStyle = shade(R, '#3a3a36', z); ctx.beginPath(); ctx.ellipse(p[0], p[1], r * 1.4, r * 0.6, 0.4 + x, 0, Math.PI * 2); ctx.fill();
      }
      // M.E.G.'s recorder, left at the edge and half gone to ash
      if (!s.flags.tape6) {
        box(ctx, R, evpBox);
        const a = P(-0.2, 0.86, 3.1);
        ctx.fillStyle = '#9a9a9a'; ctx.fillRect(a[0] - 14, a[1] - 2, 14, 8);
        if ((t * 1.5 | 0) % 2 === 0) { ctx.fillStyle = '#c33'; ctx.beginPath(); ctx.arc(a[0] - 34, a[1] + 2, 2, 0, Math.PI * 2); ctx.fill(); }
      }
    },
    drawOver(ctx, t, s) {
      // grey fog: thick past the edge, and the colour draining from the whole picture
      const gl = ctx.createLinearGradient(0, 0, 0, H);
      gl.addColorStop(0, 'rgba(120,120,120,0.55)'); gl.addColorStop(0.55, `rgba(140,140,140,${0.35 + 0.05 * Math.sin(t * 0.5)})`); gl.addColorStop(1, 'rgba(110,110,110,0.15)');
      ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
      if (s.flags.torment_touched) {
        ctx.fillStyle = 'rgba(60,60,60,0.18)'; ctx.fillRect(0, 0, W, H);
      }
    },
    drawView(ctx, t) {
      ctx.save(); ctx.fillStyle = 'rgba(200,255,215,0.22)';
      for (let i = 0; i < 6; i++) {
        // the souls walk the rings, always the same few steps
        const a = t * 0.25 + (i * Math.PI) / 3, z = 4.6 + (i % 3) * 0.9;
        const p = P(Math.sin(a) * (0.7 + (i % 3) * 0.3), 1, z), h = 60 / z;
        ctx.beginPath(); ctx.arc(p[0], p[1] - h * 1.1, h * 0.22, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(p[0] - h * 0.18, p[1] - h * 0.9, h * 0.36, h * 0.9);
      }
      ctx.restore();
    },
    hotspots: [
      {
        id: 'back', rect: [330, 470, 300, 70], label: '回到黃色的走廊', cursor: 'back',
        click: (g) => g.go('l0_loop', { msg: '你退回走廊。刺眼的黃色、熟悉的嗡嗡聲——你從來沒有這麼高興聽見它。' }),
      },
      {
        id: 'edge_path', rect: bounds(torEdgePath, 4), label: '沿著尚未灰化的邊界石徑走', cursor: 'go',
        click: (g) => g.go('l0_tor_ring', { msg: '你貼著灰霧最外緣往前走。腳下每一步都在黃地毯與灰土之間切換。' }),
      },
      {
        id: 'leaves', rect: [250, 350, 420, 60], label: '飄到地毯上的枯葉', cursor: 'look',
        click: (g) => {
          g.sfx('static');
          if (g.s.flags.torment_leaf) return g.say('你沒有再踩。那聲尖叫還在你耳朵裡。');
          g.flag('torment_leaf'); g.sanity(-4);
          g.say('你的鞋尖碰到一片枯葉。它碎了——同時發出一聲刺耳的尖叫，像一個人被活活踩斷了肋骨。');
        },
      },
      {
        id: 'wall', rect: bounds(wallQuad(1.1, -0.8, 0.9, 1.4, 2.6), 4), label: '褪色的壁紙', cursor: 'look',
        click: (g) => g.say('壁紙的黃色正在一點一點流掉，從前面往你這邊爬。你盯著看了一會兒，灰色又往前挪了一格。'),
      },
      {
        id: 'evp', when: (s) => !s.flags.tape6, rect: boxRect(evpBox, 12), label: '邊界上的錄音機', cursor: 'take',
        click: (g) => {
          g.flag('tape6'); g.sfx('click');
          g.give('tape6', '一台 M.E.G. 的錄音機，一半落在灰色那邊。你按下退帶鍵，抽出裡面的帶子——下一秒，灰色的那一半就塌成了一撮灰。帶子上貼著標籤：「#6 EVP」。');
        },
      },
      {
        id: 'fog', rect: fogRect, label: '灰霧的邊緣', cursor: 'go',
        click: (g) => {
          if (!g.s.flags.torment_touched) {
            g.flag('torment_touched'); g.sfx('sting'); g.sanity(-10);
            return g.say('你伸出手。指尖碰到霧的那一瞬間，什麼感覺也沒有——直到你看見指甲變成了灰色，皮膚像燒過的紙一樣捲起來。你猛地抽回手。灰色停在指節上，沒有再往上爬。');
          }
          g.end('torment');
        },
        use: {
          rod: (g) => {
            if (g.s.flags.rod_ash) return g.say('你沒有再試。吊桿已經短了一截。');
            g.flag('rod_ash'); g.sfx('static');
            g.say('你用吊桿去探灰霧。桿子的尖端變灰、變白，然後無聲地碎成灰，落在泥土上。你抽回來時，它短了一截。');
          },
        },
      },
    ],
  },

  l0_tor_ring: {
    level: '0-torment', title: '外環墳列', room: l0TorRing, quiet: 0.25, hazard: () => torHazard,
    viewMsg: '觀景窗裡，一個模糊的灰影正沿著墓碑繞圈，每走到那塊刻著 01/20 的碑前就停下來。',
    enter(g, { first }) {
      if (first) g.say('邊界外排著一列低矮的灰石墓碑。月亮依舊釘在天空同一個點上，風吹過時卻完全沒有聲音。');
    },
    draw(ctx, t, s, R) {
      ctx.save(); ctx.shadowColor = 'rgba(240,240,240,0.6)'; ctx.shadowBlur = 26;
      ctx.fillStyle = '#e8e8e8'; ctx.beginPath(); ctx.arc(CX + 90, 170, 13, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      for (const [x, z] of [[-0.85, 5.0], [-0.2, 5.4], [0.45, 5.1], [1.0, 4.6]]) {
        const p = P(x, 1, z), w = 22 / z, h = 48 / z;
        ctx.fillStyle = '#3f3f3f'; ctx.fillRect(p[0] - w, p[1] - h * 2, w * 2, h * 2);
      }
      poly(ctx, torGraveQuad, '#4c4c4c');
      outline(ctx, torGraveQuad, '#7a7a7a', 2);
      const gb = bounds(torGraveQuad);
      txt(ctx, '01 / 20', gb[0] + gb[2] / 2, gb[1] + 42, '#c8c8c8', 11);
      drawKettle(ctx, R, torKettle);
    },
    drawOver(ctx, t) {
      const gl = ctx.createLinearGradient(0, 0, 0, H);
      gl.addColorStop(0, 'rgba(115,115,115,0.52)'); gl.addColorStop(1, `rgba(95,95,95,${0.2 + 0.04 * Math.sin(t * 0.6)})`);
      ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    },
    drawView(ctx, t) {
      const a = t * 0.55;
      const p = P(-0.55 + Math.sin(a) * 0.32, 1, 4.3);
      ctx.save(); ctx.fillStyle = 'rgba(210,255,220,0.28)';
      ctx.beginPath(); ctx.arc(p[0], p[1] - 78, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(p[0] - 11, p[1] - 64, 22, 64);
      ctx.restore();
    },
    hotspots: [
      BACK('l0_torment', '退回褪色邊界'),
      FORWARD('l0_tor_tree', '沿邊界走向枯樹林緣', [455, 175, 170, 140]),
      {
        id: 'grave', rect: bounds(torGraveQuad, 8), label: '刻著日期的外環墓碑', cursor: 'look',
        click: (g) => g.read('n_tor_graves'),
      },
      {
        id: 'kettle', rect: boxRect(torKettle, 10), label: '半灰化的鐵水壺', cursor: 'look',
        click: (g) => {
          g.sfx('static');
          if (!g.s.flags.tor_kettle) {
            g.flag('tor_kettle'); g.sanity(-3);
            return g.say('你碰了碰水壺。壺身立刻剝落成細灰，耳邊閃過一聲極輕的嘆息。');
          }
          g.say('只剩一撮銀白色的灰，維持著水壺原本的形狀。');
        },
      },
    ],
  },

  l0_tor_tree: {
    level: '0-torment', title: '枯樹林緣', room: l0TorTree, quiet: 0.25, hazard: () => torHazard,
    viewMsg: '觀景窗裡，枯樹枝上掛著無數半透明的灰絲，正朝霧中央的石像傾斜。',
    enter(g, { first }) {
      if (first) g.say('七英尺高的枯樹在濃霧邊緣排開，腳邊鋪滿會尖叫的枯葉。左樹幹釘著一塊 M.E.G. 觀測板，右邊葉堆裡露出半截瓶身。');
    },
    draw(ctx, t, s, R) {
      for (const x of [-1.05, 0.95]) {
        const p = P(x, 1, 3.6);
        ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + x * 12, p[1] - 180);
        ctx.moveTo(p[0] + x * 6, p[1] - 110); ctx.lineTo(p[0] - x * 48, p[1] - 165);
        ctx.moveTo(p[0] + x * 8, p[1] - 135); ctx.lineTo(p[0] + x * 42, p[1] - 190); ctx.stroke();
      }
      paper(ctx, R, torMegBoard, 2.5, '#d8d6cc');
      for (const [x, z] of [[0.4, 2.5], [0.65, 2.6], [0.82, 2.45], [0.52, 2.35]]) {
        const p = P(x, 1, z), r = 18 / z;
        ctx.fillStyle = '#363632'; ctx.beginPath(); ctx.ellipse(p[0], p[1], r * 1.4, r * 0.6, 0.3, 0, Math.PI * 2); ctx.fill();
      }
      if (!s.flags.tor_bottle) bottle(ctx, R, torLeafBottle.p[0], torLeafBottle.p[1], 36, torLeafBottle.z);
    },
    drawOver(ctx, t) {
      const gl = ctx.createLinearGradient(0, 0, 0, H);
      gl.addColorStop(0, 'rgba(110,110,110,0.56)'); gl.addColorStop(1, `rgba(92,92,92,${0.22 + 0.04 * Math.sin(t * 0.5)})`);
      ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    },
    hotspots: [
      BACK('l0_tor_ring', '退回外環墳列'),
      FORWARD('l0_tor_statue', '走向能望見石像的霧緣', [390, 170, 180, 145]),
      { id: 'meg_board', rect: bounds(torMegBoard, 8), label: '釘在樹幹的 M.E.G. 觀測板', cursor: 'look', click: (g) => g.read('n_tor_meg') },
      {
        id: 'leaf_bottle', when: (s) => !s.flags.tor_bottle, rect: [torLeafBottle.p[0] - 28, torLeafBottle.p[1] - 52, 56, 60], label: '埋在枯葉裡的瓶子', cursor: 'take',
        click: (g) => {
          g.flag('tor_bottle'); g.sanity(-6); g.sfx('sting');
          g.give('almond', '你伸手撥葉子——幾片枯葉碎裂，同時爆出刺耳的人聲尖叫！你忍著頭痛抓起這瓶還沒灰化的杏仁水。');
        },
        use: {
          rod: (g) => {
            g.flag('tor_bottle'); g.sfx('pick');
            g.give('almond', '你用金屬吊桿把瓶子從枯葉堆裡輕輕勾了出來，一片葉子也沒踩碎。裡頭是完好的杏仁水。');
          },
        },
      },
    ],
  },

  l0_tor_statue: {
    level: '0-torment', title: '靜止之月下', room: l0TorStatue, quiet: 0.2, hazard: () => torHazard,
    viewMsg: '你舉起鏡頭——霧中央那尊戴帽石像，明明剛才側著臉，此刻卻正對著你的觀景窗。',
    enter(g, { first }) {
      if (first) { g.sfx('static'); g.say('你來到灰霧最外緣的盡頭。透過翻滾的霧氣，已經能清楚看見墳環正中央那座肩部斷裂的戴帽男子石像。'); }
    },
    draw(ctx, t, s, R) {
      ctx.save(); ctx.shadowColor = 'rgba(245,245,245,0.75)'; ctx.shadowBlur = 36;
      ctx.fillStyle = '#f2f2f2'; ctx.beginPath(); ctx.arc(CX, 130, 18, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      const st = P(0, 1, 4.6);
      ctx.fillStyle = '#323232';
      ctx.fillRect(st[0] - 42, st[1] - 28, 84, 28);
      ctx.fillRect(st[0] - 22, st[1] - 125, 44, 97);
      // broken left shoulder & broad brimmed hat
      ctx.fillRect(st[0] - 18, st[1] - 134, 46, 12);
      ctx.beginPath(); ctx.arc(st[0], st[1] - 150, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(st[0] - 28, st[1] - 166, 56, 6);
      ctx.fillRect(st[0] - 16, st[1] - 182, 32, 16);
      txt(ctx, '「……放不下那一天的。」', st[0], st[1] - 10, '#8e8e8e', 9);
    },
    drawOver(ctx, t) {
      const gl = ctx.createLinearGradient(0, 0, 0, H);
      gl.addColorStop(0, 'rgba(105,105,105,0.6)'); gl.addColorStop(1, `rgba(85,85,85,${0.25 + 0.05 * Math.sin(t * 0.4)})`);
      ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    },
    drawView(ctx) {
      const st = P(0, 1, 4.6);
      ctx.save(); ctx.fillStyle = 'rgba(220,255,225,0.85)';
      ctx.fillRect(st[0] - 8, st[1] - 154, 4, 3);
      ctx.fillRect(st[0] + 4, st[1] - 154, 4, 3);
      ctx.restore();
    },
    hotspots: [
      BACK('l0_tor_tree', '趁還沒灰化退回枯樹林緣'),
      {
        id: 'inspect_moon', rect: [380, 42, 200, 82], label: '遠望靜止月亮與霧中石像', cursor: 'look',
        click: (g) => g.closeup('l0_tor_statue_cu', {
          msg: g.s.view
            ? '透過觀景窗拉近一看——那尊斷臂戴帽石像的雙眼亮著慘白微光，正筆直盯著鏡頭。'
            : '慘白月亮一動也不動地懸在斷臂戴帽石像正上方，灰屑靜靜落在底座刻字旁。',
        }),
      },
      {
        id: 'statue_plaque', rect: torPlaqueRect, label: '辨認石像底座的刻字', cursor: 'look',
        click: (g) => g.read('n_tor_statue'),
      },
      {
        id: 'step_in', rect: torStatueRect, label: '走向濃霧中央的戴帽石像', cursor: 'go',
        click: (g) => g.end('torment'),
      },
    ],
  },

  l0_atrium: {
    level: 0, title: '靜謐的黃色大廳', room: l0Atrium,
    viewMsg: '觀景窗裡，地毯中央留著三個方向不一的粉筆短記號，像是有人在這裡停下來整理過路線。',
    enter(g, { first }) {
      if (first) g.say('一間比走廊寬敞許多的黃色大廳。左邊堆著紙箱味，右邊飄來一絲冷風，正前方的壁紙已經開始剝落。');
    },
    draw(ctx, t, s, R) {
      box(ctx, R, atriumPartition);
      box(ctx, R, atriumChair);
      const back = faceQuad(0.85, 0.08, 1.35, 0.45, 2.65);
      poly(ctx, back, shade(R, '#a89e7c', 2.65));
      outline(ctx, back, shade(R, '#6b644c', 2.65), 1.2);
      const stain = P(-0.1, 1, 3.2);
      ctx.fillStyle = 'rgba(55,45,18,0.28)';
      ctx.beginPath(); ctx.ellipse(stain[0], stain[1], 110, 14, 0, 0, Math.PI * 2); ctx.fill();
    },
    drawView(ctx) {
      floorArrow(ctx, -0.35, 2.6, -1.6, 2.65);
      floorArrow(ctx, 0.35, 3.6, 1.65, 3.8);
      floorArrow(ctx, 0, 3.2, 0, 4.7);
    },
    hotspots: [
      BACK('l0_hall', '回到走廊'),
      { id: 'storage_door', rect: bounds(atriumStorageDoor, 4), label: '左邊飄著紙箱味的隔間', cursor: 'go', click: (g) => g.go('l0_storage') },
      { id: 'mottled_door', rect: bounds(atriumMottledDoor, 8), label: '正前方壁紙剝落的過道', cursor: 'go', click: (g) => g.go('l0_mottled') },
      { id: 'draft_door', rect: bounds(atriumDraftDoor, 4), label: '右邊吹出冷風的門洞', cursor: 'go', click: (g) => g.go('l0_draft') },
      {
        id: 'chair', rect: boxRect(atriumChair, 6), label: '單獨擺著的塑膠折疊椅', cursor: 'look',
        click: (g) => g.say('一張普通得不合時宜的米色塑膠椅。椅面上積著薄灰，沒有腳印，也沒有人坐過的痕跡。'),
      },
      {
        id: 'partition', rect: boxRect(atriumPartition, 6), label: '立在大廳裡的半高隔斷牆', cursor: 'look',
        click: (g) => g.say('一面突兀地立在地毯中央的黃色隔斷牆，既不靠邊也不承重，像整棟建築隨便塞進來的多餘零件。'),
      },
    ],
  },

  l0_mottled: {
    level: 0, title: '斑駁牆過道', room: l0Mottled,
    viewMsg: '觀景窗裡，剝落壁紙底下的灰色混凝土透出微弱的潮熱氣流，一路往深處延伸。',
    enter(g, { first }) {
      if (first) g.say('這裡的黃壁紙像受潮太久一樣大片剝落，露出底下粗糙的灰色混凝土。往前走，空氣開始變得悶熱。');
    },
    draw(ctx, t, s, R) {
      poly(ctx, mottledPeelL, shade(R, '#767874', 2.7));
      outline(ctx, mottledPeelL, shade(R, '#9e9258', 2.7), 1.5);
      poly(ctx, mottledPeelR, shade(R, '#727470', 4.7));
      outline(ctx, mottledPeelR, shade(R, '#968a52', 4.7), 1.5);
    },
    drawView(ctx) {
      seg(ctx, P(-1.24, -0.35, 2.4), P(-1.24, 0.4, 3.1), CHALK, 1.5);
      seg(ctx, P(1.24, -0.2, 4.4), P(1.24, 0.35, 5.0), CHALK, 1.5);
    },
    hotspots: [
      BACK('l0_atrium', '回到黃色大廳'),
      FORWARD('l0_firedoor', '往灰白牆面深處走'),
      {
        id: 'peel', rect: bounds(mottledPeelL, 8), label: '大片剝落的壁紙', cursor: 'look',
        click: (g) => g.say('發黃的壁紙捲起來一大塊，底下露出的不是木板，而是冰涼又泛著潮氣的灰色混凝土。再往前，黃色幾乎要被吞掉了。'),
      },
    ],
  },

  l0_firedoor: {
    level: 0, title: '混凝土防火門廳', room: l0Firedoor,
    viewMsg: '觀景窗裡，左手邊那扇綠色 EXIT 混凝土門的門框微微發亮，門後像是一條沒有盡頭的空殼走廊。',
    enter(g, { first }) {
      if (first) g.say('地毯還是黃色的，但四周的牆幾乎全退回了裸露的灰混凝土。左手邊多了一扇標著綠色「EXIT」的厚重混凝土門。');
    },
    draw(ctx, t, s, R) {
      drawExit001Door(ctx, R, t);
      poly(ctx, firedoorPatch, shade(R, '#b4a562', 3.2));
      outline(ctx, firedoorPatch, shade(R, '#706844', 3.2), 1.2);
    },
    hotspots: [
      BACK('l0_mottled', '退回斑駁牆過道'),
      { id: 'exit001', rect: bounds(exit001Door, 4), label: '標有綠色「EXIT」字樣的混凝土門', cursor: 'go', click: (g) => g.go('l001_0km') },
      {
        id: 'remnant', rect: bounds(firedoorPatch, 8), label: '殘留的黃壁紙', cursor: 'look',
        click: (g) => g.say('整面混凝土牆上只剩這一塊黃色壁紙還勉強貼著，邊緣被門縫吹出的熱氣烘得微微發捲。'),
      },
    ],
  },

  l0_storage: {
    level: 0, title: '堆滿空箱的隔間', room: l0Storage,
    viewMsg: '觀景窗裡，左邊那只看似空著的大紙箱底部，映出一片一塵不染的白瓷磚與木地板。',
    enter(g, { first }) {
      if (first) g.say('一間堆著幾個折疊空紙箱的黃色隔間。右邊的紙箱都壓扁了，只有左邊角落那只大紙箱敞開著，旁邊牆上貼了張字條。');
    },
    draw(ctx, t, s, R) {
      for (const b of storageBoxes.slice().reverse()) box(ctx, R, b);
      box(ctx, R, c1Box);
      paper(ctx, R, c1BoxNote, 2.55, '#f2eed8');
    },
    drawView(ctx) {
      const opening = [P(-0.97, 0.54, 2.4), P(-0.53, 0.54, 2.4), P(-0.53, 0.54, 2.9), P(-0.97, 0.54, 2.9)];
      poly(ctx, opening, '#e9f0f4');
      seg(ctx, P(-0.75, 0.54, 2.4), P(-0.75, 0.54, 2.9), 'rgba(130,150,165,0.5)', 1);
      seg(ctx, P(-0.97, 0.54, 2.65), P(-0.53, 0.54, 2.65), 'rgba(130,150,165,0.5)', 1);
    },
    hotspots: [
      BACK('l0_atrium', '回到黃色大廳'),
      {
        id: 'cartons', rect: boxRect(storageBoxes[0], 10), label: '堆在右邊的空紙箱', cursor: 'look',
        click: (g) => g.say('幾個受潮發軟的普通瓦楞紙箱，裡面什麼都沒有，箱身上連條碼或廠牌都沒印。'),
      },
      { id: 'c1_box_note', rect: bounds(c1BoxNote, 10), label: '紙箱旁的字條', cursor: 'look', click: (g) => g.read('n_c1_entry') },
      {
        id: 'c1_box', rect: boxRect(c1Box, 8), label: '角落的大紙箱', cursor: 'go',
        click: (g) => g.go('c1_entry', { msg: '你低頭鑽進那個大紙箱。硬紙板擦過肩膀的下一秒，腳下踩到的不再是粗地毯，而是冰涼潔淨的木地板。' }),
      },
    ],
  },

  l0_draft: {
    level: 0, title: '漏風轉角', room: l0Draft,
    viewMsg: '觀景窗裡，天花板旁的通風格柵不斷吐出白霧般的冷氣，讓地毯上的寒意清晰得像一條路徑。',
    enter(g, { first }) {
      if (first) g.say('一踏進這條過道，悶熱的空氣就驟降了好幾度。右上方有個通風格柵正呼呼吹著冷風。');
    },
    draw(ctx, t, s, R) {
      const thaw = s.flags.l03_thawed;
      poly(ctx, coldVent, shade(R, '#8c8a7a', 4.8));
      for (let i = 1; i < 6; i++) { const z = 4.2 + i * 0.2; seg(ctx, P(1, -0.93, z), P(1, -0.62, z), shade(R, '#3a3a32', z), 1.5); }
      if (!thaw) {
        ctx.save(); ctx.globalAlpha = s.flags.cold_vent ? 0.4 : 0.22;
        poly(ctx, frostPath, '#dcecf0'); ctx.restore();
        for (let i = 0; i < 6; i++) {
          const y = -0.6 + ((t * 0.5 + i * 0.17) % 1) * 0.5;
          seg(ctx, P(0.98, y, 4.4 + i * 0.15), P(0.8, y + 0.08, 4.5 + i * 0.15), 'rgba(220,240,255,0.18)', 1);
        }
      }
      poly(ctx, draftThermo, shade(R, '#d8d6c8', 2.3));
      outline(ctx, draftThermo, shade(R, '#5a5a52', 2.3), 1.2);
    },
    hotspots: [
      BACK('l0_atrium', '回到黃色大廳'),
      {
        id: 'thermo', rect: bounds(draftThermo, 10), label: '牆上的舊溫控盒', cursor: 'look',
        click: (g) => g.say(g.s.flags.l03_thawed
          ? '刻度指針停在室溫附近，外殼上的水珠正在慢慢蒸發。'
          : '老式塑膠溫控盒，指針已經卡死在最底端的藍色區域，外殼結了一層細冰。'),
      },
      {
        id: 'vent', rect: bounds(coldVent, 10), label: '天花板旁的通風格柵', cursor: 'look',
        click: (g) => {
          if (g.s.flags.l03_thawed) return g.closeup('l0_vent', { msg: '格柵安安靜靜的，吹出來的是溫的、帶灰塵味的風。' });
          g.flag('cold_vent');
          g.closeup('l0_vent', { msg: '格柵吹出來的風冷得刺骨，跟這一層悶熱的空氣完全不一樣。底下的地毯結了一層薄霜，白白的一條，沿著右牆往過道深處延伸。' });
        },
      },
      {
        id: 'frost', when: (s) => s.flags.cold_vent && !s.flags.l03_thawed, rect: bounds(frostPath, 6), label: '循著地上的白霜走', cursor: 'go',
        click: (g) => g.go('l03_entry', { msg: '你沿著那條霜走。腳下的地毯越來越硬，呼出來的氣變成了白色。牆還是黃色的——只是上面全是冰。' }),
      },
    ],
  },

  l0_colonnade: {
    level: 0, title: '長柱列過道', room: l0Colonnade,
    viewMsg: '觀景窗裡，左柱底的工具箱和右邊門洞上的模板字邊緣都泛著淡淡的螢光——商隊在這裡做過補給與校對。',
    enter(g, { first }) {
      if (first) g.say('成排的黃色方柱往深處延伸，比剛才那間更長。左前柱上留著試噴的模板字，柱腳旁擱著一只金屬工具箱，右牆開著噴有「B.N.T.G. →」的門洞。');
    },
    draw(ctx, t, s, R) {
      drawAnnexEntrance(ctx, R);
      // Faint cart scuff marks curving from the front pillar into the right doorway
      ctx.save();
      ctx.strokeStyle = 'rgba(42,34,12,0.28)'; ctx.lineWidth = 4;
      for (const dz of [-0.08, 0.14]) {
        ctx.beginPath();
        const a = P(-0.4, 1, 2.2 + dz), m = P(0.9, 1, 2.8 + dz), c = P(2.15, 1, 3.4 + dz);
        ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(m[0], m[1], c[0], c[1]); ctx.stroke();
      }
      ctx.restore();
      for (const b of colonnadePillars) {
        box(ctx, R, b);
        poly(ctx, faceQuad(b.x1, 0.86, b.x2, 1, b.z1 - 0.001), shade(R, b.color, b.z1, 0.58));
      }
      // Stencil test mark with corner registration ticks
      poly(ctx, colonnadeMark, 'rgba(65,112,158,0.34)');
      const [mx, my, mw, mh] = bounds(colonnadeMark);
      ctx.strokeStyle = 'rgba(235,230,200,0.65)'; ctx.lineWidth = 1.5;
      ctx.strokeRect(mx + 2, my + 2, mw - 4, mh - 4);
      txt(ctx, 'B.N.', mx + mw / 2, my + mh * 0.62, '700 13px ui-monospace, monospace', 'rgba(240,235,210,0.82)');
      seg(ctx, [mx + mw * 0.68, my + mh * 0.68], [mx + mw * 0.68, my + mh * 0.96], 'rgba(42,84,128,0.55)', 1.5);
      // B.N.T.G. stencil kit box resting on the floor beside the front-left pillar
      box(ctx, R, colonnadeKit);
      const [kx, ky, kw, kh] = boxRect(colonnadeKit);
      ctx.fillStyle = shade(R, '#c8b26a', colonnadeKit.z1);
      ctx.fillRect(kx + kw * 0.16, ky + kh * 0.56, kw * 0.52, Math.max(2, kh * 0.14));
      ctx.fillStyle = '#d4c48a';
      ctx.fillRect(kx + kw * 0.34, ky + kh * 0.36, 6, 4);
    },
    hotspots: [
      BACK('l0_pillar', '回到柱子的房間'),
      { id: 'annex', rect: bounds(annexDoor, 4), label: '右邊噴著 B.N.T.G. 模板字的門洞', cursor: 'go', click: (g) => g.go('l0_annex') },
      {
        id: 'stencil_test', rect: bounds(colonnadeMark, 8), label: '柱面上殘缺的藍色噴漆', cursor: 'look',
        click: (g) => g.say('柱子側面噴著「B.N.」半截測試字樣，邊框四角還留著對位點。有人在這裡試過噴漆罐，確認沒有暈開才往右牆的門洞裡走。'),
      },
      {
        id: 'colonnade_kit', rect: boxRect(colonnadeKit, 8), label: '柱腳旁的 B.N.T.G. 噴漆箱', cursor: 'look',
        click: (g) => g.closeup('l0_colonnade_kit', {
          msg: '一只擱在柱腳邊的軍綠色工具箱，裡面裝著黃銅模板和商隊留下的路線識別卡。',
        }),
      },
    ],
  },
};
