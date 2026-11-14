// The modal dialogs: a note being read, the list of notes found, the keypad and the pressure dials.
// Only one is open at a time. While one is open, the game pauses its hazards and ignores clicks on the scene.
const $ = (s) => document.querySelector(s);

// sound: the Sound instance. onClose: runs after any dialog closes (the game refreshes the HUD and saves).
export function createModals({ sound, onClose }) {
  let current = null;
  let docAfter = null;

  function open(id) {
    close();
    current = id;
    $(`#${id}`).hidden = false;
    $('#tip').hidden = true;
  }
  function close() {
    if (!current) return;
    $(`#${current}`).hidden = true;
    const was = current;
    current = null;
    if (was === 'doc' && docAfter) { const f = docAfter; docAfter = null; f(); }
    onClose();
  }

  for (const id of ['#docClose', '#notesClose', '#kpClose', '#dialsClose']) $(id).addEventListener('click', close);
  for (const m of document.querySelectorAll('.modal')) m.addEventListener('pointerdown', (e) => { if (e.target === m) close(); });

  // A note. `after` runs once the reader closes it.
  function doc(note, after = null) {
    docAfter = after;
    sound.sfx('page');
    $('#docTitle').textContent = note.title;
    $('#docBody').textContent = note.body;
    open('doc');
  }

  // The notes found so far. items: [{ id, title }]; pick(id) runs when one is chosen.
  function notesList(items, pick) {
    const ul = $('#notesList');
    ul.innerHTML = '';
    if (!items.length) { const li = document.createElement('li'); li.textContent = '還沒有撿到任何紙條。'; ul.append(li); }
    for (const { id, title } of items) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.textContent = title;
      b.addEventListener('click', () => { close(); pick(id); });
      li.append(b); ul.append(li);
    }
    open('notes');
  }

  function keypad(code, ok) {
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
          if (entry === code) { sound.sfx('ok'); close(); ok(); return; }
          sound.sfx('error');
          screen.classList.remove('err'); void screen.offsetWidth; screen.classList.add('err');
          entry = '';
        } else if (entry.length < code.length) { entry += k; sound.sfx('beep'); }
        show();
      });
      keys.append(b);
    }
    show();
    open('keypad');
  }

  // Three dials, 0–9 each. start: the values left from last time. change(vals) runs on every turn of a dial,
  // so the setting survives a reload; done() runs after the answer has been checked.
  function dials(cfg, { start, change, done }) {
    const vals = start.slice();
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
      const set = (d) => { vals[i] = (vals[i] + d + 10) % 10; val.textContent = vals[i]; change(vals.slice()); sound.sfx('click'); };
      up.addEventListener('click', () => set(1));
      dn.addEventListener('click', () => set(-1));
      col.append(name, up, val, dn);
      cols.append(col);
    });
    $('#dialsOk').onclick = () => {
      close();
      if (vals.every((v, i) => v === cfg.answer[i])) cfg.onRight(); else cfg.onWrong();
      done();
    };
    open('dials');
  }

  return {
    get current() { return current; },
    open, close, doc, notesList, keypad, dials,
  };
}
