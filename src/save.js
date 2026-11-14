// Save-file migration. Every save and checkpoint goes through migrate() before the game uses it, so that
// content changes (renamed or removed scenes, items and notes, new state fields) never silently throw a
// player's save away.
//
// When you change the save format: bump SAVE_VERSION and add MIGRATIONS[oldVersion] that upgrades a save
// from oldVersion to oldVersion + 1.
// When you rename a scene: add SCENE_ALIASES[oldId] = newId. When you remove one: point its old id at the
// nearest scene that still exists.
import { SCENES } from './scenes.js';
import { ITEMS } from './items.js';
import { NOTES } from './notes.js';

export const SAVE_VERSION = 1;

// oldVersion → function upgrading a save from oldVersion to oldVersion + 1 (mutates and returns it)
export const MIGRATIONS = {};

// old scene id → current scene id
export const SCENE_ALIASES = {};

// where a save whose scene no longer exists (and has no alias) wakes up
export const FALLBACK_SCENE = 'l0_start';

const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

// Returns a save the game can start from, or null if `raw` is not a usable save (missing, corrupt, or
// written by a newer version of the game). `defaults` is a fresh state: it fills in any missing fields.
export function migrate(raw, defaults) {
  if (!isObj(raw)) return null;
  const s = structuredClone(raw);
  s.v = Number.isInteger(s.v) ? s.v : 1;
  if (s.v > SAVE_VERSION) return null;
  while (s.v < SAVE_VERSION) {
    const step = MIGRATIONS[s.v];
    if (!step) return null;
    step(s);
    s.v++;
  }

  // fill in fields added since the save was written, and repair ones with the wrong type
  for (const [k, v] of Object.entries(defaults)) {
    if (s[k] === undefined) s[k] = v;
    else if (isObj(v) && !isObj(s[k])) s[k] = v;
    else if (Array.isArray(v) && !Array.isArray(s[k])) s[k] = v;
    else if (typeof v === 'number' && !Number.isFinite(s[k])) s[k] = v;
  }

  let scene = s.scene;
  for (let i = 0; SCENE_ALIASES[scene] && i < 20; i++) scene = SCENE_ALIASES[scene];
  if (!SCENES[scene]) { scene = FALLBACK_SCENE; s.relocated = true; }
  s.scene = scene;

  // drop items and notes that no longer exist
  s.inv = s.inv.filter((id) => ITEMS[id]);
  s.notes = s.notes.filter((id) => NOTES[id]);
  if (s.ghost && !SCENES[s.ghost.scene]) s.ghost = null;
  return s;
}
