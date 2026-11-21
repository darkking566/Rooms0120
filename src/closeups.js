// Procedural Close-up CGs ("走過去湊近看"): full-screen 960x540 animated inspections drawn on canvas.
// Every close-up supports subtle camera breathing, optional camcorder viewfinder overlays (`drawView`),
// and optional interactive sub-hotspots (including using inventory items while zoomed in).
import { W, H, CX, CY, clamp } from './render.js';

function vignette(ctx, strength = 0.62) {
  const g = ctx.createRadialGradient(CX, CY, 140, CX, CY, 590);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.65, `rgba(0,0,0,${strength * 0.42})`);
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function wallpaperBg(ctx, base = '#b5a254', stripe = '#9f8c42', damp = 0.25) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = stripe;
  for (let x = -20; x < W + 40; x += 48) {
    ctx.fillRect(x, 0, 14, H);
    ctx.fillRect(x + 22, 0, 4, H);
  }
  // Subtle diamond motif
  ctx.strokeStyle = 'rgba(70,58,20,0.16)';
  ctx.lineWidth = 1.5;
  for (let x = 24; x < W; x += 48) {
    for (let y = 24; y < H; y += 56) {
      ctx.beginPath();
      ctx.moveTo(x, y - 10); ctx.lineTo(x + 7, y); ctx.lineTo(x, y + 10); ctx.lineTo(x - 7, y);
      ctx.closePath(); ctx.stroke();
    }
  }
  if (damp > 0) {
    const g = ctx.createRadialGradient(CX, H * 0.72, 40, CX, H * 0.72, 480);
    g.addColorStop(0, `rgba(42,34,14,${damp})`);
    g.addColorStop(1, 'rgba(30,24,10,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
}

function drawScrew(ctx, x, y, r = 10, angle = 0.4) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#5a564c';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#24211c'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.rotate(angle);
  ctx.strokeStyle = '#1b1814'; ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.moveTo(-r * 0.7, 0); ctx.lineTo(r * 0.7, 0); ctx.stroke();
  ctx.restore();
}

function drawTallyGroup(ctx, x, y, strokes, color, glow = false) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 10; }
  // Standard Chinese 正 (5 strokes): top horiz, mid vert, mid-right horiz, left-low vert, bottom horiz
  const segs = [
    [[0, 0], [52, 0]],
    [[26, 2], [26, 56]],
    [[26, 28], [50, 27]],
    [[10, 22], [10, 56]],
    [[-3, 56], [56, 55]],
  ];
  for (let i = 0; i < Math.min(strokes, 5); i++) {
    const [[x1, y1], [x2, y2]] = segs[i];
    ctx.beginPath();
    ctx.moveTo(x + x1, y + y1);
    ctx.lineTo(x + x2, y + y2);
    ctx.stroke();
  }
  ctx.restore();
}

export const CLOSEUPS = {
  // 1. Level 0 Hallway — Whispering Outlet
  l0_outlet: {
    title: '牆上的插座',
    draw(ctx, t, s) {
      wallpaperBg(ctx, '#b7a454', '#a29044', 0.35);
      // Peeling wallpaper edge
      ctx.fillStyle = '#8b7938';
      ctx.beginPath();
      ctx.moveTo(260, 80); ctx.lineTo(310, 120); ctx.lineTo(290, 210); ctx.lineTo(255, 195);
      ctx.closePath(); ctx.fill();

      if (s.flags.outlet_open) {
        // Open dark cavity in wall
        ctx.fillStyle = '#0e0c08';
        ctx.fillRect(340, 130, 280, 270);
        ctx.strokeStyle = '#5a4e2a'; ctx.lineWidth = 6;
        ctx.strokeRect(340, 130, 280, 270);
        // Empty dust shadow where tape & recorder sat
        ctx.fillStyle = '#1b1812';
        ctx.fillRect(365, 295, 230, 95);
        ctx.fillStyle = 'rgba(200,190,150,0.08)';
        ctx.fillRect(390, 230, 110, 70);
        ctx.fillRect(510, 250, 70, 50);
        // Loose severed wires
        ctx.strokeStyle = '#3c3830'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(350, 190); ctx.quadraticCurveTo(410, 215, 425, 265); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(610, 185); ctx.quadraticCurveTo(560, 210, 545, 245); ctx.stroke();
      } else {
        // Drop shadow behind faceplate
        ctx.fillStyle = 'rgba(0,0,0,0.42)';
        ctx.fillRect(352, 118, 276, 316);
        // Yellowed plastic faceplate
        const g = ctx.createLinearGradient(340, 108, 616, 424);
        g.addColorStop(0, '#d8cfb0'); g.addColorStop(0.5, '#c4b892'); g.addColorStop(1, '#9e916c');
        ctx.fillStyle = g;
        ctx.fillRect(340, 108, 276, 316);
        ctx.strokeStyle = '#73684b'; ctx.lineWidth = 3;
        ctx.strokeRect(340, 108, 276, 316);

        // Two sockets
        for (const sy of [200, 326]) {
          ctx.fillStyle = '#aea37e';
          ctx.beginPath(); ctx.roundRect(410, sy - 44, 140, 88, 12); ctx.fill();
          ctx.strokeStyle = '#6c6248'; ctx.lineWidth = 2; ctx.stroke();
          // Vertical slots + ground
          ctx.fillStyle = '#090806';
          ctx.fillRect(444, sy - 20, 10, 30);
          ctx.fillRect(506, sy - 20, 10, 26);
          ctx.beginPath(); ctx.arc(480, sy + 20, 8, 0, Math.PI * 2); ctx.fill();
        }
        // Top & bottom rusty screws
        drawScrew(ctx, 478, 134, 11, 0.35);
        drawScrew(ctx, 478, 398, 11, -0.7);

        // Subtle whispering soundwave ripples emerging from slots
        for (let i = 0; i < 3; i++) {
          const p = (t * 0.75 + i * 0.33) % 1;
          ctx.strokeStyle = `rgba(240,235,205,${(1 - p) * 0.24})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(480, 263, 25 + p * 170, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      vignette(ctx, 0.65);
    },
    hotspots: [
      {
        id: 'cu_outlet_plate', rect: [335, 105, 290, 325], label: '插座蓋板', cursor: 'look',
        click: (g) => {
          if (g.s.flags.outlet_open) return g.say('牆洞裡空空的。沒有電線，也沒有聲音了。');
          g.say('你把耳朵湊得更近。那個聲音真的跟你一模一樣，正從插孔深處反覆叫著你的名字。蓋板被兩顆螺絲鎖著。');
        },
        use: {
          screwdriver: (g) => {
            if (g.s.flags.outlet_open) return g.say('蓋板已經拆下來了。');
            g.flag('outlet_open'); g.sfx('screw');
            g.give('tape3', '你轉開螺絲，拆下蓋板。牆裡沒有電線——只有一台小小的錄音機，正循環播放著你的聲音。旁邊塞著一卷錄影帶，標籤寫著「#3」。');
          },
        },
      },
    ],
  },

  // 2. Level 0 Hallway — Frozen Cold Vent
  l0_vent: {
    title: '天花板旁的通風格柵',
    draw(ctx, t, s) {
      const thawed = !!s.flags.l03_thawed;
      wallpaperBg(ctx, thawed ? '#b5a254' : '#8ea0ab', thawed ? '#9f8c42' : '#738896', 0.2);

      // Outer metal frame
      ctx.fillStyle = '#1b242a';
      ctx.fillRect(150, 95, 660, 310);
      ctx.fillStyle = thawed ? '#6e6a5c' : '#5f7380';
      ctx.fillRect(162, 107, 636, 286);

      // Deep interior glow (icy blue if frozen)
      const ig = ctx.createRadialGradient(CX, 250, 30, CX, 250, 320);
      ig.addColorStop(0, thawed ? '#12100c' : '#2a5a78');
      ig.addColorStop(1, '#080e14');
      ctx.fillStyle = ig;
      ctx.fillRect(190, 132, 580, 236);

      // Louver slats
      for (let i = 0; i < 8; i++) {
        const y = 142 + i * 28;
        ctx.fillStyle = thawed ? '#4d4a40' : '#4a5d6a';
        ctx.fillRect(188, y, 584, 15);
        ctx.fillStyle = thawed ? '#7c7666' : '#a8cfe6';
        ctx.fillRect(188, y, 584, 3);
      }

      if (!thawed) {
        // Icicles hanging from vent frame
        ctx.fillStyle = 'rgba(210,238,255,0.85)';
        const icicles = [195, 240, 310, 385, 455, 530, 610, 690, 745];
        icicles.forEach((ix, idx) => {
          const len = 26 + (idx * 19) % 48;
          ctx.beginPath();
          ctx.moveTo(ix - 8, 392); ctx.lineTo(ix + 8, 392); ctx.lineTo(ix, 392 + len);
          ctx.closePath(); ctx.fill();
        });
        // Drifting cold mist plumes
        for (let i = 0; i < 10; i++) {
          const p = (t * 0.28 + i * 0.13) % 1;
          const x = 220 + ((i * 73) % 520) + Math.sin(t + i) * 18;
          const y = 180 + p * 280;
          const mg = ctx.createRadialGradient(x, y, 10, x, y, 85 + p * 50);
          mg.addColorStop(0, `rgba(210,240,255,${(1 - p) * 0.28})`);
          mg.addColorStop(1, 'rgba(210,240,255,0)');
          ctx.fillStyle = mg;
          ctx.fillRect(x - 140, y - 140, 280, 280);
        }
      }
      vignette(ctx, 0.58);
    },
  },

  // 3. Level 0 Wet Room — Sagging Wet Ceiling Tile
  l0_wet_tile: {
    title: '下垂的天花板板',
    draw(ctx, t, s) {
      // Ceiling grid looking straight up
      ctx.fillStyle = '#9e9468';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#6c6548'; ctx.lineWidth = 8;
      for (const x of [170, 790]) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (const y of [80, 440]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      if (s.flags.tile_down) {
        // Dark crawlspace hole overhead
        ctx.fillStyle = '#070604';
        ctx.fillRect(174, 84, 612, 352);
        // Exposed beams & pipes inside ceiling
        ctx.fillStyle = '#252118';
        ctx.fillRect(174, 150, 612, 22);
        ctx.fillRect(174, 330, 612, 22);
        ctx.fillStyle = '#3d372c';
        ctx.fillRect(420, 84, 34, 352);
        // Falling water drops from edges
        for (let i = 0; i < 4; i++) {
          const p = (t * 0.9 + i * 0.27) % 1;
          const dx = 250 + i * 155, dy = 110 + p * 340;
          ctx.fillStyle = `rgba(180,205,195,${(1 - p) * 0.7})`;
          ctx.beginPath(); ctx.ellipse(dx, dy, 3, 7, 0, 0, Math.PI * 2); ctx.fill();
        }
      } else {
        // Dark gap along top where tile sags away
        ctx.fillStyle = '#0d0c08';
        ctx.fillRect(174, 84, 612, 352);
        // Glimpse of camcorder edge & glowing green/red LED in the gap
        if (!s.flags.cam_got) {
          ctx.fillStyle = '#2c2e30';
          ctx.fillRect(540, 104, 130, 54);
          ctx.fillStyle = '#181a1c';
          ctx.beginPath(); ctx.arc(572, 130, 18, 0, Math.PI * 2); ctx.fill();
          const blink = Math.sin(t * 4) > 0;
          ctx.fillStyle = blink ? '#ff3a2a' : '#6a1410';
          ctx.beginPath(); ctx.arc(642, 122, 5, 0, Math.PI * 2); ctx.fill();
        }
        // Sagging waterlogged acoustic tile
        const sag = Math.sin(t * 1.4) * 3;
        ctx.fillStyle = '#8b8156';
        ctx.beginPath();
        ctx.moveTo(174, 118);
        ctx.quadraticCurveTo(CX, 165 + sag, 786, 108);
        ctx.lineTo(786, 436);
        ctx.quadraticCurveTo(CX, 466 + sag, 174, 436);
        ctx.closePath(); ctx.fill();

        // Dark damp water stain spreading across tile
        const sg = ctx.createRadialGradient(CX + 20, 290, 20, CX + 20, 290, 260);
        sg.addColorStop(0, 'rgba(35,30,14,0.82)');
        sg.addColorStop(0.65, 'rgba(58,48,22,0.52)');
        sg.addColorStop(1, 'rgba(58,48,22,0)');
        ctx.fillStyle = sg;
        ctx.fillRect(174, 108, 612, 345);

        // Acoustic speckles
        ctx.fillStyle = 'rgba(28,24,10,0.28)';
        for (let i = 0; i < 90; i++) {
          const px = 190 + ((i * 67) % 580), py = 140 + ((i * 43) % 280);
          ctx.fillRect(px, py, 3, 2);
        }
        // Swelling water droplet
        const dp = (t * 0.65) % 1;
        const dr = dp < 0.7 ? 4 + dp * 8 : 6;
        const dy = dp < 0.7 ? 380 + dp * 12 : 388 + ((dp - 0.7) / 0.3) * 140;
        ctx.fillStyle = 'rgba(180,200,180,0.75)';
        ctx.beginPath(); ctx.ellipse(CX + 26, dy, dr * 0.7, dr, 0, 0, Math.PI * 2); ctx.fill();
      }
      vignette(ctx, 0.62);
    },
    hotspots: [
      {
        id: 'cu_wet_tile_area', rect: [174, 84, 612, 352], label: '泡軟的天花板板', cursor: 'look',
        click: (g) => g.say(g.s.flags.tile_down
          ? '天花板上只剩一個黑洞，水滴不斷往下掉。'
          : '板子被水泡得沉甸甸的，縫隙裡隱約露出一個帶紅燈的金屬角。太高了，需要長一點的東西去頂它。'),
        use: {
          rod: (g) => {
            if (g.s.flags.tile_down) return g.say('上面已經什麼都沒有了。');
            g.flag('tile_down'); g.sfx('open');
            if (g.s.flags.cam_got) return g.say('你用吊桿往上一頂——天花板板連同一灘髒水砸了下來。只有水。');
            g.flag('cam_got');
            g.give('camcorder', '你用吊桿往上一頂——天花板板連同一灘髒水砸了下來。水裡躺著一台攝影機，螢幕……還亮著。');
          },
          ladder: (g) => {
            if (!g.s.flags.tile_down) return g.say('板子還在。梯子架上去，頭也只會頂到濕透的板子。');
            g.go('l0_ceiling2', { msg: '你架起梯子，從洞口爬進天花板上方。' });
          },
        },
      },
    ],
  },

  // 4. Level 0 Faded Room — Wall Tally Marks (changes live under Viewfinder!)
  l0_tally: {
    title: '牆上的刻痕',
    draw(ctx, t, s) {
      wallpaperBg(ctx, '#c6be9c', '#b6ae8c', 0.18);
      // Scratches and faded patches
      ctx.fillStyle = 'rgba(240,234,210,0.22)';
      ctx.fillRect(120, 120, 720, 290);

      // Naked-eye tally: 12 strokes (正, 正, 丅)
      const col = s.view ? 'rgba(70,62,48,0.45)' : '#443b2c';
      drawTallyGroup(ctx, 210, 220, 5, col);
      drawTallyGroup(ctx, 315, 220, 5, col);
      drawTallyGroup(ctx, 420, 220, 2, col);

      // Faint fingernail dust beneath
      ctx.fillStyle = 'rgba(80,68,50,0.25)';
      ctx.font = '14px ui-monospace, monospace';
      ctx.fillText('12...', 210, 325);
      vignette(ctx, 0.55);
    },
    drawView(ctx, t) {
      // Through the camcorder lens: the true count (23 = 正正正正下) glows in chalky white!
      const jitter = Math.sin(t * 23) * 0.8;
      const col = 'rgba(230,255,245,0.92)';
      drawTallyGroup(ctx, 210 + jitter, 220, 5, col, true);
      drawTallyGroup(ctx, 315 - jitter, 220, 5, col, true);
      drawTallyGroup(ctx, 420 + jitter, 220, 5, col, true);
      drawTallyGroup(ctx, 525, 220, 5, col, true);
      drawTallyGroup(ctx, 630 + jitter, 220, 3, col, true);
      ctx.save();
      ctx.fillStyle = 'rgba(190,255,220,0.85)';
      ctx.font = '600 18px ui-monospace, monospace';
      ctx.fillText('REAL COUNT: 23', 210, 330);
      ctx.restore();
    },
  },

  // 5. Level 0 Manila Room — Figure in the Corner (J.H.)
  l0_manila_jh: {
    title: '牆角的人',
    draw(ctx, t) {
      // Warm beige Manila Room corner
      ctx.fillStyle = '#c8b896';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b4a380';
      ctx.fillRect(0, 0, CX, H);
      // Corner crease
      ctx.strokeStyle = 'rgba(60,48,30,0.35)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(CX, 0); ctx.lineTo(CX, 430); ctx.stroke();
      // Floor
      ctx.fillStyle = '#8b7b5c';
      ctx.fillRect(0, 420, W, H - 420);

      // Seated figure hunched with knees up
      const breath = Math.sin(t * 1.4) * 3;
      ctx.save();
      ctx.fillStyle = '#2c2824';
      // Coat / hunched shoulders
      ctx.beginPath();
      ctx.moveTo(310, 455);
      ctx.quadraticCurveTo(325, 250 + breath, 470, 235 + breath);
      ctx.quadraticCurveTo(615, 245 + breath, 645, 455);
      ctx.closePath(); ctx.fill();
      // Knees drawn up
      ctx.fillStyle = '#221f1c';
      ctx.beginPath();
      ctx.ellipse(425, 385, 75, 95, -0.18, 0, Math.PI * 2);
      ctx.ellipse(545, 390, 72, 90, 0.2, 0, Math.PI * 2);
      ctx.fill();
      // Folded arms resting on knees
      ctx.fillStyle = '#38332d';
      ctx.beginPath(); ctx.roundRect(380, 335 + breath, 200, 42, 18); ctx.fill();

      // Head — deliberately out-of-focus / film-blur jitter
      for (let i = 0; i < 4; i++) {
        const ox = Math.sin(t * 3.1 + i * 1.9) * 4;
        const oy = Math.cos(t * 2.4 + i * 1.3) * 3;
        ctx.fillStyle = `rgba(195,180,158,${0.28 - i * 0.05})`;
        ctx.beginPath(); ctx.ellipse(480 + ox, 195 + breath + oy, 54 + i * 4, 64 + i * 4, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#1f1b18';
      ctx.beginPath(); ctx.ellipse(480, 170 + breath, 56, 36, 0, Math.PI, Math.PI * 2); ctx.fill();
      // Blurred non-face shadow
      ctx.fillStyle = 'rgba(20,16,12,0.55)';
      ctx.beginPath(); ctx.ellipse(480, 204 + breath, 36, 32, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // Scattered notes beside him
      ctx.fillStyle = '#e9e0c4';
      ctx.save(); ctx.translate(230, 430); ctx.rotate(-0.18); ctx.fillRect(0, 0, 76, 52); ctx.restore();
      ctx.save(); ctx.translate(675, 438); ctx.rotate(0.24); ctx.fillRect(0, 0, 68, 46); ctx.restore();
      vignette(ctx, 0.58);
    },
    drawView(ctx, t) {
      // Through viewfinder: focus tries to lock onto his face and fails
      const bx = 420 + Math.sin(t * 9) * 3, by = 135 + Math.cos(t * 7) * 2;
      ctx.save();
      ctx.strokeStyle = 'rgba(180,255,210,0.85)'; ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, 120, 130);
      ctx.fillStyle = 'rgba(180,255,210,0.85)';
      ctx.font = '13px ui-monospace, monospace';
      ctx.fillText('AF: ERR  [SUBJECT 0120]', bx - 16, by - 10);
      ctx.restore();
    },
  },

  // 6. Level 0 Archive — Empty Drawer 0120
  l0_drawer0120: {
    title: '0120 號抽屜',
    draw(ctx, t) {
      // Dark steel cabinet top-down perspective looking into open drawer
      ctx.fillStyle = '#252724';
      ctx.fillRect(0, 0, W, H);
      // Outer drawer rails
      ctx.fillStyle = '#555852';
      ctx.fillRect(130, 45, 700, 435);
      // Inner drawer cavity
      ctx.fillStyle = '#181a17';
      ctx.fillRect(160, 65, 640, 355);

      // Dust coating inside drawer with a clean rectangular camcorder-shaped outline!
      ctx.fillStyle = 'rgba(180,175,155,0.14)';
      ctx.fillRect(160, 65, 640, 355);
      ctx.fillStyle = '#11120f';
      ctx.fillRect(340, 155, 280, 165);
      ctx.strokeStyle = 'rgba(220,215,190,0.22)';
      ctx.setLineDash([6, 6]); ctx.lineWidth = 2;
      ctx.strokeRect(340, 155, 280, 165);
      ctx.setLineDash([]);

      // Front face of the drawer with brass label holder
      ctx.fillStyle = '#6c7068';
      ctx.fillRect(130, 415, 700, 75);
      // Brass label frame
      ctx.fillStyle = '#b49852';
      ctx.fillRect(390, 428, 180, 48);
      ctx.fillStyle = '#ede4c8';
      ctx.fillRect(402, 436, 156, 32);
      // Freshly written "0120"
      ctx.fillStyle = '#141414';
      ctx.font = '700 24px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('0120', CX, 461);
      ctx.textAlign = 'left';

      // Subtle sheen on wet ink
      ctx.fillStyle = `rgba(255,255,255,${0.12 + 0.08 * Math.sin(t * 2.5)})`;
      ctx.fillRect(445, 442, 70, 5);
      vignette(ctx, 0.62);
    },
    hotspots: [
      {
        id: 'cu_drawer_slot', rect: [300, 130, 360, 220], label: '空抽屜裡的長方形印子', cursor: 'look',
        click: (g) => g.say('灰塵裡留著一個長方形的印子，大小剛好是一台攝影機。標籤上的墨水還沒全乾。'),
        use: {
          camcorder: (g) => {
            g.take('camcorder');
            g.end('archive');
          },
        },
      },
    ],
  },

  // 7. Level 0 Red Rooms — Breathing Flesh Wall & Cyst
  l0_red_flesh: {
    title: '肉牆中間的菌囊',
    draw(ctx, t, s) {
      const pulse = Math.sin(t * 2.8);
      // Wet crimson organic wall
      const bg = ctx.createRadialGradient(CX, CY, 40, CX, CY, 540);
      bg.addColorStop(0, '#6a1414');
      bg.addColorStop(0.6, '#3c0909');
      bg.addColorStop(1, '#180303');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Pulsing veins radiating across the wall
      ctx.strokeStyle = 'rgba(155,26,26,0.55)';
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        ctx.lineWidth = 2.5 + (i % 3);
        ctx.beginPath();
        ctx.moveTo(CX, CY);
        ctx.quadraticCurveTo(
          CX + Math.cos(a + 0.25) * (190 + pulse * 10),
          CY + Math.sin(a + 0.25) * (140 + pulse * 8),
          CX + Math.cos(a) * 520,
          CY + Math.sin(a) * 340
        );
        ctx.stroke();
      }

      if (s.flags.red_core_looted) {
        // Slit open empty sac
        ctx.fillStyle = '#1b0404';
        ctx.beginPath(); ctx.ellipse(CX, CY, 92, 42, 0.1, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#9b2222'; ctx.lineWidth = 5; ctx.stroke();
      } else {
        // Swollen translucent cyst
        const rx = 115 + pulse * 7, ry = 88 + pulse * 5;
        const cg = ctx.createRadialGradient(CX - 25, CY - 20, 12, CX, CY, rx);
        cg.addColorStop(0, 'rgba(215,85,70,0.85)');
        cg.addColorStop(0.7, 'rgba(135,22,22,0.92)');
        cg.addColorStop(1, 'rgba(65,8,8,0.95)');
        ctx.fillStyle = cg;
        ctx.beginPath(); ctx.ellipse(CX, CY, rx, ry, 0, 0, Math.PI * 2); ctx.fill();

        // Folded notebook silhouette trapped inside
        ctx.save();
        ctx.translate(CX, CY + pulse * 2);
        ctx.rotate(-0.14);
        ctx.fillStyle = 'rgba(235,220,185,0.42)';
        ctx.fillRect(-46, -32, 92, 64);
        ctx.strokeStyle = 'rgba(255,240,210,0.35)'; ctx.lineWidth = 2;
        ctx.strokeRect(-46, -32, 92, 64);
        ctx.restore();

        // Wet specular highlight
        ctx.fillStyle = 'rgba(255,190,180,0.22)';
        ctx.beginPath(); ctx.ellipse(CX - 42, CY - 32, 30, 14, -0.4, 0, Math.PI * 2); ctx.fill();
      }
      vignette(ctx, 0.72);
    },
    hotspots: [
      {
        id: 'cu_red_cyst', rect: [350, 175, 260, 190], label: '鼓起的暗紅菌囊', cursor: 'look',
        click: (g) => g.say(g.s.flags.red_core_looted
          ? '菌囊已經被劃開了，裡面的筆記已經拿走。'
          : '半透明的膜底下裹著一本對折的筆記本。你的手指一靠近，整面肉牆就跟著收縮了一下。得用利器劃開它。'),
        use: {
          knife: (g) => {
            if (g.s.flags.red_core_looted) return g.say('已經劃開了。');
            g.flag('red_core_looted'); g.sfx('steam');
            g.read('n_red_truth', () => g.say('紙上的字有一半被泡爛了。你把它塞進口袋。肉牆的起伏慢了下來——像是在等你。'));
          },
        },
      },
    ],
  },

  // 8. Level 1 Construction Works — Gap in the Brick Wall Peeking into Level 0
  l1_works_gap: {
    title: '磚縫',
    draw(ctx, t) {
      // Through the brick gap: bright fluorescent Level 0 yellow corridor!
      const humFlick = 0.92 + 0.08 * Math.sin(t * 17);
      ctx.fillStyle = `rgb(${215 * humFlick | 0},${196 * humFlick | 0},${104 * humFlick | 0})`;
      ctx.fillRect(230, 150, 500, 240);
      // Perspective Level 0 carpet & wall lines seen through the gap
      ctx.fillStyle = '#8b793c';
      ctx.beginPath(); ctx.moveTo(230, 390); ctx.lineTo(420, 295); ctx.lineTo(540, 295); ctx.lineTo(730, 390); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff5c8';
      ctx.fillRect(435, 185, 90, 12);
      ctx.fillRect(455, 225, 50, 8);
      // Distant silhouette in the yellow corridor
      ctx.fillStyle = 'rgba(30,26,12,0.55)';
      ctx.fillRect(472, 246, 16, 48);
      ctx.beginPath(); ctx.arc(480, 240, 7, 0, Math.PI * 2); ctx.fill();

      // Foreground: rough concrete bricks framing the narrow rectangular gap
      ctx.fillStyle = '#3a342e';
      // Top, bottom, left, right brick wall mask
      ctx.fillRect(0, 0, W, 175);
      ctx.fillRect(0, 355, W, H - 355);
      ctx.fillRect(0, 175, 255, 180);
      ctx.fillRect(705, 175, W - 705, 180);

      // Brick course lines & mortar
      const brickH = 58, brickW = 148;
      for (let row = 0; row < 10; row++) {
        const y = row * brickH;
        const off = (row % 2) * (brickW / 2);
        for (let col = -1; col < 8; col++) {
          const x = col * brickW + off;
          // Skip the center gap area
          if (y + brickH > 175 && y < 355 && x + brickW > 255 && x < 705) continue;
          ctx.fillStyle = (row + col) % 3 === 0 ? '#5c4b40' : '#4f4238';
          ctx.fillRect(x + 4, y + 4, brickW - 8, brickH - 8);
        }
      }
      // Wet mortar smear along gap edge
      ctx.strokeStyle = '#7c766a'; ctx.lineWidth = 10;
      ctx.strokeRect(255, 175, 450, 180);

      // Worker's trowel slowly sliding wet cement from the right
      const slide = Math.sin(t * 0.9) * 18;
      ctx.fillStyle = '#6d695f';
      ctx.beginPath();
      ctx.moveTo(710, 290); ctx.lineTo(635 + slide, 310); ctx.lineTo(665 + slide, 342); ctx.lineTo(720, 330);
      ctx.closePath(); ctx.fill();
      vignette(ctx, 0.7);
    },
    drawView(ctx) {
      // Through viewfinder: faceless worker standing right on the other side staring directly through the gap!
      ctx.save();
      ctx.fillStyle = 'rgba(20,25,22,0.88)';
      ctx.beginPath(); ctx.ellipse(CX, 265, 58, 72, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(180,255,210,0.75)';
      ctx.font = '13px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NO FACE DETECTED', CX, 344);
      ctx.textAlign = 'left';
      ctx.restore();
    },
  },

  // 9. Level 1 Infirmary — Coat Under the Hospital Sheet
  l1_infirmary_sheet: {
    title: '掀開的床單',
    draw(ctx, t) {
      // Sterile pale-green hospital mattress & rumpled white sheet
      ctx.fillStyle = '#747e78';
      ctx.fillRect(0, 0, W, H);
      // Mattress ticking stripes
      ctx.fillStyle = 'rgba(220,230,225,0.22)';
      for (let x = 0; x < W; x += 36) ctx.fillRect(x, 0, 14, H);

      // Folded-back white sheet on the right side
      ctx.fillStyle = '#dfe4dc';
      ctx.beginPath();
      ctx.moveTo(640, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H); ctx.lineTo(570, H);
      ctx.quadraticCurveTo(605, CY, 640, 0);
      ctx.closePath(); ctx.fill();

      // An empty jacket arranged in the shape of a lying person — identical to yours!
      const sway = Math.sin(t * 1.1) * 1.5;
      ctx.fillStyle = '#2d3338';
      ctx.beginPath();
      ctx.moveTo(260, 150 + sway);
      ctx.lineTo(540, 145 + sway);
      ctx.lineTo(585, 445);
      ctx.lineTo(220, 445);
      ctx.closePath(); ctx.fill();
      // Collar
      ctx.fillStyle = '#1b1f22';
      ctx.beginPath(); ctx.moveTo(355, 145); ctx.lineTo(400, 210); ctx.lineTo(445, 145); ctx.closePath(); ctx.fill();
      // Center seam + buttons (one missing with loose thread!)
      ctx.strokeStyle = '#191d20'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(400, 208); ctx.lineTo(400, 442); ctx.stroke();
      for (const [by, missing] of [[245, false], [305, true], [365, false], [415, false]]) {
        if (missing) {
          // Loose dark thread where the button fell off
          ctx.strokeStyle = '#9aa0a4'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(414, by - 5); ctx.lineTo(426, by + 6); ctx.moveTo(424, by - 4); ctx.lineTo(412, by + 7); ctx.stroke();
        } else {
          ctx.fillStyle = '#141618';
          ctx.beginPath(); ctx.arc(418, by, 7, 0, Math.PI * 2); ctx.fill();
        }
      }
      vignette(ctx, 0.58);
    },
  },

  // 10. Level 1 Outpost — M.E.G. Field Radio
  l1_outpost_radio: {
    title: 'M.E.G. 無線電',
    draw(ctx, t) {
      // Dark wooden table & gritty concrete wall behind
      ctx.fillStyle = '#262824';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#4a3d2e';
      ctx.fillRect(0, 410, W, H - 410);

      // Heavy military radio chassis
      ctx.fillStyle = '#383d36';
      ctx.fillRect(150, 95, 660, 340);
      ctx.strokeStyle = '#1d201c'; ctx.lineWidth = 6;
      ctx.strokeRect(150, 95, 660, 340);

      // Left speaker grille
      ctx.fillStyle = '#1a1d19';
      ctx.fillRect(185, 130, 250, 265);
      ctx.fillStyle = '#2c312b';
      for (let y = 144; y < 385; y += 14) ctx.fillRect(195, y, 230, 5);

      // Frequency dial glass (backlit amber-green)
      ctx.fillStyle = '#172619';
      ctx.fillRect(465, 135, 310, 110);
      ctx.strokeStyle = '#556858'; ctx.lineWidth = 3;
      ctx.strokeRect(465, 135, 310, 110);
      // Scale ticks
      ctx.strokeStyle = 'rgba(180,235,175,0.65)'; ctx.lineWidth = 1.5;
      for (let x = 485; x <= 755; x += 18) {
        const tall = (x - 485) % 54 === 0;
        ctx.beginPath(); ctx.moveTo(x, 195); ctx.lineTo(x, tall ? 168 : 180); ctx.stroke();
      }
      // Trembling red frequency needle
      const nx = 612 + Math.sin(t * 14) * 3 + Math.sin(t * 2.3) * 10;
      ctx.strokeStyle = '#ff4b3a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(nx, 140); ctx.lineTo(nx, 240); ctx.stroke();

      // Digital/stamped frequency & blinking TX light
      ctx.fillStyle = '#a8f0a8';
      ctx.font = '600 18px ui-monospace, monospace';
      ctx.fillText('CH 01.20 MHz', 485, 228);

      const ledOn = Math.sin(t * 5) > -0.2;
      ctx.save();
      if (ledOn) { ctx.shadowColor = '#ff3828'; ctx.shadowBlur = 18; }
      ctx.fillStyle = ledOn ? '#ff4232' : '#5a1612';
      ctx.beginPath(); ctx.arc(746, 222, 8, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // Control knobs
      for (const kx of [520, 620, 720]) {
        ctx.fillStyle = '#1f221e';
        ctx.beginPath(); ctx.arc(kx, 330, 34, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#6b7268'; ctx.lineWidth = 2; ctx.stroke();
        ctx.strokeStyle = '#dce2d8'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(kx, 330); ctx.lineTo(kx + 16, 308); ctx.stroke();
      }

      // Live static waveform across speaker
      ctx.strokeStyle = 'rgba(170,245,180,0.45)'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 195; x <= 425; x += 6) {
        const amp = Math.sin(t * 19 + x * 0.14) * 14 * Math.sin(t * 3.1);
        const y = 262 + amp;
        if (x === 195) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      vignette(ctx, 0.62);
    },
  },

  // 11. Level 1 Garden — The Person Overgrown with Vines
  l1_garden_man: {
    title: '坐在藤蔓裡的人',
    draw(ctx, t, s) {
      // Misty mossy greenhouse backdrop
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#1e2c1c'); bg.addColorStop(1, '#0e170d');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Concrete pillar behind him
      ctx.fillStyle = '#3c4438';
      ctx.fillRect(260, 0, 440, H);

      // Slow breathing torso
      const breath = Math.sin(t * 0.9) * 4;
      ctx.fillStyle = '#252c22';
      ctx.beginPath();
      ctx.moveTo(270, H); ctx.quadraticCurveTo(300, 320 + breath, CX, 305 + breath);
      ctx.quadraticCurveTo(660, 320 + breath, 690, H);
      ctx.closePath(); ctx.fill();

      // Head tilted gently against pillar
      ctx.fillStyle = '#a89f8e';
      ctx.beginPath(); ctx.ellipse(CX, 225 + breath, 74, 92, 0.06, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#24221d';
      ctx.beginPath(); ctx.ellipse(CX, 165 + breath, 78, 48, 0.06, Math.PI, Math.PI * 2); ctx.fill();

      // Closed flower buds where the eyes are (naked eye)
      if (!s.view) {
        for (const ex of [CX - 28, CX + 28]) {
          ctx.fillStyle = '#d4b4c6';
          ctx.beginPath(); ctx.ellipse(ex, 222 + breath, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#3f6a32'; ctx.lineWidth = 2; ctx.stroke();
        }
      }

      // Small white flower hanging from corner of mouth
      const sway = Math.sin(t * 1.6) * 3;
      ctx.strokeStyle = '#4c7a3c'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(CX + 18, 272 + breath); ctx.quadraticCurveTo(CX + 46, 286 + breath, CX + 62 + sway, 312 + breath); ctx.stroke();
      ctx.fillStyle = '#f2edf0';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath(); ctx.arc(CX + 62 + sway + Math.cos(a) * 8, 312 + breath + Math.sin(a) * 8, 5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#e5cf68';
      ctx.beginPath(); ctx.arc(CX + 62 + sway, 312 + breath, 4, 0, Math.PI * 2); ctx.fill();

      // Creeping vines wrapping collar, cheek & shoulders
      ctx.strokeStyle = '#38622c'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        const x0 = 280 + i * 80;
        ctx.beginPath();
        ctx.moveTo(x0, H);
        ctx.quadraticCurveTo(x0 + Math.sin(t + i) * 14, 340, CX + (i - 2.5) * 38, 170 + (i % 3) * 45 + breath);
        ctx.stroke();
      }
      vignette(ctx, 0.65);
    },
    drawView(ctx, t) {
      // Through the viewfinder: his eyes are wide open, staring straight at you
      const breath = Math.sin(t * 0.9) * 4;
      for (const ex of [CX - 28, CX + 28]) {
        ctx.fillStyle = '#e8f5ec';
        ctx.beginPath(); ctx.ellipse(ex, 222 + breath, 15, 9, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#090f0a';
        ctx.beginPath(); ctx.arc(ex, 222 + breath, 5, 0, Math.PI * 2); ctx.fill();
      }
    },
  },

  // 12. Level 2 Camp — Chalkboard & Claw Marks
  l2_camp_board: {
    title: '收容營黑板',
    draw(ctx) {
      // Concrete wall
      ctx.fillStyle = '#4c4a44';
      ctx.fillRect(0, 0, W, H);
      // Wooden frame
      ctx.fillStyle = '#5c452d';
      ctx.fillRect(85, 55, 790, 405);
      // Dusty dark green chalkboard
      ctx.fillStyle = '#202b25';
      ctx.fillRect(105, 75, 750, 365);

      // Erased chalk smudges
      ctx.fillStyle = 'rgba(220,230,220,0.06)';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath(); ctx.ellipse(220 + i * 110, 190 + (i % 2) * 90, 90, 42, 0.2, 0, Math.PI * 2); ctx.fill();
      }

      // Chalk rules
      ctx.fillStyle = '#dce2d6';
      ctx.font = '600 32px sans-serif';
      ctx.fillText('新來的人：', 155, 145);
      ctx.font = '28px sans-serif';
      ctx.fillText('1. 先喝水', 180, 205);
      ctx.fillText('2. 再登記', 180, 255);
      ctx.fillStyle = '#f2ded4';
      ctx.fillText('3. 別靠近窗戶', 180, 310);
      // Frantic multiple underlines under rule 3
      ctx.strokeStyle = 'rgba(242,222,212,0.85)'; ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(175, 322 + i * 7); ctx.lineTo(395 + i * 6, 320 + i * 7); ctx.stroke();
      }

      // Small trembling note in the bottom-right corner
      ctx.fillStyle = 'rgba(220,224,210,0.72)';
      ctx.font = '18px ui-monospace, monospace';
      ctx.fillText('2013 —— 狗來了。', 585, 408);

      // Four deep claw gashes diagonally across upper right of the board
      ctx.strokeStyle = '#0e1310'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(640 + i * 26, 92 + i * 10);
        ctx.lineTo(545 + i * 26, 265 + i * 12);
        ctx.stroke();
      }
      vignette(ctx, 0.55);
    },
  },

  // 13. Level 2 Boiler Room — Leaking Steam Valve Wheel
  l2_boiler_wheel: {
    title: '漏氣的閥門轉輪',
    draw(ctx, t, s) {
      const off = !!s.flags.l2_steam_off;
      // Hot furnace-lit metal background
      const bg = ctx.createRadialGradient(180, CY, 40, CX, CY, 620);
      bg.addColorStop(0, '#5a2212'); bg.addColorStop(1, '#180c08');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Thick horizontal pipe & flange
      ctx.fillStyle = '#4e392d';
      ctx.fillRect(0, 210, W, 120);
      ctx.fillStyle = '#36261e';
      ctx.fillRect(0, 295, W, 35);
      ctx.fillStyle = '#6b4f3d';
      ctx.fillRect(365, 188, 28, 164);
      ctx.fillRect(567, 188, 28, 164);

      // Pressure gauge vibrating in red zone
      ctx.fillStyle = '#2a221c';
      ctx.beginPath(); ctx.arc(215, 165, 58, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8dfc4';
      ctx.beginPath(); ctx.arc(215, 165, 48, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c82820'; ctx.lineWidth = 10;
      ctx.beginPath(); ctx.arc(215, 165, 38, -0.4, 0.8); ctx.stroke();
      const needleAng = off ? -2.2 : (0.35 + Math.sin(t * 28) * 0.14);
      ctx.strokeStyle = '#181410'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(215, 165); ctx.lineTo(215 + Math.cos(needleAng) * 38, 165 + Math.sin(needleAng) * 38); ctx.stroke();

      // Big rusted red valve wheel
      ctx.save();
      ctx.translate(CX, CY);
      ctx.rotate(off ? 1.2 : Math.sin(t * 22) * 0.015);
      ctx.strokeStyle = '#a82b1e'; ctx.lineWidth = 22;
      ctx.beginPath(); ctx.arc(0, 0, 125, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#7c1c14'; ctx.lineWidth = 14;
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * -120, Math.sin(a) * -120); ctx.lineTo(Math.cos(a) * 120, Math.sin(a) * 120); ctx.stroke();
      }
      ctx.fillStyle = '#5a1812';
      ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // High-pressure scalding white steam jet blasting from flange
      if (!off) {
        for (let i = 0; i < 16; i++) {
          const p = (t * 2.4 + i * 0.11) % 1;
          const sx = 595 + p * 360;
          const sy = 250 + (Math.sin(i * 3.7) * 45) * p;
          const r = 18 + p * 72;
          const sg = ctx.createRadialGradient(sx, sy, 4, sx, sy, r);
          sg.addColorStop(0, `rgba(255,250,240,${(1 - p) * 0.65})`);
          sg.addColorStop(1, 'rgba(255,250,240,0)');
          ctx.fillStyle = sg;
          ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
        }
      }
      vignette(ctx, 0.58);
    },
    hotspots: [
      {
        id: 'cu_boiler_wheel_btn', rect: [345, 135, 270, 270], label: '灼熱的閥門轉輪', cursor: 'look',
        click: (g) => {
          if (g.s.flags.l2_steam_off) return g.say('轉輪已經鎖緊了，蒸汽停了下來。');
          g.sanity(-4); g.sfx('steam');
          g.say('轉輪燙得像烙鐵，而且完全鏽死了。需要重一點的工具來施力。');
        },
        use: {
          wrench: (g) => {
            if (g.s.flags.l2_steam_off) return g.say('已經轉緊了。');
            g.take('wrench'); g.flag('l2_steam_off'); g.sfx('screw');
            g.say('你把扳手卡進輪輻，整個人掛上去。轉輪發出一聲尖叫，轉動了。蒸汽一點一點變細，最後停了。');
          },
        },
      },
    ],
  },

  // 14. Level 2 Narrow Brick Corridor — The Bright Window (cinematic walk-up -> hand slams glass -> scare!)
  l2_narrow_window: {
    title: '盡頭的窗戶',
    locked: true,
    draw(ctx, t, s, ct) {
      // Dark brick frame closing in
      ctx.fillStyle = '#141110';
      ctx.fillRect(0, 0, W, H);
      // Blinding pale-white false daylight outside the window
      const glow = 0.85 + 0.15 * Math.sin(t * 9);
      const wg = ctx.createRadialGradient(CX, CY, 30, CX, CY, 360);
      wg.addColorStop(0, `rgba(248,252,255,${glow})`);
      wg.addColorStop(0.7, `rgba(205,222,240,${glow * 0.85})`);
      wg.addColorStop(1, 'rgba(90,105,120,0.4)');
      ctx.fillStyle = wg;
      ctx.fillRect(210, 45, 540, 450);

      // Subtle silhouette of a face & elongated hand emerging as ct approaches 0.6s..1.2s
      const p = clamp((ct - 0.35) / 0.75, 0, 1);
      if (p > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(12,14,18,${p * 0.85})`;
        // Tall distorted head pressed against glass
        ctx.beginPath();
        ctx.ellipse(CX, 225 - (1 - p) * 20, 68 * (0.8 + p * 0.25), 96 * (0.8 + p * 0.25), 0, 0, Math.PI * 2);
        ctx.fill();
        // Long splayed fingers slamming onto the glass pane
        if (ct > 0.65) {
          const hp = clamp((ct - 0.65) / 0.25, 0, 1);
          ctx.translate(615, 295);
          ctx.scale(0.85 + hp * 0.2, 0.85 + hp * 0.2);
          ctx.beginPath(); ctx.ellipse(0, 22, 28, 36, -0.15, 0, Math.PI * 2); ctx.fill();
          for (const [fx, fy] of [[-28, -58], [-10, -76], [10, -78], [28, -62], [44, -20]]) {
            ctx.strokeStyle = `rgba(12,14,18,${hp * 0.92})`; ctx.lineWidth = 11; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(fx, fy); ctx.stroke();
          }
        }
        ctx.restore();
      }

      // Heavy window mullions
      ctx.fillStyle = '#252322';
      ctx.fillRect(200, 35, 560, 18);
      ctx.fillRect(200, 485, 560, 18);
      ctx.fillRect(200, 35, 18, 468);
      ctx.fillRect(742, 35, 18, 468);
      ctx.fillRect(CX - 9, 35, 18, 468);
      ctx.fillRect(200, CY - 9, 560, 18);
      vignette(ctx, 0.52);
    },
    update(g, dt, ct) {
      if (ct >= 1.15) {
        g.scare('l2_rail', '你越走越近。窗外的光越來越像一張臉——一隻細長的手猛地貼上玻璃。你轉身就逃，背後傳來指甲刮過玻璃的聲音。', 15, 'figure');
      }
    },
  },

  // 15. Level 2 Monitor Room — Wall of CRT Screens (with LIVE view of your own back!)
  l2_monitor_screens: {
    title: '監視器牆',
    draw(ctx, t, s) {
      ctx.fillStyle = '#101412';
      ctx.fillRect(0, 0, W, H);
      const titles = [
        'LEVEL 0・大廳', 'LEVEL 0・濕透的房間', 'LEVEL 0・馬尼拉房間',
        'LEVEL 1・倉庫', 'LEVEL 1・霧中', 'LEVEL 2・管線通道',
        'LEVEL 2・鍋爐間', 'CAM-08 [LIVE]',
      ];
      const cols = 4, rows = 2, sw = 205, sh = 185, gap = 20;
      const startX = (W - (cols * sw + (cols - 1) * gap)) / 2;
      const startY = 58;

      for (let i = 0; i < 8; i++) {
        const c = i % cols, r = Math.floor(i / cols);
        const x = startX + c * (sw + gap), y = startY + r * (sh + gap);
        // Monitor casing
        ctx.fillStyle = '#252926';
        ctx.fillRect(x - 6, y - 6, sw + 12, sh + 12);
        // Phosphor green CRT glass
        ctx.fillStyle = '#09160d';
        ctx.fillRect(x, y, sw, sh);

        ctx.save();
        ctx.beginPath(); ctx.rect(x, y, sw, sh); ctx.clip();
        const flick = 0.08 + 0.04 * Math.sin(t * 4.5 + i * 1.7);
        ctx.fillStyle = `rgba(110,220,140,${flick})`;
        ctx.fillRect(x, y, sw, sh);

        if (i === 7) {
          // Bottom-right LIVE monitor: shows YOU from behind, slowly raising a hand!
          const lift = Math.max(0, Math.sin(t * 0.9)) * 28;
          ctx.fillStyle = '#2d6840';
          // Desk silhouette
          ctx.fillRect(x + 20, y + 135, sw - 40, 50);
          // Your back & head
          ctx.fillStyle = '#489862';
          ctx.beginPath(); ctx.arc(x + sw / 2, y + 78, 22, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.roundRect(x + sw / 2 - 36, y + 102, 72, 65, 16); ctx.fill();
          // Slowly raising right arm
          ctx.strokeStyle = '#489862'; ctx.lineWidth = 14; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x + sw / 2 + 28, y + 118); ctx.lineTo(x + sw / 2 + 52, y + 92 - lift); ctx.stroke();

          ctx.fillStyle = (Math.floor(t * 2) % 2) ? '#ff4a4a' : '#801c1c';
          ctx.beginPath(); ctx.arc(x + 18, y + 18, 5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ff6b6b';
          ctx.font = '700 12px ui-monospace, monospace';
          ctx.fillText('LIVE', x + 28, y + 22);
        } else {
          // Wireframe perspective of empty rooms
          ctx.strokeStyle = 'rgba(120,225,150,0.38)'; ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 48, y + 48, sw - 96, sh - 96);
          ctx.beginPath();
          ctx.moveTo(x, y); ctx.lineTo(x + 48, y + 48);
          ctx.moveTo(x + sw, y); ctx.lineTo(x + sw - 48, y + 48);
          ctx.moveTo(x, y + sh); ctx.lineTo(x + 48, y + sh - 48);
          ctx.moveTo(x + sw, y + sh); ctx.lineTo(x + sw - 48, y + sh - 48);
          ctx.stroke();
        }

        // Scanlines
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        for (let sy = y; sy < y + sh; sy += 3) ctx.fillRect(x, sy, sw, 1);
        // Label
        ctx.fillStyle = '#a4f0b8';
        ctx.font = '11px ui-monospace, monospace';
        ctx.fillText(titles[i], x + 8, y + sh - 8);
        ctx.restore();
      }
      vignette(ctx, 0.5);
    },
  },

  // =========================================================================
  // BATCH 2 — Sublevels (0.1, 0.3, 0.4, 0.5, 0.7) & Level C-1 Series (16 CGs)
  // =========================================================================

  // 16. Level 0.1 Airlock — Zenith Maintenance Robot
  l01_robot: {
    title: '清潔機器人',
    draw(ctx, t) {
      // Sterile glossy station floor tiles
      ctx.fillStyle = '#c8d2d8';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(70,92,108,0.28)'; ctx.lineWidth = 2;
      for (let x = 0; x < W; x += 120) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 108) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Wet reflective swipe trail where you stood
      ctx.fillStyle = 'rgba(255,255,255,0.34)';
      ctx.beginPath(); ctx.ellipse(CX, CY + 45, 290, 95, -0.08, 0, Math.PI * 2); ctx.fill();

      // Gliding disc robot
      const gx = CX + Math.sin(t * 1.1) * 58;
      const gy = CY + Math.cos(t * 1.1) * 14;
      // Soft shadow & blue UV scanning ring
      ctx.fillStyle = 'rgba(12,24,36,0.38)';
      ctx.beginPath(); ctx.ellipse(gx, gy + 26, 175, 118, 0, 0, Math.PI * 2); ctx.fill();
      const uv = ctx.createRadialGradient(gx, gy, 130, gx, gy, 215);
      uv.addColorStop(0, 'rgba(65,195,255,0.42)');
      uv.addColorStop(1, 'rgba(65,195,255,0)');
      ctx.fillStyle = uv;
      ctx.beginPath(); ctx.arc(gx, gy, 215, 0, Math.PI * 2); ctx.fill();

      // White ceramic-metal shell
      const sh = ctx.createRadialGradient(gx - 40, gy - 45, 20, gx, gy, 175);
      sh.addColorStop(0, '#f4f8fa'); sh.addColorStop(0.7, '#cfd9e0'); sh.addColorStop(1, '#8b9ba6');
      ctx.fillStyle = sh;
      ctx.beginPath(); ctx.ellipse(gx, gy, 168, 112, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#536470'; ctx.lineWidth = 4; ctx.stroke();

      // Sensor ring & pulsing cyan status LED
      ctx.strokeStyle = '#3ab8e8'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(gx, gy - 6, 112, 72, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#20303b';
      ctx.beginPath(); ctx.arc(gx, gy - 22, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = Math.sin(t * 4) > 0 ? '#5cf0ff' : '#1b7a8c';
      ctx.beginPath(); ctx.arc(gx, gy - 22, 9, 0, Math.PI * 2); ctx.fill();

      // Stenciled ID on chassis
      ctx.fillStyle = '#2e3e4a';
      ctx.font = '700 17px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ZENITH・維護 07', gx, gy + 38);
      ctx.textAlign = 'left';
      vignette(ctx, 0.48);
    },
  },

  // 17. Level 0.1 Galley — The Seventh Blank Tray
  l01_tray: {
    title: '第七個餐盤',
    draw(ctx, t) {
      // Brushed stainless steel galley counter
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#727e86'); bg.addColorStop(0.5, '#95a2aa'); bg.addColorStop(1, '#58646c');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Edge of tray #6 on the far left (with a printed crew name)
      ctx.fillStyle = '#dce4e8';
      ctx.beginPath(); ctx.roundRect(-140, 125, 240, 290, 18); ctx.fill();
      ctx.fillStyle = '#2c3b46'; ctx.font = '600 15px ui-monospace, monospace';
      ctx.fillText('CREW #06', 18, 392);

      // Tray #7 centered
      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      ctx.beginPath(); ctx.roundRect(198, 102, 574, 346, 22); ctx.fill();
      ctx.fillStyle = '#e8eef2';
      ctx.beginPath(); ctx.roundRect(190, 94, 574, 346, 22); ctx.fill();
      ctx.strokeStyle = '#9aa8b2'; ctx.lineWidth = 4; ctx.stroke();

      // Molded compartments
      ctx.fillStyle = '#d4dde3';
      ctx.beginPath(); ctx.roundRect(225, 126, 310, 190, 12); ctx.fill();
      ctx.beginPath(); ctx.roundRect(558, 126, 170, 120, 12); ctx.fill();
      ctx.beginPath(); ctx.roundRect(558, 262, 170, 54, 10); ctx.fill();

      // Fresh warm nutrient block & steam wisps
      ctx.fillStyle = '#c8b68a';
      ctx.beginPath(); ctx.roundRect(255, 158, 245, 126, 8); ctx.fill();
      for (let i = 0; i < 4; i++) {
        const p = (t * 0.5 + i * 0.25) % 1;
        ctx.strokeStyle = `rgba(255,255,255,${(1 - p) * 0.26})`; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(295 + i * 52, 200 - p * 45);
        ctx.quadraticCurveTo(310 + i * 52, 170 - p * 55, 290 + i * 52, 140 - p * 65);
        ctx.stroke();
      }

      // Blank nameplate with freshly wiped smudge!
      ctx.fillStyle = '#f8fbfc';
      ctx.fillRect(350, 355, 255, 52);
      ctx.strokeStyle = '#6c7c88'; ctx.lineWidth = 2; ctx.strokeRect(350, 355, 255, 52);
      ctx.fillStyle = 'rgba(130,155,170,0.22)';
      ctx.beginPath(); ctx.ellipse(478, 381, 88, 14, -0.05, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(90,105,115,0.22)';
      ctx.font = '13px ui-monospace, monospace';
      ctx.fillText('07 / [       ]', 368, 386);
      vignette(ctx, 0.52);
    },
  },

  // 18. Level 0.3 Ice Rooms — Frozen Figure in Orange Vest
  l03_block: {
    title: '冰塊裡的人影',
    draw(ctx, t) {
      // Deep glacial blue-white ice wall
      const bg = ctx.createRadialGradient(CX, CY, 60, CX, CY, 560);
      bg.addColorStop(0, '#9ac6df'); bg.addColorStop(0.55, '#4b7b99'); bg.addColorStop(1, '#132533');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Blurred figure frozen deep inside the ice
      ctx.save();
      ctx.globalAlpha = 0.72;
      // Head & dark winter hood
      ctx.fillStyle = '#1f2b33';
      ctx.beginPath(); ctx.ellipse(CX, 178, 66, 76, 0, 0, Math.PI * 2); ctx.fill();
      // Orange task-force work vest
      ctx.fillStyle = '#c86228';
      ctx.beginPath();
      ctx.moveTo(295, H); ctx.quadraticCurveTo(310, 275, CX, 252);
      ctx.quadraticCurveTo(650, 275, 665, H);
      ctx.closePath(); ctx.fill();
      // Reflective stripes across the back of the vest
      ctx.fillStyle = 'rgba(215,232,240,0.65)';
      ctx.fillRect(342, 345, 276, 20);
      ctx.fillRect(330, 405, 300, 20);
      ctx.restore();

      // Thick translucent ice refraction & fracture lines over the figure
      ctx.fillStyle = 'rgba(215,242,255,0.24)';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(235,250,255,0.52)'; ctx.lineWidth = 2;
      for (const pts of [
        [[180, 70], [340, 190], [290, 340], [380, 480]],
        [[760, 90], [610, 210], [670, 370]],
        [[430, 40], [490, 160], [460, 260]],
      ]) {
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
      }
      // Drifting cold mist
      const mx = (t * 28) % W;
      const mg = ctx.createLinearGradient(mx - 240, 0, mx + 240, 0);
      mg.addColorStop(0, 'rgba(220,245,255,0)');
      mg.addColorStop(0.5, 'rgba(220,245,255,0.16)');
      mg.addColorStop(1, 'rgba(220,245,255,0)');
      ctx.fillStyle = mg; ctx.fillRect(0, 0, W, H);
      vignette(ctx, 0.58);
    },
    drawView(ctx, t) {
      // Through viewfinder: faint hollow eye sockets appear as if the frozen figure turned half-way toward you!
      const a = 0.45 + 0.25 * Math.sin(t * 3.5);
      ctx.save();
      ctx.fillStyle = `rgba(10,20,28,${a})`;
      ctx.beginPath(); ctx.ellipse(CX - 22, 178, 12, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(CX + 22, 178, 12, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(180,255,230,0.8)';
      ctx.font = '13px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('INTERNAL CAVITY: HOLLOW', CX, 465);
      ctx.textAlign = 'left';
      ctx.restore();
    },
  },

  // 19. Level 0.3 Ice Rooms — Shifting Frozen Ceiling Vent
  l03_ceil_vent: {
    title: '天花板上的格柵',
    draw(ctx, t, s, ct) {
      // Frosted yellow ceiling tiles looking straight up
      ctx.fillStyle = '#9db4c0';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#627c8c'; ctx.lineWidth = 6;
      for (let x = 160; x < W; x += 320) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 110; y < H; y += 310) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // The vent subtly creeps sideways while you stare at it!
      const creep = Math.sin(ct * 0.65) * 34;
      const vx = 260 + creep, vy = 135;
      ctx.fillStyle = '#0c1820';
      ctx.fillRect(vx, vy, 440, 250);
      ctx.strokeStyle = '#c8e4f2'; ctx.lineWidth = 10;
      ctx.strokeRect(vx, vy, 440, 250);
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = '#708fa0';
        ctx.fillRect(vx + 14, vy + 20 + i * 32, 412, 14);
      }
      // Pouring freezing mist
      for (let i = 0; i < 10; i++) {
        const p = (t * 0.55 + i * 0.12) % 1;
        const px = vx + 40 + (i * 39) % 360;
        const py = vy + 60 + p * 300;
        const mg = ctx.createRadialGradient(px, py, 8, px, py, 65 + p * 40);
        mg.addColorStop(0, `rgba(225,245,255,${(1 - p) * 0.32})`);
        mg.addColorStop(1, 'rgba(225,245,255,0)');
        ctx.fillStyle = mg; ctx.fillRect(px - 110, py - 110, 220, 220);
      }
      vignette(ctx, 0.58);
    },
  },

  // 20. Level 0.4 Red Hall — Layer Fission Monitor
  l04_fission_mon: {
    title: '層裂變週期監測儀',
    draw(ctx, t, s) {
      const active = (s.flags.l04_fission_rem || 0) > 0;
      const rem = active ? Math.ceil(s.flags.l04_fission_rem) : Math.max(1, Math.ceil(90 - (s.flags.l04_fission_t || 0)));
      // Heavy crimson-tinted steel console bezel
      ctx.fillStyle = '#241b1c';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#382c2e';
      ctx.fillRect(90, 55, 780, 410);
      // Recessed oscilloscope screen
      ctx.fillStyle = active ? '#22080a' : '#081a12';
      ctx.fillRect(130, 90, 700, 290);
      ctx.strokeStyle = active ? '#ff4a4a' : '#4ee08a'; ctx.lineWidth = 3;
      ctx.strokeRect(130, 90, 700, 290);

      // Grid lines
      ctx.strokeStyle = active ? 'rgba(255,80,80,0.18)' : 'rgba(80,235,140,0.16)'; ctx.lineWidth = 1;
      for (let x = 180; x < 830; x += 50) { ctx.beginPath(); ctx.moveTo(x, 90); ctx.lineTo(x, 380); ctx.stroke(); }
      for (let y = 130; y < 380; y += 50) { ctx.beginPath(); ctx.moveTo(130, y); ctx.lineTo(830, y); ctx.stroke(); }

      // Live fission waveform
      ctx.strokeStyle = active ? '#ff645a' : '#6bffa8'; ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 135; x <= 825; x += 6) {
        const amp = active ? 68 : 22;
        const y = 235 + Math.sin(x * 0.04 + t * (active ? 14 : 4)) * amp * Math.sin(x * 0.012 + t);
        if (x === 135) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Telemetry text
      ctx.fillStyle = active ? '#ff948a' : '#9effc6';
      ctx.font = '700 20px ui-monospace, monospace';
      ctx.fillText(active ? 'STATUS: LAYER FISSION ACTIVE' : 'STATUS: STABLE CYCLE', 155, 130);
      ctx.font = '600 18px ui-monospace, monospace';
      ctx.fillText(active ? `REMAINING: ${rem}s` : `NEXT FISSION IN: ${rem}s`, 155, 355);
      ctx.fillText(`CYCLES LOGGED: ${s.flags.l04_fission_count || 0}`, 560, 355);

      // Indicator LEDs along bottom bezel
      for (let i = 0; i < 4; i++) {
        const on = active ? (Math.floor(t * 6 + i) % 2 === 0) : i === 0;
        ctx.fillStyle = on ? (active ? '#ff3a30' : '#40e880') : '#2a2224';
        ctx.beginPath(); ctx.arc(170 + i * 52, 422, 10, 0, Math.PI * 2); ctx.fill();
      }
      vignette(ctx, 0.55);
    },
  },

  // 21. Level 0.4 Iron Dome Gate — Energy Shield Close-up
  l04_shield: {
    title: '穹頂光幕',
    draw(ctx, t, s) {
      const fission = (s.flags.l04_fission_rem || 0) > 0;
      // Distant immaculate Iron Dome skyline visible through the shield
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, fission ? '#421622' : '#12283a');
      sky.addColorStop(1, '#1d3c52');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#2c4a60';
      for (const [bx, bw, bh] of [[120, 110, 310], [260, 150, 390], [450, 130, 350], [620, 160, 410], [800, 110, 290]]) {
        ctx.fillRect(bx, H - bh, bw, bh);
        ctx.fillStyle = 'rgba(180,235,255,0.28)';
        for (let wy = H - bh + 24; wy < H - 30; wy += 28) ctx.fillRect(bx + 16, wy, bw - 32, 8);
        ctx.fillStyle = '#2c4a60';
      }

      // Luminous blue hexagonal energy barrier right in front of your face
      ctx.fillStyle = fission ? 'rgba(120,210,255,0.34)' : 'rgba(110,205,255,0.24)';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(175,238,255,0.42)'; ctx.lineWidth = 1.6;
      const r = 42, dx = r * 1.5, dy = r * Math.sqrt(3);
      for (let col = -1; col < 18; col++) {
        for (let row = -1; row < 10; row++) {
          const hx = col * dx;
          const hy = row * dy + (col % 2 ? dy / 2 : 0) + ((t * 14) % dy);
          ctx.beginPath();
          for (let k = 0; k < 6; k++) {
            const a = (k * Math.PI) / 3;
            const px = hx + Math.cos(a) * r, py = hy + Math.sin(a) * r;
            if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.closePath(); ctx.stroke();
        }
      }
      // Horizontal scanning pulse
      const sy = (t * 110) % H;
      const sg = ctx.createLinearGradient(0, sy - 40, 0, sy + 40);
      sg.addColorStop(0, 'rgba(180,245,255,0)');
      sg.addColorStop(0.5, 'rgba(210,250,255,0.48)');
      sg.addColorStop(1, 'rgba(180,245,255,0)');
      ctx.fillStyle = sg; ctx.fillRect(0, sy - 40, W, 80);
      vignette(ctx, 0.52);
    },
    drawView(ctx, t) {
      // Viewfinder reads the signal-blocking rebound waveform
      ctx.save();
      ctx.strokeStyle = 'rgba(190,255,220,0.85)'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = 80; x <= 880; x += 10) {
        const y = CY + Math.sin(x * 0.045 + t * 6) * 44;
        if (x === 80) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(190,255,220,0.9)';
      ctx.font = '600 15px ui-monospace, monospace';
      ctx.fillText('SIGNAL REFLECTION: 100% — NO EXTERNAL ROUTE', 80, 120);
      ctx.restore();
    },
  },

  // 22. Level 0.4 Wolf Domain — Distant Silhouette in Crimson Mist
  l04_wolf_sil: {
    title: '霧裡的陌生剪影',
    draw(ctx, t) {
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#46141a'); bg.addColorStop(0.55, '#68242c'); bg.addColorStop(1, '#1c1214');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Rolling crimson haze bands
      for (let i = 0; i < 6; i++) {
        const mx = ((i * 220 + t * (16 + i * 4)) % (W + 320)) - 160;
        const mg = ctx.createRadialGradient(mx, 280 + (i % 3) * 55, 20, mx, 280 + (i % 3) * 55, 220);
        mg.addColorStop(0, 'rgba(215,85,95,0.22)'); mg.addColorStop(1, 'rgba(215,85,95,0)');
        ctx.fillStyle = mg; ctx.fillRect(mx - 220, 80, 440, 380);
      }

      // Tall motionless silhouette standing on the wasteland horizon
      const sway = Math.sin(t * 0.8) * 3;
      ctx.fillStyle = 'rgba(16,8,10,0.86)';
      ctx.beginPath(); ctx.ellipse(CX + sway, 195, 32, 38, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(CX - 62 + sway, 460);
      ctx.quadraticCurveTo(CX - 55 + sway, 245, CX + sway, 232);
      ctx.quadraticCurveTo(CX + 55 + sway, 245, CX + 62 + sway, 460);
      ctx.closePath(); ctx.fill();

      // Cracked wasteland ground
      ctx.fillStyle = '#181012';
      ctx.fillRect(0, 430, W, H - 430);
      vignette(ctx, 0.72);
    },
  },

  // 23. Level 0.5 Drenched Sanatorium — Bottomless Clear Pool Under Grate
  l05_pool: {
    title: '樓梯旁一窪清澈的水',
    draw(ctx, t) {
      // Luminous bottomless turquoise pool water below
      const wg = ctx.createRadialGradient(CX, CY, 30, CX, CY, 520);
      wg.addColorStop(0, '#58c8cc');
      wg.addColorStop(0.55, '#1d6e7a');
      wg.addColorStop(1, '#061f26');
      ctx.fillStyle = wg; ctx.fillRect(0, 0, W, H);

      // Gently shifting caustic light rings deep underwater
      ctx.strokeStyle = 'rgba(180,250,255,0.24)'; ctx.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        const p = (t * 0.25 + i * 0.17) % 1;
        ctx.beginPath();
        ctx.ellipse(CX + Math.sin(t + i) * 18, CY + Math.cos(t * 0.8 + i) * 12, 40 + p * 360, 26 + p * 220, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Subtle submerged white tiles fading into the abyss
      ctx.strokeStyle = 'rgba(200,255,255,0.14)'; ctx.lineWidth = 2;
      for (let x = 160; x < W; x += 90) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + (x - CX) * 0.15, H); ctx.stroke(); }
      for (let y = 90; y < H; y += 85) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Heavy rusted steel walkway grate bars in foreground
      ctx.fillStyle = '#24292b';
      for (let x = 60; x < W; x += 120) ctx.fillRect(x, 0, 22, H);
      for (let y = 85; y < H; y += 160) ctx.fillRect(0, y, W, 16);
      vignette(ctx, 0.62);
    },
  },

  // 24. Level 0.7 Modern Stretch — "No Signal" TV Static Exit
  l07_static: {
    title: '塞滿雜訊的門口',
    draw(ctx, t) {
      // Corridor frame around the sealed doorway
      ctx.fillStyle = '#4e4830';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#22201a';
      ctx.fillRect(150, 28, 660, 484);

      // SMPTE color bars + heavy snow static inside the doorway
      const dx = 175, dy = 48, dw = 610, dh = 444;
      const cols = ['#c8c8c8', '#c8c800', '#00c8c8', '#00c800', '#c800c8', '#c80000', '#0000c8'];
      const jitter = Math.sin(t * 31) > 0.88 ? (Math.random() - 0.5) * 40 : 0;
      cols.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(dx + jitter + (i * dw) / 7, dy, dw / 7 + 2, dh * 0.74);
      });
      ctx.fillStyle = '#12121a';
      ctx.fillRect(dx, dy + dh * 0.74, dw, dh * 0.26);

      // Dynamic static grains
      for (let i = 0; i < 320; i++) {
        const v = (Math.random() * 255) | 0;
        ctx.fillStyle = `rgba(${v},${v},${v},0.65)`;
        ctx.fillRect(dx + Math.random() * dw, dy + Math.random() * dh, 4 + Math.random() * 14, 2 + Math.random() * 3);
      }
      // Rolling sync bar + "NO SIGNAL"
      const barY = dy + ((t * 140) % dh);
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.fillRect(dx, barY, dw, 16);
      ctx.fillStyle = '#0a0a10';
      ctx.fillRect(CX - 115, CY - 26, 230, 52);
      ctx.fillStyle = '#f0f4ff';
      ctx.font = '700 26px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NO SIGNAL', CX, CY + 9);
      ctx.textAlign = 'left';
      vignette(ctx, 0.6);
    },
  },

  // 25. Level 0.7 Victorian Hall — Grinning Musicians Tapestry
  l07_tapestry: {
    title: '維多利亞掛毯',
    draw(ctx, t) {
      // Rich faded crimson & gold woven fabric
      ctx.fillStyle = '#421818';
      ctx.fillRect(0, 0, W, H);
      // Woven vertical linen grain
      ctx.fillStyle = 'rgba(0,0,0,0.14)';
      for (let x = 0; x < W; x += 6) ctx.fillRect(x, 0, 2, H);
      // Ornate gold border
      ctx.strokeStyle = '#b08e44'; ctx.lineWidth = 10;
      ctx.strokeRect(48, 36, W - 96, H - 72);
      ctx.lineWidth = 2;
      ctx.strokeRect(66, 54, W - 132, H - 108);

      // Three eyeless grinning embroidered musicians (violin, horn, lute)
      const flick = 0.85 + 0.15 * Math.sin(t * 7.3);
      for (const [mx, label] of [[245, 'violin'], [480, 'horn'], [715, 'lute']]) {
        ctx.save();
        ctx.translate(mx, 255);
        // Embroidered coat
        ctx.fillStyle = '#2a1c18';
        ctx.beginPath(); ctx.moveTo(-68, 175); ctx.quadraticCurveTo(-55, 20, 0, 12); ctx.quadraticCurveTo(55, 20, 68, 175); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#c4a254'; ctx.lineWidth = 3; ctx.stroke();
        // Pale stitched face — NO EYES, only an impossibly wide toothy grin!
        ctx.fillStyle = '#d6c298';
        ctx.beginPath(); ctx.ellipse(0, -45, 48, 60, 0, 0, Math.PI * 2); ctx.fill();
        // Wide dark grin
        ctx.fillStyle = '#180a08';
        ctx.beginPath();
        ctx.arc(0, -34, 34, 0.12, Math.PI - 0.12);
        ctx.closePath(); ctx.fill();
        // Individual embroidered white teeth
        ctx.fillStyle = '#f2ead4';
        for (let tx = -26; tx <= 22; tx += 9) ctx.fillRect(tx, -31, 6, 12);
        // Musical instrument silhouette in gold thread
        ctx.strokeStyle = '#d4b462'; ctx.lineWidth = 4;
        if (label === 'violin') {
          ctx.beginPath(); ctx.ellipse(34, 46, 22, 34, 0.35, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-24, 58); ctx.lineTo(68, 18); ctx.stroke();
        } else if (label === 'horn') {
          ctx.beginPath(); ctx.moveTo(10, -24); ctx.lineTo(74, 24); ctx.lineTo(54, 52); ctx.closePath(); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.ellipse(-26, 56, 28, 34, -0.3, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-12, 26); ctx.lineTo(42, -8); ctx.stroke();
        }
        ctx.restore();
      }
      // Warm swaying candlelight wash
      const cg = ctx.createRadialGradient(CX + Math.sin(t * 2.1) * 35, 210, 40, CX, CY, 520);
      cg.addColorStop(0, `rgba(255,190,95,${0.2 * flick})`);
      cg.addColorStop(1, 'rgba(10,4,4,0.65)');
      ctx.fillStyle = cg; ctx.fillRect(0, 0, W, H);
    },
  },

  // 26. Level 0.7 Roman Hall — Faceless Marble Statue Holding a Camcorder ("0120")
  l07_statue: {
    title: '舉著方盒的雕像',
    draw(ctx, t) {
      // Dim torchlit marble hall background
      const bg = ctx.createRadialGradient(CX, 220, 50, CX, CY, 540);
      bg.addColorStop(0, '#463f34'); bg.addColorStop(1, '#12100d');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Draped marble toga torso
      ctx.fillStyle = '#c8c2b4';
      ctx.beginPath();
      ctx.moveTo(270, 455); ctx.quadraticCurveTo(310, 255, CX, 240);
      ctx.quadraticCurveTo(650, 255, 690, 455);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#928b7c'; ctx.lineWidth = 4;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.moveTo(350 + i * 55, 265); ctx.quadraticCurveTo(380 + i * 45, 360, 320 + i * 75, 450); ctx.stroke();
      }

      // Smoothly chiseled-off blank marble head
      ctx.fillStyle = '#d8d2c4';
      ctx.beginPath(); ctx.ellipse(CX - 10, 165, 62, 78, -0.05, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(120,112,98,0.32)';
      ctx.beginPath(); ctx.ellipse(CX - 14, 170, 44, 54, 0, 0, Math.PI * 2); ctx.fill();

      // Stone hands holding a rectangular camcorder-shaped stone box up to the right eye!
      ctx.fillStyle = '#b4aea0';
      ctx.fillRect(465, 132, 132, 74);
      ctx.strokeStyle = '#787266'; ctx.lineWidth = 3; ctx.strokeRect(465, 132, 132, 74);
      // Carved stone lens ring facing you
      ctx.fillStyle = '#3c3932';
      ctx.beginPath(); ctx.arc(542, 169, 25, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#9c9586'; ctx.lineWidth = 5; ctx.stroke();

      // Pedestal with weathered Latin + clear "0120"
      ctx.fillStyle = '#a8a294';
      ctx.fillRect(240, 420, 480, 120);
      ctx.strokeStyle = '#6c665a'; ctx.lineWidth = 3; ctx.strokeRect(240, 420, 480, 120);
      ctx.fillStyle = '#38342d';
      ctx.font = '700 24px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('TESTIS  MMXX  ·  0120', CX, 466);
      ctx.textAlign = 'left';

      // Subtle torch flicker
      ctx.fillStyle = `rgba(255,175,90,${0.06 + 0.04 * Math.sin(t * 5.2)})`;
      ctx.fillRect(0, 0, W, H);
      vignette(ctx, 0.6);
    },
  },

  // 27. Level C-1 Side Path — Spotless White Window (Viewfinder reveals East Boat City!)
  c1_window: {
    title: '白框窗',
    draw(ctx, t) {
      // Impossibly clean white wall
      ctx.fillStyle = '#e8ecee';
      ctx.fillRect(0, 0, W, H);
      // Blinding uniform cold-white expanse outside
      const g = ctx.createRadialGradient(CX, CY, 40, CX, CY, 460);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.7, '#eef6fc');
      g.addColorStop(1, '#d6e6f2');
      ctx.fillStyle = g;
      ctx.fillRect(180, 52, 600, 412);

      // Subtle glass sheen sweeping across
      const sx = 240 + Math.sin(t * 0.45) * 40;
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.moveTo(sx, 52); ctx.lineTo(sx + 75, 52); ctx.lineTo(sx - 65, 464); ctx.lineTo(sx - 140, 464);
      ctx.closePath(); ctx.fill();

      // Crisp spotless white window frame & mullions
      ctx.strokeStyle = '#c8d2d8'; ctx.lineWidth = 18;
      ctx.strokeRect(180, 52, 600, 412);
      ctx.fillStyle = '#d4dde3';
      ctx.fillRect(CX - 7, 52, 14, 412);
      ctx.fillRect(180, CY - 16, 600, 14);
      vignette(ctx, 0.28);
    },
    drawView(ctx) {
      // Through viewfinder: faint grey concrete towers of East Boat City shimmer in the white void!
      ctx.save();
      ctx.fillStyle = 'rgba(95,115,125,0.34)';
      for (const [bx, bw, bh] of [[240, 56, 150], [320, 74, 210], [420, 62, 180], [510, 82, 230], [620, 66, 165]]) {
        ctx.fillRect(bx, 455 - bh, bw, bh);
      }
      ctx.fillStyle = 'rgba(130,220,170,0.85)';
      ctx.font = '13px ui-monospace, monospace';
      ctx.fillText('DEPTH ANOMALY // EAST BOAT CITY', 202, 84);
      ctx.restore();
    },
  },

  // 28. Level C-1 Side Path — Spotless Reflective White Bench
  c1_bench: {
    title: '白色長椅',
    draw(ctx, t) {
      ctx.fillStyle = '#dde4e8';
      ctx.fillRect(0, 0, W, H);
      // Subtle floor tile reflection
      ctx.fillStyle = '#cfd8de';
      ctx.fillRect(0, 340, W, H - 340);

      // Porcelain-smooth white bench seat & backrest
      ctx.fillStyle = 'rgba(110,130,145,0.22)';
      ctx.fillRect(160, 395, 640, 26);
      ctx.fillStyle = '#f6f9fb';
      ctx.beginPath(); ctx.roundRect(140, 155, 680, 130, 14); ctx.fill();
      ctx.beginPath(); ctx.roundRect(120, 298, 720, 76, 12); ctx.fill();
      ctx.strokeStyle = '#c0cbd2'; ctx.lineWidth = 3;
      ctx.strokeRect(140, 155, 680, 130);
      ctx.strokeRect(120, 298, 720, 76);

      // Clean chrome legs
      ctx.fillStyle = '#9aa8b2';
      ctx.fillRect(175, 374, 24, 96);
      ctx.fillRect(761, 374, 24, 96);

      // Gleaming zero-dust highlight
      const gx = 280 + Math.sin(t * 0.7) * 90;
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillRect(gx, 306, 130, 12);
      vignette(ctx, 0.25);
    },
  },

  // 29. Level C-1.3 Eye of Alpha — Headless Reptilian Skeleton Display
  c1x_skeleton: {
    title: '無頭骨架展示台',
    draw(ctx, t) {
      // Dim laboratory alcove
      ctx.fillStyle = '#12161c';
      ctx.fillRect(0, 0, W, H);
      // Spotlight beam from above
      const sp = ctx.createRadialGradient(CX, 70, 30, CX, 280, 420);
      sp.addColorStop(0, 'rgba(210,232,255,0.28)');
      sp.addColorStop(1, 'rgba(18,22,28,0)');
      ctx.fillStyle = sp; ctx.fillRect(0, 0, W, H);

      // Glass display pedestal
      ctx.fillStyle = '#1e2630';
      ctx.fillRect(165, 395, 630, 145);
      ctx.strokeStyle = 'rgba(170,210,235,0.42)'; ctx.lineWidth = 4;
      ctx.strokeRect(165, 68, 630, 327);

      // Articulated reptilian skeleton — cleanly severed neck, NO SKULL!
      ctx.strokeStyle = '#dfd8c6'; ctx.fillStyle = '#dfd8c6'; ctx.lineCap = 'round';
      // Spine curve
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(270, 235);
      ctx.bezierCurveTo(380, 190, 540, 200, 725, 325);
      ctx.stroke();
      // Ribcage arches
      ctx.lineWidth = 6;
      for (let i = 0; i < 9; i++) {
        const rx = 345 + i * 26;
        const ry = 206 + Math.sin(i * 0.4) * 8;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.quadraticCurveTo(rx - 12, ry + 62, rx + 8, ry + 95);
        ctx.stroke();
      }
      // Limbs mounted on brass rods
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(355, 235); ctx.lineTo(325, 330); ctx.lineTo(355, 385); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(575, 245); ctx.lineTo(548, 335); ctx.lineTo(585, 385); ctx.stroke();

      // Highlighting the cleanly severed neck vertebra where the skull is missing
      const pulse = 0.55 + 0.35 * Math.sin(t * 2.4);
      ctx.strokeStyle = `rgba(255,140,120,${pulse})`; ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.arc(245, 235, 34, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#9db4c8'; ctx.font = '13px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SPECIMEN: REPTILIA — CRANIUM MISSING', CX, 434);
      ctx.textAlign = 'left';
      vignette(ctx, 0.58);
    },
  },

  // 30. Level C-1.4 Oceanus — Unbreakable Dark-Blue Porthole
  c1s_porthole: {
    title: '深藍舷窗',
    draw(ctx, t) {
      // Heavy riveted steel ship bulkhead
      ctx.fillStyle = '#252e36';
      ctx.fillRect(0, 0, W, H);
      // Circular porthole interior — abyssal dark blue
      ctx.save();
      ctx.beginPath(); ctx.arc(CX, CY, 195, 0, Math.PI * 2); ctx.clip();
      const og = ctx.createRadialGradient(CX, CY - 40, 20, CX, CY, 220);
      og.addColorStop(0, '#18446c');
      og.addColorStop(0.65, '#0b223a');
      og.addColorStop(1, '#040c18');
      ctx.fillStyle = og; ctx.fillRect(CX - 200, CY - 200, 400, 400);

      // Slow drifting deep-blue particulate & dark rock silhouette outside
      ctx.fillStyle = 'rgba(6,14,24,0.68)';
      ctx.beginPath();
      ctx.moveTo(CX - 210, CY + 200); ctx.lineTo(CX - 110, CY + 40); ctx.lineTo(CX + 20, CY + 110); ctx.lineTo(CX + 140, CY + 10); ctx.lineTo(CX + 210, CY + 200);
      ctx.closePath(); ctx.fill();
      for (let i = 0; i < 14; i++) {
        const bx = CX - 160 + ((i * 53 + t * 11) % 320);
        const by = CY + 180 - ((t * (18 + (i % 4) * 7) + i * 47) % 360);
        ctx.fillStyle = 'rgba(130,205,255,0.28)';
        ctx.beginPath(); ctx.arc(bx, by, 2 + (i % 3), 0, Math.PI * 2); ctx.fill();
      }
      // Thick unbreakable glass reflection arc
      ctx.strokeStyle = 'rgba(190,235,255,0.22)'; ctx.lineWidth = 14;
      ctx.beginPath(); ctx.arc(CX, CY, 165, -2.5, -1.6); ctx.stroke();
      ctx.restore();

      // Heavy bolted brass-iron porthole ring
      ctx.strokeStyle = '#4c5964'; ctx.lineWidth = 28;
      ctx.beginPath(); ctx.arc(CX, CY, 204, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#182026'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(CX, CY, 190, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(CX, CY, 218, 0, Math.PI * 2); ctx.stroke();
      // 12 rivets around ring
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.fillStyle = '#7c8b96';
        ctx.beginPath(); ctx.arc(CX + Math.cos(a) * 204, CY + Math.sin(a) * 204, 6, 0, Math.PI * 2); ctx.fill();
      }
      vignette(ctx, 0.62);
    },
  },

  // 31. Level C-1.4 Subspace — Foggy Forest Inserted Inside Steel Ship Ceiling
  c1s_fog_trees: {
    title: '霧裡的林木與金屬頂棚',
    draw(ctx, t) {
      // Misty forest atmosphere
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#1e2c2e'); bg.addColorStop(0.55, '#3b5050'); bg.addColorStop(1, '#1a2422');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Tall damp pine trunks rising straight into the metal ship ceiling!
      for (const [tx, tw, col] of [[110, 44, '#1b2622'], [265, 58, '#22302b'], [460, 48, '#192420'], [655, 64, '#212e29'], [825, 42, '#1a2420']]) {
        ctx.fillStyle = col;
        ctx.fillRect(tx, 95, tw, H - 95);
        // Pine branches
        ctx.strokeStyle = col; ctx.lineWidth = 6;
        for (let by = 140; by < 360; by += 55) {
          ctx.beginPath(); ctx.moveTo(tx + tw / 2, by); ctx.lineTo(tx - 38, by + 26); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(tx + tw / 2, by + 12); ctx.lineTo(tx + tw + 38, by + 38); ctx.stroke();
        }
      }

      // Rusted ship steel ceiling girders & pipes brutally cutting off the treetops
      ctx.fillStyle = '#242b30';
      ctx.fillRect(0, 0, W, 108);
      ctx.fillStyle = '#38434a';
      ctx.fillRect(0, 92, W, 18);
      ctx.fillStyle = '#5a4334';
      ctx.fillRect(0, 48, W, 16);

      // Condensation droplets falling from the steel ceiling
      for (let i = 0; i < 6; i++) {
        const p = (t * 0.8 + i * 0.19) % 1;
        const dx = 140 + i * 140, dy = 110 + p * 390;
        ctx.fillStyle = `rgba(195,230,235,${(1 - p) * 0.65})`;
        ctx.beginPath(); ctx.ellipse(dx, dy, 2.5, 6, 0, 0, Math.PI * 2); ctx.fill();
      }
      // Drifting cold fog layer
      for (let i = 0; i < 6; i++) {
        const fx = ((i * 220 + t * 14) % (W + 300)) - 150;
        const fg = ctx.createRadialGradient(fx, 340, 20, fx, 340, 200);
        fg.addColorStop(0, 'rgba(210,230,232,0.22)'); fg.addColorStop(1, 'rgba(210,230,232,0)');
        ctx.fillStyle = fg; ctx.fillRect(fx - 200, 140, 400, 400);
      }
      vignette(ctx, 0.58);
    },
  },

  // =========================================================================
  // BATCH 3 — Final 3 Levels: Blackout Zone, Level 0.2, Level C-1.2 East Boat City (8 CGs)
  // =========================================================================

  // 32. Blackout Zone Duty Room — Old Wall Intercom
  bo_intercom: {
    title: '牆邊的舊對講機',
    draw(ctx, t) {
      // Damp pitch-dark concrete wall
      ctx.fillStyle = '#12110e';
      ctx.fillRect(0, 0, W, H);
      // Rusted beige-grey metal intercom box
      ctx.fillStyle = '#383630';
      ctx.fillRect(270, 75, 420, 390);
      ctx.strokeStyle = '#1d1c18'; ctx.lineWidth = 6;
      ctx.strokeRect(270, 75, 420, 390);

      // Slotted speaker grille
      ctx.fillStyle = '#181714';
      ctx.fillRect(310, 110, 340, 190);
      ctx.fillStyle = '#2d2b26';
      for (let y = 122; y < 292; y += 14) ctx.fillRect(322, y, 316, 6);

      // Faint pulsing warm amber-red power lamp
      const blink = 0.55 + 0.45 * Math.sin(t * 3.8);
      ctx.save();
      ctx.shadowColor = '#ff583a'; ctx.shadowBlur = 18 * blink;
      ctx.fillStyle = `rgba(255,95,62,${blink})`;
      ctx.beginPath(); ctx.arc(345, 348, 10, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // Cracked CALL / TALK push button
      ctx.fillStyle = '#524e44';
      ctx.beginPath(); ctx.roundRect(410, 326, 180, 48, 8); ctx.fill();
      ctx.strokeStyle = '#24221e'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#d4ccb8'; ctx.font = '700 16px ui-monospace, monospace';
      ctx.textAlign = 'center'; ctx.fillText('CALL / 區域通話', 500, 356); ctx.textAlign = 'left';

      // Delicate drifting soundwave rings (faint piano notes through static!)
      for (let i = 0; i < 3; i++) {
        const p = (t * 0.65 + i * 0.33) % 1;
        ctx.strokeStyle = `rgba(245,224,175,${(1 - p) * 0.25})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(CX, 205, 35 + p * 180, 0, Math.PI * 2); ctx.stroke();
      }
      vignette(ctx, 0.72);
    },
  },

  // 33. Blackout Zone Blind Shaft — Impossibly High Yellow Level 0 Ceiling Grate
  bo_shaft: {
    title: '極高處的黃色天花板格柵',
    draw(ctx, t) {
      // Looking straight up a towering pitch-black concrete shaft
      ctx.fillStyle = '#070605';
      ctx.fillRect(0, 0, W, H);
      // Four receding dark concrete shaft walls converging to the tiny distant yellow grate
      const gx = 375, gy = 185, gw = 210, gh = 155;
      ctx.fillStyle = '#151411';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(gx + gw, gy); ctx.lineTo(gx, gy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#100f0c';
      ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(W, H); ctx.lineTo(gx + gw, gy + gh); ctx.lineTo(gx, gy + gh); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#1a1814';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(gx + gw, gy); ctx.lineTo(gx + gw, gy + gh); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

      // Distant warm Level 0 yellow glow like a sticker ten stories up
      const flick = 0.88 + 0.12 * Math.sin(t * 13);
      const gl = ctx.createRadialGradient(CX, gy + gh / 2, 20, CX, gy + gh / 2, 260);
      gl.addColorStop(0, `rgba(255,232,140,${0.65 * flick})`);
      gl.addColorStop(0.5, `rgba(180,155,70,${0.22 * flick})`);
      gl.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = `rgba(235,214,126,${0.9 * flick})`;
      ctx.fillRect(gx, gy, gw, gh);
      // Grate bars silhouette across the yellow ceiling
      ctx.fillStyle = '#18150d';
      for (let x = gx + 24; x < gx + gw; x += 26) ctx.fillRect(x, gy, 4, gh);
      for (let y = gy + 24; y < gy + gh; y += 26) ctx.fillRect(gx, y, gw, 4);

      // Tiny water droplets falling straight down toward the camera
      for (let i = 0; i < 5; i++) {
        const p = (t * 0.9 + i * 0.21) % 1;
        const a = (i / 5) * Math.PI * 2 + 0.6;
        const dx = CX + Math.cos(a) * p * 380;
        const dy = (gy + gh / 2) + Math.sin(a) * p * 260;
        ctx.fillStyle = `rgba(210,225,215,${p * 0.65})`;
        ctx.beginPath(); ctx.arc(dx, dy, 1.5 + p * 4, 0, Math.PI * 2); ctx.fill();
      }
      vignette(ctx, 0.7);
    },
  },

  // 34. Level 0.2 Clean Restroom — Mirror Showing Unfinished Stud Wall Behind You
  l02_mirror: {
    title: '洗手間的鏡子',
    draw(ctx, t) {
      // Bright clean white bathroom tiles around mirror
      ctx.fillStyle = '#dfe6e8';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#bcc8cc'; ctx.lineWidth = 2;
      for (let x = 0; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 68) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Chrome mirror frame
      ctx.fillStyle = '#9aa6ac';
      ctx.fillRect(145, 42, 670, 445);
      ctx.save();
      ctx.beginPath(); ctx.rect(160, 56, 640, 417); ctx.clip();

      // Inside reflection: left half is fresh white paint, right half is raw drywall & bare wooden studs!
      ctx.fillStyle = '#cfd8dc';
      ctx.fillRect(160, 56, 260, 417);
      // Exposed unfinished timber framing behind the drywall tear
      ctx.fillStyle = '#2c2318';
      ctx.fillRect(420, 56, 380, 417);
      ctx.fillStyle = '#8b6a42';
      for (let sx = 455; sx < 800; sx += 95) ctx.fillRect(sx, 56, 28, 417);
      ctx.fillRect(420, 210, 380, 22);
      ctx.fillRect(420, 380, 380, 22);
      // Jagged torn drywall edge
      ctx.fillStyle = '#e5e2d8';
      ctx.beginPath();
      ctx.moveTo(405, 56); ctx.lineTo(445, 130); ctx.lineTo(418, 220); ctx.lineTo(462, 315); ctx.lineTo(428, 473); ctx.lineTo(395, 473);
      ctx.closePath(); ctx.fill();

      // Your disheveled silhouette reflected in the mirror
      const breath = Math.sin(t * 1.5) * 2.5;
      ctx.fillStyle = '#252a30';
      ctx.beginPath();
      ctx.moveTo(310, 475); ctx.quadraticCurveTo(335, 310 + breath, CX, 295 + breath);
      ctx.quadraticCurveTo(625, 310 + breath, 650, 475);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#b4a898';
      ctx.beginPath(); ctx.ellipse(CX, 222 + breath, 58, 72, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#22201d';
      ctx.beginPath(); ctx.ellipse(CX, 178 + breath, 62, 42, 0, Math.PI, Math.PI * 2); ctx.fill();
      // Tired dark eyes staring back
      ctx.fillStyle = '#181818';
      ctx.beginPath(); ctx.arc(CX - 20, 224 + breath, 5, 0, Math.PI * 2); ctx.arc(CX + 20, 224 + breath, 5, 0, Math.PI * 2); ctx.fill();

      // Subtle mirror glass sheen
      ctx.fillStyle = 'rgba(220,245,255,0.12)';
      ctx.fillRect(160, 56, 640, 417);
      ctx.restore();
      vignette(ctx, 0.36);
    },
  },

  // 35. Level 0.2 Site Office — "A880-1: Level 0 Class-A Remodel" Blueprint
  l02_blueprint: {
    title: '重塑藍圖 A880-1',
    draw(ctx, t) {
      // Deep architectural blueprint cyan-blue paper
      ctx.fillStyle = '#143866';
      ctx.fillRect(0, 0, W, H);
      // Endless repeating Level 0 cubicle grid extending past the edges of the paper!
      ctx.strokeStyle = 'rgba(185,225,255,0.28)'; ctx.lineWidth = 1.5;
      for (let x = 20; x < W; x += 44) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 20; y < H; y += 44) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Architectural room partitions
      ctx.strokeStyle = 'rgba(225,242,255,0.72)'; ctx.lineWidth = 3;
      for (let x = 64; x < W - 40; x += 132) {
        for (let y = 64; y < H - 80; y += 132) {
          ctx.strokeRect(x, y, 88, 88);
          ctx.beginPath(); ctx.moveTo(x + 88, y + 44); ctx.lineTo(x + 132, y + 44); ctx.stroke();
        }
      }

      // Red marker circle right around the center cell ("先從這裡開始")
      const pulse = 1 + Math.sin(t * 2.5) * 0.03;
      ctx.save();
      ctx.translate(CX, 240); ctx.scale(pulse, pulse);
      ctx.strokeStyle = '#ff4a40'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.ellipse(0, 0, 74, 66, -0.15, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(2, 2, 70, 62, 0.1, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#ff6b60'; ctx.font = '700 22px sans-serif';
      ctx.fillText('← 先從這裡開始', 88, 8);
      ctx.restore();

      // Title block bottom-right
      ctx.fillStyle = 'rgba(12,34,64,0.92)';
      ctx.fillRect(545, 415, 375, 92);
      ctx.strokeStyle = '#cce8ff'; ctx.lineWidth = 2; ctx.strokeRect(545, 415, 375, 92);
      ctx.fillStyle = '#e6f4ff'; ctx.font = '700 18px ui-monospace, monospace';
      ctx.fillText('A880-1 : LEVEL 0・A 級重塑', 565, 448);
      ctx.font = '13px ui-monospace, monospace';
      ctx.fillStyle = '#a8d2f4';
      ctx.fillText('SITE TEAM 102-CX // SCALE 1:∞', 565, 478);
      vignette(ctx, 0.45);
    },
  },

  // 36. Level 0.2 Collapsed Frame — Hole into Unfocusable Nothingness
  l02_void: {
    title: '牆上的破洞',
    draw(ctx, t) {
      // Unfocusable pale-grey shimmering void outside
      ctx.fillStyle = '#b8bab6';
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 8; i++) {
        const x = CX + Math.sin(t * (0.7 + i * 0.15) + i) * 240;
        const y = CY + Math.cos(t * (0.6 + i * 0.12) + i * 2) * 160;
        const g = ctx.createRadialGradient(x, y, 10, x, y, 190);
        g.addColorStop(0, i % 2 ? 'rgba(245,245,242,0.55)' : 'rgba(130,134,132,0.45)');
        g.addColorStop(1, 'rgba(180,182,180,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }

      // Jagged splintered wooden planks framing the hole in foreground
      ctx.fillStyle = '#5a432b';
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      ctx.moveTo(235, 115); ctx.lineTo(410, 88); ctx.lineTo(685, 128); ctx.lineTo(745, 295);
      ctx.lineTo(660, 425); ctx.lineTo(355, 445); ctx.lineTo(205, 315); ctx.closePath();
      ctx.fill('evenodd');

      // Wood grain & nails on splintered planks
      ctx.strokeStyle = '#382818'; ctx.lineWidth = 4;
      for (let y = 60; y < H; y += 72) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(200, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(750, y); ctx.lineTo(W, y); ctx.stroke();
      }
      vignette(ctx, 0.65);
    },
  },

  // 37. Level C-1.2 East Boat City ACMA — Containment Cell E-024
  c1e_cell_024: {
    title: '收容室 E-024 觀察窗',
    draw(ctx, t) {
      // Concrete containment room interior behind reinforced glass
      ctx.fillStyle = '#3e423e';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#2d312e';
      ctx.fillRect(0, 355, W, H - 355);

      // Bloated ~90cm sheep-like creature huddled in the corner chewing debris
      const chew = Math.sin(t * 4.2) * 3;
      ctx.fillStyle = '#6c7066';
      ctx.beginPath(); ctx.ellipse(495, 345 + chew * 0.3, 138, 92, 0.05, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#585c52';
      for (const [wx, wy, wr] of [[420, 315, 46], [490, 295, 52], [565, 320, 48], [465, 360, 44], [540, 365, 42]]) {
        ctx.beginPath(); ctx.arc(wx, wy, wr, 0, Math.PI * 2); ctx.fill();
      }
      // Small hunched head nibbling scraps
      ctx.fillStyle = '#40443c';
      ctx.beginPath(); ctx.ellipse(362, 348 + chew, 42, 34, -0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#141614';
      ctx.beginPath(); ctx.arc(348, 342 + chew, 4, 0, Math.PI * 2); ctx.fill();

      // Thick steel observation window frame + circular metal intercom speaker hole
      ctx.strokeStyle = '#1e2428'; ctx.lineWidth = 44;
      ctx.strokeRect(22, 22, W - 44, H - 44);
      // Bulletproof glass reflection & intercom grill bottom-right
      ctx.fillStyle = 'rgba(180,215,220,0.08)'; ctx.fillRect(44, 44, W - 88, H - 88);
      ctx.fillStyle = '#283036';
      ctx.beginPath(); ctx.arc(825, 420, 42, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#6a7882'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#101418';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath(); ctx.arc(825 + Math.cos(a) * 18, 420 + Math.sin(a) * 18, 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#c8d6dc'; ctx.font = '700 18px ui-monospace, monospace';
      ctx.fillText('ACMA-03 // CELL E-024', 70, 84);
      vignette(ctx, 0.55);
    },
  },

  // 38. Level C-1.2 East Boat City ACMA — Empty Containment Cell E-025
  c1e_cell_025: {
    title: '空置收容室 E-025',
    draw(ctx, t) {
      // Cold, sterile, completely empty concrete cell
      ctx.fillStyle = '#444c50';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#2f363a';
      ctx.fillRect(0, 365, W, H - 365);
      // Overhead fluorescent strip
      ctx.fillStyle = '#dceef8';
      ctx.fillRect(310, 72, 340, 16);

      // Single dangling sensor cable swaying gently in the empty room
      const sway = Math.sin(t * 1.3) * 18;
      ctx.strokeStyle = '#1c2226'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(CX, 88); ctx.quadraticCurveTo(CX + sway * 0.5, 210, CX + sway, 315); ctx.stroke();
      ctx.fillStyle = '#262e34';
      ctx.fillRect(CX + sway - 10, 312, 20, 26);

      // Thick observation frame & intact lock indicator
      ctx.strokeStyle = '#1d2226'; ctx.lineWidth = 44;
      ctx.strokeRect(22, 22, W - 44, H - 44);
      ctx.fillStyle = 'rgba(180,220,235,0.08)'; ctx.fillRect(44, 44, W - 88, H - 88);
      ctx.fillStyle = '#90e8b0'; ctx.font = '700 18px ui-monospace, monospace';
      ctx.fillText('ACMA-03 // CELL E-025  [SEAL INTACT — EMPTY]', 70, 84);
      vignette(ctx, 0.58);
    },
  },

  // 39. Level C-1.2 East Boat City ACMA — Containment Cell E-013 ("Zhurong")
  c1e_cell_013: {
    title: '收容室 E-013 觀察窗',
    draw(ctx, t) {
      // Scorched dark containment chamber lit by ember glow
      const bg = ctx.createRadialGradient(CX, 320, 30, CX, CY, 520);
      bg.addColorStop(0, '#5a2212'); bg.addColorStop(0.55, '#241210'); bg.addColorStop(1, '#100a0a');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#161110';
      ctx.fillRect(0, 370, W, H - 370);

      // Red-haired youth figure in white short robe seated in the scorched corner
      const flick = 0.85 + 0.15 * Math.sin(t * 8.5);
      // White robe torso
      ctx.fillStyle = '#d4d4d8';
      ctx.beginPath();
      ctx.moveTo(395, 430); ctx.lineTo(430, 275); ctx.lineTo(530, 275); ctx.lineTo(565, 430);
      ctx.closePath(); ctx.fill();
      // Head & vivid fiery red hair
      ctx.fillStyle = '#c89b7e';
      ctx.beginPath(); ctx.ellipse(CX, 225, 44, 52, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b82e1e';
      ctx.beginPath(); ctx.ellipse(CX, 198, 52, 36, 0, Math.PI, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(CX - 48, 200); ctx.lineTo(CX - 32, 148); ctx.lineTo(CX, 168); ctx.lineTo(CX + 26, 142); ctx.lineTo(CX + 48, 200); ctx.fill();

      // Rising floating sparks & embers
      for (let i = 0; i < 18; i++) {
        const p = (t * (0.45 + (i % 4) * 0.12) + i * 0.17) % 1;
        const ex = 260 + ((i * 59) % 440) + Math.sin(t * 3 + i) * 16;
        const ey = 440 - p * 360;
        ctx.fillStyle = `rgba(255,${120 + (i % 3) * 40},40,${(1 - p) * 0.85 * flick})`;
        ctx.beginPath(); ctx.arc(ex, ey, 2 + (i % 3), 0, Math.PI * 2); ctx.fill();
      }

      // Scorched bulletproof observation frame
      ctx.strokeStyle = '#1b1616'; ctx.lineWidth = 44;
      ctx.strokeRect(22, 22, W - 44, H - 44);
      ctx.fillStyle = '#ff9d78'; ctx.font = '700 18px ui-monospace, monospace';
      ctx.fillText('ACMA-03 // CELL E-013  [THERMAL WARNING]', 70, 84);
      vignette(ctx, 0.58);
    },
  },

  // 40. Level 0 Pitfalls — Peering Straight Down a Deep Rectangular Pit Shaft
  l0_pit_edge: {
    title: '俯瞰無底陷坑',
    draw(ctx, t) {
      // Looking straight down a cavernous rectangular shaft receding to an uncanny teal-green glimmer
      ctx.fillStyle = '#050707';
      ctx.fillRect(0, 0, W, H);
      const layers = 9;
      for (let i = 0; i < layers; i++) {
        const p = i / layers;
        const padX = 72 + p * 315;
        const padY = 44 + p * 188;
        const rw = W - padX * 2, rh = H - padY * 2;
        const shade = Math.max(12, Math.round(138 * (1 - p * 0.88)));
        ctx.strokeStyle = `rgb(${shade},${Math.round(shade * 0.88)},${Math.round(shade * 0.48)})`;
        ctx.lineWidth = Math.max(1.5, 6 * (1 - p * 0.7));
        ctx.strokeRect(padX, padY, rw, rh);
        // Vertical corner seams plunging downward
        if (i === 0) {
          ctx.strokeStyle = 'rgba(72,62,32,0.55)'; ctx.lineWidth = 3;
          for (const [cx0, cy0, cx1, cy1] of [
            [72, 44, 387, 232], [W - 72, 44, W - 387, 232],
            [72, H - 44, 387, H - 232], [W - 72, H - 44, W - 387, H - 232],
          ]) {
            ctx.beginPath(); ctx.moveTo(cx0, cy0); ctx.lineTo(cx1, cy1); ctx.stroke();
          }
        }
      }
      // Faint eerie teal-green suburban streetlamp glow impossibly far below
      const gl = ctx.createRadialGradient(CX, CY, 6, CX, CY, 130);
      gl.addColorStop(0, `rgba(110,210,175,${0.48 + 0.08 * Math.sin(t * 2.2)})`);
      gl.addColorStop(0.5, 'rgba(34,88,74,0.22)');
      gl.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gl; ctx.fillRect(280, 140, 400, 260);
      // Tiny crooked gabled roof silhouette down in the green abyss
      ctx.fillStyle = 'rgba(18,44,38,0.85)';
      ctx.beginPath(); ctx.moveTo(CX - 42, CY + 12); ctx.lineTo(CX, CY - 16); ctx.lineTo(CX + 42, CY + 12); ctx.closePath(); ctx.fill();
      ctx.fillRect(CX - 34, CY + 12, 68, 28);
      ctx.fillStyle = 'rgba(165,240,215,0.55)'; ctx.fillRect(CX - 8, CY + 18, 16, 16);

      // Foreground damp yellow carpet rim + peeling yellow-black hazard tape
      ctx.fillStyle = '#8d7d3e';
      ctx.fillRect(0, 0, W, 44); ctx.fillRect(0, H - 44, W, 44);
      ctx.fillRect(0, 0, 72, H); ctx.fillRect(W - 72, 0, 72, H);
      ctx.save();
      ctx.strokeStyle = '#d4b838'; ctx.lineWidth = 10; ctx.strokeRect(72, 44, W - 144, H - 88);
      ctx.strokeStyle = '#1a1812'; ctx.lineWidth = 10; ctx.setLineDash([22, 22]);
      ctx.strokeRect(72, 44, W - 144, H - 88);
      ctx.restore();

      // Rising updraft dust motes drifting out of the abyss
      for (let i = 0; i < 16; i++) {
        const p = (t * (0.28 + (i % 4) * 0.06) + i * 0.17) % 1;
        const a = (i / 16) * Math.PI * 2 + Math.sin(t + i) * 0.2;
        const dx = CX + Math.cos(a) * (35 + p * 340);
        const dy = CY + Math.sin(a) * (20 + p * 190);
        ctx.fillStyle = `rgba(218,220,192,${p * (1 - p) * 1.4})`;
        ctx.beginPath(); ctx.arc(dx, dy, 1.5 + p * 2.5, 0, Math.PI * 2); ctx.fill();
      }
      vignette(ctx, 0.72);
    },
    drawView(ctx, t) {
      // Through the camcorder viewfinder, a tall wiry black figure is clinging to the far shaft wall!
      const jitter = Math.sin(t * 14) * 2;
      ctx.save();
      ctx.strokeStyle = 'rgba(15,28,22,0.95)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      const x = CX + 95 + jitter, y = CY - 24;
      ctx.beginPath();
      ctx.moveTo(x, y - 34); ctx.lineTo(x + 6, y + 28);
      ctx.moveTo(x - 28, y - 8); ctx.lineTo(x + 2, y - 18); ctx.lineTo(x + 34, y - 2);
      ctx.moveTo(x + 6, y + 28); ctx.lineTo(x - 16, y + 66);
      ctx.moveTo(x + 6, y + 28); ctx.lineTo(x + 24, y + 64);
      ctx.stroke();
      ctx.fillStyle = '#b6ffd2';
      ctx.fillRect(x - 5, y - 42, 4, 4); ctx.fillRect(x + 4, y - 42, 4, 4);
      ctx.restore();
    },
  },

  // 41. Level 0 Pitfalls — Vertical Shaft Looking Straight Up at Distant Level 0 Rim
  l0_pit_shaft: {
    title: '抬頭仰望坑口',
    draw(ctx, t) {
      ctx.fillStyle = '#090908';
      ctx.fillRect(0, 0, W, H);
      const gx = 360, gy = 148, gw = 240, gh = 164;
      // Four towering concrete shaft walls converging upward
      ctx.fillStyle = '#1b1914';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(gx + gw, gy); ctx.lineTo(gx, gy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#14130f';
      ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(W, H); ctx.lineTo(gx + gw, gy + gh); ctx.lineTo(gx, gy + gh); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#222019';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(gx + gw, gy); ctx.lineTo(gx + gw, gy + gh); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      // Horizontal concrete form seams
      ctx.strokeStyle = 'rgba(85,78,56,0.3)'; ctx.lineWidth = 2;
      for (let i = 1; i <= 5; i++) {
        const p = i / 6;
        ctx.strokeRect(gx * p, gy * p, W - (W - gw) * p, H - (H - gh) * p);
      }
      // Distant blazing yellow Level 0 ceiling & fluorescent hum far above
      const flick = 0.88 + 0.12 * Math.sin(t * 17);
      const gl = ctx.createRadialGradient(CX, gy + gh / 2, 18, CX, gy + gh / 2, 260);
      gl.addColorStop(0, `rgba(255,236,148,${0.7 * flick})`);
      gl.addColorStop(0.5, `rgba(175,152,70,${0.22 * flick})`);
      gl.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = `rgba(232,212,126,${0.92 * flick})`;
      ctx.fillRect(gx, gy, gw, gh);
      // Faint dark silhouette leaning over the distant yellow rim looking straight down!
      const lean = Math.sin(t * 1.1) * 4;
      ctx.fillStyle = '#18160e';
      ctx.beginPath(); ctx.ellipse(CX + 26 + lean, gy + gh - 24, 24, 30, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(CX - 8 + lean, gy + gh - 12, 68, 20);
      // Swaying winch cable plunging straight down past the lens
      const sway = Math.sin(t * 1.8) * 14;
      ctx.strokeStyle = '#9ea6aa'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(gx + 52, gy + gh); ctx.quadraticCurveTo(320 + sway, 380, 290 + sway * 1.3, H); ctx.stroke();
      vignette(ctx, 0.74);
    },
  },

  // 42. Level 0 Pitfalls Bottom — Fake Green Suburban Door Opening onto Damp Level 0 Concrete
  l0_pit_facade: {
    title: '偽街房屋的正門',
    draw(ctx, t) {
      // Teal-green clapboard siding of the fake suburban house
      ctx.fillStyle = '#385852';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#263e3a'; ctx.lineWidth = 3;
      for (let y = 24; y < H; y += 34) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Crisp white painted wooden doorframe
      ctx.fillStyle = '#d4dcd8';
      ctx.fillRect(285, 58, 390, 462);
      // Inside the open doorway: SOLID damp Level 0 yellow wallpaper & cracked concrete one inch behind the threshold!
      ctx.save();
      ctx.beginPath(); ctx.rect(318, 88, 324, 432); ctx.clip();
      wallpaperBg(ctx, '#9f8f48', '#8b7b38', 0.45);
      // Cracked grey concrete slab poking through peeling wallpaper
      ctx.fillStyle = '#4c4e48';
      ctx.beginPath();
      ctx.moveTo(318, 250); ctx.lineTo(445, 215); ctx.lineTo(525, 290); ctx.lineTo(480, 415); ctx.lineTo(318, 455);
      ctx.closePath(); ctx.fill();
      // Scrawled chalk warning on the solid wall behind the door
      ctx.fillStyle = '#ebe6d2'; ctx.font = '700 26px sans-serif';
      ctx.fillText('後面什麼都沒有', 378, 176);
      ctx.font = '700 18px ui-monospace, monospace';
      ctx.fillStyle = '#cfc8ae';
      ctx.fillText('NOT A HOUSE // STAY BACK', 362, 212);
      ctx.restore();

      // Open green door swung inward-left in foreground
      ctx.fillStyle = '#2a4640';
      ctx.beginPath();
      ctx.moveTo(318, 88); ctx.lineTo(222, 42); ctx.lineTo(222, 540); ctx.lineTo(318, 520);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#4c746c'; ctx.lineWidth = 3; ctx.stroke();
      // Brass doorknob
      ctx.fillStyle = '#d4b468';
      ctx.beginPath(); ctx.arc(248, 305, 11, 0, Math.PI * 2); ctx.fill();

      // Sickly green overhead porch light flicker
      const gl = ctx.createRadialGradient(CX, 20, 15, CX, 180, 440);
      gl.addColorStop(0, `rgba(148,240,205,${0.26 + 0.05 * Math.sin(t * 11)})`);
      gl.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
      vignette(ctx, 0.65);
    },
  },

  // 43. Level 0 Pitfalls Island — M.E.G. Vertical Cross-Section Blueprint & Depth Gauge
  l0_pit_map: {
    title: '陷坑區垂直剖面圖',
    draw(ctx, t) {
      // Aged architectural parchment pinned to industrial steel wall
      ctx.fillStyle = '#2b2d2a';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#dfd5b8';
      ctx.fillRect(105, 42, 750, 440);
      ctx.strokeStyle = '#6c6248'; ctx.lineWidth = 3;
      ctx.strokeRect(118, 55, 724, 414);

      // Header
      ctx.fillStyle = '#2a261c'; ctx.font = '700 21px ui-monospace, monospace';
      ctx.fillText('M.E.G. 勘查剖面 // LEVEL 0 — THE PITFALLS', 148, 92);
      ctx.strokeStyle = '#5e5640'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(144, 106); ctx.lineTo(816, 106); ctx.stroke();

      // Diagram layers: Top (格狀坑陣 & 橫樑危橋 & 維修中繼台) -> Shaft -> Bottom (坑底偽街廳)
      const boxDraw = (x, y, w, h, title, sub, fill = '#ece4cc', stroke = '#3b3628') => {
        ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = stroke; ctx.lineWidth = 2.5; ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = '#242016'; ctx.font = '700 15px sans-serif'; ctx.fillText(title, x + 12, y + 26);
        ctx.fillStyle = '#5a523e'; ctx.font = '12px sans-serif'; ctx.fillText(sub, x + 12, y + 46);
      };
      boxDraw(150, 128, 175, 62, '格狀坑陣 (0m)', '樓梯口／通往停電區');
      boxDraw(375, 128, 185, 62, '貼壁窄道・絞盤', '解鎖煞車可垂降', '#efe6c4', '#7a4822');
      boxDraw(610, 128, 195, 62, '維修中繼台（此處）', '橫樑危橋→鐵梯返樓梯', '#dce6d8', '#385c42');
      // Connecting horizontal arrows
      ctx.strokeStyle = '#3a3426'; ctx.lineWidth = 3;
      for (const [x1, x2] of [[325, 375], [560, 610]]) {
        ctx.beginPath(); ctx.moveTo(x1, 159); ctx.lineTo(x2, 159); ctx.stroke();
      }
      // Vertical shaft plunge
      ctx.strokeStyle = '#7a3420'; ctx.lineWidth = 3; ctx.setLineDash([7, 5]);
      ctx.beginPath(); ctx.moveTo(468, 190); ctx.lineTo(468, 250); ctx.stroke();
      ctx.setLineDash([]);
      boxDraw(355, 250, 225, 58, '坑壁垂降中段 (-18m)', '對講機循環錄音／檢修蓋', '#e8dfd0');
      ctx.strokeStyle = '#7a3420'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(468, 308); ctx.lineTo(468, 355); ctx.stroke();
      boxDraw(270, 355, 395, 76, '坑底偽街廳 (-36m)  [高度危險]', '假綠屋街景・有模仿人聲的細長黑影・暗角 0120 柵可直返中繼台', '#d6e4dc', '#245848');
      // Curved dotted return arrow from pitroom to island
      ctx.strokeStyle = '#24684a'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(665, 392); ctx.quadraticCurveTo(758, 360, 742, 190); ctx.stroke();
      ctx.setLineDash([]);

      // Live blinking red "YOU ARE HERE" pin on island
      if ((t * 2.2 | 0) % 2 === 0) {
        ctx.fillStyle = '#d9382a';
        ctx.beginPath(); ctx.arc(788, 144, 7, 0, Math.PI * 2); ctx.fill();
      }
      vignette(ctx, 0.5);
    },
  },

  // 44. Red Rooms Relay Alcove — 60Hz Vacuum-Tube Relay Console
  l0_red_relay: {
    title: 'M.E.G. 60Hz 中繼電台',
    draw(ctx, t, s) {
      ctx.fillStyle = '#240806';
      ctx.fillRect(0, 0, W, H);
      // Heavy military steel chassis encrusted with crimson mycelium threads
      ctx.fillStyle = '#2e2b2c';
      ctx.fillRect(145, 75, 670, 370);
      ctx.strokeStyle = '#564e4c'; ctx.lineWidth = 4;
      ctx.strokeRect(145, 75, 670, 370);

      // Glowing analog frequency dial
      ctx.fillStyle = '#121512';
      ctx.fillRect(190, 115, 340, 115);
      ctx.strokeStyle = '#6c7268'; ctx.lineWidth = 2; ctx.strokeRect(190, 115, 340, 115);
      ctx.strokeStyle = 'rgba(220,235,205,0.45)'; ctx.lineWidth = 1.5;
      for (let x = 210; x <= 510; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, 195); ctx.lineTo(x, x % 60 === 0 ? 158 : 176); ctx.stroke();
      }
      // Frequency needle: snaps dead-center on 60.0Hz when anchored!
      const nx = s.flags.red_anchored ? 360 : 285 + Math.sin(t * 7) * 55;
      ctx.strokeStyle = s.flags.red_anchored ? '#58f290' : '#ff4b38'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(nx, 122); ctx.lineTo(nx, 224); ctx.stroke();
      ctx.fillStyle = s.flags.red_anchored ? '#80ffa8' : '#ff8a78';
      ctx.font = '700 22px ui-monospace, monospace';
      ctx.fillText(s.flags.red_anchored ? '60.0 Hz [LOCKED]' : 'ERR // DRIFTING', 215, 148);

      // Three glowing vacuum tubes on the right
      for (let i = 0; i < 3; i++) {
        const tx = 590 + i * 72, ty = 175;
        ctx.fillStyle = '#181414';
        ctx.beginPath(); ctx.roundRect(tx - 18, ty - 48, 36, 92, 16); ctx.fill();
        ctx.strokeStyle = '#706868'; ctx.lineWidth = 2; ctx.stroke();
        const gl = ctx.createRadialGradient(tx, ty, 3, tx, ty, 34);
        gl.addColorStop(0, s.flags.red_anchored ? 'rgba(90,255,150,0.65)' : `rgba(255,95,48,${0.5 + 0.2 * Math.sin(t * 9 + i)})`);
        gl.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gl; ctx.fillRect(tx - 36, ty - 40, 72, 80);
      }

      // Scratched desperate inscription on lower steel panel
      ctx.fillStyle = '#d8cec4'; ctx.font = '700 20px sans-serif';
      ctx.fillText('60Hz = 嗡嗡聲 = 回家方向', 200, 310);
      ctx.fillStyle = '#9a8c84'; ctx.font = '14px ui-monospace, monospace';
      ctx.fillText('SQUAD ECHO-4 // DO NOT STAY PAST 9 SECONDS', 200, 345);
      // Creeping crimson fungal veins along bottom edge
      ctx.strokeStyle = 'rgba(175,32,22,0.85)'; ctx.lineWidth = 4;
      for (let i = 0; i < 7; i++) {
        ctx.beginPath(); ctx.moveTo(150 + i * 95, 445);
        ctx.quadraticCurveTo(175 + i * 95, 395, 195 + i * 95, 375 + (i % 3) * 14); ctx.stroke();
      }
      vignette(ctx, 0.68);
    },
  },

  // 45. The Torment — Motionless Pale Moon & Broken-Shoulder Statue
  l0_tor_statue_cu: {
    title: '灰霧中的戴帽石像',
    draw(ctx, t) {
      // Cold monochrome grey mist gradient
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#5a5a5a'); bg.addColorStop(0.5, '#7e7e7e'); bg.addColorStop(1, '#3d3d3d');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      // Motionless blazing white full moon
      const mg = ctx.createRadialGradient(CX, 118, 12, CX, 118, 140);
      mg.addColorStop(0, 'rgba(255,255,255,0.95)'); mg.addColorStop(0.45, 'rgba(220,220,220,0.35)'); mg.addColorStop(1, 'rgba(120,120,120,0)');
      ctx.fillStyle = mg; ctx.fillRect(CX - 150, 0, 300, 270);
      ctx.fillStyle = '#f6f6f6'; ctx.beginPath(); ctx.arc(CX, 118, 42, 0, Math.PI * 2); ctx.fill();

      // Weathered stone statue of a man in a broad-brimmed hat, broken at left shoulder
      ctx.fillStyle = '#2c2c2c';
      ctx.fillRect(CX - 95, 420, 190, 95); // pedestal
      // Coat torso with fractured left shoulder stump
      ctx.beginPath();
      ctx.moveTo(CX - 72, 420); ctx.lineTo(CX - 54, 265); ctx.lineTo(CX - 28, 250);
      ctx.lineTo(CX + 56, 256); ctx.lineTo(CX + 78, 420);
      ctx.closePath(); ctx.fill();
      // Jagged fracture edge on broken left shoulder
      ctx.fillStyle = '#4c4c4c';
      ctx.beginPath(); ctx.moveTo(CX - 56, 268); ctx.lineTo(CX - 74, 286); ctx.lineTo(CX - 50, 304); ctx.closePath(); ctx.fill();
      // Head & broad-brimmed hat (turned slightly away to the naked eye)
      ctx.fillStyle = '#262626';
      ctx.beginPath(); ctx.ellipse(CX + 4, 212, 34, 42, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(CX - 64, 174, 134, 14);
      ctx.fillRect(CX - 36, 136, 76, 40);

      // Drifting pale ash flakes
      for (let i = 0; i < 20; i++) {
        const ax = ((i * 89 + t * 24) % (W + 40)) - 20;
        const ay = ((i * 53 + t * 18) % H);
        ctx.fillStyle = 'rgba(235,235,235,0.45)';
        ctx.fillRect(ax, ay, 3, 3);
      }
      ctx.fillStyle = '#b4b4b4'; ctx.font = '600 18px serif'; ctx.textAlign = 'center';
      ctx.fillText('「……放不下那一天的。」', CX, 468);
      ctx.textAlign = 'left';
      vignette(ctx, 0.7);
    },
    drawView(ctx) {
      // Through the viewfinder, the statue's head has turned straight at you with glowing pale eyes!
      ctx.save();
      ctx.fillStyle = '#d4ffe0';
      ctx.shadowColor = '#b0ffca'; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.ellipse(CX - 12, 210, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(CX + 16, 210, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    },
  },

  // 46. The Arches — Crystal-Clear Vaulted Pool Reflection
  l0_arch_pool_cu: {
    title: '拱頂清池的水面',
    draw(ctx, t) {
      // Clear jade-slate shallow water with reflected pale cream arches
      const bg = ctx.createRadialGradient(CX, CY, 40, CX, CY, 520);
      bg.addColorStop(0, '#5a7874'); bg.addColorStop(0.6, '#394f4c'); bg.addColorStop(1, '#1d2928');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      // Reflected cream stone archway ribs shimmering softly in water
      ctx.strokeStyle = 'rgba(235,228,198,0.22)'; ctx.lineWidth = 14;
      for (const rx of [-220, 0, 220]) {
        ctx.beginPath(); ctx.arc(CX + rx, CY + 120, 170, Math.PI, Math.PI * 2); ctx.stroke();
      }
      // Your own blurred, gentle reflection finally appearing on the water!
      const sway = Math.sin(t * 1.4) * 5;
      ctx.fillStyle = 'rgba(20,30,30,0.45)';
      ctx.beginPath(); ctx.ellipse(CX + sway, 228, 52, 66, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(355 + sway, 465); ctx.quadraticCurveTo(380 + sway, 315, CX + sway, 304);
      ctx.quadraticCurveTo(580 + sway, 315, 605 + sway, 465); ctx.closePath(); ctx.fill();
      // Concentric expanding ripples
      for (let i = 0; i < 4; i++) {
        const p = (t * 0.35 + i * 0.25) % 1;
        ctx.strokeStyle = `rgba(220,248,244,${(1 - p) * 0.48})`; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.ellipse(CX, CY + 10, 35 + p * 340, 22 + p * 200, 0, 0, Math.PI * 2); ctx.stroke();
      }
      vignette(ctx, 0.55);
    },
  },

  // 47. Ceiling Crawlspace — Looking Down Through the Tile Gap at Yourself Below
  l0_ceil_peek_cu: {
    title: '從天花板板縫往下看',
    draw(ctx, t, s) {
      // Bright yellow Level 0 hallway viewed straight down from above!
      ctx.fillStyle = '#c8b45c';
      ctx.fillRect(0, 0, W, H);
      // Floor wet carpet grid below
      ctx.fillStyle = '#8b7938';
      ctx.fillRect(210, 60, 540, 420);
      ctx.strokeStyle = 'rgba(65,54,20,0.28)'; ctx.lineWidth = 2;
      for (let x = 210; x <= 750; x += 60) { ctx.beginPath(); ctx.moveTo(x, 60); ctx.lineTo(x, 480); ctx.stroke(); }
      for (let y = 60; y <= 480; y += 60) { ctx.beginPath(); ctx.moveTo(210, y); ctx.lineTo(750, y); ctx.stroke(); }

      // Sticky note taped on wall below
      ctx.fillStyle = '#f4eed4'; ctx.fillRect(222, 232, 26, 36);

      // Foreground jagged dark ceiling fiberboard framing the peep-gap
      ctx.fillStyle = '#181611';
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      ctx.moveTo(225, 110); ctx.lineTo(730, 128); ctx.lineTo(718, 412); ctx.lineTo(240, 396); ctx.closePath();
      ctx.fill('evenodd');
      ctx.strokeStyle = '#5a523c'; ctx.lineWidth = 5;
      ctx.strokeRect(232, 118, 492, 286);

      if (!s.view) {
        // Naked eye: just empty buzzing yellow carpet below
        ctx.fillStyle = 'rgba(255,244,180,0.12)'; ctx.fillRect(232, 118, 492, 286);
      }
      vignette(ctx, 0.72);
    },
    drawView(ctx, t) {
      // With camcorder viewfinder ON: a figure in YOUR exact jacket stands right below, head snapped straight UP staring into the lens!
      const tremor = Math.sin(t * 22) * 1.6;
      ctx.save();
      ctx.fillStyle = '#202624';
      ctx.beginPath(); ctx.ellipse(CX + tremor, 275, 58, 36, 0, 0, Math.PI * 2); ctx.fill(); // shoulders from top-down
      ctx.fillStyle = '#c8c4b4';
      ctx.beginPath(); ctx.ellipse(CX + tremor, 268, 32, 36, 0, 0, Math.PI * 2); ctx.fill(); // face tilted straight up
      // Wide unblinking eyes staring directly up at you
      ctx.fillStyle = '#0c100e';
      ctx.beginPath(); ctx.arc(CX - 11 + tremor, 262, 5, 0, Math.PI * 2); ctx.arc(CX + 11 + tremor, 262, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d4ffe0';
      ctx.beginPath(); ctx.arc(CX - 11 + tremor, 262, 2, 0, Math.PI * 2); ctx.arc(CX + 11 + tremor, 262, 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    },
  },

  // 48. Level 0.1 Zenith Medbay — 7-Waveform Bio-Monitor Screen
  l01_med_scan: {
    title: 'ZENITH 醫療艙體徵監控',
    draw(ctx, t) {
      ctx.fillStyle = '#07141a';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#3c7a8e'; ctx.lineWidth = 10;
      ctx.strokeRect(48, 36, W - 96, H - 72);
      // Grid lines
      ctx.strokeStyle = 'rgba(72,168,195,0.14)'; ctx.lineWidth = 1;
      for (let x = 70; x < W - 70; x += 36) { ctx.beginPath(); ctx.moveTo(x, 54); ctx.lineTo(x, H - 54); ctx.stroke(); }
      for (let y = 60; y < H - 60; y += 36) { ctx.beginPath(); ctx.moveTo(70, y); ctx.lineTo(W - 70, y); ctx.stroke(); }

      ctx.fillStyle = '#8ee4f8'; ctx.font = '700 17px ui-monospace, monospace';
      ctx.fillText('ZENITH STATION // MEDBAY BIO-TELEMETRY  (ROSTER: 6 CREW)', 80, 78);

      // 6 nominal green crew ECG lines + 7th flickering amber unregistered line
      for (let i = 0; i < 7; i++) {
        const y0 = 122 + i * 52;
        const seventh = i === 6;
        ctx.fillStyle = seventh ? '#ff8a5c' : '#6ae0a8';
        ctx.font = '700 13px ui-monospace, monospace';
        ctx.fillText(seventh ? 'SUBJ-07 [UNREGISTERED]' : `CREW-0${i + 1} [NOMINAL]`, 80, y0 + 4);
        ctx.strokeStyle = seventh ? (Math.sin(t * 14) > -0.3 ? '#ff7048' : '#7a2c1c') : '#52e09c';
        ctx.lineWidth = seventh ? 2.8 : 1.8;
        ctx.beginPath();
        for (let x = 285; x <= 860; x += 8) {
          const phase = ((x - 285) * 0.045 - t * (seventh ? 4.8 : 3.2) + i * 1.1) % (Math.PI * 2);
          const spike = Math.abs(phase) < 0.28 ? -Math.sin(phase * 11) * (seventh ? 22 : 14) : Math.sin(x * 0.1 + i) * 2;
          if (x === 285) ctx.moveTo(x, y0 + spike); else ctx.lineTo(x, y0 + spike);
        }
        ctx.stroke();
      }
      vignette(ctx, 0.45);
    },
  },

  // 49. Level 0.2 Supply Room — Double-Sided BRC / Level 0 Wallpaper Roll
  l02_wallpaper_cu: {
    title: '雙面翻新壁紙卷',
    draw(ctx) {
      // Background workbench
      ctx.fillStyle = '#383226';
      ctx.fillRect(0, 0, W, H);
      // Left sheet: spotless fresh cream BRC Level 0.2 surface
      ctx.fillStyle = '#f2ecd8';
      ctx.fillRect(110, 68, 370, 395);
      ctx.fillStyle = '#e4dec6';
      for (let x = 124; x < 470; x += 42) ctx.fillRect(x, 68, 12, 395);
      ctx.fillStyle = '#6c6858'; ctx.font = '700 16px ui-monospace, monospace';
      ctx.fillText('BRC 0.2-A  米白極簡覆面', 142, 110);

      // Right peeled-back underside: unmistakable damp mouldy Level 0 yellow diamond wallpaper!
      ctx.save();
      ctx.beginPath(); ctx.rect(480, 68, 370, 395); ctx.clip();
      wallpaperBg(ctx, '#b8a44c', '#9e8b3a', 0.48);
      ctx.restore();
      // Curled shadow crease down the center peel line
      const cg = ctx.createLinearGradient(448, 0, 514, 0);
      cg.addColorStop(0, 'rgba(0,0,0,0)'); cg.addColorStop(0.5, 'rgba(20,16,8,0.58)'); cg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cg; ctx.fillRect(448, 68, 66, 395);

      ctx.fillStyle = '#2d2614'; ctx.font = '700 18px sans-serif';
      ctx.fillText('內側捲芯：舊黃色壁紙（同一卷紙）', 506, 110);
      vignette(ctx, 0.5);
    },
  },

  // 50. Level 0.3 Ductway — Ice-Encased Cold Duct Damper Valve
  l03_valve_cu: {
    title: '風管冷風節流閥',
    draw(ctx, t, s) {
      const shut = !!s.flags.l03_valve_shut;
      // Frosted steel duct backdrop
      ctx.fillStyle = shut ? '#2f3d42' : '#263b48';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#4e626e';
      ctx.fillRect(0, 175, W, 190);
      ctx.strokeStyle = '#7e98a6'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, 175); ctx.lineTo(W, 175); ctx.moveTo(0, 365); ctx.lineTo(W, 365); ctx.stroke();

      // Heavy circular valve handwheel
      ctx.save();
      ctx.translate(CX, CY);
      ctx.rotate(shut ? 1.15 : 0);
      ctx.strokeStyle = shut ? '#4ad896' : '#c84838'; ctx.lineWidth = 22;
      ctx.beginPath(); ctx.arc(0, 0, 132, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 14;
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * -128, Math.sin(a) * -128); ctx.lineTo(Math.cos(a) * 128, Math.sin(a) * 128); ctx.stroke();
      }
      ctx.fillStyle = '#2a343a'; ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      if (!shut) {
        // Thick jagged translucent blue ice casing locking the wheel
        ctx.fillStyle = 'rgba(175,228,255,0.48)';
        ctx.beginPath();
        ctx.moveTo(310, 145); ctx.lineTo(490, 95); ctx.lineTo(665, 165); ctx.lineTo(645, 390); ctx.lineTo(445, 425); ctx.lineTo(295, 345);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(235,252,255,0.85)'; ctx.lineWidth = 3; ctx.stroke();
        // Blowing icy fog wisps
        for (let i = 0; i < 8; i++) {
          const p = (t * 0.65 + i * 0.14) % 1;
          ctx.fillStyle = `rgba(215,244,255,${(1 - p) * 0.35})`;
          ctx.beginPath(); ctx.arc(CX - p * 360, CY + Math.sin(t * 4 + i) * 55, 22 + p * 36, 0, Math.PI * 2); ctx.fill();
        }
      } else {
        // Warm meltwater droplets & green locked badge
        ctx.fillStyle = '#8ef0c2'; ctx.font = '700 20px ui-monospace, monospace';
        ctx.fillText('DAMPER SEALED // COLD DRAFT REDUCED', 268, 92);
      }
      vignette(ctx, 0.58);
    },
    hotspots: [
      {
        id: 'cu_valve_wheel', rect: [315, 115, 330, 310], label: '冷風節流閥輪', cursor: 'look',
        click: (g) => {
          if (g.s.flags.l03_valve_shut) return g.say('節流閥已經鎖死在關閉位置，風管裡的嘯叫聲小了大半。');
          g.say('厚厚的藍冰把整個鐵輪鎖死了。可以用噴槍烤化冰層，或是拿金屬吊桿硬敲開。');
        },
        use: {
          blowtorch: (g) => {
            if (g.s.flags.l03_valve_shut) return g.say('節流閥已經關緊了。');
            g.flag('l03_valve_shut'); g.sfx('steam');
            g.say('噴槍烤裂了厚冰，你用力把節流閥轉到底——整條走廊呼嘯的冷風瞬間弱了下來！');
          },
          rod: (g) => {
            if (g.s.flags.l03_valve_shut) return g.say('節流閥已經關緊了。');
            g.flag('l03_valve_shut'); g.sfx('clank');
            g.say('你用金屬吊桿敲碎冰層、卡住輪輻把節流閥扳到關閉位置！呼嘯的冷風頓時小了大半。');
          },
        },
      },
    ],
  },

  // 51. Level 0.5 Morgue — Half-Open Stainless Drawer 0120
  l05_morgue_cu: {
    title: '0120 號冷凍抽屜',
    draw(ctx, t) {
      // Cold greenish-grey stainless mortuary wall
      ctx.fillStyle = '#242b29';
      ctx.fillRect(0, 0, W, H);
      // Pulled-out stainless steel tray receding in perspective
      ctx.fillStyle = '#4e5855';
      ctx.beginPath(); ctx.moveTo(165, 130); ctx.lineTo(795, 130); ctx.lineTo(860, 465); ctx.lineTo(100, 465); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#8b9994'; ctx.lineWidth = 4; ctx.stroke();
      // Raised metal tray walls
      ctx.fillStyle = '#333b38';
      ctx.fillRect(195, 155, 570, 275);
      // Warm muddy brown puddle glistening in the empty metal tray
      ctx.fillStyle = 'rgba(72,56,34,0.72)';
      ctx.beginPath(); ctx.ellipse(CX, 305, 195, 78, -0.05, 0, Math.PI * 2); ctx.fill();
      // Faint steam wisps rising from the weirdly warm puddle
      for (let i = 0; i < 6; i++) {
        const p = (t * 0.35 + i * 0.17) % 1;
        ctx.fillStyle = `rgba(200,215,205,${(1 - p) * 0.24})`;
        ctx.beginPath(); ctx.arc(360 + i * 48 + Math.sin(t + i) * 14, 300 - p * 140, 18 + p * 22, 0, Math.PI * 2); ctx.fill();
      }
      // Riveted plaque "0120" on front handle lip
      ctx.fillStyle = '#222826'; ctx.fillRect(410, 434, 140, 42);
      ctx.strokeStyle = '#96a6a0'; ctx.lineWidth = 2; ctx.strokeRect(410, 434, 140, 42);
      ctx.fillStyle = '#e0ece6'; ctx.font = '700 22px ui-monospace, monospace';
      ctx.fillText('0120', 450, 462);
      vignette(ctx, 0.65);
    },
    drawView(ctx) {
      // Through the viewfinder, two fresh glowing pale handprints appear pressed against the inside tray rim!
      ctx.save();
      ctx.fillStyle = 'rgba(185,255,215,0.58)';
      for (const hx of [365, 595]) {
        ctx.beginPath(); ctx.ellipse(hx, 295, 24, 30, hx < CX ? -0.15 : 0.15, 0, Math.PI * 2); ctx.fill();
        for (let f = -2; f <= 2; f++) {
          ctx.beginPath(); ctx.ellipse(hx + f * 10, 255 + Math.abs(f) * 4, 4.5, 16, f * 0.08, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    },
  },

  // 52. Level 0.7 Roman Bath — Dry Marble Mosaic Floor (Smiler Hidden Under Viewfinder)
  l07_mosaic: {
    title: '乾涸浴池的馬賽克池底',
    draw(ctx, t) {
      // Warm cream-and-ochre tiled Roman marble mosaic
      ctx.fillStyle = '#9c9278';
      ctx.fillRect(0, 0, W, H);
      const tile = 24;
      for (let y = 36; y < H - 36; y += tile) {
        for (let x = 60; x < W - 60; x += tile) {
          const dx = x + tile / 2 - CX, dy = y + tile / 2 - CY;
          const dist = Math.hypot(dx, dy);
          const ring = Math.abs(dist - 185) < 16 || Math.abs(dist - 115) < 12;
          ctx.fillStyle = ring ? '#5c523c' : ((x + y) / tile) % 2 === 0 ? '#bcb296' : '#a89e82';
          ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);
        }
      }
      // Subtle warm mist drifting across the dry pool tiles
      for (let i = 0; i < 6; i++) {
        const mx = ((t * 28 + i * 185) % (W + 200)) - 100;
        const mg = ctx.createRadialGradient(mx, CY + (i % 3 - 1) * 90, 20, mx, CY + (i % 3 - 1) * 90, 140);
        mg.addColorStop(0, 'rgba(240,235,215,0.22)'); mg.addColorStop(1, 'rgba(240,235,215,0)');
        ctx.fillStyle = mg; ctx.fillRect(mx - 150, 0, 300, H);
      }
      vignette(ctx, 0.55);
    },
    drawView(ctx, t) {
      // Under camcorder viewfinder: the mosaic tesserae align into a huge ear-to-ear glowing Smiler face!
      ctx.save();
      const glowA = 0.75 + 0.18 * Math.sin(t * 5);
      ctx.fillStyle = `rgba(220,255,230,${glowA})`;
      ctx.shadowColor = '#b4ffd0'; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.ellipse(CX - 95, 195, 26, 20, -0.1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(CX + 95, 195, 26, 20, 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(220,255,230,${glowA})`; ctx.lineWidth = 14; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(CX, 235, 142, 0.18 * Math.PI, 0.82 * Math.PI); ctx.stroke();
      ctx.restore();
    },
  },

  // 53. Level C-1 Gallery — Spotless White Blank Frame (Viewfinder Floorplan Reveal)
  c1_frame_cu: {
    title: '空畫廊的白框',
    draw(ctx) {
      // Clinical spotless pale white wall & raised gallery molding
      ctx.fillStyle = '#e8eef2';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#cfd9e0';
      ctx.fillRect(185, 58, 590, 412);
      ctx.fillStyle = '#f8fbfd';
      ctx.fillRect(218, 90, 524, 348);
      ctx.strokeStyle = '#aebdc9'; ctx.lineWidth = 3;
      ctx.strokeRect(218, 90, 524, 348);
      vignette(ctx, 0.28);
    },
    drawView(ctx, t) {
      // Viewfinder reveals ultra-clean architectural blueprints of the Level C-1 rooms you walked through!
      ctx.save();
      ctx.strokeStyle = `rgba(88,180,210,${0.65 + 0.15 * Math.sin(t * 2)})`; ctx.lineWidth = 2;
      const rooms = [[265, 145, 115, 78], [415, 145, 130, 78], [580, 145, 115, 78], [340, 265, 135, 95], [510, 265, 135, 95]];
      rooms.forEach(([x, y, w, h]) => ctx.strokeRect(x, y, w, h));
      // Connecting hallway axes
      ctx.beginPath();
      ctx.moveTo(380, 184); ctx.lineTo(415, 184); ctx.moveTo(545, 184); ctx.lineTo(580, 184);
      ctx.moveTo(475, 223); ctx.lineTo(475, 265); ctx.moveTo(475, 312); ctx.lineTo(510, 312);
      ctx.stroke();
      ctx.fillStyle = 'rgba(72,165,198,0.82)'; ctx.font = '700 13px ui-monospace, monospace';
      ctx.fillText('TRANSIT CORRIDOR // C-1 MEMORY TRACE', 268, 405);
      ctx.restore();
    },
  },

  // 54. Level C-1.3 Xiangting Archive — K014 Twenty-Four Storage Cells
  c1x_cells_cu: {
    title: 'K014 二十四號儲格陳列架',
    draw(ctx, t) {
      ctx.fillStyle = '#0d141c';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#92c8ec'; ctx.font = '700 17px ui-monospace, monospace';
      ctx.fillText('K014 ARCHIVE // CELLS 01–24  [ACTIVE SLOT: 24]', 120, 68);
      // 6x4 matrix of glowing glass archive cells
      const cols = 6, rows = 4, cw = 112, ch = 82, sx = 120, sy = 92;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const num = r * cols + c + 1;
          const x = sx + c * (cw + 12), y = sy + r * (ch + 12);
          const is24 = num === 24;
          ctx.fillStyle = is24 ? `rgba(74,174,245,${0.28 + 0.1 * Math.sin(t * 3.5)})` : '#15202b';
          ctx.fillRect(x, y, cw, ch);
          ctx.strokeStyle = is24 ? '#8cd6ff' : '#354b5e';
          ctx.lineWidth = is24 ? 3 : 1.5;
          ctx.strokeRect(x, y, cw, ch);
          ctx.fillStyle = is24 ? '#d8f2ff' : '#6f8ea6';
          ctx.font = '700 13px ui-monospace, monospace';
          ctx.fillText(String(num).padStart(2, '0'), x + 10, y + 22);
          if (!is24) {
            // Sealed rolled script cylinder inside archived cells 01..23
            ctx.fillStyle = '#9c9684';
            ctx.fillRect(x + 26, y + 40, 60, 18);
            ctx.fillStyle = '#c84a3c'; ctx.fillRect(x + 52, y + 40, 8, 18);
          } else {
            // Unsealed glowing Cell 24 with tiny handwritten note on glass
            ctx.fillStyle = '#bfe8ff'; ctx.font = '12px sans-serif';
            ctx.fillText('「別低頭」', x + 22, y + 54);
          }
        }
      }
      vignette(ctx, 0.55);
    },
  },

  // Level 0.01 — Blinding Flickering Fluorescent Tube
  l001_lamp_cu: {
    title: '劇烈閃爍的螢光燈管',
    draw(ctx, t) {
      ctx.fillStyle = '#242012';
      ctx.fillRect(0, 0, W, H);
      // Ceiling grid frame
      ctx.strokeStyle = '#6c623c'; ctx.lineWidth = 6;
      ctx.strokeRect(120, 80, 720, 380);
      // Lamp housing
      ctx.fillStyle = '#3c3622';
      ctx.fillRect(140, 100, 680, 340);
      const flash = Math.sin(t * 42) > -0.15 ? 1 : 0.18;
      // Dual fluorescent tubes
      for (const y of [190, 310]) {
        const g = ctx.createRadialGradient(CX, y, 10, CX, y, 260);
        g.addColorStop(0, `rgba(255,252,220,${0.95 * flash})`);
        g.addColorStop(0.5, `rgba(255,236,150,${0.38 * flash})`);
        g.addColorStop(1, 'rgba(255,220,110,0)');
        ctx.fillStyle = g;
        ctx.fillRect(140, y - 100, 680, 200);
        ctx.fillStyle = flash > 0.5 ? '#fffdf0' : '#78725a';
        ctx.fillRect(165, y - 16, 630, 32);
        // Dark burned ends
        ctx.fillStyle = '#2c2618';
        ctx.fillRect(165, y - 16, 26, 32);
        ctx.fillRect(769, y - 16, 26, 32);
      }
      ctx.fillStyle = 'rgba(255,244,196,0.75)';
      ctx.font = '600 15px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('別再凝視燈管了——嗡鳴聲正在吞沒聽覺與視覺', CX, 495);
      ctx.textAlign = 'left';
      vignette(ctx, 0.58);
    },
  },

  // Level 0.01 — Wanderer Belongings Faded to Monotonous Yellow
  l001_faded_cu: {
    title: '褪成單調螢黃的遺物',
    draw(ctx, t) {
      // Damp yellow carpet background
      ctx.fillStyle = '#6c5c26';
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 42; i++) {
        ctx.fillStyle = i % 2 ? 'rgba(180,158,72,0.14)' : 'rgba(50,40,14,0.18)';
        ctx.fillRect((i * 89) % W, (i * 53) % H, 90, 6);
      }
      // Faded backpack & jacket losing all original color into Level 0.01 yellow
      ctx.fillStyle = '#bda84e';
      ctx.beginPath(); ctx.roundRect(190, 120, 310, 270, 24); ctx.fill();
      ctx.strokeStyle = '#7a6828'; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = '#a89440';
      ctx.beginPath(); ctx.roundRect(225, 160, 240, 110, 14); ctx.fill();
      // Torn shoe bleached yellow
      ctx.fillStyle = '#b49e46';
      ctx.beginPath(); ctx.roundRect(545, 295, 195, 86, 20); ctx.fill();
      ctx.strokeStyle = '#6e5c22'; ctx.lineWidth = 3; ctx.stroke();
      // Canteen with faint almond-water blue cap resisting the fade
      ctx.fillStyle = '#d8ce9a';
      ctx.beginPath(); ctx.roundRect(585, 130, 86, 135, 12); ctx.fill();
      ctx.fillStyle = `rgba(74,126,184,${0.75 + 0.15 * Math.sin(t * 2)})`;
      ctx.fillRect(606, 112, 44, 22);
      ctx.fillStyle = '#4a3d14';
      ctx.font = '600 14px ui-monospace, monospace';
      ctx.fillText('所有色彩都在被單調螢黃同化……', 210, 446);
      vignette(ctx, 0.56);
    },
  },

  // Level 0.1 Danger Zone — The Kagerou / Salamander coalescing in heat shimmer
  dz_kagerou_cu: {
    title: '陽炎・沙羅曼達',
    draw(ctx, t) {
      const bg = ctx.createRadialGradient(CX, CY, 30, CX, CY, 540);
      bg.addColorStop(0, '#ff9a2e'); bg.addColorStop(0.45, '#9e260c'); bg.addColorStop(1, '#1a0402');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      // Heat shimmer distortion bands
      for (let i = 0; i < 16; i++) {
        const y = ((i * 36 + t * 55) % H);
        ctx.fillStyle = 'rgba(255,215,120,0.08)';
        ctx.fillRect(0, y, W, 10);
      }
      // Fiery salamander silhouette ("沙羅曼達 / 地獄主")
      const sway = Math.sin(t * 5) * 14;
      ctx.save();
      ctx.translate(CX, CY + 20);
      ctx.fillStyle = 'rgba(255,235,140,0.88)';
      ctx.beginPath();
      ctx.moveTo(-180, 40 + sway);
      ctx.quadraticCurveTo(-70, -45, 30, -18);
      ctx.quadraticCurveTo(130, -35, 195, -5 - sway * 0.5);
      ctx.quadraticCurveTo(135, 38, 25, 28);
      ctx.quadraticCurveTo(-85, 58, -180, 40 + sway);
      ctx.fill();
      // Glowing white-gold eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(140, -10, 8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(162, -4, 6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(255,236,196,0.9)';
      ctx.font = '700 15px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('熱朦朧具現化——陽炎（沙羅曼達）正以烈火為食，切勿交戰！', CX, 495);
      ctx.textAlign = 'left';
      vignette(ctx, 0.52);
    },
  },

  // Level 0.1 Danger Zone — Melted 12-person Outpost Comms Terminal
  dz_melted_cu: {
    title: '熔化的通訊終端',
    draw(ctx, t) {
      ctx.fillStyle = '#18100e'; ctx.fillRect(0, 0, W, H);
      // Charred console casing
      ctx.fillStyle = '#2c221e';
      ctx.beginPath(); ctx.roundRect(145, 70, 670, 400, 18); ctx.fill();
      ctx.strokeStyle = '#5a3a2c'; ctx.lineWidth = 5; ctx.stroke();
      // Cracked dim amber-red screen
      ctx.fillStyle = '#140806';
      ctx.fillRect(190, 110, 580, 265);
      ctx.strokeStyle = '#8a3420'; ctx.lineWidth = 2; ctx.strokeRect(190, 110, 580, 265);
      const flick = Math.sin(t * 18) > -0.7 ? 1 : 0.4;
      ctx.save(); ctx.globalAlpha = flick;
      ctx.fillStyle = '#ff7e52';
      ctx.font = '700 15px ui-monospace, monospace';
      ctx.fillText('SIGNAL: SMS ONLY // VOICE: CORRUPTED', 215, 148);
      ctx.fillText('GPS / COMPASS: OFFLINE', 215, 178);
      ctx.fillStyle = '#ff4838';
      ctx.fillText('[BLOCKED] backrooms-database://level-0.1', 215, 218);
      ctx.fillStyle = '#f0cba8';
      ctx.font = '14px ui-monospace, monospace';
      ctx.fillText('> 簡訊殘檔：「驟燃太快了……別再派常駐隊進來……」', 215, 268);
      ctx.fillText('> 簡訊殘檔：「據點盡頭出現一扇玻璃門……有人還活著嗎？」', 215, 300);
      ctx.restore();
      // Diagonal screen crack
      ctx.strokeStyle = 'rgba(255,210,180,0.45)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(580, 110); ctx.lineTo(520, 220); ctx.lineTo(630, 375); ctx.stroke();
      vignette(ctx, 0.56);
    },
  },

  // Level 0.98 黯室 — Silent Seamless Embedded Ceiling Light (Flashback)
  dull_lamp_cu: {
    title: '無聲的嵌頂螢光燈',
    draw(ctx, t) {
      ctx.fillStyle = '#5c5030'; ctx.fillRect(0, 0, W, H);
      // Seamless embedded light panel — no wires, no fixtures
      const pulse = 0.85 + 0.15 * Math.sin(t * 2.4);
      const gr = ctx.createRadialGradient(CX, CY, 30, CX, CY, 420);
      gr.addColorStop(0, `rgba(240,228,176,${pulse})`);
      gr.addColorStop(0.55, 'rgba(170,152,96,0.38)');
      gr.addColorStop(1, 'rgba(50,42,24,0)');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f2e8bc';
      ctx.fillRect(170, 165, 620, 210);
      ctx.strokeStyle = '#9c8b58'; ctx.lineWidth = 3;
      ctx.strokeRect(170, 165, 620, 210);
      // Faint memory-flashback ghost rings
      ctx.strokeStyle = `rgba(255,250,220,${0.25 * Math.abs(Math.sin(t * 3.5))})`;
      ctx.lineWidth = 2;
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath(); ctx.arc(CX, CY, 70 * i + (t * 25) % 70, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = '#2e2614';
      ctx.font = '700 15px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('沒有電線、沒有嗡鳴——僅凝視一瞬便引發頭痛與記憶閃回', CX, 488);
      ctx.textAlign = 'left';
      vignette(ctx, 0.54);
    },
  },

  // Level 0.98 黯室 — Ryan Greenfield's Feb 10, 2000 "畸變" Photograph
  dull_distortion_cu: {
    title: '附件照片：「畸變」（2000/02/10）',
    draw(ctx, t) {
      ctx.fillStyle = '#0c0a0e'; ctx.fillRect(0, 0, W, H);
      // Photo frame
      ctx.fillStyle = '#1b1822';
      ctx.fillRect(140, 48, 680, 405);
      const cols = ['#ff3b6b', '#ffbe3b', '#38e88c', '#34c4ff', '#9c5cff', '#ff5ce8'];
      ctx.save();
      ctx.beginPath(); ctx.rect(155, 62, 650, 376); ctx.clip();
      // Iridescent fractured game-like corridor walls
      for (let i = 0; i < 18; i++) {
        const x = 155 + (i * 38) + Math.sin(t * 3 + i) * 6;
        const y = 62 + ((i * 53 + t * 24) % 340);
        ctx.fillStyle = cols[i % cols.length];
        ctx.globalAlpha = 0.42;
        ctx.fillRect(x, 62, 34, 376);
        ctx.fillRect(155, y, 650, 18);
      }
      // Fractured dark corridor perspective vanishing point
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#08060c';
      ctx.beginPath();
      ctx.moveTo(395, 175); ctx.lineTo(565, 175); ctx.lineTo(540, 345); ctx.lineTo(420, 345);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#9cf8ff'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#d4c082';
      ctx.font = '700 14px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('2000-02-10 // 萊恩・格林菲爾德拍攝：量子漲落與「畸變」', CX, 495);
      ctx.textAlign = 'left';
      vignette(ctx, 0.5);
    },
  },

  // Level 0 Colonnade — B.N.T.G. Stencil Kit & Identification Card
  l0_colonnade_kit: {
    title: 'B.N.T.G. 噴漆模板箱',
    draw(ctx) {
      // Damp carpet background
      ctx.fillStyle = '#5e5225';
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 420; i++) {
        const px = (i * 97) % W, py = (i * 53) % H;
        ctx.fillStyle = i % 2 ? 'rgba(0,0,0,0.14)' : 'rgba(220,200,115,0.08)';
        ctx.fillRect(px, py, 3, 2);
      }

      // Open metal case shadow & outer shell
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(192, 92, 592, 362);
      ctx.fillStyle = '#3c453e';
      ctx.fillRect(180, 80, 592, 360);
      ctx.strokeStyle = '#6c796e'; ctx.lineWidth = 4;
      ctx.strokeRect(180, 80, 592, 360);

      // Dark interior foam tray
      ctx.fillStyle = '#1b1f1c';
      ctx.fillRect(198, 98, 556, 324);
      ctx.strokeStyle = '#2d332f'; ctx.lineWidth = 2;
      ctx.strokeRect(198, 98, 556, 324);

      // Left compartment: Brass B.N.T.G. stencil plate + depleted spray can
      ctx.fillStyle = '#9c864e';
      ctx.fillRect(225, 130, 230, 145);
      ctx.strokeStyle = '#d8c284'; ctx.lineWidth = 2;
      ctx.strokeRect(225, 130, 230, 145);
      // Corner alignment ticks cut into brass plate
      ctx.fillStyle = '#1b1f1c';
      for (const [tx, ty] of [[237, 142], [435, 142], [237, 255], [435, 255]]) {
        ctx.fillRect(tx, ty, 8, 8);
      }
      ctx.font = '700 26px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('B.N.T.G.', 340, 196);
      ctx.font = '700 34px ui-monospace, monospace';
      ctx.fillText('→', 340, 240);

      // Depleted blue-white spray can below stencil
      ctx.fillStyle = '#485966';
      ctx.fillRect(245, 315, 165, 62);
      ctx.fillStyle = '#c8d6df';
      ctx.fillRect(410, 326, 22, 40);
      ctx.fillStyle = '#dde6ea';
      ctx.fillRect(432, 339, 14, 14);
      ctx.fillStyle = '#a7c0d2';
      ctx.fillRect(272, 323, 92, 46);
      ctx.fillStyle = '#21303b';
      ctx.font = '700 12px ui-monospace, monospace';
      ctx.fillText('B.N.T.G. #04', 318, 350);

      // Right compartment: Laminated comparison card (click to read)
      ctx.fillStyle = '#efe7cf';
      ctx.fillRect(492, 128, 234, 266);
      ctx.strokeStyle = '#9b906c'; ctx.lineWidth = 2.5;
      ctx.strokeRect(492, 128, 234, 266);
      ctx.fillStyle = '#2b2820';
      ctx.font = '700 13px ui-monospace, monospace';
      ctx.fillText('B.N.T.G. 路線識別卡', 609, 156);

      // Valid example box
      ctx.fillStyle = '#cbb868';
      ctx.fillRect(514, 174, 190, 78);
      ctx.strokeStyle = '#3d6b47'; ctx.lineWidth = 2;
      ctx.strokeRect(514, 174, 190, 78);
      ctx.fillStyle = '#f2eed8';
      ctx.font = '700 16px ui-monospace, monospace';
      ctx.fillText('B.N.T.G.  →', 609, 212);
      ctx.fillStyle = '#2b5e36';
      ctx.font = '700 11px ui-monospace, monospace';
      ctx.fillText('✓ 銳利邊框・乾燥牆面', 609, 238);

      // Mimic example box
      ctx.fillStyle = '#7b6c36';
      ctx.fillRect(514, 274, 190, 86);
      ctx.strokeStyle = '#8b2f28'; ctx.lineWidth = 2;
      ctx.strokeRect(514, 274, 190, 86);
      ctx.fillStyle = 'rgba(42,28,16,0.75)';
      ctx.beginPath(); ctx.ellipse(609, 316, 68, 22, 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c8bd94';
      ctx.font = '700 15px ui-monospace, monospace';
      ctx.fillText('B.T.N.G.  ↘', 609, 314);
      ctx.fillStyle = '#7e2018';
      ctx.font = '700 11px ui-monospace, monospace';
      ctx.fillText('✗ 拼錯字・滲水暈散', 609, 346);

      ctx.fillStyle = '#5c5540';
      ctx.font = '11px ui-monospace, monospace';
      ctx.fillText('（點擊卡片查看完整規範）', 609, 382);
      ctx.textAlign = 'left';
      vignette(ctx, 0.52);
    },
    drawView(ctx, t) {
      // Camcorder UV glow highlights reflective primer on stencil plate
      const pulse = 0.55 + 0.35 * Math.sin(t * 4);
      ctx.save();
      ctx.strokeStyle = `rgba(128,255,212,${pulse})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(225, 130, 230, 145);
      ctx.fillStyle = 'rgba(128,255,212,0.85)';
      ctx.font = '700 13px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('UV 反光底漆偵測中 — 「別相信牆裡自己長出來的箭頭」', CX, 60);
      ctx.textAlign = 'left';
      ctx.restore();
    },
    hotspots: [
      {
        id: 'cu_colonnade_card', rect: [490, 126, 238, 270], label: '閱讀商隊路線識別卡', cursor: 'look',
        click: (g) => g.read('n_colonnade_kit'),
      },
    ],
  },

  // Level 0.1 Observation Deck — Panoramic Spherical Shell Core Window
  l01_core_window: {
    title: '觀測台・球殼中心',
    draw(ctx, t) {
      const wx = 44, wy = 46, ww = 872, wh = 398;
      const sx = CX, sy = 244;

      // Station observation bulkhead surround
      const wallGrad = ctx.createLinearGradient(0, 0, 0, H);
      wallGrad.addColorStop(0, '#36414a');
      wallGrad.addColorStop(0.5, '#252e35');
      wallGrad.addColorStop(1, '#161c21');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, W, H);

      // Exterior viewport clipped to the panoramic glass area
      ctx.save();
      ctx.beginPath();
      ctx.rect(wx, wy, ww, wh);
      ctx.clip();

      // 1. Beyond the shell: endless stacked Level 0 yellow rooms growing outside Zenith Station
      const outerBg = ctx.createRadialGradient(sx, sy, 140, sx, sy, 520);
      outerBg.addColorStop(0, '#010306');
      outerBg.addColorStop(0.56, '#091420');
      outerBg.addColorStop(0.78, '#2d2814');
      outerBg.addColorStop(1, '#6b5b24');
      ctx.fillStyle = outerBg;
      ctx.fillRect(wx, wy, ww, wh);

      // Endless tiers of yellow rooms stacked along the outer flanks outside the spherical shell
      for (const side of [-1, 1]) {
        for (let row = 0; row < 12; row++) {
          const ry = wy + 12 + row * 32;
          for (let col = 0; col < 6; col++) {
            const rx = side < 0 ? wx + 8 + col * 36 : wx + ww - 224 + col * 36;
            const dx = (rx + 15 - sx) / 415;
            const dy = (ry + 12 - sy) / 205;
            const dist = dx * dx + dy * dy;
            if (dist < 0.86) continue;
            const fade = clamp((dist - 0.86) * 2.0, 0.2, 0.92);
            const lit = ((row * 7 + col * 11) % 5 !== 0);
            ctx.fillStyle = lit
              ? `rgba(218,196,98,${fade * 0.62})`
              : `rgba(116,100,44,${fade * 0.48})`;
            ctx.fillRect(rx, ry, 30, 24);
            if (lit) {
              ctx.fillStyle = `rgba(255,246,192,${fade * 0.65})`;
              ctx.fillRect(rx + 8, ry + 3, 14, 3);
              ctx.fillStyle = `rgba(42,35,14,${fade * 0.55})`;
              ctx.fillRect(rx + 12, ry + 11, 6, 13);
            }
          }
        }
      }

      // 2. The colossal hollow spherical shell interior
      const shellRx = 418, shellRy = 204;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(sx, sy, shellRx, shellRy, 0, 0, Math.PI * 2);
      ctx.clip();

      const voidGrad = ctx.createRadialGradient(sx, sy, 18, sx, sy, shellRx);
      voidGrad.addColorStop(0, '#000003');
      voidGrad.addColorStop(0.28, '#040911');
      voidGrad.addColorStop(0.66, '#0a1622');
      voidGrad.addColorStop(0.92, '#132232');
      voidGrad.addColorStop(1, '#1d2b34');
      ctx.fillStyle = voidGrad;
      ctx.fillRect(wx, wy, ww, wh);

      // Meridian structural trusses converging toward the hollow center
      ctx.strokeStyle = 'rgba(74,114,142,0.16)';
      ctx.lineWidth = 1.2;
      for (let m = 0; m < 16; m++) {
        const a = (m / 16) * Math.PI * 2 + 0.12;
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(a) * 58, sy + Math.sin(a) * 26);
        ctx.lineTo(sx + Math.cos(a) * shellRx, sy + Math.sin(a) * shellRy);
        ctx.stroke();
      }

      // 13 concentric deck tiers lining the inner wall of the shell
      // Third lit window flickers and snaps out on a slow loop ("你數到第三扇的時候，它熄了")
      const thirdCycle = t % 7.5;
      const thirdLit = thirdCycle < 3.6
        ? 1
        : thirdCycle < 4.2
          ? (Math.sin(t * 42) > 0 ? 0.75 : 0.08)
          : 0;

      for (let i = 1; i <= 13; i++) {
        const p = i / 13;
        const rx = 56 + Math.pow(p, 1.18) * 356;
        const ry = 23 + Math.pow(p, 1.18) * 176;
        const alpha = 0.1 + p * 0.28;

        ctx.strokeStyle = `rgba(18,32,44,${0.32 + p * 0.25})`;
        ctx.lineWidth = 3 + p * 8;
        ctx.beginPath();
        ctx.ellipse(sx, sy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(98,146,176,${alpha})`;
        ctx.lineWidth = 0.8 + p * 1.4;
        ctx.beginPath();
        ctx.ellipse(sx, sy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();

        const count = 16 + i * 4;
        const winW = 2.4 + p * 4.5;
        const winH = 1.5 + p * 2.2;
        for (let j = 0; j < count; j++) {
          const a = (j / count) * Math.PI * 2 + i * 0.37;
          if ((i * 11 + j * 5) % 6 === 0) continue;
          const px = sx + Math.cos(a) * rx;
          const py = sy + Math.sin(a) * ry;
          const isThird = (i === 7 && j === 24);
          const isLit = (i === 5 && j === 19) || (i === 6 && j === 11) || (i === 9 && j === 35) || (i === 10 && j === 7);

          if (isThird) {
            if (thirdLit > 0.1) {
              const hg = ctx.createRadialGradient(px, py, 1, px, py, 12);
              hg.addColorStop(0, `rgba(255,232,146,${0.48 * thirdLit})`);
              hg.addColorStop(1, 'rgba(255,220,120,0)');
              ctx.fillStyle = hg;
              ctx.beginPath();
              ctx.arc(px, py, 12, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.fillStyle = thirdLit > 0.1
              ? `rgba(255,236,158,${0.92 * thirdLit})`
              : 'rgba(28,42,54,0.42)';
          } else if (isLit) {
            ctx.fillStyle = 'rgba(235,210,126,0.85)';
          } else {
            ctx.fillStyle = `rgba(42,64,82,${0.25 + p * 0.16})`;
          }
          ctx.fillRect(px - winW / 2, py - winH / 2, winW, winH);
        }
      }

      // Stretched starlight lines frozen around the mid-shell void
      ctx.lineCap = 'round';
      for (let k = 0; k < 20; k++) {
        const a = (k / 20) * Math.PI * 2 + 0.28;
        const r = 82 + (k % 5) * 26;
        const x1 = sx + Math.cos(a - 0.08) * r;
        const y1 = sy + Math.sin(a - 0.08) * (r * 0.44);
        const x2 = sx + Math.cos(a + 0.08) * r;
        const y2 = sy + Math.sin(a + 0.08) * (r * 0.44);
        ctx.strokeStyle = `rgba(195,222,255,${0.1 + (k % 3) * 0.05})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      ctx.restore(); // end inner shell clip

      // Subtle outer rim glow where Level 0's yellow heat presses against the dark shell
      ctx.strokeStyle = 'rgba(205,182,88,0.22)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(sx, sy, shellRx, shellRy, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 3. The center: quiet gravitational lensing ring shaped like a closed eye
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(-0.22);

      const breath = Math.sin(t * 0.9) * 1.4;
      const lensGlow = ctx.createRadialGradient(0, 0, 8, 0, 0, 92);
      lensGlow.addColorStop(0, 'rgba(0,0,4,0.95)');
      lensGlow.addColorStop(0.45, 'rgba(95,140,205,0.16)');
      lensGlow.addColorStop(0.75, 'rgba(210,190,115,0.08)');
      lensGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = lensGlow;
      ctx.beginPath();
      ctx.ellipse(0, 0, 94, 46, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dark quiet core swallowing background light
      ctx.fillStyle = '#000003';
      ctx.beginPath();
      ctx.moveTo(-48, 0);
      ctx.quadraticCurveTo(0, -21 - breath * 0.5, 48, 0);
      ctx.quadraticCurveTo(0, 21 + breath * 0.5, -48, 0);
      ctx.closePath();
      ctx.fill();

      // Bent light arcs forming the upper & lower "closed eyelids"
      for (let k = 0; k < 4; k++) {
        const span = 54 + k * 8;
        const arch = 16 + k * 4.6 + breath * (0.4 + k * 0.15);
        ctx.strokeStyle = k === 0
          ? 'rgba(225,242,255,0.68)'
          : k === 3
            ? 'rgba(224,200,122,0.32)'
            : `rgba(160,205,250,${0.4 - k * 0.06})`;
        ctx.lineWidth = k === 0 ? 2.1 : 1.3;
        ctx.beginPath();
        ctx.moveTo(-span, 0);
        ctx.quadraticCurveTo(0, -arch, span, 0);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-span, 0);
        ctx.quadraticCurveTo(0, arch, span, 0);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(195,225,255,0.44)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-50, 0);
      ctx.quadraticCurveTo(0, 2.5, 50, 0);
      ctx.stroke();
      ctx.restore();

      // 4. Glass pane reflections, forehead condensation smudge & console LED reflection
      const sheenX = 120 + Math.sin(t * 0.35) * 35;
      ctx.fillStyle = 'rgba(200,228,245,0.045)';
      ctx.beginPath();
      ctx.moveTo(sheenX, wy);
      ctx.lineTo(sheenX + 95, wy);
      ctx.lineTo(sheenX - 45, wy + wh);
      ctx.lineTo(sheenX - 140, wy + wh);
      ctx.closePath();
      ctx.fill();

      const fogAlpha = 0.055 + Math.sin(t * 1.4) * 0.018;
      const fog = ctx.createRadialGradient(sx - 28, sy + 18, 4, sx - 28, sy + 18, 62);
      fog.addColorStop(0, `rgba(215,235,245,${fogAlpha})`);
      fog.addColorStop(1, 'rgba(215,235,245,0)');
      ctx.fillStyle = fog;
      ctx.beginPath();
      ctx.arc(sx - 28, sy + 18, 62, 0, Math.PI * 2);
      ctx.fill();

      if (Math.sin(t * 3) > 0) {
        const ledGlow = ctx.createRadialGradient(sx + 18, wy + wh - 10, 2, sx + 18, wy + wh - 10, 34);
        ledGlow.addColorStop(0, 'rgba(255,95,70,0.22)');
        ledGlow.addColorStop(1, 'rgba(255,95,70,0)');
        ctx.fillStyle = ledGlow;
        ctx.fillRect(sx - 20, wy + wh - 44, 76, 44);
      }

      ctx.restore(); // end glass viewport clip

      // 5. Four-pane window mullions & heavy station frame
      const mullions = [wx + ww * 0.25 - 6, wx + ww * 0.5 - 6, wx + ww * 0.75 - 6];
      for (const mx of mullions) {
        ctx.fillStyle = '#192026';
        ctx.fillRect(mx - 2, wy, 16, wh);
        const mg = ctx.createLinearGradient(mx, 0, mx + 12, 0);
        mg.addColorStop(0, '#96a5ad');
        mg.addColorStop(0.45, '#687780');
        mg.addColorStop(1, '#3e4a52');
        ctx.fillStyle = mg;
        ctx.fillRect(mx, wy, 12, wh);
      }

      ctx.strokeStyle = '#151b20';
      ctx.lineWidth = 10;
      ctx.strokeRect(wx - 3, wy - 3, ww + 6, wh + 6);
      ctx.strokeStyle = '#8b9ba3';
      ctx.lineWidth = 4;
      ctx.strokeRect(wx, wy, ww, wh);

      for (const rx of [68, 260, 480, 700, 892]) {
        drawScrew(ctx, rx, 26, 5, 0.3 + rx * 0.01);
        drawScrew(ctx, rx, 460, 5, -0.4 + rx * 0.01);
      }

      ctx.fillStyle = 'rgba(165,195,208,0.62)';
      ctx.font = '600 11px ui-monospace, monospace';
      ctx.fillText('ZENITH // OBS-01', 50, 463);
      ctx.textAlign = 'right';
      ctx.fillText('CORE VIEWPORT', 910, 463);
      ctx.textAlign = 'left';

      vignette(ctx, 0.44);
    },
    drawView(ctx, t) {
      // Through the camcorder viewfinder: the warped light ring at the center appears MUCH larger
      const wx = 44, wy = 46, ww = 872, wh = 398;
      const sx = CX, sy = 244;
      ctx.save();
      ctx.beginPath();
      ctx.rect(wx, wy, ww, wh);
      ctx.clip();

      const pulse = Math.sin(t * 2.1) * 4;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(-0.22);

      const aura = ctx.createRadialGradient(0, 0, 26, 0, 0, 240);
      aura.addColorStop(0, 'rgba(0,0,6,0.65)');
      aura.addColorStop(0.35, 'rgba(110,210,255,0.22)');
      aura.addColorStop(0.7, 'rgba(225,205,120,0.12)');
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.ellipse(0, 0, 240, 118, 0, 0, Math.PI * 2);
      ctx.fill();

      for (let k = 0; k < 6; k++) {
        const rx = 108 + k * 23 + pulse * (0.4 + k * 0.12);
        const ry = 42 + k * 10 + pulse * 0.35;
        ctx.strokeStyle = k % 2 === 0
          ? `rgba(145,235,255,${0.48 - k * 0.06})`
          : `rgba(245,222,145,${0.32 - k * 0.04})`;
        ctx.lineWidth = 2.2 - k * 0.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Inside the viewfinder, the "closed eye" parts slightly into a slit staring back
      ctx.fillStyle = '#010205';
      ctx.beginPath();
      ctx.ellipse(0, 0, 64, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(185,245,255,0.72)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-64, 0);
      ctx.quadraticCurveTo(0, -24, 64, 0);
      ctx.quadraticCurveTo(0, 24, -64, 0);
      ctx.stroke();

      ctx.fillStyle = 'rgba(215,248,255,0.78)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 4.5, 16, 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = 'rgba(130,240,195,0.88)';
      ctx.font = '700 12px ui-monospace, monospace';
      ctx.fillText('OPTICAL DISTORTION // GRAV-LENS ANOMALY', 74, 88);
      ctx.fillText('APPARENT DIAMETER: 3.4x', 74, 106);
      ctx.restore();
    },
    hotspots: [
      {
        id: 'cu_core_outer',
        rect: [44, 46, 872, 398],
        label: '球殼內壁與外層黃色空間',
        cursor: 'look',
        click: (g) => g.say(g.s.view
          ? '觀景窗裡，整個球殼內壁的輪廓都被中心那圈光拉歪了。外層堆疊的黃色房間正把整座空間站包在裡面。'
          : '一層又一層漆黑的甲板沿著球殼內壁向遠方彎曲，只有少數窗戶還亮著微弱的燈。在更遠的外側，無止盡的黃色房間像樓層一樣往上疊。'),
      },
      {
        id: 'cu_core_center',
        rect: [340, 145, 280, 200],
        label: '把額頭貼上玻璃，看著球殼的中心',
        cursor: 'look',
        click: (g) => g.read('n01_core'),
      },
    ],
  },

  l1_substation_panel: {
    title: '第一區變電所・高壓配電盤',
    draw(ctx, t, s) {
      const powered = !!s.flags.l1_power;
      ctx.fillStyle = '#25282c';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#363b40';
      ctx.fillRect(90, 50, 780, 420);
      ctx.strokeStyle = '#181a1d'; ctx.lineWidth = 6;
      ctx.strokeRect(90, 50, 780, 420);

      // Fuse bay on the left
      ctx.fillStyle = '#1c1f22';
      ctx.fillRect(135, 110, 240, 290);
      ctx.strokeStyle = '#687078'; ctx.lineWidth = 2;
      ctx.strokeRect(135, 110, 240, 290);
      ctx.fillStyle = '#cfd4d8';
      ctx.font = 'bold 13px ui-monospace, monospace';
      ctx.fillText('FEEDER-B  11kV FUSE', 165, 138);

      // Brass clips
      ctx.fillStyle = '#b48a34';
      ctx.fillRect(225, 165, 60, 24);
      ctx.fillRect(225, 325, 60, 24);
      if (powered) {
        ctx.fillStyle = '#dfd0a8';
        ctx.fillRect(233, 189, 44, 136);
        ctx.fillStyle = '#b43a2a';
        ctx.fillRect(233, 242, 44, 24);
        ctx.fillStyle = '#d4a644';
        ctx.fillRect(229, 175, 52, 18);
        ctx.fillRect(229, 321, 52, 18);
      } else {
        ctx.fillStyle = '#0d0f11';
        ctx.fillRect(237, 192, 36, 130);
        ctx.strokeStyle = '#553a2a'; ctx.lineWidth = 2;
        ctx.strokeRect(237, 192, 36, 130);
      }

      // Analog voltmeter on top right
      ctx.fillStyle = '#e8e2ce';
      ctx.fillRect(450, 105, 360, 160);
      ctx.strokeStyle = '#1c2024'; ctx.lineWidth = 4;
      ctx.strokeRect(450, 105, 360, 160);
      ctx.strokeStyle = '#3a3832'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(630, 245, 115, Math.PI * 1.18, Math.PI * 1.82);
      ctx.stroke();
      const angle = powered ? -0.45 + Math.sin(t * 22) * 0.025 : -1.05;
      ctx.strokeStyle = '#c82d20'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(630, 245);
      ctx.lineTo(630 + Math.sin(angle) * 102, 245 - Math.cos(angle) * 102);
      ctx.stroke();
      ctx.fillStyle = '#24221e';
      ctx.font = 'bold 14px ui-monospace, monospace';
      ctx.fillText(powered ? '11.0 kV  NOMINAL' : '0.0 kV  OPEN CIRCUIT', 540, 232);

      // Feeder status lamps
      const rows = [
        ['FEEDER A  OUTPOST/FOG', true],
        ['FEEDER B  FREIGHT LIFT', powered],
        ['FEEDER C  CTRL/ARCHIVE', powered],
      ];
      rows.forEach(([label, on], i) => {
        const y = 305 + i * 42;
        ctx.fillStyle = '#1e2226';
        ctx.fillRect(450, y, 360, 32);
        ctx.fillStyle = on ? '#42e078' : '#b83228';
        ctx.beginPath(); ctx.arc(474, y + 16, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#d4dadf';
        ctx.font = '13px ui-monospace, monospace';
        ctx.fillText(label, 496, y + 21);
      });
      vignette(ctx, 0.56);
    },
    hotspots: [
      {
        id: 'cu_fuse_slot',
        rect: [135, 110, 240, 290],
        label: 'B 路高壓保險絲槽',
        cursor: 'look',
        click: (g) => {
          if (g.s.flags.l1_power) return g.say('高壓保險絲已經裝好，銅接點穩定通電中。');
          g.say('卡槽是空的，只剩焦黑的痕跡。需要一顆「高壓保險絲」才能恢復這一區的供電。');
        },
        use: {
          l1_fuse: (g) => {
            if (g.s.flags.l1_power) return g.say('已經通電了。');
            g.take('l1_fuse');
            g.flag('l1_power');
            g.sfx('ok');
            g.say('你將高壓保險絲壓進黃銅夾片。電壓表指針彈上 11 kV，三盞饋線燈號全部轉綠！');
          },
        },
      },
      {
        id: 'cu_sub_meter',
        rect: [450, 105, 360, 320],
        label: '電壓表與饋線狀態',
        cursor: 'look',
        click: (g) => g.say(g.s.flags.l1_power
          ? '電壓穩定在 11 kV。貨運電梯檢修門、管制走廊照明與資料室磁力門都已經過電。'
          : '電壓歸零。FEEDER B（貨運電梯）與 FEEDER C（管制區／資料室）全都亮著紅燈。'),
      },
    ],
  },

  l1_freezer_porthole: {
    title: '零號冷庫・結霜圓窗',
    draw(ctx, t) {
      ctx.fillStyle = '#3f474c';
      ctx.fillRect(0, 0, W, H);
      // Heavy riveted steel door
      ctx.fillStyle = '#606b72';
      ctx.beginPath(); ctx.arc(CX, CY, 195, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0e1d28';
      ctx.beginPath(); ctx.arc(CX, CY, 152, 0, Math.PI * 2); ctx.fill();
      // Cold mist drifting behind glass
      for (let i = 0; i < 6; i++) {
        const mx = CX + Math.sin(t * 0.6 + i * 1.3) * 70;
        const my = CY + Math.cos(t * 0.45 + i * 2.1) * 50;
        const g = ctx.createRadialGradient(mx, my, 4, mx, my, 95);
        g.addColorStop(0, 'rgba(180,225,245,0.22)');
        g.addColorStop(1, 'rgba(180,225,245,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(mx, my, 95, 0, Math.PI * 2); ctx.fill();
      }
      // Frost rim
      ctx.strokeStyle = 'rgba(225,245,255,0.5)'; ctx.lineWidth = 14;
      ctx.beginPath(); ctx.arc(CX, CY, 146, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#2b3238'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.arc(CX, CY, 162, 0, Math.PI * 2); ctx.stroke();
      vignette(ctx, 0.68);
    },
    drawView(ctx, t) {
      ctx.save();
      ctx.globalAlpha = 0.62 + Math.sin(t * 3) * 0.08;
      ctx.fillStyle = '#c8f5e2';
      for (const [hx, hy] of [[CX - 46, CY + 12], [CX + 44, CY - 14]]) {
        ctx.beginPath(); ctx.ellipse(hx, hy, 22, 28, 0, 0, Math.PI * 2); ctx.fill();
        for (let f = -2; f <= 2; f++) {
          ctx.beginPath(); ctx.ellipse(hx + f * 9, hy - 36 + Math.abs(f) * 4, 4, 15, f * 0.08, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.font = 'bold 13px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('INNER GLASS // -18°C // NO COMPRESSOR', CX, CY + 122);
      ctx.restore();
    },
    hotspots: [
      {
        id: 'cu_porthole',
        rect: [CX - 160, CY - 160, 320, 320],
        label: '貼近圓窗往裡看',
        cursor: 'look',
        click: (g) => {
          if (g.s.view) {
            if (!g.s.flags.l1_porthole_seen) { g.flag('l1_porthole_seen'); g.sanity(-5); }
            return g.say('觀景窗裡，兩隻蒼白的掌印從玻璃內側死死按著霜面——但隔間裡面明明什麼也沒有。');
          }
          g.say('厚重的冰霜把圓窗糊得只剩一片冷藍的霧。奇怪的是，霜全都結在玻璃內側。');
        },
      },
    ],
  },

  l1_archive_crt: {
    title: '第一層資料室・琥珀色終端機',
    draw(ctx, t) {
      ctx.fillStyle = '#18140e';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#332c22';
      ctx.fillRect(110, 44, 740, 430);
      ctx.fillStyle = '#191206';
      ctx.fillRect(150, 76, 660, 354);
      ctx.strokeStyle = '#5c4d38'; ctx.lineWidth = 5;
      ctx.strokeRect(150, 76, 660, 354);

      ctx.fillStyle = '#ffb84a';
      ctx.font = 'bold 15px ui-monospace, monospace';
      const lines = [
        'M.E.G. ARCHIVE TERMINAL  //  LEVEL 1 HABITABLE ZONE',
        '----------------------------------------------------',
        'SECTOR 1-A  WAREHOUSE / ARRIVAL ....... [ACTIVE]',
        'SECTOR 1-B  DOCK / CISTERN / SUBSTATION [ONLINE]',
        'SECTOR 1-C  NORTH SCORCHED / OUTPOST .. [EVACUATED]',
        'SECTOR 1-D  GARDEN / OUROBOROS WORKS .. [CONTAINED]',
        '----------------------------------------------------',
        'CROSS-REF FILE: RECORD 0120 / J.H.',
        'STATUS: ARCHIVED // SUBJECT STILL LOOPING',
      ];
      lines.forEach((ln, i) => ctx.fillText(ln, 184, 120 + i * 30));
      if (Math.floor(t * 2) % 2 === 0) ctx.fillRect(184, 386, 12, 18);

      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      for (let y = 76; y < 430; y += 4) ctx.fillRect(150, y, 660, 1);
      vignette(ctx, 0.54);
    },
    drawView(ctx) {
      ctx.save();
      ctx.fillStyle = 'rgba(185,255,215,0.88)';
      ctx.font = 'bold 14px ui-monospace, monospace';
      ctx.fillText('CAM OVERLAY: RECORD 0120 MATCH', 184, 412);
      ctx.restore();
    },
    hotspots: [
      {
        id: 'cu_crt_map',
        rect: [150, 76, 660, 210],
        label: '檢視第一層區塊圖',
        cursor: 'look',
        click: (g) => g.say('螢幕顯示了完整的 Level 1 區域拓撲：從倉庫與裝卸月台、地下蓄水池與變電所、燒毀的北區前哨站，一路延伸到溫室與銜尾蛇工地。'),
      },
      {
        id: 'cu_crt_log',
        rect: [150, 286, 660, 144],
        label: '讀取 #0120 索引紀錄',
        cursor: 'look',
        click: (g) => g.say('終端機閃爍了一下：「警告：0120 號房並不存在於第一層平面圖上，但所有通風管與走廊最終都偵測到同一段錄音訊號。」'),
      },
    ],
  },

  l1_clipp_poster: {
    title: '阿麗亞娜集團・C.L.I.P.P. 協議海報',
    draw(ctx) {
      ctx.fillStyle = '#1c2428';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ece6d4';
      ctx.fillRect(140, 38, 680, 444);
      ctx.strokeStyle = '#3c4a52'; ctx.lineWidth = 6;
      ctx.strokeRect(140, 38, 680, 444);
      ctx.fillStyle = '#263842';
      ctx.fillRect(140, 38, 680, 68);
      ctx.fillStyle = '#f2ede0';
      ctx.font = 'bold 22px ui-monospace, monospace';
      ctx.fillText('ARIANE CIRCLE // C.L.I.P.P. PROTOCOL', 200, 80);

      const steps = [
        ['C', '評估環境 Check your environment — 確認威脅與建築結構'],
        ['L', '找尋出口 Locate an exit — 尋找門、窗、反向切出或閾界'],
        ['I', '查資料庫 Inspect the database — 比對層級與安全出口情報'],
        ['P', '準備裝備 Prepare your equipment — 手電筒、工具、乾淨衣物'],
        ['P', '觀察環境 Perimeter your environment — 建立臨時安全區'],
      ];
      steps.forEach(([k, desc], i) => {
        const y = 136 + i * 64;
        ctx.fillStyle = '#2d4a58';
        ctx.fillRect(175, y, 44, 44);
        ctx.fillStyle = '#fff8e8';
        ctx.font = 'bold 24px ui-monospace, monospace';
        ctx.fillText(k, 190, y + 30);
        ctx.fillStyle = '#242a2e';
        ctx.font = '15px sans-serif';
        ctx.fillText(desc, 236, y + 28);
      });
      vignette(ctx, 0.48);
    },
    hotspots: [
      {
        id: 'cu_clipp_read',
        rect: [140, 38, 680, 444],
        label: '細讀 C.L.I.P.P. 協議',
        cursor: 'look',
        click: (g) => {
          g.flag('l1_clipp_read');
          g.say('阿麗亞娜集團的赫爾墨斯團隊提醒：面對完全陌生的層級切出時，依序執行 C-L-I-P-P 五步，才不會在混亂中喪命。Level 1 只是旅程的起點。');
        },
      },
    ],
  },

  l1_entity_manual: {
    title: '希波克拉底-1・《宜居地帶常見實體圖鑑》',
    draw(ctx) {
      ctx.fillStyle = '#181e1c';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#dfd8c4';
      ctx.fillRect(90, 38, 780, 448);
      ctx.strokeStyle = '#3b4a42'; ctx.lineWidth = 4;
      ctx.strokeRect(90, 38, 780, 448);
      ctx.fillStyle = '#273830';
      ctx.fillRect(90, 38, 780, 52);
      ctx.fillStyle = '#edf2e6';
      ctx.font = 'bold 18px ui-monospace, monospace';
      ctx.fillText('HIPPOCRATES-1 // LEVEL 1 ENTITY COMPENDIUM (11 SPECIES)', 135, 70);

      const entities = [
        ['1. 手臂 Arms', '停電時自通風管伸出 → 用手電筒照射驅離'],
        ['2. 肢團 Clumps', '成團肢體高速衝刺 → 無視覺，保持安靜'],
        ['3. 爬菌 Crawler', '致病真菌 → 禁飲未密封水坑與變質食物'],
        ['4. 鈍人 Dullers', '切行穿牆突襲 → 聽見抓刮聲立刻遠離牆面'],
        ['5. 啼物 Weepers', '線纜組成智力低下 → 朝頭頂丟重物或扯斷線纜'],
        ['6. 獵犬 Hounds', '犬形野獸人態 → 不可避時直視眼睛並製造噪音'],
        ['7. Nguithr\'xurh', '天花板發光球狀蛛網 → 絕不從網下走過'],
        ['8. 竊皮者 Skin-Stealer', '披人皮說「全鬆垮了」→ 對話辨識後冷靜遠離'],
        ['9. 笑魘 Smilers', '趨光發光獸面 → 關掉光源或丟棄誘餌'],
        ['10. 牧蛇 Wranglers', '鑽牆催眠巨蛇 → 牆頂震動時安靜離開'],
        ['11. 悲屍 Wretches', '攻擊性強不死人形 → 就算聽懂牠說的話也別互動'],
      ];
      entities.forEach(([name, tip], i) => {
        const y = 116 + i * 32;
        ctx.fillStyle = i % 2 ? 'rgba(40,55,48,0.08)' : 'rgba(40,55,48,0.02)';
        ctx.fillRect(108, y - 18, 744, 28);
        ctx.fillStyle = '#1f2b25';
        ctx.font = 'bold 13px ui-monospace, monospace';
        ctx.fillText(name, 120, y);
        ctx.fillStyle = '#3a4640';
        ctx.font = '13px sans-serif';
        ctx.fillText(tip, 320, y);
      });
      vignette(ctx, 0.45);
    },
    hotspots: [
      {
        id: 'cu_entity_list',
        rect: [90, 38, 780, 448],
        label: '記下 11 種實體與瘟疫地精應對守則',
        cursor: 'look',
        click: (g) => {
          if (!g.s.flags.l1_entity_studied) { g.flag('l1_entity_studied'); g.sanity(5); }
          g.say('阿麗亞娜集團與「引領者」當年合作整理的這份圖鑑涵蓋了全 11 種宜居地帶實體——還附註遇到「瘟疫地精」時可用刀或斧頭嚇退。');
        },
      },
    ],
  },

  l1_crate_open_cu: {
    title: '開箱檢視・商人保險庫補給箱',
    draw(ctx) {
      ctx.fillStyle = '#1b1814';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#6c5336';
      ctx.fillRect(160, 75, 640, 380);
      ctx.fillStyle = '#2d2318';
      ctx.fillRect(190, 105, 580, 320);

      // Left compartment: dangerous solid nitrogen & broken glass
      ctx.fillStyle = '#4e5d66';
      ctx.fillRect(215, 130, 240, 260);
      ctx.fillStyle = '#b4e4ff';
      ctx.fillRect(245, 165, 80, 70);
      ctx.fillStyle = '#dcebf2';
      ctx.font = 'bold 12px ui-monospace, monospace';
      ctx.fillText('CAUTION: SOLID N2 & GLASS', 225, 370);

      // Right compartment: yarn ball & sealed ration
      ctx.fillStyle = '#4d4436';
      ctx.fillRect(485, 130, 255, 260);
      ctx.fillStyle = '#4e7aa8';
      ctx.beginPath(); ctx.arc(560, 230, 38, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8dfc2';
      ctx.fillRect(630, 190, 72, 95);
      ctx.fillStyle = '#24201a';
      ctx.fillText('YARN + SEALED', 530, 370);
      vignette(ctx, 0.56);
    },
    hotspots: [
      {
        id: 'cu_crate_hazard',
        rect: [215, 130, 240, 260],
        label: '固態氮塊與碎玻璃隔層',
        cursor: 'look',
        click: (g) => g.say('卡魯姆的指南說得沒錯——這半邊塞滿碎玻璃與冒白煙的固態氮塊，直接伸手進去肯定受傷。'),
      },
      {
        id: 'cu_crate_safe',
        rect: [485, 130, 255, 260],
        label: '安全物資隔層（毛線球與口糧）',
        cursor: 'take',
        click: (g) => {
          if (g.s.flags.l1_vault_crate_loot) return g.say('安全隔層已經搜刮乾淨了。');
          g.flag('l1_vault_crate_loot');
          g.give('yarn');
          g.give('almond');
          g.say('你小心避開碎玻璃，取出一個藍色「紗線球」和一瓶密封「杏仁水」！');
        },
      },
    ],
  },

  l1_hub_doors: {
    title: '異層閾界走廊・出入口近距離觀測',
    draw(ctx, t) {
      ctx.fillStyle = '#121518';
      ctx.fillRect(0, 0, W, H);
      // 4 iconic portals: glass (22), frozen steel (159), pure white wood (998.2), Mach+ TV (201)
      const portals = [
        [80, '#5a8090', '玻璃門\nLv.22'],
        [290, '#7ca2b4', '結冰鐵門\nLv.159'],
        [500, '#e6e4dc', '純白木門\nLv.998.2'],
        [710, '#2c2f34', 'Mach+ TV\nLv.201'],
      ];
      portals.forEach(([x, col, label], i) => {
        ctx.fillStyle = col;
        ctx.fillRect(x, 100, 170, 310);
        ctx.strokeStyle = '#22262a'; ctx.lineWidth = 4;
        ctx.strokeRect(x, 100, 170, 310);
        if (i === 3) {
          ctx.fillStyle = Math.sin(t * 9) > 0 ? '#d8649e' : '#64d8c8';
          ctx.fillRect(x + 22, 130, 126, 95);
        }
        ctx.fillStyle = i === 2 ? '#222' : '#eef2f4';
        ctx.font = 'bold 13px ui-monospace, monospace';
        const [a, b] = label.split('\n');
        ctx.fillText(a, x + 20, 442);
        ctx.fillText(b, x + 20, 462);
      });
      vignette(ctx, 0.58);
    },
    hotspots: [
      {
        id: 'cu_portals_inspect',
        rect: [80, 100, 800, 360],
        label: '檢視各閾界門與 Mach+ 電視',
        cursor: 'look',
        click: (g) => g.say('這裡聚集著通往後室其他層級的危險閾界：玻璃門通往 Level 22、結冰鐵門通往 Level 159、純白木門通往 Level 998.2、插著 Mach+ 錄影帶的電視會把人吸入 Level 201「美學」——沒準備好千萬別踏進去。'),
      },
    ],
  },
};


