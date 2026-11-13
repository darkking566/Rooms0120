// All sound is synthesised with WebAudio: ambience per level plus short effects. No audio files.

export class Sound {
  constructor() {
    this.ac = null;
    this.muted = false;
    this.level = null;
    this.bus = null;
    this.sources = [];
    this.timers = [];
  }

  init() {
    if (this.ac) { this.ac.resume?.(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this.ac = new AC(); } catch { return; }
    this.master = this.ac.createGain();
    this.master.gain.value = this.muted ? 0 : 0.7;
    this.master.connect(this.ac.destination);
    const len = this.ac.sampleRate * 2;
    this.white = this.ac.createBuffer(1, len, this.ac.sampleRate);
    this.brown = this.ac.createBuffer(1, len, this.ac.sampleRate);
    const w = this.white.getChannelData(0), b = this.brown.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      w[i] = Math.random() * 2 - 1;
      last = (last + 0.02 * w[i]) / 1.02;
      b[i] = last * 3.5;
    }
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.7;
  }

  node(type, opts = {}) {
    const n = this.ac[`create${type}`]();
    for (const [k, v] of Object.entries(opts)) {
      if (n[k] instanceof AudioParam) n[k].value = v; else n[k] = v;
    }
    return n;
  }

  noise(buf = this.white, loop = false) {
    const s = this.ac.createBufferSource();
    s.buffer = buf; s.loop = loop;
    return s;
  }

  chain(...nodes) {
    for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]);
    return nodes[0];
  }

  setLevel(lv) {
    if (!this.ac || this.level === lv) return;
    this.level = lv;
    const now = this.ac.currentTime;
    if (this.bus) {
      const old = this.bus, oldSrc = this.sources;
      old.gain.setTargetAtTime(0, now, 0.4);
      setTimeout(() => { oldSrc.forEach((s) => { try { s.stop(); } catch { /* already stopped */ } }); old.disconnect(); }, 2000);
    }
    this.timers.forEach(clearInterval);
    this.timers = [];
    this.sources = [];
    this.bus = this.node('Gain', { gain: 0 });
    this.bus.connect(this.master);
    this.bus.gain.setTargetAtTime(1, now, 0.6);
    const add = (src, ...rest) => { this.chain(src, ...rest, this.bus); src.start(); this.sources.push(src); };

    if (lv === '0.1') {
      add(this.node('Oscillator', { type: 'sine', frequency: 84 }), this.node('Gain', { gain: 0.04 }));
      add(this.noise(this.white, true), this.node('BiquadFilter', { type: 'bandpass', frequency: 1100, Q: 1.8 }), this.node('Gain', { gain: 0.025 }));
    } else if (lv === '0.3') {
      add(this.noise(this.white, true), this.node('BiquadFilter', { type: 'lowpass', frequency: 650 }), this.node('Gain', { gain: 0.12 }));
      add(this.node('Oscillator', { type: 'sine', frequency: 160 }), this.node('Gain', { gain: 0.012 }));
    } else if (lv === '0.5') {
      add(this.noise(this.brown, true), this.node('BiquadFilter', { type: 'lowpass', frequency: 220 }), this.node('Gain', { gain: 0.16 }));
      this.timers.push(setInterval(() => this.drip(), 900));
    } else if (lv === 0 || lv === 0.2 || lv === '0.7') {
      add(this.node('Oscillator', { type: 'sawtooth', frequency: 118 }), this.node('BiquadFilter', { type: 'lowpass', frequency: 260 }), this.node('Gain', { gain: 0.05 }));
      add(this.node('Oscillator', { type: 'sine', frequency: 59 }), this.node('Gain', { gain: 0.05 }));
      add(this.noise(this.white, true), this.node('BiquadFilter', { type: 'bandpass', frequency: 3200, Q: 0.7 }), this.node('Gain', { gain: 0.006 }));
    } else if (lv === 1) {
      add(this.noise(this.brown, true), this.node('BiquadFilter', { type: 'lowpass', frequency: 300 }), this.node('Gain', { gain: 0.12 }));
      add(this.node('Oscillator', { type: 'sine', frequency: 50 }), this.node('Gain', { gain: 0.02 }));
      this.timers.push(setInterval(() => { if (Math.random() < 0.5) this.drip(); }, 1400));
      add(this.node('Oscillator', { type: 'sawtooth', frequency: 37 }), this.node('BiquadFilter', { type: 'lowpass', frequency: 90 }), this.node('Gain', { gain: 0.05 }));
      // something heavy, far away, every now and then
      this.timers.push(setInterval(() => { if (Math.random() < 0.22) this.bang(); }, 4200));
    } else {
      add(this.noise(this.brown, true), this.node('BiquadFilter', { type: 'lowpass', frequency: 150 }), this.node('Gain', { gain: 0.25 }));
      add(this.noise(this.white, true), this.node('BiquadFilter', { type: 'highpass', frequency: 4000 }), this.node('Gain', { gain: 0.008 }));
      add(this.node('Oscillator', { type: 'sine', frequency: 42 }), this.node('Gain', { gain: 0.06 }));
      this.timers.push(setInterval(() => { if (Math.random() < 0.3) this.groan(); }, 2500));
    }
  }

  // How loud the level's ambience is in this scene (1 = normal).
  setQuiet(k) {
    this.quiet = k;
    if (this.ac && this.bus && !this.humDir) this.bus.gain.setTargetAtTime(k, this.ac.currentTime, 0.4);
  }

  // A single humming light somewhere in the dark, panned to where it is (null = none).
  setHum(dir) {
    if (!this.ac || this.humDir === dir) return;
    this.humDir = dir;
    if (this.hum) { const h = this.hum; h.g.gain.setTargetAtTime(0, this.ac.currentTime, 0.15); setTimeout(() => { try { h.o.stop(); } catch { /* stopped */ } }, 800); this.hum = null; }
    if (this.bus) this.bus.gain.setTargetAtTime(dir ? 0.08 : this.quiet ?? 1, this.ac.currentTime, 0.3);
    if (!dir) return;
    const o = this.node('Oscillator', { type: 'sawtooth', frequency: 121 });
    const g = this.node('Gain', { gain: 0 });
    const pan = this.ac.createStereoPanner ? this.node('StereoPanner', { pan: dir === 'left' ? -0.95 : dir === 'right' ? 0.95 : 0 }) : this.node('Gain');
    this.chain(o, this.node('BiquadFilter', { type: 'lowpass', frequency: dir === 'ahead' ? 700 : 420 }), g, pan, this.master);
    o.start();
    g.gain.setTargetAtTime(0.09, this.ac.currentTime, 0.4);
    this.hum = { o, g };
  }

  env(peak, dur, attack = 0.005) {
    const g = this.node('Gain', { gain: 0 });
    const t = this.ac.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(this.master);
    return g;
  }

  tone(type, f0, f1, dur, peak) {
    const o = this.node('Oscillator', { type, frequency: f0 });
    o.frequency.exponentialRampToValueAtTime(f1, this.ac.currentTime + dur);
    o.connect(this.env(peak, dur));
    o.start(); o.stop(this.ac.currentTime + dur + 0.05);
  }

  burst(dur, peak, filter, freq, buf = this.white) {
    const s = this.noise(buf);
    const f = this.node('BiquadFilter', { type: filter, frequency: freq });
    this.chain(s, f, this.env(peak, dur));
    s.start(); s.stop(this.ac.currentTime + dur + 0.05);
  }

  bang() {
    if (!this.ac) return;
    this.tone('sine', 55 + Math.random() * 20, 30, 1.4, 0.12);
    this.burst(0.6, 0.06, 'lowpass', 180, this.brown);
  }
  drip() { if (this.ac) this.tone('sine', 1400 + Math.random() * 500, 500, 0.18, 0.05); }
  groan() { if (this.ac) this.tone('sawtooth', 70 + Math.random() * 30, 45, 1.6, 0.03); }

  sfx(name) {
    if (!this.ac) return;
    switch (name) {
      case 'step': this.burst(0.12, 0.18, 'bandpass', 250 + Math.random() * 200); break;
      case 'pick': this.tone('sine', 520, 900, 0.14, 0.12); break;
      case 'drink': for (let i = 0; i < 4; i++) setTimeout(() => this.tone('sine', 300 + Math.random() * 250, 200, 0.1, 0.08), i * 110); break;
      case 'screw': for (let i = 0; i < 4; i++) setTimeout(() => this.burst(0.05, 0.25, 'highpass', 3000), i * 160); break;
      case 'beep': this.tone('square', 880, 880, 0.08, 0.05); break;
      case 'error': this.tone('square', 190, 150, 0.35, 0.07); break;
      case 'ok': this.tone('square', 660, 1320, 0.25, 0.06); break;
      case 'click': this.burst(0.03, 0.2, 'highpass', 2000); break;
      case 'open': this.burst(0.8, 0.35, 'lowpass', 400, this.brown); this.tone('sine', 90, 50, 0.4, 0.3); break;
      case 'steam': this.burst(1.3, 0.3, 'highpass', 1500); break;
      case 'knock': for (let i = 0; i < 3; i++) setTimeout(() => { this.tone('sine', 120, 60, 0.12, 0.35); this.burst(0.08, 0.2, 'lowpass', 400, this.brown); }, i * 260); break;
      case 'static': this.burst(1.4, 0.12, 'bandpass', 2400); this.tone('square', 600, 580, 0.6, 0.015); break;
      case 'eat': for (let i = 0; i < 3; i++) setTimeout(() => this.burst(0.07, 0.15, 'bandpass', 900 + Math.random() * 600), i * 140); break;
      case 'surge': this.tone('sawtooth', 118, 124, 2.2, 0.22); this.burst(2, 0.06, 'highpass', 5000); break;
      case 'whirr': this.tone('square', 1200, 1700, 0.18, 0.025); this.burst(0.35, 0.08, 'bandpass', 2600); break;
      case 'thud': this.tone('sine', 110, 40, 0.35, 0.45); this.burst(0.15, 0.25, 'lowpass', 300, this.brown); break;
      case 'groan': this.groan(); break;
      case 'page': this.burst(0.2, 0.12, 'bandpass', 1800); break;
      case 'sting':
        for (const f of [233, 247, 370, 523]) this.tone('sawtooth', f, f * 0.94, 1.5, 0.09);
        this.burst(1.2, 0.4, 'bandpass', 900);
        this.tone('sine', 70, 35, 0.8, 0.5);
        break;
      default: break;
    }
  }
}
