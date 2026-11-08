// Inventory items: name, description, optional self-use and combinations, and a tiny drawn icon.

const loadTorch = (g) => {
  g.take('battery'); g.take('torch_empty');
  g.give('torch', '你把電池裝進手電筒。按一下開關——亮了。');
  g.setLight(true);
};

export const ITEMS = {
  almond: {
    name: '杏仁水', desc: '微溫、帶點甜味。喝下去能讓腦袋清醒一些。',
    self: (g) => { g.take('almond'); g.sanity(35); g.sfx('drink'); g.say('你喝下杏仁水。嗡嗡聲退遠了一些。'); },
  },
  tube: { name: '日光燈管', desc: '一根完好的日光燈管。' },
  torch_empty: { name: '手電筒（沒電）', desc: '電池槽是空的。', combine: { battery: loadTorch } },
  battery: { name: '電池', desc: '一顆普通的電池。看起來還有電。', combine: { torch_empty: loadTorch } },
  torch: { name: '手電筒', desc: '可以切換開關（也可以按 F 鍵）。小心：光會引來某些東西。', self: (g) => g.setLight(!g.s.light) },
  valve: { name: '閥門把手', desc: '沉甸甸的鐵製把手，接頭是方形的。' },
};

export function drawIcon(ctx, id, s = 56) {
  ctx.clearRect(0, 0, s, s);
  ctx.save();
  ctx.translate(s / 2, s / 2);
  ctx.lineCap = 'round';
  switch (id) {
    case 'almond':
      ctx.fillStyle = '#e9e1c1'; ctx.beginPath(); ctx.roundRect(-9, -10, 18, 28, 5); ctx.fill();
      ctx.fillRect(-4, -19, 8, 10); ctx.fillStyle = '#3f6fb0'; ctx.fillRect(-5, -22, 10, 4);
      ctx.fillStyle = '#c9a46a'; ctx.fillRect(-9, 0, 18, 7);
      break;
    case 'tube':
      ctx.rotate(-0.7);
      ctx.fillStyle = '#f2f2ea'; ctx.fillRect(-4, -22, 8, 44);
      ctx.fillStyle = '#9a9a9a'; ctx.fillRect(-4, -24, 8, 4); ctx.fillRect(-4, 20, 8, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(-2, -18, 2, 36);
      break;
    case 'torch_empty':
    case 'torch':
      ctx.rotate(-0.6);
      ctx.fillStyle = '#2b2d30'; ctx.fillRect(-6, -8, 12, 28);
      ctx.fillStyle = '#44484c'; ctx.beginPath(); ctx.moveTo(-10, -20); ctx.lineTo(10, -20); ctx.lineTo(6, -8); ctx.lineTo(-6, -8); ctx.fill();
      ctx.fillStyle = id === 'torch' ? '#fff3b0' : '#666'; ctx.fillRect(-9, -22, 18, 3);
      break;
    case 'battery':
      ctx.fillStyle = '#c9a227'; ctx.fillRect(-8, -14, 16, 28);
      ctx.fillStyle = '#222'; ctx.fillRect(-8, 4, 16, 10);
      ctx.fillStyle = '#ccc'; ctx.fillRect(-3, -18, 6, 4);
      break;
    case 'valve':
      ctx.strokeStyle = '#b02a20'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(16, 0); ctx.moveTo(0, -16); ctx.lineTo(0, 16); ctx.stroke();
      ctx.fillStyle = '#555'; ctx.fillRect(-5, -5, 10, 10);
      break;
    default:
      ctx.fillStyle = '#888'; ctx.fillRect(-10, -10, 20, 20);
  }
  ctx.restore();
}
