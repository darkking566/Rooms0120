// Real-pointer Playwright verification for the 25-room Level 1 expansion:
// tests all 4 new wings, shortcuts, power/keycard/keypad/shears puzzles, closeups, and zero browser errors.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const NEW_L1_SCENES = [
  'l1_dock', 'l1_truck', 'l1_sorting', 'l1_bntg_depot', 'l1_cold_corridor', 'l1_freezer',
  'l1_drainage', 'l1_cistern', 'l1_pump', 'l1_substation', 'l1_freight_lift', 'l1_garage_upper',
  'l1_burned_hall', 'l1_checkpoint', 'l1_canteen', 'l1_dorm_hall', 'l1_bunk', 'l1_washroom',
  'l1_greenhouse', 'l1_root_vault', 'l1_works_scaffold', 'l1_works_core', 'l1_control_corridor',
  'l1_laundry', 'l1_archive',
];

const WIKI_L1_SCENES = [
  'l1_aquila', 'l1_alpha_gate', 'l1_alpha_base', 'l1_toms_diner', 'l1_cornucopia',
  'l1_gild', 'l1_traders_keep', 'l1_traders_vault', 'l1_gothic', 'l1_hippocrates',
  'l1_fabled', 'l1_paths_hub', 'l1_rubber_room', 'l1_painting_room', 'l1_mattress_room',
  'l1_paths_stash', 'l1_skinstealer_hall', 'l1_threshold_gallery',
];

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

    const url = `http://127.0.0.1:${server.address().port}/?seed=120`;
    const state = () => page.evaluate(() => window.__rooms.state);
    const scene = () => page.evaluate(() => window.__rooms.state.scene);
    const has = (id) => page.evaluate((k) => window.__rooms.state.inv.includes(k), id);
    const flags = () => page.evaluate(() => window.__rooms.state.flags);
    const check = (cond, msg) => { assert.ok(cond, msg); console.log(`  ✓ ${msg}`); };

    async function hit(id) {
      const hs = await page.evaluate(() => window.__rooms.hotspots());
      const h = hs.find((x) => x.id === id);
      assert.ok(h, `Missing hotspot "${id}" in ${await scene()}`);
      const b = await page.locator('#game').boundingBox();
      const [x, y, w, hh] = h.rect;
      await page.mouse.click(b.x + ((x + w / 2) / 960) * b.width, b.y + ((y + hh / 2) / 540) * b.height);
      await page.waitForTimeout(80);
    }
    async function slot(id) {
      await page.click(`#inv button.slot[data-id="${id}"]`);
      await page.waitForTimeout(60);
    }
    async function closeDoc() {
      await page.waitForSelector('#doc:not([hidden])');
      await page.click('#docClose');
      await page.waitForTimeout(60);
    }
    async function closeCloseup(expected) {
      const cu = await page.evaluate(() => window.__rooms.closeup);
      check(cu === expected, `close-up "${expected}" opened`);
      await hit('closeup_back');
      await page.waitForFunction(() => !window.__rooms.closeup, null, { timeout: 5000, polling: 50 });
    }

    await page.goto(url);
    await page.click('#btnNew');
    await page.evaluate(() => {
      const g = window.__rooms.g;
      g.give('camcorder');
      g.give('torch');
      g.give('shears');
      g.s.sanity = 100; g.s.thirst = 100; g.s.hunger = 100;
      g.go('l1_crates', { free: true });
    });

    console.log('Level 1 Expansion — Wing A (Dock, Truck, Cold Storage)');
    await hit('dock'); check(await scene() === 'l1_dock', 'entered loading dock');
    await hit('note'); await closeDoc();
    await hit('truck'); check(await scene() === 'l1_truck', 'entered unmarked trailer');
    await hit('crate'); check(await has('almond') && await has('bar'), 'looted trailer crate');
    await hit('back'); check(await scene() === 'l1_dock', 'back to loading dock');

    await hit('cold'); check(await scene() === 'l1_cold_corridor', 'entered cold storage corridor');
    await hit('thermo');
    await hit('forward'); check(await scene() === 'l1_freezer', 'entered walk-in freezer');
    await hit('note'); await closeDoc();
    await hit('rack'); check(await has('can'), 'took can from freezer rack');
    await hit('porthole'); await closeCloseup('l1_freezer_porthole');
    await hit('back');

    console.log('Level 1 Expansion — Wing B (Drainage, Cistern, Pump & Shortcut)');
    await hit('drainage'); check(await scene() === 'l1_drainage', 'entered drainage culvert');
    await hit('forward'); check(await scene() === 'l1_cistern', 'entered underground cistern');
    await hit('canister'); await closeDoc();
    await hit('forward'); check(await scene() === 'l1_pump', 'entered pump room');
    await hit('log'); await closeDoc();
    await hit('wheel'); check(await has('battery'), 'pump wheel ejected battery');
    await hit('stairs_up'); check(await scene() === 'l1_deep', 'pump stairs shortcut up to l1_deep');
    await hit('pump'); check(await scene() === 'l1_pump', 'stairs back down to pump room');
    await hit('back'); await hit('back');
    check(await scene() === 'l1_drainage', 'returned to drainage culvert');

    console.log('Level 1 Expansion — Wing A2 (Sorting & B.N.T.G. Depot)');
    await hit('back'); await hit('back');
    check(await scene() === 'l1_dock', 'back at loading dock');
    await hit('forward'); check(await scene() === 'l1_sorting', 'entered automatic sorting bay');
    await hit('note'); await closeDoc();
    await hit('belt');
    await hit('forward'); check(await scene() === 'l1_bntg_depot', 'entered B.N.T.G. depot');
    await hit('counter'); await closeDoc();
    await hit('fusebox'); check(await has('l1_fuse'), 'collected high-voltage fuse');
    await hit('shelf');

    console.log('Level 1 Expansion — Wing C (Dorms, Bunk B-02, Washroom, Checkpoint, Burned Hall, Canteen)');
    await hit('dorms'); check(await scene() === 'l1_dorm_hall', 'cross-linked to dorms hallway');
    await hit('board'); await closeDoc();
    await hit('locker');
    await hit('bunk'); check(await scene() === 'l1_bunk', 'entered bunk B-02');
    await hit('footlocker');
    for (const k of ['0', '4', '1', '9', 'ok']) await page.click(`#kpKeys button[data-k="${k}"]`);
    await closeDoc();
    check((await flags()).l1_bunk_open && await has('pills'), '0419 unlocked B-02 footlocker');
    await hit('back');
    await hit('washroom'); check(await scene() === 'l1_washroom', 'entered washroom');
    await hit('tap'); await hit('cabinet');
    await hit('back'); await hit('back');
    check(await scene() === 'l1_checkpoint', 'reached quarantine checkpoint');
    await hit('board'); await closeDoc();
    await hit('uv_btn'); check((await flags()).l1_uv_on, 'toggled checkpoint UV light');
    await hit('drawer'); check(await has('l1_keycard'), 'found M.E.G. blue keycard');
    await hit('archive'); check(await scene() === 'l1_checkpoint', 'archive mag-door blocked while unpowered');
    await hit('back'); check(await scene() === 'l1_burned_hall', 'entered scorched north hall');
    await hit('note'); await closeDoc();
    await hit('tin');
    await hit('canteen'); check(await scene() === 'l1_canteen', 'entered outpost canteen');
    await hit('menu'); await closeDoc();
    await hit('counter');
    await hit('back'); await hit('back');
    check(await scene() === 'l1_outpost', 'burned hall connects back to M.E.G. outpost');

    console.log('Level 1 Expansion — Wing D1 (Conservatory & Root Vault)');
    await page.evaluate(() => { const g = window.__rooms.g; g.s.sanity = 100; g.s.thirst = 100; g.s.hunger = 100; });
    await hit('garden');
    if (await scene() === 'l1_outpost') await hit('garden');
    check(await scene() === 'l1_garden', 'entered Garden');
    await hit('greenhouse'); check(await scene() === 'l1_greenhouse', 'entered conservatory');
    await hit('table'); await closeDoc();
    await hit('tank');
    await hit('forward'); check(await scene() === 'l1_root_vault', 'entered root vault');
    await slot('shears'); await hit('chest');
    await hit('chest'); await closeDoc();
    check((await flags()).l1_vault_taken, 'shears opened root-bound chest in vault');
    await hit('back'); await hit('back'); await hit('back');
    check(await scene() === 'l1_outpost', 'returned to outpost');

    console.log('Level 1 Expansion — Wing B2 & D2 (Upper Ramp, Lift, Substation, Works, Control, Laundry, Archive)');
    await hit('back'); check(await scene() === 'l1_fog', 'back in fog hall');
    await hit('ramp_up'); check(await scene() === 'l1_garage_upper', 'climbed ramp to upper parking');
    await hit('sedan');
    await hit('back'); check(await scene() === 'l1_freight_lift', 'entered freight elevator lobby');
    await hit('note'); await closeDoc();
    await hit('shaft_a');
    await hit('substation'); check(await scene() === 'l1_substation', 'entered Sector-1 substation');
    await hit('note'); await closeDoc();
    await hit('panel');
    await slot('l1_fuse');
    await hit('cu_fuse_slot');
    check((await flags()).l1_power, 'installed high-voltage fuse inside substation closeup');
    await closeCloseup('l1_substation_panel');
    await hit('lift'); check(await scene() === 'l1_freight_lift', 'returned to powered freight lift');
    await hit('lift_b'); check((await flags()).l1_lift_loot, 'powered lift B hatch opened');
    await hit('substation');
    await hit('ctrl'); check(await scene() === 'l1_control_corridor', 'entered restricted control corridor');
    await hit('laundry'); check(await scene() === 'l1_laundry', 'entered utility laundry');
    await hit('drum'); await closeDoc();
    await hit('cart');
    await hit('back');
    await hit('works'); check(await scene() === 'l1_works_core', 'entered unfinished model hall');
    await hit('frame');
    await hit('rolls'); await closeDoc();
    await hit('crate');
    await hit('back'); check(await scene() === 'l1_works_scaffold', 'entered scaffolding sector');
    await hit('clipboard'); await closeDoc();
    await hit('back'); check(await scene() === 'l1_works', 'scaffold connects back to l1_works');
    await hit('scaffold'); await hit('forward'); await hit('ctrl');
    check(await scene() === 'l1_control_corridor', 'returned to control corridor');
    await slot('l1_keycard');
    await hit('archive');
    check((await flags()).l1_archive_open, 'keycard unlocked powered Archive mag-door');
    await hit('archive'); check(await scene() === 'l1_archive', 'entered Level 1 Archive');
    await hit('crt'); await closeCloseup('l1_archive_crt');
    await hit('cabinet'); await closeDoc();
    await hit('crate');

    console.log('Level 1 Wiki Canon — Aquila, Alpha Base, Tom\'s Diner, Argos, Gothic & Hippocrates-1');
    await page.evaluate(() => {
      const g = window.__rooms.g;
      g.s.sanity = 100; g.s.thirst = 100; g.s.hunger = 100;
      g.go('l1_arrive', { free: true });
    });
    await hit('aquila'); check(await scene() === 'l1_aquila', 'entered Aquila sector');
    await hit('debris'); check(await has('crowbar'), 'pulled crowbar from Aquila debris');
    await hit('landmark'); await closeDoc();
    await hit('puddle');
    await hit('forward'); check(await scene() === 'l1_alpha_gate', 'entered Alpha Base outer gate');
    await hit('booth'); await closeDoc();
    await hit('forward'); check(await scene() === 'l1_alpha_base', 'entered M.E.G. Alpha Base');
    await hit('tent'); await closeDoc();
    await hit('sublevels'); await closeDoc();
    await hit('diner'); check(await scene() === 'l1_toms_diner', 'entered Tom\'s Diner');
    await hit('tom'); check(await has('burger'), 'got cheeseburger & milkshake from Tom');
    await hit('menu'); await closeDoc();
    await hit('back');
    await hit('argos'); check(await scene() === 'l1_cornucopia', 'entered Cornucopia (Eyes of Argos)');
    await hit('notice'); await closeDoc();
    await hit('back'); await hit('back');
    await hit('gothic'); check(await scene() === 'l1_gothic', 'entered Gothic sector');
    await hit('note'); await closeDoc();
    await hit('web');
    await page.waitForFunction(() => !window.__rooms.scaring && window.__rooms.state.scene === 'l1_alpha_gate', null, { timeout: 6000, polling: 50 });
    check(await scene() === 'l1_alpha_gate', 'Nguithr\'xurh web scared player back to Alpha gate');
    await hit('gothic');
    await hit('forward'); check(await scene() === 'l1_hippocrates', 'skirted wall safely to Hippocrates-1');
    await hit('medic');
    await hit('clipp'); await closeCloseup('l1_clipp_poster');
    await hit('manual'); await closeCloseup('l1_entity_manual');

    console.log('Level 1 Wiki Canon — Gild, Trader\'s Keep/Vault, Fabled & Threshold Gallery');
    await hit('back'); await hit('back'); await hit('back');
    check(await scene() === 'l1_aquila', 'back at Aquila');
    await hit('gild'); check(await scene() === 'l1_gild', 'entered Gild sector');
    await hit('guide'); await closeDoc();
    await slot('crowbar'); await hit('crate1');
    check(await has('yarn'), 'crowbar opened Gild crate for yarn');
    await hit('forward'); check(await scene() === 'l1_traders_keep', 'entered B.N.T.G. Trader\'s Keep');
    await hit('sign'); await closeDoc();
    await hit('forward'); check(await scene() === 'l1_traders_vault', 'entered Trader\'s Vault');
    await hit('ledger'); await closeDoc();
    await hit('vault_crate'); await closeCloseup('l1_crate_open_cu');
    await hit('back'); await hit('back');
    await hit('fabled'); check(await scene() === 'l1_fabled', 'entered Fabled sector');
    await hit('plaque'); await closeDoc();
    await hit('forward'); check(await scene() === 'l1_threshold_gallery', 'entered Threshold Gallery');
    await hit('portals'); await closeCloseup('l1_hub_doors');
    await hit('note'); await closeDoc();
    await hit('door_l'); await hit('door_r'); await hit('door_f');
    check(await scene() === 'l1_threshold_gallery', 'completed Hub door sequence safely');

    console.log('Level 1 Wiki Canon — The Paths, Rubber/Painting/Mattress/Stash & Skin-Stealer');
    await hit('to_paths'); check(await scene() === 'l1_skinstealer_hall', 'entered Echo Hall from gallery');
    await hit('back'); check(await scene() === 'l1_paths_stash', 'entered Paths retail shelf room');
    await slot('crowbar'); await hit('ration_crate');
    check(await has('l1_ration'), 'crowbar opened ration crate for silver canteen');
    await hit('forward'); check(await scene() === 'l1_skinstealer_hall', 'back in Echo Hall');
    await hit('note'); await closeDoc();
    await hit('forward');
    await page.waitForFunction(() => !window.__rooms.scaring && window.__rooms.state.scene === 'l1_paths_stash', null, { timeout: 6000, polling: 50 });
    check(await scene() === 'l1_paths_stash', 'walking straight into Skin-Stealer scares you back');
    await hit('forward');
    await hit('observe'); check((await flags()).l1_skin_spotted, 'calling out exposed Skin-Stealer');
    await hit('forward'); check(await scene() === 'l1_threshold_gallery', 'calmly bypassed Skin-Stealer');
    await hit('to_paths'); await hit('back'); await hit('back');
    check(await scene() === 'l1_mattress_room', 'entered mattress shelter room');
    await hit('note'); await closeDoc();
    await hit('mattress');
    await hit('back'); check(await scene() === 'l1_paths_hub', 'entered Ariadne\'s Thread camp');
    await slot('yarn'); await hit('camp');
    await hit('note'); await closeDoc();
    check((await flags()).l1_yarn_marked, 'marked Paths with yarn');
    await slot('burger'); await slot('burger');
    await slot('l1_ration'); await slot('l1_ration');
    await hit('rubber'); check(await scene() === 'l1_rubber_room', 'entered Rubber Room');
    await hit('chair'); await hit('desk'); await closeDoc(); await hit('lock');
    await hit('back');
    await hit('paintings'); check(await scene() === 'l1_painting_room', 'entered Painting Room');
    await hit('paint_floor'); await hit('paint_wall'); await closeDoc();
    await hit('back'); await hit('back');
    check(await scene() === 'l1_aquila', 'returned from Paths to Aquila');

    const st = await state();
    for (const id of [...NEW_L1_SCENES, ...WIKI_L1_SCENES]) {
      check(!!st.seen[id], `visited Level 1 scene: ${id}`);
    }
    check(errors.length === 0, `no browser errors: ${errors.join(', ')}`);
    console.log(`\nAll ${NEW_L1_SCENES.length + WIKI_L1_SCENES.length} new Level 1 rooms verified!`);
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((err) => { console.error(err); process.exitCode = 1; });
