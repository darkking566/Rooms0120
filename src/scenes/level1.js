// Level 1 "The Habitable Zone": the warehouse, corridors, fog halls, the M.E.G. outpost, the Garden and the works.
// Setting details follow the Backrooms Wiki (CC BY-SA 3.0); story, notes and puzzles are original.
import {
  P, box, boxRect, bounds, wallQuad, faceQuad, poly, paper, bottle, shade, seg,
} from '../render.js';
import { BACK, CHALK, FORWARD, PAL, drawExitSign, drawPipes, flickery, gauge } from './common.js';

// ---------- LEVEL 1 ----------
const l1Base = { floorTex: 'concrete', wallTex: 'concrete', baseboard: false, flick: flickery };
// ---------- arriving in Level 1 ----------
// Every way into Level 1 leaves something behind at the warehouse entrance.
const ARRIVALS = {
  zenith: '你回頭看——身後只有一面水泥牆。一塊結霜的金屬板躺在你腳邊，是天頂站的外殼碎片，跟著你一起切了出來。左邊的出口外面，是一片白茫茫的霧。',
  flood: '你身上還在滴水，每走一步就在水泥地上留下一個濕腳印。牆邊擺著一條摺好的毯子，上面別著一張紙條。左邊的出口外面，是一片白茫茫的霧。',
  memory: '馬廄和乾草都不見了，柱子變回了現在的樣子。只有腳邊一塊馬蹄鐵，證明你剛才不是在做夢。左邊的出口外面，是一片白茫茫的霧。',
  inverted: '你從牆裡摔出來，跌在潮濕的水泥地上。燈是亮的——光就是光，暗就是暗。你盯著頭頂的燈管看了很久，確定它沒有在往下滴黑色的東西。左邊的出口外面，是一片白茫茫的霧。',
};
const hullPlate = [P(0.05, 1, 2.35), P(0.6, 1, 2.3), P(0.55, 1, 2.8), P(0.1, 1, 2.85)];
const blanket = { x1: -2.2, x2: -1.7, y1: 0.86, y2: 1, z1: 2.3, z2: 2.75, color: '#5a6a4a', edge: true };
const shoeAt = [-0.2, 1, 3.6];
function drawArrivalTraces(ctx, t, s, R) {
  const f = s.flags;
  if (f.l1_via_flood) {
    ctx.fillStyle = 'rgba(150,170,195,0.3)';
    for (let i = 0; i < 6; i++) { const p = P(-0.1 - i * 0.3 + (i % 2) * 0.12, 1, 1.9 + i * 0.12); ctx.beginPath(); ctx.ellipse(p[0], p[1], 9, 4, 0, 0, Math.PI * 2); ctx.fill(); }
    if (!f.l1_blanket) {
      box(ctx, R, blanket);
      const tg = P(-1.95, 0.86, 2.4); ctx.fillStyle = shade(R, '#efe7cf', 2.4); ctx.fillRect(tg[0] - 8, tg[1] - 3, 16, 6);
    }
  }
  if (f.l1_via_zenith) {
    poly(ctx, hullPlate, shade(R, '#9aa4ac', 1.8));
    ctx.fillStyle = 'rgba(230,245,255,0.45)';
    for (let i = 0; i < 9; i++) { const p = P(0.13 + (i % 3) * 0.17, 1, 2.42 + Math.floor(i / 3) * 0.14); ctx.fillRect(p[0] - 1, p[1] - 1, 3, 3); }
  }
  if (f.l1_via_memory) {
    const p = P(...shoeAt);
    ctx.strokeStyle = shade(R, '#d8c8b0', 1.8); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(p[0], p[1], 15, 6, 0, Math.PI * 0.15, Math.PI * 1.85, false); ctx.stroke();
  }
}
const ARRIVAL_SPOTS = [
  {
    id: 'hull', when: (s) => s.flags.l1_via_zenith, rect: bounds(hullPlate, 10), label: '結霜的金屬板', cursor: 'look',
    click: (g) => {
      g.say('天頂站的外殼碎片。摸起來冰得像外太空，霜一直融不掉。背面刻著一行小字：「R.V. —— 我們有看到星星」。');
      if (!g.s.flags.l1_hull) { g.flag('l1_hull'); g.sanity(4); }
    },
  },
  {
    id: 'blanket', when: (s) => s.flags.l1_via_flood && !s.flags.l1_blanket, rect: boxRect(blanket, 10), label: '摺好的毯子', cursor: 'take',
    click: (g) => {
      g.flag('l1_blanket'); g.sanity(10);
      g.say('紙條上寫著：「給從療舍上來的人：先把衣服擰乾，別在濕的時候睡覺。往裡走有手電筒。—— M.E.G.」\n你用毯子把自己裹起來，抖了很久，終於不冷了。');
    },
  },
  {
    id: 'shoe', when: (s) => s.flags.l1_via_memory, rect: [P(...shoeAt)[0] - 24, P(...shoeAt)[1] - 14, 48, 26], label: '馬蹄鐵', cursor: 'look',
    click: (g) => {
      g.say('一塊磨得發亮的馬蹄鐵，還帶著乾草的味道。你看著它，它就一點一點地生鏽——好像這個年代正在把它收回去。');
      if (!g.s.flags.l1_shoe) { g.flag('l1_shoe'); g.sanity(3); }
    },
  },
];

const l1Arrive = {
  ...l1Base, hw: 2.4, depth: 10, fogEnd: 7.5, pal: PAL.l1, lights: [2, 4.5, 7], flickerLights: [1],
  openings: [{ side: -1, z1: 3.4, z2: 4.6, top: -0.6 }],
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

const l1Corridor = { hw: 1, depth: 6, fogEnd: 9, pal: PAL.corridor, floorTex: 'concrete', baseboard: false, lights: [1.6, 3.6], backDoor: { x1: -0.35, x2: 0.35, top: -0.5 }, openings: [{ side: 1, z1: 3.2, z2: 4.4, top: -0.55 }] };
const alphaWay = wallQuad(1, -0.55, 1, 3.2, 4.4);
const officeDoor = wallQuad(-1, -0.6, 1, 2.6, 3.4);
const nMegQuad = wallQuad(1, 0.1, 0.4, 2.0, 2.4);
const megAlmond = { p: P(0.5, 1, 2.3), z: 2.3 };

const l1Office = { ...l1Base, wallTex: undefined, hw: 1.4, depth: 4, fogEnd: 9, pal: PAL.office, tiles: true, lights: [2.2], flickerLights: [0] };
const desk = { x1: -0.7, x2: 0.7, y1: 0.35, y2: 1, z1: 2.4, z2: 3.1, color: '#5d4a36', edge: true };
const lockbox = { x1: -0.2, x2: 0.2, y1: 0.14, y2: 0.35, z1: 2.55, z2: 2.85, color: '#3d4247', edge: true };
const calendar = faceQuad(0.55, -0.6, 1.0, -0.1, 3.999);
// Level 1.5's way in: a window that should not be there, in an office in the middle of the building.
const fakeWindow = faceQuad(-1.1, -0.6, -0.3, 0.1, 3.999);

const l1Deep = { ...l1Base, hw: 1.6, depth: 9, fogEnd: 7, pal: PAL.deep, lights: [2, 4.5, 7], flickerLights: [2] };

// ---------- LEVEL 1: the wider Habitable Zone ----------
// Fog-filled parking halls, an abandoned M.E.G. outpost, the Garden and the never-finished construction
// sector, plus corridor rooms. Sector ideas follow the Level 1 article; the outpost and its story are original.
const PAL1 = {
  fog: { wall: '#4e504c', ceil: '#2a2b29', floor: '#3a3b38', fog: '#1a1c1d', light: '#cfd8e8' },
  outpost: { wall: '#5f5b52', ceil: '#34322d', floor: '#3e3b35', fog: '#0c0b09', light: '#e8e2c8' },
  garden: { wall: '#46503f', ceil: '#262c22', floor: '#323a2a', fog: '#060805', light: '#d8f0c0' },
  infirm: { wall: '#9aa69c', ceil: '#6c766e', floor: '#56605a', fog: '#0e1210', light: '#e8fff0' },
  padded: { wall: '#c8c4b4', ceil: '#9a968a', floor: '#86827a', fog: '#141310', light: '#f0ecd8' },
  works: { wall: '#5a5048', ceil: '#2c2622', floor: '#3e3630', fog: '#0a0807', light: '#ffd8a0' },
};

// the fog hall: keep the red landmark light in front of you, or walk in circles
export const FOG_STEPS = 3;
const FOG_DIRS = ['left', 'ahead', 'right'];
const pickFog = (prev) => { const o = FOG_DIRS.filter((d) => d !== prev); return o[Math.floor(Math.random() * o.length)]; };
const l1Fog = {
  ...l1Base, wallTex: undefined, hw: 3.2, depth: 11, fogEnd: 4.6, pal: PAL1.fog, lights: [2.2], flickerLights: [0],
};
const fogPillars = [[-1.8, 2.6], [1.6, 3.2], [-0.6, 4.4], [2.2, 5.6]].map(([x, z]) => ({ x1: x, x2: x + 0.4, y1: -1, y2: 1, z1: z, z2: z + 0.4, color: '#5a5c58' }));
const FOG_LIGHT = { left: [-2.6, -0.2, 7], ahead: [0.1, -0.3, 9], right: [2.6, -0.2, 7] };
const FOG_RECT = { left: [40, 140, 280, 300], ahead: [370, 150, 220, 230], right: [640, 140, 280, 300] };
function fogStep(g, dir) {
  const f = g.s.fogNav || { step: 0, dir: pickFog() };
  if (dir !== f.dir) {
    g.s.fogNav = { step: 0, dir: pickFog(f.dir) };
    return g.go('l1_fog', { msg: '你朝那個方向走了很久。霧散開一點的時候，你發現自己又站回了起點——同一根柱子，同一攤積水。' });
  }
  if (f.step + 1 >= FOG_STEPS) {
    g.s.fogNav = null;
    return g.go('l1_outpost', { msg: '紅燈越來越近。是一盞裝在鐵門上的警示燈。門上漆著 M.E.G. 的標誌，門沒有鎖。' });
  }
  g.s.fogNav = { step: f.step + 1, dir: pickFog(f.dir) };
  g.go('l1_fog');
}

// the outpost: barricaded, abandoned, the red light still on
const l1Outpost = { hw: 2.0, depth: 6, fogEnd: 11, pal: PAL1.outpost, floorTex: 'concrete', baseboard: false, tiles: true, lights: [2.4], flickerLights: [0], flick: flickery };
const cage = faceQuad(0.3, -0.7, 1.7, 1, 5.999);
const cots = [{ x1: -1.9, x2: -1.0, y1: 0.75, y2: 1, z1: 2.0, z2: 3.2, color: '#5a6248', edge: true }, { x1: -1.9, x2: -1.0, y1: 0.75, y2: 1, z1: 3.8, z2: 5.0, color: '#5a6248', edge: true }];
const opTable = { x1: 0.5, x2: 1.6, y1: 0.4, y2: 1, z1: 2.2, z2: 2.9, color: '#4a4036', edge: true };
const radioBox = { x1: 0.65, x2: 1.05, y1: 0.2, y2: 0.4, z1: 2.35, z2: 2.6, color: '#2e3530', edge: true };
const logQuad = faceQuad(1.15, 0.33, 1.5, 0.4, 2.299);
const mapQuad = wallQuad(-2.0, -0.6, -0.05, 2.2, 3.4);
const gardenDoor = wallQuad(2.0, -0.6, 1, 4.2, 5.2);

// the Garden: lingering is how it takes you
const l1Garden = { ...l1Base, hw: 2.2, depth: 9, fogEnd: 6.5, pal: PAL1.garden, lights: [2.0, 5.0], flickerLights: [1] };
const vines = Array.from({ length: 22 }, (_, i) => {
  const s = i % 2 ? 1 : -1, z = 1.2 + (i * 0.37) % 6;
  return { s, z, y: -1 + ((i * 0.53) % 1.7), k: 0.25 + (i % 5) * 0.08 };
});
const plantMan = { x: 1.1, z: 3.4 };
const vineBag = { x1: -1.2, x2: -0.7, y1: 0.72, y2: 1, z1: 2.5, z2: 2.9, color: '#5b4a34', edge: true };
// Level 1.2's way in: a doorway at the far end, grown shut
const ivyDoor = faceQuad(-0.45, -0.55, 0.45, 1, 8.99);

// corridor rooms off the safer corridors
const l1Corridor2 = { hw: 1, depth: 8, fogEnd: 9, pal: PAL.corridor, floorTex: 'concrete', baseboard: false, lights: [1.6, 4.4], flickerLights: [1], flick: flickery, backDoor: { x1: -0.35, x2: 0.35, top: -0.5 } };
const infirmDoor = wallQuad(-1, -0.6, 1, 2.2, 3.0);
const paddedDoor = wallQuad(1, -0.6, 1, 3.4, 4.2);
const l1Infirm = { hw: 1.8, depth: 5, fogEnd: 11, pal: PAL1.infirm, floorTex: 'concrete', baseboard: false, tiles: true, lights: [2.4], flickerLights: [0], flick: flickery };
const beds = [{ x1: -1.7, x2: -0.9, y1: 0.45, y2: 1, z1: 2.0, z2: 3.4, color: '#e0e6e0', edge: true }, { x1: 0.9, x2: 1.7, y1: 0.45, y2: 1, z1: 2.4, z2: 3.8, color: '#e0e6e0', edge: true }];
const medCab = faceQuad(-0.5, -0.7, 0.3, 0.1, 4.999);
const chartQuad = wallQuad(1.8, -0.4, 0.0, 1.95, 2.35);
const l1Padded = { hw: 1.3, depth: 3.4, fogEnd: 12, pal: PAL1.padded, floorTex: 'concrete', baseboard: false, lights: [1.9], flickerLights: [0], flick: flickery };
const latchQuad = faceQuad(0.75, 0.05, 0.95, 0.2, 3.399);

// Ouroboros: always under construction by workers who do not speak
const l1Works = { ...l1Base, hw: 2.0, depth: 8, fogEnd: 7, pal: PAL1.works, lights: [2.0, 4.6], flickerLights: [1] };
const brickWall = faceQuad(-1.2, -0.4, 1.2, 1, 5.5);
const workers = [[-0.9, 4.6], [0.5, 4.9], [1.3, 3.6]];
const cart = { x1: -1.8, x2: -1.2, y1: 0.55, y2: 1, z1: 2.3, z2: 3.0, color: '#6a5a3a', edge: true };
const clipQuad = faceQuad(-1.7, 0.4, -1.4, 0.54, 2.299);

function drawWorker(ctx, x, z, t, i) {
  const f = P(x, 1, z), top = P(x, -0.5, z), w = 0.3 * 480 / z;
  ctx.fillStyle = 'rgba(14,12,10,0.92)';
  ctx.fillRect(f[0] - w / 2, top[1] + w * 0.6, w, f[1] - top[1] - w * 0.6);
  ctx.beginPath(); ctx.arc(f[0], top[1] + w * 0.3, w * 0.3, 0, Math.PI * 2); ctx.fill();
  // an arm that keeps laying bricks
  const a = Math.sin(t * 1.6 + i * 2) * 0.6;
  seg(ctx, [f[0] + w * 0.4, top[1] + w * 0.9], [f[0] + w * 0.4 + Math.cos(a) * w, top[1] + w * 0.9 + Math.sin(a) * w], 'rgba(14,12,10,0.92)', Math.max(2, w * 0.18));
}
function drawBricks(ctx, R, q, z) {
  poly(ctx, q, shade(R, '#7a4a36', z));
  const b = bounds(q);
  ctx.save(); poly(ctx, q); ctx.clip();
  ctx.strokeStyle = shade(R, '#3a2a20', z); ctx.lineWidth = 1;
  const rh = b[3] / 12;
  for (let r = 0; r < 12; r++) {
    const y = b[1] + r * rh;
    seg(ctx, [b[0], y], [b[0] + b[2], y], ctx.strokeStyle, 1);
    for (let x = b[0] + (r % 2) * rh; x < b[0] + b[2]; x += rh * 2) seg(ctx, [x, y], [x, y + rh], ctx.strokeStyle, 1);
  }
  ctx.restore();
}


export const LEVEL1_SCENES = {
  l1_arrive: {
    level: 1, title: '倉庫入口', room: l1Arrive, flickerable: true, hall: true,
    enter(g, { first }) {
      const from = g.s.flags.l1_fresh;
      if (from) { g.flag('l1_fresh', false); return g.say(ARRIVALS[from]); }
      if (first) g.say('水泥地，潮濕的空氣，頭頂管線偶爾傳來悶響。太安靜了。安靜到你聽得見遠處有什麼在呼吸——也可能只是管線。左邊的出口外面，是一片白茫茫的霧。');
    },
    draw(ctx, t, s, R) {
      for (const b of pillars1.slice().sort((a, b) => b.z1 - a.z1)) box(ctx, R, b);
      drawArrivalTraces(ctx, t, s, R);
      const pd = P(-0.6, 1, 2.6);
      ctx.fillStyle = 'rgba(160,175,190,0.12)';
      ctx.beginPath(); ctx.ellipse(pd[0], pd[1], 110, 14, 0, 0, Math.PI * 2); ctx.fill();
      box(ctx, R, crate1);
      if (s.flags.torch) poly(ctx, faceQuad(0.95, 0.45, 1.45, 0.48, 2.2), shade(R, '#1a140c', 2.2));
    },
    hotspots: [
      FORWARD('l1_crates', '倉庫深處', [420, 215, 120, 120]),
      { id: 'fog', rect: bounds(wallQuad(-2.4, -0.6, 1, 3.4, 4.6), 4), label: '起霧的出口', cursor: 'go', click: (g) => g.go('l1_fog') },
      {
        id: 'puddle', rect: [P(-0.6, 1, 2.6)[0] - 110, P(-0.6, 1, 2.6)[1] - 14, 220, 28], label: '地上的積水', cursor: 'look',
        click: (g) => {
          g.drink(20); g.sanity(-6); g.sfx('drink');
          g.say('你跪下來，用手捧起積水喝了幾口。一股鐵鏽和機油的味道……至少喉嚨沒那麼乾了。');
        },
      },
      ...ARRIVAL_SPOTS,
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
    level: 1, title: '倉庫', room: l1Crates, flickerable: true, hall: true,
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
    enter(g, { first }) { if (first) g.say('一條狹窄的水泥走廊。比外面溫暖，也沒有積水。這裡感覺……安全一點。你很久沒有用過「安全」這個詞了。'); },
    draw(ctx, t, s, R) {
      poly(ctx, officeDoor, shade(R, '#8c8a84', 3));
      ctx.strokeStyle = shade(R, '#4a4844', 3); ctx.lineWidth = 2; poly(ctx, officeDoor); ctx.stroke();
      const k = P(-1, 0.2, 3.25); ctx.fillStyle = shade(R, '#d0ccc0', 3); ctx.fillRect(k[0] - 2, k[1] - 3, 5, 6);
      paper(ctx, R, nMegQuad, 2.2, '#f4f0e0');
      const c = P(0.5, 1, 2.3);
      ctx.fillStyle = shade(R, '#b8e02a', 2.3);
      ctx.beginPath(); ctx.ellipse(c[0], c[1] + 2, 40, 9, 0, 0, Math.PI * 2); ctx.fill();
      if (!s.flags.meg_almond) bottle(ctx, R, megAlmond.p[0], megAlmond.p[1], 42, megAlmond.z);
      const ac = P(1, -0.68, 3.8); ctx.save(); ctx.fillStyle = shade(R, '#e8e2c0', 3.8); ctx.font = '11px monospace'; ctx.textAlign = 'center'; ctx.fillText('ALPHA →', ac[0] - 8, ac[1]); ctx.restore();
    },
    hotspots: [
      BACK('l1_crates', '回到倉庫'),
      { ...FORWARD('l1_corridor2', '走廊往裡延伸'), rect: bounds(faceQuad(-0.35, -0.5, 0.35, 1, 6), 14) },
      { id: 'office', rect: bounds(officeDoor, 4), label: '一扇門', cursor: 'go', click: (g) => g.go('l1_office') },
      { id: 'alpha', rect: bounds(alphaWay, 6), label: '漆著「ALPHA →」的岔路', cursor: 'go', click: (g) => g.go('l1_alpha', { msg: '你跟著牆上的箭頭走。岔路越走越寬，牆上的 M.E.G. 標誌越來越多。' }) },
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
      const [wx, wy, ww, wh] = bounds(fakeWindow);
      const sky = ctx.createLinearGradient(0, wy, 0, wy + wh);
      sky.addColorStop(0, '#9ccbf0'); sky.addColorStop(0.62, '#d8ecf8'); sky.addColorStop(0.63, '#6aa048'); sky.addColorStop(1, '#4a8030');
      ctx.save(); ctx.shadowColor = 'rgba(255,250,220,0.8)'; ctx.shadowBlur = 24; poly(ctx, fakeWindow, sky); ctx.restore();
      seg(ctx, [wx + ww / 2, wy], [wx + ww / 2, wy + wh], '#e8e4d8', 3); seg(ctx, [wx, wy + wh / 2], [wx + ww, wy + wh / 2], '#e8e4d8', 3);
      ctx.strokeStyle = '#e8e4d8'; ctx.lineWidth = 4; poly(ctx, fakeWindow); ctx.stroke();
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
        id: 'window', rect: bounds(fakeWindow, 4), label: '窗戶', cursor: 'go',
        click: (g) => {
          if (!g.s.flags.l15_window) {
            g.flag('l15_window');
            return g.say('一扇窗戶。窗外是一片晴天底下的草地，遠處有一棟紅屋頂的房子。\n……這間辦公室在一整片水泥建築的正中央。它不可能有窗戶。');
          }
          g.go('l15_window', { msg: '你推開窗戶。風是暖的，有青草的味道。你翻過窗台——腳落地的那一刻，草地的聲音全都不見了。' });
        },
      },
      {
        id: 'lockbox', rect: boxRect(lockbox, 14), label: '上鎖的鐵盒', cursor: 'look',
        click: (g) => {
          if (g.s.flags.box_open) return g.say('鐵盒已經空了。');
          g.keypad('0120', () => {
            g.flag('box_open'); g.give('outpost_key');
            g.say('鐵盒彈開了：一把掛著 M.E.G. 吊牌的小鑰匙，還有一張紙條。');
            g.read('n3');
          });
        },
      },
    ],
  },

  l1_deep: {
    level: 1, title: '倉庫更深處', room: l1Deep, flickerable: true, hall: true,
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

  l1_fog: {
    level: 1, title: '霧中的停車場', room: l1Fog, flickerable: true, hall: true,
    viewMsg: '觀景窗裡的霧比較淡。柱子後面站著好幾個人影——放下攝影機，它們就不見了。',
    enter(g, { first }) {
      if (!g.s.fogNav) g.s.fogNav = { step: 0, dir: pickFog() };
      if (first) g.say('一大片停車場似的空間，地上畫著褪色的格線。霧濃得化不開，遠處有一盞紅燈，忽明忽暗。');
      else g.say('霧。柱子。紅燈還在某個方向亮著。');
    },
    draw(ctx, t, s, R) {
      for (let i = -2; i <= 2; i++) seg(ctx, P(i * 1.1, 1, 1.4), P(i * 1.1, 1, 4.5), shade(R, '#a89a5a', 2.5, 0.6), 2);
      for (const b of fogPillars.slice().sort((a, b) => b.z1 - a.z1)) box(ctx, R, b);
    },
    drawOver(ctx, t, s) {
      const dir = s.fogNav?.dir || 'ahead';
      const [x, y, z] = FOG_LIGHT[dir];
      const p = P(x, y, z), on = Math.sin(t * 2.2) > -0.6;
      const gl = ctx.createRadialGradient(p[0], p[1], 2, p[0], p[1], on ? 70 : 40);
      gl.addColorStop(0, on ? 'rgba(255,60,40,0.9)' : 'rgba(160,30,20,0.6)'); gl.addColorStop(1, 'rgba(255,40,20,0)');
      ctx.fillStyle = gl; ctx.fillRect(p[0] - 80, p[1] - 80, 160, 160);
    },
    drawView(ctx, t) {
      for (const [x, z] of [[-1.3, 3.0], [1.1, 3.6], [-0.2, 5.0]]) {
        const f = P(x, 1, z), top = P(x, -0.6, z), w = 0.24 * 480 / z;
        ctx.fillStyle = `rgba(6,10,8,${0.55 + 0.2 * Math.sin(t + x)})`;
        ctx.fillRect(f[0] - w / 2, top[1] + w, w, f[1] - top[1] - w);
        ctx.beginPath(); ctx.arc(f[0], top[1] + w * 0.5, w * 0.45, 0, Math.PI * 2); ctx.fill();
      }
    },
    hotspots: [
      { ...BACK('l1_arrive', '退回倉庫入口'), click: (g) => { g.s.fogNav = null; g.go('l1_arrive'); } },
      ...FOG_DIRS.map((d) => ({ id: `fog_${d}`, rect: FOG_RECT[d], label: { left: '往左前方走', ahead: '往前走', right: '往右前方走' }[d], cursor: 'go', click: (g) => fogStep(g, d) })),
    ],
  },

  l1_outpost: {
    level: 1, title: 'M.E.G. 第七前哨站', room: l1Outpost, safe: true,
    viewMsg: '觀景窗裡，有一張行軍床上躺著人。放下攝影機，床上只有一條揉皺的毯子。',
    enter(g, { first }) {
      if (first) g.say('門後是一間用貨架和木箱堵住窗口的房間。行軍床、無線電、一張貼在牆上的地圖。沒有人。毯子還是攤開的，像是有人剛起身。');
    },
    draw(ctx, t, s, R) {
      poly(ctx, cage, shade(R, '#2a2824', 6));
      ctx.strokeStyle = shade(R, '#8a8a80', 6); ctx.lineWidth = 1;
      const b = bounds(cage);
      for (let x = b[0]; x < b[0] + b[2]; x += 7) seg(ctx, [x, b[1]], [x, b[1] + b[3]], ctx.strokeStyle, 1);
      for (let y = b[1]; y < b[1] + b[3]; y += 7) seg(ctx, [b[0], y], [b[0] + b[2], y], ctx.strokeStyle, 1);
      if (!s.flags.cage_open) { const lk = P(0.35, 0.2, 5.99); ctx.fillStyle = '#b8a040'; ctx.fillRect(lk[0] - 3, lk[1] - 4, 7, 8); }
      paper(ctx, R, mapQuad, 2.8, '#d8ceb0');
      for (const c of cots.slice().reverse()) box(ctx, R, c);
      box(ctx, R, opTable); box(ctx, R, radioBox);
      paper(ctx, R, logQuad, 2.3, '#e8dfc4');
      if (s.flags.garden_open) poly(ctx, gardenDoor, '#070906');
      else {
        poly(ctx, gardenDoor, shade(R, '#4a4c50', 3.9));
        for (let i = 0; i < 4; i++) seg(ctx, P(2.0, -0.4 + i * 0.4, 4.15), P(2.0, -0.2 + i * 0.4, 5.25), shade(R, '#7a5a34', 4.7), 6);
      }
    },
    hotspots: [
      { ...BACK('l1_fog', '回到霧裡'), click: (g) => g.go('l1_fog', { msg: '你一走出門，紅燈就在背後亮了一下，像是在送你。' }) },
      {
        id: 'cage', rect: bounds(cage, 4), label: '物資籠', cursor: 'look',
        click: (g) => {
          if (!g.s.flags.cage_open) return g.say('鐵絲網做的物資籠，掛著一顆黃銅鎖。籠子裡有東西的形狀。');
          if (g.s.flags.cage_taken) return g.say('籠子空了。');
          g.flag('cage_taken'); g.give('valve'); g.give('almond'); g.give('can');
          g.say('籠子裡有一個沉重的閥門把手、一瓶杏仁水、一個罐頭。罐頭上用麥克筆寫著日期，已經過期了四十年。');
        },
        use: {
          outpost_key: (g) => {
            g.take('outpost_key'); g.flag('cage_open'); g.sfx('open');
            g.say('鑰匙插進鎖孔，轉不太動。你用力一扭，鎖「喀」地彈開。');
          },
        },
      },
      {
        id: 'radio', rect: boxRect(radioBox, 10), label: '無線電', cursor: 'look',
        click: (g) => {
          g.sfx('static');
          g.say('雜訊。然後是一個平板的聲音在念數字：「零、一、二、零。零、一、二、零。」念到第三遍的時候，換成了你的聲音。');
          if (!g.s.flags.radio) { g.flag('radio'); g.sanity(-4); }
        },
      },
      { id: 'log', rect: bounds(logQuad, 12), label: '值班日誌', cursor: 'look', click: (g) => g.read('n_log') },
      { id: 'map', rect: bounds(mapQuad, 6), label: '牆上的地圖', cursor: 'look', click: (g) => g.read('n_map') },
      { id: 'cot', rect: boxRect(cots[0], 4), label: '行軍床', cursor: 'look', click: (g) => g.say('毯子還有一點溫度。……也可能只是你的手太冷了。') },
      {
        id: 'garden', rect: bounds(gardenDoor, 4), label: '釘死的門', cursor: 'go',
        click: (g) => {
          if (!g.s.flags.garden_open) {
            g.flag('garden_open'); g.sfx('open');
            return g.say('門上用木板釘著一行字：「東邊。別開。」你一塊一塊撬開木板。門縫裡飄出一股潮濕的泥土味，還有花香。');
          }
          g.go('l1_garden');
        },
      },
    ],
  },

  l1_garden: {
    level: 1, title: '花園', room: l1Garden, flickerable: true, hall: true,
    trap: { after: 22, run: (g) => {
      g.sanity(-14); g.sfx('sting');
      g.go('l1_outpost', { free: true, msg: '你低頭，發現手指僵硬得像樹枝，指甲縫裡冒出細細的根。你拖著腳逃回前哨站，用力搓手，直到它們重新變回手指。' });
    } },
    viewMsg: '觀景窗裡，那個坐著的人在看你。肉眼看過去，他的眼睛是兩朵閉著的花苞。',
    enter(g, { first }) {
      if (first) g.say('藤蔓爬滿了水泥柱和天花板，地上長著一層軟軟的青苔。很安靜，很香。安靜到你想坐下來。——別坐下來。');
      else g.say('花香。你的腳步比上次慢了一點。');
    },
    draw(ctx, t, s, R) {
      ctx.save(); ctx.lineCap = 'round';
      for (const v of vines) {
        const a = P(v.s * R.hw, v.y, v.z), b = P(v.s * R.hw * 0.6, -1, v.z + 0.8), c = P(0, -1, v.z + 1.6);
        ctx.strokeStyle = shade(R, '#3f6a32', v.z, 1, 0.9); ctx.lineWidth = Math.max(1.5, 6 / v.z);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(b[0], b[1], c[0], c[1]); ctx.stroke();
      }
      ctx.restore();
      // the one who sat down
      const f = P(plantMan.x, 1, plantMan.z), w = 0.35 * 480 / plantMan.z;
      ctx.fillStyle = shade(R, '#2c3424', plantMan.z);
      ctx.fillRect(f[0] - w / 2, f[1] - w * 1.4, w, w * 1.4);
      ctx.beginPath(); ctx.arc(f[0], f[1] - w * 1.65, w * 0.32, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = shade(R, '#c8a0b8', plantMan.z);
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(f[0] - w * 0.3 + i * w * 0.15, f[1] - w * 1.9 - (i % 2) * 5, 3, 0, Math.PI * 2); ctx.fill(); }
      poly(ctx, ivyDoor, '#050704');
      if (!s.flags.l12_open) {
        const [x, y, w, h] = bounds(ivyDoor);
        for (let i = 0; i < 9; i++) seg(ctx, [x + (i / 8) * w, y], [x + ((i * 5) % 9 / 8) * w, y + h], shade(R, '#3f6a32', 8.5, 1.1), 3);
      } else {
        const c = P(0, 0.3, 9); ctx.fillStyle = 'rgba(232,192,48,0.7)'; ctx.beginPath(); ctx.arc(c[0], c[1], 6, 0, Math.PI * 2); ctx.fill();
      }
      box(ctx, R, vineBag);
      if (!s.flags.vines_cut) {
        for (let i = 0; i < 6; i++) seg(ctx, P(-1.25 + i * 0.1, 0.65, 2.5), P(-1.3 + i * 0.12, 1, 2.9), shade(R, '#3f6a32', 2.6), 3);
      }
    },
    hotspots: [
      BACK('l1_outpost', '退回前哨站'),
      {
        id: 'ivy', rect: bounds(ivyDoor, 10), label: '藤蔓後面的門洞', cursor: 'go',
        click: (g) => {
          if (!g.s.flags.l12_open) return g.say('花園的最深處，藤蔓密得像一面牆。藤蔓後面有風——那裡是一個門洞。徒手扯不開。');
          g.go('l12_gate', { msg: '你鑽過門洞。藤蔓在你身後慢慢合上了。' });
        },
        use: {
          shears: (g) => {
            if (g.s.flags.l12_open) return g.say('門洞已經剪開了。');
            g.flag('l12_open'); g.sfx('screw');
            g.say('你一刀一刀剪開藤蔓。門洞後面是另一片水泥柱子——同樣的 Level 1，只是開滿了向日葵。');
          },
        },
      },
      {
        id: 'man', rect: [P(plantMan.x, 1, plantMan.z)[0] - 40, P(plantMan.x, 1, plantMan.z)[1] - 110, 80, 115], label: '坐在藤蔓裡的人', cursor: 'look',
        click: (g) => {
          g.say('一個人背靠著柱子坐著，藤蔓從他的袖口和領口長出來。他的嘴角掛著一朵小白花，胸口還在很慢、很慢地起伏。');
          if (!g.s.flags.plant_man) { g.flag('plant_man'); g.sanity(-6); }
        },
      },
      {
        id: 'bag', when: (s) => !s.flags.garden_bag, rect: boxRect(vineBag, 10), label: '被藤蔓纏住的背包', cursor: 'look',
        click: (g) => {
          if (!g.s.flags.vines_cut) return g.say('背包被藤蔓纏得死緊。你用手去扯，藤蔓好像……縮得更緊了。');
          g.flag('garden_bag'); g.give('almond'); g.give('almond'); g.give('photo');
          g.say('背包裡有兩瓶杏仁水，還有一張拍立得照片。照片上的人你不認識——應該不認識。');
        },
        use: {
          shears: (g) => {
            if (g.s.flags.vines_cut) return g.say('藤蔓已經剪斷了。');
            g.flag('vines_cut'); g.sfx('screw');
            g.say('你一根一根剪斷藤蔓。斷口流出透明的汁液，坐在柱子邊的人輕輕抽了一下。');
          },
        },
      },
    ],
  },

  l1_corridor2: {
    level: 1, title: '走廊深處', room: l1Corridor2, safe: true,
    enter(g, { first }) {
      if (first) g.say('走廊往裡延伸，兩側開始出現門。一扇門上掛著紅十字，另一扇門上什麼都沒寫，只有門框四周一圈深色的手印。');
    },
    draw(ctx, t, s, R) {
      poly(ctx, infirmDoor, shade(R, '#a8aca4', 2.6));
      const cr = P(-1, -0.3, 2.6);
      ctx.fillStyle = shade(R, '#b02a20', 2.6); ctx.fillRect(cr[0] - 3, cr[1] - 9, 6, 18); ctx.fillRect(cr[0] - 9, cr[1] - 3, 18, 6);
      poly(ctx, paddedDoor, shade(R, '#8a8680', 3.8));
      ctx.fillStyle = shade(R, '#2a2620', 3.8, 1, 0.6);
      for (let i = 0; i < 9; i++) { const p = P(1, -0.7 + (i % 5) * 0.35, 3.3 + (i % 2) * 1.0); ctx.beginPath(); ctx.arc(p[0], p[1], 4, 0, Math.PI * 2); ctx.fill(); }
    },
    hotspots: [
      BACK('l1_corridor'),
      { id: 'infirmary', rect: bounds(infirmDoor, 4), label: '掛著紅十字的門', cursor: 'go', click: (g) => g.go('l1_infirmary') },
      { id: 'padded', rect: bounds(paddedDoor, 4), label: '滿是手印的門', cursor: 'go', click: (g) => g.go('l1_padded') },
      { ...FORWARD('l1_works', '走廊盡頭傳來敲打聲'), rect: bounds(faceQuad(-0.35, -0.5, 0.35, 1, 8), 14), click: (g) => g.go('l1_works', { msg: '走廊盡頭沒有門，只有一個被打穿的洞。洞的另一邊，敲打聲停了一下，又繼續了。' }) },
    ],
  },

  l1_infirmary: {
    level: 1, title: '醫務室', room: l1Infirm, safe: true,
    viewMsg: '觀景窗裡，兩張床的床單底下都有東西在呼吸。',
    enter(g, { first }) {
      if (first) g.say('兩張病床，一個玻璃藥櫃。消毒水的味道底下，還有一點別的、甜甜的味道。其中一張床上，床單蓋著一個人形。');
    },
    draw(ctx, t, s, R) {
      poly(ctx, medCab, shade(R, '#c8d4cc', 5));
      ctx.strokeStyle = shade(R, '#5a6660', 5); ctx.lineWidth = 2; poly(ctx, medCab); ctx.stroke();
      if (!s.flags.pills) {
        for (let i = 0; i < 4; i++) { const p = P(-0.4 + i * 0.18, -0.25, 4.99); ctx.fillStyle = shade(R, '#d8a040', 5); ctx.fillRect(p[0] - 2, p[1] - 5, 5, 9); }
      }
      for (const b of beds.slice().reverse()) box(ctx, R, b);
      if (!s.flags.sheet) {
        const c = P(-1.3, 0.42, 2.7);
        ctx.fillStyle = shade(R, '#f0f2ee', 2.7);
        ctx.beginPath(); ctx.ellipse(c[0], c[1], 55, 14, 0, Math.PI, 0); ctx.fill();
        ctx.beginPath(); ctx.arc(c[0] - 40, c[1] - 6, 12, 0, Math.PI * 2); ctx.fill();
      }
      seg(ctx, P(0.5, 1, 2.6), P(0.5, -0.4, 2.6), shade(R, '#8a9290', 2.6), 3);
      paper(ctx, R, chartQuad, 2.1, '#eef0e8');
    },
    hotspots: [
      BACK('l1_corridor2'),
      {
        id: 'sheet', when: (s) => !s.flags.sheet, rect: boxRect(beds[0], 4), label: '床單底下的人形', cursor: 'look',
        click: (g) => {
          g.flag('sheet'); g.sanity(-6); g.sfx('sting');
          g.say('你掀開床單。底下沒有人——只有一件外套，擺成一個人躺著的樣子。……和你身上穿的那件一模一樣，連扣子掉了的位置都一樣。');
        },
      },
      {
        id: 'cabinet', rect: bounds(medCab, 6), label: '藥櫃', cursor: 'look',
        click: (g) => {
          if (g.s.flags.pills) return g.say('藥櫃裡只剩空瓶子和一張寫著「勿超過劑量」的標籤。');
          g.flag('pills'); g.give('pills'); g.give('pills');
          g.say('藥櫃的玻璃早就碎了。你在一堆空瓶子裡找到兩片還沒拆封的鎮定劑。');
        },
      },
      { id: 'chart', rect: bounds(chartQuad, 8), label: '病歷', cursor: 'look', click: (g) => g.read('n_chart') },
    ],
  },

  l1_padded: {
    level: 1, title: '軟墊房', room: l1Padded,
    trap: { after: 25, run: (g) => {
      g.sanity(-12); g.sfx('knock');
      g.go('l1_padded', { free: true, msg: '敲門聲從四面八方傳來，越來越急，越來越近——然後停了。安靜得讓你想尖叫。' });
    } },
    viewMsg: '觀景窗裡，門邊的軟墊上有一道細細的縫，縫裡卡著一個門閂。',
    enter(g, { first }) {
      g.sfx('knock');
      g.say(first ? '你一走進去，門就在身後「砰」地關上了。四面牆都包著發黃的軟墊，上面刻滿了字。燈管在頭頂嗡嗡作響。' : '門又關上了。');
    },
    draw(ctx, t, s, R) {
      ctx.strokeStyle = shade(R, '#8a8678', 2.5, 1, 0.6); ctx.lineWidth = 1;
      for (const x of [-1.3, 1.3]) for (let z = 1.2; z < 3.4; z += 0.35) for (let y = -0.9; y < 1; y += 0.35) {
        const p = P(x, y, z); ctx.beginPath(); ctx.arc(p[0], p[1], 2, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.save(); ctx.font = '600 13px ui-monospace, monospace'; ctx.fillStyle = shade(R, '#6a5a48', 3.4);
      for (let r = 0; r < 8; r++) {
        const p = P(-1.2, -0.85 + r * 0.22, 3.399);
        ctx.fillText(r % 3 === 1 ? 'NOT ME  NOT ME  NOT ME' : '|||| |||| |||| |||| ||||', p[0], p[1]);
      }
      ctx.restore();
    },
    drawView(ctx) {
      poly(ctx, latchQuad, '#d8d0b0');
      const c = bounds(latchQuad);
      seg(ctx, [c[0] - 30, c[1] + c[3] / 2], [c[0] - 4, c[1] + c[3] / 2], CHALK, 3);
    },
    hotspots: [
      {
        id: 'back', rect: [330, 470, 300, 70], label: '推門', cursor: 'back',
        click: (g) => { g.sfx('knock'); g.say('門推不動。門外有人在用同樣的力道推回來。'); },
      },
      {
        id: 'latch', when: (s) => s.view, rect: bounds(latchQuad, 14), label: '軟墊縫裡的門閂', cursor: 'go',
        click: (g) => { g.sfx('open'); g.go('l1_corridor2', { msg: '你摸著螢幕上的位置，把手伸進軟墊的縫裡——指尖碰到冰冷的門閂。門開了。門外沒有人。' }); },
      },
      { id: 'note', rect: [P(-1.2, -0.9, 3.4)[0] - 10, P(-1.2, -0.9, 3.4)[1] - 10, 260, 140], label: '刻在軟墊上的字', cursor: 'look', click: (g) => g.read('n_padded') },
    ],
  },

  l1_works: {
    level: 1, title: '施工中的區域', room: l1Works, flickerable: true, hall: true,
    viewMsg: '觀景窗裡，工人們都轉過頭來看著你。放下攝影機，他們還在背對著你砌牆。',
    enter(g, { first }) {
      if (first) g.say('一片永遠蓋不完的工地。幾個穿著連身工作服的人影正在砌一道磚牆，動作整齊得不像人。他們沒有看你一眼。');
    },
    draw(ctx, t, s, R) {
      drawBricks(ctx, R, brickWall, 5.5);
      for (let i = 0; i < 3; i++) seg(ctx, P(-1.6 + i * 1.6, 1, 5.2), P(-1.6 + i * 1.6, -1, 5.2), shade(R, '#8a7a5a', 5.2), 3);
      seg(ctx, P(-1.8, -0.3, 5.2), P(1.8, -0.3, 5.2), shade(R, '#8a7a5a', 5.2), 3);
      // a gap in the bricks: yellow wallpaper behind
      poly(ctx, faceQuad(-0.2, 0.3, 0.2, 0.55, 5.49), shade(R, '#c8b35e', 5.5, 1.3));
      box(ctx, R, cart);
      if (!s.flags.shears) seg(ctx, P(-1.6, 0.5, 2.5), P(-1.35, 0.52, 2.7), '#b0b4b8', 3);
      paper(ctx, R, clipQuad, 2.3, '#e8e0c8');
    },
    drawOver(ctx, t) { for (const [i, [x, z]] of workers.entries()) drawWorker(ctx, x, z, t, i); },
    hotspots: [
      BACK('l1_corridor2'),
      { id: 'workers', rect: [P(-0.9, 1, 4.6)[0] - 30, 170, 300, 150], label: '工人', cursor: 'look', click: (g) => g.say('你走近一個工人。他的工作服上縫著「後室重新裝修公司」。他沒有臉——不是被擋住，是那裡本來就什麼都沒有。他繼續砌牆。') },
      { id: 'gap', rect: bounds(faceQuad(-0.2, 0.3, 0.2, 0.55, 5.49), 14), label: '磚縫', cursor: 'look', click: (g) => { g.say('磚牆最後一塊空缺後面，是黃色的壁紙。你聽見熟悉的嗡嗡聲。一個工人走過來，把最後一塊磚塞了進去。'); if (!g.s.flags.gap_seen) { g.flag('gap_seen'); g.sanity(-4); } } },
      {
        id: 'shears', when: (s) => !s.flags.shears, rect: boxRect(cart, 8), label: '推車上的修枝剪', cursor: 'take',
        click: (g) => { g.flag('shears'); g.give('shears', '推車上放著一把修枝剪。你拿走它的時候，所有的敲打聲同時停了一拍。'); },
      },
      { id: 'clip', rect: bounds(clipQuad, 10), label: '推車上的施工單', cursor: 'look', click: (g) => g.read('n_work') },
    ],
  },

  // ---------- LEVEL 2 ----------
};
