// Jump-scare overlays, one per kind of monster. g.scare(back, msg, dmg, kind) picks one by name; a kind
// that is not listed here falls back to the smiler. To add a monster, add its drawing here.
// Each function draws at the shaken centre (x, y); k runs from 1.1 down to 0 over the scare, and a is
// the overlay's opacity.
import { H, drawSmiler, drawFigure } from './render.js';
import { drawDrowned, drawGrowler } from './sublevels.js';

export const SCARES = {
  smiler: (ctx, x, y, k, a, t) => drawSmiler(ctx, x, y, 5 + (1.1 - k) * 4, a, t),
  figure: (ctx, x, y, k, a) => drawFigure(ctx, x, H + 40, H * (1.2 + (1.1 - k) * 0.8), a),
  drowned: (ctx, x, y, k, a, t) => drawDrowned(ctx, x, H + 30, 2.6 + (1.1 - k) * 1.6, t, a),
  growler: (ctx, x, y, k, a, t) => drawGrowler(ctx, x, y - 40, 3 + (1.1 - k) * 3, a, t),
  // four claw marks raked across the screen
  claws: (ctx, x, y, k, a) => {
    ctx.save();
    ctx.strokeStyle = `rgba(200,30,30,${a})`; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      ctx.lineWidth = 10 - i;
      ctx.beginPath(); ctx.moveTo(x - 160 + i * 70, y - 180); ctx.lineTo(x - 60 + i * 70, y + 180); ctx.stroke();
    }
    ctx.restore();
  },
};

export function drawScare(ctx, kind, x, y, k, t) {
  (SCARES[kind] || SCARES.smiler)(ctx, x, y, k, Math.min(1, k * 2), t);
}
