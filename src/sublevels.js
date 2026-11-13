// Playable adaptations of the four linked Chinese Wiki articles (CC BY-SA 3.0).
// Credits are in README.md and the in-game footer. Puzzles and J.H. notes are original.
import { P, W, H, bounds, wallQuad, faceQuad, poly, seg, box, paper, shade } from './render.js';

export const SUBLEVELS = {
  '0.1': { name: 'LEVEL 0.1', sub: '天頂站', drain: 1, thirst: 1.5, hunger: 1 },
  '0.3': { name: 'LEVEL 0.3', sub: '冰室', drain: 2, thirst: 1.2, hunger: 1.4 },
  '0.5': { name: 'LEVEL 0.5', sub: '淵閉療舍', drain: 3, thirst: 2, hunger: 1.2 },
  '0.7': { name: 'LEVEL 0.7', sub: '憶域', drain: 2, thirst: 1.5, hunger: 1 },
};

const pal = (wall, ceil, floor, fog, light) => ({ wall, ceil, floor, fog, light });
const yellow = pal('#c8b35e', '#d6cc96', '#8f7d3b', '#2a2410', '#fff4c8');
const steel = pal('#607b85', '#364a57', '#283944', '#08151f', '#a6e8ff');
const ice = pal('#aabfc0', '#c5dbe1', '#839da6', '#162c3d', '#c0efff');
const flood = pal('#b2a58b', '#465257', '#283a39', '#101e20', '#8bcde0');
const ward = pal('#8c9a8a', '#5b665f', '#484f43', '#0c1815', '#c1d5b0');
const old = pal('#a48842', '#735d34', '#695025', '#231b0a', '#ffe0a0');
const stone = pal('#b7a16c', '#776643', '#75613f', '#241708', '#ffc87b');
const room = (palette, extra = {}) => ({ hw: 1.2, depth: 8, fogEnd: 12, pal: palette, lights: [1.8, 3.8, 6], ...extra });
const back = (to, label = '往回走') => ({ id: 'back', rect: [330, 470, 300, 70], label, cursor: 'back', click: (g) => g.go(to) });
const hit = (id, rect, label, click, cursor = 'look') => ({ id, rect, label, cursor, click });
const forward = (to, label = '往前走') => hit('forward', [410, 205, 140, 150], label, (g) => g.go(to), 'go');
const noteQuad = wallQuad(-1.2, -0.1, 0.3, 2.6, 3.0);
const note = (id) => hit('note', bounds(noteQuad, 8), '留下的紀錄', (g) => g.read(id));
const drawNote = (ctx, R) => paper(ctx, R, noteQuad, 2.8);

function text(ctx, str, x, y, color = '#d7d5b9', size = 14) {
  ctx.save(); ctx.fillStyle = color; ctx.font = `${size}px monospace`; ctx.textAlign = 'center';
  ctx.fillText(str, x, y); ctx.restore();
}
function door(ctx, R, q, color, caption) {
  poly(ctx, q, shade(R, color, 2.5));
  ctx.strokeStyle = '#151c1e'; ctx.lineWidth = 3; poly(ctx, q); ctx.stroke();
  const [x, y, w, h] = bounds(q);
  seg(ctx, [x + w * 0.7, y + h * 0.55], [x + w * 0.8, y + h * 0.55], '#ccc9a7', 3);
  if (caption) text(ctx, caption, x + w / 2, y - 12, '#e1dbad', 15);
}
function consoleBox(ctx, rect, title, lines, on = true) {
  const [x, y, w, h] = rect;
  ctx.fillStyle = '#18262b'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = on ? '#78c9b5' : '#a95244'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
  text(ctx, title, x + w / 2, y + 23, on ? '#9ae1c8' : '#df8a6b', 13);
  lines.forEach((line, i) => text(ctx, line, x + w / 2, y + 45 + i * 19, '#b0bdb5', 11));
}

// Level 0.1 per the wiki: you simply walk into it, but Level 0 is too vast to stumble on it;
// only the B.N.T.G. has a reliable route. Here that route is their stencilled arrows, starting at
// a doorway on the pillar room's right wall (the back wall hides the cubicles).
export const annexDoor = wallQuad(2.2, -0.65, 1, 3.0, 3.9);
export function drawAnnexEntrance(ctx, R) {
  const [x, y, w] = bounds(annexDoor);
  text(ctx, 'B.N.T.G. →', x + w / 2 - 6, y - 10, shade(R, '#d8d2b4', 3.4), 11);
}
export const WALK_STEPS = 4;
const walkPillars = [
  { x1: -1.35, x2: -0.95, y1: -1, y2: 1, z1: 3.0, z2: 3.4 },
  { x1: 0.95, x2: 1.35, y1: -1, y2: 1, z1: 3.0, z2: 3.4 },
  { x1: -1.35, x2: -0.95, y1: -1, y2: 1, z1: 5.6, z2: 6.0 },
  { x1: 0.95, x2: 1.35, y1: -1, y2: 1, z1: 5.6, z2: 6.0 },
].map((b) => ({ ...b, color: yellow.wall }));
const pillarRect = (b) => bounds([P(b.x1, -1, b.z1), P(b.x2, 1, b.z1)], 8);
const walkSide = { left: walkPillars[0], right: walkPillars[1] };
const walkNote = faceQuad(-0.3, 0.1, 0.05, 0.4, 2.999);
const newMark = (g) => g.flag('l01_mark', Math.random() < 0.5 ? 'left' : 'right');
function walkStep(g, side) {
  const n = g.s.flags.l01_walk || 0;
  if (side !== g.s.flags.l01_mark) {
    g.flag('l01_walk', 0); newMark(g); g.sanity(-2);
    return g.go('l0_annex', { msg: '你從沒有記號的那一邊繞過去。再找的時候，柱子全換了位置，箭頭只剩下最開始那一個。' });
  }
  if (n + 1 >= WALK_STEPS) {
    g.flag('l01_walk', 0);
    return g.go('l01_airlock', { msg: '你跟著最後一個箭頭走。黃色的牆一面一面變得冰冷、平滑，地毯停在一條鋼製的門檻前。' });
  }
  g.flag('l01_walk', n + 1); newMark(g);
  g.go('l0_annex', { msg: ['下一根柱子上，又是同樣的模板字。', '箭頭的漆比較新了。有人不久前才補過。', '燈的嗡嗡聲變了調，像隔著玻璃。'][n] });
}

const stationDoor = faceQuad(-0.55, -0.7, 0.55, 1, 4);
const stationPanel = [215, 330, 175, 100];
const robotRect = [660, 315, 90, 105];
const powerRect = [135, 185, 85, 90];
const corePanel = [385, 365, 190, 85];
const insulationRect = [170, 340, 110, 90];
const ventRect = [650, 190, 145, 105];
const heaterRect = [215, 335, 150, 100];
const iceDoor = faceQuad(-0.55, -0.7, 0.55, 1, 4.5);

function frost(ctx, t, thawed) {
  ctx.save();
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, thawed ? 'rgba(150,210,240,0.12)' : 'rgba(160,220,255,0.48)');
  grad.addColorStop(0.22, 'rgba(160,220,255,0)'); grad.addColorStop(0.78, 'rgba(160,220,255,0)');
  grad.addColorStop(1, thawed ? 'rgba(150,210,240,0.12)' : 'rgba(160,220,255,0.48)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
  if (!thawed) for (let i = 0; i < 36; i++) {
    const x = (i * 137 + t * 22) % W, y = (i * 73 + t * 11) % H;
    seg(ctx, [x, y], [x + 14, y + 2], 'rgba(200,238,255,0.28)', 1);
  }
  ctx.restore();
}
function coldTick(g, dt) {
  if (g.s.flags.l03_thawed) return;
  g.s.flags.l03_cold = (g.s.flags.l03_cold || 0) + dt;
  if (g.s.flags.l03_cold >= 2) { g.s.flags.l03_cold -= 2; g.sanity(-1); }
}
const coldLabel = (s) => s.flags.l03_thawed ? '暖風恢復了，寒氣正在退去' : '寒氣刺骨・封住冷氣後再啟動暖風';

function water(ctx, t) {
  ctx.save();
  poly(ctx, [P(-1.2, 0.55, 0.55), P(1.2, 0.55, 0.55), P(1.2, 0.55, 8), P(-1.2, 0.55, 8)], '#263c39');
  ctx.clip();
  for (let i = 0; i < 35; i++) {
    const y = 295 + ((i * 19 + t * 12) % 230);
    const x = (i * 167 + Math.sin(t + i) * 18) % W;
    seg(ctx, [x, y], [x + 30 + (y - 295) * 0.35, y], i % 3 ? '#43594c' : '#76816a', 1);
  }
  ctx.restore();
}
function drowned(ctx, t, progress) {
  ctx.save();
  const scale = 0.55 + Math.min(1, progress / 14) * 1.1;
  ctx.translate(480 + Math.sin(t * 1.8) * 8, 330); ctx.scale(scale, scale);
  ctx.fillStyle = '#273d36'; ctx.shadowColor = '#8aa496'; ctx.shadowBlur = 14;
  ctx.beginPath(); ctx.ellipse(0, -40, 19, 27, 0.2, 0, Math.PI * 2); ctx.fill();
  poly(ctx, [[-18, -21], [21, -18], [36, 65], [4, 81], [-37, 65]], '#2b4239');
  ctx.strokeStyle = '#394f45'; ctx.lineWidth = 12;
  ctx.beginPath(); ctx.moveTo(-12, -10); ctx.lineTo(-57, 29); ctx.moveTo(17, -8); ctx.lineTo(58, 30); ctx.stroke();
  ctx.fillStyle = '#0b1714'; ctx.fillRect(-9, -47, 5, 4); ctx.fillRect(4, -45, 5, 4);
  ctx.restore();
}
function huntTick(g, dt) {
  if (!g.s.flags.l05_hunted || g.s.flags.l05_dissolved) return;
  const next = (g.s.flags.l05_pursuit || 0) + dt;
  g.flag('l05_pursuit', next);
  if (next >= 14) {
    g.flag('l05_pursuit', 4); g.sanity(-18); g.sfx('groan');
    g.say('冰冷的手抓住了你。你掙脫了——快回到積水裡，讓它跟過來！');
  }
}

const epochs = {
  victorian: { year: '1800—1950', title: '維多利亞走廊', palette: old },
  medieval: { year: '500—1400', title: '中世紀石廊', palette: stone },
  egypt: { year: '前 4000—前 500', title: '古埃及回廊', palette: stone },
};
function drawEpoch(ctx, R, t, epoch) {
  const e = epochs[epoch];
  for (const side of [-1, 1]) {
    for (let z = 1.8; z < 8; z += 1.4) {
      if (epoch === 'victorian') {
        const p = P(side * 1.2, 0, z);
        ctx.strokeStyle = shade(R, '#d4b35f', z); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(p[0], p[1], 12 / z, 35 / z, 0, 0, Math.PI * 2); ctx.stroke();
      } else {
        seg(ctx, P(side * 1.2, -1, z), P(side * 1.2, 1, z), shade(R, '#5b482b', z), 2);
        for (const y of [-0.5, 0, 0.5]) seg(ctx, P(side * 1.2, y, z), P(side * 1.2, y, z + 1.4), shade(R, '#5b482b', z), 2);
      }
    }
  }
  for (const z of [2.2, 4.8, 7]) {
    const p = P(0, -0.7, z), r = 32 / z;
    seg(ctx, P(0, -1, z), p, '#342515', 2);
    ctx.save(); ctx.fillStyle = '#ffd38a'; ctx.shadowColor = '#ffb64c'; ctx.shadowBlur = 30 + Math.sin(t * 9) * 4;
    ctx.beginPath(); ctx.ellipse(p[0], p[1], r * 0.6, r, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  text(ctx, e.year, 480, 165, '#d0b57d', 18);
  drawNote(ctx, R);
}
const rubbingRect = [400, 315, 160, 115];
const archiveRect = [650, 330, 155, 100];
const staticRect = [160, 185, 100, 115];

export const SUBLEVEL_SCENES = {
  l0_annex: {
    level: 0, title: '柱子間的長路', room: room(yellow, { hw: 2, depth: 8, stripes: true, floorTex: 'carpet', tiles: true, lights: [1.6, 3.6, 5.8] }),
    enter(g, { first }) {
      if (!g.s.flags.l01_mark) newMark(g);
      if (first) g.say('柱子一排接一排，沒有盡頭。有一根柱子上噴著褪色的模板字，旁邊是一個箭頭。');
    },
    draw(ctx, t, s, R) {
      for (const b of walkPillars) box(ctx, R, b);
      const b = walkSide[s.flags.l01_mark] || walkSide.left, cx = (b.x1 + b.x2) / 2;
      const p = P(cx, -0.15, b.z1);
      text(ctx, 'B.N.T.G.', p[0], p[1], shade(R, '#efe9d0', 3), 11);
      text(ctx, '↑', p[0], p[1] + 24, shade(R, '#efe9d0', 3), 22);
      if (!(s.flags.l01_walk || 0)) paper(ctx, R, walkNote, 3, '#efe7cf');
    },
    hotspots: [
      { ...back('l0_pillar', '回到柱子的房間'), click: (g) => { g.flag('l01_walk', 0); g.go('l0_pillar'); } },
      hit('left', pillarRect(walkSide.left), '從左邊的柱子旁走過去', (g) => walkStep(g, 'left'), 'go'),
      hit('right', pillarRect(walkSide.right), '從右邊的柱子旁走過去', (g) => walkStep(g, 'right'), 'go'),
      { ...hit('guide', bounds(walkNote, 8), '貼在柱子上的便條', (g) => g.read('n_annex')), when: (s) => !(s.flags.l01_walk || 0) },
    ],
  },

  l01_airlock: {
    level: '0.1', title: '損毀的氣閘', room: room(steel, { depth: 4, wallTex: 'concrete' }),
    enter(g, { first }) { if (first) g.say('地毯止於玻璃與鋼鐵之間。自動門卡住了，維修機器人仍在重複一個早已失敗的動作。'); },
    draw(ctx, t, s, R) {
      door(ctx, R, stationDoor, s.flags.l01_power ? '#649295' : '#253c49', 'ZENITH / 01');
      seg(ctx, P(0, -0.7, 4), P(0, 1, 4), '#9cc6cb', 2);
      consoleBox(ctx, stationPanel, '氣閘供電', [s.flags.l01_power ? '供電恢復・可通行' : '保險絲損壞', '更換前先隔離電源'], !!s.flags.l01_power);
      consoleBox(ctx, powerRect, '電源', [s.flags.l01_isolated ? '已隔離' : '仍通電'], !!s.flags.l01_isolated);
      const [x, y, w, h] = robotRect;
      ctx.fillStyle = '#6b818b'; ctx.fillRect(x, y, w, h * 0.8);
      ctx.fillStyle = '#152932'; ctx.fillRect(x + 8, y + 12, w - 16, 27);
      ctx.fillStyle = '#a5ded4'; ctx.fillRect(x + 21, y + 23, 8, 5); ctx.fillRect(x + 61, y + 23, 8, 5);
      text(ctx, s.flags.l01_fuse ? '備件已取出' : '維修機器人', x + w / 2, y + 65, '#d0dfd9', 11);
      drawNote(ctx, R);
    },
    hotspots: [
      back('l0_pillar', '走回黃色地毯'),
      hit('forward', bounds(stationDoor, 3), '自動氣閘門', (g) => g.s.flags.l01_power ? g.go('l01_core') : g.say('門沒有反應。控制面板亮著紅燈。'), 'go'),
      note('n01'),
      hit('robot', robotRect, '檢查維修機器人的備件槽', (g) => {
        if (g.s.flags.l01_fuse) return g.say('備件槽空了，機器人繼續默默擦拭地板。');
        g.flag('l01_fuse'); g.give('fuse', '機器人遞出一枚備用保險絲。');
      }, 'take'),
      hit('isolate', powerRect, '隔離氣閘電源', (g) => {
        if (g.s.flags.l01_power) return g.say('氣閘正在正常運作。');
        g.flag('l01_isolated', !g.s.flags.l01_isolated); g.sfx('click');
        g.say(g.s.flags.l01_isolated ? '你拉下隔離開關。裸露電纜的火花停了。' : '電源重新接通了，請勿觸碰損壞的線路。');
      }),
      { ...hit('panel', stationPanel, '損毀的供電面板', (g) => g.say('保險絲燒斷了。先隔離電源，再使用維修機器人的備件。')), use: {
        fuse(g) {
          if (!g.s.flags.l01_isolated) { g.sanity(-5); g.sfx('error'); return g.say('火花逼得你縮回手。先拉下隔離開關！保險絲還在。'); }
          g.take('fuse'); g.flag('l01_power'); g.sfx('ok'); g.say('你裝好保險絲並復位供電。氣閘門緩緩滑開。');
        },
      } },
    ],
  },

  l01_core: {
    level: '0.1', title: '球殼觀測室', room: room(steel, { hw: 2.2, depth: 5 }),
    enter(g, { first }) { if (first) g.say('玻璃外是一個巨大的中空球殼。更遠處，黃色房間像樓層一樣向上堆疊。你仍然看不到任何人。'); },
    draw(ctx, t, s, R) {
      const window = faceQuad(-2, -0.95, 2, 0.6, 4);
      poly(ctx, window, '#06121e');
      ctx.save(); poly(ctx, window); ctx.clip();
      for (let i = 0; i < 8; i++) {
        ctx.strokeStyle = '#28506a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(480, 245, 65 + i * 35, 45 + i * 20, 0, 0, Math.PI * 2); ctx.stroke();
        for (let j = 0; j < 9; j++) { ctx.fillStyle = '#a69750'; ctx.fillRect(250 + j * 55, 145 + i * 28, 15, 8); }
      }
      ctx.restore();
      seg(ctx, [480, 140], [480, 350], '#8cb4c1', 5);
      consoleBox(ctx, corePanel, '自動補給櫃', [s.flags.l01_done ? '物資已領取' : '緊急物資・限領一次']);
      text(ctx, 'ZENITH STATION / OBSERVATION', 480, 115, '#9edbea', 16);
    },
    hotspots: [
      back('l01_airlock', '回到氣閘，原路返回'),
      hit('window', [245, 145, 470, 200], '觀察球殼與堆疊的 Level 0', (g) => g.read('n01_core')),
      hit('supply', corePanel, '打開補給櫃', (g) => {
        if (g.s.flags.l01_done) return g.say('補給櫃已經空了。');
        g.flag('l01_done'); g.give('almond', '櫃裡剩下一瓶杏仁水。站內只有機器的聲音。');
      }, 'take'),
      hit('noclip', [760, 220, 95, 210], '切過故障的玻璃，前往 Level 1', (g) => g.go('l1_arrive', { msg: '你穿過了失真的玻璃。球殼消失，腳下成了停車場般冰冷的水泥。' }), 'go'),
    ],
    drawOver(ctx, t, s, R) { door(ctx, R, wallQuad(2.2, -0.6, 1, 3, 4.5), '#486f70', '切出 → 1'); },
  },

  l03_entry: {
    level: '0.3', title: '結冰的黃色房間', room: room(ice, { stripes: true, floorTex: 'carpet', tiles: true }),
    hazard: coldLabel, update: coldTick,
    enter(g, { first }) { if (first) g.say('鞋底在地毯上發出碎冰的聲音。牆紙凍得剝落，廢棄的翻修工具被封在霜裡。'); },
    draw(ctx, t, s, R) {
      drawNote(ctx, R);
      box(ctx, R, { x1: 0.45, x2: 1.0, y1: 0.1, y2: 1, z1: 3, z2: 4, color: '#b2e1ec', edge: true });
      consoleBox(ctx, insulationRect, '翻修工具箱', [s.flags.l03_mat ? '已取出隔熱墊' : '保溫材料']);
      frost(ctx, t, s.flags.l03_thawed);
    },
    hotspots: [
      back('l0_hall', '退回沒有結霜的走廊'), forward('l03_vents', '沿著冷風吹來的方向走'), note('n03'),
      hit('insulation', insulationRect, '翻修工具箱裡的隔熱墊', (g) => {
        if (g.s.flags.l03_mat) return g.say('工具箱空了。');
        g.flag('l03_mat'); g.give('insulation', '你取出一塊厚厚的隔熱墊。邊角還留著施工編號。');
      }, 'take'),
    ],
  },

  l03_vents: {
    level: '0.3', title: '失修的通風間', room: room(ice, { depth: 4.5, floorTex: 'concrete', wallTex: 'concrete' }),
    hazard: coldLabel, update: coldTick,
    draw(ctx, t, s, R) {
      door(ctx, R, iceDoor, s.flags.l03_thawed ? '#486862' : '#9ac9df', s.flags.l03_thawed ? '冰層已融化' : '出口被冰封住');
      consoleBox(ctx, ventRect, '低溫送風', [s.flags.l03_sealed ? '已封堵' : '持續冷卻中'], !!s.flags.l03_sealed);
      for (let i = 0; i < 5; i++) seg(ctx, [663, 229 + i * 10], [782, 229 + i * 10], '#0b2939', 3);
      consoleBox(ctx, heaterRect, '施工暖風機', [s.flags.l03_thawed ? '運轉中' : '等待啟動'], !!s.flags.l03_thawed);
      frost(ctx, t, s.flags.l03_thawed);
    },
    hotspots: [
      back('l03_entry'),
      { ...hit('vent', ventRect, '吹出冷霧的通風口', (g) => g.say(g.s.flags.l03_sealed ? '隔熱墊緊緊蓋住了風口。' : '冷氣讓一切反覆結冰。需要能隔絕冷風的材料。')), use: {
        insulation(g) { g.take('insulation'); g.flag('l03_sealed'); g.sfx('screw'); g.say('你用隔熱墊封住風口，刺骨的冷風停下了。現在可以啟動暖風機。'); },
      } },
      hit('heater', heaterRect, '啟動施工暖風機', (g) => {
        if (g.s.flags.l03_thawed) return g.say('暖風機持續運轉著。');
        if (!g.s.flags.l03_sealed) { g.sanity(-3); g.sfx('error'); return g.say('暖風抵不過冷氣，剛融化的水又結了冰。先處理通風口。'); }
        g.flag('l03_thawed'); g.sfx('ok'); g.say('暖風終於留在房間裡。冰層裂開，露出一條回到黃色房間的通路。');
      }),
      hit('exit', bounds(iceDoor, 3), '穿過融冰後的通道', (g) => {
        if (!g.s.flags.l03_thawed) return g.say('厚冰堵住了通道。');
        if (!g.s.flags.l03_supply) { g.flag('l03_supply'); g.give('almond', '冰層後的工具櫃裡藏著一瓶杏仁水。'); }
        g.go('l0_hall', { msg: '你踩過融化的冰水，走回那條長長的走廊。格柵不再吹冷風了，地毯上的霜也化成了水漬。' });
      }, 'go'),
    ],
  },

  l05_flood: {
    level: '0.5', title: '浸濡通道', room: room(flood, { hw: 1.2, depth: 8, stripes: true, lights: [] }),
    enter(g, { first }) {
      if (g.s.flags.l05_hunted && !g.s.flags.l05_dissolved) {
        g.flag('l05_dissolved'); g.flag('l05_hunted', false); g.sfx('steam');
        g.say('你跳回積水。溺屍緊跟著滑下平台，碰到水的瞬間便散成一團混濁。醫院裡安靜了。');
      } else if (first) g.say('你沿著熄燈區的樓梯向下走。污水漫到膝蓋，褪色的牆紙垂進水裡，藍燈在裸露的電線下閃爍。');
    },
    draw(ctx, t, s, R) {
      water(ctx, t); drawNote(ctx, R);
      for (const z of [2, 4, 6]) {
        const p = P(0.2, -0.55, z); seg(ctx, P(0.2, -1, z), p, '#151b1c', 2);
        ctx.save(); ctx.shadowColor = '#83e2ff'; ctx.shadowBlur = 25;
        ctx.fillStyle = Math.sin(t * 7 + z) > -0.85 ? '#75b9d3' : '#263f4b'; ctx.fillRect(p[0] - 40 / z, p[1], 80 / z, 12 / z); ctx.restore();
      }
      const q = faceQuad(-0.55, 0.45, 0.55, 1, 5);
      poly(ctx, q, '#6a7568'); text(ctx, '醫院・乾燥平台 ↑', 480, 260, '#b2c3ac', 13);
    },
    hotspots: [{ ...back('l0_low', '沿入口樓梯回到 Level 0'), click: (g) => g.go('l0_low', { msg: '你爬上台階，在黑暗裡摸著牆走了很久，直到看見那間低矮房間的燈光。' }) }, forward('l05_hospital', '爬上醫院的平台'), note('n05_water')],
  },

  l05_hospital: {
    level: '0.5', title: '廢棄醫院', room: room(ward, { wallTex: 'concrete', floorTex: 'concrete' }),
    hazard: (s) => s.flags.l05_dissolved ? null : '溺屍正追著你・紀錄提到它不能碰水',
    update: huntTick,
    enter(g) {
      if (!g.s.flags.l05_dissolved) { g.flag('l05_hunted'); g.say('身後傳來咕嚕聲。一團人形的東西正緩緩靠近，始終知道你在哪裡。通道下方就是積水。'); }
    },
    draw(ctx, t, s, R) {
      door(ctx, R, faceQuad(-0.45, -0.65, 0.45, 1, 7), '#3d554a', '金屬樓梯 → 1');
      for (const side of [-1, 1]) {
        box(ctx, R, { x1: side < 0 ? -1.1 : 0.55, x2: side < 0 ? -0.55 : 1.1, y1: 0.65, y2: 1, z1: 2.4, z2: 4.2, color: '#777a64' });
      }
      consoleBox(ctx, [660, 345, 120, 80], '醫療推車', [s.flags.l05_supply ? '空的' : '一瓶杏仁水']);
      drawNote(ctx, R);
      if (!s.flags.l05_dissolved) drowned(ctx, t, s.flags.l05_pursuit || 0);
    },
    hotspots: [
      back('l05_flood', '跳回積水，讓溺屍跟過來'), note('n05_hospital'),
      hit('supply', [660, 345, 120, 80], '醫療推車', (g) => {
        if (g.s.flags.l05_supply) return g.say('推車空了。');
        g.flag('l05_supply'); g.give('almond', '你從推車上抓起一瓶杏仁水。');
      }, 'take'),
      hit('forward', [425, 205, 110, 110], '前往金屬樓梯', (g) => {
        if (!g.s.flags.l05_dissolved) return g.say('它還在追你。直接走樓梯會被堵住——先設法讓它碰到水。');
        g.go('l05_stairs');
      }, 'go'),
    ],
  },

  l05_stairs: {
    level: '0.5', title: '金屬格柵樓梯', room: room(ward, { depth: 5, lights: [2.2] }),
    draw(ctx, t, s, R) {
      for (let i = 0; i < 8; i++) {
        const y = 270 + i * 22, w = 80 + i * 32;
        ctx.fillStyle = i % 2 ? '#596663' : '#354643'; ctx.fillRect(480 - w / 2, y, w, 18);
        for (let x = 480 - w / 2; x < 480 + w / 2; x += 12) seg(ctx, [x, y], [x, y + 18], '#1d302e', 2);
      }
      text(ctx, 'LEVEL 1 ↓', 480, 215, '#b6e3bb', 24);
    },
    hotspots: [back('l05_hospital'), forward('l1_arrive', '下樓，離開淵閉療舍並進入 Level 1')],
  },

  l07_modern: {
    level: '0.7', title: '現代區段・1950 年至今', room: room(yellow, { stripes: true, floorTex: 'carpet', tiles: true }),
    enter(g, { first }) { if (first) g.say('最初只是普通的黃色走廊。但越往前，日光燈越少，取而代之的是白熾燈泡。牆上的出口像電視雜訊一樣凝固了。'); },
    draw(ctx, t, s, R) {
      drawNote(ctx, R);
      const [x, y, w, h] = staticRect;
      ctx.fillStyle = '#3e4140'; ctx.fillRect(x, y, w, h);
      for (let i = 0; i < 38; i++) {
        ctx.fillStyle = `rgba(220,220,210,${0.1 + ((i * 17 + Math.floor(t * 12)) % 8) / 12})`;
        ctx.fillRect(x, y + i * 3, w, 2);
      }
      consoleBox(ctx, archiveRect, 'N.T.G. 複本終端', [s.flags.l07_recorded ? '年代紀錄已補全' : '缺少古代區段紀錄']);
      text(ctx, '1950 — NOW', 480, 165, '#e3c95e', 18);
    },
    hotspots: [
      { ...back('l0_faded', '朝更現代的燈光走，返回 Level 0'), click: (g) => g.go('l0_faded', { msg: '你一直朝比較新的燈光走。日光燈管、米色壁紙……最後是那間褪了色的房間。' }) }, forward('l07_victorian', '往燈泡與花紋壁紙的方向走'), note('n07'),
      hit('static', staticRect, '凝固成雜訊的出口', (g) => { g.sanity(-3); g.sfx('error'); g.say('你的手被彈了回來。出口被封死了，應該朝更現代的區段原路返回。'); }),
      { ...hit('archive', archiveRect, 'N.T.G. 年代紀錄終端', (g) => g.say(g.s.flags.l07_recorded ? '你的古代拓片已存入紀錄。現在可以原路返回。' : '終端缺少古代區段的紀錄。更深處的石刻或許能補上。')), use: {
        rubbing(g) { g.take('rubbing'); g.flag('l07_recorded'); g.sanity(12); g.sfx('ok'); g.read('n07_echo'); },
      } },
    ],
  },

  l07_victorian: {
    level: '0.7', title: '維多利亞區段・1800—1950', room: room(old, { stripes: true, lights: [], floorTex: 'carpet' }),
    enter(g, { first }) { if (first) g.say('牆紙的花紋變得繁複。吊燈下沒有腳印，只有很久以前留下的燭油。這裡把過去保留了下來。'); },
    draw(ctx, t, s, R) { drawEpoch(ctx, R, t, 'victorian'); },
    hotspots: [back('l07_modern', '回到日光燈區段'), forward('l07_medieval', '沿石牆繼續深入'), note('n07_history')],
  },

  l07_medieval: {
    level: '0.7', title: '中世紀區段・500—1400', room: room(stone, { lights: [], wallTex: 'concrete', floorTex: 'concrete' }),
    enter(g, { first }) { if (first) g.say('壁紙消失了。石頭地牢般的走廊裡，遠處傳來不屬於你的腳步聲。不要偏離回程的方向。'); },
    draw(ctx, t, s, R) { drawEpoch(ctx, R, t, 'medieval'); },
    hotspots: [back('l07_victorian', '朝吊燈較新的方向返回'), forward('l07_egypt', '穿過更古老的石廊'), note('n07_history')],
  },

  l07_egypt: {
    level: '0.7', title: '古埃及區段・前 4000—前 500', room: room(stone, { lights: [], wallTex: 'concrete' }),
    enter(g, { first }) { if (first) g.say('石柱上刻滿陌生的符號。古老的油燈仍然亮著，但黑暗深處有什麼東西在守著自己的領地。'); },
    draw(ctx, t, s, R) {
      drawEpoch(ctx, R, t, 'egypt');
      for (const side of [-1, 1]) for (let z = 2; z < 8; z += 2) {
        const x = side * 0.9;
        box(ctx, R, { x1: x - 0.1, x2: x + 0.1, y1: -1, y2: 1, z1: z, z2: z + 0.25, color: '#baa05c', edge: true });
      }
      drawNote(ctx, R);
      const [x, y, w, h] = rubbingRect;
      ctx.fillStyle = '#a58c51'; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#51401e'; ctx.lineWidth = 3; ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
      for (let i = 0; i < 5; i++) {
        const gx = x + 20 + i * 30;
        ctx.strokeStyle = '#594321'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(gx, y + 30, 5, 0, Math.PI * 2); ctx.stroke();
        seg(ctx, [gx, y + 36], [gx, y + 65], '#594321', 2);
        seg(ctx, [gx - 8, y + 46], [gx + 8, y + 46], '#594321', 2);
        seg(ctx, [gx, y + 65], [gx - 7, y + 75], '#594321', 2);
      }
      text(ctx, s.flags.l07_rubbing ? '拓印已取下' : '拓印年代石刻', x + w / 2, y + h - 12, '#30240d', 12);
      door(ctx, R, wallQuad(1.2, -0.6, 1, 1.7, 2.6), '#302714', '更深處');
    },
    hotspots: [
      back('l07_medieval', '沿年代較新的區段原路返回'), note('n07_history'),
      hit('rubbing', rubbingRect, '拓印石板上的古代紀錄', (g) => {
        if (g.s.flags.l07_rubbing) return g.say('拓印已經取下。把它帶回現代區段的終端。');
        g.flag('l07_rubbing'); g.give('rubbing', '你取下一張年代拓片。原路返回，燈光會隨著時代逐漸變新。');
      }, 'take'),
      hit('deeper', bounds(wallQuad(1.2, -0.6, 1, 1.7, 2.6), 3), '靠近黑暗深處的腳步聲', (g) => {
        g.sanity(-8); g.sfx('groan'); g.say('一個扭曲的人影從石柱後探出來。你立刻退開。沒有物資，繼續深入太危險了。');
      }),
    ],
  },
};
