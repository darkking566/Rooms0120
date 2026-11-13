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
  const view = () => page.evaluate(() => window.__rooms.state.view);
  const ids = () => page.evaluate(() => window.__rooms.hotspots().map((h) => h.id));
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
  await hit('almond'); check(await has('almond_wet'), 'picked up the bottle soaking in the carpet');
  { const before = await sanity(); await slot('almond_wet'); await slot('almond_wet');
    check(await sanity() < before && !(await has('almond_wet')), 'almond water from the carpet is tainted'); }
  await hit('note'); check(await page.isVisible('#doc'), 'note n1 opens'); await closeDoc();
  check((await flags()).n1_seen, 'closing n1 notices the familiar handwriting');
  await hit('side'); check(await scene() === 'l0_pillar', 'entered pillar room'); await shot('02-l0_pillar');
  await hit('note'); await closeDoc();
  check(!(await ids()).includes('deeper'), 'no way deeper into the pillar room to the naked eye');
  await hit('stairs'); check(await scene() === 'l0_stairs', 'stairwell off the pillar room'); await shot('03-l0_stairs');
  await hit('steps');
  await hit('up'); check(await scene() === 'l0_arches', 'climbed up to the arches'); await shot('04-l0_arches');
  await page.evaluate(() => { const st = window.__rooms.state; st.sanity = Math.min(st.sanity, 70); });
  { const s0 = await sanity(); await hit('rest'); check(await sanity() > s0, 'resting under an arch restores sanity'); }
  check(await page.evaluate(() => JSON.parse(localStorage.getItem('rooms0120.checkpoint.v1')).scene) === 'l0_arches', 'resting in the arches stores a checkpoint');
  { const s1 = await sanity(); await hit('rest'); check(await sanity() === s1, 'cannot rest again straight away'); }
  await hit('back'); await hit('down'); check(await scene() === 'l0_holes', 'went down to the holes');
  await page.waitForTimeout(200); await shot('05-l0_holes');
  await page.evaluate(() => window.__rooms.g.give('almond_wet'));
  { const st = await page.evaluate(() => window.__rooms.state.holes); const pitLane = ['left', 'mid', 'right'][st.pits.indexOf(true)];
    await slot('almond_wet'); await hit(pitLane); check(!(await has('almond_wet')) && (await flags()).holes_drop, 'a bottle dropped into a pit never lands'); }
  for (let i = 0; i < 3; i++) {
    const st = await page.evaluate(() => window.__rooms.state.holes);
    await hit(['left', 'mid', 'right'][st.pits.indexOf(false)]);
  }
  check(await page.evaluate(() => window.__rooms.state.holes.row) === 3 && !(await page.isVisible('#ending')), 'crossed the holes by stepping only on solid floor');
  await hit('bag'); await closeDoc(); check((await flags()).holes_bag, 'found the bag on the far side');
  await slot('almond'); await slot('almond'); await slot('almond'); await slot('almond');
  await hit('back'); await hit('back'); check(await scene() === 'l0_pillar', 'back to the pillar room');
  await hit('back');
  await hit('lowroom'); check(await scene() === 'l0_low', 'low room behind the left doorway'); await shot('06-l0_low');
  await hit('note'); await closeDoc();
  await hit('rod'); check(await has('rod'), 'picked up the metal rod');
  await hit('blackout'); check(await scene() === 'l0_blackout', 'entered the Blackout Zone');
  await page.waitForTimeout(200); await shot('07-l0_blackout');
  const bo = () => page.evaluate(() => window.__rooms.state.bo);
  { const b = await bo(); await hit(['left', 'ahead', 'right'].find((d) => d !== b.dir)); }
  check((await bo()).step === 0 && await scene() === 'l0_blackout', 'walking away from the hum loses you in the dark');
  for (let i = 0; i < 3; i++) await hit((await bo()).dir);
  check(await scene() === 'l0_manila', 'following the moving hum leads to the Manila Room');
  await page.waitForTimeout(200); await shot('08-l0_manila');
  for (let i = 0; i < 5; i++) await hit('jh');
  check((await flags()).met_jh && await has('almond'), 'talked to the figure in the Manila Room and got clean almond water');
  await hit('note'); await closeDoc();
  await hit('back'); check(await scene() === 'l0_low', 'leaving the Manila Room puts you back in the low room');
  await hit('back'); await hit('forward'); check(await scene() === 'l0_hall', 'hallway'); await shot('09-l0_hall');
  await hit('wetroom'); check(await scene() === 'l0_wet', 'soaked room off the hallway'); await shot('10-l0_wet');
  await hit('tile'); check(!(await has('camcorder')), 'sagging ceiling tile is out of reach by hand');
  await hit('note'); await closeDoc();
  await slot('rod'); await hit('tile');
  check(await has('camcorder') && await has('rod'), 'poking the tile with the rod drops the camcorder (the rod is kept)');
  await page.click('#btnView'); check(await view(), 'viewfinder raised');
  await page.waitForTimeout(200); await shot('11-l0_wet-viewfinder');
  await hit('dryroom'); check(await scene() === 'l0_dry', 'the carpet dries out in the corridor off the wet room'); await shot('12-l0_dry');
  await hit('ladder'); check(await has('ladder'), 'picked up the folding ladder');
  await hit('door'); check(await scene() === 'l02_room' && await page.textContent('#lvlName') === 'LEVEL 0.2', 'entered Level 0.2');
  await page.waitForTimeout(200); await shot('13-l02_room');
  await hit('toolbox'); check(await has('screwdriver') && (await flags()).l02_collapsed, 'taking the screwdriver makes the remodelled room collapse');
  await page.waitForTimeout(300); await shot('14-l02_house');
  await hit('tape2'); check(await has('tape2'), 'found tape #2 in the half-built house');
  await hit('door'); check(await scene() === 'l0_dry' && !(await flags()).l02_collapsed, 'escaped the collapsing house');
  await hit('back'); await hit('back');
  await slot('screwdriver'); await hit('outlet'); check(await has('tape3'), 'unscrewing the whispering outlet reveals tape #3');
  await hit('back'); await hit('lowroom');
  await slot('ladder'); await hit('hole'); check(await scene() === 'l0_ceiling', 'climbed the ladder into the space above the ceiling');
  await page.waitForTimeout(200); await shot('15-l0_ceiling');
  await hit('note'); await closeDoc();
  await hit('stash'); check((await flags()).ceil_stash, 'found the stash above the ceiling');
  await hit('forward'); check(await scene() === 'l0_ceiling2', 'crawled further along the ceiling space');
  await hit('duct'); await slot('rod'); await hit('duct'); check(await has('key'), 'hooked the key out of the duct with the rod');
  await slot('screwdriver'); await hit('grille'); check((await flags()).grille_open, 'unscrewed the grille above the faded room');
  await page.waitForTimeout(200); await shot('16-l0_ceiling2');
  await hit('wetdrop'); check(await scene() === 'l0_wet', 'dropped down into the wet room through its ceiling hole');
  await hit('back'); await hit('back'); await hit('side'); await hit('stairs'); await hit('up');
  await hit('door'); check(await scene() === 'l0_arches', 'the door in the arches is locked');
  await slot('key'); await hit('door'); await hit('door'); check(await scene() === 'l0_archive', 'the key opens the archive behind the arches');
  await page.waitForTimeout(200); await shot('17-l0_archive');
  await hit('drawers'); await closeDoc(); await hit('card'); await closeDoc();
  await hit('drawer0120'); await hit('chalk'); check(await has('chalk'), 'took the chalk from the archive desk');
  await hit('back'); await hit('back'); await hit('back'); await hit('back');
  await slot('chalk'); await hit('note'); check((await flags()).wrote_start, 'wrote on the wall next to the first note');
  await hit('forward');
  await hit('forward'); check(await scene() === 'l0_loop', 'loop corridor (1)');
  check((await ids()).includes('wall'), 'the viewfinder shows the flickering wall on the 1st loop');
  await hit('wall'); check(await scene() === 'l0_loop', 'without a tape the wall is solid');
  await hit('back'); await hit('back'); await hit('side');
  check((await ids()).includes('deeper'), 'the viewfinder reveals a doorway behind the pillars');
  await shot('18-l0_pillar-viewfinder');
  await hit('deeper'); check(await scene() === 'l0_maze', 'entered the cubicles');
  await hit('note'); await closeDoc();
  await shot('19-l0_maze');
  await hit('right'); await hit('right');
  check(await scene() === 'l0_maze' && (await page.evaluate(() => window.__rooms.state.maze)) === 0, 'a wrong turn sends you back to the first cubicle');
  for (const d of ['right', 'ahead', 'left', 'right']) await hit(d);
  check(await scene() === 'l0_faded', 'following the chalk arrows leads to the faded room');
  await page.waitForTimeout(200); await shot('20-l0_faded-viewfinder');
  await page.click('#btnView'); check(!(await view()), 'viewfinder lowered');
  await page.waitForTimeout(200); await shot('21-l0_faded');
  await hit('note'); await closeDoc();
  { const st0 = await page.evaluate(() => window.__rooms.state);
    check(st0.thirst < 100 && st0.hunger < 100, `walking uses up water and food (水分 ${st0.thirst.toFixed(1)}, 飽足 ${st0.hunger.toFixed(1)})`); }
  await hit('mat'); check(await has('bar'), 'found an energy bar under the cardboard bed');
  { const h0 = await page.evaluate(() => window.__rooms.state.hunger); await slot('bar'); await slot('bar');
    check(await page.evaluate(() => window.__rooms.state.hunger) > h0, 'eating the energy bar restores 飽足'); }
  { await page.evaluate(() => { window.__rooms.state.thirst = 40; });
    await slot('almond'); await slot('almond');
    check(await page.evaluate(() => window.__rooms.state.thirst) > 40, 'almond water restores 水分'); }
  await hit('tally'); await hit('locker'); check(await page.isVisible('#keypad'), 'locker keypad opens');
  for (const k of ['1', '2', 'ok']) await page.click(`#kpKeys button[data-k="${k}"]`);
  check(!(await has('tape')), 'the naked-eye tally count (12) is wrong');
  for (const k of ['2', '3', 'ok']) await page.click(`#kpKeys button[data-k="${k}"]`);
  check(await has('tape'), 'the tally seen through the lens (23) opens the locker');
  await slot('almond'); await slot('almond');
  await slot('tape'); await slot('camcorder');
  check((await flags()).tape_in && await page.isVisible('#doc'), 'tape loaded, footage plays');
  await closeDoc();
  await hit('back'); check(await scene() === 'l0_pillar', 'back to the pillar room');
  await hit('deeper'); check(await scene() === 'l0_faded', 'the route to the faded room stays put once walked');
  await hit('back'); await hit('back'); await hit('forward');
  await hit('forward'); check(await scene() === 'l0_loop', 'loop corridor (1) again');
  await slot('chalk'); await hit('mark'); check((await flags()).chalk_loop === 1, 'chalked a mark on the loop corridor wall');
  await hit('forward'); await hit('cabinet');
  check((await page.evaluate(() => window.__rooms.state.inv.filter((i) => i === 'almond').length)) >= 1, 'cabinet appears on the 2nd loop with almond water');
  const hs2 = await ids();
  check(!hs2.includes('wall'), 'no flickering wall to the naked eye on the 2nd loop');
  await hit('forward');
  await page.waitForTimeout(300); await shot('22-l0_loop-wall');
  await hit('forward'); check((await ids()).includes('redroom'), 'a red-lit corner appears after wandering long enough');
  await hit('redroom'); check(await scene() === 'l0_red', 'stepped into the Red Rooms');
  await hit('tape4'); check(await has('tape4'), 'grabbed tape #4 off the sticky carpet');
  await page.waitForTimeout(300); await shot('23-l0_red');
  await hit('back'); check(await scene() === 'l0_loop', 'turning back at once gets you out of the Red Rooms');
  for (const t of ['tape2', 'tape3', 'tape4']) { await slot(t); await slot('camcorder'); await closeDoc(); }
  check(await page.evaluate(() => ['tape2', 'tape3', 'tape4'].every((t) => window.__rooms.state.flags[`watched_${t}`])), 'watched all three extra tapes');
  await hit('back'); await hit('back'); await hit('lowroom'); await hit('blackout');
  for (let i = 0; i < 3; i++) await hit((await bo()).dir);
  check(await scene() === 'l0_manila', 'back in the Manila Room');
  await slot('camcorder'); await hit('jh');
  check((await flags()).freed_jh && !(await ids()).includes('jh'), 'showing him the tapes gets the figure in the corner to stand up and leave');
  await hit('back'); await hit('back'); await hit('forward'); await hit('forward');
  if (!(await view())) await page.click('#btnView');
  await hit('wall'); check(await scene() === 'l1_arrive', 'recording, you throw yourself through the flickering wall into Level 1');
  await page.waitForTimeout(300); await shot('24-l1_arrive');

  { const st = await page.evaluate(() => window.__rooms.state);
    console.log(`  · entering Level 1 after ${st.moves} steps: 清醒度 ${st.sanity.toFixed(0)}, 水分 ${st.thirst.toFixed(0)}, 飽足 ${st.hunger.toFixed(0)}`); }
  console.log('Level 1 — Habitable Zone');
  await hit('crate'); check(await has('torch_empty'), 'found empty flashlight');
  await hit('forward'); check(await scene() === 'l1_crates', 'warehouse'); await shot('25-l1_crates');
  await hit('note'); await closeDoc();
  await hit('crate'); check(await has('battery'), 'found battery');
  await page.waitForTimeout(2200);
  check(await page.evaluate(() => !!window.__rooms.state.flicker && window.__rooms.state.flicker.delay <= 0), 'Flickering event started');
  await shot('26-l1_flicker');
  let san = await sanity();
  await page.waitForTimeout(12500);
  check(await page.evaluate(() => window.__rooms.state.flicker === null), 'Flickering ended after the timeout');
  check(await sanity() < san, `staying in the halls during Flickering hurt you (${san} → ${await sanity()})`);
  await hit('exitdoor'); check(await scene() === 'l1_corridor', 'went through the green EXIT door'); await shot('27-l1_corridor');
  await hit('almond'); await hit('note'); await closeDoc();
  await hit('office'); check(await scene() === 'l1_office', 'office');
  await hit('lockbox'); check(await page.isVisible('#keypad'), 'keypad opens');
  for (const k of ['1', '2', '3', '4', 'ok']) await page.click(`#kpKeys button[data-k="${k}"]`);
  check(await page.isVisible('#keypad') && !(await has('outpost_key')), 'wrong code rejected');
  for (const k of ['0', '1', '2', '0', 'ok']) await page.click(`#kpKeys button[data-k="${k}"]`);
  check(await has('outpost_key') && !(await has('valve')), 'code 0120 opens the lockbox: the outpost key, not the valve');
  await closeDoc();
  await slot('battery'); await slot('torch_empty');
  check(await has('torch'), 'battery + flashlight combined');
  check(await light(), 'flashlight is on');
  await hit('back'); await hit('forward'); check(await scene() === 'l1_corridor2', 'deeper into the corridors'); await shot('28-l1_corridor2');
  await hit('infirmary'); check(await scene() === 'l1_infirmary', 'infirmary'); await shot('29-l1_infirmary');
  await hit('sheet'); await hit('chart'); await closeDoc();
  await hit('cabinet'); check(await has('pills'), 'found sedatives in the medicine cabinet');
  { const s0 = await sanity(); await slot('pills'); await slot('pills'); check(await sanity() > s0 || s0 === 100, 'a sedative restores sanity'); }
  await hit('back'); await hit('padded'); check(await scene() === 'l1_padded', 'the padded room; the door slams behind you'); await shot('30-l1_padded');
  if (await view()) await page.click('#btnView');
  await hit('back'); check(await scene() === 'l1_padded' && !(await ids()).includes('latch'), 'the door will not open and the latch cannot be seen');
  await hit('note'); await closeDoc();
  await page.click('#btnView');
  await hit('latch'); check(await scene() === 'l1_corridor2', 'the viewfinder shows the hidden latch and lets you out');
  await page.click('#btnView');
  await hit('forward'); check(await scene() === 'l1_works', 'the construction sector at the end of the corridors'); await shot('31-l1_works');
  await hit('clip'); await closeDoc(); await hit('gap');
  await hit('shears'); check(await has('shears'), 'took the shears from the workers\' cart');
  await hit('back'); await hit('back'); await hit('back'); await hit('back');
  check(await scene() === 'l1_arrive', 'back at the warehouse entrance');
  await hit('fog'); check(await scene() === 'l1_fog', 'into the fog'); await page.waitForTimeout(200); await shot('32-l1_fog');
  const fogDir = () => page.evaluate(() => window.__rooms.state.fogNav.dir);
  { const d = await fogDir(); await hit('fog_' + ['left', 'ahead', 'right'].find((x) => x !== d)); }
  check(await page.evaluate(() => window.__rooms.state.fogNav.step) === 0, 'walking away from the red light brings you back to the start');
  for (let i = 0; i < 3; i++) await hit('fog_' + await fogDir());
  check(await scene() === 'l1_outpost', 'following the red light leads to the M.E.G. outpost'); await shot('33-l1_outpost');
  await hit('log'); await closeDoc(); await hit('map'); await closeDoc(); await hit('radio');
  await hit('cage'); await slot('outpost_key'); await hit('cage'); await hit('cage');
  check(await has('valve'), 'the outpost key opens the supply cage with the valve handle');
  await hit('garden'); await hit('garden'); check(await scene() === 'l1_garden', 'pried open the sealed door into the Garden'); await shot('34-l1_garden');
  await hit('man'); await hit('bag'); check(!(await has('photo')), 'the bag is held fast by the vines');
  await slot('shears'); await hit('bag'); await hit('bag');
  check(await has('photo'), 'cut the vines with the shears and took the bag');
  await hit('back'); await hit('back'); await hit('back');
  check(await scene() === 'l1_arrive', 'out of the fog again');
  await slot('pills'); await slot('pills');
  { const st = await page.evaluate(() => window.__rooms.state);
    console.log(`  · leaving Level 1 after ${st.moves} steps: 清醒度 ${st.sanity.toFixed(0)}, 水分 ${st.thirst.toFixed(0)}, 飽足 ${st.hunger.toFixed(0)}`); }
  await hit('forward'); await hit('forward');
  check(await scene() === 'l1_deep', 'deeper warehouse with pipes appearing'); await shot('35-l1_deep');
  await hit('forward'); check(await scene() === 'l2_pipes', 'smooth threshold into Level 2');
  await page.waitForTimeout(300); await shot('36-l2_pipes');

  console.log('Level 2 — Abandoned Utility Halls');
  await slot('almond'); await slot('almond'); await slot('almond'); await slot('almond');
  await hit('note'); await closeDoc();
  await hit('side'); check(await scene() === 'l2_dark', 'dark side passage with flashlight ON');
  await page.waitForTimeout(2600);
  check(await scene() === 'l2_pipes', 'the light drew the smiler in and scared you back');
  await page.click('#btnLight'); check(!(await light()), 'flashlight switched off');
  await hit('side'); await page.waitForTimeout(200);
  await shot('37-l2_dark-smiler');
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
  await page.mouse.move(480, 300); await page.waitForTimeout(200); await shot('38-l2_dark-lit');
  await hit('back');
  const before = await sanity();
  await slot('almond'); await slot('almond');
  check(await sanity() > before || before === 100, 'drinking almond water restores sanity');
  await hit('forward'); check(await scene() === 'l2_valve', 'control room'); await shot('39-l2_valve');
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
  await hit('door'); await page.waitForTimeout(300); await shot('40-l2_hall-dark');
  await hit('forward'); check(await scene() === 'l2_hall', 'cannot walk into the dark nest');
  await slot('tube'); await hit('fixture');
  check((await flags()).circuit, 'replacing the tube restores the series circuit');
  await page.waitForTimeout(400); await shot('41-l2_hall-lit');
  await hit('forward'); check(await scene() === 'l2_exit', 'reached the EXIT corridor');
  { const st = await page.evaluate(() => window.__rooms.state);
    console.log(`  · at the exit after ${st.moves} steps: 清醒度 ${st.sanity.toFixed(0)}, 水分 ${st.thirst.toFixed(0)}, 飽足 ${st.hunger.toFixed(0)}`); }
  await hit('exit');
  await page.waitForTimeout(7500);
  check(await page.isVisible('#ending') && (await page.getAttribute('#ending', 'data-kind')) === 'escape', 'escape ending shown');
  check((await page.textContent('#endTitle')).includes('歸檔'), 'freeing J.H. turns it into the archived ending');
  await shot('42-ending');

  console.log('Save / load');
  await page.click('#btnAgain'); await page.waitForTimeout(300);
  await hit('side');
  await page.reload(); await page.waitForTimeout(300);
  check(await page.isVisible('#btnCont'), 'continue button offered after reload');
  await page.click('#btnCont'); await page.waitForTimeout(300);
  check(await scene() === 'l0_pillar', 'save restored the scene');

  console.log('Red Rooms ending');
  await page.evaluate(() => window.__rooms.g.go('l0_red', { free: true }));
  await page.waitForTimeout(9800);
  check(await page.isVisible('#ending') && (await page.getAttribute('#ending', 'data-kind')) === 'red', 'lingering in the Red Rooms ends the game');
  check(await page.isVisible('#btnRetry'), 'retry offered after the Red Rooms ending');

  console.log('Dehydration');
  await page.click('#btnRetry'); await page.waitForTimeout(300);
  await page.evaluate(() => { const st = window.__rooms.state; st.thirst = 0.5; st.sanity = 6; });
  { const s0 = await sanity(); await page.evaluate(() => window.__rooms.g.go('l0_stairs'));
    check(await sanity() <= s0 - 4, 'running out of water drains extra sanity'); }
  await page.evaluate(() => window.__rooms.g.go('l0_pillar'));
  await page.waitForTimeout(1200);
  check(await page.isVisible('#ending') && (await page.getAttribute('#ending', 'data-kind')) === 'thirst', 'losing all sanity while dehydrated gives the dehydration ending');
  check(await page.isVisible('#btnRetry'), 'retry offered after the dehydration ending');

  console.log('Holes ending');
  await page.click('#btnRetry'); await page.waitForTimeout(300);
  await page.evaluate(() => { const r = window.__rooms; r.state.holes = { row: 3, pits: [false, false, false] }; r.g.go('l0_holes', { free: true }); });
  await hit('passage'); check(await scene() === 'l0_blackout', 'a passage beyond the holes leads into the Blackout Zone');
  await page.evaluate(() => { const r = window.__rooms; r.g.give('ladder'); r.state.holes = { row: 0, pits: [true, true, false] }; r.g.go('l0_holes', { free: true }); });
  if (!(await has('rod'))) await page.evaluate(() => window.__rooms.g.give('rod'));
  await slot('rod'); await hit('left');
  check(await scene() === 'l0_holes' && !(await page.isVisible('#ending')), 'probing a pit with the rod is safe');
  await slot('ladder'); await hit('left');
  check(await page.evaluate(() => window.__rooms.state.holes.row) === 1 && !(await page.isVisible('#ending')), 'laying the ladder across a pit gets you over it');
  await page.evaluate(() => { const r = window.__rooms; r.g.go('l0_stairs', { free: true }); r.state.holes = { row: 0, pits: [true, false, false] }; r.g.go('l0_holes', { free: true }); });
  await page.waitForTimeout(200);
  await hit('left');
  await page.waitForTimeout(300);
  check(await page.isVisible('#ending') && (await page.getAttribute('#ending', 'data-kind')) === 'fall', 'stepping into a pit ends the game');

  console.log('Archive ending');
  await page.click('#btnRetry'); await page.waitForTimeout(300);
  await page.evaluate(() => { const r = window.__rooms; if (!r.state.inv.includes('camcorder')) r.g.give('camcorder'); r.state.flags.archive_open = true; r.g.go('l0_archive', { free: true }); });
  await page.waitForTimeout(200);
  await slot('camcorder'); await hit('drawer0120');
  await page.waitForTimeout(300);
  check(await page.isVisible('#ending') && (await page.getAttribute('#ending', 'data-kind')) === 'archive', 'filing the camcorder in drawer 0120 gives the 0120 ending');

  console.log('Phone layout');
  const phone = await browser.newPage({ viewport: { width: 375, height: 740 } });
  await phone.goto(url);
  const sw = await phone.evaluate(() => document.documentElement.scrollWidth);
  check(sw <= 375, `no horizontal scroll at phone width (${sw}px)`);
  if (SHOTS) await phone.screenshot({ path: path.join(SHOTS, '43-phone.png') });

  check(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
  await browser.close();
  server.close();
  console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
