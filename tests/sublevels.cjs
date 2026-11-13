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
    async function start() {
      await page.goto(url);
      await page.click('#btnNew');
      await hit('side'); await hit('annex');
      check((await state()).scene === 'l0_annex', 'new routes reachable from Level 0');
    }
    async function reload() {
      await page.reload(); await page.click('#btnCont');
    }
    async function use(item, target) {
      await page.click(`.slot[data-id="${item}"]`); await hit(target);
    }
    const closeDoc = () => page.click('#docClose');

    console.log('Level 0.1 — Zenith Station');
    await start(); await shot('sub-00-annex');
    await hit('guide'); await closeDoc();
    await hit('zenith');
    check(await page.textContent('#lvlName') === 'LEVEL 0.1', 'sublevel name appears in HUD');
    await shot('sub-01-zenith-airlock');
    await hit('forward'); check((await state()).scene === 'l01_airlock', 'airlock locked before repair');
    await hit('note'); await closeDoc(); await hit('robot'); await hit('robot');
    check((await state()).inv.filter((i) => i === 'fuse').length === 1, 'robot supplies exactly one fuse');
    const beforeSpark = (await state()).sanity;
    await use('fuse', 'panel');
    check((await state()).sanity === beforeSpark - 5 && (await state()).inv.includes('fuse'), 'live circuit hurts but keeps the fuse');
    await hit('isolate'); await reload();
    check((await state()).flags.l01_isolated && (await state()).inv.includes('fuse'), 'switch and inventory autosave without moving');
    await use('fuse', 'panel'); await reload();
    check((await state()).flags.l01_power && !(await state()).inv.includes('fuse'), 'repair and consumed item persist together');
    await hit('forward'); check((await state()).scene === 'l01_core', 'repaired airlock opens the observation room');
    await shot('sub-02-zenith-core');
    await hit('window'); await closeDoc(); await hit('supply'); await hit('supply');
    check((await state()).inv.filter((i) => i === 'almond').length === 1, 'station supplies cannot be farmed');
    await hit('back'); await hit('back');
    check((await state()).scene === 'l0_annex', 'station has a return route to Level 0');
    await hit('zenith'); await hit('forward'); await hit('noclip');
    check((await state()).scene === 'l1_arrive', 'station noclip connects to the existing main story');

    console.log('Level 0.3 — Icy Rooms');
    await start(); await hit('ice'); await shot('sub-03-ice-entry');
    const beforeCold = (await state()).sanity;
    await page.waitForTimeout(2300);
    check((await state()).sanity < beforeCold, 'cold drains sanity over time');
    await hit('note');
    const paused = (await state()).sanity;
    await page.waitForTimeout(2300);
    check((await state()).sanity === paused, 'reading pauses environmental damage'); await closeDoc();
    await hit('insulation'); await hit('forward'); await shot('sub-04-ice-vents');
    await hit('exit'); check((await state()).scene === 'l03_vents', 'ice blocks the shortcut');
    await hit('heater'); check(!(await state()).flags.l03_thawed, 'heater fails while cold air is still flowing');
    await use('insulation', 'vent'); await hit('heater');
    check((await state()).flags.l03_thawed && !(await state()).inv.includes('insulation'), 'insulation and heater thaw the passage');
    const warm = (await state()).sanity;
    await page.waitForTimeout(2200);
    check((await state()).sanity === warm, 'thawing stops cold damage');
    await shot('sub-05-ice-thawed'); await hit('exit');
    check((await state()).scene === 'l0_annex', 'thawed passage returns to Level 0');
    const bottles = (await state()).inv.filter((i) => i === 'almond').length;
    await hit('ice'); await hit('forward'); await hit('exit');
    check((await state()).inv.filter((i) => i === 'almond').length === bottles, 'thawed passage reward is not duplicated');

    // Retry must restore an achievable entry state, including puzzle items consumed later.
    await start(); await hit('ice'); await hit('insulation'); await hit('forward'); await use('insulation', 'vent');
    await page.evaluate(() => window.__rooms.g.sanity(-100));
    await page.waitForSelector('#ending:not([hidden])'); await page.click('#btnRetry');
    check((await state()).scene === 'l03_entry' && !(await state()).flags.l03_mat, 'retry restores the new level entry checkpoint');
    await hit('insulation');
    check((await state()).inv.includes('insulation'), 'puzzle supplies can be recovered after retry');

    console.log('Level 0.5 — Flooded corridors and hospital');
    await start(); await hit('flood'); await shot('sub-06-flood');
    await hit('note'); await closeDoc(); await hit('forward'); await shot('sub-07-hospital');
    await hit('forward'); check((await state()).scene === 'l05_hospital', 'pursuer blocks the stairs');
    await hit('note'); const huntPaused = (await state()).flags.l05_pursuit;
    await page.waitForTimeout(1000);
    check((await state()).flags.l05_pursuit === huntPaused, 'reading pauses the pursuer'); await closeDoc();
    const beforeHunt = (await state()).sanity;
    await page.waitForTimeout(15000);
    check((await state()).sanity <= beforeHunt - 18, 'waiting allows the pursuer to catch and hurt the player');
    await reload();
    check((await state()).flags.l05_hunted, 'reload preserves an active pursuit');
    await hit('supply'); await hit('back');
    check((await state()).flags.l05_dissolved && !(await state()).flags.l05_hunted, 'luring the drowned into water defeats it');
    await hit('forward'); await hit('forward'); await shot('sub-08-metal-stairs');
    check((await state()).scene === 'l05_stairs', 'defeating the pursuer opens the metal staircase');
    await hit('forward'); check((await state()).scene === 'l1_arrive', 'metal stairs lead into Level 1');

    console.log('Level 0.7 — Historical districts');
    await start(); await hit('memory'); await shot('sub-09-modern');
    await hit('static'); check((await state()).scene === 'l07_modern', 'static exits cannot be used as ordinary doors');
    await hit('note'); await closeDoc(); await hit('forward');
    check((await state()).scene === 'l07_victorian', 'modern corridor transitions to the Victorian era');
    await shot('sub-10-victorian'); await hit('forward');
    check((await state()).scene === 'l07_medieval', 'Victorian corridor transitions to medieval stonework');
    await shot('sub-11-medieval'); await hit('forward'); await shot('sub-12-egypt');
    check((await state()).scene === 'l07_egypt', 'deeper route reaches the Egyptian district');
    const beforeDeep = (await state()).sanity;
    await hit('deeper'); check((await state()).sanity === beforeDeep - 8, 'deeper entity territory is dangerous');
    await hit('rubbing'); await hit('rubbing');
    check((await state()).inv.filter((i) => i === 'rubbing').length === 1, 'ancient rubbing can only be taken once');
    await reload(); check((await state()).inv.includes('rubbing'), 'new inventory item survives a reload');
    await hit('back'); await hit('back'); await hit('back');
    await use('rubbing', 'archive'); check(await page.isVisible('#doc'), 'archive completion reveals the J.H. note'); await closeDoc();
    await reload();
    check((await state()).flags.l07_recorded && !(await state()).inv.includes('rubbing'), 'archive completion and consumed rubbing persist');
    await hit('back'); check((await state()).scene === 'l0_annex', 'walking toward newer eras returns to Level 0');

    console.log('Touch viewport and old saves');
    const mobile = await browser.newContext({ viewport: { width: 375, height: 740 }, hasTouch: true, isMobile: true });
    page = await mobile.newPage(); watch(page);
    await start(); await shot('sub-13-phone-annex');
    // Tap all four visible branch entrances using the same canvas coordinate conversion.
    for (const [portal, scene] of [['zenith', 'l01_airlock'], ['ice', 'l03_entry'], ['flood', 'l05_flood'], ['memory', 'l07_modern']]) {
      const hs = await page.evaluate(() => window.__rooms.hotspots());
      const h = hs.find((h) => h.id === portal), b = await page.locator('#game').boundingBox();
      await page.touchscreen.tap(b.x + (h.rect[0] + h.rect[2] / 2) / 960 * b.width, b.y + (h.rect[1] + h.rect[3] / 2) / 540 * b.height);
      check((await state()).scene === scene, `phone tap enters ${scene}`);
      await hit('note'); check(await page.isVisible('#doc'), 'new note readable at phone width'); await closeDoc();
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
    check(errors.length === 0, `no browser errors: ${errors.join(', ')}`);
    console.log('\nAll sublevel checks passed');
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
