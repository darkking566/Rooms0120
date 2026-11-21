// Helpers shared by the sublevel files (Level 0.1 to 0.7).
import { H, P, W, bounds, boxRect, faceQuad, poly, seg, shade } from '../render.js';

export const pal = (wall, ceil, floor, fog, light) => ({ wall, ceil, floor, fog, light });
export const room = (palette, extra = {}) => ({ hw: 1.2, depth: 8, fogEnd: 12, pal: palette, lights: [1.8, 3.8, 6], ...extra });
export const back = (to, label = '往回走', msg = null) => ({ id: 'back', rect: [330, 470, 300, 70], label, cursor: 'back', click: (g) => g.go(to, msg ? { msg } : {}) });
export const hit = (id, rect, label, click, cursor = 'look', extra = {}) => ({ id, rect, label, cursor, click, ...extra });
export const once = (g, flag) => { if (g.s.flags[flag]) return false; g.flag(flag); return true; };
export const clockOf = (s) => s.clock || 0;

export function txt(ctx, str, x, y, color = '#d7d5b9', size = 14, align = 'center') {
  ctx.save(); ctx.fillStyle = color; ctx.font = `${size}px monospace`; ctx.textAlign = align;
  ctx.fillText(str, x, y); ctx.restore();
}
export function glow(ctx, x, y, r, color, a = 1) {
  if (r <= 0) return;
  const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}
export function outline(ctx, pts, color, w = 2) { ctx.strokeStyle = color; ctx.lineWidth = w; poly(ctx, pts); ctx.stroke(); }
export const qpt = ([a, b, c, d], u, v) => {
  const iu = 1 - u, iv = 1 - v;
  return [
    iu * iv * a[0] + u * iv * b[0] + u * v * c[0] + iu * v * d[0],
    iu * iv * a[1] + u * iv * b[1] + u * v * c[1] + iu * v * d[1],
  ];
};
export const qsub = (pts, u1, v1, u2, v2) => [
  qpt(pts, u1, v1), qpt(pts, u2, v1), qpt(pts, u2, v2), qpt(pts, u1, v2),
];
export function qtxt(ctx, str, pts, u1, v1, u2, v2, color = '#e2ebf2', size = 10) {
  let L0 = qpt(pts, u1, v1), R0 = qpt(pts, u2, v1);
  let L1 = qpt(pts, u1, v2), R1 = qpt(pts, u2, v2);
  if (L0[0] > R0[0]) { [L0, R0, L1, R1] = [R0, L0, R1, L1]; }
  const ml = [(L0[0] + L1[0]) * 0.5, (L0[1] + L1[1]) * 0.5];
  const mr = [(R0[0] + R1[0]) * 0.5, (R0[1] + R1[1]) * 0.5];
  const dx = mr[0] - ml[0], dy = mr[1] - ml[1];
  const slope = dx > 4 ? dy / dx : 0;
  ctx.save();
  ctx.translate((ml[0] + mr[0]) * 0.5, (ml[1] + mr[1]) * 0.5);
  ctx.transform(1, slope, 0, 1, 0, 0);
  ctx.fillStyle = color;
  ctx.font = `${size}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(str, 0, size * 0.35, Math.max(20, dx * 0.9));
  ctx.restore();
}
// Darkness with soft holes where light falls: [[x, y, r], ...]
let darkCv = null;
export function darkness(ctx, alpha, holes) {
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
export function tvStatic(ctx, pts, t, bars = true) {
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
export function sliding(ctx, R, x1, y1, x2, y2, z, open, color) {
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

// ---------- Recognizable procedural prop renderers (aligned to boxRect(b)) ----------
function propBox(b) {
  const [x, y, w, h] = boxRect(b);
  return { x, y, w, h, cx: x + w * 0.5, by: y + h, z: (b.z1 + b.z2) * 0.5 };
}
function floorShadow(ctx, cx, by, rx, ry = Math.max(4, rx * 0.2)) {
  ctx.fillStyle = 'rgba(0,0,0,0.36)';
  ctx.beginPath(); ctx.ellipse(cx, by + 2, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}

export function drawBag(ctx, R, b, { stripe = '#c8b88a', label = '' } = {}) {
  const { x, y, w, h, cx, by, z } = propBox(b);
  ctx.save();
  floorShadow(ctx, cx, by, w * 0.54);
  // Main rounded pack body
  ctx.fillStyle = shade(R, b.color || '#5c4a34', z);
  ctx.beginPath(); ctx.roundRect(x + w * 0.08, y + h * 0.12, w * 0.84, h * 0.86, [w * 0.24, w * 0.24, 6, 6]); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
  // Top flap
  ctx.fillStyle = shade(R, b.top || b.color || '#725c42', z);
  ctx.beginPath(); ctx.roundRect(x + w * 0.1, y + h * 0.08, w * 0.8, h * 0.34, [w * 0.22, w * 0.22, 8, 8]); ctx.fill();
  ctx.stroke();
  // Twin vertical straps & buckles
  ctx.fillStyle = shade(R, '#2c241c', z);
  for (const k of [0.3, 0.7]) {
    ctx.fillRect(x + w * k - 2.5, y + h * 0.16, 5, h * 0.62);
    ctx.fillStyle = shade(R, stripe, z);
    ctx.fillRect(x + w * k - 3.5, y + h * 0.4, 7, 4);
    ctx.fillStyle = shade(R, '#2c241c', z);
  }
  // Front zippered pocket
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.beginPath(); ctx.roundRect(x + w * 0.22, y + h * 0.54, w * 0.56, h * 0.32, 4); ctx.fill();
  if (label) txt(ctx, label, cx, y + h * 0.74, shade(R, '#e6dec0', z), Math.max(8, Math.min(11, w * 0.14)));
  ctx.restore();
}

export function drawBucket(ctx, R, b, { band = '#c84232', rim = '#b4b8bc' } = {}) {
  const { x, y, w, h, cx, by, z } = propBox(b);
  const topW = w * 0.88, botW = w * 0.68, topY = y + h * 0.16;
  ctx.save();
  floorShadow(ctx, cx, by, botW * 0.58);
  // Tapered cylindrical body
  ctx.fillStyle = shade(R, b.color || '#dcd8cc', z);
  ctx.beginPath();
  ctx.moveTo(cx - topW / 2, topY);
  ctx.lineTo(cx + topW / 2, topY);
  ctx.lineTo(cx + botW / 2, by);
  ctx.lineTo(cx - botW / 2, by);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.38)'; ctx.lineWidth = 1.5; ctx.stroke();
  // Label band
  if (band) {
    ctx.fillStyle = shade(R, band, z);
    ctx.fillRect(cx - botW * 0.48, topY + (by - topY) * 0.35, botW * 0.96, (by - topY) * 0.22);
  }
  // Top elliptical lid & rim
  ctx.fillStyle = shade(R, rim, z);
  ctx.beginPath(); ctx.ellipse(cx, topY, topW / 2, Math.max(4, h * 0.12), 0, 0, Math.PI * 2); ctx.fill();
  ctx.stroke();
  // Wire bail handle
  ctx.strokeStyle = shade(R, '#6e747a', z); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, topY + 2, topW * 0.46, 0.1, Math.PI - 0.1); ctx.stroke();
  ctx.restore();
}

export function drawBarrel(ctx, R, b, { label = '' } = {}) {
  const { y, w, h, cx, by, z } = propBox(b);
  const bw = w * 0.86, bh = h * 0.92, ty = by - bh;
  ctx.save();
  floorShadow(ctx, cx, by, bw * 0.56);
  const c0 = shade(R, b.color || '#365878', z, 0.72);
  const c1 = shade(R, b.top || b.color || '#4e7ca8', z, 1.08);
  const gr = ctx.createLinearGradient(cx - bw / 2, 0, cx + bw / 2, 0);
  gr.addColorStop(0, c0); gr.addColorStop(0.34, c1); gr.addColorStop(0.75, shade(R, b.color || '#365878', z)); gr.addColorStop(1, c0);
  ctx.fillStyle = gr;
  ctx.fillRect(cx - bw / 2, ty, bw, bh);
  // Top & bottom rims
  ctx.fillStyle = c1;
  ctx.beginPath(); ctx.ellipse(cx, ty, bw / 2, Math.max(5, bh * 0.09), 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.48)'; ctx.lineWidth = 1.8; ctx.stroke();
  // Horizontal reinforcement ribs
  for (const k of [0.33, 0.67]) {
    ctx.beginPath(); ctx.moveTo(cx - bw / 2, ty + bh * k); ctx.lineTo(cx + bw / 2, ty + bh * k); ctx.stroke();
  }
  if (label) txt(ctx, label, cx, ty + bh * 0.55, shade(R, '#d8e4ec', z), Math.max(9, Math.min(12, bw * 0.2)));
  ctx.restore();
}

export function drawCone(ctx, R, b) {
  const { y, w, h, cx, by, z } = propBox(b);
  ctx.save();
  floorShadow(ctx, cx, by, w * 0.56);
  // Wide dark base
  ctx.fillStyle = shade(R, '#383028', z);
  ctx.beginPath(); ctx.ellipse(cx, by - 2, w * 0.48, Math.max(4, h * 0.12), 0, 0, Math.PI * 2); ctx.fill();
  // Tapered orange cone
  ctx.fillStyle = shade(R, '#d8681c', z);
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.38, by - 3);
  ctx.lineTo(cx - w * 0.08, y + h * 0.06);
  ctx.lineTo(cx + w * 0.08, y + h * 0.06);
  ctx.lineTo(cx + w * 0.38, by - 3);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();
  // Reflective white band
  ctx.fillStyle = shade(R, '#f0ece0', z);
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.22, y + h * 0.42);
  ctx.lineTo(cx + w * 0.22, y + h * 0.42);
  ctx.lineTo(cx + w * 0.27, y + h * 0.58);
  ctx.lineTo(cx - w * 0.27, y + h * 0.58);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

export function drawKettle(ctx, R, b) {
  const { y, w, h, cx, by, z } = propBox(b);
  const r = Math.min(w, h) * 0.44;
  ctx.save();
  floorShadow(ctx, cx, by, r * 1.15);
  // Spout
  ctx.strokeStyle = shade(R, '#666868', z); ctx.lineWidth = Math.max(4, r * 0.26); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx + r * 0.6, by - r * 0.55); ctx.quadraticCurveTo(cx + r * 1.3, by - r * 0.7, cx + r * 1.25, by - r * 1.35); ctx.stroke();
  // Domed kettle body
  const gr = ctx.createRadialGradient(cx - r * 0.25, by - r * 0.9, 2, cx, by - r * 0.7, r * 1.1);
  gr.addColorStop(0, shade(R, '#969898', z)); gr.addColorStop(1, shade(R, '#484a4a', z));
  ctx.fillStyle = gr;
  ctx.beginPath(); ctx.ellipse(cx, by - r * 0.7, r, r * 0.78, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
  // Lid knob & arched handle
  ctx.fillStyle = '#2c2e2e'; ctx.beginPath(); ctx.arc(cx, by - r * 1.52, Math.max(3, r * 0.14), 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2a2c2c'; ctx.lineWidth = Math.max(2.5, r * 0.14);
  ctx.beginPath(); ctx.arc(cx, by - r * 1.35, r * 0.78, Math.PI * 1.05, -0.05); ctx.stroke();
  ctx.restore();
}

export function drawTent(ctx, R, b, { warm = false } = {}) {
  const { x, y, w, h, cx, by, z } = propBox(b);
  ctx.save();
  floorShadow(ctx, cx, by, w * 0.52);
  // Sloped orange insulated A-frame / dome tent shell
  ctx.fillStyle = shade(R, b.color || '#b86a28', z);
  ctx.beginPath();
  ctx.moveTo(x, by);
  ctx.quadraticCurveTo(x + w * 0.16, y + h * 0.08, cx, y);
  ctx.quadraticCurveTo(x + w * 0.84, y + h * 0.08, x + w, by);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = shade(R, '#5c3010', z); ctx.lineWidth = 2; ctx.stroke();
  // Highlight ridge panel
  ctx.fillStyle = shade(R, b.top || '#d4843c', z, 1.05);
  ctx.beginPath();
  ctx.moveTo(cx, y); ctx.lineTo(x + w * 0.82, by); ctx.lineTo(cx + w * 0.08, by); ctx.closePath(); ctx.fill();
  // Arched zipped doorway
  ctx.fillStyle = warm ? '#7a441a' : '#18110a';
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.22, by);
  ctx.quadraticCurveTo(cx, y + h * 0.25, cx + w * 0.22, by);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#2c1808'; ctx.lineWidth = 2; ctx.stroke();
  // Guy ropes
  ctx.strokeStyle = 'rgba(220,210,185,0.45)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x + w * 0.14, y + h * 0.42); ctx.lineTo(x - 14, by + 2);
  ctx.moveTo(x + w * 0.86, y + h * 0.42); ctx.lineTo(x + w + 14, by + 2); ctx.stroke();
  ctx.restore();
}

export function drawRugRoll(ctx, R, b) {
  const { x, y, w, h, cx, by, z } = propBox(b);
  const ry = Math.max(8, h * 0.42), cy = by - ry;
  ctx.save();
  floorShadow(ctx, cx, by, w * 0.52);
  // Horizontal wool cylinder
  const gr = ctx.createLinearGradient(0, cy - ry, 0, cy + ry);
  gr.addColorStop(0, shade(R, '#b0563e', z)); gr.addColorStop(0.6, shade(R, '#843424', z)); gr.addColorStop(1, shade(R, '#501e14', z));
  ctx.fillStyle = gr;
  ctx.beginPath(); ctx.roundRect(x + 4, cy - ry, w - 12, ry * 2, ry * 0.4); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
  // Binding twine bands
  ctx.strokeStyle = '#d8c89c'; ctx.lineWidth = 2;
  for (const k of [0.28, 0.68]) { ctx.beginPath(); ctx.moveTo(x + w * k, cy - ry); ctx.lineTo(x + w * k, cy + ry); ctx.stroke(); }
  // Rolled spiral end-cap
  const ex = x + w - 10;
  ctx.fillStyle = shade(R, '#9e4832', z);
  ctx.beginPath(); ctx.ellipse(ex, cy, Math.max(6, ry * 0.52), ry, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#4a1c12'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(ex, cy, Math.max(3, ry * 0.25), ry * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

export function drawJar(ctx, R, b) {
  const { y, w, h, cx, by, z } = propBox(b);
  ctx.save();
  floorShadow(ctx, cx, by, w * 0.42);
  // Twin curved amphora handles
  ctx.strokeStyle = shade(R, '#8c4b2e', z); ctx.lineWidth = Math.max(3, w * 0.08);
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + sd * w * 0.16, y + h * 0.16);
    ctx.quadraticCurveTo(cx + sd * w * 0.48, y + h * 0.24, cx + sd * w * 0.34, y + h * 0.48);
    ctx.stroke();
  }
  // Bulbous terracotta vessel body
  const gr = ctx.createRadialGradient(cx - w * 0.1, y + h * 0.5, 2, cx, y + h * 0.58, w * 0.48);
  gr.addColorStop(0, shade(R, '#c8724a', z)); gr.addColorStop(1, shade(R, '#7a3c22', z));
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.18, y + h * 0.08);
  ctx.lineTo(cx + w * 0.18, y + h * 0.08);
  ctx.quadraticCurveTo(cx + w * 0.14, y + h * 0.24, cx + w * 0.38, y + h * 0.48);
  ctx.quadraticCurveTo(cx + w * 0.42, y + h * 0.84, cx + w * 0.2, by);
  ctx.lineTo(cx - w * 0.2, by);
  ctx.quadraticCurveTo(cx - w * 0.42, y + h * 0.84, cx - w * 0.38, y + h * 0.48);
  ctx.quadraticCurveTo(cx - w * 0.14, y + h * 0.24, cx - w * 0.18, y + h * 0.08);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
  // Flared rim
  ctx.fillStyle = shade(R, '#b4623c', z);
  ctx.beginPath(); ctx.ellipse(cx, y + h * 0.08, w * 0.22, Math.max(3, h * 0.05), 0, 0, Math.PI * 2); ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawFountain(ctx, R, b, { dry = false, t = 0 } = {}) {
  const { y, w, h, cx, by, z } = propBox(b);
  ctx.save();
  floorShadow(ctx, cx, by, w * 0.56);
  const stone = shade(R, b.color || '#aeb8be', z), light = shade(R, b.top || '#dce4ea', z);
  // Lower basin wall & rim
  ctx.fillStyle = stone;
  ctx.beginPath(); ctx.roundRect(cx - w * 0.48, by - h * 0.44, w * 0.96, h * 0.44, 6); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = dry ? '#d6dfe6' : '#5ea6c4';
  ctx.beginPath(); ctx.ellipse(cx, by - h * 0.44, w * 0.48, Math.max(6, h * 0.14), 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = light; ctx.lineWidth = 3; ctx.stroke();
  // Central tiered pedestal & upper bowl
  ctx.fillStyle = stone;
  ctx.fillRect(cx - w * 0.1, by - h * 0.82, w * 0.2, h * 0.4);
  ctx.fillStyle = light;
  ctx.beginPath(); ctx.ellipse(cx, by - h * 0.82, w * 0.26, Math.max(4, h * 0.09), 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.2; ctx.stroke();
  if (!dry) {
    ctx.strokeStyle = 'rgba(180,235,255,0.75)'; ctx.lineWidth = 2;
    for (const sd of [-1, 1]) {
      const p = (t * 2 + (sd > 0 ? 0.5 : 0)) % 1;
      ctx.beginPath();
      ctx.moveTo(cx, by - h * 0.86);
      ctx.quadraticCurveTo(cx + sd * w * 0.22, by - h * (0.98 - p * 0.06), cx + sd * w * 0.34, by - h * 0.46);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawRock(ctx, R, b, { pile = false } = {}) {
  const { x, y, w, h, cx, by, z } = propBox(b);
  ctx.save();
  floorShadow(ctx, cx, by, w * 0.54);
  const c1 = shade(R, b.color || '#6a6e6c', z), c2 = shade(R, b.top || '#868c8a', z);
  const drawFacet = (rx, ry, rw, rh, col) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(rx, ry + rh);
    ctx.lineTo(rx + rw * 0.14, ry + rh * 0.35);
    ctx.lineTo(rx + rw * 0.48, ry);
    ctx.lineTo(rx + rw * 0.86, ry + rh * 0.26);
    ctx.lineTo(rx + rw, ry + rh);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.42)'; ctx.lineWidth = 1.5; ctx.stroke();
  };
  if (pile) {
    drawFacet(x, y + h * 0.2, w * 0.58, h * 0.8, c1);
    drawFacet(x + w * 0.42, y + h * 0.28, w * 0.58, h * 0.72, c1);
    drawFacet(x + w * 0.2, y, w * 0.62, h * 0.86, c2);
  } else {
    drawFacet(x, y, w, h, c1);
    ctx.fillStyle = c2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.14, y + h * 0.35); ctx.lineTo(x + w * 0.48, y); ctx.lineTo(x + w * 0.68, y + h * 0.42);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

export function drawSofa(ctx, R, b) {
  const { x, y, w, h, cx, by, z } = propBox(b);
  ctx.save();
  floorShadow(ctx, cx, by, w * 0.52);
  const body = shade(R, b.color || '#d8cfba', z), top = shade(R, b.top || '#eae2ce', z);
  // Wooden legs
  ctx.fillStyle = '#4a3520';
  ctx.fillRect(x + w * 0.08, by - h * 0.12, w * 0.06, h * 0.12);
  ctx.fillRect(x + w * 0.86, by - h * 0.12, w * 0.06, h * 0.12);
  // Backrest
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.roundRect(x + w * 0.08, y, w * 0.84, h * 0.56, [10, 10, 4, 4]); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.32)'; ctx.lineWidth = 1.5; ctx.stroke();
  // Seat cushions (two plush divisions)
  ctx.fillStyle = top;
  ctx.beginPath(); ctx.roundRect(x + w * 0.1, y + h * 0.42, w * 0.4, h * 0.36, 6); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(x + w * 0.5, y + h * 0.42, w * 0.4, h * 0.36, 6); ctx.fill(); ctx.stroke();
  // Left & right armrests
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.roundRect(x, y + h * 0.28, w * 0.14, h * 0.6, 6); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(x + w * 0.86, y + h * 0.28, w * 0.14, h * 0.6, 6); ctx.fill(); ctx.stroke();
  ctx.restore();
}

export function drawRolls(ctx, R, b) {
  const { x, y, w, h, cx, by, z } = propBox(b);
  const n = 4, rw = (w - 8) / n;
  ctx.save();
  floorShadow(ctx, cx, by, w * 0.52);
  for (let i = 0; i < n; i++) {
    const rx = x + 4 + i * rw, rh = h * (0.86 + (i % 2) * 0.12), ry = by - rh;
    ctx.fillStyle = shade(R, i % 2 ? '#e2d8b0' : '#cfc078', z);
    ctx.fillRect(rx + 1, ry, rw - 2, rh);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.2; ctx.strokeRect(rx + 1, ry, rw - 2, rh);
    ctx.fillStyle = shade(R, '#ede6c8', z);
    ctx.beginPath(); ctx.ellipse(rx + rw / 2, ry, (rw - 2) / 2, Math.max(3, rw * 0.22), 0, 0, Math.PI * 2); ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#5a502c';
    ctx.beginPath(); ctx.ellipse(rx + rw / 2, ry, rw * 0.16, Math.max(1.5, rw * 0.08), 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function drawBlanket(ctx, R, b) {
  const { x, y, w, h, cx, by, z } = propBox(b);
  ctx.save();
  floorShadow(ctx, cx, by, w * 0.54);
  for (let i = 0; i < 3; i++) {
    const fy = by - h * (0.36 + i * 0.28);
    ctx.fillStyle = shade(R, i % 2 ? (b.top || '#7a8a98') : (b.color || '#5e6c78'), z);
    ctx.beginPath(); ctx.roundRect(x + i * 2, fy, w - i * 4, h * 0.34, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.2; ctx.stroke();
  }
  ctx.restore();
}

export function drawBoiler(ctx, R, b) {
  const { x, y, w, h, cx, by, z } = propBox(b);
  ctx.save();
  floorShadow(ctx, cx, by, w * 0.54);
  const gr = ctx.createLinearGradient(x, 0, x + w, 0);
  gr.addColorStop(0, shade(R, '#2c221c', z)); gr.addColorStop(0.35, shade(R, '#584438', z)); gr.addColorStop(1, shade(R, '#241a14', z));
  ctx.fillStyle = gr;
  ctx.beginPath(); ctx.roundRect(x, y + h * 0.08, w, h * 0.92, [w * 0.24, w * 0.24, 4, 4]); ctx.fill();
  ctx.strokeStyle = '#18100c'; ctx.lineWidth = 2; ctx.stroke();
  // Riveted iron bands
  ctx.strokeStyle = shade(R, '#705848', z); ctx.lineWidth = 4;
  for (const k of [0.28, 0.55, 0.85]) { ctx.beginPath(); ctx.moveTo(x + 2, y + h * k); ctx.lineTo(x + w - 2, y + h * k); ctx.stroke(); }
  // Pressure gauge on upper chest
  const gx = cx, gy = y + h * 0.22;
  ctx.fillStyle = '#d8d0b8'; ctx.beginPath(); ctx.arc(gx, gy, Math.max(7, w * 0.08), 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + 5, gy - 4); ctx.stroke();
  ctx.restore();
}

export function drawShuttle(ctx, R, b) {
  const { x, y, w, h, cx, by, z } = propBox(b);
  ctx.save();
  floorShadow(ctx, cx, by, w * 0.54);
  // Landing skids
  ctx.strokeStyle = '#4a565e'; ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.14, by); ctx.lineTo(x + w * 0.22, by - h * 0.14);
  ctx.moveTo(x + w * 0.86, by); ctx.lineTo(x + w * 0.78, by - h * 0.14);
  ctx.moveTo(x + w * 0.08, by); ctx.lineTo(x + w * 0.92, by);
  ctx.stroke();
  // Angled spacecraft hull
  const gr = ctx.createLinearGradient(0, y, 0, by - h * 0.1);
  gr.addColorStop(0, shade(R, '#b4c0c8', z)); gr.addColorStop(0.55, shade(R, '#7d8a94', z)); gr.addColorStop(1, shade(R, '#4a545c', z));
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.16, y);
  ctx.lineTo(x + w * 0.84, y);
  ctx.lineTo(x + w, y + h * 0.42);
  ctx.lineTo(x + w * 0.9, by - h * 0.1);
  ctx.lineTo(x + w * 0.1, by - h * 0.1);
  ctx.lineTo(x, y + h * 0.42);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#2e3840'; ctx.lineWidth = 2; ctx.stroke();
  // Yellow hazard stripe along lower hull
  ctx.fillStyle = '#d4a638';
  ctx.fillRect(x + w * 0.14, by - h * 0.24, w * 0.72, Math.max(4, h * 0.06));
  ctx.restore();
}
