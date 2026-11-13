// Scene graph. Each scene: a procedural room, extra drawing, and clickable hotspots.
// Setting details follow the Backrooms Wiki (CC BY-SA 3.0): Level 0 "Threshold", Level 1 "The Habitable Zone",
// Level 2 "Abandoned Utility Halls", Smilers (Entity 3). Story, notes and puzzles are original.
import {
  P, W, H, box, boxRect, bounds, wallQuad, faceQuad, poly, paper, bottle, pipe, shade, drawSmiler, seg,
} from './render.js';
import { SUBLEVELS, SUBLEVEL_SCENES, drawAnnexEntrance } from './sublevels.js';

export const LEVELS = {
  0: { name: 'LEVEL 0', sub: '門檻', drain: 1 },
  1: { name: 'LEVEL 1', sub: '宜居地帶', drain: 2 },
  2: { name: 'LEVEL 2', sub: '廢棄維修通道', drain: 3 },
  ...SUBLEVELS,
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
const l0Start = {
  hw: 1.6, depth: 5, fogEnd: 13, pal: PAL.l0, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.5, 3.0, 4.3], backDoor: { x1: -0.35, x2: 0.35, top: -0.5 },
  openings: [{ side: 1, z1: 2.6, z2: 3.6, top: -0.6 }], flick: hum,
};
const n1Quad = wallQuad(-1.6, -0.3, 0.1, 2.0, 2.4);
const almond0 = { p: P(0.6, 1, 2.2), z: 2.2 };

const l0Hall = {
  hw: 1, depth: 14, fogEnd: 9, pal: PAL.l0, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.4, 2.9, 4.4, 5.9, 7.4, 8.9, 10.4], flick: hum,
};
const outletQuad = wallQuad(1, 0.55, 0.7, 1.9, 2.05);
const l0Loop = { ...l0Hall, flickerLights: [1, 4] };
const cabinet = { x1: -1, x2: -0.55, y1: 0.25, y2: 1, z1: 2.0, z2: 2.5, color: '#7a5a33', edge: true };
const glitchWall = wallQuad(1, -1, 1, 2.2, 3.0);

const l0Pillar = {
  hw: 2.2, depth: 6, fogEnd: 12, pal: PAL.l0, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.6, 3.4, 5.2], flick: hum,
};
const pillars0 = [
  { x1: -1.1, x2: -0.75, y1: -1, y2: 1, z1: 4.2, z2: 4.55 },
  { x1: 0.75, x2: 1.1, y1: -1, y2: 1, z1: 4.2, z2: 4.55 },
  { x1: -1.1, x2: -0.75, y1: -1, y2: 1, z1: 2.4, z2: 2.75 },
  { x1: 0.75, x2: 1.1, y1: -1, y2: 1, z1: 2.4, z2: 2.75 },
].map((b) => ({ ...b, color: PAL.l0.wall }));
const n0bQuad = faceQuad(-1.06, -0.16, -0.8, 0.16, 2.399);

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

export const SCENES = {
  ...SUBLEVEL_SCENES,
  l0_start: {
    level: 0, title: '某個黃色的房間', room: l0Start,
    enter(g, { first }) {
      if (first) g.say('嗡——。日光燈的嗡嗡聲，潮濕地毯的霉味。你不記得自己是怎麼來到這裡的。');
    },
    draw(ctx, t, s, R) {
      paper(ctx, R, n1Quad, 2.2);
      if (!s.flags.l0_almond) bottle(ctx, R, almond0.p[0], almond0.p[1], 40, almond0.z);
    },
    hotspots: [
      FORWARD('l0_hall', '往前走', bounds(faceQuad(-0.35, -0.5, 0.35, 1, 5), 12)),
      { id: 'side', rect: bounds(wallQuad(1.6, -0.6, 1, 2.6, 3.6), 4), label: '旁邊的房間', cursor: 'go', click: (g) => g.go('l0_pillar') },
      {
        id: 'note', rect: bounds(n1Quad, 8), label: '牆上的紙條', cursor: 'look',
        click: (g) => g.read('n1', () => { if (!g.s.flags.n1_seen) { g.flag('n1_seen'); g.say('字跡……莫名地眼熟。'); } }),
      },
      {
        id: 'almond', when: (s) => !s.flags.l0_almond, rect: [almond0.p[0] - 20, almond0.p[1] - 50, 40, 58], label: '一個瓶子', cursor: 'take',
        click: (g) => { g.flag('l0_almond'); g.give('almond', '地毯上有一瓶杏仁水。你把它收了起來。'); },
      },
    ],
  },

  l0_hall: {
    level: 0, title: '走廊', room: l0Hall,
    enter(g, { first }) { if (first) g.say('一條長長的走廊。盡頭消失在昏黃的霧裡。'); },
    draw(ctx, t, s, R) {
      poly(ctx, outletQuad, shade(R, '#eeeadc', 1.95));
      const c = P(1, 0.62, 1.97);
      ctx.fillStyle = shade(R, '#222', 2); ctx.fillRect(c[0] - 3, c[1] - 6, 2, 5); ctx.fillRect(c[0] - 3, c[1] + 2, 2, 5);
    },
    hotspots: [
      { ...FORWARD('l0_loop', '繼續往前'), click: (g) => { g.s.loops = 1; g.go('l0_loop'); } },
      BACK('l0_start'),
      {
        id: 'outlet', rect: bounds(outletQuad, 14), label: '牆上的插座', cursor: 'look',
        click: (g) => {
          g.say('插座裡傳出細小的聲音……是一個很熟悉的聲音，在叫你的名字。');
          if (!g.s.flags.outlet) { g.flag('outlet'); g.sanity(-3); }
        },
      },
    ],
  },

  l0_loop: {
    level: 0, title: '走廊？', room: l0Loop,
    enter(g) {
      const n = g.s.loops;
      if (n <= 1) g.say('走廊一直延伸，看不到盡頭。');
      else if (n === 2) g.say('……你確定剛才走過這裡。但牆邊多了一個木櫃，之前沒有的。');
      else if (n === 3) g.say('右邊的牆……在閃。像訊號不良的螢幕一樣，一明一滅。');
      else g.say(LOOP_MSGS[n % LOOP_MSGS.length]);
    },
    draw(ctx, t, s, R) {
      if (s.loops >= 2) {
        box(ctx, R, cabinet);
        seg(ctx, P(-0.55, 0.5, 2.0), P(-1, 0.5, 2.0), shade(R, '#3a2a18', 2), 2);
        const k = P(-0.78, 0.38, 2.0);
        ctx.fillStyle = shade(R, '#d8c08a', 2); ctx.fillRect(k[0] - 6, k[1] - 2, 12, 4);
      }
      if (s.loops >= 3) drawGlitchWall(ctx, R, t);
    },
    hotspots: [
      { ...FORWARD('l0_loop', '繼續往前'), click: (g) => { g.s.loops++; g.go('l0_loop'); } },
      BACK('l0_hall'),
      {
        id: 'cabinet', when: (s) => s.loops >= 2, rect: boxRect(cabinet, 6), label: '木櫃', cursor: 'look',
        click: (g) => {
          if (g.s.flags.cabinet) return g.say('抽屜是空的。');
          g.flag('cabinet');
          g.give('almond', '抽屜裡有一瓶杏仁水。瓶身上用你的筆跡寫著：「撐下去。」');
        },
      },
      {
        id: 'wall', when: (s) => s.loops >= 3, rect: bounds(glitchWall, 2), label: '閃爍的牆', cursor: 'go',
        click: (g) => g.go('l1_arrive', { msg: '你閉上眼睛，朝那面閃爍的牆撞過去——沒有撞擊。只有一陣下墜感。腳下的地毯，變成了冰冷的水泥。' }),
      },
    ],
  },

  l0_pillar: {
    level: 0, title: '柱子的房間', room: l0Pillar,
    enter(g, { first }) { if (first) g.say('一間空蕩蕩的大房間，柱子排成整齊的格子，一路延伸到看不見的地方。'); },
    draw(ctx, t, s, R) {
      drawAnnexEntrance(ctx, R);
      for (const b of pillars0) box(ctx, R, b);
      paper(ctx, R, n0bQuad, 2.4, '#f2eed8');
    },
    hotspots: [
      BACK('l0_start'),
      FORWARD('l0_annex', '沿著柱列，探索異常的房間'),
      {
        id: 'note', rect: bounds(n0bQuad, 8), label: '柱子上的便條', cursor: 'look',
        click: (g) => g.read('n0b', () => {
          if (g.s.flags.n0b_seen) return;
          g.flag('n0b_seen'); g.sanity(-4);
          g.say('這是你的筆跡。你很確定。可是你不記得自己寫過。');
        }),
      },
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
          g.flag('crate_open'); g.give('battery'); g.give('almond');
          g.say('你撬開木箱：一顆電池，還有一瓶杏仁水。——你身後的燈管，開始劇烈閃爍。');
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
