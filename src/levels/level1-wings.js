// Expanded sectors of Level 1 "The Habitable Zone":
//   Wing A — Loading Dock, Unmarked Trailer, Sorting Bay, B.N.T.G. Depot, Cold Storage & Walk-in Freezer (6 rooms)
//   Wing B — Drainage Culvert, Underground Cistern, Pump Room, Substation, Freight Lift & Upper Ramp (6 rooms)
//   Wing C — Scorched North Hall, Quarantine Checkpoint, Outpost Canteen, Dorms, Bunk B-02 & Washroom (6 rooms)
//   Wing D — Conservatory, Root Vault, Works Scaffold, Unfinished Model Hall, Control Corridor, Laundry & Archive (7 rooms)
import { CX, P, bottle, bounds, boxRect, faceQuad, paper, poly, seg, shade, wallQuad } from '../render.js';
import { BACK, FORWARD, PAL, flickery } from './common.js';
import { drawExitSign, drawPipes, gauge } from './level2.js';
import {
  drawBunkBed, drawConveyor, drawHospitalBed, drawMetalCabinet, drawMetalLocker,
  drawPadlockChest, drawPumpUnit, drawSedan, drawShelfRack, drawSinkBasins,
  drawTable, drawWasher, drawWireCart, drawWoodCrate,
} from './level1-props.js';
import { drawBarrel, drawBucket, drawRolls, glow, once, txt } from './sublevel-kit.js';

const base1 = { floorTex: 'concrete', wallTex: 'concrete', baseboard: false, flick: flickery };

const PAL1_EXT = {
  dock: { wall: '#585a56', ceil: '#2b2d2b', floor: '#3b3c39', fog: '#0b0c0d', light: '#dce4ef' },
  cold: { wall: '#6e7e86', ceil: '#435159', floor: '#4f5e66', fog: '#0d181e', light: '#d8f4ff' },
  drain: { wall: '#464d47', ceil: '#232824', floor: '#2a332e', fog: '#070a09', light: '#c4dcc8' },
  power: { wall: '#4e5256', ceil: '#26292c', floor: '#383b3e', fog: '#080a0c', light: '#ffd488' },
  burned: { wall: '#2f2c2a', ceil: '#161413', floor: '#22201e', fog: '#060505', light: '#d8cfc0' },
  dorm: { wall: '#6e6a60', ceil: '#3c3a34', floor: '#48453e', fog: '#0e0d0b', light: '#ece5d0' },
  green: { wall: '#42513c', ceil: '#242e20', floor: '#2e3828', fog: '#050804', light: '#d8f2c2' },
  ctrl: { wall: '#787d80', ceil: '#4c5052', floor: '#585c5e', fog: '#0d0f10', light: '#e8f4f8' },
  archive: { wall: '#4b4e48', ceil: '#262824', floor: '#343632', fog: '#070807', light: '#ffda98' },
};

// ---------- Shared procedural helpers ----------
function drawDoorFrame(ctx, R, q, z, fill = '#6d7276', trim = '#2b2e30', stripe = null) {
  poly(ctx, q, shade(R, fill, z));
  ctx.strokeStyle = shade(R, trim, z);
  ctx.lineWidth = 2;
  poly(ctx, q);
  ctx.stroke();
  if (stripe) {
    const [a, b] = q;
    seg(ctx, a, b, shade(R, stripe, z), 3);
  }
}

function drawShutter(ctx, R, q, z, openRatio = 0.55) {
  poly(ctx, q, '#0b0d0e');
  const [tl, tr, br, bl] = q;
  const cut = (p1, p2, k) => [p1[0] + (p2[0] - p1[0]) * k, p1[1] + (p2[1] - p1[1]) * k];
  const lBot = cut(tl, bl, openRatio);
  const rBot = cut(tr, br, openRatio);
  poly(ctx, [tl, tr, rBot, lBot], shade(R, '#6e7378', z));
  for (let i = 1; i <= 5; i++) {
    const k = (openRatio * i) / 6;
    seg(ctx, cut(tl, bl, k), cut(tr, br, k), shade(R, '#35393d', z), 1.5);
  }
  ctx.strokeStyle = shade(R, '#b8962a', z);
  ctx.lineWidth = 2;
  poly(ctx, q);
  ctx.stroke();
}

function drawReaderLed(ctx, p, powered, unlocked) {
  ctx.fillStyle = '#1b1e20';
  ctx.fillRect(p[0] - 5, p[1] - 8, 10, 16);
  ctx.fillStyle = !powered ? '#2b2b2b' : unlocked ? '#3ee070' : '#e04030';
  ctx.beginPath();
  ctx.arc(p[0], p[1] - 2, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawMagDoor(ctx, R, q, z, powered, unlocked, label = null) {
  drawDoorFrame(ctx, R, q, z, unlocked ? '#101414' : '#586064', '#222628', unlocked ? '#3ee070' : null);
  if (!unlocked) {
    const [tl, tr, br, bl] = q;
    seg(ctx, [(tl[0] + tr[0]) / 2, (tl[1] + tr[1]) / 2], [(bl[0] + br[0]) / 2, (bl[1] + br[1]) / 2], shade(R, '#1f2326', z), 2);
  }
  const [x, y, w, h] = bounds(q);
  drawReaderLed(ctx, [x + w + 10, y + h * 0.48], powered, unlocked);
  if (label) txt(ctx, label, x + w / 2, y + 16, shade(R, '#d8e0d8', z), 9);
}

function drawWaterStrip(ctx, R, x1, x2, z1, z2, t, color = '#1c2a2a') {
  const pts = [P(x1, 0.99, z1), P(x2, 0.99, z1), P(x2, 0.99, z2), P(x1, 0.99, z2)];
  poly(ctx, pts, shade(R, color, (z1 + z2) / 2, 1, 0.88));
  for (let z = z1 + 0.5; z < z2; z += 0.9) {
    const w = 0.25 + Math.sin(t * 2 + z) * 0.08;
    seg(ctx, P(-w, 0.985, z), P(w, 0.985, z), 'rgba(180,210,205,0.22)', 1.5);
  }
}

function drawVines(ctx, R, list, color = '#436835') {
  ctx.save();
  ctx.lineCap = 'round';
  for (const v of list) {
    const a = P(v.s * R.hw, v.y, v.z);
    const b = P(v.s * R.hw * 0.55, -1, v.z + 0.7);
    const c = P(v.s * 0.15, -0.95, v.z + 1.4);
    ctx.strokeStyle = shade(R, color, v.z, 1, 0.9);
    ctx.lineWidth = Math.max(1.5, 5.5 / v.z);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.quadraticCurveTo(b[0], b[1], c[0], c[1]);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- Room geometries ----------
// Wing A
const rDock = { ...base1, hw: 2.6, depth: 10, fogEnd: 8, pal: PAL1_EXT.dock, lights: [2.2, 5.0, 7.6], flickerLights: [1] };
const dockShutter1 = wallQuad(-2.6, -0.55, 1, 2.2, 3.3);
const dockShutter2 = wallQuad(-2.6, -0.55, 1, 4.6, 5.8);
const dockPallet = { x1: 0.7, x2: 1.75, y1: 0.55, y2: 1, z1: 2.5, z2: 3.4, color: '#846842', edge: true };
const dockClip = faceQuad(0.85, 0.45, 1.3, 0.55, 2.499);
const dockSorting = faceQuad(-0.45, -0.6, 0.45, 1, 9.99);
const dockCold = wallQuad(2.6, -0.55, 1, 3.6, 4.8);

const rTruck = { hw: 1.15, depth: 7, fogEnd: 6.5, pal: PAL1_EXT.cold, floorTex: 'concrete', baseboard: false, lights: [] };
const truckCrate = { x1: 0.25, x2: 0.95, y1: 0.35, y2: 1, z1: 2.6, z2: 3.4, color: '#7a5f3e', edge: true };
const truckCrate2 = { x1: -0.95, x2: -0.35, y1: 0.2, y2: 1, z1: 4.0, z2: 4.9, color: '#6b5336', edge: true };

const rSorting = { ...base1, hw: 2.3, depth: 9.5, fogEnd: 8, pal: PAL1_EXT.dock, lights: [2.0, 4.8, 7.2], flickerLights: [0] };
const sortBelt = { x1: -1.4, x2: -0.5, y1: 0.45, y2: 1, z1: 2.2, z2: 6.8, color: '#3b4248', top: '#25292d', edge: true };
const sortNote = faceQuad(0.95, 0.45, 1.35, 0.72, 3.499);
const sortBox = { x1: 0.85, x2: 1.55, y1: 0.4, y2: 1, z1: 3.5, z2: 4.2, color: '#8a6d48', edge: true };
const sortDepotDoor = faceQuad(-0.4, -0.6, 0.4, 1, 9.49);
const sortLiftDoor = wallQuad(2.3, -0.6, 1, 3.0, 4.2);

const rDepot = { ...base1, wallTex: undefined, hw: 2.0, depth: 5.5, fogEnd: 11, pal: PAL.office, tiles: true, lights: [2.2, 4.0] };
const depotCounter = { x1: -1.8, x2: 0.2, y1: 0.25, y2: 1, z1: 2.6, z2: 3.3, color: '#5c4b37', edge: true };
const depotFuseBox = { x1: -1.45, x2: -0.85, y1: 0.55, y2: 1, z1: 2.0, z2: 2.5, color: '#8a3228', edge: true };
const depotShelf = { x1: 1.1, x2: 1.85, y1: -0.2, y2: 1, z1: 2.4, z2: 3.6, color: '#5a5e62', edge: true };
const depotLedger = faceQuad(-0.6, 0.14, -0.15, 0.25, 2.599);
const depotDormDoor = faceQuad(0.22, -0.6, 0.95, 1, 5.49);

const rColdCorr = { ...base1, hw: 1.3, depth: 8.5, fogEnd: 7.5, pal: PAL1_EXT.cold, lights: [2.0, 5.0], flickerLights: [1] };
const coldFreezerDoor = faceQuad(-0.42, -0.6, 0.42, 1, 8.49);
const coldDrainDoor = wallQuad(1.3, -0.55, 1, 3.6, 4.7);
const coldThermo = wallQuad(-1.3, -0.35, 0.05, 2.2, 2.6);

const rFreezer = { ...base1, wallTex: undefined, hw: 1.9, depth: 6.5, fogEnd: 7.5, pal: PAL1_EXT.cold, lights: [2.4, 4.6] };
const freezerPorthole = faceQuad(-0.45, -0.55, 0.35, 0.25, 6.49);
const freezerRack = { x1: -1.75, x2: -0.95, y1: -0.25, y2: 1, z1: 2.5, z2: 4.5, color: '#8a9ba4', edge: true };
const freezerNote = wallQuad(1.9, -0.2, 0.18, 2.2, 2.7);

// Wing B
const rDrainage = { ...base1, hw: 1.4, depth: 9, fogEnd: 7.5, pal: PAL1_EXT.drain, lights: [2.0, 5.2], flickerLights: [1] };
const drainCisternDoor = faceQuad(-0.4, -0.58, 0.4, 1, 8.99);
const drainSubDoor = wallQuad(1.4, -0.6, 1, 3.2, 4.2);

const rCistern = { ...base1, hw: 2.8, depth: 11, fogEnd: 6.8, pal: PAL1_EXT.drain, lights: [2.2, 5.6], flickerLights: [0] };
const cisternCan = { x1: -1.15, x2: -0.75, y1: 0.72, y2: 1, z1: 2.6, z2: 3.0, color: '#b8882a', edge: true };
const cisternPumpDoor = faceQuad(-0.42, -0.55, 0.42, 1, 10.99);

const rPump = { ...base1, wallTex: undefined, hw: 1.8, depth: 5.5, fogEnd: 11, pal: PAL1_EXT.drain, tiles: true, lights: [2.0, 4.0] };
const pumpBody = { x1: -1.5, x2: -0.55, y1: 0.15, y2: 1, z1: 2.6, z2: 3.8, color: '#3b5246', edge: true };
const pumpStairs = wallQuad(1.8, -0.65, 1, 3.0, 4.1);
const pumpLog = faceQuad(0.45, 0.25, 0.85, 0.4, 2.899);
const pumpTable = { x1: 0.35, x2: 1.05, y1: 0.4, y2: 1, z1: 2.9, z2: 3.5, color: '#4d463c', edge: true };

const rSubstation = { ...base1, hw: 2.1, depth: 6.5, fogEnd: 9.5, pal: PAL1_EXT.power, lights: [2.2, 4.4], flickerLights: [0] };
const subPanel = faceQuad(-0.75, -0.55, 0.35, 0.45, 6.49);
const subLiftDoor = wallQuad(-2.1, -0.6, 1, 2.5, 3.5);
const subCtrlDoor = wallQuad(2.1, -0.6, 1, 3.6, 4.7);
const subNote = wallQuad(-2.1, -0.25, 0.15, 4.1, 4.6);

const rFreightLift = { ...base1, hw: 2.2, depth: 7.5, fogEnd: 8.5, pal: PAL1_EXT.dock, lights: [2.0, 4.8], flickerLights: [1] };
const liftShaftA = faceQuad(-1.45, -0.65, -0.35, 1, 7.49);
const liftShaftB = faceQuad(0.35, -0.65, 1.45, 1, 7.49);
const liftSubDoor = wallQuad(-2.2, -0.6, 1, 2.4, 3.4);
const liftUpperDoor = wallQuad(2.2, -0.6, 1, 3.2, 4.3);
const liftNote = faceQuad(-0.2, -0.3, 0.2, 0.15, 7.48);

const rGarageUpper = { ...base1, hw: 2.8, depth: 10, fogEnd: 7, pal: PAL1_EXT.dock, lights: [2.4, 5.6], flickerLights: [1] };
const upperSedan = { x1: -2.0, x2: -0.7, y1: 0.15, y2: 1, z1: 3.0, z2: 4.9, color: '#4c5258', edge: true };
const upperRampDown = faceQuad(-0.55, -0.3, 0.55, 1, 9.99);

// Wing C
const rBurned = { ...base1, hw: 1.35, depth: 9, fogEnd: 6.8, pal: PAL1_EXT.burned, lights: [2.2, 5.6], flickerLights: [0, 1] };
const burnedCheckDoor = faceQuad(-0.4, -0.58, 0.4, 1, 8.99);
const burnedCanteenDoor = wallQuad(1.35, -0.6, 1, 3.0, 4.0);
const burnedNote = wallQuad(-1.35, -0.25, 0.15, 2.3, 2.8);
const burnedTin = { x1: -0.95, x2: -0.55, y1: 0.78, y2: 1, z1: 3.4, z2: 3.8, color: '#3c3834', edge: true };

const rCheckpoint = { ...base1, wallTex: undefined, hw: 1.9, depth: 6, fogEnd: 11, pal: PAL1_EXT.ctrl, tiles: true, lights: [2.0, 4.2] };
const cpDesk = { x1: -1.65, x2: -0.55, y1: 0.35, y2: 1, z1: 2.4, z2: 3.2, color: '#565a5e', edge: true };
const cpBoard = wallQuad(-1.9, -0.65, 0.05, 3.6, 5.0);
const cpDormDoor = wallQuad(1.9, -0.6, 1, 2.6, 3.6);
const cpArchiveDoor = faceQuad(-0.42, -0.65, 0.42, 1, 5.99);
const cpUvBtn = faceQuad(-0.95, 0.08, -0.7, 0.22, 2.399);

const rCanteen = { ...base1, wallTex: undefined, hw: 2.2, depth: 6.5, fogEnd: 11, pal: PAL1_EXT.dorm, tiles: true, lights: [2.2, 4.5] };
const canteenTable = { x1: -1.6, x2: -0.6, y1: 0.4, y2: 1, z1: 2.4, z2: 4.0, color: '#787266', edge: true };
const canteenCounter = { x1: 0.4, x2: 1.9, y1: 0.1, y2: 1, z1: 3.4, z2: 4.4, color: '#6b655a', edge: true };
const canteenMenu = faceQuad(-0.3, -0.7, 1.1, 0.05, 6.49);

const rDormHall = { ...base1, hw: 1.25, depth: 9.5, fogEnd: 9.5, pal: PAL1_EXT.dorm, lights: [1.8, 4.4, 7.0], backDoor: { x1: -0.35, x2: 0.35, top: -0.55 } };
const dormDepotDoor = faceQuad(-0.35, -0.55, 0.35, 1, 9.49);
const dormBunkDoor = wallQuad(-1.25, -0.6, 1, 2.5, 3.4);
const dormWashDoor = wallQuad(1.25, -0.6, 1, 2.1, 2.9);
const dormBoard = wallQuad(-1.25, -0.48, 0.05, 4.0, 5.1);
const dormLocker = { x1: 0.72, x2: 1.2, y1: -0.3, y2: 1, z1: 4.3, z2: 5.0, color: '#5f686e', edge: true };

const rBunk = { ...base1, wallTex: undefined, hw: 1.6, depth: 4.5, fogEnd: 11, pal: PAL1_EXT.dorm, tiles: true, lights: [2.1] };
const bunkBed = { x1: -1.5, x2: -0.55, y1: 0.42, y2: 1, z1: 2.1, z2: 3.6, color: '#585c54', edge: true };
const bunkTop = { ...bunkBed, y1: -0.32, y2: -0.18 };
const bunkBox = { x1: 0.45, x2: 1.15, y1: 0.62, y2: 1, z1: 2.3, z2: 2.8, color: '#444c44', edge: true };
const bunkMirror = faceQuad(0.35, -0.55, 0.95, 0.15, 4.49);

const rWashroom = { ...base1, wallTex: undefined, hw: 1.6, depth: 5.5, fogEnd: 8.5, pal: PAL1_EXT.cold, tiles: true, lights: [2.0, 4.0], flickerLights: [1] };
const washMirror = faceQuad(-1.1, -0.55, 0.7, 0.1, 5.49);
const washSink = { x1: -1.1, x2: 0.7, y1: 0.25, y2: 1, z1: 4.8, z2: 5.4, color: '#cfd4d2', edge: true };
const washCab = wallQuad(1.6, -0.45, 0.25, 2.2, 2.9);

// Wing D
const rGreenhouse = { ...base1, hw: 2.1, depth: 9.5, fogEnd: 7, pal: PAL1_EXT.green, lights: [2.2, 5.2], flickerLights: [1] };
const greenVines = Array.from({ length: 18 }, (_, i) => ({
  s: i % 2 ? 1 : -1, z: 1.4 + ((i * 0.43) % 6.5), y: -1 + ((i * 0.47) % 1.6),
}));
const greenTable = { x1: -1.65, x2: -0.8, y1: 0.38, y2: 1, z1: 2.6, z2: 3.5, color: '#5a4e3a', edge: true };
const greenTank = { x1: 0.9, x2: 1.65, y1: 0.1, y2: 1, z1: 2.8, z2: 3.5, color: '#4d6052', edge: true };
const greenVaultDoor = faceQuad(-0.42, -0.58, 0.42, 1, 9.49);

const rRootVault = { ...base1, hw: 1.8, depth: 6.5, fogEnd: 6.8, pal: PAL1_EXT.green, lights: [2.2, 4.4], flickerLights: [0] };
const rootChest = { x1: -0.45, x2: 0.55, y1: 0.45, y2: 1, z1: 3.1, z2: 3.8, color: '#4d5248', edge: true };
const rootGrate = [P(-1.1, 0.99, 2.2), P(-0.3, 0.99, 2.2), P(-0.3, 0.99, 2.9), P(-1.1, 0.99, 2.9)];

const rWorksScaffold = { ...base1, hw: 2.2, depth: 9, fogEnd: 7.5, pal: PAL.office, lights: [2.2, 5.0], flickerLights: [1] };
const scafCoreDoor = faceQuad(-0.45, -0.62, 0.45, 1, 8.99);
const scafBucket = { x1: -1.45, x2: -1.0, y1: 0.55, y2: 1, z1: 2.2, z2: 2.6, color: '#c8c4b8', edge: true };
const scafClip = faceQuad(-1.35, 0.35, -1.05, 0.5, 2.199);

const rWorksCore = { ...base1, wallTex: undefined, hw: 2.2, depth: 8, fogEnd: 8.5, pal: PAL.office, lights: [2.0, 4.8] };
const coreFrame = [P(-0.35, -0.55, 3.8), P(0.35, -0.55, 3.8), P(0.35, 1, 3.8), P(-0.35, 1, 3.8)];
const coreRolls = { x1: -1.75, x2: -1.0, y1: 0.45, y2: 1, z1: 2.5, z2: 3.3, color: '#c8b35e', edge: true };
const coreCrate = { x1: 1.0, x2: 1.65, y1: 0.48, y2: 1, z1: 2.7, z2: 3.4, color: '#7d6240', edge: true };
const coreCtrlDoor = wallQuad(2.2, -0.6, 1, 4.5, 5.6);

const rCtrlCorr = { ...base1, hw: 1.25, depth: 9, fogEnd: 10, pal: PAL1_EXT.ctrl, lights: [1.8, 4.4, 7.0] };
const ctrlWorksDoor = wallQuad(-1.25, -0.6, 1, 2.4, 3.4);
const ctrlLaundryDoor = wallQuad(1.25, -0.6, 1, 3.6, 4.6);
const ctrlArchiveDoor = faceQuad(-0.42, -0.62, 0.42, 1, 8.99);
const ctrlIntercom = wallQuad(-1.25, -0.25, 0.05, 4.8, 5.2);

const rLaundry = { ...base1, wallTex: undefined, hw: 2.0, depth: 6, fogEnd: 10.5, pal: PAL1_EXT.ctrl, tiles: true, lights: [2.0, 4.2] };
const laundryDrums = [2.4, 3.6, 4.8].map((z) => ({ x1: -1.9, x2: -1.1, y1: 0.15, y2: 1, z1: z, z2: z + 0.85, color: '#9ea6ac', edge: true }));
const laundryCart = { x1: 0.8, x2: 1.55, y1: 0.45, y2: 1, z1: 2.6, z2: 3.5, color: '#787f84', edge: true };

const rArchive = { ...base1, wallTex: undefined, hw: 2.1, depth: 6.5, fogEnd: 11, pal: PAL1_EXT.archive, tiles: true, lights: [2.2, 4.6] };
const archDesk = { x1: -0.65, x2: 0.65, y1: 0.35, y2: 1, z1: 2.6, z2: 3.3, color: '#4e463a', edge: true };
const archCrt = faceQuad(-0.28, -0.08, 0.28, 0.34, 2.599);
const archCab = { x1: -1.95, x2: -1.25, y1: -0.5, y2: 1, z1: 2.5, z2: 4.5, color: '#5c605a', edge: true };
const archCrate = { x1: 1.15, x2: 1.8, y1: 0.45, y2: 1, z1: 3.0, z2: 3.7, color: '#7b6342', edge: true };
const archCtrlDoor = wallQuad(2.1, -0.6, 1, 4.0, 5.0);

function tryOpenArchive(g) {
  if (g.s.flags.l1_archive_open) return g.go('l1_archive');
  if (!g.s.flags.l1_power) {
    return g.say('厚重的磁力氣密門鎖得死死的，門旁的讀卡機沒有任何燈號——這一側還處於斷電狀態。得先恢復第一區變電所的電力。');
  }
  g.say('讀卡機亮著紅燈，螢幕閃出「M.E.G. ARCHIVE — 請感應藍標識別證」。');
}

function swipeArchiveCard(g) {
  if (!g.s.flags.l1_power) {
    return g.say('讀卡機完全沒過電，刷卡沒有任何反應。得先去第一區變電所恢復電力。');
  }
  if (g.s.flags.l1_archive_open) return g.say('磁力門已經解鎖了。');
  g.flag('l1_archive_open');
  g.sfx('ok');
  g.say('「嗶」地一聲，讀卡機轉為綠燈，氣密門兩側的磁力閂同時彈開！');
}

export const LEVEL1_WINGS = {
  // ================= WING A: LOADING DOCK & FREIGHT =================
  l1_dock: {
    level: 1, title: '裝卸月台', room: rDock, flickerable: true, hall: true,
    enter(g, { first }) {
      if (first) g.say('水泥月台一字排開四道鐵捲門。一號門被霧氣頂死，二號門停著一節結霜的貨櫃車廂，空氣裡有生鏽與柴油的味道。');
    },
    draw(ctx, t, s, R) {
      drawShutter(ctx, R, dockShutter1, 2.7, 0.85);
      drawShutter(ctx, R, dockShutter2, 5.2, 0.35);
      txt(ctx, 'DOCK 01', P(-2.55, -0.62, 2.7)[0] + 10, P(-2.55, -0.62, 2.7)[1], shade(R, '#d8c24a', 2.7), 9);
      txt(ctx, 'DOCK 02', P(-2.55, -0.62, 5.2)[0] + 10, P(-2.55, -0.62, 5.2)[1], shade(R, '#d8c24a', 5.2), 9);
      drawDoorFrame(ctx, R, dockSorting, 9.9, '#181a1c', '#5a5e62');
      drawDoorFrame(ctx, R, dockCold, 4.2, '#4e6068', '#8aa0aa');
      drawWoodCrate(ctx, R, dockPallet);
      paper(ctx, R, dockClip, 2.5, '#e8e0c8');
    },
    hotspots: [
      BACK('l1_crates', '回到倉庫'),
      { ...FORWARD('l1_sorting', '往分檢站'), rect: bounds(dockSorting, 14) },
      { id: 'truck', rect: bounds(dockShutter2, 6), label: '二號閘門（貨櫃車廂）', cursor: 'go', click: (g) => g.go('l1_truck') },
      { id: 'cold', rect: bounds(dockCold, 6), label: '往低溫貨道', cursor: 'go', click: (g) => g.go('l1_cold_corridor') },
      { id: 'shutter1', rect: bounds(dockShutter1, 6), label: '一號閘門', cursor: 'look', click: (g) => g.say('閘門卡死在離地半尺的地方，外頭湧進白茫茫的冷霧。霧裡偶爾有車輪碾過水窪的聲音，但什麼都看不見。') },
      { id: 'note', rect: bounds(dockClip, 10), label: '棧板上的調度單', cursor: 'look', click: (g) => g.read('n_l1_dock') },
    ],
  },

  l1_truck: {
    level: 1, title: '無牌貨櫃車廂', room: rTruck, dark: true, nightshot: true, flickerable: true,
    viewMsg: '夜視畫面裡，車廂最深處沒有車門，而是無止盡向後延伸的金屬肋骨。',
    enter(g, { first }) {
      if (first) g.say(g.s.light
        ? '你爬進二號閘門後的貨櫃車廂。鐵皮內壁結著一層薄霜，冷得像冰櫃。'
        : '貨櫃車廂裡伸手不見五指，只有冷氣從金屬地板縫裡往上冒。');
    },
    draw(ctx, t, s, R) {
      for (let z = 1.6; z < 6.8; z += 0.9) {
        seg(ctx, P(-1.15, -1, z), P(-1.15, 1, z), shade(R, '#7a8a94', z), 3);
        seg(ctx, P(1.15, -1, z), P(1.15, 1, z), shade(R, '#7a8a94', z), 3);
      }
      drawWoodCrate(ctx, R, truckCrate);
      drawWoodCrate(ctx, R, truckCrate2);
    },
    hotspots: [
      BACK('l1_dock', '爬出車廂'),
      {
        id: 'crate', when: (s) => !s.flags.l1_truck_loot, rect: boxRect(truckCrate, 8), label: '綁著封條的木箱', cursor: 'take',
        click: (g) => {
          g.flag('l1_truck_loot');
          g.give('almond'); g.give('bar');
          g.say('你扯開結霜的塑膠封條，從箱裡翻出一瓶杏仁水與一條能量棒。箱底壓著一張沒有填寫出發地的空白運單。');
        },
      },
      {
        id: 'crate2', rect: boxRect(truckCrate2, 8), label: '深處的空貨箱', cursor: 'look',
        click: (g) => g.say('裡面只有被凍成硬塊的泡棉碎屑，還有一股黃色舊地毯的霉味。'),
      },
    ],
  },

  l1_sorting: {
    level: 1, title: '自動分檢站', room: rSorting, flickerable: true, hall: true,
    enter(g, { first }) {
      if (first) g.say('一條長長的滾輪輸送帶靜止在黑暗裡，上面卡滿寫著「B.N.T.G.」的紙箱。頭頂鐵樑上掛著一塊指向南邊貨站的牌子。');
    },
    draw(ctx, t, s, R) {
      drawConveyor(ctx, R, sortBelt);
      drawWoodCrate(ctx, R, sortBox, { stencil: 'B.N.T.G.' });
      paper(ctx, R, sortNote, 3.5, '#e8dfc2');
      drawDoorFrame(ctx, R, sortDepotDoor, 9.4, '#4c5448', '#8d9686');
      drawDoorFrame(ctx, R, sortLiftDoor, 3.6, '#50565c', '#98a0a8');
      const dp = bounds(sortDepotDoor);
      txt(ctx, 'B.N.T.G.', dp[0] + dp[2] / 2, dp[1] - 6, shade(R, '#cfe0be', 9), 10);
    },
    hotspots: [
      BACK('l1_dock', '退回裝卸月台'),
      { ...FORWARD('l1_bntg_depot', 'B.N.T.G. 貨站'), rect: bounds(sortDepotDoor, 14) },
      { id: 'lift', rect: bounds(sortLiftDoor, 8), label: '貨運電梯廳', cursor: 'go', click: (g) => g.go('l1_freight_lift') },
      { id: 'note', rect: bounds(sortNote, 10), label: 'B.N.T.G. 貨箱貼紙', cursor: 'look', click: (g) => g.read('n_l1_bntg') },
      {
        id: 'belt', rect: boxRect(sortBelt, 6), label: '停擺的輸送帶', cursor: 'look',
        click: (g) => {
          if (g.s.flags.l1_sort_can) return g.say('輸送帶滾輪生鏽卡死了，縫裡只剩紙箱碎屑。');
          g.flag('l1_sort_can');
          g.give('can', '你在滾輪與檔板夾縫裡摸到一個還沒生鏽的罐頭。');
        },
      },
    ],
  },

  l1_bntg_depot: {
    level: 1, title: 'B.N.T.G. 廢棄貨站', room: rDepot, safe: true,
    enter(g, { first }) {
      if (first) g.say('用沙包和鋼架圍出來的交易據點。鐵柵欄窗口掛著「暫停交易」的木牌，空氣比外面乾燥，讓人稍微喘了口氣。');
    },
    draw(ctx, t, s, R) {
      drawTable(ctx, R, depotCounter);
      drawPadlockChest(ctx, R, depotFuseBox);
      drawShelfRack(ctx, R, depotShelf, { tiers: 3 });
      paper(ctx, R, depotLedger, 2.6, '#ece2c6');
      drawDoorFrame(ctx, R, depotDormDoor, 4.4, '#6b685e', '#32302b');
      if (!s.flags.l1_depot_almond) bottle(ctx, R, P(1.35, 0.35, 2.7)[0], P(1.35, 0.35, 2.7)[1], 36, 2.7);
    },
    hotspots: [
      BACK('l1_sorting', '回到分檢站'),
      { id: 'dorms', rect: bounds(depotDormDoor, 8), label: '通往 M.E.G. 宿舍的捷徑門', cursor: 'go', click: (g) => g.go('l1_dorm_hall') },
      { id: 'counter', rect: bounds(depotLedger, 10), label: '交易帳本', cursor: 'look', click: (g) => g.read('n_l1_trade') },
      {
        id: 'fusebox', rect: boxRect(depotFuseBox, 8), label: '櫃檯下的紅色備品箱', cursor: 'take',
        click: (g) => {
          if (g.s.flags.l1_depot_fuse) return g.say('備品箱裡只剩幾張泡爛的領料單。');
          g.flag('l1_depot_fuse');
          g.give('l1_fuse');
          g.give('bar');
          g.say('你打開紅色金屬箱：裡面躺著一顆完好的「高壓保險絲」和一條能量棒！');
        },
      },
      {
        id: 'shelf', rect: boxRect(depotShelf, 6), label: '貿易貨架', cursor: 'take',
        click: (g) => {
          if (g.s.flags.l1_depot_almond) return g.say('貨架上只剩空紙箱和幾枚沒人認領的硬幣。');
          g.flag('l1_depot_almond');
          g.give('almond', '你在貨架最上層拿到一瓶沒開封的杏仁水。');
        },
      },
    ],
  },

  l1_cold_corridor: {
    level: 1, title: '低溫貨道', room: rColdCorr, flickerable: true, hall: true,
    enter(g, { first }) {
      if (first) g.say('一走進這條走廊，呼出的氣立刻變成白霧。天花板上的管線結滿白霜，正前方是一扇厚重的冷庫鐵門。');
    },
    draw(ctx, t, s, R) {
      drawPipes(ctx, R, 3);
      drawDoorFrame(ctx, R, coldFreezerDoor, 8.4, '#7d9099', '#38464d');
      drawDoorFrame(ctx, R, coldDrainDoor, 4.1, '#44504a', '#212824');
      const tp = P(-1.25, -0.15, 2.35);
      ctx.fillStyle = shade(R, '#dce6ea', 2.35); ctx.beginPath(); ctx.arc(tp[0], tp[1], 14, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#38464d'; ctx.lineWidth = 2; ctx.stroke();
      seg(ctx, tp, [tp[0] - 8, tp[1] + 5], '#c03028', 2);
      const dp = bounds(coldDrainDoor);
      txt(ctx, '排水層 ↓', dp[0] + dp[2] / 2, dp[1] - 6, shade(R, '#b4d0bc', 4.1), 9);
    },
    hotspots: [
      BACK('l1_dock', '回到裝卸月台'),
      { ...FORWARD('l1_freezer', '推開冷庫大門'), rect: bounds(coldFreezerDoor, 14) },
      { id: 'drainage', rect: bounds(coldDrainDoor, 8), label: '往地下排水廊道', cursor: 'go', click: (g) => g.go('l1_drainage') },
      { id: 'thermo', rect: bounds(coldThermo, 10), label: '牆上的溫度計', cursor: 'look', click: (g) => g.say('水銀柱死死停在零下十八度。旁邊的管線明明已經乾裂，沒有任何冷媒在流動。') },
    ],
  },

  l1_freezer: {
    level: 1, title: '大型冷庫', room: rFreezer, flickerable: true,
    viewMsg: '觀景窗裡，冷庫內門的圓窗上貼著兩隻蒼白的手印，正一點一點往外滲出霧氣。',
    enter(g, { first }) {
      if (first) g.say('塑膠門簾後面是一座幾乎空了的冷庫。鐵架上結著厚厚的霜，最裡面的小門上嵌著一扇結冰的圓窗。');
    },
    draw(ctx, t, s, R) {
      for (let x = -1.7; x <= 1.7; x += 0.48) {
        seg(ctx, P(x, -0.95, 1.4), P(x, 0.9, 1.4), 'rgba(200,225,235,0.16)', 8);
      }
      drawShelfRack(ctx, R, freezerRack, { tiers: 3, frosted: true });
      const c = P(-0.05, -0.15, 6.49);
      ctx.fillStyle = shade(R, '#58666e', 6.5);
      ctx.beginPath(); ctx.arc(c[0], c[1], 36, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0f202a';
      ctx.beginPath(); ctx.arc(c[0], c[1], 24, 0, Math.PI * 2); ctx.fill();
      paper(ctx, R, freezerNote, 2.4, '#e2ecef');
    },
    hotspots: [
      BACK('l1_cold_corridor', '離開冷庫'),
      {
        id: 'porthole', rect: bounds(freezerPorthole, 10), label: '結霜的圓窗', cursor: 'look',
        click: (g) => g.closeup('l1_freezer_porthole', { msg: '你湊近那扇結滿白霜的小圓窗。裡面沒有壓縮機的聲音，只有微弱的冷風吹出來。' }),
      },
      {
        id: 'rack', rect: boxRect(freezerRack, 6), label: '結霜鐵架', cursor: 'take',
        click: (g) => {
          if (g.s.flags.l1_freezer_can) return g.say('鐵架上只剩凍硬的空紙盒。');
          g.flag('l1_freezer_can');
          g.give('can', '你敲掉紙箱上的冰殼，拿出一罐沒凍裂的罐頭。');
        },
      },
      { id: 'note', rect: bounds(freezerNote, 10), label: '冷庫值班便條', cursor: 'look', click: (g) => g.read('n_l1_freezer') },
    ],
  },

  // ================= WING B: DRAINAGE, CISTERN & SUBSTATION =================
  l1_drainage: {
    level: 1, title: '濕滑排水廊道', room: rDrainage, flickerable: true, hall: true,
    enter(g, { first }) {
      if (first) g.say('地板中央是一條黑漆漆的排水溝，積水緩慢地往深處流。兩側水泥牆滲滿水珠，右邊掛著「變電所」的黃色牌子。');
    },
    draw(ctx, t, s, R) {
      drawWaterStrip(ctx, R, -0.42, 0.42, 1.3, 8.8, t, '#16201e');
      drawDoorFrame(ctx, R, drainCisternDoor, 8.9, '#141a18', '#56645c');
      drawDoorFrame(ctx, R, drainSubDoor, 3.7, '#5c584a', '#c9a227');
      const sp = bounds(drainSubDoor);
      txt(ctx, '⚡ 變電所', sp[0] + sp[2] / 2, sp[1] - 6, shade(R, '#ffd878', 3.7), 10);
    },
    hotspots: [
      BACK('l1_cold_corridor', '回到低溫貨道'),
      { ...FORWARD('l1_cistern', '往地下蓄水池'), rect: bounds(drainCisternDoor, 14) },
      { id: 'substation', rect: bounds(drainSubDoor, 8), label: '第一區變電所鐵門', cursor: 'go', click: (g) => g.go('l1_substation') },
      { id: 'gutter', rect: [390, 390, 180, 70], label: '中央排水溝', cursor: 'look', click: (g) => g.say('黑水冰冷又粘稠，聞起來帶著一股機油味。你沒敢把手伸進去。') },
    ],
  },

  l1_cistern: {
    level: 1, title: '地下蓄水池', room: rCistern, flickerable: true, hall: true,
    viewMsg: '觀景窗裡，水面下方有一道巨大的蒼白輪廓正貼著棧橋邊緩緩滑過。',
    enter(g, { first }) {
      if (first) g.say('頭頂忽然挑高，一條狹窄的鐵橋橫跨在無邊的地下蓄水池上方。水面靜得像鏡子，遠處傳來水滴回音。');
    },
    draw(ctx, t, s, R) {
      drawWaterStrip(ctx, R, -2.75, 2.75, 1.2, 10.8, t, '#132022');
      // narrow catwalk
      poly(ctx, [P(-0.55, 0.96, 1.2), P(0.55, 0.96, 1.2), P(0.55, 0.96, 10.8), P(-0.55, 0.96, 10.8)], shade(R, '#4b504c', 3));
      seg(ctx, P(-0.55, 0.96, 1.2), P(-0.55, 0.96, 10.8), shade(R, '#88928c', 2.5), 2);
      seg(ctx, P(0.55, 0.96, 1.2), P(0.55, 0.96, 10.8), shade(R, '#88928c', 2.5), 2);
      drawDoorFrame(ctx, R, cisternPumpDoor, 10.9, '#2a3630', '#6d7a72');
      drawBarrel(ctx, R, cisternCan, { label: 'LOG' });
    },
    drawView(ctx, t) {
      const px = CX + Math.sin(t * 0.55) * 140;
      const py = 365 + Math.cos(t * 0.8) * 14;
      ctx.save();
      ctx.fillStyle = 'rgba(205, 240, 232, 0.24)';
      ctx.beginPath();
      ctx.ellipse(px, py, 95, 22, 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
    hotspots: [
      BACK('l1_drainage', '退回排水廊道'),
      { ...FORWARD('l1_pump', '走過鐵橋進幫浦室'), rect: bounds(cisternPumpDoor, 14) },
      {
        id: 'canister', rect: boxRect(cisternCan, 10), label: '橋邊的防水測繪罐', cursor: 'take',
        click: (g) => {
          if (!g.s.flags.l1_cistern_loot) {
            g.flag('l1_cistern_loot');
            g.give('almond');
            g.say('你擰開橘色防水罐：裡面有一瓶杏仁水和一卷測繪筆記。');
          }
          g.read('n_l1_cistern');
        },
      },
    ],
  },

  l1_pump: {
    level: 1, title: '幫浦控制室', room: rPump, safe: true,
    enter(g, { first }) {
      if (first) g.say('兩台綠色鑄鐵抽水幫浦在牆邊低鳴。角落有道往上的鐵梯，牆牌標著「通往管線區／倉庫更深處」。');
    },
    draw(ctx, t, s, R) {
      drawPumpUnit(ctx, R, pumpBody);
      drawTable(ctx, R, pumpTable);
      paper(ctx, R, pumpLog, 2.9, '#e6dfc4');
      drawDoorFrame(ctx, R, pumpStairs, 3.5, '#3b4240', '#8fa096');
      const sp = bounds(pumpStairs);
      txt(ctx, '倉庫深處 ↑', sp[0] + sp[2] / 2, sp[1] - 6, shade(R, '#d0e2d4', 3.5), 10);
    },
    hotspots: [
      BACK('l1_cistern', '回到地下蓄水池'),
      { id: 'stairs_up', rect: bounds(pumpStairs, 8), label: '往上爬回倉庫更深處', cursor: 'go', click: (g) => g.go('l1_deep', { msg: '你沿著生鏽鐵梯爬上去，溫度驟然升高——牆上的管線越來越多。' }) },
      {
        id: 'wheel', rect: boxRect(pumpBody, 6), label: '幫浦排水手輪', cursor: 'look',
        click: (g) => {
          if (g.s.flags.l1_pump_drained) return g.say('幫浦已經排空了檢修槽，管線裡只剩穩定的水流聲。');
          g.flag('l1_pump_drained');
          g.sfx('open');
          g.give('almond');
          g.give('battery');
          g.say('你用力把紅色手輪轉到底。伴隨一陣排氣聲，濾網槽裡吐出一瓶杏仁水與一顆密封好的電池！');
        },
      },
      { id: 'log', rect: bounds(pumpLog, 10), label: '幫浦室紀錄本', cursor: 'look', click: (g) => g.read('n_l1_pump') },
    ],
  },

  l1_substation: {
    level: 1, title: '第一區變電所', room: rSubstation, flickerable: true, hall: true,
    enter(g, { first }) {
      if (first) g.say(g.s.flags.l1_power
        ? '變電所恢復供電後，變壓器發出低沉穩定的電流嗡鳴。'
        : '高壓電纜沿著牆頂爬過，配電盤上幾盞饋線紅燈無力地閃著。這一區的主保險絲似乎燒斷了。');
    },
    draw(ctx, t, s, R) {
      drawDoorFrame(ctx, R, subLiftDoor, 3.0, '#4d5258', '#8a9096');
      drawDoorFrame(ctx, R, subCtrlDoor, 4.1, '#586064', '#9aa4aa');
      poly(ctx, subPanel, shade(R, '#353a3f', 6.4));
      ctx.strokeStyle = shade(R, '#1b1e21', 6.4); ctx.lineWidth = 2; poly(ctx, subPanel); ctx.stroke();
      const led = P(0.15, -0.3, 6.48);
      ctx.fillStyle = s.flags.l1_power ? '#42e078' : '#e03e2d';
      ctx.beginPath(); ctx.arc(led[0], led[1], 4, 0, Math.PI * 2); ctx.fill();
      if (s.flags.l1_power) glow(ctx, led[0], led[1], 24, 'rgba(66,224,120,0.4)');
      paper(ctx, R, subNote, 4.3, '#ece3c8');
    },
    hotspots: [
      BACK('l1_drainage', '回到排水廊道'),
      { id: 'lift', rect: bounds(subLiftDoor, 8), label: '往貨運電梯廳', cursor: 'go', click: (g) => g.go('l1_freight_lift') },
      { id: 'ctrl', rect: bounds(subCtrlDoor, 8), label: '往管制走廊', cursor: 'go', click: (g) => g.go('l1_control_corridor') },
      {
        id: 'panel', rect: bounds(subPanel, 10), label: '高壓配電盤', cursor: 'look',
        click: (g) => g.closeup('l1_substation_panel', {
          msg: g.s.flags.l1_power
            ? '配電盤三盞綠燈全亮，電壓穩定在 11 kV。'
            : 'FEEDER-B 保險絲槽是空的，上面還留著燒黑的痕跡。',
        }),
        use: {
          l1_fuse: (g) => {
            if (g.s.flags.l1_power) return g.say('變電所已經正常供電了。');
            g.take('l1_fuse');
            g.flag('l1_power');
            g.sfx('ok');
            g.say('你將高壓保險絲壓進變電所配電盤。變壓器低鳴起來，電梯廳與管制區的電力同時恢復！');
          },
        },
      },
      { id: 'note', rect: bounds(subNote, 10), label: '變電所檢修單', cursor: 'look', click: (g) => g.read('n_l1_substation') },
    ],
  },

  l1_freight_lift: {
    level: 1, title: '貨運電梯廳', room: rFreightLift, flickerable: true, hall: true,
    enter(g, { first }) {
      if (first) g.say('兩座大型鐵柵欄貨梯並排在盡頭。左邊的 A 號井門敞開著，只剩幾條斷裂的鋼纜垂在黑暗裡。');
    },
    draw(ctx, t, s, R) {
      drawDoorFrame(ctx, R, liftShaftA, 7.4, '#090b0c', '#5c6064');
      seg(ctx, P(-1.0, -0.65, 7.48), P(-1.08, 0.55, 7.48), shade(R, '#6e7276', 7.4), 2);
      seg(ctx, P(-0.72, -0.65, 7.48), P(-0.68, 0.3, 7.48), shade(R, '#6e7276', 7.4), 2);
      drawDoorFrame(ctx, R, liftShaftB, 7.4, s.flags.l1_power ? '#4b555a' : '#2c3034', '#7a8086');
      drawDoorFrame(ctx, R, liftSubDoor, 2.9, '#4e5256', '#d8aa38');
      drawDoorFrame(ctx, R, liftUpperDoor, 3.7, '#585c58', '#a09a68');
      paper(ctx, R, liftNote, 7.4, '#efe5c6');
    },
    hotspots: [
      BACK('l1_sorting', '回到分檢站'),
      { id: 'substation', rect: bounds(liftSubDoor, 8), label: '往第一區變電所', cursor: 'go', click: (g) => g.go('l1_substation') },
      { id: 'upper', rect: bounds(liftUpperDoor, 8), label: '往停車場上層坡道', cursor: 'go', click: (g) => g.go('l1_garage_upper') },
      {
        id: 'shaft_a', rect: bounds(liftShaftA, 6), label: '斷纜的 A 號電梯井', cursor: 'look',
        click: (g) => {
          if (once(g, 'l1_shaft_a_looked')) g.sanity(-3);
          g.say('你探頭往井底看。沒有底，也沒有水聲——只有冷風從下方直直吹上來，吹得頭暈。');
        },
      },
      {
        id: 'lift_b', rect: bounds(liftShaftB, 6), label: 'B 號貨梯檢修門', cursor: 'look',
        click: (g) => {
          if (!g.s.flags.l1_power) return g.say('電磁門鎖沒有過電，完全拉不開。得先去變電所恢復供電。');
          if (g.s.flags.l1_lift_loot) return g.say('卡在半層的 B 號貨梯裡已經空了。');
          g.flag('l1_lift_loot');
          g.sfx('open');
          g.give('battery');
          g.give('almond');
          g.say('恢復供電後，電磁閂應聲彈開！你從貨梯應急箱裡拿出一顆電池與一瓶杏仁水。');
        },
      },
      { id: 'note', rect: bounds(liftNote, 10), label: '電梯井安全告示', cursor: 'look', click: (g) => g.read('n_l1_lift') },
    ],
  },

  l1_garage_upper: {
    level: 1, title: '停車場上層坡道', room: rGarageUpper, flickerable: true, hall: true,
    enter(g, { first }) {
      if (first) g.say('傾斜的水泥車道往下沉進濃霧裡。車道旁停著一輛積滿灰塵的舊轎車，車牌是空白的。');
    },
    draw(ctx, t, s, R) {
      for (let z = 2.0; z < 9.5; z += 1.5) {
        seg(ctx, P(-0.8, 0.99, z), P(0, 0.99, z + 0.5), shade(R, '#b8a038', z, 1, 0.7), 3);
        seg(ctx, P(0.8, 0.99, z), P(0, 0.99, z + 0.5), shade(R, '#b8a038', z, 1, 0.7), 3);
      }
      drawSedan(ctx, R, upperSedan);
      poly(ctx, upperRampDown, shade(R, '#232628', 9.9, 1, 0.8));
      const rp = bounds(upperRampDown);
      txt(ctx, '↓ 霧區入口', rp[0] + rp[2] / 2, rp[1] + rp[3] / 2, shade(R, '#d8e0e8', 9), 11);
    },
    hotspots: [
      BACK('l1_freight_lift', '退回貨運電梯廳'),
      { ...FORWARD('l1_fog', '沿著斜坡走進底層霧區'), rect: bounds(upperRampDown, 14) },
      {
        id: 'sedan', rect: boxRect(upperSedan, 6), label: '無牌舊轎車', cursor: 'take',
        click: (g) => {
          if (g.s.flags.l1_sedan_loot) return g.say('後車廂裡只剩一條裂開的備胎和乾掉的發票紙捲。');
          g.flag('l1_sedan_loot');
          g.give('pills');
          g.give('bar');
          g.say('你撬開沒鎖死的後車廂，找到一排鎮定劑與一條能量棒。');
        },
      },
    ],
  },

  // ================= WING C: BURNED NORTH SECTOR & OUTPOST =================
  l1_burned_hall: {
    level: 1, title: '焦黑走廊', room: rBurned, flickerable: true, hall: true,
    viewMsg: '觀景窗裡，地面黑灰上浮出一排清晰的鞋印，從北邊一路踩向第七前哨站的大門。',
    enter(g, { first }) {
      if (first) g.say('整條走廊都被大火燒成焦炭色，臭氧與濕灰的味道刺鼻。難怪前哨站的地圖把這裡整塊塗黑了。');
    },
    draw(ctx, t, s, R) {
      for (let z = 1.6; z < 8.6; z += 1.1) {
        poly(ctx, [P(-1.34, -0.9, z), P(-1.34, 0.3, z + 0.4), P(-1.34, 0.5, z + 0.8), P(-1.34, -0.9, z + 0.6)], 'rgba(10,10,10,0.45)');
      }
      drawDoorFrame(ctx, R, burnedCheckDoor, 8.9, '#3a3e40', '#707478');
      drawDoorFrame(ctx, R, burnedCanteenDoor, 3.5, '#58544c', '#8f8878');
      paper(ctx, R, burnedNote, 2.5, '#cfc6ae');
      drawPadlockChest(ctx, R, burnedTin);
    },
    drawView(ctx) {
      ctx.save();
      ctx.fillStyle = 'rgba(200, 255, 220, 0.45)';
      for (let i = 0; i < 6; i++) {
        const p = P((i % 2 ? 0.14 : -0.14), 0.99, 2.0 + i * 0.85);
        ctx.beginPath(); ctx.ellipse(p[0], p[1], 10 / (1 + i * 0.2), 4 / (1 + i * 0.2), 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    },
    hotspots: [
      BACK('l1_outpost', '退回第七前哨站'),
      { ...FORWARD('l1_checkpoint', '前往隔離檢查哨'), rect: bounds(burnedCheckDoor, 14) },
      { id: 'canteen', rect: bounds(burnedCanteenDoor, 8), label: '前哨站食堂', cursor: 'go', click: (g) => g.go('l1_canteen') },
      { id: 'note', rect: bounds(burnedNote, 10), label: '焦黑走廊調查簡報', cursor: 'look', click: (g) => g.read('n_l1_burned') },
      {
        id: 'tin', rect: boxRect(burnedTin, 10), label: '燻黑的物資罐', cursor: 'take',
        click: (g) => {
          if (g.s.flags.l1_burned_can) return g.say('只剩一個燒黑的空鐵盒。');
          g.flag('l1_burned_can');
          g.give('can', '鐵盒外殼燻黑了，裡面的密封罐頭倒是完好無缺。');
        },
      },
    ],
  },

  l1_checkpoint: {
    level: 1, title: '隔離檢查哨', room: rCheckpoint, safe: true,
    enter(g, { first }) {
      if (first) g.say('碎裂的鐵絲玻璃隔間後方是檢查哨。紫外線消毒燈管偶爾閃著微弱的紫光，盡頭是一扇極厚重的磁力氣密門。');
    },
    draw(ctx, t, s, R) {
      if (s.flags.l1_uv_on) {
        ctx.save();
        ctx.fillStyle = 'rgba(130, 80, 220, 0.14)';
        ctx.fillRect(0, 0, 960, 540);
        ctx.restore();
      }
      drawTable(ctx, R, cpDesk, { drawers: true, lamp: true });
      paper(ctx, R, cpBoard, 4.2, '#e8ece8');
      drawDoorFrame(ctx, R, cpDormDoor, 3.1, '#68665e', '#32302c');
      drawMagDoor(ctx, R, cpArchiveDoor, 5.9, !!s.flags.l1_power, !!s.flags.l1_archive_open, 'ARCHIVE');
      poly(ctx, cpUvBtn, s.flags.l1_uv_on ? '#9f68ff' : '#4a4e52');
    },
    hotspots: [
      BACK('l1_burned_hall', '回到焦黑走廊'),
      { id: 'dorms', rect: bounds(cpDormDoor, 8), label: '往駐地宿舍走廊', cursor: 'go', click: (g) => g.go('l1_dorm_hall') },
      {
        id: 'archive', rect: bounds(cpArchiveDoor, 10), label: '第一層資料室（磁力門）', cursor: 'go',
        click: tryOpenArchive,
        use: { l1_keycard: swipeArchiveCard },
      },
      { id: 'board', rect: bounds(cpBoard, 8), label: '隔離檢查哨白板', cursor: 'look', click: (g) => g.read('n_l1_quarantine') },
      {
        id: 'drawer', rect: boxRect(cpDesk, 8), label: '檢查哨辦公桌抽屜', cursor: 'take',
        click: (g) => {
          if (g.s.flags.l1_cp_loot) return g.say('抽屜裡只剩幾張作廢的通行簽單。');
          g.flag('l1_cp_loot');
          g.give('l1_keycard');
          g.give('pills');
          g.say('你拉開辦公桌抽屜：裡面放著一張「M.E.G. 藍標識別證」和一片鎮定劑。');
        },
      },
      {
        id: 'uv_btn', rect: bounds(cpUvBtn, 12), label: '紫外線消毒燈開關', cursor: 'look',
        click: (g) => {
          g.flag('l1_uv_on', !g.s.flags.l1_uv_on);
          g.sfx('click');
          g.say(g.s.flags.l1_uv_on
            ? '紫光亮了起來。你在門框旁看到幾行只有紫光下才顯形的螢光筆跡：「B-02 密碼 0419」。'
            : '紫外線燈關掉了。');
        },
      },
    ],
  },

  l1_canteen: {
    level: 1, title: '前哨站食堂', room: rCanteen, safe: true,
    enter(g, { first }) {
      if (first) g.say('長條摺疊桌和塑膠椅整齊擺在空蕩蕩的食堂裡。不鏽鋼打菜窗口後面沒人，卻傳來淡淡的桃子糖水味。');
    },
    draw(ctx, t, s, R) {
      drawTable(ctx, R, canteenTable);
      drawTable(ctx, R, canteenCounter, { drawers: true });
      poly(ctx, canteenMenu, shade(R, '#233228', 6.4));
      ctx.strokeStyle = shade(R, '#6b5336', 6.4); ctx.lineWidth = 3; poly(ctx, canteenMenu); ctx.stroke();
      const cp = P(0.9, 0.08, 3.6);
      if (!s.flags.l1_canteen_loot) bottle(ctx, R, cp[0], cp[1], 36, 3.6);
    },
    hotspots: [
      BACK('l1_burned_hall', '回到焦黑走廊'),
      { id: 'menu', rect: bounds(canteenMenu, 8), label: '食堂粉筆板', cursor: 'look', click: (g) => g.read('n_l1_menu') },
      {
        id: 'counter', rect: boxRect(canteenCounter, 8), label: '打菜窗口與檯面', cursor: 'take',
        click: (g) => {
          if (g.s.flags.l1_canteen_loot) return g.say('檯面上只剩兩個洗乾淨倒扣著的鐵餐盤。');
          g.flag('l1_canteen_loot');
          g.give('almond');
          g.give('can');
          g.say('你在打菜窗口拿到一瓶杏仁水與一個糖水桃子罐頭。');
        },
      },
      { id: 'urn', rect: boxRect(canteenTable, 6), label: '摺疊桌與咖啡壺', cursor: 'look', click: (g) => g.say('鋁製咖啡壺已經完全乾透，壺底結著一層黑色的焦垢。') },
    ],
  },

  l1_dorm_hall: {
    level: 1, title: '駐地宿舍走廊', room: rDormHall, safe: true,
    enter(g, { first }) {
      if (first) g.say('兩側排開標著 B-01 到 B-06 的鐵門。盡頭標著「往 B.N.T.G. 貨站」，牆上貼著一張皺巴巴的撤離公告。');
    },
    draw(ctx, t, s, R) {
      drawDoorFrame(ctx, R, dormDepotDoor, 9.4, '#4e544a', '#8e9688');
      drawDoorFrame(ctx, R, dormBunkDoor, 2.9, '#626668', '#2a2d2e');
      drawDoorFrame(ctx, R, dormWashDoor, 2.5, '#647278', '#2e383c');
      txt(ctx, 'B-02', P(-1.24, -0.42, 2.9)[0] + 10, P(-1.24, -0.42, 2.9)[1], shade(R, '#d8d4c4', 2.9), 9);
      txt(ctx, '盥洗室', P(1.24, -0.42, 2.5)[0] - 14, P(1.24, -0.42, 2.5)[1], shade(R, '#cde2ea', 2.5), 9);
      paper(ctx, R, dormBoard, 4.5, '#ebe2c6');
      drawMetalLocker(ctx, R, dormLocker, { open: !!s.flags.l1_dorm_locker });
    },
    hotspots: [
      BACK('l1_checkpoint', '回到隔離檢查哨'),
      { ...FORWARD('l1_bntg_depot', '捷徑：前往 B.N.T.G. 貨站'), rect: bounds(dormDepotDoor, 14) },
      { id: 'bunk', rect: bounds(dormBunkDoor, 6), label: 'B-02 二號寢室', cursor: 'go', click: (g) => g.go('l1_bunk') },
      { id: 'washroom', rect: bounds(dormWashDoor, 6), label: '公用盥洗室', cursor: 'go', click: (g) => g.go('l1_washroom') },
      { id: 'board', rect: bounds(dormBoard, 10), label: '宿舍區公告欄', cursor: 'look', click: (g) => g.read('n_l1_dorms') },
      {
        id: 'locker', rect: boxRect(dormLocker, 8), label: '走廊置物櫃', cursor: 'take',
        click: (g) => {
          if (g.s.flags.l1_dorm_locker) return g.say('置物櫃裡只剩一隻沒有配對的襪子。');
          g.flag('l1_dorm_locker');
          g.sfx('open');
          g.give('almond', '沒鎖的置物櫃裡放著一瓶杏仁水。');
        },
      },
    ],
  },

  l1_bunk: {
    level: 1, title: '二號寢室 (B-02)', room: rBunk, safe: true,
    viewMsg: '觀景窗裡，上鋪坐著一個背對你的人影，雙腳在半空中一晃一晃。',
    enter(g, { first }) {
      if (first) g.say('上下鋪鐵床的床墊早就被搬空了，只剩床尾一個上鎖的個人鐵箱，與牆上一面微裂的鏡子。');
    },
    draw(ctx, t, s, R) {
      drawBunkBed(ctx, R, bunkBed, bunkTop);
      drawPadlockChest(ctx, R, bunkBox);
      poly(ctx, bunkMirror, shade(R, '#8da0a4', 4.4));
      ctx.strokeStyle = shade(R, '#2e3234', 4.4); ctx.lineWidth = 2; poly(ctx, bunkMirror); ctx.stroke();
    },
    drawView(ctx) {
      const p = P(-0.85, -0.32, 2.8);
      ctx.save();
      ctx.fillStyle = 'rgba(15, 22, 18, 0.72)';
      ctx.fillRect(p[0] - 12, p[1] - 48, 24, 48);
      ctx.beginPath(); ctx.arc(p[0], p[1] - 58, 10, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    },
    hotspots: [
      BACK('l1_dorm_hall', '回到宿舍走廊'),
      {
        id: 'footlocker', rect: boxRect(bunkBox, 10), label: '個人密碼鐵箱', cursor: 'look',
        click: (g) => {
          if (g.s.flags.l1_bunk_open) return g.say('鐵箱裡只剩幾張寫滿名字又被劃掉的紙片。');
          g.keypad('0419', () => {
            g.flag('l1_bunk_open');
            g.give('pills');
            g.say('「喀噠」一聲，鐵箱彈開了！裡面有鎮定劑和小李留下的筆記。');
            g.read('n_l1_bunk');
          });
        },
      },
      {
        id: 'mirror', rect: bounds(bunkMirror, 10), label: '裂開的牆鏡', cursor: 'look',
        click: (g) => g.say(g.s.view
          ? '鏡子裡倒映出你身後的上鋪——有人坐在那裡。你趕緊放下攝影機，上鋪只有生鏽的彈簧網。'
          : '鏡面斜斜裂成兩半，你的倒影在裂縫處錯開了一點。'),
      },
    ],
  },

  l1_washroom: {
    level: 1, title: '公用盥洗室', room: rWashroom, flickerable: true,
    viewMsg: '觀景窗穿透水氣，映出霧面鏡子上用手指劃出來的字：「別數柱子」。',
    enter(g, { first }) {
      if (first) g.say('水龍頭一下一下地滴水。整面牆的鏡子都起滿厚厚的白霧，霧氣卻不是熱的，反而冰冷刺骨。');
    },
    draw(ctx, t, s, R) {
      poly(ctx, washMirror, shade(R, '#b8c4c8', 5.4, 1, 0.75));
      ctx.strokeStyle = shade(R, '#485256', 5.4); ctx.lineWidth = 2; poly(ctx, washMirror); ctx.stroke();
      drawSinkBasins(ctx, R, washSink, t);
      const [wx, wy, ww, wh] = bounds(washCab);
      ctx.fillStyle = shade(R, '#e4e8e6', 2.55); ctx.fillRect(wx, wy, ww, wh);
      ctx.strokeStyle = '#5a6260'; ctx.lineWidth = 1.5; ctx.strokeRect(wx, wy, ww, wh);
      ctx.fillStyle = '#c03028';
      ctx.fillRect(wx + ww * 0.44, wy + wh * 0.25, ww * 0.12, wh * 0.5);
      ctx.fillRect(wx + ww * 0.25, wy + wh * 0.44, ww * 0.5, wh * 0.12);
    },
    drawView(ctx) {
      const b = bounds(washMirror);
      txt(ctx, 'DON\'T COUNT', b[0] + b[2] / 2, b[1] + b[3] * 0.48, 'rgba(200,255,220,0.8)', 14);
      txt(ctx, 'THE PILLARS', b[0] + b[2] / 2, b[1] + b[3] * 0.65, 'rgba(200,255,220,0.8)', 14);
    },
    hotspots: [
      BACK('l1_dorm_hall', '退回宿舍走廊'),
      { id: 'mirror', rect: bounds(washMirror, 8), label: '起霧的鏡子', cursor: 'look', click: (g) => g.say('你伸手擦掉一點水霧，三秒後水霧又自己合上了。') },
      {
        id: 'tap', rect: boxRect(washSink, 8), label: '滴水的水龍頭', cursor: 'look',
        click: (g) => {
          g.sfx('drip');
          g.drink(8);
          g.say('你掬起一點滴落的自來水沾濕嘴唇。水很冷，沒有怪味，但也不能喝太多。');
        },
      },
      {
        id: 'cabinet', rect: bounds(washCab, 8), label: '牆邊藥盒', cursor: 'take',
        click: (g) => {
          if (g.s.flags.l1_wash_pills) return g.say('小藥盒裡只剩一張空鋁箔。');
          g.flag('l1_wash_pills');
          g.give('pills', '你在牆邊的鋁製藥盒裡找到一片備用鎮定劑。');
        },
      },
    ],
  },

  // ================= WING D: CONSERVATORY, DEEP WORKS & CONTROL =================
  l1_greenhouse: {
    level: 1, title: '溫室迴廊', room: rGreenhouse, flickerable: true, hall: true,
    trap: {
      after: 26,
      run: (g) => {
        g.sanity(-12);
        g.sfx('sting');
        g.go('l1_garden', { free: true, msg: '空氣裡的花香濃得像蜜，你的眼皮越來越沉——你猛地咬了下舌尖，逃回花園門口才喘過氣。' });
      },
    },
    viewMsg: '觀景窗裡，天花板破裂的玻璃上方根本沒有天空，只有密密麻麻垂下來的白色根鬚。',
    enter(g, { first }) {
      if (first) g.say('生鏽的鐵拱架撐起一條廢棄溫室，玻璃頂棚糊滿灰泥。比外面更濃的花香撲面而來——記住，別在這裡停留太久。');
    },
    draw(ctx, t, s, R) {
      drawVines(ctx, R, greenVines, '#3f6a34');
      drawTable(ctx, R, greenTable);
      drawBarrel(ctx, R, greenTank, { label: 'H2O' });
      drawDoorFrame(ctx, R, greenVaultDoor, 9.4, '#182014', '#4d6a3e');
    },
    hotspots: [
      BACK('l1_garden', '退回花園'),
      { ...FORWARD('l1_root_vault', '走進根系地窖'), rect: bounds(greenVaultDoor, 14) },
      { id: 'table', rect: boxRect(greenTable, 8), label: '植物學家的紀錄桌', cursor: 'look', click: (g) => g.read('n_l1_botany') },
      {
        id: 'tank', rect: boxRect(greenTank, 8), label: '蓄水桶旁的提袋', cursor: 'take',
        click: (g) => {
          if (g.s.flags.l1_green_almond) return g.say('提袋裡只剩幾張被濕氣糊掉的標籤紙。');
          g.flag('l1_green_almond');
          g.give('almond', '你在生鏽水桶旁找到一瓶乾淨的杏仁水。');
        },
      },
    ],
  },

  l1_root_vault: {
    level: 1, title: '根系地窖', room: rRootVault, flickerable: true, hall: true,
    enter(g, { first }) {
      if (first) g.say('地窖的水泥地板被粗大的白色根系頂裂了。正中央有一個被根鬚死死纏住的軍用補給箱。');
    },
    draw(ctx, t, s, R) {
      poly(ctx, rootGrate, shade(R, '#2c322b', 2.5));
      drawPadlockChest(ctx, R, rootChest);
      if (!s.flags.l1_vault_cut) {
        for (let i = 0; i < 6; i++) {
          seg(ctx, P(-0.5 + i * 0.2, 0.35, 3.05), P(-0.45 + i * 0.2, 1, 3.75), shade(R, '#768c64', 3.4), 3);
        }
      }
    },
    hotspots: [
      BACK('l1_greenhouse', '爬回溫室迴廊'),
      {
        id: 'chest', rect: boxRect(rootChest, 10), label: '被根系纏住的補給箱', cursor: 'look',
        click: (g) => {
          if (g.s.flags.l1_vault_taken) return g.say('補給箱裡已經清空了。');
          if (!g.s.flags.l1_vault_cut) return g.say('白色根系像電纜一樣把箱蓋絞死了，光靠手根本扯不動。需要「修枝剪」。');
          g.flag('l1_vault_taken');
          g.give('almond');
          g.give('bar');
          g.say('你掀開箱蓋，拿出一瓶杏仁水、一條能量棒，還有一張褪色字條。');
          g.read('n_l1_roots');
        },
        use: {
          shears: (g) => {
            if (g.s.flags.l1_vault_cut) return g.say('箱上的根已經剪開了。');
            g.flag('l1_vault_cut');
            g.sfx('screw');
            g.say('修枝剪一刀一刀剪斷白根，斷面立刻縮回地板縫裡。現在可以打開補給箱了！');
          },
        },
      },
      { id: 'grate', rect: bounds(rootGrate, 8), label: '裂開的地板排水格柵', cursor: 'look', click: (g) => g.say('格柵下面傳來細碎的沙沙聲——不是風，更像是很多細根在水泥底下慢慢往外爬。') },
    ],
  },

  l1_works_scaffold: {
    level: 1, title: '工地鷹架區', room: rWorksScaffold, flickerable: true, hall: true,
    viewMsg: '觀景窗裡，鷹架上那名工人手裡拿著抹刀，一直往你自己臉的位置比劃高度。',
    enter(g, { first }) {
      if (first) g.say('鋼管鷹架一路搭進頭頂的黑霧裡。垂落的塑膠防塵布後面，幾個工人正反覆刮除同一面剛抹好的牆。');
    },
    draw(ctx, t, s, R) {
      for (const x of [-1.4, -0.5, 0.7, 1.5]) seg(ctx, P(x, 1, 4.2), P(x, -1, 4.2), shade(R, '#8a7a5c', 4.2), 3);
      seg(ctx, P(-1.6, 0.05, 4.2), P(1.7, 0.05, 4.2), shade(R, '#8a7a5c', 4.2), 3);
      drawDoorFrame(ctx, R, scafCoreDoor, 8.9, '#3a342a', '#7c6e54');
      drawBucket(ctx, R, scafBucket, { band: '#8a8272' });
      paper(ctx, R, scafClip, 2.2, '#e8e0c6');
    },
    hotspots: [
      BACK('l1_works', '退回施工中的區域'),
      { ...FORWARD('l1_works_core', '穿過防塵布往裡走'), rect: bounds(scafCoreDoor, 14) },
      { id: 'workers', rect: [550, 150, 190, 130], label: '鷹架上的無臉工人', cursor: 'look', click: (g) => g.say('他們一言不發地把水泥抹上牆、再刮掉，動作像卡住的錄影帶一樣重複。') },
      { id: 'bucket', rect: boxRect(scafBucket, 8), label: '油漆桶', cursor: 'look', click: (g) => g.say('桶裡不是油漆，是半凝固的灰色水泥漿。') },
      { id: 'clipboard', rect: bounds(scafClip, 10), label: '鷹架旁的施工日誌', cursor: 'look', click: (g) => g.read('n_l1_scaffold') },
    ],
  },

  l1_works_core: {
    level: 1, title: '未完工樣品廳', room: rWorksCore, flickerable: true, hall: true,
    enter(g, { first }) {
      if (first) g.say('這間大廳左半邊還是粗糙的水泥牆，右半邊卻糊滿了 Level 0 那種單調的黃色壁紙。房間正中央孤零零地立著一扇沒有連接任何牆壁的木門框。');
    },
    draw(ctx, t, s, R) {
      // Right half yellow wallpaper contrast!
      poly(ctx, wallQuad(2.2, -1, 1, 1.2, 8), shade(R, '#c8b35e', 3.5));
      for (let z = 1.4; z < 8; z += 0.38) seg(ctx, P(2.2, -1, z), P(2.2, 1, z), shade(R, '#9e8c40', z, 1, 0.45), 1.5);
      // Freestanding wooden doorframe in center
      ctx.strokeStyle = shade(R, '#6e4d2e', 3.8); ctx.lineWidth = 6; poly(ctx, coreFrame); ctx.stroke();
      drawRolls(ctx, R, coreRolls);
      drawWoodCrate(ctx, R, coreCrate);
      drawDoorFrame(ctx, R, coreCtrlDoor, 5.0, '#62686c', '#303438');
      const cp = bounds(coreCtrlDoor);
      txt(ctx, '管制走廊 →', cp[0] + cp[2] / 2, cp[1] - 6, shade(R, '#dce4e8', 5), 10);
    },
    hotspots: [
      BACK('l1_works_scaffold', '退回工地鷹架區'),
      { id: 'ctrl', rect: bounds(coreCtrlDoor, 8), label: '通往管制走廊的鐵門', cursor: 'go', click: (g) => g.go('l1_control_corridor') },
      {
        id: 'frame', rect: bounds(coreFrame, 8), label: '房間中央的獨立門框', cursor: 'go',
        click: (g) => {
          if (once(g, 'l1_core_frame_loop')) g.sanity(-3);
          g.say('你跨過這扇沒有門板的門框——視覺忽然晃了一下，你發現自己仍然站在同一間樣品廳裡，只是黃色壁紙發出更響亮的嗡鳴。');
        },
      },
      { id: 'rolls', rect: boxRect(coreRolls, 8), label: '成捲的黃色壁紙樣本', cursor: 'look', click: (g) => g.read('n_l1_remodel') },
      {
        id: 'crate', rect: boxRect(coreCrate, 8), label: '工具箱', cursor: 'take',
        click: (g) => {
          if (g.s.flags.l1_core_batt) return g.say('工具箱裡只剩幾顆生鏽的鐵釘。');
          g.flag('l1_core_batt');
          g.give('battery', '你在木工工具箱裡找到一顆備用電池。');
        },
      },
    ],
  },

  l1_control_corridor: {
    level: 1, title: '管制走廊', room: rCtrlCorr, safe: true,
    enter(g, { first }) {
      if (first) g.say('這段走廊比倉庫區整潔得多，地板畫著黃色警戒線，標示「M.E.G. 管制區」。盡頭是一扇磁力氣密門。');
    },
    draw(ctx, t, s, R) {
      seg(ctx, P(-0.85, 0.99, 1.2), P(-0.85, 0.99, 8.8), shade(R, '#c9a227', 3), 3);
      seg(ctx, P(0.85, 0.99, 1.2), P(0.85, 0.99, 8.8), shade(R, '#c9a227', 3), 3);
      drawDoorFrame(ctx, R, ctrlWorksDoor, 2.9, '#625e54', '#2e2b26');
      drawDoorFrame(ctx, R, ctrlLaundryDoor, 4.1, '#788488', '#3c4244');
      drawMagDoor(ctx, R, ctrlArchiveDoor, 8.9, !!s.flags.l1_power, !!s.flags.l1_archive_open, 'ARCHIVE');
      const [ix, iy, iw, ih] = bounds(ctrlIntercom);
      ctx.fillStyle = shade(R, '#7a8086', 5); ctx.fillRect(ix, iy, iw, ih);
      ctx.fillStyle = '#222628';
      for (let r = 0; r < 4; r++) ctx.fillRect(ix + 4, iy + 6 + r * 6, iw - 8, 2);
      ctx.fillStyle = '#e03e2d'; ctx.beginPath(); ctx.arc(ix + iw * 0.5, iy + ih - 6, 2.5, 0, Math.PI * 2); ctx.fill();
    },
    hotspots: [
      BACK('l1_substation', '退回第一區變電所'),
      { id: 'works', rect: bounds(ctrlWorksDoor, 8), label: '往未完工樣品廳', cursor: 'go', click: (g) => g.go('l1_works_core') },
      { id: 'laundry', rect: bounds(ctrlLaundryDoor, 8), label: '自動化洗衣房', cursor: 'go', click: (g) => g.go('l1_laundry') },
      {
        id: 'archive', rect: bounds(ctrlArchiveDoor, 12), label: '第一層資料室（磁力門）', cursor: 'go',
        click: tryOpenArchive,
        use: { l1_keycard: swipeArchiveCard },
      },
      {
        id: 'intercom', rect: bounds(ctrlIntercom, 12), label: '牆上對講機', cursor: 'look',
        click: (g) => {
          g.sfx('static');
          g.say('對講機裡只有沙沙的白噪音——隱約夾雜著誰在念「零、一、二、零」。');
        },
      },
    ],
  },

  l1_laundry: {
    level: 1, title: '自動化洗衣房', room: rLaundry, safe: true,
    enter(g, { first }) {
      if (first) g.say('一排不鏽鋼工業洗衣機靠牆排開，三號滾筒正空轉著發出有節奏的「叩、叩」聲。對面推車上疊滿灰色的 M.E.G. 連身服。');
    },
    draw(ctx, t, s, R) {
      for (const [i, b] of laundryDrums.slice().reverse().entries()) {
        drawWasher(ctx, R, b, t, i === 2);
      }
      drawWireCart(ctx, R, laundryCart);
      if (!s.flags.l1_laundry_almond) bottle(ctx, R, P(1.15, 0.45, 2.9)[0], P(1.15, 0.45, 2.9)[1], 34, 2.9);
    },
    hotspots: [
      BACK('l1_control_corridor', '回到管制走廊'),
      {
        id: 'drum', rect: boxRect(laundryDrums[0], 8), label: '轉動中的三號洗衣滾筒', cursor: 'look',
        click: (g) => {
          g.sfx('clank');
          g.say('你打開三號滾筒：裡面空無一物，卻還是溫熱的。門內側貼著一張保養貼紙。');
          g.read('n_l1_laundry');
        },
      },
      {
        id: 'cart', rect: boxRect(laundryCart, 8), label: '灰色連身服推車', cursor: 'take',
        click: (g) => {
          if (g.s.flags.l1_laundry_almond) return g.say('推車上的連身服都疊得像從來沒人穿過一樣。');
          g.flag('l1_laundry_almond');
          g.give('almond', '你在摺好的連身服口袋邊找到一瓶未開封的杏仁水。');
        },
      },
    ],
  },

  l1_archive: {
    level: 1, title: '第一層資料室', room: rArchive, safe: true,
    enter(g, { first }) {
      if (first) g.say('高大的鐵皮檔案櫃把四面牆塞滿。正中央的書桌上擺著一台發著琥珀色微光的舊終端機，空氣裡是舊紙張與臭氧的味道。');
    },
    draw(ctx, t, s, R) {
      drawMetalCabinet(ctx, R, archCab, { drawers: 4 });
      drawWoodCrate(ctx, R, archCrate);
      drawTable(ctx, R, archDesk, { drawers: true });
      poly(ctx, archCrt, '#1f1608');
      ctx.strokeStyle = '#60523c'; ctx.lineWidth = 2; poly(ctx, archCrt); ctx.stroke();
      const cp = bounds(archCrt);
      ctx.fillStyle = '#ffb84a';
      ctx.fillRect(cp[0] + 6, cp[1] + 6, cp[2] - 12, cp[3] - 12);
      drawDoorFrame(ctx, R, archCtrlDoor, 4.5, '#62686c', '#303438');
      const dp = bounds(archCtrlDoor);
      txt(ctx, '管制走廊 →', dp[0] + dp[2] / 2, dp[1] - 6, shade(R, '#dce4e8', 4.5), 10);
    },
    hotspots: [
      BACK('l1_checkpoint', '回到隔離檢查哨'),
      { id: 'ctrl', rect: bounds(archCtrlDoor, 8), label: '往管制走廊', cursor: 'go', click: (g) => g.go('l1_control_corridor') },
      {
        id: 'crt', rect: bounds(archCrt, 12), label: '琥珀色終端機', cursor: 'look',
        click: (g) => g.closeup('l1_archive_crt', { msg: '終端機仍在低鳴運轉，螢幕上不斷刷新著 Level 1 的區域索引與 #0120 檔案狀態。' }),
      },
      {
        id: 'cabinet', rect: boxRect(archCab, 8), label: '0120 索引檔案櫃', cursor: 'look',
        click: (g) => {
          if (!g.s.flags.l1_arch_pills) {
            g.flag('l1_arch_pills');
            g.give('pills');
            g.say('你在檔案櫃夾層找到一片鎮定劑與一份標著 #0120 的機密副本。');
          }
          g.read('n_l1_archive');
        },
      },
      {
        id: 'crate', rect: boxRect(archCrate, 8), label: '資料室補給箱', cursor: 'take',
        click: (g) => {
          if (g.s.flags.l1_arch_almond) return g.say('補給箱已經空了。');
          g.flag('l1_arch_almond');
          g.give('almond', '你在角落補給箱裡拿到一瓶乾淨的杏仁水。');
        },
      },
    ],
  },
};
