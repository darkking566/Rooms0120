// Real-pointer routes through every new level, including hazards, persistence and touch layout.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright');

(async () => {
  const { createServer } = await import('../server.mjs');
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
    let page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const errors = [];
    const watch = (p) => {
      p.on('pageerror', (e) => errors.push(e.message));
      p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    };
    watch(page);
    const url = `http://127.0.0.1:${server.address().port}/`;
    const state = () => page.evaluate(() => window.__rooms.state);
    const check = (cond, msg) => { assert.ok(cond, msg); console.log(`  ✓ ${msg}`); };
    const shot = async (name) => {
      if (!process.env.SHOTS) return;
      fs.mkdirSync(process.env.SHOTS, { recursive: true });
      await page.waitForTimeout(380);
      await page.locator('#stage').screenshot({ path: path.join(process.env.SHOTS, `${name}.png`) });
    };
    async function hit(id) {
      const hs = await page.evaluate(() => window.__rooms.hotspots());
      const h = hs.find((h) => h.id === id);
      assert.ok(h, `Missing hotspot ${id} in ${(await state()).scene}`);
      const b = await page.locator('#game').boundingBox();
      const [x, y, w, hh] = h.rect;
      await page.mouse.click(b.x + ((x + w / 2) / 960) * b.width, b.y + ((y + hh / 2) / 540) * b.height);
      await page.waitForTimeout(80);
    }
    // fixed seed: random events happen the same way every run
    async function start() {
      await page.goto(`${url}?seed=120`);
      await page.click('#btnNew');
    }
    // Each sublevel has its own way in, spread across Level 0.
    async function walkPillars() {
      await hit('side'); await hit('annex');
      for (let i = 0; i < 4; i++) await hit((await state()).flags.l01_mark);
    }
    const enter = {
      zenith: async () => { await walkPillars(); },
      ice: async () => { await hit('forward'); await hit('vent'); await hit('frost'); },
      flood: async () => {
        await page.evaluate(() => { const g = window.__rooms.g; g.s.bo = { step: 0, dir: 'ahead' }; g.go('l0_blackout'); });
        await hit('ahead'); await hit('down');
      },
      memory: async () => { await page.evaluate(() => window.__rooms.g.go('l0_faded')); await hit('older'); },
    };
    async function reload() {
      await page.reload(); await page.click('#btnCont');
    }
    async function use(item, target) {
      await page.click(`.slot[data-id="${item}"]`); await hit(target);
    }
    const closeDoc = () => page.click('#docClose');

    // Timed hazards follow the game clock; wait for the right moment instead of guessing.
    const waitClock = (fn) => page.waitForFunction(`(() => { const c = window.__rooms.state.clock; return (${fn})(c); })()`, null, { polling: 'raf', timeout: 20000 });
    const doorOpenNow = '(c) => { const k = c % 3.6; return k > 1.95 && k < 2.75; }';
    const doorShutNow = '(c) => { const k = c % 3.6; return k > 0.2 && k < 1.2; }';
    const ventLowNow = '(c) => { const k = c / 2.4; return [0, 3, 4, 1, 2, 4, 3, 0, 4, 2][Math.floor(k) % 10] === 4 && k % 1 > 0.1 && k % 1 < 0.8; }';
    const ventHighNow = '(c) => { const k = c / 2.4; return [0, 3, 4, 1, 2, 4, 3, 0, 4, 2][Math.floor(k) % 10] !== 4 && k % 1 > 0.1 && k % 1 < 0.8; }';
    const sparkNow = '(c) => { const k = c % 3.2; return k > 0.15 && k < 1.0; }';
    const calmNow = '(c) => { const k = c % 3.2; return k > 1.5 && k < 2.9; }';
    const count = async (id) => (await state()).inv.filter((i) => i === id).length;

    console.log('Level 0.1 — Zenith Station');
    await start(); await hit('side'); await hit('annex'); await shot('sub-00-annex');
    check((await state()).scene === 'l0_annex', 'B.N.T.G. route starts from the pillar room');
    await hit('guide'); await closeDoc();
    const mark = (await state()).flags.l01_mark;
    await hit(mark); check((await state()).flags.l01_walk === 1, 'following the arrow advances the route');
    await hit((await state()).flags.l01_mark === 'left' ? 'right' : 'left');
    check((await state()).scene === 'l0_annex' && (await state()).flags.l01_walk === 0, 'the wrong side restarts the route');
    for (let i = 0; i < 4; i++) await hit((await state()).flags.l01_mark);
    check((await state()).scene === 'l01_airlock', 'four arrows lead to the station');
    check(await page.textContent('#lvlName') === 'LEVEL 0.1', 'sublevel name appears in HUD');
    await hit('note'); await closeDoc();
    await waitClock(doorShutNow); const pinched = (await state()).sanity; await hit('forward');
    check((await state()).scene === 'l01_airlock' && (await state()).sanity < pinched, 'the looping door pinches you when it is shut');
    await waitClock(doorOpenNow); await shot('sub-01-airlock'); await hit('forward');
    check((await state()).scene === 'l01_ring', 'timing the open door gets you into the ring corridor');
    await shot('sub-02-ring');
    await hit('forward'); check((await state()).scene === 'l01_ring', 'the overheated section blocks the way to the core');
    await hit('quarters'); await shot('sub-03-quarters');
    await hit('terminal'); await closeDoc(); await hit('locker'); await hit('locker');
    check(await count('zcard') === 1, 'the crew locker gives one keycard');
    await hit('cot'); const rested = (await state()).sanity; await hit('cot');
    check((await state()).flags.l01_rested && (await state()).sanity === rested, 'the cot rests you once');
    await hit('back'); await hit('galley'); await shot('sub-04-galley');
    const hunger0 = (await state()).hunger; await hit('robot');
    check((await state()).hunger > hunger0, 'the cooking arm serves a seventh tray');
    await hit('water'); await hit('green'); await shot('sub-05-greenhouse');
    await hit('tomato'); await hit('console');
    check(!(await page.evaluate(() => window.__rooms.hotspots())).some((h) => h.id === 'cut_airlock'), 'the climate console needs the keycard');
    await use('zcard', 'console'); await shot('sub-06-climate');
    check((await page.evaluate(() => window.__rooms.hotspots())).some((h) => h.id === 'cut_greenhouse'), 'the keycard opens the climate choice');
    await hit('cancel'); check(!(await page.evaluate(() => window.__rooms.hotspots())).some((h) => h.id === 'cut_greenhouse'), 'the choice can be put off');
    await hit('console'); await hit('cut_greenhouse');
    check((await state()).flags.l01_cut === 'greenhouse', 'shutting down a section frees the cooling');
    await reload(); check((await state()).flags.l01_cut === 'greenhouse' && !(await state()).inv.includes('zcard'), 'the climate choice persists');
    await hit('back'); await hit('back'); await hit('forward');
    check((await state()).scene === 'l01_core', 'the cooled section leads to the observation deck');
    await shot('sub-07-core');
    await hit('window'); await closeDoc(); await hit('console'); await closeDoc();
    await hit('back'); await hit('back'); await waitClock(doorOpenNow);
    check((await state()).scene === 'l01_airlock', 'the airlock stays open when another section was cut');
    await hit('back'); check((await state()).scene === 'l0_pillar', 'station has a return route to Level 0');
    // freezing the airlock instead closes the way back
    await start(); await enter.zenith(); await waitClock(doorOpenNow); await hit('forward');
    await page.evaluate(() => { const g = window.__rooms.g; g.flag('l01_cut', 'airlock'); });
    await hit('back'); check((await state()).scene === 'l01_ring', 'a frozen airlock cannot be reopened');
    await hit('forward'); await page.evaluate(() => window.__rooms.setRandom(() => 0.9));
    await hit('noclip'); await page.evaluate(() => window.__rooms.seed(120));
    check(['l1_arrive', 'l0_pillar'].includes((await state()).scene), 'the hull breach noclips you out of the station');
    await shot('sub-07-arrive-zenith');
    const s0 = (await state()).sanity; await hit('hull');
    check((await state()).sanity > s0, 'a frosted hull fragment follows you into Level 1');

    console.log('Level 0.2 — Remodeled Mess');
    await start(); await page.evaluate(() => window.__rooms.g.go('l0_dry')); await hit('door');
    check((await state()).scene === 'l02_room' && await page.textContent('#lvlName') === 'LEVEL 0.2', 'the dry corridor door opens on the remodelled hall');
    await shot('sub-02a-hall');
    const san02 = (await state()).sanity; await hit('router');
    check((await state()).sanity > san02, 'the working WiFi steadies you a little');
    await hit('wc'); await shot('sub-02b-wc');
    check((await state()).scene === 'l02_wc', 'a clean restroom off the hall');
    const thirst02 = (await state()).thirst; await hit('sink'); await hit('sink');
    check((await state()).thirst > thirst02 && (await state()).flags.l02_sink, 'the restroom tap gives clean water once per visit');
    await hit('towel'); await hit('towel'); check(await count('towel') === 1, 'one wet paper towel');
    await hit('stall'); await hit('mirror');
    await hit('back'); await hit('forward'); await shot('sub-02c-office');
    check((await state()).scene === 'l02_office', 'the site office at the end of the hall');
    await hit('clipboard'); check((await state()).notes.includes('n02_clip'), 'the clipboards hold the 102-CX work order');
    await closeDoc(); await hit('blueprint'); await hit('hat');
    await hit('toolbox');
    check((await state()).scene === 'l02_frame' && (await state()).flags.l02_collapsed, 'taking the screwdriver brings the rooms down');
    await shot('sub-02d-frame');
    const dust0 = (await state()).sanity; await page.waitForTimeout(4300);
    check((await state()).sanity < dust0, 'the dust chokes you while the house collapses');
    await page.click('.slot[data-id="towel"]'); await page.click('.slot[data-id="towel"]');
    check((await state()).flags.l02_mask && await count('towel') === 0, 'a wet paper towel over the mouth keeps the dust out');
    await hit('tape2'); await hit('back'); await shot('sub-02e-joists');
    const crack = (await state()).flags.l02_crack;
    await hit(crack);
    check((await state()).scene === 'l0_dry' && !(await state()).flags.l02_collapsed && !(await state()).flags.l02_mask, 'the cracked joist drops you back to Level 0 and the rooms reset');
    await hit('door'); check((await state()).scene === 'l02_room', 'next visit the remodelled hall is good as new');
    await hit('forward'); check((await state()).scene === 'l02_frame', 'once you have their tool, the office collapses as soon as you step in');
    await page.evaluate(() => { window.__rooms.state.flags.l02_until = window.__rooms.state.clock + 0.3; });
    await page.waitForTimeout(600);
    check((await state()).scene === 'l0_dry' && !(await state()).flags.l02_collapsed, 'running out of time brings the house down on you');
    await hit('door'); await hit('forward'); await hit('back');
    await hit((await state()).flags.l02_crack === 'left' ? 'right' : 'left');
    check((await state()).scene === 'l02_exit', 'the sound joist carries you over the void');
    await shot('sub-02f-exit');
    await waitClock('(c) => c % 2.8 > 0.1 && c % 2.8 < 0.8'); const hitT = (await state()).sanity; await hit('forward');
    check((await state()).scene === 'l02_exit' && (await state()).sanity < hitT, 'falling ceiling tiles knock you back');
    await waitClock('(c) => c % 2.8 > 1.2 && c % 2.8 < 2.4'); await hit('forward');
    check((await state()).scene === 'l0_dry' && !(await state()).flags.l02_collapsed, 'the collapse stops at the Level 0 door');

    console.log('Level 0.3 — Ice Rooms');
    await start(); await hit('forward');
    check(!(await page.evaluate(() => window.__rooms.hotspots())).some((h) => h.id === 'frost'), 'frost trail is noticed only after the vent');
    await hit('vent'); await hit('frost'); await shot('sub-08-ice-entry');
    check((await state()).scene === 'l03_entry', 'following the frost from the vent enters Level 0.3');
    const beforeCold = (await state()).sanity;
    await page.waitForTimeout(2800);
    check((await state()).sanity < beforeCold, 'cold drains sanity over time');
    await hit('block'); await hit('forward'); await shot('sub-09-ice-camp');
    await hit('clipboard'); const paused = (await state()).sanity;
    await page.waitForTimeout(2800);
    check((await state()).sanity === paused, 'reading pauses environmental damage'); await closeDoc();
    await hit('blowtorch'); check(!(await state()).inv.includes('blowtorch'), 'the frozen blowtorch will not light yet');
    await hit('icewall'); check((await state()).scene === 'l03_camp', 'the ice wall blocks the way on');
    await hit('wool'); check((await state()).inv.includes('wool'), 'the wool rug can be taken');
    await hit('vents'); await shot('sub-10-ice-vents');
    await waitClock(ventHighNow); await use('wool', 'vent');
    check(!(await state()).flags.l03_sealed && (await state()).inv.includes('wool'), 'a vent out of reach cannot be wrapped');
    await waitClock(ventLowNow); await use('wool', 'vent');
    check((await state()).flags.l03_sealed && !(await state()).inv.includes('wool'), 'the hopping vent is wrapped when it lands low');
    await shot('sub-11-ice-sealed');
    await hit('back'); const campWarm = (await state()).sanity;
    await page.waitForTimeout(2800);
    check((await state()).sanity === campWarm, 'the heater warms the camp once the fog is held back');
    await hit('blowtorch'); check((await state()).inv.includes('blowtorch'), 'the warmed canister lights the blowtorch');
    await use('blowtorch', 'icewall'); await hit('icewall');
    check((await state()).scene === 'l03_blocks', 'the blowtorch melts the frozen doorway');
    await shot('sub-12-ice-blocks');
    await use('blowtorch', 'supply'); check((await state()).inv.includes('can'), 'a frozen crate holds the crew supplies');
    await use('blowtorch', 'planes'); await closeDoc();
    check((await state()).flags.l03_planes, 'melting Planes leaves only his report');
    await use('blowtorch', 'backice'); await hit('backice');
    check((await state()).scene === 'l03_warm', 'the back wall opens onto the finished room');
    await shot('sub-13-ice-warm');
    await hit('print'); await closeDoc(); await hit('hat'); await hit('rest');
    await hit('exit');
    check((await state()).scene === 'l0_hall' && (await state()).flags.l03_thawed, 'the finished room lets you out into the hallway');
    check(!(await page.evaluate(() => window.__rooms.hotspots())).some((h) => h.id === 'frost'), 'thawed vent no longer leaves frost');

    // Retry must restore an achievable entry state, including puzzle items consumed later.
    await start(); await enter.ice(); await hit('forward'); await hit('wool');
    await page.evaluate(() => window.__rooms.g.sanity(-100));
    await page.waitForSelector('#ending:not([hidden])'); await page.click('#btnRetry');
    check((await state()).scene === 'l03_entry' && !(await state()).flags.l03_wool, 'retry restores the new level entry checkpoint');
    await hit('forward'); await hit('wool');
    check((await state()).inv.includes('wool'), 'puzzle supplies can be recovered after retry');

    console.log('Level 0.5 — Drenched Sanatorium');
    await start(); await enter.flood(); await shot('sub-14-flood');
    check((await state()).scene === 'l05_flood', 'stairs in the blackout zone lead down into Level 0.5');
    await hit('diary'); await closeDoc();
    const thirst0 = (await state()).thirst, sane0 = (await state()).sanity; await hit('drink');
    check((await state()).thirst > thirst0 && (await state()).sanity < sane0, 'the dirty water quenches thirst but makes you sick');
    await hit('forward'); await shot('sub-15-planks');
    await hit('cart'); check((await state()).inv.includes('bar'), 'the snack cart has one sealed bar');
    await waitClock(sparkNow); const shock = (await state()).sanity; await hit('forward');
    check((await state()).scene === 'l05_planks' && (await state()).sanity < shock, 'walking under the sparking lamp shocks you');
    await waitClock(calmNow); await hit('forward');
    check((await state()).scene === 'l05_platform', 'passing between sparks reaches the platform');
    await shot('sub-16-platform');
    await hit('forward'); await shot('sub-17-ward');
    await hit('forward'); await hit('forward');
    check((await state()).scene === 'l05_corridor', 'the rubble stops you before you have slept');
    await hit('back'); await hit('cart'); await hit('bed');
    check((await state()).flags.l05_hunted, 'sleeping wakes the Drowned');
    await shot('sub-18-drowned');
    await hit('bed'); check(!(await state()).flags.l05_slept, 'you cannot sleep while it hunts you');
    await page.evaluate(() => window.__rooms.g.read('n05_diary'));
    const huntPaused = (await state()).flags.l05_pursuit;
    await page.waitForTimeout(1000);
    check((await state()).flags.l05_pursuit === huntPaused, 'reading pauses the pursuer'); await closeDoc();
    const beforeHunt = (await state()).sanity;
    await page.waitForFunction((b) => window.__rooms.state.scene === 'l05_platform' && window.__rooms.state.sanity <= b - 16, beforeHunt, { timeout: 20000, polling: 50 }).catch(() => {});
    check((await state()).sanity <= beforeHunt - 16 && (await state()).scene === 'l05_platform', 'waiting lets the Drowned catch you');
    await reload(); check((await state()).flags.l05_hunted, 'reload preserves an active pursuit');
    await page.evaluate(() => window.__rooms.g.go('l05_corridor'));
    await hit('forward'); check((await state()).scene === 'l05_platform' && !(await state()).flags.l05_dissolved, 'the hospital loops back to the water while hunted');
    await hit('jump');
    check((await state()).flags.l05_dissolved && !(await state()).flags.l05_hunted, 'luring the Drowned into water dissolves it');
    await waitClock(calmNow); await hit('forward'); await hit('forward');
    await hit('bed'); check((await state()).flags.l05_slept, 'the ward is safe to sleep in afterwards');
    await hit('forward'); await hit('forward');
    check((await state()).scene === 'l05_stairs', 'the corridor leads on to the metal staircase');
    await shot('sub-19-stairs'); await hit('pool');
    await hit('forward'); check((await state()).scene === 'l1_arrive', 'metal stairs lead into Level 1');
    const wet = (await state()).sanity; await hit('blanket');
    check((await state()).sanity > wet && (await state()).flags.l1_via_flood, 'an M.E.G. blanket waits for whoever climbs up from the sanatorium');
    check(!(await page.evaluate(() => window.__rooms.hotspots())).some((h) => h.id === 'blanket' || h.id === 'shoe'), 'the blanket is used once and other arrivals leave no trace');

    console.log('Level 0.7 — The Reminiscence District');
    await start(); await enter.memory(); await shot('sub-20-modern');
    check((await state()).scene === 'l07_modern', 'the faded room opens onto older districts');
    await hit('static'); check((await state()).scene === 'l07_modern', 'static exits cannot be used as ordinary doors');
    await hit('outlet'); check((await state()).inv.includes('outlet'), 'the modern outlet cover can be pried off');
    await hit('forward'); check((await state()).scene === 'l07_bulbs', 'modern corridor gives way to bulbs and candles');
    await shot('sub-21-bulbs');
    const t0 = (await state()).thirst; await hit('pack'); await closeDoc();
    check((await state()).thirst > t0, 'the N.T.G. pack has the only water here');
    await hit('peel'); await hit('forward'); await shot('sub-22-hall');
    check((await state()).scene === 'l07_hall', 'candles lead into the Victorian hall');
    await hit('tapestry'); await hit('voice');
    await page.waitForTimeout(1400);
    check((await state()).scene === 'l07_hall', 'answering the voice is punished');
    await hit('forward'); await shot('sub-23-castle');
    const lit1 = (await state()).flags.l07_lit, wrong = ['left', 'right', 'ahead'].find((k) => k !== lit1);
    await hit(wrong); await page.waitForTimeout(1400);
    check((await state()).scene === 'l07_castle' && (await state()).flags.l07_castle_n === 0, 'an unlit archway is where they hide');
    await hit('torch');
    for (let i = 0; i < 2; i++) await hit((await state()).flags.l07_lit);
    check((await state()).scene === 'l07_rome', 'following the torches reaches the marble hall');
    await shot('sub-24-rome');
    await hit('plane'); await closeDoc(); await hit('statue'); await hit('forward');
    check((await state()).scene === 'l07_egypt', 'the marble hall leads to the Egyptian corridors');
    await page.waitForTimeout(5000); await shot('sub-25-egypt');
    await hit('carving'); check((await state()).inv.includes('rubbing'), 'the carving can be rubbed');
    await reload(); check((await state()).inv.includes('rubbing'), 'new inventory item survives a reload');
    await page.click('.slot[data-id="rubbing"]'); await page.click('.slot[data-id="rubbing"]');
    check(await page.isVisible('#doc'), 'the rubbing can be read'); await closeDoc();
    await page.evaluate(() => window.__rooms.g.sanity(60));
    await page.waitForFunction(() => window.__rooms.state.scene === 'l07_rome', null, { timeout: 20000 });
    check((await state()).scene === 'l07_rome', 'lingering lets the Growler reach you');
    await hit('forward'); await hit('alcove');
    check((await state()).scene === 'l07_modern', 'sleeping with a modern object wakes you in the modern district');
    await hit('back'); check((await state()).scene === 'l0_faded', 'walking toward newer eras returns to the faded room');
    // without anything from the present, the night terror drops you by a rift (the old typist's way out)
    await start(); await enter.memory();
    await page.evaluate(() => window.__rooms.g.go('l07_egypt')); await hit('alcove');
    check((await state()).scene === 'l07_bulbs' && (await state()).flags.l07_rift, 'sleeping empty-handed wakes you beside a rift');
    await shot('sub-26-rift'); await hit('rift');
    check((await state()).scene === 'l1_old', 'the rift opens onto an old Level 1 with horse stalls');
    await shot('sub-27-old-l1');
    await hit('typewriter'); check((await state()).notes.includes('n1_old'), 'the typist left a page in the typewriter');
    await closeDoc(); await hit('stall'); await hit('hay'); await hit('hay');
    check(await count('can') >= 1, 'a tin can hidden in the hay');
    await hit('forward'); check((await state()).scene === 'l1_arrive', 'walking on brings you up to the present Level 1');
    await shot('sub-28-arrive-memory');
    check((await page.evaluate(() => window.__rooms.hotspots())).some((h) => h.id === 'shoe'), 'a horseshoe came through with you');

    console.log('Touch viewport and old saves');
    const mobile = await browser.newContext({ viewport: { width: 375, height: 740 }, hasTouch: true, isMobile: true });
    page = await mobile.newPage(); watch(page);
    await start(); await hit('side'); await hit('annex'); await shot('sub-13-phone-annex');
    // Reach each branch, tapping the final entrance with the same canvas coordinate conversion.
    const tap = async (id) => {
      const hs = await page.evaluate(() => window.__rooms.hotspots());
      const h = hs.find((h) => h.id === id), b = await page.locator('#game').boundingBox();
      await page.touchscreen.tap(b.x + (h.rect[0] + h.rect[2] / 2) / 960 * b.width, b.y + (h.rect[1] + h.rect[3] / 2) / 540 * b.height);
    };
    for (const [portal, scene, from, last] of [
      ['zenith', 'l01_airlock', 'l0_pillar', null], ['ice', 'l03_entry', 'l0_start', 'frost'],
      ['flood', 'l05_flood', 'l0_start', 'down'], ['memory', 'l07_modern', 'l0_start', 'older'],
    ]) {
      await page.evaluate((to) => window.__rooms.g.go(to), from);
      if (portal === 'zenith') {
        await hit('annex'); for (let i = 0; i < 3; i++) await hit((await state()).flags.l01_mark);
        await tap((await state()).flags.l01_mark);
      } else if (portal === 'ice') { await hit('forward'); await hit('vent'); await tap(last); }
      else if (portal === 'flood') {
        await page.evaluate(() => { const g = window.__rooms.g; g.s.bo = { step: 0, dir: 'ahead' }; g.go('l0_blackout'); });
        await hit('ahead'); await tap(last);
      } else { await page.evaluate(() => window.__rooms.g.go('l0_faded')); await tap(last); }
      check((await state()).scene === scene, `phone tap enters ${scene}`);
      await shot(`sub-14-phone-${portal}`); await hit('back');
    }
    check(await page.evaluate(() => document.documentElement.scrollWidth <= 375), 'new level UI fits phone width');
    // A v1 save from before sublevels existed has no new flags or items.
    await page.evaluate(() => localStorage.setItem('rooms0120.save.v1', JSON.stringify({
      v: 1, scene: 'l0_pillar', inv: [], flags: {}, sanity: 80, notes: [], light: false,
      loops: 0, seen: {}, moves: 0, clock: 0, flicker: null,
    })));
    await reload(); await hit('annex');
    check((await state()).scene === 'l0_annex', 'existing v1 saves can enter the new branches');
    await hit((await state()).flags.l01_mark);
    check((await state()).flags.l01_walk === 1, 'old saves get a B.N.T.G. arrow to follow');
    check(errors.length === 0, `no browser errors: ${errors.join(', ')}`);
    console.log('\nAll sublevel checks passed');
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
