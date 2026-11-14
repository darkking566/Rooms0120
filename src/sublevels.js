// Playable adaptations of five Backrooms Wiki articles (Chinese translations, CC BY-SA 3.0):
//   Level 0.1 "Zenith Station" (CutTheBirch), Level 0.2 "Remodeled Mess" (PandaShark71004),
//   Level 0.3 "Ice Rooms" (CursedSliver),
//   Level 0.5 "Drenched Sanatorium" (FuneralBouncer), Level 0.7 "The Reminiscence District" (T-Dragon).
// Credits are in README.md and the in-game footer. Puzzles, scene text and J.H. notes are original.
import { P, W, H, bounds, wallQuad, faceQuad, poly, seg, box, boxRect, paper, shade, drawSmiler } from './render.js';

export const SUBLEVELS = {
  '0.1': { name: 'LEVEL 0.1', sub: '天頂站', drain: 1, thirst: 1.5, hunger: 1 },
  '0.3': { name: 'LEVEL 0.3', sub: '冰室', drain: 1.5, thirst: 1.2, hunger: 1.6 },
  '0.5': { name: 'LEVEL 0.5', sub: '淵閉療舍', drain: 2.5, thirst: 2.5, hunger: 1.4 },
  '0.7': { name: 'LEVEL 0.7', sub: '憶域', drain: 2, thirst: 2, hunger: 1.5 },
};

// ---------- shared helpers ----------
const pal = (wall, ceil, floor, fog, light) => ({ wall, ceil, floor, fog, light });
const room = (palette, extra = {}) => ({ hw: 1.2, depth: 8, fogEnd: 12, pal: palette, lights: [1.8, 3.8, 6], ...extra });
const back = (to, label = '往回走', msg = null) => ({ id: 'back', rect: [330, 470, 300, 70], label, cursor: 'back', click: (g) => g.go(to, msg ? { msg } : {}) });
const hit = (id, rect, label, click, cursor = 'look', extra = {}) => ({ id, rect, label, cursor, click, ...extra });
const once = (g, flag) => { if (g.s.flags[flag]) return false; g.flag(flag); return true; };
const clockOf = (s) => s.clock || 0;

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
// Darkness with soft holes where light falls: [[x, y, r], ...]
let darkCv = null;
function darkness(ctx, alpha, holes) {
  if (!darkCv) { darkCv = document.createElement('canvas'); darkCv.width = W; darkCv.height = H; }
  const d = darkCv.getContext('2d');
  d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, W, H);
  d.fillStyle = `rgba(0,0,0,${alpha})`; d.fillRect(0, 0, W, H);
  d.globalCompositeOperation = 'destination-out';
  for (const [x, y, r] of holes) {
    const gr = d.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    d.fillStyle = gr; d.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.drawImage(darkCv, 0, 0);
}
// The "no signal" material that seals exits in Level 0.7 (and the station's torn hull in 0.1).
function tvStatic(ctx, pts, t, bars = true) {
  ctx.save(); poly(ctx, pts); ctx.clip();
  const [x, y, w, h] = bounds(pts);
  if (bars) {
    const cols = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
    const jitter = Math.random() < 0.15 ? (Math.random() - 0.5) * w * 0.3 : 0;
    cols.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x + jitter + (i * w) / 7, y, w / 7 + 1, h * 0.72); });
    ctx.fillStyle = '#101018'; ctx.fillRect(x, y + h * 0.72, w, h * 0.28);
    ctx.globalAlpha = 0.55;
  }
  for (let i = 0; i < 160; i++) {
    const v = (Math.random() * 255) | 0;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(x + Math.random() * w, y + Math.random() * h, 2 + Math.random() * 6, 1 + Math.random() * 2);
  }
  ctx.globalAlpha = 0.25; ctx.fillStyle = '#fff';
  const band = (t * 120) % (h + 40) - 20; ctx.fillRect(x, y + band, w, 6);
  ctx.restore();
}
function sliding(ctx, R, x1, y1, x2, y2, z, open, color) {
  const mid = (x1 + x2) / 2, half = (mid - x1) * (1 - open);
  poly(ctx, faceQuad(x1, y1, x2, y2, z), '#05080a');
  if (half > 0.01) {
    poly(ctx, faceQuad(x1, y1, x1 + half, y2, z), shade(R, color, z));
    poly(ctx, faceQuad(x2 - half, y1, x2, y2, z), shade(R, color, z, 0.92));
    seg(ctx, P(x1 + half, y1, z), P(x1 + half, y2, z), shade(R, '#1b2226', z), 2);
    seg(ctx, P(x2 - half, y1, z), P(x2 - half, y2, z), shade(R, '#1b2226', z), 2);
  }
  outline(ctx, faceQuad(x1, y1, x2, y2, z), shade(R, '#8a979c', z), 3);
}

// ---------- the B.N.T.G. walk to Level 0.1 (entrance) ----------
// Per the wiki you simply walk into Level 0.1, but Level 0 is too vast to stumble on it;
// only the B.N.T.G. has a reliable route. Here that route is their stencilled arrows, starting at
// a doorway on the pillar room's right wall.
const yellow = pal('#c8b35e', '#d6cc96', '#8f7d3b', '#2a2410', '#fff4c8');
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
const newMark = (g) => g.flag('l01_mark', Math.random() < 0.5 ? 'left' : 'right');
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

// =====================================================================
// LEVEL 0.3 — Ice Rooms
// Level 0, frozen. Vents breathe cold fog and hop from place to place. Task Force 104-CX was sent to
// make the rooms "clean, tidy, comfortable and warm". Their last report stops mid-sentence.
// =====================================================================
const ice = pal('#b9b896', '#d3dad6', '#8f9c97', '#17232c', '#eaf7ff');
const warmPal = pal('#d6bd70', '#e6dbb0', '#8e5634', '#3a2812', '#fff0c4');
function frostOverlay(ctx, t, s, strength = 1) {
  const k = (s.flags.l03_sealed ? 0.55 : 1) * strength;
  ctx.save();
  // frost creeping in from the edges of your vision
  const gr = ctx.createRadialGradient(480, 270, 180, 480, 270, 560);
  gr.addColorStop(0, 'rgba(200,235,255,0)'); gr.addColorStop(1, `rgba(215,240,255,${0.55 * k})`);
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = `rgba(235,250,255,${0.35 * k})`; ctx.lineWidth = 1;
  for (let i = 0; i < 26; i++) {
    const corner = i % 4, x0 = corner % 2 ? W : 0, y0 = corner < 2 ? 0 : H;
    const a = (i * 0.61) % (Math.PI / 2), len = 40 + (i * 37) % 90;
    const dx = corner % 2 ? -1 : 1, dy = corner < 2 ? 1 : -1;
    const ex = x0 + dx * Math.cos(a) * len, ey = y0 + dy * Math.sin(a) * len;
    seg(ctx, [x0, y0], [ex, ey], ctx.strokeStyle, 1);
    seg(ctx, [(x0 + ex) / 2, (y0 + ey) / 2], [(x0 + ex) / 2 + dx * 14, (y0 + ey) / 2 + dy * 4], ctx.strokeStyle, 1);
  }
  // drifting fog
  for (let i = 0; i < 7; i++) {
    const x = ((i * 173 + t * (14 + i * 3)) % (W + 300)) - 150, y = 330 + (i * 41) % 170;
    const f = ctx.createRadialGradient(x, y, 0, x, y, 140);
    f.addColorStop(0, `rgba(225,240,250,${0.13 * k})`); f.addColorStop(1, 'rgba(225,240,250,0)');
    ctx.fillStyle = f; ctx.fillRect(x - 140, y - 140, 280, 280);
  }
  ctx.restore();
}
function icicles(ctx, R, D, seed = 1) {
  for (let i = 0; i < 22; i++) {
    const x = -1.1 + ((i * 0.37 * seed) % 2.2), z = 1.4 + ((i * 1.31) % (D - 1.6));
    const len = 0.08 + ((i * 7) % 5) * 0.04;
    const a = P(x - 0.03, -1, z), b = P(x + 0.03, -1, z), c = P(x, -1 + len, z);
    poly(ctx, [a, b, c], shade(R, '#e6f6ff', z, 1.1, 0.85));
  }
}
function fogJet(ctx, x, y, dirX, dirY, t, k = 1) {
  for (let i = 0; i < 6; i++) {
    const p = ((t * 0.9 + i / 6) % 1);
    const px = x + dirX * p * 120, py = y + dirY * p * 120, r = 12 + p * 50;
    const f = ctx.createRadialGradient(px, py, 0, px, py, r);
    f.addColorStop(0, `rgba(235,248,255,${0.32 * (1 - p) * k})`); f.addColorStop(1, 'rgba(235,248,255,0)');
    ctx.fillStyle = f; ctx.fillRect(px - r, py - r, r * 2, r * 2);
  }
}
function grille(ctx, pts, color, slats = 5) {
  poly(ctx, pts, '#1d2a30');
  const [a, b, c, d] = pts;
  for (let i = 1; i < slats; i++) {
    const k = i / slats;
    seg(ctx, [a[0] + (d[0] - a[0]) * k, a[1] + (d[1] - a[1]) * k], [b[0] + (c[0] - b[0]) * k, b[1] + (c[1] - b[1]) * k], color, 2);
  }
  outline(ctx, pts, color, 2);
}
// translucent ice block with something inside it
function iceBox(ctx, R, b, alpha = 0.55) {
  const { x1, x2, y1, y2, z1, z2 } = b;
  const face = faceQuad(x1, y1, x2, y2, z1);
  ctx.save();
  if (x1 > 0) poly(ctx, wallQuad(x1, y1, y2, z1, z2), `rgba(170,215,235,${alpha * 0.8})`);
  if (x2 < 0) poly(ctx, wallQuad(x2, y1, y2, z1, z2), `rgba(170,215,235,${alpha * 0.8})`);
  if (y1 < 0) poly(ctx, [P(x1, y1, z1), P(x2, y1, z1), P(x2, y1, z2), P(x1, y1, z2)], `rgba(220,240,250,${alpha})`);
  poly(ctx, face, `rgba(185,225,240,${alpha})`);
  outline(ctx, face, 'rgba(240,252,255,0.8)', 2);
  const [fx, fy, fw, fh] = bounds(face);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(fx + fw * (0.1 + i * 0.2), fy + 4); ctx.lineTo(fx + fw * (0.2 + i * 0.17), fy + fh * (0.3 + (i % 3) * 0.2)); ctx.stroke(); }
  ctx.restore();
}
function worker(ctx, x, y, h, a = 0.8, name = '', turned = false) {
  const w = h * 0.24;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = '#23333b'; ctx.fillRect(x - w * 0.3, y - h * 0.45, w * 0.24, h * 0.45); ctx.fillRect(x + w * 0.06, y - h * 0.45, w * 0.24, h * 0.45);
  ctx.fillStyle = '#c8641e'; ctx.fillRect(x - w * 0.5, y - h * 0.82, w, h * 0.4);
  ctx.fillStyle = '#e8e070'; ctx.fillRect(x - w * 0.5, y - h * 0.62, w, h * 0.04);
  ctx.fillStyle = '#2e3d44'; ctx.beginPath(); ctx.ellipse(x, y - h * 0.9, w * 0.26, h * 0.08, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e2b52a'; ctx.beginPath(); ctx.ellipse(x, y - h * 0.95, w * 0.32, h * 0.05, 0, Math.PI, 0); ctx.fill();
  if (turned) { ctx.fillStyle = '#d8eef5'; ctx.fillRect(x - w * 0.14, y - h * 0.91, w * 0.08, h * 0.02); ctx.fillRect(x + w * 0.06, y - h * 0.91, w * 0.08, h * 0.02); }
  if (name) txt(ctx, name, x, y - h * 0.96, '#3a2a10', Math.max(7, h * 0.035));
  ctx.restore();
}
function coldTick(g, dt) {
  const f = g.s.flags;
  if (f.l03_done) return;
  f.l03_cold = (f.l03_cold || 0) + dt * (f.l03_sealed ? 0.5 : 1);
  if (f.l03_cold >= 2.5) { f.l03_cold -= 2.5; g.sanity(-1); }
}
const coldLabel = (s) => s.flags.l03_sealed ? '冷霧減弱了・仍然很冷' : '寒氣刺骨・冷霧不斷從通風口湧出';

// entry: a yellow room gone white
const iceEntryR = room(ice, { hw: 1.2, depth: 6, stripes: true, floorTex: 'carpet', tiles: true, lights: [1.8, 3.8] });
const entryBlock = { x1: 0.3, x2: 1.2, y1: -0.65, y2: 1, z1: 3.2, z2: 4.6 };
const ceilVent = [P(-0.35, -1, 2.2), P(0.35, -1, 2.2), P(0.35, -1, 2.8), P(-0.35, -1, 2.8)];

// 104-CX's work site
const campR = room(ice, { hw: 1.5, depth: 5.5, stripes: true, tiles: true, lights: [1.8, 3.6], openings: [{ side: -1, z1: 3.5, z2: 4.5, top: -0.6 }] });
const iceWall = faceQuad(-0.65, -0.75, 0.65, 1, 5.5);
const rugRoll = { x1: -1.45, x2: -0.75, y1: 0.68, y2: 1, z1: 2.0, z2: 2.4, color: '#8a3a2a', top: '#a5503a' };
const heaterBox = { x1: 0.8, x2: 1.35, y1: 0.45, y2: 1, z1: 2.3, z2: 2.8, color: '#c8641e', top: '#d8783a', edge: true };
const toolbox = { x1: -0.3, x2: 0.35, y1: 0.78, y2: 1, z1: 2.1, z2: 2.45, color: '#b33a2a', top: '#c8503a', edge: true };
const clipboard = wallQuad(-1.5, -0.45, 0.05, 2.6, 3.2);
const radioQ = faceQuad(-0.25, 0.62, -0.05, 0.78, 2.1);

// the vent room: one live vent that will not stay put
const ventsR = room(ice, { hw: 1.3, depth: 4, wallTex: 'concrete', floorTex: 'concrete', lights: [2.2], baseboard: false });
const VENTS = [
  [P(-0.3, -1, 2.0), P(0.3, -1, 2.0), P(0.3, -1, 2.6), P(-0.3, -1, 2.6)],
  wallQuad(-1.3, -0.8, -0.45, 1.9, 2.7),
  wallQuad(1.3, -0.8, -0.45, 2.3, 3.1),
  faceQuad(-0.35, -0.82, 0.35, -0.52, 4),
  wallQuad(1.3, 0.42, 0.85, 1.7, 2.4),
];
const VENT_LOW = 4;
const VENT_SEQ = [0, 3, 4, 1, 2, 4, 3, 0, 4, 2];
const VENT_DIR = [[0, 1], [1, 0.4], [-1, 0.4], [0, 0.6], [-1, -0.2]];
let ventState = { flags: {}, clock: 0 };
export const ventAt = (s) => (s.flags.l03_sealed ? VENT_LOW : VENT_SEQ[Math.floor(clockOf(s) / 2.4) % VENT_SEQ.length]);

// the block room
const blocksR = room(ice, { hw: 1.6, depth: 5, tiles: true, lights: [1.8, 3.6], stripes: true });
const blockA = { x1: -1.55, x2: -0.55, y1: -0.7, y2: 1, z1: 2.1, z2: 3.1 };
const blockB = { x1: 0.6, x2: 1.55, y1: -0.45, y2: 1, z1: 2.5, z2: 3.5 };
const backIce = faceQuad(-0.8, -0.85, 0.8, 1, 5);

// the finished room (safe)
const warmR = room(warmPal, { hw: 1.3, depth: 5, stripes: true, floorTex: 'carpet', tiles: true, lights: [1.8, 3.6] });
const chairs = [-0.75, -0.25, 0.25, 0.75].map((x) => ({ x, z: 3.6 }));
const finalPrint = faceQuad(-0.35, -0.55, 0.15, -0.05, 5);
const warmExit = wallQuad(1.3, -0.65, 1, 2.2, 3.2);

// =====================================================================
// LEVEL 0.5 — Drenched Sanatorium
// Below a blackout zone in Level 0: knee-deep brown water, sparking blue lamps, an echo that hurts.
// Then a rotting hospital, and the Drowned: slow, tireless, always knows where you are — and
// dissolves the moment it touches water.
// =====================================================================
const flood = pal('#b9ad86', '#2f3638', '#2a2619', '#05090a', '#79c4ff');
const planks = pal('#5d4b34', '#26231f', '#2a2619', '#050605', '#79c4ff');
const ward = pal('#8a9384', '#4d554e', '#3c3e31', '#0a0f0d', '#d4dcc0');
const wardFlick = (t) => (Math.sin(t * 11.7) + Math.sin(t * 3.3 + 2) > 1.7 ? 0.45 : 1);
function water(ctx, R, t, y = 0.55, hw = 1.2, D = 8) {
  const q = [P(-hw, y, 1), P(hw, y, 1), P(hw, y, D), P(-hw, y, D)];
  ctx.save(); poly(ctx, q, 'rgba(48,40,22,0.93)'); ctx.clip();
  for (let i = 0; i < 40; i++) {
    const z = 1.2 + ((i * 0.53 + t * 0.15) % (D - 1.2));
    const x = -hw + ((i * 0.71) % (hw * 2)), p = P(x, y, z), w = 60 / z;
    seg(ctx, [p[0] - w, p[1]], [p[0] + w, p[1]], i % 4 ? 'rgba(110,98,62,0.45)' : 'rgba(150,170,190,0.35)', 1);
  }
  // oily sheen
  for (let i = 0; i < 9; i++) {
    const z = 1.6 + (i * 0.8) % (D - 2), x = -0.9 + ((i * 0.63) % 1.8), p = P(x, y, z), r = 70 / z;
    const gr = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
    gr.addColorStop(0, 'rgba(180,120,200,0.18)'); gr.addColorStop(0.5, 'rgba(110,190,160,0.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr; ctx.save(); ctx.translate(p[0], p[1]); ctx.scale(1, 0.25); ctx.translate(-p[0], -p[1]);
    ctx.fillRect(p[0] - r, p[1] - r, r * 2, r * 2); ctx.restore();
  }
  ctx.restore();
  // a dark band where the walls go under
  for (const s of [-1, 1]) poly(ctx, wallQuad(s * hw, y, y + 0.03, 1, D), 'rgba(20,16,8,0.7)');
}
function blueLamp(ctx, x, y, z, t, k = 1, spark = false) {
  const top = P(x, -1, z), p = P(x, y, z), w = 90 / z, h = 14 / z;
  seg(ctx, top, p, '#121516', Math.max(1, 3 / z));
  const on = spark ? Math.random() < 0.5 : Math.sin(t * 7 + z * 3) > -0.9;
  ctx.fillStyle = on ? '#9fd8ff' : '#1d3440'; ctx.fillRect(p[0] - w / 2, p[1], w, h);
  if (on) glow(ctx, p[0], p[1] + h, 160 / z * k, 'rgba(110,190,255,0.45)');
  if (spark) for (let i = 0; i < 6; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * 30;
    seg(ctx, [p[0], p[1] + h], [p[0] + Math.cos(a) * r, p[1] + h + Math.abs(Math.sin(a)) * r], '#fff6b0', 1.5);
  }
}
function peel(ctx, R, D) {
  for (let i = 0; i < 14; i++) {
    const s = i % 2 ? 1 : -1, z = 1.5 + (i * 0.57) % (D - 2), y = -0.6 + ((i * 0.37) % 0.6);
    const a = P(s * 1.2, y, z), b = P(s * 1.2, y, z + 0.25), c = P(s * (1.2 - 0.12), y + 0.45, z + 0.12);
    poly(ctx, [a, b, c], shade(R, '#d8cfaa', z, 0.9));
    poly(ctx, wallQuad(s * 1.2, y, y + 0.3, z, z + 0.25), shade(R, '#6c5f45', z, 0.8));
  }
}
export function drawDrowned(ctx, x, y, s, t, a = 1) {
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s);
  // legs: a puddle sliding along the floor
  ctx.fillStyle = 'rgba(40,62,52,0.95)';
  ctx.beginPath(); ctx.ellipse(0, 0, 60 + Math.sin(t * 3) * 4, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.shadowColor = 'rgba(140,180,160,0.6)'; ctx.shadowBlur = 16;
  ctx.fillStyle = 'rgba(52,78,66,0.92)';
  ctx.beginPath();
  ctx.moveTo(-34, -4); ctx.bezierCurveTo(-40, -60, -30, -110, -18, -130); ctx.lineTo(20, -132);
  ctx.bezierCurveTo(32, -110, 42, -60, 36, -4); ctx.closePath(); ctx.fill();
  // arms reaching
  ctx.strokeStyle = 'rgba(58,86,72,0.92)'; ctx.lineWidth = 13; ctx.lineCap = 'round';
  const r = Math.sin(t * 1.5) * 6;
  ctx.beginPath(); ctx.moveTo(-20, -115); ctx.quadraticCurveTo(-62, -95 + r, -72, -60 + r); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(22, -115); ctx.quadraticCurveTo(64, -98 - r, 76, -66 - r); ctx.stroke();
  // a face that has slid down on one side
  ctx.fillStyle = 'rgba(66,96,82,0.95)';
  ctx.beginPath(); ctx.ellipse(2, -150, 24, 30, 0.25, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = '#0a1612';
  ctx.beginPath(); ctx.ellipse(-8, -158, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(10, -150, 4, 5, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(4, -134, 9, 4 + Math.abs(Math.sin(t * 2)) * 3, 0.3, 0, Math.PI * 2); ctx.fill();
  // drips
  ctx.fillStyle = 'rgba(70,100,86,0.8)';
  for (let i = 0; i < 4; i++) { const d = ((t * 40 + i * 30) % 120); ctx.fillRect(-30 + i * 20, -100 + d, 3, 6); }
  ctx.restore();
}
function huntTick(g, dt) {
  const f = g.s.flags;
  if (!f.l05_hunted || f.l05_dissolved) return;
  f.l05_pursuit = (f.l05_pursuit || 0) + dt;
  if (f.l05_pursuit >= 15) {
    f.l05_pursuit = 5; g.sfx('groan');
    g.scare('l05_platform', '濕冷的手臂從背後勒住你，滿嘴都是泥水的味道。你拚命掙脫，一路跑回積水邊的平台——它還在後面，咕嚕咕嚕地響。', 16, 'drowned');
  }
}
const huntLabel = (s) => (s.flags.l05_hunted && !s.flags.l05_dissolved ? '溺屍在追你・停下來它就會追上' : null);
function chaseStep(g) {
  const f = g.s.flags;
  if (f.l05_hunted && !f.l05_dissolved) f.l05_pursuit = Math.max(0, (f.l05_pursuit || 0) - 4);
}
function drawChaser(ctx, s, t) {
  if (!s.flags.l05_hunted || s.flags.l05_dissolved) return;
  const p = Math.min(1, (s.flags.l05_pursuit || 0) / 15);
  const z = 7 - p * 5, f = P(-0.2, 1, z);
  drawDrowned(ctx, f[0], f[1], 3.2 / z, t, 0.55 + p * 0.45);
}
function dissolve(g) {
  g.flag('l05_dissolved'); g.flag('l05_hunted', false); g.flag('l05_pursuit', 0); g.sfx('steam');
}

const floodR = room(flood, { hw: 1.2, depth: 8, stripes: true, lights: [], baseboard: false });
const diaryQ = [P(-0.75, 0.55, 2.2), P(-0.4, 0.55, 2.2), P(-0.4, 0.55, 2.7), P(-0.75, 0.55, 2.7)];
const planksR = room(planks, { hw: 1.2, depth: 7, lights: [], baseboard: false, wallTex: 'concrete' });
const cart = { x1: -1.15, x2: -0.55, y1: 0.15, y2: 0.55, z1: 2.4, z2: 3.2, color: '#9a9488', top: '#b6b0a2', edge: true };
const sparkCycle = (s) => clockOf(s) % 3.2;
export const sparking = (s) => sparkCycle(s) < 1.2;
const platformR = room(flood, { hw: 1.2, depth: 7, stripes: true, lights: [], baseboard: false });
const platformTop = { x1: -1.2, x2: 1.2, y1: 0.25, y2: 0.6, z1: 3.2, z2: 7, color: '#7c7a6e', top: '#8f8d80' };
const wardDoors = faceQuad(-0.6, -0.7, 0.6, 0.25, 7);
const wardR = room(ward, { hw: 1.5, depth: 6, wallTex: 'concrete', floorTex: 'concrete', lights: [2, 4], flick: wardFlick, flickerLights: [1] });
const beds = [
  { x1: -1.5, x2: -0.8, y1: 0.5, y2: 0.7, z1: 1.8, z2: 3.0, color: '#b8b49a', top: '#c9c3a2', edge: true },
  { x1: 0.8, x2: 1.5, y1: 0.5, y2: 0.7, z1: 2.2, z2: 3.4, color: '#b8b49a', top: '#c9c3a2', edge: true },
  { x1: -1.5, x2: -0.8, y1: 0.5, y2: 0.7, z1: 3.8, z2: 5.0, color: '#a49f86', top: '#b5ae8e', edge: true },
];
const medCart = { x1: 0.85, x2: 1.35, y1: 0.35, y2: 1, z1: 4.0, z2: 4.5, color: '#9aa39c', top: '#b9c2bb', edge: true };
const corridorR = room(ward, { hw: 1.2, depth: 8, wallTex: 'concrete', floorTex: 'concrete', lights: [2.2, 5], flick: wardFlick, flickerLights: [0] });
const stairsR = room(ward, { hw: 1.2, depth: 5, lights: [2.2], wallTex: 'concrete' });

// =====================================================================
// LEVEL 0.7 — The Reminiscence District
// A time bubble that keeps every past version of Level 0. Walk deeper and the lights get older:
// fluorescent tubes, then bulbs and candles, castle torches, Roman marble, Egyptian stone.
// Every exit is sealed by something like a "no signal" screen; the way out is the way you came.
// Sleeping without cover moves you — towards whatever era you carry.
// =====================================================================
const old = pal('#b0904a', '#6e5a33', '#5e4825', '#1a1207', '#ffcf80');
const gilt = pal('#9a7b3e', '#120d06', '#4f3b1d', '#110b04', '#ffd890');
const keep = pal('#a08b4c', '#3a2f1a', '#4a3c22', '#040302', '#ffb347');
const marble = pal('#d8cfb2', '#1a1710', '#a89f86', '#2a2416', '#fff0c8');
const sand = pal('#b8984f', '#3a2a12', '#6e5630', '#0b0702', '#ffbe6a');
const candleFlick = (t) => 0.92 + 0.08 * Math.sin(t * 13) * Math.sin(t * 7.7);
function damask(ctx, R, hw, D, color) {
  for (const s of [-1, 1]) for (let z = 1.4; z < D; z += 0.55) for (const y of [-0.55, 0, 0.55]) {
    const c = P(s * hw, y, z), r = 9 / z * 2.4;
    ctx.save(); ctx.translate(c[0], c[1]); ctx.scale(1 / z * 1.6, 1);
    ctx.strokeStyle = shade(R, color, z, 1, 0.6); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(0, -r * 2); ctx.quadraticCurveTo(r, 0, 0, r * 2); ctx.quadraticCurveTo(-r, 0, 0, -r * 2); ctx.stroke();
    ctx.restore();
  }
}
function bulb(ctx, R, x, z, t) {
  const top = P(x, -1, z), p = P(x, -0.62, z), r = 9 / z * 2;
  seg(ctx, top, p, '#2a2014', Math.max(1, 2 / z));
  ctx.fillStyle = '#fff1c0'; ctx.beginPath(); ctx.arc(p[0], p[1] + r, r, 0, Math.PI * 2); ctx.fill();
  glow(ctx, p[0], p[1] + r, 150 / z, 'rgba(255,190,90,0.5)', candleFlick(t + z));
}
function candle(ctx, R, x, y, z, t, k = 1) {
  const p = P(x, y, z), w = 6 / z * 2, h = 26 / z * 2;
  ctx.fillStyle = shade(R, '#efe4c4', z); ctx.fillRect(p[0] - w / 2, p[1] - h, w, h);
  const fl = 1 + Math.sin(t * 17 + z * 5) * 0.15;
  ctx.fillStyle = '#ffd36a'; ctx.beginPath(); ctx.ellipse(p[0], p[1] - h - 5 / z * 2 * fl, w * 0.45, 8 / z * 2 * fl, 0, 0, Math.PI * 2); ctx.fill();
  glow(ctx, p[0], p[1] - h - 6, 90 / z * 2 * k, 'rgba(255,170,60,0.55)', candleFlick(t + x));
}
function torch(ctx, R, x, y, z, t) {
  const p = P(x, y, z), s = 2 / z;
  seg(ctx, [p[0], p[1]], [p[0] + (x < 0 ? 14 : -14) * s, p[1] + 40 * s], shade(R, '#3b2a14', z), Math.max(2, 7 * s));
  const fl = 1 + Math.sin(t * 19 + x * 4) * 0.2;
  ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.ellipse(p[0], p[1] - 10 * s * fl, 10 * s, 20 * s * fl, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff0b0'; ctx.beginPath(); ctx.ellipse(p[0], p[1] - 6 * s, 4 * s, 9 * s, 0, 0, Math.PI * 2); ctx.fill();
  glow(ctx, p[0], p[1] - 10 * s, 260 * s, 'rgba(255,150,50,0.55)', candleFlick(t + x * 3));
  return [p[0], p[1] - 10 * s, 330 * s];
}
function stoneBlocks(ctx, R, hw, D, color) {
  for (const s of [-1, 1]) {
    for (let y = -0.75; y < 1; y += 0.25) seg(ctx, P(s * hw, y, 1), P(s * hw, y, D), shade(R, color, 3, 0.7, 0.6), 1);
    for (let z = 1.2; z < D; z += 0.45) for (let y = -1; y < 1; y += 0.5) seg(ctx, P(s * hw, y + ((z * 4) % 2 > 1 ? 0.25 : 0), z), P(s * hw, y + 0.25 + ((z * 4) % 2 > 1 ? 0.25 : 0), z), shade(R, color, z, 0.7, 0.5), 1);
  }
}
function glyphs(ctx, x, y, w, h, color, special = false) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  const rows = Math.max(2, Math.floor(h / 22)), cols = Math.max(3, Math.floor(w / 18));
  const sz = Math.min(12, (w - 12) / cols - 4);
  if (sz >= 3) for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const gx = x + 6 + c * (w - 12) / cols, gy = y + 6 + r * (h - 12) / rows, k = (r * 7 + c * 13) % 6;
    ctx.beginPath();
    if (k === 0) { ctx.arc(gx + sz / 2, gy + sz / 2, sz / 2.5, 0, Math.PI * 2); }
    else if (k === 1) { ctx.moveTo(gx, gy + sz); ctx.lineTo(gx + sz / 2, gy); ctx.lineTo(gx + sz, gy + sz); }
    else if (k === 2) { ctx.moveTo(gx + sz / 2, gy); ctx.lineTo(gx + sz / 2, gy + sz); ctx.moveTo(gx, gy + sz / 3); ctx.lineTo(gx + sz, gy + sz / 3); }
    else if (k === 3) { ctx.ellipse(gx + sz / 2, gy + sz / 2, sz / 2, sz / 4, 0, 0, Math.PI * 2); ctx.moveTo(gx + sz / 2, gy + sz / 4); ctx.lineTo(gx + sz / 2, gy + sz); }
    else if (k === 4) { ctx.moveTo(gx, gy); ctx.quadraticCurveTo(gx + sz, gy + sz / 2, gx, gy + sz); }
    else { ctx.rect(gx + 2, gy + 2, sz - 4, sz - 4); }
    ctx.stroke();
  }
  if (special) {
    // among the glyphs: a figure holding a box to its eye, and four marks you can read
    const sx = x + w * 0.62, sy = y + h * 0.3;
    ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2); ctx.moveTo(sx, sy + 5); ctx.lineTo(sx, sy + 26);
    ctx.moveTo(sx, sy + 12); ctx.lineTo(sx - 10, sy + 6); ctx.moveTo(sx, sy + 26); ctx.lineTo(sx - 6, sy + 38); ctx.moveTo(sx, sy + 26); ctx.lineTo(sx + 6, sy + 38); ctx.stroke();
    ctx.strokeRect(sx - 18, sy - 2, 9, 7);
    ctx.font = 'bold 13px monospace'; ctx.fillStyle = color; ctx.textAlign = 'center';
    ctx.fillText('0 1 2 0', sx + 2, sy + 56);
  }
  ctx.restore();
}
export function drawGrowler(ctx, x, y, s, a = 1, t = 0) {
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s);
  for (const side of [-1, 1]) {
    ctx.save(); ctx.translate(side * 26, 0);
    ctx.fillStyle = '#e8d24a'; ctx.shadowColor = '#e8d24a'; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.ellipse(0, 0, 14, 9, side * -0.15, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = '#0b0702';
    const blink = Math.sin(t * 0.7) > 0.97 ? 0.1 : 1;
    ctx.beginPath(); ctx.ellipse(0, 0, 2.6, 8 * blink, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // a grin that is not quite a smile: lion's canines
  ctx.fillStyle = '#efe6cc'; ctx.shadowColor = '#efe6cc'; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.moveTo(-48, 34); ctx.quadraticCurveTo(0, 60, 48, 34); ctx.quadraticCurveTo(0, 48, -48, 34); ctx.fill();
  for (const side of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(side * 22, 40); ctx.lineTo(side * 16, 41); ctx.lineTo(side * 19, 66); ctx.fill();
  }
  ctx.restore();
}

const modernR = room(yellow, { stripes: true, floorTex: 'carpet', tiles: true, lights: [1.8, 3.8, 6], backDoor: { x1: -0.5, x2: 0.5, top: -0.6 } });
const staticDoor = wallQuad(-1.2, -0.62, 1, 2.2, 3.2);
const outletQ = wallQuad(1.2, 0.6, 0.76, 1.9, 2.15);
const bulbsR = room(old, { hw: 1.2, depth: 8, stripes: false, floorTex: 'carpet', lights: [], fogEnd: 9, flick: candleFlick });
const peelQ = wallQuad(-1.2, -0.3, 0.3, 2.4, 3.0);
const rucksack = { x1: -1.0, x2: -0.45, y1: 0.62, y2: 1, z1: 2.2, z2: 2.6, color: '#5b5a3a', top: '#6e6d48', edge: true };
const riftQ = wallQuad(1.2, -0.62, 1, 3.4, 4.4);
const hallR = room(gilt, { hw: 1.4, depth: 8, lights: [], baseboard: true, fogEnd: 10, flick: candleFlick, openings: [{ side: 1, z1: 3.4, z2: 4.4, top: -0.55 }] });
const tapestry = wallQuad(-1.4, -0.75, 0.45, 1.9, 3.3);
const voiceDoor = wallQuad(1.4, -0.55, 1, 3.4, 4.4);
const castleR = room(keep, {
  hw: 1.2, depth: 6, lights: [], baseboard: false, fogEnd: 7,
  openings: [{ side: -1, z1: 2.1, z2: 3.0, top: -0.45 }, { side: 1, z1: 2.5, z2: 3.4, top: -0.45 }],
});
const archAhead = faceQuad(-0.45, -0.45, 0.45, 1, 6);
const archLeft = wallQuad(-1.2, -0.45, 1, 2.1, 3.0);
const archRight = wallQuad(1.2, -0.45, 1, 2.5, 3.4);
const ARCH = { left: archLeft, right: archRight, ahead: archAhead };
const TORCH_AT = { left: [-1.18, -0.55, 1.75], right: [1.18, -0.55, 2.2], ahead: [0.62, -0.55, 5.95] };
export const CASTLE_STEPS = 2;
const romeR = room(marble, { hw: 2.6, depth: 9, lights: [], baseboard: true, fogEnd: 11 });
const columns = [];
for (const s of [-1, 1]) for (const z of [2.6, 4.6, 6.6, 8.4]) columns.push({ x: s * 1.9, z });
const statueBox = { x1: -1.3, x2: -0.5, y1: 0.55, y2: 1, z1: 7.2, z2: 8.0, color: '#cfc5a6', top: '#e0d8bd', edge: true };
const planeQ = [P(-2.5, 0.85, 3.0), P(-1.0, 0.95, 2.6), P(-0.9, 1, 3.4), P(-2.4, 0.95, 3.9)];
const egyptR = room(sand, { hw: 1.2, depth: 6, lights: [], baseboard: false, fogEnd: 7, openings: [{ side: 1, z1: 4.2, z2: 5.2, top: -0.4 }] });
const carving = wallQuad(-1.2, -0.7, 0.55, 1.8, 3.6);
const alcove = wallQuad(1.2, -0.4, 1, 2.4, 3.2);
const deepQ = faceQuad(-0.5, -0.5, 0.5, 1, 6);
export const growlerT = (sceneT) => Math.max(0, Math.min(1, (sceneT - 3) / 9));

// --- night terrors: sleeping without a roof over your head moves you; what you carry decides where
function sleepHere(g) {
  if (g.has('outlet')) {
    return g.go('l07_modern', { free: true, msg: '你在壁龕裡蜷起身，手裡攥著那塊米色的插座面板。閉上眼的一瞬間，你好像看見走廊在你周圍飛快地換著樣子——醒來時，頭頂是嗡嗡作響的日光燈。' });
  }
  g.flag('l07_rift');
  g.sanity(-6);
  g.go('l07_bulbs', { free: true, msg: '你在壁龕裡躺下，什麼都沒想。醒來時，你躺在蠟燭和燈泡的交界處，渾身發冷。身旁的牆變了——那是一面像電視雜訊一樣閃爍的牆，正在輕輕地把你往裡拽。' });
}

// ================= Level 0.2 "Remodeled Mess" =================
// A remodelled stretch of Level 0: dry carpet, fresh paint, working outlets, even a restroom.
// Touch the remodelling company's tools and it all comes down to a half-built wooden house; the
// collapse only stops at the door back to Level 0, and next time it is all good as new.
const fresh = pal('#ece4c4', '#f6f2e2', '#a8a07a', '#2e2a1c', '#fffbea');
const frame = pal('#8a7050', '#3e3122', '#76603f', '#0c0905', '#ffe2b0');
const shaky = (t) => (Math.sin(t * 13.1) + Math.sin(t * 7.3 + 1) + Math.sin(t * 29.7) > 2.2 ? 0.5 : 0.94 + 0.06 * Math.sin(t * 31));
const freshHallR = room(fresh, { hw: 1.6, depth: 6, fogEnd: 14, tiles: true, floorTex: 'carpet', lights: [1.8, 3.6, 5.4] });
const wcR = room(pal('#e6ecee', '#f4f6f6', '#c8d0d2', '#1c2224', '#f4fbff'), { hw: 1.2, depth: 3.5, fogEnd: 12, tiles: true, floorTex: 'concrete', lights: [1.9] });
const officeR = room(pal('#e4dcc0', '#f2eedc', '#8e8a7a', '#26241c', '#fff8e6'), { hw: 1.6, depth: 4.5, fogEnd: 12, tiles: true, floorTex: 'carpet', lights: [2.2] });
const frameR = room(frame, { hw: 1.6, depth: 5, fogEnd: 9, floorTex: 'concrete', baseboard: false, lights: [1.8], flickerLights: [0], flick: shaky });
const joistR = room(frame, { hw: 1.6, depth: 6, fogEnd: 9, floorTex: 'concrete', baseboard: false, lights: [4.8], flickerLights: [0], flick: shaky });
const exitR = room(frame, { hw: 1.6, depth: 4, fogEnd: 10, floorTex: 'concrete', baseboard: false, lights: [2.0], flick: shaky });

export const L02_COLLAPSE = 40; // seconds from the first falling wall to the house coming down
export const tileFalling = (s) => clockOf(s) % 2.8 < 1.0;
const l02Left = (s) => Math.max(0, Math.ceil((s.flags.l02_until || 0) - clockOf(s)));

// Everything resets when you leave: the next visit finds the rooms as good as new.
function restoreL02(g) {
  for (const k of ['l02_collapsed', 'l02_mask', 'l02_sink', 'l02_towel', 'l02_until', 'l02_crack']) g.flag(k, false);
}
function collapse(g, msg) {
  g.flag('l02_collapsed'); g.flag('l02_seen');
  g.flag('l02_until', clockOf(g.s) + L02_COLLAPSE);
  g.flag('l02_crack', Math.random() < 0.5 ? 'left' : 'right');
  g.sfx('open');
  g.go('l02_frame', { free: true, msg });
}
function collapseTick(g, dt) {
  const f = g.s.flags;
  if (!f.l02_collapsed) return;
  if (clockOf(g.s) >= f.l02_until) {
    restoreL02(g); g.sanity(-15); g.sfx('thud');
    return g.go('l0_dry', { free: true, msg: '頭頂的橫樑斷了，整棟房子朝你壓下來——你被一股力量甩出門外，摔回了乾燥的走廊。身上全是木屑。' });
  }
  // the dust: a wet paper towel over your mouth helps a lot
  f.l02_dust = (f.l02_dust || 0) + dt * (f.l02_mask ? 0.3 : 1);
  if (f.l02_dust >= 2) { f.l02_dust -= 2; g.sanity(-1); }
}
const collapseLabel = (s) => (s.flags.l02_collapsed
  ? `房子在崩塌・還剩 ${l02Left(s)} 秒${s.flags.l02_mask ? '・濕紙巾擋住了灰塵' : '・灰塵嗆得你一直咳'}` : null);
function leaveFrame(g, msg) { restoreL02(g); g.go('l0_dry', { free: true, msg }); }

function studs(ctx, R) {
  for (const sd of [-1, 1]) {
    for (let z = 1.2; z < R.depth; z += 0.45) seg(ctx, P(sd * R.hw, -1, z), P(sd * R.hw, 1, z), shade(R, '#b89a6a', z), Math.max(2, 9 / z));
    seg(ctx, P(sd * R.hw, 0, 1), P(sd * R.hw, 0, R.depth), shade(R, '#b89a6a', 2.5), 3);
  }
  for (let x = -R.hw; x <= R.hw; x += 0.4) seg(ctx, P(x, -1, 1), P(x, -1, R.depth), shade(R, '#6b5434', 2.5), 3);
}
function dust(ctx, t, n = 30, a = 0.5) {
  ctx.fillStyle = `rgba(220,200,160,${a})`;
  for (let i = 0; i < n; i++) { const x = (i * 97 + Math.sin(t + i) * 20) % W, y = (t * (90 + (i % 5) * 20) + i * 53) % H; ctx.fillRect(x, y, 2, 2); }
  ctx.fillStyle = 'rgba(200,180,140,0.07)'; ctx.fillRect(0, 0, W, H);
}
function cassette(ctx, R, b) {
  box(ctx, R, b);
  const c = P((b.x1 + b.x2) / 2, b.y1, (b.z1 + b.z2) / 2);
  ctx.fillStyle = shade(R, '#e9e1c1', b.z1); ctx.fillRect(c[0] - 6, c[1] - 2, 12, 3);
}
// a plain Level 0 door in a scrap of yellow wallpaper: the one thing that never falls
function level0Door(ctx, R, z, t) {
  poly(ctx, faceQuad(-0.62, -0.75, 0.62, 1, z + 0.001), shade(R, '#c8b35e', z, 1.1));
  for (let x = -0.55; x < 0.6; x += 0.14) seg(ctx, P(x, -0.75, z), P(x, 1, z), shade(R, '#b39e4c', z), 1);
  poly(ctx, faceQuad(-0.4, -0.55, 0.4, 1, z), shade(R, '#a68a5c', z, 1.1));
  const k = P(0.28, 0.25, z); ctx.fillStyle = shade(R, '#d8c08a', z); ctx.fillRect(k[0] - 3, k[1] - 2, 6, 4);
  const b1 = P(-0.4, 1, z), b2 = P(0.4, 1, z);
  ctx.fillStyle = `rgba(255,236,150,${0.55 + 0.1 * Math.sin(t * 50)})`; ctx.fillRect(b1[0], b1[1] - 3, b2[0] - b1[0], 3);
  glow(ctx, (b1[0] + b2[0]) / 2, b1[1], 60, 'rgba(255,230,140,0.35)');
}

// remodelled hall
const wcDoor = wallQuad(-1.6, -0.5, 1, 2.2, 3.0);
const officeDoor = faceQuad(-0.5, -0.5, 0.5, 1, 5.999);
const router = wallQuad(1.6, -0.55, -0.42, 2.0, 2.4);
const wetSign = wallQuad(-1.6, -0.2, 0.2, 3.6, 4.2);
const hallLamp = { x: 1.15, z: 3.6 };
const hallOutlet = wallQuad(1.6, 0.5, 0.66, 3.75, 3.95);
// restroom
const sink = { x1: -1.2, x2: -0.75, y1: 0.12, y2: 0.28, z1: 1.9, z2: 2.5, color: '#f2f4f4', edge: true };
const mirror = wallQuad(-1.2, -0.62, 0.02, 1.9, 2.5);
const towels = faceQuad(-0.25, -0.3, 0.2, 0.12, 3.499);
const dryer = wallQuad(1.2, -0.15, 0.12, 1.9, 2.3);
const stall = wallQuad(1.2, -0.7, 0.95, 2.6, 3.4);
// site office
const desk = { x1: -1.3, x2: -0.15, y1: 0.42, y2: 0.52, z1: 2.3, z2: 3.0, color: '#b49a6e', edge: true };
const clipQuad = [P(-1.0, 0.42, 2.45), P(-0.6, 0.42, 2.45), P(-0.6, 0.42, 2.8), P(-1.0, 0.42, 2.8)];
const hatAt = [-0.38, 0.42, 2.6];
const toolboxB = { x1: 0.4, x2: 0.95, y1: 0.78, y2: 1, z1: 2.2, z2: 2.55, color: '#b8352a', edge: true };
const blueprint = faceQuad(-0.2, -0.55, 1.0, 0.15, 4.499);
// half-built house
const tape2B = { x1: -0.85, x2: -0.6, y1: 0.93, y2: 1, z1: 2.3, z2: 2.5, color: '#1e1e20', edge: true };
const voids = [wallQuad(-1.6, -0.6, 0.3, 2.0, 2.6), wallQuad(1.6, -0.9, 0.1, 3.0, 3.8), faceQuad(0.6, -0.8, 1.2, -0.2, 4.999)];
const brokenDesk = { x1: -1.3, x2: -0.3, y1: 0.62, y2: 0.72, z1: 3.2, z2: 3.8, color: '#7a6040', edge: true };
// caved-in hall
const JOIST = { left: -0.6, right: 0.6 };
const joistRect = { left: [315, 325, 120, 95], right: [525, 325, 120, 95] };

const L02_SCENES = {
  l02_room: {
    level: 0.2, title: '翻新過的走廊', room: freshHallR, quiet: 0.2,
    viewMsg: '觀景窗裡，新油漆底下看得到一根根木頭骨架的輪廓——好像牆只有一層皮。',
    enter(g, { first }) {
      if (first) g.say('太乾淨了。乾燥的地毯、剛刷好的米白色牆，連嗡嗡聲都聽不到。牆上的路由器一閃一閃，左邊有一扇洗手間的門。走廊盡頭的雙開門上貼著一張紙：「施工辦公室」。');
    },
    draw(ctx, t, s, R) {
      poly(ctx, wcDoor, shade(R, '#d6d0bc', 2.6));
      outline(ctx, wcDoor, shade(R, '#9a9482', 2.6), 2);
      const sg = P(-1.6, -0.3, 2.6); ctx.fillStyle = shade(R, '#3a6ab0', 2.6); ctx.fillRect(sg[0] - 9, sg[1] - 7, 18, 14);
      txt(ctx, 'WC', sg[0], sg[1] + 4, '#fff', 9);
      paper(ctx, R, wetSign, 3.9, '#f4f0e0');
      const ws = P(-1.6, 0, 3.9); txt(ctx, '油漆未乾', ws[0], ws[1] + 4, shade(R, '#b83a2a', 3.9), 10);
      poly(ctx, router, shade(R, '#f6f6f2', 2.2));
      for (let i = 0; i < 3; i++) {
        const p = P(1.6, -0.46, 2.08 + i * 0.1), on = Math.sin(t * (5 + i * 3) + i) > 0;
        ctx.fillStyle = on ? '#3cff6a' : '#145a24'; ctx.fillRect(p[0] - 2, p[1] - 2, 4, 4);
      }
      seg(ctx, P(1.6, -0.55, 2.1), P(1.6, -0.78, 2.05), shade(R, '#333', 2.1), 2);
      seg(ctx, P(1.6, -0.55, 2.3), P(1.6, -0.78, 2.36), shade(R, '#333', 2.3), 2);
      poly(ctx, hallOutlet, shade(R, '#ffffff', 3.8));
      const lp = P(hallLamp.x, 1, hallLamp.z), lt = P(hallLamp.x, -0.1, hallLamp.z);
      seg(ctx, lp, lt, shade(R, '#555', hallLamp.z), 3);
      seg(ctx, lp, P(1.6, 0.6, 3.85), shade(R, '#444', 3.7), 1.5);
      ctx.save(); ctx.shadowColor = 'rgba(255,240,200,0.9)'; ctx.shadowBlur = 30;
      ctx.fillStyle = '#fff4d6'; ctx.beginPath(); ctx.moveTo(lt[0] - 16, lt[1] + 9); ctx.lineTo(lt[0] + 16, lt[1] + 9); ctx.lineTo(lt[0] + 9, lt[1] - 11); ctx.lineTo(lt[0] - 9, lt[1] - 11); ctx.fill();
      ctx.restore();
      poly(ctx, officeDoor, shade(R, '#c4bca4', 6));
      seg(ctx, P(0, -0.5, 6), P(0, 1, 6), shade(R, '#8a8470', 6), 2);
      paper(ctx, R, faceQuad(-0.28, -0.3, 0.28, -0.08, 5.998), 6, '#ffffff');
      const os = P(0, -0.17, 6); txt(ctx, '施工辦公室', os[0], os[1] + 3, shade(R, '#333', 6), 8);
    },
    hotspots: [
      { ...back('l0_dry', '回到乾燥的走廊'), click: (g) => { restoreL02(g); g.go('l0_dry'); } },
      hit('wc', bounds(wcDoor, 4), '洗手間', (g) => g.go('l02_wc', { msg: '你推開洗手間的門。白色磁磚亮得刺眼，空氣裡有芳香劑的味道。' }), 'go'),
      hit('router', bounds(router, 10), '路由器', (g) => {
        g.say('路由器的燈在閃。WiFi 名稱是「BRC_GUEST」，訊號滿格，不用密碼。可是不管打開哪個網站，都只會跳出同一行字：「真正的整潔來自於裝潢」。');
        if (once(g, 'l02_wifi')) g.sanity(3);
      }),
      hit('paint', bounds(wetSign, 10), '「油漆未乾」', (g) => g.say('你用指尖碰了一下牆。油漆真的還是濕的——指尖底下的牆皮軟軟地陷了進去，後面是空心的。')),
      hit('lamp', [610, 245, 70, 110], '立燈和插座', (g) => g.say('一盞插著電的立燈。插座是真的有電，連開關都是新的。電線從插座後面……接到哪裡去？')),
      hit('forward', bounds(officeDoor, 8), '推開「施工辦公室」的門', (g) => {
        if (g.s.flags.screwdriver) return collapse(g, '你一踏進辦公室，地板就猛地一沉。上次的事又要重演了——天花板的板子一片片掉下來，牆壁朝外倒，露出後面的木頭骨架。');
        g.go('l02_office');
      }, 'go'),
    ],
  },

  l02_wc: {
    level: 0.2, title: '洗手間', room: wcR, safe: true, quiet: 0.15,
    viewMsg: '觀景窗裡，鏡子裡你身後的那面牆，只蓋到一半。',
    enter(g, { first }) {
      if (first) g.say('一間乾乾淨淨的洗手間：洗手台、鏡子、擦手紙、烘手機，角落還有一間隔間。在後室裡看到這種地方，反而讓人更不安。');
    },
    draw(ctx, t, s, R) {
      poly(ctx, mirror, shade(R, '#b8c4c8', 2.2, 1.1));
      outline(ctx, mirror, shade(R, '#7a8488', 2.2), 2);
      const m = P(-1.2, -0.25, 2.2); ctx.fillStyle = shade(R, '#8a7050', 2.2, 0.8);
      for (let i = 0; i < 4; i++) ctx.fillRect(m[0] - 18 + i * 12, m[1] - 30, 3, 70);
      box(ctx, R, sink);
      seg(ctx, P(-1.0, 0.28, 2.2), P(-1.0, 1, 2.2), shade(R, '#dfe3e3', 2.2), 8);
      const fau = P(-1.12, 0.05, 2.2); ctx.fillStyle = shade(R, '#a0a8ac', 2.2); ctx.fillRect(fau[0] - 4, fau[1], 14, 5);
      poly(ctx, towels, shade(R, '#8a9296', 3.5)); outline(ctx, towels, shade(R, '#5a6266', 3.5), 2);
      if (!s.flags.l02_towel) { const tt = P(-0.02, 0.15, 3.5); ctx.fillStyle = '#fff'; ctx.fillRect(tt[0] - 10, tt[1] - 2, 20, 10); }
      poly(ctx, dryer, shade(R, '#7c8488', 2.1)); outline(ctx, dryer, shade(R, '#4a5054', 2.1), 2);
      const dn = P(1.2, 0.12, 2.1); ctx.fillStyle = shade(R, '#2a2e30', 2.1); ctx.fillRect(dn[0] - 18, dn[1] - 3, 22, 4);
      poly(ctx, stall, shade(R, '#8aa4b0', 3));
      outline(ctx, stall, shade(R, '#56707a', 3), 2);
      const gr = P(1.2, 0.1, 2.95); txt(ctx, 'J.H.', gr[0], gr[1], shade(R, '#2a2a2a', 3), 9);
    },
    hotspots: [
      back('l02_room', '回到走廊'),
      hit('mirror', bounds(mirror, 4), '鏡子', (g) => {
        g.say('鏡子裡的你很狼狽。你身後的牆在鏡子裡只蓋到一半：油漆、石膏板，然後是一根根光禿禿的木條。你回頭——牆好好的。');
        if (once(g, 'l02_mirror')) g.sanity(-2);
      }),
      { ...hit('sink', boxRect(sink, 10), '洗手台', (g) => {
        if (g.s.flags.l02_sink) return g.say('水龍頭只滴下幾滴就停了。');
        g.flag('l02_sink'); g.sfx('drink'); g.drink(25);
        g.say('水龍頭流出來的是乾淨的自來水。你捧起來喝了好幾口——冰涼、沒有怪味，真正的水。');
      }, 'take') },
      { ...hit('towel', bounds(towels, 8), '擦手紙', (g) => {
        if (g.s.flags.l02_towel || g.has('towel')) return g.say('擦手紙抽完了。你身上已經有一張了。');
        g.flag('l02_towel');
        g.give('towel', '你抽了一張擦手紙，在水龍頭底下沾濕，摺成一小塊收起來。');
      }, 'take') },
      hit('dryer', bounds(dryer, 8), '烘手機', (g) => { g.sfx('steam'); g.say('你把手伸到烘手機底下。它轟轟地吹出熱風——吹了很久都不停。熱風裡有一股木屑的味道。'); }),
      hit('stall', bounds(stall, 4), '隔間的門', (g) => g.say('隔間是空的。門板內側有人用麥克筆寫了一行字，旁邊簽著「J.H.」：\n「別碰他們的工具。碰了也別回頭，一直往有黃色牆紙的門跑。帶塊濕布摀住嘴。」')),
    ],
  },

  l02_office: {
    level: 0.2, title: '施工辦公室', room: officeR, quiet: 0.2,
    viewMsg: '觀景窗裡，藍圖上畫的不是這間辦公室，而是一整片沒有盡頭的 Level 0。',
    enter(g, { first }) {
      if (first) g.say('一間臨時的工地辦公室。桌上堆著一疊板夾，旁邊擺著一頂黃色安全帽。牆上貼著藍圖。地上放著一個紅色的工具箱。');
    },
    draw(ctx, t, s, R) {
      poly(ctx, blueprint, shade(R, '#2a4a8a', 4.5));
      ctx.strokeStyle = shade(R, '#c8d8ff', 4.5); ctx.lineWidth = 1;
      const [bx, by, bw, bh] = bounds(blueprint);
      for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(bx + (bw * i) / 6, by + 4); ctx.lineTo(bx + (bw * i) / 6, by + bh - 4); ctx.stroke(); }
      for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(bx + 4, by + (bh * i) / 3); ctx.lineTo(bx + bw - 4, by + (bh * i) / 3); ctx.stroke(); }
      ctx.strokeStyle = '#ff5a4a'; ctx.strokeRect(bx + bw * 0.36, by + bh * 0.4, bw * 0.16, bh * 0.22);
      box(ctx, R, desk);
      for (const [x, z] of [[-1.25, 2.35], [-0.2, 2.35], [-1.25, 2.95], [-0.2, 2.95]]) seg(ctx, P(x, 0.52, z), P(x, 1, z), shade(R, '#6a5838', z), 3);
      paper(ctx, R, clipQuad, 2.6, '#efe9d6');
      const cq = P(-0.8, 0.42, 2.45); ctx.fillStyle = shade(R, '#8a6a3a', 2.5); ctx.fillRect(cq[0] - 8, cq[1] - 3, 16, 4);
      const h = P(...hatAt), r = 15 / (hatAt[2] / 2.4);
      ctx.fillStyle = shade(R, '#e8c21e', hatAt[2]); ctx.beginPath(); ctx.arc(h[0], h[1], r, Math.PI, 0); ctx.fill(); ctx.fillRect(h[0] - r - 4, h[1] - 2, r * 2 + 8, 3);
      txt(ctx, '102', h[0], h[1] - 4, shade(R, '#333', 2.6), 8);
      if (!s.flags.screwdriver) box(ctx, R, toolboxB);
    },
    hotspots: [
      back('l02_room', '回到走廊'),
      hit('clipboard', bounds(clipQuad, 14), '一疊板夾', (g) => g.read('n02_clip')),
      hit('hat', [P(...hatAt)[0] - 24, P(...hatAt)[1] - 22, 48, 28], '安全帽', (g) => g.say('黃色的安全帽，側面印著「102-CX」。內襯還是溫的，好像有人剛摘下來。')),
      hit('blueprint', bounds(blueprint, 6), '藍圖', (g) => g.say('藍圖標題寫著「A880-1：Level 0・A 級重塑」。格子一格接一格，一直畫到紙的邊緣外面。中間有一小塊被紅筆圈起來，旁邊寫著：「先從這裡開始」。那一小塊，就是你站著的地方。')),
      {
        ...hit('toolbox', boxRect(toolboxB, 8), '紅色工具箱', (g) => {
          g.flag('screwdriver'); g.give('screwdriver');
          collapse(g, '你從工具箱裡拿起一支螺絲起子——整棟房子猛地一震。天花板的板子一片片掉下來，牆壁朝外倒，露出後面蓋到一半的木頭骨架。');
        }, 'take'),
        when: (s) => !s.flags.screwdriver,
      },
    ],
  },

  l02_frame: {
    level: 0.2, title: '蓋到一半的房子', room: frameR, quiet: 0.3, hazard: collapseLabel, update: collapseTick,
    viewMsg: '觀景窗裡，牆上的破洞外面什麼都沒有。不是黑暗，是什麼都沒有。',
    enter(g) { g.say('牆上的破洞外面什麼都沒有。得趕快找到門——那扇有黃色牆紙的門。'); },
    draw(ctx, t, s, R) {
      studs(ctx, R);
      for (const q of voids) poly(ctx, q, '#000');
      box(ctx, R, brokenDesk);
      seg(ctx, P(-1.25, 0.72, 3.3), P(-1.3, 1, 3.4), shade(R, '#5a4430', 3.3), 3);
      if (!s.flags.tape2) cassette(ctx, R, tape2B);
      dust(ctx, t, 30, s.flags.l02_mask ? 0.35 : 0.55);
    },
    hotspots: [
      { ...back('l02_joists', '轉身往外跑'), click: (g) => g.go('l02_joists') },
      hit('void', bounds(voids[1], 4), '牆上的破洞', (g) => { g.sanity(-2); g.say('你往破洞外看。外面不是黑暗，也不是別的房間，是「什麼都沒有」。你的眼睛找不到任何可以對焦的東西。'); }),
      { ...hit('tape2', boxRect(tape2B, 14), '木屑裡的錄影帶', (g) => { g.flag('tape2'); g.give('tape2', '木屑堆裡躺著一卷錄影帶，標籤上寫著「#2」。'); }, 'take'), when: (s) => !s.flags.tape2 },
    ],
  },

  l02_joists: {
    level: 0.2, title: '塌陷的走廊', room: joistR, quiet: 0.3, hazard: collapseLabel, update: collapseTick,
    viewMsg: '觀景窗裡，其中一根托樑底下的木屑，一直在往下掉。',
    enter(g, { first }) {
      if (first || g.s.flags.l02_collapsed) g.say('來時的走廊塌了。地板整片掉進「什麼都沒有」裡，只剩兩根托樑橫跨過去。對面，走廊盡頭還有一扇沒倒的門。其中一根托樑在嘎吱作響。');
    },
    draw(ctx, t, s, R) {
      studs(ctx, R);
      poly(ctx, [P(-1.6, 1, 1.4), P(1.6, 1, 1.4), P(1.6, 1, 4.4), P(-1.6, 1, 4.4)], '#000');
      for (const side of ['left', 'right']) {
        const x = JOIST[side], cracked = s.flags.l02_crack === side, sag = cracked ? 0.09 : 0;
        const pts = [P(x - 0.08, 1, 1.2), P(x + 0.08, 1, 1.2), P(x + 0.08, 1 + sag, 2.8), P(x + 0.08, 1, 4.6), P(x - 0.08, 1, 4.6), P(x - 0.08, 1 + sag, 2.8)];
        poly(ctx, pts, shade(R, cracked ? '#8a6c44' : '#a4865a', 2.6));
        if (cracked) {
          const c1 = P(x - 0.07, 1 + sag, 2.75), c2 = P(x, 1 + sag, 2.82), c3 = P(x + 0.07, 1 + sag, 2.78);
          ctx.strokeStyle = '#140c06'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(c1[0] - 4, c1[1] - 2); ctx.lineTo(c2[0] - 3, c2[1] + 4); ctx.lineTo(c2[0] + 3, c2[1] - 3); ctx.lineTo(c3[0] + 4, c3[1] + 2); ctx.stroke();
          ctx.fillStyle = 'rgba(230,210,170,0.85)';
          for (let i = 0; i < 14; i++) { const y = c2[1] + 4 + ((t * 70 + i * 17) % 150); ctx.fillRect(c2[0] - 6 + (i % 4) * 4, y, 2, 3); }
          const jig = Math.sin(t * 40) * 1.2; seg(ctx, [c2[0] - 10 + jig, c2[1] + 2], [c2[0] - 22 + jig, c2[1] - 6], '#c8a874', 2);
        }
      }
      level0Door(ctx, R, 5.999, t);
      dust(ctx, t, 22, s.flags.l02_mask ? 0.3 : 0.5);
    },
    hotspots: [
      { ...back('l02_frame', '退回骨架裡'), click: (g) => g.go('l02_frame') },
      hit('void', [380, 420, 200, 40], '腳下的空洞', (g) => g.say('托樑底下什麼都沒有。不是很深——是根本沒有底。')),
      ...['left', 'right'].map((side) => hit(side, joistRect[side], side === 'left' ? '踩著左邊的托樑過去' : '踩著右邊的托樑過去', (g) => {
        if (g.s.flags.l02_crack === side) {
          g.sfx('thud'); g.sanity(-20);
          return leaveFrame(g, '托樑在你腳下啪一聲斷了。你掉進「什麼都沒有」裡——沒有風聲，沒有下墜的感覺，什麼都沒有。等你回過神來，你趴在乾燥走廊的地毯上，嘴裡全是木屑。');
        }
        g.go('l02_exit', { msg: '你張開雙臂，一步一步踩著托樑走過去。底下什麼都沒有。另一根托樑在你身後斷成兩截，掉進虛無裡，連聲音都沒有。' });
      }, 'go')),
    ],
  },

  l02_exit: {
    level: 0.2, title: '最後一段走廊', room: exitR, quiet: 0.3, hazard: collapseLabel, update: collapseTick,
    viewMsg: '觀景窗裡，那扇門周圍的牆紙一點灰塵都沒沾。',
    enter(g) { g.say('只剩最後幾步了。黃色牆紙的門就在前面，可是門前的天花板一直在往下掉板子，一片接一片，砸得很有節奏。'); },
    draw(ctx, t, s, R) {
      studs(ctx, R);
      level0Door(ctx, R, 3.999, t);
      const k = clockOf(s) % 2.8, z = 2.3;
      if (k < 1.0) {
        const y = -1 + (k / 1.0) * 1.96;
        poly(ctx, [P(-0.45, y, z - 0.3), P(0.45, y, z - 0.3), P(0.45, y + 0.04, z + 0.3), P(-0.45, y + 0.04, z + 0.3)], shade(R, '#d6cc96', z));
      } else {
        const a = Math.min(0.55, (k - 1.0) / 1.8 * 0.55);
        ctx.fillStyle = `rgba(0,0,0,${a})`; poly(ctx, [P(-0.5, 1, z - 0.35), P(0.5, 1, z - 0.35), P(0.5, 1, z + 0.35), P(-0.5, 1, z + 0.35)]); ctx.fill();
        poly(ctx, [P(-0.45, -1, z - 0.3), P(0.45, -1, z - 0.3), P(0.45, -1, z + 0.3), P(-0.45, -1, z + 0.3)], '#000');
      }
      for (let i = 0; i < 5; i++) { const p = P(-0.9 + i * 0.4, 0.98, 1.6 + (i % 2) * 0.5); ctx.fillStyle = shade(R, '#bfb488', 1.8); ctx.fillRect(p[0] - 14, p[1] - 3, 28, 5); }
      dust(ctx, t, 20, s.flags.l02_mask ? 0.3 : 0.5);
    },
    hotspots: [
      { ...back('l02_joists', '退回托樑那邊'), click: (g) => g.go('l02_joists') },
      hit('tiles', [400, 150, 160, 60], '掉落的天花板', (g) => g.say(tileFalling(g.s) ? '板子正在往下掉！' : '天花板上的洞在嘎嘎作響，下一片板子隨時會掉下來。等它砸完再衝。')),
      hit('forward', bounds(faceQuad(-0.4, -0.55, 0.4, 1, 3.999), 10), '衝向黃色牆紙的門', (g) => {
        if (tileFalling(g.s)) {
          g.sfx('thud'); g.sanity(-8);
          return g.say('一片天花板正好砸在你的肩膀上。你踉蹌著退回來，眼前一陣發黑。等它掉完再衝。');
        }
        leaveFrame(g, '你趁兩片板子之間的空檔衝過去，撞開那扇門——撲面而來的是潮濕的地毯味和熟悉的嗡嗡聲。身後傳來最後一聲轟響，然後什麼都沒有了。回頭看，門後又是那條乾淨的新走廊，好像什麼都沒發生過。');
      }, 'go'),
    ],
  },
};

// ================= Level 1, long ago =================
// Where Level 0.7's typist came out: the archived Level 1, a concrete garage where someone kept horses.
const oldR = room(pal('#6a645a', '#2e2a24', '#4a4236', '#0a0806', '#ffd9a0'), { hw: 2, depth: 9, fogEnd: 8, floorTex: 'concrete', wallTex: 'concrete', baseboard: false, lights: [2.2, 5.5], flickerLights: [1], flick: (t) => 0.9 + 0.1 * Math.sin(t * 3) });
const oldCrate = { x1: 0.8, x2: 1.4, y1: 0.5, y2: 1, z1: 2.3, z2: 2.8, color: '#7a5a34', edge: true };
const typewriter = { x1: 0.9, x2: 1.3, y1: 0.36, y2: 0.5, z1: 2.4, z2: 2.68, color: '#2a2a28', edge: true };
const hayB = { x1: -1.9, x2: -1.2, y1: 0.6, y2: 1, z1: 2.4, z2: 3.0, color: '#c8a85a' };
const L1_OLD = {
  l1_old: {
    level: 1, title: '很久以前的倉庫', room: oldR, quiet: 0.6,
    viewMsg: '觀景窗裡，馬廄的隔板上，有人用粉筆寫著年份：1993。',
    enter(g, { first }) {
      if (first) g.say('一片看不到盡頭的水泥停車場，水泥柱之間拴著馬的韁繩，兩邊是一格一格的木頭馬廄。沒有馬。地上有乾草、油漬，還有一台打字機擺在木箱上。這是很久以前的 Level 1。');
    },
    draw(ctx, t, s, R) {
      for (const sd of [-1, 1]) for (let z = 7; z >= 2; z -= 1.25) {
        const x1 = sd < 0 ? -2 : 1.4, x2 = sd < 0 ? -1.4 : 2;
        poly(ctx, faceQuad(x1, 0.15, x2, 1, z), shade(R, '#7a5a34', z));
        for (let y = 0.3; y < 1; y += 0.2) seg(ctx, P(x1, y, z), P(x2, y, z), shade(R, '#4a3418', z), 1);
        seg(ctx, P(sd * 1.4, 0.15, z), P(sd * 1.4, 1, z), shade(R, '#5a4020', z), Math.max(2, 7 / z));
      }
      for (const [x, z] of [[-0.8, 4.2], [0.8, 6.4]]) {
        poly(ctx, faceQuad(x - 0.15, -1, x + 0.15, 1, z), shade(R, '#5e5a52', z));
        const a = P(x - 0.15, 0.1, z), b = P(x - 0.7, 0.35, z);
        ctx.strokeStyle = shade(R, '#8a6a3a', z); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo((a[0] + b[0]) / 2, b[1] + 20, b[0], b[1]); ctx.stroke();
      }
      box(ctx, R, hayB);
      ctx.strokeStyle = shade(R, '#e0c070', 2.6); ctx.lineWidth = 1;
      for (let i = 0; i < 14; i++) { const p = P(-1.9 + (i % 7) * 0.1, 0.62, 2.45 + (i % 3) * 0.2); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + 8 - (i % 4) * 4, p[1] - 6); ctx.stroke(); }
      box(ctx, R, oldCrate); box(ctx, R, typewriter);
      poly(ctx, faceQuad(0.98, 0.18, 1.22, 0.38, 2.5), shade(R, '#efe7cf', 2.5));
    },
    hotspots: [
      hit('typewriter', boxRect({ ...typewriter, y1: 0.18 }, 10), '木箱上的打字機', (g) => g.read('n1_old')),
      hit('stall', [180, 268, 100, 56], '空的馬廄', (g) => {
        g.say('馬廄裡鋪著乾草，飲水槽裡還有半槽水。地上的蹄印是新的，邊緣還是濕的。可是這裡一匹馬都沒有。');
        if (once(g, 'l1_old_stall')) g.sanity(-2);
      }),
      { ...hit('hay', boxRect(hayB, 8), '乾草堆', (g) => {
        if (!once(g, 'l1_old_can')) return g.say('只是乾草。');
        g.give('can', '你在乾草堆裡摸到一個冰冷的東西——一個沒開過的鐵皮罐頭，標籤上的日期早就過了，但看起來沒壞。');
      }, 'take') },
      hit('forward', [400, 220, 160, 120], '沿著柱子往前走', (g) => {
        g.flag('l1_via_memory'); g.flag('l1_fresh', 'memory');
        g.go('l1_arrive', { msg: '你沿著柱子往前走。馬廄一格一格變少，乾草變成了紙屑，韁繩變成了電線。腳下的時代一步一步追上了現在。' });
      }, 'go'),
    ],
  },
};

export const SUBLEVEL_SCENES = {
  ...L02_SCENES,
  ...L1_OLD,
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
        if (Math.random() < 0.25) return g.go('l0_pillar', { msg: '你穿過裂口，眼前一黑——腳下又是濕地毯。切出把你丟回了 Level 0，一根柱子旁邊。' });
        g.flag('l1_via_zenith'); g.flag('l1_fresh', 'zenith');
        g.go('l1_arrive', { msg: '你穿過閃爍的裂口。玻璃、甲板、球殼一起被抽走，腳下變成了冰冷潮濕的水泥。' });
      }, 'go'),
    ],
  },

  // ------------------------------------------------------------- 0.3
  l03_entry: {
    level: '0.3', title: '結霜的房間', room: iceEntryR, hazard: coldLabel, update: coldTick,
    viewMsg: '觀景窗裡，冰塊裡的人影是背對著你的。',
    enter(g, { first }) {
      if (first) g.say('還是 Level 0——一樣的牆紙，一樣的地毯，只是所有東西都結了冰。你吐出一口白氣。冰。到處都是。');
    },
    draw(ctx, t, s, R) {
      icicles(ctx, R, 6);
      for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) {
        const z = 1.6 + i * 1.1, a = P(sd * 1.2, -0.2 + i * 0.1, z), b = P(sd * (1.2 - 0.1), 0.25 + i * 0.1, z + 0.2), c = P(sd * 1.2, 0.3 + i * 0.1, z + 0.4);
        poly(ctx, [a, b, c], shade(R, '#d7d6b4', z, 0.9));
      }
      poly(ctx, [P(-1.2, 1, 1), P(1.2, 1, 1), P(1.2, 1, 6), P(-1.2, 1, 6)], 'rgba(235,245,250,0.22)');
      const wp = P(0.75, 0.2, 3.9); worker(ctx, wp[0], P(0.75, 1, 3.9)[1], 118, 0.5, '', false);
      iceBox(ctx, R, entryBlock, 0.5);
      grille(ctx, ceilVent, '#d0e4ea');
      if (!s.flags.l03_sealed) fogJet(ctx, 480, P(0, -1, 2.5)[1], 0, 1, t);
      frostOverlay(ctx, t, s);
    },
    hotspots: [
      back('l0_hall', '循著霜走回走廊', '你循著地上的霜往回走。暖一點的、帶灰塵味的空氣，從來沒這麼好聞過。'),
      hit('forward', [400, 205, 150, 140], '往深處走', (g) => g.go('l03_camp'), 'go'),
      hit('block', boxRect(entryBlock, 4), '角落的冰塊', (g) => g.say('冰塊裡站著一個人，穿著橘色的工作背心，背對著你。冰太厚了，看不清臉。')),
      hit('vent', bounds(ceilVent, 6), '天花板上的格柵', (g) => g.say('天花板上的格柵在吐冷霧。你盯著它看的時候，它好像往旁邊挪了一點。')),
    ],
  },

  l03_camp: {
    level: '0.3', title: '104-CX 施工站', room: campR, hazard: coldLabel,
    update: (g, dt) => { if (!g.s.flags.l03_sealed) coldTick(g, dt); },
    enter(g, { first }) {
      if (first) g.say('有人在這裡施工過。半張羊毛地毯鋪在冰上，旁邊堆著工具箱、一台暖風機、一把噴槍。牆上夾著一疊列印出來的郵件。沒有人。');
    },
    draw(ctx, t, s, R) {
      icicles(ctx, R, 5.5, 1.3);
      poly(ctx, [P(-1.5, 1, 1), P(1.5, 1, 1), P(1.5, 1, 3.4), P(-1.5, 1, 3.4)], shade(R, '#8a3a2a', 2, 0.9, 0.85));
      poly(ctx, [P(-1.5, 1, 3.4), P(1.5, 1, 3.4), P(1.5, 1, 5.5), P(-1.5, 1, 5.5)], 'rgba(230,245,250,0.3)');
      // the ice wall
      if (!s.flags.l03_melted) {
        poly(ctx, iceWall, 'rgba(170,215,235,0.85)'); outline(ctx, iceWall, 'rgba(240,252,255,0.9)', 2);
        const iw = P(0, 0.2, 5.5); worker(ctx, iw[0] - 20, P(0, 1, 5.5)[1], 110, 0.35); worker(ctx, iw[0] + 26, P(0, 1, 5.5)[1], 105, 0.3);
        for (let i = 0; i < 6; i++) seg(ctx, P(-0.6 + i * 0.22, -0.7, 5.5), P(-0.5 + i * 0.2, 0.2 + (i % 3) * 0.2, 5.5), 'rgba(255,255,255,0.4)', 1);
      } else { poly(ctx, iceWall, '#0e1a20'); glow(ctx, 480, 300, 60, 'rgba(255,200,120,0.4)'); }
      if (!s.flags.l03_wool) box(ctx, R, rugRoll);
      box(ctx, R, heaterBox);
      const hg = faceQuad(0.88, 0.55, 1.27, 0.9, 2.3); poly(ctx, hg, '#2a1a10');
      const warm = s.flags.l03_sealed;
      for (let i = 0; i < 3; i++) seg(ctx, P(0.92, 0.62 + i * 0.1, 2.3), P(1.23, 0.62 + i * 0.1, 2.3), warm ? '#ff7a2a' : '#7a3a1a', 3);
      if (warm) glow(ctx, P(1.1, 0.7, 2.3)[0], P(1.1, 0.7, 2.3)[1], 110, 'rgba(255,120,40,0.45)');
      box(ctx, R, toolbox);
      if (!s.flags.l03_torch) {
        const b = P(0.05, 0.78, 2.2);
        ctx.fillStyle = shade(R, '#3a5a8a', 2.2); ctx.fillRect(b[0] - 26, b[1] - 16, 30, 16);
        seg(ctx, [b[0] + 4, b[1] - 10], [b[0] + 38, b[1] - 18], shade(R, '#9aa0a4', 2.2), 5);
        if (!warm) { ctx.fillStyle = 'rgba(230,245,255,0.6)'; ctx.fillRect(b[0] - 26, b[1] - 16, 30, 5); }
      }
      poly(ctx, radioQ, shade(R, '#2a2e30', 2.1));
      const rl = bounds(radioQ); ctx.fillStyle = Math.sin(t * 4) > 0.7 ? '#ff6a2a' : '#4a1a0a'; ctx.fillRect(rl[0] + 3, rl[1] + 3, 3, 3);
      paper(ctx, R, clipboard, 2.9, '#efe9d8');
      for (const [o, label] of [[campR.openings[0], '通風機房']]) { const c = P(-1.5, -0.72, (o.z1 + o.z2) / 2); txt(ctx, label, c[0] + 4, c[1], shade(R, '#405058', o.z1), 11); }
      frostOverlay(ctx, t, s, warm ? 0.5 : 1);
    },
    hotspots: [
      back('l03_entry', '回到結霜的房間'),
      hit('vents', bounds(wallQuad(-1.5, -0.6, 1, 3.5, 4.5)), '通風機房', (g) => g.go('l03_vents'), 'go'),
      hit('clipboard', bounds(clipboard, 6), '夾在牆上的郵件', (g) => g.read('n03_mail')),
      hit('radio', bounds(radioQ, 6), '對講機', (g) => {
        g.sfx('static');
        g.say(['只有雜訊。', '雜訊裡有人在數數：「一〇四、一〇五、一〇七……」然後斷了。', '「……Planes？你們在哪——」雜訊吞掉了後面的字。'][Math.floor(Math.random() * 3)]);
      }),
      { ...hit('wool', boxRect(rugRoll, 6), '捲起來的羊毛地毯', (g) => {
        if (!once(g, 'l03_wool')) return;
        g.give('wool', '一捲沒鋪完的羊毛地毯，又厚又重。標籤上寫著「B 類重建・溫暖」。');
      }, 'take'), when: (s) => !s.flags.l03_wool },
      { ...hit('heater', boxRect(heaterBox, 4), '施工暖風機', (g) => g.say(g.s.flags.l03_sealed
        ? '暖風機轟轟地響。暖意終於留在了房間裡。'
        : '暖風機開著，熱氣卻一出來就被冷霧捲走了。冷霧是從通風機房那邊灌進來的。')) },
      { ...hit('blowtorch', [478, 338, 70, 36], '噴槍', (g) => {
        if (!g.s.flags.l03_sealed) return g.say('噴槍的瓦斯罐凍得像石頭，怎麼按都點不著。要是暖風機能把它烘熱就好了。');
        g.flag('l03_torch');
        g.give('blowtorch', '你把瓦斯罐擱在暖風機前烘了一會兒。按下開關——「呼」地一聲，藍色的火舌噴了出來。');
      }, 'take'), when: (s) => !s.flags.l03_torch },
      { ...hit('icewall', bounds(iceWall, 4), '結冰的門', (g) => {
        if (g.s.flags.l03_melted) return g.go('l03_blocks');
        g.say('門口被一整面冰封住了。冰裡面有兩個人影，一動也不動。');
      }, 'go'), use: {
        blowtorch(g) {
          if (g.s.flags.l03_melted) return g.go('l03_blocks');
          g.flag('l03_melted'); g.sfx('steam');
          g.say('你把火舌貼上冰面。冰一層一層化開，水在腳邊又結成冰。等到能過人了，你才發現——冰裡那兩個人影，不見了。');
        },
      } },
    ],
  },

  l03_vents: {
    level: '0.3', title: '通風機房', room: ventsR, hazard: coldLabel, update: coldTick,
    enter(g, { first }) {
      if (first) g.say('牆上、天花板上全是格柵。只有一個在吐冷霧——你眨了一下眼，它換了位置。它在房間裡跳來跳去。');
    },
    draw(ctx, t, s, R) {
      icicles(ctx, R, 4, 0.7);
      ventState = s;
      const live = ventAt(s);
      VENTS.forEach((q, i) => grille(ctx, q, i === live ? '#e8f6ff' : '#71848c'));
      const q = VENTS[live], [x, y, w, h] = bounds(q), d = VENT_DIR[live];
      if (s.flags.l03_sealed) {
        poly(ctx, q, '#8a3a2a');
        const jit = Math.sin(t * 25) * 2;
        for (let i = 0; i < 4; i++) seg(ctx, [x + jit, y + h * (i + 0.5) / 4], [x + w + jit, y + h * (i + 0.5) / 4], '#a5503a', 2);
      } else {
        glow(ctx, x + w / 2, y + h / 2, 70, 'rgba(220,240,255,0.5)');
        fogJet(ctx, x + w / 2, y + h / 2, d[0], d[1], t, 1.4);
        const rattle = Math.sin(t * 40) * 2; outline(ctx, q.map(([a, b]) => [a + rattle, b]), '#ffffff', 2);
      }
      frostOverlay(ctx, t, s);
    },
    hotspots: [
      back('l03_camp', '回到施工站'),
      { id: 'vent', label: '吐著冷霧的通風口', cursor: 'look',
        get rect() { return bounds(VENTS[ventAt(ventState)], 10); },
        click: (g) => {
          if (g.s.flags.l03_sealed) return g.say('地毯底下傳來悶悶的撞擊聲。它還想跳，但被裹住了。');
          g.say(ventAt(g.s) === VENT_LOW ? '它現在在牆腳，伸手就搆得到。冷霧噴在你手上，刺得發疼。' : '太高了。你還沒想好怎麼辦，它就又跳走了。');
        },
        use: {
          wool(g) {
            if (g.s.flags.l03_sealed) return;
            if (ventAt(g.s) !== VENT_LOW) { g.sanity(-1); return g.say('太高了，你搆不到——它又跳走了。等它跳到牆腳再說。'); }
            g.take('wool'); g.flag('l03_sealed'); g.sfx('thud');
            g.say('你撲上去，用羊毛地毯把它整個裹住，死死壓著。格柵在毯子底下撞了好幾下，然後不動了。冷霧小了很多——但沒有停。');
          },
        } },
    ],
  },

  l03_blocks: {
    level: '0.3', title: '冰塊房', room: blocksR, hazard: coldLabel, update: coldTick,
    viewMsg: '觀景窗裡，冰塊裡的每一個人都轉過頭來，看著你。',
    enter(g, { first }) {
      if (first) g.say('房間被巨大的冰塊塞滿了。每一塊冰裡都站著一個人，穿著橘色的背心。你數了數，比四個人多很多。');
    },
    draw(ctx, t, s, R) {
      icicles(ctx, R, 5, 1.7);
      if (!s.flags.l03_open) {
        poly(ctx, backIce, 'rgba(170,215,235,0.88)'); outline(ctx, backIce, 'rgba(240,252,255,0.9)', 2);
        for (let i = 0; i < 5; i++) worker(ctx, P(-0.6 + i * 0.3, 1, 5.2)[0], P(0, 1, 5.2)[1], 96, 0.25, ['105', '107', '107', '108', '108'][i]);
        glow(ctx, 480, 270, 80, 'rgba(255,190,110,0.18)');
      } else {
        poly(ctx, backIce, '#2a1a0c'); glow(ctx, 480, 290, 120, 'rgba(255,190,110,0.6)');
        poly(ctx, faceQuad(-0.6, -0.6, 0.6, 1, 6.5), '#d6bd70');
      }
      const af = P((blockA.x1 + blockA.x2) / 2, 1, 2.6);
      if (!s.flags.l03_planes) worker(ctx, af[0], af[1], 185, 0.7, 'PLANES');
      else { ctx.save(); ctx.globalAlpha = 0.6; ctx.fillStyle = '#0a1418'; ctx.beginPath(); ctx.ellipse(af[0], af[1] - 95, 26, 85, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      iceBox(ctx, R, blockA, s.flags.l03_planes ? 0.25 : 0.5);
      if (!s.flags.l03_supply) {
        const bc = { x1: 0.85, x2: 1.3, y1: 0.55, y2: 1, z1: 2.8, z2: 3.2, color: '#6a5a3a', top: '#7a6a48', edge: true };
        box(ctx, R, bc);
      }
      iceBox(ctx, R, blockB, s.flags.l03_supply ? 0.2 : 0.5);
      frostOverlay(ctx, t, s);
    },
    drawView(ctx, t, s) {
      if (s.flags.l03_planes) return;
      const af = P((blockA.x1 + blockA.x2) / 2, 1, 2.6);
      ctx.save(); ctx.fillStyle = 'rgba(220,255,230,0.8)';
      ctx.fillRect(af[0] - 8, af[1] - 169, 5, 3); ctx.fillRect(af[0] + 3, af[1] - 169, 5, 3); ctx.restore();
    },
    hotspots: [
      back('l03_camp', '回到施工站'),
      { ...hit('planes', boxRect(blockA, 2), '冰塊裡的人：PLANES', (g) => g.say(g.s.flags.l03_planes ? '冰化開後只剩一個人形的空洞，邊緣光滑得像模子。' : '安全帽上寫著 PLANES。他的手按在冰的內側，像是在推。')),
        use: { blowtorch(g) {
          if (!once(g, 'l03_planes')) return;
          g.sfx('steam'); g.sanity(-6);
          g.read('n03_planes', () => g.say('冰化開了。裡面沒有人——只有一個人形的空洞，和一張從洞裡掉出來的報告。'));
        } } },
      { ...hit('supply', boxRect(blockB, 2), '凍著木箱的冰塊', (g) => g.say(g.s.flags.l03_supply ? '箱子空了。' : '冰塊裡凍著一個木箱，箱子上印著 104-CX。')),
        use: { blowtorch(g) {
          if (!once(g, 'l03_supply')) return;
          g.sfx('steam'); g.give('almond'); g.give('can', '冰化開，木箱掉了出來。裡面是施工隊的補給：一瓶杏仁水，一個罐頭。他們沒來得及吃。');
        } } },
      { ...hit('backice', bounds(backIce, 2), '後面那面冰牆', (g) => {
        if (g.s.flags.l03_open) return g.go('l03_warm');
        g.say('冰牆後面透出暖黃色的光。冰裡站著更多的人——安全帽上寫著 105、107、108。');
      }, 'go'), use: { blowtorch(g) {
        if (g.s.flags.l03_open) return g.go('l03_warm');
        g.flag('l03_open'); g.sfx('steam');
        g.say('噴槍的火一直燒到瓦斯快見底，冰牆才塌出一個洞。洞後面是暖的。冰裡的人影，跟著冰一起化成了水。');
      } } },
    ],
  },

  l03_warm: {
    level: '0.3', title: '完工的房間', room: warmR, safe: true,
    enter(g, { first }) {
      if (first) g.say('乾淨、整潔、舒適、溫暖。新鋪的羊毛地毯，新貼的牆紙，暖黃的燈。四張摺疊椅面對著牆排成一排，每張椅子上放著一頂安全帽。');
    },
    draw(ctx, t, s, R) {
      chairs.forEach(({ x, z }, i) => {
        box(ctx, R, { x1: x - 0.18, x2: x + 0.18, y1: 0.45, y2: 0.52, z1: z, z2: z + 0.35, color: '#5a5a5a', top: '#707070' });
        box(ctx, R, { x1: x - 0.18, x2: x + 0.18, y1: 0.05, y2: 0.45, z1: z + 0.33, z2: z + 0.37, color: '#5a5a5a' });
        const h = P(x, 0.45, z + 0.15); ctx.fillStyle = '#e2b52a'; ctx.beginPath(); ctx.ellipse(h[0], h[1] - 4, 16, 9, 0, Math.PI, 0); ctx.fill();
        txt(ctx, ['PLANES', 'CHRIS', 'HAVEC', 'EVIE'][i], h[0], h[1] - 18, shade(R, '#5a4020', z), 8);
      });
      const extra = P(-0.6, 1, 2.2); ctx.fillStyle = '#e2b52a'; ctx.beginPath(); ctx.ellipse(extra[0], extra[1] - 8, 26, 14, 0, Math.PI, 0); ctx.fill();
      paper(ctx, R, finalPrint, 5, '#f4efe0');
      poly(ctx, warmExit, shade(R, '#a88a44', 2.7)); outline(ctx, warmExit, shade(R, '#6a5020', 2.7), 2);
      const kn = P(1.3, 0.2, 2.4); ctx.fillStyle = shade(R, '#d8c070', 2.4); ctx.beginPath(); ctx.arc(kn[0], kn[1], 4, 0, Math.PI * 2); ctx.fill();
      glow(ctx, 480, 330, 260, 'rgba(255,170,90,0.18)');
    },
    hotspots: [
      back('l03_blocks', '回到冰塊房'),
      hit('print', bounds(finalPrint, 8), '貼在牆上的列印紙', (g) => g.read('n03_final')),
      hit('chairs', [355, 255, 250, 70], '四張摺疊椅', (g) => g.say('椅子排得整整齊齊，面對著一面什麼都沒有的牆。椅面是溫的，像是有人剛剛才站起來。')),
      hit('hat', [318, 365, 64, 32], '地上的第五頂安全帽', (g) => g.say('第五頂安全帽倒扣在地毯上。帽簷內側用麥克筆寫著兩個字母：J.H.')),
      hit('rest', [150, 420, 170, 60], '在地毯上坐一會兒', (g) => {
        if (!once(g, 'l03_rested')) return g.say('你已經休息過了。暖意讓你有點不想走。這大概就是問題所在。');
        g.sanity(16); g.checkpoint(); g.say('地毯又厚又軟。你坐下來，手腳一點一點回暖。有一瞬間，你也很想拉一張椅子，面對著牆坐好。');
      }),
      hit('exit', bounds(warmExit, 4), '房間的門', (g) => {
        g.flag('l03_done'); g.flag('l03_thawed');
        g.go('l0_hall', { msg: '門外是那條長長的走廊。你回頭時，門已經變回一面黃色的牆。格柵不再吹冷風了，地毯上的霜化成了水漬。' });
      }, 'go'),
    ],
  },

  // ------------------------------------------------------------- 0.5
  l05_flood: {
    level: '0.5', title: '浸濡通道', room: floodR, quiet: 1.35,
    enter(g, { first }) {
      if (g.s.flags.l05_hunted && !g.s.flags.l05_dissolved) {
        dissolve(g);
        return g.say('你跳進積水。溺屍跟著滑了下來——碰到水的那一刻，它發出一聲尖叫，散成一團濃稠的糊，沉了下去。四周只剩回音。');
      }
      if (first) g.say('樓梯沒入水裡。污水漫到膝蓋，又冷又稠，水面浮著一層油光。藍色的燈吊在破電線下，時不時迸出火花。每一步的水聲都在走廊裡來回撞，撞得你耳朵發疼。');
    },
    draw(ctx, t, s, R) {
      peel(ctx, R, 8);
      water(ctx, R, t);
      for (const z of [2.2, 4.2, 6.4]) blueLamp(ctx, 0.15 - (z % 2) * 0.2, -0.5, z, t);
      if (!s.flags.l05_diary) paper(ctx, R, diaryQ, 2.4, '#cfc6a0');
    },
    hotspots: [
      back('l0_low', '爬回樓梯，回到 Level 0', '你爬上台階，在黑暗裡摸著牆走了很久，直到看見那間低矮房間的燈光。'),
      hit('forward', [400, 200, 160, 150], '蹚著水往前走', (g) => { chaseStep(g); g.go('l05_planks'); }, 'go'),
      hit('drink', [130, 390, 190, 70], '捧起水來喝', (g) => {
        g.drink(18); g.sfx('drink');
        const n = (g.s.flags.l05_sick || 0) + 1; g.flag('l05_sick', n);
        g.sanity(-10); g.eat(-12);
        g.say(n === 1 ? '水是溫的，有一股化學品的味道。你喝了幾口——然後跪在水裡吐了出來。喉嚨還是乾的，胃卻翻了過來。' : '你又喝了。你知道會怎樣。你還是喝了。');
      }),
      { ...hit('diary', bounds(diaryQ, 10), '漂在水上的紙', (g) => { g.flag('l05_diary'); g.read('n05_diary'); }), when: (s) => !s.flags.l05_diary },
    ],
  },

  l05_planks: {
    level: '0.5', title: '腐朽的木牆', room: planksR, quiet: 1.35,
    enter(g, { first }) {
      if (g.s.flags.l05_hunted && !g.s.flags.l05_dissolved) {
        dissolve(g);
        return g.say('你跳下平台，落進積水。溺屍跟著你滑了下來——一碰到水，它就尖叫著化成了糊。水面冒了幾個泡，然後一切安靜了。');
      }
      if (first) g.say('牆紙不見了，露出一片一片泡爛的木板。一台零食推車半沉在水裡。前面有一盞燈垂得特別低，幾乎碰到水面，在劈啪作響。');
    },
    draw(ctx, t, s, R) {
      for (const sd of [-1, 1]) for (let y = -0.9; y < 0.6; y += 0.18) seg(ctx, P(sd * 1.2, y, 1), P(sd * 1.2, y, 7), shade(R, '#2a2016', 3, 1, 0.7), 1.5);
      for (const sd of [-1, 1]) for (let z = 1.5; z < 7; z += 1.3) poly(ctx, wallQuad(sd * 1.2, -0.2 + (z % 1) * 0.3, 0.2 + (z % 1) * 0.3, z, z + 0.3), shade(R, '#1a140c', z));
      water(ctx, R, t, 0.55, 1.2, 7);
      box(ctx, R, cart);
      if (!s.flags.l05_bar) for (let i = 0; i < 3; i++) { const p = P(-1.05 + i * 0.16, 0.15, 2.6); ctx.fillStyle = ['#d8452a', '#2a7ad8', '#e8c82a'][i]; ctx.fillRect(p[0], p[1] - 14, 12, 14); }
      for (const z of [5.5]) blueLamp(ctx, 0, -0.55, z, t);
      const sw = Math.sin(clockOf(s) * 1.9) * 0.15;
      blueLamp(ctx, sw, 0.25, 3.4, t, 1.3, sparking(s));
      if (sparking(s)) glow(ctx, P(sw, 0.55, 3.4)[0], P(sw, 0.55, 3.4)[1], 120, 'rgba(160,220,255,0.5)');
    },
    hotspots: [
      back('l05_flood', '回到樓梯那邊'),
      { ...hit('cart', boxRect(cart, 6), '零食推車', (g) => {
        if (!once(g, 'l05_bar')) return g.say('推車上只剩泡爛的包裝紙。');
        g.give('bar', '大部分的零食都泡爛了。只有一條能量棒還封著口。');
      }, 'take') },
      hit('lamp', [430, 290, 100, 60], '垂到水面的燈', (g) => g.say(sparking(g.s) ? '燈在劈啪作響，火花一直落到水面上。現在走過去，等於把腿泡在電線裡。' : '燈暫時安靜了。它晃得很慢，一陣一陣地迸火花。')),
      hit('forward', [400, 180, 160, 100], '從燈底下穿過去', (g) => {
        if (sparking(g.s)) {
          g.sanity(-12); g.sfx('error');
          return g.say('你剛邁出一步，燈就劈啪一聲——電流順著水竄上你的腿，你整個人僵住，再跌回來。等它安靜下來再走。');
        }
        chaseStep(g); g.go('l05_platform', { msg: '你趁燈暗下去的空檔蹚了過去。身後又是一陣劈啪聲。' });
      }, 'go'),
    ],
  },

  l05_platform: {
    level: '0.5', title: '乾燥的平台', room: platformR, hazard: huntLabel, update: huntTick,
    enter(g, { first }) {
      if (g.s.flags.l05_hunted && !g.s.flags.l05_dissolved) return g.say('它就在你後面，從醫院的門裡滑出來。腳下就是水。');
      if (first) g.say('走廊盡頭，一座水泥平台從水裡升起來。台階上去是兩扇雙開門，門上有圓窗，窗後是醫院的走廊。終於可以把腳從水裡拔出來了。');
    },
    draw(ctx, t, s, R) {
      water(ctx, R, t, 0.55, 1.2, 3.3);
      box(ctx, R, platformTop);
      for (let i = 0; i < 3; i++) box(ctx, R, { x1: -0.6, x2: 0.6, y1: 0.55 - i * 0.1, y2: 0.65 - i * 0.1, z1: 3.0 + i * 0.1, z2: 3.1 + i * 0.1, color: '#7c7a6e', top: '#97958a' });
      poly(ctx, wardDoors, shade(R, '#6c7a70', 7)); seg(ctx, P(0, -0.7, 7), P(0, 0.25, 7), '#1a201c', 2);
      for (const x of [-0.3, 0.3]) { const c = P(x, -0.35, 7); ctx.fillStyle = 'rgba(210,230,190,0.5)'; ctx.beginPath(); ctx.arc(c[0], c[1], 6, 0, Math.PI * 2); ctx.fill(); }
      const sg = P(0, -0.85, 7); txt(ctx, '病房 WARD', sg[0], sg[1], shade(R, '#c8d0b8', 7), 10);
      blueLamp(ctx, -0.3, -0.5, 2.4, t); blueLamp(ctx, 0.3, -0.45, 5.2, t);
      drawChaser(ctx, s, t);
    },
    hotspots: [
      { ...back('l05_planks', '退回水裡'), click: (g) => g.go('l05_planks') },
      hit('forward', bounds(wardDoors, 6), '推開醫院的門', (g) => {
        if (g.s.flags.l05_hunted && !g.s.flags.l05_dissolved) return g.say('它就是從那扇門裡出來的。往回跑，等於迎面撞上它。');
        g.go('l05_ward');
      }, 'go'),
      { ...hit('jump', [150, 400, 660, 60], '跳回水裡，讓它跟過來', (g) => g.go('l05_planks')), when: (s) => s.flags.l05_hunted && !s.flags.l05_dissolved },
    ],
  },

  l05_ward: {
    level: '0.5', title: '病房', room: wardR, hazard: huntLabel, update: huntTick,
    enter(g, { first }) {
      chaseStep(g);
      if (first) g.say('一股腐肉的味道。地板油膩膩的，吊頂歪歪斜斜地垂下來。可是——有床。床墊是濕的，有一股樟脑丸味，但那是床。你已經記不清上一次闔眼是什麼時候了。');
    },
    draw(ctx, t, s, R) {
      for (let i = 0; i < 5; i++) {
        const z = 1.6 + i * 0.9, tilt = ((i * 37) % 7) / 20;
        poly(ctx, [P(-0.4 + i * 0.1, -1, z), P(0.2 + i * 0.1, -1 + tilt, z + 0.1), P(0.2 + i * 0.1, -1 + tilt + 0.05, z + 0.6), P(-0.4 + i * 0.1, -1, z + 0.5)], shade(R, '#9aa294', z, 0.8));
      }
      poly(ctx, [P(-1.5, 1, 1), P(1.5, 1, 1), P(1.5, 1, 6), P(-1.5, 1, 6)], 'rgba(120,110,60,0.12)');
      for (const b of beds) {
        box(ctx, R, b);
        const st = P((b.x1 + b.x2) / 2, b.y1, (b.z1 + b.z2) / 2); ctx.fillStyle = 'rgba(110,90,40,0.35)'; ctx.beginPath(); ctx.ellipse(st[0], st[1], 30 / b.z1 * 2, 6, 0, 0, Math.PI * 2); ctx.fill();
        for (const z of [b.z1, b.z2]) for (const x of [b.x1, b.x2]) seg(ctx, P(x, b.y2, z), P(x, 1, z), shade(R, '#5a5e58', z), 2);
      }
      box(ctx, R, medCart);
      if (!s.flags.l05_med) { const m = P(1.1, 0.35, 4.1); bottleIcon(ctx, m[0], m[1]); }
      poly(ctx, faceQuad(-0.5, -0.6, 0.5, 1, 6), '#14140f');
      drawChaser(ctx, s, t);
    },
    hotspots: [
      back('l05_platform', '回到平台'),
      hit('bed', boxRect(beds[0], 6), '躺到床上', (g) => {
        const f = g.s.flags;
        if (f.l05_hunted && !f.l05_dissolved) return g.say('它就在門口，咕嚕咕嚕地響。現在躺下去，就再也起不來了。');
        if (!f.l05_rested) {
          g.flag('l05_rested'); g.sanity(10);
          g.flag('l05_hunted'); g.flag('l05_pursuit', 4); g.sfx('groan');
          return g.say('你一躺下就睡著了。醒來時，房間裡多了一個聲音：咕嚕、咕嚕。門口站著一個人形的東西，像一團凝膠，臉往一邊垂。它朝你伸出手。');
        }
        if (!once(g, 'l05_slept')) return g.say('你又躺了一會兒。床墊還是濕的。');
        g.sanity(20); g.checkpoint();
        g.say('這一次，沒有咕嚕聲。你把濕透的床墊翻過來，睡了很久很久。夢裡你在家，水龍頭沒關緊。');
      }),
      { ...hit('cart', boxRect(medCart, 6), '藥品推車', (g) => {
        if (!once(g, 'l05_med')) return g.say('推車上只剩空藥瓶和發霉的紗布。');
        g.give('almond', '推車最下層塞著一瓶杏仁水。瓶身上貼著醫院的標籤，寫著一個你看不懂的床號。');
      }, 'take') },
      hit('forward', bounds(faceQuad(-0.5, -0.6, 0.5, 1, 6), 4), '走進醫院深處', (g) => { chaseStep(g); g.go('l05_corridor'); }, 'go'),
    ],
  },

  l05_corridor: {
    level: '0.5', title: '醫院走廊', room: corridorR, hazard: huntLabel, update: huntTick,
    enter(g, { first }) {
      chaseStep(g);
      if (first) g.say('走廊很長。瓦礫從塌下來的吊頂一路堆到地上，只留下一道窄縫。腐肉的味道是從前面傳來的。');
    },
    draw(ctx, t, s, R) {
      for (let i = 0; i < 9; i++) {
        const x = -0.9 + ((i * 0.43) % 1.6), z = 3.2 + (i % 3) * 0.3, sz = 0.18 + (i % 4) * 0.06;
        box(ctx, R, { x1: x, x2: x + sz * 1.5, y1: 1 - sz - (i % 2) * 0.2, y2: 1, z1: z, z2: z + sz, color: i % 2 ? '#6c6a5c' : '#5a5848', edge: true });
      }
      box(ctx, R, { x1: 0.2, x2: 1.2, y1: -0.2, y2: 1, z1: 3.6, z2: 4.2, color: '#4e4c40', edge: true });
      for (let i = 0; i < 6; i++) { const a = t * 3 + i, p = P(Math.sin(a) * 0.4, -0.3 + Math.cos(a * 1.3) * 0.2, 3); ctx.fillStyle = '#111'; ctx.fillRect(p[0], p[1], 2, 2); }
      drawChaser(ctx, s, t);
    },
    hotspots: [
      back('l05_ward', '回到病房'),
      hit('rubble', [500, 200, 160, 230], '瓦礫堆', (g) => g.say('混凝土塊、扭彎的鐵架、一隻鞋。味道是從瓦礫底下傳出來的。你沒有去翻。')),
      hit('forward', [370, 200, 120, 150], '從瓦礫的窄縫鑽過去', (g) => {
        const f = g.s.flags;
        if (!f.l05_rested) return g.say('你試著往縫裡擠，手腳卻軟得使不上力。你已經好幾天沒睡了。先找張床。');
        if (f.l05_hunted && !f.l05_dissolved) {
          chaseStep(g);
          return g.go('l05_platform', { msg: '你鑽過瓦礫，沿著走廊一直跑、一直跑——盡頭又是那座平台，平台下又是那片積水，像這一層在跟你開一個很爛的玩笑。它還在後面。' });
        }
        g.go('l05_stairs', { msg: '你沿著走廊走了很久。牆上的油漆換了顏色，門牌上的字變得陌生——醫院好像在不知不覺間變成了別的地方。然後你看見了樓梯。' });
      }, 'go'),
    ],
  },

  l05_stairs: {
    level: '0.5', title: '金屬格柵樓梯', room: stairsR,
    enter(g, { first }) { if (first) g.say('一道金屬格柵樓梯往下延伸。底下吹上來的風又冷又乾，很安靜——安靜得像停車場。'); },
    draw(ctx, t, s, R) {
      for (let i = 0; i < 9; i++) {
        const y = 300 + i * 24, w = 90 + i * 40;
        ctx.fillStyle = i % 2 ? '#5d6865' : '#3a4846'; ctx.fillRect(480 - w / 2, y, w, 16);
        for (let x = 480 - w / 2; x < 480 + w / 2; x += 10) seg(ctx, [x, y], [x, y + 16], '#1d2b29', 2);
      }
      seg(ctx, [400, 300], [180, 520], '#7c8a86', 5); seg(ctx, [560, 300], [780, 520], '#7c8a86', 5);
      const pool = [P(0.6, 1, 2.0), P(1.2, 1, 2.0), P(1.2, 1, 3.4), P(0.6, 1, 3.4)];
      poly(ctx, pool, 'rgba(120,200,220,0.35)'); glow(ctx, bounds(pool)[0] + 40, bounds(pool)[1] + 20, 60, 'rgba(140,220,240,0.3)');
      txt(ctx, 'P1', 480, 280, '#9bb5a8', 18);
    },
    hotspots: [
      back('l05_corridor', '回到醫院走廊'),
      hit('pool', [620, 345, 150, 65], '樓梯旁一窪清澈的水', (g) => g.say('格柵底下有一窪很清的水，溫溫的，有一股游泳池的氯味。水底看不見盡頭。你盯著它看了很久，最後還是沒有下去。')),
      hit('forward', [380, 290, 200, 120], '下樓', (g) => { g.flag('l1_via_flood'); g.flag('l1_fresh', 'flood'); g.go('l1_arrive', { msg: '你走下格柵樓梯，雙膝一軟跪在冰冷的水泥地上。很安靜，很冷，很乾。你在那裡跪了很久，才想起來要呼吸。' }); }, 'go'),
    ],
  },

  // ------------------------------------------------------------- 0.7
  l07_modern: {
    level: '0.7', title: '1950 年—至今', room: modernR,
    viewMsg: '觀景窗裡，這條走廊的日光燈是另一種款式。肉眼看過去，你分不出差別。',
    enter(g, { first }) {
      if (first) g.say('這裡跟 Level 0 一模一樣。一樣的牆紙，一樣的燈，一樣的嗡嗡聲。只是左邊那個門口裡，塞滿了閃爍的彩色條紋，像一台收不到訊號的老電視。');
    },
    draw(ctx, t, s, R) {
      tvStatic(ctx, staticDoor, t, true); outline(ctx, staticDoor, shade(R, '#7a6a30', 2.5), 2);
      if (!s.flags.l07_outlet) {
        poly(ctx, outletQ, shade(R, '#e8e0c8', 2)); const c = bounds(outletQ);
        ctx.fillStyle = '#2a2418'; ctx.fillRect(c[0] + c[2] * 0.35, c[1] + c[3] * 0.3, 2, 5); ctx.fillRect(c[0] + c[2] * 0.6, c[1] + c[3] * 0.3, 2, 5);
      } else poly(ctx, outletQ, shade(R, '#4a3c1a', 2));
      const far = P(0, -0.3, 8); glow(ctx, far[0], far[1], 60, 'rgba(255,170,80,0.35)');
    },
    hotspots: [
      back('l0_faded', '朝更現代的燈光走，回到 Level 0', '你一直朝比較新的燈光走。日光燈管、米色壁紙……最後是那間褪了色的房間。'),
      hit('forward', [420, 210, 120, 120], '往燈光比較舊的地方走', (g) => g.go('l07_bulbs'), 'go'),
      hit('static', bounds(staticDoor, 4), '塞滿雜訊的門口', (g) => { g.sanity(-3); g.sfx('static'); g.say('你的手一碰到那層條紋就被彈了回來，指尖麻了好久。本該是出口的地方，全被這種東西封住了。'); }),
      { ...hit('outlet', bounds(outletQ, 12), '牆上的插座', (g) => {
        g.flag('l07_outlet'); g.give('outlet', '你用指甲把米色的塑膠面板摳了下來。再往裡走，就再也看不到這種東西了。');
      }, 'take'), when: (s) => !s.flags.l07_outlet },
    ],
  },

  l07_bulbs: {
    level: '0.7', title: '1800—1950 年', room: bulbsR,
    enter(g, { first }) {
      if (g.s.flags.l07_rift && !g.s.flags.l07_rift_seen) { g.flag('l07_rift_seen'); return; }
      if (first) g.say('日光燈沒了，天花板上垂著一顆一顆白熾燈泡，再往前是蠟燭。牆紙的花紋越來越繁複。你找不到任何一個插座。');
    },
    draw(ctx, t, s, R) {
      damask(ctx, R, 1.2, 8, '#7a5a24');
      bulb(ctx, R, 0, 2, t); bulb(ctx, R, 0, 3.8, t);
      for (const z of [5.2, 6.6]) for (const sd of [-1, 1]) candle(ctx, R, sd * 1.15, -0.25, z, t);
      poly(ctx, peelQ, shade(R, '#8a6a30', 2.7));
      const pq = bounds(peelQ); ctx.fillStyle = shade(R, '#d8c890', 2.7); ctx.beginPath(); ctx.moveTo(pq[0] + pq[2], pq[1]); ctx.lineTo(pq[0] + pq[2] * 1.6, pq[1] + pq[3] * 0.4); ctx.lineTo(pq[0] + pq[2], pq[1] + pq[3] * 0.6); ctx.fill();
      if (!s.flags.l07_pack) box(ctx, R, rucksack);
      else box(ctx, R, { ...rucksack, y1: 0.8 });
      const nt = P(-0.72, 0.62, 2.2); txt(ctx, 'N.T.G.', nt[0], nt[1] + 14, shade(R, '#d8d0a0', 2.2), 9);
      if (s.flags.l07_rift) { tvStatic(ctx, riftQ, t, true); glow(ctx, bounds(riftQ)[0], bounds(riftQ)[1] + 60, 70, 'rgba(200,200,255,0.3)'); }
    },
    hotspots: [
      back('l07_modern', '往日光燈的方向走'),
      hit('forward', [420, 200, 120, 130], '往蠟燭更多的地方走', (g) => g.go('l07_hall'), 'go'),
      hit('peel', bounds(peelQ, 6), '翹起來的牆紙', (g) => { g.sanity(-6); g.say('你撕下一角牆紙。顏料的粉末沾在手指上，聞起來是甜的。你手一抖，想起了以前在哪裡讀過：鉛也是甜的。'); }),
      hit('candle', [550, 225, 60, 45], '牆上的蠟燭', (g) => { g.sanity(-5); g.sfx('steam'); g.say('你湊近一根蠟燭，火苗「呼」地竄上了牆紙——又自己熄了，像有什麼東西把它掐掉。這一層不喜歡火燒到別的地方。'); }),
      { ...hit('pack', boxRect(rucksack, 8), 'N.T.G. 的背包', (g) => {
        if (once(g, 'l07_pack')) { g.drink(25); g.sfx('drink'); }
        g.read('n07_ntg', () => { if (g.s.flags.l07_pack === true && !g.s.flags.l07_pack_said) { g.flag('l07_pack_said'); g.say('背包側袋裡有一個水壺，還剩一點水。你喝光了。'); } });
      }) },
      { ...hit('rift', bounds(riftQ, 4), '閃爍的牆', (g) => g.go('l1_old', {
        msg: '你縱身跳進那面牆。眼前一黑——然後是一股乾草和馬糞的味道。',
      }), 'go'), when: (s) => s.flags.l07_rift },
    ],
  },

  l07_hall: {
    level: '0.7', title: '維多利亞大廳', room: hallR,
    viewMsg: '觀景窗裡，右邊門口趴著一個四隻腳的東西，臉貼在地上，嘴在動。',
    enter(g, { first }) {
      if (first) g.say('天花板高得看不見。水晶吊燈從黑暗裡垂下來，鏈子長得沒有盡頭。左邊掛著一幅掛毯，右邊的門口裡……有人在說話。');
      else if (Math.random() < 0.5) g.say('右邊的門口又傳來那個聲音：「喂——這邊！我也是流浪者！你聽得見嗎？」');
    },
    draw(ctx, t, s, R) {
      for (const sd of [-1, 1]) {
        const q = [P(sd * 1.4, -1, 1), P(sd * 1.4, -1, 8), P(sd * 1.4, -9, 8), P(sd * 1.4, -9, 1)];
        const [x, y, w, h] = bounds(q); const gr = ctx.createLinearGradient(0, y + h, 0, 0);
        gr.addColorStop(0, shade(R, '#9a7b3e', 3, 0.8)); gr.addColorStop(1, '#000');
        poly(ctx, q, gr);
        for (let z = 1.6; z < 8; z += 1.2) seg(ctx, P(sd * 1.4, 1, z), P(sd * 1.4, -9, z), shade(R, '#c8a050', z, 1, 0.4), 2);
      }
      poly(ctx, faceQuad(-1.4, -9, 1.4, -1, 8), '#050301');
      damask(ctx, R, 1.4, 8, '#c8a050');
      for (const z of [3, 5.6]) {
        const top = P(0, -9, z), c = P(0, -0.55, z), r = 50 / z;
        seg(ctx, top, c, '#5a4318', 1.5);
        for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI; ctx.fillStyle = '#fff3c8'; ctx.beginPath(); ctx.arc(c[0] + Math.cos(a) * r * 1.6, c[1] + Math.sin(a) * r * 0.4, 2.4, 0, Math.PI * 2); ctx.fill(); }
        glow(ctx, c[0], c[1], 220 / z, 'rgba(255,210,130,0.5)', candleFlick(t + z));
      }
      poly(ctx, tapestry, shade(R, '#6a2a24', 2.6));
      outline(ctx, tapestry, shade(R, '#c8a050', 2.6), 3);
      const tb = bounds(tapestry);
      for (let i = 0; i < 3; i++) {
        const cx = tb[0] + tb[2] * (0.3 + i * 0.22), cy = tb[1] + tb[3] * 0.45;
        drawSmiler(ctx, cx, cy, 0.18 + i * 0.03, 0.6, t);
        seg(ctx, [cx - 8, cy + 18], [cx + 10, cy + 6], '#c8a050', 2);
      }
      for (const z of [2.2, 4.9, 6.4]) candle(ctx, R, 1.35, -0.2, z, t, 0.8);
      const vd = bounds(voiceDoor); ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(vd[0] + 2, vd[1] + 2, vd[2] - 4, vd[3] - 4);
    },
    drawView(ctx, t) {
      const vd = bounds(voiceDoor), x = vd[0] + vd[2] / 2, y = vd[1] + vd[3] - 6;
      ctx.save(); ctx.fillStyle = 'rgba(10,20,10,0.9)';
      ctx.beginPath(); ctx.ellipse(x, y - 14, 24, 10, 0, 0, Math.PI * 2); ctx.fill();
      for (const dx of [-20, -8, 8, 20]) ctx.fillRect(x + dx - 2, y - 10, 3, 12);
      ctx.beginPath(); ctx.ellipse(x - 26, y - 8, 8, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(220,255,230,0.8)'; ctx.fillRect(x - 30, y - 9, 6, 2 + Math.abs(Math.sin(t * 6)) * 2);
      ctx.restore();
    },
    hotspots: [
      back('l07_bulbs', '往燈泡的方向走'),
      hit('forward', [420, 200, 120, 140], '繼續往深處走', (g) => { g.flag('l07_castle_n', 0); g.go('l07_castle'); }, 'go'),
      hit('tapestry', bounds(tapestry, 4), '掛毯', (g) => g.say('掛毯上繡著幾個咧著嘴笑的東西，在拉小提琴、吹號角、彈魯特琴。繡工很細，連牙齒都一顆一顆繡了出來。它們看起來很快樂。')),
      hit('voice', bounds(voiceDoor, 4), '回應門口的呼喊', (g) => g.scare('l07_hall', '你朝門口走了兩步，喊了一聲「我在這裡」。門裡的東西不再說話了。它四肢著地衝了出來——你轉身就跑，背後的聲音一直在學你剛才那一聲。', 18, 'figure')),
    ],
  },

  l07_castle: {
    level: '0.7', title: '中世紀石廊', room: castleR,
    hazard: () => '15°C・黑暗中有東西・跟著火把走',
    enter(g, { first }) {
      const lit = ['left', 'right', 'ahead'][Math.floor(Math.random() * 3)];
      g.flag('l07_lit', lit);
      if (first) g.say('黃色的石頭砌成的城堡走廊。冷，大約只有十五度。三個拱門，只有一個旁邊點著火把。別的拱門後面黑得像墨——那種黑裡有東西在動。');
    },
    draw(ctx, t, s, R) {
      stoneBlocks(ctx, R, 1.2, 6, '#5a4a24');
      for (const [k, q] of Object.entries(ARCH)) { poly(ctx, q, '#030201'); outline(ctx, q, shade(R, '#6a5a30', 3), 3); void k; }
      const holes = [];
      const own = torch(ctx, R, 1.18, -0.5, 1.4, t); holes.push(own);
      const [x, y, z] = TORCH_AT[s.flags.l07_lit] || TORCH_AT.ahead;
      holes.push(torch(ctx, R, x, y, z, t));
      darkness(ctx, 0.82, holes);
      const n = s.flags.l07_castle_n || 0;
      if (n > 0) txt(ctx, '・'.repeat(n), 480, 120, '#a08b4c', 16);
      for (const k of Object.keys(ARCH)) {
        if (k === s.flags.l07_lit) continue;
        const [bx, by, bw, bh] = bounds(ARCH[k]); const e = Math.sin(t * 0.8 + bx) > 0.92;
        if (e) { ctx.fillStyle = 'rgba(255,240,200,0.7)'; ctx.fillRect(bx + bw / 2 - 6, by + bh * 0.4, 3, 2); ctx.fillRect(bx + bw / 2 + 3, by + bh * 0.4, 3, 2); }
      }
    },
    hotspots: [
      back('l07_hall', '退回大廳'),
      ...Object.keys(ARCH).map((k) => hit(k, bounds(ARCH[k], 4), { left: '走進左邊的拱門', right: '走進右邊的拱門', ahead: '走進前面的拱門' }[k], (g) => {
        const f = g.s.flags;
        if (k !== f.l07_lit) {
          g.flag('l07_castle_n', 0);
          return g.scare('l07_castle', '沒有火把的房間裡，有什麼東西一直在等。你只看見一隻手——手肘的位置不對，手指太多——然後你已經在原來的走廊裡，背貼著石牆喘氣。', 15, 'claws');
        }
        const n = (f.l07_castle_n || 0) + 1;
        if (n >= CASTLE_STEPS) { g.flag('l07_castle_n', 0); return g.go('l07_rome', { msg: '火把一支接一支，最後一支插在一根大理石柱上。石廊忽然往兩邊、往上，張開成一個大得不可能的廳。' }); }
        g.flag('l07_castle_n', n);
        g.go('l07_castle', { msg: '你跟著火光走。又是一段石廊，又是三個拱門。' });
      }, 'go')),
      hit('torch', [845, 120, 80, 110], '身邊牆上的火把', (g) => g.say('你想把火把拔下來帶走。它像是長在牆上一樣，紋絲不動。你用力一扳，火苗縮了一下，木柄上掉下一層灰——你趕緊鬆手。據說離開牆的火把會立刻熄滅，碎成一把灰。')),
    ],
  },

  l07_rome: {
    level: '0.7', title: '羅馬大理石廳', room: romeR,
    enter(g, { first }) {
      if (first) g.say('大理石柱一根一根往上長，長到看不見頂。柱子之間站著巨大的雕像。地上躺著一架雙翼飛機的殘骸，機翼斷成了兩截。');
    },
    draw(ctx, t, s, R) {
      for (const c of columns.slice().sort((a, b) => b.z - a.z)) {
        const q = [P(c.x - 0.22, 1, c.z), P(c.x + 0.22, 1, c.z), P(c.x + 0.22, -14, c.z), P(c.x - 0.22, -14, c.z)];
        const [x, y, w, h] = bounds(q); const gr = ctx.createLinearGradient(0, y + h, 0, 0);
        gr.addColorStop(0, shade(R, '#e6dec4', c.z)); gr.addColorStop(1, '#0a0806');
        poly(ctx, q, gr);
        for (let i = 1; i < 4; i++) seg(ctx, P(c.x - 0.22 + i * 0.11, 1, c.z), P(c.x - 0.22 + i * 0.11, -14, c.z), shade(R, '#b8ae90', c.z, 1, 0.5), 1);
        box(ctx, R, { x1: c.x - 0.3, x2: c.x + 0.3, y1: 0.88, y2: 1, z1: c.z - 0.05, z2: c.z + 0.45, color: '#d0c6a8' });
      }
      box(ctx, R, statueBox);
      poly(ctx, faceQuad(-0.4, -0.3, 0.4, 1, 9), '#0c0904'); outline(ctx, faceQuad(-0.4, -0.3, 0.4, 1, 9), shade(R, '#b8ae90', 9), 2);
      const st = P(-0.9, 0.55, 7.4); const sc = 2.6 / 7.4;
      ctx.save(); ctx.fillStyle = shade(R, '#e0d8bd', 7.4);
      ctx.beginPath(); ctx.ellipse(st[0], st[1] - 300 * sc, 60 * sc, 70 * sc, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(st[0] - 50 * sc, st[1] - 240 * sc, 100 * sc, 240 * sc);
      for (const dx of [-1, 1]) for (const k of [0, 1]) seg(ctx, [st[0] + dx * 48 * sc, st[1] - (220 - k * 50) * sc], [st[0] + dx * (110 + k * 20) * sc, st[1] - (140 - k * 40) * sc], ctx.fillStyle, 16 * sc);
      ctx.strokeStyle = shade(R, '#8a826a', 7.4); ctx.lineWidth = 3 * sc * 2;
      ctx.beginPath(); ctx.arc(st[0], st[1] - 295 * sc, 40 * sc, 0.2, Math.PI - 0.2); ctx.stroke();
      ctx.restore();
      const man = P(1.2, 1, 5.6), ms = 2.4 / 5.6;
      ctx.save(); ctx.fillStyle = shade(R, '#d8d0b4', 5.6);
      ctx.fillRect(man[0] - 30 * ms, man[1] - 260 * ms, 60 * ms, 200 * ms); ctx.beginPath(); ctx.arc(man[0], man[1] - 290 * ms, 28 * ms, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(man[0] - 70 * ms, man[1] - 305 * ms, 40 * ms, 26 * ms); seg(ctx, [man[0] - 20 * ms, man[1] - 240 * ms], [man[0] - 55 * ms, man[1] - 290 * ms], ctx.fillStyle, 14 * ms);
      ctx.restore();
      poly(ctx, planeQ, shade(R, '#7a6a4a', 3.2)); outline(ctx, planeQ, shade(R, '#4a3a20', 3.2), 2);
      const prop = P(-0.95, 0.92, 2.9); seg(ctx, [prop[0] - 30, prop[1] - 20], [prop[0] + 26, prop[1] + 16], shade(R, '#5a4020', 2.9), 5);
    },
    hotspots: [
      back('l07_castle', '退回石廊'),
      hit('forward', [445, 245, 70, 70], '穿過雕像旁邊的門', (g) => g.go('l07_egypt', { msg: '大理石變成了砂岩。走廊開始彎，一直彎，牆上全是刻痕。嗡嗡聲變了——變成很多很多翅膀在振動。' }), 'go'),
      hit('statue', [545, 175, 75, 145], '舉著方盒的雕像', (g) => g.say('一尊穿長袍的男人雕像，舉著一個方方正正的東西貼在右眼前，像在拍攝什麼。雕像的臉被磨平了。底座上刻著一行拉丁字母，你只認得最後四個：0120。')),
      hit('idol', [395, 170, 55, 125], '咧嘴的巨像', (g) => g.say('一尊沒有五官、只有一張大嘴的巨像。嘴角咧到耳根。雕刻的人顯然見過它本人。')),
      hit('plane', bounds(planeQ, 8), '雙翼飛機的殘骸', (g) => g.read('n07_plane')),
    ],
  },

  l07_egypt: {
    level: '0.7', title: '埃及回廊', room: egyptR, hum: () => 'ahead',
    hazard: () => '翅膀振動聲・前方黑暗中有眼睛',
    trap: { after: 12, run: (g) => g.scare('l07_rome', '黑暗裡那對貓一樣的眼睛一下子到了你面前，底下是一嘴獅子的獠牙。你轉身就跑，翅膀的聲音追了你很久很久。', 20, 'growler') },
    enter(g, { first }) {
      g.flag('l07_eyes', 0);
      if (first) g.say('砂岩回廊彎彎曲曲，牆上刻滿了誰也讀不懂的符號。油燈在壁龕裡燒著。前面的黑暗裡，有一對眼睛亮了起來。別待太久。');
    },
    draw(ctx, t, s, R) {
      stoneBlocks(ctx, R, 1.2, 6, '#7a5a28');
      for (const sd of [-1, 1]) for (let z = 1.5; z < 6; z += 0.9) { const p = P(sd * 1.2, -0.75, z); glyphs(ctx, p[0] - (sd > 0 ? 40 / z * 2 : 0), p[1], 40 / z * 2, 60 / z * 2, shade(R, '#4a3414', z)); }
      poly(ctx, carving, shade(R, '#c8a860', 2.6)); outline(ctx, carving, shade(R, '#5a4018', 2.6), 3);
      const cb = bounds(carving); glyphs(ctx, cb[0] + 4, cb[1] + 10, cb[2] - 8, cb[3] - 20, shade(R, '#4a3010', 2.6), true);
      poly(ctx, alcove, '#1a1006'); outline(ctx, alcove, shade(R, '#5a4018', 2.8), 3);
      candle(ctx, R, 1.15, 0.35, 3.1, t, 0.7);
      poly(ctx, deepQ, '#020100');
      const k = growlerT(s.flags.l07_eyes ?? 0);
      const holes = [[P(1.15, 0.2, 3.1)[0], P(1.15, 0.2, 3.1)[1], 160], [P(-1.2, 0, 2.2)[0] + 60, P(-1.2, 0, 2.2)[1], 200]];
      darkness(ctx, 0.6, holes);
      const gz = 9 - k * 6, gp = P(0, -0.2, gz);
      drawGrowler(ctx, gp[0], gp[1], 0.9 / gz * 2.2, 0.35 + k * 0.65, t);
    },
    update(g, dt) { g.s.flags.l07_eyes = (g.s.flags.l07_eyes || 0) + dt; },
    hotspots: [
      { ...back('l07_rome', '慢慢退回大理石廳'), click: (g) => { g.flag('l07_eyes', 0); g.go('l07_rome'); } },
      hit('carving', bounds(carving, 4), '牆上的刻痕', (g) => {
        if (!once(g, 'l07_rubbing')) return g.say('刻痕裡有一個人形，舉著一個方盒貼在眼前。底下是四個你看得懂的符號。');
        g.give('rubbing', '你用紙和炭筆把整面刻痕拓了下來。拓完才發現，那些讀不懂的符號中間，有一個舉著方盒的小人，和四個你看得懂的數字。');
      }, 'take'),
      hit('alcove', bounds(alcove, 4), '在壁龕裡躺下', (g) => { g.flag('l07_eyes', 0); sleepHere(g); }),
      hit('deeper', bounds(deepQ, 4), '走進黑暗', (g) => { g.flag('l07_eyes', 0); g.scare('l07_rome', '你往黑暗裡走了一步。那對眼睛一眨不眨地等著你走第二步——你沒有走，你在跑。', 20, 'growler'); }),
    ],
  },
};

function bottleIcon(ctx, x, y) {
  ctx.fillStyle = '#e9e1c1'; ctx.fillRect(x - 5, y - 18, 10, 16); ctx.fillRect(x - 2, y - 24, 4, 6);
  ctx.fillStyle = '#3f6fb0'; ctx.fillRect(x - 3, y - 26, 6, 3);
}
