// Replaces Math.random in the page with a seeded PRNG (mulberry32) so test runs are repeatable.
// Pick a seed with SEED=<integer>; the default is 1. The init script runs again on every reload.
const SEED = Number.parseInt(process.env.SEED ?? '1', 10);
if (!Number.isFinite(SEED)) throw new Error(`SEED must be an integer, got ${JSON.stringify(process.env.SEED)}`);

async function seedPage(page) {
  await page.addInitScript((seed) => {
    let a = seed >>> 0;
    Math.random = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }, SEED);
  return page;
}

module.exports = { SEED, seedPage };
