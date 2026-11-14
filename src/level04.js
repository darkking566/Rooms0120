// Level 0.4 "碾城" adapted from HOMESICK's Report V on Backrooms Wiki CN (CC BY-SA 3.0).
// Adopts the pre-incident state of Report V main text (prior to the /weed-toc event).
// Layer-fission timing compression, puzzles, scene text and J.H. notes are original.

import { H, P, W, bounds, box, boxRect, faceQuad, paper, poly, seg, wallQuad } from './render.js';
import { back, glow, hit, once, pal, room, txt } from './levels/sublevel-kit.js';

export const L04_LEVELS = {
  '0.4': { name: 'LEVEL 0.4', sub: '碾城', drain: 1.5, thirst: 1.5, hunger: 1.2 },
};

const wormPal = pal('#1e1028', '#12081a', '#160b20', '#09040e', '#b978e8');
const outerPal = pal('#4c5056', '#32363c', '#3c3f44', '#181a1e', '#b4bcc8');
const weiPal = pal('#5a5e64', '#40454c', '#45484e', '#1c1f24', '#d8dfe8');
const innerPal = pal('#788692', '#647684', '#56626c', '#263038', '#e6f6ff');
const wolfPal = pal('#585452', '#4c4648', '#3e3a38', '#221c1d', '#c4a89e');
const crimsonWolfPal = pal('#6e242a', '#5c141a', '#422224', '#2a0c10', '#e67c78');

const wormRoom = room(wormPal, { hw: 1.6, depth: 7, fogEnd: 9, baseboard: false, lights: [] });
const outerRoom = room(outerPal, {
  hw: 1.8, depth: 8.5, fogEnd: 13, open: true, floorTex: 'concrete', lights: [],
  flick: (t) => (Math.sin(t * 9.1) + Math.sin(t * 21.3) > 1.2 ? 0.58 : 0.94),
});
const weiRoom = room(weiPal, { hw: 2.0, depth: 9, fogEnd: 15, open: true, floorTex: 'concrete', lights: [] });
const innerRoom = room(innerPal, { hw: 1.8, depth: 8.5, fogEnd: 16, open: true, floorTex: 'concrete', bright: 1.08, lights: [] });
const wolfRoomOf = (s) => room(s.flags.l04_red_sky ? crimsonWolfPal : wolfPal, {
  hw: 2.2, depth: 9.5, fogEnd: 14, open: true, floorTex: 'carpet', baseboard: false, lights: [],
});

const wormHoleQuad = faceQuad(-0.68, -0.78, 0.68, 0.78, 6.2);
const veilQuad = faceQuad(-0.55, -0.75, 0.55, 0.85, 5.5);

const outerBox = { x1: -1.45, x2: -0.95, y1: 0.68, y2: 1, z1: 2.6, z2: 3.1, color: '#50565c', top: '#646c74', edge: true };
const outerToWei = faceQuad(-0.42, -0.42, 0.42, 0.95, 8.499);
const outerToWolf = wallQuad(1.8, -0.45, 0.95, 3.0, 4.3);

const weiHunterDoor = wallQuad(-2.0, -0.55, 1, 2.5, 3.8);
const weiCrate = { x1: 0.85, x2: 1.45, y1: 0.52, y2: 1, z1: 2.5, z2: 3.2, color: '#5c4b3a', top: '#735e4a', edge: true };
const weiToInner = faceQuad(-0.38, -0.48, 0.38, 0.98, 8.999);
const weiToOuter = wallQuad(2.0, -0.45, 0.95, 2.2, 3.3);

const innerDomeBarrier = faceQuad(-0.9, -0.75, 0.9, 0.25, 7.2);
const innerPioneerQuad = wallQuad(-1.8, -0.4, 0.65, 2.4, 3.6);
const innerStayQuad = faceQuad(-0.48, 0.35, 0.48, 0.88, 4.2);
const innerToWei = wallQuad(1.8, -0.45, 0.95, 2.2, 3.3);

const wolfSupplyCrate = { x1: -1.15, x2: -0.55, y1: 0.54, y2: 1, z1: 2.8, z2: 3.4, color: '#615447', top: '#786958', edge: true };
const wolfSilhouetteRect = [410, 185, 140, 175];
const wolfRoninNote = wallQuad(-2.2, -0.2, 0.4, 2.2, 3.0);
const wolfToOuter = wallQuad(2.2, -0.45, 0.95, 2.4, 3.6);

function l04Update(g, dt) {
  const s = g.s;
  const f = s.flags;
  if ((f.l04_fission_rem || 0) > 0) {
    f.l04_fission_rem = Math.max(0, f.l04_fission_rem - dt);
    return;
  }
  const nextT = (f.l04_fission_t || 0) + dt;
  if (nextT >= 90) {
    g.flag('l04_fission_t', 0);
    g.flag('l04_fission_rem', 6);
    g.flag('l04_red_sky', true);
    const seed = ((f.l04_wolf_seed || 1) * 3 + 1) % 97;
    g.flag('l04_wolf_seed', seed);
    g.flag('l04_fission_count', (f.l04_fission_count || 0) + 1);
    g.sfx('surge');
    g.say(s.scene === 'l04_wolf'
      ? '天色猛地沉成一片死紅——「層裂變」降臨了！市區以外的這整片地界都在嗡鳴裡扭曲重組。'
      : '天色忽然轉成陰鬱的深紅。遠處市區邊界之外的地面傳來低沉震動——又是一輪「層裂變」，但城裡的街道紋絲不動。');
  } else {
    g.flag('l04_fission_t', nextT);
  }
}

function drawCrimsonSky(ctx, s, hy = 295) {
  if (!s.flags.l04_red_sky) return;
  const active = (s.flags.l04_fission_rem || 0) > 0;
  ctx.save();
  const gr = ctx.createLinearGradient(0, 0, 0, hy);
  gr.addColorStop(0, active ? 'rgba(175, 22, 32, 0.36)' : 'rgba(120, 18, 26, 0.2)');
  gr.addColorStop(1, 'rgba(90, 14, 20, 0)');
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, W, hy);
  if (active) {
    ctx.strokeStyle = 'rgba(255, 130, 120, 0.55)';
    ctx.lineWidth = 2;
    for (const [sx, sy, dx, dy] of [[220, 40, 28, 75], [690, 52, -32, 82]]) {
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + dx, sy + dy * 0.5); ctx.lineTo(sx + dx * 0.4, sy + dy); ctx.stroke();
    }
  }
  ctx.restore();
}

function drawStreetRoad(ctx, hy, lamps, t, flicker = false) {
  poly(ctx, [P(-0.9, 1, 8.5), P(0.9, 1, 8.5), P(2.1, 1, 1.1), P(-2.1, 1, 1.1)], '#2a2d32');
  seg(ctx, P(-1.8, 1, 1.2), P(-0.85, 1, 8.5), '#555b62', 2);
  seg(ctx, P(1.8, 1, 1.2), P(0.85, 1, 8.5), '#555b62', 2);
  for (const z of [1.6, 3.0, 4.7, 6.6]) {
    poly(ctx, [P(-0.04, 1, z), P(0.04, 1, z), P(0.04, 1, z + 0.65), P(-0.04, 1, z + 0.65)], 'rgba(205, 186, 120, 0.42)');
  }
  for (const [lx, z] of lamps) {
    const bot = P(lx, 1, z), top = P(lx, -0.78, z);
    const arm = P(lx * 0.65, -0.78, z);
    seg(ctx, bot, top, '#3c4146', Math.max(2, 6 / z));
    seg(ctx, top, arm, '#3c4146', Math.max(1.5, 5 / z));
    const dim = flicker && Math.sin(t * 11 + z) > 0.7 ? 0.14 : 0.34;
    glow(ctx, arm[0], arm[1] + 6, 48 / z, '#ffdba0', dim);
    ctx.fillStyle = '#ffe6b0'; ctx.fillRect(arm[0] - 4, arm[1], 8, 3);
  }
}

function drawTowerBlock(ctx, hy, x, w, h, shadeCol) {
  ctx.fillStyle = shadeCol;
  ctx.fillRect(x, hy - h, w, h + 4);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(x, hy - h, w, 4);
  ctx.fillStyle = 'rgba(18, 22, 26, 0.65)';
  for (let wy = hy - h + 14; wy < hy - 12; wy += 16) {
    for (let wx = x + 8; wx < x + w - 10; wx += 14) ctx.fillRect(wx, wy, 7, 9);
  }
}

function drawArchSign(ctx, pts, inner, trim, label) {
  const b = bounds(pts);
  poly(ctx, pts, trim);
  ctx.fillStyle = inner;
  ctx.fillRect(b[0] + 4, b[1] + 4, Math.max(4, b[2] - 8), Math.max(4, b[3] - 4));
  if (label) {
    ctx.fillStyle = '#1b1f24';
    ctx.fillRect(b[0] + 2, b[1] - 18, b[2] - 4, 16);
    ctx.strokeStyle = trim; ctx.lineWidth = 1;
    ctx.strokeRect(b[0] + 2, b[1] - 18, b[2] - 4, 16);
    txt(ctx, label, b[0] + b[2] * 0.5, b[1] - 6, '#e2e8ee', 10);
  }
}

function l04WolfVariant(s) {
  return (s.flags.l04_wolf_seed || 1) % 2;
}

export const L04_SCENES = {
  l04_worm: {
    level: 0, title: '宏蟲洞（入口側）', room: wormRoom, quiet: 0.5,
    viewMsg: '觀景窗裡，黑紫色的漩渦內壁正一圈圈把空間拉長，最深處隱約浮著星光。',
    enter(g, { first }) {
      g.flag('l04_warned', false);
      if (first) g.say('半徑約四點二公尺的圓柱形空洞嵌在檔案室牆後。翻湧的黑紫色霧壁散發出讓人不安的微刺感。');
    },
    draw(ctx, t, s, R) {
      glow(ctx, 480, 270, 165, '#6d2ca8', 0.42);
      for (let i = 5; i >= 1; i--) {
        ctx.strokeStyle = i % 2 ? '#59238a' : '#2a0e42';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.ellipse(480, 270, i * 32 + Math.sin(t * 2 + i) * 4, i * 28 + Math.cos(t * 2 + i) * 4, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      poly(ctx, wormHoleQuad, 'rgba(18, 6, 30, 0.45)');
    },
    hotspots: [
      back('l0_archive', '退回檔案室'),
      hit('worm_enter', bounds(wormHoleQuad, 8), '貼近黑紫色宏蟲洞', (g) => {
        if (once(g, 'l04_warned')) {
          g.sanity(-5);
          g.sfx('sting');
          return g.say('入口半徑約四點二公尺。洞壁翻湧著黑紫色，指背剛擦過就像被細針刺了一排。你聽見背後的日光燈嗡嗡聲正逐漸遠去。');
        }
        g.go('l04_veil', { msg: '你沿著失真的圓柱通道走到盡頭，眼前浮出一張靜止的星空帷幕。' });
      }, 'go'),
    ],
  },

  l04_veil: {
    level: 0, title: '星空帷幕', room: wormRoom, quiet: 0.75,
    viewMsg: '觀景窗對著那片星空帷幕完全失去了焦距——跨過去之後，原本的層級位置將徹底斷線。',
    enter(g, { first }) {
      if (first) g.say('出口端懸掛著一片沒有邊框的深色星幕。只要往前再跨出一步，身後就會永遠消失。');
    },
    draw(ctx, t, s, R) {
      poly(ctx, veilQuad, '#070914');
      ctx.save();
      for (let i = 0; i < 28; i++) {
        const sx = 350 + ((i * 67 + Math.round(t * 8)) % 260);
        const sy = 105 + ((i * 53) % 245);
        ctx.fillStyle = i % 3 ? '#dce8ff' : '#9ab4ff';
        ctx.fillRect(sx, sy, 2, 2);
      }
      ctx.restore();
      txt(ctx, '穿過帷幕（不可回頭）', 480, 265, '#cad8ff', 12);
    },
    hotspots: [
      back('l04_worm', '趁還沒跨過去退回洞口'),
      hit('cross_veil', bounds(veilQuad, 8), '穿過星空帷幕', (g) => {
        g.checkpoint();
        g.go('l04_outer', { msg: '你一步邁進星幕——零星閃光在睫毛邊碎開的瞬間，水泥街面落回腳底。身後什麼通道都沒有留下。' });
      }, 'go'),
    ],
  },

  l04_outer: {
    level: '0.4', title: '外環街道', room: outerRoom, quiet: 0.45,
    viewMsg: '觀景窗裡，越靠近市區外緣，街燈閃爍與電壓失穩的頻率越高。',
    hazard: (s) => ((s.flags.l04_fission_rem || 0) > 0 ? '天色泛紅：層裂變正在城外劇變' : null),
    enter(g, { first }) {
      if (!g.s.flags.l04_wolf_seed) g.flag('l04_wolf_seed', 2);
      if (first) g.say('高聳的粗野主義水泥樓房和現代街巷交錯延伸。頭頂路燈電流忽明忽暗，供水與排汙溝渠還算正常，身後卻完全找不到來的宏蟲洞。');
    },
    update: l04Update,
    draw(ctx, t, s, R) {
      const hy = P(0, 1, R.depth)[1];
      drawCrimsonSky(ctx, s, hy);
      // Brutalist high-rise concrete blocks flanking the outer ring road
      for (const [bx, bw, bh, c] of [[28, 128, 225, '#34383d'], [168, 98, 175, '#3b4046'], [796, 134, 215, '#32363b'], [688, 96, 165, '#3a3e44']]) {
        drawTowerBlock(ctx, hy, bx, bw, bh, c);
      }
      drawStreetRoad(ctx, hy, [[-1.55, 2.6], [1.55, 2.6], [-1.55, 5.4], [1.55, 5.4]], t, true);
      box(ctx, R, outerBox);
      const ob = boxRect(outerBox);
      ctx.fillStyle = '#c4962e'; ctx.fillRect(ob[0] + 6, ob[1] + 18, ob[2] - 12, 5);
      poly(ctx, wallQuad(1.82, -0.68, 1, 2.5, 5.0), '#2d3136');
      drawArchSign(ctx, outerToWei, '#1b1f24', '#555d66', '中環・尉遲大道');
      drawArchSign(ctx, outerToWolf, '#262321', '#5f5650', '城外・狼領 ▶');
    },
    hotspots: [
      hit('outer_supply', boxRect(outerBox, 8), '閃爍路燈旁的配電箱腳', (g) => {
        if (once(g, 'l04_sup_outer')) {
          return g.give('bar', '配電箱底的鐵盒裡還剩一條乾糧能量棒。這是這片貧瘠外環難得一見的補給。');
        }
        g.say('鐵盒已經徹底搜空了。');
      }),
      hit('to_wei', bounds(outerToWei, 8), '沿環線前往中環・尉遲大道', (g) => g.go('l04_wei'), 'go'),
      hit('to_wolf', bounds(outerToWolf, 8), '走出市區前往「狼領」', (g) => g.go('l04_wolf'), 'go'),
    ],
  },

  l04_wei: {
    level: '0.4', title: '尉遲大道', room: weiRoom, quiet: 0.4,
    viewMsg: '觀景窗沿著二十一公里長的筆直大道望過去，紅殿的燈光比外環穩定了許多。',
    hazard: (s) => ((s.flags.l04_fission_rem || 0) > 0 ? '天色泛紅：層裂變正在城外劇變' : null),
    enter(g, { first }) {
      if (first) g.say('全長約二十一公里的中環主道「尉遲大道」。兩側雜亂分佈著獵手們的居所，中段矗立著獵手公會總部「紅殿」，遠處隱約傳說連著交付物資的寶庫「Tower」。');
    },
    update: l04Update,
    draw(ctx, t, s, R) {
      const hy = P(0, 1, R.depth)[1];
      drawCrimsonSky(ctx, s, hy);
      // Distant Tower spire + Hunter Guild dwellings along Wei Chi Ave
      for (const [bx, bw, bh, c] of [[18, 120, 180, '#3a3e44'], [815, 125, 175, '#393d43'], [360, 74, 108, '#41464d'], [526, 78, 118, '#3f444b']]) {
        drawTowerBlock(ctx, hy, bx, bw, bh, c);
      }
      poly(ctx, [[470, hy - 140], [490, hy - 140], [500, hy], [460, hy]], '#4e555e');
      drawStreetRoad(ctx, hy, [[-1.65, 2.3], [1.65, 2.3], [-1.65, 5.1], [1.65, 5.1], [-1.65, 7.6], [1.65, 7.6]], t);
      // Crimson-walled Red Hall (Hunters Guild HQ) wing grounded to sidewalk
      poly(ctx, wallQuad(-2.02, -0.88, 1, 2.1, 4.4), '#441a1d');
      const hb = bounds(weiHunterDoor);
      poly(ctx, weiHunterDoor, '#5c2427');
      ctx.fillStyle = '#381618'; ctx.fillRect(hb[0] + hb[2] * 0.25, hb[1] + hb[3] * 0.24, hb[2] * 0.5, hb[3] * 0.76);
      ctx.strokeStyle = '#9e4e52'; ctx.lineWidth = 2; poly(ctx, weiHunterDoor); ctx.stroke();
      glow(ctx, hb[0] + hb[2] * 0.5, hb[1] + hb[3] * 0.3, 46, '#ff9966', 0.28);
      txt(ctx, '紅殿・獵手公會', CX(weiHunterDoor), hb[1] - 10, '#f2d8d8', 11);
      box(ctx, R, weiCrate);
      poly(ctx, wallQuad(2.02, -0.62, 1, 1.9, 3.6), '#30343a');
      drawArchSign(ctx, weiToInner, '#2d465a', '#6e94ad', '內環・鐵穹區');
      drawArchSign(ctx, weiToOuter, '#24272c', '#585e64', '◀ 回外環街道');
    },
    hotspots: [
      hit('talk_hunter', bounds(weiHunterDoor, 8), '紅殿門前的獵手公會成員', (g) => g.read('n04_hunter')),
      hit('wei_supply', boxRect(weiCrate, 8), '交付木箱旁', (g) => {
        if (once(g, 'l04_sup_wei')) {
          return g.give('can', '送往 Tower 的待清點木箱邊掉出了一只沒人撿走的桃子罐頭。');
        }
        g.say('剩下的交付箱全都被公會鎖得死緊，沒有獵手徽記打不開。');
      }),
      hit('to_inner', bounds(weiToInner, 8), '前往內環・鐵穹區外', (g) => g.go('l04_inner'), 'go'),
      hit('to_outer', bounds(weiToOuter, 8), '退回外環街道', (g) => g.go('l04_outer'), 'go'),
    ],
  },

  l04_inner: {
    level: '0.4', title: '鐵穹區外', room: innerRoom, quiet: 0.55,
    viewMsg: '觀景窗掃過全天運作的「穹頂系統」光幕，背後依然半條出去的路也沒有。',
    hazard: (s) => ((s.flags.l04_fission_rem || 0) > 0 ? '天色泛紅：層裂變正在城外劇變' : null),
    enter(g, { first }) {
      if (first) g.say('內環七大區之一的「鐵穹區」邊界。電力在這裡亮得穩定刺眼，全天候運作的「穹頂系統」光幕隔開了外來者。');
    },
    update: l04Update,
    draw(ctx, t, s, R) {
      const hy = P(0, 1, R.depth)[1];
      drawCrimsonSky(ctx, s, hy);
      // Clean futuristic Iron Dome towers shimmering behind the energy shield
      for (const [bx, bw, bh, c] of [[325, 65, 130, '#5a6e7e'], [415, 85, 175, '#647b8e'], [520, 72, 145, '#586c7c']]) {
        drawTowerBlock(ctx, hy, bx, bw, bh, c);
      }
      drawStreetRoad(ctx, hy, [[-1.5, 2.4], [1.5, 2.4], [-1.5, 5.2], [1.5, 5.2]], t);
      glow(ctx, 480, 210, 170, '#72c8ff', 0.28);
      const db = bounds(innerDomeBarrier);
      poly(ctx, innerDomeBarrier, 'rgba(130, 205, 255, 0.24)');
      ctx.save();
      ctx.strokeStyle = 'rgba(170, 232, 255, 0.42)'; ctx.lineWidth = 1;
      for (let gx = db[0] + 18; gx < db[0] + db[2] - 8; gx += 22) seg(ctx, [gx, db[1]], [gx, db[1] + db[3]], ctx.strokeStyle, 1);
      const scanY = db[1] + ((t * 48) % db[3]);
      seg(ctx, [db[0], scanY], [db[0] + db[2], scanY], 'rgba(200, 245, 255, 0.65)', 2);
      ctx.restore();
      ctx.strokeStyle = '#9bdcff'; ctx.lineWidth = 2; poly(ctx, innerDomeBarrier); ctx.stroke();
      // Grounded Pioneer watch booth seated squarely onto sidewalk (y = 1)
      poly(ctx, wallQuad(-1.82, -0.45, 1, 2.35, 3.65), '#3c4954');
      const pb = bounds(innerPioneerQuad);
      poly(ctx, innerPioneerQuad, '#4c5b68');
      ctx.fillStyle = '#a4dbf8'; ctx.fillRect(pb[0] + 12, pb[1] + 16, pb[2] - 24, pb[3] * 0.46);
      ctx.strokeStyle = '#9bb4c8'; ctx.lineWidth = 2; poly(ctx, innerPioneerQuad); ctx.stroke();
      txt(ctx, '先驅值班亭', CX(innerPioneerQuad), pb[1] - 10, '#e6f5ff', 11);
      // Solid concrete bench / resting plinth in foreground
      const sb = bounds(innerStayQuad);
      ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(sb[0] + 8, sb[1] + sb[3] - 4, sb[2] - 16, 10);
      poly(ctx, innerStayQuad, '#38414a');
      ctx.strokeStyle = '#8fa4b8'; ctx.lineWidth = 1.5; poly(ctx, innerStayQuad); ctx.stroke();
      txt(ctx, '在這裡待下去', 480, CY(innerStayQuad) + 4, '#d4e2ee', 12);
      poly(ctx, wallQuad(1.82, -0.6, 1, 1.9, 3.6), '#30363c');
      drawArchSign(ctx, innerToWei, '#2a2e33', '#606870', '回尉遲大道 ▶');
    },
    hotspots: [
      hit('talk_pioneer', bounds(innerPioneerQuad, 8), '與穹頂光幕旁的先驅搭話', (g) => {
        g.flag('l04_confirmed_deadend', true);
        g.read('n04_pioneer');
      }),
      hit('stay_here', bounds(innerStayQuad, 8), '在這裡待下去', (g) => g.end('dead_end'), 'go'),
      hit('to_wei', bounds(innerToWei, 8), '返回中環・尉遲大道', (g) => g.go('l04_wei'), 'go'),
    ],
  },

  l04_wolf: {
    level: '0.4', title: '狼領', room: wolfRoomOf, quiet: 0.6,
    viewMsg: '觀景窗裡，每次天色泛紅的「層裂變」之後，這塊城外地界都會重新洗過一遍。',
    hazard: (s) => (s.flags.l04_red_sky ? '深紅天色之下，「狼領」正隨時經歷層裂變' : null),
    enter(g, { first }) {
      if (first) g.say('碾城市區以外的開闊荒地。浪人們管整片城外地界都叫「狼領」，只是每次「層裂變」一到，這裡的地貌與留下的東西就會重新改寫。');
    },
    update: l04Update,
    draw(ctx, t, s, R) {
      const hy = P(0, 1, R.depth)[1];
      drawCrimsonSky(ctx, s, hy);
      // Craggy barren wasteland ridge & ruined brick perimeter wall holding Ronin's note
      poly(ctx, [[0, hy + 4], [190, hy - 32], [380, hy - 14], [610, hy - 38], [820, hy - 18], [W, hy + 2]], s.flags.l04_red_sky ? '#3b1e20' : '#35312f');
      const rw = wallQuad(-2.22, -0.48, 1, 1.85, 3.45);
      poly(ctx, rw, '#463f3a');
      for (const my of [-0.15, 0.25, 0.62]) seg(ctx, P(-2.22, my, 1.85), P(-2.22, my, 3.45), 'rgba(26, 22, 20, 0.55)', 1.5);
      ctx.strokeStyle = '#5c534c'; ctx.lineWidth = 2; poly(ctx, rw); ctx.stroke();
      paper(ctx, R, wolfRoninNote, 2.6, '#dedad2');
      const v = l04WolfVariant(s);
      if (v === 0) {
        box(ctx, R, wolfSupplyCrate);
        txt(ctx, s.flags.l04_sup_wolf ? '空物資箱' : '層裂變物資箱', CX([P(-1.15, 0.54, 2.8), P(-0.55, 0.54, 2.8)]), 325, '#e8dfd4', 10);
      } else {
        // Tall eerie wanderer silhouette standing motionless in blowing red dust haze
        poly(ctx, [[452, 355], [462, 228], [498, 228], [508, 355]], 'rgba(22, 12, 14, 0.82)');
        ctx.fillStyle = 'rgba(22, 12, 14, 0.85)';
        ctx.beginPath(); ctx.arc(480, 208, 16, 0, Math.PI * 2); ctx.fill();
        glow(ctx, 480, 260, 85, '#c94048', 0.16);
      }
      poly(ctx, wallQuad(2.22, -0.65, 1, 2.0, 4.0), '#2d3034');
      drawArchSign(ctx, wolfToOuter, '#242629', '#5a5f66', '回外環街道 ▶');
    },
    hotspots: [
      hit('talk_ronin', bounds(wolfRoninNote, 8), '浪人留下的牆縫便條', (g) => g.read('n04_ronin')),
      hit('wolf_crate', boxRect(wolfSupplyCrate, 8), '層裂變後露出的物資箱', (g) => {
        if (once(g, 'l04_sup_wolf')) {
          return g.give('almond', '裂變塵土底下露出一個密封儲物盒，裡頭躺著一瓶完好的杏仁水。');
        }
        g.say('箱子裡只剩層裂變翻出來的碎砂礫——這整座絕路層已經湊齊全部三份補給了。');
      }, 'look', { when: (s) => l04WolfVariant(s) === 0 }),
      hit('wolf_silhouette', wolfSilhouetteRect, '遠處霧裡的陌生剪影', (g) => {
        g.sanity(-3);
        g.say('那個裂變後才出現在城外荒原上的剪影沒有回頭，空氣卻沉得讓人太陽穴隱隱作痛。');
      }, 'look', { when: (s) => l04WolfVariant(s) === 1 }),
      hit('to_outer', bounds(wolfToOuter, 8), '回到外環街道', (g) => g.go('l04_outer'), 'go'),
    ],
  },
};

function CX(pts) { return pts.reduce((a, p) => a + p[0], 0) / pts.length; }
function CY(pts) { return pts.reduce((a, p) => a + p[1], 0) / pts.length; }
