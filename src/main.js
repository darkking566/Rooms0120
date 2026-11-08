// Game loop, state, input and UI glue.
import { W, H, drawRoom, postFX, drawDark, drawSmiler, clamp } from './render.js';
import { SCENES, LEVELS, drawSceneSmiler } from './scenes.js';
import { ITEMS, drawIcon } from './items.js';
import { NOTES } from './notes.js';
import { Sound } from './audio.js';

const SAVE_KEY = 'rooms0120.save.v1';
const CP_KEY = 'rooms0120.checkpoint.v1';
const $ = (s) => document.querySelector(s);
const cv = $('#game');
const ctx = cv.getContext('2d');
const sound = new Sound();

const fresh = () => ({
  v: 1, scene: 'l0_start', inv: [], flags: {}, sanity: 100, notes: [], light: false,
  loops: 0, seen: {}, moves: 0, clock: 0,
});

let S = fresh();
let playing = false;
let selected = null;
let hover = null;
let mouse = { x: W / 2, y: H / 2 };
let fade = 0, scareT = 0, darkT = 0, scareBack = null;
let modal = null;
let msgTimer = null;
let ended = false;

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch { /* storage unavailable */ } },
};
const valid = (s) => s && s.v === 1 && SCENES[s.scene] && Array.isArray(s.inv);
const save = () => { if (playing && !ended) store.set(SAVE_KEY, S); };

// ---------- the API that scenes and items talk to ----------
const g = {
  get s() { return S; },
  go(id, { free = false, msg = null } = {}) {
    const sc = SCENES[id];
    if (!sc || ended) return;
    const prevLevel = SCENES[S.scene].level;
    fade = 1;
    sound.sfx('step');
    S.scene = id;
    S.moves++;
    darkT = 0;
    hover = null;
    sound.setLevel(sc.level);
    const first = !S.seen[id];
    S.seen[id] = true;
    if (msg) g.say(msg);
    sc.enter?.(g, { first });
    if (!free) g.sanity(-LEVELS[sc.level].drain);
    if (sc.level !== prevLevel) store.set(CP_KEY, S);
    if (S.sanity > 0 && S.sanity < 35 && !msg && Math.random() < 0.4) g.say(WHISPERS[Math.floor(Math.random() * WHISPERS.length)]);
    updateHud();
    save();
  },
  say(text) {
    const el = $('#msg');
    el.textContent = text;
    el.hidden = false;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => { el.hidden = true; }, 2600 + text.length * 70);
  },
  give(id, msg) { S.inv.push(id); sound.sfx('pick'); renderInv(); if (msg) g.say(msg); },
  take(id) {
    const i = S.inv.indexOf(id);
    if (i >= 0) S.inv.splice(i, 1);
    if (selected === id && !S.inv.includes(id)) selected = null;
    renderInv();
  },
  has: (id) => S.inv.includes(id),
  flag(k, v = true) { S.flags[k] = v; },
  read(id) {
    if (!S.notes.includes(id)) S.notes.push(id);
    sound.sfx('page');
    $('#docTitle').textContent = NOTES[id].title;
    $('#docBody').textContent = NOTES[id].body;
    openModal('doc');
  },
  sanity(d) {
    S.sanity = clamp(S.sanity + d, 0, 100);
    updateHud();
    if (S.sanity <= 0 && !ended) setTimeout(() => g.end('lost'), 700);
  },
  sfx: (n) => sound.sfx(n),
  setLight(on) {
    if (!g.has('torch')) return;
    S.light = on;
    sound.sfx('click');
    updateHud();
  },
  keypad(code, ok) { openKeypad(code, ok); },
  dials(cfg) { openDials(cfg); },
  scare(back) {
    if (scareT > 0 || ended) return;
    scareT = 1.1;
    scareBack = back;
    sound.sfx('sting');
    g.sanity(-25);
  },
  end(kind) {
    if (ended) return;
    ended = true;
    closeModal();
    if (kind === 'escape') { store.del(SAVE_KEY); store.del(CP_KEY); }
    showEnding(kind);
  },
};

const WHISPERS = [
  '你聽見有人在叫你的名字。不，是燈管的聲音。',
  '牆壁好像在呼吸。',
  '你的手在發抖。也許該喝點什麼。',
  '你忘了自己為什麼要往前走。',
];

// ---------- hotspots & input ----------
const visible = () => SCENES[S.scene].hotspots.filter((h) => !h.when || h.when(S));
const inRect = (r, x, y) => x >= r[0] && y >= r[1] && x <= r[0] + r[2] && y <= r[1] + r[3];
function hitTest(x, y) {
  const hs = visible();
  for (let i = hs.length - 1; i >= 0; i--) if (inRect(hs[i].rect, x, y)) return hs[i];
  return null;
}
function toCanvas(e) {
  const r = cv.getBoundingClientRect();
  return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
}

cv.addEventListener('pointermove', (e) => {
  mouse = toCanvas(e);
  if (!playing || modal) return;
  hover = hitTest(mouse.x, mouse.y);
  cv.dataset.cursor = hover ? hover.cursor || 'look' : '';
  const tip = $('#tip');
  if (hover && e.pointerType !== 'touch') {
    tip.textContent = selected ? `用「${ITEMS[selected].name}」→ ${hover.label}` : hover.label;
    tip.hidden = false;
    const r = cv.getBoundingClientRect();
    const st = $('#stage').getBoundingClientRect();
    tip.style.left = `${e.clientX - st.left + 14}px`;
    tip.style.top = `${e.clientY - st.top + 16}px`;
    void r;
  } else tip.hidden = true;
});
cv.addEventListener('pointerleave', () => { $('#tip').hidden = true; });

cv.addEventListener('pointerdown', (e) => {
  if (!playing || modal || scareT > 0 || ended) return;
  mouse = toCanvas(e);
  const h = hitTest(mouse.x, mouse.y);
  $('#tip').hidden = true;
  if (!h) { if (selected) { selected = null; renderInv(); } return; }
  if (selected) {
    const item = selected;
    selected = null;
    renderInv();
    if (h.use?.[item]) h.use[item](g);
    else g.say(`「${ITEMS[item].name}」在這裡派不上用場。`);
    return;
  }
  h.click(g);
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (modal) closeModal();
    else if (selected) { selected = null; renderInv(); }
  }
  if ((e.key === 'f' || e.key === 'F') && playing && !modal && g.has('torch')) g.setLight(!S.light);
});

// ---------- inventory ----------
function renderInv() {
  const inv = $('#inv');
  inv.innerHTML = '';
  const counts = {};
  for (const id of S.inv) counts[id] = (counts[id] || 0) + 1;
  const ids = Object.keys(counts);
  if (!ids.length) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = '物品欄是空的。';
    inv.append(p);
  }
  for (const id of ids) {
    const b = document.createElement('button');
    b.className = 'slot' + (selected === id ? ' sel' : '');
    b.dataset.id = id;
    b.title = `${ITEMS[id].name}：${ITEMS[id].desc}`;
    const c = document.createElement('canvas');
    c.width = c.height = 56;
    drawIcon(c.getContext('2d'), id);
    const label = document.createElement('span');
    label.textContent = ITEMS[id].name;
    b.append(c, label);
    if (counts[id] > 1) { const n = document.createElement('i'); n.textContent = `×${counts[id]}`; b.append(n); }
    b.addEventListener('click', () => onSlot(id));
    inv.append(b);
  }
}
function onSlot(id) {
  if (!playing || modal || ended) return;
  const item = ITEMS[id];
  if (selected && selected !== id) {
    const comb = ITEMS[selected].combine?.[id];
    selected = null;
    if (comb) comb(g); else g.say('這兩樣東西湊不到一起。');
  } else if (selected === id) {
    selected = null;
    if (item.self) item.self(g); else g.say(item.desc);
  } else {
    selected = id;
    g.say(`${item.name}：${item.desc}${item.self ? '（再點一次直接使用）' : '（點畫面中的東西來使用）'}`);
  }
  renderInv();
}

// ---------- HUD ----------
function updateHud() {
  const L = LEVELS[SCENES[S.scene].level];
  $('#lvlName').textContent = L.name;
  $('#lvlSub').textContent = `${L.sub}・${SCENES[S.scene].title}`;
  const fill = $('#sanFill');
  fill.style.width = `${S.sanity}%`;
  fill.dataset.low = S.sanity < 35 ? '1' : '';
  $('#san').title = `清醒度 ${Math.round(S.sanity)} / 100`;
  const bl = $('#btnLight');
  bl.hidden = !g.has('torch');
  bl.textContent = `手電筒：${S.light ? '開' : '關'}`;
  bl.setAttribute('aria-pressed', S.light ? 'true' : 'false');
}
$('#btnLight').addEventListener('click', () => g.setLight(!S.light));
$('#btnSave').addEventListener('click', () => { g.say(store.set(SAVE_KEY, S) ? '已存檔。' : '這個瀏覽器無法存檔。'); });
$('#btnMute').addEventListener('click', () => {
  sound.setMuted(!sound.muted);
  $('#btnMute').textContent = `音效：${sound.muted ? '關' : '開'}`;
});
$('#btnNotes').addEventListener('click', () => {
  const ul = $('#notesList');
  ul.innerHTML = '';
  if (!S.notes.length) { const li = document.createElement('li'); li.textContent = '還沒有撿到任何紙條。'; ul.append(li); }
  for (const id of S.notes) {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.textContent = NOTES[id].title;
    b.addEventListener('click', () => { closeModal(); g.read(id); });
    li.append(b); ul.append(li);
  }
  openModal('notes');
});

// ---------- modals ----------
function openModal(id) { closeModal(); modal = id; $(`#${id}`).hidden = false; $('#tip').hidden = true; }
function closeModal() { if (modal) $(`#${modal}`).hidden = true; modal = null; }
$('#docClose').addEventListener('click', closeModal);
$('#notesClose').addEventListener('click', closeModal);
$('#kpClose').addEventListener('click', closeModal);
$('#dialsClose').addEventListener('click', closeModal);
for (const m of document.querySelectorAll('.modal')) m.addEventListener('pointerdown', (e) => { if (e.target === m) closeModal(); });

function openKeypad(code, ok) {
  let entry = '';
  const screen = $('#kpScreen');
  const show = () => { screen.textContent = entry.padEnd(code.length, '_'); };
  const keys = $('#kpKeys');
  keys.innerHTML = '';
  for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK']) {
    const b = document.createElement('button');
    b.textContent = k === 'C' ? '清除' : k === 'OK' ? '確認' : k;
    b.dataset.k = k.toLowerCase();
    b.addEventListener('click', () => {
      if (k === 'C') entry = '';
      else if (k === 'OK') {
        if (entry === code) { sound.sfx('ok'); closeModal(); ok(); return; }
        sound.sfx('error');
        screen.classList.remove('err'); void screen.offsetWidth; screen.classList.add('err');
        entry = '';
      } else if (entry.length < code.length) { entry += k; sound.sfx('beep'); }
      show();
    });
    keys.append(b);
  }
  show();
  openModal('keypad');
}

function openDials(cfg) {
  const vals = (S.flags.dials || [0, 0, 0]).slice();
  const cols = $('#dialCols');
  cols.innerHTML = '';
  vals.forEach((v, i) => {
    const col = document.createElement('div');
    col.className = 'dial';
    col.style.setProperty('--c', cfg.colors[i]);
    const up = document.createElement('button'); up.className = 'up'; up.dataset.i = i; up.textContent = '▲'; up.setAttribute('aria-label', `${cfg.names[i]}色 增加`);
    const val = document.createElement('output'); val.textContent = v;
    const dn = document.createElement('button'); dn.className = 'down'; dn.dataset.i = i; dn.textContent = '▼'; dn.setAttribute('aria-label', `${cfg.names[i]}色 減少`);
    const name = document.createElement('span'); name.textContent = cfg.names[i];
    const set = (d) => { vals[i] = (vals[i] + d + 10) % 10; val.textContent = vals[i]; S.flags.dials = vals.slice(); sound.sfx('click'); };
    up.addEventListener('click', () => set(1));
    dn.addEventListener('click', () => set(-1));
    col.append(name, up, val, dn);
    cols.append(col);
  });
  $('#dialsOk').onclick = () => {
    closeModal();
    if (vals.every((v, i) => v === cfg.answer[i])) cfg.onRight(); else cfg.onWrong();
    save();
  };
  openModal('dials');
}

// ---------- title / ending ----------
function startGame(state) {
  sound.init();
  S = state;
  ended = false;
  selected = null;
  playing = true;
  fade = 1;
  $('#title').hidden = true;
  $('#ending').hidden = true;
  $('#hud').hidden = false;
  sound.level = null;
  sound.setLevel(SCENES[S.scene].level);
  renderInv();
  updateHud();
  if (!store.get(CP_KEY)) store.set(CP_KEY, S);
  SCENES[S.scene].enter?.(g, { first: !S.seen[S.scene] });
  S.seen[S.scene] = true;
  save();
}

const ENDINGS = {
  escape: {
    title: '— 逃脫結局 —',
    lines: [
      '你推開那扇門。',
      '……風。真正的、冷冷的風。',
      '你站在一條陌生的街上，天快要亮了。路燈還亮著——發出熟悉的嗡嗡聲。',
      '口袋裡多了一張你不記得寫過的紙條：',
      '「記錄 0120：已歸檔。下一位，請小心。」',
    ],
  },
  lost: {
    title: '— 迷失結局 —',
    lines: [
      '嗡嗡聲越來越大，',
      '大到你分不清那是燈管，還是你自己的聲音。',
      '你靠著牆坐了下來。',
      '其實這裡……也沒那麼糟，對吧？',
    ],
  },
};

function showEnding(kind) {
  const E = ENDINGS[kind];
  const el = $('#ending');
  el.dataset.kind = kind;
  $('#endTitle').textContent = E.title;
  const box = $('#endLines');
  box.innerHTML = '';
  E.lines.forEach((t, i) => {
    const p = document.createElement('p');
    p.textContent = t;
    p.style.animationDelay = `${0.4 + i * 1.3}s`;
    box.append(p);
  });
  const found = S.notes.length, total = Object.keys(NOTES).length;
  $('#endStats').textContent = `走了 ${S.moves} 步・找到 ${found} / ${total} 張紙條`;
  $('#btnRetry').hidden = kind !== 'lost' || !valid(store.get(CP_KEY));
  el.hidden = false;
  playing = false;
  $('#hud').hidden = true;
}
$('#btnRetry').addEventListener('click', () => {
  const cp = store.get(CP_KEY);
  if (valid(cp)) startGame({ ...cp, sanity: Math.max(cp.sanity, 60) });
});
$('#btnAgain').addEventListener('click', () => { store.del(SAVE_KEY); store.del(CP_KEY); startGame(fresh()); });
$('#btnNew').addEventListener('click', () => { store.del(SAVE_KEY); store.del(CP_KEY); startGame(fresh()); });
$('#btnCont').addEventListener('click', () => { const s = store.get(SAVE_KEY); if (valid(s)) startGame(s); });
$('#btnCont').hidden = !valid(store.get(SAVE_KEY));

// ---------- render loop ----------
let last = performance.now();
function frame(now) {
  const t = now / 1000;
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const sc = SCENES[S.scene];
  if (playing) S.clock += dt;

  if (playing && sc.dark && !S.light && !modal && scareT <= 0 && !ended) {
    darkT += dt;
    if (darkT > 1.8) g.scare(sc.darkBack);
  } else if (!sc.dark || S.light) darkT = 0;

  const stress = 1 - S.sanity / 100;
  ctx.save();
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  if (stress > 0.6) ctx.translate(Math.sin(t * 2.1) * (stress - 0.6) * 10, Math.cos(t * 1.7) * (stress - 0.6) * 6);
  drawRoom(ctx, sc.room, t);
  sc.draw?.(ctx, t, S, sc.room);
  if (sc.dark) {
    drawDark(ctx, mouse.x, mouse.y, S.light, t);
    if (!S.light) drawSceneSmiler(ctx, sc, Math.min(1, darkT / 1.8) * 0.85, t);
  }
  ctx.restore();

  if (playing && !modal) {
    if (visible().some((h) => h.id === 'back')) {
      ctx.save();
      ctx.globalAlpha = hover?.id === 'back' ? 0.85 : 0.3;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(462, 500); ctx.lineTo(480, 514); ctx.lineTo(498, 500); ctx.stroke();
      ctx.restore();
    }
  }

  postFX(ctx, t, { stress, clock: S.clock, rec: playing });

  if (fade > 0) {
    ctx.fillStyle = `rgba(0,0,0,${fade})`;
    ctx.fillRect(0, 0, W, H);
    fade = Math.max(0, fade - dt * 3.5);
  }
  if (scareT > 0) {
    const k = scareT;
    ctx.fillStyle = `rgba(0,0,0,${Math.min(1, k * 1.5)})`;
    ctx.fillRect(0, 0, W, H);
    const shake = 14 * k;
    drawSmiler(ctx, W / 2 + (Math.random() - 0.5) * shake, H / 2 + (Math.random() - 0.5) * shake, 5 + (1.1 - k) * 4, Math.min(1, k * 2), t);
    if (k > 0.9) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(0, 0, W, H); }
    scareT -= dt;
    if (scareT <= 0 && !ended) {
      const back = scareBack; scareBack = null;
      if (S.sanity > 0) g.go(back, { free: true, msg: '黑暗裡有東西在笑。你連滾帶爬地逃了回來。' });
    }
  }
  requestAnimationFrame(frame);
}
updateHud();
renderInv();
$('#hud').hidden = true;
requestAnimationFrame(frame);

// Small hook for automated tests and debugging.
window.__rooms = {
  g,
  get state() { return S; },
  get modal() { return modal; },
  get ended() { return ended; },
  hotspots: () => visible().map((h) => ({ id: h.id, rect: h.rect, label: h.label })),
};
