// Inventory items: name, description, optional self-use and combinations, and a tiny drawn icon.

const loadTorch = (g) => {
  g.take('battery'); g.take('torch_empty');
  g.give('torch', '你把電池裝進手電筒。按一下開關——亮了。');
  g.setLight(true);
};

const insertTape = (g) => {
  g.take('tape'); g.flag('tape_in'); g.sfx('whirr');
  g.read('n0_tape', () => g.say('畫面一跳，螢幕角落亮起紅色的「REC」。你決定不再關掉它了。'));
};

// Extra tapes: watch them on the camcorder. They are J.H.'s earlier attempts.
const watch = (id) => (g) => {
  g.take(id); g.flag(`watched_${id}`); g.sfx('whirr');
  g.read(`n_${id}`, () => {
    const n = ['tape2', 'tape3', 'tape4'].filter((t) => g.s.flags[`watched_${t}`]).length;
    g.say(n === 3 ? '三卷帶子都看完了。你忽然很想讓另一個人也看看這些畫面。' : `你看完了這卷帶子。（額外的帶子：${n} / 3）`);
  });
};
const tapeItem = (n, where) => ({
  name: `錄影帶 #${n}`, desc: `一卷小型錄影帶，標籤上寫著「#${n}」。${where}`,
  combine: { camcorder: watch(`tape${n}`) },
});

export const ITEMS = {
  almond: {
    name: '杏仁水', desc: '微溫、帶點甜味。喝下去能讓腦袋清醒一些。',
    self: (g) => { g.take('almond'); g.sanity(30); g.drink(35); g.sfx('drink'); g.say('你喝下杏仁水。喉嚨不再發乾，嗡嗡聲也退遠了一些。'); },
  },
  almond_wet: {
    name: '濕掉的杏仁水', desc: '從濕地毯上撿來的。瓶蓋是鬆的，瓶底沾滿了地毯裡的水。',
    self: (g) => {
      g.take('almond_wet'); g.sanity(-12); g.drink(-10); g.sfx('drink');
      g.say('又鹹又苦，還帶著一股藥水味——這根本不是杏仁水，是從地毯裡滲進去的東西。喝完反而更渴了。');
    },
  },
  bar: {
    name: '能量棒', desc: '包裝上的字已經磨掉了。聞起來像燕麥和……灰塵。',
    self: (g) => { g.take('bar'); g.eat(40); g.sanity(5); g.sfx('eat'); g.say('你三兩口就把能量棒吞了下去。乾得難以下嚥，但胃裡總算有了東西。'); },
  },
  can: {
    name: '罐頭', desc: '有拉環的罐頭，標籤泡過水，看不出是什麼。',
    self: (g) => { g.take('can'); g.eat(55); g.drink(5); g.sfx('eat'); g.say('你拉開拉環。是糖水桃子——甜得讓你差點哭出來。'); },
  },
  tube: { name: '日光燈管', desc: '一根完好的日光燈管。' },
  torch_empty: { name: '手電筒（沒電）', desc: '電池槽是空的。', combine: { battery: loadTorch } },
  battery: { name: '電池', desc: '一顆普通的電池。看起來還有電。', combine: { torch_empty: loadTorch } },
  torch: { name: '手電筒', desc: '可以切換開關（也可以按 F 鍵）。小心：光會引來某些東西。', self: (g) => g.setLight(!g.s.light) },
  tape2: tapeItem(2, '和攝影機一起用就能播放。'),
  tape3: tapeItem(3, '和攝影機一起用就能播放。'),
  tape4: tapeItem(4, '上面還黏著紅色的地毯纖維。'),
  ladder: { name: '折疊梯', desc: '鋁製的折疊梯。可以架在高處的洞口下面，也可以橫著放。' },
  key: { name: '黃銅鑰匙', desc: '小小的黃銅鑰匙。標籤上寫著「別開」，字跡被手指摸得快看不見了。' },
  chalk: { name: '粉筆', desc: '一截很短的粉筆。可以在牆上寫字——如果這一層願意留著那些字的話。' },
  screwdriver: { name: '螺絲起子', desc: '一字的螺絲起子，握把上印著「後室重新裝修公司」。' },
  rod: { name: '金屬吊桿', desc: '從天花板上掉下來的金屬吊桿，差不多一個人高。可以用來搆高處或深處的東西，也可以拿來探路。' },
  camcorder: {
    name: '攝影機', desc: '一台舊型的手持攝影機，螢幕還亮著。再點一次就能舉起來透過觀景窗看（也可以按 V 鍵）。',
    self: (g) => g.setView(!g.s.view),
    combine: { tape: insertTape, tape2: watch('tape2'), tape3: watch('tape3'), tape4: watch('tape4') },
  },
  tape: { name: '錄影帶', desc: '一卷小型錄影帶，標籤上寫著「0120」。', combine: { camcorder: insertTape } },
  outpost_key: { name: 'M.E.G. 鑰匙', desc: '小鑰匙，吊牌上寫著「第七前哨站・物資籠」。吊牌背面有人用指甲刻了一道「正」字的第一筆。' },
  shears: { name: '修枝剪', desc: '刀刃上沾著綠色的汁液，還沒乾。' },
  pills: {
    name: '鎮定劑', desc: '鋁箔包裝的白色藥片。標籤上寫著「勿超過劑量」。',
    self: (g) => { g.take('pills'); g.sanity(40); g.drink(-5); g.sfx('drink'); g.say('藥片很苦。過了一會兒，嗡嗡聲退得很遠——連你自己的心跳也是。'); },
  },
  photo: { name: '拍立得照片', desc: '一間黃色的房間，牆角坐著一個人，臉被拍糊了。背面寫著：「第一次」。翻回正面時，牆角是空的。' },
  valve: { name: '閥門把手', desc: '沉甸甸的鐵製把手，接頭是方形的。' },
};

export function drawIcon(ctx, id, s = 56) {
  ctx.clearRect(0, 0, s, s);
  ctx.save();
  ctx.translate(s / 2, s / 2);
  ctx.lineCap = 'round';
  switch (id) {
    case 'almond':
    case 'almond_wet':
      ctx.fillStyle = '#e9e1c1'; ctx.beginPath(); ctx.roundRect(-9, -10, 18, 28, 5); ctx.fill();
      ctx.fillRect(-4, -19, 8, 10); ctx.fillStyle = '#3f6fb0'; ctx.fillRect(-5, -22, 10, 4);
      ctx.fillStyle = '#c9a46a'; ctx.fillRect(-9, 0, 18, 7);
      if (id === 'almond_wet') {
        ctx.fillStyle = 'rgba(90,70,30,0.75)'; ctx.beginPath(); ctx.roundRect(-9, 8, 18, 10, [0, 0, 5, 5]); ctx.fill();
        ctx.rotate(0.4); ctx.fillStyle = '#3f6fb0'; ctx.fillRect(-2, -26, 10, 4);
      }
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
    case 'outpost_key':
      ctx.strokeStyle = '#a8a8a0'; ctx.fillStyle = '#a8a8a0'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(-8, 0, 6, 0, Math.PI * 2); ctx.stroke();
      ctx.fillRect(-2, -2, 18, 4); ctx.fillRect(10, 2, 3, 5);
      ctx.fillStyle = '#c9a227'; ctx.fillRect(-20, 6, 10, 12);
      break;
    case 'shears':
      ctx.strokeStyle = '#b0b4b8'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-16, -16); ctx.lineTo(10, 10); ctx.moveTo(16, -16); ctx.lineTo(-10, 10); ctx.stroke();
      ctx.strokeStyle = '#3f6a32'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(-13, 14, 5, 0, Math.PI * 2); ctx.arc(13, 14, 5, 0, Math.PI * 2); ctx.stroke();
      break;
    case 'pills':
      ctx.fillStyle = '#c8ccd0'; ctx.fillRect(-14, -10, 28, 20);
      ctx.fillStyle = '#fff';
      for (const [x, y] of [[-7, -4], [0, -4], [7, -4], [-7, 4], [0, 4]]) { ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill(); }
      break;
    case 'photo':
      ctx.rotate(0.15);
      ctx.fillStyle = '#efeadc'; ctx.fillRect(-14, -16, 28, 32);
      ctx.fillStyle = '#b8a352'; ctx.fillRect(-11, -13, 22, 20);
      ctx.fillStyle = 'rgba(40,30,10,0.6)'; ctx.fillRect(3, -2, 5, 8);
      break;
    case 'ladder':
      ctx.strokeStyle = '#b8bcc0'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-9, 22); ctx.lineTo(-4, -22); ctx.moveTo(9, 22); ctx.lineTo(4, -22); ctx.stroke();
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) { const y = 16 - i * 9, w = 8.5 - i * 1.1; ctx.beginPath(); ctx.moveTo(-w, y); ctx.lineTo(w, y); ctx.stroke(); }
      break;
    case 'key':
      ctx.strokeStyle = '#d4b04a'; ctx.fillStyle = '#d4b04a'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(-9, 0, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.fillRect(-2, -2, 22, 4); ctx.fillRect(12, 2, 3, 6); ctx.fillRect(17, 2, 3, 4);
      break;
    case 'chalk':
      ctx.rotate(-0.6);
      ctx.fillStyle = '#f2f0e8'; ctx.fillRect(-12, -4, 24, 8);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(-12, 2, 24, 2);
      break;
    case 'screwdriver':
      ctx.rotate(0.7);
      ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.roundRect(-5, 4, 10, 18, 3); ctx.fill();
      ctx.fillStyle = '#b8bcc0'; ctx.fillRect(-1.5, -22, 3, 27);
      ctx.fillRect(-3, -24, 6, 3);
      break;
    case 'bar':
      ctx.rotate(-0.5);
      ctx.fillStyle = '#b8862e'; ctx.fillRect(-20, -7, 40, 14);
      ctx.fillStyle = '#7a5418'; ctx.fillRect(-20, -7, 6, 14); ctx.fillRect(14, -7, 6, 14);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-12, -4, 24, 3);
      break;
    case 'can':
      ctx.fillStyle = '#9aa0a6'; ctx.fillRect(-12, -14, 24, 28);
      ctx.fillStyle = '#c0392b'; ctx.fillRect(-12, -7, 24, 14);
      ctx.fillStyle = '#d0d4d8'; ctx.beginPath(); ctx.ellipse(0, -14, 12, 3, 0, 0, Math.PI * 2); ctx.fill();
      break;
    case 'rod':
      ctx.rotate(0.8);
      ctx.fillStyle = '#8d8f91'; ctx.fillRect(-2.5, -24, 5, 48);
      ctx.fillStyle = '#5c5e60'; ctx.fillRect(-4, -24, 8, 4); ctx.fillRect(-4, 20, 8, 4);
      break;
    case 'camcorder':
      ctx.fillStyle = '#2b2d30'; ctx.beginPath(); ctx.roundRect(-16, -9, 26, 20, 3); ctx.fill();
      ctx.fillStyle = '#44484c'; ctx.fillRect(10, -6, 9, 14);
      ctx.fillStyle = '#7da7c9'; ctx.beginPath(); ctx.arc(19, 1, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5a6a5c'; ctx.fillRect(-20, -13, 9, 7);
      ctx.fillStyle = '#d33'; ctx.beginPath(); ctx.arc(5, -4, 2, 0, Math.PI * 2); ctx.fill();
      break;
    case 'tape':
    case 'tape2':
    case 'tape3':
    case 'tape4':
      ctx.fillStyle = '#1e1e20'; ctx.beginPath(); ctx.roundRect(-18, -11, 36, 22, 2); ctx.fill();
      ctx.fillStyle = '#e9e1c1'; ctx.fillRect(-14, -9, 28, 6);
      ctx.fillStyle = '#777';
      for (const x of [-8, 8]) { ctx.beginPath(); ctx.arc(x, 4, 4, 0, Math.PI * 2); ctx.fill(); }
      if (id !== 'tape') { ctx.fillStyle = '#2b241a'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`#${id.slice(4)}`, 0, -4); }
      break;
    default:
      ctx.fillStyle = '#888'; ctx.fillRect(-10, -10, 20, 20);
  }
  ctx.restore();
}
