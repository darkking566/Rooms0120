// Faithful playable adaptation of the Backrooms Wiki CN Level 1 "宜居地帶" article:
//   - Aquila, Gild, Gothic, Fabled Sectors (plus Ouroboros & Garden links)
//   - Stephanie Ashford's journey (crowbar, Compass Point, Paths, mattress nightmare, 4-claw door, rations, Skin-Stealer, Alpha Base, Tom's Diner)
//   - All 7 settlements (M.E.G. Alpha Base, B.N.T.G. Trader's Keep & Vault, Hippocrates-1, Camp Amber, Cornucopia, Speednoclippers, Tom's Diner)
//   - The Paths (5 room types, disappearing floor paintings, Ariadne's Thread Nomad Camp, embedded-chair rubber room, wall+floor painting room)
//   - Entrances, Exits (Hub sequence, Doors, Smooth Thresholds, Noclips) & Sublevels (1.1, 1.2, sqrt(2), 1.5)
import { P, bottle, bounds, boxRect, drawFigure, faceQuad, paper, poly, seg, shade, wallQuad } from '../render.js';
import { BACK, FORWARD, PAL, flickery } from './common.js';
import {
  drawBooth, drawDebrisPile, drawDinerBooth, drawGothicArch, drawHospitalBed,
  drawMattressPile, drawRoundColumn, drawShelfRack, drawTable, drawWoodCrate,
} from './level1-props.js';
import { drawBlanket, drawKettle, drawTent, glow, txt } from './sublevel-kit.js';

const base1 = { floorTex: 'concrete', wallTex: 'concrete', baseboard: false, flick: flickery };

const PAL_WIKI = {
  aquila: { wall: '#626664', ceil: '#323534', floor: '#444745', fog: '#0b0c0c', light: '#dce4ee' },
  alpha: { wall: '#787468', ceil: '#44413a', floor: '#524f46', fog: '#100f0d', light: '#fff0c8' },
  diner: { wall: '#7c5c48', ceil: '#3d2c22', floor: '#4d3b30', fog: '#140c08', light: '#ffcf88' },
  argos: { wall: '#50545a', ceil: '#292c30', floor: '#383b40', fog: '#090a0c', light: '#d6deec' },
  gild: { wall: '#8f7d4e', ceil: '#4d442b', floor: '#5c5238', fog: '#161209', light: '#ffeaa8' },
  gothic: { wall: '#5e5d64', ceil: '#2e2d34', floor: '#3c3b42', fog: '#0a090e', light: '#dcd8f0' },
  ariane: { wall: '#8ea09c', ceil: '#596864', floor: '#62706c', fog: '#0d1412', light: '#e8fff8' },
  fabled: { wall: '#7a2f28', ceil: '#261a24', floor: '#3e2924', fog: '#10080c', light: '#ff70c8' },
  paths: { wall: '#8c8a84', ceil: '#504f4b', floor: '#5c5a55', fog: '#10100f', light: '#e8e4d4' },
  rubber: { wall: '#b8b2a2', ceil: '#807c70', floor: '#6b675d', fog: '#141310', light: '#f4eed8' },
  gallery: { wall: '#4d5258', ceil: '#25282c', floor: '#34383d', fog: '#08090b', light: '#cfe4ff' },
};

function frameDoor(ctx, R, q, z, fill = '#5d6266', trim = '#26282a', label = null) {
  poly(ctx, q, shade(R, fill, z));
  ctx.strokeStyle = shade(R, trim, z);
  ctx.lineWidth = 2;
  poly(ctx, q);
  ctx.stroke();
  if (label) {
    const [x, y, w] = bounds(q);
    txt(ctx, label, x + w / 2, y - 6, shade(R, '#eae6d4', z), 10);
  }
}

function drawPainting(ctx, R, q, z, sky = '#5c7c98', ground = '#465836') {
  poly(ctx, q, shade(R, sky, z));
  const [x, y, w, h] = bounds(q);
  ctx.fillStyle = shade(R, ground, z);
  ctx.fillRect(x + 2, y + h * 0.55, w - 4, h * 0.42);
  ctx.strokeStyle = shade(R, '#5c4224', z);
  ctx.lineWidth = 3;
  poly(ctx, q);
  ctx.stroke();
}

function drawPillar(ctx, R, x1, x2, z1, z2, color = '#5e6260') {
  drawRoundColumn(ctx, R, (x1 + x2) / 2, z1, z2, (x2 - x1) / 2, color);
}

// ---------- Geometries ----------
// Sector 1: Aquila, Alpha Gate, Alpha Base, Tom's Diner, Cornucopia
const rAquila = { ...base1, hw: 2.8, depth: 11, fogEnd: 7.5, pal: PAL_WIKI.aquila, lights: [2.2, 5.2, 8.2], flickerLights: [1] };
const aqDebris = { x1: 0.9, x2: 1.85, y1: 0.65, y2: 1, z1: 2.3, z2: 3.1, color: '#6b563c', edge: true };
const aqCloth = [P(0.25, 0.99, 2.2), P(0.75, 0.99, 2.2), P(0.7, 0.99, 2.65), P(0.2, 0.99, 2.65)];
const aqAlmond = { p: P(0.48, 0.98, 2.42), z: 2.42 };
const aqAlphaDoor = faceQuad(-0.48, -0.62, 0.48, 1, 10.98);
const aqGildDoor = wallQuad(2.8, -0.6, 1, 3.8, 5.0);
const aqPathsDoor = wallQuad(-2.8, -0.6, 1, 3.6, 4.8);
const aqFloorPaint = [P(-2.2, 0.99, 3.7), P(-1.45, 0.99, 3.7), P(-1.45, 0.99, 4.6), P(-2.2, 0.99, 4.6)];

const rAlphaGate = { ...base1, wallTex: undefined, hw: 2.2, depth: 7.5, fogEnd: 10.5, pal: PAL_WIKI.alpha, tiles: true, lights: [2.0, 4.8] };
const agBooth = { x1: -1.9, x2: -0.95, y1: -0.1, y2: 1, z1: 2.6, z2: 3.6, color: '#6b5336', edge: true };
const agPlaque = wallQuad(-2.2, -0.4, 0.1, 4.2, 4.9);
const agBaseDoor = faceQuad(-0.5, -0.62, 0.5, 1, 7.48);
const agGothicDoor = wallQuad(2.2, -0.6, 1, 3.2, 4.2);

const rAlphaBase = { ...base1, wallTex: undefined, hw: 2.5, depth: 8.5, fogEnd: 12, pal: PAL_WIKI.alpha, tiles: true, lights: [2.0, 4.6, 6.8] };
const abTent = { x1: -2.2, x2: -1.1, y1: 0.15, y2: 1, z1: 2.4, z2: 3.8, color: '#4d6044', edge: true };
const abBoard = faceQuad(-0.4, -0.55, 0.45, 0.15, 8.48);
const abSouthDoor = faceQuad(0.85, -0.5, 1.55, 1, 8.48);
const abDinerDoor = wallQuad(2.5, -0.6, 1, 2.8, 3.8);
const abArgosDoor = faceQuad(-1.3, -0.6, -0.6, 1, 8.48);

const rDiner = { ...base1, wallTex: undefined, hw: 2.1, depth: 6.5, fogEnd: 12, pal: PAL_WIKI.diner, tiles: true, lights: [2.0, 4.4] };
const dinerCounter = { x1: -0.6, x2: 1.9, y1: 0.25, y2: 1, z1: 3.2, z2: 4.0, color: '#6a4630', edge: true };
const dinerBooth = { x1: -1.9, x2: -0.95, y1: 0.4, y2: 1, z1: 2.3, z2: 3.5, color: '#8a342c', edge: true };
const dinerMenu = faceQuad(-0.3, -0.68, 1.2, -0.05, 6.48);

const rArgos = { ...base1, hw: 1.9, depth: 6.5, fogEnd: 11, pal: PAL_WIKI.argos, lights: [2.0, 4.4] };
const argosDesk = { x1: -0.7, x2: 0.7, y1: 0.35, y2: 1, z1: 3.0, z2: 3.7, color: '#42474e', edge: true };
const argosNotice = wallQuad(-1.9, -0.45, 0.1, 2.5, 3.3);

// Sector 2: Gild & Trader's Keep / Vault
const rGild = { ...base1, hw: 2.4, depth: 9.5, fogEnd: 9.5, pal: PAL_WIKI.gild, lights: [2.0, 4.5, 7.2] };
const gildCrate1 = { x1: -1.75, x2: -0.85, y1: 0.35, y2: 1, z1: 2.4, z2: 3.2, color: '#8f6e40', edge: true };
const gildCrate2 = { x1: 0.85, x2: 1.7, y1: 0.4, y2: 1, z1: 2.9, z2: 3.7, color: '#7a5d36', edge: true };
const gildGuide = wallQuad(-2.4, -0.35, 0.15, 3.6, 4.3);
const gildKeepDoor = faceQuad(-0.45, -0.62, 0.45, 1, 9.48);
const gildFabledDoor = wallQuad(2.4, -0.6, 1, 4.3, 5.4);

const rKeep = { ...base1, wallTex: undefined, hw: 2.2, depth: 6.5, fogEnd: 11.5, pal: PAL_WIKI.gild, tiles: true, lights: [2.2, 4.6] };
const keepStall = { x1: -1.8, x2: -0.2, y1: 0.25, y2: 1, z1: 2.6, z2: 3.4, color: '#6b5232', edge: true };
const keepSign = wallQuad(-2.2, -0.45, 0.05, 3.8, 4.6);
const keepVaultDoor = faceQuad(0.15, -0.65, 1.15, 1, 6.48);

const rVault = { ...base1, hw: 2.0, depth: 6, fogEnd: 10.5, pal: PAL_WIKI.argos, lights: [2.0, 4.2] };
const vaultCrate = { x1: -0.95, x2: 0.15, y1: 0.35, y2: 1, z1: 2.8, z2: 3.6, color: '#7a5f3e', edge: true };
const vaultLedger = wallQuad(2.0, -0.3, 0.15, 2.3, 2.9);

// Sector 3: Gothic & Hippocrates-1
const rGothic = { ...base1, hw: 2.1, depth: 9.5, fogEnd: 8.5, pal: PAL_WIKI.gothic, lights: [2.4, 6.0], flickerLights: [1] };
const gothDoor = faceQuad(-0.45, -0.6, 0.45, 1, 9.48);
const gothNote = wallQuad(-2.1, -0.3, 0.15, 2.4, 3.0);

const rHippocrates = { ...base1, wallTex: undefined, hw: 2.2, depth: 6.5, fogEnd: 12, pal: PAL_WIKI.ariane, tiles: true, lights: [2.2, 4.6] };
const hippoBed = { x1: -1.85, x2: -0.95, y1: 0.45, y2: 1, z1: 2.3, z2: 3.7, color: '#d8e4e0', edge: true };
const hippoClipp = wallQuad(-2.2, -0.55, 0.1, 4.0, 4.9);
const hippoManual = faceQuad(0.35, 0.22, 0.85, 0.38, 2.699);
const hippoTable = { x1: 0.2, x2: 1.2, y1: 0.38, y2: 1, z1: 2.7, z2: 3.4, color: '#586664', edge: true };

// Sector 4: Fabled
const rFabled = { ...base1, wallTex: undefined, hw: 2.0, depth: 9.0, fogEnd: 8.5, pal: PAL_WIKI.fabled, lights: [2.0, 5.0, 7.6], flickerLights: [2] };
const fabPlaque = wallQuad(-2.0, -0.35, 0.15, 2.4, 3.1);
const fabExitDoor = faceQuad(-0.45, -0.6, 0.45, 1, 8.98);

// Sector 5: The Paths + Sub-rooms + Threshold Gallery
const rPathsHub = { ...base1, hw: 1.35, depth: 8.5, fogEnd: 9.5, pal: PAL_WIKI.paths, lights: [1.8, 4.4, 7.0] };
const phCamp = { x1: 0.45, x2: 1.25, y1: 0.65, y2: 1, z1: 2.1, z2: 3.0, color: '#5c6a4a', edge: true };
const phNote = wallQuad(1.35, -0.28, 0.12, 2.1, 2.6);
const phRubberDoor = wallQuad(-1.35, -0.6, 1, 2.4, 3.4);
const phPaintDoor = wallQuad(1.35, -0.6, 1, 3.5, 4.5);
const phMattressDoor = faceQuad(-0.4, -0.6, 0.4, 1, 8.48);

const rRubber = { ...base1, wallTex: undefined, hw: 1.7, depth: 5.5, fogEnd: 11, pal: PAL_WIKI.rubber, lights: [2.4] };
const rubChairSeat = { x1: -0.32, x2: 0.32, y1: 0.78, y2: 1, z1: 3.1, z2: 3.65, color: '#6b4c30', edge: true };
const rubChairBack = { x1: -0.32, x2: 0.32, y1: 0.2, y2: 0.78, z1: 3.52, z2: 3.65, color: '#6b4c30', edge: true };
const rubDesk = { x1: -1.55, x2: -0.75, y1: 0.4, y2: 1, z1: 2.3, z2: 3.0, color: '#5a564c', edge: true };
const rubNote = faceQuad(-1.35, 0.22, -0.95, 0.38, 2.299);
const rubLock = wallQuad(1.7, -0.1, 0.15, 2.0, 2.35);

const rPaintRoom = { ...base1, wallTex: undefined, hw: 2.2, depth: 6.5, fogEnd: 11.5, pal: PAL_WIKI.paths, lights: [2.2, 4.8] };
const prWall1 = wallQuad(-2.2, -0.55, 0.2, 2.2, 3.3);
const prWall2 = faceQuad(-0.6, -0.6, 0.6, 0.25, 6.48);
const prFloor = [P(0.25, 0.99, 2.4), P(1.45, 0.99, 2.4), P(1.3, 0.99, 3.6), P(0.15, 0.99, 3.6)];
const prNote = wallQuad(2.2, -0.25, 0.15, 2.4, 3.0);

const rMattress = { ...base1, hw: 1.5, depth: 4.5, fogEnd: 10, pal: PAL_WIKI.paths, lights: [2.0] };
const matPile = { x1: -1.4, x2: -0.35, y1: 0.3, y2: 1, z1: 2.2, z2: 3.5, color: '#9c9482', edge: true };
const matForward = faceQuad(0.25, -0.6, 1.05, 1, 4.48);
const matNote = wallQuad(1.5, -0.25, 0.15, 2.1, 2.6);

const rStash = { ...base1, hw: 1.9, depth: 7.5, fogEnd: 10, pal: PAL_WIKI.aquila, lights: [2.0, 4.8] };
const stShelfL = { x1: -1.8, x2: -1.05, y1: -0.35, y2: 1, z1: 2.2, z2: 5.0, color: '#585e64', edge: true };
const stToyCrate = { x1: 0.95, x2: 1.65, y1: 0.45, y2: 1, z1: 2.3, z2: 3.0, color: '#826440', edge: true };
const stRationCrate = { x1: -0.95, x2: -0.2, y1: 0.45, y2: 1, z1: 4.2, z2: 4.9, color: '#705638', edge: true };
const stForward = faceQuad(-0.4, -0.6, 0.4, 1, 7.48);
const stNote = faceQuad(1.05, 0.35, 1.45, 0.45, 2.299);

const rSkinHall = { ...base1, hw: 1.6, depth: 9.5, fogEnd: 7.2, pal: PAL_WIKI.aquila, lights: [2.2, 5.2], flickerLights: [0, 1] };
const skinForward = faceQuad(-0.42, -0.6, 0.42, 1, 9.48);
const skinNote = wallQuad(-1.6, -0.25, 0.15, 2.3, 2.8);

const rThresh = { ...base1, hw: 2.2, depth: 9.5, fogEnd: 9.5, pal: PAL_WIKI.gallery, lights: [2.0, 5.0, 8.0] };
const thDoorL = wallQuad(-2.2, -0.6, 1, 2.8, 3.8);
const thDoorR = wallQuad(2.2, -0.6, 1, 2.8, 3.8);
const thDoorF = faceQuad(-0.45, -0.62, 0.45, 1, 9.48);
const thPortals = wallQuad(-2.2, -0.5, 0.4, 5.2, 6.8);
const thNote = wallQuad(2.2, -0.3, 0.15, 5.2, 5.9);

export const LEVEL1_WIKI = {
  // ---------------- SECTOR 1: AQUILA & ALPHA BASE ----------------
  l1_aquila: {
    level: 1, title: '天鷹段・混凝土巨柱廳', room: rAquila, flickerable: true, hall: true,
    enter(g, { first }) {
      g.flag('l1_paint_seen', !g.s.flags.l1_paint_seen);
      if (first) g.say('灰色水泥柱一路延伸進遠方，天花板滲水的管線正往下滴水。旁邊碎木板堆下露出一截金屬撬棍，地板上擺著一塊探險者總署的亮色地標布。');
    },
    draw(ctx, t, s, R) {
      drawPillar(ctx, R, -1.65, -1.15, 4.8, 5.3);
      drawPillar(ctx, R, 1.15, 1.65, 5.6, 6.1);
      const pd = P(-0.35, 1, 2.9);
      ctx.fillStyle = 'rgba(130, 155, 145, 0.22)';
      ctx.beginPath(); ctx.ellipse(pd[0], pd[1], 95, 13, 0, 0, Math.PI * 2); ctx.fill();
      drawDebrisPile(ctx, R, aqDebris);
      if (!s.flags.l1_crowbar) seg(ctx, P(1.1, 0.63, 2.35), P(1.65, 0.65, 2.85), '#8c949c', 5);
      poly(ctx, aqCloth, shade(R, '#d8c838', 2.4));
      if (!s.flags.l1_aq_almond) bottle(ctx, R, aqAlmond.p[0], aqAlmond.p[1], 36, aqAlmond.z);
      frameDoor(ctx, R, aqAlphaDoor, 10.9, '#3e463e', '#d8c84a', 'ALPHA 基地');
      frameDoor(ctx, R, aqGildDoor, 4.4, '#8c723e', '#d8b454', '躍金段 →');
      frameDoor(ctx, R, aqPathsDoor, 4.2, '#787670', '#383632', '← 小徑');
      if (s.flags.l1_paint_seen) drawPainting(ctx, R, aqFloorPaint, 4.1, '#4c6a84', '#38462c');
    },
    hotspots: [
      BACK('l1_arrive', '回到倉庫入口'),
      { ...FORWARD('l1_alpha_gate', '前往 M.E.G. Alpha 基地'), rect: bounds(aqAlphaDoor, 14) },
      { id: 'gild', rect: bounds(aqGildDoor, 8), label: '前往躍金段（Gild）', cursor: 'go', click: (g) => g.go('l1_gild') },
      { id: 'paths', rect: bounds(aqPathsDoor, 8), label: '推門進入「小徑」', cursor: 'go', click: (g) => g.go('l1_paths_hub') },
      {
        id: 'debris', rect: boxRect(aqDebris, 8), label: '木板與金屬殘骸堆', cursor: 'take',
        click: (g) => {
          if (g.s.flags.l1_crowbar) return g.say('只剩碎木頭與幾片生鏽鐵皮。');
          g.flag('l1_crowbar');
          g.give('crowbar', '你從壓碎的木板堆下抽出一根結實的波紋灰色「撬棍」，別在腰帶上。');
        },
      },
      {
        id: 'landmark', rect: bounds(aqCloth, 12), label: '羅經點亮色布與杏仁水', cursor: 'take',
        click: (g) => {
          if (!g.s.flags.l1_aq_almond) {
            g.flag('l1_aq_almond');
            g.give('almond');
            g.say('你拿起 80 年代標籤的杏仁水，並依指示把布料取下平放在地上。');
          }
          g.read('n_l1_compass');
        },
      },
      {
        id: 'puddle', rect: [P(-0.35, 1, 2.9)[0] - 95, P(-0.35, 1, 2.9)[1] - 14, 190, 28], label: '管道漏下的積水坑', cursor: 'look',
        click: (g) => {
          g.sanity(-5);
          g.say('空氣裡飄著一股塑膠般的死水氣味。水坑可能帶有「爬菌」，幸好你沒有喝下去。');
        },
      },
    ],
  },

  l1_alpha_gate: {
    level: 1, title: 'M.E.G. Alpha 外圍哨卡', room: rAlphaGate, safe: true,
    enter(g, { first }) {
      if (first) g.say('穿著淡黃色外套、別著雄鷹徽章的 M.E.G. 巡邏隊正護送剛從 Level 0 切出的人。路邊搭著一座「速切玩家」報名木亭與「琥珀營」舊址碑。');
    },
    draw(ctx, t, s, R) {
      drawBooth(ctx, R, agBooth, { awning: '#c9a227', label: 'SPEEDNOCLIP' });
      paper(ctx, R, agPlaque, 4.5, '#d8d2be');
      frameDoor(ctx, R, agBaseDoor, 7.4, '#4c5848', '#e0cc58', 'ALPHA 城鎮');
      frameDoor(ctx, R, agGothicDoor, 3.7, '#585660', '#9694a4', '哥特段 →');
    },
    hotspots: [
      BACK('l1_aquila', '退回天鷹段'),
      { ...FORWARD('l1_alpha_base', '進入 Alpha 基地'), rect: bounds(agBaseDoor, 14) },
      { id: 'gothic', rect: bounds(agGothicDoor, 8), label: '前往哥特段（Gothic）', cursor: 'go', click: (g) => g.go('l1_gothic') },
      { id: 'booth', rect: boxRect(agBooth, 8), label: '速切玩家報名木亭', cursor: 'look', click: (g) => g.read('n_l1_speednoclip') },
      { id: 'plaque', rect: bounds(agPlaque, 10), label: '琥珀營 1997–2013 紀念碑', cursor: 'look', click: (g) => g.read('n_l1_speednoclip') },
    ],
  },

  l1_alpha_base: {
    level: 1, title: 'M.E.G. Alpha 基地', room: rAlphaBase, safe: true,
    enter(g, { first }) {
      if (first) g.say('這裡與其說是營地，更像一座建在水泥小徑裡的城鎮：帳篷、訓練欄、標準時鐘與食堂燈光一應俱全。南側有道通往「Level 1.1」的封鎖閘門。');
    },
    draw(ctx, t, s, R) {
      drawTent(ctx, R, abTent, { warm: true });
      paper(ctx, R, abBoard, 8.4, '#e8e0c8');
      frameDoor(ctx, R, abSouthDoor, 8.4, '#4a2e2e', '#a84438', 'Lv.1.1 封鎖');
      frameDoor(ctx, R, abDinerDoor, 3.3, '#885838', '#f0b868', 'Tom 的餐館 →');
      frameDoor(ctx, R, abArgosDoor, 8.4, '#4c525a', '#96a0b0', '豐饒角');
    },
    hotspots: [
      BACK('l1_alpha_gate', '回到外圍哨卡'),
      { id: 'diner', rect: bounds(abDinerDoor, 8), label: 'Tom 的餐館', cursor: 'go', click: (g) => g.go('l1_toms_diner') },
      { id: 'argos', rect: bounds(abArgosDoor, 8), label: '豐饒角（阿爾戈斯之眼）', cursor: 'go', click: (g) => g.go('l1_cornucopia') },
      { id: 'tent', rect: boxRect(abTent, 8), label: 'Stephanie 的新兵補給帳篷', cursor: 'look', click: (g) => g.read('n_l1_stephanie') },
      { id: 'board', rect: bounds(abBoard, 10), label: '基地 MST 時鐘與布告欄', cursor: 'look', click: (g) => g.read('n_l1_stephanie') },
      { id: 'sublevels', rect: bounds(abSouthDoor, 10), label: '南側封鎖閘門（Level 1.1 等子層級）', cursor: 'look', click: (g) => g.read('n_l1_sublevels') },
    ],
  },

  l1_toms_diner: {
    level: 1, title: 'Tom 的餐館', room: rDiner, safe: true,
    enter(g, { first }) {
      if (first) g.say('烤漢堡肉餅與奶昔的香氣撲鼻而來！義大利裔主廚 Tommaso Esposito 正擦著吧台，旁邊是同事佐藤愛子與幾位聊著天的旅人。');
    },
    draw(ctx, t, s, R) {
      drawDinerBooth(ctx, R, dinerBooth);
      drawTable(ctx, R, dinerCounter, { drawers: true });
      for (const sx of [-0.25, 0.45, 1.15]) {
        const sp = P(sx, 0.95, 3.05);
        ctx.fillStyle = '#8c2c24'; ctx.beginPath(); ctx.ellipse(sp[0], sp[1] - 18, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
        seg(ctx, [sp[0], sp[1] - 16], [sp[0], sp[1]], '#9aa0a6', 3);
      }
      poly(ctx, dinerMenu, shade(R, '#28221e', 6.4));
      txt(ctx, 'TOM\'S DINER', P(0.45, -0.4, 6.4)[0], P(0.45, -0.4, 6.4)[1], '#ffd080', 14);
    },
    hotspots: [
      BACK('l1_alpha_base', '回到 Alpha 基地大廳'),
      {
        id: 'tom', rect: boxRect(dinerCounter, 8), label: '向 Tom 點餐（免費招待新人一份）', cursor: 'take',
        click: (g) => {
          if (g.s.flags.l1_tom_burger) return g.say('Tom 朝你眨了眨眼：「先把剛才那份起司漢堡吃掉吧，伙計。想換餐點可以去躍金段找點物資來交換！」');
          g.flag('l1_tom_burger');
          g.give('burger', 'Tom 笑著把托盤重重放上吧台：「起司漢堡還淌著肉汁呢，外加奶昔。別垂頭喪氣了，你活下來必有緣由！」');
        },
      },
      { id: 'menu', rect: bounds(dinerMenu, 10), label: '餐館菜單與留言板', cursor: 'look', click: (g) => g.read('n_l1_tom') },
      { id: 'booth', rect: boxRect(dinerBooth, 8), label: '紅色卡座與現場樂聲', cursor: 'look', click: (g) => g.say('卡座旁有人輕輕彈著吉他。這是整個宜居地帶最讓人忘了身處後室的地方。') },
    ],
  },

  l1_cornucopia: {
    level: 1, title: '豐饒角（阿爾戈斯之眼）', room: rArgos, safe: true,
    enter(g, { first }) {
      if (first) g.say('阿爾戈斯之眼「正義追尋者」的駐地，石牆冰冷而肅殺。幾名全副武裝的巡邏兵冷冷地打量著你。');
    },
    draw(ctx, t, s, R) {
      drawTable(ctx, R, argosDesk, { drawers: true, lamp: true });
      paper(ctx, R, argosNotice, 2.9, '#e0e4ec');
    },
    hotspots: [
      BACK('l1_alpha_base', '回到 Alpha 基地'),
      { id: 'notice', rect: bounds(argosNotice, 10), label: '豐饒角警戒通告', cursor: 'look', click: (g) => g.read('n_l1_argos') },
      { id: 'desk', rect: boxRect(argosDesk, 8), label: '正義追尋者執勤台', cursor: 'look', click: (g) => g.say('執勤官看了你一眼：「沒犯過罪就趕緊離開。有時人類比實體更危險，記住這點。」') },
    ],
  },

  // ---------------- SECTOR 2: GILD & TRADER'S KEEP / VAULT ----------------
  l1_gild: {
    level: 1, title: '躍金段・彩色倉庫區', room: rGild, flickerable: true, hall: true,
    enter(g, { first }) {
      if (first) g.say('牆面塗著斑斕的暖黃與赭紅漆色，燈光比其他區段明亮得多，到處堆滿層層疊疊的板條箱。');
    },
    draw(ctx, t, s, R) {
      drawWoodCrate(ctx, R, gildCrate1);
      drawWoodCrate(ctx, R, gildCrate2, { stencil: 'B.N.T.G.' });
      paper(ctx, R, gildGuide, 3.9, '#f2e8c8');
      frameDoor(ctx, R, gildKeepDoor, 9.4, '#6d5432', '#e8c458', '商人之家');
      frameDoor(ctx, R, gildFabledDoor, 4.8, '#7a2f28', '#ff70c8', '傳說段 →');
    },
    hotspots: [
      BACK('l1_aquila', '退回天鷹段'),
      { ...FORWARD('l1_traders_keep', '前往 B.N.T.G. 商人之家'), rect: bounds(gildKeepDoor, 14) },
      { id: 'fabled', rect: bounds(gildFabledDoor, 8), label: '前往傳說段（Fabled）', cursor: 'go', click: (g) => g.go('l1_fabled') },
      { id: 'guide', rect: bounds(gildGuide, 10), label: '《板條箱物品指南》', cursor: 'look', click: (g) => g.read('n_l1_crates_guide') },
      {
        id: 'crate1', rect: boxRect(gildCrate1, 8), label: '釘緊的板條箱', cursor: 'look',
        click: (g) => {
          if (g.s.flags.l1_gild_loot) return g.say('木箱已經撬開清空了。');
          g.say('木箱釘得很死，徒手拉不開。用天鷹段撿到的「撬棍」試試！');
        },
        use: {
          crowbar: (g) => {
            if (g.s.flags.l1_gild_loot) return g.say('裡面已經空了。');
            g.flag('l1_gild_loot');
            g.sfx('open');
            g.give('yarn');
            g.give('almond');
            g.say('你用撬棍撬開箱蓋，小心避開碎木屑後取出一顆藍色「紗線球」與一瓶杏仁水！');
          },
        },
      },
      { id: 'crate2', rect: boxRect(gildCrate2, 8), label: '堆放物資的板條箱', cursor: 'look', click: (g) => g.say('箱縫裡塞滿了舊毛衣、防寒襪與筆記本——果然和卡魯姆的指南說的一樣。') },
    ],
  },

  l1_traders_keep: {
    level: 1, title: 'B.N.T.G. 商人之家', room: rKeep, safe: true,
    enter(g, { first }) {
      if (first) g.say('2016 年創立的 B.N.T.G. 中立貿易聚居地。傭兵守在兩側，商人櫃檯寫著「不提供免費庇護，一切以物易物」。');
    },
    draw(ctx, t, s, R) {
      drawBooth(ctx, R, keepStall, { awning: '#7a5a2c', label: 'B.N.T.G.' });
      paper(ctx, R, keepSign, 4.2, '#f0e6c8');
      frameDoor(ctx, R, keepVaultDoor, 6.4, '#464d54', '#c9a227', '商人保險庫');
    },
    hotspots: [
      BACK('l1_gild', '回到躍金段'),
      { ...FORWARD('l1_traders_vault', '進入商人保險庫'), rect: bounds(keepVaultDoor, 12) },
      {
        id: 'barter', rect: boxRect(keepStall, 8), label: '以物易物貿易櫃檯（拿罐頭或電池交換）', cursor: 'look',
        click: (g) => g.say('商人敲了敲櫃檯：「1 個罐頭換 1 瓶杏仁水，1 顆電池換 1 排鎮定劑。把你要交易的東西點出來給我。」'),
        use: {
          can: (g) => { g.take('can'); g.give('almond', '商人收下罐頭，遞給你一瓶封口完好的杏仁水。'); },
          battery: (g) => { g.take('battery'); g.give('pills', '商人驗過電池電量後，交給你一片鎮定劑。'); },
        },
      },
      { id: 'sign', rect: bounds(keepSign, 10), label: '商人之家貿易公約', cursor: 'look', click: (g) => g.read('n_l1_traders') },
    ],
  },

  l1_traders_vault: {
    level: 1, title: '商人保險庫', room: rVault, safe: true,
    enter(g, { first }) {
      if (first) g.say('厚重的鋼鐵庫房裡堆滿供給辦公區 EL3A 與各前哨站的儲備箱。');
    },
    draw(ctx, t, s, R) {
      drawWoodCrate(ctx, R, vaultCrate, { stencil: 'VAULT' });
      paper(ctx, R, vaultLedger, 2.6, '#dce2e8');
    },
    hotspots: [
      BACK('l1_traders_keep', '回到商人之家'),
      {
        id: 'vault_crate', rect: boxRect(vaultCrate, 10), label: '打開檢視的標準補給箱', cursor: 'look',
        click: (g) => g.closeup('l1_crate_open_cu', { msg: '半邊裝著冒白霧的固態氮塊與碎玻璃，另一半放著安全密封物資。' }),
      },
      { id: 'ledger', rect: bounds(vaultLedger, 10), label: '保險庫物流與月球傳聞備忘', cursor: 'look', click: (g) => g.read('n_l1_vault') },
    ],
  },

  // ---------------- SECTOR 3: GOTHIC & HIPPOCRATES-1 ----------------
  l1_gothic: {
    level: 1, title: '哥特段・拱門圓柱長廊', room: rGothic, flickerable: true, hall: true,
    enter(g, { first }) {
      if (first) g.say('彎曲的混凝土拱門與巨型圓柱支撐著高聳穹頂。頭頂中央懸著一張發光的白色球狀蛛網——那是 Nguithr\'xurh 的巢穴！千萬別從正下方走過去。');
    },
    draw(ctx, t, s, R) {
      drawGothicArch(ctx, R, 2.1, 3.45, '#5e5d64');
      drawGothicArch(ctx, R, 2.1, 4.65, '#5e5d64');
      drawRoundColumn(ctx, R, -1.25, 3.2, 3.7, 0.25, '#64626c');
      drawRoundColumn(ctx, R, 1.25, 4.4, 4.9, 0.25, '#64626c');
      // Glowing spherical Nguithr'xurh web overhead
      const wc = P(0, -0.58, 3.8);
      glow(ctx, wc[0], wc[1], 56, 'rgba(210, 235, 255, 0.32)');
      ctx.strokeStyle = 'rgba(230,245,255,0.75)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(wc[0], wc[1], 24, 0, Math.PI * 2); ctx.stroke();
      frameDoor(ctx, R, gothDoor, 9.4, '#6b807a', '#b4d0c8', '希波克拉底-1');
      paper(ctx, R, gothNote, 2.7, '#e2e6ec');
    },
    hotspots: [
      BACK('l1_alpha_gate', '退回 Alpha 外圍哨卡'),
      { ...FORWARD('l1_hippocrates', '貼著牆緣繞行前往「希波克拉底-1」'), rect: bounds(gothDoor, 14) },
      {
        id: 'web', rect: [P(0, -0.58, 3.8)[0] - 45, P(0, -0.58, 3.8)[1] - 40, 90, 80], label: '頭頂發光的球狀蛛網', cursor: 'look',
        click: (g) => g.scare('l1_alpha_gate', '你抬頭踏進了那張發光球狀蛛網底下——一隻十六條腿的巨型昆蟲 Nguithr\'xurh 猛然撲了下來！你連滾帶爬逃回哨卡。', 15, 'claws'),
      },
      { id: 'note', rect: bounds(gothNote, 10), label: '哥特段建築與生物警告', cursor: 'look', click: (g) => g.read('n_l1_gothic') },
    ],
  },

  l1_hippocrates: {
    level: 1, title: '阿麗亞娜集團・希波克拉底-1', room: rHippocrates, safe: true,
    enter(g, { first }) {
      if (first) g.say('整潔明亮的醫療與生物研究基地。工作人員正用法語和失落一族的「蹄語」低聲討論，牆上掛著 C.L.I.P.P. 協議海報，桌上攤開厚厚的實體圖鑑。');
    },
    draw(ctx, t, s, R) {
      drawHospitalBed(ctx, R, hippoBed);
      drawTable(ctx, R, hippoTable, { lamp: true });
      paper(ctx, R, hippoClipp, 4.4, '#f0ecdc');
      paper(ctx, R, hippoManual, 2.7, '#e8e0c4');
    },
    hotspots: [
      BACK('l1_gothic', '回到哥特段'),
      {
        id: 'medic', rect: boxRect(hippoBed, 8), label: '免費醫療床位（治療與包紮）', cursor: 'look',
        click: (g) => {
          if (g.s.flags.l1_hippo_healed) return g.say('醫師微笑著點頭：「我們已經幫你處理過傷口並換好乾淨衣物了，隨時可以回來休息。」');
          g.flag('l1_hippo_healed');
          g.sanity(25);
          g.drink(20);
          g.sfx('drink');
          g.say('希波克拉底-1 的醫護人員為你清洗傷口、包紮並提供乾淨飲水。身心恢復了不少！');
        },
      },
      { id: 'clipp', rect: bounds(hippoClipp, 10), label: 'C.L.I.P.P. 協議海報', cursor: 'look', click: (g) => g.closeup('l1_clipp_poster') },
      { id: 'manual', rect: bounds(hippoManual, 12), label: '《宜居地帶常見實體圖鑑》', cursor: 'look', click: (g) => g.closeup('l1_entity_manual') },
    ],
  },

  // ---------------- SECTOR 4: FABLED ----------------
  l1_fabled: {
    level: 1, title: '傳說段・朱漆與霓虹交界', room: rFabled, flickerable: true, hall: true,
    enter(g, { first }) {
      if (first) g.say('三百年前殘留的朱漆木柱與現代絢麗霓虹燈管扭曲地交疊在同一條走廊裡，彩色電纜沿著雕花樑柱垂掛而下。');
    },
    draw(ctx, t, s, R) {
      drawRoundColumn(ctx, R, -1.45, 3.0, 3.4, 0.2, '#922a22', { lacquer: true });
      drawRoundColumn(ctx, R, 1.45, 4.2, 4.6, 0.2, '#922a22', { lacquer: true });
      const l1 = P(-1.15, -0.5, 3.2);
      glow(ctx, l1[0], l1[1], 36, 'rgba(255,140,80,0.45)');
      ctx.fillStyle = '#c83424'; ctx.beginPath(); ctx.ellipse(l1[0], l1[1], 11, 14, 0, 0, Math.PI * 2); ctx.fill();
      seg(ctx, P(-1.9, -0.5, 1.5), P(1.9, -0.45, 7.5), '#50e8ff', 2.5);
      seg(ctx, P(1.9, -0.6, 1.8), P(-1.9, -0.4, 6.8), '#ff60c8', 2.5);
      paper(ctx, R, fabPlaque, 2.75, '#efe4cc');
      frameDoor(ctx, R, fabExitDoor, 8.9, '#3e4450', '#60d8ff', '異層閾界 →');
    },
    hotspots: [
      BACK('l1_gild', '回到躍金段'),
      { ...FORWARD('l1_threshold_gallery', '前往異層閾界走廊'), rect: bounds(fabExitDoor, 14) },
      { id: 'plaque', rect: bounds(fabPlaque, 10), label: '館長 Leo Castellos 的銘牌', cursor: 'look', click: (g) => g.read('n_l1_fabled') },
    ],
  },

  // ---------------- SECTOR 5: THE PATHS ----------------
  l1_paths_hub: {
    level: 1, title: '小徑迷宮・阿里阿德涅營地', room: rPathsHub, safe: true,
    enter(g, { first }) {
      if (first) g.say('雙推門後是一張如洞穴般曲折的狹窄混凝土走廊網。游牧部落「阿里阿德涅之線」在角落留下一個紮營點，沒有非歐幾何扭曲，這裡可以安心點亮手電筒。');
    },
    draw(ctx, t, s, R) {
      drawBlanket(ctx, R, phCamp);
      drawKettle(ctx, R, { x1: 0.45, x2: 0.72, y1: 0.52, y2: 1, z1: 2.2, z2: 2.5 });
      paper(ctx, R, phNote, 2.35, '#ebe2c4');
      frameDoor(ctx, R, phRubberDoor, 2.9, '#88847a', '#363430', '← 橡膠房');
      frameDoor(ctx, R, phPaintDoor, 4.0, '#7c7870', '#363430', '畫作房 →');
      frameDoor(ctx, R, phMattressDoor, 8.4, '#5a5c58', '#252624', '床墊避難室');
      if (s.flags.l1_yarn_marked) seg(ctx, P(0, 0.99, 1.2), P(0, 0.99, 8.2), '#4e7aa8', 3);
    },
    hotspots: [
      BACK('l1_aquila', '退回天鷹段過道'),
      { ...FORWARD('l1_mattress_room', '深入床墊避難室'), rect: bounds(phMattressDoor, 14) },
      { id: 'rubber', rect: bounds(phRubberDoor, 8), label: '進入「橡膠房間」', cursor: 'go', click: (g) => g.go('l1_rubber_room') },
      { id: 'paintings', rect: bounds(phPaintDoor, 8), label: '進入「畫作房間」', cursor: 'go', click: (g) => g.go('l1_painting_room') },
      {
        id: 'camp', rect: boxRect(phCamp, 8), label: '「阿里阿德涅之線」營地指南', cursor: 'look',
        click: (g) => g.read('n_l1_paths_camp'),
        use: {
          yarn: (g) => {
            if (g.s.flags.l1_yarn_marked) return g.say('你已經用藍色紗線標記好原路返回的路徑了。');
            g.flag('l1_yarn_marked');
            g.take('yarn');
            g.sanity(6);
            g.say('你把藍色紗線繫在門框上沿著小徑拉開——有了「阿里阿德涅之線」，就不怕在迷宮深處迷路了。');
          },
        },
      },
      { id: 'note', rect: bounds(phNote, 12), label: '紮營筆記', cursor: 'look', click: (g) => g.read('n_l1_paths_camp') },
    ],
  },

  l1_rubber_room: {
    level: 1, title: '小徑・橡膠房間', room: rRubber, safe: true,
    enter(g, { first }) {
      if (first) g.say('四面牆與地板都鋪著厚實的米色橡膠，房間正中央詭異地嵌著一把沒入地板裡的木椅。左邊桌上有台老舊的回溯電腦。');
    },
    draw(ctx, t, s, R) {
      const rp = P(0, 1, 3.35);
      ctx.fillStyle = 'rgba(20,18,14,0.38)';
      ctx.beginPath(); ctx.ellipse(rp[0], rp[1], 56, 13, 0, 0, Math.PI * 2); ctx.fill();
      for (const sx of [-0.22, -0.07, 0.08, 0.22]) {
        seg(ctx, P(sx, 0.22, 3.6), P(sx, 0.78, 3.6), shade(R, '#583c24', 3.6), 4);
      }
      seg(ctx, P(-0.32, 0.22, 3.6), P(0.32, 0.22, 3.6), shade(R, '#6b4c30', 3.6), 6);
      poly(ctx, [P(-0.34, 0.78, 3.12), P(0.34, 0.78, 3.12), P(0.34, 0.78, 3.64), P(-0.34, 0.78, 3.64)], shade(R, '#7a5838', 3.3));
      seg(ctx, P(-0.28, 0.78, 3.14), P(-0.28, 1.0, 3.14), shade(R, '#4a321c', 3.14), 5);
      seg(ctx, P(0.28, 0.78, 3.14), P(0.28, 1.0, 3.14), shade(R, '#4a321c', 3.14), 5);
      drawTable(ctx, R, rubDesk, { drawers: true });
      const pc = P(-1.15, 0.22, 2.65);
      ctx.fillStyle = '#363b3e'; ctx.fillRect(pc[0] - 18, pc[1] - 24, 36, 24);
      ctx.fillStyle = '#488868'; ctx.fillRect(pc[0] - 14, pc[1] - 20, 28, 16);
      paper(ctx, R, rubNote, 2.3, '#ece3c6');
      poly(ctx, rubLock, shade(R, '#b49238', 2.2));
    },
    hotspots: [
      BACK('l1_paths_hub', '回到小徑營地'),
      { id: 'chair', rect: boxRect(rubChairSeat, 10), label: '嵌進橡膠地板裡的椅子', cursor: 'look', click: (g) => g.say('椅腳下半截完全融合在橡膠地板裡，像是這房間本來就這樣長出來的。至少地面軟得適合過夜。') },
      { id: 'desk', rect: boxRect(rubDesk, 8), label: '老舊電腦與測繪清單', cursor: 'look', click: (g) => g.read('n_l1_paths_rooms') },
      { id: 'lock', rect: bounds(rubLock, 14), label: '門上自然存在的黃銅鎖', cursor: 'look', click: (g) => g.say('你想起游牧部落的警告：絕不能把自然存在的鎖扣上，否則鎖會在你眼前消失，把人永遠困死在房間裡！') },
    ],
  },

  l1_painting_room: {
    level: 1, title: '小徑・畫作房間', room: rPaintRoom, safe: true,
    viewMsg: '觀景窗裡，地上那幅畫的風景正自己緩緩轉動，畫裡山頭上的枯樹在風中搖晃。',
    enter(g, { first }) {
      if (first) g.say('寬敞的房間裡，不只牆上掛滿畫框，連地板上也鋪著油畫。門邊一張字條寫著：「這裡太小了，不適合當定居點。試試別的門吧！」');
    },
    draw(ctx, t, s, R) {
      drawPainting(ctx, R, prWall1, 2.7, '#705848', '#2c221c');
      drawPainting(ctx, R, prWall2, 6.4, '#18243a', '#4c5868');
      drawPainting(ctx, R, prFloor, 3.0, '#6a7c8c', '#485232');
      paper(ctx, R, prNote, 2.7, '#efe6ca');
    },
    hotspots: [
      BACK('l1_paths_hub', '回到小徑營地'),
      { id: 'paint_floor', rect: bounds(prFloor, 10), label: '平放在地板上的島嶼畫作', cursor: 'look', click: (g) => g.say('畫裡描繪著山頂有棵枯樹的岩石島嶼——聽說躍入特定的島嶼畫會切進 Level 739「欲望之沙」，還是保持距離比較好。') },
      { id: 'paint_wall', rect: bounds(prWall2, 10), label: '正前方的月球畫作', cursor: 'look', click: (g) => g.read('n_l1_paintings') },
      { id: 'note', rect: bounds(prNote, 12), label: '畫作備忘紙條', cursor: 'look', click: (g) => g.read('n_l1_paintings') },
    ],
  },

  l1_mattress_room: {
    level: 1, title: '小徑・床墊避難室', room: rMattress, safe: true,
    enter(g, { first }) {
      if (first) g.say('幾張髒舊的床墊靠著門邊堆成臨時遮光牆。通往更深處的灰漆鐵門上，赫然刻著四道一組的深長爪痕，透明黏液正往下流。');
    },
    draw(ctx, t, s, R) {
      drawMattressPile(ctx, R, matPile);
      frameDoor(ctx, R, matForward, 4.48, '#5a5e60', '#2c2e30', '貨架通道');
      // 4 deep claw marks on the metal door
      for (let i = 0; i < 4; i++) {
        seg(ctx, P(0.42 + i * 0.1, -0.25, 4.47), P(0.46 + i * 0.1, 0.38, 4.47), '#16181a', 2.5);
      }
      paper(ctx, R, matNote, 2.35, '#ece4c8');
    },
    hotspots: [
      BACK('l1_paths_hub', '回到小徑營地'),
      { ...FORWARD('l1_paths_stash', '推開有爪痕的門'), rect: bounds(matForward, 12) },
      {
        id: 'mattress', rect: boxRect(matPile, 8), label: '堵門遮光的髒舊床墊（歇息）', cursor: 'look',
        click: (g) => {
          if (g.s.flags.l1_mat_slept) return g.say('你已經在這睡過一覺了，不敢再在夢裡回到那片紅房間走廊。');
          g.flag('l1_mat_slept');
          g.sanity(18);
          g.say('你拉過床墊躺下短暫歇息。夢裡似乎又回到血紅燈光與濕地毯的走廊……你滿身冷汗驚醒，但精神明顯恢復了不少。');
        },
      },
      { id: 'note', rect: bounds(matNote, 10), label: '爪痕與「閃爍」遭遇紀錄', cursor: 'look', click: (g) => g.read('n_l1_mattress') },
    ],
  },

  l1_paths_stash: {
    level: 1, title: '小徑・金屬貨架儲藏室', room: rStash, safe: true,
    enter(g, { first }) {
      if (first) g.say('門後是一條像零售店後間般的貨架長廊，木架上塞滿木箱，陰影最深處的箱子側面印著褪色的「口糧」二字。');
    },
    draw(ctx, t, s, R) {
      drawShelfRack(ctx, R, stShelfL, { tiers: 3 });
      drawWoodCrate(ctx, R, stToyCrate);
      drawWoodCrate(ctx, R, stRationCrate, { stencil: '口糧' });
      paper(ctx, R, stNote, 2.3, '#eae2c4');
      frameDoor(ctx, R, stForward, 7.4, '#4c5054', '#222426', '迴聲長廊');
    },
    hotspots: [
      BACK('l1_mattress_room', '退回床墊避難室'),
      { ...FORWARD('l1_skinstealer_hall', '走進迴聲長廊'), rect: bounds(stForward, 14) },
      {
        id: 'toy_crate', rect: boxRect(stToyCrate, 8), label: '翻過的板條箱（機器人／玻璃）', cursor: 'look',
        click: (g) => g.say('裡面全是生鏽、邊緣鋒利的金屬發條機器人玩具，還有幾片碎玻璃。別隨便伸手！'),
      },
      {
        id: 'ration_crate', rect: boxRect(stRationCrate, 10), label: '陰影深處的「口糧」木箱', cursor: 'take',
        click: (g) => {
          if (g.s.flags.l1_ration_taken) return g.say('印著「口糧」的木箱裡只剩幾個空木屑墊。');
          g.say('木箱被鐵釘封死在貨架底層，用「撬棍」才能撬開！');
        },
        use: {
          crowbar: (g) => {
            if (g.s.flags.l1_ration_taken) return g.say('口糧箱已經空了。');
            g.flag('l1_ration_taken');
            g.sfx('open');
            g.give('l1_ration');
            g.say('你用撬棍掰開彎曲的鐵釘——裡面躺著四個銀灰色的金屬水壺！你拿起最可靠的那一壺「銀灰口糧水壺」收進背包。');
          },
        },
      },
      { id: 'note', rect: bounds(stNote, 10), label: '貨架開箱紀錄', cursor: 'look', click: (g) => g.read('n_l1_stash') },
    ],
  },

  l1_skinstealer_hall: {
    level: 1, title: '迴聲長廊', room: rSkinHall, flickerable: true, hall: true,
    viewMsg: '觀景窗裡，那個哭泣的女人皮膚像鬆掉的布袋般垂在臉側，腳邊淌著血泊與另一張不見皮囊的屍殼！',
    enter(g, { first }) {
      if (first) g.say('走廊前方傳來清晰的女聲在哭泣：「有人嗎……救命……」。燈光忽明忽暗，地上有一道暗紅血跡。');
    },
    draw(ctx, t, s, R) {
      if (!s.flags.l1_skin_spotted) {
        const pf = P(0.45, 1, 5.2), pt = P(0.45, -0.7, 5.2);
        drawFigure(ctx, pf[0], pf[1], pf[1] - pt[1], 0.85);
        ctx.fillStyle = 'rgba(130, 22, 18, 0.36)';
        ctx.beginPath(); ctx.ellipse(pf[0] + 10, pf[1] + 2, 34, 8, 0, 0, Math.PI * 2); ctx.fill();
      }
      frameDoor(ctx, R, skinForward, 9.4, '#444a50', '#60d8ff', '閾界走廊');
      paper(ctx, R, skinNote, 2.5, '#ede4c8');
    },
    hotspots: [
      BACK('l1_paths_stash', '退回儲藏室'),
      {
        ...FORWARD('l1_threshold_gallery', '繞過前方異狀前往閾界走廊'),
        rect: bounds(skinForward, 14),
        click: (g) => {
          if (!g.s.flags.l1_skin_spotted) {
            return g.scare('l1_paths_stash', '你低頭直衝過去，那個女人猛地抬頭：「啊哈，全鬆垮了！」鬆弛人皮從牠發黃的軀殼滑落——你拚命掙脫逃回儲藏室！', 18, 'figure');
          }
          g.go('l1_threshold_gallery');
        },
      },
      {
        id: 'observe', when: (s) => !s.flags.l1_skin_spotted, rect: [490, 175, 110, 140], label: '從遠處喊話試探那個身影', cursor: 'look',
        click: (g) => {
          g.flag('l1_skin_spotted');
          g.sanity(4);
          g.say('你停在安全距離外試探：「你還好嗎？」對方機械地重複：「啊哈……全鬆垮了……」並扯緊鬆弛的臉皮。確定是「竊皮者」！你冷靜地貼著另一側牆緣繞開了牠。');
        },
      },
      { id: 'note', rect: bounds(skinNote, 10), label: 'M.E.G. 竊皮者應對報告', cursor: 'look', click: (g) => g.read('n_l1_skinstealer') },
    ],
  },

  l1_threshold_gallery: {
    level: 1, title: '異層閾界走廊', room: rThresh, flickerable: true, hall: true,
    enter(g, { first }) {
      if (first) g.say('這裡聚集著通往後室數十個其他層級的門、通風管、壁面缺口與標有「Mach+」的舊電視機。據說依特定順序穿過門就能抵達「樞紐（The Hub）」。');
    },
    draw(ctx, t, s, R) {
      frameDoor(ctx, R, thDoorL, 3.3, '#586470', '#88a4c0', '左門');
      frameDoor(ctx, R, thDoorR, 3.3, '#586470', '#88a4c0', '右門');
      frameDoor(ctx, R, thDoorF, 9.4, '#3c4a56', '#74c8ff', '前門 / 樞紐序');
      poly(ctx, thPortals, shade(R, '#2c3238', 6.0));
      paper(ctx, R, thNote, 5.5, '#eae2c8');
    },
    hotspots: [
      BACK('l1_fabled', '退回傳說段'),
      { id: 'to_paths', rect: [60, 465, 220, 65], label: '回到迴聲長廊（小徑）', cursor: 'go', click: (g) => g.go('l1_skinstealer_hall') },
      {
        id: 'door_l', rect: bounds(thDoorL, 8), label: '左側門（樞紐順序測試）', cursor: 'go',
        click: (g) => { g.flag('l1_hub_seq', 1); g.say('你先推開左側門探頭——門外還是同一條對稱走廊（順序：1 / 3）。'); },
      },
      {
        id: 'door_r', rect: bounds(thDoorR, 8), label: '右側門（樞紐順序測試）', cursor: 'go',
        click: (g) => {
          if (g.s.flags.l1_hub_seq === 1) { g.flag('l1_hub_seq', 2); return g.say('接著推開右側門——走廊盡頭的氣壓忽然變輕了（順序：2 / 3）。'); }
          g.flag('l1_hub_seq', 0);
          g.say('順序不對，門後只是一堵冷冰冰的水泥牆。');
        },
      },
      {
        id: 'door_f', rect: bounds(thDoorF, 12), label: '正前方門（完成樞紐門序）', cursor: 'go',
        click: (g) => {
          if (g.s.flags.l1_hub_seq === 2) {
            g.flag('l1_hub_seq', 0);
            g.sanity(8);
            return g.say('你依「左 → 右 → 前」跨過最後一道門，一瞬間看見一條貫穿無數木門的無盡公路（The Hub）！但在完全切離之前，你先退回了這一側記下路線。');
          }
          g.flag('l1_hub_seq', 0);
          g.say('沒按特定順序推開時，這扇門通往無盡的重複灰牆。請先閱讀出入口總覽。');
        },
      },
      { id: 'portals', rect: bounds(thPortals, 8), label: '近距離檢視各異層出口門群', cursor: 'look', click: (g) => g.closeup('l1_hub_doors') },
      { id: 'note', rect: bounds(thNote, 10), label: '《宜居地帶出入口總覽》', cursor: 'look', click: (g) => g.read('n_l1_exits') },
    ],
  },
};
