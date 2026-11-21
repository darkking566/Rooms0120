// "黯室" (Level 0.98 / The Dullness), adapted from Backrooms Wiki Fandom ZH (CC BY-SA 3.0).
// Author: Arbi (ArbiTraitor); Chinese translation: Stapel; Title credit: Ric.
// Source: https://backrooms.fandom.com/zh/wiki/%E9%BB%AF%E5%AE%A4
// Room layouts, quantum fluctuation timing, notes and interactions are original adaptations for ROOMS0120.
import { H, P, W, bottle, bounds, box, boxRect, faceQuad, paper, poly, seg, shade, wallQuad } from '../render.js';
import { back, clockOf, glow, hit, once, outline, pal, room, txt } from './sublevel-kit.js';

// Entrance in Level 0's hallway (l0_hall): an unnaturally smooth, dull-yellow wall patch on the near-left wall.
export const dullWallEntrance = wallQuad(-1, -0.72, 0.94, 1.5, 2.25);
export function drawDullWallEntrance(ctx, R, t) {
  poly(ctx, dullWallEntrance, shade(R, '#9e8b52', 1.85));
  // Subtle quantum-fluctuation sheen across the seamless dull-yellow surface
  const p = 0.22 + 0.16 * Math.sin(t * 2.1);
  outline(ctx, dullWallEntrance, `rgba(194,165,97,${p})`, 2);
  ctx.save();
  poly(ctx, dullWallEntrance); ctx.clip();
  const sy = 150 + ((t * 48) % 240);
  ctx.fillStyle = `rgba(218,195,126,${0.14 * (0.5 + 0.5 * Math.sin(t * 3.2))})`;
  ctx.fillRect(140, sy, 160, 12);
  ctx.restore();
}

// =====================================================================
// LEVEL 0.98 — 黯室 (The Dullness) — 6 playable rooms
// Absolute silence, smooth indestructible dull-yellow walls, dense fog,
// silent headache-inducing embedded lights, varied room scales, and
// the iridescent "畸變" (Distortion) / Quantum Fluctuation escape.
// =====================================================================
const pDull = pal('#8f7d4b', '#7d6e42', '#5c5030', '#1c180f', '#c9b478');
const pNarrow = pal('#827042', '#6b5d36', '#52472a', '#18140c', '#bda86e');
const pStadium = pal('#988654', '#857548', '#625634', '#221d12', '#d6c288');
const pEmbed = pal('#8a7748', '#75663d', '#574b2d', '#19150d', '#cbb57a');
const pDistort = pal('#7d6d44', '#665936', '#4a4026', '#14100b', '#e6d8a8');

const rEntry = room(pDull, { hw: 1.0, depth: 4.8, fogEnd: 6.2, baseboard: false, lights: [2.2] });
const rGrid = room(pDull, { hw: 1.85, depth: 9.5, fogEnd: 7.5, baseboard: false, lights: [2.0, 4.8, 7.6] });
const rNarrow = room(pNarrow, { hw: 0.72, depth: 9.0, fogEnd: 6.8, open: true, baseboard: false, lights: [] });
const rStadium = room(pStadium, { hw: 2.3, depth: 11.0, fogEnd: 9.2, baseboard: false, lights: [2.2, 5.4, 8.6] });
const rEmbed = room(pEmbed, { hw: 1.45, depth: 8.5, fogEnd: 7.4, baseboard: false, lights: [2.1, 5.0] });
const rDistort = room(pDistort, { hw: 1.55, depth: 8.8, fogEnd: 8.5, baseboard: false, lights: [2.0, 5.0] });

// Quantum Fluctuation window in dull_distortion: active 3.8s out of every 7.5s
export const dullFluctNow = (s) => (clockOf(s) % 7.5) < 3.8;

// Silence-induced hallucination drain (Almond water does NOT prevent it)
function dullSilenceTick(rate = 0.7) {
  return (g, dt) => {
    const f = g.s.flags;
    f.dull_silence_t = (f.dull_silence_t || 0) + dt * rate;
    if (f.dull_silence_t >= 4.2) {
      f.dull_silence_t -= 4.2;
      g.sanity(-1);
    }
  };
}

// Dense muted golden-grey fog overlay (portable lights flicker & fail here)
function drawDullFog(ctx, t, density = 0.55) {
  ctx.save();
  for (let i = 0; i < 6; i++) {
    const x = ((i * 183 + t * (9 + i * 2)) % (W + 300)) - 150;
    const y = 180 + (i * 61) % 260;
    const r = 150 + (i % 3) * 35;
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(176,154,98,${0.25 * density})`);
    gr.addColorStop(1, 'rgba(176,154,98,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.restore();
}

// Iridescent "畸變" (Distortion) prismatic overlay for the climax room
function drawDistortionPrism(ctx, t, active) {
  const cols = ['#ff4a6e', '#ffba38', '#44e58c', '#3cc6ff', '#a85cff', '#ff5ce8'];
  ctx.save();
  const alpha = active ? 0.32 : 0.14;
  for (let i = 0; i < 12; i++) {
    const shift = active ? Math.sin(t * 11 + i) * 28 : Math.sin(t * 1.8 + i) * 6;
    const y = ((i * 46 + t * (active ? 90 : 18)) % H);
    ctx.fillStyle = cols[i % cols.length];
    ctx.globalAlpha = alpha * (0.6 + 0.4 * Math.sin(t * 5 + i));
    ctx.fillRect(0, y, W, active ? 18 : 8);
    if (active) {
      ctx.fillRect(((i * 97 + shift) % W + W) % W, 0, 14, H);
    }
  }
  ctx.restore();
}

// Shared room geometries
const entrySmoothWall = wallQuad(1.0, -0.6, 0.85, 1.7, 3.0);
const entryBottle = { p: P(-0.55, 1, 2.2), z: 2.2 };
const entryNoteQuad = wallQuad(-1.0, -0.22, 0.18, 1.8, 2.35);

const gridLampQuad = [P(-0.36, -1, 1.9), P(0.36, -1, 1.9), P(0.36, -1, 2.9), P(-0.36, -1, 2.9)];
const gridPillars = [
  { x1: -1.1, x2: -0.78, y1: -1, y2: 1, z1: 3.4, z2: 3.75, color: '#837244' },
  { x1: 0.78, x2: 1.1, y1: -1, y2: 1, z1: 3.4, z2: 3.75, color: '#837244' },
  { x1: -1.1, x2: -0.78, y1: -1, y2: 1, z1: 6.0, z2: 6.35, color: '#79693f' },
  { x1: 0.78, x2: 1.1, y1: -1, y2: 1, z1: 6.0, z2: 6.35, color: '#79693f' },
];
const gridToNarrow = wallQuad(-1.85, -0.58, 1, 2.2, 3.2);
const gridToStadium = wallQuad(1.85, -0.58, 1, 2.2, 3.2);

const narrowCrack = wallQuad(-0.72, -0.42, 0.52, 2.3, 3.1);
const narrowHalluc = wallQuad(0.72, -0.52, 0.9, 3.4, 4.4);

const stadiumNoteQuad = wallQuad(-2.3, -0.22, 0.18, 2.4, 3.2);

const embedTorchBox = { x1: 0.55, x2: 0.95, y1: 0.86, y2: 1, z1: 2.1, z2: 2.5, color: '#383834', top: '#4a4a44', edge: true };
const embedPlane = wallQuad(-1.45, -0.82, 0.96, 2.2, 3.7);

const distortWall = faceQuad(-0.75, -0.72, 0.75, 0.92, 8.75);
const distortAbyss = [P(-0.65, 1, 2.4), P(0.65, 1, 2.4), P(0.65, 1, 3.5), P(-0.65, 1, 3.5)];
const distortPhotoQuad = wallQuad(-1.55, -0.24, 0.18, 2.0, 2.65);

export const L098_SCENES = {
  // Room 1: Tiny bedroom-sized smooth room
  dull_entry: {
    level: '0.98', title: '黯室・臥室大小的空房', room: rEntry,
    hazard: () => '絕對沉寂・一切聲音無法發出・通訊已切斷',
    update: dullSilenceTick(0.55),
    viewMsg: '觀景窗裡沒有任何雜訊，只有一片死寂且絕對光滑的黯黃牆壁。',
    enter(g, { first }) {
      if (first) {
        if (g.s.light) { g.setLight(false); g.say('手電筒剛亮了一下就在這片迷霧裡熄滅了。'); }
        g.say('你穿過那面黯黃牆壁，墜入一片絕對的沉寂。連自己的腳步聲與呼吸聲都徹底消失——四面是臥室大小、絕對光滑的黯黃牆面。');
      }
    },
    draw(ctx, t, s, R) {
      // Empty almond water bottle left by a previous wanderer
      bottle(ctx, R, entryBottle.p[0], entryBottle.p[1], 32, entryBottle.z);
      paper(ctx, R, entryNoteQuad, 2.1, '#cfc08e');
      drawDullFog(ctx, t, 0.45);
    },
    hotspots: [
      hit('smooth_wall', bounds(entrySmoothWall, 6), '絕對光滑的黯黃牆面', (g) => {
        g.flag('dull_wall_hit');
        g.say('你試著撞向牆壁想卡回 Level 0——紋絲不動。牆面光滑得毫無接縫，堅不可摧，好似整座樓層處在絕對穩定的狀態。');
      }),
      hit('empty_bottle', [entryBottle.p[0] - 20, entryBottle.p[1] - 42, 40, 46], '散落的空杏仁水瓶', (g) => {
        g.say('一只徹底喝空的杏仁水瓶。雖然這裡有隔離效應、活物無法相遇，但顯然曾有別的流浪者走過這裡。');
      }),
      hit('note_1', bounds(entryNoteQuad, 10), '萊恩・格林菲爾德的音訊抄本（一）', (g) => g.read('n_dull_1')),
      hit('forward', [400, 200, 160, 150], '走進濃霧瀰漫的網格狀區域', (g) => g.go('dull_grid'), 'go'),
    ],
  },

  // Room 2: Grid-like foggy pillar area
  dull_grid: {
    level: '0.98', title: '網格狀霧區', room: rGrid,
    hazard: () => '濃霧蔽目・布局隨時變動・杏仁水無法緩解沉寂幻覺',
    update: dullSilenceTick(0.75),
    viewMsg: '觀景窗裡，每一根黯黃柱子的間距都在靜靜改寫，毫無導航依據。',
    enter(g, { first }) {
      if (first) {
        g.say('濃霧籠罩著一片整齊排列的網格柱陣。頭頂嵌著完全無聲、看不見任何電線的螢光燈。左右兩側延伸出截然不同尺度的空間。');
      }
    },
    draw(ctx, t, s, R) {
      gridPillars.forEach((p) => box(ctx, R, p));
      // Seamless silent embedded ceiling lamp
      poly(ctx, gridLampQuad, '#e2d298');
      outline(ctx, gridLampQuad, '#a89660', 1.5);
      const lc = P(0, -1, 2.4);
      glow(ctx, lc[0], lc[1] + 10, 72, 'rgba(226,210,152,0.28)');
      const ln = P(-1.85, -0.68, 2.7), rn = P(1.85, -0.68, 2.7);
      txt(ctx, '狹窄長廊', ln[0] + 22, ln[1], '#d8c588', 11);
      txt(ctx, '廣闊大廳', rn[0] - 22, rn[1], '#e6d69c', 11);
      drawDullFog(ctx, t, 0.65);
    },
    hotspots: [
      back('dull_entry', '退回臥室大小的空房'),
      hit('silent_lamp', bounds(gridLampQuad, 12), '嵌在頂端的無聲螢光燈', (g) => {
        g.flag('dull_flashback');
        g.sanity(-5);
        g.closeup('dull_lamp_cu', {
          msg: '你只盯了那盞無聲燈板一瞬間，劇烈頭痛伴隨零碎的記憶閃回瞬間湧進腦海！別再直視天花板了。',
        });
      }),
      hit('to_narrow', bounds(gridToNarrow, 6), '左側極度狹窄的走廊', (g) => g.go('dull_narrow'), 'go'),
      hit('to_stadium', bounds(gridToStadium, 6), '右側飄來清風的廣闊大廳', (g) => g.go('dull_stadium'), 'go'),
    ],
  },

  // Room 3: Narrow corridor whose ceiling vanishes into infinite fog
  dull_narrow: {
    level: '0.98', title: '不見頂端的狹窄長廊', room: rNarrow,
    hazard: () => '狹窄區域較為悶熱・無聲沉寂易引發幻覺',
    update: dullSilenceTick(0.9),
    viewMsg: '觀景窗往上抬也看不到天花板——只有兩面光滑的黯黃高牆沒入濃霧。',
    enter(g, { first }) {
      if (first) {
        g.say('走廊窄得幾乎擦到雙肩，抬頭卻根本望不見頂端。空氣比寬敞區域悶熱些，左牆上有一道細小的裂縫。');
      }
    },
    draw(ctx, t, s, R) {
      // Tiny crack in smooth wall showing another embedded room
      poly(ctx, narrowCrack, '#1c180e');
      outline(ctx, narrowCrack, '#b8a264', 2);
      // Silence-induced phantom doorway on right wall
      if (!s.flags.dull_halluc_seen) {
        poly(ctx, narrowHalluc, `rgba(180,158,96,${0.25 + 0.15 * Math.sin(t * 2.5)})`);
        outline(ctx, narrowHalluc, 'rgba(220,200,130,0.45)', 1.5);
      }
      drawDullFog(ctx, t, 0.7);
    },
    hotspots: [
      back('dull_grid', '退回網格狀霧區'),
      hit('wall_crack', bounds(narrowCrack, 10), '牆壁上的小裂縫', (g) => g.read('n_dull_2')),
      {
        ...hit('phantom_door', bounds(narrowHalluc, 6), '霧裡浮現的虛幻門影', (g) => {
          g.flag('dull_halluc_seen');
          g.sanity(-5);
          g.say('你伸手摸過去，只有冰冷光滑的整面實牆。絕對的沉寂正在誘發幻覺——而且杏仁水對這沒用。');
        }),
        when: (s) => !s.flags.dull_halluc_seen,
      },
      hit('forward', [400, 200, 160, 150], '沿著狹窄長廊往前走', (g) => g.go('dull_embed'), 'go'),
    ],
  },

  // Room 4: Stadium-sized vast cool hall with unknown upper breeze
  dull_stadium: {
    level: '0.98', title: '體育館般的廣闊大廳', room: rStadium, safe: true,
    hazard: () => '未知清風拂過上端・空間開闊且較為涼爽',
    viewMsg: '觀景窗裡，一陣方向不定的微風正捲動著大廳上方的黯黃濃霧。',
    enter(g, { first }) {
      if (first) {
        g.say('眼前的空間陡然撐開，大過整座體育館。來源未知的清風拂過上端，空氣比狹窄走廊涼爽許多——但依然聽不到一絲風聲。');
      }
    },
    draw(ctx, t, s, R) {
      // Subtle drifting breeze streaks high across the hall
      ctx.save();
      ctx.strokeStyle = 'rgba(224,208,156,0.18)'; ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const x = ((i * 190 + t * 55) % (W + 160)) - 80;
        const y = 85 + i * 24;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 95, y - 6); ctx.stroke();
      }
      ctx.restore();
      paper(ctx, R, stadiumNoteQuad, 2.8, '#d4c490');
      drawDullFog(ctx, t, 0.42);
    },
    hotspots: [
      back('dull_grid', '退回網格狀霧區'),
      hit('cool_breeze', [160, 395, 220, 70], '在拂過上端的清風裡靜坐片刻', (g) => {
        if (!once(g, 'dull_breeze_rest')) return g.say('你已經在清風裡穩住心神了。繼續往更深處尋找離開的機會吧。');
        g.sanity(14);
        g.checkpoint();
        g.say('雖然連風都聽不見聲音，但廣闊空間裡的涼意讓你從沉寂的壓迫中緩了過來。（清醒度 +14）');
      }),
      hit('note_3', bounds(stadiumNoteQuad, 10), '地上的音訊抄本（二）', (g) => g.read('n_dull_3')),
      hit('forward', [400, 200, 160, 150], '穿過廣闊大廳走向深處', (g) => g.go('dull_embed'), 'go'),
    ],
  },

  // Room 5: Embedded intersecting rooms (first hints of iridescent Distortion)
  dull_embed: {
    level: '0.98', title: '嵌套空間・錯位交界', room: rEmbed,
    hazard: () => '結構不定・房間互相嵌入・前方隱現斑斕異色',
    update: dullSilenceTick(0.8),
    viewMsg: '觀景窗裡，光滑牆面內部閃過如遊戲貼圖錯誤般的五光十色斑塊。',
    enter(g, { first }) {
      if (first) {
        g.say('兩間大小不一的房間毫無預兆地嵌進彼此的牆體裡。地上躺著一支徹底熄滅的手電筒，而走廊盡頭的黯黃牆壁正透出詭異的斑斕色彩。');
      }
    },
    draw(ctx, t, s, R) {
      // Intersecting angled smooth wall plane
      poly(ctx, embedPlane, shade(R, '#7e6d42', 2.9));
      outline(ctx, embedPlane, '#b8a268', 2);
      // Dead cylindrical flashlight lying on the smooth dull floor
      const tp = P(0.75, 0.96, 2.3);
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(tp[0], tp[1] + 4, 28, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.translate(tp[0], tp[1] - 4); ctx.rotate(-0.18);
      ctx.fillStyle = '#2e3032'; ctx.fillRect(-20, -5, 30, 10);
      ctx.fillStyle = '#484c50';
      ctx.beginPath(); ctx.moveTo(10, -5); ctx.lineTo(20, -9); ctx.lineTo(20, 9); ctx.lineTo(10, 5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#6c7068'; ctx.fillRect(19, -8, 3, 16);
      ctx.restore();
      // Faint prismatic bleed at far end
      const fc = P(0, 0.1, 8.4);
      glow(ctx, fc[0], fc[1], 110, `rgba(180,120,255,${0.25 + 0.12 * Math.sin(t * 3)})`);
      glow(ctx, fc[0] + 28, fc[1] - 12, 85, `rgba(80,230,210,${0.22 + 0.1 * Math.cos(t * 2.7)})`);
      drawDullFog(ctx, t, 0.52);
    },
    hotspots: [
      back('dull_stadium', '退回體育館般的廣闊大廳'),
      hit('embed_wall', bounds(embedPlane, 6), '互相嵌入的無縫牆體', (g) => {
        g.say('另一間房的牆角硬生生嵌進這條走廊裡，接縫卻依然絕對光滑。這裡的結構隨時在重排。');
      }),
      hit('dead_torch', boxRect(embedTorchBox, 8), '徹底熄滅的舊手電筒', (g) => {
        g.say('開關怎麼按都不亮。在這層樓裡，任何攜帶光源都撐不過幾分鐘就會熄滅。');
      }),
      hit('forward', [400, 195, 160, 160], '走向滲出斑斕色彩的盡頭（畸變核心）', (g) => g.go('dull_distortion'), 'go'),
    ],
  },

  // Room 6: The Distortion ("畸變") & Quantum Fluctuation Escape
  dull_distortion: {
    level: '0.98', title: '畸變核心・量子漲落', room: rDistort,
    hazard: (s) => (dullFluctNow(s)
      ? '【量子漲落爆發中】牆壁斑斕破碎・空間暫時不穩——立刻撞牆卡出！'
      : '牆壁浮現五光十色的「畸變」・等待量子漲落讓空間失穩'),
    update: dullSilenceTick(0.95),
    viewMsg: '觀景窗捕捉到整片空間化為五光十色的幾何碎片——就像格林菲爾德拍下的「畸變」！',
    enter(g, { first }) {
      if (first) {
        g.say('四周的黯黃突然化作五光十色的斑斕色彩，宛若失控的遊戲畫面！這是「畸變」——每當量子漲落爆發、牆面破碎的那幾秒，就是唯一能卡出黯室的機會！');
      }
    },
    draw(ctx, t, s, R) {
      const fluct = dullFluctNow(s);
      // Fractured iridescent escape wall
      const jitter = fluct ? Math.sin(t * 35) * 5 : 0;
      const wq = distortWall.map(([x, y]) => [x + jitter, y]);
      poly(ctx, wq, fluct ? '#261a36' : '#6c5c34');
      outline(ctx, wq, fluct ? '#7cf7ff' : '#d2b468', fluct ? 3.5 : 2);
      // Shattered floor abyss
      poly(ctx, distortAbyss, '#030305');
      outline(ctx, distortAbyss, fluct ? '#ff6ae6' : '#584b2a', 2);
      paper(ctx, R, distortPhotoQuad, 2.3, '#e0d2a4');
      drawDistortionPrism(ctx, t, fluct);
    },
    hotspots: [
      back('dull_embed', '退回嵌套空間'),
      hit('photo_note', bounds(distortPhotoQuad, 10), '2000/02/10「畸變」照片與附件紀錄', (g) => {
        g.flag('dull_photo_seen');
        g.closeup('dull_distortion_cu', {
          msg: '格林菲爾德於 2000 年 2 月 10 日重返黯室拍下的「畸變」——色彩交融、天頂偏移，時空彷彿發出冰冷刺耳的碎裂聲。',
        });
      }),
      hit('void_floor', bounds(distortAbyss, 6), '崩毀地板露出的無盡虛無', (g) => {
        g.end('dull_void');
      }, 'go'),
      hit('escape_wall', bounds(distortWall, 8), '五光十色的斑斕畸變牆面', (g) => {
        if (!dullFluctNow(g.s)) {
          g.sanity(-3);
          return g.say('牆面此刻依然硬得像實心石板！等色彩劇烈閃動、量子漲落讓牆壁破碎的那幾秒再衝進去！');
        }
        g.flag('dull_escaped');
        g.sfx('open');
        g.go('l0_start', {
          msg: '你趁量子漲落爆發狠狠撞進破碎的斑斕牆面！在無盡虛無裡下墜了幾秒後，耀眼的黃光與震耳的嗡嗡聲重新湧來——你重重摔回了 Level 0 潮濕的地毯上！',
        });
      }, 'go'),
    ],
  },
};
