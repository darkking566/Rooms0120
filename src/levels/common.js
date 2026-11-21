// Helpers shared by the Level 0, 1 and 2 scene files.
import { P, drawSmiler } from '../render.js';

export const PAL = {
  l0: { wall: '#c8b35e', ceil: '#d6cc96', floor: '#8f7d3b', fog: '#2a2410', light: '#fff4c8' },
  l1: { wall: '#5c5e5a', ceil: '#2e2f2d', floor: '#3e3f3c', fog: '#08090a', light: '#cfd8ee' },
  corridor: { wall: '#a6a39b', ceil: '#76736d', floor: '#64615b', fog: '#121110', light: '#f4efd8' },
  office: { wall: '#67635a', ceil: '#3a3833', floor: '#3e3a35', fog: '#0b0a09', light: '#e6e2cc' },
  deep: { wall: '#6a6460', ceil: '#33302c', floor: '#47423c', fog: '#0f0d0b', light: '#f0e2c8' },
  l2: { wall: '#5b4130', ceil: '#2b1d14', floor: '#3a291d', fog: '#0b0705', light: '#ffaa66' },
  exit: { wall: '#4a4440', ceil: '#262220', floor: '#302a26', fog: '#080808', light: '#bfffd0' },
};

export const hum = (t) => 0.975 + 0.025 * Math.sin(t * 55);
export const flickery = (t) => {
  const n = Math.sin(t * 13.1) + Math.sin(t * 7.3 + 1) + Math.sin(t * 29.7);
  return n > 2.35 ? 0.55 : 1;
};

export const BACK = (to, label = '往回走') => ({
  id: 'back', rect: [330, 470, 300, 70], label, cursor: 'back', click: (g) => g.go(to),
});
export const FORWARD = (to, label = '往前走', rect = [400, 205, 160, 140]) => ({
  id: 'forward', rect, label, cursor: 'go', click: (g) => g.go(to),
});

export const LOOP_MSGS = [
  '燈管的嗡嗡聲忽然變得很大，又慢慢退了下去。',
  '同樣的地毯，同樣的污漬。你剛才走過的路，好像被重新排列過了。',
  '牆的另一邊傳來抓撓聲，像有什麼東西在磨指甲。',
  '你回頭看了一眼。身後的走廊和前面一模一樣。',
];

// Screen-space rectangle you have to keep the cursor on to hold a smiler's gaze.
export function smilerRect(sm) {
  const [x, y, z] = sm.at;
  const p = P(x, y, z);
  return [p[0] - 60, p[1] - 40, 120, 80];
}
export function drawSmilers(ctx, sm, alpha, t, approach = 0) {
  if (sm.mode === 'stare') {
    const [x, y, z] = sm.at;
    const p = P(x, y, z);
    drawSmiler(ctx, p[0], p[1], (2.6 / z) * (1 + approach * 2.5), alpha, t);
  } else {
    sm.eyes.forEach(([x, y, z], i) => {
      const p = P(x, y, z);
      const blink = Math.sin(t * 0.7 + i * 2.3) > 0.97 ? 0 : 1;
      drawSmiler(ctx, p[0], p[1], (2.4 / z) * (1 + approach * 1.5), alpha * blink, t + i);
    });
  }
}
