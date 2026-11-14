// Level 0.3 "Ice Rooms" (CursedSliver, CC BY-SA 3.0). Puzzles, scene text and J.H. notes are original.
import { H, P, W, bounds, box, boxRect, faceQuad, paper, poly, seg, shade, wallQuad } from '../render.js';
import { pick } from '../rng.js';
import { back, clockOf, glow, hit, once, outline, pal, room, txt } from './sublevel-kit.js';

// =====================================================================
// LEVEL 0.3 — Ice Rooms
// Level 0, frozen. Vents breathe cold fog and hop from place to place. Task Force 104-CX was sent to
// make the rooms "clean, tidy, comfortable and warm". Their last report stops mid-sentence.
// =====================================================================
const ice = pal('#b9b896', '#d3dad6', '#8f9c97', '#17232c', '#eaf7ff');
const warmPal = pal('#d6bd70', '#e6dbb0', '#8e5634', '#3a2812', '#fff0c4');
export function frostOverlay(ctx, t, s, strength = 1) {
  const k = (s.flags.l03_sealed ? 0.55 : 1) * strength;
  ctx.save();
  // frost creeping in from the edges of your vision
  const gr = ctx.createRadialGradient(480, 270, 180, 480, 270, 560);
  gr.addColorStop(0, 'rgba(200,235,255,0)'); gr.addColorStop(1, `rgba(215,240,255,${0.55 * k})`);
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = `rgba(235,250,255,${0.35 * k})`; ctx.lineWidth = 1;
  for (let i = 0; i < 26; i++) {
    const corner = i % 4, x0 = corner % 2 ? W : 0, y0 = corner < 2 ? 0 : H;
    const a = (i * 0.61) % (Math.PI / 2), len = 40 + (i * 37) % 90;
    const dx = corner % 2 ? -1 : 1, dy = corner < 2 ? 1 : -1;
    const ex = x0 + dx * Math.cos(a) * len, ey = y0 + dy * Math.sin(a) * len;
    seg(ctx, [x0, y0], [ex, ey], ctx.strokeStyle, 1);
    seg(ctx, [(x0 + ex) / 2, (y0 + ey) / 2], [(x0 + ex) / 2 + dx * 14, (y0 + ey) / 2 + dy * 4], ctx.strokeStyle, 1);
  }
  // drifting fog
  for (let i = 0; i < 7; i++) {
    const x = ((i * 173 + t * (14 + i * 3)) % (W + 300)) - 150, y = 330 + (i * 41) % 170;
    const f = ctx.createRadialGradient(x, y, 0, x, y, 140);
    f.addColorStop(0, `rgba(225,240,250,${0.13 * k})`); f.addColorStop(1, 'rgba(225,240,250,0)');
    ctx.fillStyle = f; ctx.fillRect(x - 140, y - 140, 280, 280);
  }
  ctx.restore();
}
function icicles(ctx, R, D, seed = 1) {
  for (let i = 0; i < 22; i++) {
    const x = -1.1 + ((i * 0.37 * seed) % 2.2), z = 1.4 + ((i * 1.31) % (D - 1.6));
    const len = 0.08 + ((i * 7) % 5) * 0.04;
    const a = P(x - 0.03, -1, z), b = P(x + 0.03, -1, z), c = P(x, -1 + len, z);
    poly(ctx, [a, b, c], shade(R, '#e6f6ff', z, 1.1, 0.85));
  }
}
function fogJet(ctx, x, y, dirX, dirY, t, k = 1) {
  for (let i = 0; i < 6; i++) {
    const p = ((t * 0.9 + i / 6) % 1);
    const px = x + dirX * p * 120, py = y + dirY * p * 120, r = 12 + p * 50;
    const f = ctx.createRadialGradient(px, py, 0, px, py, r);
    f.addColorStop(0, `rgba(235,248,255,${0.32 * (1 - p) * k})`); f.addColorStop(1, 'rgba(235,248,255,0)');
    ctx.fillStyle = f; ctx.fillRect(px - r, py - r, r * 2, r * 2);
  }
}
function grille(ctx, pts, color, slats = 5) {
  poly(ctx, pts, '#1d2a30');
  const [a, b, c, d] = pts;
  for (let i = 1; i < slats; i++) {
    const k = i / slats;
    seg(ctx, [a[0] + (d[0] - a[0]) * k, a[1] + (d[1] - a[1]) * k], [b[0] + (c[0] - b[0]) * k, b[1] + (c[1] - b[1]) * k], color, 2);
  }
  outline(ctx, pts, color, 2);
}
// translucent ice block with something inside it
function iceBox(ctx, R, b, alpha = 0.55) {
  const { x1, x2, y1, y2, z1, z2 } = b;
  const face = faceQuad(x1, y1, x2, y2, z1);
  ctx.save();
  if (x1 > 0) poly(ctx, wallQuad(x1, y1, y2, z1, z2), `rgba(170,215,235,${alpha * 0.8})`);
  if (x2 < 0) poly(ctx, wallQuad(x2, y1, y2, z1, z2), `rgba(170,215,235,${alpha * 0.8})`);
  if (y1 < 0) poly(ctx, [P(x1, y1, z1), P(x2, y1, z1), P(x2, y1, z2), P(x1, y1, z2)], `rgba(220,240,250,${alpha})`);
  poly(ctx, face, `rgba(185,225,240,${alpha})`);
  outline(ctx, face, 'rgba(240,252,255,0.8)', 2);
  const [fx, fy, fw, fh] = bounds(face);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(fx + fw * (0.1 + i * 0.2), fy + 4); ctx.lineTo(fx + fw * (0.2 + i * 0.17), fy + fh * (0.3 + (i % 3) * 0.2)); ctx.stroke(); }
  ctx.restore();
}
function worker(ctx, x, y, h, a = 0.8, name = '', turned = false) {
  const w = h * 0.24;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = '#23333b'; ctx.fillRect(x - w * 0.3, y - h * 0.45, w * 0.24, h * 0.45); ctx.fillRect(x + w * 0.06, y - h * 0.45, w * 0.24, h * 0.45);
  ctx.fillStyle = '#c8641e'; ctx.fillRect(x - w * 0.5, y - h * 0.82, w, h * 0.4);
  ctx.fillStyle = '#e8e070'; ctx.fillRect(x - w * 0.5, y - h * 0.62, w, h * 0.04);
  ctx.fillStyle = '#2e3d44'; ctx.beginPath(); ctx.ellipse(x, y - h * 0.9, w * 0.26, h * 0.08, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e2b52a'; ctx.beginPath(); ctx.ellipse(x, y - h * 0.95, w * 0.32, h * 0.05, 0, Math.PI, 0); ctx.fill();
  if (turned) { ctx.fillStyle = '#d8eef5'; ctx.fillRect(x - w * 0.14, y - h * 0.91, w * 0.08, h * 0.02); ctx.fillRect(x + w * 0.06, y - h * 0.91, w * 0.08, h * 0.02); }
  if (name) txt(ctx, name, x, y - h * 0.96, '#3a2a10', Math.max(7, h * 0.035));
  ctx.restore();
}
function coldTick(g, dt) {
  const f = g.s.flags;
  if (f.l03_done) return;
  f.l03_cold = (f.l03_cold || 0) + dt * (f.l03_sealed ? 0.5 : 1);
  if (f.l03_cold >= 2.5) { f.l03_cold -= 2.5; g.sanity(-1); }
}
const coldLabel = (s) => s.flags.l03_sealed ? '冷霧減弱了・仍然很冷' : '寒氣刺骨・冷霧不斷從通風口湧出';

// entry: a yellow room gone white
const iceEntryR = room(ice, { hw: 1.2, depth: 6, stripes: true, floorTex: 'carpet', tiles: true, lights: [1.8, 3.8] });
const entryBlock = { x1: 0.3, x2: 1.2, y1: -0.65, y2: 1, z1: 3.2, z2: 4.6 };
const ceilVent = [P(-0.35, -1, 2.2), P(0.35, -1, 2.2), P(0.35, -1, 2.8), P(-0.35, -1, 2.8)];

// 104-CX's work site
const campR = room(ice, { hw: 1.5, depth: 5.5, stripes: true, tiles: true, lights: [1.8, 3.6], openings: [{ side: -1, z1: 3.5, z2: 4.5, top: -0.6 }] });
const iceWall = faceQuad(-0.65, -0.75, 0.65, 1, 5.5);
const rugRoll = { x1: -1.45, x2: -0.75, y1: 0.68, y2: 1, z1: 2.0, z2: 2.4, color: '#8a3a2a', top: '#a5503a' };
const heaterBox = { x1: 0.8, x2: 1.35, y1: 0.45, y2: 1, z1: 2.3, z2: 2.8, color: '#c8641e', top: '#d8783a', edge: true };
const toolbox = { x1: -0.3, x2: 0.35, y1: 0.78, y2: 1, z1: 2.1, z2: 2.45, color: '#b33a2a', top: '#c8503a', edge: true };
const clipboard = wallQuad(-1.5, -0.45, 0.05, 2.6, 3.2);
const radioQ = faceQuad(-0.25, 0.62, -0.05, 0.78, 2.1);

// the vent room: one live vent that will not stay put
const ventsR = room(ice, { hw: 1.3, depth: 4, wallTex: 'concrete', floorTex: 'concrete', lights: [2.2], baseboard: false });
const VENTS = [
  [P(-0.3, -1, 2.0), P(0.3, -1, 2.0), P(0.3, -1, 2.6), P(-0.3, -1, 2.6)],
  wallQuad(-1.3, -0.8, -0.45, 1.9, 2.7),
  wallQuad(1.3, -0.8, -0.45, 2.3, 3.1),
  faceQuad(-0.35, -0.82, 0.35, -0.52, 4),
  wallQuad(1.3, 0.42, 0.85, 1.7, 2.4),
];
const VENT_LOW = 4;
const VENT_SEQ = [0, 3, 4, 1, 2, 4, 3, 0, 4, 2];
const VENT_DIR = [[0, 1], [1, 0.4], [-1, 0.4], [0, 0.6], [-1, -0.2]];
let ventState = { flags: {}, clock: 0 };
export const ventAt = (s) => (s.flags.l03_sealed ? VENT_LOW : VENT_SEQ[Math.floor(clockOf(s) / 2.4) % VENT_SEQ.length]);

// the block room
const blocksR = room(ice, { hw: 1.6, depth: 5, tiles: true, lights: [1.8, 3.6], stripes: true });
const blockA = { x1: -1.55, x2: -0.55, y1: -0.7, y2: 1, z1: 2.1, z2: 3.1 };
const blockB = { x1: 0.6, x2: 1.55, y1: -0.45, y2: 1, z1: 2.5, z2: 3.5 };
const backIce = faceQuad(-0.8, -0.85, 0.8, 1, 5);

// the finished room (safe)
const warmR = room(warmPal, { hw: 1.3, depth: 5, stripes: true, floorTex: 'carpet', tiles: true, lights: [1.8, 3.6] });
const chairs = [-0.75, -0.25, 0.25, 0.75].map((x) => ({ x, z: 3.6 }));
const finalPrint = faceQuad(-0.35, -0.55, 0.15, -0.05, 5);
const warmExit = wallQuad(1.3, -0.65, 1, 2.2, 3.2);

export const L03_SCENES = {
  l03_entry: {
    level: '0.3', title: '結霜的房間', room: iceEntryR, hazard: coldLabel, update: coldTick,
    viewMsg: '觀景窗裡，冰塊裡的人影是背對著你的。',
    enter(g, { first }) {
      if (first) g.say('還是 Level 0——一樣的牆紙，一樣的地毯，只是所有東西都結了冰。你吐出一口白氣。冰。到處都是。');
    },
    draw(ctx, t, s, R) {
      icicles(ctx, R, 6);
      for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) {
        const z = 1.6 + i * 1.1, a = P(sd * 1.2, -0.2 + i * 0.1, z), b = P(sd * (1.2 - 0.1), 0.25 + i * 0.1, z + 0.2), c = P(sd * 1.2, 0.3 + i * 0.1, z + 0.4);
        poly(ctx, [a, b, c], shade(R, '#d7d6b4', z, 0.9));
      }
      poly(ctx, [P(-1.2, 1, 1), P(1.2, 1, 1), P(1.2, 1, 6), P(-1.2, 1, 6)], 'rgba(235,245,250,0.22)');
      const wp = P(0.75, 0.2, 3.9); worker(ctx, wp[0], P(0.75, 1, 3.9)[1], 118, 0.5, '', false);
      iceBox(ctx, R, entryBlock, 0.5);
      grille(ctx, ceilVent, '#d0e4ea');
      if (!s.flags.l03_sealed) fogJet(ctx, 480, P(0, -1, 2.5)[1], 0, 1, t);
      frostOverlay(ctx, t, s);
    },
    hotspots: [
      back('l0_hall', '循著霜走回走廊', '你循著地上的霜往回走。暖一點的、帶灰塵味的空氣，從來沒這麼好聞過。'),
      hit('forward', [400, 205, 150, 140], '往深處走', (g) => g.go('l03_camp'), 'go'),
      hit('block', boxRect(entryBlock, 4), '角落的冰塊', (g) => g.say('冰塊裡站著一個人，穿著橘色的工作背心，背對著你。冰太厚了，看不清臉。')),
      hit('vent', bounds(ceilVent, 6), '天花板上的格柵', (g) => g.say('天花板上的格柵在吐冷霧。你盯著它看的時候，它好像往旁邊挪了一點。')),
    ],
  },

  l03_camp: {
    level: '0.3', title: '104-CX 施工站', room: campR, hazard: coldLabel,
    update: (g, dt) => { if (!g.s.flags.l03_sealed) coldTick(g, dt); },
    enter(g, { first }) {
      if (first) g.say('有人在這裡施工過。半張羊毛地毯鋪在冰上，旁邊堆著工具箱、一台暖風機、一把噴槍。牆上夾著一疊列印出來的郵件。沒有人。');
    },
    draw(ctx, t, s, R) {
      icicles(ctx, R, 5.5, 1.3);
      poly(ctx, [P(-1.5, 1, 1), P(1.5, 1, 1), P(1.5, 1, 3.4), P(-1.5, 1, 3.4)], shade(R, '#8a3a2a', 2, 0.9, 0.85));
      poly(ctx, [P(-1.5, 1, 3.4), P(1.5, 1, 3.4), P(1.5, 1, 5.5), P(-1.5, 1, 5.5)], 'rgba(230,245,250,0.3)');
      // the ice wall
      if (!s.flags.l03_melted) {
        poly(ctx, iceWall, 'rgba(170,215,235,0.85)'); outline(ctx, iceWall, 'rgba(240,252,255,0.9)', 2);
        const iw = P(0, 0.2, 5.5); worker(ctx, iw[0] - 20, P(0, 1, 5.5)[1], 110, 0.35); worker(ctx, iw[0] + 26, P(0, 1, 5.5)[1], 105, 0.3);
        for (let i = 0; i < 6; i++) seg(ctx, P(-0.6 + i * 0.22, -0.7, 5.5), P(-0.5 + i * 0.2, 0.2 + (i % 3) * 0.2, 5.5), 'rgba(255,255,255,0.4)', 1);
      } else { poly(ctx, iceWall, '#0e1a20'); glow(ctx, 480, 300, 60, 'rgba(255,200,120,0.4)'); }
      if (!s.flags.l03_wool) box(ctx, R, rugRoll);
      box(ctx, R, heaterBox);
      const hg = faceQuad(0.88, 0.55, 1.27, 0.9, 2.3); poly(ctx, hg, '#2a1a10');
      const warm = s.flags.l03_sealed;
      for (let i = 0; i < 3; i++) seg(ctx, P(0.92, 0.62 + i * 0.1, 2.3), P(1.23, 0.62 + i * 0.1, 2.3), warm ? '#ff7a2a' : '#7a3a1a', 3);
      if (warm) glow(ctx, P(1.1, 0.7, 2.3)[0], P(1.1, 0.7, 2.3)[1], 110, 'rgba(255,120,40,0.45)');
      box(ctx, R, toolbox);
      if (!s.flags.l03_torch) {
        const b = P(0.05, 0.78, 2.2);
        ctx.fillStyle = shade(R, '#3a5a8a', 2.2); ctx.fillRect(b[0] - 26, b[1] - 16, 30, 16);
        seg(ctx, [b[0] + 4, b[1] - 10], [b[0] + 38, b[1] - 18], shade(R, '#9aa0a4', 2.2), 5);
        if (!warm) { ctx.fillStyle = 'rgba(230,245,255,0.6)'; ctx.fillRect(b[0] - 26, b[1] - 16, 30, 5); }
      }
      poly(ctx, radioQ, shade(R, '#2a2e30', 2.1));
      const rl = bounds(radioQ); ctx.fillStyle = Math.sin(t * 4) > 0.7 ? '#ff6a2a' : '#4a1a0a'; ctx.fillRect(rl[0] + 3, rl[1] + 3, 3, 3);
      paper(ctx, R, clipboard, 2.9, '#efe9d8');
      for (const [o, label] of [[campR.openings[0], '通風機房']]) { const c = P(-1.5, -0.72, (o.z1 + o.z2) / 2); txt(ctx, label, c[0] + 4, c[1], shade(R, '#405058', o.z1), 11); }
      frostOverlay(ctx, t, s, warm ? 0.5 : 1);
    },
    hotspots: [
      back('l03_entry', '回到結霜的房間'),
      hit('vents', bounds(wallQuad(-1.5, -0.6, 1, 3.5, 4.5)), '通風機房', (g) => g.go('l03_vents'), 'go'),
      hit('clipboard', bounds(clipboard, 6), '夾在牆上的郵件', (g) => g.read('n03_mail')),
      hit('radio', bounds(radioQ, 6), '對講機', (g) => {
        g.sfx('static');
        g.say(pick(['只有雜訊。', '雜訊裡有人在數數：「一〇四、一〇五、一〇七……」然後斷了。', '「……Planes？你們在哪——」雜訊吞掉了後面的字。']));
      }),
      { ...hit('wool', boxRect(rugRoll, 6), '捲起來的羊毛地毯', (g) => {
        if (!once(g, 'l03_wool')) return;
        g.give('wool', '一捲沒鋪完的羊毛地毯，又厚又重。標籤上寫著「B 類重建・溫暖」。');
      }, 'take'), when: (s) => !s.flags.l03_wool },
      { ...hit('heater', boxRect(heaterBox, 4), '施工暖風機', (g) => g.say(g.s.flags.l03_sealed
        ? '暖風機轟轟地響。暖意終於留在了房間裡。'
        : '暖風機開著，熱氣卻一出來就被冷霧捲走了。冷霧是從通風機房那邊灌進來的。')) },
      { ...hit('blowtorch', [478, 338, 70, 36], '噴槍', (g) => {
        if (!g.s.flags.l03_sealed) return g.say('噴槍的瓦斯罐凍得像石頭，怎麼按都點不著。要是暖風機能把它烘熱就好了。');
        g.flag('l03_torch');
        g.give('blowtorch', '你把瓦斯罐擱在暖風機前烘了一會兒。按下開關——「呼」地一聲，藍色的火舌噴了出來。');
      }, 'take'), when: (s) => !s.flags.l03_torch },
      { ...hit('icewall', bounds(iceWall, 4), '結冰的門', (g) => {
        if (g.s.flags.l03_melted) return g.go('l03_blocks');
        g.say('門口被一整面冰封住了。冰裡面有兩個人影，一動也不動。');
      }, 'go'), use: {
        blowtorch(g) {
          if (g.s.flags.l03_melted) return g.go('l03_blocks');
          g.flag('l03_melted'); g.sfx('steam');
          g.say('你把火舌貼上冰面。冰一層一層化開，水在腳邊又結成冰。等到能過人了，你才發現——冰裡那兩個人影，不見了。');
        },
      } },
    ],
  },

  l03_vents: {
    level: '0.3', title: '通風機房', room: ventsR, hazard: coldLabel, update: coldTick,
    enter(g, { first }) {
      if (first) g.say('牆上、天花板上全是格柵。只有一個在吐冷霧——你眨了一下眼，它換了位置。它在房間裡跳來跳去。');
    },
    draw(ctx, t, s, R) {
      icicles(ctx, R, 4, 0.7);
      ventState = s;
      const live = ventAt(s);
      VENTS.forEach((q, i) => grille(ctx, q, i === live ? '#e8f6ff' : '#71848c'));
      const q = VENTS[live], [x, y, w, h] = bounds(q), d = VENT_DIR[live];
      if (s.flags.l03_sealed) {
        poly(ctx, q, '#8a3a2a');
        const jit = Math.sin(t * 25) * 2;
        for (let i = 0; i < 4; i++) seg(ctx, [x + jit, y + h * (i + 0.5) / 4], [x + w + jit, y + h * (i + 0.5) / 4], '#a5503a', 2);
      } else {
        glow(ctx, x + w / 2, y + h / 2, 70, 'rgba(220,240,255,0.5)');
        fogJet(ctx, x + w / 2, y + h / 2, d[0], d[1], t, 1.4);
        const rattle = Math.sin(t * 40) * 2; outline(ctx, q.map(([a, b]) => [a + rattle, b]), '#ffffff', 2);
      }
      frostOverlay(ctx, t, s);
    },
    hotspots: [
      back('l03_camp', '回到施工站'),
      { id: 'vent', label: '吐著冷霧的通風口', cursor: 'look',
        get rect() { return bounds(VENTS[ventAt(ventState)], 10); },
        click: (g) => {
          if (g.s.flags.l03_sealed) return g.say('地毯底下傳來悶悶的撞擊聲。它還想跳，但被裹住了。');
          g.say(ventAt(g.s) === VENT_LOW ? '它現在在牆腳，伸手就搆得到。冷霧噴在你手上，刺得發疼。' : '太高了。你還沒想好怎麼辦，它就又跳走了。');
        },
        use: {
          wool(g) {
            if (g.s.flags.l03_sealed) return;
            if (ventAt(g.s) !== VENT_LOW) { g.sanity(-1); return g.say('太高了，你搆不到——它又跳走了。等它跳到牆腳再說。'); }
            g.take('wool'); g.flag('l03_sealed'); g.sfx('thud');
            g.say('你撲上去，用羊毛地毯把它整個裹住，死死壓著。格柵在毯子底下撞了好幾下，然後不動了。冷霧小了很多——但沒有停。');
          },
        } },
    ],
  },

  l03_blocks: {
    level: '0.3', title: '冰塊房', room: blocksR, hazard: coldLabel, update: coldTick,
    viewMsg: '觀景窗裡，冰塊裡的每一個人都轉過頭來，看著你。',
    enter(g, { first }) {
      if (first) g.say('房間被巨大的冰塊塞滿了。每一塊冰裡都站著一個人，穿著橘色的背心。你數了數，比四個人多很多。');
    },
    draw(ctx, t, s, R) {
      icicles(ctx, R, 5, 1.7);
      if (!s.flags.l03_open) {
        poly(ctx, backIce, 'rgba(170,215,235,0.88)'); outline(ctx, backIce, 'rgba(240,252,255,0.9)', 2);
        for (let i = 0; i < 5; i++) worker(ctx, P(-0.6 + i * 0.3, 1, 5.2)[0], P(0, 1, 5.2)[1], 96, 0.25, ['105', '107', '107', '108', '108'][i]);
        glow(ctx, 480, 270, 80, 'rgba(255,190,110,0.18)');
      } else {
        poly(ctx, backIce, '#2a1a0c'); glow(ctx, 480, 290, 120, 'rgba(255,190,110,0.6)');
        poly(ctx, faceQuad(-0.6, -0.6, 0.6, 1, 6.5), '#d6bd70');
      }
      const af = P((blockA.x1 + blockA.x2) / 2, 1, 2.6);
      if (!s.flags.l03_planes) worker(ctx, af[0], af[1], 185, 0.7, 'PLANES');
      else { ctx.save(); ctx.globalAlpha = 0.6; ctx.fillStyle = '#0a1418'; ctx.beginPath(); ctx.ellipse(af[0], af[1] - 95, 26, 85, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      iceBox(ctx, R, blockA, s.flags.l03_planes ? 0.25 : 0.5);
      if (!s.flags.l03_supply) {
        const bc = { x1: 0.85, x2: 1.3, y1: 0.55, y2: 1, z1: 2.8, z2: 3.2, color: '#6a5a3a', top: '#7a6a48', edge: true };
        box(ctx, R, bc);
      }
      iceBox(ctx, R, blockB, s.flags.l03_supply ? 0.2 : 0.5);
      frostOverlay(ctx, t, s);
    },
    drawView(ctx, t, s) {
      if (s.flags.l03_planes) return;
      const af = P((blockA.x1 + blockA.x2) / 2, 1, 2.6);
      ctx.save(); ctx.fillStyle = 'rgba(220,255,230,0.8)';
      ctx.fillRect(af[0] - 8, af[1] - 169, 5, 3); ctx.fillRect(af[0] + 3, af[1] - 169, 5, 3); ctx.restore();
    },
    hotspots: [
      back('l03_camp', '回到施工站'),
      { ...hit('planes', boxRect(blockA, 2), '冰塊裡的人：PLANES', (g) => g.say(g.s.flags.l03_planes ? '冰化開後只剩一個人形的空洞，邊緣光滑得像模子。' : '安全帽上寫著 PLANES。他的手按在冰的內側，像是在推。')),
        use: { blowtorch(g) {
          if (!once(g, 'l03_planes')) return;
          g.sfx('steam'); g.sanity(-6);
          g.read('n03_planes', () => g.say('冰化開了。裡面沒有人——只有一個人形的空洞，和一張從洞裡掉出來的報告。'));
        } } },
      { ...hit('supply', boxRect(blockB, 2), '凍著木箱的冰塊', (g) => g.say(g.s.flags.l03_supply ? '箱子空了。' : '冰塊裡凍著一個木箱，箱子上印著 104-CX。')),
        use: { blowtorch(g) {
          if (!once(g, 'l03_supply')) return;
          g.sfx('steam'); g.give('almond'); g.give('can', '冰化開，木箱掉了出來。裡面是施工隊的補給：一瓶杏仁水，一個罐頭。他們沒來得及吃。');
        } } },
      { ...hit('backice', bounds(backIce, 2), '後面那面冰牆', (g) => {
        if (g.s.flags.l03_open) return g.go('l03_warm');
        g.say('冰牆後面透出暖黃色的光。冰裡站著更多的人——安全帽上寫著 105、107、108。');
      }, 'go'), use: { blowtorch(g) {
        if (g.s.flags.l03_open) return g.go('l03_warm');
        g.flag('l03_open'); g.sfx('steam');
        g.say('噴槍的火一直燒到瓦斯快見底，冰牆才塌出一個洞。洞後面是暖的。冰裡的人影，跟著冰一起化成了水。');
      } } },
    ],
  },

  l03_warm: {
    level: '0.3', title: '完工的房間', room: warmR, safe: true,
    enter(g, { first }) {
      if (first) g.say('乾淨、整潔、舒適、溫暖。新鋪的羊毛地毯，新貼的牆紙，暖黃的燈。四張摺疊椅面對著牆排成一排，每張椅子上放著一頂安全帽。');
    },
    draw(ctx, t, s, R) {
      chairs.forEach(({ x, z }, i) => {
        box(ctx, R, { x1: x - 0.18, x2: x + 0.18, y1: 0.45, y2: 0.52, z1: z, z2: z + 0.35, color: '#5a5a5a', top: '#707070' });
        box(ctx, R, { x1: x - 0.18, x2: x + 0.18, y1: 0.05, y2: 0.45, z1: z + 0.33, z2: z + 0.37, color: '#5a5a5a' });
        const h = P(x, 0.45, z + 0.15); ctx.fillStyle = '#e2b52a'; ctx.beginPath(); ctx.ellipse(h[0], h[1] - 4, 16, 9, 0, Math.PI, 0); ctx.fill();
        txt(ctx, ['PLANES', 'CHRIS', 'HAVEC', 'EVIE'][i], h[0], h[1] - 18, shade(R, '#5a4020', z), 8);
      });
      const extra = P(-0.6, 1, 2.2); ctx.fillStyle = '#e2b52a'; ctx.beginPath(); ctx.ellipse(extra[0], extra[1] - 8, 26, 14, 0, Math.PI, 0); ctx.fill();
      paper(ctx, R, finalPrint, 5, '#f4efe0');
      poly(ctx, warmExit, shade(R, '#a88a44', 2.7)); outline(ctx, warmExit, shade(R, '#6a5020', 2.7), 2);
      const kn = P(1.3, 0.2, 2.4); ctx.fillStyle = shade(R, '#d8c070', 2.4); ctx.beginPath(); ctx.arc(kn[0], kn[1], 4, 0, Math.PI * 2); ctx.fill();
      glow(ctx, 480, 330, 260, 'rgba(255,170,90,0.18)');
    },
    hotspots: [
      back('l03_blocks', '回到冰塊房'),
      hit('print', bounds(finalPrint, 8), '貼在牆上的列印紙', (g) => g.read('n03_final')),
      hit('chairs', [355, 255, 250, 70], '四張摺疊椅', (g) => g.say('椅子排得整整齊齊，面對著一面什麼都沒有的牆。椅面是溫的，像是有人剛剛才站起來。')),
      hit('hat', [318, 365, 64, 32], '地上的第五頂安全帽', (g) => g.say('第五頂安全帽倒扣在地毯上。帽簷內側用麥克筆寫著兩個字母：J.H.')),
      hit('rest', [150, 420, 170, 60], '在地毯上坐一會兒', (g) => {
        if (!once(g, 'l03_rested')) return g.say('你已經休息過了。暖意讓你有點不想走。這大概就是問題所在。');
        g.sanity(16); g.checkpoint(); g.say('地毯又厚又軟。你坐下來，手腳一點一點回暖。有一瞬間，你也很想拉一張椅子，面對著牆坐好。');
      }),
      hit('exit', bounds(warmExit, 4), '房間的門', (g) => {
        g.flag('l03_done'); g.flag('l03_thawed');
        g.go('l0_hall', { msg: '門外是那條長長的走廊。你回頭時，門已經變回一面黃色的牆。格柵不再吹冷風了，地毯上的霜化成了水漬。' });
      }, 'go'),
    ],
  },
};
