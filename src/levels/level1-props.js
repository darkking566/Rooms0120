// Shared procedural prop renderers for Level 1 so rooms show recognizable geometry instead of plain boxes.
import { P, box, boxRect, poly, seg, shade } from '../render.js';
import { txt } from './sublevel-kit.js';

function propMetrics(b) {
  const [x, y, w, h] = boxRect(b);
  return { x, y, w, h, cx: x + w * 0.5, by: y + h, z: (b.z1 + b.z2) * 0.5 };
}

function shadow(ctx, cx, by, rx, ry = Math.max(4, rx * 0.18)) {
  ctx.fillStyle = 'rgba(0,0,0,0.34)';
  ctx.beginPath();
  ctx.ellipse(cx, by + 2, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawWoodCrate(ctx, R, b, { stencil = '' } = {}) {
  const { x, y, w, h, cx, by, z } = propMetrics(b);
  shadow(ctx, cx, by, w * 0.52);
  box(ctx, R, b);
  ctx.save();
  ctx.strokeStyle = shade(R, '#3e2d1a', z);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
  // Horizontal plank seams & diagonal brace
  for (const k of [0.33, 0.66]) {
    seg(ctx, [x + 2, y + h * k], [x + w - 2, y + h * k], ctx.strokeStyle, 1);
  }
  seg(ctx, [x + 3, y + 3], [x + w - 3, y + h - 3], ctx.strokeStyle, 1.4);
  if (stencil) {
    txt(ctx, stencil, cx, y + h * 0.55, shade(R, '#1f1a12', z), Math.max(8, Math.min(12, w * 0.18)));
  }
  ctx.restore();
}

export function drawTable(ctx, R, b, { drawers = false, lamp = false } = {}) {
  const { x, y, w, h, cx, by, z } = propMetrics(b);
  const topH = Math.max(6, h * 0.18);
  const legW = Math.max(4, w * 0.06);
  ctx.save();
  shadow(ctx, cx, by, w * 0.5);
  // Four legs
  ctx.fillStyle = shade(R, b.color || '#4a3e30', z, 0.65);
  ctx.fillRect(x + w * 0.07, y + topH, legW, h - topH);
  ctx.fillRect(x + w * 0.93 - legW, y + topH, legW, h - topH);
  ctx.fillStyle = shade(R, b.color || '#4a3e30', z, 0.48);
  ctx.fillRect(x + w * 0.2, y + topH, legW * 0.85, (h - topH) * 0.88);
  ctx.fillRect(x + w * 0.8 - legW, y + topH, legW * 0.85, (h - topH) * 0.88);
  if (drawers) {
    ctx.fillStyle = shade(R, b.color || '#524638', z, 0.85);
    ctx.fillRect(x + w * 0.62, y + topH, w * 0.3, h * 0.56);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + w * 0.62, y + topH, w * 0.3, h * 0.28);
    ctx.strokeRect(x + w * 0.62, y + topH + h * 0.28, w * 0.3, h * 0.28);
  }
  // Tabletop (perspective slab)
  box(ctx, R, { ...b, y2: b.y1 + (b.y2 - b.y1) * 0.22 });
  if (lamp) {
    const lx = x + w * 0.22, ly = y;
    ctx.strokeStyle = '#383d40'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx - 4, ly - 16); ctx.lineTo(lx + 10, ly - 22); ctx.stroke();
    ctx.fillStyle = '#5c7864';
    ctx.beginPath(); ctx.moveTo(lx + 4, ly - 24); ctx.lineTo(lx + 18, ly - 18); ctx.lineTo(lx + 2, ly - 16); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

export function drawShelfRack(ctx, R, b, { tiers = 3, frosted = false } = {}) {
  const { x, y, w, h, cx, by, z } = propMetrics(b);
  ctx.save();
  shadow(ctx, cx, by, w * 0.5);
  const steel = shade(R, frosted ? '#9ab0bc' : (b.color || '#5e656b'), z);
  const darkSteel = shade(R, frosted ? '#5e7480' : '#32363a', z);
  // Open vertical steel posts
  ctx.fillStyle = darkSteel;
  for (const px of [x + 2, x + w * 0.34, x + w * 0.66, x + w - 5]) {
    ctx.fillRect(px, y, 4, h);
  }
  // Horizontal shelf tiers with small cartons/cans resting on them
  for (let i = 0; i < tiers; i++) {
    const sy = y + h * (0.14 + (i * 0.72) / Math.max(1, tiers - 1));
    ctx.fillStyle = steel;
    ctx.fillRect(x, sy, w, 5);
    ctx.fillStyle = shade(R, frosted ? '#c4dce8' : '#856944', z);
    ctx.fillRect(x + w * 0.14, sy - h * 0.14, w * 0.24, h * 0.14);
    ctx.fillStyle = shade(R, frosted ? '#dceef6' : '#6c5438', z);
    ctx.fillRect(x + w * 0.52, sy - h * 0.12, w * 0.22, h * 0.12);
  }
  ctx.restore();
}

export function drawSedan(ctx, R, b) {
  const { x, y, w, h, cx, by, z } = propMetrics(b);
  ctx.save();
  shadow(ctx, cx, by, w * 0.54);
  const body = shade(R, b.color || '#4e565e', z);
  const roof = shade(R, '#68727c', z);
  // Lower body
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.roundRect(x, y + h * 0.42, w, h * 0.44, [8, 12, 4, 4]);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
  // Cabin & windows
  ctx.fillStyle = roof;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.18, y + h * 0.44);
  ctx.lineTo(x + w * 0.32, y + h * 0.08);
  ctx.lineTo(x + w * 0.72, y + h * 0.08);
  ctx.lineTo(x + w * 0.88, y + h * 0.44);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#18222a';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.24, y + h * 0.41);
  ctx.lineTo(x + w * 0.35, y + h * 0.14);
  ctx.lineTo(x + w * 0.69, y + h * 0.14);
  ctx.lineTo(x + w * 0.82, y + h * 0.41);
  ctx.closePath(); ctx.fill();
  // Headlights & dusty wheels
  ctx.fillStyle = '#c8c4a8';
  ctx.fillRect(x + w * 0.04, y + h * 0.55, w * 0.08, h * 0.1);
  for (const wx of [x + w * 0.24, x + w * 0.76]) {
    ctx.fillStyle = '#141618';
    ctx.beginPath(); ctx.arc(wx, by - h * 0.14, h * 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#787e84';
    ctx.beginPath(); ctx.arc(wx, by - h * 0.14, h * 0.07, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function drawPumpUnit(ctx, R, b) {
  const { x, y, w, h, cx, by, z } = propMetrics(b);
  ctx.save();
  shadow(ctx, cx, by, w * 0.52);
  // Baseplate
  ctx.fillStyle = shade(R, '#2c3430', z);
  ctx.fillRect(x, by - h * 0.14, w, h * 0.14);
  // Cylindrical motor housing
  const gr = ctx.createLinearGradient(0, y + h * 0.25, 0, by - h * 0.14);
  gr.addColorStop(0, shade(R, '#587866', z)); gr.addColorStop(1, shade(R, '#2c4236', z));
  ctx.fillStyle = gr;
  ctx.beginPath(); ctx.roundRect(x + w * 0.08, y + h * 0.26, w * 0.64, h * 0.6, 10); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
  // Vertical discharge pipe & flange
  ctx.fillStyle = shade(R, '#445a4e', z);
  ctx.fillRect(x + w * 0.54, y, w * 0.18, h * 0.34);
  ctx.fillRect(x + w * 0.49, y, w * 0.28, h * 0.07);
  // Spoked red valve wheel on right
  const wx = x + w * 0.84, wy = y + h * 0.48, wr = Math.max(10, Math.min(w, h) * 0.22);
  ctx.strokeStyle = shade(R, '#b8382a', z); ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.arc(wx, wy, wr, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(wx - wr, wy); ctx.lineTo(wx + wr, wy);
  ctx.moveTo(wx, wy - wr); ctx.lineTo(wx, wy + wr);
  ctx.stroke();
  ctx.restore();
}

export function drawWasher(ctx, R, b, t = 0, spinning = false) {
  const { x, y, w, h, cx, by, z } = propMetrics(b);
  ctx.save();
  shadow(ctx, cx, by, w * 0.48);
  ctx.fillStyle = shade(R, '#a4acb2', z);
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 4); ctx.fill();
  ctx.strokeStyle = shade(R, '#444a4e', z); ctx.lineWidth = 1.5; ctx.stroke();
  // Top control strip
  ctx.fillStyle = shade(R, '#4a5258', z);
  ctx.fillRect(x + 2, y + 3, w - 4, h * 0.18);
  ctx.fillStyle = spinning ? '#52e07c' : '#8a9298';
  ctx.beginPath(); ctx.arc(x + w * 0.8, y + h * 0.12, 3, 0, Math.PI * 2); ctx.fill();
  // Glass porthole drum
  const dr = Math.min(w, h) * 0.28, dy = y + h * 0.58;
  ctx.fillStyle = '#1a2024';
  ctx.beginPath(); ctx.arc(cx, dy, dr, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = shade(R, '#d4dce0', z); ctx.lineWidth = 3; ctx.stroke();
  if (spinning) {
    const a = t * 5;
    ctx.strokeStyle = 'rgba(200,210,220,0.45)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, dy, dr * 0.65, a, a + 1.8); ctx.stroke();
  }
  ctx.restore();
}

export function drawWireCart(ctx, R, b) {
  const { x, y, w, h, cx, by, z } = propMetrics(b);
  ctx.save();
  shadow(ctx, cx, by, w * 0.48);
  // Wheels
  ctx.fillStyle = '#222628';
  for (const wx of [x + w * 0.16, x + w * 0.84]) {
    ctx.beginPath(); ctx.arc(wx, by - 4, 5, 0, Math.PI * 2); ctx.fill();
  }
  // Folded grey M.E.G. jumpsuits inside basket
  ctx.fillStyle = shade(R, '#6e767c', z);
  ctx.beginPath(); ctx.roundRect(x + w * 0.12, y + h * 0.12, w * 0.76, h * 0.3, 5); ctx.fill();
  // Wire basket frame
  ctx.strokeStyle = shade(R, '#aeb6bc', z); ctx.lineWidth = 2;
  ctx.strokeRect(x + w * 0.06, y + h * 0.24, w * 0.88, h * 0.58);
  for (let i = 1; i < 4; i++) {
    seg(ctx, [x + w * (0.06 + i * 0.22), y + h * 0.24], [x + w * (0.06 + i * 0.22), y + h * 0.82], ctx.strokeStyle, 1);
  }
  ctx.restore();
}

export function drawSinkBasins(ctx, R, b, t = 0) {
  const { x, y, w, h, cx, by, z } = propMetrics(b);
  ctx.save();
  // Drain pipes underneath
  ctx.strokeStyle = shade(R, '#6c7478', z); ctx.lineWidth = 4;
  for (const bx of [x + w * 0.28, x + w * 0.72]) {
    ctx.beginPath(); ctx.moveTo(bx, y + h * 0.35); ctx.lineTo(bx, by); ctx.stroke();
    // Porcelain basin
    ctx.fillStyle = shade(R, '#d4dcda', z);
    ctx.beginPath(); ctx.roundRect(bx - w * 0.18, y + h * 0.14, w * 0.36, h * 0.24, [3, 3, 12, 12]); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
    // Curved chrome faucet
    ctx.strokeStyle = shade(R, '#b4bec2', z); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(bx, y + h * 0.14); ctx.quadraticCurveTo(bx, y, bx + 6, y + h * 0.08); ctx.stroke();
  }
  // Animated water drop on left faucet
  const dropY = y + h * 0.08 + ((t * 40) % 24);
  ctx.fillStyle = 'rgba(180,225,245,0.75)';
  ctx.beginPath(); ctx.arc(x + w * 0.28 + 6, dropY, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function drawBunkBed(ctx, R, low, high) {
  const { x: lx, y: ly, w: lw, h: lh, cx, by, z } = propMetrics(low);
  const { y: hy } = propMetrics(high);
  ctx.save();
  shadow(ctx, cx, by, lw * 0.5);
  const iron = shade(R, '#4b504a', z);
  // Corner iron posts from floor up to top bunk rail
  ctx.fillStyle = iron;
  ctx.fillRect(lx, hy - 8, 5, by - hy + 8);
  ctx.fillRect(lx + lw - 5, hy - 8, 5, by - hy + 8);
  // Side ladder rungs
  ctx.strokeStyle = iron; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const ry = hy + ((by - hy) * (0.2 + i * 0.2));
    seg(ctx, [lx + lw * 0.65, ry], [lx + lw * 0.85, ry], iron, 2);
  }
  // Lower and upper bed frames + thin mattresses
  for (const bedY of [ly, hy]) {
    ctx.fillStyle = iron;
    ctx.fillRect(lx, bedY + 10, lw, 6);
    ctx.fillStyle = shade(R, '#888c7e', z);
    ctx.beginPath(); ctx.roundRect(lx + 4, bedY, lw - 8, 12, 3); ctx.fill();
  }
  ctx.restore();
}

export function drawHospitalBed(ctx, R, b) {
  const { x, y, w, h, cx, by, z } = propMetrics(b);
  ctx.save();
  shadow(ctx, cx, by, w * 0.5);
  const frame = shade(R, '#7a8482', z);
  ctx.fillStyle = frame;
  ctx.fillRect(x + 4, y + h * 0.35, 5, h * 0.65);
  ctx.fillRect(x + w - 9, y + h * 0.1, 5, h * 0.9);
  ctx.fillRect(x + 4, y + h * 0.55, w - 8, 6);
  // White mattress + folded blanket + pillow
  ctx.fillStyle = shade(R, '#dce4e0', z);
  ctx.beginPath(); ctx.roundRect(x + 6, y + h * 0.35, w - 12, h * 0.22, 4); ctx.fill();
  ctx.fillStyle = shade(R, '#769890', z);
  ctx.fillRect(x + 8, y + h * 0.38, w * 0.48, h * 0.18);
  ctx.fillStyle = shade(R, '#eff4f2', z);
  ctx.beginPath(); ctx.roundRect(x + w * 0.72, y + h * 0.26, w * 0.18, h * 0.12, 4); ctx.fill();
  ctx.restore();
}

export function drawConveyor(ctx, R, b) {
  const { x, y, w, h, cx, by, z } = propMetrics(b);
  ctx.save();
  shadow(ctx, cx, by, w * 0.5);
  // Support legs
  ctx.fillStyle = shade(R, '#2e3438', z);
  for (const lx of [x + w * 0.12, x + w * 0.5, x + w * 0.88]) {
    ctx.fillRect(lx - 3, y + h * 0.3, 6, h * 0.7);
  }
  // Conveyor bed + rollers
  box(ctx, R, { ...b, y2: b.y1 + 0.16 });
  ctx.strokeStyle = shade(R, '#6e767e', z); ctx.lineWidth = 2;
  for (let i = 1; i < 6; i++) {
    const ry = y + h * (0.04 + i * 0.04);
    seg(ctx, [x + w * 0.08, ry], [x + w * 0.92, ry], ctx.strokeStyle, 1.5);
  }
  // Jammed B.N.T.G. carton on top
  ctx.fillStyle = shade(R, '#8c6f48', z);
  ctx.fillRect(x + w * 0.3, y - h * 0.18, w * 0.32, h * 0.2);
  ctx.restore();
}

export function drawMattressPile(ctx, R, b) {
  const { x, y, w, h, cx, by, z } = propMetrics(b);
  ctx.save();
  shadow(ctx, cx, by, w * 0.52);
  for (let i = 0; i < 3; i++) {
    const my = by - h * (0.34 + i * 0.28);
    ctx.fillStyle = shade(R, i % 2 ? '#a69e8a' : '#948c78', z);
    ctx.beginPath(); ctx.roundRect(x + i * 4, my, w - i * 8, h * 0.32, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
    // Subtle tufting lines
    ctx.strokeStyle = 'rgba(70,60,45,0.3)'; ctx.lineWidth = 1;
    seg(ctx, [x + w * 0.25, my + 5], [x + w * 0.25, my + h * 0.24], ctx.strokeStyle, 1);
    seg(ctx, [x + w * 0.65, my + 5], [x + w * 0.65, my + h * 0.24], ctx.strokeStyle, 1);
  }
  ctx.restore();
}

export function drawDebrisPile(ctx, R, b) {
  const { x, y, w, h, cx, by, z } = propMetrics(b);
  ctx.save();
  shadow(ctx, cx, by, w * 0.54);
  // Broken timber planks at angles
  const planks = [
    [x, by - 4, x + w * 0.72, y + h * 0.2, '#7d5f3c'],
    [x + w * 0.2, by - 2, x + w * 0.96, y + h * 0.35, '#6a5032'],
    [x + w * 0.08, y + h * 0.45, x + w * 0.85, by - 6, '#8b6d46'],
  ];
  for (const [x1, y1, x2, y2, col] of planks) {
    seg(ctx, [x1, y1], [x2, y2], shade(R, col, z), Math.max(6, h * 0.16));
  }
  // Jagged metal sheet scrap
  poly(ctx, [
    [x + w * 0.35, by], [x + w * 0.52, y + h * 0.32], [x + w * 0.78, y + h * 0.55], [x + w * 0.65, by],
  ], shade(R, '#6c747a', z));
  ctx.restore();
}

export function drawBooth(ctx, R, b, { awning = '#8a342c', label = '' } = {}) {
  const { x, y, w, h, cx, by, z } = propMetrics(b);
  ctx.save();
  shadow(ctx, cx, by, w * 0.52);
  // Back panel + open counter
  ctx.fillStyle = shade(R, '#4a3a28', z);
  ctx.fillRect(x + 4, y + h * 0.12, w - 8, h * 0.88);
  ctx.fillStyle = shade(R, b.color || '#6d5438', z);
  ctx.fillRect(x, y + h * 0.56, w, h * 0.44);
  // Corner timber posts
  ctx.fillStyle = shade(R, '#382a1a', z);
  ctx.fillRect(x, y, 6, h);
  ctx.fillRect(x + w - 6, y, 6, h);
  // Sloped top awning
  ctx.fillStyle = shade(R, awning, z);
  ctx.beginPath();
  ctx.moveTo(x - 6, y + h * 0.18);
  ctx.lineTo(x + 8, y);
  ctx.lineTo(x + w - 8, y);
  ctx.lineTo(x + w + 6, y + h * 0.18);
  ctx.closePath(); ctx.fill();
  if (label) txt(ctx, label, cx, y + h * 0.13, '#fff0c8', Math.max(8, Math.min(11, w * 0.11)));
  ctx.restore();
}

export function drawDinerBooth(ctx, R, b) {
  const { x, y, w, h, cx, by, z } = propMetrics(b);
  ctx.save();
  shadow(ctx, cx, by, w * 0.52);
  // Vinyl red benches facing a central Formica table
  ctx.fillStyle = shade(R, '#8c2c24', z);
  ctx.beginPath(); ctx.roundRect(x, y + h * 0.18, w * 0.28, h * 0.82, 5); ctx.fill();
  ctx.beginPath(); ctx.roundRect(x + w * 0.72, y + h * 0.18, w * 0.28, h * 0.82, 5); ctx.fill();
  ctx.fillStyle = '#5a6064';
  ctx.fillRect(cx - 4, y + h * 0.46, 8, h * 0.54);
  ctx.fillStyle = shade(R, '#e0dac8', z);
  ctx.fillRect(x + w * 0.26, y + h * 0.4, w * 0.48, 7);
  ctx.restore();
}

export function drawRoundColumn(ctx, R, x, z1, z2, r = 0.24, color = '#64626c', { lacquer = false } = {}) {
  const zm = (z1 + z2) / 2;
  const top = P(x, -1, zm), bot = P(x, 1, zm);
  const pxW = Math.max(10, (r * 2 * 480) / zm);
  const gr = ctx.createLinearGradient(top[0] - pxW / 2, 0, top[0] + pxW / 2, 0);
  gr.addColorStop(0, shade(R, color, zm, 0.65));
  gr.addColorStop(0.35, shade(R, color, zm, 1.15));
  gr.addColorStop(1, shade(R, color, zm, 0.55));
  ctx.fillStyle = gr;
  ctx.fillRect(top[0] - pxW / 2, top[1], pxW, bot[1] - top[1]);
  // Base plinth & capital
  ctx.fillStyle = shade(R, lacquer ? '#c8a236' : color, zm, 0.85);
  ctx.fillRect(top[0] - pxW * 0.6, top[1], pxW * 1.2, 8);
  ctx.fillRect(bot[0] - pxW * 0.6, bot[1] - 10, pxW * 1.2, 10);
}

export function drawGothicArch(ctx, R, hw, z, color = '#5e5d64') {
  const L = P(-hw, -0.35, z), M = P(0, -1.0, z), Rp = P(hw, -0.35, z);
  ctx.save();
  ctx.strokeStyle = shade(R, color, z, 0.72);
  ctx.lineWidth = Math.max(4, 18 / z);
  ctx.beginPath();
  ctx.moveTo(L[0], L[1]);
  ctx.quadraticCurveTo(P(-hw * 0.45, -0.95, z)[0], P(-hw * 0.45, -0.95, z)[1], M[0], M[1]);
  ctx.quadraticCurveTo(P(hw * 0.45, -0.95, z)[0], P(hw * 0.45, -0.95, z)[1], Rp[0], Rp[1]);
  ctx.stroke();
  ctx.restore();
}

export function drawMetalCabinet(ctx, R, b, { drawers = 4 } = {}) {
  const { x, y, w, h, cx, by, z } = propMetrics(b);
  ctx.save();
  shadow(ctx, cx, by, w * 0.48);
  box(ctx, R, b);
  ctx.strokeStyle = shade(R, '#262a2c', z);
  ctx.lineWidth = 1.2;
  for (let i = 0; i < drawers; i++) {
    const dy = y + (h * i) / drawers;
    ctx.strokeRect(x + 3, dy + 2, w - 6, h / drawers - 4);
    ctx.fillStyle = shade(R, '#a0a6aa', z);
    ctx.fillRect(cx - w * 0.16, dy + h / drawers * 0.42, w * 0.32, 3);
  }
  ctx.restore();
}

export function drawMetalLocker(ctx, R, b, { open = false } = {}) {
  const { x, y, w, h, cx, by, z } = propMetrics(b);
  ctx.save();
  shadow(ctx, cx, by, w * 0.46);
  box(ctx, R, open ? { ...b, color: '#383e42' } : b);
  ctx.strokeStyle = shade(R, '#222628', z);
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    seg(ctx, [x + w * 0.2, y + h * (0.14 + i * 0.05)], [x + w * 0.8, y + h * (0.14 + i * 0.05)], ctx.strokeStyle, 1.5);
  }
  ctx.fillStyle = '#b49a48';
  ctx.fillRect(x + w * 0.72, y + h * 0.48, 3, 7);
  ctx.restore();
}

export function drawPadlockChest(ctx, R, b) {
  const { x, y, w, h, cx, by, z } = propMetrics(b);
  ctx.save();
  shadow(ctx, cx, by, w * 0.5);
  box(ctx, R, b);
  ctx.fillStyle = shade(R, '#282c2a', z);
  ctx.fillRect(x, y + h * 0.25, w, 3);
  ctx.fillRect(x + w * 0.14, y, 4, h);
  ctx.fillRect(x + w * 0.86 - 4, y, 4, h);
  ctx.fillStyle = '#c8a842';
  ctx.fillRect(cx - 4, y + h * 0.24, 8, 9);
  ctx.restore();
}
