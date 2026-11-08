// Game loop, state, input and UI glue.
import { W, H, drawRoom, postFX, drawDark, drawSmiler, drawViewfinder, clamp } from './render.js';
import { SCENES, LEVELS, smilerRect, drawSmilers } from './scenes.js';
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
  v: 1, scene: 'l0_start', inv: [], flags: {}, sanity: 100, notes: [], light: false, view: false,
  loops: 0, maze: 0, bo: null, seen: {}, moves: 0, clock: 0, flicker: null,
});

let S = fresh();
let playing = false;
let selected = null;
let hover = null;
let mouse = { x: W / 2, y: H / 2 };
let fade = 0, scareT = 0, scareBack = null, scareMsg = null;
// per-visit smiler state: time spent with a light on, eye-contact progress, time spent looking away
let lightT = 0, stare = 0, panicT = 0;
// seconds spent in the current scene, and the shake left over from a hum surge
let sceneT = 0, surgeT = 0;
let docAfter = null;
let scareKind = 'smiler';
let modal = null;
let msgTimer = null;
let ended = false;
// while moving between scenes, messages are collected and shown together
let collecting = null;

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
    lightT = 0; stare = 0; panicT = 0; sceneT = 0;
    hover = null;
    if (sc.safe && S.flicker) {
      S.flicker = null;
      msg = '你躲進門後，屏住呼吸。門外傳來某種東西拖行的聲音……過了很久，燈才亮回來。';
    }
    sound.setLevel(sc.level);
    sound.setHum(sc.hum?.(S) ?? null);
    const first = !S.seen[id];
    S.seen[id] = true;
    collecting = [];
    try {
      if (msg) g.say(msg);
      sc.enter?.(g, { first });
      if (!free) g.sanity(-LEVELS[sc.level].drain);
      // Level 0: the hum sometimes surges without warning
      if (sc.level === 0 && !free && !sc.trap && !sc.hum && S.moves > 4 && Math.random() < 0.07) {
        sound.sfx('surge'); surgeT = 1.6; g.sanity(-2);
        g.say('嗡嗡聲忽然暴漲，像有人把音量轉到最大。你摀住耳朵，直到它慢慢退下去。');
      }
      if (sc.level !== prevLevel) store.set(CP_KEY, S);
      if (S.sanity > 0 && S.sanity < 35 && !msg && Math.random() < 0.4) g.say(WHISPERS[Math.floor(Math.random() * WHISPERS.length)]);
    } finally {
      const msgs = collecting;
      collecting = null;
      if (msgs.length) g.say(msgs.join('\n'));
    }
    updateHud();
    save();
  },
  say(text) {
    if (collecting) { collecting.push(text); return; }
    const el = $('#msg');
    el.textContent = text;
    el.hidden = false;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => { el.hidden = true; }, 2600 + text.length * 70);
  },
  give(id, msg) { S.inv.push(id); sound.sfx('pick'); renderInv(); updateHud(); if (msg) g.say(msg); },
  take(id) {
    const i = S.inv.indexOf(id);
    if (i >= 0) S.inv.splice(i, 1);
    if (selected === id && !S.inv.includes(id)) selected = null;
    if (!S.inv.includes('camcorder')) S.view = false;
    renderInv();
    updateHud();
  },
  has: (id) => S.inv.includes(id),
  flag(k, v = true) { S.flags[k] = v; },
  read(id, after = null) {
    if (!S.notes.includes(id)) S.notes.push(id);
    docAfter = after;
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
  // Raise or lower the camcorder. Through the viewfinder, a scene's drawView layer becomes visible.
  setView(on) {
    if (!g.has('camcorder')) return;
    S.view = on;
    sound.sfx('whirr');
    if (on) {
      const m = SCENES[S.scene].viewMsg;
      g.say((typeof m === 'function' ? m(S) : m) || '觀景窗裡的畫面，和肉眼看到的沒什麼不同。');
    }
    updateHud();
    save();
  },
  keypad(code, ok) { openKeypad(code, ok); },
  dials(cfg) { openDials(cfg); },
  scare(back, msg = '黑暗裡有東西在笑。你連滾帶爬地逃了回來。') {
    if (scareT > 0 || ended) return;
    scareT = 1.1;
    scareBack = back;
    scareMsg = msg;
    sound.sfx('sting');
    g.sanity(-25);
  },
  // Level 1 "Flickering": the lights die a moment later and you have seconds to reach a green EXIT door.
  flickerSoon() {
    if (S.flags.flickered) return;
    S.flags.flickered = true;
    S.flicker = { delay: 1.6, t: 11 };
  },
  end(kind) {
    if (ended) return;
    ended = true;
    closeModal();
    sound.setHum(null);
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
const roomOf = (sc) => (typeof sc.room === 'function' ? sc.room(S) : sc.room);
const isDark = (sc) => (typeof sc.dark === 'function' ? sc.dark(S) : !!sc.dark) || (sc.flickerable && !!S.flicker && S.flicker.delay <= 0);
const smilerOn = (sc) => !!sc.smiler && sc.smiler.present(S);
const staring = (sc) => smilerOn(sc) && sc.smiler.mode === 'stare';
function visible() {
  const sc = SCENES[S.scene];
  const hs = sc.hotspots.filter((h) => !h.when || h.when(S));
  if (staring(sc)) {
    hs.push({ id: 'smiler', rect: smilerRect(sc.smiler), label: '盯著牠的眼睛', cursor: 'look', click: () => g.say('你盯著那對眼睛，不敢眨眼，也不敢呼吸。') });
  }
  return hs;
}
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
  const sc = SCENES[S.scene];
  if (staring(sc) && h.id !== 'smiler') {
    g.scare(sc.smiler.back, '你一慌，轉身就跑——那個笑容瞬間追了上來。');
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
  if ((e.key === 'v' || e.key === 'V') && playing && !modal && !ended && g.has('camcorder')) g.setView(!S.view);
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
  const bv = $('#btnView');
  bv.hidden = !g.has('camcorder');
  bv.textContent = `觀景窗：${S.view ? '開' : '關'}`;
  bv.setAttribute('aria-pressed', S.view ? 'true' : 'false');
}
$('#btnView').addEventListener('click', () => { if (playing && !modal && !ended) g.setView(!S.view); });
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
function closeModal() {
  if (!modal) return;
  $(`#${modal}`).hidden = true;
  const was = modal;
  modal = null;
  if (was === 'doc' && docAfter) { const f = docAfter; docAfter = null; f(); }
}
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
  sceneT = 0; surgeT = 0;
  $('#title').hidden = true;
  $('#ending').hidden = true;
  $('#hud').hidden = false;
  sound.level = null;
  sound.setLevel(SCENES[S.scene].level);
  sound.humDir = undefined;
  sound.setHum(SCENES[S.scene].hum?.(S) ?? null);
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
      '攝影機還在錄。你低頭看螢幕——畫面裡的街道，和你眼前的一模一樣。',
      '口袋裡多了一張紙條。是你自己的筆跡：',
      '「記錄 0120：已歸檔。下一次，請小心一點。—— J.H.」',
      '你這才想起來——J.H.，是你名字的縮寫。',
    ],
  },
  red: {
    title: '— 紅房間結局 —',
    lines: [
      '你往紅光更深的地方走。',
      '轉過一個彎，又一個彎。每一個轉角後面，都是同一間紅色的房間。',
      '攝影機的螢幕早就只剩雜訊。',
      '你開始在牆上刻記號，好記住自己繞了幾圈。',
      '……正、正、正、正、正、正……',
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
  const lines = E.lines.slice();
  if (kind === 'escape' && S.flags.met_jh) lines.splice(lines.length - 1, 0, '你想起馬尼拉房間牆角的那個人。下一次，坐在那裡等的，會不會是你？');
  lines.forEach((t, i) => {
    const p = document.createElement('p');
    p.textContent = t;
    p.style.animationDelay = `${0.4 + i * 1.3}s`;
    box.append(p);
  });
  const found = S.notes.length, total = Object.keys(NOTES).length;
  $('#endStats').textContent = `走了 ${S.moves} 步・找到 ${found} / ${total} 張紙條`;
  $('#btnRetry').hidden = kind === 'escape' || !valid(store.get(CP_KEY));
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

  const active = playing && !modal && scareT <= 0 && !ended;
  if (active && S.flicker) {
    const f = S.flicker;
    if (f.delay > 0) {
      f.delay -= dt;
      if (f.delay <= 0) g.say('燈全熄了。黑暗中傳來濕黏的腳步聲，越來越近——快找亮著綠燈的門！');
    } else if (sc.flickerable) {
      f.t -= dt;
      if (f.t <= 0) {
        S.flicker = null;
        g.scare(S.scene, '有什麼東西在黑暗中撲了上來——你拚命掙脫。燈終於亮回來了，門上留著四道爪痕。');
        scareKind = 'claws';
      }
    }
  }
  if (active) {
    sceneT += dt;
    if (sc.trap && sceneT > sc.trap.after) g.end(sc.trap.end);
  }
  if (active && smilerOn(sc)) {
    const sm = sc.smiler;
    if (S.light) {
      lightT += dt;
      if (lightT > 1.3) g.scare(sm.back, '光把牠引了過來——那個笑容一下子就貼到了你眼前。');
    } else {
      lightT = Math.max(0, lightT - dt);
      if (sm.mode === 'stare') {
        if (inRect(smilerRect(sm), mouse.x, mouse.y)) {
          stare += dt / 2.5;
          panicT = Math.max(0, panicT - dt * 0.5);
          if (stare >= 1) { stare = 0; sm.gone(g); save(); }
        } else {
          panicT += dt;
          if (panicT > 2.5) g.scare(sm.back, '你移開了視線。那個笑容，瞬間就到了你眼前。');
        }
      }
    }
  }

  const stress = 1 - S.sanity / 100;
  ctx.save();
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  if (surgeT > 0) { surgeT = Math.max(0, surgeT - dt); ctx.translate((Math.random() - 0.5) * surgeT * 6, (Math.random() - 0.5) * surgeT * 6); }
  if (stress > 0.6) ctx.translate(Math.sin(t * 2.1) * (stress - 0.6) * 10, Math.cos(t * 1.7) * (stress - 0.6) * 6);
  const R = roomOf(sc);
  const stutter = S.flicker && S.flicker.delay > 0 && sc.flickerable;
  if (stutter) R.bright = Math.random() < 0.5 ? 0.25 : 1;
  drawRoom(ctx, R, t);
  if (stutter || R.bright !== 1) R.bright = 1;
  sc.draw?.(ctx, t, S, R);
  if (isDark(sc)) drawDark(ctx, mouse.x, mouse.y, S.light, t, S.view && sc.nightshot ? 0.55 : 0.97);
  sc.drawOver?.(ctx, t, S, R);
  if (S.view) sc.drawView?.(ctx, t, S, R);
  if (smilerOn(sc)) {
    const approach = Math.max(lightT / 1.3, panicT / 2.5);
    drawSmilers(ctx, sc.smiler, 0.9, t, approach);
    if (sc.smiler.mode === 'stare' && stare > 0 && !S.light) {
      const r = smilerRect(sc.smiler);
      ctx.strokeStyle = 'rgba(240,240,230,0.6)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(r[0] + r[2] / 2, r[1] + r[3] / 2, 46, -Math.PI / 2, -Math.PI / 2 + stare * Math.PI * 2); ctx.stroke();
    }
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

  if (playing && S.view) drawViewfinder(ctx, t, { tape: !!S.flags.tape_in });
  // the REC overlay appears once a tape is in the camcorder (Levels 1+ always have one)
  postFX(ctx, t, { stress, clock: S.clock, rec: playing && (!!S.flags.tape_in || sc.level > 0) });

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
    const sx = W / 2 + (Math.random() - 0.5) * shake, sy = H / 2 + (Math.random() - 0.5) * shake;
    if (scareKind === 'claws') {
      ctx.save();
      ctx.strokeStyle = `rgba(200,30,30,${Math.min(1, k * 2)})`; ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        ctx.lineWidth = 10 - i;
        ctx.beginPath(); ctx.moveTo(sx - 160 + i * 70, sy - 180); ctx.lineTo(sx - 60 + i * 70, sy + 180); ctx.stroke();
      }
      ctx.restore();
    } else {
      drawSmiler(ctx, sx, sy, 5 + (1.1 - k) * 4, Math.min(1, k * 2), t);
    }
    if (k > 0.9) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(0, 0, W, H); }
    scareT -= dt;
    if (scareT <= 0 && !ended) {
      const back = scareBack; scareBack = null; scareKind = 'smiler';
      if (S.sanity > 0) g.go(back, { free: true, msg: scareMsg });
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
