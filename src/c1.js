// Level C-1 stacked sublevels adapted from HOMESICK's Reports I–IV on Backrooms Wiki CN (CC BY-SA 3.0):
// - Report I "偏路" (HOMESICK)
// - Report II "演化机制" (HOMESICK)
// - Report III "箱庭中人" (HOMESICK, thanks to Lovesicker)
// - Report IV "在那树荫下" (HOMESICK & Lovesicker)
// Hub: Level C-1 報告集. Puzzles, inter-level connections, scene text, visuals and original endings are original.

import { P, bounds, box, boxRect, faceQuad, paper, poly, seg, shade, wallQuad } from './render.js';
import { rand } from './rng.js';
import { back, glow, hit, once, pal, room, txt } from './levels/sublevel-kit.js';

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
  poly(ctx, pts, '#fcfdfe');
  ctx.strokeStyle = '#c9d2da';
  ctx.lineWidth = 2;
  poly(ctx, pts);
  ctx.stroke();
  const b = bounds(pts);
  ctx.fillStyle = '#adb7c0';
  ctx.beginPath();
  ctx.arc(b[0] + b[2] * 0.82, b[1] + b[3] * 0.55, Math.max(2, b[2] * 0.04), 0, Math.PI * 2);
  ctx.fill();
  if (plate) {
    ctx.fillStyle = '#cfd6dc';
    ctx.fillRect(b[0] + b[2] * 0.25, b[1] + b[3] * 0.26, b[2] * 0.5, Math.max(12, b[3] * 0.09));
    txt(ctx, plate, b[0] + b[2] * 0.5, b[1] + b[3] * 0.32, '#49545e', Math.max(9, Math.round(b[2] * 0.14)));
  }
}

function drawWhiteBench(ctx, R, z1, z2, x1 = 0.65, x2 = 1.32) {
  box(ctx, R, { x1, x2, y1: 0.45, y2: 0.54, z1, z2, color: '#eef2f5', top: '#ffffff', edge: true });
  box(ctx, R, { x1: x1 + 0.08, x2: x1 + 0.16, y1: 0.54, y2: 1, z1: z1 + 0.08, z2: z1 + 0.18, color: '#dfe5ea', edge: true });
  box(ctx, R, { x1: x2 - 0.16, x2: x2 - 0.08, y1: 0.54, y2: 1, z1: z2 - 0.18, z2: z2 - 0.08, color: '#dfe5ea', edge: true });
}

function drawCleanWindow(ctx, pts, hintColor = '#eef4f8') {
  poly(ctx, pts, hintColor);
  ctx.strokeStyle = '#cfd7de';
  ctx.lineWidth = 3;
  poly(ctx, pts);
  ctx.stroke();
  const [a, b, c, d] = pts;
  const mxTop = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const mxBot = [(d[0] + c[0]) / 2, (d[1] + c[1]) / 2];
  seg(ctx, mxTop, mxBot, '#cfd7de', 2);
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
      box(ctx, R, c1EntryBox);
      poly(ctx, [P(0.8, 0.58, 1.72), P(1.34, 0.58, 1.72), P(1.34, 0.58, 2.28), P(0.8, 0.58, 2.28)], '#3a2d1d');
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
      hit('window', bounds(c1HallWin, 8), '走廊旁的窗戶', (g) => g.say('窗玻璃後面隱約有一望無際的平地輪廓，但窗栓像是還卡在木框裡。再多走幾步試試吧。')),
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
        if (!once(g, 'c1_bench_rested')) {
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
      poly(ctx, c1MirrorWall, '#dce8ef');
      ctx.strokeStyle = '#bac7d2'; ctx.lineWidth = 3; poly(ctx, c1MirrorWall); ctx.stroke();
      for (const sSide of [-1, 1]) {
        const mw = wallQuad(sSide * 1.5, -0.68, 0.88, 1.8, 6.2);
        poly(ctx, mw, '#e2edf4');
        ctx.strokeStyle = '#c4cfd8'; ctx.lineWidth = 2; poly(ctx, mw); ctx.stroke();
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
      hit('mirror', bounds(c1MirrorWall, 10), '整面鏡牆', (g) => {
        if (!once(g, 'c1_mirror_spooked')) {
          g.sanity(-3);
          g.sfx('sting');
          return g.say('你走近鏡面——裡頭的倒影明顯慢了半拍才抬起手，像玻璃後面有另一個自己正在學你的動作。');
        }
        g.say('冰涼平滑的鏡面如實映出你站著的身影，玻璃上連半個指紋都沒有。');
      }),
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
};
