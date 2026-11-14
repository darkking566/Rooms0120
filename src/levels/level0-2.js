// Level 0.2 "Remodeled Mess" (PandaShark71004, CC BY-SA 3.0). Puzzles, scene text and J.H. notes are original.
import { H, P, W, bounds, box, boxRect, faceQuad, paper, poly, seg, shade, wallQuad } from '../render.js';
import { rand } from '../rng.js';
import { back, clockOf, glow, hit, once, outline, pal, room, txt } from './sublevel-kit.js';

// ================= Level 0.2 "Remodeled Mess" =================
// A remodelled stretch of Level 0: dry carpet, fresh paint, working outlets, even a restroom.
// Touch the remodelling company's tools and it all comes down to a half-built wooden house; the
// collapse only stops at the door back to Level 0, and next time it is all good as new.
const fresh = pal('#ece4c4', '#f6f2e2', '#a8a07a', '#2e2a1c', '#fffbea');
const frame = pal('#8a7050', '#3e3122', '#76603f', '#0c0905', '#ffe2b0');
const shaky = (t) => (Math.sin(t * 13.1) + Math.sin(t * 7.3 + 1) + Math.sin(t * 29.7) > 2.2 ? 0.5 : 0.94 + 0.06 * Math.sin(t * 31));
const freshHallR = room(fresh, { hw: 1.6, depth: 6, fogEnd: 14, tiles: true, floorTex: 'carpet', lights: [1.8, 3.6, 5.4] });
const wcR = room(pal('#e6ecee', '#f4f6f6', '#c8d0d2', '#1c2224', '#f4fbff'), { hw: 1.2, depth: 3.5, fogEnd: 12, tiles: true, floorTex: 'concrete', lights: [1.9] });
const officeR = room(pal('#e4dcc0', '#f2eedc', '#8e8a7a', '#26241c', '#fff8e6'), { hw: 1.6, depth: 4.5, fogEnd: 12, tiles: true, floorTex: 'carpet', lights: [2.2] });
const frameR = room(frame, { hw: 1.6, depth: 5, fogEnd: 9, floorTex: 'concrete', baseboard: false, lights: [1.8], flickerLights: [0], flick: shaky });
const joistR = room(frame, { hw: 1.6, depth: 6, fogEnd: 9, floorTex: 'concrete', baseboard: false, lights: [4.8], flickerLights: [0], flick: shaky });
const exitR = room(frame, { hw: 1.6, depth: 4, fogEnd: 10, floorTex: 'concrete', baseboard: false, lights: [2.0], flick: shaky });

export const L02_COLLAPSE = 40; // seconds from the first falling wall to the house coming down
export const tileFalling = (s) => clockOf(s) % 2.8 < 1.0;
const l02Left = (s) => Math.max(0, Math.ceil((s.flags.l02_until || 0) - clockOf(s)));

// Everything resets when you leave: the next visit finds the rooms as good as new.
function restoreL02(g) {
  for (const k of ['l02_collapsed', 'l02_mask', 'l02_sink', 'l02_towel', 'l02_until', 'l02_crack']) g.flag(k, false);
}
function collapse(g, msg) {
  g.flag('l02_collapsed'); g.flag('l02_seen');
  g.flag('l02_until', clockOf(g.s) + L02_COLLAPSE);
  g.flag('l02_crack', rand() < 0.5 ? 'left' : 'right');
  g.sfx('open');
  g.go('l02_frame', { free: true, msg });
}
function collapseTick(g, dt) {
  const f = g.s.flags;
  if (!f.l02_collapsed) return;
  if (clockOf(g.s) >= f.l02_until) {
    restoreL02(g); g.sanity(-15); g.sfx('thud');
    return g.go('l0_dry', { free: true, msg: '頭頂的橫樑斷了，整棟房子朝你壓下來——你被一股力量甩出門外，摔回了乾燥的走廊。身上全是木屑。' });
  }
  // the dust: a wet paper towel over your mouth helps a lot
  f.l02_dust = (f.l02_dust || 0) + dt * (f.l02_mask ? 0.3 : 1);
  if (f.l02_dust >= 2) { f.l02_dust -= 2; g.sanity(-1); }
}
const collapseLabel = (s) => (s.flags.l02_collapsed
  ? `房子在崩塌・還剩 ${l02Left(s)} 秒${s.flags.l02_mask ? '・濕紙巾擋住了灰塵' : '・灰塵嗆得你一直咳'}` : null);
function leaveFrame(g, msg) { restoreL02(g); g.go('l0_dry', { free: true, msg }); }

function studs(ctx, R) {
  for (const sd of [-1, 1]) {
    for (let z = 1.2; z < R.depth; z += 0.45) seg(ctx, P(sd * R.hw, -1, z), P(sd * R.hw, 1, z), shade(R, '#b89a6a', z), Math.max(2, 9 / z));
    seg(ctx, P(sd * R.hw, 0, 1), P(sd * R.hw, 0, R.depth), shade(R, '#b89a6a', 2.5), 3);
  }
  for (let x = -R.hw; x <= R.hw; x += 0.4) seg(ctx, P(x, -1, 1), P(x, -1, R.depth), shade(R, '#6b5434', 2.5), 3);
}
function dust(ctx, t, n = 30, a = 0.5) {
  ctx.fillStyle = `rgba(220,200,160,${a})`;
  for (let i = 0; i < n; i++) { const x = (i * 97 + Math.sin(t + i) * 20) % W, y = (t * (90 + (i % 5) * 20) + i * 53) % H; ctx.fillRect(x, y, 2, 2); }
  ctx.fillStyle = 'rgba(200,180,140,0.07)'; ctx.fillRect(0, 0, W, H);
}
function cassette(ctx, R, b) {
  box(ctx, R, b);
  const c = P((b.x1 + b.x2) / 2, b.y1, (b.z1 + b.z2) / 2);
  ctx.fillStyle = shade(R, '#e9e1c1', b.z1); ctx.fillRect(c[0] - 6, c[1] - 2, 12, 3);
}
// a plain Level 0 door in a scrap of yellow wallpaper: the one thing that never falls
function level0Door(ctx, R, z, t) {
  poly(ctx, faceQuad(-0.62, -0.75, 0.62, 1, z + 0.001), shade(R, '#c8b35e', z, 1.1));
  for (let x = -0.55; x < 0.6; x += 0.14) seg(ctx, P(x, -0.75, z), P(x, 1, z), shade(R, '#b39e4c', z), 1);
  poly(ctx, faceQuad(-0.4, -0.55, 0.4, 1, z), shade(R, '#a68a5c', z, 1.1));
  const k = P(0.28, 0.25, z); ctx.fillStyle = shade(R, '#d8c08a', z); ctx.fillRect(k[0] - 3, k[1] - 2, 6, 4);
  const b1 = P(-0.4, 1, z), b2 = P(0.4, 1, z);
  ctx.fillStyle = `rgba(255,236,150,${0.55 + 0.1 * Math.sin(t * 50)})`; ctx.fillRect(b1[0], b1[1] - 3, b2[0] - b1[0], 3);
  glow(ctx, (b1[0] + b2[0]) / 2, b1[1], 60, 'rgba(255,230,140,0.35)');
}

// remodelled hall
const wcDoor = wallQuad(-1.6, -0.5, 1, 2.2, 3.0);
const officeDoor = faceQuad(-0.5, -0.5, 0.5, 1, 5.999);
const router = wallQuad(1.6, -0.55, -0.42, 2.0, 2.4);
const wetSign = wallQuad(-1.6, -0.2, 0.2, 3.6, 4.2);
const hallLamp = { x: 1.15, z: 3.6 };
const hallOutlet = wallQuad(1.6, 0.5, 0.66, 3.75, 3.95);
// restroom
const sink = { x1: -1.2, x2: -0.75, y1: 0.12, y2: 0.28, z1: 1.9, z2: 2.5, color: '#f2f4f4', edge: true };
const mirror = wallQuad(-1.2, -0.62, 0.02, 1.9, 2.5);
const towels = faceQuad(-0.25, -0.3, 0.2, 0.12, 3.499);
const dryer = wallQuad(1.2, -0.15, 0.12, 1.9, 2.3);
const stall = wallQuad(1.2, -0.7, 0.95, 2.6, 3.4);
// site office
const desk = { x1: -1.3, x2: -0.15, y1: 0.42, y2: 0.52, z1: 2.3, z2: 3.0, color: '#b49a6e', edge: true };
const clipQuad = [P(-1.0, 0.42, 2.45), P(-0.6, 0.42, 2.45), P(-0.6, 0.42, 2.8), P(-1.0, 0.42, 2.8)];
const hatAt = [-0.38, 0.42, 2.6];
const toolboxB = { x1: 0.4, x2: 0.95, y1: 0.78, y2: 1, z1: 2.2, z2: 2.55, color: '#b8352a', edge: true };
const blueprint = faceQuad(-0.2, -0.55, 1.0, 0.15, 4.499);
// half-built house
const tape2B = { x1: -0.85, x2: -0.6, y1: 0.93, y2: 1, z1: 2.3, z2: 2.5, color: '#1e1e20', edge: true };
const voids = [wallQuad(-1.6, -0.6, 0.3, 2.0, 2.6), wallQuad(1.6, -0.9, 0.1, 3.0, 3.8), faceQuad(0.6, -0.8, 1.2, -0.2, 4.999)];
const brokenDesk = { x1: -1.3, x2: -0.3, y1: 0.62, y2: 0.72, z1: 3.2, z2: 3.8, color: '#7a6040', edge: true };
// caved-in hall
const JOIST = { left: -0.6, right: 0.6 };
const joistRect = { left: [315, 325, 120, 95], right: [525, 325, 120, 95] };

export const L02_SCENES = {
  l02_room: {
    level: 0.2, title: '翻新過的走廊', room: freshHallR, quiet: 0.2,
    viewMsg: '觀景窗裡，新油漆底下看得到一根根木頭骨架的輪廓——好像牆只有一層皮。',
    enter(g, { first }) {
      if (first) g.say('太乾淨了。乾燥的地毯、剛刷好的米白色牆，連嗡嗡聲都聽不到。牆上的路由器一閃一閃，左邊有一扇洗手間的門。走廊盡頭的雙開門上貼著一張紙：「施工辦公室」。');
    },
    draw(ctx, t, s, R) {
      poly(ctx, wcDoor, shade(R, '#d6d0bc', 2.6));
      outline(ctx, wcDoor, shade(R, '#9a9482', 2.6), 2);
      const sg = P(-1.6, -0.3, 2.6); ctx.fillStyle = shade(R, '#3a6ab0', 2.6); ctx.fillRect(sg[0] - 9, sg[1] - 7, 18, 14);
      txt(ctx, 'WC', sg[0], sg[1] + 4, '#fff', 9);
      paper(ctx, R, wetSign, 3.9, '#f4f0e0');
      const ws = P(-1.6, 0, 3.9); txt(ctx, '油漆未乾', ws[0], ws[1] + 4, shade(R, '#b83a2a', 3.9), 10);
      poly(ctx, router, shade(R, '#f6f6f2', 2.2));
      for (let i = 0; i < 3; i++) {
        const p = P(1.6, -0.46, 2.08 + i * 0.1), on = Math.sin(t * (5 + i * 3) + i) > 0;
        ctx.fillStyle = on ? '#3cff6a' : '#145a24'; ctx.fillRect(p[0] - 2, p[1] - 2, 4, 4);
      }
      seg(ctx, P(1.6, -0.55, 2.1), P(1.6, -0.78, 2.05), shade(R, '#333', 2.1), 2);
      seg(ctx, P(1.6, -0.55, 2.3), P(1.6, -0.78, 2.36), shade(R, '#333', 2.3), 2);
      poly(ctx, hallOutlet, shade(R, '#ffffff', 3.8));
      const lp = P(hallLamp.x, 1, hallLamp.z), lt = P(hallLamp.x, -0.1, hallLamp.z);
      seg(ctx, lp, lt, shade(R, '#555', hallLamp.z), 3);
      seg(ctx, lp, P(1.6, 0.6, 3.85), shade(R, '#444', 3.7), 1.5);
      ctx.save(); ctx.shadowColor = 'rgba(255,240,200,0.9)'; ctx.shadowBlur = 30;
      ctx.fillStyle = '#fff4d6'; ctx.beginPath(); ctx.moveTo(lt[0] - 16, lt[1] + 9); ctx.lineTo(lt[0] + 16, lt[1] + 9); ctx.lineTo(lt[0] + 9, lt[1] - 11); ctx.lineTo(lt[0] - 9, lt[1] - 11); ctx.fill();
      ctx.restore();
      poly(ctx, officeDoor, shade(R, '#c4bca4', 6));
      seg(ctx, P(0, -0.5, 6), P(0, 1, 6), shade(R, '#8a8470', 6), 2);
      paper(ctx, R, faceQuad(-0.28, -0.3, 0.28, -0.08, 5.998), 6, '#ffffff');
      const os = P(0, -0.17, 6); txt(ctx, '施工辦公室', os[0], os[1] + 3, shade(R, '#333', 6), 8);
    },
    hotspots: [
      { ...back('l0_dry', '回到乾燥的走廊'), click: (g) => { restoreL02(g); g.go('l0_dry'); } },
      hit('wc', bounds(wcDoor, 4), '洗手間', (g) => g.go('l02_wc', { msg: '你推開洗手間的門。白色磁磚亮得刺眼，空氣裡有芳香劑的味道。' }), 'go'),
      hit('router', bounds(router, 10), '路由器', (g) => {
        g.say('路由器的燈在閃。WiFi 名稱是「BRC_GUEST」，訊號滿格，不用密碼。可是不管打開哪個網站，都只會跳出同一行字：「真正的整潔來自於裝潢」。');
        if (once(g, 'l02_wifi')) g.sanity(3);
      }),
      hit('paint', bounds(wetSign, 10), '「油漆未乾」', (g) => g.say('你用指尖碰了一下牆。油漆真的還是濕的——指尖底下的牆皮軟軟地陷了進去，後面是空心的。')),
      hit('lamp', [610, 245, 70, 110], '立燈和插座', (g) => g.say('一盞插著電的立燈。插座是真的有電，連開關都是新的。電線從插座後面……接到哪裡去？')),
      hit('forward', bounds(officeDoor, 8), '推開「施工辦公室」的門', (g) => {
        if (g.s.flags.screwdriver) return collapse(g, '你一踏進辦公室，地板就猛地一沉。上次的事又要重演了——天花板的板子一片片掉下來，牆壁朝外倒，露出後面的木頭骨架。');
        g.go('l02_office');
      }, 'go'),
    ],
  },

  l02_wc: {
    level: 0.2, title: '洗手間', room: wcR, safe: true, quiet: 0.15,
    viewMsg: '觀景窗裡，鏡子裡你身後的那面牆，只蓋到一半。',
    enter(g, { first }) {
      if (first) g.say('一間乾乾淨淨的洗手間：洗手台、鏡子、擦手紙、烘手機，角落還有一間隔間。在後室裡看到這種地方，反而讓人更不安。');
    },
    draw(ctx, t, s, R) {
      poly(ctx, mirror, shade(R, '#b8c4c8', 2.2, 1.1));
      outline(ctx, mirror, shade(R, '#7a8488', 2.2), 2);
      const m = P(-1.2, -0.25, 2.2); ctx.fillStyle = shade(R, '#8a7050', 2.2, 0.8);
      for (let i = 0; i < 4; i++) ctx.fillRect(m[0] - 18 + i * 12, m[1] - 30, 3, 70);
      box(ctx, R, sink);
      seg(ctx, P(-1.0, 0.28, 2.2), P(-1.0, 1, 2.2), shade(R, '#dfe3e3', 2.2), 8);
      const fau = P(-1.12, 0.05, 2.2); ctx.fillStyle = shade(R, '#a0a8ac', 2.2); ctx.fillRect(fau[0] - 4, fau[1], 14, 5);
      poly(ctx, towels, shade(R, '#8a9296', 3.5)); outline(ctx, towels, shade(R, '#5a6266', 3.5), 2);
      if (!s.flags.l02_towel) { const tt = P(-0.02, 0.15, 3.5); ctx.fillStyle = '#fff'; ctx.fillRect(tt[0] - 10, tt[1] - 2, 20, 10); }
      poly(ctx, dryer, shade(R, '#7c8488', 2.1)); outline(ctx, dryer, shade(R, '#4a5054', 2.1), 2);
      const dn = P(1.2, 0.12, 2.1); ctx.fillStyle = shade(R, '#2a2e30', 2.1); ctx.fillRect(dn[0] - 18, dn[1] - 3, 22, 4);
      poly(ctx, stall, shade(R, '#8aa4b0', 3));
      outline(ctx, stall, shade(R, '#56707a', 3), 2);
      const gr = P(1.2, 0.1, 2.95); txt(ctx, 'J.H.', gr[0], gr[1], shade(R, '#2a2a2a', 3), 9);
    },
    hotspots: [
      back('l02_room', '回到走廊'),
      hit('mirror', bounds(mirror, 4), '鏡子', (g) => {
        g.say('鏡子裡的你很狼狽。你身後的牆在鏡子裡只蓋到一半：油漆、石膏板，然後是一根根光禿禿的木條。你回頭——牆好好的。');
        if (once(g, 'l02_mirror')) g.sanity(-2);
      }),
      { ...hit('sink', boxRect(sink, 10), '洗手台', (g) => {
        if (g.s.flags.l02_sink) return g.say('水龍頭只滴下幾滴就停了。');
        g.flag('l02_sink'); g.sfx('drink'); g.drink(25);
        g.say('水龍頭流出來的是乾淨的自來水。你捧起來喝了好幾口——冰涼、沒有怪味，真正的水。');
      }, 'take') },
      { ...hit('towel', bounds(towels, 8), '擦手紙', (g) => {
        if (g.s.flags.l02_towel || g.has('towel')) return g.say('擦手紙抽完了。你身上已經有一張了。');
        g.flag('l02_towel');
        g.give('towel', '你抽了一張擦手紙，在水龍頭底下沾濕，摺成一小塊收起來。');
      }, 'take') },
      hit('dryer', bounds(dryer, 8), '烘手機', (g) => { g.sfx('steam'); g.say('你把手伸到烘手機底下。它轟轟地吹出熱風——吹了很久都不停。熱風裡有一股木屑的味道。'); }),
      hit('stall', bounds(stall, 4), '隔間的門', (g) => g.say('隔間是空的。門板內側有人用麥克筆寫了一行字，旁邊簽著「J.H.」：\n「別碰他們的工具。碰了也別回頭，一直往有黃色牆紙的門跑。帶塊濕布摀住嘴。」')),
    ],
  },

  l02_office: {
    level: 0.2, title: '施工辦公室', room: officeR, quiet: 0.2,
    viewMsg: '觀景窗裡，藍圖上畫的不是這間辦公室，而是一整片沒有盡頭的 Level 0。',
    enter(g, { first }) {
      if (first) g.say('一間臨時的工地辦公室。桌上堆著一疊板夾，旁邊擺著一頂黃色安全帽。牆上貼著藍圖。地上放著一個紅色的工具箱。');
    },
    draw(ctx, t, s, R) {
      poly(ctx, blueprint, shade(R, '#2a4a8a', 4.5));
      ctx.strokeStyle = shade(R, '#c8d8ff', 4.5); ctx.lineWidth = 1;
      const [bx, by, bw, bh] = bounds(blueprint);
      for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(bx + (bw * i) / 6, by + 4); ctx.lineTo(bx + (bw * i) / 6, by + bh - 4); ctx.stroke(); }
      for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(bx + 4, by + (bh * i) / 3); ctx.lineTo(bx + bw - 4, by + (bh * i) / 3); ctx.stroke(); }
      ctx.strokeStyle = '#ff5a4a'; ctx.strokeRect(bx + bw * 0.36, by + bh * 0.4, bw * 0.16, bh * 0.22);
      box(ctx, R, desk);
      for (const [x, z] of [[-1.25, 2.35], [-0.2, 2.35], [-1.25, 2.95], [-0.2, 2.95]]) seg(ctx, P(x, 0.52, z), P(x, 1, z), shade(R, '#6a5838', z), 3);
      paper(ctx, R, clipQuad, 2.6, '#efe9d6');
      const cq = P(-0.8, 0.42, 2.45); ctx.fillStyle = shade(R, '#8a6a3a', 2.5); ctx.fillRect(cq[0] - 8, cq[1] - 3, 16, 4);
      const h = P(...hatAt), r = 15 / (hatAt[2] / 2.4);
      ctx.fillStyle = shade(R, '#e8c21e', hatAt[2]); ctx.beginPath(); ctx.arc(h[0], h[1], r, Math.PI, 0); ctx.fill(); ctx.fillRect(h[0] - r - 4, h[1] - 2, r * 2 + 8, 3);
      txt(ctx, '102', h[0], h[1] - 4, shade(R, '#333', 2.6), 8);
      if (!s.flags.screwdriver) box(ctx, R, toolboxB);
    },
    hotspots: [
      back('l02_room', '回到走廊'),
      hit('clipboard', bounds(clipQuad, 14), '一疊板夾', (g) => g.read('n02_clip')),
      hit('hat', [P(...hatAt)[0] - 24, P(...hatAt)[1] - 22, 48, 28], '安全帽', (g) => g.say('黃色的安全帽，側面印著「102-CX」。內襯還是溫的，好像有人剛摘下來。')),
      hit('blueprint', bounds(blueprint, 6), '藍圖', (g) => g.say('藍圖標題寫著「A880-1：Level 0・A 級重塑」。格子一格接一格，一直畫到紙的邊緣外面。中間有一小塊被紅筆圈起來，旁邊寫著：「先從這裡開始」。那一小塊，就是你站著的地方。')),
      {
        ...hit('toolbox', boxRect(toolboxB, 8), '紅色工具箱', (g) => {
          g.flag('screwdriver'); g.give('screwdriver');
          collapse(g, '你從工具箱裡拿起一支螺絲起子——整棟房子猛地一震。天花板的板子一片片掉下來，牆壁朝外倒，露出後面蓋到一半的木頭骨架。');
        }, 'take'),
        when: (s) => !s.flags.screwdriver,
      },
    ],
  },

  l02_frame: {
    level: 0.2, title: '蓋到一半的房子', room: frameR, quiet: 0.3, hazard: collapseLabel, update: collapseTick,
    viewMsg: '觀景窗裡，牆上的破洞外面什麼都沒有。不是黑暗，是什麼都沒有。',
    enter(g) { g.say('牆上的破洞外面什麼都沒有。得趕快找到門——那扇有黃色牆紙的門。'); },
    draw(ctx, t, s, R) {
      studs(ctx, R);
      for (const q of voids) poly(ctx, q, '#000');
      box(ctx, R, brokenDesk);
      seg(ctx, P(-1.25, 0.72, 3.3), P(-1.3, 1, 3.4), shade(R, '#5a4430', 3.3), 3);
      if (!s.flags.tape2) cassette(ctx, R, tape2B);
      dust(ctx, t, 30, s.flags.l02_mask ? 0.35 : 0.55);
    },
    hotspots: [
      { ...back('l02_joists', '轉身往外跑'), click: (g) => g.go('l02_joists') },
      hit('void', bounds(voids[1], 4), '牆上的破洞', (g) => { g.sanity(-2); g.say('你往破洞外看。外面不是黑暗，也不是別的房間，是「什麼都沒有」。你的眼睛找不到任何可以對焦的東西。'); }),
      { ...hit('tape2', boxRect(tape2B, 14), '木屑裡的錄影帶', (g) => { g.flag('tape2'); g.give('tape2', '木屑堆裡躺著一卷錄影帶，標籤上寫著「#2」。'); }, 'take'), when: (s) => !s.flags.tape2 },
    ],
  },

  l02_joists: {
    level: 0.2, title: '塌陷的走廊', room: joistR, quiet: 0.3, hazard: collapseLabel, update: collapseTick,
    viewMsg: '觀景窗裡，其中一根托樑底下的木屑，一直在往下掉。',
    enter(g, { first }) {
      if (first || g.s.flags.l02_collapsed) g.say('來時的走廊塌了。地板整片掉進「什麼都沒有」裡，只剩兩根托樑橫跨過去。對面，走廊盡頭還有一扇沒倒的門。其中一根托樑在嘎吱作響。');
    },
    draw(ctx, t, s, R) {
      studs(ctx, R);
      poly(ctx, [P(-1.6, 1, 1.4), P(1.6, 1, 1.4), P(1.6, 1, 4.4), P(-1.6, 1, 4.4)], '#000');
      for (const side of ['left', 'right']) {
        const x = JOIST[side], cracked = s.flags.l02_crack === side, sag = cracked ? 0.09 : 0;
        const pts = [P(x - 0.08, 1, 1.2), P(x + 0.08, 1, 1.2), P(x + 0.08, 1 + sag, 2.8), P(x + 0.08, 1, 4.6), P(x - 0.08, 1, 4.6), P(x - 0.08, 1 + sag, 2.8)];
        poly(ctx, pts, shade(R, cracked ? '#8a6c44' : '#a4865a', 2.6));
        if (cracked) {
          const c1 = P(x - 0.07, 1 + sag, 2.75), c2 = P(x, 1 + sag, 2.82), c3 = P(x + 0.07, 1 + sag, 2.78);
          ctx.strokeStyle = '#140c06'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(c1[0] - 4, c1[1] - 2); ctx.lineTo(c2[0] - 3, c2[1] + 4); ctx.lineTo(c2[0] + 3, c2[1] - 3); ctx.lineTo(c3[0] + 4, c3[1] + 2); ctx.stroke();
          ctx.fillStyle = 'rgba(230,210,170,0.85)';
          for (let i = 0; i < 14; i++) { const y = c2[1] + 4 + ((t * 70 + i * 17) % 150); ctx.fillRect(c2[0] - 6 + (i % 4) * 4, y, 2, 3); }
          const jig = Math.sin(t * 40) * 1.2; seg(ctx, [c2[0] - 10 + jig, c2[1] + 2], [c2[0] - 22 + jig, c2[1] - 6], '#c8a874', 2);
        }
      }
      level0Door(ctx, R, 5.999, t);
      dust(ctx, t, 22, s.flags.l02_mask ? 0.3 : 0.5);
    },
    hotspots: [
      { ...back('l02_frame', '退回骨架裡'), click: (g) => g.go('l02_frame') },
      hit('void', [380, 420, 200, 40], '腳下的空洞', (g) => g.say('托樑底下什麼都沒有。不是很深——是根本沒有底。')),
      ...['left', 'right'].map((side) => hit(side, joistRect[side], side === 'left' ? '踩著左邊的托樑過去' : '踩著右邊的托樑過去', (g) => {
        if (g.s.flags.l02_crack === side) {
          g.sfx('thud'); g.sanity(-20);
          return leaveFrame(g, '托樑在你腳下啪一聲斷了。你掉進「什麼都沒有」裡——沒有風聲，沒有下墜的感覺，什麼都沒有。等你回過神來，你趴在乾燥走廊的地毯上，嘴裡全是木屑。');
        }
        g.go('l02_exit', { msg: '你張開雙臂，一步一步踩著托樑走過去。底下什麼都沒有。另一根托樑在你身後斷成兩截，掉進虛無裡，連聲音都沒有。' });
      }, 'go')),
    ],
  },

  l02_exit: {
    level: 0.2, title: '最後一段走廊', room: exitR, quiet: 0.3, hazard: collapseLabel, update: collapseTick,
    viewMsg: '觀景窗裡，那扇門周圍的牆紙一點灰塵都沒沾。',
    enter(g) { g.say('只剩最後幾步了。黃色牆紙的門就在前面，可是門前的天花板一直在往下掉板子，一片接一片，砸得很有節奏。'); },
    draw(ctx, t, s, R) {
      studs(ctx, R);
      level0Door(ctx, R, 3.999, t);
      const k = clockOf(s) % 2.8, z = 2.3;
      if (k < 1.0) {
        const y = -1 + (k / 1.0) * 1.96;
        poly(ctx, [P(-0.45, y, z - 0.3), P(0.45, y, z - 0.3), P(0.45, y + 0.04, z + 0.3), P(-0.45, y + 0.04, z + 0.3)], shade(R, '#d6cc96', z));
      } else {
        const a = Math.min(0.55, (k - 1.0) / 1.8 * 0.55);
        ctx.fillStyle = `rgba(0,0,0,${a})`; poly(ctx, [P(-0.5, 1, z - 0.35), P(0.5, 1, z - 0.35), P(0.5, 1, z + 0.35), P(-0.5, 1, z + 0.35)]); ctx.fill();
        poly(ctx, [P(-0.45, -1, z - 0.3), P(0.45, -1, z - 0.3), P(0.45, -1, z + 0.3), P(-0.45, -1, z + 0.3)], '#000');
      }
      for (let i = 0; i < 5; i++) { const p = P(-0.9 + i * 0.4, 0.98, 1.6 + (i % 2) * 0.5); ctx.fillStyle = shade(R, '#bfb488', 1.8); ctx.fillRect(p[0] - 14, p[1] - 3, 28, 5); }
      dust(ctx, t, 20, s.flags.l02_mask ? 0.3 : 0.5);
    },
    hotspots: [
      { ...back('l02_joists', '退回托樑那邊'), click: (g) => g.go('l02_joists') },
      hit('tiles', [400, 150, 160, 60], '掉落的天花板', (g) => g.say(tileFalling(g.s) ? '板子正在往下掉！' : '天花板上的洞在嘎嘎作響，下一片板子隨時會掉下來。等它砸完再衝。')),
      hit('forward', bounds(faceQuad(-0.4, -0.55, 0.4, 1, 3.999), 10), '衝向黃色牆紙的門', (g) => {
        if (tileFalling(g.s)) {
          g.sfx('thud'); g.sanity(-8);
          return g.say('一片天花板正好砸在你的肩膀上。你踉蹌著退回來，眼前一陣發黑。等它掉完再衝。');
        }
        leaveFrame(g, '你趁兩片板子之間的空檔衝過去，撞開那扇門——撲面而來的是潮濕的地毯味和熟悉的嗡嗡聲。身後傳來最後一聲轟響，然後什麼都沒有了。回頭看，門後又是那條乾淨的新走廊，好像什麼都沒發生過。');
      }, 'go'),
    ],
  },
};
