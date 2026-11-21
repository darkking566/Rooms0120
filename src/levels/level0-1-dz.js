// Level 0.1 "險區 / 燃燒的前廳" (The Danger Zone / The Burning Lobby),
// adapted from Backrooms Wiki Fandom ZH (CC BY-SA 3.0).
// 3rd rewrite: Glowfox123 & 火豚; earlier versions: Justauser123, Homie Robot, Egglord,
// UnderPM, ReDcosmic; concept credits: Xeroniphome (Level 0.666), scutoid & Steelsonic (Red Rooms).
// Source: https://backrooms.fandom.com/zh/wiki/Level_0.1
// Room layout, puzzles, notes and interactions are original adaptations for ROOMS0120.
import { H, P, W, bottle, bounds, box, boxRect, faceQuad, paper, poly, seg, shade, wallQuad } from '../render.js';
import { back, clockOf, darkness, glow, hit, once, outline, pal, qtxt, room, txt } from './sublevel-kit.js';

// Entrance in Level 0's low room (l0_low): a small smoking vent on the left wall.
// Per wiki: once crawled into, the entrance behind you vanishes.
export const dzEntryVent = wallQuad(-2.4, 0.25, 0.92, 2.6, 3.45);
export function drawDzEntryVent(ctx, R, t) {
  poly(ctx, dzEntryVent, '#1e0e0a');
  outline(ctx, dzEntryVent, shade(R, '#6e4838', 3.0), 2.5);
  const pulse = 0.55 + 0.35 * Math.sin(t * 3.8);
  const vc = P(-2.4, 0.58, 3.0);
  glow(ctx, vc[0] + 10, vc[1], 46, `rgba(255,90,32,${0.38 * pulse})`);
  // Bent metal slats
  for (let i = 1; i < 5; i++) {
    const y = 0.25 + (0.67 * i) / 5;
    seg(ctx, P(-2.4, y, 2.65), P(-2.4, y, 3.4), shade(R, '#52342a', 3.0), 2);
  }
  // Faint smoke wisp rising from the vent
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.55 + i / 3) % 1;
    const sx = vc[0] + 12 + p * 34;
    const sy = vc[1] - p * 44;
    ctx.save();
    ctx.fillStyle = `rgba(90,50,35,${0.24 * (1 - p)})`;
    ctx.beginPath(); ctx.arc(sx, sy, 8 + p * 16, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// =====================================================================
// LEVEL 0.1 — 險區 / 燃燒的前廳 (The Danger Zone) — 10 playable rooms
// =====================================================================
const pVent = pal('#3a2520', '#241612', '#2c1b17', '#0e0604', '#ff8844');
const pLobby = pal('#9e3c22', '#7a2c1a', '#592316', '#1c0804', '#ff8240');
const pCubic = pal('#88321c', '#632214', '#4a1b10', '#160603', '#f07036');
const pCeil = pal('#3d261e', '#1c100c', '#2d1a14', '#090403', '#c86034');
const pIgnit = pal('#b83e18', '#8c2810', '#601c0c', '#260802', '#ffaa38');
const pOutpost = pal('#4c2d24', '#301c16', '#281814', '#120806', '#e88248');
const pOutage = pal('#8a2e1c', '#5e1e12', '#42160e', '#100402', '#ff6430');
const pDeadEnd = pal('#520b0c', '#2c0405', '#240506', '#0a0101', '#c82020');
const pSanct = pal('#423834', '#2c2624', '#2a2420', '#0e0c0a', '#d8c8a8');
const pCross = pal('#7d4c2c', '#623a22', '#4c301c', '#18100a', '#ffd290');

const dzFlick = (t) => 0.88 + 0.12 * Math.sin(t * 44) * Math.sin(t * 9.3);

const rVent = room(pVent, { hw: 0.9, depth: 7.5, fogEnd: 8.5, wallTex: 'concrete', floorTex: 'concrete', baseboard: false, lights: [] });
const rLobby = room(pLobby, {
  hw: 1.5, depth: 8, fogEnd: 9.5, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.8, 4.0, 6.2], flickerLights: [1, 2], flick: dzFlick,
  openings: [{ side: -1, z1: 2.5, z2: 3.5, top: -0.58 }, { side: 1, z1: 2.6, z2: 3.6, top: -0.58 }],
});
const rCubic = room(pCubic, {
  hw: 1.25, depth: 7.5, fogEnd: 8.5, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [2.0, 5.2], flickerLights: [1], flick: dzFlick,
});
const rCeil = room(pCeil, {
  hw: 1.7, depth: 7, fogEnd: 7.5, wallTex: 'concrete', floorTex: 'concrete', baseboard: false, lights: [],
});
const rIgnit = room(pIgnit, {
  hw: 1.35, depth: 8.5, fogEnd: 8.0, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.8, 4.2, 6.6], flickerLights: [0, 1, 2], flick: (t) => 0.84 + 0.16 * Math.sin(t * 58),
});
const rOutpost = room(pOutpost, {
  hw: 1.6, depth: 7.5, fogEnd: 9.5, wallTex: 'concrete', floorTex: 'carpet', tiles: true,
  lights: [2.1, 4.8], flickerLights: [1], flick: dzFlick,
});
const rOutage = room(pOutage, {
  hw: 1.3, depth: 9.5, fogEnd: 8.5, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [1.8, 4.2, 6.8], flickerLights: [0, 1, 2], flick: dzFlick,
  openings: [{ side: -1, z1: 4.0, z2: 5.0, top: -0.58 }],
});
const rDeadEnd = room(pDeadEnd, {
  hw: 1.15, depth: 9, fogEnd: 7.0, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [2.2, 5.2], flick: (t) => 0.72 + 0.08 * Math.sin(t * 8),
});
const rSanct = room(pSanct, {
  hw: 1.2, depth: 5.5, fogEnd: 10, wallTex: 'concrete', floorTex: 'concrete', baseboard: false,
  lights: [2.4],
});
const rCross = room(pCross, {
  hw: 1.7, depth: 8.5, fogEnd: 10.5, stripes: true, tiles: true, floorTex: 'carpet',
  lights: [2.0, 4.6, 7.0], flick: dzFlick,
  openings: [{ side: -1, z1: 2.4, z2: 3.4, top: -0.58 }, { side: 1, z1: 2.4, z2: 3.4, top: -0.58 }],
});

// Timed Power Outage cycle in dz_outage: 3.4s blackout every 10s
export const dzOutageNow = (s) => (clockOf(s) % 10.0) < 3.4;

// Dense combustion smoke particles + double-volume fluorescent hum drain
function dzSmokeTick(rate = 1) {
  return (g, dt) => {
    const f = g.s.flags;
    const mult = f.dz_masked ? 0.45 : 1;
    f.dz_smoke_t = (f.dz_smoke_t || 0) + dt * rate * mult;
    if (f.dz_smoke_t >= 3.6) {
      f.dz_smoke_t -= 3.6;
      g.sanity(-1);
    }
  };
}

const dzHazard = (desc) => (s) =>
  `${desc}${s.flags.dz_masked ? '（已戴防塵口罩・煙塵傷害減半）' : '・空氣充滿焦糊煙塵'}`;

// Visual overlay: drifting soot/ember particles & crimson-orange smoke haze
function drawSmokeEmbers(ctx, t, density = 0.45, embers = 8) {
  ctx.save();
  for (let i = 0; i < 6; i++) {
    const x = ((i * 191 + t * (16 + i * 3)) % (W + 280)) - 140;
    const y = 170 + (i * 67) % 270;
    const r = 130 + (i % 3) * 30;
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(190,68,26,${0.2 * density})`);
    gr.addColorStop(1, 'rgba(190,68,26,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < embers; i++) {
    const p = (t * (0.28 + (i % 4) * 0.08) + i * 0.17) % 1;
    const ex = ((i * 113 + Math.sin(t * 2 + i) * 28) % W + W) % W;
    const ey = H - p * H;
    ctx.fillStyle = i % 2 ? `rgba(255,175,65,${0.8 * (1 - p)})` : `rgba(255,95,35,${0.7 * (1 - p)})`;
    ctx.fillRect(ex, ey, 3, 3);
  }
  ctx.restore();
}

// Draw roaring flames along the floor/wall
function drawFlames(ctx, t, x1, x2, z, height = 0.55) {
  ctx.save();
  for (let i = 0; i < 10; i++) {
    const fx = x1 + ((x2 - x1) * i) / 9;
    const h = height * (0.65 + 0.35 * Math.sin(t * 14 + i * 1.7));
    const baseL = P(fx - 0.12, 1, z);
    const baseR = P(fx + 0.12, 1, z);
    const tip = P(fx + Math.sin(t * 10 + i) * 0.06, 1 - h, z);
    poly(ctx, [baseL, tip, baseR], i % 2 ? 'rgba(255,110,25,0.78)' : 'rgba(255,185,55,0.72)');
  }
  const mid = P((x1 + x2) / 2, 0.7, z);
  glow(ctx, mid[0], mid[1], 140, 'rgba(255,115,35,0.34)');
  ctx.restore();
}

// Shared room geometries
const ventRearSeal = faceQuad(-0.6, -0.5, 0.6, 0.7, 7.45);
const ventTagQuad = wallQuad(-0.9, -0.1, 0.28, 2.0, 2.55);

const lobbyLeftDoor = wallQuad(-1.5, -0.58, 1, 2.5, 3.5);
const lobbyRightDoor = wallQuad(1.5, -0.58, 1, 2.6, 3.6);
const lobbyAlarm = [P(-0.22, -1, 2.2), P(0.22, -1, 2.2), P(0.22, -1, 2.65), P(-0.22, -1, 2.65)];

const cubCrate = { x1: -1.12, x2: -0.45, y1: 0.55, y2: 1, z1: 2.3, z2: 2.95, color: '#5c3c28', top: '#734b32', edge: true };
const cubExtBox = { x1: 0.72, x2: 1.05, y1: 0.48, y2: 1, z1: 2.1, z2: 2.45, color: '#b5281c', top: '#d63a2a', edge: true };
const cubMaskBox = { x1: -0.25, x2: 0.25, y1: 0.84, y2: 1, z1: 2.0, z2: 2.35, color: '#7a7e82', top: '#9ea4aa', edge: true };
const cubPainPos = { p: P(0.55, 1, 2.9), z: 2.9 };
const cubCeilHole = [P(-0.36, -1, 2.8), P(0.36, -1, 2.8), P(0.36, -1, 3.6), P(-0.36, -1, 3.6)];

const ceilNoteQuad = wallQuad(-1.7, -0.22, 0.2, 2.0, 2.6);
const ceilDropQuad = [P(0.45, 1, 2.2), P(1.25, 1, 2.2), P(1.25, 1, 3.0), P(0.45, 1, 3.0)];
const ceilShadowRect = [395, 150, 150, 155];

const ignitLampQuad = [P(-0.36, -1, 2.0), P(0.36, -1, 2.0), P(0.36, -1, 3.0), P(-0.36, -1, 3.0)];
const ignitNoteQuad = wallQuad(-1.35, -0.24, 0.18, 2.0, 2.6);
const ignitFireWall = faceQuad(-0.95, -0.4, 0.95, 1, 5.2);

const outpostGear = { x1: -1.15, x2: -0.4, y1: 0.45, y2: 1, z1: 2.3, z2: 3.0, color: '#2b2422', top: '#3c322e', edge: true };
const outpostNoteQuad = wallQuad(-1.6, -0.24, 0.18, 1.9, 2.5);
const outpostVentSlot = wallQuad(1.6, 0.18, 0.88, 2.2, 3.1);
const outpostGlassDoor = faceQuad(-0.46, -0.62, 0.46, 1, 7.45);

const outageHideVent = wallQuad(1.3, 0.2, 0.88, 1.8, 2.65);
const outageDeadDoor = wallQuad(-1.3, -0.58, 1, 4.0, 5.0);
const outageCrack = [P(-0.85, 1, 2.2), P(-0.18, 1, 2.2), P(-0.18, 1, 3.1), P(-0.85, 1, 3.1)];

const deadRadioBox = { x1: 0.35, x2: 0.85, y1: 0.78, y2: 1, z1: 2.1, z2: 2.55, color: '#2b2022', top: '#3c2e30', edge: true };

const sanctBarrel = { x1: -0.95, x2: -0.35, y1: 0.32, y2: 1, z1: 2.2, z2: 2.85, color: '#385d82', top: '#4a76a2', edge: true };
const sanctNoteQuad = wallQuad(1.2, -0.22, 0.18, 2.0, 2.6);
const sanctUpHole = [P(-0.35, -1, 2.0), P(0.35, -1, 2.0), P(0.35, -1, 2.7), P(-0.35, -1, 2.7)];

const crossTo001 = wallQuad(-1.7, -0.58, 1, 2.4, 3.4);
const crossTo02 = wallQuad(1.7, -0.58, 1, 2.4, 3.4);
const crossTo07 = wallQuad(-1.7, -0.52, 0.95, 4.8, 5.9);
const crossToL1 = faceQuad(-0.48, -0.58, 0.48, 1, 8.45);
const crossNoteQuad = wallQuad(1.7, -0.22, 0.18, 1.5, 2.0);

export const L01_DZ_SCENES = {
  // Room 1: Entry Vent (no way back to Level 0)
  dz_vent: {
    level: '0.1-dz', title: '狹窄通風管道', room: rVent,
    hazard: () => '身後入口已消失・只能往前爬出管道',
    viewMsg: '觀景窗裡，管道盡頭溢出濃烈的紅橙火光與翻滾煙塵。',
    enter(g, { first }) {
      if (first) {
        g.say('你鑽進 Level 0 牆邊那道窄小的通風口。回頭一看，來時的格柵已經消失成實心金屬壁——前面傳來兩倍震耳的嗡鳴聲與刺鼻焦糊味。');
      }
    },
    draw(ctx, t, s, R) {
      // Glowing red-orange exit grille ahead
      poly(ctx, ventRearSeal, '#2a0c06');
      outline(ctx, ventRearSeal, '#8a3e24', 3);
      const gc = P(0, 0.1, 7.4);
      glow(ctx, gc[0], gc[1], 115, 'rgba(255,95,30,0.52)');
      paper(ctx, R, ventTagQuad, 2.2, '#e2d2b0');
      drawSmokeEmbers(ctx, t, 0.3, 5);
    },
    hotspots: [
      hit('sealed_entry', [330, 470, 300, 70], '已經消失的身後入口', (g) => {
        g.say('身後的金屬壁封得死死的。一旦鑽進這道通風口，就再也無法回到 Level 0 了。');
      }, 'look'),
      hit('vent_note', bounds(ventTagQuad, 10), '管壁上燻黑的 M.E.G. 警告牌', (g) => g.read('n_dz_entry')),
      hit('forward', bounds(ventRearSeal, 10), '推開前方的紅光通風口', (g) => g.go('dz_lobby'), 'go'),
    ],
  },

  // Room 2: Red-Orange Core Lobby (Hub)
  dz_lobby: {
    level: '0.1-dz', title: '紅橙前廳・核心區', room: rLobby,
    hazard: dzHazard('生存難度 Class 5・嗡鳴聲達 Level 0 兩倍'),
    update: dzSmokeTick(0.9),
    viewMsg: '觀景窗裡，牆紙在紅橙光下滲出暗紅斑痕，煙霧警報器的紅燈完全沒亮。',
    enter(g, { first }) {
      if (first) {
        g.say('你從通風口跌落進一片紅橙色的煉獄。地毯黏滑又粗糙，角落長著霉菌，震耳欲聾的日光燈嗡鳴夾雜著烈火噼啪聲。這裡就是「險區」。');
      }
    },
    draw(ctx, t, s, R) {
      // Non-functional ceiling smoke alarm
      poly(ctx, lobbyAlarm, shade(R, '#b8b2a8', 2.4));
      outline(ctx, lobbyAlarm, '#4a362c', 2);
      // Doorway labels
      const lc = P(-1.5, -0.68, 3.0), rc = P(1.5, -0.68, 3.0);
      txt(ctx, '雜物隔間', lc[0] + 16, lc[1], '#ffd4a0', 11);
      txt(ctx, '驟燃區', rc[0] - 16, rc[1], '#ff9b60', 11);
      // Warm fire glow from right doorway
      glow(ctx, rc[0] - 20, rc[1] + 95, 95, 'rgba(255,105,30,0.38)');
      drawSmokeEmbers(ctx, t, 0.52, 10);
    },
    hotspots: [
      hit('to_cubicles', bounds(lobbyLeftDoor, 6), '左側狹窄的雜物隔間', (g) => g.go('dz_cubicles'), 'go'),
      hit('to_ignition', bounds(lobbyRightDoor, 6), '右側飄出濃烈焦味的走廊', (g) => g.go('dz_ignition'), 'go'),
      hit('forward', [400, 200, 160, 150], '往深處燈光閃滅的長廊走', (g) => g.go('dz_outage'), 'go'),
      hit('smoke_alarm', bounds(lobbyAlarm, 10), '天花板上的煙霧警報器', (g) => {
        g.flag('dz_alarm_hit');
        g.say('形同虛設的煙霧警報器。濃煙滾滾卻一聲不響，你試著扯動它也紋絲不動。');
      }),
    ],
  },

  // Room 3: Cluttered Supply Cubicles (Resources, Extinguisher, Respirator, Liquid Pain trap)
  dz_cubicles: {
    level: '0.1-dz', title: '雜物隔間・補給狹廊', room: rCubic,
    hazard: dzHazard('狹窄隔間・可燃物與鏽蝕金屬遍布'),
    update: dzSmokeTick(1.0),
    viewMsg: '觀景窗裡，天花板脫落吊頂上方黑洞裡有一道伏著的身影。',
    enter(g, { first }) {
      if (first) {
        g.say('比核心區更窄、更亂的隔間走廊。可燃雜物與生鏽鐵片堆滿角落，這裡是險區裡唯一能翻出補給的地方——但也可能藏著實體設下的陷阱。');
      }
    },
    draw(ctx, t, s, R) {
      // Wooden supply crate with plank seams, corner straps & stencil
      box(ctx, R, cubCrate);
      const cf = faceQuad(cubCrate.x1, cubCrate.y1, cubCrate.x2, cubCrate.y2, cubCrate.z1);
      const [cx, cy, cw, ch] = bounds(cf);
      ctx.save();
      ctx.strokeStyle = 'rgba(28,16,10,0.65)'; ctx.lineWidth = 2;
      for (let i = 1; i <= 2; i++) {
        const y = cy + (ch * i) / 3;
        ctx.beginPath(); ctx.moveTo(cx + 3, y); ctx.lineTo(cx + cw - 3, y); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(130,96,66,0.45)'; ctx.lineWidth = 3;
      ctx.strokeRect(cx + 5, cy + 5, cw - 10, ch - 10);
      ctx.fillStyle = 'rgba(220,195,155,0.65)'; ctx.font = '700 10px ui-monospace, monospace'; ctx.textAlign = 'center';
      ctx.fillText('M.E.G. 補給', cx + cw / 2, cy + ch * 0.56);
      ctx.restore();

      // Cylindrical red fire extinguisher with valve, handle & hose (not a cube!)
      if (!s.flags.dz_extinguisher) {
        const eb = P(0.88, 1, 2.25);
        const eh = 92, ew = 34;
        ctx.save();
        // Floor shadow
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath(); ctx.ellipse(eb[0], eb[1] + 2, ew * 0.72, 7, 0, 0, Math.PI * 2); ctx.fill();
        // Cylinder body with metallic highlight
        const gr = ctx.createLinearGradient(eb[0] - ew / 2, 0, eb[0] + ew / 2, 0);
        gr.addColorStop(0, '#78140d'); gr.addColorStop(0.32, '#d83424'); gr.addColorStop(0.65, '#a81e14'); gr.addColorStop(1, '#580d08');
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.roundRect(eb[0] - ew / 2, eb[1] - eh * 0.78, ew, eh * 0.78, [12, 12, 4, 4]); ctx.fill();
        ctx.strokeStyle = '#3a0a06'; ctx.lineWidth = 1.5; ctx.stroke();
        // White instruction label
        ctx.fillStyle = 'rgba(235,228,212,0.86)';
        ctx.fillRect(eb[0] - ew * 0.42, eb[1] - eh * 0.52, ew * 0.84, eh * 0.24);
        ctx.fillStyle = '#9c1c14'; ctx.fillRect(eb[0] - ew * 0.34, eb[1] - eh * 0.47, ew * 0.68, 4);
        // Brass neck, squeeze handle & pressure gauge
        ctx.fillStyle = '#c4a24a'; ctx.fillRect(eb[0] - 5, eb[1] - eh * 0.88, 10, 10);
        ctx.fillStyle = '#1e2024';
        ctx.fillRect(eb[0] - 7, eb[1] - eh * 0.96, 22, 6);
        ctx.fillRect(eb[0] + 6, eb[1] - eh * 0.9, 12, 4);
        // Curved black discharge hose & nozzle
        ctx.strokeStyle = '#181a1e'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(eb[0] - 5, eb[1] - eh * 0.86);
        ctx.quadraticCurveTo(eb[0] - ew * 0.95, eb[1] - eh * 0.72, eb[0] - ew * 0.78, eb[1] - eh * 0.25);
        ctx.stroke();
        ctx.fillStyle = '#26282e';
        ctx.beginPath(); ctx.moveTo(eb[0] - ew * 0.88, eb[1] - eh * 0.28);
        ctx.lineTo(eb[0] - ew * 0.66, eb[1] - eh * 0.28);
        ctx.lineTo(eb[0] - ew * 0.6, eb[1] - eh * 0.1);
        ctx.lineTo(eb[0] - ew * 0.94, eb[1] - eh * 0.1); ctx.closePath(); ctx.fill();
        ctx.restore();
      }

      // Dust respirator mask lying on the carpet (curved cup + twin filter pods + straps)
      if (!s.flags.dz_masked) {
        const mp = P(0, 0.96, 2.15);
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.42)';
        ctx.beginPath(); ctx.ellipse(mp[0], mp[1] + 7, 36, 10, 0, 0, Math.PI * 2); ctx.fill();
        // Elastic head straps
        ctx.strokeStyle = '#484a50'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.ellipse(mp[0] - 18, mp[1] - 4, 24, 9, -0.25, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(mp[0] + 18, mp[1] - 4, 24, 9, 0.25, 0, Math.PI * 2); ctx.stroke();
        // Molded grey mask cup
        ctx.fillStyle = '#a4acb4';
        ctx.beginPath(); ctx.ellipse(mp[0], mp[1] - 2, 22, 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#4c545c'; ctx.lineWidth = 2; ctx.stroke();
        // Metal nose bridge & exhalation valve
        ctx.fillStyle = '#d4dce4'; ctx.fillRect(mp[0] - 8, mp[1] - 13, 16, 4);
        ctx.fillStyle = '#3a4048'; ctx.beginPath(); ctx.arc(mp[0], mp[1] + 1, 6, 0, Math.PI * 2); ctx.fill();
        // Twin side filter cartridges
        for (const dx of [-21, 21]) {
          ctx.fillStyle = '#5c646c';
          ctx.beginPath(); ctx.ellipse(mp[0] + dx, mp[1] + 2, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#2c3238'; ctx.lineWidth = 1.5; ctx.stroke();
        }
        ctx.restore();
      }

      // Suspicious dark-red Liquid Pain bottle
      {
        const bx = cubPainPos.p[0], by = cubPainPos.p[1], h = 34, w = 13;
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath(); ctx.ellipse(bx, by + 1, 10, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#6e1410';
        ctx.beginPath(); ctx.roundRect(bx - w / 2, by - h * 0.72, w, h * 0.72, 3); ctx.fill();
        ctx.fillRect(bx - 3, by - h, 6, h * 0.3);
        ctx.fillStyle = '#d64830'; ctx.fillRect(bx - w / 2 + 1, by - h * 0.5, w - 2, h * 0.25);
        ctx.fillStyle = '#281818'; ctx.fillRect(bx - 4, by - h * 1.05, 8, 4);
        ctx.restore();
      }
      // Missing ceiling tile revealing dark space above
      poly(ctx, cubCeilHole, '#070403');
      outline(ctx, cubCeilHole, shade(R, '#6e3824', 3.2), 2);
      drawSmokeEmbers(ctx, t, 0.55, 8);
    },
    hotspots: [
      back('dz_lobby', '退回紅橙前廳'),
      {
        ...hit('extinguisher', boxRect(cubExtBox, 8), '角落的乾粉滅火器', (g) => {
          if (!once(g, 'dz_extinguisher')) return;
          g.give('extinguisher', '一支還能用的乾粉滅火器！雖然無法徹底撲滅驟燃，但足以暫時壓制火勢開出一條路。');
        }, 'take'),
        when: (s) => !s.flags.dz_extinguisher,
      },
      {
        ...hit('mask', boxRect(cubMaskBox, 8), '遺落的防塵口罩', (g) => {
          if (!once(g, 'dz_masked')) return;
          g.sfx('pick');
          g.say('你戴上防塵口罩。刺鼻的焦糊煙塵終於被濾掉大半，呼吸順暢多了。');
        }, 'take'),
        when: (s) => !s.flags.dz_masked,
      },
      hit('supply_crate', boxRect(cubCrate, 6), '雜物堆裡的補給箱', (g) => {
        if (!once(g, 'dz_crate_loot')) return g.say('箱子裡只剩沾滿黑灰的腐敗罐頭——沾了這層樓的燃燒顆粒會食物中毒，不能吃。');
        g.give('almond', '你在箱底翻出一瓶密封完好的杏仁水，旁邊還有幾罐沾滿煙塵的壞掉罐頭。');
      }),
      hit('liquid_pain', [cubPainPos.p[0] - 20, cubPainPos.p[1] - 42, 40, 46], '標籤剝落的紅褐色玻璃瓶', (g) => {
        if (once(g, 'dz_liquid_pain')) {
          g.sanity(-5);
          g.say('瓶裡裝的是滾燙腥臭的「液態痛苦」——還好你沒喝下去，光是濺到指尖就灼痛得讓人發暈！');
        } else {
          g.say('是危險的液態痛苦與腰果水陷阱，千萬別碰。');
        }
      }),
      hit('ceil_hole', bounds(cubCeilHole, 10), '吊頂瓷磚脫落露出的上方暗層', (g) => {
        g.go('dz_ceiling', { msg: '你踩著雜物箱爬進吊頂上方的黑暗空間，滿鼻子都是嗆人的灰塵與異味。' });
      }, 'go'),
    ],
  },

  // Room 4: Collapsed Ceiling Tile Dark Space
  dz_ceiling: {
    level: '0.1-dz', title: '脫落吊頂・上方暗層', room: rCeil,
    hazard: dzHazard('吊頂上方暗層・實體常在此埋伏突襲'),
    update: dzSmokeTick(1.15),
    viewMsg: '觀景窗裡，前方鋼樑陰影裡蹲著一隻蠢蠢欲動的敵對實體。',
    enter(g, { first }) {
      if (first) {
        g.say('吊頂上方的夾層漆黑而悶臭，腳下是隨時會碎裂的紅光燈管與天花板殘片。遠處樑柱後傳來細碎的抓撓聲。');
      }
    },
    draw(ctx, t, s, R) {
      // Drop-down hole into burned-out safe alcove
      poly(ctx, ceilDropQuad, '#141110');
      outline(ctx, ceilDropQuad, '#8a7a68', 2);
      const dc = P(0.85, 1, 2.6);
      txt(ctx, '↓ 焦黑隔間', dc[0], dc[1] - 10, '#d8c8b0', 11);
      // Lurking shadow on beam
      const a = 0.5 + 0.25 * Math.sin(t * 2.8);
      ctx.save();
      ctx.fillStyle = `rgba(10,4,2,${a})`;
      ctx.beginPath(); ctx.ellipse(470, 225, 38, 62, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,90,40,${0.4 * a})`;
      ctx.fillRect(456, 200, 6, 4); ctx.fillRect(478, 200, 6, 4);
      ctx.restore();
      paper(ctx, R, ceilNoteQuad, 2.3, '#d8cab4');
      drawSmokeEmbers(ctx, t, 0.35, 4);
    },
    hotspots: [
      back('dz_cubicles', '退回雜物隔間'),
      hit('recon_note', bounds(ceilNoteQuad, 10), '快速偵察小組遺留的筆記', (g) => g.read('n_dz_recon')),
      hit('lurker', ceilShadowRect, '樑柱陰影裡的雙眼', (g) => {
        g.flag('dz_ceil_seen');
        g.scare('dz_cubicles', '暗層裡的實體猛地從樑柱撲下來！你滾回下方的雜物隔間，手臂被碎玻璃劃出一道血痕。', 16, 'figure');
      }),
      hit('drop_sanctuary', bounds(ceilDropQuad, 8), '跳進下方可燃物已燃盡的狹小隔間', (g) => {
        g.go('dz_sanctuary', { msg: '你從裂開的吊頂輕聲落進一間焦黑狹小的隔間——火早就燒盡了，裡面出奇地安靜。' });
      }, 'go'),
    ],
  },

  // Room 5: Sudden Ignition Zone (50°C+, 120°C lamp, Kagerou / Salamander, Extinguisher puzzle)
  dz_ignition: {
    level: '0.1-dz', title: '驟燃區・五十度熱浪', room: rIgnit,
    hazard: (s) => (s.flags.dz_fire_suppressed
      ? '乾粉暫時壓制了局部火勢・快穿過前往前方拐角！'
      : '驟燃爆發！溫度突破 50°C・燈罩達 120°C・能見度驟降'),
    update: dzSmokeTick(1.4),
    viewMsg: '觀景窗裡，翻湧的熱朦朧中正浮現一隻由烈焰凝成的蠑螈輪廓——陽炎即將具現化！',
    enter(g, { first }) {
      if (first) {
        g.say('刺鼻焦味驟然濃烈，室溫瞬間飆破五十度！頭頂燈罩發出 120°C 的噼啪脆響，整條地毯突然爆燃成火海，滾燙火星四處飛濺！');
      }
    },
    draw(ctx, t, s, R) {
      // Crackling 120°C fluorescent lamp
      poly(ctx, ignitLampQuad, '#ffdf90');
      outline(ctx, ignitLampQuad, '#ff6820', 3);
      const lc = P(0, -1, 2.5);
      glow(ctx, lc[0], lc[1] + 15, 110, 'rgba(255,140,40,0.55)');
      // Roaring fire wall (suppressed into white powder haze once extinguisher used)
      if (!s.flags.dz_fire_suppressed) {
        drawFlames(ctx, t, -1.2, 1.2, 5.2, 0.85);
      } else {
        drawFlames(ctx, t, -1.2, -0.55, 5.2, 0.35);
        drawFlames(ctx, t, 0.55, 1.2, 5.2, 0.35);
        const pc = P(0, 0.7, 5.2);
        glow(ctx, pc[0], pc[1], 95, 'rgba(225,225,220,0.32)');
      }
      paper(ctx, R, ignitNoteQuad, 2.3, '#e8cfa0');
      drawSmokeEmbers(ctx, t, 0.72, 18);
    },
    hotspots: [
      back('dz_lobby', '撤回紅橙前廳'),
      hit('kagerou_shimmer', bounds(ignitLampQuad, 12), '120°C 爆裂燈罩與下方熱朦朧', (g) => {
        g.sanity(-5);
        g.sfx('steam');
        g.closeup('dz_kagerou_cu', {
          msg: '熱朦朧裡浮現出一隻烈火凝成的蠑螈——「陽炎 / 沙羅曼達」！它試圖把活物變成助燃的柴火，絕不能與它交鋒！',
        });
      }),
      hit('note_0666', bounds(ignitNoteQuad, 10), '焦邊的「Level 0.666」舊檔殘頁', (g) => g.read('n_dz_ignition')),
      {
        ...hit('fire_wall', bounds(ignitFireWall, 6), '封死走廊的驟燃火牆', (g) => {
          if (g.s.flags.dz_fire_suppressed) return g.go('dz_outpost');
          g.sanity(-10);
          g.sfx('steam');
          g.say('滾燙的烈焰與火星把你逼退回來！沒有滅火器暫時壓制局部火勢，根本過不去。');
        }, 'go'),
        use: {
          extinguisher(g) {
            if (g.s.flags.dz_fire_suppressed) return g.go('dz_outpost');
            g.take('extinguisher');
            g.flag('dz_fire_suppressed');
            g.sfx('steam');
            g.say('你拉開插銷噴出大片白色乾粉！火勢只是被暫時壓低了一截——趁它還沒重新吞沒走廊，快衝過去！');
          },
        },
      },
    ],
  },

  // Room 6: Scorched 12-Person Outpost Ruins & Glass Door to Level 1.1
  dz_outpost: {
    level: '0.1-dz', title: '十二人據點・焦黑殘骸', room: rOutpost,
    hazard: () => '驟燃曾在此爆發・實體暫避此處・餘溫未退',
    update: dzSmokeTick(0.4),
    viewMsg: '觀景窗裡，正前方那扇格格不入的透明玻璃門後映出明亮潔淨的走廊。',
    enter(g, { first }) {
      if (first) {
        g.say('這裡曾是十二名資深探險者搭建據點的拐角，如今只剩熔化的設備與焦黑牆壁。因為已經爆發過驟燃，這塊區域反而鮮有實體靠近。');
      }
    },
    draw(ctx, t, s, R) {
      // Melted comms console with cracked amber screen & bent antenna
      box(ctx, R, outpostGear);
      const gf = faceQuad(outpostGear.x1, outpostGear.y1, outpostGear.x2, outpostGear.y2, outpostGear.z1);
      const [gx, gy, gw, gh] = bounds(gf);
      ctx.save();
      ctx.fillStyle = '#120806'; ctx.fillRect(gx + 10, gy + 10, gw - 20, gh * 0.46);
      ctx.strokeStyle = '#7c3420'; ctx.lineWidth = 1.5; ctx.strokeRect(gx + 10, gy + 10, gw - 20, gh * 0.46);
      ctx.fillStyle = Math.sin(t * 6) > 0 ? '#ff6a38' : '#702412';
      ctx.fillRect(gx + 16, gy + 18, 18, 4); ctx.fillRect(gx + 16, gy + 26, 30, 3);
      // Bent antenna on top
      ctx.strokeStyle = '#5c4e48'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(gx + gw * 0.78, gy); ctx.lineTo(gx + gw * 0.88, gy - 32); ctx.stroke();
      ctx.restore();
      // Narrow vent slot leading to burned-out safe alcove
      poly(ctx, outpostVentSlot, '#141210');
      outline(ctx, outpostVentSlot, '#7a6858', 2);
      const vc = P(1.6, 0.12, 2.65);
      txt(ctx, '窄縫通風口', vc[0] - 26, vc[1], '#d4c4b0', 10);
      // Glass door leading to Level 1.1
      poly(ctx, outpostGlassDoor, 'rgba(185,225,240,0.34)');
      outline(ctx, outpostGlassDoor, '#d8f0ff', 3);
      const gc = P(0, 0.15, 7.4);
      glow(ctx, gc[0], gc[1], 88, 'rgba(195,235,255,0.35)');
      paper(ctx, R, outpostNoteQuad, 2.2, '#d6c8b0');
      drawSmokeEmbers(ctx, t, 0.28, 4);
    },
    hotspots: [
      back('dz_ignition', '退回驟燃區'),
      hit('melted_gear', boxRect(outpostGear, 8), '熔化的通訊與偵察設備', (g) => {
        g.closeup('dz_melted_cu', {
          msg: '螢幕融了一半，仍殘留著最後發出的斷續簡訊——險區裡語音會徹底失真，所有後室相關網站也全被攔截。',
        });
      }),
      hit('outpost_log', bounds(outpostNoteQuad, 10), '十二人小隊的最後紀錄', (g) => g.read('n_dz_outpost')),
      hit('to_sanctuary', bounds(outpostVentSlot, 8), '僅容人擠進的窄縫通風口', (g) => {
        g.go('dz_sanctuary', { msg: '你側身擠過窄縫。這道縫隙剛好能擋住實體鑽進來。' });
      }, 'go'),
      hit('glass_door', bounds(outpostGlassDoor, 8), '盡頭透著亮光的玻璃門（Level 1.1）', (g) => {
        g.end('dz_glass');
      }, 'go'),
    ],
  },

  // Room 7: Power Outage & Metabolism Corridor
  dz_outage: {
    level: '0.1-dz', title: '停電崩解長廊', room: rOutage,
    hazard: (s) => (dzOutageNow(s)
      ? '【停電發生中】燈光全滅・實體群聚逼近！快躲進右側小通風口！'
      : '電力極不穩定・趁燈還亮著通過，或提防左邊深紅入口'),
    update: dzSmokeTick(1.0),
    viewMsg: (s) => (dzOutageNow(s)
      ? '觀景窗在停電中充滿雪花雜訊，四周全是亮著白光的眼睛與腳步聲！'
      : '觀景窗裡，左側深紅門洞的訊號讀數直接掉成 0%。'),
    enter(g, { first }) {
      if (first) {
        g.say('這條長廊的紅光燈管每隔幾秒就會整片熄滅，陷入「停電」。左側有一道更深、更暗的猩紅轉角，地面裂縫正一片片剝落進虛空。');
      }
    },
    draw(ctx, t, s, R) {
      const dark = dzOutageNow(s);
      // Small hiding vent on right wall
      poly(ctx, outageHideVent, '#120c0a');
      outline(ctx, outageHideVent, dark ? '#ffd280' : '#7a5240', dark ? 3 : 2);
      const hv = P(1.3, 0.14, 2.2);
      txt(ctx, dark ? '快躲這裡！' : '小通風口', hv[0] - 26, hv[1], dark ? '#ffe090' : '#cfa890', 11);
      // Deep crimson Dead End opening on left wall
      poly(ctx, outageDeadDoor, 'rgba(80,4,8,0.88)');
      outline(ctx, outageDeadDoor, '#901018', 2);
      const dd = P(-1.3, -0.66, 4.5);
      txt(ctx, '深紅轉角', dd[0] + 22, dd[1], '#ff6870', 11);
      // Floor cracking into The Void ("metabolism")
      poly(ctx, outageCrack, '#020202');
      outline(ctx, outageCrack, '#5a2418', 2);
      drawSmokeEmbers(ctx, t, 0.5, 9);
      if (dark) {
        darkness(ctx, 0.88, [[hv[0] - 18, hv[1] + 50, 120]]);
      }
    },
    hotspots: [
      back('dz_lobby', '退回紅橙前廳'),
      hit('hide_vent', bounds(outageHideVent, 10), '牆邊僅容一人藏身的小通風口', (g) => {
        g.flag('dz_hid_outage');
        if (dzOutageNow(g.s)) {
          g.sfx('clank');
          g.say('你縮進窄小的通風口屏住呼吸。成群的實體在漆黑的走廊裡衝撞咆哮，好在牠們擠不進來……等燈亮回來再動身！');
        } else {
          g.say('一個窄小的通風口。要是待會兒突然停電，立刻躲進這裡就能避開成群的實體。');
        }
      }),
      hit('to_deadend', bounds(outageDeadDoor, 6), '左側深邃壓抑的猩紅轉角', (g) => {
        g.go('dz_deadend');
      }, 'go'),
      hit('void_crack', bounds(outageCrack, 6), '正在剝落墜入虛空的裂縫', (g) => {
        g.end('void');
      }, 'go'),
      hit('forward', [400, 200, 160, 150], '趁燈亮著往前衝向深處長廊', (g) => {
        if (dzOutageNow(g.s)) {
          return g.scare('dz_lobby', '你在停電的黑暗裡貿然往前衝——四面八方的實體瞬間圍了上來！你拚命逃回前廳。', 18, 'smiler');
        }
        g.go('dz_crossroads');
      }, 'go'),
    ],
  },

  // Room 8: The Dead End (Crimson trap)
  dz_deadend: {
    level: '0.1-dz', title: '死路・猩紅絕境', room: rDeadEnd,
    hazard: () => '警告：「死路」邊緣・通訊正在衰減・立刻掉頭！',
    update: dzSmokeTick(1.3),
    viewMsg: '觀景窗一片血紅，對講機與網路訊號讀數歸零。這裡沒有任何實體——也沒有出口。',
    enter(g, { first }) {
      if (first) {
        g.say('光線突然變得深邃而血紅，日光燈的嗡鳴低沉得讓人胸口發悶。一種難以名狀的厭惡、絕望與幽閉感湧上來——這是「死路」。');
      }
    },
    draw(ctx, t, s, R) {
      // M.E.G. walkie-talkie radio lying on the carpet with antenna & speaker grille
      const rp = P(0.6, 0.96, 2.3);
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath(); ctx.ellipse(rp[0], rp[1] + 5, 26, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#282226';
      ctx.beginPath(); ctx.roundRect(rp[0] - 18, rp[1] - 28, 36, 30, 4); ctx.fill();
      ctx.strokeStyle = '#58484e'; ctx.lineWidth = 1.5; ctx.stroke();
      // Antenna
      ctx.strokeStyle = '#181416'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(rp[0] + 10, rp[1] - 28); ctx.lineTo(rp[0] + 15, rp[1] - 58); ctx.stroke();
      // Speaker grille & dead red LED
      ctx.fillStyle = '#141012';
      for (let i = 0; i < 3; i++) ctx.fillRect(rp[0] - 11, rp[1] - 18 + i * 5, 22, 2);
      ctx.fillStyle = '#601014'; ctx.beginPath(); ctx.arc(rp[0] - 10, rp[1] - 23, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // Deep crimson haze
      ctx.save();
      ctx.fillStyle = `rgba(110,4,10,${0.26 + 0.08 * Math.sin(t * 2.2)})`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    },
    hotspots: [
      back('dz_outage', '立刻掉頭撤回停電長廊', '你克制住窒息般的壓迫感，頭也不回地衝出那片血紅空間。'),
      hit('dead_radio', boxRect(deadRadioBox, 10), 'M.E.G. 特工遺落的失聯對講機', (g) => g.read('n_dz_deadend')),
      hit('deeper', [390, 185, 180, 170], '繼續走進深邃的猩紅走廊', (g) => {
        g.end('dz_deadend_end');
      }, 'go'),
    ],
  },

  // Room 9: The Unverified Burned-Out Safe Alcove (Safe room with barrelled Almond Water)
  dz_sanctuary: {
    level: '0.1-dz', title: '燃盡的隔間・傳說安全點', room: rSanct, safe: true,
    hazard: () => '安全隔間・可燃物已燃盡・窄縫擋住了實體',
    viewMsg: '觀景窗裡，這裡沒有任何實體蹤跡，角落整齊堆著幾桶完好的杏仁水。',
    enter(g, { first }) {
      if (first) {
        g.say('一間可燃物早已徹底燃盡的焦黑小隔間。窄縫擋住了所有小型實體，角落竟散落著數桶杏仁水——這就是那份未經二次驗證的傳說安全點。');
      }
    },
    draw(ctx, t, s, R) {
      // Cylindrical steel/blue Almond Water drums (barrels)
      for (const [bx, bz, bh, bw] of [[-0.68, 2.45, 96, 54], [-0.36, 2.85, 82, 46]]) {
        const bp = P(bx, 1, bz);
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath(); ctx.ellipse(bp[0], bp[1] + 2, bw * 0.6, 8, 0, 0, Math.PI * 2); ctx.fill();
        const gr = ctx.createLinearGradient(bp[0] - bw / 2, 0, bp[0] + bw / 2, 0);
        gr.addColorStop(0, '#223a52'); gr.addColorStop(0.35, '#4674a0'); gr.addColorStop(0.7, '#325678'); gr.addColorStop(1, '#1a2e42');
        ctx.fillStyle = gr;
        ctx.fillRect(bp[0] - bw / 2, bp[1] - bh, bw, bh);
        ctx.fillStyle = '#5a8ab8';
        ctx.beginPath(); ctx.ellipse(bp[0], bp[1] - bh, bw / 2, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#182838'; ctx.lineWidth = 2; ctx.stroke();
        // Horizontal barrel ribs
        ctx.strokeStyle = 'rgba(20,34,48,0.65)'; ctx.lineWidth = 2.5;
        for (const k of [0.32, 0.66]) {
          ctx.beginPath(); ctx.moveTo(bp[0] - bw / 2, bp[1] - bh * k); ctx.lineTo(bp[0] + bw / 2, bp[1] - bh * k); ctx.stroke();
        }
        ctx.restore();
      }
      const bp = P(-0.65, 0.35, 2.5);
      txt(ctx, '杏仁水桶', bp[0], bp[1] - 12, '#bfe0ff', 11);
      poly(ctx, sanctUpHole, '#0c0a08');
      outline(ctx, sanctUpHole, '#7a6c5e', 2);
      paper(ctx, R, sanctNoteQuad, 2.3, '#e4dcc8');
    },
    hotspots: [
      back('dz_outpost', '從窄縫退回焦黑據點'),
      hit('climb_ceiling', bounds(sanctUpHole, 10), '爬回上方吊頂暗層', (g) => g.go('dz_ceiling'), 'go'),
      hit('sanct_note', bounds(sanctNoteQuad, 10), '前一位流浪者留下的手記', (g) => g.read('n_dz_sanctuary')),
      hit('almond_barrels', boxRect(sanctBarrel, 8), '角落的桶裝杏仁水', (g) => {
        if (!once(g, 'dz_barrel_loot')) return g.say('你已經裝滿一瓶並喝足了。趁這間安全點還沒在下一次停電墜入虛空前離開吧。');
        g.sanity(22);
        g.drink(40);
        g.checkpoint();
        g.give('almond', '你暢飲了甘甜冰涼的桶裝杏仁水，順手裝了一瓶帶走。緊繃的神經終於放鬆下來。（清醒度 +22，水分 +40）');
      }),
    ],
  },

  // Room 10: Long-Wander Transition Crossroads (Exits to Level 0.01, 0.2, 0.7, and Level 1)
  dz_crossroads: {
    level: '0.1-dz', title: '過渡長廊・多層出口', room: rCross,
    hazard: () => '紅橙煙霧逐漸稀薄・走廊正過渡向其他層級',
    update: dzSmokeTick(0.35),
    viewMsg: '觀景窗裡，四個方向分別映出黃霧、施工乾廊、陳舊壁紙與冰冷混凝土倉庫的輪廓。',
    enter(g, { first }) {
      if (first) {
        g.say('經過漫長奔逃，頭頂刺目的紅光終於開始褪色。雖然沒有任何路能回 Level 0，但走廊四周已逐漸過渡出通往其他層級的出口。');
      }
    },
    draw(ctx, t, s, R) {
      // Distinct color washes for each real exit
      poly(ctx, crossTo001, 'rgba(215,190,82,0.55)');
      outline(ctx, crossTo001, '#e6d070', 2);
      const c001 = P(-1.7, -0.68, 2.9);
      txt(ctx, '→ Level 0.01', c001[0] + 24, c001[1], '#ffe98a', 11);

      poly(ctx, crossTo02, 'rgba(220,210,165,0.5)');
      outline(ctx, crossTo02, '#efe6c4', 2);
      const c02 = P(1.7, -0.68, 2.9);
      txt(ctx, '→ Level 0.2', c02[0] - 24, c02[1], '#fff4d4', 11);

      poly(ctx, crossTo07, 'rgba(170,155,120,0.48)');
      outline(ctx, crossTo07, '#c8b892', 2);
      const c07 = P(-1.7, -0.6, 5.3);
      txt(ctx, '→ Level 0.7', c07[0] + 24, c07[1], '#e0d2b0', 10);

      poly(ctx, crossToL1, 'rgba(120,130,138,0.68)');
      outline(ctx, crossToL1, '#cfd8e0', 2.5);
      const cl1 = P(0, -0.68, 8.4);
      txt(ctx, '→ Level 1 倉庫', cl1[0], cl1[1], '#e4eef6', 12);

      paper(ctx, R, crossNoteQuad, 1.75, '#e8dec0');
      drawSmokeEmbers(ctx, t, 0.22, 4);
    },
    hotspots: [
      back('dz_outage', '退回停電崩解長廊'),
      hit('exits_note', bounds(crossNoteQuad, 10), '牆上標記的出口速查表', (g) => g.read('n_dz_exits')),
      hit('exit_001', bounds(crossTo001, 6), '過渡至泛黃霧廊（Level 0.01）', (g) => {
        g.go('l001_0km', { msg: '紅橙火光逐漸褪成潮熱的螢黃霧氣——你沿著長廊過渡進了 Level 0.01「無盡長廊」。' });
      }, 'go'),
      hit('exit_02', bounds(crossTo02, 6), '過渡至乾燥施工走廊（Level 0.2）', (g) => {
        g.go('l02_room', { msg: '焦味與轟鳴漸漸遠去，腳下的地毯變得乾燥潔淨——你走進了 Level 0.2「重新裝修的爛攤子」。' });
      }, 'go'),
      hit('exit_07', bounds(crossTo07, 6), '過渡至陳舊褪色走廊（Level 0.7）', (g) => {
        g.go('l07_modern', { msg: '周圍的壁紙迅速斑駁老化，空氣涼了下來——你過渡進了 Level 0.7「憶域」。' });
      }, 'go'),
      hit('exit_l1', bounds(crossToL1, 8), '過渡至混凝土倉庫（Level 1）', (g) => {
        g.go('l1_arrive', { msg: '黏滑的紅橙地毯在腳下化為冰冷濕潤的水泥地——你終於逃離了險區，抵達 Level 1。' });
      }, 'go'),
    ],
  },
};
