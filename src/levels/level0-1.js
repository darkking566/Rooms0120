// The B.N.T.G. pillar walk and Level 0.1 "Zenith Station" (CutTheBirch, CC BY-SA 3.0).
// Puzzles, scene text and J.H. notes are original.
import { P, bounds, box, boxRect, faceQuad, paper, poly, seg, shade, wallQuad } from '../render.js';
import { rand } from '../rng.js';
import { frostOverlay } from './level0-3.js';
import { back, clockOf, glow, hit, once, outline, pal, room, sliding, tvStatic, txt } from './sublevel-kit.js';

// ---------- the B.N.T.G. walk to Level 0.1 (entrance) ----------
// Per the wiki you simply walk into Level 0.1, but Level 0 is too vast to stumble on it;
// only the B.N.T.G. has a reliable route. Here that route is their stencilled arrows, starting at
// a doorway on the pillar room's right wall.
export const yellow = pal('#c8b35e', '#d6cc96', '#8f7d3b', '#2a2410', '#fff4c8');
export const annexDoor = wallQuad(2.2, -0.65, 1, 3.0, 3.9);
export function drawAnnexEntrance(ctx, R) {
  const [x, y, w] = bounds(annexDoor);
  txt(ctx, 'B.N.T.G. →', x + w / 2 - 6, y - 10, shade(R, '#d8d2b4', 3.4), 11);
}
export const WALK_STEPS = 4;
const walkPillars = [
  { x1: -1.35, x2: -0.95, y1: -1, y2: 1, z1: 3.0, z2: 3.4 },
  { x1: 0.95, x2: 1.35, y1: -1, y2: 1, z1: 3.0, z2: 3.4 },
  { x1: -1.35, x2: -0.95, y1: -1, y2: 1, z1: 5.6, z2: 6.0 },
  { x1: 0.95, x2: 1.35, y1: -1, y2: 1, z1: 5.6, z2: 6.0 },
].map((b) => ({ ...b, color: yellow.wall }));
const pillarRect = (b) => bounds([P(b.x1, -1, b.z1), P(b.x2, 1, b.z1)], 8);
const walkSide = { left: walkPillars[0], right: walkPillars[1] };
const walkNote = faceQuad(-0.3, 0.1, 0.05, 0.4, 2.999);
const newMark = (g) => g.flag('l01_mark', rand() < 0.5 ? 'left' : 'right');
function walkStep(g, side) {
  const n = g.s.flags.l01_walk || 0;
  if (side !== g.s.flags.l01_mark) {
    g.flag('l01_walk', 0); newMark(g); g.sanity(-2);
    return g.go('l0_annex', { msg: '你從沒有記號的那一邊繞過去。再找的時候，柱子全換了位置，箭頭只剩下最開始那一個。' });
  }
  if (n + 1 >= WALK_STEPS) {
    g.flag('l01_walk', 0);
    return g.go('l01_airlock', { msg: '你跟著最後一個箭頭走。黃色的牆一面一面變得冰冷、平滑，地毯停在一條鋼製的門檻前。' });
  }
  g.flag('l01_walk', n + 1); newMark(g);
  g.go('l0_annex', { msg: ['下一根柱子上，又是同樣的模板字。', '箭頭的漆比較新了。有人不久前才補過。', '燈的嗡嗡聲變了調，像隔著玻璃。'][n] });
}

// =====================================================================
// LEVEL 0.1 — Zenith Station
// A colossal spherical shell inside Level 0: sleek, futuristic, badly damaged. Robots still cook and
// clean for a crew that is gone. The climate system has failed: some sections are lethally hot or cold.
// =====================================================================
const station = pal('#c9d3d6', '#8d999e', '#59656a', '#04080b', '#e2f7ff');
const grow = pal('#41504a', '#1b2421', '#2a312c', '#06090a', '#d9a0ff');
const stationFlick = (t) => (Math.sin(t * 17.3) + Math.sin(t * 5.1) > 1.85 ? 0.6 : 1);
function panelSeams(ctx, R, hw, z0, z1, step = 0.6) {
  for (const s of [-1, 1]) for (let z = z0; z < z1; z += step) {
    seg(ctx, P(s * hw, -1, z), P(s * hw, 1, z), shade(R, '#7c8a90', z, 0.8, 0.7), Math.max(0.6, 2 / z));
  }
  for (const s of [-1, 1]) seg(ctx, P(s * hw, -0.2, z0), P(s * hw, -0.2, z1), shade(R, '#88d8f0', 2, 1, 0.5), 2);
}
function floorStrip(ctx, R, z0, z1, color = '#7fe0ff') {
  for (const x of [-0.5, 0.5]) seg(ctx, P(x, 1, z0), P(x, 1, z1), shade(R, color, 2, 1, 0.6), 2);
}
function cleaner(ctx, R, x, z, t) {
  const c = P(x, 1, z), r = 0.32 * 480 / z;
  ctx.save();
  ctx.fillStyle = 'rgba(160,220,240,0.12)'; ctx.fillRect(c[0] - r * 3, c[1] - 2, r * 6, 4);
  ctx.fillStyle = shade(R, '#dfe6e8', z); ctx.beginPath(); ctx.ellipse(c[0], c[1] - r * 0.12, r, r * 0.28, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = shade(R, '#a7b2b6', z); ctx.beginPath(); ctx.ellipse(c[0], c[1] - r * 0.26, r * 0.6, r * 0.16, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = Math.sin(t * 5) > 0 ? '#7fffd4' : '#2b5f55'; ctx.fillRect(c[0] - 2, c[1] - r * 0.36, 4, 3);
  ctx.restore();
}

// --- airlock: the automatic door is stuck in a loop, opening and slamming shut ---
const airlockR = room(station, { hw: 1.3, depth: 4.2, lights: [1.6, 3.1], flick: stationFlick, baseboard: false });
const doorOpen = (s) => {
  const c = clockOf(s) % 3.6;
  if (c < 1.4) return 0;
  if (c < 1.8) return (c - 1.4) / 0.4;
  if (c < 2.9) return 1;
  if (c < 3.1) return 1 - (c - 2.9) / 0.2;
  return 0;
};
const airDoor = faceQuad(-0.6, -0.75, 0.6, 1, 4.2);
const placard = wallQuad(-1.3, -0.5, 0.05, 1.6, 2.5);
const frozenAirlock = (s) => s.flags.l01_cut === 'airlock';

// --- ring corridor: curving off to the right; the far section is cooking ---
const ringR = room(station, {
  hw: 1.2, depth: 7, lights: [1.7, 3.6, 5.4], flick: stationFlick, baseboard: false, flickerLights: [1],
  openings: [{ side: -1, z1: 2.2, z2: 3.2, top: -0.6 }, { side: 1, z1: 2.4, z2: 3.4, top: -0.6 }, { side: 1, z1: 5.4, z2: 7, top: -1 }],
});
const hotTurn = wallQuad(1.2, -1, 1, 5.4, 7);

// --- crew quarters (safe): six bunks made every day, and a seventh cot ---
const quartersR = room(station, { hw: 1.6, depth: 4.5, lights: [2.2, 3.8], baseboard: false });
const bunks = [];
for (const s of [-1, 1]) for (const [y1, y2] of [[0.35, 0.55], [-0.3, -0.12]]) {
  const x1 = s < 0 ? -1.6 : 0.95, x2 = s < 0 ? -0.95 : 1.6;
  bunks.push({ x1, x2, y1, y2, z1: 1.7, z2: 3.4, color: '#e9eef0', top: '#f6f8f9', edge: true });
}
const lockerX = (i) => -1.25 + i * 0.29;
const rvLocker = faceQuad(lockerX(3), -0.8, lockerX(3) + 0.27, 0.9, 4.5);
const crewTerminal = faceQuad(0.45, -0.45, 1.15, 0.12, 4.5);
const cot = { x1: -0.45, x2: 0.45, y1: 0.72, y2: 0.88, z1: 2.0, z2: 2.9, color: '#d9dfe2', top: '#eef1f2', edge: true };

// --- galley: the cooking arm still serves breakfast for a crew of six; today it lays a seventh tray ---
const galleyR = room(station, { hw: 1.5, depth: 5, lights: [1.8, 3.5], baseboard: false });
const galleyTable = { x1: -0.5, x2: 0.5, y1: 0.42, y2: 0.52, z1: 1.8, z2: 4.0, color: '#b9c3c7', top: '#dfe5e7', edge: true };
const counter = { x1: -1.1, x2: 1.1, y1: 0.3, y2: 1, z1: 4.4, z2: 5, color: '#8c989d', top: '#cfd6d9', edge: true };
const dispenser = wallQuad(-1.5, -0.35, 0.5, 2.0, 2.6);
const greenDoor = wallQuad(1.5, -0.7, 1, 2.5, 3.5);
const trays = [];
for (const x of [-0.3, 0.12]) for (const z of [2.1, 2.8, 3.5]) trays.push([x, z]);

// --- hydroponic greenhouse: the climate console lives here ---
const greenR = room(grow, { hw: 1.6, depth: 5, lights: [], baseboard: false });
const racks = [];
for (const s of [-1, 1]) for (const y of [0.55, -0.05]) racks.push({ x1: s < 0 ? -1.6 : 1.0, x2: s < 0 ? -1.0 : 1.6, y1: y, y2: y + 0.06, z1: 1.6, z2: 4.4, color: '#6b7470', top: '#8a948f' });
const consoleQ = faceQuad(-0.7, -0.6, 0.7, 0.3, 5);
const tomatoQ = [P(-1.0, -0.05, 1.9), P(-1.0, -0.05, 2.6), P(-1.0, -0.35, 2.6), P(-1.0, -0.35, 1.9)];
const CLIMATE = [
  { id: 'airlock', label: 'A 氣閘區（回 Level 0 的路）', rect: [300, 236, 360, 34] },
  { id: 'quarters', label: 'B 船員艙（那張床）', rect: [300, 278, 360, 34] },
  { id: 'greenhouse', label: 'C 水耕溫室（這裡的植物）', rect: [300, 320, 360, 34] },
];
const climateOpen = (s) => s.flags.l01_console === true && !s.flags.l01_cut;

// --- observation deck: the hollow heart of the shell ---
const coreR = room(station, { hw: 2.2, depth: 3, lights: [1.5], baseboard: false });
const bigWindow = faceQuad(-2.05, -0.92, 2.05, 0.62, 3);
const breach = wallQuad(2.2, -0.75, 1, 2.45, 3);
const lastConsole = { x1: -0.5, x2: 0.5, y1: 0.62, y2: 1, z1: 2.2, z2: 2.6, color: '#6f7c82', top: '#9aa8ae', edge: true };

function drawShell(ctx, t) {
  const [x, y, w, h] = bounds(bigWindow);
  ctx.save(); poly(ctx, bigWindow); ctx.clip();
  const gr = ctx.createRadialGradient(480, 255, 10, 480, 255, w * 0.6);
  gr.addColorStop(0, '#000003'); gr.addColorStop(0.35, '#07121c'); gr.addColorStop(1, '#16263a');
  ctx.fillStyle = gr; ctx.fillRect(x, y, w, h);
  // the inner face of the shell: ring upon ring of decks, a few windows still lit
  for (let i = 1; i < 11; i++) {
    const rx = 30 + i * 34, ry = 14 + i * 13;
    ctx.strokeStyle = `rgba(90,140,170,${0.12 + i * 0.03})`; ctx.lineWidth = 1 + i * 0.25;
    ctx.beginPath(); ctx.ellipse(480, 255, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
    for (let j = 0; j < 14 + i * 3; j++) {
      const a = (j / (14 + i * 3)) * Math.PI * 2 + i;
      if ((i * 7 + j * 3) % 5 === 0) continue;
      const lit = (i * 13 + j * 7) % 9 === 0;
      ctx.fillStyle = lit ? 'rgba(215,200,110,0.85)' : 'rgba(80,110,130,0.35)';
      ctx.fillRect(480 + Math.cos(a) * rx - 2, 255 + Math.sin(a) * ry - 1, 3 + i * 0.3, 2);
    }
  }
  // far beyond the shell: yellow rooms stacked like floors of a building
  for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) {
    if ((r + c) % 3 === 0) continue;
    ctx.fillStyle = `rgba(200,180,94,${0.18 + ((r * 5 + c) % 4) * 0.05})`;
    ctx.fillRect(x + 28 + c * 18, y + 20 + r * 11, 12, 7);
    ctx.fillRect(x + w - 190 + c * 18, y + h - 64 + r * 11, 12, 7);
  }
  // at the very centre, where the experiment was: a ring that bends the light around it
  ctx.save(); ctx.translate(480, 255); ctx.rotate(t * 0.05);
  for (let k = 0; k < 3; k++) {
    ctx.strokeStyle = `rgba(170,200,255,${0.1 + k * 0.05})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 26 + k * 6 + Math.sin(t + k) * 2, 9 + k * 2, 0.2, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
  // window frame and mullions
  outline(ctx, bigWindow, '#9fb0b6', 6);
  for (const fx of [-1.03, 0, 1.03]) seg(ctx, P(fx, -0.92, 3), P(fx, 0.62, 3), '#9fb0b6', 4);
}

export const L01_SCENES = {
  l0_annex: {
    level: 0, title: '柱子間的長路', room: room(yellow, { hw: 2, depth: 8, stripes: true, floorTex: 'carpet', tiles: true, lights: [1.6, 3.6, 5.8] }),
    enter(g, { first }) {
      if (!g.s.flags.l01_mark) newMark(g);
      if (first) g.say('柱子一排接一排，沒有盡頭。有一根柱子上噴著褪色的模板字，旁邊是一個箭頭。');
    },
    draw(ctx, t, s, R) {
      for (const b of walkPillars) box(ctx, R, b);
      const b = walkSide[s.flags.l01_mark] || walkSide.left, cx = (b.x1 + b.x2) / 2;
      const p = P(cx, -0.15, b.z1);
      txt(ctx, 'B.N.T.G.', p[0], p[1], shade(R, '#efe9d0', 3), 11);
      txt(ctx, '↑', p[0], p[1] + 24, shade(R, '#efe9d0', 3), 22);
      if (!(s.flags.l01_walk || 0)) paper(ctx, R, walkNote, 3, '#efe7cf');
    },
    hotspots: [
      { ...back('l0_pillar', '回到柱子的房間'), click: (g) => { g.flag('l01_walk', 0); g.go('l0_pillar'); } },
      hit('left', pillarRect(walkSide.left), '從左邊的柱子旁走過去', (g) => walkStep(g, 'left'), 'go'),
      hit('right', pillarRect(walkSide.right), '從右邊的柱子旁走過去', (g) => walkStep(g, 'right'), 'go'),
      { ...hit('guide', bounds(walkNote, 8), '貼在柱子上的便條', (g) => g.read('n_annex')), when: (s) => !(s.flags.l01_walk || 0) },
    ],
  },

  // ------------------------------------------------------------- 0.1
  l01_airlock: {
    level: '0.1', title: '氣閘', room: airlockR,
    viewMsg: '觀景窗裡，門每次闔上之前，門縫裡都站著一個人影。肉眼看過去，門縫是空的。',
    enter(g, { first }) {
      if (first) g.say('地毯停在一條鋼製門檻前。前面是一扇自動門，卡在同一個動作裡：打開，停一下，猛地闔上。一台清潔機器人在你腳邊繞圈。');
    },
    draw(ctx, t, s, R) {
      panelSeams(ctx, R, 1.3, 1.2, 4.2, 0.5); floorStrip(ctx, R, 1, 4.2);
      const o = frozenAirlock(s) ? 0 : doorOpen(s);
      const shake = o === 0 && !frozenAirlock(s) ? Math.sin(t * 60) * 0.006 : 0;
      ctx.save(); ctx.translate(shake * 480, 0);
      // the corridor beyond
      if (o > 0) {
        ctx.save(); poly(ctx, airDoor); ctx.clip();
        const [x, y, w, h] = bounds(airDoor);
        const gr = ctx.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#2c3a40'); gr.addColorStop(1, '#0d1417');
        ctx.fillStyle = gr; ctx.fillRect(x, y, w, h);
        seg(ctx, [x + w / 2 - 6, y + h * 0.15], [x + w / 2 + 6, y + h * 0.15], '#c9f2ff', 3);
        ctx.restore();
      }
      sliding(ctx, R, -0.6, -0.75, 0.6, 1, 4.2, o, frozenAirlock(s) ? '#cfe6ee' : '#aab6bb');
      ctx.restore();
      const lamp = P(0.75, -0.6, 4.2);
      ctx.fillStyle = frozenAirlock(s) ? '#9ad8ff' : o > 0.7 ? '#62f0a0' : '#f05a4a'; ctx.beginPath(); ctx.arc(lamp[0], lamp[1], 4, 0, Math.PI * 2); ctx.fill();
      glow(ctx, lamp[0], lamp[1], 22, frozenAirlock(s) ? 'rgba(150,210,255,0.6)' : o > 0.7 ? 'rgba(90,240,160,0.6)' : 'rgba(240,90,70,0.6)');
      txt(ctx, 'ZENITH / A-01', P(0, -0.86, 4.2)[0], P(0, -0.86, 4.2)[1], shade(R, '#6f8a94', 4.2), 11);
      poly(ctx, placard, shade(R, '#e9eef0', 2)); outline(ctx, placard, shade(R, '#7c8a90', 2), 2);
      const pc = P(-1.3, -0.3, 2.0);
      txt(ctx, 'ZENITH', pc[0] + 18, pc[1], shade(R, '#3b6f86', 2), 13);
      txt(ctx, '環形區 A', pc[0] + 18, pc[1] + 18, shade(R, '#5b6a70', 2), 10);
      cleaner(ctx, R, Math.sin(clockOf(s) * 0.5) * 0.8, 2.6, t);
      if (frozenAirlock(s)) frostOverlay(ctx, t, s, 0.8);
    },
    hotspots: [
      back('l0_pillar', '走回黃色的地毯', '你退過門檻。鋼和玻璃一面一面變回黃色的牆紙，嗡嗡聲回來了。'),
      hit('forward', bounds(airDoor, 4), '趁門打開時穿過去', (g) => {
        if (frozenAirlock(g.s)) return g.say('門凍死在門框裡，玻璃上結了一層白霜。這條路已經被你關掉了。');
        if (doorOpen(g.s) > 0.7) return g.go('l01_ring', { msg: '你在門闔上前一步鑽了過去。身後「砰」地一聲，門又開始它的循環。' });
        g.sanity(-4); g.sfx('thud');
        g.say('門猛地闔上，夾住了你的肩膀，又彈開。你縮回來，肩膀發麻。看準綠燈亮的時候再走。');
      }, 'go'),
      hit('robot', [300, 345, 360, 50], '清潔機器人', (g) => g.say('機器人繞過你的鞋子，繼續擦一塊早就乾淨的地板。機身上印著：ZENITH・維護 07。它擦的那一塊，剛好是你剛才站的地方。')),
      hit('note', bounds(placard, 6), '牆上的站牌', (g) => g.read('n01')),
    ],
  },

  l01_ring: {
    level: '0.1', title: '環形走廊', room: ringR,
    hazard: (s) => (s.flags.l01_cut ? null : '前方 D 區溫控失效・+68°C'),
    enter(g, { first }) {
      if (first) g.say('走廊往右彎，一直彎下去，像是繞著某個很大的東西。一半的燈壞了。彎道的盡頭在發熱，空氣扭曲得像水。');
    },
    draw(ctx, t, s, R) {
      panelSeams(ctx, R, 1.2, 1.2, 7, 0.6); floorStrip(ctx, R, 1, 7);
      const hot = !s.flags.l01_cut;
      ctx.save(); poly(ctx, hotTurn); ctx.clip();
      const [x, y, w, h] = bounds(hotTurn);
      ctx.fillStyle = hot ? `rgba(255,${90 + Math.sin(t * 3) * 20},40,0.35)` : 'rgba(120,200,255,0.12)'; ctx.fillRect(x, y, w, h);
      if (hot) for (let i = 0; i < 6; i++) { const yy = y + ((t * 30 + i * 20) % h); seg(ctx, [x, yy], [x + w, yy + Math.sin(t * 5 + i) * 3], 'rgba(255,200,150,0.25)', 2); }
      ctx.restore();
      if (hot) glow(ctx, x + w / 2, y + h / 2, 90, 'rgba(255,90,40,0.45)');
      const sign = P(1.2, -0.75, 4.9);
      ctx.fillStyle = '#111a1e'; ctx.fillRect(sign[0] - 30, sign[1] - 12, 48, 20);
      txt(ctx, hot ? '+68°C' : '+21°C', sign[0] - 6, sign[1] + 3, hot ? '#ff6a4a' : '#7fe0ff', 11);
      for (const [o, label] of [[ringR.openings[0], '船員艙'], [ringR.openings[1], '廚房']]) {
        const c = P(o.side * 1.2, -0.72, (o.z1 + o.z2) / 2);
        txt(ctx, label, c[0], c[1], shade(R, '#3b6f86', o.z1), 12);
      }
      // a torn panel: cables hanging out, spitting sparks
      const c0 = P(-0.5, -1, 4), c1 = P(-0.45, -0.35, 4), c2 = P(-0.58, -0.45, 4);
      seg(ctx, c0, c1, '#20262a', 3); seg(ctx, c0, c2, '#5a2a1a', 3);
      if (Math.sin(t * 9) > 0.6) for (let i = 0; i < 5; i++) seg(ctx, c1, [c1[0] + (Math.random() - 0.5) * 30, c1[1] + Math.random() * 20], '#fff2a0', 1);
    },
    hotspots: [
      { ...back('l01_airlock', '回到氣閘'), click: (g) => {
        if (frozenAirlock(g.s)) return g.say('氣閘那一頭結了冰，門凍死了。是你把那裡的溫控關掉的。');
        g.go('l01_airlock');
      } },
      hit('quarters', bounds(wallQuad(-1.2, -0.6, 1, 2.2, 3.2)), '船員艙', (g) => g.go('l01_quarters'), 'go'),
      hit('galley', bounds(wallQuad(1.2, -0.6, 1, 2.4, 3.4)), '廚房', (g) => g.go('l01_galley'), 'go'),
      hit('forward', [470, 200, 140, 140], '沿著彎道往前走', (g) => {
        if (!g.s.flags.l01_cut) { g.sanity(-3); g.drink(-4); return g.say('你才走近幾步，熱浪就撲上臉，睫毛像要捲起來。牆上的讀數：+68°C。得先讓溫控把這一段冷下來。'); }
        g.go('l01_core', { msg: '彎道的熱氣散了。牆上的讀數一格一格往下掉，最後停在 +21°C。走廊盡頭是一整面玻璃。' });
      }, 'go'),
      hit('cables', [400, 195, 45, 75], '垂下來的電纜', (g) => { g.sanity(-5); g.sfx('error'); g.say('指尖剛碰到，一道白光就咬了你一口。你甩著手退開。'); }),
    ],
  },

  l01_quarters: {
    level: '0.1', title: '船員艙', room: quartersR, safe: true,
    enter(g, { first }) {
      if (first) g.say('六張床，被子摺得方方正正，像是今天早上才有人摺過。房間正中央多了一張行軍床，枕頭拍得鼓鼓的。');
    },
    draw(ctx, t, s, R) {
      panelSeams(ctx, R, 1.6, 1.2, 4.5, 0.7);
      for (let i = 0; i < 5; i++) {
        const q = faceQuad(lockerX(i), -0.8, lockerX(i) + 0.27, 0.9, 4.5);
        poly(ctx, q, shade(R, i === 3 && s.flags.l01_card ? '#5f6d72' : '#a9b5ba', 4.5));
        outline(ctx, q, shade(R, '#6c7a80', 4.5), 1.5);
        const h = P(lockerX(i) + 0.22, 0, 4.5); ctx.fillStyle = shade(R, '#3c464a', 4.5); ctx.fillRect(h[0], h[1], 3, 10);
      }
      const rv = P(lockerX(3) + 0.135, -0.65, 4.5); txt(ctx, 'R.V.', rv[0], rv[1], shade(R, '#334046', 4.5), 9);
      poly(ctx, crewTerminal, '#0b1a20'); outline(ctx, crewTerminal, shade(R, '#7c8a90', 4.5), 2);
      const [tx, ty] = bounds(crewTerminal);
      for (let i = 0; i < 4; i++) { ctx.fillStyle = `rgba(120,230,255,${0.4 + 0.3 * Math.sin(t * 2 + i)})`; ctx.fillRect(tx + 6, ty + 6 + i * 7, 18 + ((i * 17) % 30), 3); }
      for (const b of bunks) for (const x of [b.x1, b.x2]) if (Math.abs(x) < 1.5) seg(ctx, P(x, -0.4, b.z1), P(x, 1, b.z1), shade(R, '#8a979c', b.z1), 4);
      for (const b of bunks) box(ctx, R, b);
      for (const b of bunks) { const p = P((b.x1 + b.x2) / 2, b.y1, b.z1 + 0.25); ctx.fillStyle = shade(R, '#ffffff', b.z1); ctx.fillRect(p[0] - 14, p[1] - 6, 28, 6); }
      box(ctx, R, cot);
      const pl = P(0, 0.72, 2.15); ctx.fillStyle = shade(R, '#ffffff', 2.1); ctx.beginPath(); ctx.ellipse(pl[0], pl[1] - 6, 34, 9, 0, 0, Math.PI * 2); ctx.fill();
      if (s.flags.l01_cut === 'quarters') frostOverlay(ctx, t, s, 0.9);
    },
    hotspots: [
      back('l01_ring', '回到環形走廊'),
      hit('locker', bounds(rvLocker, 4), '貼著「R.V.」的置物櫃', (g) => {
        if (!once(g, 'l01_card')) return g.say('置物櫃空了。只剩一件摺好的制服，胸口繡著 R. 瓦爾普利。');
        g.give('zcard', '櫃門沒鎖。制服上別著一張門禁卡：「R. 瓦爾普利・環境控制」。');
      }, 'take'),
      hit('terminal', bounds(crewTerminal, 6), '床邊的個人終端', (g) => g.read('n01_log')),
      hit('cot', boxRect(cot, 8), '中間那張行軍床', (g) => {
        if (g.s.flags.l01_cut === 'quarters') return g.say('床單凍得發硬，枕頭上結了一層霜。是你讓這裡冷下來的。');
        if (!once(g, 'l01_rested')) return g.say('你已經睡過了。被子又被摺回了方塊。');
        g.sanity(18); g.checkpoint();
        g.say('床頭夾著一張卡片：「歡迎新船員」。名字那一欄是空的。你躺下去，睡得很沉。醒來時，被子已經被摺好，蓋在你身上。');
      }),
    ],
  },

  l01_galley: {
    level: '0.1', title: '廚房', room: galleyR,
    enter(g, { first }) {
      if (first) g.say('一條長桌，七個餐盤。天花板上垂下一支機械臂，正在攪一鍋什麼。它停下來，轉向你——像是在數人頭。');
    },
    draw(ctx, t, s, R) {
      panelSeams(ctx, R, 1.5, 1.2, 5, 0.6);
      box(ctx, R, counter);
      const pot = P(0.1, 0.3, 4.7); ctx.fillStyle = shade(R, '#545e62', 4.7); ctx.fillRect(pot[0] - 22, pot[1] - 18, 44, 18);
      for (let i = 0; i < 3; i++) { const y = pot[1] - 22 - ((t * 20 + i * 12) % 30); ctx.fillStyle = `rgba(230,240,245,${0.25 - ((t * 20 + i * 12) % 30) / 140})`; ctx.beginPath(); ctx.arc(pot[0] + Math.sin(t + i) * 6, y, 6, 0, Math.PI * 2); ctx.fill(); }
      const base = P(0, -1, 4.2), a = Math.sin(t * 1.4) * 0.25;
      const elbow = [base[0] + Math.sin(a) * 40, base[1] + 40], hand = [pot[0] + Math.sin(t * 2.2) * 8, pot[1] - 26];
      seg(ctx, base, elbow, shade(R, '#d0d8db', 4), 7); seg(ctx, elbow, hand, shade(R, '#c0c9cc', 4), 5);
      ctx.fillStyle = '#62f0c8'; ctx.beginPath(); ctx.arc(elbow[0], elbow[1], 4, 0, Math.PI * 2); ctx.fill();
      box(ctx, R, galleyTable);
      for (const [x, z] of trays) { const q = [P(x, 0.42, z), P(x + 0.2, 0.42, z), P(x + 0.2, 0.42, z + 0.35), P(x, 0.42, z + 0.35)]; poly(ctx, q, shade(R, '#eef2f3', z)); }
      const seventh = [P(-0.12, 0.42, 1.85), P(0.12, 0.42, 1.85), P(0.12, 0.42, 2.05), P(-0.12, 0.42, 2.05)];
      poly(ctx, seventh, shade(R, '#f6e7b8', 1.9));
      if (s.flags.l01_meal) { const m = P(0, 0.42, 1.95); ctx.fillStyle = shade(R, '#b9c48a', 1.9); ctx.beginPath(); ctx.ellipse(m[0], m[1], 22, 6, 0, 0, Math.PI * 2); ctx.fill(); }
      poly(ctx, dispenser, shade(R, '#dfe6e8', 2.3)); outline(ctx, dispenser, shade(R, '#7c8a90', 2.3), 2);
      const tank = wallQuad(-1.5, -0.25, 0.15, 2.1, 2.5); poly(ctx, tank, s.flags.l01_water ? 'rgba(120,150,160,0.5)' : 'rgba(110,200,255,0.65)');
      poly(ctx, greenDoor, '#120a18'); glow(ctx, bounds(greenDoor)[0] + 20, bounds(greenDoor)[1] + 80, 80, 'rgba(200,120,255,0.35)');
      outline(ctx, greenDoor, shade(R, '#8a979c', 3), 3);
      const gl = P(1.5, -0.8, 3.0); txt(ctx, '水耕溫室', gl[0] - 8, gl[1], shade(R, '#8a5fb0', 3), 11);
    },
    hotspots: [
      back('l01_ring', '回到環形走廊'),
      hit('robot', [400, 190, 170, 160], '做飯的機械臂', (g) => {
        if (!once(g, 'l01_meal')) return g.say('機械臂在螢幕上打出一行字：「今日菜單：與昨日相同。」然後繼續攪鍋。');
        g.eat(45); g.sanity(6); g.sfx('eat');
        g.say('機械臂舀起一勺淡綠色的糊，放在第七個餐盤上，推到你面前。沒有味道，溫度剛好。它等你吃完，才把餐盤收走。');
      }),
      hit('water', bounds(dispenser, 4), '飲水機', (g) => {
        if (!once(g, 'l01_water')) return g.say('水箱見底了。出水口還滴了兩下。');
        g.drink(35); g.sfx('drink'); g.say('冰涼、乾淨，沒有任何味道。你一口氣喝了很多。');
      }),
      hit('tray', bounds([P(-0.12, 0.42, 1.85), P(0.12, 0.42, 2.05)], 10), '第七個餐盤', (g) => g.say('餐盤邊緣貼著名牌。前六個寫著名字，第七個是空白的——上面有剛擦過的痕跡。')),
      hit('green', bounds(greenDoor, 4), '水耕溫室', (g) => g.go('l01_greenhouse'), 'go'),
    ],
  },

  l01_greenhouse: {
    level: '0.1', title: '水耕溫室', room: greenR,
    enter(g, { first }) {
      if (first) g.say('紫色的燈下，一排排架子上長著菜。有些長得很好，有些已經發黑。一台園丁機器人掛在軌道上，往空中噴霧。牆上的控制台閃著紅燈。');
    },
    draw(ctx, t, s, R) {
      const frozen = s.flags.l01_cut === 'greenhouse';
      for (let z = 1.6; z < 5; z += 0.9) for (const s2 of [-1, 1]) {
        const q = [P(s2 * 0.4, -1, z), P(s2 * 1.0, -1, z), P(s2 * 1.0, -1, z + 0.2), P(s2 * 0.4, -1, z + 0.2)];
        poly(ctx, q, frozen ? '#3a3540' : '#e7b4ff'); if (!frozen) glow(ctx, P(s2 * 0.7, -1, z)[0], P(s2 * 0.7, -1, z)[1], 120 / z, 'rgba(200,120,255,0.35)');
      }
      for (const b of racks) {
        box(ctx, R, b);
        for (let z = b.z1 + 0.15; z < b.z2; z += 0.35) {
          const cx = (b.x1 + b.x2) / 2, p = P(cx, b.y1, z), r = 30 / z;
          const dead = frozen || (z * 7) % 3 < 0.8;
          ctx.fillStyle = shade(R, dead ? (frozen ? '#9fb4bc' : '#4a3a26') : '#4fae55', z);
          ctx.beginPath(); ctx.ellipse(p[0], p[1] - r * 0.6, r, r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
        }
      }
      if (!s.flags.l01_tomato && !frozen) { const tp = P(-1.0, -0.2, 2.25); ctx.fillStyle = '#e0453a'; ctx.beginPath(); ctx.arc(tp[0] + 8, tp[1] + 4, 7, 0, Math.PI * 2); ctx.fill(); }
      const rx = Math.sin(t * 0.4) * 0.6, rp = P(rx, -0.9, 3.2);
      seg(ctx, P(-1, -0.97, 3.2), P(1, -0.97, 3.2), shade(R, '#8a948f', 3.2), 2);
      ctx.fillStyle = shade(R, '#c7d0cc', 3.2); ctx.fillRect(rp[0] - 14, rp[1], 28, 14);
      if (!frozen) for (let i = 0; i < 8; i++) { const d = (t * 1.5 + i / 8) % 1; ctx.fillStyle = `rgba(230,240,255,${0.3 * (1 - d)})`; ctx.beginPath(); ctx.arc(rp[0] + (i - 4) * 4 * d * 3, rp[1] + 14 + d * 60, 2 + d * 4, 0, Math.PI * 2); ctx.fill(); }
      poly(ctx, consoleQ, '#0b1418'); outline(ctx, consoleQ, shade(R, '#8a948f', 5), 3);
      const [cx, cy, cw, ch] = bounds(consoleQ), mx = cx + cw / 2, my = cy + ch / 2;
      const segs = [['A', s.flags.l01_cut === 'airlock'], ['B', s.flags.l01_cut === 'quarters'], ['C', frozen], ['D', !s.flags.l01_cut]];
      segs.forEach(([n, bad], i) => {
        ctx.strokeStyle = n === 'D' ? (bad ? '#ff5a4a' : '#62f0a0') : bad ? '#7fd0ff' : '#62f0a0'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(mx, my, 15, i * Math.PI / 2 + 0.1, (i + 1) * Math.PI / 2 - 0.1); ctx.stroke();
      });
      txt(ctx, s.flags.l01_cut ? 'OK' : 'D!', mx, my + 4, s.flags.l01_cut ? '#62f0a0' : '#ff5a4a', 10);
      const slot = P(0.85, -0.1, 5); ctx.fillStyle = s.flags.l01_console ? '#62f0a0' : '#f05a4a'; ctx.fillRect(slot[0] - 6, slot[1] - 2, 12, 4);
      if (frozen) frostOverlay(ctx, t, s, 0.7);
    },
    drawOver(ctx, t, s) {
      if (!climateOpen(s)) return;
      ctx.save();
      ctx.fillStyle = 'rgba(5,12,16,0.94)'; ctx.fillRect(270, 150, 420, 260);
      ctx.strokeStyle = '#62f0c8'; ctx.lineWidth = 2; ctx.strokeRect(270, 150, 420, 260);
      txt(ctx, '環境控制・R. 瓦爾普利', 480, 178, '#9ef5dc', 14);
      txt(ctx, '冷卻能力不足：只能維持三個區域。', 480, 202, '#c7d6d0', 12);
      txt(ctx, '要讓 D 區冷下來，請選擇一個區域停止溫控：', 480, 222, '#c7d6d0', 12);
      for (const c of CLIMATE) {
        const [x, y, w, h] = c.rect;
        ctx.strokeStyle = '#3f8f7a'; ctx.strokeRect(x, y, w, h);
        txt(ctx, c.label, x + w / 2, y + 22, '#e0f0ea', 13);
      }
      txt(ctx, '［先不要決定］', 480, 384, '#7c9a92', 12);
      ctx.restore();
    },
    hotspots: [
      back('l01_galley', '回到廚房'),
      hit('tomato', bounds(tomatoQ, 6), '架子上的番茄', (g) => {
        if (g.s.flags.l01_cut === 'greenhouse') return g.say('葉子凍成了玻璃一樣的東西，一碰就碎。');
        if (!once(g, 'l01_tomato')) return g.say('其他的果子都還是青的。');
        g.eat(18); g.drink(6); g.sfx('eat'); g.say('一顆小番茄，紅得發亮。你咬下去的時候，園丁機器人停了一下，然後繼續噴霧。');
      }, 'take'),
      hit('gardener', [380, 180, 200, 50], '園丁機器人', (g) => g.say(g.s.flags.l01_cut === 'greenhouse' ? '園丁機器人停在軌道正中央，噴嘴對著一排凍死的菜，一動也不動。' : '它沿著軌道來回，給每一株菜噴同樣多的水，包括已經死掉的那些。')),
      { ...hit('console', bounds(consoleQ, 6), '環境控制台', (g) => {
        if (g.s.flags.l01_cut) return g.say('控制台上的四段圓弧都穩定下來了。其中一段，是你親手關掉的。');
        if (!g.s.flags.l01_console) return g.say('螢幕上的 D 區一片紅。旁邊有一個讀卡槽，紅燈亮著：「需要環境控制權限」。');
        g.flag('l01_console', true);
      }), use: {
        zcard(g) { g.take('zcard'); g.flag('l01_console'); g.sfx('beep'); g.say('讀卡槽亮起綠燈。螢幕上跳出一行字：「歡迎回來，R. 瓦爾普利。」'); },
      } },
      ...CLIMATE.map((c) => ({ ...hit(`cut_${c.id}`, c.rect, c.label, (g) => {
        g.flag('l01_cut', c.id); g.sfx('ok');
        const msg = {
          airlock: '你關掉了氣閘區。遠處傳來一聲悶響，像是有扇門凍住了。回 Level 0 的路沒了——從現在起，只能往前。',
          quarters: '你關掉了船員艙。那張行軍床，你大概再也睡不了了。',
          greenhouse: '你關掉了溫室。紫色的燈暗了下去，霜從架子底下爬上來。園丁機器人停下來，看著你。',
        }[c.id];
        if (c.id === 'greenhouse') g.sanity(-5);
        g.say(`${msg}\nD 區的讀數開始往下掉。`);
      }), when: climateOpen })),
      { ...hit('cancel', [400, 368, 160, 26], '先不要決定', (g) => g.flag('l01_console', 'later')), when: climateOpen },
    ],
  },

  l01_core: {
    level: '0.1', title: '球殼觀測台', room: coreR,
    viewMsg: '觀景窗裡，球殼中心那一圈扭曲的光，比肉眼看到的大得多。',
    enter(g, { first }) {
      if (first) g.say('一整面玻璃。外面是一個大得沒有邊的空心球殼，內壁上一層一層全是甲板和窗戶。更遠的地方，黃色的房間像樓層一樣往上堆。右邊的牆裂開了，裂口在閃。');
    },
    draw(ctx, t, s, R) {
      drawShell(ctx, t);
      box(ctx, R, lastConsole);
      const sc = P(0, 0.62, 2.3); ctx.fillStyle = Math.sin(t * 3) > 0 ? '#ff6a4a' : '#5a2018'; ctx.fillRect(sc[0] - 4, sc[1] - 10, 8, 4);
      tvStatic(ctx, breach, t, false);
      outline(ctx, breach, '#2a3236', 3);
      const bl = P(2.2, -0.86, 2.7); txt(ctx, '外殼破損', bl[0] - 10, bl[1], '#ff8a6a', 11);
    },
    hotspots: [
      back('l01_ring', '回到環形走廊'),
      hit('window', bounds(bigWindow, 0), '看著球殼的中心', (g) => g.read('n01_core')),
      hit('console', boxRect(lastConsole, 6), '一直在閃的廣播台', (g) => g.read('n01_last')),
      hit('noclip', bounds(breach, 4), '從閃爍的裂口切出去', (g) => {
        if (rand() < 0.25) return g.go('l0_pillar', { msg: '你穿過裂口，眼前一黑——腳下又是濕地毯。切出把你丟回了 Level 0，一根柱子旁邊。' });
        g.flag('l1_via_zenith'); g.flag('l1_fresh', 'zenith');
        g.go('l1_arrive', { msg: '你穿過閃爍的裂口。玻璃、甲板、球殼一起被抽走，腳下變成了冰冷潮濕的水泥。' });
      }, 'go'),
    ],
  },
};
