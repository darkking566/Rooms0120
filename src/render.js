// Procedural 2D renderer: one-point-perspective rooms drawn straight onto a canvas.
// World space: x = left/right (walls at ±hw), y = up/down (ceiling -1, floor +1), z = depth (>= 1).

export const W = 960, H = 540, CX = W / 2, CY = H / 2;
export const P = (x, y, z) => [CX + (x * CX) / z, CY + (y * CY) / z];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const hexCache = new Map();
export function hex(c) {
  if (Array.isArray(c)) return c;
  let v = hexCache.get(c);
  if (!v) {
    const n = parseInt(c.slice(1), 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    hexCache.set(c, v);
  }
  return v;
}
export const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

export const fogT = (R, z) => Math.pow(clamp((z - 1) / (R.fogEnd - 1), 0, 1), 0.85);
// Colour of `base` seen at depth z inside room R (lit by R.lum, fading into R.pal.fog).
export const shadeAt = (R, base, z, k = 1) => mix(mul(hex(base), k * (R.lum ?? 1)), hex(R.pal.fog), fogT(R, z));
export const shade = (R, base, z, k = 1, a = 1) => rgb(shadeAt(R, base, z, k), a);

export function poly(ctx, pts, fill) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
}
export function seg(ctx, a, b, color, w = 1) {
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke();
}
export function bounds(pts, pad = 0) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return [x0 - pad, y0 - pad, x1 - x0 + pad * 2, y1 - y0 + pad * 2];
}

// Quad lying on a side wall (x fixed) between depths z1..z2 and heights y1..y2.
export const wallQuad = (x, y1, y2, z1, z2) => [P(x, y1, z1), P(x, y1, z2), P(x, y2, z2), P(x, y2, z1)];
// Quad facing the viewer at depth z.
export const faceQuad = (x1, y1, x2, y2, z) => [P(x1, y1, z), P(x2, y1, z), P(x2, y2, z), P(x1, y2, z)];

// Gradient along a receding surface; screen position is linear in 1/z, so sample accordingly.
function depthGrad(ctx, R, base, z1, z2, a, b, k = 1) {
  const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
  const N = 8;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const z = 1 / (1 / z1 + (1 / z2 - 1 / z1) * t);
    g.addColorStop(t, shade(R, base, z, k));
  }
  return g;
}

let texCache = {};
function texture(ctx, kind) {
  if (texCache[kind]) return texCache[kind];
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const img = x.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const r = Math.random();
    const v = kind === 'carpet' ? (r < 0.5 ? 0 : 255) : (r * 255);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = kind === 'carpet' ? 40 : 30 + r * 30;
  }
  x.putImageData(img, 0, 0);
  if (kind === 'concrete') {
    x.strokeStyle = 'rgba(0,0,0,0.25)';
    for (let i = 0; i < 6; i++) {
      x.beginPath();
      let px = Math.random() * 128, py = Math.random() * 128;
      x.moveTo(px, py);
      for (let j = 0; j < 5; j++) { px += Math.random() * 30 - 15; py += Math.random() * 30 - 15; x.lineTo(px, py); }
      x.stroke();
    }
  }
  return (texCache[kind] = ctx.createPattern(c, 'repeat'));
}

function flickerOn(t, i) {
  const n = Math.sin(t * 11.3 + i * 7.1) + Math.sin(t * 5.7 + i * 3.3) + Math.sin(t * 23.9 + i);
  return n < 2.2;
}

export function drawRoom(ctx, R, t) {
  const hw = R.hw ?? 1, D = R.depth, pal = R.pal, zn = 1;
  R.lum = (R.bright ?? 1) * (R.flick ? R.flick(t) : 1);

  const ceil = [P(-hw, -1, zn), P(hw, -1, zn), P(hw, -1, D), P(-hw, -1, D)];
  const floor = [P(-hw, 1, zn), P(hw, 1, zn), P(hw, 1, D), P(-hw, 1, D)];
  poly(ctx, ceil, depthGrad(ctx, R, pal.ceil, zn, D, P(0, -1, zn), P(0, -1, D)));
  poly(ctx, floor, depthGrad(ctx, R, pal.floor, zn, D, P(0, 1, zn), P(0, 1, D)));
  if (R.floorTex) {
    ctx.save(); poly(ctx, floor); ctx.clip();
    ctx.globalAlpha = R.floorTex === 'carpet' ? 0.35 : 0.5;
    ctx.fillStyle = texture(ctx, R.floorTex); ctx.fillRect(0, CY, W, CY);
    ctx.restore();
  }

  // back wall
  const b1 = P(-hw, -1, D), b2 = P(hw, 1, D);
  ctx.fillStyle = shade(R, pal.wall, D, 0.9);
  ctx.fillRect(b1[0], b1[1], b2[0] - b1[0], b2[1] - b1[1]);

  for (const s of [-1, 1]) {
    const x = s * hw;
    poly(ctx, wallQuad(x, -1, 1, zn, D), depthGrad(ctx, R, pal.wall, zn, D, P(x, 0, zn), P(x, 0, D), s < 0 ? 0.92 : 0.82));
    if (R.wallTex) {
      ctx.save(); poly(ctx, wallQuad(x, -1, 1, zn, D)); ctx.clip();
      ctx.globalAlpha = 0.35; ctx.fillStyle = texture(ctx, R.wallTex); ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  const dark = (z, a) => shade(R, pal.wall, z, 0.6, a * (1 - fogT(R, z)));
  if (R.stripes) {
    for (const s of [-1, 1]) {
      const x = s * hw;
      for (let z = 1.05; z < D; z += 0.32) seg(ctx, P(x, -1, z), P(x, 1, z), dark(z, 0.35), Math.max(0.5, 2.4 / z));
    }
    for (let x = -hw + 0.16; x < hw; x += 0.16) seg(ctx, P(x, -1, D), P(x, 1, D), dark(D, 0.3), Math.max(0.5, 2.4 / D));
  }
  if (R.baseboard !== false) {
    for (const s of [-1, 1]) {
      poly(ctx, wallQuad(s * hw, 0.9, 1, zn, D), depthGrad(ctx, R, pal.wall, zn, D, P(s * hw, 0.95, zn), P(s * hw, 0.95, D), 0.65));
    }
    poly(ctx, faceQuad(-hw, 0.9, hw, 1, D), shade(R, pal.wall, D, 0.6));
  }
  if (R.tiles) {
    const c = (z) => shade(R, pal.ceil, z, 0.7, 0.8 * (1 - fogT(R, z)));
    for (let z = 1.2; z < D; z += 0.6) seg(ctx, P(-hw, -1, z), P(hw, -1, z), c(z), Math.max(0.5, 2 / z));
    for (let x = -hw + 0.4; x < hw; x += 0.4) seg(ctx, P(x, -1, zn), P(x, -1, D), c(2.5), 1);
  }

  for (const o of R.openings || []) drawOpening(ctx, R, o);
  if (R.backDoor) {
    const d = R.backDoor;
    poly(ctx, faceQuad(d.x1, d.top, d.x2, 1, D), rgb(mul(hex(pal.fog), 0.7)));
    poly(ctx, faceQuad(d.x1 + 0.06, d.top + 0.08, d.x2 - 0.06, 1, D + 2.5), shade(R, pal.wall, D + 2.5, 0.8));
  }

  (R.lights || []).forEach((z, i) => {
    const off = R.flickerLights?.includes(i) && !flickerOn(t, i);
    const ft = fogT(R, z);
    const pts = [P(-0.28, -1, z), P(0.28, -1, z), P(0.28, -1, z + 0.45), P(-0.28, -1, z + 0.45)];
    ctx.save();
    if (!off) { ctx.shadowColor = rgb(hex(pal.light), 0.8 * (1 - ft)); ctx.shadowBlur = 50 / z; }
    poly(ctx, pts, off ? shade(R, pal.ceil, z, 0.5) : rgb(mix(hex(pal.light), hex(pal.fog), ft * 0.9)));
    ctx.restore();
  });
}

function drawOpening(ctx, R, o) {
  const x = o.side * R.hw;
  const top = o.top ?? -0.6;
  const pts = wallQuad(x, top, 1, o.z1, o.z2);
  poly(ctx, pts, rgb(mul(hex(R.pal.fog), 0.55)));
  // glimpse of the next room: its floor and far wall, clipped to the doorway
  ctx.save();
  poly(ctx, pts); ctx.clip();
  const far = x + o.side * 1.4;
  poly(ctx, [P(x, 1, o.z1), P(far, 1, o.z1), P(far, 1, o.z2), P(x, 1, o.z2)], shade(R, R.pal.floor, o.z2 + 0.5, 0.7));
  poly(ctx, wallQuad(far, top, 1, o.z1 - 0.5, o.z2 + 0.5), shade(R, R.pal.wall, o.z2 + 1.5, 0.6));
  ctx.restore();
  ctx.lineWidth = 2; ctx.strokeStyle = shade(R, R.pal.wall, o.z1, 0.5);
  poly(ctx, pts); ctx.stroke();
}

// Axis-aligned box in world space; draws only the faces that face the viewer.
export function box(ctx, R, b) {
  const { x1, x2, y1, y2, z1, z2, color } = b;
  const zm = (z1 + z2) / 2;
  if (y1 > 0) poly(ctx, [P(x1, y1, z1), P(x2, y1, z1), P(x2, y1, z2), P(x1, y1, z2)], shade(R, b.top || color, zm, 1.1));
  if (y2 < 0) poly(ctx, [P(x1, y2, z1), P(x2, y2, z1), P(x2, y2, z2), P(x1, y2, z2)], shade(R, color, zm, 0.6));
  if (x1 > 0) poly(ctx, wallQuad(x1, y1, y2, z1, z2), shade(R, color, zm, 0.7));
  if (x2 < 0) poly(ctx, wallQuad(x2, y1, y2, z1, z2), shade(R, color, zm, 0.7));
  poly(ctx, faceQuad(x1, y1, x2, y2, z1), shade(R, color, z1, 0.92));
  if (b.edge) { ctx.strokeStyle = shade(R, color, z1, 0.5); ctx.lineWidth = 1.5; poly(ctx, faceQuad(x1, y1, x2, y2, z1)); ctx.stroke(); }
}
export function boxRect(b, pad = 4) {
  const pts = [];
  for (const x of [b.x1, b.x2]) for (const y of [b.y1, b.y2]) for (const z of [b.z1, b.z2]) pts.push(P(x, y, z));
  return bounds(pts, pad);
}

// Pipe running along the depth axis at (x, y) with radius r.
export function pipe(ctx, R, x, y, r, color, vertical = true) {
  const D = R.depth;
  const pts = vertical
    ? [P(x, y - r, 1), P(x, y - r, D), P(x, y + r, D), P(x, y + r, 1)]
    : [P(x - r, y, 1), P(x - r, y, D), P(x + r, y, D), P(x + r, y, 1)];
  const a = P(x, y, 1), b = P(x, y, D);
  const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
  for (let i = 0; i <= 6; i++) {
    const t = i / 6, z = 1 / (1 + (1 / D - 1) * t);
    g.addColorStop(t, shade(R, color, z));
  }
  poly(ctx, pts, g);
  // highlight
  const h = vertical ? [P(x, y - r * 0.6, 1), P(x, y - r * 0.6, D)] : [P(x - r * 0.4, y, 1), P(x - r * 0.4, y, D)];
  seg(ctx, h[0], h[1], 'rgba(255,255,255,0.12)', 2);
  // brackets
  for (let z = 1.5; z < D; z += 1.5) {
    const q = vertical ? [P(x, y - r * 1.3, z), P(x, y + r * 1.3, z)] : [P(x - r * 1.3, y, z), P(x + r * 1.3, y, z)];
    seg(ctx, q[0], q[1], shade(R, '#222222', z, 1, 0.8), Math.max(1, 6 / z));
  }
}

export function paper(ctx, R, pts, z, tint = '#efe7cf') {
  poly(ctx, pts, shade(R, tint, z));
  const [a, b, c, d] = pts;
  ctx.strokeStyle = shade(R, '#544a3a', z, 1, 0.6); ctx.lineWidth = 1;
  for (let i = 1; i < 6; i++) {
    const t = i / 6.5;
    const l = [a[0] + (d[0] - a[0]) * t, a[1] + (d[1] - a[1]) * t];
    const r = [b[0] + (c[0] - b[0]) * t, b[1] + (c[1] - b[1]) * t];
    seg(ctx, [l[0] + (r[0] - l[0]) * 0.12, l[1] + (r[1] - l[1]) * 0.12], [l[0] + (r[0] - l[0]) * (0.6 + (i % 3) * 0.12), l[1] + (r[1] - l[1]) * (0.6 + (i % 3) * 0.12)], ctx.strokeStyle, 1);
  }
}

// Almond-water bottle standing at screen point (x, y) (its base), h pixels tall.
export function bottle(ctx, R, x, y, h, z) {
  const w = h * 0.38;
  ctx.save();
  ctx.fillStyle = shade(R, '#e9e1c1', z, 1, 0.85);
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h * 0.72, w, h * 0.72, w * 0.25);
  ctx.fill();
  ctx.fillRect(x - w * 0.18, y - h, w * 0.36, h * 0.3);
  ctx.fillStyle = shade(R, '#3f6fb0', z);
  ctx.fillRect(x - w * 0.22, y - h * 1.04, w * 0.44, h * 0.09);
  ctx.fillStyle = shade(R, '#c9a46a', z);
  ctx.fillRect(x - w / 2, y - h * 0.5, w, h * 0.2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x, y, w * 0.8, w * 0.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function drawSmiler(ctx, x, y, s, a = 1, t = 0) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.shadowColor = 'rgba(255,255,255,0.9)';
  ctx.shadowBlur = 12 * s;
  ctx.fillStyle = '#f4f4ee';
  const jitter = Math.sin(t * 40) * 0.6 * s;
  for (const dx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(x + dx * 16 * s + jitter, y - 10 * s, 9 * s, 3.4 * s, dx * -0.25, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(x - 30 * s, y + 6 * s);
  ctx.quadraticCurveTo(x, y + 34 * s, x + 30 * s, y + 6 * s);
  ctx.quadraticCurveTo(x, y + 20 * s, x - 30 * s, y + 6 * s);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.lineWidth = Math.max(1, 1.4 * s);
  for (let i = -5; i <= 5; i++) {
    const tx = x + i * 5 * s;
    const yTop = y + 6 * s + (1 - (i / 6) ** 2) * 7 * s;
    const yBot = y + 6 * s + (1 - (i / 6) ** 2) * 14 * s;
    ctx.beginPath(); ctx.moveTo(tx, yTop); ctx.lineTo(tx, yBot); ctx.stroke();
  }
  ctx.restore();
}

let darkCv = null;
export function drawDark(ctx, mx, my, lightOn, t) {
  if (!darkCv) { darkCv = document.createElement('canvas'); darkCv.width = W; darkCv.height = H; }
  const d = darkCv.getContext('2d');
  d.globalCompositeOperation = 'source-over';
  d.clearRect(0, 0, W, H);
  d.fillStyle = 'rgba(0,0,0,0.97)';
  d.fillRect(0, 0, W, H);
  if (lightOn) {
    d.globalCompositeOperation = 'destination-out';
    const r = 165 + Math.sin(t * 9) * 3 + (Math.random() < 0.02 ? -40 : 0);
    const g = d.createRadialGradient(mx, my, 0, mx, my, r);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.55, 'rgba(0,0,0,0.85)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    d.fillStyle = g;
    d.fillRect(0, 0, W, H);
  }
  ctx.drawImage(darkCv, 0, 0);
}

let noiseFrames = null;
function makeNoise() {
  noiseFrames = [];
  for (let f = 0; f < 4; f++) {
    const c = document.createElement('canvas');
    c.width = 320; c.height = 180;
    const x = c.getContext('2d');
    const img = x.createImageData(320, 180);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    noiseFrames.push(c);
  }
}

// Film grain, scanlines, vignette, low-sanity tint and the camcorder overlay.
export function postFX(ctx, t, o = {}) {
  if (!noiseFrames) makeNoise();
  const stress = clamp(o.stress ?? 0, 0, 1);
  ctx.save();
  ctx.globalAlpha = 0.06 + stress * 0.1;
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(noiseFrames[(t * 24 | 0) % 4], 0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let y = (t * 30 | 0) % 3; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  const v = ctx.createRadialGradient(CX, CY, H * 0.35, CX, CY, W * 0.62);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, `rgba(0,0,0,${0.55 + stress * 0.3})`);
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
  if (stress > 0.55) {
    ctx.fillStyle = `rgba(120,0,0,${(stress - 0.55) * 0.35 * (0.8 + Math.sin(t * 3) * 0.2)})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (o.rec !== false) {
    ctx.font = '600 18px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillStyle = 'rgba(240,240,230,0.75)';
    ctx.textBaseline = 'top';
    if ((t * 1.2 | 0) % 2 === 0) { ctx.fillStyle = '#d33'; ctx.beginPath(); ctx.arc(30, H - 31, 6, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(240,240,230,0.75)';
    ctx.fillText('REC', 44, H - 40);
    const sec = Math.floor(o.clock ?? t);
    const hh = String(3 + Math.floor(sec / 3600)).padStart(2, '0');
    const mm = String(Math.floor(sec / 60) % 60).padStart(2, '0');
    const ss = String(sec % 60).padStart(2, '0');
    ctx.textAlign = 'right';
    ctx.fillText(`01/20  ${hh}:${mm}:${ss}`, W - 24, H - 40);
    ctx.textAlign = 'left';
  }
  ctx.restore();
}
