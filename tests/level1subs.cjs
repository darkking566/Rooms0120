// Real-pointer routes through Level 1's sublevels (1.1, 1.2, 1.3, 1.5) and the Alpha base they hang off.
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
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    const url = `http://127.0.0.1:${server.address().port}/`;
    const state = () => page.evaluate(() => window.__rooms.state);
    const scene = async () => (await state()).scene;
    const flags = async () => (await state()).flags;
    const count = async (id) => (await state()).inv.filter((i) => i === id).length;
    const check = (cond, msg) => { assert.ok(cond, msg); console.log(`  ✓ ${msg}`); };
    const shot = async (name) => {
      if (!process.env.SHOTS) return;
      fs.mkdirSync(process.env.SHOTS, { recursive: true });
      await page.waitForTimeout(380);
      await page.locator('#stage').screenshot({ path: path.join(process.env.SHOTS, `${name}.png`) });
    };
    async function centre(id) {
      const hs = await page.evaluate(() => window.__rooms.hotspots());
      const h = hs.find((x) => x.id === id);
      assert.ok(h, `Missing hotspot ${id} in ${await scene()}`);
      const b = await page.locator('#game').boundingBox();
      const [x, y, w, hh] = h.rect;
      return [b.x + ((x + w / 2) / 960) * b.width, b.y + ((y + hh / 2) / 540) * b.height];
    }
    async function hit(id) {
      const [x, y] = await centre(id);
      await page.mouse.click(x, y);
      await page.waitForTimeout(80);
    }
    async function hold(id, ms) { const [x, y] = await centre(id); await page.mouse.move(x, y); await page.waitForTimeout(ms); }
    const use = async (item, target) => { await page.click(`.slot[data-id="${item}"]`); await hit(target); };
    const closeDoc = () => page.click('#docClose');
    const msg = () => page.textContent('#msg');
    const hotIds = async () => (await page.evaluate(() => window.__rooms.hotspots())).map((h) => h.id);
    // Put the run in Level 1 with what an ordinary playthrough has by then, and keep Level 1's follower quiet.
    async function startInLevel1(extra = []) {
      await page.goto(url);
      await page.click('#btnNew');
      await page.evaluate((extra) => {
        const g = window.__rooms.g;
        for (const id of ['torch', ...extra]) g.give(id);
        g.s.flags.torch = true;
        g.go('l1_corridor', { free: true });
      }, extra);
      await page.waitForTimeout(150);
    }
    const calm = () => page.evaluate(() => { const s = window.__rooms.state; s.ghost = null; s.dread = 0; s.sanity = 100; s.thirst = 100; s.hunger = 100; });

    console.log('Level 1 — the Alpha base');
    await startInLevel1();
    check((await hotIds()).includes('alpha'), 'the corridor has a way to the Alpha base');
    await hit('alpha'); await shot('l1s-00-alpha');
    check(await scene() === 'l1_alpha', 'the arrow leads to the Alpha base');
    await hit('board'); check(await page.isVisible('#doc'), 'the notice board can be read'); await closeDoc();
    check((await state()).notes.includes('n_alpha'), 'the notice is kept in the notes list');
    await hit('intercom'); check((await msg()).includes('白牆那邊封了'), 'the intercom warns about the white wall');
    await hit('white'); check((await flags()).l13_tape && await scene() === 'l1_alpha', 'the first click on the white wall only tears the seals');

    console.log('Level 1.1 — the Decrepit Corridor');
    await calm();
    await hit('south'); await shot('l1s-01-z1');
    check(await scene() === 'l11_z1', 'the south corridor enters Level 1.1');
    check((await state()).sanity === 98.5, 'stepping in costs Level 1.1\'s sanity drain');
    await hit('note'); await closeDoc();
    const almond0 = await count('almond');
    await hit('fridge'); check(await count('almond') === almond0 + 1 && await count('can') >= 1, 'zone 1 fridge holds water and food');
    await hit('fridge'); check(await count('almond') === almond0 + 1, 'the fridge only gives once');
    await hit('forward'); await shot('l1s-02-z2');
    check(await scene() === 'l11_z2', 'zone 2 is next');
    await hit('shelf'); check(await count('bar') >= 1, 'outpost 3 shelf has one bar left');
    await hit('cabin'); check(await scene() === 'l11_cabin', 'the 通道幫 door leads to Jakob\'s cabin');
    await hit('log'); check(await page.isVisible('#doc'), 'the gang log can be read'); await closeDoc();
    await hit('back');
    // noclipping out of Zone 2's glitching wall drops you somewhere random in Level 1
    await hit('glitch');
    const landed = await scene();
    check(['l1_arrive', 'l1_crates', 'l1_corridor', 'l1_fog'].includes(landed), `the glitching wall drops you into Level 1 (${landed})`);
    await page.evaluate(() => window.__rooms.g.go('l11_z2', { free: true }));
    await calm();
    await hit('forward'); await page.waitForTimeout(150);
    check(await scene() === 'l11_z3', 'zone 3 is pitch black');
    // light on: the smiler is drawn in
    if (!(await state()).light) await page.click('#btnLight');
    await page.waitForTimeout(2600);
    check(await scene() === 'l11_z2', 'a light in zone 3 draws the smiler in');
    await page.click('#btnLight'); check(!(await state()).light, 'flashlight off');
    await calm(); await hit('forward'); await page.waitForTimeout(120);
    check(!(await hotIds()).includes('crate'), 'nothing to find while the smiler is there and the light is off');
    await hold('smiler', 3400);
    check((await flags()).l11_smiler_gone, 'holding eye contact sends the zone 3 smiler away');
    await page.click('#btnLight'); await page.waitForTimeout(120); await shot('l1s-03-z3');
    await hit('crate');
    check(await page.isVisible('#keypad'), 'outpost 4 crate is locked with a keypad');
    for (const k of ['1', '2', '3', 'ok']) await page.click(`#kpKeys button[data-k="${k}"]`);
    check(await page.isVisible('#keypad') && !(await flags()).l11_crate, 'a wrong code keeps it shut');
    for (const k of ['7', '2', '6', 'ok']) await page.click(`#kpKeys button[data-k="${k}"]`);
    await page.waitForTimeout(80);
    check((await flags()).l11_crate && await page.isVisible('#doc'), 'the casualty count 7-2-6 opens it, with J.H.\'s note inside');
    await closeDoc();
    check(await count('battery') >= 1, 'the crate holds a spare battery');
    await hit('sign'); check((await msg()).includes('區域 4'), 'the warning sign is readable');
    await hit('deeper'); check(await scene() === 'l11_z3' && (await flags()).l11_warned, 'the first step past the sign is only a warning');
    await hit('deeper'); await page.waitForTimeout(100); await shot('l1s-04-z4');
    check(await scene() === 'l11_z4', 'zone 4 is a black-and-white deadzone');
    const s0 = (await state()).sanity; await page.waitForTimeout(2700);
    check((await state()).sanity < s0, 'the deadzone keeps draining sanity');
    await hit('light'); check(!(await page.isVisible('#ending')), 'the first step toward the light is survivable');
    await hit('light'); await page.waitForTimeout(150);
    check(await page.isVisible('#ending') && (await page.getAttribute('#ending', 'data-kind')) === 'void', 'following the zone 5 light ends in the void');

    console.log('Level 1.2 — the Garden of Concrete');
    await startInLevel1(['shears']);
    await page.evaluate(() => { const g = window.__rooms.g; g.s.flags.garden_open = true; g.go('l1_garden', { free: true }); });
    await calm();
    await hit('ivy'); check(await scene() === 'l1_garden' && !(await flags()).l12_open, 'the ivy is too thick to pull apart by hand');
    await use('shears', 'ivy'); check((await flags()).l12_open, 'the shears cut the ivy doorway open');
    await hit('ivy'); await shot('l1s-05-gate');
    check(await scene() === 'l12_gate' && (await flags()).l12_bloom === 1, 'Level 1.2: every step inside makes you bloom');
    await hit('book'); await closeDoc();
    await hit('forward');
    let f = await flags();
    const wrong = ['left', 'ahead', 'right'].find((d) => d !== f.l12_row.face);
    await hit(`row_${wrong}`);
    f = await flags();
    check(await scene() === 'l12_rows' && f.l12_row.step === 0 && f.l12_bloom === 4, 'a turn away from the sunflowers sends you back and makes you bloom faster');
    await shot('l1s-06-rows');
    await hit(`row_${f.l12_row.face}`); f = await flags();
    check(f.l12_row.step === 1, 'following the sunflowers\' faces advances');
    await hit(`row_${f.l12_row.face}`);
    check(await scene() === 'l12_heart', 'the sunflowers lead to the heart of the garden'); await shot('l1s-07-heart');
    await hit('kit'); check(await count('lilac') === 1, 'the botanist\'s kit holds a pressed lilac');
    await hit('note'); await closeDoc();
    const sl = (await state()).sanity;
    await page.click('.slot[data-id="lilac"]'); await page.click('.slot[data-id="lilac"]');
    check(await count('lilac') === 0 && (await state()).sanity > sl, 'smelling the lilac restores sanity');
    await hit('back'); await hit('back');
    f = await flags();
    check(await scene() === 'l1_garden' && f.l12_bloom === 0, 'walking out resets the bloom');
    // lingering until fully grown in throws you out
    await hit('ivy');
    await page.evaluate(() => { window.__rooms.state.flags.l12_bloom = 8; });
    await page.waitForTimeout(250);
    f = await flags();
    check(await scene() === 'l1_garden' && f.l12_bloom === 0, 'blooming all the way throws you back out into the Garden');

    console.log('Level 1.3 — Malignancy');
    await startInLevel1();
    await hit('alpha'); await hit('white'); await hit('white'); await shot('l1s-08-hall');
    check(await scene() === 'l13_hall', 'the slit in the white wall leads into Level 1.3');
    await hit('stretcher');
    await hit('ward'); await shot('l1s-09-ward');
    await hit('line'); check(await count('line') === 1, 'the ward tray holds a plastic line');
    await hit('autopsy'); await closeDoc(); await hit('memo'); await closeDoc();
    await hit('back');
    await use('line', 'hole'); check((await msg()).includes('衰退'), 'the hall hole teaches the line test');
    await hit('detox'); await shot('l1s-10-detox');
    const clean = (await flags()).l13_clean;
    check([0, 1, 2].includes(clean), 'one detox zone is still clean');
    const zones = ['zone_a', 'zone_b', 'zone_c'];
    const bad = zones.find((_, i) => i !== clean);
    await use('line', bad); check((await msg()).includes('不到一呎'), 'a decayed zone eats the line');
    await use('line', zones[clean]); check((await msg()).includes('一整碼'), 'the clean zone gives the whole line back');
    // the state survives a reload
    await page.reload(); await page.click('#btnCont'); await page.waitForTimeout(150);
    check(await scene() === 'l13_detox' && (await flags()).l13_clean === clean, 'the clean zone is remembered across a reload');
    let s1 = (await state()).sanity;
    await hit(bad); check((await state()).sanity < s1 && (await flags()).l13_burned, 'reaching into a decayed zone hurts');
    await page.evaluate(() => { window.__rooms.state.sanity = 40; });
    await hit(zones[clean]); s1 = (await state()).sanity;
    check(s1 > 70 && (await flags()).l13_healed, 'the clean zone heals you');
    await hit(zones[clean]); check((await state()).sanity === s1, 'and only once: it decays behind you');

    console.log('Level 1.5 — Inverted');
    await startInLevel1();
    await page.evaluate(() => window.__rooms.g.go('l1_office', { free: true }));
    await hit('window'); check(await scene() === 'l1_office', 'the first look at the office window only shows a meadow');
    await hit('window'); await shot('l1s-11-window');
    check(await scene() === 'l15_window', 'climbing through the window enters Level 1.5');
    check(!(await hotIds()).includes('back'), 'there is no way back through the window');
    await hit('window'); check((await msg()).includes('畫上去的'), 'the window behind you is painted on');
    await hit('log'); await closeDoc();
    await hit('report'); check((await state()).notes.includes('n15_meg'), 'the M.E.G. report has given up on anyone inside'); await closeDoc();
    await hit('forward'); await shot('l1s-12-halls');
    let nav = (await flags()).l15_nav;
    const labels = await page.evaluate(() => window.__rooms.hotspots().map((h) => h.label));
    check(labels.some((l) => l && l.includes('低語聲很響')), 'each way is labelled by how loud the whispers are');
    // walk toward the quiet twice and it takes you
    await hit(`whisper_${nav.quiet}`); nav = (await flags()).l15_nav;
    check(await scene() === 'l15_halls' && (await flags()).l15_pulls === 1, 'the quiet way is where they are');
    await hit(`whisper_${nav.quiet}`); await shot('l1s-13-mother');
    check(await scene() === 'l15_mother', 'a second time, it pulls you in');
    await page.waitForTimeout(8400);
    check(await scene() === 'l15_window', 'staying too long in the warm corridor throws you back to the window');
    await calm(); await hit('forward');
    for (let i = 0; i < 3; i++) { nav = (await flags()).l15_nav; await hit(`whisper_${nav.loud}`); }
    check(await scene() === 'l15_thin', 'following the loudest whispers leads where the wall is thin'); await shot('l1s-14-thin');
    await hit('note'); await closeDoc();
    await hit('seam');
    check(await scene() === 'l1_arrive' && (await msg()).includes('光就是光'), 'noclipping through the thin wall lands back in Level 1');
    check(!(await flags()).l1_fresh, 'the arrival message is shown once');

    check(errors.length === 0, `no page errors (${errors.join(' | ') || 'none'})`);
    console.log('All Level 1 sublevel checks passed');
  } finally {
    await browser?.close();
    server.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
