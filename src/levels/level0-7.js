// Level 0.7 "The Reminiscence District" (T-Dragon, CC BY-SA 3.0), and the old Level 1 its rift opens onto.
// Puzzles, scene text and J.H. notes are original.
import { P, bounds, box, boxRect, drawSmiler, faceQuad, poly, seg, shade, wallQuad } from '../render.js';
import { pick, rand } from '../rng.js';
import { yellow } from './level0-1.js';
import { back, darkness, glow, hit, once, outline, pal, room, tvStatic, txt } from './sublevel-kit.js';

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

// ================= Level 1, long ago =================
// Where Level 0.7's typist came out: the archived Level 1, a concrete garage where someone kept horses.
const oldR = room(pal('#6a645a', '#2e2a24', '#4a4236', '#0a0806', '#ffd9a0'), { hw: 2, depth: 9, fogEnd: 8, floorTex: 'concrete', wallTex: 'concrete', baseboard: false, lights: [2.2, 5.5], flickerLights: [1], flick: (t) => 0.9 + 0.1 * Math.sin(t * 3) });
const oldCrate = { x1: 0.8, x2: 1.4, y1: 0.5, y2: 1, z1: 2.3, z2: 2.8, color: '#7a5a34', edge: true };
const typewriter = { x1: 0.9, x2: 1.3, y1: 0.36, y2: 0.5, z1: 2.4, z2: 2.68, color: '#2a2a28', edge: true };
const hayB = { x1: -1.9, x2: -1.2, y1: 0.6, y2: 1, z1: 2.4, z2: 3.0, color: '#c8a85a' };
export const L1_OLD = {
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

export const L07_SCENES = {
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
      else if (rand() < 0.5) g.say('右邊的門口又傳來那個聲音：「喂——這邊！我也是流浪者！你聽得見嗎？」');
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
      const lit = pick(['left', 'right', 'ahead']);
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
