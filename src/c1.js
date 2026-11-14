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
        if (once(g, 'c1_mirror_spooked')) {
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

  // ---------- Report II: 東舟市 (Level C-1.2) ----------
  ...(() => {
    const plainPal = pal('#788992', '#8fa3ae', '#556552', '#9fb0ba', '#e6eef2');
    const cityPal = pal('#8a8e91', '#9aa0a6', '#67696b', '#4d5257', '#d8dee4');
    const acmaPal = pal('#787e84', '#585e64', '#4e5256', '#282c30', '#dbe6ee');
    const cavePal = pal('#2a2826', '#1a1918', '#23201d', '#090908', '#8c8070');
    const gardenPal = pal('#98a49c', '#b4c2b8', '#687666', '#8a998d', '#edf5ee');

    const plainRoom = room(plainPal, { hw: 2.2, depth: 9, fogEnd: 16, baseboard: false, lights: [] });
    const cityRoom = room(cityPal, { hw: 1.8, depth: 8.5, fogEnd: 14, lights: [2.0, 5.2] });
    const acmaRoom = room(acmaPal, { hw: 1.6, depth: 8, fogEnd: 13, tiles: true, lights: [1.8, 4.4, 6.8] });
    const caveRoom = room(cavePal, { hw: 1.5, depth: 7, fogEnd: 7, wallTex: 'concrete', baseboard: false, lights: [] });
    const gardenRoom = room(gardenPal, { hw: 1.8, depth: 8, fogEnd: 15, lights: [2.2, 5.4] });

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
    const cavePathQuad = wallQuad(2.2, -0.2, 0.85, 3.6, 4.9);
    const trekSignQuad = faceQuad(1.1, 0.25, 1.75, 0.95, 2.5);
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

    return {
      c1e_outskirts: {
        level: 'C1.2', title: '平原邊緣', room: plainRoom, quiet: 0.65,
        viewMsg: '觀景窗裡，遠處東舟市尚未抹灰的水泥輪廓清楚了不少，地上圓坑的邊緣也顯得分外整齊。',
        enter(g, { first }) {
          if (g.s.flags.c1e_in_city) {
            g.flag('c1e_in_city', false);
            g.sfx('groan');
            g.sanity(-2);
            return g.say('剛離開東舟市管制線，遠方平原霧氣深處就傳來一聲低沉的嘶吼——城外並不安全。');
          }
          if (first) g.say('一望無際的淺灰草原鋪開在眼前。遠處立著灰白色的東舟市外牆，空氣裡帶著潮濕的泥土與草腥味。');
        },
        draw(ctx, t, s, R) {
          // Far skyline of East Boat City
          poly(ctx, [P(-2.2, 0.2, 9), P(2.2, 0.2, 9), P(2.2, 1, 9), P(-2.2, 1, 9)], '#66756a');
          for (const [bx, bw, bh] of [[-0.6, 0.32, 0.58], [-0.2, 0.4, 0.78], [0.25, 0.35, 0.64], [0.58, 0.28, 0.5]]) {
            const p1 = P(bx, 0.2 - bh, 8.95), p2 = P(bx + bw, 0.2, 8.95);
            ctx.fillStyle = '#535c62'; ctx.fillRect(p1[0], p1[1], p2[0] - p1[0], p2[1] - p1[1]);
          }
          poly(ctx, cityArchQuad, '#454d52');
          txt(ctx, '東舟市', CX(cityArchQuad), CY(cityArchQuad), '#cbd6de', 13);
          // Circular ground depression (vanished floating island / reverse waterfall mark)
          const hp = P(-0.95, 1, 2.65);
          ctx.save(); ctx.strokeStyle = 'rgba(42, 52, 46, 0.55)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(hp[0], hp[1], 55, 18, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
          // Locked wooden cabin (C-100 mention only)
          poly(ctx, cabinQuad, '#69513c'); ctx.strokeStyle = '#3d2c1e'; ctx.lineWidth = 2; poly(ctx, cabinQuad); ctx.stroke();
          // Cave trail on right
          poly(ctx, cavePathQuad, '#2b2d2a');
          txt(ctx, '洞穴', CX(cavePathQuad), CY(cavePathQuad), '#9da6a0', 11);
          // SE 7.9 km post
          poly(ctx, trekSignQuad, '#596368');
          txt(ctx, '東南 7.9 km', CX(trekSignQuad), CY(trekSignQuad), '#dce4e8', 11);
        },
        hotspots: [
          back('c1_hall', '翻回偏路的窗戶', '你抓住漂浮在草坡邊的窗框翻了回去，身後重新合上冷白一塵不染的長廊。'),
          hit('hollows', bounds(hollows, 8), '地面的圓形凹痕', (g) => g.say('草皮底下陷著幾個異常規整的圓坑。傳說懸浮島、不倒岩群與逆流瀑布曾懸在這裡，如今只剩空蕩蕩的凹痕。')),
          hit('cabin', bounds(cabinQuad, 8), '上鎖的小木屋', (g) => g.say('一間上了重鎖的獨棟木屋。封條印著「M.E.G. 破門項目（C-100 方向）——生人勿進」。')),
          hit('trek', bounds(trekSignQuad, 8), '東南方向路標（7.9 km）', (g) => g.say('路標朝向東南方約七點九公里處的山體。遠望過去像有一截巨大的金屬艦身卡在山脊裡——待把城裡的線索摸清楚再去看看吧。')),
          hit('to_cave', bounds(cavePathQuad, 8), '山壁下的洞穴', (g) => g.go('c1e_cave', { msg: '你沿著石礫小徑走進山壁底下的陰暗洞口。' }), 'go'),
          hit('to_city', bounds(cityArchQuad, 8), '前往東舟市外環', (g) => g.go('c1e_gate'), 'go'),
        ],
      },

      c1e_gate: {
        level: 'C1.2', title: '東舟市外環', room: cityRoom, quiet: 0.45,
        viewMsg: '觀景窗裡，剛長出來的毛坯樓牆角正掉下細碎的泥土。',
        enter(g, { first }) {
          c1eEnterCity(g, first ? '外環一排排灰色毛坯水泥建築靜靜立在眼前，牆腳還沾著像剛從地底拱出來似的泥土。哨站標著三方聯合的徽記。' : null);
        },
        draw(ctx, t, s, R) {
          for (const z of [2.0, 4.2, 6.2]) {
            poly(ctx, wallQuad(-1.8, -0.85, 0.9, z, z + 1.1), shade(R, '#767a7e', z));
            poly(ctx, [P(-1.8, 0.9, z), P(-1.55, 0.9, z), P(-1.55, 1, z + 1.1), P(-1.8, 1, z + 1.1)], '#5c4b3b');
          }
          paper(ctx, R, gateNoticeQuad, 2.7, '#eef0ec');
          box(ctx, R, gateDeskBox);
          if (!s.flags.c1e_got_recorder && !s.flags.c1e_013_done) {
            const pt = P(1.05, 0.34, 2.45);
            ctx.fillStyle = '#2a2d34'; ctx.fillRect(pt[0] - 8, pt[1] - 5, 16, 10);
            ctx.fillStyle = '#d64545'; ctx.beginPath(); ctx.arc(pt[0] + 3, pt[1], 2, 0, Math.PI * 2); ctx.fill();
          }
          poly(ctx, gateAhead, '#42474c');
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
        level: 'C1.2', title: '市中心大道', room: { ...cityRoom, hw: 2.0, depth: 9 }, quiet: 0.4,
        viewMsg: '觀景窗裡能看見遠處各區的路牌都在微弱地反光。',
        enter(g, { first }) {
          c1eEnterCity(g, first ? '寬敞得過分的灰白大道向各區岔開：左面是三合研究院，前方通往 03 區 ACMA 與新紀花園，西側遠處則是撒加利工廠。' : null);
        },
        draw(ctx, t, s, R) {
          poly(ctx, roadLabDoor, shade(R, '#66747e', 2.7));
          txt(ctx, '三合研究院', CX(roadLabDoor), CY(roadLabDoor), '#e4edf2', 11);
          poly(ctx, roadAcmaDoor, shade(R, '#5c6670', 8.5));
          txt(ctx, '03區 ACMA', CX(roadAcmaDoor), CY(roadAcmaDoor), '#e4edf2', 12);
          poly(ctx, roadGardenDoor, shade(R, '#5c7260', 8.5));
          txt(ctx, '新紀花園', CX(roadGardenDoor), CY(roadGardenDoor), '#e4f2e8', 12);
          poly(ctx, roadFactorySign, '#53575b');
          txt(ctx, '工廠／實驗室', CX(roadFactorySign), CY(roadFactorySign), '#d6dce0', 10);
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
          poly(ctx, labBoardQuad, '#4c565e');
          txt(ctx, 'C-Lambda #11', CX(labBoardQuad), CY(labBoardQuad) - 10, '#cfdbe2', 11);
          box(ctx, R, { x1: -1.0, x2: 1.05, y1: 0.45, y2: 1, z1: 4.3, z2: 4.9, color: '#6b7075', top: '#7f868c', edge: true });
          paper(ctx, R, labShijuQuad, 4.6, '#f4efdc');
          poly(ctx, labSpareQuad, '#3e4850');
          txt(ctx, '備用庫房', CX(labSpareQuad), CY(labSpareQuad), '#c7d2d9', 10);
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
          for (const [q, lbl] of [[cell024, 'E-024'], [cell025, 'E-025'], [cell013, 'E-013']]) {
            poly(ctx, q, '#2b3238');
            ctx.strokeStyle = '#8b96a0'; ctx.lineWidth = 2; poly(ctx, q); ctx.stroke();
            txt(ctx, lbl, CX(q), q[0][1] + 22, '#dce6ee', 12);
          }
          // Subtle figure silhouettes inside E-024 and E-013 cells
          const p24 = [CX(cell024), CY(cell024) + 18];
          ctx.fillStyle = '#4e5248';
          ctx.beginPath(); ctx.ellipse(p24[0], p24[1], 18, 12, 0, 0, Math.PI * 2); ctx.fill();
          const p13 = [CX(cell013), CY(cell013) + 4];
          ctx.fillStyle = '#8a3228';
          ctx.beginPath(); ctx.arc(p13[0], p13[1] - 18, 8, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#d8d8dc';
          ctx.fillRect(p13[0] - 8, p13[1] - 8, 16, 28);
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
          if (s.flags.c1e_cave_gone) {
            box(ctx, R, caveRubbleBox);
            return;
          }
          // Glow only (E-002's form is never seen)
          if (s.flags.c1e_002_heard || caveStillT >= 5) {
            glow(ctx, 480, 215, 110 + Math.sin(t * 2) * 8, '#d4af7a', 0.25);
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
          box(ctx, R, gardenBench);
          box(ctx, R, gardenFountain);
          box(ctx, R, gardenCrate);
          for (const px of [-1.2, -0.8, 0.9, 1.3]) {
            const pt = P(px, 0.55, 5.2);
            ctx.fillStyle = '#3f6344';
            ctx.beginPath(); ctx.arc(pt[0], pt[1], 18, 0, Math.PI * 2); ctx.fill();
          }
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
};

function CX(pts) { return pts.reduce((a, p) => a + p[0], 0) / pts.length; }
function CY(pts) { return pts.reduce((a, p) => a + p[1], 0) / pts.length; }
