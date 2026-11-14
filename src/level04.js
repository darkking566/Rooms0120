// Level 0.4 "碾城" adapted from HOMESICK's Report V on Backrooms Wiki CN (CC BY-SA 3.0).
// Adopts the pre-incident state of Report V main text (prior to the /weed-toc event).
// Layer-fission timing compression, puzzles, scene text and J.H. notes are original.

import { P, bounds, box, boxRect, faceQuad, paper, poly, seg, wallQuad } from './render.js';
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
  hw: 1.8, depth: 8.5, fogEnd: 13, lights: [2.4, 5.8], flickerLights: [0, 1],
  flick: (t) => (Math.sin(t * 9.1) + Math.sin(t * 21.3) > 1.2 ? 0.45 : 0.92),
});
const weiRoom = room(weiPal, { hw: 2.0, depth: 9, fogEnd: 15, lights: [2.2, 5.2, 7.6] });
const innerRoom = room(innerPal, { hw: 1.8, depth: 8.5, fogEnd: 16, bright: 1.08, lights: [1.8, 4.2, 6.6] });
const wolfRoomOf = (s) => room(s.flags.l04_red_sky ? crimsonWolfPal : wolfPal, {
  hw: 2.2, depth: 9.5, fogEnd: 14, baseboard: false, lights: [],
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

function drawCrimsonSky(ctx, s) {
  if (!s.flags.l04_red_sky) return;
  ctx.save();
  ctx.fillStyle = (s.flags.l04_fission_rem || 0) > 0 ? 'rgba(180, 30, 38, 0.24)' : 'rgba(130, 22, 30, 0.14)';
  ctx.fillRect(0, 0, 960, 250);
  ctx.restore();
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
      drawCrimsonSky(ctx, s);
      for (const z of [2.0, 5.0]) {
        poly(ctx, wallQuad(-1.8, -0.85, 1, z, z + 1.4), '#3d4147');
      }
      box(ctx, R, outerBox);
      poly(ctx, outerToWei, '#2a2d32');
      txt(ctx, '中環・尉遲大道', CX(outerToWei), CY(outerToWei), '#d0d7de', 11);
      poly(ctx, outerToWolf, '#363230');
      txt(ctx, '城外・狼領 →', CX(outerToWolf), CY(outerToWolf), '#dfd2cb', 11);
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
      drawCrimsonSky(ctx, s);
      poly(ctx, weiHunterDoor, '#5c2628');
      txt(ctx, '紅殿（獵手公會）', CX(weiHunterDoor), CY(weiHunterDoor), '#f2d8d8', 11);
      box(ctx, R, weiCrate);
      poly(ctx, weiToInner, '#4b5a68');
      txt(ctx, '內環・鐵穹區', CX(weiToInner), CY(weiToInner), '#e2f4ff', 11);
      poly(ctx, weiToOuter, '#383b40');
      txt(ctx, '← 回外環街道', CX(weiToOuter), CY(weiToOuter), '#cfd6dc', 11);
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
      drawCrimsonSky(ctx, s);
      glow(ctx, 480, 210, 140, '#72c8ff', 0.25);
      poly(ctx, innerDomeBarrier, 'rgba(130, 205, 255, 0.28)');
      ctx.strokeStyle = '#9bdcff'; ctx.lineWidth = 2; poly(ctx, innerDomeBarrier); ctx.stroke();
      poly(ctx, innerPioneerQuad, '#4c5b68');
      txt(ctx, '先驅值班亭', CX(innerPioneerQuad), CY(innerPioneerQuad), '#e6f5ff', 11);
      poly(ctx, innerStayQuad, '#38414a');
      ctx.strokeStyle = '#8fa4b8'; ctx.strokeRect(innerStayQuad[0][0], innerStayQuad[0][1], innerStayQuad[1][0] - innerStayQuad[0][0], innerStayQuad[2][1] - innerStayQuad[0][1]);
      txt(ctx, '在這裡待下去', 480, CY(innerStayQuad), '#d4e2ee', 12);
      poly(ctx, innerToWei, '#464b52');
      txt(ctx, '回尉遲大道 →', CX(innerToWei), CY(innerToWei), '#d8dee4', 11);
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
      drawCrimsonSky(ctx, s);
      paper(ctx, R, wolfRoninNote, 2.6, '#dedad2');
      const v = l04WolfVariant(s);
      if (v === 0) {
        box(ctx, R, wolfSupplyCrate);
        txt(ctx, s.flags.l04_sup_wolf ? '空物資箱' : '層裂變物資箱', CX([P(-1.15, 0.54, 2.8), P(-0.55, 0.54, 2.8)]), 325, '#e8dfd4', 10);
      } else {
        ctx.fillStyle = 'rgba(28, 18, 20, 0.72)';
        ctx.beginPath(); ctx.ellipse(480, 275, 22, 68, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(480, 198, 15, 0, Math.PI * 2); ctx.fill();
      }
      poly(ctx, wolfToOuter, '#44464a');
      txt(ctx, '回外環街道 →', CX(wolfToOuter), CY(wolfToOuter), '#dce2e8', 11);
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
