// "幽閉恐懼" (Level 0.7-C / Claustrophobia), adapted from the Chinese Backrooms Wiki article "幽闭恐惧症"
// (original English article by Infinite_Explorer; CC BY-SA 3.0). Layouts, the Flickering timer and scene text are original adaptations.
import { bounds, box, boxRect, P, poly, shade, wallQuad } from '../render.js';
import { back, glow, hit, once, pal, room } from './sublevel-kit.js';

// The dark slot in Level 0's hallway (l0_hall) that leads down into the squeeze.
export const squeezeGap = wallQuad(1, -0.5, 1, 5.2, 6.0);

// =====================================================================
// LEVEL 0.7-C — 幽閉恐懼 (Claustrophobia) — 6 playable rooms
// Half-width chutes, mold-choked air, a dead light grid that wakes into
// the Flickering, a sealed M.E.G. outpost and a water cache with a bad bottle.
// =====================================================================
const pChute = pal('#4f4e2c', '#42412a', '#353420', '#0c0b06', '#b3ad74');
const pJunction = pal('#585331', '#4a4628', '#3d3a22', '#14120a', '#cbbf7e');
const pFlicker = pal('#5b5536', '#4c4730', '#3c3923', '#1a1808', '#f0dc92');
const pOutpost = pal('#3d4339', '#353b32', '#2b3028', '#0e110d', '#a4bca6');
const pWater = pal('#4c4b3a', '#403f31', '#34332a', '#100f09', '#c4bb8c');

const rNarrow = room(pChute, { hw: 0.6, depth: 5.5, fogEnd: 6.5, baseboard: false, lights: [] });
const rChute = room(pChute, { hw: 0.6, depth: 11, fogEnd: 8, baseboard: false, lights: [] });
const rJunction = room(pJunction, { hw: 1.9, depth: 7.5, fogEnd: 8, baseboard: false, lights: [2.5, 5.5] });
const rFlicker = room(pFlicker, { hw: 1.9, depth: 8, fogEnd: 9, baseboard: false, lights: [2.5, 5.2] });
const rOutpost = room(pOutpost, { hw: 1.4, depth: 7, fogEnd: 7, baseboard: false, lights: [3.0] });
const rWater = room(pWater, { hw: 1.4, depth: 7, fogEnd: 7, baseboard: false, lights: [3.0] });

// Shared geometry
const moldL = wallQuad(-0.6, -0.5, 0.9, 2.2, 3.6);
const moldR = wallQuad(0.6, -0.5, 0.9, 2.2, 3.6);
const junctionDesk = { x1: -1.5, x2: -0.9, y1: 0.4, y2: 1, z1: 3.2, z2: 3.9, color: '#6e5a34', top: '#7d6a40', edge: true };
const junctionCabinet = { x1: 0.9, x2: 1.5, y1: -0.3, y2: 1, z1: 2.3, z2: 2.9, color: '#5d4c2b', top: '#6f5d37', edge: true };
const couch = { x1: -0.2, x2: 0.6, y1: 0.55, y2: 1, z1: 5.2, z2: 6.0, color: '#5a4a30', top: '#6a5a3a', edge: true };
const bulbSpots = [P(-0.8, -0.85, 2.6), P(0.8, -0.85, 4.2), P(0, -0.85, 5.8)];
const outpostCage = { x1: -1.2, x2: -0.3, y1: -0.2, y2: 1, z1: 3.2, z2: 4.2, color: '#4a5246', top: '#58614f', edge: true };
const outpostTent = wallQuad(1.4, -0.5, 0.9, 2.2, 3.6);
const outpostDoor = wallQuad(1.4, -0.6, 1, 5.0, 6.0);
const almondStack = { x1: -1.2, x2: -0.7, y1: 0.45, y2: 1, z1: 3.0, z2: 3.6, color: '#8a7e4e', top: '#a09460', edge: true };
const cashewStack = { x1: 0.7, x2: 1.2, y1: 0.45, y2: 1, z1: 3.0, z2: 3.6, color: '#8a7e4e', top: '#a09460', edge: true };

// Spore air: a slow sanity drain while standing in the chutes.
function sporeTick(rate) {
  return (g, dt) => {
    const f = g.s.flags;
    f.sq_spore = (f.sq_spore || 0) + dt * rate;
    if (f.sq_spore >= 5) { f.sq_spore -= 5; g.sanity(-1); }
  };
}

// The Flickering: bulbs drop in after 12s, then every light blows out after 22s unless you hid under the couch.
function flickerTick(g, dt) {
  const f = g.s.flags;
  f.sq_fl = (f.sq_fl || 0) + dt;
  if (f.sq_fl >= 12 && !f.sq_bulbs) { f.sq_bulbs = true; g.say('天花板上突然垂下一排白熾燈泡，把整個房間照得發白。家具的影子跟著拉長。'); }
  if (f.sq_fl >= 22) {
    f.sq_fl = 0; f.sq_bulbs = false;
    if (f.sq_cover) { f.sq_cover = false; g.say('燈泡一顆接一顆炸開，玻璃碎片撒了一地。你縮在沙發底下，只擦破了手背。'); }
    else { g.setLight(false); g.sanity(-12); g.say('所有的燈同時閃到極限，燈泡炸開。玻璃打在你臉上，手電筒也跟著熄了。'); }
  }
}

export const L07C_SCENES = {
  // Room 1: the narrow mouth off Level 0's hallway
  sq_mouth: {
    level: '0.7c', title: '窄口', room: rNarrow,
    hazard: () => '霉味嗆鼻・每次呼吸都吸進孢子',
    update: sporeTick(0.6),
    enter(g, { first }) {
      if (first) g.say('牆一下子逼了過來。你得側著身子才擠得進去，肩膀幾乎碰到兩邊的牆。');
    },
    draw(ctx, t, s, R) {
      poly(ctx, moldL, shade(R, '#3b4a1e', 2.4));
      poly(ctx, moldR, shade(R, '#3b4a1e', 2.4));
    },
    hotspots: [
      back('l0_hall', '退回 Level 0 的走廊', '你側著身子退了出來。走廊忽然變得很寬很鬆。'),
      hit('forward', [400, 180, 160, 160], '往深處的窄廊走', (g) => g.go('sq_chute'), 'go'),
      hit('mold', bounds(moldL, 6), '牆上的黑綠色霉斑', (g) => {
        g.sanity(-3);
        g.say('霉斑底下是濕的，指尖一碰就滲出水。你把手縮回來，覺得肺裡多了一團東西。');
      }),
    ],
  },

  // Room 2: a shoulder-wide chute, where one stalled wanderer traps the rest
  sq_chute: {
    level: '0.7c', title: '窄廊', room: rChute,
    hazard: () => '肩寬的窄廊・停下來就會卡住後面的人',
    update: sporeTick(0.6),
    enter(g, { first }) {
      if (first) g.say('窄廊一直延伸到看不見的地方，寬度只有 Level 0 的一半。前後都有腳步聲，擠在一起就誰也動不了。');
    },
    draw(ctx, t, s, R) {
      poly(ctx, moldL, shade(R, '#3b4a1e', 3.2));
      poly(ctx, moldR, shade(R, '#3b4a1e', 3.2));
    },
    hotspots: [
      back('sq_mouth', '往回擠'),
      hit('forward', [400, 180, 160, 160], '繼續往前擠', (g) => g.go('sq_junction'), 'go'),
      hit('rest', [330, 380, 300, 80], '蹲下來喘口氣', (g) => {
        if (once(g, 'sq_rest')) { g.sanity(-4); g.say('你停下來喘氣。窄廊裡一停，後面的腳步聲也跟著停了。你不知道後面是誰，也不知道他等不等得起。'); }
        else g.say('你已經停過一次了。這裡不適合久留。');
      }),
    ],
  },

  // Room 3: the junction where several chutes meet, with derelict furniture
  sq_junction: {
    level: '0.7c', title: '交匯房', room: rJunction,
    enter(g, { first }) {
      if (first) g.say('窄廊到這裡忽然開闊。幾件廢棄的家具散在房裡，積滿灰塵，卻擺得像有人刻意留下。三個方向都有門洞。');
    },
    draw(ctx, t, s, R) {
      box(ctx, R, junctionDesk);
      box(ctx, R, junctionCabinet);
      box(ctx, R, couch);
    },
    hotspots: [
      back('sq_chute', '退回窄廊'),
      hit('left', [40, 160, 200, 260], '左邊的門洞（天花板很高）', (g) => g.go('sq_flicker'), 'go'),
      hit('right', [720, 160, 200, 260], '右邊的門洞（有水的味道）', (g) => g.go('sq_water'), 'go'),
      hit('forward', [400, 180, 160, 160], '正前方的門（縫隙透出風）', (g) => g.go('sq_outpost'), 'go'),
      hit('cabinet', boxRect(junctionCabinet, 6), '倒在地上的櫃子', (g) => {
        if (once(g, 'sq_battery')) g.give('battery', '抽屜底下夾著一顆還有電的電池，外面包著發黃的舊報紙。');
        else g.say('抽屜已經空了。');
      }),
      hit('desk', boxRect(junctionDesk, 6), '刮痕累累的桌子', (g) => g.say('桌面刻滿了正字。有些是新的，有些已經被灰塵蓋住了。')),
    ],
  },

  // Room 4: the Flickering zone; hide under the couch or get out
  sq_flicker: {
    level: '0.7c', title: '閃爍區', room: rFlicker,
    hazard: () => '閃爍事件・天花板垂下燈泡就離開或找掩體',
    update: flickerTick,
    enter(g, { first }) {
      const f = g.s.flags;
      f.sq_fl = 0; f.sq_bulbs = false; f.sq_cover = false;
      if (first) g.say('房裡的燈全壞了，只有家具的影子。你不知道什麼時候會有燈泡掉下來。');
    },
    draw(ctx, t, s, R) {
      box(ctx, R, couch);
      if (!s.flags.sq_bulbs) return;
      const flash = Math.sin(t * 25) > 0;
      for (const p of bulbSpots) {
        const [x, y] = [p[0], p[1]];
        glow(ctx, x, y, 90, flash ? 'rgba(255,240,190,0.55)' : 'rgba(255,240,190,0.12)');
      }
    },
    hotspots: [
      back('sq_junction', '往回走，離開閃爍的區域'),
      hit('cover', boxRect(couch, 8), '沙發底下的空隙', (g) => {
        g.flag('sq_cover');
        g.say('你鑽到沙發底下，蜷成一團。這是唯一能遮住頭的地方。');
      }),
    ],
  },

  // Room 5: the sealed M.E.G. outpost
  sq_outpost: {
    level: '0.7c', title: 'M.E.G. 前哨', room: rOutpost,
    enter(g, { first }) {
      if (first) g.say('一個用厚橡膠板搭成的小帳篷，像是臨時的安全區。地上有空罐頭，還有一個被翻過的睡袋。');
    },
    draw(ctx, t, s, R) {
      box(ctx, R, outpostCage);
      poly(ctx, outpostTent, shade(R, '#5b6a52', 2.8));
      poly(ctx, outpostDoor, shade(R, '#2a2f28', 3.6));
    },
    hotspots: [
      back('sq_junction', '退回交匯房'),
      {
        id: 'cage', rect: boxRect(outpostCage, 6), label: '鐵絲物資籠', cursor: 'look',
        click: (g) => {
          if (g.s.flags.sq_cage) return g.say('籠子已經打開，裡面空了。');
          g.say('籠子鎖著。鎖孔的形狀很特別，吊牌上寫著「物資籠」。');
        },
        use: {
          outpost_key: (g) => {
            if (g.s.flags.sq_cage) return g.say('籠子已經打開了。');
            g.flag('sq_cage'); g.take('outpost_key');
            g.give('almond', '鑰匙插進鎖孔，籠門「喀」地彈開。裡面只剩一瓶杏仁水和一根能量棒，像是特地留下的。');
          },
        },
      },
      hit('door', bounds(outpostDoor, 6), '封死的門・門縫裡透出冷風', (g) => {
        g.say('門被一排重物頂住，從另一側傳來隱約的風聲。門上的字跡被人用指甲刻了又刻：「通往 Level 1」。');
      }),
      hit('tent', bounds(outpostTent, 4), '橡膠帳篷的接縫', (g) => {
        g.say('接縫用膠帶黏了好幾層。內側貼著一張值班表，最後一行的名字空著，沒有寫完。');
      }),
    ],
  },

  // Room 6: the water cache, one good bottle and one bad one
  sq_water: {
    level: '0.7c', title: '水箱堆', room: rWater,
    enter(g, { first }) {
      if (first) g.say('幾箱瓶裝水靠在牆邊。一種標籤完整，寫著「杏仁」；另一種標籤被磨掉了一半，只剩「…ASHEW」。');
    },
    draw(ctx, t, s, R) {
      box(ctx, R, almondStack);
      box(ctx, R, cashewStack);
    },
    hotspots: [
      back('sq_junction', '退回交匯房'),
      hit('almond', boxRect(almondStack, 8), '標籤完整的水箱', (g) => {
        if (once(g, 'sq_almond')) g.give('almond', '你拿了一瓶杏仁水。瓶身微溫，標籤完整。');
        else g.say('箱子裡的水瓶已經拿走了。');
      }),
      hit('cashew', boxRect(cashewStack, 8), '標籤磨掉一半的水箱', (g) => {
        if (once(g, 'sq_cashew')) g.give('cashew', '你拿了一瓶水，標籤只剩「…ASHEW」。在這一層，你分不出它是哪一種。');
        else g.say('箱子裡剩下的水瓶，標籤都一樣被磨掉了。');
      }),
    ],
  },
};
