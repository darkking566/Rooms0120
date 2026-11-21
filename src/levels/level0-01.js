// Level 0.01 "無盡長廊" (The Endless Corridor), adapted from Backrooms Wiki Fandom ZH (CC BY-SA 3.0).
// Original: Robbo1423; Rewrite: Dr. Swaggfield (greenlight: Cringeaccount123456789);
// Chinese translation: Echonic; Proofread: 所有盒子.
// Source: https://backrooms.fandom.com/zh/wiki/Level_0.01
// Scene progression, puzzles, notes and interactions are original adaptations for ROOMS0120.
import { H, P, W, bottle, bounds, box, boxRect, faceQuad, paper, poly, seg, shade, wallQuad } from '../render.js';
import { back, clockOf, darkness, glow, hit, once, outline, pal, qtxt, room, txt } from './sublevel-kit.js';

// Entrance in Level 0's flickering looping hallway (l0_loop):
// A concrete door with glowing green "EXIT" lettering on the left wall.
export const exit001Door = wallQuad(-1, -0.58, 1, 1.35, 1.85);
export function drawExit001Door(ctx, R, t) {
  poly(ctx, exit001Door, shade(R, '#6d706c', 1.6));
  outline(ctx, exit001Door, shade(R, '#3e423e', 1.6), 2.5);
  // Concrete seam lines
  seg(ctx, P(-1, -0.58, 1.4), P(-1, 1, 1.4), shade(R, '#4b4f4b', 1.4), 1);
  seg(ctx, P(-1, -0.58, 1.8), P(-1, 1, 1.8), shade(R, '#4b4f4b', 1.8), 1);
  // Push bar
  seg(ctx, P(-1, 0.12, 1.42), P(-1, 0.12, 1.78), shade(R, '#a8aea8', 1.6), 3);
  // Glowing green EXIT sign above/on top of the concrete door
  const signQuad = wallQuad(-1, -0.52, -0.32, 1.45, 1.75);
  poly(ctx, signQuad, '#142618');
  outline(ctx, signQuad, '#3a6e42', 1.5);
  const pulse = 0.78 + 0.22 * Math.sin(t * 5.2);
  const sc = P(-1, -0.42, 1.6);
  glow(ctx, sc[0] + 6, sc[1], 36, `rgba(92,255,132,${0.42 * pulse})`);
  qtxt(ctx, 'EXIT', signQuad, 0.08, 0.15, 0.92, 0.85, `rgba(142,255,168,${pulse})`, 13);
}

// =====================================================================
// LEVEL 0.01 — 無盡長廊 (The Endless Corridor)
// 6 rooms following the wiki's distance-depth deterioration table:
//   0 km (25°C) -> 5 km (30°C) -> 13 km (35°C) -> 21 km (36°C) -> 31 km (40°C)
//   plus the one-way ceiling light-panel gap (燈槽狹隙) leading toward Level 28 / escape.
// =====================================================================
const p001_0 = pal('#ccb65c', '#d8ce96', '#8d7a38', '#2a2410', '#fff4c4');
const p001_5 = pal('#c7af52', '#d2c484', '#857030', '#312810', '#ffefb0');
const p001_13 = pal('#b59c44', '#bfaf70', '#705c26', '#281e0b', '#f8e090');
const p001_21 = pal('#9e8639', '#a5945c', '#5e4c20', '#2b220c', '#ebd078');
const p001_31 = pal('#8a6b2e', '#8f7848', '#4d3a1a', '#301a0a', '#ffbe68');
const p001_gap = pal('#52565c', '#2e3238', '#3c4046', '#0c1014', '#c8dce8');

// Blackout-before-flicker cycle ("熄滅通常先於閃爍")
function unstableLight(t, freq = 1) {
  const c = (t * freq) % 7.0;
  if (c < 1.25) return 0.12; // blackout precedes flicker
  if (c < 2.25) return Math.sin(t * 48) > 0 ? 0.95 : 0.22; // rapid flicker
  return 0.88 + 0.12 * Math.sin(t * 23);
}

const r001_0 = room(p001_0, {
  hw: 1.05, depth: 12, fogEnd: 10.5, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.6, 3.4, 5.2, 7.0, 8.8], flickerLights: [2, 4], flick: (t) => 0.94 + 0.06 * Math.sin(t * 36),
});
const r001_5 = room(p001_5, {
  hw: 1.0, depth: 13, fogEnd: 9.5, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.5, 3.2, 5.0, 6.8, 8.6], flickerLights: [1, 3, 4], flick: (t) => unstableLight(t, 0.7),
});
const r001_13 = room(p001_13, {
  hw: 1.05, depth: 12, fogEnd: 8.5, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.6, 3.8, 6.2, 8.8], flickerLights: [0, 1, 2, 3], flick: (t) => unstableLight(t, 1.0),
});
const r001_21 = room(p001_21, {
  hw: 1.12, depth: 12, fogEnd: 7.2, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.8, 5.6], flickerLights: [0, 1], flick: (t) => unstableLight(t, 1.25),
});
const r001_31 = room(p001_31, {
  hw: 1.15, depth: 11, fogEnd: 6.5, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.9, 4.6, 7.4], flickerLights: [0, 1, 2], flick: (t) => unstableLight(t, 1.65),
});
const r001_gap = room(p001_gap, {
  hw: 1.25, depth: 7.5, fogEnd: 9.5, wallTex: 'concrete', floorTex: 'concrete', baseboard: false, lights: [],
});

// Environmental heat & buzzing sensory-deprivation tick (paused while reading notes)
function l001Tick(rate) {
  return (g, dt) => {
    const f = g.s.flags;
    const mult = f.l001_calmed ? 0.45 : 1;
    f.l001_heat = (f.l001_heat || 0) + dt * rate * mult;
    if (f.l001_heat >= 3.8) {
      f.l001_heat -= 3.8;
      g.sanity(-1);
    }
  };
}

const heatHazard = (km, temp, extra) => (s) =>
  `${km} 公里・${temp}°C・${extra}${s.flags.l001_calmed ? '（杏仁水暫緩了五感剝奪）' : ''}`;

// Mist & heat overlay (flashlight cuts cleanly through the almond-water mist)
function drawMistOverlay(ctx, t, s, density = 0.3, heat = 0) {
  const clear = s.light ? 0.42 : 1;
  const d = density * clear;
  ctx.save();
  // Almond-water + water vapor mist
  for (let i = 0; i < 8; i++) {
    const speed = 12 + heat * 26 + i * 4;
    const x = ((i * 157 + t * speed) % (W + 320)) - 160;
    const y = 210 + (i * 53) % 240;
    const r = 135 + (i % 3) * 35;
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(232,222,166,${0.26 * d})`);
    gr.addColorStop(1, 'rgba(232,222,166,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // Heat vignette at higher distances
  if (heat > 0) {
    const gr = ctx.createRadialGradient(W / 2, H / 2, 160, W / 2, H / 2, 560);
    gr.addColorStop(0, 'rgba(255,150,60,0)');
    gr.addColorStop(1, `rgba(180,75,20,${0.32 * heat})`);
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);
  }
  // If flashlight is on, show a warm beam piercing the mist
  if (s.light) {
    const beam = ctx.createRadialGradient(W / 2, H / 2 - 10, 20, W / 2, H / 2 - 10, 230);
    beam.addColorStop(0, 'rgba(255,248,215,0.12)');
    beam.addColorStop(1, 'rgba(255,248,215,0)');
    ctx.fillStyle = beam;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

// Draw torn wallpaper strips and rust streaks along side walls
function drawTornWalls(ctx, R, count = 4, rust = false) {
  for (let i = 0; i < count; i++) {
    const sd = i % 2 === 0 ? -1 : 1;
    const z = 1.7 + i * 1.15;
    const tear = [
      P(sd * R.hw, -0.55 + (i % 3) * 0.15, z),
      P(sd * R.hw, -0.4 + (i % 2) * 0.12, z + 0.45),
      P(sd * R.hw, 0.45 + (i % 3) * 0.1, z + 0.35),
      P(sd * R.hw, 0.55, z - 0.05),
    ];
    poly(ctx, tear, shade(R, rust ? '#4a2b1c' : '#524933', z));
    if (rust) {
      seg(ctx, P(sd * R.hw, -0.35, z + 0.15), P(sd * R.hw, 0.85, z + 0.18), shade(R, '#6b2c14', z), 3);
    }
  }
}

// Draw blackout curtain when unstableLight dips to blackout phase
function drawBlackoutDip(ctx, t, s, freq) {
  const lv = unstableLight(t, freq);
  if (lv < 0.25) {
    const holes = s.light ? [[W / 2, H / 2, 240]] : [];
    darkness(ctx, 0.84, holes);
  }
}

// Shared geometry for Level 0.01 rooms
const bulgeWall = wallQuad(1.05, -0.7, 0.85, 2.3, 3.8);
const debrisBox = { x1: -0.92, x2: -0.42, y1: 0.82, y2: 1, z1: 2.0, z2: 2.55, color: '#5c5238', top: '#736746', edge: true };
const entryNoteQuad = wallQuad(-1.05, -0.22, 0.16, 1.9, 2.45);

const lamp5Quad = [P(-0.34, -1, 2.1), P(0.34, -1, 2.1), P(0.34, -1, 3.1), P(-0.34, -1, 3.1)];
const mistBottleP = { p: P(0.68, 1, 2.3), z: 2.3 };
const note5Quad = wallQuad(-1.0, -0.2, 0.18, 2.5, 3.1);

const fadedPile = { x1: -0.95, x2: -0.35, y1: 0.66, y2: 1, z1: 2.3, z2: 3.0, color: '#b5a24a', top: '#cab75c', edge: true };
const voidHole13 = [P(0.18, 1, 2.5), P(0.92, 1, 2.5), P(0.92, 1, 3.5), P(0.18, 1, 3.5)];
const note13Quad = wallQuad(1.05, -0.24, 0.16, 2.0, 2.55);

const fakeExit21 = wallQuad(-1.12, -0.58, 1, 2.3, 3.2);
const missingPanel21 = [P(-0.38, -1, 1.9), P(0.38, -1, 1.9), P(0.38, -1, 2.9), P(-0.38, -1, 2.9)];
const note21Quad = wallQuad(1.12, -0.22, 0.16, 2.1, 2.65);

const glitchSeam31 = faceQuad(-0.46, -0.62, 0.46, 0.92, 9.6);
const voidHole31 = [P(-0.88, 1, 2.4), P(-0.2, 1, 2.4), P(-0.2, 1, 3.3), P(-0.88, 1, 3.3)];
const note31Quad = wallQuad(1.15, -0.24, 0.18, 2.0, 2.6);

const gapSlotFloor = [P(-0.45, 1, 1.5), P(0.45, 1, 1.5), P(0.45, 1, 2.2), P(-0.45, 1, 2.2)];
const gapStoneArch = faceQuad(-0.52, -0.62, 0.52, 0.98, 7.45);
const gapSeamL1 = wallQuad(1.25, -0.46, 0.88, 2.5, 3.5);
const gapNoteQuad = wallQuad(-1.25, -0.24, 0.18, 2.0, 2.6);

export const L001_SCENES = {
  // Room 1: 0 km (25°C)
  l001_0km: {
    level: '0.01', title: '0 公里・長廊入口', room: r001_0,
    hazard: heatHazard(0, 25, '孤立效應生效・通訊已切斷'),
    update: l001Tick(0.45),
    viewMsg: '觀景窗裡，你每眨一次眼，遠處牆面的接縫就悄悄橫移幾公分。',
    enter(g, { first }) {
      if (first) {
        g.say('推開標著綠色「EXIT」的混凝土門，外面並不是出口——而是另一條潮濕、嗡鳴的螢黃色長廊。身後的門框正在牆紙裡慢慢淡去。');
      }
    },
    draw(ctx, t, s, R) {
      // Subtle bulging right wall
      const shift = Math.sin(t * 0.7) * 0.04;
      const bulge = [
        P(1.05 - 0.12 - shift, -0.65, 2.4),
        P(1.05 - 0.12 - shift, -0.65, 3.7),
        P(1.05 - 0.08 - shift, 0.88, 3.7),
        P(1.05 - 0.08 - shift, 0.88, 2.4),
      ];
      poly(ctx, bulge, shade(R, '#bfa94f', 3.0));
      outline(ctx, bulge, shade(R, '#7a692b', 3.0), 1.5);
      // Scattered clipped-in debris (empty tilted bottle, worn shoe, cracked flashlight)
      const sp = P(-0.68, 0.96, 2.25);
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      ctx.beginPath(); ctx.ellipse(sp[0], sp[1] + 4, 48, 11, 0, 0, Math.PI * 2); ctx.fill();
      // Worn shoe
      ctx.fillStyle = shade(R, '#6b5a34', 2.25);
      ctx.beginPath(); ctx.roundRect(sp[0] - 40, sp[1] - 14, 34, 15, [8, 10, 3, 3]); ctx.fill();
      ctx.strokeStyle = '#3c3018'; ctx.lineWidth = 1.5; ctx.stroke();
      // Cracked flashlight cylinder
      ctx.fillStyle = shade(R, '#2c2e30', 2.25);
      ctx.fillRect(sp[0] - 6, sp[1] - 8, 28, 8);
      ctx.fillStyle = '#52565a'; ctx.fillRect(sp[0] + 20, sp[1] - 10, 7, 12);
      // Tilted empty bottle
      ctx.translate(sp[0] + 34, sp[1] - 6); ctx.rotate(0.55);
      ctx.fillStyle = shade(R, '#d8d2b2', 2.25);
      ctx.beginPath(); ctx.roundRect(-5, -12, 10, 22, 3); ctx.fill();
      ctx.restore();
      paper(ctx, R, entryNoteQuad, 2.2, '#ede4be');
      drawMistOverlay(ctx, t, s, 0.15, 0);
    },
    hotspots: [
      back('l0_firedoor', '趁混凝土門還沒消失退回 Level 0', '你趕在牆紙吞掉門框前退回 Level 0 的混凝土防火門廳。那股潮熱的霧氣在門後嘎然而止。'),
      hit('forward', [400, 200, 160, 150], '沿著無盡長廊深入（往 5 公里處）', (g) => g.go('l001_5km'), 'go'),
      hit('bulge', bounds(bulgeWall, 6), '局部凸起的牆壁', (g) => {
        g.say('這段牆壁不自然地往內凸起，轉角的度數也和剛才不一樣。你移開視線再看回來時，它又往遠處滑了一步。');
      }),
      hit('debris', boxRect(debrisBox, 8), '散落的空瓶、破鞋與損壞手電', (g) => {
        if (once(g, 'l001_debris_checked')) {
          g.say('地上散落著空瓶、一隻磨穿的破鞋，還有一支外殼裂開的壞手電筒——大概是從別的樓層卡進這裡的。它們原本的顏色已經開始往螢黃色褪去。');
        } else {
          g.say('空瓶與壞掉的手電筒靜靜躺在濕地毯上。沒有任何能用的零件。');
        }
      }),
      hit('note_entry', bounds(entryNoteQuad, 10), '貼在牆紙上的警告字條', (g) => g.read('n001_entry')),
    ],
  },

  // Room 2: 5 km (30°C)
  l001_5km: {
    level: '0.01', title: '5 公里・霧廊與閃燈', room: r001_5,
    hazard: heatHazard(5, 30, '螢光燈頻繁閃爍・霧氣變濃'),
    update: l001Tick(0.75),
    viewMsg: '觀景窗穿透淡黃色霧氣，拍到天花板燈管正以極不規則的節奏閃滅。',
    enter(g, { first }) {
      if (first) {
        g.say('空氣變得又悶又濕，額頭立刻冒出汗珠。淡黃色的霧氣在走廊裡飄散——聞起來混著潮濕水氣與一絲杏仁水的甜味。');
      }
    },
    draw(ctx, t, s, R) {
      // Overhead flickering fluorescent lamp panel
      const lit = unstableLight(t, 0.7) > 0.4;
      poly(ctx, lamp5Quad, lit ? '#fff8d4' : '#4a4532');
      outline(ctx, lamp5Quad, '#8f8458', 2);
      if (lit) {
        const lc = P(0, -1, 2.6);
        glow(ctx, lc[0], lc[1] + 10, 95, 'rgba(255,244,186,0.42)');
      }
      // Condensed almond-water bottle on floor
      if (!s.flags.l001_mist_almond) {
        bottle(ctx, R, mistBottleP.p[0], mistBottleP.p[1], 34, mistBottleP.z);
      }
      paper(ctx, R, note5Quad, 2.8, '#e8dea8');
      drawMistOverlay(ctx, t, s, 0.36, 0.2);
      drawBlackoutDip(ctx, t, s, 0.7);
    },
    hotspots: [
      back('l001_0km', '折返至 0 公里入口'),
      hit('forward', [400, 200, 160, 150], '繼續深入濃霧（往 13 公里處）', (g) => g.go('l001_13km'), 'go'),
      hit('lamp', bounds(lamp5Quad, 12), '頭頂劇烈閃爍的螢光燈', (g) => {
        g.flag('l001_lamp_stared');
        g.sanity(-6);
        g.sfx('surge');
        g.closeup('l001_lamp_cu', {
          msg: '你抬頭盯著那根嗡嗡作響的燈管。刺眼的白光與頻閃鑽進腦海，五感像被一層厚棉捂住——不能再盯著它看了！',
        });
      }),
      {
        ...hit('mist_bottle', [mistBottleP.p[0] - 24, mistBottleP.p[1] - 46, 48, 52], '地毯邊凝結霧水的瓶子', (g) => {
          if (!once(g, 'l001_mist_almond')) return;
          g.give('almond', '半瓶從霧氣裡凝結出來的杏仁水。這裡的霧混著杏仁水，喝一口能暫時緩解嗡鳴帶來的五感剝奪。');
        }, 'take'),
        when: (s) => !s.flags.l001_mist_almond,
      },
      hit('note_5km', bounds(note5Quad, 10), '牆上的里程紀錄頁', (g) => g.read('n001_5km')),
    ],
  },

  // Room 3: 13 km (35°C)
  l001_13km: {
    level: '0.01', title: '13 公里・剝壁與熄燈帶', room: r001_13,
    hazard: heatHazard(13, 35, '熄燈先於閃爍・牆紙大面積撕裂'),
    update: l001Tick(1.0),
    viewMsg: '觀景窗裡，右側地板的黑洞深不見底，連雪花雜訊都在洞口邊緣消失了。',
    enter(g, { first }) {
      if (first) {
        g.say('悶熱得像走進停電的蒸氣室。頭頂的燈管動不動就整片熄滅，過一會才瘋狂閃爍。牆紙一條條撕裂垂落，地板右側破開了一個漆黑的洞。');
      }
    },
    draw(ctx, t, s, R) {
      drawTornWalls(ctx, R, 5, false);
      // Faded-to-yellow backpack & slumped jacket pile (not a plain cube)
      const fp = P(-0.65, 0.96, 2.65);
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.34)';
      ctx.beginPath(); ctx.ellipse(fp[0], fp[1] + 5, 50, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = shade(R, '#bfa94a', 2.65);
      ctx.beginPath(); ctx.roundRect(fp[0] - 34, fp[1] - 46, 52, 48, [16, 16, 8, 8]); ctx.fill();
      ctx.strokeStyle = shade(R, '#7a6826', 2.65); ctx.lineWidth = 2; ctx.stroke();
      // Front pocket & straps
      ctx.fillStyle = shade(R, '#a8943c', 2.65);
      ctx.beginPath(); ctx.roundRect(fp[0] - 24, fp[1] - 26, 32, 20, 5); ctx.fill();
      // Bleached shoe beside backpack
      ctx.fillStyle = shade(R, '#b49e42', 2.65);
      ctx.beginPath(); ctx.roundRect(fp[0] + 16, fp[1] - 12, 26, 13, [6, 8, 2, 2]); ctx.fill();
      ctx.restore();
      // Floor hole leading to The Void
      poly(ctx, voidHole13, '#020202');
      outline(ctx, voidHole13, shade(R, '#3d341c', 3.0), 2.5);
      paper(ctx, R, note13Quad, 2.3, '#dfd296');
      drawMistOverlay(ctx, t, s, 0.56, 0.45);
      drawBlackoutDip(ctx, t, s, 1.0);
    },
    hotspots: [
      back('l001_5km', '退回 5 公里霧廊'),
      hit('forward', [400, 200, 160, 150], '硬著頭皮往更深處走（往 21 公里處）', (g) => g.go('l001_21km'), 'go'),
      hit('faded_pile', boxRect(fadedPile, 8), '褪成單調螢黃的流浪者遺物', (g) => {
        if (once(g, 'l001_faded_checked')) {
          g.give('almond');
          g.closeup('l001_faded_cu', {
            msg: '背包、外套、鞋帶全都褪成和牆紙一模一樣的單調螢黃色。唯有最底下一瓶杏仁水還保留著原本的色澤——你把它收進物品欄。',
          });
        } else {
          g.closeup('l001_faded_cu', {
            msg: '剩下的衣物與空水壺已經徹底融進這層樓的螢黃裡，幾乎快和地毯分不開了。',
          });
        }
      }),
      hit('void_hole', bounds(voidHole13, 6), '地板上漆黑無底的洞', (g) => {
        g.end('void');
      }, 'go'),
      hit('note_13km', bounds(note13Quad, 10), '夾在裂縫裡的紀錄紙', (g) => g.read('n001_13km')),
    ],
  },

  // Room 4: 21 km (36°C) — Max mist, fake exit hallucination, silhouette, ceiling gap to Level 28
  l001_21km: {
    level: '0.01', title: '21 公里・錯位濃霧廊', room: r001_21,
    hazard: heatHazard(21, 36, '霧氣濃度達峰・幻覺與缺失燈板增多'),
    update: l001Tick(1.2),
    viewMsg: '觀景窗裡，左牆那扇綠色 EXIT 門只是扭曲的黃色壁紙；反而頭頂缺失的燈板上方，露出一條真實的黑縫。',
    enter(g, { first }) {
      if (first) {
        g.say('霧氣濃到幾乎看不清五步以外。走廊的轉角開始變得奇異而歪斜，天花板缺了幾塊燈板，左牆上赫然浮現一扇亮著綠光的門。');
      }
    },
    draw(ctx, t, s, R) {
      drawTornWalls(ctx, R, 6, true);
      // Missing light panel on ceiling revealing a narrow dark gap above
      poly(ctx, missingPanel21, '#080a0c');
      outline(ctx, missingPanel21, shade(R, '#6e6440', 2.4), 2.5);
      // Cool faint air draft lines from the gap
      const gc = P(0, -1, 2.4);
      glow(ctx, gc[0], gc[1] + 6, 44, 'rgba(170,210,235,0.22)');

      // Hallucinated green EXIT door on left wall (fades if already exposed)
      if (!s.flags.l001_fake_exit) {
        poly(ctx, fakeExit21, shade(R, '#585c54', 2.7));
        outline(ctx, fakeExit21, '#3a543c', 2);
        const fsign = wallQuad(-1.12, -0.5, -0.32, 2.45, 3.0);
        poly(ctx, fsign, '#102414');
        const flk = 0.65 + 0.35 * Math.sin(t * 9);
        qtxt(ctx, 'EXIT', fsign, 0.1, 0.15, 0.9, 0.85, `rgba(128,255,152,${flk})`, 12);
      }

      // Drifting hallucinated human silhouette in the mist
      if (!s.flags.l001_silhouette) {
        const a = 0.26 + 0.16 * Math.sin(t * 1.9);
        const sf = P(0.28, 1, 6.2), st = P(0.28, -0.45, 6.2);
        const w = 22;
        ctx.save();
        ctx.fillStyle = `rgba(22,18,8,${a})`;
        ctx.fillRect(sf[0] - w / 2, st[1] + 18, w, sf[1] - st[1] - 18);
        ctx.beginPath(); ctx.arc(sf[0], st[1] + 10, 9, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      paper(ctx, R, note21Quad, 2.35, '#d8c888');
      drawMistOverlay(ctx, t, s, 0.82, 0.65);
      drawBlackoutDip(ctx, t, s, 1.25);
    },
    drawView(ctx) {
      // Through the viewfinder, mark the ceiling gap clearly and cross out the fake exit
      outline(ctx, missingPanel21, 'rgba(180,255,210,0.85)', 2);
      const c = P(0, -1, 2.4);
      txt(ctx, '↑ 狹隙', c[0], c[1] + 24, 'rgba(180,255,210,0.9)', 13);
    },
    hotspots: [
      back('l001_13km', '退回 13 公里剝壁帶'),
      hit('forward', [400, 200, 160, 150], '穿過劇烈翻湧的濃霧（往 31 公里處）', (g) => g.go('l001_31km'), 'go'),
      {
        ...hit('fake_exit', bounds(fakeExit21, 6), '泛著綠光的「EXIT」門', (g) => {
          g.flag('l001_fake_exit');
          g.sanity(-6);
          g.sfx('static');
          g.say('你衝過去一把推開門——掌心只拍在濕漉漉的螢黃色壁紙上。門框像水漬一樣散開了。那是幻覺。');
        }, 'go'),
        when: (s) => !s.flags.l001_fake_exit,
      },
      {
        ...hit('silhouette', [490, 190, 90, 170], '濃霧裡飄忽的人影', (g) => {
          g.flag('l001_silhouette');
          g.sanity(-4);
          g.sfx('static');
          g.say('你喊了一聲。可孤立效應下這裡不會有任何其他生命——你一眨眼，那道人影就化進翻湧的黃霧裡不見了。');
        }),
        when: (s) => !s.flags.l001_silhouette,
      },
      hit('ceiling_gap', bounds(missingPanel21, 12), '缺失燈板上方的狹隙', (g) => {
        g.sfx('clank');
        g.go('l001_gap', {
          msg: '你踩著凸起的牆面借力，硬是擠進燈槽上方的狹隙。身後的金屬隔板猛地闔上——一旦爬進來，就再也回不去 Level 0.01 了。',
        });
      }, 'go'),
      hit('note_21km', bounds(note21Quad, 10), '塞在破燈罩邊的紙條', (g) => g.read('n001_21km')),
    ],
  },

  // Room 5: 31 km (40°C) — Peak heat, crumbling walls, rust smell, unstable noclip seam
  l001_31km: {
    level: '0.01', title: '31 公里・沸熱殘廊', room: r001_31,
    hazard: heatHazard(31, 40, '溫度達峰值 40°C・走廊殘破不堪・空間極度不穩'),
    update: l001Tick(1.45),
    viewMsg: '觀景窗畫面嚴重扭曲，走廊盡頭的牆壁像融化的蠟一樣裂開了一道白縫。',
    enter(g, { first }) {
      if (first) {
        g.say('四十度的熱浪混著刺鼻的鐵鏽味撲面而來。霧氣在劇烈翻湧，整條走廊殘破不堪——你幾乎已經走到了 Level 0.01 能承受的極限。');
      }
    },
    draw(ctx, t, s, R) {
      drawTornWalls(ctx, R, 7, true);
      // Floor void crack
      poly(ctx, voidHole31, '#020202');
      outline(ctx, voidHole31, '#4a2a16', 2.5);
      // Unstable noclipping glitch seam at the far end
      const jitter = Math.sin(t * 28) * 3;
      const seam = glitchSeam31.map(([x, y]) => [x + jitter, y]);
      poly(ctx, seam, '#1a1510');
      ctx.save();
      poly(ctx, seam); ctx.clip();
      for (let i = 0; i < 12; i++) {
        const y = 120 + ((i * 31 + t * 290) % 270);
        ctx.fillStyle = i % 2 ? 'rgba(255,215,120,0.34)' : 'rgba(130,230,255,0.22)';
        ctx.fillRect(360, y, 240, 3 + (i % 3) * 2);
      }
      ctx.restore();
      outline(ctx, seam, s.flags.l001_calmed ? '#a8f0ff' : '#ffb868', 2.5);
      paper(ctx, R, note31Quad, 2.3, '#d4bc7c');
      drawMistOverlay(ctx, t, s, 0.9, 0.95);
      drawBlackoutDip(ctx, t, s, 1.65);
    },
    hotspots: [
      back('l001_21km', '退回 21 公里濃霧廊'),
      hit('note_31km', bounds(note31Quad, 10), '鏽斑牆面上的殘頁附錄', (g) => {
        g.flag('l001_appendix_read');
        g.read('n001_31km');
      }),
      hit('void_pit', bounds(voidHole31, 6), '崩裂的地板黑洞', (g) => {
        g.end('void');
      }, 'go'),
      {
        ...hit('noclip_seam', bounds(glitchSeam31, 10), '極度不穩定的卡出裂縫', (g) => {
          if (!g.s.flags.l001_calmed && !g.s.flags.l001_appendix_read) {
            g.sanity(-5);
            g.sfx('surge');
            return g.say('你朝裂縫撞過去，卻被四十度的高溫熱浪狠狠彈回！樓層太不穩定了——先喝口杏仁水定神，或讀完牆上那頁附錄再嘗試切出。');
          }
          g.sfx('open');
          g.go('l1_arrive', {
            msg: '你咬緊牙關撞進那道劇烈抖動的空間裂縫。四十度的熱浪與螢黃霧氣在身後驟然切斷——你重重摔在冰冷潮濕的水泥地上。',
          });
        }, 'go'),
        use: {
          almond(g) {
            g.take('almond');
            g.flag('l001_calmed');
            g.sanity(20);
            g.sfx('drink');
            g.go('l1_arrive', {
              msg: '你一口灌下杏仁水，趁意識清明的瞬間撞進空間裂縫——熱浪與嗡鳴驟然消失，腳下變成了 Level 1 冰冷的水泥地。',
            });
          },
        },
      },
    ],
  },

  // Room 6: One-way ceiling light-panel gap (燈槽狹隙) -> Level 28 threshold / Level 1 seam
  l001_gap: {
    level: '0.01', title: '燈槽狹隙・單向通道', room: r001_gap, safe: true,
    hazard: () => '狹隙已封閉・無法返回 Level 0.01',
    viewMsg: '觀景窗裡，前方石砌拱縫吹來帶著暴雨氣味的冷風；右側還有一道通往水泥倉庫的微光裂隙。',
    enter(g, { first }) {
      if (first) {
        g.say('狹窄陰涼的夾層裡終於沒有那股悶熱與黃霧。腳下的燈槽口已經徹底封死，回不去了。前方露出冰冷的深色石牆與風聲。');
      }
    },
    draw(ctx, t, s, R) {
      // Sealed floor slot where you climbed up
      poly(ctx, gapSlotFloor, '#22262a');
      outline(ctx, gapSlotFloor, '#687078', 2);
      // Dark stone archway ahead hinting at Level 28
      poly(ctx, gapStoneArch, '#0d1218');
      outline(ctx, gapStoneArch, '#7d8c9c', 3);
      const ac = P(0, 0.1, 7.4);
      glow(ctx, ac[0], ac[1], 75, 'rgba(130,175,210,0.28)');
      // Side concrete seam back into Level 1
      poly(ctx, gapSeamL1, '#2a3036');
      outline(ctx, gapSeamL1, '#98b4c4', 2);
      const sc = P(1.25, 0.2, 3.0);
      glow(ctx, sc[0] - 8, sc[1], 45, 'rgba(210,235,255,0.26)');
      paper(ctx, R, gapNoteQuad, 2.3, '#dce4e8');
    },
    hotspots: [
      hit('sealed_slot', bounds(gapSlotFloor, 8), '已經封閉的燈槽入口', (g) => {
        g.say('底下的燈槽口完全封死了，連一絲黃光都透不上來。一旦爬入狹隙，就無法回到 Level 0.01。');
      }),
      hit('note_gap', bounds(gapNoteQuad, 10), '夾層壁上的刻字便條', (g) => g.read('n001_gap')),
      hit('rest_gap', [140, 410, 190, 66], '在陰涼的夾層裡喘口氣', (g) => {
        if (!once(g, 'l001_gap_rest')) return g.say('你已經喘過氣了。再待在夾層裡也不是辦法，挑一條路出去吧。');
        g.sanity(14);
        g.checkpoint();
        g.say('脫離那片四十度的黃霧後，陰涼的風讓你慢慢回過神來。（清醒度 +14）');
      }),
      hit('to_l28', bounds(gapStoneArch, 8), '通往深色石廊的風口（Level 28）', (g) => {
        g.end('l001_l28');
      }, 'go'),
      hit('to_l1', bounds(gapSeamL1, 8), '滲出冷白微光的水泥縫（切出至 Level 1）', (g) => {
        g.sfx('open');
        g.go('l1_arrive', {
          msg: '你沿著右側的水泥裂縫側身鑽了過去——眼前豁然開朗，潮濕的混凝土倉庫取代了狹窄的夾層。',
        });
      }, 'go'),
    ],
  },
};
