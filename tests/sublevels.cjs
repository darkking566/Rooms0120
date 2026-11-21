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
    async function closeCloseup(expected = null) {
      const cu = await page.evaluate(() => window.__rooms.closeup);
      if (expected) check(cu === expected, `close-up "${expected}" opened`);
      if (cu) {
        await hit('closeup_back');
        await page.waitForFunction(() => !window.__rooms.closeup, null, { timeout: 5000, polling: 50 });
      }
    }
    // fixed seed: random events happen the same way every run
    async function start() {
      await page.goto(`${url}?seed=120`);
      await page.click('#btnNew');
    }
    // Each sublevel has its own way in, spread across Level 0.
    async function walkPillars() {
      await hit('side'); await hit('colonnade'); await hit('annex');
      for (let i = 0; i < 4; i++) await hit((await state()).flags.l01_mark);
    }
    const enter = {
      zenith: async () => { await walkPillars(); },
      ice: async () => { await hit('forward'); await hit('atrium'); await hit('draft_door'); await hit('vent'); await hit('closeup_back'); await page.waitForFunction(() => !window.__rooms.closeup, null, { timeout: 5000, polling: 50 }); await hit('frost'); },
      flood: async () => {
        await page.evaluate(() => { const g = window.__rooms.g; g.s.bo = { step: 0, dir: 'ahead' }; g.go('l0_blackout'); });
        await hit('ahead'); await hit('down');
      },
      memory: async () => { await page.evaluate(() => window.__rooms.g.go('l0_faded')); await hit('older'); },
      c1: async () => { await page.evaluate(() => window.__rooms.g.go('l0_storage')); await hit('c1_box'); },
      c1e: async () => {
        await enter.c1();
        await hit('ahead');
        while ((await state()).flags.c1_steps < 3 || (await state()).scene !== 'c1_hall') {
          const st = await state();
          if (st.scene === 'c1_hall') await hit('door_left');
          else if (st.scene === 'c1_bench') await hit('ahead');
          else if (st.scene === 'c1_mirror') await hit('back');
        }
        await hit('window');
      },
      c1x: async () => {
        await enter.c1();
        await hit('ahead');
        await page.evaluate(() => { window.__rooms.g.give('dragon_scale'); window.__rooms.g.go('c1_mirror'); });
        await hit('rift_portal');
      },
      c1s: async () => {
        await enter.c1e();
        await hit('trek');
        await hit('ahead');
      },
      l04: async () => {
        await page.evaluate(() => window.__rooms.g.go('l0_archive'));
        await hit('wormhole');
        await hit('worm_enter');
        await hit('worm_enter');
        await hit('cross_veil');
      },
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
    await start(); await hit('side'); await hit('colonnade');
    check((await state()).scene === 'l0_colonnade', 'colonnade extends off the pillar room');
    await hit('annex'); await shot('sub-00-annex');
    check((await state()).scene === 'l0_annex', 'B.N.T.G. route starts from the colonnade');
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
    await hit('back');
    // Explore expanded Level 0.1 rooms: medbay, maintenance, dock
    await hit('medbay'); check((await state()).scene === 'l01_medbay', 'entered Zenith medbay off ring corridor');
    await hit('med_log'); await closeDoc(); check((await state()).notes.includes('n01_medbay'), 'read ship doctor anomaly log');
    await hit('med_bed'); await closeCloseup('l01_med_scan'); await hit('med_cab');
    check((await state()).flags.l01_med_scan && (await state()).flags.l01_med_almond, 'used medbay scanner and looted med cabinet');
    await hit('back'); await hit('galley'); await shot('sub-04-galley');
    const hunger0 = (await state()).hunger; await hit('robot');
    check((await state()).hunger > hunger0, 'the cooking arm serves a seventh tray');
    await hit('water'); await hit('green'); await shot('sub-05-greenhouse');
    await hit('maint'); check((await state()).scene === 'l01_maint', 'entered shell maintenance bay off greenhouse');
    await hit('maint_note'); await closeDoc(); check((await state()).notes.includes('n01_maint'), 'read Walpurgis maintenance log');
    await hit('shell_win');
    await hit('forward'); check((await state()).scene === 'l01_dock', 'entered sealed docking bay');
    await hit('shuttle'); await closeDoc(); check((await state()).notes.includes('n01_dock'), 'read B.N.T.G. shuttle log');
    await hit('dock_pouch'); await hit('ext_valve');
    check((await state()).flags.l01_dock_bar, 'looted shuttle supply pouch');
    await hit('back'); await hit('back');
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
    await hit('window'); await hit('cu_core_center'); await closeDoc(); await closeCloseup('l01_core_window'); await hit('console'); await closeDoc();
    await hit('back'); await hit('back'); await waitClock(doorOpenNow);
    check((await state()).scene === 'l01_airlock', 'the airlock stays open when another section was cut');
    await hit('back'); check((await state()).scene === 'l0_colonnade', 'station has a return route to Level 0');
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
    await hit('stall'); await hit('mirror'); await closeCloseup('l02_mirror');
    await hit('back');
    await hit('to_showroom');
    check((await state()).scene === 'l02_showroom', 'the showroom opens off the remodelled hall');
    await hit('sofa'); await hit('tv'); await hit('brochure'); await closeDoc();
    check((await state()).notes.includes('n02_brochure'), 'the showroom holds the BRC brochure');
    await hit('to_supply');
    check((await state()).scene === 'l02_supply', 'the supply room sits behind the showroom');
    await hit('wallpaper'); await closeCloseup('l02_wallpaper_cu'); await hit('paint_cans'); await hit('shift_sheet'); await closeDoc();
    check((await state()).notes.includes('n02_shift'), 'the supply room holds the 102-CX shift sheet');
    await hit('locker'); check((await state()).inv.includes('almond'), 'the worker locker holds sealed almond water');
    await hit('back'); await hit('back');
    await hit('forward'); await shot('sub-02c-office');
    check((await state()).scene === 'l02_office', 'the site office at the end of the hall');
    await hit('clipboard'); check((await state()).notes.includes('n02_clip'), 'the clipboards hold the 102-CX work order');
    await closeDoc(); await hit('blueprint'); await closeCloseup('l02_blueprint'); await hit('hat');
    await hit('toolbox');
    check((await state()).scene === 'l02_frame' && (await state()).flags.l02_collapsed, 'taking the screwdriver brings the rooms down');
    await shot('sub-02d-frame');
    const dust0 = (await state()).sanity; await page.waitForTimeout(4300);
    check((await state()).sanity < dust0, 'the dust chokes you while the house collapses');
    await page.click('.slot[data-id="towel"]'); await page.click('.slot[data-id="towel"]');
    check((await state()).flags.l02_mask && await count('towel') === 0, 'a wet paper towel over the mouth keeps the dust out');
    await hit('tape2');
    await hit('to_attic');
    check((await state()).scene === 'l02_attic', 'the collapsing house exposes the unfinished attic');
    const untilBefore = (await state()).flags.l02_until;
    await hit('brace');
    check((await state()).flags.l02_braced && (await state()).flags.l02_until > untilBefore, 'bracing the attic truss buys extra time');
    await hit('attic_note'); await closeDoc();
    check((await state()).notes.includes('n02_attic'), 'the attic beam holds J.H. collapse note');
    await hit('pouch'); check((await state()).inv.includes('bar'), 'the attic pouch holds an energy bar');
    await hit('back');
    await hit('back'); await shot('sub-02e-joists');
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
    await start(); await hit('forward'); await hit('atrium'); await hit('draft_door');
    check((await state()).scene === 'l0_draft', 'drafty corner opens off the yellow atrium');
    check(!(await page.evaluate(() => window.__rooms.hotspots())).some((h) => h.id === 'frost'), 'frost trail is noticed only after the vent');
    await hit('vent');
    check((await page.evaluate(() => window.__rooms.closeup)) === 'l0_vent', 'vent opens close-up CG');
    await hit('closeup_back');
    await page.waitForFunction(() => !window.__rooms.closeup, null, { timeout: 5000, polling: 50 });
    await hit('frost'); await shot('sub-08-ice-entry');
    check((await state()).scene === 'l03_entry', 'following the frost from the vent enters Level 0.3');
    const beforeCold = (await state()).sanity;
    await page.waitForTimeout(2800);
    check((await state()).sanity < beforeCold, 'cold drains sanity over time');
    await hit('block'); await closeCloseup('l03_block'); await hit('forward'); await shot('sub-09-ice-camp');
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
    // Explore expanded Level 0.3 wing: storage -> ductway (damper valve) -> 104-CX camp dorm
    await hit('storage'); check((await state()).scene === 'l03_storage', 'entered frozen supply storage off 104-CX camp');
    await hit('stor_list'); await closeDoc(); check((await state()).notes.includes('n03_storage'), 'read 104-CX material manifest');
    await use('blowtorch', 'thermos'); check((await state()).flags.l03_thermos, 'blowtorch melts frozen thermos in storage');
    await hit('forward'); check((await state()).scene === 'l03_ductway', 'entered iced air-duct corridor');
    await hit('valve'); await closeCloseup('l03_valve_cu');
    await use('blowtorch', 'valve'); check((await state()).flags.l03_valve_shut, 'thawed and shut the frozen duct damper valve');
    await hit('forward'); check((await state()).scene === 'l03_dorm', 'entered 104-CX insulated tent dorm');
    await hit('dorm_note'); await closeDoc(); check((await state()).notes.includes('n03_dorm'), 'read Chris & Evie unsent draft');
    await hit('tent'); await hit('warm_pack'); check((await state()).flags.l03_dorm_warm, 'activated warm packs and camp lantern');
    await hit('back'); await hit('back'); await hit('back');
    check((await state()).scene === 'l03_camp', 'returned to 104-CX camp from frozen wing');
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
    check((await state()).scene === 'l0_draft' && (await state()).flags.l03_thawed, 'the finished room lets you out into the drafty corner');
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
    await hit('forward');
    // Explore expanded Level 0.5 hospital wing: nurse station -> hydrotherapy -> morgue
    await hit('nurse'); check((await state()).scene === 'l05_nurse', 'entered abandoned nurse station off hospital corridor');
    await hit('chart_book'); await closeDoc(); check((await state()).notes.includes('n05_nurse'), 'read sanatorium ward chart log');
    await hit('call_board');
    await hit('therapy'); check((await state()).scene === 'l05_therapy', 'entered flooded hydrotherapy room');
    await hit('therapy_note'); await closeDoc(); check((await state()).notes.includes('n05_therapy'), 'read hydrotherapy log');
    await hit('therapy_locker'); check((await state()).flags.l05_therapy_bar, 'took energy bar from therapy locker');
    await hit('back'); await hit('morgue'); check((await state()).scene === 'l05_morgue', 'entered flooded morgue');
    await hit('morgue_log'); await closeDoc(); check((await state()).notes.includes('n05_morgue') && (await state()).flags.l05_morgue_almond, 'read morgue ledger and took almond water');
    await hit('drawer_0120'); await closeCloseup('l05_morgue_cu');
    await hit('back'); await hit('back');
    await hit('forward');
    check((await state()).scene === 'l05_stairs', 'the corridor leads on to the metal staircase');
    await shot('sub-19-stairs'); await hit('pool'); await closeCloseup('l05_pool');
    await hit('forward'); check((await state()).scene === 'l1_arrive', 'metal stairs lead into Level 1');
    const wet = (await state()).sanity; await hit('blanket');
    check((await state()).sanity > wet && (await state()).flags.l1_via_flood, 'an M.E.G. blanket waits for whoever climbs up from the sanatorium');
    check(!(await page.evaluate(() => window.__rooms.hotspots())).some((h) => h.id === 'blanket' || h.id === 'shoe'), 'the blanket is used once and other arrivals leave no trace');

    console.log('Level 0.7 — The Reminiscence District');
    await start(); await enter.memory(); await shot('sub-20-modern');
    check((await state()).scene === 'l07_modern', 'the faded room opens onto older districts');
    await hit('static'); await closeCloseup('l07_static'); check((await state()).scene === 'l07_modern', 'static exits cannot be used as ordinary doors');
    await hit('outlet'); check((await state()).inv.includes('outlet'), 'the modern outlet cover can be pried off');
    await hit('forward'); check((await state()).scene === 'l07_bulbs', 'modern corridor gives way to bulbs and candles');
    await shot('sub-21-bulbs');
    const t0 = (await state()).thirst; await hit('pack'); await closeDoc();
    check((await state()).thirst > t0, 'the N.T.G. pack has the only water here');
    // Explore expanded Level 0.7 era rooms: gaslight parlor, renaissance library, roman bath
    await hit('parlor'); check((await state()).scene === 'l07_parlor', 'entered 1890s gaslight parlor');
    await hit('parlor_note'); await closeDoc(); check((await state()).notes.includes('n07_parlor'), 'read 1894 explorer diary');
    await hit('gramophone'); check((await state()).flags.l07_gramo, 'cranked recordless gramophone');
    await hit('back');
    await hit('peel'); await hit('forward'); await shot('sub-22-hall');
    check((await state()).scene === 'l07_hall', 'candles lead into the Victorian hall');
    await hit('library'); check((await state()).scene === 'l07_library', 'entered renaissance library off Victorian hall');
    await hit('lectern'); await closeDoc(); check((await state()).notes.includes('n07_library'), 'read parchment manuscript on lectern');
    await hit('bookshelf'); check((await state()).flags.l07_lib_bar, 'found energy bar tucked in empty library books');
    await hit('back');
    await hit('tapestry'); await closeCloseup('l07_tapestry'); await hit('voice');
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
    await hit('bath'); check((await state()).scene === 'l07_bath', 'entered dry Roman bathhouse ruins');
    await hit('mosaic'); await closeCloseup('l07_mosaic');
    await hit('tablet'); await closeDoc(); check((await state()).notes.includes('n07_bath'), 'read Roman bathhouse sleep tablet');
    await hit('jar'); check((await state()).flags.l07_bath_water, 'found sealed almond water in terracotta jar');
    await hit('back');
    await hit('plane'); await closeDoc(); await hit('statue'); await closeCloseup('l07_statue'); await hit('forward');
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

    console.log('Level C-1 — 偏路');
    await start();
    await hit('forward'); await hit('atrium'); await hit('storage_door');
    check((await state()).scene === 'l0_storage', 'storage cubicle opens off the yellow atrium');
    await hit('c1_box');
    check((await state()).scene === 'c1_entry' && await page.locator('#lvlName').textContent() === 'LEVEL C-1', 'box in l0_storage enters c1_entry');
    await page.evaluate(() => { const g = window.__rooms.g; g.give('camcorder'); g.setView(true); });
    check((await page.locator('#msg').textContent()).includes('觀景窗裡什麼也沒有。聲音還是來了。'), 'c1 viewfinder reveals nothing for bang source');
    await page.evaluate(() => { const g = window.__rooms.g; g.setView(false); g.take('camcorder'); });
    await hit('back');
    check((await state()).scene === 'l0_storage', 'climbing back out returns to l0_storage');
    await hit('c1_box_note'); await closeDoc();
    check((await state()).notes.includes('n_c1_entry'), 'note beside cardboard box opens n_c1_entry');
    await hit('c1_box');
    const invBeforeC1 = (await state()).inv.length;
    await hit('ahead');
    check((await state()).scene === 'c1_hall', 'entry door opens onto c1_hall');
    // Walk until c1_steps >= 8 and check end_door appears only at steps >= 8
    while ((await state()).flags.c1_steps < 8 || (await state()).scene !== 'c1_hall') {
      const st = await state();
      if (st.scene === 'c1_hall') {
        const hs = await page.evaluate(() => window.__rooms.hotspots().map((h) => h.id));
        if ((st.flags.c1_steps || 0) < 8) check(!hs.includes('end_door'), `end_door hidden at ${st.flags.c1_steps || 0} steps`);
        await hit('door_left');
      } else if (st.scene === 'c1_bench') {
        await hit('rest');
        if (!st.notes.includes('n_c1_clean')) { await hit('note_clean'); await closeDoc(); }
        await hit('ahead');
      } else if (st.scene === 'c1_mirror') {
        await hit('mirror');
        await hit('back');
        if ((await state()).scene === 'c1_hall') await hit('door_right');
      }
    }
    const hallIds = await page.evaluate(() => window.__rooms.hotspots().map((h) => h.id));
    check(hallIds.includes('end_door'), 'end_door appears once steps >= 8');
    check(!hallIds.includes('bang') && !hallIds.includes('bang_source'), 'distant bang has no clickable source');
    // Explore expanded C1 偏路 rooms (atrium -> dead staircase -> empty gallery) keeping 0 items
    await page.evaluate(() => window.__rooms.g.go('c1_bench'));
    await hit('side_atrium'); check((await state()).scene === 'c1_atrium', 'entered cold white atrium off bench room');
    await hit('atrium_plaque'); await closeDoc(); check((await state()).notes.includes('n_c1_atrium'), 'read atrium plaque');
    await hit('basin');
    await hit('ahead'); check((await state()).scene === 'c1_stair', 'entered dead-end white staircase');
    await hit('stair_note'); await closeDoc(); check((await state()).notes.includes('n_c1_stair'), 'read staircase survey note');
    await hit('dead_stairs'); check((await state()).flags.c1_stair_checked, 'checked sealed ceiling staircase');
    await hit('ahead'); check((await state()).scene === 'c1_gallery', 'entered empty white gallery');
    await hit('side_frames'); await closeCloseup('c1_frame_cu');
    await hit('empty_frame'); await closeDoc(); check((await state()).notes.includes('n_c1_gallery'), 'read empty gallery card');
    await hit('ahead'); check((await state()).scene === 'c1_hall', 'gallery side door returns to endless white hall');
    check((await state()).inv.length === invBeforeC1, 'no items picked up anywhere in 偏路');
    await hit('end_door');
    check((await state()).scene === 'c1_door', 'end_door reaches c1_door');
    await reload();
    check((await state()).scene === 'c1_door' && (await state()).flags.c1_steps >= 8, 'reloading mid-C1 preserves scene and steps');
    await hit('open_door');
    await page.waitForSelector('#ending:not([hidden])');
    check(true, 'c1_door triggers c2_door ending');
    await page.click('#btnRetry');
    check((await state()).scene.startsWith('c1_') && await page.locator('#lvlName').textContent() === 'LEVEL C-1', 'retrying c2_door keeps checkpoint in C1');

    console.log('Level C-1 — 東舟市');
    await start();
    await enter.c1();
    await hit('ahead');
    await hit('window');
    check((await state()).scene === 'c1_hall', 'c1_hall window stays shut before 3 steps');
    while ((await state()).flags.c1_steps < 3 || (await state()).scene !== 'c1_hall') {
      const st = await state();
      if (st.scene === 'c1_hall') await hit('door_left');
      else if (st.scene === 'c1_bench') await hit('ahead');
      else if (st.scene === 'c1_mirror') await hit('back');
    }
    await hit('window');
    check((await state()).scene === 'c1e_outskirts' && (await page.locator('#lvlSub').textContent()).includes('東舟市'), 'c1_hall window at steps >= 3 enters c1e_outskirts');
    await hit('hollows');
    await hit('cabin');
    await hit('to_city');
    check((await state()).scene === 'c1e_gate', 'enters c1e_gate');
    await hit('notice'); await closeDoc();
    await hit('recorder_desk');
    check((await state()).inv.includes('recorder'), 'gate checkpoint issues first recorder');
    await hit('ahead');
    await hit('to_lab');
    await hit('shiju'); await closeDoc();
    check((await state()).notes.includes('n_c1e_lab'), 'reads 時駒 diffraction grating notes');
    await hit('spare');
    check(!(await state()).inv.includes('recorder2'), 'spare recorder refused before first is destroyed');
    await hit('back');
    await hit('to_garden');
    await hit('rest'); await hit('fountain'); await hit('ration');
    check((await state()).inv.includes('bar'), 'new age garden gives one bar');
    await hit('back');
    await hit('to_acma');
    await use('recorder', 'cell_024'); await closeDoc();
    check((await state()).notes.includes('n_c1e_024'), 'interviews E-024');
    await hit('cell_025'); await closeCloseup('c1e_cell_025');
    await use('recorder', 'cell_013'); await closeDoc();
    check(!(await state()).inv.includes('recorder') && (await state()).inv.includes('dragon_scale'), 'E-013 burns recorder and drops dragon_scale');
    await hit('back');
    await hit('to_lab');
    await hit('spare');
    check((await state()).inv.includes('recorder2'), 'lab issues spare recorder2 after E-013 burns recorder');
    await hit('back');
    await hit('back');
    const sanBeforeOut = (await state()).sanity;
    await hit('back');
    check((await state()).scene === 'c1e_outskirts' && (await state()).sanity <= sanBeforeOut - 3, 'leaving city to outskirts triggers distant growl sanity penalty');
    await hit('to_cave');
    await page.waitForTimeout(2400);
    await hit('rock_wall');
    await page.waitForTimeout(3000);
    check(!(await state()).flags.c1e_002_heard, 'clicking hotspot in cave resets 5s 002 timer');
    await page.waitForTimeout(2600);
    await page.waitForSelector('#doc:not([hidden])');
    await closeDoc();
    check((await state()).flags.c1e_002_done && (await state()).notes.includes('n_c1e_002'), 'staying still 5s records E-002');
    await reload();
    check((await state()).scene === 'c1e_cave' && (await state()).flags.c1e_002_done, 'reloading mid-cave preserves progress');
    await hit('back');
    await hit('to_cave');
    const caveHs = await page.evaluate(() => window.__rooms.hotspots().map((h) => h.id));
    check((await state()).flags.c1e_cave_gone && caveHs.includes('rubble') && !caveHs.includes('rock_wall'), 'cave collapses after single visit and shows rubble');
    await hit('back');
    await hit('back');
    check((await state()).scene === 'c1_hall', 'returns from East Boat City back to c1_hall');

    console.log('Level C-1 — 驤亭');
    await start();
    await page.evaluate(() => window.__rooms.g.go('c1_mirror'));
    const mirrorNoScale = await page.evaluate(() => window.__rooms.hotspots().map((h) => h.id));
    check(!mirrorNoScale.includes('rift_portal'), 'mirror rift closed without dragon_scale');
    await page.evaluate(() => window.__rooms.g.give('dragon_scale'));
    await hit('rift_portal');
    check((await state()).scene === 'c1x_rift' && (await state()).inv.includes('dragon_scale'), 'dragon_scale opens rift to c1x_rift without being consumed');
    await hit('stone'); await closeDoc();
    check((await state()).notes.includes('n_c1x_rift'), 'reads rift stone marker n_c1x_rift');
    await hit('back');
    check((await state()).scene === 'c1_mirror' && (await state()).inv.includes('dragon_scale'), 'returns from c1x_rift back to c1_mirror keeping dragon_scale');
    await hit('rift_portal');
    await hit('ahead');
    check((await state()).scene === 'c1x_plain', 'enters c1x_plain');
    const plainInv = (await state()).inv.length;
    await hit('grass');
    check((await state()).inv.length === plainInv, 'searching plains grass gives no items');
    await hit('to_river');
    await page.evaluate(() => window.__rooms.g.drink(-50));
    const thirstBeforeRiver = (await state()).thirst;
    await hit('drink_river');
    check((await state()).thirst > thirstBeforeRiver, 'river in Xiangting restores thirst');
    await hit('to_grove');
    check((await state()).scene === 'c1x_grove', 'enters c1x_grove across the river');
    await hit('grove_stele'); await closeDoc();
    check((await state()).notes.includes('n_c1x_grove'), 'reads sparse grove boundary stele n_c1x_grove');
    const groveInv = (await state()).inv.length;
    await hit('lookout_rock'); await hit('fallen_branch');
    check((await state()).inv.length === groveInv, 'sparse grove preserves resource scarcity');
    await hit('back');
    await hit('back');
    await hit('to_outskirts');
    await hit('approach'); await closeDoc();
    check((await state()).flags.c1x_progenitor_seen && (await state()).notes.includes('n_c1x_progenitor'), 'watches Progenitor and reads n_c1x_progenitor');
    await hit('back');
    await hit('to_base');
    check((await state()).flags.c1x_dread_seen, 'immune to Dragon-blood presence at base');
    await hit('faceless'); await hit('steed');
    await hit('to_stables');
    check((await state()).scene === 'c1x_stables', 'enters c1x_stables wing');
    await hit('groom'); await hit('stables_ledger'); await closeDoc();
    check((await state()).notes.includes('n_c1x_stables'), 'reads scaled steed stables ledger n_c1x_stables');
    await hit('tack_rack'); await hit('stables_stall');
    await hit('back');
    await hit('to_eye');
    await hit('eye_manual'); await closeDoc();
    await hit('alpha_log'); await closeDoc();
    await hit('skeleton'); await closeCloseup('c1x_skeleton');
    await hit('to_archive');
    check((await state()).scene === 'c1x_archive', 'enters c1x_archive observation gallery');
    await hit('branch_chart'); await closeDoc();
    check((await state()).notes.includes('n_c1x_branches'), 'reads K014 branch chart n_c1x_branches');
    await hit('beta_console'); await hit('cell_rack'); await closeCloseup('c1x_cells_cu');
    await hit('back');
    await reload();
    check((await state()).scene === 'c1x_eye' && (await state()).flags.c1x_progenitor_seen, 'reloading mid-Xiangting preserves scene and flags');
    await hit('pod');
    for (const [dreamId, name] of [['dream_fall', 'fall'], ['dream_water', 'water'], ['dream_chase', 'chase']]) {
      await hit(dreamId);
      await hit('choice_interfere');
      const postHs = await page.evaluate(() => window.__rooms.hotspots().map((h) => h.id));
      check(!postHs.includes(dreamId), `dream ${name} can only be entered once`);
    }
    await page.waitForSelector('#doc:not([hidden])');
    await closeDoc();
    await page.waitForSelector('#ending:not([hidden])');
    check((await state()).notes.includes('n_c1x_eye_done'), 'three interferes trigger n_c1x_eye_done and torn_script ending');
    await page.click('#btnRetry');
    check((await state()).scene === 'c1x_rift', 'retrying torn_script restores C1.3 entry checkpoint');

    console.log('Level C-1 — 俄刻阿諾斯號');
    await start();
    await enter.c1s();
    check((await state()).scene === 'c1s_hull' && (await page.locator('#lvlSub').textContent()).includes('俄刻阿諾斯號'), 'trek enters c1s_hull');
    await hit('log_page'); await closeDoc();
    check((await state()).notes.includes('n_c1s_log'), 'reads ship log C-1.00');
    await hit('ahead');
    check((await state()).scene === 'c1s_hall', 'enters c1s_hall');
    await hit('win_l'); await closeCloseup('c1s_porthole');
    // Visit all 3 inserted subspaces cleanly once each
    const visitedSubs = new Set();
    for (let i = 0; i < 3; i++) {
      const hs = await page.evaluate(() => window.__rooms.hotspots().map((h) => h.id));
      check(!hs.includes('door_sea'), `door_sea stays closed until all 3 subspaces visited (${i}/3)`);
      await hit('door_sub0');
      const subScene = (await state()).scene;
      visitedSubs.add(subScene);
      if (subScene === 'c1s_town') {
        await hit('phone_booth');
        check((await state()).inv.includes('almond'), 'phone booth in dim town yields almond water');
      } else if (subScene === 'c1s_metro') {
        await hit('corpse_rats');
        check((await state()).flags.c1s_plague, 'corpse rats inflict c1s_plague');
      } else if (subScene === 'c1s_fog') {
        await hit('trees'); await closeCloseup('c1s_fog_trees');
      }
      await hit('back');
    }
    check(visitedSubs.size === 3, 'each of fog, town, metro inserted exactly once');
    // Cure plague with almond water from phone booth (double click slot)
    await page.click('.slot[data-id="almond"]');
    await page.click('.slot[data-id="almond"]');
    check(!(await state()).flags.c1s_plague, 'almond water cures c1s_plague');
    const hallReady = await page.evaluate(() => window.__rooms.hotspots().map((h) => h.id));
    check(hallReady.includes('door_sea') && !hallReady.includes('door_sub0'), '4th door opens to sea once all 3 subspaces visited');
    await hit('door_sea');
    check((await state()).scene === 'c1s_sea', 'enters c1s_sea');
    await hit('ahead');
    check((await state()).scene === 'c1s_h', 'enters H section with Butler 1399');
    await hit('butler_general');
    await hit('butler_zhihui'); await closeDoc();
    await hit('butler_junjun');
    check((await state()).notes.includes('n_c1s_butler'), 'reads Butler 1399 interview notes');
    // Bring Butler along -> Junjun refuses to talk
    await hit('butler_follow');
    await hit('to_hideout');
    check((await state()).scene === 'c1s_hideout' && (await state()).flags.c1s_butler_near, 'entered hideout with Butler following');
    await hit('junjun');
    check(!(await state()).flags.c1s_junjun_met, 'Junjun refuses to open up while Butler is near');
    // Leave Butler behind -> rescue succeeds
    await hit('back');
    await hit('butler_follow');
    await hit('to_hideout');
    await hit('junjun'); await closeDoc();
    check((await state()).flags.c1s_junjun_met && (await state()).notes.includes('n_c1s_junjun'), 'Junjun opens up when visited alone');
    // Verify forbidden password never appears anywhere in notes
    const allNoteText = await page.evaluate(() => document.body.innerText);
    check(!allNoteText.includes('All Things Must Pass'), 'forbidden password never revealed');
    await hit('rescue_junjun');
    check((await state()).flags.c1s_rescued, 'rescues Junjun');
    await reload();
    check((await state()).scene === 'c1s_hideout' && (await state()).flags.c1s_rescued, 'reloading preserves rescue progress');
    // Walk all the way out -> subspaces extinguish -> delivered in東舟市
    await hit('back'); await hit('back'); await hit('back');
    check((await state()).scene === 'c1s_hall', 'back at c1s_hall during exit');
    await hit('back'); await hit('back'); await hit('back');
    check((await state()).scene === 'c1e_outskirts' && (await state()).flags.c1s_delivered, 'Junjun delivered to East Boat City medical dept and subspaces vanish');

    console.log('Level 0.4 — 碾城');
    await start();
    await page.evaluate(() => window.__rooms.g.go('l0_archive'));
    await hit('worm_note'); await closeDoc();
    check((await state()).notes.includes('n04_warn'), 'reads Level 0.4 macro-wormhole warning note');
    await hit('wormhole');
    check((await state()).scene === 'l04_worm', 'enters macro-wormhole entrance');
    const preWarnSan = (await state()).sanity;
    await hit('worm_enter');
    check((await state()).scene === 'l04_worm' && (await state()).flags.l04_warned && (await state()).sanity <= preWarnSan - 5, 'first click warns and drains 5 sanity before wormhole');
    await hit('worm_enter');
    check((await state()).scene === 'l04_veil', 'second click reaches starry veil');
    await hit('cross_veil');
    const l04Hud = await page.evaluate(() => ({
      name: document.getElementById('lvlName').textContent,
      sub: document.getElementById('lvlSub').textContent,
    }));
    check((await state()).scene === 'l04_outer' && l04Hud.name === 'LEVEL 0.4' && l04Hud.sub.includes('碾城'), 'crossing veil enters Level 0.4 Grinding City');
    await shot('sub-15-l04-outer');
    for (const sc of ['l04_outer', 'l04_subway', 'l04_wei', 'l04_redhall', 'l04_inner', 'l04_dome_gate', 'l04_wolf']) {
      await page.evaluate((target) => window.__rooms.g.go(target), sc);
      const ids = await page.evaluate(() => window.__rooms.hotspots().map((h) => h.id));
      check(!ids.includes('back'), `no back exit hotspot in ${sc}`);
    }
    // Collect max 3 supplies across Grinding City and read the faction + expanded area notes
    await page.evaluate(() => window.__rooms.g.go('l04_outer'));
    await hit('outer_supply');
    check((await state()).inv.filter((id) => id === 'bar').length === 1, 'outer ring grants 1 bar');
    await hit('to_subway');
    check((await state()).scene === 'l04_subway', 'descended into stalled ring subway station');
    await hit('subway_note'); await closeDoc();
    check((await state()).notes.includes('n04_subway'), 'reads subway wanderer note');
    await hit('to_outer');
    await hit('to_wei');
    await hit('talk_hunter'); await closeDoc();
    await hit('to_redhall');
    check((await state()).scene === 'l04_redhall', 'entered Hunters Guild Red Hall interior');
    await hit('fission_monitor'); await closeCloseup('l04_fission_mon'); await hit('tactical_map');
    await hit('tower_ledger'); await closeDoc();
    check((await state()).notes.includes('n04_tower'), 'reads Red Hall Tower ledger');
    await hit('to_wei');
    await hit('wei_supply');
    check((await state()).inv.includes('can') && (await state()).notes.includes('n04_hunter'), 'Wei Chi Ave grants 1 can and hunter note');
    await hit('to_inner');
    await hit('talk_pioneer'); await closeDoc();
    check((await state()).flags.l04_confirmed_deadend && (await state()).notes.includes('n04_pioneer'), 'Inner ring pioneer confirms dead end');
    await hit('to_dome_gate');
    check((await state()).scene === 'l04_dome_gate', 'entered Iron Dome quarantine gallery');
    await hit('shield_scan'); await closeCloseup('l04_shield');
    await hit('broadcast_log'); await closeDoc();
    check((await state()).notes.includes('n04_broadcast'), 'reads Iron Dome external broadcast archive');
    await hit('to_inner');
    await reload();
    check((await state()).scene === 'l04_inner' && (await state()).flags.l04_confirmed_deadend, 'reloading mid-0.4 keeps scene and flags');
    // Trigger layer fission from inside city -> crimson sky, city unchanged, Wolf Domain shifts
    await page.evaluate(() => window.__rooms.g.flag('l04_fission_t', 89.9));
    await page.waitForTimeout(350);
    check((await state()).flags.l04_red_sky === true && (await state()).flags.l04_fission_count >= 1, 'layer fission triggers crimson sky warning');
    const innerHsAfter = await page.evaluate(() => window.__rooms.hotspots().map((h) => h.id));
    check(innerHsAfter.includes('talk_pioneer') && innerHsAfter.includes('stay_here'), 'city area layout unchanged by layer fission');
    // Verify underground subway shelter and shortcut back to outer ring
    await hit('to_subway');
    check((await state()).scene === 'l04_subway', 'inner ring service tunnel connects directly to subway');
    await page.evaluate(() => { window.__rooms.state.sanity = 60; });
    await hit('subway_bench');
    check((await state()).flags.l04_sub_rest && (await state()).sanity > 60, 'resting on subway bench after fission restores sanity once');
    await hit('to_outer');
    await hit('to_wolf');
    await hit('talk_ronin'); await closeDoc();
    check((await state()).notes.includes('n04_ronin'), 'reads ronin note in Wolf Domain');
    const wolfVariantOneHs = await page.evaluate(() => window.__rooms.hotspots().map((h) => h.id));
    check(wolfVariantOneHs.includes('wolf_silhouette') && !wolfVariantOneHs.includes('wolf_crate'), 'Wolf Domain flipped to silhouette variant after fission');
    // Trigger second fission so crate variant exposes the 3rd supply
    await page.evaluate(() => { window.__rooms.g.flag('l04_fission_rem', 0); window.__rooms.g.flag('l04_fission_t', 89.9); });
    await page.waitForTimeout(350);
    const wolfVariantZeroHs = await page.evaluate(() => window.__rooms.hotspots().map((h) => h.id));
    check(wolfVariantZeroHs.includes('wolf_crate') && !wolfVariantZeroHs.includes('wolf_silhouette'), 'Wolf Domain shifts back to crate variant on next fission');
    await hit('wolf_crate');
    check((await state()).inv.includes('almond'), 'Wolf Domain crate grants 3rd and final supply (almond)');
    await hit('to_outer'); await hit('to_wei'); await hit('to_inner');
    await hit('stay_here');
    check(await page.locator('#ending:not([hidden])').count() === 1, 'staying in Level 0.4 reaches dead_end ending');
    await shot('sub-16-l04-ending');
    await page.click('#btnRetry');
    check((await state()).scene === 'l04_outer', 'retry from dead_end restores 0.4 checkpoint');

    console.log('Level 0.01 — 無盡長廊');
    await start();
    await hit('forward'); // l0_hall
    await hit('atrium'); // l0_atrium
    await hit('mottled_door'); // l0_mottled
    check((await state()).scene === 'l0_mottled', 'mottled corridor leads out of the yellow atrium');
    await hit('forward'); // l0_firedoor
    check((await state()).scene === 'l0_firedoor', 'concrete fire-door foyer lies past the mottled corridor');
    await hit('exit001');
    check((await state()).scene === 'l001_0km' && await page.textContent('#lvlName') === 'LEVEL 0.01', 'green EXIT concrete door in l0_firedoor enters Level 0.01');
    await hit('note_entry'); await closeDoc();
    check((await state()).notes.includes('n001_entry'), 'read 0 km entry warning note');
    await hit('bulge'); await hit('debris');
    check((await state()).flags.l001_debris_checked, 'inspected clipped-in debris at 0 km');
    await hit('forward');
    check((await state()).scene === 'l001_5km', 'advanced to 5 km misty corridor');
    await hit('note_5km'); await closeDoc();
    await hit('mist_bottle');
    check((await state()).flags.l001_mist_almond && (await state()).inv.includes('almond'), 'collected condensed almond water from 5 km mist');
    const sanBeforeLamp = (await state()).sanity;
    await hit('lamp'); await closeCloseup('l001_lamp_cu');
    check((await state()).sanity < sanBeforeLamp && (await state()).flags.l001_lamp_stared, 'staring at fluorescent lamp opens closeup and hurts sanity');
    await hit('forward');
    check((await state()).scene === 'l001_13km', 'advanced to 13 km torn wallpaper & blackout corridor');
    await hit('note_13km'); await closeDoc();
    await hit('faded_pile'); await closeCloseup('l001_faded_cu');
    check((await state()).flags.l001_faded_checked, 'inspected yellow-faded wanderer belongings closeup');
    // Floor hole leads to Void ending, retry returns to Level 0.01 entry checkpoint
    await hit('void_hole');
    await page.waitForSelector('#ending:not([hidden])');
    await page.click('#btnRetry');
    check((await state()).scene === 'l001_0km', 'void hole triggers void ending and retry restores Level 0.01 checkpoint');
    await hit('forward'); await hit('mist_bottle'); await hit('forward'); await hit('forward');
    check((await state()).scene === 'l001_21km', 'reached 21 km max-mist corridor');
    await hit('note_21km'); await closeDoc();
    await hit('fake_exit');
    check((await state()).flags.l001_fake_exit && (await state()).scene === 'l001_21km', 'fake green EXIT door dissolves as a hallucination');
    await hit('silhouette');
    check((await state()).flags.l001_silhouette, 'mist silhouette dissolves under isolation effect');
    await hit('forward');
    check((await state()).scene === 'l001_31km', 'reached 31 km peak-heat crumbling corridor');
    await hit('note_31km'); await closeDoc();
    check((await state()).flags.l001_appendix_read && (await state()).notes.includes('n001_31km'), 'read 31 km appendix note');
    await hit('noclip_seam');
    check((await state()).scene === 'l1_arrive', 'unstable 31 km seam noclips out to Level 1');
    // Test one-way ceiling gap at 21 km -> l001_gap -> Level 28 ending
    await start();
    await page.evaluate(() => window.__rooms.g.go('l001_21km'));
    await hit('ceiling_gap');
    check((await state()).scene === 'l001_gap', 'missing light panel climbs into one-way ceiling gap');
    check(!(await page.evaluate(() => window.__rooms.hotspots())).some((h) => h.id === 'back'), 'ceiling gap has no return route to Level 0.01');
    await hit('note_gap'); await closeDoc();
    await hit('sealed_slot'); await hit('rest_gap');
    check((await state()).flags.l001_gap_rest, 'rested in cool ceiling gap');
    await hit('to_l28');
    await page.waitForSelector('#ending:not([hidden])');
    check(await page.locator('#ending:not([hidden])').count() === 1, 'stone archway in ceiling gap reaches l001_l28 ending');

    console.log('Level 0.1 — 險區 / 燃燒的前廳 (Fandom)');
    await start();
    await hit('lowroom'); // l0_low
    await hit('dz_vent');
    check((await state()).scene === 'dz_vent' && (await page.textContent('#lvlSub')).includes('險區'), 'smoking vent in l0_low enters Level 0.1 Danger Zone');
    await hit('sealed_entry');
    check((await state()).scene === 'dz_vent', 'vent entrance vanishes behind you (no return to Level 0)');
    await hit('vent_note'); await closeDoc();
    check((await state()).notes.includes('n_dz_entry'), 'read M.E.G. Danger Zone warning in vent');
    await hit('forward');
    check((await state()).scene === 'dz_lobby', 'crawled out into red-orange core lobby');
    await hit('smoke_alarm');
    check((await state()).flags.dz_alarm_hit, 'inspected useless smoke alarm');
    // Cubicles: mask, extinguisher, almond water, liquid pain, ceiling space
    await hit('to_cubicles');
    check((await state()).scene === 'dz_cubicles', 'entered cluttered supply cubicles');
    await hit('mask'); await hit('extinguisher'); await hit('supply_crate'); await hit('liquid_pain');
    check((await state()).flags.dz_masked && (await state()).inv.includes('extinguisher') && (await state()).flags.dz_liquid_pain, 'collected respirator, fire extinguisher, almond water and avoided liquid pain');
    await hit('ceil_hole');
    check((await state()).scene === 'dz_ceiling', 'climbed into collapsed ceiling dark space');
    await hit('recon_note'); await closeDoc();
    check((await state()).notes.includes('n_dz_recon'), 'read rapid-recon ceiling note');
    await hit('drop_sanctuary');
    check((await state()).scene === 'dz_sanctuary', 'dropped into burned-out safe alcove');
    await hit('sanct_note'); await closeDoc();
    await hit('almond_barrels');
    check((await state()).flags.dz_barrel_loot, 'looted barrelled almond water in safe alcove');
    // Go out to Scorched 12-person Outpost -> melted comms -> glass door ending
    await hit('back');
    check((await state()).scene === 'dz_outpost', 'exited safe alcove into scorched 12-person outpost');
    await hit('outpost_log'); await closeDoc();
    await hit('melted_gear'); await closeCloseup('dz_melted_cu');
    // Back into Sudden Ignition -> test fire wall blocked -> suppress with extinguisher -> Kagerou closeup
    await hit('back');
    check((await state()).scene === 'dz_ignition', 'entered Sudden Ignition zone');
    await hit('note_0666'); await closeDoc();
    await hit('kagerou_shimmer'); await closeCloseup('dz_kagerou_cu');
    await hit('fire_wall');
    check((await state()).scene === 'dz_ignition', 'Sudden Ignition flames block passage without extinguisher');
    await use('extinguisher', 'fire_wall');
    check((await state()).flags.dz_fire_suppressed && !(await state()).inv.includes('extinguisher'), 'dry-powder extinguisher temporarily suppresses flames');
    await hit('fire_wall');
    check((await state()).scene === 'dz_outpost', 'passed suppressed fire wall back to outpost');
    await hit('glass_door');
    await page.waitForSelector('#ending:not([hidden])');
    check(await page.locator('#ending:not([hidden])').count() === 1, 'glass door reaches dz_glass ending');
    await page.click('#btnRetry');
    // Test Power Outage hall, Dead End, and Crossroads exits
    await page.evaluate(() => window.__rooms.g.go('dz_outage'));
    const dzOutageOn = '(c) => c % 10.0 > 0.2 && c % 10.0 < 2.8';
    const dzPowerOn = '(c) => c % 10.0 > 4.0 && c % 10.0 < 9.2';
    await waitClock(dzOutageOn);
    await hit('hide_vent');
    check((await state()).flags.dz_hid_outage, 'hid in small vent during Power Outage');
    await hit('to_deadend');
    check((await state()).scene === 'dz_deadend', 'entered crimson Dead End threshold');
    await hit('dead_radio'); await closeDoc();
    await hit('back');
    check((await state()).scene === 'dz_outage', 'turned back safely from Dead End threshold');
    await waitClock(dzPowerOn);
    await hit('forward');
    check((await state()).scene === 'dz_crossroads', 'crossed outage hall while power is on to reach transition crossroads');
    await hit('exits_note'); await closeDoc();
    await hit('exit_001');
    check((await state()).scene === 'l001_0km', 'crossroads transitions directly into Level 0.01');

    console.log('Level 0.98 — 黯室');
    await start();
    await hit('forward'); // l0_hall
    await hit('dull_wall');
    check((await state()).scene === 'dull_entry' && (await page.textContent('#lvlSub')).includes('黯室'), 'smooth dull-yellow wall in l0_hall enters 黯室');
    await hit('smooth_wall'); await hit('empty_bottle'); await hit('note_1'); await closeDoc();
    check((await state()).flags.dull_wall_hit && (await state()).notes.includes('n_dull_1'), 'smooth wall is indestructible and Ryan Greenfield note 1 read');
    await hit('forward');
    check((await state()).scene === 'dull_grid', 'entered foggy grid-like pillar area');
    await hit('silent_lamp'); await closeCloseup('dull_lamp_cu');
    check((await state()).flags.dull_flashback, 'staring at silent ceiling lamp triggers flashback closeup');
    await hit('to_narrow');
    check((await state()).scene === 'dull_narrow', 'entered bottomless-ceiling narrow corridor');
    await hit('wall_crack'); await closeDoc();
    await hit('phantom_door');
    check((await state()).flags.dull_halluc_seen, 'silence hallucination dissolves on touch');
    await hit('back');
    await hit('to_stadium');
    check((await state()).scene === 'dull_stadium', 'entered cool stadium-sized hall');
    await hit('cool_breeze'); await hit('note_3'); await closeDoc();
    check((await state()).flags.dull_breeze_rest, 'resting in unknown upper breeze restores sanity once');
    await hit('forward');
    check((await state()).scene === 'dull_embed', 'entered embedded intersecting rooms');
    await hit('embed_wall'); await hit('dead_torch');
    await hit('forward');
    check((await state()).scene === 'dull_distortion', 'reached iridescent Distortion climax room');
    await hit('photo_note'); await closeCloseup('dull_distortion_cu');
    check((await state()).flags.dull_photo_seen, 'opened Feb 10 2000 Distortion photo closeup');
    const fluctOff = '(c) => c % 7.5 > 4.2 && c % 7.5 < 7.1';
    const fluctOn = '(c) => c % 7.5 > 0.2 && c % 7.5 < 3.3';
    await waitClock(fluctOff);
    await hit('escape_wall');
    check((await state()).scene === 'dull_distortion', 'cannot noclip out while space is stable');
    await waitClock(fluctOn);
    await hit('escape_wall');
    check((await state()).scene === 'l0_start' && (await state()).flags.dull_escaped, 'noclipping during Quantum Fluctuation escapes back to Level 0');

    console.log('Touch viewport and old saves');
    const mobile = await browser.newContext({ viewport: { width: 375, height: 740 }, hasTouch: true, isMobile: true });
    page = await mobile.newPage(); watch(page);
    await start(); await hit('side'); await hit('colonnade'); await hit('annex'); await shot('sub-13-phone-annex');
    // Reach each branch, tapping the final entrance with the same canvas coordinate conversion.
    const tap = async (id) => {
      const hs = await page.evaluate(() => window.__rooms.hotspots());
      const h = hs.find((h) => h.id === id), b = await page.locator('#game').boundingBox();
      await page.touchscreen.tap(b.x + (h.rect[0] + h.rect[2] / 2) / 960 * b.width, b.y + (h.rect[1] + h.rect[3] / 2) / 540 * b.height);
    };
    for (const [portal, scene, from, last] of [
      ['zenith', 'l01_airlock', 'l0_colonnade', null], ['ice', 'l03_entry', 'l0_draft', 'frost'],
      ['flood', 'l05_flood', 'l0_start', 'down'], ['memory', 'l07_modern', 'l0_start', 'older'],
      ['c1', 'c1_entry', 'l0_storage', 'c1_box'],
    ]) {
      await page.evaluate((to) => window.__rooms.g.go(to), from);
      if (portal === 'zenith') {
        await hit('annex'); for (let i = 0; i < 3; i++) await hit((await state()).flags.l01_mark);
        await tap((await state()).flags.l01_mark);
      } else if (portal === 'ice') { await hit('vent'); await tap('closeup_back'); await page.waitForFunction(() => !window.__rooms.closeup, null, { timeout: 5000, polling: 50 }); await tap(last); }
      else if (portal === 'flood') {
        await page.evaluate(() => { const g = window.__rooms.g; g.s.bo = { step: 0, dir: 'ahead' }; g.go('l0_blackout'); });
        await hit('ahead'); await tap(last);
      } else if (portal === 'memory') { await page.evaluate(() => window.__rooms.g.go('l0_faded')); await tap(last); }
      else { await tap(last); }
      check((await state()).scene === scene, `phone tap enters ${scene}`);
      await shot(`sub-14-phone-${portal}`); await hit('back');
    }
    check(await page.evaluate(() => document.documentElement.scrollWidth <= 375), 'new level UI fits phone width');
    // A v1 save from before sublevels existed has no new flags or items.
    await page.evaluate(() => localStorage.setItem('rooms0120.save.v1', JSON.stringify({
      v: 1, scene: 'l0_pillar', inv: [], flags: {}, sanity: 80, notes: [], light: false,
      loops: 0, seen: {}, moves: 0, clock: 0, flicker: null,
    })));
    await reload(); await hit('colonnade'); await hit('annex');
    check((await state()).scene === 'l0_annex', 'existing v1 saves can enter the new branches');
    await hit((await state()).flags.l01_mark);
    check((await state()).flags.l01_walk === 1, 'old saves get a B.N.T.G. arrow to follow');
    await page.evaluate(() => window.__rooms.g.go('l0_storage'));
    await hit('c1_box');
    check((await state()).scene === 'c1_entry', 'old saves can enter Level C-1');
    await page.evaluate(() => window.__rooms.g.go('l0_archive'));
    await hit('wormhole');
    check((await state()).scene === 'l04_worm', 'old saves can enter Level 0.4 wormhole');
    check(errors.length === 0, `no browser errors: ${errors.join(', ')}`);
    console.log('\nAll sublevel checks passed');
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
