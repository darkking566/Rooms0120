// Helpers shared by the sublevel files (Level 0.1 to 0.7).
import { H, P, W, bounds, faceQuad, poly, seg, shade } from '../render.js';

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
