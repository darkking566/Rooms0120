// Level 0.5 "Drenched Sanatorium" (FuneralBouncer, CC BY-SA 3.0). Puzzles, scene text and J.H. notes are original.
import { P, bounds, box, boxRect, faceQuad, paper, poly, seg, shade, wallQuad } from '../render.js';
import { back, clockOf, glow, hit, once, pal, room, txt } from './sublevel-kit.js';

// =====================================================================
// LEVEL 0.5 — Drenched Sanatorium
// Below a blackout zone in Level 0: knee-deep brown water, sparking blue lamps, an echo that hurts.
// Then a rotting hospital, and the Drowned: slow, tireless, always knows where you are — and
// dissolves the moment it touches water.
// =====================================================================
const flood = pal('#b9ad86', '#2f3638', '#2a2619', '#05090a', '#79c4ff');
const planks = pal('#5d4b34', '#26231f', '#2a2619', '#050605', '#79c4ff');
const ward = pal('#8a9384', '#4d554e', '#3c3e31', '#0a0f0d', '#d4dcc0');
const wardFlick = (t) => (Math.sin(t * 11.7) + Math.sin(t * 3.3 + 2) > 1.7 ? 0.45 : 1);
function water(ctx, R, t, y = 0.55, hw = 1.2, D = 8) {
  const q = [P(-hw, y, 1), P(hw, y, 1), P(hw, y, D), P(-hw, y, D)];
  ctx.save(); poly(ctx, q, 'rgba(48,40,22,0.93)'); ctx.clip();
  for (let i = 0; i < 40; i++) {
    const z = 1.2 + ((i * 0.53 + t * 0.15) % (D - 1.2));
    const x = -hw + ((i * 0.71) % (hw * 2)), p = P(x, y, z), w = 60 / z;
    seg(ctx, [p[0] - w, p[1]], [p[0] + w, p[1]], i % 4 ? 'rgba(110,98,62,0.45)' : 'rgba(150,170,190,0.35)', 1);
  }
  // oily sheen
  for (let i = 0; i < 9; i++) {
    const z = 1.6 + (i * 0.8) % (D - 2), x = -0.9 + ((i * 0.63) % 1.8), p = P(x, y, z), r = 70 / z;
    const gr = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
    gr.addColorStop(0, 'rgba(180,120,200,0.18)'); gr.addColorStop(0.5, 'rgba(110,190,160,0.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr; ctx.save(); ctx.translate(p[0], p[1]); ctx.scale(1, 0.25); ctx.translate(-p[0], -p[1]);
    ctx.fillRect(p[0] - r, p[1] - r, r * 2, r * 2); ctx.restore();
  }
  ctx.restore();
  // a dark band where the walls go under
  for (const s of [-1, 1]) poly(ctx, wallQuad(s * hw, y, y + 0.03, 1, D), 'rgba(20,16,8,0.7)');
}
function blueLamp(ctx, x, y, z, t, k = 1, spark = false) {
  const top = P(x, -1, z), p = P(x, y, z), w = 90 / z, h = 14 / z;
  seg(ctx, top, p, '#121516', Math.max(1, 3 / z));
  const on = spark ? Math.random() < 0.5 : Math.sin(t * 7 + z * 3) > -0.9;
  ctx.fillStyle = on ? '#9fd8ff' : '#1d3440'; ctx.fillRect(p[0] - w / 2, p[1], w, h);
  if (on) glow(ctx, p[0], p[1] + h, 160 / z * k, 'rgba(110,190,255,0.45)');
  if (spark) for (let i = 0; i < 6; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * 30;
    seg(ctx, [p[0], p[1] + h], [p[0] + Math.cos(a) * r, p[1] + h + Math.abs(Math.sin(a)) * r], '#fff6b0', 1.5);
  }
}
function peel(ctx, R, D) {
  for (let i = 0; i < 14; i++) {
    const s = i % 2 ? 1 : -1, z = 1.5 + (i * 0.57) % (D - 2), y = -0.6 + ((i * 0.37) % 0.6);
    const a = P(s * 1.2, y, z), b = P(s * 1.2, y, z + 0.25), c = P(s * (1.2 - 0.12), y + 0.45, z + 0.12);
    poly(ctx, [a, b, c], shade(R, '#d8cfaa', z, 0.9));
    poly(ctx, wallQuad(s * 1.2, y, y + 0.3, z, z + 0.25), shade(R, '#6c5f45', z, 0.8));
  }
}
export function drawDrowned(ctx, x, y, s, t, a = 1) {
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s);
  // legs: a puddle sliding along the floor
  ctx.fillStyle = 'rgba(40,62,52,0.95)';
  ctx.beginPath(); ctx.ellipse(0, 0, 60 + Math.sin(t * 3) * 4, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.shadowColor = 'rgba(140,180,160,0.6)'; ctx.shadowBlur = 16;
  ctx.fillStyle = 'rgba(52,78,66,0.92)';
  ctx.beginPath();
  ctx.moveTo(-34, -4); ctx.bezierCurveTo(-40, -60, -30, -110, -18, -130); ctx.lineTo(20, -132);
  ctx.bezierCurveTo(32, -110, 42, -60, 36, -4); ctx.closePath(); ctx.fill();
  // arms reaching
  ctx.strokeStyle = 'rgba(58,86,72,0.92)'; ctx.lineWidth = 13; ctx.lineCap = 'round';
  const r = Math.sin(t * 1.5) * 6;
  ctx.beginPath(); ctx.moveTo(-20, -115); ctx.quadraticCurveTo(-62, -95 + r, -72, -60 + r); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(22, -115); ctx.quadraticCurveTo(64, -98 - r, 76, -66 - r); ctx.stroke();
  // a face that has slid down on one side
  ctx.fillStyle = 'rgba(66,96,82,0.95)';
  ctx.beginPath(); ctx.ellipse(2, -150, 24, 30, 0.25, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = '#0a1612';
  ctx.beginPath(); ctx.ellipse(-8, -158, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(10, -150, 4, 5, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(4, -134, 9, 4 + Math.abs(Math.sin(t * 2)) * 3, 0.3, 0, Math.PI * 2); ctx.fill();
  // drips
  ctx.fillStyle = 'rgba(70,100,86,0.8)';
  for (let i = 0; i < 4; i++) { const d = ((t * 40 + i * 30) % 120); ctx.fillRect(-30 + i * 20, -100 + d, 3, 6); }
  ctx.restore();
}
function huntTick(g, dt) {
  const f = g.s.flags;
  if (!f.l05_hunted || f.l05_dissolved) return;
  f.l05_pursuit = (f.l05_pursuit || 0) + dt;
  if (f.l05_pursuit >= 15) {
    f.l05_pursuit = 5; g.sfx('groan');
    g.scare('l05_platform', '濕冷的手臂從背後勒住你，滿嘴都是泥水的味道。你拚命掙脫，一路跑回積水邊的平台——它還在後面，咕嚕咕嚕地響。', 16, 'drowned');
  }
}
const huntLabel = (s) => (s.flags.l05_hunted && !s.flags.l05_dissolved ? '溺屍在追你・停下來它就會追上' : null);
function chaseStep(g) {
  const f = g.s.flags;
  if (f.l05_hunted && !f.l05_dissolved) f.l05_pursuit = Math.max(0, (f.l05_pursuit || 0) - 4);
}
function drawChaser(ctx, s, t) {
  if (!s.flags.l05_hunted || s.flags.l05_dissolved) return;
  const p = Math.min(1, (s.flags.l05_pursuit || 0) / 15);
  const z = 7 - p * 5, f = P(-0.2, 1, z);
  drawDrowned(ctx, f[0], f[1], 3.2 / z, t, 0.55 + p * 0.45);
}
function dissolve(g) {
  g.flag('l05_dissolved'); g.flag('l05_hunted', false); g.flag('l05_pursuit', 0); g.sfx('steam');
}

const floodR = room(flood, { hw: 1.2, depth: 8, stripes: true, lights: [], baseboard: false });
const diaryQ = [P(-0.75, 0.55, 2.2), P(-0.4, 0.55, 2.2), P(-0.4, 0.55, 2.7), P(-0.75, 0.55, 2.7)];
const planksR = room(planks, { hw: 1.2, depth: 7, lights: [], baseboard: false, wallTex: 'concrete' });
const cart = { x1: -1.15, x2: -0.55, y1: 0.15, y2: 0.55, z1: 2.4, z2: 3.2, color: '#9a9488', top: '#b6b0a2', edge: true };
const sparkCycle = (s) => clockOf(s) % 3.2;
export const sparking = (s) => sparkCycle(s) < 1.2;
const platformR = room(flood, { hw: 1.2, depth: 7, stripes: true, lights: [], baseboard: false });
const platformTop = { x1: -1.2, x2: 1.2, y1: 0.25, y2: 0.6, z1: 3.2, z2: 7, color: '#7c7a6e', top: '#8f8d80' };
const wardDoors = faceQuad(-0.6, -0.7, 0.6, 0.25, 7);
const wardR = room(ward, { hw: 1.5, depth: 6, wallTex: 'concrete', floorTex: 'concrete', lights: [2, 4], flick: wardFlick, flickerLights: [1] });
const beds = [
  { x1: -1.5, x2: -0.8, y1: 0.5, y2: 0.7, z1: 1.8, z2: 3.0, color: '#b8b49a', top: '#c9c3a2', edge: true },
  { x1: 0.8, x2: 1.5, y1: 0.5, y2: 0.7, z1: 2.2, z2: 3.4, color: '#b8b49a', top: '#c9c3a2', edge: true },
  { x1: -1.5, x2: -0.8, y1: 0.5, y2: 0.7, z1: 3.8, z2: 5.0, color: '#a49f86', top: '#b5ae8e', edge: true },
];
const medCart = { x1: 0.85, x2: 1.35, y1: 0.35, y2: 1, z1: 4.0, z2: 4.5, color: '#9aa39c', top: '#b9c2bb', edge: true };
const corridorR = room(ward, { hw: 1.2, depth: 8, wallTex: 'concrete', floorTex: 'concrete', lights: [2.2, 5], flick: wardFlick, flickerLights: [0] });
const stairsR = room(ward, { hw: 1.2, depth: 5, lights: [2.2], wallTex: 'concrete' });

function bottleIcon(ctx, x, y) {
  ctx.fillStyle = '#e9e1c1'; ctx.fillRect(x - 5, y - 18, 10, 16); ctx.fillRect(x - 2, y - 24, 4, 6);
  ctx.fillStyle = '#3f6fb0'; ctx.fillRect(x - 3, y - 26, 6, 3);
}

export const L05_SCENES = {
  l05_flood: {
    level: '0.5', title: '浸濡通道', room: floodR, quiet: 1.35,
    enter(g, { first }) {
      if (g.s.flags.l05_hunted && !g.s.flags.l05_dissolved) {
        dissolve(g);
        return g.say('你跳進積水。溺屍跟著滑了下來——碰到水的那一刻，它發出一聲尖叫，散成一團濃稠的糊，沉了下去。四周只剩回音。');
      }
      if (first) g.say('樓梯沒入水裡。污水漫到膝蓋，又冷又稠，水面浮著一層油光。藍色的燈吊在破電線下，時不時迸出火花。每一步的水聲都在走廊裡來回撞，撞得你耳朵發疼。');
    },
    draw(ctx, t, s, R) {
      peel(ctx, R, 8);
      water(ctx, R, t);
      for (const z of [2.2, 4.2, 6.4]) blueLamp(ctx, 0.15 - (z % 2) * 0.2, -0.5, z, t);
      if (!s.flags.l05_diary) paper(ctx, R, diaryQ, 2.4, '#cfc6a0');
    },
    hotspots: [
      back('l0_low', '爬回樓梯，回到 Level 0', '你爬上台階，在黑暗裡摸著牆走了很久，直到看見那間低矮房間的燈光。'),
      hit('forward', [400, 200, 160, 150], '蹚著水往前走', (g) => { chaseStep(g); g.go('l05_planks'); }, 'go'),
      hit('drink', [130, 390, 190, 70], '捧起水來喝', (g) => {
        g.drink(18); g.sfx('drink');
        const n = (g.s.flags.l05_sick || 0) + 1; g.flag('l05_sick', n);
        g.sanity(-10); g.eat(-12);
        g.say(n === 1 ? '水是溫的，有一股化學品的味道。你喝了幾口——然後跪在水裡吐了出來。喉嚨還是乾的，胃卻翻了過來。' : '你又喝了。你知道會怎樣。你還是喝了。');
      }),
      { ...hit('diary', bounds(diaryQ, 10), '漂在水上的紙', (g) => { g.flag('l05_diary'); g.read('n05_diary'); }), when: (s) => !s.flags.l05_diary },
    ],
  },

  l05_planks: {
    level: '0.5', title: '腐朽的木牆', room: planksR, quiet: 1.35,
    enter(g, { first }) {
      if (g.s.flags.l05_hunted && !g.s.flags.l05_dissolved) {
        dissolve(g);
        return g.say('你跳下平台，落進積水。溺屍跟著你滑了下來——一碰到水，它就尖叫著化成了糊。水面冒了幾個泡，然後一切安靜了。');
      }
      if (first) g.say('牆紙不見了，露出一片一片泡爛的木板。一台零食推車半沉在水裡。前面有一盞燈垂得特別低，幾乎碰到水面，在劈啪作響。');
    },
    draw(ctx, t, s, R) {
      for (const sd of [-1, 1]) for (let y = -0.9; y < 0.6; y += 0.18) seg(ctx, P(sd * 1.2, y, 1), P(sd * 1.2, y, 7), shade(R, '#2a2016', 3, 1, 0.7), 1.5);
      for (const sd of [-1, 1]) for (let z = 1.5; z < 7; z += 1.3) poly(ctx, wallQuad(sd * 1.2, -0.2 + (z % 1) * 0.3, 0.2 + (z % 1) * 0.3, z, z + 0.3), shade(R, '#1a140c', z));
      water(ctx, R, t, 0.55, 1.2, 7);
      box(ctx, R, cart);
      if (!s.flags.l05_bar) for (let i = 0; i < 3; i++) { const p = P(-1.05 + i * 0.16, 0.15, 2.6); ctx.fillStyle = ['#d8452a', '#2a7ad8', '#e8c82a'][i]; ctx.fillRect(p[0], p[1] - 14, 12, 14); }
      for (const z of [5.5]) blueLamp(ctx, 0, -0.55, z, t);
      const sw = Math.sin(clockOf(s) * 1.9) * 0.15;
      blueLamp(ctx, sw, 0.25, 3.4, t, 1.3, sparking(s));
      if (sparking(s)) glow(ctx, P(sw, 0.55, 3.4)[0], P(sw, 0.55, 3.4)[1], 120, 'rgba(160,220,255,0.5)');
    },
    hotspots: [
      back('l05_flood', '回到樓梯那邊'),
      { ...hit('cart', boxRect(cart, 6), '零食推車', (g) => {
        if (!once(g, 'l05_bar')) return g.say('推車上只剩泡爛的包裝紙。');
        g.give('bar', '大部分的零食都泡爛了。只有一條能量棒還封著口。');
      }, 'take') },
      hit('lamp', [430, 290, 100, 60], '垂到水面的燈', (g) => g.say(sparking(g.s) ? '燈在劈啪作響，火花一直落到水面上。現在走過去，等於把腿泡在電線裡。' : '燈暫時安靜了。它晃得很慢，一陣一陣地迸火花。')),
      hit('forward', [400, 180, 160, 100], '從燈底下穿過去', (g) => {
        if (sparking(g.s)) {
          g.sanity(-12); g.sfx('error');
          return g.say('你剛邁出一步，燈就劈啪一聲——電流順著水竄上你的腿，你整個人僵住，再跌回來。等它安靜下來再走。');
        }
        chaseStep(g); g.go('l05_platform', { msg: '你趁燈暗下去的空檔蹚了過去。身後又是一陣劈啪聲。' });
      }, 'go'),
    ],
  },

  l05_platform: {
    level: '0.5', title: '乾燥的平台', room: platformR, hazard: huntLabel, update: huntTick,
    enter(g, { first }) {
      if (g.s.flags.l05_hunted && !g.s.flags.l05_dissolved) return g.say('它就在你後面，從醫院的門裡滑出來。腳下就是水。');
      if (first) g.say('走廊盡頭，一座水泥平台從水裡升起來。台階上去是兩扇雙開門，門上有圓窗，窗後是醫院的走廊。終於可以把腳從水裡拔出來了。');
    },
    draw(ctx, t, s, R) {
      water(ctx, R, t, 0.55, 1.2, 3.3);
      box(ctx, R, platformTop);
      for (let i = 0; i < 3; i++) box(ctx, R, { x1: -0.6, x2: 0.6, y1: 0.55 - i * 0.1, y2: 0.65 - i * 0.1, z1: 3.0 + i * 0.1, z2: 3.1 + i * 0.1, color: '#7c7a6e', top: '#97958a' });
      poly(ctx, wardDoors, shade(R, '#6c7a70', 7)); seg(ctx, P(0, -0.7, 7), P(0, 0.25, 7), '#1a201c', 2);
      for (const x of [-0.3, 0.3]) { const c = P(x, -0.35, 7); ctx.fillStyle = 'rgba(210,230,190,0.5)'; ctx.beginPath(); ctx.arc(c[0], c[1], 6, 0, Math.PI * 2); ctx.fill(); }
      const sg = P(0, -0.85, 7); txt(ctx, '病房 WARD', sg[0], sg[1], shade(R, '#c8d0b8', 7), 10);
      blueLamp(ctx, -0.3, -0.5, 2.4, t); blueLamp(ctx, 0.3, -0.45, 5.2, t);
      drawChaser(ctx, s, t);
    },
    hotspots: [
      { ...back('l05_planks', '退回水裡'), click: (g) => g.go('l05_planks') },
      hit('forward', bounds(wardDoors, 6), '推開醫院的門', (g) => {
        if (g.s.flags.l05_hunted && !g.s.flags.l05_dissolved) return g.say('它就是從那扇門裡出來的。往回跑，等於迎面撞上它。');
        g.go('l05_ward');
      }, 'go'),
      { ...hit('jump', [150, 400, 660, 60], '跳回水裡，讓它跟過來', (g) => g.go('l05_planks')), when: (s) => s.flags.l05_hunted && !s.flags.l05_dissolved },
    ],
  },

  l05_ward: {
    level: '0.5', title: '病房', room: wardR, hazard: huntLabel, update: huntTick,
    enter(g, { first }) {
      chaseStep(g);
      if (first) g.say('一股腐肉的味道。地板油膩膩的，吊頂歪歪斜斜地垂下來。可是——有床。床墊是濕的，有一股樟脑丸味，但那是床。你已經記不清上一次闔眼是什麼時候了。');
    },
    draw(ctx, t, s, R) {
      for (let i = 0; i < 5; i++) {
        const z = 1.6 + i * 0.9, tilt = ((i * 37) % 7) / 20;
        poly(ctx, [P(-0.4 + i * 0.1, -1, z), P(0.2 + i * 0.1, -1 + tilt, z + 0.1), P(0.2 + i * 0.1, -1 + tilt + 0.05, z + 0.6), P(-0.4 + i * 0.1, -1, z + 0.5)], shade(R, '#9aa294', z, 0.8));
      }
      poly(ctx, [P(-1.5, 1, 1), P(1.5, 1, 1), P(1.5, 1, 6), P(-1.5, 1, 6)], 'rgba(120,110,60,0.12)');
      for (const b of beds) {
        box(ctx, R, b);
        const st = P((b.x1 + b.x2) / 2, b.y1, (b.z1 + b.z2) / 2); ctx.fillStyle = 'rgba(110,90,40,0.35)'; ctx.beginPath(); ctx.ellipse(st[0], st[1], 30 / b.z1 * 2, 6, 0, 0, Math.PI * 2); ctx.fill();
        for (const z of [b.z1, b.z2]) for (const x of [b.x1, b.x2]) seg(ctx, P(x, b.y2, z), P(x, 1, z), shade(R, '#5a5e58', z), 2);
      }
      box(ctx, R, medCart);
      if (!s.flags.l05_med) { const m = P(1.1, 0.35, 4.1); bottleIcon(ctx, m[0], m[1]); }
      poly(ctx, faceQuad(-0.5, -0.6, 0.5, 1, 6), '#14140f');
      drawChaser(ctx, s, t);
    },
    hotspots: [
      back('l05_platform', '回到平台'),
      hit('bed', boxRect(beds[0], 6), '躺到床上', (g) => {
        const f = g.s.flags;
        if (f.l05_hunted && !f.l05_dissolved) return g.say('它就在門口，咕嚕咕嚕地響。現在躺下去，就再也起不來了。');
        if (!f.l05_rested) {
          g.flag('l05_rested'); g.sanity(10);
          g.flag('l05_hunted'); g.flag('l05_pursuit', 4); g.sfx('groan');
          return g.say('你一躺下就睡著了。醒來時，房間裡多了一個聲音：咕嚕、咕嚕。門口站著一個人形的東西，像一團凝膠，臉往一邊垂。它朝你伸出手。');
        }
        if (!once(g, 'l05_slept')) return g.say('你又躺了一會兒。床墊還是濕的。');
        g.sanity(20); g.checkpoint();
        g.say('這一次，沒有咕嚕聲。你把濕透的床墊翻過來，睡了很久很久。夢裡你在家，水龍頭沒關緊。');
      }),
      { ...hit('cart', boxRect(medCart, 6), '藥品推車', (g) => {
        if (!once(g, 'l05_med')) return g.say('推車上只剩空藥瓶和發霉的紗布。');
        g.give('almond', '推車最下層塞著一瓶杏仁水。瓶身上貼著醫院的標籤，寫著一個你看不懂的床號。');
      }, 'take') },
      hit('forward', bounds(faceQuad(-0.5, -0.6, 0.5, 1, 6), 4), '走進醫院深處', (g) => { chaseStep(g); g.go('l05_corridor'); }, 'go'),
    ],
  },

  l05_corridor: {
    level: '0.5', title: '醫院走廊', room: corridorR, hazard: huntLabel, update: huntTick,
    enter(g, { first }) {
      chaseStep(g);
      if (first) g.say('走廊很長。瓦礫從塌下來的吊頂一路堆到地上，只留下一道窄縫。腐肉的味道是從前面傳來的。');
    },
    draw(ctx, t, s, R) {
      for (let i = 0; i < 9; i++) {
        const x = -0.9 + ((i * 0.43) % 1.6), z = 3.2 + (i % 3) * 0.3, sz = 0.18 + (i % 4) * 0.06;
        box(ctx, R, { x1: x, x2: x + sz * 1.5, y1: 1 - sz - (i % 2) * 0.2, y2: 1, z1: z, z2: z + sz, color: i % 2 ? '#6c6a5c' : '#5a5848', edge: true });
      }
      box(ctx, R, { x1: 0.2, x2: 1.2, y1: -0.2, y2: 1, z1: 3.6, z2: 4.2, color: '#4e4c40', edge: true });
      for (let i = 0; i < 6; i++) { const a = t * 3 + i, p = P(Math.sin(a) * 0.4, -0.3 + Math.cos(a * 1.3) * 0.2, 3); ctx.fillStyle = '#111'; ctx.fillRect(p[0], p[1], 2, 2); }
      drawChaser(ctx, s, t);
    },
    hotspots: [
      back('l05_ward', '回到病房'),
      hit('rubble', [500, 200, 160, 230], '瓦礫堆', (g) => g.say('混凝土塊、扭彎的鐵架、一隻鞋。味道是從瓦礫底下傳出來的。你沒有去翻。')),
      hit('forward', [370, 200, 120, 150], '從瓦礫的窄縫鑽過去', (g) => {
        const f = g.s.flags;
        if (!f.l05_rested) return g.say('你試著往縫裡擠，手腳卻軟得使不上力。你已經好幾天沒睡了。先找張床。');
        if (f.l05_hunted && !f.l05_dissolved) {
          chaseStep(g);
          return g.go('l05_platform', { msg: '你鑽過瓦礫，沿著走廊一直跑、一直跑——盡頭又是那座平台，平台下又是那片積水，像這一層在跟你開一個很爛的玩笑。它還在後面。' });
        }
        g.go('l05_stairs', { msg: '你沿著走廊走了很久。牆上的油漆換了顏色，門牌上的字變得陌生——醫院好像在不知不覺間變成了別的地方。然後你看見了樓梯。' });
      }, 'go'),
    ],
  },

  l05_stairs: {
    level: '0.5', title: '金屬格柵樓梯', room: stairsR,
    enter(g, { first }) { if (first) g.say('一道金屬格柵樓梯往下延伸。底下吹上來的風又冷又乾，很安靜——安靜得像停車場。'); },
    draw(ctx, t, s, R) {
      for (let i = 0; i < 9; i++) {
        const y = 300 + i * 24, w = 90 + i * 40;
        ctx.fillStyle = i % 2 ? '#5d6865' : '#3a4846'; ctx.fillRect(480 - w / 2, y, w, 16);
        for (let x = 480 - w / 2; x < 480 + w / 2; x += 10) seg(ctx, [x, y], [x, y + 16], '#1d2b29', 2);
      }
      seg(ctx, [400, 300], [180, 520], '#7c8a86', 5); seg(ctx, [560, 300], [780, 520], '#7c8a86', 5);
      const pool = [P(0.6, 1, 2.0), P(1.2, 1, 2.0), P(1.2, 1, 3.4), P(0.6, 1, 3.4)];
      poly(ctx, pool, 'rgba(120,200,220,0.35)'); glow(ctx, bounds(pool)[0] + 40, bounds(pool)[1] + 20, 60, 'rgba(140,220,240,0.3)');
      txt(ctx, 'P1', 480, 280, '#9bb5a8', 18);
    },
    hotspots: [
      back('l05_corridor', '回到醫院走廊'),
      hit('pool', [620, 345, 150, 65], '樓梯旁一窪清澈的水', (g) => g.say('格柵底下有一窪很清的水，溫溫的，有一股游泳池的氯味。水底看不見盡頭。你盯著它看了很久，最後還是沒有下去。')),
      hit('forward', [380, 290, 200, 120], '下樓', (g) => { g.flag('l1_via_flood'); g.flag('l1_fresh', 'flood'); g.go('l1_arrive', { msg: '你走下格柵樓梯，雙膝一軟跪在冰冷的水泥地上。很安靜，很冷，很乾。你在那裡跪了很久，才想起來要呼吸。' }); }, 'go'),
    ],
  },
};
