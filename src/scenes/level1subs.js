// Level 1's sublevels and the M.E.G. Alpha base they hang off. Adapted from these Backrooms Wiki articles
// (Chinese translations, CC BY-SA 3.0):
//   Level 1.1 "腐敗的走廊" (CutTheBirch, tr. INSide_497), Level 1.2 "砼苑" (Praetor3005, tr. Deip*isoster),
//   Level 1.3 "惡性腫瘤" (DivineAtlas, tr. Deip*isoster), Level 1.5 "顛倒" (Tesserax, tr. Ambersight).
// Credits are in README.md and the in-game footer. Routes, puzzles, scene text and notes are original.
import { P, W, H, bounds, wallQuad, faceQuad, poly, seg, box, boxRect, paper, shade, bottle, drawFigure } from '../render.js';
import { BACK, FORWARD } from './common.js';

export const LEVEL1_SUBLEVELS = {
  '1.1': { name: 'LEVEL 1.1', sub: '腐敗的走廊', drain: 1.5, thirst: 2, hunger: 1.2 },
  '1.2': { name: 'LEVEL 1.2', sub: '砼苑', drain: 1, thirst: 1.5, hunger: 1 },
  '1.3': { name: 'LEVEL 1.3', sub: '惡性腫瘤', drain: 2, thirst: 2, hunger: 1.4 },
  '1.5': { name: 'LEVEL 1.5', sub: '顛倒', drain: 2.5, thirst: 2, hunger: 1.5 },
};

// ---------- shared helpers ----------
const pal = (wall, ceil, floor, fog, light) => ({ wall, ceil, floor, fog, light });
const hit = (id, rect, label, click, cursor = 'look', extra = {}) => ({ id, rect, label, cursor, click, ...extra });
const once = (g, flag) => { if (g.s.flags[flag]) return false; g.flag(flag); return true; };
const DIRS = ['left', 'ahead', 'right'];
const DIR_RECT = { left: [40, 150, 280, 290], ahead: [370, 160, 220, 220], right: [640, 150, 280, 290] };
const DIR_NAME = { left: '往左走', ahead: '往前走', right: '往右走' };
const pick = (list, not) => { const o = list.filter((d) => d !== not); return o[Math.floor(Math.random() * o.length)]; };

function txt(ctx, str, x, y, color = '#d7d5b9', size = 14, align = 'center') {
  ctx.save(); ctx.fillStyle = color; ctx.font = `${size}px monospace`; ctx.textAlign = align;
  ctx.fillText(str, x, y); ctx.restore();
}
function glow(ctx, x, y, r, color, a = 1) {
  if (r <= 0) return;
  const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}
function outline(ctx, pts, color, w = 2) { ctx.strokeStyle = color; ctx.lineWidth = w; poly(ctx, pts); ctx.stroke(); }
function door(ctx, R, q, z, color = '#6a6a64') {
  poly(ctx, q, shade(R, color, z));
  outline(ctx, q, shade(R, '#2a2a28', z), 2);
}

// =====================================================================
// LEVEL 1 — the M.E.G. Alpha base, from outside
// The articles place Level 1.1 due south of Alpha and Level 1.3 through a white wall beside it.
// =====================================================================
const alphaPal = pal('#6a675e', '#34322e', '#45433d', '#0b0a09', '#f0ead0');
const alphaR = { hw: 2.2, depth: 7, fogEnd: 11, pal: alphaPal, floorTex: 'concrete', wallTex: 'concrete', baseboard: false, lights: [2.2, 4.8], openings: [{ side: 1, z1: 4.8, z2: 5.8, top: -0.6 }] };
const alphaGate = faceQuad(-1.0, -0.8, 1.0, 1, 6.99);
const intercom = wallQuad(2.2, -0.1, 0.25, 3.6, 4.0);
const board = wallQuad(-2.2, -0.5, 0.1, 2.2, 3.2);
const whiteWall = wallQuad(-2.2, -0.7, 1, 4.2, 5.6);
const southWay = wallQuad(2.2, -0.6, 1, 4.8, 5.8);

// =====================================================================
// LEVEL 1.1 — the Decrepit Corridor
// One straight, narrow corridor of whitewashed cinder block and blue tile, in zones that get worse the
// further you go. Zone 2 tilts and glitches (noclipping there drops you somewhere random in Level 1),
// Zone 3 is pitch black, Zone 4 is a black-and-white deadzone, and the light some follow is Zone 5.
// =====================================================================
const block = pal('#d6d3c6', '#b3b0a4', '#35608f', '#0c0e12', '#f4f2e6');
function cinder(ctx, R, hw, D, k = 1) {
  for (const s of [-1, 1]) for (let y = -0.8; y < 1; y += 0.25) {
    seg(ctx, P(s * hw, y, 1), P(s * hw, y, D), shade(R, '#8e8b80', 3, 1, 0.35 * k), 1);
  }
  for (const s of [-1, 1]) for (let z = 1.3; z < D; z += 0.55) {
    for (let y = -1; y < 1; y += 0.5) seg(ctx, P(s * hw, y + (Math.round(z * 2) % 2) * 0.25, z), P(s * hw, y + 0.25 + (Math.round(z * 2) % 2) * 0.25, z), shade(R, '#8e8b80', z, 1, 0.3 * k), 1);
  }
}
function blueTiles(ctx, R, hw, D) {
  for (let x = -hw; x <= hw + 0.01; x += 0.3) seg(ctx, P(x, 1, 1), P(x, 1, D), shade(R, '#1e3a5a', 3, 1, 0.6), 1);
  for (let z = 1.2; z < D; z += 0.3) seg(ctx, P(-hw, 1, z), P(hw, 1, z), shade(R, '#1e3a5a', z, 1, 0.6), 1);
}
const z1R = { hw: 0.9, depth: 10, fogEnd: 12, pal: block, baseboard: false, lights: [1.8, 4, 6.5, 9] };
const cot1 = { x1: -0.85, x2: -0.5, y1: 0.62, y2: 1, z1: 2.0, z2: 3.2, color: '#5a6248', top: '#6a7458', edge: true };
const fridge = { x1: 0.52, x2: 0.88, y1: -0.4, y2: 1, z1: 2.4, z2: 2.9, color: '#d8dad6', top: '#e8eae6', edge: true };
const squadNote = wallQuad(-0.9, -0.5, -0.1, 2.3, 2.9);
const NARROW_AHEAD = [430, 200, 100, 130];

const z2R = { ...z1R, lights: [2, 4.5, 7], flickerLights: [0, 2], flick: (t) => (Math.sin(t * 13.1) + Math.sin(t * 4.3) > 1.6 ? 0.55 : 1) };
const cabinDoor = wallQuad(-0.9, -0.6, 1, 2.0, 2.7);
const marks = wallQuad(-0.9, -0.4, 0.2, 3.2, 4.0);
const glitchQ = wallQuad(0.9, -0.8, 1, 2.6, 3.6);
const shelf = { x1: 0.6, x2: 0.88, y1: -0.2, y2: 1, z1: 4.2, z2: 5.4, color: '#7a7a72', top: '#8a8a82', edge: true };
// Noclipping out of Zone 2 lands you somewhere random in Level 1.
const CUT_TO = [
  ['l1_arrive', '倉庫入口'], ['l1_crates', '倉庫'], ['l1_corridor', '走廊區'], ['l1_fog', '霧中的停車場'],
];
function glitchWall(ctx, q, t) {
  const [x, y, w, h] = bounds(q);
  ctx.save(); poly(ctx, q); ctx.clip();
  for (let i = 0; i < 26; i++) {
    const yy = y + ((i * 37 + t * 90) % h), dx = (Math.random() - 0.5) * 30;
    ctx.fillStyle = Math.random() < 0.5 ? 'rgba(20,24,40,0.5)' : 'rgba(230,236,255,0.45)';
    ctx.fillRect(x + dx, yy, w, 2 + Math.random() * 5);
  }
  ctx.restore();
}

const cabinPal = pal('#6e5a40', '#3a2e20', '#4a3a28', '#0a0805', '#ffd8a0');
const cabinR = { hw: 1.4, depth: 4.5, fogEnd: 11, pal: cabinPal, baseboard: false, lights: [2.4], floorTex: 'concrete' };
const cabinTable = { x1: -0.6, x2: 0.6, y1: 0.4, y2: 1, z1: 2.4, z2: 3.1, color: '#5a4630', top: '#6e573c', edge: true };
const gangLog = [P(-0.3, 0.4, 2.5), P(0.2, 0.4, 2.5), P(0.2, 0.4, 2.9), P(-0.3, 0.4, 2.9)];
const graffiti = faceQuad(-1.2, -0.75, 0.4, -0.15, 4.499);
const cabinShelf = { x1: 0.85, x2: 1.38, y1: -0.1, y2: 0.0, z1: 2.6, z2: 3.4, color: '#5a4630', top: '#6e573c', edge: true };

const z3R = { hw: 1.6, depth: 9, fogEnd: 8, pal: pal('#b8b6ac', '#3a3a38', '#2f4c70', '#000000', '#c8c6b8'), baseboard: false, lights: [] };
const crate4 = { x1: -1.5, x2: -0.7, y1: 0.2, y2: 1, z1: 2.6, z2: 3.4, color: '#7a5a38', top: '#8a6a44', edge: true };
const warnSign = faceQuad(-0.55, -0.5, 0.55, 0.05, 8.99);
export const OUTPOST4_CODE = '726';

const z4R = { hw: 1.2, depth: 10, fogEnd: 9, pal: pal('#eeeeee', '#0a0a0a', '#f4f4f4', '#000000', '#ffffff'), baseboard: false, lights: [2, 5] };
function drawCursor(ctx, x, y, s, t) {
  const k = 0.8 + 0.2 * Math.sin(t * 3);
  glow(ctx, x + s * 0.3, y + s * 0.5, s * 3, 'rgba(255,255,255,0.7)', k);
  ctx.save(); ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#000'; ctx.lineWidth = Math.max(1, s / 10);
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x, y + s); ctx.lineTo(x + s * 0.28, y + s * 0.74); ctx.lineTo(x + s * 0.48, y + s * 1.12);
  ctx.lineTo(x + s * 0.62, y + s * 1.04); ctx.lineTo(x + s * 0.42, y + s * 0.68); ctx.lineTo(x + s * 0.76, y + s * 0.68);
  ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
}
function deadzoneTick(g, dt) {
  const f = g.s.flags;
  f.l11_dz = (f.l11_dz || 0) + dt;
  if (f.l11_dz >= 1.2) { f.l11_dz -= 1.2; g.sanity(-1); }
}

// =====================================================================
// LEVEL 1.2 — the Garden of Concrete
// Level 1's layout, overgrown with sunflowers, lilacs and ivy. Entities stay away. The garden changes
// whoever lingers in it: every step and every moment spent inside makes you a little more plant.
// =====================================================================
const garden = pal('#86887e', '#3e4238', '#3f4c30', '#0d1409', '#f0f4d0');
export const BLOOM_MAX = 8;
export const ROW_STEPS = 2;
const BLOOM_MSGS = {
  3: '你的手背在發癢。仔細看，上面長出了一層細細的、淺綠色的絨毛。',
  5: '你想不起來你是從哪一扇門走進來的。你知道答案，就是想不起來。',
  7: '你的腳趾在鞋子裡往下扎。地上的土，好像很軟。',
};
let lingerT = 0;
function bloom(g, n = 1) {
  const f = g.s.flags;
  const before = f.l12_bloom || 0;
  f.l12_bloom = before + n;
  for (const k of Object.keys(BLOOM_MSGS)) if (before < +k && f.l12_bloom >= +k) g.say(BLOOM_MSGS[k]);
}
function gardenTick(g, dt) {
  const f = g.s.flags;
  lingerT += dt;
  if (lingerT >= 10) { lingerT -= 10; bloom(g); }
  if ((f.l12_bloom || 0) >= BLOOM_MAX) {
    f.l12_bloom = 0; f.l12_row = null; lingerT = 0;
    g.sanity(-15); g.sfx('sting');
    g.go('l1_garden', { free: true, msg: '你倒在花叢裡。醒來的時候，你正拖著腳爬過那扇長滿藤蔓的門，手指僵硬得像樹根，耳朵裡全是泥土。你用力搓手，直到它們重新變回手指。' });
  }
}
const gardenEnter = (g) => { lingerT = 0; bloom(g); };
const bloomLabel = (s) => {
  const b = s.flags.l12_bloom || 0;
  return b >= 5 ? '你正在變成植物・快離開' : b >= 3 ? '花粉黏在皮膚上・別久留' : '花香很濃・別久留';
};
function sunflower(ctx, R, x, y, z, face, t) {
  const top = P(x, y, z), foot = P(x, 1, z), r = 0.16 * 480 / z;
  seg(ctx, foot, top, shade(R, '#4a7a30', z), Math.max(1.5, 5 / z));
  const sway = Math.sin(t * 0.7 + x * 3) * r * 0.06;
  const off = { left: -0.45, ahead: 0, right: 0.45 }[face] * r;
  ctx.fillStyle = shade(R, '#e8c030', z);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath(); ctx.ellipse(top[0] + sway + Math.cos(a) * r * 0.75, top[1] + Math.sin(a) * r * 0.75, r * 0.36, r * 0.16, a, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = shade(R, '#4a2e14', z);
  ctx.beginPath(); ctx.ellipse(top[0] + sway + off, top[1], r * 0.5 - Math.abs(off) * 0.25, r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
}
function lilacs(ctx, R, x, y, z, n = 6) {
  for (let i = 0; i < n; i++) {
    const p = P(x + (i % 3) * 0.08, y - Math.floor(i / 3) * 0.1, z + (i % 2) * 0.1), r = Math.max(1.5, 14 / z);
    ctx.fillStyle = shade(R, i % 2 ? '#b59ad8' : '#c8b0e8', z);
    ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, Math.PI * 2); ctx.fill();
  }
}
function ivy(ctx, R, hw, D, t, n = 26) {
  ctx.save(); ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const s = i % 2 ? 1 : -1, z = 1.2 + (i * 0.41) % (D - 1.5), y = -1 + ((i * 0.57) % 1.6);
    const a = P(s * hw, y, z), b = P(s * hw * 0.7, -1, z + 0.6), c = P(s * hw * 0.2, -1, z + 1.2);
    ctx.strokeStyle = shade(R, '#3e6a2e', z, 1, 0.9); ctx.lineWidth = Math.max(1.2, 5 / z);
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(b[0] + Math.sin(t + i) * 2, b[1], c[0], c[1]); ctx.stroke();
  }
  ctx.restore();
}
const gateR = { hw: 2.0, depth: 8, fogEnd: 9, pal: garden, floorTex: 'concrete', wallTex: 'concrete', baseboard: false, lights: [2.2, 5] };
const ivyPillars = [[-1.2, 3.4], [0.8, 4.6]].map(([x, z]) => ({ x1: x, x2: x + 0.4, y1: -1, y2: 1, z1: z, z2: z + 0.4, color: '#7a7c72' }));
const bookQ = [P(-1.6, 1, 2.3), P(-1.1, 1, 2.3), P(-1.1, 1, 2.7), P(-1.6, 1, 2.7)];
const rowsR = { hw: 2.6, depth: 9, fogEnd: 7, pal: garden, floorTex: 'concrete', baseboard: false, lights: [3] };
const ROW_FLOWERS = { left: [[-1.9, 3], [-1.5, 4], [-2.1, 4.6]], ahead: [[-0.3, 5], [0.3, 5.4], [0, 6.4]], right: [[1.6, 3], [2.0, 3.9], [1.5, 4.8]] };
const heartR = { hw: 2.0, depth: 6, fogEnd: 9, pal: garden, floorTex: 'concrete', baseboard: false, lights: [3] };
const kit = { x1: 0.8, x2: 1.4, y1: 0.7, y2: 1, z1: 2.4, z2: 2.9, color: '#6a5a3a', top: '#7a6a48', edge: true };
const kitNote = [P(0.1, 1, 1.8), P(0.5, 1, 1.8), P(0.5, 1, 2.1), P(0.1, 1, 2.1)];
const bedQ = [P(-1.2, 1, 3.0), P(0.2, 1, 3.0), P(0.2, 1, 4.6), P(-1.2, 1, 4.6)];

// =====================================================================
// LEVEL 1.3 — Malignancy
// Once a soft white clinic whose detox zones healed anything; now taken by Decay. Holes eat whatever you
// lower into them. One detox zone may still be clean; a plastic line, lowered and pulled back, tells which.
// =====================================================================
const whitePal = pal('#eceeec', '#dde1e0', '#d4d9d7', '#1a1d1c', '#ffffff');
const hallR = { hw: 1.2, depth: 9, fogEnd: 10, pal: whitePal, baseboard: false, lights: [2, 4.5, 7], flickerLights: [1], flick: (t) => (Math.sin(t * 9.7) + Math.sin(t * 2.9) > 1.75 ? 0.5 : 1), openings: [{ side: -1, z1: 2.4, z2: 3.4, top: -0.6 }, { side: 1, z1: 4.0, z2: 5.0, top: -0.6 }] };
const hallHole = [P(0.1, 1, 2.2), P(0.7, 1, 2.1), P(0.8, 1, 2.6), P(0.2, 1, 2.8)];
const stretcher = { x1: -1.15, x2: -0.55, y1: 0.5, y2: 0.7, z1: 4.2, z2: 5.6, color: '#c8ccca', top: '#e0e4e2', edge: true };
function rot(ctx, R, spots, t) {
  for (const [x, y, z, r] of spots) {
    const p = P(x, y, z), rr = r * 480 / z;
    const gr = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], rr);
    gr.addColorStop(0, 'rgba(30,28,26,0.9)'); gr.addColorStop(0.5, 'rgba(70,68,60,0.55)'); gr.addColorStop(1, 'rgba(90,88,80,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(p[0], p[1], rr, rr * (0.7 + 0.05 * Math.sin(t + x)), 0, 0, Math.PI * 2); ctx.fill();
  }
}
const HALL_ROT = [[-1.2, -0.3, 3.8, 0.25], [1.2, 0.4, 2.6, 0.3], [1.2, -0.6, 6, 0.4], [-0.4, -1, 5, 0.3], [-1.2, 0.6, 7, 0.4]];
const wardR = { hw: 1.8, depth: 5, fogEnd: 10, pal: whitePal, baseboard: false, lights: [2.4], flickerLights: [0], flick: (t) => (Math.sin(t * 7.3) > 0.92 ? 0.5 : 1) };
const wardBeds = [{ x1: -1.7, x2: -0.9, y1: 0.45, y2: 1, z1: 2.0, z2: 3.4, color: '#e4e8e6', edge: true }, { x1: 0.9, x2: 1.7, y1: 0.45, y2: 1, z1: 3.0, z2: 4.4, color: '#e4e8e6', edge: true }];
const autopsyQ = wallQuad(1.8, -0.5, 0.0, 2.0, 2.5);
const memoQ = faceQuad(-0.2, -0.45, 0.35, 0.05, 4.999);
const supplyCab = faceQuad(-1.3, -0.7, -0.5, 0.3, 4.999);
const tray = { x1: 0.2, x2: 0.75, y1: 0.5, y2: 0.56, z1: 2.2, z2: 2.6, color: '#a8b0ae', top: '#c8d0ce', edge: true };
const detoxR = { hw: 1.4, depth: 8, fogEnd: 10, pal: whitePal, baseboard: false, lights: [2, 5], flickerLights: [0], flick: (t) => (Math.sin(t * 6.1) + Math.sin(t * 2.3) > 1.8 ? 0.5 : 1) };
const ZONES = [
  { id: 'zone_a', name: '左邊的排毒區', q: wallQuad(-1.4, -0.6, 1, 2.4, 3.4) },
  { id: 'zone_b', name: '右邊的排毒區', q: wallQuad(1.4, -0.6, 1, 2.4, 3.4) },
  { id: 'zone_c', name: '盡頭的排毒區', q: faceQuad(-0.45, -0.6, 0.45, 1, 7.99) },
];
const cleanZone = (s) => s.flags.l13_clean ?? -1;
function lineTest(g, i) {
  const f = g.s.flags;
  f[`l13_t${i}`] = true;
  if (i === cleanZone(g.s) && !f.l13_healed) {
    g.say('你把一碼長的塑膠線垂進門檻，等了一會兒，拉回來。一整碼，一吋都沒少。線的末端是溼的、溫的，像剛從誰的手心裡抽出來。');
  } else {
    g.sanity(-2);
    g.say('你把一碼長的塑膠線垂進門檻，等了一會兒，拉回來。只剩不到一呎。斷口不是剪的，是被什麼慢慢吃掉的，還在冒著細細的泡。');
  }
}
function enterZone(g, i) {
  const f = g.s.flags;
  if (i === cleanZone(g.s) && !f.l13_healed) {
    f.l13_healed = true; g.sfx('steam');
    g.sanity(45); g.drink(15);
    return g.say('你走進去。一開始什麼都沒有——然後皮膚底下燒了起來，每一道擦傷、每一個水泡都在發癢、收口。你咬著牙撐到最後。走出來的時候，你覺得自己好像從來沒有這麼完整過。\n……你回頭。你剛剛站的地方，白色的牆開始發灰了。');
  }
  f.l13_burned = true; g.sfx('sting'); g.sanity(-22);
  g.say('你把手伸過門檻。灼熱從指尖爬上手臂，皮膚起了水泡、裂開，剛長好的肉又一層一層剝落。你尖叫著把手抽回來。手臂還在，可是形狀不太對了。');
}

// =====================================================================
// LEVEL 1.5 — Inverted
// Reached through a window that should not be there. The lights pour out darkness and everything else
// glows. There is no hum, only whispering, and it gets quieter as you get closer to whoever is whispering.
// The only way out is to noclip.
// =====================================================================
const inv = pal('#3c3c42', '#232328', '#2c2c30', '#060606', '#fff6dc');
export const WHISPER_STEPS = 3;
function invert(ctx) {
  ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H); ctx.restore();
}
function hangingChair(ctx, R, x, z) {
  // furniture fixed to the ceiling, legs pointing down at you
  box(ctx, R, { x1: x, x2: x + 0.45, y1: -1, y2: -0.92, z1: z, z2: z + 0.45, color: '#5a5048', top: '#6a6058' });
  for (const [dx, dz] of [[0.03, 0.03], [0.4, 0.03], [0.03, 0.4], [0.4, 0.4]]) seg(ctx, P(x + dx, -0.92, z + dz), P(x + dx, -0.55, z + dz), shade(R, '#4a4038', z), Math.max(1, 4 / z));
}
const window15R = { hw: 1.2, depth: 7, fogEnd: 9, pal: inv, baseboard: false, lights: [2, 4.5], floorTex: 'concrete', stripes: true };
const paintedWindow = wallQuad(-1.2, -0.6, 0.2, 2.0, 3.0);
const logQ = [P(0.2, 1, 2.2), P(0.6, 1, 2.2), P(0.6, 1, 2.6), P(0.2, 1, 2.6)];
const halls15R = { hw: 3.0, depth: 10, fogEnd: 6, pal: inv, baseboard: false, lights: [2.5, 5], floorTex: 'concrete' };
const WHISPER_AT = { left: [-2.2, -0.1, 5.5], ahead: [0, -0.2, 8], right: [2.2, -0.1, 5.5] };
const motherPal = pal('#5a1a1c', '#2a0a0c', '#3a1012', '#080102', '#ff8070');
const motherR = { hw: 1.0, depth: 7, fogEnd: 6, pal: motherPal, baseboard: false, lights: [] };
const thinR = { hw: 1.3, depth: 5, fogEnd: 10, pal: inv, baseboard: false, lights: [2.6], floorTex: 'concrete', stripes: true };
const seam = wallQuad(1.3, -0.7, 1, 2.6, 3.6);
const jhNote = faceQuad(-0.4, -0.3, 0.1, 0.15, 4.999);

let navNow = null;
function navState(g) {
  if (!g.s.flags.l15_nav) {
    const loud = DIRS[Math.floor(Math.random() * 3)];
    g.flag('l15_nav', { step: 0, loud, quiet: pick(DIRS, loud) });
  }
  navNow = g.s.flags.l15_nav;
  return navNow;
}
function nextNav(g, step) {
  const prev = g.s.flags.l15_nav, loud = pick(DIRS, prev?.loud);
  g.flag('l15_nav', { step, loud, quiet: pick(DIRS, loud) });
  navNow = g.s.flags.l15_nav;
}
const loudness = (nav, d) => (d === nav.loud ? 'loud' : d === nav.quiet ? 'quiet' : 'mid');
const LOUD_LABEL = { loud: '低語聲很響', mid: '低語聲普通', quiet: '低語聲幾乎聽不見' };
function whisperStep(g, d) {
  const nav = navState(g), k = loudness(nav, d);
  if (k === 'loud') {
    if (nav.step + 1 >= WHISPER_STEPS) {
      g.flag('l15_nav', null);
      return g.go('l15_thin', { msg: '低語聲大得像一屋子的人在同時說話。四周卻一個人都沒有——它們都離你很遠，很遠。牆在這裡變得很薄。' });
    }
    nextNav(g, nav.step + 1);
    return g.go('l15_halls', { msg: ['你往聲音最吵的地方走。吵，代表它們不在這裡。', '低語聲更響了。你開始聽得出裡面有字，但你不想聽懂。'][nav.step] || null });
  }
  if (k === 'mid') {
    nextNav(g, 0);
    return g.go('l15_halls', { msg: '你走了很久，低語聲一直沒變。轉過一個彎，你又看見了那盞往下滴黑暗的燈。你在繞圈。' });
  }
  const pulls = (g.s.flags.l15_pulls || 0) + 1;
  g.flag('l15_pulls', pulls); nextNav(g, 0);
  if (pulls >= 2) return g.go('l15_mother', { msg: '安靜。好安靜。安靜得像被誰抱在懷裡。你沒有決定要往前走，可是腳一直在走。' });
  g.sanity(-8);
  g.go('l15_halls', { msg: '你往最安靜的方向走。越走越安靜，越走越想停下來……有什麼東西輕輕碰了一下你的後頸。你逃了回來。' });
}

// =====================================================================
export const LEVEL1_SUB_SCENES = {
  l1_alpha: {
    level: 1, title: 'M.E.G. Alpha 基地外', room: alphaR, safe: true,
    enter(g, { first }) {
      if (first) g.say('走廊盡頭是一道漆著 M.E.G. 標誌的大鐵門，門上寫著「ALPHA」。門緊閉著。右邊有一條往南的走廊，左邊有一段白得刺眼的牆，上面貼滿了封條。');
    },
    draw(ctx, t, s, R) {
      poly(ctx, alphaGate, shade(R, '#4c5250', 7));
      for (let i = 1; i < 6; i++) seg(ctx, P(-1 + i / 3, -0.8, 6.99), P(-1 + i / 3, 1, 6.99), shade(R, '#2c3230', 7), 2);
      outline(ctx, alphaGate, shade(R, '#202422', 7), 3);
      const gc = P(0, -0.55, 7); txt(ctx, 'M.E.G.  ALPHA', gc[0], gc[1], shade(R, '#e8e4d0', 7), 13);
      const lamp = P(0, -0.92, 7); ctx.fillStyle = Math.sin(t * 2) > 0 ? '#3f3' : '#162'; ctx.fillRect(lamp[0] - 4, lamp[1] - 3, 8, 6);
      poly(ctx, intercom, shade(R, '#2a2e2c', 3.8));
      const il = bounds(intercom); ctx.fillStyle = '#f33'; ctx.fillRect(il[0] + il[2] / 2 - 2, il[1] + 4, 4, 4);
      paper(ctx, R, board, 2.7, '#d8d0b8');
      const bc = P(-2.2, -0.58, 2.7); txt(ctx, '公告', bc[0] + 70, bc[1], shade(R, '#e0dccb', 2.7), 12);
      poly(ctx, whiteWall, s.flags.l13_tape ? '#f4f6f5' : '#e8ecea');
      if (!s.flags.l13_tape) {
        const [x, y, w, h] = bounds(whiteWall);
        ctx.save(); ctx.strokeStyle = '#c8b020'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(x, y + 10); ctx.lineTo(x + w, y + h - 10); ctx.moveTo(x + w, y + 10); ctx.lineTo(x, y + h - 10); ctx.stroke(); ctx.restore();
        txt(ctx, '衰退', x + w / 2, y + h / 2, '#a01810', 13);
      } else {
        const c = P(-2.2, 0.2, 4.9);
        seg(ctx, [c[0], c[1] - 70], [c[0] + 3, c[1] + 60], '#9aa09c', 3);
        rot(ctx, R, [[-2.2, 0.6, 5.2, 0.2]], t);
      }
      const sc = P(2.2, -0.75, 5.3); txt(ctx, '1.1 →  南', sc[0] - 20, sc[1], shade(R, '#e8e2c8', 5.3), 11);
    },
    hotspots: [
      { ...BACK('l1_corridor', '回到走廊'), click: (g) => g.go('l1_corridor') },
      hit('gate', bounds(alphaGate, 2), 'Alpha 基地的大門', (g) => g.say('門從裡面鎖死了。你敲了三下，聲音在門後傳了很遠。門上的觀察窗後面有燈，有人影走過——沒有停下來。')),
      hit('intercom', bounds(intercom, 10), '對講機', (g) => {
        g.sfx('static');
        g.say('「Alpha 基地。不收留未登記人員。」錄音停了一下，換了一個比較累的聲音：「……補給在南邊走廊的一號前哨站。白牆那邊封了。別過去。真的，別過去。」');
      }),
      hit('board', bounds(board, 4), '公告欄', (g) => g.read('n_alpha')),
      hit('south', bounds(southWay, 6), '往南的走廊', (g) => g.go('l11_z1', { msg: '走廊在這裡變了：牆變成刷白的煤渣磚，地上鋪著藍色的瓷磚。入口旁的牌子寫著「LEVEL 1.1・往前請登記」。登記簿是空的。' }), 'go'),
      hit('white', bounds(whiteWall, 4), '貼滿封條的白牆', (g) => {
        if (!g.s.flags.l13_tape) {
          g.flag('l13_tape'); g.sfx('page');
          return g.say('你一條一條撕掉封條。牆上有一道人工切開的縫，縫裡白得乾淨、白得刺眼。縫的邊緣，卻像放久的麵包一樣，長了一圈灰。');
        }
        g.go('l13_hall', { msg: '你側身擠進白牆的縫。裡面的牆、地板、天花板，摸起來都是軟的，像皮膚。' });
      }, 'go'),
    ],
  },

  // ---------- LEVEL 1.1 ----------
  l11_z1: {
    level: '1.1', title: '區域 1・一號前哨站', room: z1R, safe: true,
    enter(g, { first }) { if (first) g.say('一條又直又窄的走廊，看不到盡頭。左邊擺著一張行軍床，右邊是一台還在運轉的冰箱。前哨站——說是前哨站，其實只是牆邊的一塊地方。'); },
    draw(ctx, t, s, R) {
      cinder(ctx, R, R.hw, R.depth); blueTiles(ctx, R, R.hw, R.depth);
      box(ctx, R, cot1); box(ctx, R, fridge);
      seg(ctx, P(0.55, -0.1, 2.399), P(0.55, 0.3, 2.399), shade(R, '#8a8c88', 2.4), 3);
      paper(ctx, R, squadNote, 2.6, '#f2eee0');
      const sc = P(0, -0.8, 9.5); txt(ctx, 'ZONE 1', sc[0], sc[1], shade(R, '#3a3a36', 9.5), 10);
    },
    hotspots: [
      { ...BACK('l1_alpha', '回到 Alpha 基地外'), click: (g) => g.go('l1_alpha') },
      { ...FORWARD('l11_z2', '往走廊深處走'), rect: NARROW_AHEAD, click: (g) => g.go('l11_z2', { msg: '走了很久以後，地板開始往一邊斜。你得扶著牆才站得穩。' }) },
      hit('fridge', boxRect(fridge, 4), '冰箱', (g) => {
        if (!once(g, 'l11_fridge')) return g.say('冰箱裡空了。門上貼著一張便條：「拿了什麼就寫在登記簿上。——走廊小隊」');
        g.give('almond'); g.give('can');
        g.say('冰箱還在嗡嗡運轉，裡面冰冰涼涼的：一瓶杏仁水，一個罐頭。這一層的第一區，東西真的很多。');
      }),
      hit('cot', boxRect(cot1, 4), '行軍床', (g) => {
        if (!once(g, 'l11_rest')) return g.say('毯子上還留著你躺過的凹痕。');
        g.sanity(6); g.say('你在行軍床上躺了一下。走廊的燈很穩，沒有閃。你已經不記得上一次在燈下面睡著是什麼時候了。');
      }),
      hit('note', bounds(squadNote, 8), '牆上的值勤表', (g) => g.read('n11_squad')),
    ],
  },

  l11_z2: {
    level: '1.1', title: '區域 2', room: z2R, hazard: () => '地板傾斜・牆在故障',
    tilt: (s, t) => 0.035 * Math.sin(t * 0.5) + 0.02,
    trap: { after: 24, run: (g) => g.scare('l11_z1', '走廊盡頭那個人一直在往你這邊走。走近了你才看清楚：他的臉是皺的，像一件沒穿好的衣服。你沒命地往回跑。', 16, 'figure') },
    viewMsg: '觀景窗裡，走廊盡頭的那個人沒有影子。他的皮膚在領口的地方鬆垮垮地垂著，像一件借來的衣服。',
    enter(g, { first }) {
      if (first) g.say('地板歪了一邊，牆上有一塊地方像壞掉的電視一樣在跳。左邊有一扇木門，門上用噴漆寫著「通道幫」。走廊盡頭，好像站著一個人。');
      else g.say('地板還是歪的。盡頭那個人，好像比剛才近了一點。');
    },
    draw(ctx, t, s, R) {
      cinder(ctx, R, R.hw, R.depth, 0.8); blueTiles(ctx, R, R.hw, R.depth);
      door(ctx, R, cabinDoor, 2.3, '#6a5238');
      const dc = P(-0.9, -0.4, 2.35); txt(ctx, '通道幫', dc[0] + 20, dc[1], '#b8281c', 12);
      ctx.save(); ctx.strokeStyle = shade(R, '#3a2a40', 3.6); ctx.lineWidth = 2;
      const mb = bounds(marks);
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(mb[0] + 6 + (i % 2) * 10, mb[1] + 10 + i * 12, 4 + (i % 3), i, i + 4); ctx.stroke(); }
      ctx.restore();
      box(ctx, R, shelf);
      if (!s.flags.l11_shelf) { const p = P(0.72, -0.25, 4.6); ctx.fillStyle = shade(R, '#c85a2a', 4.6); ctx.fillRect(p[0] - 5, p[1] - 4, 10, 6); }
      glitchWall(ctx, glitchQ, t);
      const f = P(0.1, 1, 8.6), top = P(0.1, -0.7, 8.6);
      drawFigure(ctx, f[0], f[1], f[1] - top[1], 0.75);
    },
    hotspots: [
      BACK('l11_z1', '退回區域 1'),
      { ...FORWARD('l11_z3', '往更暗的地方走'), rect: NARROW_AHEAD, click: (g) => g.go('l11_z3', { msg: '燈一盞一盞地少了。最後一盞燈下面，地板終於不斜了——因為你已經看不見地板了。空氣裡有一股很濃的消毒水味。' }) },
      hit('cabin', bounds(cabinDoor, 4), '噴著「通道幫」的木門', (g) => g.go('l11_cabin'), 'go'),
      hit('marks', bounds(marks, 10), '牆上的記號', (g) => {
        g.say('一排沒有人看得懂的記號，像字，又不像任何一種字。你看久了，覺得它們在描述你。');
        if (once(g, 'l11_marks')) g.sanity(-3);
      }),
      hit('shelf', boxRect(shelf, 6), '三號前哨站的貨架', (g) => {
        if (!once(g, 'l11_shelf')) return g.say('貨架空了。你剛才明明看見最上面那層還有東西——現在什麼都沒有。');
        g.give('bar', '牆邊的鐵貨架上寫著「三號前哨站・每月補給」。整排架子只剩一條能量棒。你拿走它的時候，下面一層的空位，好像少了什麼你剛剛才看見的東西。');
      }, 'take'),
      hit('glitch', bounds(glitchQ, 2), '故障的牆', (g) => {
        const [to, name] = CUT_TO[Math.floor(Math.random() * CUT_TO.length)];
        g.flag('l11_cut', name);
        g.go(to, { msg: `你把手按上那塊跳動的牆——牆沒有擋住你。你摔過去，摔進一片水泥味裡。這裡是……${name}？你根本不知道自己是怎麼回來的。` });
      }, 'go'),
    ],
  },

  l11_cabin: {
    level: '1.1', title: 'Jakob 的小屋', room: cabinR, safe: true,
    enter(g, { first }) { if (first) g.say('一間用木板搭起來的小屋，牆上噴滿了字。桌上散著地圖和空罐頭，還有一本手寫的筆記本。人都不在——看起來是出門很久了。'); },
    draw(ctx, t, s, R) {
      poly(ctx, graffiti, shade(R, '#6e5a40', 4.5));
      const gc = bounds(graffiti);
      txt(ctx, '區域 5 = 出口', gc[0] + gc[2] / 2, gc[1] + gc[3] * 0.45, '#c8301c', 17);
      txt(ctx, '跟著光走', gc[0] + gc[2] / 2, gc[1] + gc[3] * 0.85, '#c8301c', 12);
      box(ctx, R, cabinTable);
      paper(ctx, R, gangLog, 2.4, '#e8dcc0');
      box(ctx, R, cabinShelf);
      if (!s.flags.l11_cabin_almond) { const p = P(1.1, -0.1, 3.0); bottle(ctx, R, p[0], p[1], 34, 3.0); }
    },
    hotspots: [
      BACK('l11_z2', '回到走廊'),
      hit('log', bounds(gangLog, 14), '手寫的筆記本', (g) => g.read('n11_gang')),
      hit('graffiti', bounds(graffiti, 2), '牆上的噴漆', (g) => g.say('「區域 5 = 出口。跟著光走。」字跡被塗改過很多次，有人在旁邊用小字補了一句：「回來的人都說沒有光。」')),
      { ...hit('almond', [P(1.1, -0.1, 3)[0] - 20, P(1.1, -0.1, 3)[1] - 42, 40, 48], '架子上的瓶子', (g) => { g.flag('l11_cabin_almond'); g.give('almond', '架子上有一瓶杏仁水，瓶身上寫著「刀鋒的・別碰」。你還是拿了。'); }, 'take'), when: (s) => !s.flags.l11_cabin_almond },
    ],
  },

  l11_z3: {
    level: '1.1', title: '區域 3', room: z3R, dark: true, nightshot: true,
    smiler: {
      mode: 'stare', at: [0.4, -0.25, 5.2], back: 'l11_z2',
      present: (s) => !s.flags.l11_smiler_gone,
      gone: (g) => { g.flag('l11_smiler_gone'); g.say('那排牙齒慢慢往上飄，飄進比天花板還高的黑暗裡。這裡的天花板，到底有多高？'); },
    },
    viewMsg: '觀景窗的夜視模式裡，你看見左邊有一個方方正正的木箱，盡頭的牆上掛著一塊牌子。天花板高得照不到。',
    enter(g, { first }) {
      if (!g.s.flags.l11_smiler_gone) g.say(g.s.light ? '光圈的盡頭有東西反著光——是牙齒。' : '一片漆黑。消毒水的味道濃得嗆人。黑暗裡，浮著一排牙齒。');
      else if (first) g.say('一片漆黑。');
    },
    draw(ctx, t, s, R) {
      blueTiles(ctx, R, R.hw, R.depth);
      box(ctx, R, crate4);
      const lk = P(-1.1, 0.5, 2.6); ctx.fillStyle = shade(R, '#2a2e30', 2.6); ctx.fillRect(lk[0] - 10, lk[1] - 8, 20, 16);
      poly(ctx, warnSign, shade(R, '#d8c040', 7));
      const sc = bounds(warnSign); txt(ctx, '警告', sc[0] + sc[2] / 2, sc[1] + sc[3] * 0.65, shade(R, '#a01810', 7), 11);
    },
    hotspots: [
      BACK('l11_z2', '摸黑退回區域 2'),
      { ...hit('crate', boxRect(crate4, 4), '四號前哨站的木箱', (g) => {
        if (g.s.flags.l11_crate) return g.say('木箱已經空了。箱蓋內側刻著一個「正」字，只寫了一筆。');
        g.keypad(OUTPOST4_CODE, () => {
          g.flag('l11_crate'); g.give('almond'); g.give('almond'); g.give('battery');
          g.read('n11_jh', () => g.say('木箱裡有兩瓶杏仁水、一顆電池，和一張摺得很小的紙。'));
        });
      }), when: (s) => s.flags.l11_smiler_gone && s.light },
      { ...hit('sign', bounds(warnSign, 10), '盡頭的牌子', (g) => g.say('「警告！請勿越過此界。所有進入區域 4 的人都將面臨迫在眉睫的死亡。」\n牌子底下，有人用指甲刻了一個箭頭，指向更深的地方。')), when: (s) => s.flags.l11_smiler_gone && s.light },
      { ...hit('deeper', [395, 330, 170, 70], '越過警告牌', (g) => {
        if (!g.s.flags.l11_warned) { g.flag('l11_warned'); return g.say('你在牌子前面停下來。腳下的瓷磚，過了這條線就不再是藍色的了。再往前一步，就是區域 4。'); }
        g.go('l11_z4', { msg: '你跨過那條線。顏色一下子全被抽掉了。' });
      }, 'go'), when: (s) => s.flags.l11_smiler_gone },
    ],
  },

  l11_z4: {
    level: '1.1', title: '區域 4', room: z4R, update: deadzoneTick, hazard: () => '死區・清醒度持續流失',
    tilt: (s, t) => 0.07 * Math.sin(t * 0.9),
    viewMsg: '觀景窗裡只有雜訊。在雜訊裡，有一個箭頭形的白點，一直待在畫面同一個地方——不管你把鏡頭轉到哪裡。',
    enter(g, { first }) {
      g.sanity(-6);
      if (first) g.say('黑與白。地板像呼吸一樣起伏。牆邊漂著幾個東西，有手有腳，但數量不對。走廊的最深處，有一道光，形狀像一個箭頭。');
    },
    draw(ctx, t, s, R) {
      for (let z = 1.4; z < R.depth; z += 0.9) {
        const y = 1 + 0.06 * Math.sin(t * 2 + z * 1.7);
        seg(ctx, P(-R.hw, y, z), P(R.hw, y, z), '#111', Math.max(1, 3 / z));
      }
      for (const [x, y, z] of [[-0.8, -0.2, 3.2], [0.7, 0.2, 4.4], [-0.4, -0.5, 6.4]]) {
        const p = P(x, y + 0.08 * Math.sin(t + z), z), r = 0.18 * 480 / z;
        ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.lineWidth = Math.max(1, 3 / z);
        ctx.beginPath(); ctx.arc(p[0], p[1], r * 0.5, 0, Math.PI * 2); ctx.stroke();
        for (let i = 0; i < 5; i++) { const a = i * 1.3 + t * 0.3; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + Math.cos(a) * r * 1.6, p[1] + Math.sin(a) * r * 1.6); ctx.stroke(); }
        ctx.restore();
      }
      if (Math.random() < 0.08) { ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(0, Math.random() * H, W, 4 + Math.random() * 16); }
    },
    drawOver(ctx, t) { const p = P(0.02, -0.15, 9.5); drawCursor(ctx, p[0], p[1], 22, t); },
    hotspots: [
      BACK('l11_z3', '趁還走得動，退回去'),
      hit('light', [440, 220, 90, 90], '箭頭形的光', (g) => {
        if (!g.s.flags.l11_light) { g.flag('l11_light'); g.sanity(-4); return g.say('你朝光走了幾步。腳下的地板沒有接住你，你往下沉了半個身子才爬回來。光一動也不動，在等你。'); }
        g.end('void');
      }, 'go'),
      hit('wall', [40, 120, 220, 300], '起伏的牆', (g) => {
        if (!g.s.flags.l11_wall) { g.flag('l11_wall'); g.sanity(-4); return g.say('你的手穿過了牆，好像牆根本不在那裡。牆的另一邊什麼都沒有——沒有冷，沒有熱，沒有底。你趕緊把手抽回來。'); }
        g.end('void');
      }, 'go'),
    ],
  },

  // ---------- LEVEL 1.2 ----------
  l12_gate: {
    level: '1.2', title: '砼苑', room: gateR, quiet: 0.5, hazard: bloomLabel, update: gardenTick,
    enter(g, { first }) {
      gardenEnter(g);
      if (first) g.say('還是 Level 1 的水泥柱、水泥牆——只是全被花佔了。向日葵比人還高，丁香一串一串垂下來，柱子上爬滿了常春藤。這裡沒有任何東西在動，連遠處的悶響都沒有。很美。美得讓你不想走。');
    },
    draw(ctx, t, s, R) {
      ivy(ctx, R, R.hw, R.depth, t);
      for (const b of ivyPillars.slice().sort((a, b) => b.z1 - a.z1)) {
        box(ctx, R, b);
        for (let i = 0; i < 5; i++) seg(ctx, P(b.x1, 1 - i * 0.4, b.z1), P(b.x2, 0.8 - i * 0.4, b.z1), shade(R, '#3e6a2e', b.z1), 3);
      }
      for (const [x, z] of [[-1.7, 3.2], [-1.8, 4.8], [1.7, 2.8], [1.6, 4.2], [-0.5, 6.5], [0.6, 6.8]]) sunflower(ctx, R, x, -0.35, z, 'ahead', t);
      lilacs(ctx, R, 1.7, -0.6, 2.4); lilacs(ctx, R, -1.85, -0.5, 2.6, 4);
      poly(ctx, bookQ, shade(R, '#6a4a2a', 2.5));
      seg(ctx, bookQ[0], bookQ[2], shade(R, '#e8dcc0', 2.5), 2);
    },
    hotspots: [
      { ...BACK('l1_garden', '從藤蔓門退回花園'), click: (g) => { g.flag('l12_bloom', 0); g.flag('l12_row', null); g.go('l1_garden', { msg: '你一走出藤蔓門，手背上的絨毛就枯了，一抹就掉。你深深吸了一口帶霉味的空氣。' }); } },
      { ...FORWARD('l12_rows', '走進花叢'), click: (g) => { g.flag('l12_row', { step: 0, face: DIRS[Math.floor(Math.random() * 3)] }); g.go('l12_rows'); } },
      hit('book', bounds(bookQ, 10), '掉在地上的筆記本', (g) => g.read('n12_book')),
      hit('flowers', [700, 140, 200, 140], '丁香', (g) => g.say('丁香的香味濃得像一隻手，輕輕按著你的後腦勺，要你躺下。')),
    ],
  },

  l12_rows: {
    level: '1.2', title: '向日葵叢', room: rowsR, quiet: 0.4, hazard: bloomLabel, update: gardenTick,
    enter(g) {
      gardenEnter(g);
      if (!g.s.flags.l12_row) g.flag('l12_row', { step: 0, face: DIRS[Math.floor(Math.random() * 3)] });
      g.say('花叢在這裡分成三條路。所有的向日葵都朝著同一個方向。');
    },
    draw(ctx, t, s, R) {
      ivy(ctx, R, R.hw, R.depth, t, 14);
      const face = s.flags.l12_row?.face || 'ahead';
      for (const d of DIRS) for (const [x, z] of ROW_FLOWERS[d]) sunflower(ctx, R, x, -0.4 + (z % 1) * 0.2, z, face, t);
      lilacs(ctx, R, -0.9, -0.3, 3.2, 5); lilacs(ctx, R, 0.9, -0.2, 3.6, 5);
    },
    hotspots: [
      BACK('l12_gate', '退回入口'),
      ...DIRS.map((d) => hit(`row_${d}`, DIR_RECT[d], DIR_NAME[d], (g) => {
        const r = g.s.flags.l12_row || { step: 0, face: 'ahead' };
        if (d !== r.face) {
          bloom(g);
          g.flag('l12_row', { step: 0, face: pick(DIRS, r.face) });
          return g.go('l12_rows', { msg: '你走錯了。花叢越來越密，你撥開最後一片葉子，又回到了三條路的分岔口——向日葵的臉，全都轉了個方向。' });
        }
        if (r.step + 1 >= ROW_STEPS) { g.flag('l12_row', null); return g.go('l12_heart', { msg: '向日葵帶你走到一片空地。這裡的花長得最好，好得不太自然。' }); }
        g.flag('l12_row', { step: r.step + 1, face: pick(DIRS, r.face) });
        g.go('l12_rows', { msg: '你跟著向日葵的臉走。下一個分岔口，它們又一起轉了方向。' });
      }, 'go')),
    ],
  },

  l12_heart: {
    level: '1.2', title: '花園的心', room: heartR, quiet: 0.3, hazard: bloomLabel, update: gardenTick,
    viewMsg: '觀景窗裡，那片人形的丁香花床在呼吸。',
    enter(g, { first }) {
      gardenEnter(g);
      if (first) g.say('空地中間有一片丁香花床，長成一個人躺著的形狀，連手指都有。旁邊放著一個植物學家的採集箱，箱子旁邊掉著幾張紙。');
    },
    draw(ctx, t, s, R) {
      ivy(ctx, R, R.hw, R.depth, t, 18);
      for (const [x, z] of [[-1.6, 3.6], [1.6, 3.4], [-0.6, 5.4], [0.7, 5.6]]) sunflower(ctx, R, x, -0.5, z, 'ahead', t);
      poly(ctx, bedQ, shade(R, '#3a4a2a', 3.6));
      // a person's shape, in lilacs
      const pts = [[-0.5, 3.2], [-0.5, 3.45], [-0.75, 3.6], [-0.25, 3.6], [-0.5, 3.8], [-0.5, 4.0], [-0.65, 4.3], [-0.35, 4.3], [-0.95, 3.75], [-0.05, 3.75]];
      for (const [x, z] of pts) lilacs(ctx, R, x, 0.95, z, 3);
      box(ctx, R, kit);
      paper(ctx, R, kitNote, 2, '#efe7cf');
    },
    hotspots: [
      { ...BACK('l12_gate', '回頭走'), click: (g) => g.go('l12_gate', { msg: '你回頭走。身後的向日葵一朵接一朵地轉過來，看著你離開。' }) },
      hit('kit', boxRect(kit, 6), '採集箱', (g) => {
        if (!once(g, 'l12_kit')) return g.say('採集箱裡只剩幾個空的種子袋，標籤上寫著日期和「勿帶出」。');
        g.give('lilac'); g.give('almond');
        g.say('採集箱裡有一瓶杏仁水，和一本植物圖鑑。圖鑑裡夾著一小枝壓乾的丁香，乾了很久，還是很香。');
      }),
      hit('note', bounds(kitNote, 6), '箱子旁邊的紙', (g) => g.read('n12_last')),
      hit('bed', bounds(bedQ, 4), '人形的花床', (g) => {
        g.say('你蹲下來看。花床底下的土，被壓出了一個人的形狀——是有人在這裡躺了很久，後來被拉走了。土裡還留著一根斷掉的指甲。');
        if (once(g, 'l12_bed')) g.sanity(-5);
      }),
    ],
  },

  // ---------- LEVEL 1.3 ----------
  l13_hall: {
    level: '1.3', title: '白色走廊', room: hallR, quiet: 0.5, hazard: () => '衰退・別碰牆上的洞',
    viewMsg: '觀景窗裡，牆上的灰斑在慢慢擴大，像墨水滴在紙上。',
    enter(g, { first }) {
      if (first) g.say('一條往左右延伸的白色走廊。這裡本來應該一塵不染——牆上的材質據說什麼都沾不上。現在牆上、地上，到處都是灰黑色的洞，洞的邊緣還在慢慢往外長。一張擔架停在走廊中間，上面蓋著白布。');
    },
    draw(ctx, t, s, R) {
      rot(ctx, R, HALL_ROT, t);
      poly(ctx, hallHole, '#0a0a0a');
      outline(ctx, hallHole, 'rgba(90,88,80,0.8)', 3);
      box(ctx, R, stretcher);
      const c = P(-0.85, 0.5, 4.9); ctx.fillStyle = shade(R, '#f4f6f5', 4.9);
      ctx.beginPath(); ctx.ellipse(c[0], c[1], 40, 9, 0, Math.PI, 0); ctx.fill();
      txt(ctx, '病房', P(-1.2, -0.72, 2.9)[0] + 26, P(-1.2, -0.72, 2.9)[1], shade(R, '#3a7a4a', 2.9), 12);
      txt(ctx, '排毒區 →', P(1.2, -0.72, 4.5)[0] - 34, P(1.2, -0.72, 4.5)[1], shade(R, '#3a7a4a', 4.5), 11);
    },
    hotspots: [
      { ...BACK('l1_alpha', '從切口退回 Level 1'), click: (g) => g.go('l1_alpha', { msg: '你擠出白牆的縫。身上沾了一點灰，你拍了很久才拍掉。' }) },
      hit('ward', bounds(wallQuad(-1.2, -0.6, 1, 2.4, 3.4)), '病房', (g) => g.go('l13_ward'), 'go'),
      hit('detox', bounds(wallQuad(1.2, -0.6, 1, 4.0, 5.0)), '排毒區', (g) => g.go('l13_detox'), 'go'),
      { ...hit('hole', bounds(hallHole, 8), '地上的洞', (g) => g.say('一個邊緣參差的洞，往下看不到底。洞口的白色材質變成了灰色，摸起來像濕的紙。'), 'look', {
        use: { line: (g) => { g.sanity(-2); g.say('你把一碼長的塑膠線垂進洞裡，數到十，拉回來。剩下不到一呎。斷口在冒泡。\n這就是衰退。'); } },
      }) },
      hit('stretcher', boxRect(stretcher, 6), '蓋著白布的擔架', (g) => {
        g.say('你沒有掀開白布。白布底下的形狀太多了，不像是一個人。布的邊緣，已經跟擔架長在一起了。');
        if (once(g, 'l13_body')) g.sanity(-5);
      }),
    ],
  },

  l13_ward: {
    level: '1.3', title: '臨時病房', room: wardR, quiet: 0.5,
    enter(g, { first }) { if (first) g.say('M.E.G. 在這裡搭過一間臨時醫院。病床還鋪著床單，點滴架歪在一邊，桌上的文件疊得整整齊齊——像是所有人在同一個下午，一起放下手上的事走了。'); },
    draw(ctx, t, s, R) {
      rot(ctx, R, [[-1.8, -0.2, 3.6, 0.3], [1.0, -1, 3.2, 0.25]], t);
      poly(ctx, supplyCab, shade(R, '#d8dedc', 5));
      outline(ctx, supplyCab, shade(R, '#8a9290', 5), 2);
      if (!s.flags.l13_cab) for (let i = 0; i < 3; i++) { const p = P(-1.15 + i * 0.22, -0.3, 4.99); ctx.fillStyle = shade(R, '#d8a040', 5); ctx.fillRect(p[0] - 3, p[1] - 6, 6, 10); }
      paper(ctx, R, memoQ, 5, '#f4f2e8');
      for (const b of wardBeds.slice().reverse()) box(ctx, R, b);
      paper(ctx, R, autopsyQ, 2.2, '#eef0e8');
      box(ctx, R, tray);
      if (!s.flags.l13_line) { const c = P(0.48, 0.5, 2.4); ctx.strokeStyle = shade(R, '#4a8ac8', 2.4); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(c[0], c[1] - 3, 14, 6, 0, 0, Math.PI * 2); ctx.stroke(); }
    },
    hotspots: [
      BACK('l13_hall', '回到走廊'),
      hit('autopsy', bounds(autopsyQ, 8), '夾在牆上的驗屍報告', (g) => g.read('n13_autopsy')),
      hit('memo', bounds(memoQ, 8), '貼在牆上的備忘錄', (g) => g.read('n13_memo')),
      hit('cabinet', bounds(supplyCab, 4), '藥品櫃', (g) => {
        if (!once(g, 'l13_cab')) return g.say('藥品櫃裡只剩空盒子。');
        g.give('pills'); g.give('almond');
        g.say('藥品櫃沒有上鎖。最上層還有一片鎮定劑和一瓶杏仁水，標籤是 M.E.G. 的。');
      }),
      { ...hit('line', boxRect(tray, 10), '托盤上的塑膠線', (g) => { g.flag('l13_line'); g.give('line', '托盤上有一捲藍色的塑膠線，剪成了一碼一碼的。旁邊的紙條寫著：「測試用。只測一個洞，然後撤。」'); }, 'take'), when: (s) => !s.flags.l13_line },
    ],
  },

  l13_detox: {
    level: '1.3', title: '排毒區', room: detoxR, quiet: 0.4, hazard: () => '衰退・只有一間可能還是乾淨的',
    viewMsg: (s) => (s.flags.l13_healed ? '觀景窗裡，三個門口都黑了。' : '觀景窗裡，三個門口看起來一模一樣。'),
    enter(g, { first }) {
      if (g.s.flags.l13_clean == null) g.flag('l13_clean', Math.floor(Math.random() * 3));
      if (first) g.say('三個門口，門框都貼著綠色膠帶。牌子上寫著「排毒區：傷病會迅速痊癒，過程可能不適」。門口裡面黑漆漆的，看不出地板還在不在。');
    },
    draw(ctx, t, s, R) {
      rot(ctx, R, [[-1.4, -0.7, 4.6, 0.35], [1.4, 0.5, 5.6, 0.4], [0.2, -1, 4.0, 0.3]], t);
      ZONES.forEach((zn, i) => {
        poly(ctx, zn.q, '#050505');
        outline(ctx, zn.q, '#3aa04a', 5);
        const [x, y, w, h] = bounds(zn.q);
        if (s.flags[`l13_t${i}`]) {
          if (i === cleanZone(s) && !s.flags.l13_healed) glow(ctx, x + w / 2, y + h / 2, Math.max(w, h) * 0.6, 'rgba(255,255,250,0.5)');
          else { ctx.fillStyle = 'rgba(90,88,80,0.6)'; ctx.fillRect(x, y + h * 0.7, w, h * 0.3); }
        }
        txt(ctx, 'ABC'[i], x + w / 2, y - 6, '#3aa04a', 12);
      });
    },
    hotspots: [
      BACK('l13_hall', '回到走廊'),
      ...ZONES.map((zn, i) => hit(zn.id, bounds(zn.q, 6), zn.name, (g) => {
        if (g.s.flags.l13_healed) return g.say('門口裡面只剩一片張著大口的深淵。你不會再把手伸進去了。');
        enterZone(g, i);
      }, 'go', { use: { line: (g) => (g.s.flags.l13_healed ? g.say('不用再測了。三個都一樣了。') : lineTest(g, i)) } })),
    ],
  },

  // ---------- LEVEL 1.5 ----------
  l15_window: {
    level: '1.5', title: '窗戶的另一邊', room: window15R,
    viewMsg: '觀景窗裡，畫面是上下顛倒的。你把攝影機倒過來拿——畫面還是顛倒的。',
    enter(g, { first }) {
      if (first) g.say('你翻過窗台，落在一條走廊裡。燈管開著——黑暗從燈管裡流出來，像水一樣往下淌；牆和地板反而自己在發亮。沒有嗡嗡聲。只有很遠很遠的地方，有人在低聲說話。');
    },
    draw(ctx, t, s, R) {
      hangingChair(ctx, R, 0.4, 3.0); hangingChair(ctx, R, -0.9, 4.6);
      poly(ctx, paintedWindow, shade(R, '#5a5a62', 2.5));
      const [x, y, w, h] = bounds(paintedWindow);
      seg(ctx, [x + w / 2, y], [x + w / 2, y + h], shade(R, '#1a1a1e', 2.5), 3);
      seg(ctx, [x, y + h / 2], [x + w, y + h / 2], shade(R, '#1a1a1e', 2.5), 3);
      paper(ctx, R, logQ, 2.4, '#d8d4c8');
      for (const z of R.lights) { const c = P(0, -1, z + 0.2); ctx.fillStyle = 'rgba(255,248,230,0.25)'; ctx.beginPath(); ctx.moveTo(c[0] - 30, c[1]); ctx.lineTo(c[0] + 30, c[1]); ctx.lineTo(c[0] + 80, c[1] + 140 / z * 2); ctx.lineTo(c[0] - 80, c[1] + 140 / z * 2); ctx.fill(); }
    },
    drawOver(ctx) { invert(ctx); },
    hotspots: [
      hit('window', bounds(paintedWindow, 6), '你爬進來的窗戶', (g) => {
        g.say('窗戶是畫上去的。油漆還沒乾，在你的指尖上留下一片陽光的顏色。\n易於進入，難於離開。');
        if (once(g, 'l15_painted')) g.sanity(-5);
      }),
      hit('log', bounds(logQ, 10), '地上的紙', (g) => g.read('n15_log')),
      { ...FORWARD('l15_halls', '往低語聲的方向走'), click: (g) => { g.flag('l15_nav', null); g.go('l15_halls'); } },
    ],
  },

  l15_halls: {
    level: '1.5', title: '顛倒的走廊', room: halls15R,
    viewMsg: '觀景窗裡，每一條路的盡頭都站著人。最安靜的那一條路上，站得最多。',
    enter(g) {
      navState(g);
      g.say('三個方向都有低語聲。有的響，有的輕。');
    },
    draw(ctx, t, s, R) {
      hangingChair(ctx, R, -1.6, 3.4); hangingChair(ctx, R, 1.2, 4.2);
      const nav = s.flags.l15_nav || { loud: 'ahead', quiet: 'left' };
      navNow = s.flags.l15_nav || null;
      for (const d of DIRS) {
        const k = loudness(nav, d), [x, y, z] = WHISPER_AT[d], p = P(x, y, z);
        const size = { loud: 26, mid: 15, quiet: 8 }[k], a = { loud: 0.95, mid: 0.6, quiet: 0.3 }[k];
        for (let i = 0; i < 3; i++) txt(ctx, '……來……', p[0] + Math.sin(t * 2 + i * 2) * 10, p[1] + (i - 1) * size * 1.2, `rgba(235,235,240,${a * (0.6 + 0.4 * Math.sin(t * 3 + i))})`, size);
      }
    },
    drawOver(ctx) { invert(ctx); },
    hotspots: [
      { ...BACK('l15_window', '退回窗戶那裡'), click: (g) => { g.flag('l15_nav', null); g.go('l15_window'); } },
      ...DIRS.map((d) => ({
        id: `whisper_${d}`, rect: DIR_RECT[d], cursor: 'go',
        get label() { return navNow ? `${DIR_NAME[d]}・${LOUD_LABEL[loudness(navNow, d)]}` : DIR_NAME[d]; },
        click: (g) => whisperStep(g, d),
      })),
    ],
  },

  l15_mother: {
    level: '1.5', title: '溫暖的走廊', room: motherR, quiet: 0.15,
    trap: { after: 7, run: (g) => { g.flag('l15_pulls', 0); g.scare('l15_window', '牆貼了上來。很溫暖，很軟，像是終於被誰抱住了——你用盡全身的力氣掙開，一路跑回那扇畫出來的窗戶底下。', 30, 'figure'); } },
    enter(g) { g.say('這裡不顛倒了。牆是暖的、濕的，一下一下地跳動。走廊的盡頭，有一個很大的東西張開了手臂。它說：回家了。'); },
    draw(ctx, t, s, R) {
      const k = Math.sin(t * 2.4);
      for (const sd of [-1, 1]) for (let i = 0; i < 8; i++) {
        const z = 1.3 + i * 0.7, p = P(sd * (R.hw - 0.05 * k), -0.2 + (i % 3) * 0.3, z), r = (0.25 + 0.04 * k) * 480 / z;
        ctx.fillStyle = shade(R, i % 2 ? '#8a2a2c' : '#a03a3a', z, 1, 0.7);
        ctx.beginPath(); ctx.ellipse(p[0], p[1], r * 0.4, r, 0, 0, Math.PI * 2); ctx.fill();
      }
      const c = P(0, 0, 6.6), r = 70 + 10 * k;
      ctx.fillStyle = `rgba(20,2,4,${0.8 + 0.1 * k})`;
      ctx.beginPath(); ctx.ellipse(c[0], c[1], r, r * 1.6, 0, 0, Math.PI * 2); ctx.fill();
      for (const sd of [-1, 1]) seg(ctx, [c[0] + sd * r * 0.8, c[1] - r * 0.4], [c[0] + sd * r * 2.6, c[1] - r * (0.2 + 0.1 * k)], 'rgba(20,2,4,0.85)', 14);
    },
    hotspots: [
      { id: 'back', rect: [330, 470, 300, 70], label: '掙脫，往回跑', cursor: 'back', click: (g) => { g.flag('l15_pulls', 0); g.flag('l15_nav', null); g.sanity(-6); g.go('l15_halls', { msg: '你扯開黏在手臂上的東西，頭也不回地跑。身後有人在叫一個名字——你很確定，那是你的名字。' }); } },
    ],
  },

  l15_thin: {
    level: '1.5', title: '牆很薄的地方', room: thinR,
    enter(g, { first }) { if (first) g.say('低語聲吵得你耳朵發疼，可是這裡一個人都沒有。右邊的牆在閃，一下是發亮的白，一下是你熟悉的、潮濕的水泥灰。'); },
    draw(ctx, t, s, R) {
      hangingChair(ctx, R, -0.7, 3.2);
      const on = Math.sin(t * 5) > 0.2;
      poly(ctx, seam, on ? shade(R, '#3a3a42', 3.1) : '#9a9c98');
      outline(ctx, seam, 'rgba(255,255,255,0.4)', 2);
      paper(ctx, R, jhNote, 5, '#d8d4c8');
      if (!s.flags.l15_almond) { const p = P(-0.9, 1, 2.4); bottle(ctx, R, p[0], p[1], 40, 2.4); }
    },
    drawOver(ctx) { invert(ctx); },
    hotspots: [
      hit('seam', bounds(seam, 4), '在閃的牆', (g) => {
        g.flag('l15_nav', null); g.flag('l15_pulls', 0); g.flag('l1_fresh', 'inverted'); g.flag('l15_out');
        g.go('l1_arrive', { msg: '你等牆閃成水泥色的那一瞬間，整個人撞了上去。' });
      }, 'go'),
      hit('note', bounds(jhNote, 10), '牆上的紙條', (g) => g.read('n15_jh')),
      { ...hit('almond', [P(-0.9, 1, 2.4)[0] - 22, P(-0.9, 1, 2.4)[1] - 50, 44, 56], '地上的瓶子', (g) => { g.flag('l15_almond'); g.give('almond', '一瓶杏仁水。瓶子裡的水是黑的——你拿起來，它才變回透明。'); }, 'take'), when: (s) => !s.flags.l15_almond },
    ],
  },
};
