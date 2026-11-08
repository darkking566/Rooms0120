// End-to-end playthrough in headless Chromium: plays the whole game with real mouse clicks.
// Run: npm test            (set SHOTS=<dir> to also save a screenshot of every scene)
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright');

const SHOTS = process.env.SHOTS;
let failures = 0;
const check = (cond, msg) => { if (!cond) { failures++; console.error(`  ✗ ${msg}`); } else console.log(`  ✓ ${msg}`); };

(async () => {
  const { createServer } = await import(path.join(__dirname, '..', 'server.mjs'));
  const server = createServer();
  await new Promise((r) => server.listen(0, r));
  const url = `http://127.0.0.1:${server.address().port}/`;

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url);

  const scene = () => page.evaluate(() => window.__rooms.state.scene);
  const shot = async (name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.locator('#stage').screenshot({ path: path.join(SHOTS, `${name}.png`) }); } };
  async function hit(id) {
    const hs = await page.evaluate(() => window.__rooms.hotspots());
    const h = hs.find((x) => x.id === id);
    if (!h) throw new Error(`hotspot "${id}" not visible in ${await scene()} (have: ${hs.map((x) => x.id).join(', ')})`);
    const box = await page.locator('#game').boundingBox();
    const [x, y, w, hh] = h.rect;
    const cx = box.x + ((x + w / 2) / 960) * box.width;
    const cy = box.y + ((y + hh / 2) / 540) * box.height;
    await page.mouse.move(cx, cy);
    await page.mouse.down(); await page.mouse.up();
    await page.waitForTimeout(120);
  }
  const closeDoc = async () => { await page.click('#docClose'); };
  const slot = async (id) => { await page.click(`.slot[data-id="${id}"]`); };
  const has = (id) => page.evaluate((i) => window.__rooms.state.inv.includes(i), id);

  const flags = () => page.evaluate(() => window.__rooms.state.flags);
  const sanity = () => page.evaluate(() => window.__rooms.state.sanity);
  const light = () => page.evaluate(() => window.__rooms.state.light);
  async function hold(id, ms) {
    const hs = await page.evaluate(() => window.__rooms.hotspots());
    const h = hs.find((x) => x.id === id);
    if (!h) throw new Error(`hotspot "${id}" not visible`);
    const box = await page.locator('#game').boundingBox();
    const [x, y, w, hh] = h.rect;
    await page.mouse.move(box.x + ((x + w / 2) / 960) * box.width, box.y + ((y + hh / 2) / 540) * box.height);
    await page.waitForTimeout(ms);
  }

  console.log('Level 0 — Threshold');
  await shot('00-title');
  await page.click('#btnNew');
  await page.waitForTimeout(400);
  check(await scene() === 'l0_start', 'starts in l0_start');
  await shot('01-l0_start');
  await hit('almond'); check(await has('almond'), 'picked up almond water');
  await hit('note'); check(await page.isVisible('#doc'), 'note n1 opens'); await closeDoc();
  check((await flags()).n1_seen, 'closing n1 notices the familiar handwriting');
  await hit('side'); check(await scene() === 'l0_pillar', 'entered pillar room'); await shot('02-l0_pillar');
  await hit('note'); await closeDoc();
  await hit('back'); await hit('forward'); check(await scene() === 'l0_hall', 'hallway'); await shot('03-l0_hall');
  await hit('forward'); check(await scene() === 'l0_loop', 'loop corridor (1)');
  await hit('forward'); await hit('cabinet');
  check((await page.evaluate(() => window.__rooms.state.inv.filter((i) => i === 'almond').length)) === 2, 'cabinet appears on the 2nd loop with almond water');
  const hs2 = await page.evaluate(() => window.__rooms.hotspots().map((h) => h.id));
  check(!hs2.includes('wall'), 'no flickering wall yet on the 2nd loop');
  await hit('forward');
  await page.waitForTimeout(300); await shot('04-l0_loop-wall');
  await hit('wall'); check(await scene() === 'l1_arrive', 'threw yourself through the flickering wall into Level 1');
  await page.waitForTimeout(300); await shot('05-l1_arrive');

  console.log('Level 1 — Habitable Zone');
  await hit('crate'); check(await has('torch_empty'), 'found empty flashlight');
  await hit('forward'); check(await scene() === 'l1_crates', 'warehouse'); await shot('06-l1_crates');
  await hit('note'); await closeDoc();
  await hit('crate'); check(await has('battery'), 'found battery');
  await page.waitForTimeout(2200);
  check(await page.evaluate(() => !!window.__rooms.state.flicker && window.__rooms.state.flicker.delay <= 0), 'Flickering event started');
  await shot('07-l1_flicker');
  let san = await sanity();
  await page.waitForTimeout(12500);
  check(await page.evaluate(() => window.__rooms.state.flicker === null), 'Flickering ended after the timeout');
  check(await sanity() < san, `staying in the halls during Flickering hurt you (${san} → ${await sanity()})`);
  await hit('exitdoor'); check(await scene() === 'l1_corridor', 'went through the green EXIT door'); await shot('08-l1_corridor');
  await hit('almond'); await hit('note'); await closeDoc();
  await hit('office'); check(await scene() === 'l1_office', 'office');
  await hit('lockbox'); check(await page.isVisible('#keypad'), 'keypad opens');
  for (const k of ['1', '2', '3', '4', 'ok']) await page.click(`#kpKeys button[data-k="${k}"]`);
  check(await page.isVisible('#keypad') && !(await has('valve')), 'wrong code rejected');
  for (const k of ['0', '1', '2', '0', 'ok']) await page.click(`#kpKeys button[data-k="${k}"]`);
  check(await has('valve'), 'code 0120 opens the lockbox');
  await closeDoc();
  await slot('battery'); await slot('torch_empty');
  check(await has('torch'), 'battery + flashlight combined');
  check(await light(), 'flashlight is on');
  await hit('back'); await hit('back'); await hit('forward');
  check(await scene() === 'l1_deep', 'deeper warehouse with pipes appearing'); await shot('09-l1_deep');
  await hit('forward'); check(await scene() === 'l2_pipes', 'smooth threshold into Level 2');
  await page.waitForTimeout(300); await shot('10-l2_pipes');

  console.log('Level 2 — Abandoned Utility Halls');
  await slot('almond'); await slot('almond'); await slot('almond'); await slot('almond');
  await hit('note'); await closeDoc();
  await hit('side'); check(await scene() === 'l2_dark', 'dark side passage with flashlight ON');
  await page.waitForTimeout(2600);
  check(await scene() === 'l2_pipes', 'the light drew the smiler in and scared you back');
  await page.click('#btnLight'); check(!(await light()), 'flashlight switched off');
  await hit('side'); await page.waitForTimeout(200);
  await shot('11-l2_dark-smiler');
  await hit('back');
  await page.waitForTimeout(2200);
  check(await scene() === 'l2_pipes', 'panicking (clicking away) gets you chased');
  await hit('side');
  await hold('smiler', 3400);
  check((await flags()).l2_smiler_gone, 'holding eye contact makes the smiler retreat');
  check(await scene() === 'l2_dark', 'still in the passage after the stare-down');
  await page.click('#btnLight');
  await hit('tube'); check(await has('tube'), 'found the spare fluorescent tube');
  await hit('almond'); await hit('note'); await closeDoc();
  await page.mouse.move(480, 300); await page.waitForTimeout(200); await shot('12-l2_dark-lit');
  await hit('back');
  const before = await sanity();
  await slot('almond'); await slot('almond');
  check(await sanity() > before || before === 100, 'drinking almond water restores sanity');
  await hit('forward'); check(await scene() === 'l2_valve', 'control room'); await shot('13-l2_valve');
  await hit('door'); check(await scene() === 'l2_valve', 'door locked before calibrating');
  await slot('valve'); await hit('panel');
  check((await flags()).valve_set, 'valve handle installed');
  await hit('panel'); check(await page.isVisible('#dials'), 'dials open');
  await page.click('#dialsOk');
  check(!(await flags()).solved, 'wrong pressure rejected');
  await hit('panel');
  for (const [i, n] of [[0, 5], [1, 8], [2, 3]]) for (let k = 0; k < n; k++) await page.click(`#dials .up[data-i="${i}"]`);
  await page.click('#dialsOk');
  check((await flags()).solved, 'R5 B8 Y3 solves the panel');
  await hit('door'); check(await scene() === 'l2_hall', 'into the unlit hall (flashlight on)');
  await page.waitForTimeout(2400);
  check(await scene() === 'l2_valve', 'light near the smiler nest gets you scared back');
  await page.click('#btnLight');
  await hit('door'); await page.waitForTimeout(300); await shot('14-l2_hall-dark');
  await hit('forward'); check(await scene() === 'l2_hall', 'cannot walk into the dark nest');
  await slot('tube'); await hit('fixture');
  check((await flags()).circuit, 'replacing the tube restores the series circuit');
  await page.waitForTimeout(400); await shot('15-l2_hall-lit');
  await hit('forward'); check(await scene() === 'l2_exit', 'reached the EXIT corridor');
  await hit('exit');
  await page.waitForTimeout(7500);
  check(await page.isVisible('#ending') && (await page.getAttribute('#ending', 'data-kind')) === 'escape', 'escape ending shown');
  await shot('16-ending');

  console.log('Save / load');
  await page.click('#btnAgain'); await page.waitForTimeout(300);
  await hit('side');
  await page.reload(); await page.waitForTimeout(300);
  check(await page.isVisible('#btnCont'), 'continue button offered after reload');
  await page.click('#btnCont'); await page.waitForTimeout(300);
  check(await scene() === 'l0_pillar', 'save restored the scene');

  console.log('Phone layout');
  const phone = await browser.newPage({ viewport: { width: 375, height: 740 } });
  await phone.goto(url);
  const sw = await phone.evaluate(() => document.documentElement.scrollWidth);
  check(sw <= 375, `no horizontal scroll at phone width (${sw}px)`);
  if (SHOTS) await phone.screenshot({ path: path.join(SHOTS, '17-phone.png') });

  check(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
  await browser.close();
  server.close();
  console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
