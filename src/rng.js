// Gameplay randomness. Everything that changes what happens in the game (random events, puzzle layouts,
// loot) goes through rand(), so a run can be replayed with a fixed seed: add ?seed=<n> to the URL, or call
// window.__rooms.seed(n) / window.__rooms.setRandom(fn) from tests. Purely cosmetic noise (film grain,
// screen shake, sound pitch) keeps using Math.random.

let next = Math.random;

export const rand = () => next();
export const pick = (list) => list[Math.floor(rand() * list.length)];

// mulberry32: small, fast and good enough for a game
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedRandom(seed) { next = seed == null || Number.isNaN(Number(seed)) ? Math.random : mulberry32(Number(seed)); }
export function setRandom(fn) { next = typeof fn === 'function' ? fn : Math.random; }
