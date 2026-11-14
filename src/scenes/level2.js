// Level 2 "Abandoned Utility Halls": pipes, the camp, the boiler, the dead railway, the void room and the monitor room.
// Setting details follow the Backrooms Wiki (CC BY-SA 3.0); story, notes and puzzles are original.
import {
  P, W, H, box, boxRect, bounds, wallQuad, faceQuad, poly, paper, bottle, pipe, shade, seg,
} from '../render.js';
import { BACK, FORWARD, PAL, drawPipes, flickery, hum } from './common.js';
// The monitor room lists rooms you have seen. SCENES is only read while drawing, after every module has loaded,
// so importing it back from the index is safe.
import { SCENES } from '../scenes.js';

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

// ---------- LEVEL 2 expansion ----------
// From the Level 2 article: series-wired lights, pipes that carry gases and solid objects, steel doors that
// open on abandoned camps, a dead B.N.T.G. railway whose short circuit blacked out the level, void rooms lit
// only by their doorway, things that burrow through walls, Windows at corridor ends, and heat.
const PAL2 = {
  camp: { wall: '#6a5a44', ceil: '#2f281f', floor: '#43382b', fog: '#0c0a07', light: '#ffd09a' },
  boiler: { wall: '#6a3a22', ceil: '#2a140b', floor: '#3a2014', fog: '#120604', light: '#ff8a4a' },
  monitor: { wall: '#3e4640', ceil: '#1d2220', floor: '#2a2f2b', fog: '#050807', light: '#b8ffd0' },
};
const campDoor = wallQuad(-1, -0.7, 1, 4.2, 5.2);

const l2Camp = { ...l2Base, pal: PAL2.camp, hw: 1.8, depth: 5, fogEnd: 10, lights: [1.8, 3.6], flickerLights: [1], flick: flickery };
const bunkLow = { x1: -1.8, x2: -1.05, y1: 0.45, y2: 0.6, z1: 2.0, z2: 3.6, color: '#6a6458', edge: true };
const bunkHigh = { ...bunkLow, y1: -0.3, y2: -0.15 };
const bunkPosts = [2.0, 3.55].map((z) => ({ x1: -1.1, x2: -1.05, y1: -0.3, y2: 1, z1: z, z2: z + 0.05, color: '#4a463e' }));
const campTable = { x1: 0.85, x2: 1.6, y1: 0.35, y2: 1, z1: 2.2, z2: 3.0, color: '#5a4630', edge: true };
const register = [P(0.98, 0.35, 2.35), P(1.42, 0.35, 2.35), P(1.42, 0.35, 2.8), P(0.98, 0.35, 2.8)];
const l2Toolbox = { x1: 0.2, x2: 0.7, y1: 0.75, y2: 1, z1: 1.8, z2: 2.1, color: '#9a2e22', edge: true };
const barrel = { x1: -0.55, x2: -0.1, y1: 0.25, y2: 1, z1: 3.9, z2: 4.3, color: '#3e5266', edge: true };
const board = faceQuad(-0.2, -0.65, 1.2, 0.05, 4.999);

const l2Boiler = { ...l2Base, pal: PAL2.boiler, hw: 1.8, depth: 6, fogEnd: 7, lights: [2.0, 4.0], flick: flickery, backDoor: { x1: 0.3, x2: 1.1, top: -0.6 } };
const boiler = { x1: -1.6, x2: -0.45, y1: -0.6, y2: 1, z1: 3.0, z2: 4.6, color: '#3a2a20', edge: true };
const grate = faceQuad(-1.35, 0.3, -0.7, 0.75, 2.999);
const hatch = wallQuad(-1.8, -0.55, -0.1, 2.0, 2.5);
const wheelC = [1.8, -0.05, 2.5];
const steamJet = [P(0.3, 0.2, 5.0), P(1.1, 0.2, 5.0)];
const boilerDoor = faceQuad(0.3, -0.6, 1.1, 1, 6);

const l2Rail = { ...l2Base, hw: 1.4, depth: 12, fogEnd: 8, lights: [1.8, 5.2], flickerLights: [1], flick: flickery };
const l2Cart = { x1: -0.55, x2: 0.55, y1: 0.45, y2: 0.95, z1: 3.2, z2: 4.4, color: '#4a4a3e', edge: true };
const cells = [-0.4, -0.12, 0.16].map((x) => ({ x1: x, x2: x + 0.22, y1: 0.15, y2: 0.45, z1: 3.5, z2: 3.9, color: '#2e3a2e', edge: true }));
const crate = { x1: 0.0, x2: 0.45, y1: 0.05, y2: 0.45, z1: 4.0, z2: 4.35, color: '#7a6040', edge: true };
const railTag = faceQuad(-0.25, 0.55, 0.15, 0.82, 3.199);
const voidDoor = wallQuad(-1.4, -0.65, 1, 2.0, 2.8);

const l2Narrow = { ...l2Base, hw: 1, depth: 10, fogEnd: 7, lights: [1.6, 4.0], flickerLights: [0], flick: flickery };
const windowQuad = faceQuad(-0.28, -0.55, 0.28, 0.15, 9.99);
const monitorDoor = wallQuad(1, -0.7, 1, 3.2, 3.9);

const l2Monitor = { ...l2Base, pal: PAL2.monitor, hw: 1.6, depth: 4, fogEnd: 10, lights: [1.6], flick: hum };
const screens = [];
for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
  const x = -1.45 + c * 0.74, y = -0.9 + r * 0.5;
  screens.push(faceQuad(x, y, x + 0.66, y + 0.44, 3.999));
}
const l2Desk = { x1: -0.55, x2: 0.55, y1: 0.4, y2: 1, z1: 2.3, z2: 2.9, color: '#3a3a36', edge: true };
const terminal = faceQuad(-0.32, -0.16, 0.32, 0.38, 2.45);
const exitHallDoor = wallQuad(1.6, -0.7, 1, 2.2, 3.2);
export const REC_LINES = [
  { id: 'left', text: '對象離開了。' },
  { id: 'filed', text: '歸檔。' },
  { id: 'name', text: '（寫下名字）' },
];
const recRect = (i) => [300, 230 + i * 44, 360, 36];

function txt(ctx, s, x, y, color, size = 13, align = 'center') {
  ctx.save(); ctx.fillStyle = color; ctx.font = `${size}px ui-monospace, monospace`; ctx.textAlign = align;
  ctx.fillText(s, x, y); ctx.restore();
}
function steelDoor(ctx, R, q, z, color = '#7a7e80') {
  poly(ctx, q, shade(R, color, z));
  ctx.strokeStyle = shade(R, '#1c1e20', z); ctx.lineWidth = 2; poly(ctx, q); ctx.stroke();
}
// Heat: the boiler room bakes the water out of you until the leak is shut.
function heatTick(g, dt) {
  if (g.s.flags.l2_steam_off) return;
  const h = (g.s.flags.l2_heat || 0) + dt;
  if (h >= 1.2) { g.s.flags.l2_heat = h - 1.2; g.drink(-1); } else g.s.flags.l2_heat = h;
}
const sceneTitle = (id, s) => { const t = SCENES[id]?.title; return typeof t === 'function' ? t(s) : t; };


export const LEVEL2_SCENES = {
  l2_pipes: {
    level: 2, title: '維修通道', room: l2Pipes,
    draw(ctx, t, s, R) {
      drawPipes(ctx, R);
      paper(ctx, R, n4Quad, 1.85, '#e8dcc0');
      steelDoor(ctx, R, campDoor, 4.7, '#cfc4a8');
      const cd = P(-1, -0.45, 4.7); txt(ctx, '新來者', cd[0] + 12, cd[1], shade(R, '#2a2420', 4.7), 9);
      const sp = P(1, 0.25, 5);
      steam(ctx, sp[0], sp[1], t, s.flags.solved ? 0.3 : 1);
    },
    hotspots: [
      FORWARD('l2_valve', '往前走'),
      BACK('l1_deep', '往回走'),
      { id: 'side', rect: [598, 208, 58, 156], label: '漆黑的岔路', cursor: 'go', click: (g) => g.go('l2_dark') },
      { id: 'note', rect: bounds(n4Quad, 8), label: '釘在管線旁的紙', cursor: 'look', click: (g) => g.read('n4') },
      { id: 'camp', rect: bounds(campDoor, 8), label: '奶油色的鐵門', cursor: 'go', click: (g) => g.go('l2_camp') },
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
          g.go('l2_boiler');
        },
      },
    ],
  },

  l2_camp: {
    level: 2, title: '收容營', room: l2Camp, safe: true,
    viewMsg: '觀景窗裡，每一張床上都躺著一個人形的凹痕。肉眼看過去，床是平的。',
    enter(g, { first }) {
      if (first) g.say('一間塞滿上下舖的房間。門的內側有四道很深的爪痕，從上到下。這裡曾經住過很多人——住到某一天為止。');
    },
    draw(ctx, t, s, R) {
      for (const b of bunkPosts) box(ctx, R, b);
      box(ctx, R, bunkLow); box(ctx, R, bunkHigh);
      poly(ctx, board, shade(R, '#25302a', 5));
      ctx.strokeStyle = shade(R, '#5a4630', 5); ctx.lineWidth = 3; poly(ctx, board); ctx.stroke();
      const b0 = P(0.5, -0.5, 5);
      txt(ctx, '新來的人：', b0[0], b0[1], shade(R, '#d8dccf', 5), 12);
      txt(ctx, '1 先喝水  2 再登記', b0[0], b0[1] + 16, shade(R, '#d8dccf', 5), 11);
      txt(ctx, '3 別靠近窗戶', b0[0], b0[1] + 32, shade(R, '#d8dccf', 5), 11);
      box(ctx, R, campTable); paper(ctx, R, register, 2.5, '#e6dcc0');
      if (!s.flags.l2_wrench) box(ctx, R, l2Toolbox);
      box(ctx, R, barrel);
      const bt = P(-0.33, 0.25, 4.1);
      txt(ctx, 'A.W.', bt[0], bt[1] + 22, shade(R, '#c9d2d8', 4), 10);
    },
    hotspots: [
      BACK('l2_pipes', '回到管線通道'),
      { id: 'register', rect: bounds(register, 10), label: '桌上的登記簿', cursor: 'look', click: (g) => g.read('n_reg') },
      {
        id: 'board', rect: bounds(board, 4), label: '黑板', cursor: 'look',
        click: (g) => g.say('黑板上的字被擦過很多次，又被重新寫上。第三條底下畫了好幾條線。角落有一行很小的字：「2013——狗來了。」'),
      },
      {
        id: 'toolbox', when: (s) => !s.flags.l2_wrench, rect: boxRect(l2Toolbox, 8), label: '紅色工具箱', cursor: 'take',
        click: (g) => { g.flag('l2_wrench'); g.give('wrench', '工具箱裡的東西幾乎都被拿光了，只剩一把很重的扳手。'); },
      },
      {
        id: 'barrel', rect: boxRect(barrel, 6), label: '藍色鐵桶', cursor: 'take',
        click: (g) => {
          if (g.s.flags.l2_barrel) return g.say('桶底只剩一層發黏的沉澱。');
          g.flag('l2_barrel'); g.give('almond', '桶上漆著「A.W.」。你舀出最後一瓶杏仁水。');
        },
      },
      {
        id: 'bunk', rect: boxRect(bunkLow, 8), label: '下舖', cursor: 'look',
        click: (g) => {
          if (g.s.flags.l2_rested) return g.say('你不想再躺下去了。床墊上的凹痕，太像你的形狀。');
          g.flag('l2_rested'); g.sanity(15); g.drink(-6); g.eat(-6); g.checkpoint();
          g.say('你躺下來，閉上眼睛。上舖的床板很低，近得像棺材蓋。你睡著了，夢見有人在登記簿上寫字。（這裡記住了你的位置。）');
        },
      },
    ],
  },

  l2_boiler: {
    level: 2, title: '鍋爐間', room: l2Boiler,
    hazard: (s) => (s.flags.l2_steam_off ? null : '高溫・水分快速流失'),
    update: heatTick,
    enter(g, { first }) {
      if (first) g.say('熱氣撲面而來，像打開了烤箱。一座鍋爐蹲在左邊，爐口透出暗紅色的光。右邊的管線漏得很兇，蒸汽橫著噴過通道。');
    },
    draw(ctx, t, s, R) {
      drawPipes(ctx, R, 3);
      box(ctx, R, boiler);
      const k = 0.6 + 0.4 * Math.sin(t * 3);
      ctx.save(); ctx.shadowColor = '#ff5a1a'; ctx.shadowBlur = 25 * k;
      poly(ctx, grate, `rgba(255,${90 + 40 * k | 0},30,${0.7 * k})`); ctx.restore();
      for (let i = 1; i < 6; i++) { const x = -1.35 + i * 0.11; seg(ctx, P(x, 0.3, 2.999), P(x, 0.75, 2.999), '#1a0d06', 2); }
      steelDoor(ctx, R, boilerDoor, 6, '#5a4a40');
      poly(ctx, hatch, shade(R, '#4a3a30', 2.2));
      ctx.strokeStyle = shade(R, '#1a120c', 1.8); ctx.lineWidth = 2; poly(ctx, hatch); ctx.stroke();
      const hc = P(-1.8, -0.62, 2.25); txt(ctx, '投遞口', hc[0], hc[1], shade(R, '#d0b090', 2.2), 11);
      const wc = P(...wheelC), r = 70 / wheelC[2];
      ctx.strokeStyle = shade(R, '#b02a20', 2.5); ctx.lineWidth = 6;
      ctx.beginPath(); ctx.ellipse(wc[0], wc[1], r * 0.35, r, 0, 0, Math.PI * 2); ctx.stroke();
      seg(ctx, [wc[0], wc[1] - r], [wc[0], wc[1] + r], ctx.strokeStyle, 4);
      if (!s.flags.l2_steam_off) {
        const [a, b] = steamJet;
        for (let i = 0; i < 8; i++) steam(ctx, a[0] + (b[0] - a[0]) * (i / 7), a[1] + 30, t + i * 0.3, 1.4, 6);
        steam(ctx, wc[0] - 20, wc[1] + 20, t, 0.9, 10);
      }
    },
    hotspots: [
      BACK('l2_valve', '退回控制室'),
      {
        id: 'wheel', rect: [P(...wheelC)[0] - 40, P(...wheelC)[1] - 40, 60, 80], label: '漏氣的閥門轉輪', cursor: 'look',
        click: (g) => {
          if (g.s.flags.l2_steam_off) return g.say('轉輪鎖緊了。管線安靜下來，只剩鍋爐在裡面咕嚕作響。');
          g.sanity(-4); g.sfx('steam');
          g.say('你伸手去轉——轉輪燙得像烙鐵，而且鏽死了，紋風不動。得找個東西來施力。');
        },
        use: {
          wrench: (g) => {
            if (g.s.flags.l2_steam_off) return g.say('已經轉緊了。');
            g.take('wrench'); g.flag('l2_steam_off'); g.sfx('screw');
            g.say('你把扳手卡進輪輻，整個人掛上去。轉輪發出一聲尖叫，轉動了。蒸汽一點一點變細，最後停了。熱氣還在，但已經不會把你烤乾了。');
          },
        },
      },
      {
        id: 'hatch', rect: bounds(hatch, 10), label: '管線的投遞口', cursor: 'look',
        click: (g) => {
          if (g.s.flags.l2_hatch) return g.say('投遞口裡空空的。管子深處偶爾傳來東西滾動的聲音，往上游去。');
          g.flag('l2_hatch'); g.sfx('thud');
          g.say('你拉開蓋板。管子裡「咚」地滾出一個鐵罐，罐子裡塞著一張捲起來的紙。');
          g.read('n_pipe', () => { g.sanity(-4); g.say('紙是溫的。像剛剛才有人寫完。'); });
        },
      },
      { id: 'boiler', rect: boxRect(boiler, 4), label: '鍋爐', cursor: 'look', click: (g) => g.say('爐口裡沒有火，只有一團慢慢旋轉的紅光。你不知道它在燒什麼，也不想知道。') },
      {
        id: 'forward', rect: bounds(boilerDoor, 6), label: '蒸汽後面的鐵門', cursor: 'go',
        click: (g) => {
          if (!g.s.flags.l2_steam_off) { g.sanity(-6); g.sfx('steam'); return g.say('你才剛靠近，蒸汽就燙得你縮回手。手臂紅了一大片。得先把漏氣止住。'); }
          g.go('l2_rail');
        },
      },
    ],
  },

  l2_rail: {
    level: 2, title: '廢棄的鐵道', room: l2Rail,
    viewMsg: '觀景窗裡，軌道一路延伸到黑暗裡。枕木上有一排腳印，是往回走的。',
    enter(g, { first }) {
      if (first) g.say('一條窄軌鐵道從牆裡伸出來，又鑽進前方的黑暗。一輛載滿電池的平板車停在軌道上，電池殼全都燒得焦黑。');
    },
    draw(ctx, t, s, R) {
      drawPipes(ctx, R, 2);
      for (const x of [-0.35, 0.35]) seg(ctx, P(x, 1, 1.2), P(x, 1, 12), shade(R, '#8a8070', 3), 2);
      for (let z = 1.4; z < 12; z += 0.45) seg(ctx, P(-0.5, 1, z), P(0.5, 1, z), shade(R, '#3a2a1a', z), Math.max(1, 6 / z));
      box(ctx, R, l2Cart);
      for (const c of cells) box(ctx, R, c);
      if (!s.flags.l2_crate) box(ctx, R, crate);
      paper(ctx, R, railTag, 3.2, '#e8d8a0');
      steelDoor(ctx, R, voidDoor, 2.4, '#d8d4c8');
      const dc = P(-1.4, -0.1, 2.4);
      ctx.strokeStyle = shade(R, '#2a2a2a', 2.4); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(dc[0] + 28, dc[1], 9, 26, 0, 0, Math.PI * 2); ctx.stroke();
    },
    hotspots: [
      BACK('l2_boiler', '回到鍋爐間'),
      { id: 'note', rect: bounds(railTag, 8), label: '平板車上的維修標籤', cursor: 'look', click: (g) => g.read('n_rail') },
      {
        id: 'crate', when: (s) => !s.flags.l2_crate, rect: boxRect(crate, 6), label: '貨箱', cursor: 'take',
        click: (g) => { g.flag('l2_crate'); g.give('can', '貨箱裡墊著稻草，只剩一個罐頭。標籤上印著一個商隊的記號，和柱子上的噴漆一樣。'); },
      },
      {
        id: 'cells', rect: bounds(cells.flatMap((c) => [P(c.x1, c.y1, c.z1), P(c.x2, c.y2, c.z1)]), 4), label: '燒焦的電池', cursor: 'look',
        click: (g) => g.say('每一顆電池都鼓了起來，接線熔成一團。就是這輛車讓整層樓的燈熄掉的——你不知道自己是怎麼知道的。'),
      },
      { id: 'void', rect: bounds(voidDoor, 4), label: '畫著圓圈的白色門', cursor: 'go', click: (g) => { g.flag('void_step', 0); g.go('l2_void'); } },
      { ...FORWARD('l2_narrow', '沿著軌道往前走', [420, 140, 120, 110]) },
    ],
  },

  l2_void: {
    level: 2, title: '？', room: { hw: 4, depth: 30, fogEnd: 1.5, lights: [], pal: { wall: '#000', ceil: '#000', floor: '#050505', fog: '#000', light: '#000' }, baseboard: false },
    quiet: 0.08,
    enter(g, { first }) {
      if (first) g.say('門後面什麼都沒有。沒有牆，沒有燈，沒有聲音。唯一的光是你身後的門口。');
    },
    draw(ctx, t, s) {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      const n = s.flags.void_step || 0;
      if (n === 0) {
        const g2 = ctx.createLinearGradient(0, H, 0, H - 120);
        g2.addColorStop(0, 'rgba(200,190,160,0.12)'); g2.addColorStop(1, 'rgba(200,190,160,0)');
        ctx.fillStyle = g2; ctx.fillRect(0, H - 120, W, 120);
      }
      if (n >= 3 && !s.flags.l2_tape5) {
        const c = P(0.1, 1, 2.2);
        ctx.fillStyle = 'rgba(120,120,110,0.25)'; ctx.fillRect(c[0] - 40, c[1] - 70, 80, 70);
      }
    },
    drawView(ctx, t, s) {
      // what the camcorder keeps: the doorway behind you, small but fixed in the corner of the screen
      const sc = 1 / (1 + (s.flags.void_step || 0) * 0.6);
      const w = 70 * sc, h = 110 * sc, x = 820 - w / 2, y = 400 - h;
      ctx.save(); ctx.shadowColor = '#fff6d0'; ctx.shadowBlur = 20;
      ctx.fillStyle = '#e8dfb8'; ctx.fillRect(x, y, w, h); ctx.restore();
      ctx.fillStyle = 'rgba(200,255,200,0.8)'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
      ctx.fillText('門口・錄影中', 820, 418); ctx.textAlign = 'left';
    },
    hotspots: [
      {
        id: 'back', rect: [330, 470, 300, 70], label: '回到門口', cursor: 'back',
        click: (g) => {
          const n = g.s.flags.void_step || 0;
          if (n >= 2 && !g.s.view) return g.end('void');
          g.flag('void_step', 0);
          g.go('l2_rail', { msg: n ? '你倒退著走，眼睛一刻也不敢離開那個光框。跨過門檻時，你才發現自己一直憋著氣。' : '' });
        },
      },
      {
        id: 'forward', rect: [300, 160, 360, 220], label: '往黑暗裡走', cursor: 'go',
        click: (g) => {
          const n = g.s.flags.void_step || 0;
          if (n >= 1 && !g.s.view) return g.end('void');
          if (n >= 3) return g.say(g.s.view ? '再往前，連螢幕角落的門口都快要看不見了。夠了。' : '');
          g.flag('void_step', n + 1); g.sanity(-2);
          if (n + 1 === 1) return g.say(g.s.view ? '你舉著攝影機往前走。螢幕角落，門口的光框跟著你，一直都在。' : '你往黑暗裡走了幾步。回頭看，門口已經小得像一張郵票。再走下去，你就找不到它了。');
          if (n + 1 === 3) {
            if (g.s.flags.l2_tape5) return g.say('折疊椅還在原地。三腳架上沒有攝影機。');
            g.flag('l2_tape5');
            return g.give('tape5', '你的腳踢到一樣東西。一張折疊椅，一個三腳架——三腳架上沒有攝影機，椅子上放著一卷錄影帶，標籤寫著「#5」。有人在這裡，對著黑暗錄了很久。');
          }
          g.say('沒有聲音。連你自己的腳步聲都被吞掉了。');
        },
      },
    ],
  },

  l2_narrow: {
    level: 2, title: '窄磚通道', room: l2Narrow,
    trap: { after: 14, run: (g) => g.scare('l2_rail', '左邊的牆突然鼓起來——磚縫裡伸出一隻手，抓住你的衣領往牆裡拖。你拚命掙脫，跌回鐵道旁。', 18, 'claws') },
    viewMsg: '觀景窗裡，盡頭沒有窗戶。那裡只是一面磚牆，上面有一張臉形的污漬。',
    enter(g, { first }) {
      if (first) g.say('通道窄得要側著身子走，磚牆的粉末沾滿了肩膀。牆裡傳來敲擊聲，跟著你的腳步移動。盡頭有一扇窗，窗外是亮的。');
      else g.say('牆裡的敲擊聲又開始了。別停在這裡。');
    },
    draw(ctx, t, s, R) {
      pipe(ctx, R, -R.hw, -0.7, 0.05, '#6b4a3a');
      const k = 0.5 + 0.5 * Math.sin(t * 1.7);
      const b = P(-1, 0.1, 2.6);
      ctx.fillStyle = `rgba(0,0,0,${0.15 + 0.15 * k})`;
      ctx.beginPath(); ctx.ellipse(b[0] + 30, b[1], 22 + k * 8, 60 + k * 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.shadowColor = '#f0f4ff'; ctx.shadowBlur = 30;
      poly(ctx, windowQuad, `rgba(235,240,255,${0.75 + 0.2 * Math.sin(t * 0.6)})`); ctx.restore();
      const wc = bounds(windowQuad);
      seg(ctx, [wc[0] + wc[2] / 2, wc[1]], [wc[0] + wc[2] / 2, wc[1] + wc[3]], '#555', 2);
      seg(ctx, [wc[0], wc[1] + wc[3] / 2], [wc[0] + wc[2], wc[1] + wc[3] / 2], '#555', 2);
      steelDoor(ctx, R, monitorDoor, 3.5, '#5e6460');
      const dc = P(1, -0.5, 3.5); txt(ctx, '監控', dc[0] - 22, dc[1], shade(R, '#e0e0d0', 3.5), 12);
    },
    hotspots: [
      BACK('l2_rail', '退回鐵道'),
      {
        id: 'window', rect: bounds(windowQuad, 14), label: '盡頭的窗戶', cursor: 'go',
        click: (g) => g.scare('l2_rail', '你越走越近。窗外的光越來越像一張臉——它一直在等你走近。你轉身就逃，背後的玻璃發出被指甲刮過的聲音。', 15, 'figure'),
      },
      { id: 'door', rect: bounds(monitorDoor, 4), label: '漆著「監控」的鐵門', cursor: 'go', click: (g) => g.go('l2_monitor') },
      {
        id: 'wall', rect: [300, 220, 110, 200], label: '鼓起來的磚牆', cursor: 'look',
        click: (g) => g.say('你把耳朵貼上去。牆的另一邊，有東西也把耳朵貼了上來。'),
      },
    ],
  },

  l2_monitor: {
    level: 2, title: '監視室', room: l2Monitor,
    viewMsg: '觀景窗裡，最後一個螢幕的畫面和你的觀景窗一模一樣。一層套一層，套到看不見底。',
    enter(g, { first }) {
      if (first) g.say('一整面牆的螢幕，每一個都亮著。畫面是你走過的房間——每一間都是空的。');
      if (g.s.flags.rec) g.flag('term_open', false);
    },
    draw(ctx, t, s, R) {
      const seen = Object.keys(s.seen || {}).filter((id) => id !== 'l2_monitor' && SCENES[id]).slice(-7);
      screens.forEach((q, i) => {
        poly(ctx, q, '#0a120c');
        const [x, y, w, h] = bounds(q);
        ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
        ctx.fillStyle = `rgba(120,200,140,${0.08 + 0.05 * Math.sin(t * 3 + i)})`; ctx.fillRect(x, y, w, h);
        for (let yy = y; yy < y + h; yy += 3) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x, yy, w, 1); }
        if (i === 7) {
          ctx.fillStyle = '#3a6a48'; ctx.beginPath(); ctx.arc(x + w / 2, y + h * 0.55, h * 0.18, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(x + w / 2 - h * 0.28, y + h * 0.7, h * 0.56, h * 0.4);
          txt(ctx, 'LIVE', x + 6, y + 12, '#f55', 10, 'left');
        } else txt(ctx, seen[i] ? sceneTitle(seen[i], s) || '???' : '———', x + w / 2, y + h / 2 + 4, '#9fe0b0', 11);
        ctx.restore();
        ctx.strokeStyle = shade(R, '#1a1c1a', 4); ctx.lineWidth = 3; poly(ctx, q); ctx.stroke();
      });
      box(ctx, R, l2Desk);
      poly(ctx, terminal, '#0b1a10');
      const [tx, ty, tw, th] = bounds(terminal);
      txt(ctx, '記錄 0120', tx + tw / 2, ty + 20, '#8fe0a0', 12);
      const line = s.flags.rec ? REC_LINES.find((r) => r.id === s.flags.rec).text : ((t * 2 | 0) % 2 ? '_' : ' ');
      txt(ctx, line, tx + tw / 2, ty + 42, '#c8ffd4', 13);
      steelDoor(ctx, R, exitHallDoor, 2.7, '#5a605c');
      if (s.flags.term_open && !s.flags.rec) {
        ctx.fillStyle = 'rgba(2,10,5,0.92)'; ctx.fillRect(280, 180, 400, 236);
        ctx.strokeStyle = '#5fc080'; ctx.lineWidth = 2; ctx.strokeRect(280, 180, 400, 236);
        txt(ctx, '［先不要寫］', 620, 400, '#7fb08c', 12);
        txt(ctx, '記錄 0120　請輸入一行。', 480, 210, '#9fe0b0', 13);
        REC_LINES.forEach((r, i) => {
          const [x, y, w, h] = recRect(i);
          ctx.strokeStyle = 'rgba(120,220,150,0.35)'; ctx.strokeRect(x, y, w, h);
          const dim = r.id === 'name' && !s.flags.watched_tape5;
          txt(ctx, r.text, x + w / 2, y + 23, dim ? '#4a6a52' : '#c8ffd4', 14);
        });
      }
    },
    hotspots: [
      { ...BACK('l2_narrow', '回到窄通道'), when: (s) => !s.flags.term_open || !!s.flags.rec },
      ...REC_LINES.map((r, i) => ({
        id: `rec_${r.id}`, when: (s) => s.flags.term_open && !s.flags.rec, rect: recRect(i), label: r.text, cursor: 'look',
        click: (g) => {
          if (r.id === 'name' && !g.s.flags.watched_tape5) return g.say('你把手放在鍵盤上，想打自己的名字。手指停在半空中。……你想不起來。');
          g.flag('rec', r.id); g.flag('term_open', false); g.sfx('ok');
          if (r.id === 'filed') return g.end('filed');
          if (r.id === 'left') return g.say('你打下「對象離開了。」按下輸入鍵。螢幕停了一下，在後面自己補上了兩個字：「未歸檔」。');
          g.sanity(20);
          g.say('你一個字、一個字打下自己的名字。打完的那一刻，嗡嗡聲停了。牆上所有的螢幕同時暗了下去——它們找不到可以錄的東西了。');
        },
      })),
      {
        id: 'cancel', when: (s) => s.flags.term_open && !s.flags.rec, rect: [570, 380, 100, 30], label: '先不要寫', cursor: 'back',
        click: (g) => { g.flag('term_open', false); g.say('你把手從鍵盤上收回來。游標還在閃。'); },
      },
      {
        id: 'screens', when: (s) => !s.flags.term_open, rect: bounds(screens.flat(), 4), label: '整面牆的螢幕', cursor: 'look',
        click: (g) => {
          g.say('每一間房間都是空的。只有最後一個螢幕不一樣：畫面裡有一個人，背對著鏡頭，坐在一張桌子前面。他抬起手——你也抬起了手。');
          if (!g.s.flags.l2_screens) { g.flag('l2_screens'); g.sanity(-6); }
        },
      },
      {
        id: 'terminal', when: (s) => !s.flags.term_open, rect: bounds(terminal, 8), label: '終端機', cursor: 'look',
        click: (g) => {
          if (g.s.flags.rec) return g.say('記錄 0120 已經寫好了。');
          g.flag('term_open', true);
        },
      },
      { id: 'door', when: (s) => !s.flags.term_open, rect: bounds(exitHallDoor, 4), label: '右邊的鐵門', cursor: 'go', click: (g) => g.go('l2_hall') },
    ],
  },

  l2_hall: {
    level: 2, title: '熄燈的通道', room: (s) => (s.flags.circuit ? l2HallLit : l2HallDead),
    dark: (s) => !s.flags.circuit,
    smiler: {
      mode: 'nest', back: 'l2_monitor', present: (s) => !s.flags.circuit,
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
      BACK('l2_monitor', '慢慢退回監視室'),
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
