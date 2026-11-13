// Scene graph. Each scene: a procedural room, extra drawing, and clickable hotspots.
// Setting details follow the Backrooms Wiki (CC BY-SA 3.0): Level 0 "Threshold", Level 1 "The Habitable Zone",
// Level 2 "Abandoned Utility Halls", Smilers (Entity 3). Story, notes and puzzles are original.
import {
  P, W, H, box, boxRect, bounds, wallQuad, faceQuad, poly, paper, bottle, pipe, shade, drawSmiler, seg, rgb, mul, hex,
} from './render.js';

export const LEVELS = {
  // drain: sanity per step; thirst / hunger: how fast water and food run out per step
  0: { name: 'LEVEL 0', sub: '門檻', drain: 1, thirst: 1.5, hunger: 1 },
  1: { name: 'LEVEL 1', sub: '宜居地帶', drain: 2, thirst: 2, hunger: 1.2 },
  2: { name: 'LEVEL 2', sub: '廢棄維修通道', drain: 2, thirst: 2.5, hunger: 1.5 },
  0.2: { name: 'LEVEL 0.2', sub: '重新裝修的爛攤子', drain: 1, thirst: 1.5, hunger: 1 },
};

const PAL = {
  l0: { wall: '#c8b35e', ceil: '#d6cc96', floor: '#8f7d3b', fog: '#2a2410', light: '#fff4c8' },
  l1: { wall: '#6c6e6a', ceil: '#3a3b39', floor: '#4b4c48', fog: '#101112', light: '#dfe8ff' },
  corridor: { wall: '#bdbab2', ceil: '#8d8a84', floor: '#77746e', fog: '#1b1a18', light: '#fffbe8' },
  office: { wall: '#77736a', ceil: '#45433e', floor: '#4a4640', fog: '#121110', light: '#f2f0e0' },
  deep: { wall: '#6a6460', ceil: '#33302c', floor: '#47423c', fog: '#0f0d0b', light: '#f0e2c8' },
  l2: { wall: '#5b4130', ceil: '#2b1d14', floor: '#3a291d', fog: '#0b0705', light: '#ffaa66' },
  exit: { wall: '#4a4440', ceil: '#262220', floor: '#302a26', fog: '#080808', light: '#bfffd0' },
};

const hum = (t) => 0.975 + 0.025 * Math.sin(t * 55);
const flickery = (t) => {
  const n = Math.sin(t * 13.1) + Math.sin(t * 7.3 + 1) + Math.sin(t * 29.7);
  return n > 2.35 ? 0.55 : 1;
};

const BACK = (to, label = '往回走') => ({
  id: 'back', rect: [330, 470, 300, 70], label, cursor: 'back', click: (g) => g.go(to),
});
const FORWARD = (to, label = '往前走', rect = [400, 205, 160, 140]) => ({
  id: 'forward', rect, label, cursor: 'go', click: (g) => g.go(to),
});

const LOOP_MSGS = [
  '燈管的嗡嗡聲忽然變得很大，又慢慢退了下去。',
  '同樣的地毯，同樣的污漬。你剛才走過的路，好像被重新排列過了。',
  '牆的另一邊傳來抓撓聲，像有什麼東西在磨指甲。',
  '你回頭看了一眼。身後的走廊和前面一模一樣。',
];

// Screen-space rectangle you have to keep the cursor on to hold a smiler's gaze.
export function smilerRect(sm) {
  const [x, y, z] = sm.at;
  const p = P(x, y, z);
  return [p[0] - 60, p[1] - 40, 120, 80];
}
export function drawSmilers(ctx, sm, alpha, t, approach = 0) {
  if (sm.mode === 'stare') {
    const [x, y, z] = sm.at;
    const p = P(x, y, z);
    drawSmiler(ctx, p[0], p[1], (2.6 / z) * (1 + approach * 2.5), alpha, t);
  } else {
    sm.eyes.forEach(([x, y, z], i) => {
      const p = P(x, y, z);
      const blink = Math.sin(t * 0.7 + i * 2.3) > 0.97 ? 0 : 1;
      drawSmiler(ctx, p[0], p[1], (2.4 / z) * (1 + approach * 1.5), alpha * blink, t + i);
    });
  }
}

// ---------- LEVEL 0 ----------
// Level 0's own rule in this game: the Peripheral Shift only fools the eye. Seen through a camcorder's
// viewfinder, a room shows its stable layout, and whatever is being recorded can no longer be rearranged.
const PAL0 = {
  low: { wall: '#b9a554', ceil: '#c4ba86', floor: '#83723a', fog: '#211c0c', light: '#fff0b8' },
  wet: { wall: '#a89648', ceil: '#b9ae7c', floor: '#5f5428', fog: '#1a160a', light: '#f6ecc0' },
  faded: { wall: '#c4ba98', ceil: '#d2cbae', floor: '#6f6748', fog: '#1d1a12', light: '#fff6dc' },
};
const CHALK = 'rgba(236,250,255,0.9)';

const l0Start = {
  hw: 1.6, depth: 5, fogEnd: 13, pal: PAL.l0, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.5, 3.0, 4.3], backDoor: { x1: -0.35, x2: 0.35, top: -0.5 },
  openings: [{ side: 1, z1: 2.6, z2: 3.6, top: -0.6 }, { side: -1, z1: 3.4, z2: 4.3, top: -0.6 }], flick: hum,
};
const n1Quad = wallQuad(-1.6, -0.3, 0.1, 2.0, 2.4);
const almond0 = { p: P(0.6, 1, 2.2), z: 2.2 };

const l0Hall = {
  hw: 1, depth: 14, fogEnd: 9, pal: PAL.l0, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.4, 2.9, 4.4, 5.9, 7.4, 8.9, 10.4], flick: hum, openings: [{ side: -1, z1: 3.0, z2: 3.8, top: -0.6 }],
};
const outletQuad = wallQuad(1, 0.55, 0.7, 1.9, 2.05);
const l0Loop = { ...l0Hall, openings: undefined, flickerLights: [1, 4] };
const cabinet = { x1: -1, x2: -0.55, y1: 0.25, y2: 1, z1: 2.0, z2: 2.5, color: '#7a5a33', edge: true };
const glitchWall = wallQuad(1, -1, 1, 2.2, 3.0);

const l0Pillar = {
  hw: 2.2, depth: 6, fogEnd: 12, pal: PAL.l0, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.6, 3.4, 5.2], flick: hum, openings: [{ side: -1, z1: 3.0, z2: 3.9, top: -0.6 }],
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
  lights: [1.6, 3.2], flickerLights: [1], flick: hum,
};
export const TALLY = { seen: 12, real: 23 };
const tallyArea = faceQuad(-1.5, -0.8, 0.5, -0.12, 3.999);
const locker = { x1: 1.1, x2: 1.75, y1: -0.65, y2: 1, z1: 3.1, z2: 3.7, color: '#6d7176', edge: true };
const mat = { x1: -1.65, x2: -0.65, y1: 0.95, y2: 1, z1: 1.9, z2: 2.9, color: '#a08660', edge: true };
const n0fQuad = wallQuad(-1.8, -0.35, 0.0, 2.2, 2.6);
const pile = [[0.55, 2.3], [0.8, 2.15], [0.68, 2.6], [1.0, 2.45], [0.4, 2.0], [1.2, 2.2]];

// Blackout Zone: no light, deep silence, ankle-deep fluid; the only guide is a hum that keeps moving.
export const BLACKOUT_STEPS = 3;
const DIRS = ['left', 'ahead', 'right'];
const DIR_ZH = { left: '左邊', ahead: '前面', right: '右邊' };
const l0Blackout = {
  hw: 1.4, depth: 5, fogEnd: 6, wallTex: 'concrete', baseboard: false, tiles: true, lights: [],
  pal: { wall: '#6e6440', ceil: '#3a3420', floor: '#2a2614', fog: '#050403', light: '#fff0b8' },
  backDoor: { x1: -0.4, x2: 0.4, top: -0.6 },
  openings: [{ side: -1, z1: 2.2, z2: 3.0, top: -0.6 }, { side: 1, z1: 2.2, z2: 3.0, top: -0.6 }],
};
const pickDir = (prev) => { const o = DIRS.filter((d) => d !== prev); return o[Math.floor(Math.random() * o.length)]; };
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
  g.go('l0_blackout');
}

// The Manila Room: the one place in Level 0 where people can see each other.
const manilaFlick = (t) => (Math.sin(t * 0.37) > 0.985 ? 0.2 : 0.8 + 0.2 * Math.sin(t * 0.9));
const l0Manila = {
  hw: 1.3, depth: 3, fogEnd: 12, tiles: true, floorTex: 'carpet', lights: [1.7], flick: manilaFlick,
  pal: { wall: '#d8c494', ceil: '#e0d4b0', floor: '#8a7a50', fog: '#2a2416', light: '#fff4d0' },
};
const jhTorso = faceQuad(-0.78, 0.18, -0.36, 0.78, 2.75);
const jhLegs = faceQuad(-0.86, 0.72, -0.16, 0.97, 2.55);
const jhHead = P(-0.57, 0.04, 2.75);
const megQuad = wallQuad(1.3, -0.3, 0.1, 1.8, 2.3);
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

// Holes: pitch-black pits in a grid; the light barely reaches past the next row.
export const HOLE_ROWS = 3;
export const LANES = ['left', 'mid', 'right'];
const LANE_X = { left: [-1.35, -0.45], mid: [-0.45, 0.45], right: [0.45, 1.35] };
const LANE_ZH = { left: '左前方', mid: '正前方', right: '右前方' };
const holesFlick = (t) => (Math.sin(t * 1.7) + Math.sin(t * 4.1 + 1) > 1.25 ? 0.22 : 0.95);
const l0Holes = {
  hw: 1.8, depth: 7, fogEnd: 4.2, pal: { ...PAL.l0, fog: '#060502' }, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.5], flickerLights: [], flick: holesFlick,
};
const laneTile = (lane, z1 = 1.7, z2 = 2.5) => {
  const [a, b] = LANE_X[lane];
  return [P(a + 0.06, 1, z1), P(b - 0.06, 1, z1), P(b - 0.06, 1, z2), P(a + 0.06, 1, z2)];
};
export function newHoleRow() {
  const pits = LANES.map(() => Math.random() < 0.6);
  if (pits.every(Boolean)) pits[Math.floor(Math.random() * 3)] = false;
  if (!pits.some(Boolean)) pits[Math.floor(Math.random() * 3)] = true;
  return pits;
}
// decorative far pits, fixed so the grid reads as a grid
const farPits = [['left', 3.0, 3.6], ['right', 3.0, 3.6], ['mid', 4.0, 4.6], ['left', 5.0, 5.6], ['right', 5.0, 5.6]];
const ledge = { x1: -1.2, x2: 1.2, y1: 0.97, y2: 1, z1: 1.6, z2: 3.2, color: '#9a8746' };
const bag = { x1: -0.25, x2: 0.3, y1: 0.7, y2: 1, z1: 2.5, z2: 2.85, color: '#4f5a3e', edge: true };

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

// ---------- LEVEL 1 ----------
const l1Base = { floorTex: 'concrete', wallTex: 'concrete', baseboard: false, flick: flickery };
const l1Arrive = {
  ...l1Base, hw: 2.4, depth: 10, fogEnd: 7.5, pal: PAL.l1, lights: [2, 4.5, 7], flickerLights: [1],
};
const crate1 = { x1: 0.9, x2: 1.5, y1: 0.45, y2: 1, z1: 2.2, z2: 2.8, color: '#8a6a42', edge: true };
const pillars1 = [
  { x1: -0.9, x2: -0.5, y1: -1, y2: 1, z1: 5.5, z2: 5.9, color: '#6c6e6a' },
  { x1: 0.3, x2: 0.7, y1: -1, y2: 1, z1: 3.6, z2: 4.0, color: '#6c6e6a' },
];

const l1Crates = { ...l1Base, hw: 2.4, depth: 8, fogEnd: 7, pal: PAL.l1, lights: [2.2, 5], flickerLights: [0] };
const crateStack = { x1: 0.6, x2: 1.6, y1: -0.2, y2: 1, z1: 3, z2: 4, color: '#7d6140', edge: true };
const crateOpen = { x1: -0.9, x2: -0.1, y1: 0.4, y2: 1, z1: 2.4, z2: 3.2, color: '#8a6a42', edge: true };
const crateBg = [
  { x1: -2.2, x2: -1.3, y1: 0.1, y2: 1, z1: 5.5, z2: 6.5, color: '#6f573b' },
  { x1: -2.2, x2: -1.5, y1: -0.6, y2: 0.1, z1: 5.6, z2: 6.3, color: '#7a6040' },
  { x1: -0.2, x2: 0.7, y1: 0.3, y2: 1, z1: 6, z2: 7, color: '#6f573b' },
];
const n2Quad = faceQuad(0.9, 0.05, 1.25, 0.4, 2.999);
const exitDoorL1 = wallQuad(-2.4, -0.6, 1, 4, 5);
const exitSignL1 = wallQuad(-2.4, -0.8, -0.66, 4.2, 4.8);

const l1Corridor = { hw: 1, depth: 6, fogEnd: 9, pal: PAL.corridor, floorTex: 'concrete', baseboard: false, lights: [1.6, 3.6] };
const officeDoor = wallQuad(-1, -0.6, 1, 2.6, 3.4);
const nMegQuad = wallQuad(1, 0.1, 0.4, 2.0, 2.4);
const megAlmond = { p: P(0.5, 1, 2.3), z: 2.3 };

const l1Office = { ...l1Base, wallTex: undefined, hw: 1.4, depth: 4, fogEnd: 9, pal: PAL.office, tiles: true, lights: [2.2], flickerLights: [0] };
const desk = { x1: -0.7, x2: 0.7, y1: 0.35, y2: 1, z1: 2.4, z2: 3.1, color: '#5d4a36', edge: true };
const lockbox = { x1: -0.2, x2: 0.2, y1: 0.14, y2: 0.35, z1: 2.55, z2: 2.85, color: '#3d4247', edge: true };
const calendar = faceQuad(0.55, -0.6, 1.0, -0.1, 3.999);

const l1Deep = { ...l1Base, hw: 1.6, depth: 9, fogEnd: 7, pal: PAL.deep, lights: [2, 4.5, 7], flickerLights: [2] };

// ---------- LEVEL 2 ----------
const l2Base = { floorTex: 'concrete', wallTex: 'concrete', baseboard: false, pal: PAL.l2 };
const l2Pipes = {
  ...l2Base, hw: 1, depth: 12, fogEnd: 8, lights: [2, 4.5, 7], flickerLights: [2], flick: flickery,
  openings: [{ side: 1, z1: 3, z2: 3.8, top: -0.6 }],
};
const n4Quad = wallQuad(-1, -0.2, 0.15, 1.7, 2.0);
const l2Dark = { ...l2Base, hw: 1, depth: 5, fogEnd: 6, lights: [] };
const almond2 = { p: P(0.45, 1, 2.4), z: 2.4 };
const n5Quad = wallQuad(1, 0.0, 0.35, 2.0, 2.4);
const tubeA = P(-0.65, 0.97, 2.1), tubeB = P(-0.15, 0.97, 2.7);

const l2Valve = { ...l2Base, hw: 1.6, depth: 3, fogEnd: 10, lights: [1.8], flickerLights: [0], flick: flickery };
const panelQuad = faceQuad(-0.8, -0.6, 0.8, 0.4, 2.999);
const doorQuad = wallQuad(1.6, -0.8, 1, 1.6, 2.6);
const DIAL_COLORS = ['#c0392b', '#2e5fa8', '#c9a227'];

const l2HallDead = { ...l2Base, hw: 1, depth: 10, fogEnd: 7, lights: [] };
const l2HallLit = { ...l2HallDead, lights: [1.6, 3.2, 4.8, 6.4, 8], flick: hum };
const fixture = [P(-0.28, -1, 1.6), P(0.28, -1, 1.6), P(0.28, -1, 2.05), P(-0.28, -1, 2.05)];

const l2Exit = { hw: 1, depth: 4.5, fogEnd: 9, pal: PAL.exit, floorTex: 'concrete', baseboard: false, lights: [] };
const exitDoor = faceQuad(-0.4, -0.55, 0.4, 1, 4.499);

function drawPipes(ctx, R, n = 5) {
  if (n > 0) pipe(ctx, R, -R.hw, -0.62, 0.07, '#8c2f24');
  if (n > 1) pipe(ctx, R, -R.hw, -0.42, 0.06, '#2f4f7a');
  if (n > 2) pipe(ctx, R, R.hw, 0.3, 0.08, '#a08a2a');
  if (n > 3) pipe(ctx, R, -0.45, -1, 0.06, '#6b5a4a', false);
  if (n > 4) pipe(ctx, R, 0.35, -1, 0.09, '#5c4a3b', false);
}
function steam(ctx, x, y, t, strength = 1, n = 14) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const ph = (t * 0.35 + i / n) % 1;
    const px = x + Math.sin(i * 12.9 + t) * 20 * ph;
    const py = y - ph * 140;
    ctx.fillStyle = `rgba(230,220,210,${(1 - ph) * 0.12 * strength})`;
    ctx.beginPath(); ctx.arc(px, py, 10 + ph * 40, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
function gauge(ctx, R, x, y, z, t, i) {
  const p = P(x, y, z), r = 60 / z;
  ctx.fillStyle = shade(R, '#d8d2c0', z); ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = shade(R, '#222', z); ctx.lineWidth = 2; ctx.stroke();
  const a = -Math.PI / 2 + Math.sin(t * (1 + i) + i) * 0.8;
  seg(ctx, p, [p[0] + Math.cos(a) * r * 0.8, p[1] + Math.sin(a) * r * 0.8], '#111', 1.5);
}
function drawExitSign(ctx, quad, t) {
  ctx.save();
  ctx.shadowColor = 'rgba(80,255,140,0.9)'; ctx.shadowBlur = 24;
  poly(ctx, quad, Math.sin(t * 2) > -0.95 ? '#2fdc6a' : '#1b6a35');
  ctx.restore();
  const c = bounds(quad);
  ctx.fillStyle = '#04200d'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', c[0] + c[2] / 2, c[1] + c[3] / 2 + 1);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
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

const l02Fresh = {
  hw: 1.6, depth: 5, fogEnd: 14, tiles: true, floorTex: 'carpet', lights: [1.8, 3.6],
  pal: { wall: '#ece0a6', ceil: '#f4eed6', floor: '#b0a066', fog: '#2e2914', light: '#fffbe8' },
};
const l02House = {
  hw: 1.6, depth: 5, fogEnd: 9, floorTex: 'concrete', baseboard: false, lights: [1.8], flickerLights: [0], flick: flickery,
  pal: { wall: '#8a7050', ceil: '#3e3122', floor: '#76603f', fog: '#0c0905', light: '#ffe2b0' },
};
const toolbox = { x1: 0.3, x2: 0.85, y1: 0.78, y2: 1, z1: 2.2, z2: 2.55, color: '#b8352a', edge: true };
const lamp = { x: -1.1, z: 3.2 };
const freshOutlet = wallQuad(1.6, 0.5, 0.66, 3.0, 3.18);
const houseDoor = faceQuad(-0.35, -0.55, 0.35, 1, 4.999);
const tape2Box = { x1: -0.85, x2: -0.6, y1: 0.93, y2: 1, z1: 2.3, z2: 2.5, color: '#1e1e20', edge: true };
const voidHoles = [wallQuad(-1.6, -0.6, 0.3, 2.0, 2.6), wallQuad(1.6, -0.9, 0.1, 3.0, 3.8), faceQuad(0.6, -0.8, 1.2, -0.2, 4.999)];

// a tape lying just inside the Red Rooms: worth the seconds it costs?
const tape4Box = { x1: -0.6, x2: -0.35, y1: 0.93, y2: 1, z1: 1.8, z2: 2.0, color: '#1e1e20', edge: true };
export const EXTRA_TAPES = ['tape2', 'tape3', 'tape4'];
export const allTapesWatched = (s) => EXTRA_TAPES.every((id) => s.flags[`watched_${id}`]);

function drawStuds(ctx, R) {
  for (const s of [-1, 1]) {
    for (let z = 1.2; z < R.depth; z += 0.45) seg(ctx, P(s * R.hw, -1, z), P(s * R.hw, 1, z), shade(R, '#b89a6a', z), Math.max(2, 9 / z));
    seg(ctx, P(s * R.hw, 0, 1), P(s * R.hw, 0, R.depth), shade(R, '#b89a6a', 2.5), 3);
  }
  for (let x = -R.hw; x <= R.hw; x += 0.4) seg(ctx, P(x, -1, 1), P(x, -1, R.depth), shade(R, '#6b5434', 2.5), 3);
}
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


export const SCENES = {
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
    enter(g, { first }) { if (first) g.say('一條長長的走廊。盡頭消失在昏黃的霧裡。左手邊有個門洞。'); },
    draw(ctx, t, s, R) {
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
      {
        id: 'outlet', rect: bounds(outletQuad, 14), label: '牆上的插座', cursor: 'look',
        click: (g) => {
          if (g.s.flags.outlet_open) return g.say('插座後面的牆洞裡空空的。那個聲音已經停了。');
          g.say('插座裡傳出細小的聲音……是一個很熟悉的聲音，在叫你的名字。蓋板用兩顆螺絲固定著。');
          if (!g.s.flags.outlet) { g.flag('outlet'); g.sanity(-3); }
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
        click: (g) => g.say(g.s.flags.tile_down
          ? '天花板上只剩一個黑洞。水還在往下滴。'
          : '那塊天花板板泡得發脹，往下垂著，上面好像壓著什麼東西。太高了，手搆不到。'),
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
    level: 0, title: '走廊？', room: (s) => (redCorner(s) ? l0LoopRed : l0Loop),
    viewMsg: (s) => `觀景窗裡，右邊那面牆一直在閃${s.loops < 3 ? '——肉眼看過去，它卻完全正常。' : '。'}`,
    enter(g) {
      const n = g.s.loops;
      if (g.s.view && n < 3) g.say('觀景窗裡，右邊那面牆在閃。肉眼看過去，它卻完全正常。');
      else if (n <= 1) g.say('走廊一直延伸，看不到盡頭。');
      else if (n === 2) g.say('……你確定剛才走過這裡。但牆邊多了一個木櫃，之前沒有的。');
      else if (n === 3) g.say('右邊的牆……在閃。像訊號不良的螢幕一樣，一明一滅。');
      else g.say(LOOP_MSGS[n % LOOP_MSGS.length]);
      if (redCorner(g.s)) g.say('左邊多了一個轉角。轉角後面，透出一點暗紅色的光。');
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
    },
    hotspots: [
      {
        id: 'back', rect: [330, 470, 300, 70], label: '往回走', cursor: 'back',
        click: (g) => g.go('l0_pillar', { msg: '你一回頭，來時的隔間就不見了。眼前是那間有柱子的房間。' }),
      },
      {
        id: 'tally', rect: bounds(tallyArea, 6), label: '牆上的刻痕', cursor: 'look',
        click: (g) => g.say(g.s.view
          ? '鏡頭裡的記號多了好幾個：正、正、正、正、下。肉眼看到的，原來只是一部分。'
          : '牆上刻著一排「正」字記號，每個「正」是五筆：正、正、丅……一共十二筆。'),
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
    ],
  },


  l0_blackout: {
    level: 0, title: '停電區', room: l0Blackout, dark: true, nightshot: true,
    hum: (s) => s.bo?.dir,
    viewMsg: '攝影機切到了夜視模式。畫面很糊，但看得出三個出口——看不出哪個才對。',
    enter(g, { first }) {
      const dir = g.s.bo?.dir || 'ahead';
      g.say(`${first ? '伸手不見五指，安靜得可怕。牆摸起來很粗糙，地上積著到腳踝的水。' : ''}遠遠的，有一盞燈在嗡嗡作響——聲音從${DIR_ZH[dir]}傳來。`);
    },
    draw(ctx, t, s, R) {
      ctx.fillStyle = 'rgba(120,130,110,0.10)';
      const c = P(0, 1, 2.2);
      ctx.beginPath(); ctx.ellipse(c[0], c[1], 260, 40, 0, 0, Math.PI * 2); ctx.fill();
    },
    hotspots: [
      {
        id: 'back', rect: [330, 470, 300, 70], label: '摸黑退回去', cursor: 'back',
        click: (g) => { g.s.bo = null; g.go('l0_low', { msg: '你一路摸著牆退回去，直到看見燈光。' }); },
      },
      { id: 'left', rect: bounds(mazeLeft, 4), label: '左邊', cursor: 'go', click: (g) => blackoutStep(g, 'left') },
      { id: 'right', rect: bounds(mazeRight, 4), label: '右邊', cursor: 'go', click: (g) => blackoutStep(g, 'right') },
      { id: 'ahead', rect: bounds(mazeAhead, 14), label: '前面', cursor: 'go', click: (g) => blackoutStep(g, 'ahead') },
    ],
  },

  l0_manila: {
    level: 0, title: '馬尼拉房間', room: l0Manila,
    viewMsg: '觀景窗裡，那個人手上也舉著一台攝影機。他的螢幕裡，是你。',
    enter(g, { first }) {
      if (g.s.flags.freed_jh) g.say('牆角空了。地毯上只剩一個坐了很久的凹痕。');
      else if (first) g.say('牆角坐著一個人，抱著膝蓋。在這一層，你本來不可能看見任何人。');
      else g.say('那個人還坐在牆角。');
    },
    draw(ctx, t, s, R) {
      const pile0 = faceQuad(0.5, 0.86, 1.0, 1, 2.2);
      poly(ctx, pile0, shade(R, '#efe9d6', 2.2));
      paper(ctx, R, megQuad, 2.0, '#f4f0e0');
      if (s.flags.freed_jh) return;
      const col = shade(R, '#3b3226', 2.7);
      poly(ctx, jhTorso, col);
      poly(ctx, jhLegs, shade(R, '#2f281e', 2.6));
      ctx.fillStyle = shade(R, '#8a7058', 2.75);
      ctx.beginPath(); ctx.arc(jhHead[0], jhHead[1], 19, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = shade(R, '#2a2219', 2.75);
      ctx.beginPath(); ctx.arc(jhHead[0], jhHead[1] - 6, 19, Math.PI, 0); ctx.fill();
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
          const i = g.s.flags.jh_talk || 0;
          g.flag('met_jh');
          g.say(JH_LINES[Math.min(i, JH_LINES.length - 1)]);
          if (i === 2) g.give('almond');
          if (i === 4 && !g.s.flags.jh_shock) { g.flag('jh_shock'); g.sanity(-5); }
          g.flag('jh_talk', i + 1);
        },
      },
      { id: 'note', rect: bounds(megQuad, 8), label: '牆上的文件', cursor: 'look', click: (g) => g.read('n_meg0') },
    ],
  },

  l0_red: {
    level: 0, title: '？？？', room: l0Red, trap: { after: 9, end: 'red' },
    viewMsg: '螢幕上全是雜訊。這裡的東西，連鏡頭都錄不下來。',
    enter(g) {
      g.sfx('sting');
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
          g.sanity(-10);
          g.go('l0_loop', { free: true, msg: '你轉身就跑，頭也不回。等你停下來喘氣，四周又是黃色的走廊。……你差一點就回不來了。' });
        },
      },
      { ...FORWARD('l0_red', '往紅光深處走'), click: (g) => g.end('red') },
      {
        id: 'tape4', when: (s) => !s.flags.tape4, rect: boxRect(tape4Box, 16), label: '黏在地毯上的錄影帶', cursor: 'take',
        click: (g) => { g.flag('tape4'); g.give('tape4', '你彎腰把錄影帶從黏糊糊的地毯上扯下來。標籤寫著「#4」。——快走。'); },
      },
      { id: 'corner', rect: bounds(wallQuad(1, -0.6, 1, 4.5, 5.3), 4), label: '另一個轉角', cursor: 'go', click: (g) => g.end('red') },
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
          const n = 11 + Math.floor(Math.random() * 7);
          g.say(`你數了一下，一共 ${n} 階。${g.s.flags.stairs_counted ? `上次數的時候是 ${g.s.flags.stairs_counted} 階。` : ''}`);
          g.flag('stairs_counted', n);
        },
      },
    ],
  },

  l0_arches: {
    level: 0, title: '拱門的房間', room: l0Arches,
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
      { id: 'arch', rect: bounds(archBack, 6), label: '對面的拱門', cursor: 'look', click: (g) => g.say('拱門後面是另一間拱門的房間，再後面又是一間。走過去，也只會回到這裡。') },
    ],
  },

  l0_holes: {
    level: 0, title: '坑洞區', room: l0Holes,
    viewMsg: '夜視模式下，坑洞的邊緣清楚了一點。坑底……什麼都照不到。',
    enter(g, { first }) {
      const h = g.s.holes;
      if (h.row >= HOLE_ROWS) return;
      if (first) g.say(`樓梯盡頭是一大片地板，上面整齊地排著一個個漆黑的方形坑洞。燈光只照得到眼前一排：${holeText(h.pits)}`);
      else if (h.row === 0) g.say(`又是那片坑洞。眼前這一排，${holeText(h.pits)}`);
    },
    draw(ctx, t, s, R) {
      const h = s.holes || { row: 0, pits: [false, false, false] };
      if (h.row >= HOLE_ROWS) {
        box(ctx, R, ledge);
        if (!s.flags.holes_bag) box(ctx, R, bag);
        poly(ctx, faceQuad(0.7, -0.5, 1.3, 1, 6.999), '#050402');
        return;
      }
      for (const [lane, z1, z2] of farPits) poly(ctx, laneTile(lane, z1, z2), 'rgba(0,0,0,0.75)');
      LANES.forEach((lane, i) => {
        const q = laneTile(lane);
        if (h.pits[i]) {
          poly(ctx, q, '#000');
          ctx.strokeStyle = shade(R, '#5a4c20', 2); ctx.lineWidth = 1.5; poly(ctx, q); ctx.stroke();
        }
      });
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
            ? '你用吊桿往前探——戳了個空。整根桿子伸下去，什麼都碰不到。'
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
        id: 'passage', when: (s) => s.holes?.row >= HOLE_ROWS, rect: bounds(faceQuad(0.7, -0.5, 1.3, 1, 6.999), 10), label: '對面牆上的黑洞', cursor: 'go',
        click: (g) => { g.s.holes = null; g.s.bo = { step: 0, dir: ['left', 'ahead', 'right'][Math.floor(Math.random() * 3)] }; g.go('l0_blackout', { msg: '你走進對面牆上的洞口。燈光在身後一下子就消失了。' }); },
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

  l0_dry: {
    level: 0, title: '乾燥的走廊', room: l0Dry, quiet: 0.35,
    viewMsg: '觀景窗裡，走廊盡頭那扇門的門縫透出光——比外面任何一盞燈都白。',
    enter(g, { first }) {
      if (first) g.say('越往裡走，腳下的地毯越乾。嗡嗡聲小了很多，空氣裡有新油漆的味道。牆邊掛著塑膠布，地上擺著油漆桶。');
    },
    draw(ctx, t, s, R) {
      poly(ctx, sheeting, 'rgba(235,240,245,0.28)');
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
      for (let i = 1; i < 6; i++) seg(ctx, P(-1.2, -1, 1.4 + i * 0.3), P(-1.2, 0.9, 1.5 + i * 0.3), ctx.strokeStyle, 1);
      for (const b of buckets.slice().reverse()) box(ctx, R, b);
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
      { id: 'door', rect: bounds(dryDoor, 12), label: '施工中的門', cursor: 'go', click: (g) => g.go('l02_room', { msg: '你推開門。眼前是一間全新的房間——乾爽的地毯、剛刷好的牆，連插座都通著電。' }) },
    ],
  },

  l02_room: {
    level: 0.2, title: (s) => (s.flags.l02_collapsed ? '蓋到一半的房子' : '翻新過的房間'),
    room: (s) => (s.flags.l02_collapsed ? l02House : l02Fresh), quiet: 0.2,
    trap: { after: 15, when: (s) => s.flags.l02_collapsed, run: (g) => {
      g.flag('l02_collapsed', false); g.sanity(-15); g.sfx('open');
      g.go('l0_dry', { free: true, msg: '頭頂的橫樑斷了，整棟房子朝你壓下來——你被一股力量甩出門外，摔回了乾燥的走廊。身上全是木屑。' });
    } },
    viewMsg: (s) => (s.flags.l02_collapsed ? '觀景窗裡，牆上的破洞外面什麼都沒有。不是黑暗，是什麼都沒有。' : '觀景窗裡，牆壁的油漆底下，看得到一根根木頭骨架的輪廓。'),
    enter(g, { first }) {
      if (g.s.flags.l02_collapsed) g.say('牆壁一面接一面倒下，露出後面蓋到一半的木頭骨架。天花板吱吱作響——得趕快找到門！');
      else if (first) g.say('太乾淨了。乾淨得不像這一層會有的地方。地上放著一個紅色的工具箱。');
    },
    draw(ctx, t, s, R) {
      if (s.flags.l02_collapsed) {
        drawStuds(ctx, R);
        for (const q of voidHoles) poly(ctx, q, '#000');
        poly(ctx, houseDoor, shade(R, '#a07a4a', 5));
        const k = P(0.25, 0.25, 5); ctx.fillStyle = shade(R, '#d8c08a', 5); ctx.fillRect(k[0] - 3, k[1] - 2, 6, 4);
        if (!s.flags.tape2) cassette(ctx, R, tape2Box);
        // dust falling
        ctx.fillStyle = 'rgba(220,200,160,0.5)';
        for (let i = 0; i < 24; i++) { const x = (i * 97) % W, y = ((t * 120 + i * 53) % H); ctx.fillRect(x, y, 2, 2); }
        return;
      }
      poly(ctx, freshOutlet, shade(R, '#ffffff', 3));
      const lp = P(lamp.x, 1, lamp.z), lt = P(lamp.x, -0.1, lamp.z);
      seg(ctx, lp, lt, shade(R, '#555', lamp.z), 3);
      ctx.save(); ctx.shadowColor = 'rgba(255,240,200,0.9)'; ctx.shadowBlur = 30;
      ctx.fillStyle = '#fff4d6'; ctx.beginPath(); ctx.moveTo(lt[0] - 18, lt[1] + 10); ctx.lineTo(lt[0] + 18, lt[1] + 10); ctx.lineTo(lt[0] + 10, lt[1] - 12); ctx.lineTo(lt[0] - 10, lt[1] - 12); ctx.fill();
      ctx.restore();
      if (!s.flags.screwdriver) box(ctx, R, toolbox);
    },
    hotspots: [
      {
        id: 'back', when: (s) => !s.flags.l02_collapsed, rect: [330, 470, 300, 70], label: '回到走廊', cursor: 'back',
        click: (g) => g.go('l0_dry'),
      },
      {
        id: 'toolbox', when: (s) => !s.flags.l02_collapsed && !s.flags.screwdriver, rect: boxRect(toolbox, 8), label: '紅色工具箱', cursor: 'take',
        click: (g) => {
          g.flag('screwdriver'); g.give('screwdriver');
          g.flag('l02_collapsed'); g.sfx('open');
          g.go('l02_room', { free: true, msg: '你從工具箱裡拿起一支螺絲起子——整個房間猛地一震。' });
        },
      },
      { id: 'lamp', when: (s) => !s.flags.l02_collapsed, rect: [P(lamp.x, 0, lamp.z)[0] - 30, P(lamp.x, -0.2, lamp.z)[1], 60, 140], label: '立燈', cursor: 'look', click: (g) => g.say('一盞插著電的立燈。電線插在插座上，插座後面……接到哪裡去？') },
      {
        id: 'tape2', when: (s) => s.flags.l02_collapsed && !s.flags.tape2, rect: boxRect(tape2Box, 14), label: '地上的錄影帶', cursor: 'take',
        click: (g) => { g.flag('tape2'); g.give('tape2', '木屑堆裡躺著一卷錄影帶，標籤上寫著「#2」。'); },
      },
      {
        id: 'door', when: (s) => s.flags.l02_collapsed, rect: bounds(houseDoor, 10), label: '木門', cursor: 'go',
        click: (g) => { g.flag('l02_collapsed', false); g.go('l0_dry', { msg: '你衝出木門，身後傳來一陣崩塌聲。回頭看，門後又是那間乾淨的新房間——好像什麼都沒發生過。' }); },
      },
    ],
  },

  l0_ceiling: {
    level: 0, title: '天花板上面', room: l0Ceil, quiet: 0.25,
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
    level: 0, title: '天花板上面', room: l0Ceil, quiet: 0.25,
    viewMsg: '觀景窗裡，通風管深處的東西反光得更亮了。',
    enter(g, { first }) {
      if (first) g.say('夾層往前延伸。左邊有一塊板子特別潮濕，右邊的地上有一片金屬格柵，牆邊伸出一截通風管。');
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

  l0_archive: {
    level: 0, title: '檔案室', room: l0Archive,
    viewMsg: '觀景窗裡，每一個抽屜的標籤都在閃——只有一個沒有。',
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
        click: (g) => { g.flag('archived_open'); g.say('抽屜的標籤寫著「0120」，墨水還沒全乾。裡面是空的。大小……剛好放得下一台攝影機。'); },
        use: {
          camcorder: (g) => {
            g.take('camcorder');
            g.end('archive');
          },
        },
      },
      {
        id: 'chalk', when: (s) => !s.flags.chalk, rect: [chalkAt[0] - 16, chalkAt[1] - 14, 40, 24], label: '桌上的粉筆', cursor: 'take',
        click: (g) => { g.flag('chalk'); g.give('chalk', '一截用到很短的粉筆。指尖沾上的粉，和隔間地上的箭頭是同一種白。'); },
      },
      { id: 'card', rect: bounds(cardQuad, 12), label: '桌上的卡片', cursor: 'look', click: (g) => g.read('n0i') },
    ],
  },

  // ---------- LEVEL 1 ----------
  l1_arrive: {
    level: 1, title: '倉庫入口', room: l1Arrive, flickerable: true,
    enter(g, { first }) {
      if (first) g.say('水泥地，潮濕的空氣，頭頂管線偶爾傳來悶響。終於安靜了——你從沒想過自己會這麼感激安靜。');
    },
    draw(ctx, t, s, R) {
      for (const b of pillars1.slice().sort((a, b) => b.z1 - a.z1)) box(ctx, R, b);
      const pd = P(-0.6, 1, 2.6);
      ctx.fillStyle = 'rgba(160,175,190,0.12)';
      ctx.beginPath(); ctx.ellipse(pd[0], pd[1], 110, 14, 0, 0, Math.PI * 2); ctx.fill();
      box(ctx, R, crate1);
      if (s.flags.torch) poly(ctx, faceQuad(0.95, 0.45, 1.45, 0.48, 2.2), shade(R, '#1a140c', 2.2));
    },
    hotspots: [
      FORWARD('l1_crates', '倉庫深處', [420, 215, 120, 120]),
      {
        id: 'puddle', rect: [P(-0.6, 1, 2.6)[0] - 110, P(-0.6, 1, 2.6)[1] - 14, 220, 28], label: '地上的積水', cursor: 'look',
        click: (g) => {
          g.drink(20); g.sanity(-6); g.sfx('drink');
          g.say('你跪下來，用手捧起積水喝了幾口。一股鐵鏽和機油的味道……至少喉嚨沒那麼乾了。');
        },
      },
      {
        id: 'crate', rect: boxRect(crate1, 6), label: '木箱', cursor: 'look',
        click: (g) => {
          if (g.s.flags.torch) return g.say('木箱裡只剩下木屑。');
          g.flag('torch'); g.give('torch_empty', '木箱裡有一支手電筒——但電池槽是空的。');
        },
      },
    ],
  },

  l1_crates: {
    level: 1, title: '倉庫', room: l1Crates, flickerable: true,
    draw(ctx, t, s, R) {
      for (const b of crateBg) box(ctx, R, b);
      poly(ctx, exitDoorL1, shade(R, '#8a8f93', 4.5));
      ctx.strokeStyle = shade(R, '#3a3d40', 4.5); ctx.lineWidth = 2; poly(ctx, exitDoorL1); ctx.stroke();
      seg(ctx, P(-2.4, 0.15, 4.1), P(-2.4, 0.15, 4.9), shade(R, '#c8ccd0', 4.5), 3);
      box(ctx, R, crateStack);
      paper(ctx, R, n2Quad, 3, '#e6dcc0');
      box(ctx, R, s.flags.crate_open ? { ...crateOpen, top: '#1a140c' } : crateOpen);
    },
    drawOver(ctx, t) { drawExitSign(ctx, exitSignL1, t); },
    hotspots: [
      BACK('l1_arrive'),
      FORWARD('l1_deep', '繼續往裡走', [420, 205, 120, 110]),
      { id: 'exitdoor', rect: bounds([...exitDoorL1, ...exitSignL1], 4), label: '亮著綠燈的門', cursor: 'go', click: (g) => g.go('l1_corridor') },
      { id: 'note', rect: bounds(n2Quad, 8), label: '紙箱上的字', cursor: 'look', click: (g) => g.read('n2') },
      {
        id: 'crate', rect: boxRect(crateOpen, 6), label: '沒釘牢的木箱', cursor: 'look',
        click: (g) => {
          if (g.s.flags.crate_open) return g.say('空木箱。');
          g.flag('crate_open'); g.give('battery'); g.give('almond'); g.give('can');
          g.say('你撬開木箱：一顆電池、一瓶杏仁水，還有一個罐頭。——你身後的燈管，開始劇烈閃爍。');
          g.flickerSoon();
        },
      },
    ],
  },

  l1_corridor: {
    level: 1, title: '走廊區', room: l1Corridor, safe: true,
    enter(g, { first }) { if (first) g.say('一條狹窄的白色水泥走廊。比外面溫暖，也沒有積水。這裡感覺……安全一點。'); },
    draw(ctx, t, s, R) {
      poly(ctx, officeDoor, shade(R, '#8c8a84', 3));
      ctx.strokeStyle = shade(R, '#4a4844', 3); ctx.lineWidth = 2; poly(ctx, officeDoor); ctx.stroke();
      const k = P(-1, 0.2, 3.25); ctx.fillStyle = shade(R, '#d0ccc0', 3); ctx.fillRect(k[0] - 2, k[1] - 3, 5, 6);
      paper(ctx, R, nMegQuad, 2.2, '#f4f0e0');
      const c = P(0.5, 1, 2.3);
      ctx.fillStyle = shade(R, '#b8e02a', 2.3);
      ctx.beginPath(); ctx.ellipse(c[0], c[1] + 2, 40, 9, 0, 0, Math.PI * 2); ctx.fill();
      if (!s.flags.meg_almond) bottle(ctx, R, megAlmond.p[0], megAlmond.p[1], 42, megAlmond.z);
    },
    hotspots: [
      BACK('l1_crates', '回到倉庫'),
      { id: 'office', rect: bounds(officeDoor, 4), label: '一扇門', cursor: 'go', click: (g) => g.go('l1_office') },
      { id: 'note', rect: bounds(nMegQuad, 8), label: '貼在牆上的紙條', cursor: 'look', click: (g) => g.read('n_meg') },
      {
        id: 'almond', when: (s) => !s.flags.meg_almond, rect: [megAlmond.p[0] - 22, megAlmond.p[1] - 52, 44, 60], label: '螢光布上的瓶子', cursor: 'take',
        click: (g) => { g.flag('meg_almond'); g.give('almond', '螢光黃的布上放著一瓶杏仁水。你拿起它，把布攤平在地上。'); },
      },
    ],
  },

  l1_office: {
    level: 1, title: '辦公室', room: l1Office, safe: true,
    draw(ctx, t, s, R) {
      poly(ctx, calendar, shade(R, '#e9e4d4', 4));
      const c = P(0.775, -0.5, 4);
      ctx.fillStyle = shade(R, '#a3241c', 4); ctx.font = 'bold 11px sans-serif'; ctx.fillText('JAN', c[0] - 10, c[1]);
      const r = P(0.86, -0.25, 4);
      ctx.strokeStyle = shade(R, '#c0281e', 4); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(r[0], r[1], 5, 0, Math.PI * 2); ctx.stroke();
      box(ctx, R, desk);
      box(ctx, R, lockbox);
      poly(ctx, faceQuad(-0.08, 0.18, 0.08, 0.3, 2.549), shade(R, '#1f2a1f', 2.5));
      const led = P(0.14, 0.2, 2.549);
      ctx.fillStyle = s.flags.box_open ? '#3f3' : '#f33';
      ctx.beginPath(); ctx.arc(led[0], led[1], 2.5, 0, Math.PI * 2); ctx.fill();
    },
    hotspots: [
      BACK('l1_corridor'),
      { id: 'calendar', rect: bounds(calendar, 8), label: '月曆', cursor: 'look', click: (g) => g.say('月曆停在一月。20 號被紅筆圈了好幾圈。') },
      {
        id: 'lockbox', rect: boxRect(lockbox, 14), label: '上鎖的鐵盒', cursor: 'look',
        click: (g) => {
          if (g.s.flags.box_open) return g.say('鐵盒已經空了。');
          g.keypad('0120', () => {
            g.flag('box_open'); g.give('valve');
            g.say('鐵盒彈開了：一個沉重的閥門把手，還有一張紙條。');
            g.read('n3');
          });
        },
      },
    ],
  },

  l1_deep: {
    level: 1, title: '倉庫更深處', room: l1Deep, flickerable: true,
    enter(g, { first }) { if (first) g.say('越往前走，牆上的管線和儀表就越多。空氣變得悶熱。'); },
    draw(ctx, t, s, R) {
      drawPipes(ctx, R, 2);
      [[-1.6, -0.1, 2.4], [-1.6, -0.1, 3.2], [1.6, -0.2, 3.6]].forEach(([x, y, z], i) => gauge(ctx, R, x, y, z, t, i));
    },
    hotspots: [
      BACK('l1_crates'),
      {
        ...FORWARD('l2_pipes', '朝管線越來越多的方向走'),
        click: (g) => g.go('l2_pipes', { msg: '你不確定是從哪一步開始的——水泥牆變成了磚牆，管線爬滿四周，空氣熱得發燙。這裡已經是另一層了。' }),
      },
    ],
  },

  // ---------- LEVEL 2 ----------
  l2_pipes: {
    level: 2, title: '維修通道', room: l2Pipes,
    draw(ctx, t, s, R) {
      drawPipes(ctx, R);
      paper(ctx, R, n4Quad, 1.85, '#e8dcc0');
      const sp = P(1, 0.25, 5);
      steam(ctx, sp[0], sp[1], t, s.flags.solved ? 0.3 : 1);
    },
    hotspots: [
      FORWARD('l2_valve', '往前走'),
      BACK('l1_deep', '往回走'),
      { id: 'side', rect: [598, 208, 58, 156], label: '漆黑的岔路', cursor: 'go', click: (g) => g.go('l2_dark') },
      { id: 'note', rect: bounds(n4Quad, 8), label: '釘在管線旁的紙', cursor: 'look', click: (g) => g.read('n4') },
    ],
  },

  l2_dark: {
    level: 2, title: '漆黑的岔路', room: l2Dark, dark: true,
    smiler: {
      mode: 'stare', at: [0.05, -0.15, 4.2], back: 'l2_pipes',
      present: (s) => !s.flags.l2_smiler_gone,
      gone: (g) => { g.flag('l2_smiler_gone'); g.say('那對眼睛慢慢、慢慢地退回了黑暗深處。……現在，應該可以開手電筒了。'); },
    },
    enter(g) {
      if (!g.s.flags.l2_smiler_gone) {
        g.say(g.s.light ? '光圈的盡頭，有東西反射著光——' : '黑暗裡，浮著一對發光的眼睛，和一排牙齒。');
      }
    },
    draw(ctx, t, s, R) {
      drawPipes(ctx, R);
      paper(ctx, R, n5Quad, 2.2, '#ddd0b0');
      if (!s.flags.tube) {
        ctx.save(); ctx.lineCap = 'round';
        seg(ctx, tubeA, tubeB, shade(R, '#f2f2ea', 2.4), 9);
        seg(ctx, tubeA, tubeB, 'rgba(255,255,255,0.4)', 3);
        ctx.restore();
      }
      if (!s.flags.l2_almond) bottle(ctx, R, almond2.p[0], almond2.p[1], 40, almond2.z);
    },
    hotspots: [
      BACK('l2_pipes', '慢慢退回去'),
      { id: 'note', when: (s) => s.flags.l2_smiler_gone && s.light, rect: bounds(n5Quad, 8), label: '牆上的字條', cursor: 'look', click: (g) => g.read('n5') },
      {
        id: 'tube', when: (s) => s.flags.l2_smiler_gone && s.light && !s.flags.tube, rect: bounds([tubeA, tubeB], 14), label: '地上的燈管', cursor: 'take',
        click: (g) => { g.flag('tube'); g.give('tube', '一根完好的日光燈管，藏在管線底下。'); },
      },
      {
        id: 'almond', when: (s) => s.flags.l2_smiler_gone && s.light && !s.flags.l2_almond, rect: [almond2.p[0] - 20, almond2.p[1] - 50, 40, 58], label: '一個瓶子', cursor: 'take',
        click: (g) => { g.flag('l2_almond'); g.give('almond', '角落裡有一瓶杏仁水。'); },
      },
    ],
  },

  l2_valve: {
    level: 2, title: '控制室', room: l2Valve,
    draw(ctx, t, s, R) {
      drawPipes(ctx, R);
      poly(ctx, panelQuad, shade(R, '#3a3d40', 3));
      ctx.strokeStyle = shade(R, '#15171a', 3); ctx.lineWidth = 3; poly(ctx, panelQuad); ctx.stroke();
      const vals = s.flags.dials || [0, 0, 0];
      DIAL_COLORS.forEach((c, i) => {
        const [x, y] = P(-0.5 + i * 0.5, -0.25, 3);
        ctx.fillStyle = shade(R, '#d8d2c0', 3); ctx.beginPath(); ctx.arc(x, y, 24, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = shade(R, c, 3); ctx.lineWidth = 5; ctx.stroke();
        ctx.strokeStyle = 'rgba(40,120,40,0.8)'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(x, y, 18, -0.9, -0.3); ctx.stroke();
        const wob = s.flags.solved ? 0 : Math.sin(t * (3 + i) + i) * 0.25;
        const ang = s.flags.solved ? -0.6 : -Math.PI + (vals[i] / 9) * Math.PI + wob;
        ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang) * 18, y + Math.sin(ang) * 18); ctx.stroke();
      });
      const [vx, vy] = P(0, 0.22, 3);
      ctx.fillStyle = shade(R, '#111', 3); ctx.fillRect(vx - 10, vy - 10, 20, 20);
      if (s.flags.valve_set) {
        ctx.strokeStyle = shade(R, '#b02a20', 3); ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(vx, vy, 20, 0, Math.PI * 2); ctx.stroke();
        seg(ctx, [vx - 20, vy], [vx + 20, vy], ctx.strokeStyle, 4); seg(ctx, [vx, vy - 20], [vx, vy + 20], ctx.strokeStyle, 4);
      }
      poly(ctx, doorQuad, s.flags.solved ? '#050403' : shade(R, '#4b4f52', 2));
      if (!s.flags.solved) {
        const [dx, dy] = P(1.6, 0.1, 2.1);
        ctx.strokeStyle = shade(R, '#202325', 2); ctx.lineWidth = 6;
        ctx.beginPath(); ctx.ellipse(dx, dy, 22, 34, 0, 0, Math.PI * 2); ctx.stroke();
        const sp = P(1.5, 0.9, 2.4); steam(ctx, sp[0], sp[1], t, 0.8, 10);
      }
    },
    hotspots: [
      BACK('l2_pipes'),
      {
        id: 'panel', rect: bounds(panelQuad, 6), label: '控制盤', cursor: 'look',
        click: (g) => {
          const f = g.s.flags;
          if (!f.valve_set) return g.say('控制盤上有三個壓力錶，正中央有個方形插槽——少了閥門把手。');
          if (f.solved) return g.say('三個指針都停在綠色區域。');
          g.dials({
            colors: DIAL_COLORS, names: ['紅', '藍', '黃'], answer: [5, 8, 3],
            onWrong: () => { g.sfx('steam'); g.sanity(-8); g.say('蒸汽猛地從接縫噴出！讀數不對。'); },
            onRight: () => { g.flag('solved'); g.sfx('open'); g.say('管線的呻吟停了下來。右邊的鐵門「喀」地一聲鬆開了。'); },
          });
        },
        use: {
          valve: (g) => { g.flag('valve_set'); g.take('valve'); g.sfx('open'); g.say('把手卡進插槽，發出沉重的「喀」一聲。'); },
        },
      },
      {
        id: 'door', rect: bounds(doorQuad, 0), label: '鐵門', cursor: 'go',
        click: (g) => {
          if (!g.s.flags.solved) return g.say('鐵門被壓力鎖死了，門把燙得碰不得。');
          g.go('l2_hall');
        },
      },
    ],
  },

  l2_hall: {
    level: 2, title: '熄燈的通道', room: (s) => (s.flags.circuit ? l2HallLit : l2HallDead),
    dark: (s) => !s.flags.circuit,
    smiler: {
      mode: 'nest', back: 'l2_valve', present: (s) => !s.flags.circuit,
      eyes: [[-0.4, -0.2, 6], [0.3, 0.1, 6.8], [0.6, -0.4, 7.6], [-0.7, 0.2, 8.2], [0.05, -0.55, 8.8], [-0.2, 0.35, 9.4]],
    },
    enter(g, { first }) {
      if (!g.s.flags.circuit && first) g.say('整條通道的燈都是暗的。黑暗深處，有好多、好多對眼睛。你不可能同時盯住牠們全部。');
    },
    draw(ctx, t, s, R) {
      drawPipes(ctx, R);
      poly(ctx, fixture, s.flags.circuit ? shade(R, '#fff4dd', 1.8) : shade(R, '#3a3530', 1.8));
    },
    drawOver(ctx, t, s) {
      if (s.flags.circuit) return;
      // sparks from the cracked tube: the only light here
      if (Math.sin(t * 9) + Math.sin(t * 23) > 0.9) {
        const c = P(0.05, -1, 1.8);
        ctx.save(); ctx.shadowColor = '#9cf'; ctx.shadowBlur = 18;
        ctx.strokeStyle = '#dff'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(c[0], c[1]);
        for (let i = 0; i < 4; i++) ctx.lineTo(c[0] + Math.sin(t * 50 + i) * 25, c[1] + 10 + i * 8);
        ctx.stroke(); ctx.restore();
      }
      ctx.strokeStyle = 'rgba(200,220,255,0.18)'; ctx.lineWidth = 1;
      poly(ctx, fixture); ctx.stroke();
    },
    hotspots: [
      BACK('l2_valve', '慢慢退回控制室'),
      {
        id: 'fixture', when: (s) => !s.flags.circuit, rect: bounds(fixture, 12), label: '冒火花的燈座', cursor: 'look',
        click: (g) => g.say('燈座裡的燈管裂了。這條通道的燈全串在一起——壞一根，整排都不會亮。'),
        use: {
          tube: (g) => {
            g.take('tube'); g.flag('circuit'); g.sfx('open');
            g.say('你換上新燈管。整排燈「嗡」地一聲接連亮起——黑暗深處的笑容，一個接一個縮了回去。');
          },
        },
      },
      {
        ...FORWARD('l2_exit', '往前走'),
        click: (g) => {
          if (!g.s.flags.circuit) return g.say('走進那片黑暗等於送死。得先讓這條通道亮起來。');
          g.go('l2_exit');
        },
      },
    ],
  },

  l2_exit: {
    level: 2, title: '？？？', room: l2Exit,
    enter(g, { first }) { if (first) g.say('一條安靜的短走廊。盡頭的門上方，亮著一塊綠色的牌子。'); },
    draw(ctx, t, s, R) {
      poly(ctx, exitDoor, shade(R, '#5a5f60', 4.5));
      const k = P(0.28, 0.25, 4.5); ctx.fillStyle = shade(R, '#c8c8b0', 4.5); ctx.fillRect(k[0] - 4, k[1] - 2, 8, 4);
      const sg = faceQuad(-0.26, -0.82, 0.26, -0.62, 4.5);
      ctx.save(); ctx.shadowColor = 'rgba(80,255,140,0.9)'; ctx.shadowBlur = 30;
      poly(ctx, sg, '#103a1c'); ctx.restore();
      const c = P(0, -0.72, 4.5);
      ctx.fillStyle = (Math.sin(t * 2) > -0.95) ? '#7dffa8' : '#2b6b40';
      ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('EXIT', c[0], c[1]); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      const glow = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], 220);
      glow.addColorStop(0, 'rgba(90,255,150,0.18)'); glow.addColorStop(1, 'rgba(90,255,150,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    },
    hotspots: [
      BACK('l2_hall'),
      { id: 'exit', rect: bounds(exitDoor, 10), label: '推開門', cursor: 'go', click: (g) => g.end('escape') },
    ],
  },
};
