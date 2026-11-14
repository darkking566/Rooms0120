// Level C-1 stacked sublevels adapted from HOMESICK's Reports I–IV on Backrooms Wiki CN (CC BY-SA 3.0):
// - Report I "偏路" (HOMESICK)
// - Report II "演化机制" (HOMESICK)
// - Report III "箱庭中人" (HOMESICK, thanks to Lovesicker)
// - Report IV "在那树荫下" (HOMESICK & Lovesicker)
// Hub: Level C-1 報告集. Puzzles, inter-level connections, scene text, visuals and original endings are original.

import { H, P, W, bounds, box, boxRect, faceQuad, paper, poly, seg, shade, wallQuad } from './render.js';
import { rand } from './rng.js';
import { back, glow, hit, once, outline, pal, qpt, qsub, qtxt, room, txt } from './levels/sublevel-kit.js';

export const C1_LEVELS = {
  'C1': { name: 'LEVEL C-1', sub: '偏路', drain: 1.2, thirst: 0.8, hunger: 0.8 },
  'C1.2': { name: 'LEVEL C-1', sub: '東舟市', drain: 1, thirst: 0.8, hunger: 0.8 },
  'C1.3': { name: 'LEVEL C-1', sub: '驤亭', drain: 1, thirst: 1.2, hunger: 1.2 },
  'C1.4': { name: 'LEVEL C-1', sub: '俄刻阿諾斯號', drain: 1.8, thirst: 1.5, hunger: 1.5 },
};

// ---------- Report I: 偏路 (Level C-1) ----------
// Zero items anywhere, spotless cold-white surfaces without grime/fog, shuffled hall doors,
// and an unseen distant heavy bang whose source is never drawn or clickable.
const c1Pal = pal('#f4f7f9', '#fbfcfd', '#d9ceb8', '#eef3f6', '#ffffff');
const c1Room = room(c1Pal, {
  hw: 1.5, depth: 7.5, fogEnd: 60, bright: 1.06, baseboard: false, tiles: true, lights: [1.8, 4.2, 6.4],
});

let c1BangWait = 15;
let c1BangShake = 0;
let c1FootprintT = 0;

function c1OnEnter(g, firstMsg) {
  c1FootprintT = 2.0;
  if (!g.s.flags.c1_seed) g.flag('c1_seed', 1);
  if (firstMsg) g.say(firstMsg);
}

function c1Advance(g, to, msg) {
  const steps = (g.s.flags.c1_steps || 0) + 1;
  g.flag('c1_steps', steps);
  const seed = ((g.s.flags.c1_seed || 1) * 7 + steps * 13) % 997;
  g.flag('c1_seed', seed || 1);
  g.go(to, msg ? { msg } : {});
}

function c1Update(g, dt) {
  c1BangWait -= dt;
  if (c1BangWait <= 0) {
    c1BangWait = 12 + rand() * 13;
    c1BangShake = 0.65;
    g.sfx('bang');
  }
  if (c1BangShake > 0) c1BangShake = Math.max(0, c1BangShake - dt);
  if (c1FootprintT > 0) c1FootprintT = Math.max(0, c1FootprintT - dt);
}

function drawSpotless(ctx, R) {
  const hw = R.hw, D = R.depth;
  const seam = 'rgba(182, 196, 206, 0.5)';
  for (const s of [-1, 1]) {
    const x = s * hw;
    for (let z = 1.4; z < D; z += 0.5) seg(ctx, P(x, -1, z), P(x, 1, z), seam, 1);
    for (let y = -0.5; y <= 0.5; y += 0.5) seg(ctx, P(x, y, 1), P(x, y, D), seam, 1);
  }
  for (let x = -hw + 0.5; x < hw; x += 0.5) seg(ctx, P(x, -1, D), P(x, 1, D), seam, 1);
  for (let y = -0.5; y <= 0.5; y += 0.5) seg(ctx, P(-hw, y, D), P(hw, y, D), seam, 1);
  const plank = 'rgba(165, 138, 102, 0.34)';
  for (let x = -hw + 0.3; x < hw; x += 0.3) seg(ctx, P(x, 1, 1), P(x, 1, D), plank, 1);
  for (let z = 1.8; z < D; z += 1.4) {
    const off = (Math.round(z * 10) % 2) * 0.15;
    for (let x = -hw + off; x < hw - 0.1; x += 0.6) seg(ctx, P(x, 1, z), P(Math.min(hw, x + 0.3), 1, z), plank, 1);
  }
}

function c1DrawOver(ctx) {
  if (c1FootprintT > 0) {
    const a = Math.min(0.18, c1FootprintT * 0.09);
    ctx.save();
    ctx.fillStyle = `rgba(110, 120, 130, ${a})`;
    for (const [fx, fz] of [[-0.18, 1.85], [0.18, 2.25]]) {
      const pt = P(fx, 1, fz);
      ctx.beginPath();
      ctx.ellipse(pt[0], pt[1], 14, 6, 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  if (c1BangShake > 0) {
    const mag = c1BangShake * 5;
    const dx = Math.round((Math.random() - 0.5) * mag);
    const dy = Math.round((Math.random() - 0.5) * mag);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(ctx.canvas, dx, dy);
    ctx.restore();
  }
}

function drawWhiteDoor(ctx, pts, plate = null) {
  poly(ctx, qsub(pts, -0.04, -0.025, 1.04, 1.0), 'rgba(130, 145, 160, 0.22)');
  poly(ctx, pts, '#fafcfd');
  outline(ctx, pts, '#c4cfd9', 2.5);
  outline(ctx, qsub(pts, 0.14, 0.09, 0.86, 0.43), '#dde5ec', 1.2);
  outline(ctx, qsub(pts, 0.14, 0.50, 0.86, 0.89), '#dde5ec', 1.2);
  poly(ctx, qsub(pts, 0.74, 0.52, 0.85, 0.545), '#9aa6b2');
  if (plate) {
    const pp = qsub(pts, 0.24, 0.25, 0.76, 0.35);
    poly(ctx, pp, '#d8e0e6');
    outline(ctx, pp, '#94a2ae', 1);
    qtxt(ctx, plate, pts, 0.24, 0.25, 0.76, 0.35, '#3f4a54', Math.max(9, Math.round(bounds(pts)[2] * 0.14)));
  }
}

function drawWhiteBench(ctx, R, z1, z2, x1 = 0.65, x2 = 1.32) {
  poly(ctx, [P(x1, 1, z1), P(x2, 1, z1), P(x2, 1, z2), P(x1, 1, z2)], 'rgba(95, 108, 118, 0.16)');
  box(ctx, R, { x1: x1 + 0.08, x2: x1 + 0.16, y1: 0.54, y2: 1, z1: z1 + 0.08, z2: z1 + 0.18, color: '#dfe5ea', edge: true });
  box(ctx, R, { x1: x2 - 0.16, x2: x2 - 0.08, y1: 0.54, y2: 1, z1: z1 + 0.08, z2: z1 + 0.18, color: '#dfe5ea', edge: true });
  box(ctx, R, { x1: x1 + 0.08, x2: x1 + 0.16, y1: 0.54, y2: 1, z1: z2 - 0.18, z2: z2 - 0.08, color: '#d5dde4', edge: true });
  box(ctx, R, { x1: x2 - 0.16, x2: x2 - 0.08, y1: 0.54, y2: 1, z1: z2 - 0.18, z2: z2 - 0.08, color: '#d5dde4', edge: true });
  box(ctx, R, { x1, x2, y1: 0.45, y2: 0.54, z1, z2, color: '#edf2f5', top: '#ffffff', edge: true });
}

function drawCleanWindow(ctx, pts, hintColor = '#eef4f8') {
  const b = bounds(pts);
  ctx.save();
  poly(ctx, pts); ctx.clip();
  const gr = ctx.createLinearGradient(0, b[1], 0, b[1] + b[3]);
  gr.addColorStop(0, hintColor);
  gr.addColorStop(0.62, '#dbe6ed');
  gr.addColorStop(0.63, '#c8d4ca');
  gr.addColorStop(1, '#dce3dd');
  ctx.fillStyle = gr;
  ctx.fillRect(b[0], b[1], b[2], b[3]);
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 4;
  seg(ctx, [b[0] + b[2] * 0.18, b[1] + b[3] * 0.85], [b[0] + b[2] * 0.55, b[1] + b[3] * 0.12], 'rgba(255,255,255,0.4)', 3);
  ctx.restore();
  ctx.strokeStyle = '#c4cfd8';
  ctx.lineWidth = 3;
  poly(ctx, pts);
  ctx.stroke();
  const [a, br, c, d] = pts;
  const mxTop = [(a[0] + br[0]) / 2, (a[1] + br[1]) / 2];
  const mxBot = [(d[0] + c[0]) / 2, (d[1] + c[1]) / 2];
  seg(ctx, mxTop, mxBot, '#c4cfd8', 2);
}

function drawHills(ctx, hy, layers) {
  for (const [color, baseAmp, phase, step = 64] of layers) {
    ctx.beginPath();
    ctx.moveTo(0, hy + 2);
    for (let x = 0; x <= W; x += step) {
      const y = hy - baseAmp * (0.55 + 0.45 * Math.sin(x * 0.0085 + phase) * Math.cos(x * 0.0042 - phase));
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, hy + 2);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
}

function drawGrassField(ctx, hy, count, shift, color, tall = 26) {
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    const tDepth = ((i * 37 + shift * 17) % 100) / 100;
    const x = 18 + ((i * 79 + shift * 43) % (W - 36));
    const y = hy + 18 + Math.pow(tDepth, 1.35) * (H - hy - 34);
    const h = (0.35 + tDepth * 0.85) * tall;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.1 + tDepth * 1.4;
    for (let b = -1; b <= 1; b++) {
      ctx.beginPath();
      ctx.moveTo(x + b * 3, y);
      ctx.quadraticCurveTo(x + b * 6 - 3, y - h * 0.6, x + b * 8 - 2 + (i % 3), y - h);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawSignPost(ctx, pts, label, sub, bg = '#4c565c', edge = '#8fa0aa', groundY = null) {
  const b = bounds(pts);
  const px = b[0] + b[2] * 0.5;
  const bottom = groundY == null ? b[1] + b[3] : Math.max(b[1] + b[3], groundY);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(px, bottom + 4, 18, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3c4146';
  ctx.fillRect(px - 4, b[1] + 8, 8, bottom - b[1] - 4);
  ctx.fillStyle = bg;
  ctx.fillRect(b[0], b[1], b[2], b[3] * 0.56);
  ctx.strokeStyle = edge; ctx.lineWidth = 1.5;
  ctx.strokeRect(b[0], b[1], b[2], b[3] * 0.56);
  txt(ctx, label, px, b[1] + b[3] * 0.3, '#ecf2f6', 11);
  if (sub) txt(ctx, sub, px, b[1] + b[3] * 0.48, '#a8bcc8', 9);
}

function drawPortalArch(ctx, pts, inner, trim, label) {
  poly(ctx, pts, trim);
  poly(ctx, qsub(pts, 0.08, 0.04, 0.92, 1.0), inner);
  if (Math.abs(pts[0][1] - pts[1][1]) > 3) {
    poly(ctx, qsub(pts, 0.82, 0.04, 0.92, 1.0), 'rgba(0,0,0,0.3)');
  }
  outline(ctx, qsub(pts, 0.015, 0.01, 0.985, 0.99), 'rgba(255,255,255,0.18)', 1.5);
  if (label) {
    const lp = qsub(pts, 0.04, -0.14, 0.96, -0.02);
    poly(ctx, lp, '#1e242a');
    outline(ctx, lp, trim, 1);
    qtxt(ctx, label, pts, 0.04, -0.14, 0.96, -0.02, '#e2ebf2', 10);
  }
}

function drawTimberCabin(ctx, pts) {
  const b = bounds(pts);
  const [x, y, w, h] = b;
  const roofH = Math.round(h * 0.32);
  ctx.fillStyle = 'rgba(22, 30, 20, 0.3)';
  ctx.beginPath(); ctx.ellipse(x + w * 0.55, y + h, w * 0.65, 8, 0, 0, Math.PI * 2); ctx.fill();
  poly(ctx, [[x - 8, y + roofH], [x + w * 0.52, y - 4], [x + w + 8, y + roofH]], '#4a3525');
  poly(ctx, [[x + w * 0.52, y - 4], [x + w + 8, y + roofH], [x + w + 14, y + roofH + 2], [x + w * 0.56, y - 2]], '#352418');
  ctx.fillStyle = '#6c5039';
  ctx.fillRect(x, y + roofH, w, h - roofH);
  ctx.fillStyle = '#533b28';
  ctx.fillRect(x + w * 0.68, y + roofH, w * 0.32, h - roofH);
  ctx.fillStyle = '#3a291c';
  ctx.fillRect(x + w * 0.2, y + roofH + (h - roofH) * 0.25, w * 0.34, (h - roofH) * 0.75);
  ctx.fillStyle = '#d4b444';
  ctx.fillRect(x + w * 0.14, y + roofH + (h - roofH) * 0.52, w * 0.46, 5);
  ctx.strokeStyle = '#2d1e14'; ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y + roofH, w, h - roofH);
}

function drawContainCell(ctx, pts, code, drawInside) {
  poly(ctx, pts, '#424950');
  outline(ctx, pts, '#7c8892', 2.5);
  const win = qsub(pts, 0.16, 0.22, 0.84, 0.64);
  const wb = bounds(win);
  ctx.save();
  poly(ctx, win, '#181e24');
  ctx.clip();
  if (drawInside) drawInside(wb[0], wb[1], wb[2], wb[3]);
  seg(ctx, qpt(win, 0.15, 0.85), qpt(win, 0.65, 0.12), 'rgba(200,225,240,0.16)', 3);
  ctx.restore();
  outline(ctx, win, '#8fa0ac', 1.5);
  poly(ctx, qsub(pts, 0.18, 0.04, 0.82, 0.15), '#20262c');
  qtxt(ctx, code, pts, 0.18, 0.04, 0.82, 0.15, '#e0eaf2', 11);
  const led = qpt(pts, 0.86, 0.095);
  ctx.fillStyle = '#e5a93c';
  ctx.beginPath(); ctx.arc(led[0], led[1], 2.5, 0, Math.PI * 2); ctx.fill();
}

const c1EntryBox = { x1: 0.72, x2: 1.42, y1: 0.58, y2: 1, z1: 1.65, z2: 2.35, color: '#9c7d54', top: '#b8986b', edge: true };
const c1EntryWin = wallQuad(-1.5, -0.45, 0.35, 2.5, 3.8);
const c1EntryDoor = faceQuad(-0.38, -0.55, 0.38, 1, 7.499);

const c1HallDoorL = wallQuad(-1.5, -0.55, 1, 2.2, 3.0);
const c1HallDoorM = faceQuad(-0.62, -0.55, 0.02, 1, 7.499);
const c1HallDoorR = wallQuad(1.5, -0.55, 1, 2.2, 3.0);
const c1HallEndDoor = faceQuad(0.26, -0.55, 0.9, 1, 7.499);
const c1HallWin = wallQuad(-1.5, -0.45, 0.35, 4.2, 5.2);
const c1HallMirror = wallQuad(1.5, -0.5, 0.7, 4.4, 5.4);

function hallTarget(s, slot) {
  const routes = ['c1_bench', 'c1_mirror', 'c1_hall'];
  return routes[((s.flags.c1_seed || 1) + slot) % 3];
}

const c1BenchNote = faceQuad(-1.15, 0.85, -0.78, 0.96, 2.35);
const c1BenchAhead = faceQuad(-0.36, -0.55, 0.36, 1, 7.499);

const c1MirrorWall = faceQuad(-0.92, -0.72, 0.92, 0.92, 7.48);

const c1DoorMain = faceQuad(-0.42, -0.58, 0.42, 1, 6.499);
const c1DoorPlaque = faceQuad(-0.18, -0.18, 0.18, -0.02, 6.498);
const c1DoorWin = wallQuad(-1.5, -0.45, 0.35, 2.4, 3.5);

export const C1_SCENES = {
  c1_entry: {
    level: 'C1', title: '乾淨的房間', room: c1Room, quiet: 0.9,
    viewMsg: '觀景窗裡什麼也沒有。聲音還是來了。',
    enter(g, { first }) {
      c1OnEnter(g, first ? '這裡沒有灰塵，沒有污漬，連你剛才踩上木地板的腳印也正在淡去。身後只剩下那個放大了的紙箱底部。' : null);
    },
    update: c1Update,
    draw(ctx, t, s, R) {
      drawSpotless(ctx, R);
      drawCleanWindow(ctx, c1EntryWin, '#f5f8fa');
      drawWhiteBench(ctx, R, 3.6, 4.8, 0.68, 1.35);
      poly(ctx, [P(0.68, 1, 1.62), P(1.45, 1, 1.62), P(1.45, 1, 2.38), P(0.68, 1, 2.38)], 'rgba(85, 72, 54, 0.2)');
      box(ctx, R, c1EntryBox);
      poly(ctx, [P(0.8, 0.58, 1.72), P(1.34, 0.58, 1.72), P(1.34, 0.58, 2.28), P(0.8, 0.58, 2.28)], '#2c2115');
      poly(ctx, [P(0.72, 0.58, 1.65), P(1.42, 0.58, 1.65), P(1.48, 0.44, 1.56), P(0.68, 0.44, 1.56)], '#b69466');
      poly(ctx, [P(1.42, 0.58, 1.65), P(1.42, 0.58, 2.35), P(1.56, 0.52, 2.35), P(1.56, 0.52, 1.65)], '#a58458');
      drawWhiteDoor(ctx, c1EntryDoor);
    },
    drawOver: c1DrawOver,
    hotspots: [
      back('l0_dry', '爬回紙箱', '你彎腰鑽進身後那個放大了的紙箱內側，重新落回乾燥走廊的黃色地毯上。'),
      hit('window', bounds(c1EntryWin, 8), '白框窗', (g) => g.say('玻璃擦得像不存在一樣。外面只有一片均勻、刺眼的冷白色。')),
      hit('bench', bounds([P(0.68, 0.45, 3.6), P(1.35, 1, 4.8)], 8), '白色長椅', (g) => g.say('椅子乾淨得反光。你伸手摸了一下，指腹沒有沾到半點微塵。')),
      hit('ahead', bounds(c1EntryDoor, 10), '盡頭的白門', (g) => c1Advance(g, 'c1_hall', '你推開這扇過於乾淨的房門，走進兩側延伸的白牆之間。'), 'go'),
    ],
  },

  c1_hall: {
    level: 'C1', title: '無盡的長廊', room: c1Room, quiet: 0.9,
    viewMsg: '觀景窗裡什麼也沒有。聲音還是來了。',
    enter(g, { first }) {
      c1OnEnter(g, first ? '兩側排開完全相同的門、窗與鏡子。剛經過的門位和記憶裡已經不太一樣了。' : null);
    },
    update: c1Update,
    draw(ctx, t, s, R) {
      drawSpotless(ctx, R);
      drawWhiteDoor(ctx, c1HallDoorL);
      drawWhiteDoor(ctx, c1HallDoorM);
      drawWhiteDoor(ctx, c1HallDoorR);
      drawCleanWindow(ctx, c1HallWin, '#e3edf2');
      poly(ctx, c1HallMirror, '#dce7ee');
      ctx.strokeStyle = '#c4cfd8'; ctx.lineWidth = 2; poly(ctx, c1HallMirror); ctx.stroke();
      if ((s.flags.c1_steps || 0) >= 8) drawWhiteDoor(ctx, c1HallEndDoor, 'C-2');
    },
    drawOver: c1DrawOver,
    hotspots: [
      back('c1_entry', '退回進來的房間'),
      hit('door_left', bounds(c1HallDoorL, 8), '左邊的白門', (g) => c1Advance(g, hallTarget(g.s, 0)), 'go'),
      hit('door_mid', bounds(c1HallDoorM, 8), '正前方的白門', (g) => c1Advance(g, hallTarget(g.s, 1)), 'go'),
      hit('door_right', bounds(c1HallDoorR, 8), '右邊的白門', (g) => c1Advance(g, hallTarget(g.s, 2)), 'go'),
      hit('window', bounds(c1HallWin, 8), '走廊旁的窗戶', (g) => {
        if ((g.s.flags.c1_steps || 0) < 3) {
          return g.say('窗玻璃後面隱約有一望無際的平地輪廓，但窗栓像是還卡在木框裡。再多走幾步也許會鬆開。');
        }
        g.go('c1e_outskirts', { msg: '窗栓輕輕一撥就鬆開了。你翻過窗框落進草地，冷白的瓷磚走廊已經消失在身後。' });
      }, 'go'),
      hit('mirror_wall', bounds(c1HallMirror, 8), '嵌牆窄鏡', (g) => g.say('鏡子把這條冷白的長廊又複製進牆裡一次。')),
      hit('end_door', bounds(c1HallEndDoor, 10), '多出來的門（C-2）', (g) => g.go('c1_door', { msg: '走廊盡頭不知何時多出一扇白門，上頭釘著一塊寫有「C-2」的金屬牌。' }), 'go', {
        when: (s) => (s.flags.c1_steps || 0) >= 8,
      }),
    ],
  },

  c1_bench: {
    level: 'C1', title: '長椅之間', room: c1Room, quiet: 0.9,
    viewMsg: '觀景窗裡什麼也沒有。聲音還是來了。',
    enter(g, { first }) {
      c1OnEnter(g, first ? '整排一模一樣的白色長椅沿牆排開，像候診室，卻找不到任何告示或垃圾桶。' : null);
    },
    update: c1Update,
    draw(ctx, t, s, R) {
      drawSpotless(ctx, R);
      for (const z of [2.1, 3.6, 5.1]) {
        drawWhiteBench(ctx, R, z, z + 0.75, -1.32, -0.65);
        drawWhiteBench(ctx, R, z, z + 0.75, 0.65, 1.32);
      }
      paper(ctx, R, c1BenchNote, 2.35, '#edf1f5');
      drawWhiteDoor(ctx, c1BenchAhead);
    },
    drawOver: c1DrawOver,
    hotspots: [
      back('c1_hall', '回到長廊'),
      hit('rest', bounds([P(-1.32, 0.45, 2.1), P(-0.65, 1, 2.85)], 8), '在長椅上坐下', (g) => {
        if (once(g, 'c1_bench_rested')) {
          g.sanity(8);
          return g.say('你在冷冰冰的長椅上坐了幾分鐘。四周沒有任何灰塵與蟲鳴，緊繃的神經稍稍緩下來一些。');
        }
        g.say('再坐下去，這種過頭的潔白反而讓人心慌。');
      }),
      hit('note_clean', bounds(c1BenchNote, 10), '長椅下的記號', (g) => g.read('n_c1_clean')),
      hit('ahead', bounds(c1BenchAhead, 10), '繼續往前走', (g) => c1Advance(g, 'c1_hall', '你站起身穿過盡頭的白門，格局又換了一輪。'), 'go'),
    ],
  },

  c1_mirror: {
    level: 'C1', title: '鏡廳', room: c1Room, quiet: 0.9,
    viewMsg: '觀景窗裡什麼也沒有。聲音還是來了。',
    enter(g, { first }) {
      c1OnEnter(g, first ? '一整面牆都被落地鏡覆蓋，冷白瓷磚在鏡子裡折出無窮無盡的倒影。' : null);
    },
    update: c1Update,
    draw(ctx, t, s, R) {
      drawSpotless(ctx, R);
      for (const sSide of [-1, 1]) {
        const mw = wallQuad(sSide * 1.5, -0.68, 0.88, 1.8, 6.2);
        poly(ctx, mw, '#dbe7ef');
        ctx.strokeStyle = '#bcc8d2'; ctx.lineWidth = 2.5; poly(ctx, mw); ctx.stroke();
      }
      const mb = bounds(c1MirrorWall);
      const mg = ctx.createLinearGradient(mb[0], mb[1], mb[0] + mb[2], mb[1] + mb[3]);
      mg.addColorStop(0, '#dde9f0');
      mg.addColorStop(0.5, '#eaf2f6');
      mg.addColorStop(1, '#cfdce4');
      poly(ctx, c1MirrorWall, mg);
      for (const vx of [-0.32, 0.32]) seg(ctx, P(vx, -0.72, 7.48), P(vx, 0.92, 7.48), 'rgba(170, 184, 196, 0.65)', 1.5);
      seg(ctx, [mb[0] + mb[2] * 0.14, mb[1] + mb[3] * 0.85], [mb[0] + mb[2] * 0.36, mb[1] + mb[3] * 0.12], 'rgba(255,255,255,0.45)', 5);
      ctx.strokeStyle = '#aebdc9'; ctx.lineWidth = 3.5; poly(ctx, c1MirrorWall); ctx.stroke();
      if (s.inv.includes('dragon_scale')) {
        glow(ctx, 560, 260, 68, '#69b8ff', 0.45);
        poly(ctx, faceQuad(0.24, -0.55, 0.72, 0.85, 7.46), 'rgba(90, 170, 245, 0.35)');
      }
      // Faint silhouette reflected inside the back mirror wall
      const pTop = P(0, -0.32, 7.45), pBot = P(0, 0.72, 7.45);
      ctx.save();
      ctx.fillStyle = 'rgba(130, 148, 162, 0.28)';
      ctx.beginPath();
      ctx.ellipse(pTop[0], (pTop[1] + pBot[1]) / 2 + 8, 18, (pBot[1] - pTop[1]) * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pTop[0], pTop[1] + 10, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
    drawOver: c1DrawOver,
    hotspots: [
      back('c1_hall', '回到長廊'),
      hit('mirror', bounds(faceQuad(-0.92, -0.72, 0.16, 0.92, 7.48), 10), '整面鏡牆', (g) => {
        if (once(g, 'c1_mirror_spooked')) {
          g.sanity(-3);
          g.sfx('sting');
          return g.say('你走近鏡面——裡頭的倒影明顯慢了半拍才抬起手，像玻璃後面有另一個自己正在學你的動作。');
        }
        g.say('冰涼平滑的鏡面如實映出你站著的身影，玻璃上連半個指紋都沒有。');
      }),
      hit('rift_portal', bounds(faceQuad(0.22, -0.56, 0.74, 0.86, 7.46), 10), '鏡面深處的藍色裂隙', (g) => {
        g.go('c1x_rift', { msg: '懷裡那片龍鱗隱隱發燙。鏡面沒有碎裂，而是像水波般朝兩側讓開，讓你踏進一道冰冷的藍光裂縫。' });
      }, 'go', { when: (s) => s.inv.includes('dragon_scale') }),
    ],
  },

  c1_door: {
    level: 'C1', title: '盡頭的門', room: { ...c1Room, depth: 6.5 }, quiet: 0.9,
    viewMsg: '觀景窗裡什麼也沒有。聲音還是來了。',
    enter(g, { first }) {
      c1OnEnter(g, first ? '這扇孤單的門站在潔白瓷磚盡頭。金屬門牌把它的去處標得清清楚楚。' : null);
    },
    update: c1Update,
    draw(ctx, t, s, R) {
      drawSpotless(ctx, R);
      drawCleanWindow(ctx, c1DoorWin, '#e3edf2');
      drawWhiteDoor(ctx, c1DoorMain, 'C-2');
    },
    drawOver: c1DrawOver,
    hotspots: [
      back('c1_hall', '折返長廊'),
      hit('plaque', bounds(c1DoorPlaque, 10), '「C-2」門牌', (g) => g.read('n_c1_door')),
      hit('open_door', bounds(c1DoorMain, 8), '推開「C-2」的門', (g) => g.end('c2_door'), 'go'),
      hit('door_window', bounds(c1DoorWin, 8), '牆邊的窗戶', (g) => g.say('玻璃外是一望無際的淺灰平原輪廓，這扇窗從裡面封死了。')),
    ],
  },

  // ---------- Report II: 東舟市 (Level C-1.2) ----------
  ...(() => {
    const plainPal = pal('#788992', '#8fa3ae', '#556552', '#9fb0ba', '#e6eef2');
    const cityPal = pal('#8a8e91', '#9aa0a6', '#67696b', '#4d5257', '#d8dee4');
    const acmaPal = pal('#787e84', '#585e64', '#4e5256', '#282c30', '#dbe6ee');
    const cavePal = pal('#2a2826', '#1a1918', '#23201d', '#090908', '#8c8070');
    const gardenPal = pal('#98a49c', '#b4c2b8', '#687666', '#8a998d', '#edf5ee');

    const plainRoom = room(plainPal, { hw: 2.2, depth: 9, fogEnd: 16, open: true, floorTex: 'carpet', baseboard: false, lights: [] });
    const cityStreetRoom = room(cityPal, { hw: 1.9, depth: 8.5, fogEnd: 15, open: true, floorTex: 'concrete', baseboard: false, lights: [] });
    const cityRoom = room(cityPal, { hw: 1.8, depth: 8.5, fogEnd: 14, wallTex: 'concrete', floorTex: 'concrete', lights: [2.0, 5.2] });
    const acmaRoom = room(acmaPal, { hw: 1.6, depth: 8, fogEnd: 13, tiles: true, floorTex: 'concrete', lights: [1.8, 4.4, 6.8] });
    const caveRoom = room(cavePal, { hw: 1.5, depth: 7, fogEnd: 7, wallTex: 'concrete', baseboard: false, lights: [] });
    const gardenRoom = room(gardenPal, { hw: 1.8, depth: 8, fogEnd: 15, tiles: true, floorTex: 'concrete', lights: [2.2, 5.4] });

    let caveStillT = 0;

    function c1eEnterCity(g, msg) {
      g.flag('c1e_in_city', true);
      const moves = (g.s.flags.c1e_moves || 0) + 1;
      g.flag('c1e_moves', moves);
      const grew = moves % 12 === 0;
      if (msg && grew) g.say(`${msg} 街角空地上又新長出一棟毛坯水泥樓，牆腳還掛著沒乾的濕土。`);
      else if (msg) g.say(msg);
      else if (grew) g.say('旁邊不知何時多出一棟剛從地面生長出來的毛坯建築，外牆還沾著泥塊。');
    }

    const hollows = [P(-1.3, 0.99, 2.3), P(-0.6, 0.99, 2.3), P(-0.6, 0.99, 3.0), P(-1.3, 0.99, 3.0)];
    const cabinQuad = wallQuad(-2.2, -0.15, 0.78, 4.4, 5.6);
    const cavePathQuad = wallQuad(2.2, -0.55, 0.35, 3.8, 5.1);
    const trekSignQuad = faceQuad(0.85, 0.42, 1.48, 0.98, 2.2);
    const cityArchQuad = faceQuad(-0.72, -0.35, 0.72, 0.95, 8.999);

    const gateNoticeQuad = wallQuad(-1.8, -0.45, 0.35, 2.2, 3.2);
    const gateDeskBox = { x1: 0.7, x2: 1.4, y1: 0.38, y2: 1, z1: 2.1, z2: 2.8, color: '#586068', top: '#6d7780', edge: true };
    const gateAhead = faceQuad(-0.45, -0.55, 0.45, 1, 8.499);

    const roadLabDoor = wallQuad(-1.8, -0.55, 1, 2.2, 3.2);
    const roadAcmaDoor = faceQuad(-0.95, -0.55, -0.1, 1, 8.499);
    const roadGardenDoor = faceQuad(0.15, -0.55, 1.0, 1, 8.499);
    const roadFactorySign = wallQuad(1.8, -0.45, 0.55, 2.3, 3.4);

    const labBoardQuad = wallQuad(-1.8, -0.65, 0.35, 2.1, 3.7);
    const labShijuQuad = faceQuad(-0.85, 0.12, -0.1, 0.5, 4.6);
    const labSpareQuad = faceQuad(0.25, 0.05, 0.95, 0.58, 4.6);

    const cell024 = wallQuad(-1.6, -0.58, 0.82, 2.1, 3.5);
    const cell025 = faceQuad(-0.72, -0.55, 0.08, 0.9, 7.999);
    const cell013 = wallQuad(1.6, -0.58, 0.82, 2.1, 3.5);

    const caveWallL = wallQuad(-1.5, -0.6, 0.6, 2.4, 4.4);
    const caveVoiceRect = [330, 130, 300, 190];
    const caveRubbleBox = { x1: -1.1, x2: 1.1, y1: 0.25, y2: 1, z1: 2.8, z2: 4.5, color: '#4d4a46', top: '#5d5954', edge: true };

    const gardenBench = { x1: -1.45, x2: -0.75, y1: 0.48, y2: 1, z1: 2.3, z2: 3.1, color: '#6b786c', top: '#7e8c7f', edge: true };
    const gardenFountain = { x1: 0.8, x2: 1.45, y1: 0.35, y2: 1, z1: 2.1, z2: 2.7, color: '#7a8789', top: '#94a4a6', edge: true };
    const gardenCrate = { x1: -0.4, x2: 0.4, y1: 0.55, y2: 1, z1: 4.0, z2: 4.6, color: '#53624d', top: '#687960', edge: true };

    function drawCityBlock(ctx, R, x, topY, z1, z2, baseHex = '#686e73', rebars = true, windows = true) {
      const outerX = x < 0 ? x - 0.85 : x + 0.85;
      poly(ctx, [P(x, topY, z1), P(outerX, topY, z1), P(outerX, 1, z1), P(x, 1, z1)], shade(R, '#4c5258', z1));
      const wq = wallQuad(x, topY, 1, z1, z2);
      poly(ctx, wq, shade(R, baseHex, (z1 + z2) * 0.5));
      outline(ctx, wq, '#3a3f44', 1.5);
      if (windows) {
        poly(ctx, qsub(wq, 0.2, 0.2, 0.46, 0.42), '#25292e');
        poly(ctx, qsub(wq, 0.56, 0.2, 0.82, 0.42), '#25292e');
      }
      // Subtle low jagged earth mounds tucked tight against the base of freshly-erupted walls
      const dir = x < 0 ? 1 : -1;
      const zm1 = z1 + (z2 - z1) * 0.28, zm2 = z1 + (z2 - z1) * 0.68;
      poly(ctx, [
        P(x, 0.95, z1), P(x + dir * 0.05, 0.99, z1 + 0.1), P(x, 0.92, zm1),
        P(x + dir * 0.07, 1, zm1 + 0.15), P(x, 0.94, zm2), P(x + dir * 0.04, 1, z2), P(x, 1, z2), P(x, 1, z1),
      ], '#463b31');
      if (rebars) {
        for (const u of [0.22, 0.5, 0.78]) {
          const zr = z1 + (z2 - z1) * u;
          seg(ctx, P(x, topY, zr), P(x, topY - 0.16, zr), '#363a3f', 2.4);
        }
      }
    }

    function drawCitySkyline(ctx, R, z, towers) {
      for (const [x1, topY, x2, col] of towers) {
        poly(ctx, faceQuad(x1, topY, x2, 1, z), col);
        for (let wy = topY + 0.18; wy < 0.78; wy += 0.24) {
          poly(ctx, faceQuad(x1 + 0.08, wy, x2 - 0.08, wy + 0.08, z - 0.01), '#282d32');
        }
      }
    }

    return {
      c1e_outskirts: {
        level: 'C1.2', title: '平原邊緣', room: plainRoom, quiet: 0.65,
        viewMsg: '觀景窗裡，遠處東舟市尚未抹灰的水泥輪廓清楚了不少，地上圓坑的邊緣也顯得分外整齊。',
        enter(g, { first }) {
          if (g.s.flags.c1s_rescued && once(g, 'c1s_delivered')) {
            return g.say('東舟市三方接應小組把高燒的落君送往醫療部門。幾天之後傳來消息：盤踞在俄刻阿諾斯號入口的所有子空間忽然全部消失，再也沒有出現過。');
          }
          if (g.s.flags.c1e_in_city) {
            g.flag('c1e_in_city', false);
            g.sfx('groan');
            g.sanity(-2);
            return g.say('剛離開東舟市管制線，遠方平原霧氣深處就傳來一聲低沉的嘶吼——城外並不安全。');
          }
          if (first) g.say('一望無際的淺灰草原鋪開在眼前。遠處立著灰白色的東舟市外牆，空氣裡帶著潮濕的泥土與草腥味。');
        },
        draw(ctx, t, s, R) {
          const hy = P(0, 1, R.depth)[1];
          drawHills(ctx, hy, [['#6e7e7a', 42, 0.4], ['#59685d', 24, 2.1]]);
          // Far skyline & perimeter wall of East Boat City
          poly(ctx, [P(-2.4, 0.25, 9), P(2.4, 0.25, 9), P(2.4, 1, 9), P(-2.4, 1, 9)], '#4c5458');
          for (const [bx, bw, bh, lit] of [[-1.1, 0.36, 0.62, 0], [-0.62, 0.32, 0.72, 1], [-0.22, 0.42, 0.94, 1], [0.26, 0.35, 0.68, 0], [0.68, 0.4, 0.56, 1], [1.14, 0.3, 0.48, 0]]) {
            const p1 = P(bx, 0.25 - bh, 8.95), p2 = P(bx + bw, 0.25, 8.95);
            ctx.fillStyle = lit ? '#495259' : '#535c62';
            ctx.fillRect(p1[0], p1[1], p2[0] - p1[0], p2[1] - p1[1]);
            ctx.fillStyle = 'rgba(210, 224, 232, 0.16)';
            for (let wy = p1[1] + 5; wy < p2[1] - 4; wy += 6) ctx.fillRect(p1[0] + 3, wy, Math.max(2, (p2[0] - p1[0]) - 6), 2);
          }
          drawPortalArch(ctx, cityArchQuad, '#1f252a', '#626d75', '東舟市外環');
          // Beaten dirt path leading from foreground toward city gate
          poly(ctx, [P(-0.22, 1, 9), P(0.22, 1, 9), P(0.5, 1, 1.4), P(-0.5, 1, 1.4)], 'rgba(92, 86, 74, 0.38)');
          // Sunken grassy crater depression (vanished floating island / reverse waterfall mark)
          const hp = P(-0.95, 1, 2.65);
          ctx.save();
          ctx.fillStyle = 'rgba(34, 42, 32, 0.48)';
          ctx.beginPath(); ctx.ellipse(hp[0], hp[1] + 2, 58, 18, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = 'rgba(130, 146, 125, 0.45)'; ctx.lineWidth = 1.8;
          ctx.beginPath(); ctx.ellipse(hp[0], hp[1], 56, 16, 0, 0, Math.PI * 2); ctx.stroke();
          ctx.restore();
          // Locked freestanding wooden cabin (C-100 mention only)
          drawTimberCabin(ctx, cabinQuad);
          // Craggy right rocky hillock with dark cave mouth seated onto the grass ground
          const cr = bounds(cavePathQuad);
          const baseLineY = hy + 28;
          poly(ctx, [[cr[0] - 58, hy + 10], [cr[0] - 24, cr[1] - 6], [cr[0] + 18, cr[1] - 34], [cr[0] + 68, cr[1] - 24], [W, cr[1] - 48], [W, baseLineY + 12], [cr[0] - 42, baseLineY]], '#3d423c');
          poly(ctx, [[cr[0] - 32, baseLineY - 2], [cr[0] + 4, cr[1] - 12], [cr[0] + 54, cr[1] - 28], [W, cr[1] - 18], [W, baseLineY + 10]], '#2d322c');
          poly(ctx, [[cr[0] + 4, baseLineY - 6], [cr[0] + 8, cr[1] + 14], [cr[0] + cr[2] * 0.5, cr[1] + 2], [cr[0] + cr[2] - 6, cr[1] + 16], [cr[0] + cr[2] - 2, baseLineY - 6]], '#0c0e0c');
          poly(ctx, [[cr[0] - 8, baseLineY - 8], [cr[0] + cr[2] + 8, baseLineY - 8], [cr[0] + cr[2] - 25, baseLineY + 62], [cr[0] - 68, baseLineY + 56]], 'rgba(84, 82, 74, 0.44)');
          // Planted SE trail signpost
          drawSignPost(ctx, trekSignQuad, '東南 7.9 km ▶', 'OCEANUS', '#48545c', '#8ca0ac');
          drawGrassField(ctx, hy, 44, 2, 'rgba(62, 82, 54, 0.62)', 22);
        },
        hotspots: [
          back('c1_hall', '翻回偏路的窗戶', '你抓住漂浮在草坡邊的窗框翻了回去，身後重新合上冷白一塵不染的長廊。'),
          hit('hollows', bounds(hollows, 8), '地面的圓形凹痕', (g) => g.say('草皮底下陷著幾個異常規整的圓坑。傳說懸浮島、不倒岩群與逆流瀑布曾懸在這裡，如今只剩空蕩蕩的凹痕。')),
          hit('cabin', bounds(cabinQuad, 8), '上鎖的小木屋', (g) => g.say('一間上了重鎖的獨棟木屋。封條印著「M.E.G. 破門項目（C-100 方向）——生人勿進」。')),
          hit('trek', bounds(trekSignQuad, 8), '向東南步行 7.9 公里（俄刻阿諾斯號）', (g) => g.go('c1e_trek'), 'go'),
          hit('to_cave', bounds(cavePathQuad, 8), '山壁下的洞穴', (g) => g.go('c1e_cave', { msg: '你沿著石礫小徑走進山壁底下的陰暗洞口。' }), 'go'),
          hit('to_city', bounds(cityArchQuad, 8), '前往東舟市外環', (g) => g.go('c1e_gate'), 'go'),
        ],
      },

      c1e_gate: {
        level: 'C1.2', title: '東舟市外環', room: cityStreetRoom, quiet: 0.45,
        viewMsg: '觀景窗裡，剛長出來的毛坯樓牆角正掉下細碎的泥土。',
        enter(g, { first }) {
          c1eEnterCity(g, first ? '外環一排排灰色毛坯水泥建築靜靜立在眼前，牆腳還沾著像剛從地底拱出來似的泥土。哨站標著三方聯合的徽記。' : null);
        },
        draw(ctx, t, s, R) {
          drawCitySkyline(ctx, R, 8.65, [
            [-2.2, -1.35, -1.15, '#596067'], [-1.1, -1.55, -0.15, '#4f555c'],
            [0.25, -1.4, 1.2, '#545b62'], [1.25, -1.15, 2.2, '#60676e'],
          ]);
          drawCityBlock(ctx, R, -1.8, -0.9, 6.2, 7.6, '#5c6268', true);
          drawCityBlock(ctx, R, -1.8, -1.15, 4.2, 5.7, '#646a70', true);
          drawCityBlock(ctx, R, -1.8, -0.95, 1.9, 3.6, '#6d7378', true, false);
          drawCityBlock(ctx, R, 1.8, -1.25, 5.3, 7.0, '#5c6267', true);
          drawCityBlock(ctx, R, 1.8, -1.05, 3.0, 4.6, '#666c72', true);
          // Paved checkpoint road leading through the outer gatehouse arch
          for (const z of [1.8, 3.6, 5.6]) {
            poly(ctx, [P(-0.04, 1, z), P(0.04, 1, z), P(0.04, 1, z + 0.8), P(-0.04, 1, z + 0.8)], 'rgba(218, 224, 228, 0.35)');
          }
          poly(ctx, faceQuad(-0.92, -0.82, 0.92, 1, 8.53), '#555b61');
          paper(ctx, R, gateNoticeQuad, 2.7, '#eef0ec');
          poly(ctx, qsub(gateNoticeQuad, 0.03, 0.03, 0.97, 0.14), '#365872');
          box(ctx, R, gateDeskBox);
          glow(ctx, 735, 310, 42, '#ffdba0', 0.25);
          if (!s.flags.c1e_got_recorder && !s.flags.c1e_013_done) {
            const pt = P(1.05, 0.34, 2.45);
            ctx.fillStyle = '#24272e'; ctx.fillRect(pt[0] - 9, pt[1] - 5, 18, 10);
            ctx.fillStyle = '#d64545'; ctx.beginPath(); ctx.arc(pt[0] + 4, pt[1], 2.2, 0, Math.PI * 2); ctx.fill();
          }
          drawPortalArch(ctx, gateAhead, '#23282e', '#636c74', '市中心大道');
        },
        hotspots: [
          back('c1e_outskirts', '回到平原邊緣'),
          hit('notice', bounds(gateNoticeQuad, 8), '三方聯合哨站須知', (g) => g.read('n_c1e_gate')),
          hit('recorder_desk', boxRect(gateDeskBox, 8), '哨站發放台', (g) => {
            if (once(g, 'c1e_got_recorder')) {
              return g.give('recorder', '哨站值班員核對過許可後遞來一支錄音筆：「只限在授權設施裡使用，ACMA 的檔案員在裡面等你。」');
            }
            g.say('發放台上只剩一疊空白的訪客登記表——M.E.G.、後室機器人科技與 E.P.B. 的印章並排印在上頭。');
          }),
          hit('ahead', bounds(gateAhead, 8), '進入市中心大道', (g) => g.go('c1e_road'), 'go'),
        ],
      },

      c1e_road: {
        level: 'C1.2', title: '市中心大道', room: { ...cityStreetRoom, hw: 2.0, depth: 9 }, quiet: 0.4,
        viewMsg: '觀景窗裡能看見遠處各區的路牌都在微弱地反光。',
        enter(g, { first }) {
          c1eEnterCity(g, first ? '寬敞得過分的灰白大道向各區岔開：左面是三合研究院，前方通往 03 區 ACMA 與新紀花園，西側遠處則是撒加利工廠。' : null);
        },
        draw(ctx, t, s, R) {
          drawCitySkyline(ctx, R, 8.92, [
            [-2.4, -1.65, -1.3, '#545b61'], [-1.15, -1.5, 0.05, '#4c5258'],
            [0.12, -1.35, 1.35, '#545f57'], [1.45, -1.55, 2.5, '#52585e'],
          ]);
          // Three-Union Research Institute building facade on the left + right blocks along the boulevard
          drawCityBlock(ctx, R, -1.85, -1.2, 4.6, 6.8, '#585e64', true);
          drawCityBlock(ctx, R, 1.85, -1.1, 4.3, 6.6, '#5c6268', true);
          drawCityBlock(ctx, R, -1.8, -1.08, 1.75, 3.85, '#646e76', false);
          // Streetlamps flanking the open boulevard
          for (const z of [5.2, 2.1]) {
            for (const sx of [-1.72, 1.72]) {
              const sb = P(sx, 1, z), st = P(sx, -0.75, z);
              seg(ctx, sb, st, '#40454a', 2.4);
              seg(ctx, st, P(sx * 0.86, -0.75, z), '#40454a', 2);
              glow(ctx, P(sx * 0.86, -0.72, z)[0], P(sx * 0.86, -0.72, z)[1], 24, '#e6eef4', 0.22);
            }
          }
          // Wide concrete boulevard lane markings
          for (const z of [1.6, 3.1, 4.8, 6.6]) {
            poly(ctx, [P(-0.04, 1, z), P(0.04, 1, z), P(0.04, 1, z + 0.8), P(-0.04, 1, z + 0.8)], 'rgba(218, 224, 228, 0.45)');
          }
          seg(ctx, P(-1.85, 1, 1.2), P(-1.85, 1, 8.8), '#8a9196', 3);
          seg(ctx, P(1.85, 1, 1.2), P(1.85, 1, 8.8), '#8a9196', 3);
          // Grounded far buildings behind ACMA and New Age Garden portals
          poly(ctx, faceQuad(-1.35, -1.15, 0.05, 1, 8.54), '#4c5258');
          poly(ctx, faceQuad(0.08, -1.0, 1.38, 1, 8.54), '#4e5d52');
          drawPortalArch(ctx, roadLabDoor, '#242e36', shade(R, '#66747e', 2.7), '三合研究院');
          drawPortalArch(ctx, roadAcmaDoor, '#182028', shade(R, '#5c6670', 8.5), '03區 ACMA');
          drawPortalArch(ctx, roadGardenDoor, '#2a4230', shade(R, '#5c7260', 8.5), '新紀花園');
          drawSignPost(ctx, roadFactorySign, '西:撒加利工廠', '北:珀爾修斯 / 東:紅星', '#394148', '#8996a0', P(1.8, 1, 2.85)[1]);
        },
        hotspots: [
          back('c1e_gate', '退回外環哨站'),
          hit('to_lab', bounds(roadLabDoor, 8), '三合研究院', (g) => g.go('c1e_lab'), 'go'),
          hit('to_acma', bounds(roadAcmaDoor, 8), 'ACMA 收容設施（03 區）', (g) => g.go('c1e_acma'), 'go'),
          hit('to_garden', bounds(roadGardenDoor, 8), '新紀花園（生活區）', (g) => g.go('c1e_garden'), 'go'),
          hit('factory', bounds(roadFactorySign, 8), '城區方向指示牌', (g) => g.say('牌面指向其他三側分區：西面是由第十九次擴城巨型建築改建、佔地約七點四平方公里的撒加利工廠；北面是僅對 γ 級權限開放的 E.P.B. 珀爾修斯實驗室；東側則有紅星建築隊第 21 至 23 支隊駐紮。')),
        ],
      },

      c1e_lab: {
        level: 'C1.2', title: '三合研究院大廳', room: cityRoom, quiet: 0.5,
        viewMsg: '觀景窗掃過桌面時，紙頁上的光柵草圖顯得格外清晰。',
        enter(g, { first }) {
          c1eEnterCity(g, first ? '大廳裡整齊擺著研究紀錄櫃。一面牆上貼著各基地的聯防公告，桌上壓著時駒留下的研究手稿。' : null);
        },
        draw(ctx, t, s, R) {
          poly(ctx, labBoardQuad, '#394148');
          outline(ctx, labBoardQuad, '#7b8792', 2.5);
          poly(ctx, qsub(labBoardQuad, 0.04, 0.05, 0.96, 0.23), '#243a4c');
          qtxt(ctx, 'C-Lambda #11', labBoardQuad, 0.04, 0.05, 0.96, 0.23, '#dce9f2', 10);
          poly(ctx, qsub(labBoardQuad, 0.1, 0.32, 0.42, 0.72), '#d9d4c4');
          poly(ctx, qsub(labBoardQuad, 0.5, 0.36, 0.88, 0.68), '#cbd4dc');
          box(ctx, R, { x1: -1.0, x2: 1.05, y1: 0.45, y2: 1, z1: 4.3, z2: 4.9, color: '#6b7075', top: '#7f868c', edge: true });
          // CRT waveform monitor on lab counter
          ctx.fillStyle = '#23282d'; ctx.fillRect(450, 290, 42, 30);
          ctx.fillStyle = '#122922'; ctx.fillRect(454, 294, 34, 22);
          seg(ctx, [456, 306], [468, 299], '#62d99a', 1.5);
          seg(ctx, [468, 299], [484, 308], '#62d99a', 1.5);
          paper(ctx, R, labShijuQuad, 4.6, '#f4efdc');
          const spb = bounds(labSpareQuad);
          poly(ctx, labSpareQuad, '#323c44');
          ctx.strokeStyle = '#6c7c88'; ctx.lineWidth = 2; poly(ctx, labSpareQuad); ctx.stroke();
          for (let ly = spb[1] + 12; ly < spb[1] + spb[3] - 24; ly += 6) seg(ctx, [spb[0] + 10, ly], [spb[0] + spb[2] - 10, ly], '#1c242a', 1.5);
          txt(ctx, '備用庫房', CX(labSpareQuad), spb[1] + spb[3] - 10, '#c7d2d9', 10);
        },
        hotspots: [
          back('c1e_road', '回到市中心大道'),
          hit('board', bounds(labBoardQuad, 8), '基地公告欄', (g) => g.say('公告欄頂端印著「M.E.G. C 層群・C-Lambda 第十一主要基地聯絡站」。下方標註東舟市面積約五百一十平方公里，常駐人口嚴格控制在約一萬兩千人內。')),
          hit('shiju', bounds(labShijuQuad, 10), '時駒的研究手稿', (g) => g.read('n_c1e_lab')),
          hit('spare', bounds(labSpareQuad, 8), '儀器補給櫃', (g) => {
            if (!g.s.flags.c1e_013_done) {
              return g.say('補給登記簿上寫著：備用錄音筆只在原配備於採訪期間損毀後補發一支。');
            }
            if (once(g, 'c1e_got_recorder2')) {
              return g.give('recorder2', '工作人員聽說原本那支被 E-013 燒了，無奈地從庫房翻出最後一支貼有檢修標籤的備用錄音筆給你。');
            }
            g.say('備用器材格已經領空了。');
          }),
        ],
      },

      c1e_acma: {
        level: 'C1.2', title: 'ACMA 走廊', room: acmaRoom, quiet: 0.45,
        viewMsg: '觀景窗裡，兩扇觀察窗後面都只映出模糊的體溫輪廓；E-025 那間徹底是空的。',
        enter(g, { first }) {
          c1eEnterCity(g, first ? '03 區艾亞哥斯收容管理局（ACMA）的地下長廊。厚重的隔離室門邊貼著編號牌，兩名安保人員分別守在 E-024 與 E-013 門外。' : null);
        },
        draw(ctx, t, s, R) {
          drawContainCell(ctx, cell024, 'E-024', (gx, gy, gw, gh) => {
            ctx.fillStyle = '#4e5246';
            ctx.beginPath(); ctx.ellipse(gx + gw * 0.52, gy + gh * 0.72, 16, 11, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#3b3e36';
            ctx.beginPath(); ctx.arc(gx + gw * 0.42, gy + gh * 0.64, 6, 0, Math.PI * 2); ctx.fill();
          });
          drawContainCell(ctx, cell025, 'E-025', (gx, gy, gw, gh) => {
            ctx.fillStyle = 'rgba(200, 215, 225, 0.14)';
            ctx.fillRect(gx + gw * 0.25, gy + 4, gw * 0.5, 4);
            seg(ctx, [gx + gw * 0.5, gy + 8], [gx + gw * 0.5, gy + gh * 0.72], 'rgba(130, 145, 155, 0.4)', 1.5);
          });
          drawContainCell(ctx, cell013, 'E-013', (gx, gy, gw, gh) => {
            glow(ctx, gx + gw * 0.5, gy + gh * 0.68, 22, '#e66432', 0.35);
            ctx.fillStyle = '#181414';
            ctx.fillRect(gx + 2, gy + gh * 0.55, gw - 4, gh * 0.45);
            ctx.fillStyle = '#8a3228';
            ctx.beginPath(); ctx.arc(gx + gw * 0.5, gy + gh * 0.48, 7, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#d8d8dc';
            ctx.fillRect(gx + gw * 0.5 - 7, gy + gh * 0.56, 14, 24);
          });
        },
        hotspots: [
          back('c1e_road', '回到市中心大道'),
          hit('cell_024', bounds(cell024, 8), '收容室 E-024（Sampson Adams 看守）', (g) => {
            if (g.s.flags.c1e_024_done) return g.read('n_c1e_024');
            g.say('防彈玻璃裡縮著一隻約九十公分、像臃腫綿羊的生物，正啃食角落的雜物。安保 Sampson Adams 示意你拿起錄音筆對準通話孔採訪。');
          }, 'look', {
            use: {
              recorder: (g) => { g.flag('c1e_024_done'); g.read('n_c1e_024'); },
              recorder2: (g) => { g.flag('c1e_024_done'); g.read('n_c1e_024'); },
            },
          }),
          hit('cell_025', bounds(cell025, 8), '空置收容室 E-025', (g) => {
            g.say('「E-025」門牌還掛著，鎖扣完好無缺，裡面卻空無一物。值班表只留了一筆：某個夜晚之後，這個個體就憑空消失了。（另註：E-002 所在洞穴位於城外山腳。）');
          }),
          hit('cell_013', bounds(cell013, 8), '收容室 E-013（平井蒼生看守）', (g) => {
            if (g.s.flags.c1e_013_done) return g.read('n_c1e_013');
            g.say('紅髮、腰圍白色短袍的少年模樣坐在焦黑牆角。安保平井蒼生壓低聲音提醒：「它脾氣暴躁、自稱火神祝融，拿出錄音筆時當心。」');
          }, 'look', {
            use: {
              recorder: (g) => {
                if (once(g, 'c1e_013_done')) {
                  g.take('recorder');
                  g.give('dragon_scale');
                  g.sfx('sting');
                }
                g.read('n_c1e_013');
              },
              recorder2: (g) => {
                if (g.s.flags.c1e_013_done) return g.read('n_c1e_013');
                g.say('這支是備用的——要是直接湊過去，恐怕也會被它一起燒掉。');
              },
            },
          }),
        ],
      },

      c1e_cave: {
        level: 'C1.2', title: '野外洞穴', room: caveRoom, dark: true, quiet: 0.7,
        viewMsg: '觀景窗在漆黑石壁間掃來掃去，洞窟深處依舊沒有任何實體輪廓。',
        enter(g, { first }) {
          g.flag('c1e_in_city', false);
          caveStillT = 0;
          if (g.s.flags.c1e_cave_gone) {
            return g.say('整座洞口已經被上方擴城新長出的水泥地基撞塌，只剩死死堵路的碎石堆。');
          }
          if (first) g.say('洞裡漆黑一片，潮濕的風從岩縫底下往外滲。也許不該亂碰這裡的石壁，先靜靜站在暗處等一會兒。');
        },
        update(g, dt) {
          if (g.s.flags.c1e_cave_gone) return;
          caveStillT += dt;
          if (caveStillT >= 5 && once(g, 'c1e_002_heard')) {
            g.sfx('groan');
            if (g.has('recorder2') || g.has('recorder')) {
              g.flag('c1e_002_done');
              g.read('n_c1e_002');
            } else {
              g.say('漆黑深處緩緩泛起微光，響起一陣看不見來處的洪亮嗓音——可惜手邊沒有錄音筆可以記下來。');
            }
          }
        },
        draw(ctx, t, s, R) {
          // Layered jagged cavern rock strata framing ceiling and side walls
          poly(ctx, [[0, 0], [320, 0], [275, 115], [160, 225], [130, 415], [0, H]], '#1c1a18');
          poly(ctx, [[W, 0], [640, 0], [690, 125], [785, 240], [820, 410], [W, H]], '#1a1816');
          for (const [rx, ry, rw, rh] of [[240, 80, 18, 52], [350, 74, 14, 40], [585, 76, 16, 46], [705, 86, 20, 56]]) {
            poly(ctx, [[rx, ry], [rx + rw, ry], [rx + rw * 0.45, ry + rh]], '#2b2724');
          }
          if (s.flags.c1e_cave_gone) {
            box(ctx, R, caveRubbleBox);
            poly(ctx, [[305, 360], [390, 295], [470, 325], [565, 290], [655, 365]], '#58544f');
            seg(ctx, [380, 295], [405, 245], '#3d332c', 3);
            seg(ctx, [525, 300], [505, 242], '#3d332c', 3);
            return;
          }
          // Glow & floating resonance motes only (E-002's form is never seen)
          if (s.flags.c1e_002_heard || caveStillT >= 5) {
            glow(ctx, 480, 215, 118 + Math.sin(t * 2) * 8, '#d4af7a', 0.28);
            ctx.fillStyle = 'rgba(240, 212, 162, 0.5)';
            for (let i = 0; i < 12; i++) {
              const mx = 420 + ((i * 37) % 120), my = 175 + ((i * 29 + Math.round(t * 14)) % 85);
              ctx.fillRect(mx, my, 2, 2);
            }
          }
        },
        hotspots: [
          hit('back', [330, 470, 300, 70], '走出洞穴', (g) => {
            caveStillT = 0;
            if (!g.s.flags.c1e_cave_gone && (g.s.flags.c1e_002_done || g.s.flags.c1e_002_heard)) {
              g.flag('c1e_cave_gone');
              return g.go('c1e_outskirts', { msg: '剛跨出洞外，身後忽然傳來一聲轟鳴——一棟新冒出來的毛坯建築地基撞塌了岩洞，徹底堵死了去路。' });
            }
            g.go('c1e_outskirts');
          }, 'back'),
          hit('rock_wall', bounds(caveWallL, 8), '潮濕岩壁', (g) => {
            caveStillT = 0;
            g.say('你伸手敲了敲冰冷的岩石，剛才好像聽見的一絲回音頓時沉了下去。');
          }, 'look', { when: (s) => !s.flags.c1e_cave_gone }),
          hit('voice_002', caveVoiceRect, '暗處泛起的微光', (g) => {
            caveStillT = 0;
            if (g.s.flags.c1e_002_done) return g.read('n_c1e_002');
            g.say('聲音在看不見的暗處盤旋，唯有拿著錄音筆的人能錄下這段對話。');
          }, 'look', {
            when: (s) => !s.flags.c1e_cave_gone && s.flags.c1e_002_heard,
            use: {
              recorder2: (g) => { g.flag('c1e_002_done'); g.read('n_c1e_002'); },
              recorder: (g) => { g.flag('c1e_002_done'); g.read('n_c1e_002'); },
            },
          }),
          hit('rubble', boxRect(caveRubbleBox, 8), '崩塌的碎石', (g) => g.say('水泥樁與崩落岩塊把洞口壓得嚴嚴實實，這座洞穴已經回不去了。'), 'look', {
            when: (s) => !!s.flags.c1e_cave_gone,
          }),
        ],
      },

      c1e_garden: {
        level: 'C1.2', title: '新紀花園', room: gardenRoom, quiet: 0.7,
        viewMsg: '觀景窗裡，生活區植栽槽四周沒有異常干擾，看來確實是城內少有的安全區。',
        enter(g, { first }) {
          c1eEnterCity(g, first ? '南面的生活區「新紀花園」，水泥牆間安靜地擺著一排綠植盆栽、飲水台與補給箱。' : null);
        },
        draw(ctx, t, s, R) {
          // Sunlit atrium skylight wash + wooden slatted park bench + stone drinking fountain + planters
          glow(ctx, 480, 140, 210, '#dceee0', 0.16);
          for (const px of [-1.25, -0.78, 0.85, 1.32]) {
            const p = P(px, 0.62, 5.2);
            ctx.fillStyle = '#475249'; ctx.fillRect(p[0] - 24, p[1] + 6, 48, 22);
            for (let li = -2; li <= 2; li++) {
              ctx.fillStyle = li % 2 ? '#3b6441' : '#4a7a51';
              ctx.beginPath(); ctx.ellipse(p[0] + li * 7, p[1] - Math.abs(li) * 3, 12, 16, li * 0.2, 0, Math.PI * 2); ctx.fill();
            }
          }
          box(ctx, R, gardenBench);
          seg(ctx, P(-1.42, 0.42, 2.35), P(-0.78, 0.42, 3.05), '#534638', 4);
          box(ctx, R, gardenFountain);
          glow(ctx, P(1.12, 0.35, 2.4)[0], P(1.12, 0.35, 2.4)[1], 24, '#a6dbe8', 0.32);
          box(ctx, R, gardenCrate);
        },
        hotspots: [
          back('c1e_road', '回到市中心大道'),
          hit('rest', boxRect(gardenBench, 8), '花園長椅', (g) => {
            if (once(g, 'c1e_garden_rested')) {
              g.sanity(15);
              return g.say('你在生活區的長椅上閉眼休息了片刻。耳邊沒有嘶吼，也沒有擴城石塊摩擦的聲響。');
            }
            g.say('已經歇夠了，再賴著不走也只是消耗隨身補給。');
          }),
          hit('fountain', boxRect(gardenFountain, 8), '生活區飲水機', (g) => {
            if (once(g, 'c1e_garden_water')) {
              g.drink(35);
              g.sfx('drink');
              return g.say('你捧起冰涼乾淨的過濾水喝了個飽，喉嚨舒服多了。');
            }
            g.say('水台目前正在排空清洗，暫時放不出更多水。');
          }),
          hit('ration', boxRect(gardenCrate, 8), '配給箱', (g) => {
            if (once(g, 'c1e_garden_food')) {
              return g.give('bar', '配給箱裡放著一條封口完好的能量棒。');
            }
            g.say('配給箱已經空了。');
          }),
        ],
      },
    };
  })(),

  // ---------- Report III: 驤亭 (Level C-1.3) ----------
  ...(() => {
    const skyPal = pal('#8ba6b8', '#9ec0d6', '#5e7346', '#a4bac8', '#eaf4fa');
    const basePal = pal('#5e666e', '#6f7c86', '#4c5448', '#7d8a94', '#dce6ee');
    const eyePal = pal('#222830', '#161a20', '#1a2026', '#0c1014', '#72b8e8');

    const meadowRoom = room(skyPal, { hw: 2.2, depth: 9.5, fogEnd: 18, open: true, floorTex: 'carpet', baseboard: false, lights: [] });
    const baseRoom = room(basePal, { hw: 2.0, depth: 9, fogEnd: 16, open: true, floorTex: 'concrete', baseboard: false, lights: [] });
    const eyeRoom = room(eyePal, { hw: 1.6, depth: 7.5, fogEnd: 11, floorTex: 'concrete', lights: [2.2, 5.2] });

    let clankWait = 6;
    let wingAnimT = 0;

    function drawGrass(ctx, R, seedShift = 0) {
      const hy = P(0, 1, R.depth)[1];
      drawHills(ctx, hy, [['#72887e', 38, seedShift * 0.4], ['#596d54', 22, seedShift * 0.7 + 1.4]]);
      drawGrassField(ctx, hy, 54, seedShift, 'rgba(64, 92, 42, 0.72)', 34);
      drawGrassField(ctx, hy, 28, seedShift + 5, 'rgba(130, 152, 92, 0.45)', 24);
    }

    const riftQuad = faceQuad(-0.22, -0.78, 0.22, 0.72, 2.2);
    const riftStone = { x1: -1.3, x2: -0.75, y1: 0.35, y2: 1, z1: 2.4, z2: 2.9, color: '#58626b', top: '#6d7882', edge: true };
    const riftAhead = faceQuad(0.35, -0.35, 1.35, 0.95, 8.999);

    const plainGrassSpot = [280, 355, 220, 95];
    const plainRiverPath = wallQuad(2.2, -0.25, 0.95, 3.6, 5.2);
    const plainBasePath = faceQuad(-0.45, -0.45, 0.65, 0.95, 9.2);
    const plainOutskirtsPath = wallQuad(-2.2, -0.25, 0.95, 3.2, 4.8);

    const riverWaterRect = [180, 310, 600, 145];

    const baseGuardQuad = faceQuad(-1.15, -0.35, -0.65, 0.95, 4.2);
    const baseSteedQuad = faceQuad(0.65, -0.15, 1.35, 0.95, 4.4);
    const baseEyeDoor = faceQuad(-0.35, -0.5, 0.35, 0.98, 8.999);

    const podBox = { x1: -0.48, x2: 0.48, y1: -0.1, y2: 0.95, z1: 4.1, z2: 5.1, color: '#2b3642', top: '#3c4c5c', edge: true };
    const relayManualQuad = wallQuad(-1.6, -0.35, 0.35, 2.3, 3.3);
    const alphaLogQuad = wallQuad(1.6, -0.35, 0.35, 2.3, 3.3);
    const skeletonQuad = faceQuad(0.7, 0.12, 1.32, 0.92, 3.5);

    const outProgenitorRect = [340, 140, 280, 210];

    const DREAMS = [
      { n: 1, title: '墜落', desc: '【情景一：高處墜落】你正從一座沒有欄杆的灰白高塔上筆直下墜，風聲撕扯耳膜，底下什麼緩衝也沒有。牆縫裡伸出一截鏽蝕鐵鉤——要伸手死抓，還是照推演落到底？', act: '你猛地拽住牆縫鐵鉤，手臂險些脫臼，原本註定的塔底竟像空白稿紙一樣裂開了一條生路。', pass: '你沒有伸手。下墜的最後一瞬間，推演的畫面準時熄成黑屏。' },
      { n: 2, title: '溺水', desc: '【情景二：被水淹沒】漆黑冷潮轉眼淹過下巴，頭頂唯一的通氣鐵柵正被人緩緩推闔。要咬緊牙關硬撞開它，還是順從這段推演沉下去？', act: '指節撞在鏽柵上生疼，鐵條竟應聲彎斷——黑水倒流退去，這條預知被硬生生改寫。', pass: '鐵柵徹底合上，意識在最後一串氣泡裡歸零。' },
      { n: 3, title: '追逐', desc: '【情景三：黑暗被追逐】黑暗裡的腳步聲緊貼在背脊後方，前路卻越縮越窄成了一面死牆。要反身撞破側邊那道看起來是實心的暗牆，還是乖乖跑到死巷盡頭？', act: '你斜肩朝不可能開路的暗牆撞過去——整面牆像未上墨的草稿般破碎，身後的腳步瞬間卡死在頁緣之外。', pass: '死牆在面前封死，身後的影子準時追上了你的腳跟。' },
    ];

    const dreamDone = (s, n) => !!s.flags[`c1x_dream_${n}`];
    function dreamsCompleted(s) {
      return DREAMS.every((d) => dreamDone(s, d.n));
    }

    function applyDreamChoice(g, interfere) {
      const idx = (g.s.flags.c1x_active_dream || 1) - 1;
      const d = DREAMS[idx] || DREAMS[0];
      g.s.flags[`c1x_dream_${d.n}`] = interfere ? 'interfere' : 'submit';
      g.flag('c1x_active_dream', 0);
      if (interfere) {
        g.sanity(-10);
        g.sfx('sting');
        g.flag('c1x_interfere_count', (g.s.flags.c1x_interfere_count || 0) + 1);
      } else {
        g.sanity(-3);
      }
      const outcomeMsg = interfere ? d.act : d.pass;
      if (dreamsCompleted(g.s)) {
        g.flag('c1x_in_pod', false);
        const allThree = (g.s.flags.c1x_interfere_count || 0) >= 3;
        if (allThree) {
          return g.read('n_c1x_eye_done', () => {
            if (g.s.flags.c1x_progenitor_seen) g.end('torn_script');
          });
        }
        return g.say(`${outcomeMsg} 三次入夢推演全部結束，計數牌默默跳到了「24」。`);
      }
      g.say(outcomeMsg);
    }

    return {
      c1x_rift: {
        level: 'C1.3', title: '空間裂隙', room: meadowRoom, quiet: 0.65,
        viewMsg: '觀景窗拍著這道垂直藍光裂隙時，取景框邊緣泛起微弱的水波紋。',
        enter(g, { first }) {
          if (first) g.say('純淨得近乎灼眼的垂直藍光裂隙懸在半空，四周是齊尾高的蒼翠野草。據說尊父就是在此為這片草原賜名「驤亭」。');
        },
        draw(ctx, t, s, R) {
          drawGrass(ctx, R, 1);
          // Jagged vertical blue spatial tear
          const rb = bounds(riftQuad);
          const rx = rb[0] + rb[2] * 0.5;
          glow(ctx, rx, rb[1] + rb[3] * 0.5, 115 + Math.sin(t * 3) * 10, '#5ab6ff', 0.58);
          poly(ctx, [[rx - 4, rb[1]], [rx + 18, rb[1] + 55], [rx - 8, rb[1] + 135], [rx + 14, rb[1] + 225], [rx - 2, rb[1] + rb[3]], [rx - 22, rb[1] + 205], [rx + 6, rb[1] + 115], [rx - 18, rb[1] + 45]], '#d4f2ff');
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
          box(ctx, R, riftStone);
          txt(ctx, '碑', P(-1.02, 0.62, 2.4)[0], P(-1.02, 0.62, 2.4)[1], '#cfdbe2', 11);
          // Worn grass trail curving right into the deep plain
          poly(ctx, [P(0.25, 1, 1.8), P(0.95, 1, 1.8), P(1.15, 1, 9), P(0.55, 1, 9)], 'rgba(92, 98, 68, 0.45)');
          drawSignPost(ctx, riftAhead, '草原深處 ▶', '驤亭方向', '#4b5e42', '#9ab486');
        },
        hotspots: [
          hit('back', [330, 470, 300, 70], '穿過裂隙回鏡廳', (g) => {
            if (!g.has('dragon_scale')) {
              return g.say('沒有龍血族信物，藍色裂隙的光幕像玻璃牆般把你推了回來。');
            }
            g.go('c1_mirror', { msg: '龍鱗透出一線暖意，藍光分開——你重新踩上鏡廳一塵不染的木地板。' });
          }, 'back'),
          hit('stone', boxRect(riftStone, 8), '裂隙邊界石標', (g) => g.read('n_c1x_rift')),
          hit('ahead', bounds(riftAhead, 8), '走入齊尾高的草原', (g) => g.go('c1x_plain'), 'go'),
        ],
      },

      c1x_plain: {
        level: 'C1.3', title: '齊尾的草原', room: meadowRoom, quiet: 0.75,
        viewMsg: '觀景窗掃過整片低丘與雜草，方圓之內連半個異常熱源或實體都看不到。',
        enter(g, { first }) {
          if (first) g.say('望出去約七成以上都是沒過腿肚的長草，遠處伏著低矮山丘和稀疏林地。安靜、空氣微乾，卻連一隻蟲或流浪者都沒遇上。');
        },
        draw(ctx, t, s, R) {
          drawGrass(ctx, R, 3);
          // Far Dragon-blood compound eaves & cranes at center horizon
          const cb = bounds(plainBasePath);
          poly(ctx, [[cb[0] - 28, cb[1] + cb[3]], [cb[0] - 10, cb[1] + 14], [cb[0] + cb[2] + 10, cb[1] + 14], [cb[0] + cb[2] + 28, cb[1] + cb[3]]], '#3b444c');
          poly(ctx, [[cb[0] - 22, cb[1] + 18], [cb[0] + cb[2] * 0.5, cb[1] - 4], [cb[0] + cb[2] + 22, cb[1] + 18]], '#262d34');
          seg(ctx, [cb[0] + cb[2] + 12, cb[1] + cb[3]], [cb[0] + cb[2] + 12, cb[1] - 24], '#4b5660', 2);
          seg(ctx, [cb[0] + cb[2] - 8, cb[1] - 18], [cb[0] + cb[2] + 34, cb[1] - 28], '#4b5660', 2);
          drawPortalArch(ctx, plainBasePath, '#1c2228', '#5c6974', '驤亭基地');
          // Left trail post -> outskirts grass hills
          poly(ctx, [P(-1.1, 1, 2.0), P(-0.6, 1, 2.0), P(-2.2, 1, 5.2), P(-2.2, 1, 3.6)], 'rgba(96, 102, 66, 0.42)');
          drawSignPost(ctx, plainOutskirtsPath, '◀ 郊外草坡', null, '#4d5d3f', '#92a87e');
          // Right winding river glimpse + wooden river sign
          poly(ctx, [P(0.9, 1, 2.2), P(1.5, 1, 2.2), P(2.2, 1, 5.5), P(2.2, 1, 3.8)], '#46738c');
          drawSignPost(ctx, plainRiverPath, '交織江流 ▶', null, '#38586c', '#7faac4');
        },
        hotspots: [
          back('c1x_rift', '返回藍色裂隙'),
          hit('grass', plainGrassSpot, '搜查齊尾草叢', (g) => g.say('你撥開雜草找了一圈，什麼可用物資也沒留下——這裡對外人而言幾乎毫無資源可言，也沒有發現任何外來實體。')),
          hit('to_outskirts', bounds(plainOutskirtsPath, 8), '西側郊外草坡', (g) => g.go('c1x_outskirts'), 'go'),
          hit('to_base', bounds(plainBasePath, 8), '驤亭基地', (g) => g.go('c1x_base'), 'go'),
          hit('to_river', bounds(plainRiverPath, 8), '錯綜交織的江流', (g) => g.go('c1x_river'), 'go'),
        ],
      },

      c1x_river: {
        level: 'C1.3', title: '江流', room: meadowRoom, quiet: 0.65,
        viewMsg: '觀景窗裡，交叉蜿蜒的河道清澈見底，看不見異常生物。',
        enter(g, { first }) {
          if (first) g.say('複雜交錯的河道切開草原，水聲比想像中還要平緩清澈——在這個資源匱乏的地方，這大概是少數能補水的地方。');
        },
        draw(ctx, t, s, R) {
          drawGrass(ctx, R, 7);
          const gr = ctx.createLinearGradient(0, 310, 0, 465);
          gr.addColorStop(0, '#5a87a0');
          gr.addColorStop(0.5, '#3b6882');
          gr.addColorStop(1, '#294c62');
          poly(ctx, [P(-1.7, 0.42, 1.5), P(1.7, 0.42, 1.5), P(2.3, 0.95, 7.6), P(-2.3, 0.95, 7.6)], gr);
          ctx.save();
          for (let i = 0; i < 9; i++) {
            const y = 308 + i * 16;
            const sway = Math.sin(t * 1.4 + i) * 14;
            seg(ctx, [230 + i * 14 + sway, y], [730 - i * 16 + sway, y], 'rgba(218, 240, 252, 0.38)', 1.6);
          }
          ctx.restore();
          drawGrassField(ctx, 390, 20, 11, 'rgba(54, 82, 38, 0.85)', 36);
        },
        hotspots: [
          back('c1x_plain', '回到草原'),
          hit('drink_river', riverWaterRect, '捧起乾淨的江水喝', (g) => {
            g.sfx('drink');
            if (once(g, 'c1x_river_drunk')) {
              g.drink(40);
              return g.say('冰涼清冽的江水一口氣沖散了乾渴。在物資幾乎為零的驤亭，這點水比什麼都珍貴。');
            }
            g.drink(15);
            g.say('你又捧起幾口清澈江水潤潤喉。');
          }),
        ],
      },

      c1x_base: {
        level: 'C1.3', title: '驤亭基地外', room: baseRoom, quiet: 0.45,
        viewMsg: '觀景窗裡，那個戴著骨面與瞳石的無面靈站得筆直，反倒是遠處的龍裔壓低了身姿。',
        enter(g, { first }) {
          clankWait = 4;
          if (once(g, 'c1x_dread_seen')) {
            return g.say('一陣沉重的「龍血威懾」無聲壓過基地：龍裔住區廊下的身影齊刷刷低下頭，站崗的無面靈也僵住了動作。所有人都在發抖，只有你沒有——你忽然有點不安，因為在場只有你站在「範圍之外」。');
          }
          if (first) g.say('仍在施工中的驤亭基地：鷹架、吊臂，以及背後龍裔住區的屋簷。');
        },
        update(g, dt) {
          clankWait -= dt;
          if (clankWait <= 0) {
            clankWait = 5 + rand() * 5;
            g.sfx('clank');
          }
        },
        draw(ctx, t, s, R) {
          const hy = P(0, 1, R.depth)[1];
          drawHills(ctx, hy, [['#5d696d', 34, 1.2]]);
          // Dragon-blood compound timber eaves & steel construction scaffolding
          poly(ctx, [[310, hy], [335, 165], [625, 165], [650, hy]], '#353e46');
          poly(ctx, [[292, 168], [480, 118], [668, 168], [628, 178], [332, 178]], '#232a30');
          seg(ctx, P(-1.8, -0.9, 6.2), P(1.2, -0.9, 6.2), '#3c434a', 4);
          seg(ctx, P(-1.5, -0.9, 6.2), P(-1.5, 1, 6.2), '#3c434a', 5);
          seg(ctx, P(1.6, -0.9, 5.2), P(1.6, 1, 5.2), '#3c434a', 4);
          seg(ctx, [320, 120], [560, 80], '#4e5963', 2.5);
          // Faceless guard (Entity-9) in long coat with bone mask + glowing purple 瞳石 eyes
          const gb = bounds(baseGuardQuad);
          const gx = gb[0] + gb[2] * 0.5, gy = gb[1];
          poly(ctx, [[gx - 22, gb[1] + gb[3]], [gx - 15, gy + 36], [gx + 15, gy + 36], [gx + 24, gb[1] + gb[3]]], '#24292e');
          seg(ctx, [gx + 22, gy + 10], [gx + 22, gb[1] + gb[3]], '#5e666e', 2.5);
          ctx.fillStyle = '#ddd8cc'; ctx.beginPath(); ctx.ellipse(gx, gy + 20, 11, 14, 0, 0, Math.PI * 2); ctx.fill();
          glow(ctx, gx, gy + 19, 14, '#a87dff', 0.45);
          ctx.fillStyle = '#8b5cf6'; ctx.fillRect(gx - 5, gy + 17, 3.5, 3.5); ctx.fillRect(gx + 1.5, gy + 17, 3.5, 3.5);
          // Scaled steed (龍鱗駒) tethered beside hitching post
          const sb = bounds(baseSteedQuad);
          const sx = sb[0] + sb[2] * 0.45, sy = sb[1] + sb[3] * 0.5;
          poly(ctx, [[sx - 28, sy - 6], [sx + 18, sy - 8], [sx + 26, sy + 14], [sx - 22, sy + 16]], '#2b343c');
          poly(ctx, [[sx - 26, sy - 4], [sx - 40, sy - 26], [sx - 48, sy - 20], [sx - 34, sy + 4]], '#343e48');
          for (const lx of [-20, -10, 12, 20]) seg(ctx, [sx + lx, sy + 12], [sx + lx - 2, sb[1] + sb[3]], '#262d34', 4);
          seg(ctx, [sx + 24, sy - 2], [sx + 34, sy + 18], '#1e242a', 3);
          txt(ctx, '龍鱗駒', sx, sb[1] - 6, '#cbd5de', 10);
          // Entrance to Alpha's Eye dark room
          drawPortalArch(ctx, baseEyeDoor, '#0f1318', '#566470', '暗室・K014');
        },
        hotspots: [
          back('c1x_plain', '回到草原'),
          hit('faceless', bounds(baseGuardQuad, 8), '站崗的無面靈與骨面', (g) => {
            g.say('這名無面靈（Entity-9）戴著阿爾法賜予的骨面，雙眼嵌著淡淡發光的紫晶「瞳石」。因為人類免疫龍血威懾，他只安靜站在一旁沒有任何舉動。');
          }),
          hit('steed', bounds(baseSteedQuad, 8), '栓在欄邊的龍鱗駒', (g) => {
            g.say('披著細密深鱗的馬獸正安靜低頭。據說尊父當年就是將這支龍裔坐騎與此地合稱「驤亭」——除了伸手感覺到的冰涼鱗甲，這裡什麼也帶不走。');
          }),
          hit('to_eye', bounds(baseEyeDoor, 8), '阿爾法之眼暗室', (g) => g.go('c1x_eye'), 'go'),
        ],
      },

      c1x_eye: {
        level: 'C1.3', title: '阿爾法之眼暗室', room: eyeRoom, quiet: 0.7,
        viewMsg: '觀景窗裡，中控台指示燈與無頭爬行類骨架都蒙上一層淡淡的藍影。',
        enter(g, { first }) {
          g.flag('c1x_in_pod', false);
          g.flag('c1x_active_dream', 0);
          if (first) g.say('暗室中央安放著編號 K014「阿爾法之眼」：主艙體、中轉器與資料處理系統正低鳴運轉。角落架著一座奇異的骨架展示台。');
        },
        draw(ctx, t, s, R) {
          // Floor neural relay fiber conduits toward K014 pod
          for (const fx of [-0.65, -0.25, 0.25, 0.65]) seg(ctx, P(fx, 1, 1.4), P(fx * 0.35, 1, 4.1), 'rgba(84, 178, 245, 0.32)', 2);
          box(ctx, R, podBox);
          // Illuminated pod visor strip
          const pb = boxRect(podBox);
          ctx.fillStyle = 'rgba(104, 198, 255, 0.22)';
          ctx.fillRect(pb[0] + 18, pb[1] + 28, pb[2] - 36, pb[3] * 0.45);
          ctx.strokeStyle = '#62b2ec'; ctx.lineWidth = 1.5;
          ctx.strokeRect(pb[0] + 18, pb[1] + 28, pb[2] - 36, pb[3] * 0.45);
          glow(ctx, 480, 250, 82 + Math.sin(t * 2.5) * 6, '#58b4ff', s.flags.c1x_in_pod ? 0.55 : 0.28);
          // Run counter plaque: 23 -> 24 once all 3 dreams finished
          const countNum = dreamsCompleted(s) ? '24' : '23';
          ctx.fillStyle = '#0e141a'; ctx.fillRect(452, 204, 56, 28);
          ctx.strokeStyle = '#5ca4d8'; ctx.lineWidth = 1.5; ctx.strokeRect(452, 204, 56, 28);
          txt(ctx, countNum, 480, 223, '#9bd8ff', 15);
          // Relay manual & Alpha/Ashou log papers
          paper(ctx, R, relayManualQuad, 2.8, '#dce8f2');
          paper(ctx, R, alphaLogQuad, 2.8, '#e8e2d2');
          // Articulated headless serpentine reptile skeleton inside glass vitrine
          const kb = bounds(skeletonQuad);
          poly(ctx, skeletonQuad, '#1d242c');
          ctx.strokeStyle = '#6c8aa3'; ctx.lineWidth = 1.8; poly(ctx, skeletonQuad); ctx.stroke();
          const sp = [kb[0] + kb[2] * 0.5, kb[1] + kb[3] * 0.55];
          ctx.strokeStyle = '#d4cebd'; ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(sp[0] - 20, sp[1] + 18);
          ctx.bezierCurveTo(sp[0] - 8, sp[1] + 2, sp[0] + 4, sp[1] - 10, sp[0] + 12, sp[1] - 20);
          ctx.stroke();
          for (let r = -10; r <= 8; r += 4) seg(ctx, [sp[0] + r - 4, sp[1] - r * 0.7 - 4], [sp[0] + r + 8, sp[1] - r * 0.7 + 4], '#d4cebd', 1.5);
          seg(ctx, [sp[0] + 12, sp[1] - 20], [sp[0] + 12, sp[1] - 28], 'rgba(220, 110, 110, 0.55)', 1.5);
          // Active dream overlay inside pod canvas
          if (s.flags.c1x_in_pod) {
            ctx.fillStyle = 'rgba(8, 16, 26, 0.68)';
            ctx.fillRect(160, 120, 640, 260);
            ctx.strokeStyle = '#5ba8e0'; ctx.lineWidth = 2; ctx.strokeRect(160, 120, 640, 260);
            if (s.flags.c1x_active_dream) {
              const dr = DREAMS[(s.flags.c1x_active_dream || 1) - 1] || DREAMS[0];
              txt(ctx, `入夢中・${dr.title}`, 480, 165, '#b6e2ff', 18);
              ctx.fillStyle = '#2c4e6e'; ctx.fillRect(260, 265, 160, 56);
              ctx.fillStyle = '#2f3842'; ctx.fillRect(540, 265, 160, 56);
              txt(ctx, '干涉（清醒度 -10）', 340, 298, '#ffffff', 13);
              txt(ctx, '順從（清醒度 -3）', 620, 298, '#cfd8e0', 13);
            } else {
              txt(ctx, 'K014 阿爾法之眼・選擇入夢情景', 480, 158, '#9fd5fa', 16);
              DREAMS.forEach((dr, i) => {
                const bx = 205 + i * 195;
                const done = dreamDone(s, dr.n);
                ctx.fillStyle = done ? '#1a222a' : '#25394d';
                ctx.fillRect(bx, 200, 160, 82);
                ctx.strokeStyle = done ? '#3d4c59' : '#6cb8ec'; ctx.strokeRect(bx, 200, 160, 82);
                txt(ctx, done ? `${dr.title}（已推演）` : dr.title, bx + 80, 246, done ? '#6f808f' : '#e6f5ff', 13);
              });
            }
          }
        },
        hotspots: [
          back('c1x_base', '回到基地外'),
          hit('eye_manual', bounds(relayManualQuad, 8), 'K014 設備簡述', (g) => g.read('n_c1x_eye'), 'look', {
            when: (s) => !s.flags.c1x_in_pod,
          }),
          hit('alpha_log', bounds(alphaLogQuad, 8), '阿爾法與阿守的紀錄殘段', (g) => g.read('n_c1x_alpha'), 'look', {
            when: (s) => !s.flags.c1x_in_pod,
          }),
          hit('skeleton', bounds(skeletonQuad, 8), '無頭骨架展示台', (g) => g.say('玻璃櫃裡架著一具中等體型的爬行類骨骼標本，頸椎整齊斷折，唯獨少了整個頭骨。'), 'look', {
            when: (s) => !s.flags.c1x_in_pod,
          }),
          hit('pod', boxRect(podBox, 8), '爬進 K014 艙體入夢', (g) => {
            if (dreamsCompleted(g.s)) {
              if (g.s.flags.c1x_progenitor_seen && (g.s.flags.c1x_interfere_count || 0) >= 3) {
                return g.read('n_c1x_eye_done', () => g.end('torn_script'));
              }
              return g.say('計數牌已經停在「24」，這個儲存格裡的推演分支已經全數跑完。');
            }
            g.flag('c1x_in_pod', true);
            g.say('艙門合攏，神經中轉器傳來微涼的脈衝。意識沉進去後，三個尚未翻開的未來情景浮在眼前。');
          }, 'go', { when: (s) => !s.flags.c1x_in_pod }),
          hit('dream_fall', [205, 200, 160, 82], '情景一：高處墜落', (g) => {
            g.flag('c1x_active_dream', 1);
            g.say(DREAMS[0].desc);
          }, 'go', { when: (s) => s.flags.c1x_in_pod && !s.flags.c1x_active_dream && !dreamDone(s, 1) }),
          hit('dream_water', [400, 200, 160, 82], '情景二：被水淹沒', (g) => {
            g.flag('c1x_active_dream', 2);
            g.say(DREAMS[1].desc);
          }, 'go', { when: (s) => s.flags.c1x_in_pod && !s.flags.c1x_active_dream && !dreamDone(s, 2) }),
          hit('dream_chase', [595, 200, 160, 82], '情景三：黑暗被追逐', (g) => {
            g.flag('c1x_active_dream', 3);
            g.say(DREAMS[2].desc);
          }, 'go', { when: (s) => s.flags.c1x_in_pod && !s.flags.c1x_active_dream && !dreamDone(s, 3) }),
          hit('choice_interfere', [260, 265, 160, 56], '干涉未來（清醒度 -10）', (g) => applyDreamChoice(g, true), 'go', {
            when: (s) => s.flags.c1x_in_pod && !!s.flags.c1x_active_dream,
          }),
          hit('choice_submit', [540, 265, 160, 56], '順從走向（清醒度 -3）', (g) => applyDreamChoice(g, false), 'go', {
            when: (s) => s.flags.c1x_in_pod && !!s.flags.c1x_active_dream,
          }),
          hit('exit_pod', [405, 315, 150, 44], '退出艙體', (g) => {
            g.flag('c1x_in_pod', false);
            g.say('你撐起艙蓋退回冰涼的暗室裡。');
          }, 'go', { when: (s) => s.flags.c1x_in_pod && !s.flags.c1x_active_dream }),
        ],
      },

      c1x_outskirts: {
        level: 'C1.3', title: '郊外', room: meadowRoom, quiet: 0.75,
        viewMsg: '觀景窗拉遠一看，草坡邊那道高大剪影背後的膜翼輪廓大得幾乎遮住半片低丘。',
        enter(g, { first }) {
          wingAnimT = 0;
          if (first) g.say('西側寂靜的長草坡。遠方低丘上似乎有兩道身影正低聲交談：一個身材高大、帶著收攏的雙翼；另一個肩頭披著獸類頭骨。');
        },
        update(g, dt) {
          if (wingAnimT > 0) wingAnimT = Math.max(0, wingAnimT - dt);
        },
        draw(ctx, t, s, R) {
          drawGrass(ctx, R, 9);
          // Ashou (cloaked silhouette with bleached beast skull on left shoulder)
          const ap = [416, 258];
          poly(ctx, [[ap[0] - 15, ap[1] + 34], [ap[0] - 10, ap[1] - 16], [ap[0] + 10, ap[1] - 16], [ap[0] + 17, ap[1] + 34]], '#2d3336');
          ctx.fillStyle = '#383f44'; ctx.beginPath(); ctx.arc(ap[0], ap[1] - 24, 8, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#e0d8c6'; ctx.beginPath(); ctx.ellipse(ap[0] - 8, ap[1] - 14, 9, 6, -0.3, 0, Math.PI * 2); ctx.fill();
          // Progenitor spreads wide veined membrane wings and flies off when observed
          if (!s.flags.c1x_progenitor_seen || wingAnimT > 0) {
            const lift = wingAnimT > 0 ? (2.6 - wingAnimT) * 58 : 0;
            const span = wingAnimT > 0 ? 190 : 54;
            const px = 528, py = 242 - lift;
            ctx.save();
            ctx.fillStyle = 'rgba(24, 28, 34, 0.92)';
            ctx.beginPath();
            ctx.moveTo(px, py - 14);
            ctx.lineTo(px - span, py - 70);
            ctx.lineTo(px - span * 0.55, py + 14);
            ctx.lineTo(px, py - 4);
            ctx.lineTo(px + span * 0.55, py + 14);
            ctx.lineTo(px + span, py - 70);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(92, 108, 126, 0.55)'; ctx.lineWidth = 1.5;
            seg(ctx, [px, py - 10], [px - span * 0.9, py - 62], ctx.strokeStyle, 1.5);
            seg(ctx, [px, py - 10], [px + span * 0.9, py - 62], ctx.strokeStyle, 1.5);
            poly(ctx, [[px - 11, py + 36], [px - 8, py - 24], [px + 8, py - 24], [px + 12, py + 36]], '#1a1e24');
            ctx.beginPath(); ctx.arc(px, py - 32, 9, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
          }
          drawGrassField(ctx, 355, 22, 15, 'rgba(66, 94, 42, 0.85)', 42);
        },
        hotspots: [
          back('c1x_plain', '退回草原'),
          hit('approach', outProgenitorRect, '伏在草叢裡靠近聆聽', (g) => {
            if (!g.s.flags.c1x_progenitor_seen) {
              g.flag('c1x_progenitor_seen', true);
              wingAnimT = 2.6;
              g.sfx('clank');
            }
            g.read('n_c1x_progenitor');
          }),
        ],
      },
    };
  })(),

  // ---------- Report IV: 俄刻阿諾斯號 (Level C-1.4) ----------
  ...(() => {
    const trekPal = pal('#707c84', '#829098', '#525e4f', '#8c99a2', '#d6e0e6');
    const hullPal = pal('#525b64', '#6d7882', '#444b52', '#707b85', '#ccd6df');
    const shipPal = pal('#2b343e', '#1a2026', '#212830', '#10141a', '#7aaef0');
    const fogPal = pal('#424e48', '#222a26', '#2d3730', '#1a211d', '#98aba0');
    const townPal = pal('#383634', '#1d1c1b', '#2b2927', '#100f0e', '#e4bf7c');
    const metroPal = pal('#4a3c2f', '#2c231b', '#33281f', '#120e0a', '#c9a678');
    const seaPal = pal('#1e2d3b', '#121c26', '#16354d', '#09141d', '#68a2cf');
    const hPal = pal('#282e36', '#181c22', '#20262c', '#0d1014', '#9ec2df');
    const hidePal = pal('#302b27', '#1c1816', '#24201c', '#0f0c0a', '#d8c4a6');

    const trekRoom = room(trekPal, { hw: 2.2, depth: 9.5, fogEnd: 16, open: true, floorTex: 'carpet', baseboard: false, lights: [] });
    const hullRoom = room(hullPal, { hw: 2.0, depth: 8.5, fogEnd: 15, open: true, floorTex: 'concrete', baseboard: false, lights: [] });
    const shipRoom = room(shipPal, { hw: 1.5, depth: 8.5, fogEnd: 12, wallTex: 'concrete', lights: [1.8, 4.4, 7.0], flickerLights: [1] });
    const fogRoom = room(fogPal, { hw: 1.8, depth: 7.5, fogEnd: 5.5, floorTex: 'carpet', lights: [] });
    const townRoom = room(townPal, { hw: 1.7, depth: 8, fogEnd: 11, open: true, floorTex: 'concrete', baseboard: false, lights: [] });
    const metroRoom = room(metroPal, { hw: 1.5, depth: 8, fogEnd: 9.5, wallTex: 'concrete', lights: [] });
    const seaRoom = room(seaPal, { hw: 1.8, depth: 8, fogEnd: 11, wallTex: 'concrete', lights: [2.6, 5.8] });
    const hRoom = room(hPal, { hw: 1.7, depth: 7.5, fogEnd: 11, wallTex: 'concrete', lights: [2.2, 5.2] });
    const hideRoom = room(hidePal, { hw: 1.4, depth: 6.5, fogEnd: 8.5, wallTex: 'concrete', lights: [2.5] });

    let seaDripT = 1.8;

    const c1sHazard = (s) => (s.flags.c1s_plague ? '疫疾正在消耗神智（需要杏仁水治療）' : null);

    function c1sEnter(g, msg) {
      if (!g.s.flags.c1s_seed) g.flag('c1s_seed', 1);
      if (g.s.flags.c1s_plague) g.sanity(-1);
      if (msg) g.say(msg);
    }

    function remainingSubspaces(s) {
      const list = [];
      if (!s.flags.c1s_v_fog) list.push('c1s_fog');
      if (!s.flags.c1s_v_town) list.push('c1s_town');
      if (!s.flags.c1s_v_metro) list.push('c1s_metro');
      return list;
    }

    function subspaceTarget(s, slot) {
      const rem = remainingSubspaces(s);
      if (!rem.length) return null;
      return rem[((s.flags.c1s_seed || 1) + slot) % rem.length];
    }

    function allSubspacesSeen(s) {
      return !!s.flags.c1s_v_fog && !!s.flags.c1s_v_town && !!s.flags.c1s_v_metro;
    }

    const trekAhead = faceQuad(-0.6, -0.3, 0.6, 0.95, 9.2);
    const hullNote = wallQuad(-2.0, -0.25, 0.3, 2.3, 3.0);
    const hullDoor = faceQuad(-0.45, -0.45, 0.45, 1, 8.499);

    const hallWinL = wallQuad(-1.5, -0.52, 0.35, 3.6, 5.0);
    const hallWinR = wallQuad(1.5, -0.52, 0.35, 3.6, 5.0);
    const hallDoor0 = wallQuad(-1.5, -0.55, 1, 1.9, 2.8);
    const hallDoor1 = faceQuad(-0.65, -0.55, -0.02, 1, 8.499);
    const hallDoor2 = wallQuad(1.5, -0.55, 1, 1.9, 2.8);
    const hallDoorSea = faceQuad(0.18, -0.55, 0.85, 1, 8.499);

    const fogTrees = faceQuad(-0.9, -0.55, 0.9, 0.9, 5.5);
    const townBooth = { x1: -1.3, x2: -0.75, y1: -0.35, y2: 1, z1: 2.6, z2: 3.3, color: '#992828', top: '#b83838', edge: true };
    const metroRails = faceQuad(-0.7, 0.45, 0.3, 0.98, 5.2);
    const metroRats = { x1: 0.45, x2: 1.25, y1: 0.68, y2: 1, z1: 2.3, z2: 3.1, color: '#3b332e', top: '#4a403a', edge: true };
    const seaAhead = faceQuad(-0.45, -0.5, 0.45, 1, 7.999);
    const seaWaterLook = [170, 320, 620, 130];

    const hButlerRect = [395, 165, 170, 225];
    const hHideoutDoor = faceQuad(-1.45, -0.5, -0.78, 1, 6.9);
    const hButlerToggle = [585, 210, 190, 95];

    const hideJunjunRect = [370, 175, 220, 225];
    const hideRescueRect = [615, 240, 180, 90];

    const winHitMsg = '深藍色的舷窗帶著微微暖意。無論徒手捶打還是拿隨身器物敲上去，玻璃始終完好如初。';
    const winToolUse = {
      knife: (g) => g.say(winHitMsg),
      wrench: (g) => g.say(winHitMsg),
      rod: (g) => g.say(winHitMsg),
      screwdriver: (g) => g.say(winHitMsg),
      ladder: (g) => g.say(winHitMsg),
    };

    return {
      c1e_trek: {
        level: 'C1.2', title: '東南荒原・長途步行', room: trekRoom, quiet: 0.65,
        viewMsg: '觀景窗盡頭的山脊裡斜插著龐大的灰暗金屬輪廓。',
        enter(g, { first }) {
          g.sanity(-6);
          g.drink(-6);
          g.eat(-6);
          g.say(first
            ? '從東舟市平原邊緣朝東南整整走了近七點九公里。荒草割過褲管，冷風一路耗盡體力，前方山體中終於露出巨大的金屬壁面。'
            : '再次徒步穿過這七點九公里的荒原，體力與精神又被抽走一截。');
        },
        draw(ctx, t, s, R) {
          const hy = P(0, 1, R.depth)[1];
          drawHills(ctx, hy, [['#525d64', 55, 0.9], ['#3e484e', 34, 2.5]]);
          drawGrassField(ctx, hy, 40, 19, 'rgba(65, 76, 62, 0.65)', 24);
          // Colossal tilted metal ark prow jutting out of mountainside ridge
          poly(ctx, [P(-2.4, -0.45, 9.2), P(1.65, -0.82, 9.2), P(2.2, 1, 9.2), P(-2.4, 1, 9.2)], '#39424b');
          poly(ctx, [[305, 195], [645, 165], [705, hy], [275, hy]], '#2e3740');
          for (const py of [215, 240, 265]) seg(ctx, [300, py], [665, py - 14], 'rgba(130, 150, 168, 0.28)', 1.5);
          drawPortalArch(ctx, trekAhead, '#0e141a', '#5c6f7e', '俄刻阿諾斯號');
        },
        hotspots: [
          back('c1e_outskirts', '折返東舟市平原'),
          hit('ahead', bounds(trekAhead, 8), '走近山體上的巨型艦殼', (g) => g.go('c1s_hull'), 'go'),
        ],
      },

      c1s_hull: {
        level: 'C1.4', title: '山體上的金屬壁', room: hullRoom, quiet: 0.55,
        hazard: c1sHazard,
        viewMsg: '觀景窗裡，那道橫度達六百七十九公尺的金屬結構深處隱約閃著微弱的藍光。',
        enter(g, { first }) {
          c1sEnter(g, first ? '橫度約六百七十九公尺的巨型金屬艦殼硬生生突出在山體之中。破開的檢修口正對著山腰。' : null);
        },
        draw(ctx, t, s, R) {
          const hy = P(0, 1, R.depth)[1];
          drawHills(ctx, hy, [['#414a52', 64, 2.1]]);
          // Monumental 679m rusted steel hull wall embedded into mountain cliffside
          poly(ctx, [P(-2.2, -0.92, 8.2), P(2.0, -0.92, 8.2), P(2.0, 1, 8.2), P(-2.2, 1, 8.2)], '#35404a');
          for (const px of [-1.4, -0.6, 0.2, 1.0]) seg(ctx, P(px, -0.92, 8.2), P(px, 1, 8.2), 'rgba(20, 26, 32, 0.55)', 2);
          for (const py of [-0.45, 0.05, 0.52]) seg(ctx, P(-2.2, py, 8.2), P(2.0, py, 8.2), 'rgba(20, 26, 32, 0.45)', 2);
          // Craggy scree rocks flanking base of ship wall + foreground riveted hull buttress holding Reed Squad note
          const lw = wallQuad(-2.02, -0.78, 1, 1.85, 3.55);
          poly(ctx, lw, '#2b343d');
          seg(ctx, P(-2.02, -0.3, 1.85), P(-2.02, -0.3, 3.55), '#1a2128', 2);
          seg(ctx, P(-2.02, 0.35, 1.85), P(-2.02, 0.35, 3.55), '#1a2128', 2);
          seg(ctx, P(-2.02, -0.78, 2.65), P(-2.02, 1, 2.65), '#1a2128', 2);
          ctx.strokeStyle = '#4e5d6b'; ctx.lineWidth = 2; poly(ctx, lw); ctx.stroke();
          poly(ctx, [[0, H], [0, 340], [185, 365], [275, hy + 18], [0, hy + 24]], '#26292b');
          poly(ctx, [[W, hy + 10], [725, 315], [840, 285], [W, 250]], '#292c2e');
          paper(ctx, R, hullNote, 2.6, '#e6e8ea');
          // Plasma-torn jagged access hatchway
          const hb = bounds(hullDoor);
          glow(ctx, hb[0] + hb[2] * 0.5, hb[1] + hb[3] * 0.55, 62, '#62b4e8', 0.22);
          poly(ctx, hullDoor, '#0f1419');
          ctx.strokeStyle = '#6c7c8c'; ctx.lineWidth = 2.5; poly(ctx, hullDoor); ctx.stroke();
          txt(ctx, 'OCEANUS', CX(hullDoor), hullDoor[0][1] - 12, '#9ec3e2', 12);
        },
        hotspots: [
          back('c1e_trek', '離開方舟回東舟市方向'),
          hit('log_page', bounds(hullNote, 8), '芦葦小隊殘篇 C-1.00', (g) => g.read('n_c1s_log')),
          hit('ahead', bounds(hullDoor, 8), '穿過撕開的金屬艙門', (g) => g.go('c1s_hall'), 'go'),
        ],
      },

      c1s_hall: {
        level: 'C1.4', title: '艦內長廊', room: shipRoom, quiet: 0.4,
        hazard: c1sHazard,
        viewMsg: '觀景窗裡，兩側深藍舷窗泛著不合理的暖意，幾道門框背後的空間結構卻正在無聲扭曲。',
        enter(g, { first }) {
          c1sEnter(g, null);
          g.flag('c1s_seed', ((g.s.flags.c1s_seed || 1) * 5 + 3) % 97);
          if (g.s.flags.c1s_rescued) {
            return g.say('扶著落君走過這段長廊時，兩側原本連向霧林、小鎮與地鐵的門框一個接一個黯淡發黑，所有子空間都徹底熄滅了。');
          }
          if (first) g.say('長廊兩側嵌著溫熱卻砸不破的深藍舷窗。能源庫離線之後，外部空間已經開始無縫「插進」這段廊道。');
        },
        draw(ctx, t, s, R) {
          // Ship bulkhead structural wall ribs
          for (const z of [1.8, 3.3, 5.2, 6.9]) {
            poly(ctx, [P(-1.5, -1, z), P(-1.42, -1, z), P(-1.42, 1, z), P(-1.5, 1, z)], '#1b222a');
            poly(ctx, [P(1.42, -1, z), P(1.5, -1, z), P(1.5, 1, z), P(1.42, 1, z)], '#1b222a');
          }
          // Warm unbreakable deep-blue armored portholes
          for (const wq of [hallWinL, hallWinR]) {
            const wb = bounds(wq);
            const gr = ctx.createLinearGradient(0, wb[1], 0, wb[1] + wb[3]);
            gr.addColorStop(0, '#0f396b');
            gr.addColorStop(1, '#1a5a96');
            poly(ctx, wq, gr);
            ctx.strokeStyle = '#6c849c'; ctx.lineWidth = 3; poly(ctx, wq); ctx.stroke();
            seg(ctx, qpt(wq, 0.14, 0.82), qpt(wq, 0.84, 0.14), 'rgba(180,225,255,0.22)', 2.5);
          }
          const rem = remainingSubspaces(s);
          const off = !!s.flags.c1s_rescued;
          const doorSpecs = [
            [hallDoor0, 0], [hallDoor1, 1], [hallDoor2, 2],
          ];
          for (const [dq, idx] of doorSpecs) {
            const active = !off && idx < rem.length;
            drawPortalArch(ctx, dq, active ? '#1e2832' : '#060709', active ? '#6a7d8e' : '#1b2026', active ? '異質門框' : null);
          }
          if (allSubspacesSeen(s)) {
            glow(ctx, CX(hallDoorSea), CY(hallDoorSea), 45, '#54a8e8', 0.28);
            drawPortalArch(ctx, hallDoorSea, '#12293c', '#5fa6d6', '海水區・H區');
          }
        },
        hotspots: [
          back('c1s_hull', '走出艦內長廊'),
          hit('win_l', bounds(hallWinL, 8), '深藍舷窗', (g) => g.say(winHitMsg), 'look', { use: winToolUse }),
          hit('win_r', bounds(hallWinR, 8), '右側深藍舷窗', (g) => g.say(winHitMsg), 'look', { use: winToolUse }),
          hit('door_sub0', bounds(hallDoor0, 8), '左牆插入的門框', (g) => {
            const t = subspaceTarget(g.s, 0);
            if (t) g.go(t);
          }, 'go', { when: (s) => !s.flags.c1s_rescued && remainingSubspaces(s).length > 0 }),
          hit('door_sub1', bounds(hallDoor1, 8), '前側插入的門框', (g) => {
            const t = subspaceTarget(g.s, 1);
            if (t) g.go(t);
          }, 'go', { when: (s) => !s.flags.c1s_rescued && remainingSubspaces(s).length > 1 }),
          hit('door_sub2', bounds(hallDoor2, 8), '右牆插入的門框', (g) => {
            const t = subspaceTarget(g.s, 2);
            if (t) g.go(t);
          }, 'go', { when: (s) => !s.flags.c1s_rescued && remainingSubspaces(s).length > 2 }),
          hit('door_sea', bounds(hallDoorSea, 8), '第四扇深處通道（海水區）', (g) => g.go('c1s_sea'), 'go', {
            when: (s) => allSubspacesSeen(s),
          }),
        ],
      },

      c1s_fog: {
        level: 'C1.4', title: '子空間：霧林', room: fogRoom, dark: true, quiet: 0.6,
        hazard: c1sHazard,
        viewMsg: '觀景窗在濃霧裡勉強照出金屬天花板與成排樹冠交疊的怪異接縫。',
        enter(g, { first }) {
          g.flag('c1s_v_fog', true);
          c1sEnter(g, first ? '推開門後竟然是一片林子——可抬起頭，樹梢上方依然扣著俄刻阿諾斯號冷硬的艦內天花板。' : null);
        },
        draw(ctx, t, s, R) {
          // Metallic Oceanus ceiling girders clashing directly above forest trees + rolling fog
          for (const z of [2.0, 3.8, 5.6]) {
            poly(ctx, [P(-1.8, -1, z), P(1.8, -1, z), P(1.8, -0.82, z + 0.15), P(-1.8, -0.82, z + 0.15)], '#1f2629');
          }
          for (const [tx, z, w] of [[-1.35, 3.6, 0.13], [-0.55, 5.1, 0.11], [0.18, 4.4, 0.14], [0.95, 5.4, 0.11], [1.4, 3.4, 0.13]]) {
            const bot = P(tx, 1, z), top = P(tx, -0.84, z);
            const hw = (w * 480) / z;
            ctx.fillStyle = shade(R, '#1b241f', z);
            ctx.fillRect(bot[0] - hw, top[1], hw * 2, bot[1] - top[1]);
            seg(ctx, [bot[0], top[1] + 28], [bot[0] - hw * 2.6, top[1] + 4], '#171f1a', 3);
            seg(ctx, [bot[0], top[1] + 44], [bot[0] + hw * 2.6, top[1] + 12], '#171f1a', 3);
          }
          for (let i = 0; i < 4; i++) {
            const fy = 285 + i * 32;
            const drift = Math.sin(t * 0.6 + i) * 18;
            ctx.fillStyle = `rgba(170, 192, 180, ${0.12 - i * 0.018})`;
            ctx.fillRect(80 + drift, fy, 800, 18);
          }
        },
        hotspots: [
          back('c1s_hall', '退回艦內長廊'),
          hit('trees', bounds(fogTrees, 8), '霧裡的林木與金屬頂棚', (g) => g.say('樹幹上結著船艙冷凝的水珠。這座森林只是硬生生插進走廊裡的外部空間碎片，看不見盡頭。')),
        ],
      },

      c1s_town: {
        level: 'C1.4', title: '子空間：昏暗小鎮', room: townRoom, quiet: 0.65,
        hazard: c1sHazard,
        viewMsg: '觀景窗掃過每一扇發黑的民居窗框，唯獨角落那座紅色電話亭裡還剩微光。',
        enter(g, { first }) {
          g.flag('c1s_v_town', true);
          c1sEnter(g, first ? '一條昏暗寂靜的小鎮街道平白接在船艙後面。每一扇窗後全都暗著，只有街邊立著一座舊電話亭。' : null);
        },
        draw(ctx, t, s, R) {
          // Silent shuttered night-street town houses grounded to pavement + overhead wires + phone booth
          for (const [x1, topY, x2] of [[-2.0, -0.78, -0.65], [-0.5, -0.58, 0.45], [0.62, -0.86, 2.0]]) {
            poly(ctx, faceQuad(x1, topY, x2, 1, 7.92), '#121111');
          }
          for (const [hx, z1, z2] of [[-1.7, 4.3, 6.4], [1.7, 4.5, 6.7], [-1.7, 1.85, 3.8], [1.7, 2.2, 4.0]]) {
            const hxOut = hx < 0 ? hx - 0.7 : hx + 0.7;
            poly(ctx, [P(hx, -0.82, z1), P(hxOut, -0.82, z1), P(hxOut, 1, z1), P(hx, 1, z1)], shade(R, '#161414', z1));
            const hq = wallQuad(hx, -0.82, 1, z1, z2);
            poly(ctx, hq, shade(R, '#1f1d1c', (z1 + z2) * 0.5));
            poly(ctx, [P(hx, -0.82, z1), P(hx * 1.06, -1.04, (z1 + z2) * 0.5), P(hx, -0.82, z2)], '#141312');
            poly(ctx, qsub(hq, 0.22, 0.22, 0.46, 0.44), '#09090a');
            poly(ctx, qsub(hq, 0.58, 0.22, 0.82, 0.44), '#09090a');
            poly(ctx, qsub(hq, 0.36, 0.62, 0.66, 1.0), '#0d0c0c');
          }
          const wl = P(-1.7, -0.78, 2.8), wr = P(1.7, -0.78, 2.8);
          ctx.strokeStyle = 'rgba(18, 18, 20, 0.85)'; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(wl[0], wl[1]); ctx.quadraticCurveTo(480, wl[1] + 36, wr[0], wr[1]); ctx.stroke();
          box(ctx, R, townBooth);
          const tb = boxRect(townBooth);
          ctx.fillStyle = '#2d1c14';
          ctx.fillRect(tb[0] + tb[2] * 0.2, tb[1] + tb[3] * 0.18, tb[2] * 0.6, tb[3] * 0.56);
          ctx.fillStyle = 'rgba(246, 188, 102, 0.45)';
          ctx.fillRect(tb[0] + tb[2] * 0.24, tb[1] + tb[3] * 0.22, tb[2] * 0.52, tb[3] * 0.48);
          seg(ctx, [tb[0] + tb[2] * 0.5, tb[1] + tb[3] * 0.32], [tb[0] + tb[2] * 0.58, tb[1] + tb[3] * 0.54], '#1a120e', 2.5);
          glow(ctx, 290, 265, 68, '#e8a254', 0.32);
        },
        hotspots: [
          back('c1s_hall', '退回艦內長廊'),
          hit('phone_booth', boxRect(townBooth, 8), '街邊電話亭', (g) => {
            if (once(g, 'c1s_booth_loot')) {
              return g.give('almond', '電話亭話筒歪斜地垂著，置物架裡還塞著一瓶密封完好的杏仁水。');
            }
            g.say('電話亭裡只剩下「嘟、嘟」的空洞忙音，其他東西都已被拿空了。');
          }),
        ],
      },

      c1s_metro: {
        level: 'C1.4', title: '子空間：土穴地鐵', room: metroRoom, quiet: 0.45,
        hazard: c1sHazard,
        viewMsg: '觀景窗裡，土壁陰影角落那一團東西微微蠕動著——千萬別一腳踩上去。',
        enter(g, { first }) {
          g.flag('c1s_v_metro', true);
          c1sEnter(g, first ? '生鏽的地鐵軌道沿著潮濕土洞一路延伸，車廂在遠處停住。角落的陰暗腐堆旁好像有東西正在窸窣作響。' : null);
        },
        draw(ctx, t, s, R) {
          // Timber tunnel shoring ribs, railroad sleepers, rusted rails & dark subway train silhouette
          for (const z of [1.9, 3.2, 4.7, 6.4]) {
            const pL = P(-1.5, -0.9, z), pR = P(1.5, -0.9, z);
            seg(ctx, [pL[0], P(-1.5, 1, z)[1]], pL, '#261e17', 5);
            seg(ctx, [pR[0], P(1.5, 1, z)[1]], pR, '#261e17', 5);
            seg(ctx, pL, pR, '#261e17', 4);
            seg(ctx, P(-0.55, 1, z), P(0.28, 1, z), '#3a2f26', 3.5);
          }
          seg(ctx, P(-0.45, 1, 1.4), P(-0.32, 1, 7.6), '#6b5b4e', 3.5);
          seg(ctx, P(0.15, 1, 1.4), P(0.18, 1, 7.6), '#6b5b4e', 3.5);
          poly(ctx, metroRails, '#1d1a18');
          const mb = bounds(metroRails);
          ctx.fillStyle = '#111214'; ctx.fillRect(mb[0] + mb[2] * 0.14, mb[1] + 6, mb[2] * 0.72, mb[3] * 0.56);
          ctx.fillStyle = '#2d3238';
          ctx.fillRect(mb[0] + mb[2] * 0.2, mb[1] + 10, mb[2] * 0.24, mb[3] * 0.24);
          ctx.fillRect(mb[0] + mb[2] * 0.54, mb[1] + 10, mb[2] * 0.24, mb[3] * 0.24);
          // Organic rat-corpse mound grounded on the damp tunnel floor (no crate around it)
          const [bx, by, bw, bh] = boxRect(metroRats);
          const mx = bx + bw * 0.5, my = by + bh * 0.88;
          ctx.fillStyle = 'rgba(10, 8, 7, 0.72)';
          ctx.beginPath(); ctx.ellipse(mx, my + 2, bw * 0.56, bh * 0.3, 0, 0, Math.PI * 2); ctx.fill();
          poly(ctx, [
            [bx - 4, my + 4], [bx + bw * 0.14, by + bh * 0.48], [bx + bw * 0.34, by + bh * 0.18],
            [bx + bw * 0.55, by + bh * 0.12], [bx + bw * 0.78, by + bh * 0.3], [bx + bw + 4, my + 3],
            [bx + bw * 0.84, my + 10], [bx + bw * 0.45, my + 12], [bx + bw * 0.12, my + 9],
          ], '#1d1715');
          poly(ctx, [
            [bx + bw * 0.12, my - 2], [bx + bw * 0.32, by + bh * 0.28], [bx + bw * 0.56, by + bh * 0.2],
            [bx + bw * 0.76, by + bh * 0.44], [bx + bw * 0.86, my - 1],
          ], '#27201d');
          const ratSpecs = [
            [-0.36, 0.08, 12, 5.5, 0.28, -1], [-0.18, -0.1, 13, 6, -0.15, 1],
            [0.02, -0.22, 13, 6, 0.1, 1], [0.22, -0.12, 12, 5.5, -0.32, -1],
            [0.37, 0.06, 11, 5, 0.22, -1], [-0.26, 0.18, 14, 6.2, -0.08, 1],
            [-0.04, 0.06, 14, 6.5, 0.24, -1], [0.18, 0.16, 13, 5.8, -0.2, 1],
            [0.08, 0.28, 12, 5, 0.05, 1], [-0.14, 0.26, 11, 5, -0.18, -1],
          ];
          for (let i = 0; i < ratSpecs.length; i++) {
            const [ox, oy, rw, rh, ang, dir] = ratSpecs[i];
            const tw = (i % 3 === 0) ? Math.sin(t * 5.2 + i * 1.9) * 1.6 : 0;
            const rx = mx + ox * bw + tw, ry = by + bh * 0.62 + oy * bh;
            ctx.strokeStyle = '#533b35'; ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(rx - dir * (rw - 2), ry + 1);
            ctx.quadraticCurveTo(rx - dir * (rw + 10), ry + 6 + (i % 2 ? -3 : 3), rx - dir * (rw + 20), ry + 4);
            ctx.stroke();
            ctx.save();
            ctx.translate(rx, ry);
            ctx.rotate(ang);
            ctx.fillStyle = i % 2 ? '#171311' : '#251e1b';
            ctx.beginPath(); ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(dir * (rw * 0.72), -1, rw * 0.45, rh * 0.62, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#3d302c';
            ctx.beginPath(); ctx.arc(dir * (rw * 0.5), -rh * 0.65, 2.2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#a8998c';
            ctx.fillRect(dir * (rw * 0.85), -2, 1.5, 1.5);
            ctx.restore();
          }
          ctx.fillStyle = 'rgba(22, 18, 16, 0.85)';
          for (let f = 0; f < 3; f++) {
            const fx = mx + Math.sin(t * 2.4 + f * 2.1) * 32;
            const fy = by + Math.cos(t * 3.1 + f * 1.7) * 10;
            ctx.fillRect(fx, fy, 2, 2);
          }
        },
        hotspots: [
          back('c1s_hall', '退回艦內長廊'),
          hit('rails', bounds(metroRails, 8), '廢棄地鐵軌道', (g) => g.say('泥土隧道裡靜靜停著漆黑的地鐵列車外殼，只剩軌道鐵鏽的味道。')),
          hit('corpse_rats', boxRect(metroRats, 8), '角落蠕動的屍鼠堆', (g) => {
            g.sanity(-8);
            g.sfx('sting');
            g.flag('c1s_plague', true);
            g.say('鞋跟不小心踢進腐臭的屍鼠堆！幾隻濕冷灰影擦過腳踝竄開——轉眼間一陣異常高熱與寒戰爬上背脊，你染上了疫疾。');
          }),
        ],
      },

      c1s_sea: {
        level: 'C1.4', title: '子空間：海水區', room: seaRoom, quiet: 0.4,
        hazard: c1sHazard,
        viewMsg: '觀景窗裡，漫過腳踝的微苦海水正輕輕冒著細泡，前方通道寫著「H 區」。',
        enter(g, { first }) {
          seaDripT = 1.4;
          c1sEnter(g, first ? '第四扇門後灌滿了及膝深的海水。又苦又涼的海水裡泛著淡淡海沫，簡直像外界「混沌海」滲了進來。' : null);
        },
        update(g, dt) {
          seaDripT -= dt;
          if (seaDripT <= 0) {
            seaDripT = 1.6 + rand() * 1.4;
            g.sfx('drip');
          }
        },
        draw(ctx, t, s, R) {
          const wg = ctx.createLinearGradient(0, 315, 0, H);
          wg.addColorStop(0, 'rgba(18, 52, 78, 0.85)');
          wg.addColorStop(1, 'rgba(12, 38, 60, 0.92)');
          poly(ctx, [P(-1.8, 0.45, 1.2), P(1.8, 0.45, 1.2), P(1.8, 0.98, 7.9), P(-1.8, 0.98, 7.9)], wg);
          for (let i = 0; i < 7; i++) {
            const y = 325 + i * 24, sw = Math.sin(t * 1.6 + i) * 18;
            seg(ctx, [230 + sw, y], [730 - sw, y], 'rgba(128, 198, 240, 0.24)', 1.5);
          }
          glow(ctx, CX(seaAhead), CY(seaAhead), 52, '#5cb4eb', 0.22);
          drawPortalArch(ctx, seaAhead, '#101820', '#54738c', 'H 區');
        },
        hotspots: [
          back('c1s_hall', '涉水返回艦內長廊'),
          hit('water', seaWaterLook, '及膝的苦澀海水', (g) => g.say('冰冷的鹽水在金屬牆壁之間微微晃動，把腳踝浸得發麻。')),
          hit('ahead', bounds(seaAhead, 8), '走向 H 區', (g) => g.go('c1s_h'), 'go'),
        ],
      },

      c1s_h: {
        level: 'C1.4', title: 'H 區', room: hRoom, quiet: 0.5,
        hazard: c1sHazard,
        viewMsg: '觀景窗對準管家 1399 時，關節處一針針手工焊接的修補痕跡異常明顯。',
        enter(g, { first }) {
          c1sEnter(g, first ? '地上散落著撞毀的無人機殘骸。牆邊站著一具人形機械「管家 1399（ACMA-E-442）」，胸口一顆微弱燈號忽明忽滅。' : null);
        },
        draw(ctx, t, s, R) {
          // Crashed drone wreckage with broken rotor arms & cracked lens on left floor
          const dp = P(-1.05, 0.88, 3.1);
          seg(ctx, [dp[0] - 32, dp[1] - 12], [dp[0] + 28, dp[1] + 10], '#3e4750', 3.5);
          seg(ctx, [dp[0] - 24, dp[1] + 12], [dp[0] + 26, dp[1] - 14], '#3e4750', 3.5);
          ctx.fillStyle = '#2d343b'; ctx.beginPath(); ctx.ellipse(dp[0], dp[1], 22, 10, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#a83838'; ctx.beginPath(); ctx.arc(dp[0] + 5, dp[1] + 1, 3.5, 0, Math.PI * 2); ctx.fill();
          // Articulated Butler 1399 humanoid chassis with weld seams & glowing chest LED
          ctx.fillStyle = '#3b444e';
          ctx.fillRect(444, 212, 72, 22);
          ctx.fillRect(454, 210, 52, 128);
          seg(ctx, [454, 240], [506, 265], '#242a30', 2);
          seg(ctx, [480, 212], [480, 338], '#2b323a', 1.5);
          ctx.fillStyle = '#5a6672'; ctx.beginPath(); ctx.arc(480, 188, 20, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#262c33'; ctx.fillRect(466, 182, 28, 10);
          ctx.fillStyle = '#e5a93c'; ctx.fillRect(470, 185, 6, 4); ctx.fillRect(484, 185, 6, 4);
          ctx.fillStyle = s.flags.c1s_butler_following ? '#52d17c' : '#5aa6e8';
          ctx.beginPath(); ctx.arc(480, 248, 5, 0, Math.PI * 2); ctx.fill();
          glow(ctx, 480, 248, 16, s.flags.c1s_butler_following ? '#52d17c' : '#5aa6e8', 0.35);
          // Hideout doorway (left wall)
          drawPortalArch(ctx, hHideoutDoor, '#0f0d0c', '#63594f', '隱蔽處');
          // Follow toggle bulkhead console on right
          if (!s.flags.c1s_rescued) {
            ctx.fillStyle = '#1f2730'; ctx.fillRect(585, 210, 190, 95);
            ctx.strokeStyle = s.flags.c1s_butler_following ? '#62c47e' : '#587896'; ctx.lineWidth = 2; ctx.strokeRect(585, 210, 190, 95);
            txt(ctx, s.flags.c1s_butler_following ? '管家：跟隨中（點此留下他）' : '管家：留在原地（點此同行）', 680, 260, '#dce6ee', 11);
          }
        },
        hotspots: [
          back('c1s_sea', '退回海水區'),
          hit('butler_general', [395, 165, 170, 95], '向管家 1399 詢問方舟機密', (g) => {
            g.say('管家 1399 胸口燈號冷淡閃了兩下：「關於艦船用途與加密核心——無可奉告。」');
          }),
          hit('butler_zhihui', [395, 265, 170, 60], '追問「至慧」與大災來歷', (g) => g.read('n_c1s_butler')),
          hit('butler_junjun', [395, 330, 170, 60], '問起無人機殘骸與倖存者', (g) => {
            g.say('「我在這一帶發現這些無人機殘骸時便推測，尚存的『舊人』倖存者正刻意避開外界探員。……若需與她交涉取得口令權限，我可隨行。」');
          }),
          hit('butler_follow', hButlerToggle, '切換是否帶管家 1399 同行', (g) => {
            const next = !g.s.flags.c1s_butler_following;
            g.flag('c1s_butler_following', next);
            g.say(next
              ? '管家 1399 發出細微的金屬伺服音，默默跟上你的腳步。「帶我一同前往吧。」'
              : '你示意管家留在無人機殘骸旁待命，自己單獨行動。');
          }, 'go', { when: (s) => !s.flags.c1s_rescued }),
          hit('to_hideout', bounds(hHideoutDoor, 8), '走進深處躲藏處', (g) => {
            g.flag('c1s_butler_near', !!g.s.flags.c1s_butler_following);
            g.go('c1s_hideout');
          }, 'go'),
        ],
      },

      c1s_hideout: {
        level: 'C1.4', title: '躲藏處', room: hideRoom, quiet: 0.6,
        hazard: c1sHazard,
        viewMsg: '觀景窗裡，角落那名女子的體溫偏高——疫疾還在折騰著她。',
        enter(g, { first }) {
          c1sEnter(g, g.s.flags.c1s_butler_near
            ? '狹窄的設備維修室裡躲著最後的「舊人」落君。可你身後跟著管家 1399 的金屬身影——她一看見那具機械就別過臉緊閉嘴唇。'
            : (first ? '你獨自穿過漆黑狹縫。設備箱後面縮著一位高燒未退、死死抓著布毯的女子——「落君」。' : null));
        },
        draw(ctx, t, s, R) {
          // Cramped maintenance hideout conduits + cot & field lantern + wrapped-blanket Junjun
          seg(ctx, P(-1.4, -0.4, 1.5), P(-1.4, -0.4, 6.2), '#48403a', 4);
          glow(ctx, 370, 290, 88, '#e8a85c', 0.2);
          if (s.flags.c1s_butler_near) {
            ctx.fillStyle = '#343e48'; ctx.fillRect(150, 210, 44, 118);
            ctx.fillStyle = '#4e5b68'; ctx.beginPath(); ctx.arc(172, 196, 15, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#e5a93c'; ctx.fillRect(164, 194, 5, 4); ctx.fillRect(175, 194, 5, 4);
          }
          if (!s.flags.c1s_rescued) {
            poly(ctx, [[415, 348], [435, 232], [525, 232], [545, 348]], '#52493e');
            ctx.fillStyle = '#2e2520'; ctx.beginPath(); ctx.arc(480, 212, 22, Math.PI * 0.9, Math.PI * 2.1); ctx.fill();
            ctx.fillStyle = '#d4b49c'; ctx.beginPath(); ctx.arc(480, 214, 15, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#241d19'; ctx.fillRect(466, 200, 28, 8);
            if (s.flags.c1s_junjun_met && !s.flags.c1s_butler_near) {
              ctx.fillStyle = '#263a2e'; ctx.fillRect(615, 240, 180, 90);
              ctx.strokeStyle = '#6ec288'; ctx.lineWidth = 2; ctx.strokeRect(615, 240, 180, 90);
              txt(ctx, '帶落君離開送醫', 705, 289, '#e4f7ea', 12);
            }
          }
        },
        hotspots: [
          back('c1s_h', '退出躲藏處'),
          hit('junjun', hideJunjunRect, '角落裡的落君', (g) => {
            if (g.s.flags.c1s_rescued) return g.say('落君已經由醫療線轉送安排妥當，這間躲藏處空了下來。');
            if (g.s.flags.c1s_butler_near) {
              return g.say('落君死死盯著站在你身後的管家 1399，一言不發。只要那台機械還在場，她顯然拒絕跟你說半句話。');
            }
            g.flag('c1s_junjun_met', true);
            g.read('n_c1s_junjun');
          }),
          hit('rescue_junjun', hideRescueRect, '扶起落君帶她離開方舟', (g) => {
            g.flag('c1s_rescued', true);
            g.say('你小心扶起發燒虛弱的落君。她點點頭跟了上來——只要帶她一路回到東舟市平原邊緣就能送醫救治。');
          }, 'go', { when: (s) => !s.flags.c1s_rescued && !!s.flags.c1s_junjun_met && !s.flags.c1s_butler_near }),
        ],
      },
    };
  })(),
};

function CX(pts) { return pts.reduce((a, p) => a + p[0], 0) / pts.length; }
function CY(pts) { return pts.reduce((a, p) => a + p[1], 0) / pts.length; }
