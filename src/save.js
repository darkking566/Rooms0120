// Save slots in localStorage: the autosave, and the checkpoint stored on entering each new level.
import { SCENES } from './scenes.js';

export const SAVE_KEY = 'rooms0120.save.v1';
export const CP_KEY = 'rooms0120.checkpoint.v1';

export const fresh = () => ({
  v: 1, scene: 'l0_start', inv: [], flags: {}, sanity: 100, notes: [], light: false, view: false, thirst: 100, hunger: 100,
  loops: 0, maze: 0, bo: null, holes: null, dread: 0, ghost: null, seen: {}, moves: 0, clock: 0, flicker: null,
});

// Storage can be missing or blocked (private windows, previews), so every access is guarded.
export const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch { /* storage unavailable */ } },
};

export const valid = (s) => s && s.v === 1 && SCENES[s.scene] && Array.isArray(s.inv);

export function clearSaves() { store.del(SAVE_KEY); store.del(CP_KEY); }
