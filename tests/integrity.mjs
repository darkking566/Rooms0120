// Static content checks, no browser needed: every scene, item, note, ending and flag that the code refers to
// by name has to exist, and save migration has to keep old saves playable.
// Run: node tests/integrity.mjs   (part of npm test)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCENES, LEVELS } from '../src/scenes.js';
import { ITEMS } from '../src/items.js';
import { NOTES } from '../src/notes.js';
import { ENDINGS, COMPLETIONS } from '../src/endings.js';
import { SCARES } from '../src/scares.js';
import { GHOST_LOOT } from '../src/flavor.js';
import { migrate, SCENE_ALIASES, FALLBACK_SCENE, SAVE_VERSION, MIGRATIONS } from '../src/save.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
// game code that names scenes, items, notes and flags: main.js, items.js and every level file
const files = ['main', 'items', ...fs.readdirSync(path.join(root, 'src', 'levels')).filter((f) => f.endsWith('.js')).map((f) => `levels/${f.slice(0, -3)}`)]
  .map((f) => [f, fs.readFileSync(path.join(root, 'src', `${f}.js`), 'utf8')]);

let failures = 0;
const check = (cond, msg) => { if (cond) console.log(`  ✓ ${msg}`); else { failures++; console.error(`  ✗ ${msg}`); } };

// Every `pattern` match (group 1 is a literal id) must be a key of `table`.
function refs(name, pattern, table) {
  const bad = [];
  let n = 0;
  for (const [file, src] of files) {
    for (const m of src.matchAll(pattern)) {
      n++;
      if (!(m[1] in table)) bad.push(`${m[1]} (src/${file}.js:${src.slice(0, m.index).split('\n').length})`);
    }
  }
  check(bad.length === 0, `${n} ${name} all exist${bad.length ? `; missing: ${bad.join(', ')}` : ''}`);
}

console.log('References');
refs('scene targets of go()', /\bgo\('([\w.]+)'/g, SCENES);
refs('scene targets of scare()', /\bscare\('([\w.]+)'/g, SCENES);
refs('BACK/FORWARD targets', /\b(?:BACK|FORWARD)\('([\w.]+)'/g, SCENES);
refs('items given, taken or checked', /\b(?:give|take|has)\('([\w.]+)'/g, ITEMS);
refs('notes read', /\bread\('([\w.]+)'/g, NOTES);
refs('endings', /\bend\('(\w+)'/g, ENDINGS);
refs('trap endings', /\bend: '(\w+)'/g, ENDINGS);
refs('scare kinds', /\bscare\([^;]*?,\s*\d+,\s*'(\w+)'\)/g, SCARES);
check([...COMPLETIONS].every((k) => ENDINGS[k]), 'every ending that finishes the game exists');
check(GHOST_LOOT.every((id) => ITEMS[id]), 'supply crates only hold real items');

console.log('Scenes');
{
  const bad = Object.entries(SCENES).filter(([, sc]) => !(sc.level in LEVELS)).map(([id]) => id);
  check(bad.length === 0, `every scene belongs to a known level${bad.length ? `; bad: ${bad.join(', ')}` : ''}`);
}
{
  const bad = [];
  for (const [id, sc] of Object.entries(SCENES)) {
    if (!Array.isArray(sc.hotspots)) { bad.push(`${id}: no hotspots`); continue; }
    const seen = new Set();
    for (const h of sc.hotspots) {
      if (!h.id || !Array.isArray(h.rect) || h.rect.length !== 4 || !h.label) bad.push(`${id}/${h.id}: incomplete hotspot`);
      else if (typeof h.click !== 'function' && !h.use) bad.push(`${id}/${h.id}: does nothing`);
      // a hotspot id may repeat only when the copies are shown under different conditions
      if (seen.has(h.id) && !h.when) bad.push(`${id}/${h.id}: duplicate id`);
      seen.add(h.id);
      for (const k of Object.keys(h.use || {})) if (!ITEMS[k]) bad.push(`${id}/${h.id}: use of unknown item ${k}`);
    }
  }
  check(bad.length === 0, `hotspots are complete${bad.length ? `; ${bad.join('; ')}` : ''}`);
}
{
  const bad = [];
  for (const [id, it] of Object.entries(ITEMS)) for (const k of Object.keys(it.combine || {})) if (!ITEMS[k]) bad.push(`${id}+${k}`);
  check(bad.length === 0, `item combinations name real items${bad.length ? `; bad: ${bad.join(', ')}` : ''}`);
}
{
  // every scene except the start must be named somewhere as a string, or nobody can reach it
  const all = files.map(([, s]) => s).join('\n');
  const named = new Set([...all.matchAll(/'([\w.]+)'/g)].map((m) => m[1]));
  const orphans = Object.keys(SCENES).filter((id) => id !== 'l0_start' && !named.has(id));
  check(orphans.length === 0, `no unreachable scenes${orphans.length ? `; orphans: ${orphans.join(', ')}` : ''}`);
}

console.log('Flags');
{
  // a flag that is read but never set anywhere is almost always a typo
  // `const f = g.s.flags;` is a common shorthand; `f` only means flags until the next `const f = …`
  const flagText = files.map(([, src]) => src.split(/(?=\b(?:const|let) f = )/).map((part) => {
    const m = part.match(/^(?:const|let) f = ([^;]+);/);
    return m && !/\.flags$/.test(m[1].trim()) ? part.replace(/\bf\./g, '_.') : part;
  }).join('')).join('\n');
  const all = files.map(([, s]) => s).join('\n');
  const read = new Set([...flagText.matchAll(/\b(?:flags|f)\.(\w+)/g)].map((m) => m[1]));
  const written = new Set([
    ...[...all.matchAll(/\b(?:flag|once)\(\s*g\s*,\s*'(\w+)'|\bflag\('(\w+)'/g)].map((m) => m[1] || m[2]),
    ...[...flagText.matchAll(/\b(?:flags|f)\.(\w+)\s*(?:=(?!=)|\+\+|--|[+\-|&?]{1,2}=)/g)].map((m) => m[1]),
  ]);
  const dynamic = [...all.matchAll(/flags\[`(\w+)\$\{/g)].map((m) => m[1]);
  const typos = [...read].filter((k) => !written.has(k) && !dynamic.some((p) => k.startsWith(p)));
  check(typos.length === 0, `${read.size} flags read, all of them set somewhere${typos.length ? `; never set: ${typos.join(', ')}` : ''}`);
}

console.log('Saves');
const fresh = {
  v: SAVE_VERSION, scene: 'l0_start', inv: [], flags: {}, sanity: 100, notes: [], light: false, view: false, thirst: 100, hunger: 100,
  loops: 0, maze: 0, bo: null, holes: null, dread: 0, ghost: null, seen: {}, moves: 0, clock: 0, flicker: null,
};
{
  const main = files.find(([f]) => f === 'main')[1];
  const keys = main.match(/const fresh = \(\) => \(\{([\s\S]*?)\}\);/)[1].match(/\b(\w+):/g).map((k) => k.slice(0, -1));
  check(keys.join() === Object.keys(fresh).join(), 'this test knows every field of a fresh state (update `fresh` here when main.js changes)');
}
check(Object.keys(MIGRATIONS).every((v) => Number(v) < SAVE_VERSION), 'migrations only cover older versions');
for (let v = 1; v < SAVE_VERSION; v++) check(typeof MIGRATIONS[v] === 'function', `a migration from v${v} to v${v + 1} exists`);
check(SCENES[FALLBACK_SCENE], 'the fallback scene exists');
for (const [from, to] of Object.entries(SCENE_ALIASES)) check(SCENES[to] || SCENE_ALIASES[to], `alias ${from} → ${to} leads somewhere`);
check(migrate(null, fresh) === null && migrate('x', fresh) === null && migrate([], fresh) === null, 'garbage is not a save');
check(migrate({ ...fresh, v: SAVE_VERSION + 1 }, fresh) === null, 'saves from a newer version are refused rather than misread');
{
  const old = { v: 1, scene: 'l0_pillar', inv: ['torch', 'no_such_item'], flags: {}, sanity: 80, notes: ['n1', 'gone'], light: false, loops: 0, seen: {}, moves: 3, clock: 0, flicker: null };
  const s = migrate(old, fresh);
  check(s && s.scene === 'l0_pillar' && s.thirst === 100 && s.hunger === 100 && s.dread === 0, 'an early v1 save gets the newer fields');
  check(s.inv.join() === 'torch' && s.notes.join() === 'n1', 'items and notes that no longer exist are dropped');
  check(old.inv.length === 2, 'migration does not modify the stored object');
}
{
  const s = migrate({ ...fresh, scene: 'l9_removed', sanity: 'NaN', flags: [] }, fresh);
  check(s && s.scene === FALLBACK_SCENE && s.relocated, 'a save in a removed scene wakes up at the fallback scene');
  check(s.sanity === 100 && !Array.isArray(s.flags), 'corrupt fields are reset');
}
{
  const s = migrate({ ...fresh, v: undefined, scene: 'l1_arrive' }, fresh);
  check(s && s.v === SAVE_VERSION && s.scene === 'l1_arrive', 'a save without a version is treated as v1');
}

if (failures) { console.error(`\n${failures} integrity check(s) failed`); process.exit(1); }
console.log('\nAll integrity checks passed');
